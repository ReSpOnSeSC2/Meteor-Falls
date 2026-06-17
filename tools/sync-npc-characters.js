/**
 * Copy the authored NPC animation MASTERS into the runtime characters folder the
 * game loads. The NPC art was authored as 46-frame sheets in
 *   assets/art/masters/characters/animation/<id>_anim_46_4x_master.png
 * (same format + resolution as the heroes), but never moved to the runtime
 * location, so every NPC fell back to the procedural sprite. This mirrors the
 * hero pipeline (runtime sheet === a copy of its master, 384x1536).
 *
 *   node tools/sync-npc-characters.js
 *
 * The roster is read straight from NPC_CHARACTER_ART in spritegen/authored.ts so
 * it never drifts. Pair this with the URL fix there (_anim_46_4x.png).
 */
import fs from 'node:fs';
import path from 'node:path';

const SRC_DIR = 'assets/art/masters/characters/animation';
const OUT_DIR = 'assets/art/characters';

const code = fs.readFileSync('src/spritegen/authored.ts', 'utf8');
const block = code.split('NPC_CHARACTER_ART = [')[1].split('] as const')[0];
const ids = [...block.matchAll(/id: '([^']+)'/g)].map((m) => m[1]);

let copied = 0;
const missing = [];
for (const id of ids) {
  const src = path.join(SRC_DIR, `${id}_anim_46_4x_master.png`);
  const out = path.join(OUT_DIR, `${id}_anim_46_4x.png`);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, out);
    copied++;
  } else {
    missing.push(id);
  }
}

console.log(`NPC roster: ${ids.length}`);
console.log(`copied master -> runtime: ${copied}`);
if (missing.length) console.log(`NO MASTER (left procedural): ${missing.join(', ')}`);
