import { useState } from 'react';
import { EllipsisVertical, Pencil, Trash2 } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { Button } from '@/components/ui/Button.tsx';
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/DropdownMenu.tsx';
import { formatDate } from '@/lib/formatters.ts';
import { RenameSessionDialog } from '@/features/sessions/session/RenameSessionDialog.tsx';
import { DeleteSessionDialog } from '@/features/sessions/session/DeleteSessionDialog.tsx';
import type { TrainingSession } from '@/engine/types.ts';

export const SessionActionsMenu = (props: { session: TrainingSession }) => {
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <DropdownMenuRoot>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={m.ui_session_actions()}>
            <EllipsisVertical size={18} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setShowRenameDialog(true)}>
            <Pencil size={14} />
            {m.ui_btn_rename()}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-status-danger focus:text-status-danger"
            onSelect={() => setShowDeleteDialog(true)}
          >
            <Trash2 size={14} />
            {m.ui_btn_delete()}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuRoot>

      <RenameSessionDialog
        session={props.session}
        open={showRenameDialog}
        onOpenChange={setShowRenameDialog}
        initialName={props.session.name ?? formatDate(props.session.date)}
      />

      <DeleteSessionDialog
        session={props.session}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />
    </>
  );
};
