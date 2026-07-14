import { afterEach, describe, expect, it, vi } from 'vitest';
import { initNativeShell } from './native';

describe('native shell browser fallbacks', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('treats denied durable-storage permission as a best-effort no-op', async () => {
    const persist = vi.fn().mockRejectedValue(new TypeError('Permissions check failed'));
    vi.stubGlobal('navigator', { storage: { persist } });

    expect(() => initNativeShell()).not.toThrow();
    await new Promise<void>((resolve) => queueMicrotask(resolve));

    expect(persist).toHaveBeenCalledOnce();
  });
});
