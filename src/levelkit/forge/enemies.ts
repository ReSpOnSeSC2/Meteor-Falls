/**
 * THE ENEMY FORGE (S15g Movement Three, ADR-046) — SEEDED BY CANON. It never
 * invents a roster from nothing: it reads the §A6/§A9 CHAPTER_CURVES and the
 * region pack, drafts the boring 60% (stats on the ladder, EXP/cash on the
 * economy, role-template moves, a §A11-shaped first-draft death line), and
 * leaves the SOUL blank for the human — names, jokes, and death lines are
 * rewritten by hand at promotion (Prime Law 1). Output is a DraftEnemyDef:
 * the canon EnemyDef shape + the forge's role/chapter tags, so it can never
 * masquerade as a shipped §A7 row. Determinism rides the named Streams; no
 * Date.now()/Math.random() (Prime Law 2). The sprite is a SHIPPED placeholder
 * until Movement 3b composes the real face and records a partsSpec.
 */
import type { DraftEnemyDef, EnemyMove } from '../../schemas';
import { Streams } from '../rng';
import { RAMP } from '../../palette';
import { chapterMid, CHAPTER_LEVELS } from './curves';

export type ForgeRole = 'grunt' | 'bruiser' | 'caster' | 'thief' | 'swarm' | 'lurker';
export const FORGE_ROLES: readonly ForgeRole[] = ['grunt', 'bruiser', 'caster', 'thief', 'swarm', 'lurker'];

type Weakness = 'fire' | 'freeze' | 'volt' | 'insect' | 'salt';
type Status = 'sunburn' | 'crying' | 'asleep' | 'productive' | 'paralyzed';

interface RoleSpec {
  /** stat multipliers on the chapter midpoint (archetype shape) */
  hp: number; off: number; def: number; spd: number; exp: number; cash: number;
  /** the move skeleton this role assembles (2–4) */
  moves: MoveKey[];
  /** a shipped sprite to borrow as a placeholder until 3b composes the real one */
  art: string;
}

const ROLES: Record<ForgeRole, RoleSpec> = {
  grunt: { hp: 1.0, off: 1.0, def: 1.0, spd: 1.0, exp: 1.0, cash: 1.0, moves: ['hit', 'hit2', 'taunt'], art: 'gilded_beetle' },
  bruiser: { hp: 1.5, off: 1.15, def: 1.4, spd: 0.75, exp: 1.3, cash: 1.2, moves: ['hit', 'strong', 'taunt'], art: 'step_mask' },
  caster: { hp: 0.7, off: 0.7, def: 0.9, spd: 1.0, exp: 1.2, cash: 1.3, moves: ['hit', 'status', 'taunt'], art: 'cursed_souvenir' },
  thief: { hp: 0.8, off: 0.9, def: 0.8, spd: 1.4, exp: 1.1, cash: 1.5, moves: ['hit', 'steal', 'taunt'], art: 'pickpocket_parrot' },
  swarm: { hp: 0.45, off: 0.8, def: 0.7, spd: 1.1, exp: 0.6, cash: 0.6, moves: ['hit', 'hit2'], art: 'banana_bunch' },
  lurker: { hp: 0.9, off: 1.25, def: 0.9, spd: 1.1, exp: 1.15, cash: 1.0, moves: ['hit', 'strong', 'status'], art: 'jungle_jitterbug' },
};

type MoveKey = 'hit' | 'hit2' | 'strong' | 'taunt' | 'status' | 'steal';

interface RegionPack {
  /** elemental affinities the forge draws weaknesses from */
  weak: Weakness[];
  /** the status a caster/lurker of this region tends to inflict */
  status: Status;
  adjectives: readonly string[];
  nouns: readonly string[];
  /** verbs for the basic hit lines (§A11 voice, draft) */
  verbs: readonly string[];
  deaths: readonly string[];
  bg: [number, number];
}

/** one pack per Ch.3–10 site (the Bible's settings) — draft flavor the human
 *  rewrites at promotion; the forge only needs it to read PLAUSIBLE. */
const REGIONS: Record<number, RegionPack> = {
  3: { weak: ['volt', 'freeze'], status: 'productive', adjectives: ['Prefect', 'Tardy', 'Detention', 'Foggy'], nouns: ['Drone', 'Inkwell', 'Bell', 'Locker'], verbs: ['filed a complaint', 'rang the bell early', 'marked you absent'], deaths: ['{e} was dismissed for the term.', '{e} powered down with a polite chime.'], bg: [RAMP.BLUE, RAMP.CYAN] },
  4: { weak: ['fire', 'salt'], status: 'asleep', adjectives: ['Frostbit', 'Sleeping', 'Hollow', 'Granite'], nouns: ['Knuckle', 'Echo', 'Drift', 'Snore'], verbs: ['rolled over in its sleep', 'breathed a cold fog', 'shrugged a boulder loose'], deaths: ['{e} settled back into the mountain.', '{e} went quiet under the snow.'], bg: [RAMP.CYAN, RAMP.BLUE] },
  5: { weak: ['insect', 'fire'], status: 'paralyzed', adjectives: ['Tiny', 'Ducal', 'Petty', 'Pocket'], nouns: ['Page', 'Guardsman', 'Crumb', 'Decree'], verbs: ['called a vote', 'stamped a tiny seal', 'marched in formation'], deaths: ['{e} resigned its commission.', '{e} folded into the grass.'], bg: [RAMP.GRASS, RAMP.GOLD] },
  6: { weak: ['freeze', 'salt'], status: 'crying', adjectives: ['Cackling', 'Echoing', 'Sunbaked', 'Hollow'], nouns: ['Mask', 'Idol', 'Jackal', 'Riddle'], verbs: ['laughed in three places at once', 'told a joke with no ending', 'echoed your own steps'], deaths: ['{e} ran out of punchline.', '{e} crumbled, still chuckling.'], bg: [RAMP.GOLD, RAMP.RED] },
  7: { weak: ['freeze', 'volt'], status: 'paralyzed', adjectives: ['Gilded', 'Coiled', 'Royal', 'Lacquer'], nouns: ['Cobra', 'Vizier', 'Anklet', 'Mirror'], verbs: ['fixed you with a gilded stare', 'rattled a warning', 'struck from the throne'], deaths: ['{e} uncoiled and was still.', '{e} slid back behind the curtain.'], bg: [RAMP.PURPLE, RAMP.GOLD] },
  8: { weak: ['fire', 'volt'], status: 'asleep', adjectives: ['Folded', 'Spore', 'Paper', 'Lantern'], nouns: ['Guardian', 'Cap', 'Crane', 'Wick'], verbs: ['refolded into a new shape', 'puffed a cloud of spores', 'creased itself sharper'], deaths: ['{e} came unfolded.', '{e} drifted apart on the damp.'], bg: [RAMP.MAGENTA, RAMP.GRASS] },
  9: { weak: ['fire', 'freeze'], status: 'crying', adjectives: ['Theatrical', 'Velvet', 'Cardboard', 'Sobbing'], nouns: ['Prop', 'Usher', 'Gargoyle', 'Curtain'], verbs: ['delivered a fake spell with real force', 'slammed a trapdoor', 'wailed in a Cleveland accent'], deaths: ['{e} took its bow and meant it.', '{e} fell apart at the seams.'], bg: [RAMP.PURPLE, RAMP.RED] },
  10: { weak: ['volt', 'fire'], status: 'asleep', adjectives: ['Silent', 'Static', 'Faded', 'Hollow'], nouns: ['Drifter', 'Signal', 'Husk', 'Quiet'], verbs: ['unmade a little of the sound', 'reached out of the static', 'forgot you were there'], deaths: ['{e} went back to silence.', '{e} thinned out into nothing.'], bg: [RAMP.NIGHT, RAMP.PURPLE] },
};

/** assemble one move from a key, scaled to the enemy's role/region (draft text) */
function makeMove(key: MoveKey, region: RegionPack, S: Streams, i: number): EnemyMove {
  switch (key) {
    case 'hit':
      return { name: 'strike', kind: 'attack', mult: 1, text: `{e} ${S.pick(`hitverb${i}`, region.verbs)}!`, weight: 5 };
    case 'hit2':
      return { name: 'flurry', kind: 'attack', mult: 1.2, text: `{e} pressed the attack!`, weight: 3 };
    case 'strong':
      return { name: 'heavy blow', kind: 'strong', mult: 1.7, text: `{e} wound up something big!`, weight: 3 };
    case 'taunt':
      return { name: 'jeer', kind: 'taunt', text: `{e} ${S.pick(`tauntverb${i}`, region.verbs)}.`, weight: 2 };
    case 'status':
      return { name: 'hex', kind: 'status', status: region.status, text: `{e} tried to leave its mark on you.`, weight: 3 };
    case 'steal':
      return { name: 'snatch', kind: 'steal', text: `{e} made a grab for your things!`, weight: 2 };
  }
}

export interface EnemyRecipe {
  chapter: number;
  role: ForgeRole;
  seed: number;
  /** index within a forged roster (keeps ids + levels deterministic) */
  index: number;
}

/**
 * Forge one enemy from a recipe: stats off the chapter midpoint × role shape,
 * level inside the chapter window, EXP/cash on the §A9 slope, role-template
 * moves, region weaknesses, a §A11 draft death line, and a placeholder sprite.
 * (recipe + seed) → identical bytes (the forge test hash-pins it).
 */
export function buildEnemy(r: EnemyRecipe): DraftEnemyDef {
  const S = new Streams(r.seed);
  const spec = ROLES[r.role];
  const region = REGIONS[r.chapter] ?? REGIONS[6];
  const [lo, hi] = CHAPTER_LEVELS[r.chapter] ?? CHAPTER_LEVELS[1];
  const level = lo + ((r.index + S.int(`lvl${r.index}`, 2)) % Math.max(1, hi - lo + 1));
  const mid = chapterMid(r.chapter);

  // a small per-enemy jitter inside the role band (±10%), seeded
  const j = (name: string): number => 0.9 + S.next(name) * 0.2;
  const hp = Math.max(1, Math.round(mid.hp * spec.hp * j(`hp${r.index}`)));
  const offense = Math.max(0, Math.round(mid.offense * spec.off * j(`off${r.index}`)));
  const defense = Math.max(0, Math.round(mid.defense * spec.def * j(`def${r.index}`)));
  const speed = Math.max(0, Math.round(mid.speed * spec.spd * j(`spd${r.index}`)));
  const exp = Math.max(0, Math.round(mid.exp * spec.exp * j(`exp${r.index}`)));
  const cash = Math.max(0, Math.round(mid.cash * spec.cash * j(`cash${r.index}`)));

  // weaknesses: 0–2 from the region pool (deterministic)
  const weakness: Weakness[] = [];
  for (const w of region.weak) if (S.chance(`weak_${w}_${r.index}`, 0.5)) weakness.push(w);

  const moves = spec.moves.map((k, mi) => makeMove(k, region, S, r.index * 10 + mi));
  const name = `${S.pick(`adj${r.index}`, region.adjectives)} ${S.pick(`noun${r.index}`, region.nouns)}`;
  const deathLine = S.pick(`death${r.index}`, region.deaths);

  return {
    id: `forge_ch${r.chapter}_${r.role}_${r.index}`,
    name,
    article: 'The',
    hp,
    offense,
    defense,
    speed,
    level,
    exp,
    cash,
    weakness,
    moves,
    deathLine,
    sprite: `battle_${spec.art}`, // placeholder until 3b composes the real face
    mini: `mini_${spec.art}`,
    bg: region.bg,
    role: r.role,
    chapter: r.chapter,
  };
}

/**
 * A forged ROSTER for a chapter: a spread of roles (the §B4 dungeon variety —
 * grunts, a bruiser, a caster, etc.), deterministic on (chapter, seed). This is
 * what BAND_ROSTER points Ch.3–10 at; the ids resolve through the dev forge
 * registry the LAB injects (canon ENEMIES never sees a forged draft).
 */
export function buildRoster(chapter: number, seed: number, count = 6): DraftEnemyDef[] {
  const S = new Streams(seed ^ (chapter * 0x9e37));
  const roster: DraftEnemyDef[] = [];
  // always include a grunt + a bruiser + a caster; fill the rest by seed
  const plan: ForgeRole[] = ['grunt', 'bruiser', 'caster'];
  while (plan.length < count) plan.push(FORGE_ROLES[S.int(`role${plan.length}`, FORGE_ROLES.length)]);
  plan.forEach((role, index) => {
    roster.push(buildEnemy({ chapter, role, seed: seed ^ (index * 0x1f1f), index }));
  });
  return roster;
}
