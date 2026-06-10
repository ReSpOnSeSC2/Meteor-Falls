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
    const logo = this.add.image(W / 2, 64, 'logo');
    this.tweens.add({ targets: logo, y: 60, duration: 1800, yoyo: true, repeat: -1, ease: 'sine.inout' });
    this.add
      .bitmapText(W / 2, 110, 'retro', 'An EarthBound-hearted RPG', 6)
      .setOrigin(0.5, 0)
      .setTint(colorOf(px(RAMP.NIGHT, 3)));
    this.pressText = this.add
      .bitmapText(W / 2, 150, 'retro', '- PRESS A -', 6)
      .setOrigin(0.5, 0)
      .setTint(colorOf(px(RAMP.GOLD, 3)));
    this.time.addEvent({
      delay: 450,
      loop: true,
      callback: () => this.pressText?.setVisible(this.menuOpen ? true : !this.pressText.visible),
    });
    this.add
      .bitmapText(W / 2, 212, 'retro', 'v0.1 "FUZZY PICKLES" — touch / pad / keys', 6)
      .setOrigin(0.5, 0)
      .setTint(colorOf(px(RAMP.NIGHT, 3)));

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

  private async openMenu(): Promise<void> {
    if (this.menuOpen) return;
    this.menuOpen = true;
    AUDIO.unlock();
    AUDIO.sfx('confirm');
    const dlg = new Dialogue(this);
    const options = GS.hasSave()
      ? ['Continue', 'New Game', 'Sprite Lab']
      : ['New Game', 'Sprite Lab'];
    const pick = await dlg.ask(options);
    const choice = options[pick];
    if (choice === 'New Game') {
      GS.reset();
      this.startGame('nameentry'); // Prompt 21: name entry, then the 2AM intro
    } else if (choice === 'Continue') {
      GS.load();
      this.startGame('overworld');
    } else {
      this.started = true;
      AUDIO.stopMusic();
      this.scene.start('spritelab');
    }
  }

  private startGame(target: 'nameentry' | 'overworld'): void {
    this.started = true;
    // the title theme keeps playing under name entry; NameEntryScene stops it
    if (target === 'overworld') AUDIO.stopMusic();
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      if (target === 'overworld') this.scene.start('overworld', { mapId: GS.data.map });
      else this.scene.start('nameentry');
    });
  }
}
