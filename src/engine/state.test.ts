import { describe, it, expect, beforeEach } from 'vitest';
import { GS, newGameData, makeHeroState, expForLevel } from './state';
import { ENEMIES } from '../data/enemies';
import { HEROES, statsAtLevel, maxHpAtLevel } from '../data/heroes';
import { ITEMS } from '../data/items';
import { ABILITIES } from '../data/abilities';

describe('GameState serialization (Prompt 2: round-trip)', () => {
  beforeEach(() => GS.reset());

  it('round-trips exactly', () => {
    GS.data.cashOnHand = 412;
    GS.setFlag('met_glint');
    GS.setFlag('embers', 1);
    GS.addItem('salt_shaker');
    const json = GS.serialize();
    GS.reset();
    GS.deserialize(json);
    expect(GS.data.cashOnHand).toBe(412);
    expect(GS.flag('met_glint')).toBe(true);
    expect(GS.flag('embers')).toBe(1);
    expect(GS.hasItem('salt_shaker')).toBe(true);
  });

  it('rejects unknown versions', () => {
    const bad = JSON.stringify({ ...newGameData(), version: 99 });
    expect(() => GS.deserialize(bad)).toThrow();
  });

  it('inventory is capped at 14 (EB hands-full rule)', () => {
    for (let i = 0; i < 20; i++) GS.addItem('pbj');
    expect(GS.data.inventory.length).toBeLessThanOrEqual(14);
  });
});

describe('New Game choices (Prompt 21)', () => {
  beforeEach(() => GS.reset());

  const CHOICES = {
    heroNames: { rex: 'Casey', faye: 'Wren', milo: 'Pekoe', dorin: 'Petru' },
    playerName: 'Jay',
    favoriteFood: 'fuzzy pickles',
    coolestThing: 'the 6:15',
  };

  it('applyNewGameChoices renames joined heroes and stores the rest', () => {
    GS.applyNewGameChoices(CHOICES);
    expect(GS.hero('rex')?.name).toBe('Casey');
    expect(GS.heroName('faye')).toBe('Wren'); // not joined yet — read from heroNames
    expect(GS.data.playerName).toBe('Jay');
    expect(GS.data.favoriteFood).toBe('fuzzy pickles');
    expect(GS.data.coolestThing).toBe('the 6:15');
  });

  it('a joined hero wins over the heroNames record', () => {
    GS.applyNewGameChoices(CHOICES);
    GS.data.party.push(makeHeroState('faye', 6, GS.data.heroNames.faye));
    expect(GS.heroName('faye')).toBe('Wren');
    expect(GS.hero('faye')?.name).toBe('Wren');
  });

  it('the finale hook survives a save round-trip ({playername} et al.)', () => {
    GS.applyNewGameChoices(CHOICES);
    const json = GS.serialize();
    GS.reset();
    GS.deserialize(json);
    expect(GS.data.playerName).toBe('Jay');
    expect(GS.data.coolestThing).toBe('the 6:15');
    expect(GS.data.heroNames.dorin).toBe('Petru');
    expect(GS.hero('rex')?.name).toBe('Casey');
  });

  it('pre-Prompt-21 saves load with canon defaults backfilled', () => {
    const legacy = JSON.parse(newGameDataJson()) as Record<string, unknown>;
    delete legacy.coolestThing;
    delete legacy.heroNames;
    delete legacy.playerName;
    GS.deserialize(JSON.stringify(legacy));
    expect(GS.data.coolestThing).toBe('meteors');
    expect(GS.data.playerName).toBe('Player');
    expect(GS.data.heroNames.faye).toBe('Faye');
  });

  function newGameDataJson(): string {
    return JSON.stringify(newGameData());
  }
});

describe('hero state', () => {
  it('a fresh hero has level-correct stats and full meters', () => {
    const rex = makeHeroState('rex', 5);
    expect(rex.maxHp).toBe(maxHpAtLevel('rex', 5));
    expect(rex.hp).toBe(rex.maxHp);
    expect(rex.stats).toEqual(statsAtLevel('rex', 5));
    expect(rex.exp).toBe(expForLevel(5));
  });
});

describe('content validation (interim validator, ADR-005)', () => {
  it('all four canon heroes exist (§A3)', () => {
    expect(Object.keys(HEROES).sort()).toEqual(['dorin', 'faye', 'milo', 'rex']);
  });

  it('all six §A7 Ch.1 enemies + Boss 1 exist with canon HP', () => {
    expect(ENEMIES.cranky_mailbox.hp).toBe(24);
    expect(ENEMIES.runaway_lawnmower.hp).toBe(38);
    expect(ENEMIES.coily_cicada.hp).toBe(30);
    expect(ENEMIES.blazer_smiler.hp).toBe(55);
    expect(ENEMIES.pigeon_gang.hp).toBe(45);
    expect(ENEMIES.hill_slug_deluxe.hp).toBe(60);
    expect(ENEMIES.titanic_tick.hp).toBe(450);
    expect(ENEMIES.titanic_tick.boss).toBe(true);
  });

  it('every enemy has 2-4 moves and a flavor death line (§A7)', () => {
    for (const e of Object.values(ENEMIES)) {
      expect(e.moves.length).toBeGreaterThanOrEqual(2);
      expect(e.moves.length).toBeLessThanOrEqual(4);
      expect(e.deathLine.length).toBeGreaterThan(5);
    }
  });

  it('no placeholder strings anywhere in content (§B4)', () => {
    const blobs = [JSON.stringify(ENEMIES), JSON.stringify(ITEMS), JSON.stringify(ABILITIES)];
    for (const blob of blobs) {
      expect(/todo|placeholder|lorem/i.test(blob)).toBe(false);
    }
  });

  it('the anti-Tick Salt Shaker breaks latch (§A6 Boss 1 gimmick)', () => {
    expect(ITEMS.salt_shaker.breaksLatch).toBe(true);
  });
});
