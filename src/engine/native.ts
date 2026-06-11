/**
 * S8 — the Capacitor seam (Bible Prompt 41, ADR-025). One module owns every
 * native-shell concern so the rest of the game stays platform-blind:
 *
 *  - Android back button = B/cancel, latched through INPUT.pressBtn so it
 *    rides the ADR-024 queue like any tap.
 *  - App state -> audio focus: calls and app switches park the ADR-006
 *    WebAudio synth even when the WebView never flips document.hidden.
 *  - Durable saves: navigator.storage.persist() flags the origin's storage
 *    (the ADR-018 localStorage slot family) as not-evictable. The §B1
 *    IndexedDB driver remains the durability follow-up — SaveStorage is the
 *    seam it lands behind.
 *  - Safe-area insets: env(safe-area-inset-*) measured via a probe element,
 *    mapped into GAME pixels relative to the letterboxed canvas, consumed by
 *    UIScene to keep the touch overlay out of camera cutouts.
 *
 * In the plain browser every hook degrades to a no-op (insets read 0), which
 * is what keeps the vite dev loop and the ADR-008 QA driver untouched.
 */
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { INPUT } from './input';
import { AUDIO } from './audio';

export const IS_NATIVE = Capacitor.isNativePlatform();

/** css-px insets measured from env(safe-area-inset-*) via a probe element */
interface CssInsets {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

let probe: HTMLDivElement | null = null;

function cssInsets(): CssInsets {
  if (typeof document === 'undefined') return { left: 0, right: 0, top: 0, bottom: 0 };
  if (!probe) {
    probe = document.createElement('div');
    probe.style.cssText =
      'position:fixed;pointer-events:none;visibility:hidden;' +
      'left:env(safe-area-inset-left,0px);right:env(safe-area-inset-right,0px);' +
      'top:env(safe-area-inset-top,0px);bottom:env(safe-area-inset-bottom,0px);';
    document.body.appendChild(probe);
  }
  const r = probe.getBoundingClientRect();
  return {
    left: Math.max(0, r.left),
    right: Math.max(0, window.innerWidth - r.right),
    top: Math.max(0, r.top),
    bottom: Math.max(0, window.innerHeight - r.bottom),
  };
}

/**
 * Safe-area insets in GAME pixels, per canvas side. FIT scaling letterboxes
 * the canvas, and bars often swallow the cutout entirely — only the overlap
 * that actually reaches INTO the canvas comes back non-zero, so the overlay
 * never over-corrects on phones whose notch sits in the letterbox.
 */
export function gameInsets(canvas: HTMLCanvasElement, gameW: number): CssInsets {
  const ins = cssInsets();
  if (ins.left === 0 && ins.right === 0 && ins.top === 0 && ins.bottom === 0) {
    return ins;
  }
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0) return { left: 0, right: 0, top: 0, bottom: 0 };
  const scale = rect.width / gameW;
  return {
    left: Math.max(0, ins.left - rect.left) / scale,
    right: Math.max(0, rect.right - (window.innerWidth - ins.right)) / scale,
    top: Math.max(0, ins.top - rect.top) / scale,
    bottom: Math.max(0, rect.bottom - (window.innerHeight - ins.bottom)) / scale,
  };
}

/** boot-time hookup; called once from main.ts */
export function initNativeShell(): void {
  // durable storage: best-effort, browser and WebView alike (ADR-018 family)
  try {
    if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
      void navigator.storage.persist().then((granted) => {
        if (import.meta.env.DEV) console.info(`[native] storage.persist() -> ${granted}`);
      });
    }
  } catch {
    /* storage manager unavailable — play on */
  }

  if (!IS_NATIVE) return;

  // hardware back = B (cancel): a one-frame tap through the ADR-024 latch
  void App.addListener('backButton', () => INPUT.tapBtn('B'));

  // calls / app switches: park the synth, revive on return (ADR-006 unlock
  // already ran on the first touch, so resume needs no fresh gesture)
  void App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) AUDIO.focusGained();
    else AUDIO.focusLost();
  });
}
