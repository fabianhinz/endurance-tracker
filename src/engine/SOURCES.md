# Engine — Scientific Sources

Central bibliography for every published formula, model, or algorithm implemented in `src/engine/`.
Each engine file contains a short `// Sources: [KEY]` comment pointing into this table.

## Validation Summary

| Module | Formula / Model | Source Key | Verdict |
|--------|----------------|------------|---------|
| `metrics.ts` | Coggan PMC (CTL / ATL / TSB via EWMA) | `[CogganAllen2010]`, `[TP-PMC]` | Matches published model |
| `stress.ts` | Banister TRIMP (HR-based training impulse) | `[Banister1991]`, `[Fellrnr]` | Matches published coefficients |
| `stress.ts` | Coggan TSS (power-based training stress) | `[CogganAllen2010]` | Matches published formula |
| `normalize.ts` | Normalized Power (30 s rolling → 4th power) | `[CogganAllen2010]` | Matches published algorithm |
| `normalize.ts` | Grade Adjusted Pace (Minetti energy-cost curve) | `[Minetti2002]` | Matches published polynomial |
| `vdot.ts` | Daniels/Gilbert VDOT & race predictions | `[DanielsGilbert1979]`, `[Daniels2013]` | Matches published tables |
| `zoneDistribution.ts` | Karvonen HRR zones | `[Karvonen1957]` | Matches published method |
| `zoneDistribution.ts` | Coggan power zones | `[CogganAllen2010]` | Matches published zones |
| `coaching.ts` | Gabbett ACWR (acute:chronic workload ratio) | `[Gabbett2016]` | Matches published thresholds |
| `coaching.ts` | Friel CTL ramp-rate guidelines | `[Friel2009]`, `[TP-PMC]` | Matches published ranges |
| `efficiency.ts` | Coggan Efficiency Factor (NP / HR) | `[CogganAllen2010]`, `[TP-EF]` | Matches published definition |
| `efficiency.ts` | Friel Pw:Hr decoupling | `[Friel2009]` | Matches published method |
| `zones.ts` | Daniels pace zones (% of VDOT pace) | `[Daniels2013]` | Matches published zone boundaries |
| `trainingEffect.ts` | Banister TRIMP (used as TE input) | `[Banister1991]` | Custom 0–5 mapping (app-specific) |
| `gps.ts` | Ramer–Douglas–Peucker simplification | `[Ramer1972]`, `[DouglasPeucker1973]` | Standard algorithm |
| `gps.ts` | Liang–Barsky line clipping | `[LiangBarsky1984]` | Standard algorithm |

## Full Bibliography

| Key | Citation |
|-----|----------|
| `[DanielsGilbert1979]` | Daniels, J. & Gilbert, J. (1979). *Oxygen Power: Performance Tables for Distance Runners.* |
| `[Daniels2013]` | Daniels, J. (2013). *Daniels' Running Formula*, 3rd ed. Human Kinetics. |
| `[Karvonen1957]` | Karvonen, M.J., Kentala, E. & Mustala, O. (1957). "The effects of training on heart rate." *Ann. Med. Exp. Biol. Fenn.*, 35(3), 307–315. |
| `[Banister1991]` | Banister, E.W. (1991). "Modeling elite athletic performance." In: Green et al. (eds.) *Physiological Testing of Elite Athletes*. Human Kinetics, pp. 403–424. |
| `[Minetti2002]` | Minetti, A.E. et al. (2002). "Energy cost of walking and running at extreme uphill and downhill slopes." *J. Appl. Physiol.*, 93(3), 1039–1046. |
| `[CogganAllen2010]` | Coggan, A. & Allen, H. (2010). *Training and Racing with a Power Meter*, 2nd ed. VeloPress. |
| `[Friel2009]` | Friel, J. (2009). *The Cyclist's Training Bible*, 4th ed. VeloPress. |
| `[Gabbett2016]` | Gabbett, T.J. (2016). "The training—injury prevention paradox." *Br. J. Sports Med.*, 50(5), 273–280. |
| `[Ramer1972]` | Ramer, U. (1972). "An iterative procedure for the polygonal approximation of plane curves." *CGIP*, 1(3), 244–256. |
| `[DouglasPeucker1973]` | Douglas, D. & Peucker, T. (1973). "Algorithms for the reduction of the number of points." *Cartographica*, 10(2), 112–122. |
| `[LiangBarsky1984]` | Liang, Y.D. & Barsky, B.A. (1984). "A new concept and method for line clipping." *ACM TOG*, 3(1), 1–22. |
| `[Fellrnr]` | Fellrnr. "TRIMP." <https://fellrnr.com/wiki/TRIMP> |
| `[TP-PMC]` | TrainingPeaks. "The Science of the Performance Manager." <https://www.trainingpeaks.com/learn/articles/the-science-of-the-performance-manager/> |
| `[TP-EF]` | TrainingPeaks. "Efficiency Factor and Decoupling." <https://www.trainingpeaks.com/blog/efficiency-factor-and-decoupling/> |

## Custom / App-Specific Formulas (No Published Source)

These are explicitly **not** from published literature:

- **`trainingEffect.ts`** — Training Effect 0–5 mapping uses a power-law curve (exponent 0.25) and CTL-based fitness scaling. Inspired by the Banister TRIMP input but the mapping itself is app-specific.
- **`fingerprint.ts`** — Session deduplication heuristic.
- **`downsample.ts`** — Chart downsampling heuristic.
- **`laps.ts`** — Lap analysis logic.
- **`records.ts`** — Sliding-window personal-best detection.
- **`validation.ts`** — Sensor-data thresholds.
