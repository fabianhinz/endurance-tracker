import { useNavigate } from 'react-router-dom';
import { SessionHeader } from './SessionHeader.tsx';
import { SessionItemToolbar } from './SessionItemToolbar.tsx';
import { SessionSparklines } from './SessionSparklines.tsx';
import { Card } from '@/components/ui/Card.tsx';
import type { TrainingSession } from '@/engine/types.ts';
import { cn } from '@/lib/utils.ts';
import { useSparklineStore } from '@/store/sparklineStore.ts';
import { useSessionHover } from './hooks/useSessionHover.ts';
interface SessionItemProps {
  session: TrainingSession;
  syncId: string;
  isToggled: boolean;
  onToggleSparkline: () => void;
  className?: string;
  onNavigate?: () => void;
}

export const SessionItem = (props: SessionItemProps) => {
  const navigate = useNavigate();
  const sparklineData = useSparklineStore((s) => s.cache.get(props.session.id));
  const handleNavigate = () => {
    navigate(`/sessions/${props.session.id}`);
    props.onNavigate?.();
  };

  const sessionHover = useSessionHover(props.session.id);

  return (
    <Card
      data-testid="session-item"
      role="button"
      tabIndex={0}
      className={cn('hover:bg-white/10 cursor-pointer', props.className)}
      onClick={handleNavigate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleNavigate();
        }
      }}
      onPointerEnter={sessionHover.onPointerEnter}
      onPointerLeave={sessionHover.onPointerLeave}
    >
      <SessionHeader session={props.session} titleVariant="subtitle1">
        <SessionItemToolbar
          isToggled={props.isToggled}
          onToggleSparkline={props.onToggleSparkline}
        />
      </SessionHeader>

      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-out',
          props.isToggled ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden min-h-0">
          {sparklineData && (
            <SessionSparklines
              data={sparklineData}
              sport={props.session.sport}
              syncId={props.syncId}
            />
          )}
        </div>
      </div>
    </Card>
  );
};
