// ---------------------------------------------------------------------------
// Metric Explanation Registry
// Pure data — no React, no state, no side effects.
// Source of truth for all metric labels, descriptions, and scientific context.
// ---------------------------------------------------------------------------

export type MetricId =
  | "tss"
  | "trimp"
  | "ctl"
  | "atl"
  | "tsb"
  | "acwr"
  | "normalizedPower"
  | "gradeAdjustedPace"
  | "efficiencyFactor"
  | "pwHrDecoupling"
  | "peakPower5min"
  | "peakPower20min"
  | "peakPower60min"
  | "peakPace5min"
  | "peakPace20min"
  | "peakPace60min"
  | "formStatus"
  | "injuryRisk"
  | "hrValidation"
  | "powerValidation"
  | "speedValidation"
  | "recovery"
  | "pacingTrend"
  | "trainingZones";

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
  formula: "CTL_today = CTL_yesterday + (TSS_today - CTL_yesterday) x (2/43)",
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
  formula: "ATL_today = ATL_yesterday + (TSS_today - ATL_yesterday) x (2/8)",
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
// Efficiency metrics (src/engine/efficiency.ts)
// ---------------------------------------------------------------------------

const efficiencyFactor: MetricExplanation = {
  id: "efficiencyFactor",
  shortLabel: "EF",
  friendlyName: "Efficiency",
  name: "Efficiency Factor",
  oneLiner:
    "How much output (power or speed) you get per heartbeat — higher means fitter.",
  fullExplanation:
    "Efficiency Factor measures your aerobic efficiency by dividing output (Normalized Power for cycling, speed for running) by average heart rate. A rising EF over weeks indicates improving aerobic fitness. Unlike threshold tests, EF can be tracked from regular easy and moderate sessions.",
  formula: "Cycling: NP / avg HR. Running: (speed x 100) / avg HR",
  analogy:
    "EF is like your car's fuel efficiency (km per liter). More output for the same fuel (heartbeats) means your engine is running better.",
  whyItMatters:
    "EF is one of the best long-term aerobic fitness indicators. A steadily rising EF confirms that base training is working, without requiring maximum effort tests.",
  range:
    "Cycling: typically 1.0-2.0 (NP/HR). Higher = better. Running: sport-specific scaling. Track the trend over 4+ weeks, not individual values.",
  limitations:
    "EF is affected by day-to-day HR variability (sleep, stress, caffeine, heat). Single-session values are noisy; the trend over 4+ weeks is what matters.",
  sports: ["cycling", "running"],
  displayContext:
    "Trend chart over 4-8 weeks, filtered by sport. Do not overemphasize single-session values.",
};

const pwHrDecoupling: MetricExplanation = {
  id: "pwHrDecoupling",
  shortLabel: "Decoupling",
  friendlyName: "Aerobic Decoupling",
  name: "Power-to-Heart-Rate Decoupling",
  oneLiner:
    "Whether your heart rate drifted up or power faded in the second half of a workout.",
  fullExplanation:
    "Decoupling compares the power-to-HR ratio in the first half vs. second half of a session. Less than 5% drift means your aerobic system handled the effort efficiently. Higher decoupling suggests your body worked harder to maintain the same output as the session progressed.",
  formula:
    "Decoupling% = ((firstHalf_Pw/HR - secondHalf_Pw/HR) / firstHalf_Pw/HR) x 100",
  analogy:
    "It is like checking if your car needs more gas to maintain the same speed later in a road trip. If fuel consumption stays steady, the engine is running clean. If it rises, something is laboring.",
  whyItMatters:
    "Decoupling below 5% over a 60-90 minute steady effort is one of the clearest signals of aerobic fitness readiness. It helps athletes decide if their base training is sufficient to move into higher-intensity phases.",
  range:
    "Below 5%: excellent aerobic base. 5-10%: moderate, room for improvement. Above 10%: significant drift, more base work needed.",
  limitations:
    "Only meaningful for steady-state aerobic sessions (zone 2-3). Interval sessions will show high decoupling by design. Requires both power and HR data. Heat and dehydration can cause cardiac drift that mimics poor decoupling.",
  unit: "%",
  sports: ["cycling"],
  displayContext:
    "Session detail for steady-state cycling sessions. Include the 5% threshold as a reference line.",
};

// ---------------------------------------------------------------------------
// Personal bests (src/engine/records.ts)
// ---------------------------------------------------------------------------

const peakPower5min: MetricExplanation = {
  id: "peakPower5min",
  shortLabel: "5min Power",
  friendlyName: "5-Min Peak Power",
  name: "5-Minute Peak Power",
  oneLiner:
    "Your best sustained power over 5 minutes — strongly correlated with VO2max.",
  fullExplanation:
    "Peak 5-minute power is found by sliding a 5-minute window across your ride data and recording the highest average. This duration approximates VO2max power, your maximal aerobic capacity. Improvements here indicate gains in high-end aerobic fitness.",
  analogy:
    "Think of PBs like high scores in a video game. Beating your 5-minute high score means your top-end aerobic engine has genuinely improved.",
  whyItMatters:
    "The 5-minute best reflects your ceiling aerobic power. It is useful for setting interval targets and tracking VO2max-level fitness over time.",
  range:
    "Highly individual. Compare to your own previous bests, not to others. Track within 90-day windows for current form.",
  limitations:
    "Only as accurate as your power meter. Short-duration power PBs can be inflated by sprint data. The 90-day window means old PBs expire, which can feel demotivating.",
  unit: "W",
  sports: ["cycling"],
  displayContext:
    "Personal Records view. Celebrate new PBs with notifications.",
};

const peakPower20min: MetricExplanation = {
  id: "peakPower20min",
  shortLabel: "20min Power",
  friendlyName: "20-Min Peak Power",
  name: "20-Minute Peak Power",
  oneLiner:
    "Your best sustained power over 20 minutes — a practical FTP estimator (95% of this value).",
  fullExplanation:
    "Peak 20-minute power is the highest average power sustained over a 20-minute window. It is commonly used to estimate FTP by multiplying by 0.95. This duration correlates strongly with lactate threshold, the intensity you can sustain for about an hour.",
  analogy:
    "Your 20-minute power is the most practical test of your threshold fitness. Beating this score means your endurance engine has gotten stronger.",
  whyItMatters:
    "The 20-minute best is practical for estimating FTP (multiply by 0.95). It reflects meaningful fitness gains at the threshold level that translate directly to race performance.",
  range:
    "Multiply by 0.95 for an FTP estimate. Recreational: 150-250W, competitive amateur: 250-350W, elite: 350W+. Always compare to your own history.",
  limitations:
    "A true 20-minute all-out effort is rare in normal training. Most 20-minute peaks come from hard rides or intervals, which may underestimate true 20-minute capacity. Pacing matters significantly.",
  unit: "W",
  sports: ["cycling"],
  displayContext: "Personal Records view. Show FTP estimate alongside.",
};

const peakPower60min: MetricExplanation = {
  id: "peakPower60min",
  shortLabel: "60min Power",
  friendlyName: "60-Min Peak Power",
  name: "60-Minute Peak Power",
  oneLiner:
    "Your best sustained power over 60 minutes — the gold standard for functional threshold.",
  fullExplanation:
    "Peak 60-minute power is the highest average power sustained over a full hour. This is the closest practical measure of true Functional Threshold Power. It is rarely tested in isolation but emerges from long races and endurance rides.",
  analogy:
    "Your 60-minute power is the ultimate endurance benchmark. It is the speed your engine can maintain for a full hour without blowing up.",
  whyItMatters:
    "The 60-minute best represents your true endurance capacity and is the gold standard for FTP. Improvements here are the most meaningful indicator of sustained fitness gains.",
  range:
    "Very close to actual FTP. Recreational: 130-220W, competitive: 220-300W, elite: 300W+. Compare to your own history.",
  limitations:
    "Rarely achieved outside dedicated tests or races. Training rides seldom include a full hour at threshold, so this PB updates less frequently than shorter durations.",
  unit: "W",
  sports: ["cycling"],
  displayContext: "Personal Records view alongside other power durations.",
};

const peakPace5min: MetricExplanation = {
  id: "peakPace5min",
  shortLabel: "5min Pace",
  friendlyName: "5-Min Peak Pace",
  name: "5-Minute Peak Pace",
  oneLiner:
    "Your fastest sustained pace over 5 minutes — reflects your top-end aerobic speed.",
  fullExplanation:
    "Peak 5-minute pace is found by sliding a 5-minute window across your run data and recording the fastest sustained speed (converted to pace). This duration approximates VO2max pace. Improvements indicate gains in high-end running fitness.",
  analogy:
    "Your 5-minute pace PB is your running speed high score. Beating it means your legs and lungs have genuinely leveled up.",
  whyItMatters:
    "The 5-minute best reflects your ceiling aerobic speed. It helps set interval targets and track improvements in running economy and VO2max.",
  range:
    "Highly individual. Compare to your own previous bests. Track within 90-day windows for current form.",
  limitations:
    "GPS-derived pace can be noisy, especially in areas with poor satellite coverage. Downhill segments can produce artificially fast pace values.",
  unit: "sec/km",
  sports: ["running"],
  displayContext:
    "Personal Records view. Celebrate new PBs with notifications.",
};

const peakPace20min: MetricExplanation = {
  id: "peakPace20min",
  shortLabel: "20min Pace",
  friendlyName: "20-Min Peak Pace",
  name: "20-Minute Peak Pace",
  oneLiner:
    "Your fastest sustained pace over 20 minutes — a strong indicator of threshold fitness.",
  fullExplanation:
    "Peak 20-minute pace is the fastest average pace sustained over a 20-minute window. This correlates with lactate threshold pace for runners — the speed you can sustain for roughly an hour. It is one of the most useful benchmarks for race prediction.",
  analogy:
    "Your 20-minute pace is the best test of your distance-running engine. A faster score here translates directly to faster race times.",
  whyItMatters:
    "The 20-minute best is practical for estimating threshold pace and predicting race performance. It reflects meaningful fitness at the intensity that matters most for distance racing.",
  range:
    "Recreational: 6:00-7:00/km, competitive amateur: 4:30-6:00/km, elite: sub-3:30/km. Always compare to your own history.",
  limitations:
    "GPS accuracy matters significantly. Hilly terrain produces pace values that do not reflect true effort — use GAP for hilly comparisons.",
  unit: "sec/km",
  sports: ["running"],
  displayContext: "Personal Records view. Show as formatted min:sec/km.",
};

const peakPace60min: MetricExplanation = {
  id: "peakPace60min",
  shortLabel: "60min Pace",
  friendlyName: "60-Min Peak Pace",
  name: "60-Minute Peak Pace",
  oneLiner:
    "Your fastest sustained pace over 60 minutes — your true endurance speed.",
  fullExplanation:
    "Peak 60-minute pace is the fastest average pace sustained over a full hour. This is the running equivalent of 60-minute peak power — it represents your true threshold endurance speed and is the best predictor of race performance at distances from 10K to half marathon.",
  analogy:
    "Your 60-minute pace is the cruise speed your running engine can maintain for a full hour. It is the ultimate test of endurance.",
  whyItMatters:
    "The 60-minute best is the most meaningful pace benchmark for distance runners. Improvements here directly predict faster race times.",
  range:
    "Very close to true threshold pace. Compare to your own history and use for race pace planning.",
  limitations:
    "Rarely achieved outside races or dedicated tempo runs. GPS noise accumulates over longer efforts. Terrain, wind, and temperature all affect pace without reflecting fitness changes.",
  unit: "sec/km",
  sports: ["running"],
  displayContext: "Personal Records view alongside other pace durations.",
};

// ---------------------------------------------------------------------------
// Coaching (src/engine/coaching.ts)
// ---------------------------------------------------------------------------

const formStatus: MetricExplanation = {
  id: "formStatus",
  shortLabel: "Form",
  friendlyName: "Training Status",
  name: "Form Status",
  oneLiner:
    "A simple label translating your TSB number into actionable training advice.",
  fullExplanation:
    "Form Status maps your Training Stress Balance into five zones: detraining, fresh, neutral, optimal overload, and overload. Each zone comes with a coaching recommendation to help you make smarter daily decisions about when to push and when to rest.",
  analogy:
    "Form Status is like a traffic light for your training. Green (fresh) means go race. Yellow (neutral/optimal) means keep training but watch your fatigue. Red (overload) means stop and recover before you break down.",
  whyItMatters:
    "Most athletes either train too hard for too long or take it too easy. Form Status provides a simple, actionable check-in that helps make smarter daily training decisions.",
  range:
    "Detraining (TSB > 25): increase volume. Fresh (5-25): race-ready. Neutral (-10 to 5): maintain. Optimal (-30 to -10): productive overload. Overload (< -30): rest recommended.",
  limitations:
    "Fixed thresholds do not account for individual variation, training history, or periodization phase. An athlete in a planned overreach block might intentionally push into overload territory. Treat labels as guidelines, not rules.",
  sports: ["all"],
  displayContext:
    "Primary indicator on the dashboard coaching view. Use traffic-light color scheme with coaching message.",
};

const injuryRisk: MetricExplanation = {
  id: "injuryRisk",
  shortLabel: "Injury Risk",
  friendlyName: "Injury Risk",
  name: "Injury Risk Assessment",
  oneLiner:
    "Uses your training ramp rate to estimate whether you are increasing load safely.",
  fullExplanation:
    "Injury Risk is derived from your ACWR value. The sweet spot (0.8-1.3) represents a gradual, sustainable progression. Above 1.3, risk rises as your body has not had time to adapt to the increased load. These thresholds are widely used guidelines originating from load-injury research, but the evidence is more nuanced than a single study — recent meta-analyses show the relationship between ACWR and injury is moderate and varies across sports and populations.",
  analogy:
    "It is like speeding up on a highway on-ramp. Accelerate gradually and you merge safely. Floor it and you risk losing control. Creep too slowly and you never reach cruising speed.",
  whyItMatters:
    "Most training injuries are load-related, not random. Monitoring injury risk helps athletes avoid the number one controllable risk factor: doing too much too soon.",
  range:
    "Undertraining (ACWR < 0.8): load is well below your baseline, risking deconditioning. Sweet spot (0.8-1.3): safe, progressive loading. Elevated (1.3-1.5): ramp rate above comfortable adaptation, monitor closely. High risk (> 1.5): load spike significantly outpacing fitness, back off.",
  limitations:
    "Does not account for training type (high-impact running vs. low-impact cycling), individual injury history, biomechanics, or tissue-specific loading. Thresholds originate from team-sport research and are population-level averages with substantial individual variation. A recent RCT found no significant injury reduction from ACWR-based load management alone, suggesting these thresholds are best used as one input among many rather than hard rules.",
  sports: ["all"],
  displayContext:
    'Coaching dashboard alongside ACWR. Use color-coded status (green/yellow/red). Frame moderate risk as "worth monitoring."',
};

// ---------------------------------------------------------------------------
// Sensor validation (src/engine/validation.ts)
// ---------------------------------------------------------------------------

const hrValidation: MetricExplanation = {
  id: "hrValidation",
  shortLabel: "HR Check",
  friendlyName: "Heart Rate Validation",
  name: "Heart Rate Sensor Validation",
  oneLiner:
    "Checks your heart rate data for physically impossible values that indicate sensor errors.",
  fullExplanation:
    "The app flags heart rate readings above 230 bpm when they persist for more than 10 consecutive records. The highest reliably recorded human heart rates are in the 220-230 range. Sustained readings above this threshold are almost certainly sensor malfunction (common during strap reconnection or battery issues).",
  analogy:
    "Think of it as a spell-checker for your workout data. It cannot fix the errors, but it highlights them so you know which numbers to trust.",
  whyItMatters:
    "Bad HR data cascades into wrong TRIMP, wrong ATL/CTL, wrong everything. Catching sensor errors early protects the integrity of all downstream metrics.",
  range: "Valid: 30-230 bpm. Above 230 bpm for 10+ records triggers a warning.",
  limitations:
    "Only catches obviously wrong data. Subtly wrong data (HR reading 10 bpm low due to poor strap contact) will pass validation but still distort metrics.",
  sports: ["all"],
  displayContext: "Session import/detail view. Use non-alarming warning style.",
};

const powerValidation: MetricExplanation = {
  id: "powerValidation",
  shortLabel: "Power Check",
  friendlyName: "Power Validation",
  name: "Power Sensor Validation",
  oneLiner:
    "Checks your power data for readings above 2500W that indicate sensor errors.",
  fullExplanation:
    "The app flags power readings above 2500W when they persist for more than 10 consecutive records. Elite track sprinters produce 2000-2500W in short bursts. Any sustained readings above this are almost certainly sensor error, often caused by power meter calibration issues or ANT+ interference.",
  analogy:
    "A data quality checkpoint that catches impossible power readings before they inflate your training metrics.",
  whyItMatters:
    "Inflated power data produces inflated NP, which inflates TSS, which distorts your entire fitness and fatigue picture. One bad session can throw off weeks of metrics.",
  range:
    "Valid: 0-2500W sustained. Above 2500W for 10+ records triggers a warning.",
  limitations:
    "Cannot detect subtly miscalibrated power meters (e.g., reading consistently 5% high). Athletes should periodically calibrate/zero their power meters.",
  sports: ["cycling"],
  displayContext: "Session import/detail view alongside other sensor warnings.",
};

const speedValidation: MetricExplanation = {
  id: "speedValidation",
  shortLabel: "Speed Check",
  friendlyName: "Speed Validation",
  name: "Speed Sensor Validation",
  oneLiner:
    "Checks your speed data for unrealistic values that indicate GPS errors.",
  fullExplanation:
    "The app flags sustained speed readings above sport-specific thresholds: 80 km/h for cycling, 25 km/h for running, 15 km/h for swimming. These thresholds are based on the upper limits of human performance. GPS glitches (tunnels, tree cover, building reflections) commonly produce impossible speed spikes.",
  analogy:
    "A sanity check that catches GPS glitches — like your watch thinking you teleported across the park.",
  whyItMatters:
    "GPS speed errors distort pace calculations, distance totals, and any pace-based personal bests. Flagging them early lets you know which session data to trust.",
  range:
    "Cycling: valid under 80 km/h. Running: valid under 25 km/h. Swimming: valid under 15 km/h. Exceeding for 10+ records triggers a warning.",
  limitations:
    "Thresholds are generous to avoid false positives. Brief GPS spikes (under 10 records) are not flagged, even though they can still affect single-point metrics. Swimming GPS data is inherently unreliable.",
  sports: ["all"],
  displayContext:
    "Session import/detail view. Sport-specific threshold messaging.",
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
// Registry
// ---------------------------------------------------------------------------

export const METRIC_EXPLANATIONS: Record<MetricId, MetricExplanation> = {
  // Stress metrics
  tss,
  trimp,
  // Load metrics
  ctl,
  atl,
  tsb,
  acwr,
  // Normalized metrics
  normalizedPower,
  gradeAdjustedPace,
  // Efficiency metrics
  efficiencyFactor,
  pwHrDecoupling,
  // Personal bests — power
  peakPower5min,
  peakPower20min,
  peakPower60min,
  // Personal bests — pace
  peakPace5min,
  peakPace20min,
  peakPace60min,
  // Coaching
  formStatus,
  injuryRisk,
  // Validation
  hrValidation,
  powerValidation,
  speedValidation,
  // Session analysis
  recovery,
  pacingTrend,
  // Training zones
  trainingZones,
};
