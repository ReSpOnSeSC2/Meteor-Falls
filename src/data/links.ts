/**
 * COSTA ESTRELLA LINKS — data (S13). Everything the links say, seed, and pay
 * lives HERE so `npm run validate` can sweep and pin it (ADR-017): the 31
 * Invitational golfers (§A11 names, honest accuracy/aggression curves), the
 * reward tables, THE SUNDAY SET (§A8 'other' expansion), the caddy's lines,
 * and the bracket math — which lives on NUMBER FLAGS, not a new save
 * version (ADR-015's "prefer flags" clause, exercised: links_seed,
 * links_round, links_played, links_titles carry the whole tournament).
 *
 * NO RUBBER-BANDING (the S12 law extended): golferHoleScore rolls a hole
 * from (acc, agg, par, rng) and nothing else — nobody reads the player.
 */
import { makeRng, type Rng } from '../hoops/sim';
import { HOLES } from '../links/course';
import type { GolferDef, HoleDef } from '../schemas';

export type { GolferDef } from '../schemas';

/* ================= the 31 (§A11 local color, validator-pinned) ============ */

const G = (g: GolferDef): GolferDef => g;

export const GOLFERS: Record<string, GolferDef> = Object.fromEntries(
  [
    // tier 1 — round-one pairings (8)
    G({ id: 'sock_garters', name: 'Old Sock Garters', line: 'Dresses 1923. Swings 1923. The ball mostly humors him.', acc: 0.22, agg: 0.2, tier: 1 }),
    G({ id: 'wrong_shoes', name: 'Wrong Shoes Mona', line: 'Plays in flippers "for the beach holes." There is one beach hole.', acc: 0.2, agg: 0.45, tier: 1 }),
    G({ id: 'tee_collector', name: 'The Tee Collector', line: 'Owns 4,000 tees. Has broken 4,000 tees.', acc: 0.25, agg: 0.25, tier: 1 }),
    G({ id: 'morning_fog', name: 'Morning Fog Felipe', line: 'Only plays before the fog lifts. Aims by smell.', acc: 0.24, agg: 0.35, tier: 1 }),
    G({ id: 'borrowed_clubs', name: 'Borrowed Clubs Benny', line: 'Every club in his bag belongs to somebody. Including the bag.', acc: 0.26, agg: 0.3, tier: 1 }),
    G({ id: 'scorecard_artist', name: 'The Scorecard Artist', line: 'Draws a small mural in every box. The numbers are interpretive.', acc: 0.21, agg: 0.4, tier: 1 }),
    G({ id: 'umbrella_man', name: 'Umbrella Stand Ugo', line: 'Carries nine umbrellas. It has never once rained on him. Suspicious.', acc: 0.27, agg: 0.2, tier: 1 }),
    G({ id: 'gull_whisperer', name: 'The Gull Whisperer', line: 'The gulls return his ball. To the wrong hole. Out of love.', acc: 0.23, agg: 0.5, tier: 1 }),
    // tier 2 (8)
    G({ id: 'two_glove', name: 'Two-Glove Tomasa', line: 'Wears both gloves. Trusts neither hand.', acc: 0.36, agg: 0.3, tier: 2 }),
    G({ id: 'lunch_first', name: 'Lunch-First Luis', line: 'Will not tee off hungry. Has never teed off before noon.', acc: 0.34, agg: 0.4, tier: 2 }),
    G({ id: 'practice_swing', name: 'Eleven Practice Swings', line: 'Eleven rehearsals, every shot. The twelfth is somehow a surprise.', acc: 0.38, agg: 0.25, tier: 2 }),
    G({ id: 'sand_castle', name: 'Sand Castle Cata', line: 'Treats every bunker as a build site. Up and down AND a turret.', acc: 0.33, agg: 0.55, tier: 2 }),
    G({ id: 'whistler', name: 'The Whistler of 9', line: 'Whistles one note per hole. Hole 9 gets the long note.', acc: 0.37, agg: 0.35, tier: 2 }),
    G({ id: 'visor_down', name: 'Visor-Down Vito', line: 'Wears the visor over his eyes. "The course is a feeling."', acc: 0.31, agg: 0.6, tier: 2 }),
    G({ id: 'ball_retriever', name: 'Retriever Rosa', line: 'Fishes lost balls from the surf. Plays each one home, out of duty.', acc: 0.39, agg: 0.3, tier: 2 }),
    G({ id: 'club_polisher', name: 'The Polisher', line: 'His irons are mirrors. He signals ships between shots.', acc: 0.35, agg: 0.45, tier: 2 }),
    // tier 3 (7)
    G({ id: 'leftie_rights', name: 'Leftie-Righty Lela', line: 'Switch-hits by mood. The mood is decided by the gulls.', acc: 0.48, agg: 0.5, tier: 3 }),
    G({ id: 'one_club', name: 'One-Club Octavio', line: 'Plays the whole course with a 5 iron. The 5 iron is tired.', acc: 0.5, agg: 0.35, tier: 3 }),
    G({ id: 'tide_reader', name: 'The Tide Reader', line: 'Putts by the tide chart. The tide is honest. Her reads are honest-adjacent.', acc: 0.46, agg: 0.45, tier: 3 }),
    G({ id: 'siesta_kid', name: 'The Siesta Kid', line: 'Naps between nines. Wakes up two strokes better. Science shrugs.', acc: 0.52, agg: 0.4, tier: 3 }),
    G({ id: 'plaque_reader', name: 'Plaque-Reader Paz', line: 'Reads every plaque aloud, twice. Par is a kind of poetry to her.', acc: 0.47, agg: 0.3, tier: 3 }),
    G({ id: 'wind_arguer', name: 'The Wind Arguer', line: 'Disputes the caddy wind call every tee. Has won the argument once. The ball disagreed.', acc: 0.45, agg: 0.55, tier: 3 }),
    G({ id: 'cliff_liner', name: 'Cliff-Line Calixto', line: 'Always takes the line over the surf. The surf keeps a tab.', acc: 0.44, agg: 0.7, tier: 3 }),
    // tier 4 (5)
    G({ id: 'marisol', name: 'Marisol the Even', line: 'Par, par, par, par. Watching her card is like watching a calm sea.', acc: 0.62, agg: 0.15, tier: 4 }),
    G({ id: 'thunder_paco', name: 'Thunder Paco', line: 'Drives the cliff carries nobody drives. Putts like distant weather.', acc: 0.58, agg: 0.8, tier: 4 }),
    G({ id: 'abuela_iron', name: 'Abuela Iron', line: 'Sixty years of the same swing. The swing has grandchildren now.', acc: 0.64, agg: 0.3, tier: 4 }),
    G({ id: 'caddy_school', name: 'The Caddy-School Dean', line: 'Taught every caddy on the coast. Reads greens through closed eyes.', acc: 0.6, agg: 0.4, tier: 4 }),
    G({ id: 'night_putter', name: 'The Night Putter', line: 'Practices on the 9th green at midnight. The green confessed everything.', acc: 0.61, agg: 0.5, tier: 4 }),
    // tier 5 — final material (3)
    G({ id: 'la_marea', name: 'LA MAREA', line: 'The tide herself, the locals say. Arrives even. Leaves with everything.', acc: 0.74, agg: 0.45, tier: 5 }),
    G({ id: 'sol_grande', name: 'Sol Grande', line: 'Won the first Invitational at golden hour. Has been golden since.', acc: 0.72, agg: 0.55, tier: 5 }),
    G({ id: 'el_faro', name: 'EL FARO', line: 'The lighthouse keeper. Never misses the line home. Never has.', acc: 0.76, agg: 0.3, tier: 5 }),
  ].map((g) => [g.id, g]),
);

export const GOLFER_ORDER: string[] = Object.keys(GOLFERS);

/* ================= honest hole scoring (pure, test-pinned) ================ */

/**
 * Roll one golfer's score on one hole, relative to par: acc moves mass
 * toward birdies, agg widens the tails BOTH ways (eagles and doubles).
 * Returns strokes (absolute).
 */
export function golferHoleScore(g: GolferDef, hole: HoleDef, rng: Rng): number {
  const pBirdieOrBetter = 0.05 + g.acc * 0.3;
  const pPar = 0.28 + g.acc * 0.34;
  const pBogey = Math.max(0.1, 1 - pBirdieOrBetter - pPar - (0.12 + g.agg * 0.16 - g.acc * 0.1));
  const r = rng();
  if (r < pBirdieOrBetter) {
    // the eagle slice rides aggression (par 3 eagles are aces — allowed, rare)
    return r < pBirdieOrBetter * (0.08 + g.agg * 0.18) ? hole.par - 2 : hole.par - 1;
  }
  if (r < pBirdieOrBetter + pPar) return hole.par;
  if (r < pBirdieOrBetter + pPar + pBogey) return hole.par + 1;
  return hole.par + 2;
}

/* ================= THE INVITATIONAL (flags carry the bracket) ============= */

export const LINKS_BRACKET_SIZE = 32;
export const LINKS_ROUNDS = 5;
export const LINKS_PARTY = 'party';

/** the §A10/ADR-015 number flags that ARE the tournament state */
export const LINKS_FLAGS = {
  seed: 'links_seed',
  round: 'links_round',
  played: 'links_played',
  titles: 'links_titles',
  /** per-hero SUNDAY SET raincheck flags: links_handed_<heroId> */
  handedPrefix: 'links_handed_',
} as const;

/** deterministic 32-slot field off the tournament seed (party at 0, tiers
 *  shuffled-within like the Classic: weakest gate first, finals at the far
 *  bottom). Recomputable forever — flags only store (seed, round). */
export function linksField(seed: number): string[] {
  const rng = makeRng(seed);
  const byTier: string[][] = [[], [], [], [], []];
  for (const id of GOLFER_ORDER) byTier[GOLFERS[id].tier - 1].push(id);
  for (const bucket of byTier) {
    for (let i = bucket.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [bucket[i], bucket[j]] = [bucket[j], bucket[i]];
    }
  }
  const sorted = byTier.flat();
  return [LINKS_PARTY, sorted[0], ...sorted.slice(1, 15), ...sorted.slice(15)];
}

/** seeded golfer-vs-golfer match roll (3 holes by curves; ties by acc) */
export function linksSimWinner(aId: string, bId: string, holes: HoleDef[], rng: Rng): string {
  const a = GOLFERS[aId];
  const b = GOLFERS[bId];
  let aw = 0;
  let bw = 0;
  for (const h of holes) {
    const sa = golferHoleScore(a, h, rng);
    const sb = golferHoleScore(b, h, rng);
    if (sa < sb) aw++;
    else if (sb < sa) bw++;
  }
  if (aw !== bw) return aw > bw ? aId : bId;
  return a.acc >= b.acc ? aId : bId; // the steadier hand survives a wash
}

/** the survivors entering `round`, derived by replaying seeded sims — the
 *  party always advances while the bracket lives (a loss clears the flags) */
export function linksEntrants(seed: number, round: number): string[] {
  let ent = linksField(seed);
  for (let r = 0; r < round; r++) {
    const rng = makeRng((seed ^ ((r + 1) * 0x9e37)) >>> 0);
    const holes = matchHoles(r);
    const next: string[] = [];
    for (let i = 0; i < ent.length; i += 2) {
      const a = ent[i];
      const b = ent[i + 1];
      if (a === LINKS_PARTY || b === LINKS_PARTY) next.push(LINKS_PARTY);
      else next.push(linksSimWinner(a, b, holes, rng));
    }
    ent = next;
  }
  return ent;
}

export function linksNextOpponent(seed: number, round: number): string {
  const ent = linksEntrants(seed, round);
  const i = ent.indexOf(LINKS_PARTY);
  return i % 2 === 0 ? ent[i + 1] : ent[i - 1];
}

/** each round plays THREE holes, marching around the nine */
export function matchHoles(round: number): HoleDef[] {
  const start = (round * 3) % HOLES.length;
  return [0, 1, 2].map((i) => HOLES[(start + i) % HOLES.length]);
}

/** tournament seeds derive from flag state — deterministic, never repeated */
export function linksSeed(titles: number, played: number): number {
  return (2026 + titles * 211 + played * 13) >>> 0;
}

export function strokeSeed(played: number): number {
  return (901 + played * 419) >>> 0;
}

/* ================= rewards (§A9-tuned, validator-pinned) ================= */

/**
 * Stroke-play rounds pay EXP forever (come back anytime): par money, under-
 * par bonuses, a floor for the rough days — plus one seeded goods drop. The
 * Invitational pays by round; the FIRST title pays THE SUNDAY SET; repeats
 * pay cash IN HAND (resort prizes never route through Dad's ledger).
 */
export const LINKS_REWARDS = {
  stroke: {
    evenPar: 150,
    perUnder: 25,
    perOver: -12,
    floor: 40,
    drops: 1,
  },
  invitational: {
    roundWinExp: [180, 240, 320, 420, 560] as const,
    lossFrac: 0.4,
    repeatTitleCash: 400,
  },
  drops: { table: ['corn_dog', 'pbj', 'lemonade', 'star_cola'] as const },
} as const;

export function strokeExp(scoreVsPar: number): number {
  const r = LINKS_REWARDS.stroke;
  const exp = r.evenPar + (scoreVsPar < 0 ? -scoreVsPar * r.perUnder : scoreVsPar * r.perOver);
  return Math.max(r.floor, Math.round(exp));
}

/* ================= THE SUNDAY SET (§A8 'other' expansion) ================= */

/** hero id → the 'other'-slot charm the first Invitational hands them */
export const SUNDAY_SET: Record<string, string> = {
  rex: 'sunday_visor',
  faye: 'sunday_glove',
  milo: 'lucky_tee',
  dorin: 'caddys_marker',
};

export const SUNDAY_SET_IDS: string[] = Object.values(SUNDAY_SET);

/* ================= LINKS_TEXT — everything the links say ================= */

/** scene-filled tokens (the HOOPS_FILL precedent; validator sweeps) */
export const LINKS_FILL_TOKENS = ['n', 'name', 'exp', 'item', 'cash', 'club', 'yds', 'putts', 'par', 'score', 'hole'] as const;

export const LINKS_TEXT = {
  title: 'COSTA ESTRELLA LINKS',
  tipRound: 'NINE HOLES. THE WIND IS SEEDED AND THE CADDY IS SURE.',
  tipMatch: 'MATCH PLAY. THREE HOLES. LOWEST BALL TAKES EACH.',
  holeCard: 'HOLE {n} — PAR {par}',
  strokeLine: 'STROKE {n}',
  yardsOut: '{yds}y TO THE PIN',
  clubLine: '{club}',
  windLine: 'WIND: {putts} PUTTS OUT OF THE {name}', // the caddy's units
  windCalm: 'WIND: ASLEEP. EVEN THE CADDY WHISPERS.',
  splash: 'THE SURF ACCEPTS YOUR OFFERING. (+1)',
  sand: 'DUNE RESTORATION IN PROGRESS.',
  cliff: 'THE ROCK HAS OPINIONS.',
  holedBanner: 'IN.',
  scoreNames: ['ALBATROSS', 'EAGLE', 'BIRDIE', 'PAR', 'BOGEY', 'DOUBLE', 'MORE.'] as const,
  matchWinHole: 'HOLE TO YOU.',
  matchLoseHole: 'HOLE TO {name}.',
  matchHalved: 'HALVED.',
  matchWin: 'MATCH: YOURS.',
  matchLoss: 'MATCH: THEIRS. THE BRACKET KEEPS THE STUB.',
  suddenDeath: 'ALL SQUARE. SUDDEN DEATH ON THE NEXT TEE.',
  tallyRound: 'THE CARD: {score} — {exp} EXP, SEÑOR.',
  tallyExp: '{name} gained {exp} EXP.',
  tallyLevel: '{name} jumped to level {n}!',
  tallyDrop: 'The clubhouse sends you off with: {item}.',
  tallyTitle: 'COSTA ESTRELLA CHAMPION: {playername}. THE SUNDAY SET IS YOURS.',
  tallyRepeat: 'CHAMPION AGAIN. THE PURSE: ${cash}, IN HAND.',
  boardTitle: 'THE COSTA ESTRELLA INVITATIONAL — 32 BAGS, ONE SUNSET',
  boardRound: ['ROUND OF 32', 'ROUND OF 16', 'QUARTERFINALS', 'SEMIFINALS', 'THE FINAL'] as const,
  boardYou: 'YOU',
  boardNext: 'NEXT: {name}',
  boardLine: '"{n}"', // the golfer's clubhouse line rides the n fill
  paused: 'PAUSED. THE WIND WAITS FOR NOBODY, BUT IT WILL TRY.',
  resume: 'KEEP PLAYING',
  walkOff: 'WALK OFF (the round is forfeit)',
  /* the caddy announces (§A11 obsession: the world, measured in putts) */
  caddyTee: [
    'CADDY: {yds} yards, señor. Call it {putts} putts if you walked it. Nobody walks it.',
    'CADDY: the pin is {yds} away. That cloud? two putts past it.',
    'CADDY: {club} today. The wind already agreed.',
  ],
  caddyGreen: [
    'CADDY: it breaks toward the surf. Everything here breaks toward the surf. Even the staff.',
    'CADDY: firm putt. The cup owes you nothing yet.',
  ],
  /* the §A11.2 sincerity, played straight — the 9th tee at sunset */
  caddySunset: 'CADDY: ...look at that, señor. One putt away. Some things I do not measure.',
} as const;
