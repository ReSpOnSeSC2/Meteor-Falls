# Otterbrooke Hill — Track-B Art Spec (crater + cave)

*Companion to the 2026-07-04 hill rebuild (`growOtterbrook` + the `oak_*` cave chain). The
CODE recompose is shipped (round crater bowl, two clear trails, cave retheme + guide-lights);
this doc is the **authored-art** half you generate on chatgpt.com, per
[`docs/ART_PIPELINE.md`](ART_PIPELINE.md) (ChatGPT → PNG → slice → wire `authored.ts`). Each
asset OVERRIDES a key that already renders as a gray-box, so the game keeps working until the
PNG lands, then you swap it in with no code change.*

**Visual target:** `assets/art/masters/world/otterbrook-CONCEPT-locked.png` — the dark round
crater with the segmented black meteor sphere (top-right), and the wooded hilltop cave mouth
(top-left). Match that image's read; do NOT pixel-copy EarthBound.

---

## A. THE CRATER CRASH-SITE

The grid now paints a **round scorched bowl** (an ellipse of `s`/`S` tiles, centered on the
meteor at tile 72,7). Two authored pieces make it match the concept:

### A1. `meteor_sphere` — the hero (overrides `meteor_rock_hickory_hill`)
| | |
|---|---|
| Overrides key | `meteor_rock_hickory_hill` (currently the gray meteor prop at crest tile 72,7) |
| Runtime target | ~10 tiles wide (≈640px). Author at masters res per ART_PIPELINE §props (≈1024²), slice/downscale with `tools/slice-prop-strip.cjs <src> meteor_sphere --expect=1 --target=640` |
| Wire | rename the sliced PNG to the existing key `meteor_rock_hickory_hill` (drop-in, no code change) OR add `meteor_sphere` to `WORLD_PROP_KEYS` + `AUTHORED_WORLD_PROP_DISPLAY_SIZE` and repoint the prop in `maps.ts` |

**ChatGPT prompt** (paste the CONCEPT image as the reference first, to lock the look):
> "A large fallen meteor as a **segmented black-and-charcoal sphere** — faceted plates like a
> geodesic ball, deep matte black with a few glowing orange-red ember seams in the cracks
> between plates. Top-down / slightly-oblique game-object view, EarthBound-flat shading with a
> soft rim light, sitting still (already landed). Transparent (or magenta `#FF00FF`) background,
> centered, one object. No crater ground under it — just the sphere."

### A2. `crater_bowl` — the ground dressing (optional but recommended)
A single wide PNG laid UNDER the meteor to give the bowl its cracked, radial-scorch look
(the concept's dark ring). Placed as a prop centered at tile 72,11.
| | |
|---|---|
| New key | `crater_bowl` → `WORLD_PROP_KEYS` + `AUTHORED_WORLD_PROP_DISPLAY_SIZE` (add a prop `{ sprite:'crater_bowl', x:55, y:4 }` to `growOtterbrook` hillProps, BELOW the meteor in array order so it draws behind) |
| Runtime target | ~34×17 tiles (≈2176×1088) — it spans the whole bowl (grid cols 55–89, rows 3–19) |

**Prompt:** *"A shallow round impact crater seen top-down: a dark scorched depression with
**radial cracks** spidering out from the center, charred black-to-ash-gray gradient, faint
ember glow in the deepest cracks, a raised dirt rim. Elliptical (about 2:1 wide-to-tall for the
oblique view). EarthBound-flat. Transparent background, one piece."*

> If you'd rather not author a 2k-wide prop, skip A2 — the code's `s`/`S` tile bowl + A1's
> sphere already read as a crash. A2 is the polish that makes it look painted.

---

## B. THE HILLTOP CAVE (the `oak_*` chain — `oak_roots` / `oak_hollow` / `oak_heart`)

The chain is retheme'd in code from "Under-Oak roots" to **HICKORY HILL CAVE** (a meteor-punched
cave; names + all directional dialogue fixed). The maps still use the oak-era props
(`root_curtain`, `root_knot`, `glow_shroom`, `tree_c` "root columns"). Author a **carved-stone
cave kit** so it reads as rock, not a tree's roots. The room grids are already `K` (rock wall) +
`s` (dark floor) — this kit dresses them.

### B1. Tile skin `tile_cave` (floor + wall) — the tile-strip override
Author a floor+wall recolor and append it to the interior tileset via the **tile-strip override
pipeline** (never re-pack; append at the `TILESET` tail + one strip column + run the matching
`apply-*-kit`). Then apply it to `oak_roots`/`oak_hollow`/`oak_heart` via a per-map `TILE_SKIN`
in `OverworldScene.buildTiles` (mirror `UNDEROAK_TILE_SKIN`).
- **floor:** damp dark-stone, faint blue-gray, a few cracks + wet sheen.
- **wall:** rough carved rock face, cooler than the scorched-brown `K`.

### B2. Cave formation props (a magenta prop-strip → `slice-prop-strip.cjs`)
Replace the oak props with cave-native fixtures. Author one magenta strip, slice with
`tools/slice-prop-strip.cjs <src> cave --expect=6 --target=256`, register each in
`WORLD_PROP_KEYS` + `AUTHORED_WORLD_PROP_DISPLAY_SIZE`, then swap the prop keys in the three
`buildOak*` functions.

| New key | Replaces | Description (EarthBound-flat, magenta bg) |
|---|---|---|
| `stalactite` | `root_curtain` (ceiling) | icicle-like rock spike hanging from the ceiling |
| `stalagmite` | `root_knot` (solid floor) | squat rock cone rising from the floor (keep the solid box) |
| `cave_crystal` | `glow_shroom` | a small glowing blue-white crystal cluster (the guide-lights) |
| `cave_crystal_b` | `glow_shroom_b` | a larger amber crystal cluster |
| `rubble_pile` | (new dressing) | a heap of blasted rock + meteor shards |
| `meteor_shard` | `tree_c` "root columns" in `oak_heart` | a black meteor fragment jutting from the floor (the Tick nests on these) |

### B3. The light-shaft (optional hero, `oak_heart`)
A single god-ray prop for the boss chamber — where the meteor punched through to open sky.
| | |
|---|---|
| New key | `cave_lightshaft` (drawn ABOVE the floor, below the meteor mound) |
| Prompt | *"A soft volumetric shaft of pale daylight falling through a hole in a cave ceiling, dust motes drifting, hitting a dark stone floor. Semi-transparent, additive-looking. Transparent background."* |

---

## Wiring checklist (per asset)
1. Author the PNG on chatgpt.com (paste the concept/reference first for the crater; describe for the cave).
2. Slice/downscale with the `tools/slice-*` command noted above.
3. Register the key in `authored.ts` (`WORLD_PROP_KEYS` + `AUTHORED_WORLD_PROP_DISPLAY_SIZE`,
   or the tile strip for `tile_cave`). Aspect-match the display `{w,h}` to the sliced art.
4. For drop-in overrides (`meteor_rock_hickory_hill`), just match the existing key.
5. `npm run validate` (authored_assets + hi-res-facades laws) → live-verify in a **foreground**
   window (the throttled preview stalls the asset loader on reload).
