import { useCallback } from 'react';
import { useUserStore } from '@/store/user.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { useUploadProgressStore } from '@/store/uploadProgress.ts';
import { parseFitFile } from '@/parsers/fit.ts';
import { bulkSaveSessionData, saveFitFile } from '@/lib/indexeddb.ts';
import { detectNewPBs, mergePBs } from '@/engine/records.ts';
import { mapWithConcurrency } from '@/lib/concurrency.ts';
import { toast } from '@/components/ui/toastStore.ts';
import { m } from '@/paraglide/messages.js';
import { findDuplicates } from '@/engine/fingerprint.ts';
import type { TrainingSession, SessionRecord, SessionLap } from '@/engine/types.ts';

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
  const addSessions = useSessionsStore((s) => s.addSessions);
  const personalBests = useSessionsStore((s) => s.personalBests);
  const updatePersonalBests = useSessionsStore((s) => s.updatePersonalBests);
  const uploading = useUploadProgressStore((s) => s.uploading);
  const startUpload = useUploadProgressStore((s) => s.startUpload);
  const advance = useUploadProgressStore((s) => s.advance);
  const finishProgress = useUploadProgressStore((s) => s.finish);

  const triggerUpload = useCallback(() => {
    inputRef.current?.click();
  }, [inputRef]);

  const handleFiles = useCallback(
    async (files: FileList) => {
      if (!profile) return;

      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      const fitFiles: File[] = [];
      let failed = 0;

      for (const file of fileArray) {
        if (file.name.toLowerCase().endsWith('.fit')) {
          fitFiles.push(file);
        } else {
          toast(
            m.toast_invalid_file_title(),
            m.toast_invalid_file_desc({ fileName: file.name }),
            'error',
          );
          failed++;
        }
      }

      if (fitFiles.length === 0) {
        if (failed > 0) {
          toast(m.toast_files_failed_title({ count: failed }), undefined, 'error');
        }
        return;
      }

      startUpload(fitFiles.length);

      // Phase 1 — Parse all files in parallel (concurrency of 6)
      const settled = await mapWithConcurrency(
        fitFiles,
        6,
        async (file) => {
          const rawData = await file.arrayBuffer();
          const result = await parseFitFile(rawData, file.name, {
            restHr: profile.thresholds.restHr,
            maxHr: profile.thresholds.maxHr,
            gender: profile.gender,
            ftp: profile.thresholds.ftp,
          });
          return { ...result, rawData, fileName: file.name };
        },
        advance,
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
          const sessionIds = addSessions(unique.map((p) => p.session));

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

              const lapsWithId =
                entry.laps.length > 0 ? entry.laps.map((l) => ({ ...l, sessionId })) : [];

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
            updatePersonalBests(accumulatedBests);
          }
        } catch (err) {
          console.error('Save error:', err);
          toast(m.toast_save_failed_title(), m.toast_save_failed_desc(), 'error');
        }
      }

      const uploaded = unique.length;
      const parts: string[] = [];
      if (uploaded > 0)
        parts.push(
          uploaded === 1
            ? m.toast_upload_sessions({ count: uploaded })
            : m.toast_upload_sessions_plural({ count: uploaded }),
        );
      if (duplicated > 0)
        parts.push(
          duplicated === 1
            ? m.toast_upload_duplicates({ count: duplicated })
            : m.toast_upload_duplicates_plural({ count: duplicated }),
        );
      if (newPBCount > 0)
        parts.push(
          newPBCount === 1
            ? m.toast_upload_pbs({ count: newPBCount })
            : m.toast_upload_pbs_plural({ count: newPBCount }),
        );
      if (failed > 0) parts.push(m.toast_upload_failed({ count: failed }));
      if (parts.length > 0) {
        finishProgress(
          parts.join(', '),
          failed > 0 ? 'error' : uploaded === 0 ? 'warning' : 'success',
        );
      }

      if (inputRef.current) inputRef.current.value = '';
    },
    [
      profile,
      addSessions,
      personalBests,
      updatePersonalBests,
      inputRef,
      startUpload,
      advance,
      finishProgress,
    ],
  );

  return { uploading, profile, triggerUpload, handleFiles };
};
