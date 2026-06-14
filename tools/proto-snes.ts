/**
 * SPIKE — NOT wired into the game. The "crisp SNES bump" target:
 * Chrono Trigger / Mother 3 / EarthBound tier — built with the REAL engine
 * (`Pixmap` + the master palette + the ADR-101 6-stop lit primitives), just at
 * a bigger native size (32×48 vs the shipping 24×32) with more shading detail
 * and slightly less-chibi proportions. Crisp hard pixels, palette-locked,
 * deterministic — everything the engine already guarantees. This is the honest
 * preview of an *in-idiom* upgrade (no RGBA rewrite, no soft gradients).
 *
 *   npx vite-node tools/proto-snes.ts   →   .shots/proto_snes_jay.png
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { Pixmap } from '../src/spritegen/pixmap';
import { RAMP, SH, pxr, C } from '../src/palette';
import { pixmapToPng } from './png';

const W = 32;
const H = 48;
const pm = new Pixmap(W, H);
const S = (r: number, sh: number): number => pxr(r, sh);

// ---- HEAD (drawn first so the cap can sit ON TOP of it) -----------------
pm.litEllipse(16, 16, 6, 8, RAMP.SKIN); // shaded head, y8..24

// hair — sideburns beside the face (the crown is hidden under the cap)
pm.vline(10, 15, 5, S(RAMP.INK, SH.DARK)); // L sideburn
pm.vline(22, 15, 5, S(RAMP.INK, SH.SHADOW)); // R sideburn

// ---- CAP (red ballcap ON TOP: dome + hatband + button + forward brim) ---
pm.litEllipse(16, 9, 8, 5, RAMP.RED); // dome, y4..14
pm.set(16, 4, S(RAMP.RED, SH.HILITE)); // crown button
pm.hline(9, 12, 15, S(RAMP.RED, SH.DARK)); // hatband seam
pm.hline(8, 13, 17, S(RAMP.RED, SH.LIT)); // brim top catches light
pm.hline(8, 14, 17, S(RAMP.RED, SH.SHADOW)); // brim underside in shade
pm.hline(11, 15, 10, S(RAMP.SKIN, SH.DARK)); // brim's cast shadow on the brow

// ---- FACE (EarthBound almond eyes + catchlight, nose, mouth) ------------
pm.rect(11, 17, 2, 4, S(RAMP.INK, SH.SHADOW)); // left eye
pm.rect(19, 17, 2, 4, S(RAMP.INK, SH.SHADOW)); // right eye
pm.set(11, 17, C.white); // catchlights (light from upper-left)
pm.set(19, 17, C.white);
pm.set(16, 21, S(RAMP.SKIN, SH.DARK)); // nose
pm.hline(14, 22, 4, S(RAMP.SKIN, SH.DARK)); // mouth
pm.set(10, 21, S(RAMP.RED, SH.LIT)); // a touch of blush
pm.set(22, 21, S(RAMP.RED, SH.LIT));

// ---- NECK ---------------------------------------------------------------
pm.rect(14, 23, 4, 2, S(RAMP.SKIN, SH.MID));
pm.set(17, 24, S(RAMP.SKIN, SH.DARK));

// ---- ARMS (short gold sleeves, skin forearms, round hands) --------------
pm.litRect(7, 25, 3, 4, RAMP.GOLD); // L sleeve
pm.litRect(7, 29, 3, 6, RAMP.SKIN); // L forearm
pm.sphere(8, 35, 2, RAMP.SKIN); // L hand
pm.litRect(22, 25, 3, 4, RAMP.GOLD); // R sleeve
pm.litRect(22, 29, 3, 6, RAMP.SKIN); // R forearm
pm.sphere(24, 35, 2, RAMP.SKIN); // R hand

// ---- TORSO (gold tee + ringer stripe) -----------------------------------
pm.litRect(10, 25, 12, 8, RAMP.GOLD);
pm.hline(10, 28, 12, S(RAMP.RED, SH.BASE)); // stripe
pm.hline(10, 29, 12, S(RAMP.RED, SH.DARK));

// ---- OVERALLS (denim bib + straps + split legs) -------------------------
pm.litRect(11, 31, 10, 7, RAMP.BLUE); // bib
pm.vline(12, 25, 7, S(RAMP.BLUE, SH.LIT)); // L strap (lit)
pm.vline(19, 25, 7, S(RAMP.BLUE, SH.BASE)); // R strap
pm.set(12, 32, S(RAMP.GOLD, SH.HILITE)); // brass buttons
pm.set(19, 32, S(RAMP.GOLD, SH.HILITE));
pm.litRect(11, 38, 5, 6, RAMP.BLUE); // L leg
pm.litRect(16, 38, 5, 6, RAMP.BLUE); // R leg
pm.vline(15, 39, 5, S(RAMP.BLUE, SH.SHADOW)); // inseam shadow

// ---- SHOES --------------------------------------------------------------
pm.litEllipse(13, 45, 4, 2, RAMP.EARTH);
pm.litEllipse(19, 45, 4, 2, RAMP.EARTH);

// ---- FINISH: the engine's selective lit outline + diagonal AA -----------
pm.finish();

mkdirSync('.shots', { recursive: true });
writeFileSync('.shots/proto_snes_jay.png', pixmapToPng(pm, { scale: 6 }));
console.log('wrote .shots/proto_snes_jay.png (32×48 native, real engine, 6×)');
