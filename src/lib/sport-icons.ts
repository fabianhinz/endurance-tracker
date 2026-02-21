import { Footprints, Bike, Waves } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Sport } from "../types/index.ts";

export const sportIcon: Record<Sport, LucideIcon> = {
  running: Footprints,
  cycling: Bike,
  swimming: Waves,
};
