/**
 * Boot-time texture factory: runs the sprite engine and registers every
 * texture + animation with Phaser. Zero binary assets — the whole game's art
 * is generated from code in under a second.
 */
import Phaser from 'phaser';
import { Pixmap, framesToCanvas } from './pixmap';
import {
  CAST,
  generateCharacterFrames,
  generateDogFrames,
  generateGlintFrames,
  generateAngelFrames,
} from './characters';
import {
  drawCrankyMailbox,
  drawRunawayLawnmower,
  drawCoilyCicada,
  drawBlazerSmiler,
  drawPigeonGang,
  drawHillSlugDeluxe,
  drawTitanicTick,
  drawCicadaMini,
  drawSlugMini,
  drawMailboxMini,
  drawMowerMini,
  drawPigeonMini,
} from './enemies';
import {
  TILESET,
  TILE,
  drawTree,
  drawSign,
  drawPicnicTable,
  drawPhoneTable,
  drawBed,
  drawDesk,
  drawSofa,
  drawCounter,
  drawBugZapper,
  drawMeteorRock,
  drawEmber,
  drawLemonadeStand,
  drawBusSign,
  drawDoormat,
  drawStairs,
  drawHouse,
  drawCityBuilding,
  drawPayphone,
  drawDumpster,
  drawBench,
  drawHydrant,
  drawPlanter,
  drawElevator,
  drawWaterCooler,
  drawCopier,
  drawPlantPot,
  drawHoldingDoor,
  drawOfficeDoor,
  drawBusSeat,
  drawBusWindows,
  drawSkyline,
} from './tiles';
import {
  drawWindowSlice,
  drawBoxSlice,
  drawOdometerStrip,
  drawDpad,
  drawRoundButton,
  drawStartPill,
  drawHandCursor,
  drawPhoneIcon,
  drawTitleArt,
  drawLogo,
} from './ui';
import { makeFontSheet, FONT_CHARS, FONT_CELL_W, FONT_CELL_H, FONT_CHARS_PER_ROW } from './font';
import { RAMP, C, px } from '../palette';

export const GAME_W = 400;
export const GAME_H = 225;

function addPixmap(scene: Phaser.Scene, key: string, pm: Pixmap): void {
  if (scene.textures.exists(key)) return;
  scene.textures.addCanvas(key, pm.toCanvas());
}

function addSheet(scene: Phaser.Scene, key: string, frames: Pixmap[], cols: number): void {
  if (scene.textures.exists(key)) return;
  const { canvas, fw, fh } = framesToCanvas(frames, cols);
  const tex = scene.textures.addCanvas(key, canvas);
  if (!tex) return;
  frames.forEach((_, i) => {
    tex.add(i, 0, (i % cols) * fw, Math.floor(i / cols) * fh, fw, fh);
  });
}

const DIRS = ['down', 'left', 'right', 'up'] as const;
export type Facing = (typeof DIRS)[number];

function addCharacter(scene: Phaser.Scene, id: string): void {
  const spec = CAST[id];
  addSheet(scene, id, generateCharacterFrames(spec), 4);
  DIRS.forEach((dir, d) => {
    const animKey = `${id}-walk-${dir}`;
    if (scene.anims.exists(animKey)) return;
    scene.anims.create({
      key: animKey,
      frames: [0, 1, 2, 3].map((f) => ({ key: id, frame: d * 4 + f })),
      frameRate: 8,
      repeat: -1,
    });
  });
}

/** frame index for standing still, given facing */
export function standFrame(facing: Facing): number {
  return DIRS.indexOf(facing) * 4;
}

function makeSpiral(): Pixmap {
  const pm = new Pixmap(192, 192);
  const cx = 96;
  const cy = 96;
  for (let arm = 0; arm < 2; arm++) {
    for (let t = 0; t < 720; t += 1) {
      const th = (t / 180) * Math.PI + arm * Math.PI;
      const r = 6 + t * 0.12;
      if (r > 92) break;
      const x = Math.round(cx + Math.cos(th) * r);
      const y = Math.round(cy + Math.sin(th) * r);
      pm.rect(x - 2, y - 2, 5, 5, C.white);
    }
  }
  return pm;
}

export function generateAllTextures(scene: Phaser.Scene): void {
  // characters + specials
  Object.keys(CAST).forEach((id) => addCharacter(scene, id));
  addSheet(scene, 'dog', generateDogFrames(), 4);
  addSheet(scene, 'glint', generateGlintFrames(), 2);
  addSheet(scene, 'angel', generateAngelFrames(), 2);
  if (!scene.anims.exists('glint-flit')) {
    scene.anims.create({
      key: 'glint-flit',
      frames: [0, 1].map((f) => ({ key: 'glint', frame: f })),
      frameRate: 6,
      repeat: -1,
    });
  }
  if (!scene.anims.exists('dog-walk')) {
    scene.anims.create({
      key: 'dog-walk',
      frames: [0, 1].map((f) => ({ key: 'dog', frame: f })),
      frameRate: 6,
      repeat: -1,
    });
  }

  // enemy battle sprites
  addPixmap(scene, 'battle_cranky_mailbox', drawCrankyMailbox());
  addPixmap(scene, 'battle_runaway_lawnmower', drawRunawayLawnmower());
  addPixmap(scene, 'battle_coily_cicada', drawCoilyCicada());
  addPixmap(scene, 'battle_blazer_smiler', drawBlazerSmiler());
  addPixmap(scene, 'battle_pigeon_gang', drawPigeonGang());
  addPixmap(scene, 'battle_hill_slug', drawHillSlugDeluxe());
  addPixmap(scene, 'battle_titanic_tick', drawTitanicTick());

  // overworld minis
  addPixmap(scene, 'mini_coily_cicada', drawCicadaMini());
  addPixmap(scene, 'mini_hill_slug', drawSlugMini());
  addPixmap(scene, 'mini_cranky_mailbox', drawMailboxMini());
  addPixmap(scene, 'mini_runaway_lawnmower', drawMowerMini());
  addPixmap(scene, 'mini_pigeon_gang', drawPigeonMini());

  // tileset strip
  if (!scene.textures.exists('tiles')) {
    addSheet(scene, 'tiles', TILESET.map((t) => t.make()), TILESET.length);
  }

  // props
  addPixmap(scene, 'tree', drawTree());
  addPixmap(scene, 'sign', drawSign());
  addPixmap(scene, 'picnic', drawPicnicTable());
  addPixmap(scene, 'phone_table', drawPhoneTable());
  addPixmap(scene, 'bed', drawBed());
  addPixmap(scene, 'desk', drawDesk());
  addPixmap(scene, 'sofa', drawSofa());
  addPixmap(scene, 'counter', drawCounter());
  addPixmap(scene, 'bug_zapper', drawBugZapper());
  addPixmap(scene, 'meteor_rock', drawMeteorRock());
  addPixmap(scene, 'ember', drawEmber());
  addPixmap(scene, 'lemonade', drawLemonadeStand());
  addPixmap(scene, 'bus_sign', drawBusSign());
  addPixmap(scene, 'doormat', drawDoormat());
  addPixmap(scene, 'stairs', drawStairs());

  // Brickton City props (S1)
  addPixmap(scene, 'payphone', drawPayphone());
  addPixmap(scene, 'dumpster', drawDumpster());
  addPixmap(scene, 'bench', drawBench());
  addPixmap(scene, 'hydrant', drawHydrant());
  addPixmap(scene, 'planter', drawPlanter());
  addPixmap(scene, 'elevator', drawElevator());
  addPixmap(scene, 'water_cooler', drawWaterCooler());
  addPixmap(scene, 'copier', drawCopier());
  addPixmap(scene, 'plant_pot', drawPlantPot());
  addPixmap(scene, 'holding_door', drawHoldingDoor());
  addPixmap(scene, 'office_door', drawOfficeDoor());
  addPixmap(scene, 'bus_seat', drawBusSeat());
  addPixmap(scene, 'bus_windows', drawBusWindows(352));
  addPixmap(scene, 'skyline', drawSkyline());

  // Brickton downtown — varied heights and lighting so no two facades match
  addPixmap(scene, 'bldg_bagels', drawCityBuilding({ wallTiles: 4, upperRows: 1, wall: RAMP.ORANGE, signText: 'BAGELS', awning: RAMP.RED, doorAt: 1, litSeed: 11 }));
  addPixmap(scene, 'bldg_starmart', drawCityBuilding({ wallTiles: 5, upperRows: 1, wall: RAMP.CYAN, signText: 'STARMART', awning: RAMP.BLUE, doorAt: 2, litSeed: 12 }));
  addPixmap(scene, 'bldg_hospital', drawCityBuilding({ wallTiles: 7, upperRows: 2, wall: RAMP.PAPER, signText: 'BRICKTON GENERAL', cross: true, doorAt: 3, doubleDoor: true, litSeed: 13 }));
  addPixmap(scene, 'bldg_brickmore', drawCityBuilding({ wallTiles: 5, upperRows: 3, wall: RAMP.RED, signText: 'THE BRICKMORE', doorAt: 2, litSeed: 14 }));
  addPixmap(scene, 'bldg_dept', drawCityBuilding({ wallTiles: 8, upperRows: 2, wall: RAMP.BLUE, signText: 'DEPARTMENT OF SMILES', smiley: true, doorAt: 3, doubleDoor: true, litSeed: 15 }));
  addPixmap(scene, 'bldg_video', drawCityBuilding({ wallTiles: 4, upperRows: 1, wall: RAMP.PURPLE, signText: 'VIDEO', awning: RAMP.PURPLE, doorAt: 2, litSeed: 16 }));
  addPixmap(scene, 'bldg_bank', drawCityBuilding({ wallTiles: 6, upperRows: 2, wall: RAMP.PAPER, signText: 'SAVINGS & LOAN', doorAt: 2, litSeed: 17 }));
  addPixmap(scene, 'bldg_arcade2', drawCityBuilding({ wallTiles: 5, upperRows: 1, wall: RAMP.PURPLE, signText: 'STARPORT II', awning: RAMP.GOLD, doorAt: 2, litSeed: 18 }));
  addPixmap(scene, 'bldg_diner', drawCityBuilding({ wallTiles: 4, upperRows: 1, wall: RAMP.RED, signText: 'DINER', awning: RAMP.PAPER, doorAt: 1, litSeed: 19 }));

  // buildings
  addPixmap(scene, 'house_rex', drawHouse({ wallTiles: 4, wallRows: 2, roof: RAMP.RED, chimney: true }));
  addPixmap(scene, 'house_chad', drawHouse({ wallTiles: 4, wallRows: 2, roof: RAMP.BLUE }));
  addPixmap(scene, 'house_a', drawHouse({ wallTiles: 3, wallRows: 2, roof: RAMP.FOREST }));
  addPixmap(scene, 'house_b', drawHouse({ wallTiles: 3, wallRows: 2, roof: RAMP.ORANGE }));
  addPixmap(scene, 'drugstore', drawHouse({ wallTiles: 5, wallRows: 2, roof: RAMP.CYAN, signText: 'DRUGS', doorAt: 2 }));
  addPixmap(scene, 'arcade', drawHouse({ wallTiles: 4, wallRows: 2, roof: RAMP.PURPLE, signText: 'STARPORT', doorAt: 1 }));
  addPixmap(scene, 'chapel', drawHouse({ wallTiles: 3, wallRows: 2, roof: RAMP.BLUE, steeple: true, doorAt: 1, windows: [0, 2] }));

  // UI
  addPixmap(scene, 'win9', drawWindowSlice());
  addPixmap(scene, 'box9', drawBoxSlice());
  addPixmap(scene, 'odo', drawOdometerStrip());
  addPixmap(scene, 'dpad', drawDpad());
  addPixmap(scene, 'btn_a', drawRoundButton('A', RAMP.RED));
  addPixmap(scene, 'btn_b', drawRoundButton('B', RAMP.BLUE));
  addPixmap(scene, 'btn_start', drawStartPill());
  addPixmap(scene, 'hand', drawHandCursor());
  addPixmap(scene, 'phone_icon', drawPhoneIcon());
  addPixmap(scene, 'swirl', makeSpiral());
  addPixmap(scene, 'title_art', drawTitleArt(GAME_W, GAME_H));
  addPixmap(scene, 'logo', drawLogo());

  // 2×2 white pixel for fades, particles, flashes
  if (!scene.textures.exists('pixel')) {
    const pmPix = new Pixmap(2, 2);
    pmPix.fill(C.white);
    scene.textures.addCanvas('pixel', pmPix.toCanvas());
  }

  // bitmap font
  if (!scene.textures.exists('fontsheet')) {
    scene.textures.addCanvas('fontsheet', makeFontSheet());
    const config: Phaser.Types.GameObjects.BitmapText.RetroFontConfig = {
      image: 'fontsheet',
      width: FONT_CELL_W,
      height: FONT_CELL_H,
      chars: FONT_CHARS,
      charsPerRow: FONT_CHARS_PER_ROW,
      'spacing.x': 0,
      'spacing.y': 0,
      'offset.x': 0,
      'offset.y': 0,
      lineSpacing: 2,
    };
    scene.cache.bitmapFont.add('retro', Phaser.GameObjects.RetroFont.Parse(scene, config));
  }
}

/** tile solidity lookup used by movement + map builder */
export const TILE_SOLID: boolean[] = TILESET.map((t) => t.solid);
export { TILE };
export const NIGHT_TINT = px(RAMP.NIGHT, 1);
