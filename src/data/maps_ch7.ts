/**
 * CHAPTER 7 MAPS: "The Cobra's Palace" (India). §A5/§A6 — once the Laughing Chord
 * is in the locket, Bert flies the party on to CHANDRAPORE, the game's biggest city:
 * bazaar mazes, river ghats, a cinema running a three-hour musical about the party
 * (nobody believes you're them). Out past the bazaars the MONSOON ROAD runs the dust
 * up to the night train and, beyond it, the usurped palace. Deep in the throne room
 * the COBRA RAJA coils on the stolen crown and answers with a PARALYZING gaze (the
 * §A6 BOSS — it sheds its skin once at 40% and heals; burn it through the threshold).
 *
 * Ch.7 is a STRAIGHT chapter (no branch beat — the three Held-Breath choices live in
 * Ch.6/9/10), so the maps carry only the standard beats: arrival, the dungeon climb,
 * the boss, and the Resonance Site where Ember 7 lands and `ch7_complete` opens the
 * next leg. The party is whole by now (5 heroes), so no one joins here.
 *
 * Same ADR-004 code-grid law as every chapter; reachability is GRID-based (mapcheck
 * BFS). Chandrapore wears a bazaar-port skin (dev-art — reuses the §A5 zanzibel
 * catalog until the PKG-14 India art pass gives it its own). Layouts FINAL, dev-art;
 * the palace dungeon reskins to carved sandstone at the art pass. The dungeon corridor
 * is kept deliberately open (the boss trigger must fire on foot — no soft-lock, ADR-014).
 */
import { Grid, treeSprite } from './mapkit';
import { buildDistrict, Streams } from '../levelkit';
import { AREA_SKINS } from '../spritegen/buildings';
import type { MapDef, PropDef } from '../schemas';

const PICNIC_SOLID = { ox: 2, oy: 8, w: 32, h: 14 } as const;
const PHONE_SOLID = { ox: 1, oy: 10, w: 14, h: 16 } as const;
const TREE_SOLID = { ox: 7, oy: 22, w: 12, h: 10 } as const;
const ROCK_SOLID = { ox: 2, oy: 12, w: 24, h: 12 } as const;

/** the open tile CHANDRAPORE sets the party down on when Bert lands at the bazaar
 *  edge (the ch7_arrival beat fires on the south landing square by the ghats). */
export const CHANDRAPORE_LANDING = { x: 8, y: 22 } as const;

/* ════════════════════════════════ CHANDRAPORE ════════════════════════════════ *
 * The bazaar-maze capital — a real ribbon-street city (the ADR-012 grid: two E-W
 * market streets stitched by an avenue, bazaar facades on two block faces). The party
 * land by the river ghats and are funnelled up through the bazaar. The SPICE MERCHANT
 * keeps the Grand Bazaar shelf (and sets the seven_spices hunt); the DABBAWALA frets
 * over the Monkey Magnate's rooftop thievery; the STATIONMASTER minds the night train;
 * the CINEMA USHER will not believe you are the five children in his movie. The road
 * climbs E out to the Monsoon Road. Bert parks Lucille at the ghat edge so the party
 * is never stranded (`biplane_interior` board door — the FRONTIER nav law). */
function buildChandrapore(): MapDef {
  const W = 40;
  const H = 26;
  const g = new Grid(W, H, '.'); // sun-warm bazaar dust
  g.rect(0, 0, W, 2, 'B');
  g.rect(0, 0, 1, H, 'B');
  g.rect(W - 1, 0, 1, H, 'B');
  g.rect(0, H - 1, W, 1, 'B');
  // TWO E-W market streets + the avenue that stitches them (the ADR-012 city
  // minimums) — the UPPER street IS the GHAT RUN out to the Monsoon Road
  g.rect(1, 9, W - 2, 3, 'R'); // street 1 — THE GHAT RUN (rows 9-11)
  g.rect(1, 18, W - 2, 3, 'R'); // street 2 — the lower bazaar lane (rows 18-20)
  g.rect(19, 9, 3, 12, 'R'); // the avenue stitching the two streets (col 20, 12 tall)
  for (let x = 2; x < W - 2; x++) {
    if (x < 19 || x > 21) {
      g.set(x, 10, 'D'); // dashed centerlines, broken at the avenue
      g.set(x, 19, 'D');
    }
  }
  // E mouth → the Monsoon Road (on street 1)
  g.set(W - 1, 9, 'R');
  g.set(W - 1, 10, 'R');
  g.set(W - 1, 11, 'R');
  // THE BAZAAR DISTRICT — dev-art reuses the §A5 zanzibel bazaar-port skin until
  // Chandrapore gets its own at the India art pass; on TWO block faces (the grand
  // ghat front and the built-up block between streets), the ADR-012 city minimum.
  const occupied: Array<{ x: number; y: number; w: number; h: number }> = [];
  const north = buildDistrict(g, { x: 2, y: 2, w: 36, h: 6 }, new Streams(7100701), {
    layout: 'grid',
    style: 'bazaar-port',
    catalog: AREA_SKINS.zanzibel,
    streetRows: [7],
    maxStories: 3,
    sprinkle: true,
    occupied,
  });
  const middle = buildDistrict(g, { x: 2, y: 13, w: 16, h: 4 }, new Streams(7100702), {
    layout: 'grid',
    style: 'bazaar-port',
    catalog: AREA_SKINS.zanzibel,
    streetRows: [16],
    maxStories: 2,
    sprinkle: true,
    occupied,
  });

  const props: PropDef[] = [
    ...north.props,
    ...middle.props,
    { sprite: treeSprite(4, 23), x: 4, y: 23, solid: TREE_SOLID }, // a pipal tree by the ghats
    { sprite: 'meteor_rock', x: 35, y: 23, solid: ROCK_SOLID }, // a half-buried meteor stone the bazaar built around
    { sprite: 'picnic', x: 25, y: 15, solid: PICNIC_SOLID }, // §A4.5 rest spot — a chai-stall mat
    { sprite: 'payphone', x: 30, y: 8.2, solid: PHONE_SOLID },
    { sprite: 'prop_trail_marker', x: 20, y: 22 }, // the avenue approach marker
    { sprite: 'well', x: 13, y: 23 }, // a stepwell the city draws from
  ];

  return {
    id: 'chandrapore',
    name: 'CHANDRAPORE',
    music: null,
    settlement: 'city',
    grid: g.out(),
    props,
    npcs: [
      // THE SPICE MERCHANT — keeps the Grand Bazaar shelf (the §A8 Ch.7 shop) and
      // sets the seven_spices scavenger hunt (placeholder sprite until the art pass)
      { id: 'cp_spice_merchant', sprite: 'zanzibel_market_queen', x: 6, y: 8, facing: 'down', dialogue: 'npc_cp_spice_merchant', shop: 'chandrapore_bazaar' },
      // THE DABBAWALA — the monkey_who_stole_tuesday giver (the Magnate took his tiffin
      // run AND the party's hat off a rooftop)
      { id: 'cp_dabbawala', sprite: 'zanzibel_dockmaster', x: 33, y: 16, facing: 'down', dialogue: 'npc_cp_dabbawala', stationary: true, idle: true },
      // THE STATIONMASTER — minds the night train (the dungeon mouth); flavor + signpost
      { id: 'cp_stationmaster', sprite: 'laughing_ruins_guide', x: 26, y: 19, facing: 'down', dialogue: 'npc_cp_stationmaster', wander: true },
      // THE CINEMA USHER — the Majestic plays a musical about the party; he will not
      // believe you are them (the bible gag; the chapter's quiet centre)
      { id: 'cp_usher', sprite: 'baobab_healer', x: 12, y: 22, facing: 'down', dialogue: 'npc_cp_usher', stationary: true, idle: true, emote: 'happy' },
    ],
    signs: [
      { x: 3, y: 8, dialogue: 'sign_chandrapore' },
      { x: 37, y: 12, dialogue: 'sign_monsoon_gate' },
      { x: 20, y: 21, dialogue: 'sign_chandrapore_court' },
    ],
    phones: [{ x: 30, y: 8 }],
    atms: [{ x: 32, y: 8 }],
    doors: [
      { x: W - 1, y: 10, w: 1, h: 2, to: 'monsoon_road', tx: 1 * 16, ty: 8 * 16, facing: 'right', indicator: 'none' },
      // board Lucille — parked at the ghat edge by the landing square; so once Ch.7 is
      // done (or a later leg lands) Bert can fly the party on (FRONTIER nav law — a
      // frontier city must never be a dead-end; the Zanzibel/Minimus precedent)
      { x: 8, y: 24, w: 2, h: 1, to: 'biplane_interior', tx: 11 * 16, ty: 8 * 16, facing: 'down', indicator: 'none' },
    ],
    spawners: [],
    triggers: [
      // the §A6 arrival — Bert sets the party down on the ghat landing square (once)
      { id: 'ch7_arrival', rect: { x: 5, y: 21, w: 6, h: 3 }, once: true },
    ],
  };
}

/* ═══════════════════════════════ THE MONSOON ROAD ════════════════════════════ *
 * The dust road out of Chandrapore to the night train and the palace. The §A7 road
 * ecosystem works the verges: the Rickshaw Swarm cuts you off, the Spice Djinn coughs
 * a cloud, the Temple Macaque drops from the rooftops, the Naga Sentry coils across
 * the way. A chai-stall rest before the climb. The road forks W back to Chandrapore
 * and E into the night train. */
function buildMonsoonRoad(): MapDef {
  const W = 36;
  const H = 16;
  const g = new Grid(W, H, '.'); // monsoon-green verge
  // THE ROAD — a broad dust track W↔E (the one road up-country)
  g.rect(1, 7, W - 2, 3, '=');
  g.rect(0, 0, W, 1, 'B');
  g.rect(0, H - 1, W, 1, 'B');
  g.rect(0, 0, 1, H, 'B');
  g.rect(W - 1, 0, 1, H, 'B');
  g.set(0, 7, '=');
  g.set(0, 8, '='); // W mouth → chandrapore
  g.set(W - 1, 7, '=');
  g.set(W - 1, 8, '='); // E mouth → night_train

  return {
    id: 'monsoon_road',
    name: 'THE MONSOON ROAD',
    music: null,
    grid: g.out(),
    props: [
      { sprite: treeSprite(5, 3), x: 5, y: 3, solid: TREE_SOLID }, // a banyan on the verge
      { sprite: treeSprite(29, 3), x: 29, y: 3, solid: TREE_SOLID },
      { sprite: 'meteor_rock', x: 12, y: 12, solid: ROCK_SOLID }, // a roadside shrine-stone
      { sprite: 'prop_trail_marker', x: 18, y: 6 },
      { sprite: 'picnic', x: 8, y: 12, solid: PICNIC_SOLID }, // §A4.5 the chai-stall rest
    ],
    npcs: [],
    signs: [
      { x: 3, y: 6, dialogue: 'sign_monsoon_road' },
      { x: 30, y: 6, dialogue: 'sign_palace_mouth' },
    ],
    phones: [],
    doors: [
      { x: 0, y: 7, w: 1, h: 2, to: 'chandrapore', tx: 38 * 16, ty: 10 * 16, facing: 'left', indicator: 'none' },
      { x: W - 1, y: 7, w: 1, h: 2, to: 'night_train', tx: 9 * 16, ty: 20 * 16, facing: 'right', indicator: 'none' },
    ],
    spawners: [
      { enemies: ['rickshaw_swarm', 'spice_djinn'], count: 2, rect: { x: 3, y: 3, w: 8, h: 3 } },
      { enemies: ['naga_sentry', 'temple_macaque'], count: 2, rect: { x: 24, y: 3, w: 9, h: 3 } },
      { enemies: ['temple_macaque', 'rickshaw_swarm'], count: 2, rect: { x: 22, y: 11, w: 9, h: 3 } },
    ],
    triggers: [],
  };
}

/* ════════════════════ THE NIGHT TRAIN — the dungeon (level 1) ═════════════════ *
 * The overloaded night train, stopped on the spur below the palace (§A6 — the dungeon
 * mouth). The §A7 dungeon specialists work the dark between the cars (the Spice Djinn
 * fogs a carriage, the Naga Sentry guards the couplings). The central corridor (cols
 * 8-11) is kept OPEN the full height so the climb never soft-locks. The aisle opens N
 * up into the palace throne room. */
function buildNightTrain(): MapDef {
  const W = 20;
  const H = 22;
  const g = new Grid(W, H, '.'); // carriage boards
  // the carriage walls (reskin to lacquered teak + brass at the art pass)
  g.rect(0, 0, W, 1, 'O');
  g.rect(0, 0, 1, H, 'O');
  g.rect(W - 1, 0, 1, H, 'O');
  g.rect(0, H - 1, W, 1, 'O');
  g.set(9, H - 1, 'o'); // the way in from the Monsoon Road (S)
  g.set(10, H - 1, 'o');
  g.set(9, 0, 'o'); // the way up to the palace throne (N)
  g.set(10, 0, 'o');
  // bench-rows + luggage racks — interior dressing that frames the aisle WITHOUT ever
  // closing the central corridor (cols 8-11 stay open S↔N; mapcheck BFS clears it)
  g.rect(3, 5, 1, 4, 'O');
  g.rect(15, 5, 1, 4, 'O');
  g.rect(3, 13, 1, 4, 'O');
  g.rect(15, 13, 1, 4, 'O');
  g.rect(5, 9, 2, 1, 'O'); // a fallen trunk, left of the aisle
  g.rect(13, 9, 2, 1, 'O'); // a fallen trunk, right of the aisle
  g.rect(5, 17, 2, 1, 'O');
  g.rect(13, 17, 2, 1, 'O');

  return {
    id: 'night_train',
    name: 'THE NIGHT TRAIN',
    music: null,
    grid: g.out(),
    props: [
      { sprite: 'meteor_rock', x: 4, y: 7, solid: ROCK_SOLID }, // a toppled steamer trunk
      { sprite: 'meteor_rock', x: 15, y: 15, solid: ROCK_SOLID },
      { sprite: 'prop_trail_marker', x: 9, y: 18 },
      { sprite: 'prop_trail_marker', x: 9, y: 4 },
    ],
    npcs: [],
    signs: [{ x: 9, y: 19, dialogue: 'sign_night_train' }],
    phones: [],
    doors: [
      { x: 9, y: H - 1, w: 2, h: 1, to: 'monsoon_road', tx: 34 * 16, ty: 8 * 16, facing: 'down', indicator: 'none' },
      { x: 9, y: 0, w: 2, h: 1, to: 'palace_throne', tx: 9 * 16, ty: 14 * 16, facing: 'up', indicator: 'none' },
    ],
    spawners: [
      { enemies: ['spice_djinn', 'naga_sentry'], count: 2, rect: { x: 2, y: 3, w: 5, h: 4 } },
      { enemies: ['temple_macaque', 'spice_djinn'], count: 2, rect: { x: 13, y: 3, w: 5, h: 4 } },
      { enemies: ['naga_sentry', 'temple_macaque'], count: 2, rect: { x: 2, y: 16, w: 5, h: 4 } },
    ],
    triggers: [],
  };
}

/* ═══════════════════ THE PALACE THRONE — boss + resonance ═════════════════════ *
 * The climb ends in the usurped THRONE ROOM — the §A6 Resonance Site. The COBRA RAJA
 * coils on the stolen crown and meets the eye: every third turn a PARALYZING gaze, and
 * at 40% it SHEDS its skin and heals — burn it through the threshold (the §A6 BOSS).
 * Beat it and the throne SINGS: Heartlight 7 records and Ember 7 lands (`ch7_complete`).
 * The party is already whole — no one joins here. */
function buildPalaceThrone(): MapDef {
  const W = 20;
  const H = 16;
  const g = new Grid(W, H, '.'); // the marble throne floor
  g.rect(0, 0, W, 1, 'O');
  g.rect(0, 0, 1, H, 'O');
  g.rect(W - 1, 0, 1, H, 'O');
  g.rect(0, H - 1, W, 1, 'O');
  g.set(9, H - 1, 'o'); // back down into the night train (S)
  g.set(10, H - 1, 'o');

  return {
    id: 'palace_throne',
    name: 'THE PALACE THRONE',
    music: null,
    grid: g.out(),
    props: [
      { sprite: 'meteor_rock', x: 9, y: 5, solid: ROCK_SOLID }, // the throne the Raja coils on
      { sprite: 'prop_resonance_stones', x: 9, y: 9 }, // the §A6 resonance ring centring the chamber
      { sprite: 'prop_trail_marker', x: 5, y: 11 },
      { sprite: 'prop_trail_marker', x: 14, y: 11 },
    ],
    npcs: [],
    signs: [{ x: 9, y: 12, dialogue: 'sign_palace_throne' }],
    phones: [],
    doors: [
      { x: 9, y: H - 1, w: 2, h: 1, to: 'night_train', tx: 9 * 16, ty: 1 * 16, facing: 'down', indicator: 'none' },
    ],
    spawners: [],
    triggers: [
      // the §A6 BOSS — the Cobra Raja coils on the crown (the gaze/threshold fight;
      // endBattle on its 20000 HP — sheds skin once at 40% and heals)
      { id: 'cobra_raja_boss', rect: { x: 7, y: 4, w: 4, h: 3 }, once: false },
      // the Resonance Site — Heartlight 7 records once the Raja is beaten; Ember 7
      // lands here and ch7_complete opens the next leg (the chapter close)
      { id: 'palace_throne_resonance', rect: { x: 7, y: 8, w: 4, h: 3 }, once: true },
    ],
  };
}

/**
 * THE CHAPTER 7 MAP SET — Bert lands the party at Chandrapore; the Monsoon Road carries
 * the dust up to the night train, and the climb ends at the palace throne, where the
 * §A6 boss coils on the stolen crown and Ember 7 waits. Assembled like buildChapter6Maps
 * (a record spread into MAPS).
 */
export function buildChapter7Maps(): Record<string, MapDef> {
  return {
    chandrapore: buildChandrapore(),
    monsoon_road: buildMonsoonRoad(),
    night_train: buildNightTrain(),
    palace_throne: buildPalaceThrone(),
  };
}
