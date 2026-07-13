/**
 * THE LEVELKIT — shared building blocks (S15g, ADR-044).
 *
 * The verbs every generator composes from: the canon prop SOLIDS (lifted
 * byte-for-byte from maps.ts so a generated bench collides like a shipped
 * one), the per-style PROP PALETTES (style packs are DATA — Prime Law 3),
 * the facade placer (the maps.ts `place()` pattern), and the role-tagged
 * NPC-slot pool. Nothing here touches Date.now()/Math.random() — all
 * jitter rides the named Streams (Prime Law 2).
 *
 * Generated facades reuse the SHIPPED bldg_* catalog: drawing per-region
 * facades is a hand art job (ADR-020) that promotion does, not the forge —
 * the kit lays out real, renderable sprites so a draft walks in the LAB.
 */
import { Grid, treeSprite } from '../data/mapkit';
import { cityBuildingHeight } from '../spritegen/tiles';
import {
  GENERATED_BUILDINGS,
  CITY_SCALE_BUILDINGS,
  KVISTHAVN_FACADES,
  LILLEBY_FACADES,
  MINIMUS_FACADES,
  ZANZIBEL_FACADES,
  CHANDRAPORE_FACADES,
} from '../spritegen/buildings';
import type {
  PropDef,
  DraftNpc,
  SettlementStyle,
  EncounterBand,
} from '../schemas';
import type { Streams } from './rng';
import { forgedBandIds } from './forge/registry';

export { Grid, treeSprite };

/** a px collision box relative to a prop's top-left */
export interface Solid {
  ox: number;
  oy: number;
  w: number;
  h: number;
}

/** canon prop solids (copied from maps.ts — generated props collide alike) */
export const SOLID: Record<string, Solid> = {
  bench: { ox: 1, oy: 6, w: 20, h: 6 },
  hydrant: { ox: 2, oy: 8, w: 6, h: 5 },
  planter: { ox: 1, oy: 6, w: 20, h: 9 },
  dumpster: { ox: 1, oy: 8, w: 20, h: 9 },
  picnic: { ox: 2, oy: 8, w: 32, h: 14 },
  sign: { ox: 3, oy: 10, w: 10, h: 7 },
  payphone: { ox: 1, oy: 10, w: 14, h: 16 },
  atm: { ox: 1, oy: 10, w: 14, h: 12 },
  well: { ox: 2, oy: 8, w: 20, h: 12 },
  market_stall: { ox: 1, oy: 10, w: 28, h: 12 },
};
export const TREE_SOLID: Solid = { ox: 7, oy: 22, w: 12, h: 10 };

/**
 * The wide standing footprint of a facade — matches Brickton core's `place()`
 * (maps.ts) EXACTLY: oy:10 (was 26) so the whole facade blocks and a player
 * can't walk horizontally ACROSS the upper floors (the "walk through the
 * building at some angles" bug the user hit on MAPLE HEIGHTS — ADR-050). The
 * bottom stays at H-12 so the door zone below it is still reachable, and
 * depth-sort occludes a hero pressed against the back. `u` is the story count
 * (now any height — mega-buildings are tall, so their tall body blocks too).
 */
export function facadeSolid(wTiles: number, u: number): Solid {
  const H = cityBuildingHeight(u);
  return { ox: 0, oy: 10, w: wTiles * 16 + 2, h: H - 22 };
}

/**
 * One PROP PALETTE per style. `road`/crosswalk chars stay R/D/X always (the
 * ADR-012 sweep keys on 'RDX'); only the WALKABLE dressing varies by region.
 */
export interface StylePack {
  /** walkable pavement char (sidewalk/plaza/sand) */
  pave: string;
  /** open-ground char for towns/villages (grass/sand/plaza) */
  ground: string;
  /** ground sprinkle charset + density */
  sprinkle: string;
  /** generic facades (the shipped catalog, reused as draft placeholders) */
  buildings: readonly string[];
  /** sidewalk furniture sprites */
  furniture: readonly string[];
  /** allow pine variants in treeSprite */
  pines: boolean;
}

export const STYLE_PACKS: Record<SettlementStyle, StylePack> = {
  americana: {
    pave: '=', ground: '.', sprinkle: ',~ff F',
    buildings: ['bldg_brickmore', 'bldg_video', 'bldg_diner', 'bldg_bagels', 'bldg_bank'],
    furniture: ['bench', 'hydrant', 'planter'], pines: false,
  },
  'bazaar-port': {
    pave: 'p', ground: 'n', sprinkle: 'n~,n',
    buildings: ['bldg_bagels', 'bldg_diner', 'bldg_brickmore', 'bldg_video'],
    furniture: ['market_stall', 'planter', 'well'], pines: false,
  },
  'fog-stone': {
    pave: '=', ground: ',', sprinkle: ',~b,~',
    buildings: ['bldg_brickmore', 'bldg_bank', 'bldg_diner', 'bldg_video'],
    furniture: ['bench', 'planter', 'sign'], pines: true,
  },
  'painted-gates': {
    pave: 'p', ground: '.', sprinkle: ',~fF,',
    buildings: ['bldg_bagels', 'bldg_brickmore', 'bldg_diner', 'bldg_video'],
    furniture: ['planter', 'well', 'market_stall'], pines: false,
  },
  'spire-canton': {
    pave: '=', ground: ',', sprinkle: ',~,b',
    buildings: ['bldg_brickmore', 'bldg_bank', 'bldg_bagels', 'bldg_video'],
    furniture: ['bench', 'planter', 'well'], pines: true,
  },
};

/** facades that carry a recipe `requiredDoor` role get a role-specific sprite */
export const ROLE_FACADE: Record<string, string> = {
  shop: 'bldg_starmart',
  hospital: 'bldg_hospital',
  arcade: 'bldg_arcade2',
  story_gate: 'bldg_dept',
};

/**
 * EVERY forge-eligible facade sprite's TRUE footprint — width in tiles and
 * story count — mirrored from its drawCityBuilding registration in
 * spritegen/index.ts (S15i, ADR-050). The grammar reads this so a facade is
 * placed and collided at the size it was actually DRAWN (the pre-S15i forge
 * picked a random `u`, so a 3-story sprite could sit as if it were 1 — a
 * mega-building MUST land at its real height or it sinks through the street).
 * `u ≥ 11` is a MEGA-building (its top runs off-screen). Unknown sprites fall
 * back to facadeDims()'s default.
 */
const SHIPPED_DIMS: Record<string, { w: number; u: number }> = {
  // shipped Brickton downtown
  house_pink: { w: 4, u: 2 },
  bldg_bagels: { w: 4, u: 1 }, bldg_starmart: { w: 5, u: 1 }, bldg_hospital: { w: 7, u: 2 },
  bldg_brickmore: { w: 5, u: 3 }, bldg_dept: { w: 8, u: 2 }, bldg_video: { w: 4, u: 1 },
  bldg_bank: { w: 6, u: 2 }, bldg_arcade2: { w: 5, u: 1 }, bldg_diner: { w: 4, u: 1 },
  facade_hardware: { w: 5, u: 1 }, facade_diner: { w: 5, u: 1 },
  facade_busdepot: { w: 5, u: 1 }, facade_busdepot_open: { w: 5, u: 1 },
  facade_fillshop: { w: 5, u: 1 }, facade_realty: { w: 4, u: 1 }, facade_autolot: { w: 5, u: 1 },
  // PUERTO SOL colonial faces
  bldg_ps_mercado: { w: 5, u: 1 }, bldg_ps_clinic: { w: 5, u: 1 }, bldg_ps_pension: { w: 5, u: 2 },
  bldg_ps_museum: { w: 6, u: 2 }, bldg_ps_casa: { w: 4, u: 2 }, bldg_ps_casa_b: { w: 4, u: 1 },
  bldg_ps_deli: { w: 4, u: 1 }, bldg_ps_cantina: { w: 5, u: 1 }, bldg_ps_casa_c: { w: 4, u: 1 },
  bldg_ps_pension_b: { w: 5, u: 2 },
  // S15i Task 4 (ADR-057) — PUERTO SOL's colonial MEGAS (tops off-screen, u≥11)
  bldg_ps_catedral: { w: 6, u: 11 }, bldg_ps_gran_hotel: { w: 6, u: 12 }, bldg_ps_aduana: { w: 7, u: 11 },
  // S15i hand-authored families
  bldg_apartments: { w: 5, u: 4 }, bldg_office: { w: 5, u: 5 }, bldg_civic: { w: 6, u: 2 },
  bldg_theater: { w: 5, u: 2 }, bldg_market: { w: 6, u: 1 }, bldg_brownstone: { w: 4, u: 3 },
  bldg_warehouse: { w: 8, u: 1 }, bldg_neon: { w: 4, u: 2 }, bldg_deptstore: { w: 8, u: 3 },
  // Otterbrooke authored hi-res facades. These mirror the painted PNG footprint
  // closely enough for generated residential doors to land on the visible stoops.
  bldg_ob_bakery: { w: 5, u: 1 }, bldg_ob_burger: { w: 5, u: 1 }, bldg_ob_city_hall: { w: 10, u: 7 },
  bldg_ob_clinic: { w: 9, u: 5 }, bldg_ob_house_green: { w: 6, u: 3 }, bldg_ob_workshop: { w: 7, u: 4 },
  bldg_ob_house_c: { w: 5, u: 3 }, bldg_ob_cottage: { w: 8, u: 1 }, bldg_ob_apt_green: { w: 7, u: 7 },
  bldg_ob_hotel: { w: 7, u: 7 },
  // S15i MEGA-buildings (tops off-screen)
  bldg_tower_glass: { w: 6, u: 12 }, bldg_tower_arms: { w: 6, u: 12 }, bldg_tower_corp: { w: 7, u: 13 },
};

const AUTHORED_REGION_FACADE_DIMS: Record<string, { w: number; u: number }> = Object.fromEntries(
  [
    ...KVISTHAVN_FACADES, ...LILLEBY_FACADES, ...MINIMUS_FACADES,
    ...ZANZIBEL_FACADES, ...CHANDRAPORE_FACADES,
  ].map((name) => [name, { w: 4, u: 0 }]),
);

/** the 100+ generated catalog (+ colossi) contributes its true dims here too */
export const BUILDING_DIMS: Record<string, { w: number; u: number }> = {
  ...SHIPPED_DIMS,
  ...AUTHORED_REGION_FACADE_DIMS,
  ...Object.fromEntries(GENERATED_BUILDINGS.map((b) => [b.name, { w: b.opts.wallTiles, u: b.opts.upperRows }])),
  ...Object.fromEntries(CITY_SCALE_BUILDINGS.map((b) => [b.name, { w: b.opts.wallTiles, u: b.opts.upperRows }])),
};

/** a facade's drawn footprint, or a sane fallback for an unlisted sprite */
export function facadeDims(sprite: string, fallbackW = 4): { w: number; u: number } {
  return BUILDING_DIMS[sprite] ?? { w: fallbackW, u: 2 };
}

/** TRUE when a facade is tall enough that its top runs off the screen */
export function isMega(sprite: string): boolean {
  return (BUILDING_DIMS[sprite]?.u ?? 0) >= 11;
}

/**
 * BAND → roamer roster. ch1/ch2 are the SHIPPED §A7 enemies (frozen). Ch.3–10
 * now resolve to the FORGED rosters (Movement Three): forgedBandIds(ch) is the
 * deterministic id list buildRoster(ch, FIXED_SEED[ch]) produces, and the
 * LEVELKIT LAB injects those forged defs into the RUNTIME ENEMIES (tags
 * stripped) so a walked Ch.3–10 dungeon fights real forged foes. Canon ENEMIES
 * never sees a forged draft — promotion is a human act (Prime Law 1).
 */
export const BAND_ROSTER: Record<EncounterBand, readonly string[]> = {
  ch1: ['cranky_mailbox', 'coily_cicada'],
  ch2: ['pickpocket_parrot', 'gilded_beetle'],
  ch3: forgedBandIds(3),
  ch4: forgedBandIds(4),
  ch5: forgedBandIds(5),
  ch6: forgedBandIds(6),
  ch7: forgedBandIds(7),
  ch8: forgedBandIds(8),
  ch9: forgedBandIds(9),
  ch10: forgedBandIds(10),
};

/** generic townsfolk sprites (real CAST sheets) for role-tagged draft slots */
export const SLOT_SPRITES: readonly string[] = [
  'grayCommuter', 'sidewalkCritic', 'oldTimer', 'pajamaKid',
  'pigeonKid', 'fernLady', 'quarterMan', 'senora',
];

/** the roles a generated settlement scatters across its NPC slots */
export const SLOT_ROLES: readonly string[] = [
  'townie', 'gossip', 'kid', 'elder', 'merchant', 'commuter', 'wanderer', 'local',
];

/**
 * Place a facade prop the maps.ts way: `bottomPx` is the building's visual
 * bottom; its collision floor lands `bottomPx - 12`. Returns the prop so the
 * caller can derive a doorstep from where it actually sat (ADR-012).
 */
export function placeFacade(
  sprite: string,
  xTile: number,
  bottomPx: number,
  wTiles: number,
  u: number,
  door?: { to: string; tx: number; ty: number },
): PropDef {
  const H = cityBuildingHeight(u);
  const prop: PropDef = {
    sprite,
    x: xTile,
    y: (bottomPx - H) / 16,
    solid: facadeSolid(wTiles, u),
  };
  if (door) {
    const ox = Math.round((wTiles * 16) / 2) - 8;
    prop.door = { ox, oy: H - 14, w: 16, h: 18, to: door.to, tx: door.tx, ty: door.ty };
  }
  return prop;
}

/** a furniture prop with its canon solid (visual-only if no solid is known) */
export function furniture(sprite: string, x: number, y: number): PropDef {
  const solid = SOLID[sprite];
  return solid ? { sprite, x, y, solid } : { sprite, x, y };
}

/** a tree prop with the standard solid + deterministic variety */
export function tree(x: number, y: number, pines = false): PropDef {
  return { sprite: treeSprite(x, y, pines), x, y, solid: TREE_SOLID };
}

/** a role-tagged draft NPC slot (no dialogue — the human writes it at promotion) */
export function slot(S: Streams, i: number, x: number, y: number): DraftNpc {
  return {
    id: `slot_${i}`,
    sprite: SLOT_SPRITES[i % SLOT_SPRITES.length],
    x,
    y,
    facing: (['down', 'left', 'right', 'up'] as const)[S.int('slotface', 4)],
    role: SLOT_ROLES[i % SLOT_ROLES.length],
    wander: S.chance(`slotwander${i}`, 0.5),
  };
}

/** clamp a recipe size to a sane floor so the grammar always fits */
export function clampSize(size: readonly [number, number], minW: number, minH: number): [number, number] {
  return [Math.max(minW, size[0]), Math.max(minH, size[1])];
}
