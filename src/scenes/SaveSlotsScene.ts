/**
 * SaveSlotsScene — Title's CONTINUE (S6 / GAME_BIBLE §A4.3 + Prompt 22).
 *
 * "DAD'S NOTEBOOKS": the save slots are Dad's three worn field journals, laid
 * out on his desk under the lamp (the authored hi-res `save_slots_bg`). Every
 * line is DERIVED from the slot blob on the spot — name, level, location,
 * playtime, embers live once, in the save — and is written in ink ON the
 * notebook's open page. Locations render vars(location, slotBlob).toUpperCase()
 * so "{rex}'S HOUSE" follows each slot's OWN rename (ADR-013 banner pattern). A
 * smudged (corrupt) notebook recovers from Dad's rolling backup with his
 * apology; if even the backup can't vouch, Dad says so and the list stays
 * (ADR-018). The title theme keeps playing underneath, like name entry.
 *
 * (S?? — the old procedural notebook-window panels were retired for the authored
 * desk art at the user's request: "remove the old sprite-looking style.")
 *
 * QA recipe (ADR-008/013 bots): with any save present, from the title —
 * key('KeyZ') opens the menu, key('KeyZ') picks Continue (top row) → here.
 * ArrowDown/ArrowUp move the gold highlight across the three notebooks (wraps),
 * KeyZ continues the selected notebook — on a smudged one, drain Dad's apology
 * pages with KeyZ first — and KeyX returns to the title. Touch: tap a notebook.
 * Continuing fades to the overworld at the blob's exact map/x/y.
 */
import Phaser from 'phaser';
import { INPUT } from '../engine/input';
import { AUDIO } from '../engine/audio';
import { GS } from '../engine/state';
import { SLOT_IDS, fmtPlaytime, type SlotPeek } from '../engine/saves';
import { DIALOGUE } from '../data/dialogue';
import { Dialogue, vars, DEPTH_UI } from '../ui/windows';
import { colorOf, RAMP, px } from '../palette';
import { s } from '../spritegen/scale';

/** The three open-notebook spreads in the authored desk art, in GAME px (the bg
 *  fills 1600×900). `x/y/w/h` is the notebook's OUTER box (the selection frame);
 *  `cx/cy` is the CREAM page's true centre and `cw` its usable width — both
 *  measured off save_slots_bg (the right page of #2 carries a ribbon, so it's
 *  narrower). Ink is centred on cx/cy and auto-shrunk to cw so nothing spills
 *  onto the binding. */
const BOOKS = [
  { x: 502, y: 40, w: 596, h: 226, cx: 790, cy: 153, cw: 486 },
  { x: 502, y: 320, w: 596, h: 226, cx: 776, cy: 433, cw: 430 },
  { x: 502, y: 596, w: 596, h: 240, cx: 800, cy: 715, cw: 478 },
] as const;

const INK = 0x35230f; // dark espresso — primary ink on the cream page
const INK_SOFT = 0x7a5c39; // faded sepia — secondary lines / empty + smudged

export class SaveSlotsScene extends Phaser.Scene {
  private dlg!: Dialogue;
  private peeks: SlotPeek[] = [];
  private highlight!: Phaser.GameObjects.Graphics;
  private sel = 0;
  private busy = false;
  private navAt = 0;

  constructor() {
    super('saveslots');
  }

  create(): void {
    this.sel = 0;
    this.busy = false;
    this.navAt = 0;
    this.dlg = new Dialogue(this);
    const gold = colorOf(px(RAMP.GOLD, 3));
    this.add.image(0, 0, 'save_slots_bg').setOrigin(0, 0).setDisplaySize(this.scale.width, this.scale.height);

    // title + controls hint sit on the dark wood, above the top notebook and
    // below the bottom one — a thin dark plate keeps them legible on the grain.
    const W = this.scale.width;
    // the desk art leaves only a thin dark margin above the top notebook (cream
    // pages begin ~34px down) — keep the title small so it sits on the wood, not
    // the page. The controls hint has the deeper bottom margin, so it runs larger.
    this.plaque(W / 2, s(1), "DAD'S NOTEBOOKS", s(4), gold);
    this.plaque(W / 2, s(214), 'A: CONTINUE    B: BACK', s(5), colorOf(px(RAMP.PAPER, 3)));

    this.peeks = GS.slotPeeks();
    this.peeks.forEach((p, i) => this.drawNotebook(p, i));

    // the selection mark: a soft gold frame around the chosen notebook, pulsing.
    this.highlight = this.add.graphics().setScrollFactor(0).setDepth(DEPTH_UI - 1);
    this.tweens.add({ targets: this.highlight, alpha: { from: 0.95, to: 0.4 }, duration: 700, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    this.point(0);

    // §B4: every notebook is also a tap target
    this.peeks.forEach((_, i) => {
      const b = BOOKS[i];
      const z = this.add
        .zone(b.x, b.y, b.w, b.h)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(DEPTH_UI)
        .setInteractive({ useHandCursor: true });
      z.on('pointerdown', () => {
        if (this.busy || this.dlg.busy) return;
        this.point(i);
        void this.pickSlot(i);
      });
    });
  }

  /** a centered label on a small dark plate so light text reads on the wood. */
  private plaque(cx: number, y: number, text: string, size: number, tint: number): void {
    const t = this.add
      .bitmapText(cx, y, 'retro', text, size)
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH_UI + 1)
      .setTint(tint);
    this.add
      .rectangle(cx, y + t.height / 2, t.width + s(12), t.height + s(6), 0x000000, 0.32)
      .setScrollFactor(0)
      .setDepth(DEPTH_UI);
    t.setDepth(DEPTH_UI + 1); // keep text above its plate
  }

  private drawNotebook(p: SlotPeek, i: number): void {
    const b = BOOKS[i];
    // a line of ink centred on the cream page; if it would run wider than the
    // page it is scaled down to fit, so a long name/location stays on the paper
    // instead of spilling onto the binding.
    const ink = (dy: number, text: string, size: number, tint: number): void => {
      const t = this.add
        .bitmapText(b.cx, b.cy + dy, 'retro', text, size)
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0)
        .setDepth(DEPTH_UI)
        .setTint(tint);
      if (t.width > b.cw) t.setScale(b.cw / t.width);
    };

    if (p === 'empty') {
      ink(-s(5), `NOTEBOOK ${SLOT_IDS[i]}`, s(5), INK_SOFT);
      ink(s(6), '( a new, blank page )', s(6), INK_SOFT);
      return;
    }
    if (p === 'corrupt') {
      ink(-s(5), `NOTEBOOK ${SLOT_IDS[i]}`, s(5), INK);
      ink(s(6), '( this page is smudged )', s(6), INK_SOFT);
      return;
    }
    // a full notebook: name + level, then where they are, then how far they've come
    ink(-s(12), `${p.name.toUpperCase()}    LV ${p.level}`, s(7), INK);
    // the location follows the slot's OWN renames — vars against ITS blob
    ink(0, vars(p.location, p.data).toUpperCase(), s(6), INK);
    ink(s(12), `${fmtPlaytime(p.playtimeSec)}    EMBERS ${p.embers}/8`, s(6), INK_SOFT);
  }

  private point(i: number): void {
    this.sel = i;
    const b = BOOKS[i];
    const gold = colorOf(px(RAMP.GOLD, 3));
    const pad = s(6);
    this.highlight
      .clear()
      .lineStyle(s(1.5), gold, 1)
      .strokeRoundedRect(b.x - pad, b.y - pad, b.w + pad * 2, b.h + pad * 2, s(5));
  }

  override update(): void {
    AUDIO.playMusic('title'); // idempotent — seamless under the title theme
    if (this.busy || this.dlg.busy) return;
    if (INPUT.justPressed('B')) {
      this.busy = true;
      AUDIO.sfx('cancel');
      this.scene.start('title');
      return;
    }
    if (INPUT.justPressed('A')) {
      void this.pickSlot(this.sel);
      return;
    }
    const d = INPUT.dir();
    if (d.y === 0) {
      this.navAt = 0;
      return;
    }
    const now = this.time.now;
    if (now <= this.navAt) return;
    this.navAt = now + 180;
    AUDIO.sfx('cursor');
    this.point((this.sel + (d.y > 0 ? 1 : this.peeks.length - 1)) % this.peeks.length);
  }

  private async pickSlot(i: number): Promise<void> {
    const p = this.peeks[i];
    if (p === 'empty' || p === undefined) {
      AUDIO.sfx('cancel'); // nothing written there yet
      return;
    }
    this.busy = true;
    const kind = GS.continueFrom(SLOT_IDS[i]);
    if (kind === 'lost' || kind === 'empty') {
      // corrupt slot whose backup couldn't vouch for it — Dad owns up
      AUDIO.sfx('phone');
      await this.dlg.say(...DIALOGUE.dad_backup_lost);
      this.busy = false;
      return;
    }
    if (kind === 'recovered') {
      AUDIO.sfx('phone');
      await this.dlg.say(...DIALOGUE.dad_backup_apology);
    } else {
      AUDIO.sfx('confirm');
    }
    AUDIO.stopMusic();
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('overworld', { mapId: GS.data.map });
    });
  }
}
