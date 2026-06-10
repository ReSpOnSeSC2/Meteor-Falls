/**
 * NameEntryScene — GAME_BIBLE Prompt 21. EB-style New Game setup: name the
 * four heroes (prefilled, editable), then the player, favorite food, and the
 * coolest thing. One on-screen letter grid drives all seven entries; touch
 * taps cells directly, pad/keys move the hand cursor. Don't-care fills the
 * field from the canon-flavored lists in src/data/newgame.ts.
 *
 * QA recipe (ADR-008, fresh profile): from title — key('KeyZ') opens the menu,
 * key('KeyZ') picks New Game. Then per screen: key('Enter') (START jumps
 * straight to OK) accepts rex/faye/milo/dorin; the player screen starts empty,
 * so key('KeyZ') types the cursor's 'A' first, then key('Enter'); food and
 * thing accept with key('Enter'); the recap asks Yep!/Hold on— and key('KeyZ')
 * confirms. Bots should avoid DON'T CARE — it randomizes.
 */
import Phaser from 'phaser';
import { INPUT } from '../engine/input';
import { AUDIO } from '../engine/audio';
import { GS, type NewGameChoices } from '../engine/state';
import { Dialogue, makeWindow, makeBox, DEPTH_UI } from '../ui/windows';
import { colorOf, RAMP, px } from '../palette';
import { standFrame } from '../spritegen';
import { GRID_ROWS, NEW_GAME_ENTRIES, randomDontCare } from '../data/newgame';

const GRID_X = 96; // left edge of the 13-column grid
const GRID_Y = 72;
const CELL_W = 16;
const CELL_H = 15;
const BTN_Y = 152;
const BTN_H = 16;

type BtnAct = 'space' | 'back' | 'dontcare' | 'ok';
interface ButtonDef {
  label: string;
  x: number;
  w: number;
  act: BtnAct;
}
const BUTTONS: ButtonDef[] = [
  { label: 'SPACE', x: 76, w: 56, act: 'space' },
  { label: 'BACK', x: 138, w: 50, act: 'back' },
  { label: "DON'T CARE", x: 194, w: 86, act: 'dontcare' },
  { label: 'OK', x: 286, w: 38, act: 'ok' },
];
/** grid rows 0..4 are letters; this virtual row is the button bar */
const BTN_ROW = GRID_ROWS.length;

export class NameEntryScene extends Phaser.Scene {
  private idx = 0;
  private value = '';
  private values: string[] = [];
  private row = 0;
  private col = 0;
  private locked = false;
  private navHeld = 0;

  private promptText: Phaser.GameObjects.BitmapText | null = null;
  private valueText: Phaser.GameObjects.BitmapText | null = null;
  private valueBox: Phaser.GameObjects.NineSlice | null = null;
  private portrait: Phaser.GameObjects.Sprite | null = null;
  private hand: Phaser.GameObjects.Image | null = null;
  private recapObjects: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super('nameentry');
  }

  create(): void {
    this.idx = 0;
    this.locked = false;
    this.row = 0;
    this.col = 0;
    this.values = NEW_GAME_ENTRIES.map((e) => e.prefill);
    this.recapObjects = [];
    AUDIO.playMusic('title');
    this.cameras.main.fadeIn(300, 0, 0, 0);

    makeWindow(this, 56, 4, 288, 178);

    this.promptText = this.add
      .bitmapText(200, 12, 'retro', '', 6)
      .setOrigin(0.5, 0)
      .setDepth(DEPTH_UI + 1)
      .setMaxWidth(264)
      .setCenterAlign();

    this.valueBox = makeBox(this, 150, 32, 100, 20);
    this.valueText = this.add
      .bitmapText(158, 39, 'retro', '', 6)
      .setDepth(DEPTH_UI + 1)
      .setTint(colorOf(px(RAMP.INK, 0)));
    this.portrait = this.add.sprite(132, 42, 'rex', standFrame('down')).setDepth(DEPTH_UI + 1);

    // letter grid + tap zones
    GRID_ROWS.forEach((rowStr, r) => {
      [...rowStr].forEach((ch, c) => {
        this.add
          .bitmapText(GRID_X + c * CELL_W + 8, GRID_Y + r * CELL_H + 4, 'retro', ch, 6)
          .setOrigin(0.5, 0)
          .setDepth(DEPTH_UI + 1);
        this.add
          .zone(GRID_X + c * CELL_W, GRID_Y + r * CELL_H, CELL_W, CELL_H)
          .setOrigin(0, 0)
          .setInteractive()
          .on('pointerdown', () => {
            this.row = r;
            this.col = c;
            this.placeHand();
            this.activate();
          });
      });
    });

    // button bar
    BUTTONS.forEach((b, i) => {
      makeBox(this, b.x, BTN_Y, b.w, BTN_H);
      this.add
        .bitmapText(b.x + b.w / 2 + 4, BTN_Y + 5, 'retro', b.label, 6)
        .setOrigin(0.5, 0)
        .setDepth(DEPTH_UI + 1)
        .setTint(colorOf(px(RAMP.INK, 0)));
      this.add
        .zone(b.x, BTN_Y, b.w, BTN_H)
        .setOrigin(0, 0)
        .setInteractive()
        .on('pointerdown', () => {
          this.row = BTN_ROW;
          this.col = i;
          this.placeHand();
          this.activate();
        });
    });

    this.add
      .bitmapText(200, 188, 'retro', 'A: pick   B: erase   START: done', 6)
      .setOrigin(0.5, 0)
      .setDepth(DEPTH_UI + 1)
      .setTint(colorOf(px(RAMP.NIGHT, 3)));

    this.hand = this.add.image(0, 0, 'hand').setDepth(DEPTH_UI + 2);
    this.showEntry(0);
  }

  private entry(): (typeof NEW_GAME_ENTRIES)[number] {
    return NEW_GAME_ENTRIES[this.idx];
  }

  private showEntry(i: number): void {
    this.idx = i;
    const e = this.entry();
    this.value = this.values[i];
    this.promptText?.setText(e.prompt);
    const w = e.cap * 6 + 16;
    const x = Math.round(200 - w / 2 + (e.sprite ? 14 : 0));
    this.valueBox?.setPosition(x, 32);
    this.valueBox?.setSize(w, 20);
    this.valueText?.setPosition(x + 8, 39);
    if (e.sprite) {
      this.portrait?.setTexture(e.sprite, standFrame('down'));
      this.portrait?.setPosition(x - 18, 42).setVisible(true);
    } else {
      this.portrait?.setVisible(false);
    }
    this.refreshValue();
    this.placeHand();
  }

  private refreshValue(): void {
    this.valueText?.setText(this.value.padEnd(this.entry().cap, '_'));
  }

  private placeHand(): void {
    if (!this.hand) return;
    if (this.row === BTN_ROW) {
      const b = BUTTONS[this.col];
      this.hand.setPosition(b.x + 5, BTN_Y + 8);
    } else {
      this.hand.setPosition(GRID_X + this.col * CELL_W - 2, GRID_Y + this.row * CELL_H + 7);
    }
  }

  override update(): void {
    if (this.locked) return;
    const d = INPUT.dir();
    if (this.navTick(d.x !== 0 || d.y !== 0)) this.moveCursor(d.x, d.y);
    if (INPUT.justPressed('A')) this.activate();
    else if (INPUT.justPressed('B')) this.erase();
    else if (INPUT.justPressed('START')) this.submit();
  }

  private navTick(active: boolean): boolean {
    if (!active) {
      this.navHeld = 0;
      return false;
    }
    const now = this.time.now;
    if (now > this.navHeld) {
      this.navHeld = now + 160;
      return true;
    }
    return false;
  }

  private moveCursor(dx: number, dy: number): void {
    const rowLen = (r: number): number => (r === BTN_ROW ? BUTTONS.length : GRID_ROWS[r].length);
    if (dx !== 0) {
      const len = rowLen(this.row);
      this.col = (this.col + dx + len) % len;
    }
    if (dy !== 0) {
      const fromButtons = this.row === BTN_ROW;
      this.row = (this.row + dy + BTN_ROW + 1) % (BTN_ROW + 1);
      const toButtons = this.row === BTN_ROW;
      // crossing between 13-wide letter rows and the 4-wide button bar:
      // keep the cursor roughly under the thumb
      if (toButtons && !fromButtons) {
        this.col = Math.min(BUTTONS.length - 1, Math.floor((this.col / 13) * BUTTONS.length));
      } else if (fromButtons && !toButtons) {
        this.col = Math.min(12, Math.round((this.col / (BUTTONS.length - 1)) * 12));
      }
    }
    AUDIO.sfx('cursor');
    this.placeHand();
  }

  private activate(): void {
    if (this.locked) return;
    if (this.row === BTN_ROW) {
      const act = BUTTONS[this.col].act;
      if (act === 'space') this.type(' ');
      else if (act === 'back') this.erase();
      else if (act === 'dontcare') {
        this.value = randomDontCare(this.entry());
        AUDIO.sfx('confirm');
        this.refreshValue();
      } else this.submit();
      return;
    }
    this.type(GRID_ROWS[this.row][this.col]);
  }

  private type(ch: string): void {
    if (this.value.length >= this.entry().cap) {
      AUDIO.sfx('cancel');
      return;
    }
    this.value += ch;
    AUDIO.sfx('cursor');
    this.refreshValue();
  }

  private erase(): void {
    if (this.value.length > 0) {
      this.value = this.value.slice(0, -1);
      AUDIO.sfx('cancel');
      this.refreshValue();
      return;
    }
    // B on an empty field steps back a screen, EB-style
    if (this.idx > 0) {
      this.values[this.idx] = this.value;
      AUDIO.sfx('cancel');
      this.showEntry(this.idx - 1);
    } else {
      AUDIO.sfx('cancel');
    }
  }

  private submit(): void {
    const trimmed = this.value.trim();
    if (trimmed.length === 0) {
      AUDIO.sfx('cancel');
      return;
    }
    this.values[this.idx] = trimmed;
    AUDIO.sfx('confirm');
    if (this.idx + 1 < NEW_GAME_ENTRIES.length) {
      this.showEntry(this.idx + 1);
    } else {
      void this.recap();
    }
  }

  private async recap(): Promise<void> {
    this.locked = true;
    const byKey = (k: string): string =>
      this.values[NEW_GAME_ENTRIES.findIndex((e) => e.key === k)];
    const lines = [
      `${byKey('rex')}, ${byKey('faye')},`,
      `${byKey('milo')} and ${byKey('dorin')}.`,
      `You: ${byKey('player')}`,
      `Food: ${byKey('food')}`,
      `Coolest: ${byKey('thing')}`,
      '',
      'All set?',
    ];
    const win = makeWindow(this, 104, 26, 192, 124);
    win.setDepth(DEPTH_UI + 4);
    const texts = lines.map((l, i) =>
      this.add
        .bitmapText(116, 36 + i * 14, 'retro', l, 6)
        .setDepth(DEPTH_UI + 5),
    );
    this.recapObjects = [win, ...texts];
    const dlg = new Dialogue(this);
    const pick = await dlg.ask(['Yep!', 'Hold on—'], { cancelIndex: 1 });
    if (pick === 0) {
      this.finishGame();
    } else {
      this.recapObjects.forEach((o) => o.destroy());
      this.recapObjects = [];
      this.locked = false;
      this.showEntry(0);
    }
  }

  private finishGame(): void {
    const choices: NewGameChoices = {
      heroNames: {
        rex: this.values[0],
        faye: this.values[1],
        milo: this.values[2],
        dorin: this.values[3],
      },
      playerName: this.values[4],
      favoriteFood: this.values[5],
      coolestThing: this.values[6],
    };
    GS.applyNewGameChoices(choices);
    AUDIO.stopMusic();
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('overworld', { mapId: GS.data.map });
    });
  }
}
