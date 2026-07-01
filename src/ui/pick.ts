/**
 * The one list widget + the shared equip confirm (S3 MenuScene, extracted S4
 * so the shops use the SAME code paths instead of copies — Prompt 19/20).
 *
 * pick(): windowed rows, hand cursor, pad/key navigation with wrap, optional
 * second column, dim-disabled rows, and a tap zone per row (§B4: touch AND
 * controller). Resolves the picked index, or -1 on B.
 *
 * confirmEquip(): Prompt 19's "Offense up by N!" stat-delta preview BEFORE
 * the confirm, then GS.equipItem with wielder-tag/hands-full handling. The
 * equip-after-buy prompt (Prompt 20) is this exact function.
 */
import Phaser from 'phaser';
import { GS, type HeroState } from '../engine/state';
import { ITEMS, slotOf, equipSecondaryNote } from '../data/items';
import { equipDelta, equipDefenseDelta, equipLuckDelta, equipArmsDelta } from '../battle/formulas';
import { INPUT } from '../engine/input';
import { AUDIO } from '../engine/audio';
import { Dialogue, makeWindow, everyFrame, DEPTH_UI } from './windows';
import { glyphify } from './text';
import { colorOf, RAMP, px } from '../palette';
import { paginate, ROW_H } from './paginate';
import { s } from '../spritegen/scale';

// re-export the pure page math so callers/tests can reach it through ui/pick too
export { paginate, pageOf, type PageInfo } from './paginate';

export interface PickOpts {
  x: number;
  y: number;
  options: string[];
  /** rows rendered dim; confirming them just bonks */
  disabled?: Set<number>;
  /** column-major columns (EB item lists run in two) */
  cols?: number;
  title?: string;
  /** START also cancels (the command list closes the whole menu) */
  startCancels?: boolean;
  /** S9: optional per-row texture key drawn left of the label (the JOURNAL's
   *  earned-caller phone icons) — rows shift right to make room */
  icons?: Array<string | undefined>;
  /** S15h: fires with the highlighted index on open and on every cursor move
   *  (pad/key AND mouse hover) — the item menu drives its live description
   *  panel from this, so a player reads what a thing IS before acting on it */
  onHighlight?: (index: number) => void;
  /** [PLAYTEST B] hard cap on rows PER COLUMN — past it the list PAGINATES
   *  instead of growing (a long bag can never overflow its box). When omitted
   *  the cap is derived from the room left under the window. */
  maxRows?: number;
  /** [PLAYTEST B] px reserved at the BOTTOM of the screen for a fixed panel
   *  (the iteminfo description box). The auto-fit subtracts it so the list
   *  never grows down under that panel. Default 0. */
  reserveBottom?: number;
}

export const DIM = 0x8890a0;

export function pick(scene: Phaser.Scene, opts: PickOpts): Promise<number> {
  const { options } = opts;
  const cols = Math.max(1, opts.cols ?? 1);
  const rowH = s(ROW_H); // ROW_H is native px (paginate.ts); pitch in runtime px
  const iconPad = opts.icons?.some((i) => i !== undefined) ? s(13) : 0;
  const colW = Math.max(...options.map((o) => o.length)) * s(6) + s(28) + iconPad;
  const titleH = opts.title ? s(22) : 0;
  // x is clamped once the box width is known; the box can never overflow the
  // RIGHT edge. Pin it now so the height auto-fit can read scale.height fairly.
  // opts.x/opts.y are runtime px (callers pass s()-scaled coords).
  const w = colW * cols + s(8);
  const x = Math.max(s(4), Math.min(opts.x, scene.scale.width - w - s(4)));
  // [PLAYTEST B] AUTO-FIT: how many rows physically fit between the list's top
  // and the reserved bottom panel. The list NEVER grows past this — it paginates.
  // Header offset for page markers lives inside the +16 frame padding (the
  // "▼ more" sits in the bottom margin), so the height budget is purely rows.
  const reserveBottom = Math.max(0, opts.reserveBottom ?? 0);
  const ly0 = Math.max(s(4), opts.y) + titleH;
  const availH = scene.scale.height - ly0 - reserveBottom - s(4);
  const fitRows = Math.max(1, Math.floor((availH - s(16)) / rowH));
  const capRows = opts.maxRows !== undefined ? Math.min(opts.maxRows, fitRows) : fitRows;
  const { rowsPerCol, perPage, pages } = paginate(options.length, cols, capRows);

  // the window is sized to the PAGE (rowsPerCol), so a 100-item bag and a
  // 3-item one render the same fixed frame — overflow is structurally impossible.
  const h = rowsPerCol * rowH + s(16);
  const y = Math.max(s(4), Math.min(opts.y, scene.scale.height - h - titleH - reserveBottom - s(4)));
  const ly = y + titleH;

  let page = 0;
  let sel = 0;
  const made: Phaser.GameObjects.GameObject[] = [];

  // --- the title bar (static across pages) ---
  if (opts.title) {
    const tw = opts.title.length * s(6) + s(20);
    made.push(makeWindow(scene, x, y, Math.max(tw, s(60)), s(20)));
    made.push(
      scene.add
        .bitmapText(x + s(10), y + s(6), 'retro', glyphify(opts.title), s(6))
        .setScrollFactor(0)
        .setDepth(DEPTH_UI + 1)
        .setTint(colorOf(px(RAMP.GOLD, 3))),
    );
  }
  made.push(makeWindow(scene, x, ly, w, h));

  // page-relative cell geometry: slot s (0..perPage-1) on the current page is
  // laid out column-major within rowsPerCol, exactly like the old single page.
  const slotPos = (slot: number): { cx: number; cy: number } => {
    const c = Math.floor(slot / rowsPerCol);
    const r = slot % rowsPerCol;
    return { cx: x + s(4) + c * colW, cy: ly + s(9) + r * rowH };
  };
  const slotOfIndex = (i: number): number => i - page * perPage; // page-local slot, or out of range
  const indexOfSlot = (slot: number): number => page * perPage + slot;
  const slotCount = (): number => Math.min(perPage, options.length - page * perPage);

  // --- per-page object pools: rows + icons + a "▲ 1/3 ▼" marker, AND the tap
  //     zones — both rebuilt whenever the page flips so a list can NEVER paint
  //     rows (or fire taps) outside its frame. `finish` is wired once the Promise
  //     opens; the zones close over it. ---
  const pageObjs: Phaser.GameObjects.GameObject[] = [];
  let zones: Phaser.GameObjects.Zone[] = [];
  let finish: (i: number) => void = () => {};
  const hand = scene.add.image(0, 0, 'hand').setScrollFactor(0).setDepth(DEPTH_UI + 2);
  made.push(hand);

  const place = (): void => {
    const { cx, cy } = slotPos(slotOfIndex(sel));
    hand.setPosition(cx + s(8), cy + s(4));
  };

  // tap zones cover only the VISIBLE page's slots — a tap always maps to the row
  // under the finger, and stale zones can't fire for off-page indices.
  const rebuildZones = (): void => {
    zones.forEach((z) => z.destroy());
    zones = [];
    const n = slotCount();
    for (let slot = 0; slot < n; slot++) {
      const i = indexOfSlot(slot);
      const { cx, cy } = slotPos(slot);
      const z = scene.add
        .zone(cx, cy - s(3), colW, rowH)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(DEPTH_UI + 3)
        .setInteractive({ useHandCursor: true });
      z.on('pointerdown', () => {
        sel = i;
        finish(i);
      });
      z.on('pointerover', () => {
        sel = i;
        place();
        opts.onHighlight?.(i);
      });
      zones.push(z);
    }
  };

  const renderPage = (): void => {
    pageObjs.forEach((o) => o.destroy());
    pageObjs.length = 0;
    const n = slotCount();
    for (let slot = 0; slot < n; slot++) {
      const i = indexOfSlot(slot);
      const { cx, cy } = slotPos(slot);
      const icon = opts.icons?.[i];
      if (icon !== undefined) {
        pageObjs.push(
          scene.add.image(cx + s(22), cy + s(3), icon).setScrollFactor(0).setDepth(DEPTH_UI + 1),
        );
      }
      const t = scene.add
        .bitmapText(cx + s(18) + iconPad, cy, 'retro', glyphify(options[i]), s(6))
        .setScrollFactor(0)
        .setDepth(DEPTH_UI + 1);
      if (opts.disabled?.has(i)) t.setTint(DIM);
      pageObjs.push(t);
    }
    // [PLAYTEST B] the page indicator — gold "1/3" plus up/down arrows showing
    // which way there's MORE. Sits in the bottom frame margin, palette-clean.
    if (pages > 1) {
      const label = `${page > 0 ? '▲ ' : ''}${page + 1}/${pages}${page < pages - 1 ? ' ▼' : ''}`;
      pageObjs.push(
        scene.add
          .bitmapText(x + w - label.length * s(6) - s(6), ly + h - s(11), 'retro', label, s(6))
          .setScrollFactor(0)
          .setDepth(DEPTH_UI + 1)
          .setTint(colorOf(px(RAMP.GOLD, 3))),
      );
    }
    rebuildZones();
    place();
  };

  let navAt = 0;
  const navTick = (moving: boolean): boolean => {
    if (!moving) {
      navAt = 0;
      return false;
    }
    const now = scene.time.now;
    if (now > navAt) {
      navAt = now + 180;
      return true;
    }
    return false;
  };

  return new Promise((resolve) => {
    finish = (i: number): void => {
      if (i >= 0 && opts.disabled?.has(i)) {
        AUDIO.sfx('cancel');
        return;
      }
      AUDIO.sfx(i < 0 ? 'cancel' : 'confirm');
      off();
      made.forEach((m) => m.destroy());
      pageObjs.forEach((o) => o.destroy());
      zones.forEach((z) => z.destroy());
      resolve(i);
    };

    renderPage();
    opts.onHighlight?.(sel);

    const off = everyFrame(scene, () => {
      if (INPUT.justPressed('A')) {
        finish(sel);
        return;
      }
      if (INPUT.justPressed('B') || (opts.startCancels && INPUT.justPressed('START'))) {
        finish(-1);
        return;
      }
      const d = INPUT.dir();
      if (!navTick(d.x !== 0 || d.y !== 0)) return;
      // navigation runs in PAGE-LOCAL coordinates so the cursor stays inside the
      // visible window; stepping off the top/bottom of a column flips the page.
      const slot = slotOfIndex(sel);
      const c = Math.floor(slot / rowsPerCol);
      const r = slot % rowsPerCol;
      const onPage = slotCount();
      const colCount = (cc: number): number => Math.min(rowsPerCol, onPage - cc * rowsPerCol);
      if (d.y !== 0) {
        const cc = colCount(c);
        const nr = r + d.y;
        if (nr < 0 || nr >= cc) {
          // past the column edge → adjacent page (wraps at the ends), keep column/row
          if (pages > 1) {
            const np = (((page + (d.y > 0 ? 1 : -1)) % pages) + pages) % pages;
            page = np;
            renderPage();
            const newOnPage = slotCount();
            const newCC = Math.min(rowsPerCol, Math.max(0, newOnPage - c * rowsPerCol));
            const landSlot = c * rowsPerCol + (d.y > 0 ? 0 : Math.max(0, newCC - 1));
            sel = indexOfSlot(Math.min(landSlot, newOnPage - 1));
            place();
            opts.onHighlight?.(sel);
          } else {
            // single page → wrap within the column like before
            sel = indexOfSlot(c * rowsPerCol + ((nr + cc) % cc));
            place();
            opts.onHighlight?.(sel);
          }
          AUDIO.sfx('cursor');
          return;
        }
        sel = indexOfSlot(c * rowsPerCol + nr);
        AUDIO.sfx('cursor');
      } else if (d.x !== 0 && cols > 1) {
        const c2 = (((c + d.x) % cols) + cols) % cols;
        const cc2 = Math.max(1, colCount(c2));
        sel = indexOfSlot(c2 * rowsPerCol + Math.min(r, cc2 - 1));
        AUDIO.sfx('cursor');
      } else {
        return;
      }
      place();
      opts.onHighlight?.(sel);
    });
  });
}

/** Prompt 19: the stat delta previews BEFORE the confirm — menu AND shops.
 *  Weapons preview Offense; 'body' armor previews Defense (S10); 'other'-slot
 *  charms preview Luck (S9); 'arms' gear previews the stat the piece itself
 *  carries — "Speed up by N!" / "Guts up by N!" (S12, THE STARTING FOUR).
 *  One flow, stat-aware per slot. */
export async function confirmEquip(
  scene: Phaser.Scene,
  dlg: Dialogue,
  hero: HeroState,
  itemId: string,
): Promise<void> {
  const item = ITEMS[itemId];
  const slot = slotOf(item);
  const arms = slot === 'arms' ? equipArmsDelta(hero, itemId) : null;
  const d = arms
    ? arms.d
    : slot === 'other'
      ? equipLuckDelta(hero, itemId)
      : slot === 'body'
        ? equipDefenseDelta(hero, itemId)
        : equipDelta(hero, itemId);
  const stat = arms ? arms.stat : slot === 'other' ? 'Luck' : slot === 'body' ? 'Defense' : 'Offense';
  const primary =
    d > 0 ? `${stat} up by ${d}!` : d < 0 ? `${stat} down by ${-d}.` : `No change in ${stat}.`;
  // S17 (ADR-061): the "(also +N X)" rider — secondary bonus + Vibe + resists
  // the piece carries. Empty for the single-stat classics (the 41-item catalog).
  const note = equipSecondaryNote(item);
  const preview = note ? `${primary} ${note}` : primary;
  const sel = await pick(scene, {
    x: s(130),
    y: s(64),
    options: ['Equip it', 'Never mind'],
    title: `${hero.name}: ${preview}`,
  });
  if (sel !== 0) return;
  const result = GS.equipItem(hero.id, itemId);
  if (result === 'ok') {
    AUDIO.sfx('confirm');
    await dlg.say(`* ${hero.name} equipped the ${item.name}. ${preview}`);
  } else if (result === 'hands-full') {
    await dlg.say(`${hero.name}'s hands are full!`);
  } else if (result === 'not-yours') {
    const owner = item.wielder ? GS.heroName(item.wielder) : 'somebody else';
    await dlg.say(`It squirms loose. It clearly belongs to ${owner}.`);
  }
}
