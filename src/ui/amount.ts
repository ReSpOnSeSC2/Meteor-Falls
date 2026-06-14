/**
 * THE AMOUNT ODOMETER (ADR-105) — the ATM's "pick a number" widget.
 *
 * The old ATM offered three fixed presets ($10/$50/$100) plus "All", useless
 * once the §A9 economy reaches the millions/billions. The first cut replaced it
 * with a single nudge-able step; playtest feedback (you couldn't set the
 * thousands AND hundreds AND tens at once — only one denomination at a time)
 * turned it into a proper ODOMETER: every place value is its own digit column,
 * all visible together, each independently scrollable.
 *
 * `amountColumns(pool)` (pure, in amountscale.ts) decides the columns from the
 * balance's magnitude. `askAmount` is the widget: the running amount reads out as
 * digits, the cursor sits under one column, and input is read per frame exactly
 * like ui/pick.ts (INPUT.dir() + everyFrame), ADR-024 time-based repeat:
 *   ◄ / ►  move the cursor between digit columns (thousands ↔ hundreds ↔ …)
 *   ▲ / ▼  raise / lower the amount by THAT column's place value (accelerating)
 *   A      confirm → resolves the chosen amount; B cancel → resolves null
 * The amount is always clamped to [0, pool].
 */
import Phaser from 'phaser';
import { INPUT } from '../engine/input';
import { AUDIO } from '../engine/audio';
import { makeWindow, everyFrame, DEPTH_UI } from './windows';
import { colorOf, px, RAMP } from '../palette';
import { money } from './text';
import { DIM } from './pick';
import { amountColumns } from './amountscale';

// the pure column brain lives in a Phaser-free module so it unit-tests headless;
// re-exported here so callers can reach it through ui/amount too.
export { amountColumns } from './amountscale';

export interface AmountOpts {
  /** the ceiling — the chosen amount is clamped to [0, pool] */
  pool: number;
  /** window heading, e.g. "WITHDRAW" / "DEPOSIT" */
  title: string;
  /** a short source label shown under the title, e.g. "from your CARD" */
  source?: string;
  /** starting amount (default 0) */
  start?: number;
}

const GOLD = (): number => colorOf(px(RAMP.GOLD, 3));
const DIGIT_SIZE = 12; // 2× the 6px base font for a readable readout
const CELL_W = 12; //     'retro' is fixed-advance: 6px at size 6 → 12px at size 12
const HINT = '▲▼ adjust  ◄► place  A ok  B back';

/**
 * Open the amount odometer over the current scene. Resolves the chosen amount
 * (an integer in [0, pool]) on A, or null on B. Self-tears-down either way.
 */
export function askAmount(scene: Phaser.Scene, opts: AmountOpts): Promise<number | null> {
  const pool = Math.max(0, Math.floor(opts.pool));
  const cols = amountColumns(pool); // place values, most-significant first
  let value = Math.max(0, Math.min(Math.floor(opts.start ?? 0), pool));
  let sel = 0; // cursor over cols — leftmost (highest place) first

  // the readout cells: a "$" prefix, grouping commas, and one digit per column
  type Cell = { kind: 'prefix' | 'comma' | 'digit'; col: number };
  const cells: Cell[] = [{ kind: 'prefix', col: -1 }];
  const n = cols.length;
  for (let i = 0; i < n; i++) {
    if (i > 0 && (n - i) % 3 === 0) cells.push({ kind: 'comma', col: -1 });
    cells.push({ kind: 'digit', col: i });
  }
  const rowW = cells.length * CELL_W;

  // geometry: a centered window sized to the readout + the hint line
  const w = Math.min(scene.scale.width - 8, Math.max(200, rowW + 28, HINT.length * 6 + 16));
  const h = 100;
  const x = Math.round((scene.scale.width - w) / 2);
  const y = 54;
  const cx = x + w / 2;
  const rowY = y + 40;
  const made: Phaser.GameObjects.GameObject[] = [];
  made.push(makeWindow(scene, x, y, w, h));

  const mk = (px0: number, py: number, s: string, size: number, tint?: number): Phaser.GameObjects.BitmapText => {
    const t = scene.add.bitmapText(px0, py, 'retro', s, size).setScrollFactor(0).setDepth(DEPTH_UI + 1);
    if (tint !== undefined) t.setTint(tint);
    made.push(t);
    return t;
  };
  const center = (t: Phaser.GameObjects.BitmapText): void => {
    t.setX(Math.round(cx - t.width / 2));
  };

  const title = mk(0, y + 8, opts.title, 6, GOLD());
  center(title);
  if (opts.source) {
    const s = mk(0, y + 18, opts.source, 6, DIM);
    center(s);
  }

  // lay the odometer cells left→right, centered; remember each digit cell's x
  const rowX = Math.round(cx - rowW / 2);
  const digitObjs: { t: Phaser.GameObjects.BitmapText; col: number; cellX: number }[] = [];
  cells.forEach((cell, k) => {
    const cellX = rowX + k * CELL_W;
    if (cell.kind === 'prefix') mk(cellX, rowY, '$', DIGIT_SIZE, 0xffffff);
    else if (cell.kind === 'comma') mk(cellX, rowY, ',', DIGIT_SIZE, DIM);
    else digitObjs.push({ t: mk(cellX, rowY, '0', DIGIT_SIZE, 0xffffff), col: cell.col, cellX });
  });

  // the up/down chevrons hover over the SELECTED digit (the font draws them, ADR-105)
  const chevUp = mk(0, rowY - 11, '▲', 6, GOLD());
  const chevDn = mk(0, rowY + DIGIT_SIZE + 1, '▼', 6, GOLD());

  const ceil = mk(0, y + 70, `/ ${money(pool)}`, 6, DIM);
  center(ceil);
  const hintT = mk(0, y + 84, HINT, 6, DIM);
  center(hintT);

  const render = (): void => {
    for (const d of digitObjs) {
      d.t.setText(String(Math.floor(value / cols[d.col]) % 10));
      // active column lit gold; leading zeros dimmed so the readout doesn't shout
      // "$0,000"; significant digits bright.
      const leadingZero = value < cols[d.col] && d.col < n - 1;
      d.t.setTint(d.col === sel ? GOLD() : leadingZero ? DIM : 0xffffff);
    }
    const active = digitObjs.find((d) => d.col === sel);
    if (active) {
      chevUp.setX(Math.round(active.cellX + (CELL_W - chevUp.width) / 2));
      chevDn.setX(Math.round(active.cellX + (CELL_W - chevDn.width) / 2));
    }
    ceil.setTint(value >= pool && pool > 0 ? GOLD() : DIM);
  };
  render();

  return new Promise<number | null>((resolve) => {
    let done = false;
    const finish = (result: number | null): void => {
      if (done) return;
      done = true;
      AUDIO.sfx(result === null ? 'cancel' : 'confirm');
      off();
      made.forEach((m) => m.destroy());
      resolve(result);
    };

    // ADR-024: repeat is WALL-CLOCK timed (scene.time.now), so the dial feels
    // identical at any frame rate; holding ▲/▼ accelerates.
    let prevX = 0;
    let prevY = 0;
    let holdStart = 0;
    let nextRepeat = 0;
    const bump = (dy: number): void => {
      const next = Math.max(0, Math.min(value + (dy < 0 ? 1 : -1) * cols[sel], pool));
      if (next !== value) {
        value = next;
        AUDIO.sfx('cursor');
        render();
      }
    };

    const off = everyFrame(scene, () => {
      if (INPUT.justPressed('A')) return finish(value);
      if (INPUT.justPressed('B')) return finish(null);
      const d = INPUT.dir();
      const now = scene.time.now;
      // move the cursor between columns (edge-triggered, clamped to the ends)
      if (d.x !== 0 && prevX === 0 && cols.length > 1) {
        sel = Math.max(0, Math.min(sel + (d.x > 0 ? 1 : -1), cols.length - 1));
        AUDIO.sfx('cursor');
        render();
      }
      prevX = d.x;
      // scroll the active digit (act at once on a fresh press, then accelerate)
      if (d.y !== 0) {
        if (prevY === 0) {
          bump(d.y);
          holdStart = now;
          nextRepeat = now + 320;
        } else if (now >= nextRepeat) {
          bump(d.y);
          const held = now - holdStart;
          nextRepeat = now + (held > 1400 ? 35 : held > 700 ? 70 : 150);
        }
      }
      prevY = d.y;
    });
  });
}
