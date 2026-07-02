/**
 * tools/facade-audit.ts — WHICH FACADES STILL RENDER PROCEDURAL? (the hi-res
 * promotion worklist). Run: `npx vite-node tools/facade-audit.ts`.
 *
 * Sweeps every prop on every canon map, keeps the ones whose sprite is in the
 * GENERATED catalog (bldg_gen_* + colossi — the LOW_RES_FACADE_KEYS procedural
 * fallback set), and reports per key: catalog identity (family/ramp/height),
 * the native canvas the procedural painter registers (wallTiles*16+2 ×
 * cityBuildingHeight(u)) — the aspect the authored PNG must match — usage
 * (map × count), whether a PNG already exists on disk, and any HAND-tuned door
 * (ox ≠ occupy's centered formula) whose arch position the art must honor.
 * Read-only: prints; changes nothing.
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { MAPS } from '../src/data/maps';
import { GENERATED_BUILDINGS, AREA_SKINS } from '../src/spritegen/buildings';
import { cityBuildingHeight } from '../src/spritegen/tiles';

const byName = new Map(GENERATED_BUILDINGS.map((b) => [b.name, b]));

interface Use { map: string; count: number; handDoorOx: number[] }
const used = new Map<string, Use[]>();

for (const [id, m] of Object.entries(MAPS)) {
  const counts = new Map<string, { count: number; handDoorOx: number[] }>();
  for (const p of m.props) {
    if (!byName.has(p.sprite)) continue;
    const c = counts.get(p.sprite) ?? { count: 0, handDoorOx: [] };
    c.count += 1;
    if (p.door) {
      const b = byName.get(p.sprite)!;
      const centered = Math.round((b.opts.wallTiles * 16) / 2) - 8;
      if (p.door.ox !== centered) c.handDoorOx.push(p.door.ox);
    }
    counts.set(p.sprite, c);
  }
  for (const [k, c] of counts) {
    const arr = used.get(k) ?? [];
    arr.push({ map: id, ...c });
    used.set(k, arr);
  }
}

const areasOf = (key: string): string[] =>
  Object.entries(AREA_SKINS).filter(([, roster]) => roster.includes(key)).map(([a]) => a);

const rows = [...used.entries()].sort((a, b) => a[0].localeCompare(b[0]));
let pngMissing = 0;
let instances = 0;
console.log(`\n${rows.length} GENERATED facade keys render on shipped maps (of ${GENERATED_BUILDINGS.length} in the catalog):\n`);
for (const [key, uses] of rows) {
  const b = byName.get(key)!;
  const W = b.opts.wallTiles * 16 + 2;
  const H = cityBuildingHeight(b.opts.upperRows);
  const png = resolve(__dirname, `../assets/art/world/facades/${key}.png`);
  const has = existsSync(png);
  if (!has) pngMissing += 1;
  const total = uses.reduce((n, u) => n + u.count, 0);
  instances += total;
  const hand = uses.flatMap((u) => u.handDoorOx);
  console.log(
    `${has ? '  [png]' : '  [GEN]'} ${key.padEnd(36)} ${String(W).padStart(4)}x${String(H).padEnd(4)} sign'${b.opts.signText}' doorAt:${b.opts.doorAt ?? '-'} ×${String(total).padStart(3)}  areas:${areasOf(key).join(',') || '(hand-placed only)'}${hand.length ? `  HAND-DOOR ox:${hand.join('/')}` : ''}`,
  );
  for (const u of uses) if (u.count > 0 && rows.length < 40) void 0;
}

const unused = GENERATED_BUILDINGS.filter((b) => !used.has(b.name));
console.log(`\n${unused.length} catalog keys used by NO shipped map (stay procedural boot-fallback, never render):`);
console.log('  ' + unused.map((b) => b.name).join(', '));
console.log(`\nSUMMARY: ${rows.length} keys to author (${pngMissing} lack a PNG) · ${instances} placed instances across the world`);
