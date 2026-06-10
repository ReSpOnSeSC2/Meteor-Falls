import { describe, it, expect } from 'vitest';
import { Odometer } from './odometer';

describe('rolling HP odometer (GAME_BIBLE §A4.1)', () => {
  it('rolls down at the configured rate', () => {
    const o = new Odometer(100, 100, 20, 80);
    o.damage(40);
    expect(o.target).toBe(60);
    o.tick(1);
    expect(o.value).toBe(80);
    o.tick(1);
    expect(o.value).toBe(60);
    expect(o.rolling).toBe(false);
  });

  it('a mortal hit can be outraced by healing from the DISPLAYED value', () => {
    const o = new Odometer(50, 100, 20, 80);
    o.damage(999); // mortal: target 0
    expect(o.mortal).toBe(true);
    o.tick(1); // displayed ~30
    expect(o.dead).toBe(false);
    o.heal(45); // resolves from displayed (30) -> target 75
    expect(o.mortal).toBe(false);
    expect(o.target).toBe(75);
    o.tick(1);
    expect(o.dead).toBe(false);
    expect(o.value).toBeGreaterThan(30);
  });

  it('winning the battle freezes the meter mid-roll', () => {
    const o = new Odometer(50, 100, 20, 80);
    o.damage(999);
    o.tick(1.2); // displayed ~26
    o.freeze(); // victory!
    expect(o.dead).toBe(false);
    expect(o.value).toBe(26);
    expect(o.rolling).toBe(false);
  });

  it('dies only when the displayed value reaches 0', () => {
    const o = new Odometer(30, 100, 20, 80);
    o.damage(30);
    expect(o.dead).toBe(false);
    o.tick(1.4999);
    expect(o.dead).toBe(false);
    o.tick(0.6);
    expect(o.dead).toBe(true);
  });

  it('overkill clamps at zero', () => {
    const o = new Odometer(10, 100, 20, 80);
    o.damage(500);
    o.tick(10);
    expect(o.displayed).toBe(0);
    expect(o.target).toBe(0);
  });

  it('heal cannot exceed max', () => {
    const o = new Odometer(90, 100, 20, 80);
    o.heal(50);
    expect(o.target).toBe(100);
  });

  it('simultaneous meters roll independently', () => {
    const a = new Odometer(100, 100, 20, 80);
    const b = new Odometer(40, 100, 20, 80);
    a.damage(20);
    b.damage(40);
    for (let i = 0; i < 15; i++) {
      a.tick(0.1);
      b.tick(0.1);
    }
    // 1.5s at 20 HP/s: a finished its 20-HP roll, b (40 HP to go) has not
    expect(a.value).toBe(80);
    expect(b.dead).toBe(false);
    b.tick(1.1);
    expect(b.dead).toBe(true);
    expect(a.dead).toBe(false);
  });
});
