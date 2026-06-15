import Phaser from 'phaser';
import { generateAllTextures } from '../spritegen';
import { applyAuthoredBattleArt, applyAuthoredHeroArt, applyAuthoredWorldArt, preloadAuthoredArt } from '../spritegen/authored';
import { s } from '../spritegen/scale';

/**
 * Boot: run the sprite engine (every texture in the game is generated here,
 * no binary assets), then hand off to Title with the UI overlay running.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload(): void {
    preloadAuthoredArt(this);
  }

  create(): void {
    const W = this.scale.width;
    this.add.image(0, 0, 'title_art').setOrigin(0, 0).setDisplaySize(this.scale.width, this.scale.height);
    this.add.image(W / 2, s(58), 'logo').setScale(0.78);
    // ORDER MATTERS: authored HERO art must land BEFORE generateAllTextures.
    // applyAuthoredHeroArt swaps the 'rex' texture via textures.remove()+addCanvas,
    // which DESTROYS the old Frame objects. generateAllTextures creates the
    // global rex-walk/run/idle animations, each caching a Frame reference. If we
    // generated first, those animations would point at the just-destroyed frames
    // and anims.play() would crash on a null frame (Frame.data nulled by destroy).
    // Applying first means addSheet's exists-guard keeps the authored texture and
    // the animations bind to its live frames; nothing is removed afterward.
    applyAuthoredHeroArt(this);
    generateAllTextures(this);
    applyAuthoredBattleArt(this);
    // World tiles need the procedural 'tiles' sheet to exist first so selected
    // frames can be painted over in-place. Props have no animation references.
    applyAuthoredWorldArt(this);
    this.scene.launch('ui');
    this.time.delayedCall(450, () => this.scene.start('title'));
  }
}
