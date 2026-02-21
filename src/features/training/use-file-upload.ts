import { useCallback } from "react";
import { useUserStore } from "../../store/user.ts";
import { useSessionsStore } from "../../store/sessions.ts";
import { useUploadProgressStore } from "../../store/upload-progress.ts";
import { parseFitFile } from "../../parsers/fit.ts";
import { bulkSaveSessionData } from "../../lib/indexeddb.ts";
import { detectNewPBs, mergePBs } from "../../engine/records.ts";
import { buildSessionGPS } from "../../engine/gps.ts";
import { mapWithConcurrency } from "../../lib/concurrency.ts";
import { toast } from "../../components/ui/toast-store.ts";
import type { TrainingSession, SessionRecord, SessionLap } from "../../types/index.ts";

interface ParsedFile {
  session: Omit<TrainingSession, "id" | "createdAt">;
  records: SessionRecord[];
  laps: SessionLap[];
}

const CHUNK_SIZE = 10;

export const useFileUpload = (
  inputRef: React.RefObject<HTMLInputElement | null>,
) => {
  const profile = useUserStore((s) => s.profile);
  const addSessions = useSessionsStore((s) => s.addSessions);
  const personalBests = useSessionsStore((s) => s.personalBests);
  const updatePersonalBests = useSessionsStore((s) => s.updatePersonalBests);
  const uploading = useUploadProgressStore((s) => s.uploading);
  const startUpload = useUploadProgressStore((s) => s.startUpload);
  const adjustTotal = useUploadProgressStore((s) => s.adjustTotal);
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
        if (file.name.toLowerCase().endsWith(".fit")) {
          fitFiles.push(file);
        } else {
          toast("Invalid file", `${file.name} is not a .FIT file`, "error");
          failed++;
        }
      }

      if (fitFiles.length === 0) {
        if (failed > 0) {
          toast(`${failed} failed`, undefined, "error");
        }
        return;
      }

      startUpload(fitFiles.length);

      // Phase 1 — Parse all files in parallel (concurrency of 6)
      const settled = await mapWithConcurrency(
        fitFiles,
        6,
        async (file) =>
          parseFitFile(file, {
            restHr: profile.thresholds.restHr,
            maxHr: profile.thresholds.maxHr,
            gender: profile.gender,
            ftp: profile.thresholds.ftp,
          }),
        advance,
      );

      const parsed: ParsedFile[] = [];
      for (const result of settled) {
        if (result.status === "fulfilled") {
          parsed.push(result.value);
        } else {
          console.error("Parse error:", result.reason);
          toast("Parse failed", "Could not parse FIT file", "error");
          failed++;
        }
      }

      // Phase 2 — Batch commit
      let newPBCount = 0;

      if (parsed.length > 0) {
        try {
          const sessionIds = addSessions(parsed.map((p) => p.session));

          let accumulatedBests = [...personalBests];

          const idbEntries: Array<{
            records: (SessionRecord & { sessionId: string })[];
            laps: (SessionLap & { sessionId: string })[];
            gps: import("../../types/gps.ts").SessionGPS | null;
          }> = [];

          for (let i = 0; i < parsed.length; i++) {
            const entry = parsed[i];
            const sessionId = sessionIds[i];

            if (entry.records.length > 0) {
              const recordsWithId = entry.records.map((r) => ({
                ...r,
                sessionId,
              }));

              const gpsData = buildSessionGPS(sessionId, recordsWithId);

              const lapsWithId =
                entry.laps.length > 0
                  ? entry.laps.map((l) => ({ ...l, sessionId }))
                  : [];

              idbEntries.push({
                records: recordsWithId,
                laps: lapsWithId,
                gps: gpsData,
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
            const chunkCount = Math.ceil(idbEntries.length / CHUNK_SIZE);
            adjustTotal(fitFiles.length + chunkCount);

            await bulkSaveSessionData(idbEntries, {
              chunkSize: CHUNK_SIZE,
              onChunkDone: () => advance(),
            });
          }

          if (accumulatedBests.length > 0) {
            updatePersonalBests(accumulatedBests);
          }
        } catch (err) {
          console.error("Save error:", err);
          toast("Save failed", "Could not save sessions to database", "error");
        }
      }

      const uploaded = parsed.length;
      const parts: string[] = [];
      if (uploaded > 0)
        parts.push(
          `${uploaded} session${uploaded !== 1 ? "s" : ""} uploaded`,
        );
      if (newPBCount > 0)
        parts.push(`${newPBCount} new PB${newPBCount !== 1 ? "s" : ""}`);
      if (failed > 0) parts.push(`${failed} failed`);
      if (parts.length > 0) {
        finishProgress(
          parts.join(", "),
          failed > 0 ? "error" : "success",
        );
      }

      if (inputRef.current) inputRef.current.value = "";
    },
    [profile, addSessions, personalBests, updatePersonalBests, inputRef, startUpload, adjustTotal, advance, finishProgress],
  );

  return { uploading, profile, triggerUpload, handleFiles };
};
