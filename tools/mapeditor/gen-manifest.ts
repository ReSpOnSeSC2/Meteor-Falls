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
import { TILESET } from '../../src/spritegen/tiles';
import { CHAR_LEGEND } from '../../src/data/maps';
import {
  AUTHORED_WORLD_PROP_KEYS,
  AUTHORED_WORLD_PROP_DISPLAY_SIZE,
  AUTHORED_FACADE_KEYS,
  REGION_TILE_STRIPS,
  NPC_CHARACTER_ART,
} from '../../src/spritegen/authored';

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

const legend = Object.entries(CHAR_LEGEND)
  // ' ' is just a duplicate "plain grass" alias for '.', drop it from the palette
  .filter(([ch]) => ch !== ' ')
  .map(([char, name]) => {
    const index = tileIndexByName.get(name) ?? -1;
    const solid = solidByName.get(name) ?? false;
    return { char, name, index, solid, group: legendGroup(name, solid) };
  });

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

const props = (AUTHORED_WORLD_PROP_KEYS as readonly string[])
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

// ---- facades: placed as a prop sprite; runtime derives collision from the texture ----
const facades = (AUTHORED_FACADE_KEYS as readonly string[])
  .map((key) => {
    const rel = `assets/art/world/facades/${key}.png`;
    if (!existsSync(asset(rel))) return null;
    const d = pngDims(asset(rel));
    return { key, url: `/${rel}`, aspect: d ? +(d.w / d.h).toFixed(3) : 1 };
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
const npcs = (NPC_CHARACTER_ART as readonly { id: string; url: string }[])
  .map((n) => {
    const rel = `assets/art/characters/${n.url.split(/[\\/]/).pop()}`;
    if (!existsSync(asset(rel))) return null;
    return { id: n.id, url: `/${rel}` };
  })
  .filter(Boolean);

const manifest = {
  generatedNote: 'AUTO-GENERATED by tools/mapeditor/gen-manifest.ts from TILESET / CHAR_LEGEND / authored props + region strips + NPC sheets. Do not edit by hand.',
  tilePx: 64,
  artScale: 4,
  atlas: '/assets/art/world/otterbrook_tiles_16.png',
  atlasCells: TILESET.length,
  charFrame: { cols: 4, rows: 12 }, // 46-frame sheet grid; frame 0 = front stand
  legend,
  props,
  facades,
  regions,
  npcs,
};

writeFileSync(resolve(HERE, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(
  `manifest.json written: ${legend.length} tiles, ${props.length} props, ${facades.length} facades, ${regions.length} regions, ${npcs.length} NPCs (atlas ${TILESET.length} cells).`,
);
