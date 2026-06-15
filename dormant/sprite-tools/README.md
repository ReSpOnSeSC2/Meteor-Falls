# Dormant — sprite-generation tooling (PARKED, do not use)

These are the **old procedural sprite/asset render tools** — the former
`npm run art:*` scripts. They were moved out of `tools/` on **2026-06-14**
because art is now **authored as PNGs** (ChatGPT/imagegen → PNG at the
`assets/art/masters` resolution), not generated from code.

See [`/CLAUDE.md`](../../CLAUDE.md) and [`docs/ART_PIPELINE.md`](../../docs/ART_PIPELINE.md)
for the current workflow.

## Status

- **Kept, not deleted** — parked here for reuse in a separate program.
- **Excluded from the build** — not in `tsconfig.json` `include`, and the
  `art:*` npm scripts (except `art:appart`, the Android icon/splash copier,
  which is **not** a sprite generator and stayed in `tools/`) were removed.
- **Not the way to add game art.** Do not run these to produce sprites for the
  game. Author a PNG and wire it into `src/spritegen/authored.ts` instead.

## Notes for reviving them

Their import paths were rewritten for this folder depth
(`../src/...` → `../../src/...`). They still reach into the live `src/spritegen`
draw code, so they only run against this repo as-is. Run with:

```
npx vite-node dormant/sprite-tools/<tool>.ts
```

## Contents

`render-buildings`, `render-vehicles`, `render-minigames`, `render-icons`,
`render-combat-icons`, `render-glyphs`, `render-flair`, `render-ui`,
`render-pkg01`, `render-pkg07`, `render-pkg08`, `render-pkg09`, `cast-sheet`,
`cast-compare`, `forge-faces`, `proto-hero`, `proto-snes`, `diag-preview`, and
the shared `png.ts` helper.
