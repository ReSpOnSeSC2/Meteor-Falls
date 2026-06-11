/**
 * THE CAGE — data (S12). Everything the cage says, seeds, fields, and pays
 * lives HERE so `npm run validate` can sweep and pin it (ADR-017): the 31
 * Classic entrants, the walk-on bench, PERMIT's announcer pools, the reward
 * tables, and the bracket math. Strings pass the §B4 placeholder sweep and
 * the TEXT_VARS sweep ({playername}/{coolthing} are live where used).
 *
 * NO RUBBER-BANDING (S12 law): a team's tier IS its strength, derived by
 * pure functions below — nothing in the sim or the sim-results roll ever
 * reads the player's score or level to bend an outcome.
 */
import { RAMP } from '../palette';
import { makeRng, type AthleteDef, type Rng } from '../hoops/sim';
import { heroSpeed, heroGuts, heroLuck, heroDefense, heroOffense } from '../battle/formulas';
import type { HeroState } from '../engine/state';
import type { AthleteRating, HoopsArchetype, HoopsBracket, TeamDef, WalkOnDef } from '../schemas';

export type { TeamDef, WalkOnDef, HoopsBracket, HoopsCheckpoint, HoopsState, AthleteRating } from '../schemas';

/* ================= the 31 (§A11 local color, validator-pinned) ============ */

const T = (t: TeamDef): TeamDef => t;

export const TEAMS: Record<string, TeamDef> = Object.fromEntries(
  [
    // tier 1 — round-one fodder (8)
    T({ id: 'wet_socks', name: 'The Wet Socks', taunt: 'We never dry. We never die.', archetype: 'balanced', tier: 1, jersey: RAMP.CYAN }),
    T({ id: 'expired_coupons', name: 'The Expired Coupons', taunt: 'Still good. We checked. Mostly.', archetype: 'sniper', tier: 1, jersey: RAMP.ORANGE }),
    T({ id: 'mall_walkers', name: 'The Mall Walkers', taunt: 'We do laps, baby. LAPS.', archetype: 'rusher', tier: 1, jersey: RAMP.PAPER }),
    T({ id: 'soft_serves', name: 'The Soft Serves', taunt: 'We melt under pressure but the swirl is beautiful.', archetype: 'post', tier: 1, jersey: RAMP.MAGENTA }),
    T({ id: 'garage_sales', name: 'The Garage Sales', taunt: 'Everything must go, especially you.', archetype: 'balanced', tier: 1, jersey: RAMP.GOLD }),
    T({ id: 'slow_blinkers', name: 'The Slow Blinkers', taunt: 'We saw your crossover coming. Eventually.', archetype: 'hawk', tier: 1, jersey: RAMP.NIGHT }),
    T({ id: 'window_shoppers', name: 'The Window Shoppers', taunt: 'Just looking. At the rim. All day.', archetype: 'sniper', tier: 1, jersey: RAMP.BLUE }),
    T({ id: 'casserole_dads', name: 'The Casserole Dads', taunt: 'We brought a dish AND a zone defense.', archetype: 'post', tier: 1, jersey: RAMP.EARTH }),
    // tier 2 (8)
    T({ id: 'pigeon_counters', name: 'The Pigeon Counters', taunt: 'Forty-one pigeons on that wire. Zero stops in your defense.', archetype: 'hawk', tier: 2, jersey: RAMP.PURPLE }),
    T({ id: 'parking_meters', name: 'The Parking Meters', taunt: 'Your time expires in four quarters.', archetype: 'post', tier: 2, jersey: RAMP.PAPER }),
    T({ id: 'dial_tones', name: 'The Dial Tones', taunt: 'You hung up on greatness. We ARE the hold music.', archetype: 'balanced', tier: 2, jersey: RAMP.CYAN }),
    T({ id: 'hedge_trimmers', name: 'The Hedge Trimmers', taunt: 'We keep everything trim. Especially leads.', archetype: 'sniper', tier: 2, jersey: RAMP.GRASS }),
    T({ id: 'crosswalk_buttons', name: 'The Crosswalk Buttons', taunt: 'Press us all you want. We change when WE want.', archetype: 'hawk', tier: 2, jersey: RAMP.GOLD }),
    T({ id: 'free_samples', name: 'The Free Samples', taunt: 'One taste of this offense is never enough.', archetype: 'rusher', tier: 2, jersey: RAMP.RED }),
    T({ id: 'lawn_flamingos', name: 'The Lawn Flamingos', taunt: 'One leg. Still faster than you.', archetype: 'rusher', tier: 2, jersey: RAMP.MAGENTA }),
    T({ id: 'sunday_drivers', name: 'The Sunday Drivers', taunt: 'We take our time. The scenic route. To the rim.', archetype: 'post', tier: 2, jersey: RAMP.BLUE }),
    // tier 3 (7)
    T({ id: 'bug_zappers', name: 'The Bug Zappers', taunt: 'Drawn to the light? THE LIGHT IS OURS.', archetype: 'hawk', tier: 3, jersey: RAMP.PURPLE }),
    T({ id: 'turnstiles', name: 'The Turnstiles', taunt: 'Nobody gets through without exact fare.', archetype: 'post', tier: 3, jersey: RAMP.EARTH }),
    T({ id: 'pay_phones', name: 'The Pay Phones', taunt: 'Collect call from the paint. You WILL accept the charges.', archetype: 'post', tier: 3, jersey: RAMP.NIGHT }),
    T({ id: 'substitute_teachers', name: 'The Substitute Teachers', taunt: 'Your regular defense is out today. We grade harder.', archetype: 'balanced', tier: 3, jersey: RAMP.ORANGE }),
    T({ id: 'left_turns', name: 'The Left Turns', taunt: 'We have been waiting to go all day. NOW WE GO.', archetype: 'rusher', tier: 3, jersey: RAMP.GOLD }),
    T({ id: 'fire_escapes', name: 'The Fire Escapes', taunt: 'We only go up. Mostly sideways. But UP.', archetype: 'sniper', tier: 3, jersey: RAMP.RED }),
    T({ id: 'coupon_doublers', name: 'The Coupon Doublers', taunt: 'Every bucket counts twice where we shop.', archetype: 'sniper', tier: 3, jersey: RAMP.GRASS }),
    // tier 4 (5)
    T({ id: 'mailbox_arms', name: 'The Mailbox Arms', taunt: 'You shall not pass. You shall not even mail.', archetype: 'hawk', tier: 4, jersey: RAMP.BLUE }),
    T({ id: 'brickmore_walkups', name: 'The Brickmore Walk-Ups', taunt: 'Five flights, no elevator. Legs of brick.', archetype: 'post', tier: 4, jersey: RAMP.RED }),
    T({ id: 'last_donuts', name: 'The Last Donuts', taunt: 'Everybody wants us. Nobody boxes us out.', archetype: 'post', tier: 4, jersey: RAMP.MAGENTA }),
    T({ id: 'decaf_sharks', name: 'The Decaf Sharks', taunt: 'Calm. Patient. Circling. Unleaded.', archetype: 'hawk', tier: 4, jersey: RAMP.CYAN }),
    T({ id: 'dress_codes', name: 'The Dress Codes', taunt: 'No rim privileges without a collar.', archetype: 'sniper', tier: 4, jersey: RAMP.INK }),
    // tier 5 — title-game material (3)
    T({ id: 'quota_crushers', name: 'The Quota Crushers', taunt: 'HAVE A PRODUCTIVE GAME. We always hit our numbers.', archetype: 'balanced', tier: 5, jersey: RAMP.BLUE }),
    T({ id: 'permits_nephews', name: "Permit's Nephews", taunt: 'Uncle P says he is unbiased. Uncle P seeded us fifth straight year.', archetype: 'rusher', tier: 5, jersey: RAMP.GOLD }),
    T({ id: 'bus_that_never_came', name: 'The Bus That Never Came', taunt: 'You waited your whole life for us. We arrive NOW.', archetype: 'sniper', tier: 5, jersey: RAMP.NIGHT }),
  ].map((t) => [t.id, t]),
);

/** every Classic entrant, weakest tier first (stable authoring order) */
export const TEAM_ORDER: string[] = Object.keys(TEAMS);

/* ================= the walk-on bench (§A11, validator-pinned) ============ */

const W = (w: WalkOnDef): WalkOnDef => w;

/**
 * Named locals who fill the party's five — never the PARTY itself. Order is
 * pick order. Chad guests pre-Milo (canon: he is conspicuously available
 * until the third hero exists, then conspicuously not).
 */
export const WALK_ONS: Record<string, WalkOnDef> = Object.fromEntries(
  [
    W({
      id: 'chad',
      name: 'Chad',
      sprite: 'chad',
      line: 'Posts up like a man defending the last corn dog on earth.',
      rating: { spd: 34, sht: 30, dnk: 47, dfn: 38 },
      archetype: 'post',
      unlessFlag: 'milo_joined',
    }),
    W({
      id: 'pajama_kid',
      name: 'Slippers',
      sprite: 'pajamaKid',
      line: 'Plays in slippers. Has never once slipped. Scientists baffled.',
      rating: { spd: 52, sht: 39, dnk: 22, dfn: 30 },
      archetype: 'rusher',
    }),
    W({
      id: 'pigeon_kid',
      name: 'Crumbs',
      sprite: 'pigeonKid',
      line: 'Boxes out like the rebound is the last crumb in Brickton.',
      rating: { spd: 41, sht: 44, dnk: 26, dfn: 40 },
      archetype: 'balanced',
    }),
    W({
      id: 'quarter_man',
      name: 'Exact Change',
      sprite: 'quarterMan',
      line: 'Only shoots from deep. Calls every make "exact change."',
      rating: { spd: 31, sht: 56, dnk: 16, dfn: 32 },
      archetype: 'sniper',
    }),
    W({
      id: 'sidewalk_critic',
      name: 'The Critic',
      sprite: 'sidewalkCritic',
      line: 'Defends your whole offense like a review. One star.',
      rating: { spd: 35, sht: 41, dnk: 24, dfn: 50 },
      archetype: 'hawk',
    }),
  ].map((w) => [w.id, w]),
);

export const WALK_ON_ORDER: string[] = Object.keys(WALK_ONS);

/* ================= ratings (pure, test-pinned) ================= */

const clamp99 = (v: number): number => Math.max(8, Math.min(99, Math.round(v)));

/** a team's base rating from its tier — 43 (fodder) … 79 (title game) */
export function teamBaseRating(tier: number): number {
  return 34 + tier * 9;
}

/** archetype spice per slot: every five has a shape, not five clones */
const SLOT_ARCH: Record<HoopsArchetype, HoopsArchetype[]> = {
  rusher: ['rusher', 'rusher', 'balanced', 'sniper', 'post'],
  sniper: ['sniper', 'sniper', 'balanced', 'rusher', 'post'],
  post: ['post', 'post', 'balanced', 'hawk', 'sniper'],
  hawk: ['hawk', 'hawk', 'balanced', 'rusher', 'sniper'],
  balanced: ['balanced', 'rusher', 'sniper', 'post', 'hawk'],
};

function archRating(base: number, arch: HoopsArchetype, jitter: number): AthleteRating {
  const r: AthleteRating = { spd: base, sht: base, dnk: base, dfn: base };
  switch (arch) {
    case 'rusher':
      r.spd += 12;
      r.dnk += 6;
      r.sht -= 8;
      break;
    case 'sniper':
      r.sht += 13;
      r.spd += 2;
      r.dnk -= 12;
      break;
    case 'post':
      r.dnk += 12;
      r.dfn += 6;
      r.spd -= 10;
      break;
    case 'hawk':
      r.dfn += 13;
      r.spd += 4;
      r.sht -= 6;
      break;
    default:
      r.sht += 3;
      r.dfn += 3;
      break;
  }
  r.spd = clamp99(r.spd + jitter);
  r.sht = clamp99(r.sht - jitter);
  r.dnk = clamp99(r.dnk + jitter);
  r.dfn = clamp99(r.dfn - jitter);
  return r;
}

/** the five athletes a TEAMS entry fields — deterministic from the id */
export function teamAthletes(teamId: string): AthleteDef[] {
  const team = TEAMS[teamId];
  const base = teamBaseRating(team.tier);
  const archs = SLOT_ARCH[team.archetype];
  return archs.map((arch, i) => ({
    key: `athlete_opp_${teamId}_${i}`,
    name: `${team.name.replace(/^The /, '').toUpperCase()} #${((hashOf(teamId) + i * 7) % 44) + 4}`,
    rating: archRating(base, arch, ((hashOf(teamId) + i * 13) % 5) - 2),
    archetype: arch,
  }));
}

export function hashOf(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * A hero's court read derives from their §A3 stats THROUGH the equip
 * read-throughs (heroSpeed/heroGuts — S12's formulas) — THE STARTING FOUR
 * makes you better at the very game that awarded it.
 */
export function heroAthleteRating(h: HeroState): AthleteRating {
  return {
    spd: clamp99(36 + heroSpeed(h) * 1.5),
    sht: clamp99(34 + heroOffense(h) * 0.9 + heroLuck(h) * 0.5),
    dnk: clamp99(28 + heroGuts(h) * 1.1),
    dfn: clamp99(32 + heroDefense(h) * 0.8),
  };
}

const HERO_ARCH: Record<string, HoopsArchetype> = {
  rex: 'balanced',
  faye: 'sniper',
  milo: 'rusher',
  dorin: 'post',
};

export function heroAthlete(h: HeroState): AthleteDef {
  return {
    key: `athlete_${h.id}`,
    name: h.name.toUpperCase(),
    rating: heroAthleteRating(h),
    archetype: HERO_ARCH[h.id] ?? 'balanced',
  };
}

/** a walk-on's AthleteDef (their sheet derives from the CAST sprite) */
export function walkOnAthlete(w: WalkOnDef): AthleteDef {
  return { key: `athlete_${w.sprite}`, name: w.name.toUpperCase(), rating: w.rating, archetype: w.archetype };
}

/**
 * YOUR FIVE (or three): the current party first — the heroes are the stars —
 * then named walk-ons off the bench in table order until the format fills.
 * Returns the defs plus which walk-ons suited up (the scene shows the line).
 */
export function buildRoster(
  party: HeroState[],
  flagOf: (name: string) => boolean,
  size: number,
): { defs: AthleteDef[]; walkOns: WalkOnDef[] } {
  const defs: AthleteDef[] = party.slice(0, size).map(heroAthlete);
  const walkOns: WalkOnDef[] = [];
  for (const id of WALK_ON_ORDER) {
    if (defs.length >= size) break;
    const w = WALK_ONS[id];
    if (w.ifFlag && !flagOf(w.ifFlag)) continue;
    if (w.unlessFlag && flagOf(w.unlessFlag)) continue;
    walkOns.push(w);
    defs.push(walkOnAthlete(w));
  }
  return { defs, walkOns };
}

/* ================= the bracket (save v5 rides this shape) ================= */

export const BRACKET_SIZE = 32;
export const BRACKET_ROUNDS = 5;
export const PARTY_SLOT_ID = 'party';

/**
 * Draw a fresh 32-slot field: the party at slot 0, the weakest live first
 * (PERMIT seeds the bracket — he ranks everything), the title-grade teams
 * stacked in the far half so the run RAMPS. Shuffle-within-tier off the
 * tournament seed so no two Classics read identical.
 */
export function newBracket(seed: number): HoopsBracket {
  const rng = makeRng(seed);
  const byTier: string[][] = [[], [], [], [], []];
  for (const id of TEAM_ORDER) byTier[TEAMS[id].tier - 1].push(id);
  for (const bucket of byTier) {
    for (let i = bucket.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [bucket[i], bucket[j]] = [bucket[j], bucket[i]];
    }
  }
  const sorted = byTier.flat(); // weakest → strongest, shuffled within tier
  const field: string[] = [PARTY_SLOT_ID, sorted[0]];
  // near half (slots 2–15): the soft middle; far half (16–31): the gauntlet,
  // strongest at the very bottom — a finals date with a tier-5 five
  field.push(...sorted.slice(1, 15));
  field.push(...sorted.slice(15));
  return { seed, round: 0, field, results: [] };
}

/** the survivors entering `round` (field order preserved) */
export function roundEntrants(b: HoopsBracket, round: number): string[] {
  return round === 0 ? [...b.field] : [...(b.results[round - 1] ?? [])];
}

/** the player's opponent in the bracket's next round (party is always alive
 *  while the bracket exists — a loss tears the bracket up, street rules) */
export function nextOpponent(b: HoopsBracket): string {
  const ent = roundEntrants(b, b.round);
  const i = ent.indexOf(PARTY_SLOT_ID);
  return i % 2 === 0 ? ent[i + 1] : ent[i - 1];
}

/** seeded sim-results roll: the stronger five usually advances — honestly */
export function simWinner(aId: string, bId: string, rng: Rng): string {
  const a = TEAMS[aId];
  const b = TEAMS[bId];
  const p = 0.5 + (teamBaseRating(a.tier) - teamBaseRating(b.tier)) * 0.012;
  return rng() < Math.max(0.08, Math.min(0.92, p)) ? aId : bId;
}

/**
 * Close out the player's round: the party advances (or the bracket dies with
 * the loss — single elimination means exactly that), every other pairing
 * sims SEEDED off the bracket seed + round, and the chalk board redraws from
 * `results`. Returns the updated bracket, or null when the run is over.
 */
export function advanceBracket(b: HoopsBracket, partyWon: boolean): HoopsBracket | null {
  if (!partyWon) return null;
  const ent = roundEntrants(b, b.round);
  const rng = makeRng((b.seed ^ ((b.round + 1) * 0x51ed)) >>> 0);
  const winners: string[] = [];
  for (let i = 0; i < ent.length; i += 2) {
    const a = ent[i];
    const c = ent[i + 1];
    if (a === PARTY_SLOT_ID || c === PARTY_SLOT_ID) {
      winners.push(PARTY_SLOT_ID);
    } else {
      winners.push(simWinner(a, c, rng));
    }
  }
  return { ...b, round: b.round + 1, results: [...b.results, winners] };
}

/** tournament seeds derive from save state — deterministic, never repeated */
export function classicSeed(titles: number, played: number): number {
  return (1995 + titles * 101 + played * 17) >>> 0;
}

export function pickupSeed(played: number): number {
  return (7 + played * 1009) >>> 0;
}

/* ================= rewards (§A9-conscious, validator-pinned) ============= */

/**
 * Every match pays EXP through the Prompt-18 flow (level-ups announce
 * post-game) scaled by FORMAT and bracket depth — a four-quarter Classic war
 * pays like the war it is; a 3v3 run to 21 pays its weight. Pickup pays
 * forever (the anytime XP run). Repeat Classic titles pay cash + goods only;
 * the FIRST pays THE STARTING FOUR.
 */
export const HOOPS_REWARDS = {
  pickup: { winExp: 130, lossExp: 55 },
  classic: {
    roundWinExp: [240, 330, 440, 580, 760] as const,
    /** a Classic loss still pays this fraction of the round (the war was real) */
    lossFrac: 0.4,
    repeatTitleCash: 350,
  },
  /** seeded goods drops: rolls per result; the table leans food + cola */
  drops: {
    pickupWin: 1,
    pickupLoss: 0,
    classicWin: 2,
    classicLoss: 1,
    titleBonus: 2,
    table: ['corn_dog', 'pbj', 'lemonade', 'star_cola'] as const,
  },
} as const;

/** roll seeded goods drops (item ids) — the match rng carries through */
export function rollDrops(count: number, rng: Rng): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const r = rng();
    const t = HOOPS_REWARDS.drops.table;
    out.push(r < 0.3 ? t[0] : r < 0.55 ? t[1] : r < 0.8 ? t[2] : t[3]);
  }
  return out;
}

/* ================= THE STARTING FOUR (§A8 'arms', validator-pinned) ====== */

/** hero id → the arms-slot piece the first Classic title hands them */
export const STARTING_FOUR: Record<string, string> = {
  rex: 'cage_sweatband',
  faye: 'victory_scrunchie',
  milo: 'shooters_sleeve',
  dorin: 'iron_wristguard',
};

export const STARTING_FOUR_IDS: string[] = Object.values(STARTING_FOUR);

/* ================= HOOPS_TEXT — everything the cage says ================= */

/**
 * Scene-filled placeholders in HOOPS_TEXT — HoopsScene/OverworldScene
 * .replace() these at render time (the BATTLE_FILL_TOKENS precedent);
 * {playername} additionally resolves through vars(). The validator sweeps
 * HOOPS_TEXT against TEXT_VARS ∪ this set.
 */
export const HOOPS_FILL_TOKENS = ['n', 'name', 'exp', 'item', 'cash', 'team', 'taunt'] as const;

/**
 * PERMIT announces (§A11 obsession: he has historically ranked every
 * crossover he has ever seen — the ankle pool is where it shows). Pools are
 * picked through the MATCH rng: same seed, same calls, cabinet law.
 */
export const HOOPS_TEXT = {
  /* scene chrome */
  title: 'THE CAGE',
  tip5v5: 'FOUR QUARTERS. RUNNING CLOCK. THE FENCE IS LIVE.',
  tip3v3: 'FIRST TO 21. WIN BY 2. ONES AND TWOS.',
  check: 'CHECK.',
  take: 'TAKE.',
  quarterEnd: 'END OF Q{n}.',
  halftime: 'HALFTIME. PERMIT REDRAWS THE BRACKET FROM MEMORY. IT IS PERFECT.',
  otBanner: 'OVERTIME. NOBODY LEAVES.',
  violation: '24 ON THE CLOCK. PERMIT SAW EVERY SECOND.',
  stuffed: 'STUFFED!',
  ankles: 'ANKLES.',
  shook: 'SHOOK.',
  stumbled: 'TRIPPED HIM UP.',
  rejected: 'NOT TODAY.',
  /* S12c: the timed reads, the goaltend call, the prayer, the flub */
  timed: 'TIMED!',
  goaltend: 'GOALTEND. IT COUNTS.',
  heavePopup: 'THE HEAVE.',
  flubPopup: 'RIM-HUNG IT.',
  pickup_win: 'GAME. STREET KEEPS THE SCORE.',
  pickup_loss: 'GAME. THE CAGE REMEMBERS.',
  callsForIt: '{name} CALLS FOR IT!',
  paused: 'PAUSED. THE CAGE WAITS.',
  resume: 'KEEP PLAYING',
  walkOff: 'WALK OFF (the game is forfeit)',
  /* PERMIT's pools — seeded picks, never repeats two in a row by accident */
  permitScore: [
    'PERMIT: BUCKET. LOGGED.',
    'PERMIT: COUNT IT. I ALWAYS COUNT IT.',
    'PERMIT: THAT IS GOING IN THE LEDGER.',
    'PERMIT: CLEAN. NOTARIZED.',
  ],
  permitGreen: [
    'PERMIT: PURE. NOTHING BUT CHAIN.',
    'PERMIT: RELEASED AT THE EXACT CORRECT INSTANT. I CHECKED.',
  ],
  permitDunk: [
    'PERMIT: FILED UNDER "VIOLENCE, LEGAL."',
    'PERMIT: THE RIM WILL FILE A COMPLAINT. DENIED.',
    'PERMIT: I HAVE SEEN 4,000 DUNKS. TOP 200. MAYBE 150.',
  ],
  permitAnkles: [
    'PERMIT: OH. OH NO. THAT CROSSOVER RANKS 38TH ALL-TIME. CONDOLENCES.',
    'PERMIT: I HAVE RANKED EVERY CROSSOVER SINCE 1987. TOP 50. EASILY.',
    'PERMIT: SOMEBODY HELP THAT DEFENDER. NOT ME. I AM BUSY RANKING.',
  ],
  /* S12c: the ankle ladder's lower rungs get their own ranks */
  permitStun: [
    'PERMIT: HE FELT THAT IN THE KNEES. RANKED: HONORABLE MENTION.',
    'PERMIT: A WOBBLE. I AM LOGGING THE WOBBLE.',
  ],
  permitTrip: [
    'PERMIT: HE TRIPPED OVER A MOVE THAT RANKS 112TH. IMAGINE THE TOP TEN.',
    'PERMIT: THE SIDEWALK DID NOT MOVE. THE CROSSOVER DID.',
  ],
  /* S12c: goaltending — the canon call, verbatim */
  permitGoaltend: [
    'PERMIT: THAT WAS COMING DOWN. WE ALL SAW IT.',
  ],
  permitHeave: [
    'PERMIT: A PRAYER FROM ANOTHER AREA CODE. FILED UNDER HOPE.',
    'PERMIT: THE CLOCK MADE HIM DO IT. THE RIM DECLINED.',
  ],
  permitFlub: [
    'PERMIT: HE HUNG ON THE RIM AND THE DUNK LEFT WITHOUT HIM.',
    'PERMIT: THE WINDUP RANKED TOP 40. THE FINISH RANKED LAST.',
  ],
  permitBlock: [
    'PERMIT: SENT BACK. RETURN TO SENDER.',
    'PERMIT: DENIED AT THE WINDOW.',
  ],
  permitSteal: [
    'PERMIT: PICKED. CLEAN HANDS. I INSPECTED THEM.',
    'PERMIT: THAT BALL HAS A NEW OWNER. PAPERWORK PENDING.',
  ],
  permitStuff: [
    'PERMIT: THE DUNK WAS PROPOSED. THE MOTION FAILED.',
    'PERMIT: STUFFED. I AM RANKING THE STUFF NOW. IT RANKS HIGH.',
  ],
  permitCount: 'PERMIT: {n}...',
  permitHorn: 'PERMIT: THAT IS THE HORN. I AM THE HORN.',
  /* tally screen */
  tallyWin: 'W. THE CAGE NODS.',
  tallyLoss: 'L. RUN IT BACK ANYTIME.',
  tallyExp: '{name} gained {exp} EXP.',
  tallyLevel: '{name} jumped to level {n}!',
  tallyDrop: 'The bench passes you: {item}.',
  tallyTitle: 'BRICKTON CLASSIC CHAMPIONS: {playername} AND THE FIVE.',
  tallyRepeat: 'CHAMPIONS AGAIN. THE POT: ${cash}, STREET TERMS.',
  /* S12c: PERMIT'S SCHOOL — the cage tutorial (skippable; flag cage_tutored).
   * One flat key per lesson; the scene advances each on the deed, not the
   * word. The goaltend warning is the syllabus's only commandment. */
  tutTitle: "PERMIT'S SCHOOL OF CAGE LAW",
  tutMove: 'LESSON 1: MOVE WITH THE D-PAD. HOLD X TO SPRINT. SHOW ME A SPRINT.',
  tutMeter: 'LESSON 2: STEP INSIDE THE ARC — RANGE CLOSES THE GREEN. THEN HOLD A AND RELEASE INSIDE THE GREEN AT THE TOP OF THE METER.',
  tutDunk: 'LESSON 3: SPRINT AT THE RIM AND PRESS A TO FINISH. DUNKERS GET A SECOND METER — RELEASE A IN ITS GREEN TO THROW IT DOWN.',
  tutPackage: 'LESSON 4: Y ALONE SPINS. Y PLUS A SIDE GOES BEHIND THE BACK. Y AT YOUR MAN GOES BETWEEN THE LEGS. SHOW ME ALL THREE.',
  tutPass: 'LESSON 5: TAP B TO PASS INTO YOUR HELD DIRECTION. THE BALL PICKS ITS OWN STYLE. TWO CLEAN ONES.',
  tutBlock: 'LESSON 6: HE SHOOTS NOW. PRESS A SO YOUR JUMP PEAKS AT HIS RELEASE. SEND ONE BACK.',
  tutSteal: 'LESSON 7: WATCH HIS HANDLE. TAP B THE INSTANT A MOVE STARTS — THAT IS THE WINDOW. TAKE ONE.',
  tutGoaltend: 'THE ONE LAW: NEVER TOUCH IT COMING DOWN. IF IT IS DROPPING, IT COUNTS. WE WILL ALL SEE IT.',
  tutDone: "SCHOOL'S OUT. THE CAGE KNOWS YOUR NAME NOW.",
  tutSkip: 'B: SKIP THE LESSONS',
  /* the chalk board */
  boardTitle: 'THE BRICKTON CLASSIC — 32 FIVES, ONE CHALK LINE',
  boardRound: ['ROUND OF 32', 'ROUND OF 16', 'QUARTERFINALS', 'SEMIFINALS', 'THE FINAL'] as const,
  boardYou: 'YOUR FIVE',
  boardNext: 'NEXT: {team}',
  boardTaunt: 'CHALKED BY THE DOOR: "{taunt}"',
  boardChamps: 'CHAMPIONS: YOUR FIVE. PERMIT UNDERLINED IT TWICE.',
  boardDead: 'THE BRACKET IS TORN UP. REGISTER AGAIN — PERMIT KEPT THE STUB.',
  boardOpen: 'THE FIELD IS OPEN. PERMIT ACCEPTS FIVES AT THE GATE.',
} as const;
