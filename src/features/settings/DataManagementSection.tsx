import { useState, useEffect } from 'react';
import { m } from '@/paraglide/messages.js';
import { useSessionsStore } from '@/store/sessions.ts';
import { getAllFitFileSessionIds } from '@/lib/indexeddb.ts';
import { Card } from '@/components/ui/Card.tsx';
import { CardHeader } from '@/components/ui/CardHeader.tsx';
import { List, ListItem } from '@/components/ui/List.tsx';
import { Typography } from '@/components/ui/Typography.tsx';
import { DeleteAllDataDialog } from './DeleteAllDataDialog.tsx';
import { ReimportDialog } from './ReimportDialog.tsx';
import { useReimport } from './hooks/useReimport.ts';
import { formatDate } from '@/lib/utils.ts';

export const DataManagementSection = () => {
  const sessionCount = useSessionsStore((s) => s.sessions.length);
  const lastUpdated = useSessionsStore((s) =>
    s.sessions.length > 0 ? Math.max(...s.sessions.map((session) => session.createdAt)) : null,
  );
  const [fitFileCount, setFitFileCount] = useState<number | null>(null);
  const [storageEstimate, setStorageEstimate] = useState<string | null>(null);
  const [reimportOpen, setReimportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const reimport = useReimport();

  useEffect(() => {
    getAllFitFileSessionIds().then((ids) => setFitFileCount(ids.length));
  }, [reimport.reimporting]);

  useEffect(() => {
    if (navigator.storage?.estimate) {
      navigator.storage.estimate().then((estimate) => {
        if (estimate.usage !== undefined) {
          const mb = estimate.usage / (1024 * 1024);
          setStorageEstimate(mb < 1 ? `${Math.round(mb * 1024)} KB` : `${mb.toFixed(1)} MB`);
        }
      });
    }
  }, [reimport.reimporting]);

  return (
    <>
      <Card>
        <CardHeader title={m.ui_data_storage()} subtitle={m.ui_data_storage_desc()} />
        <List>
          <ListItem
            primary={m.ui_data_sessions()}
            secondary={
              lastUpdated !== null
                ? m.ui_data_last_updated({ date: formatDate(lastUpdated, { includeTime: true }) })
                : undefined
            }
          >
            <Typography variant="body1">{sessionCount}</Typography>
          </ListItem>
          <ListItem
            primary={m.ui_data_stored_fit_files()}
            secondary={
              lastUpdated !== null
                ? m.ui_data_last_updated({ date: formatDate(lastUpdated, { includeTime: true }) })
                : undefined
            }
          >
            <Typography variant="body1">{fitFileCount ?? '...'}</Typography>
          </ListItem>
          {storageEstimate && (
            <ListItem primary={m.ui_data_estimated_storage()}>
              <Typography variant="body1">{storageEstimate}</Typography>
            </ListItem>
          )}
        </List>
      </Card>

      <Card>
        <CardHeader title={m.ui_data_danger_zone()} />
        <List>
          <ListItem
            primary={m.ui_data_reimport()}
            secondary={m.ui_data_reimport_desc()}
            onClick={() => setReimportOpen(true)}
          />
          <ListItem
            primary={m.ui_data_delete_all()}
            secondary={m.ui_data_delete_all_desc()}
            onClick={() => setDeleteOpen(true)}
          />
        </List>
      </Card>

      <ReimportDialog
        open={reimportOpen}
        onOpenChange={setReimportOpen}
        reimporting={reimport.reimporting}
        onReimport={reimport.reimportAll}
      />
      <DeleteAllDataDialog open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
  );
};
