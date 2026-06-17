/**
 * Engine-faithful FOOTPRINT renderer (offline "playtest" for alignment/collision,
 * no browser). Draws a map's ground grid, each house/facade's DRAWN texture rect
 * (real size) and its COLLISION rect (the engine's rule), so overlaps + collision
 * drift are visible. Houses are procedural (drawHouse) → measured here; authored
 * facades (bldg_ keys) read their PNG header. Design-review aid only.
 */
import { MAPS } from '../src/data/maps';
import { drawHouse } from '../src/spritegen/tiles';
import { RAMP } from '../src/palette';
import { makeImg, encodePng, type Img } from './imageio';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';

const TILE = 16, RT = 64, SCALE4 = 4;
const DISP = 0.22; // shrink the ×4 world so the PNG is viewable

// real house native sizes (measured via drawHouse) by sprite key
const HOUSE_OPTS: Record<string, any> = {
  house_rex: { wallTiles: 4, wallRows: 2, roof: RAMP.RED, chimney: true, ac: true, litSeed: 5 },
  house_chad: { wallTiles: 4, wallRows: 2, roof: RAMP.BLUE, roofStyle: 'gable', litSeed: 8 },
  house_a: { wallTiles: 3, wallRows: 2, roof: RAMP.FOREST, roofStyle: 'gable', ac: true, litSeed: 13 },
  house_b: { wallTiles: 3, wallRows: 2, roof: RAMP.ORANGE, chimney: true, litSeed: 21 },
};
const texCache: Record<string, { w: number; h: number }> = {};
function texSizeRT(sprite: string): { w: number; h: number } | null {
  if (texCache[sprite]) return texCache[sprite];
  if (HOUSE_OPTS[sprite]) {
    const pm: any = (drawHouse as any)(HOUSE_OPTS[sprite]);
    return (texCache[sprite] = { w: pm.w * SCALE4, h: pm.h * SCALE4 });
  }
  // authored facade PNG?
  for (const dir of ['world/facades', 'world/props', 'world']) {
    const p = `assets/art/${dir}/${sprite}.png`;
    if (existsSync(p)) {
      const b = readFileSync(p);
      return (texCache[sprite] = { w: b.readUInt32BE(16), h: b.readUInt32BE(20) });
    }
  }
  return null;
}

type RGB = [number, number, number];
function px(img: Img, x: number, y: number, c: RGB, a = 1) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= img.w || y >= img.h) return;
  const i = (y * img.w + x) * 4;
  img.data[i] = Math.round(img.data[i] * (1 - a) + c[0] * a);
  img.data[i + 1] = Math.round(img.data[i + 1] * (1 - a) + c[1] * a);
  img.data[i + 2] = Math.round(img.data[i + 2] * (1 - a) + c[2] * a);
  img.data[i + 3] = 255;
}
function fill(img: Img, x: number, y: number, w: number, h: number, c: RGB, a = 1) {
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) px(img, x + xx, y + yy, c, a);
}
function rect(img: Img, x: number, y: number, w: number, h: number, c: RGB) {
  for (let xx = 0; xx < w; xx++) { px(img, x + xx, y, c); px(img, x + xx, y + h - 1, c); }
  for (let yy = 0; yy < h; yy++) { px(img, x, y + yy, c); px(img, x + w - 1, y + yy, c); }
}

function render(mapId: string): Img {
  const m = MAPS[mapId];
  const gw = m.grid[0].length, gh = m.grid.length;
  const W = Math.round(gw * RT * DISP), H = Math.round(gh * RT * DISP) + 30;
  const img = makeImg(W, H);
  fill(img, 0, 0, W, H, [22, 24, 30]);
  // ground grid
  for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
    const ch = m.grid[y][x];
    const c: RGB = ch === ':' ? [150, 130, 90] : ch === '.' || ch === ' ' || ch === ',' || ch === '~' ? [60, 96, 52] : ch === '-' || ch === '|' || ch === 'b' ? [40, 70, 40] : [50, 70, 48];
    fill(img, x * RT * DISP, 30 + y * RT * DISP, Math.ceil(RT * DISP), Math.ceil(RT * DISP), c);
  }
  // faint tile grid
  for (let x = 0; x <= gw; x += 2) for (let y = 0; y < gh * RT * DISP; y++) px(img, x * RT * DISP, 30 + y, [80, 80, 88], 0.15);
  // props: drawn rect (cyan) + collision rect (red)
  for (const p of m.props) {
    const tex = texSizeRT(p.sprite);
    const baseX = p.x * RT * DISP, baseY = 30 + p.y * RT * DISP;
    if (tex) {
      const dw = tex.w * DISP, dh = tex.h * DISP;
      fill(img, baseX, baseY, dw, dh, [90, 150, 200], 0.30);
      rect(img, baseX, baseY, Math.max(2, dw), Math.max(2, dh), [120, 200, 255]); // DRAWN sprite
    }
    if (p.solid) {
      const cx = baseX + p.solid.ox * SCALE4 * DISP, cy = baseY + p.solid.oy * SCALE4 * DISP;
      rect(img, cx, cy, Math.max(2, p.solid.w * SCALE4 * DISP), Math.max(2, p.solid.h * SCALE4 * DISP), [240, 70, 70]); // COLLISION
    }
  }
  return img;
}

mkdirSync('output', { recursive: true });
for (const id of (process.argv[2] ?? 'hill_road,otterbrook,hickory_trail,whisperwood_rise').split(',')) {
  if (!MAPS[id]) { console.log('no map', id); continue; }
  const img = render(id);
  writeFileSync(`output/collision_${id}.png`, encodePng(img));
  console.log('wrote', `output/collision_${id}.png`, img.w + 'x' + img.h);
}
