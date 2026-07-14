import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const stems = [
  'orient_less_express_to_valea',
  'valea_stelelor_arrival',
  'buni_feast_basket',
  'castle_hoaxula',
  'count_hoaxula_unmasked',
  'monastery_bell_tower_resonance',
  'choice_ch9_iron_or_open',
] as const;

const variants = ['pippa', 'departed'] as const;

function assetPath(path: string): string {
  return fileURLToPath(new URL(`../../${path}`, import.meta.url));
}

function pngSize(path: string): { width: number; height: number } {
  const bytes = readFileSync(path);
  expect(bytes.subarray(1, 4).toString('ascii'), `${path} signature`).toBe('PNG');
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

describe('Chapter 9 contextual cutscene art contracts', () => {
  it('ships both party variants with retained masters and exact runtime dimensions', () => {
    for (const stem of stems) {
      for (const variant of variants) {
        const name = `${stem}_${variant}`;
        const master = assetPath(
          `assets/art/masters/world/ch9-cutscene-panels/${name}-source.png`,
        );
        const runtime = assetPath(`assets/art/cutscenes/ch9/${name}_4x.png`);

        expect(existsSync(master), `${name} master`).toBe(true);
        expect(existsSync(runtime), `${name} runtime`).toBe(true);
        expect(pngSize(master), `${name} master dimensions`).toEqual({
          width: 1672,
          height: 941,
        });
        expect(pngSize(runtime), `${name} runtime dimensions`).toEqual({
          width: 1600,
          height: 900,
        });
      }
    }
  });
});
