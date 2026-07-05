# Game-wide EarthBound OBLIQUE overhaul — progress tracker

The whole game is being rebuilt in the EarthBound 3/4 **oblique** style (buildings show front +
right side; ground is EB-flat with depth cues; the "diagonal" is baked into ART on a straight
grid — NOT an isometric engine). Pipeline, proven on Otterbrooke: **generate a green-screen /
magenta-gridded sheet via ChatGPT → slice → wire → gate (tsc · validate · vitest · build) →
live-verify.** (Claude drives ChatGPT for ALL generation — user directive 2026-07-05.)

Tools: `tools/slice-oblique-facade.ts` (border-flood green key → crop → 384px, for buildings) ·
`tools/apply-oblique-ground.ts` (3×3 magenta ground → strip + path overwrite) · the apply-*-kit
family for tile-strip writes.

## PHASE 1 — TILESETS (in progress)

- [x] **Otterbrooke ground** — grass/road/sidewalk/crosswalk/dirt (3×3), skinned + `:` paths fixed.
- [x] **BASE outdoor kit** (global) — 4×4 kit generated + installed via `tools/apply-base-ground.ts`;
      OVERWROTE the shared tiles grass_a/grass_b/grass_tuft/road/road_dash/crosswalk/sidewalk/sand_a/
      sea_a/dock/plaza in the strip, so every un-skinned map's ground is now oblique EB. Source =
      `assets/art/masters/world/base-ground-oblique-source.png`. Otterbrooke ground skin removed
      (shares the base now). Gates green.
- [x] Norway (Kvisthavn) — pebbled snow / cobbled quay / rock cliff / fjord water (2×2). Wired via
      `tools/apply-biome-kit.ts <src> norway_ground norway_path norway_wall norway_water` (the reusable
      biome installer — overwrites the biome's strip tiles from a magenta NxN sheet). Source
      `norway-oblique-source.png`.
- [x] **Africa (Ch6)** — one 3×3 kit covers Zanzibel + Savanna + Ruins: `africa_sand/path/wall/water/
      earth/ruin_wall/grass`. Source `africa-oblique-source.png`.
- [x] **Lotus Harbor (Ch8 China)** — `china_ground/path/wall`. Source `china-oblique-source.png`.
- [x] **Valea Stelelor (Ch9 Romania)** — `romania_ground/path/wall`. Source `romania-oblique-source.png`.
- [x] **Minimus (Ch5)** — `minimus_turf/cobble/hedge`. Source `minimus-oblique-source.png`.
- [x] **Aurora (Ch10 ice)** — `aurora_ground/path/wall`. Source `aurora-oblique-source.png`.
- [x] **Mauna Lani (Ch10 tropical)** — `lani_ground/path/wall`. Source `lani-oblique-source.png`.
- [x] **Mars (Ch10)** — `mars_ground/path/wall`. Source `mars-oblique-source.png`.
- ~~Foggybottom / Puerto Sol~~ — use the shared BASE tiles (already upgraded); no separate kit needed.
- [ ] **Brickton** — has its OWN tile strip (`brickton-tiles-source.png` / a separate strip), so it's a
      separate apply pass (not otterbrook_tiles_16). TODO.
- [ ] Interior tile skins — pharmacy/civic/kitchen/concrete + wood/wall, oblique to match exteriors. TODO.

**PHASE 1 STATUS: all shared-strip biome ground kits DONE (base + 7 biome sets). Remaining: Brickton's
own strip + interior tile skins.** All gated green (tsc/strip-pin/build).

## PHASE 2 — PROPS (pending)
Trees/foliage, fences, lamps, benches, hydrants, mailboxes, cars/traffic, signs, market stalls,
furniture — oblique re-authors of the AUTHORED_WORLD_PROP_DISPLAY_SIZE / WORLD_PROP_KEYS sets.

## PHASE 3 — CHARACTERS (pending)
The 46-frame walk sheets (heroes + NPCs) re-authored oblique/8-dir where needed (heavier: ref-paste
pipeline, `docs/ART_PIPELINE.md` § Character 46-frame walk sheets).

## PHASE 4 — ENEMIES (pending)
Battler art (+ wear frames) + derived overworld minis, EB-styled.

## Otterbrooke (Ch.1) — DONE reference
23 oblique facades + oblique ground kit + `:` paths fixed + building contact shadows + tan cliffs +
walk-behind + parallax night sky + cave-gated-by-shed + winding crater climb. All gated green.
Oblique facade sources live in `assets/art/masters/world/facades-oblique/`.
