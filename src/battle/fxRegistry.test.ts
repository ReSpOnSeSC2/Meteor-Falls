/**
 * S11 — the registry completeness MIRROR (the validator enforces the same
 * truths in tools/content-validate.ts; this suite keeps them red in vitest
 * even if someone runs tests without the validate leg). Both directions:
 * an fx key data points at must exist, and an ability-kind key nothing
 * points at is a dead manifest row — fail naming it.
 */
import { describe, expect, it } from 'vitest';
import { ABILITIES } from '../data/abilities';
import { ITEMS } from '../data/items';
import { FX_REGISTRY, STAGE_ANIM, impactKeyOf, itemFxKey, stagePoseOf } from './fxRegistry';

describe('fx registry ⇄ abilities (both directions)', () => {
  it('every ability fx key is registered as kind ability', () => {
    for (const a of Object.values(ABILITIES)) {
      const spec = FX_REGISTRY[a.fx];
      expect(spec, `ability '${a.id}' fx '${a.fx}' is unregistered`).toBeDefined();
      expect(spec.kind, `ability '${a.id}' fx '${a.fx}' must be kind 'ability'`).toBe('ability');
    }
  });

  it('every kind-ability key is referenced by at least one ability', () => {
    const used = new Set(Object.values(ABILITIES).map((a) => a.fx));
    for (const [key, spec] of Object.entries(FX_REGISTRY)) {
      if (spec.kind !== 'ability') continue;
      expect(used.has(key), `registry key '${key}' (kind ability) has no ability pointing at it`).toBe(true);
    }
  });
});

describe('fx registry ⇄ battle items', () => {
  it('every battle-usable item resolves to a registered kind-item key', () => {
    for (const item of Object.values(ITEMS)) {
      if (!item.usableInBattle) continue;
      const key = itemFxKey(item.id, item.kind);
      expect(key, `battle item '${item.id}' resolves no fx key`).not.toBeNull();
      const spec = FX_REGISTRY[key as string];
      expect(spec, `battle item '${item.id}' fx '${key}' is unregistered`).toBeDefined();
      expect(spec.kind, `battle item '${item.id}' fx '${key}' must be kind 'item'`).toBe('item');
    }
  });

  it('every kind-item key is reachable from some battle-usable item', () => {
    const reachable = new Set(
      Object.values(ITEMS)
        .filter((i) => i.usableInBattle)
        .map((i) => itemFxKey(i.id, i.kind))
        .filter((k): k is string => k !== null),
    );
    for (const [key, spec] of Object.entries(FX_REGISTRY)) {
      if (spec.kind !== 'item') continue;
      expect(reachable.has(key), `registry key '${key}' (kind item) is unreachable from ITEMS`).toBe(true);
    }
  });
});

describe('STAGE_ANIM ⇄ fx families (both directions, S11b)', () => {
  it('every family the registry uses resolves a stage anim', () => {
    for (const [key, spec] of Object.entries(FX_REGISTRY)) {
      expect(spec.family in STAGE_ANIM, `fx '${key}' family '${spec.family}' has no STAGE_ANIM row`).toBe(true);
    }
  });

  it('every stage row is a family some registry entry uses', () => {
    const used = new Set(Object.values(FX_REGISTRY).map((s) => s.family));
    for (const family of Object.keys(STAGE_ANIM)) {
      expect(used.has(family as never), `STAGE_ANIM row '${family}' is used by no fx entry`).toBe(true);
    }
  });

  it('the user-directed choreography pins hold', () => {
    // cast families raise arms; spiral/scan aim; throw_arc lobs; pray kneels;
    // food/cola consume on-card (S11b prompt — the canon assignments)
    expect(STAGE_ANIM.surge).toBe('cast');
    expect(STAGE_ANIM.spiral).toBe('aim');
    expect(STAGE_ANIM.scan).toBe('aim');
    expect(STAGE_ANIM.throw_arc).toBe('throw');
    expect(STAGE_ANIM.rocket).toBe('throw');
    expect(STAGE_ANIM.pray).toBe('pray');
    expect(STAGE_ANIM.munch).toBe('oncard');
    expect(STAGE_ANIM.fizz).toBe('oncard');
    // every ABILITY resolves a pose through its fx key
    for (const a of Object.values(ABILITIES)) {
      expect(stagePoseOf(a.fx), `ability '${a.id}' resolves no stage pose`).not.toBeNull();
    }
  });
});

describe('system vocabulary', () => {
  it('every element maps to a registered impact key', () => {
    for (const el of ['fire', 'freeze', 'volt', 'holy', 'physical', 'none']) {
      const key = impactKeyOf(el);
      expect(FX_REGISTRY[key], `impactKeyOf('${el}') → '${key}' unregistered`).toBeDefined();
      expect(FX_REGISTRY[key].kind).toBe('system');
    }
  });

  it('the six pray events are all registered (§A11.4 — six DISTINCT events)', () => {
    for (const tier of ['miraculous', 'wonderful', 'good', 'nothing', 'strange', 'backfire']) {
      const spec = FX_REGISTRY[`pray_${tier}`];
      expect(spec, `pray_${tier} missing from the registry`).toBeDefined();
      expect(spec.family).toBe('pray_event');
    }
  });

  it('the phase-machine hooks Prompt 15 will call exist', () => {
    expect(FX_REGISTRY.summon_flash).toBeDefined();
    expect(FX_REGISTRY.phase_swap).toBeDefined();
    expect(FX_REGISTRY.latch_tether).toBeDefined();
    expect(FX_REGISTRY.tether_sever).toBeDefined();
  });
});
