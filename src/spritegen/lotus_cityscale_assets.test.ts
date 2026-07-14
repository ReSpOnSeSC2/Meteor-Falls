import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { decodePng } from '../../tools/imageio';
import { AUTHORED_LOTUS_HARBOR_CITY_SCALE_FACADES } from './authored';

const ASSETS = [
  ['grand_market', 1200, '64023f9119e0668eb833b658d5f47444bf20b4792582982c5c1f7276d0726c16'],
  ['harbor_office', 880, 'e244d8a314f2fd4c405f999e29c71164de7fcb407bf0eae00fd72b3dbc44d7d3'],
  ['lantern_shop', 880, '93c72ace40d198334fd796a18a9a37dc4ec04ed4a818c28efb1b1bab601e6581'],
  ['pagoda', 1200, '1379e45587ff2ec63d410613fb20b139446a50d8f067cc870b2e43d00ed9b5c8'],
  ['row_house', 880, 'f8a98e6fde98907e0d5cd324746dda5015337f362620582657dd65dd6193eb7a'],
  ['tea_house', 880, 'dd886c0503436a806fdcc2770bb9624ccedab703edfa7244391d7a405e7ba8cf'],
  ['temple', 1200, '130cca340c28206e5e7e03d63e9998819d7f8d21d276168d8a2c13439017670b'],
  ['theater', 1200, 'c0dc36d4f9e0b68bacffb41ed8d434085c8f4c673fc6276a57deb59e5d9d4de6'],
] as const;

const runtimeKey = (id: string): string => `bldg_cityscale_lotus_harbor_lotus_harbor_${id}`;

describe('Lotus Harbor authored city-scale facade assets', () => {
  it('pins the closed-world runtime order and retains every image-generation master', () => {
    expect(AUTHORED_LOTUS_HARBOR_CITY_SCALE_FACADES).toEqual(ASSETS.map(([id]) => runtimeKey(id)));
    for (const [id] of ASSETS) {
      expect(existsSync(resolve('assets/art/masters/generated', `lh_cityscale_${id}_src.png`))).toBe(true);
    }
  });

  it.each(ASSETS)('%s is the reviewed exact-size deterministic export', (id, height, expectedHash) => {
    const bytes = readFileSync(resolve('assets/art/world/facades', `${runtimeKey(id)}.png`));
    const png = decodePng(bytes);
    expect([png.w, png.h]).toEqual([264, height]);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(expectedHash);

    let transparent = 0;
    let opaque = 0;
    let opaqueMagenta = 0;
    for (let i = 0; i < png.data.length; i += 4) {
      const alpha = png.data[i + 3];
      if (alpha <= 16) transparent++;
      if (alpha >= 240) {
        opaque++;
        if (Math.min(png.data[i], png.data[i + 2]) - png.data[i + 1] > 130) opaqueMagenta++;
      }
    }
    expect(transparent).toBeGreaterThan(0);
    expect(opaque).toBeGreaterThan(10_000);
    expect(opaqueMagenta).toBe(0);
  });
});
