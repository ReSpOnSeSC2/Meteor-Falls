/**
 * S21 (ADR-126) — THE HELD BREATH. Proves snapshot→rewind round-trips the
 * pre-decision state exactly, the cost (a Breath, a tick of debt) survives the
 * restore, rewinding clears the downstream future, the terminal finale is never
 * anchored, the bank is bounded, and a snapshot self-migrates on restore.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { GS, newGameData } from './state';
import { migrateSave, CURRENT_SAVE_VERSION } from './migrations';
import { MAX_BREATHS } from '../data/echoes';
import { recordChoice, isDecided } from './choice';
import { departHero, rejoinHero } from './party';
import {
  captureEcho,
  rewindTo,
  breathsLeft,
  rewindCount,
  isRewindable,
  canRewind,
  refillBreath,
  rewindableAnchors,
  puppetLocked,
  clearPuppetLock,
} from './echo';

beforeEach(() => {
  GS.reset();
  GS.data.keyItems.push('star_locket');
});

describe('the Held Breath — anchors', () => {
  it('the two non-terminal choices are rewindable; the finale is not', () => {
    expect(isRewindable('ch6_string')).toBe(true);
    expect(isRewindable('ch9_count')).toBe(true);
    expect(isRewindable('ch10_song')).toBe(false);
  });
  it('a fresh save holds a full Breath bank and no rewinds', () => {
    expect(breathsLeft()).toBe(MAX_BREATHS);
    expect(rewindCount()).toBe(0);
  });
});

describe('the Held Breath — capture + rewind round-trips state exactly', () => {
  it('restores the pre-decision blob; the cost is paid and survives the restore', () => {
    GS.data.cashOnHand = 500;
    captureEcho('ch6_string');
    recordChoice('ch6_string', 'pull');
    GS.data.cashOnHand = 9999;
    GS.setFlag('some_later_flag', true);

    expect(rewindTo('ch6_string')).toBe(true);
    // the pre-decision world is back
    expect(GS.data.cashOnHand).toBe(500);
    expect(GS.flag('some_later_flag')).toBe(false);
    expect(isDecided('ch6_string')).toBe(false);
    expect(GS.flag('axis_trust_strings')).toBe(false);
    // …but the cost rides the restored timeline
    expect(breathsLeft()).toBe(MAX_BREATHS - 1);
    expect(rewindCount()).toBe(1);
  });

  it('restores the exact departed-Pippa Chapter 9 save, rolls back both branches, and permits re-decision', () => {
    rejoinHero('pippa', 46);
    const rex = GS.hero('rex')!;
    rex.name = 'Rex QA';
    rex.hp = 17;
    rex.bag = ['hall_of_famer_bat', 'candelabra', 'baozi'];
    rex.equip = { weapon: 'hall_of_famer_bat' };
    rex.boosts = { offense: 3 };
    const pippa = GS.hero('pippa')!;
    pippa.name = 'Pippa QA';
    pippa.hp = 9;
    pippa.pp = 4;
    pippa.bag = ['paper_fan', 'scroll_of_calm'];
    pippa.equip = { weapon: 'paper_fan' };
    pippa.boosts = { speed: 2 };
    expect(departHero('pippa')).toBe(true);

    GS.data.keyItems.push('orient_express_ticket');
    GS.data.cashOnHand = 2468;
    GS.data.banked = 1357;
    GS.data.map = 'castle_hoaxula';
    GS.data.x = 36 * 64 + 32;
    GS.data.y = 16 * 64 + 48;
    GS.data.facing = 'up';
    GS.setFlag('unrelated_keepsake_state', 7);
    GS.data.callers.push({
      quest: 'thread:army',
      name: 'General Buckle',
      quote: 'Still standing by.',
      effect: { kind: 'damage', power: 1200 },
    });
    GS.data.echoes.rewindCount = 3;

    const exactRex = JSON.parse(JSON.stringify(rex));
    const exactPippa = JSON.parse(JSON.stringify(GS.data.departedHeroes.pippa));
    const exactKeyItems = [...GS.data.keyItems];
    const exactUnrelatedCallers = JSON.parse(JSON.stringify(GS.data.callers));
    const exactUnrelated = {
      cashOnHand: GS.data.cashOnHand,
      banked: GS.data.banked,
      map: GS.data.map,
      x: GS.data.x,
      y: GS.data.y,
      facing: GS.data.facing,
    };
    captureEcho('ch9_count');

    // First take the valid OPEN HAND transaction so rewind must remove its Caller.
    recordChoice('ch9_count', 'mercy');
    expect(GS.data.callers.filter((caller) => caller.quest === 'choice:ch9_count')).toHaveLength(1);
    rex.bag = ['corn_dog'];
    rex.equip = {};
    GS.data.departedHeroes.pippa!.bag = ['corn_dog'];
    GS.data.departedHeroes.pippa!.equip = {};
    GS.data.cashOnHand = 1;
    GS.data.banked = 2;
    GS.data.map = 'stone_brow_monastery';
    GS.setFlag('unrelated_keepsake_state', false);

    expect(rewindTo('ch9_count')).toBe(true);
    expect(GS.hero('rex')).toEqual(exactRex);
    expect(GS.data.party.map((hero) => hero.id)).not.toContain('pippa');
    expect(GS.data.departedHeroes.pippa).toEqual(exactPippa);
    expect(GS.data.keyItems).toEqual(exactKeyItems);
    expect(GS.data).toMatchObject(exactUnrelated);
    expect(GS.flag('unrelated_keepsake_state')).toBe(7);
    expect(GS.data.callers).toEqual(exactUnrelatedCallers);
    expect(isDecided('ch9_count')).toBe(false);
    expect(GS.flag('axis_compassion_openhand')).toBe(false);
    expect(GS.flag('axis_compassion_iron')).toBe(false);
    expect(GS.flag('stolen_light_banked')).toBe(false);
    expect(GS.flag('dorin_withholds')).toBe(false);
    expect(breathsLeft()).toBe(MAX_BREATHS - 1);
    expect(rewindCount()).toBe(4);

    // Re-anchor and take the valid IRON transaction so its withhold is likewise
    // proven temporal, then make a fresh decision on the restored timeline.
    captureEcho('ch9_count');
    recordChoice('ch9_count', 'iron');
    expect(GS.flag('dorin_withholds')).toBe(true);
    expect(GS.flag('stolen_light_banked')).toBe(true);
    expect(rewindTo('ch9_count')).toBe(true);
    expect(GS.hero('rex')).toEqual(exactRex);
    expect(GS.data.departedHeroes.pippa).toEqual(exactPippa);
    expect(GS.flag('dorin_withholds')).toBe(false);
    expect(GS.flag('stolen_light_banked')).toBe(false);
    expect(isDecided('ch9_count')).toBe(false);
    expect(breathsLeft()).toBe(MAX_BREATHS - 2);
    expect(rewindCount()).toBe(5);

    recordChoice('ch9_count', 'mercy');
    expect(isDecided('ch9_count')).toBe(true);
    expect(GS.flag('axis_compassion_openhand')).toBe(true);
    expect(GS.flag('axis_compassion_iron')).toBe(false);
    expect(GS.flag('dorin_withholds')).toBe(false);
    expect(GS.data.callers.filter((caller) => caller.quest === 'choice:ch9_count')).toEqual([
      expect.objectContaining({ name: 'Vlad, the Actor' }),
    ]);
  });
});

describe('the Held Breath — bounded + costed', () => {
  it('a rewind is blocked at zero Breaths (no-op)', () => {
    GS.data.echoes.breaths = 0;
    captureEcho('ch6_string');
    recordChoice('ch6_string', 'pull');
    expect(rewindTo('ch6_string')).toBe(false);
    expect(isDecided('ch6_string')).toBe(true);
    expect(rewindCount()).toBe(0);
  });
  it('refillBreath caps at the bank size', () => {
    GS.data.echoes.breaths = 1;
    refillBreath(5);
    expect(breathsLeft()).toBe(MAX_BREATHS);
  });
  it('the terminal finale captures no echo (renunciation)', () => {
    captureEcho('ch10_song');
    expect(GS.data.echoes.stack).toHaveLength(0);
  });
});

describe('the Held Breath — Chapter 7 Locket heist', () => {
  it('blocks capture, refill, listing, and rewind while the physical Locket is stolen', () => {
    captureEcho('ch6_string');
    recordChoice('ch6_string', 'pull');
    GS.data.echoes.breaths = 1;
    GS.setFlag('ch7_locket_stolen');

    expect(canRewind('ch6_string')).toBe(false);
    expect(rewindableAnchors()).toEqual([]);
    expect(rewindTo('ch6_string')).toBe(false);
    refillBreath(1);
    expect(breathsLeft()).toBe(1);

    captureEcho('ch9_count');
    expect(GS.data.echoes.stack.map((echo) => echo.choice)).toEqual(['ch6_string']);
  });

  it('restores every Locket mechanic after idempotent recovery', () => {
    captureEcho('ch6_string');
    recordChoice('ch6_string', 'pull');
    GS.setFlag('ch7_locket_stolen');
    GS.setFlag('ch7_locket_recovered');
    GS.data.echoes.breaths = 1;

    refillBreath(1);
    expect(breathsLeft()).toBe(2);
    expect(canRewind('ch6_string')).toBe(true);
    expect(rewindTo('ch6_string')).toBe(true);
  });
});

describe('the Held Breath — rewinding ch6 erases the ch9 future', () => {
  it('drops later snapshots + downstream choice flags', () => {
    captureEcho('ch6_string');
    recordChoice('ch6_string', 'pull');
    captureEcho('ch9_count');
    recordChoice('ch9_count', 'iron');
    expect(canRewind('ch9_count')).toBe(true);

    rewindTo('ch6_string');
    expect(isDecided('ch9_count')).toBe(false);
    expect(GS.flag('stolen_light_banked')).toBe(false);
    expect(rewindableAnchors()).toEqual([]); // ch6 consumed, ch9 dropped
  });
});

describe('the Held Breath — snapshots are real, self-migrating save blobs', () => {
  it('a snapshot is a v16 serialized save and round-trips through deserialize', () => {
    captureEcho('ch6_string');
    const snap = GS.data.echoes.stack[0];
    expect(JSON.parse(snap.json).version).toBe(CURRENT_SAVE_VERSION);
    recordChoice('ch6_string', 'open');
    expect(rewindTo('ch6_string')).toBe(true);
    expect(GS.data.version).toBe(CURRENT_SAVE_VERSION);
  });
});

describe('the Held Breath — v15 → v16 migration', () => {
  it('a pre-v16 save backfills a full bank, empty stack, zero rewinds', () => {
    const blob = JSON.parse(JSON.stringify(newGameData())) as Record<string, unknown>;
    blob.version = 15;
    delete blob.echoes;
    const out = migrateSave(blob, newGameData());
    expect(out.version).toBe(CURRENT_SAVE_VERSION);
    expect(out.echoes).toEqual({ stack: [], breaths: MAX_BREATHS, rewindCount: 0 });
  });
});

describe('the Held Breath — a spent Breath locks Puppet (§2.3, bend will OR time)', () => {
  it('rewinding locks Puppet; a fresh save is unlocked; a map-change clears it', () => {
    expect(puppetLocked()).toBe(false); // fresh: the Locket is full, Puppet free
    captureEcho('ch6_string');
    recordChoice('ch6_string', 'pull');
    expect(rewindTo('ch6_string')).toBe(true);
    // the lock must be set AFTER the deserialize (which restores the pre-decision
    // flags, where Puppet was free) — proving lockPuppet() rides the cost, not the snapshot
    expect(puppetLocked()).toBe(true);
    clearPuppetLock(); // goThroughDoor releases it when you leave the map
    expect(puppetLocked()).toBe(false);
  });
  it('a blocked rewind (no Breaths) never locks Puppet', () => {
    GS.data.echoes.breaths = 0;
    captureEcho('ch6_string');
    recordChoice('ch6_string', 'pull');
    expect(rewindTo('ch6_string')).toBe(false);
    expect(puppetLocked()).toBe(false);
  });
});
