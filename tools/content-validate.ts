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
import { existsSync, readFileSync } from 'node:fs';
import {
  AbilityDefSchema,
  AMBIENCE_IDS,
  ChoiceDefSchema,
  DialogueScriptSchema,
  EchoAnchorDefSchema,
  EMOTE_IDS,
  EpilogueCardSchema,
  EnemyDefSchema,
  HeroDefSchema,
  HeroIdSchema,
  ItemDefSchema,
  MapDefSchema,
  PrayWeightsSchema,
  QuestDefSchema,
  ShopDefSchema,
} from '../src/schemas';
import { EMOTES } from '../src/engine/emote';
import { AMBIENCE, AMBIENCE_BEDS, NOISE_COLORS } from '../src/engine/ambience';
import { HEROES } from '../src/data/heroes';
import { ABILITIES, PRAY_BASE, PRAY_TEXT } from '../src/data/abilities';
import { FX_REGISTRY, STAGE_ANIM, itemFxKey } from '../src/battle/fxRegistry';
import { ENEMIES, introLine, MAX_BATTLE_ENEMIES } from '../src/data/enemies';
import { ITEMS, slotOf, PORCH_SET, MERCADO_SET } from '../src/data/items';
import { WEAPON_ART } from '../src/spritegen/weapons';
import { ITEM_ICON } from '../src/spritegen/icons';
import {
  ABILITY_ICON,
  BATTLE_FX_ICON,
  STATUS_ICON,
  STATUS_ICON_NAMES,
} from '../src/spritegen/combatIcons';
import { FONT_CHARS, drawTextInto } from '../src/spritegen/font';
import { Pixmap } from '../src/spritegen/pixmap';
import { AREA_SKINS, CANON_AREAS, BESPOKE_AREA_FACADES } from '../src/spritegen/buildings';
import { GLYPH_SCRIPT, SCRIPT_CATALOG, areaGlyphRun } from '../src/spritegen/glyphforge';
import { GLYPH_TOKENS, FLAIR_BY_ELEMENT, FLAIR_BY_RESULT, glyphRegistryNames, flairGlyph } from '../src/spritegen/flair';
import { REGION_RAMPS } from '../src/spritegen/iconforge';
import { BUILDING_DIMS } from '../src/levelkit/kit';
import { livingCityViolations } from '../src/levelkit/metrics';
import { VEHICLE_CATALOG, VEHICLE_SPECS, usableSeats } from '../src/spritegen/vehicles';
import { PSI_GATES, GATE_KEY, PSI_DUNGEON_BANDS } from '../src/data/psigates';
import { abilitiesForKey } from '../src/engine/psi';
import { PROPERTIES, PROPERTY_KINDS, LIVE_PROPERTIES } from '../src/data/properties';
import { AREA_SKINS as AREA_SKINS_FOR_PROP } from '../src/spritegen/buildings';
import { FURNITURE, FURNITURE_FUNCTIONS } from '../src/data/furniture';
import { THREAD_BEATS, THREAD_IDS } from '../src/data/storythreads';
import { chainProblems } from '../src/engine/storythread';
import { CHOICES } from '../src/data/choices';
import { ENDING_CARDS, SLOT_ORDER, KNOWN_ENDING_FLAGS } from '../src/data/endings';
import { ECHO_ANCHORS } from '../src/data/echoes';
import { choiceProblems } from '../src/engine/choice';
import { DISGUISES, DISGUISE_FACTIONS } from '../src/data/disguise';
import { PAPERBOY, liveRoute } from '../src/data/paperboy';
import { PaperboySim, prizeEarned } from '../src/paperboy/sim';
import { FLEET_CRAFT, FLEET_STAGES, WATER_ACCESS, AIR_ACCESS } from '../src/data/fleet';
import { DEALERSHIP } from '../src/data/dealership';
import { sellValue } from '../src/engine/garage';
import { MILITARY_VEHICLES, MILITARY_TYPES } from '../src/data/military';
import { ARMY_BEATS } from '../src/data/armyarc';
import { armyArcProblems } from '../src/engine/armyarc';
import { fuelProfile, rangeTiles, needsFuel } from '../src/engine/fuel';
import { ignitionRequired } from '../src/engine/ignition';
import { STATIONS, STATION_KINDS } from '../src/data/stations';
import { sells, stationPricePerUnit, homeChargePricePerUnit, NEEDED_FUEL_KINDS } from '../src/engine/refuel';
import { CONTINENTS, AREA_CONTINENT, CONTINENT_IDS } from '../src/data/world';
import { ferryMethodsBetween, METHOD_CRAFT } from '../src/engine/ferry';
import { THE_LONG_SHOT } from '../src/data/rocket';
import { canLaunch, EARTH_PAD, MARS, launchCost } from '../src/engine/rocket';
import { VEHICLE_SPECS as VSPECS_FLEET } from '../src/spritegen/vehicles';
import { FORTUNE_ARC, fortuneTarget } from '../src/data/fortune';
import { allBossChecks, AWAKENING_LEVEL } from '../src/battle/verify';
import { ENEMY_BATTLE_ART } from '../src/spritegen/enemies';
import {
  AUTHORED_ENEMY_BATTLE_ART_KEYS,
  AUTHORED_ENEMY_OVERWORLD_ART_IDS,
  AUTHORED_ENEMY_OVERWORLD_ART_KEYS,
  AUTHORED_NPC_CHARACTER_IDS,
} from '../src/spritegen/authored';
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
import { COURT_RT } from '../src/hoops/court';
import { s } from '../src/spritegen/scale';
// S13: the links — holes, golfers, rewards, the SUNDAY SET, the golfer sheet
import { HOLES, CLUBS, COURSE_PAR, expandGrid, terrainAt } from '../src/links/course';
import { GOLFERS, GOLFER_ORDER, LINKS_TEXT, LINKS_FILL_TOKENS, LINKS_REWARDS, SUNDAY_SET } from '../src/data/links';
import { GOLF_FRAME, GOLF_FRAME_COUNT } from '../src/spritegen/golfers';
import { COSTA_DOOR_FOR_PUERTO_SOL } from '../src/data/maps';
import { GolferDefSchema, LinksHoleSchema, ClubDefSchema } from '../src/schemas';
import { AwakeningDefSchema, TeamDefSchema, WalkOnDefSchema } from '../src/schemas';
import { CHAR_LEGEND, MAPS } from '../src/data/maps';
import {
  ENEMY_OVERWORLD_FRAME,
  ENEMY_OVERWORLD_SHEET_ID_SET,
  enemyOverworldKey,
  enemyVisualIdentity,
} from '../src/data/visuals';
import { BATTLE_FILL_TOKENS, BATTLE_TEXT, DIALOGUE } from '../src/data/dialogue';
import { NEW_GAME_ENTRIES, gridCharset } from '../src/data/newgame';
import { TEXT_VARS } from '../src/ui/text';
import { tileIndexByName, TILESET } from '../src/spritegen/tiles';
import { doorAudit, mapQualityFlags } from '../src/levelkit/mapcheck';
import { pressureReport, pressureHardFlags } from '../src/levelkit/pressure';
// S15g 3b — THE SPRITE FORGE: the part catalog, the composer, the recorded picks
import { composeEnemy, CATALOG, ROLE_POOLS, CHAPTER_REGION } from '../src/spritegen/parts';
import { FORGED_ENEMIES, forgedBandIds } from '../src/levelkit/forge/registry';
import { FACE_PICKS } from '../src/data/drafts/faces';
import { PartsSpecSchema } from '../src/schemas';
// S15g M4 — THE CHAPTER MANIFESTS: the per-chapter source of truth (ADR-047)
import { CHAPTER_MANIFESTS } from '../src/data/chapters';
import { ChapterManifestSchema } from '../src/schemas';
import { BOSS_HP, MINIBOSS_HP } from '../src/levelkit/forge/curves';
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

// ITEM EFFECTS RESOLVE: every status an item CURES or INFLICTS must have a
// matching arm in the runtime dispatch, or the item is silently consumed for
// nothing (the "dead item" class). `cures` is an unconstrained string[] in the
// schema, so nothing else catches a cure aimed at a status the code can't
// apply. These pins MIRROR the switch arms in BattleScene.useItem (the cure
// loop + the battle-'status' block) and the homesick branch in
// MenuScene.useItem — when a new curable/inflictable status ships, extend BOTH
// the code arm AND the pin here together. ('down' is the revive line, handled
// separately in both scenes.)
{
  const HANDLED_CURES = new Set(['down', 'sunburn', 'crying', 'paralyzed', 'asleep', 'hushed', 'homesick']);
  const HANDLED_BATTLE_STATUS = new Set(['crying', 'asleep', 'paralyzed']);
  for (const item of Object.values(ITEMS)) {
    for (const c of item.cures ?? []) {
      if (!HANDLED_CURES.has(c)) {
        fail('item-effect', `cure item '${item.id}' lists cures '${c}', but no dispatch arm applies it (BattleScene cure loop / MenuScene) — add the code arm AND extend HANDLED_CURES`);
      }
    }
    if (item.kind === 'battle' && item.status && !HANDLED_BATTLE_STATUS.has(item.status)) {
      fail('item-effect', `battle item '${item.id}' inflicts status '${item.status}', but the battle-'status' block has no arm for it — add the code arm AND extend HANDLED_BATTLE_STATUS`);
    }
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

// S16 Movement 8 (ADR-060) — THE ICON ATLAS: WEAPON_ART covered only the
// equippables; ITEM_ICON widens the law to ALL ItemKind so every §A8 item
// shows a face in the menus / shops / battle Goods. Gated BOTH directions
// like WEAPON_ART: an item with no icon row fails, and an icon row that
// names no item is a dead manifest row.
{
  for (const item of Object.values(ITEMS)) {
    if (!ITEM_ICON[item.id]) {
      fail('item-icon', `item '${item.id}' (${item.kind}) has no ITEM_ICON row — every §A8 item needs a menu face (spritegen/icons.ts)`);
    }
  }
  for (const id of Object.keys(ITEM_ICON)) {
    if (!ITEMS[id]) fail('item-icon', `ITEM_ICON row '${id}' claims no §A8 item — extend or retire the manifest row`);
  }
}

// PKG-05 — ABILITY / STATUS / FX MICRO-ICONS. Like the §A8 icon atlas above,
// these are pinned both directions against their source registries AND against
// their exported PNG paths, so the package cannot silently lose a file.
{
  const nonT = (pm: Pixmap): number => pm.data.reduce((n, c) => n + (c !== T ? 1 : 0), 0);
  const expectFile = (section: string, path: string): void => {
    if (!existsSync(path)) fail(section, `missing exported PNG '${path}'`);
  };
  const expectTiny = (section: string, id: string, pm: Pixmap, maxW: number, maxH: number): void => {
    if (pm.w <= 0 || pm.h <= 0) fail(section, `'${id}' has invalid size ${pm.w}x${pm.h}`);
    if (pm.w > maxW || pm.h > maxH) fail(section, `'${id}' is ${pm.w}x${pm.h}, must fit ${maxW}x${maxH}`);
    if (nonT(pm) <= 3) fail(section, `'${id}' draws too little to read (${nonT(pm)} px)`);
  };

  const packageIds = readFileSync('docs/asset-lists/ability_icons.txt', 'utf8')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const packageSet = new Set(packageIds);
  for (const id of Object.keys(ABILITIES)) {
    if (!packageSet.has(id)) fail('ability-icon', `ability '${id}' is not listed in docs/asset-lists/ability_icons.txt`);
  }
  for (const id of packageIds) {
    const ab = ABILITIES[id];
    if (!ab) fail('ability-icon', `docs/asset-lists/ability_icons.txt lists unknown ability '${id}'`);
    const draw = ABILITY_ICON[id];
    if (!draw) {
      fail('ability-icon', `ability '${id}' has no ABILITY_ICON row`);
    } else {
      expectTiny('ability-icon', id, draw(), 16, 16);
    }
    expectFile('ability-icon', `assets/art/icons/abilities/${id}.png`);
  }
  for (const id of Object.keys(ABILITY_ICON)) {
    if (!ABILITIES[id]) fail('ability-icon', `ABILITY_ICON row '${id}' claims no ability`);
  }

  for (const name of STATUS_ICON_NAMES) {
    expectTiny('status-icon', name, STATUS_ICON[name](), 8, 8);
    expectFile('status-icon', `assets/art/icons/status/${name}.png`);
  }
  for (const name of Object.keys(STATUS_ICON)) {
    if (!(STATUS_ICON_NAMES as readonly string[]).includes(name)) fail('status-icon', `STATUS_ICON row '${name}' is not a PKG-05 status badge`);
  }

  for (const name of GLYPH_TOKENS) {
    const draw = BATTLE_FX_ICON[name];
    if (!draw) fail('battle-fx-icon', `flair glyph '${name}' has no BATTLE_FX_ICON row`);
    else expectTiny('battle-fx-icon', name, draw(), 11, 11);
    expectFile('battle-fx-icon', `assets/art/fx/${name}.png`);
  }
  for (const name of Object.keys(BATTLE_FX_ICON)) {
    if (!(GLYPH_TOKENS as readonly string[]).includes(name)) fail('battle-fx-icon', `BATTLE_FX_ICON row '${name}' is not a declared flair glyph`);
  }
  for (const [element, glyph] of Object.entries(FLAIR_BY_ELEMENT)) {
    if (glyph && !BATTLE_FX_ICON[glyph]) fail('battle-fx-icon', `FLAIR_BY_ELEMENT['${element}'] points at '${glyph}' with no exported fx icon`);
    if (element !== 'none' && !FX_REGISTRY[`impact_${element}`]) fail('battle-fx-icon', `element '${element}' has flair but no matching FX_REGISTRY impact key`);
  }
  for (const [result, glyph] of Object.entries(FLAIR_BY_RESULT)) {
    if (!BATTLE_FX_ICON[glyph]) fail('battle-fx-icon', `FLAIR_BY_RESULT['${result}'] points at '${glyph}' with no exported fx icon`);
  }
}

// S18 Movement 25 (ADR-066) — AREA-TRUE BUILDINGS: every named §A5/§A6 area owns
// its OWN AREA_SKINS slice (a distinct family-mix + ramp palette per the place's
// feel), so no area is a reskin of another. Gated BOTH directions:
//  · every CANON_AREA has a non-empty, duplicate-free roster of REAL facade sprites
//    (each name resolves in BUILDING_DIMS or the bespoke house allowlist);
//  · every AREA_SKINS key is a CANON_AREA (no orphan slice for a place that isn't).
{
  const known = new Set<string>([...Object.keys(BUILDING_DIMS), ...BESPOKE_AREA_FACADES]);
  for (const area of CANON_AREAS) {
    const roster = AREA_SKINS[area];
    if (!roster) {
      fail('area-skins', `canon area '${area}' has no AREA_SKINS roster — register its own slice (spritegen/buildings.ts), never reuse another's`);
      continue;
    }
    if (roster.length === 0) {
      fail('area-skins', `area '${area}' has an EMPTY roster — a skinsFor() family×ramp filter matched nothing; widen the slice`);
    }
    for (const sprite of roster) {
      // NOTE: the generated catalog legitimately repeats some sprite KEYS (two
      // tiers can share a `_${u}` suffix), so a name listed twice just weights
      // the grammar's pick — it is not an error. We only gate that it RESOLVES.
      if (!known.has(sprite)) {
        fail('area-skins', `area '${area}' facade '${sprite}' resolves to no registered building (not in BUILDING_DIMS or the bespoke allowlist) — typo or a sprite that was never drawn`);
      }
    }
  }
  const canon = new Set(CANON_AREAS);
  for (const area of Object.keys(AREA_SKINS)) {
    if (!canon.has(area)) {
      fail('area-skins', `AREA_SKINS has an orphan slice '${area}' — add it to CANON_AREAS or retire the roster`);
    }
  }
}

// S18 Movement 22 (ADR-092) — THE GLYPH FORGE / §A11.8 THE GLYPH LAW: every named
// §A5/§A6 area owns its OWN region-true decorative SCRIPT (the way ADR-066 gave it
// a building skin), so a foreign sign can never be mistaken for another region's.
// Gated BOTH directions, like AREA_SKINS:
//  · every CANON_AREA has a GLYPH_SCRIPT naming a REAL script family + a real
//    region band, and its forged run actually draws something (§A11.6-safe
//    decoration — never readable text);
//  · every GLYPH_SCRIPT row is a CANON_AREA (no orphan script for a place that
//    isn't).
{
  const families = new Set<string>(SCRIPT_CATALOG);
  const canon = new Set(CANON_AREAS);
  for (const area of CANON_AREAS) {
    const spec = GLYPH_SCRIPT[area];
    if (!spec) {
      fail('glyph-script', `canon area '${area}' has no GLYPH_SCRIPT — give it a region-true script (spritegen/glyphforge.ts), never reuse another's by accident`);
      continue;
    }
    if (!families.has(spec.script)) {
      fail('glyph-script', `area '${area}' names unknown script family '${spec.script}' — typo or a family never written`);
    }
    if (!REGION_RAMPS[spec.band]) {
      fail('glyph-script', `area '${area}' band '${spec.band}' has no REGION_RAMPS pool`);
    }
    const drawn = areaGlyphRun(area).data.reduce((n, c) => n + (c !== 255 ? 1 : 0), 0);
    if (drawn <= 3) {
      fail('glyph-script', `area '${area}' glyph run draws nothing — the script grammar produced an empty surface`);
    }
  }
  for (const area of Object.keys(GLYPH_SCRIPT)) {
    if (!canon.has(area)) {
      fail('glyph-script', `GLYPH_SCRIPT has an orphan row '${area}' — add it to CANON_AREAS or retire the script`);
    }
  }
  // any map that DECLARES an area (so its banner wears a region-true glyph run)
  // must name a real glyph-script area — a typo would silently draw nothing.
  for (const map of Object.values(MAPS)) {
    if (map.area !== undefined && !GLYPH_SCRIPT[map.area]) {
      fail('glyph-script', `map '${map.id}' declares area '${map.area}' that owns no GLYPH_SCRIPT — fix the area key or register the script`);
    }
  }
}

// S18 Movement 26 (ADR-067) — THE VEHICLE FORGE: every drivable/ambient vehicle
// is a deterministic paint variant carrying its true gameplay DATA (seats →
// seat-fit, a collision footprint, the terrain it travels). Gated BOTH directions:
//  · every VEHICLE_CATALOG variant names a real VEHICLE_SPECS type;
//  · every VEHICLE_SPECS type ships at least one paint variant (no dead spec);
//  · the spec is sane (terrain valid, seats ≥ 0, footprint inside the sprite, a
//    ridable vehicle has ≥1 usable seat), and sprite names are unique.
{
  const TERRAINS = new Set(['road', 'water', 'air']);
  const specTypes = new Set(Object.keys(VEHICLE_SPECS));
  const seen = new Set<string>();
  const usedTypes = new Set<string>();
  for (const v of VEHICLE_CATALOG) {
    if (seen.has(v.name)) fail('vehicles', `vehicle sprite name '${v.name}' is registered twice — names are keys`);
    seen.add(v.name);
    if (!specTypes.has(v.type)) {
      fail('vehicles', `vehicle '${v.name}' has type '${v.type}' with no VEHICLE_SPECS row — extend the spec table, never ad-hoc`);
      continue;
    }
    usedTypes.add(v.type);
  }
  for (const type of specTypes) {
    if (!usedTypes.has(type)) fail('vehicles', `VEHICLE_SPECS type '${type}' has no paint variant in VEHICLE_CATALOG — a dead spec row`);
    const s = VEHICLE_SPECS[type];
    if (!TERRAINS.has(s.terrain)) fail('vehicles', `vehicle '${type}' has unknown terrain '${s.terrain}'`);
    if (s.seats < 0) fail('vehicles', `vehicle '${type}' has negative seats`);
    // a ridable vehicle (the party can board) must leave ≥1 seat after the driver
    if (s.cls !== 'prop' && s.cls !== 'machine' && s.cls !== 'bike' && s.seats >= 2 && usableSeats(type) < 1) {
      fail('vehicles', `vehicle '${type}' seats ${s.seats} but has no usable seat — seat-fit math is off`);
    }
    const inX = s.solid.ox >= 0 && s.solid.ox + s.solid.w <= s.w;
    const inY = s.solid.oy >= 0 && s.solid.oy + s.solid.h <= s.h;
    if (!inX || !inY) fail('vehicles', `vehicle '${type}' footprint ${JSON.stringify(s.solid)} falls outside its ${s.w}x${s.h} sprite`);
  }
}

// S18 Movement 28 (ADR-069) — OVERWORLD PSI GATES (§A4.11 "powers as keys"):
// every chapter dungeon seeds ≥1 obstacle that reacts to a field-cast PSI key.
// Gated BOTH directions:
//  · every gate's kind is known, its `key` agrees with GATE_KEY[kind] (one truth),
//    its band is a real dungeon band, it has a teachable ability (a learner exists),
//    and it carries a §A11 sign;
//  · every dungeon band (ch3–10) carries ≥1 gate — the ≥1-per-dungeon law.
{
  const bands = new Set(PSI_DUNGEON_BANDS);
  const covered = new Set<string>();
  for (const g of Object.values(PSI_GATES)) {
    const expectKey = GATE_KEY[g.kind];
    if (!expectKey) { fail('psi-gate', `gate '${g.id}' has unknown kind '${g.kind}'`); continue; }
    if (g.key !== expectKey) fail('psi-gate', `gate '${g.id}' kind '${g.kind}' wants key '${expectKey}', declares '${g.key}'`);
    if (!bands.has(g.band)) fail('psi-gate', `gate '${g.id}' band '${g.band}' is not a dungeon band`);
    if (abilitiesForKey(g.key).length === 0) fail('psi-gate', `gate '${g.id}' needs key '${g.key}' but NO ability casts it — a gate that can't be opened`);
    if (!g.sign || g.sign.trim().length === 0) fail('psi-gate', `gate '${g.id}' has no §A11 sign — teach without explaining the joke`);
    covered.add(g.band);
  }
  for (const b of PSI_DUNGEON_BANDS) {
    if (!covered.has(b)) fail('psi-gate', `dungeon band '${b}' has no PSI gate — §A4.11 seeds ≥1 per chapter dungeon`);
  }
}

// S18 Movement 29 (ADR-070) — THE PROPERTY MARKET (§A4.13). Every listing is a
// well-formed, ownable property. Gated:
//  · kind known; price positive; rent ONLY on shop/rental (homes/flips earn 0);
//    a home payload sits only on a home; the area is a real AREA_SKINS area (M25);
//    the band is well-formed; the blurb is in voice (non-empty); storageTier ≥ 1;
//  · deeds are UNIQUE across all properties (a deed opens exactly one door);
//  · every LIVE_PROPERTIES id is a real property (the placed-now set is honest).
{
  const KINDS = new Set<string>(PROPERTY_KINDS);
  const deeds = new Map<string, string>();
  for (const p of Object.values(PROPERTIES)) {
    if (!KINDS.has(p.kind)) fail('property', `property '${p.id}' has unknown kind '${p.kind}'`);
    if (p.basePrice <= 0) fail('property', `property '${p.id}' has a non-positive price`);
    if (!/^ch\d+$/.test(p.band)) fail('property', `property '${p.id}' band '${p.band}' is malformed`);
    if (!AREA_SKINS_FOR_PROP[p.area]) fail('property', `property '${p.id}' sits in area '${p.area}' that owns no AREA_SKINS slice (M25)`);
    const earnsRent = p.kind === 'shop' || p.kind === 'rental';
    if (earnsRent && p.rent <= 0) fail('property', `property '${p.id}' is a ${p.kind} but earns no rent`);
    if (!earnsRent && p.rent !== 0) fail('property', `property '${p.id}' is a ${p.kind} — only shops/rentals collect rent`);
    if (p.storageTier < 1) fail('property', `property '${p.id}' has storageTier < 1`);
    if (!p.blurb || p.blurb.trim().length === 0) fail('property', `property '${p.id}' has no §A11 agent blurb`);
    const prior = deeds.get(p.deed);
    if (prior) fail('property', `deed '${p.deed}' opens both '${prior}' and '${p.id}' — a deed is one door`);
    deeds.set(p.deed, p.id);
  }
  for (const id of LIVE_PROPERTIES) {
    if (!PROPERTIES[id]) fail('property', `LIVE_PROPERTIES names '${id}' which is not a real property`);
  }
}

// S18 Movement 30 (ADR-071) — THE FURNITURE CATALOG (§A4.14). Every piece is a
// well-formed, placeable, cozy thing. Gated:
//  · function tag is known; footprint is positive; coziness ≥ 0; price > 0; band
//    well-formed; a sprite key is named; the name is in voice;
//  · the FUNCTIONAL §A4.14 core (bed/phone/fridge/footlocker) each has ≥1 piece,
//    so a furnished home can actually be a base.
{
  const FNS = new Set<string>(FURNITURE_FUNCTIONS);
  const haveFn = new Set<string>();
  for (const d of Object.values(FURNITURE)) {
    if (!FNS.has(d.fn)) fail('furniture', `furniture '${d.id}' has unknown function '${d.fn}'`);
    if (d.w <= 0 || d.h <= 0) fail('furniture', `furniture '${d.id}' has a non-positive footprint`);
    if (d.cozy < 0) fail('furniture', `furniture '${d.id}' has negative coziness`);
    if (d.price <= 0) fail('furniture', `furniture '${d.id}' has a non-positive price`);
    if (!/^ch\d+$/.test(d.band)) fail('furniture', `furniture '${d.id}' band '${d.band}' is malformed`);
    if (!d.sprite || d.sprite.trim().length === 0) fail('furniture', `furniture '${d.id}' names no sprite`);
    if (!d.name || d.name.trim().length === 0) fail('furniture', `furniture '${d.id}' has no name`);
    haveFn.add(d.fn);
  }
  for (const core of ['bed', 'phone', 'fridge', 'footlocker'] as const) {
    if (!haveFn.has(core)) fail('furniture', `the §A4.14 base needs a '${core}' piece — none in the catalog`);
  }
}

// S18 Movement 31 (ADR-072) — THE STORY THREADS (§A4.10) + the disguise sneaks.
// The Trust Thread + the Clicker Question must be well-formed, ordered, non-missable
// flag chains; disguises must blend into a canon faction.
{
  for (const thread of THREAD_IDS) {
    for (const p of chainProblems(thread)) fail('story-thread', `${thread}: ${p}`);
  }
  // every beat flag is unique across BOTH threads (independent machines)
  const flags = Object.values(THREAD_BEATS).map((b) => b.flag);
  for (const f of flags) {
    if (flags.filter((x) => x === f).length > 1) fail('story-thread', `beat flag '${f}' used twice`);
  }
  // the trust thread climaxes at the three-quarter mark (Ch.7→8) and resolves; the
  // clicker question seeds (Ch.5) → crisis (Ch.7) → clears (Ch.8) — pin the shape
  const trustKinds = Object.values(THREAD_BEATS).filter((b) => b.thread === 'trust').map((b) => b.kind);
  if (!trustKinds.includes('open')) fail('story-thread', 'the trust thread never OPENS (Ch.3 PUPPET)');
  if (!trustKinds.includes('climax')) fail('story-thread', 'the trust thread never CLIMAXES (the ~3/4 mark)');
  if (!trustKinds.includes('resolve')) fail('story-thread', 'the trust thread never RESOLVES (the party bonds)');
  const clickerKinds = Object.values(THREAD_BEATS).filter((b) => b.thread === 'clicker').map((b) => b.kind);
  for (const need of ['seed', 'crisis', 'clearing'] as const) {
    if (!clickerKinds.includes(need)) fail('story-thread', `the clicker question is missing its ${need}`);
  }
}
{
  const FACTIONS = new Set<string>(DISGUISE_FACTIONS);
  for (const d of Object.values(DISGUISES)) {
    if (!FACTIONS.has(d.blendTag)) fail('disguise', `disguise '${d.id}' blends into unknown faction '${d.blendTag}'`);
    if (d.quality < 0 || d.quality > 1) fail('disguise', `disguise '${d.id}' quality ${d.quality} is out of [0,1]`);
    if (!/^ch\d+$/.test(d.band)) fail('disguise', `disguise '${d.id}' band '${d.band}' is malformed`);
    if (!d.note || d.note.trim().length === 0) fail('disguise', `disguise '${d.id}' has no §A11 note`);
  }
}

// S18 Movement 32 (ADR-073) — THE PAPERBOY. The live route must be winnable (a
// real goal, enough papers + houses) and the prize must be a flag + a finale caller.
{
  const route = liveRoute();
  const houses = route.items.filter((i) => i.kind === 'mailbox').length;
  if (houses < 1) fail('paperboy', 'the route has no houses to deliver to');
  if (route.deliverGoal < 1 || route.deliverGoal > houses) fail('paperboy', `deliver goal ${route.deliverGoal} is impossible (${houses} houses)`);
  if (route.papers < route.deliverGoal) fail('paperboy', `only ${route.papers} papers for a goal of ${route.deliverGoal}`);
  if (!PAPERBOY.prize.flag) fail('paperboy', 'the prize sets no flag');
  if (!PAPERBOY.prize.caller) fail('paperboy', 'the prize earns no finale caller');
  // a perfect input tape must actually clear the goal (the minigame is winnable).
  // The sim increments x THEN resolves, so the k-th input lands on column k.
  const mail = new Map<number, number>();
  for (const it of route.items) if (it.kind === 'mailbox') mail.set(it.x, it.lane);
  const tape: Array<{ lane: 0 | 1 | 2; throw: boolean }> = [];
  for (let x = 1; x < route.length; x++) {
    const lane = mail.get(x);
    tape.push(lane !== undefined ? { lane: lane === 0 ? 0 : 2, throw: true } : { lane: 1, throw: false });
  }
  const result = new PaperboySim(route).run(tape);
  if (!prizeEarned(route, result)) fail('paperboy', 'a PERFECT run does not clear the prize goal — the route is unwinnable');
}

// S18 Movement 33 (ADR-074) — THE FLEET. Staging + craft must be sound:
//  · every purchasable craft is a real VEHICLE_SPECS type whose terrain matches its
//    venue (a marina sells water craft, an airfield/helipad sells air craft, a dealer
//    road), at a positive price, with a unique title key-item, in voice;
//  · every staged class/terrain exists; every water/air access type is a real vehicle;
//  · the control power scales road → water → air in chapter order (ADR-035).
{
  const VENUE_TERRAIN: Record<string, string> = { dealer: 'road', marina: 'water', airfield: 'air', helipad: 'air' };
  const titles = new Map<string, string>();
  for (const c of Object.values(FLEET_CRAFT)) {
    const spec = VSPECS_FLEET[c.vehicleType];
    if (!spec) { fail('fleet', `craft '${c.id}' is type '${c.vehicleType}' with no VEHICLE_SPECS row`); continue; }
    const want = VENUE_TERRAIN[c.venue];
    if (spec.terrain !== want) fail('fleet', `craft '${c.id}' sells at a ${c.venue} (expects ${want}) but is a ${spec.terrain} craft`);
    if (c.price <= 0) fail('fleet', `craft '${c.id}' has a non-positive price`);
    if (!/^ch\d+$/.test(c.band)) fail('fleet', `craft '${c.id}' band '${c.band}' is malformed`);
    if (!c.title || !c.title.startsWith('title_')) fail('fleet', `craft '${c.id}' title '${c.title}' must be a title_* key-item`);
    if (!c.seller || !c.note) fail('fleet', `craft '${c.id}' has no §A11 seller/note`);
    const prior = titles.get(c.title);
    if (prior) fail('fleet', `title '${c.title}' owns both '${prior}' and '${c.id}'`);
    titles.set(c.title, c.id);
  }
  for (const m of [WATER_ACCESS, AIR_ACCESS]) {
    for (const type of Object.keys(m)) {
      if (!VSPECS_FLEET[type]) fail('fleet', `access table names '${type}' which is no VEHICLE_SPECS type`);
    }
  }
  // staging climbs in chapter order and lists real terrains
  let lastBand = 0;
  const seenTerrain = new Set<string>();
  for (const st of FLEET_STAGES) {
    const b = Number(/^ch(\d+)$/.exec(st.band)?.[1] ?? 0);
    if (b < lastBand) fail('fleet', `fleet stage '${st.band}' goes backwards in chapter order`);
    lastBand = b;
    seenTerrain.add(st.terrain);
  }
  for (const t of ['road', 'water', 'air']) {
    if (!seenTerrain.has(t)) fail('fleet', `the fleet never scales into '${t}' — ADR-035 staging is incomplete`);
  }
}

// S18 Movement 34 (ADR-075) — BALANCE: the §A9 Fortune Arc must be a well-formed
// curve (Ch.1–10 in order, monotonic, ~$1K → $3B+, no impossible single jump).
{
  const bands = FORTUNE_ARC.map((r) => r.band);
  const want = ['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7', 'ch8', 'ch9', 'ch10'];
  if (JSON.stringify(bands) !== JSON.stringify(want)) fail('fortune', `the Fortune Arc must cover Ch.1–10 in order, got ${bands.join(',')}`);
  for (let i = 1; i < FORTUNE_ARC.length; i++) {
    const lo = FORTUNE_ARC[i - 1].netWorth;
    const hi = FORTUNE_ARC[i].netWorth;
    if (hi <= lo) fail('fortune', `the Fortune Arc dips at ${FORTUNE_ARC[i].band} (${hi} ≤ ${lo})`);
    if (hi / lo > 10) fail('fortune', `the Fortune Arc jumps too hard at ${FORTUNE_ARC[i].band} (${(hi / lo).toFixed(1)}× — keep it reachable)`);
  }
  if (FORTUNE_ARC[0].netWorth > 2_000) fail('fortune', 'the Fortune Arc starts too rich (Ch.1 should be a tight ~$1K)');
  if (FORTUNE_ARC[FORTUNE_ARC.length - 1].netWorth < 3_000_000_000) fail('fortune', 'the Fortune Arc must reach $3B+ by Ch.10');
}

// S19 Movement 37 (ADR-078) — THE CAR DEALERSHIP (§A4.15). Every listing is a
// well-formed, ownable ROAD vehicle that depreciates. Gated BOTH directions:
//  · every car is a real VEHICLE_SPECS type whose terrain is 'road', at a positive
//    price, with a well-formed band, a unique `title_*` key-item, and §A11 patter;
//  · titles are unique ACROSS the dealership AND the fleet (a title opens one thing);
//  · Bert always wins — every car's trade-in (sellValue) is strictly < its sticker.
{
  const titles = new Map<string, string>();
  for (const c of Object.values(FLEET_CRAFT)) titles.set(c.title, `fleet:${c.id}`); // shared key-item space
  for (const c of Object.values(DEALERSHIP)) {
    const spec = VEHICLE_SPECS[c.vehicleType];
    if (!spec) { fail('dealership', `car '${c.id}' is type '${c.vehicleType}' with no VEHICLE_SPECS row`); continue; }
    if (spec.terrain !== 'road') fail('dealership', `car '${c.id}' is a ${spec.terrain} craft — the dealership sells ROAD vehicles (marinas/airfields sell the rest)`);
    if (c.price <= 0) fail('dealership', `car '${c.id}' has a non-positive price`);
    if (!/^ch\d+$/.test(c.band)) fail('dealership', `car '${c.id}' band '${c.band}' is malformed`);
    if (!c.title || !c.title.startsWith('title_')) fail('dealership', `car '${c.id}' title '${c.title}' must be a title_* key-item`);
    if (!c.dealer || !c.note) fail('dealership', `car '${c.id}' has no §A11 dealer/note`);
    const prior = titles.get(c.title);
    if (prior) fail('dealership', `title '${c.title}' is claimed by both '${prior}' and 'dealership:${c.id}'`);
    titles.set(c.title, `dealership:${c.id}`);
    if (sellValue(c) >= c.price) fail('dealership', `car '${c.id}' sells back for ${sellValue(c)} ≥ its ${c.price} sticker — depreciation must always lose`);
  }
}

// S19 Movement 39 (ADR-080) — THE MILITARY MOTOR POOL (§A7/§A8). Gated BOTH
// directions: every MILITARY_VEHICLES entry is a real VEHICLE_SPECS type that is
// `hardened` (Faraday/dead-air shielded → Clicker-blocked by the existing spine)
// and carries §A11 voice; AND every hardened spec is listed in the motor pool (no
// orphan hardening). A hardened machine must REFUSE the Clicker by construction.
{
  const listed = new Set<string>(MILITARY_TYPES);
  for (const m of Object.values(MILITARY_VEHICLES)) {
    const spec = VEHICLE_SPECS[m.type];
    if (!spec) { fail('military', `military vehicle '${m.type}' has no VEHICLE_SPECS row`); continue; }
    if (spec.hardened !== true) fail('military', `military vehicle '${m.type}' is not hardened — the army's kit wears the shield by default`);
    if (!m.designation || !m.note) fail('military', `military vehicle '${m.type}' has no §A11 designation/note`);
  }
  for (const [type, spec] of Object.entries(VEHICLE_SPECS)) {
    if (spec.hardened === true && !listed.has(type)) {
      fail('military', `VEHICLE_SPECS '${type}' is hardened but isn't in the military motor pool — list it or drop the hardening`);
    }
  }
}

// S19 Movement 40 (ADR-081) — THE ARMY ON OUR TAIL (§A6). The pursuit arc must be
// a well-formed, ordered, NON-MISSABLE flag chain: contiguous order, prevFlag links,
// bands non-decreasing, the misread opens, exactly one clearing terminal, and the
// clearing earns the General as a finale caller. The army is wrong, never the Hush.
{
  for (const p of armyArcProblems()) fail('army-arc', p);
  // every beat flag is unique (independent of the storythreads' flags too)
  const flags = Object.values(ARMY_BEATS).map((b) => b.flag);
  for (const f of flags) {
    if (flags.filter((x) => x === f).length > 1) fail('army-arc', `beat flag '${f}' used twice`);
  }
  // the canon set-pieces are all present (checkpoint, helmeted tank, F-15 flyover)
  const kinds = Object.values(ARMY_BEATS).map((b) => b.kind);
  for (const need of ['misread', 'checkpoint', 'tank', 'flyover', 'clearing'] as const) {
    if (!kinds.includes(need)) fail('army-arc', `the arc is missing its ${need} beat`);
  }
  // the clearing's caller (the General) is named (the §A6 finale payoff)
  const clearing = Object.values(ARMY_BEATS).find((b) => b.kind === 'clearing');
  if (clearing && !clearing.caller) fail('army-arc', 'the clearing earns no finale caller');
}

// S20 Movement 43 (ADR-084) — THE FUEL SYSTEM (§A4.16). Every vehicle type has a
// sane fuel profile derived from its class/terrain. Gated:
//  · the kind is valid; human-powered (bikes/props) carry kind 'none' with a 0 tank
//    and never need fuel; everything else has a positive tank + economy and a LONG
//    but finite range (a full tank goes a good distance, but it runs out).
{
  const KINDS = new Set(['gas', 'diesel', 'jet', 'electric', 'none']);
  const HUMAN = new Set(['bicycle', 'bmx', 'road_bike']);
  for (const type of Object.keys(VEHICLE_SPECS)) {
    const p = fuelProfile(type);
    if (!KINDS.has(p.kind)) fail('fuel', `vehicle '${type}' has unknown fuel kind '${p.kind}'`);
    const spec = VEHICLE_SPECS[type];
    const human = HUMAN.has(type) || spec.cls === 'bike' || spec.cls === 'prop';
    if (human) {
      if (p.kind !== 'none' || needsFuel(type)) fail('fuel', `human-powered '${type}' must run on no fuel`);
      if (p.tank !== 0) fail('fuel', `human-powered '${type}' must carry a 0 tank`);
    } else {
      if (p.kind === 'none') fail('fuel', `powered '${type}' has no fuel kind`);
      if (p.tank <= 0 || p.econ <= 0) fail('fuel', `powered '${type}' has a non-positive tank/economy`);
      if (rangeTiles(type) < 500) fail('fuel', `powered '${type}' range ${rangeTiles(type)} is too short to be fun — a tank should go a long way`);
    }
    // the EV line runs on electricity (the Nikolai charges cheap), never gas
    if (type === 'ev' || type === 'nikolai') {
      if (p.kind !== 'electric') fail('fuel', `'${type}' is an EV and must run on electric`);
    }
    // M44 (ADR-085) IGNITION: you turn ON combustion (gas/diesel/jet) ONLY; EVs +
    // human-powered need no key — ignitionRequired must agree with the fuel kind.
    const combustion = p.kind === 'gas' || p.kind === 'diesel' || p.kind === 'jet';
    if (ignitionRequired(type) !== combustion) {
      fail('fuel', `'${type}' ignition (${ignitionRequired(type)}) disagrees with its fuel kind '${p.kind}' — turn on combustion only`);
    }
  }
}

// S20 Movement 45 (ADR-086) — GAS STATIONS & CHARGING (§A4.17). Where you PAY to
// fill. Gated BOTH directions:
//  · every station sits in a real AREA_SKINS area, has a known kind, a non-empty
//    valid fuel list, a positive price multiplier, and §A11 attendant voice;
//  · EVERY fuel kind a real vehicle needs (gas/diesel/jet/electric) is sold at ≥1
//    station — you can never be stranded with nowhere to fill your kind;
//  · the live USA areas each have a station; home charging is cheaper than ANY
//    station's electric price (the §A4.16 home-charger promise); Mars sells no gas.
{
  const KINDS = new Set<string>(STATION_KINDS);
  const FUELS = new Set(['gas', 'diesel', 'jet', 'electric']);
  const soldKinds = new Set<string>();
  for (const st of Object.values(STATIONS)) {
    if (!AREA_SKINS_FOR_PROP[st.area]) fail('stations', `station '${st.id}' sits in area '${st.area}' that owns no AREA_SKINS slice (M25)`);
    if (!KINDS.has(st.kind)) fail('stations', `station '${st.id}' has unknown kind '${st.kind}'`);
    if (st.fuels.length === 0) fail('stations', `station '${st.id}' sells no fuel`);
    for (const f of st.fuels) {
      if (!FUELS.has(f)) fail('stations', `station '${st.id}' sells unknown fuel '${f}'`);
      soldKinds.add(f);
    }
    if (st.priceMult <= 0) fail('stations', `station '${st.id}' has a non-positive price multiplier`);
    if (!st.attendant || !st.note) fail('stations', `station '${st.id}' has no §A11 attendant/note`);
  }
  // every needed fuel kind is sold somewhere (never stranded)
  for (const k of NEEDED_FUEL_KINDS) {
    if (!soldKinds.has(k)) fail('stations', `no station sells '${k}' — a vehicle that runs on it could never refuel`);
  }
  // the live USA areas each have a station
  for (const live of ['otterbrook', 'brickton']) {
    if (!Object.values(STATIONS).some((s) => s.area === live)) fail('stations', `live area '${live}' has no station — gas in each region (§A4.17)`);
  }
  // the home charger beats every station's electric price (the §A4.16 promise)
  const home = homeChargePricePerUnit();
  for (const st of Object.values(STATIONS)) {
    if (sells(st, 'electric') && home >= stationPricePerUnit(st, 'electric')) {
      fail('stations', `home charging (${home}) is not cheaper than station '${st.id}' electric (${stationPricePerUnit(st, 'electric')})`);
    }
  }
  // there's no gasoline on Mars (electric only — the canon gag)
  const mars = Object.values(STATIONS).find((s) => s.area === 'mars');
  if (mars && (sells(mars, 'gas') || sells(mars, 'diesel'))) fail('stations', 'Mars sells no gas/diesel — electric only (§A4.17)');
}

// S20 Movement 46 (ADR-087) — THE WORLD MAP + VEHICLE FERRYING (§A5). Gated BOTH
// directions:
//  · every continent's areas are real AREA_SKINS areas; every CANON_AREA belongs
//    to EXACTLY ONE continent (full coverage, no orphan area, no double-claim);
//  · exactly one non-Earth continent (Mars); Mars↔Earth ferries are ROCKET-only and
//    Earth↔Earth ferries are air/sea (the §A5 set-piece travel, on wheels-in-a-hold).
{
  const claimed = new Map<string, string>();
  for (const c of Object.values(CONTINENTS)) {
    if (c.areas.length === 0) fail('world', `continent '${c.id}' has no areas`);
    for (const a of c.areas) {
      if (!AREA_SKINS_FOR_PROP[a]) fail('world', `continent '${c.id}' claims area '${a}' that owns no AREA_SKINS slice (M25)`);
      const prior = claimed.get(a);
      if (prior) fail('world', `area '${a}' is claimed by both '${prior}' and '${c.id}' — one area, one continent`);
      claimed.set(a, c.id);
    }
  }
  // every canon area is placed on a continent (full coverage)
  for (const a of CANON_AREAS) {
    if (!AREA_CONTINENT[a]) fail('world', `canon area '${a}' belongs to no continent — place it in CONTINENTS`);
  }
  // exactly one off-Earth continent (Mars), and it's named 'mars'
  const offEarth = Object.values(CONTINENTS).filter((c) => !c.earth).map((c) => c.id);
  if (offEarth.length !== 1 || offEarth[0] !== 'mars') fail('world', `expected exactly one off-Earth continent 'mars', got [${offEarth.join(',')}]`);
  // Mars↔Earth is rocket-only; two Earth continents bridge by air/sea
  for (const id of CONTINENT_IDS) {
    if (id === 'mars') continue;
    const toMars = ferryMethodsBetween(id, 'mars');
    if (JSON.stringify(toMars) !== JSON.stringify(['rocket'])) fail('world', `ferry ${id}→mars must be rocket-only, got [${toMars.join(',')}]`);
  }
  const earthPair = CONTINENT_IDS.filter((c) => CONTINENTS[c].earth).slice(0, 2);
  if (earthPair.length === 2) {
    const m = ferryMethodsBetween(earthPair[0], earthPair[1]);
    if (!m.includes('air') || !m.includes('sea')) fail('world', `Earth↔Earth ferry must offer air + sea, got [${m.join(',')}]`);
  }
  // S20 M47 (ADR-088): you can buy property on EVERY continent (incl. Mars) — the
  // rags-to-riches → billionaire-on-Mars arc. Each continent has ≥1 buyable property.
  const propContinents = new Set<string>();
  for (const p of Object.values(PROPERTIES)) {
    const cont = AREA_CONTINENT[p.area];
    if (cont) propContinents.add(cont);
  }
  for (const id of CONTINENT_IDS) {
    if (!propContinents.has(id)) fail('world', `continent '${id}' has no buyable property — you must be able to buy in on every continent (§A4.13/ADR-088)`);
  }
}

// S20 Movement 48 (ADR-089) — THE ROCKET (The Long Shot, §A5/§A6). Gated:
//  · the rocket is a real VEHICLE_SPECS air type with its own paint;
//  · The Long Shot is well-formed (a title_*, a positive price, real pad continents,
//    the Earth pad is Hawaii and the dest is Mars), and the ferry's rocket method
//    requires exactly that title (one key opens Mars);
//  · the launch flies ONLY the pad↔Mars route, owns-gated, Ember-law (visited) safe.
{
  const r = VEHICLE_SPECS[THE_LONG_SHOT.vehicleType];
  if (!r) fail('rocket', `The Long Shot is type '${THE_LONG_SHOT.vehicleType}' with no VEHICLE_SPECS row`);
  else if (r.terrain !== 'air') fail('rocket', `the rocket must be an air craft, got '${r.terrain}'`);
  if (!THE_LONG_SHOT.title.startsWith('title_')) fail('rocket', `The Long Shot title '${THE_LONG_SHOT.title}' must be a title_* key-item`);
  if (THE_LONG_SHOT.price <= 0) fail('rocket', 'The Long Shot has a non-positive price');
  if (!CONTINENTS[THE_LONG_SHOT.earthPad] || !CONTINENTS[THE_LONG_SHOT.marsPad]) fail('rocket', 'The Long Shot pads must be real continents');
  if (EARTH_PAD !== 'hawaii') fail('rocket', `the Earth pad must be Hawaii (Mauna Lani, §A6), got '${EARTH_PAD}'`);
  if (MARS !== 'mars' || CONTINENTS.mars.earth !== false) fail('rocket', 'the rocket must fly to off-Earth Mars');
  if (!METHOD_CRAFT.rocket.includes(THE_LONG_SHOT.title)) fail('rocket', 'the ferry rocket method must require The Long Shot title');
  if (launchCost() <= 0) fail('rocket', 'a launch must cost rocket fuel');
  // owns-gated + pad-only + visited-only
  const owned = [THE_LONG_SHOT.title];
  if (canLaunch(EARTH_PAD, MARS, [], ['mars']).reason !== 'not_owned') fail('rocket', 'launch must require owning the rocket');
  if (canLaunch(EARTH_PAD, MARS, owned, []).reason !== 'not_visited') fail('rocket', 'launch must honor the Ember law (Mars visited)');
  if (canLaunch('usa', MARS, owned, ['mars']).reason !== 'wrong_pads') fail('rocket', 'launch must stage from the Hawaii pad, not just anywhere');
  if (!canLaunch(EARTH_PAD, MARS, owned, ['mars']).ok) fail('rocket', 'a fully-earned launch to a visited Mars must succeed');
  if (!canLaunch(MARS, EARTH_PAD, owned, ['mars', 'hawaii']).ok) fail('rocket', 'the return launch (Mars→home) must work — the shuttle is repeatable');
}

// S11b — WEAR TIERS, BOTH DIRECTIONS: every §A7 roster enemy has a wear-
// capable battle draw in ENEMY_BATTLE_ART (with its sprite key agreeing
// with the data), and every wear row maps to a roster enemy.
{
  const authoredBattle = new Set<string>(AUTHORED_ENEMY_BATTLE_ART_KEYS);
  const authoredOverworld = new Set<string>(AUTHORED_ENEMY_OVERWORLD_ART_KEYS);
  const authoredOverworldIds = new Set<string>(AUTHORED_ENEMY_OVERWORLD_ART_IDS);
  const authoredWalkers = new Set<string>(AUTHORED_NPC_CHARACTER_IDS);
  for (const id of Object.keys(CAST)) authoredWalkers.add(id);

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
  for (const e of Object.values(ENEMIES)) {
    if (!authoredBattle.has(e.sprite)) {
      fail('visual-id', `enemy '${e.id}' battle sprite '${e.sprite}' is not in the authored enemy loader; old procedural battle art would be treated as current`);
    }

    const identity = enemyVisualIdentity(e);
    if (ENEMY_OVERWORLD_SHEET_ID_SET.has(e.id)) {
      const want = enemyOverworldKey(e.id);
      if (e.overworld !== want) {
        fail('visual-id', `enemy '${e.id}' must use authored overworld sheet '${want}', got '${e.overworld ?? '(none)'}'`);
      }
      if (!authoredOverworld.has(want) || !authoredOverworldIds.has(e.id)) {
        fail('visual-id', `enemy '${e.id}' claims overworld '${want}' but the authored loader has no matching ${e.id}_8dir.png sheet`);
      }
    } else if (e.overworld) {
      fail('visual-id', `enemy '${e.id}' carries overworld '${e.overworld}' but is not in ENEMY_OVERWORLD_SHEET_IDS; register the identity row or remove the stale field`);
    }
    if (identity.field.kind === 'walker' && !authoredWalkers.has(identity.field.key)) {
      fail('visual-id', `enemy '${e.id}' walker '${identity.field.key}' is not an authored character sheet`);
    }
  }

  for (const id of Object.keys(ENEMY_BATTLE_ART)) {
    if (!ENEMIES[id]) fail('wear', `ENEMY_BATTLE_ART row '${id}' matches no §A7 roster enemy — extend or retire the row`);
  }
}

// Visual identity reverse checks: loaded authored enemy images must be claimed.
{
  const claimedBattleKeys = new Set<string>([
    ...Object.values(ENEMY_BATTLE_ART).map((row) => row.sprite),
    ...Object.values(FORM_ART).map((row) => row.sprite),
  ]);
  for (const key of AUTHORED_ENEMY_BATTLE_ART_KEYS) {
    if (key.endsWith('_w1') || key.endsWith('_w2')) continue;
    if (!claimedBattleKeys.has(key)) {
      fail('visual-id', `authored enemy battle image '${key}' is loaded but no enemy/form claims it; orphan art will mask identity drift`);
    }
  }
  for (const id of AUTHORED_ENEMY_OVERWORLD_ART_IDS) {
    if (!ENEMY_OVERWORLD_SHEET_ID_SET.has(id)) {
      fail('visual-id', `authored overworld enemy sheet '${id}_8dir.png' is loaded but not registered in ENEMY_OVERWORLD_SHEET_IDS`);
    }
  }
  if (ENEMY_OVERWORLD_FRAME.w !== 96 || ENEMY_OVERWORLD_FRAME.h !== 128 || ENEMY_OVERWORLD_FRAME.frames !== 8) {
    fail('visual-id', `enemy overworld frame contract drifted to ${ENEMY_OVERWORLD_FRAME.w}x${ENEMY_OVERWORLD_FRAME.h} x${ENEMY_OVERWORLD_FRAME.frames}`);
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

/* ============ S17 (ADR-061) — THE CATALOG SPINE (the widened §A8 pins) ============
 * The §A8 catalog grows from ~140 toward ~500 items. These per-REGION manifests
 * REPLACE the old narrow Ch.1–2 pins (the flat weapon list, the lone-star_cola
 * pp line, the two-item armor/arms manifests). Each is gated BOTH directions and
 * sliced by the item's `band`; a new region adds rows here, never an ad-hoc item.
 * Every check files under section 'catalog'. */
{
  const BANDS = ['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7', 'ch8', 'ch9', 'ch10', 'cross'] as const;

  // 0. every item carries a band — the per-region slice the quota counts off
  for (const item of Object.values(ITEMS)) {
    if (item.band === undefined) {
      fail('catalog', `item '${item.id}' (${item.kind}) has no band — tag it ch1…ch10 | cross (ITEM_BAND in data/items.ts)`);
    }
  }

  // 1. THE WEAPON LADDER, per region (§A8 lines are personal — wielder-tagged).
  //    Both directions: every listed rung exists with the right wielder + band;
  //    every kind:'weapon' item sits on some region's ladder.
  const WEAPON_LADDER: Record<string, Record<string, string>> = {
    // M18 (ADR-063): the Americas sidegrades join Ch.1 (the foam finger is an
    // investment in self-belief; the nonstick pan is a faye choice vs the copper)
    ch1: {
      cracked_bat: 'rex', tball_bat: 'rex', hand_me_down_pan: 'faye',
      foam_finger: 'rex', wiffle_bat: 'rex', nonstick_pan: 'faye',
    },
    ch2: { sandlot_slugger: 'rex', copper_pan: 'faye' },
    // M19 (ADR-064): Milo's GUN LADDER (Pellet Popper → Spud Gun → Double-Barrel
    // Sparker → *Gauss Lobber*, the Mainframe drop) + the Cricket Bat sidegrade (Jay)
    ch3: {
      pellet_popper: 'milo', spud_gun: 'milo', double_barrel_sparker: 'milo', gauss_lobber: 'milo',
      cricket_bat: 'rex',
    },
    // M19 (ADR-064): Norway has no joining hero — it arms the party with SCALE
    // sidegrades (a frozen cod for Jay, a flatbread griddle for Mia)
    ch4: { frozen_cod: 'rex', lefse_griddle: 'faye' },
    // M19: PIPPA'S KIT LADDER (Stamp Sling → Needle Saber → Thimble Bell →
    // *Royal Red Pen*, the Foreign Minister's appointment top) — Minimus
    ch5: {
      stamp_sling: 'pippa', needle_saber: 'pippa', thimble_bell: 'pippa', royal_red_pen: 'pippa',
    },
    // M20 (ADR-065) — THE FAR-WORLD CATALOG: the §A8 MID-RUNGS. Jay's Aluminum →
    // Hall-of-Famer (the Sphinx drop), Mia's Cast-Iron (ch6); Mia's Chef's Pan
    // (the Cobra Raja drop) + the cobra-flute sidegrade (ch7); Dorin's River Beads
    // (defined early) + the Paper Dragon's folded-paper fan (the boss drop, ch8).
    ch6: { aluminum_bat: 'rex', hall_of_famer_bat: 'rex', cast_iron_pan: 'faye' },
    ch7: { chefs_pan: 'faye', cobra_flute: 'pippa' },
    ch8: { river_beads: 'dorin', paper_fan: 'pippa' },
    // M21 (ADR-091) — THE LAST-WORLD CATALOG closes the §A8 ladders. Ch.9 Romania:
    // Dorin's first beads (defined early) + Mia's THE HOLY PAN (her TOP — the
    // monastery's blessing, its sincere home) + the Candelabra (COUNT HOAXULA's
    // boss-drop). Ch.10 Mars/Hawaii: Jay's CASEY'S LAST SWING (his TOP, the drop) +
    // Dorin's COMET BEAD (his TOP, the 1/128 Null Walker chase) + the Board of
    // Legends (Jay's funniest sidegrade) + Pemberton's ray-gun (Milo's optional).
    ch9: { cedar_beads: 'dorin', holy_pan: 'faye', candelabra: 'rex' },
    ch10: {
      board_of_legends: 'rex', pembertons_raygun: 'milo',
      caseys_last_swing: 'rex', comet_bead: 'dorin',
    },
  };
  const ladderAll: Record<string, { wielder: string; band: string }> = {};
  for (const [band, rungs] of Object.entries(WEAPON_LADDER)) {
    for (const [id, wielder] of Object.entries(rungs)) ladderAll[id] = { wielder, band };
  }
  for (const [id, { wielder, band }] of Object.entries(ladderAll)) {
    const item = ITEMS[id];
    if (!item) { fail('catalog', `§A8 weapon '${id}' missing from ITEMS`); continue; }
    if (item.wielder !== wielder) fail('catalog', `§A8 weapon '${id}' belongs to '${wielder}', got '${item.wielder ?? 'nobody'}'`);
    if (item.band !== band) fail('catalog', `§A8 weapon '${id}' is band '${item.band ?? 'none'}', the ladder places it in '${band}'`);
  }
  for (const item of Object.values(ITEMS)) {
    if (item.kind === 'weapon' && !(item.id in ladderAll)) {
      fail('catalog', `weapon '${item.id}' is on no region's §A8 weapon ladder — extend WEAPON_LADDER, never ad-hoc`);
    }
  }

  // 2. THE PP LINE, per region (§A8 PP drinks — the Star Cola line, the teas,
  //    the temple incense). Both directions (generalises the ADR-016 pin).
  const PP_LINE: Record<string, string[]> = {
    ch1: ['star_cola', 'bug_juice', 'diet_star_cola'],
    ch2: ['mate_gourd', 'jungle_fizz'], // M18 (ADR-063) — mate (clockwise!) + jungle fizz
    ch3: ['builders_tea', 'earl_grey', 'school_cocoa'], // M19 (ADR-064) — TEA AS PP
    ch4: ['cloudberry_cordial', 'birch_sap', 'gjende_coffee'], // M19 — the moor's cold drinks
    ch5: ['acorn_cup_tea', 'nectar_thimble', 'dewdrop_cordial', 'mint_julep_drop'], // M19 — tiny vessels
    // M20 (ADR-065) — kola/zobo/baobab (ch6); chai/lassi/falooda (ch7); jade tea,
    // monks' broth, and the §A8 Temple Incense (ch8)
    ch6: ['kola_nut_drink', 'hibiscus_tea', 'baobab_juice'],
    ch7: ['masala_chai', 'mango_lassi', 'falooda'],
    ch8: ['jade_tea', 'monks_broth', 'temple_incense'],
    // M21 (ADR-091): the Stone Brow Monastery Tea (§A8) + the valley drinks (ch9);
    // the Aurora/Mauna Lani/Mars vending drinks (ch10, three locales)
    ch9: ['monastery_tea', 'linden_tea', 'socata'],
    ch10: ['aurora_cocoa', 'spruce_tip_tea', 'kona_coffee', 'coconut_water', 'mars_vending_cola', 'electrolyte_pouch'],
  };
  const ppAll = new Set(Object.values(PP_LINE).flat());
  for (const id of ppAll) {
    const item = ITEMS[id];
    if (!item) fail('catalog', `PP_LINE names '${id}', missing from ITEMS`);
    else if (!(item.kind === 'pp' && (item.ppHeal ?? 0) > 0)) fail('catalog', `'${id}' must be kind 'pp' with ppHeal > 0`);
  }
  for (const item of Object.values(ITEMS)) {
    if ((item.kind === 'pp' || item.ppHeal !== undefined) && !ppAll.has(item.id)) {
      fail('catalog', `'${item.id}' restores PP but sits on no region's PP_LINE — extend the manifest, never ad-hoc`);
    }
  }

  // 3. THE ARMOR LINE, per region (§A8 bodies/robes/vests). Both directions.
  const ARMOR_LINE: Record<string, string[]> = {
    // M18 (ADR-063): the §A8 hat ladder opens (Otterbrook Cap → Chullo) + Ch.2 bodies
    ch1: ['champion_jacket', 'otterbrook_cap'],
    ch2: ['wool_poncho', 'chullo', 'cushma', 'alpaca_vest'],
    // M19 (ADR-064): the Cricket Cap heads Ch.3's rung + the school/fog bodies
    ch3: ['cricket_cap', 'school_blazer', 'tweed_waistcoat', 'oilcloth_mac'],
    // M19: the Fur-Lined Hood (freeze-resist) heads Ch.4 + the fjord bodies
    ch4: ['fur_lined_hood', 'wool_sweater', 'oilskin_slicker', 'troll_hide_vest'],
    // M19: the Paper Crown heads Ch.5 + the jewel-box court bodies
    ch5: ['paper_crown', 'velvet_doublet', 'herald_tabard', 'ermine_cape'],
    // M20 (ADR-065): the Turban of Calm heads Ch.6 (it does nothing calming) + the
    // savanna bodies; the jeweled Pagri heads Ch.7 + the bazaar/palace bodies; the
    // Bamboo Hat heads Ch.8 + the jade/lacquer/saffron bodies
    ch6: ['turban_of_calm', 'kanga_wrap', 'savanna_cloak', 'mudcloth_vest'],
    ch7: ['jeweled_pagri', 'silk_kurta', 'embroidered_sherwani', 'nawab_coat'],
    ch8: ['bamboo_hat', 'silk_changshan', 'lacquer_robe', 'monks_robe'],
    // M21 (ADR-091): the căciulă heads Ch.9 + the velvet/harvest/monastery bodies;
    // Ch.10 spans three locales — the Aurora fur-hood + Insulated Suit (§A10 #19,
    // Alaska), the Lauhala Hat + fire-resist Heat-Shield Vest (Hawaii), the dearest
    // Pressure Suit + Oxygen Hood (Mars). The hat rung leads each region.
    ch9: ['caciula', 'monks_wrap', 'velvet_cloak', 'sheepskin_cojoc', 'embroidered_ie'],
    ch10: [
      'aurora_fur_hood', 'insulated_suit', 'sealskin_parka',
      'lauhala_hat', 'heat_shield_vest', 'aloha_shirt',
      'pressure_suit', 'oxygen_hood',
    ],
  };
  const armorAll = new Set(Object.values(ARMOR_LINE).flat());
  for (const id of armorAll) {
    const item = ITEMS[id];
    if (!item) fail('catalog', `ARMOR_LINE names '${id}', missing from ITEMS`);
    else if (!(item.kind === 'armor' && (item.defense ?? 0) > 0)) fail('catalog', `'${id}' must be kind 'armor' with defense > 0`);
  }
  for (const item of Object.values(ITEMS)) {
    if (item.kind === 'armor' && !armorAll.has(item.id)) {
      fail('catalog', `armor '${item.id}' is on no region's ARMOR_LINE — extend the manifest, never ad-hoc`);
    }
  }

  // 4. THE HERO-SIGNATURE SET REGISTRY (arms + charm sets), both directions.
  //    A wielder-tagged arms/charm piece MUST belong to a registered set; each
  //    set's pieces are the right kind, wielder, and unsellable (a title, not
  //    stock). Generalises the STARTING FIVE + SUNDAY SET pins so each future
  //    region set (the Porch, Mercado, Wintermoor… sets) registers ONE row.
  const SET_REGISTRY: Array<{ name: string; kind: 'arms' | 'charm'; pieces: Record<string, string> }> = [
    { name: 'THE STARTING FIVE', kind: 'arms', pieces: STARTING_FIVE },
    { name: 'THE SUNDAY SET', kind: 'charm', pieces: SUNDAY_SET },
    // M18 (ADR-063): the two AMERICAS hero-signature charm sets
    { name: 'THE PORCH SET', kind: 'charm', pieces: PORCH_SET },
    { name: 'THE MERCADO SET', kind: 'charm', pieces: MERCADO_SET },
  ];
  const armsSetIds = new Set<string>();
  const charmSetIds = new Set<string>();
  for (const set of SET_REGISTRY) {
    for (const [heroId, itemId] of Object.entries(set.pieces)) {
      (set.kind === 'arms' ? armsSetIds : charmSetIds).add(itemId);
      const item = ITEMS[itemId];
      if (!item) { fail('catalog', `${set.name} piece '${itemId}' missing from ITEMS`); continue; }
      if (item.kind !== set.kind) fail('catalog', `${set.name}: '${itemId}' must be kind '${set.kind}', got '${item.kind}'`);
      if (item.wielder !== heroId) fail('catalog', `${set.name}: '${itemId}' belongs to '${heroId}', got '${item.wielder ?? 'nobody'}'`);
      if (item.price !== 0) fail('catalog', `${set.name}: '${itemId}' is a title, not merchandise — price must be 0`);
      if (set.kind === 'charm' && !(item.luck && item.luck > 0)) fail('catalog', `${set.name}: '${itemId}' must carry luck (heroLuck reads the 'other' slot)`);
    }
  }
  for (const item of Object.values(ITEMS)) {
    if (item.kind === 'arms' && item.wielder !== undefined && !armsSetIds.has(item.id)) {
      fail('catalog', `'${item.id}' is a wielder-tagged arms piece outside any signature SET — register its set, never ad-hoc`);
    }
    if (item.kind === 'charm' && item.wielder !== undefined && !charmSetIds.has(item.id)) {
      fail('catalog', `'${item.id}' is a wielder-tagged charm outside any signature SET — register its set, never ad-hoc`);
    }
  }

  // 5. THE PER-CHAPTER QUOTA — a ratchet toward the §A8 ~40-items/region target
  //    as the catalog fills. BAND_FLOOR is the current hard minimum; RAISE it as
  //    each region lands (the "extend the manifest" rule). It fails only if a
  //    band drops BELOW its floor (items removed without lowering it) — so the
  //    spine passes at today's 41 items and tightens with every movement.
  const bandCounts: Record<string, number> = {};
  for (const b of BANDS) bandCounts[b] = 0;
  for (const item of Object.values(ITEMS)) if (item.band) bandCounts[item.band] += 1;
  const BAND_FLOOR: Record<string, number> = {
    // M18 (ADR-063) ratchets ch1 + ch2 to the Americas pour (≈40/region target);
    // M19 (ADR-064) ratchets ch3/4/5 to the Old-World; M20 (ADR-065) ratchets
    // ch6/7/8 to the Far-World pour (Africa / India / China, region by region)
    // M21 (ADR-091) — THE LAST-WORLD CATALOG ratchets ch9 (Romania) to its full
    // pour, ch10 (Alaska→Hawaii→Mars, a triple-locale double pour) to ~76, and the
    // rounded-out cross chains to 15 — landing the grand total near the §A8 ~500.
    ch1: 42, ch2: 42, ch3: 42, ch4: 41, ch5: 41, ch6: 41, ch7: 41, ch8: 41, ch9: 45, ch10: 76, cross: 15,
  };
  for (const b of BANDS) {
    if (bandCounts[b] < BAND_FLOOR[b]) {
      fail('catalog', `band '${b}' carries ${bandCounts[b]} items, below its floor ${BAND_FLOOR[b]} (target ≈ 40/region) — items removed without lowering the floor`);
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
    // Chapter 1 — S22 (ADR-111) THE SLOW BURN: §A7/§A6 HP pulled down so the
    // opener's pre-Vibe fights are a fair scrap at Jay's 1–2 basic. Amended in
    // GAME_BIBLE §A7/§A6 the same commit (the drift-log rule).
    cranky_mailbox: 12,
    runaway_lawnmower: 16,
    coily_cicada: 14,
    blazer_smiler: 26,
    pigeon_gang: 20,
    hill_slug_deluxe: 28,
    borden: 70, // S22 (ADR-118) — the Ch.1 set-piece cop fight (optional town beat)
    // ADR-119 — THE OTTERBROOK 20: the Ch.1 ecosystem fleshed to the §A7 canon
    // 20 (4 roamers · 3 Dept.-of-Smiles · 2 social/urban · 2 rare/high-value ·
    // 2 late-pressure). Slow-Burn HP band; rare types pay BIG cash (Fortune Arc).
    sprinkler_sentry: 18,
    recycling_raccoon: 16,
    skeeter_swarm: 14,
    unionized_gnome: 22,
    mandatory_memo: 16,
    motivational_poster: 20,
    quota_clock: 24,
    expired_meter: 18,
    showroom_mannequin: 20,
    good_investment: 26,
    rogue_icecream_truck: 30,
    tick_nymph: 28,
    the_suit: 32,
    titanic_tick: 200, // ADR-131: 100→200 absorbs Surge α's nuke buff (TTK stays ~5)
    // ADR-121 — THE HUSH SENTINEL: the first-night Mars set-piece you REPEL (scripted
    // endBattleMercy), not a money-axis boss. Full-power set-piece HP (it can't be
    // killed before the repel); NOT a CHAPTER_MANIFESTS boss, so it never hits the
    // boss-curve / monetary checks.
    hush_sentinel: 240,
    // Chapter 2 (S14) — §A7's South America six; banana_bunch is 22 EACH
    // (the union attacks 5×22, §A7's group notation)
    pickpocket_parrot: 70,
    gilded_beetle: 85,
    cursed_souvenir: 78,
    step_mask: 80,
    banana_bunch: 22,
    jungle_jitterbug: 80,
    // §A7 Ch.2 expansion — five adopted South-America battlers (6 → 11), on band
    brass_market_mimic: 86,
    bronze_mask_guardian: 88,
    cackling_mask: 76,
    confetti_cannon: 74,
    postage_stampede: 82,
    gilded_grin: 300,
    // Chapter 3 (ADR-095) — §A7 England: the seed six + the Enemy Flow Law mix
    // (4 road/field · 3 dungeon · 2 social · 2 rare · 2 late-pressure · 1 set-piece).
    // cricket_eleven is 16 EACH (the XI attacks as a group, §A7's notation).
    prefect_drone: 130,
    possessed_textbook: 115,
    fog_hound: 150,
    tea_poltergeist: 90,
    cricket_eleven: 16,
    greenhouse_creeper: 170,
    pillar_box: 120,
    brolly_bat: 95,
    moor_sheep: 140,
    soot_imp: 88,
    detention_desk: 155,
    schedule_bell: 110,
    foggy_locker: 165,
    tea_trolley: 130,
    telephone_box: 145,
    overdue_tome: 130,
    roman_sentry: 180,
    head_prefect: 175,
    boiler_golem: 190,
    the_invigilator: 200,
    // BOSS 3 (ADR-099) — promoted from the forge draft to a live §A7 enemy at the flip
    headmaster_mainframe: 750,
    // Chapter 4 (Norway) — §A7 the seed six + the Enemy Flow Law mix (4 road/field ·
    // 3 dungeon · 2 social · 2 rare · 2 late-pressure · 1 set-piece). SCALE is the gag.
    colossal_gnat: 205,
    knitting_needles: 305,
    thunder_snail: 370,
    dog_sized_berry: 285,
    hushed_gull: 335,
    junior_jotun: 405,
    moor_midge_cloud: 180,
    boulder_lichen: 380,
    frost_hare: 275,
    bog_cotton_wisp: 240,
    earwax_golem: 375,
    dream_leech: 250,
    snore_gust: 225,
    giant_house_cat: 355,
    lost_mitten: 275,
    amber_hoard_troll: 290,
    aurora_moth: 250,
    hushed_skua: 345,
    frost_jotun_elder: 440,
    bridge_berry: 450,
    // BOSS 4 — promoted from the forge draft to a live §A7 enemy at the Norway flip
    the_whisperwig: 1800,
    // Chapter 5 (Minimus) — §A7 the seed six (Tin Parade … Dust Bunny) + the Enemy
    // Flow Law mix (4 road/field · 3 Hedgerow specialists · 2 social · 2 rare · 2
    // late-pressure · 1 set-piece). On-curve (Ch.5 mid 193); tiny-but-procedural.
    tin_parade: 500,
    duelist_pip: 560,
    crumb_cannoneer: 640,
    powderwig_wasp: 570,
    windup_wyrmlet: 605,
    dust_bunny: 525,
    whistle_guard: 640,
    census_pigeon: 545,
    toll_clerk: 580,
    cobble_mite: 400,
    hedge_sprite: 685,
    topiary_knight: 910,
    bramble_tangle: 730,
    lapel_pin_mob: 425,
    town_crier: 640,
    snuffbox_beetle: 660,
    tax_assessor: 705,
    halberd_column: 955,
    bell_ringer_acolyte: 820,
    grand_parade: 1000,
    // BOSS 5 — promoted from the forge draft to a live §A7 enemy at the Minimus flip,
    // + the Flat Bell, its summoned 150-HP second target (bosses.ts scriptedSurvival)
    whiskerzilla: 4000,
    flat_bell: 150,
    // Chapter 6 (Africa) — §A7 the roster to TWENTY (4 art-matched anchors + the 16
    // adopted-orphan expansion) + BOSS 6. On-curve (band ch6, window 27-31, trash HP
    // 900-2200). Money > combat: the Sphinx's 9000 HP sits far under the Ch.6 Fortune
    // target ($1.2M).
    caravan_hyena_pack: 1375,
    baobab_root_snare: 2200,
    laughing_dust_pot: 900,
    sphinx_paw_shadow: 1175,
    // the §A7 expansion to twenty (adopted Africa battlers, on the Ch.6 band)
    hollow_jackal: 1050,
    dust_devil_charm: 980,
    salt_flat_lurker: 1500,
    thornbush_bomber: 1100,
    ribbon_serpent: 1020,
    canteen_mirage: 940,
    trade_salt_heap: 1620,
    mirage_vendor: 1180,
    griot_string_snare: 1240,
    town_gossip_troll: 1060,
    punchline_head: 1320,
    echoing_riddle: 1140,
    laughing_sphinx_riddle: 1700,
    rare_riddle_ring: 1300,
    sunbaked_idol: 1900,
    fastest_man_echo: 1450,
    laughing_sphinx: 9000,
    // Chapter 7 (India) — §A7 the art-matched roster (4 regulars work the Monsoon Road
    // + the night train) + BOSS 7. On-curve (band ch7, window 31-35; trash HP 240-600).
    // Money > combat: the Raja's 20000 HP sits far under the Ch.7 Fortune target ($8M).
    rickshaw_swarm: 3000,
    spice_djinn: 2000,
    temple_macaque: 2400,
    naga_sentry: 5000,
    cobra_raja: 20000,
    // Chapter 8 (China) — §A7 the art-matched roster (4 regulars work the Bamboo Road +
    // the Spore Forest) + BOSS 8. On-curve (band ch8, window 36-40; trash HP 5k-12k).
    // Money > combat: the Paper Dragon's 45000 HP sits far under the Ch.8 Fortune target ($60M).
    paper_lantern_wisp: 5500,
    spore_puffer: 6500,
    origami_warrior: 8000,
    porcelain_warlord: 11000,
    paper_dragon: 45000,
    // Chapter 9 (Romania) — §A7 the art-matched roster (4 fresh regulars + the ADOPTED
    // ribcage_rattler work Valea Stelelor, the Old Road, and Castle Hoaxula) + BOSS 9.
    // On-curve (band ch9, window 42-46; trash HP 11k-26k). Money > combat: Count Hoaxula's
    // 95000 HP sits far under the Ch.9 Fortune target ($400M).
    haystack_mimic: 12000,
    ribcage_rattler: 15000,
    moss_strigoi: 17000,
    animated_armor: 20000,
    wolf_of_the_old_road: 24000,
    count_hoaxula: 95000,
    // Chapter 10 (Alaska → Hawaii → Mars, THE LONG SHOT) — §A7 the finale roster: 6
    // regulars (2 frost / 2 magma / 2 Mars) work the gauntlet fields, the two §A6
    // elemental-golem MINIBOSSES gate the road (50k each, MINIBOSS_HP), and THE HUSH is
    // the bespoke 150k finale. On-curve (band ch10, window 50-52; trash HP 18k-27k).
    // Money > combat: every HP sits far under the Ch.10 Fortune target ($3B).
    frost_wisp: 18000,
    icehorn_caribou: 25000,
    cinder_imp: 19000,
    ash_crab: 26000,
    silent_drifter: 22000,
    static_wraith: 27000,
    frost_sentinel: 50000,
    tiki_magma_golem: 50000,
    the_hush: 150000,
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
  for (const bossId of ['titanic_tick', 'gilded_grin', 'headmaster_mainframe']) {
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
  // §A7 Ch.3 (ADR-099): the Tea Poltergeist's deferred mechanic is now LIVE — it MENDS
  // the enemy side (hospitality misfiled); the Possessed Textbook + Invigilator HUSH.
  if (!moveKind('tea_poltergeist', 'mend')) fail('canon', `tea_poltergeist needs its 'mend' move (§A7 Ch.3: heals the enemy side — ADR-099)`);
  if (!moveKind('possessed_textbook', 'status') || !ENEMIES.possessed_textbook?.moves.some((m) => m.status === 'hushed')) {
    fail('canon', `possessed_textbook needs a Hushed move (§A7 Ch.3)`);
  }
  if (!ENEMIES.jungle_jitterbug?.moves.some((m) => m.status === 'paralyzed')) {
    fail('canon', `jungle_jitterbug needs a Paralyze move (§A7)`);
  }
  if (!ENEMIES.cursed_souvenir?.moves.some((m) => m.status === 'crying')) {
    fail('canon', `cursed_souvenir needs a Crying move (§A7)`);
  }
}

// ── ADR-134 — ELEMENTAL IDENTITY (the "colour" of every foe). Three gates, all
//    both-directions where it matters, so combat stays a READ (the right element),
//    never a spam (the biggest number):
//      A. every enemy sits in exactly one chapter roster (drift-log discipline);
//      B. the DIFFER rule — a foe's resist/absorb never overlaps its own weakness
//         (a colour you both fear and shrug off is not a read);
//      C. the SPREAD rule — no single castable element (fire/freeze/volt/holy) is
//         the weakness of >60% of a chapter's NON-boss roster, so Mia must rotate.
{
  // The §A7 chapter rosters, lifted from the canon{} block above. Kept explicit
  // (like canon{}) so the both-directions check keeps them honest: add an enemy →
  // add it here, or the gate fails. Bosses/set-pieces are tagged for the SPREAD
  // denominator (their weaknesses are bespoke, not part of the grind rotation).
  const CHAPTER_ROSTER: Record<number, string[]> = {
    1: ['cranky_mailbox','runaway_lawnmower','coily_cicada','blazer_smiler','pigeon_gang','hill_slug_deluxe','borden','sprinkler_sentry','recycling_raccoon','skeeter_swarm','unionized_gnome','mandatory_memo','motivational_poster','quota_clock','expired_meter','showroom_mannequin','good_investment','rogue_icecream_truck','tick_nymph','the_suit','titanic_tick','hush_sentinel'],
    2: ['pickpocket_parrot','gilded_beetle','cursed_souvenir','step_mask','banana_bunch','jungle_jitterbug','brass_market_mimic','bronze_mask_guardian','cackling_mask','confetti_cannon','postage_stampede','gilded_grin'],
    3: ['prefect_drone','possessed_textbook','fog_hound','tea_poltergeist','cricket_eleven','greenhouse_creeper','pillar_box','brolly_bat','moor_sheep','soot_imp','detention_desk','schedule_bell','foggy_locker','tea_trolley','telephone_box','overdue_tome','roman_sentry','head_prefect','boiler_golem','the_invigilator','headmaster_mainframe'],
    4: ['colossal_gnat','knitting_needles','thunder_snail','dog_sized_berry','hushed_gull','junior_jotun','moor_midge_cloud','boulder_lichen','frost_hare','bog_cotton_wisp','earwax_golem','dream_leech','snore_gust','giant_house_cat','lost_mitten','amber_hoard_troll','aurora_moth','hushed_skua','frost_jotun_elder','bridge_berry','the_whisperwig'],
    5: ['tin_parade','duelist_pip','crumb_cannoneer','powderwig_wasp','windup_wyrmlet','dust_bunny','whistle_guard','census_pigeon','toll_clerk','cobble_mite','hedge_sprite','topiary_knight','bramble_tangle','lapel_pin_mob','town_crier','snuffbox_beetle','tax_assessor','halberd_column','bell_ringer_acolyte','grand_parade','whiskerzilla','flat_bell'],
    6: ['caravan_hyena_pack','baobab_root_snare','laughing_dust_pot','sphinx_paw_shadow','hollow_jackal','dust_devil_charm','salt_flat_lurker','thornbush_bomber','ribbon_serpent','canteen_mirage','trade_salt_heap','mirage_vendor','griot_string_snare','town_gossip_troll','punchline_head','echoing_riddle','laughing_sphinx_riddle','rare_riddle_ring','sunbaked_idol','fastest_man_echo','laughing_sphinx'],
    7: ['rickshaw_swarm','spice_djinn','temple_macaque','naga_sentry','cobra_raja'],
    8: ['paper_lantern_wisp','spore_puffer','origami_warrior','porcelain_warlord','paper_dragon'],
    9: ['haystack_mimic','ribcage_rattler','moss_strigoi','animated_armor','wolf_of_the_old_road','count_hoaxula'],
    10: ['frost_wisp','icehorn_caribou','cinder_imp','ash_crab','silent_drifter','static_wraith','frost_sentinel','tiki_magma_golem','the_hush'],
  };
  const CASTABLE = ['fire', 'freeze', 'volt', 'holy'] as const;

  // A — both directions: every roster id is a real enemy; every enemy is rostered once.
  const seen = new Set<string>();
  for (const [ch, roster] of Object.entries(CHAPTER_ROSTER)) {
    for (const id of roster) {
      if (!ENEMIES[id]) fail('color', `Ch.${ch} roster names '${id}', which is not a real enemy`);
      if (seen.has(id)) fail('color', `'${id}' appears in more than one chapter roster`);
      seen.add(id);
    }
  }
  for (const id of Object.keys(ENEMIES)) {
    if (!seen.has(id)) fail('color', `'${id}' is in no chapter roster — extend CHAPTER_ROSTER (ADR-134), never ad-hoc`);
  }

  // B — the DIFFER rule: resist/absorb must not overlap the foe's own weakness
  //     (and absorb, which supersedes, must not double up with a resist).
  for (const e of Object.values(ENEMIES)) {
    const w = new Set(e.weakness);
    for (const r of e.resists ?? []) if (w.has(r)) fail('color', `'${e.id}' both fears AND resists '${r}' — pick one (ADR-134 differ rule)`);
    for (const a of e.absorbs ?? []) {
      if (w.has(a)) fail('color', `'${e.id}' both fears AND absorbs '${a}' — an absorb heals, it can't also be a weakness`);
      if ((e.resists ?? []).includes(a)) fail('color', `'${e.id}' both resists AND absorbs '${a}' — absorb already supersedes`);
    }
  }

  // C — the SPREAD rule: no castable element answers >60% of a chapter's NON-boss
  //     roster (so the player rotates Mia's elements chapter-to-chapter, not spams one).
  for (const [ch, roster] of Object.entries(CHAPTER_ROSTER)) {
    const grind = roster.filter((id) => ENEMIES[id] && ENEMIES[id].boss !== true);
    if (grind.length === 0) continue;
    for (const el of CASTABLE) {
      const cnt = grind.filter((id) => ENEMIES[id].weakness.includes(el)).length;
      const pct = cnt / grind.length;
      if (pct > 0.6) {
        fail('color', `Ch.${ch}: '${el}' is the weakness of ${cnt}/${grind.length} (${(pct * 100).toFixed(0)}%) of the roster — >60%, one element trivialises the chapter (ADR-134)`);
      }
    }
  }
}

/* ===================== S18 M24 — THE GREAT VERIFICATION (ADR-094) =====================
 * The cross-checks the existing gates DON'T make: the four deferred debts pinned
 * both directions (loot / reusable / resist / the boss curve), plus the §A4
 * economy and §A9 boss-curve sanity that prove the game is consistent + fair. */

// ── Debt #4: EnemyDef.drops both directions — every drop names a REAL §A8 item,
//    its chance is sane (schema pins 0<c≤1; re-read for the message), and it is
//    ECONOMY-NEUTRAL (a drop's expected gross value never dwarfs the kill's cash,
//    so loot can't break the §A9 economy). §A7: a drop has identity, not loot.
{
  let dropCount = 0;
  for (const e of Object.values(ENEMIES)) {
    if (!e.drops) continue;
    for (const d of e.drops) {
      dropCount++;
      const item = ITEMS[d.item];
      if (!item) {
        fail('drops', `enemy '${e.id}' drops '${d.item}', which is not a real §A8 item`);
        continue;
      }
      if (!(d.chance > 0 && d.chance <= 1)) {
        fail('drops', `enemy '${e.id}' drop '${d.item}' has chance ${d.chance} — must be 0<chance≤1`);
      }
      if (item.kind === 'key' && e.boss !== true) {
        fail('drops', `enemy '${e.id}' drops key item '${d.item}' — only bosses/set-pieces drop key items (§A7)`);
      }
      // economy-neutral: expected gross value ≤ the kill's cash + a small floor
      const expected = item.price * d.chance;
      if (expected > e.cash + 20) {
        fail('drops', `enemy '${e.id}' drop '${d.item}' expects $${expected.toFixed(0)} value vs $${e.cash} cash — not economy-neutral (lower the chance/value, §A9)`);
      }
    }
  }
  if (dropCount === 0) fail('drops', `no enemy carries a §A7 drop — M24 seeds the landed Ch.1–2 roster`);
}

// ── Debt #2: `reusable` rides a CURE or BATTLE item only (a reusable food/weapon
//    is a category error), and the reusable REVIVE (Milo's Defibrillator) lists
//    'down' so it actually revives. consumesOnUse() reads `reusable` everywhere.
{
  for (const it of Object.values(ITEMS)) {
    if (it.reusable === true && it.kind !== 'cure' && it.kind !== 'battle') {
      fail('reusable', `'${it.id}' is reusable but kind '${it.kind}' — reusable rides cures + battle items (§A4.12/§A10)`);
    }
  }
  const defib = ITEMS.defibrillator;
  if (!defib) fail('reusable', `the §A4.12 reusable revive (Defibrillator) is missing from the catalog`);
  else {
    if (defib.reusable !== true) fail('reusable', `the Defibrillator must be reusable (§A4.12)`);
    if (!defib.cures?.includes('down')) fail('reusable', `the Defibrillator must cure 'down' (it's a revive, §A4.12)`);
    if (!defib.heal || defib.heal <= 0) fail('reusable', `the Defibrillator must heal a positive amount on revive`);
  }
  const scroll = ITEMS.scroll_of_calm;
  if (scroll && scroll.reusable !== true) fail('reusable', `the Scroll of Calm must stay reusable (§A10 #17)`);
}

// ── Debt #1: every elemental ENEMY move throws one of the four RESISTABLE
//    elements (fire/freeze/volt/holy) so a §A8 pendant can answer it, and each
//    of the four is covered by ≥1 piece of gear (the resist set is whole).
{
  const RESISTABLE = new Set(['fire', 'freeze', 'volt', 'holy']);
  const geared = new Set<string>();
  for (const it of Object.values(ITEMS)) for (const r of it.resists ?? []) geared.add(r.element);
  for (const el of RESISTABLE) {
    if (!geared.has(el)) fail('resist', `no §A8 gear resists '${el}' — the four-element resist set is incomplete`);
  }
  let elementalMoves = 0;
  for (const e of Object.values(ENEMIES)) {
    for (const m of e.moves) {
      if (m.element && m.element !== 'physical' && m.element !== 'none') {
        elementalMoves++;
        if (!RESISTABLE.has(m.element)) {
          fail('resist', `enemy '${e.id}' move '${m.name}' throws '${m.element}', which no pendant can resist`);
        } else if (!geared.has(m.element)) {
          fail('resist', `enemy '${e.id}' throws '${m.element}' but no gear resists it — bind a pendant first (Debt #1)`);
        }
      }
    }
  }
  if (elementalMoves === 0) fail('resist', `no landed enemy throws an element — M24 adds one so heroResist has something to halve`);
}

// ── the §A4 economy fires: every revival item actually heals, every cure lists
//    only recognised statuses (a typo'd cure would silently do nothing).
{
  const CURABLE = new Set(['sunburn', 'crying', 'asleep', 'paralyzed', 'homesick', 'hushed', 'mushroomize', 'down']);
  for (const it of Object.values(ITEMS)) {
    if (it.kind !== 'cure' || !it.cures) continue;
    for (const c of it.cures) {
      if (!CURABLE.has(c)) fail('verify', `cure '${it.id}' lists unknown status '${c}' — it would cure nothing (§A4.8)`);
    }
    if (it.cures.includes('down') && (!it.heal || it.heal <= 0)) {
      fail('verify', `revive '${it.id}' lists 'down' but has no heal — it would revive at 0 HP (§A4.12)`);
    }
  }
}

// ── §A9 boss curve sanity: HP + target level climb together, the landed bosses'
//    manifest HP matches their live ENEMIES row, and every boss falls in a FAIR
//    number of turns at its §A6 level (verify.ts TTK — a conservative read).
{
  const checks = allBossChecks();
  let prevHp = 0;
  let prevLevel = 0;
  for (const b of checks) {
    if (b.hp <= prevHp) fail('verify', `boss curve: Ch.${b.chapter} '${b.name}' HP ${b.hp} ≤ the prior boss's ${prevHp} (the §A6 ladder must climb)`);
    if (b.level < prevLevel) fail('verify', `boss curve: Ch.${b.chapter} target level ${b.level} < the prior ${prevLevel}`);
    prevHp = b.hp;
    prevLevel = b.level;
    // landed bosses: the manifest HP is the live enemy HP (one source of truth)
    const live = ENEMIES[b.bossId];
    if (live && live.hp !== b.hp) fail('verify', `boss '${b.bossId}' manifest HP ${b.hp} ≠ live ENEMIES HP ${live.hp}`);
    // a fair EB boss falls in a sane window for a party at its level (conservative
    // floor: base stats, no weapons — so the real geared fight is at least this fast)
    if (b.ttk < 2 || b.ttk > 25) {
      fail('verify', `boss '${b.bossId}' TTK ${b.ttk} at Lv${b.level} is out of the fair 2–25 window (tune §A9 DATA, not code)`);
    }
    // ── ADR-122/ADR-120 — THE MONETARY VISION: combat numbers stay an axis BELOW
    //    money. The single biggest combat number of a chapter (its boss HP) must
    //    sit under that chapter's Fortune-Arc net-worth target, so the big numbers
    //    a player chases are always DOLLARS (Ch1 ~$1K → Ch10 $3B), never damage.
    //    This guards the whole game going forward: any future boss/chapter that
    //    out-scales the money axis fails here.
    const money = fortuneTarget(b.chapter);
    if (b.hp >= money) {
      fail('verify', `monetary vision: Ch.${b.chapter} boss '${b.name}' HP ${b.hp} ≥ the Fortune-Arc target $${money.toLocaleString('en-US')} — combat must stay BELOW the money axis (ADR-120: money is the bigger number)`);
    }
  }
}

// ── shop shelves are affordable on the §A9 Fortune Arc at the shop's chapter:
//    every stock id is a real item, and no shelf price exceeds the chapter's
//    net-worth target (you're never priced out of a shelf you've reached).
{
  for (const shop of Object.values(SHOPS)) {
    const chapters = shop.stock
      .map((id) => ITEMS[id]?.band)
      .filter((b): b is NonNullable<typeof b> => b !== undefined)
      .map((b) => Number(/^ch(\d+)$/.exec(b)?.[1] ?? 1));
    const shopChapter = chapters.length ? Math.min(...chapters) : 1;
    const cap = fortuneTarget(shopChapter);
    for (const id of shop.stock) {
      const item = ITEMS[id];
      if (!item) {
        fail('verify', `shop '${shop.id}' stocks '${id}', which is not a real §A8 item`);
        continue;
      }
      if (item.price > cap) {
        fail('verify', `shop '${shop.id}' stocks '${id}' at ${item.price} > the Ch.${shopChapter} Fortune-Arc target ${cap} — unaffordable shelf (§A9)`);
      }
    }
  }
}

// ── verify.ts's AWAKENING_LEVEL stays honest both directions: every ADR-035
//    awakening has an earned-by level (sane 1..60), and no orphan level rows.
{
  for (const a of Object.values(AWAKENINGS)) {
    const lv = AWAKENING_LEVEL[a.id];
    if (lv === undefined) fail('verify', `awakening '${a.id}' has no AWAKENING_LEVEL (verify.ts) — the TTK read can't place it`);
    else if (lv < 1 || lv > 60) fail('verify', `awakening '${a.id}' earned-by level ${lv} is out of range 1..60`);
  }
  for (const id of Object.keys(AWAKENING_LEVEL)) {
    if (!AWAKENINGS[id]) fail('verify', `AWAKENING_LEVEL names '${id}', which is not a real awakening — retire the row`);
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
  // M18 (ADR-063): the Americas pour stocks the new priced consumables / gear
  // into the right counters (valuables, key items, and the price-0 SET charms
  // are loot/quest goods, never shelf stock).
  const canon: Record<string, string[]> = {
    drugstore: [
      'tball_bat', 'corn_dog', 'pbj', 'salt_shaker', 'sugar_bag',
      'grilled_cheese', 'apple_pie_slice', 'bug_juice', 'moms_voice_tape',
      'second_wind', 'bug_zapper', 'otterbrook_cap',
    ],
    starmart: [
      'tball_bat', 'hand_me_down_pan', 'star_cola', 'corn_dog', 'pbj', 'salt_shaker', 'lemon_crate', 'basket_basic',
      'diet_star_cola', 'choco_comet_bar', 'foam_finger', 'wiffle_bat', 'nonstick_pan', 'sudden_guts_pill',
    ],
    mercado: [
      'sandlot_slugger', 'alfajor', 'star_cola', 'salt_shaker', 'hanky', 'aloe_leaf', 'basket_basic', 'tin_sun_pendant',
      'empanada', 'ceviche', 'mango', 'arepa', 'chicha_morada', 'mate_gourd', 'jungle_fizz', 'unknot_drops',
      'chullo', 'woven_wristlet',
    ],
    valle_shop: [
      'copper_pan', 'alfajor', 'corn_dog', 'star_cola', 'aloe_leaf', 'hanky', 'basket_basic',
      'choripan', 'tres_leches', 'humita', 'guardian_angel_feather', 'speed_demon_soda',
      'cushma', 'alpaca_vest', 'climbing_gloves',
    ],
  };
  const have = Object.keys(SHOPS);
  // ADR-095: shops grow per chapter (Ch.3 adds Foggybottom's chemist). The Ch.1–2
  // four are still stock-pinned by the `canon` loop below; new chapters extend this
  // allowlist, never ad-hoc (the ADR-017 manifest rule applied to shops).
  const KNOWN_SHOPS = new Set(['drugstore', 'starmart', 'mercado', 'valle_shop', 'foggybottom_chemist', 'wintermoor_tuck', 'kvisthavn_supply', 'lilleby_warehouse', 'minimus_provisioner', 'zanzibel_bazaar', 'chandrapore_bazaar', 'lotus_harbor_market', 'valea_provisioner', 'aurora_provisioner', 'mauna_vendor']);
  for (const id of have) {
    if (!KNOWN_SHOPS.has(id)) fail('canon', `shop '${id}' is not in the §A8 shop manifest — add it with its chapter, never ad-hoc`);
  }
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

// S4's lone-star_cola 'pp' pin (ADR-016) is GENERALISED into the per-region
// PP_LINE in THE CATALOG SPINE above (S17/ADR-061) — both directions there.

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
    // S15i Task 3 (ADR-058) — Movement 4: Ch.1's 5th (the Long Walk route quest) +
    // a Ch.2 dock-district quest. Pinned both directions like the rest.
    walkers_register: {
      name: "The Walkers' Register",
      chapter: 1,
      giver: 'road_traveler',
      startFlag: 'q_walkreg',
      objectiveFlags: ['q_walkreg_mile', 'q_walkreg_woods', 'q_walkreg_far', 'q_walkreg_signed'],
      rewardItem: 'walkers_charm',
      doneFlag: 'q_walkreg_done',
      caller: { name: 'Old Pell', kind: 'damage', power: 430 },
    },
    the_quiet_crate: {
      name: 'The Quiet Crate',
      chapter: 2,
      giver: 'ps_tally',
      startFlag: 'q_crate',
      objectiveFlags: ['q_crate_crane', 'q_crate_board', 'q_crate_market', 'q_crate_told'],
      rewardItem: 'captains_button',
      doneFlag: 'q_crate_done',
      caller: { name: 'The Tallyman', kind: 'heal', power: 380 },
    },
    // ── CHAPTER 3 (ADR-099) — §A10 #7 Overdue, #8 The Groundskeeper's Cuppa, + the
    //    three Flow-Law regional slots. Two are caller+flag (no rewardItem, the
    //    Paperboy precedent ADR-073). Rewards reuse the live §A8 ch3 catalog. ──
    overdue: {
      name: 'Overdue',
      chapter: 3,
      giver: 'wm_librarian',
      startFlag: 'q_overdue',
      objectiveFlags: ['q_overdue_b1', 'q_overdue_b2', 'q_overdue_b3', 'q_overdue_reported'],
      rewardItem: 'library_card',
      doneFlag: 'q_overdue_done',
      caller: { name: 'The Librarian', kind: 'heal', power: 400 },
    },
    groundskeepers_cuppa: {
      name: "The Groundskeeper's Cuppa",
      chapter: 3,
      giver: 'wm_groundskeeper',
      startFlag: 'q_cuppa',
      objectiveFlags: ['q_cuppa_leaves', 'q_cuppa_milk', 'q_cuppa_water', 'q_cuppa_brewed'],
      rewardItem: 'thermos',
      doneFlag: 'q_cuppa_done',
      caller: { name: 'The Groundskeeper', kind: 'heal', power: 410 },
    },
    return_to_sender: {
      name: 'Return to Sender',
      chapter: 3,
      giver: 'fb_postmistress',
      startFlag: 'q_sender',
      objectiveFlags: ['q_sender_l1', 'q_sender_l2', 'q_sender_l3', 'q_sender_reported'],
      rewardItem: 'commemorative_tin',
      doneFlag: 'q_sender_done',
      caller: { name: 'The Postmistress', kind: 'damage', power: 440 },
    },
    penny_fog: {
      name: 'The Penny Fog',
      chapter: 3,
      giver: 'fb_boy',
      startFlag: 'q_penny',
      objectiveFlags: ['q_penny_found', 'q_penny_reported'],
      rewardItem: undefined,
      doneFlag: 'q_penny_done',
      caller: { name: 'The Penny-Fog Boy', kind: 'damage', power: 420 },
    },
    the_last_over: {
      name: 'The Last Over',
      chapter: 3,
      giver: 'cricket_captain',
      startFlag: 'q_over',
      objectiveFlags: ['q_over_umpire', 'q_over_clock', 'q_over_called'],
      rewardItem: undefined,
      doneFlag: 'q_over_done',
      caller: { name: 'The Cricket Captain', kind: 'damage', power: 450 },
    },
    // ── CHAPTER 4 (Norway) — §A10 route quest (Sigrid's Spectacles, bible #9) +
    //    a delivery, a NOISE-themed restoration, and a scale-comedy picnic. Rewards
    //    reuse the live §A8 ch4 catalog; pinned both directions like the rest. ──
    sigrids_spectacles: {
      name: "Sigrid's Spectacles",
      chapter: 4,
      giver: 'kv_sigrid',
      startFlag: 'q_sigrid',
      objectiveFlags: ['q_sigrid_lens1', 'q_sigrid_lens2', 'q_sigrid_reported'],
      rewardItem: 'sigrids_monocle',
      doneFlag: 'q_sigrid_done',
      caller: { name: 'Sigrid', kind: 'heal', power: 430 },
    },
    unsent_letter: {
      name: 'The Unsent Letter',
      chapter: 4,
      giver: 'kv_halvor',
      startFlag: 'q_letter',
      objectiveFlags: ['q_letter_taken', 'q_letter_delivered', 'q_letter_reported'],
      rewardItem: 'cool_charm',
      doneFlag: 'q_letter_done',
      caller: { name: 'Halvor', kind: 'heal', power: 420 },
    },
    the_silenced_bell: {
      name: 'The Silenced Bell',
      chapter: 4,
      giver: 'kv_bellkeeper',
      startFlag: 'q_bell',
      objectiveFlags: ['q_bell_clapper', 'q_bell_rung', 'q_bell_reported'],
      rewardItem: 'brass_ships_bell',
      doneFlag: 'q_bell_done',
      caller: { name: 'The Bellkeeper', kind: 'damage', power: 435 },
    },
    the_giants_picnic: {
      name: "The Giant's Picnic",
      chapter: 4,
      giver: 'll_mayor',
      startFlag: 'q_picnic',
      objectiveFlags: ['q_picnic_brunost', 'q_picnic_berry', 'q_picnic_set'],
      rewardItem: 'troll_cross',
      doneFlag: 'q_picnic_done',
      caller: { name: 'The Mayor of Lilleby', kind: 'heal', power: 425 },
    },
    // ── CHAPTER 5 (Minimus) — §A10 #11 The Royal Census + #12 Civic Repairs + three
    //    Flow-Law regionals (Lost & Found across scale, the Silent Belfry behind
    //    Heartlight 5, the minister's macro-lens portrait). The belfry is caller-only
    //    (the Penny-Fog precedent). Rewards reuse the live §A8 ch5 catalog. ──
    royal_census: {
      name: 'The Royal Census',
      chapter: 5,
      giver: 'mn_census',
      startFlag: 'q_census',
      objectiveFlags: ['q_census_market', 'q_census_stamps', 'q_census_reported'],
      rewardItem: 'census_quill_charm',
      doneFlag: 'q_census_done',
      caller: { name: 'The Census-Taker', kind: 'heal', power: 440 },
    },
    civic_repairs: {
      name: 'Civic Repairs',
      chapter: 5,
      giver: 'mn_engineer',
      startFlag: 'q_repairs',
      objectiveFlags: ['q_repairs_bridge', 'q_repairs_well', 'q_repairs_scaffold'],
      rewardItem: 'signet_bracer',
      doneFlag: 'q_repairs_done',
      caller: { name: 'The Duchy Engineer', kind: 'damage', power: 450 },
    },
    lost_and_found: {
      name: 'The Lost & Found of Impossible Sizes',
      chapter: 5,
      giver: 'mn_lostfound',
      startFlag: 'q_lostfound',
      objectiveFlags: ['q_lostfound_button', 'q_lostfound_spoon', 'q_lostfound_filed'],
      rewardItem: 'gilt_thimble_collection',
      doneFlag: 'q_lostfound_done',
      caller: { name: 'The Lost & Found Clerk', kind: 'damage', power: 430 },
    },
    the_silent_belfry: {
      name: 'The Silent Belfry',
      chapter: 5,
      giver: 'mn_bellkeeper',
      startFlag: 'q_belfry',
      objectiveFlags: ['q_belfry_clappers', 'q_belfry_rung'],
      rewardItem: undefined,
      doneFlag: 'q_belfry_done',
      caller: { name: 'The Belfry Keeper', kind: 'heal', power: 455 },
    },
    say_cheese_minister: {
      name: 'Say Cheese, Minister',
      chapter: 5,
      giver: 'pw_click',
      startFlag: 'q_cheese',
      objectiveFlags: ['q_cheese_pose', 'q_cheese_developed'],
      rewardItem: 'lens_charm',
      doneFlag: 'q_cheese_done',
      caller: { name: 'Mr. Click', kind: 'damage', power: 425 },
    },
    // ── CHAPTER 6 (Africa) — §A10 the two named core quests (the watering-hole convoy
    //    + the stones that speak), each banking a finale CALLER. Givers placed in
    //    zanzibel. Rewards reuse the live §A8 ch6 catalog. ──
    watering_hole_convoy: {
      name: 'The Watering-Hole Convoy',
      chapter: 6,
      giver: 'zn_dockmaster',
      startFlag: 'q_convoy',
      objectiveFlags: ['q_convoy_reach', 'q_convoy_escort'],
      rewardItem: 'savanna_cloak',
      doneFlag: 'q_convoy_done',
      caller: { name: 'The Dockmaster', kind: 'heal', power: 460 },
    },
    stones_that_speak: {
      name: 'The Stones That Speak',
      chapter: 6,
      giver: 'zn_guide',
      startFlag: 'q_stones',
      objectiveFlags: ['q_stones_listen', 'q_stones_carry'],
      rewardItem: 'griot_string',
      doneFlag: 'q_stones_done',
      caller: { name: 'The Ruins Guide', kind: 'damage', power: 455 },
    },
    // ── CHAPTER 7 (India) — §A10 the two named core quests (Seven Spices + the Monkey
    //    Who Stole Tuesday), each banking a finale CALLER. Givers placed in chandrapore.
    //    Rewards are the pre-built §A8 ch7 items (the Spice Box + the Monkey Paw Charm). ──
    seven_spices: {
      name: 'Seven Spices',
      chapter: 7,
      giver: 'cp_spice_merchant',
      startFlag: 'q_spices',
      objectiveFlags: ['q_spices_gather', 'q_spices_return'],
      rewardItem: 'spice_box',
      doneFlag: 'q_spices_done',
      caller: { name: 'The Spice Merchant', kind: 'heal', power: 700 },
    },
    monkey_who_stole_tuesday: {
      name: 'The Monkey Who Stole Tuesday',
      chapter: 7,
      giver: 'cp_dabbawala',
      startFlag: 'q_monkey',
      objectiveFlags: ['q_monkey_chase', 'q_monkey_corner'],
      rewardItem: 'monkey_paw_charm',
      doneFlag: 'q_monkey_done',
      caller: { name: 'The Monkey Magnate', kind: 'damage', power: 690 },
    },
    // ── CHAPTER 8 (China) — §A10 the named core quest (Brushes of Mt. Shu), banking a
    //    finale CALLER. Giver placed in lotus_harbor. Reward the reusable Scroll of Calm. ──
    brushes_of_mt_shu: {
      name: 'Brushes of Mt. Shu',
      chapter: 8,
      giver: 'lh_calligrapher',
      startFlag: 'q_brushes',
      objectiveFlags: ['q_brushes_gather', 'q_brushes_return'],
      rewardItem: 'scroll_of_calm',
      doneFlag: 'q_brushes_done',
      caller: { name: 'The Calligrapher', kind: 'heal', power: 1400 },
    },
    // ── CHAPTER 9 (Romania) — §A10 the named core quest (Buni's Table), banking the
    //    warmest finale CALLER (the bible's base ally). Giver placed in valea_stelelor.
    //    Reward the Feast Basket recipe (basket_feast). ──
    bunis_table: {
      name: "Buni's Table",
      chapter: 9,
      giver: 'vs_buni',
      startFlag: 'q_bunis',
      objectiveFlags: ['q_bunis_gather', 'q_bunis_cook'],
      rewardItem: 'basket_feast',
      doneFlag: 'q_bunis_done',
      caller: { name: 'Buni', kind: 'heal', power: 1900 },
    },
    // ── CHAPTER 10 (Alaska → Hawaii → Mars) — §A10 the two map-light finale data quests
    //    that bank the §A6 CALLING ledger: Lights of Aurora (the Station Keeper, Alaska)
    //    and The Last Wave (Pemberton, Hawaii). Givers as_keeper / ml_pemberton land with
    //    the Ch.10 maps; rewards reuse the live §A8 ch10 catalog (aurora_cocoa / rocket_manifest). ──
    lights_of_aurora: {
      name: 'Lights of Aurora',
      chapter: 10,
      giver: 'as_keeper',
      startFlag: 'q_aurora',
      objectiveFlags: ['q_aurora_gather', 'q_aurora_relit'],
      rewardItem: 'aurora_cocoa',
      doneFlag: 'q_aurora_done',
      caller: { name: 'The Station Keeper', kind: 'heal', power: 2000 },
    },
    the_last_wave: {
      name: 'The Last Wave',
      chapter: 10,
      giver: 'ml_pemberton',
      startFlag: 'q_last_wave',
      objectiveFlags: ['q_last_wave_gather', 'q_last_wave_fit'],
      rewardItem: 'rocket_manifest',
      doneFlag: 'q_last_wave_done',
      caller: { name: 'Pemberton', kind: 'damage', power: 2200 },
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
    if (!(id in canon)) fail('canon', `'${id}' is not in the §A10 manifest — extend the manifest with its §A10 row, never ad-hoc`);
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
  // the flat 'armor' line reverse-pin is GENERALISED into the per-region
  // ARMOR_LINE in THE CATALOG SPINE above (S17/ADR-061); these stay as the
  // §A10 quest-reward pins (the jacket above, the poncho here).
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
    // S18 M27 (ADR-068) — Ch.3 THE FIRST BORROW: the control system unlocks on
    // Milo's join. mindwarp_a re-staged off rex's L21 row to this awakening (one
    // power, battle Mind Warp + field Puppet; the trust thread opens here).
    the_first_borrow: { hero: 'rex', ability: 'mindwarp_a', flag: 'awake_mindwarp_a', dialogue: 'awake_the_first_borrow' },
    // Ch.4 ("The Fjord That Sleeps") — THE THUNDER-SNORE: Mia awakens Vibe Volt α
    // the first time the Whisperwig is dragged out of the Sleeper's ear (vibe_volt_a
    // left her L20 unlock row in the same commit; one-path rule).
    the_thunder_snore: { hero: 'faye', ability: 'vibe_volt_a', flag: 'awake_volt_a', dialogue: 'awake_the_thunder_snore' },
    // S16 ("The Old Light, Doubled") — Jay's three iconic late beats. Reserved
    // as awakenings (the 80/20 split): true MIND WARP, the party REFLECT, and
    // the Surge Σ capstone. Each lands mid-to-late, where the §A6 arc has room
    // (the Resonance Site / a boss's unblockable AoE / the Mars approach).
    the_borrowed_voice: { hero: 'rex', ability: 'mindwarp_o', flag: 'awake_mindwarp_o', dialogue: 'awake_the_borrowed_voice' },
    the_wall_that_answers: { hero: 'rex', ability: 'powershield_s', flag: 'awake_powershield_s', dialogue: 'awake_the_wall_that_answers' },
    the_whole_sky: { hero: 'rex', ability: 'vibe_surge_x', flag: 'awake_surge_x', dialogue: 'awake_the_whole_sky' },
    // Ch.9 ("The Monk's Full Path") — Dorin's single awakening. The Trial that
    // gates his joining hands him the full Vibe Comet (Ω moved off his L52 row).
    trial_of_the_mute_mountain: { hero: 'dorin', ability: 'vibe_comet_o', flag: 'awake_comet_o', dialogue: 'awake_trial_of_the_mute_mountain' },
    // "Ability Expansion" — Mia's three iconic late beats (her Starsong opener,
    // Fire Σ, Magnet Σ). Reserved as awakenings; the rest of her ~30 spells are
    // level unlocks (one-path rule — none of these three sits in faye.unlocks).
    the_first_heartlight: { hero: 'faye', ability: 'starsong_a', flag: 'awake_starsong_a', dialogue: 'awake_the_first_heartlight' },
    the_match_that_stays_lit: { hero: 'faye', ability: 'vibe_fire_x', flag: 'awake_fire_x', dialogue: 'awake_the_match_that_stays_lit' },
    she_hears_it_all: { hero: 'faye', ability: 'magnet_x', flag: 'awake_magnet_x', dialogue: 'awake_she_hears_it_all' },
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

// THE STARTING FIVE (S15h/ADR-048, the first 'arms' line — one wielder-tagged
// piece per hero) is now checked BOTH directions by the generalised SET_REGISTRY
// in THE CATALOG SPINE above (S17/ADR-061), alongside every future signature set.
// Pippa's Minister's Ribbon carries SPEED: §A8 names it "Luck+6", but the arms
// slot reads speed/guts — luck rides charms (ADR-037), so her Luck+6 is reserved
// for her SUNDAY SET charm and the arms piece is Speed (the tiny tactician is quick).

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
    // S15i Task 6 (ADR-059): the_cage now opens back onto the CAGE PARK (you walked in
    // through it); the park carries you on to Brickton (the symmetric approach)
    if (!cage.doors.some((d) => d.to === 'cage_park')) fail('hoops', `the_cage gate must open back onto the CAGE PARK (ADR-059 re-route)`);
  }
  // the cage gate now opens THROUGH the CAGE PARK, which leads into the_cage. The
  // frozen 2077 core literal still reads → the_cage; the LIVE map's door is re-routed
  // (a post-build fixup, proven in world_block.test). Both halves of the chain pinned:
  if (!MAPS.brickton?.doors.some((d) => d.to === 'cage_park')) {
    fail('hoops', `Brickton's cage gate must open onto cage_park (the approach park, ADR-059)`);
  }
  if (!MAPS.cage_park?.doors.some((d) => d.to === 'the_cage')) {
    fail('hoops', `cage_park must lead into the_cage (you WALK in through the park, ADR-059)`);
  }
  if (!MAPS.cage_park?.doors.some((d) => d.to === 'brickton')) {
    fail('hoops', `cage_park must carry you back to Brickton (ADR-059)`);
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
  if (Math.abs(RANGE.MIN - COURT_RT.ARC_R * 0.85) > 0.001 || Math.abs(RANGE.MAX - COURT_RT.ARC_R * 1.35) > 0.001) {
    fail('cage2', `effectiveRange clamps to [ARC_R·0.85, ARC_R·1.35] per spec`);
  }
  if (RANGE.PER_SHT !== s(1.2)) fail('cage2', `range derives at 1.2px per sht point (native spec, ×ART_SCALE at runtime)`);
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
  if (FINISH_RANGE_PX !== s(165)) fail('cage2', `the finish trigger range is 165px native (ADR-038 — ×ART_SCALE at runtime)`);
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
  // THE COURSE: §A11 demands EIGHTEEN named holes with plaque lines (counted +
  // swept); geometry must hold — uniform grids, tee on T, pin on G
  if (HOLES.length !== 18) fail('links', `the course is EIGHTEEN authored holes, found ${HOLES.length}`);
  if (COURSE_PAR !== 72) fail('links', `the card plays to par 72, got ${COURSE_PAR}`);
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

  // THE SUNDAY SET (§A8 'other' expansion) is now checked BOTH directions by the
  // generalised SET_REGISTRY in THE CATALOG SPINE above (S17/ADR-061).

  // THE VENUE: the resort map, FITO, the plaque, the clubhouse, the tease
  const costa = MAPS.costa_estrella;
  if (!costa) {
    fail('links', `'costa_estrella' map is missing (S13's venue)`);
  } else {
    // S15i Task 6 (ADR-059): the round-start moved INDOORS — FITO the caddy now runs
    // both formats from inside the new golf_clubhouse (reached through the resort), not
    // on costa's bare lawn. costa keeps a STARTER at the clifftop gate that opens west
    // onto the LINKS ESTATES approach (subdivision → clubhouse → the round).
    if (!MAPS.golf_clubhouse?.npcs.some((n) => n.id === 'caddy')) fail('links', `FITO the caddy must run the round from inside golf_clubhouse (ADR-059)`);
    if (!costa.doors.some((d) => d.to === 'golf_resort')) fail('links', `costa_estrella must open west onto the golf_resort approach (ADR-059)`);
    if (!MAPS.golf_resort?.props.some((p) => p.door?.to === 'golf_clubhouse')) fail('links', `the golf_resort clubhouse must open into golf_clubhouse — the indoor round-start (ADR-059)`);
    if (!MAPS.golf_clubhouse?.doors.some((d) => d.to === 'golf_resort')) fail('links', `golf_clubhouse must lead back out to the resort (ADR-059)`);
    if (!costa.signs.some((s) => s.dialogue === 'sign_costa')) fail('links', `costa_estrella needs its 'sign_costa' plaque`);
    // (ADR-059) costa's clifftop clubhouse PROP was intentionally removed — it
    // duplicated THE LINKS building one screen west (golf_resort), so the clifftop
    // is just the gate now; the door west to golf_resort (asserted above) is the
    // live link to the real clubhouse. The stale prop check retired here.
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
        if (a.kind === 'awaken' && !AWAKENINGS[a.awakening]) fail('phase', `'${sc.boss}' phase '${ph.id}' → unknown awakening '${a.awakening}'`);
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
  // the COUNT is law — exactly the two Ch.10 minibosses remain unshipped (Ch.3-9 bosses
  // promoted at their landings; the Hush is the bespoke finale, not a forge draft)
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

// THE CHAPTER MANIFESTS (S15g M4, ADR-047): the per-chapter source of truth.
// A 'shipped' manifest is asserted AGAINST LIVE content (Ch.1–2 — maps,
// settlements, boss, quests all exist and match); an 'unlanded' one is asserted
// against the forge DRAFTS (Ch.3–10 — a forged roster + a draft boss, and the
// boss is NOT yet a shipped enemy). The day a chapter lands, its session flips
// status to 'shipped' and these live assertions switch on (the S14c rule).
{
  parseAll('chapters', ChapterManifestSchema as unknown as ZodType, CHAPTER_MANIFESTS);

  // the COUNT is law — exactly ten chapters, keyed '1'..'10' (key === number)
  const ids = Object.keys(CHAPTER_MANIFESTS);
  if (ids.length !== 10) fail('chapters', `the §A6 arc is TEN chapters, found ${ids.length}`);
  for (const [key, m] of Object.entries(CHAPTER_MANIFESTS)) {
    if (key !== String(m.chapter)) fail('chapters', `manifest key '${key}' carries chapter ${m.chapter} — keys ARE the chapter number`);
  }
  for (let ch = 1; ch <= 10; ch++) {
    if (!CHAPTER_MANIFESTS[String(ch)]) fail('chapters', `Ch.${ch} manifest missing — the arc is 1..10`);
  }

  for (const m of Object.values(CHAPTER_MANIFESTS)) {
    const ch = m.chapter;

    // the §A6 boss-HP ladder, pinned against the forge's curve constants (the
    // shipped + the forged bosses read the same ladder; Ch.10's 150,000 shell is
    // the bespoke 3-phase finale, and the two minibosses ride MINIBOSS_HP)
    if (ch <= 9) {
      if (m.boss.hp !== BOSS_HP[ch]) fail('chapters', `Ch.${ch} boss '${m.boss.id}' HP is ${m.boss.hp}, §A6 ladder ${BOSS_HP[ch]}`);
    } else if (m.boss.hp !== 150000) {
      fail('chapters', `Ch.10 finale '${m.boss.id}' is the 150,000-HP shell (§A6, 3 phases ~50k each), got ${m.boss.hp}`);
    }
    for (const mb of m.minibosses ?? []) {
      const want = MINIBOSS_HP[mb.id as keyof typeof MINIBOSS_HP];
      if (want === undefined) fail('chapters', `Ch.${ch} miniboss '${mb.id}' is not in the §A6 MINIBOSS_HP ladder`);
      else if (mb.hp !== want) fail('chapters', `Ch.${ch} miniboss '${mb.id}' HP is ${mb.hp}, §A6 ${want}`);
    }

    if (m.status === 'shipped') {
      // ── LIVE assertions: the manifest must match the shipped content ──
      for (const id of m.maps) {
        if (!MAPS[id]) fail('chapters', `Ch.${ch} (shipped) lists map '${id}' — not in MAPS`);
      }
      for (const d of m.dungeon.maps ?? []) {
        if (!MAPS[d]) fail('chapters', `Ch.${ch} dungeon map '${d}' — not in MAPS`);
      }
      for (const s of m.settlements) {
        const map = MAPS[s.id];
        if (!map) fail('chapters', `Ch.${ch} settlement '${s.id}' — not in MAPS`);
        else if (map.settlement !== s.kind) fail('chapters', `Ch.${ch} settlement '${s.id}' is tagged '${map.settlement ?? 'none'}', manifest says '${s.kind}'`);
      }
      // the boss drives a shipped, boss-flagged §A7 enemy at the canon HP
      const boss = ENEMIES[m.boss.id];
      if (!boss) {
        fail('chapters', `Ch.${ch} boss '${m.boss.id}' — not in ENEMIES (a shipped chapter's boss is live)`);
      } else {
        if (boss.boss !== true) fail('chapters', `Ch.${ch} boss '${m.boss.id}' must carry boss: true`);
        if (boss.hp !== m.boss.hp) fail('chapters', `Ch.${ch} boss '${m.boss.id}' HP is ${boss.hp} in ENEMIES, manifest ${m.boss.hp}`);
      }
      // a non-bespoke shipped boss runs on the phase machine (BOSS_SCRIPTS)
      if (m.boss.template !== 'bespoke' && !BOSS_SCRIPTS[m.boss.id]) {
        fail('chapters', `Ch.${ch} boss '${m.boss.id}' (template '${m.boss.template}') has no BOSS_SCRIPTS entry`);
      }
      // quests: every listed quest is live + tagged this chapter — BOTH directions
      for (const q of m.quests) {
        const quest = QUESTS[q];
        if (!quest) fail('chapters', `Ch.${ch} quest '${q}' — not in QUESTS`);
        else if (quest.chapter !== ch) fail('chapters', `Ch.${ch} lists quest '${q}', but it is tagged chapter ${quest.chapter}`);
      }
      for (const [qid, quest] of Object.entries(QUESTS)) {
        if (quest.chapter === ch && !m.quests.includes(qid)) {
          fail('chapters', `quest '${qid}' is chapter ${ch} but absent from the Ch.${ch} manifest — extend the manifest, never ad-hoc`);
        }
      }
    } else {
      // ── UNLANDED assertions: the forge DRAFTS exist; canon does not yet ──
      if (!m.dungeon.site) fail('chapters', `unlanded Ch.${ch} names no dungeon site (the forge grammar the scaffold reads)`);
      if (forgedBandIds(ch).length === 0) fail('chapters', `unlanded Ch.${ch} has no forged roster (forgedBandIds(${ch}) is empty)`);
      // Prime Law 1: an unlanded boss is a DRAFT, never a shipped §A7 enemy
      if (ENEMIES[m.boss.id]) fail('chapters', `unlanded Ch.${ch} boss '${m.boss.id}' is already a shipped enemy — promotion is a human act`);
      if (m.boss.template !== 'bespoke' && !DRAFT_BOSS_SCRIPTS[m.boss.id]) {
        fail('chapters', `unlanded Ch.${ch} boss '${m.boss.id}' has no forged draft in DRAFT_BOSS_SCRIPTS`);
      }
      for (const mb of m.minibosses ?? []) {
        if (ENEMIES[mb.id]) fail('chapters', `unlanded Ch.${ch} miniboss '${mb.id}' is already a shipped enemy`);
        if (mb.template !== 'bespoke' && !DRAFT_BOSS_SCRIPTS[mb.id]) {
          fail('chapters', `unlanded Ch.${ch} miniboss '${mb.id}' has no forged draft in DRAFT_BOSS_SCRIPTS`);
        }
      }
      // a shipped chapter fills these at landing; unlanded carries none yet
      if (m.maps.length > 0 || (m.dungeon.maps?.length ?? 0) > 0) {
        fail('chapters', `unlanded Ch.${ch} lists live maps — leave maps/dungeon.maps empty until it lands (the S14c flip)`);
      }
    }
  }

  // BOTH DIRECTIONS on the forge boss drafts: every DRAFT_BOSS_ID is claimed by
  // exactly one unlanded chapter's boss or miniboss (never strand a draft).
  const claimed = new Map<string, number>();
  for (const m of Object.values(CHAPTER_MANIFESTS)) {
    if (m.status !== 'unlanded') continue;
    for (const id of [m.boss.id, ...(m.minibosses ?? []).map((b) => b.id)]) {
      if (DRAFT_BOSS_SCRIPTS[id]) claimed.set(id, (claimed.get(id) ?? 0) + 1);
    }
  }
  for (const id of DRAFT_BOSS_IDS) {
    const c = claimed.get(id) ?? 0;
    if (c === 0) fail('chapters', `forged boss draft '${id}' is claimed by no unlanded chapter manifest — wire it into a chapter`);
    else if (c > 1) fail('chapters', `forged boss draft '${id}' is claimed by ${c} chapter manifests — a draft drives one chapter`);
  }
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
  // are canon placements now; Ch.2 sets three more + the antechamber's.
  // S15h (ADR-049): grown Otterbrook adds two POND PARK rests (the §A4.5
  // beat found before the new south field's danger). S15i (ADR-054): the new
  // WOODS NOOK hides a fourth — a discoverable rest at the thicket glade.
  const TABLES: Record<string, number> = {
    otterbrook: 4,
    // ADR-056 — THE LONG WALK: a rest (picnic + payphone) at each leg's west
    // mouth, BEFORE its hot middle (§A4.5/§B4 — routes run hot)
    meadow_mile: 1,
    meadow_woods: 1,
    meadow_far: 1,
    meadow_overpass: 1,
    hickory_hill: 1,
    brickton: 1,
    dos_f2: 1,
    // S15i Task 4 (ADR-057): the grown port adds a 2nd rest — a dockside picnic on
    // the new malecón, before the jungle's pressure (the plaza table is the core's)
    puerto_sol: 2,
    jungle_2: 1,
    valle_dorado: 1,
    pyramid_ante: 1,
    deli_int: 1,
    // S18 (ADR-095) — CHAPTER 3 England: three rests before the dungeon (§A4.5) —
    // the town green, the moor lane, and the academy grounds.
    foggybottom: 1,
    foggy_moor: 1,
    wintermoor_grounds: 1,
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
    // pyramid_4 needs NO reachability waiver: its return-door now lands on the
    // carved channel floor (13,7), not the flank wall, and its west-alcove mask
    // is reachable in the static grid — so the map clears map-quality on its own.
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

/* ====== 3a‴. DOOR-LANDING AUDIT — wrong-edge / stuck transitions (ADR-102) ======
 * The reachability gate above proves a landing is WALKABLE; this proves it is the
 * RIGHT walkable spot. A door must drop you BESIDE the reciprocal return door, not
 * across the map (the "you enter from the wrong way" playtest bug) and never inside
 * a wall (the "stuck" bug). landsSolid + farFromReturn are HARD fails; noReturn (a
 * one-way door) is only reported — some are by design (a chute, a story shove, the
 * brickton→overpass through-road). The §A6 stateful bespoke rooms keep the SAME
 * waivers as the reachability gate (the rotor lands on a static wall by design),
 * and the runtime spawn safety-net (OverworldScene.clampSpawnToWalkable) is the
 * belt to this gate's suspenders — so a stuck spawn can't ship OR soft-lock. */
{
  const solidByName = new Map(TILESET.map((t) => [t.name, t.solid]));
  const isSolidChar = (ch: string): boolean =>
    ch === ':' || ch === 'r' ? false : solidByName.get(CHAR_LEGEND[ch] ?? 'grass_a') === true;
  // NB (divergence, deliberate + inert): door-audit.ts's WAIVED also names pyramid_ante/
  // pyramid_apex; this DOOR_WAIVERS OMITS them. INERT today — ante/apex currently produce NO
  // door findings at all, so the omission changes nothing. Latent difference should that
  // change: this gate's hard waiver is from-OR-to, so a future finding would be waived only
  // if it TARGETS the waived pyramid_1..4; door-audit (from-only) waives any finding
  // ORIGINATING at ante/apex. Left aligned by comment, not by membership (touching the
  // hard-tier waiver set is riskier than the inert nit warrants).
  const DOOR_WAIVERS = new Set(['pyramid_1', 'pyramid_2', 'pyramid_3', 'pyramid_4', 'dos_f3']);
  // ADR-135/136 body-box tier (opt-in): the 2 GENERATED city-unit doorsteps whose 40x36
  // player body box clips the door-mouth wall. Their landing TILE is walkable; only
  // the box pokes a neighbour, which the runtime clampSpawnToWalkable nudges. Their
  // shared citylife.ts stepTx/stepTy coords serve ~100 units, so they're left to the
  // clamp BY DESIGN (PR #84). These 2 are WAIVED here (keyed on f.from) so they never fail;
  // but per ADR-136 the body-box tier IS strict — a NON-waived body-block is a HARD FAIL
  // below (the pyramids are also waived, via DOOR_WAIVERS from+to).
  const BODY_WAIVERS = new Set(['minimus_major_unit_0', 'brickton_unit_8']);
  const findings = doorAudit(MAPS, isSolidChar, { bodyBox: true });
  let oneWay = 0;
  let bodyBlockedReal = 0;
  let bodyBlockedWaived = 0;
  for (const f of findings) {
    const waived = DOOR_WAIVERS.has(f.from) || DOOR_WAIVERS.has(f.to);
    const hard = f.issue.filter((i) => i === 'landsSolid' || i === 'farFromReturn');
    if (hard.length > 0 && !waived) {
      fail(
        'door-audit',
        `${f.from} → ${f.to} (${f.kind}) lands @${f.lx},${f.ly} '${f.char}': ${f.detail.join('; ')} — point tx,ty at the return doorstep, or add a reasoned waiver`,
      );
    }
    if (f.issue.includes('noReturn')) oneWay += 1;
    // body-box tier (ADR-136, STRICT — amends ADR-135's report-only): tallied here, then a
    // non-waived count FAILS the gate below via a DEDICATED fail() — deliberately NOT folded
    // into the per-finding `hard` filter, so it keeps the from-ONLY body waiver (not hard's
    // from-OR-to). clampSpawnToWalkable still nudges every body-blocked spawn at runtime; we
    // fail the BUILD anyway to force the author to re-aim a mis-aimed authored door.
    if (f.issue.includes('bodyBlocked')) {
      // Body-tier waiver keys on f.from ONLY — matching tools/door-audit.ts so both
      // gates bucket the SAME finding identically. Deliberately NOT the hard tier's
      // from-OR-to `waived`: a future body-block on a NORMAL source map that merely
      // TARGETS a bespoke map stays counted (the strict, safe direction for the gate).
      if (DOOR_WAIVERS.has(f.from) || BODY_WAIVERS.has(f.from)) bodyBlockedWaived += 1;
      else bodyBlockedReal += 1;
    }
  }
  console.log(
    `  door-audit (ADR-102): swept ${Object.keys(MAPS).length} maps — ${findings.length} flag(s), ${oneWay} one-way (reported), ${DOOR_WAIVERS.size} bespoke waived, ${bodyBlockedReal} body-blocked (${bodyBlockedWaived} waived; ADR-136, clamp-rescued, STRICT, non-waived = hard fail)`,
  );
  if (bodyBlockedReal > 0) {
    fail(
      'door-audit',
      `${bodyBlockedReal} NON-WAIVED body-blocked door(s) — a walkable landing whose player body box clips a wall (clampSpawnToWalkable would nudge it at runtime, but ADR-136 fails the build to force a fix). Re-aim tx,ty at the tile interior, or add a reasoned waiver.`,
    );
  }
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

/* ===== the three Axes + the Held Breath + the composed ending (S21, ADR-126/127/128) =====
 * Existence + cross-reference truth for the branching layer: every choice parses and
 * its dialogue/blurbs resolve; every epilogue card is dialogue-backed and gates only on
 * known flags; every slot has a fallback (no empty composition); echo anchors point at
 * real, NON-terminal choices. The composer's reachability is proven in vitest. */
{
  // every choice parses, is structurally sound, and its dialogue + blurbs resolve
  for (const def of Object.values(CHOICES)) {
    const r = ChoiceDefSchema.safeParse(def);
    if (!r.success) {
      for (const i of r.error.issues) fail('choice', `${def.id}: ${i.message}`);
      continue;
    }
    if (!DIALOGUE[def.intro]) fail('choice', `${def.id} intro → unknown dialogue '${def.intro}'`);
    for (const o of def.options) {
      if (!DIALOGUE[o.outro]) fail('choice', `${def.id}/${o.id} outro → unknown dialogue '${o.outro}'`);
      sweepTokens('text', `choice '${def.id}' option '${o.id}' label`, o.label, DIALOGUE_TOKENS);
      sweepTokens('text', `choice '${def.id}' option '${o.id}' blurb`, o.blurb, DIALOGUE_TOKENS);
      if (o.caller) sweepTokens('text', `choice '${def.id}' option '${o.id}' caller quote`, o.caller.quote, DIALOGUE_TOKENS);
    }
  }
  // structural soundness (chapters 4..10, option ids, flag uniqueness across choices)
  for (const p of choiceProblems()) fail('choice', p);
  // choice flags must not collide with story-thread beat flags (independent machines)
  const threadFlags = new Set(Object.values(THREAD_BEATS).map((b) => b.flag));
  for (const def of Object.values(CHOICES))
    for (const o of def.options)
      if (threadFlags.has(o.flag)) fail('choice', `option flag '${o.flag}' collides with a story-thread beat flag`);

  // every epilogue card parses, its dialogue exists, and its `requires` flags are known
  const knownFlags = new Set<string>([
    ...Object.values(CHOICES).flatMap((d) => [d.decidedFlag, ...d.options.flatMap((o) => [o.flag, ...(o.alsoSets ?? [])])]),
    ...KNOWN_ENDING_FLAGS,
  ]);
  for (const card of Object.values(ENDING_CARDS)) {
    const r = EpilogueCardSchema.safeParse(card);
    if (!r.success) {
      for (const i of r.error.issues) fail('ending', `${card.id}: ${i.message}`);
      continue;
    }
    if (!DIALOGUE[card.dialogue]) fail('ending', `card '${card.id}' → unknown dialogue '${card.dialogue}'`);
    if (card.requires)
      for (const f of Object.keys(card.requires))
        if (!knownFlags.has(f)) fail('ending', `card '${card.id}' requires unknown flag '${f}'`);
  }
  // every slot has a fallback so no composition can come up empty
  for (const slot of SLOT_ORDER)
    if (!Object.values(ENDING_CARDS).some((c) => c.slot === slot && c.fallback))
      fail('ending', `slot '${slot}' has no fallback card — a composition could be empty`);

  // echo anchors reference real, NON-terminal choices; the terminal song is never anchored
  for (const [key, a] of Object.entries(ECHO_ANCHORS)) {
    const r = EchoAnchorDefSchema.safeParse(a);
    if (!r.success) {
      for (const i of r.error.issues) fail('echo', `${key}: ${i.message}`);
      continue;
    }
    const def = Object.values(CHOICES).find((d) => d.id === a.choice);
    if (!def) fail('echo', `anchor '${key}' → unknown choice '${a.choice}'`);
    else if (def.terminal) fail('echo', `terminal choice '${a.choice}' must not be rewindable`);
    if (!DIALOGUE[a.offerDialogue]) fail('echo', `anchor '${key}' offer → unknown dialogue '${a.offerDialogue}'`);
    if (!DIALOGUE[a.costDialogue]) fail('echo', `anchor '${key}' cost → unknown dialogue '${a.costDialogue}'`);
  }
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

/* ===== 4b. THE FLAIR WEAVE — the {g:NAME} flair gate (S18 M23, ADR-093) ===== */
// The pixel-emoji `{g:NAME}` layer, pinned BOTH directions (like M22's glyph-script
// gate) — its colon syntax slips past the {word} token sweep above on purpose, so
// it owns its own gate:
//  · every {g:NAME} that appears in data names a REAL drawn glyph (a typo'd
//    {g:fier} fails the build loudly);
//  · the registry is pinned BOTH ways — every declared GLYPH_TOKEN is actually
//    drawn, and every drawn glyph is declared (no orphan, no undeclared draw);
//  · the battle auto-flair maps reference only real glyphs;
//  · DISCIPLINE: a literal {g:} only belongs where the MIXED-RUN renderer runs
//    (DIALOGUE → say(), and battle injects flair at RUNTIME, never in data). A
//    menu/shop/journal surface renders through ask()/pick()/toast, which can't
//    draw a sprite — so a stray {g:} there would show raw. The gate forbids it.
{
  const GLYPH_SET = new Set<string>(GLYPH_TOKENS);
  const flairTokensOf = (s: string): string[] => [...s.matchAll(/\{g:(\w+)\}/g)].map((m) => m[1]);
  const hasFlairTok = (s: string): boolean => /\{g:\w+\}/.test(s);

  // both directions: declared vocabulary ⇄ drawn registry
  const drawn = new Set(glyphRegistryNames());
  for (const name of GLYPH_TOKENS) {
    if (!drawn.has(name)) fail('flair', `GLYPH_TOKENS declares '${name}' but flair.ts draws no such glyph`);
    const pm = flairGlyph(name);
    const ink = pm.data.reduce((n, c) => n + (c !== 255 ? 1 : 0), 0);
    if (ink <= 4) fail('flair', `flair glyph '${name}' draws nothing legible (only ${ink} px)`);
  }
  for (const name of drawn) {
    if (!GLYPH_SET.has(name)) fail('flair', `flair.ts draws '${name}' but it is not declared in GLYPH_TOKENS — add it or retire the drawing`);
  }

  // the battle auto-flair maps must reference real glyphs
  for (const [el, g] of Object.entries(FLAIR_BY_ELEMENT)) {
    if (g && !GLYPH_SET.has(g)) fail('flair', `FLAIR_BY_ELEMENT['${el}'] = '${g}' is not a real glyph`);
  }
  for (const [res, g] of Object.entries(FLAIR_BY_RESULT)) {
    if (!GLYPH_SET.has(g)) fail('flair', `FLAIR_BY_RESULT['${res}'] = '${g}' is not a real glyph`);
  }

  // forward: every {g:NAME} in DIALOGUE names a real glyph
  for (const [id, pages] of Object.entries(DIALOGUE)) {
    pages.forEach((page, i) => {
      for (const t of flairTokensOf(page)) {
        if (!GLYPH_SET.has(t)) {
          fail('flair', `dialogue '${id}' page ${i + 1}: unknown flair {g:${t}} — known: ${[...GLYPH_SET].map((k) => `{g:${k}}`).join(' ')}`);
        }
      }
    });
  }

  // discipline: NO literal flair on the menu/shop/journal surfaces (they render
  // through ask()/pick()/toast, never the mixed run; a {g:} there would show raw)
  const noFlair = (where: string, text: string): void => {
    if (hasFlairTok(text)) fail('flair', `${where}: literal {g:} flair only belongs in DIALOGUE (the say/print path) — found in "${text}"`);
  };
  for (const m of Object.values(MAPS)) noFlair(`map '${m.id}' name`, m.name);
  for (const item of Object.values(ITEMS)) {
    noFlair(`item '${item.id}' name`, item.name);
    noFlair(`item '${item.id}' text`, item.text);
  }
  for (const q of Object.values(QUESTS)) {
    noFlair(`quest '${q.id}' name`, q.name);
    q.objectives.forEach((o) => noFlair(`quest '${q.id}' objective '${o.id}'`, o.text));
    noFlair(`quest '${q.id}' caller quote`, q.caller.quote);
  }
}

/* ===== UI affordance glyphs are drawable — no tofu (ADR-105) ===== */
// The interactive widgets render directional affordances as FONT glyphs: the
// smart-scale ATM dial (ui/amount.ts) shows ▲▼ to add/subtract and ◄► to cycle
// the active step; pick()'s pagination marker shows "▲ 1/3 ▼". Each MUST live in
// the procedural font or it renders as a blank cell — exactly the bug ADR-105
// fixed (the font shipped ▼ and → but never ▲/◄/►, so pick's ▲ drew tofu). The
// gate locks them in both ways: every affordance glyph is a single UTF-16 unit
// the font KNOWS (FONT_CHARS) and DRAWS (a non-empty 5×7 bitmap), so dropping one
// from spritegen/font.ts — or a widget reaching for an undrawn arrow — fails here.
const UI_AFFORDANCE_GLYPHS = ['▲', '▼', '◄', '►', '←', '→'];
{
  for (const g of UI_AFFORDANCE_GLYPHS) {
    if (g.length !== 1) {
      fail('ui-glyph', `affordance glyph '${g}' is not one UTF-16 code unit — the RetroFont indexes a single unit per cell`);
      continue;
    }
    if (!FONT_CHARS.includes(g)) {
      fail('ui-glyph', `affordance glyph '${g}' is not in the font charset — it renders as a blank cell (tofu); add it to SPECIALS in spritegen/font.ts`);
      continue;
    }
    const pm = new Pixmap(6, 9);
    drawTextInto(pm, g, 0, 1, 1);
    const ink = pm.data.reduce((n, c) => n + (c !== 255 ? 1 : 0), 0);
    if (ink <= 0) fail('ui-glyph', `affordance glyph '${g}' is in the charset but its SPECIALS bitmap draws nothing`);
  }
}

/* ===== multi-enemy encounters: cap + clean intro lines (ADR-106) ===== */
// A contact pulls a PACK into one battle, and nearby foes HOP IN during the
// swirl, capped at MAX_BATTLE_ENEMIES. Two content guarantees: the cap must fit
// BattleScene's letter row (A–E = 5 seats), and introLine() must produce a clean
// second-person line for EVERY roster the overworld can assemble — 1..cap of ONE
// foe (the "and its cousins" path) and a MIXED pack (the "X, Y and Z" path) — so
// a crowd never appears with blank, placeholder, or unresolved-{token} intro text.
{
  const BATTLE_LETTER_SEATS = 5; // BattleScene.buildEnemies lays letters ['A'..'E']
  if (!Number.isInteger(MAX_BATTLE_ENEMIES) || MAX_BATTLE_ENEMIES < 2) {
    fail('encounter', `MAX_BATTLE_ENEMIES must be an integer ≥ 2 for multi-enemy packs — got ${MAX_BATTLE_ENEMIES}`);
  }
  if (MAX_BATTLE_ENEMIES > BATTLE_LETTER_SEATS) {
    fail('encounter', `MAX_BATTLE_ENEMIES (${MAX_BATTLE_ENEMIES}) exceeds BattleScene's ${BATTLE_LETTER_SEATS} letter seats (A–E) — a pack would overflow the row`);
  }
  const cleanIntro = (where: string, line: string): void => {
    if (!line || !line.trim()) fail('encounter', `${where}: introLine produced an empty string`);
    if (/\{\w+\}/.test(line)) fail('encounter', `${where}: introLine left an unresolved {token} — "${line}"`);
    if (/\b(todo|placeholder|lorem|undefined)\b/i.test(line)) fail('encounter', `${where}: introLine produced placeholder text — "${line}"`);
  };
  const enemyIds = Object.keys(ENEMIES);
  for (const id of enemyIds) {
    cleanIntro(`solo '${id}'`, introLine([id]));
    cleanIntro(`pack ×${MAX_BATTLE_ENEMIES} '${id}'`, introLine(Array(MAX_BATTLE_ENEMIES).fill(id)));
  }
  if (enemyIds.length >= MAX_BATTLE_ENEMIES) {
    cleanIntro('mixed pack', introLine(enemyIds.slice(0, MAX_BATTLE_ENEMIES)));
  }
}

/* ===== Wave 2 (ADR-108): map ambient audio · reflections · NPC ambient life ===== */
// The map schema gained an ambient-bed id + an explicit muffle override (#16) and
// reflective-surface rects (#6); NPCs gained an idle-breath opt-in and an ambient
// emote (#4). The Zod schema already enforces the value SHAPES (muffle ∈ {0,1,2},
// emote/ambience ∈ their unions, reflect rects positive ints). This gate pins the
// cross-references a one-entity-at-a-time schema can't see, BOTH directions:
//   · the schema's EMOTE_IDS / AMBIENCE_IDS literal unions match their runtime
//     sources of truth (engine/emote EMOTES, engine/ambience AMBIENCE) — add one to
//     either side and forget the other, and the build fails here (the ui-glyph idiom);
//   · the AMBIENCE registry is well-formed (label, noise colour, sane gain/cutoff);
//   · every reflect rect sits inside its map grid AND actually overlaps a reflective
//     (water) tile, so a stale rect after a grid edit can't ship a dry "mirror";
//   · a `dog` NPC (its own anim set, no ${sprite}-idle-down) never opts into idle.
let waveTwoAudioMaps = 0;
let waveTwoReflect = 0;
let waveTwoAmbientNpcs = 0;
{
  // (a) emote-id union ⇔ EMOTES, both directions
  const schemaEmotes = new Set<string>(EMOTE_IDS);
  const engineEmotes = new Set<string>(Object.keys(EMOTES));
  for (const id of schemaEmotes) {
    if (!engineEmotes.has(id)) fail('emote', `schema EMOTE_IDS has '${id}' but engine/emote EMOTES has no such emote`);
  }
  for (const id of engineEmotes) {
    if (!schemaEmotes.has(id)) fail('emote', `engine/emote EMOTES has '${id}' but schema EMOTE_IDS does not — add it to EMOTE_IDS in src/schemas/index.ts`);
  }

  // (b) ambience-id union ⇔ AMBIENCE registry (both directions) + registry well-formed
  const schemaAmb = new Set<string>(AMBIENCE_IDS);
  const regAmb = new Set<string>(Object.keys(AMBIENCE));
  for (const id of schemaAmb) {
    if (!regAmb.has(id)) fail('ambience', `schema AMBIENCE_IDS has '${id}' but engine/ambience AMBIENCE has no bed for it`);
  }
  for (const id of regAmb) {
    if (!schemaAmb.has(id)) fail('ambience', `engine/ambience AMBIENCE has '${id}' but schema AMBIENCE_IDS does not — add it to AMBIENCE_IDS in src/schemas/index.ts`);
  }
  for (const bed of Object.values(AMBIENCE)) {
    if (!bed.label.trim()) fail('ambience', `ambience '${bed.id}' has an empty label`);
    if (!(bed.gain > 0 && bed.gain <= 1)) fail('ambience', `ambience '${bed.id}' gain ${bed.gain} must be in (0,1] — a bed sits UNDER the music`);
    if (!(bed.cutoff > 0)) fail('ambience', `ambience '${bed.id}' cutoff ${bed.cutoff} must be > 0 Hz`);
    if (!NOISE_COLORS.includes(bed.base)) fail('ambience', `ambience '${bed.id}' base '${bed.base}' is not a noise colour (${NOISE_COLORS.join('/')})`);
    if (bed.sway && !(bed.sway.depth > 0 && bed.sway.rate > 0)) fail('ambience', `ambience '${bed.id}' sway depth/rate must be > 0`);
  }

  // (c) reflect rects: in-bounds of the grid + overlap a reflective (water) tile.
  //     The reflective tiles are the §A6 sea tiles; resolve each cell's grid char
  //     through CHAR_LEGEND (the "grid char → legend → tile" idiom) and require ≥1.
  const REFLECTIVE_TILES = new Set(['sea_a', 'sea_foam']);
  for (const m of Object.values(MAPS)) {
    const gw = m.grid[0]?.length ?? 0;
    const gh = m.grid.length;
    for (const z of m.reflect ?? []) {
      waveTwoReflect++;
      if (z.x + z.w > gw || z.y + z.h > gh) {
        fail('reflect', `${m.id} reflect rect (${z.x},${z.y} ${z.w}×${z.h}) spills past the ${gw}×${gh}-tile grid`);
        continue;
      }
      let touchesWater = false;
      for (let ty = z.y; ty < z.y + z.h && !touchesWater; ty++) {
        for (let tx = z.x; tx < z.x + z.w; tx++) {
          const ch = m.grid[ty]?.[tx];
          if (ch && REFLECTIVE_TILES.has(CHAR_LEGEND[ch] ?? '')) {
            touchesWater = true;
            break;
          }
        }
      }
      if (!touchesWater) {
        fail('reflect', `${m.id} reflect rect (${z.x},${z.y} ${z.w}×${z.h}) covers no reflective tile (${[...REFLECTIVE_TILES].join('/')}) — stale coordinates?`);
      }
    }
  }

  // (d) per-map ambient counts + NPC ambient coherence (a dog can't idle-breathe)
  for (const m of Object.values(MAPS)) {
    if (m.ambience !== undefined || m.muffle !== undefined) waveTwoAudioMaps++;
    for (const n of m.npcs) {
      if (n.idle || n.emote !== undefined) waveTwoAmbientNpcs++;
      if (n.dog && n.idle) {
        fail('npc-ambient', `${m.id} npc '${n.id}' is a dog (own anim set, no idle-breath frames) — drop idle:true`);
      }
    }
  }
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

/* ================= Living-City Law (S18) — no dead settlements ================= */
// Every settlement must run through occupyCity: ~most facades enterable, and every
// locked one answers a knock. A new city that forgets the pass FAILS the build here.
for (const m of Object.values(MAPS)) {
  if (!m.settlement) continue;
  for (const v of livingCityViolations(m)) fail('living-city', v);
}

/* ================= verdict ================= */

const counts = [
  `${Object.keys(HEROES).length} heroes`,
  `${Object.keys(ABILITIES).length} abilities`,
  `${Object.keys(ENEMIES).length} enemies (§A7 Ch.1–5 + Bosses 1–5)`,
  `${Object.values(ENEMIES).reduce((a, e) => a + (e.drops?.length ?? 0), 0)} §A7 drops`,
  `${Object.keys(ITEMS).length} items (${Object.keys(ITEM_ICON).length} icons) across 10 chapters`,
  `${Object.keys(SHOPS).length} shops`,
  `${Object.keys(QUESTS).length} quests (§A10 #1–12 + the England + Norway + Minimus regionals)`,
  `${Object.keys(MAPS).length} maps`,
  `${CANON_AREAS.length} area skins`,
  `${Object.keys(GLYPH_SCRIPT).length} area glyph scripts (${SCRIPT_CATALOG.length} families)`,
  `${Object.keys(ABILITY_ICON).length} ability icons · ${STATUS_ICON_NAMES.length} status badges · ${Object.keys(BATTLE_FX_ICON).length} battle fx icons`,
  `${GLYPH_TOKENS.length} flair glyphs`,
  `${UI_AFFORDANCE_GLYPHS.length} UI affordance glyphs (${UI_AFFORDANCE_GLYPHS.join('')})`,
  `multi-enemy packs ≤${MAX_BATTLE_ENEMIES} (clean intros)`,
  `${AMBIENCE_BEDS.length} ambience beds · ${waveTwoAudioMaps} maps w/ ambient audio · ${waveTwoReflect} reflective surfaces · ${waveTwoAmbientNpcs} ambient NPCs`,
  `${VEHICLE_CATALOG.length} vehicles (${Object.keys(VEHICLE_SPECS).length} types)`,
  `${Object.keys(PSI_GATES).length} psi gates`,
  `${Object.keys(PROPERTIES).length} properties`,
  `${Object.keys(FURNITURE).length} furniture`,
  `${Object.keys(THREAD_BEATS).length} thread beats`,
  `${Object.keys(CHOICES).length} choices`,
  `${Object.keys(ENDING_CARDS).length} ending cards`,
  `${Object.keys(DISGUISES).length} disguises`,
  `paperboy (${liveRoute().items.filter((i) => i.kind === 'mailbox').length} houses)`,
  `${Object.keys(FLEET_CRAFT).length} fleet craft`,
  `${Object.keys(DEALERSHIP).length} dealership cars`,
  `${MILITARY_TYPES.length} military vehicles`,
  `${Object.keys(ARMY_BEATS).length} army-arc beats`,
  `fuel (${Object.keys(VEHICLE_SPECS).filter((t) => needsFuel(t)).length} powered · ${Object.keys(VEHICLE_SPECS).filter((t) => !needsFuel(t)).length} human/none)`,
  `${Object.keys(STATIONS).length} fuel stations`,
  `${CONTINENT_IDS.length} continents`,
  `the Long Shot (Earth↔Mars)`,
  `fortune arc ($${FORTUNE_ARC[0].netWorth}→$${(FORTUNE_ARC[FORTUNE_ARC.length - 1].netWorth / 1e9)}B)`,
  `${Object.keys(DIALOGUE).length} dialogue scripts`,
  `${Object.keys(TEAMS).length} Classic fives + ${Object.keys(WALK_ONS).length} walk-ons (S12)`,
  `${Object.keys(CHAPTER_MANIFESTS).length} chapter manifests (${Object.values(CHAPTER_MANIFESTS).filter((m) => m.status === 'shipped').length} shipped · ${Object.values(CHAPTER_MANIFESTS).filter((m) => m.status === 'unlanded').length} unlanded)`,
].join(' · ');

if (errors.length > 0) {
  console.error(`\nMETEOR FALLS content validation — ${errors.length} error(s):\n`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  console.error('');
  process.exit(1);
}
console.log(`✓ content valid — ${counts} · pray table sums 100`);
// S17 (ADR-061): the per-chapter catalog distribution — the quota's progress bar
// toward the §A8 ~40-items/region target (the spine ratchets BAND_FLOOR up as
// each region lands). Printed on success so the build-out is visible at a glance.
{
  const order = ['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7', 'ch8', 'ch9', 'ch10', 'cross'];
  const by: Record<string, number> = {};
  for (const item of Object.values(ITEMS)) if (item.band) by[item.band] = (by[item.band] ?? 0) + 1;
  console.log(`  catalog by band — ${order.map((b) => `${b}:${by[b] ?? 0}`).join(' ')}`);
}
