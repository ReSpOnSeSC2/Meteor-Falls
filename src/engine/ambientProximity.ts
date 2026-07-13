/**
 * Spatial rules for sparse environmental accents.
 *
 * Sea and shoreline cells are authored as `e`/`E` in the shared map legend.
 * Keeping proximity pure makes it cheap to test and prevents map-wide ambience
 * from pretending the player is beside water when it is several screens away.
 */
export const WATER_GLYPHS = 'eE';
export const WATER_ACCENT_RADIUS_TILES = 6;
export const WATER_ACCENT_INTERVAL_MS = 45_000;

export function containsWater(grid: readonly string[]): boolean {
  return grid.some((row) => {
    for (const glyph of WATER_GLYPHS) if (row.includes(glyph)) return true;
    return false;
  });
}

export function isNearWater(
  grid: readonly string[],
  tileX: number,
  tileY: number,
  radius = WATER_ACCENT_RADIUS_TILES,
): boolean {
  if (grid.length === 0 || radius < 0) return false;
  const r = Math.floor(radius);
  const r2 = radius * radius;
  const minY = Math.max(0, Math.floor(tileY) - r);
  const maxY = Math.min(grid.length - 1, Math.floor(tileY) + r);

  for (let y = minY; y <= maxY; y++) {
    const row = grid[y] ?? '';
    const minX = Math.max(0, Math.floor(tileX) - r);
    const maxX = Math.min(row.length - 1, Math.floor(tileX) + r);
    for (let x = minX; x <= maxX; x++) {
      if (!WATER_GLYPHS.includes(row[x] ?? '')) continue;
      const dx = x - tileX;
      const dy = y - tileY;
      if (dx * dx + dy * dy <= r2) return true;
    }
  }
  return false;
}
