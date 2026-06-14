/**
 * NameEntryScene — GAME_BIBLE Prompt 21. EB-style New Game setup: name the
 * four heroes (prefilled, editable), then the player, favorite food, and the
 * coolest thing. One on-screen letter grid drives all seven entries; touch
 * taps cells directly, pad/keys move the hand cursor. Don't-care fills the
 * field from the canon-flavored lists in src/data/newgame.ts.
 *
 * S10: the grid itself lives in src/ui/lettergrid.ts now (extracted the way
 * S4 extracted pick()/confirmEquip into ui/pick.ts) — ArcadeScene reuses it
 * for high-score initials. Same cells, buttons, wrap math, and SFX, so the
 * recipe below is UNCHANGED.
 *
 * QA recipe (ADR-008, fresh profile): from title — key('KeyZ') opens the menu,
 * key('KeyZ') picks New Game. Then per screen: key('Enter') (START jumps
 * straight to OK) accepts rex/faye/milo/dorin; the player screen starts empty,
 * so key('KeyZ') types the cursor's 'A' first, then key('Enter'); food and
 * thing accept with key('Enter'); the recap asks Yep!/Hold on— and key('KeyZ')
 * confirms. Bots should avoid RANDOM — it randomizes.
 */
import Phaser from 'phaser';
import { AUDIO } from '../engine/audio';
import { GS, type NewGameChoices } from '../engine/state';
import { Dialogue, makeWindow, makeBox, DEPTH_UI } from '../ui/windows';
import { LetterGrid } from '../ui/lettergrid';
import { colorOf, RAMP, px } from '../palette';
import { standFrame } from '../spritegen';
import { NEW_GAME_ENTRIES, randomDontCare } from '../data/newgame';

export class NameEntryScene extends Phaser.Scene {
  private idx = 0;
  private values: string[] = [];
  private grid: LetterGrid | null = null;
  /** one-shot guard so a flurry of B presses can't double-fire the title exit */
  private leaving = false;

  private promptText: Phaser.GameObjects.BitmapText | null = null;
  private valueText: Phaser.GameObjects.BitmapText | null = null;
  private valueBox: Phaser.GameObjects.NineSlice | null = null;
  private portrait: Phaser.GameObjects.Sprite | null = null;
  private recapObjects: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super('nameentry');
  }

  create(): void {
    this.idx = 0;
    this.leaving = false;
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

    // the shared ADR-013 grid (ui/lettergrid.ts since S10)
    this.grid = new LetterGrid(this, {
      cap: this.entry().cap,
      value: this.values[0],
      makeBox,
      onChange: () => this.refreshValue(),
      onOk: (v) => this.submit(v),
      onEmptyBack: () => this.stepBack(),
      dontCare: () => randomDontCare(this.entry()),
    });

    this.add
      .bitmapText(200, 188, 'retro', 'A: pick   B: erase / back   START: done', 6)
      .setOrigin(0.5, 0)
      .setDepth(DEPTH_UI + 1)
      .setTint(colorOf(px(RAMP.NIGHT, 3)));

    this.showEntry(0);
  }

  private entry(): (typeof NEW_GAME_ENTRIES)[number] {
    return NEW_GAME_ENTRIES[this.idx];
  }

  private showEntry(i: number): void {
    this.idx = i;
    const e = this.entry();
    this.grid?.setValue(this.values[i]);
    this.grid?.setCap(e.cap);
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
  }

  private refreshValue(): void {
    this.valueText?.setText((this.grid?.value ?? '').padEnd(this.entry().cap, '_'));
  }

  /** B on an empty field steps back a screen, EB-style; B out of the FIRST
   *  screen returns to the title/opening screen (so New Game is never a trap) */
  private stepBack(): void {
    if (this.idx === 0) {
      this.toTitle();
      return;
    }
    this.values[this.idx] = this.grid?.value ?? '';
    this.showEntry(this.idx - 1);
  }

  /** bail all the way out to the title — the title theme is already playing
   *  under name entry, so it carries through the fade seamlessly */
  private toTitle(): void {
    if (this.leaving) return;
    this.leaving = true;
    this.grid?.setLocked(true);
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('title');
    });
  }

  private submit(trimmed: string): void {
    this.values[this.idx] = trimmed;
    if (this.idx + 1 < NEW_GAME_ENTRIES.length) {
      this.showEntry(this.idx + 1);
    } else {
      void this.recap();
    }
  }

  private async recap(): Promise<void> {
    this.grid?.setLocked(true);
    const byKey = (k: string): string =>
      this.values[NEW_GAME_ENTRIES.findIndex((e) => e.key === k)];
    const lines = [
      `${byKey('rex')}, ${byKey('faye')}, ${byKey('milo')},`,
      `${byKey('pippa')} and ${byKey('dorin')}.`,
      `Player name: ${byKey('player')}`,
      `Favorite food: ${byKey('food')}`,
      `Coolest thing: ${byKey('thing')}`,
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
      this.grid?.setLocked(false);
      this.showEntry(0);
    }
  }

  private finishGame(): void {
    // S15h: read by KEY, not by position — the NEW_GAME_ENTRIES order owns the
    // screen sequence, and heroNames is Record<HeroId> (Pippa makes five now)
    const byKey = (k: string): string =>
      this.values[NEW_GAME_ENTRIES.findIndex((e) => e.key === k)];
    const choices: NewGameChoices = {
      heroNames: {
        rex: byKey('rex'),
        faye: byKey('faye'),
        milo: byKey('milo'),
        pippa: byKey('pippa'),
        dorin: byKey('dorin'),
      },
      playerName: byKey('player'),
      favoriteFood: byKey('food'),
      coolestThing: byKey('thing'),
    };
    GS.applyNewGameChoices(choices);
    AUDIO.stopMusic();
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('overworld', { mapId: GS.data.map, opening: true });
    });
  }
}
