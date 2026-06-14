import Phaser from 'phaser';
import { generateAllTextures } from '../spritegen';

/**
 * Boot: run the sprite engine (every texture in the game is generated here,
 * no binary assets), then hand off to Title with the UI overlay running.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  create(): void {
    generateAllTextures(this);
    this.scene.launch('ui');
    this.scene.start('title');
  }
}
