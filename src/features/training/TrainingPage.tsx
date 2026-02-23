import { SessionList } from "./SessionList.tsx";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/Tabs.tsx";
import { usePBsForRange } from "../../hooks/usePBsForRange.ts";
import { SportRecordsCard } from "../records/SportRecordsCard.tsx";
import { PageGrid } from "../../components/ui/PageGrid.tsx";
import type { Sport } from "../../types/index.ts";

const sports: Sport[] = ["running", "cycling", "swimming"];

export const TrainingPage = () => {
  const pbsResult = usePBsForRange();

  return (
    <Tabs defaultValue="log">
      <TabsList>
        <TabsTrigger value="log">Log</TabsTrigger>
        <TabsTrigger value="records">Records</TabsTrigger>
      </TabsList>

      <TabsContent value="log">
        <SessionList />
      </TabsContent>

      <TabsContent value="records">
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
      </TabsContent>
    </Tabs>
  );
};
