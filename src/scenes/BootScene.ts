import Phaser from 'phaser';
import { generateAllTextures } from '../spritegen';
import { applyAuthoredArt, preloadAuthoredArt } from '../spritegen/authored';

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
    // ORDER MATTERS: authored art must land BEFORE generateAllTextures.
    // applyAuthoredArt swaps the 'rex' texture via textures.remove()+addCanvas,
    // which DESTROYS the old Frame objects. generateAllTextures creates the
    // global rex-walk/run/idle animations, each caching a Frame reference. If we
    // generated first, those animations would point at the just-destroyed frames
    // and anims.play() would crash on a null frame (Frame.data nulled by destroy).
    // Applying first means addSheet's exists-guard keeps the authored texture and
    // the animations bind to its live frames; nothing is removed afterward.
    applyAuthoredArt(this);
    generateAllTextures(this);
    this.scene.launch('ui');
    this.scene.start('title');
  }
}
