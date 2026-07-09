/**
 * Overworld: EB-style 8-direction movement with follower conga line, visible
 * roaming enemies (no random encounters — §A4.2), swirl-coded contact
 * advantage, doors, signs, phones (save = call Dad), and the Chapter 1
 * cutscenes per GAME_BIBLE §A6 / ADR-007 + S2 (Mia, the Manager, Mom's call).
 *
 * QA recipe, S2 leg (ADR-008; name entry recipe lives in NameEntryScene):
 * mashing key('KeyZ') advances dialogue AND confirms the top menu row, which
 * is always the safe pick (Board the 6:15 / Call Dad / Bash). On dos_f3,
 * walk into each patrol's route to fight it — victories set dos_quota_f3a/b/c
 * and the third fade-restarts the floor with the room carved open. Walk in
 * through the gap (tiles 20-21, row 6) for the join; the exit column (24,
 * rows 3-4) runs the Manager fight — pick Mia's PRAY with Down,Down,KeyZ on
 * her command row. Mom's call: the payphone at Twoton's bus corner (16,66), A to answer.
 * Bots beware: holdKey is eaten while dlg.busy — drain pages with key() first.
 * S3: Enter (START) opens the EB command menu — it's a separate scene over a
 * paused world; the drive-it recipe lives in MenuScene's header.
 * S4: phones are a contact list now (top row stays Call Dad = the safe pick);
 * the brickton ATM sits at the jittered bank facade — face it, KeyZ, then
 * Withdraw/Deposit/Done rows with $-preset rows under each. Shopkeepers open
 * ShopScene on talk (recipe in ITS header); KeyZ through a keeper greeting
 * lands on BUY.
 * S6: Dad's FIRST save per playthrough asks "Which notebook?" — a 3-row menu
 * (top row = Notebook 1), so a KeyZ-mash through Call Dad picks Notebook 1
 * and every later save reuses it silently. Continue lives in SaveSlotsScene
 * (recipe in ITS header). A party wipe respawns at the last Dad-save's
 * map/position (GS.respawnPoint) instead of hardcoded rex_home.
 * S15c (ADR-043) checks: night tint must cover screen row 0 — snapshot +
 * sample (60,0) over otterbrook at scrollY>0, expect the tinted ~[73,101,55]
 * never day-[164,220,100]; swirl = GREEN sneaking up on a roamer's back,
 * RED when one chases you down (SWIRL_TINT is the law); biscuit_road speaks
 * its _after lines between tick_defeated and zapper_done; old_timer/
 * pajama_kid read dialogueDay once zapper_done; the 6:15 spawns the hero
 * seated at (296,100,'up') — player.depth must equal y from frame one;
 * brickton's arrival pan runs three legs paced by the say() pages.
 * S9: quests (§A10 #1–3). Pemmel/Plummer/Ana/Vivi talk through questTalk()
 * state branches; sniff clues + the spring are flag-gated SIGNS whose beats
 * run in signBeat(); mail delivers by interacting with the five door props
 * while q_mail is live. The full bot recipe (Mail Must Move end-to-end)
 * lives in engine/quests.ts's header; the JOURNAL drives from MenuScene.
 *
 * -- S14 QA recipe (THE GILDED GRIN — ran 2026-06-11, log in docs/QA.md):
 * Driver lore earned here: settle scene RESTARTS before pressing (a
 * restart eats latched presses), and trigger rects are EDGE-fired — a bot
 * canceled inside one must LEAVE and re-enter. KeyX on an ask still picks
 * the cancel row (S9 lore); KeyZ-mash only when row 0 is the want.
 * 1. Bench post-ch1: party Jay+Mia L10 via mfMakeHero, the Ch.1 story
 *    flags + awake_* trio, cash. Spawn brickton_docks INSIDE the gangplank
 *    trigger (364,138) → the captain's ask fires on first update → KeyZ ×4
 *    boards → the deck scene (KeyZ ×~36 through the §A11 pages) → lands at
 *    PUERTO_SOL_PIER_SPAWN with boat_ride_done set.
 * 2. The pyramid: spawn beside a mask sign (room 1: 56,202 facing left),
 *    KeyZ → the mask line + the grind + fade-restart; pyr_rot_1 += 1 per
 *    press. The canonical solve is 1/1/2/2 presses (BFS-pinned in
 *    maps_ch2.test.ts). Thread rotor channels at tile-center x (col*16+8).
 * 3. The Grin: launch over the paused world —
 *      ow.scene.launch('battle', { enemyIds: ['gilded_grin'],
 *        advantage: 'none', guestChad: false, glintAssist: false,
 *        boss: true });
 *    Round 1 bash CLANGS (980 holds); boss turn 2 telegraphs, turn 3 swaps
 *    to battle_gilded_grin_hollow and MIA'S AWAKENING pages ride the same
 *    KeyZ mash (awake_freeze_a flips); hollow bashes LAND; the solid
 *    return composes with wear (battle_gilded_grin_w1). Field a solo hero
 *    for any menu-precise leg (the S11 lore).
 * 4. Picnic: GS.addItem('basket_feast'), stand left of a table (puerto
 *    plaza: 660,252 facing right), KeyZ → KeyZ (Spread, row 0) → the
 *    blanket/birds/restore; sunny_side=5, feast_armed set, basket gone.
 * 5. Hospital: spawn hospital_int (88,68 facing up), wait dlg.busy, KeyZ
 *    through the greet → row 0 revives the angel for reviveCost(level).
 */
import Phaser from 'phaser';
import {
  MAPS,
  CHAR_LEGEND,
  BRICKTON_BUS_SPAWN,
  BRICKTON_FOOT_SPAWN,
  carveHoldingRoom,
  type DoorZone,
  type MapDef,
  type NpcDef,
  type PatrolDef,
  type PropDef,
} from '../data/maps';
import { PYR_ROTOR, PYR_INITIAL_ROT, PUERTO_SOL_PIER_SPAWN, rotateRect } from '../data/maps_ch2';
import { ENEMIES, MAX_BATTLE_ENEMIES, type EnemyDef } from '../data/enemies';
import { DIALOGUE } from '../data/dialogue';
import { ITEMS } from '../data/items';
import { GS, makeHeroState } from '../engine/state';
import { completeQuest } from '../engine/quests';
import { PROPERTIES } from '../data/properties';
import { buyCost } from '../engine/property';
import { carById } from '../engine/garage';
import { availableAbilities } from '../data/heroes';
import { PSI_GATES } from '../data/psigates';
import { canClearGate, bestCastFor } from '../engine/psi';
import {
  HOOPS_TEXT,
  TEAMS,
  TEAM_ORDER,
  STARTING_FIVE,
  STARTING_FIVE_IDS,
  newBracket,
  nextOpponent,
  classicSeed,
  pickupSeed,
} from '../data/hoops';
import { AWAKENINGS } from '../data/awakenings';
// S21 (ADR-126/127/128): the Held Breath rewind, the three Axes, the composed ending
import { playCutscene } from '../engine/cutscene';
import { CHOICES, type ChoiceId } from '../data/choices';
import { recordChoice } from '../engine/choice';
import { captureEcho, isRewindable, clearPuppetLock } from '../engine/echo';
import { composeEnding, endingContext, forgiveViable } from '../engine/ending';
import { withholdUltimate, isPresent } from '../engine/party';
import { LINKS_FLAGS, LINKS_TEXT, SUNDAY_SET, linksSeed } from '../data/links';
import type { HoopsLaunch } from './HoopsScene';
import type { LinksLaunch } from './LinksScene';
import { SLOT_IDS } from '../engine/saves';
import { INPUT } from '../engine/input';
import { AUDIO } from '../engine/audio';
import { Dialogue, makeWindow, toast, vars, everyFrame, DEPTH_UI, overscanRect } from '../ui/windows';
import { askAmount } from '../ui/amount';
import { money } from '../ui/text';
import { TrafficSim, cellKey } from '../engine/traffic';
import { entersNewBody } from '../engine/movecollide';
import { DEALERSHIP } from '../data/dealership';
import { FLEET_CRAFT } from '../data/fleet';
import { VEHICLE_SPECS } from '../spritegen/vehicles';
import { makeVitalsBar, type VitalsBar } from '../ui/vitals';
import { tileIndexByName, PATH_BASE, PATH_VARIANTS, RUG_BASE, HEDGE_BASE, BRAMBLE_BASE } from '../spritegen/tiles';
import { LANDMARK_FACADE_SPRITES } from '../spritegen/buildings';
import { AUTHORED_VEHICLE_ART_KEYS, AUTHORED_WORLD_PROP_DISPLAY_SIZE, DIRECTIONAL_VEHICLE_KEYS, OBLIQUE_SHADOW_PROP_KEYS, worldSpriteScale } from '../spritegen/authored';
import { TILE_SOLID, standFrame, facingFromVec, facing8, FACING_VEC, type Facing } from '../spritegen';
import {
  instantWinGroup,
  withinRadius,
  expShare,
  SUNNY_BATTLES,
  reviveCost,
  CURE_ALL_COST,
  CHAPEL_HEAL,
  contactAdvantage,
  SWIRL_TINT,
} from '../battle/formulas';
import { colorOf, RAMP, px } from '../palette';
import { s, ART_SCALE, TILE_PX } from '../spritegen/scale';
import { showCard, showCaption, playStagedScene } from '../engine/cutsceneStage';
import { ch1FirstHeartlight } from '../data/cutscenes_staged';
import { openingPhase, type OpeningPhase } from '../engine/opening';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Roamer {
  spr: Phaser.GameObjects.Sprite;
  enemyId: string;
  /** character sheet id when this enemy walks as a person (EnemyDef.walker) */
  walker?: string;
  /** authored 8-direction enemy sheet id */
  overworld?: string;
  facing: Facing;
  vx: number;
  vy: number;
  think: number;
  home: Rect;
  dead: boolean;
  /** WO P5: this roamer's own terrace (per-mover cross-level collision). */
  level: number;
}

type PatrolState = 'patrol' | 'alert' | 'chase' | 'return';

function enemyOverworldFrame(facing: Facing): number {
  switch (facing) {
    case 'down': return 0;
    case 'downleft': return 1;
    case 'left': return 2;
    case 'upleft': return 3;
    case 'up': return 4;
    case 'upright': return 5;
    case 'right': return 6;
    case 'downright': return 7;
  }
}

interface PatrolObj {
  spr: Phaser.GameObjects.Sprite;
  def: PatrolDef;
  walker: string;
  overworld?: string;
  wp: number;
  state: PatrolState;
  /** ms left in the alert pause */
  alertT: number;
  /** seconds the player has been out of reach while chasing */
  lose: number;
  facing: Facing;
  dead: boolean;
  bang: Phaser.GameObjects.BitmapText | null;
  /** WO P5: this patrol's own terrace (per-mover cross-level collision). */
  level: number;
}

interface NpcObj {
  spr: Phaser.GameObjects.Sprite;
  def: NpcDef;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  think: number;
  /** ADR-124: free-roams a small radius (outdoor townsfolk) vs holds position
   *  (shop/clinic/clerk + interiors + explicit wander:false/stationary). */
  wanders: boolean;
  /** WO P5: this NPC's own terrace (per-mover cross-level collision). */
  level: number;
}

type AuthoredWorldPropKey = keyof typeof AUTHORED_WORLD_PROP_DISPLAY_SIZE;

const AUTHORED_VEHICLE_PROP_KEYS = new Set<string>(AUTHORED_VEHICLE_ART_KEYS);
const TRAFFIC_AUTHORED_VEHICLES = [
  ...Object.values(DEALERSHIP).map((car) => ({ id: car.id, vehicleType: car.vehicleType })),
  ...Object.values(FLEET_CRAFT).map((craft) => ({ id: craft.id, vehicleType: craft.vehicleType })),
  { id: 'bus', vehicleType: 'bus' },
  { id: 'vehicle_clunker', vehicleType: 'sedan' },
  { id: 'savanna_caravan_truck', vehicleType: 'truck' },
] as const;

// px/s movement speeds (ADR-024 dt-scaled) — scaled to runtime space so the
// felt pace is identical at any ART_SCALE (the world grid scales with them).
const WALK = 70 * ART_SCALE;
const RUN = 115 * ART_SCALE;
const PURSUE = 85 * ART_SCALE;
// conga-line smoothing rate (per second): followers EASE toward their breadcrumb each
// frame instead of hard-snapping to it. The trail only drops a crumb every s(3) of
// travel, so a snap teleported each follower ~12px in jerky hops (looked like frame-
// rate stutter next to Jay's smooth per-frame walk). dt-scaled so it's display-rate
// independent (ADR-024); a large gap still snaps (teleport / fresh map).
const FOLLOW_EASE = 30;
const PATROL_WALK = 38 * ART_SCALE;
const PATROL_CHASE = 92 * ART_SCALE;
/** ADR-118 rework — Constable Borden's run-you-down speed: brisker than your
 *  WALK, slower than your RUN, so a sprint can still shake him (the cop fight
 *  stays optional). Bespoke chase: OverworldScene.bordenChase. */
const BORDEN_CHASE = 88 * ART_SCALE;
/** where you spawn INSIDE the station holding cell when Borden marches you in
 *  (tile ~12.5,3.5 → native px; goThroughDoor scales it to runtime space). */
const OTTER_CELL = { tx: 200, ty: 56 } as const;
/** Ch.1 OUTDOOR maps that ride the §A6 story clock: it is 2 AM across the whole
 *  opening — town, the long climb, and the crater — until `zapper_done` (dawn).
 *  Every map the player traverses BEFORE dawn must be listed here or it renders
 *  in daylight mid-night (the "why is this section bright at 2 AM" bug). The two
 *  climb legs HICKORY TRAIL + WHISPERWOOD RISE were added with the rest of the
 *  hill (ADR-112) but missed this list, so they showed as day between the lit
 *  hill_road and hickory_hill — keep new connective maps in sync here. (The
 *  meadow long-walk to Brickton is a POST-dawn daytime route and stays off.) */
const CH1_STORY_NIGHT_MAPS: ReadonlySet<string> = new Set([
  'otterbrook', // the town + the whole hill + the crater are ONE elevated map now (S5)
  // the UNDER-OAK (ADR-121 rework) rides the same clock: pitch-hushed until the
  // Tick dies, then the post-victory rebuild lets the real light down the roots
  'oak_roots',
  'oak_hollow',
  'oak_heart',
]);
/** PKG-12 §A11 — the GRAND DUCHY OF MINIMUS tile reskin. The engine has ONE global
 *  TILESET (no per-area swap), so buildTiles remaps the shared grid-char tile NAMES to
 *  the appended Minimus tiles for these maps ONLY (the authored Minimus_tiles_16.png
 *  strip supplies the visuals). Each Minimus tile carries the SAME solidity as the base
 *  it replaces, so the remap is purely cosmetic — collision/BFS read the unchanged grid. */
const MINIMUS_SKIN_MAPS: ReadonlySet<string> = new Set([
  'minimus_major',
  'procession_way',
  'the_hedgerow',
  'ducal_crown',
]);
const MINIMUS_TILE_SKIN: Readonly<Record<string, string>> = {
  grass_a: 'minimus_turf', // the duchy turf / maze floor (`.`) → privet velvet-lawn
  office_floor: 'minimus_turf', // dungeon way-gaps (`o`) blend into the maze floor
  office_wall: 'minimus_hedge', // the maze + dungeon walls (`O`) → privet hedge (SOLID)
  sidewalk: 'minimus_cobble', // the Procession Way (`=`) → ribbon cobblestone
  road: 'minimus_cobble', // Minimus Major's streets (`R`) → cobblestone
  road_dash: 'minimus_cobble', // the centreline (`D`) — a duchy ribbon needs no lane dash
  // the OUTDOOR borders (minimus_major / procession_way perimeters) were rendering generic
  // Ohio brick + grass against the bespoke Hedgerow/Crown skin — fold them into the duchy too.
  // Solidity is preserved: brick/bush (solid) → minimus_hedge (solid), grass variants → turf.
  brick: 'minimus_hedge', // the drystone kerb / city wall (`B`) → privet hedge border (SOLID)
  bush: 'minimus_hedge', // any solid bush (`b`) → a clipped privet (SOLID)
  grass_b: 'minimus_turf', // decorative grass (`,`) → velvet lawn
  grass_tuft: 'minimus_turf', // decorative grass (`~`) → velvet lawn
};
/** Ch.4 NORWAY (Kvisthavn / Bootstep Moor / Lilleby) tile reskin — the fjord hamlet, the
 *  snowy moor, and the giants' town wear pebbled snow ground, a grey cobbled quay-lane,
 *  sheer rock-cliff walls, and open fjord water (the authored Norway_tiles_16.png strip).
 *  Each Norway tile carries the SAME solidity as the base it replaces (water stays solid
 *  like sea_a), so the remap is purely cosmetic — collision/BFS read the unchanged grid.
 *  The Sleeper's Spine dungeon keeps its own interior look. */
/** the UNDER-OAK (ADR-121 rework): the dungeon's rock reskins to root-tangle */
const UNDEROAK_SKIN_MAPS: ReadonlySet<string> = new Set(['oak_roots', 'oak_hollow', 'oak_heart']);
const UNDEROAK_TILE_SKIN: Readonly<Record<string, string>> = {
  cliff_face: 'root_wall', // the carved 'K' walls → packed earth + woody roots
};
/** OTTERBROOKE (2026-07-04): the hill's deep-woods 'b' render as the AUTHORED dense
 *  top-down tree canopy (tools/apply-canopy-tile.ts) — same solidity as bush, so
 *  collision/BFS are unchanged; the town has no 'b' cells so only the hill woods change. */
const OTTERBROOK_SKIN_MAPS: ReadonlySet<string> = new Set(['otterbrook']);
const OTTERBROOK_TILE_SKIN: Readonly<Record<string, string>> = {
  bush: 'tree_canopy',
  // Ground now comes from the GAME-WIDE oblique BASE kit (apply-base-ground overwrote grass_a/
  // road/sidewalk/crosswalk/etc. in the strip), so Otterbrooke shares it with every map — no
  // per-map ground remap needed. The ':' dirt paths are fixed at the strip level too.
};
const NORWAY_SKIN_MAPS: ReadonlySet<string> = new Set([
  'kvisthavn',
  'bootstep_moor',
  'lilleby',
]);
const NORWAY_TILE_SKIN: Readonly<Record<string, string>> = {
  grass_a: 'norway_ground', // hamlet green / moor floor (`.`) → pebbled snow
  grass_b: 'norway_ground', // decorative grass (`,`)
  grass_tuft: 'norway_ground', // decorative grass (`~`)
  office_floor: 'norway_ground', // outdoor way-gaps (`o`) blend into the snow
  road: 'norway_path', // any street (`R`) → grey cobblestone
  sidewalk: 'norway_path', // the quay lane / moor track (`=`) → cobblestone
  road_dash: 'norway_path', // the centreline (`D`) — a fjord lane needs no dash
  office_wall: 'norway_wall', // outdoor walls (`O`) → rock cliff (SOLID)
  brick: 'norway_wall', // the cliff borders (`B`) → rock cliff (SOLID)
  bush: 'norway_wall', // any solid bush (`b`) → a rock outcrop (SOLID)
  sea_a: 'norway_water', // the fjord (`e`) → open fjord water (SOLID; foam lip `E` stays)
};
/** Ch.6 AFRICA tile reskins — the Africa_tiles_16.png strip authors THREE sub-biomes, so
 *  each Ch.6 outdoor map gets its own map-scoped skin (the Ch.10 Aurora/Lani/Mars precedent):
 *  Zanzibel = ochre-sand spice port, the Savanna Run = sun-bleached grassland with a cracked
 *  dust track, the Laughing Ruins = cracked dry earth walled in carved laughing stone. Each
 *  tile carries the SAME solidity as the base it replaces, so the remaps are purely cosmetic. */
// + the Ch.2 LAS DUNAS crossing (Dusty Dunes rebuild 2026-07-08): the desert legs
// paint sand/rock/oasis directly and borrow the ochre skin for their grass/bush/road
const ZANZIBEL_SKIN_MAPS: ReadonlySet<string> = new Set(['zanzibel', 'jungle_1', 'jungle_2']);
const ZANZIBEL_TILE_SKIN: Readonly<Record<string, string>> = {
  grass_a: 'africa_sand', // the port ground (`.`) → ochre sand
  grass_b: 'africa_sand', // decorative grass (`,`)
  grass_tuft: 'africa_sand', // decorative grass (`~`)
  office_floor: 'africa_sand', // way-gaps (`o`) blend into the sand
  road: 'africa_path', // the Quayside Run / bazaar road (`R`) → sandstone flags
  sidewalk: 'africa_path', // any avenue (`=`) → sandstone flags
  road_dash: 'africa_path', // the centreline (`D`) — a bazaar street needs no dash
  office_wall: 'africa_wall', // outdoor walls (`O`) → adobe (SOLID)
  brick: 'africa_wall', // the town border (`B`) → adobe (SOLID)
  bush: 'africa_wall', // any solid bush (`b`) → an adobe section (SOLID)
  sea_a: 'africa_water', // the harbor (`e`) → teal water (SOLID; foam lip `E` stays)
};
const SAVANNA_SKIN_MAPS: ReadonlySet<string> = new Set(['savanna_run']);
const SAVANNA_TILE_SKIN: Readonly<Record<string, string>> = {
  grass_a: 'africa_grass', // sun-bleached grass (`.`) → savanna grassland
  grass_b: 'africa_grass', // decorative grass (`,`)
  grass_tuft: 'africa_grass', // decorative grass (`~`)
  office_floor: 'africa_grass', // way-gaps (`o`) blend into the grass
  road: 'africa_earth', // any street (`R`) → cracked dry earth
  sidewalk: 'africa_earth', // THE RUN's broad dust track (`=`) → cracked dry earth
  road_dash: 'africa_earth', // the centreline (`D`) — a caravan track needs no dash
  office_wall: 'africa_wall', // outcrops (`O`) → adobe/dried-mud rock (SOLID)
  brick: 'africa_wall', // the run borders (`B`) → adobe (SOLID)
  sea_a: 'africa_water', // the watering hole (`e`) → teal water (SOLID)
  // NOTE: `bush` stays the base green bush — scrub reads right on savanna grass.
};
const RUINS_SKIN_MAPS: ReadonlySet<string> = new Set(['laughing_ruins']);
const RUINS_TILE_SKIN: Readonly<Record<string, string>> = {
  grass_a: 'africa_earth', // the ruin floor (`.`) → cracked dry earth
  grass_b: 'africa_earth', // decorative grass (`,`)
  grass_tuft: 'africa_earth', // decorative grass (`~`)
  office_floor: 'africa_earth', // way-gaps (`o`) blend into the earth
  road: 'africa_path', // processional ways (`R`) → sandstone flags
  sidewalk: 'africa_path', // any avenue (`=`) → sandstone flags
  road_dash: 'africa_path', // the centreline (`D`) — a ruin path needs no dash
  office_wall: 'africa_ruin_wall', // the ruin walls (`O`) → carved laughing stone (SOLID)
  brick: 'africa_ruin_wall', // the borders (`B`) → carved laughing stone (SOLID)
  bush: 'africa_ruin_wall', // any solid bush (`b`) → a carved block (SOLID)
  sea_a: 'africa_water', // any pool (`e`) → teal water (SOLID)
};
/** PKG-15 §1 — the Ch.8 CHINA (Lotus Harbor) tile reskin. Same render-time name-remap as
 *  MINIMUS_TILE_SKIN: the shared grid chars render as the authored China_tiles_16.png cells
 *  on the Ch.8 settlement/route/temple maps ONLY (the spore_forest dungeon keeps its own
 *  look). Each china tile carries the SAME solidity as the base it replaces, so the remap is
 *  purely cosmetic — collision/BFS read the unchanged grid. */
const CHINA_SKIN_MAPS: ReadonlySet<string> = new Set([
  'lotus_harbor',
  'bamboo_road',
  'mt_shu_temple',
]);
const CHINA_TILE_SKIN: Readonly<Record<string, string>> = {
  grass_a: 'china_ground', // the jade river-dust ground (`.`)
  grass_b: 'china_ground', // decorative grass (`,`)
  grass_tuft: 'china_ground', // decorative grass (`~`)
  office_floor: 'china_ground', // temple/interior way-gaps (`o`) blend into the ground
  road: 'china_path', // Lotus Harbor's streets (`R`) → stone flagstone
  sidewalk: 'china_path', // the ghat run / avenue (`=`) → flagstone
  road_dash: 'china_path', // the centreline (`D`) — a temple-town path needs no lane dash
  office_wall: 'china_wall', // temple + interior walls (`O`) → masonry (SOLID)
  brick: 'china_wall', // the town wall / river kerb (`B`) → temple masonry (SOLID)
  bush: 'china_wall', // any solid bush (`b`) → a wall section (SOLID)
};
/** Ch.9 ROMANIA (Valea Stelelor) tile reskin — the painted village, the Old Road, Castle
 *  Hoaxula, and the Stone Brow monastery wear mountain-meadow grass, packed-dirt road, and
 *  mossy castle stonework. Each Romania tile carries the SAME solidity as the base it replaces,
 *  so the remap is purely cosmetic — collision/BFS read the unchanged grid. */
const ROMANIA_SKIN_MAPS: ReadonlySet<string> = new Set([
  'valea_stelelor',
  'old_road',
  'castle_hoaxula',
  'stone_brow_monastery',
]);
const ROMANIA_TILE_SKIN: Readonly<Record<string, string>> = {
  grass_a: 'romania_ground', // village earth / verge / castle floor (`.`)
  grass_b: 'romania_ground', // decorative grass (`,`)
  grass_tuft: 'romania_ground', // decorative grass (`~`)
  office_floor: 'romania_ground', // castle/monastery way-gaps (`o`) blend into the ground
  road: 'romania_path', // the village lane / district streets (`R`) → packed dirt road
  sidewalk: 'romania_path', // the cart-track lanes (`=`) → packed dirt road
  road_dash: 'romania_path', // the centreline (`D`) — a mountain road needs no lane dash
  office_wall: 'romania_wall', // castle + monastery walls (`O`) → castle stone (SOLID)
  brick: 'romania_wall', // the village border / cliffs (`B`) → castle stone (SOLID)
  bush: 'romania_wall', // any solid bush (`b`) → a wall section (SOLID)
};
/** Ch.10 ALASKA (Aurora Station + the ice field) tile reskin — snow-over-ice ground, a plowed
 *  snow lane, and glacial ice-block walls. Same render-time name-remap + solidity-preserving
 *  contract as the China/Romania skins; applied ONLY to the two Aurora maps. */
const AURORA_SKIN_MAPS: ReadonlySet<string> = new Set([
  'aurora_station',
  'aurora_ice_field',
]);
const AURORA_TILE_SKIN: Readonly<Record<string, string>> = {
  grass_a: 'aurora_ground', // snow-packed station yard / wind-scoured field (`.`)
  grass_b: 'aurora_ground', // decorative grass (`,`)
  grass_tuft: 'aurora_ground', // decorative grass (`~`)
  office_floor: 'aurora_ground', // interior way-gaps (`o`) blend into the snow
  road: 'aurora_path', // any street (`R`) → plowed snow lane
  sidewalk: 'aurora_path', // the station lanes / the ice-field road (`=`) → plowed snow
  road_dash: 'aurora_path', // the centreline (`D`) — a snow lane needs no lane dash
  office_wall: 'aurora_wall', // interior walls (`O`) → glacial ice block (SOLID)
  brick: 'aurora_wall', // the station border / ice cliffs (`B`) → ice block (SOLID)
  bush: 'aurora_wall', // any solid bush (`b`) → an ice block (SOLID)
};
/** Ch.10 HAWAII (Mauna Lani + the magma flats) tile reskin — black volcanic sand ground, a
 *  pale ash-gravel lane, and basalt-with-magma-seam walls. Same contract; the two Lani maps. */
const LANI_SKIN_MAPS: ReadonlySet<string> = new Set([
  'mauna_lani',
  'lani_magma_flats',
]);
const LANI_TILE_SKIN: Readonly<Record<string, string>> = {
  grass_a: 'lani_ground', // warm black-sand town ground / cooled lava flats (`.`)
  grass_b: 'lani_ground', // decorative grass (`,`)
  grass_tuft: 'lani_ground', // decorative grass (`~`)
  office_floor: 'lani_ground', // interior way-gaps (`o`) blend into the black sand
  road: 'lani_path', // any street (`R`) → pale volcanic gravel lane
  sidewalk: 'lani_path', // the pad road / the flats track (`=`) → ash gravel
  road_dash: 'lani_path', // the centreline (`D`) — a volcanic lane needs no lane dash
  office_wall: 'lani_wall', // interior walls (`O`) → basalt rock (SOLID)
  brick: 'lani_wall', // the town border / lava cliffs (`B`) → basalt rock (SOLID)
  bush: 'lani_wall', // any solid bush (`b`) → a basalt block (SOLID)
};
/** Ch.10 MARS (the Sea of Silence) tile reskin — red regolith ground, a compacted dust track,
 *  and Martian rock walls/husk-columns. Same contract; the finale arena map only. */
const MARS_SKIN_MAPS: ReadonlySet<string> = new Set([
  'sea_of_silence',
]);
const MARS_TILE_SKIN: Readonly<Record<string, string>> = {
  grass_a: 'mars_ground', // the dead, still floor of the Sea (`.`)
  grass_b: 'mars_ground', // decorative grass (`,`)
  grass_tuft: 'mars_ground', // decorative grass (`~`)
  office_floor: 'mars_ground', // the way-in from the launch (`o`) blends into the regolith
  road: 'mars_path', // any street (`R`) → compacted regolith track
  sidewalk: 'mars_path', // any avenue (`=`) → compacted regolith track
  road_dash: 'mars_path', // the centreline (`D`) — a dust track needs no lane dash
  office_wall: 'mars_wall', // the husk-columns + arena borders (`O`) → Martian rock (SOLID)
  brick: 'mars_wall', // any border (`B`) → Martian rock (SOLID)
  bush: 'mars_wall', // any solid bush (`b`) → a rock block (SOLID)
};

/* ------------------------------------------------------------------ */
/* THE EDGE BIOME SYSTEM (buildEdgeFeatures, ADR-132) — the old "treeline" ringed
 * EVERY outdoor map's border with the same three Ohio oaks, so a desert pyramid,
 * a glacier field, the lava flats, and the Sea of Silence all trailed off into
 * incongruous forest. Now each map declares a BIOME, and its border is ringed with
 * a terrain feature that matches: conifers in Norway/Romania, palms on tropical
 * coasts, baobabs on the savanna, privet in the duchy, ice + spruce in the Arctic,
 * dunes + cacti in the desert, bamboo in China, basalt on the lava flats, red rock
 * on Mars. The out-of-bounds VOID is tinted to the biome too, so a small map fades
 * into sand / ice / rust instead of forest-green. Purely DECORATIVE — out-of-bounds
 * is already impassable, so (exactly like the old treeline) this adds no solids and
 * the reachability validator sees nothing. */
type EdgeBiome =
  | 'temperate' | 'mountain_pine' | 'tropical' | 'savanna' | 'hedge'
  | 'jungle' | 'desert' | 'ice' | 'volcanic' | 'mars' | 'bamboo'
  | 'spore' | 'cave' | 'none';

interface EdgeFeatureDef {
  /** the AUTHORED prop keys to ring with — used once ALL their textures load */
  keys: readonly string[];
  /** existing-prop stand-ins (with fallbackTint) used until the bespoke art lands;
   *  lets the system ship before every biome's PNG is authored, then auto-upgrade */
  fallback?: readonly string[];
  /** tint applied to the fallback stand-ins (frosts spruce, rusts rock, …) */
  fallbackTint?: number;
  /** tint applied to the real keys (rarely needed — bespoke art is self-colored) */
  tint?: number;
  /** size multiplier so a hedge / ice cliff / basalt wall reads denser, wall-like */
  scaleMul?: number;
  /** out-of-bounds void color so a small map fades into the biome, not the forest */
  voidColor: number;
}

/** the per-biome edge recipe. `keys` are the bespoke authored props (filled in as the
 *  ChatGPT→PNG art lands); `fallback` keeps every map looking right in the meantime. */
const EDGE_BIOME: Record<EdgeBiome, EdgeFeatureDef> = {
  // Ohio / England temperate — the original look, byte-for-byte (oaks, forest void)
  temperate: { keys: ['tree', 'tree_b', 'tree_c'], voidColor: colorOf(px(RAMP.FOREST, 0)) },
  // Norway fjords + Romanian mountains — dark authored conifers
  mountain_pine: {
    keys: ['prop_pine_whisperwood', 'prop_pine_whisperwood_b', 'prop_pine_whisperwood_c'],
    voidColor: 0x16301f,
  },
  // tropical coasts — Puerto Sol, the Costa, Chandrapore, Mauna Lani — authored palms
  tropical: { keys: ['palm_a', 'palm_b', 'palm_c', 'palm_d'], voidColor: 0x123f33 },
  // African savanna — the authored baobab, a touch larger so it crowns the horizon
  savanna: { keys: ['baobab_shade'], scaleMul: 1.08, voidColor: 0x7c6630 },
  // the Grand Duchy of Minimus — clipped privet, scaled up to read as a maze wall
  hedge: { keys: ['hedgerow_leaf_wall', 'hedgerow_thorn_arch'], scaleMul: 1.35, voidColor: 0x223c1d },
  // ── gap biomes: bespoke art to be authored; fallbacks keep them right until then ──
  jungle: {
    keys: ['edge_jungle_a', 'edge_jungle_b', 'edge_jungle_c'],
    fallback: ['palm_a', 'palm_b', 'palm_c'], fallbackTint: 0x9ad07f, voidColor: 0x0d2f18,
  },
  desert: {
    keys: ['edge_desert_dune', 'edge_desert_cactus', 'edge_desert_rock'],
    fallback: ['prop_resonance_stones'], fallbackTint: 0xd8b878, scaleMul: 1.05, voidColor: 0xb08a4e,
  },
  ice: {
    keys: ['edge_ice_spire', 'edge_ice_spruce', 'edge_ice_drift'],
    fallback: ['prop_pine_whisperwood', 'prop_pine_whisperwood_b'], fallbackTint: 0xcfe6ff, voidColor: 0x9db4cc,
  },
  volcanic: {
    keys: ['edge_basalt_a', 'edge_basalt_b'],
    fallback: ['prop_resonance_stones'], fallbackTint: 0x52454c, scaleMul: 1.05, voidColor: 0x2a2228,
  },
  mars: {
    keys: ['edge_mars_a', 'edge_mars_b'],
    fallback: ['prop_resonance_stones'], fallbackTint: 0xb0593a, scaleMul: 1.05, voidColor: 0x5e2a1c,
  },
  bamboo: {
    keys: ['edge_bamboo_a', 'edge_bamboo_b', 'edge_bamboo_c'],
    fallback: ['prop_pine_whisperwood', 'prop_pine_whisperwood_b'], fallbackTint: 0xbfe08a, voidColor: 0x294e2c,
  },
  spore: {
    keys: ['edge_spore_a', 'edge_spore_b'],
    fallback: ['tree', 'tree_b'], fallbackTint: 0xc59cf0, voidColor: 0x342050,
  },
  cave: {
    keys: ['edge_rock_a', 'edge_rock_b'],
    fallback: ['prop_resonance_stones'], fallbackTint: 0x9aa0ac, scaleMul: 1.05, voidColor: 0x2c2a32,
  },
  // organic interiors (inside the sleeping giant): no border feature at all
  none: { keys: [], voidColor: 0x101018 },
};

/** explicit biome per map id, for the unskinned maps + the per-map exceptions a tile
 *  skin can't express (Mauna Lani town is tropical palms, but its magma flats are
 *  basalt — both share the LANI skin). Anything not listed falls through to the tile
 *  skin's default, then to 'temperate'. */
const MAP_BIOME: Readonly<Record<string, EdgeBiome>> = {
  // Ch.2 — South America: LAS DUNAS desert crossing (Dusty Dunes rebuild,
  // 2026-07-08), the desert pyramid, tropical coast
  jungle_1: 'desert', jungle_2: 'desert', grotto: 'cave',
  puerto_sol: 'tropical', costa_estrella: 'tropical',
  valle_dorado: 'tropical', // the golden city rises where the river meets the dunes
  pyramid_ante: 'desert', pyramid_apex: 'desert',
  // Ch.4 — Norway fjords (authored Whisperwood pines)
  kvisthavn: 'mountain_pine', bootstep_moor: 'mountain_pine', lilleby: 'mountain_pine',
  spine_hand: 'none', spine_shoulder: 'none', spine_ear: 'none',
  // Ch.6 — Africa: savanna + the desert ruins
  zanzibel: 'savanna', savanna_run: 'savanna',
  laughing_ruins: 'desert', sphinx_chin: 'desert',
  // Ch.7 — India tropical
  chandrapore: 'tropical', monsoon_road: 'tropical', night_train: 'tropical',
  // Ch.8 — China: the spore forest keeps its own mushroom look (not the bamboo skin)
  spore_forest: 'spore',
  // Ch.10 — the finale's two LANI maps split: tropical town vs. basalt flats
  lani_magma_flats: 'volcanic',
};

/** resolve a map's edge biome: explicit override → tile-skin default → temperate. */
function resolveEdgeBiome(id: string): EdgeBiome {
  if (MAP_BIOME[id]) return MAP_BIOME[id];
  if (AURORA_SKIN_MAPS.has(id)) return 'ice';
  if (MARS_SKIN_MAPS.has(id)) return 'mars';
  if (LANI_SKIN_MAPS.has(id)) return 'tropical'; // town default; flats overridden above
  if (CHINA_SKIN_MAPS.has(id)) return 'bamboo';
  if (ROMANIA_SKIN_MAPS.has(id)) return 'mountain_pine';
  if (MINIMUS_SKIN_MAPS.has(id)) return 'hedge';
  return 'temperate';
}

/** §A11 full-Gulliver: the Minimus NATIVES (citizens, props, facades) render at this scale on
 *  the Ch.5 maps so the colossi party visibly TOWERS over the tabletop duchy — the same idea as
 *  MINIMUS_TRAFFIC_SCALE for the dainty cars. The PARTY (player + followers) is NEVER scaled. */
const MINIMUS_NATIVE_SCALE = 0.5;
/** §A6 full-Gulliver — the GIANT half, the exact mirror of Minimus: the LILLEBY natives (its
 *  towering citizens, its giant furniture, and its colossal facades) render at this scale so the
 *  human-sized party visibly walks UNDER the doors and among the giants' feet — "everything here
 *  is normal-sized," says the Mayor. As with Minimus the PARTY (player + followers) is NEVER
 *  scaled; facade collision is rebuilt scale-true while props/NPCs keep the small native foot-box,
 *  so the party weaves between a giant's legs instead of being walled out by a colossal block. */
const LILLEBY_GIANT_MAPS: ReadonlySet<string> = new Set(['lilleby']);
const LILLEBY_GIANT_SCALE = 2.3;
/** the per-map NATIVE render scale for a settlement's own townsfolk / props / facades: Minimus
 *  SHRINKS its tabletop duchy, Lilleby SWELLS its giants, everywhere else stays 1:1. One source of
 *  truth so buildProps + buildNpcs (and the facade collision rebuild) all agree on the same factor.
 *  The FOOT re-anchor + collision math below is factor-agnostic — it serves shrink AND grow alike. */
function mapNativeScale(id: string): number {
  if (MINIMUS_SKIN_MAPS.has(id)) return MINIMUS_NATIVE_SCALE;
  if (LILLEBY_GIANT_MAPS.has(id)) return LILLEBY_GIANT_SCALE;
  return 1;
}
/** dog roamers author into a 16² frame (half a human's 24×32); render them a
 *  touch larger so a beagle reads as a real dog beside the cast, not a speck. */
const DOG_DISPLAY_SCALE = 1.5;
/** 8-way unit wander headings (diagonals normalized so they don't speed up,
 *  ADR-096) — module-scoped so an NPC's think-tick reuses it instead of
 *  re-allocating the array each time. */
const NPC_WANDER_DIRS: ReadonlyArray<readonly [number, number]> = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7],
];

/* ---- ADR-106: multi-enemy contact + the EB-style join window (all tunable) ---- */
/** the battle seats up to 5 (BattleScene letters A–E) — one source of truth */
const ENCOUNTER_CAP = MAX_BATTLE_ENEMIES;
/** roamers this close to the contact point are caught in the same pack at once (px) */
const PACK_RADIUS = s(30);
/** roamers within this ring (but outside the pack) may RUSH in during the swirl (px) */
const JOIN_ALERT_RADIUS = s(64);
/** a rushing roamer hops into the fight once it gets this close to the player (px) */
const JOIN_REACH = s(15);
/** px/s a roamer dashes the fight during the join window (dt-scaled, ADR-024) */
const JOIN_DASH = 165 * ART_SCALE;
/** swirl length: the standard snap, and the longer "1–2s" window when foes join */
const SWIRL_MS = 750;
const JOIN_WINDOW_MS = 1150;

/** S9 §A10 #2: Mr. Plummer's five doors — facade prop → letter flag + line.
 *  The quest data's objective flags and THIS table must agree; the validator
 *  cross-checks both against the §A10 manifest. */
const MAIL_DOORS: Record<string, { flag: string; dialogue: string }> = {
  house_chad: { flag: 'q_mail_pickles', dialogue: 'mail_pickles' },
  house_a: { flag: 'q_mail_sodd', dialogue: 'mail_sodd' },
  house_b: { flag: 'q_mail_birch', dialogue: 'mail_birch' },
  chapel: { flag: 'q_mail_chapel', dialogue: 'mail_chapel' },
  arcade: { flag: 'q_mail_arcade', dialogue: 'mail_arcade' },
};
const MAIL_FLAGS = Object.values(MAIL_DOORS).map((d) => d.flag);

export class OverworldScene extends Phaser.Scene {
  private mapDef!: MapDef;
  private solidTiles: boolean[][] = [];
  /** WORLD-OVERHAUL (Ch3+): the parallel per-tile LEVEL plane, built beside
   *  solidTiles in buildTiles. '0' = ground, '1'..'9' = stacked terraces. ALL-ZERO
   *  for every shipped (flat) map — none declares `elevation` — so the elevated
   *  render/collision branches (P2+) stay inert and every path is byte-identical. */
  private levelGrid: number[][] = [];
  /** the computed tile-index grid (parallel to solidTiles/levelGrid), retained so
   *  the elevation overlay can re-emit a terrace's face tiles as depth-sorted
   *  images. Rebuilt every buildTiles; empty until then. */
  /** the terrace the PLAYER stands on (0 = ground). Non-zero only on an elevated
   *  map; changes solely when the player steps onto a stairs ('T') tile. */
  private playerLevel = 0;
  /** WORLD-OVERHAUL: opt-in PARALLAX sky — a screen-fixed starfield behind the map that
   *  drifts at a fraction of the camera scroll, so an elevated map (the Otterbrooke
   *  plateau) reads as floating in night sky. Only the void margin shows it (the opaque
   *  tilemap covers the rest). null unless the map opts in (buildParallaxSky). */
  private parallaxSky?: Phaser.GameObjects.TileSprite;
  /** WORLD-OVERHAUL S5 fog atmosphere (opt-in, foggybottom): the pale level-scaled
   *  veil, its parked depth, and the terrace its density is currently tuned to (so the
   *  per-frame level check only re-tweens on an actual change). null / -1 unless the
   *  map declares atmosphere:'fog'. */
  private fogVeil: Phaser.GameObjects.Rectangle | null = null;
  private fogDepth = 0;
  private fogShownLevel = -1;
  /** highest terrace on the current map (0 = flat). */
  private maxLevel = 0;
  /** per-level depth lift (≈ one map-height of px) that sorts each terrace above
   *  the one below; 0 on flat maps, so player/overlay/veil depth is byte-identical. */
  private levelDepthBias = 0;
  private solids: Rect[] = [];
  /** ADR-051: texture-true entrance zones for facade props whose drawn sprite
   *  disagrees with the map data's placement `u` — checkDoors prefers these */
  private facadeDoorBox = new Map<PropDef, Rect>();
  /** dev-only collision visualiser (toggle via window.mfSolids) */
  private solidsOverlay?: Phaser.GameObjects.Graphics;
  /** dev-only: facades whose data solid drifted from the drawn texture */
  private facadeDrift: string[] = [];
  /** ms left before any door may fire again — set on every map arrival so a
   *  door can't instantly bounce you back the way you came (ADR-052 QOL) */
  private doorCooldown = 0;
  /** doors the player has STEPPED OFF since arriving. A door only fires once it's
   *  armed (left at least once), so a spawn that lands ON a door — even one the
   *  player can't immediately move off of — can't bounce them in/out forever. */
  private readonly doorsArmed = new Set<object>();
  private static DOOR_REENTRY_MS = 900;
  private player!: Phaser.GameObjects.Sprite;
  private facing: Facing = 'down';
  private followers: Array<{ spr: Phaser.GameObjects.Sprite; id: string; angel: boolean; flit: boolean }> = [];
  /** ADR-097: a pooled contact shadow per walking actor (grounding = 3D read) */
  private shadows: Phaser.GameObjects.Image[] = [];
  private trail: Array<{ x: number; y: number; f: Facing }> = [];
  private holdingDoorImg: Phaser.GameObjects.Image | null = null;
  /** S11b interior doors, keyed by their zone — swung open on entry */
  private doorImgs = new Map<DoorZone, Phaser.GameObjects.Image>();
  private npcs: NpcObj[] = [];
  private roamers: Roamer[] = [];
  private patrols: PatrolObj[] = [];
  // ADR-118 rework — Constable Borden's run-you-down state (he's an idle NpcObj,
  // so updateNpcs leaves his sprite to us). Reset on every scene (re)build.
  private bordenState: 'idle' | 'alert' | 'chase' = 'idle';
  private bordenAlertT = 0;
  private bordenBang: Phaser.GameObjects.BitmapText | null = null;
  private bordenEngaged = false;
  private dlg!: Dialogue;
  private cut = false; // cutscene lock
  private entryBlackout?: Phaser.GameObjects.Rectangle; // no world-flash before an entry cutscene
  private isNight = false; // set per-build; dialogueDay variants read it (S15c)
  // ADR-121: THE HUSH-DARK — the Titanic Tick (in the Heart Oak) drains the town's
  // Vibe after daybreak, so a cold diegetic "night" creeps over Otterbrook in the
  // daytime until the Tick dies. Rides the night overlay, but cold (sick) not warm.
  private hushDark = false;
  private transitioning = false;
  private battleCooldown = 0;
  private stepTimer = 0;
  private fireflies: Phaser.GameObjects.Image[] = [];
  private openingRequested = false;
  private devFullMapPreview = false;
  /** §A4: the overworld VITALS quick-glance (the EB "check HP fast" beat) —
   *  the same party strip the menu draws, popped on a button with no full menu */
  private vitalsGlance: VitalsBar | null = null;
  /** debounce so the opening tap can't immediately re-close (and vice versa) */
  private vitalsLockUntil = 0;
  /** S18 M26 (ADR-067): ambient road traffic — the living-world layer. The sim
   *  (engine/traffic) owns the WHERE + the SAFETY LAW (it never crushes or corner-
   *  traps the player); the scene pools + lerps the sprites between tile-hops.
   *  Built only for OUTDOOR settlement maps that actually have a road grid. */
  private traffic?: TrafficSim;
  private trafficSprites = new Map<number, Phaser.GameObjects.Sprite>();
  private trafficAccumMs = 0;
  private trafficRoadVeh: string[] = [];
  /** full-body collision rects (px) for the live cars — folded into collides()
   *  so a car is SOLID all the way around (ends + sides), tracking the lerped
   *  sprite. The sim's SAFETY LAW (never the player's cell / last lane) keeps any
   *  overlap transient: cars keep rolling, so you're never trapped. */
  private trafficRects: Rect[] = [];
  /** runtime sprite body size per vehicle texture (for the collision rect) */
  private trafficDims = new Map<string, { w: number; h: number }>();
  private static TRAFFIC_STEP_MS = 360; // ms per one-tile hop (lerped between)
  // ADR-097: oblique cars draw bigger native (~47×26, sized so the 24×32 cast
  // visibly fits), so the on-screen scale drops from 1.7 — a sedan still reads
  // as a real, person-dwarfing vehicle, just not a parade float.
  private static TRAFFIC_SCALE = 1.35;
  /** §A11 PKG-12 — the Grand Duchy of Minimus runs DAINTY traffic: a tabletop capital's
   *  cars read as little matchbox runabouts, not person-dwarfing sedans. Set per-map in
   *  buildTraffic; defaults to the standard scale everywhere else. */
  private static MINIMUS_TRAFFIC_SCALE = 0.5;
  /** §A6 — LILLEBY runs GIANT traffic: the colossi drive colossal trucks, so a car rumbling down
   *  the Great Way dwarfs even the giants on foot (the mirror of Minimus's matchbox runabouts). */
  private static LILLEBY_TRAFFIC_SCALE = 2.8;
  private trafficScale = OverworldScene.TRAFFIC_SCALE;

  constructor() {
    super('overworld');
  }

  init(data: { mapId?: string; x?: number; y?: number; facing?: Facing; opening?: boolean; devFullMap?: boolean }): void {
    const id = data.mapId ?? GS.data.map;
    this.mapDef = MAPS[id] ?? MAPS.otterbrook;
    this.openingRequested = data.opening === true;
    this.devFullMapPreview = data.devFullMap === true;
    GS.data.map = this.mapDef.id;
    if (data.x !== undefined) GS.data.x = data.x;
    if (data.y !== undefined) GS.data.y = data.y;
    if (data.facing) GS.data.facing = data.facing;
  }

  create(): void {
    this.cut = false;
    this.transitioning = false;
    this.followers = [];
    this.trail = [];
    this.npcs = [];
    this.roamers = [];
    this.patrols = [];
    this.solids = [];
    this.facadeDoorBox.clear();
    this.facadeDrift = [];
    this.solidsOverlay = undefined;
    this.fireflies = [];
    this.holdingDoorImg = null;
    this.insideTriggers.clear();
    this.dlg = new Dialogue(this);

    this.buildTiles();
    this.buildParallaxSky();
    this.buildElevationOverlay();
    this.buildProps();
    this.buildEdgeFeatures();
    this.buildNpcs();
    this.buildPlayer();
    this.buildRoamers();
    this.buildPatrols();
    this.buildTraffic();
    // dev-only collision visualiser: `mfSolids()` paints the solid + entrance
    // rects over the world (ADR-051 verification); inert in production builds
    if (import.meta.env.DEV) {
      (window as unknown as { mfSolids?: (on?: boolean) => string }).mfSolids = (on = true) => this.debugSolids(on);
      // WORLD-OVERHAUL dev warp: mfWarp('elev_spike') drops you on the ground below
      // the cliff (TILE coords, feet-origin). The elevation spike's only entrance.
      (window as unknown as { mfWarp?: (id: string, tx?: number, ty?: number) => void }).mfWarp = (
        id: string,
        tx = 11,
        ty = 14,
      ) => this.scene.restart({ mapId: id, x: (tx + 0.5) * TILE_PX, y: (ty + 1) * TILE_PX });
    }
    // ADR-052 QOL: on every arrival, lock doors briefly so the door you came
    // through can't instantly fire again (the hotel<->overworld ping-pong) and
    // the player gets a beat to catch their bearings before any door triggers.
    this.doorCooldown = OverworldScene.DOOR_REENTRY_MS;
    this.doorsArmed.clear(); // re-arm fresh: a door we spawned on must be left first
    // It is 2 AM until Glint's porch scene ends — dawn breaks after (§A6
    // Ch.1), and it breaks over the WHOLE Ch.1 outdoors: the hill shares the
    // story clock instead of carrying a permanent night flag (S9b — the
    // "why is it sometimes dark" fix). MapDef.night remains for places that
    // are genuinely always dark.
    const storyNight = !GS.flag('zapper_done') && CH1_STORY_NIGHT_MAPS.has(this.mapDef.id);
    // ADR-121: after the meteor night ends but before the Heart-Oak Tick is killed,
    // the Hush-dark blights Otterbrook in broad daylight. It reads as cold/sick
    // "night" (buildNight branches on this.hushDark), and the town stays locked
    // (bus dark, road fogged) until tick_defeated breaks it into real dawn.
    // ADR-131: it covers the SAME maps that were meteor-night (the Otterbrook +
    // Hickory Hill cluster), not just 'otterbrook' — gating on the town alone left
    // the lit hill abutting the blighted town, a day/night SEAM that read as a
    // colour bug (the very seam CH1_STORY_NIGHT_MAPS exists to prevent). The blight
    // is the whole drained area now, so there's no jarring hill→town colour jump.
    const hushDark = !!GS.flag('zapper_done') && !GS.flag('tick_defeated') && CH1_STORY_NIGHT_MAPS.has(this.mapDef.id);
    const night = this.mapDef.night === true || storyNight || hushDark;
    this.isNight = night; // S15c: NPC dialogueDay variants read this
    this.hushDark = hushDark;
    if (night) this.buildNight();
    this.buildFog(); // WORLD-OVERHAUL S5: opt-in level-scaled atmosphere veil (foggybottom); no-op unless atmosphere:'fog'
    if (!this.devFullMapPreview && this.opPhase() === 0) this.showBanner(night); // no map-name/"2 A.M." banner during the opening cinematic

    // 'starfall' runs UNBROKEN across every opening phase (playMusic is idempotent,
    // so the per-map restarts don't restart it); room music resumes at the wake.
    AUDIO.playMusic(this.opPhase() > 0 ? 'starfall' : this.mapDef.music);
    this.cameras.main.fadeIn(250, 0, 0, 0);

    // §A4: the VITALS quick-glance. The world pausing (battle / menu / shop)
    // hides it; a tap anywhere dismisses it (debounced so the opening tap
    // can't), and the START menu draws its OWN strip, so drop this one first.
    this.vitalsGlance = null;
    this.events.off(Phaser.Scenes.Events.PAUSE, this.hideVitals).on(Phaser.Scenes.Events.PAUSE, this.hideVitals);
    this.input.on('pointerdown', () => {
      if (this.vitalsGlance?.visible && this.time.now >= this.vitalsLockUntil) this.hideVitals();
    });

    // No world-flash before an entry cutscene: a black cover (oversized so it holds
    // at any zoom) until the opening phase about to run fades it out.
    this.entryBlackout = this.opPhase() > 0
      ? this.add
          .rectangle(-this.scale.width, -this.scale.height, this.scale.width * 3, this.scale.height * 3, 0x000000)
          .setOrigin(0).setScrollFactor(0).setDepth(80_000)
      : undefined;

    if (this.devFullMapPreview) this.frameDevFullMapPreview();
    void this.onEnterCutscenes();
  }

  private frameDevFullMapPreview(): void {
    if (!import.meta.env.DEV) return;
    const w = this.mapDef.grid[0]?.length ?? 0;
    const h = this.mapDef.grid.length;
    if (w === 0 || h === 0) return;
    const worldW = w * TILE_PX;
    const worldH = h * TILE_PX;
    const margin = s(16);
    const zoom = Math.min(this.scale.width / (worldW + margin * 2), this.scale.height / (worldH + margin * 2));
    const cam = this.cameras.main;
    cam.stopFollow();
    cam.setZoom(zoom);
    cam.centerOn(worldW / 2, worldH / 2);
    this.time.delayedCall(700, () => {
      this.game.renderer.snapshot((img) => {
        void fetch('http://localhost:5179/shot', {
          method: 'POST',
          body: JSON.stringify({ name: 'otterbrooke_full_map_ingame', dataUrl: (img as HTMLImageElement).src }),
        }).catch(() => undefined);
      });
    });
  }

  /** §A4: pop / drop the EB "check HP fast" glance — the SAME party strip the
   *  menu draws, from the overworld with no full menu. Bound to the free Y
   *  button (§B4 pad + keys; UIScene surfaces it on the touch thumb-arc). */
  private toggleVitals(): void {
    if (this.time.now < this.vitalsLockUntil) return;
    this.vitalsLockUntil = this.time.now + 250;
    if (this.vitalsGlance?.visible) {
      this.vitalsGlance.hide();
      AUDIO.sfx('cancel');
      return;
    }
    if (!this.vitalsGlance) this.vitalsGlance = makeVitalsBar(this);
    this.vitalsGlance.show();
    AUDIO.sfx('cursor');
  }

  /** dismiss the glance (B, a tap, or the world pausing under a sub-scene) */
  private hideVitals = (): void => {
    if (this.vitalsGlance?.visible) {
      this.vitalsGlance.hide();
      this.vitalsLockUntil = this.time.now + 250;
    }
  };

  /* ---------------- build ---------------- */

  private buildTiles(): void {
    // S2: the holding room un-walls itself once the quota is met (ADR-014);
    // the shared MapDef grid is never mutated — the carve is per-build.
    // S14: the pyramid chambers apply their LIVE rotation the same way —
    // (initial + mask presses) % 4 turns of the 7×7 rotor, per build.
    let rows =
      this.mapDef.id === 'dos_f3' && GS.flag('holding_open')
        ? carveHoldingRoom(this.mapDef.grid)
        : this.mapDef.grid;
    if (PYR_INITIAL_ROT[this.mapDef.id] !== undefined) {
      const presses = Number(GS.flag(`pyr_rot_${this.mapDef.id.slice(-1)}`)) || 0;
      const turns = (PYR_INITIAL_ROT[this.mapDef.id] + presses) % 4;
      rows = rotateRect(rows, PYR_ROTOR.x, PYR_ROTOR.y, PYR_ROTOR.size, turns);
    }
    const h = rows.length;
    const w = rows[0].length;
    const isPath = (x: number, y: number): boolean =>
      x >= 0 && y >= 0 && x < w && y < h && rows[y][x] === ':';
    const isRug = (x: number, y: number): boolean =>
      x >= 0 && y >= 0 && x < w && y < h && rows[y][x] === 'r';
    // WORLD-OVERHAUL (Ch3+): the HEDGE-WALL autotile — 'H' cells pick hedge_<mask> by
    // 4-neighbour connectivity (a lit rim faces every OPEN edge; seamless where hedges meet).
    const isHedge = (x: number, y: number): boolean =>
      x >= 0 && y >= 0 && x < w && y < h && rows[y][x] === 'H';
    const isBramble = (x: number, y: number): boolean =>
      x >= 0 && y >= 0 && x < w && y < h && rows[y][x] === 'V';
    // S7 (ADR-019): roads carve curbs into adjacent sidewalk, office walls
    // sprout fluorescent panels — render-time variants, deterministic, and
    // identical in solidity to their base tiles.
    const isRoad = (x: number, y: number): boolean =>
      x >= 0 && y >= 0 && x < w && y < h && 'RDX23P'.includes(rows[y][x]);
    // §A4.11 — the Sleeper's-shoulder meltwater fall: once Vibe Freeze locks it
    // (spine_meltfall_frozen), its foam-lip crossing ('E', x11-12) becomes a
    // WALKABLE ice bridge to the ear. Until then 'E' (sea_foam) stays solid.
    // Without this carve the gate is cosmetic-only (it sets the flag + hands over
    // the firecracker string but never opens the crossing) and the boss/ember are
    // unreachable on foot. The shared MapDef grid is untouched — carve per build.
    const meltCrossingOpen =
      this.mapDef.id === 'spine_shoulder' && GS.flag('spine_meltfall_frozen') === true;
    // PKG-12 §A11 — render the Ch.5 maps with the Minimus tile skin (cosmetic remap;
    // collision-preserving — see MINIMUS_TILE_SKIN). Other maps are untouched.
    const minimusSkin = MINIMUS_SKIN_MAPS.has(this.mapDef.id);
    const underoakSkin = UNDEROAK_SKIN_MAPS.has(this.mapDef.id);
    const otterbrookSkin = OTTERBROOK_SKIN_MAPS.has(this.mapDef.id);
    const norwaySkin = NORWAY_SKIN_MAPS.has(this.mapDef.id);
    const zanzibelSkin = ZANZIBEL_SKIN_MAPS.has(this.mapDef.id);
    const savannaSkin = SAVANNA_SKIN_MAPS.has(this.mapDef.id);
    const ruinsSkin = RUINS_SKIN_MAPS.has(this.mapDef.id);
    const chinaSkin = CHINA_SKIN_MAPS.has(this.mapDef.id);
    const romaniaSkin = ROMANIA_SKIN_MAPS.has(this.mapDef.id);
    const auroraSkin = AURORA_SKIN_MAPS.has(this.mapDef.id);
    const laniSkin = LANI_SKIN_MAPS.has(this.mapDef.id);
    const marsSkin = MARS_SKIN_MAPS.has(this.mapDef.id);
    const data: number[][] = [];
    this.solidTiles = [];
    for (let y = 0; y < h; y++) {
      const row: number[] = [];
      const srow: boolean[] = [];
      for (let x = 0; x < w; x++) {
        const ch = rows[y][x];
        let idx: number;
        if (ch === ':') {
          let mask = 0;
          if (!isPath(x, y - 1)) mask |= 1;
          if (!isPath(x + 1, y)) mask |= 2;
          if (!isPath(x, y + 1)) mask |= 4;
          if (!isPath(x - 1, y)) mask |= 8;
          idx = PATH_BASE + ((x + y) % PATH_VARIANTS) * 16 + mask;
        } else if (ch === 'r') {
          // rugs border their actual perimeter — one rug, not stamped cells
          let mask = 0;
          if (!isRug(x, y - 1)) mask |= 1;
          if (!isRug(x + 1, y)) mask |= 2;
          if (!isRug(x, y + 1)) mask |= 4;
          if (!isRug(x - 1, y)) mask |= 8;
          idx = RUG_BASE + mask;
        } else if (ch === 'H') {
          // hedge mask: a bit is SET where the neighbour is ALSO hedge (they merge, no
          // rim); CLEAR edges face open ground and carry the lit rim (tools/apply-hedge-kit).
          let mask = 0;
          if (isHedge(x, y - 1)) mask |= 1;
          if (isHedge(x + 1, y)) mask |= 2;
          if (isHedge(x, y + 1)) mask |= 4;
          if (isHedge(x - 1, y)) mask |= 8;
          idx = HEDGE_BASE + mask;
        } else if (ch === 'V') {
          // bramble mask (same contract as hedge): SET where the neighbour is bramble.
          let mask = 0;
          if (isBramble(x, y - 1)) mask |= 1;
          if (isBramble(x + 1, y)) mask |= 2;
          if (isBramble(x, y + 1)) mask |= 4;
          if (isBramble(x - 1, y)) mask |= 8;
          idx = BRAMBLE_BASE + mask;
        } else {
          let name = CHAR_LEGEND[ch] ?? 'grass_a';
          if (meltCrossingOpen && ch === 'E') {
            // §A4.11 — the frozen foam-lip crossing reads as a blue-white ice
            // bridge (mirrors the collision carve below; same cells, same flag)
            name = 'melt_ice';
          } else if (underoakSkin && UNDEROAK_TILE_SKIN[name]) {
            // ADR-121 rework — the Under-Oak's walls read as root-tangle, not
            // hillside rock. Same solidity as the cliff base; collision unchanged.
            name = UNDEROAK_TILE_SKIN[name];
          } else if (otterbrookSkin && OTTERBROOK_TILE_SKIN[name]) {
            // Otterbrooke hill woods: 'b'/bush → the authored dense tree canopy.
            name = OTTERBROOK_TILE_SKIN[name];
          } else if (minimusSkin && MINIMUS_TILE_SKIN[name]) {
            // PKG-12 §A11 — the Grand Duchy reskin (Ch.5 maps only): the shared grid
            // chars render as privet turf / hedge wall / cobble. The Minimus tile carries
            // the SAME solidity as the base it replaces, so collision below is unchanged.
            name = MINIMUS_TILE_SKIN[name];
          } else if (norwaySkin && NORWAY_TILE_SKIN[name]) {
            // Ch.4 — the Kvisthavn fjord reskin (Ch.4 outdoor maps only): pebbled snow /
            // cobbled quay-lane / rock cliff / fjord water. Same solidity as the base it
            // replaces, so collision below is unchanged.
            name = NORWAY_TILE_SKIN[name];
          } else if (zanzibelSkin && ZANZIBEL_TILE_SKIN[name]) {
            // Ch.6 — the Zanzibel spice-port reskin: ochre sand / sandstone flags / adobe
            // walls / teal harbor. Same solidity as the base, collision unchanged.
            name = ZANZIBEL_TILE_SKIN[name];
          } else if (savannaSkin && SAVANNA_TILE_SKIN[name]) {
            // Ch.6 — the Savanna Run reskin: sun-bleached grassland / cracked dust track.
            // Same solidity as the base, collision unchanged.
            name = SAVANNA_TILE_SKIN[name];
          } else if (ruinsSkin && RUINS_TILE_SKIN[name]) {
            // Ch.6 — the Laughing Ruins reskin: cracked dry earth / carved laughing-stone
            // walls. Same solidity as the base, collision unchanged.
            name = RUINS_TILE_SKIN[name];
          } else if (chinaSkin && CHINA_TILE_SKIN[name]) {
            // PKG-15 §1 — the Lotus Harbor reskin (Ch.8 maps only): the shared grid chars
            // render as jade river-dust ground / stone flagstone / temple masonry. Same
            // solidity as the base it replaces, so collision below is unchanged.
            name = CHINA_TILE_SKIN[name];
          } else if (romaniaSkin && ROMANIA_TILE_SKIN[name]) {
            // Ch.9 — the Valea Stelelor reskin (Ch.9 maps only): the shared grid chars render
            // as mountain-meadow grass / packed-dirt road / mossy castle stone. Same solidity
            // as the base it replaces, so collision below is unchanged.
            name = ROMANIA_TILE_SKIN[name];
          } else if (auroraSkin && AURORA_TILE_SKIN[name]) {
            // Ch.10 ALASKA — the Aurora reskin (Aurora maps only): snow-over-ice ground / plowed
            // snow lane / glacial ice-block wall. Same solidity as the base, collision unchanged.
            name = AURORA_TILE_SKIN[name];
          } else if (laniSkin && LANI_TILE_SKIN[name]) {
            // Ch.10 HAWAII — the Mauna Lani reskin (Lani maps only): black volcanic sand / pale
            // ash-gravel lane / basalt-magma wall. Same solidity as the base, collision unchanged.
            name = LANI_TILE_SKIN[name];
          } else if (marsSkin && MARS_TILE_SKIN[name]) {
            // Ch.10 MARS — the Sea of Silence reskin (finale map only): red regolith / compacted
            // dust track / Martian rock wall. Same solidity as the base, collision unchanged.
            name = MARS_TILE_SKIN[name];
          } else if (name === 'sidewalk') {
            if (isRoad(x, y + 1)) name = 'sidewalk_curb';
            else if (isRoad(x + 1, y)) name = 'sidewalk_curb_e';
            else if (isRoad(x - 1, y)) name = 'sidewalk_curb_w';
          } else if (name === 'office_wall' && x % 4 === 1) {
            name = 'office_wall_light';
          }
          idx = tileIndexByName(name);
        }
        row.push(idx);
        srow.push(meltCrossingOpen && ch === 'E' ? false : TILE_SOLID[idx]);
      }
      data.push(row);
      this.solidTiles.push(srow);
    }
    this.buildLevelGrid(h, w);
    // the 'tiles' texture is upscaled to TILE_PX-sized tiles at the boot seam,
    // so the map's tile size is TILE_PX (16 at ×1) — all tile↔px math uses it.
    const map = this.make.tilemap({ data, tileWidth: TILE_PX, tileHeight: TILE_PX });
    const tiles = map.addTilesetImage('tiles');
    if (tiles) map.createLayer(0, tiles, 0, 0)?.setDepth(0);
    // center maps smaller than the viewport (interiors float in the void)
    const vw = this.scale.width;
    const vh = this.scale.height;
    const mw = w * TILE_PX;
    const mh = h * TILE_PX;
    const bx = Math.min(0, (mw - vw) / 2);
    const by = Math.min(0, (mh - vh) / 2);
    if (this.mapDef.interior) {
      this.cameras.main.setBounds(bx, by, Math.max(mw, vw), Math.max(mh, vh));
    } else {
      // THE OUTDOOR EDGE RULE (see buildEdgeFeatures): paint the void in the BIOME's
      // color and widen the bounds a couple tiles past every edge, so the camera
      // reveals the border feature + a matching backdrop instead of bare ground
      // trailing into the black margin. Small maps (smaller than the viewport) showed
      // the void directly; large maps clamp to their edge — the buffer lets both show
      // a finished boundary (sand fading into sand, ice into ice, not forest-green).
      const M = s(40);
      this.cameras.main.setBounds(bx - M, by - M, Math.max(mw, vw) + 2 * M, Math.max(mh, vh) + 2 * M);
      // the elevated plateau floats in NIGHT SKY (the concept's void beyond the mesa); the
      // parallax starfield draws over this base. Other maps keep their biome void.
      this.cameras.main.setBackgroundColor(
        this.mapDef.id === 'otterbrook' ? 0x161233 : EDGE_BIOME[resolveEdgeBiome(this.mapDef.id)].voidColor,
      );
    }
  }

  /** WORLD-OVERHAUL P1 (opt-in elevation): build the parallel LEVEL plane beside
   *  solidTiles. Reads the map's optional `elevation.level` digit-rows ('0'/'.'/' '
   *  = ground, '1'..'9' = terraces); ABSENT ⇒ all-zero (flat), so every shipped map
   *  is untouched and the P2+ elevated branches never fire. W×H matches the render
   *  grid exactly (elevation.test.ts asserts the plane matches the grid's dims). */
  private buildLevelGrid(h: number, w: number): void {
    const plane = this.mapDef.elevation?.level;
    this.levelGrid = [];
    let maxLevel = 0;
    for (let y = 0; y < h; y++) {
      const src = plane ? plane[y] : undefined;
      const row: number[] = new Array(w);
      for (let x = 0; x < w; x++) {
        const ch = src ? src[x] : undefined;
        const lvl = ch && ch >= '1' && ch <= '9' ? ch.charCodeAt(0) - 48 : 0;
        row[x] = lvl;
        if (lvl > maxLevel) maxLevel = lvl;
      }
      this.levelGrid.push(row);
    }
    this.maxLevel = maxLevel;
    // one terrace of depth = a full map-height of px, so every level-N object
    // sorts cleanly above every level-(N-1) object (BIAS ≈ mapH·TILE_PX). 0 on a
    // flat map ⇒ playerLevel/maxLevel are 0 and every depth path is unchanged.
    this.levelDepthBias = maxLevel > 0 ? h * TILE_PX : 0;
  }

  /** the terrace level under a PIXEL position (0 = ground / off-map / flat map). */
  private levelAtPx(px: number, py: number): number {
    const tx = Math.floor(px / TILE_PX);
    const ty = Math.floor(py / TILE_PX);
    return this.levelGrid[ty]?.[tx] ?? 0;
  }

  /** the depth LIFT for a world object standing at a PIXEL position, keyed on its
   *  own terrace (0 on flat maps ⇒ every base-y depth sort is byte-identical).
   *  Elevated maps add level·BIAS so a prop/NPC/follower/vehicle on an upper terrace
   *  sorts WITH the player on that terrace — and stays BEHIND the cliff from a lower
   *  one (WO P2, review F1: without this ONLY the player + cliff were lifted, so a
   *  level-1 player wrongly drew in front of same-terrace props/followers). */
  private levelLift(px: number, py: number): number {
    return this.maxLevel > 0 ? this.levelAtPx(px, py) * this.levelDepthBias : 0;
  }

  /** WORLD-OVERHAUL P5 (per-mover terraces): a mover's terrace changes ONLY on a
   *  stairs ('T') tile — the same rule the player uses (update()). Flat maps
   *  (maxLevel 0) return the level unchanged, so every mover stays level 0 and the
   *  cross-level collision branch is inert ⇒ every flat map is byte-identical. */
  private levelAfterStep(cur: number, px: number, py: number): number {
    if (this.maxLevel <= 0) return cur;
    const tx = Math.floor(px / TILE_PX);
    const ty = Math.floor(py / TILE_PX);
    return this.mapDef.grid[ty]?.[tx] === 'T' ? (this.levelGrid[ty]?.[tx] ?? cur) : cur;
  }

  /** WORLD-OVERHAUL: build the opt-in PARALLAX starfield (Otterbrooke plateau). A
   *  deterministic star texture (scene backdrop, NOT a spritegen tile — spritegen stays
   *  frozen) tiled screen-fixed at depth −5, drifted in update() at a fraction of the
   *  camera scroll. Shows only through the void margin around the map, selling "the town
   *  sits on a high mesa in the night sky." No-op unless the map opts in. */
  private buildParallaxSky(): void {
    if (this.mapDef.id !== 'otterbrook') return;
    const key = 'ob_starfield';
    if (!this.textures.exists(key)) {
      const S = 256;
      const gfx = this.make.graphics({ x: 0, y: 0 }, false);
      let seed = 20260705; // fixed seed → identical starfield every boot (no Math.random)
      const rnd = (): number => {
        seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff;
        return seed / 0x7fffffff;
      };
      for (let i = 0; i < 110; i++) {
        const x = Math.floor(rnd() * S), y = Math.floor(rnd() * S);
        const big = rnd() < 0.14;
        gfx.fillStyle(big ? 0xfff4d0 : 0xdfe6ff, 0.35 + rnd() * 0.6);
        gfx.fillCircle(x, y, big ? 2 : 1);
      }
      gfx.generateTexture(key, S, S);
      gfx.destroy();
    }
    this.parallaxSky = this.add
      .tileSprite(0, 0, this.scale.width, this.scale.height, key)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-5);
  }

  /** WORLD-OVERHAUL P2/P4 (opt-in elevation): the WALK-BEHIND band. For a terraced
   *  map, re-emit each upper terrace's SOLID FRONT WALL ('K' cliff cells) as depth-
   *  sorted occluder images at each cell's OWN base-y, so a player on a LOWER level who
   *  walks up to the cliff passes BEHIND its face (Onett/Zelda), while a player who
   *  climbs the stair (playerLevel rises) emerges on top. The base tilemap already drew
   *  these cells flat at depth 0; this overlay is the occluder on top. P4 upgrades the
   *  single flat 'cliff_face' re-emit to the LAYERED CLIFF KIT — a per-K-run band
   *  (cliff_top / cliff_mid_a·b / cliff_base) so a tall face reads as layered rock. Only
   *  the SOLID face is re-emitted — the walkable '^' lip must NOT be (review F2: a lip
   *  overlay would occlude a same-level player standing on it). No-op on flat maps
   *  (maxLevel 0) — never emits, so every flat map is byte-identical. */
  private buildElevationOverlay(): void {
    if (this.maxLevel <= 0) return;
    const grid = this.mapDef.grid;
    // P4 LAYERED CLIFF KIT — pick the band tile by the cell's position in its vertical
    // K-run: the run's TOP row (nothing solid-cliff above) is the grassy overhang
    // (cliff_top), its BASE row (nothing K below) meets the ground (cliff_base), and every
    // row between is rock strata (cliff_mid_a/b, hashed per cell for organic, non-repeating
    // variety). Falls back to the flat 'cliff_face' look if the kit isn't installed (boot
    // fallback make()). The band is a TEXTURE choice only — see the depth note below.
    const iTop = tileIndexByName('cliff_top');
    const iMidA = tileIndexByName('cliff_mid_a');
    const iMidB = tileIndexByName('cliff_mid_b');
    const iBase = tileIndexByName('cliff_base');
    for (let y = 0; y < this.levelGrid.length; y++) {
      const row = this.levelGrid[y];
      for (let x = 0; x < row.length; x++) {
        if (row[x] <= 0) continue;
        if (grid[y]?.[x] !== 'K') continue; // only the SOLID cliff face is re-emitted (never the '^' lip — review F2)
        const topOfRun = grid[y - 1]?.[x] !== 'K'; // nothing solid-cliff above ⇒ grassy overhang band
        const baseOfRun = grid[y + 1]?.[x] !== 'K'; // nothing cliff below ⇒ meets the ground (scree band)
        // deterministic per-cell mid variety (no Math.random; int32-coerced hash)
        const midVary = (((x * 73856093) ^ (y * 19349663)) & 1) === 1;
        const frame = topOfRun ? iTop : baseOfRun ? iBase : midVary ? iMidB : iMidA;
        // DEPTH is the cell's OWN base-y (NOT level·BIAS), unchanged from P2: a LOWER-ground
        // character standing at the base (feet south of the face, so a higher base-y) sorts
        // IN FRONT and stays fully visible — the "stand in front of the cliff wall" read
        // (Onett). level·BIAS here drew the face over the character, swallowing their torso
        // ("blending into the cliff" — user report 2026-07-03). Banding is a pure texture
        // choice, ORTHOGONAL to depth: each row emits at its own (y+1)·TILE_PX, so a 3-row
        // face y-sorts as three stacked occluders with no manual delta. Player/movers keep
        // their own level lift.
        this.add
          .image(x * TILE_PX, y * TILE_PX, 'tiles', frame)
          .setOrigin(0, 0)
          .setDepth((y + 1) * TILE_PX);
      }
    }
  }

  /**
   * THE EDGE FEATURES (the "you never see the void" rule, ADR-132). Every OUTDOOR
   * map's edge is ringed with a BIOME-appropriate terrain feature just OUTSIDE the
   * playable grid, so a boundary reads as a wall of forest / ice / dune / bamboo /
   * basalt / red rock rather than bare ground trailing into the black margin — and
   * the ring doubles as free doodads so maps feel less sparse. The feature + the
   * out-of-bounds void color come from EDGE_BIOME[resolveEdgeBiome(id)]. Edges that
   * hold a TRANSITION (a door zone touching the boundary) are left OPEN, so an open
   * gap still means "you can leave here". Purely DECORATIVE: out-of-bounds tiles are
   * already impassable (the move check blocks tx/ty < 0 and >= size), so there are no
   * new solids and nothing the reachability validator sees. Features sit at a low
   * uniform depth — behind gameplay, above the ground — so the depth-800 night veil
   * tints them with everything else. Deterministic per map id: same map, same border.
   */
  private buildEdgeFeatures(): void {
    if (this.mapDef.interior) return; // rooms are walled; their void is intentional
    if (this.mapDef.id === 'otterbrook') return;
    const h = this.solidTiles.length;
    const w = h > 0 ? this.solidTiles[0].length : 0;
    if (w < 2 || h < 2) return;

    // deterministic LCG seeded off the map id — no Math.random, so a map renders
    // the same forest every time (frozen-map byte-identity, screenshot stability)
    let seed = 2166136261;
    for (let i = 0; i < this.mapDef.id.length; i++) {
      seed ^= this.mapDef.id.charCodeAt(i);
      seed = Math.imul(seed, 16777619);
    }
    const rnd = (): number => {
      seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
      return (seed >>> 0) / 0xffffffff;
    };

    // edge tiles that overlap a transition stay OPEN (the gap reads as a way out)
    const openTop = new Set<number>();
    const openBottom = new Set<number>();
    const openLeft = new Set<number>();
    const openRight = new Set<number>();
    const pad = 1; // widen the gap a touch so a doorway never feels walled-in
    for (const d of this.mapDef.doors ?? []) {
      if (!d.to) continue;
      if (d.y <= 1) for (let x = d.x - pad; x <= d.x + d.w + pad; x++) openTop.add(x);
      if (d.y + d.h >= h - 1) for (let x = d.x - pad; x <= d.x + d.w + pad; x++) openBottom.add(x);
      if (d.x <= 1) for (let y = d.y - pad; y <= d.y + d.h + pad; y++) openLeft.add(y);
      if (d.x + d.w >= w - 1) for (let y = d.y - pad; y <= d.y + d.h + pad; y++) openRight.add(y);
    }

    // pick the biome's edge feature: the bespoke AUTHORED keys once they ALL load,
    // else the existing-prop stand-ins (tinted) so every map looks right today and
    // auto-upgrades the moment the real PNG is wired into authored.ts.
    const biome = resolveEdgeBiome(this.mapDef.id);
    const def = EDGE_BIOME[biome];
    const useReal = def.keys.length > 0 && def.keys.every((k) => this.textures.exists(k));
    const KEYS = useReal ? def.keys : (def.fallback ?? def.keys);
    if (KEYS.length === 0) return; // the 'none' biome (e.g. inside the giant): no border
    const tint = useReal ? def.tint : def.fallbackTint;
    const mul = def.scaleMul ?? 1;
    const W = w * TILE_PX;
    const H = h * TILE_PX;
    const jit = (): number => (rnd() - 0.5) * s(10);
    const plant = (cx: number, cy: number): void => {
      const key = KEYS[Math.floor(rnd() * KEYS.length)];
      const variety = (0.85 + rnd() * 0.3) * mul; // size variety (× biome wall factor) so the line isn't a comb
      const img = this.add
        .image(cx, cy, key)
        .setOrigin(0.5, 1)
        .setDepth(1); // behind gameplay, above ground; under the depth-800 night veil
      // sized props (trees, hedges, the new edge_* art) carry display dims; legacy
      // props (palms, baobab) go through THE WORLD RESIZE RULE like buildProps does.
      const sz = AUTHORED_WORLD_PROP_DISPLAY_SIZE[key as AuthoredWorldPropKey];
      if (sz) img.setDisplaySize(s(sz.w) * variety, s(sz.h) * variety);
      else img.setScale(worldSpriteScale(key, img.width, img.height) * variety);
      if (tint !== undefined) img.setTint(tint);
    };

    // top + bottom rows — canopy fills the margin above / below the grid
    for (let x = 0; x < w; x++) {
      const cx = x * TILE_PX + TILE_PX / 2 + jit();
      if (!openTop.has(x)) plant(cx, s(2) + jit()); // base on the top edge, canopy up
      if (!openBottom.has(x)) plant(cx, H + s(20) + jit()); // base just below, canopy over the seam
    }
    // left + right columns — canopy fills the side margins
    for (let y = 0; y < h; y++) {
      const cy = y * TILE_PX + TILE_PX + jit();
      if (!openLeft.has(y)) plant(-s(10) + jit(), cy);
      if (!openRight.has(y)) plant(W + s(10) + jit(), cy);
    }
  }

  private buildProps(): void {
    for (const p of this.mapDef.props) {
      if (p.ifFlag && !GS.flag(p.ifFlag)) continue;
      if (p.unlessFlag && GS.flag(p.unlessFlag)) continue; // S9: clues retire
      if (p.sprite === 'holding_door') {
        this.buildHoldingDoor(p);
        continue;
      }
      // S14: a pressed room's mask hums (texture pick is scene-interpreted)
      const sprite =
        p.sprite === 'mask_switch' && (Number(GS.flag(`pyr_rot_${this.mapDef.id.slice(-1)}`)) || 0) > 0
          ? 'mask_switch_lit'
          : p.sprite;
      const img = this.add.image(p.x * TILE_PX, p.y * TILE_PX, sprite).setOrigin(0, 0);
      if (AUTHORED_VEHICLE_PROP_KEYS.has(sprite)) img.setFrame(0);
      const displaySize = AUTHORED_WORLD_PROP_DISPLAY_SIZE[sprite as AuthoredWorldPropKey];
      // §A11 full-Gulliver: shrink Minimus-NATIVE objects so the colossi party TOWERS over the
      // tabletop duchy — props/curios AND now the facades themselves (a building is part of the
      // tiny duchy too). Cars are excluded (already dainty via MINIMUS_TRAFFIC_SCALE). A facade's
      // ADR-051 collision/door is texture-coupled, so the shrink + foot re-anchor here is mirrored
      // (scale-aware) into facadeSolids/facadeDoorBox below so collision stays the building drawn.
      const isFacadeSprite = sprite.startsWith('bldg_') || LANDMARK_FACADE_SPRITES.has(sprite);
      // §A11 full-Gulliver, BOTH halves: Minimus shrinks its duchy, Lilleby swells its giants.
      // mapNativeScale is 0.5 / LILLEBY_GIANT_SCALE / 1 per map; cars are excluded (they carry
      // their own per-map trafficScale). The SAME foot-re-anchor + collision rebuild below serves
      // shrink AND grow — the foot stays planted while the body scales up or down around it.
      const nativeScale = mapNativeScale(this.mapDef.id);
      const scalesNatives = nativeScale !== 1 && !AUTHORED_VEHICLE_PROP_KEYS.has(sprite);
      const nativeFacade = scalesNatives && isFacadeSprite; // a building of the duchy / a colossus of the giants' town
      const nativeProp = scalesNatives && !isFacadeSprite; // a prop/curio of that town
      const native = nativeProp || nativeFacade;
      const nps = native ? nativeScale : 1;
      // Sized props carry NATIVE map dims → scale at read. Everything else goes
      // through THE WORLD RESIZE RULE (worldSpriteScale): facades land at their
      // footprint and legacy ×1 art is lifted to runtime res, so homes/props are
      // no longer ~ART_SCALE× too small on the 1600×900 framebuffer.
      if (displaySize) {
        img.setDisplaySize(s(displaySize.w) * nps, s(displaySize.h) * nps);
      } else {
        let sc = worldSpriteScale(sprite, img.width, img.height);
        if (native) sc *= nativeScale;
        if (sc !== 1) img.setScale(sc);
      }
      // origin is top-left, so a re-scaled native object is re-planted by its FOOT + x-centre
      // (works for a shrunk duchy prop AND a swollen giant alike — nps is the map's native factor)
      if (native) {
        const sw = img.displayWidth, sh = img.displayHeight;
        img.x = p.x * TILE_PX + (sw / nps - sw) / 2;
        img.y = p.y * TILE_PX + (sh / nps - sh);
      }
      // per-instance SIZE (PropDef.scale) — TOP-LEFT anchored: the building grows down/right from its
      // lot corner (p.x*TILE, p.y*TILE), matching the editor's WYSIWYG box exactly. A single number
      // scales uniformly; {x,y} scales width/height independently (only-wider / only-taller). Composes
      // with the map native scale above; the facade collision + door box below multiply by the SAME
      // per-axis factors so ADR-051 stays coupled (collision is rebuilt from the scaled img).
      const rawSc = p.scale;
      const propSX = typeof rawSc === 'number' ? rawSc : rawSc && rawSc.x > 0 ? rawSc.x : 1;
      const propSY = typeof rawSc === 'number' ? rawSc : rawSc && rawSc.y > 0 ? rawSc.y : 1;
      if (propSX !== 1 || propSY !== 1) img.setDisplaySize(img.displayWidth * propSX, img.displayHeight * propSY);
      const rot = p.rot ?? 0; // 90/180/270 CW — applied to non-facade props (visual + data solid) below
      img.setDepth(img.y + img.displayHeight + this.levelLift(img.x, img.y));
      // OBLIQUE-FACADE GROUNDING (Otterbrooke): the 3/4 buildings sit on a flat ground, so
      // a soft contact shadow at the base plants them (mirrors ADR-097's actor shadows). Drawn
      // just UNDER the building + offset toward the light-away side (light from upper-left).
      if (this.mapDef.id === 'otterbrook' && isFacadeSprite) {
        const shW = img.displayWidth * 0.7;
        this.add
          .image(img.x + img.displayWidth / 2, img.y + img.displayHeight - s(9), 'mob_shadow')
          .setOrigin(0.5, 0.55)
          .setDisplaySize(shW, shW * 0.15) // a low, feathered pool tucked UNDER the foot (not a slab beside it)
          .setAlpha(0.2)
          .setDepth(img.y + img.displayHeight - s(15) + this.levelLift(img.x, img.y));
      }
      // PHASE 2 (oblique overhaul): the re-authored 3/4 props sit on flat ground, so — like the
      // facades above and the ADR-097 actor shadows — plant each with a soft contact-shadow pool
      // tucked UNDER its foot and nudged toward the light-away (lower-right) side. OUTDOOR maps
      // only (interiors have their own floor); allow-listed to props already redrawn oblique so
      // an un-restyled flat prop never gets a mismatched shadow.
      if (!this.mapDef.interior && OBLIQUE_SHADOW_PROP_KEYS.has(sprite)) {
        const shW = img.displayWidth * 0.66;
        this.add
          .image(img.x + img.displayWidth / 2 + s(1), img.y + img.displayHeight - s(2), 'mob_shadow')
          .setOrigin(0.5, 0.55)
          .setDisplaySize(shW, Math.max(s(3), shW * 0.22)) // a low feathered pool, not a slab beside it
          .setAlpha(0.24)
          .setDepth(img.y + img.displayHeight - s(3) + this.levelLift(img.x, img.y));
      }
      if (sprite.startsWith('bldg_') || LANDMARK_FACADE_SPRITES.has(sprite)) {
        // ADR-051 — A FACADE COLLIDES AS ITS REAL DRAWN FOOTPRINT. The map data
        // places a facade at a story count `u`; the forge/grown grammar often
        // picks a `u` that disagrees with the sprite actually drawn, so the data
        // solid was far too SHORT and the building's lower body had no collision
        // (the user's "walk straight through"). We rebuild the solid(s) from the
        // LOADED texture every time: the full drawn footprint MINUS the doorway
        // you walk into — so collision is exactly what's on screen, on every
        // shipped / grown / generated map, and you can't pass through a wall to
        // reach a door. The entrance zone is derived the same way (facadeDoorBox).
        // ADR-099: the hand-placed LANDMARK drawHouse props (the golf clubhouse,
        // gatehouse, mansions) join the bldg_* facades here — the tall clubhouse_grand
        // had a 30px data solid under a much taller sprite, so its lower body was
        // walk-through and its doorstep sat too deep; the texture rebuild fixes both.
        // §A11 full-Gulliver: a NATIVE Minimus facade was scaled + foot-re-anchored above, so
        // rebuild its collision from the SHRUNK, re-anchored rect (img.x/img.y + displayW/H) with
        // the native eave/door constants scaled by the same factor — footprint = building drawn.
        const nf = nativeFacade ? nativeScale : 1;
        const fSX = nf * propSX, fSY = nf * propSY; // per-axis facade scale (width vs height)
        for (const sr of this.facadeSolids(p, img.x, img.y, img.displayWidth, img.displayHeight, fSX, fSY))
          this.solids.push(sr);
        if (p.door) {
          // img.* are runtime (placed) px; door.ox/w/h are NATIVE data → s() × the facade scale.
          // The entrance zone uses the SAME widened opening as facadeSolids (MIN_DOOR_GAP) so the
          // door the player can step through and the door that fires are one and the same. Horizontal
          // door metrics scale by fSX, vertical (height, foot offset) by fSY.
          const natW = s(p.door.w) * fSX;
          const gap = Math.max(natW, s(OverworldScene.MIN_DOOR_GAP));
          const cx = img.x + s(p.door.ox) * fSX + natW / 2;
          this.facadeDoorBox.set(p, {
            x: cx - gap / 2,
            y: img.y + img.displayHeight - s(14) * fSY,
            w: gap,
            h: s(p.door.h) * fSY,
          });
        }
        if (!nativeFacade) this.auditFacade(p, sprite, img.displayHeight);
      } else if (p.solid) {
        // solid.* are NATIVE map data → scale at the read site. A rotated prop rotates its solid too,
        // about its footprint (fw×fh = the UPRIGHT display size — the visual is rotated below to match).
        // per-instance PropDef.scale grows the solid from the SAME top-left corner as the visual (ADR-051
        // parity with facades): offsets + size scale per-axis so a resized prop collides as what's drawn.
        const fw = img.displayWidth, fh = img.displayHeight;
        let rx = s(p.solid.ox) * propSX, ry = s(p.solid.oy) * propSY, rw = s(p.solid.w) * propSX, rh = s(p.solid.h) * propSY;
        if (rot === 90) [rx, ry, rw, rh] = [fh - ry - rh, rx, rh, rw];
        else if (rot === 180) [rx, ry] = [fw - rx - rw, fh - ry - rh];
        else if (rot === 270) [rx, ry, rw, rh] = [ry, fw - rx - rw, rh, rw];
        this.solids.push({ x: img.x + rx, y: img.y + ry, w: rw, h: rh });
      }
      // orient the sprite (90° steps, non-facades only): rotate about the footprint CENTRE, keeping the
      // rotated bounding box's top-left at the prop's lot corner (img.x,img.y) — matches the editor + the
      // rotated solid above. Depth re-derived from the rotated foot.
      if (rot && !isFacadeSprite) {
        const fw = img.displayWidth, fh = img.displayHeight;
        const bw = rot === 90 || rot === 270 ? fh : fw;
        const bh = rot === 90 || rot === 270 ? fw : fh;
        const ax = img.x, ay = img.y;
        img.setOrigin(0.5, 0.5).setPosition(ax + bw / 2, ay + bh / 2).setAngle(rot);
        img.setDepth(ay + bh + this.levelLift(ax, ay));
      }
    }
    if (this.facadeDrift.length && import.meta.env.DEV) {
      console.warn(`[collision] ${this.facadeDrift.length} facade(s) re-fitted to texture on '${this.mapDef.id}':`, this.facadeDrift.slice(0, 8));
    }
    this.buildDoorMarkers();
  }

  /* ---------------- the PRODUCTIVITY LOCK (S2, ADR-014) ---------------- */

  /** the three floor-3 countFlags, in pip order */
  private quotaFlags(): string[] {
    return (MAPS.dos_f3.patrols ?? [])
      .map((p) => p.countFlag)
      .filter((f): f is string => f !== undefined);
  }

  private quotaCount(): number {
    return this.quotaFlags().filter((f) => GS.flag(f)).length;
  }

  /**
   * The holding door is a scene-interpreted prop: sealed it shows one lit pip
   * per counted patrol; open, the door is gone (the wall is carved) and only
   * the quota panel stays behind, mounted beside the gap.
   */
  private buildHoldingDoor(p: PropDef): void {
    if (GS.flag('holding_open')) {
      const panel = this.add
        .image(p.x * TILE_PX - s(26), p.y * TILE_PX + s(14), 'quota_panel')
        .setOrigin(0, 0)
        .setDepth(p.y * TILE_PX + s(20));
      const psc = worldSpriteScale('quota_panel', panel.width, panel.height);
      if (psc !== 1) panel.setScale(psc);
      return;
    }
    const lit = this.quotaCount();
    const doorKey = lit > 0 ? `holding_door_${lit}` : 'holding_door';
    const img = this.add.image(p.x * TILE_PX, p.y * TILE_PX, doorKey).setOrigin(0, 0);
    const dsc = worldSpriteScale(doorKey, img.width, img.height);
    if (dsc !== 1) img.setScale(dsc);
    img.setDepth(p.y * TILE_PX + img.displayHeight);
    this.holdingDoorImg = img;
    if (p.solid) {
      this.solids.push({
        x: p.x * TILE_PX + s(p.solid.ox),
        y: p.y * TILE_PX + s(p.solid.oy),
        w: s(p.solid.w),
        h: s(p.solid.h),
      });
    }
  }

  /** every walkable door gets a visible marker (mat / stairs / elevator /
   *  a real swinging DOOR — S11b) */
  /**
   * A facade's collision = its REAL drawn footprint, MINUS the doorway you step
   * into (ADR-051). Width + height come from the LOADED texture, so collision is
   * EXACTLY the building on screen no matter what story count the map data placed
   * it at (the walk-through fix). A DOORLESS facade is ONE solid block from the
   * eaves (CAP px below the roofline — you can brush them) down to the foot: no
   * walk-under strip. A DOORED facade is left-wall + right-wall + a lintel over
   * the door, leaving ONLY the door column open so you can walk in (the entrance
   * zone admits you there) while the rest of the wall is solid to the ground.
   */
  private static FACADE_CAP = 10; // walkable roof-eave margin at the very top
  private static DOOR_OPENING = 18; // the doorway height left open to walk into
  // §A11: a Minimus facade shrinks to 0.5×, which would leave a ~32px doorway — narrower than the
  // ~40px player box (tryMove s(10)). Keep the OPENING at least this wide (native px → s(12)=48px)
  // so a duchy door the player can step through stays passable (the Big-Little gate admits them).
  private static MIN_DOOR_GAP = 12;
  private facadeSolids(p: PropDef, leftPx: number, topPx: number, wPx: number, hPx: number, sx = 1, sy = sx): Rect[] {
    // leftPx/topPx = the facade's DRAWN top-left; wPx/hPx = its DRAWN size (already non-uniformly
    // scaled by the caller). The native FACADE_CAP/DOOR_OPENING and p.door.* are × the facade scale
    // (1, MINIMUS_NATIVE_SCALE, or a per-instance PropDef.scale) so the footprint stays texture-true
    // to the building on screen — horizontal metrics use sx, vertical ones sy.
    const left = leftPx;
    const top = topPx + s(OverworldScene.FACADE_CAP) * sy;
    const right = leftPx + wPx;
    const foot = topPx + hPx;
    if (!p.door) return [{ x: left, y: top, w: wPx, h: foot - top }];
    // The opening is widened to MIN_DOOR_GAP (≥ the player box) centred on the DRAWN door, so a
    // shrunk duchy doorway stays passable; full-scale doors keep s(door.w) (max(64,48)=64, no-op).
    const natW = s(p.door.w) * sx;
    const cx = left + s(p.door.ox) * sx + natW / 2;
    const gap = Math.max(natW, s(OverworldScene.MIN_DOOR_GAP));
    const dL = cx - gap / 2;
    const dR = cx + gap / 2;
    const doorTop = foot - s(OverworldScene.DOOR_OPENING) * sy;
    const out: Rect[] = [];
    if (dL > left) out.push({ x: left, y: top, w: dL - left, h: foot - top }); // wall left of the door
    if (right > dR) out.push({ x: dR, y: top, w: right - dR, h: foot - top }); // wall right of the door
    if (doorTop > top) out.push({ x: dL, y: top, w: gap, h: doorTop - top }); // lintel over the door
    return out;
  }

  /** dev-only: record facades whose DATA solid was SHORTER than the real texture
   *  body (the placement `u` drifted from the sprite — the walk-through cases) */
  private auditFacade(p: PropDef, sprite: string, hPx: number): void {
    if (!import.meta.env.DEV || !p.solid) return;
    // hPx is runtime (displayed) px; p.solid.h is NATIVE data → scale to compare
    if (s(p.solid.h) < hPx - s(26)) {
      this.facadeDrift.push(`${sprite}@(${p.x},${p.y}) data h=${p.solid.h} < body ${hPx - s(22)}`);
    }
  }

  /**
   * Dev collision visualiser (window.mfSolids(true|false)): paints every solid
   * rect + each facade entrance zone over the world so collision can be eyeballed
   * against the sprites. World-space, so it tracks the camera. Production-inert
   * (only wired under import.meta.env.DEV).
   */
  private debugSolids(on = true): string {
    this.solidsOverlay?.destroy();
    this.solidsOverlay = undefined;
    if (!on) return 'collision overlay OFF';
    const g = this.add.graphics().setDepth(99998);
    g.fillStyle(0xff3048, 0.3).lineStyle(1, 0xff5068, 0.95);
    for (const s of this.solids) {
      g.fillRect(s.x, s.y, s.w, s.h);
      g.strokeRect(s.x, s.y, s.w, s.h);
    }
    g.fillStyle(0x40e0ff, 0.45);
    for (const r of this.facadeDoorBox.values()) g.fillRect(r.x, r.y, r.w, r.h);
    this.solidsOverlay = g;
    return `collision overlay ON — ${this.solids.length} solids, ${this.facadeDoorBox.size} entrances`;
  }

  private buildDoorMarkers(): void {
    this.doorImgs.clear();
    // Door / mat / stairs indicator art is legacy ×1 (~20px); lift it to runtime
    // res like every other prop, or it renders ART_SCALE× too small (the doors,
    // mats and steps all looked tiny against the ×4 world).
    const lift = (im: Phaser.GameObjects.Image): Phaser.GameObjects.Image => {
      const displaySize = AUTHORED_WORLD_PROP_DISPLAY_SIZE[im.texture.key as AuthoredWorldPropKey];
      if (displaySize) return im.setDisplaySize(s(displaySize.w), s(displaySize.h));
      const sc = worldSpriteScale(im.texture.key, im.width, im.height);
      return sc !== 1 ? im.setScale(sc) : im;
    };
    for (const d of this.mapDef.doors) {
      const kind = d.indicator ?? (this.mapDef.interior ? 'mat' : 'none');
      if (kind === 'none') continue;
      const cx = (d.x + d.w / 2) * TILE_PX;
      const by = (d.y + d.h) * TILE_PX;
      if (kind === 'elevator') {
        // doors drawn on the wall above the zone; walk into them to ride
        lift(this.add.image(cx, d.y * TILE_PX + s(2), 'elevator').setOrigin(0.5, 1).setDepth(3));
        continue;
      }
      if (kind === 'door') {
        // S11b: a doorway through a wall is a DOOR, not a mat (user law) —
        // mounted IN the wall band above the zone, swinging open on entry;
        // the S11 mat stays at its foot
        const img = lift(this.add.image(cx, d.y * TILE_PX, 'door_int').setOrigin(0.5, 1).setDepth(3));
        this.doorImgs.set(d, img);
        lift(this.add.image(cx, d.y * TILE_PX, 'doormat').setOrigin(0.5, 0).setDepth(2));
        continue;
      }
      if (kind === 'mat' && d.facing === 'up') {
        // a door THROUGH the north wall: the mat lies at the doorway's foot,
        // flush against the wall base — never floating mid-floor (S11 catch:
        // the rex_hall mats hovered two tiles into the room)
        lift(this.add.image(cx, d.y * TILE_PX, 'doormat').setOrigin(0.5, 0).setDepth(2));
        continue;
      }
      lift(
        this.add
          .image(cx, kind === 'stairs' ? by + s(2) : by - s(1), kind === 'stairs' ? 'stairs' : 'doormat')
          .setOrigin(0.5, 1)
          .setDepth(2),
      ); // floor decal, characters walk over it
    }
    // building entrances: a mat on the doorstep (at the texture-true zone if the
    // facade was re-fitted to its real sprite — ADR-051)
    for (const p of this.mapDef.props) {
      if (!p.door) continue;
      const box = this.facadeDoorBox.get(p);
      // prefer the texture-true entrance zone (it tracks a re-fitted / shrunk facade's doorstep);
      // fall back to the NATIVE door rect (→ s()) only when no box was built for this facade
      const cx = box ? box.x + box.w / 2 : p.x * TILE_PX + s(p.door.ox) + s(p.door.w) / 2;
      const by = box ? box.y + box.h : p.y * TILE_PX + s(p.door.oy) + s(p.door.h);
      lift(this.add.image(cx, by + s(4), 'doormat').setOrigin(0.5, 1).setDepth(2));
    }
  }

  private buildNpcs(): void {
    for (const def of this.mapDef.npcs) {
      if (def.ifFlag && !GS.flag(def.ifFlag)) continue;
      if (def.unlessFlag && GS.flag(def.unlessFlag)) continue;
      const x = def.x * TILE_PX + TILE_PX / 2;
      const y = def.y * TILE_PX + s(22);
      // dogs: frames [0,1]=eastbound, [2,3]=westbound (S7c sheet contract)
      const spr = this.add.sprite(x, y, def.sprite, def.dog ? (def.facing === 'left' ? 2 : 0) : standFrame(def.facing));
      spr.setOrigin(0.5, 1);
      // dogs author into a 16² native frame — half a human's 24×32 — so at 1:1
      // a beagle reads as a distant speck beside the cast. Lift it so it sits at
      // a believable dog scale next to the kids (origin is feet, so it stays planted).
      if (def.dog) spr.setScale(DOG_DISPLAY_SCALE);
      // §A11 full-Gulliver — a town's NATIVES scale to its native factor so the party reads at the
      // right size beside them: Minimus's duchy shrinks, Lilleby's giants tower (heroes unscaled).
      else {
        const nsc = mapNativeScale(this.mapDef.id);
        if (nsc !== 1) spr.setScale(nsc);
      }
      // per-instance SIZE (NpcDef.scale, set from the map editor) — a giant or tiny townsperson.
      // Composes on top of the dog/native base scale above; origin is the FEET, so it stays planted.
      const rawNsc = def.scale;
      const nscX = typeof rawNsc === 'number' ? rawNsc : rawNsc && rawNsc.x > 0 ? rawNsc.x : 1;
      const nscY = typeof rawNsc === 'number' ? rawNsc : rawNsc && rawNsc.y > 0 ? rawNsc.y : 1;
      if (nscX !== 1 || nscY !== 1) spr.setScale(spr.scaleX * nscX, spr.scaleY * nscY);
      spr.setDepth(y + this.levelLift(spr.x, y));
      // ADR-124 — FREE-ROAMING TOWNSFOLK: NPCs wander a small radius by default;
      // only clerks (a `shop`), explicitly pinned NPCs (wander:false / stationary),
      // dogs, and INDOOR NPCs (shops/clinics/hotels/homes) hold position.
      const wanders =
        def.wander === true ||
        (def.wander !== false && !def.shop && !def.stationary && !def.dog && !this.mapDef.interior);
      this.npcs.push({ spr, def, baseX: x, baseY: y, vx: 0, vy: 0, think: Math.random() * 2000, wanders, level: this.levelAtPx(x, y) });
      // a wanderer is non-blocking (no stale "ghost" solid left where it spawned);
      // a pinned NPC keeps its small collision box — EXCEPT in a §A6 GIANT town, where the tiny
      // party must weave freely among the colossi. A giant's foot-box (or a giant prop beside it)
      // would otherwise wall the tiny player in → soft-lock. NPCs stay proximity-interactable
      // (talkTo probes the sprite, not a solid), so making them passable costs nothing.
      if (!wanders && !LILLEBY_GIANT_MAPS.has(this.mapDef.id))
        this.solids.push({ x: x - s(6) * nscX, y: y - s(10) * nscY, w: s(12) * nscX, h: s(10) * nscY });
    }
  }

  private buildPlayer(): void {
    this.facing = GS.data.facing;
    // ADR-102 spawn safety-net: a door/restart can land the player on a solid
    // tile (a mis-aimed tx,ty, or a §A6 rotor wall in its static state). Nudge to
    // the nearest walkable tile FIRST, so a screen transition can never soft-lock.
    this.clampSpawnToWalkable();
    this.player = this.add.sprite(GS.data.x, GS.data.y, 'rex', standFrame(this.facing));
    this.player.setOrigin(0.5, 1);
    // S15c: depth was only assigned in update(), which the cut lock skips —
    // a map entered INTO a cutscene (the 6:15) left the hero at depth 0,
    // so the seat back swallowed his head. Y-sort from frame one.
    // WORLD-OVERHAUL P2: seed the player's terrace from the spawn tile (doors set
    // it directly in P3); flat maps read 0, so depth is exactly this.player.y.
    this.playerLevel = this.levelAtPx(this.player.x, this.player.y);
    this.player.setDepth(this.player.y + this.playerLevel * this.levelDepthBias);
    this.cameras.main.startFollow(this.player, true, 0.18, 0.18);
    this.buildFollowers();
  }

  /**
   * Spawn safety-net (ADR-102). Doors land the player at an authored pixel
   * (tx,ty); if that tile is solid — a mis-aimed landing, or a §A6 rotor chamber
   * whose return-door sits on a wall until the floor turns — ring-search outward
   * for the nearest tile that is BOTH grid-walkable and clear of prop/facade
   * solids, and stand there instead. A correct landing is a no-op; this only ever
   * rescues a would-be stuck spawn, so a screen switch can never trap the player.
   */
  private clampSpawnToWalkable(): void {
    const h = this.solidTiles.length;
    const w = h > 0 ? this.solidTiles[0].length : 0;
    if (w === 0 || h === 0) return;
    // Does the player's BODY BOX fit with feet at (fx,fy)? (the same box tryMove uses.)
    // A single-TILE test missed a landing on a walkable tile whose body box still pokes
    // into an ADJACENT solid — the top row of a 2-tall door mouth, where the box reaches
    // up into the border corner (the Aurora ice-field entry soft-lock). Tiles + prop
    // solids only — no npc/traffic deps, since this runs before they go live.
    const fits = (fx: number, fy: number): boolean => {
      const bx = fx - s(5), by = fy - s(9), bw = s(10), bh = s(9);
      const tx0 = Math.floor(bx / TILE_PX), ty0 = Math.floor(by / TILE_PX);
      const tx1 = Math.floor((bx + bw) / TILE_PX), ty1 = Math.floor((by + bh) / TILE_PX);
      for (let ty = ty0; ty <= ty1; ty++) {
        for (let tx = tx0; tx <= tx1; tx++) {
          if (ty < 0 || tx < 0 || ty >= h || tx >= w || this.solidTiles[ty][tx]) return false;
        }
      }
      for (const rect of this.solids) {
        if (bx < rect.x + rect.w && bx + bw > rect.x && by < rect.y + rect.h && by + bh > rect.y) return false;
      }
      return true;
    };
    // the EXACT landing the door aimed at — if the whole body fits, nothing to do
    if (fits(GS.data.x, GS.data.y)) return;
    const col = Math.floor(GS.data.x / TILE_PX);
    const row = Math.floor(GS.data.y / TILE_PX);
    // expanding rings: nearest tile whose BODY BOX is clear wins (Chebyshev shells, Euclid tiebreak)
    for (let r = 1; r <= 12; r++) {
      let best: { x: number; y: number; d: number } | null = null;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; // ring perimeter only
          const cx = col + dx;
          const cy = row + dy;
          const fx = cx * TILE_PX + TILE_PX / 2;
          const fy = cy * TILE_PX + s(12);
          if (!fits(fx, fy)) continue;
          const d = dx * dx + dy * dy;
          if (!best || d < best.d) best = { x: fx, y: fy, d };
        }
      }
      if (best) {
        if (import.meta.env.DEV) {
          console.warn(
            `[spawn] ${this.mapDef.id}: (${col},${row}) body-blocked — nudged to (${Math.floor(best.x / TILE_PX)},${Math.floor(best.y / TILE_PX)})`,
          );
        }
        GS.data.x = best.x;
        GS.data.y = best.y;
        return;
      }
    }
  }

  /** the conga line: every party member behind the leader (Prompt 5), down
   *  heroes as floating haloed angels (§A4.7), then any guest at the back */
  private buildFollowers(): void {
    // §A4.7 + 2026-07-02 user rule: the LIVING walk the conga first, in party
    // order; the FALLEN drift at the BACK as haloed angels (party order among
    // themselves) until the hospital brings them home to their slot.
    const rest = GS.data.party.slice(1);
    for (const h of rest.filter((h) => !h.down)) this.addFollower(h.id, false);
    for (const h of rest.filter((h) => h.down)) this.addFollower(h.id, true);
    if (GS.data.guest === 'chad') this.addFollower('chad');
    // ADR-121: between the crater repel and the porch zapper, the dimmed Glint
    // flits home at the back of the party. Re-added on every leg of the walk so
    // his authored star-icon survives the door transitions down the hill; the
    // window closes itself the instant the zapper sets zapper_done.
    if (GS.flag('sentinel_repelled') && !GS.flag('zapper_hit')) this.addFollower('glint', false, true);
  }

  private rebuildFollowers(): void {
    this.followers.forEach((f) => f.spr.destroy());
    this.followers = [];
    this.buildFollowers();
  }

  private addFollower(id: string, angel = false, flit = false): void {
    // S7c: a fallen hero mourns as THEMSELF — angel_<id> when the variant
    // exists, the plain guest angel otherwise (visual only, §A4.7)
    const angelKey = this.textures.exists(`angel_${id}`) ? `angel_${id}` : 'angel';
    // ADR-121: a FLIT follower (Glint) keeps his OWN texture and hovers via his
    // flit cycle — he never borrows the angel sheet and never walks the conga.
    const spr = this.add.sprite(this.player.x, this.player.y + s(2), flit ? id : angel ? angelKey : id, 0);
    spr.setOrigin(0.5, 1);
    if (angel) spr.play(`${angelKey}-float`);
    else if (flit) spr.play(`${id}-flit`);
    else spr.setFrame(standFrame('down'));
    this.followers.push({ spr, id, angel, flit });
  }

  private removeFollower(id: string): void {
    const i = this.followers.findIndex((f) => f.id === id);
    if (i >= 0) {
      this.followers[i].spr.destroy();
      this.followers.splice(i, 1);
    }
  }

  private buildRoamers(): void {
    // suppress overworld enemies during ANY opening-cinematic phase (the maps it
    // stages on aren't all flag-gated for enemies before the meteor "falls").
    if (this.opPhase() > 0) return;
    for (const sp of this.mapDef.spawners) {
      if (sp.ifFlag && !GS.flag(sp.ifFlag)) continue;
      if (sp.unlessFlag && GS.flag(sp.unlessFlag)) continue; // S9: guards stand down
      for (let i = 0; i < sp.count; i++) {
        const enemyId = sp.enemies[Math.floor(Math.random() * sp.enemies.length)];
        const def = ENEMIES[enemyId];
        const x = (sp.rect.x + Math.random() * sp.rect.w) * TILE_PX;
        const y = (sp.rect.y + Math.random() * sp.rect.h) * TILE_PX;
        const texture = def.overworld ?? def.walker ?? def.mini;
        const frame = def.overworld ? enemyOverworldFrame('down') : def.walker ? standFrame('down') : 0;
        const spr = this.add.sprite(x, y, texture, frame);
        spr.setOrigin(0.5, 1);
        spr.setDepth(y + this.levelLift(spr.x, y));
        this.roamers.push({
          spr,
          enemyId,
          walker: def.walker,
          overworld: def.overworld,
          facing: 'down',
          vx: 0,
          vy: 0,
          think: 0,
          home: { x: sp.rect.x * TILE_PX, y: sp.rect.y * TILE_PX, w: sp.rect.w * TILE_PX, h: sp.rect.h * TILE_PX },
          dead: false,
          level: this.levelAtPx(x, y),
        });
      }
    }
  }

  private buildPatrols(): void {
    for (const def of this.mapDef.patrols ?? []) {
      // a counted patrol stays down for good — its quota was met (S2)
      if (def.countFlag && GS.flag(def.countFlag)) continue;
      const enemy = ENEMIES[def.enemy];
      const walker = enemy.walker ?? 'smiler';
      const overworld = enemy.overworld;
      const [tx, ty] = def.route[0];
      const spr = this.add.sprite(tx * TILE_PX + TILE_PX / 2, ty * TILE_PX + s(22), overworld ?? walker, overworld ? enemyOverworldFrame('down') : standFrame('down'));
      spr.setOrigin(0.5, 1);
      spr.setDepth(spr.y + this.levelLift(spr.x, spr.y));
      this.patrols.push({
        spr,
        def,
        walker,
        overworld,
        wp: def.route.length > 1 ? 1 : 0,
        state: 'patrol',
        alertT: 0,
        lose: 0,
        facing: 'down',
        dead: false,
        bang: null,
        level: this.levelAtPx(spr.x, spr.y),
      });
    }
  }

  private buildNight(): void {
    // overscanRect: the tint must outsize the viewport or scroll rounding leaves
    // screen row 0 day-lit (the "one line at the top", S15c). Oversized by a full
    // screen on every side so it ALSO covers when a cutscene zooms OUT (a
    // scrollFactor-0 rect shrinks with zoom; at zoom <1 a screen-sized one leaves
    // bright borders — the "darkness not covering" bug).
    const r = overscanRect(this.scale.width, this.scale.height);
    // the MULTIPLY veil must sit ABOVE every world object so they ALL darken.
    // Props/buildings/NPCs depth-sort by their base-y (buildProps), which on a tall
    // map runs well past any fixed value — a constant 800 left everything below
    // ~row 12 lit at night (the "not all images adhere to night mode" bug). Park it
    // just past the tallest possible world depth (map height + a sprite's worth of
    // margin); the fireflies then lift above it to still shine on top.
    const nightDepth = this.solidTiles.length * TILE_PX + this.maxLevel * this.levelDepthBias + s(300);
    // ADR-121: the Hush-dark is a COLDER, shallower veil than 2 AM — a wrong, sick
    // daylight rather than true night (so it still reads as "daytime, but the warmth
    // got eaten"), with cold flickering streetlights instead of warm fireflies.
    const veilColor = this.hushDark ? px(RAMP.CYAN, 1) : px(RAMP.NIGHT, 1);
    const veilAlpha = this.hushDark ? 0.5 : 0.62;
    const o = this.add
      .rectangle(r.x - this.scale.width, r.y - this.scale.height, r.w + this.scale.width * 2, r.h + this.scale.height * 2, colorOf(veilColor))
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(nightDepth)
      .setAlpha(veilAlpha);
    o.setBlendMode(Phaser.BlendModes.MULTIPLY);
    // (The warm per-doorstep "porch light" glow pools were removed at the user's
    // request — they read as unnecessary spotlights over the doors. The night
    // tint above and the fireflies below are the remaining 2AM ambiance.)
    const flickerColor = this.hushDark ? px(RAMP.CYAN, 3) : px(RAMP.GOLD, 3);
    for (let i = 0; i < 9; i++) {
      const f = this.add
        .image(Math.random() * this.scale.width, Math.random() * this.scale.height, 'pixel')
        .setScrollFactor(0)
        .setDepth(nightDepth + 10)
        .setTint(colorOf(flickerColor))
        .setAlpha(0);
      this.tweens.add({
        targets: f,
        alpha: { from: 0, to: 0.9 },
        duration: 900 + Math.random() * 900,
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 2000,
      });
      this.fireflies.push(f);
    }
  }

  /** WORLD-OVERHAUL S5 — the opt-in FOG atmosphere (foggybottom's signature). A pale,
   *  cold grey-blue veil (a scrollFactor-0 overscan rect, the buildNight machinery) whose
   *  density is keyed to the PLAYER's terrace: a thin haze high on the rim, a thick soup
   *  down on the quay — "the fog ceiling that sinks with you." NORMAL alpha blend (not the
   *  night MULTIPLY): it lightens + desaturates toward grey, reading as damp haze rather
   *  than darkness. Parked JUST BELOW the night veil's depth so a (rare) night+fog map
   *  still darkens on top; future landmark HALO props draw at fogDepth+delta so their glow
   *  reads THROUGH the veil (the firefly precedent). No-op unless atmosphere:'fog', so every
   *  other map is byte-identical. */
  private buildFog(): void {
    if (this.mapDef.atmosphere !== 'fog') return;
    const r = overscanRect(this.scale.width, this.scale.height);
    // just under nightDepth (which is +s(300)) so night's MULTIPLY sits above fog if both run
    this.fogDepth = this.solidTiles.length * TILE_PX + this.maxLevel * this.levelDepthBias + s(280);
    const veil = this.add
      .rectangle(
        r.x - this.scale.width,
        r.y - this.scale.height,
        r.w + this.scale.width * 2,
        r.h + this.scale.height * 2,
        0xaeb9c4, // cool slate-grey — Northumbrian machine-fog (tuned live: reads as haze, not a dead filter)
      )
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(this.fogDepth)
      .setAlpha(this.fogAlphaForLevel(this.playerLevel));
    this.fogVeil = veil;
    this.fogShownLevel = this.playerLevel;
  }

  /** the veil's target alpha for a terrace: thinnest at the top level, thickest at the
   *  ground (0). Linear in (maxLevel − level) so each stair DOWN visibly thickens the fog. */
  private fogAlphaForLevel(level: number): number {
    if (this.maxLevel <= 0) return 0.34;
    return 0.14 + (this.maxLevel - level) * (0.48 / this.maxLevel); // rim ~0.14 (thin veil) → quay ~0.62 (soup)
  }

  /** re-tune the fog density when the player changes terrace (called each frame from the
   *  'T'-tile transition; only actually tweens on a real level change). */
  private updateFogForLevel(): void {
    if (!this.fogVeil || this.playerLevel === this.fogShownLevel) return;
    this.fogShownLevel = this.playerLevel;
    this.tweens.add({
      targets: this.fogVeil,
      alpha: this.fogAlphaForLevel(this.playerLevel),
      duration: 450,
      ease: 'Sine.easeInOut',
    });
  }

  private showBanner(night = false): void {
    // banner names are all-caps; resolved {rex} et al. get uppercased to match
    const name = vars(this.mapDef.name).toUpperCase();
    // (ADR-092 decorative GLYPH banner removed at the user's request — the entry
    // card shows just the place name, plus the time tag at night.)
    // retro glyph advance is 6px native; window pad/size are layout px → s()
    const w = Math.max(name.length * s(6) + s(24), night ? s(76) : 0);
    const h = night ? s(36) : s(24);
    const win = makeWindow(this, s(8), s(8), w, h);
    const tx = this.add
      .bitmapText(s(20), s(16), 'retro', name, s(6))
      .setScrollFactor(0)
      .setDepth(DEPTH_UI + 1);
    const fading: Phaser.GameObjects.GameObject[] = [win, tx];
    if (night) {
      // S9b: the dark overlay gets a label — no guessing what the haze means
      const tag = this.add
        .bitmapText(s(20), s(27), 'retro', '2 A.M.', s(6))
        .setScrollFactor(0)
        .setDepth(DEPTH_UI + 1)
        .setTint(colorOf(px(RAMP.CYAN, 2)));
      fading.push(tag);
    }
    this.tweens.add({
      targets: fading,
      alpha: 0,
      delay: 1500,
      duration: 400,
      onComplete: () => fading.forEach((o) => o.destroy()),
    });
  }

  /* ---------------- update loop ---------------- */

  override update(_t: number, dtMs: number): void {
    // §A4: the vitals glance yields to ANY dialogue (item flavor, NPC, sign) —
    // both live at the bottom, so never let them overlap
    if (this.vitalsGlance?.visible && this.dlg.busy) this.hideVitals();
    const dt = Math.min(dtMs, 50) / 1000;
    if (this.parallaxSky) {
      // drift the starfield at a fraction of the camera scroll → depth parallax
      const cam = this.cameras.main;
      this.parallaxSky.tilePositionX = cam.scrollX * 0.35;
      this.parallaxSky.tilePositionY = cam.scrollY * 0.35;
    }
    if (this.doorCooldown > 0) this.doorCooldown = Math.max(0, this.doorCooldown - dtMs);
    if (!this.cut && !this.dlg.busy && !this.transitioning) {
      this.updatePlayer(dt);
      this.updateRoamers(dt);
      if (!this.cut && !this.transitioning) this.updatePatrols(dt);
      // a contact battle may have started this frame — don't double-fire
      if (!this.cut && !this.transitioning) {
        void this.checkDoors();
        if (!this.cut && !this.transitioning) {
          this.checkTriggers();
          // the A that confirmed a menu row this same frame must not also
          // probe the world (Dialogue.justReleased — the S6 notebook-ask fix)
          const released = this.dlg.justReleased(this.time.now);
          if (INPUT.justPressed('A') && !released) void this.interact();
          if (INPUT.justPressed('START') && !released) this.pauseMenu();
          // §A4: the VITALS quick-glance — Y toggles it; B dismisses it
          if (INPUT.justPressed('Y')) this.toggleVitals();
          else if (this.vitalsGlance?.visible && INPUT.justPressed('B')) this.hideVitals();
        }
      }
    } else {
      this.player.anims.stop();
    }
    this.updateNpcs(dt);
    this.bordenChase(dt);
    this.updateFireflies(dt);
    if (!this.transitioning) this.updateTraffic(dtMs);
    this.updateShadows();
  }

  /** ADR-097 — the contact-shadow pass: a soft oval under every WALKING actor,
   *  at the feet, just beneath its owner's depth. Floating actors (angels) and
   *  vehicles (their shadow is baked into the sprite) are skipped. The pool
   *  grows to fit and hides the surplus, so it costs nothing when the map empties. */
  private updateShadows(): void {
    // Drive the shadow pool DIRECTLY from the live actor lists — the old version
    // built a fresh `actors` array plus one object literal per actor EVERY frame,
    // so the per-frame garbage grew with the roamer count and the minor-GC churn
    // it caused read as micro-stutter in enemy-dense areas. This allocates nothing
    // per frame. (actor footprint widths are native px → s(); the 0.42 is a
    // height:width RATIO, the 3px floor is native → s(3).)
    const wHero = s(14);
    const wDog = s(10);
    const wMini = s(12);
    const lift = s(1);
    const floor = s(3);
    let i = 0;
    const place = (x: number, y: number, w: number): void => {
      let sh = this.shadows[i];
      if (!sh) {
        sh = this.add.image(0, 0, 'mob_shadow').setOrigin(0.5, 0.5).setAlpha(0.3);
        this.shadows.push(sh);
      }
      sh.setVisible(true).setPosition(x, y - lift).setDepth(y - 1).setDisplaySize(w, Math.max(floor, Math.round(w * 0.42)));
      i++;
    };
    place(this.player.x, this.player.y, wHero);
    for (const f of this.followers) if (!f.angel && !f.flit) place(f.spr.x, f.spr.y, wHero);
    for (const n of this.npcs) place(n.spr.x, n.spr.y, n.def.dog ? wDog : wHero);
    for (const r of this.roamers) if (!r.dead) place(r.spr.x, r.spr.y, r.walker ? wHero : wMini);
    for (const p of this.patrols) if (!p.dead) place(p.spr.x, p.spr.y, wHero);
    for (; i < this.shadows.length; i++) this.shadows[i].setVisible(false);
  }

  /* ---------------- S18 M26 (ADR-067): ambient road traffic ---------------- */

  /** stable 32-bit hash of a map id → a per-map traffic seed (determinism) */
  private hashId(s: string): number {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  /** stand up the traffic sim for outdoor settlement maps that have real roads */
  private buildTraffic(): void {
    this.traffic = undefined;
    this.trafficSprites.forEach((s) => s.destroy());
    this.trafficSprites.clear();
    this.trafficRects = [];
    this.trafficAccumMs = 0;
    // §A11 PKG-12 — Minimus runs dainty matchbox traffic (the miniature duchy); §A6 Lilleby runs
    // GIANT traffic (the colossi's trucks); everywhere else is the standard person-dwarfing sedan.
    this.trafficScale = MINIMUS_SKIN_MAPS.has(this.mapDef.id)
      ? OverworldScene.MINIMUS_TRAFFIC_SCALE
      : LILLEBY_GIANT_MAPS.has(this.mapDef.id)
        ? OverworldScene.LILLEBY_TRAFFIC_SCALE
        : OverworldScene.TRAFFIC_SCALE;
    if (this.mapDef.interior || !this.mapDef.settlement) return;
    // collect the drivable cells (road / dashed centerline / crosswalk)
    const grid = this.mapDef.grid;
    const roads = new Set<string>();
    for (let y = 0; y < grid.length; y++) {
      const row = grid[y];
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === 'R' || ch === 'D' || ch === 'X') roads.add(cellKey(x, y));
      }
    }
    // A SOLID PROP standing on a road cell (a payphone, ATM, bollard…) is invisible to the
    // sim — it reads only grid road-chars — so cars would drive straight THROUGH it. Carve each
    // solid prop's footprint out of the drivable set; TrafficSim simply routes around the hole
    // (chooseMove tries straight→turn→U-turn). Facades line the verges, not the lanes, and own
    // texture-rebuilt collision, so skip them. Native tile math (16px), matching the grid.
    for (const p of this.mapDef.props) {
      if (!p.solid || p.sprite.startsWith('bldg_') || LANDMARK_FACADE_SPRITES.has(p.sprite)) continue;
      const x0 = Math.floor((p.x * 16 + p.solid.ox) / 16);
      const x1 = Math.floor((p.x * 16 + p.solid.ox + p.solid.w - 1) / 16);
      const y0 = Math.floor((p.y * 16 + p.solid.oy) / 16);
      const y1 = Math.floor((p.y * 16 + p.solid.oy + p.solid.h - 1) / 16);
      for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) roads.delete(cellKey(xx, yy));
    }
    if (roads.size < 12) return; // a path-only town (Otterbrook) gets no cars
    // Civilian road fleet from authored PNGs only: the sim type is the texture key.
    if (this.trafficRoadVeh.length === 0) {
      for (const v of TRAFFIC_AUTHORED_VEHICLES) {
        if (!AUTHORED_VEHICLE_PROP_KEYS.has(v.id)) continue;
        const spec = VEHICLE_SPECS[v.vehicleType];
        if (!spec || spec.terrain !== 'road' || spec.hardened) continue;
        this.trafficRoadVeh.push(v.id);
        // VEHICLE_SPECS body size is NATIVE → store RUNTIME px (the rect later
        // multiplies by TRAFFIC_SCALE to match on-screen display size).
        this.trafficDims.set(v.id, { w: s(spec.w), h: s(spec.h) });
      }
    }
    if (this.trafficRoadVeh.length === 0) return;
    const max = Math.max(3, Math.min(16, Math.floor(roads.size / 40)));
    const seed = this.hashId(this.mapDef.id) ^ 0x7a5f;
    this.traffic = new TrafficSim({ roads, seed, max, types: this.trafficRoadVeh });
    this.traffic.spawn();
    for (const v of this.traffic.vehicles) this.spawnTrafficSprite(v);
  }

  private spawnTrafficSprite(v: { id: number; type: string; x: number; y: number }): Phaser.GameObjects.Sprite {
    const tex = this.textures.exists(v.type) ? v.type : this.trafficRoadVeh[0];
    const dim = this.trafficDims.get(tex) ?? { w: s(32), h: s(18) };
    const spr = this.add.sprite(v.x * TILE_PX + TILE_PX / 2, v.y * TILE_PX + TILE_PX / 2, tex, 0).setOrigin(0.5, 0.6);
    spr.setDisplaySize(dim.w * this.trafficScale, dim.h * this.trafficScale);
    spr.setDepth(v.y * TILE_PX + TILE_PX / 2 + this.levelLift(spr.x, spr.y));
    this.trafficSprites.set(v.id, spr);
    return spr;
  }

  /** advance the sim on a fixed step and lerp the pooled sprites between hops */
  private updateTraffic(dtMs: number): void {
    const sim = this.traffic;
    if (!sim) return;
    const step = OverworldScene.TRAFFIC_STEP_MS;
    this.trafficAccumMs += dtMs;
    if (this.trafficAccumMs >= step) {
      this.trafficAccumMs -= step;
      if (this.trafficAccumMs >= step) this.trafficAccumMs = 0; // never spiral after a stall
      const pcell = { x: Math.floor(this.player.x / TILE_PX), y: Math.floor(this.player.y / TILE_PX) };
      sim.step(pcell);
    }
    const f = Math.min(1, this.trafficAccumMs / step);
    const cam = this.cameras.main;
    const m = s(64); // off-screen cull margin (px)
    const S = this.trafficScale;
    this.trafficRects = [];
    for (const v of sim.vehicles) {
      let spr = this.trafficSprites.get(v.id);
      if (!spr) spr = this.spawnTrafficSprite(v);
      const ix = v.px + (v.x - v.px) * f;
      const iy = v.py + (v.y - v.py) * f;
      const cx = ix * TILE_PX + TILE_PX / 2;
      const cy = iy * TILE_PX + TILE_PX / 2;
      spr.x = cx;
      spr.y = cy;
      spr.setDepth(cy + s(8));
      // Authored vehicle sheets are four motion frames. Traffic still orients the
      // side art by direction: dir 0=E, 1=S, 2=W, 3=N.
      const vertical = v.dir === 1 || v.dir === 3;
      const dim = this.trafficDims.get(v.type) ?? { w: s(32), h: s(18) };
      // setFrame is cheap (the texture KEY never changes, so it skips the per-call
      // texture-manager lookup setTexture does); the on-screen size is fixed per vehicle
      // at spawn. ADR-097: a DIRECTIONAL sheet is 3 frames [side, front, back] and traffic
      // SWAPS the frame by travel direction (no skew). A legacy sheet is 4 motion frames of
      // the side view, oriented by mirror (East) + rotate (the vertical lanes — which skews
      // a 3/4 sprite; the directional sheet is the real fix).
      if (DIRECTIONAL_VEHICLE_KEYS.has(v.type)) {
        // dir 0=E, 1=S, 2=W, 3=N → side(0) for E/W, front(1) driving down, back(2) driving up
        spr.setFrame(v.dir === 1 ? 1 : v.dir === 3 ? 2 : 0);
        spr.setAngle(0);
        spr.setFlipX(v.dir === 0); // E mirrors the front-left side art to front-right
      } else {
        spr.setFrame(Math.floor((this.time.now / 130 + v.id) % 4));
        spr.setAngle(v.dir === 1 ? -90 : v.dir === 3 ? 90 : 0); // S → front down, N → front up
        spr.setFlipX(v.dir === 0); // E → mirror the left-facing art to face right
      }
      // SOLID body rect (px) covering the WHOLE car — ends and sides — sized to
      // the sprite and oriented to travel, inset 4px so brushing past isn't sticky
      // dim is RUNTIME px; dim*S matches the on-screen sprite. The 4px brush-past
      // inset is native.
      const longPx = dim.w * S;
      const widePx = dim.h * S;
      const rw = (vertical ? widePx : longPx) - s(4);
      const rh = (vertical ? longPx : widePx) - s(4);
      this.trafficRects.push({ x: cx - rw / 2, y: cy - rh / 2, w: rw, h: rh });
      const on =
        cx >= cam.scrollX - m &&
        cx <= cam.scrollX + cam.width + m &&
        cy >= cam.scrollY - m &&
        cy <= cam.scrollY + cam.height + m;
      spr.setVisible(on);
    }
  }

  private updatePlayer(dt: number): void {
    const d = INPUT.dir();
    const running = INPUT.held('B');
    const sp = running ? RUN : WALK;
    let moved = false;
    if (d.x !== 0 || d.y !== 0) {
      const len = Math.hypot(d.x, d.y);
      const dx = (d.x / len) * sp * dt;
      const dy = (d.y / len) * sp * dt;
      const nx = this.tryMove(this.player.x, this.player.y, dx, 0);
      const ny = this.tryMove(nx, this.player.y, 0, dy, true);
      moved = nx !== this.player.x || ny !== this.player.y;
      this.player.x = nx;
      this.player.y = ny;
      // ADR-096: keep the true 8-way facing (diagonals included) instead of
      // collapsing it to left/right — the diagonal sheet now has the art.
      this.facing = facingFromVec(d.x, d.y);
      GS.data.x = this.player.x;
      GS.data.y = this.player.y;
      GS.data.facing = this.facing;
    }
    if (moved) {
      // S9b: running is its own cycle (both step poses, no neutral frame) —
      // the gait changes, not just the tempo
      const anim = `rex-${running ? 'run' : 'walk'}-${this.facing}`;
      if (this.player.anims.currentAnim?.key !== anim || !this.player.anims.isPlaying) {
        this.player.anims.play(anim, true);
      }
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        AUDIO.sfx('step');
        this.stepTimer = running ? 0.18 : 0.28;
        // running kicks up dust at the heels (S7 juice, Prompt 39) — d is a unit
        // direction, so d.x*4 is a 4px heel offset; the -2 lifts to the foot
        if (running) this.dustPuff(this.player.x - d.x * s(4), this.player.y - s(2));
      }
      // breadcrumb trail for the conga line. A FINE trail (one crumb every s(1) of
      // travel, 3× denser than before) lets each follower's eased target advance ~a
      // few px per frame instead of jumping a full s(3) every 3rd frame — so the eased
      // motion comes out UNIFORM (was a [7,5,2]px pulse). Cap scales 3× to match.
      const last = this.trail[0];
      if (!last || Math.hypot(this.player.x - last.x, this.player.y - last.y) >= s(1)) {
        this.trail.unshift({ x: this.player.x, y: this.player.y, f: this.facing });
        if (this.trail.length > 240) this.trail.pop();
      }
    } else {
      // ADR-101: idle LIFE — the down-facing rest pose breathes and blinks
      // (frames 44/45). Other facings have no idle art, so they hold the
      // standing frame as before.
      const idle = `rex-idle-${this.facing}`;
      if (this.facing === 'down' && this.anims.exists(idle)) {
        if (this.player.anims.currentAnim?.key !== idle || !this.player.anims.isPlaying) {
          this.player.anims.play(idle, true);
        }
      } else {
        this.player.anims.stop();
        this.player.setFrame(standFrame(this.facing));
      }
    }
    // WORLD-OVERHAUL P2: the player's terrace changes ONLY on a stairs ('T') tile,
    // whose level cell carries the terrace being stepped onto. Flat maps have an
    // all-zero levelGrid and no 'T', so playerLevel stays 0 and depth is unchanged.
    if (this.maxLevel > 0) {
      const ftx = Math.floor(this.player.x / TILE_PX);
      const fty = Math.floor(this.player.y / TILE_PX);
      if (this.mapDef.grid[fty]?.[ftx] === 'T') this.playerLevel = this.levelGrid[fty][ftx];
      this.updateFogForLevel(); // S5: thicken/thin the fog veil as the terrace changes
    }
    this.player.setDepth(this.player.y + this.playerLevel * this.levelDepthBias);
    this.followers.forEach((f, i) => {
      const crumb = this.trail[(i + 1) * 27]; // 27 crumbs back at s(1) spacing = the same (i+1)*108px conga gap as the old *9 at s(3)
      if (!crumb) return;
      if (f.angel) {
        // angels float instead of walk (Prompt 5 / §A4.7) — 4px lift, 1.5px bob
        f.spr.x = crumb.x;
        f.spr.y = crumb.y - s(4) + Math.sin(this.time.now / 280 + i * 2) * s(1.5);
        f.spr.setDepth(crumb.y + this.levelLift(crumb.x, crumb.y));
        return;
      }
      if (f.flit) {
        // ADR-121: Glint is a mote of light — he HOVERS the conga home, a higher
        // lift and quicker bob than a mourning angel, his flit cycle always running.
        f.spr.x = crumb.x;
        f.spr.y = crumb.y - s(10) + Math.sin(this.time.now / 220 + i * 2) * s(2);
        f.spr.setDepth(crumb.y + this.levelLift(crumb.x, crumb.y));
        return;
      }
      // ADR-024: EASE toward the crumb each frame instead of HARD-SNAPPING. The trail
      // drops a crumb only every s(3) of travel, so snapping teleported the conga ~12px
      // in jerky hops (the "followers stutter, not smooth like Jay" report). A big gap
      // (a teleport / a fresh map) still snaps so no one slides across the screen.
      const fdx = crumb.x - f.spr.x;
      const fdy = crumb.y - f.spr.y;
      const fdist = Math.hypot(fdx, fdy);
      if (fdist > s(40)) {
        f.spr.x = crumb.x;
        f.spr.y = crumb.y;
      } else {
        const k = 1 - Math.exp(-FOLLOW_EASE * dt);
        f.spr.x += fdx * k;
        f.spr.y += fdy * k;
      }
      f.spr.setDepth(f.spr.y + this.levelLift(f.spr.x, f.spr.y));
      // each follower WALKS while it's still closing on its crumb and stands once
      // settled — a per-member motion check works now that they move every frame (not
      // in hops). The LEADER's run flag still picks the gait. crumb.f = its facing.
      const anim = `${f.id}-${running ? 'run' : 'walk'}-${crumb.f}`;
      if (fdist > s(1)) {
        if (f.spr.anims.currentAnim?.key !== anim || !f.spr.anims.isPlaying) f.spr.anims.play(anim, true);
      } else {
        // ADR-104 (Prompt 7): the party breathes too — staggered by a per-member
        // phase offset so the line doesn't inhale in lockstep.
        const idle = `${f.id}-idle-${crumb.f}`;
        if (crumb.f === 'down' && this.anims.exists(idle)) {
          if (f.spr.anims.currentAnim?.key !== idle || !f.spr.anims.isPlaying) {
            f.spr.anims.play(idle, true);
            f.spr.anims.setProgress(((i + 1) * 0.37) % 1);
          }
        } else {
          f.spr.anims.stop();
          f.spr.setFrame(standFrame(crumb.f));
        }
      }
    });
  }

  /** axis-separated movement (slide on collide). A wall or prop always stops the
   *  player; a car or wandering NPC only stops them when the step would enter it
   *  FRESH — a body they already overlap never blocks, so they can always walk back
   *  out instead of being trapped inside it (ADR-137 soft-lock fix). */
  private tryMove(x: number, y: number, dx: number, dy: number, second = false): number {
    const nx = x + dx;
    const ny = y + dy;
    const box = { x: nx - s(5), y: ny - s(9), w: s(10), h: s(9) };
    const cur = { x: x - s(5), y: y - s(9), w: s(10), h: s(9) };
    if (this.collidesStatic(box) || this.entersNewDynamicBody(box, cur)) return second ? y : x;
    return second ? ny : nx;
  }

  /** Static, always-solid geometry: solid tiles + prop/facade rects. Unlike the
   *  dynamic bodies below, these never move, so overlap always means "blocked". */
  private collidesStatic(box: Rect, level = this.playerLevel): boolean {
    const x0 = Math.floor(box.x / TILE_PX);
    const y0 = Math.floor(box.y / TILE_PX);
    const x1 = Math.floor((box.x + box.w) / TILE_PX);
    const y1 = Math.floor((box.y + box.h) / TILE_PX);
    // WORLD-OVERHAUL P3/P5 (opt-in elevation): cross-level collision. On a terraced
    // map, a tile on a DIFFERENT terrace than the MOVER is SOLID — you can't step onto
    // another level except across a 'T' stair (the sole bridge; consistent with
    // levelJoinFor's reachability flood on any no-invisible-ledge map). Guarded by
    // maxLevel>0 so every FLAT map (all shipped but foggybottom/otterbrook) is
    // byte-identical: the whole level branch is skipped and only the original
    // solidTiles/solids test runs. Safe against the 40×36 body box straddling two rows
    // while climbing: the mover's level flips the instant its feet reach the 'T' row,
    // before the box top can poke the next terrace at the ≤23px/frame cap
    // (RUN·dt_max=460·0.05). `level` defaults to the PLAYER's terrace (the player path
    // is byte-unchanged); P5 threads each mover's OWN terrace (NpcObj/Roamer/PatrolObj
    // `.level`, seeded at spawn + flipped on 'T' via levelAfterStep) so an L0 townsfolk
    // no longer freezes/clips when the PLAYER climbs — the fix that lets a LIVING town
    // (wanderers/traffic/roamers) be elevated at all.
    const levelAware = this.maxLevel > 0;
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (
          ty < 0 ||
          tx < 0 ||
          ty >= this.solidTiles.length ||
          tx >= this.solidTiles[0].length ||
          this.solidTiles[ty][tx]
        ) {
          return true;
        }
        if (
          levelAware &&
          this.levelGrid[ty][tx] !== level &&
          this.mapDef.grid[ty][tx] !== 'T'
        ) {
          return true;
        }
      }
    }
    const hit = (r: Rect): boolean =>
      box.x < r.x + r.w && box.x + box.w > r.x && box.y < r.y + r.h && box.y + box.h > r.y;
    return this.solids.some(hit);
  }

  /** Dynamic bodies the PLAYER must not phase into: ambient cars (whose rects run
   *  bigger than a tile) + wandering townsfolk (ADR-131). Delegates to entersNewBody
   *  so a body the player is ALREADY overlapping never blocks the step — the ADR-137
   *  escape hatch that stops a car/NPC pinning the player in place. §A6 GIANT towns
   *  opt out of player↔NPC solidity (the tiny party passes through the colossi), to
   *  match collides(); the giant TRUCKS still count, so the hatch is what frees the
   *  tiny player from a truck's oversized rect. */
  private entersNewDynamicBody(box: Rect, cur: Rect): boolean {
    if (entersNewBody(box, cur, this.trafficRects)) return true;
    if (LILLEBY_GIANT_MAPS.has(this.mapDef.id)) return false;
    const npcBodies: Rect[] = [];
    for (const n of this.npcs) {
      if (!n.wanders) continue;
      npcBodies.push({ x: n.spr.x - s(6), y: n.spr.y - s(10), w: s(12), h: s(10) });
    }
    return entersNewBody(box, cur, npcBodies);
  }

  private collides(box: Rect, actor?: 'player' | NpcObj, level = this.playerLevel): boolean {
    if (this.collidesStatic(box, level)) return true;
    // ambient cars (S18 M26): full-body AABB overlap
    const hit = (r: Rect): boolean =>
      box.x < r.x + r.w && box.x + box.w > r.x && box.y < r.y + r.h && box.y + box.h > r.y;
    if (this.trafficRects.some(hit)) return true;
    // ADR-131: the player and WANDERING townsfolk are SOLID to each other (and to
    // other wanderers) — the kid bumps people instead of walking through them. A
    // wanderer can't be a static `solids` rect (it would leave a "ghost" where it
    // spawned, see buildNpcs), so it's tested LIVE at its sprite position here.
    // Opt-in: only the player's tryMove ('player') and a wanderer's own step (its
    // NpcObj) pass `actor` — roamers/patrols pass nothing and keep the old
    // prop-only check. The moving actor is excluded so it never hits its own box.
    // §A6 GIANT towns opt OUT of actor↔actor solidity: the tiny party and the colossi pass
    // through one another, so a giant (pinned or wandering) can never wedge the tiny player
    // against a prop (soft-lock). Interaction stays proximity-based, so nothing is lost.
    if (actor !== undefined && !LILLEBY_GIANT_MAPS.has(this.mapDef.id)) {
      for (const n of this.npcs) {
        if (!n.wanders || n === actor) continue;
        if (hit({ x: n.spr.x - s(6), y: n.spr.y - s(10), w: s(12), h: s(10) })) return true;
      }
      if (actor !== 'player' && this.player && hit({ x: this.player.x - s(5), y: this.player.y - s(9), w: s(10), h: s(9) })) {
        return true;
      }
    }
    return false;
  }

  private updateNpcs(dt: number): void {
    for (const n of this.npcs) {
      if (!n.wanders || this.cut || this.dlg.busy) continue;
      n.think -= dt * 1000;
      if (n.think <= 0) {
        n.think = 1200 + Math.random() * 2200;
        if (Math.random() < 0.55) {
          // ADR-096: wander the diagonals too (normalized so they don't speed up)
          const [vx, vy] = NPC_WANDER_DIRS[Math.floor(Math.random() * NPC_WANDER_DIRS.length)];
          // px/s wander speed (dirs are unit/normalized) → scaled
          n.vx = vx * s(22);
          n.vy = vy * s(22);
        } else {
          n.vx = 0;
          n.vy = 0;
        }
      }
      if (n.vx !== 0 || n.vy !== 0) {
        const nx = n.spr.x + n.vx * dt;
        const ny = n.spr.y + n.vy * dt;
        if (Math.abs(nx - n.baseX) > s(28) || Math.abs(ny - n.baseY) > s(24) || this.collides({ x: nx - s(5), y: ny - s(9), w: s(10), h: s(9) }, n, n.level)) {
          n.vx = 0;
          n.vy = 0;
        } else {
          n.spr.x = nx;
          n.spr.y = ny;
          n.level = this.levelAfterStep(n.level, nx, ny);
          n.spr.setDepth(ny + this.levelLift(nx, ny));
          const f: Facing = facing8(n.vx, n.vy, 'down');
          if (!n.def.dog) {
            const anim = `${n.def.sprite}-walk-${f}`;
            if (n.spr.anims.currentAnim?.key !== anim || !n.spr.anims.isPlaying) n.spr.anims.play(anim, true);
          }
        }
      } else if (!n.def.dog) {
        // ADR-123: a wandering NPC that STOPS must show its clean STAND frame, not
        // freeze on whatever mid-step walk frame the anim halted on (the "frozen in
        // the wrong motion" bug). Reset to the resting facing's stand frame.
        if (n.spr.anims.isPlaying) n.spr.anims.stop();
        n.spr.setFrame(standFrame(n.def.facing));
      }
    }
  }

  private updateRoamers(dt: number): void {
    const now = this.time.now;
    const avgLvl = this.avgPartyLevel(); // party-wide — hoisted out of the per-roamer loop
    for (const r of this.roamers) {
      if (r.dead) continue;
      const def = ENEMIES[r.enemyId];
      const distP = Math.hypot(this.player.x - r.spr.x, this.player.y - r.spr.y);
      const outclassed = avgLvl >= def.level + 6;
      if (outclassed && distP < s(70)) {
        // EB detail: weak enemies flee a strong party (px/s flee speed)
        r.vx = Math.sign(r.spr.x - this.player.x) * s(60);
        r.vy = Math.sign(r.spr.y - this.player.y) * s(60);
      } else if (distP < s(64)) {
        r.vx = ((this.player.x - r.spr.x) / distP) * PURSUE;
        r.vy = ((this.player.y - r.spr.y) / distP) * PURSUE;
      } else {
        r.think -= dt * 1000;
        if (r.think <= 0) {
          r.think = 800 + Math.random() * 1600;
          const ang = Math.random() * Math.PI * 2;
          const speed = Math.random() < 0.3 ? 0 : s(26); // px/s wander
          r.vx = Math.cos(ang) * speed;
          r.vy = Math.sin(ang) * speed;
        }
      }
      let nx = r.spr.x + r.vx * dt;
      let ny = r.spr.y + r.vy * dt;
      // keep wanderers near home unless chasing
      if (distP >= s(64)) {
        nx = Phaser.Math.Clamp(nx, r.home.x, r.home.x + r.home.w);
        ny = Phaser.Math.Clamp(ny, r.home.y, r.home.y + r.home.h);
      }
      let moved = false;
      if (!this.collides({ x: nx - s(5), y: ny - s(8), w: s(10), h: s(8) }, undefined, r.level)) {
        moved = Math.abs(nx - r.spr.x) + Math.abs(ny - r.spr.y) > s(0.1);
        r.spr.x = nx;
        r.spr.y = ny;
        r.level = this.levelAfterStep(r.level, nx, ny);
        r.spr.setDepth(ny + this.levelLift(nx, ny));
      } else {
        r.vx = -r.vx;
        r.vy = -r.vy;
      }
      // humanoid enemies (walker sheets) animate like people — and SPRINT
      // like people when they've spotted lunch (S9b run cycles)
      if (r.overworld) {
        if (moved) {
          r.facing = facing8(r.vx, r.vy, r.facing);
          r.spr.setFrame(enemyOverworldFrame(r.facing));
        }
      } else if (r.walker) {
        if (moved) {
          r.facing = facing8(r.vx, r.vy, r.facing); // ADR-096: 8-way roam
          const anim = `${r.walker}-${distP < s(64) ? 'run' : 'walk'}-${r.facing}`;
          if (r.spr.anims.currentAnim?.key !== anim || !r.spr.anims.isPlaying) r.spr.anims.play(anim, true);
        } else if (r.spr.anims.isPlaying) {
          r.spr.anims.stop();
          r.spr.setFrame(standFrame(r.facing));
        }
      }
      if (distP < s(13) && now > this.battleCooldown) {
        void this.contactBattle(r);
        return;
      }
    }
  }

  /* ---------------- sight-line patrols (Department of Smiles) ---------------- */

  private updatePatrols(dt: number): void {
    const now = this.time.now;
    for (const p of this.patrols) {
      if (p.dead) continue;
      if (p.state === 'patrol' || p.state === 'return') {
        const [wx, wy] = p.def.route[p.wp];
        const tx = wx * TILE_PX + TILE_PX / 2;
        const ty = wy * TILE_PX + s(22);
        const d = Math.hypot(tx - p.spr.x, ty - p.spr.y);
        if (d < s(2)) {
          p.wp = (p.wp + 1) % p.def.route.length;
          p.state = 'patrol';
        } else {
          const vx = ((tx - p.spr.x) / d) * PATROL_WALK;
          const vy = ((ty - p.spr.y) / d) * PATROL_WALK;
          p.spr.x += vx * dt;
          p.spr.y += vy * dt;
          p.facing = facing8(vx, vy, p.facing); // ADR-096: 8-way patrol read
          this.patrolAnim(p, true, 'walk');
        }
        if (this.patrolSees(p)) {
          p.state = 'alert';
          p.alertT = 380;
          this.patrolAnim(p, false, 'walk');
          // face the player for the realization
          p.facing = this.dirToward(p.spr.x, p.spr.y, this.player.x, this.player.y);
          p.spr.setFrame(p.overworld ? enemyOverworldFrame(p.facing) : standFrame(p.facing));
          AUDIO.sfx('alert');
          p.bang = this.add
            .bitmapText(p.spr.x, p.spr.y - p.spr.height - s(2), 'retro', '!', s(8))
            .setOrigin(0.5, 1)
            .setTint(colorOf(px(RAMP.RED, 2)))
            .setDepth(5000);
          this.tweens.add({ targets: p.bang, y: p.bang.y - s(3), duration: 120, yoyo: true });
        }
      } else if (p.state === 'alert') {
        p.alertT -= dt * 1000;
        if (p.alertT <= 0) {
          p.state = 'chase';
          p.lose = 0;
        }
      } else {
        // chase — faster than your walk, slower than your run (§A4 feel)
        const dx = this.player.x - p.spr.x;
        const dy = this.player.y - p.spr.y;
        const d = Math.hypot(dx, dy);
        const step = PATROL_CHASE * dt;
        const nx = this.patrolMove(p.spr.x, p.spr.y, (dx / d) * step, 0, false, p.level);
        const ny = this.patrolMove(nx, p.spr.y, 0, (dy / d) * step, true, p.level);
        p.spr.x = nx;
        p.spr.y = ny;
        p.facing = facing8(dx, dy, p.facing); // ADR-096: 8-way chase read
        this.patrolAnim(p, true, 'run');
        if (p.bang) {
          p.bang.x = p.spr.x;
          p.bang.y = p.spr.y - p.spr.height - s(2);
        }
        if (d > s(120)) {
          p.lose += dt;
          if (p.lose > 1.5) this.patrolGiveUp(p); // 1.5s, time — unscaled
        } else {
          p.lose = 0;
        }
        if (d < s(13) && now > this.battleCooldown) {
          void this.patrolBattle(p);
          return;
        }
      }
      p.level = this.levelAfterStep(p.level, p.spr.x, p.spr.y);
      p.spr.setDepth(p.spr.y + this.levelLift(p.spr.x, p.spr.y));
    }
  }

  /** patrols stroll their route and SPRINT a chase (S9b run cycles) */
  private patrolAnim(p: PatrolObj, moving: boolean, gait: 'walk' | 'run'): void {
    if (p.overworld) {
      p.spr.setFrame(enemyOverworldFrame(p.facing));
      return;
    }
    if (moving) {
      const anim = `${p.walker}-${gait}-${p.facing}`;
      if (p.spr.anims.currentAnim?.key !== anim || !p.spr.anims.isPlaying) p.spr.anims.play(anim, true);
    } else if (p.spr.anims.isPlaying) {
      p.spr.anims.stop();
      p.spr.setFrame(standFrame(p.facing));
    }
  }

  /** axis-separated chase movement so Smilers slide along cubicle walls */
  private patrolMove(x: number, y: number, dx: number, dy: number, second: boolean, level = this.playerLevel): number {
    const nx = x + dx;
    const ny = y + dy;
    const box = { x: nx - s(5), y: ny - s(9), w: s(10), h: s(9) };
    if (this.collides(box, undefined, level)) return second ? y : x;
    return second ? ny : nx;
  }

  private dirToward(x0: number, y0: number, x1: number, y1: number): Facing {
    const dx = x1 - x0;
    const dy = y1 - y0;
    return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
  }

  /** facing-cone sight check with solid-tile occlusion */
  private patrolSees(p: PatrolObj): boolean {
    const range = (p.def.sight ?? 5) * TILE_PX; // sight in TILES → px
    const f = this.facingVectorOf(p.facing);
    const ex = p.spr.x;
    const ey = p.spr.y - s(8);
    const rx = this.player.x - ex;
    const ry = this.player.y - s(8) - ey;
    const along = rx * f.x + ry * f.y;
    if (along < s(6) || along > range) return false;
    const perp = Math.abs(rx * f.y - ry * f.x);
    if (perp > s(14)) return false;
    // line of sight: cubicle walls hide you (stealth-lite, caught = battle not fail)
    const steps = Math.ceil(along / s(8)); // ~one sample per 8px along the ray
    for (let i = 1; i < steps; i++) {
      const sx = ex + (rx * i) / steps;
      const sy = ey + (ry * i) / steps;
      const txi = Math.floor(sx / TILE_PX);
      const tyi = Math.floor(sy / TILE_PX);
      if (
        tyi < 0 ||
        txi < 0 ||
        tyi >= this.solidTiles.length ||
        txi >= this.solidTiles[0].length ||
        this.solidTiles[tyi][txi]
      ) {
        return false;
      }
    }
    return true;
  }

  private facingVectorOf(f: Facing): { x: number; y: number } {
    return FACING_VEC[f]; // ADR-096: 8-way (diagonals normalized)
  }

  private patrolGiveUp(p: PatrolObj): void {
    p.state = 'return';
    p.lose = 0;
    p.bang?.destroy();
    p.bang = null;
    // head for the nearest waypoint
    let best = 0;
    let bestD = Infinity;
    p.def.route.forEach(([wx, wy], i) => {
      const d = Math.hypot(wx * TILE_PX + TILE_PX / 2 - p.spr.x, wy * TILE_PX + s(22) - p.spr.y);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    p.wp = best;
  }

  private async patrolBattle(p: PatrolObj): Promise<void> {
    this.battleCooldown = this.time.now + 1500;
    // caught = they get the drop on you; sneak up on THEM for the green swirl
    const f = this.facingVectorOf(p.facing);
    const toPlayer = new Phaser.Math.Vector2(this.player.x - p.spr.x, this.player.y - p.spr.y).normalize();
    let advantage: 'player' | 'enemy' | 'none' = 'none';
    if (p.state === 'chase') advantage = 'enemy';
    else if (f.x * toPlayer.x + f.y * toPlayer.y < -0.35) advantage = 'player';
    p.bang?.destroy();
    p.bang = null;
    // patrols fight solo and own their own dead/give-up cleanup → empty pack
    const outcome = await this.startBattle([p.def.enemy], advantage, []);
    if (outcome === 'victory') {
      p.dead = true;
      p.spr.destroy();
      // S2: floor-3 victories count toward the PRODUCTIVITY LOCK's quota.
      // The pip ceremony belongs to the dos_f3 trio alone — every other
      // counted patrol (ADR-119's runaway mower) just sets its flag.
      if (p.def.countFlag && !GS.flag(p.def.countFlag)) {
        GS.setFlag(p.def.countFlag);
        if (this.quotaFlags().includes(p.def.countFlag)) {
          await this.quotaBeat();
        } else if (p.def.countFlag === 'q_mower_caught') {
          // ADR-119: on-the-spot confirmation — the TRAIL KEY waits at Hodgkin's counter
          AUDIO.sfx('confirm');
          toast(this, 'The runaway mower sputters out! (Hodgkin will want to hear it)');
        }
      }
    } else if (outcome === 'ran') {
      this.patrolGiveUp(p);
    }
  }

  /** a pip lights; the third one opens the holding room (fade-rebuild) */
  private async quotaBeat(): Promise<void> {
    const n = this.quotaCount();
    this.cut = true;
    if (n < 3) {
      AUDIO.sfx('confirm');
      this.holdingDoorImg?.setTexture(`holding_door_${n}`);
      await this.dlg.say(...DIALOGUE[`quota_pip_${n}`]);
      this.cut = false;
      return;
    }
    GS.setFlag('holding_open');
    this.holdingDoorImg?.setTexture('holding_door_3');
    AUDIO.sfx('confirm');
    await this.dlg.say(...DIALOGUE.quota_pip_3);
    AUDIO.sfx('thud');
    this.cameras.main.shake(250, 0.008);
    this.fadeRestart(); // rebuilt open: carved wall, quota panel, Mia inside
  }

  /** fade out and rebuild this map in place (position persists via GS.data) */
  private fadeRestart(): void {
    if (this.transitioning) return;
    this.transitioning = true;
    this.cameras.main.fadeOut(260, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.restart({});
    });
  }

  private updateFireflies(dt: number): void {
    for (const f of this.fireflies) {
      f.x += Math.sin(this.time.now / 700 + f.y) * s(8) * dt;
      f.y += Math.cos(this.time.now / 900 + f.x) * s(6) * dt;
    }
  }

  private avgPartyLevel(): number {
    const p = GS.data.party;
    return p.reduce((a, h) => a + h.level, 0) / Math.max(1, p.length);
  }

  /* ---------------- encounters ---------------- */

  private async contactBattle(r: Roamer): Promise<void> {
    this.battleCooldown = this.time.now + 1500;
    // ADR-106: a contact pulls in the PACK — roamers right on top of you are
    // caught in the same fight. Gather nearest-first, capped to the 5 seats.
    const cx = this.player.x;
    const cy = this.player.y;
    const live = this.roamers.filter((o) => !o.dead && o !== r);
    const packIdx = withinRadius(cx, cy, live.map((o) => ({ x: o.spr.x, y: o.spr.y })), PACK_RADIUS);
    const pack: Roamer[] = [r, ...packIdx.map((i) => live[i])].slice(0, ENCOUNTER_CAP);
    const defs = pack.map((m) => ENEMIES[m.enemyId]);
    // §A4.2 instant win — only when the party outclasses EVERY foe in the pack
    if (instantWinGroup(this.avgPartyLevel(), defs)) {
      this.instantWinPack(pack, defs);
      return;
    }
    // roamers in the wider alert ring (not already packed) may HOP IN during the
    // swirl — the EB-style join window, run inside startBattle
    const inPack = new Set(pack);
    const joiners = live.filter(
      (o) => !inPack.has(o) && Math.hypot(o.spr.x - cx, o.spr.y - cy) <= JOIN_ALERT_RADIUS,
    );
    // contact angle (from the bumped roamer) → swirl color (pinned in formulas)
    const toEnemy = new Phaser.Math.Vector2(r.spr.x - cx, r.spr.y - cy).normalize();
    const dotF = this.facingVector().dot(toEnemy);
    const enemyDir = new Phaser.Math.Vector2(r.vx, r.vy).normalize();
    const enemyFleeing = enemyDir.length() > 0 && enemyDir.dot(toEnemy) > 0.4;
    const advantage = contactAdvantage(dotF, enemyFleeing);
    await this.startBattle(pack.map((m) => m.enemyId), advantage, pack, { joiners });
  }

  /** §A4.2 + ADR-106: a whole pack the party walks straight through — sum the
   *  spoils across every foe, pop each, and roll it into one EXP/deposit award. */
  private instantWinPack(pack: Roamer[], defs: EnemyDef[]): void {
    AUDIO.sfx('smash');
    this.cameras.main.flash(220, 248, 248, 240);
    let exp = 0;
    let cash = 0;
    pack.forEach((m, k) => {
      m.dead = true;
      this.tweens.add({ targets: m.spr, alpha: 0, scale: 0.3, duration: 250, onComplete: () => m.spr.destroy() });
      exp += defs[k].exp;
      cash += defs[k].cash;
    });
    const share = expShare(exp, GS.aliveParty().length);
    GS.aliveParty().forEach((h) => (h.exp += share));
    GS.data.pendingDeposit += cash;
    toast(
      this,
      pack.length > 1
        ? `YOU WON without even fighting! ${pack.length} foes scatter · +${share} EXP`
        : `YOU WON without even fighting! +${share} EXP`,
    );
  }

  private facingVector(): Phaser.Math.Vector2 {
    const v = FACING_VEC[this.facing]; // ADR-096: 8-way (diagonals normalized)
    return new Phaser.Math.Vector2(v.x, v.y);
  }

  private startBattle(
    enemyIds: string[],
    advantage: 'player' | 'enemy' | 'none',
    pack: Roamer[],
    opts: { boss?: boolean; glint?: boolean; glintSupernova?: boolean; prayTutorial?: boolean; joiners?: Roamer[] } = {},
  ): Promise<'victory' | 'defeat' | 'ran'> {
    return new Promise((resolve) => {
      this.cut = true;
      AUDIO.sfx('swirl');
      AUDIO.stopMusic();
      // ADR-106: when foes are poised to hop in, the swirl runs longer (the
      // "1–2s" join window); a lone contact keeps the standard snap.
      const joiners = opts.joiners ?? [];
      const swirlMs = joiners.length ? JOIN_WINDOW_MS : SWIRL_MS;
      // S15c traffic-light law: green = your free round, red = theirs
      const sw = this.add
        .image(this.scale.width / 2, this.scale.height / 2, 'swirl')
        .setScrollFactor(0)
        .setDepth(4000)
        .setTint(colorOf(SWIRL_TINT[advantage]))
        .setScale(0.2)
        .setAlpha(0.9);
      const cover = this.add
        .rectangle(0, 0, this.scale.width, this.scale.height, 0x16101e)
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(3999)
        .setAlpha(0);
      this.tweens.add({ targets: sw, angle: 720, scale: 3.4, duration: swirlMs, ease: 'cubic.in' });
      // ADR-106: the join window — nearby roamers RUSH the fight while it spins
      // up. cut=true froze the normal roamer update, so we drive their dash here;
      // each one that reaches the player joins `pack`/`enemyIds` (capped) in time
      // for the launch below. Stops when the cover finishes filling.
      const stopJoin = joiners.length ? this.runJoinWindow(pack, enemyIds, joiners) : () => {};
      this.tweens.add({
        targets: cover,
        alpha: 1,
        duration: swirlMs,
        onComplete: () => {
          stopJoin();
          sw.destroy();
          this.game.events.once(
            'mf-battle-end',
            (outcome: 'victory' | 'defeat' | 'ran') => {
              cover.destroy();
              this.cut = false;
              this.battleCooldown = this.time.now + 1200;
              if (outcome === 'victory') {
                // the whole pack that fought is cleared from the field
                for (const m of pack) {
                  m.dead = true;
                  m.spr.destroy();
                }
              }
              if (outcome === 'ran') {
                // everyone scatters away from the player on a getaway (px/s)
                for (const m of pack) {
                  m.vx = Math.sign(m.spr.x - this.player.x) * s(70);
                  m.vy = Math.sign(m.spr.y - this.player.y) * s(70);
                }
              }
              if (outcome === 'defeat') {
                this.scene.resume();
                this.handleDefeat();
                resolve(outcome);
                return;
              }
              // a hero may have gone down (or gotten back up) in there
              this.rebuildFollowers();
              AUDIO.playMusic(this.mapDef.music);
              this.scene.resume();
              resolve(outcome);
            },
          );
          this.scene.pause();
          this.scene.launch('battle', {
            enemyIds,
            advantage,
            guestChad: GS.data.guest === 'chad',
            glintAssist: opts.glint ?? false,
            glintSupernova: opts.glintSupernova ?? false,
            boss: opts.boss ?? false,
            prayTutorial: opts.prayTutorial ?? false,
          });
        },
      });
    });
  }

  /** ADR-106: run the EB-style JOIN WINDOW. While the swirl fills, roamers in the
   *  alert ring sprint the player; each that reaches them hops into `pack` and
   *  `enemyIds` (until the 5 seats fill). dt-scaled (ADR-024). Returns a stop fn
   *  the caller fires at launch so no dash outlives the window. */
  private runJoinWindow(pack: Roamer[], enemyIds: string[], joiners: Roamer[]): () => void {
    const cx = this.player.x;
    const cy = this.player.y;
    return everyFrame(this, (dtMs) => {
      if (pack.length >= ENCOUNTER_CAP) return;
      const dt = dtMs / 1000;
      for (const c of joiners) {
        if (c.dead || pack.includes(c)) continue;
        const dx = cx - c.spr.x;
        const dy = cy - c.spr.y;
        const d = Math.hypot(dx, dy) || 1;
        c.spr.x += (dx / d) * JOIN_DASH * dt;
        c.spr.y += (dy / d) * JOIN_DASH * dt;
        c.spr.setDepth(c.spr.y);
        if (c.walker) {
          const f = facing8(dx, dy, 'down'); // ADR-096: 8-way run read
          const anim = `${c.walker}-run-${f}`;
          if (c.spr.anims.currentAnim?.key !== anim || !c.spr.anims.isPlaying) c.spr.anims.play(anim, true);
        }
        if (d <= JOIN_REACH && pack.length < ENCOUNTER_CAP) {
          pack.push(c);
          enemyIds.push(c.enemyId);
          AUDIO.sfx('alert');
          const bang = this.add
            .bitmapText(c.spr.x, c.spr.y - s(16), 'retro', '!', s(8))
            .setOrigin(0.5, 1)
            .setTint(colorOf(px(RAMP.RED, 2)))
            .setDepth(5000);
          this.tweens.add({ targets: bang, y: bang.y - s(4), alpha: 0, duration: 300, onComplete: () => bang.destroy() });
        }
      }
    });
  }

  private handleDefeat(): void {
    // Freeze the overworld under the game-over overlay. Without this, update()
    // keeps running for the ~900ms until scene.restart, so a held movement key
    // could walk the leader into a door — whose own restart would win the race
    // and wake the party on the wrong map. scene.restart rebuilds the scene, so
    // leaving cut=true here is safe (the fresh instance starts with cut=false).
    this.cut = true;
    // §A4.7: half the cash ON HAND — banked money is safe (the S4 ATM's point)
    GS.data.cashOnHand = Math.floor(GS.data.cashOnHand / 2);
    // S14 (Bible Prompt 25): ADR-014's interim revive-all RETIRES. The
    // leader picks himself up at the last Dad-save; everyone else rides the
    // trail as haloed angels until a hospital (price scales by level), a
    // Healing ?, or a rare item brings them back — hospitals ARE the economy.
    const lead = GS.data.party[0];
    lead.down = false;
    lead.hp = lead.maxHp;
    this.registry.set('defeated', true);
    // S6: wake at the last Dad-save's spot (hospitals reuse respawnPoint)
    const p = GS.respawnPoint();
    this.add.image(0, 0, 'game_over')
      .setOrigin(0, 0)
      .setDisplaySize(this.scale.width, this.scale.height)
      .setScrollFactor(0)
      .setDepth(99999);
    this.time.delayedCall(900, () => this.scene.restart({ mapId: p.mapId, x: p.x, y: p.y, facing: p.facing }));
  }

  /* ---------------- interactions ---------------- */

  private async interact(): Promise<void> {
    const v = this.facingVector();
    // reach one tile ahead (v is a unit facing vector); the -6 lifts the probe
    // to chest height, v.y*14 leans it a little further when facing up/down
    const probeX = this.player.x + v.x * TILE_PX;
    const probeY = this.player.y - s(6) + v.y * s(14);

    for (const n of this.npcs) {
      if (Math.hypot(n.spr.x - probeX, Math.abs(n.spr.y - s(6) - probeY)) < s(16)) {
        await this.talkTo(n);
        return;
      }
    }
    for (const sign of this.mapDef.signs) {
      // S9: signs gate like NPCs — quest clues exist only mid-trail
      if (sign.ifFlag && !GS.flag(sign.ifFlag)) continue;
      if (sign.unlessFlag && GS.flag(sign.unlessFlag)) continue;
      if (Math.hypot(sign.x * TILE_PX + TILE_PX / 2 - probeX, sign.y * TILE_PX + TILE_PX / 2 - probeY) < s(16)) {
        AUDIO.sfx('cursor');
        if (await this.signBeat(sign.dialogue)) return;
        await this.dlg.say(...DIALOGUE[sign.dialogue]);
        return;
      }
    }
    for (const ph of this.mapDef.phones) {
      if (Math.hypot(ph.x * TILE_PX + TILE_PX / 2 - probeX, ph.y * TILE_PX + TILE_PX / 2 - probeY) < s(18)) {
        // S2: Mom is calling THIS payphone — answering outranks dialing out
        if (this.mapDef.id === 'brickton' && this.momCallPending()) {
          await this.momPayphoneScene();
          return;
        }
        await this.phoneFlow();
        return;
      }
    }
    // S4: the ATM at the Savings & Loan facade (Prompt 20)
    for (const a of this.mapDef.atms ?? []) {
      if (Math.hypot(a.x * TILE_PX + TILE_PX / 2 - probeX, a.y * TILE_PX + TILE_PX / 2 - probeY) < s(18)) {
        await this.atmFlow();
        return;
      }
    }
    // §A4.5 picnic tables (S14 — Bible Prompt 23): the basket ritual.
    // The interim half-heal retired with the real system; without a basket
    // a table is just a fine spot and an opinion.
    for (const p of this.mapDef.props) {
      if (p.sprite !== 'picnic') continue;
      if (Math.hypot(p.x * TILE_PX + s(18) - probeX, p.y * TILE_PX + s(12) - probeY) < s(24)) {
        await this.picnicFlow(p);
        return;
      }
    }
    // S9 §A10 #2: with the route in hand, the five stops take letters first —
    // facades deliver whether or not their door is real (S10 hoisted this out
    // of lockedLines: the STARPORT opened, but its mail slot still works)
    for (const p of this.mapDef.props) {
      if (!MAIL_DOORS[p.sprite] || !p.solid) continue;
      // the route's five stops are the ORIGINALS — Elm Row's three houses (the
      // bluff, y<10) + the chapel + the arcade. house_* sprites are reused all
      // over the region now (Hill Road, Maple Ct, the Hollow); those are not
      // mail stops and must not eat the knock.
      if (p.sprite.startsWith('house_') && this.mapDef.id !== 'otterbrook') continue;
      // solid.* are NATIVE data; the ±4/8 pad is px → all scaled at read
      const r = {
        x: p.x * TILE_PX + s(p.solid.ox) - s(4),
        y: p.y * TILE_PX + s(p.solid.oy) - s(4),
        w: s(p.solid.w) + s(8),
        h: s(p.solid.h) + s(8),
      };
      if (probeX > r.x && probeX < r.x + r.w && probeY > r.y && probeY < r.y + r.h) {
        if (await this.mailDelivery(p.sprite)) {
          AUDIO.sfx('cursor');
          return;
        }
        break; // not (or no longer) a live stop — fall through to lockedLines
      }
    }
    // buildings without interiors yet: a visible door always answers
    // (the drugstore + STARMART left this list in S4, both STARPORTs in S10)
    const lockedLines: Record<string, string> = {
      // S14: locked_chapel + locked_hospital RETIRED — both doors are real
      house_chad: 'locked_chad',
      house_a: 'locked_house',
      house_b: 'locked_house',
      bldg_bagels: 'locked_bagels',
      bldg_brickmore: 'locked_brickmore',
      bldg_video: 'locked_video',
      bldg_bank: 'locked_bank',
      bldg_diner: 'locked_diner',
      holding_door: 'holding_door_line',
      office_door: 'manager_door',
    };
    for (const p of this.mapDef.props) {
      const lineId = lockedLines[p.sprite];
      if (!lineId || !p.solid) continue;
      // solid.* are NATIVE data; the ±4/8 pad is px → all scaled at read
      const r = {
        x: p.x * TILE_PX + s(p.solid.ox) - s(4),
        y: p.y * TILE_PX + s(p.solid.oy) - s(4),
        w: s(p.solid.w) + s(8),
        h: s(p.solid.h) + s(8),
      };
      if (probeX > r.x && probeX < r.x + r.w && probeY > r.y && probeY < r.y + r.h) {
        AUDIO.sfx('cursor');
        // S2 doors report their state
        if (p.sprite === 'holding_door') {
          if (GS.flag('holding_open')) {
            await this.dlg.say(...DIALOGUE.holding_open_panel);
            return;
          }
          const n = this.quotaCount();
          const pips = n > 0 ? DIALOGUE[`holding_door_${n}`] : [];
          await this.dlg.say(...DIALOGUE.holding_door_line, ...pips);
          return;
        }
        if (p.sprite === 'office_door' && GS.flag('manager_defeated')) {
          await this.dlg.say(...DIALOGUE.manager_door_after);
          return;
        }
        await this.dlg.say(...DIALOGUE[lineId]);
        return;
      }
    }
  }

  private async talkTo(n: NpcObj): Promise<void> {
    // face each other
    if (!n.def.dog) {
      const f: Facing =
        Math.abs(n.spr.x - this.player.x) > Math.abs(n.spr.y - this.player.y)
          ? n.spr.x > this.player.x
            ? 'left'
            : 'right'
          : n.spr.y > this.player.y
            ? 'up'
            : 'down';
      n.spr.anims.stop();
      n.spr.setFrame(standFrame(f));
    }
    AUDIO.sfx('cursor');
    // Ch.3 (ADR-099) — Boothe's chemist hands over the GOOD leaves for the
    // groundskeeper's cuppa BEFORE his shop opens (§A10 #8: the keeper IS the source)
    if (n.def.id === 'fb_chemist' && GS.flag('q_cuppa') && !GS.flag('q_cuppa_done') && !GS.flag('q_cuppa_leaves')) {
      await this.dlg.say(...DIALOGUE.q_cuppa_leaves);
      GS.setFlag('q_cuppa_leaves');
      AUDIO.sfx('confirm');
      const got = ['q_cuppa_leaves', 'q_cuppa_milk', 'q_cuppa_water'].filter((f) => GS.flag(f)).length;
      toast(this, `The good leaves. (${got}/3 — then back to the groundskeeper.)`);
    }
    // S4: keepers ARE their shops — talking opens the buy/sell flow
    if (n.def.shop) {
      this.openShop(n.def.shop);
      return;
    }
    if (n.def.id === 'mom') {
      // the night Glint died: she sends you to bed, and sleep brings the morning
      if (GS.flag('zapper_hit') && !GS.flag('zapper_done')) {
        await this.dlg.say(...DIALOGUE.npc_mom_sleep);
        await this.sleepToMorning();
        return;
      }
      if (!GS.flag('mom_gear')) {
        await this.dlg.say(...DIALOGUE.npc_mom_pre);
        GS.addItem('salt_shaker');
        GS.addItem('pbj');
        GS.setFlag('mom_gear');
        toast(this, 'Got SALT SHAKER and PB&J!');
        AUDIO.sfx('confirm');
      } else if (GS.flag('zapper_done')) {
        await this.dlg.say(...DIALOGUE.npc_mom_post);
      } else {
        await this.dlg.say(...DIALOGUE.npc_mom);
      }
      // user law (ADR-042): every visit to Mom is a full reset — HP, PP,
      // and the Homesick ache (§A4.4: her voice is the cure, in person too).
      // Down heroes stay down — Mom is not a hospital.
      const fixed = GS.data.party.some((h) => !h.down && (h.hp < h.maxHp || h.pp < h.maxPp));
      for (const h of GS.data.party) {
        if (!h.down) {
          h.hp = h.maxHp;
          h.pp = h.maxPp;
        }
      }
      if (GS.flag('rex_homesick')) {
        GS.setFlag('rex_homesick', false);
        AUDIO.sfx('heal');
        await this.dlg.say(...DIALOGUE.mom_cure_beat);
      } else if (fixed) {
        AUDIO.sfx('heal');
        await this.dlg.say(...DIALOGUE.npc_mom_heal);
      }
      return;
    }
    // S9: quest givers and quest-state NPCs branch through their machines
    if (await this.questTalk(n)) return;
    // S15c: daylight swaps in the day variant where one is authored
    await this.dlg.say(...DIALOGUE[(!this.isNight && n.def.dialogueDay) || n.def.dialogue]);
  }

  /* ---------------- S9: the §A10 #1–3 quest beats (Prompt 26) ----------------
   * State machines live in data (src/data/quests.ts) + flags; these beats are
   * the world's side of each transition, per ADR-014: commit flags, then
   * fade-restart whenever the map must rebuild (gated NPCs/props/spawners).
   */

  /**
   * S22 (ADR-118, reworked) — THE COP FIGHT. Constable Borden, lightly Hushed and
   * fed a frame-up by Chad, "detains" Jay over the hill "vandalism." Now a REAL
   * arc: by daybreak he RUNS you down on the civic lane (no talking to him —
   * `bordenChase`), MARCHES you into the station's holding cell (`bordenStreetBeat`
   * → warp), and books you there (`bordenCellBeat` → the fight). Beating him snaps
   * him clear, clears Jay's name, pays his donut money, and walks you back to the
   * lane a free kid; a getaway/defeat just leaves him to try again (the retry law).
   * Still OPTIONAL — a sprint shakes the chase, so it never walls the road.
   */
  private bordenChase(dt: number): void {
    if (this.cut || this.dlg.busy || this.transitioning || this.bordenEngaged) return;
    if (this.mapDef.id !== 'otterbrook') return;
    if (!GS.flag('zapper_done') || GS.flag('borden_cleared') || GS.flag('borden_marching')) return;
    const n = this.npcs.find((o) => o.def.id === 'constable_borden');
    if (!n) return;
    const dx = this.player.x - n.spr.x;
    const dy = this.player.y - n.spr.y;
    const d = Math.hypot(dx, dy);
    const trackBang = () => {
      if (this.bordenBang) {
        this.bordenBang.x = n.spr.x;
        this.bordenBang.y = n.spr.y - n.spr.height - s(2);
      }
    };
    if (this.bordenState === 'idle') {
      if (d < s(96)) {
        this.bordenState = 'alert';
        this.bordenAlertT = 360;
        n.spr.setFrame(standFrame(this.dirToward(n.spr.x, n.spr.y, this.player.x, this.player.y)));
        AUDIO.sfx('alert');
        this.bordenBang = this.add
          .bitmapText(n.spr.x, n.spr.y - n.spr.height - s(2), 'retro', '!', s(8))
          .setOrigin(0.5, 1)
          .setTint(colorOf(px(RAMP.RED, 2)))
          .setDepth(5000);
        this.tweens.add({ targets: this.bordenBang, y: this.bordenBang.y - s(3), duration: 120, yoyo: true });
      }
      return;
    }
    if (this.bordenState === 'alert') {
      this.bordenAlertT -= dt * 1000;
      trackBang();
      if (this.bordenAlertT <= 0) this.bordenState = 'chase';
      return;
    }
    // a sprint can outrun his official trot → he gives up and resets (stays optional)
    if (d > s(240)) {
      this.bordenState = 'idle';
      this.bordenBang?.destroy();
      this.bordenBang = null;
      n.spr.anims.stop();
      n.spr.setFrame(standFrame(n.def.facing));
      return;
    }
    // chase — the patrols' axis-separated slide so he doesn't stick on a corner
    const step = BORDEN_CHASE * dt;
    const nx = this.patrolMove(n.spr.x, n.spr.y, (dx / d) * step, 0, false, n.level);
    const ny = this.patrolMove(nx, n.spr.y, 0, (dy / d) * step, true, n.level);
    n.spr.x = nx;
    n.spr.y = ny;
    n.level = this.levelAfterStep(n.level, nx, ny);
    n.spr.setDepth(ny);
    const f = facing8(dx, dy, n.def.facing);
    const gait = this.anims.exists(`${n.def.sprite}-run-${f}`) ? 'run' : 'walk';
    const anim = `${n.def.sprite}-${gait}-${f}`;
    if (n.spr.anims.currentAnim?.key !== anim || !n.spr.anims.isPlaying) n.spr.anims.play(anim, true);
    trackBang();
    if (d < s(14)) {
      this.bordenEngaged = true;
      this.cut = true;
      this.bordenBang?.destroy();
      this.bordenBang = null;
      n.spr.anims.stop();
      void this.bordenStreetBeat();
    }
  }

  /**
   * The street confrontation, then the MARCH: accuse → your answer → he walks you
   * the three blocks to the station and you spawn INSIDE the holding cell. (The
   * fight itself fires from `bordenCellBeat` once the cell map loads.)
   */
  private async bordenStreetBeat(): Promise<void> {
    if (GS.flag('borden_marching') || GS.flag('borden_cleared')) return;
    this.cut = true;
    this.bordenEngaged = true;
    await this.dlg.say(...DIALOGUE.npc_borden_accuse);
    const pick = await this.dlg.ask(['"It was a METEOR, sir."', 'Say nothing'], { cancelIndex: 1 });
    await this.dlg.say(...(pick === 0 ? DIALOGUE.npc_borden_meteor : DIALOGUE.npc_borden_silent));
    // ADR-121: he doesn't brawl in the street — he MARCHES you to the station first.
    await this.dlg.say(...DIALOGUE.npc_borden_march);
    const go = await this.dlg.ask(['Go quietly', 'Protest'], { cancelIndex: 0 });
    await this.dlg.say(...(go === 0 ? DIALOGUE.npc_borden_quiet : DIALOGUE.npc_borden_protest));
    // the real walk now — warp INTO the station's holding cell (he books you there)
    GS.setFlag('borden_marching');
    this.goThroughDoor('otter_station', OTTER_CELL.tx, OTTER_CELL.ty, 'down');
  }

  /**
   * Booked — fires on entering the station cell mid-march: the holding-cell
   * dialogue, then the fight, IN the cell. Win clears your name and walks you back
   * to the lane; a getaway bounces you out (the cell never traps you); defeat
   * respawns at the last save (handleDefeat). Either way `borden_marching` clears.
   */
  private async bordenCellBeat(): Promise<void> {
    this.cut = true;
    await this.dlg.say(...DIALOGUE.npc_borden_holding);
    await this.dlg.say(...DIALOGUE.npc_borden_threat);
    this.cut = false;
    const outcome = await this.startBattle(['borden'], 'none', [], {});
    const back = this.mapDef.doors[0];
    const backTx = back?.tx ?? 64 * 16 + 8; // the station's Civic St doorstep (S9 grid)
    const backTy = back?.ty ?? 94 * 16;
    if (outcome !== 'victory') {
      GS.setFlag('borden_marching', false);
      if (outcome === 'ran') this.goThroughDoor('otterbrook', backTx, backTy, 'down');
      return; // 'defeat' → handleDefeat already owns the respawn
    }
    GS.setFlag('borden_cleared');
    GS.setFlag('borden_marching', false);
    GS.data.cashOnHand += 80;
    AUDIO.jingle('victory', 1600, this.mapDef.music);
    await this.dlg.say(...DIALOGUE.npc_borden_cleared);
    toast(this, "Cleared! Borden vouches for you. (+$80)");
    this.goThroughDoor('otterbrook', backTx, backTy, 'down'); // back to the lane, a free kid
  }

  /**
   * S22 (ADR-119) — HODGKIN'S TRAIL KEY (the soft EarthBound interlock). His demo
   * mower (a counted patrol on Hickory Trail) breaks loose; shutting it off earns
   * the TRAIL KEY, which opens his locked supply shed up the trail for a small
   * reward. Order-independent + optional — never gates the crater (soft gating).
   */
  private async hardwareBeat(): Promise<void> {
    if (GS.flag('has_trail_key')) {
      await this.dlg.say(...DIALOGUE.npc_hodgkin_after);
      return;
    }
    if (GS.flag('q_mower_caught')) {
      await this.dlg.say(...DIALOGUE.npc_hodgkin_reward);
      GS.setFlag('has_trail_key');
      AUDIO.sfx('confirm');
      toast(this, 'Got the TRAIL KEY! (opens the shed up Hickory Trail)');
      return;
    }
    await this.dlg.say(...DIALOGUE.npc_hodgkin_ask);
  }

  /** the current chapter, read off the Ember ledger (0 embers ⇒ Ch.1) */
  private chapterNow(): number {
    let n = 0;
    for (let i = 1; i <= 10; i++) if (GS.flag(`ember${i}`)) n++;
    return n + 1;
  }

  /**
   * S22 (ADR-115) — OTTERBROOK REALTY: the home-buying TEASER. 27 Maple is for sale
   * from the very first town; the agent shows the price and the dream, but at ~$1k
   * to your name it's out of reach — the rags-to-riches hook made literal. It's a
   * REAL, affordability-gated buy (owned flag + DEED key-item + cash), so it simply
   * starts impossible and becomes possible as the Fortune Arc climbs.
   */
  private async agencyBeat(): Promise<void> {
    if (GS.data.keyItems.includes('deed_27_maple') || GS.flag('owned_27_maple')) {
      await this.dlg.say(...DIALOGUE.agency_owned);
      return;
    }
    const def = PROPERTIES['27_maple'];
    const price = buyCost(def, this.chapterNow(), 0);
    await this.dlg.say(...DIALOGUE.npc_realtor);
    const pick = await this.dlg.ask([`Buy 27 Maple ($${price})`, 'Just looking'], { cancelIndex: 1 });
    if (pick !== 0) {
      await this.dlg.say(...DIALOGUE.agency_browse);
      return;
    }
    if (GS.data.cashOnHand < price) {
      await this.dlg.say(...DIALOGUE.agency_too_dear);
      return;
    }
    GS.data.cashOnHand -= price;
    GS.setFlag('owned_27_maple');
    GS.data.keyItems.push('deed_27_maple');
    AUDIO.sfx('confirm');
    toast(this, 'Got the DEED to 27 MAPLE!');
    await this.dlg.say(...DIALOGUE.agency_bought);
  }

  /**
   * S22 (ADR-115) — BERT'S AUTO: the car-lot TEASER. Browse-only on purpose — even
   * the cheapest CAR (the Comet sedan) dwarfs a kid's fortune, and you need a HOME
   * with a garage to park one. Shows the player the path (home → garage → car) and
   * the real sticker, then sends them off to go get rich.
   */
  private async carLotBeat(): Promise<void> {
    const price = carById('commuter')?.price ?? 5500;
    await this.dlg.say(...DIALOGUE.npc_car_dealer);
    await this.dlg.say(
      `@That cream four-door? The "Comet" sedan — $${price}. Drives like a sofa with ambitions.`,
    );
    await this.dlg.say(...DIALOGUE.carlot_browse);
  }

  /** quest-giver conversations; true = handled, false = fall through */
  private async questTalk(n: NpcObj): Promise<boolean> {
    switch (n.def.id) {
      case 'mrs_pemmel':
        // her §A10 ask opens at dawn — Biscuit holds the park until then
        if (!GS.flag('zapper_done')) return false;
        await this.pemmelBeat();
        return true;
      case 'mr_plummer':
        await this.plummerBeat();
        return true;
      case 'ana':
      case 'vivi':
        // the Lemonade Empire is a DAYTIME beat (the stand opens at dawn). During
        // the meteor night the twins are home in their rooms — fall through to
        // their authored night dialogue (ana_room_night / vivi_room_night) rather
        // than launching the quest. Mirrors mrs_pemmel's zapper_done gate above.
        if (!GS.flag('zapper_done')) return false;
        await this.twinsBeat();
        return true;
      case 'biscuit_drug':
        await this.biscuitFoundBeat(n);
        return true;
      case 'arcade_owner':
        await this.salBeat();
        return true;
      case 'permit':
        // S12: THE CAGE's commissioner — formats, the Classic, the handoff
        await this.permitBeat();
        return true;
      case 'caddy':
        // S13: COSTA ESTRELLA — stroke play, the Invitational, the Set
        await this.caddyBeat();
        return true;
      case 'doc_brickton':
      case 'doc_puerto':
      case 'doc_valle':
      case 'doc_otter': // S22 (ADR-120): the Otterbrook Clinic front desk
        // S14 (Prompt 25): pay-to-revive angels + the cure-all desk
        await this.hospitalBeat(n);
        return true;
      case 'priest_otter':
      case 'priest_valle':
        // S14 (Prompt 25): the free 50 HP party prayer, §A11.4 warm
        await this.chapelBeat(n);
        return true;
      case 'realtor_otter':
        // S22 (ADR-115): the home-buying teaser (real, affordability-gated)
        await this.agencyBeat();
        return true;
      case 'car_dealer_otter':
        // S22 (ADR-115): the car-lot teaser (browse-only — buy a home first)
        await this.carLotBeat();
        return true;
      case 'constable_borden':
        // ADR-118 rework: normally he RUNS you down (bordenChase) — but if you
        // walk up and talk first, it's the same march; once cleared he's a friendly.
        if (GS.flag('borden_cleared')) await this.dlg.say(...DIALOGUE.npc_borden_done);
        else await this.bordenStreetBeat();
        return true;
      case 'hodgkin':
        // S22 (ADR-119): the Trail Key interlock (catch his runaway mower)
        await this.hardwareBeat();
        return true;
      case 'deli_keeper':
      case 'deli_otter':
        // S14 (Prompt 23): the deli crafts Family (and one day Feast) Baskets.
        // S17 M18 Part B (ADR-063): deli_otter is Ch.1's drugstore lunch counter,
        // so the Americas Ch.1 foods get a Family Basket counter too (§A4.5).
        await this.deliBeat(n);
        return true;
      case 'tomas':
        // §A10 #5 — THE LLAMA DRAMA
        await this.tomasBeat();
        return true;
      case 'curator':
        // §A10 #6 — MUSEUM OF ALMOST-GOLD
        await this.curatorBeat();
        return true;
      case 'llama_1':
      case 'llama_2':
      case 'llama_3':
      case 'llama_5':
      case 'llama_6':
        await this.llamaBeat(n, false);
        return true;
      case 'llama_4':
        // §A10 #5: ONE of the six is a Gilded Beetle in a wool coat —
        // cornering it drops the act (it fights when cornered)
        await this.llamaBeat(n, true);
        return true;
      // S15i Task 3 (ADR-058) — Ch.1 #5: THE WALKERS' REGISTER. Hal gives it;
      // the three "noticing" tokens fire as triggers; you sign at the overpass post.
      case 'road_traveler':
        await this.travelerBeat();
        return true;
      // S15i Task 3 — Ch.2 dock quest: THE QUIET CRATE. The tallyman gives + closes
      // it; the crane man / board-keeper / salvage man each carry one clue.
      case 'ps_tally':
        await this.tallyBeat();
        return true;
      case 'ps_crane':
        return this.crateClue('q_crate_crane', 'q_crate_crane_clue');
      case 'ps_board':
        return this.crateClue('q_crate_board', 'q_crate_board_clue');
      case 'ps_market':
        return this.crateClue('q_crate_market', 'q_crate_market_clue');
      // ── CHAPTER 3 — ENGLAND (ADR-099): the flight out, the five §A10 givers,
      //    and the umpire step. Givers mirror tallyBeat (ask → active → complete). ──
      case 'uncle_bert':
        await this.boardLucille();
        return true;
      case 'wm_librarian':
        await this.overdueBeat();
        return true;
      case 'wm_groundskeeper':
        await this.cuppaBeat();
        return true;
      case 'fb_postmistress':
        await this.senderBeat();
        return true;
      case 'fb_boy':
        await this.pennyBeat();
        return true;
      case 'cricket_captain':
        await this.overBeat();
        return true;
      case 'wm_umpire':
        return this.umpireStep();
      // ── CHAPTER 4 — NORWAY: the cabin-Bert flight offer + the four §A10 givers ──
      case 'uncle_bert_air':
        await this.bertAirBeat();
        return true;
      case 'kv_sigrid':
        await this.sigridBeat();
        return true;
      case 'kv_halvor':
        await this.halvorBeat();
        return true;
      case 'kv_bellkeeper':
        await this.bellBeat();
        return true;
      case 'll_sweetheart':
        await this.sweetheartBeat();
        return true;
      case 'll_mayor':
        await this.picnicBeat();
        return true;
      default:
        return false;
    }
  }

  /* ---------------- S15i Task 3 (ADR-058) — Movement 4 quest beats ---------------- */

  /** Ch.1 #5 — Hal on Meadow Mile gives the route quest (the register is signed
   *  at the overpass post; the three tokens fire as walk triggers). */
  private async travelerBeat(): Promise<void> {
    if (!GS.flag('q_walkreg')) {
      await this.dlg.say(...DIALOGUE.q_walkreg_ask);
      GS.setFlag('q_walkreg');
      AUDIO.sfx('confirm');
      return;
    }
    if (GS.flag('q_walkreg_done')) {
      await this.dlg.say(...DIALOGUE.q_walkreg_after);
      return;
    }
    await this.dlg.say(...DIALOGUE.q_walkreg_active);
  }

  /** Ch.2 — one dock worker's clue toward THE QUIET CRATE; true once it lands,
   *  so the NPC's own §A11 line shows the rest of the time (fall-through). */
  private async crateClue(flag: string, dialogueId: string): Promise<boolean> {
    if (!GS.flag('q_crate') || GS.flag('q_crate_done') || GS.flag(flag)) return false;
    await this.dlg.say(...DIALOGUE[dialogueId]);
    GS.setFlag(flag);
    AUDIO.sfx('cursor');
    const n = ['q_crate_crane', 'q_crate_board', 'q_crate_market'].filter((f) => GS.flag(f)).length;
    toast(this, `A piece of it. (${n}/3 — then tell the tallyman.)`);
    return true;
  }

  /** Ch.2 — the tallyman gives the crate quest and, once you know, opens it */
  private async tallyBeat(): Promise<void> {
    if (!GS.flag('q_crate')) {
      await this.dlg.say(...DIALOGUE.q_crate_ask);
      GS.setFlag('q_crate');
      AUDIO.sfx('confirm');
      return;
    }
    if (GS.flag('q_crate_done')) {
      await this.dlg.say(...DIALOGUE.q_crate_after);
      return;
    }
    const allClues = ['q_crate_crane', 'q_crate_board', 'q_crate_market'].every((f) => GS.flag(f));
    if (!allClues) {
      await this.dlg.say(...DIALOGUE.q_crate_active);
      return;
    }
    const result = completeQuest('the_quiet_crate');
    if (result === 'hands-full') {
      await this.dlg.say(...DIALOGUE.q_crate_full);
      return;
    }
    GS.setFlag('q_crate_told');
    this.cut = true;
    AUDIO.sfx('confirm');
    this.sparkleBurst(this.player.x, this.player.y - s(16), 12);
    await this.dlg.say(...DIALOGUE.q_crate_open);
    AUDIO.jingle('victory', 1800, this.mapDef.music);
    this.cut = false;
  }

  /* ════════════ CHAPTER 3 — ENGLAND (ADR-099): the five §A10 quest beats ════════════
   * Each mirrors tallyBeat: the giver's ask arms it (startFlag); the "find" steps fire
   * as walk triggers (questPickup) or keeper hand-offs; the giver completes it
   * (completeQuest = reward + the finale CALLER). All non-missable + retry-safe. */

  /** §A10 #7 — the librarian and her three overdue books */
  private async overdueBeat(): Promise<void> {
    if (!GS.flag('q_overdue')) {
      await this.dlg.say(...DIALOGUE.q_overdue_ask);
      GS.setFlag('q_overdue');
      AUDIO.sfx('confirm');
      return;
    }
    if (GS.flag('q_overdue_done')) {
      await this.dlg.say(...DIALOGUE.q_overdue_after);
      return;
    }
    if (!['q_overdue_b1', 'q_overdue_b2', 'q_overdue_b3'].every((f) => GS.flag(f))) {
      await this.dlg.say(...DIALOGUE.q_overdue_active);
      return;
    }
    await this.dlg.say(...DIALOGUE.q_overdue_full);
    if (completeQuest('overdue') === 'hands-full') {
      await this.dlg.say('@Hands full, dear? A library is patient. Come back with room for a card and a book.');
      return;
    }
    GS.setFlag('q_overdue_reported');
    GS.addItem('first_edition'); // the bonus valuable she lets you keep (the §A11 wink)
    this.cut = true;
    AUDIO.sfx('confirm');
    this.sparkleBurst(this.player.x, this.player.y - s(16), 12);
    await this.dlg.say(...DIALOGUE.q_overdue_done_beat);
    AUDIO.jingle('victory', 1800, this.mapDef.music);
    this.cut = false;
  }

  /** §A10 #8 — the groundskeeper's exact brew (leaves from the chemist, milk + water as triggers) */
  private async cuppaBeat(): Promise<void> {
    if (!GS.flag('q_cuppa')) {
      await this.dlg.say(...DIALOGUE.q_cuppa_ask);
      GS.setFlag('q_cuppa');
      AUDIO.sfx('confirm');
      return;
    }
    if (GS.flag('q_cuppa_done')) {
      await this.dlg.say(...DIALOGUE.q_cuppa_after);
      return;
    }
    if (!['q_cuppa_leaves', 'q_cuppa_milk', 'q_cuppa_water'].every((f) => GS.flag(f))) {
      await this.dlg.say(...DIALOGUE.q_cuppa_active);
      return;
    }
    await this.dlg.say(...DIALOGUE.q_cuppa_full);
    if (completeQuest('groundskeepers_cuppa') === 'hands-full') {
      await this.dlg.say('@Pockets full? Empty one. A thermos needs somewhere to live.');
      return;
    }
    GS.setFlag('q_cuppa_brewed');
    this.cut = true;
    AUDIO.sfx('confirm');
    this.sparkleBurst(this.player.x, this.player.y - s(16), 10);
    await this.dlg.say(...DIALOGUE.q_cuppa_done_beat);
    AUDIO.jingle('victory', 1800, this.mapDef.music);
    this.cut = false;
  }

  /** Ch.3 regional — the postmistress and the three letters the pillar box ate */
  private async senderBeat(): Promise<void> {
    if (!GS.flag('q_sender')) {
      await this.dlg.say(...DIALOGUE.q_sender_ask);
      GS.setFlag('q_sender');
      AUDIO.sfx('confirm');
      return;
    }
    if (GS.flag('q_sender_done')) {
      await this.dlg.say(...DIALOGUE.q_sender_after);
      return;
    }
    if (!['q_sender_l1', 'q_sender_l2', 'q_sender_l3'].every((f) => GS.flag(f))) {
      await this.dlg.say(...DIALOGUE.q_sender_active);
      return;
    }
    await this.dlg.say(...DIALOGUE.q_sender_full);
    if (completeQuest('return_to_sender') === 'hands-full') {
      await this.dlg.say('@Make a pocket spare, love — this tin has earned a good home.');
      return;
    }
    GS.setFlag('q_sender_reported');
    this.cut = true;
    AUDIO.sfx('confirm');
    this.sparkleBurst(this.player.x, this.player.y - s(16), 10);
    await this.dlg.say(...DIALOGUE.q_sender_done_beat);
    AUDIO.jingle('victory', 1800, this.mapDef.music);
    this.cut = false;
  }

  /** Ch.3 regional — the damp boy's penny-fog (the hidden Roman drain fires the find) */
  private async pennyBeat(): Promise<void> {
    if (!GS.flag('q_penny')) {
      await this.dlg.say(...DIALOGUE.q_penny_ask);
      GS.setFlag('q_penny');
      AUDIO.sfx('confirm');
      return;
    }
    if (GS.flag('q_penny_done')) {
      await this.dlg.say(...DIALOGUE.q_penny_after);
      return;
    }
    if (!GS.flag('q_penny_found')) {
      await this.dlg.say(...DIALOGUE.q_penny_active);
      return;
    }
    await this.dlg.say(...DIALOGUE.q_penny_full);
    completeQuest('penny_fog'); // caller + flag (no item — the boy IS the prize)
    GS.setFlag('q_penny_reported');
    this.cut = true;
    AUDIO.sfx('confirm');
    this.sparkleBurst(this.player.x, this.player.y - s(16), 10);
    await this.dlg.say(...DIALOGUE.q_penny_done_beat);
    AUDIO.jingle('victory', 1800, this.mapDef.music);
    this.cut = false;
  }

  /** Ch.3 regional (sincere) — the cricket captain; the match ends once the umpire is
   *  free AND the Mainframe's clock has stopped (q_over_clock is set at the boss's fall) */
  private async overBeat(): Promise<void> {
    if (!GS.flag('q_over')) {
      await this.dlg.say(...DIALOGUE.q_over_ask);
      GS.setFlag('q_over');
      AUDIO.sfx('confirm');
      return;
    }
    if (GS.flag('q_over_done')) {
      await this.dlg.say(...DIALOGUE.q_over_after);
      return;
    }
    if (!(GS.flag('q_over_umpire') && GS.flag('q_over_clock'))) {
      await this.dlg.say(...DIALOGUE.q_over_active);
      return;
    }
    await this.dlg.say(...DIALOGUE.q_over_full);
    completeQuest('the_last_over'); // caller + flag (the XI going home IS the prize)
    GS.setFlag('q_over_called');
    this.cut = true;
    AUDIO.sfx('confirm');
    this.sparkleBurst(this.player.x, this.player.y - s(16), 14);
    await this.dlg.say(...DIALOGUE.q_over_done_beat);
    AUDIO.jingle('victory', 2000, this.mapDef.music);
    this.cut = false;
  }

  /** Ch.3 — Mr. Stumps, the umpire filed ABSENT (the "Last Over" find step); true
   *  once it lands, so his own §A11 line shows the rest of the time (fall-through). */
  private async umpireStep(): Promise<boolean> {
    if (!GS.flag('q_over') || GS.flag('q_over_done') || GS.flag('q_over_umpire')) return false;
    await this.dlg.say(...DIALOGUE.q_over_umpire);
    GS.setFlag('q_over_umpire');
    AUDIO.sfx('confirm');
    toast(this, GS.flag('q_over_clock') ? 'Mr. Stumps is free. Now find the captain.' : 'Mr. Stumps is free — but the clock upstairs still runs.');
    return true;
  }

  /* ---------------- S14: quests #5–6 (§A10, the S9 machines) ---------------- */

  /** §A10 #5 — Tomás's side of the herd */
  private async tomasBeat(): Promise<void> {
    if (!GS.flag('q_llama')) {
      await this.dlg.say(...DIALOGUE.q_llama_ask);
      GS.setFlag('q_llama');
      AUDIO.sfx('confirm');
      // the six gate onto THIS map — rebuild from data (ADR-014)
      this.fadeRestart();
      return;
    }
    const herded = [1, 2, 3, 4, 5, 6].filter((i) => GS.flag(`q_llama_${i}`)).length;
    if (herded < 6) {
      await this.dlg.say(...DIALOGUE.q_llama_active, `(${herded} of 6 are back. The pen does not count itself.)`);
      return;
    }
    if (!GS.flag('q_llama_done')) {
      const result = completeQuest('llama_drama');
      if (result === 'hands-full') {
        await this.dlg.say(...DIALOGUE.q_llama_full);
        return;
      }
      GS.setFlag('q_llama_reported');
      AUDIO.sfx('confirm');
      await this.dlg.say(...DIALOGUE.q_llama_done_beat);
      AUDIO.jingle('victory', 1600, this.mapDef.music);
      return;
    }
    await this.dlg.say(...DIALOGUE.q_llama_after);
  }

  /** §A10 #5 — one llama, one personality, one walk home (the Biscuit zoom) */
  private async llamaBeat(n: NpcObj, impostor: boolean): Promise<void> {
    const num = Number(n.def.id.slice(-1));
    await this.dlg.say(...DIALOGUE[n.def.dialogue]);
    if (impostor) {
      // the wool comes off — §A7's Gilded Beetle, cornered at last
      this.cut = true;
      AUDIO.sfx('alert');
      this.cameras.main.shake(220, 0.006);
      await this.dlg.say(...DIALOGUE.llama_impostor_reveal);
      const outcome = await this.startBattle(['gilded_beetle'], 'none', [], {});
      if (outcome !== 'victory') return;
      this.cut = true;
      GS.setFlag(`q_llama_${num}`);
      await this.dlg.say(...DIALOGUE.llama_impostor_after);
      this.fadeRestart(); // the REAL Dorada was behind the shed all along
      return;
    }
    this.cut = true;
    AUDIO.sfx('whoosh');
    // the trot home: exit toward the pen, the way every good llama exits
    await new Promise<void>((r) => {
      this.tweens.add({ targets: n.spr, x: 7 * TILE_PX, y: 7 * TILE_PX, duration: 620, ease: 'cubic.in', onComplete: () => r() });
    });
    GS.setFlag(`q_llama_${num}`);
    AUDIO.sfx('confirm');
    const herded = [1, 2, 3, 4, 5, 6].filter((i) => GS.flag(`q_llama_${i}`)).length;
    toast(this, herded < 6 ? `The herd counts ${herded} of 6.` : 'SIX! Tell Tomas the math works again.');
    this.fadeRestart(); // gated out here, gated IN at the pen (data, ADR-014)
  }

  /** §A10 #6 — the curator's side of the wing */
  private async curatorBeat(): Promise<void> {
    if (!GS.flag('q_museum')) {
      await this.dlg.say(...DIALOGUE.q_museum_ask);
      GS.setFlag('q_museum');
      GS.data.keyItems.push('camera');
      AUDIO.sfx('confirm');
      toast(this, 'Got the CAMERA!');
      return;
    }
    const shot = [1, 2, 3, 4].filter((i) => GS.flag(`q_photo_${i}`)).length;
    if (shot < 4) {
      await this.dlg.say(...DIALOGUE.q_museum_active, `(${shot} of 4 exhibits on film. The fakes are patient.)`);
      return;
    }
    if (!GS.flag('q_museum_done')) {
      const result = completeQuest('museum_gold');
      if (result === 'hands-full') {
        await this.dlg.say(...DIALOGUE.q_museum_full);
        return;
      }
      GS.setFlag('q_museum_reported');
      const cam = GS.data.keyItems.indexOf('camera');
      if (cam >= 0) GS.data.keyItems.splice(cam, 1); // returned before he reports it
      AUDIO.sfx('confirm');
      await this.dlg.say(...DIALOGUE.q_museum_done_beat);
      AUDIO.jingle('victory', 1600, this.mapDef.music);
      return;
    }
    await this.dlg.say(...DIALOGUE.q_museum_after);
  }

  /* ---------------- S14: hospitals, chapels & the deli (Prompts 23/25) ---------------- */

  /**
   * §A4.7 — the hospital desk: revive angels for cash (price scales by the
   * FALLEN hero's level), cure-all for a flat fee (it clears Homesick too —
   * for a price Mom would absolutely not approve of). Mushroomize stays
   * doctors-only when Ch.6 ships it; the sign on the wall already says so.
   */
  private async hospitalBeat(n: NpcObj): Promise<void> {
    await this.dlg.say(...DIALOGUE[n.def.dialogue]);
    for (;;) {
      const angels = GS.data.party.filter((h) => h.down);
      const rows = [
        ...angels.map((h) => `Revive ${h.name} ($${reviveCost(h.level)})`),
        `Cure everything ($${CURE_ALL_COST})`,
        'Never mind',
      ];
      const pick = await this.dlg.ask(rows, { cancelIndex: rows.length - 1 });
      if (pick === rows.length - 1) return;
      if (pick < angels.length) {
        const h = angels[pick];
        const cost = reviveCost(h.level);
        if (GS.data.cashOnHand < cost) {
          await this.dlg.say(...DIALOGUE.hospital_broke);
          continue;
        }
        GS.data.cashOnHand -= cost;
        h.down = false;
        h.hp = h.maxHp;
        AUDIO.sfx('heal');
        this.sparkleBurst(this.player.x, this.player.y - s(14), 10);
        await this.dlg.say(`${h.name} sat up like a Saturday morning. Good as new!`);
        this.rebuildFollowers(); // the angel walks out a person
        continue;
      }
      // the cure-all desk
      if (GS.data.cashOnHand < CURE_ALL_COST) {
        await this.dlg.say(...DIALOGUE.hospital_broke);
        continue;
      }
      GS.data.cashOnHand -= CURE_ALL_COST;
      const wasHomesick = GS.flag('rex_homesick') === true;
      GS.setFlag('rex_homesick', false);
      AUDIO.sfx('heal');
      await this.dlg.say(...(wasHomesick ? DIALOGUE.hospital_cured_homesick : DIALOGUE.hospital_cured));
    }
  }

  /** Prompt 25 — chapels: a free 50 HP prayer for everyone still standing;
   *  the priest is warm about Mia's gift (§A11.4 — flavor, played straight) */
  private async chapelBeat(n: NpcObj): Promise<void> {
    await this.dlg.say(...DIALOGUE[n.def.dialogue]);
    const pick = await this.dlg.ask(['Pray together', 'Just visiting'], { cancelIndex: 1 });
    if (pick !== 0) return;
    GS.data.party.forEach((h) => {
      if (!h.down) h.hp = Math.min(h.maxHp, h.hp + CHAPEL_HEAL);
    });
    AUDIO.sfx('pray');
    this.sparkleBurst(this.player.x, this.player.y - s(16), 8);
    await this.dlg.say(...DIALOGUE.chapel_prayer);
    if (GS.hero('faye')) await this.dlg.say(...DIALOGUE.priest_mia);
  }

  /**
   * Prompt 23 — the deli builds baskets: three foods become a FAMILY BASKET;
   * the FEAST needs Buni's recipe (§A10 #14, Ch.7 — the row waits politely).
   */
  private async deliBeat(n: NpcObj): Promise<void> {
    await this.dlg.say(...DIALOGUE[n.def.dialogue]);
    for (;;) {
      const foods = GS.data.party.flatMap((h) => h.bag.filter((id) => ITEMS[id]?.kind === 'food'));
      const canFamily = foods.length >= 3;
      const hasRecipe = GS.flag('feast_recipe') === true;
      const rows = [
        `Family Basket (3 foods)${canFamily ? '' : ' — short'}`,
        hasRecipe ? 'Feast Basket (3 foods + the recipe)' : 'Feast Basket — ???',
        'Never mind',
      ];
      const pick = await this.dlg.ask(rows, { cancelIndex: 2 });
      if (pick === 2) return;
      if (pick === 1 && !hasRecipe) {
        await this.dlg.say(...DIALOGUE.deli_no_recipe);
        continue;
      }
      if (!canFamily) {
        await this.dlg.say(...DIALOGUE.deli_short);
        continue;
      }
      // three foods leave (any three — the deli has RANGE), one basket lands
      let taken = 0;
      for (const h of GS.data.party) {
        while (taken < 3) {
          const i = h.bag.findIndex((id) => ITEMS[id]?.kind === 'food');
          if (i < 0) break;
          h.bag.splice(i, 1);
          taken++;
        }
        if (taken >= 3) break;
      }
      const made = pick === 1 ? 'basket_feast' : 'basket_family';
      // three foods just left somebody's bag, so a slot is GUARANTEED —
      // the basket lands with the first hero who has room (zero missables)
      const carrier = GS.data.party.find((h) => h.bag.length < 14) ?? GS.data.party[0];
      GS.addItem(made, carrier.id);
      AUDIO.sfx('confirm');
      toast(this, `Got ${ITEMS[made].name}!`);
      await this.dlg.say(...(pick === 1 ? DIALOGUE.deli_feast_made : DIALOGUE.deli_family_made));
    }
  }

  /* ---------------- S13: COSTA ESTRELLA LINKS (ADR-037) ----------------
   * FITO is the gate to both formats; LinksScene runs the round over a
   * paused world ('mf-links-closed'). The Invitational lives on NUMBER
   * FLAGS (links_seed/links_round/links_titles/links_played — ADR-015's
   * prefer-flags clause); THE SUNDAY SET hands off PERMIT's way (hands-full
   * BLOCKS, per-hero raincheck flags, zero missables).
   */

  private launchLinks(cfg: LinksLaunch): void {
    this.game.events.once('mf-links-closed', () => {
      AUDIO.playMusic(this.mapDef.music);
      this.scene.resume();
    });
    this.scene.pause();
    this.scene.launch('links', cfg);
  }

  /** the first Invitational pays THE SUNDAY SET — four 'other'-slot charms,
   *  hero-tagged, hands-full BLOCKING with links_handed_<hero> rainchecks */
  private async sundaySetHandoff(): Promise<boolean> {
    for (const [heroId, itemId] of Object.entries(SUNDAY_SET)) {
      if (GS.flag(`${LINKS_FLAGS.handedPrefix}${heroId}`) === true) continue;
      const wielder = GS.data.party.find((p) => p.id === heroId && p.bag.length < 14);
      const carrier = wielder ?? GS.data.party.find((p) => p.bag.length < 14);
      if (!carrier || !GS.addItem(itemId, carrier.id)) {
        await this.dlg.say(...DIALOGUE.caddy_hands_full);
        return true;
      }
      GS.setFlag(`${LINKS_FLAGS.handedPrefix}${heroId}`);
      toast(this, `Got ${ITEMS[itemId].name}!`);
      AUDIO.sfx('confirm');
    }
    return false;
  }

  private async caddyBeat(): Promise<void> {
    const titles = Number(GS.flag(LINKS_FLAGS.titles)) || 0;
    if (!GS.flag('links_met')) {
      GS.setFlag('links_met');
      await this.dlg.say(...DIALOGUE.npc_caddy);
    }
    // the champion's debts come first (the PERMIT pattern)
    if (titles >= 1 && Object.keys(SUNDAY_SET).some((heroId) => GS.flag(`${LINKS_FLAGS.handedPrefix}${heroId}`) !== true)) {
      await this.dlg.say(...DIALOGUE.caddy_title_first);
      await this.sundaySetHandoff();
      return;
    }
    if (titles > 1 && !GS.flag('links_repeat_heard')) {
      GS.setFlag('links_repeat_heard');
      await this.dlg.say(...DIALOGUE.caddy_repeat_title);
    }
    await this.dlg.say(...DIALOGUE.caddy_ask);
    const live = GS.flag('links_bracket_live') === true;
    const round = Number(GS.flag(LINKS_FLAGS.round)) || 0;
    const invRow = live ? `Play the Invitational: ${LINKS_TEXT.boardRound[round]}` : 'Enter the Costa Estrella Invitational';
    const pick = await this.dlg.ask(['Play a stroke round (9 holes)', invRow, 'Never mind'], { cancelIndex: 2 });
    if (pick === 0) {
      this.launchLinks({ kind: 'stroke' });
      return;
    }
    if (pick !== 1) return;
    if (!live) {
      const played = Number(GS.flag(LINKS_FLAGS.played)) || 0;
      GS.setFlag(LINKS_FLAGS.seed, linksSeed(titles, played));
      GS.setFlag(LINKS_FLAGS.round, 0);
      GS.setFlag('links_bracket_live');
      GS.setFlag('links_was_in');
      if (GS.activeSlot !== null) GS.saveTo(GS.activeSlot);
      await this.dlg.say(...DIALOGUE.caddy_register);
    } else {
      await this.dlg.say(...DIALOGUE.caddy_resume);
    }
    this.launchLinks({ kind: 'match', round: Number(GS.flag(LINKS_FLAGS.round)) || 0 });
  }

  /* ---------------- S12: THE CAGE (ADR-034) ----------------
   * PERMIT is the gate to both formats; HoopsScene runs the match over a
   * paused world (the S10 cabinet pattern, 'mf-hoops-closed'). Tournament
   * state lives on GS.data.hoops (save v5) — the bracket, the quarter
   * checkpoint, titles, and the STARTING FIVE raincheck ledger.
   */

  private launchHoops(cfg: HoopsLaunch): void {
    this.game.events.once('mf-hoops-closed', () => {
      AUDIO.playMusic(this.mapDef.music);
      this.scene.resume();
    });
    this.scene.pause();
    this.scene.launch('hoops', cfg);
  }

  /** the first Classic title pays THE STARTING FIVE — hands-full BLOCKS the
   *  handoff and PERMIT keeps the rest warm (hoops.handed is the raincheck
   *  ledger; zero missables, §B4). Returns true if anything got blocked.
   *  S15h: Pippa's Minister's Ribbon rides this too — a present carrier holds
   *  it (the wielder tag still locks who may EQUIP) until her Ch.5 join. */
  private async startingFiveHandoff(): Promise<boolean> {
    const h = GS.data.hoops;
    for (const [heroId, itemId] of Object.entries(STARTING_FIVE)) {
      if (h.handed.includes(itemId)) continue;
      // the piece aims for its hero's bag; anyone with room can carry it home
      const wielder = GS.data.party.find((p) => p.id === heroId && p.bag.length < 14);
      const carrier = wielder ?? GS.data.party.find((p) => p.bag.length < 14);
      if (!carrier || !GS.addItem(itemId, carrier.id)) {
        await this.dlg.say(...DIALOGUE.permit_hands_full);
        return true;
      }
      h.handed.push(itemId);
      toast(this, `Got ${ITEMS[itemId].name}!`);
      AUDIO.sfx('confirm');
    }
    return false;
  }

  private async permitBeat(): Promise<void> {
    const h = GS.data.hoops;
    if (!GS.flag('cage_met')) {
      GS.setFlag('cage_met');
      await this.dlg.say(...DIALOGUE.npc_permit);
    }
    // PERMIT'S SCHOOL (S12c): the cage teaches on the first visit —
    // skippable; either answer sets cage_tutored (declining IS skipping)
    if (!GS.flag('cage_tutored')) {
      await this.dlg.say(...DIALOGUE.permit_tutorial_ask);
      const lesson = await this.dlg.ask(['Take the lessons', 'I know ball'], { cancelIndex: 1 });
      if (lesson === 0) {
        // a fixed drill seed: the school is the same school for everybody
        this.launchHoops({ format: '3v3', seed: 1987, opponent: 'wet_socks', tutorial: true });
        return;
      }
      GS.setFlag('cage_tutored');
      await this.dlg.say(...DIALOGUE.permit_tutorial_skip);
    }
    // the champion's debts come first
    if (h.titles >= 1 && h.handed.length < STARTING_FIVE_IDS.length) {
      await this.dlg.say(...DIALOGUE.permit_title_first);
      await this.startingFiveHandoff();
      return;
    }
    if (h.titles >= 1 && !GS.flag('cage_repeat_heard')) {
      // one nod per dynasty; the line retires itself
      if (h.titles > 1) {
        GS.setFlag('cage_repeat_heard');
        await this.dlg.say(...DIALOGUE.permit_repeat_title);
      }
    }
    await this.dlg.say(...DIALOGUE.permit_pickup_ask);
    const classicRow = h.match
      ? `Pick up the Classic game (Q${h.match.quarter})`
      : h.bracket
        ? `Play the Classic: ${HOOPS_TEXT.boardRound[h.bracket.round]}`
        : 'Register for the Twoton Classic';
    const pick = await this.dlg.ask(['Run 3v3 pickup (first to 21)', classicRow, 'Never mind'], { cancelIndex: 2 });
    if (pick === 0) {
      const seed = pickupSeed(h.played);
      const opponent = TEAM_ORDER[seed % TEAM_ORDER.length];
      this.launchHoops({ format: '3v3', seed, opponent });
      return;
    }
    if (pick !== 1) return;
    if (h.match) {
      // the checkpointed quarter waits on the chalk (save v5)
      await this.dlg.say(...DIALOGUE.permit_resume);
      this.launchHoops({
        format: '5v5',
        seed: h.match.seed,
        opponent: h.match.opponent,
        round: h.match.round,
        resume: { ...h.match },
      });
      return;
    }
    if (!h.bracket) {
      h.bracket = newBracket(classicSeed(h.titles, h.played));
      GS.setFlag('cage_was_in');
      if (GS.activeSlot !== null) GS.saveTo(GS.activeSlot);
      await this.dlg.say(...DIALOGUE.permit_register);
    }
    const b = h.bracket;
    const opponent = nextOpponent(b);
    this.launchHoops({
      format: '5v5',
      seed: (b.seed + b.round * 977) >>> 0,
      opponent,
      round: b.round,
    });
  }

  /** the chalk board: bracket state, drawn in PERMIT's immaculate hand */
  private async cageBoardBeat(): Promise<void> {
    await this.dlg.say(...DIALOGUE.cage_board);
    const h = GS.data.hoops;
    if (h.match) {
      await this.dlg.say(
        `${HOOPS_TEXT.boardRound[h.match.round]} — your game holds at Q${h.match.quarter}, ${h.match.scoreUs}-${h.match.scoreThem}.`,
      );
      return;
    }
    if (h.bracket) {
      const opp = TEAMS[nextOpponent(h.bracket)];
      await this.dlg.say(
        `${HOOPS_TEXT.boardRound[h.bracket.round]}. ${HOOPS_TEXT.boardNext.replace('{team}', opp.name.toUpperCase())}`,
        HOOPS_TEXT.boardTaunt.replace('{taunt}', opp.taunt),
      );
      return;
    }
    if (h.titles > 0) {
      await this.dlg.say(HOOPS_TEXT.boardChamps);
      return;
    }
    await this.dlg.say(GS.flag('cage_was_in') ? HOOPS_TEXT.boardDead : HOOPS_TEXT.boardOpen);
  }

  /** §A10 #1 — Biscuit, Come Home: Mrs. Pemmel's side of the trail */
  private async pemmelBeat(): Promise<void> {
    if (!GS.flag('q_biscuit')) {
      await this.dlg.say(...DIALOGUE.q_biscuit_ask);
      GS.setFlag('q_biscuit');
      AUDIO.sfx('confirm');
      // the trailhead clue gates onto THIS map — rebuild from data (ADR-014)
      this.fadeRestart();
      return;
    }
    if (!GS.flag('q_biscuit_c3')) {
      await this.dlg.say(...DIALOGUE.q_biscuit_active);
      return;
    }
    if (!GS.flag('q_biscuit_done')) {
      // he zoomed straight home — the reward beat closes the quest
      const result = completeQuest('biscuit_come_home');
      if (result === 'hands-full') {
        await this.dlg.say(...DIALOGUE.q_biscuit_full);
        return;
      }
      GS.setFlag('q_biscuit_walked');
      AUDIO.sfx('confirm');
      await this.dlg.say(...DIALOGUE.q_biscuit_done_beat);
      AUDIO.jingle('victory', 1600, this.mapDef.music);
      this.fadeRestart(); // rebuild from data: Biscuit reappears at her side
      return;
    }
    await this.dlg.say(...DIALOGUE.q_biscuit_after);
  }

  /** §A10 #1 — the trail's end: Biscuit at the corn dog shelf */
  private async biscuitFoundBeat(n: NpcObj): Promise<void> {
    await this.dlg.say(...DIALOGUE.npc_biscuit_drug);
    GS.setFlag('q_biscuit_c3');
    this.cut = true;
    AUDIO.sfx('whoosh');
    // the ZOOM: he exits stage south, the way every good dog exits
    this.tweens.add({ targets: n.spr, x: n.spr.x - s(20), y: this.scale.height + s(40), duration: 480, ease: 'cubic.in' });
    await this.wait(520);
    this.fadeRestart(); // gated out by q_biscuit_c3 on rebuild
  }

  /** §A10 #2 — Mail Must Move: Mr. Plummer's side of the route */
  private async plummerBeat(): Promise<void> {
    if (!GS.flag('q_mail')) {
      await this.dlg.say(...DIALOGUE.q_mail_ask);
      GS.setFlag('q_mail');
      AUDIO.sfx('confirm');
      // Mr. Sodd's lawnmower takes its post — rebuild from data (ADR-014)
      this.fadeRestart();
      return;
    }
    const delivered = MAIL_FLAGS.filter((f) => GS.flag(f)).length;
    if (delivered < MAIL_FLAGS.length) {
      await this.dlg.say(...DIALOGUE.q_mail_active, `(${delivered} of ${MAIL_FLAGS.length} doors so far. The route remembers.)`);
      return;
    }
    if (!GS.flag('q_mail_done')) {
      const result = completeQuest('mail_must_move');
      if (result === 'hands-full') {
        await this.dlg.say(...DIALOGUE.q_mail_full);
        return;
      }
      GS.setFlag('q_mail_reported');
      AUDIO.sfx('confirm');
      await this.dlg.say(...DIALOGUE.q_mail_done_beat);
      AUDIO.jingle('victory', 1600, this.mapDef.music);
      return;
    }
    await this.dlg.say(...DIALOGUE.q_mail_after);
  }

  /** §A10 #2 — a letter lands; the door props are the five stops */
  private async mailDelivery(propSprite: string): Promise<boolean> {
    if (!GS.flag('q_mail') || GS.flag('q_mail_done')) return false;
    const stop = MAIL_DOORS[propSprite];
    if (!stop || GS.flag(stop.flag)) return false;
    await this.dlg.say(...DIALOGUE[stop.dialogue]);
    GS.setFlag(stop.flag);
    AUDIO.sfx('confirm');
    const delivered = MAIL_FLAGS.filter((f) => GS.flag(f)).length;
    toast(this, delivered < MAIL_FLAGS.length ? `The mail moves. (${delivered}/${MAIL_FLAGS.length})` : 'The route is COMPLETE. Tell Mr. Plummer.');
    return true;
  }

  /** §A10 #3 — Lemonade Empire: both twins run the same machine */
  private async twinsBeat(): Promise<void> {
    if (!GS.flag('q_lemonade')) {
      await this.dlg.say(...DIALOGUE.q_lemonade_ask);
      GS.setFlag('q_lemonade');
      GS.data.keyItems.push('lemonade_jug');
      AUDIO.sfx('confirm');
      return;
    }
    if (!GS.flag('q_lemonade_done')) {
      // hand over whatever's ready, in any order — each is its own step
      let took = false;
      if (!GS.flag('q_lem_sugar') && GS.hasItem('sugar_bag')) {
        GS.removeItem('sugar_bag');
        GS.setFlag('q_lem_sugar');
        AUDIO.sfx('confirm');
        await this.dlg.say(...DIALOGUE.lem_take_sugar);
        took = true;
      }
      if (!GS.flag('q_lem_lemons') && GS.hasItem('lemon_crate')) {
        GS.removeItem('lemon_crate');
        GS.setFlag('q_lem_lemons');
        AUDIO.sfx('confirm');
        await this.dlg.say(...DIALOGUE.lem_take_lemons);
        took = true;
      }
      if (!GS.flag('q_lem_water') && GS.flag('q_lem_jugfull')) {
        GS.setFlag('q_lem_water');
        AUDIO.sfx('confirm');
        await this.dlg.say(...DIALOGUE.lem_take_water);
        took = true;
      }
      if (GS.flag('q_lem_sugar') && GS.flag('q_lem_lemons') && GS.flag('q_lem_water')) {
        GS.setFlag('q_lem_poured');
        completeQuest('lemonade_empire'); // no reward item — the stand IS the reward
        const jug = GS.data.keyItems.indexOf('lemonade_jug');
        if (jug >= 0) GS.data.keyItems.splice(jug, 1); // it was always theirs
        await this.dlg.say(...DIALOGUE.lem_pour_beat);
        AUDIO.jingle('victory', 1600, this.mapDef.music);
        return;
      }
      if (!took) await this.dlg.say(...DIALOGUE.q_lemonade_active);
      return;
    }
    // §A10 #3's reward: infinite free lemonade, gated on the quest flag
    if (GS.addItem('lemonade')) {
      AUDIO.sfx('confirm');
      await this.dlg.say(...DIALOGUE.lem_free_drink);
    } else {
      const rex = GS.data.party[0];
      rex.hp = Math.min(rex.maxHp, rex.hp + (ITEMS.lemonade.heal ?? 12));
      AUDIO.sfx('heal');
      await this.dlg.say(...DIALOGUE.lem_free_full);
    }
  }

  /** §A10 #4 — Arcade Legend: Sal's side of the board. The cabinet sets
   *  q_arcade/q_arcade_beat (ArcadeScene); Sal arms, cheers, then pays out
   *  through the S9 bag flow — hands-full BLOCKS, zero missables. */
  private async salBeat(): Promise<void> {
    if (!GS.flag('q_arcade')) {
      await this.dlg.say(...DIALOGUE.q_arcade_ask);
      GS.setFlag('q_arcade');
      AUDIO.sfx('confirm');
      return; // nothing on this map gates on q_arcade — no rebuild needed
    }
    if (!GS.flag('q_arcade_beat')) {
      await this.dlg.say(...DIALOGUE.q_arcade_active);
      return;
    }
    if (!GS.flag('q_arcade_done')) {
      const result = completeQuest('arcade_legend');
      if (result === 'hands-full') {
        await this.dlg.say(...DIALOGUE.q_arcade_full);
        return;
      }
      GS.setFlag('q_arcade_claimed');
      AUDIO.sfx('confirm');
      await this.dlg.say(...DIALOGUE.q_arcade_claim_beat);
      AUDIO.jingle('victory', 1600, this.mapDef.music);
      return;
    }
    if (GS.flag('manager_defeated')) {
      await this.dlg.say(...DIALOGUE.q_arcade_after, ...DIALOGUE.sal_after_meeting);
      return;
    }
    await this.dlg.say(...DIALOGUE.q_arcade_after);
  }

  /** §A10 #4 — THE machine: pages, the play/walk-away ask, then ArcadeScene
   *  over a paused world (the ShopScene pattern; 'mf-arcade-closed'). The
   *  cabinet is endlessly replayable from any save — no flag ever gates it. */
  private async legendCabinetBeat(): Promise<void> {
    const pages = GS.flag('q_arcade_beat') ? DIALOGUE.cab_legend_yours : DIALOGUE.cab_legend;
    await this.dlg.say(...pages);
    const pick = await this.dlg.ask(['Step up to the machine', 'Walk away'], { cancelIndex: 1 });
    if (pick !== 0) return;
    this.game.events.once('mf-arcade-closed', () => {
      // the run may have set q_arcade/q_arcade_beat — nothing on this map
      // gates on them, so no rebuild; just put the room's music back on
      AUDIO.playMusic(this.mapDef.music);
      this.scene.resume();
    });
    this.scene.pause();
    this.scene.launch('arcade', {});
  }

  /** S9: quest sign beats — sniff clues + the spring; true = handled */
  private async signBeat(dialogueId: string): Promise<boolean> {
    // S10 §A10 #4: the ARCADE LEGEND cabinet at STARPORT II
    if (dialogueId === 'cab_legend') {
      await this.legendCabinetBeat();
      return true;
    }
    // S12: the cage's chalked bracket board
    if (dialogueId === 'cage_board') {
      await this.cageBoardBeat();
      return true;
    }
    if (dialogueId === 'q_biscuit_clue1') {
      await this.dlg.say(...DIALOGUE.q_biscuit_clue1);
      GS.setFlag('q_biscuit_c1');
      AUDIO.sfx('confirm');
      this.fadeRestart(); // the sniffed prints retire (prop unlessFlag)
      return true;
    }
    if (dialogueId === 'q_biscuit_clue2') {
      await this.dlg.say(...DIALOGUE.q_biscuit_clue2);
      GS.setFlag('q_biscuit_c2');
      AUDIO.sfx('confirm');
      this.fadeRestart();
      return true;
    }
    // S22 (ADR-119): Hodgkin's locked trail shed — opens with the Trail Key
    if (dialogueId === 'trail_shed') {
      if (!GS.flag('has_trail_key')) {
        await this.dlg.say(...DIALOGUE.trail_shed_locked);
        return true;
      }
      if (GS.flag('shed_looted')) {
        await this.dlg.say(...DIALOGUE.trail_shed_empty);
        return true;
      }
      await this.dlg.say(...DIALOGUE.trail_shed_open);
      GS.setFlag('shed_looted');
      GS.data.cashOnHand += 60;
      AUDIO.sfx('confirm');
      toast(this, 'The shed: +$60 (and a granola bar).');
      return true;
    }
    if (dialogueId === 'hill_spring') {
      if (GS.flag('q_lemonade') && !GS.flag('q_lemonade_done') && !GS.flag('q_lem_jugfull')) {
        await this.dlg.say(...DIALOGUE.spring_fill);
        GS.setFlag('q_lem_jugfull');
        AUDIO.sfx('heal');
        return true;
      }
      if (GS.flag('q_lem_jugfull') && !GS.flag('q_lem_water')) {
        await this.dlg.say(...DIALOGUE.spring_full);
        return true;
      }
      return false; // plain spring flavor
    }
    // S14 §A10 #6: A-to-shoot at the marked exhibits (camera in hand)
    if (dialogueId.startsWith('museum_idol_')) {
      const num = Number(dialogueId.slice(-1));
      if (
        GS.flag('q_museum') &&
        !GS.flag('q_museum_done') &&
        GS.data.keyItems.includes('camera') &&
        !GS.flag(`q_photo_${num}`)
      ) {
        this.cameras.main.flash(260, 248, 244, 220);
        AUDIO.sfx('fx_flash');
        GS.setFlag(`q_photo_${num}`);
        await this.dlg.say(...DIALOGUE[dialogueId]);
        const shot = [1, 2, 3, 4].filter((i) => GS.flag(`q_photo_${i}`)).length;
        toast(this, shot < 4 ? `CLICK. (${shot}/4 fakes on film.)` : 'CLICK. The whole sad collection. Tell the curator.');
        return true;
      }
      return false; // no quest/no camera/already shot: the plaque reads plain
    }
    // S14: the pyramid's mask switches — each press turns that room's floor
    // 90° clockwise; commit the flag, then rebuild from data (ADR-014)
    if (dialogueId.startsWith('pyr_mask_')) {
      const room = dialogueId.slice(-1);
      await this.dlg.say(...DIALOGUE[dialogueId]); // the mask gets its line
      const presses = (Number(GS.flag(`pyr_rot_${room}`)) || 0) + 1;
      GS.setFlag(`pyr_rot_${room}`, presses);
      AUDIO.sfx('thud');
      this.cameras.main.shake(420, 0.012);
      await this.dlg.say(...DIALOGUE.pyr_mask_turn);
      this.fadeRestart();
      return true;
    }
    // S17 M18 Part B (ADR-063): the two hero-signature SET caches (a coffee can
    // on the green, a market stall on the malecón). Each holds all five charms;
    // they're handed one at a time and each piece is remembered (a per-piece
    // flag), so a full bag never burns a charm — the cache simply waits with the
    // rest until you return (zero missables, §B4). The box opens (its master flag)
    // only once every piece is home.
    {
      const SET_CACHE: Record<string, readonly string[]> = {
        porch_can: ['firefly_jar', 'wind_chime_charm', 'whittled_whistle', 'bottle_cap_medallion', 'lucky_acorn'],
        mercado_stall: ['friendship_bracelet', 'evil_eye_bead', 'brass_gear_charm', 'tin_milagro', 'jade_frog'],
      };
      if (dialogueId in SET_CACHE) {
        const pieces = SET_CACHE[dialogueId];
        await this.dlg.say(...DIALOGUE[dialogueId]);
        let delivered = 0;
        let full = false;
        for (let i = 0; i < pieces.length; i++) {
          const pieceFlag = `${dialogueId}_${i}`;
          if (GS.flag(pieceFlag)) {
            delivered++;
            continue;
          }
          if (!GS.addItem(pieces[i])) {
            full = true;
            break;
          }
          GS.setFlag(pieceFlag);
          AUDIO.sfx('confirm');
          toast(this, `Got ${ITEMS[pieces[i]].name}!`);
          delivered++;
        }
        if (delivered >= pieces.length) {
          GS.setFlag(dialogueId); // the cache is empty — the box swaps to opened
          AUDIO.jingle('victory', 1600, this.mapDef.music);
          this.fadeRestart();
        } else if (full) {
          await this.dlg.say(...DIALOGUE.gift_hands_full);
        }
        return true;
      }
    }
    // S14: the grotto's chest run (the S9b gift-box pattern, three deep)
    if (dialogueId.startsWith('grotto_chest_')) {
      const loot: Record<string, string> = {
        grotto_chest_1: 'basket_basic',
        grotto_chest_2: 'alfajor',
        grotto_chest_3: 'glints_spark',
      };
      await this.dlg.say(...DIALOGUE[dialogueId]);
      const itemId = loot[dialogueId];
      if (!GS.addItem(itemId)) {
        await this.dlg.say(...DIALOGUE.gift_hands_full);
        return true; // nothing committed — come back with room
      }
      GS.setFlag(dialogueId);
      AUDIO.sfx('confirm');
      toast(this, `Got ${ITEMS[itemId].name}!`);
      this.fadeRestart();
      return true;
    }
    // S15i M3 (ADR-056): the deepened world's hidden presents — same gift-box
    // pattern (the long-walk legs + the grown Otterbrook woods nook). The closed
    // box swaps for the opened one (gated props); a full bag commits nothing, so
    // the reward waits until you have room (zero missables, §B4).
    {
      const loot: Record<string, string> = {
        meadow_gift_woods: 'basket_basic',
        meadow_gift_far: 'salt_shaker',
        otter_woods_gift: 'star_cola',
        oak_cache: 'star_cola', // the cave hollow's mossy cooler (ADR-121 rework; on the overlook ledge now)
        cave_gift_roots: 'corn_dog', // the Giant-Step rebuild's high-ledge prize (oak_roots L2)
        // S15i Task 4 (ADR-057): the grown Puerto Sol dock district's cached present
        ps_dock_gift: 'aloe_leaf',
        // S15i Task 6 (ADR-059): the Cage Park's bench-left basket + the Links cooler
        cage_park_gift: 'basket_basic',
        golf_resort_gift: 'star_cola',
        // S17 M18 Part B (ADR-063): the Americas valuables (sell-fodder loot) + the
        // two story keys, each a one-grant gift box scattered where its joke lands
        gift_hubcap: 'spare_hubcap', // Otterbrook pond fence — "worth more to Earl"
        gift_fools_idol: 'fools_gold_idol', // the Gilded Ruins' gate ramp
        gift_emerald: 'emerald', // deep jungle, kept in the bark
        gift_doubloon: 'gold_doubloon', // Puerto Sol dockside
        gift_boat_ticket: 'banana_boat_ticket', // the §A5 cargo passage stub
        gift_wish_token: 'wish_token', // the idol's bowl, post-Grin
      };
      if (dialogueId in loot) {
        const itemId = loot[dialogueId];
        await this.dlg.say(...DIALOGUE[dialogueId]);
        if (!GS.addItem(itemId)) {
          await this.dlg.say(...DIALOGUE.gift_hands_full);
          return true; // nothing committed — come back with room
        }
        GS.setFlag(dialogueId);
        AUDIO.sfx('confirm');
        toast(this, `Got ${ITEMS[itemId].name}!`);
        this.fadeRestart();
        return true;
      }
    }
    // S15i Task 3 (ADR-058) — Ch.1 #5: the WALKERS' REGISTER post. Signing it
    // completes the route quest (reward + caller via completeQuest); a full bag
    // commits nothing, so the charm waits (zero missables).
    if (dialogueId === 'walkers_register_book') {
      if (GS.flag('q_walkreg_done')) {
        await this.dlg.say(...DIALOGUE.walkers_register_after);
        return true;
      }
      if (!GS.flag('q_walkreg')) {
        await this.dlg.say(...DIALOGUE.walkers_register_book); // the dusty ledger (quest not yet taken)
        return true;
      }
      const seenAll = ['q_walkreg_mile', 'q_walkreg_woods', 'q_walkreg_far'].every((f) => GS.flag(f));
      if (!seenAll) {
        await this.dlg.say(...DIALOGUE.walkers_register_wait);
        return true;
      }
      const result = completeQuest('walkers_register');
      if (result === 'hands-full') {
        await this.dlg.say(...DIALOGUE.walkers_register_full);
        return true;
      }
      GS.setFlag('q_walkreg_signed');
      AUDIO.sfx('confirm');
      await this.dlg.say(...DIALOGUE.walkers_register_sign);
      AUDIO.jingle('victory', 1600, this.mapDef.music);
      return true;
    }
    // S9b: the twins' presents — open once, the empty box stays (gated props)
    if (dialogueId === 'gift_ana' || dialogueId === 'gift_vivi') {
      const ana = dialogueId === 'gift_ana';
      await this.dlg.say(...DIALOGUE[dialogueId]);
      if (!GS.addItem(ana ? 'star_cola' : 'corn_dog')) {
        await this.dlg.say(...DIALOGUE.gift_hands_full);
        return true; // nothing committed — come back with room
      }
      GS.setFlag(ana ? 'ana_gift_open' : 'vivi_gift_open');
      AUDIO.sfx('confirm');
      await this.dlg.say(...DIALOGUE[ana ? 'gift_ana_got' : 'gift_vivi_got']);
      this.fadeRestart(); // the closed box swaps for the opened one
      return true;
    }
    return false;
  }

  /** S4 (Prompt 20): phones list contacts — Dad saves, Mom cures Homesick.
   *  Pemberton and Pizza-to-Go join the list behind later story flags. */
  private async phoneFlow(): Promise<void> {
    AUDIO.sfx('phone');
    await this.dlg.say(...DIALOGUE.phone_pickup);
    const pick = await this.dlg.ask(['Call Dad', 'Call Mom', 'Hang up'], { cancelIndex: 2 });
    if (pick === 0) await this.callDad();
    else if (pick === 1) await this.callMom();
  }

  /** Dad's save + deposit flow (Prompt 22/S2). S6: the save lands in one of
   *  three slots — Dad asks "Which notebook?" on his FIRST save, then reuses
   *  it for the whole playthrough. The contact flow around this is untouched. */
  private async callDad(): Promise<void> {
    const gift = GS.flag('dad_first_deposit') ? 0 : 50;
    GS.setFlag('dad_first_deposit');
    const deposit = gift + GS.data.pendingDeposit;
    const pages = [...DIALOGUE.phone_dad];
    pages[2] =
      deposit > 0
        ? `@I put $${deposit} into your account. Don't spend it all on corn dogs. Spend MOST of it on corn dogs.`
        : `@Account's holding steady, champ. Like my love for you. Which is also money, somehow.`;
    GS.data.banked += deposit;
    GS.data.pendingDeposit = 0;
    await this.dlg.say(...pages);
    GS.data.map = this.mapDef.id;
    if (GS.activeSlot === null) {
      await this.dlg.say(...DIALOGUE.dad_slot_ask);
      const rows = GS.slotPeeks().map((p, i) =>
        p === 'empty'
          ? `Notebook ${SLOT_IDS[i]}: new page`
          : p === 'corrupt'
            ? `Notebook ${SLOT_IDS[i]}: smudged`
            : `Notebook ${p.slot}: ${p.name} L${p.level}`,
      );
      const idx = await this.dlg.ask(rows); // no cancel — Dad needs a notebook
      GS.saveTo(SLOT_IDS[idx]);
    } else {
      GS.saveTo(GS.activeSlot);
    }
    AUDIO.sfx('confirm');
    await this.dlg.say(...DIALOGUE.save_done);
  }

  /** Mom asks about {favoritefood}; her voice is the Homesick cure (§A4.4) */
  private async callMom(): Promise<void> {
    if (this.mapDef.id === 'rex_home') {
      await this.dlg.say(...DIALOGUE.phone_mom_home);
      return;
    }
    if (GS.flag('rex_homesick')) {
      await this.dlg.say(...DIALOGUE.phone_mom_cure);
      GS.setFlag('rex_homesick', false);
      AUDIO.sfx('heal');
      await this.dlg.say(...DIALOGUE.mom_cure_beat);
      return;
    }
    await this.dlg.say(...DIALOGUE.phone_mom);
  }

  /** S4: the SAVINGS & LOAN's ATM — withdraw/deposit between the card
   *  (GS.data.banked, where Dad deposits) and cash on hand (Prompt 20) */
  /** S4 (Prompt 20) · ADR-105: the ATM. Withdraw/Deposit DIAL a chosen amount on
   *  an ODOMETER (`askAmount`/`amountColumns`) — every place value is its own
   *  digit column (thousands/hundreds/tens/…), all visible, each scrollable —
   *  instead of the old three fixed presets. The columns scale with the balance
   *  ($1k/$100/$10/$1 on a four-figure card, up to $1B on a ten-figure one), and
   *  the dialled amount clamps to the pool. */
  private async atmFlow(): Promise<void> {
    AUDIO.sfx('confirm');
    await this.dlg.say(...DIALOGUE.atm_greet);
    for (;;) {
      await this.dlg.say(`CARD ${money(GS.data.banked)}   CASH ${money(GS.data.cashOnHand)}`);
      const op = await this.dlg.ask(['Withdraw', 'Deposit', 'Done'], { cancelIndex: 2 });
      if (op === 2) break;
      const pool = op === 0 ? GS.data.banked : GS.data.cashOnHand;
      if (pool <= 0) {
        await this.dlg.say(...(op === 0 ? DIALOGUE.atm_empty_card : DIALOGUE.atm_empty_pocket));
        continue;
      }
      // the smart-scale dialler runs over the LIVE overworld — hold the dialogue
      // lock (the §888 movement/interact gate reads dlg.busy) so the player can't
      // walk off or re-trigger the ATM while the widget is open.
      this.dlg.busy = true;
      const chosen = await askAmount(this, {
        pool,
        title: op === 0 ? 'WITHDRAW' : 'DEPOSIT',
        source: op === 0 ? 'from your CARD' : 'from your CASH',
      });
      this.dlg.busy = false;
      if (chosen === null || chosen <= 0) continue;
      const moved = op === 0 ? GS.withdraw(chosen) : GS.deposit(chosen);
      AUDIO.sfx('confirm');
      await this.dlg.say(
        op === 0
          ? `* Withdrew ${money(moved)}. The bills are warm, somehow.`
          : `* Deposited ${money(moved)}. The machine swallowed politely.`,
      );
    }
    await this.dlg.say(...DIALOGUE.atm_bye);
  }

  /** S4: ShopScene runs over a paused world, the MenuScene pattern */
  private openShop(shopId: string): void {
    this.game.events.once('mf-shop-closed', () => {
      // gear may have moved between bags in there
      this.rebuildFollowers();
      this.scene.resume();
    });
    this.scene.pause();
    this.scene.launch('shop', { shopId });
  }

  /** START opens the real EB command menu (S3) — MenuScene runs over a
   *  paused world, exactly like battle, and tells us when it's done */
  private pauseMenu(): void {
    AUDIO.sfx('cursor');
    this.game.events.once('mf-menu-closed', () => {
      // a Spark may have revived someone, gear may have moved (S3)
      this.rebuildFollowers();
      this.scene.resume();
      // §A4.5 (S14): a basket Used at a table closes the menu ONTO the picnic
      const basket = this.registry.get('picnicBasket') as string | undefined;
      if (basket) {
        this.registry.remove('picnicBasket');
        const table = this.nearestTable();
        if (table) void this.picnicScene(table, basket);
      }
    });
    this.scene.pause();
    this.scene.launch('menu', { music: this.mapDef.music });
  }

  /* ---------------- §A4.5 PICNIC (S14 — Bible Prompt 23) ---------------- */

  /** the picnic table within arm's reach of the player, if any */
  private nearestTable(): PropDef | null {
    for (const p of this.mapDef.props) {
      if (p.sprite !== 'picnic') continue;
      if (Math.hypot(p.x * TILE_PX + s(18) - this.player.x, p.y * TILE_PX + s(12) - this.player.y) < s(44)) return p;
    }
    return null;
  }

  /** best basket in anyone's bag — the Feast outranks the Family outranks Basic */
  private bestBasket(): string | null {
    for (const id of ['basket_feast', 'basket_family', 'basket_basic']) {
      if (GS.hasItem(id)) return id;
    }
    return null;
  }

  private async picnicFlow(table: PropDef): Promise<void> {
    AUDIO.sfx('cursor');
    const basket = this.bestBasket();
    if (!basket) {
      await this.dlg.say(...DIALOGUE.picnic_no_basket);
      return;
    }
    await this.dlg.say(...DIALOGUE.picnic_spot);
    const pick = await this.dlg.ask([`Spread the ${ITEMS[basket].name}`, 'Not now'], { cancelIndex: 1 });
    if (pick !== 0) return;
    await this.picnicScene(table, basket);
  }

  /**
   * The §A4.5 ritual: the blanket unrolls, the party sits, birds land
   * (ADR-020 discipline — deliberate, small), full HP/PP comes back, and
   * SUNNY SIDE arms for the next five battles (flag-persisted remainder —
   * no save step; battle reads it through the sunnyMul() seam). A Feast
   * additionally arms the one-shot party auto-revive.
   */
  private async picnicScene(table: PropDef, basket: string): Promise<void> {
    this.cut = true;
    GS.removeItem(basket);
    AUDIO.sfx('confirm');
    const bx = table.x * TILE_PX + s(18);
    const by = table.y * TILE_PX + s(34);
    // the blanket unrolls
    const blanket = this.add.image(bx, by, 'picnic_blanket').setOrigin(0.5, 0.5).setDepth(by - s(24)).setScale(0.15, 1);
    await new Promise<void>((r) => {
      this.tweens.add({ targets: blanket, scaleX: 1, duration: 320, ease: 'sine.out', onComplete: () => r() });
    });
    // the party sits around it (followers settle onto the blanket's corners)
    const seats: Array<[number, number]> = [
      [bx - s(14), by + s(6)],
      [bx + s(14), by + s(6)],
      [bx - s(14), by - s(4)],
      [bx + s(14), by - s(4)],
    ];
    this.followers.forEach((f, i) => {
      const [sx, sy] = seats[(i + 1) % seats.length];
      if (!f.angel) {
        f.spr.setPosition(sx, sy);
        f.spr.anims.stop();
        f.spr.setFrame(standFrame(sx < bx ? 'right' : 'left'));
        f.spr.setDepth(sy);
      }
    });
    this.player.setPosition(seats[0][0], seats[0][1]);
    this.player.setFrame(standFrame('right'));
    this.player.setDepth(seats[0][1]);
    // birds land — two, from offscreen, with a hop
    const birds = [0, 1].map((i) => {
      const b = this.add.sprite(bx + (i === 0 ? -s(30) : s(34)), by - s(60), 'songbird', 0).setDepth(by + s(20));
      this.tweens.add({ targets: b, y: by + s(14) + i * s(4), x: bx + (i === 0 ? -s(24) : s(26)), duration: 700 + i * 180, ease: 'sine.in' });
      return b;
    });
    await this.wait(900);
    birds.forEach((b, i) => {
      b.setFrame(1); // the landing hop
      this.time.delayedCall(300 + i * 150, () => b.setFrame(0));
    });
    await this.dlg.say(...DIALOGUE.picnic_scene);
    // full restore for everyone still standing (angels wait for hospitals)
    GS.data.party.forEach((h) => {
      if (!h.down) {
        h.hp = h.maxHp;
        h.pp = h.maxPp;
      }
    });
    AUDIO.sfx('heal');
    this.sparkleBurst(bx, by - s(8), 12);
    GS.setFlag('sunny_side', SUNNY_BATTLES);
    if (basket === 'basket_feast') {
      GS.setFlag('feast_armed');
      await this.dlg.say(...DIALOGUE.picnic_feast);
    }
    AUDIO.jingle('levelup', 1400, this.mapDef.music);
    toast(this, `SUNNY SIDE! +10% everything, next ${SUNNY_BATTLES} battles!`);
    await this.wait(600);
    birds.forEach((b) => {
      this.tweens.add({ targets: b, y: b.y - s(70), x: b.x + s(30), alpha: 0, duration: 600, onComplete: () => b.destroy() });
    });
    this.tweens.add({ targets: blanket, alpha: 0, duration: 500, delay: 300, onComplete: () => blanket.destroy() });
    this.cut = false;
  }

  /* ---------------- doors & triggers ---------------- */

  private async checkDoors(): Promise<void> {
    // ADR-052 + the RE-ARM guard: a door fires only once the player has STEPPED OFF
    // its zone since arriving (doorsArmed). This kills the exit-bounce SOFT-LOCK —
    // a spawn that lands on a door (where a build-time doorstep can mismatch the
    // texture-derived collision) would otherwise re-fire forever. `doorCooldown`
    // still gives a brief settle; arming is tracked even while it counts down.
    const cooling = this.doorCooldown > 0;
    for (const d of this.mapDef.doors) {
      const r = { x: d.x * TILE_PX, y: d.y * TILE_PX, w: d.w * TILE_PX, h: d.h * TILE_PX };
      const inZone =
        this.player.x > r.x &&
        this.player.x < r.x + r.w &&
        this.player.y - s(4) > r.y &&
        this.player.y - s(4) < r.y + r.h;
      if (!inZone) {
        this.doorsArmed.add(d); // stepped clear → armed for next entry
        continue;
      }
      if (cooling || !this.doorsArmed.has(d)) continue; // spawned on it / still settling
      this.doorsArmed.delete(d);
      // THE DAYBREAK GATE (S15i Task 0) + THE HUSH-DARK GATE (ADR-121): the road
      // east stays shut until the Titanic Tick is killed. First it's the sleeping
      // 2 AM town (zapper_done); then the Hush-dark fogs the road while the Tick
      // feeds. A diegetic reason, not an invisible wall — the barricade reads it,
      // this catches anyone skirting the verge. tick_defeated is the single key out.
      if (d.to === 'meadow_mile' && !GS.flag('tick_defeated')) {
        this.cut = true;
        AUDIO.sfx('cancel');
        await this.dlg.say(...(GS.flag('zapper_done') ? DIALOGUE.meadow_gate_hushdark : DIALOGUE.meadow_gate_asleep));
        this.cut = false;
        this.doorCooldown = OverworldScene.DOOR_REENTRY_MS;
        return;
      }
      // Lucille's cabin: remember the boarding frontier, and route the hatch back there
      // (not to Ch.3 foggybottom) when a Ch.4+ party declines the flight and walks out.
      if (d.to === 'biplane_interior') this.rememberLucilleOrigin();
      if (this.mapDef.id === 'biplane_interior' && d.to === 'foggybottom') {
        const back = this.lucilleReturnDoor();
        if (back) {
          this.goThroughDoor(back.to, back.tx, back.ty, 'up');
          return;
        }
      }
      // S11b: a real door swings OPEN before it admits you
      if ((d.indicator ?? (this.mapDef.interior ? 'mat' : 'none')) === 'door') {
        this.goThroughInteriorDoor(d);
      } else {
        this.goThroughDoor(d.to, d.tx, d.ty, d.facing);
      }
      return;
    }
    for (const p of this.mapDef.props) {
      if (!p.door) continue;
      // ADR-051: prefer the texture-true entrance zone (a facade re-fitted to its
      // real sprite moves its doorstep with it), else the map data's zone
      const r = this.facadeDoorBox.get(p) ?? {
        x: p.x * TILE_PX + s(p.door.ox),
        y: p.y * TILE_PX + s(p.door.oy),
        w: s(p.door.w),
        h: s(p.door.h),
      };
      const inZone =
        this.player.x > r.x &&
        this.player.x < r.x + r.w &&
        this.player.y > r.y &&
        this.player.y < r.y + r.h;
      if (!inZone) {
        this.doorsArmed.add(p);
        continue;
      }
      if (cooling || !this.doorsArmed.has(p)) continue;
      this.doorsArmed.delete(p);
      if (p.door.to === 'dos_f1' && (await this.bricktonDepartmentGate())) return;
      // §A11 the Big-Little gate — a duchy building is thimble-small; the colossi may step inside
      // only once the Big-Little Lens can fold the party down to duchy scale (else turned away).
      if (
        MINIMUS_SKIN_MAPS.has(this.mapDef.id) &&
        (p.sprite.startsWith('bldg_') || LANDMARK_FACADE_SPRITES.has(p.sprite))
      ) {
        if (!(await this.duchyShrinkGate())) {
          this.doorCooldown = OverworldScene.DOOR_REENTRY_MS;
          return;
        }
      }
      this.goThroughDoor(p.door.to, p.door.tx, p.door.ty, 'up');
      return;
    }
  }

  /** The Department's appointment gate — DIAL-ONLY since the Minute moved to
   *  Valle Dorado (stage 4, the big city; user directive 2026-07-08). One story
   *  in Twoton now: THE WARM DIAL TONE at the bus-corner payphone. */
  private async bricktonDepartmentGate(): Promise<boolean> {
    if (this.mapDef.id !== 'brickton' || GS.flag('faye_joined')) return false;
    if (GS.flag('brickton_dial_goal')) {
      if (!GS.flag('brickton_goals_ready')) {
        this.cut = true;
        AUDIO.sfx('confirm');
        await this.dlg.say(...DIALOGUE.brickton_goal_gate_ready);
        GS.setFlag('brickton_goals_ready');
        this.cut = false;
      }
      return false;
    }
    this.cut = true;
    AUDIO.sfx('cursor');
    await this.dlg.say(...DIALOGUE.brickton_goal_gate_none);
    this.cut = false;
    return true;
  }

  private goThroughDoor(to: string, tx: number, ty: number, facing: Facing): void {
    if (this.transitioning) return;
    this.transitioning = true;
    clearPuppetLock(); // §2.3: leaving the map ends the Held-Breath Puppet-lock (NOT a rewind-restart, which keeps it)
    // tx/ty are NATIVE door-target pixels (map-data d.tx/d.ty, spawn constants,
    // or literals) → scale to the runtime space GS.data.x/y lives in. ALL callers
    // pass native px, so the single scale here covers every door (ADR scale-conv).
    const rx = s(tx);
    const ry = s(ty);
    // S7 juice: doors whoosh and the camera leans in with you. zoomTo(1.08)/
    // setZoom(1) are ZOOM FACTORS — unchanged (frame + tiles both scale ×ART_SCALE).
    AUDIO.sfx('whoosh');
    this.cameras.main.zoomTo(1.08, 220, 'Sine.easeIn');
    this.cameras.main.fadeOut(220, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.cameras.main.setZoom(1);
      this.scene.restart({ mapId: to, x: rx, y: ry, facing });
    });
  }

  /**
   * S11b: an interior DOOR opens before it admits you — closed?open swap +
   * the creak, a short hold so the swing reads, then the S7 whoosh path.
   * Re-entry rebuilds the scene from data, so the door stands closed again.
   */
  private goThroughInteriorDoor(d: DoorZone): void {
    if (this.transitioning) return;
    this.transitioning = true;
    AUDIO.sfx('door_creak');
    this.doorImgs.get(d)?.setTexture('door_int_open');
    this.time.delayedCall(260, () => {
      this.transitioning = false; // hand off to the standard whoosh path
      this.goThroughDoor(d.to, d.tx, d.ty, d.facing);
    });
  }

  /** Ch.4+ frontiers all board Lucille from a doorstep, but the cabin's static hatch is
   *  wired to Ch.3 foggybottom — so a late-game party that boards and then declines the
   *  flight would be dumped into old England. Remember the boarding frontier (a numeric
   *  flag, so no save-schema change) and route the hatch back to its own doorstep. Index
   *  0 (foggybottom / unset) keeps the original Ch.3 hatch untouched. */
  private static readonly LUCILLE_ORIGINS = [
    'foggybottom', 'kvisthavn', 'minimus_major', 'zanzibel',
    'chandrapore', 'lotus_harbor', 'valea_stelelor', 'aurora_station',
  ];

  private rememberLucilleOrigin(): void {
    const idx = OverworldScene.LUCILLE_ORIGINS.indexOf(this.mapDef.id);
    GS.setFlag('lucille_from', idx > 0 ? idx : 0);
  }

  /** the cabin hatch's real destination: the frontier the party boarded from (its own
   *  boarding doorstep, read from map data so it can't drift), or null to keep the
   *  original Ch.3 foggybottom hatch (the first flight / never-boarded default). */
  private lucilleReturnDoor(): { to: string; tx: number; ty: number } | null {
    const raw = GS.flag('lucille_from');
    const idx = typeof raw === 'number' ? raw : 0;
    const origin = OverworldScene.LUCILLE_ORIGINS[idx];
    if (!origin || origin === 'foggybottom') return null; // Ch.3 flight → original hatch
    const board = MAPS[origin]?.doors.find((dr) => dr.to === 'biplane_interior');
    return board ? { to: origin, tx: board.x * 16, ty: board.y * 16 } : null;
  }

  /** small heel-dust puff while running (S7 juice) */
  private dustPuff(x: number, y: number): void {
    const puff = this.add.sprite(x, y, 'dust', 0).setDepth(y - 1).setAlpha(0.85);
    this.time.delayedCall(90, () => puff.setFrame(1));
    this.tweens.add({
      targets: puff,
      y: y - s(4),
      alpha: 0,
      duration: 240,
      onComplete: () => puff.destroy(),
    });
  }

  /** radial gold sparkle burst for Ember moments (S7 juice, Prompt 39) */
  private sparkleBurst(x: number, y: number, count = 10): void {
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const dist = s(14) + Math.random() * s(16); // px throw radius
      const sp = this.add
        .sprite(x, y, 'spark', i % 2)
        .setDepth(9999)
        .setScale(0.8 + Math.random() * 0.6); // setScale multiplier — unscaled
      this.tweens.add({
        targets: sp,
        x: x + Math.cos(ang) * dist,
        y: y + Math.sin(ang) * dist - s(6),
        alpha: 0,
        scale: 0.3,
        duration: 520 + Math.random() * 260,
        ease: 'cubic.out',
        onComplete: () => sp.destroy(),
      });
    }
  }

  private insideTriggers = new Set<string>();

  private checkTriggers(): void {
    const txi = Math.floor(this.player.x / TILE_PX);
    const tyi = Math.floor((this.player.y - s(4)) / TILE_PX);
    for (const t of this.mapDef.triggers) {
      const inside =
        txi >= t.rect.x && txi < t.rect.x + t.rect.w && tyi >= t.rect.y && tyi < t.rect.y + t.rect.h;
      if (!inside) {
        this.insideTriggers.delete(t.id);
        continue;
      }
      // edge-trigger: fire on entry, not every frame while standing in it
      if (this.insideTriggers.has(t.id)) continue;
      this.insideTriggers.add(t.id);
      void this.runTrigger(t.id);
    }
  }

  /* ---------------- cutscenes (Ch.1 per §A6 / ADR-007) ---------------- */

  private async onEnterCutscenes(): Promise<void> {
    if (this.mapDef.id === 'bus_interior') {
      await this.busCutscene();
      return;
    }
    if (this.mapDef.id === 'boat_interior') {
      await this.boatCutscene();
      return;
    }
    // ADR-118 rework — booked: you arrive INSIDE the station cell mid-march, and
    // Borden's holding-cell beat + the cop fight fire here (not a fake fade).
    if (this.mapDef.id === 'otter_station' && GS.flag('borden_marching') && !GS.flag('borden_cleared')) {
      await this.bordenCellBeat();
      return;
    }
    // Ch.1 opening — a 4-phase cinematic across hickory_hill → otterbrook →
    // hickory_hill → rex_bedroom (engine/opening.ts), each re-entered after a cut.
    switch (this.opPhase()) {
      // the opening is ONE continuous cinematic on otterbrook now (the crater is on this
      // elevated map): phase 1 runs meteor-fall → house pan → hill climb INLINE, then cuts
      // to rex_bedroom for the wake (phase 4). No more map-hopping between beats.
      case 1: this.openingRequested = false; await this.playOpeningCinema(); return;
      case 4: await this.introScene(); return;
    }
    if (this.registry.get('defeated') === true) {
      this.registry.set('defeated', false);
      this.cut = true;
      await this.dlg.say(
        `${GS.hero('rex')?.name ?? 'Jay'}... pick yourself up.`,
        'The hill is still out there. So is breakfast. Handle both.',
      );
      this.cut = false;
    }
    if (this.mapDef.id === 'otterbrook' && GS.flag('intro_done') && !GS.flag('chad_joined')) {
      await this.chadJoinScene();
    }
    if (this.mapDef.id === 'brickton' && GS.flag('bus_ride_done') && !GS.flag('brickton_arrival_done')) {
      await this.bricktonArrivalScene();
    }
    // S2: stepping onto the street after the Department falls — Mom's already dialing
    if (this.mapDef.id === 'brickton' && this.momCallPending()) {
      this.cut = true;
      AUDIO.sfx('phone');
      await this.dlg.say(...DIALOGUE.payphone_far);
      this.cut = false;
    }
    // ADR-131: the first daylight after Glint's porch is the HUSH-DARK. create() has
    // already rebuilt the world cold + hazed (buildNight on this.hushDark), so the
    // player is LOOKING at the wrong-coloured morning; this one-time note NAMES it —
    // a drained STATE to break (kill the Heart-Oak Tick), not a render glitch. Fires
    // on the first Hush-dark map entered (Otterbrook or the hill) and never again; the
    // haze itself lifts when tick_defeated breaks the real dawn (tick_after).
    if (
      CH1_STORY_NIGHT_MAPS.has(this.mapDef.id) &&
      GS.flag('zapper_done') &&
      !GS.flag('tick_defeated') &&
      !GS.flag('hush_dark_noticed')
    ) {
      GS.setFlag('hush_dark_noticed');
      this.cut = true;
      await this.dlg.say(...DIALOGUE.dawn_hush_dark);
      this.cut = false;
    }
  }

  private async runTrigger(id: string): Promise<void> {
    switch (id) {
      case 'wake_up':
        if (!GS.flag('intro_done')) await this.introScene();
        break;
      case 'crater':
        // ADR-121: the first-night crater fight is the HUSH SENTINEL (repelled,
        // not killed). The Tick is no longer here — it relocates to the Heart Oak.
        if (!GS.flag('sentinel_repelled')) await this.craterScene();
        break;
      case 'porch':
        if (GS.flag('sentinel_repelled') && !GS.flag('zapper_hit')) await this.porchScene();
        break;
      // ADR-121: the Titanic Tick has burrowed into the Heart Oak in Pond Park and
      // is draining the town's Vibe (the Hush-dark). Daytime-only, once the town has
      // woken from the meteor night; clears when the Tick dies (real dawn).
      case 'heart_oak':
        if (GS.flag('zapper_done') && !GS.flag('tick_defeated')) await this.heartOakScene();
        break;
      // (the old center bus_stop redirect retired for good — the Transit Depot
      // sits ON the drag now, two storefronts from the old corner; the trigger
      // and its signage are gone from the map data too)
      case 'depot_board':
        // ADR-121: the 6:15 stays dark while the Tick feeds — the Hush-dark has the
        // town too quiet to run a bus. Killing the Tick floods the Vibe back, the
        // roads clear, and the highway (and the 6:15) reopen. tick_defeated is the
        // single key out of Otterbrook.
        if (GS.flag('tick_defeated')) await this.busAsk('brickton');
        else await this.dlg.say(...DIALOGUE.bus_closed_detour);
        break;
      case 'bus_stop_brickton':
        await this.busAsk('otterbrook');
        break;
      case 'orientation_gate':
        await this.orientationGateScene();
        break;
      // S15i Task 3 (ADR-058) — THE WALKERS' REGISTER's three "noticing" tokens:
      // one trigger id per leg, the flag chosen by which leg you're on. Fires only
      // while the quest is live; non-missable (re-cross any leg to catch a missed one).
      case 'walk_token': {
        const tokenFlag: Record<string, string> = {
          meadow_mile: 'q_walkreg_mile', meadow_woods: 'q_walkreg_woods', meadow_far: 'q_walkreg_far',
        };
        const flag = tokenFlag[this.mapDef.id];
        if (flag && GS.flag('q_walkreg') && !GS.flag('q_walkreg_done') && !GS.flag(flag)) {
          GS.setFlag(flag);
          AUDIO.sfx('ember');
          this.sparkleBurst(this.player.x, this.player.y - s(14), 8);
          const seen = ['q_walkreg_mile', 'q_walkreg_woods', 'q_walkreg_far'].filter((f) => GS.flag(f)).length;
          toast(this, `You really looked. (${seen}/3 stretches noticed.)`);
        }
        break;
      }
      // S15i M3 (ADR-056) — THE LONG WALK's two flag-gated cutscene beats
      case 'woods_vignette':
        if (!GS.flag('woods_vignette_done')) await this.walkBeat('woods_vignette');
        break;
      case 'city_reveal':
        if (!GS.flag('city_reveal_done')) await this.cityRevealScene();
        break;
      case 'brickton_clock_goal':
        // THE GOLDEN MINUTE — lives on Valle Dorado's clock plaza now (stage 4,
        // the big city; user directive 2026-07-08). Fires once, any chapter.
        if (!GS.flag('brickton_clock_goal')) await this.bricktonClockGoalScene();
        break;
      case 'brickton_dial_goal':
        if (!GS.flag('faye_joined') && !GS.flag('brickton_dial_goal')) await this.bricktonDialGoalScene();
        break;
      case 'faye_meet':
        if (GS.flag('holding_open') && !GS.flag('faye_joined')) await this.fayeJoinScene();
        break;
      case 'manager_block':
        if (GS.flag('faye_joined') && !GS.flag('manager_defeated')) await this.managerScene();
        break;
      case 'payphone_ring':
        if (this.momCallPending()) {
          this.cut = true;
          AUDIO.sfx('phone');
          await this.dlg.say(...DIALOGUE.payphone_ringing);
          this.cut = false;
        }
        break;
      /* ---------------- S21 (ADR-126/127/128) — the Held Breath, the Axes, the ending ----------------
       * Fired by TriggerDef walk-zones the ch6/9/10 maps place at their dramatic beats. The
       * flows are once-only + retry-safe; pure logic lives in src/engine/{choice,echo,ending}. */
      case 'held_breath_unlock':
        await this.heldBreathBeat();
        break;
      case 'choice_trust':
        await this.runChoice('ch6_string');
        break;
      case 'choice_compassion':
        // the COMPASSION axis turns on the Count's defeat — gated so the zone past the
        // throne cannot fire the dilemma before the fight (runChoice self-gates once decided)
        if (GS.flag('count_hoaxula_defeated')) await this.runChoice('ch9_count');
        break;
      case 'choice_finale':
        // the Hush speaks, the STRINGS player gives the choice to Mia, CHOICE 3 is set,
        // and the FORGIVE-viability gate may force Silence (the full beat, not just the pick)
        await this.theFinaleChoiceScene();
        break;
      case 'compose_ending':
        await this.playEnding();
        break;
      /* ---------------- S14 — Chapter 2 (§A6) ---------------- */
      case 'board_boat':
        await this.boatAsk('docks');
        break;
      case 'board_boat_return':
        await this.boatAsk('puerto');
        break;
      case 'puerto_arrival':
        this.cut = true;
        await this.dlg.say(...DIALOGUE.puerto_arrival);
        this.cut = false;
        break;
      // S15i Task 4 (ADR-057): the grown DOCK DISTRICT's flag-gated waterfront beat —
      // a warm look over the working harbor on first crossing into the new malecón
      case 'puerto_malecon':
        if (!GS.flag('puerto_malecon_done')) await this.puertoMaleconScene();
        break;
      // S15i Task 6 (ADR-059): the CAGE PARK's first-arrival beat (the approach reveal)
      case 'cage_park_reveal':
        if (!GS.flag('cage_park_reveal_done')) await this.cageParkScene();
        break;
      // S15i Task 6 (ADR-059): the GOLF RESORT's first-arrival beat (the estates reveal)
      case 'golf_resort_reveal':
        if (!GS.flag('golf_resort_reveal_done')) await this.golfResortScene();
        break;
      case 'valle_arrival':
        if (!GS.flag('grin_defeated')) {
          this.cut = true;
          await this.dlg.say(...DIALOGUE.valle_arrival);
          this.cut = false;
        } else if (!GS.flag('ch2_complete')) {
          await this.valleRecoveryScene();
        }
        break;
      case 'pyramid_approach':
        this.cut = true;
        await this.dlg.say(...DIALOGUE.pyramid_approach);
        this.cut = false;
        break;
      case 'apex_grin':
        if (!GS.flag('grin_defeated')) await this.grinScene();
        break;
      /* ---------------- ADR-099 — Chapter 3 (§A6 England) ---------------- */
      case 'ch3_arrival':
        if (!GS.flag('ch3_arrived')) await this.ch3ArrivalScene();
        break;
      case 'wm_arrival':
        if (!GS.flag('milo_joined')) await this.wintermoorArrivalScene();
        break;
      case 'mainframe_boss':
        if (!GS.flag('mainframe_defeated')) await this.mainframeBossScene();
        break;
      case 'old_stones_resonance':
        if (!GS.flag('ch3_complete')) await this.oldStonesScene();
        break;
      case 'wintermoor_coolant':
        await this.coolantGate();
        break;
      /* ---------------- Chapter 4 (§A6 Norway) ---------------- */
      case 'ch4_arrival':
        if (!GS.flag('ch4_arrived')) await this.ch4ArrivalScene();
        break;
      case 'whisperwig_boss':
        if (!GS.flag('whisperwig_defeated')) await this.whisperwigBossScene();
        break;
      case 'sleepers_ear_resonance':
        if (!GS.flag('ch4_complete')) await this.sleepersEarScene();
        break;
      case 'spine_meltfall':
        await this.meltfallGate();
        break;
      case 'moor_bridge_berry':
        if (!GS.flag('moor_berry_cleared')) await this.bridgeBerryScene();
        break;
      /* ---------------- Chapter 5 (§A6 Minimus) ---------------- */
      case 'ch5_arrival':
        if (!GS.flag('ch5_arrived')) await this.ch5ArrivalScene();
        break;
      case 'big_little_lens':
        if (!GS.flag('big_little_lens_built')) await this.bigLittleLensScene();
        break;
      case 'the_hedgerow_lens':
        if (!GS.flag('hedgerow_lens_seen')) await this.hedgerowLensScene();
        break;
      case 'whiskerzilla_boss':
        if (!GS.flag('whiskerzilla_defeated')) await this.whiskerzillaBossScene();
        break;
      case 'ducal_crown_resonance':
        if (!GS.flag('ch5_complete')) await this.ducalCrownScene();
        break;
      /* ---------------- Chapter 6 (§A6 Africa) ---------------- */
      case 'ch6_arrival':
        if (!GS.flag('ch6_arrived')) await this.ch6ArrivalScene();
        break;
      case 'laughing_sphinx_boss':
        if (!GS.flag('laughing_sphinx_defeated')) await this.laughingSphinxBossScene();
        break;
      case 'sphinx_chin_resonance':
        if (!GS.flag('ch6_complete')) await this.sphinxChinScene();
        break;
      /* ---------------- Chapter 7 (§A6 India) ---------------- */
      case 'ch7_arrival':
        if (!GS.flag('ch7_arrived')) await this.ch7ArrivalScene();
        break;
      case 'cobra_raja_boss':
        if (!GS.flag('cobra_raja_defeated')) await this.cobraRajaBossScene();
        break;
      case 'palace_throne_resonance':
        if (!GS.flag('ch7_complete')) await this.palaceThroneScene();
        break;
      /* ---------------- Chapter 8 (§A6 China) ---------------- */
      case 'ch8_arrival':
        if (!GS.flag('ch8_arrived')) await this.ch8ArrivalScene();
        break;
      case 'paper_dragon_boss':
        if (!GS.flag('paper_dragon_defeated')) await this.paperDragonBossScene();
        break;
      case 'mt_shu_temple_resonance':
        if (!GS.flag('ch8_complete')) await this.mtShuTempleScene();
        break;
      /* ---------------- Chapter 9 (§A6 Romania) ---------------- */
      case 'ch9_arrival':
        if (!GS.flag('ch9_arrived')) await this.ch9ArrivalScene();
        break;
      case 'count_hoaxula_boss':
        if (!GS.flag('count_hoaxula_defeated')) await this.countHoaxulaBossScene();
        break;
      case 'stone_brow_monastery_resonance':
        if (!GS.flag('ch9_complete')) await this.stoneBrowMonasteryScene();
        break;
      /* ---------------- Chapter 10 (§A6 The Long Shot — FINALE) ---------------- */
      case 'ch10_arrival':
        if (!GS.flag('ch10_arrived')) await this.ch10ArrivalScene();
        break;
      case 'ch10_decode':
        if (!GS.flag('ch10_decoded')) await this.ch10DecodeScene();
        break;
      case 'frost_sentinel_boss':
        if (!GS.flag('frost_sentinel_defeated')) await this.frostSentinelBossScene();
        break;
      case 'tiki_magma_golem_boss':
        if (!GS.flag('tiki_magma_golem_defeated')) await this.tikiMagmaGolemBossScene();
        break;
      case 'ch10_launch':
        if (!GS.flag('ch10_launched')) await this.ch10LaunchScene();
        break;
      case 'ch10_mars_arrival':
        if (!GS.flag('ch10_mars_arrived')) await this.ch10MarsArrivalScene();
        break;
      case 'the_hush_boss':
        if (!GS.flag('the_hush_defeated')) await this.theHushBossScene();
        break;
      // the §A10 Ch.3 "find" pickups (books / letters / the drain / milk / water)
      case 'q_overdue_b1':
      case 'q_overdue_b2':
      case 'q_overdue_b3':
      case 'q_sender_l1':
      case 'q_sender_l2':
      case 'q_sender_l3':
      case 'q_penny_found':
      case 'q_cuppa_milk':
      case 'q_cuppa_water':
      // the §A10 Ch.4 "find" pickups (lenses / clapper / picnic fixings)
      case 'q_sigrid_lens1':
      case 'q_sigrid_lens2':
      case 'q_bell_clapper':
      case 'q_picnic_brunost':
      case 'q_picnic_berry':
      case 'q_picnic_set':
        await this.questPickup(id);
        break;
      default:
        break;
    }
  }

  /* ---------------- S14: the banana boat (§A5 Ch.2 — the bus-map precedent) ---------------- */

  private async boatAsk(from: 'docks' | 'puerto'): Promise<void> {
    this.cut = true;
    if (from === 'docks' && !GS.flag('ch1_complete')) {
      // ADR-014: the Ch.2 gate REQUIRES the flag — the captain holds the rope
      await this.dlg.say(...DIALOGUE.captain_not_yet);
      this.cut = false;
      return;
    }
    await this.dlg.say(...(from === 'docks' ? DIALOGUE.boat_ask_out : DIALOGUE.boat_ask_home));
    const label = from === 'docks' ? 'Board for PUERTO SOL' : 'Ride home to Twoton';
    const pick = await this.dlg.ask([label, 'Stay ashore'], { cancelIndex: 1 });
    if (pick !== 0) {
      this.cut = false;
      return;
    }
    AUDIO.stopMusic();
    // the first crossing is the full §A11 deck scene; every later ride is a
    // quick fade BOTH WAYS (zero missables — the boat never stops running)
    if (from === 'docks' && !GS.flag('boat_ride_done')) {
      this.goThroughDoor('boat_interior', 184, 116, 'up');
      return;
    }
    if (from === 'docks') {
      this.goThroughDoor('puerto_sol', PUERTO_SOL_PIER_SPAWN.x, PUERTO_SOL_PIER_SPAWN.y, 'up');
    } else {
      // land on the pier DECK by the gangplank (tile 20,8) — 392,168 was tile
      // (24,10), a solid 'sea' tile off the pier's SE nub: the boat dropped you
      // in the water and you couldn't move (clear of the board_boat trigger too)
      this.goThroughDoor('brickton_docks', 328, 136, 'up');
    }
  }

  /** the crossing (first ride only): the §A11 deck scene over a scrolling sea */
  private async boatCutscene(): Promise<void> {
    this.cut = true;
    const mapW = this.mapDef.grid[0].length * TILE_PX;
    // gulls + the far coast slide by inside the sky band only (ADR-004:
    // interiors float in void — the masked reel is the bus precedent). The band
    // + reel y's + slide offsets are native px → s() (scale is a setScale mult).
    const maskShape = this.make.graphics({ x: 0, y: 0 }, false);
    maskShape.fillRect(0, s(6), mapW, s(56));
    const paneMask = maskShape.createGeometryMask();
    const reel: Array<{ key: string; y: number; scale: number }> = [
      { key: 'songbird', y: 26, scale: 1 },
      { key: 'songbird', y: 18, scale: 0.8 },
      { key: 'skyline', y: 56, scale: 0.7 },
      { key: 'songbird', y: 30, scale: 1 },
      { key: 'tree_b', y: 58, scale: 0.8 },
      { key: 'songbird', y: 22, scale: 1.1 },
    ];
    let frame = 0;
    const spawner = this.time.addEvent({
      delay: 620,
      loop: true,
      callback: () => {
        const item = reel[Math.min(frame, reel.length - 1)];
        frame++;
        const img = this.add
          .image(mapW + s(40), s(item.y), item.key)
          .setOrigin(0.5, 1)
          .setScale(item.scale)
          .setDepth(1)
          .setMask(paneMask);
        this.tweens.add({ targets: img, x: -s(60), duration: 2600, ease: 'linear', onComplete: () => img.destroy() });
      },
    });
    await this.wait(500);
    await this.dlg.say(...DIALOGUE.boat_crossing_1);
    await this.wait(700);
    await this.dlg.say(...DIALOGUE.boat_crossing_senora);
    await this.wait(700);
    await this.dlg.say(...DIALOGUE.boat_crossing_2);
    await this.wait(900);
    spawner.remove();
    GS.setFlag('boat_ride_done');
    AUDIO.stopMusic();
    this.goThroughDoor('puerto_sol', PUERTO_SOL_PIER_SPAWN.x, PUERTO_SOL_PIER_SPAWN.y, 'up');
  }

  /* ---------------- S14: BOSS 2 + the Ember + the recovery (§A6) ---------------- */

  /** the apex: the Idol notices you noticing it (Prompt 15 carries the fight) */
  private async grinScene(): Promise<void> {
    this.cut = true;
    await this.dlg.say(...DIALOGUE.apex_approach);
    AUDIO.sfx('thud');
    this.cameras.main.shake(500, 0.01);
    await this.wait(550);
    await this.dlg.say(...DIALOGUE.apex_grin_wakes);
    const outcome = await this.startBattle(['gilded_grin'], 'none', [], { boss: true });
    if (outcome !== 'victory') return;
    this.cut = true;
    GS.setFlag('grin_defeated');
    // EMBER #2 — the Heartlight takes its second stem (§A4.9)
    GS.setFlag('ember2');
    GS.data.embers = 2;
    const ember = this.add.image(9.5 * TILE_PX, 4 * TILE_PX, 'ember').setDepth(9999);
    AUDIO.sfx('ember');
    this.sparkleBurst(ember.x, ember.y, 12);
    this.tweens.add({ targets: ember, y: this.player.y - s(30), x: this.player.x, duration: 1300, ease: 'sine.inout' });
    AUDIO.playMusic('heartlight');
    await this.wait(1400);
    this.sparkleBurst(this.player.x, this.player.y - s(30), 14);
    ember.destroy();
    this.cameras.main.flash(300, 248, 232, 160);
    await this.dlg.say(...DIALOGUE.ember2_get);
    await this.dlg.say(...DIALOGUE.apex_after);
    AUDIO.playMusic(this.mapDef.music);
    // rebuild from data: the idol prop retires, the dais sign swaps (ADR-014)
    this.fadeRestart();
  }

  /** §A6: the wishers wake — color comes back, and Chapter 2 closes on it */
  private async valleRecoveryScene(): Promise<void> {
    this.cut = true;
    this.cameras.main.flash(420, 248, 232, 160);
    AUDIO.playMusic('heartlight');
    await this.dlg.say(...DIALOGUE.valle_recovery);
    this.sparkleBurst(this.player.x, this.player.y - s(14), 16);
    GS.setFlag('ch2_complete');
    AUDIO.jingle('victory', 2200, null);
    await this.dlg.say(...DIALOGUE.ch2_card);
    AUDIO.playMusic(this.mapDef.music);
    this.cut = false;
  }

  /* ════════════ S18 (ADR-099) — CHAPTER 3 (§A6 England) scenes ════════════
   * The flight in, Milo's greenhouse crash + JOIN (the control system goes live),
   * THE FIRST BORROW (the Trust Thread opens), the Headmaster Mainframe, the §A4.11
   * coolant cast, and Heartlight 3 at the Old Stones. The grinScene/fayeJoinScene
   * precedents: commit flags, fade-restart whenever the map must rebuild. */

  /** the §A6 flight out — Uncle Bert ferries the party to England (gated on his
   *  appearance, which is itself gated on ch2_complete). */
  private async boardLucille(): Promise<void> {
    this.cut = true;
    await this.dlg.say(...DIALOGUE.bert_flight_ask);
    const pick = await this.dlg.ask(['Fly to ENGLAND (Foggybottom)', 'Not yet'], { cancelIndex: 1 });
    if (pick !== 0) {
      this.cut = false;
      return;
    }
    AUDIO.stopMusic();
    GS.setFlag('lucille_from', 0); // the Ch.3 flight always hatches onto the Foggybottom quay
    // into Lucille's cabin near Bert; walking down fires ch3_arrival, then the hatch
    // drops you on the Foggybottom quay (the boat_interior precedent)
    this.goThroughDoor('biplane_interior', 11 * 16, 3 * 16, 'down');
  }

  /** the §A6 arrival: Lucille drops through the machine-fog onto the quay */
  private async ch3ArrivalScene(): Promise<void> {
    this.cut = true;
    GS.setFlag('ch3_arrived');
    AUDIO.sfx('thud');
    this.cameras.main.shake(380, 0.006);
    await this.dlg.say(...DIALOGUE.ch3_arrival);
    this.cut = false;
  }

  /** the §A6 set-piece: the porter blocks → Milo crashes the greenhouse + JOINS (the
   *  party becomes THREE; the control system goes live) → Jay PUPPETS the porter past
   *  the lodge (THE FIRST BORROW; the Trust Thread opens). One orchestrated cutscene. */
  private async wintermoorArrivalScene(): Promise<void> {
    this.cut = true;
    await this.dlg.say(...DIALOGUE.wm_arrival_porter);
    // the crash through the greenhouse glass
    AUDIO.sfx('thud');
    this.cameras.main.shake(700, 0.012);
    await this.wait(500);
    await this.dlg.say(...DIALOGUE.wm_arrival_crash);
    // Milo emerges and JOINS — the party becomes three (§A3; ~L16, his canon kit)
    await this.dlg.say(...DIALOGUE.wm_arrival_milo);
    GS.data.party.push(makeHeroState('milo', 16, GS.data.heroNames.milo));
    GS.setFlag('milo_joined');
    GS.addItem('pellet_popper', 'milo');
    GS.equipItem('milo', 'pellet_popper');
    AUDIO.sfx('confirm');
    AUDIO.jingle('levelup', 1400, null);
    // the homesick-for-a-dad ache (the Pemberton seed, Ch.10) — played straight
    await this.dlg.say(...DIALOGUE.wm_arrival_dad);
    // Milo's kit + the REPAIR tutorial: a Broken Gizmo becomes the Defibrillator (§A4.12)
    await this.dlg.say(...DIALOGUE.wm_arrival_kit);
    GS.addItem('defibrillator', 'milo');
    GS.setFlag('repair_taught');
    AUDIO.sfx('heal');
    // THE CLICKER — machine control goes live; cars become the first FLEET_STAGE (§A4.10)
    await this.dlg.say(...DIALOGUE.wm_arrival_clicker);
    GS.setFlag('milo_clicker');
    GS.setFlag('fleet_road'); // ADR-074 staging marker — road vehicles drivable from here
    // the porter still blocks; there is no slip, and no way round
    await this.dlg.say(...DIALOGUE.wm_arrival_gate);
    // THE FIRST BORROW: Jay awakens VIBE PUPPET / Mind Warp and borrows the porter past
    // the gate. The awakening beat (awake_the_first_borrow) carries the recoil itself —
    // Mia goes still, Mia(faye) takes a half-step back — so the Trust Thread opens here.
    await this.awakeningBeat('the_first_borrow');
    GS.setFlag('thread_trust_open'); // §A6/ADR-072 — the trust thread's first link
    GS.setFlag('wm_gate_open'); // the porter gates out on rebuild (the lodge is clear)
    await this.dlg.say(...DIALOGUE.wm_arrival_after);
    this.cut = false;
    this.fadeRestart(); // the conga picks up Milo; the porter stands aside (data-gated)
  }

  /** §A6 BOSS 3 — the Headmaster Mainframe (Prompt 15 phase machine carries the fight) */
  private async mainframeBossScene(): Promise<void> {
    this.cut = true;
    await this.dlg.say(...DIALOGUE.mainframe_door);
    AUDIO.sfx('thud');
    this.cameras.main.shake(500, 0.01);
    await this.wait(450);
    const outcome = await this.startBattle(['headmaster_mainframe'], 'none', [], { boss: true });
    if (outcome !== 'victory') return;
    this.cut = true;
    GS.setFlag('mainframe_defeated');
    // "The Last Over" (§A10): the Mainframe ran the school clock; its fall stops it.
    // Record it whether or not the quest is active yet — the boss may fall BEFORE you
    // meet the captain (the common path), and canon forbids a missable (non-missable).
    if (!GS.flag('q_over_done')) GS.setFlag('q_over_clock');
    // the Gauss Lobber — Milo pries it off the dead coil rack (story gear, ADR-035)
    GS.addItem('gauss_lobber', 'milo');
    AUDIO.sfx('confirm');
    this.cameras.main.flash(420, 248, 232, 160);
    await this.dlg.say(...DIALOGUE.mainframe_win);
    AUDIO.jingle('victory', 2200, this.mapDef.music);
    this.cut = false;
    this.fadeRestart(); // the fog lifts on the data (signs/ambient swap on mainframe_defeated)
  }

  /** §A6 Resonance Site — the Old Stones. Before the boss they only hum shyly; once the
   *  machine-fog lifts they sing, and the locket records HEARTLIGHT 3 (ch3 closes). */
  private async oldStonesScene(): Promise<void> {
    if (!GS.flag('mainframe_defeated')) {
      this.cut = true;
      await this.dlg.say(...DIALOGUE.old_stones_early);
      this.cut = false;
      return;
    }
    this.cut = true;
    GS.setFlag('ember3');
    GS.data.embers = 3;
    const ember = this.add.image(this.player.x, this.player.y - s(44), 'ember').setDepth(9999);
    AUDIO.sfx('ember');
    this.sparkleBurst(ember.x, ember.y, 12);
    this.tweens.add({ targets: ember, y: this.player.y - s(30), x: this.player.x, duration: 1300, ease: 'sine.inout' });
    AUDIO.playMusic('heartlight');
    await this.wait(1400);
    this.sparkleBurst(this.player.x, this.player.y - s(30), 14);
    ember.destroy();
    this.cameras.main.flash(300, 248, 232, 160);
    await this.dlg.say(...DIALOGUE.ember3_get);
    GS.setFlag('ch3_complete'); // §A6 — the chapter button (the §A5 gate to Ch.4)
    AUDIO.jingle('victory', 2200, null);
    await this.dlg.say(...DIALOGUE.ch3_card);
    AUDIO.playMusic(this.mapDef.music);
    this.cut = false;
  }

  /** §A4.11 PSI gate — freeze the boiler coolant line (taught-first, non-missable,
   *  retry-safe). Mia learned Vibe Freeze in Ch.2, so the cast is available; the
   *  no-key branch is the no-soft-lock floor (ADR-069). Reuses engine/psi + the gate. */
  private async coolantGate(): Promise<void> {
    if (GS.flag('wm_coolant_frozen')) {
      await this.dlg.say('(The coolant line stands frozen solid. Beyond it, the throttled fog-engine mutters to itself.)');
      return;
    }
    const gate = PSI_GATES.wintermoor_coolant;
    const known = GS.data.party.flatMap((h) => availableAbilities(h.id, h.level, (f) => GS.flag(f) === true));
    this.cut = true;
    await this.dlg.say(...DIALOGUE.sign_wm_coolant);
    if (!canClearGate(gate, known) || bestCastFor(gate, known) === null) {
      await this.dlg.say('(The pipe is already near freezing. To lock it solid you would need to cast FREEZE — and no one here has learned how. Yet.)');
      this.cut = false;
      return;
    }
    const pick = await this.dlg.ask(['Cast VIBE FREEZE on the line', 'Leave it'], { cancelIndex: 1 });
    if (pick !== 0) {
      this.cut = false;
      return;
    }
    AUDIO.sfx('pray');
    this.cameras.main.flash(360, 168, 224, 255);
    this.sparkleBurst(this.player.x, this.player.y - s(14), 14);
    await this.wait(400);
    GS.setFlag('wm_coolant_frozen');
    await this.dlg.say(...DIALOGUE.wm_fog_engine);
    GS.addItem('broken_gizmo'); // salvage off the fog-engine — Milo's Repair fuel (§A3)
    AUDIO.sfx('confirm');
    AUDIO.jingle('levelup', 1200, this.mapDef.music);
    toast(this, 'The coolant line is frozen solid.');
    this.cut = false;
  }

  /* ════════════ CHAPTER 4 — NORWAY ("The Fjord That Sleeps") ════════════ *
   * The §A6 beats: Lucille's North Sea hop (boarded from the cabin once Ch.3 is
   * done), the Sleeper's Spine PSI gate, the Whisperwig in the ear (where Mia
   * awakens Vibe Volt α via the phase machine), and Heartlight 4 (The Deep Hum).
   * Mirrors the Ch.3 scene structure; flags commit, fade-restart on map rebuilds. */

  /** the §A5 next leg: from Lucille's cabin, Bert flies the party to Norway once
   *  Ch.3 is complete (the boardLucille precedent — England's flight stays his too). */
  private async bertAirBeat(): Promise<void> {
    this.cut = true;
    // the §A5 FINAL leg: once Romania (Ch.9) is done, Bert flies the party north to the
    // snowcat for AURORA STATION (Ch.10 — the newest frontier takes priority)
    if (GS.flag('ch9_complete') && !GS.flag('ch10_arrived')) {
      await this.dlg.say(...DIALOGUE.bert_alaska_ask);
      const pick = await this.dlg.ask(['Fly north to AURORA STATION', 'Not yet'], { cancelIndex: 1 });
      if (pick !== 0) {
        this.cut = false;
        return;
      }
      AUDIO.stopMusic();
      await playCutscene(this, 'ch10_journey'); // the snowcat-run panels (no-ops if missing)
      // the snowcat sets the party down on the Aurora Station green; ch10_arrival fires the beat
      this.goThroughDoor('aurora_station', 8 * 16, 19 * 16, 'down');
      return;
    }
    // the §A5 NEXT leg: once Lotus Harbor (Ch.8) is done, Bert flies the party to VALEA
    // STELELOR (the newest frontier takes priority — the earlier legs below stay for the backtrack)
    if (GS.flag('ch8_complete') && !GS.flag('ch9_arrived')) {
      await this.dlg.say(...DIALOGUE.bert_romania_ask);
      const pick = await this.dlg.ask(['Fly to VALEA STELELOR', 'Not yet'], { cancelIndex: 1 });
      if (pick !== 0) {
        this.cut = false;
        return;
      }
      AUDIO.stopMusic();
      await playCutscene(this, 'ch9_journey'); // the authored Romania panels (no-ops if missing)
      // the hatch drops on the Valea Stelelor village green; ch9_arrival fires the beat
      this.goThroughDoor('valea_stelelor', 8 * 16, 20 * 16, 'down');
      return;
    }
    // the §A5 Lotus Harbor leg: once Chandrapore (Ch.7) is done, Bert flies the party to LOTUS
    // HARBOR (kept for the backtrack now that Valea Stelelor is the frontier)
    if (GS.flag('ch7_complete') && !GS.flag('ch8_arrived')) {
      await this.dlg.say(...DIALOGUE.bert_china_ask);
      const pick = await this.dlg.ask(['Fly to LOTUS HARBOR', 'Not yet'], { cancelIndex: 1 });
      if (pick !== 0) {
        this.cut = false;
        return;
      }
      AUDIO.stopMusic();
      await playCutscene(this, 'ch8_journey'); // the authored China panels (no-ops if missing)
      // the hatch drops on the Lotus Harbor ghat landing square; ch8_arrival fires the beat
      this.goThroughDoor('lotus_harbor', 8 * 16, 22 * 16, 'down');
      return;
    }
    // the §A5 Chandrapore leg: once Zanzibel is done, Bert flies the party to CHANDRAPORE
    // (kept for the backtrack now that Lotus Harbor is the frontier)
    if (GS.flag('ch6_complete') && !GS.flag('ch7_arrived')) {
      await this.dlg.say(...DIALOGUE.bert_india_ask);
      const pick = await this.dlg.ask(['Fly to CHANDRAPORE', 'Not yet'], { cancelIndex: 1 });
      if (pick !== 0) {
        this.cut = false;
        return;
      }
      AUDIO.stopMusic();
      await playCutscene(this, 'ch7_journey'); // the authored India panels (no-ops if missing)
      // the hatch drops on the Chandrapore ghat landing square; ch7_arrival fires the beat
      this.goThroughDoor('chandrapore', 8 * 16, 22 * 16, 'down');
      return;
    }
    // the §A5 Zanzibel leg: once Minimus is done, Bert flies the party to ZANZIBEL (kept
    // for the backtrack now that Chandrapore is the frontier)
    if (GS.flag('ch5_complete') && !GS.flag('ch6_arrived')) {
      await this.dlg.say(...DIALOGUE.bert_africa_ask);
      const pick = await this.dlg.ask(['Fly to ZANZIBEL', 'Not yet'], { cancelIndex: 1 });
      if (pick !== 0) {
        this.cut = false;
        return;
      }
      AUDIO.stopMusic();
      await playCutscene(this, 'ch6_journey'); // the authored Africa panels (no-ops if missing)
      // the hatch drops on the Zanzibel quay landing square; ch6_arrival fires the beat
      this.goThroughDoor('zanzibel', 8 * 16, 22 * 16, 'down');
      return;
    }
    // the §A5 Minimus leg: once Norway is done, Bert flies the party to MINIMUS (kept
    // for the backtrack now that Zanzibel is the frontier)
    if (GS.flag('ch4_complete') && !GS.flag('ch5_arrived')) {
      await this.dlg.say(...DIALOGUE.bert_minimus_ask);
      const pick = await this.dlg.ask(['Fly to MINIMUS', 'Not yet'], { cancelIndex: 1 });
      if (pick !== 0) {
        this.cut = false;
        return;
      }
      AUDIO.stopMusic();
      await playCutscene(this, 'ch5_journey'); // the authored panels (no-ops if missing)
      // the hatch drops on the Minimus Major landing square; ch5_arrival fires the beat
      this.goThroughDoor('minimus_major', 8 * 16, 22 * 16, 'down');
      return;
    }
    if (!GS.flag('ch3_complete') || GS.flag('ch4_arrived')) {
      // before the North Sea leg is earned (or after it's flown), Bert just chats
      await this.dlg.say(...DIALOGUE.npc_bert_air);
      this.cut = false;
      return;
    }
    await this.dlg.say(...DIALOGUE.bert_norway_ask);
    const pick = await this.dlg.ask(['Fly to NORWAY (Kvisthavn)', 'Not yet'], { cancelIndex: 1 });
    if (pick !== 0) {
      this.cut = false;
      return;
    }
    AUDIO.stopMusic();
    await playCutscene(this, 'ch4_journey'); // the authored North Sea panels (no-ops if missing)
    // the hatch drops on the Kvisthavn quay; the ch4_arrival trigger fires the beat
    this.goThroughDoor('kvisthavn', 18 * 16, 8 * 16, 'down');
  }

  /** the §A6 arrival: Lucille claws over the North Sea and sets down under the cliffs */
  private async ch4ArrivalScene(): Promise<void> {
    this.cut = true;
    GS.setFlag('ch4_arrived');
    AUDIO.sfx('thud');
    this.cameras.main.shake(420, 0.007);
    await this.dlg.say(...DIALOGUE.ch4_arrival);
    AUDIO.playMusic(this.mapDef.music);
    this.cut = false;
  }

  /** the §A7 set-piece — the Bridge Berry blocks the gorge until fought or rolled
   *  aside. Optional + retry-safe (the lane is passable either way; this is the gag). */
  private async bridgeBerryScene(): Promise<void> {
    this.cut = true;
    await this.dlg.say('(A berry the size of a hay bale has wedged itself across the plank bridge. It is not a metaphor. It is a berry, and it is in the way.)');
    const outcome = await this.startBattle(['bridge_berry'], 'none', [], {});
    if (outcome !== 'victory') {
      this.cut = false;
      return;
    }
    GS.setFlag('moor_berry_cleared');
    AUDIO.sfx('confirm');
    await this.dlg.say('(The Bridge Berry rolls off the planks and down into the gorge with a long, descending squelch. The way across is clear, if sticky.)');
    this.cut = false;
  }

  /** §A4.11 PSI gate — freeze the meltwater fall off the Sleeper's shoulder to a
   *  bridge (taught-first: Mia learned Vibe Freeze in Ch.2; no-key branch is the
   *  no-soft-lock floor, ADR-069). Rewards a Firecracker String — NOISE for the ear. */
  private async meltfallGate(): Promise<void> {
    if (GS.flag('spine_meltfall_frozen')) {
      await this.dlg.say('(The meltwater fall stands frozen to a blue-white bridge. The way up the arm is open.)');
      return;
    }
    const gate = PSI_GATES.spine_meltfall;
    const known = GS.data.party.flatMap((h) => availableAbilities(h.id, h.level, (f) => GS.flag(f) === true));
    this.cut = true;
    await this.dlg.say(...DIALOGUE.sign_spine_meltfall);
    if (!canClearGate(gate, known) || bestCastFor(gate, known) === null) {
      await this.dlg.say('(The fall is already near freezing. To lock it to a bridge you would need to cast FREEZE — and no one here has learned how. Yet.)');
      this.cut = false;
      return;
    }
    const pick = await this.dlg.ask(['Cast VIBE FREEZE on the fall', 'Leave it'], { cancelIndex: 1 });
    if (pick !== 0) {
      this.cut = false;
      return;
    }
    AUDIO.sfx('pray');
    this.cameras.main.flash(360, 168, 224, 255);
    this.sparkleBurst(this.player.x, this.player.y - s(14), 14);
    await this.wait(400);
    GS.setFlag('spine_meltfall_frozen');
    // open the foam-lip crossing in the LIVE collision now (buildTiles re-carves
    // it from the flag on any later re-entry) so the bridge is crossable at once.
    for (let cy = 5; cy <= 6; cy++) {
      for (let cx = 10; cx <= 13; cx++) {
        if (this.solidTiles[cy]) this.solidTiles[cy][cx] = false;
      }
    }
    await this.dlg.say('(The fall locks solid mid-pour, a staircase of ice up the giant\'s arm. Caught in the frozen spray, a string of firecrackers somebody dropped — you pocket it. You may want to be LOUD soon.)');
    GS.addItem('firecracker_string'); // NOISE for the Whisperwig ahead (the gate pays it forward)
    AUDIO.sfx('confirm');
    AUDIO.jingle('levelup', 1200, this.mapDef.music);
    toast(this, 'The meltwater fall is frozen to a bridge.');
    this.cut = false;
  }

  /** §A6 BOSS 4 — the Whisperwig (the phase machine carries the untargetable-until-
   *  noise gimmick + Mia's Vibe Volt α awakening when it first surfaces). */
  private async whisperwigBossScene(): Promise<void> {
    this.cut = true;
    await this.dlg.say(...DIALOGUE.whisperwig_door);
    AUDIO.sfx('thud');
    this.cameras.main.shake(460, 0.009);
    await this.wait(420);
    const outcome = await this.startBattle(['the_whisperwig'], 'none', [], { boss: true });
    if (outcome !== 'victory') return;
    this.cut = true;
    GS.setFlag('whisperwig_defeated');
    AUDIO.sfx('confirm');
    this.cameras.main.flash(420, 248, 232, 160);
    await this.dlg.say(...DIALOGUE.whisperwig_win);
    AUDIO.jingle('victory', 2200, this.mapDef.music);
    this.cut = false;
    this.fadeRestart(); // the canal opens; the resonance trigger can sing now
  }

  /** §A6 Resonance Site — the Sleeper's Ear. Before the boss it stays shy; once the
   *  Whisperwig is gone the canal sings, and the locket records HEARTLIGHT 4 (ch4 closes). */
  private async sleepersEarScene(): Promise<void> {
    if (!GS.flag('whisperwig_defeated')) {
      this.cut = true;
      await this.dlg.say(...DIALOGUE.sleepers_ear_early);
      this.cut = false;
      return;
    }
    this.cut = true;
    GS.setFlag('ember4');
    GS.data.embers = 4;
    const ember = this.add.image(this.player.x, this.player.y - s(44), 'ember').setDepth(9999);
    AUDIO.sfx('ember');
    this.sparkleBurst(ember.x, ember.y, 12);
    this.tweens.add({ targets: ember, y: this.player.y - s(30), x: this.player.x, duration: 1300, ease: 'sine.inout' });
    AUDIO.playMusic('heartlight');
    await this.wait(1400);
    this.sparkleBurst(this.player.x, this.player.y - s(30), 14);
    ember.destroy();
    this.cameras.main.flash(300, 248, 232, 160);
    await this.dlg.say(...DIALOGUE.ember4_get);
    GS.setFlag('ch4_complete'); // §A6 — the chapter button (the §A5 gate to Ch.5)
    AUDIO.jingle('victory', 2200, null);
    await this.dlg.say(...DIALOGUE.ch4_card);
    AUDIO.playMusic(this.mapDef.music);
    this.cut = false;
  }

  /* ════════════════ CHAPTER 5 — THE GRAND DUCHY OF MINIMUS (§A6) ════════════════ *
   * The arrival (Lucille lands "in the duchy. All of it."), Milo's Big-Little Lens
   * build, the Hedgerow lens set-piece, the WHISKERZILLA mercy/survival boss (the phase
   * machine carries the Flat Bell + the POUNCE + the bored-mercy end), and the Ducal
   * Crown: Heartlight 5 (The Bell Choir) + the two joins (Pippa as Foreign Minister with
   * the Royal Thimble; Dorin, the Ch.4 gi-kid cameo, paid off). Mirrors the Ch.4 shape. */

  /** the §A6 arrival — Lucille sets the party down on Minimus Major; a Whistle Guard
   *  flags them down before they flatten a suburb (the colossi-keep-to-the-Way beat). */
  private async ch5ArrivalScene(): Promise<void> {
    this.cut = true;
    GS.setFlag('ch5_arrived');
    AUDIO.sfx('thud');
    this.cameras.main.shake(420, 0.006);
    await this.dlg.say(...DIALOGUE.ch5_arrival);
    AUDIO.playMusic(this.mapDef.music);
    this.cut = false;
  }

  /** the §A6 Milo build — the duchy's hundred engineers grind Sigrid's spare Norway lens
   *  into the BIG-LITTLE LENS (party-wide Focus). Flavor beat: sets the flag + key item. */
  private async bigLittleLensScene(): Promise<void> {
    this.cut = true;
    if (GS.flag('big_little_lens_built')) {
      await this.dlg.say(...DIALOGUE.mn_lens_done);
      this.cut = false;
      return;
    }
    await this.dlg.say(...DIALOGUE.mn_lens);
    GS.setFlag('big_little_lens_built');
    GS.addItem('big_little_lens');
    AUDIO.sfx('confirm');
    AUDIO.jingle('levelup', 1200, this.mapDef.music);
    toast(this, "Milo's Spy became the BIG-LITTLE LENS — party-wide Focus.");
    this.cut = false;
  }

  /** §A11 the Big-Little gate — a duchy doorway is thimble-small, so the colossi can step inside
   *  only once the Big-Little Lens (the §A6 Milo build) can fold the party down to duchy scale.
   *  Returns true to admit them (after the threshold shrink beat); false turns them away. */
  private async duchyShrinkGate(): Promise<boolean> {
    if (!GS.flag('big_little_lens_built')) {
      this.cut = true;
      await this.dlg.say(...DIALOGUE.duchy_door_too_big);
      this.cut = false;
      return false;
    }
    this.cut = true;
    if (!GS.flag('duchy_shrink_known')) {
      await this.dlg.say(...DIALOGUE.duchy_door_shrink); // the one-time "how" — the Lens folds them down
      GS.setFlag('duchy_shrink_known');
    }
    await this.shrinkPartyToDuchy(); // fold to duchy scale; the interior receives them at room scale
    this.cut = false;
    return true;
  }

  /** the threshold shrink flourish — the party folds from colossus to duchy scale (origin is feet,
   *  so they shrink planted). Purely cosmetic: the interior is entered fresh at normal room scale,
   *  and the skin map rebuilds them at full colossus scale on the way back out. */
  private async shrinkPartyToDuchy(): Promise<void> {
    const targets = [this.player, ...this.followers.map((f) => f.spr)];
    this.sparkleBurst(this.player.x, this.player.y - s(12), 12);
    AUDIO.sfx('ember');
    // cosmetic fold-down — fired-and-forgotten so a killed/interrupted tween can never hang the
    // door gate. The bounded wait (a single delayedCall, not the tween) drives the beat; whatever
    // of the shrink is still in flight is carried under goThroughDoor's fade into the interior.
    this.tweens.add({ targets, scaleX: MINIMUS_NATIVE_SCALE, scaleY: MINIMUS_NATIVE_SCALE, duration: 240, ease: 'sine.in' });
    await this.wait(260);
  }

  /** a scale set-piece in the Hedgerow read through the new Lens (optional flavor; the
   *  path is always passable — the Lens reads the leaf-bridge, it never gates it). */
  private async hedgerowLensScene(): Promise<void> {
    this.cut = true;
    GS.setFlag('hedgerow_lens_seen');
    await this.dlg.say(...DIALOGUE.hedgerow_lens);
    this.cut = false;
  }

  /** §A6 BOSS 5 — WHISKERZILLA (the phase machine carries the mercy/survival gimmick:
   *  the Flat Bell second target + evasion, the POUNCE telegraph, the bored-mercy end).
   *  Victory is a NON-KILL — the Duchess knights the cat (endBattleMercy → 'victory'). */
  private async whiskerzillaBossScene(): Promise<void> {
    this.cut = true;
    await this.dlg.say(...DIALOGUE.whiskerzilla_door);
    AUDIO.sfx('thud');
    this.cameras.main.shake(460, 0.008);
    await this.wait(420);
    const outcome = await this.startBattle(['whiskerzilla'], 'none', [], { boss: true });
    if (outcome !== 'victory') return;
    this.cut = true;
    GS.setFlag('whiskerzilla_defeated');
    AUDIO.sfx('confirm');
    this.cameras.main.flash(420, 248, 232, 160);
    await this.dlg.say(...DIALOGUE.whiskerzilla_win);
    AUDIO.jingle('victory', 2200, this.mapDef.music);
    this.cut = false;
    this.fadeRestart(); // the Crown is free to sing now; the resonance trigger can fire
  }

  /** §A6 Resonance Site — the Ducal Crown. Before the cat is moved it stays shy; once
   *  Whiskerzilla is knighted the Crown sings (HEARTLIGHT 5 — The Bell Choir), and the
   *  two joins land: Pippa (Foreign Minister + the Royal Thimble) and Dorin (ch5 closes). */
  private async ducalCrownScene(): Promise<void> {
    if (!GS.flag('whiskerzilla_defeated')) {
      this.cut = true;
      await this.dlg.say(...DIALOGUE.ducal_crown_early);
      this.cut = false;
      return;
    }
    this.cut = true;
    // HEARTLIGHT 5 — the Bell Choir (Ember 5)
    GS.setFlag('ember5');
    GS.data.embers = 5;
    const ember = this.add.image(this.player.x, this.player.y - s(44), 'ember').setDepth(9999);
    AUDIO.sfx('ember');
    this.sparkleBurst(ember.x, ember.y, 12);
    this.tweens.add({ targets: ember, y: this.player.y - s(30), x: this.player.x, duration: 1300, ease: 'sine.inout' });
    AUDIO.playMusic('heartlight');
    await this.wait(1400);
    this.sparkleBurst(this.player.x, this.player.y - s(30), 14);
    ember.destroy();
    this.cameras.main.flash(300, 248, 232, 160);
    await this.dlg.say(...DIALOGUE.ember5_get);
    // THE TWO JOINS (§A6) — both newcomers join AFTER the boss (matches BOSS_PARTY ch5,
    // which is the 3-hero rex/faye/milo party for the Whiskerzilla fight itself)
    let pippaRise: Phaser.GameObjects.Sprite | undefined; // the Royal Thimble grow-tween sprite
    if (!GS.flag('pippa_joined')) {
      const join = DIALOGUE.pippa_join;
      await this.dlg.say(...join.slice(0, 2)); // the appointment + the Royal Thimble, offered
      // §A11 the Royal Thimble beat — Pippa RISES on screen from lapel-pin (Minimus-NATIVE
      // scale) to colossus (travel scale), planted at her feet so she grows UPWARD beside the
      // leader, exactly as the line describes. She hands off to the real follower at scene end.
      pippaRise = this.add
        .sprite(this.player.x - s(20), this.player.y, 'pippa', standFrame('down'))
        .setOrigin(0.5, 1)
        .setScale(MINIMUS_NATIVE_SCALE);
      pippaRise.setDepth(this.player.y);
      this.sparkleBurst(pippaRise.x, pippaRise.y - s(8), 10);
      this.tweens.add({ targets: pippaRise, scaleX: 1, scaleY: 1, duration: 950, ease: 'back.out' });
      await this.dlg.say(...join.slice(2)); // "...and RISES..." → "{pippa} joined the party"
      pippaRise.setScale(1); // settle exactly at travel scale (in case the box closed mid-tween)
      this.sparkleBurst(pippaRise.x, pippaRise.y - s(18), 12);
      GS.data.party.push(makeHeroState('pippa', 26, GS.data.heroNames.pippa));
      GS.setFlag('pippa_joined');
      GS.addItem('royal_thimble'); // her scale-anchor key item
      AUDIO.jingle('levelup', 1600, 'heartlight');
    }
    if (!GS.flag('dorin_joined')) {
      await this.dlg.say(...DIALOGUE.dorin_join);
      GS.data.party.push(makeHeroState('dorin', 26, GS.data.heroNames.dorin));
      GS.setFlag('dorin_joined'); // his awakening waits for Ch.9 (the Mute Mountain)
      AUDIO.jingle('levelup', 1600, 'heartlight');
    }
    GS.setFlag('ch5_complete'); // §A6 — the chapter button (the §A5 gate to Ch.6)
    AUDIO.jingle('victory', 2200, null);
    await this.dlg.say(...DIALOGUE.ch5_card);
    // the grow-tween sprite hands off to the real follower line now the joins are in the party
    pippaRise?.destroy();
    this.rebuildFollowers();
    AUDIO.playMusic(this.mapDef.music);
    this.cut = false;
  }

  /* ════════════ CHAPTER 6 — THE RUINS THAT LAUGH (Africa): arrival → the §A6 boss →
   * Heartlight 6. Mirrors the Ch.5 shape, minus the joins — the party is whole by now,
   * so the chin's resonance just records Ember 6 and opens the next leg. The BRANCH
   * beats (Held Breath + Choice 1) ride the existing runChoice/heldBreathBeat handlers. */

  /** the §A6 arrival — Lucille sets the party down on the Zanzibel quay, into the noise */
  private async ch6ArrivalScene(): Promise<void> {
    this.cut = true;
    GS.setFlag('ch6_arrived');
    AUDIO.sfx('thud');
    this.cameras.main.shake(380, 0.005);
    await this.dlg.say(...DIALOGUE.ch6_arrival);
    AUDIO.playMusic(this.mapDef.music);
    this.cut = false;
  }

  /** §A6 BOSS 6 — THE LAUGHING SPHINX (the phase machine carries the riddle gimmick:
   *  BattleScene opens on a riddle, right stuns it / wrong cries the party). A normal
   *  HP win on its 9000 HP — the wrong-riddle is the rewind-safe sandbox, not a loss. */
  private async laughingSphinxBossScene(): Promise<void> {
    this.cut = true;
    await this.dlg.say(...DIALOGUE.laughing_sphinx_door);
    AUDIO.sfx('thud');
    this.cameras.main.shake(460, 0.008);
    await this.wait(420);
    const outcome = await this.startBattle(['laughing_sphinx'], 'none', [], { boss: true });
    if (outcome !== 'victory') return;
    this.cut = true;
    GS.setFlag('laughing_sphinx_defeated');
    AUDIO.sfx('confirm');
    this.cameras.main.flash(420, 248, 232, 160);
    await this.dlg.say(...DIALOGUE.laughing_sphinx_win);
    AUDIO.jingle('victory', 2200, this.mapDef.music);
    this.cut = false;
    this.fadeRestart(); // the chin is free to sing now; the resonance trigger can fire
  }

  /** §A6 Resonance Site — the Sphinx's chin. Before the Sphinx is answered it keeps its
   *  peace; once beaten the chin sings (HEARTLIGHT 6 — The Laughing Chord) and Ember 6
   *  lands. No joins (the party is whole); ch6_complete opens the §A5 gate to Ch.7. */
  private async sphinxChinScene(): Promise<void> {
    if (!GS.flag('laughing_sphinx_defeated')) {
      this.cut = true;
      await this.dlg.say(...DIALOGUE.sphinx_chin_early);
      this.cut = false;
      return;
    }
    this.cut = true;
    // HEARTLIGHT 6 — the Laughing Chord (Ember 6)
    GS.setFlag('ember6');
    GS.data.embers = 6;
    const ember = this.add.image(this.player.x, this.player.y - s(44), 'ember').setDepth(9999);
    AUDIO.sfx('ember');
    this.sparkleBurst(ember.x, ember.y, 12);
    this.tweens.add({ targets: ember, y: this.player.y - s(30), x: this.player.x, duration: 1300, ease: 'sine.inout' });
    AUDIO.playMusic('heartlight');
    await this.wait(1400);
    this.sparkleBurst(this.player.x, this.player.y - s(30), 14);
    ember.destroy();
    this.cameras.main.flash(300, 248, 232, 160);
    await this.dlg.say(...DIALOGUE.ember6_get);
    GS.setFlag('ch6_complete'); // §A6 — the chapter button (the §A5 gate to Ch.7)
    AUDIO.jingle('victory', 2200, null);
    await this.dlg.say(...DIALOGUE.ch6_card);
    AUDIO.playMusic(this.mapDef.music);
    this.cut = false;
  }

  /* ════════════ CHAPTER 7 — THE COBRA'S PALACE (India): arrival → the §A6 boss →
   * Heartlight 7. Mirrors the Ch.6 shape — a straight chapter, no joins (the party is
   * whole by now), so the throne's resonance just records Ember 7 and opens the next leg. */

  /** the §A6 arrival — Bert sets the party down on the Chandrapore ghats, into the roar */
  private async ch7ArrivalScene(): Promise<void> {
    this.cut = true;
    GS.setFlag('ch7_arrived');
    AUDIO.sfx('thud');
    this.cameras.main.shake(380, 0.005);
    await this.dlg.say(...DIALOGUE.ch7_arrival);
    AUDIO.playMusic(this.mapDef.music);
    this.cut = false;
  }

  /** §A6 BOSS 7 — THE COBRA RAJA (the phase machine carries the gimmick: every 3rd turn
   *  a party-wide paralyzing gaze, and a one-time 40% skin-shed that heals +800). A normal
   *  HP win on its 20000 HP — burn it through the threshold and wake the real king. */
  private async cobraRajaBossScene(): Promise<void> {
    this.cut = true;
    await this.dlg.say(...DIALOGUE.cobra_raja_door);
    AUDIO.sfx('thud');
    this.cameras.main.shake(460, 0.008);
    await this.wait(420);
    const outcome = await this.startBattle(['cobra_raja'], 'none', [], { boss: true });
    if (outcome !== 'victory') return;
    this.cut = true;
    GS.setFlag('cobra_raja_defeated');
    AUDIO.sfx('confirm');
    this.cameras.main.flash(420, 248, 232, 160);
    await this.dlg.say(...DIALOGUE.cobra_raja_win);
    AUDIO.jingle('victory', 2200, this.mapDef.music);
    this.cut = false;
    this.fadeRestart(); // the throne is free to sing now; the resonance trigger can fire
  }

  /** §A6 Resonance Site — the palace throne. Before the Raja is unmade it keeps its peace;
   *  once beaten the throne sings (HEARTLIGHT 7 — The Coiled Raga) and Ember 7 lands. No
   *  joins (the party is whole); ch7_complete opens the §A5 gate to Ch.8. */
  private async palaceThroneScene(): Promise<void> {
    if (!GS.flag('cobra_raja_defeated')) {
      this.cut = true;
      await this.dlg.say(...DIALOGUE.palace_throne_early);
      this.cut = false;
      return;
    }
    this.cut = true;
    // HEARTLIGHT 7 — the Coiled Raga (Ember 7)
    GS.setFlag('ember7');
    GS.data.embers = 7;
    const ember = this.add.image(this.player.x, this.player.y - s(44), 'ember').setDepth(9999);
    AUDIO.sfx('ember');
    this.sparkleBurst(ember.x, ember.y, 12);
    this.tweens.add({ targets: ember, y: this.player.y - s(30), x: this.player.x, duration: 1300, ease: 'sine.inout' });
    AUDIO.playMusic('heartlight');
    await this.wait(1400);
    this.sparkleBurst(this.player.x, this.player.y - s(30), 14);
    ember.destroy();
    this.cameras.main.flash(300, 248, 232, 160);
    await this.dlg.say(...DIALOGUE.ember7_get);
    GS.setFlag('ch7_complete'); // §A6 — the chapter button (the §A5 gate to Ch.8)
    AUDIO.jingle('victory', 2200, null);
    await this.dlg.say(...DIALOGUE.ch7_card);
    AUDIO.playMusic(this.mapDef.music);
    this.cut = false;
  }

  /** the §A6 arrival — Bert sets the party down on the Lotus Harbor ghats, into the lanterns */
  private async ch8ArrivalScene(): Promise<void> {
    this.cut = true;
    GS.setFlag('ch8_arrived');
    AUDIO.sfx('thud');
    this.cameras.main.shake(380, 0.005);
    await this.dlg.say(...DIALOGUE.ch8_arrival);
    AUDIO.playMusic(this.mapDef.music);
    this.cut = false;
  }

  /** §A6 BOSS 8 — THE PAPER DRAGON (the phase machine carries the gimmick: physical-immune
   *  while AIRBORNE — Vibe Volt / Milo's Bottle Rockets ground it 2 turns — and a one-time 30%
   *  self-immolation into a doubled-speed BURNING form). A normal HP win on its 45000 HP —
   *  ground it, then burn it down before it burns you. */
  private async paperDragonBossScene(): Promise<void> {
    this.cut = true;
    await this.dlg.say(...DIALOGUE.paper_dragon_door);
    AUDIO.sfx('thud');
    this.cameras.main.shake(460, 0.008);
    await this.wait(420);
    const outcome = await this.startBattle(['paper_dragon'], 'none', [], { boss: true });
    if (outcome !== 'victory') return;
    this.cut = true;
    GS.setFlag('paper_dragon_defeated');
    AUDIO.sfx('confirm');
    this.cameras.main.flash(420, 248, 232, 160);
    await this.dlg.say(...DIALOGUE.paper_dragon_win);
    AUDIO.jingle('victory', 2200, this.mapDef.music);
    this.cut = false;
    this.fadeRestart(); // the bell is free to ring now; the resonance trigger can fire
  }

  /** §A6 Resonance Site — the Mt. Shu temple bell. Before the Dragon is unmade it keeps its
   *  peace; once beaten the bell rings (HEARTLIGHT 8 — The Folded Hymn) and Ember 8 lands. No
   *  joins (the party is whole); ch8_complete opens the §A5 gate to Ch.9. */
  private async mtShuTempleScene(): Promise<void> {
    if (!GS.flag('paper_dragon_defeated')) {
      this.cut = true;
      await this.dlg.say(...DIALOGUE.mt_shu_temple_early);
      this.cut = false;
      return;
    }
    this.cut = true;
    // HEARTLIGHT 8 — the Folded Hymn (Ember 8)
    GS.setFlag('ember8');
    GS.data.embers = 8;
    const ember = this.add.image(this.player.x, this.player.y - s(44), 'ember').setDepth(9999);
    AUDIO.sfx('ember');
    this.sparkleBurst(ember.x, ember.y, 12);
    this.tweens.add({ targets: ember, y: this.player.y - s(30), x: this.player.x, duration: 1300, ease: 'sine.inout' });
    AUDIO.playMusic('heartlight');
    await this.wait(1400);
    this.sparkleBurst(this.player.x, this.player.y - s(30), 14);
    ember.destroy();
    this.cameras.main.flash(300, 248, 232, 160);
    await this.dlg.say(...DIALOGUE.ember8_get);
    GS.setFlag('ch8_complete'); // §A6 — the chapter button (the §A5 gate to Ch.9)
    AUDIO.jingle('victory', 2200, null);
    await this.dlg.say(...DIALOGUE.ch8_card);
    AUDIO.playMusic(this.mapDef.music);
    this.cut = false;
  }

  /* ──────────── CHAPTER 9 — the Romania §A6 beats (arrival / boss+choice / resonance) ──────────── */

  /** the §A6 arrival — Bert sets the party down on the Valea Stelelor green; Dorin's homecoming */
  private async ch9ArrivalScene(): Promise<void> {
    this.cut = true;
    GS.setFlag('ch9_arrived');
    AUDIO.sfx('thud');
    this.cameras.main.shake(380, 0.005);
    await this.dlg.say(...DIALOGUE.ch9_arrival);
    AUDIO.playMusic(this.mapDef.music);
    this.cut = false;
  }

  /** §A6 BOSS 9 — COUNT HOAXULA (the mercyEnding phase machine: theatrical → steals one
   *  equipped item on turn 2 → unmasks at 50% into wild AoE → Mia's PRAY at "good"+ ends
   *  it in mercy). A win on his 95000 HP returns the stolen gear; then the COMPASSION axis
   *  turns on the spot — THE IRON vs THE OPEN HAND (runChoice('ch9_count')). */
  private async countHoaxulaBossScene(): Promise<void> {
    this.cut = true;
    await this.dlg.say(...DIALOGUE.count_hoaxula_door);
    AUDIO.sfx('thud');
    this.cameras.main.shake(460, 0.008);
    await this.wait(420);
    const outcome = await this.startBattle(['count_hoaxula'], 'none', [], { boss: true });
    if (outcome !== 'victory') return;
    this.cut = true;
    GS.setFlag('count_hoaxula_defeated');
    AUDIO.sfx('confirm');
    this.cameras.main.flash(420, 248, 232, 160);
    await this.dlg.say(...DIALOGUE.count_hoaxula_win);
    AUDIO.jingle('victory', 2200, this.mapDef.music);
    this.cut = false;
    // the COMPASSION axis (CHOICE 2) turns on the win — THE IRON vs THE OPEN HAND. The
    // choice_compassion zone past the throne is a backup (it gates on the same flag);
    // firing here guarantees the dilemma lands the moment the Count is freed.
    await this.runChoice('ch9_count');
    this.fadeRestart(); // the way to the monastery is open; the resonance trigger can fire
  }

  /** §A6 Resonance Site — the Stone Brow monastery bell tower. Before the Count is unmasked
   *  it keeps its peace; once he is freed the bell rings (HEARTLIGHT 9) and Ember 9 lands,
   *  and Dorin's Trial of the Mute Mountain is honoured. The party is whole (Dorin has
   *  marched since Minimus — ADR-125), so no one joins; ch9_complete opens the §A5 gate to Ch.10. */
  private async stoneBrowMonasteryScene(): Promise<void> {
    if (!GS.flag('count_hoaxula_defeated')) {
      this.cut = true;
      await this.dlg.say(...DIALOGUE.stone_brow_monastery_early);
      this.cut = false;
      return;
    }
    this.cut = true;
    // HEARTLIGHT 9 — Dorin rings the bell he was once too small to reach (Ember 9)
    GS.setFlag('ember9');
    GS.data.embers = 9;
    const ember = this.add.image(this.player.x, this.player.y - s(44), 'ember').setDepth(9999);
    AUDIO.sfx('ember');
    this.sparkleBurst(ember.x, ember.y, 12);
    this.tweens.add({ targets: ember, y: this.player.y - s(30), x: this.player.x, duration: 1300, ease: 'sine.inout' });
    AUDIO.playMusic('heartlight');
    await this.wait(1400);
    this.sparkleBurst(this.player.x, this.player.y - s(30), 14);
    ember.destroy();
    this.cameras.main.flash(300, 248, 232, 160);
    await this.dlg.say(...DIALOGUE.ember9_get);
    GS.setFlag('ch9_complete'); // §A6 — the chapter button (the §A5 gate to Ch.10)
    AUDIO.jingle('victory', 2200, null);
    await this.dlg.say(...DIALOGUE.ch9_card);
    AUDIO.playMusic(this.mapDef.music);
    this.cut = false;
  }

  /* ──────────── CHAPTER 10 — THE LONG SHOT (§A6 the finale: Alaska → Hawaii → Mars) ──────────── */

  /** the §A6 arrival — the snowcat sets the party down at Aurora Station, the last leg. */
  private async ch10ArrivalScene(): Promise<void> {
    this.cut = true;
    GS.setFlag('ch10_arrived');
    AUDIO.sfx('thud');
    this.cameras.main.shake(360, 0.005);
    await this.dlg.say(...DIALOGUE.ch10_arrival);
    AUDIO.playMusic(this.mapDef.music);
    this.cut = false;
  }

  /** the station radio decodes where the Hush is — out past Mars, the Sea of Silence. */
  private async ch10DecodeScene(): Promise<void> {
    this.cut = true;
    GS.setFlag('ch10_decoded');
    await this.dlg.say(...DIALOGUE.ch10_decode);
    this.cut = false;
  }

  /** §A6 MINIBOSS A — the FROST SENTINEL bars the Aurora ice road (the elemental-golem
   *  gimmick: its FROST SHELL is physical-immune until Mia's FIRE cracks it). Its win
   *  opens the way to Pemberton's seaplane south (the E door to Mauna Lani). */
  private async frostSentinelBossScene(): Promise<void> {
    this.cut = true;
    await this.dlg.say(...DIALOGUE.frost_sentinel_intro);
    AUDIO.sfx('thud');
    this.cameras.main.shake(460, 0.008);
    await this.wait(420);
    const outcome = await this.startBattle(['frost_sentinel'], 'none', [], { boss: true });
    if (outcome !== 'victory') return;
    this.cut = true;
    GS.setFlag('frost_sentinel_defeated');
    AUDIO.sfx('confirm');
    this.cameras.main.flash(420, 200, 240, 255);
    await this.dlg.say(...DIALOGUE.frost_sentinel_win);
    AUDIO.jingle('victory', 2000, this.mapDef.music);
    this.cut = false;
    this.fadeRestart(); // the cracked golem clears; the road E opens
  }

  /** §A6 MINIBOSS B — the TIKI MAGMA GOLEM bars the Mauna Lani launch road (its MAGMA
   *  CORE is physical-immune until Mia's FREEZE quenches it). Its win clears the pad. */
  private async tikiMagmaGolemBossScene(): Promise<void> {
    this.cut = true;
    await this.dlg.say(...DIALOGUE.tiki_magma_golem_intro);
    AUDIO.sfx('thud');
    this.cameras.main.shake(460, 0.008);
    await this.wait(420);
    const outcome = await this.startBattle(['tiki_magma_golem'], 'none', [], { boss: true });
    if (outcome !== 'victory') return;
    this.cut = true;
    GS.setFlag('tiki_magma_golem_defeated');
    AUDIO.sfx('confirm');
    this.cameras.main.flash(420, 255, 200, 140);
    await this.dlg.say(...DIALOGUE.tiki_magma_golem_win);
    AUDIO.jingle('victory', 2000, this.mapDef.music);
    this.cut = false;
    this.fadeRestart();
  }

  /** THE LONG SHOT — Pemberton's rocket lights and throws the party to Mars. Gated past
   *  the Tiki Golem (the gantry sits beyond it on the flats). */
  private async ch10LaunchScene(): Promise<void> {
    if (!GS.flag('tiki_magma_golem_defeated')) {
      this.cut = true;
      await this.dlg.say(...DIALOGUE.sign_the_long_shot);
      this.cut = false;
      return;
    }
    this.cut = true;
    GS.setFlag('ch10_launched');
    await this.dlg.say(...DIALOGUE.ch10_launch);
    AUDIO.sfx('thud');
    this.cameras.main.shake(900, 0.012);
    AUDIO.stopMusic();
    await this.wait(700);
    // The Long Shot throws them off Earth — the hatch opens on the dead sea
    this.goThroughDoor('sea_of_silence', 9 * 16, 23 * 16, 'up');
  }

  /** the §A6 arrival on Mars — the Sea of Silence, where the Hush waits. */
  private async ch10MarsArrivalScene(): Promise<void> {
    this.cut = true;
    GS.setFlag('ch10_mars_arrived');
    AUDIO.sfx('thud');
    this.cameras.main.shake(360, 0.004);
    await this.dlg.say(...DIALOGUE.ch10_mars_arrival);
    AUDIO.playMusic(this.mapDef.music);
    this.cut = false;
  }

  /** CHOICE 3 (the FINALE axis) — on the approach to the Hush: it SPEAKS, the STRINGS
   *  player gives the choice back to Mia, then SILENCE vs FORGIVE is set. The FORGIVE path
   *  is viability-gated (callers + Open-Hand warmth, src/engine/ending.ts): too cold, and
   *  the Answer fails into a forced Silence — a tragic, intentional beat. */
  private async theFinaleChoiceScene(): Promise<void> {
    if (GS.flag('ch10_song_decided') === true) return; // self-gate (decided once)
    this.cut = true;
    await this.dlg.say(...DIALOGUE.hush_speaks);
    if (GS.flag('axis_trust_strings') === true) await this.dlg.say(...DIALOGUE.choice_ch10_mia_gate);
    this.cut = false;
    await this.runChoice('ch10_song'); // sets axis_finale_silence | axis_finale_forgive
    if (GS.flag('axis_finale_forgive') === true && !forgiveViable(endingContext())) {
      this.cut = true;
      await this.dlg.say(...DIALOGUE.the_answer_failed);
      GS.setFlag('axis_finale_forgive', false);
      GS.setFlag('axis_finale_silence', true); // the Answer slips — Silence is the only way left
      this.cut = false;
    }
  }

  /** §A6 BOSS 10 / FINALE — THE HUSH (the bespoke 3-movement fight: THE STATIC → the
   *  un-touchable QUIET → REACHED at 12%, won without a kill). The choice made on the
   *  approach frames the resolution — SILENCE → THE CALLING, FORGIVE → THE ANSWER — then
   *  the canon close: Ember 10, the name-confirm / Homesong / walk home, and the composed
   *  ending over the credits. The end of the road. */
  private async theHushBossScene(): Promise<void> {
    if (GS.flag('ch10_song_decided') !== true) await this.theFinaleChoiceScene(); // defensive
    this.cut = true;
    AUDIO.sfx('thud');
    this.cameras.main.shake(700, 0.011);
    await this.wait(560);
    const outcome = await this.startBattle(['the_hush'], 'none', [], { boss: true });
    if (outcome !== 'victory') return;
    this.cut = true;
    GS.setFlag('the_hush_defeated');
    AUDIO.sfx('confirm');
    this.cameras.main.flash(900, 248, 232, 160);
    // THE RESOLUTION — by CHOICE 3 (both END the Hush; canon honored)
    if (GS.flag('axis_finale_forgive') === true) await this.dlg.say(...DIALOGUE.the_answer);
    else await this.dlg.say(...DIALOGUE.the_calling);
    // HEARTLIGHT 10 — the Homesong is complete; Ember 10 lands
    GS.setFlag('ember10');
    GS.data.embers = 10;
    const ember = this.add.image(this.player.x, this.player.y - s(44), 'ember').setDepth(9999);
    AUDIO.sfx('ember');
    this.sparkleBurst(ember.x, ember.y, 14);
    this.tweens.add({ targets: ember, y: this.player.y - s(30), x: this.player.x, duration: 1300, ease: 'sine.inout' });
    AUDIO.playMusic('heartlight');
    await this.wait(1400);
    this.sparkleBurst(this.player.x, this.player.y - s(30), 16);
    ember.destroy();
    this.cameras.main.flash(300, 248, 232, 160);
    // the canon close — the name-confirm, the full Homesong, the walk home (sacred, shared)
    await this.dlg.say(...DIALOGUE.hush_namesong);
    GS.setFlag('ch10_complete'); // the tenth Ember — the game's last chapter button
    AUDIO.jingle('victory', 2600, null);
    this.cut = false;
    // THE COMPOSED ENDING — the epilogue cards play over the walk home (§A6 / ADR-128)
    await this.playEnding();
  }

  /* ──────────── CHAPTER 4 — the four §A10 quest beats (the Ch.3 pattern) ──────────── */

  /** §A10 #9 — Sigrid's two pond-sized lenses (walk-trigger pickups → her Monocle) */
  private async sigridBeat(): Promise<void> {
    if (!GS.flag('q_sigrid')) {
      await this.dlg.say(...DIALOGUE.q_sigrid_ask);
      GS.setFlag('q_sigrid');
      AUDIO.sfx('confirm');
      return;
    }
    if (GS.flag('q_sigrid_done')) {
      await this.dlg.say(...DIALOGUE.q_sigrid_after);
      return;
    }
    if (!['q_sigrid_lens1', 'q_sigrid_lens2'].every((f) => GS.flag(f))) {
      await this.dlg.say(...DIALOGUE.q_sigrid_active);
      return;
    }
    await this.dlg.say(...DIALOGUE.q_sigrid_full);
    if (completeQuest('sigrids_spectacles') === 'hands-full') {
      await this.dlg.say('@Hands full, dear? Come back with room for a monocle — it\'s worth the pocket.');
      return;
    }
    GS.setFlag('q_sigrid_reported');
    this.cut = true;
    AUDIO.sfx('confirm');
    this.sparkleBurst(this.player.x, this.player.y - s(16), 12);
    await this.dlg.say(...DIALOGUE.q_sigrid_done_beat);
    AUDIO.jingle('victory', 1800, this.mapDef.music);
    this.cut = false;
  }

  /** §A10 — Halvor's unsent letter (he gives it; the sweetheart receives it; he closes it) */
  private async halvorBeat(): Promise<void> {
    if (!GS.flag('q_letter')) {
      await this.dlg.say(...DIALOGUE.q_letter_ask);
      GS.setFlag('q_letter');
      GS.setFlag('q_letter_taken'); // he hands you the letter as he asks
      AUDIO.sfx('confirm');
      return;
    }
    if (GS.flag('q_letter_done')) {
      await this.dlg.say(...DIALOGUE.q_letter_after);
      return;
    }
    if (!GS.flag('q_letter_delivered')) {
      await this.dlg.say(...DIALOGUE.q_letter_active);
      return;
    }
    await this.dlg.say(...DIALOGUE.q_letter_full);
    if (completeQuest('unsent_letter') === 'hands-full') {
      await this.dlg.say('@Pockets full, friend? Make room — this one comes with a warm thing attached.');
      return;
    }
    GS.setFlag('q_letter_reported');
    this.cut = true;
    AUDIO.sfx('confirm');
    this.sparkleBurst(this.player.x, this.player.y - s(16), 10);
    await this.dlg.say(...DIALOGUE.q_letter_done_beat);
    AUDIO.jingle('victory', 1800, this.mapDef.music);
    this.cut = false;
  }

  /** §A10 — the delivery half: read Halvor's letter to his sweetheart in Lilleby */
  private async sweetheartBeat(): Promise<void> {
    if (GS.flag('q_letter') && !GS.flag('q_letter_delivered')) {
      this.cut = true;
      await this.dlg.say(...DIALOGUE.q_letter_deliver);
      GS.setFlag('q_letter_delivered');
      AUDIO.sfx('confirm');
      this.sparkleBurst(this.player.x, this.player.y - s(16), 8);
      await this.dlg.say(...DIALOGUE.q_letter_deliver_done);
      this.cut = false;
      return;
    }
    await this.dlg.say(...DIALOGUE.npc_ll_sweetheart);
  }

  /** §A10 — the silenced harbor bell: find the clapper, ring it loud, report back */
  private async bellBeat(): Promise<void> {
    if (!GS.flag('q_bell')) {
      await this.dlg.say(...DIALOGUE.q_bell_ask);
      GS.setFlag('q_bell');
      AUDIO.sfx('confirm');
      return;
    }
    if (GS.flag('q_bell_done')) {
      await this.dlg.say(...DIALOGUE.q_bell_after);
      return;
    }
    if (!GS.flag('q_bell_clapper')) {
      await this.dlg.say(...DIALOGUE.q_bell_active);
      return;
    }
    if (!GS.flag('q_bell_rung')) {
      // clapper in hand — ring the bell together (the NOISE payoff)
      this.cut = true;
      await this.dlg.say(...DIALOGUE.q_bell_ring);
      GS.setFlag('q_bell_rung');
      AUDIO.sfx('confirm');
      this.cameras.main.flash(300, 248, 232, 160);
      this.cut = false;
      return;
    }
    await this.dlg.say(...DIALOGUE.q_bell_full);
    if (completeQuest('the_silenced_bell') === 'hands-full') {
      await this.dlg.say('@Hands full? Empty a pocket — a ship\'s bell wants carrying properly.');
      return;
    }
    GS.setFlag('q_bell_reported');
    this.cut = true;
    AUDIO.sfx('confirm');
    this.sparkleBurst(this.player.x, this.player.y - s(16), 10);
    await this.dlg.say(...DIALOGUE.q_bell_done_beat);
    AUDIO.jingle('victory', 1800, this.mapDef.music);
    this.cut = false;
  }

  /** §A10 — the giants' human-sized picnic (gather the fixings as walk pickups; the
   *  Mayor lays it on once brunost + berry + table are all set → the Troll Cross) */
  private async picnicBeat(): Promise<void> {
    if (!GS.flag('q_picnic')) {
      await this.dlg.say(...DIALOGUE.q_picnic_ask);
      GS.setFlag('q_picnic');
      AUDIO.sfx('confirm');
      return;
    }
    if (GS.flag('q_picnic_done')) {
      await this.dlg.say(...DIALOGUE.q_picnic_after);
      return;
    }
    if (!['q_picnic_brunost', 'q_picnic_berry', 'q_picnic_set'].every((f) => GS.flag(f))) {
      await this.dlg.say(...DIALOGUE.q_picnic_active);
      return;
    }
    await this.dlg.say(...DIALOGUE.q_picnic_full);
    if (completeQuest('the_giants_picnic') === 'hands-full') {
      await this.dlg.say('@(He kneels, concerned.) Your tiny pockets are full! Make room for a tiny — well, giant — gift.');
      return;
    }
    this.cut = true;
    AUDIO.sfx('confirm');
    this.sparkleBurst(this.player.x, this.player.y - s(16), 12);
    await this.dlg.say(...DIALOGUE.q_picnic_done_beat);
    AUDIO.jingle('victory', 1800, this.mapDef.music);
    this.cut = false;
  }

  /** the §A10 Ch.3 "find" pickups — a walk trigger hands the player a quest beat when
   *  its quest is active (the walk_token precedent). No-ops otherwise; non-missable. */
  private static readonly QUEST_PICKUPS: Record<string, { flag: string; dialogue: string; active: string; done: string; of: string[]; giver: string }> = {
    q_overdue_b1: { flag: 'q_overdue_b1', dialogue: 'q_overdue_b1', active: 'q_overdue', done: 'q_overdue_done', of: ['q_overdue_b1', 'q_overdue_b2', 'q_overdue_b3'], giver: 'the librarian' },
    q_overdue_b2: { flag: 'q_overdue_b2', dialogue: 'q_overdue_b2', active: 'q_overdue', done: 'q_overdue_done', of: ['q_overdue_b1', 'q_overdue_b2', 'q_overdue_b3'], giver: 'the librarian' },
    q_overdue_b3: { flag: 'q_overdue_b3', dialogue: 'q_overdue_b3', active: 'q_overdue', done: 'q_overdue_done', of: ['q_overdue_b1', 'q_overdue_b2', 'q_overdue_b3'], giver: 'the librarian' },
    q_sender_l1: { flag: 'q_sender_l1', dialogue: 'q_sender_l1', active: 'q_sender', done: 'q_sender_done', of: ['q_sender_l1', 'q_sender_l2', 'q_sender_l3'], giver: 'the postmistress' },
    q_sender_l2: { flag: 'q_sender_l2', dialogue: 'q_sender_l2', active: 'q_sender', done: 'q_sender_done', of: ['q_sender_l1', 'q_sender_l2', 'q_sender_l3'], giver: 'the postmistress' },
    q_sender_l3: { flag: 'q_sender_l3', dialogue: 'q_sender_l3', active: 'q_sender', done: 'q_sender_done', of: ['q_sender_l1', 'q_sender_l2', 'q_sender_l3'], giver: 'the postmistress' },
    q_penny_found: { flag: 'q_penny_found', dialogue: 'q_penny_find', active: 'q_penny', done: 'q_penny_done', of: ['q_penny_found'], giver: 'the boy' },
    q_cuppa_milk: { flag: 'q_cuppa_milk', dialogue: 'q_cuppa_milk', active: 'q_cuppa', done: 'q_cuppa_done', of: ['q_cuppa_leaves', 'q_cuppa_milk', 'q_cuppa_water'], giver: 'the groundskeeper' },
    q_cuppa_water: { flag: 'q_cuppa_water', dialogue: 'q_cuppa_water', active: 'q_cuppa', done: 'q_cuppa_done', of: ['q_cuppa_leaves', 'q_cuppa_milk', 'q_cuppa_water'], giver: 'the groundskeeper' },
    // CH.4 Norway — the lenses (Sigrid), the bell's clapper, the picnic fixings (Mayor)
    q_sigrid_lens1: { flag: 'q_sigrid_lens1', dialogue: 'q_sigrid_lens1', active: 'q_sigrid', done: 'q_sigrid_done', of: ['q_sigrid_lens1', 'q_sigrid_lens2'], giver: 'Sigrid' },
    q_sigrid_lens2: { flag: 'q_sigrid_lens2', dialogue: 'q_sigrid_lens2', active: 'q_sigrid', done: 'q_sigrid_done', of: ['q_sigrid_lens1', 'q_sigrid_lens2'], giver: 'Sigrid' },
    q_bell_clapper: { flag: 'q_bell_clapper', dialogue: 'q_bell_clapper', active: 'q_bell', done: 'q_bell_done', of: ['q_bell_clapper'], giver: 'the bellkeeper' },
    q_picnic_brunost: { flag: 'q_picnic_brunost', dialogue: 'q_picnic_brunost', active: 'q_picnic', done: 'q_picnic_done', of: ['q_picnic_brunost', 'q_picnic_berry', 'q_picnic_set'], giver: 'the Mayor' },
    q_picnic_berry: { flag: 'q_picnic_berry', dialogue: 'q_picnic_berry', active: 'q_picnic', done: 'q_picnic_done', of: ['q_picnic_brunost', 'q_picnic_berry', 'q_picnic_set'], giver: 'the Mayor' },
    q_picnic_set: { flag: 'q_picnic_set', dialogue: 'q_picnic_set', active: 'q_picnic', done: 'q_picnic_done', of: ['q_picnic_brunost', 'q_picnic_berry', 'q_picnic_set'], giver: 'the Mayor' },
  };

  private async questPickup(id: string): Promise<void> {
    const p = OverworldScene.QUEST_PICKUPS[id];
    if (!p || !GS.flag(p.active) || GS.flag(p.done) || GS.flag(p.flag)) return;
    this.cut = true;
    GS.setFlag(p.flag);
    AUDIO.sfx('ember');
    this.sparkleBurst(this.player.x, this.player.y - s(14), 8);
    await this.dlg.say(...DIALOGUE[p.dialogue]);
    const n = p.of.filter((f) => GS.flag(f)).length;
    toast(this, `(${n}/${p.of.length} — then back to ${p.giver}.)`);
    this.cut = false;
  }

  /**
   * S15i Task 4 (ADR-057) — THE MALECÓN: a warm waterfront beat on first crossing
   * into the grown DOCK DISTRICT. The party takes in the working harbor — cranes,
   * customs houses, the cathedral tower over it all — and the road east to the
   * jungle. Paced by a gentle east-pan so each line lands, then home (the cut/dlg/
   * camera pattern; fires once via puerto_malecon_done).
   */
  /**
   * S15i Task 6 (ADR-059) — THE CAGE PARK: the first-arrival beat. You come off the
   * Brickton street into a real neighbourhood park — the mural, the practice court, a
   * ball bouncing somewhere ahead — and the chain-link gate to THE CAGE up at the top.
   * A gentle north-pan over the narration, then home (the cut/dlg/camera pattern, once).
   */
  private async cageParkScene(): Promise<void> {
    this.cut = true;
    GS.setFlag('cage_park_reveal_done');
    await this.wait(220);
    // look UP toward the cage gate (north), over the narration, then back
    this.cameras.main.pan(this.player.x, Math.max(this.player.y - s(200), s(24)), 2400, 'Sine.easeInOut', true);
    await this.dlg.say(...DIALOGUE.cage_park_reveal.slice(0, 2));
    AUDIO.sfx('cursor');
    await this.dlg.say(...DIALOGUE.cage_park_reveal.slice(2));
    this.cameras.main.pan(this.player.x, this.player.y, 1000, 'Sine.easeInOut', true);
    this.cameras.main.startFollow(this.player, true, 0.18, 0.18);
    this.cut = false;
  }

  /**
   * S15i Task 6 (ADR-059) — THE LINKS ESTATES: the first-arrival beat. Past the
   * clifftop gate, the money: manicured fairway, pastel mansions, a fountain you
   * could bathe a horse in, and the grand clubhouse up at the head of the cart path.
   * A north-pan over the narration, then home (cut/dlg/camera, once).
   */
  private async golfResortScene(): Promise<void> {
    this.cut = true;
    GS.setFlag('golf_resort_reveal_done');
    await this.wait(220);
    this.cameras.main.pan(this.player.x, Math.max(this.player.y - s(200), s(24)), 2400, 'Sine.easeInOut', true);
    await this.dlg.say(...DIALOGUE.golf_resort_reveal.slice(0, 2));
    AUDIO.sfx('cursor');
    await this.dlg.say(...DIALOGUE.golf_resort_reveal.slice(2));
    this.cameras.main.pan(this.player.x, this.player.y, 1000, 'Sine.easeInOut', true);
    this.cameras.main.startFollow(this.player, true, 0.18, 0.18);
    this.cut = false;
  }

  private async puertoMaleconScene(): Promise<void> {
    this.cut = true;
    GS.setFlag('puerto_malecon_done');
    await this.wait(220);
    const mapW = this.mapDef.grid[0].length * TILE_PX;
    // look east down the quay, over the narration, then back to the party
    this.cameras.main.pan(Math.min(this.player.x + s(220), mapW - s(16)), this.player.y, 2600, 'Sine.easeInOut', true);
    await this.dlg.say(...DIALOGUE.puerto_malecon.slice(0, 2));
    AUDIO.sfx('cursor');
    await this.dlg.say(...DIALOGUE.puerto_malecon.slice(2));
    this.cameras.main.pan(this.player.x, this.player.y, 1000, 'Sine.easeInOut', true);
    this.cameras.main.startFollow(this.player, true, 0.18, 0.18);
    this.cut = false;
  }

  /** Ch.1 opening, phase 4 — the bedroom wake (after the cinematic's last cut). */
  private async introScene(): Promise<void> {
    this.cut = true;
    GS.setFlag('intro_done');
    // the bedroom fades in from the create()-placed entry blackout (no world-flash);
    // the aftershock rumbles as {rex} wakes.
    const cover = this.entryBlackout ?? this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0x000000)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(DEPTH_UI - 1); // below the dialogue windows
    this.entryBlackout = undefined;
    AUDIO.sfx('rumble');
    this.cameras.main.shake(900, 0.005);
    this.tweens.add({ targets: cover, alpha: 0, duration: 1200, onComplete: () => cover.destroy() });
    await this.wait(1300);
    await this.dlg.say(...DIALOGUE.intro_wake);
    GS.setFlag('meteor_fell');
    AUDIO.playMusic(this.mapDef.music); // the opening theme hands off to the room
    this.cut = false;
  }

  /** Which opening-cinematic phase should run on this map (0 = none). */
  private opPhase(): OpeningPhase {
    return openingPhase(
      this.mapDef.id,
      { intro_done: !!GS.flag('intro_done'), op_fell: !!GS.flag('op_fell'), op_house: !!GS.flag('op_house') },
      this.openingRequested,
    );
  }

  /** A clean cinematic map-cut: fade to black, then restart on `to` (no door
   *  whoosh/zoom). The next opening phase reveals the new map behind its blackout. */
  private cinematicCut(to: string, tx: number, ty: number): void {
    if (this.transitioning) return;
    this.transitioning = true;
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.restart({ mapId: to, x: s(tx), y: s(ty), facing: 'down' });
    });
  }

  /**
   * Ch.1 OPENING phase 1 (Hickory Hill): an establishing card, then the meteor
   * falls into the REAL crater (camera push-in) → impact → the painted card; then
   * a cinematic cut to town for the overview. The OLD vector openingMeteorCinema
   * below is a missing-art fallback only (it never runs once the art is present).
   */
  private async playOpeningCinema(): Promise<void> {
    this.cut = true;
    if (!this.textures.exists('meteor_rock_hickory_hill')) {
      await this.openingMeteorCinema();
      this.entryBlackout?.destroy();
      this.entryBlackout = undefined;
      GS.setFlag('op_fell');
      GS.setFlag('op_house'); // skip the overview phases; drop to the bedroom wake
      this.cinematicCut('rex_bedroom', 72, 88);
      return;
    }
    const cam = this.cameras.main;
    cam.stopFollow();
    this.player.setVisible(false);

    // the landing = the REAL crater. Anchor on the static meteor_rock prop (props
    // render at ORIGIN (0,0) at tile*TILE_PX), hidden until the fall lands; the
    // crater CENTER is its top-left PLUS half its drawn size.
    const landed = this.children.list.filter(
      (o): o is Phaser.GameObjects.Image =>
        o instanceof Phaser.GameObjects.Image && o.texture.key === 'meteor_rock_hickory_hill',
    );
    landed.forEach((o) => o.setVisible(false));
    const prop = landed[0];
    const impactX = prop ? prop.x + prop.displayWidth / 2 : 69 * TILE_PX;
    const impactY = prop ? prop.y + prop.displayHeight / 2 : 6 * TILE_PX;
    // the night tint now covers at any zoom, so the opening sits WIDER
    cam.setZoom(0.8);
    cam.centerOn(impactX, impactY);

    // 1) establishing still — the wrong star (held long)
    await showCard(this, 'meteor_2am', { chapter: 'ch1', caption: 'Otterbrook, Ohio. Summer, 1995.', ms: 3800 });

    // reveal the live night hill behind the card (fade the no-flash entry blackout)
    if (this.entryBlackout) {
      const b = this.entryBlackout;
      this.entryBlackout = undefined;
      this.tweens.add({ targets: b, alpha: 0, duration: 450, onComplete: () => b.destroy() });
    }

    // 2) the descent — it falls into the crater while the camera leans IN, slowly
    await this.wait(700);
    cam.zoomTo(0.95, 4400, 'Sine.easeInOut');
    // narrate the fall so the silent overworld beat reads as story, not screensaver
    void showCaption(this, 'A wrong star falls over Otterbrook — too low, too bright, and coming down fast.', { ms: 3000 });
    const shadow = this.add
      .image(impactX, impactY, 'mob_shadow')
      .setOrigin(0.5, 0.5).setAlpha(0).setScale(0.5).setDepth(impactY - 1);
    const meteor = this.add
      .image(impactX + s(90), impactY - s(300), 'meteor_rock_hickory_hill')
      .setOrigin(0.5, 0.5).setScale(0.25).setDepth(900_000);
    const shed = this.time.addEvent({
      delay: 50, loop: true,
      callback: () => {
        const p = this.add.sprite(meteor.x, meteor.y, 'spark', 0).setDepth(899_999).setScale(0.7 + (meteor.y % 5) * 0.1);
        this.tweens.add({ targets: p, x: p.x + s(8), y: p.y - s(6), alpha: 0, scale: 0.2, duration: 360, onComplete: () => p.destroy() });
      },
    });
    this.tweens.add({ targets: shadow, alpha: 0.55, scale: 1.6, duration: 4000 });
    await new Promise<void>((res) => {
      this.tweens.add({ targets: meteor, x: impactX, y: impactY, scale: 1, angle: 200, duration: 4000, ease: 'Quad.easeIn', onComplete: () => res() });
    });
    shed.remove();

    // 3) IMPACT — the crater takes it; the static rock becomes the landed meteor
    AUDIO.sfx('meteor_crash');
    cam.flash(260, 255, 250, 235);
    cam.shake(1500, 0.022);
    meteor.destroy();
    shadow.destroy();
    landed.forEach((o) => o.setVisible(true));
    this.sparkleBurst(impactX, impactY, 18);
    const glow = this.add.circle(impactX, impactY, s(22), 0xf8d868, 0.5).setDepth(impactY - 2);
    this.tweens.add({ targets: glow, scale: 1.6, fillAlpha: 0.2, duration: 900, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    await this.wait(1500);

    // 4) the painted impact card (held long)
    await showCard(this, 'hickory_hill', { chapter: 'ch1', caption: 'It comes down behind Hickory Hill, and the whole town feels it land.', ms: 3800 });

    // hand off to the OVERVIEW (phase 2) INLINE — same elevated map (no cut). The crater,
    // {rex}'s house, and the climb all live here now.
    GS.setFlag('op_fell');
    await this.openingHouseOverview();
  }

  /** Opening phase 2 (Otterbrook): the overview opens on {rex}'s house, holds, then
   *  pans up toward the road out of town — then cuts to the hill for the climb. */
  private async openingHouseOverview(): Promise<void> {
    this.cut = true;
    const cam = this.cameras.main;
    cam.stopFollow();
    this.player.setVisible(false);
    const house = this.children.list.find(
      (o): o is Phaser.GameObjects.Image =>
        o instanceof Phaser.GameObjects.Image && o.texture.key === 'house_rex',
    );
    const houseX = house ? house.x + house.displayWidth / 2 : 49 * TILE_PX;
    const houseY = house ? house.y + house.displayHeight / 2 : 52 * TILE_PX;
    cam.setZoom(0.9); // open on the house + its street (wide), not jammed in close
    cam.centerOn(houseX, houseY);
    if (this.entryBlackout) {
      const b = this.entryBlackout;
      this.entryBlackout = undefined;
      this.tweens.add({ targets: b, alpha: 0, duration: 600, onComplete: () => b.destroy() });
    }
    AUDIO.sfx('rumble');
    // establish on the sleeping house, with a line so the player knows whose it is
    await showCaption(this, "Down one of these streets, a kid named {rex} is fast asleep — same as the whole town.", { ms: 2800 });
    // then drift up toward the hill road, narrating what's waiting up there —
    // the S9 LONG CLIMB leaves the terrace at the x56 stair, so the drift ends
    // on the trail foot (the climb phase picks up the camera right there)
    cam.pan(56 * TILE_PX, 44 * TILE_PX, 4200, 'Sine.easeInOut'); // drift to the crater trail's foot
    await showCaption(this, "But something came down on the hill tonight, and it's still glowing up there.", { ms: 3400 });
    await this.wait(400);
    GS.setFlag('op_house');
    await this.openingHillClimb(); // INLINE — the climb is up THIS map's terraces now
  }

  /** Opening phase 3 (Hickory Hill): the overview climbs the hill — the trail up
   *  from town to the smoking crater — then cuts to the bedroom for the wake. */
  private async openingHillClimb(): Promise<void> {
    this.cut = true;
    const cam = this.cameras.main;
    cam.stopFollow();
    this.player.setVisible(false);
    const landed = this.children.list.find(
      (o): o is Phaser.GameObjects.Image =>
        o instanceof Phaser.GameObjects.Image && o.texture.key === 'meteor_rock_hickory_hill',
    );
    const craterX = landed ? landed.x + landed.displayWidth / 2 : 69 * TILE_PX;
    const craterY = landed ? landed.y + landed.displayHeight / 2 : 6 * TILE_PX;
    cam.setZoom(0.78); // wide — the whole hill reads as a climb
    cam.centerOn(56 * TILE_PX, 46 * TILE_PX); // start at the stair foot of the LONG CLIMB (where the overview left us)
    if (this.entryBlackout) {
      const b = this.entryBlackout;
      this.entryBlackout = undefined;
      this.tweens.add({ targets: b, alpha: 0, duration: 600, onComplete: () => b.destroy() });
    }
    const glow = this.add.circle(craterX, craterY, s(22), 0xf8d868, 0.45).setDepth(craterY - 2);
    this.tweens.add({ targets: glow, scale: 1.6, fillAlpha: 0.2, duration: 900, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    await this.wait(700);
    AUDIO.sfx('rumble');
    cam.pan(craterX, craterY, 6500, 'Sine.easeInOut'); // a slow climb to the crater
    // two lines pace the climb so the long pan reads as a story beat, not dead air
    await showCaption(this, "The trail climbs Hickory Hill, toward a light that wasn't there yesterday.", { ms: 2600 });
    await showCaption(this, 'Whatever fell is still up there — still glowing, still warm.', { ms: 2400 });
    await this.wait(800);
    this.cinematicCut('rex_bedroom', 72, 88);
  }

  /** Hybrid STAGED cutscene — the ch1-close first Heartlight (card → live {faye}/
   *  {rex} acting it out). Public so a story trigger (or QA) can fire it. */
  async playFirstHeartlightStaged(): Promise<void> {
    this.cut = true;
    await playStagedScene(this, ch1FirstHeartlight, { dialogue: this.dlg });
    this.cut = false;
  }

  /**
   * ADR-041 — the opening, start to finish: the wrong star → it grows → the
   * descent (sonic boom at mid-sky) → impact behind Hickory Hill (whiteout,
   * shockwaves, debris, dust, aftershocks) → ten motes scatter, one stays
   * (§A6, wordless) → the town's porch lights wake → pan + push-in on
   * {rex}'s house → fade into the bedroom. Captions are timed — no button
   * presses; the QA driver fast-forwards via pumped frames per ADR-008.
   * Paint order is law here: sky < world < fx < caption (the old cinema
   * added `world` first and the sky rects painted over the whole town).
   */
  private async openingMeteorCinema(): Promise<void> {
    // This whole cinema is composed in the NATIVE 400×225 design space (the town
    // strip, sky bands, star arrays, impact points, debris arcs are all hand-tuned
    // native px). Rather than wrap ~150 literals, the cinema CONTAINER is scaled
    // ×ART_SCALE once — every child composes uniformly and ×1 stays identical
    // (scale 1). So W/H here are the native frame, NOT this.scale.width/height.
    const W = 400;
    const H = 225;
    const cinema = this.add.container(0, 0).setScrollFactor(0).setDepth(DEPTH_UI + 20).setScale(ART_SCALE);
    const sky = this.add.container(0, 0);
    const world = this.add.container(0, 0);
    const fx = this.add.container(0, 0);
    cinema.add([sky, world, fx]);
    const addTo = <T extends Phaser.GameObjects.GameObject>(target: Phaser.GameObjects.Container, obj: T): T => {
      target.add(obj);
      return obj;
    };
    const waitTween = (cfg: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> =>
      new Promise((resolve) => {
        this.tweens.add({ ...cfg, onComplete: () => resolve() });
      });
    // timed captions: fade in, hold long enough to read twice, fade out
    const caption = addTo(
      cinema,
      this.add
        .bitmapText(W / 2, H - 28, 'retro', '', 6)
        .setOrigin(0.5, 0)
        .setTint(0xf8f0d0)
        .setCenterAlign()
        .setMaxWidth(W - 40)
        .setAlpha(0),
    );
    const say = async (text: string): Promise<void> => {
      caption.setText(vars(text)).setAlpha(0);
      this.tweens.add({ targets: caption, alpha: 1, duration: 260 });
      // unhurried: kids read this (user pacing note, ADR-041)
      await this.wait(Math.max(2600, 1000 + text.length * 55));
      await waitTween({ targets: caption, alpha: 0, duration: 240 });
    };

    /* ---- the sky: bands, a crescent moon, stars that actually twinkle ---- */
    addTo(sky, this.add.rectangle(0, 0, W, H, 0x080816).setOrigin(0));
    addTo(sky, this.add.rectangle(0, 86, W, 62, 0x151832).setOrigin(0).setAlpha(0.72));
    addTo(sky, this.add.rectangle(0, 145, W, H - 145, 0x10151e).setOrigin(0));
    addTo(sky, this.add.circle(56, 24, 10, 0xe8e8d8, 0.9));
    addTo(sky, this.add.circle(62, 20, 9, 0x080816)); // the night bites the moon
    const starSpots = [
      [34, 20, 1], [78, 52, 0.7], [118, 29, 1], [176, 18, 0.6], [238, 44, 0.9],
      [288, 16, 0.8], [362, 56, 1], [22, 64, 0.5], [142, 58, 0.6], [200, 36, 0.8],
      [262, 12, 0.7], [332, 40, 0.6], [388, 18, 0.9], [98, 12, 0.7],
    ] as const;
    for (const [x, y, a] of starSpots) {
      const st = addTo(sky, this.add.rectangle(x, y, 2, 2, 0xf8f0d0).setAlpha(a));
      // deterministic twinkle (coords as seed — no rng() before maps, ADR-012)
      this.tweens.add({ targets: st, alpha: a * 0.35, duration: 900 + ((x * 7) % 900), yoyo: true, repeat: -1, delay: (y * 13) % 700 });
    }

    /* ---- the town strip: 840 wide, Hickory Hill west, {rex}'s house east ---- */
    addTo(world, this.add.rectangle(0, 150, 840, 90, 0x172414).setOrigin(0));
    addTo(world, this.add.rectangle(0, 152, 840, 4, 0x23231f).setOrigin(0)); // sidewalk
    addTo(world, this.add.rectangle(0, 192, 840, 11, 0x121318).setOrigin(0)); // the 6:15's route
    for (let dx = 8; dx < 840; dx += 46) {
      addTo(world, this.add.rectangle(dx, 197, 14, 2, 0x2c2c26).setOrigin(0).setAlpha(0.55));
    }
    // hill triangles: vertex coords are POSITIVE-DOWN with the peak first-row
    // (the old negative-y vertices rendered the hill upside down — invisible
    // for as long as the sky painted over the world, screenshot-caught now)
    addTo(world, this.add.triangle(120, 150, 0, 88, 204, 0, 400, 88, 0x20301b).setOrigin(0.5, 1));
    // the crater lives BETWEEN the hill and its front ridge — impact reads "behind"
    const craterLayer = addTo(world, this.add.container(0, 0));
    addTo(world, this.add.triangle(156, 154, 0, 54, 140, 0, 280, 54, 0x121d16).setOrigin(0.5, 1));
    const hillTreeA = addTo(world, this.add.image(118, 150, 'tree_b').setOrigin(0.5, 1).setScale(1.1).setTint(0x384828));
    const hillTreeB = addTo(world, this.add.image(182, 154, 'tree_b').setOrigin(0.5, 1).setScale(0.85).setTint(0x2d3d24));
    addTo(world, this.add.image(476, 148, 'skyline').setOrigin(0.5, 1).setScale(1.1).setTint(0x273042).setAlpha(0.6));
    // Otterbrook asleep: dark houses between the hill and home
    const lots = [
      { key: 'house_a', x: 350, s: 0.8, tint: 0x3a4566 },
      { key: 'house_b', x: 415, s: 0.85, tint: 0x344060 },
      { key: 'drugstore', x: 497, s: 0.8, tint: 0x2f3a55 },
      { key: 'house_chad', x: 688, s: 0.85, tint: 0x3a4566 },
      { key: 'arcade', x: 766, s: 0.8, tint: 0x3d3a60 },
    ] as const;
    for (const b of lots) {
      addTo(world, this.add.image(b.x, 151, b.key).setOrigin(0.5, 1).setScale(b.s).setTint(b.tint));
    }
    addTo(world, this.add.image(318, 152, 'tree_c').setOrigin(0.5, 1).setScale(0.9).setTint(0x2d3d24));
    addTo(world, this.add.image(548, 154, 'tree_b').setOrigin(0.5, 1).setScale(0.9).setTint(0x344527));
    addTo(world, this.add.image(645, 153, 'tree').setOrigin(0.5, 1).setScale(0.8).setTint(0x2d3d24));
    addTo(world, this.add.image(806, 152, 'tree_b').setOrigin(0.5, 1).setScale(0.85).setTint(0x2d3d24));
    for (const px of [332, 452, 583, 716]) {
      addTo(world, this.add.image(px, 151, 'phone_pole').setOrigin(0.5, 1).setScale(0.8).setTint(0x39435f).setAlpha(0.9));
    }
    // {rex}'s house — the destination (slightly warmer: one porch light is on)
    addTo(world, this.add.image(610, 151, 'house_rex').setOrigin(0.5, 1).setScale(0.9).setTint(0x6a72a0));
    const porch = addTo(world, this.add.rectangle(602, 143, 3, 3, 0xf8e8a0).setAlpha(0.85));
    addTo(world, this.add.circle(602, 143, 7, 0xf8e8a0, 0.1));
    this.tweens.add({ targets: porch, alpha: 0.55, duration: 1300, yoyo: true, repeat: -1 });
    const rexWindow = addTo(world, this.add.rectangle(600, 118, 16, 10, 0xf8e8a0).setAlpha(0.06));
    const rexGlow = addTo(world, this.add.circle(600, 118, 13, 0xf8e8a0, 0));
    // dark windows that wake after the impact, hill-side first
    const sleepers = [
      [346, 133], [421, 130], [491, 134], [694, 132], [766, 133],
    ].map(([wx, wy]) => addTo(world, this.add.rectangle(wx, wy, 7, 6, 0xf8e8a0).setAlpha(0)));

    /* ---- PHASE 1: the quiet (fade in over the sleeping town) ---- */
    AUDIO.playMusic('starfall');
    const blackIn = addTo(fx, this.add.rectangle(0, 0, W, H, 0x06060e).setOrigin(0));
    await waitTween({ targets: blackIn, alpha: 0, duration: 1100, ease: 'sine.out' });
    blackIn.destroy();
    await say('Otterbrook, Ohio. Summer, 1995.');
    await say('2:11 AM. The whole town is asleep — except the crickets, one porch light, and a dog barking up at the sky.');

    /* ---- PHASE 2: the wrong star ---- */
    const skyGlow = addTo(fx, this.add.rectangle(0, 0, W, H, 0xf8a868).setOrigin(0).setAlpha(0));
    const halo = addTo(fx, this.add.circle(312, 26, 5, 0xf8e8a0, 0));
    const star = addTo(fx, this.add.circle(312, 26, 1.5, 0xf8f0d0).setAlpha(0));
    AUDIO.sfx('meteor_far');
    this.tweens.add({ targets: star, alpha: 1, duration: 900 });
    this.tweens.add({ targets: halo, fillAlpha: 0.14, scale: 2.2, duration: 1400, ease: 'sine.inout' });
    await say('High above town, something small and bright begins to move.');
    AUDIO.sfx('meteor_far');
    this.tweens.add({ targets: star, scale: 3.4, duration: 2600, ease: 'quad.in' });
    this.tweens.add({ targets: halo, scale: 4.6, fillAlpha: 0.22, duration: 2600, ease: 'quad.in' });
    this.time.delayedCall(900, () => star.setFillStyle(0xf8e8a0));
    this.time.delayedCall(1900, () => star.setFillStyle(0xf8d868));
    await say('One of the stars is getting bigger. Stars are not supposed to do that.');

    /* ---- PHASE 3: the descent (no words — the sky is talking) ---- */
    star.destroy();
    halo.destroy();
    // the saddle BETWEEN the back hill and the front ridge — the rock buries
    // into the slope and the ridge hides its base (landing on the summit
    // reads as "balanced on the mountain", user-rejected)
    const impact = { x: 192, y: 110 };
    const dropMs = 2800;
    // The trail STREAMS BEHIND the rock along its travel axis (145°, the line
    // from the entry point to impact). "Behind" is the unit vector (0.819,
    // -0.573) — up and to the right, toward where the rock came from. Each
    // trail rect's CENTER sits ~(half its length) back along that vector, with
    // a small overlap, so the rock rides the LEADING tip of the streak instead
    // of floating mid-line (the user's "meteor is in the middle of its trail").
    const behind = { x: 0.819, y: -0.573 };
    const trailGlow = addTo(fx, this.add.rectangle(312 + behind.x * 70, 26 + behind.y * 70, 150, 7, 0xf8e8a0).setAngle(145).setAlpha(0.5));
    const trailHot = addTo(fx, this.add.rectangle(312 + behind.x * 37, 26 + behind.y * 37, 84, 3, 0xf86f4f).setAngle(145).setAlpha(0.9));
    const rock = addTo(fx, this.add.image(312, 26, 'meteor_rock').setScale(0.34).setAngle(28).setTint(0xf8d868));
    AUDIO.sfx('meteor_fall');
    this.tweens.add({ targets: rock, scale: 0.62, angle: '+=210', duration: dropMs, ease: 'quad.in' });
    this.tweens.add({ targets: skyGlow, alpha: 0.16, duration: dropMs - 200, ease: 'quad.in' });
    this.tweens.add({ targets: trailGlow, alpha: 0.28, duration: 150, yoyo: true, repeat: 9 });
    this.tweens.add({ targets: trailHot, alpha: 0.4, duration: 110, yoyo: true, repeat: 12 });
    // shed sparks the whole way down
    const shedTimer = this.time.addEvent({
      delay: 70,
      repeat: Math.floor(dropMs / 70) - 2,
      callback: () => {
        const p = addTo(
          fx,
          this.add.rectangle(rock.x + Phaser.Math.Between(-3, 3), rock.y + Phaser.Math.Between(-3, 3), 2, 2, Math.random() < 0.5 ? 0xf8e8a0 : 0xf87848),
        );
        this.tweens.add({ targets: p, x: p.x + 14 + Math.random() * 10, y: p.y - 6 - Math.random() * 8, alpha: 0, duration: 380, onComplete: () => p.destroy() });
      },
    });
    // halfway down it breaks the sound barrier — the sky cracks once
    this.time.delayedCall(Math.floor(dropMs * 0.54), () => {
      AUDIO.sfx('sonic_boom');
      this.cameras.main.flash(140, 248, 232, 208);
      this.cameras.main.shake(200, 0.004);
      const ring = addTo(fx, this.add.circle(rock.x, rock.y, 6, 0xffffff, 0).setStrokeStyle(2, 0xf8f0d0, 0.8));
      this.tweens.add({ targets: ring, scale: 7, alpha: 0, duration: 480, ease: 'quad.out', onComplete: () => ring.destroy() });
    });
    await waitTween({
      targets: [rock, trailGlow, trailHot],
      x: `+=${impact.x - 312}`,
      y: `+=${impact.y - 26}`,
      duration: dropMs,
      ease: 'Quad.easeIn',
    });
    shedTimer.remove();

    /* ---- PHASE 4: IMPACT (whiteout covers the swap to the crater) ---- */
    AUDIO.stopMusic(); // the drone dies with the night — silence is the score now
    AUDIO.sfx('meteor_crash');
    rock.destroy();
    this.tweens.add({ targets: [trailGlow, trailHot], alpha: 0, duration: 600, onComplete: () => { trailGlow.destroy(); trailHot.destroy(); } });
    this.tweens.add({ targets: skyGlow, alpha: 0, duration: 400 });
    const white = addTo(fx, this.add.rectangle(0, 0, W, H, 0xf8f0e0).setOrigin(0).setAlpha(0));
    this.tweens.add({
      targets: white,
      alpha: 1,
      duration: 70,
      onComplete: () => this.tweens.add({ targets: white, alpha: 0, duration: 750, ease: 'quad.out', onComplete: () => white.destroy() }),
    });
    this.cameras.main.shake(1500, 0.02);
    this.tweens.add({ targets: world, y: 3, duration: 70, yoyo: true, repeat: 3 });
    this.tweens.add({
      targets: [hillTreeA, hillTreeB],
      angle: { from: -5, to: 5 },
      duration: 90,
      yoyo: true,
      repeat: 7,
      onComplete: () => { hillTreeA.setAngle(0); hillTreeB.setAngle(0); },
    });
    // the crater takes over behind the ridge: glow + embedded rock + dust column
    const craterGlow = addTo(craterLayer, this.add.circle(196, 112, 16, 0xf8d868, 0.8));
    addTo(craterLayer, this.add.image(198, 120, 'meteor_rock').setOrigin(0.5, 1).setScale(0.55).setTint(0xf87848));
    this.tweens.add({ targets: craterGlow, scale: 1.5, fillAlpha: 0.25, duration: 820, yoyo: true, repeat: -1 });
    for (let i = 0; i < 5; i++) {
      const puff = addTo(craterLayer, this.add.circle(194 + Phaser.Math.Between(-8, 8), 112, 7 + i * 2, 0x8a7a6a, 0.5));
      this.tweens.add({ targets: puff, y: 52 - i * 8, scale: 2.4, fillAlpha: 0, duration: 2600 + i * 500, ease: 'sine.out', delay: 120 * i, onComplete: () => puff.destroy() });
    }
    // ground-hugging shockwaves race outward along the strip
    for (const [delay, dur, sc] of [[0, 900, 10], [180, 1100, 15]] as const) {
      this.time.delayedCall(delay, () => {
        const ring = addTo(world, this.add.ellipse(impact.x, 132, 30, 12, 0xf8e8a0, 0).setStrokeStyle(2, 0xf8e8a0, 0.7));
        this.tweens.add({ targets: ring, scaleX: sc, scaleY: sc * 0.5, alpha: 0, duration: dur, ease: 'quad.out', onComplete: () => ring.destroy() });
      });
    }
    // debris on real gravity arcs, over the ridge and back down
    for (let i = 0; i < 14; i++) {
      const frag = addTo(world, this.add.rectangle(194, 114, i % 3 === 0 ? 3 : 2, 2, [0xf8e8a0, 0xf87848, 0x6a5a4a][i % 3]));
      const vx = Phaser.Math.FloatBetween(-1, 1) * 90;
      const vy = -Phaser.Math.FloatBetween(40, 130);
      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 1300,
        onUpdate: (tw) => {
          const v = tw.getValue() ?? 1;
          const t = v * 1.3;
          frag.setPosition(194 + vx * t, 114 + vy * t + 100 * t * t);
          frag.setAlpha(1 - v);
        },
        onComplete: () => frag.destroy(),
      });
    }
    // aftershocks roll in while the caption lands
    this.time.delayedCall(1700, () => { AUDIO.sfx('rumble'); this.cameras.main.shake(700, 0.007); });
    this.time.delayedCall(3300, () => { AUDIO.sfx('rumble'); this.cameras.main.shake(500, 0.004); });
    await this.wait(1300);
    await say('It comes down behind Hickory Hill, and the whole town feels it land.');

    /* ---- PHASE 5: ten motes, wordless §A6 — nine leave, one stays ---- */
    AUDIO.sfx('ember');
    this.time.delayedCall(600, () => AUDIO.sfx('ember'));
    for (let i = 0; i < 10; i++) {
      const m = addTo(world, this.add.rectangle(197, 108, 2, 2, 0xf8f0d0).setAlpha(0));
      const riseX = 110 + i * 15;
      const riseY = 60 - (i % 3) * 7;
      this.tweens.add({
        targets: m,
        x: riseX,
        y: riseY,
        alpha: 1,
        duration: 750,
        delay: i * 70,
        ease: 'sine.out',
        onComplete: () => {
          if (i === 3) {
            // the crater keeps its Ember — the first Resonance Site is right there
            this.tweens.add({ targets: m, x: 197, y: 110, alpha: 0, duration: 900, delay: 250, ease: 'sine.in', onComplete: () => m.destroy() });
          } else {
            const ang = Phaser.Math.DegToRad(195 + i * 22);
            this.tweens.add({ targets: m, x: riseX + Math.cos(ang) * 460, y: riseY + Math.sin(ang) * 260, alpha: 0.1, duration: 850, delay: 150 + i * 40, ease: 'quad.in', onComplete: () => m.destroy() });
          }
        },
      });
    }
    await say('For one bright second, the sky fills with new stars. Then they shoot off in every direction — all but one.');

    /* ---- PHASE 6: the town wakes, hill-side first ---- */
    AUDIO.sfx('rumble');
    this.cameras.main.shake(450, 0.003);
    [...sleepers]
      .sort((a, b) => a.x - b.x)
      .forEach((wrect, idx) =>
        this.time.delayedCall(300 + idx * 340, () => {
          AUDIO.sfx('light_on');
          wrect.setAlpha(0.92);
          addTo(world, this.add.circle(wrect.x, wrect.y, 9, 0xf8e8a0, 0.1));
        }),
      );
    await say('One by one, porch lights flick on across Otterbrook. The dog was right to bark.');

    /* ---- PHASE 7: pan east to the one window that matters ---- */
    const pan = waitTween({ targets: world, x: -392, duration: 3800, ease: 'Sine.easeInOut' });
    await say('Six blocks east, a light is about to come on in one upstairs window too.');
    await pan;
    AUDIO.sfx('light_on');
    rexWindow.setAlpha(0.95);
    rexGlow.setFillStyle(0xf8e8a0, 0.16);
    this.tweens.add({ targets: rexGlow, scale: 1.6, fillAlpha: 0.3, duration: 900, yoyo: true, repeat: -1 });
    // push in: hold the house at center while the night leans closer
    this.tweens.add({ targets: world, scale: 1.18, x: 200 - 610 * 1.18, y: 132 - 151 * 1.18, duration: 2600, ease: 'sine.inout' });
    await say("In {rex}'s room, a baseball bat leans by the desk, pretending this is a normal night.");

    /* ---- PHASE 8: fade — the bedroom takes it from here ---- */
    AUDIO.sfx('rumble');
    const fade = this.add.rectangle(0, 0, W, H, 0x0a0a18).setOrigin(0).setAlpha(0);
    cinema.add(fade);
    await waitTween({ targets: fade, alpha: 1, duration: 1000, ease: 'sine.in' });
    cinema.destroy();
  }

  private async chadJoinScene(): Promise<void> {
    this.cut = true;
    const chad = this.add.sprite(this.player.x + s(60), this.player.y, 'chad', standFrame('left'));
    chad.setOrigin(0.5, 1).setDepth(chad.y);
    await this.tweenTo(chad, this.player.x + s(18), this.player.y, 900, 'chad');
    await this.dlg.say(...DIALOGUE.chad_join);
    chad.destroy();
    GS.data.guest = 'chad';
    GS.setFlag('chad_joined');
    this.addFollower('chad');
    this.cut = false;
  }

  private async bricktonArrivalScene(): Promise<void> {
    this.cut = true;
    GS.setFlag('brickton_arrival_done');
    await this.wait(260);
    // S15c: the city earns a REAL establishing pan — three slow legs paced
    // under the narration (was one 950ms dash that finished before page one
    // typed out). The dialogue stays the clock: pages hold each leg on
    // screen, holding A fast-forwards everything per ADR-024.
    this.cameras.main.pan(31 * TILE_PX, 6 * TILE_PX, 4200, 'Sine.easeInOut', true);
    await this.dlg.say(...DIALOGUE.brickton_arrival.slice(0, 2));
    this.cameras.main.pan(62 * TILE_PX, 14 * TILE_PX, 3200, 'Sine.easeInOut', true);
    await this.dlg.say(...DIALOGUE.brickton_arrival.slice(2, 4));
    this.cameras.main.pan(this.player.x, this.player.y, 1800, 'Sine.easeInOut', true);
    await this.dlg.say(DIALOGUE.brickton_arrival[4]);
    this.sparkleBurst(this.player.x, this.player.y - s(18), 8);
    AUDIO.sfx('ember');
    await this.dlg.say(DIALOGUE.brickton_arrival[5]);
    this.cameras.main.startFollow(this.player, true, 0.18, 0.18);
    this.cut = false;
  }

  /* ---------------- THE LONG WALK — roadside beats (S15i M3, ADR-056) ----------------
   * Two flag-gated cutscenes on the foot journey: a warm roadside vignette in the
   * woods, and the "you can see the city now" reveal on the overpass. The retry law
   * rides the engine (a defeat between here and the gate just respawns you; the
   * beat's done-flag makes it play once). The cut lock holds input throughout. */
  private async walkBeat(id: string): Promise<void> {
    this.cut = true;
    await this.wait(180);
    await this.dlg.say(...DIALOGUE[id]);
    GS.setFlag(`${id}_done`);
    this.cut = false;
  }

  private async cityRevealScene(): Promise<void> {
    this.cut = true;
    GS.setFlag('city_reveal_done');
    await this.wait(220);
    // a gentle look ahead toward the city (east), paced under the narration, then home
    const mapW = this.mapDef.grid[0].length * TILE_PX;
    this.cameras.main.pan(Math.min(this.player.x + s(168), mapW - s(16)), this.player.y - s(16), 2600, 'Sine.easeInOut', true);
    await this.dlg.say(...DIALOGUE.city_reveal.slice(0, 2));
    AUDIO.sfx('ember');
    await this.dlg.say(...DIALOGUE.city_reveal.slice(2));
    this.cameras.main.pan(this.player.x, this.player.y, 1000, 'Sine.easeInOut', true);
    this.cameras.main.startFollow(this.player, true, 0.18, 0.18);
    this.cut = false;
  }

  /**
   * THE GOLDEN MINUTE (was THE BRICKTON MINUTE, S15h) — relocated to VALLE
   * DORADO's clock plaza (stage 4, the big city; user directive 2026-07-08).
   * The clock strikes seven wrong minutes, the gilded skyline checks its wrist,
   * the CLOCK LADY reads you the city, and the Star Locket takes one impossible
   * tick. The clock + the lady are FOUND ON THE LIVE MAP (never baked coords —
   * the old scene panned at hardcoded tiles and went stale on the first rebuild).
   */
  private async bricktonClockGoalScene(): Promise<void> {
    this.cut = true;
    GS.setFlag('brickton_clock_goal');
    const clockProp = this.mapDef.props.find((p) => p.sprite === 'town_clock');
    const lady = this.mapDef.npcs.find((n) => n.id === 'clock_lady');
    // degrade gracefully but LOUDLY — the beat depends on map content that lives
    // in an editor document now (a rename there would otherwise fail silently)
    if (!clockProp || !lady) console.warn(`GOLDEN MINUTE: missing ${!clockProp ? 'town_clock prop' : ''} ${!lady ? 'clock_lady npc' : ''} on ${this.mapDef.id}`);
    const cx = (clockProp ? clockProp.x + 0.7 : this.player.x / TILE_PX) * TILE_PX;
    const cy = (clockProp ? clockProp.y + 0.4 : this.player.y / TILE_PX) * TILE_PX;
    // the clock, high over the plaza
    this.cameras.main.pan(cx, cy, 900, 'Sine.easeInOut', true);
    await this.wait(400);
    AUDIO.sfx('thud'); // it strikes
    this.sparkleBurst(cx + TILE_PX / 2, cy + s(6), 10);
    await this.dlg.say(...DIALOGUE.brickton_goal_clock.slice(0, 2)); // the strike + the skyline turning
    // the clock lady, leaning on the plaza rail, explains
    if (lady) this.cameras.main.pan(lady.x * TILE_PX, lady.y * TILE_PX, 650, 'Sine.easeInOut', true);
    AUDIO.sfx('cursor');
    await this.dlg.say(...DIALOGUE.brickton_goal_clock.slice(2, 5)); // "@That is Valle Dorado time…"
    // back to the hero — the Locket takes the tick
    this.cameras.main.pan(this.player.x, this.player.y, 650, 'Sine.easeInOut', true);
    await this.wait(200);
    this.sparkleBurst(this.player.x, this.player.y - s(18), 12);
    AUDIO.sfx('ember');
    await this.dlg.say(...DIALOGUE.brickton_goal_clock.slice(5)); // the locket keeps it warm + the button
    AUDIO.jingle('victory', 1600, this.mapDef.music);
    toast(this, 'GOAL: GOLDEN MINUTE');
    this.cameras.main.startFollow(this.player, true, 0.18, 0.18);
    this.cut = false;
  }

  /**
   * THE WARM DIAL TONE (S15h) — a real beat on the same gate flag. The payphone
   * rings with no caller; the QUARTER MAN (already on the corner) names the note;
   * the Locket folds the dial tone into the first Heartlight, and for one beat the
   * gray city smells like home (§A4.4). Then the bus exhales it away.
   */
  private async bricktonDialGoalScene(): Promise<void> {
    this.cut = true;
    GS.setFlag('brickton_dial_goal');
    // the payphone on the bus-stop corner — FOUND on the live map (never baked
    // coords; the Twoton rebuild moved it and the old (14,26) pan went stale)
    const phone = this.mapDef.phones[0];
    const px = (phone ? phone.x : this.player.x / TILE_PX) * TILE_PX;
    const py = (phone ? phone.y : this.player.y / TILE_PX) * TILE_PX;
    this.cameras.main.pan(px, py, 800, 'Sine.easeInOut', true);
    AUDIO.sfx('phone');
    await this.wait(420);
    await this.dlg.say(...DIALOGUE.brickton_goal_dial.slice(0, 4)); // the ring + the quarter man names the note
    // the hero lifts the Locket to the receiver
    this.sparkleBurst(px + TILE_PX / 2, py, 10);
    AUDIO.sfx('ember');
    await this.dlg.say(...DIALOGUE.brickton_goal_dial.slice(4)); // it folds in + the smell of home + the gain
    AUDIO.jingle('victory', 1600, this.mapDef.music);
    toast(this, 'GOAL: WARM DIAL TONE');
    this.cameras.main.startFollow(this.player, true, 0.18, 0.18);
    this.cut = false;
  }

  /**
   * S12b (ADR-035): an ability arrives as a STORY MOMENT — flash, the §A11
   * pages, the flag, the jingle, the toast. Battle/menu availability reads
   * the flag forever after (data/awakenings.ts). Played straight, §A11.2.
   */
  private async awakeningBeat(id: string): Promise<void> {
    const a = AWAKENINGS[id];
    if (!a || GS.flag(a.flag) === true) return;
    this.cameras.main.flash(420, 248, 232, 160);
    AUDIO.sfx('pray');
    this.sparkleBurst(this.player.x, this.player.y - s(14), 16);
    await this.dlg.say(...DIALOGUE[a.dialogue]);
    GS.setFlag(a.flag);
    AUDIO.jingle('levelup', 1400, this.mapDef.music);
    toast(this, vars(a.toast));
  }

  /* ---------------- S21 (ADR-126/127/128): the Held Breath, the Axes, the ending ----------------
   * The rewind unlock + the three weighty choices + the composed finale. Content rides
   * DIALOGUE (branch_text.ts); authored-panel art is deferred (cutscenes silently skip
   * missing panels). Pure logic + tests in src/engine/{choice,echo,ending,party}.ts. */

  /** Ch.6 (Laughing Ruins): the Star Locket reveals it records the BREATH around the song —
   *  Jay can hold a moment back. Staged uneasy (§A11.2); arms the rewind (data/echoes.ts). */
  private async heldBreathBeat(): Promise<void> {
    if (GS.flag('held_breath_unlocked') === true) return;
    this.cut = true;
    // the authored panel + its captions (assets/art/cutscenes/ch6/held_breath_awaken_4x.png);
    // playCutscene skips cleanly if the panel is ever missing.
    await playCutscene(this, 'ch6_held_breath');
    GS.setFlag('held_breath_unlocked', true);
    AUDIO.jingle('levelup', 1400, this.mapDef.music);
    toast(this, `${GS.hero('rex')?.name ?? 'Jay'} learned to hold the world's breath…`);
    this.cut = false;
  }

  /** present one of the three Axes: snapshot (if rewindable), frame the dilemma with each
   *  option's weight, take the pick, record it, land the outro, apply the immediate ripple.
   *  Once-only + retry-safe (the decidedFlag gates re-entry). */
  private async runChoice(id: ChoiceId): Promise<void> {
    const def = CHOICES[id];
    if (GS.flag(def.decidedFlag) === true) return;
    this.cut = true;
    try {
      if (isRewindable(id)) captureEcho(id); // the Locket records the breath BEFORE the choice
      await playCutscene(this, `${def.band}_choice`); // authored establishing panel (no-ops if unauthored)
      await this.dlg.say(...DIALOGUE[def.intro]);
      for (const o of def.options) await this.dlg.say(`${o.label}  —  ${o.blurb}`);
      const sel = await this.dlg.ask(def.options.map((o) => o.label));
      const chosen = def.options[sel] ?? def.options[0];
      recordChoice(id, chosen.id);
      AUDIO.sfx('confirm');
      await this.dlg.say(...DIALOGUE[chosen.outro]);
      this.applyChoiceRipple(id, chosen.id);
    } finally {
      this.cut = false;
    }
  }

  /** the immediate, deterministic loadout fallout of a choice (the staged party-fate
   *  DEPARTURE scenes are their own chapter beats; this sets the power flags). */
  private applyChoiceRipple(id: ChoiceId, optionId: string): void {
    // COMPASSION/IRON: emptying Vlad disturbs Dorin — he withholds Vibe Comet Ω for the finale
    if (id === 'ch9_count' && optionId === 'iron' && isPresent('dorin')) withholdUltimate('dorin');
    if (id === 'ch9_count' && optionId === 'mercy') withholdUltimate('dorin', false);
  }

  /** Ch.10 finale: after the canon Homesong / walk-home, assemble + play the epilogue
   *  cards the player's choices, callers, and rewind-use selected (src/engine/ending.ts). */
  private async playEnding(): Promise<void> {
    this.cut = true;
    try {
      for (const card of composeEnding(endingContext())) {
        await playCutscene(this, card.dialogue); // the epi_<id> card panel (no-ops until art lands)
        await this.dlg.say(...DIALOGUE[card.dialogue]);
      }
    } finally {
      this.cut = false;
    }
  }

  private async craterScene(): Promise<void> {
    this.cut = true;
    if (!GS.flag('met_glint')) {
      GS.setFlag('met_glint');
      await this.dlg.say(...DIALOGUE.crater_approach);
      const glint = this.add.sprite(76 * TILE_PX, 12 * TILE_PX, 'glint');
      glint.play('glint-flit').setDepth(9999);
      const glow = this.add.circle(glint.x, glint.y, s(10), colorOf(px(RAMP.GOLD, 3)), 0.25).setDepth(9998);
      this.tweens.add({ targets: [glint, glow], y: `-=${s(6)}`, duration: 900, yoyo: true, repeat: -1 });
      AUDIO.sfx('ember');
      await this.dlg.say(...DIALOGUE.glint_prophecy);
      GS.data.keyItems.push('star_locket');
      // ADR-121: the crater holds a MACHINE, not a bug — the Hush Sentinel unfolds.
      // (Surge α no longer awakens HERE; it awakens mid-fight, scripted in bosses.ts.)
      // Anchored a fixed offset ABOVE the player (not absolute map tiles) so it's
      // always framed by the camera — it looms over the kid as it rises.
      const sentinel = this.add
        .image(this.player.x, this.player.y - s(24), 'authored_world_hush_sentinel')
        .setOrigin(0.5, 1)
        .setDepth(9997)
        .setAlpha(0)
        .setScale(0.6);
      this.tweens.add({ targets: sentinel, alpha: 1, scale: 1, duration: 1100, ease: 'back.out' });
      // The Sentinel erupts from the crater RIGHT where Glint was hovering, so the
      // flit (and its glow) darts clear of the construct's silhouette instead of
      // sitting buried in its base through the whole warning. Park it just left of
      // the Sentinel's left edge (sentinel.width is the final scale-1 width); the
      // supernova then blazes up from this same spot.
      const sentinelLeft = this.player.x - sentinel.width / 2;
      const glintRestX = sentinelLeft - glint.displayWidth / 2 - s(12);
      const glintRestY = 12 * TILE_PX;
      this.tweens.add({ targets: [glint, glow], x: glintRestX, duration: 650, ease: 'sine.inOut' });
      await this.dlg.say(...DIALOGUE.sentinel_warning);
      // ADR-121: Glint goes SUPERNOVA at the rally — the little flit blazes up into
      // his radiant full-power form (one forward-facing pose; a glow needs no angles)
      // with a breathing pulse, and carries the fight from here (glintSupernova).
      glint.destroy();
      glow.destroy();
      const radiant = this.add
        .image(glintRestX, glintRestY, 'authored_world_glint_radiant')
        .setDepth(9999)
        .setScale(0.32)
        .setAlpha(0);
      this.tweens.add({ targets: radiant, alpha: 1, scale: 0.62, duration: 480, ease: 'sine.out' });
      this.tweens.add({ targets: radiant, scale: 0.68, duration: 420, yoyo: true, repeat: -1, ease: 'sine.inout', delay: 480 });
      AUDIO.sfx('ember');
      this.cameras.main.shake(900, 0.02);
      AUDIO.sfx('thud');
      await this.wait(750);
      radiant.destroy();
      sentinel.destroy();
    } else {
      await this.dlg.say(...DIALOGUE.sentinel_again);
    }
    // The Sentinel is "cannot win alone": Glint goes SUPERNOVA and carries it, and
    // the boss script REPELS it (endBattleMercy) on the scripted turn — which the
    // scene reads as 'victory'. No kill, no Ember (the Tick lives and relocates).
    const outcome = await this.startBattle(['hush_sentinel'], 'none', [], { boss: true, glint: true, glintSupernova: true });
    if (outcome !== 'victory') return;
    // betrayal #1 resolved mid-battle (guest flag already cleared there);
    // the trail sprite still needs to go
    GS.data.guest = null;
    this.removeFollower('chad');
    GS.setFlag('sentinel_repelled');
    // it leaves a husk in the crater that the town learns to walk around (and that
    // wakes again, far later — the Ch.10 callback hangs off sentinel_husk_left)
    GS.setFlag('sentinel_husk_left');
    this.cut = true;
    await this.dlg.say(...DIALOGUE.sentinel_after);
    // ADR-121: the dimmed Glint doesn't just point the way home — he TAGS ALONG.
    // His authored star-icon flits in at the back of the conga now and follows
    // across the whole walk down (buildFollowers re-adds him on each leg while
    // sentinel_repelled && !zapper_done) until the porch zapper claims him.
    this.addFollower('glint', false, true);
    AUDIO.playMusic(this.mapDef.music);
    this.cut = false;
  }

  // ADR-121 — BOSS 1, relocated. With Glint dead and the town awake, the Titanic
  // Tick is found burrowed in the Heart Oak in Pond Park, draining Otterbrook's
  // Vibe (the Hush-dark). Jay fights it SOLO with the already-awakened Surge α + the
  // Salt Shaker. Beating it earns Ember 1, floods the Vibe back, and breaks the
  // Hush-dark into real dawn — which opens Brickton (the bus runs).
  private async heartOakScene(): Promise<void> {
    this.cut = true;
    await this.dlg.say(...DIALOGUE.heart_oak_approach);
    this.cameras.main.shake(700, 0.015);
    AUDIO.sfx('thud');
    await this.wait(600);
    const outcome = await this.startBattle(['titanic_tick'], 'none', [], { boss: true });
    if (outcome !== 'victory') return;
    GS.setFlag('tick_defeated');
    GS.setFlag('ember1');
    GS.data.embers = 1;
    this.cut = true;
    const ember = this.add.image(this.player.x, this.player.y - s(20), 'ember').setDepth(9999).setScale(1);
    AUDIO.sfx('ember');
    this.sparkleBurst(ember.x, ember.y, 12);
    this.tweens.add({ targets: ember, y: this.player.y - s(34), duration: 1300, ease: 'sine.inout' });
    AUDIO.playMusic('heartlight');
    await this.wait(1400);
    this.sparkleBurst(this.player.x, this.player.y - s(34), 14);
    ember.destroy();
    this.cameras.main.flash(400, 248, 232, 160);
    await this.dlg.say(...DIALOGUE.ember_get);
    await this.dlg.say(...DIALOGUE.tick_after);
    this.cut = false;
    // real dawn: the Vibe floods back, the Hush-dark lifts, shops/NPCs/the 6:15 wake,
    // and the road out clears. Rebuild the town from data at the new flag state.
    this.fadeRestart();
  }

  private async porchScene(): Promise<void> {
    this.cut = true;
    // 2026-07-02 story re-gate (user direction): the zapper claiming Glint does
    // NOT snap dawn on. It sets `zapper_hit`; Mom sends you to BED, and sleep
    // (talkTo mom → sleepToMorning) is what sets `zapper_done` — so you wake
    // into the wrong-colored HAZE morning instead of teleporting into it.
    GS.setFlag('zapper_hit');
    // ADR-121: the dimmed Glint who flitted home with us IS the one the zapper
    // takes — lift his trailing sprite OUT of the follower line so the death beat
    // is continuous with the follow, not a fresh pop-in. (zapper_hit was just set,
    // so the next buildFollowers won't re-add him.) Fall back to a spawn if he
    // somehow isn't trailing — e.g. the porch reached out of band.
    const trailing = this.followers.find((f) => f.id === 'glint');
    let glint: Phaser.GameObjects.Sprite;
    if (trailing) {
      this.followers = this.followers.filter((f) => f.id !== 'glint');
      glint = trailing.spr;
    } else {
      glint = this.add.sprite(this.player.x + s(40), this.player.y - s(40), 'glint');
    }
    glint.setDepth(9999);
    if (glint.anims.currentAnim?.key !== 'glint-flit' || !glint.anims.isPlaying) glint.play('glint-flit');
    await this.tweenTo(glint, this.player.x + s(12), this.player.y - s(18), 800);
    await this.dlg.say(DIALOGUE.porch_zapper[0], DIALOGUE.porch_zapper[1]);
    // the zapper claims another hero — anchor on the REAL bug_zapper prop (Jay's
    // porch, the elevated terrace) instead of the pre-rebuild literal, so Glint
    // flies into the lamp and not across the map
    const zapProp = this.mapDef.props.find((p) => p.sprite === 'bug_zapper');
    const zapX = ((zapProp?.x ?? 53) + 0.5) * TILE_PX;
    const zapY = ((zapProp?.y ?? 51) + 0.3) * TILE_PX;
    this.tweens.add({ targets: glint, x: zapX, y: zapY, duration: 700, ease: 'sine.in' });
    await this.wait(700);
    AUDIO.sfx('zapper');
    this.cameras.main.flash(280, 160, 236, 236);
    glint.destroy();
    await this.dlg.say(DIALOGUE.porch_zapper[2], DIALOGUE.porch_zapper[3], DIALOGUE.porch_zapper[4]);
    const spark = this.add.image(zapX, zapY + s(10), 'pixel').setTint(colorOf(px(RAMP.GOLD, 3))).setScale(3).setDepth(9999);
    this.tweens.add({ targets: spark, x: this.player.x, y: this.player.y - s(12), duration: 900, ease: 'sine.inout' });
    await this.wait(950);
    this.sparkleBurst(this.player.x, this.player.y - s(12), 10);
    spark.destroy();
    GS.addItem('glints_spark');
    AUDIO.sfx('ember');
    await this.dlg.say(DIALOGUE.porch_zapper[5], DIALOGUE.porch_zapper[6]);
    // THE LAST SPARK (ADR-035): what settles into Jay stays — healing born
    // of grief, played absolutely straight (§A11.2)
    await this.awakeningBeat('last_spark');
    // it stays NIGHT. The porch light hums; the town sleeps on. Mom first,
    // then bed — sleepToMorning() (via talkTo) is the only road to dawn.
    await this.dlg.say(...DIALOGUE.porch_after_zapper);
    this.cut = false;
  }

  /** the bridge to the wrong-colored morning: Mom sends you up, the screen
   *  goes soft, and you wake in your room with `zapper_done` set — the town
   *  outside now wears the Hush-dark HAZE (dawn_hush_dark fires on arrival). */
  private async sleepToMorning(): Promise<void> {
    this.cut = true;
    this.cameras.main.fadeOut(700, 0, 0, 0);
    await this.wait(750);
    GS.setFlag('zapper_done');
    AUDIO.sfx('heal');
    // wake in the kid's own bed, morning light already re-derived from flags
    this.scene.start('overworld', { mapId: 'rex_bedroom', x: 3 * TILE_PX + 8, y: 5 * TILE_PX });
  }

  /* ---------------- S2: Mia, the Manager, and Mom's call (§A6 Ch.1 end) ---------------- */

  /** §A6: meeting Mia in the holding room — she joins at L6 with her canon kit */
  private async fayeJoinScene(): Promise<void> {
    this.cut = true;
    await this.dlg.say(...DIALOGUE.faye_meet);
    AUDIO.sfx('ember');
    AUDIO.playMusic('heartlight');
    await this.dlg.say(...DIALOGUE.faye_locket);
    // THE FIRST LISTEN (ADR-035): she touches the Locket and hears
    // Heartlight #1 — "hears the Embers sing" (§A3), made literal
    await this.awakeningBeat('first_listen');
    await this.dlg.say(...DIALOGUE.faye_join);
    // ADR-013: the Prompt-21 name flows into her battle strip and dialogue
    GS.data.party.push(makeHeroState('faye', 6, GS.data.heroNames.faye));
    GS.setFlag('faye_joined');
    // S3: the pan she took back off the intake shelf is real gear now — hers,
    // equipped (the migration registry grants it to older faye_joined saves)
    GS.addItem('hand_me_down_pan', 'faye');
    GS.equipItem('faye', 'hand_me_down_pan');
    AUDIO.sfx('confirm');
    await this.dlg.say(...DIALOGUE.faye_pan_get);
    AUDIO.jingle('levelup', 1400, null);
    // rebuild from data: her NPC gates out, the conga picks her up
    this.fadeRestart();
  }

  /** the Manager blocks the floor-3 exit: a scripted 2-Smiler fight */
  private async managerScene(): Promise<void> {
    this.cut = true;
    const office = this.mapDef.props.find((p) => p.sprite === 'office_door');
    const doorX = (office?.x ?? 10.5) * TILE_PX + TILE_PX / 2;
    const doorY = (office?.y ?? 0.375) * TILE_PX + s(26);
    AUDIO.sfx('cursor');
    await this.dlg.say(DIALOGUE.manager_intro[0]);
    const mgr = this.add.sprite(doorX, doorY + s(8), 'manager', standFrame('down'));
    mgr.setOrigin(0.5, 1).setDepth(mgr.y);
    await this.tweenTo(mgr, this.player.x - s(24), this.player.y, 2000, 'manager');
    mgr.setDepth(mgr.y);
    await this.dlg.say(...DIALOGUE.manager_intro.slice(1));
    await this.dlg.say(...DIALOGUE.manager_faye_q);
    const outcome = await this.startBattle(['blazer_smiler', 'blazer_smiler'], 'none', [], {
      boss: true,
      prayTutorial: true,
    });
    if (outcome !== 'victory') {
      mgr.destroy(); // defeat path is already restarting the scene
      return;
    }
    this.cut = true;
    GS.setFlag('manager_defeated');
    await this.tweenTo(mgr, doorX, doorY + s(8), 1600, 'manager');
    mgr.destroy();
    await this.dlg.say(...DIALOGUE.manager_win);
    this.cut = false;
  }

  /** Mom is calling the payphone once the Department falls (until answered) */
  private momCallPending(): boolean {
    return !!GS.flag('manager_defeated') && !GS.flag('ch1_complete');
  }

  /** first phone tutorialized by Mom calling YOU — and Chapter 1's button */
  private async momPayphoneScene(): Promise<void> {
    this.cut = true;
    AUDIO.sfx('phone');
    await this.dlg.say(...DIALOGUE.mom_payphone);
    // §A4.4: Mom's voice is the cure, whichever direction the call went
    if (GS.flag('rex_homesick')) {
      GS.setFlag('rex_homesick', false);
      AUDIO.sfx('heal');
      await this.dlg.say(...DIALOGUE.mom_cure_beat);
    }
    GS.setFlag('ch1_complete');
    AUDIO.jingle('victory', 2200, null);
    await this.dlg.say(...DIALOGUE.faye_after_call);
    await this.dlg.say(...DIALOGUE.ch1_card);
    this.cut = false;
  }

  /* ---------------- the 6:15 (bus transition, §A5 Ch.1) ---------------- */

  private async busAsk(dest: 'brickton' | 'otterbrook'): Promise<void> {
    this.cut = true;
    await this.dlg.say(...(dest === 'brickton' ? DIALOGUE.bus_ask_brickton : DIALOGUE.bus_ask_home));
    const label = dest === 'brickton' ? 'Board the 6:15 to Twoton' : 'Ride back to Otterbrook';
    const pick = await this.dlg.ask([label, 'Stay'], { cancelIndex: 1 });
    if (pick !== 0) {
      this.cut = false;
      return;
    }
    AUDIO.stopMusic();
    // first ride to the city is the full interior scene; after that, quick hops
    if (dest === 'brickton' && !GS.flag('bus_ride_done')) {
      this.registry.set('busDest', dest);
      // S15c: he rides AT a seat, facing the window the reel scrolls past —
      // feet on the cushion row so the y-sort seats him in front of the back
      this.goThroughDoor('bus_interior', 296, 100, 'up');
      return;
    }
    if (dest === 'brickton') this.goThroughDoor('brickton', BRICKTON_BUS_SPAWN.x, BRICKTON_BUS_SPAWN.y, 'up');
    // home = the kerb outside OTTERBROOK TRANSIT (Civic St, cx29 — the S9 street grid),
    // not the old concept plaza; the depot's own doorstep row so you step off at the door
    else this.goThroughDoor('otterbrook', 29 * 16 + 8, 94 * 16 + 8, 'down');
  }

  /* ---------------- THE ORIENTATION GATE (S15h, ADR-049) ---------------- */

  /**
   * MEADOW MILE's city line. The grandfather clause: the visitor badge OR a bus
   * ride (`bus_ride_done`) walks you straight in, so BOTH ways into Brickton
   * lead in. Otherwise three Blazer-Smiler "orientation exercises" (fights) earn
   * the badge — each win sticks (orient_1..3), so a defeat (the engine respawns
   * you at the last save) or a flee just sends you back to try again. Never a
   * dead end — the retry law from birth.
   */
  private async orientationGateScene(): Promise<void> {
    if (GS.flag('visitor_badge') || GS.flag('bus_ride_done')) {
      AUDIO.stopMusic();
      GS.setFlag('brickton_foot_first'); // S22 (ADR-113): the foot arrival opens the bus
      this.goThroughDoor('brickton', BRICKTON_FOOT_SPAWN.x, BRICKTON_FOOT_SPAWN.y, 'up');
      return;
    }
    this.cut = true;
    AUDIO.sfx('cursor');
    await this.dlg.say(...DIALOGUE.orient_intro);
    const rounds = [DIALOGUE.orient_round_1, DIALOGUE.orient_round_2, DIALOGUE.orient_round_3];
    const done = ['orient_1', 'orient_2', 'orient_3'].filter((f) => GS.flag(f)).length;
    for (let i = done; i < 3; i++) {
      await this.dlg.say(...rounds[i]);
      const outcome = await this.startBattle(['blazer_smiler'], 'none', [], {});
      if (outcome !== 'victory') {
        this.cut = false; // defeat respawns at the last save; a flee drops you back on the road
        return;
      }
      GS.setFlag(`orient_${i + 1}`);
    }
    GS.setFlag('visitor_badge');
    AUDIO.jingle('victory', 1800, null);
    await this.dlg.say(...DIALOGUE.orient_badge);
    await this.dlg.say(...DIALOGUE.orient_arrival);
    GS.setFlag('brickton_arrival_done'); // the foot arrival is its own beat — no later bus replay
    GS.setFlag('brickton_foot_first'); // S22 (ADR-113): reaching Brickton on foot reopens the highway + the bus
    AUDIO.stopMusic();
    this.goThroughDoor('brickton', BRICKTON_FOOT_SPAWN.x, BRICKTON_FOOT_SPAWN.y, 'up');
  }

  private async busCutscene(): Promise<void> {
    this.cut = true;
    const mapW = this.mapDef.grid[0].length * TILE_PX;
    // the window scrolls by: town first, then the approach, then the city
    const reel: Array<{ key: string; scale: number }> = [
      { key: 'tree', scale: 1 },
      { key: 'tree', scale: 0.8 },
      { key: 'house_a', scale: 0.6 },
      { key: 'tree', scale: 1 },
      { key: 'house_b', scale: 0.6 },
      { key: 'tree', scale: 0.9 },
      { key: 'skyline', scale: 1 },
      { key: 'skyline', scale: 1 },
    ];
    // scenery only exists inside the window band — the void outside the bus
    // (interiors float, ADR-004) must not show passing trees
    const maskShape = this.make.graphics({ x: 0, y: 0 }, false);
    maskShape.fillRect(0, s(8), mapW, s(38)); // window band (native px → s())
    const paneMask = maskShape.createGeometryMask();
    let frame = 0;
    const spawner = this.time.addEvent({
      delay: 520,
      loop: true,
      callback: () => {
        const item = reel[Math.min(frame, reel.length - 1)];
        frame++;
        const img = this.add
          .image(mapW + s(40), s(45), item.key)
          .setOrigin(0.5, 1)
          .setScale(item.scale)
          .setDepth(1) // behind the bus_windows overlay, over the sky
          .setMask(paneMask);
        this.tweens.add({
          targets: img,
          x: -s(60),
          duration: 2400,
          ease: 'linear',
          onComplete: () => img.destroy(),
        });
      },
    });
    await this.wait(500);
    await this.dlg.say(...DIALOGUE.npc_busdriver);
    await this.wait(700);
    await this.dlg.say(...DIALOGUE.bus_fern);
    await this.wait(700);
    await this.dlg.say(...DIALOGUE.bus_narration);
    await this.wait(900);
    spawner.remove();
    GS.setFlag('bus_ride_done');
    AUDIO.stopMusic();
    this.goThroughDoor('brickton', BRICKTON_BUS_SPAWN.x, BRICKTON_BUS_SPAWN.y, 'up');
  }

  /* ---------------- helpers ---------------- */

  private wait(ms: number): Promise<void> {
    return new Promise((r) => this.time.delayedCall(ms, r));
  }

  private tweenTo(
    target: Phaser.GameObjects.Sprite,
    x: number,
    y: number,
    ms: number,
    walkAnimId?: string,
  ): Promise<void> {
    return new Promise((r) => {
      if (walkAnimId) {
        const f: Facing = x < target.x ? 'left' : 'right';
        target.anims.play(`${walkAnimId}-walk-${f}`, true);
      }
      this.tweens.add({
        targets: target,
        x,
        y,
        duration: ms,
        onComplete: () => {
          if (walkAnimId) {
            target.anims.stop();
            target.setFrame(standFrame('down'));
          }
          r();
        },
      });
    });
  }
}
