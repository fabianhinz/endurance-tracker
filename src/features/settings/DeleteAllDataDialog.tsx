import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import {
  DialogRoot,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { Typography } from '@/components/ui/Typography.tsx';
import { toast } from '@/components/ui/toastStore.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { useUserStore } from '@/store/user.ts';
import { useCoachPlanStore } from '@/store/coachPlan.ts';
import { useLayoutStore } from '@/store/layout.ts';
import { useFiltersStore } from '@/store/filters.ts';
import { clearAllRecords } from '@/lib/indexeddb.ts';
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
    useFiltersStore.setState({
      timeRange: 'all',
      customRange: null,
      prevDashboardRange: null,
      sportFilter: 'all',
    });
    await clearAllRecords();
    setIsDeleting(false);
    props.onOpenChange(false);
    toast(m.ui_delete_dialog_toast(), undefined, 'success');
  };

  const handleOpenChange = (open: boolean) => {
    if (isDeleting) return;
    props.onOpenChange(open);
  };

  return (
    <DialogRoot open={props.open} onOpenChange={handleOpenChange}>
      <DialogContent
        onEscapeKeyDown={(e) => {
          if (isDeleting) e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          if (isDeleting) e.preventDefault();
        }}
      >
        <DialogTitle>{m.ui_delete_dialog_title()}</DialogTitle>
        <DialogDescription>
          {m.ui_delete_dialog_desc()}
        </DialogDescription>

        <div className="mt-4">
          <Typography variant="body1" color="textSecondary">
            {m.ui_delete_dialog_count({
              summary: (sessionCount === 1
                ? m.ui_count_sessions_one()
                : m.ui_count_sessions_other({ count: String(sessionCount) }))
                + (hasProfile ? ` ${m.ui_delete_dialog_and_profile()}` : ''),
            })}
          </Typography>
        </div>

        <div className="flex gap-3 justify-end pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => props.onOpenChange(false)}
            disabled={isDeleting}
          >
            {m.ui_btn_cancel()}
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            disabled={isDeleting}
            aria-label={m.ui_delete_dialog_confirm()}
          >
            {isDeleting ? (
              <span className="flex items-center gap-2">
                <LoaderCircle className="size-4 animate-spin" />
                {m.ui_delete_dialog_deleting()}
              </span>
            ) : (
              m.ui_delete_dialog_confirm()
            )}
          </Button>
        </div>
      </DialogContent>
    </DialogRoot>
  );
};
