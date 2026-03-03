import { formatPace } from '@/lib/utils.ts';

export const PaceRange = (props: { minPace: number; maxPace: number }) => {
  return (
    <span className="text-text-quaternary">
      {formatPace(props.maxPace)} – {formatPace(props.minPace)}
    </span>
  );
};
