/**
 * THE FORTUNE ARC (S18 Movement 34, ADR-075) — §A9's back-half wealth curve. The
 * property market, the flip loop, rent, and the fleet are tuned so a player who
 * leans into them tracks this NET-WORTH curve: a tight 1995 economy in Ch.1–3 that
 * escalates BY DESIGN to a back-half power fantasy (Ch.1 ~$1K → Ch.10 $3B+). The
 * Ember trail never cares about money — net worth is a number, the callers are the
 * score — but the curve is the target `balance-sim` tunes the DATA against.
 */

export interface FortuneTarget {
  band: string;
  /** the net-worth FLOOR a wealth-leaning player should be near by this chapter */
  netWorth: number;
}

export const FORTUNE_ARC: readonly FortuneTarget[] = [
  { band: 'ch1', netWorth: 1_000 },
  { band: 'ch2', netWorth: 4_000 },
  { band: 'ch3', netWorth: 15_000 },
  { band: 'ch4', netWorth: 60_000 },
  { band: 'ch5', netWorth: 250_000 },
  { band: 'ch6', netWorth: 1_200_000 },
  { band: 'ch7', netWorth: 8_000_000 },
  { band: 'ch8', netWorth: 60_000_000 },
  { band: 'ch9', netWorth: 400_000_000 },
  { band: 'ch10', netWorth: 3_000_000_000 },
];

function bandIndex(band: string): number {
  return Number(/^ch(\d+)$/.exec(band)?.[1] ?? 1);
}

/** the Fortune-Arc net-worth target at a chapter (the nearest band ≤ chapter) */
export function fortuneTarget(chapter: number): number {
  let t = FORTUNE_ARC[0].netWorth;
  for (const row of FORTUNE_ARC) if (bandIndex(row.band) <= chapter) t = row.netWorth;
  return t;
}

/** how a net worth reads against the arc: under / on-track / ahead (±50% band) */
export function fortuneBand(netWorth: number, chapter: number): 'under' | 'on_track' | 'ahead' {
  const t = fortuneTarget(chapter);
  if (netWorth < t * 0.5) return 'under';
  if (netWorth > t * 1.5) return 'ahead';
  return 'on_track';
}
