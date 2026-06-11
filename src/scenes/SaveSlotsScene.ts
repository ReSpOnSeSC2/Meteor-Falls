/**
 * SaveSlotsScene — Title's CONTINUE (S6 / GAME_BIBLE §A4.3 + Prompt 22).
 * Three notebook panels; every line is DERIVED from the slot blob on the
 * spot — name, level, location, playtime, embers live once, in the save.
 * Locations render vars(location, slotBlob).toUpperCase() so "{rex}'S
 * HOUSE" follows each slot's OWN rename (ADR-013 banner pattern). A
 * smudged (corrupt) notebook recovers from Dad's rolling backup with his
 * apology; if even the backup can't vouch, Dad says so and the list stays
 * (ADR-018). The title theme keeps playing underneath, like name entry.
 *
 * QA recipe (ADR-008/013 bots): with any save present, from the title —
 * key('KeyZ') opens the menu, key('KeyZ') picks Continue (top row) → here.
 * ArrowDown/ArrowUp move the hand across the three panels (wraps), KeyZ
 * continues the selected notebook — on a smudged one, drain Dad's apology
 * pages with KeyZ first — and KeyX returns to the title. Touch: tap a
 * panel. Continuing fades to the overworld at the blob's exact map/x/y.
 */
import Phaser from 'phaser';
import { INPUT } from '../engine/input';
import { AUDIO } from '../engine/audio';
import { GS } from '../engine/state';
import { SLOT_IDS, fmtPlaytime, type SlotPeek } from '../engine/saves';
import { DIALOGUE } from '../data/dialogue';
import { Dialogue, makeWindow, vars, DEPTH_UI } from '../ui/windows';
import { DIM } from '../ui/pick';
import { colorOf, RAMP, px } from '../palette';

const PANEL_X = 40;
const PANEL_W = 320;
const PANEL_H = 46;
const panelY = (i: number): number => 40 + i * 54;

export class SaveSlotsScene extends Phaser.Scene {
  private dlg!: Dialogue;
  private peeks: SlotPeek[] = [];
  private hand!: Phaser.GameObjects.Image;
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
    const W = this.scale.width;
    const gold = colorOf(px(RAMP.GOLD, 3));
    const night = colorOf(px(RAMP.NIGHT, 3));
    this.add.rectangle(0, 0, W, this.scale.height, colorOf(px(RAMP.NIGHT, 0))).setOrigin(0);

    const title = "DAD'S NOTEBOOKS";
    makeWindow(this, 8, 8, title.length * 6 + 24, 24);
    this.add
      .bitmapText(20, 16, 'retro', title, 6)
      .setScrollFactor(0)
      .setDepth(DEPTH_UI + 1)
      .setTint(gold);
    this.add
      .bitmapText(W / 2, 206, 'retro', 'A: CONTINUE   B: BACK', 6)
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH_UI + 1)
      .setTint(night);

    this.peeks = GS.slotPeeks();
    this.peeks.forEach((p, i) => this.drawPanel(p, i));

    this.hand = this.add
      .image(PANEL_X - 8, panelY(0) + PANEL_H / 2, 'hand')
      .setScrollFactor(0)
      .setDepth(DEPTH_UI + 2);

    // §B4: every panel is also a tap target
    this.peeks.forEach((_, i) => {
      const z = this.add
        .zone(PANEL_X, panelY(i), PANEL_W, PANEL_H)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(DEPTH_UI + 3)
        .setInteractive({ useHandCursor: true });
      z.on('pointerdown', () => {
        if (this.busy || this.dlg.busy) return;
        this.point(i);
        void this.pickSlot(i);
      });
    });
  }

  private drawPanel(p: SlotPeek, i: number): void {
    const y = panelY(i);
    const gold = colorOf(px(RAMP.GOLD, 3));
    const night = colorOf(px(RAMP.NIGHT, 3));
    makeWindow(this, PANEL_X, y, PANEL_W, PANEL_H);
    const line = (lx: number, ly: number, text: string): Phaser.GameObjects.BitmapText =>
      this.add
        .bitmapText(PANEL_X + lx, y + ly, 'retro', text, 6)
        .setScrollFactor(0)
        .setDepth(DEPTH_UI + 1);
    const head = line(10, 7, `NOTEBOOK ${SLOT_IDS[i]}`);
    if (p === 'empty') {
      head.setTint(DIM);
      line(10, 21, '(a new page. it smells like possibility.)').setTint(DIM);
      return;
    }
    if (p === 'corrupt') {
      head.setTint(gold);
      line(10, 21, '(this page is... smudged. very smudged.)').setTint(DIM);
      return;
    }
    head.setTint(gold);
    line(116, 7, `${p.name}  L${p.level}`);
    // the location follows the slot's OWN renames — vars against ITS blob
    line(10, 19, vars(p.location, p.data).toUpperCase());
    line(10, 31, `TIME ${fmtPlaytime(p.playtimeSec)}    EMBERS ${p.embers}/8`).setTint(night);
  }

  private point(i: number): void {
    this.sel = i;
    this.hand.setY(panelY(i) + PANEL_H / 2);
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
