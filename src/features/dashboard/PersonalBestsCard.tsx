import { Link } from "react-router-dom";
import { Card } from "../../components/ui/Card.tsx";
import { CardHeader } from "../../components/ui/CardHeader.tsx";
import { Typography } from "../../components/ui/Typography.tsx";
import { ValueSkeleton } from "../../components/ui/ValueSkeleton.tsx";
import { SportBadge } from "../../components/ui/SportBadge.tsx";
import { pbLabel, formatPBValue, formatDate } from "../../lib/utils.ts";
import { usePBsForRange } from "../../hooks/usePBsForRange.ts";
import type { PersonalBest, Sport } from "../../types/index.ts";

const sports: Sport[] = ["running", "cycling", "swimming"];

const heroForSport = (pbs: PersonalBest[]): PersonalBest | undefined => {
  if (pbs.length === 0) return undefined;
  return pbs.reduce((latest, pb) => (pb.date > latest.date ? pb : latest));
};

export const PersonalBestsCard = () => {
  const pbsResult = usePBsForRange();

  return (
    <Card>
      <CardHeader title="Recent PBs" subtitle="Your latest personal bests" />
      <div className="space-y-1">
        {sports.map((sport) => {
          const sportPBs = pbsResult.grouped[sport] ?? [];
          const hero = pbsResult.loading ? undefined : heroForSport(sportPBs);

          const row = (
            <div className={`flex items-center gap-3 rounded-lg px-3 py-2${hero ? " transition-colors hover:bg-white/10" : ""}`}>
              <SportBadge sport={sport} size="sm" />
              <div className="flex-1 min-w-0">
                <Typography variant="body" className="capitalize">
                  {sport}
                </Typography>
                <Typography variant="caption" as="p" className={hero ? "" : "invisible"}>
                  {hero ? pbLabel(hero) : "\u00a0"}
                </Typography>
              </div>
              <div className="text-right">
                {pbsResult.loading ? (
                  <ValueSkeleton />
                ) : (
                  <>
                    <Typography variant="emphasis" color={hero ? "primary" : "quaternary"}>
                      {hero ? formatPBValue(hero) : "--"}
                    </Typography>
                    <Typography variant="caption" as="p" className={hero ? "" : "invisible"}>
                      {hero ? formatDate(hero.date) : "\u00a0"}
                    </Typography>
                  </>
                )}
              </div>
            </div>
          );

          if (hero) {
            return (
              <Link key={sport} to={`/training/${hero.sessionId}`} className="block">
                {row}
              </Link>
            );
          }

          return <div key={sport}>{row}</div>;
        })}
      </div>
    </Card>
  );
};
