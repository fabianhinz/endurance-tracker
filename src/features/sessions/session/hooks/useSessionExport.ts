import { useState } from 'react';
import { m } from '@/paraglide/messages.js';
import { toast } from '@/components/ui/toastStore.ts';
import { getSessionRecords } from '@/lib/indexeddb.ts';
import { buildSessionGpx } from '@/lib/gpxExport.ts';
import { buildGpxFilename } from '@/packages/gpx/buildGpx.ts';
import type { TrainingSession } from '@/packages/engine/types.ts';
import { downloadFile } from '@/lib/fileShare';

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

      downloadFile(file);
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
