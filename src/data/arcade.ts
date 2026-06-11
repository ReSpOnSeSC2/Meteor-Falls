/**
 * ARCADE LEGEND — the STARPORT II cabinet (GAME_BIBLE §A10 #4 + Prompt 36's
 * shmup hook, landed early in S10). Everything the cabinet says or schedules
 * lives HERE so `npm run validate` can sweep it: strings pass the §B4
 * placeholder sweep and the TEXT_VARS sweep ({playername}/{coolthing} are
 * live — the scene renders them through vars()).
 *
 * THE WAVES ARE SCRIPTED, NOT ROLLED. A 1995 cabinet plays the same attract
 * pattern at every quarter — and the ADR-008 bot depends on it: the spawn
 * table below is pure data, the sim advances on accumulated dt, and zero
 * Math.random() runs while the cabinet plays. Same inputs = same score,
 * forever. (Pattern-learning IS the fun; ask anyone who was twelve in 1995.)
 *
 * Scoring budget (kill-everything ceiling, before the corn dog ruling):
 *   53 moths ×20 + 18 rocks ×35 + 18 saucers ×50 = 2,590
 *   + corn dog eaten 300 + the {coolthing} letters 600 + COOL BONUS 1,000
 *   ≈ 4,490. MGR's canon row is 3000 — exactly 3000, a quota of a number;
 *   he smiled the whole time and stopped the moment it rolled over (§A11).
 */
import type { ArcadeScore } from '../schemas';

export type { ArcadeScore } from '../schemas';

/** the Manager's lonely row — locked_arcade2's attract gag, now on every
 *  save's table (newGameData seeds it; the v3→v4 migration backfills it) */
export const MGR_ROW: ArcadeScore = { initials: 'MGR', score: 3000 };

/** the table keeps five rows, classic cabinet rules */
export const SCORE_ROWS = 5;

export type FoeKind = 'moth' | 'rock' | 'saucer' | 'corndog';

export interface SpawnEvent {
  /** sim-time ms (accumulated dt while the run plays — never wall clock) */
  t: number;
  kind: FoeKind;
  /** spawn lane 0..4, top to bottom of the CRT */
  lane: number;
}

export const ARCADE = {
  runMs: 60_000,
  ship: { speed: 95, lives: 3, fireCdMs: 130, invulnMs: 1200, bulletSpeed: 240 },
  foes: {
    moth: { hp: 1, pts: 20, vx: -55 },
    rock: { hp: 2, pts: 35, vx: -30 },
    saucer: { hp: 1, pts: 50, vx: -92 },
    corndog: { hp: 1, pts: 5, vx: -70 },
  },
  pts: { corndogEat: 300, coolBonus: 1000, letterPool: 600 },
  /** the corn dog cameo and the {coolthing} finale, on the sim clock */
  dogT: 26_500,
  bossBannerT: 45_500,
  bossT: 48_000,
} as const;

/**
 * The whole 60 seconds, authored: a gentle moth school, rocks with opinions,
 * saucer rush hour, one corn dog, then the {coolthing} itself. Lanes hash
 * deterministically so the pattern weaves without ever rolling dice.
 */
export function buildSpawns(): SpawnEvent[] {
  const out: SpawnEvent[] = [];
  const lane = (i: number): number => (i * 3 + 1) % 5;
  // phase A — moth school, single file (learn the gun)
  for (let i = 0; i < 11; i++) out.push({ t: 1_400 + i * 800, kind: 'moth', lane: lane(i) });
  // phase B — moths weave while rocks grumble down the middle lanes
  for (let i = 0; i < 18; i++) out.push({ t: 10_400 + i * 830, kind: 'moth', lane: lane(i + 2) });
  for (let i = 0; i < 10; i++) out.push({ t: 11_000 + i * 1_500, kind: 'rock', lane: 1 + ((i * 2) % 3) });
  // the cameo — one corn dog, flying proudly through rush hour
  out.push({ t: ARCADE.dogT, kind: 'corndog', lane: 2 });
  // phase C — saucer salesmen call on every lane; moths and rocks persist
  for (let i = 0; i < 16; i++) out.push({ t: 30_200 + i * 880, kind: 'moth', lane: lane(i + 4) });
  for (let i = 0; i < 8; i++) out.push({ t: 30_800 + i * 1_700, kind: 'rock', lane: 1 + ((i * 2 + 1) % 3) });
  for (let i = 0; i < 18; i++) out.push({ t: 31_400 + i * 760, kind: 'saucer', lane: lane(i * 2 + 1) });
  // phase E — a thin moth rearguard under the {coolthing} finale
  for (let i = 0; i < 8; i++) out.push({ t: 48_500 + i * 1_050, kind: 'moth', lane: lane(i + 1) });
  return out.sort((a, b) => a.t - b.t);
}

/**
 * Every line the cabinet prints — §A11 voice, validated like dialogue.
 * {playername} and {coolthing} resolve through vars() at render time: the
 * coolest thing the player named at New Game IS the final boss. The cabinet
 * predicted everything. Sal has thoughts about that.
 */
export const ARCADE_TEXT = {
  marquee: 'ARCADE LEGEND',
  freeplay: 'FREE PLAY (the quarters unionized)',
  attractTag: 'CAN {playername} OUTFLY THE {coolthing}?',
  tableTitle: "TODAY'S LEGENDS",
  emptyRow: '---',
  insert: 'A: LIFT OFF    B: WALK AWAY',
  ready: 'PILOT {playername}, READY?',
  rosterMoth: 'MOON MOTH - flies like it owes the moon money.',
  rosterRock: 'GRUMBLE ROCK - a rock that read one book about attitude.',
  rosterSaucer: 'SAUCER SALESMAN - uninvited. unstoppable. uninsured.',
  bossBanner: 'HERE COMES THE {coolthing}!!',
  eatDog: 'TASTE VICTORY! +300',
  shootDog: 'YOU SHOT THE CORN DOG. THE CABINET IS DISAPPOINTED. +5',
  coolBonus: 'COOL BONUS +1000',
  timeUp: 'TIME UP, HOTSHOT.',
  shipsOut: 'ALL ROCKETS SPENT.',
  newHigh: 'NEW HIGH SCORE!',
  initialsPrompt: 'THREE LETTERS, LEGEND.',
  dethroned: '"MGR"... DETHRONED. THE MGMT WILL HEAR OF THIS.',
  tellSal: '(TELL SAL. HE HAS BEEN WAITING YEARS.)',
  eject: 'EJECTED. THE SCORE KEEPS ITS SECRETS.',
} as const;
