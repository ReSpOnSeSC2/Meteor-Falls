/**
 * Native render-resolution scale (ADR — "4× native resolution").
 *
 * `ART_SCALE` is the ONE knob that lifts the whole game from the legacy
 * 400×225 framebuffer to a higher native resolution (4 → 1600×900).
 *
 * The rule that keeps the FROZEN procedural engine frozen:
 *   - Generators in `src/spritegen/` keep drawing at their NATIVE sizes
 *     (tile 16, char 24×32, bust 32×32, battler 28×36, sport 32×40, font 5×7).
 *     They are never re-drawn for the new resolution.
 *   - Everything the RUNTIME sees scales by `ART_SCALE`:
 *       · the framebuffer (`GAME_W`/`GAME_H`),
 *       · procedural textures are upscaled ×ART_SCALE (nearest) at the
 *         registration seam (`addPixmap`/`addSheet`) so the boot fallback fills
 *         the bigger frame at today's chunkiness,
 *       · authored PNGs are sliced at the runtime frame size (native × ART_SCALE)
 *         in `authored.ts` — the crisp art that overrides the fallback,
 *       · scene-side pixel positions/sizes/offsets and px-based speeds use `s()`.
 *
 * `ART_SCALE = 1` reproduces the legacy game byte-for-byte (the regression gate).
 * Flip to 4 only once every domain (world, UI, minigames) is routed through here.
 */
export const ART_SCALE = 1;

/** Scale a native-space pixel quantity into runtime space. `s(n) === n` at ×1. */
export const s = (n: number): number => n * ART_SCALE;
