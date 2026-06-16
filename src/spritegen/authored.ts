import Phaser from 'phaser';
import { TILE, TILESET } from './tiles';
import { GENERATED_BUILDINGS } from './buildings';
import { SPORT_FRAME_COUNT } from './athletes';
import { GOLF_FRAME_COUNT } from './golfers';
import { ART_SCALE } from './scale';

// Runtime frame sizes = native authoring size × ART_SCALE. The frozen generators
// draw at native; authored PNGs are sliced into these (larger) runtime frames, so
// authored art is supplied at the runtime resolution while ×1 stays identical.
const FRAME_W = 24 * ART_SCALE;
const FRAME_H = 32 * ART_SCALE;
const BUST_W = 32 * ART_SCALE;
const BUST_H = 32 * ART_SCALE;
// Battler cells are authored at 2× the legacy native (was 28×36) so the
// rear-3/4 stage figures render crisp on the 1600×900 framebuffer instead of
// being downsampled into a tiny cell. STAGE_ACTOR_SCALE in battle/stage.ts is
// halved to match, so on-screen size is unchanged — only the resolution rises.
const BATTLER_W = 56 * ART_SCALE;
const BATTLER_H = 72 * ART_SCALE;
const SPORT_FRAME_W = 32 * ART_SCALE;
const SPORT_FRAME_H = 40 * ART_SCALE;
/** runtime tile size (native TILE × ART_SCALE) for authored-tile slicing */
const RT_TILE = TILE * ART_SCALE;

const TOTAL_CHARACTER_FRAMES = 46;
const TOTAL_BUST_FRAMES = 18;
const TOTAL_BATTLER_FRAMES = 14;

type SourceImage = HTMLImageElement | HTMLCanvasElement;

const appliedSheets = new Set<string>();
const CARDINALS = ['down', 'left', 'right', 'up'] as const;
const DIAGONALS = ['downright', 'downleft', 'upright', 'upleft'] as const;

const HERO_ART = [
  {
    id: 'rex',
    characterKey: 'authored_rex_8dir',
    bustKey: 'authored_rex_bust18',
    battlerKey: 'authored_rex_battler14',
    characterUrl: new URL('../../assets/art/characters/jay_anim_46_4x.png', import.meta.url).href,
    bustUrl: new URL('../../assets/art/busts/jay_bust_18_32x32.png', import.meta.url).href,
    battlerUrl: new URL('../../assets/art/battlers/jay_battler_14_28x36.png', import.meta.url).href,
  },
  {
    id: 'faye',
    characterKey: 'authored_faye_8dir',
    bustKey: 'authored_faye_bust18',
    battlerKey: 'authored_faye_battler14',
    characterUrl: new URL('../../assets/art/characters/mia_anim_46_4x.png', import.meta.url).href,
    bustUrl: new URL('../../assets/art/busts/mia_bust_18_32x32.png', import.meta.url).href,
    battlerUrl: new URL('../../assets/art/battlers/mia_battler_14_28x36.png', import.meta.url).href,
  },
  {
    id: 'milo',
    characterKey: 'authored_milo_8dir',
    bustKey: 'authored_milo_bust18',
    battlerKey: 'authored_milo_battler14',
    characterUrl: new URL('../../assets/art/characters/milo_anim_46_4x.png', import.meta.url).href,
    bustUrl: new URL('../../assets/art/busts/milo_bust_18_32x32.png', import.meta.url).href,
    battlerUrl: new URL('../../assets/art/battlers/milo_battler_14_28x36.png', import.meta.url).href,
  },
  {
    id: 'pippa',
    characterKey: 'authored_pippa_8dir',
    bustKey: 'authored_pippa_bust18',
    battlerKey: 'authored_pippa_battler14',
    characterUrl: new URL('../../assets/art/characters/pippa_anim_46_4x.png', import.meta.url).href,
    bustUrl: new URL('../../assets/art/busts/pippa_bust_18_32x32.png', import.meta.url).href,
    battlerUrl: new URL('../../assets/art/battlers/pippa_battler_14_28x36.png', import.meta.url).href,
  },
  {
    id: 'dorin',
    characterKey: 'authored_dorin_8dir',
    bustKey: 'authored_dorin_bust18',
    battlerKey: 'authored_dorin_battler14',
    characterUrl: new URL('../../assets/art/characters/dorin_anim_46_4x.png', import.meta.url).href,
    bustUrl: new URL('../../assets/art/busts/dorin_bust_18_32x32.png', import.meta.url).href,
    battlerUrl: new URL('../../assets/art/battlers/dorin_battler_14_28x36.png', import.meta.url).href,
  },
] as const;

type HeroArt = (typeof HERO_ART)[number];

/**
 * Single 32×32 hero portrait busts (the `*_bust_32.png` masters). Distinct from
 * the 18-frame battle-card bust sheets — these are one still face used as menu /
 * name-entry portrait art. Keyed `portrait_<heroId>`; loaded globally at boot so
 * any scene can `add.image(x, y, heroPortraitKey(id))`.
 */
const HERO_PORTRAIT_ART = [
  { id: 'rex', url: new URL('../../assets/art/busts/jay_bust_32.png', import.meta.url).href },
  { id: 'faye', url: new URL('../../assets/art/busts/mia_bust_32.png', import.meta.url).href },
  { id: 'milo', url: new URL('../../assets/art/busts/milo_bust_32.png', import.meta.url).href },
  { id: 'pippa', url: new URL('../../assets/art/busts/pippa_bust_32.png', import.meta.url).href },
  { id: 'dorin', url: new URL('../../assets/art/busts/dorin_bust_32.png', import.meta.url).href },
] as const;

const FRAMING_SCREEN_ART = [
  { key: 'boot_splash', url: new URL('../../assets/art/screens/boot_splash.png', import.meta.url).href },
  { key: 'title_art', url: new URL('../../assets/art/screens/title_bg.png', import.meta.url).href },
  { key: 'logo', url: new URL('../../assets/art/screens/title_logo.png', import.meta.url).href },
  { key: 'name_entry_bg', url: new URL('../../assets/art/screens/name_entry_bg.png', import.meta.url).href },
  { key: 'save_slots_bg', url: new URL('../../assets/art/screens/save_slots_bg.png', import.meta.url).href },
  { key: 'links_bg', url: new URL('../../assets/art/screens/links_bg.png', import.meta.url).href },
  { key: 'game_over', url: new URL('../../assets/art/screens/game_over.png', import.meta.url).href },
] as const;

const AUTHORED_MINIGAME_ATHLETES = [
  { id: 'rex', key: 'authored_athlete_rex', url: new URL('../../assets/art/minigames/hoops/athlete_rex_runtime.png', import.meta.url).href },
  { id: 'faye', key: 'authored_athlete_faye', url: new URL('../../assets/art/minigames/hoops/athlete_faye_runtime.png', import.meta.url).href },
  { id: 'opponent', key: 'authored_athlete_opponent', url: new URL('../../assets/art/minigames/hoops/athlete_opponent_runtime.png', import.meta.url).href },
] as const;

const AUTHORED_MINIGAME_GOLFERS = [
  { id: 'rex', key: 'authored_golfer_rex', url: new URL('../../assets/art/minigames/golf/golfer_rex_runtime.png', import.meta.url).href },
  { id: 'faye', key: 'authored_golfer_faye', url: new URL('../../assets/art/minigames/golf/golfer_faye_runtime.png', import.meta.url).href },
] as const;

/** texture key for a hero's single portrait bust (see HERO_PORTRAIT_ART) */
export function heroPortraitKey(heroId: string): string {
  return `portrait_${heroId}`;
}

export function authoredBattleBackdropKey(area: string | undefined): string | null {
  if (!area) return null;
  const normalized = area === 'sa' || area === 'south_america' || area === 'puerto_sol' || area === 'valle_dorado'
    ? 'jungle'
    : area === 'foggybottom' || area === 'wintermoor'
      ? 'england'
      : area;
  return BATTLE_BACKGROUND_ART.some((art) => art.area === normalized) ? `authored_battle_bg_${normalized}` : null;
}


export const NPC_CHARACTER_ART = [
  { id: 'chad', key: 'authored_chad_8dir', url: new URL('../../assets/art/characters/chad_8dir_96x128.png', import.meta.url).href },
  { id: 'mom', key: 'authored_mom_8dir', url: new URL('../../assets/art/characters/mom_8dir_96x128.png', import.meta.url).href },
  { id: 'mrsPemmel', key: 'authored_mrsPemmel_8dir', url: new URL('../../assets/art/characters/mrsPemmel_8dir_96x128.png', import.meta.url).href },
  { id: 'mrPlummer', key: 'authored_mrPlummer_8dir', url: new URL('../../assets/art/characters/mrPlummer_8dir_96x128.png', import.meta.url).href },
  { id: 'ana', key: 'authored_ana_8dir', url: new URL('../../assets/art/characters/ana_8dir_96x128.png', import.meta.url).href },
  { id: 'vivi', key: 'authored_vivi_8dir', url: new URL('../../assets/art/characters/vivi_8dir_96x128.png', import.meta.url).href },
  { id: 'oldTimer', key: 'authored_oldTimer_8dir', url: new URL('../../assets/art/characters/oldTimer_8dir_96x128.png', import.meta.url).href },
  { id: 'pajamaKid', key: 'authored_pajamaKid_8dir', url: new URL('../../assets/art/characters/pajamaKid_8dir_96x128.png', import.meta.url).href },
  { id: 'smiler', key: 'authored_smiler_8dir', url: new URL('../../assets/art/characters/smiler_8dir_96x128.png', import.meta.url).href },
  { id: 'smilerB', key: 'authored_smilerB_8dir', url: new URL('../../assets/art/characters/smilerB_8dir_96x128.png', import.meta.url).href },
  { id: 'nurse', key: 'authored_nurse_8dir', url: new URL('../../assets/art/characters/nurse_8dir_96x128.png', import.meta.url).href },
  { id: 'manager', key: 'authored_manager_8dir', url: new URL('../../assets/art/characters/manager_8dir_96x128.png', import.meta.url).href },
  { id: 'quarterMan', key: 'authored_quarterMan_8dir', url: new URL('../../assets/art/characters/quarterMan_8dir_96x128.png', import.meta.url).href },
  { id: 'pigeonKid', key: 'authored_pigeonKid_8dir', url: new URL('../../assets/art/characters/pigeonKid_8dir_96x128.png', import.meta.url).href },
  { id: 'sidewalkCritic', key: 'authored_sidewalkCritic_8dir', url: new URL('../../assets/art/characters/sidewalkCritic_8dir_96x128.png', import.meta.url).href },
  { id: 'grayCommuter', key: 'authored_grayCommuter_8dir', url: new URL('../../assets/art/characters/grayCommuter_8dir_96x128.png', import.meta.url).href },
  { id: 'drugClerk', key: 'authored_drugClerk_8dir', url: new URL('../../assets/art/characters/drugClerk_8dir_96x128.png', import.meta.url).href },
  { id: 'martClerk', key: 'authored_martClerk_8dir', url: new URL('../../assets/art/characters/martClerk_8dir_96x128.png', import.meta.url).href },
  { id: 'arcadeOwner', key: 'authored_arcadeOwner_8dir', url: new URL('../../assets/art/characters/arcadeOwner_8dir_96x128.png', import.meta.url).href },
  { id: 'permit', key: 'authored_permit_8dir', url: new URL('../../assets/art/characters/permit_8dir_96x128.png', import.meta.url).href },
  { id: 'busDriver', key: 'authored_busDriver_8dir', url: new URL('../../assets/art/characters/busDriver_8dir_96x128.png', import.meta.url).href },
  { id: 'fernLady', key: 'authored_fernLady_8dir', url: new URL('../../assets/art/characters/fernLady_8dir_96x128.png', import.meta.url).href },
  { id: 'caddy', key: 'authored_caddy_8dir', url: new URL('../../assets/art/characters/caddy_8dir_96x128.png', import.meta.url).href },
  { id: 'captain', key: 'authored_captain_8dir', url: new URL('../../assets/art/characters/captain_8dir_96x128.png', import.meta.url).href },
  { id: 'dockworker', key: 'authored_dockworker_8dir', url: new URL('../../assets/art/characters/dockworker_8dir_96x128.png', import.meta.url).href },
  { id: 'mercadoKeeper', key: 'authored_mercadoKeeper_8dir', url: new URL('../../assets/art/characters/mercadoKeeper_8dir_96x128.png', import.meta.url).href },
  { id: 'deliKeeper', key: 'authored_deliKeeper_8dir', url: new URL('../../assets/art/characters/deliKeeper_8dir_96x128.png', import.meta.url).href },
  { id: 'curator', key: 'authored_curator_8dir', url: new URL('../../assets/art/characters/curator_8dir_96x128.png', import.meta.url).href },
  { id: 'tomas', key: 'authored_tomas_8dir', url: new URL('../../assets/art/characters/tomas_8dir_96x128.png', import.meta.url).href },
  { id: 'docBrickton', key: 'authored_docBrickton_8dir', url: new URL('../../assets/art/characters/docBrickton_8dir_96x128.png', import.meta.url).href },
  { id: 'docPuerto', key: 'authored_docPuerto_8dir', url: new URL('../../assets/art/characters/docPuerto_8dir_96x128.png', import.meta.url).href },
  { id: 'docValle', key: 'authored_docValle_8dir', url: new URL('../../assets/art/characters/docValle_8dir_96x128.png', import.meta.url).href },
  { id: 'priestOtter', key: 'authored_priestOtter_8dir', url: new URL('../../assets/art/characters/priestOtter_8dir_96x128.png', import.meta.url).href },
  { id: 'priestValle', key: 'authored_priestValle_8dir', url: new URL('../../assets/art/characters/priestValle_8dir_96x128.png', import.meta.url).href },
  { id: 'wisherA', key: 'authored_wisherA_8dir', url: new URL('../../assets/art/characters/wisherA_8dir_96x128.png', import.meta.url).href },
  { id: 'wokeA', key: 'authored_wokeA_8dir', url: new URL('../../assets/art/characters/wokeA_8dir_96x128.png', import.meta.url).href },
  { id: 'wisherB', key: 'authored_wisherB_8dir', url: new URL('../../assets/art/characters/wisherB_8dir_96x128.png', import.meta.url).href },
  { id: 'wokeB', key: 'authored_wokeB_8dir', url: new URL('../../assets/art/characters/wokeB_8dir_96x128.png', import.meta.url).href },
  { id: 'wisherC', key: 'authored_wisherC_8dir', url: new URL('../../assets/art/characters/wisherC_8dir_96x128.png', import.meta.url).href },
  { id: 'wokeC', key: 'authored_wokeC_8dir', url: new URL('../../assets/art/characters/wokeC_8dir_96x128.png', import.meta.url).href },
  { id: 'senora', key: 'authored_senora_8dir', url: new URL('../../assets/art/characters/senora_8dir_96x128.png', import.meta.url).href },
  { id: 'uncleBert', key: 'authored_uncleBert_8dir', url: new URL('../../assets/art/characters/uncleBert_8dir_96x128.png', import.meta.url).href },
] as const;

export const AUTHORED_NPC_CHARACTER_IDS = NPC_CHARACTER_ART.map((art) => art.id);

const WORLD_TILE_ART = {
  key: 'authored_otterbrook_tiles16',
  url: new URL('../../assets/art/world/otterbrook_tiles_16.png', import.meta.url).href,
  names: TILESET.map((tile) => tile.name),
};

const WORLD_PROP_KEYS = [
  'tree', 'tree_b', 'tree_c', 'pine', 'sign', 'picnic', 'picnic_blanket', 'phone_table',
  'bed', 'desk', 'sofa', 'counter', 'bug_zapper', 'meteor_rock', 'meteor_rock_hickory_hill', 'sawhorse', 'ember',
  'lemonade', 'bus_sign', 'doormat', 'stairs', 'door_int', 'door_int_open', 'payphone',
  'dumpster', 'bench', 'hydrant', 'planter', 'elevator', 'water_cooler', 'copier',
  'plant_pot', 'holding_door', 'holding_door_1', 'holding_door_2', 'holding_door_3',
  'quota_panel', 'cot', 'office_door', 'bus_seat', 'bus_windows', 'skyline', 'shelf',
  'shelf_b', 'atm', 'phone_pole', 'trash_can', 'parking_meter', 'news_box', 'cola_fridge',
  'dresser', 'tv', 'stove', 'bookshelf', 'floor_lamp', 'poster_smile', 'poster_chart',
  'banner_productive', 'paw_prints', 'gift_box', 'gift_box_open', 'cab_a', 'cab_b',
  'cab_c', 'cab_legend', 'cage_gate', 'backboard', 'cage_mural', 'bleachers_a',
  'bleachers_b', 'chalk_board', 'fountain', 'market_stall_a', 'market_stall_b',
  'market_stall_c', 'banana_boat', 'departure_board', 'idol_shrine', 'pyramid_gate',
  'mask_switch', 'mask_switch_lit', 'pedestal_0', 'pedestal_1', 'pedestal_2',
  'pedestal_3', 'crate', 'crate_bananas', 'gangplank',
  'baobab_shade', 'giant_bootprint_snow', 'palm_a', 'palm_b', 'palm_c', 'palm_d',
  'postage_stamp_crosswalk', 'puerto_banana_boat', 'puerto_bench', 'puerto_crate',
  'puerto_crate_bananas', 'puerto_departure_board', 'puerto_fountain', 'puerto_gangplank',
  'puerto_gift_box', 'puerto_gift_box_open', 'puerto_market_stall_a',
  'puerto_market_stall_b', 'puerto_market_stall_c', 'puerto_payphone', 'puerto_picnic',
  'puerto_sign', 'puerto_trash_can',
] as const;

const BASE_FACADE_KEYS = [
  'house_rex', 'house_chad', 'house_a', 'house_b', 'drugstore', 'arcade', 'chapel',
  'valle_house_b', 'bldg_ps_mercado', 'bldg_ps_clinic', 'bldg_ps_pension',
  'bldg_ps_museum', 'bldg_ps_casa', 'bldg_ps_casa_b', 'bldg_ps_deli',
  'bldg_ps_cantina', 'bldg_ps_casa_c', 'bldg_ps_pension_b', 'bldg_ps_catedral',
  'bldg_ps_gran_hotel', 'bldg_ps_aduana', 'valle_shop', 'valle_clinic',
  'valle_chapel', 'valle_house', 'clubhouse', 'mansion_a', 'mansion_b', 'mansion_c',
  'golf_gatehouse', 'clubhouse_grand', 'bldg_bagels', 'bldg_starmart',
  'bldg_hospital', 'bldg_brickmore', 'bldg_dept', 'bldg_video', 'bldg_bank',
  'bldg_arcade2', 'bldg_diner', 'bldg_apartments', 'bldg_office', 'bldg_civic',
  'bldg_theater', 'bldg_market', 'bldg_brownstone', 'bldg_warehouse', 'bldg_neon',
  'bldg_deptstore', 'bldg_tower_glass', 'bldg_tower_arms', 'bldg_tower_corp',
] as const;

const REGION_FACADE_KEYS = [
  'bldg_kvisthavn_boathouse', 'bldg_kvisthavn_chapel', 'bldg_kvisthavn_fjord_cabin',
  'bldg_kvisthavn_harbor_cafe', 'bldg_kvisthavn_supply_shop',
  'bldg_lilleby_giant_inn', 'bldg_lilleby_runic_bank', 'bldg_lilleby_tiny_house',
  'bldg_lilleby_warehouse',
  'bldg_minimus_cathedral', 'bldg_minimus_census_office', 'bldg_minimus_major_palace',
  'bldg_minimus_manor', 'bldg_minimus_needle_armory', 'bldg_minimus_petit_market',
  'bldg_minimus_post_office', 'bldg_minimus_thimble_inn', 'bldg_minimus_whistle_barracks',
  'bldg_zanzibel_caravanserai', 'bldg_zanzibel_civic_hall', 'bldg_zanzibel_courier_guild',
  'bldg_zanzibel_grand_market', 'bldg_zanzibel_harbor_customs', 'bldg_zanzibel_home',
  'bldg_zanzibel_indigo_dyer', 'bldg_zanzibel_investment_desk', 'bldg_zanzibel_spice_stall',
] as const;

const WORLD_FACADE_KEYS = Array.from(new Set([
  ...BASE_FACADE_KEYS,
  ...REGION_FACADE_KEYS,
  ...GENERATED_BUILDINGS.map((building) => building.name),
]));

export const AUTHORED_WORLD_PROP_KEYS = WORLD_PROP_KEYS;
export const AUTHORED_WORLD_FACADE_KEYS = WORLD_FACADE_KEYS;

const WORLD_PROP_ART = [
  ...WORLD_FACADE_KEYS.map((key) => ({
    key,
    url: new URL(`../../assets/art/world/facades/${key}.png`, import.meta.url).href,
  })),
  ...WORLD_PROP_KEYS.map((key) => ({
    key,
    url: new URL(`../../assets/art/world/props/${key}.png`, import.meta.url).href,
  })),
];

const BATTLE_BACKGROUND_ART = ['otterbrook', 'brickton', 'jungle', 'england', 'school'].map((area) => ({
  area,
  key: `authored_battle_bg_${area}`,
  url: new URL(`../../assets/art/backgrounds/${area}.png`, import.meta.url).href,
}));

export const AUTHORED_WORLD_PROP_DISPLAY_SIZE = {
  gift_box: { w: 14, h: 14 },
  gift_box_open: { w: 16, h: 14 },
  crate: { w: 20, h: 18 },
  crate_bananas: { w: 20, h: 18 },
  payphone: { w: 16, h: 28 },
  dumpster: { w: 22, h: 18 },
  bench: { w: 22, h: 13 },
  hydrant: { w: 10, h: 14 },
  planter: { w: 22, h: 16 },
  phone_pole: { w: 136, h: 48 },
  trash_can: { w: 14, h: 18 },
  parking_meter: { w: 10, h: 22 },
  news_box: { w: 16, h: 20 },
  atm: { w: 16, h: 26 },
  water_cooler: { w: 12, h: 22 },
  copier: { w: 24, h: 18 },
  banana_boat: { w: 128, h: 64 },
  gangplank: { w: 24, h: 20 },
  departure_board: { w: 26, h: 30 },
  fountain: { w: 40, h: 38 },
  market_stall_a: { w: 40, h: 34 },
  market_stall_b: { w: 40, h: 34 },
  market_stall_c: { w: 40, h: 34 },
  idol_shrine: { w: 40, h: 44 },
  pyramid_gate: { w: 96, h: 76 },
  mask_switch: { w: 18, h: 22 },
  mask_switch_lit: { w: 18, h: 22 },
  pedestal_0: { w: 22, h: 30 },
  pedestal_1: { w: 22, h: 30 },
  pedestal_2: { w: 22, h: 30 },
  pedestal_3: { w: 22, h: 30 },
  plant_pot: { w: 14, h: 22 },
} as const satisfies Record<string, { w: number; h: number }>;

const ENEMY_BATTLE_ART = [
  { key: 'battle_cranky_mailbox', url: new URL('../../assets/art/enemies/battle_cranky_mailbox.png', import.meta.url).href },
  { key: 'battle_cranky_mailbox_w1', url: new URL('../../assets/art/enemies/battle_cranky_mailbox_w1.png', import.meta.url).href },
  { key: 'battle_cranky_mailbox_w2', url: new URL('../../assets/art/enemies/battle_cranky_mailbox_w2.png', import.meta.url).href },
  { key: 'battle_runaway_lawnmower', url: new URL('../../assets/art/enemies/battle_runaway_lawnmower.png', import.meta.url).href },
  { key: 'battle_runaway_lawnmower_w1', url: new URL('../../assets/art/enemies/battle_runaway_lawnmower_w1.png', import.meta.url).href },
  { key: 'battle_runaway_lawnmower_w2', url: new URL('../../assets/art/enemies/battle_runaway_lawnmower_w2.png', import.meta.url).href },
  { key: 'battle_coily_cicada', url: new URL('../../assets/art/enemies/battle_coily_cicada.png', import.meta.url).href },
  { key: 'battle_coily_cicada_w1', url: new URL('../../assets/art/enemies/battle_coily_cicada_w1.png', import.meta.url).href },
  { key: 'battle_coily_cicada_w2', url: new URL('../../assets/art/enemies/battle_coily_cicada_w2.png', import.meta.url).href },
  { key: 'battle_blazer_smiler', url: new URL('../../assets/art/enemies/battle_blazer_smiler.png', import.meta.url).href },
  { key: 'battle_blazer_smiler_w1', url: new URL('../../assets/art/enemies/battle_blazer_smiler_w1.png', import.meta.url).href },
  { key: 'battle_blazer_smiler_w2', url: new URL('../../assets/art/enemies/battle_blazer_smiler_w2.png', import.meta.url).href },
  { key: 'battle_pigeon_gang', url: new URL('../../assets/art/enemies/battle_pigeon_gang.png', import.meta.url).href },
  { key: 'battle_pigeon_gang_w1', url: new URL('../../assets/art/enemies/battle_pigeon_gang_w1.png', import.meta.url).href },
  { key: 'battle_pigeon_gang_w2', url: new URL('../../assets/art/enemies/battle_pigeon_gang_w2.png', import.meta.url).href },
  { key: 'battle_hill_slug', url: new URL('../../assets/art/enemies/battle_hill_slug.png', import.meta.url).href },
  { key: 'battle_hill_slug_w1', url: new URL('../../assets/art/enemies/battle_hill_slug_w1.png', import.meta.url).href },
  { key: 'battle_hill_slug_w2', url: new URL('../../assets/art/enemies/battle_hill_slug_w2.png', import.meta.url).href },
  { key: 'battle_titanic_tick', url: new URL('../../assets/art/enemies/battle_titanic_tick.png', import.meta.url).href },
  { key: 'battle_titanic_tick_w1', url: new URL('../../assets/art/enemies/battle_titanic_tick_w1.png', import.meta.url).href },
  { key: 'battle_titanic_tick_w2', url: new URL('../../assets/art/enemies/battle_titanic_tick_w2.png', import.meta.url).href },
  { key: 'battle_pickpocket_parrot', url: new URL('../../assets/art/enemies/battle_pickpocket_parrot.png', import.meta.url).href },
  { key: 'battle_pickpocket_parrot_w1', url: new URL('../../assets/art/enemies/battle_pickpocket_parrot_w1.png', import.meta.url).href },
  { key: 'battle_pickpocket_parrot_w2', url: new URL('../../assets/art/enemies/battle_pickpocket_parrot_w2.png', import.meta.url).href },
  { key: 'battle_gilded_beetle', url: new URL('../../assets/art/enemies/battle_gilded_beetle.png', import.meta.url).href },
  { key: 'battle_gilded_beetle_w1', url: new URL('../../assets/art/enemies/battle_gilded_beetle_w1.png', import.meta.url).href },
  { key: 'battle_gilded_beetle_w2', url: new URL('../../assets/art/enemies/battle_gilded_beetle_w2.png', import.meta.url).href },
  { key: 'battle_cursed_souvenir', url: new URL('../../assets/art/enemies/battle_cursed_souvenir.png', import.meta.url).href },
  { key: 'battle_cursed_souvenir_w1', url: new URL('../../assets/art/enemies/battle_cursed_souvenir_w1.png', import.meta.url).href },
  { key: 'battle_cursed_souvenir_w2', url: new URL('../../assets/art/enemies/battle_cursed_souvenir_w2.png', import.meta.url).href },
  { key: 'battle_step_mask', url: new URL('../../assets/art/enemies/battle_step_mask.png', import.meta.url).href },
  { key: 'battle_step_mask_w1', url: new URL('../../assets/art/enemies/battle_step_mask_w1.png', import.meta.url).href },
  { key: 'battle_step_mask_w2', url: new URL('../../assets/art/enemies/battle_step_mask_w2.png', import.meta.url).href },
  { key: 'battle_banana_bunch', url: new URL('../../assets/art/enemies/battle_banana_bunch.png', import.meta.url).href },
  { key: 'battle_banana_bunch_w1', url: new URL('../../assets/art/enemies/battle_banana_bunch_w1.png', import.meta.url).href },
  { key: 'battle_banana_bunch_w2', url: new URL('../../assets/art/enemies/battle_banana_bunch_w2.png', import.meta.url).href },
  { key: 'battle_jungle_jitterbug', url: new URL('../../assets/art/enemies/battle_jungle_jitterbug.png', import.meta.url).href },
  { key: 'battle_jungle_jitterbug_w1', url: new URL('../../assets/art/enemies/battle_jungle_jitterbug_w1.png', import.meta.url).href },
  { key: 'battle_jungle_jitterbug_w2', url: new URL('../../assets/art/enemies/battle_jungle_jitterbug_w2.png', import.meta.url).href },
  { key: 'battle_gilded_grin', url: new URL('../../assets/art/enemies/battle_gilded_grin.png', import.meta.url).href },
  { key: 'battle_gilded_grin_w1', url: new URL('../../assets/art/enemies/battle_gilded_grin_w1.png', import.meta.url).href },
  { key: 'battle_gilded_grin_w2', url: new URL('../../assets/art/enemies/battle_gilded_grin_w2.png', import.meta.url).href },
  { key: 'battle_gilded_grin_hollow', url: new URL('../../assets/art/enemies/battle_gilded_grin_hollow.png', import.meta.url).href },
  { key: 'battle_gilded_grin_hollow_w1', url: new URL('../../assets/art/enemies/battle_gilded_grin_hollow_w1.png', import.meta.url).href },
  { key: 'battle_gilded_grin_hollow_w2', url: new URL('../../assets/art/enemies/battle_gilded_grin_hollow_w2.png', import.meta.url).href },
  { key: 'battle_prefect_drone', url: new URL('../../assets/art/enemies/battle_prefect_drone.png', import.meta.url).href },
  { key: 'battle_prefect_drone_w1', url: new URL('../../assets/art/enemies/battle_prefect_drone_w1.png', import.meta.url).href },
  { key: 'battle_prefect_drone_w2', url: new URL('../../assets/art/enemies/battle_prefect_drone_w2.png', import.meta.url).href },
  { key: 'battle_possessed_textbook', url: new URL('../../assets/art/enemies/battle_possessed_textbook.png', import.meta.url).href },
  { key: 'battle_possessed_textbook_w1', url: new URL('../../assets/art/enemies/battle_possessed_textbook_w1.png', import.meta.url).href },
  { key: 'battle_possessed_textbook_w2', url: new URL('../../assets/art/enemies/battle_possessed_textbook_w2.png', import.meta.url).href },
  { key: 'battle_fog_hound', url: new URL('../../assets/art/enemies/battle_fog_hound.png', import.meta.url).href },
  { key: 'battle_fog_hound_w1', url: new URL('../../assets/art/enemies/battle_fog_hound_w1.png', import.meta.url).href },
  { key: 'battle_fog_hound_w2', url: new URL('../../assets/art/enemies/battle_fog_hound_w2.png', import.meta.url).href },
  { key: 'battle_tea_poltergeist', url: new URL('../../assets/art/enemies/battle_tea_poltergeist.png', import.meta.url).href },
  { key: 'battle_tea_poltergeist_w1', url: new URL('../../assets/art/enemies/battle_tea_poltergeist_w1.png', import.meta.url).href },
  { key: 'battle_tea_poltergeist_w2', url: new URL('../../assets/art/enemies/battle_tea_poltergeist_w2.png', import.meta.url).href },
  { key: 'battle_cricket_eleven', url: new URL('../../assets/art/enemies/battle_cricket_eleven.png', import.meta.url).href },
  { key: 'battle_cricket_eleven_w1', url: new URL('../../assets/art/enemies/battle_cricket_eleven_w1.png', import.meta.url).href },
  { key: 'battle_cricket_eleven_w2', url: new URL('../../assets/art/enemies/battle_cricket_eleven_w2.png', import.meta.url).href },
  { key: 'battle_greenhouse_creeper', url: new URL('../../assets/art/enemies/battle_greenhouse_creeper.png', import.meta.url).href },
  { key: 'battle_greenhouse_creeper_w1', url: new URL('../../assets/art/enemies/battle_greenhouse_creeper_w1.png', import.meta.url).href },
  { key: 'battle_greenhouse_creeper_w2', url: new URL('../../assets/art/enemies/battle_greenhouse_creeper_w2.png', import.meta.url).href },
  { key: 'battle_pillar_box', url: new URL('../../assets/art/enemies/battle_pillar_box.png', import.meta.url).href },
  { key: 'battle_pillar_box_w1', url: new URL('../../assets/art/enemies/battle_pillar_box_w1.png', import.meta.url).href },
  { key: 'battle_pillar_box_w2', url: new URL('../../assets/art/enemies/battle_pillar_box_w2.png', import.meta.url).href },
  { key: 'battle_brolly_bat', url: new URL('../../assets/art/enemies/battle_brolly_bat.png', import.meta.url).href },
  { key: 'battle_brolly_bat_w1', url: new URL('../../assets/art/enemies/battle_brolly_bat_w1.png', import.meta.url).href },
  { key: 'battle_brolly_bat_w2', url: new URL('../../assets/art/enemies/battle_brolly_bat_w2.png', import.meta.url).href },
  { key: 'battle_moor_sheep', url: new URL('../../assets/art/enemies/battle_moor_sheep.png', import.meta.url).href },
  { key: 'battle_moor_sheep_w1', url: new URL('../../assets/art/enemies/battle_moor_sheep_w1.png', import.meta.url).href },
  { key: 'battle_moor_sheep_w2', url: new URL('../../assets/art/enemies/battle_moor_sheep_w2.png', import.meta.url).href },
  { key: 'battle_soot_imp', url: new URL('../../assets/art/enemies/battle_soot_imp.png', import.meta.url).href },
  { key: 'battle_soot_imp_w1', url: new URL('../../assets/art/enemies/battle_soot_imp_w1.png', import.meta.url).href },
  { key: 'battle_soot_imp_w2', url: new URL('../../assets/art/enemies/battle_soot_imp_w2.png', import.meta.url).href },
  { key: 'battle_detention_desk', url: new URL('../../assets/art/enemies/battle_detention_desk.png', import.meta.url).href },
  { key: 'battle_detention_desk_w1', url: new URL('../../assets/art/enemies/battle_detention_desk_w1.png', import.meta.url).href },
  { key: 'battle_detention_desk_w2', url: new URL('../../assets/art/enemies/battle_detention_desk_w2.png', import.meta.url).href },
  { key: 'battle_schedule_bell', url: new URL('../../assets/art/enemies/battle_schedule_bell.png', import.meta.url).href },
  { key: 'battle_schedule_bell_w1', url: new URL('../../assets/art/enemies/battle_schedule_bell_w1.png', import.meta.url).href },
  { key: 'battle_schedule_bell_w2', url: new URL('../../assets/art/enemies/battle_schedule_bell_w2.png', import.meta.url).href },
  { key: 'battle_foggy_locker', url: new URL('../../assets/art/enemies/battle_foggy_locker.png', import.meta.url).href },
  { key: 'battle_foggy_locker_w1', url: new URL('../../assets/art/enemies/battle_foggy_locker_w1.png', import.meta.url).href },
  { key: 'battle_foggy_locker_w2', url: new URL('../../assets/art/enemies/battle_foggy_locker_w2.png', import.meta.url).href },
  { key: 'battle_tea_trolley', url: new URL('../../assets/art/enemies/battle_tea_trolley.png', import.meta.url).href },
  { key: 'battle_tea_trolley_w1', url: new URL('../../assets/art/enemies/battle_tea_trolley_w1.png', import.meta.url).href },
  { key: 'battle_tea_trolley_w2', url: new URL('../../assets/art/enemies/battle_tea_trolley_w2.png', import.meta.url).href },
  { key: 'battle_telephone_box', url: new URL('../../assets/art/enemies/battle_telephone_box.png', import.meta.url).href },
  { key: 'battle_telephone_box_w1', url: new URL('../../assets/art/enemies/battle_telephone_box_w1.png', import.meta.url).href },
  { key: 'battle_telephone_box_w2', url: new URL('../../assets/art/enemies/battle_telephone_box_w2.png', import.meta.url).href },
  { key: 'battle_overdue_tome', url: new URL('../../assets/art/enemies/battle_overdue_tome.png', import.meta.url).href },
  { key: 'battle_overdue_tome_w1', url: new URL('../../assets/art/enemies/battle_overdue_tome_w1.png', import.meta.url).href },
  { key: 'battle_overdue_tome_w2', url: new URL('../../assets/art/enemies/battle_overdue_tome_w2.png', import.meta.url).href },
  { key: 'battle_roman_sentry', url: new URL('../../assets/art/enemies/battle_roman_sentry.png', import.meta.url).href },
  { key: 'battle_roman_sentry_w1', url: new URL('../../assets/art/enemies/battle_roman_sentry_w1.png', import.meta.url).href },
  { key: 'battle_roman_sentry_w2', url: new URL('../../assets/art/enemies/battle_roman_sentry_w2.png', import.meta.url).href },
  { key: 'battle_head_prefect', url: new URL('../../assets/art/enemies/battle_head_prefect.png', import.meta.url).href },
  { key: 'battle_head_prefect_w1', url: new URL('../../assets/art/enemies/battle_head_prefect_w1.png', import.meta.url).href },
  { key: 'battle_head_prefect_w2', url: new URL('../../assets/art/enemies/battle_head_prefect_w2.png', import.meta.url).href },
  { key: 'battle_boiler_golem', url: new URL('../../assets/art/enemies/battle_boiler_golem.png', import.meta.url).href },
  { key: 'battle_boiler_golem_w1', url: new URL('../../assets/art/enemies/battle_boiler_golem_w1.png', import.meta.url).href },
  { key: 'battle_boiler_golem_w2', url: new URL('../../assets/art/enemies/battle_boiler_golem_w2.png', import.meta.url).href },
  { key: 'battle_the_invigilator', url: new URL('../../assets/art/enemies/battle_the_invigilator.png', import.meta.url).href },
  { key: 'battle_the_invigilator_w1', url: new URL('../../assets/art/enemies/battle_the_invigilator_w1.png', import.meta.url).href },
  { key: 'battle_the_invigilator_w2', url: new URL('../../assets/art/enemies/battle_the_invigilator_w2.png', import.meta.url).href },
  { key: 'battle_headmaster_mainframe', url: new URL('../../assets/art/enemies/battle_headmaster_mainframe.png', import.meta.url).href },
  { key: 'battle_headmaster_mainframe_w1', url: new URL('../../assets/art/enemies/battle_headmaster_mainframe_w1.png', import.meta.url).href },
  { key: 'battle_headmaster_mainframe_w2', url: new URL('../../assets/art/enemies/battle_headmaster_mainframe_w2.png', import.meta.url).href },
] as const;

function artFor(heroId: string): HeroArt | undefined {
  return HERO_ART.find((art) => art.id === heroId);
}

function sourceImage(scene: Phaser.Scene, key: string): SourceImage | null {
  if (!scene.textures.exists(key)) return null;
  const img = scene.textures.get(key).getSourceImage();
  if (img instanceof HTMLImageElement || img instanceof HTMLCanvasElement) return img;
  return null;
}

function replaceTextureSheet(
  scene: Phaser.Scene,
  key: string,
  canvas: HTMLCanvasElement,
  frameW: number,
  frameH: number,
  cols: number,
  frames: number,
): void {
  if (appliedSheets.has(key)) return;
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.addCanvas(key, canvas);
  if (!tex) return;
  for (let i = 0; i < frames; i++) {
    tex.add(i, 0, (i % cols) * frameW, Math.floor(i / cols) * frameH, frameW, frameH);
  }
  appliedSheets.add(key);
}

function clearHeroAnimations(scene: Phaser.Scene, heroId: string): void {
  const keys = [
    `${heroId}-idle-down`,
    ...CARDINALS.flatMap((facing) => [`${heroId}-walk-${facing}`, `${heroId}-run-${facing}`]),
    ...DIAGONALS.flatMap((facing) => [`${heroId}-walk-${facing}`, `${heroId}-run-${facing}`]),
  ];
  keys.forEach((key) => {
    if (scene.anims.exists(key)) scene.anims.remove(key);
  });
}

function replaceTextureImage(scene: Phaser.Scene, key: string, src: SourceImage): void {
  if (appliedSheets.has(key)) return;
  const canvas = document.createElement('canvas');
  canvas.width = src.width;
  canvas.height = src.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, 0, 0, src.width, src.height, 0, 0, canvas.width, canvas.height);
  if (scene.textures.exists(key)) scene.textures.remove(key);
  scene.textures.addCanvas(key, canvas);
  appliedSheets.add(key);
}

function makeCharacterCanvas(src: SourceImage): HTMLCanvasElement {
  const cols = 4;
  const rows = Math.ceil(TOTAL_CHARACTER_FRAMES / cols);
  const canvas = document.createElement('canvas');
  canvas.width = cols * FRAME_W;
  canvas.height = rows * FRAME_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.imageSmoothingEnabled = false;

  if (src.width >= cols * FRAME_W && src.height >= rows * FRAME_H) {
    ctx.drawImage(src, 0, 0, cols * FRAME_W, rows * FRAME_H, 0, 0, cols * FRAME_W, rows * FRAME_H);
    return canvas;
  }

  // Transition fallback (ART_SCALE): a FULL animation sheet authored at a smaller
  // size than the runtime frame — i.e. legacy ×1 art while ART_SCALE > 1. A full
  // sheet is portrait (4 cols × 12 rows); an 8-direction pose strip is landscape
  // (8 cols × 1 row), so aspect distinguishes them. Upscale the small full sheet
  // (nearest — chunky, like today) to fill the runtime sheet so un-updated art
  // still renders at ×4 until a runtime-res PNG replaces it, instead of being
  // misread as an 8-dir strip by the synthesis path below.
  if (src.height > src.width) {
    ctx.drawImage(src, 0, 0, src.width, src.height, 0, 0, cols * FRAME_W, rows * FRAME_H);
    return canvas;
  }

  // The authored 8-dir sheets run COUNTER-CLOCKWISE from front:
  //   0 down · 1 downleft · 2 left · 3 upleft · 4 up · 5 upright · 6 right · 7 downright
  // (verified from the art: down-diagonals show the face, up-diagonals the back,
  // and the cap bill points the way the body faces). This facing→column map MUST
  // match that order — a clockwise map mirrors left/right and every diagonal, so
  // the body faces the wrong way for the player's input.
  const sourceByFacing = {
    down: 0,
    downleft: 1,
    left: 2,
    upleft: 3,
    up: 4,
    upright: 5,
    right: 6,
    downright: 7,
  } as const;

  const dirNudge = (sourceIndex: number): { x: number; y: number } => {
    switch (sourceIndex) {
      case sourceByFacing.left: return { x: -1, y: 0 };
      case sourceByFacing.right: return { x: 1, y: 0 };
      case sourceByFacing.up: return { x: 0, y: -1 };
      case sourceByFacing.downleft: return { x: -1, y: 1 };
      case sourceByFacing.downright: return { x: 1, y: 1 };
      case sourceByFacing.upleft: return { x: -1, y: -1 };
      case sourceByFacing.upright: return { x: 1, y: -1 };
      default: return { x: 0, y: 1 };
    }
  };

  const drawFrame = (frame: number, sourceIndex: number, pose: 'stand' | 'walkA' | 'walkB' | 'runA' | 'runB' | 'idleBreath' | 'idleBlink'): void => {
    const sx = sourceIndex * FRAME_W;
    const dx = (frame % cols) * FRAME_W;
    const dy = Math.floor(frame / cols) * FRAME_H;
    const nudge = dirNudge(sourceIndex);
    const step = pose === 'walkA' || pose === 'runA' ? -1 : pose === 'walkB' || pose === 'runB' ? 1 : 0;
    const bob = pose === 'walkA' || pose === 'walkB' ? 1 : pose === 'runA' || pose === 'runB' ? 2 : pose === 'idleBreath' ? -1 : 0;
    const lean = pose === 'runA' || pose === 'runB' ? 1 : 0;
    const ox = Math.max(-2, Math.min(2, step + nudge.x * lean));
    const oy = Math.max(-2, Math.min(2, bob + nudge.y * lean));

    // The first authored cast sheets are 8-direction pose sheets, not full
    // animation sheets. Build a live 46-frame engine sheet from those poses:
    // stand frames stay exact, walk frames bob/sway, run frames lean into the
    // facing. That gives every rex-walk/run-* animation real, valid frames while
    // the next art pass can replace these synthetic in-betweens with hand poses.
    ctx.save();
    ctx.beginPath();
    ctx.rect(dx, dy, FRAME_W, FRAME_H);
    ctx.clip();
    ctx.drawImage(src, sx, 0, FRAME_W, FRAME_H, dx + ox, dy + oy, FRAME_W, FRAME_H);
    ctx.restore();
    if (pose === 'idleBlink') {
      ctx.fillStyle = 'rgba(18, 16, 25, 0.85)';
      ctx.fillRect(dx + 7, dy + 13, 10, 1);
    }
  };

  const walkBlock = [sourceByFacing.down, sourceByFacing.left, sourceByFacing.right, sourceByFacing.up];
  walkBlock.forEach((sourceIndex, dirIndex) => {
    const base = dirIndex * 4;
    drawFrame(base, sourceIndex, 'stand');
    drawFrame(base + 1, sourceIndex, 'walkA');
    drawFrame(base + 2, sourceIndex, 'stand');
    drawFrame(base + 3, sourceIndex, 'walkB');
  });
  walkBlock.forEach((sourceIndex, dirIndex) => {
    const base = 16 + dirIndex * 2;
    drawFrame(base, sourceIndex, 'runA');
    drawFrame(base + 1, sourceIndex, 'runB');
  });
  [sourceByFacing.downright, sourceByFacing.downleft, sourceByFacing.upright, sourceByFacing.upleft].forEach((sourceIndex, dirIndex) => {
    const base = 24 + dirIndex * 3;
    drawFrame(base, sourceIndex, 'stand');
    drawFrame(base + 1, sourceIndex, 'walkA');
    drawFrame(base + 2, sourceIndex, 'walkB');
  });
  [sourceByFacing.downright, sourceByFacing.downleft, sourceByFacing.upright, sourceByFacing.upleft].forEach((sourceIndex, dirIndex) => {
    const base = 36 + dirIndex * 2;
    drawFrame(base, sourceIndex, 'runA');
    drawFrame(base + 1, sourceIndex, 'runB');
  });
  drawFrame(44, sourceByFacing.down, 'idleBreath');
  drawFrame(45, sourceByFacing.down, 'idleBlink');
  return canvas;
}

function makeBustCanvas(src: SourceImage): HTMLCanvasElement {
  const cols = 4;
  const rows = Math.ceil(TOTAL_BUST_FRAMES / cols);
  const canvas = document.createElement('canvas');
  canvas.width = cols * BUST_W;
  canvas.height = rows * BUST_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, 0, 0, src.width, src.height, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function makeBattlerCanvas(src: SourceImage): HTMLCanvasElement {
  const cols = 4;
  const rows = Math.ceil(TOTAL_BATTLER_FRAMES / cols);
  const canvas = document.createElement('canvas');
  canvas.width = cols * BATTLER_W;
  canvas.height = rows * BATTLER_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, 0, 0, src.width, src.height, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function makeImageCanvas(src: SourceImage): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = src.width;
  canvas.height = src.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, 0, 0, src.width, src.height, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export function preloadAuthoredArt(scene: Phaser.Scene): void {
  FRAMING_SCREEN_ART.forEach((art) => scene.load.image(art.key, art.url));
  HERO_ART.forEach((art) => {
    scene.load.image(art.characterKey, art.characterUrl);
    scene.load.image(art.bustKey, art.bustUrl);
    scene.load.image(art.battlerKey, art.battlerUrl);
  });
  NPC_CHARACTER_ART.forEach((art) => scene.load.image(art.key, art.url));
  HERO_PORTRAIT_ART.forEach((art) => scene.load.image(heroPortraitKey(art.id), art.url));
  AUTHORED_MINIGAME_ATHLETES.forEach((art) => scene.load.image(art.key, art.url));
  AUTHORED_MINIGAME_GOLFERS.forEach((art) => scene.load.image(art.key, art.url));
  scene.load.image(WORLD_TILE_ART.key, WORLD_TILE_ART.url);
  WORLD_PROP_ART.forEach((art) => scene.load.image(`authored_world_${art.key}`, art.url));
  BATTLE_BACKGROUND_ART.forEach((art) => scene.load.image(art.key, art.url));
  ENEMY_BATTLE_ART.forEach((art) => scene.load.image(`authored_enemy_${art.key}`, art.url));
}

export function applyAuthoredHeroArt(scene: Phaser.Scene): void {
  HERO_ART.forEach((art) => {
    const character = sourceImage(scene, art.characterKey);
    if (character) {
      clearHeroAnimations(scene, art.id);
      replaceTextureSheet(scene, art.id, makeCharacterCanvas(character), FRAME_W, FRAME_H, 4, TOTAL_CHARACTER_FRAMES);
    }
  });
  NPC_CHARACTER_ART.forEach((art) => {
    const character = sourceImage(scene, art.key);
    if (character) {
      clearHeroAnimations(scene, art.id);
      replaceTextureSheet(scene, art.id, makeCharacterCanvas(character), FRAME_W, FRAME_H, 4, TOTAL_CHARACTER_FRAMES);
    }
  });
}

export function applyAuthoredBustSheet(scene: Phaser.Scene, key: string, heroId: string): void {
  const art = artFor(heroId);
  if (!art) return;
  const bust = sourceImage(scene, art.bustKey);
  if (bust) replaceTextureSheet(scene, key, makeBustCanvas(bust), BUST_W, BUST_H, 4, TOTAL_BUST_FRAMES);
}

export function applyAuthoredBattlerSheet(scene: Phaser.Scene, key: string, heroId: string): void {
  const art = artFor(heroId);
  if (!art) return;
  const battler = sourceImage(scene, art.battlerKey);
  if (battler) replaceTextureSheet(scene, key, makeBattlerCanvas(battler), BATTLER_W, BATTLER_H, 4, TOTAL_BATTLER_FRAMES);
}

export function applyAuthoredAthleteSheet(scene: Phaser.Scene, key: string): void {
  const id = key.startsWith('athlete_opp_') ? 'opponent' : key.replace(/^athlete_/, '');
  const art = AUTHORED_MINIGAME_ATHLETES.find((row) => row.id === id);
  if (!art) return;
  const img = sourceImage(scene, art.key);
  if (img) replaceTextureSheet(scene, key, makeImageCanvas(img), SPORT_FRAME_W, SPORT_FRAME_H, 5, SPORT_FRAME_COUNT);
}

export function applyAuthoredGolferSheet(scene: Phaser.Scene, key: string, heroId: string): void {
  const art = AUTHORED_MINIGAME_GOLFERS.find((row) => row.id === heroId);
  if (!art) return;
  const img = sourceImage(scene, art.key);
  if (img) replaceTextureSheet(scene, key, makeImageCanvas(img), SPORT_FRAME_W, SPORT_FRAME_H, 4, GOLF_FRAME_COUNT);
}

export function applyAuthoredWorldTiles(scene: Phaser.Scene): void {
  const tileArt = sourceImage(scene, WORLD_TILE_ART.key);
  const baseTiles = sourceImage(scene, 'tiles');
  if (!tileArt || !baseTiles) return;

  const canvas = document.createElement('canvas');
  canvas.width = baseTiles.width;
  canvas.height = baseTiles.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(baseTiles, 0, 0);

  // Read each authored tile at its OWN cell size (16 for legacy ×1 sheets, 64 for
  // runtime ×4 sheets) and draw it into the runtime RT_TILE cell — so legacy tile
  // sheets upscale gracefully at ×4 until a runtime-res sheet replaces them.
  const authoredCell = Math.max(1, Math.round(tileArt.width / WORLD_TILE_ART.names.length));
  WORLD_TILE_ART.names.forEach((name, authoredIndex) => {
    const tileIndex = TILESET.findIndex((tile) => tile.name === name);
    if (tileIndex < 0) return;
    ctx.clearRect(tileIndex * RT_TILE, 0, RT_TILE, RT_TILE);
    ctx.drawImage(tileArt, authoredIndex * authoredCell, 0, authoredCell, authoredCell, tileIndex * RT_TILE, 0, RT_TILE, RT_TILE);
  });

  replaceTextureSheet(scene, 'tiles', canvas, RT_TILE, RT_TILE, TILESET.length, TILESET.length);
}

export function applyAuthoredWorldProps(scene: Phaser.Scene): void {
  WORLD_PROP_ART.forEach((art) => {
    const img = sourceImage(scene, `authored_world_${art.key}`);
    if (img) replaceTextureImage(scene, art.key, img);
  });
}

export function applyAuthoredEnemyArt(scene: Phaser.Scene): void {
  ENEMY_BATTLE_ART.forEach((art) => {
    const img = sourceImage(scene, `authored_enemy_${art.key}`);
    if (img) replaceTextureImage(scene, art.key, img);
  });
}

export function applyAuthoredBattleArt(scene: Phaser.Scene): void {
  HERO_ART.forEach((art) => {
    for (const wear of [0, 1, 2]) applyAuthoredBustSheet(scene, `bust_${art.id}_none_w${wear}`, art.id);
    for (const wear of [0, 1, 2]) applyAuthoredBattlerSheet(scene, `battler_${art.id}_none_none_w${wear}`, art.id);
    applyAuthoredBustSheet(scene, `bust_${art.id}`, art.id);
  });
  applyAuthoredEnemyArt(scene);
}

export function applyAuthoredArt(scene: Phaser.Scene): void {
  applyAuthoredHeroArt(scene);
  applyAuthoredBattleArt(scene);
  applyAuthoredWorldTiles(scene);
  applyAuthoredWorldProps(scene);
}

export function applyAuthoredWorldArt(scene: Phaser.Scene): void {
  applyAuthoredWorldTiles(scene);
  applyAuthoredWorldProps(scene);
}

