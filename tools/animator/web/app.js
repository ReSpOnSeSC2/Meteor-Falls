/* ===========================================================================
   CADENCE — character animation studio  (frontend)
   Vanilla JS + Canvas. Talks to the FastAPI backend over same-origin fetch.
   No frameworks, no build step. Code strictly against the API contract.
   =========================================================================== */
'use strict';

/* ---------------------------------------------------------------------------
   1. Constants / contract
   ------------------------------------------------------------------------- */

// The 8 facings, laid out on a 3x3 compass (center = idle/down).
// Canonical facings are authored directly; mirrors are flipped from a source.
const FACINGS = {
  up:        { label: '↑',  canonical: true },
  upright:   { label: '↗',  canonical: true },
  right:     { label: '→',  canonical: true },
  downright: { label: '↘',  canonical: true },
  down:      { label: '↓',  canonical: true },
  // mirrors — editing is locked, they flip a canonical facing
  upleft:    { label: '↖',  canonical: false, mirrorOf: 'upright' },
  left:      { label: '←',  canonical: false, mirrorOf: 'right' },
  downleft:  { label: '↙',  canonical: false, mirrorOf: 'downright' },
};

// 3x3 compass layout (row-major). Center cell is rendered as an idle button → 'down'.
const DIRPAD_LAYOUT = [
  'upleft',  'up',    'upright',
  'left',    'idle',  'right',
  'downleft','down',  'downright',
];

// Poses played per motion+facing for the scrubber / frame player.
function posesFor(facing, motion) {
  if (motion === 'run') return [1, 3];
  // walk: diagonals use a 3-pose cycle, cardinals use 4
  if (facing.startsWith('up') || facing.startsWith('down')) {
    if (facing !== 'up' && facing !== 'down') return [0, 1, 3]; // diagonal
  }
  return [0, 1, 2, 3];
}

// Motion param fields -> [min, max]. Order defines slider order.
const PARAM_FIELDS = [
  ['leg_swing',   0, 40],
  ['knee_bend',   0, 40],
  ['arm_swing',   0, 40],
  ['forearm',     0, 25],
  ['bob',         0, 8],
  ['lean',        0, 20],
  ['torso_twist', 0, 10],
  ['head_bob',    0, 4],
  ['crouch',      0, 6],
  ['fps',         4, 16],
];

/* ---------------------------------------------------------------------------
   2. App state
   ------------------------------------------------------------------------- */

const state = {
  project: null,            // full project payload from GET /api/projects/{id}
  facing: 'down',           // currently selected facing key
  motion: 'walk',           // 'walk' | 'run'
  selectedJoint: null,      // highlighted joint name
  pendingFile: null,        // File chosen but not yet uploaded
  // rig canvas display mapping
  rig: { scale: 1, cellW: 96, cellH: 128 },
  // preview player
  player: { playing: false, poseIdx: 0, fps: 8, timer: null, mode: 'frames' },
};

/* ---------------------------------------------------------------------------
   3. Tiny DOM + API helpers
   ------------------------------------------------------------------------- */

const $ = (id) => document.getElementById(id);
const el = (tag, cls) => { const n = document.createElement(tag); if (cls) n.className = cls; return n; };
const bust = () => `?v=${Date.now()}`;

/** Minimal fetch wrapper. Throws on non-2xx with a useful message. */
const api = {
  async req(method, path, { json, form } = {}) {
    const opts = { method, headers: {} };
    if (json !== undefined) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(json); }
    if (form !== undefined) { opts.body = form; } // browser sets multipart boundary
    const res = await fetch(path, opts);
    if (!res.ok) {
      let detail = res.statusText;
      try { const j = await res.json(); detail = j.detail || j.error || detail; } catch (_) {}
      throw new Error(`${method} ${path} → ${res.status} ${detail}`);
    }
    // some endpoints return no body (e.g. 204)
    const ct = res.headers.get('content-type') || '';
    return ct.includes('application/json') ? res.json() : res;
  },
  get(p)        { return this.req('GET', p); },
  post(p, body) { return this.req('POST', p, body); },
  put(p, body)  { return this.req('PUT', p, body); },
};

/** Toast notifications (errors / success). */
function toast(msg, kind = '') {
  const wrap = $('toastWrap');
  const t = el('div', `toast ${kind}`);
  t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 250); }, kind === 'err' ? 5200 : 3200);
}

/** Wrap an async handler so failures surface as toasts, never silent. */
function guarded(fn) {
  return async (...args) => {
    try { return await fn(...args); }
    catch (err) { console.error(err); toast(err.message || String(err), 'err'); }
  };
}

/* ---------------------------------------------------------------------------
   4. Health / status
   ------------------------------------------------------------------------- */

async function checkHealth() {
  const dot = $('statusDot'), label = $('statusLabel');
  try {
    const h = await api.get('/api/health');
    dot.className = 'status-dot ok';
    label.textContent = h.engine_version ? `engine ${h.engine_version}` : (h.status || 'online');
  } catch (_) {
    dot.className = 'status-dot err';
    label.textContent = 'backend offline';
  }
}

/* ---------------------------------------------------------------------------
   5. Project lifecycle
   ------------------------------------------------------------------------- */

async function refreshProjectList() {
  try {
    const list = await api.get('/api/projects');
    const sel = $('projectList');
    const current = sel.value;
    sel.innerHTML = '<option value="">— select project —</option>';
    list.forEach((p) => {
      const o = el('option');
      o.value = p.id; o.textContent = p.name || p.id;
      sel.appendChild(o);
    });
    sel.value = current;
  } catch (_) { /* backend may be down; status dot already conveys it */ }
}

/** Create a project from an uploaded PNG + name. */
const createFromFile = guarded(async () => {
  const name = $('newProjectName').value.trim();
  if (!state.pendingFile) return toast('Choose a PNG first', 'err');
  if (!name) return toast('Enter a project name', 'err');
  const form = new FormData();
  form.append('file', state.pendingFile);
  form.append('name', name);
  toast('Uploading & slicing…');
  const project = await api.post('/api/projects', { form });
  await onProjectLoaded(project);
});

/** Create the Jay fixture project from a source path. */
const createJay = guarded(async () => {
  toast('Loading Jay fixture…');
  const project = await api.post('/api/projects', {
    json: { name: 'Jay', source_path: '../assets/art/masters/characters/jay-8angle-transparent.png' },
  });
  await onProjectLoaded(project);
});

/** Open an already-existing project by id. */
const openProject = guarded(async (id) => {
  if (!id) return;
  const project = await api.get(`/api/projects/${id}`);
  await onProjectLoaded(project);
});

/** Common path after a project is created or opened. */
async function onProjectLoaded(project) {
  // POST /projects may already return full state; if it lacks facings, fetch it.
  if (!project.facings && project.id) project = await api.get(`/api/projects/${project.id}`);
  state.project = project;
  state.facing = 'down';
  state.selectedJoint = null;

  $('projectName').textContent = project.name || project.id;
  $('gamePathHint').textContent = `drops into assets/art/characters/${project.id}_anim_46_4x.png`;

  // reveal the workspace panels
  ['facingPanel', 'rigPanel', 'previewPanel', 'sheetPanel',
   'jointPanel', 'motionPanel', 'exportPanel'].forEach((p) => { $(p).hidden = false; });

  buildDirpad();
  renderMotionSliders();
  await selectFacing('down');
  loadSheet();
  await refreshProjectList();
  $('projectList').value = project.id;
  // Auto-play the preview: the rest pose (pose 0) never rotates a limb, so a
  // paused preview makes joint edits look like they do nothing. Animating by
  // default means every skeleton tweak is immediately visible.
  play();
  toast(`Project “${project.name || project.id}” ready`, 'ok');
}

/** Look up the facing payload object for a key (resolving mirrors to source). */
function facingData(key) {
  if (!state.project) return null;
  const meta = FACINGS[key];
  const lookup = meta && !meta.canonical ? meta.mirrorOf : key;
  return state.project.facings.find((f) => f.facing === lookup) || null;
}

/* ---------------------------------------------------------------------------
   6. Direction pad
   ------------------------------------------------------------------------- */

function buildDirpad() {
  const pad = $('dirpad');
  pad.innerHTML = '';
  DIRPAD_LAYOUT.forEach((key) => {
    const isIdle = key === 'idle';
    const facingKey = isIdle ? 'down' : key;
    const meta = FACINGS[facingKey];
    const b = el('button', 'dir-btn');
    if (isIdle) { b.classList.add('idle'); b.textContent = 'idle'; }
    else { b.textContent = meta.label; }
    if (!meta.canonical) b.classList.add('mirror');
    b.title = meta.canonical ? facingKey : `mirror of ${meta.mirrorOf}`;
    b.dataset.facing = facingKey;
    b.addEventListener('click', () => selectFacing(facingKey));
    pad.appendChild(b);
  });
  highlightDirpad();
}

function highlightDirpad() {
  document.querySelectorAll('.dir-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.facing === state.facing);
  });
}

const selectFacing = guarded(async (key) => {
  state.facing = key;
  state.selectedJoint = null;
  highlightDirpad();

  const meta = FACINGS[key];
  $('facingHint').textContent = meta.canonical
    ? `${key} · canonical`
    : `mirror of ${meta.mirrorOf} (locked)`;

  // mirror lock overlay on the rig canvas
  const lock = $('rigMirrorLock');
  if (meta.canonical) { lock.hidden = true; }
  else { lock.hidden = false; $('rigMirrorMsg').textContent = `mirror of ${meta.mirrorOf} — edit there`; }

  drawRig();
  renderJointList();
  // reset & restart preview for the new facing
  resetPlayer();
});

/* ---------------------------------------------------------------------------
   7. Rig editor canvas
   ------------------------------------------------------------------------- */

const rigCanvas = $('rigCanvas');
const rigCtx = rigCanvas.getContext('2d');
const cellImg = new Image();        // facing cell PNG
const overlayImg = new Image();     // parts overlay PNG
let cellReady = false, overlayReady = false;

cellImg.onload = () => { cellReady = true; drawRig(); };
overlayImg.onload = () => { overlayReady = true; drawRig(); };

/** Load images + size the canvas for the active facing. */
function loadRigImages() {
  const fd = facingData(state.facing);
  if (!fd) return;
  const [w, h] = fd.size || [96, 128];
  state.rig.cellW = w; state.rig.cellH = h;

  // display at a comfortable scale (cap to canvas-wrap width); keep cell-space mapping
  const wrap = $('rigCanvasWrap');
  const maxW = Math.max(120, wrap.clientWidth - 24);
  const scale = Math.max(1, Math.min(4, Math.floor((maxW / w) || 1)));
  state.rig.scale = scale;
  rigCanvas.width = w * scale;
  rigCanvas.height = h * scale;
  $('rigDims').textContent = `${w}×${h}`;

  cellReady = overlayReady = false;
  const src = sourceFacing();
  cellImg.src = (fd.cell_url || `/api/projects/${state.project.id}/cell/${src}.png`) + bust();
  const overlayUrl = fd.overlay_url || `/api/projects/${state.project.id}/overlay/${src}.png`;
  if (overlayUrl) overlayImg.src = overlayUrl + bust();
}

/** The facing key whose art we actually load (mirror resolves to its source). */
function sourceFacing() {
  const meta = FACINGS[state.facing];
  return meta && !meta.canonical ? meta.mirrorOf : state.facing;
}

/** Redraw cell + skeleton overlay. */
function drawRig() {
  if (!state.project) return;
  const fd = facingData(state.facing);
  if (!fd) return;
  const { scale } = state.rig;
  const isMirror = !FACINGS[state.facing].canonical;

  rigCtx.imageSmoothingEnabled = false;
  rigCtx.clearRect(0, 0, rigCanvas.width, rigCanvas.height);

  // mirror facings flip horizontally for an accurate preview
  rigCtx.save();
  if (isMirror) { rigCtx.translate(rigCanvas.width, 0); rigCtx.scale(-1, 1); }

  if (cellReady) rigCtx.drawImage(cellImg, 0, 0, rigCanvas.width, rigCanvas.height);
  if ($('showParts').checked && overlayReady) {
    rigCtx.globalAlpha = 0.55;
    rigCtx.drawImage(overlayImg, 0, 0, rigCanvas.width, rigCanvas.height);
    rigCtx.globalAlpha = 1;
  }
  rigCtx.restore();

  // skeleton overlay drawn in (un-mirrored) canvas space; joints are in cell coords
  const joints = fd.joints || {};
  drawBones(joints, scale, isMirror);
  drawJoints(joints, scale, isMirror);
}

// Bone connectivity (best-effort by common joint names; unknown joints just show as dots).
const BONES = [
  ['head', 'neck'], ['neck', 'pelvis'],
  ['neck', 'shoulderL'], ['shoulderL', 'elbowL'], ['elbowL', 'handL'],
  ['neck', 'shoulderR'], ['shoulderR', 'elbowR'], ['elbowR', 'handR'],
  ['pelvis', 'hipL'], ['hipL', 'kneeL'], ['kneeL', 'footL'],
  ['pelvis', 'hipR'], ['hipR', 'kneeR'], ['kneeR', 'footR'],
];

function toScreen(pt, scale, mirror) {
  const x = mirror ? (state.rig.cellW - pt[0]) : pt[0];
  return [x * scale, pt[1] * scale];
}

function drawBones(joints, scale, mirror) {
  rigCtx.strokeStyle = 'rgba(240,162,58,0.55)';
  rigCtx.lineWidth = Math.max(1.5, scale * 0.6);
  rigCtx.lineCap = 'round';
  BONES.forEach(([a, b]) => {
    if (!joints[a] || !joints[b]) return;
    const pa = toScreen(joints[a], scale, mirror);
    const pb = toScreen(joints[b], scale, mirror);
    rigCtx.beginPath();
    rigCtx.moveTo(pa[0], pa[1]); rigCtx.lineTo(pb[0], pb[1]);
    rigCtx.stroke();
  });
}

function drawJoints(joints, scale, mirror) {
  const r = Math.max(4, scale * 1.6);
  Object.entries(joints).forEach(([name, pt]) => {
    const [x, y] = toScreen(pt, scale, mirror);
    const sel = name === state.selectedJoint;
    rigCtx.beginPath();
    rigCtx.arc(x, y, r, 0, Math.PI * 2);
    rigCtx.fillStyle = sel ? '#F0A23A' : 'rgba(240,162,58,0.85)';
    rigCtx.fill();
    rigCtx.lineWidth = 2;
    rigCtx.strokeStyle = sel ? '#fff' : '#16151a';
    rigCtx.stroke();
  });
}

// --- joint dragging (canonical facings only) -------------------------------
let dragging = null; // joint name being dragged

function canvasToCell(evt) {
  const rect = rigCanvas.getBoundingClientRect();
  // account for CSS scaling of the canvas element
  const sx = rigCanvas.width / rect.width;
  const sy = rigCanvas.height / rect.height;
  const px = (evt.clientX - rect.left) * sx;
  const py = (evt.clientY - rect.top) * sy;
  return [px / state.rig.scale, py / state.rig.scale]; // back to cell pixel space
}

function hitJoint([cx, cy]) {
  const fd = facingData(state.facing);
  if (!fd) return null;
  const tol = 6; // cell-space pixels
  let best = null, bestD = tol * tol;
  Object.entries(fd.joints || {}).forEach(([name, pt]) => {
    const dx = pt[0] - cx, dy = pt[1] - cy, d = dx * dx + dy * dy;
    if (d < bestD) { bestD = d; best = name; }
  });
  return best;
}

rigCanvas.addEventListener('pointerdown', (e) => {
  if (!FACINGS[state.facing].canonical) return; // mirrors are locked
  const cell = canvasToCell(e);
  const hit = hitJoint(cell);
  if (hit) {
    dragging = hit;
    state.selectedJoint = hit;
    renderJointList();
    rigCanvas.setPointerCapture(e.pointerId);
    drawRig();
  }
});

rigCanvas.addEventListener('pointermove', (e) => {
  const cell = canvasToCell(e);
  $('rigCoordReadout').innerHTML =
    `joint: ${state.selectedJoint || '—'} &nbsp; x ${cell[0].toFixed(1)} y ${cell[1].toFixed(1)}`;
  if (!dragging) return;
  const fd = facingData(state.facing);
  // clamp to cell bounds
  const x = Math.max(0, Math.min(state.rig.cellW, cell[0]));
  const y = Math.max(0, Math.min(state.rig.cellH, cell[1]));
  fd.joints[dragging] = [Math.round(x), Math.round(y)];
  drawRig();
});

const endDrag = guarded(async (e) => {
  if (!dragging) return;
  const joint = dragging; dragging = null;
  try { rigCanvas.releasePointerCapture(e.pointerId); } catch (_) {}
  const fd = facingData(state.facing);
  const facingKey = sourceFacing();
  // persist just the moved joint
  const result = await api.put(`/api/projects/${state.project.id}/rig/${facingKey}`, {
    json: { joints: { [joint]: fd.joints[joint] } },
  });
  // backend returns authoritative joints/bbox/model — adopt them
  if (result && result.joints) { fd.joints = result.joints; if (result.bbox) fd.bbox = result.bbox; }
  drawRig(); renderJointList();
  toast(`Saved ${joint}`, 'ok');
  resetPlayer(); // rig changed → refresh preview frames
  // make the edit visible even when paused: hop to an animated pose
  if (!state.player.playing && curPoses.length > 1) {
    state.player.poseIdx = 1; $('poseScrub').value = 1; drawPreviewPose();
  }
});
rigCanvas.addEventListener('pointerup', endDrag);
rigCanvas.addEventListener('pointercancel', () => { dragging = null; });

const resetRig = guarded(async () => {
  const facingKey = sourceFacing();
  const result = await api.post(`/api/projects/${state.project.id}/rig/${facingKey}/reset`);
  const fd = facingData(state.facing);
  if (result && result.joints) { fd.joints = result.joints; if (result.bbox) fd.bbox = result.bbox; }
  drawRig(); renderJointList();
  toast('Rig reset', 'ok');
  resetPlayer();
});

/* ---------------------------------------------------------------------------
   8. Joint list (right inspector)
   ------------------------------------------------------------------------- */

function renderJointList() {
  const ul = $('jointList');
  ul.innerHTML = '';
  const fd = facingData(state.facing);
  if (!fd) return;
  Object.entries(fd.joints || {}).forEach(([name, pt]) => {
    const li = el('li', 'joint-row' + (name === state.selectedJoint ? ' active' : ''));
    const n = el('span', 'jname'); n.textContent = name;
    const c = el('span', 'jcoord'); c.textContent = `${pt[0]},${pt[1]}`;
    li.appendChild(n); li.appendChild(c);
    li.addEventListener('click', () => {
      state.selectedJoint = (state.selectedJoint === name) ? null : name;
      renderJointList(); drawRig();
    });
    ul.appendChild(li);
  });
}

/* ---------------------------------------------------------------------------
   9. Motion tuner
   ------------------------------------------------------------------------- */

function renderMotionSliders() {
  const wrap = $('motionSliders');
  wrap.innerHTML = '';
  const params = (state.project.params && state.project.params[state.motion]) || {};
  PARAM_FIELDS.forEach(([field, min, max]) => {
    const val = (params[field] !== undefined) ? params[field] : min;
    const row = el('div', 'slider-row');
    const head = el('div', 'slider-head');
    const name = el('span', 'slider-name'); name.textContent = field.replace(/_/g, ' ');
    const out = el('span', 'slider-val mono'); out.textContent = val;
    head.appendChild(name); head.appendChild(out);
    const input = el('input');
    input.type = 'range'; input.min = min; input.max = max; input.step = 1; input.value = val;
    input.dataset.field = field;
    input.addEventListener('input', () => {
      out.textContent = input.value;
      params[field] = Number(input.value);
      debouncedSaveParams();
    });
    row.appendChild(head); row.appendChild(input);
    wrap.appendChild(row);
  });
}

// debounce param writes ~250ms
let paramTimer = null;
function debouncedSaveParams() {
  clearTimeout(paramTimer);
  paramTimer = setTimeout(saveParams, 250);
}
const saveParams = guarded(async () => {
  const params = state.project.params[state.motion];
  const updated = await api.put(`/api/projects/${state.project.id}/params/${state.motion}`, { json: params });
  if (updated) state.project.params[state.motion] = updated[state.motion] || updated;
  // params changed → live preview should reflect it
  resetPlayer();
});

function selectMotion(motion) {
  state.motion = motion;
  document.querySelectorAll('.seg-btn[data-motion]').forEach((b) =>
    b.classList.toggle('active', b.dataset.motion === motion));
  renderMotionSliders();
  resetPlayer();
}

/* ---------------------------------------------------------------------------
   10. Live preview player
   ------------------------------------------------------------------------- */

const prevCanvas = $('previewCanvas');
const prevCtx = prevCanvas.getContext('2d');
const frameCache = new Map();   // url -> Image
let curPoses = [0];

function frameUrl(facing, motion, pose) {
  return `/api/projects/${state.project.id}/frame/${facing}/${motion}/${pose}.png`;
}

function loadFrame(url) {
  if (frameCache.has(url)) return Promise.resolve(frameCache.get(url));
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { frameCache.set(url, img); resolve(img); };
    img.onerror = () => reject(new Error('frame load failed'));
    img.src = url;
  });
}

/** Compute the pose list and reset the scrubber for the current facing+motion. */
function resetPlayer() {
  if (!state.project) return;
  curPoses = posesFor(state.facing, state.motion);
  state.player.poseIdx = Math.min(state.player.poseIdx, curPoses.length - 1);
  const scrub = $('poseScrub');
  scrub.max = curPoses.length - 1;
  scrub.value = state.player.poseIdx;
  loadRigImages();          // rig canvas image refresh too
  frameCache.clear();       // frames may have changed (cache-bust handled per-render)
  if (state.player.mode === 'gif') { loadPreviewGif(); }
  else { drawPreviewPose(); }
}

const drawPreviewPose = guarded(async () => {
  const facing = sourceFacing();
  const pose = curPoses[state.player.poseIdx];
  $('poseReadout').textContent = `f${state.player.poseIdx} · pose ${pose}`;
  const url = frameUrl(facing, state.motion, pose) + bust();
  let img;
  try { img = await loadFrame(url); }
  catch (_) { return; } // a single missing frame shouldn't spam toasts during a loop
  // fit image into canvas preserving aspect, mirrored if needed
  const isMirror = !FACINGS[state.facing].canonical;
  const cw = prevCanvas.width, ch = prevCanvas.height;
  const scale = Math.min(cw / img.width, ch / img.height);
  const dw = img.width * scale, dh = img.height * scale;
  const dx = (cw - dw) / 2, dy = (ch - dh) / 2;
  prevCtx.imageSmoothingEnabled = false;
  prevCtx.clearRect(0, 0, cw, ch);
  prevCtx.save();
  if (isMirror) { prevCtx.translate(cw, 0); prevCtx.scale(-1, 1); }
  prevCtx.drawImage(img, dx, dy, dw, dh);
  prevCtx.restore();
});

function tick() {
  state.player.poseIdx = (state.player.poseIdx + 1) % curPoses.length;
  $('poseScrub').value = state.player.poseIdx;
  drawPreviewPose();
}

function play() {
  if (state.player.playing) return;
  state.player.playing = true;
  $('playPauseBtn').textContent = '❚❚ pause';
  const interval = 1000 / state.player.fps;
  state.player.timer = setInterval(tick, interval);
}
function pause() {
  state.player.playing = false;
  $('playPauseBtn').textContent = '▶ play';
  clearInterval(state.player.timer);
}
function togglePlay() { state.player.playing ? pause() : play(); }

function setFps(v) {
  state.player.fps = v;
  $('previewFpsVal').textContent = v;
  if (state.player.playing) { pause(); play(); } // restart at new rate
}

function setPreviewMode(mode) {
  state.player.mode = mode;
  document.querySelectorAll('.seg-btn[data-mode]').forEach((b) =>
    b.classList.toggle('active', b.dataset.mode === mode));
  const gif = $('previewGif');
  if (mode === 'gif') {
    pause();
    prevCanvas.hidden = true; gif.hidden = false;
    loadPreviewGif();
  } else {
    gif.hidden = true; prevCanvas.hidden = false;
    drawPreviewPose();
  }
}

function loadPreviewGif() {
  const facing = sourceFacing();
  $('previewGif').src = `/api/projects/${state.project.id}/preview/${facing}/${state.motion}.gif${bust()}`;
}

/* ---------------------------------------------------------------------------
   11. Sheet preview + render
   ------------------------------------------------------------------------- */

function loadSheet() {
  const url = (state.project.sheet_url || `/api/projects/${state.project.id}/sheet.png`) + bust();
  $('sheetImg').src = url;
}

const rerender = guarded(async () => {
  toast('Rendering sheet…');
  const result = await api.post(`/api/projects/${state.project.id}/render`);
  if (result && result.sheet_url) state.project.sheet_url = result.sheet_url;
  loadSheet();
  frameCache.clear();
  resetPlayer();
  toast('Sheet re-rendered', 'ok');
});

function toggleSheet() {
  const head = $('sheetHead');
  const body = $('sheetBody');
  const collapsed = body.classList.toggle('hidden');
  head.classList.toggle('collapsed', collapsed);
}

/* ---------------------------------------------------------------------------
   12. Export
   ------------------------------------------------------------------------- */

function exportZip() {
  if (!state.project) return;
  // trigger a browser download via a transient anchor
  const a = el('a');
  a.href = `/api/projects/${state.project.id}/export.zip`;
  a.download = `${state.project.id}_cadence_export.zip`;
  document.body.appendChild(a); a.click(); a.remove();
}

const copyGamePath = guarded(async () => {
  const path = `assets/art/characters/${state.project.id}_anim_46_4x.png`;
  try { await navigator.clipboard.writeText(path); toast('Game path copied', 'ok'); }
  catch (_) { toast(path); } // fallback: at least show it
});

/* ---------------------------------------------------------------------------
   13. Dropzone wiring
   ------------------------------------------------------------------------- */

function setPendingFile(file) {
  if (!file) return;
  if (file.type !== 'image/png' && !file.name.toLowerCase().endsWith('.png')) {
    return toast('Please choose a PNG file', 'err');
  }
  state.pendingFile = file;
  const dz = $('dropzone');
  dz.classList.add('has-file');
  dz.querySelector('.dz-text').textContent = file.name;
  if (!$('newProjectName').value) $('newProjectName').value = file.name.replace(/\.png$/i, '');
  $('createBtn').disabled = false;
}

function wireDropzone() {
  const dz = $('dropzone');
  const input = $('fileInput');
  dz.addEventListener('click', () => input.click());
  dz.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') input.click(); });
  input.addEventListener('change', () => setPendingFile(input.files[0]));
  ['dragenter', 'dragover'].forEach((ev) =>
    dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('drag'); }));
  ['dragleave', 'drop'].forEach((ev) =>
    dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('drag'); }));
  dz.addEventListener('drop', (e) => {
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) setPendingFile(f);
  });
}

/* ---------------------------------------------------------------------------
   14. Boot
   ------------------------------------------------------------------------- */

function wireControls() {
  $('createBtn').addEventListener('click', createFromFile);
  $('loadJayBtn').addEventListener('click', createJay);
  $('newProjectName').addEventListener('input', () => {
    $('createBtn').disabled = !(state.pendingFile && $('newProjectName').value.trim());
  });
  $('projectList').addEventListener('change', (e) => openProject(e.target.value));

  $('showParts').addEventListener('change', drawRig);
  $('resetRigBtn').addEventListener('click', resetRig);

  $('tabWalk').addEventListener('click', () => selectMotion('walk'));
  $('tabRun').addEventListener('click', () => selectMotion('run'));

  $('playPauseBtn').addEventListener('click', togglePlay);
  $('previewFps').addEventListener('input', (e) => setFps(Number(e.target.value)));
  $('poseScrub').addEventListener('input', (e) => {
    pause();
    state.player.poseIdx = Number(e.target.value);
    drawPreviewPose();
  });
  $('modeFrames').addEventListener('click', () => setPreviewMode('frames'));
  $('modeGif').addEventListener('click', () => setPreviewMode('gif'));

  $('sheetHead').addEventListener('click', toggleSheet);
  $('rerenderBtn').addEventListener('click', (e) => { e.stopPropagation(); rerender(); });

  $('exportBtn').addEventListener('click', exportZip);
  $('copyPathBtn').addEventListener('click', copyGamePath);

  // redraw rig on resize so the cell-space mapping stays correct
  let rz = null;
  window.addEventListener('resize', () => {
    clearTimeout(rz);
    rz = setTimeout(() => { if (state.project) { loadRigImages(); } }, 150);
  });
}

function init() {
  wireDropzone();
  wireControls();
  checkHealth();
  refreshProjectList();
  setInterval(checkHealth, 15000); // keep the status dot honest
}

document.addEventListener('DOMContentLoaded', init);
