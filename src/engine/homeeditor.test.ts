/**
 * S18 Movement 30 (ADR-070) — THE HOME EDITOR (§A4.14).
 *
 * Proves the placement law (no overlap, never block the door, room stays
 * traversable — a furnished home can't soft-lock), rotation footprints,
 * coziness rising with variety, the flip hook (cozy → higher resale), and the
 * layout round-trip.
 */
import { describe, it, expect } from 'vitest';
import { FURNITURE } from '../data/furniture';
import {
  footprint, cells, canPlace, commitPlace, roomTraversable, coziness, restBuff,
  hasFunction, serializeLayout, deserializeLayout, type Room, type Placement,
} from './homeeditor';
import { PROPERTIES } from '../data/properties';
import { sellProceeds } from './property';

/** an 8×6 room with the door at the bottom-left, no built-in solids */
const room: Room = { w: 8, h: 6, door: { x: 0, y: 5 }, solid: new Set() };

describe('home editor — placement law', () => {
  it('rotation swaps the footprint', () => {
    const sofa = FURNITURE.plush_sofa; // 3×1
    expect(footprint(sofa, 0)).toEqual({ w: 3, h: 1 });
    expect(footprint(sofa, 1)).toEqual({ w: 1, h: 3 });
  });

  it('a piece occupies exactly its footprint cells', () => {
    expect(cells({ f: 'twin_bed', x: 2, y: 1, rot: 0 }).length).toBe(FURNITURE.twin_bed.w * FURNITURE.twin_bed.h);
  });

  it('refuses out-of-bounds, the door tile, and overlaps', () => {
    expect(canPlace(room, [], { f: 'twin_bed', x: 7, y: 0, rot: 0 })).toBe(false); // off the right edge (2 wide)
    expect(canPlace(room, [], { f: 'home_phone', x: 0, y: 5, rot: 0 })).toBe(false); // on the door
    const bed: Placement = { f: 'twin_bed', x: 2, y: 0, rot: 0 };
    expect(canPlace(room, [], bed)).toBe(true);
    expect(canPlace(room, [bed], { f: 'home_phone', x: 2, y: 0, rot: 0 })).toBe(false); // overlaps the bed
  });

  it('never lets a placement wall off a pocket (room stays traversable)', () => {
    // a 1×6 wall down column 1 would seal columns 0 from 2..7 except via the door row;
    // a full vertical wall that also covers the door-row exit must be refused.
    const wall: Placement[] = [];
    for (let y = 0; y <= 5; y++) wall.push({ f: 'home_phone', x: 1, y, rot: 0 });
    // place them one by one through commitPlace; the one that seals the pocket is refused
    const placed: Placement[] = [];
    let refusedAtLeastOne = false;
    for (const w of wall) {
      if (commitPlace(room, placed, w)) placed.push(w);
      else refusedAtLeastOne = true;
    }
    expect(refusedAtLeastOne).toBe(true);
    expect(roomTraversable(room, placed)).toBe(true);
  });

  it('an empty room and a sanely furnished room are both traversable', () => {
    expect(roomTraversable(room, [])).toBe(true);
    const layout: Placement[] = [
      { f: 'twin_bed', x: 6, y: 0, rot: 0 },
      { f: 'plush_sofa', x: 2, y: 0, rot: 0 },
      { f: 'home_phone', x: 0, y: 0, rot: 0 },
      { f: 'fridge', x: 5, y: 3, rot: 0 },
    ];
    let ok = true;
    const placed: Placement[] = [];
    for (const p of layout) { if (commitPlace(room, placed, p)) placed.push(p); else ok = false; }
    expect(ok).toBe(true);
    expect(roomTraversable(room, placed)).toBe(true);
  });
});

describe('home editor — coziness + the rest buff', () => {
  it('coziness rises as you add varied furniture', () => {
    const one: Placement[] = [{ f: 'houseplant', x: 0, y: 0, rot: 0 }];
    const many: Placement[] = [
      { f: 'twin_bed', x: 0, y: 0, rot: 0 }, { f: 'plush_sofa', x: 0, y: 0, rot: 0 },
      { f: 'record_player', x: 0, y: 0, rot: 0 }, { f: 'houseplant', x: 0, y: 0, rot: 0 },
      { f: 'bookshelf', x: 0, y: 0, rot: 0 }, { f: 'floor_lamp', x: 0, y: 0, rot: 0 },
    ];
    expect(coziness(many)).toBeGreaterThan(coziness(one));
  });
  it('a cozy home grants a rest buff; an empty one does not', () => {
    expect(restBuff([])).toBe(0);
    const cozy: Placement[] = Object.keys(FURNITURE).map((f) => ({ f, x: 0, y: 0, rot: 0 as const }));
    expect(restBuff(cozy)).toBeGreaterThan(0);
  });
  it('hasFunction sees the base functions', () => {
    const layout: Placement[] = [{ f: 'twin_bed', x: 0, y: 0, rot: 0 }, { f: 'home_phone', x: 1, y: 0, rot: 0 }];
    expect(hasFunction(layout, 'bed')).toBe(true);
    expect(hasFunction(layout, 'phone')).toBe(true);
    expect(hasFunction(layout, 'workbench')).toBe(false);
  });
});

describe('home editor — the flip hook (cozy lifts resale)', () => {
  it('a furnished home sells for more than an empty one', () => {
    const fixer = PROPERTIES.maple_fixer;
    const cozyLayout: Placement[] = [
      { f: 'twin_bed', x: 0, y: 0, rot: 0 }, { f: 'plush_sofa', x: 0, y: 0, rot: 0 },
      { f: 'record_player', x: 0, y: 0, rot: 0 }, { f: 'bookshelf', x: 0, y: 0, rot: 0 },
      { f: 'houseplant', x: 0, y: 0, rot: 0 }, { f: 'fish_tank', x: 0, y: 0, rot: 0 },
    ];
    const empty = sellProceeds(fixer, 4, 7, coziness([]));
    const furnished = sellProceeds(fixer, 4, 7, coziness(cozyLayout));
    expect(furnished).toBeGreaterThan(empty);
  });
});

describe('home editor — layout round-trip', () => {
  it('serialises + restores stably and drops retired pieces', () => {
    const layout: Placement[] = [
      { f: 'twin_bed', x: 1, y: 1, rot: 2 },
      { f: 'not_a_real_piece', x: 0, y: 0, rot: 0 },
    ];
    const out = deserializeLayout(serializeLayout(layout));
    expect(out).toEqual([{ f: 'twin_bed', x: 1, y: 1, rot: 2 }]);
  });
});
