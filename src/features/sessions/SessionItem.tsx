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

interface SessionItemProps {
  session: TrainingSession;
  className?: string;
  onNavigate?: () => void;
}

export const SessionItem = (props: SessionItemProps) => {
  const navigate = useNavigate();
  const isToggled = useSparklineStore((s) => s.toggledIds.has(props.session.id));
  const sparklineData = useSparklineStore((s) => s.cache.get(props.session.id));
  const domains = useSparklineStore((s) => s.domains);

  return (
    <Card
      className={cn('hover:bg-white/10', props.className)}
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
          onToggleSparkline={() => useSparklineStore.getState().toggleSparkline(props.session.id)}
          onOpen={() => {
            navigate(`/sessions/${props.session.id}`);
            props.onNavigate?.();
          }}
        />
      </div>

      {isToggled && (
        <div className="col-start-2 col-end-4 row-start-2">
          <SessionSparklines
            data={sparklineData}
            domains={domains}
            sport={props.session.sport}
            syncId={props.session.id}
          />
        </div>
      )}
    </Card>
  );
};
