import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { OverworldScene } from './scenes/OverworldScene';
import { BattleScene } from './scenes/BattleScene';
import { SpriteLabScene } from './scenes/SpriteLabScene';
import { UIScene } from './scenes/UIScene';
import { INPUT } from './engine/input';
import { GS } from './engine/state';
import { GAME_W, GAME_H } from './spritegen';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#0a0a18',
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    activePointers: 4,
  },
  scene: [BootScene, TitleScene, OverworldScene, BattleScene, SpriteLabScene, UIScene],
});

// One semantic input snapshot per frame, before any scene updates.
game.events.on(Phaser.Core.Events.PRE_STEP, () => INPUT.update());

// dev/debug handles (used by tooling; harmless in production)
declare global {
  interface Window {
    game: Phaser.Game;
    mfInput: typeof INPUT;
    mfGS: typeof GS;
  }
}
window.game = game;
window.mfInput = INPUT;
window.mfGS = GS;

// Dev-only QA driver: deterministic frame pumping + key injection + renderer
// snapshots, used by the speedrun-bot style checks (stripped from prod build).
if (import.meta.env.DEV) {
  let vt = performance.now();
  const w = window as unknown as Record<string, unknown>;
  // async so promise microtasks (cutscene await-chains) drain between frames
  w.pump = async (frames: number): Promise<number> => {
    for (let i = 0; i < frames; i++) {
      // tweens advance on real time; compensate while frame-pumping
      game.scene.getScenes(true).forEach((s) => (s.tweens.timeScale = 14));
      vt += 16.7;
      game.step(vt, 16.7);
      await Promise.resolve();
      await Promise.resolve();
    }
    game.scene.getScenes(true).forEach((s) => (s.tweens.timeScale = 1));
    return game.loop.frame;
  };
  const pump = w.pump as (n: number) => Promise<number>;
  w.key = async (code: string, hold = 4): Promise<string> => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code }));
    await pump(hold);
    window.dispatchEvent(new KeyboardEvent('keyup', { code }));
    await pump(3);
    return `key ${code}`;
  };
  w.holdKey = async (code: string, frames: number): Promise<string> => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code }));
    await pump(frames);
    window.dispatchEvent(new KeyboardEvent('keyup', { code }));
    await pump(2);
    return `held ${code}`;
  };
  w.shot = async (name: string): Promise<string> => {
    game.renderer.snapshot((img) => {
      void fetch('http://localhost:5179/shot', {
        method: 'POST',
        body: JSON.stringify({ name, dataUrl: (img as HTMLImageElement).src }),
      }).catch(() => undefined);
    });
    await pump(3);
    return `shot ${name}`;
  };
}
