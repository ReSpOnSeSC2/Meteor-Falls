/**
 * tools/bg-remove.ts — VET + STRIP flat backgrounds from authored PNG art.
 *
 * Sprites and tiles need TRANSPARENT backgrounds (they composite over the
 * world); AI-generated art usually arrives on a flat fill (black, magenta,
 * white). This tool:
 *   1. VETS a folder and reports every PNG that still has a solid background
 *      (default — writes nothing), and
 *   2. REMOVES it on --fix, two ways:
 *        • flood-fill the EDGE-CONNECTED background (default, safe — keeps dark
 *          pixels INSIDE the sprite, e.g. black outlines, because they aren't
 *          connected to the border), or
 *        • chroma-key a color EVERYWHERE (--key … --global) for see-through
 *          interior gaps, e.g. the black between fence slats.
 *
 * Zero-dependency: uses tools/imageio.ts (8-bit RGB/RGBA, non-interlaced PNG).
 *
 * USAGE (run with vite-node):
 *   npm run bg:check                         # vet assets/art, list candidates
 *   npm run bg -- <path…> --fix              # strip backgrounds (in place)
 *   vite-node tools/bg-remove.ts -- <path…> [options]
 *
 * OPTIONS
 *   --check               vet only, write nothing                      (DEFAULT)
 *   --fix                 remove backgrounds and write files
 *   --key <hex>           background / key color (e.g. ff00ff, 000000).
 *                         Omit to auto-detect the dominant border color.
 *   --global              with --key: remove that color EVERYWHERE, not only the
 *                         edge-connected region (use for interior gaps / fences)
 *   --tol <n>             color tolerance 0..150 (default 32) — higher catches
 *                         anti-aliased edge pixels, too high eats the art
 *   --in-place            overwrite the original PNG (default when --fix and no
 *                         --out / --suffix given)
 *   --suffix <s>          instead write next to it as "<name><s>.png"
 *   --out <dir>           instead write into <dir>, mirroring the input tree
 *   --skip <substr>       skip any path containing <substr> (repeatable). Default
 *                         skips full-screen art that SHOULD keep its background.
 *   --min-border <pct>    border coverage to count as a background (default 55)
 *   -h, --help            this help
 *
 * EXAMPLES
 *   npm run bg:check                                   # what has a background?
 *   npm run bg -- assets/art/characters --fix          # strip sprite fills
 *   npm run bg -- raw.png --key ff00ff --fix           # key out a magenta fill
 *   npm run bg -- fence.png --key 000000 --global --fix # black gaps -> see-through
 */
import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, basename, extname, relative, resolve } from 'node:path';
import { decodePng, encodePng, type Img } from './imageio';

type RGB = [number, number, number];
interface Opts {
  paths: string[];
  fix: boolean;
  key: RGB | null;
  global: boolean;
  tol: number;
  inPlace: boolean;
  suffix: string;
  out: string | null;
  skip: string[];
  minBorder: number;
}

// full-screen art that is SUPPOSED to keep its background — never auto-strip
const DEFAULT_SKIP = ['backgrounds/', 'screens/', 'cutscenes/', 'masters/generated/', '/review/', 'title_bg', 'name_entry_bg', 'save_slots_bg', 'game_over'];

function hexToRgb(h: string): RGB {
  const s = h.replace(/^#/, '');
  const f = s.length === 3 ? s.split('').map((c) => c + c).join('') : s;
  const n = parseInt(f, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const rgbToHex = (c: RGB): string => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');

function parseArgs(): Opts {
  const argv = process.argv.slice(2).filter((a) => a !== '--' && !a.endsWith('bg-remove.ts'));
  const o: Opts = { paths: [], fix: false, key: null, global: false, tol: 32, inPlace: false, suffix: '-nobg', out: null, skip: [], minBorder: 55 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const val = (): string => {
      const v = argv[++i];
      if (v === undefined) { console.error(`${a} needs a value`); process.exit(1); }
      return v;
    };
    switch (a) {
      case '--check': o.fix = false; break;
      case '--fix': o.fix = true; break;
      case '--key': o.key = hexToRgb(val()); break;
      case '--global': o.global = true; break;
      case '--tol': case '--tolerance': o.tol = Number(val()); break;
      case '--in-place': o.inPlace = true; break;
      case '--suffix': o.suffix = val(); break;
      case '--out': o.out = val(); break;
      case '--skip': o.skip.push(val()); break;
      case '--min-border': o.minBorder = Number(val()); break;
      case '-h': case '--help': printHelp(); process.exit(0); break;
      default:
        if (a.startsWith('-')) { console.error(`unknown option: ${a}  (try --help)`); process.exit(1); }
        o.paths.push(a);
    }
  }
  if (o.paths.length === 0) o.paths = ['assets/art'];
  return o;
}

function printHelp(): void {
  const header = '/**';
  const text = readFileSync(new URL(import.meta.url)).toString();
  const doc = text.slice(text.indexOf(header) + header.length, text.indexOf(' */'));
  console.log(doc.replace(/^\s*\*?/gm, '').trim());
}

/** every .png under the given files/dirs (recursive), in stable order */
function collectPngs(paths: string[]): string[] {
  const out: string[] = [];
  const walk = (p: string): void => {
    const st = statSync(p);
    if (st.isDirectory()) {
      for (const name of readdirSync(p).sort()) walk(join(p, name));
    } else if (extname(p).toLowerCase() === '.png') {
      out.push(p);
    }
  };
  for (const p of paths) {
    if (!existsSync(p)) { console.error(`path not found: ${p}`); continue; }
    walk(p);
  }
  return out;
}

interface Vet { transparentPct: number; bg: RGB; coverage: number }

/** transparency level + the dominant OPAQUE border color and its coverage */
function vet(img: Img): Vet {
  const { w, h, data } = img;
  let transparent = 0;
  for (let i = 0; i < w * h; i++) if (data[i * 4 + 3] < 255) transparent++;

  const hist = new Map<number, number>();
  let borderN = 0;
  const add = (x: number, y: number): void => {
    const o = (y * w + x) * 4;
    if (data[o + 3] === 0) return; // transparent border pixels don't count
    const k = (data[o] << 16) | (data[o + 1] << 8) | data[o + 2];
    hist.set(k, (hist.get(k) ?? 0) + 1);
    borderN++;
  };
  for (let x = 0; x < w; x++) { add(x, 0); add(x, h - 1); }
  for (let y = 1; y < h - 1; y++) { add(0, y); add(w - 1, y); }

  let best = -1; let bestKey = 0;
  for (const [k, c] of hist) if (c > best) { best = c; bestKey = k; }
  const bg: RGB = [(bestKey >> 16) & 255, (bestKey >> 8) & 255, bestKey & 255];
  return { transparentPct: (100 * transparent) / (w * h), bg, coverage: borderN ? (100 * best) / borderN : 0 };
}

const dist2 = (data: Uint8Array, o: number, c: RGB): number => {
  const dr = data[o] - c[0]; const dg = data[o + 1] - c[1]; const db = data[o + 2] - c[2];
  return dr * dr + dg * dg + db * db;
};

/** flood-fill from the border, clearing pixels within tol of `bg`. Returns count. */
function floodRemove(img: Img, bg: RGB, tol: number): number {
  const { w, h, data } = img;
  const tol2 = tol * tol;
  const seen = new Uint8Array(w * h);
  const stack: number[] = [];
  for (let x = 0; x < w; x++) { stack.push(x, (h - 1) * w + x); }
  for (let y = 0; y < h; y++) { stack.push(y * w, y * w + w - 1); }
  let removed = 0;
  while (stack.length) {
    const i = stack.pop() as number;
    if (seen[i]) continue;
    seen[i] = 1;
    const o = i * 4;
    if (data[o + 3] === 0 || dist2(data, o, bg) > tol2) continue; // not background — wall
    data[o + 3] = 0;
    removed++;
    const x = i % w; const y = (i / w) | 0;
    if (x > 0) stack.push(i - 1);
    if (x < w - 1) stack.push(i + 1);
    if (y > 0) stack.push(i - w);
    if (y < h - 1) stack.push(i + w);
  }
  return removed;
}

/** clear EVERY pixel within tol of `key`, regardless of position. */
function globalRemove(img: Img, key: RGB, tol: number): number {
  const { w, h, data } = img;
  const tol2 = tol * tol;
  let removed = 0;
  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    if (data[o + 3] === 0) continue;
    if (dist2(data, o, key) <= tol2) { data[o + 3] = 0; removed++; }
  }
  return removed;
}

function outPath(p: string, o: Opts): string {
  if (o.out) return join(o.out, relative(process.cwd(), resolve(p)));
  if (o.inPlace || (!o.out && o.suffix === '')) return p;
  if (o.suffix && !o.inPlace) {
    const dir = dirname(p); const ext = extname(p);
    return join(dir, basename(p, ext) + o.suffix + ext);
  }
  return p;
}

function main(): void {
  const o = parseArgs();
  const skip = [...DEFAULT_SKIP, ...o.skip];
  const files = collectPngs(o.paths).filter((p) => !skip.some((s) => p.replace(/\\/g, '/').includes(s)));
  // when --fix and the user named NO output target, default to overwriting
  if (o.fix && !o.out && !o.inPlace && o.suffix === '-nobg') o.inPlace = true;

  console.log(`bg-remove — ${o.fix ? 'FIX' : 'CHECK'} · ${files.length} PNGs · tol=${o.tol}` +
    `${o.key ? ` · key=${rgbToHex(o.key)}${o.global ? ' (global)' : ''}` : ' · auto-detect border'}` +
    `${o.fix ? (o.inPlace ? ' · writing IN PLACE' : o.out ? ` · -> ${o.out}` : ` · suffix ${o.suffix}`) : ''}\n`);

  let flagged = 0; let fixed = 0; let skippedBad = 0;
  for (const p of files) {
    const rel = relative(process.cwd(), p).replace(/\\/g, '/');
    let img: Img;
    try { img = decodePng(new Uint8Array(readFileSync(p))); }
    catch (e) { console.log(`  SKIP   ${rel}  (can't read: ${(e as Error).message})`); skippedBad++; continue; }

    const v = vet(img);
    const bgColor = o.key ?? v.bg;
    // a "background" = essentially opaque AND a flat color dominates the border
    // (auto), OR the user named a --key explicitly.
    const hasBg = o.key !== null || (v.transparentPct < 2 && v.coverage >= o.minBorder);

    if (!o.fix) {
      if (hasBg) {
        console.log(`  HAS BG ${rel}  ${img.w}x${img.h}  bg=${rgbToHex(v.bg)} border=${v.coverage.toFixed(0)}% opaque`);
        flagged++;
      } else if (v.transparentPct >= 2) {
        // already cut out — quiet unless you want it; comment in for verbosity:
        // console.log(`  ok     ${rel}  (${v.transparentPct.toFixed(0)}% transparent)`);
      } else {
        // opaque but no dominant flat border — likely a real background/scene; leave it
      }
      continue;
    }

    if (!hasBg) continue;
    const removed = o.key && o.global ? globalRemove(img, bgColor, o.tol) : floodRemove(img, bgColor, o.tol);
    const pct = (100 * removed) / (img.w * img.h);
    if (removed === 0) { console.log(`  ·      ${rel}  (nothing matched bg=${rgbToHex(bgColor)} @tol ${o.tol})`); continue; }
    const dest = outPath(p, o);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, encodePng(img));
    console.log(`  fixed  ${rel}  -${pct.toFixed(1)}% px  bg=${rgbToHex(bgColor)}${dest !== p ? `  -> ${relative(process.cwd(), dest).replace(/\\/g, '/')}` : ''}`);
    fixed++;
  }

  console.log('');
  if (o.fix) console.log(`done — ${fixed} stripped, ${skippedBad} unreadable, ${files.length - fixed - skippedBad} left alone.`);
  else console.log(`done — ${flagged} look like they still have a background, ${skippedBad} unreadable. Re-run with --fix to strip them.`);
}

main();
