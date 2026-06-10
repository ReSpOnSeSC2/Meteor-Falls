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
});
