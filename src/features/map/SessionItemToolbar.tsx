import { BarChart3, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { m } from '@/paraglide/messages.js';

interface SessionItemToolbarProps {
  isSparklineOpen: boolean;
  onToggleSparkline: () => void;
  onOpen: () => void;
}

export const SessionItemToolbar = (props: SessionItemToolbarProps) => (
  <div className="flex items-center gap-0.5 shrink-0">
    <Button
      variant="ghost"
      size="icon"
      aria-label={m.ui_sparkline_hr()}
      onClick={props.onToggleSparkline}
    >
      <BarChart3 size={14} />
    </Button>
    <Button variant="ghost" size="icon" aria-label={m.ui_btn_open()} onClick={props.onOpen}>
      <ExternalLink size={14} />
    </Button>
  </div>
);
