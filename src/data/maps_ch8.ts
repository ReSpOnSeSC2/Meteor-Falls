/**
 * CHAPTER 8 MAPS: "The Paper Dragon" (China). §A5/§A6 — once the Coiled Raga is in
 * the locket, Bert flies the party on to LOTUS HARBOR, a temple-town on the river:
 * lacquer-red gates, a guzheng drifting off the tea-houses, paper lanterns strung the
 * length of the market. Out past the harbor the BAMBOO ROAD runs up to the SPORE
 * FOREST, where the air hangs thick with drifting spores (the Mushroomize daze — the
 * §A6 dungeon), and beyond it the Yak Express climbs to MT. SHU TEMPLE. There the monks
 * fold paper guardians — but the Hush got into the paper, and the PAPER DRAGON coils on
 * the temple bell: physical-immune while AIRBORNE (Vibe Volt or Milo's Bottle Rockets
 * ground it for two turns), and when burned low it sets ITSELF alight — it's paper —
 * into a desperate BURNING phase at doubled speed (the §A6 BOSS).
 *
 * Ch.8 is a STRAIGHT chapter (no branch beat — the three Held-Breath choices live in
 * Ch.6/9/10), so the maps carry only the standard beats: arrival, the dungeon climb,
 * the boss, and the Resonance Site (the temple bell) where Ember 8 lands and
 * `ch8_complete` opens the next leg. The party is whole by now (5 heroes), so no one
 * joins here.
 *
 * Same ADR-004 code-grid law as every chapter; reachability is GRID-based (mapcheck
 * BFS). Lotus Harbor wears its OWN painted-gates skin (AREA_SKINS.lotus_harbor); the
 * NPC sheets are dev-art reuse of the §A5 India cast until the PKG-15 China art pass
 * gives the town its own. Layouts FINAL. The forest + temple corridors are kept
 * deliberately open (the boss trigger must fire on foot — no soft-lock, ADR-014).
 */
import { Grid, treeSprite } from './mapkit';
import { buildDistrict, Streams } from '../levelkit';
import { AREA_SKINS } from '../spritegen/buildings';
import type { MapDef, PropDef } from '../schemas';

const PICNIC_SOLID = { ox: 2, oy: 8, w: 32, h: 14 } as const;
const PHONE_SOLID = { ox: 1, oy: 10, w: 14, h: 16 } as const;
const TREE_SOLID = { ox: 7, oy: 22, w: 12, h: 10 } as const;
const ROCK_SOLID = { ox: 2, oy: 12, w: 24, h: 12 } as const;

/** the open tile LOTUS HARBOR sets the party down on when Bert lands at the river
 *  ghat (the ch8_arrival beat fires on the south landing square by the water). */
export const LOTUS_HARBOR_LANDING = { x: 8, y: 22 } as const;

/* ════════════════════════════════ LOTUS HARBOR ═══════════════════════════════ *
 * The temple-town on the river — a real ribbon-street city (the ADR-012 grid: two E-W
 * market streets stitched by an avenue, painted-gate facades on two block faces). The
 * party land by the river ghat and are funnelled up through the lantern market. The
 * HARBOR MASTER keeps the harbor market shelf; the CALLIGRAPHER sets the brushes_of_mt_shu
 * hunt (her three brushes blew off into the Spore Forest); the TEA-HOUSE MONK murmurs the
 * temple elder's koan ("you run too much — run less"); the LANTERN GIRL frets over the
 * paper. The road climbs E out to the Bamboo Road. Bert parks Lucille at the ghat edge so
 * the party is never stranded (`biplane_interior` board door — the FRONTIER nav law). */
function buildLotusHarbor(): MapDef {
  const W = 40;
  const H = 26;
  const g = new Grid(W, H, '.'); // jade-warm river dust
  g.rect(0, 0, W, 2, 'B');
  g.rect(0, 0, 1, H, 'B');
  g.rect(W - 1, 0, 1, H, 'B');
  g.rect(0, H - 1, W, 1, 'B');
  // TWO E-W market streets + the avenue that stitches them (the ADR-012 city
  // minimums) — the UPPER street IS the GHAT RUN out to the Bamboo Road
  g.rect(1, 9, W - 2, 3, 'R'); // street 1 — THE GHAT RUN (rows 9-11)
  g.rect(1, 18, W - 2, 3, 'R'); // street 2 — the lower lantern market (rows 18-20)
  g.rect(19, 9, 3, 12, 'R'); // the avenue stitching the two streets (col 20, 12 tall)
  for (let x = 2; x < W - 2; x++) {
    if (x < 19 || x > 21) {
      g.set(x, 10, 'D'); // dashed centerlines, broken at the avenue
      g.set(x, 19, 'D');
    }
  }
  // E mouth → the Bamboo Road (on street 1)
  g.set(W - 1, 9, 'R');
  g.set(W - 1, 10, 'R');
  g.set(W - 1, 11, 'R');
  // THE PAINTED-GATE DISTRICT — Lotus Harbor's own temple-town skin (colonnaded
  // markets, porticoed civic temples, a lacquer-red theater) on TWO block faces (the
  // grand ghat front and the built-up block between streets), the ADR-012 city minimum.
  const occupied: Array<{ x: number; y: number; w: number; h: number }> = [];
  const north = buildDistrict(g, { x: 2, y: 2, w: 36, h: 6 }, new Streams(8100801), {
    layout: 'grid',
    style: 'painted-gates',
    catalog: AREA_SKINS.lotus_harbor,
    streetRows: [7],
    maxStories: 3,
    sprinkle: true,
    occupied,
  });
  // the lotus_harbor catalog's temple buildings are taller than the §A5 bazaar set, so the
  // middle block is the full y12-17 gap (h6) to give a façade room to land — the §A6/ADR-012
  // second block face (matches chandrapore's single middle building, on this town's own skin)
  const middle = buildDistrict(g, { x: 2, y: 12, w: 16, h: 6 }, new Streams(8100803), {
    layout: 'grid',
    style: 'painted-gates',
    catalog: AREA_SKINS.lotus_harbor,
    streetRows: [17],
    maxStories: 3,
    sprinkle: true,
    occupied,
  });

  const props: PropDef[] = [
    ...north.props,
    ...middle.props,
    { sprite: treeSprite(4, 23), x: 4, y: 23, solid: TREE_SOLID }, // a willow by the ghats
    { sprite: 'meteor_rock', x: 35, y: 23, solid: ROCK_SOLID }, // a half-buried meteor stone the temple built a shrine around
    { sprite: 'picnic', x: 25, y: 15, solid: PICNIC_SOLID }, // §A4.5 rest spot — a tea-stall mat
    { sprite: 'payphone', x: 30, y: 8.2, solid: PHONE_SOLID },
    { sprite: 'prop_trail_marker', x: 20, y: 22 }, // the avenue approach marker
    { sprite: 'well', x: 13, y: 23 }, // a temple well the town draws from
  ];

  return {
    id: 'lotus_harbor',
    name: 'LOTUS HARBOR',
    music: null,
    settlement: 'city',
    grid: g.out(),
    props,
    npcs: [
      // THE HARBOR MASTER — keeps the harbor market shelf (the §A8 Ch.8 shop)
      { id: 'lh_harbor_master', sprite: 'lh_harbor_master', x: 6, y: 8, facing: 'down', dialogue: 'npc_lh_harbor_master', shop: 'lotus_harbor_market' },
      // THE CALLIGRAPHER — the brushes_of_mt_shu giver (her three brushes blew off the
      // workshop sill into the Spore Forest; the §A10 caller)
      { id: 'lh_calligrapher', sprite: 'lh_calligrapher', x: 33, y: 16, facing: 'down', dialogue: 'npc_lh_calligrapher', stationary: true, idle: true },
      // THE TEA-HOUSE MONK — murmurs the temple elder's koan (the Teleport β hint); flavor
      { id: 'lh_tea_monk', sprite: 'lh_tea_monk', x: 26, y: 19, facing: 'down', dialogue: 'npc_lh_tea_monk', wander: true },
      // THE LANTERN GIRL — frets over the paper the Hush keeps getting into (the bible read)
      { id: 'lh_lantern_girl', sprite: 'lh_lantern_girl', x: 12, y: 22, facing: 'down', dialogue: 'npc_lh_lantern_girl', stationary: true, idle: true, emote: 'happy' },
    ],
    signs: [
      { x: 3, y: 8, dialogue: 'sign_lotus_harbor' },
      { x: 37, y: 12, dialogue: 'sign_bamboo_gate' },
      { x: 20, y: 21, dialogue: 'sign_lotus_harbor_court' },
    ],
    phones: [{ x: 30, y: 8 }],
    atms: [{ x: 32, y: 8 }],
    doors: [
      { x: W - 1, y: 10, w: 1, h: 2, to: 'bamboo_road', tx: 1 * 16, ty: 8 * 16, facing: 'right', indicator: 'none' },
      // board Lucille — parked at the ghat edge by the landing square; so once Ch.8 is
      // done (or a later leg lands) Bert can fly the party on (FRONTIER nav law — a
      // frontier city must never be a dead-end; the Zanzibel/Chandrapore precedent)
      { x: 8, y: 24, w: 2, h: 1, to: 'biplane_interior', tx: 11 * 16, ty: 8 * 16, facing: 'down', indicator: 'none' },
    ],
    spawners: [],
    triggers: [
      // the §A6 arrival — Bert sets the party down on the ghat landing square (once)
      { id: 'ch8_arrival', rect: { x: 5, y: 21, w: 6, h: 3 }, once: true },
    ],
  };
}

/* ═══════════════════════════════ THE BAMBOO ROAD ═════════════════════════════ *
 * The river road out of Lotus Harbor to the Spore Forest and the mountain. The §A7
 * road ecosystem works the verges: a lit Paper Lantern Wisp drifts off its string, a
 * Spore Puffer breathes its daze across the way, an Origami Warrior refolds in the
 * ditch. A tea-stall rest before the climb. The road forks W back to Lotus Harbor and
 * E into the Spore Forest. */
function buildBambooRoad(): MapDef {
  const W = 36;
  const H = 16;
  const g = new Grid(W, H, '.'); // bamboo-green verge
  // THE ROAD — a broad river track W↔E (the one road up-country)
  g.rect(1, 7, W - 2, 3, '=');
  g.rect(0, 0, W, 1, 'B');
  g.rect(0, H - 1, W, 1, 'B');
  g.rect(0, 0, 1, H, 'B');
  g.rect(W - 1, 0, 1, H, 'B');
  g.set(0, 7, '=');
  g.set(0, 8, '='); // W mouth → lotus_harbor
  g.set(W - 1, 7, '=');
  g.set(W - 1, 8, '='); // E mouth → spore_forest

  return {
    id: 'bamboo_road',
    name: 'THE BAMBOO ROAD',
    music: null,
    grid: g.out(),
    props: [
      { sprite: treeSprite(5, 3), x: 5, y: 3, solid: TREE_SOLID }, // a bamboo stand on the verge
      { sprite: treeSprite(29, 3), x: 29, y: 3, solid: TREE_SOLID },
      { sprite: 'meteor_rock', x: 12, y: 12, solid: ROCK_SOLID }, // a roadside shrine-stone
      { sprite: 'prop_trail_marker', x: 18, y: 6 },
      { sprite: 'picnic', x: 8, y: 12, solid: PICNIC_SOLID }, // §A4.5 the tea-stall rest
    ],
    npcs: [],
    signs: [
      { x: 3, y: 6, dialogue: 'sign_bamboo_road' },
      { x: 30, y: 6, dialogue: 'sign_spore_forest_mouth' },
    ],
    phones: [],
    doors: [
      { x: 0, y: 7, w: 1, h: 2, to: 'lotus_harbor', tx: 38 * 16, ty: 10 * 16, facing: 'left', indicator: 'none' },
      { x: W - 1, y: 7, w: 1, h: 2, to: 'spore_forest', tx: 9 * 16, ty: 20 * 16, facing: 'right', indicator: 'none' },
    ],
    spawners: [
      { enemies: ['paper_lantern_wisp', 'spore_puffer'], count: 2, rect: { x: 3, y: 3, w: 8, h: 3 } },
      { enemies: ['origami_warrior', 'paper_lantern_wisp'], count: 2, rect: { x: 24, y: 3, w: 9, h: 3 } },
      { enemies: ['paper_lantern_wisp', 'spore_puffer'], count: 2, rect: { x: 22, y: 11, w: 9, h: 3 } },
    ],
    triggers: [],
  };
}

/* ════════════════════ THE SPORE FOREST — the dungeon (level 1) ════════════════ *
 * The mushroom wood below Mt. Shu, the air thick with drifting spores (§A6 — the
 * dungeon mouth, the Mushroomize daze). The §A7 dungeon specialists work the dark
 * between the caps (the Spore Puffer breathes its daze, the Origami Warrior folds out
 * of the leaf-litter, and deeper in a Porcelain Warlord guards the old kiln — rare,
 * high-value). The central corridor (cols 8-11) is kept OPEN the full height so the
 * climb never soft-locks. The path opens N up to the Mt. Shu temple. */
function buildSporeForest(): MapDef {
  const W = 20;
  const H = 22;
  const g = new Grid(W, H, '.'); // moss floor
  // the forest walls (reskin to mushroom thicket + temple stone at the art pass)
  g.rect(0, 0, W, 1, 'O');
  g.rect(0, 0, 1, H, 'O');
  g.rect(W - 1, 0, 1, H, 'O');
  g.rect(0, H - 1, W, 1, 'O');
  g.set(9, H - 1, 'o'); // the way in from the Bamboo Road (S)
  g.set(10, H - 1, 'o');
  g.set(9, 0, 'o'); // the way up to the Mt. Shu temple (N)
  g.set(10, 0, 'o');
  // giant caps + fallen logs — thicket dressing that frames the path WITHOUT ever
  // closing the central corridor (cols 8-11 stay open S↔N; mapcheck BFS clears it)
  g.rect(3, 5, 1, 4, 'O');
  g.rect(15, 5, 1, 4, 'O');
  g.rect(3, 13, 1, 4, 'O');
  g.rect(15, 13, 1, 4, 'O');
  g.rect(5, 9, 2, 1, 'O'); // a fallen log, left of the path
  g.rect(13, 9, 2, 1, 'O'); // a fallen log, right of the path
  g.rect(5, 17, 2, 1, 'O');
  g.rect(13, 17, 2, 1, 'O');

  return {
    id: 'spore_forest',
    name: 'THE SPORE FOREST',
    music: null,
    grid: g.out(),
    props: [
      { sprite: 'meteor_rock', x: 4, y: 7, solid: ROCK_SOLID }, // a giant capped boulder-mushroom
      { sprite: 'meteor_rock', x: 15, y: 15, solid: ROCK_SOLID }, // the old kiln the Warlord guards
      { sprite: treeSprite(7, 12), x: 7, y: 12, solid: TREE_SOLID }, // a spore-tree by the path
      { sprite: 'prop_trail_marker', x: 9, y: 18 },
      { sprite: 'prop_trail_marker', x: 9, y: 4 },
    ],
    npcs: [],
    signs: [{ x: 9, y: 19, dialogue: 'sign_spore_forest' }],
    phones: [],
    doors: [
      { x: 9, y: H - 1, w: 2, h: 1, to: 'bamboo_road', tx: 34 * 16, ty: 8 * 16, facing: 'down', indicator: 'none' },
      { x: 9, y: 0, w: 2, h: 1, to: 'mt_shu_temple', tx: 9 * 16, ty: 14 * 16, facing: 'up', indicator: 'none' },
    ],
    spawners: [
      { enemies: ['spore_puffer', 'origami_warrior'], count: 2, rect: { x: 2, y: 3, w: 5, h: 4 } },
      { enemies: ['origami_warrior', 'spore_puffer'], count: 2, rect: { x: 13, y: 3, w: 5, h: 4 } },
      // the old kiln — the Porcelain Warlord lairs here alone (rare/high-value, count 1)
      { enemies: ['porcelain_warlord'], count: 1, rect: { x: 2, y: 16, w: 5, h: 4 } },
    ],
    triggers: [],
  };
}

/* ═══════════════════ THE MT. SHU TEMPLE — boss + resonance ════════════════════ *
 * The Yak Express climb ends at the cloud-wrapped MT. SHU TEMPLE — the §A6 Resonance
 * Site, the temple bell. The PAPER DRAGON coils on the bell: while AIRBORNE it shrugs
 * every bat (Vibe Volt or Bottle Rockets ground it two turns — the window physical
 * lands), and burned under 30% HP it sets ITSELF alight into a desperate BURNING glide
 * at doubled speed (the §A6 BOSS). Beat it and the bell RINGS: Heartlight 8 records and
 * Ember 8 lands (`ch8_complete`). The party is already whole — no one joins here. */
function buildMtShuTemple(): MapDef {
  const W = 20;
  const H = 16;
  const g = new Grid(W, H, '.'); // the swept temple floor
  g.rect(0, 0, W, 1, 'O');
  g.rect(0, 0, 1, H, 'O');
  g.rect(W - 1, 0, 1, H, 'O');
  g.rect(0, H - 1, W, 1, 'O');
  g.set(9, H - 1, 'o'); // back down the mountain into the spore forest (S)
  g.set(10, H - 1, 'o');

  return {
    id: 'mt_shu_temple',
    name: 'THE MT. SHU TEMPLE',
    music: null,
    grid: g.out(),
    props: [
      { sprite: 'meteor_rock', x: 9, y: 5, solid: ROCK_SOLID }, // the great bell-frame the Dragon coils on
      { sprite: 'prop_resonance_stones', x: 9, y: 9 }, // the §A6 resonance ring centring the bell-court
      { sprite: 'prop_trail_marker', x: 5, y: 11 },
      { sprite: 'prop_trail_marker', x: 14, y: 11 },
    ],
    npcs: [],
    signs: [{ x: 9, y: 12, dialogue: 'sign_mt_shu_temple' }],
    phones: [],
    doors: [
      { x: 9, y: H - 1, w: 2, h: 1, to: 'spore_forest', tx: 9 * 16, ty: 1 * 16, facing: 'down', indicator: 'none' },
    ],
    spawners: [],
    triggers: [
      // the §A6 BOSS — the Paper Dragon coils on the temple bell (the airborne/grounded
      // + self-immolation fight; endBattle on its 45000 HP)
      { id: 'paper_dragon_boss', rect: { x: 7, y: 4, w: 4, h: 3 }, once: false },
      // the Resonance Site — Heartlight 8 records once the Dragon is beaten; Ember 8
      // lands here and ch8_complete opens the next leg (the chapter close)
      { id: 'mt_shu_temple_resonance', rect: { x: 7, y: 8, w: 4, h: 3 }, once: true },
    ],
  };
}

/**
 * THE CHAPTER 8 MAP SET — Bert lands the party at Lotus Harbor; the Bamboo Road carries
 * the river dust up to the Spore Forest, and the climb ends at the Mt. Shu temple, where
 * the §A6 boss coils on the bell and Ember 8 waits. Assembled like buildChapter7Maps
 * (a record spread into MAPS).
 */
export function buildChapter8Maps(): Record<string, MapDef> {
  return {
    lotus_harbor: buildLotusHarbor(),
    bamboo_road: buildBambooRoad(),
    spore_forest: buildSporeForest(),
    mt_shu_temple: buildMtShuTemple(),
  };
}
