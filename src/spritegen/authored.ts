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
const ENEMY_OW_FRAME_W = 24 * ART_SCALE;
const ENEMY_OW_FRAME_H = 32 * ART_SCALE;
const ENEMY_OW_FRAMES = 8;
const DOG_FRAME_W = 16 * ART_SCALE;
const DOG_FRAME_H = 16 * ART_SCALE;
const DOG_FRAMES = 4;
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
    bustUrl: new URL('../../assets/art/busts/jay-battle-bust-transparent.png', import.meta.url).href,
    battlerUrl: new URL('../../assets/art/battlers/jay_battler_14_28x36.png', import.meta.url).href,
  },
  {
    id: 'faye',
    characterKey: 'authored_faye_8dir',
    bustKey: 'authored_faye_bust18',
    battlerKey: 'authored_faye_battler14',
    characterUrl: new URL('../../assets/art/characters/mia_anim_46_4x.png', import.meta.url).href,
    bustUrl: new URL('../../assets/art/busts/mia-battle-bust-transparent.png', import.meta.url).href,
    battlerUrl: new URL('../../assets/art/battlers/mia_battler_14_28x36.png', import.meta.url).href,
  },
  {
    id: 'milo',
    characterKey: 'authored_milo_8dir',
    bustKey: 'authored_milo_bust18',
    battlerKey: 'authored_milo_battler14',
    characterUrl: new URL('../../assets/art/characters/milo_anim_46_4x.png', import.meta.url).href,
    bustUrl: new URL('../../assets/art/busts/milo-battle-bust-transparent.png', import.meta.url).href,
    battlerUrl: new URL('../../assets/art/battlers/milo_battler_14_28x36.png', import.meta.url).href,
  },
  {
    id: 'pippa',
    characterKey: 'authored_pippa_8dir',
    bustKey: 'authored_pippa_bust18',
    battlerKey: 'authored_pippa_battler14',
    characterUrl: new URL('../../assets/art/characters/pippa_anim_46_4x.png', import.meta.url).href,
    bustUrl: new URL('../../assets/art/busts/pippa-battle-bust-transparent.png', import.meta.url).href,
    battlerUrl: new URL('../../assets/art/battlers/pippa_battler_14_28x36.png', import.meta.url).href,
  },
  {
    id: 'dorin',
    characterKey: 'authored_dorin_8dir',
    bustKey: 'authored_dorin_bust18',
    battlerKey: 'authored_dorin_battler14',
    characterUrl: new URL('../../assets/art/characters/dorin_anim_46_4x.png', import.meta.url).href,
    bustUrl: new URL('../../assets/art/busts/dorin-battle-bust-transparent.png', import.meta.url).href,
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
  // milo & dorin: distinct cap/trim recolours of the authored rex sheet (the full
  // 39-frame animation set; ball/skin/kit preserved) via tools/recolor-athlete.js,
  // until bespoke masters are authored. Replaces their procedural fallback.
  { id: 'milo', key: 'authored_athlete_milo', url: new URL('../../assets/art/minigames/hoops/athlete_milo_runtime.png', import.meta.url).href },
  { id: 'dorin', key: 'authored_athlete_dorin', url: new URL('../../assets/art/minigames/hoops/athlete_dorin_runtime.png', import.meta.url).href },
  // pippa: a magenta recolour of the authored faye sheet (female, matches her)
  { id: 'pippa', key: 'authored_athlete_pippa', url: new URL('../../assets/art/minigames/hoops/athlete_pippa_runtime.png', import.meta.url).href },
  { id: 'opponent', key: 'authored_athlete_opponent', url: new URL('../../assets/art/minigames/hoops/athlete_opponent_runtime.png', import.meta.url).href },
] as const;

const AUTHORED_MINIGAME_GOLFERS = [
  { id: 'rex', key: 'authored_golfer_rex', url: new URL('../../assets/art/minigames/golf/golfer_rex_runtime.png', import.meta.url).href },
  { id: 'faye', key: 'authored_golfer_faye', url: new URL('../../assets/art/minigames/golf/golfer_faye_runtime.png', import.meta.url).href },
] as const;

const AUTHORED_HOOPS_SUPPORT_ART = [
  // The side-view court floor is now an AUTHORED top-down illustration
  // (court_side.png) composed to drawCageCourt()'s exact texture layout via
  // tools/compose-hoops-court.js (2960×1744; court fit into the inbounds rect),
  // so it drops over `cage_court` with the PAD/rim/camera coordinate system
  // unchanged. (court_full.png / court_behind.png remain parked — they are ¾
  // "down-the-court" views with their own painted hoops that collide with the
  // engine's sprite hoops at COURT.RIM.)
  { key: 'cage_court', file: 'court_side' },
  // behind-view floor: an authored DOWN-THE-COURT POV (court_behind_pov.png,
  // 1600×900, the behindMap full-screen seat), far baseline left empty for the
  // boardBehind hoop sprite. Replaces the procedural drawCageBehind.
  { key: 'cage_court_behind', file: 'court_behind_pov' },
  { key: 'hoop_ball', file: 'ball' },
  { key: 'athlete_shadow', file: 'shadow' },
  { key: 'backboard', file: 'backboard' },
  { key: 'cage_gate', file: 'gate' },
  { key: 'cage_mural', file: 'mural' },
  { key: 'bleachers_a', file: 'bleachers_a' },
  { key: 'bleachers_b', file: 'bleachers_b' },
  { key: 'chalk_board', file: 'chalkboard' },
] as const;

const AUTHORED_HOOPS_SIDE_SHEET = {
  key: 'hoop_side',
  authoredKey: 'authored_hoops_hoop_side_sheet',
  url: new URL('../../assets/art/minigames/hoops/hoop_side_sheet.png', import.meta.url).href,
} as const;

const AUTHORED_GOLF_SUPPORT_ART = [
  { key: 'links_ball', file: 'ball' },
  { key: 'links_flag', file: 'flag' },
  { key: 'links_h1', file: 'links_h1' },
  { key: 'links_h2', file: 'links_h2' },
  { key: 'links_h3', file: 'links_h3' },
  { key: 'links_h4', file: 'links_h4' },
  { key: 'links_h5', file: 'links_h5' },
  { key: 'links_h6', file: 'links_h6' },
  { key: 'links_h7', file: 'links_h7' },
  { key: 'links_h8', file: 'links_h8' },
  { key: 'links_h9', file: 'links_h9' },
  { key: 'links_h10', file: 'links_h10' },
  { key: 'links_h11', file: 'links_h11' },
  { key: 'links_h12', file: 'links_h12' },
  { key: 'links_h13', file: 'links_h13' },
  { key: 'links_h14', file: 'links_h14' },
  { key: 'links_h15', file: 'links_h15' },
  { key: 'links_h16', file: 'links_h16' },
  { key: 'links_h17', file: 'links_h17' },
  { key: 'links_h18', file: 'links_h18' },
  // behind-the-player POV art: the down-the-fairway backdrop + the back-view golfer
  { key: 'links_fairway', file: 'fairway_behind' },
  { key: 'links_golfer_back', file: 'golfer_back' },
  // the back-view swing cycle + hole-out reactions (LinksScene.BEHIND_POSES).
  // Small sheets (~1MB all told), so they ride the boot preload like the
  // address pose above — without them the golfer goes to a missing texture the
  // instant the club leaves address (top/impact/finish/putt/pump/slump).
  { key: 'links_golfer_back_top', file: 'golfer_back_top' },
  { key: 'links_golfer_back_impact', file: 'golfer_back_impact' },
  { key: 'links_golfer_back_finish', file: 'golfer_back_finish' },
  { key: 'links_golfer_back_putt', file: 'golfer_back_putt' },
  { key: 'links_golfer_back_pump_a', file: 'golfer_back_pump_a' },
  { key: 'links_golfer_back_pump_b', file: 'golfer_back_pump_b' },
  { key: 'links_golfer_back_slump_a', file: 'golfer_back_slump_a' },
  { key: 'links_golfer_back_slump_b', file: 'golfer_back_slump_b' },
] as const;

const AUTHORED_GOLF_SHEETS = [
  { key: 'links_splash', file: 'splash', frames: 2 },
  { key: 'links_sand', file: 'sand', frames: 2 },
] as const;

const AUTHORED_HOOPS_SUPPORT_SOURCES = AUTHORED_HOOPS_SUPPORT_ART.map((art) => ({
  ...art,
  authoredKey: `authored_hoops_${art.file}`,
  url: new URL(`../../assets/art/minigames/hoops/${art.file}.png`, import.meta.url).href,
}));

const AUTHORED_GOLF_SUPPORT_SOURCES = AUTHORED_GOLF_SUPPORT_ART.map((art) => ({
  ...art,
  authoredKey: `authored_golf_${art.file}`,
  url: new URL(`../../assets/art/minigames/golf/${art.file}.png`, import.meta.url).href,
}));

const AUTHORED_GOLF_SHEET_SOURCES = AUTHORED_GOLF_SHEETS.map((art) => ({
  ...art,
  authoredKey: `authored_golf_${art.file}`,
  url: new URL(`../../assets/art/minigames/golf/${art.file}.png`, import.meta.url).href,
}));

/**
 * The behind-the-player POV backdrops are big — each hole authors four
 * shot-context paintings (tee / approach / bunker / putt) at the full 1600×900,
 * ~2MB apiece, so all eighteen holes total ~166MB. That CANNOT ride the boot
 * preload, so they load USE-TIME, one hole at a time (the `ensureLinksArt`
 * stance), and the previous hole's set is freed as the next is fetched — the
 * resident POV art stays bounded at a single hole. Textures land under
 * `links_<holeId>_<ctx>`; LinksScene.updateBehindBackdrop polls for them and
 * falls back to `links_fairway` until the current hole's set arrives. */
const GOLF_BEHIND_CONTEXTS = ['tee', 'approach', 'bunker', 'putt'] as const;

export function golfBehindBackdropKey(holeId: string, ctx: string): string {
  return `links_${holeId}_${ctx}`;
}

/** Free one hole's behind-view backdrops (call on hole change / scene close). */
export function freeGolfBehindArt(scene: Phaser.Scene, holeId: string): void {
  for (const ctx of GOLF_BEHIND_CONTEXTS) {
    const key = golfBehindBackdropKey(holeId, ctx);
    if (scene.textures.exists(key)) scene.textures.remove(key);
  }
}

/** Queue this hole's behind-view backdrops (skipping any already resident) and
 *  free the previous hole's. Loads run on the scene's loader; the scene polls
 *  `textures.exists` each frame, so no completion callback is needed. */
export function ensureGolfBehindArt(scene: Phaser.Scene, holeId: string, previousHoleId?: string): void {
  if (previousHoleId && previousHoleId !== holeId) freeGolfBehindArt(scene, previousHoleId);
  let queued = false;
  for (const ctx of GOLF_BEHIND_CONTEXTS) {
    const key = golfBehindBackdropKey(holeId, ctx);
    if (scene.textures.exists(key)) continue;
    const file = `${holeId}_${ctx}`;
    scene.load.image(key, new URL(`../../assets/art/minigames/golf/${file}.png`, import.meta.url).href);
    queued = true;
  }
  if (queued && !scene.load.isLoading()) scene.load.start();
}

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
  { id: 'chad', key: 'authored_chad_8dir', url: new URL('../../assets/art/characters/chad_anim_46_4x.png', import.meta.url).href },
  { id: 'glint', key: 'authored_glint_8dir', url: new URL('../../assets/art/characters/glint_anim_46_4x.png', import.meta.url).href },
  { id: 'mom', key: 'authored_mom_8dir', url: new URL('../../assets/art/characters/mom_anim_46_4x.png', import.meta.url).href },
  { id: 'mrsPemmel', key: 'authored_mrsPemmel_8dir', url: new URL('../../assets/art/characters/mrsPemmel_anim_46_4x.png', import.meta.url).href },
  { id: 'mrPlummer', key: 'authored_mrPlummer_8dir', url: new URL('../../assets/art/characters/mrPlummer_anim_46_4x.png', import.meta.url).href },
  { id: 'ana', key: 'authored_ana_8dir', url: new URL('../../assets/art/characters/ana_anim_46_4x.png', import.meta.url).href },
  { id: 'vivi', key: 'authored_vivi_8dir', url: new URL('../../assets/art/characters/vivi_anim_46_4x.png', import.meta.url).href },
  { id: 'oldTimer', key: 'authored_oldTimer_8dir', url: new URL('../../assets/art/characters/oldTimer_anim_46_4x.png', import.meta.url).href },
  { id: 'pajamaKid', key: 'authored_pajamaKid_8dir', url: new URL('../../assets/art/characters/pajamaKid_anim_46_4x.png', import.meta.url).href },
  { id: 'smiler', key: 'authored_smiler_8dir', url: new URL('../../assets/art/characters/smiler_anim_46_4x.png', import.meta.url).href },
  { id: 'smilerB', key: 'authored_smilerB_8dir', url: new URL('../../assets/art/characters/smilerB_anim_46_4x.png', import.meta.url).href },
  { id: 'nurse', key: 'authored_nurse_8dir', url: new URL('../../assets/art/characters/nurse_anim_46_4x.png', import.meta.url).href },
  { id: 'manager', key: 'authored_manager_8dir', url: new URL('../../assets/art/characters/manager_anim_46_4x.png', import.meta.url).href },
  { id: 'quarterMan', key: 'authored_quarterMan_8dir', url: new URL('../../assets/art/characters/quarterMan_anim_46_4x.png', import.meta.url).href },
  { id: 'pigeonKid', key: 'authored_pigeonKid_8dir', url: new URL('../../assets/art/characters/pigeonKid_anim_46_4x.png', import.meta.url).href },
  { id: 'sidewalkCritic', key: 'authored_sidewalkCritic_8dir', url: new URL('../../assets/art/characters/sidewalkCritic_anim_46_4x.png', import.meta.url).href },
  { id: 'grayCommuter', key: 'authored_grayCommuter_8dir', url: new URL('../../assets/art/characters/grayCommuter_anim_46_4x.png', import.meta.url).href },
  { id: 'drugClerk', key: 'authored_drugClerk_8dir', url: new URL('../../assets/art/characters/drugClerk_anim_46_4x.png', import.meta.url).href },
  { id: 'martClerk', key: 'authored_martClerk_8dir', url: new URL('../../assets/art/characters/martClerk_anim_46_4x.png', import.meta.url).href },
  { id: 'arcadeOwner', key: 'authored_arcadeOwner_8dir', url: new URL('../../assets/art/characters/arcadeOwner_anim_46_4x.png', import.meta.url).href },
  { id: 'permit', key: 'authored_permit_8dir', url: new URL('../../assets/art/characters/permit_anim_46_4x.png', import.meta.url).href },
  { id: 'busDriver', key: 'authored_busDriver_8dir', url: new URL('../../assets/art/characters/busDriver_anim_46_4x.png', import.meta.url).href },
  { id: 'fernLady', key: 'authored_fernLady_8dir', url: new URL('../../assets/art/characters/fernLady_anim_46_4x.png', import.meta.url).href },
  { id: 'caddy', key: 'authored_caddy_8dir', url: new URL('../../assets/art/characters/caddy_anim_46_4x.png', import.meta.url).href },
  { id: 'captain', key: 'authored_captain_8dir', url: new URL('../../assets/art/characters/captain_anim_46_4x.png', import.meta.url).href },
  { id: 'dockworker', key: 'authored_dockworker_8dir', url: new URL('../../assets/art/characters/dockworker_anim_46_4x.png', import.meta.url).href },
  { id: 'mercadoKeeper', key: 'authored_mercadoKeeper_8dir', url: new URL('../../assets/art/characters/mercadoKeeper_anim_46_4x.png', import.meta.url).href },
  { id: 'deliKeeper', key: 'authored_deliKeeper_8dir', url: new URL('../../assets/art/characters/deliKeeper_anim_46_4x.png', import.meta.url).href },
  { id: 'curator', key: 'authored_curator_8dir', url: new URL('../../assets/art/characters/curator_anim_46_4x.png', import.meta.url).href },
  { id: 'tomas', key: 'authored_tomas_8dir', url: new URL('../../assets/art/characters/tomas_anim_46_4x.png', import.meta.url).href },
  { id: 'docBrickton', key: 'authored_docBrickton_8dir', url: new URL('../../assets/art/characters/docBrickton_anim_46_4x.png', import.meta.url).href },
  { id: 'docPuerto', key: 'authored_docPuerto_8dir', url: new URL('../../assets/art/characters/docPuerto_anim_46_4x.png', import.meta.url).href },
  { id: 'docValle', key: 'authored_docValle_8dir', url: new URL('../../assets/art/characters/docValle_anim_46_4x.png', import.meta.url).href },
  { id: 'priestOtter', key: 'authored_priestOtter_8dir', url: new URL('../../assets/art/characters/priestOtter_anim_46_4x.png', import.meta.url).href },
  { id: 'priestValle', key: 'authored_priestValle_8dir', url: new URL('../../assets/art/characters/priestValle_anim_46_4x.png', import.meta.url).href },
  { id: 'wisherA', key: 'authored_wisherA_8dir', url: new URL('../../assets/art/characters/wisherA_anim_46_4x.png', import.meta.url).href },
  { id: 'wokeA', key: 'authored_wokeA_8dir', url: new URL('../../assets/art/characters/wokeA_anim_46_4x.png', import.meta.url).href },
  { id: 'wisherB', key: 'authored_wisherB_8dir', url: new URL('../../assets/art/characters/wisherB_anim_46_4x.png', import.meta.url).href },
  { id: 'wokeB', key: 'authored_wokeB_8dir', url: new URL('../../assets/art/characters/wokeB_anim_46_4x.png', import.meta.url).href },
  { id: 'wisherC', key: 'authored_wisherC_8dir', url: new URL('../../assets/art/characters/wisherC_anim_46_4x.png', import.meta.url).href },
  { id: 'wokeC', key: 'authored_wokeC_8dir', url: new URL('../../assets/art/characters/wokeC_anim_46_4x.png', import.meta.url).href },
  { id: 'senora', key: 'authored_senora_8dir', url: new URL('../../assets/art/characters/senora_anim_46_4x.png', import.meta.url).href },
  { id: 'uncleBert', key: 'authored_uncleBert_8dir', url: new URL('../../assets/art/characters/uncleBert_anim_46_4x.png', import.meta.url).href },
  { id: 'npc_hodgkin', key: 'authored_npc_hodgkin_8dir', url: new URL('../../assets/art/characters/npc_hodgkin_anim_46_4x.png', import.meta.url).href },
  { id: 'npc_waitress', key: 'authored_npc_waitress_8dir', url: new URL('../../assets/art/characters/npc_waitress_anim_46_4x.png', import.meta.url).href },
  { id: 'npc_borden', key: 'authored_npc_borden_8dir', url: new URL('../../assets/art/characters/npc_borden_anim_46_4x.png', import.meta.url).href },
  { id: 'npc_clerk', key: 'authored_npc_clerk_8dir', url: new URL('../../assets/art/characters/npc_clerk_anim_46_4x.png', import.meta.url).href },
  { id: 'npc_depot_clerk', key: 'authored_npc_depot_clerk_8dir', url: new URL('../../assets/art/characters/npc_depot_clerk_anim_46_4x.png', import.meta.url).href },
  { id: 'npc_realtor', key: 'authored_npc_realtor_8dir', url: new URL('../../assets/art/characters/npc_realtor_anim_46_4x.png', import.meta.url).href },
  { id: 'npc_bert', key: 'authored_npc_bert_8dir', url: new URL('../../assets/art/characters/npc_bert_anim_46_4x.png', import.meta.url).href },
  // Ch.4 Norway — Kvisthavn & Lilleby cast (46-frame authored sheets)
  { id: 'sigrid_spectacles', key: 'authored_sigrid_spectacles_8dir', url: new URL('../../assets/art/characters/sigrid_spectacles_anim_46_4x.png', import.meta.url).href },
  { id: 'kvisthavn_fisher', key: 'authored_kvisthavn_fisher_8dir', url: new URL('../../assets/art/characters/kvisthavn_fisher_anim_46_4x.png', import.meta.url).href },
  { id: 'kvisthavn_shopkeeper', key: 'authored_kvisthavn_shopkeeper_8dir', url: new URL('../../assets/art/characters/kvisthavn_shopkeeper_anim_46_4x.png', import.meta.url).href },
  { id: 'mayor_of_lilleby', key: 'authored_mayor_of_lilleby_8dir', url: new URL('../../assets/art/characters/mayor_of_lilleby_anim_46_4x.png', import.meta.url).href },
  { id: 'lilleby_giant_child', key: 'authored_lilleby_giant_child_8dir', url: new URL('../../assets/art/characters/lilleby_giant_child_anim_46_4x.png', import.meta.url).href },
  { id: 'lilleby_undertaker', key: 'authored_lilleby_undertaker_8dir', url: new URL('../../assets/art/characters/lilleby_undertaker_anim_46_4x.png', import.meta.url).href },
  // Ch.4 Norway — secondary cast (quay buskers, moor & spine wanderers, town keepers)
  { id: 'aurora_busker', key: 'authored_aurora_busker_8dir', url: new URL('../../assets/art/characters/aurora_busker_anim_46_4x.png', import.meta.url).href },
  { id: 'bell_choir_child', key: 'authored_bell_choir_child_8dir', url: new URL('../../assets/art/characters/bell_choir_child_anim_46_4x.png', import.meta.url).href },
  { id: 'bootstep_shepherd', key: 'authored_bootstep_shepherd_8dir', url: new URL('../../assets/art/characters/bootstep_shepherd_anim_46_4x.png', import.meta.url).href },
  { id: 'canteen_keeper', key: 'authored_canteen_keeper_8dir', url: new URL('../../assets/art/characters/canteen_keeper_anim_46_4x.png', import.meta.url).href },
  { id: 'fjord_nurse', key: 'authored_fjord_nurse_8dir', url: new URL('../../assets/art/characters/fjord_nurse_anim_46_4x.png', import.meta.url).href },
  { id: 'sleepwalker_miner', key: 'authored_sleepwalker_miner_8dir', url: new URL('../../assets/art/characters/sleepwalker_miner_anim_46_4x.png', import.meta.url).href },
  // Ch.5 Minimus — the Grand Duchy cast (46-frame authored sheets; masters synced to runtime)
  { id: 'grand_duchess_millimetta', key: 'authored_grand_duchess_millimetta_8dir', url: new URL('../../assets/art/characters/grand_duchess_millimetta_anim_46_4x.png', import.meta.url).href },
  { id: 'spool_engineer', key: 'authored_spool_engineer_8dir', url: new URL('../../assets/art/characters/spool_engineer_anim_46_4x.png', import.meta.url).href },
  { id: 'royal_census_taker', key: 'authored_royal_census_taker_8dir', url: new URL('../../assets/art/characters/royal_census_taker_anim_46_4x.png', import.meta.url).href },
  { id: 'whistle_guard_npc', key: 'authored_whistle_guard_npc_8dir', url: new URL('../../assets/art/characters/whistle_guard_npc_anim_46_4x.png', import.meta.url).href },
  { id: 'teacup_innkeeper', key: 'authored_teacup_innkeeper_8dir', url: new URL('../../assets/art/characters/teacup_innkeeper_anim_46_4x.png', import.meta.url).href },
  { id: 'tiny_postmaster', key: 'authored_tiny_postmaster_8dir', url: new URL('../../assets/art/characters/tiny_postmaster_anim_46_4x.png', import.meta.url).href },
  { id: 'matchbox_herald', key: 'authored_matchbox_herald_8dir', url: new URL('../../assets/art/characters/matchbox_herald_anim_46_4x.png', import.meta.url).href },
  { id: 'mr_click', key: 'authored_mr_click_8dir', url: new URL('../../assets/art/characters/mr_click_anim_46_4x.png', import.meta.url).href },
  // Ch.6 Africa — the Zanzibel cast (46-frame authored sheets; masters synced to runtime)
  { id: 'zanzibel_market_queen', key: 'authored_zanzibel_market_queen_8dir', url: new URL('../../assets/art/characters/zanzibel_market_queen_anim_46_4x.png', import.meta.url).href },
  { id: 'zanzibel_dockmaster', key: 'authored_zanzibel_dockmaster_8dir', url: new URL('../../assets/art/characters/zanzibel_dockmaster_anim_46_4x.png', import.meta.url).href },
  { id: 'laughing_ruins_guide', key: 'authored_laughing_ruins_guide_8dir', url: new URL('../../assets/art/characters/laughing_ruins_guide_anim_46_4x.png', import.meta.url).href },
  { id: 'baobab_healer', key: 'authored_baobab_healer_8dir', url: new URL('../../assets/art/characters/baobab_healer_anim_46_4x.png', import.meta.url).href },
  // Ch.7 India — the Chandrapore cast (46-frame authored sheets; masters synced to runtime)
  { id: 'cp_spice_merchant', key: 'authored_cp_spice_merchant_8dir', url: new URL('../../assets/art/characters/cp_spice_merchant_anim_46_4x.png', import.meta.url).href },
  { id: 'cp_dabbawala', key: 'authored_cp_dabbawala_8dir', url: new URL('../../assets/art/characters/cp_dabbawala_anim_46_4x.png', import.meta.url).href },
  { id: 'cp_stationmaster', key: 'authored_cp_stationmaster_8dir', url: new URL('../../assets/art/characters/cp_stationmaster_anim_46_4x.png', import.meta.url).href },
  { id: 'cp_usher', key: 'authored_cp_usher_8dir', url: new URL('../../assets/art/characters/cp_usher_anim_46_4x.png', import.meta.url).href },
  // Ch.8 China — the Lotus Harbor cast (46-frame authored sheets; masters synced to runtime)
  { id: 'lh_harbor_master', key: 'authored_lh_harbor_master_8dir', url: new URL('../../assets/art/characters/lh_harbor_master_anim_46_4x.png', import.meta.url).href },
  { id: 'lh_calligrapher', key: 'authored_lh_calligrapher_8dir', url: new URL('../../assets/art/characters/lh_calligrapher_anim_46_4x.png', import.meta.url).href },
  { id: 'lh_lantern_girl', key: 'authored_lh_lantern_girl_8dir', url: new URL('../../assets/art/characters/lh_lantern_girl_anim_46_4x.png', import.meta.url).href },
  { id: 'lh_tea_monk', key: 'authored_lh_tea_monk_8dir', url: new URL('../../assets/art/characters/lh_tea_monk_anim_46_4x.png', import.meta.url).href },
  // Ch.9 Romania — the Valea Stelelor cast (46-frame authored sheets; masters synced to runtime)
  { id: 'vs_buni', key: 'authored_vs_buni_8dir', url: new URL('../../assets/art/characters/vs_buni_anim_46_4x.png', import.meta.url).href },
  { id: 'vs_provisioner', key: 'authored_vs_provisioner_8dir', url: new URL('../../assets/art/characters/vs_provisioner_anim_46_4x.png', import.meta.url).href },
  { id: 'vs_shepherd', key: 'authored_vs_shepherd_8dir', url: new URL('../../assets/art/characters/vs_shepherd_anim_46_4x.png', import.meta.url).href },
  { id: 'vs_kid', key: 'authored_vs_kid_8dir', url: new URL('../../assets/art/characters/vs_kid_anim_46_4x.png', import.meta.url).href },
] as const;

export const AUTHORED_NPC_CHARACTER_IDS = NPC_CHARACTER_ART.map((art) => art.id);

export const OTTERBROOK_NPC_CHARACTER_IDS = [
  'chad',
  'glint',
  'mom',
  'mrsPemmel',
  'mrPlummer',
  'ana',
  'vivi',
  'oldTimer',
  'pajamaKid',
  'fernLady',
  'quarterMan',
  'senora',
  'grayCommuter',
  'pigeonKid',
  'drugClerk',
  'deliKeeper',
  'priestOtter',
  'busDriver',
] as const;

const BISCUIT_DOG_ART = {
  key: 'authored_biscuit_dog',
  url: new URL('../../assets/art/characters/biscuit_dog_4frame.png', import.meta.url).href,
} as const;

const WORLD_TILE_ART = {
  key: 'authored_otterbrook_tiles16',
  url: new URL('../../assets/art/world/otterbrook_tiles_16.png', import.meta.url).href,
  names: TILESET.map((tile) => tile.name),
};

const HICKORY_DIRT_TILE_ART = {
  key: 'authored_tile_hickory_dirt',
  url: new URL('../../assets/art/world/tile_hickory_dirt.png', import.meta.url).href,
  names: Array.from({ length: 32 }, (_, i) => `path_${Math.floor(i / 16)}_${i % 16}`),
};

// PKG-12 §A11 — the MINIMUS region tile strip (16 cells × 64px). A PARTIAL override:
// only the tileable ground/wall cells map onto the appended Minimus TILESET names —
// col 4 = cobblestone → minimus_cobble, col 6 = privet turf → minimus_turf, col 7 =
// hedge wall → minimus_hedge. The decorative cells (teacup/columns/thimble/banner/crown/
// arches) stay unused until a grid-char pass places them. Empty names are skipped by
// drawAuthoredTileStrip. These tiles render ONLY on the Ch.5 maps (the render-time
// name-remap in OverworldScene.buildTiles); every other map is untouched.
const MINIMUS_TILE_ART = {
  key: 'authored_minimus_tiles16',
  url: new URL('../../assets/art/world/Minimus_tiles_16.png', import.meta.url).href,
  names: ['', '', '', '', 'minimus_cobble', '', 'minimus_turf', 'minimus_hedge', '', '', '', '', '', '', '', ''],
};

// PKG-15 §1 — the Ch.8 CHINA (Lotus Harbor) region tile strip (3 cells × 64px). A PARTIAL
// override like Minimus: each authored cell maps onto an appended china TILESET name (col 0 =
// jade river-dust ground → china_ground, col 1 = stone flagstone → china_path, col 2 = temple
// masonry → china_wall). These render ONLY on the Ch.8 maps (the render-time name-remap
// CHINA_TILE_SKIN in OverworldScene.buildTiles); every other map is untouched.
const CHINA_TILE_ART = {
  key: 'authored_china_tiles16',
  url: new URL('../../assets/art/world/China_tiles_16.png', import.meta.url).href,
  names: ['china_ground', 'china_path', 'china_wall'],
};

// Ch.9 ROMANIA (Valea Stelelor) region tile strip (3 cells × 64px) — a PARTIAL override like
// China: col 0 = mountain-meadow grass → romania_ground, col 1 = packed dirt road → romania_path,
// col 2 = mossy castle stonework → romania_wall. Renders ONLY on the Ch.9 maps (the render-time
// name-remap ROMANIA_TILE_SKIN in OverworldScene.buildTiles); every other map is untouched.
const ROMANIA_TILE_ART = {
  key: 'authored_romania_tiles16',
  url: new URL('../../assets/art/world/Romania_tiles_16.png', import.meta.url).href,
  names: ['romania_ground', 'romania_path', 'romania_wall'],
};

const WORLD_PROP_KEYS = [
  'tree', 'tree_b', 'tree_c', 'pine', 'sign', 'picnic', 'picnic_blanket', 'phone_table',
  'bed', 'desk', 'sofa', 'counter', 'bug_zapper', 'meteor_rock', 'meteor_rock_hickory_hill', 'sawhorse', 'ember',
  // ADR-121 — the Hush Sentinel overworld set-piece (rises from the crater) + the
  // powered-down husk it leaves as an Otterbrook landmark (wakes again, Ch.10) +
  // the super-Glint radiant flare for the "goes supernova" rally beat.
  'hush_sentinel', 'sentinel_husk', 'glint_radiant',
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
  'prop_pine_whisperwood', 'prop_pine_whisperwood_b', 'prop_pine_whisperwood_c',
  'prop_trail_marker', 'prop_guardrail', 'prop_culvert',
  'prop_pegboard_wall', 'prop_tool_shelf', 'prop_lockbox_counter',
  'prop_counter_stools', 'prop_booth', 'prop_pie_case', 'prop_jukebox',
  'prop_ticket_window', 'prop_waiting_bench', 'prop_schedule_board',
  'prop_frontdesk', 'prop_waitingchairs', 'prop_wardbed', 'prop_vending',
  // Ch.4 Norway — Sleeper's-Spine interior dressing (inside a sleeping giant)
  'prop_giant_hair', 'prop_amber_wax', 'prop_resonance_stones',
  // Ch.5 Minimus — the Hedgerow maze + the Ducal Crown dressing (PKG-12 §2)
  'hedgerow_leaf_wall', 'hedgerow_thorn_arch', 'ducal_crown_gate', 'matchbox_podium',
  // Ch.5 Minimus — decorative Grand-Duchy feature props (sliced from Minimus_tiles_16.png cells)
  'minimus_crown', 'minimus_banner', 'minimus_teacup', 'minimus_thimble',
] as const;

const BASE_FACADE_KEYS = [
  'house_rex', 'house_chad', 'house_a', 'house_b', 'house_pink', 'drugstore', 'arcade', 'chapel',
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
  'facade_hardware', 'facade_diner', 'facade_busdepot', 'facade_busdepot_open',
  'facade_fillshop', 'facade_realty', 'facade_autolot',
  // ADR-118 rework — the Otterbrook STATION HOUSE (the little brick P.D. Borden
  // marches you into). Authored hi-res facade; sizes like bldg_civic next door.
  'facade_otter_station',
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
  // Ch.8 China — Lotus Harbor (authored temple-town facades; AREA_SKINS.lotus_harbor)
  'bldg_lotus_harbor_grand_market', 'bldg_lotus_harbor_harbor_office', 'bldg_lotus_harbor_lantern_shop',
  'bldg_lotus_harbor_pagoda', 'bldg_lotus_harbor_row_house', 'bldg_lotus_harbor_tea_house',
  'bldg_lotus_harbor_temple', 'bldg_lotus_harbor_theater',
  // Ch.9 Romania — Valea Stelelor (authored painted-village facades; AREA_SKINS.valea)
  'bldg_valea_painted_house', 'bldg_valea_church', 'bldg_valea_inn',
  'bldg_valea_shop', 'bldg_valea_cottage', 'bldg_valea_barn',
  'bldg_valea_mill', 'bldg_valea_hall',
] as const;

const WORLD_FACADE_KEYS = Array.from(new Set([
  ...BASE_FACADE_KEYS,
  ...REGION_FACADE_KEYS,
  ...GENERATED_BUILDINGS.map((building) => building.name),
]));

export const AUTHORED_WORLD_PROP_KEYS = WORLD_PROP_KEYS;
export const AUTHORED_WORLD_FACADE_KEYS = WORLD_FACADE_KEYS;

export const AUTHORED_VEHICLE_ART = [
  'banana_boat',
  'big_block',
  'biplane',
  'boat',
  'bus',
  'chrome_hog',
  'city_ev',
  'comet_gt',
  'commuter',
  'deep_marlin',
  'drop_top',
  'grand_tourer',
  'kids_bmx',
  'llama',
  'lucille',
  'lucille_norway',
  'minimus_parade_float',
  'night_train',
  'old_reliable',
  'orient_less_express',
  'pearl_yacht',
  'river_dinghy',
  'riverboat',
  'rocket',
  'savanna_caravan_truck',
  'school_bus',
  'sky_taxi',
  'snowcat',
  'starhopper',
  'ten_speed',
  'the_long_shot',
  'the_nikolai',
  'the_quick_one',
  'the_stretch',
  'trail_boss',
  'train',
  'vehicle_clunker',
  'work_van',
  'yak_express',
] as const;

export const AUTHORED_VEHICLE_ART_KEYS = AUTHORED_VEHICLE_ART;

/** ADR-097 DIRECTIONAL vehicles: their authored sheet is 3 frames [side, front, back]
 *  (NOT the legacy 4 motion frames of the side view). Traffic SWAPS the frame by travel
 *  direction instead of rotating the 3/4 side art, so vertical lanes read correctly (no
 *  skew). Add a key here once its front+back views are authored + composed
 *  (tools/compose-vehicle-directional.cjs). */
export const DIRECTIONAL_VEHICLE_KEYS = new Set<string>([
  // the road-traffic four-wheelers, each authored with front + back oblique views
  'commuter', 'work_van', 'city_ev', 'trail_boss', 'big_block', 'the_nikolai', 'drop_top',
  'grand_tourer', 'the_stretch', 'comet_gt', 'school_bus', 'bus', 'vehicle_clunker', 'savanna_caravan_truck',
  // the two-wheelers — head-on front + rear views
  'kids_bmx', 'ten_speed', 'old_reliable', 'chrome_hog', 'the_quick_one',
]);

const AUTHORED_VEHICLE_SOURCES = AUTHORED_VEHICLE_ART.map((key) => ({
  key,
  authoredKey: `authored_vehicle_${key}`,
  url: new URL(`../../assets/art/vehicles/${key}.png`, import.meta.url).href,
}));

/**
 * LOW-RES facades — their authored PNGs were legacy ×1 (chunky when lifted to the
 * 1600×900 framebuffer). Per the "only implement high-res facades" direction we no
 * longer load these: the PNGs are parked in `dormant/low-res-facades/`, so the keys
 * fall back to the FROZEN procedural drawHouse/drawCityBuilding base, which registers
 * at native and upscales ×ART_SCALE at the seam — a CRISP ×4 texture at the correct
 * size (better than upscaling the ×1 PNG). The generated catalog + colossi are
 * procedural by nature, so they all live here too. To re-promote one: author a
 * high-res PNG into assets/art/world/facades/ and remove its key from this set.
 */
const LOW_RES_FACADE_KEYS: ReadonlySet<string> = new Set<string>([
  // Otterbrook facades (house_rex/chad/a/b, drugstore, arcade, chapel) re-promoted to
  // authored hi-res — sliced from otterbrook-facades-transparent.png into
  // assets/art/world/facades/ (tools/slice-otterbrook-facades.js).
  'clubhouse', 'clubhouse_grand', 'golf_gatehouse', 'mansion_a', 'mansion_b', 'mansion_c',
  'valle_house', 'valle_house_b', 'valle_shop', 'valle_clinic', 'valle_chapel',
  ...GENERATED_BUILDINGS.map((building) => building.name), // bldg_gen_* + colossi
]);

/** facades loaded as AUTHORED art — the hand-authored ×4 hi-res set only */
export const AUTHORED_FACADE_KEYS = WORLD_FACADE_KEYS.filter((key) => !LOW_RES_FACADE_KEYS.has(key));

const WORLD_PROP_ART = [
  ...AUTHORED_FACADE_KEYS.map((key) => ({
    key,
    url: new URL(`../../assets/art/world/facades/${key}.png`, import.meta.url).href,
  })),
  ...WORLD_PROP_KEYS.map((key) => ({
    key,
    url: new URL(`../../assets/art/world/props/${key}.png`, import.meta.url).href,
  })),
];

const BATTLE_BACKGROUND_ART = ['otterbrook', 'brickton', 'jungle', 'england', 'school', 'sleepers_spine', 'fjord', 'the_hedgerow', 'laughing_ruins', 'cobra_palace', 'spore_forest', 'castle_hoaxula', 'aurora', 'mauna_lani', 'sea_of_silence'].map((area) => ({
  area,
  key: `authored_battle_bg_${area}`,
  url: new URL(`../../assets/art/backgrounds/${area}.png`, import.meta.url).href,
}));

export const AUTHORED_WORLD_PROP_DISPLAY_SIZE = {
  gift_box: { w: 14, h: 14 },
  gift_box_open: { w: 16, h: 14 },
  crate: { w: 20, h: 18 },
  crate_bananas: { w: 20, h: 18 },
  cot: { w: 20, h: 24 },
  counter: { w: 30, h: 18 },
  payphone: { w: 16, h: 28 },
  dumpster: { w: 22, h: 18 },
  bench: { w: 22, h: 13 },
  hydrant: { w: 10, h: 14 },
  planter: { w: 22, h: 16 },
  elevator: { w: 40, h: 48 },
  ember: { w: 12, h: 12 },
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
  puerto_bench: { w: 22, h: 13 },
  // Otterbrook hi-res furniture/flora (sliced from otterbrook-world master). The
  // slices are hi-res; these sizes anchor on the old native HEIGHT (keeps each
  // prop's ground line + y-sort depth) with art-true widths. See
  // tools/slice-otterbrook-world.js.
  tree: { w: 24, h: 34 },
  tree_b: { w: 25, h: 34 },
  tree_c: { w: 29, h: 34 },
  pine: { w: 25, h: 34 },
  sign: { w: 25, h: 18 },
  picnic: { w: 30, h: 26 },
  picnic_blanket: { w: 22, h: 24 },
  phone_table: { w: 12, h: 18 },
  bed: { w: 22, h: 30 },
  sofa: { w: 28, h: 20 },
  desk: { w: 21, h: 18 },
  dresser: { w: 24, h: 24 },
  tv: { w: 23, h: 20 },
  bookshelf: { w: 33, h: 30 },
  floor_lamp: { w: 14, h: 30 },
  paw_prints: { w: 18, h: 12 },
  prop_pine_whisperwood: { w: 32, h: 48 },
  prop_pine_whisperwood_b: { w: 32, h: 48 },
  prop_pine_whisperwood_c: { w: 32, h: 48 },
  prop_trail_marker: { w: 24, h: 32 },
  prop_guardrail: { w: 56, h: 22 },
  prop_culvert: { w: 40, h: 32 },
  prop_pegboard_wall: { w: 46, h: 30 },
  prop_tool_shelf: { w: 36, h: 30 },
  prop_lockbox_counter: { w: 46, h: 24 },
  prop_counter_stools: { w: 50, h: 22 },
  prop_booth: { w: 34, h: 30 },
  prop_pie_case: { w: 30, h: 22 },
  prop_jukebox: { w: 22, h: 34 },
  prop_ticket_window: { w: 34, h: 32 },
  prop_waiting_bench: { w: 34, h: 16 },
  prop_schedule_board: { w: 32, h: 24 },
  prop_frontdesk: { w: 42, h: 28 },
  prop_waitingchairs: { w: 42, h: 22 },
  prop_wardbed: { w: 36, h: 34 },
  prop_vending: { w: 22, h: 34 },
  // Ch.4 Norway — Sleeper's-Spine interior dressing (native map units; aspect from the sliced PNGs)
  prop_giant_hair: { w: 27, h: 28 },
  prop_amber_wax: { w: 18, h: 15 },
  prop_resonance_stones: { w: 46, h: 43 },
  // Ch.5 Minimus — the Hedgerow maze + the Ducal Crown dressing (64px square sources,
  // kept square so the setDisplaySize from native map units never distorts them)
  hedgerow_leaf_wall: { w: 22, h: 22 },
  hedgerow_thorn_arch: { w: 30, h: 30 },
  ducal_crown_gate: { w: 32, h: 32 },
  matchbox_podium: { w: 16, h: 16 },
  // Ch.5 Minimus decorative feature props (64px square cells — kept SQUARE so setDisplaySize never distorts)
  minimus_crown: { w: 32, h: 32 },
  minimus_banner: { w: 22, h: 22 },
  minimus_teacup: { w: 18, h: 18 },
  minimus_thimble: { w: 16, h: 16 },
} as const satisfies Record<string, { w: number; h: number }>;

/** Footprint width in TILES for the generated catalog + colossi, mirrored from
 *  each entry's drawCityBuilding registration (wallTiles). Hand-authored facades
 *  are not listed — they fall to the resolution heuristic in worldSpriteScale. */
const GEN_FACADE_FOOTPRINT_W: Record<string, number> = Object.fromEntries(
  GENERATED_BUILDINGS.map((b) => [b.name, b.opts.wallTiles]),
);
const WORLD_FACADE_KEY_SET: ReadonlySet<string> = new Set(WORLD_FACADE_KEYS);

/**
 * THE WORLD RESIZE RULE (ADR-110 follow-up). Authored world art ships at MIXED
 * resolutions: the prop high-res rollout and the hand-authored downtown facades
 * are drawn at the runtime 4× size, but core houses, the generated catalog, the
 * colossi and most interior props are still legacy ×1. World sprites render at
 * their RAW texture size, so the ×1 ones came out ~ART_SCALE× too small after the
 * 1600×900 migration ("homes and props too small"). This returns the uniform
 * scale to apply to a PLACED world sprite so it lands at the size it represents,
 * whatever resolution its PNG happens to be:
 *
 *  · a sized prop (AUTHORED_WORLD_PROP_DISPLAY_SIZE) → 1; the scene setDisplaySize's
 *    it from NATIVE map units, so it is already resolution-independent.
 *  · a FACADE → scaled to its DECLARED footprint width (generated/colossi via
 *    wallTiles), but only ever UP so the hand-authored hi-res facades stay 1:1;
 *    an undeclared facade is legacy ×1 art (≤160px — the native/hi-res gap runs
 *    130↔232px) lifted to runtime ×ART_SCALE.
 *  · any other prop still at legacy native size (≤48px either axis — every
 *    runtime-authored prop is ≥56px) → lifted ×ART_SCALE.
 *
 * Scale at PLACEMENT (setScale), never the texture, so a 72-tile colossus keeps
 * its 1154px texture instead of baking a 4616px one.
 */
export function worldSpriteScale(sprite: string, texW: number, texH: number): number {
  if (sprite in AUTHORED_WORLD_PROP_DISPLAY_SIZE) return 1;
  if (WORLD_FACADE_KEY_SET.has(sprite)) {
    const footW = GEN_FACADE_FOOTPRINT_W[sprite];
    if (footW) return Math.max(1, (footW * RT_TILE) / texW);
    return texW <= 160 ? ART_SCALE : 1;
  }
  return Math.max(texW, texH) <= 48 ? ART_SCALE : 1;
}

const ENEMY_BATTLE_ART = [
  { key: 'battle_constable_borden', url: new URL('../../assets/art/enemies/battle_constable_borden.png', import.meta.url).href },
  { key: 'battle_constable_borden_w1', url: new URL('../../assets/art/enemies/battle_constable_borden_w1.png', import.meta.url).href },
  { key: 'battle_constable_borden_w2', url: new URL('../../assets/art/enemies/battle_constable_borden_w2.png', import.meta.url).href },
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
  // ADR-121 — THE HUSH SENTINEL battler, 3 authored wear tiers (the Mars construct).
  { key: 'battle_hush_sentinel', url: new URL('../../assets/art/enemies/battle_hush_sentinel.png', import.meta.url).href },
  { key: 'battle_hush_sentinel_w1', url: new URL('../../assets/art/enemies/battle_hush_sentinel_w1.png', import.meta.url).href },
  { key: 'battle_hush_sentinel_w2', url: new URL('../../assets/art/enemies/battle_hush_sentinel_w2.png', import.meta.url).href },
  { key: 'battle_sprinkler_sentry', url: new URL('../../assets/art/enemies/battle_sprinkler_sentry.png', import.meta.url).href },
  { key: 'battle_sprinkler_sentry_w1', url: new URL('../../assets/art/enemies/battle_sprinkler_sentry_w1.png', import.meta.url).href },
  { key: 'battle_sprinkler_sentry_w2', url: new URL('../../assets/art/enemies/battle_sprinkler_sentry_w2.png', import.meta.url).href },
  { key: 'battle_recycling_raccoon', url: new URL('../../assets/art/enemies/battle_recycling_raccoon.png', import.meta.url).href },
  { key: 'battle_recycling_raccoon_w1', url: new URL('../../assets/art/enemies/battle_recycling_raccoon_w1.png', import.meta.url).href },
  { key: 'battle_recycling_raccoon_w2', url: new URL('../../assets/art/enemies/battle_recycling_raccoon_w2.png', import.meta.url).href },
  { key: 'battle_skeeter_swarm', url: new URL('../../assets/art/enemies/battle_skeeter_swarm.png', import.meta.url).href },
  { key: 'battle_skeeter_swarm_w1', url: new URL('../../assets/art/enemies/battle_skeeter_swarm_w1.png', import.meta.url).href },
  { key: 'battle_skeeter_swarm_w2', url: new URL('../../assets/art/enemies/battle_skeeter_swarm_w2.png', import.meta.url).href },
  { key: 'battle_unionized_gnome', url: new URL('../../assets/art/enemies/battle_unionized_gnome.png', import.meta.url).href },
  { key: 'battle_unionized_gnome_w1', url: new URL('../../assets/art/enemies/battle_unionized_gnome_w1.png', import.meta.url).href },
  { key: 'battle_unionized_gnome_w2', url: new URL('../../assets/art/enemies/battle_unionized_gnome_w2.png', import.meta.url).href },
  { key: 'battle_mandatory_memo', url: new URL('../../assets/art/enemies/battle_mandatory_memo.png', import.meta.url).href },
  { key: 'battle_mandatory_memo_w1', url: new URL('../../assets/art/enemies/battle_mandatory_memo_w1.png', import.meta.url).href },
  { key: 'battle_mandatory_memo_w2', url: new URL('../../assets/art/enemies/battle_mandatory_memo_w2.png', import.meta.url).href },
  { key: 'battle_motivational_poster', url: new URL('../../assets/art/enemies/battle_motivational_poster.png', import.meta.url).href },
  { key: 'battle_motivational_poster_w1', url: new URL('../../assets/art/enemies/battle_motivational_poster_w1.png', import.meta.url).href },
  { key: 'battle_motivational_poster_w2', url: new URL('../../assets/art/enemies/battle_motivational_poster_w2.png', import.meta.url).href },
  { key: 'battle_quota_clock', url: new URL('../../assets/art/enemies/battle_quota_clock.png', import.meta.url).href },
  { key: 'battle_quota_clock_w1', url: new URL('../../assets/art/enemies/battle_quota_clock_w1.png', import.meta.url).href },
  { key: 'battle_quota_clock_w2', url: new URL('../../assets/art/enemies/battle_quota_clock_w2.png', import.meta.url).href },
  { key: 'battle_expired_meter', url: new URL('../../assets/art/enemies/battle_expired_meter.png', import.meta.url).href },
  { key: 'battle_expired_meter_w1', url: new URL('../../assets/art/enemies/battle_expired_meter_w1.png', import.meta.url).href },
  { key: 'battle_expired_meter_w2', url: new URL('../../assets/art/enemies/battle_expired_meter_w2.png', import.meta.url).href },
  { key: 'battle_showroom_mannequin', url: new URL('../../assets/art/enemies/battle_showroom_mannequin.png', import.meta.url).href },
  { key: 'battle_showroom_mannequin_w1', url: new URL('../../assets/art/enemies/battle_showroom_mannequin_w1.png', import.meta.url).href },
  { key: 'battle_showroom_mannequin_w2', url: new URL('../../assets/art/enemies/battle_showroom_mannequin_w2.png', import.meta.url).href },
  { key: 'battle_good_investment', url: new URL('../../assets/art/enemies/battle_good_investment.png', import.meta.url).href },
  { key: 'battle_good_investment_w1', url: new URL('../../assets/art/enemies/battle_good_investment_w1.png', import.meta.url).href },
  { key: 'battle_good_investment_w2', url: new URL('../../assets/art/enemies/battle_good_investment_w2.png', import.meta.url).href },
  { key: 'battle_rogue_icecream_truck', url: new URL('../../assets/art/enemies/battle_rogue_icecream_truck.png', import.meta.url).href },
  { key: 'battle_rogue_icecream_truck_w1', url: new URL('../../assets/art/enemies/battle_rogue_icecream_truck_w1.png', import.meta.url).href },
  { key: 'battle_rogue_icecream_truck_w2', url: new URL('../../assets/art/enemies/battle_rogue_icecream_truck_w2.png', import.meta.url).href },
  { key: 'battle_tick_nymph', url: new URL('../../assets/art/enemies/battle_tick_nymph.png', import.meta.url).href },
  { key: 'battle_tick_nymph_w1', url: new URL('../../assets/art/enemies/battle_tick_nymph_w1.png', import.meta.url).href },
  { key: 'battle_tick_nymph_w2', url: new URL('../../assets/art/enemies/battle_tick_nymph_w2.png', import.meta.url).href },
  { key: 'battle_the_suit', url: new URL('../../assets/art/enemies/battle_the_suit.png', import.meta.url).href },
  { key: 'battle_the_suit_w1', url: new URL('../../assets/art/enemies/battle_the_suit_w1.png', import.meta.url).href },
  { key: 'battle_the_suit_w2', url: new URL('../../assets/art/enemies/battle_the_suit_w2.png', import.meta.url).href },
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
  // §A7 Ch.2 expansion — five adopted South-America battlers (orphaned art, now wired)
  { key: 'battle_brass_market_mimic', url: new URL('../../assets/art/enemies/battle_brass_market_mimic.png', import.meta.url).href },
  { key: 'battle_brass_market_mimic_w1', url: new URL('../../assets/art/enemies/battle_brass_market_mimic_w1.png', import.meta.url).href },
  { key: 'battle_brass_market_mimic_w2', url: new URL('../../assets/art/enemies/battle_brass_market_mimic_w2.png', import.meta.url).href },
  { key: 'battle_bronze_mask_guardian', url: new URL('../../assets/art/enemies/battle_bronze_mask_guardian.png', import.meta.url).href },
  { key: 'battle_bronze_mask_guardian_w1', url: new URL('../../assets/art/enemies/battle_bronze_mask_guardian_w1.png', import.meta.url).href },
  { key: 'battle_bronze_mask_guardian_w2', url: new URL('../../assets/art/enemies/battle_bronze_mask_guardian_w2.png', import.meta.url).href },
  { key: 'battle_cackling_mask', url: new URL('../../assets/art/enemies/battle_cackling_mask.png', import.meta.url).href },
  { key: 'battle_cackling_mask_w1', url: new URL('../../assets/art/enemies/battle_cackling_mask_w1.png', import.meta.url).href },
  { key: 'battle_cackling_mask_w2', url: new URL('../../assets/art/enemies/battle_cackling_mask_w2.png', import.meta.url).href },
  { key: 'battle_confetti_cannon', url: new URL('../../assets/art/enemies/battle_confetti_cannon.png', import.meta.url).href },
  { key: 'battle_confetti_cannon_w1', url: new URL('../../assets/art/enemies/battle_confetti_cannon_w1.png', import.meta.url).href },
  { key: 'battle_confetti_cannon_w2', url: new URL('../../assets/art/enemies/battle_confetti_cannon_w2.png', import.meta.url).href },
  { key: 'battle_postage_stampede', url: new URL('../../assets/art/enemies/battle_postage_stampede.png', import.meta.url).href },
  { key: 'battle_postage_stampede_w1', url: new URL('../../assets/art/enemies/battle_postage_stampede_w1.png', import.meta.url).href },
  { key: 'battle_postage_stampede_w2', url: new URL('../../assets/art/enemies/battle_postage_stampede_w2.png', import.meta.url).href },
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
  // §A7 Ch.4 NORWAY — the three authored Norway battlers + Boss 4 (all three wear
  // tiers on disk). The Whisperwig's SURFACED form (_exposed) is a §A6 FORM_ART key.
  { key: 'battle_thunder_snail', url: new URL('../../assets/art/enemies/battle_thunder_snail.png', import.meta.url).href },
  { key: 'battle_thunder_snail_w1', url: new URL('../../assets/art/enemies/battle_thunder_snail_w1.png', import.meta.url).href },
  { key: 'battle_thunder_snail_w2', url: new URL('../../assets/art/enemies/battle_thunder_snail_w2.png', import.meta.url).href },
  { key: 'battle_fjord_gull_bully', url: new URL('../../assets/art/enemies/battle_fjord_gull_bully.png', import.meta.url).href },
  { key: 'battle_fjord_gull_bully_w1', url: new URL('../../assets/art/enemies/battle_fjord_gull_bully_w1.png', import.meta.url).href },
  { key: 'battle_fjord_gull_bully_w2', url: new URL('../../assets/art/enemies/battle_fjord_gull_bully_w2.png', import.meta.url).href },
  { key: 'battle_giant_berry_blocker', url: new URL('../../assets/art/enemies/battle_giant_berry_blocker.png', import.meta.url).href },
  { key: 'battle_giant_berry_blocker_w1', url: new URL('../../assets/art/enemies/battle_giant_berry_blocker_w1.png', import.meta.url).href },
  { key: 'battle_giant_berry_blocker_w2', url: new URL('../../assets/art/enemies/battle_giant_berry_blocker_w2.png', import.meta.url).href },
  { key: 'battle_the_whisperwig', url: new URL('../../assets/art/enemies/battle_the_whisperwig.png', import.meta.url).href },
  { key: 'battle_the_whisperwig_w1', url: new URL('../../assets/art/enemies/battle_the_whisperwig_w1.png', import.meta.url).href },
  { key: 'battle_the_whisperwig_w2', url: new URL('../../assets/art/enemies/battle_the_whisperwig_w2.png', import.meta.url).href },
  { key: 'battle_the_whisperwig_exposed', url: new URL('../../assets/art/enemies/battle_the_whisperwig_exposed.png', import.meta.url).href },
  { key: 'battle_the_whisperwig_exposed_w1', url: new URL('../../assets/art/enemies/battle_the_whisperwig_exposed_w1.png', import.meta.url).href },
  { key: 'battle_the_whisperwig_exposed_w2', url: new URL('../../assets/art/enemies/battle_the_whisperwig_exposed_w2.png', import.meta.url).href },
  // Ch.4 Norway roamers — authored battlers (wear tiers = darkened base, matching the shipped trio practice)
  { key: 'battle_colossal_gnat', url: new URL('../../assets/art/enemies/battle_colossal_gnat.png', import.meta.url).href },
  { key: 'battle_colossal_gnat_w1', url: new URL('../../assets/art/enemies/battle_colossal_gnat_w1.png', import.meta.url).href },
  { key: 'battle_colossal_gnat_w2', url: new URL('../../assets/art/enemies/battle_colossal_gnat_w2.png', import.meta.url).href },
  { key: 'battle_frost_hare', url: new URL('../../assets/art/enemies/battle_frost_hare.png', import.meta.url).href },
  { key: 'battle_frost_hare_w1', url: new URL('../../assets/art/enemies/battle_frost_hare_w1.png', import.meta.url).href },
  { key: 'battle_frost_hare_w2', url: new URL('../../assets/art/enemies/battle_frost_hare_w2.png', import.meta.url).href },
  { key: 'battle_knitting_needles', url: new URL('../../assets/art/enemies/battle_knitting_needles.png', import.meta.url).href },
  { key: 'battle_knitting_needles_w1', url: new URL('../../assets/art/enemies/battle_knitting_needles_w1.png', import.meta.url).href },
  { key: 'battle_knitting_needles_w2', url: new URL('../../assets/art/enemies/battle_knitting_needles_w2.png', import.meta.url).href },
  { key: 'battle_junior_jotun', url: new URL('../../assets/art/enemies/battle_junior_jotun.png', import.meta.url).href },
  { key: 'battle_junior_jotun_w1', url: new URL('../../assets/art/enemies/battle_junior_jotun_w1.png', import.meta.url).href },
  { key: 'battle_junior_jotun_w2', url: new URL('../../assets/art/enemies/battle_junior_jotun_w2.png', import.meta.url).href },
  { key: 'battle_moor_midge_cloud', url: new URL('../../assets/art/enemies/battle_moor_midge_cloud.png', import.meta.url).href },
  { key: 'battle_moor_midge_cloud_w1', url: new URL('../../assets/art/enemies/battle_moor_midge_cloud_w1.png', import.meta.url).href },
  { key: 'battle_moor_midge_cloud_w2', url: new URL('../../assets/art/enemies/battle_moor_midge_cloud_w2.png', import.meta.url).href },
  { key: 'battle_boulder_lichen', url: new URL('../../assets/art/enemies/battle_boulder_lichen.png', import.meta.url).href },
  { key: 'battle_boulder_lichen_w1', url: new URL('../../assets/art/enemies/battle_boulder_lichen_w1.png', import.meta.url).href },
  { key: 'battle_boulder_lichen_w2', url: new URL('../../assets/art/enemies/battle_boulder_lichen_w2.png', import.meta.url).href },
  { key: 'battle_bog_cotton_wisp', url: new URL('../../assets/art/enemies/battle_bog_cotton_wisp.png', import.meta.url).href },
  { key: 'battle_bog_cotton_wisp_w1', url: new URL('../../assets/art/enemies/battle_bog_cotton_wisp_w1.png', import.meta.url).href },
  { key: 'battle_bog_cotton_wisp_w2', url: new URL('../../assets/art/enemies/battle_bog_cotton_wisp_w2.png', import.meta.url).href },
  { key: 'battle_earwax_golem', url: new URL('../../assets/art/enemies/battle_earwax_golem.png', import.meta.url).href },
  { key: 'battle_earwax_golem_w1', url: new URL('../../assets/art/enemies/battle_earwax_golem_w1.png', import.meta.url).href },
  { key: 'battle_earwax_golem_w2', url: new URL('../../assets/art/enemies/battle_earwax_golem_w2.png', import.meta.url).href },
  { key: 'battle_dream_leech', url: new URL('../../assets/art/enemies/battle_dream_leech.png', import.meta.url).href },
  { key: 'battle_dream_leech_w1', url: new URL('../../assets/art/enemies/battle_dream_leech_w1.png', import.meta.url).href },
  { key: 'battle_dream_leech_w2', url: new URL('../../assets/art/enemies/battle_dream_leech_w2.png', import.meta.url).href },
  { key: 'battle_snore_gust', url: new URL('../../assets/art/enemies/battle_snore_gust.png', import.meta.url).href },
  { key: 'battle_snore_gust_w1', url: new URL('../../assets/art/enemies/battle_snore_gust_w1.png', import.meta.url).href },
  { key: 'battle_snore_gust_w2', url: new URL('../../assets/art/enemies/battle_snore_gust_w2.png', import.meta.url).href },
  { key: 'battle_giant_house_cat', url: new URL('../../assets/art/enemies/battle_giant_house_cat.png', import.meta.url).href },
  { key: 'battle_giant_house_cat_w1', url: new URL('../../assets/art/enemies/battle_giant_house_cat_w1.png', import.meta.url).href },
  { key: 'battle_giant_house_cat_w2', url: new URL('../../assets/art/enemies/battle_giant_house_cat_w2.png', import.meta.url).href },
  { key: 'battle_lost_mitten', url: new URL('../../assets/art/enemies/battle_lost_mitten.png', import.meta.url).href },
  { key: 'battle_lost_mitten_w1', url: new URL('../../assets/art/enemies/battle_lost_mitten_w1.png', import.meta.url).href },
  { key: 'battle_lost_mitten_w2', url: new URL('../../assets/art/enemies/battle_lost_mitten_w2.png', import.meta.url).href },
  { key: 'battle_amber_hoard_troll', url: new URL('../../assets/art/enemies/battle_amber_hoard_troll.png', import.meta.url).href },
  { key: 'battle_amber_hoard_troll_w1', url: new URL('../../assets/art/enemies/battle_amber_hoard_troll_w1.png', import.meta.url).href },
  { key: 'battle_amber_hoard_troll_w2', url: new URL('../../assets/art/enemies/battle_amber_hoard_troll_w2.png', import.meta.url).href },
  { key: 'battle_aurora_moth', url: new URL('../../assets/art/enemies/battle_aurora_moth.png', import.meta.url).href },
  { key: 'battle_aurora_moth_w1', url: new URL('../../assets/art/enemies/battle_aurora_moth_w1.png', import.meta.url).href },
  { key: 'battle_aurora_moth_w2', url: new URL('../../assets/art/enemies/battle_aurora_moth_w2.png', import.meta.url).href },
  { key: 'battle_hushed_skua', url: new URL('../../assets/art/enemies/battle_hushed_skua.png', import.meta.url).href },
  { key: 'battle_hushed_skua_w1', url: new URL('../../assets/art/enemies/battle_hushed_skua_w1.png', import.meta.url).href },
  { key: 'battle_hushed_skua_w2', url: new URL('../../assets/art/enemies/battle_hushed_skua_w2.png', import.meta.url).href },
  { key: 'battle_frost_jotun_elder', url: new URL('../../assets/art/enemies/battle_frost_jotun_elder.png', import.meta.url).href },
  { key: 'battle_frost_jotun_elder_w1', url: new URL('../../assets/art/enemies/battle_frost_jotun_elder_w1.png', import.meta.url).href },
  { key: 'battle_frost_jotun_elder_w2', url: new URL('../../assets/art/enemies/battle_frost_jotun_elder_w2.png', import.meta.url).href },
  // §A7 Ch.5 MINIMUS — the 20-enemy roster (seed six + Flow-Law mix) + BOSS 5
  // (Whiskerzilla, bespoke ×3 wear) + the Flat Bell. Keys land NOW so the wear-gate
  // + visual-identity checks pass on the data flip; the authored PNGs (3 tiers each)
  // drop onto these exact keys at the PKG-12 art pass (docs/CH5_ART_PROMPTS.md).
  { key: 'battle_tin_parade', url: new URL('../../assets/art/enemies/battle_tin_parade.png', import.meta.url).href },
  { key: 'battle_tin_parade_w1', url: new URL('../../assets/art/enemies/battle_tin_parade_w1.png', import.meta.url).href },
  { key: 'battle_tin_parade_w2', url: new URL('../../assets/art/enemies/battle_tin_parade_w2.png', import.meta.url).href },
  { key: 'battle_duelist_pip', url: new URL('../../assets/art/enemies/battle_duelist_pip.png', import.meta.url).href },
  { key: 'battle_duelist_pip_w1', url: new URL('../../assets/art/enemies/battle_duelist_pip_w1.png', import.meta.url).href },
  { key: 'battle_duelist_pip_w2', url: new URL('../../assets/art/enemies/battle_duelist_pip_w2.png', import.meta.url).href },
  { key: 'battle_crumb_cannoneer', url: new URL('../../assets/art/enemies/battle_crumb_cannoneer.png', import.meta.url).href },
  { key: 'battle_crumb_cannoneer_w1', url: new URL('../../assets/art/enemies/battle_crumb_cannoneer_w1.png', import.meta.url).href },
  { key: 'battle_crumb_cannoneer_w2', url: new URL('../../assets/art/enemies/battle_crumb_cannoneer_w2.png', import.meta.url).href },
  { key: 'battle_powderwig_wasp', url: new URL('../../assets/art/enemies/battle_powderwig_wasp.png', import.meta.url).href },
  { key: 'battle_powderwig_wasp_w1', url: new URL('../../assets/art/enemies/battle_powderwig_wasp_w1.png', import.meta.url).href },
  { key: 'battle_powderwig_wasp_w2', url: new URL('../../assets/art/enemies/battle_powderwig_wasp_w2.png', import.meta.url).href },
  { key: 'battle_windup_wyrmlet', url: new URL('../../assets/art/enemies/battle_windup_wyrmlet.png', import.meta.url).href },
  { key: 'battle_windup_wyrmlet_w1', url: new URL('../../assets/art/enemies/battle_windup_wyrmlet_w1.png', import.meta.url).href },
  { key: 'battle_windup_wyrmlet_w2', url: new URL('../../assets/art/enemies/battle_windup_wyrmlet_w2.png', import.meta.url).href },
  { key: 'battle_dust_bunny', url: new URL('../../assets/art/enemies/battle_dust_bunny.png', import.meta.url).href },
  { key: 'battle_dust_bunny_w1', url: new URL('../../assets/art/enemies/battle_dust_bunny_w1.png', import.meta.url).href },
  { key: 'battle_dust_bunny_w2', url: new URL('../../assets/art/enemies/battle_dust_bunny_w2.png', import.meta.url).href },
  { key: 'battle_whistle_guard', url: new URL('../../assets/art/enemies/battle_whistle_guard.png', import.meta.url).href },
  { key: 'battle_whistle_guard_w1', url: new URL('../../assets/art/enemies/battle_whistle_guard_w1.png', import.meta.url).href },
  { key: 'battle_whistle_guard_w2', url: new URL('../../assets/art/enemies/battle_whistle_guard_w2.png', import.meta.url).href },
  { key: 'battle_census_pigeon', url: new URL('../../assets/art/enemies/battle_census_pigeon.png', import.meta.url).href },
  { key: 'battle_census_pigeon_w1', url: new URL('../../assets/art/enemies/battle_census_pigeon_w1.png', import.meta.url).href },
  { key: 'battle_census_pigeon_w2', url: new URL('../../assets/art/enemies/battle_census_pigeon_w2.png', import.meta.url).href },
  { key: 'battle_toll_clerk', url: new URL('../../assets/art/enemies/battle_toll_clerk.png', import.meta.url).href },
  { key: 'battle_toll_clerk_w1', url: new URL('../../assets/art/enemies/battle_toll_clerk_w1.png', import.meta.url).href },
  { key: 'battle_toll_clerk_w2', url: new URL('../../assets/art/enemies/battle_toll_clerk_w2.png', import.meta.url).href },
  { key: 'battle_cobble_mite', url: new URL('../../assets/art/enemies/battle_cobble_mite.png', import.meta.url).href },
  { key: 'battle_cobble_mite_w1', url: new URL('../../assets/art/enemies/battle_cobble_mite_w1.png', import.meta.url).href },
  { key: 'battle_cobble_mite_w2', url: new URL('../../assets/art/enemies/battle_cobble_mite_w2.png', import.meta.url).href },
  { key: 'battle_hedge_sprite', url: new URL('../../assets/art/enemies/battle_hedge_sprite.png', import.meta.url).href },
  { key: 'battle_hedge_sprite_w1', url: new URL('../../assets/art/enemies/battle_hedge_sprite_w1.png', import.meta.url).href },
  { key: 'battle_hedge_sprite_w2', url: new URL('../../assets/art/enemies/battle_hedge_sprite_w2.png', import.meta.url).href },
  { key: 'battle_topiary_knight', url: new URL('../../assets/art/enemies/battle_topiary_knight.png', import.meta.url).href },
  { key: 'battle_topiary_knight_w1', url: new URL('../../assets/art/enemies/battle_topiary_knight_w1.png', import.meta.url).href },
  { key: 'battle_topiary_knight_w2', url: new URL('../../assets/art/enemies/battle_topiary_knight_w2.png', import.meta.url).href },
  { key: 'battle_bramble_tangle', url: new URL('../../assets/art/enemies/battle_bramble_tangle.png', import.meta.url).href },
  { key: 'battle_bramble_tangle_w1', url: new URL('../../assets/art/enemies/battle_bramble_tangle_w1.png', import.meta.url).href },
  { key: 'battle_bramble_tangle_w2', url: new URL('../../assets/art/enemies/battle_bramble_tangle_w2.png', import.meta.url).href },
  { key: 'battle_lapel_pin_mob', url: new URL('../../assets/art/enemies/battle_lapel_pin_mob.png', import.meta.url).href },
  { key: 'battle_lapel_pin_mob_w1', url: new URL('../../assets/art/enemies/battle_lapel_pin_mob_w1.png', import.meta.url).href },
  { key: 'battle_lapel_pin_mob_w2', url: new URL('../../assets/art/enemies/battle_lapel_pin_mob_w2.png', import.meta.url).href },
  { key: 'battle_town_crier', url: new URL('../../assets/art/enemies/battle_town_crier.png', import.meta.url).href },
  { key: 'battle_town_crier_w1', url: new URL('../../assets/art/enemies/battle_town_crier_w1.png', import.meta.url).href },
  { key: 'battle_town_crier_w2', url: new URL('../../assets/art/enemies/battle_town_crier_w2.png', import.meta.url).href },
  { key: 'battle_snuffbox_beetle', url: new URL('../../assets/art/enemies/battle_snuffbox_beetle.png', import.meta.url).href },
  { key: 'battle_snuffbox_beetle_w1', url: new URL('../../assets/art/enemies/battle_snuffbox_beetle_w1.png', import.meta.url).href },
  { key: 'battle_snuffbox_beetle_w2', url: new URL('../../assets/art/enemies/battle_snuffbox_beetle_w2.png', import.meta.url).href },
  { key: 'battle_tax_assessor', url: new URL('../../assets/art/enemies/battle_tax_assessor.png', import.meta.url).href },
  { key: 'battle_tax_assessor_w1', url: new URL('../../assets/art/enemies/battle_tax_assessor_w1.png', import.meta.url).href },
  { key: 'battle_tax_assessor_w2', url: new URL('../../assets/art/enemies/battle_tax_assessor_w2.png', import.meta.url).href },
  { key: 'battle_halberd_column', url: new URL('../../assets/art/enemies/battle_halberd_column.png', import.meta.url).href },
  { key: 'battle_halberd_column_w1', url: new URL('../../assets/art/enemies/battle_halberd_column_w1.png', import.meta.url).href },
  { key: 'battle_halberd_column_w2', url: new URL('../../assets/art/enemies/battle_halberd_column_w2.png', import.meta.url).href },
  { key: 'battle_bell_ringer_acolyte', url: new URL('../../assets/art/enemies/battle_bell_ringer_acolyte.png', import.meta.url).href },
  { key: 'battle_bell_ringer_acolyte_w1', url: new URL('../../assets/art/enemies/battle_bell_ringer_acolyte_w1.png', import.meta.url).href },
  { key: 'battle_bell_ringer_acolyte_w2', url: new URL('../../assets/art/enemies/battle_bell_ringer_acolyte_w2.png', import.meta.url).href },
  { key: 'battle_grand_parade', url: new URL('../../assets/art/enemies/battle_grand_parade.png', import.meta.url).href },
  { key: 'battle_grand_parade_w1', url: new URL('../../assets/art/enemies/battle_grand_parade_w1.png', import.meta.url).href },
  { key: 'battle_grand_parade_w2', url: new URL('../../assets/art/enemies/battle_grand_parade_w2.png', import.meta.url).href },
  { key: 'battle_whiskerzilla', url: new URL('../../assets/art/enemies/battle_whiskerzilla.png', import.meta.url).href },
  { key: 'battle_whiskerzilla_w1', url: new URL('../../assets/art/enemies/battle_whiskerzilla_w1.png', import.meta.url).href },
  { key: 'battle_whiskerzilla_w2', url: new URL('../../assets/art/enemies/battle_whiskerzilla_w2.png', import.meta.url).href },
  { key: 'battle_flat_bell', url: new URL('../../assets/art/enemies/battle_flat_bell.png', import.meta.url).href },
  { key: 'battle_flat_bell_w1', url: new URL('../../assets/art/enemies/battle_flat_bell_w1.png', import.meta.url).href },
  { key: 'battle_flat_bell_w2', url: new URL('../../assets/art/enemies/battle_flat_bell_w2.png', import.meta.url).href },
  // Chapter 6 (Africa) — the §A7 Ch.6 battlers (3 HP-wear tiers each, authored PNGs)
  { key: 'battle_caravan_hyena_pack', url: new URL('../../assets/art/enemies/battle_caravan_hyena_pack.png', import.meta.url).href },
  { key: 'battle_caravan_hyena_pack_w1', url: new URL('../../assets/art/enemies/battle_caravan_hyena_pack_w1.png', import.meta.url).href },
  { key: 'battle_caravan_hyena_pack_w2', url: new URL('../../assets/art/enemies/battle_caravan_hyena_pack_w2.png', import.meta.url).href },
  { key: 'battle_baobab_root_snare', url: new URL('../../assets/art/enemies/battle_baobab_root_snare.png', import.meta.url).href },
  { key: 'battle_baobab_root_snare_w1', url: new URL('../../assets/art/enemies/battle_baobab_root_snare_w1.png', import.meta.url).href },
  { key: 'battle_baobab_root_snare_w2', url: new URL('../../assets/art/enemies/battle_baobab_root_snare_w2.png', import.meta.url).href },
  { key: 'battle_laughing_dust_pot', url: new URL('../../assets/art/enemies/battle_laughing_dust_pot.png', import.meta.url).href },
  { key: 'battle_laughing_dust_pot_w1', url: new URL('../../assets/art/enemies/battle_laughing_dust_pot_w1.png', import.meta.url).href },
  { key: 'battle_laughing_dust_pot_w2', url: new URL('../../assets/art/enemies/battle_laughing_dust_pot_w2.png', import.meta.url).href },
  { key: 'battle_sphinx_paw_shadow', url: new URL('../../assets/art/enemies/battle_sphinx_paw_shadow.png', import.meta.url).href },
  { key: 'battle_sphinx_paw_shadow_w1', url: new URL('../../assets/art/enemies/battle_sphinx_paw_shadow_w1.png', import.meta.url).href },
  { key: 'battle_sphinx_paw_shadow_w2', url: new URL('../../assets/art/enemies/battle_sphinx_paw_shadow_w2.png', import.meta.url).href },
  { key: 'battle_laughing_sphinx', url: new URL('../../assets/art/enemies/battle_laughing_sphinx.png', import.meta.url).href },
  { key: 'battle_laughing_sphinx_w1', url: new URL('../../assets/art/enemies/battle_laughing_sphinx_w1.png', import.meta.url).href },
  { key: 'battle_laughing_sphinx_w2', url: new URL('../../assets/art/enemies/battle_laughing_sphinx_w2.png', import.meta.url).href },
  // Chapter 7 (India) — placeholder clones until the India art pass overwrites the files
  { key: 'battle_rickshaw_swarm', url: new URL('../../assets/art/enemies/battle_rickshaw_swarm.png', import.meta.url).href },
  { key: 'battle_rickshaw_swarm_w1', url: new URL('../../assets/art/enemies/battle_rickshaw_swarm_w1.png', import.meta.url).href },
  { key: 'battle_rickshaw_swarm_w2', url: new URL('../../assets/art/enemies/battle_rickshaw_swarm_w2.png', import.meta.url).href },
  { key: 'battle_spice_djinn', url: new URL('../../assets/art/enemies/battle_spice_djinn.png', import.meta.url).href },
  { key: 'battle_spice_djinn_w1', url: new URL('../../assets/art/enemies/battle_spice_djinn_w1.png', import.meta.url).href },
  { key: 'battle_spice_djinn_w2', url: new URL('../../assets/art/enemies/battle_spice_djinn_w2.png', import.meta.url).href },
  { key: 'battle_temple_macaque', url: new URL('../../assets/art/enemies/battle_temple_macaque.png', import.meta.url).href },
  { key: 'battle_temple_macaque_w1', url: new URL('../../assets/art/enemies/battle_temple_macaque_w1.png', import.meta.url).href },
  { key: 'battle_temple_macaque_w2', url: new URL('../../assets/art/enemies/battle_temple_macaque_w2.png', import.meta.url).href },
  { key: 'battle_naga_sentry', url: new URL('../../assets/art/enemies/battle_naga_sentry.png', import.meta.url).href },
  { key: 'battle_naga_sentry_w1', url: new URL('../../assets/art/enemies/battle_naga_sentry_w1.png', import.meta.url).href },
  { key: 'battle_naga_sentry_w2', url: new URL('../../assets/art/enemies/battle_naga_sentry_w2.png', import.meta.url).href },
  { key: 'battle_cobra_raja', url: new URL('../../assets/art/enemies/battle_cobra_raja.png', import.meta.url).href },
  { key: 'battle_cobra_raja_w1', url: new URL('../../assets/art/enemies/battle_cobra_raja_w1.png', import.meta.url).href },
  { key: 'battle_cobra_raja_w2', url: new URL('../../assets/art/enemies/battle_cobra_raja_w2.png', import.meta.url).href },
  // §A7 Ch.6 expansion to twenty — the 16 adopted Africa battlers (3 wear tiers each)
  { key: 'battle_hollow_jackal', url: new URL('../../assets/art/enemies/battle_hollow_jackal.png', import.meta.url).href },
  { key: 'battle_hollow_jackal_w1', url: new URL('../../assets/art/enemies/battle_hollow_jackal_w1.png', import.meta.url).href },
  { key: 'battle_hollow_jackal_w2', url: new URL('../../assets/art/enemies/battle_hollow_jackal_w2.png', import.meta.url).href },
  { key: 'battle_dust_devil_charm', url: new URL('../../assets/art/enemies/battle_dust_devil_charm.png', import.meta.url).href },
  { key: 'battle_dust_devil_charm_w1', url: new URL('../../assets/art/enemies/battle_dust_devil_charm_w1.png', import.meta.url).href },
  { key: 'battle_dust_devil_charm_w2', url: new URL('../../assets/art/enemies/battle_dust_devil_charm_w2.png', import.meta.url).href },
  { key: 'battle_salt_flat_lurker', url: new URL('../../assets/art/enemies/battle_salt_flat_lurker.png', import.meta.url).href },
  { key: 'battle_salt_flat_lurker_w1', url: new URL('../../assets/art/enemies/battle_salt_flat_lurker_w1.png', import.meta.url).href },
  { key: 'battle_salt_flat_lurker_w2', url: new URL('../../assets/art/enemies/battle_salt_flat_lurker_w2.png', import.meta.url).href },
  { key: 'battle_thornbush_bomber', url: new URL('../../assets/art/enemies/battle_thornbush_bomber.png', import.meta.url).href },
  { key: 'battle_thornbush_bomber_w1', url: new URL('../../assets/art/enemies/battle_thornbush_bomber_w1.png', import.meta.url).href },
  { key: 'battle_thornbush_bomber_w2', url: new URL('../../assets/art/enemies/battle_thornbush_bomber_w2.png', import.meta.url).href },
  { key: 'battle_ribbon_serpent', url: new URL('../../assets/art/enemies/battle_ribbon_serpent.png', import.meta.url).href },
  { key: 'battle_ribbon_serpent_w1', url: new URL('../../assets/art/enemies/battle_ribbon_serpent_w1.png', import.meta.url).href },
  { key: 'battle_ribbon_serpent_w2', url: new URL('../../assets/art/enemies/battle_ribbon_serpent_w2.png', import.meta.url).href },
  { key: 'battle_canteen_mirage', url: new URL('../../assets/art/enemies/battle_canteen_mirage.png', import.meta.url).href },
  { key: 'battle_canteen_mirage_w1', url: new URL('../../assets/art/enemies/battle_canteen_mirage_w1.png', import.meta.url).href },
  { key: 'battle_canteen_mirage_w2', url: new URL('../../assets/art/enemies/battle_canteen_mirage_w2.png', import.meta.url).href },
  { key: 'battle_trade_salt_heap', url: new URL('../../assets/art/enemies/battle_trade_salt_heap.png', import.meta.url).href },
  { key: 'battle_trade_salt_heap_w1', url: new URL('../../assets/art/enemies/battle_trade_salt_heap_w1.png', import.meta.url).href },
  { key: 'battle_trade_salt_heap_w2', url: new URL('../../assets/art/enemies/battle_trade_salt_heap_w2.png', import.meta.url).href },
  { key: 'battle_mirage_vendor', url: new URL('../../assets/art/enemies/battle_mirage_vendor.png', import.meta.url).href },
  { key: 'battle_mirage_vendor_w1', url: new URL('../../assets/art/enemies/battle_mirage_vendor_w1.png', import.meta.url).href },
  { key: 'battle_mirage_vendor_w2', url: new URL('../../assets/art/enemies/battle_mirage_vendor_w2.png', import.meta.url).href },
  { key: 'battle_griot_string_snare', url: new URL('../../assets/art/enemies/battle_griot_string_snare.png', import.meta.url).href },
  { key: 'battle_griot_string_snare_w1', url: new URL('../../assets/art/enemies/battle_griot_string_snare_w1.png', import.meta.url).href },
  { key: 'battle_griot_string_snare_w2', url: new URL('../../assets/art/enemies/battle_griot_string_snare_w2.png', import.meta.url).href },
  { key: 'battle_town_gossip_troll', url: new URL('../../assets/art/enemies/battle_town_gossip_troll.png', import.meta.url).href },
  { key: 'battle_town_gossip_troll_w1', url: new URL('../../assets/art/enemies/battle_town_gossip_troll_w1.png', import.meta.url).href },
  { key: 'battle_town_gossip_troll_w2', url: new URL('../../assets/art/enemies/battle_town_gossip_troll_w2.png', import.meta.url).href },
  { key: 'battle_punchline_head', url: new URL('../../assets/art/enemies/battle_punchline_head.png', import.meta.url).href },
  { key: 'battle_punchline_head_w1', url: new URL('../../assets/art/enemies/battle_punchline_head_w1.png', import.meta.url).href },
  { key: 'battle_punchline_head_w2', url: new URL('../../assets/art/enemies/battle_punchline_head_w2.png', import.meta.url).href },
  { key: 'battle_echoing_riddle', url: new URL('../../assets/art/enemies/battle_echoing_riddle.png', import.meta.url).href },
  { key: 'battle_echoing_riddle_w1', url: new URL('../../assets/art/enemies/battle_echoing_riddle_w1.png', import.meta.url).href },
  { key: 'battle_echoing_riddle_w2', url: new URL('../../assets/art/enemies/battle_echoing_riddle_w2.png', import.meta.url).href },
  { key: 'battle_laughing_sphinx_riddle', url: new URL('../../assets/art/enemies/battle_laughing_sphinx_riddle.png', import.meta.url).href },
  { key: 'battle_laughing_sphinx_riddle_w1', url: new URL('../../assets/art/enemies/battle_laughing_sphinx_riddle_w1.png', import.meta.url).href },
  { key: 'battle_laughing_sphinx_riddle_w2', url: new URL('../../assets/art/enemies/battle_laughing_sphinx_riddle_w2.png', import.meta.url).href },
  { key: 'battle_rare_riddle_ring', url: new URL('../../assets/art/enemies/battle_rare_riddle_ring.png', import.meta.url).href },
  { key: 'battle_rare_riddle_ring_w1', url: new URL('../../assets/art/enemies/battle_rare_riddle_ring_w1.png', import.meta.url).href },
  { key: 'battle_rare_riddle_ring_w2', url: new URL('../../assets/art/enemies/battle_rare_riddle_ring_w2.png', import.meta.url).href },
  { key: 'battle_sunbaked_idol', url: new URL('../../assets/art/enemies/battle_sunbaked_idol.png', import.meta.url).href },
  { key: 'battle_sunbaked_idol_w1', url: new URL('../../assets/art/enemies/battle_sunbaked_idol_w1.png', import.meta.url).href },
  { key: 'battle_sunbaked_idol_w2', url: new URL('../../assets/art/enemies/battle_sunbaked_idol_w2.png', import.meta.url).href },
  { key: 'battle_fastest_man_echo', url: new URL('../../assets/art/enemies/battle_fastest_man_echo.png', import.meta.url).href },
  { key: 'battle_fastest_man_echo_w1', url: new URL('../../assets/art/enemies/battle_fastest_man_echo_w1.png', import.meta.url).href },
  { key: 'battle_fastest_man_echo_w2', url: new URL('../../assets/art/enemies/battle_fastest_man_echo_w2.png', import.meta.url).href },
  // Ch.8 (China) — the §A7 roster + BOSS 8 (3 wear tiers each; dev-art placeholder
  // clones until the PKG-15 China art pass overwrites the PNGs in place)
  { key: 'battle_paper_lantern_wisp', url: new URL('../../assets/art/enemies/battle_paper_lantern_wisp.png', import.meta.url).href },
  { key: 'battle_paper_lantern_wisp_w1', url: new URL('../../assets/art/enemies/battle_paper_lantern_wisp_w1.png', import.meta.url).href },
  { key: 'battle_paper_lantern_wisp_w2', url: new URL('../../assets/art/enemies/battle_paper_lantern_wisp_w2.png', import.meta.url).href },
  { key: 'battle_spore_puffer', url: new URL('../../assets/art/enemies/battle_spore_puffer.png', import.meta.url).href },
  { key: 'battle_spore_puffer_w1', url: new URL('../../assets/art/enemies/battle_spore_puffer_w1.png', import.meta.url).href },
  { key: 'battle_spore_puffer_w2', url: new URL('../../assets/art/enemies/battle_spore_puffer_w2.png', import.meta.url).href },
  { key: 'battle_origami_warrior', url: new URL('../../assets/art/enemies/battle_origami_warrior.png', import.meta.url).href },
  { key: 'battle_origami_warrior_w1', url: new URL('../../assets/art/enemies/battle_origami_warrior_w1.png', import.meta.url).href },
  { key: 'battle_origami_warrior_w2', url: new URL('../../assets/art/enemies/battle_origami_warrior_w2.png', import.meta.url).href },
  { key: 'battle_porcelain_warlord', url: new URL('../../assets/art/enemies/battle_porcelain_warlord.png', import.meta.url).href },
  { key: 'battle_porcelain_warlord_w1', url: new URL('../../assets/art/enemies/battle_porcelain_warlord_w1.png', import.meta.url).href },
  { key: 'battle_porcelain_warlord_w2', url: new URL('../../assets/art/enemies/battle_porcelain_warlord_w2.png', import.meta.url).href },
  { key: 'battle_paper_dragon', url: new URL('../../assets/art/enemies/battle_paper_dragon.png', import.meta.url).href },
  { key: 'battle_paper_dragon_w1', url: new URL('../../assets/art/enemies/battle_paper_dragon_w1.png', import.meta.url).href },
  { key: 'battle_paper_dragon_w2', url: new URL('../../assets/art/enemies/battle_paper_dragon_w2.png', import.meta.url).href },
  // BOSS 8 BURNING form (spriteSuffix '_burning') — its own full wear-tier family
  { key: 'battle_paper_dragon_burning', url: new URL('../../assets/art/enemies/battle_paper_dragon_burning.png', import.meta.url).href },
  { key: 'battle_paper_dragon_burning_w1', url: new URL('../../assets/art/enemies/battle_paper_dragon_burning_w1.png', import.meta.url).href },
  { key: 'battle_paper_dragon_burning_w2', url: new URL('../../assets/art/enemies/battle_paper_dragon_burning_w2.png', import.meta.url).href },
  // CHAPTER 9 (Romania) — the four fresh regulars (placeholder clones until the art pass),
  // the ADOPTED ribcage_rattler (its own authored battler, the reserve bank), and BOSS 9.
  { key: 'battle_haystack_mimic', url: new URL('../../assets/art/enemies/battle_haystack_mimic.png', import.meta.url).href },
  { key: 'battle_haystack_mimic_w1', url: new URL('../../assets/art/enemies/battle_haystack_mimic_w1.png', import.meta.url).href },
  { key: 'battle_haystack_mimic_w2', url: new URL('../../assets/art/enemies/battle_haystack_mimic_w2.png', import.meta.url).href },
  { key: 'battle_ribcage_rattler', url: new URL('../../assets/art/enemies/battle_ribcage_rattler.png', import.meta.url).href },
  { key: 'battle_ribcage_rattler_w1', url: new URL('../../assets/art/enemies/battle_ribcage_rattler_w1.png', import.meta.url).href },
  { key: 'battle_ribcage_rattler_w2', url: new URL('../../assets/art/enemies/battle_ribcage_rattler_w2.png', import.meta.url).href },
  { key: 'battle_moss_strigoi', url: new URL('../../assets/art/enemies/battle_moss_strigoi.png', import.meta.url).href },
  { key: 'battle_moss_strigoi_w1', url: new URL('../../assets/art/enemies/battle_moss_strigoi_w1.png', import.meta.url).href },
  { key: 'battle_moss_strigoi_w2', url: new URL('../../assets/art/enemies/battle_moss_strigoi_w2.png', import.meta.url).href },
  { key: 'battle_animated_armor', url: new URL('../../assets/art/enemies/battle_animated_armor.png', import.meta.url).href },
  { key: 'battle_animated_armor_w1', url: new URL('../../assets/art/enemies/battle_animated_armor_w1.png', import.meta.url).href },
  { key: 'battle_animated_armor_w2', url: new URL('../../assets/art/enemies/battle_animated_armor_w2.png', import.meta.url).href },
  { key: 'battle_wolf_of_the_old_road', url: new URL('../../assets/art/enemies/battle_wolf_of_the_old_road.png', import.meta.url).href },
  { key: 'battle_wolf_of_the_old_road_w1', url: new URL('../../assets/art/enemies/battle_wolf_of_the_old_road_w1.png', import.meta.url).href },
  { key: 'battle_wolf_of_the_old_road_w2', url: new URL('../../assets/art/enemies/battle_wolf_of_the_old_road_w2.png', import.meta.url).href },
  { key: 'battle_count_hoaxula', url: new URL('../../assets/art/enemies/battle_count_hoaxula.png', import.meta.url).href },
  { key: 'battle_count_hoaxula_w1', url: new URL('../../assets/art/enemies/battle_count_hoaxula_w1.png', import.meta.url).href },
  { key: 'battle_count_hoaxula_w2', url: new URL('../../assets/art/enemies/battle_count_hoaxula_w2.png', import.meta.url).href },
  // BOSS 9 UNMASKED form (spriteSuffix '_unmasked') — its own full wear-tier family
  { key: 'battle_count_hoaxula_unmasked', url: new URL('../../assets/art/enemies/battle_count_hoaxula_unmasked.png', import.meta.url).href },
  { key: 'battle_count_hoaxula_unmasked_w1', url: new URL('../../assets/art/enemies/battle_count_hoaxula_unmasked_w1.png', import.meta.url).href },
  { key: 'battle_count_hoaxula_unmasked_w2', url: new URL('../../assets/art/enemies/battle_count_hoaxula_unmasked_w2.png', import.meta.url).href },
  // §A7 Ch.10 THE LONG SHOT (Alaska / Hawaii / Mars) — 6 regulars + 2 elemental
  // minibosses + the finale boss THE HUSH, each an authored magenta-keyed battler
  // with the ×0.88/×0.76 wear trio. (Replaces the Ch.10 placeholder-reuse pass.)
  { key: 'battle_frost_wisp', url: new URL('../../assets/art/enemies/battle_frost_wisp.png', import.meta.url).href },
  { key: 'battle_frost_wisp_w1', url: new URL('../../assets/art/enemies/battle_frost_wisp_w1.png', import.meta.url).href },
  { key: 'battle_frost_wisp_w2', url: new URL('../../assets/art/enemies/battle_frost_wisp_w2.png', import.meta.url).href },
  { key: 'battle_icehorn_caribou', url: new URL('../../assets/art/enemies/battle_icehorn_caribou.png', import.meta.url).href },
  { key: 'battle_icehorn_caribou_w1', url: new URL('../../assets/art/enemies/battle_icehorn_caribou_w1.png', import.meta.url).href },
  { key: 'battle_icehorn_caribou_w2', url: new URL('../../assets/art/enemies/battle_icehorn_caribou_w2.png', import.meta.url).href },
  { key: 'battle_cinder_imp', url: new URL('../../assets/art/enemies/battle_cinder_imp.png', import.meta.url).href },
  { key: 'battle_cinder_imp_w1', url: new URL('../../assets/art/enemies/battle_cinder_imp_w1.png', import.meta.url).href },
  { key: 'battle_cinder_imp_w2', url: new URL('../../assets/art/enemies/battle_cinder_imp_w2.png', import.meta.url).href },
  { key: 'battle_ash_crab', url: new URL('../../assets/art/enemies/battle_ash_crab.png', import.meta.url).href },
  { key: 'battle_ash_crab_w1', url: new URL('../../assets/art/enemies/battle_ash_crab_w1.png', import.meta.url).href },
  { key: 'battle_ash_crab_w2', url: new URL('../../assets/art/enemies/battle_ash_crab_w2.png', import.meta.url).href },
  { key: 'battle_silent_drifter', url: new URL('../../assets/art/enemies/battle_silent_drifter.png', import.meta.url).href },
  { key: 'battle_silent_drifter_w1', url: new URL('../../assets/art/enemies/battle_silent_drifter_w1.png', import.meta.url).href },
  { key: 'battle_silent_drifter_w2', url: new URL('../../assets/art/enemies/battle_silent_drifter_w2.png', import.meta.url).href },
  { key: 'battle_static_wraith', url: new URL('../../assets/art/enemies/battle_static_wraith.png', import.meta.url).href },
  { key: 'battle_static_wraith_w1', url: new URL('../../assets/art/enemies/battle_static_wraith_w1.png', import.meta.url).href },
  { key: 'battle_static_wraith_w2', url: new URL('../../assets/art/enemies/battle_static_wraith_w2.png', import.meta.url).href },
  { key: 'battle_frost_sentinel', url: new URL('../../assets/art/enemies/battle_frost_sentinel.png', import.meta.url).href },
  { key: 'battle_frost_sentinel_w1', url: new URL('../../assets/art/enemies/battle_frost_sentinel_w1.png', import.meta.url).href },
  { key: 'battle_frost_sentinel_w2', url: new URL('../../assets/art/enemies/battle_frost_sentinel_w2.png', import.meta.url).href },
  { key: 'battle_tiki_magma_golem', url: new URL('../../assets/art/enemies/battle_tiki_magma_golem.png', import.meta.url).href },
  { key: 'battle_tiki_magma_golem_w1', url: new URL('../../assets/art/enemies/battle_tiki_magma_golem_w1.png', import.meta.url).href },
  { key: 'battle_tiki_magma_golem_w2', url: new URL('../../assets/art/enemies/battle_tiki_magma_golem_w2.png', import.meta.url).href },
  { key: 'battle_the_hush', url: new URL('../../assets/art/enemies/battle_the_hush.png', import.meta.url).href },
  { key: 'battle_the_hush_w1', url: new URL('../../assets/art/enemies/battle_the_hush_w1.png', import.meta.url).href },
  { key: 'battle_the_hush_w2', url: new URL('../../assets/art/enemies/battle_the_hush_w2.png', import.meta.url).href },
] as const;

const ENEMY_OVERWORLD_ART = [
  'banana_bunch',
  'blazer_smiler',
  'boiler_golem',
  'borden',
  'brolly_bat',
  'coily_cicada',
  'cranky_mailbox',
  'cricket_eleven',
  'cursed_souvenir',
  'detention_desk',
  'fog_hound',
  'foggy_locker',
  'gilded_beetle',
  'greenhouse_creeper',
  'head_prefect',
  'hill_slug_deluxe',
  'jungle_jitterbug',
  'moor_sheep',
  'overdue_tome',
  'pickpocket_parrot',
  'pigeon_gang',
  'pillar_box',
  'possessed_textbook',
  'prefect_drone',
  'roman_sentry',
  'runaway_lawnmower',
  'schedule_bell',
  'soot_imp',
  'step_mask',
  'tea_poltergeist',
  'tea_trolley',
  'telephone_box',
  'the_invigilator',
  // overworld-art pass: authored 8-dir sheets replacing borrowed procedural minis
  'recycling_raccoon',
  'sprinkler_sentry',
  'unionized_gnome',
  'mandatory_memo',
  'motivational_poster',
  // final roamers: authored 8-dir sheets replacing the last pixelated procedural minis
  'quota_clock',
  'showroom_mannequin',
  'good_investment',
  'rogue_icecream_truck',
  'tick_nymph',
  'the_suit',
  'expired_meter',
].map((id) => ({
  id,
  key: `ow_enemy_${id}`,
  authoredKey: `authored_ow_enemy_${id}`,
  url: new URL(`../../assets/art/enemies/overworld/${id}_8dir.png`, import.meta.url).href,
}));

// single-frame OVERWORLD minis (the little roaming sprite an enemy shows on the
// map — EnemyDef.mini). Authored one-offs for enemies whose procedural mini is a
// mismatch; loaded + applied exactly like a battler (one image, bare key).
const ENEMY_MINI_ART = [
  { key: 'mini_skeeter_swarm', url: new URL('../../assets/art/enemies/mini_skeeter_swarm.png', import.meta.url).href },
  { key: 'mini_pigeon_gang', url: new URL('../../assets/art/enemies/mini_pigeon_gang.png', import.meta.url).href },
  // Ch.4 Norway roamers — authored overworld minis (flat-magenta gen → slice-enemy-mini)
  { key: 'mini_colossal_gnat', url: new URL('../../assets/art/enemies/mini_colossal_gnat.png', import.meta.url).href },
  { key: 'mini_frost_hare', url: new URL('../../assets/art/enemies/mini_frost_hare.png', import.meta.url).href },
  { key: 'mini_knitting_needles', url: new URL('../../assets/art/enemies/mini_knitting_needles.png', import.meta.url).href },
  { key: 'mini_junior_jotun', url: new URL('../../assets/art/enemies/mini_junior_jotun.png', import.meta.url).href },
  { key: 'mini_moor_midge_cloud', url: new URL('../../assets/art/enemies/mini_moor_midge_cloud.png', import.meta.url).href },
  { key: 'mini_boulder_lichen', url: new URL('../../assets/art/enemies/mini_boulder_lichen.png', import.meta.url).href },
  { key: 'mini_bog_cotton_wisp', url: new URL('../../assets/art/enemies/mini_bog_cotton_wisp.png', import.meta.url).href },
  { key: 'mini_earwax_golem', url: new URL('../../assets/art/enemies/mini_earwax_golem.png', import.meta.url).href },
  { key: 'mini_dream_leech', url: new URL('../../assets/art/enemies/mini_dream_leech.png', import.meta.url).href },
  { key: 'mini_snore_gust', url: new URL('../../assets/art/enemies/mini_snore_gust.png', import.meta.url).href },
  { key: 'mini_giant_house_cat', url: new URL('../../assets/art/enemies/mini_giant_house_cat.png', import.meta.url).href },
  { key: 'mini_lost_mitten', url: new URL('../../assets/art/enemies/mini_lost_mitten.png', import.meta.url).href },
  { key: 'mini_amber_hoard_troll', url: new URL('../../assets/art/enemies/mini_amber_hoard_troll.png', import.meta.url).href },
  { key: 'mini_aurora_moth', url: new URL('../../assets/art/enemies/mini_aurora_moth.png', import.meta.url).href },
  { key: 'mini_hushed_skua', url: new URL('../../assets/art/enemies/mini_hushed_skua.png', import.meta.url).href },
  { key: 'mini_frost_jotun_elder', url: new URL('../../assets/art/enemies/mini_frost_jotun_elder.png', import.meta.url).href },
  // hushed_gull's own roamer — DERIVED from its battler (was borrowing mini_pigeon_gang, the Ch.1 flock)
  { key: 'mini_fjord_gull_bully', url: new URL('../../assets/art/enemies/mini_fjord_gull_bully.png', import.meta.url).href },
  // Ch.5 Minimus §A7 roamers — DERIVED from the authored hi-res battlers (tools/derive-ch5-minis.ts)
  // so the overworld sprite IS the enemies-section art, not the old borrowed procedural minis.
  { key: 'mini_tin_parade', url: new URL('../../assets/art/enemies/mini_tin_parade.png', import.meta.url).href },
  { key: 'mini_duelist_pip', url: new URL('../../assets/art/enemies/mini_duelist_pip.png', import.meta.url).href },
  { key: 'mini_crumb_cannoneer', url: new URL('../../assets/art/enemies/mini_crumb_cannoneer.png', import.meta.url).href },
  { key: 'mini_powderwig_wasp', url: new URL('../../assets/art/enemies/mini_powderwig_wasp.png', import.meta.url).href },
  { key: 'mini_windup_wyrmlet', url: new URL('../../assets/art/enemies/mini_windup_wyrmlet.png', import.meta.url).href },
  { key: 'mini_dust_bunny', url: new URL('../../assets/art/enemies/mini_dust_bunny.png', import.meta.url).href },
  { key: 'mini_whistle_guard', url: new URL('../../assets/art/enemies/mini_whistle_guard.png', import.meta.url).href },
  { key: 'mini_census_pigeon', url: new URL('../../assets/art/enemies/mini_census_pigeon.png', import.meta.url).href },
  { key: 'mini_toll_clerk', url: new URL('../../assets/art/enemies/mini_toll_clerk.png', import.meta.url).href },
  { key: 'mini_cobble_mite', url: new URL('../../assets/art/enemies/mini_cobble_mite.png', import.meta.url).href },
  { key: 'mini_hedge_sprite', url: new URL('../../assets/art/enemies/mini_hedge_sprite.png', import.meta.url).href },
  { key: 'mini_topiary_knight', url: new URL('../../assets/art/enemies/mini_topiary_knight.png', import.meta.url).href },
  { key: 'mini_bramble_tangle', url: new URL('../../assets/art/enemies/mini_bramble_tangle.png', import.meta.url).href },
  { key: 'mini_lapel_pin_mob', url: new URL('../../assets/art/enemies/mini_lapel_pin_mob.png', import.meta.url).href },
  { key: 'mini_town_crier', url: new URL('../../assets/art/enemies/mini_town_crier.png', import.meta.url).href },
  { key: 'mini_snuffbox_beetle', url: new URL('../../assets/art/enemies/mini_snuffbox_beetle.png', import.meta.url).href },
  { key: 'mini_tax_assessor', url: new URL('../../assets/art/enemies/mini_tax_assessor.png', import.meta.url).href },
  { key: 'mini_halberd_column', url: new URL('../../assets/art/enemies/mini_halberd_column.png', import.meta.url).href },
  { key: 'mini_bell_ringer_acolyte', url: new URL('../../assets/art/enemies/mini_bell_ringer_acolyte.png', import.meta.url).href },
  { key: 'mini_grand_parade', url: new URL('../../assets/art/enemies/mini_grand_parade.png', import.meta.url).href },
  // Ch.4 straggler — a roaming enemy lifted off its procedural mini (derived from its battler)
  { key: 'mini_thunder_snail', url: new URL('../../assets/art/enemies/mini_thunder_snail.png', import.meta.url).href },
  // Ch.1 stragglers — dog_sized_berry + bridge_berry borrow battle_giant_berry_blocker; one shared derived mini
  { key: 'mini_giant_berry_blocker', url: new URL('../../assets/art/enemies/mini_giant_berry_blocker.png', import.meta.url).href },
  // Ch.6 (Africa) — the §A7 roamers lifted off procedural minis (derived from their battlers)
  { key: 'mini_caravan_hyena_pack', url: new URL('../../assets/art/enemies/mini_caravan_hyena_pack.png', import.meta.url).href },
  { key: 'mini_baobab_root_snare', url: new URL('../../assets/art/enemies/mini_baobab_root_snare.png', import.meta.url).href },
  { key: 'mini_laughing_dust_pot', url: new URL('../../assets/art/enemies/mini_laughing_dust_pot.png', import.meta.url).href },
  { key: 'mini_sphinx_paw_shadow', url: new URL('../../assets/art/enemies/mini_sphinx_paw_shadow.png', import.meta.url).href },
  { key: 'mini_laughing_sphinx', url: new URL('../../assets/art/enemies/mini_laughing_sphinx.png', import.meta.url).href },
  // Ch.7 (India) — the §A7 roamers derived from their battlers (placeholder clones for now)
  { key: 'mini_rickshaw_swarm', url: new URL('../../assets/art/enemies/mini_rickshaw_swarm.png', import.meta.url).href },
  { key: 'mini_spice_djinn', url: new URL('../../assets/art/enemies/mini_spice_djinn.png', import.meta.url).href },
  { key: 'mini_temple_macaque', url: new URL('../../assets/art/enemies/mini_temple_macaque.png', import.meta.url).href },
  { key: 'mini_naga_sentry', url: new URL('../../assets/art/enemies/mini_naga_sentry.png', import.meta.url).href },
  { key: 'mini_cobra_raja', url: new URL('../../assets/art/enemies/mini_cobra_raja.png', import.meta.url).href },
  // §A7 Ch.6 expansion to twenty — minis derived from the adopted Africa battlers
  { key: 'mini_hollow_jackal', url: new URL('../../assets/art/enemies/mini_hollow_jackal.png', import.meta.url).href },
  { key: 'mini_dust_devil_charm', url: new URL('../../assets/art/enemies/mini_dust_devil_charm.png', import.meta.url).href },
  { key: 'mini_salt_flat_lurker', url: new URL('../../assets/art/enemies/mini_salt_flat_lurker.png', import.meta.url).href },
  { key: 'mini_thornbush_bomber', url: new URL('../../assets/art/enemies/mini_thornbush_bomber.png', import.meta.url).href },
  { key: 'mini_ribbon_serpent', url: new URL('../../assets/art/enemies/mini_ribbon_serpent.png', import.meta.url).href },
  { key: 'mini_canteen_mirage', url: new URL('../../assets/art/enemies/mini_canteen_mirage.png', import.meta.url).href },
  { key: 'mini_trade_salt_heap', url: new URL('../../assets/art/enemies/mini_trade_salt_heap.png', import.meta.url).href },
  { key: 'mini_mirage_vendor', url: new URL('../../assets/art/enemies/mini_mirage_vendor.png', import.meta.url).href },
  { key: 'mini_griot_string_snare', url: new URL('../../assets/art/enemies/mini_griot_string_snare.png', import.meta.url).href },
  { key: 'mini_town_gossip_troll', url: new URL('../../assets/art/enemies/mini_town_gossip_troll.png', import.meta.url).href },
  { key: 'mini_punchline_head', url: new URL('../../assets/art/enemies/mini_punchline_head.png', import.meta.url).href },
  { key: 'mini_echoing_riddle', url: new URL('../../assets/art/enemies/mini_echoing_riddle.png', import.meta.url).href },
  { key: 'mini_laughing_sphinx_riddle', url: new URL('../../assets/art/enemies/mini_laughing_sphinx_riddle.png', import.meta.url).href },
  { key: 'mini_rare_riddle_ring', url: new URL('../../assets/art/enemies/mini_rare_riddle_ring.png', import.meta.url).href },
  { key: 'mini_sunbaked_idol', url: new URL('../../assets/art/enemies/mini_sunbaked_idol.png', import.meta.url).href },
  { key: 'mini_fastest_man_echo', url: new URL('../../assets/art/enemies/mini_fastest_man_echo.png', import.meta.url).href },
  // §A7 Ch.2 expansion — authored roamer minis derived from the adopted battlers
  { key: 'mini_brass_market_mimic', url: new URL('../../assets/art/enemies/mini_brass_market_mimic.png', import.meta.url).href },
  { key: 'mini_bronze_mask_guardian', url: new URL('../../assets/art/enemies/mini_bronze_mask_guardian.png', import.meta.url).href },
  { key: 'mini_cackling_mask', url: new URL('../../assets/art/enemies/mini_cackling_mask.png', import.meta.url).href },
  { key: 'mini_confetti_cannon', url: new URL('../../assets/art/enemies/mini_confetti_cannon.png', import.meta.url).href },
  { key: 'mini_postage_stampede', url: new URL('../../assets/art/enemies/mini_postage_stampede.png', import.meta.url).href },
  // Ch.8 (China) — the §A7 roamers derived from their battlers (placeholder clones for now)
  { key: 'mini_paper_lantern_wisp', url: new URL('../../assets/art/enemies/mini_paper_lantern_wisp.png', import.meta.url).href },
  { key: 'mini_spore_puffer', url: new URL('../../assets/art/enemies/mini_spore_puffer.png', import.meta.url).href },
  { key: 'mini_origami_warrior', url: new URL('../../assets/art/enemies/mini_origami_warrior.png', import.meta.url).href },
  { key: 'mini_porcelain_warlord', url: new URL('../../assets/art/enemies/mini_porcelain_warlord.png', import.meta.url).href },
  { key: 'mini_paper_dragon', url: new URL('../../assets/art/enemies/mini_paper_dragon.png', import.meta.url).href },
  // CHAPTER 9 (Romania) — roamer minis derived from the battlers (derive-ch5-minis.ts)
  { key: 'mini_haystack_mimic', url: new URL('../../assets/art/enemies/mini_haystack_mimic.png', import.meta.url).href },
  { key: 'mini_ribcage_rattler', url: new URL('../../assets/art/enemies/mini_ribcage_rattler.png', import.meta.url).href },
  { key: 'mini_moss_strigoi', url: new URL('../../assets/art/enemies/mini_moss_strigoi.png', import.meta.url).href },
  { key: 'mini_animated_armor', url: new URL('../../assets/art/enemies/mini_animated_armor.png', import.meta.url).href },
  { key: 'mini_wolf_of_the_old_road', url: new URL('../../assets/art/enemies/mini_wolf_of_the_old_road.png', import.meta.url).href },
  { key: 'mini_count_hoaxula', url: new URL('../../assets/art/enemies/mini_count_hoaxula.png', import.meta.url).href },
  // CHAPTER 10 (The Long Shot) — roamer minis derived from the battlers (derive-ch5-minis.ts)
  { key: 'mini_frost_wisp', url: new URL('../../assets/art/enemies/mini_frost_wisp.png', import.meta.url).href },
  { key: 'mini_icehorn_caribou', url: new URL('../../assets/art/enemies/mini_icehorn_caribou.png', import.meta.url).href },
  { key: 'mini_cinder_imp', url: new URL('../../assets/art/enemies/mini_cinder_imp.png', import.meta.url).href },
  { key: 'mini_ash_crab', url: new URL('../../assets/art/enemies/mini_ash_crab.png', import.meta.url).href },
  { key: 'mini_silent_drifter', url: new URL('../../assets/art/enemies/mini_silent_drifter.png', import.meta.url).href },
  { key: 'mini_static_wraith', url: new URL('../../assets/art/enemies/mini_static_wraith.png', import.meta.url).href },
  { key: 'mini_frost_sentinel', url: new URL('../../assets/art/enemies/mini_frost_sentinel.png', import.meta.url).href },
  { key: 'mini_tiki_magma_golem', url: new URL('../../assets/art/enemies/mini_tiki_magma_golem.png', import.meta.url).href },
  { key: 'mini_the_hush', url: new URL('../../assets/art/enemies/mini_the_hush.png', import.meta.url).href },
];

export const AUTHORED_ENEMY_BATTLE_ART_KEYS = ENEMY_BATTLE_ART.map((art) => art.key);
export const AUTHORED_ENEMY_OVERWORLD_ART_IDS = ENEMY_OVERWORLD_ART.map((art) => art.id);
export const AUTHORED_ENEMY_OVERWORLD_ART_KEYS = ENEMY_OVERWORLD_ART.map((art) => art.key);
/** authored single-frame overworld minis (hi-res, derived from the battler or authored) —
 *  not the 8-dir gold standard, but AUTHORED art, NOT a procedural `spritegen` mini. */
export const AUTHORED_ENEMY_MINI_ART_KEYS = ENEMY_MINI_ART.map((art) => art.key);

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

// down & up walk/run frame cells in the 46-frame layout, as [walkA → walkB] /
// [runA → runB] source→dest pairs. A horizontal flip of a FRONT/BACK stepping
// pose is — by construction — the other foot, so a "half" sheet authored with a
// single step per facing yields a full alternating gait without the artist ever
// controlling which foot imagegen happened to draw. Only down/up qualify: a
// profile (left/right) flip changes the FACING, not the foot, so those stay as
// authored. (down: dirIndex 0 → walk base 0, run base 16; up: dirIndex 3 → walk
// base 12, run base 22 — see the drawFrame layout below.)
const FOOT_MIRROR_PAIRS: ReadonlyArray<readonly [number, number]> = [
  [1, 3],
  [13, 15],
  [16, 17],
  [22, 23],
];

// Copy frame `srcFrame` into frame `dstFrame` horizontally flipped, in place on a
// 4-column character sheet canvas.
function mirrorCharacterFrame(ctx: CanvasRenderingContext2D, srcFrame: number, dstFrame: number): void {
  const cols = 4;
  const sx = (srcFrame % cols) * FRAME_W;
  const sy = Math.floor(srcFrame / cols) * FRAME_H;
  const dx = (dstFrame % cols) * FRAME_W;
  const dy = Math.floor(dstFrame / cols) * FRAME_H;
  // Snapshot the source cell first — src and dest can overlap nothing here, but a
  // detached buffer keeps the flip independent of draw order.
  const tmp = document.createElement('canvas');
  tmp.width = FRAME_W;
  tmp.height = FRAME_H;
  const tctx = tmp.getContext('2d');
  if (!tctx) return;
  tctx.imageSmoothingEnabled = false;
  tctx.drawImage(ctx.canvas, sx, sy, FRAME_W, FRAME_H, 0, 0, FRAME_W, FRAME_H);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(dx, dy, FRAME_W, FRAME_H);
  ctx.translate(dx + FRAME_W, dy);
  ctx.scale(-1, 1);
  ctx.drawImage(tmp, 0, 0);
  ctx.restore();
}

function applyFootMirror(ctx: CanvasRenderingContext2D): void {
  for (const [srcFrame, dstFrame] of FOOT_MIRROR_PAIRS) {
    mirrorCharacterFrame(ctx, srcFrame, dstFrame);
  }
}

function makeCharacterCanvas(src: SourceImage, opts: { mirrorFeet?: boolean } = {}): HTMLCanvasElement {
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
    if (opts.mirrorFeet) applyFootMirror(ctx);
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
    if (opts.mirrorFeet) applyFootMirror(ctx);
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
  // BustView addresses 18 BUST_FRAME pose indices, but the authored battle bust is
  // a SINGLE high-res portrait (one pose). A 4-col × 5-row pose SHEET (aspect ~0.8)
  // is stretched straight onto the grid; a square/tall single portrait is drawn
  // into EVERY pose cell so the sheet contract holds (a crisp static bust). Author
  // a real 4×5 pose sheet later to restore per-pose animation.
  const isPoseSheet = src.width < src.height * 0.9;
  ctx.imageSmoothingEnabled = !isPoseSheet; // smooth the portrait downscale; keep pose sheets crisp
  ctx.imageSmoothingQuality = 'high';
  if (isPoseSheet) {
    ctx.drawImage(src, 0, 0, src.width, src.height, 0, 0, canvas.width, canvas.height);
  } else {
    for (let i = 0; i < TOTAL_BUST_FRAMES; i++) {
      ctx.drawImage(src, 0, 0, src.width, src.height, (i % cols) * BUST_W, Math.floor(i / cols) * BUST_H, BUST_W, BUST_H);
    }
  }
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

function drawAuthoredTileStrip(ctx: CanvasRenderingContext2D, tileArt: SourceImage, names: readonly string[]): void {
  const authoredCell = Math.max(1, Math.round(tileArt.width / names.length));
  names.forEach((name, authoredIndex) => {
    const tileIndex = TILESET.findIndex((tile) => tile.name === name);
    if (tileIndex < 0) return;
    ctx.clearRect(tileIndex * RT_TILE, 0, RT_TILE, RT_TILE);
    ctx.drawImage(tileArt, authoredIndex * authoredCell, 0, authoredCell, authoredCell, tileIndex * RT_TILE, 0, RT_TILE, RT_TILE);
  });
}

export function preloadAuthoredArt(scene: Phaser.Scene): void {
  FRAMING_SCREEN_ART.forEach((art) => scene.load.image(art.key, art.url));
  HERO_ART.forEach((art) => {
    scene.load.image(art.characterKey, art.characterUrl);
    scene.load.image(art.bustKey, art.bustUrl);
    scene.load.image(art.battlerKey, art.battlerUrl);
  });
  NPC_CHARACTER_ART.forEach((art) => scene.load.image(art.key, art.url));
  scene.load.image(BISCUIT_DOG_ART.key, BISCUIT_DOG_ART.url);
  HERO_PORTRAIT_ART.forEach((art) => scene.load.image(heroPortraitKey(art.id), art.url));
  AUTHORED_MINIGAME_ATHLETES.forEach((art) => scene.load.image(art.key, art.url));
  AUTHORED_MINIGAME_GOLFERS.forEach((art) => scene.load.image(art.key, art.url));
  AUTHORED_HOOPS_SUPPORT_SOURCES.forEach((art) => scene.load.image(art.authoredKey, art.url));
  scene.load.image(AUTHORED_HOOPS_SIDE_SHEET.authoredKey, AUTHORED_HOOPS_SIDE_SHEET.url);
  AUTHORED_GOLF_SUPPORT_SOURCES.forEach((art) => scene.load.image(art.authoredKey, art.url));
  AUTHORED_GOLF_SHEET_SOURCES.forEach((art) => scene.load.image(art.authoredKey, art.url));
  scene.load.image(WORLD_TILE_ART.key, WORLD_TILE_ART.url);
  scene.load.image(HICKORY_DIRT_TILE_ART.key, HICKORY_DIRT_TILE_ART.url);
  scene.load.image(MINIMUS_TILE_ART.key, MINIMUS_TILE_ART.url);
  scene.load.image(CHINA_TILE_ART.key, CHINA_TILE_ART.url);
  scene.load.image(ROMANIA_TILE_ART.key, ROMANIA_TILE_ART.url);
  WORLD_PROP_ART.forEach((art) => scene.load.image(`authored_world_${art.key}`, art.url));
  AUTHORED_VEHICLE_SOURCES.forEach((art) => scene.load.image(art.authoredKey, art.url));
  BATTLE_BACKGROUND_ART.forEach((art) => scene.load.image(art.key, art.url));
  ENEMY_BATTLE_ART.forEach((art) => scene.load.image(`authored_enemy_${art.key}`, art.url));
  ENEMY_MINI_ART.forEach((art) => scene.load.image(`authored_enemy_${art.key}`, art.url));
  ENEMY_OVERWORLD_ART.forEach((art) => scene.load.image(art.authoredKey, art.url));
}

export function applyAuthoredHeroArt(scene: Phaser.Scene): void {
  HERO_ART.forEach((art) => {
    const character = sourceImage(scene, art.characterKey);
    if (character) {
      clearHeroAnimations(scene, art.id);
      const mirrorFeet = (art as { mirrorFeet?: boolean }).mirrorFeet ?? false;
      replaceTextureSheet(scene, art.id, makeCharacterCanvas(character, { mirrorFeet }), FRAME_W, FRAME_H, 4, TOTAL_CHARACTER_FRAMES);
    }
  });
  NPC_CHARACTER_ART.forEach((art) => {
    const character = sourceImage(scene, art.key);
    if (character) {
      clearHeroAnimations(scene, art.id);
      const mirrorFeet = (art as { mirrorFeet?: boolean }).mirrorFeet ?? false;
      replaceTextureSheet(scene, art.id, makeCharacterCanvas(character, { mirrorFeet }), FRAME_W, FRAME_H, 4, TOTAL_CHARACTER_FRAMES);
    }
  });
  const biscuit = sourceImage(scene, BISCUIT_DOG_ART.key);
  if (biscuit) {
    replaceTextureSheet(scene, 'dog', makeImageCanvas(biscuit), DOG_FRAME_W, DOG_FRAME_H, DOG_FRAMES, DOG_FRAMES);
  }
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

export function applyAuthoredMinigameArt(scene: Phaser.Scene): void {
  AUTHORED_HOOPS_SUPPORT_SOURCES.forEach((art) => {
    const img = sourceImage(scene, art.authoredKey);
    if (img) replaceTextureImage(scene, art.key, img);
  });

  const hoopSide = sourceImage(scene, AUTHORED_HOOPS_SIDE_SHEET.authoredKey);
  if (hoopSide) {
    const frameW = Math.max(1, Math.round(hoopSide.width / 3));
    replaceTextureSheet(scene, AUTHORED_HOOPS_SIDE_SHEET.key, makeImageCanvas(hoopSide), frameW, hoopSide.height, 3, 3);
  }

  AUTHORED_GOLF_SUPPORT_SOURCES.forEach((art) => {
    const img = sourceImage(scene, art.authoredKey);
    if (img) replaceTextureImage(scene, art.key, img);
  });

  AUTHORED_GOLF_SHEET_SOURCES.forEach((art) => {
    const img = sourceImage(scene, art.authoredKey);
    if (!img) return;
    const frameW = Math.max(1, Math.round(img.width / art.frames));
    replaceTextureSheet(scene, art.key, makeImageCanvas(img), frameW, img.height, art.frames, art.frames);
  });
}

export function applyAuthoredWorldTiles(scene: Phaser.Scene): void {
  const tileArt = sourceImage(scene, WORLD_TILE_ART.key);
  const hickoryTileArt = sourceImage(scene, HICKORY_DIRT_TILE_ART.key);
  const minimusTileArt = sourceImage(scene, MINIMUS_TILE_ART.key);
  const chinaTileArt = sourceImage(scene, CHINA_TILE_ART.key);
  const romaniaTileArt = sourceImage(scene, ROMANIA_TILE_ART.key);
  const baseTiles = sourceImage(scene, 'tiles');
  if (!baseTiles) return;

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
  if (tileArt) drawAuthoredTileStrip(ctx, tileArt, WORLD_TILE_ART.names);
  if (hickoryTileArt) drawAuthoredTileStrip(ctx, hickoryTileArt, HICKORY_DIRT_TILE_ART.names);
  if (minimusTileArt) drawAuthoredTileStrip(ctx, minimusTileArt, MINIMUS_TILE_ART.names);
  if (chinaTileArt) drawAuthoredTileStrip(ctx, chinaTileArt, CHINA_TILE_ART.names);
  if (romaniaTileArt) drawAuthoredTileStrip(ctx, romaniaTileArt, ROMANIA_TILE_ART.names);

  replaceTextureSheet(scene, 'tiles', canvas, RT_TILE, RT_TILE, TILESET.length, TILESET.length);
}

export function applyAuthoredWorldProps(scene: Phaser.Scene): void {
  WORLD_PROP_ART.forEach((art) => {
    const img = sourceImage(scene, `authored_world_${art.key}`);
    if (img) replaceTextureImage(scene, art.key, img);
  });
}

export function applyAuthoredVehicleArt(scene: Phaser.Scene): void {
  AUTHORED_VEHICLE_SOURCES.forEach((art) => {
    const img = sourceImage(scene, art.authoredKey);
    if (!img) return;
    // directional sheets are 3 frames [side, front, back]; legacy are 4 motion frames
    const frames = DIRECTIONAL_VEHICLE_KEYS.has(art.key) ? 3 : 4;
    const frameW = Math.max(1, Math.round(img.width / frames));
    replaceTextureSheet(scene, art.key, makeImageCanvas(img), frameW, img.height, frames, frames);
  });
}

export function applyAuthoredEnemyArt(scene: Phaser.Scene): void {
  ENEMY_BATTLE_ART.forEach((art) => {
    const img = sourceImage(scene, `authored_enemy_${art.key}`);
    if (img) replaceTextureImage(scene, art.key, img);
  });
  ENEMY_MINI_ART.forEach((art) => {
    const img = sourceImage(scene, `authored_enemy_${art.key}`);
    if (img) replaceTextureImage(scene, art.key, img);
  });
  ENEMY_OVERWORLD_ART.forEach((art) => {
    const img = sourceImage(scene, art.authoredKey);
    if (img) replaceTextureSheet(scene, art.key, makeImageCanvas(img), ENEMY_OW_FRAME_W, ENEMY_OW_FRAME_H, ENEMY_OW_FRAMES, ENEMY_OW_FRAMES);
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
  applyAuthoredMinigameArt(scene);
  applyAuthoredWorldTiles(scene);
  applyAuthoredWorldProps(scene);
  applyAuthoredVehicleArt(scene);
}

export function applyAuthoredWorldArt(scene: Phaser.Scene): void {
  applyAuthoredWorldTiles(scene);
  applyAuthoredWorldProps(scene);
  applyAuthoredVehicleArt(scene);
}

