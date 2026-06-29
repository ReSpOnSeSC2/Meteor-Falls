/**
 * CHAPTER 9 MAPS: "The Count of Valea Stelelor" (Romania). §A5/§A6 — once the Folded
 * Hymn is in the locket, Bert flies the party on to VALEA STELELOR ("Valley of the
 * Stars"), the emotional heart of the road: painted gates, haystacks, woodsmoke, and a
 * grandmother named BUNI who feeds the party until their HP overflows and presses the
 * FEAST BASKET recipe on them (the §A10 quest). A "vampire," COUNT HOAXULA, terrorises
 * the valley from his castle up THE OLD ROAD — he is really a Hushed theme-park actor
 * from Cleveland whose haunted-castle attraction went bankrupt, now armed with very real
 * STOLEN VIBE. The party climbs the road to CASTLE HOAXULA (the §A6 dungeon — fake-scare
 * props that forgot they were props, a throne, and a backstage reveal), unmask the Count
 * (the mercyEnding boss), and then up to STONE BROW MONASTERY, the Resonance Site — the
 * bell tower where Ember 9 lands and Dorin's TRIAL OF THE MUTE MOUNTAIN is honoured (the
 * cutscene beat; Dorin has marched with the party since Minimus, ADR-125).
 *
 * Ch.9 carries the COMPASSION axis (the second Held-Breath choice — `choice_compassion`
 * → ch9_count: THE IRON vs THE OPEN HAND), placed past the throne where the unmasked
 * Count kneels. Same ADR-004 code-grid law as every chapter; reachability is GRID-based
 * (mapcheck BFS). Valea wears its OWN painted-village skin (AREA_SKINS.valea); the NPC
 * sheets are dev-art reuse of the earlier cast until the Romania art pass gives Buni and
 * the valley their own. The castle + monastery corridors are kept deliberately open (the
 * boss + choice + resonance triggers must fire on foot — no soft-lock, ADR-014).
 */
import { Grid, treeSprite } from './mapkit';
import { buildDistrict, Streams } from '../levelkit';
import { AREA_SKINS } from '../spritegen/buildings';
import type { MapDef, PropDef } from '../schemas';

const PICNIC_SOLID = { ox: 2, oy: 8, w: 32, h: 14 } as const;
const PHONE_SOLID = { ox: 1, oy: 10, w: 14, h: 16 } as const;
const TREE_SOLID = { ox: 7, oy: 22, w: 12, h: 10 } as const;
const ROCK_SOLID = { ox: 2, oy: 12, w: 24, h: 12 } as const;

/** the open tile VALEA STELELOR sets the party down on when Bert lands at the village
 *  green (the ch9_arrival beat fires on the south landing square by the gate). */
export const VALEA_STELELOR_LANDING = { x: 8, y: 20 } as const;

/* ════════════════════════════════ VALEA STELELOR ═════════════════════════════ *
 * The painted village at the foot of the mountain — a warm rustic hamlet (a §A5 VILLAGE,
 * not a city, so the simpler organic-lane skin, not the ADR-012 grid). The party land on
 * the green by the painted gate and are met with food before they are met with anything
 * else. BUNI keeps her table at the heart of the village (the bunis_table giver — she
 * needs five things for the true Feast Basket, scattered up the valley); the PROVISIONER
 * keeps the supply shelf (the §A8 Ch.9 shop); the SHEPHERD frets about the Old Road wolf;
 * a village KID dares the others to knock on the Count's door. The road climbs E out to
 * the Old Road. Bert parks Lucille at the gate so the party is never stranded
 * (`biplane_interior` board door — the FRONTIER nav law). */
function buildValeaStelelor(): MapDef {
  const W = 36;
  const H = 24;
  const g = new Grid(W, H, '.'); // trodden village earth
  // cliffs N + sides; the painted gate opens E to the Old Road
  g.rect(0, 0, W, 2, 'B');
  g.rect(0, 0, 1, H, 'B');
  g.rect(W - 1, 0, 1, H, 'B');
  g.rect(0, H - 1, W, 1, 'B');
  // THE VILLAGE LANE — a cart-track spine, open + obviously connected
  g.rect(2, 12, W - 4, 3, '=');
  g.rect(16, 12, 3, 8, '='); // the lane down to the green where Lucille sets down
  g.rect(2, 8, W - 4, 1, '='); // the back lane under the painted houses
  // a green where the picnic + the arrival landing sit (south-west)
  g.rect(3, 16, 12, 5, '.');
  // gate gap E → the Old Road
  g.set(W - 1, 12, '=');
  g.set(W - 1, 13, '=');
  // THE PAINTED HOUSES — Valea's own painted-gates skin (carved gates, haystacks,
  // steep shingle roofs) along the north strip, the village built up under the cliffs.
  const occupied: Array<{ x: number; y: number; w: number; h: number }> = [];
  const row = buildDistrict(g, { x: 2, y: 2, w: 32, h: 6 }, new Streams(910901), {
    layout: 'organic',
    style: 'painted-gates',
    catalog: AREA_SKINS.valea,
    lanes: 3,
    maxStories: 2,
    sprinkle: true,
    occupied,
  });

  const props: PropDef[] = [
    ...row.props,
    { sprite: treeSprite(3, 10), x: 3, y: 10, solid: TREE_SOLID }, // a plum tree by the lane
    { sprite: treeSprite(32, 10), x: 32, y: 10, solid: TREE_SOLID },
    { sprite: 'picnic', x: 6, y: 17, solid: PICNIC_SOLID }, // §A4.5 rest spot — Buni's long table
    { sprite: 'payphone', x: 22, y: 11.2, solid: PHONE_SOLID },
    { sprite: 'well', x: 26, y: 17 }, // the village well
    { sprite: 'meteor_rock', x: 30, y: 18, solid: ROCK_SOLID }, // a half-buried star-stone (Valea = Valley of the Stars)
    { sprite: 'prop_trail_marker', x: 33, y: 11 }, // the marker at the gate to the Old Road
  ];

  return {
    id: 'valea_stelelor',
    name: 'VALEA STELELOR',
    music: null,
    settlement: 'village',
    grid: g.out(),
    props,
    npcs: [
      // BUNI — the grandmother who keeps the table (the bunis_table giver; the §A10 caller).
      // She needs five things up the valley for the true Feast Basket. (dev-art: senora sheet)
      { id: 'vs_buni', sprite: 'senora', x: 7, y: 15, facing: 'down', dialogue: 'npc_vs_buni', stationary: true, idle: true, emote: 'happy' },
      // THE PROVISIONER — keeps the supply shelf (the §A8 Ch.9 shop)
      { id: 'vs_provisioner', sprite: 'kvisthavn_shopkeeper', x: 11, y: 9, facing: 'down', dialogue: 'npc_vs_provisioner', shop: 'valea_provisioner' },
      // THE SHEPHERD — frets about the Wolf of the Old Road and the thing in the castle
      { id: 'vs_shepherd', sprite: 'bootstep_shepherd', x: 28, y: 13, facing: 'down', dialogue: 'npc_vs_shepherd', stationary: true },
      // a village KID — dares the others to go knock on the Count's door (flavor)
      { id: 'vs_kid', sprite: 'bell_choir_child', x: 14, y: 18, facing: 'down', dialogue: 'npc_vs_kid', wander: true, emote: 'happy' },
    ],
    signs: [
      { x: 3, y: 11, dialogue: 'sign_valea_stelelor' },
      { x: 34, y: 11, dialogue: 'sign_old_road_gate' },
      { x: 16, y: 15, dialogue: 'sign_valea_green' },
    ],
    phones: [{ x: 22, y: 11 }],
    atms: [{ x: 24, y: 11 }],
    doors: [
      { x: W - 1, y: 12, w: 1, h: 2, to: 'old_road', tx: 1 * 16, ty: 8 * 16, facing: 'right', indicator: 'none' },
      // board Lucille — parked at the green where the leg set down, so once Ch.9 is done
      // (or a later leg lands) Bert can fly the party on (the FRONTIER nav law — a frontier
      // village must never be a dead-end; the Kvisthavn/Lotus Harbor precedent)
      { x: 8, y: 21, w: 2, h: 1, to: 'biplane_interior', tx: 11 * 16, ty: 8 * 16, facing: 'down', indicator: 'none' },
    ],
    spawners: [
      // a lone Haystack Mimic squats in the field by the gate (kept off the lane + doors)
      { enemies: ['haystack_mimic'], count: 1, rect: { x: 30, y: 20, w: 4, h: 2 } },
    ],
    triggers: [
      // the §A6 arrival — Bert sets the party down on the village green (once)
      { id: 'ch9_arrival', rect: { x: 5, y: 19, w: 6, h: 3 }, once: true },
    ],
  };
}

/* ═══════════════════════════════════ THE OLD ROAD ════════════════════════════ *
 * The mountain road out of Valea up to the castle. The §A7 old-road ecosystem works the
 * dark verges: a Haystack Mimic squats in a roadside field, a Moss Strigoi rises out of
 * the ditch-moss to drink the warmth off travellers, and after dusk the Wolf of the Old
 * Road comes off the verge calling its pack. A wayside shrine to rest at before the climb.
 * The road forks W back to Valea and E up to Castle Hoaxula. */
function buildOldRoad(): MapDef {
  const W = 36;
  const H = 16;
  const g = new Grid(W, H, '.'); // verge grass going to mountain scree
  // THE ROAD — a broad mountain track W↔E (the one road up to the castle)
  g.rect(1, 7, W - 2, 3, '=');
  g.rect(0, 0, W, 1, 'B');
  g.rect(0, H - 1, W, 1, 'B');
  g.rect(0, 0, 1, H, 'B');
  g.rect(W - 1, 0, 1, H, 'B');
  g.set(0, 7, '=');
  g.set(0, 8, '='); // W mouth → valea_stelelor
  g.set(W - 1, 7, '=');
  g.set(W - 1, 8, '='); // E mouth → castle_hoaxula

  return {
    id: 'old_road',
    name: 'THE OLD ROAD',
    music: null,
    grid: g.out(),
    props: [
      { sprite: treeSprite(5, 3), x: 5, y: 3, solid: TREE_SOLID }, // a gallows-bent pine on the verge
      { sprite: treeSprite(29, 3), x: 29, y: 3, solid: TREE_SOLID },
      { sprite: 'meteor_rock', x: 12, y: 12, solid: ROCK_SOLID }, // a roadside wayside-shrine stone
      { sprite: 'prop_trail_marker', x: 18, y: 6 },
      { sprite: 'picnic', x: 8, y: 12, solid: PICNIC_SOLID }, // §A4.5 the wayside rest
      { sprite: treeSprite(24, 12), x: 24, y: 12, solid: TREE_SOLID },
    ],
    npcs: [],
    signs: [
      { x: 3, y: 6, dialogue: 'sign_old_road' },
      { x: 30, y: 6, dialogue: 'sign_castle_gate' },
    ],
    phones: [],
    doors: [
      { x: 0, y: 7, w: 1, h: 2, to: 'valea_stelelor', tx: 34 * 16, ty: 12 * 16, facing: 'left', indicator: 'none' },
      { x: W - 1, y: 7, w: 1, h: 2, to: 'castle_hoaxula', tx: 9 * 16, ty: 22 * 16, facing: 'right', indicator: 'none' },
    ],
    spawners: [
      { enemies: ['haystack_mimic', 'moss_strigoi'], count: 2, rect: { x: 3, y: 3, w: 8, h: 3 } },
      { enemies: ['moss_strigoi', 'wolf_of_the_old_road'], count: 2, rect: { x: 24, y: 3, w: 9, h: 3 } },
      { enemies: ['wolf_of_the_old_road', 'haystack_mimic'], count: 2, rect: { x: 22, y: 11, w: 9, h: 3 } },
    ],
    triggers: [],
  };
}

/* ════════════════════ CASTLE HOAXULA — the dungeon (the boss) ═════════════════ *
 * The Count's castle at the head of the Old Road (§A6 — the dungeon). The §A7 dungeon
 * specialists work the cold halls: a Ribcage Rattler clatters out of a sconce-shadow, an
 * Animated Armour stands the Count's parade, a Moss Strigoi keeps the dripping crypt. The
 * central corridor (cols 8-11) is kept OPEN the full height so the climb never soft-locks.
 * Up the hall the COUNT holds his throne (the §A6 BOSS, the mercyEnding script) — and just
 * past the throne, where the cape comes off and the BACKSTAGE bankruptcy notices show, the
 * COMPASSION axis forces CHOICE 2 (`choice_compassion`). The way out climbs N to the
 * monastery. */
function buildCastleHoaxula(): MapDef {
  const W = 20;
  const H = 24;
  const g = new Grid(W, H, '.'); // cold flagstones
  g.rect(0, 0, W, 1, 'O');
  g.rect(0, 0, 1, H, 'O');
  g.rect(W - 1, 0, 1, H, 'O');
  g.rect(0, H - 1, W, 1, 'O');
  g.set(9, H - 1, 'o'); // the way in from the Old Road (S)
  g.set(10, H - 1, 'o');
  g.set(9, 0, 'o'); // the way up to the monastery (N), past the throne
  g.set(10, 0, 'o');
  // pillars + fake-scare props frame the hall WITHOUT ever closing the central corridor
  // (cols 8-11 stay open S↔N; mapcheck BFS clears it)
  g.rect(3, 5, 1, 4, 'O');
  g.rect(15, 5, 1, 4, 'O');
  g.rect(3, 15, 1, 4, 'O');
  g.rect(15, 15, 1, 4, 'O');
  g.rect(5, 11, 2, 1, 'O'); // a toppled prop coffin, left of the path
  g.rect(13, 11, 2, 1, 'O'); // a toppled prop coffin, right of the path
  g.rect(5, 19, 2, 1, 'O');
  g.rect(13, 19, 2, 1, 'O');

  return {
    id: 'castle_hoaxula',
    name: 'CASTLE HOAXULA',
    music: null,
    grid: g.out(),
    props: [
      { sprite: 'meteor_rock', x: 9, y: 4, solid: ROCK_SOLID }, // the throne dais the Count holds
      { sprite: 'meteor_rock', x: 4, y: 13, solid: ROCK_SOLID }, // a dripping crypt-stone
      { sprite: 'meteor_rock', x: 15, y: 17, solid: ROCK_SOLID }, // a stack of prop scenery
      { sprite: 'prop_trail_marker', x: 9, y: 20 },
      { sprite: 'prop_trail_marker', x: 9, y: 8 },
    ],
    npcs: [],
    signs: [
      { x: 9, y: 21, dialogue: 'sign_castle_hoaxula' },
      { x: 13, y: 8, dialogue: 'sign_castle_backstage' }, // the BACKSTAGE reveal — bankruptcy notices
    ],
    phones: [],
    doors: [
      { x: 9, y: H - 1, w: 2, h: 1, to: 'old_road', tx: 34 * 16, ty: 8 * 16, facing: 'down', indicator: 'none' },
      { x: 9, y: 0, w: 2, h: 1, to: 'stone_brow_monastery', tx: 9 * 16, ty: 14 * 16, facing: 'up', indicator: 'none' },
    ],
    spawners: [
      { enemies: ['ribcage_rattler', 'animated_armor'], count: 2, rect: { x: 2, y: 16, w: 5, h: 4 } },
      { enemies: ['animated_armor', 'moss_strigoi'], count: 2, rect: { x: 13, y: 16, w: 5, h: 4 } },
      // the crypt landing — a Ribcage Rattler keeps it (rare/high-value, count 1)
      { enemies: ['ribcage_rattler'], count: 1, rect: { x: 2, y: 9, w: 5, h: 3 } },
    ],
    triggers: [
      // the §A6 BOSS — COUNT HOAXULA holds the throne (the theatrical→unmasked→mercy fight;
      // endBattle on his 95000 HP). Spans the full open corridor so the climb cannot pass
      // it (cols 6-13 cover the open lane 8-11), then the boss scene drives the choice.
      { id: 'count_hoaxula_boss', rect: { x: 6, y: 3, w: 8, h: 3 }, once: false },
      // the COMPASSION axis (CHOICE 2) — the band just past the throne, on the only way out
      // to the monastery: THE IRON vs THE OPEN HAND (handler gates on count_hoaxula_defeated;
      // runChoice self-gates once decided)
      { id: 'choice_compassion', rect: { x: 6, y: 1, w: 8, h: 1 }, once: false },
    ],
  };
}

/* ═══════════════════ STONE BROW MONASTERY — resonance + the Trial ═════════════ *
 * The cliff-top monastery above the castle — the §A6 Resonance Site, the bell tower. Here
 * Dorin's TRIAL OF THE MUTE MOUNTAIN is honoured (the cutscene beat — the mountain
 * "deletes" his senses one by one until he releases his fear; he has walked with the party
 * since Minimus, so this is the homecoming, not the join). Ring the tower bell and
 * HEARTLIGHT 9 records and Ember 9 lands (`ch9_complete`). The corridor up to the bell is
 * kept open the full height. */
function buildStoneBrowMonastery(): MapDef {
  const W = 20;
  const H = 16;
  const g = new Grid(W, H, '.'); // the swept cloister floor
  g.rect(0, 0, W, 1, 'O');
  g.rect(0, 0, 1, H, 'O');
  g.rect(W - 1, 0, 1, H, 'O');
  g.rect(0, H - 1, W, 1, 'O');
  g.set(9, H - 1, 'o'); // back down to the castle (S)
  g.set(10, H - 1, 'o');

  return {
    id: 'stone_brow_monastery',
    name: 'STONE BROW MONASTERY',
    music: null,
    grid: g.out(),
    props: [
      { sprite: 'meteor_rock', x: 9, y: 5, solid: ROCK_SOLID }, // the bell-tower frame
      { sprite: 'prop_resonance_stones', x: 9, y: 9 }, // the §A6 resonance ring at the cloister heart
      { sprite: 'prop_trail_marker', x: 5, y: 11 },
      { sprite: 'prop_trail_marker', x: 14, y: 11 },
    ],
    npcs: [],
    signs: [{ x: 9, y: 12, dialogue: 'sign_stone_brow_monastery' }],
    phones: [],
    doors: [
      { x: 9, y: H - 1, w: 2, h: 1, to: 'castle_hoaxula', tx: 9 * 16, ty: 1 * 16, facing: 'down', indicator: 'none' },
    ],
    spawners: [],
    triggers: [
      // the §A6 Resonance Site — Dorin's Trial is honoured + HEARTLIGHT 9 records once the
      // Count is unmasked; Ember 9 lands here and ch9_complete opens the next leg (the close)
      { id: 'stone_brow_monastery_resonance', rect: { x: 7, y: 8, w: 4, h: 3 }, once: true },
    ],
  };
}

/**
 * THE CHAPTER 9 MAP SET — Bert lands the party at Valea Stelelor; the Old Road climbs to
 * Castle Hoaxula, where the §A6 boss holds the throne and the COMPASSION axis turns, and
 * the way out ends at the Stone Brow Monastery bell tower, where Ember 9 waits and Dorin's
 * Trial is honoured. Assembled like buildChapter8Maps (a record spread into MAPS).
 */
export function buildChapter9Maps(): Record<string, MapDef> {
  return {
    valea_stelelor: buildValeaStelelor(),
    old_road: buildOldRoad(),
    castle_hoaxula: buildCastleHoaxula(),
    stone_brow_monastery: buildStoneBrowMonastery(),
  };
}
