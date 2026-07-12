import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CUTSCENES, cutscenePanelFilenames, type CutsceneBeat } from './cutscenes';

const all = Object.values(CUTSCENES);

function panelPath(chapter: string, beat: CutsceneBeat): string {
  const candidates = cutscenePanelFilenames(beat.art).map((filename) => fileURLToPath(
    new URL(`../../assets/art/cutscenes/${chapter}/${filename}`, import.meta.url),
  ));
  return candidates.find((path) => existsSync(path)) ?? candidates[candidates.length - 1];
}

function pngSize(path: string): { w: number; h: number } {
  const data = readFileSync(path);
  return { w: data.readUInt32BE(16), h: data.readUInt32BE(20) };
}

function beatKeys(): Set<string> {
  return new Set(all.flatMap((cs) => cs.beats.map((beat) => `${cs.chapter}/${beat.art}`)));
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

  it('times Chapter 3 as seven story-safe single-beat sequences', () => {
    const ids = [
      'ch3_flight', 'ch3_milo_join', 'ch3_first_borrow', 'ch3_stones',
      'ch3_fog_reveal', 'ch3_mainframe', 'ch3_heartlight',
    ] as const;
    expect(CUTSCENES.ch3_journey.beats).toHaveLength(ids.length);
    for (const id of ids) {
      const cutscene = CUTSCENES[id];
      expect(cutscene.beats).toHaveLength(1);
      expect(cutscene.beats[0].captions?.length).toBeGreaterThan(0);
      expect(cutscene.beats[0].motion?.ms).toBeGreaterThanOrEqual(8000);
      expect(existsSync(panelPath('ch3', cutscene.beats[0]))).toBe(true);
    }
  });

  it('prefers runtime-resolution _4x panels over legacy _01 placeholders', () => {
    const preferred4x: string[] = [];
    for (const cs of all) {
      for (const beat of cs.beats) {
        const path = panelPath(cs.chapter, beat);
        if (!path.endsWith('_4x.png')) continue;
        preferred4x.push(`${cs.chapter}/${beat.art}`);
        expect(pngSize(path), `${path} should be a runtime-resolution cutscene panel`).toEqual({ w: 1600, h: 900 });
      }
    }
    expect(preferred4x).toContain('ch5/big_little_lens_build');
    expect(preferred4x).toContain('ch6/zanzibel_market');
  });

  it('does not strand _4x cutscene panels outside the registry', () => {
    const registered = beatKeys();
    const stranded: string[] = [];
    for (let n = 1; n <= 10; n++) {
      const chapter = `ch${n}`;
      const dir = fileURLToPath(new URL(`../../assets/art/cutscenes/${chapter}/`, import.meta.url));
      if (!existsSync(dir)) continue;
      for (const filename of readdirSync(dir).filter((name) => name.endsWith('_4x.png'))) {
        const art = filename.replace(/_4x\.png$/, '');
        if (!registered.has(`${chapter}/${art}`)) stranded.push(`${chapter}/${filename}`);
      }
    }
    expect(stranded).toEqual([]);
  });
});
