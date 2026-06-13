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
  QuestDefSchema,
  ShopDefSchema,
} from '../src/schemas';
import { HEROES } from '../src/data/heroes';
import { ABILITIES, PRAY_BASE, PRAY_TEXT } from '../src/data/abilities';
import { FX_REGISTRY, STAGE_ANIM, itemFxKey } from '../src/battle/fxRegistry';
import { ENEMIES } from '../src/data/enemies';
import { ITEMS, slotOf } from '../src/data/items';
import { WEAPON_ART } from '../src/spritegen/weapons';
import { ENEMY_BATTLE_ART } from '../src/spritegen/enemies';
import { SHOPS } from '../src/data/shops';
import { QUESTS } from '../src/data/quests';
import { ARCADE_TEXT, MGR_ROW } from '../src/data/arcade';
import {
  TEAMS,
  TEAM_ORDER,
  WALK_ONS,
  WALK_ON_ORDER,
  HOOPS_TEXT,
  HOOPS_FILL_TOKENS,
  HOOPS_REWARDS,
  STARTING_FIVE,
} from '../src/data/hoops';
import { AWAKENINGS } from '../src/data/awakenings';
import { BOSS_SCRIPTS } from '../src/data/bosses';
import { DRAFT_BOSS_SCRIPTS, DRAFT_BOSS_IDS } from '../src/data/drafts/bosses';
import { BossScriptDefSchema } from '../src/schemas';
import { FORM_ART } from '../src/spritegen/enemies';
import { CAST } from '../src/spritegen/characters';
// S12c: the cage's math + frame contracts are Phaser-free and pinnable
import { SPORT_FRAME, SPORT_FRAME_COUNT } from '../src/spritegen/athletes';
import { RANGE, METER, BLOCK_TIMING, STEAL_TIMING, MOVES, LAYUP_METER, FINISH_RANGE_PX, effectiveRange, greenWindow, makeChance, dunkWindow, layupWindow } from '../src/hoops/sim';
import { COURT } from '../src/hoops/court';
// S13: the links — holes, golfers, rewards, the SUNDAY SET, the golfer sheet
import { HOLES, CLUBS, COURSE_PAR, expandGrid, terrainAt } from '../src/links/course';
import { GOLFERS, GOLFER_ORDER, LINKS_TEXT, LINKS_FILL_TOKENS, LINKS_REWARDS, SUNDAY_SET } from '../src/data/links';
import { GOLF_FRAME, GOLF_FRAME_COUNT } from '../src/spritegen/golfers';
import { COSTA_DOOR_FOR_PUERTO_SOL } from '../src/data/maps';
import { GolferDefSchema, LinksHoleSchema, ClubDefSchema } from '../src/schemas';
import { AwakeningDefSchema, TeamDefSchema, WalkOnDefSchema } from '../src/schemas';
import { CHAR_LEGEND, MAPS } from '../src/data/maps';
import { BATTLE_FILL_TOKENS, BATTLE_TEXT, DIALOGUE } from '../src/data/dialogue';
import { NEW_GAME_ENTRIES, gridCharset } from '../src/data/newgame';
import { TEXT_VARS } from '../src/ui/text';
import { tileIndexByName, TILESET } from '../src/spritegen/tiles';
import { mapQualityFlags } from '../src/levelkit/mapcheck';
import { pressureReport, pressureHardFlags } from '../src/levelkit/pressure';
// S15g 3b — THE SPRITE FORGE: the part catalog, the composer, the recorded picks
import { composeEnemy, CATALOG, ROLE_POOLS, CHAPTER_REGION } from '../src/spritegen/parts';
import { FORGED_ENEMIES } from '../src/levelkit/forge/registry';
import { FACE_PICKS } from '../src/data/drafts/faces';
import { PartsSpecSchema } from '../src/schemas';
import { T } from '../src/palette';
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
parseAll('quests', QuestDefSchema, QUESTS); // S9 — the schema waited since S5
parseAll('maps', MapDefSchema, MAPS);
for (const [id, script] of Object.entries(DIALOGUE)) {
  const r = DialogueScriptSchema.safeParse(script);
  if (!r.success) for (const i of r.error.issues) fail('dialogue', `${id}: ${i.message}`);
}

/* ================= 2. canon cross-checks (built so far) ================= */

// §A3 — the FIVE heroes, exactly (S15h/ADR-048: Pippa joins the roster)
{
  const want = HeroIdSchema.options;
  const have = Object.keys(HEROES);
  for (const id of want) if (!have.includes(id)) fail('canon', `§A3 hero '${id}' missing`);
  for (const id of have) {
    if (!(want as readonly string[]).includes(id)) fail('canon', `'${id}' is not a §A3 hero`);
  }
  if (have.length !== 5) fail('canon', `§A3 defines 5 heroes, found ${have.length}`);

  // every unlock must resolve, and §A3 pins: Mia prays from L1; Milo AND Pippa
  // have no Vibe (the two no-PSI heroes — competence, not the old light)
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
  const pippaVibe = HEROES.pippa.unlocks.filter((u) => ABILITIES[u.ability]?.kind === 'vibe');
  if (pippaVibe.length > 0 || HEROES.pippa.base.vibe !== 0 || HEROES.pippa.pp.base !== 0) {
    fail('canon', `§A3: Pippa has no Vibe (found vibe abilities/stats/PP on her)`);
  }
}

// S11 — EVERY ABILITY GETS A FACE: the fx registry, checked BOTH directions.
// An ability whose fx key is unregistered fails naming the ability; a
// kind-'ability' registry key no ability references is a dead manifest row
// and fails naming the key. Battle items resolve through itemFxKey the same
// way. kind-'system' keys (impacts, dissolves, the tether, the six pray
// events, the Prompt-15 summon/phase hooks) are engine-invoked and exempt
// from the reverse check.
{
  const used = new Set<string>();
  for (const a of Object.values(ABILITIES)) {
    used.add(a.fx);
    const spec = FX_REGISTRY[a.fx];
    if (!spec) fail('fx', `ability '${a.id}' fx key '${a.fx}' is not in the FX REGISTRY`);
    else if (spec.kind !== 'ability') fail('fx', `ability '${a.id}' fx key '${a.fx}' is kind '${spec.kind}', must be 'ability'`);
  }
  for (const [key, spec] of Object.entries(FX_REGISTRY)) {
    if (spec.kind === 'ability' && !used.has(key)) {
      fail('fx', `registry key '${key}' (kind ability) is referenced by no ability — extend or retire the manifest row`);
    }
  }
  const itemReach = new Set<string>();
  for (const item of Object.values(ITEMS)) {
    if (!item.usableInBattle) continue;
    const key = itemFxKey(item.id, item.kind);
    if (key === null) {
      fail('fx', `battle item '${item.id}' (kind '${item.kind}') resolves no fx key — extend ITEM_FX/ITEM_KIND_FX`);
      continue;
    }
    itemReach.add(key);
    const spec = FX_REGISTRY[key];
    if (!spec) fail('fx', `battle item '${item.id}' fx key '${key}' is not in the FX REGISTRY`);
    else if (spec.kind !== 'item') fail('fx', `battle item '${item.id}' fx key '${key}' is kind '${spec.kind}', must be 'item'`);
  }
  for (const [key, spec] of Object.entries(FX_REGISTRY)) {
    if (spec.kind === 'item' && !itemReach.has(key)) {
      fail('fx', `registry key '${key}' (kind item) is reachable from no battle-usable item`);
    }
  }
  // the six pray events stay authored (§A11.4 — six DISTINCT events)
  for (const tier of ['miraculous', 'wonderful', 'good', 'nothing', 'strange', 'backfire']) {
    if (!FX_REGISTRY[`pray_${tier}`]) fail('fx', `pray event 'pray_${tier}' missing from the registry`);
  }
}

// S11b — EVERY FAMILY GETS A STAGE ANIM: the STAGE_ANIM map beside the
// registry, checked both directions. A registry family with no stage row
// fails naming the family; a stage row no registry entry uses is a dead
// manifest row and fails naming it. (Bash is choreographed directly by
// BattleScene off the weapon class — it is not a family.)
{
  const used = new Set<string>();
  for (const [key, spec] of Object.entries(FX_REGISTRY)) {
    used.add(spec.family);
    if (!(spec.family in STAGE_ANIM)) {
      fail('stage', `fx '${key}' family '${spec.family}' resolves no STAGE_ANIM row — every family gets choreography`);
    }
  }
  for (const family of Object.keys(STAGE_ANIM)) {
    if (!used.has(family)) {
      fail('stage', `STAGE_ANIM row '${family}' is used by no FX_REGISTRY entry — extend or retire the manifest row`);
    }
  }
}

// S11b — WEAPONS ARE REAL OBJECTS: every §A8 equippable maps to drawn art
// (WEAPON_ART), checked both directions, with the art kind agreeing with
// the equip slot: weapons carry 'held' art (composed into the battler's
// swing), body gear 'torso' art (rendered on battler + bust), 'other'-slot
// charms 'trinket' icons. Equipment is never invisible again.
{
  // S12 amends ADR-032's provisional arms→torso mapping (no arms item
  // existed then): arms gear ships as DRAWN ICONS — a 2px wristband cannot
  // read on a 28px battler arm. ADR-034 records it.
  const SLOT_KIND: Record<string, 'held' | 'torso' | 'trinket'> = {
    weapon: 'held',
    body: 'torso',
    arms: 'trinket',
    other: 'trinket',
  };
  for (const item of Object.values(ITEMS)) {
    const slot = slotOf(item);
    if (slot === null) continue;
    const art = WEAPON_ART[item.id];
    if (!art) {
      fail('weapon-art', `equippable '${item.id}' (slot ${slot}) has no WEAPON_ART row — drawn art is part of shipping gear`);
      continue;
    }
    if (art.kind !== SLOT_KIND[slot]) {
      fail('weapon-art', `'${item.id}' rides slot '${slot}' but its art is kind '${art.kind}' — expected '${SLOT_KIND[slot]}'`);
    }
  }
  for (const id of Object.keys(WEAPON_ART)) {
    const item = ITEMS[id];
    if (!item) fail('weapon-art', `WEAPON_ART row '${id}' claims no §A8 item — extend or retire the manifest row`);
    else if (slotOf(item) === null) fail('weapon-art', `WEAPON_ART row '${id}' points at '${id}', which is not equippable`);
  }
}

// S11b — WEAR TIERS, BOTH DIRECTIONS: every §A7 roster enemy has a wear-
// capable battle draw in ENEMY_BATTLE_ART (with its sprite key agreeing
// with the data), and every wear row maps to a roster enemy.
{
  for (const e of Object.values(ENEMIES)) {
    const row = ENEMY_BATTLE_ART[e.id];
    if (!row) {
      fail('wear', `enemy '${e.id}' has no ENEMY_BATTLE_ART row — every battle sprite reads the drums (S11b)`);
      continue;
    }
    if (row.sprite !== e.sprite) {
      fail('wear', `'${e.id}' wear art keys sprite '${row.sprite}' but the data says '${e.sprite}' — the swap would miss`);
    }
  }
  for (const id of Object.keys(ENEMY_BATTLE_ART)) {
    if (!ENEMIES[id]) fail('wear', `ENEMY_BATTLE_ART row '${id}' matches no §A7 roster enemy — extend or retire the row`);
  }
}

// S11b — THE DOOR LAW (user: "any entry way needs a door, not just a mat"):
// inside interiors, a facing-'up' door zone goes THROUGH a wall and must be
// tagged 'door' (mats alone stay legal only for bottom-edge exits; stairs
// and elevators remain their own things). The default indicator in an
// interior is 'mat', so an untagged north door fails too.
{
  for (const m of Object.values(MAPS)) {
    if (!m.interior) continue;
    m.doors.forEach((d, i) => {
      const kind = d.indicator ?? 'mat';
      if (d.facing === 'up' && kind === 'mat') {
        fail('doors', `${m.id} door[${i}] → ${d.to} faces 'up' through a wall but is tagged '${d.indicator ?? 'mat (default)'}' — tag it 'door'`);
      }
    });
  }
}

// §A8 weapon-line manifest (S11b, pinned both directions like the roster):
// the Ch.1 shelf bats + Mia's pan, and the S11b stage-kit line openers.
{
  const canon: Record<string, string> = {
    cracked_bat: 'rex',
    tball_bat: 'rex',
    sandlot_slugger: 'rex', // S14 — §A8 Ch.2: the bat line's third rung
    hand_me_down_pan: 'faye',
    copper_pan: 'faye', // S14 — §A8 Ch.2: the pan line's second rung
    pellet_popper: 'milo',
    cedar_beads: 'dorin',
  };
  for (const [id, wielder] of Object.entries(canon)) {
    const item = ITEMS[id];
    if (!item) fail('canon', `§A8 weapon '${id}' missing from ITEMS`);
    else if (item.wielder !== wielder) fail('canon', `§A8 weapon '${id}' belongs to '${wielder}', got '${item.wielder ?? 'nobody'}'`);
  }
  for (const item of Object.values(ITEMS)) {
    if (item.kind === 'weapon' && !(item.id in canon)) {
      fail('canon', `weapon '${item.id}' is not in the §A8 weapon manifest — extend the manifest, never ad-hoc`);
    }
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

// §A7 roster + §A6 bosses, with canon HP pins — both directions.
// S14 extends the manifest with the Ch.2 six + BOSS 2 (the drift-log rule
// applied to data: adding content = extending THIS table, same commit).
{
  const canon: Record<string, number> = {
    // Chapter 1
    cranky_mailbox: 24,
    runaway_lawnmower: 38,
    coily_cicada: 30,
    blazer_smiler: 55,
    pigeon_gang: 45,
    hill_slug_deluxe: 60,
    titanic_tick: 450,
    // Chapter 2 (S14) — §A7's South America six; banana_bunch is 22 EACH
    // (the union attacks 5×22, §A7's group notation)
    pickpocket_parrot: 70,
    gilded_beetle: 85,
    cursed_souvenir: 95,
    step_mask: 110,
    banana_bunch: 22,
    jungle_jitterbug: 120,
    gilded_grin: 980,
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
    if (!(id in canon)) fail('canon', `'${id}' is not in the §A7 Ch.1–2 + Boss manifest — extend the manifest with its chapter, never ad-hoc`);
  }
  for (const bossId of ['titanic_tick', 'gilded_grin']) {
    if (ENEMIES[bossId] && ENEMIES[bossId].boss !== true) {
      fail('canon', `§A6: ${bossId} must carry boss: true`);
    }
  }
  // §A7 Ch.2 quirks are real mechanics, pinned: the parrot steals CASH, the
  // beetle gilds, the mask shields, the jitterbug paralyzes, the souvenir cries
  const moveKind = (id: string, kind: string): boolean => ENEMIES[id]?.moves.some((m) => m.kind === kind) ?? false;
  if (!moveKind('pickpocket_parrot', 'stealcash')) fail('canon', `pickpocket_parrot needs its 'stealcash' move (§A7: steals cash)`);
  if (!moveKind('gilded_beetle', 'gild')) fail('canon', `gilded_beetle needs its 'gild' move (§A7: gold form)`);
  if (!moveKind('step_mask', 'shield')) fail('canon', `step_mask needs its 'shield' move (§A7: casts Shield)`);
  if (!ENEMIES.jungle_jitterbug?.moves.some((m) => m.status === 'paralyzed')) {
    fail('canon', `jungle_jitterbug needs a Paralyze move (§A7)`);
  }
  if (!ENEMIES.cursed_souvenir?.moves.some((m) => m.status === 'crying')) {
    fail('canon', `cursed_souvenir needs a Crying move (§A7)`);
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
// (S9 extended both per §A10 #3: the twins' sugar + city-lemon supplies)
{
  const canon: Record<string, string[]> = {
    drugstore: ['tball_bat', 'corn_dog', 'pbj', 'salt_shaker', 'sugar_bag'],
    starmart: ['tball_bat', 'hand_me_down_pan', 'star_cola', 'corn_dog', 'pbj', 'salt_shaker', 'lemon_crate', 'basket_basic'],
    mercado: ['sandlot_slugger', 'alfajor', 'star_cola', 'salt_shaker', 'hanky', 'aloe_leaf', 'basket_basic', 'tin_sun_pendant'],
    valle_shop: ['copper_pan', 'alfajor', 'corn_dog', 'star_cola', 'aloe_leaf', 'hanky', 'basket_basic'],
  };
  const have = Object.keys(SHOPS);
  if (have.length !== 4) fail('canon', `Ch.1–2 ship 4 shops (drugstore, starmart, mercado, valle_shop), found ${have.length}`);
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

// §A10 #1–4 (S9 + S10) — the Chapter 1 side quests, pinned in BOTH
// directions: every canon quest with its exact name/caller/effect/reward/
// flag set, and no quest outside the manifest. A missing objective flag,
// reward item, or caller record fails here naming the gap.
{
  interface QuestPin {
    name: string;
    chapter: number;
    giver: string;
    startFlag: string;
    objectiveFlags: string[];
    rewardItem?: string;
    doneFlag: string;
    caller: { name: string; kind: 'damage' | 'heal'; power: number };
  }
  const canon: Record<string, QuestPin> = {
    biscuit_come_home: {
      name: 'Biscuit, Come Home',
      chapter: 1,
      giver: 'mrs_pemmel',
      startFlag: 'q_biscuit',
      objectiveFlags: ['q_biscuit_c1', 'q_biscuit_c2', 'q_biscuit_c3', 'q_biscuit_walked'],
      rewardItem: 'lucky_collar',
      doneFlag: 'q_biscuit_done',
      caller: { name: 'Mrs. Pemmel', kind: 'damage', power: 400 },
    },
    mail_must_move: {
      name: 'Mail Must Move',
      chapter: 1,
      giver: 'mr_plummer',
      startFlag: 'q_mail',
      objectiveFlags: ['q_mail_pickles', 'q_mail_sodd', 'q_mail_birch', 'q_mail_chapel', 'q_mail_arcade', 'q_mail_reported'],
      rewardItem: 'fresh_stamps',
      doneFlag: 'q_mail_done',
      caller: { name: 'Mr. Plummer', kind: 'damage', power: 450 },
    },
    lemonade_empire: {
      name: 'Lemonade Empire',
      chapter: 1,
      giver: 'ana',
      startFlag: 'q_lemonade',
      objectiveFlags: ['q_lem_sugar', 'q_lem_lemons', 'q_lem_water', 'q_lem_poured'],
      doneFlag: 'q_lemonade_done',
      caller: { name: 'Ana & Vivi', kind: 'heal', power: 400 },
    },
    arcade_legend: {
      name: 'Arcade Legend',
      chapter: 1,
      giver: 'arcade_owner',
      startFlag: 'q_arcade',
      objectiveFlags: ['q_arcade_beat', 'q_arcade_claimed'],
      rewardItem: 'champion_jacket',
      doneFlag: 'q_arcade_done',
      caller: { name: 'Sal', kind: 'damage', power: 425 },
    },
    llama_drama: {
      name: 'The Llama Drama',
      chapter: 2,
      giver: 'tomas',
      startFlag: 'q_llama',
      objectiveFlags: ['q_llama_1', 'q_llama_2', 'q_llama_3', 'q_llama_4', 'q_llama_5', 'q_llama_6', 'q_llama_reported'],
      rewardItem: 'wool_poncho',
      doneFlag: 'q_llama_done',
      caller: { name: 'Tomas', kind: 'damage', power: 420 },
    },
    museum_gold: {
      name: 'Museum of Almost-Gold',
      chapter: 2,
      giver: 'curator',
      startFlag: 'q_museum',
      objectiveFlags: ['q_photo_1', 'q_photo_2', 'q_photo_3', 'q_photo_4', 'q_museum_reported'],
      rewardItem: 'camera_flash',
      doneFlag: 'q_museum_done',
      caller: { name: 'The Curator', kind: 'damage', power: 435 },
    },
  };
  for (const [id, pin] of Object.entries(canon)) {
    const q = QUESTS[id];
    if (!q) {
      fail('canon', `§A10 quest '${id}' missing from QUESTS`);
      continue;
    }
    if (q.name !== pin.name) fail('canon', `§A10 quest '${id}' is named '${q.name}', canon '${pin.name}'`);
    if (q.chapter !== pin.chapter) fail('canon', `'${id}' is chapter ${q.chapter}, canon ${pin.chapter}`);
    if (q.giver !== pin.giver) fail('canon', `'${id}' giver is '${q.giver ?? 'nobody'}', canon '${pin.giver}'`);
    if (q.startFlag !== pin.startFlag) fail('canon', `'${id}' startFlag is '${q.startFlag}', canon '${pin.startFlag}'`);
    if (q.doneFlag !== pin.doneFlag) fail('canon', `'${id}' doneFlag is '${q.doneFlag}', canon '${pin.doneFlag}'`);
    const flags = q.objectives.map((o) => o.flag);
    if (flags.join(',') !== pin.objectiveFlags.join(',')) {
      fail('canon', `'${id}' objective flags are [${flags.join(', ')}], canon [${pin.objectiveFlags.join(', ')}]`);
    }
    if (q.rewardItem !== pin.rewardItem) {
      fail('canon', `'${id}' rewardItem is '${q.rewardItem ?? 'none'}', canon '${pin.rewardItem ?? 'none (the stand itself pays)'}'`);
    }
    if (q.rewardItem !== undefined && !ITEMS[q.rewardItem]) {
      fail('canon', `'${id}' reward '${q.rewardItem}' missing from ITEMS`);
    }
    if (q.caller.name !== pin.caller.name) fail('canon', `'${id}' caller is '${q.caller.name}', canon '${pin.caller.name}'`);
    if (q.caller.effect.kind !== pin.caller.kind || q.caller.effect.power !== pin.caller.power) {
      fail('canon', `'${id}' caller effect is ${q.caller.effect.kind} ${q.caller.effect.power}, canon ${pin.caller.kind} ${pin.caller.power}`);
    }
    // the giver must stand on some map under that npc id (talkTo keys on it)
    const placed = Object.values(MAPS).some((m) => m.npcs.some((n) => n.id === pin.giver));
    if (!placed) fail('canon', `'${id}' giver npc '${pin.giver}' stands on no map`);
  }
  for (const id of Object.keys(QUESTS)) {
    if (!(id in canon)) fail('canon', `'${id}' is not in the §A10 #1–6 manifest — extend the manifest with its §A10 row, never ad-hoc`);
  }
  // quest flags never collide across quests — the machines stay independent
  const all = Object.values(QUESTS).flatMap((q) => [q.startFlag, q.doneFlag, ...q.objectives.map((o) => o.flag)]);
  for (const f of all) {
    if (all.filter((x) => x === f).length > 1) fail('canon', `quest flag '${f}' is used by more than one quest/step`);
  }
  // §A10 #1/#2 reward pins: the collar is a real charm; the stamps sell high
  if (ITEMS.lucky_collar && !(ITEMS.lucky_collar.kind === 'charm' && (ITEMS.lucky_collar.luck ?? 0) > 0 && ITEMS.lucky_collar.price === 0)) {
    fail('canon', `lucky_collar must be an unsellable charm with a luck bonus (§A10 #1)`);
  }
  if (ITEMS.fresh_stamps && !(ITEMS.fresh_stamps.kind === 'valuable' && ITEMS.fresh_stamps.price === 240)) {
    fail('canon', `fresh_stamps must be 'valuable' priced 240 — §A10 #2 "sell high" (sells for half: the gag)`);
  }
  // §A10 #3 needs the small-HP lemonade and the official jug
  if (!(ITEMS.lemonade && ITEMS.lemonade.kind === 'food' && (ITEMS.lemonade.heal ?? 0) > 0)) {
    fail('canon', `§A10 #3 needs 'lemonade' as a small HP food item`);
  }
  if (!(ITEMS.lemonade_jug && ITEMS.lemonade_jug.kind === 'key')) {
    fail('canon', `§A10 #3 needs 'lemonade_jug' as a key item`);
  }
  // §A10 #4 reward pin (S10): the Champion Jacket is the first 'body' armor
  if (ITEMS.champion_jacket && !(ITEMS.champion_jacket.kind === 'armor' && (ITEMS.champion_jacket.defense ?? 0) > 0 && ITEMS.champion_jacket.price === 0)) {
    fail('canon', `champion_jacket must be unsellable 'armor' with a defense bonus (§A10 #4)`);
  }
  const ARMOR_LINE = ['champion_jacket', 'wool_poncho']; // S14: the poncho joins
  if (Object.values(ITEMS).some((i) => i.kind === 'armor' && !ARMOR_LINE.includes(i.id))) {
    fail('canon', `the §A8 'armor' line is [${ARMOR_LINE.join(', ')}] — extend the manifest, never ad-hoc`);
  }
  if (ITEMS.wool_poncho && !(ITEMS.wool_poncho.kind === 'armor' && (ITEMS.wool_poncho.defense ?? 0) > 0 && ITEMS.wool_poncho.price === 0)) {
    fail('canon', `wool_poncho must be unsellable 'armor' with a defense bonus (§A10 #5)`);
  }
}

// §A10 #4 (S10) — the ARCADE LEGEND cabinet itself: MGR's canon attract row
// (the score every fresh save and every migrated save starts against), the
// quest venue standing in Brickton, and the playable cabinet's sign.
{
  if (!(MGR_ROW.initials === 'MGR' && MGR_ROW.score === 3000)) {
    fail('canon', `the attract-mode row is canon MGR / 3000, got ${MGR_ROW.initials} / ${MGR_ROW.score}`);
  }
  const venue = MAPS.arcade2_int;
  if (!venue) {
    fail('canon', `§A10 #4's venue 'arcade2_int' (STARPORT II, Brickton) is missing`);
  } else {
    if (!venue.signs.some((s) => s.dialogue === 'cab_legend')) {
      fail('canon', `STARPORT II needs the 'cab_legend' sign — the playable cabinet's launch beat`);
    }
    if (!venue.props.some((p) => p.sprite === 'cab_legend')) {
      fail('canon', `STARPORT II needs the cab_legend cabinet prop`);
    }
  }
  if (!MAPS.brickton?.props.some((p) => p.door?.to === 'arcade2_int')) {
    fail('canon', `Brickton's bldg_arcade2 facade must open into arcade2_int (§A10 #4)`);
  }
  if (!MAPS.otterbrook?.props.some((p) => p.door?.to === 'arcade_int')) {
    fail('canon', `Otterbrook's STARPORT facade must open into arcade_int (S10)`);
  }
}

/* ================= S12b — AWAKENINGS (ADR-035) ================= */

parseAll('awakenings', AwakeningDefSchema, AWAKENINGS);

// the Ch.1 awakening manifest, pinned both directions: heroes start with
// ZERO Vibe and the old light arrives at exactly these story moments
{
  const canon: Record<string, { hero: string; ability: string; flag: string; dialogue: string }> = {
    old_light: { hero: 'rex', ability: 'vibe_surge_a', flag: 'awake_surge_a', dialogue: 'awake_old_light' },
    last_spark: { hero: 'rex', ability: 'lifeup_a', flag: 'awake_lifeup_a', dialogue: 'awake_last_spark' },
    first_listen: { hero: 'faye', ability: 'vibe_fire_a', flag: 'awake_fire_a', dialogue: 'awake_first_listen' },
    // S14 — Ch.2's emotional center: the HOLLOW reveal (§A3 ladder amended:
    // Freeze α left Mia's L12 row in the same commit)
    cold_reads: { hero: 'faye', ability: 'vibe_freeze_a', flag: 'awake_freeze_a', dialogue: 'awake_cold_reads' },
  };
  for (const [id, pin] of Object.entries(canon)) {
    const a = AWAKENINGS[id];
    if (!a) {
      fail('awaken', `Ch.1 awakening '${id}' missing (ADR-035 manifest)`);
      continue;
    }
    if (a.hero !== pin.hero || a.ability !== pin.ability || a.flag !== pin.flag || a.dialogue !== pin.dialogue) {
      fail('awaken', `'${id}' is ${a.hero}/${a.ability}/${a.flag}/${a.dialogue}, canon ${pin.hero}/${pin.ability}/${pin.flag}/${pin.dialogue}`);
    }
  }
  for (const id of Object.keys(AWAKENINGS)) {
    if (!(id in canon)) fail('awaken', `'${id}' is not in the Ch.1–2 awakening manifest — extend it with its chapter, never ad-hoc`);
  }
  for (const a of Object.values(AWAKENINGS)) {
    const ab = ABILITIES[a.ability];
    if (!ab) fail('awaken', `'${a.id}' grants unknown ability '${a.ability}'`);
    else if (ab.kind !== 'vibe') fail('awaken', `'${a.id}' grants kind '${ab.kind}' — awakenings carry Vibe (gadgets are Milo's identity, not the old light)`);
    if (!DIALOGUE[a.dialogue]) fail('awaken', `'${a.id}' → unknown dialogue '${a.dialogue}'`);
    // no double path: an awakened ability must NOT also sit in the unlock table
    if (HEROES[a.hero].unlocks.some((u) => u.ability === a.ability)) {
      fail('awaken', `'${a.ability}' is BOTH awakened ('${a.id}') and level-unlocked on ${a.hero} — one path only`);
    }
  }
  // flags stay unique across awakenings AND quests (the machines stay independent)
  const aFlags = Object.values(AWAKENINGS).map((a) => a.flag);
  const qFlags = Object.values(QUESTS).flatMap((q) => [q.startFlag, q.doneFlag, ...q.objectives.map((o) => o.flag)]);
  for (const f of aFlags) {
    if (aFlags.filter((x) => x === f).length > 1) fail('awaken', `awakening flag '${f}' used twice`);
    if (qFlags.includes(f)) fail('awaken', `awakening flag '${f}' collides with a quest flag`);
  }
  // §A3 as amended: the openers left the level tables (Pray stays L1 — innate)
  if (HEROES.rex.unlocks.some((u) => u.level <= 3)) {
    fail('awaken', `§A3 amended: Jay starts with NO Vibe — his first level unlock must come later (found one at L≤3)`);
  }
  if (!HEROES.faye.unlocks.some((u) => u.ability === 'pray' && u.level === 1)) {
    fail('awaken', `Mia's Pray stays innate at L1 (§A3 canon centerpiece)`);
  }
}

/* ================= S12 — THE CAGE (ADR-033/034) ================= */

parseAll('hoops-teams', TeamDefSchema, TEAMS);
parseAll('hoops-walkons', WalkOnDefSchema, WALK_ONS);

// the 31 Classic entrants, pinned: the field count, the tier curve the
// bracket seeds from, and the three canon-suggested fives by name
{
  if (TEAM_ORDER.length !== 31) fail('hoops', `the Classic fields 31 entrant fives + the party, found ${TEAM_ORDER.length}`);
  const tiers = [0, 0, 0, 0, 0];
  for (const t of Object.values(TEAMS)) tiers[t.tier - 1] += 1;
  if (tiers.join(',') !== '8,8,7,5,3') {
    fail('hoops', `the tier curve is canon 8/8/7/5/3 (fodder → title game), got ${tiers.join('/')}`);
  }
  for (const id of ['pigeon_counters', 'quota_crushers', 'permits_nephews']) {
    if (!TEAMS[id]) fail('hoops', `canon-suggested entrant '${id}' missing from TEAMS (S12 spec names it)`);
  }
  if (TEAMS.permits_nephews && TEAMS.permits_nephews.tier !== 5) {
    fail('hoops', `Permit's Nephews seed fifth straight year — tier must be 5 (the §A11 gag is the data)`);
  }
}

// the walk-on bench: five named locals, Chad guesting pre-Milo, every
// sprite a real CAST member (walk-ons are §A11 color, never invented heroes)
{
  if (WALK_ON_ORDER.length !== 5) fail('hoops', `the walk-on bench seats 5, found ${WALK_ON_ORDER.length}`);
  const chad = WALK_ONS.chad;
  if (!chad) fail('hoops', `walk-on 'chad' missing — Chad guests pre-Milo (S12 spec)`);
  else if (chad.unlessFlag !== 'milo_joined') {
    fail('hoops', `Chad's bench row must carry unlessFlag 'milo_joined', got '${chad.unlessFlag ?? 'nothing'}'`);
  }
  for (const w of Object.values(WALK_ONS)) {
    if (!CAST[w.sprite]) fail('hoops', `walk-on '${w.id}' sprite '${w.sprite}' is not a CAST member`);
  }
}

// THE STARTING FIVE (S15h/ADR-048): the first 'arms' line — one piece per
// hero, wielder-tagged, unsellable, carrying exactly one of speed/guts; and the
// arms manifest is exactly these five (extend the manifest, never ad-hoc).
// Pippa's Minister's Ribbon carries SPEED: §A8 names it "Luck+6", but the arms
// slot reads speed/guts — luck rides charms (ADR-037), so her Luck+6 is reserved
// for her SUNDAY SET charm and the arms piece is Speed (the tiny tactician is quick).
{
  for (const [heroId, itemId] of Object.entries(STARTING_FIVE)) {
    const item = ITEMS[itemId];
    if (!item) {
      fail('hoops', `STARTING FIVE piece '${itemId}' missing from ITEMS`);
      continue;
    }
    if (item.kind !== 'arms') fail('hoops', `'${itemId}' must be kind 'arms', got '${item.kind}'`);
    if (item.wielder !== heroId) fail('hoops', `'${itemId}' belongs to '${heroId}', got '${item.wielder ?? 'nobody'}'`);
    if (item.price !== 0) fail('hoops', `'${itemId}' is a title, not merchandise — price must be 0`);
  }
  for (const item of Object.values(ITEMS)) {
    if (item.kind === 'arms' && !Object.values(STARTING_FIVE).includes(item.id)) {
      fail('hoops', `'${item.id}' is not in the STARTING FIVE arms manifest — extend the manifest, never ad-hoc`);
    }
  }
}

// the reward tables, pinned (§A9-conscious tuning is deliberate, ADR-034):
// pickup pays forever, Classic depth scales, drops stay food/cola
{
  const R = HOOPS_REWARDS;
  if (R.pickup.winExp !== 130 || R.pickup.lossExp !== 55) {
    fail('hoops', `pickup EXP is canon 130/55 (win/loss), got ${R.pickup.winExp}/${R.pickup.lossExp}`);
  }
  if (R.classic.roundWinExp.join(',') !== '240,330,440,580,760') {
    fail('hoops', `Classic round EXP is canon 240/330/440/580/760, got ${R.classic.roundWinExp.join('/')}`);
  }
  if (R.classic.lossFrac !== 0.4) fail('hoops', `Classic lossFrac is canon 0.4, got ${R.classic.lossFrac}`);
  if (R.classic.repeatTitleCash !== 350) fail('hoops', `repeat titles pay canon $350, got ${R.classic.repeatTitleCash}`);
  for (const id of R.drops.table) {
    const item = ITEMS[id];
    if (!item) fail('hoops', `drop table item '${id}' missing from ITEMS`);
    else if (item.kind !== 'food' && item.kind !== 'pp') {
      fail('hoops', `drop '${id}' is kind '${item.kind}' — the cage pays foods and colas`);
    }
  }
}

// the venue: the gate in the vacant lot's fence (both directions), PERMIT
// standing at the cage, the board + rules signs, and the fixtures
{
  const cage = MAPS.the_cage;
  if (!cage) {
    fail('hoops', `'the_cage' map is missing (S12's venue)`);
  } else {
    if (!cage.npcs.some((n) => n.id === 'permit')) fail('hoops', `PERMIT must stand at the_cage`);
    for (const want of ['cage_board', 'cage_rules']) {
      if (!cage.signs.some((s) => s.dialogue === want)) fail('hoops', `the_cage needs its '${want}' sign`);
    }
    for (const sprite of ['chalk_board', 'backboard', 'bleachers_a']) {
      if (!cage.props.some((p) => p.sprite === sprite)) fail('hoops', `the_cage needs its '${sprite}' fixture`);
    }
    if (cage.props.filter((p) => p.sprite === 'backboard').length !== 2) {
      fail('hoops', `a FULL COURT carries two backboards (S12 spec)`);
    }
    if (!cage.doors.some((d) => d.to === 'brickton')) fail('hoops', `the_cage gate must open back onto Brickton`);
  }
  if (!MAPS.brickton?.doors.some((d) => d.to === 'the_cage')) {
    fail('hoops', `Brickton's vacant-lot fence must carry the gate door → the_cage (S12)`);
  }
  if (!MAPS.brickton?.props.some((p) => p.sprite === 'cage_gate')) {
    fail('hoops', `Brickton needs the cage_gate prop over the carved fence tile`);
  }
  // sign_lot is amended canon now — the FUTURE SITE arrived as a court
  const lot = DIALOGUE.sign_lot ?? [];
  if (!lot.some((l) => /BASKETBALL/i.test(l))) {
    fail('hoops', `sign_lot must carry the S12 amendment (the FUTURE SITE is a basketball court)`);
  }
  // PERMIT is a CAST member (his sheet generates at boot like everyone's)
  if (!CAST.permit) fail('hoops', `'permit' missing from CAST`);
}

// S12c — CAGE 2.0 manifests: the SPORT_FRAME contract (count + names, the
// S12 set frozen at 0–24, the package appended), the range/meter/timing
// math pinned to spec, and the goaltend call verbatim
{
  if (SPORT_FRAME_COUNT !== 39) fail('cage2', `SPORT_FRAME_COUNT is the S12c contract: 39, got ${SPORT_FRAME_COUNT}`);
  const FRAMES: Array<[string, number]> = [
    ['idleA', 0], ['fall', 22], ['cheerB', 24], // the frozen S12 floor
    ['spinA', 25], ['spinB', 26], ['btbA', 27], ['btbB', 28], ['btlA', 29], ['btlB', 30],
    ['stunA', 31], ['stunB', 32], ['trip', 33],
    ['passChest', 34], ['passBounce', 35], ['passBtb', 36],
    ['follow', 37], ['land', 38],
  ];
  for (const [name, idx] of FRAMES) {
    if ((SPORT_FRAME as Record<string, number>)[name] !== idx) {
      fail('cage2', `SPORT_FRAME.${name} must be ${idx} (the contract never renumbers)`);
    }
  }
  // the range law: derived from sht, clamped [0.85, 1.35]×ARC_R; the green
  // closes AT range; non-green is zero at 1.5× and beyond
  if (Math.abs(RANGE.MIN - COURT.ARC_R * 0.85) > 0.001 || Math.abs(RANGE.MAX - COURT.ARC_R * 1.35) > 0.001) {
    fail('cage2', `effectiveRange clamps to [ARC_R·0.85, ARC_R·1.35] per spec`);
  }
  if (RANGE.PER_SHT !== 1.2) fail('cage2', `range derives at 1.2px per sht point (spec)`);
  if (greenWindow(50, effectiveRange(50), 0) !== 0) fail('cage2', `the green window must CLOSE at range`);
  if (makeChance('slight', 50, effectiveRange(50) * 1.5, 0) !== 0) fail('cage2', `non-green make% must be ZERO at 1.5× range`);
  if (makeChance('brick', 50, 10, 0) !== 0) fail('cage2', `way off = ZERO (no brick floor)`);
  // the meter: green ENDS at the top; the falloff is 60/20/0
  if (METER.TOP !== 1 || METER.SLIGHT_P !== 0.6 || METER.FAR_P !== 0.2) {
    fail('cage2', `METER is the spec: green at the top, ~60% slightly off, ~20% far, zero way off`);
  }
  // timed defense tables, pinned to the spec's corners
  if (BLOCK_TIMING.PEAK_WINDOW_MS !== 120 || BLOCK_TIMING.BASE !== 0.1 || BLOCK_TIMING.TIMED !== 0.65 || BLOCK_TIMING.LO !== 0.05 || BLOCK_TIMING.HI !== 0.85) {
    fail('cage2', `BLOCK_TIMING is the spec table (±120ms, 0.10→0.65, clamp [0.05, 0.85])`);
  }
  if (BLOCK_TIMING.RATING !== 0.004) fail('cage2', `block rating scale is (dfn−sht)·0.004`);
  if (STEAL_TIMING.NEUTRAL !== 0.08 || STEAL_TIMING.TIMED !== 0.5 || STEAL_TIMING.RATING !== 0.0035 || STEAL_TIMING.HAWK !== 0.08 || STEAL_TIMING.LO !== 0.04 || STEAL_TIMING.HI !== 0.7) {
    fail('cage2', `STEAL_TIMING is the spec table (0.08→0.50, (dfn−sht)·0.0035, hawk +0.08, clamp [0.04, 0.70])`);
  }
  if (STEAL_TIMING.WINDOW_MS !== 150 || MOVES.STARTUP_MS !== STEAL_TIMING.WINDOW_MS) {
    fail('cage2', `the move startup IS the 150ms steal window (the risk is the price of the sauce)`);
  }
  // goaltending: the call is canon, verbatim
  if (!HOOPS_TEXT.permitGoaltend.some((l) => l.includes('THAT WAS COMING DOWN. WE ALL SAW IT.'))) {
    fail('cage2', `PERMIT's goaltend line is canon: "THAT WAS COMING DOWN. WE ALL SAW IT."`);
  }
  // ADR-038: the finish meter — layups forgive (wider than dunks at par),
  // the trigger is plain movement inside the finish range, reads exist
  if (layupWindow(50, 0) <= dunkWindow(50, 0)) fail('cage2', `the layup window must be the forgiving one (ADR-038)`);
  if (LAYUP_METER.LO < 0.04 || LAYUP_METER.HI > 0.2) fail('cage2', `LAYUP_METER clamps drifted from spec [0.05, 0.17]-ish bounds`);
  if (FINISH_RANGE_PX !== 165) fail('cage2', `the finish trigger range is 165px (ADR-038 — easy to generate)`);
  for (const key of ['inMake', 'deepMake', 'noGood', 'airPopup'] as const) {
    if (!(key in HOOPS_TEXT) || HOOPS_TEXT[key].length === 0) fail('cage2', `the make/miss reads need HOOPS_TEXT.${key} (ADR-038)`);
  }
  // the tutorial syllabus exists and ends on the goaltend warning
  for (const key of ['tutTitle', 'tutMove', 'tutMeter', 'tutDunk', 'tutPackage', 'tutPass', 'tutBlock', 'tutSteal', 'tutGoaltend', 'tutDone', 'tutSkip'] as const) {
    if (!(key in HOOPS_TEXT) || HOOPS_TEXT[key].length === 0) fail('cage2', `PERMIT'S SCHOOL needs HOOPS_TEXT.${key}`);
  }
  for (const key of ['permit_tutorial_ask', 'permit_tutorial_skip'] as const) {
    if (!DIALOGUE[key]?.length) fail('cage2', `PERMIT's school needs DIALOGUE.${key}`);
  }
}

/* ============== S13 — COSTA ESTRELLA LINKS manifests (ADR-037) ============== */

parseAll('links-holes', LinksHoleSchema, Object.fromEntries(HOLES.map((h) => [h.id, h])));
parseAll('links-golfers', GolferDefSchema, GOLFERS);
parseAll('links-clubs', ClubDefSchema, Object.fromEntries(CLUBS.map((c) => [c.id, c])));

{
  // THE COURSE: §A11 demands NINE named holes with plaque lines (counted +
  // swept); geometry must hold — uniform grids, tee on T, pin on G
  if (HOLES.length !== 9) fail('links', `the course is NINE authored holes, found ${HOLES.length}`);
  if (COURSE_PAR !== 36) fail('links', `the card plays to par 36, got ${COURSE_PAR}`);
  const pars = HOLES.map((h) => h.par);
  if (!pars.includes(3) || !pars.includes(4) || !pars.includes(5)) fail('links', `the par mix needs 3s, 4s, and a 5 (spec)`);
  for (const h of HOLES) {
    const grid = expandGrid(h.rle);
    const w = grid[0]?.length ?? 0;
    grid.forEach((row, y) => {
      if (row.length !== w) fail('links', `${h.id} grid row ${y} is ${row.length} wide, row 0 is ${w}`);
    });
    if (terrainAt(grid, h.tee.x, h.tee.y) !== 'T') fail('links', `${h.id} tee must stand on a T tile`);
    if (terrainAt(grid, h.pin.x, h.pin.y) !== 'G') fail('links', `${h.id} pin must cut into a G tile`);
  }
  // hole 2's cliff carry and hole 6's sea stack are the spec's signatures
  if (!expandGrid(HOLES[1].rle).some((r) => /^W+$/.test(r))) fail('links', `hole 2 must carry pure surf rows (the cliff carry)`);
  if (!expandGrid(HOLES[5].rle).some((r) => /^W+$/.test(r))) fail('links', `hole 6 is the par-3 onto a sea stack — surf must ring it`);

  // THE 31: tier curve 8/8/7/5/3 (the Classic's shape, on grass)
  if (GOLFER_ORDER.length !== 31) fail('links', `the Invitational fields 31 golfers + the party, found ${GOLFER_ORDER.length}`);
  const tiers = [1, 2, 3, 4, 5].map((t) => GOLFER_ORDER.filter((id) => GOLFERS[id].tier === t).length);
  if (tiers.join('/') !== '8/8/7/5/3') fail('links', `the golfer tier curve is canon 8/8/7/5/3, got ${tiers.join('/')}`);

  // REWARDS (§A9-tuned, pinned)
  const R = LINKS_REWARDS;
  if (R.stroke.evenPar !== 150 || R.stroke.perUnder !== 25 || R.stroke.perOver !== -12 || R.stroke.floor !== 40) {
    fail('links', `stroke pay is canon 150 even / +25 under / −12 over / floor 40`);
  }
  if (R.invitational.roundWinExp.join('/') !== '180/240/320/420/560') {
    fail('links', `Invitational round EXP is canon 180/240/320/420/560, got ${R.invitational.roundWinExp.join('/')}`);
  }
  if (R.invitational.lossFrac !== 0.4) fail('links', `Invitational lossFrac is canon 0.4`);
  if (R.invitational.repeatTitleCash !== 400) fail('links', `repeat titles pay canon $400 in hand`);
  for (const id of R.drops.table) {
    const item = ITEMS[id];
    if (!item) fail('links', `drop table item '${id}' missing from ITEMS`);
    else if (item.kind !== 'food' && item.kind !== 'pp') fail('links', `drop '${id}' is kind '${item.kind}' — the clubhouse pays foods and colas`);
  }

  // THE SUNDAY SET (§A8 'other' expansion, both directions)
  for (const [heroId, itemId] of Object.entries(SUNDAY_SET)) {
    const item = ITEMS[itemId];
    if (!item) {
      fail('links', `SUNDAY SET piece '${itemId}' missing from ITEMS`);
      continue;
    }
    if (item.kind !== 'charm') fail('links', `'${itemId}' must be kind 'charm' ('other' slot), got '${item.kind}'`);
    if (item.wielder !== heroId) fail('links', `'${itemId}' belongs to '${heroId}', got '${item.wielder ?? 'nobody'}'`);
    if (item.price !== 0) fail('links', `'${itemId}' is a title, not merchandise — price must be 0`);
    if (!item.luck || item.luck <= 0) fail('links', `'${itemId}' must carry luck (heroLuck reads the 'other' slot)`);
  }
  for (const item of Object.values(ITEMS)) {
    if (item.kind === 'charm' && item.wielder !== undefined && !Object.values(SUNDAY_SET).includes(item.id)) {
      fail('links', `'${item.id}' is a wielder-tagged charm outside the SUNDAY SET manifest — extend the manifest, never ad-hoc`);
    }
  }

  // THE VENUE: the resort map, FITO, the plaque, the clubhouse, the tease
  const costa = MAPS.costa_estrella;
  if (!costa) {
    fail('links', `'costa_estrella' map is missing (S13's venue)`);
  } else {
    if (!costa.npcs.some((n) => n.id === 'caddy')) fail('links', `the caddy must stand at costa_estrella`);
    if (!costa.signs.some((s) => s.dialogue === 'sign_costa')) fail('links', `costa_estrella needs its 'sign_costa' plaque`);
    if (!costa.props.some((p) => p.sprite === 'clubhouse')) fail('links', `costa_estrella needs the clubhouse`);
    // S14 (Prompt 28): the wire LANDED — the pin flips to assert the LINK
    if (!costa.doors.some((d) => d.to === 'puerto_sol')) {
      fail('links', `Prompt 28 shipped: costa_estrella must carry COSTA_DOOR_FOR_PUERTO_SOL (the one-line wire)`);
    }
    if (!MAPS.puerto_sol?.doors.some((d) => d.to === 'costa_estrella')) {
      fail('links', `Puerto Sol must aim its cliff road back at costa_estrella (the round trip)`);
    }
  }
  if (COSTA_DOOR_FOR_PUERTO_SOL.to !== 'puerto_sol') fail('links', `the authored world door must aim puerto_sol (one-line wire for Prompt 28)`);
  if (!MAPS.brickton?.props.some((p) => p.sprite === 'poster_links')) fail('links', `Brickton needs the travel-poster tease`);
  if (!MAPS.brickton?.signs.some((s) => s.dialogue === 'sign_links_poster')) fail('links', `the poster needs its sign read`);
  if (!CAST.caddy) fail('links', `'caddy' missing from CAST`);
  for (const key of ['npc_caddy', 'caddy_ask', 'caddy_register', 'caddy_title_first', 'caddy_hands_full', 'sign_links_poster', 'sign_costa'] as const) {
    if (!DIALOGUE[key]?.length) fail('links', `the links need DIALOGUE.${key}`);
  }

  // the GOLF sheet contract (cut from the S12 sport-sheet contract)
  if (GOLF_FRAME_COUNT !== 11) fail('links', `GOLF_FRAME_COUNT is the S13 contract: 11, got ${GOLF_FRAME_COUNT}`);
  for (const [name, idx] of [['address', 0], ['backB', 2], ['strike', 3], ['fistpump', 6], ['slumpA', 7], ['puttStrike', 10]] as Array<[string, number]>) {
    if ((GOLF_FRAME as Record<string, number>)[name] !== idx) fail('links', `GOLF_FRAME.${name} must be ${idx}`);
  }
  // the §A11.2 line exists and is played straight (the 9th tee at sunset)
  if (!LINKS_TEXT.caddySunset.includes('do not measure')) {
    fail('links', `the caddy's sunset line is the §A11.2 beat — keep it straight`);
  }
  // ADR-038: the strike-quality reads (the cage's green, on grass)
  for (const key of ['pure', 'pull', 'push'] as const) {
    if (!(key in LINKS_TEXT) || LINKS_TEXT[key].length === 0) fail('links', `the strike reads need LINKS_TEXT.${key} (ADR-038)`);
  }
}

/* ================= S14 — CHAPTER 2 manifests (ADR-039/040) ================= */

parseAll('boss-scripts', BossScriptDefSchema as unknown as ZodType, BOSS_SCRIPTS);

// THE PHASE MACHINE (Prompt 15): scripts are data — pin the Grin's canon
{
  const grin = BOSS_SCRIPTS.gilded_grin;
  if (!grin) {
    fail('phase', `BOSS_SCRIPTS.gilded_grin missing — §A6 Boss 2 runs on the phase machine`);
  } else {
    if (!ENEMIES[grin.boss] || ENEMIES[grin.boss].boss !== true) {
      fail('phase', `the Grin script must drive a boss-flagged §A7 enemy`);
    }
    const solid = grin.forms?.find((f) => f.id === 'solid');
    const hollow = grin.forms?.find((f) => f.id === 'hollow');
    if (!solid?.physicalImmune || solid.crackedBy !== 'freeze') {
      fail('phase', `SOLID GOLD must be physical-immune and crackedBy 'freeze' (§A6 Ch.2 — the lesson Freeze teaches)`);
    }
    if (!hollow?.vibeImmune) fail('phase', `HOLLOW must be Vibe-immune (§A6 Ch.2)`);
    if (grin.initialForm !== 'solid') fail('phase', `the Idol opens SOLID GOLD`);
    if (grin.awakeningOnForm?.form !== 'hollow' || grin.awakeningOnForm.awakening !== 'cold_reads') {
      fail('phase', `Mia's Freeze awakens at the HOLLOW reveal (awakeningOnForm: hollow/cold_reads — ADR-035)`);
    }
    const tele = grin.phases.find((p) => p.id === 'telegraph');
    const swap = grin.phases.find((p) => p.id === 'swap');
    if (!(tele?.trigger.kind === 'turnCount' && tele.trigger.n === 2 && tele.trigger.every === 4 && tele.once === false)) {
      fail('phase', `the Grin telegraphs on boss turns 2, 6, 10… (turnCount n2 every4, repeating)`);
    }
    if (!(swap?.trigger.kind === 'turnCount' && swap.trigger.n === 3 && swap.trigger.every === 4 && swap.once === false)) {
      fail('phase', `the Grin swaps on boss turns 3, 7, 11… — one turn after every telegraph (§A6)`);
    }
  }
  // the Tick stays bespoke — its latch is shipped engine law (S11), not data
  if (BOSS_SCRIPTS.titanic_tick) {
    fail('phase', `the Tick stays bespoke (shipped law) — no phase script for titanic_tick`);
  }
  // every reference inside every script resolves
  for (const sc of Object.values(BOSS_SCRIPTS)) {
    if (sc.riddle && !DIALOGUE[sc.riddle.intro]) fail('phase', `'${sc.boss}' riddle intro → unknown dialogue '${sc.riddle.intro}'`);
    for (const f of sc.forms ?? []) {
      if (f.line && !DIALOGUE[f.line]) fail('phase', `'${sc.boss}' form '${f.id}' → unknown dialogue '${f.line}'`);
    }
    for (const ph of sc.phases) {
      for (const a of ph.actions) {
        if (a.kind === 'scriptLine' && !DIALOGUE[a.line]) fail('phase', `'${sc.boss}' phase '${ph.id}' → unknown dialogue '${a.line}'`);
        if (a.kind === 'summon' && !ENEMIES[a.enemy]) fail('phase', `'${sc.boss}' phase '${ph.id}' summons unknown enemy '${a.enemy}'`);
      }
    }
    if (sc.awakeningOnForm && !AWAKENINGS[sc.awakeningOnForm.awakening]) {
      fail('phase', `'${sc.boss}' awakeningOnForm → unknown awakening '${sc.awakeningOnForm.awakening}'`);
    }
  }
  // FORM ART, both directions: every suffixed form has its texture family,
  // and every FORM_ART row is claimed by some script form
  const claimed = new Set<string>();
  for (const sc of Object.values(BOSS_SCRIPTS)) {
    for (const f of sc.forms ?? []) {
      if (f.spriteSuffix === '') continue; // the base ENEMY_BATTLE_ART row carries it
      const key = `${sc.boss}${f.spriteSuffix}`;
      claimed.add(key);
      const row = FORM_ART[key];
      if (!row) {
        fail('phase', `form '${sc.boss}/${f.id}' (suffix '${f.spriteSuffix}') has no FORM_ART row '${key}' — form swaps are texture swaps`);
        continue;
      }
      const want = `${ENEMIES[sc.boss]?.sprite ?? ''}${f.spriteSuffix}`;
      if (row.sprite !== want) fail('phase', `FORM_ART['${key}'] keys sprite '${row.sprite}', the swap needs '${want}'`);
    }
  }
  for (const key of Object.keys(FORM_ART)) {
    if (!claimed.has(key)) fail('phase', `FORM_ART row '${key}' is claimed by no boss form — extend or retire the row`);
  }
}

// THE FORGED BOSS DRAFTS (S15g M3c, ADR-046): every unshipped §A6 boss + both
// minibosses, instantiated from the ten templates. DRAFTS ARE NOT CONTENT —
// they PARSE as BossScriptDef but are EXCLUDED from the strict §A6 checks above
// (no FORM_ART / DIALOGUE resolution; those are hand-authored at promotion) and
// can NEVER masquerade as the shipped Grin (the §A7/§A6 manifests refuse them).
{
  parseAll('boss-drafts', BossScriptDefSchema as unknown as ZodType, DRAFT_BOSS_SCRIPTS);
  // the COUNT is law — exactly the seven unshipped bosses + two minibosses
  const have = Object.keys(DRAFT_BOSS_SCRIPTS).sort();
  const want = [...DRAFT_BOSS_IDS].sort();
  if (JSON.stringify(have) !== JSON.stringify(want)) {
    fail('boss-drafts', `the forge drafts must be exactly [${want.join(', ')}] — found [${have.join(', ')}]`);
  }
  for (const [id, sc] of Object.entries(DRAFT_BOSS_SCRIPTS)) {
    if (sc.boss !== id) fail('boss-drafts', `draft '${id}' drives boss '${sc.boss}' — key and boss must agree`);
    // a draft can never live in the shipped registry or drive a shipped enemy
    if (BOSS_SCRIPTS[id]) fail('boss-drafts', `'${id}' is BOTH a shipped boss script and a draft — promote, don't duplicate`);
    if (ENEMIES[id]) fail('boss-drafts', `'${id}' drives a SHIPPED §A7 enemy — a forged draft must not (promotion is a human act)`);
  }
}

// THE SPRITE FORGE (S15g 3b, ADR-046): the part catalog is swept BOTH directions
// like WEAPON_ART — every part the proposer can emit exists, and every catalog
// part is reachable by some role/region (no orphan parts). Then every RECORDED
// FACE PICK resolves to real parts and COMPOSES a face that reads the drums.
{
  const FAMILIES = ['silhouette', 'material', 'accessory', 'wear'] as const;
  const famOf = (pool: (typeof ROLE_POOLS)[string], fam: (typeof FAMILIES)[number]): string[] =>
    ({ silhouette: pool.sil, material: pool.mat, accessory: pool.acc, wear: pool.wear })[fam];
  // forward: every part a pool names exists in the catalog
  for (const [role, pool] of Object.entries(ROLE_POOLS))
    for (const fam of FAMILIES)
      for (const id of famOf(pool, fam))
        if (!CATALOG[fam].includes(id)) fail('sprite-forge', `ROLE_POOLS.${role}.${fam} names '${id}', absent from the ${fam} catalog`);
  for (const [ch, region] of Object.entries(CHAPTER_REGION))
    if (!CATALOG.region.includes(region)) fail('sprite-forge', `CHAPTER_REGION[${ch}] names region '${region}', absent from the catalog`);
  // backward: every catalog part is reachable by the proposer (no orphan parts)
  for (const fam of FAMILIES) {
    const reachable = new Set<string>();
    for (const pool of Object.values(ROLE_POOLS)) for (const id of famOf(pool, fam)) reachable.add(id);
    for (const id of CATALOG[fam]) if (!reachable.has(id)) fail('sprite-forge', `${fam} part '${id}' is in the catalog but no role pool can emit it — wire it into ROLE_POOLS or retire it`);
  }
  const reachableRegions = new Set(Object.values(CHAPTER_REGION));
  for (const id of CATALOG.region) if (!reachableRegions.has(id)) fail('sprite-forge', `region '${id}' is in the catalog but no chapter draws it — wire it into CHAPTER_REGION or retire it`);

  // every RECORDED pick keys a forged enemy, parses, resolves to real parts, and
  // composes a non-empty face whose three wear tiers actually DIFFER (the drums).
  const count = (data: Uint8Array): number => data.reduce((a, c) => a + (c !== T ? 1 : 0), 0);
  const same = (a: Uint8Array, b: Uint8Array): boolean => Buffer.from(a).equals(Buffer.from(b));
  for (const [id, spec] of Object.entries(FACE_PICKS)) {
    if (!FORGED_ENEMIES[id]) { fail('sprite-forge', `FACE_PICKS['${id}'] matches no forged enemy — extend or retire the pick`); continue; }
    const parsed = PartsSpecSchema.safeParse(spec);
    if (!parsed.success) { for (const e of parsed.error.issues) fail('sprite-forge', `FACE_PICKS['${id}']: ${e.message}`); continue; }
    if (!CATALOG.silhouette.includes(spec.silhouette)) fail('sprite-forge', `FACE_PICKS['${id}'] silhouette '${spec.silhouette}' is not in the catalog`);
    if (!CATALOG.material.includes(spec.material)) fail('sprite-forge', `FACE_PICKS['${id}'] material '${spec.material}' is not in the catalog`);
    if (spec.accessory && !CATALOG.accessory.includes(spec.accessory)) fail('sprite-forge', `FACE_PICKS['${id}'] accessory '${spec.accessory}' is not in the catalog`);
    if (spec.wear && !CATALOG.wear.includes(spec.wear)) fail('sprite-forge', `FACE_PICKS['${id}'] wear '${spec.wear}' is not in the catalog`);
    if (spec.region && !CATALOG.region.includes(spec.region)) fail('sprite-forge', `FACE_PICKS['${id}'] region '${spec.region}' is not in the catalog`);
    const t0 = composeEnemy(spec, 0).data, t1 = composeEnemy(spec, 1).data, t2 = composeEnemy(spec, 2).data;
    if (count(t0) < 50) fail('sprite-forge', `FACE_PICKS['${id}'] composes an empty face (bad part combo)`);
    if (same(t0, t1)) fail('sprite-forge', `FACE_PICKS['${id}'] scuffed tier is identical to full — the drums must read`);
    if (same(t1, t2)) fail('sprite-forge', `FACE_PICKS['${id}'] battered tier is identical to scuffed — the drums must read`);
  }
  // byte-identity: a picked face's composed key must never collide with a
  // shipped sprite (it would overwrite shipped art at boot).
  const shipped = new Set(Object.values(ENEMY_BATTLE_ART).map((a) => a.sprite));
  for (const def of Object.values(FORGED_ENEMIES))
    if (def.partsSpec && shipped.has(def.sprite)) fail('sprite-forge', `forged '${def.id}' composed key '${def.sprite}' collides with a shipped sprite — shipped art would be overwritten`);
}

// PICNIC (Prompt 23 / §A4.5): baskets pinned; the tables stand where canon says
{
  if (!(ITEMS.basket_basic?.kind === 'basket' && ITEMS.basket_basic.price > 0)) {
    fail('picnic', `basket_basic must be a bought 'basket' (§A4.5: Basic is shop stock)`);
  }
  for (const id of ['basket_family', 'basket_feast']) {
    if (!(ITEMS[id]?.kind === 'basket' && ITEMS[id].price === 0)) {
      fail('picnic', `${id} must be an unsellable 'basket' (deli-crafted, §A4.5)`);
    }
  }
  // ≈3 tables per chapter, placed BEFORE dungeons (§A4.5): the Ch.1 four
  // are canon placements now; Ch.2 sets three more + the antechamber's
  const TABLES: Record<string, number> = {
    otterbrook: 1,
    hickory_hill: 1,
    brickton: 1,
    dos_f2: 1,
    puerto_sol: 1,
    jungle_2: 1,
    valle_dorado: 1,
    pyramid_ante: 1,
    deli_int: 1,
  };
  for (const [mapId, count] of Object.entries(TABLES)) {
    const have = MAPS[mapId]?.props.filter((pp) => pp.sprite === 'picnic').length ?? 0;
    if (have !== count) fail('picnic', `${mapId} needs ${count} picnic table(s) (§A4.5 placements), found ${have}`);
  }
  // the deli crafts at Puerto Sol (Prompt 23)
  if (!MAPS.deli_int?.npcs.some((n) => n.id === 'deli_keeper')) {
    fail('picnic', `the deli keeper must stand in deli_int (Family/Feast crafting)`);
  }
}

// HOSPITALS & CHURCHES (Prompt 25): the doors are real, the staff is in
{
  if (!MAPS.brickton?.props.some((pp) => pp.door?.to === 'hospital_int')) {
    fail('hospital', `Brickton General's facade must open into hospital_int (locked_hospital retired)`);
  }
  if (!MAPS.otterbrook?.props.some((pp) => pp.door?.to === 'chapel_int')) {
    fail('hospital', `the Otterbrook chapel must open into chapel_int (locked_chapel retired)`);
  }
  const placedOnce = (npcId: string): number =>
    Object.values(MAPS).reduce((a, m) => a + m.npcs.filter((n) => n.id === npcId).length, 0);
  for (const doc of ['doc_brickton', 'doc_puerto', 'doc_valle']) {
    if (placedOnce(doc) !== 1) fail('hospital', `doctor '${doc}' must stand on exactly one map (one weird line each, §A11)`);
  }
  for (const pr of ['priest_otter', 'priest_valle']) {
    if (placedOnce(pr) !== 1) fail('hospital', `priest '${pr}' must stand on exactly one map (Prompt 25 chapels)`);
  }
}

// THE BOAT + THE CITY + THE PYRAMID CHAIN (§A5/§A6 Ch.2)
{
  if (!MAPS.brickton?.doors.some((d) => d.to === 'brickton_docks')) {
    fail('ch2', `Brickton's east gap must open onto brickton_docks (§A5 Ch.2)`);
  }
  if (!MAPS.brickton_docks?.triggers.some((t) => t.id === 'board_boat')) {
    fail('ch2', `the docks need the board_boat trigger (the ch1_complete gate rides the captain's ask, ADR-014)`);
  }
  if (!MAPS.puerto_sol?.triggers.some((t) => t.id === 'board_boat_return')) {
    fail('ch2', `Puerto Sol's pier needs board_boat_return (the boat runs forever — zero missables)`);
  }
  for (const mapId of ['brickton_docks', 'puerto_sol']) {
    if (!MAPS[mapId]?.props.some((pp) => pp.sprite === 'departure_board')) {
      fail('ch2', `${mapId} needs its departure board (it lists PUERTO SOL, proudly)`);
    }
    if (!MAPS[mapId]?.props.some((pp) => pp.sprite === 'banana_boat')) {
      fail('ch2', `${mapId} needs the banana boat moored at its pier`);
    }
  }
  if (MAPS.puerto_sol?.settlement !== 'city') {
    fail('ch2', `PUERTO SOL is a CITY (§A5) — tag it so the ADR-012 sweep owns it`);
  }
  // the Ch.3 tease: Bert waits at the docks only after the chapter closes
  const bert = MAPS.brickton_docks?.npcs.find((n) => n.id === 'uncle_bert');
  if (!bert || bert.ifFlag !== 'ch2_complete') {
    fail('ch2', `Uncle Bert (the Ch.3 tease) must stand at the docks gated ifFlag ch2_complete — no map for Lucille yet`);
  }
  // the dungeon chain holds end to end
  const chain: Array<[string, string]> = [
    ['valle_dorado', 'pyramid_ante'],
    ['pyramid_1', 'pyramid_2'],
    ['pyramid_2', 'pyramid_3'],
    ['pyramid_3', 'pyramid_4'],
    ['pyramid_4', 'pyramid_apex'],
  ];
  for (const [from, to] of chain) {
    const viaDoor = MAPS[from]?.doors.some((d) => d.to === to);
    const viaProp = MAPS[from]?.props.some((pp) => pp.door?.to === to);
    if (!viaDoor && !viaProp) fail('ch2', `the pyramid chain breaks: ${from} → ${to}`);
  }
  if (!MAPS.pyramid_ante?.props.some((pp) => pp.door?.to === 'pyramid_1')) {
    fail('ch2', `the pyramid gate's mouth must open into pyramid_1`);
  }
  // every chamber carries its mask switch + the sign that turns the floor
  for (const n of [1, 2, 3, 4]) {
    if (!MAPS[`pyramid_${n}`]?.props.some((pp) => pp.sprite === 'mask_switch')) {
      fail('ch2', `pyramid_${n} needs its mask_switch (the §A6 rotation key)`);
    }
    if (!MAPS[`pyramid_${n}`]?.signs.some((sg) => sg.dialogue === `pyr_mask_${n}`)) {
      fail('ch2', `pyramid_${n} needs its pyr_mask_${n} sign beat`);
    }
  }
  if (!MAPS.pyramid_apex?.triggers.some((t) => t.id === 'apex_grin')) {
    fail('ch2', `the apex needs the apex_grin trigger (BOSS 2's door, §A6)`);
  }
  // the wishers stand gray until the Grin falls; their woke twins after
  const valle = MAPS.valle_dorado;
  for (const w of ['a', 'b', 'c']) {
    const gray = valle?.npcs.find((n) => n.id === `wisher_${w}`);
    const woke = valle?.npcs.find((n) => n.id === `woke_${w}`);
    if (!gray || gray.unlessFlag !== 'grin_defeated') fail('ch2', `wisher_${w} must stand unlessFlag grin_defeated (§A6)`);
    if (!woke || woke.ifFlag !== 'grin_defeated') fail('ch2', `woke_${w} must stand ifFlag grin_defeated (the recovery variant)`);
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
    if (n.dialogueDay !== undefined && !DIALOGUE[n.dialogueDay]) {
      fail('maps', `${m.id} npc '${n.id}' → unknown day dialogue '${n.dialogueDay}'`);
    }
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

/* ========= 3a′. THE MAP QUALITY VALIDATOR (S15g, Prime Law 4) =========
 * Playability runs on EVERY canon map: content (npcs/signs/phones/atms/
 * picnics/triggers) must be BFS-reachable across the walkable floor, and
 * every door must land on a walkable tile of its target. Violations are
 * FIXED or carry a per-map WAIVER row here (reason + §-reference) — silent
 * grandfathering is drift. The reachability math lives in the levelkit
 * library (vitest-pinned); this file owns the gate + the waiver table. */
{
  // the engine's own tile solidity (TILESET.solid), keyed by name; ':' (path)
  // and 'r' (rug) are walkable by construction (OverworldScene.buildTiles)
  const solidByName = new Map(TILESET.map((t) => [t.name, t.solid]));
  const isSolidChar = (ch: string): boolean =>
    ch === ':' || ch === 'r' ? false : solidByName.get(CHAR_LEGEND[ch] ?? 'grass_a') === true;

  // THE WAIVER TABLE — the only canon maps exempt from the reachability gate,
  // each a SHIPPED, FROZEN, stateful dungeon whose content opens at runtime
  // (the static grid BFS cannot model the rotor turn / the sealed-room carve).
  // Movement Two adds per-rotation BFS; until then these are reasoned, visible.
  const REACH_WAIVERS: Record<string, string> = {
    pyramid_1: 'mask-switch sign sits past the §A6 rotating floor — static-grid BFS cannot model the rotor state (frozen bespoke)',
    pyramid_2: 'mask-switch sign sits past the §A6 rotating floor — static-grid BFS cannot model the rotor state (frozen bespoke)',
    pyramid_3: 'mask-switch sign sits past the §A6 rotating floor — static-grid BFS cannot model the rotor state (frozen bespoke)',
    pyramid_4: 'the §A6 rotor return-door lands on a rotor wall in the STATIC state; the floor turns to open it (frozen bespoke — Movement Two owns per-rotation proofs)',
    dos_f3: 'Mia + her sign are sealed in the holding room until carveHoldingRoom() opens it on holding_open (§A6 — the sealed-room reveal is by design)',
  };

  let clean = 0;
  for (const m of Object.values(MAPS)) {
    const flags = mapQualityFlags(m, isSolidChar, MAPS);
    if (REACH_WAIVERS[m.id]) {
      // a live waiver must still be needed — else retire it (both directions)
      if (flags.length === 0) fail('mapquality', `'${m.id}' reachability waiver is UNUSED now — retire it from the table`);
    } else if (flags.length > 0) {
      for (const f of flags) fail('mapquality', `${m.id}: ${f} — fix it, or add a reasoned waiver row (Prime Law 4)`);
    } else {
      clean += 1;
    }
  }
  for (const id of Object.keys(REACH_WAIVERS)) {
    if (!MAPS[id]) fail('mapquality', `reachability waiver names unknown map '${id}'`);
  }

  // the table is VISIBLE in every run (silent grandfathering is drift)
  console.log(`  map-quality (S15g): ${clean}/${Object.keys(MAPS).length} canon maps clear reachability + door-landing; ${Object.keys(REACH_WAIVERS).length} waived —`);
  for (const [id, why] of Object.entries(REACH_WAIVERS)) console.log(`    ⚠ ${id}: ${why}`);
}

/* ====== 3a″. ENCOUNTER PRESSURE — the HARD subset (S15g M2, ADR-045) ======
 * The two rules that catch a real PLAYABILITY fault run on every canon map:
 *  - GRACE: a doorway gives a beat before the first contact;
 *  - PROXIMITY: a spawner never crowds a door/phone/atm/point-trigger.
 * Everything else (density bands, exposure, unavoidable touches, side paths)
 * is the SOFT "feel" read in docs/ENCOUNTERS.md (`npm run encounters`) — taste
 * never blocks the build. A hard flag is FIXED or carries a reasoned WAIVER
 * here (Prime Law 4). The Movement-Two dungeon POST-CONDITIONS (entrance→exit,
 * boss route, rest-before-pressure, soft-lock-at-every-state) are asserted on
 * the generated dungeons at build + pinned in src/levelkit/dungeons.test.ts;
 * on canon maps the universal half (content reachability) is the 3a′ gate
 * above, and the two STATEFUL canon maps keep their bespoke per-state proofs
 * (the pyramid's rotor BFS in maps_ch2.test.ts; Prime Law 5). */
{
  const solidByName = new Map(TILESET.map((t) => [t.name, t.solid]));
  const isSolidChar = (ch: string): boolean =>
    ch === ':' || ch === 'r' ? false : solidByName.get(CHAR_LEGEND[ch] ?? 'grass_a') === true;

  // FROZEN bespoke rooms whose §A6 design IS point-blank pressure (Prime Law 5)
  const PRESSURE_WAIVERS: Record<string, string> = {
    pyramid_1: 'frozen §A6 rotor chamber — the rotor IS the room, so the fight pressure is point-blank by design (shipped bespoke; Movement Two adds nothing here)',
    pyramid_2: 'frozen §A6 rotor chamber — point-blank pressure by design (shipped bespoke)',
  };

  let clean = 0;
  for (const m of Object.values(MAPS)) {
    const flags = pressureHardFlags(pressureReport(m, isSolidChar));
    if (PRESSURE_WAIVERS[m.id]) {
      if (flags.length === 0) fail('pressure', `'${m.id}' pressure waiver is UNUSED now — retire it from the table`);
    } else if (flags.length > 0) {
      for (const f of flags) fail('pressure', `${m.id}: ${f} — fix it, or add a reasoned waiver row (Prime Law 4)`);
    } else {
      clean += 1;
    }
  }
  for (const id of Object.keys(PRESSURE_WAIVERS)) {
    if (!MAPS[id]) fail('pressure', `pressure waiver names unknown map '${id}'`);
  }
  console.log(`  encounter-pressure (S15g M2): ${clean}/${Object.keys(MAPS).length} canon maps clear grace + proximity; ${Object.keys(PRESSURE_WAIVERS).length} waived (soft read in docs/ENCOUNTERS.md) —`);
  for (const [id, why] of Object.entries(PRESSURE_WAIVERS)) console.log(`    ⚠ ${id}: ${why}`);
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
// quest strings render in the JOURNAL through vars() (S9) — and the caller
// quote replays in the finale's vignettes (§A6 Ch.8), same pipeline
for (const q of Object.values(QUESTS)) {
  sweepTokens('text', `quest '${q.id}' name`, q.name, DIALOGUE_TOKENS);
  q.objectives.forEach((o) => sweepTokens('text', `quest '${q.id}' objective '${o.id}'`, o.text, DIALOGUE_TOKENS));
  sweepTokens('text', `quest '${q.id}' caller quote`, q.caller.quote, DIALOGUE_TOKENS);
}
// the ARCADE LEGEND cabinet prints through vars() too (S10) — {playername}
// and {coolthing} are live on the marquee and the boss banner
for (const [key, line] of Object.entries(ARCADE_TEXT)) {
  sweepTokens('text', `ARCADE_TEXT.${key}`, line, DIALOGUE_TOKENS);
}
// THE CAGE prints through vars() + scene .replace() fills (S12) — the
// HOOPS_FILL_TOKENS set is the fill contract, the BATTLE_FILL precedent
{
  const HOOPS_TOKENS = new Set([...DIALOGUE_TOKENS, ...HOOPS_FILL_TOKENS]);
  for (const [key, line] of Object.entries(HOOPS_TEXT)) {
    for (const s of Array.isArray(line) ? line : [line]) {
      sweepTokens('text', `HOOPS_TEXT.${key}`, s, HOOPS_TOKENS);
    }
  }
  for (const t of Object.values(TEAMS)) sweepTokens('text', `team '${t.id}' taunt`, t.taunt, DIALOGUE_TOKENS);
  for (const w of Object.values(WALK_ONS)) sweepTokens('text', `walk-on '${w.id}' line`, w.line, DIALOGUE_TOKENS);
}
// THE LINKS print through scene .replace() fills too (S13) — and every hole
// name/plaque + golfer clubhouse line is §A11 prose the sweep owns
{
  const LINKS_TOKENS = new Set([...DIALOGUE_TOKENS, ...LINKS_FILL_TOKENS]);
  for (const [key, line] of Object.entries(LINKS_TEXT)) {
    for (const s of Array.isArray(line) ? line : [line]) {
      sweepTokens('text', `LINKS_TEXT.${key}`, s, LINKS_TOKENS);
    }
  }
  for (const h of HOLES) {
    sweepTokens('text', `hole '${h.id}' name`, h.name, DIALOGUE_TOKENS);
    sweepTokens('text', `hole '${h.id}' plaque`, h.plaque, DIALOGUE_TOKENS);
  }
  for (const g of Object.values(GOLFERS)) sweepTokens('text', `golfer '${g.id}' line`, g.line, DIALOGUE_TOKENS);
}
// awakening toasts render through vars() (S12b) — TEXT_VARS only
for (const a of Object.values(AWAKENINGS)) {
  sweepTokens('text', `awakening '${a.id}' toast`, a.toast, DIALOGUE_TOKENS);
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
sweepPlaceholders('§B4', { HEROES, ABILITIES, PRAY_TEXT, ENEMIES, ITEMS, SHOPS, QUESTS, MAPS, DIALOGUE, BATTLE_TEXT, ARCADE_TEXT, TEAMS, WALK_ONS, HOOPS_TEXT, AWAKENINGS, NEW_GAME_ENTRIES, HOLES, GOLFERS, LINKS_TEXT }, 'data');

/* ================= verdict ================= */

const counts = [
  `${Object.keys(HEROES).length} heroes`,
  `${Object.keys(ABILITIES).length} abilities`,
  `${Object.keys(ENEMIES).length} enemies (§A7 Ch.1–2 + Bosses 1–2)`,
  `${Object.keys(ITEMS).length} items`,
  `${Object.keys(SHOPS).length} shops`,
  `${Object.keys(QUESTS).length} quests (§A10 #1–6)`,
  `${Object.keys(MAPS).length} maps`,
  `${Object.keys(DIALOGUE).length} dialogue scripts`,
  `${Object.keys(TEAMS).length} Classic fives + ${Object.keys(WALK_ONS).length} walk-ons (S12)`,
].join(' · ');

if (errors.length > 0) {
  console.error(`\nMETEOR FALLS content validation — ${errors.length} error(s):\n`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  console.error('');
  process.exit(1);
}
console.log(`✓ content valid — ${counts} · pray table sums 100`);
