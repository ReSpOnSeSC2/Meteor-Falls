import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { C, RAMP, T, px } from '../src/palette';
import { Pixmap } from '../src/spritegen/pixmap';
import { drawHeldWeapon, WEAPON_ART, type HeldPose, type TorsoArt, type WeaponArt } from '../src/spritegen/weapons';
import { drawVehicleViews, VEHICLE_CATALOG } from '../src/spritegen/vehicles';
import { drawBananaBoat, generateLlamaFrames } from '../src/spritegen/ch2';
import { DEALERSHIP } from '../src/data/dealership';
import { FLEET_CRAFT } from '../src/data/fleet';
import { THE_LONG_SHOT } from '../src/data/rocket';
import { pkg07VehicleArtIds } from '../src/data/pkg07';
import { pixmapToPng } from './png';

const VEHICLE_DIR = 'assets/art/vehicles';
const WEAPON_DIR = 'assets/art/weapons';

function save(rel: string, pm: Pixmap): void {
  const out = join(process.cwd(), rel);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, pixmapToPng(pm));
}

function blit(dst: Pixmap, src: Pixmap, dx: number, dy: number): void {
  for (let y = 0; y < src.h; y++) {
    for (let x = 0; x < src.w; x++) {
      const c = src.get(x, y);
      if (c !== T) dst.set(dx + x, dy + y, c);
    }
  }
}

function padBottomCenter(src: Pixmap, w: number, h: number): Pixmap {
  if (src.w === w && src.h === h) return src;
  const out = new Pixmap(w, h);
  blit(out, src, Math.floor((w - src.w) / 2), h - src.h);
  return out;
}

function sheet(frames: Pixmap[]): Pixmap {
  const w = Math.max(...frames.map((f) => f.w));
  const h = Math.max(...frames.map((f) => f.h));
  const out = new Pixmap(w * frames.length, h);
  frames.map((f) => padBottomCenter(f, w, h)).forEach((f, i) => blit(out, f, i * w, 0));
  return out;
}

function facingSheet(frames: Pixmap[]): Pixmap {
  const right = frames[0];
  const down = frames[1] ?? frames[0];
  const left = frames[0].flipX();
  const up = frames[2] ?? frames[0];
  return sheet([right, down, left, up]);
}

function oneOfType(id: string, type: string): Pixmap[] {
  const variants = VEHICLE_CATALOG.filter((v) => v.type === type);
  if (!variants.length) return [new Pixmap(8, 8)];
  let hash = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return drawVehicleViews(variants[hash % variants.length].name);
}

function drawTrain(kind: 'night' | 'orient'): Pixmap {
  const pm = new Pixmap(76, 30);
  const body = kind === 'night' ? RAMP.NIGHT : RAMP.PURPLE;
  const trim = kind === 'night' ? RAMP.RED : RAMP.GOLD;
  pm.rect(1, 19, 74, 4, px(RAMP.INK, 1));
  pm.litRect(5, 8, 60, 12, body);
  pm.litRect(63, 11, 10, 9, body);
  pm.hline(6, 9, 56, px(trim, 3));
  for (let x = 10; x < 58; x += 12) pm.rect(x, 11, 6, 5, px(RAMP.GOLD, 2));
  pm.rect(67, 6, 4, 5, px(RAMP.INK, 2));
  pm.sphere(14, 23, 3, RAMP.INK);
  pm.sphere(38, 23, 3, RAMP.INK);
  pm.sphere(62, 23, 3, RAMP.INK);
  pm.finish({ aa: false });
  pm.shadowUnder(38, 28, 31, C.inkSoft);
  return pm;
}

function drawRiverboat(): Pixmap {
  const pm = new Pixmap(84, 38);
  pm.contour(42, 23, [34, 37, 38, 37, 34, 28], px(RAMP.PAPER, 2));
  pm.hline(7, 23, 70, px(RAMP.PAPER, 3));
  pm.hline(9, 28, 66, px(RAMP.PAPER, 1));
  pm.litRect(21, 9, 40, 14, RAMP.PAPER);
  for (let x = 25; x < 56; x += 8) pm.rect(x, 13, 4, 4, px(RAMP.CYAN, 2));
  pm.rect(27, 2, 5, 10, px(RAMP.RED, 2));
  pm.rect(50, 2, 5, 10, px(RAMP.RED, 2));
  pm.hline(24, 7, 34, px(RAMP.INK, 1));
  pm.finish({ aa: false });
  pm.hline(4, 31, 76, px(RAMP.CYAN, 2));
  return pm;
}

function drawSnowcat(): Pixmap {
  const pm = new Pixmap(58, 26);
  pm.rect(4, 17, 48, 6, px(RAMP.INK, 1));
  for (let x = 7; x < 48; x += 6) pm.set(x, 20, px(RAMP.PAPER, 2));
  pm.litRect(8, 9, 34, 9, RAMP.RED);
  pm.litRect(34, 5, 13, 12, RAMP.PAPER);
  pm.rect(37, 8, 7, 5, px(RAMP.CYAN, 2));
  pm.litRect(47, 12, 8, 5, RAMP.GOLD);
  pm.finish({ aa: false });
  pm.shadowUnder(29, 25, 23, C.inkSoft);
  return pm;
}

function drawYakExpress(): Pixmap {
  const pm = new Pixmap(46, 30);
  pm.litEllipse(21, 17, 15, 8, RAMP.EARTH);
  pm.litEllipse(34, 10, 7, 6, RAMP.EARTH);
  pm.line(30, 5, 24, 1, px(RAMP.PAPER, 2));
  pm.line(37, 5, 43, 1, px(RAMP.PAPER, 2));
  pm.rect(13, 11, 16, 6, px(RAMP.RED, 2));
  pm.hline(13, 11, 16, px(RAMP.GOLD, 3));
  pm.vline(12, 21, 7, px(RAMP.EARTH, 1));
  pm.vline(20, 22, 6, px(RAMP.EARTH, 0));
  pm.vline(28, 21, 7, px(RAMP.EARTH, 1));
  pm.set(37, 10, C.outline);
  pm.finish();
  pm.shadowUnder(22, 29, 16, C.inkSoft);
  return pm;
}

function drawTorsoArt(art: TorsoArt): Pixmap {
  const pm = new Pixmap(18, 22);
  pm.litRect(5, 5, 8, 12, art.ramp);
  pm.rect(3, 7, 3, 8, px(art.trim, 2));
  pm.rect(12, 7, 3, 8, px(art.trim, 2));
  pm.hline(5, 5, 8, px(art.trim, 3));
  pm.set(8, 8, px(art.trim, 3));
  pm.finish({ aa: false });
  return pm;
}

function drawHeldSheet(art: Extract<WeaponArt, { kind: 'held' }>): Pixmap {
  const poses: HeldPose[] = ['rest', 'back', 'strike', 'aim', 'recoil'];
  return sheet(poses.map((pose) => {
    const pm = new Pixmap(28, 36);
    drawHeldWeapon({ pm, gx: 14, gy: 19, pose }, art);
    return pm;
  }));
}

function drawWeaponAsset(art: WeaponArt): Pixmap {
  switch (art.kind) {
    case 'held':
      return drawHeldSheet(art);
    case 'torso':
      return drawTorsoArt(art);
    case 'trinket':
      return art.icon();
  }
}

function vehicleFrames(id: string): Pixmap[] {
  const dealership = DEALERSHIP[id];
  if (dealership) return oneOfType(id, dealership.vehicleType);
  const fleet = FLEET_CRAFT[id];
  if (fleet) return oneOfType(id, fleet.vehicleType);
  if (id === THE_LONG_SHOT.id || id === 'rocket') return oneOfType(id, THE_LONG_SHOT.vehicleType);
  if (id === 'boat' || id === 'banana_boat') return [drawBananaBoat()];
  if (id === 'biplane' || id === 'lucille') return oneOfType(id, 'small_plane');
  if (id === 'train' || id === 'night_train') return [drawTrain('night')];
  if (id === 'orient_less_express') return [drawTrain('orient')];
  if (id === 'riverboat') return [drawRiverboat()];
  if (id === 'yak_express') return [drawYakExpress()];
  if (id === 'snowcat') return [drawSnowcat()];
  if (id === 'llama') return generateLlamaFrames();
  return [new Pixmap(8, 8)];
}

function renderVehicles(): number {
  let count = 0;
  for (const id of pkg07VehicleArtIds()) {
    save(`${VEHICLE_DIR}/${id}.png`, facingSheet(vehicleFrames(id)));
    count++;
  }
  return count;
}

function renderWeapons(): number {
  let count = 0;
  mkdirSync(WEAPON_DIR, { recursive: true });
  for (const [id, art] of Object.entries(WEAPON_ART).sort(([a], [b]) => a.localeCompare(b))) {
    save(`${WEAPON_DIR}/${id}.png`, drawWeaponAsset(art));
    count++;
  }
  return count;
}

const vehicles = renderVehicles();
const weapons = renderWeapons();
console.log(`pkg07: exported ${vehicles} vehicle sheets to ${VEHICLE_DIR}/`);
console.log(`pkg07: exported ${weapons} weapon/charm sheets to ${WEAPON_DIR}/`);
