/**
 * S11b — the WEAPON_ART completeness MIRROR (the validator enforces the same
 * truths in tools/content-validate.ts; this suite keeps them red in vitest
 * alone). Both directions: every §A8 equippable maps to drawn art whose kind
 * agrees with its slot, and an art row no item claims is a dead manifest
 * row. Plus the art LAW itself: same-class weapons share a silhouette but
 * read differently (Cracked vs T-Ball), and the battler actually composes
 * the equipped weapon into the swing.
 */
import { describe, expect, it } from 'vitest';
import { ITEMS, slotOf } from '../data/items';
import { WEAPON_ART, drawHeldWeapon, weaponClassOf, swingSfxOf, type HeldArt, type HeldPose } from './weapons';
import { Pixmap } from './pixmap';
import { T } from '../palette';
import { generateBattlerFrames, BATTLER_FRAME } from './battlers';
import { CAST } from './characters';

// S12/ADR-034 amended ADR-032's provisional arms→torso mapping: arms gear
// ships as drawn icons (a 2px wristband cannot read on a 28px battler arm)
const SLOT_KIND: Record<string, string> = { weapon: 'held', body: 'torso', arms: 'trinket', other: 'trinket' };

describe('WEAPON_ART ⇄ §A8 equippables (both directions)', () => {
  it('every equippable item has an art row of the right kind', () => {
    for (const item of Object.values(ITEMS)) {
      const slot = slotOf(item);
      if (slot === null) continue;
      const art = WEAPON_ART[item.id];
      expect(art, `equippable '${item.id}' has no WEAPON_ART row`).toBeDefined();
      expect(art.kind, `'${item.id}' slot ${slot} wants '${SLOT_KIND[slot]}' art`).toBe(SLOT_KIND[slot]);
    }
  });

  it('every art row is claimed by an equippable item', () => {
    for (const id of Object.keys(WEAPON_ART)) {
      const item = ITEMS[id];
      expect(item, `WEAPON_ART row '${id}' claims no item`).toBeDefined();
      expect(slotOf(item), `WEAPON_ART row '${id}' points at a non-equippable`).not.toBeNull();
    }
  });

  it('held art draws pixels in every swing pose', () => {
    const poses: HeldPose[] = ['rest', 'back', 'strike', 'aim', 'recoil'];
    for (const [id, art] of Object.entries(WEAPON_ART)) {
      if (art.kind !== 'held') continue;
      for (const pose of poses) {
        const pm = new Pixmap(28, 36);
        drawHeldWeapon({ pm, gx: 16, gy: 18, pose }, art);
        const n = pm.data.reduce((a, c) => a + (c !== T ? 1 : 0), 0);
        expect(n, `'${id}' draws nothing in pose '${pose}'`).toBeGreaterThan(0);
      }
    }
  });

  // S15h: the 'trinket' icons (arms + charms) are drawn on demand by the
  // equip/status UI, never at boot — so prove every one renders SOMETHING
  // inside real bounds (this is the only render-proof Pippa's Minister's
  // Ribbon icon, and its four STARTING FIVE siblings, ever get)
  it('every trinket icon draws content inside real bounds', () => {
    for (const [id, art] of Object.entries(WEAPON_ART)) {
      if (art.kind !== 'trinket') continue;
      const pm = art.icon();
      expect(pm.w, `trinket '${id}' icon has no width`).toBeGreaterThan(0);
      expect(pm.h, `trinket '${id}' icon has no height`).toBeGreaterThan(0);
      const n = pm.data.reduce((a, c) => a + (c !== T ? 1 : 0), 0);
      expect(n, `trinket '${id}' icon draws nothing`).toBeGreaterThan(0);
    }
  });

  it('item detail passes keep the class silhouette but read differently (Cracked vs T-Ball)', () => {
    const draw = (id: string): Uint8Array => {
      const pm = new Pixmap(28, 36);
      drawHeldWeapon({ pm, gx: 16, gy: 18, pose: 'back' }, WEAPON_ART[id] as HeldArt);
      return pm.data;
    };
    const a = draw('cracked_bat');
    const b = draw('tball_bat');
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(false);
  });

  it('weaponClassOf and swingSfxOf resolve the whole §A8 weapon line', () => {
    expect(weaponClassOf('cracked_bat')).toBe('bat');
    expect(weaponClassOf('tball_bat')).toBe('bat');
    expect(weaponClassOf('hand_me_down_pan')).toBe('pan');
    expect(weaponClassOf('pellet_popper')).toBe('rifle');
    expect(weaponClassOf('cedar_beads')).toBe('beads');
    // M19 (ADR-064): Pippa's KIT class — the gun ladder stays rifle, her kit is its own
    expect(weaponClassOf('gauss_lobber')).toBe('rifle');
    expect(weaponClassOf('stamp_sling')).toBe('kit');
    expect(weaponClassOf('royal_red_pen')).toBe('kit');
    expect(weaponClassOf(null)).toBe('fist');
    for (const cls of ['bat', 'pan', 'rifle', 'beads', 'kit', 'fist'] as const) {
      expect(swingSfxOf(cls).length).toBeGreaterThan(0);
    }
  });
});

describe('the battler composes the EQUIPPED weapon at generation time', () => {
  const frameData = (weapon: string | null, frame: number): Uint8Array =>
    generateBattlerFrames(CAST.rex, { weapon, body: null }, 0)[frame].data;

  it("Jay's backswing carries HIS bat — bare fists differ", () => {
    const bare = frameData(null, BATTLER_FRAME.backswing);
    const bat = frameData('cracked_bat', BATTLER_FRAME.backswing);
    expect(Buffer.from(bare).equals(Buffer.from(bat))).toBe(false);
  });

  it('a Cracked and a T-Ball backswing read differently on the sheet', () => {
    const cracked = frameData('cracked_bat', BATTLER_FRAME.backswing);
    const tball = frameData('tball_bat', BATTLER_FRAME.backswing);
    expect(Buffer.from(cracked).equals(Buffer.from(tball))).toBe(false);
  });

  it('the Champion Jacket re-dresses the battler torso', () => {
    const bare = generateBattlerFrames(CAST.rex, { weapon: null, body: null }, 0)[BATTLER_FRAME.idleA].data;
    const jacket = generateBattlerFrames(CAST.rex, { weapon: null, body: 'champion_jacket' }, 0)[BATTLER_FRAME.idleA].data;
    expect(Buffer.from(bare).equals(Buffer.from(jacket))).toBe(false);
  });
});
