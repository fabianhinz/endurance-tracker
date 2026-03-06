import { useState, useCallback } from 'react';
import { useUserStore } from '@/store/user.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import {
  getAllFitFiles,
  deleteSessionRecords,
  deleteSessionLaps,
  deleteSessionGPS,
  saveSessionRecords,
  saveSessionLaps,
} from '@/lib/indexeddb.ts';
import { parseFitFile } from '@/parsers/fit.ts';
import { computePBsForSessions } from '@/engine/records.ts';
import { toast } from '@/components/ui/toastStore.ts';
import { m } from '@/paraglide/messages.js';
import { useCoachPlanStore } from '@/store/coachPlan.ts';

interface ReimportState {
  reimporting: boolean;
  processed: number;
  total: number;
}

export const useReimport = () => {
  const [state, setState] = useState<ReimportState>({
    reimporting: false,
    processed: 0,
    total: 0,
  });

  const reimportAll = useCallback(async () => {
    const profile = useUserStore.getState().profile;
    if (!profile) {
      toast(m.toast_reimport_no_profile_title(), m.toast_reimport_no_profile_desc(), 'error');
      return;
    }

    setState({ reimporting: true, processed: 0, total: 0 });

    const fitFiles = await getAllFitFiles();
    if (fitFiles.length === 0) {
      toast(m.toast_reimport_no_files_title(), m.toast_reimport_no_files_desc(), 'warning');
      setState({ reimporting: false, processed: 0, total: 0 });
      return;
    }

    setState((prev) => ({ ...prev, total: fitFiles.length }));

    const updates: Array<{
      id: string;
      session: Omit<import('../../../engine/types.ts').TrainingSession, 'id' | 'createdAt'>;
    }> = [];
    const pbSessions: Array<{
      sessionId: string;
      date: number;
      sport: import('../../../engine/types.ts').Sport;
      records: import('../../../engine/types.ts').SessionRecord[];
      distance?: number;
      elevationGain?: number;
    }> = [];
    let failed = 0;

    for (const fitFile of fitFiles) {
      try {
        const result = await parseFitFile(fitFile.data, fitFile.fileName, {
          restHr: profile.thresholds.restHr,
          maxHr: profile.thresholds.maxHr,
          gender: profile.gender,
          ftp: profile.thresholds.ftp,
        });

        // Delete old IDB data for this session
        await deleteSessionRecords(fitFile.sessionId);
        await deleteSessionLaps(fitFile.sessionId);
        await deleteSessionGPS(fitFile.sessionId);

        // Save new records and laps with the original sessionId
        const recordsWithId = result.records.map((r) => ({
          ...r,
          sessionId: fitFile.sessionId,
        }));
        const lapsWithId = result.laps.map((l) => ({
          ...l,
          sessionId: fitFile.sessionId,
        }));

        await saveSessionRecords(recordsWithId);
        await saveSessionLaps(lapsWithId);

        updates.push({ id: fitFile.sessionId, session: result.session });

        if (result.records.length > 0) {
          pbSessions.push({
            sessionId: fitFile.sessionId,
            date: result.session.date,
            sport: result.session.sport,
            records: result.records,
            distance: result.session.distance,
            elevationGain: result.session.elevationGain,
          });
        }
      } catch (err) {
        console.error(`Reimport failed for ${fitFile.fileName}:`, err);
        failed++;
      }

      setState((prev) => ({ ...prev, processed: prev.processed + 1 }));
    }

    if (updates.length > 0) {
      useSessionsStore.getState().replaceSessions(updates);
      useCoachPlanStore.getState().clearPlan();
    }

    // Recompute PBs from scratch across all sessions
    const freshPBs = computePBsForSessions(pbSessions);
    useSessionsStore.setState({ personalBests: freshPBs });

    setState({ reimporting: false, processed: 0, total: 0 });

    const parts: string[] = [];
    if (updates.length > 0) {
      parts.push(
        updates.length === 1
          ? m.toast_reimport_sessions({ count: updates.length })
          : m.toast_reimport_sessions_plural({ count: updates.length }),
      );
    }
    if (failed > 0) {
      parts.push(m.toast_reimport_failed({ count: failed }));
    }
    toast(m.toast_reimport_complete_title(), parts.join(', '), failed > 0 ? 'error' : 'success');
  }, []);

  return {
    reimporting: state.reimporting,
    processed: state.processed,
    total: state.total,
    reimportAll,
  };
};
