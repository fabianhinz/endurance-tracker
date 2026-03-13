import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils.ts';
import { formatDate, formatDuration, formatDistance } from '@/lib/formatters.ts';
import { Typography } from '@/components/ui/Typography.tsx';
import { SportBadge } from './SportBadge.tsx';
import { glassClass } from '@/components/ui/Card.tsx';
import type { TrainingSession } from '@/engine/types.ts';

interface SessionItemProps {
  session: TrainingSession;
  size?: 'sm' | 'md';
  className?: string;
  disableLink?: boolean;
  actions?: ReactNode;
  sparklineContent?: ReactNode;
  onClick?: React.MouseEventHandler;
  onPointerEnter?: React.PointerEventHandler;
  onPointerLeave?: React.PointerEventHandler;
}

const sizeStyles = {
  sm: 'gap-3 rounded-lg px-3 py-2',
  md: `gap-4 rounded-xl p-4 ${glassClass}`,
} as const;

export const SessionItem = (props: SessionItemProps) => {
  const s = props.session;
  const className = cn(
    'relative flex items-center transition-colors',
    !props.disableLink && 'hover:bg-white/10',
    sizeStyles[props.size ?? 'md'],
    props.className,
  );

  const content = (
    <>
      <div className="self-start">
        <SportBadge sport={s.sport} size={props.size ?? 'md'} />
      </div>
      <div className="flex-1 min-w-0">
        <Typography variant="subtitle1" className="truncate">
          {s.name ?? formatDate(s.date)}
        </Typography>
        <Typography variant="caption" as="p">
          {s.name && <>{formatDate(s.date)} &middot; </>}
          {formatDistance(s.distance)} &middot; {formatDuration(s.duration)}
        </Typography>
        {props.sparklineContent}
      </div>
      {props.actions && (
        <div className="absolute right-2 top-6 -translate-y-1/2">{props.actions}</div>
      )}
    </>
  );

  if (props.disableLink) {
    return (
      <div
        className={className}
        onClick={props.onClick}
        onPointerEnter={props.onPointerEnter}
        onPointerLeave={props.onPointerLeave}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      to={`/sessions/${s.id}`}
      className={className}
      onClick={props.onClick}
      onPointerEnter={props.onPointerEnter}
      onPointerLeave={props.onPointerLeave}
    >
      {content}
    </Link>
  );
};
