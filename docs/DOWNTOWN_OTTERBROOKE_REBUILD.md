# DOWNTOWN OTTERBROOKE — the EB street rebuild (spec + prompt pack)

Goal (user directive 2026-07-11): make downtown read like **EarthBound's Onett
main street** — building massing/stacking, building-to-character scale, the
sidewalk→street curb step, street furniture, and the pale-street value
structure. Reference screenshots are BANKED IN-REPO at
`assets/art/masters/reference/earthbound/` and **every ChatGPT generation ask
below must attach them** (user directive: give ChatGPT EarthBound examples so
it has the exact tileset/angle style).

| Reference file | What it demonstrates |
|---|---|
| `eb-onett-mainstreet-diagonal.png` | Street-wall massing, 6.5-unit hotel vs 1-unit Ness, visible roof planes, diagonal drag, hatched sidewalk + curb line |
| `eb-onett-street-kit-terracing.png` | Traffic light / stop sign / manhole / crosswalk kit; street cut BELOW the lawn terrace (you see roofs) |
| `eb-twoson-rooftop-elevation.png` | Walkable rooftop elevation, dithered sky horizon bands, oblique building volume |

## SHIPPED on `claude/earthbound-art-style-01p1w9` (engineering, no art asks)

1. **GPU-safe tile atlas** — the runtime `tiles` texture reflows to a 64-column
   grid (`TILE_ATLAS_COLS`, `src/spritegen/tiles.ts`); a single-row upload was
   12224px (> the 8192 `MAX_TEXTURE_SIZE` of SwiftShader/many Android GPUs)
   and rendered the ground **black**. Disk strips + apply-tools stay
   single-row; guard test in `authored_assets.test.ts`.
2. **EB value pass on the street** — `tools/recolor-asphalt.ts` lifts the
   asphalt family from near-black (lum ≈ 90) to EarthBound's pale warm gray
   (≈ 160): dashes kept, crosswalk bars re-whitened, parking/road_patch
   de-blued, storm drain re-grounded. Idempotent (remaps from its `.bak`).
3. **Two-tile downtown promenade** — Main St's shop drag: the shop FOOT row
   (57) is pavement (storefronts front the walk; gaps show paving, not lawn
   moats) plus the south row (64) along the drag (`buildOtterbrookTownReplica`).
4. **EB curb kit** — `CURB_BASE` 16-mask family (faces, true outer corners,
   away-facing north lip) + 3 crosswalk **curb-cut** flush ramps, derived from
   the authored sidewalk cell (`tools/apply-curb-kit.ts`, proof PNG in
   `assets/art/review/curb-kit-proof.png`). `buildTiles`: `'X'` cuts the curb
   instead of walling it; `'_'` counts as carriageway. Editor preview mirrors.
5. **Street-wall massing** — the drag re-spaced into two continuous blocks
   flanking the spine (gaps ≤ ~1 tile): burger 33 / bank 39 / hardware 47 —
   spine — bakery 61 / drugstore 67 / arcade 74 / realty 81 / autolot 90.
6. **Manhole** — walk-over street tile (char `'4'`, `tools/apply-manhole.ts`),
   placed at the spine junctions.

## REMAINING ART BATCHES (ChatGPT generation — run from the logged-in
chatgpt.com browser per `docs/ART_PIPELINE.md`; NOT possible headless)

### Batch A — the TALL downtown facade set (the big lift)

**Why:** measured off the references, EB downtown buildings are **3–6.5
character-heights** tall (Onett's hotel = 6.5 units, its *smallest* storefront
= 3.1); every current Otterbrooke facade is 384px = **3 units**. EB also shows
a big flat **roof plane** on every box, and this is most of the "3D feel".

**Spec (hard rules for every render):**
- Character unit = 128 runtime px. Author facades **512–840px tall**
  (4–6.5 units): the bank/hotel/department store at 700–840px, mid storefronts
  at 512–640px. Width 320–512px (5–8 tiles). Keep width > 160px (the
  `worldSpriteScale` ×4 trap).
- **One shared camera**: oblique front + **RIGHT** side visible (matches
  drugstore/bakery/hardware; the police station is the outlier to re-author),
  light from front-left, `INK` outlines, flat EB fills (no gradients/noise).
- **Roof plane visible on every building**: flat top face 2–3 tiles deep
  (128–192px) with parapet rim + one prop (hatch/AC/chimney).
- **Party walls**: left/right edges flat and full-bleed so facades can butt
  into a street wall; doors + awnings at the very FOOT (they open onto the
  promenade).
- Background: **solid chroma green** (#00FF00-ish), no ground shadow.

**Prompt template (attach `eb-onett-mainstreet-diagonal.png` +
`eb-twoson-rooftop-elevation.png` + the CURRENT drugstore PNG as refs):**

> Create an image: a single EarthBound (Mother 2, SNES) style pixel-art
> building facade on a flat solid bright-green chroma background. Match the
> attached EarthBound screenshots EXACTLY for camera and construction: oblique
> 3/4 view showing the FRONT face and the RIGHT side face, with a large flat
> visible ROOF plane (parapet rim, one roof prop). Match the attached
> drugstore sprite for outline weight, palette and pixel density. The building
> is a small-town American [HOTEL — 3 storeys, tall narrow windows, marquee
> over the door]. Flat color fills, hard pixel edges, no gradients, no
> anti-aliasing haze, no ground shadow. The door sits at the very bottom edge.
> Left and right edges are flat vertical party walls.

**Wire each render (mechanical, headless-ok):**
1. `npx tsx tools/slice-oblique-facade.ts <raw.png> assets/art/world/facades/bldg_ob_<key>.png <targetH>`
   (PASS the tall target height — the default is 384).
2. Register in `BASE_FACADE_KEYS` (`src/spritegen/authored.ts`, ~line 653).
3. Add `bldg_ob_<key>: [w, h]` to `OTTERBROOK_LANDMARK_DIMS`
   (`src/data/maps.ts` ~198) and place via `build('bldg_ob_<key>', cx, 57, …)`.
4. Vary FOOT rows 56/57/58 across the block so parapets step (EB stacking).
5. Gates: `npx vitest run src/spritegen/authored_assets.test.ts` +
   `npm run validate` + walk it.

Priority order: bank → hotel-on-Main → dept store (new interior optional,
doorless is fine as a mass) → re-author police to front+right.

### Batch B — intersection props (traffic light + stop sign)

One magenta strip (`#FF00FF` background), 2 figures, EB pixel style, front-left
light. **Attach `eb-onett-street-kit-terracing.png`** — match its yellow
gooseneck traffic light and STOP sign exactly (Meteor-Falls palette: pole =
GOLD ramp, sign = RED ramp, INK outlines).

> Create an image: a row of 2 EarthBound-style pixel-art street props on a
> flat solid magenta background, evenly spaced: (1) a yellow gooseneck
> traffic-light pole with a hooded signal head like the attached EarthBound
> screenshot, (2) a red octagonal STOP sign on a short metal pole. Chunky
> SNES pixels, dark outlines, flat fills, no shadows.

Wire: `node tools/slice-prop-strip.cjs <raw> tl --expect=2 --target=200` →
rename to `assets/art/world/props/traffic_light.png` / `stop_sign.png` →
add both keys to `WORLD_PROP_KEYS` (`authored.ts`, before the `] as const;`
at ~651) → display sizes in `AUTHORED_WORLD_PROP_DISPLAY_SIZE`
(`traffic_light: { w: 12, h: 40 }`, `stop_sign: { w: 10, h: 24 }`) → both into
`OBLIQUE_SHADOW_PROP_KEYS` → place as `PropDef`s at the spine junctions, e.g.
`{ sprite: 'traffic_light', x: 51.5, y: 55.8, solid: { ox: 3, oy: 36, w: 6, h: 4 } }`
and a stop sign at each residential T. (The `authored_assets` prop test fails
if a PNG lands without its key — commit art + key together.)

### Batch C — the DIAGONAL main-street family (design-stage)

The reference drag runs diagonally; ours is axis-aligned. Needs a 45° road +
sidewalk + curb edge set authored as **one continuous reference block** (the
EARTHBOUND_STYLIZATION_OVERHAUL §2 seamless-by-construction method), plus new
grid chars + a mask extension in `buildTiles`. Do this with (or after) the
Twoton diagonal boulevard, which needs the same family — one kit, two towns.

### Batch D — sink Main St (terracing, the "roofs below you" read)

`eb-onett-street-kit-terracing.png` bottom band: the street sits a level below
the lawns and you look down onto ROOFS. The engine supports it today
(`elevation` plane + `buildElevationOverlay`) — it is blocked ONLY on the
Onett cliff/retaining-wall 47-blob kit (the map #1 batch in
`docs/EARTHBOUND_STYLIZATION_OVERHAUL.md` §6). When that kit lands, declare
`elevation` on otterbrook with Main St's carriageway at L0 and the flanking
town at L1, stairs at the crosswalk corners.

## Order of operations

Batch B (an afternoon) → Batch A bank+hotel (the visible skyline change) →
rest of Batch A → C with Twoton → D with the Onett kit.
