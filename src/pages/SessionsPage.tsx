import { useSearchParams } from 'react-router-dom';
import { m } from '@/paraglide/messages.js';
import { SessionList } from '@/features/sessions/SessionList.tsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs.tsx';
import { usePBsForRange } from '@/hooks/usePBsForRange.ts';
import { SportRecordsCard } from '@/features/records/SportRecordsCard.tsx';
import { PageGrid } from '@/components/ui/PageGrid.tsx';
import type { Sport } from '@/packages/engine/types.ts';

const sports: Sport[] = ['running', 'cycling', 'swimming'];
const validTabs = new Set(['log', 'records']);

export const SessionsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const tab = rawTab && validTabs.has(rawTab) ? rawTab : 'log';
  const pbsResult = usePBsForRange();

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <Tabs value={tab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="log">{m.ui_sessions_tab_log()}</TabsTrigger>
        <TabsTrigger value="records">{m.ui_sessions_tab_records()}</TabsTrigger>
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
