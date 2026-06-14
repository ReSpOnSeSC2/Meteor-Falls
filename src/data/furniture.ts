/**
 * THE FURNITURE CATALOG (S18 Movement 30, ADR-070) — §A4.14, the Sims-style base
 * you make yours. Each piece is a footprint + a FUNCTION + a COZINESS value; the
 * home editor (`src/engine/homeeditor.ts`) places/moves/rotates them on a room's
 * tile grid and the layout saves per-home (`homeLayouts`, save v12).
 *
 * Furniture is a typed world CATALOG (like vehicles/properties), not a bag item —
 * it's placed in a room, not carried. Each `sprite` is a real drawn key (the
 * existing home props) or one the editor session draws when it lands; the warm,
 * specific §A4.14 use-cases are the FUNCTION tags below.
 */

export type FurnitureFunction =
  | 'bed'          // free full HP/PP restore for standing heroes
  | 'phone'        // Dad saves here
  | 'fridge'       // one free regional food per region-flag
  | 'footlocker'   // home storage (grows with the property tier)
  | 'mantel'       // trophies + Mr. Click photos render as earned
  | 'record_player'// plays the Homesong stems earned so far
  | 'mailbox'      // Dad's per-chapter postcard; the sisters' drawing
  | 'workbench'    // Milo's Repair overnight (Broken Gizmo → battle item)
  | 'kitchen'      // assemble Family picnic baskets at home
  | 'pet_bed'      // Biscuit the beagle visits (quest #1)
  | 'plant'        // a houseplant you water and it grows
  | 'fish_tank'    // décor that matters
  | 'gnome'        // décor that matters
  | 'seating'      // sofas/chairs — comfort
  | 'table'        // tables — comfort
  | 'lamp'         // light — comfort
  | 'shelf'        // books/keepsakes
  | 'decor';       // rugs, pictures, plain warmth

export type FurnitureTheme = 'cozy' | 'modern' | 'rustic' | 'regal' | 'kid' | 'plain';

export interface FurnitureDef {
  id: string;
  name: string;
  /** a real drawn sprite key (existing home prop, or drawn with the editor) */
  sprite: string;
  /** footprint in TILES (pre-rotation w×h) */
  w: number;
  h: number;
  /** may the editor rotate it 90°? (a rug yes, a fitted counter maybe not) */
  rotatable: boolean;
  fn: FurnitureFunction;
  theme: FurnitureTheme;
  /** coziness points this piece contributes (the resale + rest-buff lever) */
  cozy: number;
  /** price at the HOME GOODS store (§A9 banded) */
  price: number;
  band: string;
}

const F = (d: FurnitureDef): FurnitureDef => d;

export const FURNITURE: Record<string, FurnitureDef> = Object.fromEntries(
  [
    // ── the FUNCTIONAL core (a home is a base) ─────────────────────────────
    F({ id: 'twin_bed', name: 'Twin Bed', sprite: 'bed', w: 2, h: 3, rotatable: true, fn: 'bed', theme: 'cozy', cozy: 8, price: 240, band: 'ch1' }),
    F({ id: 'home_phone', name: 'Your Own Line', sprite: 'phone_table', w: 1, h: 1, rotatable: false, fn: 'phone', theme: 'plain', cozy: 4, price: 120, band: 'ch1' }),
    F({ id: 'fridge', name: 'Humming Fridge', sprite: 'cola_fridge', w: 1, h: 2, rotatable: false, fn: 'fridge', theme: 'modern', cozy: 5, price: 320, band: 'ch1' }),
    F({ id: 'starter_chest', name: 'Footlocker', sprite: 'dresser', w: 2, h: 1, rotatable: true, fn: 'footlocker', theme: 'plain', cozy: 3, price: 180, band: 'ch1' }),
    F({ id: 'mantel', name: 'Trophy Mantel', sprite: 'shelf_b', w: 3, h: 1, rotatable: false, fn: 'mantel', theme: 'cozy', cozy: 7, price: 300, band: 'ch1' }),
    F({ id: 'record_player', name: 'Record Player', sprite: 'tv', w: 1, h: 1, rotatable: false, fn: 'record_player', theme: 'cozy', cozy: 9, price: 420, band: 'ch1' }),
    F({ id: 'mailbox', name: 'Mailbox', sprite: 'mini_cranky_mailbox', w: 1, h: 1, rotatable: false, fn: 'mailbox', theme: 'plain', cozy: 2, price: 90, band: 'ch1' }),
    F({ id: 'workbench', name: "Milo's Workbench", sprite: 'desk', w: 2, h: 1, rotatable: true, fn: 'workbench', theme: 'modern', cozy: 4, price: 360, band: 'ch3' }),
    F({ id: 'kitchen_counter', name: 'Kitchen Counter', sprite: 'counter', w: 3, h: 1, rotatable: true, fn: 'kitchen', theme: 'plain', cozy: 5, price: 280, band: 'ch1' }),
    F({ id: 'pet_bed', name: 'Pet Bed', sprite: 'planter', w: 1, h: 1, rotatable: false, fn: 'pet_bed', theme: 'kid', cozy: 6, price: 110, band: 'ch1' }),
    // ── DÉCOR that matters (the soul; the buff is the wink) ─────────────────
    F({ id: 'houseplant', name: 'Houseplant', sprite: 'plant_pot', w: 1, h: 1, rotatable: false, fn: 'plant', theme: 'cozy', cozy: 5, price: 80, band: 'ch1' }),
    F({ id: 'fish_tank', name: 'Fish Tank', sprite: 'shelf', w: 2, h: 1, rotatable: true, fn: 'fish_tank', theme: 'modern', cozy: 7, price: 500, band: 'ch1' }),
    F({ id: 'lawn_gnome', name: 'Lawn Gnome (indoors)', sprite: 'plant_pot', w: 1, h: 1, rotatable: false, fn: 'gnome', theme: 'kid', cozy: 4, price: 60, band: 'ch1' }),
    F({ id: 'plush_sofa', name: 'Plush Sofa', sprite: 'sofa', w: 3, h: 1, rotatable: true, fn: 'seating', theme: 'cozy', cozy: 8, price: 460, band: 'ch1' }),
    F({ id: 'floor_lamp', name: 'Floor Lamp', sprite: 'floor_lamp', w: 1, h: 1, rotatable: false, fn: 'lamp', theme: 'cozy', cozy: 4, price: 130, band: 'ch1' }),
    F({ id: 'bookshelf', name: 'Bookshelf', sprite: 'bookshelf', w: 2, h: 1, rotatable: true, fn: 'shelf', theme: 'cozy', cozy: 6, price: 300, band: 'ch1' }),
    F({ id: 'tv_set', name: 'TV Set', sprite: 'tv', w: 2, h: 1, rotatable: true, fn: 'decor', theme: 'modern', cozy: 5, price: 380, band: 'ch1' }),
    F({ id: 'cozy_rug', name: 'Cozy Rug', sprite: 'picnic_blanket', w: 3, h: 2, rotatable: true, fn: 'decor', theme: 'cozy', cozy: 6, price: 220, band: 'ch1' }),
  ].map((d) => [d.id, d]),
);

/** the canon function tags (the validator checks every def carries a known one) */
export const FURNITURE_FUNCTIONS: readonly FurnitureFunction[] = [
  'bed', 'phone', 'fridge', 'footlocker', 'mantel', 'record_player', 'mailbox',
  'workbench', 'kitchen', 'pet_bed', 'plant', 'fish_tank', 'gnome', 'seating',
  'table', 'lamp', 'shelf', 'decor',
];
