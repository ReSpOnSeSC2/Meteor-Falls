import { describe, it, expect, beforeEach } from 'vitest';
import { GS, makeHeroState, newGameData } from './state';
import { migrateSave, CURRENT_SAVE_VERSION } from './migrations';
import { BAG_MAX } from '../data/items';
import { HEROES, availableAbilities, type HeroId } from '../data/heroes';

/** a hero exactly as v1 saves stored them — no bag, no equip */
function v1Hero(id: HeroId, level: number, name?: string): Record<string, unknown> {
  const h = makeHeroState(id, level, name) as unknown as Record<string, unknown>;
  delete h.bag;
  delete h.equip;
  return h;
}

/** an S2-era version-1 save: shared inventory, two heroes, Mia joined */
function v1SaveS2(): Record<string, unknown> {
  return {
    version: 1,
    party: [v1Hero('rex', 7, 'Casey'), v1Hero('faye', 6, 'Wren')],
    guest: null,
    inventory: ['cracked_bat', 'corn_dog', 'salt_shaker'],
    keyItems: ['star_locket'],
    cashOnHand: 33,
    banked: 50,
    pendingDeposit: 12,
    flags: { faye_joined: true, holding_open: true, manager_defeated: true },
    playtimeSec: 1234,
    map: 'brickton',
    x: 230,
    y: 420,
    facing: 'down',
    embers: 1,
    favoriteFood: 'pancakes',
    playerName: 'Jay',
    coolestThing: 'dial tones',
    heroNames: { rex: 'Casey', faye: 'Wren', milo: 'Pekoe', dorin: 'Petru' },
  };
}

describe('save migration registry (S3) — v1 → v2', () => {
  beforeEach(() => GS.reset());

  it('an S2-era v1 save lifts through the whole chain: Jay inherits the shared inventory', () => {
    GS.deserialize(JSON.stringify(v1SaveS2()));
    expect(GS.data.version).toBe(CURRENT_SAVE_VERSION);
    expect(GS.hero('rex')?.bag).toEqual(['cracked_bat', 'corn_dog', 'salt_shaker']);
    expect('inventory' in (GS.data as unknown as Record<string, unknown>)).toBe(false);
    // progress fields survive untouched
    expect(GS.data.cashOnHand).toBe(33);
    expect(GS.data.embers).toBe(1);
    expect(GS.flag('holding_open')).toBe(true);
    expect(GS.hero('faye')?.name).toBe('Wren');
  });

  it("old battles used the bag's first weapon — migration equips it so Jay's damage doesn't change", () => {
    GS.deserialize(JSON.stringify(v1SaveS2()));
    expect(GS.hero('rex')?.equip.weapon).toBe('cracked_bat');
  });

  it('auto-equip skips food and picks the first weapon Jay can wield', () => {
    const save = v1SaveS2();
    save.inventory = ['corn_dog', 'tball_bat', 'cracked_bat'];
    GS.deserialize(JSON.stringify(save));
    expect(GS.hero('rex')?.equip.weapon).toBe('tball_bat');
  });

  it('grants Mia her Hand-Me-Down Pan when faye_joined (the intake shelf, canonically)', () => {
    GS.deserialize(JSON.stringify(v1SaveS2()));
    const faye = GS.hero('faye');
    expect(faye?.bag).toContain('hand_me_down_pan');
    expect(faye?.equip.weapon).toBe('hand_me_down_pan');
  });

  it('no pan before she joins', () => {
    const save = v1SaveS2();
    save.party = [v1Hero('rex', 7, 'Casey')];
    save.flags = { holding_open: true };
    GS.deserialize(JSON.stringify(save));
    expect(GS.hasItem('hand_me_down_pan')).toBe(false);
  });

  it('a pre-S12 v1 save (missing heroNames et al.) loads as v2 with canon backfill', () => {
    // before Prompt 21/S12, saves had no heroNames/playerName/coolestThing
    const save = v1SaveS2();
    delete save.heroNames;
    delete save.playerName;
    delete save.coolestThing;
    save.party = [v1Hero('rex', 3)];
    save.flags = { intro_done: true };
    save.inventory = ['cracked_bat', 'corn_dog', 'corn_dog'];
    GS.deserialize(JSON.stringify(save));
    expect(GS.data.version).toBe(CURRENT_SAVE_VERSION);
    expect(GS.data.heroNames.faye).toBe('Mia'); // ADR-013 backfill, folded in
    expect(GS.data.playerName).toBe('Player');
    expect(GS.data.coolestThing).toBe('meteors');
    expect(GS.hero('rex')?.bag).toEqual(['cracked_bat', 'corn_dog', 'corn_dog']);
    expect(GS.hero('rex')?.equip.weapon).toBe('cracked_bat');
  });

  it('an overstuffed v1 inventory clips to the 14-slot bag', () => {
    const save = v1SaveS2();
    save.inventory = Array.from({ length: 16 }, () => 'pbj');
    GS.deserialize(JSON.stringify(save));
    expect(GS.hero('rex')?.bag.length).toBe(BAG_MAX);
  });

  it('a current-version save round-trips exactly (no migration applied)', () => {
    GS.reset();
    GS.data.party.push(makeHeroState('faye', 6, 'Wren'));
    GS.addItem('hand_me_down_pan', 'faye');
    GS.equipItem('faye', 'hand_me_down_pan');
    GS.setFlag('faye_joined');
    const snapshot = JSON.parse(GS.serialize()) as unknown;
    GS.reset();
    GS.deserialize(JSON.stringify(snapshot));
    expect(JSON.parse(GS.serialize())).toEqual(snapshot);
  });

  it('rejects unknown and future versions loudly', () => {
    expect(() => GS.deserialize(JSON.stringify({ ...newGameData(), version: 99 }))).toThrow();
    expect(() =>
      GS.deserialize(JSON.stringify({ ...newGameData(), version: CURRENT_SAVE_VERSION + 1 })),
    ).toThrow();
    expect(() => GS.deserialize(JSON.stringify({ party: [] }))).toThrow(); // no version at all
    expect(() => migrateSave('"not an object"', newGameData())).toThrow();
  });
});

describe('save migration registry (S9) — v2 → v3: the CALLER ledger', () => {
  beforeEach(() => GS.reset());

  /** a v2 save exactly as S3–S8 wrote them: no callers field at all */
  function v2Save(): Record<string, unknown> {
    const d = newGameData() as unknown as Record<string, unknown>;
    d.version = 2;
    delete d.callers;
    return d;
  }

  it('a v2 save loads with an EMPTY ledger — its true history (quests are v3-new)', () => {
    GS.deserialize(JSON.stringify(v2Save()));
    expect(GS.data.version).toBe(CURRENT_SAVE_VERSION);
    expect(GS.data.callers).toEqual([]);
  });

  it('a v1 save walks the full chain: bags from v2 AND the ledger from v3', () => {
    GS.deserialize(JSON.stringify(v1SaveS2()));
    expect(GS.data.version).toBe(CURRENT_SAVE_VERSION);
    expect(GS.data.callers).toEqual([]);
    expect(GS.hero('rex')?.bag).toContain('cracked_bat'); // v2 step still ran
  });

  it('an earned ledger survives the round-trip untouched', () => {
    GS.data.callers.push({
      quest: 'biscuit_come_home',
      name: 'Mrs. Pemmel',
      quote: 'Biscuit pointed at the sky and BARKED, dear. We know what that means. Send them everything.',
      effect: { kind: 'damage', power: 400 },
    });
    const json = GS.serialize();
    GS.reset();
    expect(GS.data.callers).toEqual([]); // reset really clears it
    GS.deserialize(json);
    expect(GS.data.callers).toHaveLength(1);
    expect(GS.data.callers[0].quest).toBe('biscuit_come_home');
    expect(GS.data.callers[0].effect).toEqual({ kind: 'damage', power: 400 });
  });
});

describe('save migration registry (S10) — v3 → v4: the ARCADE LEGEND table', () => {
  beforeEach(() => GS.reset());

  /** a v3 save exactly as S9 wrote them: a ledger, no score table */
  function v3Save(): Record<string, unknown> {
    const d = newGameData() as unknown as Record<string, unknown>;
    d.version = 3;
    delete d.arcadeScores;
    return d;
  }

  it("a v3 save backfills MGR's lonely row — the attract mode predates everyone", () => {
    GS.deserialize(JSON.stringify(v3Save()));
    expect(GS.data.version).toBe(CURRENT_SAVE_VERSION);
    expect(GS.data.arcadeScores).toEqual([{ initials: 'MGR', score: 3000 }]);
  });

  it('a v1 save walks the FULL chain: bags, ledger, and the MGR row', () => {
    GS.deserialize(JSON.stringify(v1SaveS2()));
    expect(GS.data.version).toBe(CURRENT_SAVE_VERSION);
    expect(GS.hero('rex')?.bag).toContain('cracked_bat'); // v2 step ran
    expect(GS.data.callers).toEqual([]); // v3 step ran
    expect(GS.data.arcadeScores[0]?.initials).toBe('MGR'); // v4 step ran
  });

  it('earned initials survive the round-trip in rank order', () => {
    expect(GS.arcadeTopScore()).toBe(3000); // MGR holds the room
    expect(GS.submitArcadeScore('JAY', 3450)).toBe(0); // dethroned
    expect(GS.submitArcadeScore('SAL', 120)).toBe(2); // Sal tries, bless him
    const json = GS.serialize();
    GS.reset();
    GS.deserialize(json);
    expect(GS.data.arcadeScores.map((r) => r.initials)).toEqual(['JAY', 'MGR', 'SAL']);
    expect(GS.arcadeTopScore()).toBe(3450);
  });

  it('cabinet law: ties rank BELOW the sitting row, the table keeps 5, losers get null', () => {
    expect(GS.arcadeRankOf(3000)).toBe(1); // tying MGR does not dethrone MGR
    for (const [i, s] of [3100, 3200, 3300, 3400].entries()) {
      expect(GS.submitArcadeScore(`P${i}`, s)).toBe(0);
    }
    expect(GS.data.arcadeScores).toHaveLength(5);
    expect(GS.arcadeRankOf(10)).toBeNull(); // full table, low score: no row
    expect(GS.submitArcadeScore('LOW', 10)).toBeNull();
    expect(GS.data.arcadeScores).toHaveLength(5);
    expect(GS.data.arcadeScores[4].initials).toBe('MGR'); // he clings to row 5
  });
});

describe('save migration registry (S12) — v4 → v5: THE CAGE', () => {
  beforeEach(() => GS.reset());

  /** a v4 save exactly as S10–S11b wrote them: a score table, no hoops */
  function v4Save(): Record<string, unknown> {
    const d = newGameData() as unknown as Record<string, unknown>;
    d.version = 4;
    delete d.hoops;
    return d;
  }

  it('a v4 save backfills the clean slate — the gate is v5-new, no history to guess', () => {
    GS.deserialize(JSON.stringify(v4Save()));
    expect(GS.data.version).toBe(CURRENT_SAVE_VERSION);
    expect(GS.data.hoops).toEqual({ bracket: null, match: null, titles: 0, handed: [], played: 0 });
  });

  it('a v1 save walks the FULL chain: bags, ledger, MGR, and the slate', () => {
    GS.deserialize(JSON.stringify(v1SaveS2()));
    expect(GS.data.version).toBe(CURRENT_SAVE_VERSION);
    expect(GS.hero('rex')?.bag).toContain('cracked_bat'); // v2 step ran
    expect(GS.data.callers).toEqual([]); // v3 step ran
    expect(GS.data.arcadeScores[0]?.initials).toBe('MGR'); // v4 step ran
    expect(GS.data.hoops.bracket).toBeNull(); // v5 step ran
  });

  it('tournament state IS save data: bracket + checkpoint round-trip exactly', () => {
    GS.data.hoops.bracket = {
      seed: 1995,
      round: 2,
      field: ['party', ...Array.from({ length: 31 }, (_, i) => `t${i}`)],
      results: [Array.from({ length: 16 }, (_, i) => (i === 0 ? 'party' : `t${i}`)), Array.from({ length: 8 }, (_, i) => (i === 0 ? 'party' : `t${i}`))],
    };
    GS.data.hoops.match = {
      opponent: 'quota_crushers',
      round: 2,
      seed: 4242,
      quarter: 3,
      scoreUs: 18,
      scoreThem: 15,
      clockMs: 300_000,
    };
    GS.data.hoops.titles = 1;
    GS.data.hoops.handed = ['cage_sweatband'];
    GS.data.hoops.played = 7;
    const json = GS.serialize();
    GS.reset();
    expect(GS.data.hoops.match).toBeNull(); // reset really clears it
    GS.deserialize(json);
    expect(GS.data.hoops.match?.quarter).toBe(3); // the quarter survives death
    expect(GS.data.hoops.match?.scoreUs).toBe(18);
    expect(GS.data.hoops.bracket?.round).toBe(2);
    expect(GS.data.hoops.handed).toEqual(['cage_sweatband']); // the raincheck
    expect(GS.data.hoops.titles).toBe(1);
    expect(GS.data.hoops.played).toBe(7);
  });
});
describe('save migration registry (S12b) — v5 → v6: AWAKENINGS', () => {
  beforeEach(() => GS.reset());

  /** a v5 save exactly as S12 wrote them: hoops, no awakening flags */
  function v5Save(progress: Record<string, boolean>): Record<string, unknown> {
    const d = newGameData() as unknown as Record<string, unknown>;
    d.version = 5;
    d.flags = { ...progress };
    return d;
  }

  it('a story moment already lived keeps the ability it granted', () => {
    GS.deserialize(JSON.stringify(v5Save({ met_glint: true, zapper_done: true, faye_joined: true })));
    expect(GS.data.version).toBe(CURRENT_SAVE_VERSION);
    expect(GS.flag('awake_surge_a')).toBe(true);
    expect(GS.flag('awake_lifeup_a')).toBe(true);
    expect(GS.flag('awake_fire_a')).toBe(true);
  });

  it('a save from BEFORE the crater awakens nothing — the moment is still ahead', () => {
    GS.deserialize(JSON.stringify(v5Save({ meteor_fell: true })));
    expect(GS.flag('awake_surge_a')).toBe(false);
    expect(GS.flag('awake_lifeup_a')).toBe(false);
  });

  it('the v1 chain runs all the way: bags, ledger, MGR, hoops, awakenings', () => {
    GS.deserialize(JSON.stringify(v1SaveS2())); // faye_joined rides this save
    expect(GS.data.version).toBe(CURRENT_SAVE_VERSION);
    expect(GS.flag('awake_fire_a')).toBe(true); // her join carried the listen
    expect(GS.flag('awake_surge_a')).toBe(false); // met_glint never set on it
    expect(GS.data.hoops.bracket).toBeNull();
  });
});

describe('save migration registry (S14) — v6 → v7: Freeze α moves to the awakening', () => {
  beforeEach(() => GS.reset());

  /** a v6 save exactly as S12b wrote them: awakening flags, Mia at a level */
  function v6Save(fayeLevel: number | null): Record<string, unknown> {
    const d = newGameData() as unknown as Record<string, unknown>;
    d.version = 6;
    d.flags = { faye_joined: fayeLevel !== null };
    if (fayeLevel !== null) {
      const party = d.party as Array<Record<string, unknown>>;
      party.push(makeHeroState('faye', fayeLevel) as unknown as Record<string, unknown>);
    }
    return d;
  }

  it('a v6 Mia at L12+ KEEPS the Freeze the old table granted (ADR-039)', () => {
    GS.deserialize(JSON.stringify(v6Save(12)));
    expect(GS.data.version).toBe(CURRENT_SAVE_VERSION);
    expect(GS.flag('awake_freeze_a')).toBe(true);
  });

  it('a v6 Mia below L12 waits for the HOLLOW reveal — nothing backfills', () => {
    GS.deserialize(JSON.stringify(v6Save(11)));
    expect(GS.flag('awake_freeze_a')).toBe(false);
  });

  it('no Mia on the save, no flag — the moment keeps', () => {
    GS.deserialize(JSON.stringify(v6Save(null)));
    expect(GS.flag('awake_freeze_a')).toBe(false);
  });
});

describe('save migration registry (S15h) — v7 → v8: the fifth hero (Pippa)', () => {
  beforeEach(() => GS.reset());

  /** a v7 save exactly as S14 wrote them: heroNames with only the four */
  function v7Save(): Record<string, unknown> {
    const d = newGameData() as unknown as Record<string, unknown>;
    d.version = 7;
    const hn = { ...(d.heroNames as Record<string, string>) };
    delete hn.pippa; // a pre-v8 save never knew the fifth name
    d.heroNames = hn;
    return d;
  }

  it("a v7 save backfills Pippa's name and leaves the four untouched", () => {
    GS.deserialize(JSON.stringify(v7Save()));
    expect(GS.data.version).toBe(CURRENT_SAVE_VERSION);
    expect(GS.data.heroNames.pippa).toBe(HEROES.pippa.name);
    expect(GS.data.heroNames.rex).toBe(HEROES.rex.name);
    expect(GS.data.heroNames.dorin).toBe(HEROES.dorin.name);
    // she has NOT joined — the party is unchanged (Ch.5 adds her later)
    expect(GS.data.party.some((h) => h.id === 'pippa')).toBe(false);
  });

  it('a custom-named v7 save keeps its four names and only ADDS Pippa', () => {
    const save = v7Save();
    save.heroNames = { rex: 'Casey', faye: 'Wren', milo: 'Pekoe', dorin: 'Petru' };
    GS.deserialize(JSON.stringify(save));
    expect(GS.data.heroNames.rex).toBe('Casey');
    expect(GS.data.heroNames.milo).toBe('Pekoe');
    expect(GS.data.heroNames.pippa).toBe(HEROES.pippa.name); // the default fills the gap
  });

  it('the v1 chain runs all the way to v8: bags, ledger, MGR, hoops, awakenings, Pippa', () => {
    GS.deserialize(JSON.stringify(v1SaveS2()));
    expect(GS.data.version).toBe(CURRENT_SAVE_VERSION);
    expect(GS.hero('rex')?.bag).toContain('cracked_bat'); // v2 ran
    expect(GS.data.callers).toEqual([]); // v3 ran
    expect(GS.data.heroNames.pippa).toBe(HEROES.pippa.name); // v8 ran
  });
});

describe('save migration registry (S17) — v8 → v9: the catalog spine (tonic boosts)', () => {
  beforeEach(() => GS.reset());

  /** a v8 save exactly as S15h wrote them: heroes with no `boosts` map */
  function v8Save(): Record<string, unknown> {
    const d = newGameData() as unknown as Record<string, unknown>;
    d.version = 8;
    d.party = (d.party as Array<Record<string, unknown>>).map((h) => {
      const c = { ...h };
      delete c.boosts; // a pre-v9 hero never carried tonic boosts
      return c;
    });
    return d;
  }

  it('backfills an empty boosts map on every hero', () => {
    GS.deserialize(JSON.stringify(v8Save()));
    expect(GS.data.version).toBe(CURRENT_SAVE_VERSION);
    for (const h of GS.data.party) expect(h.boosts).toEqual({});
  });

  it('the v1 chain runs all the way to v9: every hero ends with a boosts map', () => {
    GS.deserialize(JSON.stringify(v1SaveS2()));
    expect(GS.data.version).toBe(CURRENT_SAVE_VERSION);
    for (const h of GS.data.party) expect(h.boosts).toEqual({});
  });
});

describe('save migration registry (S18 M27) — v9 → v10: mindwarp re-staged to an awakening', () => {
  beforeEach(() => GS.reset());

  /** a v9 save with Jay (rex) at a chosen level and no awakening flags yet */
  function v9Save(rexLevel: number): Record<string, unknown> {
    const d = newGameData() as unknown as Record<string, unknown>;
    d.version = 9;
    d.flags = {}; // a clean ledger — no awake_mindwarp_a
    d.party = [makeHeroState('rex', rexLevel) as unknown as Record<string, unknown>];
    return d;
  }

  it('a save that already earned Mind Warp at L21 KEEPS it (the awakening flag backfills)', () => {
    GS.deserialize(JSON.stringify(v9Save(21)));
    expect(GS.data.version).toBe(CURRENT_SAVE_VERSION);
    expect(GS.flag('awake_mindwarp_a')).toBe(true);
    const have = availableAbilities('rex', GS.hero('rex')!.level, (f) => GS.flag(f) === true);
    expect(have.includes('mindwarp_a')).toBe(true);
  });

  it('a save below the old L21 unlock does NOT get it for free (it awakens in Ch.3)', () => {
    GS.deserialize(JSON.stringify(v9Save(12)));
    expect(GS.data.version).toBe(CURRENT_SAVE_VERSION);
    expect(GS.flag('awake_mindwarp_a')).toBe(false);
    const have = availableAbilities('rex', GS.hero('rex')!.level, (f) => GS.flag(f) === true);
    expect(have.includes('mindwarp_a')).toBe(false);
  });
});

describe('save migration registry (S18 M29) — v10 → v11: the property market', () => {
  beforeEach(() => GS.reset());

  it('backfills an empty homeStorage map on a pre-v11 save', () => {
    const d = newGameData() as unknown as Record<string, unknown>;
    d.version = 10;
    delete d.homeStorage; // a pre-v11 save owned no property
    GS.deserialize(JSON.stringify(d));
    expect(GS.data.version).toBe(CURRENT_SAVE_VERSION);
    expect(GS.data.homeStorage).toEqual({});
  });

  it('the v1 chain runs all the way to v11+', () => {
    GS.deserialize(JSON.stringify(v1SaveS2()));
    expect(GS.data.version).toBe(CURRENT_SAVE_VERSION);
    expect(GS.data.homeStorage).toEqual({});
  });
});

describe('save migration registry (S18 M30) — v11 → v12: the home editor', () => {
  beforeEach(() => GS.reset());

  it('backfills an empty homeLayouts map on a pre-v12 save', () => {
    const d = newGameData() as unknown as Record<string, unknown>;
    d.version = 11;
    delete d.homeLayouts; // a pre-v12 save decorated nothing
    GS.deserialize(JSON.stringify(d));
    expect(GS.data.version).toBe(CURRENT_SAVE_VERSION);
    expect(GS.data.homeLayouts).toEqual({});
  });
});

describe('save migration registry (S19 M38) — v12 → v13: the home garage', () => {
  beforeEach(() => GS.reset());

  it('backfills an empty garage + no active ride on a pre-v13 save', () => {
    const d = newGameData() as unknown as Record<string, unknown>;
    d.version = 12;
    delete d.garage;         // a pre-v13 save owned no car
    delete d.activeVehicle;
    GS.deserialize(JSON.stringify(d));
    expect(GS.data.version).toBe(CURRENT_SAVE_VERSION);
    expect(GS.data.garage).toEqual({});
    expect(GS.data.activeVehicle).toBeNull();
  });

  it('a stocked garage + chosen ride round-trip byte-stable', () => {
    GS.data.garage = { '27_maple': ['title_car_sedan', 'title_car_nikolai'] };
    GS.data.activeVehicle = 'title_car_nikolai';
    const json = GS.serialize();
    GS.reset();
    expect(GS.data.garage).toEqual({}); // reset really clears it
    GS.deserialize(json);
    expect(GS.data.garage).toEqual({ '27_maple': ['title_car_sedan', 'title_car_nikolai'] });
    expect(GS.data.activeVehicle).toBe('title_car_nikolai');
  });

  it('the v1 chain runs all the way to v13', () => {
    GS.deserialize(JSON.stringify(v1SaveS2()));
    expect(GS.data.version).toBe(CURRENT_SAVE_VERSION);
    expect(GS.data.garage).toEqual({});
    expect(GS.data.activeVehicle).toBeNull();
  });
});

describe('save migration registry (S20 M43) — v13 → v14: the fuel system', () => {
  beforeEach(() => GS.reset());

  it('backfills an empty fuel map on a pre-v14 save', () => {
    const d = newGameData() as unknown as Record<string, unknown>;
    d.version = 13;
    delete d.fuel; // a pre-v14 save tracked no fuel
    GS.deserialize(JSON.stringify(d));
    expect(GS.data.version).toBe(CURRENT_SAVE_VERSION);
    expect(GS.data.fuel).toEqual({});
  });

  it('per-car fuel levels round-trip byte-stable', () => {
    GS.data.fuel = { title_car_sedan: 28.5, title_car_nikolai: 100 };
    const json = GS.serialize();
    GS.reset();
    expect(GS.data.fuel).toEqual({});
    GS.deserialize(json);
    expect(GS.data.fuel).toEqual({ title_car_sedan: 28.5, title_car_nikolai: 100 });
  });

  it('the v1 chain runs all the way to v14', () => {
    GS.deserialize(JSON.stringify(v1SaveS2()));
    expect(GS.data.version).toBe(CURRENT_SAVE_VERSION);
    expect(GS.data.fuel).toEqual({});
  });
});

describe('save migration registry (S20 M46) — v14 → v15: vehicle ferrying', () => {
  beforeEach(() => GS.reset());

  it('backfills an empty carLocation map on a pre-v15 save', () => {
    const d = newGameData() as unknown as Record<string, unknown>;
    d.version = 14;
    delete d.carLocation; // a pre-v15 save never ferried
    GS.deserialize(JSON.stringify(d));
    expect(GS.data.version).toBe(CURRENT_SAVE_VERSION);
    expect(GS.data.carLocation).toEqual({});
  });

  it('car locations round-trip byte-stable', () => {
    GS.data.carLocation = { title_car_sedan: 'usa', title_car_nikolai: 'mars' };
    const json = GS.serialize();
    GS.reset();
    GS.deserialize(json);
    expect(GS.data.carLocation).toEqual({ title_car_sedan: 'usa', title_car_nikolai: 'mars' });
  });
});
