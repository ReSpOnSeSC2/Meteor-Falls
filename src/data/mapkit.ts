/**
 * The map-building kit (S14): the Grid, the seeded rng, the deterministic
 * tree hash, and the doorstep derivation — extracted from maps.ts so chapter
 * map modules (maps_ch2.ts …) share them without an import cycle. Behavior
 * is byte-identical to the maps.ts originals; ADR-012's laws ride along:
 * seeds are FROZEN, layouts identical every boot, cross-map coordinates
 * that touch jittered placement are computed, never hardcoded.
 */
import type { MapDef } from '../schemas';

/**
 * Deterministic tree variety (ADR-019): same canvas + solid rect for every
 * variant, so the canon positions and collision stay byte-identical while
 * no two neighbors look alike. Pines only where `pines` is allowed.
 */
export function treeSprite(x: number, y: number, pines = false): string {
  const h = (x * 73 + y * 151) % 12;
  if (pines && h >= 9) return 'pine';
  if (h % 3 === 1) return 'tree_b';
  if (h % 3 === 2) return 'tree_c';
  return 'tree';
}

/** deterministic rng — map layouts must be identical on every boot
 *  (door positions, saves, and tests depend on it), so "randomness" here
 *  means seeded organic irregularity, never per-run variation */
export function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return (): number => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Grid {
  rows: string[][];
  w: number;
  h: number;
  constructor(w: number, h: number, fill = '.') {
    this.w = w;
    this.h = h;
    this.rows = Array.from({ length: h }, () => Array.from({ length: w }, () => fill));
  }
  set(x: number, y: number, ch: string): void {
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.rows[y][x] = ch;
  }
  rect(x: number, y: number, w: number, h: number, ch: string): this {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, ch);
    return this;
  }
  sprinkle(seed: number, chars: string, density: number): this {
    const rng = seededRng(seed);
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.rows[y][x] === '.' && rng() < density) {
          this.set(x, y, chars[Math.floor(rng() * chars.length)]);
        }
      }
    }
    return this;
  }
  out(): string[] {
    return this.rows.map((r) => r.join(''));
  }
}

/**
 * A building's doorstep on the street, derived from its (possibly jittered)
 * facade prop — cross-map coordinates that touch jittered placement are
 * computed, never hardcoded (ADR-012; the dos_f1 pattern, shared since S4).
 */
export function doorstepOf(map: MapDef, to: string): { tx: number; ty: number } | null {
  const prop = map.props.find((p) => p.door?.to === to);
  const d = prop?.door;
  if (prop && d) return { tx: prop.x * 16 + d.ox + d.w / 2, ty: prop.y * 16 + d.oy + d.h + 5 };

  const zone = map.doors.find((door) => door.to === to);
  if (!zone) return null;
  const cx = (zone.x + zone.w / 2) * 16;
  const cy = (zone.y + zone.h / 2) * 16;
  return { tx: cx, ty: cy };
}
