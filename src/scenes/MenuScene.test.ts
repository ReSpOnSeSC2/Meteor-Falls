import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

describe('MenuScene Chapter 8 status presentation', () => {
  const source = readFileSync(fileURLToPath(new URL('./MenuScene.ts', import.meta.url)), 'utf8');

  it('labels Mushroomized and explains its field-control consequence', () => {
    expect(source).toContain("'MUSHROOMIZED'");
    expect(source).toContain("'INPUT ROTATES; CALM/ANTIDOTE'");
    expect(source).toContain("'A DOCTOR CAN CURE IT'");
    expect(source.indexOf("'A DOCTOR CAN CURE IT'"))
      .toBeLessThan(source.indexOf('`HP ${h.hp}/${h.maxHp}'));
  });
});
