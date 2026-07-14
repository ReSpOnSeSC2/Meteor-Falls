/**
 * occupyCity — THE LIVING-CITY PASS (S18, the "no dead buildings" law).
 *
 * The city generators (buildDistrict / buildPuertoSol — and the editor-authored
 * Twoton document, maps_twoton.ts) emit
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
import {
  CITY_AMENITIES,
  CITY_AMENITY_MARKER_SPRITES,
  cityAmenitySignId,
  cityHotelRoomId,
  cityServiceNpcId,
  type CityAmenityDef,
  type FormalCityId,
  type GeneratedCityAmenityRole,
} from './city_amenities';

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
const SEALED_FACADE_SPRITES: ReadonlySet<string> = new Set([
  'bldg_bank',
  // Historical Chandrapore source position 2 is the sealed civic frontage.
  // Keeping it in the lock pool preserves units 0-3 on either side of it.
  'bldg_chandrapore_civic_hall',
]);

/** Exterior story landmarks, not anonymous tenant shells. Their authored knock
 * signs live on the map, so the Living-City law remains explicit without
 * inventing cinema/station interior map ids outside Chapter 7's fixed roster. */
const NON_TENANTED_FACADE_SPRITES: ReadonlySet<string> = new Set([
  'bldg_chandrapore_majestic_cinema',
  'bldg_chandrapore_station',
]);

/* ----------------------------- tenancy ----------------------------- */

type Furnish = 'home' | 'shop' | 'cafe' | 'office' | 'clinic' | 'music' | 'noodles' | 'video';

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
  // 2026-07-02 venue pass — the signboards that promised a scene now HAVE one
  {
    weight: 7, furnish: 'music', npc: [1, 2],
    names: ['JAZZ KARAOKE PALACE', 'THE VELVET NOTE', 'SING-ALONG LOUNGE', 'OPEN MIC HALL'],
    sprites: ['grayCommuter', 'sidewalkCritic', 'quarterMan'],
    pool: RESIDENT_IDS,
  },
  {
    weight: 7, furnish: 'noodles', npc: [1, 2],
    names: ['NOODLE HOUSE', 'MIDNIGHT RAMEN', 'THE BROTH BAR', 'SLURP CITY'],
    sprites: ['deliKeeper', 'martClerk'],
    pool: KEEPER_IDS,
  },
  {
    weight: 6, furnish: 'video', npc: [1, 1],
    names: ['VIDEO RENTALS', 'TAPE TOWN', 'BE KIND REWIND', 'LATE FEE VIDEO'],
    sprites: ['pajamaKid', 'sidewalkCritic'],
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
  const counter = (x: number, y: number): PropDef => ({ sprite: 'counter', x, y, solid: { ox: 0, oy: 4, w: 30, h: 14 } });
  const bench = (x: number, y: number): PropDef => ({ sprite: 'bench', x, y, solid: { ox: 1, oy: 6, w: 20, h: 6 } });
  const bookshelf = (x: number, y: number): PropDef => ({ sprite: 'bookshelf', x, y, solid: { ox: 0, oy: 12, w: 32, h: 12 } });
  const p = (sprite: string, x: number, y: number, solid?: PropDef['solid']): PropDef => ({ sprite, x, y, ...(solid ? { solid } : {}) });
  // 2026-07-02 (user direction): units read as their SIGNBOARD promises —
  // authored venue sets (eb-venue-props sheet) per archetype, not four
  // recycled counters with a fancy name over the door.
  switch (furnish) {
    case 'shop':
      return [
        p('checkout_lane', 2, H - 4, { ox: 1, oy: 10, w: 40, h: 12 }),
        p('mart_aisle', Math.round(W / 2) - 1, 3, { ox: 0, oy: 12, w: 52, h: 12 }),
        p('mart_aisle', Math.round(W / 2) - 1, 5.4, { ox: 0, oy: 12, w: 52, h: 12 }),
        p('freezer_case', W - 4, 2, { ox: 1, oy: 12, w: 34, h: 12 }),
      ];
    case 'cafe':
      return [
        counter(2, 3), counter(4, 3),
        p('menu_board', 6.2, 1.9),
        p('noodle_stools', 2.6, 4.6, { ox: 2, oy: 8, w: 26, h: 8 }),
        bench(W - 5, H - 4),
      ];
    case 'music':
      return [
        p('karaoke_stage', Math.round(W / 2) - 2, 2, { ox: 2, oy: 26, w: 56, h: 14 }),
        p('neon_note', 2.2, 1.8),
        p('karaoke_booth', 2, H - 5, { ox: 1, oy: 12, w: 40, h: 12 }),
        p('karaoke_booth', W - 5, H - 5, { ox: 1, oy: 12, w: 40, h: 12 }),
      ];
    case 'noodles':
      return [
        p('noodle_counter', Math.round(W / 2) - 2, 2.4, { ox: 0, oy: 14, w: 56, h: 12 }),
        p('noodle_stools', Math.round(W / 2) - 1.6, 4.7, { ox: 2, oy: 8, w: 26, h: 8 }),
        p('menu_board', 2.2, 1.9),
        p('steamer_stack', W - 3.4, 2.2, { ox: 2, oy: 12, w: 18, h: 10 }),
      ];
    case 'video':
      return [
        p('video_shelf', 2, 2.4, { ox: 0, oy: 12, w: 44, h: 12 }),
        p('video_shelf', 2, 5, { ox: 0, oy: 12, w: 44, h: 12 }),
        p('tv_stack', W - 3.6, 2, { ox: 1, oy: 14, w: 22, h: 10 }),
        p('poster_stand', W - 4, H - 5, { ox: 2, oy: 12, w: 16, h: 8 }),
        counter(2, H - 4),
      ];
    case 'office':
      return [counter(Math.round(W / 2) - 2, 3), counter(Math.round(W / 2), 3), bookshelf(2, 2), p('potted_palm', W - 3, H - 4, { ox: 3, oy: 12, w: 10, h: 8 })];
    case 'clinic':
      return [counter(2, 3), bench(4, H - 4), bench(W - 6, H - 4)];
    case 'home':
    default:
      // A residence must read as a LIFE, not two props in an empty rectangle.
      // Keep the door aisle and NPC scatter clear, but furnish distinct sleeping,
      // eating, kitchen, and sitting zones using the authored Otterbrooke domestic
      // kit. This benefits every generated apartment while making the first town's
      // ten residential units feel intentionally inhabited.
      return [
        p('bed', 1.2, 2, { ox: 1, oy: 6, w: 18, h: 22 }),
        p('dresser', 4.2, 1.2, { ox: 2, oy: 8, w: 26, h: 14 }),
        p('tv', Math.max(6, W - 5), 0.6),
        bookshelf(W - 3, 2),
        p('dining_table', Math.round(W / 2) - 1, Math.max(4.5, Math.round(H / 2) - 1), { ox: 2, oy: 12, w: 30, h: 18 }),
        p('rocking_chair', 2, H - 4.2, { ox: 2, oy: 12, w: 14, h: 10 }),
        p('fridge', W - 2.5, H - 4.4, { ox: 2, oy: 14, w: 14, h: 18 }),
        p('floor_lamp', W - 5, H - 4.4, { ox: 6, oy: 26, w: 6, h: 3 }),
      ];
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

/* ----------------------- formal-city amenity layer ----------------------- */

interface CityAmenityInteriorArgs {
  id: string;
  role: GeneratedCityAmenityRole;
  cityId: FormalCityId;
  amenity: CityAmenityDef;
  w: number;
  h: number;
  exitTo: string;
  stepTx: number;
  stepTy: number;
}

function amenityShell(W: number, H: number, wall = 'W', floor = 'w'): string[] {
  const rows: string[][] = [];
  for (let y = 0; y < H; y++) {
    const row: string[] = [];
    for (let x = 0; x < W; x++) {
      row.push(x === 0 || x === W - 1 || y === 0 || y === H - 1 ? wall : floor);
    }
    rows.push(row);
  }
  const gap = Math.round(W / 2) - 1;
  rows[H - 1][gap] = floor;
  rows[H - 1][gap + 1] = floor;
  rows[H - 2][gap] = 'r';
  rows[H - 2][gap + 1] = 'r';
  rows[H - 3][gap] = 'r';
  rows[H - 3][gap + 1] = 'r';
  return rows.map((row) => row.join(''));
}

function amenityExitDoor(a: CityAmenityInteriorArgs) {
  const gap = Math.round(a.w / 2) - 1;
  return {
    x: gap,
    y: a.h - 1,
    w: 2,
    h: 1,
    to: a.exitTo,
    tx: a.stepTx,
    ty: a.stepTy,
    facing: 'down' as const,
    indicator: 'mat' as const,
  };
}

/**
 * Replaces the generic tenant behind a claimed facade while retaining that
 * facade's existing `<city>_unit_N` (or Twoton lot) map/door ID. The service
 * NPC IDs are deliberately coordinate-independent: runtime handlers bind via
 * CITY_SERVICE_NPC_LOOKUP and the city registry.
 */
function buildCityAmenityInterior(a: CityAmenityInteriorArgs): { main: MapDef; room?: MapDef } {
  const W = a.w;
  const H = a.h;
  const gap = Math.round(W / 2) - 1;
  const p = (
    sprite: string,
    x: number,
    y: number,
    extra: Pick<PropDef, 'solid' | 'scale' | 'rot'> = {},
  ): PropDef => ({ sprite, x, y, ...extra });

  let name: string;
  let grid = amenityShell(W, H);
  let props: PropDef[];
  let npc: NpcDef;

  switch (a.role) {
    case 'home':
      name = `OPEN HOUSE — ${a.amenity.residential.listingName.toUpperCase()}`;
      props = [
        p('bed', 1.2, 1.8, { solid: { ox: 1, oy: 6, w: 18, h: 22 } }),
        p('dresser', 4.1, 1.2, { solid: { ox: 2, oy: 8, w: 26, h: 14 } }),
        p('bookshelf', W - 3.2, 1.5, { solid: { ox: 0, oy: 12, w: 32, h: 12 } }),
        p('dining_table', Math.max(3, gap - 2), Math.max(4.2, H / 2 - 1), { solid: { ox: 2, oy: 12, w: 30, h: 18 } }),
        p('rocking_chair', 1.8, H - 4.3, { solid: { ox: 2, oy: 12, w: 14, h: 10 } }),
        p('fridge', W - 2.5, H - 4.5, { solid: { ox: 2, oy: 14, w: 14, h: 18 } }),
        p('floor_lamp', W - 4.5, H - 4.3, { solid: { ox: 6, oy: 26, w: 6, h: 3 } }),
        p('plant_pot', Math.max(2, gap + 2), 1.5),
      ];
      npc = {
        id: cityServiceNpcId(a.cityId, 'home_host'),
        sprite: 'fernLady',
        x: W - 3,
        y: Math.max(3, H - 4),
        facing: 'down',
        dialogue: 'citysvc_home_host',
      };
      break;

    case 'agency':
      name = a.amenity.agency.name.toUpperCase();
      props = [
        p('desk', Math.max(2, gap - 2), 3, { solid: { ox: 0, oy: 8, w: 40, h: 10 } }),
        p('prop_rate_board', W - 4, 1.5),
        p('bookshelf', 1.3, 1.5, { solid: { ox: 0, oy: 12, w: 32, h: 12 } }),
        p('bench', 2, H - 4, { solid: { ox: 1, oy: 6, w: 20, h: 6 } }),
        p('bench', W - 5, H - 4, { solid: { ox: 1, oy: 6, w: 20, h: 6 } }),
        p('potted_palm', W - 2.2, H - 4.3, { solid: { ox: 3, oy: 12, w: 10, h: 8 } }),
        p('poster_chart', Math.max(2, gap + 1), 0.6),
      ];
      npc = {
        id: cityServiceNpcId(a.cityId, 'realtor'),
        sprite: 'npc_realtor',
        x: gap,
        y: 4,
        facing: 'down',
        dialogue: 'citysvc_realtor',
      };
      break;

    case 'dealership': {
      name = a.amenity.dealership.name.toUpperCase();
      // Paved floor + a bright road stripe makes this read as an open-air motor
      // court even though it is a weatherproof interior map.
      const rows = amenityShell(W, H, 'O', 'p').map((row) => row.split(''));
      const stripeY = Math.max(2, Math.min(H - 4, Math.round(H / 2)));
      for (let x = 1; x < W - 1; x++) rows[stripeY][x] = x % 2 === 0 ? '=' : 'p';
      grid = rows.map((row) => row.join(''));
      props = [
        p(a.amenity.dealership.featuredVehicleId, 1.5, 2.2, { scale: 0.62, solid: { ox: 3, oy: 8, w: 30, h: 8 } }),
        p('vehicle_clunker', Math.max(5.5, W - 4.8), Math.max(3.8, H - 4.6), { scale: 0.62, rot: 90, solid: { ox: 3, oy: 8, w: 30, h: 8 } }),
        p('prop_rate_board', W - 3.3, 1.2),
        p('desk', Math.max(2, gap - 1), 1.5, { solid: { ox: 0, oy: 8, w: 30, h: 10 } }),
        p('parking_meter', 1.5, H - 3.8),
        p('flagpole', W - 2.2, H - 4.6),
        p('parking_meter', Math.max(2, gap - 3), H - 3.5),
        p('parking_meter', Math.min(W - 3, gap + 3), H - 3.5),
      ];
      npc = {
        id: cityServiceNpcId(a.cityId, 'dealer'),
        sprite: 'quarterMan',
        x: Math.max(2, W - 3),
        y: Math.max(3, H - 4),
        facing: 'down',
        dialogue: 'citysvc_dealer',
      };
      break;
    }

    case 'hotel':
      name = `${a.amenity.hotel.name.toUpperCase()} — LOBBY`;
      props = [
        p('counter', 2, 3, { solid: { ox: 0, oy: 4, w: 40, h: 14 } }),
        p('counter', 4, 3, { solid: { ox: 0, oy: 4, w: 40, h: 14 } }),
        p('prop_rate_board', 2.2, 1.4),
        p('mailboxes', Math.max(5, W - 4), 1.4),
        p('bench', 2, H - 4, { solid: { ox: 1, oy: 6, w: 20, h: 6 } }),
        p('bench', W - 5, H - 4, { solid: { ox: 1, oy: 6, w: 20, h: 6 } }),
        p('potted_palm', W - 2.3, 2, { solid: { ox: 3, oy: 12, w: 10, h: 8 } }),
        p('floor_lamp', W - 3.7, H - 4.3, { solid: { ox: 6, oy: 26, w: 6, h: 3 } }),
        p('payphone', W - 2, H - 3.4, { solid: { ox: 1, oy: 10, w: 14, h: 16 } }),
      ];
      npc = {
        id: cityServiceNpcId(a.cityId, 'hotel_clerk'),
        sprite: 'npc_clerk',
        x: 3,
        y: 4,
        facing: 'down',
        dialogue: 'citysvc_hotel_clerk',
      };
      break;
  }

  const main: MapDef = {
    id: a.id,
    name,
    music: null,
    interior: true,
    grid,
    props,
    npcs: [npc],
    signs: [],
    phones: a.role === 'hotel' ? [{ x: W - 2, y: H - 3 }] : [],
    doors: [amenityExitDoor(a)],
    spawners: [],
    triggers: [],
  };

  if (a.role !== 'hotel') return { main };

  const roomId = cityHotelRoomId(a.cityId);
  const roomW = 12;
  const roomH = 9;
  const roomGap = Math.round(roomW / 2) - 1;
  main.doors.push({
    x: W - 3,
    y: 1,
    w: 1,
    h: 1,
    to: roomId,
    tx: roomGap * 16,
    ty: (roomH - 2) * 16,
    facing: 'up',
    indicator: 'door',
  });
  const room: MapDef = {
    id: roomId,
    name: `${a.amenity.hotel.name.toUpperCase()} — ROOM`,
    music: null,
    interior: true,
    grid: amenityShell(roomW, roomH),
    props: [
      p('bed', 1.3, 2, { solid: { ox: 1, oy: 6, w: 18, h: 22 } }),
      p('dresser', 4.3, 1.4, { solid: { ox: 2, oy: 8, w: 26, h: 14 } }),
      p('tv', 8.8, 0.7),
      p('rocking_chair', 2.2, 5.3, { solid: { ox: 2, oy: 12, w: 14, h: 10 } }),
      p('floor_lamp', 9.2, 4.8, { solid: { ox: 6, oy: 26, w: 6, h: 3 } }),
      p('phone_table', 8.1, 2.8, { solid: { ox: 1, oy: 8, w: 14, h: 9 } }),
    ],
    npcs: [],
    signs: [],
    phones: [],
    doors: [{
      x: roomGap,
      y: roomH - 1,
      w: 2,
      h: 1,
      to: a.id,
      tx: (W - 3) * 16,
      ty: 2 * 16,
      facing: 'down',
      indicator: 'mat',
    }],
    spawners: [],
    triggers: [],
  };
  return { main, room };
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

/** measured door-center fraction of each authored gen facade's width (see the
 *  occupyCity note) — generated from the PNGs, clamped 0.25..0.75 */
const DOOR_FRAC: Record<string, number> = {
  bldg_gen_bank_paper_2: 0.414,
  bldg_gen_bank_paper_3: 0.43,
  bldg_gen_brownstone_earth_3: 0.44, // hand-corrected (stoop shadow fooled the scan)
  bldg_gen_brownstone_earth_4: 0.579,
  bldg_gen_cafe_blue_1: 0.25,
  bldg_gen_cafe_blue_2: 0.366,
  bldg_gen_cafe_orange_1: 0.635,
  bldg_gen_cafe_red_2: 0.403,
  bldg_gen_civic_cyan_2: 0.428,
  bldg_gen_civic_cyan_3: 0.413,
  bldg_gen_civic_paper_2: 0.405,
  bldg_gen_civic_paper_3: 0.423,
  bldg_gen_deptstore_blue_3: 0.539,
  bldg_gen_deptstore_purple_3: 0.441,
  bldg_gen_market_gold_1: 0.432,
  bldg_gen_market_orange_2: 0.424,
  bldg_gen_neon_magenta_2: 0.412,
  bldg_gen_neon_magenta_3: 0.342,
  bldg_gen_neon_night_2: 0.585,
  bldg_gen_neon_night_3: 0.25,
  bldg_gen_neon_purple_2: 0.415,
  bldg_gen_neon_purple_3: 0.34,
  bldg_gen_shop_gold_2: 0.453,
  bldg_gen_shop_grass_1: 0.495,
  bldg_gen_shop_orange_2: 0.42,
  bldg_gen_shop_red_1: 0.381,
  bldg_gen_shop_red_2: 0.387,
  bldg_gen_theater_blue_3: 0.34,
  bldg_gen_theater_magenta_3: 0.346,
  bldg_gen_theater_purple_3: 0.726,
};

export interface OccupyOpts {
  /** the §A5/§A6 area (for the seed + future per-region flavor) */
  area: string;
  seed: number;
  /** Optional save-stable id for one city's generated units. All callers that
   * omit it retain the historical sequential `<map>_unit_N` contract. */
  unitId?: (facade: Pick<PropDef, 'sprite' | 'x' | 'y'>, sequence: number) => string;
  /** Save-facing unlocked candidates at the front of the facade walk. These
   * candidates can never enter the seeded lock pool, so appending later lots
   * cannot renumber historical unit ids. The option is deliberately opt-in;
   * callers that omit it retain the byte-identical legacy lock shuffle. */
  pinnedUnlockedPrefix?: number;
}

/** Choose service facades by semantic source-name hints while consuming the
 * same unlocked facade set. No prop is moved or replaced and every generated
 * unit id continues to be assigned by the historical facade walk below. */
function amenityFacadeClaims(
  facades: readonly PropDef[],
  unlocked: readonly number[],
  amenity: CityAmenityDef,
  roles: readonly GeneratedCityAmenityRole[],
): Map<number, GeneratedCityAmenityRole> {
  const available = new Set(unlocked);
  const claims = new Map<number, GeneratedCityAmenityRole>();
  for (const role of roles) {
    let chosen: number | undefined;
    for (const hint of amenity.facadeHints[role]) {
      chosen = unlocked.find((idx) => available.has(idx) && facades[idx].sprite.includes(hint));
      if (chosen !== undefined) break;
    }
    chosen ??= unlocked.find((idx) => available.has(idx));
    if (chosen === undefined) continue;
    available.delete(chosen);
    claims.set(chosen, role);
  }
  return claims;
}

function facadeDoorstep(prop: PropDef): { x: number; y: number } | null {
  if (!prop.door) return null;
  const sx = typeof prop.scale === 'number' ? prop.scale : prop.scale?.x ?? 1;
  const sy = typeof prop.scale === 'number' ? prop.scale : prop.scale?.y ?? 1;
  return {
    x: prop.x * 16 + (prop.door.ox + prop.door.w / 2) * sx,
    y: prop.y * 16 + (prop.door.oy + prop.door.h) * sy + 5,
  };
}

/** A collision-free silhouette plus an interactable, city-specific plaque. It
 * sits beside—not on—the door and is appended after all authored props, so the
 * building order, collision, door target, and save-stable unit id never move. */
function addAmenityExteriorMarker(
  map: MapDef,
  cityId: FormalCityId,
  role: GeneratedCityAmenityRole,
  doorstep: { x: number; y: number },
): void {
  const dialogue = cityAmenitySignId(cityId, role);
  if (map.signs.some((sign) => sign.dialogue === dialogue)) return;
  const doorX = Math.floor(doorstep.x / 16);
  const doorY = Math.floor(doorstep.y / 16);
  const candidates: ReadonlyArray<readonly [number, number]> = [
    [doorX - 2, doorY], [doorX + 1, doorY],
    [doorX - 3, doorY], [doorX + 2, doorY],
    [doorX - 2, doorY + 1], [doorX + 1, doorY + 1],
  ];
  const width = map.grid[0]?.length ?? 0;
  const height = map.grid.length;
  const occupied = (x: number, y: number): boolean =>
    map.props.some((prop) => Math.abs(prop.x - x) < 0.8 && Math.abs(prop.y - (y + 0.35)) < 0.8) ||
    map.signs.some((sign) => Math.abs(sign.x - x) < 0.8 && Math.abs(sign.y - y) < 0.8);
  const [x, y] = candidates.find(([cx, cy]) =>
    cx >= 1 && cy >= 1 && cx < width - 1 && cy < height - 1 && !occupied(cx, cy),
  ) ?? [Math.max(1, Math.min(width - 2, doorX - 2)), Math.max(1, Math.min(height - 2, doorY))];
  map.props.push({ sprite: CITY_AMENITY_MARKER_SPRITES[role], x, y: y + 0.35 });
  map.signs.push({ x, y, dialogue });
}

/** Fill a built city map with purpose. Mutates `map`; returns its new interiors. */
export function occupyCity(map: MapDef, opts: OccupyOpts): Record<string, MapDef> {
  const rnd = mulberry32(opts.seed >>> 0);
  const interiors: Record<string, MapDef> = {};
  // DOORLESS catalog facades only — occupyCity never overrides a hand-authored door.
  const facades = map.props.filter(
    (p) => p.sprite.startsWith('bldg_') && p.solid && !p.door && !p.ifFlag && !p.unlessFlag
      && !NON_TENANTED_FACADE_SPRITES.has(p.sprite),
  );
  const requestedPrefix = opts.pinnedUnlockedPrefix ?? 0;
  if (!Number.isInteger(requestedPrefix) || requestedPrefix < 0 || requestedPrefix > facades.length) {
    throw new Error(`${map.id}: pinnedUnlockedPrefix ${requestedPrefix} must be an integer between 0 and ${facades.length}`);
  }
  const pinnedUnlockedPrefix = requestedPrefix;
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
  for (let i = 0; i < pinnedUnlockedPrefix; i++) {
    if (isSealed(i)) {
      throw new Error(`${map.id}: pinned unlocked facade ${i} (${facades[i].sprite}) is canonically sealed`);
    }
  }
  const order = facades.map((_p, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const lockCount = Math.round(facades.length * 0.1);
  const lockEligible = order.filter((i) => i >= pinnedUnlockedPrefix);
  const sealed = lockEligible.filter(isSealed);
  const open = lockEligible.filter((i) => !isSealed(i));
  const locked = new Set<number>([...sealed, ...open.slice(0, Math.max(0, lockCount - sealed.length))]);

  // Formal-city services CLAIM existing generated units; they never add or
  // reorder facade props. We select the first unlocked facade indices in map
  // order so the assignment is stable even if the lock shuffle changes. The two
  // cities with hand-authored hotels only need three claimed services.
  const amenity = (CITY_AMENITIES as Partial<Record<string, CityAmenityDef>>)[map.id];
  const amenityRoles: GeneratedCityAmenityRole[] = amenity
    ? ['home', 'agency', 'dealership', ...(amenity.hotel.existing ? [] : ['hotel' as const])]
    : [];
  const unlockedInMapOrder = facades.map((_p, idx) => idx).filter((idx) => !locked.has(idx));
  const amenityRoleByFacade = amenity
    ? amenityFacadeClaims(facades, unlockedInMapOrder, amenity, amenityRoles)
    : new Map<number, GeneratedCityAmenityRole>();

  let unit = 0;
  facades.forEach((p, idx) => {
    const { w, u } = facadeDims(p.sprite);
    const Hpx = cityBuildingHeight(u);
    // 2026-07-02 (user bug report): the grafted door/mat used the FOOTPRINT
    // center, but the hi-res art's drawn door is rarely centered — mats sat
    // beside doors. DOOR_FRAC is measured from the authored PNGs (darkest
    // bottom-strip run; brownstone_earth_3 hand-corrected for its stoop
    // shadow). Unmeasured keys fall back to center.
    const frac = DOOR_FRAC[p.sprite] ?? 0.5;
    const ox = Math.round(w * 16 * frac) - 8;
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
    // Otterbrooke's named residential art must stay residential. The generic
    // lottery previously turned a green family house into an open-mic hall and
    // the apartments into a general store, which made the first town feel fake.
    const forcedHome =
      map.id === 'otterbrook' &&
      (/^(house_|bldg_ob_house|bldg_ob_cottage)/.test(p.sprite) || p.sprite === 'bldg_apartments' || p.sprite === 'bldg_ob_apt_green' || p.sprite === 'bldg_brickmore');
    const arch = forcedHome ? ARCHETYPES.find((a) => a.furnish === 'home')! : pickArchetype(rnd);
    const iw = clamp(Math.round(w * 2.2) + 2, 9, 30);
    const ih = clamp(7 + Math.min(u, 5) * 2, 8, 18);
    const id = opts.unitId?.(p, unit) ?? `${map.id}_unit_${unit}`;
    unit++;
    const spawnTx = Math.floor(iw / 2) * 16;
    const spawnTy = (ih - 2) * 16;
    p.door = { ox, oy, w: 16, h: 18, to: id, tx: spawnTx, ty: spawnTy };
    const stepTx = p.x * 16 + ox + 8;
    const stepTy = p.y * 16 + oy + 23; // door.h (18) + 5, matches doorstepOf
    const name = arch.names[Math.floor(rnd() * arch.names.length)];
    // Always build the generic tenant first, even for a claimed amenity, to
    // consume the historical RNG sequence. That keeps all later unit furnishing
    // and occupants byte-stable while replacing only the selected unit's data.
    const generic = buildUnitInterior({ id, name, w: iw, h: ih, exitTo: map.id, stepTx, stepTy, arch, rnd });
    const amenityRole = amenityRoleByFacade.get(idx);
    if (!amenity || !amenityRole) {
      interiors[id] = generic;
      return;
    }
    const built = buildCityAmenityInterior({
      id,
      role: amenityRole,
      cityId: amenity.cityId,
      amenity,
      w: iw,
      h: ih,
      exitTo: map.id,
      stepTx,
      stepTy,
    });
    interiors[id] = built.main;
    if (built.room) interiors[built.room.id] = built.room;
    addAmenityExteriorMarker(map, amenity.cityId, amenityRole, { x: stepTx, y: stepTy });
  });
  if (amenity?.hotel.existing) {
    const hotelFacade = map.props.find((prop) => prop.door?.to === amenity.hotel.existing!.lobbyId);
    const doorstep = hotelFacade ? facadeDoorstep(hotelFacade) : null;
    if (doorstep) addAmenityExteriorMarker(map, amenity.cityId, 'hotel', doorstep);
  }
  dressStreets(map, rnd);
  return interiors;
}
