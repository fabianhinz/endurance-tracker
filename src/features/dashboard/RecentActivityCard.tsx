import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useSessionsStore } from "../../store/sessions.ts";
import { useFiltersStore } from "../../store/filters.ts";
import { useMapFocusStore } from "../../store/map-focus.ts";
import { useHoverIntent } from "../../hooks/useHoverIntent.ts";
import { usePBsForRange } from "../../hooks/usePBsForRange.ts";
import { Card } from "../../components/ui/Card.tsx";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/Tabs.tsx";
import { SessionItem } from "../../components/ui/SessionItem.tsx";
import { SportBadge } from "../../components/ui/SportBadge.tsx";
import { Typography } from "../../components/ui/Typography.tsx";
import { ValueSkeleton } from "../../components/ui/ValueSkeleton.tsx";
import { Button } from "../../components/ui/Button.tsx";
import { ChevronRight } from "lucide-react";
import { pbLabel, formatPBValue, formatDate } from "../../lib/utils.ts";
import { rangeToCutoff, customRangeToCutoffs } from "../../lib/time-range.ts";
import type { TimeRange } from "../../lib/time-range.ts";
import type { PersonalBest, Sport } from "../../types/index.ts";

const sports: Sport[] = ["running", "cycling", "swimming"];

const heroForSport = (pbs: PersonalBest[]): PersonalBest | undefined => {
  if (pbs.length === 0) return undefined;
  return pbs.reduce((latest, pb) => (pb.date > latest.date ? pb : latest));
};

const ViewAllLink = (props: { to: string }) => (
  <Button asChild variant="ghost" size="sm">
    <Link to={props.to}>View all <ChevronRight className="size-4" /></Link>
  </Button>
);

export const RecentActivityCard = () => {
  const sessions = useSessionsStore((s) => s.sessions);
  const timeRange = useFiltersStore((s) => s.timeRange);
  const customRange = useFiltersStore((s) => s.customRange);
  const sportFilter = useFiltersStore((s) => s.sportFilter);
  const hover = useHoverIntent(useMapFocusStore((s) => s.setHoveredSession));
  const pbsResult = usePBsForRange();

  const recent = useMemo(() => {
    let list: typeof sessions;

    if (timeRange === "custom" && customRange) {
      const bounds = customRangeToCutoffs(customRange);
      list = sessions.filter(
        (s) =>
          !s.isPlanned &&
          s.date >= bounds.from &&
          s.date <= bounds.to &&
          (sportFilter === "all" || s.sport === sportFilter),
      );
    } else {
      const cutoff = rangeToCutoff(timeRange as Exclude<TimeRange, "custom">);
      list = sessions.filter(
        (s) =>
          !s.isPlanned &&
          s.date >= cutoff &&
          (sportFilter === "all" || s.sport === sportFilter),
      );
    }

    return list.sort((a, b) => b.date - a.date).slice(0, 3);
  }, [sessions, timeRange, customRange, sportFilter]);

  return (
    <Tabs defaultValue="log">
      <TabsList>
        <TabsTrigger value="log">Log</TabsTrigger>
        <TabsTrigger value="records">Records</TabsTrigger>
      </TabsList>

      <TabsContent value="log">
        <Card>
          <div className="flex-1 space-y-2">
            {recent.map((s) => (
              <SessionItem
                key={s.id}
                session={s}
                size="sm"
                onPointerEnter={() => hover.onPointerEnter(s.id)}
                onPointerLeave={hover.onPointerLeave}
              />
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <ViewAllLink to="/training?tab=log" />
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="records">
        <Card>
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
          <div className="mt-4 flex justify-end">
            <ViewAllLink to="/training?tab=records" />
          </div>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
