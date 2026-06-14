/**
 * The character sheet contract (S14b/ADR-040 + ADR-096): the ADR-009 walk
 * block (frames 0–15) is untouchable law; the RUN block appends at 16–23 with
 * a real lean — run frames must DIFFER from the step frames they replace (head
 * down + forward, the determined brow), in every direction. ADR-096 appends
 * the eight diagonal frames (24–43) — append-only, legacy indices preserved.
 */
import { describe, expect, it } from 'vitest';
import {
  CAST,
  generateCharacterFrames,
  generateIdleFrames,
  generateDiagFrames,
  generateDiagRunFrames,
  runFrameBase,
  diagWalkBase,
  diagRunBase,
  DIAG_ORDER,
} from './characters';

describe('ADR-040 — the appended run block', () => {
  const frames = generateCharacterFrames(CAST.rex);

  it('the sheet is 44 frames: walk 0–15 + run 16–23 + diagonals 24–43', () => {
    expect(frames.length).toBe(44);
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

  it('every cast member generates the full 44 without error', () => {
    for (const id of Object.keys(CAST)) {
      expect(generateCharacterFrames(CAST[id]).length).toBe(44);
    }
  });
});

describe('ADR-096 — the appended diagonal block (24–43)', () => {
  const frames = generateCharacterFrames(CAST.rex);

  it('the diagonal bases land where the sheet contract says', () => {
    expect(diagWalkBase('downright')).toBe(24);
    expect(diagWalkBase('downleft')).toBe(27);
    expect(diagWalkBase('upright')).toBe(30);
    expect(diagWalkBase('upleft')).toBe(33);
    expect(diagRunBase('downright')).toBe(36);
    expect(diagRunBase('upleft')).toBe(42);
    expect(generateDiagFrames(CAST.rex).length).toBe(12);
    expect(generateDiagRunFrames(CAST.rex).length).toBe(8);
  });

  it('left diagonals are the exact mirror of the right ones (flipX)', () => {
    const flip = (pm: { w: number; h: number; data: Uint8Array }): Uint8Array => {
      const out = new Uint8Array(pm.data.length);
      for (let y = 0; y < pm.h; y++) for (let x = 0; x < pm.w; x++) out[y * pm.w + (pm.w - 1 - x)] = pm.data[y * pm.w + x];
      return out;
    };
    for (const [r, l] of [['downright', 'downleft'], ['upright', 'upleft']] as const) {
      const right = frames[diagWalkBase(r)];
      const left = frames[diagWalkBase(l)];
      expect(Buffer.from(left.data).equals(Buffer.from(flip(right)))).toBe(true);
    }
  });

  it('a down-diagonal differs from both the front AND the side (a real turn)', () => {
    const dr = frames[diagWalkBase('downright')];
    const down = frames[0]; // down stand
    const right = frames[8]; // right stand
    expect(Buffer.from(dr.data).equals(Buffer.from(down.data))).toBe(false);
    expect(Buffer.from(dr.data).equals(Buffer.from(right.data))).toBe(false);
  });

  it('every cast member generates all 8 diagonal facings without error', () => {
    for (const id of Object.keys(CAST)) {
      const f = generateCharacterFrames(CAST[id]);
      for (const dir of DIAG_ORDER) {
        expect(f[diagWalkBase(dir)]).toBeDefined();
        expect(f[diagRunBase(dir)]).toBeDefined();
      }
    }
  });
});

describe('ADR-104 — idle life + all-angles coverage', () => {
  const nonEmpty = (pm: { data: Uint8Array }): boolean => pm.data.some((c) => c !== 255);

  it('every cast member generates 2 idle frames (breath + blink), both non-empty', () => {
    for (const id of Object.keys(CAST)) {
      const idle = generateIdleFrames(CAST[id]);
      expect(idle.length).toBe(2);
      expect(nonEmpty(idle[0]), `${id} breath blank`).toBe(true);
      expect(nonEmpty(idle[1]), `${id} blink blank`).toBe(true);
    }
  });

  it('all 8 facing stand frames render content (no blank angle)', () => {
    const stands = [0, 4, 8, 12, diagWalkBase('downright'), diagWalkBase('downleft'), diagWalkBase('upright'), diagWalkBase('upleft')];
    for (const id of Object.keys(CAST)) {
      const f = generateCharacterFrames(CAST[id]);
      for (const s of stands) expect(nonEmpty(f[s]), `${id} stand frame ${s} blank`).toBe(true);
    }
  });

  it('the idle breath frame DIFFERS from the stand frame (it actually moves)', () => {
    const f = generateCharacterFrames(CAST.rex);
    const idle = generateIdleFrames(CAST.rex);
    expect(Buffer.from(idle[0].data).equals(Buffer.from(f[0].data))).toBe(false);
  });
});
