import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '../../lib/utils.ts';

export const Label = (props: LabelPrimitive.LabelProps) => {
  const { className, ...rest } = props;
  return (
    <LabelPrimitive.Root
      className={cn(
        'block text-sm font-medium text-gray-300 mb-1.5 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className,
      )}
      {...rest}
    />
  );
};
