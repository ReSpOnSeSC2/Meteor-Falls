/**
 * Enemy battle-frame audit (ADR-109 authored-art pipeline).
 *
 * Every battler shows THREE wear tiers in combat — as HP falls, BattleScene
 * swaps `battle_<x>` → `battle_<x>_w1` → `battle_<x>_w2` via wearSpriteKey()
 * (src/spritegen/enemies.ts) driven by wearTier() (src/battle/formulas.ts).
 *
 * If the base is authored hi-res but a wear frame is NOT, the enemy looks crisp
 * at full HP and then DROPS to the old pixelated procedural art the instant it
 * takes damage. This audit flags every enemy whose base/_w1/_w2 trio is not
 * uniformly authored + present on disk, so none fall back to pixel art.
 *
 *   npm run enemies:frames            # report
 *   npm run enemies:frames -- --strict  # exit 1 if any gap (CI gate)
 */
import { existsSync } from 'node:fs';
import { ENEMIES } from '../src/data/enemies';
import { AUTHORED_ENEMY_BATTLE_ART_KEYS } from '../src/spritegen/authored';
import { FORM_ART } from '../src/spritegen/enemies';

const strict = process.argv.includes('--strict');
const ART_DIR = 'assets/art/enemies';

const wired = new Set<string>(AUTHORED_ENEMY_BATTLE_ART_KEYS);
const onDisk = (key: string): boolean => existsSync(`${ART_DIR}/${key}.png`);

type Target = { base: string; owners: string[] };
const byBase = new Map<string, Target>();
const claim = (base: string, owner: string) => {
  const t = byBase.get(base) ?? { base, owners: [] };
  if (!t.owners.includes(owner)) t.owners.push(owner);
  byBase.set(base, t);
};

// every roster enemy's battle sprite …
for (const e of Object.values(ENEMIES)) claim(e.sprite, `${e.id}${e.boss ? ' (boss)' : ''}`);
// … plus scripted boss FORM variants (e.g. gilded_grin_hollow), which swap in
// mid-fight and need their own wear trio.
for (const [id, art] of Object.entries(FORM_ART)) claim(art.sprite, `${id} (form)`);

type FrameState = { key: string; wired: boolean; disk: boolean };
type Row = {
  base: string;
  owners: string[];
  frames: FrameState[];
  baseAuthored: boolean;
  missingWear: string[]; // _w1/_w2 keys that are not fully authored
  status: 'authored' | 'partial' | 'procedural';
};

const rows: Row[] = [];
for (const { base, owners } of byBase.values()) {
  const frames: FrameState[] = [base, `${base}_w1`, `${base}_w2`].map((key) => ({
    key,
    wired: wired.has(key),
    disk: onDisk(key),
  }));
  const ok = (f: FrameState) => f.wired && f.disk;
  const baseAuthored = ok(frames[0]);
  const missingWear = frames.slice(1).filter((f) => !ok(f)).map((f) => f.key);
  const status: Row['status'] = !baseAuthored
    ? 'procedural'
    : missingWear.length
      ? 'partial'
      : 'authored';
  rows.push({ base, owners, frames, baseAuthored, missingWear, status });
}
rows.sort((a, b) => a.base.localeCompare(b.base));

const partial = rows.filter((r) => r.status === 'partial');
const procedural = rows.filter((r) => r.status === 'procedural');
const authored = rows.filter((r) => r.status === 'authored');

const mark = (f: FrameState) => (f.wired && f.disk ? 'OK ' : `${f.disk ? 'd' : '-'}${f.wired ? 'w' : '-'}`);

console.log(`\nENEMY BATTLE-FRAME AUDIT  (${rows.length} battlers, ${ENEMIES ? Object.keys(ENEMIES).length : 0} roster ids)`);
console.log(`  fully hi-res (base+w1+w2): ${authored.length}`);
console.log(`  partial  (hi-res base, PIXELATED when damaged): ${partial.length}`);
console.log(`  procedural (no hi-res at all): ${procedural.length}`);
console.log(`  legend per frame: "OK"=authored+on-disk, else flags  d=on-disk w=wired (missing shown as -)\n`);

if (partial.length) {
  console.log('── PARTIAL — base is hi-res but a wear frame falls back to pixel art ──');
  for (const r of partial) {
    console.log(`  ${r.base}  [${r.owners.join(', ')}]`);
    for (const f of r.frames) console.log(`      ${mark(f)}  ${f.key}`);
  }
  console.log('');
}
if (procedural.length) {
  console.log('── PROCEDURAL — no authored hi-res base (all 3 tiers pixelated) ──');
  for (const r of procedural) {
    console.log(`  ${r.base}  [${r.owners.join(', ')}]`);
    for (const f of r.frames) console.log(`      ${mark(f)}  ${f.key}`);
  }
  console.log('');
}

// the exact regen worklist: which (base, frames) need generating
const queue: { base: string; owners: string[]; need: string[] }[] = [];
for (const r of [...procedural, ...partial]) {
  const need = r.frames.filter((f) => !(f.wired && f.disk)).map((f) => f.key);
  queue.push({ base: r.base, owners: r.owners, need });
}
if (queue.length) {
  console.log('── REGEN QUEUE ──');
  for (const q of queue) console.log(`  ${q.base}: need ${q.need.join(', ')}  [${q.owners.join(', ')}]`);
  console.log('');
}

if (strict && (partial.length || procedural.length)) {
  console.error(`FAIL: ${partial.length} partial + ${procedural.length} procedural enemies still pixelate.`);
  process.exit(1);
}
