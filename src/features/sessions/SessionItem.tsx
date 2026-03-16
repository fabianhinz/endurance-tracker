import { useNavigate } from 'react-router-dom';
import { formatDate, formatDuration, formatDistance } from '@/lib/formatters.ts';
import { Typography } from '@/components/ui/Typography.tsx';
import { SportBadge } from './SportBadge.tsx';
import { SessionItemToolbar } from './SessionItemToolbar.tsx';
import { SessionSparklines } from './SessionSparklines.tsx';
import { Card } from '@/components/ui/Card.tsx';
import type { TrainingSession } from '@/engine/types.ts';
import { cn } from '@/lib/utils.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { useSparklineStore } from '@/store/sparklineStore.ts';
import type { SparklineDomains } from '@/lib/sparklineData.ts';

interface SessionItemProps {
  session: TrainingSession;
  syncId: string;
  isToggled: boolean;
  domains: SparklineDomains;
  onToggleSparkline: () => void;
  className?: string;
  onNavigate?: () => void;
}

export const SessionItem = (props: SessionItemProps) => {
  const navigate = useNavigate();
  const sparklineData = useSparklineStore((s) => s.cache.get(props.session.id));

  return (
    <Card
      data-testid="session-item"
      role="button"
      tabIndex={0}
      className={cn('hover:bg-white/10 cursor-pointer', props.className)}
      onClick={props.onToggleSparkline}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          props.onToggleSparkline();
        }
      }}
      onPointerEnter={() => useMapFocusStore.getState().setHoveredSession(props.session.id)}
      onPointerLeave={() => useMapFocusStore.getState().setHoveredSession(null)}
    >
      <div className="flex justify-between gap-3">
        <div className="flex gap-2">
          <SportBadge sport={props.session.sport} />
          <div>
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
          onOpen={() => {
            navigate(`/sessions/${props.session.id}`);
            props.onNavigate?.();
          }}
        />
      </div>

      {props.isToggled && (
        <div className="col-start-2 col-end-4 row-start-2">
          <SessionSparklines
            data={sparklineData}
            domains={props.domains}
            sport={props.session.sport}
            syncId={props.syncId}
          />
        </div>
      )}
    </Card>
  );
};
