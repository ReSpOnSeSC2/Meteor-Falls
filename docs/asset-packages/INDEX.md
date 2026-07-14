# Asset Work Packages — parallel production

The full art job (see [`../IMAGE_ASSET_MANIFEST.md`](../IMAGE_ASSET_MANIFEST.md))
was split into **17 self-contained packages** so multiple people/agents could
work in parallel. Each `PKG-NN.md` is standalone: scope, image checklist,
sizes, filenames, and engine wiring. Check its current status/supersession note
before starting; a production-closed package is a retained record, not a work
queue to rerun.

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
| 15 | Ch.8 China — completed production package (ADR-143) | closed retained set + additions | — |
| 16 | Ch.9 Romania — retained package + completed production remediation | retained set + 25 runtime edits / 25 masters | — |
| 17 | Ch.10 Alaska/Hawaii/Mars finale | ~140 | — |

The packages were designed to be **independent**: open packages can run in
parallel without blocking one another. Packages 11–17 originated from the same
per-region template (§18 of the manifest), but newer chapter ADRs supersede its
historical quotas. In particular, closed Chapters 8 and 9 are records, not open
parallel assignments; 01–10 remain the global/cross-chapter briefs.

> **PKG-16 supersession (ADR-144, 2026-07-14):** Chapter 9 is not a blank
> ~110-image region bundle. Its Romania strip, eight facades, four strict-clean
> NPC sheets, background, enemy/mini bases, train, and source compositions are
> retained; nine live villagers reuse the four sheet identities. Its completed
> remediation adds fourteen branch-truthful contextual runtime panels with
> fourteen source masters plus eleven distinct wear corrections with eleven
> generated masters. PKG-16 is production-closed; see
> [`PKG-16-ch9-Romania.md`](PKG-16-ch9-Romania.md).

## Shared rules (every package)

- **Render target:** the game framebuffer is **1600×900**, nearest-neighbor
  (`ART_SCALE = 4` in `src/spritegen/scale.ts`). Runtime cells are **native × 4**
  (tile 16→64, char 24×32→**96×128**, bust 32×32→128×128, battler 28×36→112×144,
  sport 32×40→128×160); full-screen art (screens + cutscene panels) is **1600×900**.
  **Author at the highest resolution you can** and let the pipeline downscale, so
  masters survive a future resolution bump. Keep transparent backgrounds (PNG-32).
- **Palette:** match the existing art direction (`docs/ART_DIRECTION_REBOOT.md`,
  the EarthBound/Mother-2 bar). Battle sprites float shadowless; overworld
  sprites cast the engine shadow.
- **Wiring:** every PNG registers through `src/spritegen/authored.ts`
  (`preloadAuthoredArt` → `applyAuthoredArt`). Add the file, add one list entry.
- **Animations — include every frame.** If a slot is engine-**animated**, the PNG
  must be a **full frame sheet**, not a single still (a one-frame image reads as a
  frozen pose). The frame-animated slots and their exact layouts:
  - **Overworld characters → 46 frames, 4 cols × 12 rows, 96×128 per frame**
    (24×32 native × 4; idle breathe/blink + walk ×8 dirs + run ×8 dirs).
  - **Hero busts → 18 frames (128×160)** · **Hero battlers → 14 frames (112×144).**
  - New animated props/FX (angel float, glint, dog, songbird…) ship their loop
    frames. **Enemies are single-image** (the engine bobs them with a tween) — do
    not frame-animate them. Icons/tiles/facades/vehicles/font are static.
  - Full contract + the current frame audit: see **§19** of
    [`../IMAGE_ASSET_MANIFEST.md`](../IMAGE_ASSET_MANIFEST.md).
- **Source of truth** for ids is always the code (`src/data/*`,
  `src/spritegen/*`) — the checklists here are extracted snapshots.
