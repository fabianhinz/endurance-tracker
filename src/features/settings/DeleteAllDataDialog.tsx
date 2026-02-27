import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import {
  DialogRoot,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '../../components/ui/Dialog.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Typography } from '../../components/ui/Typography.tsx';
import { toast } from '../../components/ui/toastStore.ts';
import { useSessionsStore } from '../../store/sessions.ts';
import { useUserStore } from '../../store/user.ts';
import { useCoachPlanStore } from '../../store/coachPlan.ts';
import { useLayoutStore } from '../../store/layout.ts';
import { clearAllRecords } from '../../lib/indexeddb.ts';
interface DeleteAllDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteAllDataDialog = (props: DeleteAllDataDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const sessionCount = useSessionsStore((s) => s.sessions.length);
  const hasProfile = useUserStore((s) => s.profile !== null);

  const handleDelete = async () => {
    setIsDeleting(true);
    useSessionsStore.getState().clearAll();
    useUserStore.getState().resetProfile();
    useCoachPlanStore.getState().clearPlan();
    useLayoutStore.setState({ onboardingComplete: false });
    await clearAllRecords();
    setIsDeleting(false);
    props.onOpenChange(false);
    toast('All data deleted', undefined, 'success');
  };

  const handleOpenChange = (open: boolean) => {
    if (isDeleting) return;
    props.onOpenChange(open);
  };

  return (
    <DialogRoot open={props.open} onOpenChange={handleOpenChange}>
      <DialogContent onEscapeKeyDown={(e) => { if (isDeleting) e.preventDefault(); }} onPointerDownOutside={(e) => { if (isDeleting) e.preventDefault(); }}>
        <DialogTitle>Delete All Data</DialogTitle>
        <DialogDescription>
          This will permanently delete everything: all training sessions, personal
          bests, lap data, time-series records, and your profile (name, thresholds,
          preferences). This action cannot be undone.
        </DialogDescription>

        <div className="mt-4">
          <Typography variant="body" color="secondary">
            {sessionCount} {sessionCount === 1 ? 'session' : 'sessions'}
            {hasProfile ? ' and your profile' : ''} will be deleted.
          </Typography>
        </div>

        <div className="flex gap-3 justify-end pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => props.onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            disabled={isDeleting}
            aria-label="Delete all data permanently"
          >
            {isDeleting ? (
              <span className="flex items-center gap-2">
                <LoaderCircle className="size-4 animate-spin" />
                Deleting...
              </span>
            ) : (
              'Delete Everything'
            )}
          </Button>
        </div>
      </DialogContent>
    </DialogRoot>
  );
};
