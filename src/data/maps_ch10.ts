/**
 * CHAPTER 10 MAPS: "The Long Shot" (Alaska → Hawaii → Mars) — THE FINALE. §A5/§A6.
 * Three acts, one road home:
 *
 *   ACT 1 — ALASKA: the snowcat sets the party down at AURORA STATION, a tiny research
 *   hamlet under the northern lights. The radio array DECODES where the Hush is — not on
 *   Earth, but out past Mars, in the SEA OF SILENCE. The way north crosses the AURORA ICE
 *   FIELD, where the FROST SENTINEL (the §A6 elemental-golem miniboss) bars the road.
 *
 *   ACT 2 — HAWAII: Pemberton's seaplane carries the party south to MAUNA LANI, the
 *   launch-pad town for his rocket THE LONG SHOT — the only ride to Mars. They phone home
 *   (Dad / Mom) and round up the rocket's last parts (the_last_wave). The LANI MAGMA FLATS
 *   to the launch gantry are held by the TIKI MAGMA GOLEM (the second §A6 miniboss).
 *
 *   ACT 3 — MARS: The Long Shot throws them to the SEA OF SILENCE, where THE HUSH waits.
 *   This map carries the FINALE axis (CHOICE 3 — `choice_finale` → ch10_song: SILENCE vs
 *   FORGIVE), placed on the approach so the Hush HEARS the party choose what the Homesong
 *   is for; the bespoke 3-movement Hush fight (`the_hush_boss`) reads the choice; the
 *   composed ending plays over the walk home. Same ADR-004 code-grid law as every chapter;
 *   reachability is GRID-based (mapcheck BFS). The gauntlet + finale corridors are kept
 *   deliberately OPEN so the miniboss / choice / Hush triggers must fire on foot — no
 *   soft-lock (ADR-014). Ch.10 wears its OWN region skins (AREA_SKINS.aurora / .mauna_lani
 *   / .mars). Authored battlers/facades/tiles/NPC sheets land in the later art pass; the
 *   spine ships on procedural fallbacks.
 */
import { Grid, treeSprite } from './mapkit';
import { buildDistrict, Streams } from '../levelkit';
import { AREA_SKINS } from '../spritegen/buildings';
import type { MapDef, PropDef } from '../schemas';

const PICNIC_SOLID = { ox: 2, oy: 8, w: 32, h: 14 } as const;
const PHONE_SOLID = { ox: 1, oy: 10, w: 14, h: 16 } as const;
const TREE_SOLID = { ox: 7, oy: 22, w: 12, h: 10 } as const;
const ROCK_SOLID = { ox: 2, oy: 12, w: 24, h: 12 } as const;

/** the open tile the snowcat sets the party down on at AURORA STATION (ch10_arrival fires
 *  on the south landing square by the station gate). */
export const AURORA_STATION_LANDING = { x: 8, y: 19 } as const;

/* ═══════════════════════════════ AURORA STATION (Alaska) ══════════════════════════ *
 * A cold utilitarian research outpost under the lights — steel huts, a comms hall, a
 * supply shelf. The party land on the snow-packed green by the gate; the STATION KEEPER
 * watches the aurora and keeps the lights on for travelers (the lights_of_aurora giver);
 * the PROVISIONER runs the §A8 Ch.10 shop; the RADIO OPERATOR has been hearing the Sea of
 * Silence in the static (the ch10_decode beat). The road climbs E out to the ice field.
 * Bert parks Lucille at the gate so the frontier is never a dead-end (the FRONTIER nav law). */
function buildAuroraStation(): MapDef {
  const W = 34;
  const H = 22;
  const g = new Grid(W, H, '.'); // snow-packed station yard
  g.rect(0, 0, W, 2, 'B');
  g.rect(0, 0, 1, H, 'B');
  g.rect(W - 1, 0, 1, H, 'B');
  g.rect(0, H - 1, W, 1, 'B');
  // THE STATION LANE — a plowed spine, open + obviously connected
  g.rect(2, 11, W - 4, 3, '=');
  g.rect(15, 11, 3, 8, '='); // the lane down to the landing green
  g.rect(2, 8, W - 4, 1, '='); // the back lane under the huts
  // the green where the snowcat sets down (south-west)
  g.rect(3, 15, 12, 5, '.');
  // gate gap E → the ice field
  g.set(W - 1, 11, '=');
  g.set(W - 1, 12, '=');
  // THE STATION HUTS — Aurora's cold steel skin along the north strip
  const occupied: Array<{ x: number; y: number; w: number; h: number }> = [];
  const row = buildDistrict(g, { x: 2, y: 2, w: 30, h: 6 }, new Streams(101001), {
    layout: 'organic',
    style: 'fog-stone',
    catalog: AREA_SKINS.aurora,
    lanes: 3,
    maxStories: 2,
    sprinkle: true,
    occupied,
  });

  const props: PropDef[] = [
    ...row.props,
    { sprite: 'meteor_rock', x: 30, y: 17, solid: ROCK_SOLID }, // a half-buried star-stone in the snow
    { sprite: 'payphone', x: 22, y: 10.2, solid: PHONE_SOLID },
    { sprite: 'well', x: 26, y: 16 }, // the station's frozen well-head
    { sprite: 'picnic', x: 6, y: 16, solid: PICNIC_SOLID }, // §A4.5 the canteen table — a warm rest
    { sprite: 'prop_trail_marker', x: 31, y: 10 }, // the marker at the gate to the ice field
  ];

  return {
    id: 'aurora_station',
    name: 'AURORA STATION',
    music: null,
    settlement: 'village',
    grid: g.out(),
    props,
    npcs: [
      // THE STATION KEEPER — keeps the lights on for travelers (the lights_of_aurora giver)
      { id: 'as_keeper', sprite: 'canteen_keeper', x: 7, y: 14, facing: 'down', dialogue: 'npc_as_keeper', stationary: true, idle: true, emote: 'happy' },
      // THE PROVISIONER — the §A8 Ch.10 supply shelf
      { id: 'as_provisioner', sprite: 'npc_depot_clerk', x: 11, y: 9, facing: 'down', dialogue: 'npc_as_provisioner', shop: 'aurora_provisioner' },
      // THE RADIO OPERATOR — hears the Sea of Silence in the static
      { id: 'as_radio', sprite: 'aurora_busker', x: 26, y: 12, facing: 'down', dialogue: 'npc_as_radio', stationary: true },
    ],
    signs: [
      { x: 3, y: 10, dialogue: 'sign_aurora_station' },
      { x: 32, y: 10, dialogue: 'sign_aurora_ice_field' },
    ],
    phones: [{ x: 22, y: 10 }],
    atms: [{ x: 24, y: 10 }],
    doors: [
      { x: W - 1, y: 11, w: 1, h: 2, to: 'aurora_ice_field', tx: 1 * 16, ty: 7 * 16, facing: 'right', indicator: 'none' },
      // board Lucille — parked at the gate (the FRONTIER nav law; the Valea/Lotus precedent)
      { x: 8, y: 20, w: 2, h: 1, to: 'biplane_interior', tx: 11 * 16, ty: 8 * 16, facing: 'down', indicator: 'none' },
    ],
    spawners: [],
    triggers: [
      // the §A6 arrival — the snowcat sets the party down (once)
      { id: 'ch10_arrival', rect: { x: 5, y: 18, w: 6, h: 3 }, once: true },
      // the radio array decodes where the Hush is (once, by the operator)
      { id: 'ch10_decode', rect: { x: 24, y: 11, w: 4, h: 3 }, once: true },
    ],
  };
}

/* ═══════════════════════════════ AURORA ICE FIELD ════════════════════════════════ *
 * The frozen glacier field north of the station. The §A7 frost ecosystem works the verges
 * (Frost Wisps off the snow, Icehorn Caribou off the ridge); the FROST SENTINEL heaves up
 * out of the ice to bar the road E (the §A6 miniboss GATE — the central track stays open
 * so the gauntlet cannot be skipped). Past it, Pemberton's seaplane waits to fly the party
 * south to warmth (the act-jump to Hawaii rides the frost_sentinel_boss win). */
function buildAuroraIceField(): MapDef {
  const W = 36;
  const H = 16;
  const g = new Grid(W, H, '.'); // wind-scoured snow over blue ice
  g.rect(1, 7, W - 2, 3, '='); // the one road W↔E across the field
  g.rect(0, 0, W, 1, 'B');
  g.rect(0, H - 1, W, 1, 'B');
  g.rect(0, 0, 1, H, 'B');
  g.rect(W - 1, 0, 1, H, 'B');
  g.set(0, 7, '=');
  g.set(0, 8, '='); // W mouth → aurora_station
  g.set(W - 1, 7, '=');
  g.set(W - 1, 8, '='); // E mouth → mauna_lani (the seaplane south)

  return {
    id: 'aurora_ice_field',
    name: 'THE AURORA ICE FIELD',
    music: null,
    grid: g.out(),
    props: [
      { sprite: 'meteor_rock', x: 11, y: 3, solid: ROCK_SOLID }, // a wind-carved ice block
      { sprite: 'meteor_rock', x: 23, y: 12, solid: ROCK_SOLID },
      { sprite: 'prop_trail_marker', x: 18, y: 6 },
      { sprite: 'picnic', x: 8, y: 12, solid: PICNIC_SOLID }, // §A4.5 a wind-break rest
    ],
    npcs: [],
    signs: [
      { x: 3, y: 6, dialogue: 'sign_aurora_ice_field' },
      { x: 31, y: 6, dialogue: 'sign_the_long_shot' },
    ],
    phones: [],
    doors: [
      { x: 0, y: 7, w: 1, h: 2, to: 'aurora_station', tx: 32 * 16, ty: 11 * 16, facing: 'left', indicator: 'none' },
      { x: W - 1, y: 7, w: 1, h: 2, to: 'mauna_lani', tx: 1 * 16, ty: 18 * 16, facing: 'right', indicator: 'none' },
    ],
    spawners: [
      { enemies: ['frost_wisp', 'icehorn_caribou'], count: 2, rect: { x: 3, y: 3, w: 8, h: 3 } },
      { enemies: ['icehorn_caribou', 'frost_wisp'], count: 2, rect: { x: 22, y: 11, w: 9, h: 3 } },
    ],
    triggers: [
      // the §A6 FROST SENTINEL — heaves up to bar the road E. Spans the open track (cols
      // 22-29 cover the lane 7-9) so the climb cannot pass it; its win flies the party south.
      { id: 'frost_sentinel_boss', rect: { x: 22, y: 6, w: 8, h: 4 }, once: false },
    ],
  };
}

/* ════════════════════════════════ MAUNA LANI (Hawaii) ════════════════════════════ *
 * Pemberton's launch-pad town at the foot of the volcano — lush shops and a beach hotel
 * crowded under the steel gantry of THE LONG SHOT. PEMBERTON keeps the rocket (the
 * the_last_wave giver — its final stage needs its scattered parts); a market VENDOR runs
 * the §A8 shop; a LOCAL waves the party off. They phone home from the pad payphone. The
 * road climbs E to the magma flats and the launch gantry. */
function buildMaunaLani(): MapDef {
  const W = 34;
  const H = 24;
  const g = new Grid(W, H, '.'); // warm black-sand town ground
  g.rect(0, 0, W, 2, 'B');
  g.rect(0, 0, 1, H, 'B');
  g.rect(W - 1, 0, 1, H, 'B');
  g.rect(0, H - 1, W, 1, 'B');
  // THE TOWN LANE — a broad pad road, open + connected
  g.rect(2, 11, W - 4, 3, '=');
  g.rect(15, 11, 3, 9, '=');
  g.rect(2, 8, W - 4, 1, '=');
  // the launch green (south)
  g.rect(3, 15, 12, 6, '.');
  // W mouth ← the ice field; E mouth → the magma flats
  g.set(0, 17, '=');
  g.set(0, 18, '=');
  g.set(W - 1, 11, '=');
  g.set(W - 1, 12, '=');
  // THE TOWN — Mauna Lani's lush resort skin along the north strip
  const occupied: Array<{ x: number; y: number; w: number; h: number }> = [];
  const row = buildDistrict(g, { x: 2, y: 2, w: 30, h: 6 }, new Streams(101002), {
    layout: 'organic',
    style: 'fog-stone',
    catalog: AREA_SKINS.mauna_lani,
    lanes: 3,
    maxStories: 2,
    sprinkle: true,
    occupied,
  });

  const props: PropDef[] = [
    ...row.props,
    { sprite: treeSprite(4, 10), x: 4, y: 10, solid: TREE_SOLID }, // a palm by the lane
    { sprite: treeSprite(31, 16), x: 31, y: 16, solid: TREE_SOLID },
    { sprite: 'meteor_rock', x: 18, y: 4, solid: ROCK_SOLID }, // the gantry footing of THE LONG SHOT
    { sprite: 'payphone', x: 22, y: 10.2, solid: PHONE_SOLID }, // phone home (Dad / Mom)
    { sprite: 'well', x: 26, y: 16 },
    { sprite: 'picnic', x: 6, y: 17, solid: PICNIC_SOLID }, // §A4.5 the beach-shack rest
    { sprite: 'prop_trail_marker', x: 31, y: 10 },
  ];

  return {
    id: 'mauna_lani',
    name: 'MAUNA LANI',
    music: null,
    settlement: 'village',
    grid: g.out(),
    props,
    npcs: [
      // PEMBERTON — keeps the rocket THE LONG SHOT (the the_last_wave giver)
      { id: 'ml_pemberton', sprite: 'captain', x: 16, y: 6, facing: 'down', dialogue: 'npc_ml_pemberton', stationary: true, idle: true, emote: 'happy' },
      // THE VENDOR — the §A8 Ch.10 market shelf
      { id: 'ml_vendor', sprite: 'npc_clerk', x: 11, y: 9, facing: 'down', dialogue: 'npc_ml_vendor', shop: 'mauna_vendor' },
      // A LOCAL — waves the party off ("catch the last wave")
      { id: 'ml_local', sprite: 'smiler', x: 9, y: 17, facing: 'down', dialogue: 'npc_ml_local', wander: true, emote: 'happy' },
    ],
    signs: [
      { x: 3, y: 10, dialogue: 'sign_mauna_lani' },
      { x: 32, y: 10, dialogue: 'sign_lani_magma_flats' },
      { x: 16, y: 14, dialogue: 'sign_the_long_shot' },
    ],
    phones: [{ x: 22, y: 10 }],
    atms: [{ x: 24, y: 10 }],
    doors: [
      { x: 0, y: 17, w: 1, h: 2, to: 'aurora_ice_field', tx: 34 * 16, ty: 7 * 16, facing: 'left', indicator: 'none' },
      { x: W - 1, y: 11, w: 1, h: 2, to: 'lani_magma_flats', tx: 1 * 16, ty: 7 * 16, facing: 'right', indicator: 'none' },
    ],
    spawners: [],
    triggers: [],
  };
}

/* ═══════════════════════════════ LANI MAGMA FLATS ════════════════════════════════ *
 * The volcanic flats between the town and the launch gantry. The §A7 magma ecosystem
 * (Cinder Imps off the vents, Ash Crabs out of the lava tubes); the TIKI MAGMA GOLEM rises
 * to bar the launch road (the second §A6 miniboss GATE). Past it, the gantry of THE LONG
 * SHOT — the ch10_launch beat lights the rocket and throws the party to Mars. */
function buildLaniMagmaFlats(): MapDef {
  const W = 36;
  const H = 16;
  const g = new Grid(W, H, '.'); // cooled black lava with red seams
  g.rect(1, 7, W - 2, 3, '=');
  g.rect(0, 0, W, 1, 'B');
  g.rect(0, H - 1, W, 1, 'B');
  g.rect(0, 0, 1, H, 'B');
  g.rect(W - 1, 0, 1, H, 'B');
  g.set(0, 7, '=');
  g.set(0, 8, '='); // W mouth → mauna_lani

  return {
    id: 'lani_magma_flats',
    name: 'THE LANI MAGMA FLATS',
    music: null,
    grid: g.out(),
    props: [
      { sprite: 'meteor_rock', x: 11, y: 3, solid: ROCK_SOLID }, // a cooled lava boulder
      { sprite: 'meteor_rock', x: 24, y: 12, solid: ROCK_SOLID },
      { sprite: 'prop_trail_marker', x: 16, y: 6 },
      { sprite: 'meteor_rock', x: 32, y: 5, solid: ROCK_SOLID }, // the gantry footing of THE LONG SHOT (E)
    ],
    npcs: [],
    signs: [
      { x: 3, y: 6, dialogue: 'sign_lani_magma_flats' },
      { x: 30, y: 6, dialogue: 'sign_the_long_shot' },
    ],
    phones: [],
    doors: [
      { x: 0, y: 7, w: 1, h: 2, to: 'mauna_lani', tx: 32 * 16, ty: 11 * 16, facing: 'left', indicator: 'none' },
    ],
    spawners: [
      { enemies: ['cinder_imp', 'ash_crab'], count: 2, rect: { x: 3, y: 3, w: 8, h: 3 } },
      { enemies: ['ash_crab', 'cinder_imp'], count: 2, rect: { x: 22, y: 11, w: 9, h: 3 } },
    ],
    triggers: [
      // the §A6 TIKI MAGMA GOLEM — bars the launch road E. Spans the open track (cols 20-27
      // cover the lane 7-9) so it cannot be skipped; its win clears the pad.
      { id: 'tiki_magma_golem_boss', rect: { x: 20, y: 6, w: 8, h: 4 }, once: false },
      // THE LONG SHOT — the launch: lights the rocket and throws the party to Mars (once,
      // at the gantry past the golem; the act-jump warps to the Sea of Silence).
      { id: 'ch10_launch', rect: { x: 31, y: 6, w: 4, h: 4 }, once: true },
    ],
  };
}

/* ═══════════════════ THE SEA OF SILENCE (Mars) — the finale arena ═════════════════ *
 * The dead sea past Mars where THE HUSH waits — sparse, alien, the music thinning to
 * nothing as you cross. The §A7 husks drift the approach (Silent Drifters, Static
 * Wraiths). The corridor up to the Hush is kept open the full height so the FINALE beats
 * must fire on foot. CHOICE 3 (`choice_finale` → ch10_song: SILENCE vs FORGIVE) is set on
 * the approach — the Hush speaks, the STRINGS player gives the choice to Mia, the Homesong's
 * purpose is chosen — and just past it THE HUSH holds the deep (`the_hush_boss`, the bespoke
 * 150,000-HP finale). Ember 10 lands with the walk home; the composed ending plays over the
 * credits. No way back — this is the end of the road. */
function buildSeaOfSilence(): MapDef {
  const W = 20;
  const H = 26;
  const g = new Grid(W, H, '.'); // the dead, still floor of the Sea
  g.rect(0, 0, W, 1, 'O');
  g.rect(0, 0, 1, H, 'O');
  g.rect(W - 1, 0, 1, H, 'O');
  g.rect(0, H - 1, W, 1, 'O');
  g.set(9, H - 1, 'o'); // the way in from the launch (S)
  g.set(10, H - 1, 'o');
  // husk-columns frame the long approach WITHOUT ever closing the central corridor
  // (cols 8-11 stay open S↔N; mapcheck BFS clears it)
  g.rect(3, 6, 1, 4, 'O');
  g.rect(16, 6, 1, 4, 'O');
  g.rect(5, 13, 2, 1, 'O'); // a toppled neon husk, left of the path
  g.rect(13, 13, 2, 1, 'O'); // a toppled neon husk, right of the path
  g.rect(3, 18, 1, 4, 'O');
  g.rect(16, 18, 1, 4, 'O');

  return {
    id: 'sea_of_silence',
    name: 'THE SEA OF SILENCE',
    music: null,
    grid: g.out(),
    props: [
      { sprite: 'meteor_rock', x: 9, y: 4, solid: ROCK_SOLID }, // the deep the Hush holds (N)
      { sprite: 'prop_resonance_stones', x: 9, y: 8 }, // the §A6 resonance ring where Ember 10 lands
      { sprite: 'meteor_rock', x: 4, y: 15, solid: ROCK_SOLID }, // a drifting husk
      { sprite: 'meteor_rock', x: 15, y: 20, solid: ROCK_SOLID },
      { sprite: 'prop_trail_marker', x: 9, y: 22 },
    ],
    npcs: [],
    signs: [{ x: 9, y: 23, dialogue: 'sign_sea_of_silence' }],
    phones: [],
    doors: [],
    spawners: [
      { enemies: ['silent_drifter', 'static_wraith'], count: 2, rect: { x: 2, y: 18, w: 5, h: 4 } },
      { enemies: ['static_wraith', 'silent_drifter'], count: 2, rect: { x: 13, y: 18, w: 5, h: 4 } },
    ],
    triggers: [
      // the §A6 arrival — The Long Shot sets the party down on the dead sea (once)
      { id: 'ch10_mars_arrival', rect: { x: 7, y: 22, w: 4, h: 3 }, once: true },
      // CHOICE 3 (FINALE axis) — the Hush speaks, the choice is set: SILENCE vs FORGIVE.
      // Spans the open corridor on the approach (cols 7-12 cover the lane 8-11) so it must
      // fire before the Hush; the handler runs the Hush-speaks + Mia-gate + runChoice + the
      // forgive-viability gate, then self-gates once decided.
      { id: 'choice_finale', rect: { x: 7, y: 11, w: 6, h: 2 }, once: false },
      // the §A6 BOSS — THE HUSH holds the deep (the bespoke 3-movement finale). Spans the
      // open lane just below the deep (cols 6-13 cover 8-11); the win drives the name-confirm,
      // the Homesong, the walk home, and the composed ending.
      { id: 'the_hush_boss', rect: { x: 6, y: 3, w: 8, h: 3 }, once: false },
    ],
  };
}

/**
 * THE CHAPTER 10 MAP SET — the snowcat lands the party at Aurora Station; the ice field
 * climbs past the Frost Sentinel to Pemberton's seaplane; Mauna Lani's magma flats climb
 * past the Tiki Golem to The Long Shot; and the rocket throws them to the Sea of Silence,
 * where the Hush waits and the road ends. Assembled like buildChapter9Maps (a record
 * spread into MAPS).
 */
export function buildChapter10Maps(): Record<string, MapDef> {
  return {
    aurora_station: buildAuroraStation(),
    aurora_ice_field: buildAuroraIceField(),
    mauna_lani: buildMaunaLani(),
    lani_magma_flats: buildLaniMagmaFlats(),
    sea_of_silence: buildSeaOfSilence(),
  };
}
