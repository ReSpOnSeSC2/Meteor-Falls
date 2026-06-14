/**
 * [PLAYTEST B] The PURE page math for the shared list widget (ui/pick.ts) — kept
 * Phaser-FREE so it unit-tests headlessly (see pick.test.ts; pick.ts itself pulls
 * in Phaser, which can't load without a DOM). pick() sizes its window to ONE page
 * derived from here, which is what makes a long list structurally unable to
 * overflow its frame — it paginates instead of growing.
 */

/** the on-screen row height of one list row, in px (pick() lays rows on this) */
export const ROW_H = 14;

export interface PageInfo {
  /** rows shown per column on a page (== effective maxRows, ≥1) */
  rowsPerCol: number;
  /** items per page (rowsPerCol * cols, but never more than `total`) */
  perPage: number;
  /** number of pages needed to show every item (≥1) */
  pages: number;
}

/**
 * Given a total item count, the column count, and the max rows that physically
 * fit PER COLUMN, work out how many items fit on one page and how many pages the
 * list needs. `rowsPerCol`/`perPage` are clamped to ≥1 so a degenerate maxRows
 * can never divide-by-zero or drop a row, and exact multiples never leave a
 * phantom trailing page.
 *
 * Items lay out column-MAJOR within a page (matching pick()'s cellPos): the first
 * `rowsPerCol` items fill column 0 top-to-bottom, then column 1, and so on.
 */
export function paginate(total: number, cols: number, maxRows: number): PageInfo {
  const c = Math.max(1, Math.floor(cols));
  const rowsPerCol = Math.max(1, Math.floor(maxRows));
  const perPage = Math.min(Math.max(1, total), rowsPerCol * c);
  const pages = Math.max(1, Math.ceil(total / perPage));
  return { rowsPerCol, perPage, pages };
}

/** the page that holds a given global index (column-major, perPage items/page) */
export function pageOf(index: number, perPage: number): number {
  return Math.floor(index / Math.max(1, perPage));
}
