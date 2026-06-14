import Phaser from 'phaser';
import { TILE, TILESET } from './tiles';

const FRAME_W = 24;
const FRAME_H = 32;
const BUST_W = 32;
const BUST_H = 32;
const BATTLER_W = 28;
const BATTLER_H = 36;

const TOTAL_CHARACTER_FRAMES = 46;
const TOTAL_BUST_FRAMES = 18;
const TOTAL_BATTLER_FRAMES = 14;

type SourceImage = HTMLImageElement | HTMLCanvasElement;

const appliedSheets = new Set<string>();

const HERO_ART = [
  {
    id: 'rex',
    characterKey: 'authored_rex_8dir',
    bustKey: 'authored_rex_bust18',
    battlerKey: 'authored_rex_battler14',
    characterUrl: new URL('../../assets/art/characters/jay_8dir_24x32.png', import.meta.url).href,
    bustUrl: new URL('../../assets/art/busts/jay_bust_18_32x32.png', import.meta.url).href,
    battlerUrl: new URL('../../assets/art/battlers/jay_battler_14_28x36.png', import.meta.url).href,
  },
  {
    id: 'faye',
    characterKey: 'authored_faye_8dir',
    bustKey: 'authored_faye_bust18',
    battlerKey: 'authored_faye_battler14',
    characterUrl: new URL('../../assets/art/characters/mia_8dir_24x32.png', import.meta.url).href,
    bustUrl: new URL('../../assets/art/busts/mia_bust_18_32x32.png', import.meta.url).href,
    battlerUrl: new URL('../../assets/art/battlers/mia_battler_14_28x36.png', import.meta.url).href,
  },
  {
    id: 'milo',
    characterKey: 'authored_milo_8dir',
    bustKey: 'authored_milo_bust18',
    battlerKey: 'authored_milo_battler14',
    characterUrl: new URL('../../assets/art/characters/milo_8dir_24x32.png', import.meta.url).href,
    bustUrl: new URL('../../assets/art/busts/milo_bust_18_32x32.png', import.meta.url).href,
    battlerUrl: new URL('../../assets/art/battlers/milo_battler_14_28x36.png', import.meta.url).href,
  },
  {
    id: 'pippa',
    characterKey: 'authored_pippa_8dir',
    bustKey: 'authored_pippa_bust18',
    battlerKey: 'authored_pippa_battler14',
    characterUrl: new URL('../../assets/art/characters/pippa_8dir_24x32.png', import.meta.url).href,
    bustUrl: new URL('../../assets/art/busts/pippa_bust_18_32x32.png', import.meta.url).href,
    battlerUrl: new URL('../../assets/art/battlers/pippa_battler_14_28x36.png', import.meta.url).href,
  },
  {
    id: 'dorin',
    characterKey: 'authored_dorin_8dir',
    bustKey: 'authored_dorin_bust18',
    battlerKey: 'authored_dorin_battler14',
    characterUrl: new URL('../../assets/art/characters/dorin_8dir_24x32.png', import.meta.url).href,
    bustUrl: new URL('../../assets/art/busts/dorin_bust_18_32x32.png', import.meta.url).href,
    battlerUrl: new URL('../../assets/art/battlers/dorin_battler_14_28x36.png', import.meta.url).href,
  },
] as const;

type HeroArt = (typeof HERO_ART)[number];

const WORLD_TILE_ART = {
  key: 'authored_otterbrook_tiles16',
  url: new URL('../../assets/art/world/otterbrook_tiles_16.png', import.meta.url).href,
  names: [
    'grass_a',
    'grass_b',
    'grass_tuft',
    'flowers_red',
    'flowers_gold',
    'bush',
    'fence_h',
    'fence_v',
    'floor_wood',
    'wall_int',
    'rug',
    'sidewalk',
    'road',
    'sidewalk_crack',
    'sidewalk_curb',
    'road_patch',
  ],
} as const;

const WORLD_PROP_ART = [
  { key: 'tree', url: new URL('../../assets/art/world/props/tree.png', import.meta.url).href },
  { key: 'tree_b', url: new URL('../../assets/art/world/props/tree_b.png', import.meta.url).href },
  { key: 'tree_c', url: new URL('../../assets/art/world/props/tree_c.png', import.meta.url).href },
  { key: 'pine', url: new URL('../../assets/art/world/props/pine.png', import.meta.url).href },
  { key: 'sign', url: new URL('../../assets/art/world/props/sign.png', import.meta.url).href },
  { key: 'picnic', url: new URL('../../assets/art/world/props/picnic.png', import.meta.url).href },
  { key: 'picnic_blanket', url: new URL('../../assets/art/world/props/picnic_blanket.png', import.meta.url).href },
  { key: 'phone_table', url: new URL('../../assets/art/world/props/phone_table.png', import.meta.url).href },
  { key: 'bed', url: new URL('../../assets/art/world/props/bed.png', import.meta.url).href },
  { key: 'desk', url: new URL('../../assets/art/world/props/desk.png', import.meta.url).href },
  { key: 'sofa', url: new URL('../../assets/art/world/props/sofa.png', import.meta.url).href },
  { key: 'counter', url: new URL('../../assets/art/world/props/counter.png', import.meta.url).href },
  { key: 'dresser', url: new URL('../../assets/art/world/props/dresser.png', import.meta.url).href },
  { key: 'tv', url: new URL('../../assets/art/world/props/tv.png', import.meta.url).href },
  { key: 'bookshelf', url: new URL('../../assets/art/world/props/bookshelf.png', import.meta.url).href },
  { key: 'floor_lamp', url: new URL('../../assets/art/world/props/floor_lamp.png', import.meta.url).href },
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

function replaceTextureImage(scene: Phaser.Scene, key: string, src: SourceImage): void {
  if (appliedSheets.has(key)) return;
  const canvas = document.createElement('canvas');
  canvas.width = src.width;
  canvas.height = src.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, 0, 0);
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

  const frameSources = new Array<number>(TOTAL_CHARACTER_FRAMES).fill(sourceByFacing.down);
  for (let i = 0; i < 4; i++) frameSources[i] = sourceByFacing.down;
  for (let i = 4; i < 8; i++) frameSources[i] = sourceByFacing.left;
  for (let i = 8; i < 12; i++) frameSources[i] = sourceByFacing.right;
  for (let i = 12; i < 16; i++) frameSources[i] = sourceByFacing.up;
  for (let i = 16; i < 18; i++) frameSources[i] = sourceByFacing.down;
  for (let i = 18; i < 20; i++) frameSources[i] = sourceByFacing.left;
  for (let i = 20; i < 22; i++) frameSources[i] = sourceByFacing.right;
  for (let i = 22; i < 24; i++) frameSources[i] = sourceByFacing.up;
  for (let i = 24; i < 27; i++) frameSources[i] = sourceByFacing.downright;
  for (let i = 27; i < 30; i++) frameSources[i] = sourceByFacing.downleft;
  for (let i = 30; i < 33; i++) frameSources[i] = sourceByFacing.upright;
  for (let i = 33; i < 36; i++) frameSources[i] = sourceByFacing.upleft;
  for (let i = 36; i < 38; i++) frameSources[i] = sourceByFacing.downright;
  for (let i = 38; i < 40; i++) frameSources[i] = sourceByFacing.downleft;
  for (let i = 40; i < 42; i++) frameSources[i] = sourceByFacing.upright;
  for (let i = 42; i < 44; i++) frameSources[i] = sourceByFacing.upleft;
  frameSources[44] = sourceByFacing.down;
  frameSources[45] = sourceByFacing.down;

  frameSources.forEach((sourceIndex, frame) => {
    const sx = sourceIndex * FRAME_W;
    const dx = (frame % cols) * FRAME_W;
    const dy = Math.floor(frame / cols) * FRAME_H;
    ctx.drawImage(src, sx, 0, FRAME_W, FRAME_H, dx, dy, FRAME_W, FRAME_H);
  });
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
  ctx.drawImage(src, 0, 0);
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
  ctx.drawImage(src, 0, 0);
  return canvas;
}

export function preloadAuthoredArt(scene: Phaser.Scene): void {
  HERO_ART.forEach((art) => {
    scene.load.image(art.characterKey, art.characterUrl);
    scene.load.image(art.bustKey, art.bustUrl);
    scene.load.image(art.battlerKey, art.battlerUrl);
  });
  scene.load.image(WORLD_TILE_ART.key, WORLD_TILE_ART.url);
  WORLD_PROP_ART.forEach((art) => scene.load.image(`authored_world_${art.key}`, art.url));
}

export function applyAuthoredHeroArt(scene: Phaser.Scene): void {
  HERO_ART.forEach((art) => {
    const character = sourceImage(scene, art.characterKey);
    if (character) replaceTextureSheet(scene, art.id, makeCharacterCanvas(character), FRAME_W, FRAME_H, 4, TOTAL_CHARACTER_FRAMES);
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

function applyAuthoredWorldTiles(scene: Phaser.Scene): void {
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

  WORLD_TILE_ART.names.forEach((name, authoredIndex) => {
    const tileIndex = TILESET.findIndex((tile) => tile.name === name);
    if (tileIndex < 0) return;
    ctx.clearRect(tileIndex * TILE, 0, TILE, TILE);
    ctx.drawImage(tileArt, authoredIndex * TILE, 0, TILE, TILE, tileIndex * TILE, 0, TILE, TILE);
  });

  replaceTextureSheet(scene, 'tiles', canvas, TILE, TILE, TILESET.length, TILESET.length);
}

function applyAuthoredWorldProps(scene: Phaser.Scene): void {
  WORLD_PROP_ART.forEach((art) => {
    const img = sourceImage(scene, `authored_world_${art.key}`);
    if (img) replaceTextureImage(scene, art.key, img);
  });
}

export function applyAuthoredArt(scene: Phaser.Scene): void {
  applyAuthoredHeroArt(scene);
  HERO_ART.forEach((art) => {
    for (const wear of [0, 1, 2]) applyAuthoredBustSheet(scene, `bust_${art.id}_none_w${wear}`, art.id);
    for (const wear of [0, 1, 2]) applyAuthoredBattlerSheet(scene, `battler_${art.id}_none_none_w${wear}`, art.id);
    applyAuthoredBustSheet(scene, `bust_${art.id}`, art.id);
  });
  applyAuthoredWorldTiles(scene);
  applyAuthoredWorldProps(scene);
}
