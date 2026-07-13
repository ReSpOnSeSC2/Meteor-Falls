import { describe, expect, it } from 'vitest';
import { safeCoverScale } from './cutsceneFraming';

function expectCovered(
  frameWidth: number,
  frameHeight: number,
  imageWidth: number,
  imageHeight: number,
  scale: number,
  offsetX = 0,
  offsetY = 0,
): void {
  expect(imageWidth * scale).toBeGreaterThanOrEqual(frameWidth + Math.abs(offsetX) * 2);
  expect(imageHeight * scale).toBeGreaterThanOrEqual(frameHeight + Math.abs(offsetY) * 2);
}

describe('responsive cutscene framing', () => {
  it.each([
    { name: '16:9 desktop', frame: [1600, 900] },
    { name: 'portrait phone', frame: [900, 1600] },
    { name: 'ultrawide display', frame: [1920, 800] },
  ])('covers a $name frame before motion begins', ({ frame: [w, h] }) => {
    const scale = safeCoverScale(w, h, 1600, 900, 1.025);
    expectCovered(w, h, 1600, 900, scale);
  });

  it('adds enough overscan for a translated Ken Burns endpoint', () => {
    const scale = safeCoverScale(1600, 900, 1600, 900, 1.04, 72, 44);
    expectCovered(1600, 900, 1600, 900, scale, 72, 44);
    expect(scale).toBeGreaterThan(1.06);
  });

  it('never lets a requested zoom-out expose the panel edge', () => {
    const scale = safeCoverScale(1600, 900, 1600, 900, 0.92, 64, 0);
    expectCovered(1600, 900, 1600, 900, scale, 64, 0);
  });
});
