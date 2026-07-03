/**
 * tools/mini-borrow-audit.ts — inventory of BORROWED roamer minis: enemies with
 * no authored 8-dir overworld sheet whose `mini:` key is not their own battler's
 * mini (`mini_<battler base>`). A borrowed mini renders a DIFFERENT enemy on the
 * overworld than the battle presents. Fix = derive the enemy's own mini from its
 * battler (`npx vite-node tools/derive-ch5-minis.ts <base...>`), register the key
 * in ENEMY_MINI_ART (src/spritegen/authored.ts), re-point the `mini:` field.
 *
 * (Enemies sharing a battler — the adopted fallback rows — legitimately share
 * that battler's mini; they are NOT flagged. `npm run visuals:audit` covers the
 * older procedural-mini class; this covers wrong-enemy AUTHORED minis.)
 *
 * Run: npx vite-node tools/mini-borrow-audit.ts
 */
import { existsSync, readFileSync } from 'node:fs';
import { ENEMIES } from '../src/data/enemies';
import { ENEMY_OVERWORLD_SHEET_ID_SET } from '../src/data/visuals';

const enemiesSrc = readFileSync('src/data/enemies.ts', 'utf8');
const authoredSrc = readFileSync('src/spritegen/authored.ts', 'utf8');
const srcLines = enemiesSrc.split('\n');

// chapter attribution — the §A7/§A6 section banners in enemies.ts
const sections: { line: number; ch: number }[] = [];
srcLines.forEach((l, i) => {
  if (!/═{3,}|={5,}|§A6/.test(l)) return;
  const m = l.match(/(?:CHAPTER\s+|Ch\.)(\d+)/i);
  if (m) sections.push({ line: i + 1, ch: Number(m[1]) });
});
const chapterAt = (line: number): number => {
  let ch = 1;
  for (const s of sections) if (s.line <= line) ch = s.ch;
  return ch;
};
const lineOf = (id: string): number => {
  const i = srcLines.findIndex((l) => l.includes(`id: '${id}'`));
  return i + 1; // 0 if not found (shouldn't happen)
};

type Row = {
  id: string; ch: number; line: number; mini: string; target: string;
  battlePng: boolean; miniPng: boolean; registered: boolean;
};
const rows: Row[] = [];
for (const [id, e] of Object.entries(ENEMIES)) {
  if (ENEMY_OVERWORLD_SHEET_ID_SET.has(id)) continue; // 8-dir gold standard roamer
  if (!e.mini || !e.sprite) continue;
  const base = e.sprite.replace(/^battle_/, '');
  const target = `mini_${base}`;
  if (e.mini === target) continue;
  const line = lineOf(id);
  rows.push({
    id, line, ch: chapterAt(line), mini: e.mini, target,
    battlePng: existsSync(`assets/art/enemies/battle_${base}.png`),
    miniPng: existsSync(`assets/art/enemies/${target}.png`),
    registered: authoredSrc.includes(`key: '${target}'`),
  });
}

rows.sort((a, b) => a.ch - b.ch || a.line - b.line);
for (const r of rows) {
  const flags = [r.battlePng ? '' : 'NO-BATTLER-PNG', r.miniPng ? 'png✓' : '', r.registered ? 'reg✓' : '']
    .filter(Boolean).join(' ');
  console.log(`ch${String(r.ch).padStart(2)} L${String(r.line).padStart(4)} ${r.id.padEnd(26)} ${r.mini.padEnd(30)} -> ${r.target} ${flags}`);
}
console.log(`\n${rows.length} borrowed minis (${rows.filter((r) => r.ch >= 2).length} in ch2+)`);

const derive = [...new Set(rows.filter((r) => r.ch >= 2 && r.battlePng && !r.miniPng).map((r) => r.target.replace(/^mini_/, '')))];
const register = [...new Set(rows.filter((r) => r.ch >= 2 && !r.registered).map((r) => r.target))];
console.log(`\nderive (ch2+, mini png missing): npx vite-node tools/derive-ch5-minis.ts ${derive.join(' ')}`);
console.log(`\nregister (ch2+, not in ENEMY_MINI_ART): ${register.join(', ')}`);
