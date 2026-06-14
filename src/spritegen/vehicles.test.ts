/**
 * S18 Movement 26 (ADR-067) — THE VEHICLE FORGE, both directions + the art law.
 *
 * Mirrors the content-validate `vehicles` gate (catalog ⇄ specs) and proves the
 * forge obeys ADR-020 by construction (palette-only, determinism) and the §A4.10
 * seat-fit math.
 */
import { describe, it, expect } from 'vitest';
import {
  VEHICLE_CATALOG, VEHICLE_SPECS, drawVehicle, usableSeats, seatsFit,
} from './vehicles';

describe('VEHICLE_CATALOG ⇄ VEHICLE_SPECS (both directions)', () => {
  it('every catalog variant names a real spec type', () => {
    for (const v of VEHICLE_CATALOG) {
      expect(VEHICLE_SPECS[v.type], `vehicle '${v.name}' has no spec for type '${v.type}'`).toBeDefined();
    }
  });

  it('every spec type ships at least one paint variant', () => {
    const used = new Set(VEHICLE_CATALOG.map((v) => v.type));
    for (const type of Object.keys(VEHICLE_SPECS)) {
      expect(used.has(type), `spec '${type}' has no catalog variant`).toBe(true);
    }
  });

  it('sprite names are unique', () => {
    const seen = new Set<string>();
    for (const v of VEHICLE_CATALOG) {
      expect(seen.has(v.name), `duplicate vehicle name '${v.name}'`).toBe(false);
      seen.add(v.name);
    }
  });

  it('every footprint sits inside its sprite bounds', () => {
    for (const [type, s] of Object.entries(VEHICLE_SPECS)) {
      expect(s.solid.ox >= 0 && s.solid.ox + s.solid.w <= s.w, `${type} footprint exceeds width`).toBe(true);
      expect(s.solid.oy >= 0 && s.solid.oy + s.solid.h <= s.h, `${type} footprint exceeds height`).toBe(true);
    }
  });
});

describe('the seat-fit law (§A4.10) — usable seats = seats − 1', () => {
  it('a motorcycle fits a party of 1, not 2', () => {
    expect(usableSeats('motorcycle')).toBe(1);
    expect(seatsFit('motorcycle', 1)).toBe(true);
    expect(seatsFit('motorcycle', 2)).toBe(false);
  });
  it('a sedan fits ≤3, an SUV fits 4, a van/bus fits the whole party', () => {
    expect(seatsFit('sedan', 3)).toBe(true);
    expect(seatsFit('sedan', 4)).toBe(false);
    expect(seatsFit('suv', 4)).toBe(true);
    expect(seatsFit('van', 5)).toBe(true);
    expect(seatsFit('bus', 5)).toBe(true);
  });
  it('a bicycle carries no passenger (Clicker / paperboy only)', () => {
    expect(usableSeats('bicycle')).toBe(0);
    expect(seatsFit('bicycle', 1)).toBe(false);
  });
});

describe('M35 (ADR-076) — the two-wheeler + exotic tier', () => {
  it('the new bikes + motorcycles are real road specs', () => {
    for (const t of ['bmx', 'road_bike', 'cruiser', 'sport_bike']) {
      expect(VEHICLE_SPECS[t], `missing spec '${t}'`).toBeDefined();
      expect(VEHICLE_SPECS[t].terrain).toBe('road');
    }
    expect(VEHICLE_SPECS.bmx.cls).toBe('bike');
    expect(VEHICLE_SPECS.cruiser.cls).toBe('moto');
  });
  it('two-wheelers carry no passenger / one passenger like their kin', () => {
    expect(usableSeats('bmx')).toBe(0);        // a kid's ride, no pillion
    expect(usableSeats('road_bike')).toBe(0);
    expect(seatsFit('cruiser', 1)).toBe(true); // a rider + one pillion
    expect(seatsFit('cruiser', 2)).toBe(false);
    expect(seatsFit('sport_bike', 1)).toBe(true);
  });
  it('the exotic cars are seat-fit-correct and Fortune-Arc shaped', () => {
    for (const t of ['grand_tourer', 'roadster', 'limo', 'muscle_car']) {
      expect(VEHICLE_SPECS[t]?.cls, `'${t}' should be a car`).toBe('car');
    }
    expect(seatsFit('roadster', 1)).toBe(true);   // a two-seat convertible
    expect(seatsFit('roadster', 2)).toBe(false);
    expect(seatsFit('grand_tourer', 3)).toBe(true);
    expect(seatsFit('limo', 5)).toBe(true);       // a stretch swallows the whole party
    expect(usableSeats('limo')).toBe(7);
  });
  it('every new type ships ≥1 paint variant (both directions hold)', () => {
    const used = new Set(VEHICLE_CATALOG.map((v) => v.type));
    for (const t of ['bmx', 'road_bike', 'cruiser', 'sport_bike', 'grand_tourer', 'roadster', 'limo', 'muscle_car']) {
      expect(used.has(t), `'${t}' has no paint variant`).toBe(true);
    }
  });
});

describe('the art law (ADR-020) — palette-only + deterministic', () => {
  it('every variant draws only master-palette indices (0–63) or transparent', () => {
    for (const v of VEHICLE_CATALOG) {
      const pm = drawVehicle(v.name);
      for (let i = 0; i < pm.data.length; i++) {
        const c = pm.data[i];
        const ok = c === 255 || (c >= 0 && c <= 63);
        expect(ok, `vehicle '${v.name}' has off-palette index ${c}`).toBe(true);
      }
    }
  });

  it('every variant draws SOMETHING inside its declared sprite size', () => {
    for (const v of VEHICLE_CATALOG) {
      const pm = drawVehicle(v.name);
      const spec = VEHICLE_SPECS[v.type];
      expect(pm.w).toBe(spec.w);
      expect(pm.h).toBe(spec.h);
      let nonT = 0;
      for (let i = 0; i < pm.data.length; i++) if (pm.data[i] !== 255) nonT++;
      expect(nonT, `vehicle '${v.name}' drew nothing`).toBeGreaterThan(8);
    }
  });

  it('draws are deterministic (same name → identical bytes)', () => {
    for (const v of VEHICLE_CATALOG.slice(0, 8)) {
      const a = drawVehicle(v.name);
      const b = drawVehicle(v.name);
      expect(Buffer.from(a.data).equals(Buffer.from(b.data))).toBe(true);
    }
  });
});
