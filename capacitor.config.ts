/**
 * Capacitor 6 shell (GAME_BIBLE §B1 "Mobile shell", Prompt 41 / S8).
 * Capacitor WRAPS the vite build (webDir: dist) — the browser dev loop and
 * the ADR-008 QA driver are untouched; `npm run build && npx cap sync` is the
 * whole handoff. Native behavior (landscape lock, immersive mode, keep-awake,
 * cutout handling) lives in android/ sources; the JS side of the bridge is
 * src/engine/native.ts.
 */
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.meteorfalls.game',
  appName: 'METEOR FALLS',
  webDir: 'dist',
  android: {
    // the game is a single self-contained bundle; nothing loads remotely
    allowMixedContent: false,
  },
};

export default config;
