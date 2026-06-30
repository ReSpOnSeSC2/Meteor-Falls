/**
 * tools/preview-edge-biomes.cjs — DEV PREVIEW ONLY (not shipped art). Composite each
 * EDGE_BIOME's real prop PNGs onto its real void color, mimicking how buildEdgeFeatures
 * rings a map's bottom edge — so the terrain-aware borders can be eyeballed in one image
 * without driving the full game runtime. Reads props from assets/art/world/props.
 *   node tools/preview-edge-biomes.cjs <out.png>
 */
const { PNG } = require('pngjs');
const fs = require('fs');
const out = process.argv[2] || 'edge_biomes_preview.png';
const P = 'assets/art/world/props';

// biome -> { void color, prop keys } — mirrors EDGE_BIOME in OverworldScene.ts
const BIOMES = [
  ['temperate',     0x1c4424, ['tree', 'tree_b', 'tree_c']],
  ['mountain_pine', 0x16301f, ['prop_pine_whisperwood', 'prop_pine_whisperwood_b', 'prop_pine_whisperwood_c']],
  ['tropical',      0x123f33, ['palm_a', 'palm_b', 'palm_c', 'palm_d']],
  ['savanna',       0x7c6630, ['baobab_shade']],
  ['hedge',         0x223c1d, ['hedgerow_leaf_wall', 'hedgerow_thorn_arch']],
  ['jungle',        0x0d2f18, ['edge_jungle_a', 'edge_jungle_b', 'edge_jungle_c']],
  ['desert',        0xb08a4e, ['edge_desert_dune', 'edge_desert_cactus', 'edge_desert_rock']],
  ['ice',           0x9db4cc, ['edge_ice_spire', 'edge_ice_spruce', 'edge_ice_drift']],
  ['volcanic',      0x2a2228, ['edge_basalt_a', 'edge_basalt_b']],
  ['mars',          0x5e2a1c, ['edge_mars_a', 'edge_mars_b']],
  ['bamboo',        0x294e2c, ['edge_bamboo_a', 'edge_bamboo_b', 'edge_bamboo_c']],
  ['spore',         0x342050, ['edge_spore_a', 'edge_spore_b']],
  ['cave',          0x2c2a32, ['edge_rock_a', 'edge_rock_b']],
];

const ROW_W = 1040, ROW_H = 132, TARGET_H = 104, GAP = 8;
const canvas = new PNG({ width: ROW_W, height: ROW_H * BIOMES.length });

// area-average downscale a source PNG to a target height (keeps aspect)
function scaleToH(src, th) {
  const s = th / src.height, ow = Math.max(1, Math.round(src.width * s)), oh = th;
  const o = { width: ow, height: oh, data: new Uint8ClampedArray(ow * oh * 4) };
  for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) {
    const sx0 = Math.floor(x / s), sx1 = Math.min(src.width - 1, Math.floor((x + 1) / s));
    const sy0 = Math.floor(y / s), sy1 = Math.min(src.height - 1, Math.floor((y + 1) / s));
    let r = 0, g = 0, b = 0, a = 0, n = 0;
    for (let sy = sy0; sy <= sy1; sy++) for (let sx = sx0; sx <= sx1; sx++) { const i = (sy * src.width + sx) * 4; const al = src.data[i + 3]; r += src.data[i] * al; g += src.data[i + 1] * al; b += src.data[i + 2] * al; a += al; n++; }
    const oi = (y * ow + x) * 4;
    if (a > 0) { o.data[oi] = r / a; o.data[oi + 1] = g / a; o.data[oi + 2] = b / a; o.data[oi + 3] = a / Math.max(1, n); }
  }
  return o;
}

BIOMES.forEach(([name, vc, keys], row) => {
  const y0 = row * ROW_H;
  const vr = (vc >> 16) & 255, vg = (vc >> 8) & 255, vb = vc & 255;
  for (let y = 0; y < ROW_H; y++) for (let x = 0; x < ROW_W; x++) { const i = ((y0 + y) * ROW_W + x) * 4; canvas.data[i] = vr; canvas.data[i + 1] = vg; canvas.data[i + 2] = vb; canvas.data[i + 3] = 255; }
  // tile the biome's keys left-to-right (repeat to fill the row), baseline near the bottom
  let x = 18; let k = 0;
  while (x < ROW_W - 40) {
    const key = keys[k % keys.length]; k++;
    const src = PNG.sync.read(fs.readFileSync(`${P}/${key}.png`));
    const sp = scaleToH(src, TARGET_H);
    const px = x, py = y0 + ROW_H - sp.height - 6;
    for (let yy = 0; yy < sp.height; yy++) for (let xx = 0; xx < sp.width; xx++) {
      const a = sp.data[(yy * sp.width + xx) * 4 + 3]; if (a < 6) continue;
      const dx = px + xx, dy = py + yy; if (dx < 0 || dx >= ROW_W || dy < y0 || dy >= y0 + ROW_H) continue;
      const di = (dy * ROW_W + dx) * 4, si = (yy * sp.width + xx) * 4, af = a / 255;
      canvas.data[di] = sp.data[si] * af + canvas.data[di] * (1 - af);
      canvas.data[di + 1] = sp.data[si + 1] * af + canvas.data[di + 1] * (1 - af);
      canvas.data[di + 2] = sp.data[si + 2] * af + canvas.data[di + 2] * (1 - af);
      canvas.data[di + 3] = 255;
    }
    x += Math.round(sp.width * 0.82) + GAP; // slight overlap, like the jittered ring
  }
  console.log(`row ${row}: ${name} (${keys.length} prop${keys.length > 1 ? 's' : ''})`);
});

fs.writeFileSync(out, PNG.sync.write(canvas));
console.log(`wrote ${out}  ${ROW_W}x${ROW_H * BIOMES.length}  (${BIOMES.length} biomes)`);
