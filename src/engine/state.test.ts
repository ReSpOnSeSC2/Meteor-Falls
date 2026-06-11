import { describe, it, expect, beforeEach } from 'vitest';
import { GS, newGameData, makeHeroState, expForLevel } from './state';
import { ENEMIES } from '../data/enemies';
import { HEROES, statsAtLevel, maxHpAtLevel, unlockedAbilities, availableAbilities } from '../data/heroes';
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

  it('each bag is capped at 14 (EB hands-full rule)', () => {
    for (let i = 0; i < 20; i++) GS.addItem('pbj');
    expect(GS.bagOf('rex').length).toBeLessThanOrEqual(14);
  });
});

describe('per-hero bags & equipment (S3 / Prompt 19)', () => {
  beforeEach(() => {
    GS.reset();
    GS.data.party.push(makeHeroState('faye', 6, 'Wren'));
  });

  it('items land in the chosen hero\'s bag — and only hers', () => {
    GS.addItem('hand_me_down_pan', 'faye');
    expect(GS.bagOf('faye')).toContain('hand_me_down_pan');
    expect(GS.bagOf('rex')).not.toContain('hand_me_down_pan');
    expect(GS.hasItem('hand_me_down_pan')).toBe(true);
  });

  it('wielder tags are law: Jay cannot equip the pan, Mia cannot swing the bat (§A8)', () => {
    GS.addItem('hand_me_down_pan', 'faye');
    expect(GS.equipItem('rex', 'hand_me_down_pan')).toBe('not-yours');
    expect(GS.equipItem('faye', 'cracked_bat')).toBe('not-yours');
    expect(GS.equipItem('faye', 'hand_me_down_pan')).toBe('ok');
    expect(GS.hero('faye')?.equip.weapon).toBe('hand_me_down_pan');
  });

  it("equip-from-anyone's-bag moves the item into the equipper's bag", () => {
    GS.addItem('tball_bat', 'faye'); // Mia is carrying Jay's new bat
    expect(GS.equipItem('rex', 'tball_bat')).toBe('ok');
    expect(GS.bagOf('rex')).toContain('tball_bat');
    expect(GS.bagOf('faye')).not.toContain('tball_bat');
    expect(GS.hero('rex')?.equip.weapon).toBe('tball_bat');
  });

  it('a full bag refuses the cross-bag equip', () => {
    GS.addItem('tball_bat', 'faye');
    const rex = GS.hero('rex');
    while (rex && rex.bag.length < 14) rex.bag.push('pbj');
    expect(GS.equipItem('rex', 'tball_bat')).toBe('hands-full');
    expect(GS.bagOf('faye')).toContain('tball_bat');
  });

  it('removing the last copy of an equipped item clears the slot', () => {
    expect(GS.hero('rex')?.equip.weapon).toBe('cracked_bat'); // new game default
    GS.removeItem('cracked_bat', 'rex');
    expect(GS.hero('rex')?.equip.weapon).toBeUndefined();
  });

  it('a second copy keeps the slot occupied when one is dropped', () => {
    GS.addItem('cracked_bat', 'rex');
    GS.removeItem('cracked_bat', 'rex');
    expect(GS.hero('rex')?.equip.weapon).toBe('cracked_bat');
  });

  it('bags and equipment survive a save round-trip', () => {
    GS.addItem('hand_me_down_pan', 'faye');
    GS.equipItem('faye', 'hand_me_down_pan');
    const json = GS.serialize();
    GS.reset();
    GS.deserialize(json);
    expect(GS.bagOf('faye')).toContain('hand_me_down_pan');
    expect(GS.hero('faye')?.equip.weapon).toBe('hand_me_down_pan');
    expect(GS.hero('rex')?.equip.weapon).toBe('cracked_bat');
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

  it('pre-Prompt-21 saves load with canon defaults backfilled (S3: via the migration registry)', () => {
    const legacy = JSON.parse(newGameDataJson()) as Record<string, unknown>;
    legacy.version = 1; // pre-Prompt-21 saves were v1: shared inventory, bagless heroes
    legacy.inventory = ['cracked_bat'];
    legacy.party = (legacy.party as Array<Record<string, unknown>>).map((h) => {
      const c = { ...h };
      delete c.bag;
      delete c.equip;
      return c;
    });
    delete legacy.coolestThing;
    delete legacy.heroNames;
    delete legacy.playerName;
    GS.deserialize(JSON.stringify(legacy));
    expect(GS.data.coolestThing).toBe('meteors');
    expect(GS.data.playerName).toBe('Player');
    expect(GS.data.heroNames.faye).toBe('Mia');
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

describe('S2 — Mia joins (§A3/§A6, ADR-013/ADR-014)', () => {
  beforeEach(() => GS.reset());

  it("Mia's L6 kit (§A3 as amended, ADR-035): PRAY innate; Fire α AWAKENS at the Locket", () => {
    // level table alone: faith only — the elements arrive as story moments
    const kit = unlockedAbilities('faye', 6);
    expect(kit).toEqual(['pray']);
    expect(kit).not.toContain('vibe_fire_a'); // first-listen awakening
    expect(kit).not.toContain('vibe_freeze_a'); // L12 now
    // the join beat sets the flag — availability carries Fire from then on
    const before = availableAbilities('faye', 6, () => false);
    expect(before).toEqual(['pray']);
    const after = availableAbilities('faye', 6, (f) => f === 'awake_fire_a');
    expect(after).toContain('vibe_fire_a');
    expect(after).toContain('pray');
    // Jay pre-crater has NOTHING; the prophecy hands him the Surge
    expect(availableAbilities('rex', 5, () => false)).toEqual([]);
    expect(availableAbilities('rex', 5, (f) => f === 'awake_surge_a')).toEqual(['vibe_surge_a']);
  });

  it('a two-hero party with a down angel survives a save round-trip', () => {
    GS.applyNewGameChoices({
      heroNames: { rex: 'Casey', faye: 'Wren', milo: 'Pekoe', dorin: 'Petru' },
      playerName: 'Jay',
      favoriteFood: 'pancakes',
      coolestThing: 'dial tones',
    });
    GS.data.party.push(makeHeroState('faye', 6, GS.data.heroNames.faye));
    GS.data.party[1].down = true;
    GS.setFlag('dos_quota_f3a');
    GS.setFlag('holding_open');
    const json = GS.serialize();
    GS.reset();
    GS.deserialize(json);
    expect(GS.data.party.map((h) => h.id)).toEqual(['rex', 'faye']);
    expect(GS.data.party[1].name).toBe('Wren'); // ADR-013: the chosen name rides the save
    expect(GS.data.party[1].down).toBe(true);
    expect(GS.aliveParty().map((h) => h.id)).toEqual(['rex']);
    // the PRODUCTIVITY LOCK's flags survive map re-entry AND a reload
    expect(GS.flag('dos_quota_f3a')).toBe(true);
    expect(GS.flag('holding_open')).toBe(true);
  });
});

describe('the ATM (S4 / Prompt 20): banked <-> cash on hand', () => {
  beforeEach(() => {
    GS.reset();
    GS.data.banked = 100;
    GS.data.cashOnHand = 20;
  });

  it('withdraw moves card -> pocket', () => {
    expect(GS.withdraw(60)).toBe(60);
    expect(GS.data.banked).toBe(40);
    expect(GS.data.cashOnHand).toBe(80);
  });

  it('deposit moves pocket -> card', () => {
    expect(GS.deposit(15)).toBe(15);
    expect(GS.data.banked).toBe(115);
    expect(GS.data.cashOnHand).toBe(5);
  });

  it('clamps to what is actually there', () => {
    expect(GS.withdraw(999)).toBe(100); // the whole balance, no overdraft
    expect(GS.data.banked).toBe(0);
    expect(GS.deposit(999)).toBe(120); // everything on hand, no counterfeits
    expect(GS.data.cashOnHand).toBe(0);
    expect(GS.data.banked).toBe(120);
  });

  it('floors fractions and refuses negatives', () => {
    expect(GS.withdraw(10.9)).toBe(10);
    expect(GS.withdraw(-50)).toBe(0);
    expect(GS.deposit(-50)).toBe(0);
    expect(GS.data.banked).toBe(90);
    expect(GS.data.cashOnHand).toBe(30);
  });

  it('round-trips conserve every dollar', () => {
    const total = GS.data.banked + GS.data.cashOnHand;
    GS.withdraw(100);
    GS.deposit(37);
    GS.withdraw(12);
    GS.deposit(GS.data.cashOnHand);
    GS.withdraw(GS.data.banked);
    expect(GS.data.banked + GS.data.cashOnHand).toBe(total);
    expect(GS.data.banked).toBe(0);
    expect(GS.data.cashOnHand).toBe(total);
  });
});

describe('Homesick persists on the save until Mom cures it (§A4.4, S4)', () => {
  it('the flag rides serialize/deserialize, then clears clean', () => {
    GS.reset();
    GS.setFlag('rex_homesick');
    const json = GS.serialize();
    GS.reset();
    expect(GS.flag('rex_homesick')).toBe(false);
    GS.deserialize(json);
    expect(GS.flag('rex_homesick')).toBe(true);
    // Mom's call (callMom / momPayphoneScene) sets it false
    GS.setFlag('rex_homesick', false);
    expect(GS.flag('rex_homesick')).toBe(false);
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
