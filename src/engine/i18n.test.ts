/**
 * i18n layer behavior. Proves the contract the rest of the codebase will lean
 * on BEFORE any call site migrates: en lookup, explicit {var} interpolation,
 * the existing {token}/{g:NAME} pipelines surviving untouched, de→en fallback,
 * the 5 real de stubs, the never-throw missing-key path, and the formatter hook.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { t, setLocale, getLocale, registerFormatter, type StringKey } from './i18n';

// every test starts from the default locale; restore after the ones that flip it
beforeEach(() => setLocale('en'));
afterEach(() => setLocale('en'));

describe('key lookup (en)', () => {
  it('returns the canonical English value', () => {
    expect(t('menu.items')).toBe('ITEMS');
    expect(t('grid.random')).toBe('RANDOM');
    expect(t('setup.mainControls')).toBe('Main Controls');
  });

  it('default locale is en', () => {
    expect(getLocale()).toBe('en');
  });
});

describe('explicit {var} interpolation', () => {
  it('fills only caller-supplied vars', () => {
    expect(t('setup.sound', { value: 'ON' })).toBe('Sound: ON');
    expect(t('setup.windowFlavor', { value: 'CLASSIC' })).toBe('Window flavor: CLASSIC');
  });

  it('coerces numbers to strings', () => {
    // a synthetic count via an en key that carries {value}
    expect(t('setup.textSpeed', { value: 2 })).toBe('Text speed: 2');
  });
});

describe('the existing pipelines survive untouched', () => {
  it('leaves a {token} for ui/text.ts vars() to resolve later', () => {
    // {value} not supplied → the placeholder passes through verbatim for the
    // downstream pipeline (here: nobody resolves it, proving t() never guesses)
    expect(t('setup.sound', { other: 'x' })).toBe('Sound: {value}');
    // and with NO vars at all, the raw template (token intact) comes back
    expect(t('setup.windowFlavor')).toBe('Window flavor: {value}');
  });

  it('leaves {g:NAME} flair glyphs and unrelated {token}s intact while filling a sibling var', () => {
    // the i18n.flairProof fixture key (en.ts) carries an explicit {value}, a
    // game-state {playername}, and a {g:fire} flair glyph. t() fills ONLY
    // {value}; the FlairLine glyph and the vars()-owned token must survive.
    const out = t('i18n.flairProof', { value: 'high' });
    expect(out).toBe('Heat high {g:fire} for {playername}');
  });
});

describe('de → en fallback', () => {
  it('falls back to en for keys de does not stub', () => {
    setLocale('de');
    // 'menu.items' is NOT in de.ts → must read the English value
    expect(t('menu.items')).toBe('ITEMS');
  });

  it('honors an explicit opts.locale without flipping the active one', () => {
    expect(t('common.on', undefined, { locale: 'de' })).toBe('AN');
    expect(getLocale()).toBe('en');
  });
});

describe('the 5 de stubs resolve under de', () => {
  it('returns the German translations', () => {
    setLocale('de');
    expect(t('common.on')).toBe('AN');
    expect(t('common.off')).toBe('AUS');
    expect(t('common.back')).toBe('Zurück');
    expect(t('menu.setup')).toBe('EINSTELLUNGEN');
    expect(t('setup.sound', { value: 'AN' })).toBe('Ton: AN');
  });
});

describe('missing key never throws', () => {
  it('returns the key string for a key absent even from en', () => {
    // cast through unknown: deliberately defeat the compile-time guard to
    // exercise the runtime safety net (a typo'd key at a future call site)
    const bogus = 'menu.doesNotExist' as unknown as StringKey;
    expect(() => t(bogus)).not.toThrow();
    expect(t(bogus)).toBe('menu.doesNotExist');
  });
});

describe('formatter hook (plural/declension)', () => {
  it('consults the active locale formatter when a count var is present', () => {
    let seen: { n: number; base: string; key: string } | null = null;
    registerFormatter('de', {
      plural(n, base, key) {
        seen = { n, base, key };
        return n === 1 ? base : `${base} (Plural)`;
      },
    });
    setLocale('de');
    // 'menu.items' falls back to en ('ITEMS'); the formatter then shapes it
    const out = t('menu.items', { count: 3 });
    expect(out).toBe('ITEMS (Plural)');
    expect(seen).toEqual({ n: 3, base: 'ITEMS', key: 'menu.items' });
  });

  it('also triggers on an `n` var, and not when no count is given', () => {
    let calls = 0;
    registerFormatter('de', {
      plural(_n, base) {
        calls += 1;
        return base;
      },
    });
    setLocale('de');
    t('menu.items'); // no count/n → formatter NOT consulted
    expect(calls).toBe(0);
    t('menu.items', { n: 2 }); // n present → consulted
    expect(calls).toBe(1);
  });
});
