/**
 * tools/mapeditor/gen-manifest.ts — builds manifest.json for the visual Map Editor
 * from the REAL game data, so the editor never drifts from the engine:
 *
 *   - legend  : the paintable tiles (CHAR_LEGEND char → TILESET cell + solid flag).
 *               The tile ATLAS is assets/art/world/otterbrook_tiles_16.png, whose
 *               cell i is TILESET[i] (see WORLD_TILE_ART in authored.ts) — so the
 *               editor paints with the exact tiles the game renders.
 *   - props   : every WORLD_PROP key that has a PNG, with its on-map display size.
 *   - facades : every building facade key that has a PNG (placed as a prop sprite).
 *
 * Run:  npx vite-node tools/mapeditor/gen-manifest.ts   (or: npm run mapeditor:gen)
 */
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TILESET, PATH_BASE, PATH_VARIANTS, RUG_BASE, HEDGE_BASE, BRAMBLE_BASE } from '../../src/spritegen/tiles';
import { CHAR_LEGEND, MAPS } from '../../src/data/maps';
import {
  AUTHORED_WORLD_PROP_KEYS,
  AUTHORED_WORLD_PROP_DISPLAY_SIZE,
  AUTHORED_FACADE_KEYS,
  REGION_TILE_STRIPS,
  NPC_CHARACTER_ART,
} from '../../src/spritegen/authored';
import { CANON_AREAS } from '../../src/spritegen/buildings';
import { AMBIENCE_IDS, SettlementSchema, DoorIndicatorSchema, FacingSchema } from '../../src/schemas';
import { DIALOGUE } from '../../src/data/dialogue';
import { CITYLIFE_DIALOGUE } from '../../src/data/citylife_text';
import { BRANCH_DIALOGUE } from '../../src/data/branch_text';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const asset = (rel: string): string => resolve(ROOT, rel);
// PNG width/height live in the IHDR chunk at bytes 16..24 (BE) — no decode needed.
const pngDims = (p: string): { w: number; h: number } | null => {
  try {
    const b = readFileSync(p);
    if (b.length < 24) return null;
    return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  } catch {
    return null;
  }
};

// ---- tile atlas: cell i === TILESET[i].name (WORLD_TILE_ART, 64px cells, 1 row) ----
const tileIndexByName = new Map(TILESET.map((t, i) => [t.name, i]));
const solidByName = new Map(TILESET.map((t) => [t.name, t.solid]));

// coarse groups so the palette can tab ground / road / wall / decor
const legendGroup = (name: string, solid: boolean): string => {
  if (/grass|flower|tuft|sand|dirt|fairway|plaza|scorch|snow/.test(name)) return 'ground';
  if (/road|sidewalk|crosswalk|parking|dash|asphalt|patch|drain|dock/.test(name)) return 'paving';
  if (/wall|cliff|hedge|bramble|fence|mesh|pyramid_wall/.test(name) || solid) return 'wall';
  if (/floor|rug|wood|office|cubicle|arcade|bus/.test(name)) return 'interior';
  if (/sea|water|foam/.test(name)) return 'water';
  if (/stairs|lip|road_dash/.test(name)) return 'special';
  return 'other';
};

// ---- AUTOTILES: ':' (dirt path), 'r' (rug), 'H' (hedge), 'V' (bramble) are NOT plain
// CHAR_LEGEND cells — OverworldScene.buildTiles computes a 4-neighbour mask and picks
// BASE + ((x+y)%variants)*16 + mask. `connectWhenSame` encodes the mask convention:
// path/rug set a bit where the neighbour is NOT the same char (they cap their edges);
// hedge/bramble set it where the neighbour IS (they merge, rim faces open ground).
// Bits: 1=N 2=E 4=S 8=W. The editor mirrors this exactly so the preview autotiles.
const autotiles = {
  path: { base: PATH_BASE, variants: PATH_VARIANTS, connectWhenSame: false },
  rug: { base: RUG_BASE, variants: 1, connectWhenSame: false },
  hedge: { base: HEDGE_BASE, variants: 1, connectWhenSame: true },
  bramble: { base: BRAMBLE_BASE, variants: 1, connectWhenSame: true },
};
const AUTOTILE_CHAR: Record<string, keyof typeof autotiles> = { ':': 'path', r: 'rug', H: 'hedge', V: 'bramble' };

const legend = Object.entries(CHAR_LEGEND)
  // ' ' is just a duplicate "plain grass" alias for '.', drop it from the palette
  .filter(([ch]) => ch !== ' ')
  .map(([char, name]) => {
    const index = tileIndexByName.get(name) ?? -1;
    const solid = solidByName.get(name) ?? false;
    return { char, name, index, solid, group: legendGroup(name, solid), autotile: AUTOTILE_CHAR[char] };
  });
// ':' isn't in CHAR_LEGEND at all (the engine special-cases it BEFORE the legend lookup,
// content-validate.ts allows it, and isSolidChar treats it as walkable). Add it here so
// the editor can paint dirt trails. index PATH_BASE = the mask-0 cell (clean dirt fill).
legend.push({ char: ':', name: 'dirt_path', index: PATH_BASE, solid: false, group: 'paving', autotile: 'path' });

// ---- props: on-map display size (native units; the map draws them at w*4 x h*4 px) ----
const DISPLAY = AUTHORED_WORLD_PROP_DISPLAY_SIZE as Record<string, { w: number; h: number }>;
// clearly-flat / decorative props that should default to walk-through (no collision)
const FLAT = new Set([
  'paw_prints', 'doormat', 'ember', 'gift_box', 'gift_box_open', 'postage_stamp_crosswalk',
  'poster_smile', 'poster_chart', 'banner_productive', 'skyline', 'bus_windows',
]);
const propGroup = (key: string): string => {
  if (/^(tree|pine|palm|prop_pine|baobab|cattails|glow_shroom|root_)/.test(key)) return 'nature';
  if (/(bench|hydrant|mailbox|trash|news_box|parking_meter|sign|planter|dumpster|payphone|phone_pole|atm|fountain|well|flagpole|bus_sign|market_stall|fb_|puerto_)/.test(key)) return 'street';
  if (/(bed|sofa|desk|counter|dresser|^tv$|stove|bookshelf|floor_lamp|fridge|dining|shelf|cot|rocking|table|vending|jukebox|booth|freezer|checkout|aisle)/.test(key)) return 'furniture';
  if (/(gazebo|swing|seesaw|kiddie|doghouse|clothesline|footbridge|statue|karaoke|stage)/.test(key)) return 'yard';
  return 'other';
};

const authoredProps = (AUTHORED_WORLD_PROP_KEYS as readonly string[])
  .map((key) => {
    const rel = `assets/art/world/props/${key}.png`;
    if (!existsSync(asset(rel))) return null;
    let size = DISPLAY[key];
    if (!size) {
      // no authored display size → derive a sensible one from the PNG aspect at ~24 tall
      const d = pngDims(asset(rel));
      const h = 24;
      size = d ? { w: Math.max(6, Math.round((d.w / d.h) * h)), h } : { w: 20, h: 24 };
    }
    return {
      key,
      w: size.w,
      h: size.h,
      url: `/${rel}`,
      group: propGroup(key),
      solidDefault: !FLAT.has(key),
    };
  })
  .filter(Boolean);

// Runtime sprites that are valid map props but live outside assets/art/world/props.
const runtimeProps = [
  { key: 'vehicle_clunker', rel: 'assets/art/vehicles/vehicle_clunker.png', w: 38, h: 16, group: 'street' },
]
  .map((p) => existsSync(asset(p.rel))
    ? { key: p.key, w: p.w, h: p.h, url: `/${p.rel}`, group: p.group, solidDefault: true }
    : null)
  .filter(Boolean);

const props = [...authoredProps, ...runtimeProps];

// ---- facades: placed as a prop sprite; runtime derives collision from the texture ----
const facades = (AUTHORED_FACADE_KEYS as readonly string[])
  .map((key) => {
    const rel = `assets/art/world/facades/${key}.png`;
    if (!existsSync(asset(rel))) return null;
    const d = pngDims(asset(rel));
    // NATURAL on-map footprint in TILES — how the engine sizes a facade at scale 1: an
    // AUTHORED_WORLD_PROP_DISPLAY_SIZE entry renders at w*ART_SCALE px = w/16 tiles; otherwise the
    // texture lands at texW/64 tiles (memory: "Facade render=texW/64"). PropDef.scale multiplies this.
    const disp = DISPLAY[key];
    const wt = disp ? disp.w / 16 : d ? d.w / 64 : 4;
    const ht = disp ? disp.h / 16 : d ? d.h / 64 : 4;
    return { key, url: `/${rel}`, aspect: d ? +(d.w / d.h).toFixed(3) : 1, w: +wt.toFixed(3), h: +ht.toFixed(3) };
  })
  .filter(Boolean);

// ---- REGION SKINS ----------------------------------------------------------------
// The base grid is re-skinned per region at RUNTIME (a base tile name → a region tile
// name) on that region's maps. These remap tables MIRROR the `*_TILE_SKIN` consts in
// src/scenes/OverworldScene.ts (which can't be imported here — it pulls in Phaser). The
// region ATLAS + cell names come from the real REGION_TILE_STRIPS export, so only these
// small, stable base→region name maps are duplicated. Keep roughly in sync with the scene;
// this drives the editor's region PREVIEW only (the game's own render is authoritative).
const G = ['grass_a', 'grass_b', 'grass_tuft', 'office_floor'];
const P = ['road', 'sidewalk', 'road_dash'];
const W = ['office_wall', 'brick', 'bush'];
const mk = (ground: string, path: string, wall: string, water?: string, wallKeys = W): Record<string, string> => {
  const m: Record<string, string> = {};
  for (const k of G) m[k] = ground;
  for (const k of P) m[k] = path;
  for (const k of wallKeys) m[k] = wall;
  if (water) m['sea_a'] = water;
  return m;
};
const REGION_SKINS: { id: string; label: string; strip: keyof typeof REGION_TILE_STRIPS; mapsSet: string; skin: Record<string, string> }[] = [
  { id: 'norway', label: 'Norway — snow · fjord (Ch.4)', strip: 'norway', mapsSet: 'NORWAY_SKIN_MAPS', skin: mk('norway_ground', 'norway_path', 'norway_wall', 'norway_water') },
  { id: 'zanzibel', label: 'Africa — Zanzibel ochre sand (Ch.6)', strip: 'africa', mapsSet: 'ZANZIBEL_SKIN_MAPS', skin: mk('africa_sand', 'africa_path', 'africa_wall', 'africa_water') },
  { id: 'savanna', label: 'Africa — Savanna grassland (Ch.6)', strip: 'africa', mapsSet: 'SAVANNA_SKIN_MAPS', skin: mk('africa_grass', 'africa_earth', 'africa_wall', 'africa_water', ['office_wall', 'brick']) },
  { id: 'ruins', label: 'Africa — Laughing Ruins (Ch.6)', strip: 'africa', mapsSet: 'RUINS_SKIN_MAPS', skin: mk('africa_earth', 'africa_path', 'africa_ruin_wall', 'africa_water') },
  { id: 'china', label: 'China — Lotus Harbor (Ch.8)', strip: 'china', mapsSet: 'CHINA_SKIN_MAPS', skin: mk('china_ground', 'china_path', 'china_wall') },
  { id: 'romania', label: 'Romania — Valea Stelelor (Ch.9)', strip: 'romania', mapsSet: 'ROMANIA_SKIN_MAPS', skin: mk('romania_ground', 'romania_path', 'romania_wall') },
  { id: 'minimus', label: 'Minimus — privet · cobble (Ch.5)', strip: 'minimus', mapsSet: 'MINIMUS_SKIN_MAPS', skin: { ...mk('minimus_turf', 'minimus_cobble', 'minimus_hedge'), sidewalk: 'minimus_cobble' } },
  { id: 'aurora', label: 'Aurora — Alaska ice (Ch.10)', strip: 'aurora', mapsSet: 'AURORA_SKIN_MAPS', skin: mk('aurora_ground', 'aurora_path', 'aurora_wall') },
  { id: 'lani', label: 'Mauna Lani — Hawaii (Ch.10)', strip: 'lani', mapsSet: 'LANI_SKIN_MAPS', skin: mk('lani_ground', 'lani_path', 'lani_wall') },
  { id: 'mars', label: 'Mars — Sea of Silence (Ch.10)', strip: 'mars', mapsSet: 'MARS_SKIN_MAPS', skin: mk('mars_ground', 'mars_path', 'mars_wall') },
];
const regions = REGION_SKINS.map((r) => {
  const art = REGION_TILE_STRIPS[r.strip];
  const cellOf = (name: string): number => art.names.indexOf(name);
  const skin: Record<string, number> = {};
  for (const [base, regionName] of Object.entries(r.skin)) {
    const cell = cellOf(regionName);
    if (cell >= 0) skin[base] = cell; // only tiles the strip actually authors
  }
  return { id: r.id, label: r.label, mapsSet: r.mapsSet, atlas: `/assets/art/world/${art.url.split(/[\\/]/).pop()}`, skin };
});

// ---- NPCs: the authored townsfolk 46-frame sheets (4 cols × 12 rows of 96×128 frames;
// frame 0 = the front-facing stand the editor crops for its thumbnail + placement). ----
const authoredNpcs = (NPC_CHARACTER_ART as readonly { id: string; url: string }[])
  .map((n) => {
    const rel = `assets/art/characters/${n.url.split(/[\\/]/).pop()}`;
    if (!existsSync(asset(rel))) return null;
    return { id: n.id, url: `/${rel}` };
  })
  .filter(Boolean);

const runtimeNpcs = [
  {
    id: 'dog',
    rel: 'assets/art/characters/biscuit_dog_4frame.png',
    cols: 4,
    rows: 1,
    wTiles: 1.5,
    hTiles: 1.5,
  },
]
  .map((n) => existsSync(asset(n.rel))
    ? { id: n.id, url: `/${n.rel}`, cols: n.cols, rows: n.rows, wTiles: n.wTiles, hTiles: n.hTiles }
    : null)
  .filter(Boolean);

const npcs = [...authoredNpcs, ...runtimeNpcs];

// ---- SETTINGS + VALIDATION vocab: drive the ⚙ Map-Settings dropdowns and the in-editor
// "Check map" from the SAME sources the engine/validator use, so an authored map exports
// a complete, valid MapDef (music/area/ambience/settlement/… are all optional MapDef fields).
//   · music   — MIRRORED from the TRACKS registry in src/engine/audio.ts (that module pulls
//               in Web-Audio at import, so it can't be imported here — like the REGION_SKINS
//               mirror above. Keep in sync with audio.ts; the game's own list is authoritative).
//   · areas    — CANON_AREAS (spritegen/buildings.ts): the §A5/§A6 banner ids for MapDef.area.
//   · ambience — AMBIENCE_IDS (schemas): the ambient-bed vocabulary for MapDef.ambience.
//   · settlements/indicators/facings — the schema enums (single source of truth).
//   · dialogueIds — every DIALOGUE/CITYLIFE/BRANCH script id: the editor warns when an NPC or
//               sign points at one that doesn't exist. · mapIds — every shipped MAPS id: warns
//               when a door.to targets a map that isn't real (the map being edited is exempt).
const MUSIC_IDS = [
  'title', 'otterbrook', 'hill', 'home', 'battle', 'boss', 'victory', 'levelup',
  'brickton', 'department', 'arcade', 'cage', 'bus', 'boat', 'puerto', 'jungle',
  'valle', 'pyramid', 'starfall', 'heartlight', 'homesong',
];
const dialogueIds = [
  ...new Set([...Object.keys(DIALOGUE), ...Object.keys(CITYLIFE_DIALOGUE), ...Object.keys(BRANCH_DIALOGUE)]),
].sort();
const mapIds = Object.keys(MAPS).sort();
// ---- TRIGGERS: a trigger zone in a map only DOES something if OverworldScene.runTrigger(id) has a
// `case '<id>'`. Extract those handled ids straight from the scene SOURCE (read as text — the scene
// imports Phaser so it can't be imported here), plus every trigger id already used across the maps,
// so the editor can autocomplete ids and WARN when a trigger has no handler (it'd silently do nothing).
const triggerIds = [...new Set(Object.values(MAPS).flatMap((m) => (m.triggers ?? []).map((t) => t.id)))].sort();
const triggerHandlers: string[] = (() => {
  try {
    const src = readFileSync(asset('src/scenes/OverworldScene.ts'), 'utf8');
    const start = src.indexOf('private async runTrigger');
    if (start < 0) return [];
    const end = src.indexOf('\n  private ', start + 20); // next class method at 2-space indent
    const body = src.slice(start, end > start ? end : start + 8000);
    return [...new Set([...body.matchAll(/case '([\w]+)'/g)].map((m) => m[1]))].sort();
  } catch {
    return [];
  }
})();
const settings = {
  music: MUSIC_IDS,
  areas: [...CANON_AREAS].sort(),
  ambience: [...AMBIENCE_IDS],
  settlements: SettlementSchema.options,
  indicators: DoorIndicatorSchema.options,
  facings: FacingSchema.options,
  muffles: [0, 1, 2],
  atmospheres: ['fog'], // MapDefSchema.atmosphere = z.enum(['fog'])
};

const manifest = {
  generatedNote: 'AUTO-GENERATED by tools/mapeditor/gen-manifest.ts from TILESET / CHAR_LEGEND / authored props + region strips + NPC sheets. Do not edit by hand.',
  tilePx: 64,
  artScale: 4,
  atlas: '/assets/art/world/otterbrook_tiles_16.png',
  atlasCells: TILESET.length,
  charFrame: { cols: 4, rows: 12 }, // 46-frame sheet grid; frame 0 = front stand
  autotiles, // ':' path, 'r' rug, 'H' hedge, 'V' bramble — 16-mask cells (see above)
  // directional sidewalk-curb cells: the engine (OverworldScene.buildTiles) swaps a road-adjacent
  // '=' to the curb variant whose vertical face points at the road. The editor mirrors this so the
  // 3D curb shows in the preview (road below→s, east→e, west→w; otherwise the flat base).
  sidewalkCurb: {
    base: tileIndexByName.get('sidewalk') ?? -1,
    s: tileIndexByName.get('sidewalk_curb') ?? -1,
    e: tileIndexByName.get('sidewalk_curb_e') ?? -1,
    w: tileIndexByName.get('sidewalk_curb_w') ?? -1,
  },
  legend,
  props,
  facades,
  regions,
  npcs,
  settings, // ⚙ Map-Settings dropdown vocab (music/area/ambience/settlement/indicator/…)
  dialogueIds, // known DIALOGUE/CITYLIFE/BRANCH script ids (Check-map warns on unknown)
  mapIds, // known MAPS ids (Check-map warns when a door targets a non-existent map)
  triggerIds, // trigger ids already used across the maps (editor autocomplete)
  triggerHandlers, // trigger ids that OverworldScene.runTrigger() actually handles (Check warns otherwise)
};

writeFileSync(resolve(HERE, 'manifest.json'), JSON.stringify(manifest, null, 2));

// ---- maps.json: the FULL data of every shipped map, so the editor's 📂 Open picker can
// pull up any real map and edit it (then re-export). Emitted compact + as a SEPARATE file
// (it's large) that the editor lazy-fetches only when the picker is first opened — boot
// stays fast. Each value is a real MapDef; the editor's loadMapObj already ingests them
// (grid string-rows, elevation plane, optional settings all round-trip).
const mapsOut: Record<string, { name: string; def: unknown }> = {};
for (const id of mapIds) mapsOut[id] = { name: MAPS[id]?.name ?? id, def: MAPS[id] };
writeFileSync(resolve(HERE, 'maps.json'), JSON.stringify(mapsOut));

console.log(
  `manifest.json written: ${legend.length} tiles, ${props.length} props, ${facades.length} facades, ${regions.length} regions, ${npcs.length} NPCs, ` +
    `${settings.music.length} tracks, ${settings.areas.length} areas, ${dialogueIds.length} dialogue ids, ${mapIds.length} map ids (atlas ${TILESET.length} cells).`,
);
console.log(`maps.json written: ${mapIds.length} full map defs (editor 📂 Open picker).`);
console.log(`triggers: ${triggerHandlers.length} handled in runTrigger, ${triggerIds.length} used across maps.`);
