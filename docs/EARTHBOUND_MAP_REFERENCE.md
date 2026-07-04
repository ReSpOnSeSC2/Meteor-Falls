# EarthBound map-design reference — patterns for building our maps

A distilled reference for the [EarthBound-stylization overhaul](EARTHBOUND_STYLIZATION_OVERHAUL.md):
the **design language** of the EarthBound map archetypes the user shared as mood-reference,
turned into actionable patterns for authoring our **original** maps + transitional areas.

> **IP note:** this catalogs *patterns and layout principles* only — we author original
> EarthBound-*style* art via the ChatGPT → PNG pipeline (`docs/ART_PIPELINE.md`), never
> copies of Nintendo's assets. Keep actual third-party screenshots in an external
> moodboard, not the repo. See `assets/art/masters/reference/README.md`.

---

## 1. TOWN / SETTLEMENT LAYOUTS

**The grid town (Onett archetype).** An isometric-leaning street GRID of paved avenues
with a curb/sidewalk hierarchy; distinct, purpose-labeled buildings (drugstore, arcade,
hospital, city hall, police) fronting the streets; a town-map "menu" screen exists as an
overview. Trees + fences fill the block interiors; a landmark (statue/fountain) anchors a
plaza. → **Our maps:** Otterbrooke (done), Brickton, Puerto Sol, any USA/grid town. Keep
DISTINCT purposeful facades, not repeated generic boxes; anchor a plaza; line streets with
storefronts whose doors face the sidewalk.

**The cult/orchard village (Happy-Happy archetype).** A looser DIRT-path settlement in a
bowl ringed by orange/tan cliffs; a big central "HQ" building, a scatter of small houses
on winding paths, clear **edge sign-posts** ("TO PEACEFUL REST VALLEY", "TO DRUGSTORE",
"TO HOTEL") marking every exit. → **Our maps:** frontier/rural settlements; use labeled
edge exits + a dominant central structure + cliff-ringed bowl for a "remote" read.

**The night / twilight town (Moonside/Fourside-night archetype).** The SAME grid re-lit in
a purple/indigo palette — a "surreal night" recolor, a circus tent as a landmark, neon
signage. → **Our maps:** the hush-dark states, any nocturnal/dream town. Lesson: recolor
the daytime town via engine lighting overlays (as Otterbrooke's night/haze already does),
don't author a separate night tileset.

**The metropolis (Fourside archetype).** A tight cluster of tall SKYSCRAPERS on diagonal
boulevards, water on the map edges, a department store + museum + a mogul's tower as
landmarks. → **Our maps:** Brickton, big cities. Lesson: verticality + diagonal arterials
+ a signature tower; water/void frames the island.

## 2. TRANSITIONAL WILDERNESS / OVERWORLD (the areas BETWEEN towns)

**The river valley (Peaceful Rest Valley archetype).** A large green overworld with a
winding river/lake carving through it, **cliff bands** stepping the terrain, **bridges**
at the crossings, sparse trees, and small labeled points of interest. The path threads
along the water and over the bridges — the river IS the wayfinding. → **Our maps:** every
route/transition between settlements (meadow_mile chain, etc.). Lesson: a **single strong
natural feature** (river, ridge, canyon) that both blocks and guides; cross it with a few
memorable bridges; stagger cliffs so the route doglegs and can't be seen end-to-end
(mirrors the foggybottom + Otterbrooke terrace approach).

**The snow wilds (Winters archetype).** Snow-laden conifer forest, frozen water, dark
**cave mouths** cut into white cliffs, a lone building (boarding school) as the anchor. →
**Our maps:** Norway/cold biomes. Lesson: monochrome-cool palette + cave-mouth negative
space + one warm-lit building for contrast.

**The desert biome (Dusty Dunes / Scaraba archetype).** Wide orange sand under a
cloud-fringed sky; scattered cacti + the odd **oasis** (a palm + a blue pool) as the only
soft points; **brown rock ridges/canyons** the path threads between; a "DESERT" edge sign;
a bus/road cutting the lower band; buried treasure nodes. Its town is **adobe** — flat-roof
mud-brick houses, palms, a small pool, a hotel sign, in a tan palette (some maps push it to
an Arabian read with pyramids/tents). → **Our maps:** any desert route + desert settlement
(Chandrapore-adjacent, frontier dunes). Lessons: an oasis every few screens for relief +
wayfinding; rock ridges as the natural maze walls; a road/bus band to anchor scale;
flat-roof adobe for the town so it reads baked-dry, not grassy-village.

**The jungle / deep-darkness (Deep Darkness archetype).** A near-fullscreen **dense canopy**
of dark trees over marsh water, narrow brown mud paths winding between islets, **mushroom /
item nodes** as the only bright accents, low visibility. → **Our maps:** Zanzibel/tropical
routes, swamp dungeons. Lessons: the canopy IS the wall (you path the thin dry gaps); keep
the palette tight + dim so the bright pickups pop; branch the path around water islets so it
reads as a slog you navigate, not an open field.

**The orchard-maze cave** (labeled item pickups + named edge exits, e.g. "TO WINTERS"). →
overland mazes: a repeating hedge/rock motif as walls, scattered labeled item nodes, and 2+
named edge exits so the maze reads as a through-route, not a dead end.

## 3. DUNGEONS + INTERIOR MAZES

- **Stone fortress dungeon** — gray rooms + corridors, choke-point doors, enemies on the
  path. → boss lairs, the Titanic Tick's cave (§3 Giant-Step). Lesson: a DOWNWARD/inward
  read, choke rooms, a set-piece chamber at the end.
- **The swarm room** — a chamber packed with a single enemy type + a treasure box in the
  corner. → an optional high-density combat pocket with a reward.
- **The throne room (Monotoli archetype)** — a symmetric blue hall, pillars, a raised dais
  with a golden idol/seat, the villain centered. → boss/authority interiors: symmetry +
  a central raised dais + a single gold accent.
- **The branching cave (route-map view)** — organic brown tunnels on black, forking into
  loops + dead-end item pockets, a couple of named exits. Some reference maps overlay the
  critical path in red. → mines/sewers/caverns. Lessons: ONE readable critical path through
  a web of optional loops; reward dead-ends with items; keep 2+ labeled mouths so the cave
  is a *passage*, not a pit. (Our re-homed Titanic-Tick cave should read this way.)

## 4. INTERIOR SETS (the Onett-interiors sheet)

The shared reference sheet shows the FULL set an EarthBound town needs — and it's exactly
our interiors backlog (`docs/OTTERBROOK_INTERIOR_MANIFEST.md`): **house** (living + kitchen
nook + bedrooms, with a dark "night" variant), **drugstore**, **bakery**, **burger shop**,
**arcade** (cabinet rows), **library**, **police station** (desk + cells), **town hall**
(clerk counter + council/records rooms), **hotel** (lobby + repeated rooms), **hospital**
(reception + wards), **treehouse**, **cave/tunnel**, plus **"random house"** variants
(same shell, different furniture/palette). Design lessons:
- Every interior = a back WALL band + a floor, dressed with 4–8 purposeful props + a keeper.
- Multi-room buildings LINK rooms (hall → doors), not one big zoned grid.
- "Random houses" reuse ONE shell with palette + furniture variety (our tract/apartment plan).
- A **cozy HD cabin** variant (warm wood, fireplace, workbench) is the richer end of the
  spectrum — good target for story homes (Pemberton's workshop, hero homes).
- A **ruined/damaged interior** (broken floorboards, displaced rug) is a reusable "after the
  disaster" state — recolor + damage-overlay the normal interior.

## 5. SPECIAL LOCALES

- **Beach resort (Summers archetype)** — a long promenade of pastel hotels + palms above a
  wide umbrella-dotted beach, boats moored in the bay. → Puerto Sol / Costa Estrella /
  resort maps. Lesson: a horizontal PROMENADE band, beach gradient, moored boats for depth.
- **Lake with a legend (Tessie archetype)** — an open green shore, a watch-tent, wildlife
  (deer), a creature surfacing in the water, a kid on a bike. → set-piece pond/lake beats;
  a single "wonder" in the water + spectators reading it.
- **The picnic green** — checkered blankets, picnic tables with food props, flower planters,
  a low fence at the water's edge. → park dressing (our Pond Park, greens); warm, populated,
  low-stakes "town life" density.
- **The floating sky-island / temple (Dalaam archetype).** An isometric plateau of tan
  **basalt columns** hovering in a cloud sky, a golden domed palace crowning the summit, a
  few huts + cave mouths down its terraces, **switchback dirt paths** climbing the levels. →
  our elevated set-pieces (this is the same terraced-climb grammar Otterbrooke now uses, but
  as a destination island). Lessons: columnar cliff sides sell "floating"; one gold landmark
  crowns the top; the path SWITCHBACKS up the terraces (a natural fit for our elevation
  engine — L0 base → terraces → L3 summit temple).

---

## How to use this
When building a new map, find its archetype above, then apply the lesson to **our** tiles +
authored facades. Log the map's signature in `docs/DIVERSITY_LEDGER.md` (the no-formula
gate) so no two maps read the same. Author any new art via the ChatGPT → PNG pipeline.
