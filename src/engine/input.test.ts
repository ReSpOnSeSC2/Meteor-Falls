import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type EventHandler = (event: unknown) => void;

class FakeWindow {
  private readonly listeners = new Map<string, Set<EventHandler>>();

  addEventListener(type: string, handler: EventHandler): void {
    const handlers = this.listeners.get(type) ?? new Set<EventHandler>();
    handlers.add(handler);
    this.listeners.set(type, handlers);
  }

  removeEventListener(type: string, handler: EventHandler): void {
    this.listeners.get(type)?.delete(handler);
  }

  emit(type: string, event: unknown): void {
    for (const handler of this.listeners.get(type) ?? []) handler(event);
  }
}

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  clear(): void {
    this.values.clear();
  }
}

function makePad(index: number, id: string, pressed: number[] = []): Gamepad {
  const down = new Set(pressed);
  return {
    axes: [0, 0],
    buttons: Array.from({ length: 16 }, (_, button) => ({
      pressed: down.has(button),
      touched: down.has(button),
      value: down.has(button) ? 1 : 0,
    })),
    connected: true,
    id,
    index,
    mapping: 'standard',
    timestamp: 0,
  } as unknown as Gamepad;
}

const ACTIONS = ['A', 'B', 'X', 'Y', 'START'] as const;

function expectCompleteUnique(source: Record<string, readonly unknown[]>): void {
  const values: unknown[] = [];
  for (const action of ACTIONS) {
    expect(source[action].length, `${action} must stay bound`).toBeGreaterThan(0);
    values.push(...source[action]);
  }
  expect(new Set(values).size).toBe(values.length);
}

describe('InputBus controller reconciliation', () => {
  let fakeWindow: FakeWindow;
  let storage: MemoryStorage;
  let pads: Array<Gamepad | null>;

  async function freshRuntime(): Promise<typeof import('./input')> {
    vi.resetModules();
    fakeWindow = new FakeWindow();
    vi.stubGlobal('window', fakeWindow);
    vi.stubGlobal('localStorage', storage);
    vi.stubGlobal('navigator', { getGamepads: () => pads });
    return import('./input');
  }

  beforeEach(() => {
    storage = new MemoryStorage();
    pads = [];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('discovers a pad present before reload and replays it to late listeners', async () => {
    pads = [makePad(0, 'Pad already here', [0])];
    const { INPUT } = await freshRuntime();
    const events: Array<[boolean, string]> = [];
    const unsubscribe = INPUT.onGamepad((connected, id) => events.push([connected, id]));

    expect(INPUT.gamepadConnected).toBe(true);
    expect(events).toEqual([[true, 'Pad already here']]);
    INPUT.update();
    expect(INPUT.held('A')).toBe(true);

    unsubscribe();
    pads = [];
    INPUT.update();
    expect(INPUT.gamepadConnected).toBe(false);
    expect(events).toHaveLength(1);
  });

  it('repairs a missed connect event and falls back when the active pad disconnects', async () => {
    const { INPUT } = await freshRuntime();
    const events: Array<[boolean, string]> = [];
    INPUT.onGamepad((connected, id) => events.push([connected, id]));

    const pad0 = makePad(0, 'First pad', [1]);
    const pad1 = makePad(1, 'Second pad', [0]);
    pads = [null, pad1];
    INPUT.update(); // no gamepadconnected event
    expect(INPUT.gamepadConnected).toBe(true);
    expect(INPUT.held('A')).toBe(true);
    expect(events).toEqual([[true, 'Second pad']]);

    pads = [pad0, pad1];
    fakeWindow.emit('gamepadconnected', { gamepad: pad1 });
    expect(events).toHaveLength(1); // it was already the active selection

    pads = [pad0, null];
    fakeWindow.emit('gamepaddisconnected', { gamepad: pad1 });
    expect(INPUT.gamepadConnected).toBe(true);
    expect(events[events.length - 1]).toEqual([true, 'First pad']);
    INPUT.update();
    expect(INPUT.held('B')).toBe(true);

    pads = [null, null]; // missed disconnect event also reconciles on poll
    INPUT.update();
    expect(INPUT.gamepadConnected).toBe(false);
    expect(events[events.length - 1]).toEqual([false, 'First pad']);
  });
});

describe('InputBus exclusive rebinding', () => {
  let fakeWindow: FakeWindow;
  let storage: MemoryStorage;
  let pads: Array<Gamepad | null>;

  async function freshRuntime(): Promise<typeof import('./input')> {
    vi.resetModules();
    fakeWindow = new FakeWindow();
    vi.stubGlobal('window', fakeWindow);
    vi.stubGlobal('localStorage', storage);
    vi.stubGlobal('navigator', { getGamepads: () => pads });
    return import('./input');
  }

  beforeEach(() => {
    storage = new MemoryStorage();
    pads = [];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('swaps singleton keyboard and pad owners without empty or duplicate bindings after reload', async () => {
    let runtime = await freshRuntime();
    runtime.INPUT.rebindKey('A', 'KeyC');
    runtime.INPUT.rebindPad('A', 1);

    expect(runtime.INPUT.bindingsFor().keys.A).toEqual(['KeyC']);
    expect(runtime.INPUT.bindingsFor().keys.X).toEqual(['KeyZ']);
    expect(runtime.INPUT.bindingsFor().pad.A).toEqual([1]);
    expect(runtime.INPUT.bindingsFor().pad.B).toEqual([0]);
    expectCompleteUnique(runtime.INPUT.bindingsFor().keys);
    expectCompleteUnique(runtime.INPUT.bindingsFor().pad);

    const beforeReload = structuredClone(runtime.INPUT.bindingsFor());
    runtime = await freshRuntime();
    expect(runtime.INPUT.bindingsFor()).toEqual(beforeReload);
    expectCompleteUnique(runtime.INPUT.bindingsFor().keys);
    expectCompleteUnique(runtime.INPUT.bindingsFor().pad);
  });

  it('deterministically repairs legacy empty and duplicate persisted values', async () => {
    storage.setItem('meteor-falls-controls', JSON.stringify({
      keys: { A: ['KeyC'], B: ['KeyC'], X: [], Y: ['KeyV'], START: ['Enter'] },
      pad: { A: [1], B: [], X: [2], Y: [3], START: [9] },
    }));

    const { INPUT } = await freshRuntime();
    expect(INPUT.bindingsFor().pad.A).toEqual([1]);
    expect(INPUT.bindingsFor().pad.B).toEqual([0]);
    expectCompleteUnique(INPUT.bindingsFor().keys);
    expectCompleteUnique(INPUT.bindingsFor().pad);
  });
});
