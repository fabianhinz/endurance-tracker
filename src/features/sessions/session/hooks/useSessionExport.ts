import { useState } from 'react';
import { m } from '@/paraglide/messages.js';
import { toast } from '@/components/ui/toastStore.ts';
import { getSessionRecords } from '@/lib/indexeddb.ts';
import { buildSessionGpx, buildGpxFilename } from '@/lib/gpxExport.ts';
import type { TrainingSession } from '@/packages/engine/types.ts';

let cachedCanShare: boolean | null = null;
const canShareFiles = (): boolean => {
  if (cachedCanShare !== null) return cachedCanShare;
  if (typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') {
    cachedCanShare = false;
    return false;
  }
  const testFile = new File([''], 'test.gpx', { type: 'application/gpx+xml' });
  cachedCanShare = navigator.canShare({ files: [testFile] });
  return cachedCanShare;
};

const downloadFile = (file: File) => {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const useSessionExport = (session: TrainingSession) => {
  const [exporting, setExporting] = useState(false);

  const exportGpx = async () => {
    setExporting(true);
    try {
      const records = await getSessionRecords(session.id);
      const gpxString = buildSessionGpx(session, records);

      if (gpxString === null) {
        toast(m.toast_export_no_gps(), undefined, 'error');
        return;
      }

      const filename = buildGpxFilename(session.sport, session.date);
      const file = new File([gpxString], filename, { type: 'application/gpx+xml' });

      if (canShareFiles()) {
        try {
          await navigator.share({ files: [file] });
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') return;
          downloadFile(file);
        }
      } else {
        downloadFile(file);
      }
    } catch {
      toast(m.toast_export_failed(), undefined, 'error');
    } finally {
      setExporting(false);
    }
  };

  return {
    exporting,
    canExport: session.hasDetailedRecords,
    exportGpx,
  };
};
