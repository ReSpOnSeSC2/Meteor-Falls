/**
 * Return the smallest scale that keeps a cutscene panel covering the frame.
 *
 * `zoom` is the director's requested Ken Burns scale relative to a centered
 * cover. `offsetX/Y` are the panel's screen-space translation from center. The
 * translation matters: a 16:9 image at a 16:9 frame can expose an edge even at
 * 1.06x if it is moved farther than the extra overscan. Keeping this math pure
 * makes the responsive framing contract testable without Phaser.
 */
export function safeCoverScale(
  frameWidth: number,
  frameHeight: number,
  imageWidth: number,
  imageHeight: number,
  zoom = 1,
  offsetX = 0,
  offsetY = 0,
): number {
  if (frameWidth <= 0 || frameHeight <= 0 || imageWidth <= 0 || imageHeight <= 0) return 1;

  const centeredCover = Math.max(frameWidth / imageWidth, frameHeight / imageHeight);
  const translatedCover = Math.max(
    (frameWidth + Math.abs(offsetX) * 2) / imageWidth,
    (frameHeight + Math.abs(offsetY) * 2) / imageHeight,
  );
  return Math.max(centeredCover * Math.max(0, zoom), translatedCover);
}
