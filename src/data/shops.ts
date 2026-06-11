/**
 * Chapter 1 shops — GAME_BIBLE Prompt 20 / §A8 Ch.1 stock (S4).
 * Each keeper has exactly one weird obsession (§A11): expiration dates at
 * OTTERBROOK DRUG, the wandering carts at STARMART. Stock ids must exist in
 * ITEMS with a nonzero price (`npm run validate` enforces it, S5).
 * Types are z.infer'd from src/schemas — compile shape ≡ runtime schema.
 */
import type { ShopDef } from '../schemas';

export type { ShopDef } from '../schemas';

export const SHOPS: Record<string, ShopDef> = {
  drugstore: {
    id: 'drugstore',
    name: 'OTTERBROOK DRUG',
    keeperNpc: 'drug_clerk',
    // sugar_bag: §A10 #3's first supply (S9) — expires never, per the keeper
    stock: ['tball_bat', 'corn_dog', 'pbj', 'salt_shaker', 'sugar_bag'],
    greet: 'shop_drug_greet',
    farewell: 'shop_drug_bye',
  },
  starmart: {
    id: 'starmart',
    name: 'STARMART',
    keeperNpc: 'mart_clerk',
    // the pan is a spare — Mia already owns hers (ADR-015); Star Cola is the
    // game's first PP-restore item (§A8 "PP: Star Cola line");
    // lemon_crate: §A10 #3's city lemons (S9) — the twins insist on STARMART's
    stock: ['tball_bat', 'hand_me_down_pan', 'star_cola', 'corn_dog', 'pbj', 'salt_shaker', 'lemon_crate'],
    greet: 'shop_mart_greet',
    farewell: 'shop_mart_bye',
  },
};
