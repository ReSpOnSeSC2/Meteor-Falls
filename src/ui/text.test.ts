import { describe, it, expect, beforeEach } from 'vitest';
import { vars } from './text';
import { GS, newGameData } from '../engine/state';
import { DIALOGUE } from '../data/dialogue';

describe('dialogue text variables (Prompt 6 + 21)', () => {
  beforeEach(() => GS.reset());

  it('resolves every New Game variable', () => {
    GS.applyNewGameChoices({
      heroNames: { rex: 'Casey', faye: 'Wren', milo: 'Pekoe', pippa: 'Quill', dorin: 'Petru' },
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
    expect(vars('{faye}')).toBe('Mia');
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

  // (the every-{token}-resolves sweep is validator-owned now: S5 checks all
  //  dialogue/map/item/battle text against the TEXT_VARS registry)

  it("S2: Mom's payphone call consumes {favoritefood} and {rex} (ADR-013 — no literals)", () => {
    GS.applyNewGameChoices({
      heroNames: { rex: 'Casey', faye: 'Wren', milo: 'Pekoe', pippa: 'Quill', dorin: 'Petru' },
      playerName: 'Jay',
      favoriteFood: 'pancakes',
      coolestThing: 'dial tones',
    });
    const all = DIALOGUE.mom_payphone.map((p) => vars(p)).join('\n');
    expect(all).toContain('pancakes');
    expect(all).toContain('Casey');
    expect(all).not.toMatch(/\{\w+\}/);
    // the join + manager scenes carry her chosen name everywhere
    expect(DIALOGUE.faye_join.map((p) => vars(p)).join('\n')).toContain('Wren');
    expect(DIALOGUE.manager_intro.map((p) => vars(p)).join('\n')).toContain('Wren');
  });

  it("S6: vars() resolves against a PASSED blob — slot summaries use each slot's own names", () => {
    const other = newGameData();
    for (const h of other.party) h.name = 'Otto';
    other.heroNames.rex = 'Otto';
    other.heroNames.faye = 'Wilma';
    other.favoriteFood = 'waffles';
    expect(vars("{rex}'S HOUSE", other)).toBe("Otto'S HOUSE");
    expect(vars('{faye} loves {favoritefood}', other)).toBe('Wilma loves waffles');
    // the one-arg form still reads the live game
    expect(vars("{rex}'S HOUSE")).toBe("Jay'S HOUSE");
  });
});
