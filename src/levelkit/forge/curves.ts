/**
 * CHAPTER_CURVES (S15g Movement Three, ADR-046) — the §A6 difficulty ladder +
 * the §A9 economy, made DATA. The enemy forge drafts every Ch.3–10 enemy's
 * stats from a per-LEVEL baseline FITTED to the shipped §A7 Ch.1–2 roster (a
 * Cranky Mailbox at L1 ≈ 24 HP; a Jungle Jitterbug at L13 ≈ 120), banded per
 * chapter by the §A6 target-level windows. The shipped enemies fall inside
 * their chapter's SANITY band (vitest asserts it) — the curve is honest, or
 * it is useless. Pure: no Phaser, no Date.now()/Math.random() (Prime Law 2).
 */

export interface StatBlock {
  hp: number;
  offense: number;
  defense: number;
  speed: number;
  exp: number;
  cash: number;
}

/** the per-level baseline, fitted to the shipped §A7 Ch.1–2 rows */
export function statAtLevel(level: number): StatBlock {
  const L = Math.max(1, level);
  return {
    hp: Math.round(18 + 7 * L),
    offense: Math.round(3 + 1.1 * L),
    defense: Math.round(1 + 0.6 * L),
    speed: Math.round(3 + 0.7 * L),
    exp: Math.round(5 + 2 * L + 0.2 * L * L),
    cash: Math.round(2 + 1.3 * L),
  };
}

/** each chapter's §A6 LEVEL WINDOW [start, end(=target)] — the levels its
 *  regular enemies span (the boss sits a touch above end). From the Bible:
 *  Ch.2 target 13, Ch.3 18, Ch.4 22, Ch.5 26, Ch.6 30, Ch.7 35, Ch.8 40,
 *  Ch.9 46, Ch.10 52–55. */
export const CHAPTER_LEVELS: Record<number, [number, number]> = {
  1: [1, 5],
  2: [9, 13],
  3: [15, 18],
  4: [19, 22],
  5: [23, 26],
  6: [27, 30],
  7: [31, 35],
  8: [36, 40],
  9: [41, 46],
  10: [48, 54],
};

/** the §A6 BOSS HP ladder — canon, pinned (the forge's boss templates read it;
 *  the curve never invents these). Ch.10's finale shell (6,000) is bespoke. */
export const BOSS_HP: Record<number, number> = {
  // S22 (ADR-111) — THE SLOW BURN: Ch.1's bespoke Tick drops 450→150 to match the
  // lowered early-game output (Jay L1 basic = 1–2). The ladder still climbs.
  1: 60,
  2: 300,
  3: 750,
  4: 1900,
  5: 2150,
  6: 2300,
  7: 3200,
  8: 4100,
  9: 5300,
};

/** the §A6 miniboss HP (Ch.10's Alaska + Hawaii gauntlet) */
export const MINIBOSS_HP = { frost_sentinel: 2800, tiki_magma_golem: 3000 } as const;

/** the chapter's MIDPOINT baseline (the level a typical enemy of the chapter
 *  sits at) — the forge scales this by role multipliers. */
export function chapterMid(chapter: number): StatBlock {
  const [s, e] = CHAPTER_LEVELS[chapter] ?? CHAPTER_LEVELS[1];
  return statAtLevel(Math.round((s + e) / 2));
}

/**
 * The wide SANITY band for a chapter's regular enemies: a Ch.6 enemy must not
 * be Ch.1-weak or Ch.10-strong, but archetypes legitimately spread (a 22-HP
 * swarm and a 110-HP wall live in the same chapter), so the band is generous,
 * not tight. The forge's own output sits in a much narrower role-scaled range
 * inside it. Checks the §A9-critical stats (hp/offense/exp/cash); speed and
 * defense are pure archetype dials and aren't gated.
 */
export function outOfSanity(s: Pick<StatBlock, 'hp' | 'offense' | 'exp' | 'cash'>, chapter: number): string[] {
  const mid = chapterMid(chapter);
  // hp/offense are the THREAT rail (tight-ish); exp/cash are the §A9 reward and
  // spread far by archetype (a rich humanoid, a poor swarm), so they're loose —
  // the point is to catch a Ch.6 enemy with Ch.1 numbers, not nitpick a capstone.
  const band: Record<'hp' | 'offense' | 'exp' | 'cash', [number, number]> = {
    hp: [Math.round(mid.hp * 0.2), Math.round(mid.hp * 2.0)],
    offense: [Math.max(1, Math.round(mid.offense * 0.25)), Math.round(mid.offense * 2.0)],
    exp: [Math.max(1, Math.round(mid.exp * 0.15)), Math.round(mid.exp * 2.2)],
    cash: [Math.max(1, Math.round(mid.cash * 0.15)), Math.round(mid.cash * 3.0)],
  };
  const out: string[] = [];
  for (const k of ['hp', 'offense', 'exp', 'cash'] as const) {
    if (s[k] < band[k][0] || s[k] > band[k][1]) out.push(`${k}=${s[k]} outside Ch.${chapter} band [${band[k][0]},${band[k][1]}]`);
  }
  return out;
}
