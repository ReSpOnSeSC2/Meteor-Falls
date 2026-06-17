# PKG-10 — Minigames: Hoops, Golf & Arcade

## Resolution target
The HD render is live: `ART_SCALE = 4` → **1600×900** framebuffer. Runtime cells
are **native × 4**; size source art to the 4× cell (a gentle reduction, not the
old 1× crush).

- Athletes / golfers (sport frames): 32×40 native → **128×160** runtime cells.
- Court / hole / world tiles: 16×16 native → **64×64** runtime cells.
- Ball, flag, FX, props, cabinet sprites: native object size → **×4** runtime.
- Full-screen art (arcade scanline overlay, court/links backdrops, links poster
  if full-frame) is authored at **1600×900**.

Frame sheets follow the same contract as the heroes — author every frame in the
exact grid the resheeter expects (athlete → 5 cols × 128×160, golfer → 4 cols ×
128×160; see [`../IMAGE_ASSET_MANIFEST.md`](../IMAGE_ASSET_MANIFEST.md) §19).

## A. Hoops (basketball) — ~10
`src/spritegen/athletes.ts` + court draws in `src/spritegen/tiles.ts`: athlete
frames (32×40 native / **128×160** runtime), ball, hoop/backboard, court tiles
(16×16 native / **64×64** runtime), cage mesh, bleachers, mural, chalkboard. Path
`assets/art/minigames/hoops/`.

## B. Golf / Links — ~25
`src/spritegen/golfers.ts` + `src/data/links.ts`: golfer swing frames (32×40
native / **128×160** runtime), **18 hole textures**, pin flag, golf ball,
splash/sand FX, links poster. Path `assets/art/minigames/golf/`.

## C. Arcade — ~7
`src/spritegen/arcade.ts`: ship, moth, rock, saucer, corndog, bolt, scanline
overlay. Path `assets/art/minigames/arcade/`.

## Acceptance
All three minigames' sprites authored and wired.
