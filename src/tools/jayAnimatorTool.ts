type Facing = 'down' | 'downleft' | 'left' | 'upleft' | 'up' | 'upright' | 'right' | 'downright';
type Motion = 'walk' | 'run';
type PoseKind = 'stand' | 'walkA' | 'walkB' | 'runA' | 'runB' | 'idleBreath' | 'idleBlink';

interface Bounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface PoseSource {
  facing: Facing;
  canvas: HTMLCanvasElement;
  bounds: Bounds;
}

interface FrameTweak {
  wholeX: number;
  wholeY: number;
  upperX: number;
  upperY: number;
  lowerX: number;
  lowerY: number;
}

interface ToolSettings {
  cellW: number;
  cellH: number;
  ground: number;
  walkStride: number;
  walkBob: number;
  runStride: number;
  runBob: number;
  runLean: number;
  slice: number;
  walkFps: number;
  runFps: number;
}

type TweakState = Record<Motion, Record<Facing, FrameTweak[]>>;

const DEFAULT_SOURCE_URL = new URL('../../assets/art/characters/jay_standing_8dir_fullres.png', import.meta.url).href;

const FACINGS: Facing[] = ['down', 'downleft', 'left', 'upleft', 'up', 'upright', 'right', 'downright'];
const CARDINAL_EXPORT: Facing[] = ['down', 'left', 'right', 'up'];
const DIAG_EXPORT: Facing[] = ['downright', 'downleft', 'upright', 'upleft'];
const FACING_LABELS: Record<Facing, string> = {
  down: 'D',
  downleft: 'DL',
  left: 'L',
  upleft: 'UL',
  up: 'U',
  upright: 'UR',
  right: 'R',
  downright: 'DR',
};

const ZERO_TWEAK = (): FrameTweak => ({
  wholeX: 0,
  wholeY: 0,
  upperX: 0,
  upperY: 0,
  lowerX: 0,
  lowerY: 0,
});

const DEFAULT_SETTINGS: ToolSettings = {
  cellW: 96,
  cellH: 128,
  ground: 5,
  walkStride: 4,
  walkBob: 3,
  runStride: 7,
  runBob: 5,
  runLean: 4,
  slice: 0.7,
  walkFps: 8,
  runFps: 12,
};

function makeTweakState(): TweakState {
  const state = {} as TweakState;
  for (const motion of ['walk', 'run'] as const) {
    state[motion] = {} as Record<Facing, FrameTweak[]>;
    for (const facing of FACINGS) {
      const count = motion === 'walk' ? 4 : 2;
      state[motion][facing] = Array.from({ length: count }, ZERO_TWEAK);
    }
  }
  return state;
}

function ctx2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D is not available.');
  ctx.imageSmoothingEnabled = false;
  return ctx;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });
}

function alphaBounds(canvas: HTMLCanvasElement): Bounds {
  const ctx = ctx2d(canvas);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let minX = canvas.width;
  let minY = canvas.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      if (data[(y * canvas.width + x) * 4 + 3] < 16) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < minX || maxY < minY) return { x: 0, y: 0, w: canvas.width, h: canvas.height };
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

function drawChecker(ctx: CanvasRenderingContext2D, w: number, h: number, tile = 12): void {
  for (let y = 0; y < h; y += tile) {
    for (let x = 0; x < w; x += tile) {
      ctx.fillStyle = ((x / tile + y / tile) & 1) === 0 ? '#edf0f2' : '#cfd5da';
      ctx.fillRect(x, y, tile, tile);
    }
  }
}

function normalizePoses(source: HTMLImageElement, settings: ToolSettings): PoseSource[] {
  const cellW = source.width / 8;
  const cellH = source.height;
  return FACINGS.map((facing, index) => {
    const raw = document.createElement('canvas');
    raw.width = Math.round(cellW);
    raw.height = cellH;
    const rawCtx = ctx2d(raw);
    rawCtx.drawImage(source, index * cellW, 0, cellW, cellH, 0, 0, raw.width, raw.height);
    const rawBounds = alphaBounds(raw);

    const canvas = document.createElement('canvas');
    canvas.width = settings.cellW;
    canvas.height = settings.cellH;
    const ctx = ctx2d(canvas);
    const targetW = settings.cellW * 0.82;
    const targetH = settings.cellH - settings.ground - 3;
    const scale = Math.min(targetW / rawBounds.w, targetH / rawBounds.h);
    const dw = Math.round(rawBounds.w * scale);
    const dh = Math.round(rawBounds.h * scale);
    const dx = Math.round((settings.cellW - dw) / 2);
    const dy = Math.round(settings.cellH - settings.ground - dh);
    ctx.drawImage(raw, rawBounds.x, rawBounds.y, rawBounds.w, rawBounds.h, dx, dy, dw, dh);
    return { facing, canvas, bounds: alphaBounds(canvas) };
  });
}

function facingVector(facing: Facing): { x: number; y: number } {
  const d = Math.SQRT1_2;
  switch (facing) {
    case 'down': return { x: 0, y: 1 };
    case 'downleft': return { x: -d, y: d };
    case 'left': return { x: -1, y: 0 };
    case 'upleft': return { x: -d, y: -d };
    case 'up': return { x: 0, y: -1 };
    case 'upright': return { x: d, y: -d };
    case 'right': return { x: 1, y: 0 };
    case 'downright': return { x: d, y: d };
  }
}

function poseFor(motion: Motion, slot: number): PoseKind {
  if (motion === 'run') return slot === 0 ? 'runA' : 'runB';
  if (slot === 1) return 'walkA';
  if (slot === 3) return 'walkB';
  return 'stand';
}

function phaseFor(pose: PoseKind): number {
  if (pose === 'walkA' || pose === 'runA') return -1;
  if (pose === 'walkB' || pose === 'runB') return 1;
  return 0;
}

function drawImagePart(
  ctx: CanvasRenderingContext2D,
  src: HTMLCanvasElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  dx: number,
  dy: number,
): void {
  if (sw <= 0 || sh <= 0) return;
  ctx.drawImage(src, sx, sy, sw, sh, Math.round(dx), Math.round(dy), sw, sh);
}

function renderFrame(
  target: HTMLCanvasElement,
  pose: PoseSource,
  settings: ToolSettings,
  motion: Motion,
  slot: number,
  tweak: FrameTweak,
  clear = true,
): void {
  const ctx = ctx2d(target);
  if (clear) ctx.clearRect(0, 0, target.width, target.height);

  const kind = poseFor(motion, slot);
  const phase = phaseFor(kind);
  const vec = facingVector(pose.facing);
  const side = { x: -vec.y, y: vec.x };
  const stride = motion === 'walk' ? settings.walkStride : settings.runStride;
  const bob = motion === 'walk' ? settings.walkBob : settings.runBob;
  const runLean = motion === 'run' ? settings.runLean : 0;
  const bounceY = phase === 0 ? 0 : -bob;
  const swayX = side.x * phase * stride * 0.18;
  const swayY = side.y * phase * stride * 0.1;
  const leanX = vec.x * runLean;
  const leanY = vec.y * runLean * 0.35;
  const wholeX = tweak.wholeX + swayX + leanX;
  const wholeY = tweak.wholeY + bounceY + swayY + leanY;

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, target.width, target.height);
  ctx.clip();

  if (settings.slice <= 0.01 || phase === 0) {
    ctx.drawImage(pose.canvas, Math.round(wholeX), Math.round(wholeY));
    ctx.restore();
    return;
  }

  const b = pose.bounds;
  const hipY = Math.round(b.y + b.h * 0.64);
  const midX = Math.round(b.x + b.w * 0.5);
  const legReach = stride * settings.slice * 0.45;
  const legA = {
    x: tweak.lowerX + wholeX + side.x * phase * legReach + vec.x * phase * legReach * 0.35,
    y: tweak.lowerY + wholeY + Math.abs(phase) * 1,
  };
  const legB = {
    x: tweak.lowerX + wholeX - side.x * phase * legReach - vec.x * phase * legReach * 0.2,
    y: tweak.lowerY + wholeY - Math.abs(phase) * 0.5,
  };
  const upperX = tweak.upperX + wholeX;
  const upperY = tweak.upperY + wholeY;

  drawImagePart(ctx, pose.canvas, 0, 0, settings.cellW, hipY, upperX, upperY);
  drawImagePart(ctx, pose.canvas, 0, hipY, midX, settings.cellH - hipY, legA.x, legA.y);
  drawImagePart(ctx, pose.canvas, midX, hipY, settings.cellW - midX, settings.cellH - hipY, legB.x, legB.y);
  ctx.restore();
}

function buildEngineSheet(poses: PoseSource[], settings: ToolSettings, tweaks: TweakState): HTMLCanvasElement {
  const cols = 4;
  const frames = 46;
  const canvas = document.createElement('canvas');
  canvas.width = cols * settings.cellW;
  canvas.height = Math.ceil(frames / cols) * settings.cellH;
  const ctx = ctx2d(canvas);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const byFacing = new Map(poses.map((pose) => [pose.facing, pose]));

  const drawToFrame = (frame: number, facing: Facing, motion: Motion, slot: number): void => {
    const pose = byFacing.get(facing);
    if (!pose) return;
    const cell = document.createElement('canvas');
    cell.width = settings.cellW;
    cell.height = settings.cellH;
    renderFrame(cell, pose, settings, motion, slot, tweaks[motion][facing][slot]);
    ctx.drawImage(cell, (frame % cols) * settings.cellW, Math.floor(frame / cols) * settings.cellH);
  };

  CARDINAL_EXPORT.forEach((facing, dirIndex) => {
    const base = dirIndex * 4;
    drawToFrame(base, facing, 'walk', 0);
    drawToFrame(base + 1, facing, 'walk', 1);
    drawToFrame(base + 2, facing, 'walk', 2);
    drawToFrame(base + 3, facing, 'walk', 3);
  });
  CARDINAL_EXPORT.forEach((facing, dirIndex) => {
    const base = 16 + dirIndex * 2;
    drawToFrame(base, facing, 'run', 0);
    drawToFrame(base + 1, facing, 'run', 1);
  });
  DIAG_EXPORT.forEach((facing, dirIndex) => {
    const base = 24 + dirIndex * 3;
    drawToFrame(base, facing, 'walk', 0);
    drawToFrame(base + 1, facing, 'walk', 1);
    drawToFrame(base + 2, facing, 'walk', 3);
  });
  DIAG_EXPORT.forEach((facing, dirIndex) => {
    const base = 36 + dirIndex * 2;
    drawToFrame(base, facing, 'run', 0);
    drawToFrame(base + 1, facing, 'run', 1);
  });

  const down = byFacing.get('down');
  if (down) {
    drawToFrame(44, 'down', 'walk', 0);
    const blink = document.createElement('canvas');
    blink.width = settings.cellW;
    blink.height = settings.cellH;
    renderFrame(blink, down, settings, 'walk', 0, tweaks.walk.down[0]);
    const blinkCtx = ctx2d(blink);
    const b = down.bounds;
    blinkCtx.fillStyle = 'rgba(22, 13, 27, 0.85)';
    blinkCtx.fillRect(Math.round(b.x + b.w * 0.31), Math.round(b.y + b.h * 0.34), Math.round(b.w * 0.38), 1);
    ctx.drawImage(blink, (45 % cols) * settings.cellW, Math.floor(45 / cols) * settings.cellH);
  }
  return canvas;
}

function downloadCanvas(canvas: HTMLCanvasElement, fileName: string): void {
  const link = document.createElement('a');
  link.download = fileName;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function downloadText(text: string, fileName: string): void {
  const link = document.createElement('a');
  link.download = fileName;
  link.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  link.click();
  URL.revokeObjectURL(link.href);
}

function injectStyles(): void {
  const style = document.createElement('style');
  style.textContent = `
    :root {
      --bg: #101118;
      --panel: #1a1d28;
      --panel-2: #232735;
      --text: #f4efe4;
      --muted: #a9b1bf;
      --line: #3a4050;
      --red: #e45548;
      --gold: #f0c834;
      --blue: #5f91ef;
      --green: #74c66a;
    }
    html, body {
      margin: 0;
      min-width: 1100px;
      min-height: 720px;
      background: var(--bg);
      color: var(--text);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      overflow: auto;
      user-select: none;
    }
    button, input, select {
      font: inherit;
    }
    #jay-animator-tool {
      min-height: 100vh;
      display: grid;
      grid-template-rows: auto 1fr;
    }
    .toolbar {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 16px;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid var(--line);
      background: #141722;
    }
    .brand {
      display: flex;
      gap: 10px;
      align-items: baseline;
      white-space: nowrap;
    }
    .brand h1 {
      margin: 0;
      font-size: 18px;
      letter-spacing: 0;
    }
    .brand span,
    .status {
      color: var(--muted);
      font-size: 12px;
    }
    .toolbar-actions,
    .segmented,
    .directions {
      display: flex;
      gap: 6px;
      align-items: center;
      flex-wrap: wrap;
    }
    button {
      border: 1px solid var(--line);
      background: var(--panel-2);
      color: var(--text);
      border-radius: 6px;
      min-height: 32px;
      padding: 0 10px;
      cursor: pointer;
    }
    button:hover {
      border-color: var(--blue);
    }
    button.active {
      color: #11131a;
      background: var(--gold);
      border-color: var(--gold);
    }
    button.primary {
      background: var(--blue);
      border-color: var(--blue);
      color: #07101f;
      font-weight: 700;
    }
    .shell {
      display: grid;
      grid-template-columns: minmax(680px, 1fr) 360px;
      gap: 12px;
      padding: 12px;
    }
    .stage-panel,
    .side-panel,
    .strip-panel {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
    }
    .stage-panel {
      display: grid;
      grid-template-rows: 1fr auto;
      gap: 10px;
      padding: 12px;
      min-height: 620px;
    }
    .canvases {
      display: grid;
      grid-template-columns: minmax(420px, 1fr) 300px;
      gap: 10px;
      align-items: stretch;
    }
    .canvas-wrap {
      display: grid;
      grid-template-rows: auto 1fr;
      gap: 8px;
      min-width: 0;
    }
    .canvas-title {
      color: var(--muted);
      font-size: 12px;
      display: flex;
      justify-content: space-between;
    }
    canvas {
      image-rendering: pixelated;
      image-rendering: crisp-edges;
    }
    #preview-canvas {
      width: 100%;
      height: 100%;
      min-height: 430px;
      background: #0c0d12;
      border: 1px solid var(--line);
      border-radius: 6px;
    }
    #sheet-canvas {
      width: 100%;
      height: auto;
      max-height: 512px;
      background: #0c0d12;
      border: 1px solid var(--line);
      border-radius: 6px;
    }
    #source-canvas,
    #filmstrip-canvas {
      width: 100%;
      background: #0c0d12;
      border: 1px solid var(--line);
      border-radius: 6px;
    }
    .strip-panel {
      padding: 10px;
    }
    .side-panel {
      padding: 12px;
      display: grid;
      align-content: start;
      gap: 14px;
    }
    .section {
      display: grid;
      gap: 8px;
      border-top: 1px solid var(--line);
      padding-top: 12px;
    }
    .section:first-child {
      border-top: 0;
      padding-top: 0;
    }
    .section h2 {
      margin: 0;
      font-size: 13px;
      color: var(--gold);
      letter-spacing: 0;
    }
    .control {
      display: grid;
      grid-template-columns: 98px 1fr 54px;
      gap: 8px;
      align-items: center;
      color: var(--muted);
      font-size: 12px;
    }
    .control input[type="range"] {
      width: 100%;
      accent-color: var(--blue);
    }
    .control input[type="number"] {
      width: 54px;
      box-sizing: border-box;
      background: #10131c;
      border: 1px solid var(--line);
      color: var(--text);
      border-radius: 5px;
      min-height: 28px;
      padding: 0 6px;
    }
    .frame-buttons {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
    }
    .run .frame-buttons {
      grid-template-columns: repeat(2, 1fr);
    }
    .row-actions {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .file-row {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8px;
    }
    .file-row input[type="file"] {
      min-width: 0;
      color: var(--muted);
    }
  `;
  document.head.appendChild(style);
}

export function startJayAnimatorTool(): void {
  document.title = 'Jay Animator Tool';
  document.body.innerHTML = `
    <main id="jay-animator-tool">
      <header class="toolbar">
        <div class="brand">
          <h1>Jay Animator</h1>
          <span>8-dir walk/run builder</span>
        </div>
        <div class="directions" id="direction-buttons"></div>
        <div class="toolbar-actions">
          <div class="segmented" id="motion-buttons">
            <button data-motion="walk" class="active">Walk</button>
            <button data-motion="run">Run</button>
          </div>
          <button id="play-button" class="primary">Pause</button>
          <button id="export-png">Export PNG</button>
          <button id="export-json">Export JSON</button>
        </div>
      </header>
      <section class="shell">
        <div class="stage-panel">
          <div class="canvases">
            <div class="canvas-wrap">
              <div class="canvas-title"><span>Preview</span><span id="frame-readout"></span></div>
              <canvas id="preview-canvas" width="720" height="520"></canvas>
            </div>
            <div class="canvas-wrap">
              <div class="canvas-title"><span>Engine Sheet</span><span>46 frames</span></div>
              <canvas id="sheet-canvas" width="384" height="1536"></canvas>
            </div>
          </div>
          <div class="strip-panel">
            <div class="canvas-title"><span>Current Cycle</span><span id="cycle-readout"></span></div>
            <canvas id="filmstrip-canvas" width="520" height="150"></canvas>
          </div>
        </div>
        <aside class="side-panel" id="side-panel">
          <section class="section">
            <h2>Source</h2>
            <div class="file-row">
              <input id="source-file" type="file" accept="image/png,image/webp,image/jpeg" />
              <button id="reload-default">Default</button>
            </div>
            <canvas id="source-canvas" width="320" height="88"></canvas>
            <div class="status" id="status-line">Loading</div>
          </section>
          <section class="section">
            <h2>Cycle</h2>
            <div class="frame-buttons" id="frame-buttons"></div>
          </section>
          <section class="section">
            <h2>Motion</h2>
            <div id="motion-controls"></div>
          </section>
          <section class="section">
            <h2>Selected Frame</h2>
            <div id="tweak-controls"></div>
            <div class="row-actions">
              <button id="copy-to-dir">Copy To Direction</button>
              <button id="reset-frame">Reset Frame</button>
              <button id="reset-all">Reset All</button>
            </div>
          </section>
        </aside>
      </section>
    </main>
  `;
  injectStyles();

  const previewCanvas = document.querySelector<HTMLCanvasElement>('#preview-canvas');
  const sheetCanvas = document.querySelector<HTMLCanvasElement>('#sheet-canvas');
  const filmstripCanvas = document.querySelector<HTMLCanvasElement>('#filmstrip-canvas');
  const sourceCanvas = document.querySelector<HTMLCanvasElement>('#source-canvas');
  if (!previewCanvas || !sheetCanvas || !filmstripCanvas || !sourceCanvas) return;

  let settings: ToolSettings = { ...DEFAULT_SETTINGS };
  let tweaks = makeTweakState();
  let sourceImage: HTMLImageElement | null = null;
  let poses: PoseSource[] = [];
  let currentMotion: Motion = 'walk';
  let currentFacing: Facing = 'down';
  let currentSlot = 0;
  let playing = true;
  let lastTime = performance.now();
  let accumulator = 0;

  const statusLine = document.querySelector<HTMLElement>('#status-line');
  const frameReadout = document.querySelector<HTMLElement>('#frame-readout');
  const cycleReadout = document.querySelector<HTMLElement>('#cycle-readout');

  const setStatus = (text: string): void => {
    if (statusLine) statusLine.textContent = text;
  };

  const poseForFacing = (facing: Facing): PoseSource | undefined => poses.find((pose) => pose.facing === facing);

  const rebuildPoses = (): void => {
    if (!sourceImage) return;
    poses = normalizePoses(sourceImage, settings);
  };

  const renderSource = (): void => {
    const ctx = ctx2d(sourceCanvas);
    drawChecker(ctx, sourceCanvas.width, sourceCanvas.height, 8);
    if (!sourceImage) return;
    ctx.drawImage(sourceImage, 0, 0, sourceImage.width, sourceImage.height, 0, 0, sourceCanvas.width, sourceCanvas.height);
  };

  const renderSheet = (): void => {
    if (!poses.length) return;
    const engine = buildEngineSheet(poses, settings, tweaks);
    sheetCanvas.width = engine.width;
    sheetCanvas.height = engine.height;
    const ctx = ctx2d(sheetCanvas);
    ctx.clearRect(0, 0, sheetCanvas.width, sheetCanvas.height);
    ctx.drawImage(engine, 0, 0);
  };

  const renderFilmstrip = (): void => {
    const ctx = ctx2d(filmstripCanvas);
    ctx.clearRect(0, 0, filmstripCanvas.width, filmstripCanvas.height);
    drawChecker(ctx, filmstripCanvas.width, filmstripCanvas.height, 10);
    const pose = poseForFacing(currentFacing);
    if (!pose) return;
    const count = currentMotion === 'walk' ? 4 : 2;
    const gap = 14;
    const scale = 0.9;
    const cellW = settings.cellW * scale;
    const cellH = settings.cellH * scale;
    const totalW = count * cellW + (count - 1) * gap;
    let x = (filmstripCanvas.width - totalW) / 2;
    for (let i = 0; i < count; i++) {
      const cell = document.createElement('canvas');
      cell.width = settings.cellW;
      cell.height = settings.cellH;
      renderFrame(cell, pose, settings, currentMotion, i, tweaks[currentMotion][currentFacing][i]);
      ctx.strokeStyle = i === currentSlot ? '#f0c834' : '#3a4050';
      ctx.lineWidth = i === currentSlot ? 3 : 1;
      ctx.strokeRect(Math.round(x - 2), 9, Math.round(cellW + 4), Math.round(cellH + 4));
      ctx.drawImage(cell, Math.round(x), 11, Math.round(cellW), Math.round(cellH));
      ctx.fillStyle = '#f4efe4';
      ctx.font = '12px sans-serif';
      ctx.fillText(currentMotion === 'walk' ? ['Stand', 'Step A', 'Stand', 'Step B'][i] : `Run ${i + 1}`, x + 6, 140);
      x += cellW + gap;
    }
    if (cycleReadout) cycleReadout.textContent = `${FACING_LABELS[currentFacing]} ${currentMotion}`;
  };

  const renderPreview = (): void => {
    const ctx = ctx2d(previewCanvas);
    ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    drawChecker(ctx, previewCanvas.width, previewCanvas.height, 18);
    const pose = poseForFacing(currentFacing);
    if (!pose) return;
    const cell = document.createElement('canvas');
    cell.width = settings.cellW;
    cell.height = settings.cellH;
    renderFrame(cell, pose, settings, currentMotion, currentSlot, tweaks[currentMotion][currentFacing][currentSlot]);
    const scale = Math.min((previewCanvas.width - 160) / settings.cellW, (previewCanvas.height - 86) / settings.cellH);
    const w = settings.cellW * scale;
    const h = settings.cellH * scale;
    const x = (previewCanvas.width - w) / 2;
    const y = (previewCanvas.height - h) / 2 + 12;
    ctx.fillStyle = 'rgba(10, 13, 20, 0.35)';
    ctx.fillRect(0, Math.round(y + h - settings.ground * scale), previewCanvas.width, 2);
    ctx.drawImage(cell, Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    if (frameReadout) {
      frameReadout.textContent = `${currentMotion.toUpperCase()} ${FACING_LABELS[currentFacing]} frame ${currentSlot + 1}`;
    }
  };

  const renderAll = (): void => {
    currentSlot = Math.min(currentSlot, currentMotion === 'walk' ? 3 : 1);
    renderSource();
    renderSheet();
    renderFilmstrip();
    renderPreview();
  };

  const makeNumberControl = (
    parent: HTMLElement,
    label: string,
    min: number,
    max: number,
    get: () => number,
    set: (value: number) => void,
  ): void => {
    const row = document.createElement('label');
    row.className = 'control';
    const text = document.createElement('span');
    text.textContent = label;
    const range = document.createElement('input');
    range.type = 'range';
    range.min = String(min);
    range.max = String(max);
    range.step = '1';
    const number = document.createElement('input');
    number.type = 'number';
    number.min = String(min);
    number.max = String(max);
    number.step = '1';
    const sync = (): void => {
      const value = String(get());
      range.value = value;
      number.value = value;
    };
    const update = (value: number): void => {
      set(Math.max(min, Math.min(max, Math.round(value))));
      sync();
      rebuildPoses();
      renderAll();
    };
    range.addEventListener('input', () => update(Number(range.value)));
    number.addEventListener('change', () => update(Number(number.value)));
    row.append(text, range, number);
    parent.append(row);
    sync();
  };

  const renderMotionControls = (): void => {
    const holder = document.querySelector<HTMLElement>('#motion-controls');
    if (!holder) return;
    holder.innerHTML = '';
    makeNumberControl(holder, 'Walk stride', 0, 12, () => settings.walkStride, (v) => { settings.walkStride = v; });
    makeNumberControl(holder, 'Walk bob', 0, 10, () => settings.walkBob, (v) => { settings.walkBob = v; });
    makeNumberControl(holder, 'Run stride', 0, 16, () => settings.runStride, (v) => { settings.runStride = v; });
    makeNumberControl(holder, 'Run bob', 0, 12, () => settings.runBob, (v) => { settings.runBob = v; });
    makeNumberControl(holder, 'Run lean', 0, 12, () => settings.runLean, (v) => { settings.runLean = v; });
    makeNumberControl(holder, 'Slice mix', 0, 10, () => Math.round(settings.slice * 10), (v) => { settings.slice = v / 10; });
    makeNumberControl(holder, 'Ground', 0, 18, () => settings.ground, (v) => { settings.ground = v; });
  };

  const renderTweakControls = (): void => {
    const holder = document.querySelector<HTMLElement>('#tweak-controls');
    if (!holder) return;
    holder.innerHTML = '';
    const tweak = tweaks[currentMotion][currentFacing][currentSlot];
    makeNumberControl(holder, 'Whole X', -24, 24, () => tweak.wholeX, (v) => { tweak.wholeX = v; });
    makeNumberControl(holder, 'Whole Y', -24, 24, () => tweak.wholeY, (v) => { tweak.wholeY = v; });
    makeNumberControl(holder, 'Upper X', -18, 18, () => tweak.upperX, (v) => { tweak.upperX = v; });
    makeNumberControl(holder, 'Upper Y', -18, 18, () => tweak.upperY, (v) => { tweak.upperY = v; });
    makeNumberControl(holder, 'Lower X', -18, 18, () => tweak.lowerX, (v) => { tweak.lowerX = v; });
    makeNumberControl(holder, 'Lower Y', -18, 18, () => tweak.lowerY, (v) => { tweak.lowerY = v; });
  };

  const renderFrameButtons = (): void => {
    const holder = document.querySelector<HTMLElement>('#frame-buttons');
    const side = document.querySelector<HTMLElement>('#side-panel');
    if (!holder || !side) return;
    holder.innerHTML = '';
    side.classList.toggle('run', currentMotion === 'run');
    const names = currentMotion === 'walk' ? ['Stand', 'Step A', 'Stand', 'Step B'] : ['Run A', 'Run B'];
    names.forEach((name, index) => {
      const button = document.createElement('button');
      button.textContent = name;
      button.classList.toggle('active', index === currentSlot);
      button.addEventListener('click', () => {
        currentSlot = index;
        renderFrameButtons();
        renderTweakControls();
        renderAll();
      });
      holder.append(button);
    });
  };

  const renderDirectionButtons = (): void => {
    const holder = document.querySelector<HTMLElement>('#direction-buttons');
    if (!holder) return;
    holder.innerHTML = '';
    FACINGS.forEach((facing) => {
      const button = document.createElement('button');
      button.textContent = FACING_LABELS[facing];
      button.title = facing;
      button.classList.toggle('active', facing === currentFacing);
      button.addEventListener('click', () => {
        currentFacing = facing;
        renderDirectionButtons();
        renderTweakControls();
        renderAll();
      });
      holder.append(button);
    });
  };

  const wireMotionButtons = (): void => {
    document.querySelectorAll<HTMLButtonElement>('[data-motion]').forEach((button) => {
      button.addEventListener('click', () => {
        currentMotion = button.dataset.motion === 'run' ? 'run' : 'walk';
        currentSlot = Math.min(currentSlot, currentMotion === 'run' ? 1 : 3);
        document.querySelectorAll<HTMLButtonElement>('[data-motion]').forEach((other) => {
          other.classList.toggle('active', other === button);
        });
        renderFrameButtons();
        renderTweakControls();
        renderAll();
      });
    });
  };

  const readSourceFromFile = (file: File): void => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      loadImage(reader.result).then((img) => {
        sourceImage = img;
        rebuildPoses();
        setStatus(`${img.width}x${img.height} loaded`);
        renderAll();
      }).catch((err: unknown) => setStatus(err instanceof Error ? err.message : 'Load failed'));
    };
    reader.readAsDataURL(file);
  };

  const sourceFileInput = document.querySelector<HTMLInputElement>('#source-file');
  sourceFileInput?.addEventListener('change', () => {
    const input = sourceFileInput;
    const file = input.files?.[0];
    if (file) readSourceFromFile(file);
  });
  document.querySelector<HTMLButtonElement>('#reload-default')?.addEventListener('click', () => {
    loadImage(DEFAULT_SOURCE_URL).then((img) => {
      sourceImage = img;
      rebuildPoses();
      setStatus(`${img.width}x${img.height} default`);
      renderAll();
    }).catch((err: unknown) => setStatus(err instanceof Error ? err.message : 'Load failed'));
  });
  const playButton = document.querySelector<HTMLButtonElement>('#play-button');
  playButton?.addEventListener('click', () => {
    playing = !playing;
    playButton.textContent = playing ? 'Pause' : 'Play';
  });
  document.querySelector<HTMLButtonElement>('#export-png')?.addEventListener('click', () => {
    const engine = buildEngineSheet(poses, settings, tweaks);
    downloadCanvas(engine, 'jay_anim_46_4x_procedural.png');
  });
  document.querySelector<HTMLButtonElement>('#export-json')?.addEventListener('click', () => {
    downloadText(JSON.stringify({ settings, tweaks }, null, 2), 'jay_animator_tweaks.json');
  });
  document.querySelector<HTMLButtonElement>('#reset-frame')?.addEventListener('click', () => {
    tweaks[currentMotion][currentFacing][currentSlot] = ZERO_TWEAK();
    renderTweakControls();
    renderAll();
  });
  document.querySelector<HTMLButtonElement>('#reset-all')?.addEventListener('click', () => {
    settings = { ...DEFAULT_SETTINGS };
    tweaks = makeTweakState();
    rebuildPoses();
    renderMotionControls();
    renderTweakControls();
    renderAll();
  });
  document.querySelector<HTMLButtonElement>('#copy-to-dir')?.addEventListener('click', () => {
    const source = { ...tweaks[currentMotion][currentFacing][currentSlot] };
    for (const facing of FACINGS) {
      tweaks[currentMotion][facing][currentSlot] = { ...source };
    }
    renderAll();
  });

  const tick = (time: number): void => {
    const dt = time - lastTime;
    lastTime = time;
    if (playing) {
      accumulator += dt;
      const fps = currentMotion === 'walk' ? settings.walkFps : settings.runFps;
      const frameMs = 1000 / fps;
      if (accumulator >= frameMs) {
        accumulator = 0;
        const count = currentMotion === 'walk' ? 4 : 2;
        currentSlot = (currentSlot + 1) % count;
        renderFrameButtons();
        renderTweakControls();
        renderFilmstrip();
        renderPreview();
      }
    }
    requestAnimationFrame(tick);
  };

  renderDirectionButtons();
  renderFrameButtons();
  renderMotionControls();
  renderTweakControls();
  wireMotionButtons();
  loadImage(DEFAULT_SOURCE_URL).then((img) => {
    sourceImage = img;
    rebuildPoses();
    setStatus(`${img.width}x${img.height} default`);
    renderAll();
  }).catch((err: unknown) => setStatus(err instanceof Error ? err.message : 'Load failed'));
  requestAnimationFrame(tick);
}
