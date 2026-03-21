import { useCallback } from 'react';
import { useUserStore } from '@/store/user.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { useUploadProgressStore } from '@/store/uploadProgress.ts';
import { parseFitFile } from '@/parsers/fit.ts';
import { bulkSaveSessionData, saveFitFile } from '@/lib/indexeddb.ts';
import { detectNewPBs, mergePBs } from '@/lib/records.ts';
import { mapWithConcurrency } from '@/lib/concurrency.ts';
import { toast, useToastStore } from '@/components/ui/toastStore.ts';
import { m } from '@/paraglide/messages.js';
import { findDuplicates } from '@/lib/fingerprint.ts';
import { isArchiveFile, extractActivityFiles } from '@/lib/archive.ts';
import type { TrainingSession, SessionRecord, SessionLap } from '@/packages/engine/types.ts';

interface ParsedFile {
  session: Omit<TrainingSession, 'id' | 'createdAt'>;
  records: SessionRecord[];
  laps: SessionLap[];
  fingerprint: string;
  rawData: ArrayBuffer;
  fileName: string;
}

const CHUNK_SIZE = 10;

export const useFileUpload = (inputRef: React.RefObject<HTMLInputElement | null>) => {
  const profile = useUserStore((s) => s.profile);
  const personalBests = useSessionsStore((s) => s.personalBests);
  const uploading = useUploadProgressStore((s) => s.uploading);

  const triggerUpload = useCallback(() => {
    inputRef.current?.click();
  }, [inputRef]);

  const handleFiles = useCallback(
    async (files: FileList) => {
      if (!profile) return;

      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      const fitEntries: Array<{ name: string; data: ArrayBuffer }> = [];
      let failed = 0;
      let extractingShown = false;

      for (const file of fileArray) {
        const lower = file.name.toLowerCase();
        if (lower.endsWith('.fit')) {
          fitEntries.push({ name: file.name, data: await file.arrayBuffer() });
        } else if (isArchiveFile(file.name)) {
          if (!extractingShown) {
            extractingShown = true;
            useToastStore.getState().upsertProgress({
              label: m.toast_archive_extracting(),
              processed: 0,
              total: 0,
              saving: true,
            });
          }
          try {
            const raw = await file.arrayBuffer();
            const extracted = await extractActivityFiles(raw);
            const fitOnly = extracted.filter((e) => e.extension === '.fit');
            // TODO: handle .tcx files once a TCX parser is added
            if (fitOnly.length === 0) {
              toast(
                m.toast_archive_no_fit_title(),
                m.toast_archive_no_fit_desc({ fileName: file.name }),
                'error',
              );
              failed++;
            } else {
              for (const entry of fitOnly) {
                fitEntries.push({ name: entry.fileName, data: entry.data });
              }
            }
          } catch {
            toast(
              m.toast_archive_extract_failed_title(),
              m.toast_archive_extract_failed_desc({ fileName: file.name }),
              'error',
            );
            failed++;
          }
        } else {
          toast(
            m.toast_invalid_file_title(),
            m.toast_invalid_file_desc({ fileName: file.name }),
            'error',
          );
          failed++;
        }
      }

      if (fitEntries.length === 0) {
        if (failed > 0) {
          toast(m.toast_files_failed_title({ count: failed }), undefined, 'error');
        }
        return;
      }

      useUploadProgressStore.getState().startUpload(fitEntries.length);

      // Phase 1 — Parse all files in parallel (concurrency of 6)
      const settled = await mapWithConcurrency(
        fitEntries,
        6,
        async (entry) => {
          const result = await parseFitFile(entry.data, entry.name, {
            restHr: profile.thresholds.restHr,
            maxHr: profile.thresholds.maxHr,
            gender: profile.gender,
            ftp: profile.thresholds.ftp,
          });
          return { ...result, rawData: entry.data, fileName: entry.name };
        },
        () => useUploadProgressStore.getState().advance(),
      );

      const parsed: ParsedFile[] = [];
      for (const result of settled) {
        if (result.status === 'fulfilled') {
          parsed.push(result.value);
        } else {
          console.error('Parse error:', result.reason);
          toast(m.toast_parse_failed_title(), m.toast_parse_failed_desc(), 'error');
          failed++;
        }
      }

      // Dedup — filter out files already in the store or duplicated within the batch
      const existingSessions = useSessionsStore.getState().sessions;
      const storeDups = findDuplicates(
        parsed.map((p) => p.fingerprint),
        existingSessions,
      );
      const seenInBatch = new Set<string>();
      let duplicated = 0;

      const unique = parsed.filter((p) => {
        if (storeDups.has(p.fingerprint) || seenInBatch.has(p.fingerprint)) {
          duplicated++;
          return false;
        }
        seenInBatch.add(p.fingerprint);
        return true;
      });

      // Phase 2 — Batch commit
      let newPBCount = 0;

      if (unique.length > 0) {
        try {
          const sessionIds = useSessionsStore.getState().addSessions(unique.map((p) => p.session));

          let accumulatedBests = [...personalBests];

          const idbEntries: Array<{
            records: (SessionRecord & { sessionId: string })[];
            laps: (SessionLap & { sessionId: string })[];
          }> = [];

          for (let i = 0; i < unique.length; i++) {
            const entry = unique[i];
            const sessionId = sessionIds[i];

            if (entry.records.length > 0) {
              const recordsWithId = entry.records.map((r) => ({
                ...r,
                sessionId,
              }));

              let lapsWithId: (SessionLap & { sessionId: string })[] = [];
              if (entry.laps.length > 0) {
                lapsWithId = entry.laps.map((l) => ({ ...l, sessionId }));
              }

              idbEntries.push({
                records: recordsWithId,
                laps: lapsWithId,
              });

              const newPBs = detectNewPBs(
                sessionId,
                entry.session.date,
                entry.session.sport,
                entry.records,
                accumulatedBests,
                { distance: entry.session.distance, elevationGain: entry.session.elevationGain },
              );
              if (newPBs.length > 0) {
                accumulatedBests = mergePBs(accumulatedBests, newPBs);
                newPBCount += newPBs.length;
              }
            }
          }

          if (idbEntries.length > 0) {
            await bulkSaveSessionData(idbEntries, {
              chunkSize: CHUNK_SIZE,
            });
          }

          for (let i = 0; i < unique.length; i++) {
            await saveFitFile(sessionIds[i], unique[i].fileName, unique[i].rawData);
          }

          if (accumulatedBests.length > 0) {
            useSessionsStore.getState().updatePersonalBests(accumulatedBests);
          }
        } catch (err) {
          console.error('Save error:', err);
          toast(m.toast_save_failed_title(), m.toast_save_failed_desc(), 'error');
        }
      }

      const uploaded = unique.length;
      const parts: string[] = [];
      if (uploaded > 0) {
        let uploadMsg = m.toast_upload_sessions_plural({ count: uploaded });
        if (uploaded === 1) {
          uploadMsg = m.toast_upload_sessions({ count: uploaded });
        }
        parts.push(uploadMsg);
      }
      if (duplicated > 0) {
        let dupMsg = m.toast_upload_duplicates_plural({ count: duplicated });
        if (duplicated === 1) {
          dupMsg = m.toast_upload_duplicates({ count: duplicated });
        }
        parts.push(dupMsg);
      }
      if (newPBCount > 0) {
        let pbMsg = m.toast_upload_pbs_plural({ count: newPBCount });
        if (newPBCount === 1) {
          pbMsg = m.toast_upload_pbs({ count: newPBCount });
        }
        parts.push(pbMsg);
      }
      if (failed > 0) parts.push(m.toast_upload_failed({ count: failed }));
      if (parts.length > 0) {
        let variant: 'success' | 'error' | 'warning' = 'success';
        if (failed > 0) {
          variant = 'error';
        } else if (uploaded === 0) {
          variant = 'warning';
        }
        useUploadProgressStore.getState().finish(parts.join(', '), variant);
      }

      if (inputRef.current) inputRef.current.value = '';
    },
    [profile, personalBests, inputRef],
  );

  return { uploading, profile, triggerUpload, handleFiles };
};
