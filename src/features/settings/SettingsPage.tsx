import { useTransition } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUserStore } from '@/store/user.ts';
import { useLayoutStore } from '@/store/layout.ts';
import { Card } from '@/components/ui/Card.tsx';
import { CardHeader } from '@/components/ui/CardHeader.tsx';
import { List, ListItem } from '@/components/ui/List.tsx';
import { Switch } from '@/components/ui/Switch.tsx';
import { PageGrid } from '@/components/ui/PageGrid.tsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs.tsx';
import { ThresholdsSection } from './ThresholdsSection.tsx';
import { DataManagementSection } from './DataManagementSection.tsx';

const validTabs = new Set(['general', 'data']);

export const SettingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const tab = rawTab && validTabs.has(rawTab) ? rawTab : 'general';

  const profile = useUserStore((s) => s.profile);
  const toggleMetricHelp = useUserStore((s) => s.toggleMetricHelp);
  const compactLayout = useLayoutStore((s) => s.compactLayout);
  const toggleCompactLayout = useLayoutStore((s) => s.toggleCompactLayout);
  const dockExpanded = useLayoutStore((s) => s.dockExpanded);
  const toggleDock = useLayoutStore((s) => s.toggleDock);
  const [, startTransition] = useTransition();

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <Tabs value={tab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="data">Data Management</TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        <PageGrid>
          <div className="md:col-span-2">
            <ThresholdsSection />
          </div>

          <Card>
            <CardHeader title="Display" />
            <List className="space-y-4">
              <ListItem
                primary="Show metric explanations"
                secondary="Display info icons next to metrics"
              >
                <Switch
                  checked={profile?.showMetricHelp ?? true}
                  onCheckedChange={() => startTransition(() => toggleMetricHelp())}
                />
              </ListItem>
              <ListItem
                primary="Compact layout"
                secondary="Single-column layout and shift content right to reveal more of the map"
              >
                <Switch checked={compactLayout} onCheckedChange={toggleCompactLayout} />
              </ListItem>
              <ListItem primary="Expanded dock" secondary="Show labels beneath dock icons">
                <Switch checked={dockExpanded} onCheckedChange={toggleDock} />
              </ListItem>
            </List>
          </Card>
        </PageGrid>
      </TabsContent>

      <TabsContent value="data">
        <PageGrid>
          <DataManagementSection />
        </PageGrid>
      </TabsContent>
    </Tabs>
  );
};
