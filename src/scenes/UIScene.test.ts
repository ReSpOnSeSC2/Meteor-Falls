import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => {
  class SceneStub {}
  const makeNamespace = (): unknown => {
    const fn = function Stub() {};
    return new Proxy(fn, {
      get: (_target, key) => key === 'Scene' ? SceneStub : makeNamespace(),
      apply: () => makeNamespace(),
      construct: () => ({}),
    });
  };
  return { default: makeNamespace() };
});

import { INPUT, type Btn } from '../engine/input';
import {
  UIScene,
  clearTouchControlState,
  releaseTouchPointer,
  touchControlLayout,
  touchControlsEnabled,
  type TouchPointerRole,
} from './UIScene';

describe('touch overlay QA seam', () => {
  it('keeps physical touch authoritative in every build', () => {
    expect(touchControlsEnabled(true, '', false)).toBe(true);
  });

  it('allows an explicit development profile and never leaks it to production', () => {
    expect(touchControlsEnabled(false, '?devTouch=1', true)).toBe(true);
    expect(touchControlsEnabled(false, '?devMap=otterbrook&devState=touchMode', true)).toBe(true);
    expect(touchControlsEnabled(false, '?devTouch=0', true)).toBe(false);
    expect(touchControlsEnabled(false, '?devTouch=1', false)).toBe(false);
  });
});

describe('touch overlay deterministic layout', () => {
  it('applies every safe-area edge to the matching control anchors', () => {
    expect(touchControlLayout(1600, 900, { left: 40, right: 20, top: 8, bottom: 12 })).toEqual({
      dpad: { x: 224, y: 704 },
      a: { x: 1476, y: 664 },
      b: { x: 1356, y: 784 },
      x: { x: 1460, y: 520 },
      y: { x: 1212, y: 768 },
      start: { x: 1460, y: 56 },
    });
  });
});

describe('touch overlay held-state cleanup', () => {
  afterEach(() => {
    INPUT.gamepadConnected = false;
    INPUT.touchDir.x = 0;
    INPUT.touchDir.y = 0;
    INPUT.touchBtns.clear();
  });

  it('releases every held button and pointer role when the overlay is cleared', () => {
    const held = new Set<Btn>(['A', 'Y']);
    const releaseBtn = vi.fn((btn: Btn) => held.delete(btn));
    const roles = new Map<number, TouchPointerRole>([[1, 'dpad'], [2, 'A'], [3, 'Y']]);
    const input = { touchDir: { x: -1, y: 1 }, touchBtns: held, releaseBtn };

    clearTouchControlState(input, roles);

    expect(input.touchDir).toEqual({ x: 0, y: 0 });
    expect([...held]).toEqual([]);
    expect(releaseBtn.mock.calls).toEqual([['A'], ['Y']]);
    expect(roles.size).toBe(0);
  });

  it('routes pointer cancellation through the same direction/button release path', () => {
    const held = new Set<Btn>(['B']);
    const releaseBtn = vi.fn((btn: Btn) => held.delete(btn));
    const roles = new Map<number, TouchPointerRole>([[7, 'dpad'], [8, 'B']]);
    const input = { touchDir: { x: 1, y: -1 }, touchBtns: held, releaseBtn };

    releaseTouchPointer(input, roles, 7);
    expect(input.touchDir).toEqual({ x: 0, y: 0 });
    releaseTouchPointer(input, roles, 8);

    expect(releaseBtn).toHaveBeenCalledWith('B');
    expect([...held]).toEqual([]);
    expect(roles.size).toBe(0);
  });

  it('clears holds on gamepad takeover and cinematic entry', () => {
    const setVisible = vi.fn();
    const scene = new UIScene() as unknown as {
      controls: { setVisible(visible: boolean): void } | null;
      pointerRoles: Map<number, TouchPointerRole>;
      scene: { isActive(key: string): boolean };
      setCinematic(open: boolean): void;
      syncControlVisibility(): void;
    };
    scene.controls = { setVisible };
    scene.scene = { isActive: () => true };

    INPUT.touchDir.x = 1;
    INPUT.touchBtns.add('B');
    scene.pointerRoles.set(1, 'dpad');
    scene.pointerRoles.set(2, 'B');
    INPUT.gamepadConnected = true;
    scene.syncControlVisibility();
    expect(setVisible).toHaveBeenLastCalledWith(false);
    expect(INPUT.touchDir).toEqual({ x: 0, y: 0 });
    expect(INPUT.touchBtns.size).toBe(0);
    expect(scene.pointerRoles.size).toBe(0);

    INPUT.gamepadConnected = false;
    INPUT.touchDir.y = -1;
    INPUT.touchBtns.add('A');
    scene.pointerRoles.set(3, 'A');
    scene.setCinematic(true);
    expect(setVisible).toHaveBeenLastCalledWith(true);
    expect(INPUT.touchDir).toEqual({ x: 0, y: 0 });
    expect(INPUT.touchBtns.size).toBe(0);
    expect(scene.pointerRoles.size).toBe(0);
  });

  it('runs every registered cleanup and releases state on scene shutdown', () => {
    const cleanupA = vi.fn();
    const cleanupB = vi.fn();
    const scene = new UIScene() as unknown as {
      cleanupCallbacks: Array<() => void>;
      controls: unknown;
      pointerRoles: Map<number, TouchPointerRole>;
      shutdownOverlay(): void;
    };
    scene.cleanupCallbacks.push(cleanupA, cleanupB);
    INPUT.touchDir.x = -1;
    INPUT.touchBtns.add('START');
    scene.pointerRoles.set(9, 'START');

    scene.shutdownOverlay();

    expect(cleanupA).toHaveBeenCalledOnce();
    expect(cleanupB).toHaveBeenCalledOnce();
    expect(scene.cleanupCallbacks).toEqual([]);
    expect(scene.controls).toBeNull();
    expect(INPUT.touchDir).toEqual({ x: 0, y: 0 });
    expect(INPUT.touchBtns.size).toBe(0);
    expect(scene.pointerRoles.size).toBe(0);
  });
});
