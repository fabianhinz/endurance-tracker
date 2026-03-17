import { useNavigate } from 'react-router-dom';
import { formatDate, formatDuration, formatDistance } from '@/lib/formatters.ts';
import { Typography } from '@/components/ui/Typography.tsx';
import { SportBadge } from './SportBadge.tsx';
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
      <div className="flex justify-between gap-3">
        <div className="flex gap-2 min-w-0">
          <SportBadge sport={props.session.sport} />
          <div className="min-w-0">
            <Typography variant="subtitle1" className="truncate">
              {props.session.name ?? formatDate(props.session.date)}
            </Typography>
            <Typography variant="caption" as="p">
              {props.session.name && <>{formatDate(props.session.date)} &middot; </>}
              {formatDistance(props.session.distance)} &middot;{' '}
              {formatDuration(props.session.duration)}
            </Typography>
          </div>
        </div>
        <SessionItemToolbar
          isToggled={props.isToggled}
          onToggleSparkline={props.onToggleSparkline}
        />
      </div>

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
