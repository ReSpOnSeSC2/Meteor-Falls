import { describe, expect, it, vi } from 'vitest';

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

import { touchControlsEnabled } from './UIScene';

describe('touch overlay QA seam', () => {
  it('keeps physical touch authoritative in every build', () => {
    expect(touchControlsEnabled(true, '', false)).toBe(true);
  });

  it('allows an explicit development profile and never leaks it to production', () => {
    expect(touchControlsEnabled(false, '?devTouch=1', true)).toBe(true);
    expect(touchControlsEnabled(false, '?devTouch=0', true)).toBe(false);
    expect(touchControlsEnabled(false, '?devTouch=1', false)).toBe(false);
  });
});
