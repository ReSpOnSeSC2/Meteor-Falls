import Phaser from 'phaser';
import { INPUT } from '../engine/input';
import { AUDIO } from '../engine/audio';
import { GS } from '../engine/state';
import { Dialogue } from '../ui/windows';
import { colorOf } from '../palette';
import { RAMP, px } from '../palette';

export class TitleScene extends Phaser.Scene {
  private pressText: Phaser.GameObjects.BitmapText | null = null;
  private menuOpen = false;
  private started = false;

  constructor() {
    super('title');
  }

  create(): void {
    this.menuOpen = false;
    this.started = false;
    const W = this.scale.width;
    this.add.image(0, 0, 'title_art').setOrigin(0, 0);
    const logo = this.add.image(W / 2, 58, 'logo').setScale(0.78);
    this.tweens.add({ targets: logo, y: 60, duration: 1800, yoyo: true, repeat: -1, ease: 'sine.inout' });
    this.titleText(W / 2, 112, 'A small-town cosmic RPG', colorOf(px(RAMP.CYAN, 3)), 0.85);
    this.pressText = this.add
      .bitmapText(W / 2, 151, 'retro', 'PRESS A / TAP TO BEGIN', 6)
      .setOrigin(0.5, 0)
      .setTint(colorOf(px(RAMP.GOLD, 3)));
    this.time.addEvent({
      delay: 450,
      loop: true,
      callback: () => this.pressText?.setVisible(this.menuOpen ? true : !this.pressText.visible),
    });
    this.titleText(W / 2, 212, 'v0.1 FUZZY PICKLES', colorOf(px(RAMP.CYAN, 2)), 0.7);

    // tap anywhere also works as A on the title
    this.input.on('pointerdown', () => {
      if (!this.menuOpen && !this.started) void this.openMenu();
    });
  }

  override update(): void {
    AUDIO.playMusic('title');
    if (!this.menuOpen && !this.started && INPUT.justPressed('A')) {
      void this.openMenu();
    }
  }

  private titleText(x: number, y: number, text: string, tint: number, alpha = 1): Phaser.GameObjects.BitmapText {
    this.add
      .bitmapText(x + 1, y + 1, 'retro', text, 6)
      .setOrigin(0.5, 0)
      .setTint(colorOf(px(RAMP.NIGHT, 0)))
      .setAlpha(alpha);
    return this.add
      .bitmapText(x, y, 'retro', text, 6)
      .setOrigin(0.5, 0)
      .setTint(tint)
      .setAlpha(alpha);
  }

  private async openMenu(): Promise<void> {
    if (this.menuOpen) return;
    this.menuOpen = true;
    AUDIO.unlock();
    AUDIO.sfx('confirm');
    const dlg = new Dialogue(this);
    const options = GS.anySave()
      ? ['Continue', 'New Game', 'Sprite Lab']
      : ['New Game', 'Sprite Lab'];
    // S13: the resort is COMPLETE AND STANDALONE ahead of Prompt 28 (the
    // Sprite Lab precedent) — dev builds reach it from the title
    if (import.meta.env.DEV) options.push('Costa Estrella (dev)');
    // S15g: the LEVELKIT LAB walks generated drafts live (dev-only, the
    // Sprite Lab precedent — never a player flow)
    if (import.meta.env.DEV) options.push('Levelkit Lab (dev)');
    const pick = await dlg.ask(options);
    const choice = options[pick];
    if (choice === 'New Game') {
      GS.reset();
      this.startGame('nameentry'); // Prompt 21: name entry, then the 2AM intro
    } else if (choice === 'Continue') {
      // S6: the slot scene owns loading now (title theme keeps playing under it)
      this.started = true;
      this.scene.start('saveslots');
    } else if (choice === 'Costa Estrella (dev)') {
      // a fresh dev party at the resort gate (never a saved game's state)
      GS.reset();
      this.started = true;
      AUDIO.stopMusic();
      this.scene.start('overworld', { mapId: 'costa_estrella', x: 13 * 16 + 8, y: 14 * 16, facing: 'up' });
    } else if (choice === 'Levelkit Lab (dev)') {
      this.started = true;
      AUDIO.stopMusic();
      this.scene.start('levelkitlab');
    } else {
      this.started = true;
      AUDIO.stopMusic();
      this.scene.start('spritelab');
    }
  }

  private startGame(target: 'nameentry'): void {
    this.started = true;
    // the title theme keeps playing under name entry; NameEntryScene stops it
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(target);
    });
  }
}
