/**
 * THE CAGE data — bracket math, rosters, ratings, rewards (S12/ADR-034).
 * The validator owns existence and manifests; these own behavior: the
 * bracket survives a full title run, walk-ons obey their gates, hero
 * ratings read THROUGH the arms slot, drops roll seeded.
 */
import { describe, expect, it } from 'vitest';
import {
  TEAMS,
  TEAM_ORDER,
  WALK_ONS,
  newBracket,
  advanceBracket,
  roundEntrants,
  nextOpponent,
  simWinner,
  teamAthletes,
  teamBaseRating,
  heroAthleteRating,
  buildRoster,
  rollDrops,
  classicSeed,
  pickupSeed,
  PARTY_SLOT_ID,
  BRACKET_ROUNDS,
  STARTING_FOUR,
} from './hoops';
import { makeRng } from '../hoops/sim';
import { makeHeroState } from '../engine/state';

describe('the bracket (save v5 rides this shape)', () => {
  it('draws 32 slots: the party + all 31, weakest gate first', () => {
    const b = newBracket(123);
    expect(b.field).toHaveLength(32);
    expect(b.field[0]).toBe(PARTY_SLOT_ID);
    expect(new Set(b.field).size).toBe(32); // nobody enters twice
    expect(TEAMS[b.field[1]].tier).toBe(1); // round one is the soft open
    expect(TEAMS[b.field[31]].tier).toBe(5); // the far bottom is title-grade
    for (const id of TEAM_ORDER) expect(b.field).toContain(id);
  });

  it('same seed, same chalk; different seed, different chalk', () => {
    expect(newBracket(7).field).toEqual(newBracket(7).field);
    expect(newBracket(7).field).not.toEqual(newBracket(8).field);
  });

  it('a full title run: five rounds, the party alive through each', () => {
    let b = newBracket(classicSeed(0, 0));
    for (let r = 0; r < BRACKET_ROUNDS; r++) {
      expect(b.round).toBe(r);
      const opp = nextOpponent(b);
      expect(TEAMS[opp]).toBeDefined();
      const next = advanceBracket(b, true);
      expect(next).not.toBeNull();
      if (!next) return;
      b = next;
      expect(b.results[r]).toHaveLength(16 >> r);
      expect(b.results[r]).toContain(PARTY_SLOT_ID);
    }
    expect(roundEntrants(b, BRACKET_ROUNDS - 1)).toHaveLength(2);
  });

  it('the final pairs the party against a survivor of the hard half', () => {
    let b = newBracket(classicSeed(0, 0));
    for (let r = 0; r < 4; r++) {
      const n = advanceBracket(b, true);
      if (!n) throw new Error('party died advancing');
      b = n;
    }
    const finalOpp = nextOpponent(b);
    expect(TEAMS[finalOpp].tier).toBeGreaterThanOrEqual(3); // the gauntlet held
  });

  it('single elimination means exactly that — a loss tears it up', () => {
    const b = newBracket(1);
    expect(advanceBracket(b, false)).toBeNull();
  });

  it('sim results are seeded and tier-honest in the long run', () => {
    const rng = makeRng(99);
    let strongWins = 0;
    for (let i = 0; i < 400; i++) {
      if (simWinner('quota_crushers', 'wet_socks', rng) === 'quota_crushers') strongWins++;
    }
    expect(strongWins).toBeGreaterThan(300); // tier 5 vs tier 1: no charity
    expect(strongWins).toBeLessThan(400); // but the cage owes nobody
    // and the same seed replays the same bracket round
    const a = advanceBracket(newBracket(5), true);
    const c = advanceBracket(newBracket(5), true);
    expect(a?.results).toEqual(c?.results);
  });

  it('tournament + pickup seeds derive from save state, deterministically', () => {
    expect(classicSeed(0, 0)).toBe(classicSeed(0, 0));
    expect(classicSeed(1, 4)).not.toBe(classicSeed(0, 4));
    expect(pickupSeed(3)).not.toBe(pickupSeed(4));
  });
});

describe('the fives', () => {
  it('every team fields five athletes with honest 0–99 ratings', () => {
    for (const id of TEAM_ORDER) {
      const a = teamAthletes(id);
      expect(a).toHaveLength(5);
      for (const ath of a) {
        for (const v of Object.values(ath.rating)) {
          expect(v).toBeGreaterThanOrEqual(8);
          expect(v).toBeLessThanOrEqual(99);
        }
        expect(ath.name.length).toBeGreaterThan(2);
      }
    }
    expect(teamBaseRating(5) - teamBaseRating(1)).toBe(36); // the tier ladder
  });

  it('hero court ratings read THROUGH the arms slot (the S12 loop)', () => {
    const rex = makeHeroState('rex', 8);
    const before = heroAthleteRating(rex);
    rex.bag.push(STARTING_FOUR.rex);
    rex.equip.arms = STARTING_FOUR.rex; // Champ's Sweatband: Guts +6
    const after = heroAthleteRating(rex);
    expect(after.dnk).toBeGreaterThan(before.dnk); // guts drives the rim game
    expect(after.spd).toBe(before.spd);
  });

  it('your five = the party first, then walk-ons in table order', () => {
    const party = [makeHeroState('rex', 5)];
    const { defs, walkOns } = buildRoster(party, () => false, 5);
    expect(defs).toHaveLength(5);
    expect(defs[0].key).toBe('athlete_rex');
    expect(walkOns.map((w) => w.id)).toEqual(['chad', 'pajama_kid', 'pigeon_kid', 'quarter_man']);
  });

  it('Chad guests pre-Milo — and only pre-Milo', () => {
    const party = [makeHeroState('rex', 5)];
    const flags = new Set(['milo_joined']);
    const { walkOns } = buildRoster(party, (f) => flags.has(f), 5);
    expect(walkOns.map((w) => w.id)).toEqual(['pajama_kid', 'pigeon_kid', 'quarter_man', 'sidewalk_critic']);
    expect(WALK_ONS.chad.unlessFlag).toBe('milo_joined');
  });

  it('a 3v3 takes the first three', () => {
    const party = [makeHeroState('rex', 5), makeHeroState('faye', 5)];
    const { defs } = buildRoster(party, () => false, 3);
    expect(defs.map((d) => d.key)).toEqual(['athlete_rex', 'athlete_faye', 'athlete_chad']);
  });
});

describe('rewards', () => {
  it('drops roll seeded — same rng, same goods', () => {
    expect(rollDrops(3, makeRng(4))).toEqual(rollDrops(3, makeRng(4)));
    expect(rollDrops(0, makeRng(4))).toEqual([]);
    for (const id of rollDrops(20, makeRng(9))) {
      expect(['corn_dog', 'pbj', 'lemonade', 'star_cola']).toContain(id);
    }
  });
});
