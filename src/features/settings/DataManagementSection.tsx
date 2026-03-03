import { useState, useEffect } from "react";
import { useSessionsStore } from "../../store/sessions.ts";
import { getAllFitFileSessionIds } from "../../lib/indexeddb.ts";
import { Card } from "../../components/ui/Card.tsx";
import { CardHeader } from "../../components/ui/CardHeader.tsx";
import { List, ListItem } from "../../components/ui/List.tsx";
import { Typography } from "../../components/ui/Typography.tsx";
import { DeleteAllDataDialog } from "./DeleteAllDataDialog.tsx";
import { ReimportDialog } from "./ReimportDialog.tsx";
import { useReimport } from "./hooks/useReimport.ts";
import { formatDate } from "../../lib/utils.ts";

export const DataManagementSection = () => {
  const sessionCount = useSessionsStore((s) => s.sessions.length);
  const lastUpdated = useSessionsStore((s) =>
    s.sessions.length > 0
      ? Math.max(...s.sessions.map((session) => session.createdAt))
      : null,
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
          setStorageEstimate(
            mb < 1 ? `${Math.round(mb * 1024)} KB` : `${mb.toFixed(1)} MB`,
          );
        }
      });
    }
  }, [reimport.reimporting]);

  return (
    <>
      <Card>
        <CardHeader
          title="Storage"
          subtitle="FIT files and session data stored in your browser"
        />
        <List>
          <ListItem
            primary="Sessions"
            secondary={
              lastUpdated !== null
                ? `Last updated ${formatDate(lastUpdated, { includeTime: true })}`
                : undefined
            }
          >
            <Typography variant="body">{sessionCount}</Typography>
          </ListItem>
          <ListItem
            primary="Stored FIT files"
            secondary={
              lastUpdated !== null
                ? `Last updated ${formatDate(lastUpdated, { includeTime: true })}`
                : undefined
            }
          >
            <Typography variant="body">{fitFileCount ?? "..."}</Typography>
          </ListItem>
          {storageEstimate && (
            <ListItem primary="Estimated storage used">
              <Typography variant="body">{storageEstimate}</Typography>
            </ListItem>
          )}
        </List>
      </Card>

      <Card>
        <CardHeader title="Danger Zone" />
        <List>
          <ListItem
            primary="Reimport all sessions"
            secondary="Re-parse stored FIT files to recalculate TSS, zones, and personal bests"
            onClick={() => setReimportOpen(true)}
          />
          <ListItem
            primary="Delete all data"
            secondary="Permanently remove all sessions, records, and your profile"
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
