/**
 * THE AMOUNT ODOMETER SCALE (ADR-105) — the pure brain behind the ATM dial.
 *
 * Kept Phaser-free (the audiobus.ts / paginate.ts idiom) so it unit-tests under
 * vitest's node env; the widget that consumes it (ui/amount.ts) pulls Phaser and
 * the audio engine and so can't run headless.
 */

/**
 * The place-value COLUMNS to dial a balance of `pool`, most-significant first —
 * one per digit, so the player sets the thousands, hundreds, tens (and ones)
 * independently, all visible at once (an odometer), instead of nudging a single
 * step. The count follows the balance's magnitude, so it scales cleanly from a
 * four-figure card to the §A9 billions.
 *   $4,820         → [1000, 100, 10, 1]
 *   $50            → [10, 1]
 *   $7             → [1]
 *   $0             → [1]
 *   $1,000,000,000 → [1e9, 1e8, … , 10, 1]
 */
export function amountColumns(pool: number): number[] {
  const p = Math.max(0, Math.floor(pool));
  const digits = p < 1 ? 1 : String(p).length;
  const cols: number[] = [];
  for (let k = digits - 1; k >= 0; k--) cols.push(10 ** k);
  return cols;
}
