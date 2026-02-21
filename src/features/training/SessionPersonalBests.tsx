import { useMemo } from "react";
import { useSessionsStore } from "../../store/sessions.ts";
import { Card } from "../../components/ui/Card.tsx";
import { CardHeader } from "../../components/ui/CardHeader.tsx";
import { PbChip } from "../../components/ui/PbChip.tsx";

export const SessionPersonalBests = (props: { sessionId: string }) => {
  const personalBests = useSessionsStore((s) => s.personalBests);
  const sessionPBs = useMemo(
    () => personalBests.filter((pb) => pb.sessionId === props.sessionId),
    [personalBests, props.sessionId],
  );

  if (sessionPBs.length === 0) return null;

  return (
    <Card>
      <CardHeader title="Personal Bests" subtitle="New records achieved in this session" />
      <div className="flex flex-wrap gap-2">
        {sessionPBs.map((pb, idx) => (
          <PbChip key={idx} pb={pb} />
        ))}
      </div>
    </Card>
  );
};
