import type { ReactNode } from 'react';
import { cn } from '@/lib/utils.ts';
import { Button } from './Button.tsx';
import { Typography } from './Typography.tsx';

type ListProps = {
  children: ReactNode;
  className?: string;
};

export const List = (props: ListProps) => (
  <ul className={cn('space-y-3', props.className)}>{props.children}</ul>
);

type ListItemProps = {
  primary: ReactNode;
  secondary?: ReactNode;
  children?: ReactNode;
  onClick?: () => void;
  size?: 'default' | 'sm';
};

export const ListItem = (props: ListItemProps) => {
  const small = props.size === 'sm';

  const content = (
    <>
      <div className="min-w-0">
        <Typography
          variant={small ? 'caption' : 'body1'}
          color="textSecondary"
        >
          {props.primary}
        </Typography>
        {props.secondary && (
          <Typography variant="caption" color="textSecondary" as="p">
            {props.secondary}
          </Typography>
        )}
      </div>
      {props.children && <div className="ml-auto text-right shrink-0">{props.children}</div>}
    </>
  );

  const baseClass = 'flex w-full items-center justify-between';

  if (props.onClick) {
    return (
      <li>
        <Button
          variant="ghost"
          onClick={props.onClick}
          className={cn(baseClass, '-mx-2 -my-1 h-auto text-left')}
        >
          {content}
        </Button>
      </li>
    );
  }

  return <li className={baseClass}>{content}</li>;
};
