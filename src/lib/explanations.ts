// ---------------------------------------------------------------------------
// Metric Explanation Registry
// Pure data — no React, no state, no side effects.
// Source of truth for all metric labels, descriptions, and scientific context.
// ---------------------------------------------------------------------------

export type MetricId =
  | "tss"
  | "trimp"
  | "duration"
  | "ctl"
  | "atl"
  | "tsb"
  | "acwr"
  | "normalizedPower"
  | "gradeAdjustedPace"
  | "recovery"
  | "pacingTrend"
  | "trainingZones"
  | "aerobicTE"
  | "anaerobicTE"
  | "avgHr"
  | "avgPace"
  | "avgSpeed"
  | "avgPower"
  | "elevation"
  | "cadence";

export interface MetricExplanation {
  id: MetricId;
  shortLabel: string;
  friendlyName: string;
  name: string;
  oneLiner: string;
  fullExplanation: string;
  formula?: string;
  analogy: string;
  whyItMatters: string;
  range: string;
  limitations: string;
  unit?: string;
  sports: ("running" | "cycling" | "swimming" | "all")[];
  displayContext: string;
}

// ---------------------------------------------------------------------------
// Stress metrics (src/engine/stress.ts)
// ---------------------------------------------------------------------------

const tss: MetricExplanation = {
  id: "tss",
  shortLabel: "TSS",
  friendlyName: "Training Load",
  name: "Training Stress Score",
  oneLiner:
    "Measures how hard a workout was relative to your personal threshold.",
  fullExplanation:
    "TSS quantifies the overall stress of a workout by combining duration and intensity relative to your Functional Threshold Power (FTP). A score of 100 equals one hour at threshold. TSS enables comparison of workouts with different durations and intensities on a single scale.",
  formula:
    "TSS = (duration_sec x NP x IF) / (FTP x 3600) x 100, where IF = NP / FTP",
  analogy:
    "Think of TSS like a workout cost in energy credits. A 100-credit workout is a solid effort; 200+ means you wrote a big check your body needs time to cash.",
  whyItMatters:
    "TSS lets you compare workouts of different durations and intensities on a single scale. A 2-hour easy ride and a 45-minute interval session might produce similar TSS, meaning similar recovery demands.",
  range:
    "Under 150: low stress, quick recovery. 150-300: moderate, some residual fatigue. 300-450: high, requires 2+ days recovery. 450+: very high, extended recovery needed.",
  limitations:
    "TSS only works with power data and a correctly set FTP. It does not account for heat, altitude, nutrition, or psychological stress. It also treats all watts equally — 200W in a sprint and 200W steady-state have different physiological costs that TSS ignores.",
  unit: "TSS",
  sports: ["cycling"],
  displayContext:
    "Session detail view, session list, and weekly/monthly summaries. Display alongside the stress method label.",
};

const trimp: MetricExplanation = {
  id: "trimp",
  shortLabel: "TRIMP",
  friendlyName: "Heart Rate Load",
  name: "Training Impulse",
  oneLiner:
    "Estimates workout stress from heart rate data using the Banister formula.",
  fullExplanation:
    "TRIMP calculates training load from heart rate by accounting for both duration and intensity. It uses an exponential weighting that gives disproportionate credit to higher heart rate efforts, reflecting the non-linear physiological cost of harder exercise. Values are normalized to a TSS-equivalent scale for cross-metric comparison.",
  formula:
    "TRIMP = duration_min x deltaHR_ratio x a x e^(b x deltaHR_ratio), where deltaHR_ratio = (avgHR - restHR) / (maxHR - restHR)",
  analogy:
    "If TSS is your workout price tag from a power meter, TRIMP is the price tag from your heart rate monitor. Both measure cost, just using different currencies.",
  whyItMatters:
    "TRIMP enables training load tracking for athletes without a power meter. Runners, swimmers, and cyclists without power can still monitor their fitness and fatigue trends using heart rate alone.",
  range:
    "Normalized to TSS scale: ~100 for a 1-hour threshold effort. Compare with TSS ranges for interpretation.",
  limitations:
    "Heart rate is influenced by caffeine, heat, dehydration, sleep quality, and cardiac drift. A hot day can inflate TRIMP by 10-20% without any real increase in training stress. TRIMP also uses average HR, which misses the nuance of intervals.",
  unit: "TSS-equivalent",
  sports: ["all"],
  displayContext:
    'Session detail as the stress metric when power data is unavailable. Labeled as "estimated from heart rate".',
};

const duration: MetricExplanation = {
  id: "duration",
  shortLabel: "Duration",
  friendlyName: "Duration-Based Load",
  name: "Duration-Based Stress Estimate",
  oneLiner:
    "A rough stress estimate based only on session duration when no power or heart rate data is available.",
  fullExplanation:
    "When a session has neither power nor heart rate data, the app estimates stress at a fixed rate of 30 TSS per hour. This is a conservative placeholder that prevents the session from being invisible in your training load history, but should not be taken as an accurate measure of training stress.",
  analogy:
    "Think of it as a minimum charge on your training credit card — the app logs that you trained, even if it cannot measure how hard.",
  whyItMatters:
    "Without this fallback, sessions lacking sensor data would contribute zero to your fitness and fatigue tracking, creating gaps in your load history.",
  range: "Fixed at 30 TSS per hour of activity.",
  limitations:
    "Highly inaccurate for intense or very easy sessions. A 1-hour threshold effort and a 1-hour walk both receive 30 TSS. Use a heart rate strap or power meter for meaningful load tracking.",
  unit: "TSS-equivalent",
  sports: ["all"],
  displayContext:
    'Session detail as the stress metric when no sensor data is available. Labeled as "estimated from duration".',
};

// ---------------------------------------------------------------------------
// Load metrics (src/engine/metrics.ts)
// ---------------------------------------------------------------------------

const ctl: MetricExplanation = {
  id: "ctl",
  shortLabel: "CTL",
  friendlyName: "Fitness",
  name: "Chronic Training Load",
  oneLiner: "Your fitness level built up over the past ~6 weeks of training.",
  fullExplanation:
    "CTL is a 42-day exponentially weighted moving average of daily TSS. It rises slowly when you train consistently and drops slowly when you rest. CTL represents your accumulated aerobic and muscular fitness from sustained training.",
  formula: "CTL_today = CTL_yesterday + (TSS_today - CTL_yesterday) x (1 - e^(-1/42))",
  analogy:
    "CTL is like your savings account balance. Each workout is a deposit. The balance grows slowly with consistent contributions and shrinks gradually if you stop depositing.",
  whyItMatters:
    "CTL is the single best number for tracking whether your overall fitness is trending up or down. A rising CTL means your training is building fitness; a falling CTL means you are losing it.",
  range:
    "Higher = more fit. Typical: 40-70 recreational, 70-100 competitive amateur, 100+ elite. Takes 4-6 weeks of data to stabilize.",
  limitations:
    "CTL does not distinguish between productive and junk miles. It also takes 4-6 weeks of consistent data to become meaningful — early values are artificially low because the EWMA initializes at zero.",
  unit: "TSS/day",
  sports: ["all"],
  displayContext:
    'Main dashboard PMC chart as a trend line. Label as "Fitness" for beginners. Warn when data history is under 6 weeks.',
};

const atl: MetricExplanation = {
  id: "atl",
  shortLabel: "ATL",
  friendlyName: "Fatigue",
  name: "Acute Training Load",
  oneLiner:
    "How much training stress you have accumulated over the past ~week.",
  fullExplanation:
    "ATL is a 7-day exponentially weighted moving average of daily TSS. It spikes after hard training blocks and drops quickly when you rest. ATL captures short-term fatigue that your body needs to recover from.",
  formula: "ATL_today = ATL_yesterday + (TSS_today - ATL_yesterday) x (1 - e^(-1/7))",
  analogy:
    "ATL is like your credit card bill — it reflects your recent spending (training). A big week of training runs up the bill fast. A rest week lets it settle back down.",
  whyItMatters:
    "ATL helps you gauge your current fatigue. When ATL is high relative to your CTL, you are carrying more fatigue than your fitness can comfortably support — a signal to back off or taper.",
  range:
    "Relative to CTL: ATL significantly above CTL means high fatigue. ATL near or below CTL means you are well-recovered.",
  limitations:
    "ATL has a short memory (7 days), so a single massive day can spike it disproportionately. It does not account for sleep, nutrition, or other recovery factors.",
  unit: "TSS/day",
  sports: ["all"],
  displayContext:
    'PMC chart alongside CTL. Label as "Fatigue" for beginners. Color-code the gap between CTL and ATL.',
};

const tsb: MetricExplanation = {
  id: "tsb",
  shortLabel: "TSB",
  friendlyName: "Readiness",
  name: "Training Stress Balance",
  oneLiner:
    "How fresh or fatigued you are right now — positive means rested, negative means tired.",
  fullExplanation:
    "TSB is the difference between your fitness (CTL) and your fatigue (ATL). Positive values mean fitness exceeds fatigue — you are rested and ready to perform. Negative values mean fatigue exceeds fitness — you are tired but potentially adapting. TSB is the primary number for race-day readiness.",
  formula: "TSB = CTL - ATL",
  analogy:
    "TSB is your energy balance. Positive means you have reserves in the tank. Negative means you are running on credit. A little bit of credit is fine (that is how you build fitness), but too much debt leads to burnout.",
  whyItMatters:
    "TSB is the primary number for race-day readiness. Most athletes perform best with TSB between +5 and +25. It is also the key metric for tapering — gradually reducing fatigue while preserving fitness.",
  range:
    "Above +25: detraining risk. +5 to +25: fresh, race-ready. -10 to +5: normal training. -30 to -10: productive overload. Below -30: high fatigue, rest recommended.",
  limitations:
    "TSB is only as good as the TSS data feeding it. Inaccurate FTP, missing sessions, or reliance on duration estimates will distort the picture. A very high TSB (>25) does not mean super fresh — it means you are detraining.",
  unit: "TSS/day",
  sports: ["all"],
  displayContext:
    "Headline metric on the coaching/dashboard view. Show historical trend on PMC chart. Use form status labels for actionable advice.",
};

const acwr: MetricExplanation = {
  id: "acwr",
  shortLabel: "ACWR",
  friendlyName: "Ramp Rate",
  name: "Acute-to-Chronic Workload Ratio",
  oneLiner:
    "Compares your recent training load to your long-term average — tells you if you are ramping up safely.",
  fullExplanation:
    "ACWR divides your acute load (ATL) by your chronic load (CTL) to measure how rapidly you are changing your training volume. A ratio around 1.0 means you are training at your usual level. The EWMA-based approach avoids mathematical artefacts present in the older rolling-average method.",
  formula: "ACWR = ATL / CTL (returns 0 when CTL = 0)",
  analogy:
    "Think of ACWR like a speedometer for your training ramp rate. Cruising at 0.8-1.3 is safe highway speed. Above 1.5, you are speeding and risk a crash (injury). Below 0.8, you are coasting and losing momentum.",
  whyItMatters:
    "Rapid spikes in training load are one of the strongest predictors of injury in sport. ACWR gives athletes an early warning when they are increasing too fast — before symptoms appear.",
  range:
    "Below 0.8: undertraining, losing fitness. 0.8-1.3: sweet spot, safe progression. 1.3-1.5: caution, elevated risk. Above 1.5: danger zone, high injury risk.",
  limitations:
    "ACWR is meaningless in the first few weeks of training (CTL near zero produces huge ratios). It also does not differentiate between types of load (running volume vs. intensity). Thresholds come from team-sport research and may differ for endurance athletes. Note: ACWR has mathematical coupling — acute load is a subset of the chronic window — which inflates the correlation between the ratio and injury. Recent literature debates whether ACWR thresholds add predictive value beyond absolute load measures alone.",
  sports: ["all"],
  displayContext:
    "Coaching dashboard alongside injury risk status. Use a color-coded gauge (green/yellow/red). Hide or grey out when data history is under 4 weeks.",
};

// ---------------------------------------------------------------------------
// Normalized metrics (src/engine/normalize.ts)
// ---------------------------------------------------------------------------

const normalizedPower: MetricExplanation = {
  id: "normalizedPower",
  shortLabel: "NP",
  friendlyName: "Normalized Power",
  name: "Normalized Power",
  oneLiner:
    "The true intensity of your ride, accounting for the extra cost of surging and recovering.",
  fullExplanation:
    "Normalized Power applies a 30-second rolling average to your power data, then raises each value to the 4th power before averaging and taking the 4th root. This penalizes variability — a ride with lots of surges produces a higher NP than a steady ride at the same average power, reflecting the non-linear physiological cost.",
  formula:
    "30s rolling average of power -> raise each to 4th power -> average -> 4th root",
  analogy:
    "Average power is like your average driving speed on a trip. NP is more like how much fuel you actually burned. Stop-and-go traffic uses more fuel than cruising at the same average speed.",
  whyItMatters:
    "NP is the foundation of TSS and Intensity Factor. It gives a more honest picture of ride intensity than average power, especially for group rides, races, and hilly courses where power output is highly variable.",
  range:
    "Compare to your FTP. NP close to FTP means a threshold-level effort. NP at 75% of FTP is endurance pace. Above FTP for a sustained ride is very hard.",
  limitations:
    "NP requires a power meter (cycling-specific). The 30-second smoothing means very short efforts (<30s) are somewhat diluted. NP also loses meaning for very short sessions (<5 minutes).",
  unit: "W",
  sports: ["cycling"],
  displayContext:
    "Session detail view for cycling activities. Always pair with Average Power.",
};

const gradeAdjustedPace: MetricExplanation = {
  id: "gradeAdjustedPace",
  shortLabel: "GAP",
  friendlyName: "Grade Adjusted Pace",
  name: "Grade Adjusted Pace",
  oneLiner:
    "Your equivalent flat-ground pace, adjusted for hills using metabolic cost modeling.",
  fullExplanation:
    "GAP uses the Minetti cost-of-transport curve to convert hilly running into an equivalent flat pace. Running uphill at 6:00/km might be as hard as running 4:30/km on flat. GAP shows that equivalent effort so you can compare hilly and flat workouts fairly. The gradient is clamped to +/- 45% to avoid polynomial blow-up.",
  formula:
    "C(i) = 155.4i^5 - 30.4i^4 - 43.3i^3 + 46.3i^2 + 19.5i + 3.6, normalized against flat cost of 3.6",
  analogy:
    "GAP is like adjusting your driving speed for road conditions. Going 60 km/h uphill in 3rd gear uses the same engine effort as 90 km/h on flat in 5th. GAP shows the flat road equivalent of your effort.",
  whyItMatters:
    "For trail runners and anyone training on hilly terrain, actual pace is misleading. GAP lets you see your true effort regardless of terrain, making it possible to pace evenly by effort on hilly courses.",
  range:
    "Interpreted as pace (min/km). GAP faster than actual pace = uphill effort. GAP slower than actual pace = downhill coasting.",
  limitations:
    "GAP requires elevation data, which can be noisy from GPS barometers (especially under tree cover). The Minetti curve may underestimate the effort of very steep downhill running due to eccentric muscle damage not captured by metabolic cost. Running-specific only.",
  unit: "sec/km",
  sports: ["running"],
  displayContext:
    "Session detail for running activities with elevation data. Display alongside actual pace.",
};

// ---------------------------------------------------------------------------
// Session analysis (src/engine/laps.ts)
// ---------------------------------------------------------------------------

const recovery: MetricExplanation = {
  id: "recovery",
  shortLabel: "Recovery",
  friendlyName: "HR Recovery",
  name: "Heart Rate Recovery Between Intervals",
  oneLiner: "How quickly your heart rate drops between work intervals.",
  fullExplanation:
    "HR recovery measures the average drop in heart rate from the end of a work interval to the end of the following rest interval. Faster recovery indicates a well-adapted autonomic nervous system — specifically, strong parasympathetic reactivation. This metric is calculated automatically when the app detects work/rest interval pairs from your lap data.",
  analogy:
    "Think of your heart like an engine cooling down after a hard acceleration. A fit engine returns to idle quickly. A deconditioned engine stays revved up longer.",
  whyItMatters:
    "HR recovery is one of the most reliable non-invasive indicators of cardiovascular fitness and training adaptation. Improving recovery between intervals over weeks signals that your aerobic system is getting stronger, independent of pace or power gains.",
  range:
    "Above 25 bpm: strong recovery, well-adapted cardiovascular system. 15-25 bpm: adequate recovery, typical for moderately trained athletes. Below 15 bpm: slow recovery, may indicate fatigue, dehydration, or room for aerobic base work.",
  limitations:
    "Affected by heat, hydration, caffeine, sleep quality, and accumulated fatigue. A single session value can be misleading — track the trend over multiple interval sessions. Also depends on interval structure: shorter rest periods naturally show smaller HR drops.",
  sports: ["all"],
  displayContext:
    "Session detail view for sessions with detected work/rest interval pairs. Show average recovery with a color-coded label.",
};

const pacingTrend: MetricExplanation = {
  id: "pacingTrend",
  shortLabel: "Pacing",
  friendlyName: "Pacing Trend",
  name: "Pace Drift Analysis",
  oneLiner: "Whether your pace held steady, faded, or built across laps.",
  fullExplanation:
    "Pacing trend analyzes the pace change from the first lap to the last lap, expressed as a percentage drift. A positive drift means you slowed down (fading), while a negative drift means you sped up (building). Drift within 3% is considered stable pacing. The analysis requires at least 3 laps to be meaningful.",
  formula:
    "Drift% = ((lastLapPace - firstLapPace) / firstLapPace) x 100. Fading: >3%, Stable: -3% to 3%, Building: <-3%",
  analogy:
    "Pacing trend is like monitoring your fuel gauge during a road trip. Even fuel consumption (stable) means you planned well. Running out early (fading) means you started too fast. Having reserves at the end (building) means you were conservative — or executed a perfect negative split.",
  whyItMatters:
    "Even pacing or a slight negative split is the gold standard for distance racing. Fading indicates you went out too hard or lacked endurance for the distance. Tracking this across sessions helps you learn your optimal pacing strategy.",
  range:
    "Beyond +3%: fading — pace slowed across laps, typical fatigue pattern. -3% to +3%: stable — consistent pacing, well-executed effort. Beyond -3%: building — pace improved, negative split strategy.",
  limitations:
    "Only meaningful with 3+ laps. Does not account for terrain changes between laps (hills vs. flats). Wind, temperature, and tactical racing decisions can cause drift that does not reflect fitness. Auto-laps at fixed distances work best; manual laps of unequal length can skew results.",
  sports: ["running", "cycling"],
  displayContext:
    "Session detail view for sessions with 3+ laps. Show drift percentage and a color-coded trend label.",
};

// ---------------------------------------------------------------------------
// Training zones (src/engine/zones.ts)
// ---------------------------------------------------------------------------

const trainingZones: MetricExplanation = {
  id: "trainingZones",
  shortLabel: "Zones",
  friendlyName: "Training Zones",
  name: "Training Zones",
  oneLiner:
    "Pace-based intensity zones derived from your threshold pace.",
  fullExplanation:
    "Training zones divide the intensity spectrum into distinct bands based on percentages of your threshold pace. Each zone targets a different physiological system — from easy recovery (Zone 1) through lactate threshold (Zone 4) to neuromuscular power (Zone 5). Zones are recalculated automatically whenever you update your threshold pace in settings.",
  analogy:
    "Zones are like gears on a bicycle. Each gear is suited to different terrain and effort. You would not climb a hill in top gear or cruise the flats in first. Training zones help you pick the right gear for each workout's goal.",
  whyItMatters:
    "Running every workout at the same effort is the most common training mistake. Zones ensure easy days are truly easy (building aerobic base) and hard days are truly hard (driving adaptation). This polarization produces better results than moderate-intensity monotony.",
  range:
    "Zone 1: Recovery. Zone 2: Aerobic/easy. Zone 3: Tempo. Zone 4: Threshold. Zone 5: VO2max and above. Each zone is defined as a pace range relative to your threshold.",
  limitations:
    "Zones are only as accurate as your threshold pace setting. If your threshold pace is outdated, all zones shift. Zones also assume flat terrain — on hills, heart rate or perceived effort may be a better intensity guide than pace.",
  sports: ["running"],
  displayContext:
    "Coaching page as a quick reference. Show zone name, color, and pace range.",
};

// ---------------------------------------------------------------------------
// Training Effect (src/engine/trainingEffect.ts)
// ---------------------------------------------------------------------------

const aerobicTE: MetricExplanation = {
  id: "aerobicTE",
  shortLabel: "Aerobic TE",
  friendlyName: "Aerobic Training Effect",
  name: "Aerobic Training Effect",
  oneLiner:
    "How much this session improved your aerobic endurance, on a 0–5 scale.",
  fullExplanation:
    "Aerobic Training Effect uses per-sample Banister TRIMP [Banister1991] — accumulating heart rate impulse across every second of the session. The raw TRIMP is divided by a reference value (1 hour at lactate threshold per [Karvonen1957] and [Swain1998]) and raised to a sub-linear power (0.25 per [Wenger1986]) to model diminishing returns from extended duration. The result is scaled by your chronic fitness level (CTL) so the same workout produces a smaller TE as you get fitter. The anchor point ensures that 1 hour at lactate threshold (88% HRR) produces TE 3.0 (Improving).",
  formula:
    "For each record: TRIMP += dt × HRR × a × exp(b × HRR). trimpRef = 60 × LT_HRR × a × exp(b × LT_HRR). TE = clamp(3.0 × (TRIMP / (trimpRef × fitnessScale))^0.25, 0, 5)",
  analogy:
    "Think of Aerobic TE like a receipt for your workout. A score of 2 means you kept the lights on (maintaining fitness). A score of 4 means you made a serious deposit in your endurance bank account.",
  whyItMatters:
    "Aerobic TE tells you whether a session was hard enough to drive adaptation or just maintenance. Over time, you need higher TE sessions to keep improving, while lower TE sessions serve as active recovery.",
  range:
    "0–0.9: No effect. 1–1.9: Minor benefit. 2–2.9: Maintaining fitness. 3–3.9: Improving fitness. 4–4.9: Highly improving. 5.0: Overreaching.",
  limitations:
    "Requires accurate max HR and resting HR settings. HR lag means the first few minutes of intervals may undercount intensity. Sessions without HR data cannot be scored.",
  sports: ["all"],
  displayContext:
    "Session detail view as a gauge dial alongside Anaerobic TE. Only shown for sessions with HR data.",
};

const anaerobicTE: MetricExplanation = {
  id: "anaerobicTE",
  shortLabel: "Anaerobic TE",
  friendlyName: "Anaerobic Training Effect",
  name: "Anaerobic Training Effect",
  oneLiner:
    "How much this session stressed your anaerobic (high-intensity) energy system, on a 0–5 scale.",
  fullExplanation:
    "Anaerobic Training Effect measures accumulated time and intensity above the second ventilatory threshold (VT2 at 90% HRR per [Swain1998], [Stagno2007], [ACSM2018]). The impulse above VT2 is normalized by the available anaerobic range (1.0 − VT2_HRR). The result is anchored so that 6 minutes at VO2max ([Billat1999] mean tlim) produces TE 3.0 (Improving). Like Aerobic TE, the result is scaled by chronic fitness so fitter athletes need harder efforts to score high.",
  formula:
    "For each record with HRR > 0.90: impulse += dt × (HRR − 0.90) / (1.0 − 0.90). TE = clamp(3.0 × impulse / (6.0 × fitnessScale), 0, 5)",
  analogy:
    "Anaerobic TE is like measuring how many times you redlined your engine during a drive. A low score means you cruised. A high score means you spent serious time in the red zone.",
  whyItMatters:
    "Anaerobic capacity is what powers sprints, hills, and race surges. A high Anaerobic TE confirms you pushed into the high-intensity zone enough to stimulate VO2max and lactate tolerance improvements.",
  range:
    "0–0.9: No anaerobic stimulus. 1–1.9: Minor. 2–2.9: Moderate high-intensity work. 3–3.9: Significant VO2max stimulus. 4–4.9: Very high anaerobic stress. 5.0: Overreaching.",
  limitations:
    "HR-based detection has inherent lag — short sprints (< 30s) may not raise HR above 90% HRR even when truly anaerobic. Power-based anaerobic detection would be more accurate but is not yet supported.",
  sports: ["all"],
  displayContext:
    "Session detail view as a gauge dial alongside Aerobic TE. Only shown for sessions with HR data.",
};

// ---------------------------------------------------------------------------
// Session stats (src/features/training/SessionStatsGrid.tsx)
// ---------------------------------------------------------------------------

const avgHr: MetricExplanation = {
  id: "avgHr",
  shortLabel: "Avg HR",
  friendlyName: "Average Heart Rate",
  name: "Average Heart Rate",
  oneLiner:
    "The mean heart rate across the entire session, reflecting overall cardiovascular effort.",
  fullExplanation:
    "Average heart rate is the arithmetic mean of all heart rate samples recorded during the session. It provides a single-number summary of cardiovascular effort. Combined with duration, it feeds into TRIMP and helps gauge whether a session was easy, moderate, or hard relative to your personal heart rate zones.",
  analogy:
    "Average HR is like the average speed on your car's trip computer — it smooths out all the stops and sprints into one number that summarizes the whole journey.",
  whyItMatters:
    "Tracking average HR across similar workouts reveals aerobic adaptation. As fitness improves, the same pace or power produces a lower average HR — one of the most reliable signs of progress.",
  range:
    "Zone 1–2 (easy): 50–70% of max HR. Zone 3 (tempo): 70–80%. Zone 4 (threshold): 80–90%. Zone 5 (VO2max): 90–100%. Actual values depend on individual max HR.",
  limitations:
    "Affected by caffeine, heat, hydration, sleep, and stress. Cardiac drift inflates average HR on longer sessions even at constant effort. Does not capture intensity variability — a session with big HR spikes and valleys can have the same average as a steady-state session.",
  unit: "bpm",
  sports: ["all"],
  displayContext:
    "Session detail stats grid. Always shown when HR data is available.",
};

const avgPace: MetricExplanation = {
  id: "avgPace",
  shortLabel: "Pace",
  friendlyName: "Average Pace",
  name: "Average Pace",
  oneLiner:
    "Your average time per kilometer, the primary intensity metric for running and swimming.",
  fullExplanation:
    "Average pace is calculated from total distance divided by total moving time, expressed as minutes and seconds per kilometer. It is the most intuitive intensity metric for runners and swimmers, directly comparable across sessions of different distances.",
  analogy:
    "Pace is like the price per kilogram at the grocery store — it normalizes the cost (time) by quantity (distance) so you can compare regardless of how much you bought.",
  whyItMatters:
    "Pace is the primary feedback loop for runners. Tracking average pace across similar sessions reveals fitness trends — getting faster at the same heart rate, or sustaining the same pace with less effort.",
  range:
    "Highly individual. Recreational runners: 6:00–7:30/km. Competitive amateurs: 4:30–6:00/km. Elite: sub-3:30/km. Compare to your own history and threshold pace.",
  limitations:
    "Pace is GPS-dependent and affected by terrain, wind, and altitude. On hilly routes, actual pace is misleading — use Grade Adjusted Pace instead. Also doesn't account for stops unless the watch uses auto-pause.",
  unit: "min/km",
  sports: ["running", "swimming"],
  displayContext:
    "Session detail stats grid for running and swimming sessions.",
};

const avgSpeed: MetricExplanation = {
  id: "avgSpeed",
  shortLabel: "Speed",
  friendlyName: "Average Speed",
  name: "Average Speed",
  oneLiner:
    "Your average speed in km/h, the primary intensity metric for cycling.",
  fullExplanation:
    "Average speed is total distance divided by total time, expressed in kilometers per hour. For cycling, speed is a more natural metric than pace because it maps directly to the experience — faster feels faster. It enables quick comparison between rides.",
  analogy:
    "Speed is the cyclist's speedometer reading averaged over the whole ride. It answers the simple question: how fast did I go?",
  whyItMatters:
    "While power is the gold standard for cycling intensity, speed provides accessible context. Comparing speed across similar routes reveals aerobic gains, equipment changes, or wind conditions.",
  range:
    "Recreational cycling: 20–25 km/h. Club riders: 25–32 km/h. Competitive: 32–40 km/h. Elite TT: 45+ km/h. Highly affected by terrain and wind.",
  limitations:
    "Speed is heavily influenced by wind, drafting, terrain, road surface, and bike setup. Two rides at the same power can differ by 10+ km/h due to conditions. Power is a far more reliable intensity metric for cycling.",
  unit: "km/h",
  sports: ["cycling"],
  displayContext: "Session detail stats grid for cycling sessions.",
};

const avgPower: MetricExplanation = {
  id: "avgPower",
  shortLabel: "Avg Power",
  friendlyName: "Average Power",
  name: "Average Power",
  oneLiner:
    "The mean power output across the session, measuring raw mechanical work.",
  fullExplanation:
    "Average power is the arithmetic mean of all power meter samples during the session. It represents the raw mechanical work you produced, unweighted by variability. Compare with Normalized Power to understand how variable your effort was — a large gap between AP and NP indicates a surgy, variable effort.",
  analogy:
    "If Normalized Power is your fuel bill, Average Power is the odometer reading — it tells you what happened mechanically, without accounting for the extra cost of stop-and-go.",
  whyItMatters:
    "Average Power provides a baseline for comparing efforts. The ratio of NP to AP (Variability Index) reveals pacing quality — closer to 1.0 means steadier effort.",
  range:
    "Compare to your FTP. Endurance rides: 55–75% FTP. Tempo: 76–90%. Threshold: 91–105%. Above threshold for sustained rides is very hard.",
  limitations:
    "Average power underestimates the true physiological cost of variable efforts. A ride alternating between 100W and 300W has the same average as steady 200W but is significantly harder. Always consider NP alongside AP.",
  unit: "W",
  sports: ["cycling"],
  displayContext:
    "Session detail stats grid for cycling sessions with power data. Shown as subDetail when Normalized Power is available.",
};

const elevation: MetricExplanation = {
  id: "elevation",
  shortLabel: "Elevation",
  friendlyName: "Elevation Gain",
  name: "Elevation Gain & Loss",
  oneLiner:
    "Total meters climbed and descended during the session.",
  fullExplanation:
    "Elevation gain sums every uphill segment, while elevation loss sums every downhill segment. Together they quantify the vertical challenge of a session. On hilly routes, elevation gain is often a better predictor of effort than distance alone.",
  analogy:
    "Elevation gain is like counting flights of stairs — two 10km runs can feel completely different if one climbs 500m and the other is flat.",
  whyItMatters:
    "Elevation gain directly affects energy expenditure and pacing strategy. Tracking it helps you prepare for hilly races and understand why some sessions felt harder than the pace suggests.",
  range:
    "Flat: under 100m gain. Rolling: 100–300m. Hilly: 300–700m. Mountainous: 700m+. All relative to session distance.",
  limitations:
    "GPS-derived elevation is noisy (±3–10m per sample). Barometric altimeters are more accurate but drift with weather changes. Small undulations may be filtered out by smoothing algorithms, underestimating true gain.",
  unit: "m",
  sports: ["all"],
  displayContext:
    "Session detail stats grid. Shows gain/loss as primary value with altitude range as subDetail.",
};

const cadence: MetricExplanation = {
  id: "cadence",
  shortLabel: "Cadence",
  friendlyName: "Cadence",
  name: "Average Cadence",
  oneLiner:
    "Your average steps or revolutions per minute during the session.",
  fullExplanation:
    "Cadence measures the rhythm of your movement — steps per minute for running, revolutions per minute for cycling. It is recorded by footpods, power meters, or wrist-based accelerometers. Optimal cadence varies by sport, intensity, and individual biomechanics.",
  analogy:
    "Cadence is like the RPM gauge in a car. Too low and you're lugging the engine; too high and you're over-revving. The sweet spot depends on the conditions and your engine.",
  whyItMatters:
    "For runners, higher cadence (170–180 spm) is associated with lower injury risk and better running economy. For cyclists, cadence affects fatigue distribution between cardiovascular and muscular systems.",
  range:
    "Running: 160–180+ spm (elite often 180+). Cycling: 80–100 rpm (varies by terrain and effort). Lower cadence = more muscular load, higher cadence = more cardiovascular load.",
  limitations:
    "Wrist-based cadence detection can be inaccurate, especially at low speeds. Optimal cadence is individual — forcing a specific cadence that doesn't match your biomechanics can increase injury risk.",
  unit: "rpm",
  sports: ["all"],
  displayContext:
    "Session detail stats grid when cadence data is available.",
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const METRIC_EXPLANATIONS: Record<MetricId, MetricExplanation> = {
  // Stress metrics
  tss,
  trimp,
  duration,
  // Load metrics
  ctl,
  atl,
  tsb,
  acwr,
  // Normalized metrics
  normalizedPower,
  gradeAdjustedPace,
  // Session analysis
  recovery,
  pacingTrend,
  // Training zones
  trainingZones,
  // Training Effect
  aerobicTE,
  anaerobicTE,
  // Session stats
  avgHr,
  avgPace,
  avgSpeed,
  avgPower,
  elevation,
  cadence,
};
