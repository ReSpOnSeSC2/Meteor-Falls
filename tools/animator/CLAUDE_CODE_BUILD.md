# Cadence — Claude Code Build Sequence (multi-agent, no mock data)

You're building **Cadence**: a local, free, offline desktop+mobile tool that turns ONE
8-direction character sheet into game-ready animated sprite strips by **rigging and moving
the character's own pixels** (cutout/puppet rig) — **no generative AI, no paid APIs, ever**.

A validated proof-of-concept engine already exists: **`procedural_rig.py`** (drop it in the repo
root). It slices an 8-dir sheet, heuristically segments each facing into `body/legL/legR/armL/armR`
with pivots, applies authored motion (step model for front/back, stride model for sides),
renders cycles, anchors + downscales to 96×128, and emits Phaser strips + atlas + snippet.
**The full app wraps this engine in an interactive rigger + animator + exporter.** Do not rewrite
the engine math from scratch — extend it.

## How to run this sequence
- Paste prompts **in order**. Prompts marked `‖ PARALLEL` may be dispatched to **subagents
  simultaneously** once their dependencies are met. Use as many subagents as the task allows.
- **Hard rules for every prompt** (repeat them to each subagent):
  - **No mock data, no placeholders, no stubbed returns.** Every feature is wired to the real
    engine and real files. If something can't be real yet, build the real thing or stop and say so.
  - **No paid/network APIs.** Everything runs locally and offline (Pillow + numpy + a local server).
  - Real test fixtures only — use an actual 8-dir sheet (e.g. `fixtures/jay_standing_8dir.png`).
  - Strict typing + lint (mirror Jonathan's usual toolchain: ESLint type-aware rules,
    `noUncheckedIndexedAccess`, zod for any boundary, ruff/mypy on Python).
  - Git-first: small commits, protected `main`, conventional commits.
- **Stack:** Python **FastAPI** backend (hosts the engine + file IO) + **React + Vite + TypeScript**
  frontend (responsive; desktop primary, Android via LAN, optional Capacitor wrap later).
  The interactive rig canvas uses HTML5 Canvas. State in React (no external DB needed; rigs persist
  as JSON on disk in a `projects/` dir).

---

### Prompt 0 — Scaffold & contracts
> Create the Cadence monorepo: `/backend` (FastAPI, Python 3.11, Pillow, numpy, uvicorn, ruff, mypy,
> pytest) and `/frontend` (Vite + React + TS + Tailwind, ESLint type-aware, vitest, Playwright).
> Add `procedural_rig.py` to `/backend/engine/` unchanged as the engine baseline. Define the shared
> API contract in `/backend/schemas.py` (pydantic) AND mirror it in `/frontend/src/api/types.ts`
> (zod-validated): `Project`, `Cell`, `RigParts` (5 masks as RLE or polygon), `Pivots`,
> `MotionParams`, `RenderRequest`, `RenderResult` (strip paths, atlas JSON, fps, frame rects).
> Add `run.sh` (boots backend on 0.0.0.0:8000 + prints LAN URL, then frontend dev server) and a
> README with desktop + Android-over-LAN instructions. Set up git with protected main + commitlint.
> Acceptance: `run.sh` starts both servers; `GET /api/health` returns engine + Pillow versions;
> typecheck + lint pass on both sides.

### Prompt 1 — Backend engine service & API  `(depends: 0)`
> Wrap the engine in a FastAPI service. Endpoints, all returning real data from the engine:
> `POST /api/projects` (create from uploaded sheet → auto-slice via `slice_sheet`, persist cells to
> `projects/{id}/cells/*.png`, return `Cell[]` with detected facing labels S/SW/W/NW/N/NE/E/SE);
> `POST /api/projects/{id}/segment` (run `segment` per cell → return parts as polygons + pivots +
> band metadata); `PUT /api/projects/{id}/rig/{dir}` (persist user-corrected parts/pivots);
> `POST /api/projects/{id}/render` (RenderRequest → run `render_cycle` + `to_strip` + `phaser_atlas`
> for the given dir+motion+frames, write strip/gif/atlas to `projects/{id}/out/`, return paths);
> `GET /api/projects/{id}/export.zip` (bundle all rendered strips + atlases + Phaser snippets).
> Mount `projects/` as static. Refactor `segment`/`render_cycle` to accept user-overridden parts &
> pivots (so the UI can replace the heuristic output). Add an optional `rembg` fallback path used
> ONLY when an uploaded sheet has no alpha (local model, still free/offline; lazy-import).
> Acceptance: pytest drives the full create→segment→render→export flow on the real Jay fixture and
> asserts an 8-frame 96×128 strip + valid Phaser atlas come out. No mocks.

### Prompt 2 — Frontend shell & design system  `‖ PARALLEL (depends: 0)`
> Build the app shell with a deliberately non-generic look (read and apply the `frontend-design`
> skill). Direction: dark "studio/control-room" theme, near-black warm neutrals, ONE confident
> accent (molten amber `#F0A23A`), hairline borders not big shadows, small radii (2–6px),
> **Bricolage Grotesque** for the wordmark/titles, **IBM Plex Sans** for UI, **IBM Plex Mono** for
> technical readouts (dimensions, frame counts, fps, status). No purple, no gradients on buttons,
> no emoji. Layout = real tool: top bar (wordmark + engine status + project name), left control rail,
> main canvas/preview area. Fully responsive: rail collapses to a sheet on mobile; canvas stays
> usable on a phone. Build reusable primitives: SegmentedControl, DirectionPad (3×3 compass),
> Chip, Slider, Dropzone (with checkerboard transparency preview), Button (solid amber primary,
> ghost secondary). Acceptance: Storybook/Ladle (or a `/kit` route) shows every primitive; passes
> axe a11y; looks clean at 360px and 1440px.

### Prompt 3 — Interactive rigger canvas  `(depends: 1, 2)`
> Build the rig editor (the core UX). For a selected direction: load the cell on a Canvas over a
> checkerboard; overlay the engine's segmentation as color-coded, semi-transparent part regions
> (body/legL/legR/armL/armR) with draggable pivot handles (hips, shoulders, pelvis). Tools:
> (a) **reassign brush** — paint pixels to a part; (b) **band sliders** — adjust leg-top % and
> arm-band %/width and re-run `segment` live; (c) **split nudger** — drag the leg-split line;
> (d) **pivot drag**. Everything writes back via `PUT /rig/{dir}` and re-renders the preview.
> Persist per-direction rigs to disk. Acceptance: on the Jay fixture, a user can fix a mis-grabbed
> arm and move a hip pivot, and the change is reflected in the next render. Undo/redo works.

### Prompt 4 — Animator preview & motion library  `‖ PARALLEL (depends: 1, 2)`
> Build the live animation player + motion editor. A Canvas plays the rendered frames in a loop on a
> checkerboard with an FPS slider, play/pause, and a frame scrubber. A motion library panel exposes
> walk and run(+lean) plus add idle, sprint, jump as editable presets; each motion has the engine's
> params (step/bob/arm/knee/crouch for the step model; leg/arm/lift/bob/lean for the stride model)
> as sliders, plus frame count (4–12) and loop toggle. Changing a param calls `/render` (debounced)
> and updates the preview. Per-direction **model selector** (step / stride / blend) with sensible
> defaults from `DIRECTION_MODEL`. Acceptance: tuning run "lean" on a side direction visibly changes
> the preview; presets persist; the player loops cleanly with no fl__icker.

### Prompt 5 — Export & Phaser integration  `‖ PARALLEL (depends: 1)`
> Build the export panel: per direction+motion, show the 96×128 strip, a "Copy Phaser code" button
> (uses `phaser_snippet`), and download buttons for strip PNG + atlas JSON. A "Build all" action
> renders every selected direction×motion and produces `export.zip`. Also generate a single combined
> **character atlas** (all directions/motions packed into one sheet + one Phaser atlas with named
> animations like `walk_s`, `run_e`) and a tiny copy-paste Phaser scene that registers every
> animation. Target sprite size configurable (default 96×128). Acceptance: the zip imports into a
> blank Phaser 3 project and all animations play from the generated scene file — verify in a headless
> Phaser test.

### Prompt 6 — 8-direction + mirroring + per-direction tuning  `(depends: 3, 4)`
> Wire the full 8-direction workflow. DirectionPad selects the active facing; a status grid shows
> which of the 8 are rigged/rendered. Add a **mirror** feature: mark W/SW/NW as horizontal mirrors of
> E/SE/NE (or vice-versa) so the user only rigs ~5 facings and the engine flips strips for the rest
> (flip frames + remap pivots; verify the walk reads correctly mirrored). Tune the per-direction
> motion models so front/back use the step model, sides use stride (with lean), diagonals use a
> calibrated blend; expose all as the UI from Prompt 4. Acceptance: from the Jay sheet, the user
> produces all 8 directions of walk + run with only 5 manual rigs, and each direction looks correct
> (front/back = stepping, sides = leaning stride, diagonals = believable blend).

### Prompt 7 — Optional face-expression layer  `‖ PARALLEL (depends: 3)`
> Add an optional "head/face swap" slot per character: the user can drop in an alternate head crop
> (e.g. a determined face drawn separately) that replaces the `body`'s head region for a chosen
> motion (e.g. run), aligned to the detected head bbox. Pure compositing, no generation. If no
> alternate is provided, motions use the original face. Acceptance: dropping a determined-face crop
> swaps it cleanly in the run preview at 96×128; toggling reverts.

### Prompt 8 — QA, fixtures, and packaging  `(depends: all)`
> Dispatch a QA subagent: pytest covers the engine + API on the real Jay fixture (slice count,
> strip dims, atlas validity, mirror correctness); Playwright covers create→rig-correct→tune→
> build-all→download on real data. Add a second real fixture (a different body proportion) to catch
> overfitting to Jay. Then package: `make dev`, `make build`, a one-command launcher; README with
> desktop + Android-over-LAN + optional Capacitor wrap (point the WebView at the LAN backend).
> Acceptance: clean checkout → one command → working app; full e2e suite green; zero mock data
> anywhere in the codebase (grep for "mock"/"TODO"/"placeholder" returns nothing in shipped paths).

---

## Notes the agents should respect
- The engine's heuristic segmentation is a **first pass on purpose** — the rigger UI (Prompt 3) is
  what makes it production-clean. Don't try to make segmentation perfect; make correction fast.
- Front/back views animate by **stepping** (legs lift), side views by **stride rotation** (legs
  rotate about the hip + body leans). This is the key correctness rule — bake it into defaults.
- Registration matters: every frame must share one canvas with **bottom-center (feet) anchoring** so
  the sprite never jitters in-engine. The engine's `to_strip` already does this — preserve it.
- Keep everything free + offline. The only optional model is local `rembg`, used solely when an
  uploaded sheet lacks transparency.
