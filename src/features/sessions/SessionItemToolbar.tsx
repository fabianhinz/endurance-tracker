import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { m } from '@/paraglide/messages.js';
import { cn } from '@/lib/utils.ts';

interface SessionItemToolbarProps {
  isToggled: boolean;
  onToggleSparkline: () => void;
}

export const SessionItemToolbar = (props: SessionItemToolbarProps) => {
  return (
    <div className="flex gap-1 items-center" onClick={(e) => e.stopPropagation()}>
      <Button
        variant="ghost"
        size="icon"
        aria-label={m.ui_tooltip_toggle_sparkline()}
        aria-expanded={props.isToggled}
        onClick={props.onToggleSparkline}
      >
        <ChevronDown
          size={14}
          className={cn('transition-transform duration-300', props.isToggled && 'rotate-180')}
        />
      </Button>
    </div>
  );
};
