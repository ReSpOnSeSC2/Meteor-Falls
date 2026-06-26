/**
 * CHAPTER 5 MAPS: "The Grand Duchy of Minimus" (Minimus). §A5/§A6 — the HIGH
 * Ember fell on coronation night and shrank the realm to 1/100; the duchy calls
 * it a blessing. The party arrive as the visiting COLOSSI and are routed down the
 * one sanctioned road — the PROCESSION WAY — so the Whistle Guards do not have to
 * panic. MINIMUS MAJOR is a tabletop capital (knee-high cathedral, ribbon streets);
 * the Way leads out to THE HEDGEROW (a hedge maze that is a forest at their scale —
 * the dungeon), and past it the DUCAL CROWN, the realm's crown jewel and the §A6
 * Resonance Site, where a housecat — WHISKERZILLA — naps. Pippa Quill, royal census
 * cadet, attaches as a guide; the Duchess holds court; the duchy's hundred engineers
 * grind Sigrid's spare lens into the Big-Little Lens (Milo's Ch.5 build).
 *
 * Same ADR-004 code-grid law as every chapter; reachability is GRID-based (mapcheck
 * BFS). Minimus Major wears the §A5 `minimus` skin + heraldic glyph banner (MAP_AREA,
 * maps.ts). Layouts FINAL, dev-art (the authored minimus facades dress the edges; the
 * Hedgerow reskins to hedges at the PKG-12 art pass). Scale is the joke (§A6/§A11):
 * doors are ankle-high, citizens are sprite-dots, the danger is embarrassment.
 */
import { Grid, treeSprite } from './mapkit';
import { buildDistrict, Streams } from '../levelkit';
import { AREA_SKINS } from '../spritegen/buildings';
import type { MapDef, PropDef } from '../schemas';

const PICNIC_SOLID = { ox: 2, oy: 8, w: 32, h: 14 } as const;
const PHONE_SOLID = { ox: 1, oy: 10, w: 14, h: 16 } as const;
const TREE_SOLID = { ox: 7, oy: 22, w: 12, h: 10 } as const;
const ROCK_SOLID = { ox: 2, oy: 12, w: 24, h: 12 } as const;

/** the open tile MINIMUS MAJOR sets the party down on when Lucille lands "in the
 *  duchy. All of it." (the ch5_arrival beat fires on the south landing square) */
export const MINIMUS_LANDING = { x: 8, y: 22 } as const;

/* ═══════════════════════════ MINIMUS MAJOR ═══════════════════════════════════ *
 * The tabletop capital — a real ribbon-street city (the ADR-012 grid: two E-W
 * streets stitched by an avenue, spire-canton facades on two block faces). The party
 * tiptoe in along the PROCESSION WAY (the upper street, the one the Whistle Guards
 * let the colossi walk). PIPPA QUILL tries to brief them from a matchbox podium and
 * is mistaken for a talking lapel pin; she attaches as a guide. GRAND DUCHESS
 * MILLIMETTA I holds court on the southern square. The duchy's engineers grind the
 * Big-Little Lens (the §A6 Milo build, `big_little_lens` beat). The Ducal Provisioner
 * keeps the shelf. Citizens are never damaged — the danger is paperwork. The Way
 * climbs east out to the Procession Way proper. Lucille lands here (`ch5_arrival`). */
function buildMinimusMajor(): MapDef {
  const W = 40;
  const H = 26;
  const g = new Grid(W, H, '.'); // duchy turf
  g.rect(0, 0, W, 2, 'B');
  g.rect(0, 0, 1, H, 'B');
  g.rect(W - 1, 0, 1, H, 'B');
  g.rect(0, H - 1, W, 1, 'B');
  // TWO E-W streets + the avenue that stitches them (the ADR-012 city minimums) —
  // the UPPER street IS the Procession Way the colossi walk; ribbon-street dressing
  g.rect(1, 9, W - 2, 3, 'R'); // street 1 — THE PROCESSION WAY (rows 9-11)
  g.rect(1, 18, W - 2, 3, 'R'); // street 2 — the lower court road (rows 18-20)
  g.rect(19, 9, 3, 12, 'R'); // the avenue stitching the two streets (col 20, 12 tall)
  for (let x = 2; x < W - 2; x++) {
    if (x < 19 || x > 21) {
      g.set(x, 10, 'D'); // dashed centerlines, broken at the avenue
      g.set(x, 19, 'D');
    }
  }
  // E mouth → the Procession Way proper (on street 1)
  g.set(W - 1, 9, 'R');
  g.set(W - 1, 10, 'R');
  g.set(W - 1, 11, 'R');
  // THE DUCHY DISTRICT — Minimus Major's own M25 skin (cathedral / palace / census
  // office / thimble inn / whistle barracks), spire-canton, on TWO block faces: the
  // grand north front, and the built-up block between the streets
  const occupied: Array<{ x: number; y: number; w: number; h: number }> = [];
  const north = buildDistrict(g, { x: 2, y: 2, w: 36, h: 6 }, new Streams(217844), {
    layout: 'grid',
    style: 'spire-canton',
    catalog: AREA_SKINS.minimus,
    streetRows: [7],
    maxStories: 3,
    sprinkle: true,
    occupied,
  });
  const middle = buildDistrict(g, { x: 2, y: 13, w: 16, h: 4 }, new Streams(217845), {
    layout: 'grid',
    style: 'spire-canton',
    catalog: AREA_SKINS.minimus,
    streetRows: [16],
    maxStories: 2,
    sprinkle: true,
    occupied,
  });

  const props: PropDef[] = [
    ...north.props,
    ...middle.props,
    { sprite: treeSprite(4, 23), x: 4, y: 23, solid: TREE_SOLID }, // a "tree" (a sprig of parsley)
    { sprite: 'meteor_rock', x: 35, y: 23, solid: ROCK_SOLID }, // a pebble the duchy calls a boulder
    { sprite: 'picnic', x: 25, y: 15, solid: PICNIC_SOLID }, // §A4.5 rest spot (a matchbox table)
    { sprite: 'payphone', x: 30, y: 8.2, solid: PHONE_SOLID },
    { sprite: 'prop_trail_marker', x: 20, y: 22 }, // the court approach marker
  ];

  return {
    id: 'minimus_major',
    name: 'MINIMUS MAJOR',
    music: null,
    settlement: 'city',
    grid: g.out(),
    props,
    npcs: [
      // PIPPA QUILL — royal census cadet, the party's guide (joins playable at the
      // chapter close; here she is an NPC on her matchbox podium, openly herself)
      { id: 'mn_pippa', sprite: 'pippa', x: 10, y: 22, facing: 'down', dialogue: 'npc_mn_pippa', stationary: true, idle: true, emote: 'think' },
      // GRAND DUCHESS MILLIMETTA I — holds court on the southern square
      { id: 'mn_duchess', sprite: 'grand_duchess_millimetta', x: 22, y: 23, facing: 'up', dialogue: 'npc_mn_duchess', stationary: true, emote: 'happy' },
      // the lens engineer — the §A6 Big-Little Lens build + the civic_repairs giver
      { id: 'mn_engineer', sprite: 'spool_engineer', x: 31, y: 14, facing: 'down', dialogue: 'npc_mn_engineer', stationary: true },
      // the Census-Taker — the royal_census giver (every tiny person has a name)
      { id: 'mn_census', sprite: 'royal_census_taker', x: 33, y: 16, facing: 'down', dialogue: 'npc_mn_census', stationary: true, idle: true },
      // the Ducal Provisioner — the §A8 Ch.5 shelf (Prompt 31)
      { id: 'mn_provisioner', sprite: 'teacup_innkeeper', x: 6, y: 8, facing: 'down', dialogue: 'npc_mn_provisioner', shop: 'minimus_provisioner' },
      // the Lost & Found clerk — the regional Lost & Found of Impossible Sizes giver
      { id: 'mn_lostfound', sprite: 'tiny_postmaster', x: 26, y: 19, facing: 'down', dialogue: 'npc_mn_lostfound', wander: true },
      // the Belfry keeper — the regional Silent Belfry giver (ties to Heartlight 5)
      { id: 'mn_bellkeeper', sprite: 'matchbox_herald', x: 15, y: 22, facing: 'down', dialogue: 'npc_mn_bellkeeper', stationary: true },
    ],
    signs: [
      { x: 3, y: 8, dialogue: 'sign_minimus_major' },
      { x: 37, y: 12, dialogue: 'sign_procession_gate' },
      { x: 20, y: 21, dialogue: 'sign_ducal_court' },
    ],
    phones: [{ x: 30, y: 8 }],
    atms: [{ x: 32, y: 8 }],
    doors: [
      { x: W - 1, y: 10, w: 1, h: 2, to: 'procession_way', tx: 16, ty: 8 * 16, facing: 'right', indicator: 'none' },
      // board Lucille — parked at the duchy edge by the landing square; so once the
      // chapter is done (or a later leg lands) the cabin Bert can fly the party on,
      // and Minimus is never a dead-end (the Kvisthavn/foggybottom boarding precedent)
      { x: 8, y: 24, w: 2, h: 1, to: 'biplane_interior', tx: 11 * 16, ty: 8 * 16, facing: 'down', indicator: 'none' },
    ],
    spawners: [
      // the §A7 social oddities — towns are jokes, not death-traps (one contained
      // pocket in the SE corner, clear of the court, the doors, and the fixtures)
      { enemies: ['lapel_pin_mob', 'town_crier'], count: 1, rect: { x: 32, y: 22, w: 5, h: 2 } },
    ],
    triggers: [
      // the §A6 arrival — Lucille sets the party down on the south landing square (once)
      { id: 'ch5_arrival', rect: { x: 5, y: 21, w: 6, h: 3 }, once: true },
      // the §A6 Milo build — the engineers grind Sigrid's spare lens into the
      // Big-Little Lens (party-wide Focus; in-fiction unlock of big_little_focus)
      { id: 'big_little_lens', rect: { x: 29, y: 14, w: 3, h: 2 }, once: true },
    ],
  };
}

/* ═══════════════════════════ THE PROCESSION WAY ══════════════════════════════ *
 * The sanctioned colossi road out of Minimus Major to the Hedgerow. Whistle-Guard
 * roamers route the party "by the book"; the §A7 road ecosystem works the verges
 * (the Census Pigeon, the Toll Clerk, the Cobble Mite, the Tin Parade, the rare
 * Snuffbox Beetle, the Royal Tax Assessor, and the §A6 set-piece, the Grand Parade,
 * which takes a vote each turn). MR. CLICK waits with his macro-lens for the
 * minister's portrait (the regional "Say Cheese, Minister"). Picnic rest before the
 * maze. The Way forks W to Minimus Major and E into the Hedgerow. */
function buildProcessionWay(): MapDef {
  const W = 36;
  const H = 16;
  const g = new Grid(W, H, '.'); // verge turf
  // THE WAY — a broad cobbled ribbon W↔E (the one sanctioned road)
  g.rect(1, 7, W - 2, 3, '=');
  // drystone kerbs fringe the verge; the two road-mouths stay open
  g.rect(0, 0, W, 1, 'B');
  g.rect(0, H - 1, W, 1, 'B');
  g.rect(0, 0, 1, H, 'B');
  g.rect(W - 1, 0, 1, H, 'B');
  g.set(0, 7, '=');
  g.set(0, 8, '='); // W mouth → minimus_major
  g.set(W - 1, 7, '=');
  g.set(W - 1, 8, '='); // E mouth → the_hedgerow

  return {
    id: 'procession_way',
    name: 'THE PROCESSION WAY',
    music: null,
    grid: g.out(),
    props: [
      { sprite: treeSprite(5, 3), x: 5, y: 3, solid: TREE_SOLID }, // verge "trees" (stalks of wheat)
      { sprite: treeSprite(29, 3), x: 29, y: 3, solid: TREE_SOLID },
      { sprite: 'meteor_rock', x: 12, y: 12, solid: ROCK_SOLID }, // a milestone (a thimble)
      { sprite: 'prop_trail_marker', x: 18, y: 6 },
      { sprite: 'picnic', x: 8, y: 12, solid: PICNIC_SOLID }, // §A4.5 rest before the maze
    ],
    npcs: [
      // MR. CLICK — the macro-lens photographer (the regional "Say Cheese, Minister")
      { id: 'pw_click', sprite: 'curator', x: 22, y: 11, facing: 'up', dialogue: 'npc_pw_click', stationary: true, idle: true, emote: 'happy' },
      // a Whistle Guard on point duty (one obsession: keep the colossi ON the Way)
      { id: 'pw_guard', sprite: 'whistle_guard_npc', x: 15, y: 9, facing: 'down', dialogue: 'npc_pw_guard', wander: true },
    ],
    signs: [
      { x: 3, y: 6, dialogue: 'sign_procession_way' },
      { x: 30, y: 6, dialogue: 'sign_hedgerow_mouth' },
    ],
    phones: [],
    doors: [
      { x: 0, y: 7, w: 1, h: 2, to: 'minimus_major', tx: 37 * 16, ty: 13 * 16, facing: 'left', indicator: 'none' },
      { x: W - 1, y: 7, w: 1, h: 2, to: 'the_hedgerow', tx: 12 * 16, ty: 16 * 16, facing: 'right', indicator: 'none' },
    ],
    spawners: [
      { enemies: ['whistle_guard', 'cobble_mite', 'census_pigeon'], count: 2, rect: { x: 3, y: 3, w: 8, h: 3 } },
      { enemies: ['toll_clerk', 'tin_parade', 'duelist_pip'], count: 2, rect: { x: 24, y: 3, w: 9, h: 3 } },
      { enemies: ['crumb_cannoneer', 'windup_wyrmlet', 'powderwig_wasp', 'dust_bunny'], count: 2, rect: { x: 3, y: 11, w: 9, h: 3 } },
      // the §A6 set-piece + the rares work the verges (kept clear of Mr. Click's
      // photo trigger + the road-mouths — Prime Law 4 encounter-pressure spacing)
      { enemies: ['grand_parade'], count: 1, rect: { x: 26, y: 11, w: 6, h: 3 } },
      { enemies: ['snuffbox_beetle', 'tax_assessor'], count: 1, rect: { x: 13, y: 3, w: 6, h: 2 } },
    ],
    triggers: [
      // the regional "Say Cheese, Minister" — Pippa on a thimble podium, the Duchess's
      // knee-high portrait (Mr. Click's macro-lens; active-quest pickup)
      { id: 'q_say_cheese', rect: { x: 21, y: 10, w: 3, h: 2 }, once: false },
    ],
  };
}

/* ═══════════════════════ THE HEDGEROW — the dungeon ══════════════════════════ *
 * A hedge maze that is, at the party's scale, a forest (§A6 — the dungeon). The
 * §A7 dungeon specialists make the green fight back (the Hedge Sprite ambushes, the
 * Topiary Knight walls, the Bramble Tangle roots); the late-chapter pressure foes
 * (the Halberd Column, the Bell-Ringer Acolyte) remix the boss's lessons (Defend /
 * evasion) before the Crown. A scale set-piece — a leaf you cross like a footbridge —
 * reads through Milo's new Big-Little Lens (`the_hedgerow_lens`, optional flavor; the
 * path is always passable — no soft-lock). The maze opens N onto the Ducal Crown. */
function buildTheHedgerow(): MapDef {
  const W = 26;
  const H = 18;
  const g = new Grid(W, H, '.'); // the maze floor (mossy green at their scale)
  // the hedge perimeter (reskins to a privet wall at the art pass)
  g.rect(0, 0, W, 1, 'O');
  g.rect(0, 0, 1, H, 'O');
  g.rect(W - 1, 0, 1, H, 'O');
  g.rect(0, H - 1, W, 1, 'O');
  g.set(11, H - 1, 'o'); // the way in from the Procession Way (S)
  g.set(12, H - 1, 'o');
  g.set(12, 0, 'o'); // the way out to the Ducal Crown (N)
  g.set(13, 0, 'o');
  // hedge ridges — soft interior walls that make the green a maze, never sealing a
  // region (the S↔N spine stays open the length of the map; mapcheck BFS clears it)
  g.rect(4, 3, 1, 9, 'O');
  g.rect(9, 6, 1, 9, 'O');
  g.rect(16, 3, 1, 9, 'O');
  g.rect(21, 6, 1, 8, 'O');
  g.rect(9, 6, 8, 1, 'O'); // a cross-hedge with the spine gap kept at x12-13

  return {
    id: 'the_hedgerow',
    name: 'THE HEDGEROW',
    music: null,
    grid: g.out(),
    props: [
      { sprite: treeSprite(3, 14), x: 3, y: 14 }, // hedge dressing (non-solid; the 'O' walls carry collision)
      { sprite: treeSprite(22, 4), x: 22, y: 4 },
      { sprite: 'meteor_rock', x: 7, y: 9, solid: ROCK_SOLID }, // a fallen acorn the size of a boulder
      { sprite: 'prop_trail_marker', x: 12, y: 13 }, // the Way's last marker before the maze
      { sprite: 'prop_trail_marker', x: 18, y: 8 },
    ],
    npcs: [],
    signs: [{ x: 12, y: 14, dialogue: 'sign_the_hedgerow' }],
    phones: [],
    doors: [
      { x: 11, y: H - 1, w: 2, h: 1, to: 'procession_way', tx: 34 * 16, ty: 8 * 16, facing: 'down', indicator: 'none' },
      { x: 12, y: 0, w: 2, h: 1, to: 'ducal_crown', tx: 10 * 16, ty: 13 * 16, facing: 'up', indicator: 'none' },
    ],
    spawners: [
      { enemies: ['hedge_sprite', 'bramble_tangle'], count: 2, rect: { x: 5, y: 3, w: 4, h: 4 } },
      { enemies: ['topiary_knight', 'powderwig_wasp'], count: 1, rect: { x: 17, y: 3, w: 4, h: 4 } },
      { enemies: ['bell_ringer_acolyte', 'dust_bunny'], count: 2, rect: { x: 5, y: 12, w: 4, h: 4 } },
      // the late-chapter pressure wall guards the last stretch before the Crown
      { enemies: ['halberd_column', 'hedge_sprite'], count: 1, rect: { x: 17, y: 12, w: 4, h: 4 } },
    ],
    triggers: [
      // a scale set-piece read through Milo's Big-Little Lens (optional; never gates)
      { id: 'the_hedgerow_lens', rect: { x: 18, y: 8, w: 2, h: 2 }, once: true },
    ],
  };
}

/* ═══════════════════════ THE DUCAL CROWN — boss + resonance ══════════════════ *
 * Past the Hedgerow sits the DUCAL CROWN — the realm's crown jewel and the §A6
 * Resonance Site. The Flat Bell hangs above; a housecat, WHISKERZILLA, has claimed
 * the Crown as a napping spot (the §A6 BOSS — a mercy/survival, not a kill). You do
 * not beat it; you survive it until it gets bored, and the Duchess KNIGHTS it. Then
 * the Crown sings and Heartlight 5 — THE BELL CHOIR — is recorded (`ch5_complete`),
 * the Duchess appoints PIPPA Foreign Minister (joins playable), and the travel-worn
 * gi kid who kept turning up a step ahead is revealed: DORIN joins, too. */
function buildDucalCrown(): MapDef {
  const W = 20;
  const H = 16;
  const g = new Grid(W, H, '.'); // the Crown's velvet dais (open green at their scale)
  g.rect(0, 0, W, 1, 'O');
  g.rect(0, 0, 1, H, 'O');
  g.rect(W - 1, 0, 1, H, 'O');
  g.rect(0, H - 1, W, 1, 'O');
  g.set(9, H - 1, 'o'); // back down into the Hedgerow (S)
  g.set(10, H - 1, 'o');

  return {
    id: 'ducal_crown',
    name: 'THE DUCAL CROWN',
    music: null,
    grid: g.out(),
    props: [
      // the crown jewel itself (a pebble, to the duchy a mountain of light) + the
      // §A6 resonance ring centring the chamber; the Flat Bell hangs above in-battle
      { sprite: 'meteor_rock', x: 9, y: 5, solid: ROCK_SOLID }, // the Ducal Crown (the napping spot)
      { sprite: 'prop_resonance_stones', x: 9, y: 9 },
      { sprite: 'prop_trail_marker', x: 5, y: 11 },
      { sprite: 'prop_trail_marker', x: 14, y: 11 },
    ],
    npcs: [],
    signs: [{ x: 9, y: 12, dialogue: 'sign_ducal_crown' }],
    phones: [],
    doors: [
      { x: 9, y: H - 1, w: 2, h: 1, to: 'the_hedgerow', tx: 12 * 16, ty: 1 * 16, facing: 'down', indicator: 'none' },
    ],
    spawners: [],
    triggers: [
      // the §A6 BOSS — Whiskerzilla naps on the Crown (the boss room is the dais)
      { id: 'whiskerzilla_boss', rect: { x: 7, y: 4, w: 4, h: 3 }, once: false },
      // the Resonance Site — Heartlight 5 (The Bell Choir) records once it is knighted,
      // and the two joins (Pippa + Dorin) land here (the chapter close)
      { id: 'ducal_crown_resonance', rect: { x: 7, y: 8, w: 4, h: 3 }, once: true },
    ],
  };
}

/**
 * THE CHAPTER 5 MAP SET — Lucille lands the party in Minimus Major; the Procession
 * Way leads out through the Hedgerow to the Ducal Crown, where the §A6 boss naps and
 * Heartlight 5 waits. Assembled like buildChapter4Maps (a record spread into MAPS).
 */
export function buildChapter5Maps(): Record<string, MapDef> {
  return {
    minimus_major: buildMinimusMajor(),
    procession_way: buildProcessionWay(),
    the_hedgerow: buildTheHedgerow(),
    ducal_crown: buildDucalCrown(),
  };
}
