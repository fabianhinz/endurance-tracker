import { BarChart3, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { m } from '@/paraglide/messages.js';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop';

interface SessionItemToolbarProps {
  onToggleSparkline: () => void;
  onOpen: () => void;
}

export const SessionItemToolbar = (props: SessionItemToolbarProps) => {
  const isDesktop = useIsDesktop();

  return (
    <div className="flex gap-1 items-center">
      {isDesktop && (
        <Button
          variant="ghost"
          size="icon"
          aria-label={m.ui_tooltip_toggle_sparkline()}
          onClick={props.onToggleSparkline}
        >
          <BarChart3 size={14} />
        </Button>
      )}
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
