import { cn } from '@/lib/utils.ts';

export const glassClass = 'bg-white/5 backdrop-blur-xl border border-white/10';

export const cardClass = `${glassClass} rounded-2xl shadow-lg flex flex-col`;

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'compact';
  footer?: React.ReactNode;
  ref?: React.Ref<HTMLDivElement>;
}

export const Card = (props: CardProps) => {
  const { className, children, variant = 'default', footer, ref, ...rest } = props;
  return (
    <div
      ref={ref}
      className={cn(cardClass, variant === 'compact' ? 'p-2' : 'p-4', className)}
      {...rest}
    >
      {children}
      {footer && <div className="border-t border-white/10 mt-4 pt-3">{footer}</div>}
    </div>
  );
};
