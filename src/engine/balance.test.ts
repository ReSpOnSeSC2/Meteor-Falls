/**
 * S18 Movement 34 (ADR-074) — BALANCE & THE GREAT VERIFICATION (§A9 Fortune Arc).
 *
 * Proves the back-half wealth curve is well-formed (monotonic, hits the §A9
 * endpoints, climbs as a smooth arc not an impossible jump), the net-worth math +
 * banding read correctly, and the property/fleet price ladders escalate with it.
 */
import { describe, it, expect } from 'vitest';
import { FORTUNE_ARC, fortuneTarget, fortuneBand } from '../data/fortune';
import { netWorth } from './property';
import { PROPERTIES } from '../data/properties';
import { FLEET_CRAFT } from '../data/fleet';

describe('the Fortune Arc — a well-formed §A9 curve', () => {
  it('covers Ch.1–10 in order', () => {
    expect(FORTUNE_ARC.map((r) => r.band)).toEqual(['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7', 'ch8', 'ch9', 'ch10']);
  });
  it('climbs monotonically from ~$1K to $3B+', () => {
    for (let i = 1; i < FORTUNE_ARC.length; i++) {
      expect(FORTUNE_ARC[i].netWorth).toBeGreaterThan(FORTUNE_ARC[i - 1].netWorth);
    }
    expect(FORTUNE_ARC[0].netWorth).toBeLessThanOrEqual(2_000);   // tight 1995 start
    expect(FORTUNE_ARC[FORTUNE_ARC.length - 1].netWorth).toBeGreaterThanOrEqual(3_000_000_000); // $3B+ capstone
  });
  it('escalates as a smooth arc (no impossible single-chapter jump)', () => {
    for (let i = 1; i < FORTUNE_ARC.length; i++) {
      const mult = FORTUNE_ARC[i].netWorth / FORTUNE_ARC[i - 1].netWorth;
      expect(mult).toBeGreaterThan(1);
      expect(mult).toBeLessThanOrEqual(10); // back-half escalates BY DESIGN, but reachably
    }
  });
});

describe('the Fortune Arc — targets + banding read correctly', () => {
  it('fortuneTarget returns the band floor at a chapter', () => {
    expect(fortuneTarget(1)).toBe(1_000);
    expect(fortuneTarget(7)).toBe(8_000_000);
    expect(fortuneTarget(10)).toBe(3_000_000_000);
  });
  it('a portfolio bands as under / on-track / ahead', () => {
    expect(fortuneBand(400, 1)).toBe('under');       // < 50% of $1K
    expect(fortuneBand(1_000, 1)).toBe('on_track');
    expect(fortuneBand(5_000, 1)).toBe('ahead');     // > 150% of $1K
  });
});

describe('the net-worth line tracks the arc', () => {
  it('cash + bank + owned property + fleet titles, minus loans', () => {
    // a Ch.1 player who bought 27 Maple and has a little cash is on-track for ch1
    const nw = netWorth({ cashOnHand: 200, banked: 100, ownedIds: ['27_maple'], chapter: 1, walkSeed: 4104 });
    expect(nw).toBeGreaterThan(PROPERTIES['27_maple'].basePrice); // the home dominates early net worth
    expect(fortuneBand(nw, 1)).not.toBe('under');
  });
});

describe('the price ladders escalate into the back half', () => {
  it('the dearest property + fleet craft climb with the chapters', () => {
    const propByBand = Object.values(PROPERTIES).map((p) => ({ b: Number(/ch(\d+)/.exec(p.band)![1]), v: p.basePrice }));
    const ch1 = Math.max(...propByBand.filter((x) => x.b <= 2).map((x) => x.v));
    const late = Math.max(...propByBand.filter((x) => x.b >= 7).map((x) => x.v));
    expect(late).toBeGreaterThan(ch1); // back-half property dwarfs the starter
    const dearestCraft = Math.max(...Object.values(FLEET_CRAFT).map((c) => c.price));
    expect(dearestCraft).toBeGreaterThan(ch1 * 100); // the fleet is the wealth toy
  });
});
