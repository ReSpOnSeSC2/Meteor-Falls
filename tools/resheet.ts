/**
 * tools/resheet.ts — AUTHORED-ART pipeline (ADR-109).
 *
 * Takes a ChatGPT/imagegen sprite STRIP or loose sheet (RGBA PNG, usually with
 * uneven spacing) and re-packs the frames into the exact grid the engine reads —
 * N columns × a fixed cell — at the 4× HD runtime size. Robust to imagegen:
 *   • frames are split at the WIDEST transparent gaps (survives irregular spacing
 *     and ignores small gaps inside a figure, e.g. between the legs),
 *   • a GLOBAL scale + a SHARED baseline are used, so the character stays one
 *     consistent size and airborne poses (a jump/dunk) stay airborne instead of
 *     being glued to the floor.
 *
 * Usage:
 *   npx vite-node tools/resheet.ts -- --in <src.png> --type battler [--scale 4]
 *   npx vite-node tools/resheet.ts -- --in s.png --frames 14 --cols 4 --cell 112x144
 *
 * Flags:
 *   --in <path>              source PNG (required)
 *   --out <path>            output PNG (default: <in dir>/<name>.sheet.png)
 *   --type <name>           preset: character|bust|battler|athlete|golfer (sets cols/cell/frames)
 *   --scale <n>             ART_SCALE multiplier for presets (default 4)
 *   --frames <n>            frame count (overrides preset; needed without a preset)
 *   --cols <n>              output columns (overrides preset)
 *   --cell <WxH>            output cell size in px (overrides preset, pre-scale)
 *   --align <bottom|center> vertical placement in the cell (default per preset)
 *   --pad <n>               transparent padding inside each cell, px (default 0)
 *   --bg <#rrggbb|auto|none> background to key when the source has no alpha (default auto)
 *   --equal                 force equal-width slicing into <frames> columns (skip gap detect)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, basename, extname } from 'node:path';
import { decodePng, encodePng, makeImg, type Img } from './imageio';

interface Preset {
  cols: number;
  cell: [number, number];
  frames: number;
  align: 'bottom' | 'center';
}
const PRESETS: Record<string, Preset> = {
  character: { cols: 4, cell: [24, 32], frames: 46, align: 'bottom' },
  bust: { cols: 4, cell: [32, 32], frames: 18, align: 'center' },
  battler: { cols: 4, cell: [28, 36], frames: 14, align: 'bottom' },
  athlete: { cols: 5, cell: [32, 40], frames: 39, align: 'bottom' },
  golfer: { cols: 4, cell: [32, 40], frames: 11, align: 'bottom' },
};

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (!t.startsWith('--') || t === '--') continue;
    const key = t.slice(2);
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith('--')) {
      out[key] = next;
      i++;
    } else {
      out[key] = true;
    }
  }
  return out;
}

/** area-weighted, alpha-aware resample of a src sub-rect into dw×dh (down or up) */
function resample(src: Img, sx: number, sy: number, sw: number, sh: number, dw: number, dh: number): Img {
  const out = makeImg(dw, dh);
  for (let dy = 0; dy < dh; dy++) {
    const fy0 = sy + (dy / dh) * sh;
    const fy1 = sy + ((dy + 1) / dh) * sh;
    const iy0 = Math.floor(fy0);
    const iy1 = Math.max(iy0 + 1, Math.ceil(fy1));
    for (let dx = 0; dx < dw; dx++) {
      const fx0 = sx + (dx / dw) * sw;
      const fx1 = sx + ((dx + 1) / dw) * sw;
      const ix0 = Math.floor(fx0);
      const ix1 = Math.max(ix0 + 1, Math.ceil(fx1));
      let ar = 0;
      let ag = 0;
      let ab = 0;
      let aa = 0;
      let wsum = 0;
      for (let yy = iy0; yy < iy1; yy++) {
        if (yy < 0 || yy >= src.h) continue;
        const wy = Math.min(fy1, yy + 1) - Math.max(fy0, yy);
        if (wy <= 0) continue;
        for (let xx = ix0; xx < ix1; xx++) {
          if (xx < 0 || xx >= src.w) continue;
          const wx = Math.min(fx1, xx + 1) - Math.max(fx0, xx);
          if (wx <= 0) continue;
          const wgt = wx * wy;
          const o = (yy * src.w + xx) * 4;
          const a = src.data[o + 3];
          ar += src.data[o] * a * wgt;
          ag += src.data[o + 1] * a * wgt;
          ab += src.data[o + 2] * a * wgt;
          aa += a * wgt;
          wsum += wgt;
        }
      }
      const od = (dy * dw + dx) * 4;
      if (aa > 0) {
        out.data[od] = Math.round(ar / aa);
        out.data[od + 1] = Math.round(ag / aa);
        out.data[od + 2] = Math.round(ab / aa);
        out.data[od + 3] = Math.round(aa / wsum);
      }
    }
  }
  return out;
}

interface Clip { x0: number; y0: number; x1: number; y1: number }
function blit(dst: Img, src: Img, ox: number, oy: number, clip: Clip): void {
  for (let y = 0; y < src.h; y++) {
    const dy = oy + y;
    if (dy < clip.y0 || dy >= clip.y1 || dy < 0 || dy >= dst.h) continue;
    for (let x = 0; x < src.w; x++) {
      const dx = ox + x;
      if (dx < clip.x0 || dx >= clip.x1 || dx < 0 || dx >= dst.w) continue;
      const so = (y * src.w + x) * 4;
      const a = src.data[so + 3];
      if (a === 0) continue;
      const do2 = (dy * dst.w + dx) * 4;
      dst.data[do2] = src.data[so];
      dst.data[do2 + 1] = src.data[so + 1];
      dst.data[do2 + 2] = src.data[so + 2];
      dst.data[do2 + 3] = a;
    }
  }
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const inPath = args.in as string;
  if (!inPath || typeof inPath !== 'string') throw new Error('--in <src.png> is required');

  const preset = typeof args.type === 'string' ? PRESETS[args.type] : undefined;
  if (args.type && !preset) throw new Error(`unknown --type ${args.type} (have: ${Object.keys(PRESETS).join(', ')})`);
  const scale = args.scale ? Number(args.scale) : 4;

  const cols = args.cols ? Number(args.cols) : preset?.cols;
  const frames = args.frames ? Number(args.frames) : preset?.frames;
  let cellW: number;
  let cellH: number;
  if (typeof args.cell === 'string') {
    const m = /^(\d+)x(\d+)$/.exec(args.cell);
    if (!m) throw new Error('--cell must be WxH, e.g. 112x144');
    cellW = Number(m[1]) * scale;
    cellH = Number(m[2]) * scale;
  } else if (preset) {
    cellW = preset.cell[0] * scale;
    cellH = preset.cell[1] * scale;
  } else {
    throw new Error('need --type or both --cols and --cell');
  }
  if (!cols || !frames) throw new Error('need --type, or --cols and --frames');
  const align: 'bottom' | 'center' =
    args.align === 'center' || args.align === 'bottom' ? args.align : preset?.align ?? 'bottom';
  const pad = args.pad ? Number(args.pad) * scale : 0;

  const src = decodePng(readFileSync(inPath));

  // --- content mask: alpha if present, else background-key ---
  let hasAlpha = false;
  for (let i = 3; i < src.data.length; i += 4) {
    if (src.data[i] < 250) { hasAlpha = true; break; }
  }
  let bg: [number, number, number] | null = null;
  if (!hasAlpha && args.bg !== 'none') {
    if (typeof args.bg === 'string' && args.bg.startsWith('#')) {
      const n = parseInt(args.bg.slice(1), 16);
      bg = [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
    } else {
      const c = ((src.h - 1) * src.w + 0) * 4; // bottom-left corner
      bg = [src.data[c], src.data[c + 1], src.data[c + 2]];
    }
  }
  const tol2 = 48 * 48 * 3;
  const isContent = (x: number, y: number): boolean => {
    const o = (y * src.w + x) * 4;
    if (src.data[o + 3] < 16) return false;
    if (!bg) return true;
    const dr = src.data[o] - bg[0];
    const dg = src.data[o + 1] - bg[1];
    const db = src.data[o + 2] - bg[2];
    return dr * dr + dg * dg + db * db > tol2;
  };

  const colHas = new Array<number>(src.w).fill(0);
  const rowHas = new Array<number>(src.h).fill(0);
  for (let y = 0; y < src.h; y++) {
    for (let x = 0; x < src.w; x++) {
      if (isContent(x, y)) { colHas[x]++; rowHas[y]++; }
    }
  }
  const gMinX = colHas.findIndex((n) => n > 0);
  const gMinY = rowHas.findIndex((n) => n > 0);
  if (gMinX < 0 || gMinY < 0) throw new Error('source image appears empty (no content detected)');
  let gMaxX = src.w - 1; while (colHas[gMaxX] === 0) gMaxX--;
  let gMaxY = src.h - 1; while (rowHas[gMaxY] === 0) gMaxY--;
  const gH = gMaxY - gMinY + 1;

  // --- segment into frames ---
  // Figures sit at a roughly even pitch, but imagegen adds FX noise (sparkles,
  // energy, a thrown ball) that bridges the true gaps — so plain "widest gap"
  // detection mis-cuts. Instead walk the EXPECTED even boundaries and snap each
  // to the EMPTIEST column nearby: robust to both FX noise and uneven spacing.
  // (--equal forces a plain even split with no snapping.)
  const span = gMaxX + 1 - gMinX;
  const pitch = span / frames;
  let method: string;
  let bounds: number[];
  if (args.equal) {
    bounds = [];
    for (let k = 0; k <= frames; k++) bounds.push(Math.round(gMinX + (span * k) / frames));
    method = 'equal (forced)';
  } else {
    const cuts: number[] = [];
    const win = Math.max(1, Math.round(pitch * 0.35));
    for (let k = 1; k < frames; k++) {
      const center = gMinX + k * pitch;
      let best = Math.round(center);
      let bestScore = Infinity;
      for (let x = Math.round(center - win); x <= Math.round(center + win); x++) {
        if (x <= gMinX || x >= gMaxX) continue;
        const score = colHas[x] * 10000 + Math.abs(x - center); // emptiest wins; tie → nearest expected
        if (score < bestScore) { bestScore = score; best = x; }
      }
      cuts.push(best);
    }
    bounds = [gMinX, ...cuts, gMaxX + 1];
    method = 'snap-to-gap';
  }

  // per-frame horizontal content bbox + the global scale (one consistent size)
  const fx: Array<[number, number]> = [];
  for (let i = 0; i < frames; i++) {
    const a = bounds[i];
    const b = bounds[i + 1] - 1;
    let mn = -1;
    let mx = -1;
    for (let x = a; x <= b; x++) if (colHas[x] > 0) { if (mn < 0) mn = x; mx = x; }
    fx.push(mn < 0 ? [a, b] : [mn, mx]);
  }
  const maxFW = Math.max(...fx.map(([a, b]) => b - a + 1));
  // Default: fill cell HEIGHT (one consistent character size; wide poses may
  // extend past the cell and get clipped to it). --fit both never clips but can
  // shrink the figure; --fit width matches cell width.
  const fit = args.fit === 'both' || args.fit === 'width' ? args.fit : 'height';
  const sH = (cellH - 2 * pad) / gH;
  const sW = (cellW - 2 * pad) / maxFW;
  const s = fit === 'both' ? Math.min(sH, sW) : fit === 'width' ? sW : sH;

  // --- compose the grid ---
  const rows = Math.ceil(frames / cols);
  const sheet = makeImg(cols * cellW, rows * cellH);
  for (let i = 0; i < frames; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const [a, b] = fx[i];
    const fw = b - a + 1;
    const placedW = Math.max(1, Math.round(fw * s));
    const placedH = Math.max(1, Math.round(gH * s));
    const cellImg = resample(src, a, gMinY, fw, gH, placedW, placedH);
    const cx = col * cellW + Math.round((cellW - placedW) / 2);
    const cy = row * cellH + (align === 'center' ? Math.round((cellH - placedH) / 2) : cellH - pad - placedH);
    blit(sheet, cellImg, cx, cy, { x0: col * cellW, y0: row * cellH, x1: col * cellW + cellW, y1: row * cellH + cellH });
  }

  const out = typeof args.out === 'string'
    ? args.out
    : join(dirname(inPath), `${basename(inPath, extname(inPath))}.sheet.png`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, encodePng(sheet));

  console.log(`resheet: ${inPath}`);
  console.log(`  source ${src.w}x${src.h}, content x[${gMinX}..${gMaxX}] y[${gMinY}..${gMaxY}] (h=${gH})`);
  console.log(`  segmentation: ${method} -> ${frames} frames`);
  console.log(`  grid ${cols}x${rows}, cell ${cellW}x${cellH} (scale x${scale}), global fit s=${s.toFixed(3)}`);
  console.log(`  output ${sheet.w}x${sheet.h} -> ${out}`);
}

main();
