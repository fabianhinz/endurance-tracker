import { Link } from "react-router-dom";
import { Card } from "../../components/ui/Card.tsx";
import { CardHeader } from "../../components/ui/CardHeader.tsx";
import { Typography } from "../../components/ui/Typography.tsx";
import { ValueSkeleton } from "../../components/ui/ValueSkeleton.tsx";
import { SportBadge } from "../../components/ui/SportBadge.tsx";
import { pbLabel, formatPBValue, formatDate } from "../../lib/utils.ts";
import { PB_SLOTS } from "../../engine/records.ts";
import type { PersonalBest, Sport } from "../../engine/types.ts";

const sportSubtitle: Record<Sport, string> = {
  running: "Distance records",
  cycling: "Power & distance records",
  swimming: "Distance records",
};

export const SportRecordsCard = (props: { sport: Sport; pbs: PersonalBest[]; loading?: boolean }) => {
  const slots = PB_SLOTS[props.sport];

  const findPB = (category: string, window: number) =>
    props.pbs.find((pb) => pb.category === category && pb.window === window);

  return (
    <Card>
      <CardHeader
        icon={<SportBadge sport={props.sport} size="md" />}
        title={props.sport}
        subtitle={sportSubtitle[props.sport]}
      />
      <div className="space-y-1">
        {slots.map((slot) => {
          const pb = findPB(slot.category, slot.window);
          const tempPB = { sport: props.sport, category: slot.category, window: slot.window, value: 0, sessionId: "", date: 0 } as PersonalBest;
          const label = pbLabel(tempPB);

          const row = (
            <div className={`flex items-center gap-3 rounded-lg px-3 py-2${pb && !props.loading ? " transition-colors hover:bg-white/10" : ""}`}>
              <div className="flex-1 min-w-0">
                <Typography variant="body" color={pb ? "primary" : "secondary"}>{label}</Typography>
              </div>
              <div className="text-right">
                {props.loading ? (
                  <ValueSkeleton />
                ) : (
                  <>
                    <Typography variant="emphasis" color={pb ? "primary" : "quaternary"}>
                      {pb ? formatPBValue(pb) : "--"}
                    </Typography>
                    <Typography variant="caption" as="p" className={pb ? "" : "invisible"}>
                      {pb ? formatDate(pb.date) : "\u00a0"}
                    </Typography>
                  </>
                )}
              </div>
            </div>
          );

          if (pb && !props.loading) {
            return (
              <Link
                key={`${slot.category}-${slot.window}`}
                to={`/training/${pb.sessionId}`}
                className="block"
              >
                {row}
              </Link>
            );
          }

          return (
            <div key={`${slot.category}-${slot.window}`}>
              {row}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
