import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { ENEMIES } from '../src/data/enemies';
import { MAPS } from '../src/data/maps';
import {
  ENEMY_OVERWORLD_SHEET_ID_SET,
  enemyVisualIdentity,
} from '../src/data/visuals';
import {
  AUTHORED_ENEMY_BATTLE_ART_KEYS,
  AUTHORED_ENEMY_OVERWORLD_ART_IDS,
  AUTHORED_ENEMY_OVERWORLD_ART_KEYS,
  AUTHORED_NPC_CHARACTER_IDS,
} from '../src/spritegen/authored';
import { ENEMY_BATTLE_ART, FORM_ART } from '../src/spritegen/enemies';
import { CAST } from '../src/spritegen/characters';

const strict = process.argv.includes('--strict');
const outArg = process.argv.find((arg) => arg.startsWith('--out='));
const outPath = outArg?.slice('--out='.length) ?? 'docs/asset-lists/visual_identity.md';

const authoredBattleKeys = new Set<string>(AUTHORED_ENEMY_BATTLE_ART_KEYS);
const authoredOverworld = new Set(AUTHORED_ENEMY_OVERWORLD_ART_KEYS);
const authoredOverworldIds = new Set(AUTHORED_ENEMY_OVERWORLD_ART_IDS);
const authoredCharacters = new Set<string>(AUTHORED_NPC_CHARACTER_IDS);
for (const id of Object.keys(CAST)) authoredCharacters.add(id);

const usedOnMaps = new Map<string, string[]>();
for (const map of Object.values(MAPS)) {
  const ids = new Set<string>();
  for (const spawner of map.spawners) for (const enemy of spawner.enemies) ids.add(enemy);
  for (const patrol of map.patrols ?? []) ids.add(patrol.enemy);
  for (const id of ids) {
    const maps = usedOnMaps.get(id) ?? [];
    maps.push(map.id);
    usedOnMaps.set(id, maps);
  }
}

const claimedBattleKeys = new Set<string>([
  ...Object.values(ENEMY_BATTLE_ART).map((row) => row.sprite),
  ...Object.values(FORM_ART).map((row) => row.sprite),
]);

interface Row {
  id: string;
  name: string;
  mapUse: string;
  battle: string;
  field: string;
  status: 'authored' | 'legacy';
  notes: string[];
}

const rows: Row[] = [];
const legacy: string[] = [];

for (const enemy of Object.values(ENEMIES)) {
  const identity = enemyVisualIdentity(enemy);
  const notes: string[] = [];
  const mapUse = usedOnMaps.get(enemy.id)?.join(', ') ?? '';

    if (!authoredBattleKeys.has(identity.battle)) {
    notes.push(`battle '${identity.battle}' is procedural-only`);
  }

  let field = '';
  if (identity.field.kind === 'overworld') {
    field = identity.field.key;
    if (!authoredOverworld.has(identity.field.key) || !authoredOverworldIds.has(enemy.id)) {
      notes.push(`overworld '${identity.field.key}' has no authored 8-dir sheet`);
    }
  } else if (identity.field.kind === 'walker') {
    field = `walker:${identity.field.key}`;
    if (!authoredCharacters.has(identity.field.key)) {
      notes.push(`walker '${identity.field.key}' is procedural-only`);
    }
    if (identity.field.key !== enemy.id && identity.field.key !== enemy.walker) {
      notes.push(`walker '${identity.field.key}' is not a canonical enemy key`);
    }
    if (!ENEMY_OVERWORLD_SHEET_ID_SET.has(enemy.id)) {
      notes.push(`uses borrowed character sheet '${identity.field.key}' instead of an authored enemy overworld sheet`);
    }
  } else {
    field = `mini:${identity.field.key}`;
    notes.push(`uses legacy mini '${identity.field.key}' instead of authored overworld art`);
  }

  if (ENEMY_OVERWORLD_SHEET_ID_SET.has(enemy.id) && enemy.overworld !== `ow_enemy_${enemy.id}`) {
    notes.push(`registered for authored overworld but data points at '${enemy.overworld ?? '(none)'}'`);
  }

  const status = notes.length ? 'legacy' : 'authored';
  rows.push({ id: enemy.id, name: enemy.name, mapUse, battle: identity.battle, field, status, notes });
  if (status === 'legacy') legacy.push(enemy.id);
}

const orphanBattle = AUTHORED_ENEMY_BATTLE_ART_KEYS
  .filter((key) => !key.endsWith('_w1') && !key.endsWith('_w2'))
  .filter((key) => !claimedBattleKeys.has(key));
const orphanOverworld = AUTHORED_ENEMY_OVERWORLD_ART_IDS
  .filter((id) => !ENEMY_OVERWORLD_SHEET_ID_SET.has(id));
const diskBattle = readdirSync('assets/art/enemies')
  .filter((name) => name.startsWith('battle_') && name.endsWith('.png'))
  .map((name) => name.replace(/\.png$/, ''))
  .sort();
const unregisteredDiskBattle = diskBattle.filter((key) => !authoredBattleKeys.has(key));

const lines: string[] = [
  '# Visual Identity Audit',
  '',
  'Authored means the runtime key resolves through `src/spritegen/authored.ts` and a committed `assets/art/...` file. Legacy means a procedural mini, generated draw function, borrowed generic character sheet, or orphaned authored file remains in the identity path.',
  '',
  `- Enemies: ${rows.length}`,
  `- Fully authored identities: ${rows.filter((row) => row.status === 'authored').length}`,
  `- Legacy identities: ${legacy.length}`,
  `- Orphan authored battle images: ${orphanBattle.length}`,
  `- Orphan authored overworld sheets: ${orphanOverworld.length}`,
  `- Authored battle PNGs on disk but not registered for current runtime: ${unregisteredDiskBattle.length}`,
  '',
  '## Enemy Rows',
  '',
  '| enemy | map use | battle | field | status | notes |',
  '|---|---|---|---|---|---|',
  ...rows.map((row) => `| ${row.id} | ${row.mapUse || '-'} | ${row.battle} | ${row.field} | ${row.status} | ${row.notes.join('; ') || '-'} |`),
  '',
  '## Missing Enemy Overworld Generation Queue',
  '',
  'Each row needs a committed 8-frame runtime sheet and then registration in `ENEMY_OVERWORLD_SHEET_IDS` / `src/spritegen/authored.ts`. Output sheets must be `768x128` total: eight `96x128` frames laid left-to-right.',
  '',
  '| enemy | display name | map use | battle reference | current fallback | output PNG | runtime key |',
  '|---|---|---|---|---|---|---|',
  ...rows
    .filter((row) => row.status === 'legacy')
    .map((row) => `| ${row.id} | ${row.name} | ${row.mapUse || '-'} | assets/art/enemies/${row.battle}.png | ${row.field} | assets/art/enemies/overworld/${row.id}_8dir.png | ow_enemy_${row.id} |`),
  '',
  '## Orphans',
  '',
  `- Battle: ${orphanBattle.length ? orphanBattle.join(', ') : 'none'}`,
  `- Overworld: ${orphanOverworld.length ? orphanOverworld.map((id) => `${id}_8dir.png`).join(', ') : 'none'}`,
  '',
  '## Authored Disk Assets Not In Current Runtime',
  '',
  unregisteredDiskBattle.length
    ? unregisteredDiskBattle.map((key) => `- ${key}`).join('\n')
    : '- none',
  '',
];

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, lines.join('\n'));

console.log(`${outPath}`);
console.log(`visual identity: ${rows.filter((row) => row.status === 'authored').length}/${rows.length} authored, ${legacy.length} legacy`);
if (orphanBattle.length || orphanOverworld.length) {
  console.log(`orphans: battle=${orphanBattle.length}, overworld=${orphanOverworld.length}`);
}
if (unregisteredDiskBattle.length) {
  console.log(`unregistered authored battle PNGs: ${unregisteredDiskBattle.length}`);
}

if (strict && (legacy.length || orphanBattle.length || orphanOverworld.length)) {
  process.exit(1);
}
