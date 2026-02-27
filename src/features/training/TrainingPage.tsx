import { useSearchParams } from "react-router-dom";
import { SessionList } from "./SessionList.tsx";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/Tabs.tsx";
import { usePBsForRange } from "../../hooks/usePBsForRange.ts";
import { SportRecordsCard } from "../records/SportRecordsCard.tsx";
import { PageGrid } from "../../components/ui/PageGrid.tsx";
import type { Sport } from "../../engine/types.ts";

const sports: Sport[] = ["running", "cycling", "swimming"];
const validTabs = new Set(["log", "records"]);

export const TrainingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab");
  const tab = rawTab && validTabs.has(rawTab) ? rawTab : "log";
  const pbsResult = usePBsForRange();

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  return (
    <Tabs value={tab} onValueChange={handleTabChange}>
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
