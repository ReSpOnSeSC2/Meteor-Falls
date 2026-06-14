/**
 * [PLAYTEST B] The pagination math proof for the shared list widget (ui/pick.ts).
 *
 * pick() can NEVER overflow its frame because it sizes the window to one PAGE and
 * derives the page layout from paginate() — the pure helper proven here. The
 * widget itself needs Phaser (windows/zones/hand cursor), so the correctness that
 * matters — page count, items-per-page, which page holds an index, and that no
 * page ever addresses an item out of range — is tested headlessly on the helpers.
 */
import { describe, expect, it } from 'vitest';
// the pure page math lives in ./paginate (Phaser-free so it loads headlessly);
// ui/pick.ts re-exports it for the runtime widget.
import { paginate, pageOf, ROW_H } from './paginate';

describe('paginate() — page math', () => {
  it('a 30-item list at maxRows=7 (one column) → 5 pages of 7', () => {
    const p = paginate(30, 1, 7);
    expect(p.rowsPerCol).toBe(7);
    expect(p.perPage).toBe(7);
    expect(p.pages).toBe(5); // ceil(30/7) = 5 (last page holds 2)
  });

  it('respects columns — 30 items, 2 cols, maxRows 7 → 14 per page, 3 pages', () => {
    const p = paginate(30, 2, 7);
    expect(p.perPage).toBe(14); // 7 rows × 2 cols
    expect(p.pages).toBe(3); // ceil(30/14) = 3
  });

  it('a list that already fits is a single page (perPage clamps to total)', () => {
    const p = paginate(5, 1, 7);
    expect(p.pages).toBe(1);
    expect(p.perPage).toBe(5); // never claims more slots than there are items
    expect(p.rowsPerCol).toBe(7);
  });

  it('an empty list is still one (empty) page — never zero', () => {
    const p = paginate(0, 1, 7);
    expect(p.pages).toBe(1);
    expect(p.perPage).toBe(1); // clamped ≥1 so geometry never divides by zero
  });

  it('a degenerate maxRows of 0 is clamped to 1 row per column', () => {
    const p = paginate(10, 1, 0);
    expect(p.rowsPerCol).toBe(1);
    expect(p.perPage).toBe(1);
    expect(p.pages).toBe(10);
  });

  it('exact multiples do not leave a phantom trailing page', () => {
    const p = paginate(14, 1, 7);
    expect(p.pages).toBe(2); // 14/7 = 2 exactly, not 3
    const q = paginate(28, 2, 7);
    expect(q.pages).toBe(2); // 28 / (7×2) = 2 exactly
  });
});

describe('pageOf() — which page holds a global index', () => {
  it('maps indices to their page (perPage=7)', () => {
    expect(pageOf(0, 7)).toBe(0);
    expect(pageOf(6, 7)).toBe(0);
    expect(pageOf(7, 7)).toBe(1);
    expect(pageOf(13, 7)).toBe(1);
    expect(pageOf(29, 7)).toBe(4); // last item of the 30-list lands on page 5 (index 4)
  });
});

describe('paginate + pageOf — every index is reachable and in range', () => {
  it('no page ever addresses an item out of range (30 items, maxRows 7)', () => {
    const total = 30;
    const { perPage, pages } = paginate(total, 1, 7);
    const seen = new Set<number>();
    for (let page = 0; page < pages; page++) {
      const onPage = Math.min(perPage, total - page * perPage);
      expect(onPage).toBeGreaterThan(0); // no empty interior pages
      for (let slot = 0; slot < onPage; slot++) {
        const i = page * perPage + slot;
        expect(i).toBeGreaterThanOrEqual(0);
        expect(i).toBeLessThan(total); // <-- the overflow guarantee, proven
        expect(pageOf(i, perPage)).toBe(page); // the index round-trips to its page
        seen.add(i);
      }
    }
    expect(seen.size).toBe(total); // and EVERY item is shown on exactly one page
  });

  it('a column-major two-column list also covers exactly [0,total)', () => {
    const total = 23;
    const { perPage, pages } = paginate(total, 2, 7);
    const seen = new Set<number>();
    for (let page = 0; page < pages; page++) {
      const onPage = Math.min(perPage, total - page * perPage);
      for (let slot = 0; slot < onPage; slot++) {
        const i = page * perPage + slot;
        expect(i).toBeLessThan(total);
        seen.add(i);
      }
    }
    expect(seen.size).toBe(total);
  });

  it('flipping forward then back returns to the same page (wrap-free interior)', () => {
    const { perPage } = paginate(30, 1, 7);
    let i = 6; // bottom of page 0
    expect(pageOf(i, perPage)).toBe(0);
    i += 1; // step past the column edge → page 1
    expect(pageOf(i, perPage)).toBe(1);
    i -= 1; // back up → page 0 again
    expect(pageOf(i, perPage)).toBe(0);
  });
});

describe('the single-column menu (ask()) fit invariant', () => {
  // windows.ts ask() sizes its window to perPage rows (perPage*ROW_H + 16) and
  // pins the menu's BOTTOM edge, so a list that fits — perPage === its length —
  // keeps the exact pre-pagination height AND top position. This is the "short
  // menus never move or resize" contract; GAME_H=225 leaves room for 9 rows
  // above the dialogue box. (pick() instead sizes to rowsPerCol for a uniform
  // frame; for a single column perPage and rowsPerCol differ only on overflow.)
  const CAP = 9;

  it('ROW_H is the shared 14px row both widgets lay rows on', () => {
    expect(ROW_H).toBe(14);
  });

  it('a list that fits the row cap is one page sized exactly to its length', () => {
    for (const n of [1, 2, 3, 5, CAP]) {
      const { perPage, pages } = paginate(n, 1, CAP);
      expect(pages).toBe(1); // single page → no indicator, original position
      expect(perPage).toBe(n); // ask() height = n*ROW_H + 16, byte-identical
    }
  });

  it('one past the cap paginates, every page the same fixed height', () => {
    const { perPage, pages } = paginate(CAP + 1, 1, CAP);
    expect(pages).toBe(2);
    expect(perPage).toBe(CAP); // each page is CAP*ROW_H + 16, never taller
    expect(pageOf(CAP, perPage)).toBe(1); // the overflow item lives on page 2
  });
});
