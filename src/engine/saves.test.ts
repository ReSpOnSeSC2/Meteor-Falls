/**
 * S6 — save slots & Continue (GAME_BIBLE §A4.3 / Prompt 22, ADR-018).
 * Behavioral per S5's division of labor: slot round-trips through the
 * migration registry, forced-corruption backup recovery, respawn targeting.
 * The SaveStorage seam earns its keep here: a Map stands in for localStorage.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { GS, makeHeroState, newGameData } from './state';
import { CURRENT_SAVE_VERSION } from './migrations';
import { BACKUP_KEY, SaveBank, fmtPlaytime, slotKey, type SaveStorage } from './saves';
import type { HeroId } from '../data/heroes';
import { s } from '../spritegen/scale';

interface MemoryStore extends SaveStorage {
  m: Map<string, string>;
}

function memoryStore(): MemoryStore {
  const m = new Map<string, string>();
  return {
    m,
    get: (k) => m.get(k) ?? null,
    set: (k, v) => void m.set(k, v),
    remove: (k) => void m.delete(k),
  };
}

/** a hero exactly as v1 saves stored them — no bag, no equip (migrations.test) */
function v1Hero(id: HeroId, level: number, name?: string): Record<string, unknown> {
  const h = makeHeroState(id, level, name) as unknown as Record<string, unknown>;
  delete h.bag;
  delete h.equip;
  return h;
}

let store: MemoryStore;

beforeEach(() => {
  store = memoryStore();
  GS.reset();
  GS.bank = new SaveBank(store);
});

describe('the slot family (3 slots + rolling backup)', () => {
  it('three notebooks hold three parallel playthroughs that never touch', () => {
    GS.applyNewGameChoices({
      heroNames: { rex: 'Casey', faye: 'Wren', milo: 'Pekoe', pippa: 'Quill', dorin: 'Petru' },
      playerName: 'Jay',
      favoriteFood: 'pancakes',
      coolestThing: 'dial tones',
    });
    GS.data.map = 'otterbrook';
    GS.data.cashOnHand = 11;
    GS.saveTo(1);

    GS.reset();
    GS.data.map = 'brickton';
    GS.data.cashOnHand = 22;
    GS.saveTo(2);

    GS.reset();
    GS.data.map = 'hickory_hill';
    GS.data.cashOnHand = 33;
    GS.saveTo(3);

    expect(GS.continueFrom(1)).toBe('ok');
    expect(GS.data.map).toBe('otterbrook');
    expect(GS.data.cashOnHand).toBe(11);
    expect(GS.heroName('rex')).toBe('Casey');
    expect(GS.activeSlot).toBe(1);

    expect(GS.continueFrom(2)).toBe('ok');
    expect(GS.data.map).toBe('brickton');
    expect(GS.data.cashOnHand).toBe(22);
    expect(GS.heroName('rex')).toBe('Jay'); // slot 2 never renamed anyone
    expect(GS.activeSlot).toBe(2);

    expect(GS.continueFrom(3)).toBe('ok');
    expect(GS.data.cashOnHand).toBe(33);
  });

  it('a pre-S6 single save IS Notebook 1 (legacy key) and lifts through the migration registry', () => {
    // the old SLOT_KEY === slotKey(1); a v1-era blob proves the registry runs
    expect(slotKey(1)).toBe('meteor-falls-slot-1');
    const v1 = {
      version: 1,
      party: [v1Hero('rex', 7, 'Casey')],
      guest: null,
      inventory: ['cracked_bat', 'corn_dog'],
      keyItems: ['star_locket'],
      cashOnHand: 33,
      banked: 50,
      pendingDeposit: 0,
      flags: { meteor_fell: true },
      playtimeSec: 1234,
      map: 'otterbrook',
      x: 100,
      y: 120,
      facing: 'down',
      embers: 1,
      favoriteFood: 'pancakes',
    };
    store.set(slotKey(1), JSON.stringify(v1));
    expect(GS.continueFrom(1)).toBe('ok');
    expect(GS.data.version).toBe(CURRENT_SAVE_VERSION);
    expect(GS.hero('rex')?.bag).toEqual(['cracked_bat', 'corn_dog']);
    expect(GS.hero('rex')?.equip.weapon).toBe('cracked_bat');
    expect(GS.data.heroNames.faye).toBe('Mia'); // ADR-013 backfill via the registry
    expect(GS.data.callers).toEqual([]); // S9: the v3 ledger arrives empty
  });

  it('the S9 ledger survives save → (kill) → continue through the registry', () => {
    GS.data.callers.push({
      quest: 'mail_must_move',
      name: 'Mr. Plummer',
      quote: 'Thirty-one years, kid, and THIS is the special delivery. First class. No postage on courage.',
      effect: { kind: 'damage', power: 450 },
    });
    GS.saveTo(2);
    GS.reset(); // the app dies
    expect(GS.data.callers).toEqual([]);
    expect(GS.continueFrom(2)).toBe('ok');
    expect(GS.data.callers).toHaveLength(1);
    expect(GS.data.callers[0].name).toBe('Mr. Plummer');
  });

  it('the first write to an empty notebook touches no backup; an overwrite rolls one', () => {
    GS.saveTo(1);
    GS.saveTo(2);
    expect(store.get(BACKUP_KEY)).toBeNull();
    GS.data.cashOnHand = 999;
    GS.saveTo(1);
    const env = JSON.parse(store.get(BACKUP_KEY) ?? '{}') as { slot: number; json: string };
    expect(env.slot).toBe(1);
    expect((JSON.parse(env.json) as { cashOnHand: number }).cashOnHand).toBe(12); // the page before
  });
});

describe('forced corruption → rolling-backup recovery (§B1 / ADR-015)', () => {
  it('yanking a slot JSON mid-string still continues from the backup, and heals the slot', () => {
    GS.data.map = 'otterbrook';
    GS.saveTo(2);
    GS.data.map = 'brickton';
    GS.saveTo(2); // the otterbrook page rolls into the backup
    const whole = store.get(slotKey(2));
    store.set(slotKey(2), (whole ?? '').slice(0, 40)); // the coffee incident

    expect(GS.continueFrom(2)).toBe('recovered');
    expect(GS.data.map).toBe('otterbrook'); // the page underneath
    expect(GS.activeSlot).toBe(2);
    // healed in place: the next Continue is a plain 'ok'
    expect(GS.continueFrom(2)).toBe('ok');
    expect(GS.data.map).toBe('otterbrook');
  });

  it("migrateSave's loud unknown-version throw takes the same backup road", () => {
    GS.data.map = 'otterbrook';
    GS.saveTo(3);
    GS.data.map = 'brickton';
    GS.saveTo(3);
    store.set(slotKey(3), JSON.stringify({ ...newGameData(), version: 99 }));
    expect(GS.continueFrom(3)).toBe('recovered');
    expect(GS.data.map).toBe('otterbrook');
  });

  it('the backup never crosses notebooks — another slot stays lost', () => {
    GS.saveTo(1);
    GS.saveTo(1); // backup now shadows slot 1
    store.set(slotKey(2), '{"version":2,"par'); // slot 2 corrupt, no kin backup
    expect(GS.continueFrom(2)).toBe('lost');
    expect(GS.activeSlot).toBe(1); // a lost continue loads nothing, moves no pen
  });

  it('corrupt with no backup at all is lost; an untouched slot is empty', () => {
    store.set(slotKey(1), 'not json at all');
    expect(GS.continueFrom(1)).toBe('lost');
    expect(GS.continueFrom(2)).toBe('empty');
  });
});

describe('slot summaries — derived from the blob, never stored twice', () => {
  it('peek reads name/level/location/playtime/embers off the save', () => {
    GS.applyNewGameChoices({
      heroNames: { rex: 'Casey', faye: 'Wren', milo: 'Pekoe', pippa: 'Quill', dorin: 'Petru' },
      playerName: 'Jay',
      favoriteFood: 'pancakes',
      coolestThing: 'dial tones',
    });
    GS.data.map = 'rex_home';
    GS.data.playtimeSec = 3723; // 1h 2m 3s
    GS.data.embers = 1;
    GS.saveTo(1);

    const [one, two, three] = GS.slotPeeks();
    expect(two).toBe('empty');
    expect(three).toBe('empty');
    if (typeof one === 'string') throw new Error('slot 1 should summarize');
    expect(one.name).toBe('Casey');
    expect(one.level).toBe(1);
    expect(one.location).toBe("{rex}'S HOUSE"); // raw — the scene vars() it per-blob
    expect(one.playtimeSec).toBe(3723);
    expect(one.embers).toBe(1);
  });

  it('a corrupt slot peeks as corrupt without healing it', () => {
    GS.saveTo(1);
    store.set(slotKey(1), 'garbage');
    expect(GS.slotPeeks()[0]).toBe('corrupt');
    expect(store.get(slotKey(1))).toBe('garbage'); // peek never writes
  });

  it('playtime renders H:MM', () => {
    expect(fmtPlaytime(0)).toBe('0:00');
    expect(fmtPlaytime(59)).toBe('0:00');
    expect(fmtPlaytime(3599)).toBe('0:59');
    expect(fmtPlaytime(3723.4)).toBe('1:02');
  });

  it('the clock accumulates fractional seconds and survives the round-trip', () => {
    for (let i = 0; i < 60; i++) GS.tickPlaytime(1 / 60);
    expect(GS.data.playtimeSec).toBeCloseTo(1, 5);
    GS.saveTo(1);
    GS.reset();
    expect(GS.continueFrom(1)).toBe('ok');
    expect(GS.data.playtimeSec).toBeCloseTo(1, 5);
  });
});

describe('defeat respawn targeting (§A4.7 — one function S11 reuses)', () => {
  it('no Dad-save yet → Jay\'s house (ADR-014 interim respawn)', () => {
    expect(GS.respawnPoint()).toEqual({ mapId: 'rex_home', x: s(104), y: s(124), facing: 'down' });
  });

  it('wiping inside the Department targets the Brickton payphone where Dad last saved', () => {
    // Dad saved beside the canon payphone at brickton tile (14,26)
    GS.data.map = 'brickton';
    GS.data.x = 14 * 16 + 8;
    GS.data.y = 26 * 16 + 24;
    GS.data.facing = 'up';
    GS.saveTo(1);
    // the party then climbs the Department and wipes on floor 3
    GS.data.map = 'dos_f3';
    GS.data.x = 60;
    GS.data.y = 48;
    expect(GS.respawnPoint()).toEqual({ mapId: 'brickton', x: 232, y: 440, facing: 'up' });
  });

  it('respawn follows the blob, not live state — and the active slot', () => {
    GS.data.map = 'otterbrook';
    GS.data.x = 50;
    GS.data.y = 60;
    GS.saveTo(2);
    GS.reset();
    expect(GS.continueFrom(2)).toBe('ok');
    GS.data.map = 'hickory_hill'; // wandered off without saving
    expect(GS.respawnPoint().mapId).toBe('otterbrook');
  });
});
