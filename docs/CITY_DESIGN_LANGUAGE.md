# Settlement Design Language — making towns read like real places

Guides the re-layout of outdoor settlement maps (`src/data/maps*.ts`). Dialogue,
quests, and the balance curve are untouched. Existing art is untouched too — but a
layout MAY grow its area's building/prop palette with NEW types when the place needs
them to feel full and alive; new art is always AUTHORED via the ChatGPT pipeline
(never procedural — see `SETTLEMENT_REDESIGN_HANDOFF.md` § GROWING THE PALETTE).
First applied to Otterbrook / Brickton / Puerto Sol; later chapters follow the same
language.

**The symptom this fixes:** ruler-straight streets, every building on one shared
baseline, no districts, no alleys, no mid-block life. Settlements read as "a row of
sprites," not a place someone lives.

## 0. The bar (user directive, 2026-07-02 — supersedes "re-layout")

Every settlement pass is a **FULL SCRAP-AND-REBUILD**, not a dress-up of the shipped
layout. The user's standard: *"full map redesigns … more creative, detailed, feel like
EarthBound in a very distinct way, with the linear-but-open-world feel and vibrant
alive cities."* Concretely:
- Redesign from a blank grid around a **place identity** (Otterbrook = the brook it's
  named for + otter civic pride; every town gets one hook expressed in layout + props).
- Keep CONTENT (ids/dialogue/flags/quest anchors) and the blueprint's FIXED-POINT
  table (external warps, test-pinned tiles, cutscene ground) — everything else moves.
- A timid diff is a defect: if the before/after renders look like siblings, redo it.
- "Linear but open": one legible story spine through the map, with off-spine pockets
  (secrets, parks, back lanes) that reward wandering.
- In-between route maps (the walking legs between settlements) are IN SCOPE for the
  same treatment as their settlements come up — no more bare snake-paths on grass.
- Each finished map gets a bootable preview for a user walkthrough checkpoint.

## 1. Hard rails (violating any of these fails tests or gameplay)

| Rail | Rule |
|---|---|
| Determinism | All jitter via `seededRng(seed)` streams local to the builder. Never `Math.random`, never `Date`. Two builds must be byte-identical (`world_block.test.ts` proves it). |
| Frozen-core law | Shipped maps are `growX()` wrapping `buildX()` top-left. Edit **core and grow together, in one pass**. Growth paints ONLY outside the core rect (`x ≥ CW \|\| y ≥ CH`) and **appends** to arrays — the core's props/npcs/signs/doors/spawners stay a byte-identical *prefix* of the grown arrays. This is a STRUCTURAL law (how the two functions relate), **not** a creative one — tests compare relationally, so a coherent full core+grow rewrite stays green. It must never be read as "preserve the old layout" (§0). |
| Envelopes | world_block pins per-map caps — Otterbrook: grown/core tiles > 2.5×, ≤ 4000 tiles, ≤ 260 props. Brickton: > 3.5×, ≤ 12000 tiles, ≤ 320 props. Puerto Sol: > 2.5×, ≤ 12000 tiles, **≤ 120 props**. Count props before adding furniture; budget is part of the design. |
| Test-pinned coords | Some content is pinned at exact tiles by tests or external warps (each map's blueprint lists them). Those tiles keep their content AND stay walkable. Everything else may move. |
| ADR-012 city minima | `settlement:'city'` maps: ≥ 2 horizontal street bands (rows ≥ 40% R/D/X), bands separated by built-up rows, ≥ 1 column with ≥ 12 vertical street cells, ≥ 2 distinct building face-bands. Run `cityViolations` mentally while sketching. |
| Door law | Building doors sit on flat frontage with a clear landing; map-edge doors need a walkable mouth. Landings are **computed** (`doorstepOf`, `trailRowAt`), never hardcoded, and return-doors must land snug to the walk-back spot (ADR-138
tightened the farFromReturn gate to 40px). Check with `npx tsx tools/door-audit.ts`. |
| Reachability | Every NPC, sign, phone, ATM, picnic, spawner rect, and trigger must be BFS-reachable from the main walkable region. No prop may seal a quest path. |
| Body box | The player is ~40×36px. Any corridor the player must pass: ≥ 3 tiles wide, 4+ preferred. Alleys that are scenery-only may be 2. Never a 1-wide mandatory path. |
| Solid chars | Before repainting, read the engine's solid-tile set (grep `isSolid` in src/). Water `e`, walls `B`/`W`/`O`/`J`/`Z`, hedges `b`, fences `-` `\|` block; streets/sidewalk/plaza/dock/park chars walk. |
| RNG streams | Builders use isolated numbered streams (e.g. 1995, 2077…). Keep streams isolated; reflowing a stream inside one builder is fine (the whole layout changes), but never share streams across builders. |
| Post-passes | `occupyCity` (tenancy/knock signs), door re-aim fixups, and traffic run AFTER the builder — don't duplicate their work; don't break their inputs (doorless `bldg_*` facades are what occupyCity feeds on). |
| Picnic law | §A4.5 rest tables stay ≥ 3 per chapter, placed before dungeons/pressure zones. |
| Palette | Place only facade/prop keys whose art is ALREADY authored (the `hi-res-facades` validate law fails the build on a procedural generated facade). Draw from the area's own `AREA_SKINS` roster (`src/spritegen/buildings.ts`) — never another area's (validator-pinned both ways). If the design wants a type that isn't authored yet, STOP and report it as a palette gap — authoring happens upstream (handoff § GROWING THE PALETTE), never inside an implementation pass. |

## 2. Tile vocabulary (grid chars that matter outdoors)

`R` road (traffic drives here) · `D` dashed centerline · `X` crosswalk · `P` parking
lot/lane · `=` sidewalk/paved apron · `:` path/trail (edge-masked; small-town streets,
park loops, driveways) · `B` brick (solid spine/wall) · `p` plaza pavers · `d` dock ·
`n` sand · `e`/`E` sea/foam · `.` `,` `~` grass family · `f`/`F` flowers · `b` hedge ·
`-`/`|` fences · wear: `1` sidewalk crack, `2` road patch, `3` storm drain (walkable).

## 3. The design moves

**M1 — Street hierarchy.** One *avenue* (3-wide R, dashed D centerline, X crosswalks at
every intersection, `3` storm drains at curb corners, 1–2 tile `=` sidewalk aprons both
sides). *Side streets* 2–3 wide, sparser dressing. *Service alleys* behind commercial
rows: 2-wide, `B`-edged or bare, with dumpsters/crates/trash — scenery that implies a
back-of-house. *Paths* `:` for parks, yards, shortcuts. Streets should form LOOPS (a
network cars/NPCs can circulate), with at least one T-junction and one dead-end for
shape. In pre-asphalt villages/towns, `:` IS the street material — keep `R` for eras
and districts that plausibly have cars.

**M2 — Block rhythm.** Never more than ~8–10 tiles of buildings on one unbroken
baseline. Stagger setbacks ±1–2 tiles; mix attached row-runs (0-gap) with detached
lots (1–2 gap); anchor corners at intersections with the tallest/most distinctive
facade; leave a 2-wide alley slot mid-block every 8–14 columns. Residential lots get
front yards: fence run with a gate gap, a flower bed, a `:` driveway stub to the lane.

**M3 — Districts.** Give each settlement 3–5 quarters with distinct texture, and make
them tangent to each other so walking across town reads as transitions: civic (paved
forecourt, signs, banners), commercial strip (facades tight to sidewalk, news boxes,
meters), market (stalls + crates crowding the walkway), residential (yards, trees,
hedges), park/green (paths, benches, picnic), waterfront (dock band, crates, piers),
back-lots (parking, dumpsters, weeds `~`).

**M4 — Anchors and vistas.** Every settlement gets: one *plaza/green* (open `=`/`p`/
grass field with a centerpiece — fountain, well, oak — benches facing it, entrances on
2+ sides); one *gateway moment* per map edge that matters (signage, framing props, a
narrowing then release); and one *landmark axis* — a mega/colossus or civic facade
terminating a straight street's sightline so looking down the avenue "goes somewhere."

**M5 — Furniture cadence (budget-aware).** Rhythm, not confetti: lampposts/phone poles
every ~6–8 tiles along avenues; hydrant near each downtown corner; benches only facing
something (plaza, pond, storefront); trash cans at doors and bus stops; news boxes by
shops; parking meters only along `P` curbs. Check the prop envelope FIRST; when tight,
cut in this order: meters → news boxes → extra benches → extra trees. Never place
furniture on a door's landing column or inside a walk corridor's 3-wide minimum.

**M6 — Wear + nature pass.** Seeded sprinkles, guarded to the right base char: `1` on
~3–5% of sidewalk, `2` on ~2–3% of road, `3` along curb lines; `,~` fuzz on grass
(~5–8%); `f`/`F` beds beside civic buildings and porches; `b` hedge runs with ≥ 3-wide
gaps where routes cross. Street trees mid-block (never in front of doors), clusters of
2–3 in parks — deterministic positions, `treeSprite(x,y)` for variety.

**M7 — Flow, compression, secrets.** Alternate tight and open: a 3-wide street that
opens into a 10-wide plaza feels like arrival. Dead-ends and alley pockets hide a
reward (gift_box + its sign) or a gag sign — reuse the established `walkPresent`/
`giftBox` patterns. Add one diagonal-ish `:` shortcut a observant player can find.
Keep spawner rects over grass/lots/park edges, not plaza centers.

**M8 — Life.** NPC wander zones on sidewalks/plazas near their dialogue's subject;
`idle: true` + `emote` for stationary flavor NPCs; keep bus/boat/gate clusters intact
(sign + bench + trigger + landing together). Traffic takes care of itself if `R`
networks connect.

## 4. Implementer procedure

1. Read the target's `buildX()` AND `growX()` fully, plus the blueprint's fixed-point
   table. Grep the engine `isSolid` set once.
2. Sketch the district plan in comments first (quarter names + street skeleton), then
   repaint the grid: skeleton → blocks/buildings → anchors → furniture → wear/nature.
3. Re-place every existing content item (same id/sprite/dialogue/flags) at a
   semantically equivalent spot in the new layout; pinned items stay at exact tiles.
   Doors: keep every `to:` target; recompute landings via the existing helpers.
4. Keep the core-prefix law: grow embeds the (new) core verbatim and appends.
5. Gates, in order: `npx tsc --noEmit` → `npx tsx tools/door-audit.ts` →
   `npm run validate` → `npx vitest run src/data/world_block.test.ts src/data/maps.test.ts`
   (or full `npm test`). Fix until green.
6. Render the schematic for review: `npx tsx tools/render-map.ts <set>` →
   `output/maps_<set>.png` (add the map's set to the CLI SETS table if missing).

## 5. Review rubric (what the PNG must show)

Districts distinguishable at a glance · no unbroken full-width straight line without a
break/anchor · plaza reads as a room · at least one alley + one dead-end pocket ·
furniture clustered at anchors, not uniform · a landmark terminates at least one
street axis · gateways framed · yards/back-lots differ from street-front.
