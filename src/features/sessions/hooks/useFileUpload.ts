import { useCallback } from 'react';
import { useUserStore } from '@/store/user.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { useUploadProgressStore } from '@/store/uploadProgress.ts';
import { parseFitFile, type ParsedFitResultWithMeta } from '@/parsers/fit.ts';
import { bulkSaveSessionData, saveFitFile } from '@/lib/indexeddb.ts';
import { toast } from '@/components/ui/toastStore.ts';
import { m } from '@/paraglide/messages.js';
import { findDuplicates } from '@/lib/fingerprint.ts';
import { isArchiveFile, extractActivityFiles } from '@/lib/archive.ts';
import type { SessionRecord, SessionLap } from '@/packages/engine/types.ts';
import { useFiltersStore } from '@/store/filters.ts';

const CHUNK_SIZE = 10;

export const useFileUpload = (inputRef: React.RefObject<HTMLInputElement | null>) => {
  const profile = useUserStore((s) => s.profile);
  const uploading = useUploadProgressStore((s) => s.uploading);

  const triggerUpload = useCallback(() => {
    inputRef.current?.click();
  }, [inputRef]);

  const handleFiles = useCallback(
    async (files: FileList) => {
      if (!profile) return;

      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      useUploadProgressStore.getState().beginProcessing();

      const fitEntries: Array<{ name: string; data: ArrayBuffer }> = [];
      let failed = 0;

      for (const file of fileArray) {
        const lower = file.name.toLowerCase();
        if (lower.endsWith('.fit')) {
          fitEntries.push({ name: file.name, data: await file.arrayBuffer() });
        } else if (isArchiveFile(file.name)) {
          try {
            const raw = await file.arrayBuffer();
            const extracted = await extractActivityFiles(raw);
            const fitOnly = extracted.filter((e) => e.extension === '.fit');
            // TODO: handle .tcx files once a TCX parser is added
            if (fitOnly.length === 0) {
              failed++;
            } else {
              for (const entry of fitOnly) {
                fitEntries.push({ name: entry.fileName, data: entry.data });
              }
            }
          } catch {
            failed++;
          }
        } else {
          failed++;
        }
      }

      if (fitEntries.length === 0) {
        useUploadProgressStore.getState().cancel();
        if (failed > 0) {
          toast(m.toast_files_failed_title({ count: failed }), undefined, 'error');
        }
        return;
      }

      useUploadProgressStore.getState().startUpload(fitEntries.length);

      const parsingTasks: Promise<ParsedFitResultWithMeta | null>[] = [];
      for (const entry of fitEntries) {
        parsingTasks.push(
          parseFitFile(entry.data, entry.name, {
            restHr: profile.thresholds.restHr,
            maxHr: profile.thresholds.maxHr,
            gender: profile.gender,
            ftp: profile.thresholds.ftp,
          })
            .then((result) => {
              return { ...result, rawData: entry.data, fileName: entry.name };
            })
            .catch((error) => {
              console.error('Parse error: ', error);
              failed++;
              return null;
            })
            .finally(() => {
              useUploadProgressStore.getState().advance();
            }),
        );
      }

      const parsed: ParsedFitResultWithMeta[] = [];
      for (const task of await Promise.allSettled(parsingTasks)) {
        if (task.status === 'fulfilled' && task.value) {
          parsed.push(task.value);
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

      if (unique.length > 0) {
        try {
          const sessionIds = useSessionsStore.getState().addSessions(unique.map((p) => p.session));

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

      if (failed > 0) {
        parts.push(m.toast_upload_failed({ count: failed }));
      }

      if (parts.length > 0) {
        let variant: 'success' | 'error' | 'warning' = 'success';
        if (failed > 0) {
          variant = 'error';
        } else if (uploaded === 0) {
          variant = 'warning';
        }
        useUploadProgressStore.getState().finish(parts.join(', '), variant);
        useFiltersStore.getState().recomputePBs();
      }

      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [profile, inputRef],
  );

  return { uploading, profile, triggerUpload, handleFiles };
};
