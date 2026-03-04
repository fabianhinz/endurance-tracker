import { useMemo } from 'react';
import { useSessionsStore } from '@/store/sessions.ts';
import { Card } from '@/components/ui/Card.tsx';
import { CardHeader } from '@/components/ui/CardHeader.tsx';
import { PbChip } from '@/features/sessions/PbChip.tsx';
import { m } from '@/paraglide/messages.js';

export const SessionPersonalBests = (props: { sessionId: string }) => {
  const personalBests = useSessionsStore((s) => s.personalBests);
  const sessionPBs = useMemo(
    () => personalBests.filter((pb) => pb.sessionId === props.sessionId),
    [personalBests, props.sessionId],
  );

  if (sessionPBs.length === 0) return null;

  return (
    <Card>
      <CardHeader title={m.ui_pb_title()} subtitle={m.ui_pb_subtitle()} />
      <div className="flex flex-wrap gap-2">
        {sessionPBs.map((pb, idx) => (
          <PbChip key={idx} pb={pb} />
        ))}
      </div>
    </Card>
  );
};
