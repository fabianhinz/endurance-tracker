import {
  DialogRoot,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { m } from '@/paraglide/messages.js';

interface ReimportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reimporting: boolean;
  onReimport: () => Promise<void>;
}

export const ReimportDialog = (props: ReimportDialogProps) => {
  const handleReimport = async () => {
    await props.onReimport();
    props.onOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (props.reimporting) return;
    props.onOpenChange(open);
  };

  return (
    <DialogRoot open={props.open} onOpenChange={handleOpenChange}>
      <DialogContent
        onEscapeKeyDown={(e) => {
          if (props.reimporting) e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          if (props.reimporting) e.preventDefault();
        }}
      >
        <DialogTitle>{m.ui_reimport_dialog_title()}</DialogTitle>
        <DialogDescription>{m.ui_reimport_dialog_desc()}</DialogDescription>

        <div className="flex gap-3 justify-end pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => props.onOpenChange(false)}
            disabled={props.reimporting}
          >
            {m.ui_btn_cancel()}
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleReimport}
            loading={props.reimporting}
          >
            {props.reimporting ? m.ui_reimport_dialog_loading() : m.ui_reimport_dialog_confirm()}
          </Button>
        </div>
      </DialogContent>
    </DialogRoot>
  );
};
