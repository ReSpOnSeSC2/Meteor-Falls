/**
 * THE LEVELKIT — deterministic named streams (S15g, ADR-044, Prime Law 2).
 *
 * Every generator is (recipe + seed) → identical bytes. The randomness here
 * is the SAME mulberry32 the map layouts have always frozen on: `seededRng`
 * (src/data/mapkit.ts) is mulberry32 (the 0x6d2b79f5 step), so a levelkit
 * stream and a maps.ts stream advance bit-for-bit alike, and the existing
 * ADR-012/ADR-016 determinism law extends to generated maps unchanged.
 *
 * One map id opens one `Streams(seed)`. Inside it, each NAMED sub-stream
 * (`streets`, `lots`, `props`, …) is its own mulberry32 keyed on (seed, name)
 * — the maps.ts habit of opening "a SEPARATE seededRng(2077) stream" so one
 * pass can't shift another's bytes, made first-class and named. A given
 * (seed, name) reproduces the same sequence forever; the moment a draft is
 * promoted and SHIPS, that recipe's bytes freeze like Otterbrook 1995.
 *
 * Date.now()/Math.random() never appear here or anywhere under src/levelkit/**
 * (Prime Law 2) — vitest hash-pins prove it by re-deriving identical output.
 */
import { seededRng } from '../data/mapkit';

/** FNV-1a string hash → 32-bit, so sub-stream seeds derive from a name's
 *  bytes deterministically (no Math.random, stable across boots forever). */
function strHash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** the seed for a named sub-stream of `seed` — pure (seed, name) → u32 */
export function streamSeed(seed: number, name: string): number {
  return ((seed >>> 0) ^ strHash(name)) >>> 0;
}

/** a single mulberry32 sub-stream keyed on (seed, name) */
export function namedStream(seed: number, name: string): () => number {
  return seededRng(streamSeed(seed, name));
}

/**
 * The per-map stream bundle. `use(name)` returns that name's mulberry32,
 * CACHED so repeated calls within one build keep advancing the same stream
 * (a fresh build of the same recipe re-derives it identically). The int /
 * pick / chance / jitter helpers are the verbs the generators actually use.
 */
export class Streams {
  readonly seed: number;
  private readonly cache = new Map<string, () => number>();

  constructor(seed: number) {
    this.seed = seed >>> 0;
  }

  /** the named stream (created on first use, cached thereafter) */
  use(name: string): () => number {
    let s = this.cache.get(name);
    if (!s) {
      s = namedStream(this.seed, name);
      this.cache.set(name, s);
    }
    return s;
  }

  /** next float in [0, 1) from `name` */
  next(name: string): number {
    return this.use(name)();
  }

  /** integer in [0, n) from `name` */
  int(name: string, n: number): number {
    return Math.floor(this.use(name)() * n);
  }

  /** integer in [lo, hi] inclusive from `name` */
  range(name: string, lo: number, hi: number): number {
    return lo + Math.floor(this.use(name)() * (hi - lo + 1));
  }

  /** true with probability p from `name` */
  chance(name: string, p: number): boolean {
    return this.use(name)() < p;
  }

  /** one element of arr from `name` (arr must be non-empty) */
  pick<T>(name: string, arr: readonly T[]): T {
    return arr[Math.floor(this.use(name)() * arr.length)];
  }

  /** signed jitter in [-amt, +amt] (integer) from `name` */
  jitter(name: string, amt: number): number {
    return Math.round((this.use(name)() * 2 - 1) * amt);
  }
}
