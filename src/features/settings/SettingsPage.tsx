import { useState, useTransition } from 'react';
import { useUserStore } from '../../store/user.ts';
import { useSessionsStore } from '../../store/sessions.ts';
import { useLayoutStore } from '../../store/layout.ts';
import { Card } from '../../components/ui/Card.tsx';
import { CardHeader } from '../../components/ui/CardHeader.tsx';
import { SettingToggle } from '../../components/ui/SettingToggle.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Typography } from '../../components/ui/Typography.tsx';
import { PageGrid } from '../../components/ui/PageGrid.tsx';
import { ThresholdsSection } from './ThresholdsSection.tsx';
import { DeleteAllDataDialog } from './DeleteAllDataDialog.tsx';

export const SettingsPage = () => {
  const profile = useUserStore((s) => s.profile);
  const toggleMetricHelp = useUserStore((s) => s.toggleMetricHelp);
  const compactLayout = useLayoutStore((s) => s.compactLayout);
  const toggleCompactLayout = useLayoutStore((s) => s.toggleCompactLayout);
  const dockExpanded = useLayoutStore((s) => s.dockExpanded);
  const toggleDock = useLayoutStore((s) => s.toggleDock);
  const sessionCount = useSessionsStore((s) => s.sessions.length);
  const [, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <PageGrid>
      <div className="md:col-span-2">
        <ThresholdsSection />
      </div>

      <Card>
        <CardHeader title="Display" />
        <div className="space-y-4">
          <SettingToggle
            label="Show metric explanations"
            description="Display info icons next to metrics"
            checked={profile?.showMetricHelp ?? true}
            onCheckedChange={() => startTransition(() => toggleMetricHelp())}
          />
          <SettingToggle
            label="Compact layout"
            description="Single-column layout and shift content right to reveal more of the map"
            checked={compactLayout}
            onCheckedChange={toggleCompactLayout}
          />
          <SettingToggle
            label="Expanded dock"
            description="Show labels beneath dock icons"
            checked={dockExpanded}
            onCheckedChange={toggleDock}
          />
        </div>
      </Card>

      <Card>
        <CardHeader title="Data Management" />
        <div className="flex items-center justify-between">
          <Typography variant="body" color="secondary">
            {sessionCount} {sessionCount === 1 ? 'session' : 'sessions'} stored
          </Typography>
          <Button variant="danger" onClick={() => setDeleteOpen(true)}>
            Delete Everything
          </Button>
        </div>
      </Card>

      <DeleteAllDataDialog open={deleteOpen} onOpenChange={setDeleteOpen} />
    </PageGrid>
  );
};
