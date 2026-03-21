import { PageGrid } from '@/components/ui/PageGrid';
import { usePBsForRange } from '@/hooks/usePBsForRange';
import type { Sport } from '@/packages/engine/types';
import { SportRecordsCard } from './SportRecordsCard';

const sports: Sport[] = ['running', 'cycling', 'swimming'];

export const SportsRecords: React.FC = () => {
  const pbsResult = usePBsForRange();

  return (
    <PageGrid>
      {sports.map((sport) => (
        <SportRecordsCard
          key={sport}
          sport={sport}
          pbs={pbsResult.grouped[sport]}
          loading={pbsResult.loading}
        />
      ))}
    </PageGrid>
  );
};
