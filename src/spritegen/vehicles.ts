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
  | 'boat' | 'sub' | 'plane' | 'heli' | 'prop'
  | 'tank'   // M39 (ADR-080) — the military motor pool's new silhouette family
  | 'rocket'; // M48 (ADR-089) — The Long Shot, the Earth↔Mars shuttle

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
  /** M36 (ADR-077): an autopilot toy — this craft can SELF-CREEP driver-less in a
   *  cleared lot (no Clicker needed), the Nikolai's "summon" gag. control.ts gates it. */
  selfDrive?: boolean;
  /** M39 (ADR-080): military hardware is Faraday/DEAD-AIR shielded by default — the
   *  army hardens its kit against exactly the kid with the remote. A hardened machine
   *  refuses the Clicker (the existing `shielded` spine) until the shield is knocked off. */
  hardened?: boolean;
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

/* ════════════════════════════════════════════════════════════════════════
 * ADR-097 — OBLIQUE 3D VEHICLES. A car is no longer a flat side elevation: we
 * build a clean side PROFILE and EXTRUDE its top + front edges up-right by
 * `depth`, so the lit roof/hood top plane, the near flank, and the front face
 * all read at once (the building-roof oblique, now on wheels). We also draw a
 * matching FRONT and BACK face, so the traffic system TURNS a car onto a
 * vertical road by swapping frames — never by rotating a 3/4 sprite. Bodies are
 * sized big enough that the 24px cast visibly fits (§A4.10 seat-fit, now visual).
 * ════════════════════════════════════════════════════════════════════════ */

export interface CarBody {
  len: number;   // side body length
  width: number; // front/back width (top-down)
  bodyH: number; // lower-body height (side)
  cabH: number;  // cabin/greenhouse height
  cab0: number;  // cabin start along len (car)
  cab1: number;  // cabin end along len (car)
  depth: number; // oblique extrusion length (the 3D read)
  axles: number; // wheels per side (2 or 3)
  box?: boolean; // van/bus: a tall slab cabin with a window strip
  flat?: boolean;// truck: a short cab on the right + a low bed
  win?: number;  // box window count
}

/** extrude a side-profile MASK (body-colored pixels, T elsewhere) up-right by
 *  d: top edges sweep into the lit roof/hood, right edges into the shaded front.
 *  Returns the canvas + the near-face y offset. */
function extrudeMask(mask: Pixmap, ramp: number, d: number): { pm: Pixmap; oy: number } {
  const lite = px(ramp, 3);
  const mid = px(ramp, 1);
  const W = mask.w + d + 2;
  const H = mask.h + d + 2;
  const pm = new Pixmap(W, H);
  const oy = d + 1;
  for (let y = 0; y < mask.h; y++) {
    for (let x = 0; x < mask.w; x++) {
      if (mask.get(x, y) === T) continue;
      if (mask.get(x, y - 1) === T) for (let k = 1; k <= d; k++) pm.set(x + k, oy + y - k, lite);
      if (mask.get(x + 1, y) === T) for (let k = 1; k <= d; k++) pm.set(x + k, oy + y - k, k > d - 2 ? lite : mid);
    }
  }
  for (let y = 0; y < mask.h; y++) for (let x = 0; x < mask.w; x++) { const c = mask.get(x, y); if (c !== T) pm.set(x, oy + y, c); }
  return { pm, oy };
}

/** the oblique SIDE view (nose right) — the default frame, used everywhere */
function vehSide(b: CarBody, ramp: number): Pixmap {
  const { body, lite, dark } = paint(ramp);
  const beltY = b.box ? 2 : 8;
  const floorY = beltY + b.bodyH;
  const cabTop = beltY - b.cabH;
  const sil = new Pixmap(b.len + 2, floorY + 1);
  if (b.box) {
    sil.rect(1, beltY, b.len, b.bodyH, body);
  } else if (b.flat) {
    const cabW = Math.max(8, Math.floor(b.len * 0.42));
    sil.rect(b.len - cabW, beltY - b.cabH, cabW, b.cabH, body); // cab (right)
    sil.rect(1, beltY, b.len, b.bodyH, body); // chassis/bed
    sil.set(b.len, beltY - b.cabH, T);
  } else {
    sil.rect(1, beltY, b.len, b.bodyH, body);
    sil.rect(b.cab0, cabTop, b.cab1 - b.cab0, b.cabH + 1, body);
    sil.set(b.cab1 - 1, cabTop, T);
    sil.set(b.cab0, cabTop, T);
    sil.set(b.len, beltY, T);
  }
  const { pm, oy } = extrudeMask(sil, ramp, b.depth);
  pm.hline(1, oy + beltY, b.len, lite); // belt highlight
  pm.hline(1, oy + floorY - 1, b.len, dark); // rocker shadow
  if (b.box) {
    for (let i = 0; i < (b.win ?? 4); i++) { const wx = 3 + i * 5; if (wx + 3 < b.len) { pm.rect(wx, oy + beltY + 2, 3, 3, GLASS); pm.set(wx + 2, oy + beltY + 2, GLASS_D); } }
  } else if (b.flat) {
    const cabW = Math.max(8, Math.floor(b.len * 0.42));
    pm.rect(b.len - cabW + 1, oy + beltY - b.cabH + 1, cabW - 2, b.cabH - 1, GLASS);
    for (let x = 3; x < b.len - cabW - 1; x += 4) pm.vline(x, oy + beltY - 2, 2, dark); // bed slats
  } else {
    pm.rect(b.cab0 + 1, oy + cabTop + 1, b.cab1 - b.cab0 - 2, b.cabH - 1, GLASS);
    pm.vline(Math.floor((b.cab0 + b.cab1) / 2), oy + cabTop + 1, b.cabH - 1, body); // B-pillar
    pm.set(b.cab1 - 1, oy + cabTop + 1, GLASS_D);
  }
  // nose headlight (on the extruded front face) + tail light
  pm.rect(b.len + b.depth - 2, oy + beltY + 1 - b.depth, 2, 2, LAMP);
  pm.rect(1, oy + beltY + 1, 1, 2, TAIL);
  pm.hline(1, oy + floorY - 2, 2, CHROME); // rear bumper
  // wheels — far pair (extruded up-right, small) then near pair, in front
  const wy = oy + floorY;
  const xs = b.axles >= 3 ? [2, Math.floor(b.len / 2) - 2, b.len - 7] : [2, b.len - 7];
  for (const wx of xs) { pm.rect(wx + b.depth, wy - 1 - b.depth, 5, 3, TIRE); pm.set(wx + b.depth + 2, wy - b.depth, HUB); }
  for (const wx of xs) { pm.rect(wx, wy - 1, 6, 4, TIRE); pm.set(wx, wy - 1, T); pm.set(wx + 5, wy - 1, T); pm.rect(wx + 2, wy, 2, 2, HUB); }
  pm.shadowUnder(Math.floor(pm.w / 2), pm.h - 1, Math.floor(pm.w / 2) - 2, SHADOW);
  pm.outline(C.outline);
  if (!b.box && !b.flat) pm.set(b.cab0 + 2, oy + cabTop + 1, CHROME); // windshield glint
  pm.set(b.len + b.depth - 1, oy + (b.box ? beltY : cabTop) - b.depth + 1, lite); // roof-corner spark
  return pm;
}

/** the FRONT (toward viewer) or BACK (away) face — vertical fascia + a lit
 *  roof/hood plane receding up + lit/shaded flank edges, so the volume reads */
function vehFace(b: CarBody, ramp: number, back: boolean): Pixmap {
  const { body, lite, mid, dark } = paint(ramp);
  const cabW = b.box || b.flat ? b.width - 2 : Math.min(b.width - 4, b.cab1 - b.cab0 + 2);
  const W = b.width + 2;
  const cx = 1 + Math.floor(b.width / 2);
  const cabX = cx - Math.floor(cabW / 2);
  const recede = Math.max(2, b.depth - 1);
  const roofH = 2;
  const hoodH = 2;
  const glassH = b.box ? b.bodyH - 4 : b.cabH;
  const fasciaH = b.box ? 3 : b.bodyH;
  const H = 1 + recede + roofH + glassH + hoodH + fasciaH + 6;
  const pm = new Pixmap(W, H);
  let y = 1;
  for (let i = 0; i < recede; i++) { const inset = Math.floor((recede - i) / 2); pm.hline(cabX + 1 + inset, y + i, cabW - 2 - inset * 2, lite); }
  y += recede;
  pm.rect(cabX + 1, y, cabW - 2, roofH, lite);
  pm.hline(cabX + 1, y, cabW - 2, px(RAMP.PAPER, 1));
  y += roofH;
  pm.rect(cabX, y, cabW, glassH, back ? GLASS_D : GLASS);
  pm.vline(cabX, y, glassH, mid);
  pm.vline(cabX + cabW - 1, y, glassH, mid);
  if (b.box) for (let i = 1; i < cabW - 1; i += 3) pm.vline(cabX + i, y, glassH, mid); // bus mullions
  y += glassH;
  pm.rect(1, y, b.width, hoodH, lite); // hood/trunk sliver
  y += hoodH;
  pm.rect(1, y, b.width, fasciaH, mid); // vertical fascia (shaded)
  pm.vline(1, y, fasciaH, body);
  pm.vline(b.width, y, fasciaH, dark);
  pm.rect(cx - 3, y + 1, 6, Math.max(1, fasciaH - 3), dark); // grille / panel
  if (back) { pm.rect(2, y + 1, 3, 2, TAIL); pm.rect(b.width - 3, y + 1, 3, 2, TAIL); }
  else { pm.rect(2, y + 1, 3, 2, LAMP); pm.rect(b.width - 3, y + 1, 3, 2, LAMP); }
  const floorY = y + fasciaH;
  pm.hline(2, floorY - 1, b.width - 2, CHROME);
  pm.rect(1, floorY, 3, 3, TIRE);
  pm.rect(b.width - 2, floorY, 3, 3, TIRE);
  pm.shadowUnder(cx, floorY + 3, Math.floor(b.width / 2), SHADOW);
  pm.outline(C.outline);
  pm.set(cabX + 2, 1 + recede + roofH, CHROME);
  return pm;
}

/** pad a view to a target box, anchored bottom-center (sprites share a frame) */
function padTo(src: Pixmap, w: number, h: number): Pixmap {
  if (src.w === w && src.h === h) return src;
  const out = new Pixmap(w, h);
  const ox = Math.floor((w - src.w) / 2);
  const oy = h - src.h;
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) { const c = src.get(x, y); if (c !== T) out.set(ox + x, oy + y, c); }
  return out;
}

/** the three oblique views [side, front, back], padded to one frame size */
export function carViews(b: CarBody, ramp: number): Pixmap[] {
  const side = vehSide(b, ramp);
  const front = vehFace(b, ramp, false);
  const back = vehFace(b, ramp, true);
  const w = Math.max(side.w, front.w, back.w);
  const h = Math.max(side.h, front.h, back.h);
  return [padTo(side, w, h), padTo(front, w, h), padTo(back, w, h)];
}

/** the shared frame size for a body (ramp-independent) — drives spec w/h */
export function carFrame(b: CarBody): { w: number; h: number } {
  const v = carViews(b, RAMP.PAPER)[0];
  return { w: v.w, h: v.h };
}

/** ADR-097 bodies for the four-wheeler ROAD fleet — scaled up so a 24px hero
 *  visibly fits (a sedan ≈ 2.5 kids long; a bus swallows the whole party). */
export const CAR_BODIES: Record<string, CarBody> = {
  sedan:        { len: 38, width: 16, bodyH: 6, cabH: 5, cab0: 12, cab1: 28, depth: 5, axles: 2 },
  ev:           { len: 38, width: 16, bodyH: 6, cabH: 6, cab0: 11, cab1: 29, depth: 5, axles: 2 },
  nikolai:      { len: 42, width: 17, bodyH: 6, cabH: 5, cab0: 12, cab1: 32, depth: 6, axles: 2 },
  race_car:     { len: 42, width: 15, bodyH: 5, cabH: 3, cab0: 16, cab1: 28, depth: 4, axles: 2 },
  grand_tourer: { len: 44, width: 16, bodyH: 5, cabH: 4, cab0: 17, cab1: 33, depth: 6, axles: 2 },
  roadster:     { len: 38, width: 16, bodyH: 6, cabH: 3, cab0: 15, cab1: 29, depth: 5, axles: 2 },
  limo:         { len: 66, width: 16, bodyH: 6, cabH: 5, cab0: 10, cab1: 58, depth: 5, axles: 2 },
  muscle_car:   { len: 42, width: 17, bodyH: 7, cabH: 4, cab0: 14, cab1: 28, depth: 5, axles: 2 },
  suv:          { len: 40, width: 18, bodyH: 8, cabH: 6, cab0: 10, cab1: 32, depth: 6, axles: 2 },
  large_suv:    { len: 46, width: 19, bodyH: 8, cabH: 6, cab0: 10, cab1: 38, depth: 6, axles: 2 },
  van:          { len: 42, width: 18, bodyH: 14, cabH: 0, cab0: 0, cab1: 0, depth: 6, axles: 2, box: true, win: 5 },
  bus:          { len: 60, width: 19, bodyH: 17, cabH: 0, cab0: 0, cab1: 0, depth: 6, axles: 3, box: true, win: 9 },
  school_bus:   { len: 60, width: 19, bodyH: 17, cabH: 0, cab0: 0, cab1: 0, depth: 6, axles: 3, box: true, win: 9 },
  truck:        { len: 46, width: 18, bodyH: 8, cabH: 6, cab0: 0, cab1: 0, depth: 6, axles: 3, flat: true },
  dump_truck:   { len: 46, width: 18, bodyH: 10, cabH: 6, cab0: 0, cab1: 0, depth: 6, axles: 3, flat: true },
};

/* ─── ROAD: cars / vans / buses / trucks ─────────────────────────────────── */
// The flat side-elevation car/box/truck draws (drawCarBody/drawNikolai/drawBox/
// drawTruck) were RETIRED in ADR-097 — every four-wheeler now renders through
// the oblique vehSide/vehFace pipeline above, keyed by its CAR_BODIES entry.

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

/* ─── M39 (ADR-080): THE MILITARY MOTOR POOL — tank, F-15, Humvee & friends ─ */

function drawTank(ramp: number, _rng: () => number): Pixmap {
  const p = paint(ramp);
  const W = 40;
  const H = 22;
  const pm = new Pixmap(W, H);
  const floorY = 17;
  // continuous track with road wheels
  pm.rect(2, floorY - 3, W - 4, 5, px(RAMP.INK, 1));
  for (let x = 4; x < W - 4; x += 4) pm.set(x, floorY, HUB);
  // hull with a sloped glacis plate (nose right)
  pm.rect(4, floorY - 7, W - 8, 5, p.body);
  pm.hline(4, floorY - 7, W - 8, p.lite);
  pm.line(W - 4, floorY - 7, W - 1, floorY - 4, p.body); // sloped front
  // turret + commander's hatch
  pm.rect(12, floorY - 11, 14, 5, p.mid);
  pm.hline(12, floorY - 11, 14, p.lite);
  pm.rect(16, floorY - 13, 3, 2, p.dark);
  // the main gun reaching right
  pm.rect(26, floorY - 10, 12, 2, p.dark);
  pm.set(38, floorY - 10, p.dark);
  pm.shadowUnder(Math.floor(W / 2), H - 1, Math.floor(W / 2) - 1, SHADOW);
  pm.outline(C.outline);
  return pm;
}
function drawF15(ramp: number, _rng: () => number): Pixmap {
  const p = paint(ramp);
  const W = 40;
  const H = 22;
  const pm = new Pixmap(W, H);
  const midY = 11;
  // long fuselage, pointed nose right
  pm.rect(3, midY - 2, W - 6, 4, p.body);
  pm.line(W - 3, midY, W - 8, midY - 2, p.dark);
  pm.line(W - 3, midY, W - 8, midY + 2, p.dark);
  pm.hline(3, midY - 2, W - 6, p.lite);
  // big swept wings
  pm.line(22, midY, 14, 2, p.mid);
  pm.line(22, midY, 14, H - 2, p.mid);
  pm.line(26, midY, 18, 3, p.mid);
  pm.line(26, midY, 18, H - 3, p.mid);
  // the F-15's TWIN tails
  pm.line(6, midY - 2, 9, 3, p.mid);
  pm.line(8, midY - 2, 11, 3, p.mid);
  pm.line(6, midY + 2, 9, H - 3, p.mid);
  pm.line(8, midY + 2, 11, H - 3, p.mid);
  // bubble canopy + twin engine nozzles
  pm.rect(W - 12, midY - 1, 3, 2, GLASS);
  pm.set(3, midY - 1, px(RAMP.INK, 2));
  pm.set(3, midY + 1, px(RAMP.INK, 2));
  pm.outline(C.outline);
  return pm;
}
function drawHumvee(ramp: number, _rng: () => number): Pixmap {
  const p = paint(ramp);
  const W = 34;
  const floorY = 15;
  const H = floorY + 6;
  const pm = new Pixmap(W, H);
  // wide, boxy, flat body
  pm.rect(2, 6, W - 4, floorY - 6, p.body);
  pm.hline(2, 6, W - 4, p.lite);
  pm.hline(2, floorY, W - 4, p.dark);
  // slanted windshield + cab
  pm.rect(W - 12, 4, 9, 4, p.mid);
  pm.rect(W - 11, 5, 7, 3, GLASS);
  pm.set(W - 5, 5, GLASS_D);
  // boxy side windows + a door seam
  pm.rect(6, 7, 3, 3, GLASS);
  pm.rect(11, 7, 3, 3, GLASS);
  pm.vline(16, 7, floorY - 7, p.dark);
  // big off-road wheels
  wheel(pm, 4, floorY + 5, 4);
  wheel(pm, W - 10, floorY + 5, 4);
  pm.rect(W - 2, 8, 1, 2, LAMP);
  pm.shadowUnder(Math.floor(W / 2), H - 1, Math.floor(W / 2) - 1, SHADOW);
  pm.outline(C.outline);
  return pm;
}
function drawTroopTransport(ramp: number, _rng: () => number): Pixmap {
  const p = paint(ramp);
  const W = 44;
  const floorY = 17;
  const H = floorY + 6;
  const pm = new Pixmap(W, H);
  const cabX = W - 13;
  // cab (right)
  pm.rect(cabX, 6, 12, floorY - 6, p.body);
  pm.rect(cabX + 2, 7, 7, 4, GLASS);
  pm.set(cabX + 8, 7, GLASS_D);
  // canvas-covered troop bed with bow ribs (where the soldiers ride)
  const canvas0 = px(RAMP.EARTH, 0);
  pm.rect(2, 4, cabX - 3, floorY - 4, px(RAMP.EARTH, 1));
  pm.hline(2, 4, cabX - 3, px(RAMP.EARTH, 2));
  for (let x = 5; x < cabX - 3; x += 5) pm.vline(x, 4, floorY - 5, canvas0); // bows
  pm.hline(2, floorY, W - 4, p.dark);
  pm.rect(W - 2, floorY - 4, 1, 2, LAMP);
  // six heavy wheels
  wheel(pm, 4, floorY + 5, 3);
  wheel(pm, cabX - 8, floorY + 5, 3);
  wheel(pm, cabX, floorY + 5, 3);
  pm.shadowUnder(Math.floor(W / 2), H - 1, Math.floor(W / 2) - 1, SHADOW);
  pm.outline(C.outline);
  return pm;
}
function drawAttackHeli(ramp: number, _rng: () => number): Pixmap {
  const p = paint(ramp);
  const pm = new Pixmap(36, 18);
  // narrow gunship body, tapered nose right
  pm.rect(6, 8, 16, 5, p.body);
  pm.hline(6, 8, 16, p.lite);
  pm.line(22, 8, 26, 11, p.body);  // nose down to the chin gun
  pm.line(22, 12, 26, 11, p.body);
  pm.rect(25, 12, 2, 2, px(RAMP.INK, 2)); // chin gun
  // stepped tandem canopy
  pm.rect(15, 6, 4, 3, GLASS);
  pm.rect(19, 7, 3, 2, GLASS);
  // stub wing + a rocket pod
  pm.rect(9, 12, 7, 2, p.dark);
  pm.rect(9, 13, 2, 1, px(RAMP.INK, 2));
  // tail boom + fin + main rotor
  pm.rect(2, 9, 5, 2, p.mid);
  pm.vline(1, 6, 6, p.dark);
  pm.hline(4, 2, 24, px(RAMP.INK, 2));
  pm.vline(14, 2, 6, p.dark);
  pm.shadowUnder(16, 17, 14, SHADOW);
  pm.outline(C.outline);
  return pm;
}

/* ─── M48 (ADR-089): THE LONG SHOT — the rocket (Earth↔Mars shuttle) ──────── */

function drawRocket(ramp: number, _rng: () => number): Pixmap {
  const p = paint(ramp);
  const W = 44;
  const H = 22;
  const pm = new Pixmap(W, H);
  const midY = 11;
  // a sleek fuselage in flight, nose pointed RIGHT (the art law read)
  pm.rect(6, midY - 3, W - 12, 6, p.body);
  pm.hline(6, midY - 3, W - 12, p.lite);
  // the pointed nose cone
  pm.line(W - 6, midY - 3, W - 1, midY, p.mid);
  pm.line(W - 6, midY + 2, W - 1, midY, p.mid);
  pm.set(W - 1, midY, CHROME);
  // a porthole + a window band
  pm.rect(W - 14, midY - 1, 3, 2, GLASS);
  pm.set(W - 18, midY, GLASS_D);
  // tail fins
  pm.line(6, midY - 3, 2, midY - 6, p.dark);
  pm.line(6, midY + 2, 2, midY + 6, p.dark);
  pm.line(6, midY, 1, midY, p.dark);
  // the booster flame streaming behind (left), pure-light core after the contour
  pm.rect(2, midY - 1, 4, 2, px(RAMP.ORANGE, 2));
  pm.shadowUnder(Math.floor(W / 2), H - 1, Math.floor(W / 2) - 4, SHADOW);
  pm.outline(C.outline);
  pm.hline(0, midY, 3, px(RAMP.GOLD, 3)); // the brightest exhaust, drawn last
  pm.set(W - 13, midY - 1, CHROME);       // a glint on the porthole
  return pm;
}

/* ─── THE SPEC TABLE — one row per vehicle TYPE ─────────────────────────── */

function box(w: number, h: number, oy = 0): { ox: number; oy: number; w: number; h: number } {
  return { ox: 1, oy: oy, w: w - 2, h: h };
}

/** ADR-097: a four-wheeler spec built from its CAR_BODIES entry — w/h are the
 *  oblique frame size, the footprint covers the lower body, and `draw` is the
 *  SIDE view (frame 0; the FRONT/BACK frames ride the sheet via carViews). */
function carSpec(cls: VehicleClass, seats: number, type: string, extra: { selfDrive?: boolean } = {}): VehicleSpec {
  const body = CAR_BODIES[type];
  const f = carFrame(body);
  const fh = Math.min(f.h - 2, body.bodyH + 7);
  return {
    cls,
    terrain: 'road',
    seats,
    w: f.w,
    h: f.h,
    solid: { ox: 1, oy: f.h - fh - 1, w: f.w - body.depth - 3, h: fh },
    ...extra,
    draw: (r) => carViews(body, r)[0],
  };
}

export const VEHICLE_SPECS: Record<string, VehicleSpec> = {
  bicycle:     { cls: 'bike',    terrain: 'road', seats: 1,  w: 20, h: 16, solid: box(20, 6, 9),  draw: (r, g) => drawBike(r, g) },
  // M35 (ADR-076) — the two-wheeler tier: real, distinct, drivable bikes + motorcycles
  bmx:         { cls: 'bike',    terrain: 'road', seats: 1,  w: 18, h: 16, solid: box(18, 6, 9),  draw: (r, g) => drawBmx(r, g) },
  road_bike:   { cls: 'bike',    terrain: 'road', seats: 1,  w: 22, h: 16, solid: box(22, 6, 9),  draw: (r, g) => drawRoadBike(r, g) },
  motorcycle:  { cls: 'moto',    terrain: 'road', seats: 2,  w: 22, h: 16, solid: box(22, 6, 9),  draw: (r, g) => drawMoto(r, g) },
  cruiser:     { cls: 'moto',    terrain: 'road', seats: 2,  w: 26, h: 16, solid: box(26, 6, 9),  draw: (r, g) => drawCruiser(r, g) },
  sport_bike:  { cls: 'moto',    terrain: 'road', seats: 2,  w: 24, h: 16, solid: box(24, 6, 9),  draw: (r, g) => drawSportBike(r, g) },
  // ADR-097 — the four-wheeler ROAD fleet, now OBLIQUE 3D (side/front/back),
  // scaled so the cast visibly fits. Gameplay (cls/seats/terrain) is unchanged.
  sedan:        carSpec('car', 4, 'sedan'),
  ev:           carSpec('car', 4, 'ev'),
  // M36 (ADR-077) — THE NIKOLAI: the flagship EV. Self-driving "creep" toy (selfDrive).
  nikolai:      carSpec('car', 5, 'nikolai', { selfDrive: true }),
  race_car:     carSpec('car', 2, 'race_car'),
  // M35 (ADR-076) — the HIGH-END / EXOTIC tier (Fortune-Arc priced, seat-fit-correct)
  grand_tourer: carSpec('car', 4, 'grand_tourer'),
  roadster:     carSpec('car', 2, 'roadster'),
  limo:         carSpec('car', 8, 'limo'),
  muscle_car:   carSpec('car', 4, 'muscle_car'),
  suv:          carSpec('suv', 5, 'suv'),
  large_suv:    carSpec('suv', 6, 'large_suv'),
  van:          carSpec('van', 7, 'van'),
  bus:          carSpec('bus', 12, 'bus'),
  school_bus:   carSpec('bus', 24, 'school_bus'),
  truck:        carSpec('truck', 3, 'truck'),
  dump_truck:   carSpec('truck', 3, 'dump_truck'),
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
  // M39 (ADR-080) — THE MILITARY MOTOR POOL: drawn world props + control targets,
  // `hardened` (Faraday/dead-air shielded) by default — the army hardens its kit.
  tank:           { cls: 'tank',  terrain: 'road', seats: 3,  w: 40, h: 22, solid: box(40, 9, 8),  hardened: true, draw: (r, g) => drawTank(r, g) },
  f15:            { cls: 'plane', terrain: 'air',  seats: 1,  w: 40, h: 22, solid: box(40, 6, 8),   hardened: true, draw: (r, g) => drawF15(r, g) },
  humvee:         { cls: 'suv',   terrain: 'road', seats: 4,  w: 34, h: 21, solid: box(34, 8, 8),   hardened: true, draw: (r, g) => drawHumvee(r, g) },
  troop_transport:{ cls: 'truck', terrain: 'road', seats: 12, w: 44, h: 23, solid: box(44, 10, 6),  hardened: true, draw: (r, g) => drawTroopTransport(r, g) },
  attack_heli:    { cls: 'heli',  terrain: 'air',  seats: 2,  w: 36, h: 18, solid: box(36, 8, 6),   hardened: true, draw: (r, g) => drawAttackHeli(r, g) },
  // M48 (ADR-089) — THE LONG SHOT: Professor Pemberton's rocket, the Earth↔Mars shuttle
  rocket:         { cls: 'rocket', terrain: 'air', seats: 6,  w: 44, h: 22, solid: box(44, 8, 8),   draw: (r, g) => drawRocket(r, g) },
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
  // the Nikolai's clean monochrome + accent line (paper/white, night/black, signature red)
  nikolai:     [RAMP.PAPER, RAMP.NIGHT, RAMP.RED],
  race_car:    [RAMP.RED, RAMP.GOLD, RAMP.PURPLE],
  grand_tourer:[RAMP.BLUE, RAMP.RED, RAMP.NIGHT, RAMP.GOLD],
  roadster:    [RAMP.RED, RAMP.GOLD, RAMP.PAPER],
  limo:        [RAMP.NIGHT, RAMP.PAPER],
  muscle_car:  [RAMP.RED, RAMP.ORANGE, RAMP.NIGHT],
  suv:         [RAMP.EARTH, RAMP.BLUE, RAMP.PAPER, RAMP.RED],
  large_suv:   [RAMP.NIGHT, RAMP.EARTH, RAMP.PAPER],
  van:         [RAMP.PAPER, RAMP.ORANGE, RAMP.BLUE],
  bus:         [RAMP.GOLD, RAMP.RED, RAMP.GRASS],
  school_bus:  [RAMP.GOLD],
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
  // M39 — olive-drab + desert-tan war paint
  tank:            [RAMP.FOREST, RAMP.EARTH],
  f15:             [RAMP.PAPER, RAMP.FOREST],
  humvee:          [RAMP.FOREST, RAMP.EARTH],
  troop_transport: [RAMP.FOREST, RAMP.EARTH],
  attack_heli:     [RAMP.FOREST, RAMP.NIGHT],
  // The Long Shot — a homemade rocket in hopeful paper-white + a gold nose
  rocket:          [RAMP.PAPER, RAMP.RED],
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

/** draw a catalog vehicle by its sprite name (deterministic per name) — the
 *  SIDE view (frame 0), used by menus, the dealership, parked cars, the forge. */
export function drawVehicle(name: string): Pixmap {
  const v = VEHICLE_CATALOG.find((e) => e.name === name);
  if (!v) return new Pixmap(8, 8);
  const spec = VEHICLE_SPECS[v.type];
  return spec.draw(v.ramp, mulberry32(fnv32(name)));
}

/** ADR-097: the per-direction view frames for a vehicle — [side, front, back]
 *  for the oblique four-wheelers (so traffic TURNS by frame, not by rotating a
 *  3/4 sprite), or a single [side] for the legacy one-view types (bikes, boats,
 *  planes, machinery, military). index.ts registers these as a sprite sheet. */
export function drawVehicleViews(name: string): Pixmap[] {
  const v = VEHICLE_CATALOG.find((e) => e.name === name);
  if (!v) return [new Pixmap(8, 8)];
  const body = CAR_BODIES[v.type];
  if (body) return carViews(body, v.ramp);
  return [drawVehicle(name)];
}
