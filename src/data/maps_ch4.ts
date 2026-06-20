/**
 * CHAPTER 4 MAPS: "The Fjord That Sleeps" (Norway). §A5/§A6 — Lucille's North
 * Sea hop sets the party down at KVISTHAVN, a normal-scale fishing hamlet under
 * the cliffs. Past the tree line the LOW Ember's hum has swelled every living
 * thing: BOOTSTEP MOOR (10× wildlife, half of it friendly) and LILLEBY, the
 * giants' town (pop. 41), where the party walks under doors. The dungeon, THE
 * SLEEPER'S SPINE, crosses the sleeping giant Grandfather Storheim hand →
 * shoulder → ear; his terrain IS the map (never a giant sprite). The Resonance
 * Site is the Sleeper's Ear, where BOSS 4 — THE WHISPERWIG burrows.
 *
 * Same ADR-004 code-grid law as every chapter; reachability is GRID-based
 * (mapcheck BFS). Kvisthavn + Lilleby declare their §A5 `area` via MAP_AREA in
 * maps.ts (kvisthavn / lilleby skins, ADR-066) and their ambience bed. Three
 * picnic tables (§A4.5) sit before the dungeon. The §A4.11 PSI gate (freeze the
 * meltwater fall, `spine_meltfall`) lives on the Sleeper's shoulder. Layouts
 * FINAL, dev-art (the authored Kvisthavn/Lilleby facades dress the edges).
 */
import { Grid, treeSprite } from './mapkit';
import { buildDistrict, Streams } from '../levelkit';
import { AREA_SKINS } from '../spritegen/buildings';
import type { MapDef, PropDef } from '../schemas';

const PICNIC_SOLID = { ox: 2, oy: 8, w: 32, h: 14 } as const;
const PHONE_SOLID = { ox: 1, oy: 10, w: 14, h: 16 } as const;
const TREE_SOLID = { ox: 7, oy: 22, w: 12, h: 10 } as const;
const PINE_SOLID = { ox: 8, oy: 30, w: 16, h: 12 } as const;
const ROCK_SOLID = { ox: 2, oy: 12, w: 24, h: 12 } as const;

/** the open tile KVISTHAVN sets you down on when Lucille's North Sea hop lands */
export const KVISTHAVN_LANDING = { x: 18, y: 8 } as const;

/* ───────────────────────────── KVISTHAVN ─────────────────────────────────── *
 * A cozy fishing hamlet under the cliffs (normal scale — the calm before the
 * giants). A cobbled lane along the quay, the fjord to the south (reflective),
 * the supply shop (Kvisthavn Kolonial), and townsfolk with one obsession each
 * (§A11): Sigrid and her lost spectacles, Halvor and the letter he never sent,
 * the bellkeeper and the quay bell the Hush muffled. Picnic #1 of 3. The fjord
 * road climbs east onto Bootstep Moor. Lucille lands here (`ch4_arrival`). */
function buildKvisthavn(): MapDef {
  const W = 36;
  const H = 24;
  const g = new Grid(W, H, '.'); // green/cobble (grass stand-in)
  // cliffs N + sides; the fjord to the S
  g.rect(0, 0, W, 2, 'B');
  g.rect(0, 0, 1, H - 4, 'B');
  g.rect(W - 1, 0, 1, H - 4, 'B');
  g.rect(0, H - 3, W, 1, 'E'); // foam at the water's lip
  g.rect(0, H - 2, W, 2, 'e'); // the fjord
  // THE QUAY LANE — a cobbled spine, open + obviously connected
  g.rect(2, 12, W - 4, 3, '=');
  g.rect(16, 12, 3, 9, '='); // the quay steps down to the water
  g.rect(2, 8, W - 4, 1, '='); // the back lane under the cliffs
  // a green where the picnic + the arrival landing sit (west)
  g.rect(3, 16, 12, 4, '.');
  // gate gap E → the fjord road (bootstep_moor)
  g.set(W - 1, 12, '.');
  g.set(W - 1, 13, '.');
  // THE HAMLET — Kvisthavn's own M25 skin (boathouse/chapel/cabin/cafe/shop)
  const occupied: Array<{ x: number; y: number; w: number; h: number }> = [];
  const row = buildDistrict(g, { x: 2, y: 2, w: 32, h: 6 }, new Streams(410401), {
    layout: 'organic',
    style: 'fog-stone',
    catalog: AREA_SKINS.kvisthavn,
    lanes: 3,
    maxStories: 2,
    sprinkle: true,
    occupied,
  });

  const props: PropDef[] = [
    ...row.props,
    { sprite: treeSprite(3, 10), x: 3, y: 10, solid: TREE_SOLID },
    { sprite: 'prop_pine_whisperwood', x: 33, y: 9, solid: PINE_SOLID },
    { sprite: 'picnic', x: 5, y: 17, solid: PICNIC_SOLID }, // §A4.5 picnic #1 of 3
    { sprite: 'payphone', x: 22, y: 11.2, solid: PHONE_SOLID },
    { sprite: 'meteor_rock', x: 26, y: 17, solid: ROCK_SOLID }, // a mooring stone on the quay
  ];

  return {
    id: 'kvisthavn',
    name: 'KVISTHAVN',
    music: null,
    settlement: 'village',
    grid: g.out(),
    props,
    npcs: [
      // Sigrid — the spectacles giver (one obsession: she must see the fjord)
      { id: 'kv_sigrid', sprite: 'sigrid_spectacles', x: 7, y: 13, facing: 'down', dialogue: 'npc_kv_sigrid', stationary: true, idle: true, emote: 'think' },
      // Halvor — the fisher, the unsent-letter giver (one obsession: the one that got away, also literally a person)
      { id: 'kv_halvor', sprite: 'kvisthavn_fisher', x: 17, y: 18, facing: 'down', dialogue: 'npc_kv_halvor', stationary: true },
      // the bellkeeper — the silenced-bell giver (one obsession: a town that can be heard)
      { id: 'kv_bellkeeper', sprite: 'tomas', x: 28, y: 13, facing: 'down', dialogue: 'npc_kv_bellkeeper', stationary: true },
      // the supply-shop keeper (one obsession: the fish were BIGGER before the hum)
      { id: 'kv_shopkeeper', sprite: 'kvisthavn_shopkeeper', x: 11, y: 9, facing: 'down', dialogue: 'npc_kv_shopkeeper', shop: 'kvisthavn_supply' },
      // a kid skipping stones (one obsession: the fjord hums back if you hum first)
      { id: 'kv_kid', sprite: 'pajamaKid', x: 14, y: 19, facing: 'down', dialogue: 'npc_kv_kid', wander: true, emote: 'happy' },
    ],
    signs: [
      { x: 3, y: 11, dialogue: 'sign_kvisthavn' },
      { x: 34, y: 11, dialogue: 'sign_fjord_road' },
      { x: 17, y: 15, dialogue: 'sign_quay_bell' },
    ],
    phones: [{ x: 22, y: 11 }],
    atms: [{ x: 24, y: 11 }],
    doors: [
      { x: W - 1, y: 12, w: 1, h: 2, to: 'bootstep_moor', tx: 16, ty: 9 * 16, facing: 'right', indicator: 'none' },
    ],
    spawners: [
      // a lone gull works the quay (kept off the lane + away from the doors/phone)
      { enemies: ['hushed_gull'], count: 1, rect: { x: 4, y: 20, w: 8, h: 1 } },
    ],
    // the §A6 arrival beat fires on the green where Lucille sets down (once)
    triggers: [
      { id: 'ch4_arrival', rect: { x: 16, y: 7, w: 5, h: 2 }, once: true },
      // §A10 "The Silenced Bell" — the clapper rolled off the quay (active-quest only)
      { id: 'q_bell_clapper', rect: { x: 16, y: 19, w: 3, h: 2 }, once: false },
    ],
    reflect: [{ x: 0, y: H - 2, w: W, h: 2 }], // the fjord mirrors the quay (ADR-108)
  };
}

/* ───────────────────────────── BOOTSTEP MOOR ─────────────────────────────── *
 * Open moor where the LOW Ember's hum has swelled the wildlife to 10× (§A6) —
 * the chapter's scale-comedy roamers live here (the Colossal Gnat, the Thunder
 * Snail, the Dog-Sized Berry, the Enormous Frost-Hare, the Junior Jötun). A
 * gorge splits the moor; the BRIDGE BERRY blocks the only crossing until it is
 * fought or rolled aside (the §A7 set-piece). Sigrid's two pond-sized lenses sit
 * out on the bog (q_sigrid). Picnic #2 of 3. Lanes fork to Kvisthavn (W),
 * Lilleby (E), and down the Sleeper's hand into the Spine (S). */
function buildBootstepMoor(): MapDef {
  const W = 34;
  const H = 18;
  const g = new Grid(W, H, '.'); // open moor turf
  g.rect(1, 8, W - 2, 2, ':'); // the W↔E moor lane
  g.rect(15, 9, 2, 8, ':'); // the S fork down the giant's hand → the Spine
  // drystone walls fringe the moor; the three path-mouths stay open
  g.rect(0, 0, W, 1, 'B');
  g.rect(0, H - 1, W, 1, 'B');
  g.rect(0, 0, 1, H, 'B');
  g.rect(W - 1, 0, 1, H, 'B');
  g.set(0, 8, ':');
  g.set(0, 9, ':'); // W mouth → kvisthavn
  g.set(W - 1, 8, ':');
  g.set(W - 1, 9, ':'); // E mouth → lilleby
  g.set(15, H - 1, ':');
  g.set(16, H - 1, ':'); // S mouth → the Sleeper's hand
  // the gorge — a band of water cutting N–S that the bridge berry blocks
  g.rect(22, 1, 2, 7, 'e');
  g.rect(22, 10, 2, 7, 'e');
  g.rect(22, 8, 2, 2, ':'); // the bridge planks (on the lane), berry-blocked

  return {
    id: 'bootstep_moor',
    name: 'BOOTSTEP MOOR',
    music: null,
    grid: g.out(),
    props: [
      { sprite: 'prop_pine_whisperwood', x: 4, y: 3, solid: PINE_SOLID },
      { sprite: 'prop_pine_whisperwood_b', x: 28, y: 3, solid: PINE_SOLID },
      { sprite: 'prop_pine_whisperwood_c', x: 30, y: 13, solid: PINE_SOLID },
      { sprite: 'meteor_rock', x: 8, y: 13, solid: ROCK_SOLID }, // a glacial erratic
      { sprite: 'prop_trail_marker', x: 17, y: 11 },
      { sprite: 'picnic', x: 6, y: 5, solid: PICNIC_SOLID }, // §A4.5 picnic #2 of 3
    ],
    npcs: [
      { id: 'moor_walker', sprite: 'tomas', x: 12, y: 7, facing: 'down', dialogue: 'npc_moor_walker', wander: true },
    ],
    signs: [
      { x: 10, y: 9, dialogue: 'sign_bootstep_moor' },
      { x: 21, y: 9, dialogue: 'sign_gorge' },
    ],
    phones: [],
    doors: [
      { x: 0, y: 8, w: 1, h: 2, to: 'kvisthavn', tx: 34 * 16, ty: 12 * 16, facing: 'left', indicator: 'none' },
      { x: W - 1, y: 8, w: 1, h: 2, to: 'lilleby', tx: 16, ty: 11 * 16, facing: 'right', indicator: 'none' },
      { x: 15, y: H - 1, w: 2, h: 1, to: 'spine_hand', tx: 12 * 16, ty: 12 * 16, facing: 'up', indicator: 'none' },
    ],
    spawners: [
      { enemies: ['colossal_gnat', 'moor_midge_cloud'], count: 2, rect: { x: 3, y: 3, w: 8, h: 3 } },
      { enemies: ['thunder_snail', 'boulder_lichen'], count: 1, rect: { x: 25, y: 3, w: 6, h: 3 } },
      { enemies: ['frost_hare', 'dog_sized_berry'], count: 2, rect: { x: 25, y: 12, w: 7, h: 3 } },
      { enemies: ['junior_jotun'], count: 1, rect: { x: 9, y: 12, w: 5, h: 3 } }, // the rare grab-bruiser
    ],
    triggers: [
      // §A10 "Sigrid's Spectacles" — the two pond-sized lenses (active-quest only)
      { id: 'q_sigrid_lens1', rect: { x: 4, y: 13, w: 3, h: 2 }, once: false },
      { id: 'q_sigrid_lens2', rect: { x: 18, y: 4, w: 3, h: 2 }, once: false },
      // §A10 "The Giant's Picnic" — one moor berry for the human-sized feast
      { id: 'q_picnic_berry', rect: { x: 18, y: 13, w: 3, h: 2 }, once: false },
      // the §A7 set-piece: the Bridge Berry blocks the gorge until it is moved
      { id: 'moor_bridge_berry', rect: { x: 22, y: 8, w: 2, h: 2 }, once: false },
    ],
    reflect: [{ x: 22, y: 1, w: 2, h: 7 }], // the gorge water
  };
}

/* ───────────────────────────── LILLEBY ───────────────────────────────────── *
 * The giants' town (pop. 41), where the party walks UNDER the doors and giants
 * kneel to talk ("WELCOME TO LILLEBY. Everything here is normal-sized. — the
 * Booster Club"). The Mayor wants to host a human-sized picnic (q_picnic);
 * Halvor's sweetheart of forty years lives here now, enormous and waiting
 * (unsent_letter delivery). A giant house-cat naps in a sunbeam the size of a
 * court (the §A7 Whiskerzilla seed). The warehouse keeps the dear goods. Picnic
 * #3 of 3 — the last rest before the Spine. */
function buildLilleby(): MapDef {
  const W = 32;
  const H = 22;
  const g = new Grid(W, H, '.');
  g.rect(0, 0, W, 2, 'B');
  g.rect(0, 0, 1, H, 'B');
  g.rect(W - 1, 0, 1, H, 'B');
  g.rect(0, H - 1, W, 1, 'B');
  // the GREAT WAY — a broad ribbon street the colossi are allowed to walk
  g.rect(2, 11, W - 4, 3, '=');
  g.rect(14, 11, 3, 9, '=');
  g.set(0, 11, '=');
  g.set(0, 12, '='); // W mouth → bootstep_moor
  // the giants' district (oversized facades dress the north)
  const occupied: Array<{ x: number; y: number; w: number; h: number }> = [];
  const row = buildDistrict(g, { x: 2, y: 2, w: 28, h: 8 }, new Streams(410402), {
    layout: 'grid',
    style: 'fog-stone',
    catalog: AREA_SKINS.lilleby,
    streetRows: [9],
    maxStories: 3,
    sprinkle: true,
    occupied,
  });
  // a great table on the southern square (where the human-sized picnic is laid)
  const props: PropDef[] = [
    ...row.props,
    { sprite: 'meteor_rock', x: 6, y: 16, solid: ROCK_SOLID }, // a doorstep the size of a car
    { sprite: 'prop_pine_whisperwood', x: 29, y: 16, solid: PINE_SOLID },
    { sprite: 'desk', x: 20, y: 16, solid: { ox: 0, oy: 8, w: 30, h: 10 } }, // the great table (q_picnic)
    { sprite: 'picnic', x: 9, y: 17, solid: PICNIC_SOLID }, // §A4.5 picnic #3 of 3
    { sprite: 'payphone', x: 24, y: 10.2, solid: PHONE_SOLID },
  ];

  return {
    id: 'lilleby',
    name: 'LILLEBY',
    music: null,
    settlement: 'village',
    grid: g.out(),
    props,
    npcs: [
      // the Mayor — the picnic giver (one obsession: everything here is NORMAL-SIZED)
      { id: 'll_mayor', sprite: 'mayor_of_lilleby', x: 16, y: 13, facing: 'down', dialogue: 'npc_ll_mayor', stationary: true, emote: 'happy' },
      // the warehouse keeper (one obsession: kneeling to ring up very small customers)
      { id: 'll_keeper', sprite: 'senora', x: 8, y: 9, facing: 'down', dialogue: 'npc_ll_keeper', shop: 'lilleby_warehouse' },
      // Halvor's sweetheart, forty years on (unsent_letter delivery target)
      { id: 'll_sweetheart', sprite: 'senora', x: 27, y: 13, facing: 'down', dialogue: 'npc_ll_sweetheart', stationary: true, idle: true },
      // a giant child (one obsession: the little people are SO well-behaved)
      { id: 'll_child', sprite: 'lilleby_giant_child', x: 12, y: 18, facing: 'down', dialogue: 'npc_ll_child', wander: true },
      // the undertaker (one obsession: nobody here has died; he is very bored)
      { id: 'll_undertaker', sprite: 'lilleby_undertaker', x: 22, y: 18, facing: 'down', dialogue: 'npc_ll_undertaker', wander: true, emote: 'sleep' },
    ],
    signs: [
      { x: 3, y: 10, dialogue: 'sign_lilleby' },
      { x: 18, y: 15, dialogue: 'sign_great_table' },
    ],
    phones: [{ x: 24, y: 10 }],
    atms: [{ x: 26, y: 10 }],
    doors: [
      { x: 0, y: 11, w: 1, h: 2, to: 'bootstep_moor', tx: 32 * 16, ty: 8 * 16, facing: 'left', indicator: 'none' },
    ],
    spawners: [
      { enemies: ['giant_house_cat', 'lost_mitten'], count: 1, rect: { x: 25, y: 18, w: 5, h: 2 } },
    ],
    triggers: [
      // §A10 "The Giant's Picnic" — gather the slice + the berry, then lay the table
      { id: 'q_picnic_brunost', rect: { x: 6, y: 9, w: 4, h: 2 }, once: false },
      { id: 'q_picnic_set', rect: { x: 19, y: 17, w: 4, h: 2 }, once: false },
    ],
  };
}

/* ═══════════════════ THE SLEEPER'S SPINE — the dungeon ════════════════════ *
 * Grandfather Storheim, 100×, asleep forty years. The dungeon crosses his body
 * hand → shoulder → ear; his terrain IS the architecture (§A6 — never a giant
 * sprite). Three dungeon specialists make the body fight back (the Earwax Amber
 * Golem, the Dream-Leech, the Snore-Gust). The §A4.11 PSI gate (freeze the
 * meltwater fall off his shoulder, `spine_meltfall`) gates the way to the ear.
 * The Sleeper's Ear is the §A6 Resonance Site, where the WHISPERWIG burrows and
 * Heartlight 4 (The Deep Hum) is recorded. A travel-worn kid in a gi keeps
 * turning up a step ahead (the Dorin cameo, §A3/ADR-125 — never gives his name). */

function buildSpineHand(): MapDef {
  const W = 24;
  const H = 14;
  const g = new Grid(W, H, 'o'); // the giant's warm skin (interior floor stand-in)
  g.rect(0, 0, W, 1, 'O');
  g.rect(0, 0, 1, H, 'O');
  g.rect(W - 1, 0, 1, H, 'O');
  g.rect(0, H - 1, W, 1, 'O');
  g.set(11, 0, 'o'); // the way up the arm (N → the shoulder)
  g.set(12, 0, 'o');
  g.set(11, H - 1, 'o'); // back out onto the moor (S)
  g.set(12, H - 1, 'o');
  // knuckle ridges — soft walls that make the hand a small maze
  g.rect(5, 4, 1, 6, 'O');
  g.rect(18, 4, 1, 6, 'O');
  return {
    id: 'spine_hand',
    name: "THE SLEEPER'S HAND",
    music: null,
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'meteor_rock', x: 8, y: 6, solid: ROCK_SOLID }, // a fingernail like a cliff
      { sprite: 'meteor_rock', x: 15, y: 8, solid: ROCK_SOLID },
    ],
    npcs: [
      // the Dorin cameo — a travel-worn kid in a gi, asleep sitting up, beads in hand
      { id: 'spine_walker', sprite: 'pajamaKid', x: 12, y: 7, facing: 'down', dialogue: 'npc_spine_walker', emote: 'sleep' },
    ],
    signs: [{ x: 11, y: 3, dialogue: 'sign_spine_hand' }],
    phones: [],
    doors: [
      { x: 11, y: H - 1, w: 2, h: 1, to: 'bootstep_moor', tx: 15 * 16, ty: 16 * 16, facing: 'down', indicator: 'none' },
      { x: 11, y: 0, w: 2, h: 1, to: 'spine_shoulder', tx: 12 * 16, ty: 12 * 16, facing: 'up', indicator: 'none' },
    ],
    spawners: [
      { enemies: ['dream_leech', 'snore_gust'], count: 2, rect: { x: 7, y: 5, w: 10, h: 4 } },
    ],
    triggers: [],
  };
}

function buildSpineShoulder(): MapDef {
  const W = 24;
  const H = 14;
  const g = new Grid(W, H, 'o');
  g.rect(0, 0, W, 1, 'O');
  g.rect(0, 0, 1, H, 'O');
  g.rect(W - 1, 0, 1, H, 'O');
  g.rect(0, H - 1, W, 1, 'O');
  g.set(11, H - 1, 'o'); // down to the hand (S)
  g.set(12, H - 1, 'o');
  // THE MELTWATER FALL — a band of water across the shoulder (the §A4.11 gate).
  // Frozen by Vibe Freeze (Mia learned it Ch.2), it becomes a crossable bridge
  // to the ear beyond. Until then, the fall blocks the north way.
  g.rect(1, 5, W - 2, 2, 'e');
  g.rect(11, 5, 2, 2, 'E'); // the lip the cast freezes (the crossing)
  g.set(11, 0, 'o'); // the way up to the ear (N), beyond the fall
  g.set(12, 0, 'o');
  return {
    id: 'spine_shoulder',
    name: "THE SLEEPER'S SHOULDER",
    music: null,
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'meteor_rock', x: 4, y: 9, solid: ROCK_SOLID },
      { sprite: 'meteor_rock', x: 17, y: 9, solid: ROCK_SOLID },
      { sprite: 'prop_trail_marker', x: 12, y: 8 },
    ],
    npcs: [],
    signs: [{ x: 9, y: 8, dialogue: 'sign_spine_meltfall' }],
    phones: [],
    doors: [
      { x: 11, y: H - 1, w: 2, h: 1, to: 'spine_hand', tx: 11 * 16, ty: 1 * 16, facing: 'down', indicator: 'none' },
      { x: 11, y: 0, w: 2, h: 1, to: 'spine_ear', tx: 11 * 16, ty: 13 * 16, facing: 'up', indicator: 'none' },
    ],
    spawners: [
      { enemies: ['earwax_golem', 'snore_gust'], count: 2, rect: { x: 4, y: 9, w: 14, h: 3 } },
    ],
    // §A4.11 PSI gate — freeze the meltwater fall to a bridge (`spine_meltfall`)
    triggers: [{ id: 'spine_meltfall', rect: { x: 10, y: 7, w: 4, h: 1 }, once: false }],
    reflect: [{ x: 1, y: 5, w: W - 2, h: 2 }], // the meltwater
  };
}

function buildSpineEar(): MapDef {
  const W = 22;
  const H = 16;
  const g = new Grid(W, H, 'o'); // the warm dark of the ear canal
  g.rect(0, 0, W, 1, 'O');
  g.rect(0, 0, 1, H, 'O');
  g.rect(W - 1, 0, 1, H, 'O');
  g.rect(0, H - 1, W, 1, 'O');
  g.set(10, H - 1, 'o'); // back down to the shoulder (S)
  g.set(11, H - 1, 'o');
  // the canal spirals inward — soft curved walls to the resonance chamber
  g.rect(4, 4, 14, 1, 'O');
  g.rect(4, 4, 1, 6, 'O');
  g.rect(17, 4, 1, 6, 'O');
  g.set(10, 4, 'o'); // the gap inward
  g.set(11, 4, 'o');
  return {
    id: 'spine_ear',
    name: "THE SLEEPER'S EAR",
    music: null,
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'meteor_rock', x: 6, y: 7, solid: ROCK_SOLID }, // amber wax, set like stone
      { sprite: 'meteor_rock', x: 14, y: 7, solid: ROCK_SOLID },
    ],
    npcs: [],
    signs: [{ x: 10, y: 11, dialogue: 'sign_sleepers_ear' }],
    phones: [],
    doors: [
      { x: 10, y: H - 1, w: 2, h: 1, to: 'spine_shoulder', tx: 11 * 16, ty: 1 * 16, facing: 'down', indicator: 'none' },
    ],
    spawners: [
      { enemies: ['earwax_golem', 'dream_leech'], count: 1, rect: { x: 5, y: 11, w: 5, h: 2 } },
    ],
    triggers: [
      // the §A6 BOSS — the Whisperwig burrows in the canal (the boss room is the ear)
      { id: 'whisperwig_boss', rect: { x: 9, y: 5, w: 4, h: 2 }, once: false },
      // the Resonance Site — Heartlight 4 (The Deep Hum) records once the boss falls
      { id: 'sleepers_ear_resonance', rect: { x: 9, y: 7, w: 4, h: 3 }, once: true },
    ],
  };
}

/**
 * THE CHAPTER 4 MAP SET — Lucille's North Sea hop lands at Kvisthavn; the moor
 * and the giants' town bracket the Sleeper's Spine; the ear holds the §A6 boss
 * and Heartlight 4. Assembled like buildChapter3Maps (a record spread into MAPS).
 */
export function buildChapter4Maps(): Record<string, MapDef> {
  return {
    kvisthavn: buildKvisthavn(),
    bootstep_moor: buildBootstepMoor(),
    lilleby: buildLilleby(),
    spine_hand: buildSpineHand(),
    spine_shoulder: buildSpineShoulder(),
    spine_ear: buildSpineEar(),
  };
}
