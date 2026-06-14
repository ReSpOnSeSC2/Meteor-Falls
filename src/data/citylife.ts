/**
 * occupyCity — THE LIVING-CITY PASS (S18, the "no dead buildings" law).
 *
 * The city generators (buildDistrict / growBrickton / buildPuertoSol) emit
 * DECORATIVE facades by default — doorless boxes. That is why the grown cities
 * felt dead. occupyCity is the default-on fixup that gives those facades a
 * PURPOSE: ~90% get a real door into a generated interior sized to the building's
 * footprint (apartments, shops, cafes, offices, clinics), and the locked ~10%
 * answer a knock with an EarthBound-weird refusal (no interior, just a sign).
 *
 * It MUTATES the city map in place (adds prop.door, knock signs, light street
 * dressing) and RETURNS the generated interiors for the caller to merge into MAPS.
 * Deterministic (seeded), so a city's tenancy is byte-identical every run.
 *
 * Reachability note: the map validator is TILE-based and ignores props, so the
 * doors/dressing added here never affect the connectivity sweep.
 */
import type { MapDef, PropDef, NpcDef, SignDef } from '../schemas';
import { facadeDims } from '../levelkit/kit';
import { cityBuildingHeight } from '../spritegen/tiles';
import { KNOCK_IDS, RESIDENT_IDS, KEEPER_IDS, CIVIC_IDS } from './citylife_text';

/* ----------------------------- determinism ----------------------------- */

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));

// Canon facades that are doorless ON PURPOSE — a bank fronts an ATM, not a home, so the
// Living-City pass must leave it sealed (a knock, never an auto-door). See ADR-098.
const SEALED_FACADE_SPRITES: ReadonlySet<string> = new Set(['bldg_bank']);

/* ----------------------------- tenancy ----------------------------- */

type Furnish = 'home' | 'shop' | 'cafe' | 'office' | 'clinic';

interface Archetype {
  weight: number;
  names: readonly string[];
  sprites: readonly string[];
  pool: readonly string[];
  npc: readonly [number, number]; // min, max occupants
  furnish: Furnish;
}

// EarthBound cities are mostly homes, with a healthy retail strip + some civic.
const ARCHETYPES: readonly Archetype[] = [
  {
    weight: 38, furnish: 'home', npc: [1, 2],
    names: ['APARTMENTS', 'WALK-UP', 'THE FLATS', 'ROW HOUSE', 'TENEMENT 2F', 'GARDEN UNITS', 'COURTYARD APTS'],
    sprites: ['grayCommuter', 'pajamaKid', 'fernLady', 'oldTimer', 'mrPlummer', 'sidewalkCritic'],
    pool: RESIDENT_IDS,
  },
  {
    weight: 26, furnish: 'shop', npc: [1, 1],
    names: ['CORNER STORE', 'FIVE & DIME', 'SUNDRIES', 'THE TRADING POST', 'ODDS & ENDS', 'GENERAL GOODS'],
    sprites: ['martClerk', 'deliKeeper', 'mercadoKeeper', 'quarterMan'],
    pool: KEEPER_IDS,
  },
  {
    weight: 16, furnish: 'cafe', npc: [1, 2],
    names: ['THE LUNCH COUNTER', 'CORNER CAFE', 'DINER', 'COFFEE & SUCH', 'THE SODA BAR'],
    sprites: ['deliKeeper', 'martClerk', 'grayCommuter'],
    pool: KEEPER_IDS,
  },
  {
    weight: 12, furnish: 'office', npc: [1, 2],
    names: ['SUITE 200', 'THE OFFICE', 'CLERK\'S WINDOW', 'RECORDS', 'THE BUREAU', 'ACCOUNTS DEPT.'],
    sprites: ['quarterMan', 'grayCommuter', 'sidewalkCritic'],
    pool: CIVIC_IDS,
  },
  {
    weight: 8, furnish: 'clinic', npc: [1, 1],
    names: ['WALK-IN CLINIC', 'THE PHARMACY', 'FOOT CLINIC', 'OPTOMETRIST'],
    sprites: ['nurse', 'deliKeeper'],
    pool: KEEPER_IDS,
  },
] as const;

function pickArchetype(rnd: () => number): Archetype {
  const total = ARCHETYPES.reduce((s, a) => s + a.weight, 0);
  let r = rnd() * total;
  for (const a of ARCHETYPES) {
    r -= a.weight;
    if (r <= 0) return a;
  }
  return ARCHETYPES[0];
}

/* --------------------------- interior builder --------------------------- */

interface UnitArgs {
  id: string;
  name: string;
  w: number;
  h: number;
  exitTo: string;
  stepTx: number;
  stepTy: number;
  arch: Archetype;
  rnd: () => number;
}

function furniture(furnish: Furnish, W: number, H: number): PropDef[] {
  // only REGISTERED prop textures: counter, shelf, bench, bookshelf (NOT 'rug' —
  // rug exists as an edge-aware floor TILE only; the room's 'r' entrance tiles
  // already supply the rug visual, a prop 'rug' would be a missing texture)
  const counter = (x: number, y: number): PropDef => ({ sprite: 'counter', x, y, solid: { ox: 0, oy: 4, w: 30, h: 14 } });
  const shelf = (x: number, y: number): PropDef => ({ sprite: 'shelf', x, y, solid: { ox: 0, oy: 12, w: 32, h: 12 } });
  const bench = (x: number, y: number): PropDef => ({ sprite: 'bench', x, y, solid: { ox: 1, oy: 6, w: 20, h: 6 } });
  const bookshelf = (x: number, y: number): PropDef => ({ sprite: 'bookshelf', x, y, solid: { ox: 0, oy: 12, w: 32, h: 12 } });
  switch (furnish) {
    case 'shop':
      return [counter(2, 3), counter(4, 3), shelf(W - 4, 2), shelf(W - 6, 2)];
    case 'cafe':
      return [counter(2, 3), counter(4, 3), counter(6, 3), bench(W - 5, H - 4)];
    case 'office':
      return [counter(Math.round(W / 2) - 2, 3), counter(Math.round(W / 2), 3), bookshelf(2, 2)];
    case 'clinic':
      return [counter(2, 3), bench(4, H - 4), bench(W - 6, H - 4)];
    case 'home':
    default:
      return [bench(3, 3), bookshelf(W - 3, 2)];
  }
}

function buildUnitInterior(a: UnitArgs): MapDef {
  const W = a.w;
  const H = a.h;
  // wood-floor room, wall_int border, 2-wide door gap at the bottom centre
  const rows: string[][] = [];
  for (let y = 0; y < H; y++) {
    const row: string[] = [];
    for (let x = 0; x < W; x++) {
      row.push(x === 0 || x === W - 1 || y === 0 || y === H - 1 ? 'W' : 'w');
    }
    rows.push(row);
  }
  const gap = Math.round(W / 2) - 1;
  rows[H - 1][gap] = 'w';
  rows[H - 1][gap + 1] = 'w';
  // a proper WELCOME RUG just inside the door — floor 'r' tiles (edge-aware, so a
  // 2x2 block reads as one bordered rug). Rugs are FLOOR pieces here, not props:
  // the hero walks ON them. (A prop 'rug' has no texture and renders over you.)
  rows[H - 2][gap] = 'r';
  rows[H - 2][gap + 1] = 'r';
  rows[H - 3][gap] = 'r';
  rows[H - 3][gap + 1] = 'r';

  const props = furniture(a.arch.furnish, W, H);

  // scatter the occupants on free upper-floor cells (clear of walls + the gap)
  const npcs: NpcDef[] = [];
  const [lo, hi] = a.arch.npc;
  const count = lo + Math.floor(a.rnd() * (hi - lo + 1));
  const used = new Set<string>();
  let guard = 40;
  while (npcs.length < count && guard-- > 0) {
    const x = 2 + Math.floor(a.rnd() * (W - 4));
    const y = 3 + Math.floor(a.rnd() * Math.max(1, H - 6));
    const key = `${x},${y}`;
    if (used.has(key)) continue;
    used.add(key);
    npcs.push({
      id: `${a.id}_p${npcs.length}`,
      sprite: a.arch.sprites[Math.floor(a.rnd() * a.arch.sprites.length)],
      x,
      y,
      facing: 'down',
      dialogue: a.arch.pool[Math.floor(a.rnd() * a.arch.pool.length)],
    });
  }

  return {
    id: a.id,
    name: a.name,
    music: null,
    interior: true,
    grid: rows.map((r) => r.join('')),
    props,
    npcs,
    signs: [],
    phones: [],
    doors: [
      {
        x: gap,
        y: H - 1,
        w: 2,
        h: 1,
        to: a.exitTo,
        tx: a.stepTx,
        ty: a.stepTy,
        facing: 'down',
        indicator: 'mat',
      },
    ],
    spawners: [],
    triggers: [],
  };
}

/* ----------------------------- street dressing ----------------------------- */

/** sparse, prop-only flavor on wide blank pavement (never seals a lane — props
 *  are invisible to the TILE reachability sweep, and we only drop on open cells) */
function dressStreets(map: MapDef, rnd: () => number): void {
  const grid = map.grid;
  const H = grid.length;
  const Wd = grid[0]?.length ?? 0;
  const isPave = (x: number, y: number): boolean => y >= 0 && x >= 0 && y < H && x < Wd && grid[y][x] === '=';
  const taken = new Set<string>();
  for (const p of map.props) taken.add(`${Math.round(p.x)},${Math.round(p.y)}`);
  const dress: Array<{ sprite: string; solid?: { ox: number; oy: number; w: number; h: number } }> = [
    { sprite: 'bench', solid: { ox: 1, oy: 6, w: 20, h: 6 } },
    { sprite: 'trash_can', solid: { ox: 2, oy: 10, w: 10, h: 7 } },
    { sprite: 'phone_pole' },
  ];
  for (let y = 2; y < H - 2; y++) {
    for (let x = 2; x < Wd - 2; x++) {
      if (!isPave(x, y)) continue;
      // only an open plaza cell (all four neighbours pavement) — never a corridor
      if (!isPave(x - 1, y) || !isPave(x + 1, y) || !isPave(x, y - 1) || !isPave(x, y + 1)) continue;
      if (taken.has(`${x},${y}`)) continue;
      if (rnd() >= 0.02) continue;
      const d = dress[Math.floor(rnd() * dress.length)];
      map.props.push({ sprite: d.sprite, x, y, ...(d.solid ? { solid: d.solid } : {}) });
      taken.add(`${x},${y}`);
    }
  }
}

/* ------------------------------- the pass ------------------------------- */

export interface OccupyOpts {
  /** the §A5/§A6 area (for the seed + future per-region flavor) */
  area: string;
  seed: number;
}

/** Fill a built city map with purpose. Mutates `map`; returns its new interiors. */
export function occupyCity(map: MapDef, opts: OccupyOpts): Record<string, MapDef> {
  const rnd = mulberry32(opts.seed >>> 0);
  const interiors: Record<string, MapDef> = {};
  // DOORLESS catalog facades only — occupyCity never overrides a hand-authored door.
  const facades = map.props.filter((p) => p.sprite.startsWith('bldg_') && p.solid && !p.door);
  // THE LAW IS GUARANTEED, NOT GAMBLED. Lock a fixed ~10% COUNT, never a per-facade
  // coin flip: an independent Bernoulli lock can, on an unlucky seed, roll >25% of a
  // small city's facades shut and push it under the 75% Living-City Law — which is
  // exactly how a derived-seed city (puerto_sol) regressed once the hand-tuned seeds
  // were dropped. A rounded count keeps EVERY settlement ~90% enterable by
  // construction, so no present-or-future city can breach the law on bad luck. WHICH
  // facades lock is still seeded, so a city's tenancy stays deterministic per save.
  //
  // SEALED facades (ADR-098) are ALWAYS locked, on top of the ~10%: a bank fronts an
  // ATM, not an apartment, so occupy gives it a knock — never an auto-door that would
  // overwrite the hand-sealed canon (e.g. the Brickton SAVINGS & LOAN stays shut).
  const isSealed = (i: number): boolean => SEALED_FACADE_SPRITES.has(facades[i].sprite);
  const order = facades.map((_p, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const lockCount = Math.round(facades.length * 0.1);
  const sealed = order.filter(isSealed);
  const open = order.filter((i) => !isSealed(i));
  const locked = new Set<number>([...sealed, ...open.slice(0, Math.max(0, lockCount - sealed.length))]);

  let unit = 0;
  facades.forEach((p, idx) => {
    const { w, u } = facadeDims(p.sprite);
    const Hpx = cityBuildingHeight(u);
    const ox = Math.round((w * 16) / 2) - 8;
    const oy = Hpx - 14;
    if (locked.has(idx)) {
      // LOCKED — a knock-knock sign at the would-be door tile (read facing up)
      const sx = Math.floor((p.x * 16 + ox + 8) / 16);
      const sy = Math.floor((p.y * 16 + oy + 9) / 16);
      const sign: SignDef = { x: sx, y: sy, dialogue: KNOCK_IDS[Math.floor(rnd() * KNOCK_IDS.length)] };
      map.signs.push(sign);
      return;
    }
    // ENTERABLE — a door into a footprint-sized interior
    const arch = pickArchetype(rnd);
    const iw = clamp(Math.round(w * 2.2) + 2, 9, 30);
    const ih = clamp(7 + Math.min(u, 5) * 2, 8, 18);
    const id = `${map.id}_unit_${unit++}`;
    const spawnTx = Math.floor(iw / 2) * 16;
    const spawnTy = (ih - 2) * 16;
    p.door = { ox, oy, w: 16, h: 18, to: id, tx: spawnTx, ty: spawnTy };
    const stepTx = p.x * 16 + ox + 8;
    const stepTy = p.y * 16 + oy + 23; // door.h (18) + 5, matches doorstepOf
    const name = arch.names[Math.floor(rnd() * arch.names.length)];
    interiors[id] = buildUnitInterior({ id, name, w: iw, h: ih, exitTo: map.id, stepTx, stepTy, arch, rnd });
  });
  dressStreets(map, rnd);
  return interiors;
}
