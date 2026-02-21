import { usePBsForRange } from "../../hooks/usePBsForRange.ts";
import { SportRecordsCard } from "./SportRecordsCard.tsx";
import { PageGrid } from "../../components/ui/PageGrid.tsx";
import type { Sport } from "../../types/index.ts";

const sports: Sport[] = ["running", "cycling", "swimming"];

export const RecordsPage = () => {
  const pbsResult = usePBsForRange();

  return (
    <PageGrid>
      {sports.map((sport) => (
        <SportRecordsCard
          key={sport}
          sport={sport}
          pbs={pbsResult.grouped[sport] ?? []}
          loading={pbsResult.loading}
        />
      ))}
    </PageGrid>
  );
};
