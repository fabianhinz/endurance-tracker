import type { ReactNode } from 'react';
import { formatDate, formatDuration, formatDistance } from '@/lib/formatters.ts';
import { Typography } from '@/components/ui/Typography.tsx';
import { SportBadge } from './SportBadge.tsx';
import { Card } from '@/components/ui/Card.tsx';
import type { TrainingSession } from '@/engine/types.ts';
import { cn } from '@/lib/utils.ts';

interface SessionItemProps {
  session: TrainingSession;
  className?: string;
  actions?: ReactNode;
  children?: ReactNode;
  onClick?: React.MouseEventHandler;
  onPointerEnter?: React.PointerEventHandler;
  onPointerLeave?: React.PointerEventHandler;
}

export const SessionItem = (props: SessionItemProps) => {
  return (
    <Card
      className={cn('flex-row gap-2', props.className)}
      onClick={props.onClick}
      onPointerEnter={props.onPointerEnter}
      onPointerLeave={props.onPointerLeave}
    >
      <div className="self-start">
        <SportBadge sport={props.session.sport} />
      </div>
      <div className="flex-1 min-w-0">
        <Typography variant="subtitle1" className="truncate">
          {props.session.name ?? formatDate(props.session.date)}
        </Typography>
        <Typography variant="caption" as="p">
          {props.session.name && <>{formatDate(props.session.date)} &middot; </>}
          {formatDistance(props.session.distance)} &middot; {formatDuration(props.session.duration)}
        </Typography>
        {props.children}
      </div>
      {props.actions}
    </Card>
  );
};
