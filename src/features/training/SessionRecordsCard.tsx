import { Card } from "../../components/ui/Card.tsx";
import { CardGrid } from "../../components/ui/CardGrid.tsx";
import { StatItem } from "../../components/ui/StatItem.tsx";
import { Typography } from "../../components/ui/Typography.tsx";
import { pbLabel, formatPBValue, formatDate } from "../../lib/utils.ts";
import type { PersonalBest } from "../../types/index.ts";

interface SessionRecordsCardProps {
  sessionPBs: PersonalBest[];
}

export const SessionRecordsCard = (props: SessionRecordsCardProps) => {
  return (
    <Card>
      <CardGrid collapsedRows={1} title="Records">
        {props.sessionPBs.map((pb, idx) => (
          <StatItem
            key={idx}
            label={pbLabel(pb)}
            value={formatPBValue(pb)}
            subDetail={
              <Typography variant="caption" as="p">
                {formatDate(pb.date)}
              </Typography>
            }
          />
        ))}
      </CardGrid>
    </Card>
  );
};
