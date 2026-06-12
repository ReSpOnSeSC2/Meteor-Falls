/**
 * The character sheet contract (S14b/ADR-040): the ADR-009 walk block
 * (frames 0–15) is untouchable law; the RUN block appends at 16–23 with a
 * real lean — run frames must DIFFER from the step frames they replace
 * (head down + forward, the determined brow), in every direction.
 */
import { describe, expect, it } from 'vitest';
import { CAST, generateCharacterFrames, runFrameBase } from './characters';

describe('ADR-040 — the appended run block', () => {
  const frames = generateCharacterFrames(CAST.rex);

  it('the sheet is 24 frames: walk 0–15 (law) + run 16–23 (appended)', () => {
    expect(frames.length).toBe(24);
    expect(runFrameBase(0)).toBe(16); // down
    expect(runFrameBase(1)).toBe(18); // left
    expect(runFrameBase(2)).toBe(20); // right
    expect(runFrameBase(3)).toBe(22); // up
  });

  it('every run frame differs from the walk step it replaces (the lean is real)', () => {
    // walk step poses per direction: frames d*4+1 and d*4+3
    for (let d = 0; d < 4; d++) {
      for (let p = 0; p < 2; p++) {
        const walk = frames[d * 4 + (p === 0 ? 1 : 3)];
        const run = frames[runFrameBase(d) + p];
        expect(run.w).toBe(walk.w);
        expect(run.h).toBe(walk.h);
        expect(Buffer.from(run.data).equals(Buffer.from(walk.data))).toBe(false);
      }
    }
  });

  it('the lean leans FORWARD: the right-run head mass sits right of the walk head', () => {
    // center of mass of the top 14 rows (the head) must shift +x on right-run
    const massX = (pm: { w: number; h: number; data: Uint8Array }): number => {
      let sum = 0;
      let n = 0;
      for (let y = 0; y < 14; y++) {
        for (let x = 0; x < pm.w; x++) {
          if (pm.data[y * pm.w + x] !== 255) {
            sum += x;
            n++;
          }
        }
      }
      return n === 0 ? 0 : sum / n;
    };
    const walkStep = frames[2 * 4 + 1]; // right, step A
    const runStep = frames[runFrameBase(2)]; // right-run A
    expect(massX(runStep)).toBeGreaterThan(massX(walkStep));
  });

  it('every cast member generates the full 24 without error', () => {
    for (const id of Object.keys(CAST)) {
      expect(generateCharacterFrames(CAST[id]).length).toBe(24);
    }
  });
});
