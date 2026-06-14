# Asset Work Packages — parallel production

The full art job (see [`../IMAGE_ASSET_MANIFEST.md`](../IMAGE_ASSET_MANIFEST.md))
split into **17 self-contained packages** so multiple people/agents can work in
parallel. Each `PKG-NN.md` is standalone: scope, exact image checklist, sizes,
filenames, and how it wires into the engine. Pick a package, produce its PNGs,
drop them in the listed `assets/art/...` path, add the one-line entry to the
matching list in `src/spritegen/authored.ts`.

## Packages

| # | Package | ~Images | Depends on |
|---|---|---:|---|
| 01 | Opening, title & all cinematics | ~95 | — |
| 02 | Item icons — batch A | 157 | — |
| 03 | Item icons — batch B | 157 | — |
| 04 | Item icons — batch C | 155 | — |
| 05 | Abilities, status & battle FX | ~144 | — |
| 06 | UI chrome, font, glyph banners, Locket UI | ~40 | — |
| 07 | All vehicles & held weapons/charms | ~115 | — |
| 08 | Heroes — full overworld + battle frames | ~250 frames | — |
| 09 | Existing NPCs + Ch.1–3 world polish | ~200 | — |
| 10 | Minigames — Hoops, Golf, Arcade | ~42 | — |
| 11 | Ch.4 Norway — full region bundle | ~110 | — |
| 12 | Ch.5 Minimus — full region bundle | ~110 | — |
| 13 | Ch.6 Africa — full region bundle | ~110 | — |
| 14 | Ch.7 India — full region bundle | ~110 | — |
| 15 | Ch.8 China — full region bundle | ~110 | — |
| 16 | Ch.9 Romania — full region bundle | ~110 | — |
| 17 | Ch.10 Alaska/Hawaii/Mars finale | ~140 | — |

All packages are **independent** — no package blocks another, so all 17 can run
at once. Packages 11–17 each follow the same per-region template (§18 of the
manifest); 01–10 are the global/cross-chapter art.

## Shared rules (every package)

- **Render target:** the game framebuffer is **400×225**, nearest-neighbor.
  Sizes below are that low-res target. **Author at the highest resolution you
  can** and let the pipeline downscale, so masters survive a future resolution
  bump. Keep transparent backgrounds (PNG-32).
- **Palette:** match the existing art direction (`docs/ART_DIRECTION_REBOOT.md`,
  the EarthBound/Mother-2 bar). Battle sprites float shadowless; overworld
  sprites cast the engine shadow.
- **Wiring:** every PNG registers through `src/spritegen/authored.ts`
  (`preloadAuthoredArt` → `applyAuthoredArt`). Add the file, add one list entry.
- **Source of truth** for ids is always the code (`src/data/*`,
  `src/spritegen/*`) — the checklists here are extracted snapshots.
