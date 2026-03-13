import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { m } from '@/paraglide/messages.js';

interface SessionItemToolbarProps {
  onOpen: () => void;
}

export const SessionItemToolbar = (props: SessionItemToolbarProps) => {
  return (
    <div className="flex gap-1 items-center">
      <Button
        variant="ghost"
        size="icon"
        aria-label={m.ui_tooltip_open_session()}
        onClick={props.onOpen}
      >
        <ExternalLink size={14} />
      </Button>
    </div>
  );
};
