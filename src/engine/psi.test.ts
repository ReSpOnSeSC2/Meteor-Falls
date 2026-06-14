/**
 * S18 Movement 28 (ADR-068) — OVERWORLD PSI (§A4.11 powers as keys).
 *
 * Proves the field-cast rules + mirrors the content-validate `psi-gate` gate:
 * the right key clears the right obstacle, the learned-first law holds, and every
 * dungeon band seeds a gate that a real ability can open.
 */
import { describe, it, expect } from 'vitest';
import { PSI_GATES, GATE_KEY, PSI_DUNGEON_BANDS } from '../data/psigates';
import {
  psiKeyOf, abilitiesForKey, keyForGateKind, clearsGate, canClearGate, bestCastFor,
} from './psi';

describe('overworld PSI — keys + casts', () => {
  it('maps abilities to the right field key', () => {
    expect(psiKeyOf('vibe_fire_a')).toBe('fire');
    expect(psiKeyOf('vibe_freeze_a')).toBe('freeze');
    expect(psiKeyOf('flash_a')).toBe('flash');
    expect(psiKeyOf('vibe_surge_a')).toBeNull(); // not a field key
  });

  it('the right key clears the right obstacle, the wrong one does not', () => {
    const vine = PSI_GATES.hedgerow_thorns;   // fire
    const fall = PSI_GATES.spine_meltfall;    // freeze
    expect(clearsGate('vibe_fire_a', vine)).toBe(true);
    expect(clearsGate('vibe_freeze_a', vine)).toBe(false);
    expect(clearsGate('vibe_freeze_a', fall)).toBe(true);
    expect(keyForGateKind('vine_wall')).toBe('fire');
  });

  it('the learned-first law — no learned key, no clear', () => {
    const dark = PSI_GATES.train_darkcar; // flash
    expect(canClearGate(dark, [])).toBe(false);
    expect(canClearGate(dark, ['vibe_fire_a'])).toBe(false);
    expect(canClearGate(dark, ['flash_a'])).toBe(true);
  });

  it('bestCastFor picks the cheapest learned ability, or null', () => {
    const fall = PSI_GATES.spine_meltfall; // freeze
    expect(bestCastFor(fall, ['vibe_fire_a'])).toBeNull();
    expect(bestCastFor(fall, ['vibe_freeze_a'])).toBe('vibe_freeze_a');
  });
});

describe('PSI gates ⇄ the dungeon-band law (both directions)', () => {
  it('every gate key agrees with its kind, has a teacher, and a sign', () => {
    for (const g of Object.values(PSI_GATES)) {
      expect(g.key, `${g.id} key mismatch`).toBe(GATE_KEY[g.kind]);
      expect(abilitiesForKey(g.key).length, `${g.id} has no teacher`).toBeGreaterThan(0);
      expect(g.sign.trim().length, `${g.id} has no sign`).toBeGreaterThan(0);
    }
  });

  it('every dungeon band (ch3–10) seeds at least one gate', () => {
    const covered = new Set(Object.values(PSI_GATES).map((g) => g.band));
    for (const b of PSI_DUNGEON_BANDS) {
      expect(covered.has(b), `band '${b}' has no PSI gate`).toBe(true);
    }
  });
});
