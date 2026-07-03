# Wilderness Design Language — routes, overworld corridors & elevation

Guides the re-layout of **wilderness / route / connector maps** and the forest-belt
skeleton of settlement maps (`src/data/maps*.ts`). It is the outdoor sibling of
`docs/CITY_DESIGN_LANGUAGE.md` (cities) — read that for street hierarchy; read THIS for the
land between and around places. Part of the World Overhaul program
(`docs/WORLD_OVERHAUL_HANDOFF.md`). BINDING: every wilderness/route implementer reads it first.

**The symptom this fixes:** bare snake-paths on an open grass rectangle — a 2-wide `:` line
from one edge to another, a tree sprinkled here and there, nothing to find, the whole map
legible at a glance. Routes read as "a corridor with encounters," not a place you explore.

## 0. The bar (EarthBound wilderness, user directive 2026-07-03)

Every wilderness/route map is a **scrap-and-rebuild** to the regional bar, same as settlements
(≈126×96 where the fiction allows; smaller pockets like a resonance site stay small but still
get the grammar). The standard:

- **Zones as clearings, hidden by belts.** The map is a chain of CLEARINGS (a glade, a pond
  hollow, a ruin court, a farm edge) separated by **solid forest/hedge/bramble BELTS**. You
  cannot see the next clearing until you emerge from a belt's ONE **winding connector cut**.
  This is the Otterbrook regional grammar (`growOtterbrook`, `src/data/maps.ts`) — study it.
- **Winding, never ruler-straight.** Trails/roads/rivers are painted from hand-authored
  CENTER-TABLES (`windV`/`windH`, `maps.ts`), never a `g.rect` line. A trail bends, doglegs,
  and widens into clearings.
- **Linear but open: branch and reward wandering.** One legible story spine, but **forks,
  dead-ends, peninsulas, scenic overlooks, and secret pockets** off it — each pocket pays out
  (a chest via `walkPresent`, a lore sign, a shortcut, a rare-spawn nook, a picnic).
- **Staged biome transitions.** Where a region meets another (town→wild, meadow→deep wood,
  grass→shore), FEATHER it: scattered trees → treeline → dense brush → open field, using the
  sapling/shrub **foliage-fade** tiles — never a hard bush line or an abrupt map edge.
- **A timid diff is a defect.** If before/after renders look like siblings, redo it.

## 1. Hard rails (violating any fails tests or play)

| Rail | Rule |
|---|---|
| Determinism | All jitter via `seededRng`/`Streams` local to the builder. No `Math.random`/`Date`. |
| Reachability | The spine + every pocket, sign, picnic, spawner rect, and door landing is BFS-reachable (`mapcheck`). A belt must never seal a mandatory path. |
| Body box | Player ≈40×36px. Any corridor the player must cross: **≥3 tiles wide, 4 preferred.** Scenery-only gaps may be narrower. Never a 1-wide mandatory cut. |
| Belt integrity | A "hidden" belt must actually block sight AND passage except at its one connector — solid `b` hedge / bramble / canopy tree ranks (`rankLine`), not a thin see-through line. |
| Picnic law | §A4.5: keep **exactly the pinned rest-table count** per map (Ch3: foggy_moor=1). Extra rests are `bench`, never `picnic`. |
| Palette | Place only ALREADY-AUTHORED tile/prop keys (the `hi-res-facades` law + prop anchors). A wanted-but-unauthored tree/tile is a palette gap → author upstream, never place raw. |
| Elevation opt-in | A map is flat unless it declares an `elevation` plane (§ Elevation). Do not retro-interpret existing K/^/T cells as levels. |
| Trees region-true | Interior trees should read as the region (willow, palm, baobab, bamboo…). `treeSprite` is region-blind today — fix additively or place bespoke tree props; never a temperate oak in the savanna. |

## 2. Tile vocabulary (outdoor chars)

`:` trail (edge-masked; the default wild path material) · `.`/`,`/`~` grass family · `b`
hedge (solid) · `f`/`F` flowers · `e`/`E` sea/foam · `d` dock · `n` sand · trees are PROPS
(`treeSprite`/bespoke), not tiles. Wear: `1`/`2`/`3`. **New (universal kit):** hedge-wall +
bramble-wall autotile families, road turn/T/cross, path→grass transition band, sapling/
shrub foliage-fade (all appended at the TILESET tail; placed via a `buildTiles` neighbor-mask,
one char → auto corner/cap). **Elevation:** `K` cliff-face (solid), `^` cliff-lip (walkable
rim), `T` stairs (the only cross-level tile).

## 3. The moves (W1–W8)

- **W1 — Clearing chain.** Lay 4–7 clearings, each with an identity (glade / pond hollow /
  ruin court / farm edge / overlook / thicket). Each has ONE furnished anchor.
- **W2 — Forest belts.** Wall each clearing with a solid belt (`b` masses + `rankLine` canopy
  ranks + bramble for darker routes). The belt HIDES the next clearing.
- **W3 — Winding connectors.** ONE winding cut per belt (`windV`/`windH` center-tables),
  ≥3 wide, worn `:`/dirt through the belt — the only way through.
- **W4 — Branch & pocket.** Off the spine: a fork to an optional clearing, a dead-end pocket
  with a reward, a peninsula/overlook. At least one T-junction and one dead-end per map.
- **W5 — Winding water/road.** Rivers/roads follow center-tables with rounded bends and
  widen at clearings; banks self-seal (`E` foam under `e` water on shared centers).
- **W6 — Staged transition.** Feather every biome/region seam with the foliage-fade tiles
  (sapling → shrub → treeline → open). Never a hard edge.
- **W7 — Secrets.** A hidden pocket behind a belt with a `walkPresent` chest / rare-spawn /
  lore sign the player only finds by pushing into the trees. Reward wandering.
- **W8 — Elevation terracing (opt-in).** Where the land steps (a bluff over a quay, a
  hillside route), use a real terrace (§ Elevation) — walk-behind lip, stair cut. Sparse and
  purposeful, not everywhere.

## Elevation (§) — true multi-level walk-behind

Onett/Zelda verticality, built as an **opt-in engine feature** (see
`docs/WORLD_OVERHAUL_HANDOFF.md` § Elevation for the phased engine plan). Authoring rules:

- **Declare a level plane.** Add `elevation: { level: [...] }` to the MapDef — one digit-string
  row per grid row, same W×H: `'0'` (or `.`/space) = ground, `'1'..'9'` = stacked terraces.
- **Every level seam is walled or staired.** Between a level-N tile and a level-(N-1) tile
  there must be a `K` cliff-face (a wall you can't cross) OR a `T` stair (the one crossing).
  A bare open 2-level drop is illegal (`content-validate` "no invisible ledge").
- **The lip occludes; the stair reveals.** `^` cliff-lip is the walkable upper edge; the
  engine draws it (and the K face) in the above-band so a lower-level player passes BEHIND it.
  `T` stairs are never occluded (you see yourself climb).
- **Keep it legible + sparse.** A terrace is a 1–3 tile step for depth and layering, not a
  maze. Reachability must prove the upper terrace is entered ONLY via a stair.
- **Cliff art is the LAYERED kit** (P4), not the flat fake: overhang band + face top/mid/base
  + stair top/mid/base + corners/caps. Don't place elevation tiles until the kit + engine ship.

## Implementer procedure

1. Read this doc + `docs/WORLD_OVERHAUL_HANDOFF.md` guardrails + the map's blueprint + its
   fixed-point table (external warps, test-pinned coords, cutscene ground).
2. Rebuild the builder in-place: belts first (solid), THEN carve winding connectors, THEN
   clearings + anchors + branches/pockets, THEN the nature/wear pass (seeded, last).
3. Run the tree-guard filter LAST so no tree/prop lands on a lane/water/door tile.
4. Recompute paired door landings on BOTH sides together. Re-author any pinned rect
   (`MAP_REFLECT`, cutscene grounds) that the new layout moved, in the same change.
5. Gate: `tsc` → `door-audit` → `validate` → the map's vitest → `render-map <set>`.

## Review rubric (the map fails if any is false)

Clearings distinguishable; belts genuinely hide the next zone; every connector winds and is
≥3 wide; at least one fork + one dead-end + one rewarded secret pocket; biome seams feathered
(no hard edge); anchors furnished (no dead clearing); picnic count exact; reachability +
door-audit green; (if elevated) walk-behind reads correctly and the terrace is stair-only.
