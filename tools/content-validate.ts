/**
 * tools/content-validate.ts — the content gate (GAME_BIBLE §B1/§B4, Prompt 8
 * as adapted by S5). Run: `npm run validate` (also the first leg of
 * `npm test` and CI).
 *
 * 1. Parses every src/data collection through its src/schemas Zod schema.
 * 2. Cross-checks canon built so far: §A3 heroes + PRAY table, the §A7 Ch.1
 *    roster + Boss 1 (HP pins), the S2 quota countFlags, the §A8 Ch.1 shops,
 *    Star Cola as the lone 'pp' item.
 * 3. Cross-references everything that points at something else: grid chars →
 *    legend → tiles, doors → maps, NPCs/signs/shops → dialogue, spawners/
 *    patrols → enemies, stock → items, keepers → maps, {tokens} → the
 *    src/ui/text.ts TEXT_VARS registry (battle strings additionally allow
 *    BATTLE_FILL_TOKENS), New Game values → the letter grid.
 * 4. Sweeps every content string for TODO/placeholder/lorem (§B4).
 *
 * Any miss exits 1 naming exactly what broke. Behavioral checks (odometer,
 * pray distribution, carveHoldingRoom, ATM math, city structure…) stay in
 * vitest — this file owns existence and cross-reference truth only.
 */
import {
  AbilityDefSchema,
  DialogueScriptSchema,
  EnemyDefSchema,
  HeroDefSchema,
  HeroIdSchema,
  ItemDefSchema,
  MapDefSchema,
  PrayWeightsSchema,
  ShopDefSchema,
} from '../src/schemas';
import { HEROES } from '../src/data/heroes';
import { ABILITIES, PRAY_BASE, PRAY_TEXT } from '../src/data/abilities';
import { ENEMIES } from '../src/data/enemies';
import { ITEMS } from '../src/data/items';
import { SHOPS } from '../src/data/shops';
import { CHAR_LEGEND, MAPS } from '../src/data/maps';
import { BATTLE_FILL_TOKENS, BATTLE_TEXT, DIALOGUE } from '../src/data/dialogue';
import { NEW_GAME_ENTRIES, gridCharset } from '../src/data/newgame';
import { TEXT_VARS } from '../src/ui/text';
import { tileIndexByName } from '../src/spritegen/tiles';
import type { ZodType } from 'zod';

const errors: string[] = [];
const fail = (section: string, what: string): void => {
  errors.push(`[${section}] ${what}`);
};

/* ================= 1. schema validation ================= */

function parseAll(section: string, schema: ZodType, entries: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(entries)) {
    const r = schema.safeParse(value);
    if (!r.success) {
      for (const issue of r.error.issues) {
        const at = issue.path.length ? ` .${issue.path.join('.')}` : '';
        fail(section, `${key}${at}: ${issue.message}`);
      }
    }
    const id = (value as { id?: unknown }).id;
    if (id !== undefined && id !== key) {
      fail(section, `key '${key}' carries id '${String(id)}' — keys and ids must agree`);
    }
  }
}

parseAll('heroes', HeroDefSchema, HEROES);
parseAll('abilities', AbilityDefSchema, ABILITIES);
parseAll('enemies', EnemyDefSchema, ENEMIES);
parseAll('items', ItemDefSchema, ITEMS);
parseAll('shops', ShopDefSchema, SHOPS);
parseAll('maps', MapDefSchema, MAPS);
for (const [id, script] of Object.entries(DIALOGUE)) {
  const r = DialogueScriptSchema.safeParse(script);
  if (!r.success) for (const i of r.error.issues) fail('dialogue', `${id}: ${i.message}`);
}

/* ================= 2. canon cross-checks (built so far) ================= */

// §A3 — the four heroes, exactly
{
  const want = HeroIdSchema.options;
  const have = Object.keys(HEROES);
  for (const id of want) if (!have.includes(id)) fail('canon', `§A3 hero '${id}' missing`);
  for (const id of have) {
    if (!(want as readonly string[]).includes(id)) fail('canon', `'${id}' is not a §A3 hero`);
  }
  if (have.length !== 4) fail('canon', `§A3 defines 4 heroes, found ${have.length}`);

  // every unlock must resolve, and §A3 pins: Mia prays from L1; Milo has no Vibe
  for (const h of Object.values(HEROES)) {
    for (const u of h.unlocks) {
      if (!ABILITIES[u.ability]) fail('canon', `${h.id} unlock L${u.level} → unknown ability '${u.ability}'`);
    }
  }
  if (!HEROES.faye.unlocks.some((u) => u.ability === 'pray' && u.level === 1)) {
    fail('canon', `§A3: Mia must unlock 'pray' at level 1`);
  }
  const miloVibe = HEROES.milo.unlocks.filter((u) => ABILITIES[u.ability]?.kind === 'vibe');
  if (miloVibe.length > 0 || HEROES.milo.base.vibe !== 0 || HEROES.milo.pp.base !== 0) {
    fail('canon', `§A3: Milo has no Vibe (found vibe abilities/stats/PP on him)`);
  }
}

// §A3 — the PRAY table: six tiers, the canon weights, summing 100
{
  const canon = { miraculous: 10, wonderful: 20, good: 30, nothing: 25, strange: 10, backfire: 5 };
  const r = PrayWeightsSchema.safeParse(PRAY_BASE);
  if (!r.success) for (const i of r.error.issues) fail('canon', `PRAY_BASE: ${i.message}`);
  const sum = Object.values(PRAY_BASE).reduce((a, b) => a + b, 0);
  if (sum !== 100) fail('canon', `§A3 Pray weights must sum 100, got ${sum}`);
  for (const [tier, w] of Object.entries(canon)) {
    if (PRAY_BASE[tier as keyof typeof PRAY_BASE] !== w) {
      fail('canon', `§A3 Pray '${tier}' is canon ${w}%, got ${PRAY_BASE[tier as keyof typeof PRAY_BASE]}%`);
    }
  }
}

// §A7 Ch.1 roster + §A6 Boss 1, with canon HP pins — both directions
{
  const canon: Record<string, number> = {
    cranky_mailbox: 24,
    runaway_lawnmower: 38,
    coily_cicada: 30,
    blazer_smiler: 55,
    pigeon_gang: 45,
    hill_slug_deluxe: 60,
    titanic_tick: 450,
  };
  for (const [id, hp] of Object.entries(canon)) {
    const e = ENEMIES[id];
    if (!e) {
      fail('canon', `§A7/§A6 enemy '${id}' missing from the roster`);
      continue;
    }
    if (e.hp !== hp) fail('canon', `'${id}' HP is canon ${hp}, got ${e.hp}`);
  }
  for (const id of Object.keys(ENEMIES)) {
    if (!(id in canon)) fail('canon', `'${id}' is not in the §A7 Ch.1 + Boss 1 manifest — extend the manifest with its chapter, never ad-hoc`);
  }
  if (ENEMIES.titanic_tick && ENEMIES.titanic_tick.boss !== true) {
    fail('canon', `§A6: titanic_tick must carry boss: true`);
  }
}

// S2 (ADR-014) — the PRODUCTIVITY LOCK: three distinct dos_f3 quota countFlags
{
  const patrols = MAPS.dos_f3?.patrols ?? [];
  if (patrols.map((p) => p.id).sort().join(',') !== 'f3a,f3b,f3c') {
    fail('canon', `dos_f3 patrol ids must be the stable f3a/f3b/f3c (ADR-011), got [${patrols.map((p) => p.id).join(', ')}]`);
  }
  const flags = patrols.map((p) => p.countFlag).filter((f): f is string => !!f);
  if (flags.length !== 3 || new Set(flags).size !== 3) {
    fail('canon', `the PRODUCTIVITY LOCK needs three distinct dos_f3 countFlags, got [${flags.join(', ')}]`);
  }
}

// §A8/ADR-016 — exactly the two Ch.1 shops, with their canon shelves
{
  const canon: Record<string, string[]> = {
    drugstore: ['tball_bat', 'corn_dog', 'pbj', 'salt_shaker'],
    starmart: ['tball_bat', 'hand_me_down_pan', 'star_cola', 'corn_dog', 'pbj', 'salt_shaker'],
  };
  const have = Object.keys(SHOPS);
  if (have.length !== 2) fail('canon', `Ch.1 ships 2 shops (drugstore, starmart), found ${have.length}`);
  for (const [id, stock] of Object.entries(canon)) {
    const shop = SHOPS[id];
    if (!shop) {
      fail('canon', `shop '${id}' missing`);
      continue;
    }
    for (const item of stock) {
      if (!shop.stock.includes(item)) fail('canon', `${id} must stock '${item}' (§A8 Ch.1)`);
    }
    for (const item of shop.stock) {
      if (!stock.includes(item)) fail('canon', `${id} stocks '${item}' beyond the §A8 Ch.1 manifest — extend the manifest, never ad-hoc`);
    }
  }
}

// S4 (ADR-016) — Star Cola is the lone 'pp' item, and it actually restores PP
{
  const ppItems = Object.values(ITEMS).filter((i) => i.kind === 'pp' || i.ppHeal !== undefined);
  if (ppItems.map((i) => i.id).join(',') !== 'star_cola') {
    fail('canon', `the Ch.1 'pp' line is star_cola alone, got [${ppItems.map((i) => i.id).join(', ')}]`);
  }
  if (!ITEMS.star_cola) fail('canon', `star_cola missing from ITEMS`);
  else if (!(ITEMS.star_cola.kind === 'pp' && (ITEMS.star_cola.ppHeal ?? 0) > 0)) {
    fail('canon', `star_cola must be kind 'pp' with ppHeal > 0`);
  }
}

/* ================= 3a. map cross-references ================= */

for (const m of Object.values(MAPS)) {
  // grid rows uniform; every char known to the legend (':' is the auto-edged path)
  const w = m.grid[0]?.length ?? 0;
  m.grid.forEach((row, y) => {
    if (row.length !== w) fail('maps', `${m.id} grid row ${y} is ${row.length} wide, row 0 is ${w}`);
    for (const ch of row) {
      if (ch !== ':' && !(ch in CHAR_LEGEND)) fail('maps', `${m.id} grid uses '${ch}' — not in CHAR_LEGEND`);
    }
  });

  // doors (zones and prop doors) must land on a real map, inside its bounds
  const doorTargets: Array<{ kind: string; to: string; tx: number; ty: number }> = [
    ...m.doors.map((d) => ({ kind: 'door', to: d.to, tx: d.tx, ty: d.ty })),
    ...m.props.flatMap((p) => (p.door ? [{ kind: `prop '${p.sprite}' door`, to: p.door.to, tx: p.door.tx, ty: p.door.ty }] : [])),
  ];
  for (const d of doorTargets) {
    const target = MAPS[d.to];
    if (!target) {
      fail('maps', `${m.id} ${d.kind} → '${d.to}': no such map`);
      continue;
    }
    const tw = (target.grid[0]?.length ?? 0) * 16;
    const th = target.grid.length * 16;
    if (d.tx < 0 || d.tx >= tw || d.ty < 0 || d.ty >= th) {
      fail('maps', `${m.id} ${d.kind} → ${d.to} lands at (${d.tx},${d.ty}), outside its ${tw}×${th}px bounds`);
    }
  }

  // npcs and signs must speak existing dialogue; npc shops must exist
  for (const n of m.npcs) {
    if (!DIALOGUE[n.dialogue]) fail('maps', `${m.id} npc '${n.id}' → unknown dialogue '${n.dialogue}'`);
    if (n.shop !== undefined && !SHOPS[n.shop]) fail('maps', `${m.id} npc '${n.id}' opens unknown shop '${n.shop}'`);
  }
  for (const s of m.signs) {
    if (!DIALOGUE[s.dialogue]) fail('maps', `${m.id} sign at (${s.x},${s.y}) → unknown dialogue '${s.dialogue}'`);
  }

  // spawners and patrols must roll existing enemies; patrols need a roamable sprite
  for (const sp of m.spawners) {
    for (const id of sp.enemies) {
      if (!ENEMIES[id]) fail('maps', `${m.id} spawner → unknown enemy '${id}'`);
    }
  }
  for (const p of m.patrols ?? []) {
    const def = ENEMIES[p.enemy];
    if (!def) fail('maps', `${m.id} patrol '${p.id}' → unknown enemy '${p.enemy}'`);
    else if (!(def.walker ?? def.mini)) fail('maps', `${m.id} patrol '${p.id}': enemy '${p.enemy}' has no walker/mini sprite`);
  }
}

// every legend tile name must resolve in the generated tileset
for (const [ch, name] of Object.entries(CHAR_LEGEND)) {
  try {
    tileIndexByName(name);
  } catch {
    fail('maps', `CHAR_LEGEND '${ch}' → unknown tile '${name}'`);
  }
}

/* ================= 3b. shop cross-references (ADR-016) ================= */

for (const shop of Object.values(SHOPS)) {
  for (const id of shop.stock) {
    const item = ITEMS[id];
    if (!item) fail('shops', `${shop.id} stocks unknown item '${id}'`);
    else if (item.price <= 0) fail('shops', `${shop.id}: '${id}' needs a price > 0 to be merchandise`);
  }
  if (!DIALOGUE[shop.greet]) fail('shops', `${shop.id} greet → unknown dialogue '${shop.greet}'`);
  if (!DIALOGUE[shop.farewell]) fail('shops', `${shop.id} farewell → unknown dialogue '${shop.farewell}'`);

  // the keeper must stand somewhere, exactly once, and open THIS shop
  const placements = Object.values(MAPS).flatMap((m) =>
    m.npcs.filter((n) => n.id === shop.keeperNpc).map((n) => ({ map: m.id, npc: n })),
  );
  if (placements.length !== 1) {
    fail('shops', `${shop.id} keeper '${shop.keeperNpc}' placed on ${placements.length} maps (${placements.map((p) => p.map).join(', ') || 'none'}) — must be exactly 1`);
  } else if (placements[0].npc.shop !== shop.id) {
    fail('shops', `${shop.id} keeper '${shop.keeperNpc}' opens '${placements[0].npc.shop ?? 'nothing'}', not '${shop.id}'`);
  }
}

/* ================= 4. {token} sweeps ================= */

const DIALOGUE_TOKENS = new Set(Object.keys(TEXT_VARS));
const BATTLE_TOKENS = new Set([...DIALOGUE_TOKENS, ...BATTLE_FILL_TOKENS]);
const tokensOf = (s: string): string[] => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);

function sweepTokens(section: string, where: string, text: string, allowed: Set<string>): void {
  for (const t of tokensOf(text)) {
    if (!allowed.has(t)) {
      fail(section, `${where}: unknown token {${t}} — known: ${[...allowed].map((k) => `{${k}}`).join(' ')}`);
    }
  }
}

// dialogue pages render through vars() (windows.ts say()) — TEXT_VARS only
for (const [id, pages] of Object.entries(DIALOGUE)) {
  pages.forEach((page, i) => sweepTokens('text', `dialogue '${id}' page ${i + 1}`, page, DIALOGUE_TOKENS));
}
// map name banners render through vars() too
for (const m of Object.values(MAPS)) sweepTokens('text', `map '${m.id}' name`, m.name, DIALOGUE_TOKENS);
// item names/descriptions surface in say()-driven menus and shops
for (const item of Object.values(ITEMS)) {
  sweepTokens('text', `item '${item.id}' text`, item.text, DIALOGUE_TOKENS);
  sweepTokens('text', `item '${item.id}' name`, item.name, DIALOGUE_TOKENS);
}
// battle-rendered strings additionally pass BattleScene.fill(): {user}/{e}/{t}
for (const a of Object.values(ABILITIES)) sweepTokens('text', `ability '${a.id}' text`, a.text, BATTLE_TOKENS);
for (const [tier, line] of Object.entries(PRAY_TEXT)) sweepTokens('text', `PRAY_TEXT.${tier}`, line, BATTLE_TOKENS);
for (const [key, line] of Object.entries(BATTLE_TEXT)) sweepTokens('text', `BATTLE_TEXT.${key}`, line, BATTLE_TOKENS);
for (const e of Object.values(ENEMIES)) {
  for (const mv of e.moves) sweepTokens('text', `enemy '${e.id}' move '${mv.name}'`, mv.text, BATTLE_TOKENS);
  sweepTokens('text', `enemy '${e.id}' deathLine`, e.deathLine, BATTLE_TOKENS);
}

/* ================= 5. New Game values fit the letter grid ================= */

{
  const charset = gridCharset();
  for (const e of NEW_GAME_ENTRIES) {
    for (const v of [e.prefill, ...e.dontCare]) {
      if (v.length > e.cap) fail('newgame', `'${e.key}' value '${v}' is ${v.length} chars, cap ${e.cap}`);
      for (const ch of v) {
        if (!charset.has(ch)) fail('newgame', `'${e.key}' value '${v}': '${ch}' is not typeable on the grid`);
      }
    }
  }
}

/* ================= 6. placeholder sweep (§B4) ================= */

function sweepPlaceholders(section: string, node: unknown, path: string): void {
  if (typeof node === 'string') {
    if (/\b(todo|placeholder|lorem)\b/i.test(node)) fail('§B4', `${path} contains placeholder text: "${node.slice(0, 60)}"`);
  } else if (Array.isArray(node)) {
    node.forEach((v, i) => sweepPlaceholders(section, v, `${path}[${i}]`));
  } else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (k === 'grid') continue; // tile charsets, not prose
      sweepPlaceholders(section, v, `${path}.${k}`);
    }
  }
}
sweepPlaceholders('§B4', { HEROES, ABILITIES, PRAY_TEXT, ENEMIES, ITEMS, SHOPS, MAPS, DIALOGUE, BATTLE_TEXT, NEW_GAME_ENTRIES }, 'data');

/* ================= verdict ================= */

const counts = [
  `${Object.keys(HEROES).length} heroes`,
  `${Object.keys(ABILITIES).length} abilities`,
  `${Object.keys(ENEMIES).length} enemies (§A7 Ch.1 + Boss 1)`,
  `${Object.keys(ITEMS).length} items`,
  `${Object.keys(SHOPS).length} shops`,
  `${Object.keys(MAPS).length} maps`,
  `${Object.keys(DIALOGUE).length} dialogue scripts`,
].join(' · ');

if (errors.length > 0) {
  console.error(`\nMETEOR FALLS content validation — ${errors.length} error(s):\n`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  console.error('');
  process.exit(1);
}
console.log(`✓ content valid — ${counts} · pray table sums 100 · quest schema ready (S9)`);
