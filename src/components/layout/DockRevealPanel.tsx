import { cn } from '@/lib/utils.ts';

interface DockRevealPanelProps {
  open: boolean;
  className?: string;
  children: React.ReactNode;
}

export const DockRevealPanel = (props: DockRevealPanelProps) => {
  return (
    <div
      className={cn(
        'flex flex-row lg:flex-col items-center justify-center gap-1 overflow-hidden transition-all duration-300',
        'border-white/10',
        props.open
          ? 'max-h-96 lg:max-h-none lg:max-w-96 opacity-100 p-2 border-b lg:border-b-0 lg:border-l pointer-events-auto'
          : 'max-h-0 lg:max-h-none lg:max-w-0 opacity-0 p-0 border-b-0 lg:border-l-0 pointer-events-none',
        props.className,
      )}
    >
      {props.children}
    </div>
  );
};
