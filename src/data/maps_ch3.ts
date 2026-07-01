/**
 * S18 (ADR-095) — CHAPTER 3 MAPS: "A Very Foggy Term" (England). HALF 1 (maps +
 * encounters + shops; the manifest stays 'unlanded' until the story/boss half).
 *
 * §A5/§A6: Uncle Bert's biplane "Lucille" sets the party down at FOGGYBOTTOM-ON-
 * TYNE — a damp stone town on the river — then the fog road climbs to WINTERMOOR
 * ACADEMY (a Hushed mainframe runs the school like a factory; the fog outside is
 * machine-made) and out to THE OLD STONES (a pocket Stonehenge, the Resonance
 * Site). Same ADR-004 code-grid law as every map; each settlement declares its
 * §A5 `area` (foggybottom / wintermoor) via MAP_AREA in maps.ts so its banner
 * wears the M22 `fraktur` glyph script (§A11.8) + its M25 stone skin (ADR-066).
 *
 * Reachability is GRID-based (mapcheck BFS over tile chars; ADR-051 building
 * props collide at runtime, not in the static check) — so content + door
 * landings sit on open chars, and buildDistrict facades dress the edges. Three
 * picnic tables (§A4.5) sit before the dungeon; the dungeon's §A4.11 PSI gate
 * (freeze the coolant pipe) lives in the boiler room. Layouts FINAL, dev-art.
 */
import { Grid, treeSprite } from './mapkit';
import { buildDistrict, Streams } from '../levelkit';
import { AREA_SKINS } from '../spritegen/buildings';
import type { MapDef, PropDef } from '../schemas';

const PICNIC_SOLID = { ox: 2, oy: 8, w: 32, h: 14 } as const;
const PHONE_SOLID = { ox: 1, oy: 10, w: 14, h: 16 } as const;
const TREE_SOLID = { ox: 7, oy: 22, w: 12, h: 10 } as const;

/** the open tile FOGGYBOTTOM sets you down on when Lucille lands (the quay) */
export const FOGGYBOTTOM_LANDING = { x: 20, y: 19 } as const;

/* ───────────────────────────── THE FLIGHT IN ─────────────────────────────── *
 * LUCILLE's cabin — a cutscene container (the boat_interior precedent): the §A6
 * arrival beat (Lucille, Uncle Bert, the machine-fog on the glass) stages here in
 * the story half. For now it is a real, walkable little deck that lets you step
 * down into Foggybottom. */
function buildBiplaneInterior(): MapDef {
  const W = 22;
  const H = 11;
  const g = new Grid(W, H, 'w'); // wooden cabin floor
  g.rect(0, 0, W, 1, 'W');
  g.rect(0, 0, 1, H, 'W');
  g.rect(W - 1, 0, 1, H, 'W');
  g.rect(0, H - 1, W, 1, 'W');
  g.set(10, H - 1, 'w'); // the hatch down
  g.set(11, H - 1, 'w');
  return {
    id: 'biplane_interior',
    name: 'LUCILLE',
    music: null,
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'crate', x: 2, y: 2, solid: { ox: 1, oy: 8, w: 18, h: 9 } },
      { sprite: 'crate', x: 18, y: 2, solid: { ox: 1, oy: 8, w: 18, h: 9 } },
      { sprite: 'desk', x: 10, y: 1.4, solid: { ox: 0, oy: 8, w: 30, h: 10 } }, // the instrument panel
    ],
    npcs: [
      { id: 'uncle_bert_air', sprite: 'uncleBert', x: 9, y: 3, facing: 'down', dialogue: 'npc_bert_air' },
    ],
    signs: [{ x: 13, y: 2, dialogue: 'sign_lucille_placard' }],
    phones: [],
    doors: [
      { x: 10, y: H - 1, w: 2, h: 1, to: 'foggybottom', tx: FOGGYBOTTOM_LANDING.x * 16, ty: FOGGYBOTTOM_LANDING.y * 16, facing: 'down', indicator: 'stairs' },
    ],
    spawners: [],
    triggers: [{ id: 'ch3_arrival', rect: { x: 9, y: 4, w: 4, h: 3 }, once: true }],
  };
}

/* ───────────────────────── FOGGYBOTTOM-ON-TYNE ───────────────────────────── *
 * A damp stone town: a cobbled high street, the river Tyne to the south, a
 * chemist (the chapter's cures + tea-as-PP), and townsfolk with one obsession
 * each (§A11). A picnic table on the green (§A4.5 #1 of 3, before the dungeon).
 * The fog road climbs north-east to the moor + the academy. */
function buildFoggybottom(): MapDef {
  const W = 40;
  const H = 28;
  const g = new Grid(W, H, '.'); // damp green / cobble (grass tile as dev stand-in)
  // stone walls N + sides; the Tyne to the S
  g.rect(0, 0, W, 2, 'B');
  g.rect(0, 0, 1, H - 4, 'B');
  g.rect(W - 1, 0, 1, H - 4, 'B');
  g.rect(0, H - 3, W, 1, 'E'); // foam at the river's lip
  g.rect(0, H - 2, W, 2, 'e'); // the river
  // THE HIGH STREET — a cobbled sidewalk spine, open + obviously connected
  g.rect(2, 13, W - 4, 3, '='); // the high street itself
  g.rect(18, 13, 3, 9, '='); // the quay lane down to the water steps
  g.rect(2, 9, W - 4, 1, '='); // a back lane fronting the north terraces
  // the open MARKET GREEN, west end (where the picnic + a present sit)
  g.rect(2, 17, 12, 4, '.');
  // gate gap E → the fog road (foggy_moor): a break in the wall ON the open spine
  // (kept clear of the north terrace district so the door stays reachable)
  g.set(W - 1, 11, '.');
  g.set(W - 1, 12, '.');
  // THE STONE TOWN — damp brownstone/bank/civic/cafe terraces to the north,
  // drawn from Foggybottom's own M25 skin (cool paper/earth/blue masonry).
  const occupied: Array<{ x: number; y: number; w: number; h: number }> = [];
  const terraces = buildDistrict(g, { x: 2, y: 2, w: 36, h: 7 }, new Streams(310301), {
    layout: 'organic',
    style: 'fog-stone',
    catalog: AREA_SKINS.foggybottom,
    lanes: 3,
    maxStories: 3,
    sprinkle: true,
    occupied,
  });

  const props: PropDef[] = [
    ...terraces.props,
    // the chemist's shopfront (the keeper stands inside the door on the street)
    { sprite: treeSprite(3, 11), x: 3, y: 11, solid: TREE_SOLID },
    { sprite: treeSprite(36, 11), x: 36, y: 11, solid: TREE_SOLID },
    // the market green (§A4.5 picnic #1 of 3, before the dungeon)
    { sprite: 'picnic', x: 5, y: 18, solid: PICNIC_SOLID },
    { sprite: 'payphone', x: 24, y: 12.2, solid: PHONE_SOLID },
  ];

  return {
    id: 'foggybottom',
    name: 'FOGGYBOTTOM-ON-TYNE',
    music: null,
    settlement: 'town',
    grid: g.out(),
    props,
    npcs: [
      // the chemist — the shopkeeper (one obsession: the correct brewing of tea)
      { id: 'fb_chemist', sprite: 'smilerB', x: 14, y: 14, facing: 'down', dialogue: 'npc_fb_chemist', shop: 'foggybottom_chemist' },
      // a fishmonger on the quay (one obsession: the Tyne's moods)
      { id: 'fb_fishmonger', sprite: 'dockworker', x: 19, y: 20, facing: 'down', dialogue: 'npc_fb_fishmonger', wander: true },
      // the postmistress (one obsession: the pillar box has opinions)
      { id: 'fb_postmistress', sprite: 'senora', x: 30, y: 14, facing: 'down', dialogue: 'npc_fb_post', idle: true, emote: 'think' }, // Wave 2 (#4): the pillar box has opinions
      // a damp small boy (one obsession: the fog tastes of pennies)
      { id: 'fb_boy', sprite: 'pajamaKid', x: 8, y: 11, facing: 'down', dialogue: 'npc_fb_boy', wander: true, emote: 'surprise' }, // Wave 2 (#4): the fog tastes of pennies!
    ],
    signs: [
      { x: 6, y: 10, dialogue: 'sign_foggybottom' },
      { x: 36, y: 11, dialogue: 'sign_fog_road' },
      { x: 17, y: 16, dialogue: 'sign_quay' },
    ],
    phones: [{ x: 24, y: 12 }],
    atms: [{ x: 26, y: 14 }],
    doors: [
      { x: 10, y: 22, w: 2, h: 1, to: 'biplane_interior', tx: 11 * 16, ty: 8 * 16, facing: 'down', indicator: 'none' }, // board Lucille (the water steps)
      { x: W - 1, y: 11, w: 1, h: 2, to: 'foggy_moor', tx: 1 * 16 + 8, ty: 9 * 16 + 12, facing: 'right', indicator: 'none' }, // land tile interior: body box clears the (0,9) border edge (no clamp rescue)
    ],
    spawners: [
      // §A7 town oddities (kept off the high street + away from the doors/phone)
      { enemies: ['pillar_box', 'brolly_bat'], count: 1, rect: { x: 30, y: 18, w: 6, h: 2 } },
    ],
    // "Return to Sender" (ADR-099) — the three letters the pillar box spat out, on
    // the green, the quay, and the back lane (active-quest only). The fourth cuppa
    // ingredient (the GOOD leaves) comes from the chemist himself, not a trigger.
    triggers: [
      { id: 'q_sender_l1', rect: { x: 3, y: 18, w: 4, h: 2 }, once: false },
      { id: 'q_sender_l2', rect: { x: 18, y: 19, w: 3, h: 2 }, once: false },
      { id: 'q_sender_l3', rect: { x: 5, y: 9, w: 5, h: 1 }, once: false },
    ],
  };
}

/* ───────────────────────────── THE FOG ROAD ──────────────────────────────── *
 * The moor lane out of Foggybottom: a winding cobble path that forks NORTH up to
 * Wintermoor's gates and SOUTH out to the Old Stones. The §A7 road/field roamers
 * live here — the fog hound out of the murk, the immovable moor sheep, the storm-
 * turned brolly, the rare Roman sentry on the old wall. Picnic #2 of 3. The whole
 * moor is open turf (everything walkable), so content + landings sit anywhere. */
function buildFoggyMoor(): MapDef {
  const W = 32;
  const H = 16;
  const g = new Grid(W, H, '.'); // open moor turf
  g.rect(1, 7, W - 2, 2, ':'); // the W↔E lane
  g.rect(23, 1, 2, 7, ':'); // the N fork → the academy
  g.rect(6, 9, 2, 6, ':'); // the S fork → the Old Stones
  // drystone walls fringe the moor; the three path-mouths stay open
  g.rect(0, 0, W, 1, 'B');
  g.rect(0, H - 1, W, 1, 'B');
  g.rect(0, 0, 1, H, 'B');
  g.rect(W - 1, 0, 1, H, 'B');
  g.set(0, 7, ':');
  g.set(0, 8, ':'); // W mouth → foggybottom
  g.set(23, 0, ':');
  g.set(24, 0, ':'); // N mouth → academy
  g.set(6, H - 1, ':');
  g.set(7, H - 1, ':'); // S mouth → the Old Stones
  return {
    id: 'foggy_moor',
    name: 'THE FOG ROAD',
    music: null,
    grid: g.out(),
    props: [
      { sprite: treeSprite(3, 3, true), x: 3, y: 3, solid: TREE_SOLID },
      { sprite: treeSprite(28, 4, true), x: 28, y: 4, solid: TREE_SOLID },
      { sprite: treeSprite(29, 12, true), x: 29, y: 12, solid: TREE_SOLID },
      { sprite: 'meteor_rock', x: 16, y: 3, solid: { ox: 2, oy: 12, w: 24, h: 12 } }, // a lone moor boulder
      { sprite: 'picnic', x: 14, y: 11, solid: PICNIC_SOLID }, // §A4.5 picnic #2 of 3
    ],
    npcs: [
      { id: 'moor_rambler', sprite: 'tomas', x: 18, y: 8, facing: 'down', dialogue: 'npc_moor_rambler', wander: true },
    ],
    signs: [{ x: 10, y: 8, dialogue: 'sign_moor' }],
    phones: [],
    doors: [
      { x: 0, y: 7, w: 1, h: 2, to: 'foggybottom', tx: 38 * 16, ty: 11 * 16, facing: 'left', indicator: 'none' },
      { x: 23, y: 0, w: 2, h: 1, to: 'wintermoor_grounds', tx: 15 * 16, ty: 22 * 16, facing: 'up', indicator: 'none' },
      { x: 6, y: H - 1, w: 2, h: 1, to: 'the_old_stones', tx: 11 * 16, ty: 2 * 16, facing: 'down', indicator: 'none' },
    ],
    spawners: [
      { enemies: ['fog_hound', 'moor_sheep'], count: 2, rect: { x: 10, y: 2, w: 10, h: 3 } },
      { enemies: ['brolly_bat', 'fog_hound'], count: 1, rect: { x: 18, y: 11, w: 6, h: 3 } },
      { enemies: ['roman_sentry'], count: 1, rect: { x: 26, y: 9, w: 4, h: 4 } }, // the rare ghost on the old wall
    ],
    // "The Penny Fog" (ADR-099) — the broken Roman drain where the fog pools thick,
    // by the old wall (active-quest only); the hidden-place discovery the boy swears by
    triggers: [{ id: 'q_penny_found', rect: { x: 25, y: 10, w: 4, h: 3 }, once: false }],
  };
}

/* ───────────────────────── WINTERMOOR ACADEMY (grounds) ──────────────────── *
 * Pale faculty blocks of cold stone (its own M25 skin), a drive up from the south
 * gate, a cricket pitch where the XI practise, the porter's lodge (the §A6 gate
 * guard — the Trust-Thread beat staged here in the story half), the groundskeeper
 * (quest #8's caller). Picnic #3 of 3, the last rest before the dungeon. The
 * school-door into the 3-floor interior lands with the story/boss half. */
function buildWintermoorGrounds(): MapDef {
  const W = 30;
  const H = 24;
  const g = new Grid(W, H, '.'); // school greens
  // PALE FACULTY BLOCKS flank the drive — two side districts (cols 2–12 and 17–27)
  // so the drive lane up the middle is NEVER overwritten (buildDistrict only writes
  // its own region; ADR-053's shared `occupied` keeps the spacing law across both).
  const occupied: Array<{ x: number; y: number; w: number; h: number }> = [];
  const west = buildDistrict(g, { x: 2, y: 2, w: 11, h: 8 }, new Streams(310311), {
    layout: 'grid', style: 'fog-stone', catalog: AREA_SKINS.wintermoor, streetRows: [9], maxStories: 3, sprinkle: true, occupied,
  });
  const east = buildDistrict(g, { x: 17, y: 2, w: 11, h: 8 }, new Streams(310312), {
    layout: 'grid', style: 'fog-stone', catalog: AREA_SKINS.wintermoor, streetRows: [9], maxStories: 3, sprinkle: true, occupied,
  });
  // the drive + cross path, laid AFTER the districts so they stay walkable
  g.rect(14, 1, 2, 22, ':'); // the drive: school steps (N) → south gate (S)
  g.rect(4, 11, 22, 2, ':'); // the cross path (greenhouse W ↔ the cricket pitch E)
  g.rect(0, 0, W, 1, 'B');
  g.rect(0, H - 1, W, 1, 'B');
  g.rect(0, 0, 1, H, 'B');
  g.rect(W - 1, 0, 1, H, 'B');
  g.set(14, H - 1, ':');
  g.set(15, H - 1, ':'); // S gate → the fog road
  return {
    id: 'wintermoor_grounds',
    name: 'WINTERMOOR ACADEMY',
    music: null,
    grid: g.out(),
    props: [
      ...west.props,
      ...east.props,
      { sprite: 'doormat', x: 14, y: 1.4 }, // the school's front steps (the door is the drive's top)
      { sprite: treeSprite(5, 14), x: 5, y: 14, solid: TREE_SOLID },
      { sprite: 'picnic', x: 22, y: 16, solid: PICNIC_SOLID }, // §A4.5 picnic #3 of 3 (the last rest before the dungeon)
    ],
    npcs: [
      { id: 'wm_porter', sprite: 'smilerB', x: 12, y: 18, facing: 'down', dialogue: 'npc_wm_porter', unlessFlag: 'wm_gate_open' }, // the §A6 gate guard — wanders off once Jay borrows him past the lodge
      { id: 'wm_groundskeeper', sprite: 'dockworker', x: 6, y: 15, facing: 'down', dialogue: 'npc_wm_groundskeeper', wander: true }, // §A10 #8 giver (Cuppa)
      { id: 'wm_student', sprite: 'pajamaKid', x: 24, y: 18, facing: 'down', dialogue: 'npc_wm_student', wander: true },
      // the First XI captain, stuck at the crease — the sincere "Last Over" giver (ADR-099)
      { id: 'cricket_captain', sprite: 'pajamaKid', x: 26, y: 17, facing: 'down', dialogue: 'npc_cricket_captain' },
    ],
    signs: [
      { x: 16, y: 20, dialogue: 'sign_wintermoor_gate' },
      { x: 24, y: 13, dialogue: 'sign_cricket_pitch' },
    ],
    phones: [],
    doors: [
      { x: 14, y: H - 1, w: 2, h: 1, to: 'foggy_moor', tx: 24 * 16, ty: 1 * 16, facing: 'down', indicator: 'none' },
      { x: 14, y: 1, w: 2, h: 1, to: 'wintermoor_f1', tx: 13 * 16, ty: 13 * 16, facing: 'up', indicator: 'door' }, // up the steps into the school
    ],
    spawners: [
      { enemies: ['prefect_drone', 'schedule_bell'], count: 2, rect: { x: 4, y: 16, w: 8, h: 4 } },
      { enemies: ['cricket_eleven'], count: 3, rect: { x: 20, y: 18, w: 7, h: 3 } }, // the XI at the nets
    ],
    triggers: [
      // §A6 — the chapter set-piece: the porter blocks, Milo crash-lands his rocket
      // into the greenhouse + JOINS (party of three), the control system goes live,
      // and Jay PUPPETS the porter past the lodge (THE FIRST BORROW; the Trust Thread
      // opens). Fires once, on the first step up the drive from the south gate.
      { id: 'wm_arrival', rect: { x: 13, y: 18, w: 4, h: 3 }, once: true },
      // §A10 #8 (Cuppa) — PROPER milk off the cricket pavilion cart (active-quest only)
      { id: 'q_cuppa_milk', rect: { x: 23, y: 15, w: 4, h: 2 }, once: false },
    ],
  };
}

/* ───────────────────────────── THE OLD STONES ────────────────────────────── *
 * A pocket Stonehenge on the open moor — the §A6 Resonance Site. The Heartlight 3
 * scene (the locket plays stem 3) stages on the `old_stones_resonance` trigger in
 * the story half; for now the ring stands, the rare ghosts wander, and a sign
 * editorialises. Dev-art uses the meteor_rock prop for the standing stones. */
function buildOldStones(): MapDef {
  const W = 22;
  const H = 18;
  const g = new Grid(W, H, '.'); // open moor turf
  g.rect(10, 1, 2, 16, ':'); // the approach path N→S
  g.rect(0, 0, W, 1, 'B');
  g.rect(0, H - 1, W, 1, 'B');
  g.rect(0, 0, 1, H, 'B');
  g.rect(W - 1, 0, 1, H, 'B');
  g.set(10, 0, ':');
  g.set(11, 0, ':'); // N mouth → the fog road
  const stoneSolid = { ox: 2, oy: 12, w: 24, h: 12 } as const;
  return {
    id: 'the_old_stones',
    name: 'THE OLD STONES',
    music: null,
    grid: g.out(),
    props: [
      { sprite: 'meteor_rock', x: 6, y: 6, solid: stoneSolid },
      { sprite: 'meteor_rock', x: 14, y: 6, solid: stoneSolid },
      { sprite: 'meteor_rock', x: 6, y: 11, solid: stoneSolid },
      { sprite: 'meteor_rock', x: 14, y: 11, solid: stoneSolid },
      { sprite: 'meteor_rock', x: 10, y: 4, solid: stoneSolid }, // the lintel stone, north of the ring
    ],
    npcs: [],
    signs: [{ x: 10, y: 14, dialogue: 'sign_old_stones' }],
    phones: [],
    doors: [
      { x: 10, y: 0, w: 2, h: 1, to: 'foggy_moor', tx: 6 * 16, ty: 14 * 16, facing: 'up', indicator: 'none' },
    ],
    spawners: [{ enemies: ['roman_sentry', 'fog_hound'], count: 1, rect: { x: 3, y: 14, w: 6, h: 2 } }],
    triggers: [
      { id: 'old_stones_resonance', rect: { x: 9, y: 7, w: 4, h: 4 }, once: true },
      // §A10 #8 (Cuppa) — the clean spring at the foot of the stones (active-quest only)
      { id: 'q_cuppa_water', rect: { x: 8, y: 13, w: 5, h: 2 }, once: false },
    ],
  };
}

/* ════════════════════ WINTERMOOR ACADEMY — the dungeon ════════════════════ *
 * A Hushed mainframe runs the school like a factory (§A6/§A7). Three floors of
 * institution-as-monster (office 'o' floors, 'O' walls — the building IS the
 * threat), a dorm stealth wing (sight-cone prefects; getting caught is a FIGHT,
 * never a fail — the §A6 stealth-lite rule, the DOS patrol precedent), and a
 * boiler room where the machine-fog is MADE — and where the §A4.11 PSI gate
 * (freeze the coolant pipe) waits for Mia's Vibe Freeze (taught in Ch.2). The
 * §A6 boss room (the Headmaster Mainframe) opens off floor 3 in the story half;
 * for now its door is a sealed panel, and the boss is a forge DRAFT. */

function buildWintermoorF1(): MapDef {
  const W = 28;
  const H = 16;
  const g = new Grid(W, H, 'o');
  g.rect(0, 0, W, 1, 'O');
  g.rect(0, 0, 1, H, 'O');
  g.rect(W - 1, 0, 1, H, 'O');
  g.rect(0, H - 1, W, 1, 'O');
  g.set(13, H - 1, 'o'); // the front doors (from the grounds)
  g.set(14, H - 1, 'o');
  // the LIBRARY stacks (NE) — bookshelf walls form the §A10 #7 "Overdue" nook
  g.rect(19, 3, 1, 6, 'O');
  g.rect(20, 3, 6, 1, 'O');
  g.rect(20, 8, 6, 1, 'O');
  g.set(19, 5, 'o'); // the gap into the stacks
  return {
    id: 'wintermoor_f1',
    name: 'WINTERMOOR — GREAT HALL',
    music: null,
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'counter', x: 3, y: 2, solid: { ox: 0, oy: 4, w: 40, h: 14 } }, // the tuck-shop counter
      { sprite: 'bookshelf', x: 21, y: 3.4, solid: { ox: 0, oy: 8, w: 64, h: 10 } }, // the stacks
      { sprite: 'payphone', x: 25, y: 13.2, solid: PHONE_SOLID }, // the hall phone box
      { sprite: 'banner_productive', x: 13, y: 0.55 },
    ],
    npcs: [
      { id: 'wm_tuck_keeper', sprite: 'smilerB', x: 4, y: 4, facing: 'down', dialogue: 'npc_wm_tuck', shop: 'wintermoor_tuck' },
      { id: 'wm_librarian', sprite: 'senora', x: 23, y: 6, facing: 'down', dialogue: 'npc_wm_librarian' },
    ],
    signs: [
      { x: 13, y: 1, dialogue: 'sign_wm_hall' },
      { x: 20, y: 2, dialogue: 'sign_wm_library' },
    ],
    phones: [{ x: 25, y: 13 }],
    doors: [
      { x: 13, y: H - 1, w: 2, h: 1, to: 'wintermoor_grounds', tx: 14 * 16, ty: 3 * 16, facing: 'down', indicator: 'door' },
      { x: 25, y: 1, w: 1, h: 1, to: 'wintermoor_f2', tx: 25 * 16, ty: 13 * 16, facing: 'down', indicator: 'stairs' },
      { x: 2, y: 1, w: 1, h: 1, to: 'wintermoor_boiler', tx: 13 * 16, ty: 11 * 16, facing: 'down', indicator: 'stairs' },
    ],
    spawners: [
      { enemies: ['possessed_textbook', 'schedule_bell'], count: 2, rect: { x: 7, y: 8, w: 9, h: 4 } },
      { enemies: ['telephone_box', 'tea_poltergeist'], count: 1, rect: { x: 6, y: 4, w: 6, h: 3 } },
      { enemies: ['overdue_tome'], count: 1, rect: { x: 21, y: 5, w: 4, h: 2 } }, // the rare, deep in the stacks
    ],
    // §A10 #7 (Overdue) — book 1, a drone's doorstop on the approach to the stacks
    // (active-quest only; clear of the §B4 spawner pressure around the rare tome)
    triggers: [{ id: 'q_overdue_b1', rect: { x: 17, y: 6, w: 2, h: 3 }, once: false }],
  };
}

function buildWintermoorF2(): MapDef {
  const W = 28;
  const H = 16;
  const g = new Grid(W, H, 'o');
  g.rect(0, 0, W, 1, 'O');
  g.rect(0, 0, 1, H, 'O');
  g.rect(W - 1, 0, 1, H, 'O');
  g.rect(0, H - 1, W, 1, 'O');
  g.set(13, H - 1, 'o'); // the dorm-wing door (south)
  g.set(14, H - 1, 'o');
  // a bank of classroom desks + lockers down the middle (the corridor maze)
  g.rect(4, 6, 9, 1, 'O');
  g.rect(15, 6, 9, 1, 'O');
  g.rect(4, 10, 9, 1, 'O');
  g.rect(15, 10, 9, 1, 'O');
  return {
    id: 'wintermoor_f2',
    name: 'WINTERMOOR — FLOOR 2',
    music: null,
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'desk', x: 6, y: 6.4, solid: { ox: 0, oy: 8, w: 40, h: 10 } },
      { sprite: 'dresser', x: 18, y: 6.4, solid: { ox: 0, oy: 8, w: 28, h: 10 } }, // a row of lockers
      { sprite: 'poster_chart', x: 13, y: 0.55 },
    ],
    npcs: [
      // Mr. Stumps, the umpire the Mainframe filed ABSENT — "The Last Over" step (ADR-099)
      { id: 'wm_umpire', sprite: 'dockworker', x: 25, y: 5, facing: 'down', dialogue: 'npc_wm_umpire' },
    ],
    signs: [{ x: 13, y: 1, dialogue: 'sign_wm_f2' }],
    phones: [],
    doors: [
      { x: 25, y: 1, w: 1, h: 1, to: 'wintermoor_f1', tx: 24 * 16, ty: 13 * 16, facing: 'down', indicator: 'stairs' }, // land at x:24, clear of the hall payphone solid at (25,13.2)
      { x: 2, y: 1, w: 1, h: 1, to: 'wintermoor_f3', tx: 3 * 16, ty: 11 * 16, facing: 'down', indicator: 'stairs' },
      { x: 13, y: H - 1, w: 2, h: 1, to: 'wintermoor_dorm', tx: 13 * 16, ty: 12 * 16, facing: 'up', indicator: 'door' }, // face UP into the room, not at the bottom wall (the dorm's f2 door is at the top)
    ],
    spawners: [
      { enemies: ['detention_desk', 'foggy_locker'], count: 2, rect: { x: 5, y: 8, w: 7, h: 1 } },
      { enemies: ['tea_trolley', 'schedule_bell'], count: 1, rect: { x: 16, y: 12, w: 8, h: 2 } },
    ],
    // §A10 #7 (Overdue) — book 2, jammed in a form-room locker on the central lane
    triggers: [{ id: 'q_overdue_b2', rect: { x: 13, y: 7, w: 2, h: 4 }, once: false }],
  };
}

function buildWintermoorF3(): MapDef {
  const W = 26;
  const H = 14;
  const g = new Grid(W, H, 'o');
  g.rect(0, 0, W, 1, 'O');
  g.rect(0, 0, 1, H, 'O');
  g.rect(W - 1, 0, 1, H, 'O');
  g.rect(0, H - 1, W, 1, 'O');
  // the HEADMASTER'S OFFICE — sealed until the story half (the boss room)
  g.rect(9, 1, 8, 5, 'O');
  return {
    id: 'wintermoor_f3',
    name: 'WINTERMOOR — THE EXAM HALL',
    music: null,
    interior: true,
    grid: g.out(),
    props: [
      // the sealed office door — the §A6 boss (Headmaster Mainframe) opens here in
      // the story half; a forge DRAFT until the manifest flips (Prime Law 1)
      { sprite: 'office_door', x: 12.5, y: 5.4, solid: { ox: 0, oy: 12, w: 16, h: 14 } },
      { sprite: 'desk', x: 4, y: 9.4, solid: { ox: 0, oy: 8, w: 30, h: 10 } }, // exam desks, ruler-straight
      { sprite: 'desk', x: 18, y: 9.4, solid: { ox: 0, oy: 8, w: 30, h: 10 } },
      { sprite: 'poster_smile', x: 6, y: 0.55 },
    ],
    npcs: [],
    signs: [
      { x: 13, y: 6, dialogue: 'sign_wm_office' },
      { x: 4, y: 8, dialogue: 'sign_wm_exam' },
    ],
    phones: [],
    doors: [
      { x: 24, y: 1, w: 1, h: 1, to: 'wintermoor_f2', tx: 2 * 16, ty: 13 * 16, facing: 'down', indicator: 'stairs' },
    ],
    spawners: [
      { enemies: ['head_prefect'], count: 1, rect: { x: 3, y: 11, w: 6, h: 2 } },
      { enemies: ['the_invigilator'], count: 1, rect: { x: 18, y: 11, w: 6, h: 2 } }, // the silent set-piece
    ],
    triggers: [{ id: 'mainframe_boss', rect: { x: 11, y: 6, w: 4, h: 1 }, once: false }], // the boss door (story half)
  };
}

function buildWintermoorDorm(): MapDef {
  const W = 26;
  const H = 14;
  const g = new Grid(W, H, 'o');
  g.rect(0, 0, W, 1, 'O');
  g.rect(0, 0, 1, H, 'O');
  g.rect(W - 1, 0, 1, H, 'O');
  g.rect(0, H - 1, W, 1, 'O');
  g.set(12, 0, 'o'); // the door back up to floor 2
  g.set(13, 0, 'o');
  // dormitory cubicle walls — sight-line blockers for the §A6 stealth-lite wing
  g.rect(4, 4, 1, 6, 'O');
  g.rect(11, 3, 1, 7, 'O');
  g.rect(18, 4, 1, 6, 'O');
  return {
    id: 'wintermoor_dorm',
    name: 'WINTERMOOR — DORM WING',
    music: null,
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'bed', x: 2, y: 5, solid: { ox: 1, oy: 8, w: 20, h: 9 } },
      { sprite: 'bed', x: 22, y: 5, solid: { ox: 1, oy: 8, w: 20, h: 9 } },
      { sprite: 'cot', x: 8, y: 10.4, solid: { ox: 1, oy: 12, w: 18, h: 10 } },
      { sprite: 'poster_smile', x: 13, y: 0.9 },
    ],
    npcs: [
      { id: 'dorm_student', sprite: 'pajamaKid', x: 6, y: 6, facing: 'down', dialogue: 'npc_dorm_student' },
    ],
    signs: [{ x: 20, y: 11, dialogue: 'sign_wm_dorm' }],
    phones: [],
    doors: [
      { x: 12, y: 0, w: 2, h: 1, to: 'wintermoor_f2', tx: 13 * 16, ty: 13 * 16, facing: 'up', indicator: 'stairs' },
    ],
    spawners: [],
    // §A6 stealth-lite: prefects patrol sight cones; a catch is a FIGHT, not a fail
    // (the DOS PRODUCTIVITY LOCK precedent — countFlags gate the wing open later)
    patrols: [
      { id: 'dorm_a', enemy: 'prefect_drone', route: [[3, 7], [22, 7]], sight: 5 },
      { id: 'dorm_b', enemy: 'prefect_drone', route: [[22, 11], [3, 11]], sight: 5 },
    ],
    // §A10 #7 (Overdue) — book 3, the first edition, under a dormitory cot
    triggers: [{ id: 'q_overdue_b3', rect: { x: 5, y: 10, w: 3, h: 2 }, once: false }],
  };
}

function buildWintermoorBoiler(): MapDef {
  const W = 24;
  const H = 13;
  const g = new Grid(W, H, 'o');
  g.rect(0, 0, W, 1, 'O');
  g.rect(0, 0, 1, H, 'O');
  g.rect(W - 1, 0, 1, H, 'O');
  g.rect(0, H - 1, W, 1, 'O');
  g.set(12, H - 1, 'o'); // the stairs back up to floor 1
  g.set(13, H - 1, 'o');
  return {
    id: 'wintermoor_boiler',
    name: 'WINTERMOOR — BOILER ROOM',
    music: null,
    interior: true,
    grid: g.out(),
    props: [
      // §A4.11 PSI GATE — the coolant line. Mia's Vibe Freeze (Ch.2) freezes it
      // solid to cross to the fog-engine beyond; the cast wiring lands with the
      // story half (psigates.ts `wintermoor_coolant`). Dev-art: the cooler prop.
      { sprite: 'water_cooler', x: 11, y: 4, solid: { ox: 0, oy: 6, w: 40, h: 14 } },
      { sprite: 'copier', x: 4, y: 2, solid: { ox: 1, oy: 6, w: 22, h: 11 } }, // the fog engine, humming
      { sprite: 'plant_pot', x: 20, y: 2, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
    ],
    npcs: [],
    signs: [{ x: 8, y: 6, dialogue: 'sign_wm_coolant' }],
    phones: [],
    doors: [
      { x: 12, y: H - 1, w: 2, h: 1, to: 'wintermoor_f1', tx: 2 * 16, ty: 3 * 16, facing: 'down', indicator: 'stairs' },
    ],
    spawners: [
      { enemies: ['boiler_golem', 'soot_imp'], count: 2, rect: { x: 4, y: 8, w: 8, h: 3 } },
      { enemies: ['greenhouse_creeper'], count: 1, rect: { x: 16, y: 8, w: 6, h: 3 } }, // it grew through the warm vents
    ],
    triggers: [{ id: 'wintermoor_coolant', rect: { x: 9, y: 5, w: 5, h: 2 }, once: false }], // §A4.11 PSI gate
  };
}

/**
 * THE CHAPTER 3 MAP SET (HALF 1) — the arrival + the England overworld + the
 * Wintermoor Academy dungeon. Assembled like buildChapter2Maps (a record spread
 * into MAPS). The §A6 boss room (Headmaster Mainframe) opens off floor 3's sealed
 * office in the story/boss half, which flips the manifest to 'shipped'.
 */
export function buildChapter3Maps(): Record<string, MapDef> {
  return {
    biplane_interior: buildBiplaneInterior(),
    foggybottom: buildFoggybottom(),
    foggy_moor: buildFoggyMoor(),
    wintermoor_grounds: buildWintermoorGrounds(),
    the_old_stones: buildOldStones(),
    wintermoor_f1: buildWintermoorF1(),
    wintermoor_f2: buildWintermoorF2(),
    wintermoor_f3: buildWintermoorF3(),
    wintermoor_dorm: buildWintermoorDorm(),
    wintermoor_boiler: buildWintermoorBoiler(),
  };
}
