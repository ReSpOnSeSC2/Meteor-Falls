/**
 * String-externalization layer (i18n) — Phaser-free, pure, headlessly testable.
 *
 * English-only TODAY; the layer exists so a future locale is a DATA drop, not a
 * code change. The design contract:
 *
 *   - `en` (src/data/strings/en.ts) is the CANONICAL key set. `StringKey` is
 *     `keyof typeof en`, so t() takes only real keys (compile-time checked) and
 *     every other locale is a `Partial<Record<StringKey, string>>` that falls
 *     back to en for anything it doesn't translate.
 *
 *   - t() returns the (localized) TEMPLATE. It does NOT duplicate the game's
 *     existing substitution pipelines — `{token}` (resolved later by
 *     src/ui/text.ts vars(), reading live game state) and `{g:NAME}` flair
 *     glyphs (consumed by the FlairLine typewriter) are left INTACT. t() only
 *     fills explicit `{var}` placeholders from caller-supplied `vars` (e.g.
 *     counts, the live ON/OFF value) that the GS pipeline never covers.
 *
 *   - a per-locale FORMATTER hook (pluralization/declension) is consulted when
 *     a `count`/`n` var is present, so grammar that English doesn't need can be
 *     added per locale with ZERO call-site churn.
 *
 * ADDING A LOCALE end-to-end: (1) add `src/data/strings/<l>.ts` exporting a
 * Partial table, (2) register it in TABLES below (or via the same map), (3)
 * OPTIONALLY registerFormatter(l, {...}) for plural/declension rules. No call
 * site changes — t('some.key') resolves the moment setLocale(l) flips over.
 */
import { en } from '../data/strings/en';
import { de } from '../data/strings/de';

/** Locales the game ships string tables for. Extend the union to add one. */
export type Locale = 'en' | 'de';

/** Every key the canonical English table defines — the allowed t() argument. */
export type StringKey = keyof typeof en;

/**
 * A per-locale grammar hook for the things English doesn't need (plural forms,
 * declension). t() consults the active locale's formatter only when the caller
 * passes a `count` (or `n`) var. Returning the finished string lets a locale
 * pick e.g. "1 Gegenstand" vs "{n} Gegenstände" off the same key + base.
 */
export interface LocaleFormatter {
  /** Shape `base` (the already-interpolated string) for the count `n`. */
  plural?(n: number, base: string, key: StringKey): string;
}

/**
 * The locale → table map. Non-en tables are Partial (missing keys fall back to
 * en). Adding a locale = add its file + an entry here; nothing else moves.
 */
const TABLES: Record<Locale, Partial<Record<StringKey, string>>> = {
  en,
  de,
};

/** Per-locale formatters, registered at startup. en needs none (default). */
const FORMATTERS: Partial<Record<Locale, LocaleFormatter>> = {};

let active: Locale = 'en';

/**
 * Read a persisted locale preference if one exists, guarded for non-browser /
 * test environments (no localStorage). Phaser-free and side-effect-light: an
 * invalid or absent value leaves the default 'en' in place.
 */
function readPersistedLocale(): Locale | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem('mf_locale');
    return raw === 'en' || raw === 'de' ? raw : null;
  } catch {
    // private-mode / denied storage — fall back to the default, never throw
    return null;
  }
}

const persisted = readPersistedLocale();
if (persisted) active = persisted;

/** Switch the module-level active locale (affects every later t() call). */
export function setLocale(l: Locale): void {
  active = l;
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem('mf_locale', l);
  } catch {
    /* storage denied — the in-memory switch still took, that's enough */
  }
}

/** The current active locale (default 'en', or the persisted pref). */
export function getLocale(): Locale {
  return active;
}

/** Register (or replace) a locale's grammar formatter. */
export function registerFormatter(l: Locale, f: LocaleFormatter): void {
  FORMATTERS[l] = f;
}

/** dev-only: same gate the rest of the engine uses for diagnostic warns. */
const isDev = typeof import.meta !== 'undefined' && Boolean(import.meta.env?.DEV);

/**
 * Fill explicit `{var}` placeholders from `vars`. Crucially LEAVES `{g:NAME}`
 * flair tokens and any `{token}` the caller didn't supply untouched, so the
 * downstream vars()/FlairLine pipelines still see them. Only keys present in
 * `vars` are substituted — a stray `{playername}` survives for ui/text.ts.
 */
function interpolate(template: string, vars: Record<string, string | number>): string {
  let out = template;
  for (const [name, value] of Object.entries(vars)) {
    if (out.includes(`{${name}}`)) out = out.replaceAll(`{${name}}`, String(value));
  }
  return out;
}

/**
 * Look up `key` in the active (or `opts.locale`) table, falling back to en for
 * anything a non-en table omits. Applies explicit `{var}` interpolation, then
 * the locale formatter's plural() when a count/n var is present.
 *
 * NEVER throws: a key missing even from en returns the key string itself (and
 * warns in dev), so a typo degrades to a visible breadcrumb, not a crash.
 */
export function t(
  key: StringKey,
  vars?: Record<string, string | number>,
  opts?: { locale?: Locale },
): string {
  const locale = opts?.locale ?? active;
  // active/opts table first, then en fallback for un-stubbed keys
  const template = TABLES[locale]?.[key] ?? en[key];
  if (template === undefined) {
    if (isDev) console.warn(`[i18n] missing string key: ${key}`);
    return key;
  }
  let out: string = template;
  if (vars) out = interpolate(out, vars);
  // grammar hook: consulted only when the caller signals a count
  const count = vars?.count ?? vars?.n;
  if (count !== undefined && typeof count === 'number') {
    const fmt = FORMATTERS[locale];
    if (fmt?.plural) out = fmt.plural(count, out, key);
  }
  return out;
}
