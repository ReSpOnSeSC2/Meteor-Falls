import Phaser from 'phaser';
import { generateAllTextures, ensureForgedFaces } from '../spritegen';
import { FORGED_ENEMIES } from '../levelkit/forge/registry';

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
    // §A7 Ch.3 (ADR-095): register the forged enemy faces at BOOT, not only in the
    // Levelkit Lab — the landed Ch.3 roster points its sprites at the composed
    // `forgeface_*`/`forgemini_*` keys, so they must exist in real battles. The call
    // is idempotent (addPixmap guards on textures.exists) and skips any draft with no
    // face pick, so today it only draws the picked Ch.3 faces (forward-safe for ch4+).
    ensureForgedFaces(this, Object.values(FORGED_ENEMIES));
    this.scene.launch('ui');
    this.scene.start('title');
  }
}
