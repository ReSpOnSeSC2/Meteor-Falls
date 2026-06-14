/**
 * S18 Movement 25 (ADR-065) — AREA-TRUE BUILDINGS, both directions.
 *
 * Mirrors the content-validate `area-skins` gate so a CI run without the
 * validator still catches a forgotten roster, an empty family×ramp filter, a
 * typo'd facade, or an orphan slice. The per-area law (ADR-050): every named
 * §A5/§A6 area draws ONLY from its own slice, never a reskin of another.
 */
import { describe, it, expect } from 'vitest';
import { AREA_SKINS, CANON_AREAS, BESPOKE_AREA_FACADES, skinsFor } from './buildings';
import { BUILDING_DIMS } from '../levelkit/kit';

const KNOWN = new Set<string>([...Object.keys(BUILDING_DIMS), ...BESPOKE_AREA_FACADES]);

describe('AREA_SKINS ⇄ CANON_AREAS (both directions)', () => {
  it('every canon area has a non-empty roster', () => {
    for (const area of CANON_AREAS) {
      const roster = AREA_SKINS[area];
      expect(roster, `canon area '${area}' has no AREA_SKINS roster`).toBeDefined();
      expect(roster.length, `area '${area}' roster is empty`).toBeGreaterThan(0);
    }
  });

  it('every facade in every roster resolves to a real registered building', () => {
    for (const area of CANON_AREAS) {
      for (const sprite of AREA_SKINS[area]) {
        expect(KNOWN.has(sprite), `area '${area}' facade '${sprite}' resolves to nothing`).toBe(true);
      }
    }
  });

  it('every AREA_SKINS slice is a canon area (no orphan rosters)', () => {
    const canon = new Set(CANON_AREAS);
    for (const area of Object.keys(AREA_SKINS)) {
      expect(canon.has(area), `AREA_SKINS has an orphan slice '${area}'`).toBe(true);
    }
  });
});

describe('the per-area law — areas read distinct', () => {
  it('no two areas share an identical roster (a reskin)', () => {
    const sigs = new Map<string, string>();
    for (const area of CANON_AREAS) {
      const sig = [...AREA_SKINS[area]].sort().join('|');
      const prior = sigs.get(sig);
      expect(prior, `'${area}' has the exact same roster as '${prior}' — a reskin`).toBeUndefined();
      sigs.set(sig, area);
    }
  });

  it('the unlanded areas each pull a recognisable, on-feel family mix', () => {
    // Minimus is the tabletop duchy — its hand-picked roster is the tiniest tiers
    // only (no mega ever steps into a town the party steps over).
    for (const sprite of AREA_SKINS.minimus) {
      const dims = BUILDING_DIMS[sprite];
      expect(dims, `minimus facade '${sprite}' missing dims`).toBeDefined();
      expect(dims.u, `minimus facade '${sprite}' is too tall for a tabletop town`).toBeLessThanOrEqual(3);
    }
    // Lilleby is the giants' town — it MUST carry something mega (u≥11) so the
    // scale-comedy reads (the party walks under the doors).
    expect(AREA_SKINS.lilleby.some((s) => (BUILDING_DIMS[s]?.u ?? 0) >= 11)).toBe(true);
  });

  it('skinsFor returns only catalog facades for a known family', () => {
    const shops = skinsFor(['shop']);
    expect(shops.length).toBeGreaterThan(0);
    for (const s of shops) expect(s.startsWith('bldg_gen_shop_')).toBe(true);
  });
});
