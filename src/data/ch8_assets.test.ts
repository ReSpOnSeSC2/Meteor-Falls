import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

function asset(path: string): Buffer {
  return readFileSync(fileURLToPath(new URL(`../../${path}`, import.meta.url)));
}

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function pngSize(bytes: Buffer): { width: number; height: number } {
  expect(bytes.subarray(1, 4).toString('ascii')).toBe('PNG');
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

describe('Chapter 8 production art contracts', () => {
  const cutscenes = [
    'riverboat_to_lotus_harbor',
    'lotus_harbor_arrival',
    'spore_forest_scramble',
    'yak_express_to_mt_shu',
    'paper_guardians_false_folds',
    'paper_dragon_reveal',
    'paper_dragon_reveal_departed',
    'temple_bell_resonance',
    'temple_bell_resonance_departed',
  ];

  it('pairs every exact-size runtime cutscene panel with an identical source master', () => {
    for (const name of cutscenes) {
      const runtime = asset(`assets/art/cutscenes/ch8/${name}_4x.png`);
      const source = asset(`assets/art/masters/world/ch8-cutscene-panels/${name}-source.png`);
      expect(pngSize(runtime), name).toEqual({ width: 1600, height: 900 });
      expect(sha256(source), `${name} source/runtime drift`).toBe(sha256(runtime));
    }
  });

  it('keeps Pippa-present and departed post-choice panels byte-distinct', () => {
    expect(sha256(asset('assets/art/cutscenes/ch8/paper_dragon_reveal_4x.png'))).not.toBe(
      sha256(asset('assets/art/cutscenes/ch8/paper_dragon_reveal_departed_4x.png')),
    );
    expect(sha256(asset('assets/art/cutscenes/ch8/temple_bell_resonance_4x.png'))).not.toBe(
      sha256(asset('assets/art/cutscenes/ch8/temple_bell_resonance_departed_4x.png')),
    );
  });

  it('keeps all three Paper Dragon BURNING wear stages dimension-aligned and byte-distinct', () => {
    const stages = ['', '_w1', '_w2'].map((suffix) =>
      asset(`assets/art/enemies/battle_paper_dragon_burning${suffix}.png`),
    );
    expect(stages.map(pngSize)).toEqual([
      { width: 405, height: 460 },
      { width: 405, height: 460 },
      { width: 405, height: 460 },
    ]);
    expect(new Set(stages.map(sha256)).size).toBe(3);
  });

  it('pairs all three named specialist animation sheets with exact retained masters', () => {
    for (const name of ['lotus_bargeman', 'lh_yak_handler', 'mt_shu_elder']) {
      const runtime = asset(`assets/art/characters/${name}_anim_46_4x.png`);
      const master = asset(`assets/art/masters/characters/animation/${name}_anim_46_4x_master.png`);
      expect(pngSize(runtime), name).toEqual({ width: 384, height: 1536 });
      expect(sha256(master), `${name} source/runtime drift`).toBe(sha256(runtime));
    }
  });
});
