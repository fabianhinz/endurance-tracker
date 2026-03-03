import { LoaderCircle } from "lucide-react";
import {
  DialogRoot,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/Dialog.tsx";
import { Button } from "../../components/ui/Button.tsx";

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
        <DialogTitle>Reimport All Sessions</DialogTitle>
        <DialogDescription>
          This will re-parse all stored FIT files using your current thresholds.
          TSS, zones, laps, and personal bests will be recalculated. Existing
          session data will be overwritten.
        </DialogDescription>

        <div className="flex gap-3 justify-end pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => props.onOpenChange(false)}
            disabled={props.reimporting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleReimport}
            disabled={props.reimporting}
          >
            {props.reimporting ? (
              <span className="flex items-center gap-2">
                <LoaderCircle className="size-4 animate-spin" />
                Reimporting...
              </span>
            ) : (
              "Reimport All"
            )}
          </Button>
        </div>
      </DialogContent>
    </DialogRoot>
  );
};
