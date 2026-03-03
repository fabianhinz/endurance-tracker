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
};

export const ListItem = (props: ListItemProps) => {
  const content = (
    <>
      <div className="min-w-0">
        <Typography>{props.primary}</Typography>
        {props.secondary && (
          <Typography variant="caption" as="p">
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
          className={cn(baseClass, 'h-auto text-left')}
        >
          {content}
        </Button>
      </li>
    );
  }

  return <li className={baseClass}>{content}</li>;
};
