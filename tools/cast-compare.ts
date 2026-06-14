/**
 * Throwaway art-review helper (not wired into npm scripts): render the five
 * leads' 8 compass facings as individual transparent PNGs, so an external
 * compositor can lay them beside the reference rotation art for a true
 * side-by-side "how close does the procedural engine get?" comparison.
 *
 *   npx vite-node tools/cast-compare.ts
 *
 * Emits .shots/compare/<hero>__<angle>.png at 5× (24×32 → 120×160), matching
 * the ~120px reference canvases. Angle filenames mirror the reference folders.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { CAST, generateCharacterFrames, diagWalkBase } from '../src/spritegen/characters';
import { pixmapToPng } from './png';

// reference-folder angle name -> engine stand-frame index
const ANGLES: Record<string, number> = {
  south: 0,
  'south-east': diagWalkBase('downright'),
  east: 8,
  'north-east': diagWalkBase('upright'),
  north: 12,
  'north-west': diagWalkBase('upleft'),
  west: 4,
  'south-west': diagWalkBase('downleft'),
};

const leads = ['rex', 'faye', 'milo', 'dorin', 'pippa'];

mkdirSync('.shots/compare', { recursive: true });
for (const id of leads) {
  const frames = generateCharacterFrames(CAST[id]);
  for (const [angle, idx] of Object.entries(ANGLES)) {
    writeFileSync(`.shots/compare/${id}__${angle}.png`, pixmapToPng(frames[idx], { scale: 5 }));
  }
}
console.log(`wrote ${leads.length * Object.keys(ANGLES).length} frames to .shots/compare/`);
