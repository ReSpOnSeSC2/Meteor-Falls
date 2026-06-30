/**
 * ADR-133 — the grouped battle menu. Pins the pure family-grouping that meshes a Vibe
 * ladder (Fire α…Σ) into ONE box so the in-battle menu reads ~9 family rows instead of
 * ~25 flat rungs. Logic only (no Phaser): the BattleScene picker is two ask() calls over
 * these groups, so getting the grouping right IS getting the menu right.
 */
import { describe, it, expect } from 'vitest';
import { ABILITIES, abilityFamily, groupAbilityFamilies } from './abilities';
import { availableAbilities } from './heroes';

describe('abilityFamily strips the α/β/γ/Ω/Σ tier word', () => {
  it('maps every laddered rung of a line to one family name', () => {
    expect(abilityFamily('Vibe Fire Alpha')).toBe('Vibe Fire');
    expect(abilityFamily('Vibe Fire Sigma')).toBe('Vibe Fire');
    expect(abilityFamily('Vibe Comet Omega')).toBe('Vibe Comet');
    expect(abilityFamily('Power Shield Sigma')).toBe('Power Shield');
    expect(abilityFamily('Mind Warp Alpha')).toBe('Mind Warp');
  });

  it('leaves a non-laddered ability as its own family', () => {
    expect(abilityFamily('Resolve')).toBe('Resolve');
    expect(abilityFamily('Heartmend')).toBe('Heartmend');
    expect(abilityFamily('Lucky Star')).toBe('Lucky Star');
    expect(abilityFamily('Siege Rocket')).toBe('Siege Rocket'); // "Rocket" is not a tier word
  });
});

describe('groupAbilityFamilies meshes a ladder into one box', () => {
  it('groups a shuffled Fire ladder into one family, rungs sorted α→Σ by PP', () => {
    const shuffled = ['vibe_fire_g', 'vibe_fire_a', 'vibe_fire_x', 'vibe_fire_b', 'vibe_fire_o'];
    const groups = groupAbilityFamilies(shuffled);
    expect(groups).toHaveLength(1);
    expect(groups[0].family).toBe('Vibe Fire');
    expect(groups[0].ids).toEqual(['vibe_fire_a', 'vibe_fire_b', 'vibe_fire_g', 'vibe_fire_o', 'vibe_fire_x']);
    // sorted by PP means strictly ascending cost (the ladder order)
    const pps = groups[0].ids.map((id) => ABILITIES[id].pp);
    for (let i = 1; i < pps.length; i++) expect(pps[i]).toBeGreaterThan(pps[i - 1]);
  });

  it('keeps a non-laddered ability as a one-rung group, preserving first-seen order', () => {
    const groups = groupAbilityFamilies(['vibe_fire_a', 'heartmend_a', 'vibe_fire_b']);
    expect(groups.map((g) => g.family)).toEqual(['Vibe Fire', 'Heartmend']);
    expect(groups[0].ids).toEqual(['vibe_fire_a', 'vibe_fire_b']);
    expect(groups[1].ids).toEqual(['heartmend_a']);
  });

  it("collapses Mia's endgame Vibe list from ~25 flat rungs to a handful of family boxes", () => {
    // her real available Vibe kit at the level cap (every flag granted)
    const ids = availableAbilities('faye', 52, () => true).filter((id) => ABILITIES[id]?.kind === 'vibe' && id !== 'pray');
    const groups = groupAbilityFamilies(ids);
    // the five elemental ladders each collapse to ONE box, so the top menu is far shorter
    expect(groups.length).toBeLessThan(ids.length);
    expect(groups.length).toBeLessThanOrEqual(12);
    expect(ids.length).toBeGreaterThanOrEqual(20);
    // the five signature ladders are present as single families
    for (const fam of ['Vibe Fire', 'Vibe Freeze', 'Vibe Volt', 'Starsong', 'Magnet']) {
      const g = groups.find((x) => x.family === fam);
      expect(g, fam).toBeDefined();
      expect((g as { ids: string[] }).ids.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('every grouped id round-trips (no ability dropped or duplicated)', () => {
    const ids = availableAbilities('faye', 52, () => true).filter((id) => ABILITIES[id]?.kind === 'vibe');
    const flat = groupAbilityFamilies(ids).flatMap((g) => g.ids);
    expect(new Set(flat)).toEqual(new Set(ids));
    expect(flat).toHaveLength(ids.length);
  });
});
