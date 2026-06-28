/**
 * CHAPTER 6 MAPS: "The Ruins That Laugh" (Africa). §A5/§A6 — Lucille noses south
 * to ZANZIBEL, the bazaar-port (the best market music in the game): sun-baked
 * markets, a quayside, a courier guild that teaches Teleport α. Out past the city
 * the SAVANNA RUN carries the caravan track to THE LAUGHING RUINS — a dead city
 * whose stones repeat your own laughter back at you, one beat late. Deep inside,
 * THE LAUGHING SPHINX naps in its own carved chin and answers only riddles (the
 * §A6 BOSS — right answer stuns it, wrong answer sets the whole party Crying).
 *
 * Ch.6 is the BRANCH's home chapter (ADR-126/127): in the Ruins {rex} learns to
 * HOLD THE WORLD'S BREATH (the Star Locket rewind — `held_breath_unlock`), and at
 * the lip of a collapsing stair the Hush freezes {pippa} and forces CHOICE 1 — the
 * TRUST axis (`choice_trust` → ch6_string: PULL THE STRING vs OPEN YOUR HAND). The
 * trigger zones live here; the runChoice/heldBreathBeat handlers already exist
 * (OverworldScene). The party is whole by now (5 heroes), so no one joins — Ember 6
 * lands at the Sphinx's chin and `ch6_complete` opens the next leg.
 *
 * Same ADR-004 code-grid law as every chapter; reachability is GRID-based (mapcheck
 * BFS). Zanzibel wears the §A5 `zanzibel` bazaar-port skin (AREA_SKINS, the nine
 * authored bldg_zanzibel_* facades). Layouts FINAL, dev-art; the Ruins reskin to
 * carved stone at the PKG-13 art pass. The dungeon corridor is kept deliberately
 * open (the two branching beats MUST fire on foot — no soft-lock, ADR-014 precedent).
 */
import { Grid, treeSprite } from './mapkit';
import { buildDistrict, Streams } from '../levelkit';
import { AREA_SKINS } from '../spritegen/buildings';
import type { MapDef, PropDef } from '../schemas';

const PICNIC_SOLID = { ox: 2, oy: 8, w: 32, h: 14 } as const;
const PHONE_SOLID = { ox: 1, oy: 10, w: 14, h: 16 } as const;
const TREE_SOLID = { ox: 7, oy: 22, w: 12, h: 10 } as const;
const ROCK_SOLID = { ox: 2, oy: 12, w: 24, h: 12 } as const;

/** the open tile ZANZIBEL sets the party down on when Lucille lands at the bazaar
 *  port (the ch6_arrival beat fires on the south landing square by the quay). */
export const ZANZIBEL_LANDING = { x: 8, y: 22 } as const;

/* ═══════════════════════════════ ZANZIBEL ════════════════════════════════════ *
 * The bazaar-port capital — a real ribbon-street city (the ADR-012 grid: two E-W
 * market streets stitched by an avenue, bazaar-port facades on two block faces).
 * The party land at the quay and are funnelled up the QUAYSIDE RUN into the market.
 * The MARKET QUEEN keeps the Grand Market shelf; the DOCKMASTER frets over the
 * watering-hole convoy; the RUINS GUIDE points east to the laughing stones; the
 * BAOBAB HEALER tends the well. The Run climbs E out to the Savanna. Lucille parks
 * at the quay edge so the party is never stranded (`biplane_interior` board door). */
function buildZanzibel(): MapDef {
  const W = 40;
  const H = 26;
  const g = new Grid(W, H, '.'); // dust-warm bazaar turf
  g.rect(0, 0, W, 2, 'B');
  g.rect(0, 0, 1, H, 'B');
  g.rect(W - 1, 0, 1, H, 'B');
  g.rect(0, H - 1, W, 1, 'B');
  // TWO E-W market streets + the avenue that stitches them (the ADR-012 city
  // minimums) — the UPPER street IS the QUAYSIDE RUN out to the savanna track
  g.rect(1, 9, W - 2, 3, 'R'); // street 1 — THE QUAYSIDE RUN (rows 9-11)
  g.rect(1, 18, W - 2, 3, 'R'); // street 2 — the lower bazaar road (rows 18-20)
  g.rect(19, 9, 3, 12, 'R'); // the avenue stitching the two streets (col 20, 12 tall)
  for (let x = 2; x < W - 2; x++) {
    if (x < 19 || x > 21) {
      g.set(x, 10, 'D'); // dashed centerlines, broken at the avenue
      g.set(x, 19, 'D');
    }
  }
  // E mouth → the Savanna Run (on street 1)
  g.set(W - 1, 9, 'R');
  g.set(W - 1, 10, 'R');
  g.set(W - 1, 11, 'R');
  // THE BAZAAR DISTRICT — Zanzibel's own §A5 skin (caravanserai / grand market /
  // courier guild / customs / spice stall / dyer / investment desk), bazaar-port,
  // on TWO block faces: the grand quay front, and the built-up block between streets
  const occupied: Array<{ x: number; y: number; w: number; h: number }> = [];
  const north = buildDistrict(g, { x: 2, y: 2, w: 36, h: 6 }, new Streams(2231470), {
    layout: 'grid',
    style: 'bazaar-port',
    catalog: AREA_SKINS.zanzibel,
    streetRows: [7],
    maxStories: 3,
    sprinkle: true,
    occupied,
  });
  const middle = buildDistrict(g, { x: 2, y: 13, w: 16, h: 4 }, new Streams(2231471), {
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
    { sprite: treeSprite(4, 23), x: 4, y: 23, solid: TREE_SOLID }, // a date palm in the square
    { sprite: 'meteor_rock', x: 35, y: 23, solid: ROCK_SOLID }, // a half-buried meteor stone the market built around
    { sprite: 'picnic', x: 25, y: 15, solid: PICNIC_SOLID }, // §A4.5 rest spot — a shaded tea mat
    { sprite: 'payphone', x: 30, y: 8.2, solid: PHONE_SOLID },
    { sprite: 'prop_trail_marker', x: 20, y: 22 }, // the court approach marker
    { sprite: 'well', x: 13, y: 23 }, // the baobab well the Healer tends
  ];

  return {
    id: 'zanzibel',
    name: 'ZANZIBEL',
    music: null,
    settlement: 'city',
    grid: g.out(),
    props,
    npcs: [
      // THE MARKET QUEEN — keeps the Grand Market shelf (the §A8 Ch.6 shop)
      { id: 'zn_queen', sprite: 'zanzibel_market_queen', x: 6, y: 8, facing: 'down', dialogue: 'npc_zn_queen', shop: 'zanzibel_bazaar' },
      // THE DOCKMASTER — the watering_hole_convoy giver (frets over the caravan)
      { id: 'zn_dockmaster', sprite: 'zanzibel_dockmaster', x: 33, y: 16, facing: 'down', dialogue: 'npc_zn_dockmaster', stationary: true, idle: true },
      // THE RUINS GUIDE — the stones_that_speak giver (points E to the laughing stones)
      { id: 'zn_guide', sprite: 'laughing_ruins_guide', x: 26, y: 19, facing: 'down', dialogue: 'npc_zn_guide', wander: true },
      // THE BAOBAB HEALER — tends the well; flavor + the chapter's quiet centre
      { id: 'zn_healer', sprite: 'baobab_healer', x: 12, y: 22, facing: 'down', dialogue: 'npc_zn_healer', stationary: true, idle: true, emote: 'happy' },
    ],
    signs: [
      { x: 3, y: 8, dialogue: 'sign_zanzibel' },
      { x: 37, y: 12, dialogue: 'sign_savanna_gate' },
      { x: 20, y: 21, dialogue: 'sign_zanzibel_court' },
    ],
    phones: [{ x: 30, y: 8 }],
    atms: [{ x: 32, y: 8 }],
    doors: [
      { x: W - 1, y: 10, w: 1, h: 2, to: 'savanna_run', tx: 1 * 16, ty: 8 * 16, facing: 'right', indicator: 'none' },
      // board Lucille — parked at the quay edge by the landing square; so once Ch.6 is
      // done (or a later leg lands) Bert can fly the party on (FRONTIER nav law — a
      // frontier city must never be a dead-end; the Minimus/Kvisthavn precedent)
      { x: 8, y: 24, w: 2, h: 1, to: 'biplane_interior', tx: 11 * 16, ty: 8 * 16, facing: 'down', indicator: 'none' },
    ],
    spawners: [],
    triggers: [
      // the §A6 arrival — Lucille sets the party down on the quay landing square (once)
      { id: 'ch6_arrival', rect: { x: 5, y: 21, w: 6, h: 3 }, once: true },
    ],
  };
}

/* ═══════════════════════════════ THE SAVANNA RUN ═════════════════════════════ *
 * The caravan track out of Zanzibel to the Laughing Ruins. The §A7 road ecosystem
 * works the dust: the Caravan Hyena Pack harries the verges, the Baobab Root Snare
 * roots the unwary. A watering-hole rest before the ruins. The Run forks W back to
 * Zanzibel and E into the Laughing Ruins. */
function buildSavannaRun(): MapDef {
  const W = 36;
  const H = 16;
  const g = new Grid(W, H, '.'); // sun-bleached grass
  // THE RUN — a broad dust track W↔E (the one caravan road)
  g.rect(1, 7, W - 2, 3, '=');
  g.rect(0, 0, W, 1, 'B');
  g.rect(0, H - 1, W, 1, 'B');
  g.rect(0, 0, 1, H, 'B');
  g.rect(W - 1, 0, 1, H, 'B');
  g.set(0, 7, '=');
  g.set(0, 8, '='); // W mouth → zanzibel
  g.set(W - 1, 7, '=');
  g.set(W - 1, 8, '='); // E mouth → the_laughing_ruins

  return {
    id: 'savanna_run',
    name: 'THE SAVANNA RUN',
    music: null,
    grid: g.out(),
    props: [
      { sprite: treeSprite(5, 3), x: 5, y: 3, solid: TREE_SOLID }, // acacia on the verge
      { sprite: treeSprite(29, 3), x: 29, y: 3, solid: TREE_SOLID },
      { sprite: 'meteor_rock', x: 12, y: 12, solid: ROCK_SOLID }, // a termite mound the size of a milestone
      { sprite: 'prop_trail_marker', x: 18, y: 6 },
      { sprite: 'picnic', x: 8, y: 12, solid: PICNIC_SOLID }, // §A4.5 the watering-hole rest
    ],
    npcs: [],
    signs: [
      { x: 3, y: 6, dialogue: 'sign_savanna_run' },
      { x: 30, y: 6, dialogue: 'sign_ruins_mouth' },
    ],
    phones: [],
    doors: [
      { x: 0, y: 7, w: 1, h: 2, to: 'zanzibel', tx: 38 * 16, ty: 10 * 16, facing: 'left', indicator: 'none' },
      { x: W - 1, y: 7, w: 1, h: 2, to: 'laughing_ruins', tx: 9 * 16, ty: 20 * 16, facing: 'right', indicator: 'none' },
    ],
    spawners: [
      // §A7 to-twenty: the savanna/desert roamers + the two market-social oddities
      // draw across the proven rects (the riddle specialists work the ruins below).
      { enemies: ['caravan_hyena_pack', 'hollow_jackal', 'dust_devil_charm', 'ribbon_serpent'], count: 2, rect: { x: 3, y: 3, w: 8, h: 3 } },
      { enemies: ['baobab_root_snare', 'thornbush_bomber', 'salt_flat_lurker', 'canteen_mirage'], count: 2, rect: { x: 24, y: 3, w: 9, h: 3 } },
      { enemies: ['caravan_hyena_pack', 'mirage_vendor', 'griot_string_snare', 'town_gossip_troll', 'trade_salt_heap'], count: 2, rect: { x: 22, y: 11, w: 9, h: 3 } },
    ],
    triggers: [],
  };
}

/* ═══════════════════ THE LAUGHING RUINS — the dungeon + the BRANCH ════════════ *
 * A dead carved city whose stones repeat your own laughter one beat late (§A6 — the
 * dungeon). The §A7 dungeon specialists make the stone fight back (the Laughing Dust
 * Pot cackles a status, the Sphinx Paw Shadow ambushes). This is the BRANCH's home:
 * mid-climb the same MOMENT begins to repeat and {rex} learns to HOLD THE WORLD'S
 * BREATH (`held_breath_unlock`); higher up, at the lip of a collapsing stair, the
 * Hush freezes {pippa} and forces CHOICE 1 — the TRUST axis (`choice_trust`). The
 * central corridor (cols 8-11) is kept OPEN the full height so BOTH beats fire on
 * foot (no soft-lock — the runChoice/heldBreathBeat handlers are walk-zone driven).
 * The climb opens N onto the Sphinx's chin. */
function buildLaughingRuins(): MapDef {
  const W = 20;
  const H = 22;
  const g = new Grid(W, H, '.'); // cracked flagstone
  // the ruin perimeter (reskins to carved stone at the art pass)
  g.rect(0, 0, W, 1, 'O');
  g.rect(0, 0, 1, H, 'O');
  g.rect(W - 1, 0, 1, H, 'O');
  g.rect(0, H - 1, W, 1, 'O');
  g.set(9, H - 1, 'o'); // the way in from the Savanna Run (S)
  g.set(10, H - 1, 'o');
  g.set(9, 0, 'o'); // the way out to the Sphinx's chin (N)
  g.set(10, 0, 'o');
  // toppled-column ridges — interior dressing that frames the climb WITHOUT ever
  // closing the central corridor (cols 8-11 stay open S↔N; mapcheck BFS clears it)
  g.rect(3, 5, 1, 4, 'O');
  g.rect(15, 5, 1, 4, 'O');
  g.rect(3, 13, 1, 4, 'O');
  g.rect(15, 13, 1, 4, 'O');
  g.rect(5, 9, 2, 1, 'O'); // a fallen lintel, left of the corridor
  g.rect(13, 9, 2, 1, 'O'); // a fallen lintel, right of the corridor
  g.rect(5, 17, 2, 1, 'O');
  g.rect(13, 17, 2, 1, 'O');

  return {
    id: 'laughing_ruins',
    name: 'THE LAUGHING RUINS',
    music: null,
    grid: g.out(),
    props: [
      { sprite: 'meteor_rock', x: 4, y: 7, solid: ROCK_SOLID }, // a toppled carved head
      { sprite: 'meteor_rock', x: 15, y: 15, solid: ROCK_SOLID },
      { sprite: 'prop_resonance_stones', x: 9, y: 11 }, // the stones that laugh back (the Held Breath beat)
      { sprite: 'prop_trail_marker', x: 9, y: 18 },
      { sprite: 'prop_trail_marker', x: 9, y: 4 },
    ],
    npcs: [],
    signs: [{ x: 9, y: 19, dialogue: 'sign_laughing_ruins' }],
    phones: [],
    doors: [
      { x: 9, y: H - 1, w: 2, h: 1, to: 'savanna_run', tx: 34 * 16, ty: 8 * 16, facing: 'down', indicator: 'none' },
      { x: 9, y: 0, w: 2, h: 1, to: 'sphinx_chin', tx: 9 * 16, ty: 14 * 16, facing: 'up', indicator: 'none' },
    ],
    spawners: [
      // §A7 to-twenty: the Laughing-Ruins riddle specialists + the set-piece echo
      // join the two anchors that shipped the dungeon.
      { enemies: ['laughing_dust_pot', 'punchline_head', 'echoing_riddle'], count: 2, rect: { x: 2, y: 3, w: 5, h: 4 } },
      { enemies: ['sphinx_paw_shadow', 'sunbaked_idol', 'laughing_sphinx_riddle'], count: 2, rect: { x: 13, y: 3, w: 5, h: 4 } },
      { enemies: ['laughing_dust_pot', 'echoing_riddle', 'rare_riddle_ring', 'fastest_man_echo'], count: 2, rect: { x: 2, y: 16, w: 5, h: 4 } },
    ],
    triggers: [
      // THE HELD BREATH unlock (§S21/ADR-126) — the looping moment; {rex} learns the
      // Star Locket rewind. Spans the open corridor low in the climb (fires on foot).
      { id: 'held_breath_unlock', rect: { x: 7, y: 14, w: 6, h: 2 }, once: false },
      // CHOICE 1 — the TRUST axis (§S21/ADR-127, ch6_string). The Hush freezes {pippa}
      // at the collapsing stair. Spans the corridor higher up (after the Held Breath).
      { id: 'choice_trust', rect: { x: 7, y: 5, w: 6, h: 2 }, once: false },
    ],
  };
}

/* ═══════════════════ THE SPHINX'S CHIN — boss + resonance ═════════════════════ *
 * The climb ends in the carved CHIN of the Laughing Sphinx — the §A6 Resonance Site.
 * The SPHINX wakes and answers only riddles: a RIGHT answer stuns it three turns, a
 * WRONG answer sets the whole party Crying (the §A6 BOSS — and the safe rewind
 * sandbox the Held Breath was for). Beat it and the chin SINGS: Heartlight 6 records
 * and Ember 6 lands (`ch6_complete`). The party is already whole — no one joins here. */
function buildSphinxChin(): MapDef {
  const W = 20;
  const H = 16;
  const g = new Grid(W, H, '.'); // the carved dais of the chin
  g.rect(0, 0, W, 1, 'O');
  g.rect(0, 0, 1, H, 'O');
  g.rect(W - 1, 0, 1, H, 'O');
  g.rect(0, H - 1, W, 1, 'O');
  g.set(9, H - 1, 'o'); // back down into the Ruins (S)
  g.set(10, H - 1, 'o');

  return {
    id: 'sphinx_chin',
    name: "THE SPHINX'S CHIN",
    music: null,
    grid: g.out(),
    props: [
      { sprite: 'meteor_rock', x: 9, y: 5, solid: ROCK_SOLID }, // the carved jaw the Sphinx naps in
      { sprite: 'prop_resonance_stones', x: 9, y: 9 }, // the §A6 resonance ring centring the chamber
      { sprite: 'prop_trail_marker', x: 5, y: 11 },
      { sprite: 'prop_trail_marker', x: 14, y: 11 },
    ],
    npcs: [],
    signs: [{ x: 9, y: 12, dialogue: 'sign_sphinx_chin' }],
    phones: [],
    doors: [
      { x: 9, y: H - 1, w: 2, h: 1, to: 'laughing_ruins', tx: 9 * 16, ty: 1 * 16, facing: 'down', indicator: 'none' },
    ],
    spawners: [],
    triggers: [
      // the §A6 BOSS — the Sphinx wakes on the dais (the riddle fight; right stuns,
      // wrong cries — endBattle on its 9000 HP, or a rewind-safe wrong answer)
      { id: 'laughing_sphinx_boss', rect: { x: 7, y: 4, w: 4, h: 3 }, once: false },
      // the Resonance Site — Heartlight 6 records once the Sphinx is beaten; Ember 6
      // lands here and ch6_complete opens the next leg (the chapter close)
      { id: 'sphinx_chin_resonance', rect: { x: 7, y: 8, w: 4, h: 3 }, once: true },
    ],
  };
}

/**
 * THE CHAPTER 6 MAP SET — Lucille lands the party at Zanzibel; the Savanna Run
 * carries the caravan track out to the Laughing Ruins (the BRANCH's home — the
 * Held Breath unlock + Choice 1), and the climb ends at the Sphinx's chin, where
 * the §A6 boss naps and Ember 6 waits. Assembled like buildChapter5Maps (a record
 * spread into MAPS).
 */
export function buildChapter6Maps(): Record<string, MapDef> {
  return {
    zanzibel: buildZanzibel(),
    savanna_run: buildSavannaRun(),
    laughing_ruins: buildLaughingRuins(),
    sphinx_chin: buildSphinxChin(),
  };
}
