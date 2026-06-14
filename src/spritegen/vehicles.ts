/**
 * THE VEHICLE FORGE (S18 Movement 26, ADR-067) — a DETERMINISTIC catalog of
 * hand-drawn vehicles the living world drives, the control system borrows, and
 * the fleet scales into. Like the building catalog (ADR-050): a handful of
 * silhouette draws, each parametrised by a wall-ramp PAINT pool, fan out into
 * many named, seeded variants — no Math.random (Prime Law 2), pixel-clean under
 * ADR-020 (flat fills, deliberate marks, outline() last, shadows never outlined).
 *
 * Every vehicle is drawn FACING RIGHT in a clean 3/4 read so it stands against
 * the 16×24 hero; the traffic system flips/rotates it. Each TYPE carries its
 * true gameplay data in VEHICLE_SPECS: a `seats` count (usable-to-ride =
 * seats − 1, the §A4.10 seat-fit law), a collision FOOTPRINT, and the TERRAIN
 * it travels (road / water / air — the fleet's scale-up axis). The validator
 * pins VEHICLE_CATALOG ⇄ VEHICLE_SPECS both directions.
 */
import { RAMP, px, C, T } from '../palette';
import { Pixmap, mulberry32 } from './pixmap';

export type VehicleTerrain = 'road' | 'water' | 'air';
export type VehicleClass =
  | 'bike' | 'moto' | 'car' | 'suv' | 'van' | 'bus' | 'truck' | 'machine'
  | 'boat' | 'sub' | 'plane' | 'heli' | 'prop';

export interface VehicleSpec {
  /** silhouette family (for grouping + the seat-fit reads) */
  cls: VehicleClass;
  /** the layer it travels — the fleet scales road → water → air */
  terrain: VehicleTerrain;
  /** TOTAL seats incl. the driver; usable-to-ride = seats − 1 (§A4.10) */
  seats: number;
  /** sprite size (px), facing right */
  w: number;
  h: number;
  /** collision footprint relative to the sprite top-left (traffic + parking) */
  solid: { ox: number; oy: number; w: number; h: number };
  /** the PAINT-ramp draw (deterministic; rng only seeds tiny per-unit marks) */
  draw: (ramp: number, rng: () => number) => Pixmap;
}

/* ─── paint helpers ──────────────────────────────────────────────────────── */

function paint(ramp: number): { dark: number; mid: number; body: number; lite: number } {
  return { dark: px(ramp, 0), mid: px(ramp, 1), body: px(ramp, 2), lite: px(ramp, 3) };
}
const GLASS = px(RAMP.CYAN, 2);
const GLASS_D = px(RAMP.CYAN, 1);
const TIRE = px(RAMP.INK, 1);
const HUB = px(RAMP.PAPER, 1);
const CHROME = C.white;
const LAMP = px(RAMP.GOLD, 3);
const TAIL = px(RAMP.RED, 2);
const SHADOW = px(RAMP.INK, 1);

/** a clean little wheel: dark tire block with a bright hub pip */
function wheel(pm: Pixmap, x: number, yBottom: number, r = 3): void {
  pm.rect(x, yBottom - r * 2 + 1, r * 2, r * 2 - 1, TIRE);
  pm.set(x + 1, yBottom - r * 2 + 1, T); // round the top corners
  pm.set(x + r * 2 - 2, yBottom - r * 2 + 1, T);
  pm.rect(x + r - 1, yBottom - r - 1, 2, 2, HUB);
}

/* ─── ROAD: cars (sedan / suv / ev / race share one body draw) ───────────── */

interface CarOpts {
  len: number;        // body length
  roofH: number;      // cabin height above the belt line
  roofX0: number;     // cabin starts
  roofX1: number;     // cabin ends
  wedge?: boolean;    // race-car low nose
  tall?: boolean;     // SUV taller body
  // M35 (ADR-076) — the EXOTIC tier reads unmistakably expensive:
  open?: boolean;     // convertible roadster — no greenhouse, headrests + a cut windshield
  scoop?: boolean;    // a hood scoop (the hot-rod muscle car)
  pipes?: boolean;    // side exhaust pips (the muscle car)
  chrome?: boolean;   // a chrome belt accent strip (the grand tourer / the limo)
  pillars?: number[]; // extra glass B-pillars at these x (the limo's long greenhouse)
}
function drawCarBody(o: CarOpts, ramp: number, _rng: () => number): Pixmap {
  const p = paint(ramp);
  const W = o.len + 2;
  const beltY = o.tall ? 9 : 8;          // top of the lower body
  const floorY = beltY + (o.tall ? 7 : 6); // body bottom (wheels hang below)
  const H = floorY + 5;
  const pm = new Pixmap(W, H);
  const x0 = 1;
  const x1 = W - 2;
  // lower body (a touch of taper at the nose for a 3/4 read)
  pm.rect(x0, beltY, x1 - x0 + 1, floorY - beltY, p.body);
  pm.hline(x0, floorY, x1 - x0 + 1, p.dark);
  pm.hline(x0, beltY + 1, x1 - x0 + 1, p.lite); // belt highlight
  if (o.wedge) { pm.set(x1, beltY, T); pm.set(x1 - 1, beltY, p.lite); }
  // M35: a chrome accent rocker strip says "money" along the lower flank
  if (o.chrome) pm.hline(x0 + 1, floorY - 2, x1 - x0 - 2, CHROME);
  const ry = beltY - o.roofH;
  if (o.open) {
    // CONVERTIBLE: an open cabin — a cut windshield up front + two headrests,
    // the cabin floor showing instead of a roof (the roadster's whole appeal)
    pm.line(o.roofX1 - 2, beltY - 1, o.roofX1, ry, GLASS);     // raked windshield
    pm.line(o.roofX1 - 1, beltY - 1, o.roofX1 + 1, ry, CHROME); // its bright frame
    pm.rect(o.roofX0 + 1, beltY - 2, 2, 2, p.dark);            // driver headrest
    pm.rect(o.roofX0 + 4, beltY - 2, 2, 2, p.dark);            // passenger headrest
    pm.hline(o.roofX0, beltY - 1, o.roofX1 - o.roofX0 - 1, p.lite); // tonneau lip
  } else {
    // cabin / greenhouse
    pm.rect(o.roofX0, ry, o.roofX1 - o.roofX0, o.roofH, p.mid);
    pm.hline(o.roofX0, ry, o.roofX1 - o.roofX0, p.lite);
    // windows (windshield slanted + side glass)
    pm.rect(o.roofX0 + 1, ry + 1, o.roofX1 - o.roofX0 - 2, o.roofH - 1, GLASS);
    pm.vline(Math.floor((o.roofX0 + o.roofX1) / 2), ry + 1, o.roofH - 1, p.mid); // B-pillar
    for (const px2 of o.pillars ?? []) pm.vline(px2, ry + 1, o.roofH - 1, p.mid); // limo pillars
    pm.set(o.roofX1 - 1, ry + 1, GLASS_D);
  }
  // M35: a hood scoop + side pipes — the hot-rod read
  if (o.scoop) { pm.rect(o.roofX1 + 1, beltY - 2, 3, 2, p.dark); pm.hline(o.roofX1 + 1, beltY - 2, 3, p.lite); }
  if (o.pipes) for (let i = 0; i < 3; i++) pm.set(x0 + 3 + i * 2, floorY - 1, CHROME);
  // lamps + bumper
  pm.rect(x1 - 1, beltY + 1, 1, 2, LAMP);
  pm.rect(x0, beltY + 1, 1, 2, TAIL);
  pm.hline(x0, floorY - 1, 2, CHROME);
  // wheels
  wheel(pm, x0 + 2, floorY + 4);
  wheel(pm, x1 - 6, floorY + 4);
  pm.shadowUnder(Math.floor(W / 2), H - 1, Math.floor(W / 2) - 1, SHADOW);
  pm.outline(C.outline);
  // a single pure-light glint on the windshield AFTER the contour (ADR-020)
  if (!o.open) pm.set(o.roofX1 - 2, ry + 1, CHROME);
  return pm;
}

/* ─── ROAD: vans / buses (box bodies, windows in a row) ──────────────────── */

function drawBox(len: number, win: number, ramp: number, _rng: () => number, tall = false): Pixmap {
  const p = paint(ramp);
  const W = len + 2;
  const roofY = 2;
  const floorY = tall ? 17 : 14;
  const H = floorY + 5;
  const pm = new Pixmap(W, H);
  const x0 = 1;
  const x1 = W - 2;
  pm.rect(x0, roofY, x1 - x0 + 1, floorY - roofY, p.body);
  pm.hline(x0, roofY, x1 - x0 + 1, p.lite);
  pm.hline(x0, floorY, x1 - x0 + 1, p.dark);
  pm.hline(x0, roofY + 3, x1 - x0 + 1, p.mid); // roof rail
  // a strip of windows
  const wy = roofY + 4;
  for (let i = 0; i < win; i++) {
    const wx = x0 + 2 + i * 5;
    if (wx + 3 > x1) break;
    pm.rect(wx, wy, 3, 3, GLASS);
    pm.set(wx + 2, wy, GLASS_D);
  }
  // door seam + lamps
  pm.vline(x1 - 4, wy, floorY - wy, p.dark);
  pm.rect(x1 - 1, floorY - 3, 1, 2, LAMP);
  pm.rect(x0, floorY - 3, 1, 2, TAIL);
  wheel(pm, x0 + 3, floorY + 4);
  wheel(pm, x1 - 7, floorY + 4);
  pm.shadowUnder(Math.floor(W / 2), H - 1, Math.floor(W / 2) - 1, SHADOW);
  pm.outline(C.outline);
  return pm;
}

/* ─── ROAD: trucks (cab + flat/dump bed) ─────────────────────────────────── */

function drawTruck(ramp: number, _rng: () => number, dump = false): Pixmap {
  const p = paint(ramp);
  const W = 38;
  const floorY = 16;
  const H = floorY + 6;
  const pm = new Pixmap(W, H);
  // cab (right) + bed (left)
  const cabX = W - 13;
  pm.rect(cabX, 3, 12, floorY - 3, p.body); // cab body
  pm.rect(cabX + 2, 4, 8, 5, GLASS);        // cab window
  pm.set(cabX + 9, 4, GLASS_D);
  if (dump) {
    // raised dump box
    const gray = px(RAMP.PAPER, 0);
    pm.rect(2, 4, cabX - 3, floorY - 4, gray);
    pm.hline(2, 4, cabX - 3, px(RAMP.PAPER, 1));
    pm.line(2, 4, cabX - 3, 8, p.dark); // tipped lip
  } else {
    // flatbed with stake sides
    pm.rect(2, 8, cabX - 3, floorY - 8, px(RAMP.EARTH, 1));
    pm.hline(2, 8, cabX - 3, px(RAMP.EARTH, 2));
    for (let x = 3; x < cabX - 3; x += 4) pm.vline(x, 5, 4, px(RAMP.EARTH, 0));
  }
  pm.hline(2, floorY, W - 4, p.dark);
  pm.rect(W - 2, floorY - 4, 1, 2, LAMP);
  wheel(pm, 4, floorY + 4);
  wheel(pm, cabX, floorY + 4);
  wheel(pm, cabX + 6, floorY + 4);
  pm.shadowUnder(Math.floor(W / 2), H - 1, Math.floor(W / 2) - 1, SHADOW);
  pm.outline(C.outline);
  return pm;
}

/* ─── ROAD: motorcycle / bicycle ─────────────────────────────────────────── */

function drawMoto(ramp: number, _rng: () => number): Pixmap {
  const p = paint(ramp);
  const pm = new Pixmap(22, 16);
  const floorY = 11;
  // frame + tank + seat
  pm.rect(6, 6, 10, 4, p.body);
  pm.hline(6, 6, 10, p.lite);
  pm.rect(14, 5, 4, 3, p.mid); // handlebars/fairing
  pm.rect(4, 7, 3, 3, p.dark); // seat hump
  wheel(pm, 2, floorY + 4, 3);
  wheel(pm, 15, floorY + 4, 3);
  pm.rect(17, 6, 1, 2, LAMP);
  pm.shadowUnder(11, 15, 9, SHADOW);
  pm.outline(C.outline);
  return pm;
}
function drawBike(ramp: number, _rng: () => number): Pixmap {
  const p = paint(ramp);
  const pm = new Pixmap(20, 16);
  const floorY = 11;
  // two thin wheels + a diamond frame (the paperboy's ride)
  wheel(pm, 2, floorY + 4, 3);
  wheel(pm, 13, floorY + 4, 3);
  pm.line(4, floorY + 1, 10, 5, p.body);   // down tube
  pm.line(10, 5, 15, floorY + 1, p.body);  // seat tube
  pm.line(4, floorY + 1, 15, floorY + 1, p.body); // bottom
  pm.rect(9, 4, 3, 2, p.mid);  // seat
  pm.rect(15, 3, 2, 3, p.dark); // handlebars
  pm.set(10, 4, p.lite);
  pm.shadowUnder(10, 15, 8, SHADOW);
  pm.outline(C.outline);
  return pm;
}

/* ─── M35 (ADR-076): the two-wheeler tier — BMX, road bike, cruiser, sport ─ */

function drawBmx(ramp: number, _rng: () => number): Pixmap {
  const p = paint(ramp);
  const pm = new Pixmap(18, 16);
  const floorY = 10;
  // fat little 20" wheels
  wheel(pm, 2, floorY + 4, 3);
  wheel(pm, 11, floorY + 4, 3);
  // compact diamond frame
  pm.line(4, floorY + 1, 9, 6, p.body);   // down tube
  pm.line(9, 6, 13, floorY + 1, p.body);  // seat tube
  pm.line(4, floorY + 1, 13, floorY + 1, p.body); // chainstay
  pm.rect(8, 5, 3, 2, p.mid);  // seat
  // the tall BMX bars (a kid's ride)
  pm.vline(13, 2, 4, p.dark);
  pm.hline(11, 2, 4, p.dark);
  pm.set(9, 6, p.lite);
  pm.shadowUnder(9, 15, 7, SHADOW);
  pm.outline(C.outline);
  return pm;
}
function drawRoadBike(ramp: number, _rng: () => number): Pixmap {
  const p = paint(ramp);
  const pm = new Pixmap(22, 16);
  const floorY = 8;
  // big thin 700c wheels
  wheel(pm, 2, floorY + 6, 4);
  wheel(pm, 13, floorY + 6, 4);
  // a low, long racing diamond
  pm.line(5, 12, 11, 5, p.body);  // down tube
  pm.line(11, 5, 16, 12, p.body); // seat tube
  pm.line(5, 12, 16, 12, p.body); // bottom
  pm.line(11, 5, 16, 5, p.mid);   // top tube → bars
  pm.rect(10, 4, 3, 2, p.lite);   // saddle
  // dropped racing bars
  pm.set(17, 5, p.dark); pm.set(17, 6, p.dark); pm.set(16, 7, p.dark);
  pm.shadowUnder(11, 15, 9, SHADOW);
  pm.outline(C.outline);
  return pm;
}
function drawCruiser(ramp: number, _rng: () => number): Pixmap {
  const p = paint(ramp);
  const pm = new Pixmap(26, 16);
  const floorY = 10;
  // long, low tank + a stepped seat
  pm.rect(7, 6, 11, 4, p.body);
  pm.hline(7, 6, 11, p.lite);
  pm.rect(4, 7, 4, 3, p.dark);  // stepped saddle
  pm.rect(18, 5, 4, 3, p.mid);  // headlight nacelle
  // big lazy wheels
  wheel(pm, 1, floorY + 4, 4);
  wheel(pm, 18, floorY + 4, 4);
  pm.rect(21, 6, 1, 2, LAMP);
  pm.line(20, 5, 23, 3, p.dark); // swept-back ape-hangers
  pm.shadowUnder(13, 15, 12, SHADOW);
  pm.outline(C.outline);
  return pm;
}
function drawSportBike(ramp: number, _rng: () => number): Pixmap {
  const p = paint(ramp);
  const pm = new Pixmap(24, 16);
  const floorY = 10;
  // a crouched, faired body that rises to the nose
  pm.rect(6, 6, 12, 4, p.body);
  pm.line(18, 6, 21, 4, p.body); // nose fairing climbing
  pm.rect(18, 4, 3, 3, p.mid);   // front cowl
  pm.rect(4, 5, 3, 3, p.dark);   // raised tail unit
  pm.set(20, 5, GLASS);          // tinted screen
  wheel(pm, 2, floorY + 4, 3);
  wheel(pm, 16, floorY + 4, 3);
  pm.rect(20, 6, 1, 2, LAMP);
  pm.shadowUnder(12, 15, 11, SHADOW);
  pm.outline(C.outline);
  return pm;
}

/* ─── ROAD: heavy machinery (excavator) + street dressing (trash cans) ───── */

function drawExcavator(ramp: number, _rng: () => number): Pixmap {
  const p = paint(ramp);
  const pm = new Pixmap(34, 22);
  const floorY = 17;
  // tracks
  pm.rect(2, floorY - 2, 22, 4, px(RAMP.INK, 1));
  for (let x = 3; x < 24; x += 3) pm.set(x, floorY, HUB);
  // cab
  pm.rect(4, 6, 10, floorY - 8, p.body);
  pm.rect(5, 7, 6, 4, GLASS);
  pm.hline(4, 6, 10, p.lite);
  // boom + bucket (reaching right)
  pm.line(13, 9, 24, 4, px(RAMP.GOLD, 2));
  pm.line(24, 4, 30, 10, px(RAMP.GOLD, 2));
  pm.rect(28, 9, 5, 5, px(RAMP.PAPER, 0)); // bucket
  pm.line(28, 14, 33, 11, p.dark);          // teeth
  pm.shadowUnder(13, 21, 12, SHADOW);
  pm.outline(C.outline);
  return pm;
}
function drawTrashCans(ramp: number, _rng: () => number): Pixmap {
  const p = paint(ramp);
  const pm = new Pixmap(16, 16);
  for (const cx of [3, 9]) {
    pm.rect(cx, 5, 5, 9, p.mid);
    pm.hline(cx, 5, 5, p.lite);
    pm.rect(cx - 1, 3, 7, 2, p.dark); // lid
    pm.vline(cx + 2, 6, 7, p.dark);    // rib
  }
  pm.shadowUnder(8, 15, 7, SHADOW);
  pm.outline(C.outline);
  return pm;
}

/* ─── WATER: boat / yacht / submarine (top of hull, facing right) ────────── */

function drawHull(len: number, deckH: number, ramp: number, _rng: () => number, cabin = true): Pixmap {
  const p = paint(ramp);
  const W = len + 2;
  const waterY = deckH + 6;
  const H = waterY + 4;
  const pm = new Pixmap(W, H);
  // hull (pointed bow on the right)
  for (let i = 0; i < deckH; i++) {
    const inset = Math.max(0, deckH - 2 - i);
    pm.hline(1 + Math.floor(inset / 2), deckH + i, W - 2 - inset, p.body);
  }
  // bow point
  pm.line(W - 2, deckH, W - 2, deckH + deckH - 1, p.dark);
  pm.hline(1, deckH, W - 2, p.lite);
  pm.hline(1, deckH + deckH, W - 2, p.dark);
  if (cabin) {
    pm.rect(3, deckH - 5, len - 12, 5, px(RAMP.PAPER, 2));
    pm.rect(4, deckH - 4, len - 14, 3, GLASS);
    pm.hline(3, deckH - 5, len - 12, CHROME);
  }
  // a little wake under the hull
  pm.hline(2, waterY, W - 4, px(RAMP.CYAN, 3));
  pm.hline(3, waterY + 1, W - 6, GLASS);
  pm.outline(C.outline);
  return pm;
}
function drawSub(ramp: number, _rng: () => number): Pixmap {
  const p = paint(ramp);
  const pm = new Pixmap(40, 16);
  pm.ellipse(20, 9, 18, 4, p.body);
  pm.ellipse(20, 8, 18, 3, p.lite);
  pm.rect(16, 2, 6, 4, p.mid); // conning tower
  pm.vline(19, 0, 3, p.dark);   // periscope
  pm.rect(8, 8, 4, 2, GLASS);   // porthole
  pm.rect(26, 8, 4, 2, GLASS);
  pm.outline(C.outline);
  return pm;
}

/* ─── AIR: plane / jet / jumbo / heli / blimp (top-down-ish, nose right) ─── */

function drawPlane(span: number, ramp: number, _rng: () => number, jet = false): Pixmap {
  const p = paint(ramp);
  const W = span + 8;
  const H = 22;
  const pm = new Pixmap(W, H);
  const midY = 10;
  // fuselage
  pm.rect(2, midY - 2, W - 4, 5, p.body);
  pm.line(W - 2, midY, W - 6, midY - 2, p.dark); // nose
  pm.line(W - 2, midY, W - 6, midY + 2, p.dark);
  pm.hline(2, midY - 2, W - 4, p.lite);
  // wings (swept)
  pm.line(Math.floor(W / 2) + 3, midY, Math.floor(W / 2) - 4, 1, p.mid);
  pm.line(Math.floor(W / 2) + 3, midY, Math.floor(W / 2) - 4, H - 2, p.mid);
  pm.line(Math.floor(W / 2) + 6, midY, Math.floor(W / 2) + 1, 2, p.mid);
  pm.line(Math.floor(W / 2) + 6, midY, Math.floor(W / 2) + 1, H - 3, p.mid);
  // tail
  pm.line(4, midY, 7, 3, p.mid);
  pm.line(4, midY, 7, H - 4, p.mid);
  // cockpit + windows
  pm.rect(W - 9, midY - 1, 3, 2, GLASS);
  if (jet) { pm.rect(Math.floor(W / 2) - 6, midY + 3, 3, 2, px(RAMP.INK, 2)); } // engine pod
  else { for (let x = 6; x < W - 10; x += 3) pm.set(x, midY, GLASS_D); }
  pm.outline(C.outline);
  return pm;
}
function drawHeli(ramp: number, _rng: () => number): Pixmap {
  const p = paint(ramp);
  const pm = new Pixmap(34, 18);
  pm.ellipse(12, 10, 9, 5, p.body);  // cabin
  pm.ellipse(12, 9, 9, 4, p.lite);
  pm.rect(11, 6, 6, 4, GLASS);        // canopy
  pm.rect(20, 9, 12, 2, p.mid);       // tail boom
  pm.rect(31, 6, 2, 6, p.dark);       // tail fin
  pm.hline(2, 2, 26, px(RAMP.INK, 2)); // main rotor
  pm.vline(12, 2, 4, p.dark);          // mast
  pm.shadowUnder(14, 17, 12, SHADOW);
  pm.outline(C.outline);
  return pm;
}
function drawBlimp(ramp: number, _rng: () => number): Pixmap {
  const p = paint(ramp);
  const pm = new Pixmap(44, 22);
  pm.ellipse(22, 9, 20, 8, p.body);
  pm.ellipse(22, 8, 20, 7, p.lite);
  pm.line(2, 9, 9, 4, p.dark);
  pm.rect(18, 17, 8, 3, px(RAMP.PAPER, 1)); // gondola
  pm.rect(19, 18, 6, 1, GLASS);
  pm.outline(C.outline);
  return pm;
}

/* ─── THE SPEC TABLE — one row per vehicle TYPE ─────────────────────────── */

function box(w: number, h: number, oy = 0): { ox: number; oy: number; w: number; h: number } {
  return { ox: 1, oy: oy, w: w - 2, h: h };
}

export const VEHICLE_SPECS: Record<string, VehicleSpec> = {
  bicycle:     { cls: 'bike',    terrain: 'road', seats: 1,  w: 20, h: 16, solid: box(20, 6, 9),  draw: (r, g) => drawBike(r, g) },
  // M35 (ADR-076) — the two-wheeler tier: real, distinct, drivable bikes + motorcycles
  bmx:         { cls: 'bike',    terrain: 'road', seats: 1,  w: 18, h: 16, solid: box(18, 6, 9),  draw: (r, g) => drawBmx(r, g) },
  road_bike:   { cls: 'bike',    terrain: 'road', seats: 1,  w: 22, h: 16, solid: box(22, 6, 9),  draw: (r, g) => drawRoadBike(r, g) },
  motorcycle:  { cls: 'moto',    terrain: 'road', seats: 2,  w: 22, h: 16, solid: box(22, 6, 9),  draw: (r, g) => drawMoto(r, g) },
  cruiser:     { cls: 'moto',    terrain: 'road', seats: 2,  w: 26, h: 16, solid: box(26, 6, 9),  draw: (r, g) => drawCruiser(r, g) },
  sport_bike:  { cls: 'moto',    terrain: 'road', seats: 2,  w: 24, h: 16, solid: box(24, 6, 9),  draw: (r, g) => drawSportBike(r, g) },
  sedan:       { cls: 'car',     terrain: 'road', seats: 4,  w: 32, h: 19, solid: box(32, 7, 10), draw: (r, g) => drawCarBody({ len: 30, roofH: 5, roofX0: 9,  roofX1: 23 }, r, g) },
  ev:          { cls: 'car',     terrain: 'road', seats: 4,  w: 32, h: 19, solid: box(32, 7, 10), draw: (r, g) => drawCarBody({ len: 30, roofH: 6, roofX0: 8,  roofX1: 24 }, r, g) },
  race_car:    { cls: 'car',     terrain: 'road', seats: 2,  w: 34, h: 19, solid: box(34, 6, 10), draw: (r, g) => drawCarBody({ len: 32, roofH: 3, roofX0: 12, roofX1: 22, wedge: true }, r, g) },
  // M35 (ADR-076) — the HIGH-END / EXOTIC tier (Fortune-Arc priced, seat-fit-correct)
  grand_tourer:{ cls: 'car',     terrain: 'road', seats: 4,  w: 36, h: 19, solid: box(36, 6, 10), draw: (r, g) => drawCarBody({ len: 34, roofH: 4, roofX0: 13, roofX1: 27, wedge: true, chrome: true }, r, g) },
  roadster:    { cls: 'car',     terrain: 'road', seats: 2,  w: 32, h: 19, solid: box(32, 6, 10), draw: (r, g) => drawCarBody({ len: 30, roofH: 3, roofX0: 12, roofX1: 24, open: true, chrome: true }, r, g) },
  limo:        { cls: 'car',     terrain: 'road', seats: 8,  w: 58, h: 19, solid: box(58, 7, 10), draw: (r, g) => drawCarBody({ len: 56, roofH: 5, roofX0: 8, roofX1: 50, chrome: true, pillars: [20, 32, 44] }, r, g) },
  muscle_car:  { cls: 'car',     terrain: 'road', seats: 4,  w: 35, h: 19, solid: box(35, 7, 10), draw: (r, g) => drawCarBody({ len: 33, roofH: 4, roofX0: 11, roofX1: 23, scoop: true, pipes: true }, r, g) },
  suv:         { cls: 'suv',     terrain: 'road', seats: 5,  w: 33, h: 21, solid: box(33, 8, 10), draw: (r, g) => drawCarBody({ len: 31, roofH: 6, roofX0: 8,  roofX1: 26, tall: true }, r, g) },
  large_suv:   { cls: 'suv',     terrain: 'road', seats: 6,  w: 37, h: 21, solid: box(37, 8, 10), draw: (r, g) => drawCarBody({ len: 35, roofH: 6, roofX0: 8,  roofX1: 30, tall: true }, r, g) },
  van:         { cls: 'van',     terrain: 'road', seats: 7,  w: 34, h: 19, solid: box(34, 9, 5),  draw: (r, g) => drawBox(32, 5, r, g) },
  bus:         { cls: 'bus',     terrain: 'road', seats: 12, w: 50, h: 22, solid: box(50, 12, 5), draw: (r, g) => drawBox(48, 8, r, g, true) },
  truck:       { cls: 'truck',   terrain: 'road', seats: 3,  w: 38, h: 22, solid: box(38, 10, 6), draw: (r, g) => drawTruck(r, g, false) },
  dump_truck:  { cls: 'truck',   terrain: 'road', seats: 3,  w: 38, h: 22, solid: box(38, 10, 6), draw: (r, g) => drawTruck(r, g, true) },
  excavator:   { cls: 'machine', terrain: 'road', seats: 1,  w: 34, h: 22, solid: box(26, 8, 8),  draw: (r, g) => drawExcavator(r, g) },
  trash_cans:  { cls: 'prop',    terrain: 'road', seats: 0,  w: 16, h: 16, solid: box(16, 9, 3),  draw: (r, g) => drawTrashCans(r, g) },
  // the fleet — defined now, scaled into by Movements 33 (ADR-035 staging)
  boat:        { cls: 'boat',    terrain: 'water', seats: 4,  w: 34, h: 18, solid: box(34, 8, 6),  draw: (r, g) => drawHull(32, 8, r, g, true) },
  yacht:       { cls: 'boat',    terrain: 'water', seats: 12, w: 52, h: 20, solid: box(52, 10, 8), draw: (r, g) => drawHull(50, 10, r, g, true) },
  submarine:   { cls: 'sub',     terrain: 'water', seats: 6,  w: 40, h: 16, solid: box(40, 8, 4),  draw: (r, g) => drawSub(r, g) },
  small_plane: { cls: 'plane',   terrain: 'air',  seats: 4,  w: 32, h: 22, solid: box(32, 6, 8),  draw: (r, g) => drawPlane(24, r, g, false) },
  fighter_jet: { cls: 'plane',   terrain: 'air',  seats: 1,  w: 36, h: 22, solid: box(36, 6, 8),  draw: (r, g) => drawPlane(28, r, g, true) },
  jumbo_jet:   { cls: 'plane',   terrain: 'air',  seats: 20, w: 52, h: 22, solid: box(52, 6, 8),  draw: (r, g) => drawPlane(44, r, g, true) },
  helicopter:  { cls: 'heli',    terrain: 'air',  seats: 4,  w: 34, h: 18, solid: box(28, 8, 6),  draw: (r, g) => drawHeli(r, g) },
  blimp:       { cls: 'heli',    terrain: 'air',  seats: 8,  w: 44, h: 22, solid: box(44, 14, 2), draw: (r, g) => drawBlimp(r, g) },
};

/** usable seats to RIDE the party (the driver takes one) — §A4.10 seat-fit law */
export function usableSeats(type: string): number {
  return Math.max(0, (VEHICLE_SPECS[type]?.seats ?? 0) - 1);
}

/** TRUE when `partySize` heroes can board `type` (driver borrowed/clickered) */
export function seatsFit(type: string, partySize: number): boolean {
  return usableSeats(type) >= partySize;
}

/* ─── THE CATALOG — several seeded paint variants per type ───────────────── */

const RAMP_NAME: Record<number, string> = {
  [RAMP.RED]: 'red', [RAMP.ORANGE]: 'orange', [RAMP.GOLD]: 'gold', [RAMP.GRASS]: 'grass',
  [RAMP.FOREST]: 'forest', [RAMP.CYAN]: 'cyan', [RAMP.BLUE]: 'blue', [RAMP.PURPLE]: 'purple',
  [RAMP.MAGENTA]: 'magenta', [RAMP.EARTH]: 'earth', [RAMP.PAPER]: 'paper', [RAMP.NIGHT]: 'night',
};

export interface VehicleVariant { name: string; type: string; ramp: number; }

/** paint pools per type — the colors a vehicle of that kind actually comes in */
const PAINTS: Record<string, readonly number[]> = {
  bicycle:     [RAMP.RED, RAMP.BLUE, RAMP.GRASS],
  bmx:         [RAMP.RED, RAMP.GRASS, RAMP.PURPLE],
  road_bike:   [RAMP.BLUE, RAMP.GRASS, RAMP.RED],
  motorcycle:  [RAMP.RED, RAMP.NIGHT, RAMP.BLUE],
  cruiser:     [RAMP.NIGHT, RAMP.RED, RAMP.EARTH],
  sport_bike:  [RAMP.RED, RAMP.BLUE, RAMP.GRASS],
  sedan:       [RAMP.RED, RAMP.BLUE, RAMP.GOLD, RAMP.PAPER, RAMP.FOREST],
  ev:          [RAMP.CYAN, RAMP.PAPER, RAMP.GRASS],
  race_car:    [RAMP.RED, RAMP.GOLD, RAMP.PURPLE],
  grand_tourer:[RAMP.BLUE, RAMP.RED, RAMP.NIGHT, RAMP.GOLD],
  roadster:    [RAMP.RED, RAMP.GOLD, RAMP.PAPER],
  limo:        [RAMP.NIGHT, RAMP.PAPER],
  muscle_car:  [RAMP.RED, RAMP.ORANGE, RAMP.NIGHT],
  suv:         [RAMP.EARTH, RAMP.BLUE, RAMP.PAPER, RAMP.RED],
  large_suv:   [RAMP.NIGHT, RAMP.EARTH, RAMP.PAPER],
  van:         [RAMP.PAPER, RAMP.ORANGE, RAMP.BLUE],
  bus:         [RAMP.GOLD, RAMP.RED, RAMP.GRASS],
  truck:       [RAMP.BLUE, RAMP.RED, RAMP.EARTH],
  dump_truck:  [RAMP.GOLD, RAMP.ORANGE],
  excavator:   [RAMP.GOLD, RAMP.ORANGE],
  trash_cans:  [RAMP.FOREST, RAMP.CYAN],
  boat:        [RAMP.RED, RAMP.BLUE, RAMP.PAPER],
  yacht:       [RAMP.PAPER, RAMP.CYAN],
  submarine:   [RAMP.NIGHT, RAMP.FOREST],
  small_plane: [RAMP.RED, RAMP.PAPER],
  fighter_jet: [RAMP.NIGHT, RAMP.GRASS],
  jumbo_jet:   [RAMP.PAPER, RAMP.BLUE],
  helicopter:  [RAMP.FOREST, RAMP.RED, RAMP.NIGHT],
  blimp:       [RAMP.RED, RAMP.GOLD],
};

function buildCatalog(): VehicleVariant[] {
  const out: VehicleVariant[] = [];
  for (const type of Object.keys(VEHICLE_SPECS)) {
    for (const ramp of PAINTS[type] ?? [RAMP.PAPER]) {
      out.push({ name: `veh_${type}_${RAMP_NAME[ramp] ?? 'paint'}`, type, ramp });
    }
  }
  return out;
}

/** the full, named, seeded vehicle pool — index.ts registers each as a sprite */
export const VEHICLE_CATALOG: readonly VehicleVariant[] = buildCatalog();

const FNV = 0x811c9dc5;
function fnv32(s: string): number {
  let h = FNV;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

/** draw a catalog vehicle by its sprite name (deterministic per name) */
export function drawVehicle(name: string): Pixmap {
  const v = VEHICLE_CATALOG.find((e) => e.name === name);
  if (!v) return new Pixmap(8, 8);
  const spec = VEHICLE_SPECS[v.type];
  return spec.draw(v.ramp, mulberry32(fnv32(name)));
}
