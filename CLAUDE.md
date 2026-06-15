# Meteor Falls — agent instructions

## Art is AUTHORED, not generated (read this first)

All sprites and art are **authored as PNGs** via the ChatGPT / imagegen → PNG
workflow. Source art is produced at the resolution of **`assets/art/masters/`**
(the high-res source of truth), then sliced/downscaled into runtime sheets under
**`assets/art/**`** and loaded by **`src/spritegen/authored.ts`**.

**To add or change any sprite:**
1. Author/update the master PNG in `assets/art/masters/` at the masters
   resolution (see [`docs/ART_PIPELINE.md`](docs/ART_PIPELINE.md) for per-category sizes).
2. Slice/export the runtime PNG into the right folder under `assets/art/...`.
3. Wire it into `src/spritegen/authored.ts` (it overrides the boot textures).

**Do NOT:**
- ❌ Do **not** write or extend procedural sprite generators. `src/spritegen/`
  is **FROZEN** — it exists only as the boot/build fallback for art that does
  not yet have an authored PNG. Never add a new `draw*`/generator function to
  produce game art.
- ❌ Do **not** use the parked tooling in `dormant/sprite-tools/` (the old
  `npm run art:*` render scripts). It is retired and kept only for reuse in a
  separate program.

See [`docs/ART_PIPELINE.md`](docs/ART_PIPELINE.md) for the full pipeline and
[`docs/GAME_BIBLE.md`](docs/GAME_BIBLE.md) for the design bible.

## Build / test

- `npm run dev` — run the game (Vite dev server).
- `npm run build` — typecheck (`tsc --noEmit`) + content validation + Vite build.
- `npm test` — content validation + unit tests (vitest).
- `npm run validate` — content validation only.
