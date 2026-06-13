/**
 * S11b — the WEAR-TIER completeness MIRROR (validator twin). Both
 * directions: every §A7 roster enemy has a wear-capable battle draw whose
 * sprite key agrees with the data, and every wear row claims a roster
 * enemy. Plus the tiers themselves: scuffed and battered must actually
 * DIFFER from full — on enemies, busts, AND battlers — and the Tick must
 * visibly deflate (its battered dome loses crown rows).
 */
import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../data/enemies';
import { ENEMY_BATTLE_ART } from './enemies';
import { generateBustFrames, BUST_FRAME } from './busts';
import { generateBattlerFrames, BATTLER_FRAME, type WearTier } from './battlers';
import { CAST } from './characters';
import { T } from '../palette';

const differs = (a: Uint8Array, b: Uint8Array): boolean => !Buffer.from(a).equals(Buffer.from(b));

describe('ENEMY_BATTLE_ART ⇄ §A7 roster (both directions)', () => {
  it('every roster enemy has a wear draw keyed to its sprite', () => {
    for (const e of Object.values(ENEMIES)) {
      const row = ENEMY_BATTLE_ART[e.id];
      expect(row, `enemy '${e.id}' has no wear draw`).toBeDefined();
      expect(row.sprite, `'${e.id}' wear sprite key disagrees with the data`).toBe(e.sprite);
    }
  });

  it('every wear row claims a roster enemy', () => {
    for (const id of Object.keys(ENEMY_BATTLE_ART)) {
      expect(ENEMIES[id], `wear row '${id}' matches no roster enemy`).toBeDefined();
    }
  });

  it('all three tiers draw, and scuffed/battered differ from full', () => {
    for (const [id, row] of Object.entries(ENEMY_BATTLE_ART)) {
      const tiers = ([0, 1, 2] as WearTier[]).map((w) => row.draw(w));
      for (const [i, pm] of tiers.entries()) {
        const n = pm.data.reduce((a, c) => a + (c !== T ? 1 : 0), 0);
        expect(n, `'${id}' tier ${i} draws nothing`).toBeGreaterThan(50);
        // every tier shares one canvas, so the texture swap can never drift
        expect(pm.w).toBe(tiers[0].w);
        expect(pm.h).toBe(tiers[0].h);
      }
      expect(differs(tiers[0].data, tiers[1].data), `'${id}' w1 is identical to full`).toBe(true);
      expect(differs(tiers[1].data, tiers[2].data), `'${id}' w2 is identical to w1`).toBe(true);
    }
  });

  it('the battered Tick visibly DEFLATES — crown pixels go empty', () => {
    const full = ENEMY_BATTLE_ART.titanic_tick.draw(0);
    const flat = ENEMY_BATTLE_ART.titanic_tick.draw(2);
    // rows 8..13 hold the full dome's crown; deflated, its top starts at 14
    let lost = 0;
    for (let y = 8; y < 13; y++) {
      for (let x = 20; x < 75; x++) {
        if (full.get(x, y) !== T && flat.get(x, y) === T) lost++;
      }
    }
    expect(lost).toBeGreaterThan(40);
  });
});

describe('hero wear tiers — busts and battlers degrade with the drums', () => {
  it('bust idle frames differ per tier for every hero', () => {
    for (const id of ['rex', 'faye', 'milo', 'pippa', 'dorin']) {
      const t0 = generateBustFrames(CAST[id], null, 0)[BUST_FRAME.idleA].data;
      const t1 = generateBustFrames(CAST[id], null, 1)[BUST_FRAME.idleA].data;
      const t2 = generateBustFrames(CAST[id], null, 2)[BUST_FRAME.idleA].data;
      expect(differs(t0, t1), `${id} bust w1 = w0`).toBe(true);
      expect(differs(t1, t2), `${id} bust w2 = w1`).toBe(true);
    }
  });

  it('battler idle frames differ per tier for every hero', () => {
    for (const id of ['rex', 'faye', 'milo', 'pippa', 'dorin']) {
      const look = { weapon: null, body: null };
      const t0 = generateBattlerFrames(CAST[id], look, 0)[BATTLER_FRAME.idleA].data;
      const t1 = generateBattlerFrames(CAST[id], look, 1)[BATTLER_FRAME.idleA].data;
      const t2 = generateBattlerFrames(CAST[id], look, 2)[BATTLER_FRAME.idleA].data;
      expect(differs(t0, t1), `${id} battler w1 = w0`).toBe(true);
      expect(differs(t1, t2), `${id} battler w2 = w1`).toBe(true);
    }
  });

  it('the bust sheet carries the S11b WINDED pair past the S11 contract', () => {
    expect(BUST_FRAME.windedA).toBe(16);
    expect(BUST_FRAME.windedB).toBe(17);
    const frames = generateBustFrames(CAST.rex);
    expect(frames.length).toBe(18);
    expect(differs(frames[BUST_FRAME.windedA].data, frames[BUST_FRAME.windedB].data)).toBe(true);
    // the original 16 indices are law — spot-check the anchors
    expect(BUST_FRAME.idleA).toBe(0);
    expect(BUST_FRAME.down).toBe(13);
    expect(BUST_FRAME.cheerB).toBe(15);
  });

  it('every battler sheet ships the full 14-frame stage set', () => {
    for (const id of ['rex', 'faye', 'milo', 'pippa', 'dorin']) {
      const frames = generateBattlerFrames(CAST[id], { weapon: null, body: null }, 0);
      expect(frames.length).toBe(14);
      for (const [name, idx] of Object.entries(BATTLER_FRAME)) {
        const n = frames[idx].data.reduce((a, c) => a + (c !== T ? 1 : 0), 0);
        expect(n, `${id} battler frame '${name}' draws nothing`).toBeGreaterThan(80);
      }
    }
  });
});
