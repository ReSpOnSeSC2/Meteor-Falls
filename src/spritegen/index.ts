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
import { generateBustFrames, drawThoughtFood, drawHexPip } from './busts';
import {
  generateBattlerFrames,
  battlerSheetKey,
  bustSheetKey,
  type BattlerLook,
  type WearTier,
} from './battlers';
import {
  ENEMY_BATTLE_ART,
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
  drawPine,
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
  drawInteriorDoor,
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
  drawQuotaPanel,
  drawCot,
  drawOfficeDoor,
  drawBusSeat,
  drawBusWindows,
  drawSkyline,
  drawShopShelf,
  drawAtm,
  drawTelephonePole,
  drawTrashCan,
  drawParkingMeter,
  drawNewspaperBox,
  drawColaFridge,
  drawDresser,
  drawTv,
  drawStove,
  drawBookshelf,
  drawFloorLamp,
  drawPosterSmile,
  drawPosterChart,
  drawProductivityBanner,
  drawDustFrames,
  drawSparkFrames,
  drawPawPrints,
  drawGiftBox,
  drawGiftBoxOpen,
  drawArcadeCabinet,
  drawLegendCabinet,
  drawCageGate,
  drawBackboardProp,
  drawBleachers,
  drawChalkBoard,
} from './tiles';
import {
  generateAthleteFrames,
  deriveOpponentSpec,
  drawBall,
  drawAthleteShadow,
  drawHoopSide,
  drawCageCourt,
} from './athletes';
import { TEAMS, hashOf } from '../data/hoops';
import {
  drawArcadeShip,
  drawArcadeMoth,
  drawArcadeRock,
  drawArcadeSaucer,
  drawArcadeCorndog,
  drawArcadeBolt,
  drawScanline,
} from './arcade';
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
    const walkKey = `${id}-walk-${dir}`;
    if (!scene.anims.exists(walkKey)) {
      scene.anims.create({
        key: walkKey,
        frames: [0, 1, 2, 3].map((f) => ({ key: id, frame: d * 4 + f })),
        frameRate: 8,
        repeat: -1,
      });
    }
    // S9b: the RUN cycle resequences the SAME sheet — both step poses with
    // no neutral frame between them. Poses 1/3 carry the +1px body bob, so
    // a runner stays risen on the balls of the feet: a sprint, not a fast
    // walk. Sheet order, frame size, and standFrame() remain ADR-009/022
    // law — adding drawn frames is its own future pass.
    const runKey = `${id}-run-${dir}`;
    if (!scene.anims.exists(runKey)) {
      scene.anims.create({
        key: runKey,
        frames: [1, 3].map((f) => ({ key: id, frame: d * 4 + f })),
        frameRate: 11,
        repeat: -1,
      });
    }
  });
}

/** frame index for standing still, given facing */
export function standFrame(facing: Facing): number {
  return DIRS.indexOf(facing) * 4;
}

/**
 * S11b battle-art factory: the bust (18 frames) and rear-3/4 stage battler
 * (14 frames) for one hero's LOOK — equipped weapon composed into the swing,
 * body gear on both torsos — at all three wear tiers. addSheet caches by
 * texture key, so calling this every battle create costs nothing after the
 * first; boot pre-warms the bare look. Zero per-frame draws (Prompt 42).
 */
export function ensureBattleArt(scene: Phaser.Scene, heroId: string, look: BattlerLook): void {
  const spec = CAST[heroId];
  for (const wear of [0, 1, 2] as WearTier[]) {
    addSheet(scene, bustSheetKey(heroId, look.body, wear), generateBustFrames(spec, look.body, wear), 4);
    addSheet(scene, battlerSheetKey(heroId, look, wear), generateBattlerFrames(spec, look, wear), 4);
  }
}

/**
 * S12 sport-sheet factory (ADR-033): athletes generate ON MATCH START for
 * the ten (or six) actually playing — the ensureBattleArt stance; a full
 * 31-team boot sweep would cost seconds for fives most saves never meet.
 * Heroes and walk-ons play as their CAST selves; opponents derive hashed
 * faces (ADR-022 variety) dressed in their TEAMS jersey. Cached by key.
 */
export function ensureAthleteArt(scene: Phaser.Scene, keys: string[]): void {
  for (const key of keys) {
    if (scene.textures.exists(key)) continue;
    if (key.startsWith('athlete_opp_')) {
      const m = /^athlete_opp_(.+)_(\d)$/.exec(key);
      if (!m) continue;
      const team = TEAMS[m[1]];
      if (!team) continue;
      const spec = deriveOpponentSpec(hashOf(team.id), Number(m[2]), team.jersey);
      addSheet(scene, key, generateAthleteFrames(spec, { ramp: team.jersey, trim: RAMP.PAPER }), 5);
    } else {
      const castId = key.replace(/^athlete_/, '');
      const spec = CAST[castId];
      if (!spec) continue;
      addSheet(scene, key, generateAthleteFrames(spec, null), 5);
    }
  }
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
  // S7c: each hero mourns as THEMSELF (§A4.7) — skin/hair/signature from the
  // CAST spec. Visual only: OverworldScene falls back to plain 'angel'.
  // S11: and each hero FIGHTS as themself — the party-card battle bust sheet
  // (32×32 × 18 states) derives from the same spec, the ADR-021 pattern.
  // S11b: plus the bare-look battle art (bust wear tiers + the rear-3/4
  // stage battler); equipped looks materialize through ensureBattleArt at
  // battle create — same factory, cached textures, zero per-frame draws.
  for (const heroId of ['rex', 'faye', 'milo', 'dorin']) {
    addSheet(scene, `angel_${heroId}`, generateAngelFrames(CAST[heroId]), 2);
    addSheet(scene, `bust_${heroId}`, generateBustFrames(CAST[heroId]), 4);
    ensureBattleArt(scene, heroId, { weapon: null, body: null });
  }
  // the Homesick thought-bubble that haunts Jay's card (§A4.8, S11)
  addPixmap(scene, 'thought_food', drawThoughtFood());
  // the hex PIP — the first GOOD-status indicator (S11b: shield/mirror
  // turns remaining ride the card opposite the ailment row; tinted at use)
  addPixmap(scene, 'hex_pip', drawHexPip());
  for (const angelKey of ['angel', 'angel_rex', 'angel_faye', 'angel_milo', 'angel_dorin']) {
    if (!scene.anims.exists(`${angelKey}-float`)) {
      scene.anims.create({
        key: `${angelKey}-float`,
        frames: [0, 1].map((f) => ({ key: angelKey, frame: f })),
        frameRate: 4,
        repeat: -1,
      });
    }
  }
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
  // the dog sheet's back half is the westbound trot (frames 2,3 = flips)
  if (!scene.anims.exists('dog-walk-left')) {
    scene.anims.create({
      key: 'dog-walk-left',
      frames: [2, 3].map((f) => ({ key: 'dog', frame: f })),
      frameRate: 6,
      repeat: -1,
    });
  }

  // enemy battle sprites — all three S11b wear tiers at boot (ADR-002);
  // BattleScene swaps `${sprite}_w1/_w2` as the hp thresholds fall
  for (const row of Object.values(ENEMY_BATTLE_ART)) {
    addPixmap(scene, row.sprite, row.draw(0));
    addPixmap(scene, `${row.sprite}_w1`, row.draw(1));
    addPixmap(scene, `${row.sprite}_w2`, row.draw(2));
  }

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
  addPixmap(scene, 'tree', drawTree('round'));
  addPixmap(scene, 'tree_b', drawTree('tall'));
  addPixmap(scene, 'tree_c', drawTree('small'));
  addPixmap(scene, 'pine', drawPine());
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
  // S11b: a doorway through a wall is a DOOR, not a mat (user law) —
  // closed + open variants; OverworldScene swings them on entry
  addPixmap(scene, 'door_int', drawInteriorDoor(false));
  addPixmap(scene, 'door_int_open', drawInteriorDoor(true));

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
  // S2: the PRODUCTIVITY LOCK lights a pip per defeated floor-3 patrol
  addPixmap(scene, 'holding_door', drawHoldingDoor(0));
  addPixmap(scene, 'holding_door_1', drawHoldingDoor(1));
  addPixmap(scene, 'holding_door_2', drawHoldingDoor(2));
  addPixmap(scene, 'holding_door_3', drawHoldingDoor(3));
  addPixmap(scene, 'quota_panel', drawQuotaPanel());
  addPixmap(scene, 'cot', drawCot());
  addPixmap(scene, 'office_door', drawOfficeDoor());
  addPixmap(scene, 'bus_seat', drawBusSeat());
  addPixmap(scene, 'bus_windows', drawBusWindows(352));
  addPixmap(scene, 'skyline', drawSkyline());

  // S4: shop interiors + the Savings & Loan ATM
  addPixmap(scene, 'shelf', drawShopShelf(4));
  addPixmap(scene, 'shelf_b', drawShopShelf(9));
  addPixmap(scene, 'atm', drawAtm());

  // S7: 90s street furniture, home furnishings, office decor, juice sheets
  addPixmap(scene, 'phone_pole', drawTelephonePole());
  addPixmap(scene, 'trash_can', drawTrashCan());
  addPixmap(scene, 'parking_meter', drawParkingMeter());
  addPixmap(scene, 'news_box', drawNewspaperBox());
  addPixmap(scene, 'cola_fridge', drawColaFridge());
  addPixmap(scene, 'dresser', drawDresser());
  addPixmap(scene, 'tv', drawTv());
  addPixmap(scene, 'stove', drawStove());
  addPixmap(scene, 'bookshelf', drawBookshelf());
  addPixmap(scene, 'floor_lamp', drawFloorLamp());
  addPixmap(scene, 'poster_smile', drawPosterSmile());
  addPixmap(scene, 'poster_chart', drawPosterChart());
  addPixmap(scene, 'banner_productive', drawProductivityBanner());
  addSheet(scene, 'dust', drawDustFrames(), 2);
  addSheet(scene, 'spark', drawSparkFrames(), 2);
  // S9: Biscuit's sniff-clue trail marks (§A10 #1)
  addPixmap(scene, 'paw_prints', drawPawPrints());
  // S9b: the twins' presents (Prompt 19 gift boxes — closed/opened pair)
  addPixmap(scene, 'gift_box', drawGiftBox());
  addPixmap(scene, 'gift_box_open', drawGiftBoxOpen());
  // S10: the STARPORT floors — three attract-screen variants + THE machine
  addPixmap(scene, 'cab_a', drawArcadeCabinet({ marquee: RAMP.RED, screen: 0 }));
  addPixmap(scene, 'cab_b', drawArcadeCabinet({ marquee: RAMP.CYAN, screen: 1 }));
  addPixmap(scene, 'cab_c', drawArcadeCabinet({ marquee: RAMP.GRASS, screen: 2 }));
  addPixmap(scene, 'cab_legend', drawLegendCabinet());
  // …and what THE machine shows you once you're inside it (ArcadeScene)
  addPixmap(scene, 'arc_ship', drawArcadeShip());
  addPixmap(scene, 'arc_moth', drawArcadeMoth());
  addPixmap(scene, 'arc_rock', drawArcadeRock());
  addPixmap(scene, 'arc_saucer', drawArcadeSaucer());
  addPixmap(scene, 'arc_corndog', drawArcadeCorndog());
  addPixmap(scene, 'arc_bolt', drawArcadeBolt());
  addPixmap(scene, 'arc_scanline', drawScanline());

  // S12: THE CAGE — the venue (the_cage map) + the match scene's fixtures.
  // Athlete sheets are NOT swept here: ensureAthleteArt generates the ten
  // who actually play at match start (the ensureBattleArt stance).
  addPixmap(scene, 'cage_gate', drawCageGate());
  addPixmap(scene, 'backboard', drawBackboardProp());
  addPixmap(scene, 'bleachers_a', drawBleachers(11));
  addPixmap(scene, 'bleachers_b', drawBleachers(40));
  addPixmap(scene, 'chalk_board', drawChalkBoard());
  addPixmap(scene, 'hoop_ball', drawBall());
  addPixmap(scene, 'athlete_shadow', drawAthleteShadow());
  addSheet(scene, 'hoop_side', [drawHoopSide(0), drawHoopSide(1), drawHoopSide(2)], 3);
  addPixmap(scene, 'cage_court', drawCageCourt());

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

  // buildings — deep oblique roofs, gablets, AC, awnings (ADR-019/020)
  addPixmap(scene, 'house_rex', drawHouse({ wallTiles: 4, wallRows: 2, roof: RAMP.RED, chimney: true, ac: true, litSeed: 5 }));
  addPixmap(scene, 'house_chad', drawHouse({ wallTiles: 4, wallRows: 2, roof: RAMP.BLUE, roofStyle: 'gable', litSeed: 8 }));
  addPixmap(scene, 'house_a', drawHouse({ wallTiles: 3, wallRows: 2, roof: RAMP.FOREST, roofStyle: 'gable', ac: true, litSeed: 13 }));
  addPixmap(scene, 'house_b', drawHouse({ wallTiles: 3, wallRows: 2, roof: RAMP.ORANGE, chimney: true, litSeed: 21 }));
  addPixmap(scene, 'drugstore', drawHouse({ wallTiles: 5, wallRows: 2, roof: RAMP.CYAN, signText: 'DRUGS', doorAt: 2, awning: RAMP.RED, litSeed: 34 }));
  addPixmap(scene, 'arcade', drawHouse({ wallTiles: 4, wallRows: 2, roof: RAMP.PURPLE, signText: 'STARPORT', doorAt: 1, awning: RAMP.PURPLE, litSeed: 55 }));
  addPixmap(scene, 'chapel', drawHouse({ wallTiles: 3, wallRows: 2, roof: RAMP.BLUE, steeple: true, doorAt: 1, windows: [0, 2], litSeed: 89 }));

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
