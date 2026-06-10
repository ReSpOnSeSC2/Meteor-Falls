import { describe, it, expect, beforeEach } from 'vitest';
import { vars } from './text';
import { GS } from '../engine/state';
import { DIALOGUE } from '../data/dialogue';

describe('dialogue text variables (Prompt 6 + 21)', () => {
  beforeEach(() => GS.reset());

  it('resolves every New Game variable', () => {
    GS.applyNewGameChoices({
      heroNames: { rex: 'Casey', faye: 'Wren', milo: 'Pekoe', dorin: 'Petru' },
      playerName: 'Jay',
      favoriteFood: 'pancakes',
      coolestThing: 'dial tones',
    });
    expect(vars('{rex} {faye} {milo} {dorin}')).toBe('Casey Wren Pekoe Petru');
    expect(vars('Hi {playername}, eat {favoritefood}, behold {coolthing}.')).toBe(
      'Hi Jay, eat pancakes, behold dial tones.',
    );
  });

  it('unjoined heroes resolve from the heroNames record', () => {
    expect(vars('{faye}')).toBe('Faye');
  });

  it('renders the @-speech convention as a bullet', () => {
    expect(vars('@Hello.')).toBe('•Hello.');
  });

  it("Mom's dinner line greets you with your chosen food (§A11: the joke survives)", () => {
    GS.data.favoriteFood = 'fuzzy pickles';
    const line = vars(DIALOGUE.npc_mom[0]);
    expect(line).toContain('Dinner is fuzzy pickles.');
    expect(line).not.toContain('{favoritefood}');
  });

  it('every {token} in dialogue.ts is one vars() resolves (S2; S5 folds this into the validator)', () => {
    const known = new Set(['rex', 'faye', 'milo', 'dorin', 'playername', 'favoritefood', 'coolthing']);
    for (const [id, pages] of Object.entries(DIALOGUE)) {
      for (const page of pages) {
        for (const m of page.matchAll(/\{(\w+)\}/g)) {
          expect(known.has(m[1]), `${id}: unknown token {${m[1]}}`).toBe(true);
        }
      }
    }
  });

  it("S2: Mom's payphone call consumes {favoritefood} and {rex} (ADR-013 — no literals)", () => {
    GS.applyNewGameChoices({
      heroNames: { rex: 'Casey', faye: 'Wren', milo: 'Pekoe', dorin: 'Petru' },
      playerName: 'Jay',
      favoriteFood: 'pancakes',
      coolestThing: 'dial tones',
    });
    const all = DIALOGUE.mom_payphone.map(vars).join('\n');
    expect(all).toContain('pancakes');
    expect(all).toContain('Casey');
    expect(all).not.toMatch(/\{\w+\}/);
    // the join + manager scenes carry her chosen name everywhere
    expect(DIALOGUE.faye_join.map(vars).join('\n')).toContain('Wren');
    expect(DIALOGUE.manager_intro.map(vars).join('\n')).toContain('Wren');
  });
});
