import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const panels = [
  'titanic_tick_reveal',
  'moms_payphone_call',
  'first_heartlight',
] as const;

function assetPath(path: string): string {
  return fileURLToPath(new URL(`../../${path}`, import.meta.url));
}

function pngSize(path: string): { width: number; height: number } {
  const bytes = readFileSync(path);
  expect(bytes.subarray(1, 4).toString('ascii'), `${path} signature`).toBe('PNG');
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function sha256(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

describe('Chapter 1 contextual cutscene art contracts', () => {
  it('retains each generated source and ships an exact 1600x900 runtime derivative', () => {
    for (const stem of panels) {
      const master = assetPath(
        `assets/art/masters/world/ch1-cutscene-panels/${stem}-source.png`,
      );
      const runtime = assetPath(`assets/art/cutscenes/ch1/${stem}_4x.png`);

      expect(existsSync(master), `${stem} generated source`).toBe(true);
      expect(existsSync(runtime), `${stem} runtime panel`).toBe(true);
      expect(pngSize(master), `${stem} source dimensions`).toEqual({
        width: 1672,
        height: 941,
      });
      expect(pngSize(runtime), `${stem} runtime dimensions`).toEqual({
        width: 1600,
        height: 900,
      });
    }
  });

  it('keeps the cave reveal, Mom call, and Heartlight visually distinct', () => {
    const hashes = panels.map((stem) =>
      sha256(assetPath(`assets/art/cutscenes/ch1/${stem}_4x.png`)),
    );
    expect(new Set(hashes).size).toBe(panels.length);
  });
});
