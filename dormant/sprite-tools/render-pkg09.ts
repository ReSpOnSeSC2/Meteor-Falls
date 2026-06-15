import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { C, RAMP, px } from '../../src/palette';
import { Pixmap, mulberry32 } from '../../src/spritegen/pixmap';
import { drawTextInto } from '../../src/spritegen/font';
import {
  TILE,
  TILESET,
  drawTree,
  drawPine,
  drawSign,
  drawPicnicTable,
  drawPicnicBlanket,
  drawPhoneTable,
  drawBed,
  drawDesk,
  drawSofa,
  drawCounter,
  drawBugZapper,
  drawMeteorRock,
  drawSawhorse,
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
  drawPawPrints,
  drawGiftBox,
  drawGiftBoxOpen,
  drawArcadeCabinet,
  drawLegendCabinet,
  drawCageGate,
  drawBackboardProp,
  drawCageMural,
  drawBleachers,
  drawChalkBoard,
} from '../../src/spritegen/tiles';
import {
  drawFountain,
  drawMarketStall,
  drawBananaBoat,
  drawDepartureBoard,
  drawIdolShrine,
  drawPyramidGate,
  drawMaskSwitch,
  drawPedestal,
  drawCrate,
  drawGangplank,
} from '../../src/spritegen/ch2';
import { GENERATED_BUILDINGS } from '../../src/spritegen/buildings';
import { pixmapToPng } from './png';

type Draw = () => Pixmap;

function save(rel: string, pm: Pixmap): void {
  const out = join(process.cwd(), rel);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, pixmapToPng(pm));
  console.log(rel);
}

function strip(frames: Pixmap[]): Pixmap {
  const out = new Pixmap(frames.length * TILE, TILE);
  frames.forEach((pm, i) => out.blit(pm, i * TILE, 0));
  return out;
}

const props: Record<string, Draw> = {
  tree: () => drawTree('round'),
  tree_b: () => drawTree('tall'),
  tree_c: () => drawTree('small'),
  pine: drawPine,
  sign: drawSign,
  picnic: drawPicnicTable,
  picnic_blanket: drawPicnicBlanket,
  phone_table: drawPhoneTable,
  bed: drawBed,
  desk: drawDesk,
  sofa: drawSofa,
  counter: drawCounter,
  bug_zapper: drawBugZapper,
  meteor_rock: drawMeteorRock,
  sawhorse: drawSawhorse,
  ember: drawEmber,
  lemonade: drawLemonadeStand,
  bus_sign: drawBusSign,
  doormat: drawDoormat,
  stairs: drawStairs,
  door_int: () => drawInteriorDoor(false),
  door_int_open: () => drawInteriorDoor(true),
  payphone: drawPayphone,
  dumpster: drawDumpster,
  bench: drawBench,
  hydrant: drawHydrant,
  planter: drawPlanter,
  elevator: drawElevator,
  water_cooler: drawWaterCooler,
  copier: drawCopier,
  plant_pot: drawPlantPot,
  holding_door: () => drawHoldingDoor(0),
  holding_door_1: () => drawHoldingDoor(1),
  holding_door_2: () => drawHoldingDoor(2),
  holding_door_3: () => drawHoldingDoor(3),
  quota_panel: drawQuotaPanel,
  cot: drawCot,
  office_door: drawOfficeDoor,
  bus_seat: drawBusSeat,
  bus_windows: () => drawBusWindows(352),
  skyline: drawSkyline,
  shelf: () => drawShopShelf(4),
  shelf_b: () => drawShopShelf(9),
  atm: drawAtm,
  phone_pole: drawTelephonePole,
  trash_can: drawTrashCan,
  parking_meter: drawParkingMeter,
  news_box: drawNewspaperBox,
  cola_fridge: drawColaFridge,
  dresser: drawDresser,
  tv: drawTv,
  stove: drawStove,
  bookshelf: drawBookshelf,
  floor_lamp: drawFloorLamp,
  poster_smile: drawPosterSmile,
  poster_chart: drawPosterChart,
  banner_productive: drawProductivityBanner,
  paw_prints: drawPawPrints,
  gift_box: drawGiftBox,
  gift_box_open: drawGiftBoxOpen,
  cab_a: () => drawArcadeCabinet({ marquee: RAMP.RED, screen: 0 }),
  cab_b: () => drawArcadeCabinet({ marquee: RAMP.CYAN, screen: 1 }),
  cab_c: () => drawArcadeCabinet({ marquee: RAMP.GRASS, screen: 2 }),
  cab_legend: drawLegendCabinet,
  cage_gate: drawCageGate,
  backboard: drawBackboardProp,
  cage_mural: drawCageMural,
  bleachers_a: () => drawBleachers(11),
  bleachers_b: () => drawBleachers(40),
  chalk_board: drawChalkBoard,
  fountain: drawFountain,
  market_stall_a: () => drawMarketStall(RAMP.RED),
  market_stall_b: () => drawMarketStall(RAMP.GOLD),
  market_stall_c: () => drawMarketStall(RAMP.CYAN),
  banana_boat: drawBananaBoat,
  departure_board: drawDepartureBoard,
  idol_shrine: drawIdolShrine,
  pyramid_gate: drawPyramidGate,
  mask_switch: () => drawMaskSwitch(false),
  mask_switch_lit: () => drawMaskSwitch(true),
  pedestal_0: () => drawPedestal(0),
  pedestal_1: () => drawPedestal(1),
  pedestal_2: () => drawPedestal(2),
  pedestal_3: () => drawPedestal(3),
  crate: () => drawCrate(false),
  crate_bananas: () => drawCrate(true),
  gangplank: drawGangplank,
};

const facades: Record<string, Draw> = {
  bldg_ps_mercado: () => drawCityBuilding({ wallTiles: 5, upperRows: 1, wall: RAMP.ORANGE, signText: 'MERCADO', doorAt: 2, arch: true, litSeed: 21 }),
  bldg_ps_clinic: () => drawCityBuilding({ wallTiles: 5, upperRows: 1, wall: RAMP.PAPER, signText: 'CLINICA', cross: true, doorAt: 2, arch: true, litSeed: 22 }),
  bldg_ps_pension: () => drawCityBuilding({ wallTiles: 5, upperRows: 2, wall: RAMP.GOLD, signText: 'PENSION SOL', doorAt: 2, arch: true, litSeed: 23 }),
  bldg_ps_museum: () => drawCityBuilding({ wallTiles: 6, upperRows: 2, wall: RAMP.PAPER, signText: 'MUSEO', doorAt: 3, doubleDoor: true, arch: true, litSeed: 24 }),
  bldg_ps_casa: () => drawCityBuilding({ wallTiles: 4, upperRows: 2, wall: RAMP.RED, signText: 'CASA FLOR', doorAt: 1, arch: true, litSeed: 25 }),
  bldg_ps_casa_b: () => drawCityBuilding({ wallTiles: 4, upperRows: 1, wall: RAMP.CYAN, signText: 'CASA MAR', doorAt: 1, arch: true, litSeed: 26 }),
  bldg_ps_deli: () => drawCityBuilding({ wallTiles: 4, upperRows: 1, wall: RAMP.GRASS, signText: 'DELI SOL', doorAt: 1, arch: true, litSeed: 27 }),
  bldg_ps_cantina: () => drawCityBuilding({ wallTiles: 5, upperRows: 1, wall: RAMP.PURPLE, signText: 'CANTINA', doorAt: 2, arch: true, litSeed: 28 }),
  bldg_ps_casa_c: () => drawCityBuilding({ wallTiles: 4, upperRows: 1, wall: RAMP.GOLD, signText: 'CASA LUZ', doorAt: 1, arch: true, litSeed: 29 }),
  bldg_ps_pension_b: () => drawCityBuilding({ wallTiles: 5, upperRows: 2, wall: RAMP.BLUE, signText: 'EL FARO', doorAt: 2, arch: true, litSeed: 30 }),
  bldg_ps_catedral: () => drawCityBuilding({ wallTiles: 6, upperRows: 11, wall: RAMP.PAPER, signText: 'CATEDRAL', portico: true, doubleDoor: true, arch: true, tower: true, doorAt: 3, litSeed: 31 }),
  bldg_ps_gran_hotel: () => drawCityBuilding({ wallTiles: 6, upperRows: 12, wall: RAMP.GOLD, signText: 'GRAN HOTEL', balconies: true, arch: true, tower: true, doorAt: 2, litSeed: 32 }),
  bldg_ps_aduana: () => drawCityBuilding({ wallTiles: 7, upperRows: 11, wall: RAMP.ORANGE, signText: 'ADUANA', portico: true, arch: true, tower: true, doorAt: 3, litSeed: 33 }),
  valle_shop: () => drawHouse({ wallTiles: 5, wallRows: 2, roof: RAMP.RED, signText: 'LANA', doorAt: 2, awning: RAMP.GOLD, litSeed: 61 }),
  valle_clinic: () => drawHouse({ wallTiles: 4, wallRows: 2, roof: RAMP.CYAN, signText: 'CLINICA', doorAt: 1, awning: RAMP.RED, litSeed: 62 }),
  valle_chapel: () => drawHouse({ wallTiles: 3, wallRows: 2, roof: RAMP.GOLD, steeple: true, doorAt: 1, windows: [0, 2], litSeed: 63 }),
  valle_house: () => drawHouse({ wallTiles: 3, wallRows: 2, roof: RAMP.ORANGE, chimney: true, litSeed: 64 }),
  valle_house_b: () => drawHouse({ wallTiles: 3, wallRows: 2, roof: RAMP.MAGENTA, roofStyle: 'gable', litSeed: 65 }),
  clubhouse: () => drawHouse({ wallTiles: 5, wallRows: 2, roof: RAMP.ORANGE, signText: 'LINKS', doorAt: 2, awning: RAMP.GOLD, litSeed: 44 }),
  mansion_a: () => drawHouse({ wallTiles: 7, wallRows: 3, roof: RAMP.RED, roofStyle: 'hip', chimney: true, windows: [0, 2, 4, 6], litSeed: 50 }),
  mansion_b: () => drawHouse({ wallTiles: 6, wallRows: 3, roof: RAMP.BLUE, roofStyle: 'gable', chimney: true, windows: [0, 2, 4], litSeed: 51 }),
  mansion_c: () => drawHouse({ wallTiles: 7, wallRows: 2, roof: RAMP.GOLD, roofStyle: 'hip', chimney: true, ac: true, windows: [0, 2, 4, 6], litSeed: 52 }),
  golf_gatehouse: () => drawHouse({ wallTiles: 5, wallRows: 2, roof: RAMP.PAPER, signText: 'THE LINKS', doorAt: 2, awning: RAMP.CYAN, litSeed: 53 }),
  clubhouse_grand: () => drawHouse({ wallTiles: 8, wallRows: 3, roof: RAMP.GOLD, roofStyle: 'hip', signText: 'CLUBHOUSE', doorAt: 3, awning: RAMP.GOLD, chimney: true, litSeed: 54 }),
  bldg_bagels: () => drawCityBuilding({ wallTiles: 4, upperRows: 1, wall: RAMP.ORANGE, signText: 'BAGELS', awning: RAMP.RED, doorAt: 1, litSeed: 11 }),
  bldg_starmart: () => drawCityBuilding({ wallTiles: 5, upperRows: 1, wall: RAMP.CYAN, signText: 'STARMART', awning: RAMP.BLUE, doorAt: 2, litSeed: 12 }),
  bldg_hospital: () => drawCityBuilding({ wallTiles: 7, upperRows: 2, wall: RAMP.PAPER, signText: 'BRICKTON GENERAL', cross: true, doorAt: 3, doubleDoor: true, litSeed: 13 }),
  bldg_brickmore: () => drawCityBuilding({ wallTiles: 5, upperRows: 3, wall: RAMP.RED, signText: 'THE BRICKMORE', doorAt: 2, litSeed: 14 }),
  bldg_dept: () => drawCityBuilding({ wallTiles: 8, upperRows: 2, wall: RAMP.BLUE, signText: 'DEPARTMENT OF SMILES', smiley: true, doorAt: 3, doubleDoor: true, litSeed: 15 }),
  bldg_video: () => drawCityBuilding({ wallTiles: 4, upperRows: 1, wall: RAMP.PURPLE, signText: 'VIDEO', awning: RAMP.PURPLE, doorAt: 2, litSeed: 16 }),
  bldg_bank: () => drawCityBuilding({ wallTiles: 6, upperRows: 2, wall: RAMP.PAPER, signText: 'SAVINGS & LOAN', doorAt: 2, litSeed: 17 }),
  bldg_arcade2: () => drawCityBuilding({ wallTiles: 5, upperRows: 1, wall: RAMP.PURPLE, signText: 'STARPORT II', awning: RAMP.GOLD, doorAt: 2, litSeed: 18 }),
  bldg_diner: () => drawCityBuilding({ wallTiles: 4, upperRows: 1, wall: RAMP.RED, signText: 'DINER', awning: RAMP.PAPER, doorAt: 1, litSeed: 19 }),
  bldg_apartments: () => drawCityBuilding({ wallTiles: 5, upperRows: 4, wall: RAMP.ORANGE, signText: 'THE ARMS', balconies: true, doorAt: 2, litSeed: 74 }),
  bldg_office: () => drawCityBuilding({ wallTiles: 5, upperRows: 5, wall: RAMP.CYAN, signText: 'SUITES', tower: true, doorAt: 2, litSeed: 75 }),
  bldg_civic: () => drawCityBuilding({ wallTiles: 6, upperRows: 2, wall: RAMP.PAPER, signText: 'CIVIC HALL', portico: true, doubleDoor: true, doorAt: 3, litSeed: 76 }),
  bldg_theater: () => drawCityBuilding({ wallTiles: 5, upperRows: 2, wall: RAMP.RED, signText: 'ORPHEUM', marquee: true, doubleDoor: true, doorAt: 2, litSeed: 77 }),
  bldg_market: () => drawCityBuilding({ wallTiles: 6, upperRows: 1, wall: RAMP.GOLD, signText: 'MARKET', colonnade: true, doorAt: 3, litSeed: 78 }),
  bldg_brownstone: () => drawCityBuilding({ wallTiles: 4, upperRows: 3, wall: RAMP.EARTH, signText: 'FLATS', doorAt: 1, litSeed: 79 }),
  bldg_warehouse: () => drawCityBuilding({ wallTiles: 8, upperRows: 1, wall: RAMP.PAPER, signText: 'DEPOT', doubleDoor: true, doorAt: 4, litSeed: 80 }),
  bldg_neon: () => drawCityBuilding({ wallTiles: 4, upperRows: 2, wall: RAMP.NIGHT, signText: 'NEON', neon: true, doorAt: 1, litSeed: 81 }),
  bldg_deptstore: () => drawCityBuilding({ wallTiles: 8, upperRows: 3, wall: RAMP.PURPLE, signText: 'GRANDE', doubleDoor: true, doorAt: 4, litSeed: 82 }),
  bldg_tower_glass: () => drawCityBuilding({ wallTiles: 6, upperRows: 12, wall: RAMP.BLUE, signText: 'MERIDIAN', tower: true, doubleDoor: true, doorAt: 2, litSeed: 71 }),
  bldg_tower_arms: () => drawCityBuilding({ wallTiles: 6, upperRows: 12, wall: RAMP.RED, signText: 'EMBERTON', tower: true, balconies: true, doorAt: 2, litSeed: 72 }),
  bldg_tower_corp: () => drawCityBuilding({ wallTiles: 7, upperRows: 13, wall: RAMP.NIGHT, signText: 'OMNICORP', tower: true, neon: true, doubleDoor: true, doorAt: 3, litSeed: 73 }),
  house_rex: () => drawHouse({ wallTiles: 4, wallRows: 2, roof: RAMP.RED, chimney: true, ac: true, litSeed: 5 }),
  house_chad: () => drawHouse({ wallTiles: 4, wallRows: 2, roof: RAMP.BLUE, roofStyle: 'gable', litSeed: 8 }),
  house_a: () => drawHouse({ wallTiles: 3, wallRows: 2, roof: RAMP.FOREST, roofStyle: 'gable', ac: true, litSeed: 13 }),
  house_b: () => drawHouse({ wallTiles: 3, wallRows: 2, roof: RAMP.ORANGE, chimney: true, litSeed: 21 }),
  drugstore: () => drawHouse({ wallTiles: 5, wallRows: 2, roof: RAMP.CYAN, signText: 'DRUGS', doorAt: 2, awning: RAMP.RED, litSeed: 34 }),
  arcade: () => drawHouse({ wallTiles: 4, wallRows: 2, roof: RAMP.PURPLE, signText: 'STARPORT', doorAt: 1, awning: RAMP.PURPLE, litSeed: 55 }),
  chapel: () => drawHouse({ wallTiles: 3, wallRows: 2, roof: RAMP.BLUE, steeple: true, doorAt: 1, windows: [0, 2], litSeed: 89 }),
};

for (const b of GENERATED_BUILDINGS) {
  facades[b.name] ??= () => drawCityBuilding(b.opts);
}

function sky(pm: Pixmap, top: number, mid: number, low: number): void {
  pm.rect(0, 0, pm.w, Math.floor(pm.h * 0.45), top);
  pm.rect(0, Math.floor(pm.h * 0.35), pm.w, Math.floor(pm.h * 0.35), mid);
  pm.rect(0, Math.floor(pm.h * 0.65), pm.w, pm.h, low);
}

function hills(pm: Pixmap, ramp: number, yBase: number, seed: number): void {
  const rng = mulberry32(seed);
  for (let x = 0; x < pm.w; x++) {
    const y = Math.floor(yBase - Math.sin((x / pm.w) * Math.PI * 2.2) * 16 - Math.sin((x / pm.w) * Math.PI * 5.7 + rng()) * 5);
    pm.vline(x, y, pm.h - y, px(ramp, 0));
  }
}

function street(pm: Pixmap, y: number): void {
  pm.rect(0, y, pm.w, pm.h - y, px(RAMP.INK, 2));
  for (let yy = y + 20; yy < pm.h; yy += 28) {
    for (let x = 8; x < pm.w; x += 58) pm.hline(x, yy, 28, px(RAMP.GOLD, 2));
  }
}

function foregroundTrees(pm: Pixmap, ramp: number, seed: number): void {
  const rng = mulberry32(seed);
  for (let x = -12; x < pm.w + 18; x += 38) {
    const h = 32 + Math.floor(rng() * 30);
    pm.litRect(x + 10, 152 - h, 10, h, RAMP.EARTH).outline(C.outline);
    pm.litEllipse(x + 15, 145 - h, 26, 19, ramp).outline(C.outline);
  }
}

function drawBackdrop(kind: 'otterbrook' | 'brickton' | 'jungle' | 'england' | 'school'): Pixmap {
  const pm = new Pixmap(400, 225);
  if (kind === 'otterbrook') {
    sky(pm, px(RAMP.BLUE, 2), px(RAMP.CYAN, 2), px(RAMP.GRASS, 1));
    hills(pm, RAMP.FOREST, 144, 11);
    pm.rect(0, 166, 400, 59, px(RAMP.GRASS, 2));
    foregroundTrees(pm, RAMP.GRASS, 12);
    pm.litRect(250, 118, 86, 46, RAMP.RED).outline(C.outline);
    pm.litRect(76, 128, 62, 36, RAMP.BLUE).outline(C.outline);
  } else if (kind === 'brickton') {
    sky(pm, px(RAMP.NIGHT, 1), px(RAMP.BLUE, 0), px(RAMP.INK, 2));
    street(pm, 158);
    const rng = mulberry32(90);
    for (let x = 8; x < 386;) {
      const w = 28 + Math.floor(rng() * 26);
      const h = 52 + Math.floor(rng() * 78);
      const ramp = [RAMP.BLUE, RAMP.CYAN, RAMP.PURPLE, RAMP.PAPER][Math.floor(rng() * 4)];
      pm.litRect(x, 158 - h, w, h, ramp).outline(C.outline);
      for (let wy = 158 - h + 10; wy < 150; wy += 14) {
        for (let wx = x + 7; wx < x + w - 5; wx += 12) if (rng() > 0.5) pm.rect(wx, wy, 5, 7, px(RAMP.GOLD, 2));
      }
      x += w + 5;
    }
  } else if (kind === 'jungle') {
    sky(pm, px(RAMP.CYAN, 1), px(RAMP.GRASS, 0), px(RAMP.FOREST, 0));
    hills(pm, RAMP.GRASS, 134, 33);
    pm.rect(0, 162, 400, 63, px(RAMP.FOREST, 1));
    foregroundTrees(pm, RAMP.FOREST, 44);
    for (let x = 0; x < 400; x += 42) pm.line(x, 42, x + 62, 174, px(RAMP.FOREST, 2));
    pm.litRect(150, 130, 104, 34, RAMP.GOLD).outline(C.outline);
  } else if (kind === 'england') {
    sky(pm, px(RAMP.PAPER, 1), px(RAMP.CYAN, 0), px(RAMP.EARTH, 0));
    hills(pm, RAMP.EARTH, 142, 50);
    pm.rect(0, 164, 400, 61, px(RAMP.GRASS, 0));
    for (let x = 18; x < 380; x += 72) {
      pm.litRect(x, 120, 52, 44, RAMP.EARTH).outline(C.outline);
      pm.litRect(x + 14, 92, 20, 30, RAMP.PAPER).outline(C.outline);
    }
    pm.rect(0, 154, 400, 5, px(RAMP.PAPER, 2));
  } else {
    sky(pm, px(RAMP.NIGHT, 0), px(RAMP.BLUE, 0), px(RAMP.PAPER, 0));
    pm.litRect(55, 82, 290, 86, RAMP.PAPER).outline(C.outline);
    pm.litRect(176, 38, 48, 130, RAMP.NIGHT).outline(C.outline);
    for (let x = 86; x < 322; x += 36) {
      pm.rect(x, 106, 16, 21, px(RAMP.CYAN, 1));
      pm.hline(x + 2, 109, 12, px(RAMP.CYAN, 3));
    }
    pm.rect(0, 168, 400, 57, px(RAMP.INK, 2));
    drawTextInto(pm, 'WINTERMOOR', 166, 151, px(RAMP.GOLD, 3));
  }
  pm.frame(0, 0, pm.w, pm.h, C.outline);
  return pm;
}

function renderAll(): void {
  save('assets/art/world/otterbrook_tiles_16.png', strip(TILESET.map((tile) => tile.make())));
  for (const [name, draw] of Object.entries(props)) save(`assets/art/world/props/${name}.png`, draw());
  for (const [name, draw] of Object.entries(facades)) save(`assets/art/world/facades/${name}.png`, draw());
  for (const area of ['otterbrook', 'brickton', 'jungle', 'england', 'school'] as const) {
    save(`assets/art/backgrounds/${area}.png`, drawBackdrop(area));
  }
  console.log(`pkg09: ${TILESET.length} tiles, ${Object.keys(props).length} props, ${Object.keys(facades).length} facades, 5 battle backgrounds`);
}

renderAll();
