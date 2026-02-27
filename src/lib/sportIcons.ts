import { Footprints, Bike, Waves } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Sport } from "../engine/types.ts";

export const sportIcon: Record<Sport, LucideIcon> = {
  running: Footprints,
  cycling: Bike,
  swimming: Waves,
};
