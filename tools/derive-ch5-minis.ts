/**
 * tools/derive-ch5-minis.ts — author the Ch.5 overworld ENEMY MINIS from the
 * already-authored hi-res BATTLERS (PKG-12). The Minimus §A7 roamers shipped on
 * borrowed PROCEDURAL minis (the old pixel style) while their battlers are the
 * ChatGPT-authored hi-res art; this derives each overworld mini from that same
 * battler so the field sprite IS the enemies-section art, just scaled to the
 * roamer footprint (≈64px longest side — the 16→×4 procedural-mini size it
 * replaces). Battlers are already transparent (magenta-keyed), so we just crop to
 * the alpha-content bbox and area-average downscale (alpha-weighted, no dark
 * fringe). Re-runnable.
 *
 * Run:  npx vite-node tools/derive-ch5-minis.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { decodePng, encodePng, makeImg } from './imageio';

const TARGET = 64; // longest side in px — matches the procedural mini's on-screen size
// Default = the Ch.5 §A7 roamers; pass enemy ids on argv to derive minis for any enemy
// that has an authored battler (the cheap procedural→authored overworld lift, CLAUDE.md).
const CH5 = [
  'tin_parade', 'duelist_pip', 'crumb_cannoneer', 'powderwig_wasp', 'windup_wyrmlet',
  'dust_bunny', 'whistle_guard', 'census_pigeon', 'toll_clerk', 'cobble_mite',
  'hedge_sprite', 'topiary_knight', 'bramble_tangle', 'lapel_pin_mob', 'town_crier',
  'snuffbox_beetle', 'tax_assessor', 'halberd_column', 'bell_ringer_acolyte', 'grand_parade',
];
const IDS = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const TARGETS = IDS.length ? IDS : CH5;

for (const id of TARGETS) {
  const src = decodePng(readFileSync(`assets/art/enemies/battle_${id}.png`));
  // 1) crop to the alpha-content bounding box
  let minX = src.w, minY = src.h, maxX = -1, maxY = -1;
  for (let y = 0; y < src.h; y++) {
    for (let x = 0; x < src.w; x++) {
      if (src.data[(y * src.w + x) * 4 + 3] > 16) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX) { console.log(`mini_${id}: EMPTY (no opaque pixels?)`); continue; }
  const cw = maxX - minX + 1;
  const ch = maxY - minY + 1;
  // 2) area-average downscale (alpha-weighted premultiply) to TARGET longest side
  const scale = TARGET / Math.max(cw, ch);
  const ow = Math.max(1, Math.round(cw * scale));
  const oh = Math.max(1, Math.round(ch * scale));
  const out = makeImg(ow, oh);
  for (let oy = 0; oy < oh; oy++) {
    for (let ox = 0; ox < ow; ox++) {
      const sx0 = minX + Math.floor(ox / scale);
      const sx1 = minX + Math.floor((ox + 1) / scale);
      const sy0 = minY + Math.floor(oy / scale);
      const sy1 = minY + Math.floor((oy + 1) / scale);
      let pr = 0, pg = 0, pb = 0, sa = 0, n = 0;
      for (let yy = sy0; yy <= Math.min(sy1, maxY); yy++) {
        for (let xx = sx0; xx <= Math.min(sx1, maxX); xx++) {
          const i = (yy * src.w + xx) * 4;
          const a = src.data[i + 3];
          pr += src.data[i] * a;
          pg += src.data[i + 1] * a;
          pb += src.data[i + 2] * a;
          sa += a;
          n++;
        }
      }
      const o = (oy * ow + ox) * 4;
      const avgA = n > 0 ? sa / n : 0;
      if (avgA < 8 || sa === 0) {
        out.data[o + 3] = 0;
      } else {
        out.data[o] = Math.round(pr / sa); // alpha-weighted average (un-premultiplied)
        out.data[o + 1] = Math.round(pg / sa);
        out.data[o + 2] = Math.round(pb / sa);
        out.data[o + 3] = Math.round(avgA);
      }
    }
  }
  writeFileSync(`assets/art/enemies/mini_${id}.png`, encodePng(out));
  console.log(`mini_${id}: ${cw}x${ch} -> ${ow}x${oh}`);
}
