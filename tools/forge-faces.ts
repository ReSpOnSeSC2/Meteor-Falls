/**
 * THE SPRITE LAB CONTACT SHEETS (S15g Movement 3b, ADR-046) — renders forged
 * enemy faces through the real composer into .shots/ PNGs, the out-of-game half
 * of the pick workflow (the cast-sheet.ts precedent → .shots/). The human reads
 * these, picks a candidate per grunt, and the pick is recorded as a partsSpec.
 *
 *   npm run art:facesheet
 *
 * Emits: forge_catalog.png (every silhouette × material — the shape/surface
 * audit), forge_wear.png (a few faces at wear 0/1/2 — the drums), and
 * forge_faces.png (the seeded candidate sheet per forged grunt — the pickables).
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { Pixmap } from '../src/spritegen/pixmap';
import { RAMP, T, px } from '../src/palette';
import { pixmapToPng } from './png';
import {
  composeEnemy,
  proposeCandidates,
  SILHOUETTES,
  MATERIALS,
  FACE_W,
  FACE_H,
} from '../src/spritegen/parts';
import type { PartsSpec } from '../src/schemas';
import { FORGED_ROSTERS } from '../src/levelkit/forge/registry';
import { FACE_PICKS } from '../src/data/drafts/faces';

function blit(dst: Pixmap, src: Pixmap, dx: number, dy: number): void {
  for (let y = 0; y < src.h; y++)
    for (let x = 0; x < src.w; x++) {
      const c = src.get(x, y);
      if (c !== T) dst.set(dx + x, dy + y, c);
    }
}

const PAD = 4;
const CW = FACE_W + PAD;
const CH = FACE_H + PAD;
const BG = px(RAMP.NIGHT, 0);

/** lay composed faces in a grid (one per spec); a null cell stays background */
function grid(specs: (PartsSpec | null)[], cols: number, wear: 0 | 1 | 2 = 0): Pixmap {
  const rows = Math.ceil(specs.length / cols);
  const sheet = new Pixmap(cols * CW + PAD, rows * CH + PAD).fill(BG);
  specs.forEach((spec, i) => {
    if (!spec) return;
    const cx = (i % cols) * CW + PAD;
    const cy = Math.floor(i / cols) * CH + PAD;
    blit(sheet, composeEnemy(spec, wear), cx, cy);
  });
  return sheet;
}

mkdirSync('.shots', { recursive: true });

/* 1) the catalog audit: rows = silhouette, cols = material (glare/fog default) */
{
  const sils = Object.keys(SILHOUETTES);
  const mats = Object.keys(MATERIALS);
  const specs: PartsSpec[] = [];
  for (const silhouette of sils)
    for (const material of mats)
      specs.push({ silhouette, material, accessory: 'glare', wear: 'dents', region: 'fog', seed: 7 });
  writeFileSync('.shots/forge_catalog.png', pixmapToPng(grid(specs, mats.length), { scale: 3 }));
  console.log(`forge_catalog.png — rows(silhouette): ${sils.join(', ')}`);
  console.log(`                  — cols(material):   ${mats.join(', ')}`);
}

/* 2) the drums: a handful of faces at wear 0 / 1 / 2 across the row */
{
  const samples: PartsSpec[] = [
    { silhouette: 'carapace', material: 'chitin', accessory: 'glare', wear: 'cracks', region: 'bog', seed: 11 },
    { silhouette: 'totem', material: 'stone', accessory: 'cyclops', wear: 'cracks', region: 'ochre', seed: 12 },
    { silhouette: 'blob', material: 'iron', accessory: 'grin', wear: 'dents', region: 'fog', seed: 13 },
    { silhouette: 'wisp', material: 'cloth', accessory: 'antennae', wear: 'tatters', region: 'velvet', seed: 14 },
    { silhouette: 'husk', material: 'ember', accessory: 'crown', wear: 'scorch', region: 'dust', seed: 15 },
  ];
  const cells: PartsSpec[] = [];
  for (const s of samples) cells.push(s, s, s); // three columns, one per tier
  const cols = 3;
  const rows = samples.length;
  const sheet = new Pixmap(cols * CW + PAD, rows * CH + PAD).fill(BG);
  samples.forEach((s, r) =>
    [0, 1, 2].forEach((w) => blit(sheet, composeEnemy(s, w as 0 | 1 | 2), w * CW + PAD, r * CH + PAD)),
  );
  writeFileSync('.shots/forge_wear.png', pixmapToPng(sheet, { scale: 3 }));
  console.log(`forge_wear.png — cols are wear 0/1/2; rows: ${samples.map((s) => s.silhouette).join(', ')}`);
}

/* 3) the pickables: seeded candidates per forged grunt (Ch.3 + Ch.6 sample) */
{
  const N = 8;
  const sampleChapters = [3, 6];
  const rowsOut: { id: string; specs: PartsSpec[]; pick: number }[] = [];
  for (const ch of sampleChapters)
    for (const e of FORGED_ROSTERS[ch]) {
      const specs = proposeCandidates(e.id, e.role, e.chapter, N);
      const picked = FACE_PICKS[e.id];
      const pick = picked ? specs.findIndex((s) => sameCombo(s, picked)) : -1;
      rowsOut.push({ id: e.id, specs, pick });
    }
  const sheet = new Pixmap(N * CW + PAD, rowsOut.length * CH + PAD).fill(BG);
  rowsOut.forEach((row, r) => {
    row.specs.forEach((spec, c) => {
      const x = c * CW + PAD;
      const y = r * CH + PAD;
      blit(sheet, composeEnemy(spec, 0), x, y);
      if (c === row.pick) sheet.frame(x - 1, y - 1, FACE_W + 2, FACE_H + 2, px(RAMP.GOLD, 3));
    });
  });
  writeFileSync('.shots/forge_faces.png', pixmapToPng(sheet, { scale: 3 }));
  console.log('forge_faces.png — one row per forged grunt, 8 candidate columns (0-7):');
  rowsOut.forEach((row, r) => console.log(`  row ${r}: ${row.id}${row.pick >= 0 ? `  [pick: candidate ${row.pick}]` : '  [unpicked]'}`));
}

function sameCombo(a: PartsSpec, b: PartsSpec): boolean {
  return a.silhouette === b.silhouette && a.material === b.material && a.accessory === b.accessory && a.wear === b.wear;
}

/* 4) THE RECORDED PICKS — each at wear 0/1/2 (the drums), the proof they read */
{
  const ids = Object.keys(FACE_PICKS).sort();
  if (ids.length) {
    const sheet = new Pixmap(3 * CW + PAD, ids.length * CH + PAD).fill(BG);
    ids.forEach((id, r) => [0, 1, 2].forEach((w) => blit(sheet, composeEnemy(FACE_PICKS[id], w as 0 | 1 | 2), w * CW + PAD, r * CH + PAD)));
    writeFileSync('.shots/forge_picks.png', pixmapToPng(sheet, { scale: 3 }));
    console.log('\nforge_picks.png — rows = recorded picks (cols are wear 0/1/2):');
    ids.forEach((id) => console.log(`  ${id}: ${FACE_PICKS[id].silhouette}/${FACE_PICKS[id].material}/${FACE_PICKS[id].accessory}/${FACE_PICKS[id].wear}`));
  }
}

console.log('\nwrote .shots/forge_catalog.png, forge_wear.png, forge_faces.png, forge_picks.png');
