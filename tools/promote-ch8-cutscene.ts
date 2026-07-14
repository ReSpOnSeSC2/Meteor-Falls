/**
 * Promote an imagegen Chapter 8 cutscene correction into the paired source and
 * runtime locations, then refresh the canonical review contact sheet.
 *
 * Usage:
 *   npx vite-node tools/promote-ch8-cutscene.ts <scene> <generated.png>
 *
 * Image generation intentionally keeps the native 16:9 composition, while the
 * service may return a slightly oversized raster. Promotion performs one
 * deterministic, alpha-aware area resample to the engine's exact 1600x900
 * contract. The same encoded bytes are written to the source and runtime paths.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { decodePng, encodePng, makeImg, type Img } from './imageio';

const SCENES = [
  'riverboat_to_lotus_harbor',
  'lotus_harbor_arrival',
  'spore_forest_scramble',
  'yak_express_to_mt_shu',
  'paper_guardians_false_folds',
  'paper_dragon_reveal',
  'temple_bell_resonance',
] as const;

type Scene = (typeof SCENES)[number];
const BRANCH_SCENES = [
  'paper_dragon_reveal_departed',
  'temple_bell_resonance_departed',
] as const;
type BranchScene = (typeof BRANCH_SCENES)[number];
type PromotableScene = Scene | BranchScene;
const PROMOTABLE_SCENES = [...SCENES, ...BRANCH_SCENES] as const;

const RUNTIME_DIR = join('assets', 'art', 'cutscenes', 'ch8');
const SOURCE_DIR = join('assets', 'art', 'masters', 'world', 'ch8-cutscene-panels');
const CONTACT_PATH = join('assets', 'art', 'review', 'ch8_cutscenes_corrected_contact_small.png');
const OUTPUT_CONTACT_PATH = join('output', 'ch8_cutscenes_corrected_contact.png');

function resample(src: Img, dw: number, dh: number): Img {
  const out = makeImg(dw, dh);
  for (let dy = 0; dy < dh; dy++) {
    const fy0 = (dy / dh) * src.h;
    const fy1 = ((dy + 1) / dh) * src.h;
    const iy0 = Math.floor(fy0);
    const iy1 = Math.ceil(fy1);
    for (let dx = 0; dx < dw; dx++) {
      const fx0 = (dx / dw) * src.w;
      const fx1 = ((dx + 1) / dw) * src.w;
      const ix0 = Math.floor(fx0);
      const ix1 = Math.ceil(fx1);
      let ar = 0;
      let ag = 0;
      let ab = 0;
      let aa = 0;
      let weight = 0;
      for (let sy = iy0; sy < iy1; sy++) {
        const wy = Math.min(fy1, sy + 1) - Math.max(fy0, sy);
        if (wy <= 0) continue;
        for (let sx = ix0; sx < ix1; sx++) {
          const wx = Math.min(fx1, sx + 1) - Math.max(fx0, sx);
          if (wx <= 0) continue;
          const sampleWeight = wx * wy;
          const offset = (sy * src.w + sx) * 4;
          const alpha = src.data[offset + 3];
          ar += src.data[offset] * alpha * sampleWeight;
          ag += src.data[offset + 1] * alpha * sampleWeight;
          ab += src.data[offset + 2] * alpha * sampleWeight;
          aa += alpha * sampleWeight;
          weight += sampleWeight;
        }
      }
      const target = (dy * dw + dx) * 4;
      if (aa > 0 && weight > 0) {
        out.data[target] = Math.round(ar / aa);
        out.data[target + 1] = Math.round(ag / aa);
        out.data[target + 2] = Math.round(ab / aa);
        out.data[target + 3] = Math.round(aa / weight);
      }
    }
  }
  return out;
}

function blitOpaque(dst: Img, src: Img, dx: number, dy: number): void {
  for (let y = 0; y < src.h; y++) {
    for (let x = 0; x < src.w; x++) {
      const source = (y * src.w + x) * 4;
      const target = ((dy + y) * dst.w + dx + x) * 4;
      dst.data[target] = src.data[source];
      dst.data[target + 1] = src.data[source + 1];
      dst.data[target + 2] = src.data[source + 2];
      dst.data[target + 3] = 255;
    }
  }
}

function runtimePath(scene: PromotableScene): string {
  return join(RUNTIME_DIR, `${scene}_4x.png`);
}

function sourcePath(scene: PromotableScene): string {
  return join(SOURCE_DIR, `${scene}-source.png`);
}

function refreshContact(): void {
  // Preserve the repository's hand-authored labels and exact 694x930 review
  // layout; replace only the seven 320x180 panel windows.
  const contact = decodePng(readFileSync(CONTACT_PATH));
  if (contact.w !== 694 || contact.h !== 930) {
    throw new Error(`unexpected Chapter 8 review sheet size ${contact.w}x${contact.h}`);
  }
  const slots = [
    [18, 18], [356, 18],
    [18, 246], [356, 246],
    [18, 474], [356, 474],
    [18, 702],
  ] as const;
  SCENES.forEach((scene, index) => {
    const image = decodePng(readFileSync(runtimePath(scene)));
    if (image.w !== 1600 || image.h !== 900) {
      throw new Error(`${scene} runtime is ${image.w}x${image.h}; expected 1600x900`);
    }
    const thumb = resample(image, 320, 180);
    blitOpaque(contact, thumb, slots[index][0], slots[index][1]);
  });
  const bytes = encodePng(contact);
  writeFileSync(CONTACT_PATH, bytes);
  mkdirSync(dirname(OUTPUT_CONTACT_PATH), { recursive: true });
  writeFileSync(OUTPUT_CONTACT_PATH, bytes);
}

function main(): void {
  const [sceneArg, inputPath] = process.argv.slice(2);
  if (!PROMOTABLE_SCENES.includes(sceneArg as PromotableScene) || !inputPath) {
    throw new Error(`usage: vite-node tools/promote-ch8-cutscene.ts <${PROMOTABLE_SCENES.join('|')}> <generated.png>`);
  }
  const scene = sceneArg as PromotableScene;
  const generated = decodePng(readFileSync(inputPath));
  const ratioError = Math.abs(generated.w / generated.h - 16 / 9);
  if (generated.w < 1600 || generated.h < 900 || ratioError > 0.002) {
    throw new Error(`${inputPath} is ${generated.w}x${generated.h}; need a 16:9 raster at least 1600x900`);
  }
  const promoted = resample(generated, 1600, 900);
  const bytes = encodePng(promoted);
  mkdirSync(RUNTIME_DIR, { recursive: true });
  mkdirSync(SOURCE_DIR, { recursive: true });
  writeFileSync(runtimePath(scene), bytes);
  writeFileSync(sourcePath(scene), bytes);
  refreshContact();
  console.log(`${scene}: ${generated.w}x${generated.h} -> 1600x900 (${bytes.length} bytes)`);
  console.log(`refreshed ${CONTACT_PATH} and ${OUTPUT_CONTACT_PATH}`);
}

main();
