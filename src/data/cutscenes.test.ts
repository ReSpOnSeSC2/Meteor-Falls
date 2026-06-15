import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CUTSCENES, type CutsceneBeat } from './cutscenes';

const all = Object.values(CUTSCENES);

function panelPath(chapter: string, beat: CutsceneBeat): string {
  return fileURLToPath(
    new URL(`../../assets/art/cutscenes/${chapter}/${beat.art}_01.png`, import.meta.url),
  );
}

describe('cutscene registry', () => {
  it('is keyed consistently and every cutscene has beats', () => {
    expect(all.length).toBeGreaterThan(0);
    for (const [id, cs] of Object.entries(CUTSCENES)) {
      expect(cs.id).toBe(id); // map key matches the cutscene's own id
      expect(cs.chapter).toMatch(/^ch\d+$/);
      expect(cs.beats.length).toBeGreaterThan(0);
    }
  });

  it('has clean art stems (no extension, no path, no spaces)', () => {
    for (const cs of all) {
      for (const beat of cs.beats) {
        expect(beat.art).toMatch(/^[a-z0-9_]+$/);
      }
    }
  });

  it('covers ch1–ch10', () => {
    const chapters = new Set(all.map((cs) => cs.chapter));
    for (let n = 1; n <= 10; n++) expect(chapters.has(`ch${n}`)).toBe(true);
  });

  // The pipeline allows scaffolding a beat before its PNG lands (the player skips
  // missing art) — but a beat with authored captions is a SHIPPED beat, so its
  // panel must exist on disk.
  it('every captioned beat has its panel authored on disk', () => {
    const missing: string[] = [];
    for (const cs of all) {
      for (const beat of cs.beats) {
        if ((beat.captions?.length ?? 0) > 0 && !existsSync(panelPath(cs.chapter, beat))) {
          missing.push(`${cs.id}: ${beat.art}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it('ch1_opening is the wired proof: three present panels', () => {
    const opening = CUTSCENES.ch1_opening;
    expect(opening.beats.map((b) => b.art)).toEqual([
      'meteor_2am',
      'hickory_hill',
      'otterbrook_at_night',
    ]);
    for (const beat of opening.beats) {
      expect(existsSync(panelPath('ch1', beat))).toBe(true);
    }
  });
});
