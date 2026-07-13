# The Diversity Ledger — the NO-FORMULA gate (World Overhaul S5+)

Running log of every SIGNATURE, gimmick, mood, layout-trick, palette, and set-piece used by a
**rebuilt** (S5+) map. Part of the World Overhaul program (`docs/WORLD_OVERHAUL_HANDOFF.md`).
The PRIME LAW of S5 is **NO FORMULA**: every area must have a *unique* signature no other area
uses. This ledger makes "unique" checkable — a **diversity critic** (agent) checks each new map's
concept against this table and **REJECTS repeats**. Novelty is a gate, not an aspiration.

## The failure mode we are destroying

Convergence on ONE skeleton:

> forest/hedge BELT → winding CORRIDOR → CLEARING with a furnished ANCHOR → seeded nature pass

Every AI-built map silently drifts to this until the world feels like one map re-tinted. A rebuilt
map that reduces to this skeleton **fails the gate**, no matter how well-dressed. The grammar (belts,
connectors, clearings) is still the *vocabulary* — but each map must arrange it into a shape, and add
a signature, that nothing else in the game repeats.

## What counts as a "repeat" (the critic rejects any of these)

- **Signature collision** — the map's one central spatial idea is already claimed by a logged map.
- **Region-shape echo** — two maps' region sequences read as the same rhythm (same beats, same order).
- **Palette echo** — the same new-tile/prop combo carries the mood of an already-logged map (region
  re-tint of an existing look).
- **Set-piece echo** — the memorable moment/object is a re-skin of a logged one.

Distinctness is *per-region* too (distinct-every-step): log each map's regions so no two regions —
even across different maps — blur into "the same corridor."

## Ledger

| # | Map | Chapter | SIGNATURE (the one idea) | Regions / micro-identities | Set-piece | Palette (new authored/engine) | Mood | Notes |
|---|-----|---------|--------------------------|----------------------------|-----------|-------------------------------|------|-------|
| — | _(elev_spike)_ | dev | _engine spike, not a shipped area — excluded_ | terrace / ground | the 3-wide stair | P4 cliff kit (cliff_top/mid_a/mid_b/base) | — | The P4 layered cliff kit is a shared TOOL, not a signature; using terraces is allowed everywhere, but the *way* they shape a map must differ per map. |
| 1 | **foggybottom** (FOGGYBOTTOM-ON-TYNE) | Ch3 | **A four-terrace sea-cliff you descend into a SINKING FOG-CEILING** — the fog is a physical veil keyed to your terrace (thin on the rim, grey soup on the quay); you navigate by which landmark pokes up out of it. The descent IS the drama. | RIM GARDENS (L3, sunlit allotment, the fog-gate + vista) → HIGH STREET (L2, grey stone canyon, civic spine) → MARKET SHELF (L1, tilted plaza half-over-water) → DROWNED QUAY (L0, fog-soup waterfront). Each a distinct level = distinct palette + fog density + prop vocabulary + sightline. | the reversible **fog-well vista** (look down from the rim = whole route previewed; look up from the quay = town climbing back into light) | **engine** level-scaled fog veil (`atmosphere:'fog'`, `buildFog`; alpha 0.14→0.62 by terrace) + the shipped P4 cliff kit + authored telegraph poles and distant academy sightline. | EarthBound-melancholy-damp: warm gas-lamp gold bleeding into cold brine-grey, pressure + wet rising rung by rung. | First SHIPPED elevated map. NO tree-belts, NO same-plane clearings — a single VERTICAL object; distinct-every-step is ENGINE-guaranteed (four levels = four fogs). Three stairs STAGGERED W/C/E so the descent doglegs. **The fog-ceiling-that-sinks + navigate-by-what-pokes-up is claimed — no other map may reuse a level-scaled atmosphere as its headline signature.** |
| 2 | **biplane_interior** (LUCILLE) | Ch3 | **A whole journey compressed into a storm-shaken fuselage**: traversal is longitudinal and every step moves from human cargo clutter toward the dangerous cockpit. | rear cargo/net and benches → trembling mid-cabin → lightning-window approach → cockpit nose | animated lightning window, rattle and cockpit vibration | authored `ch3_lucille_cockpit`, `ch3_lucille_window`, `ch3_cargo_net`; machine ambience | cramped, brave, improvised | Claims “moving vehicle interior whose weather is readable through animated windows.” |
| 3 | **kettle_taproom** | Ch3 | **A public hearth that is also the chapter's practical reset point**: social circulation wraps the bar instead of becoming a corridor to a counter. | wet entrance → bar/service edge → occupied table pockets → snug door | paid rest/check-in at the lived-in pub | existing warm interior/furniture kit + rain beyond | crowded warmth against cold rain | Claims “working village pub as the amenity hub,” not a generic hotel lobby. |
| 4 | **kettle_snug** | Ch3 | **A partitioned hush behind the noisy public room**: the paid room feels tucked away, not like a duplicate lobby. | threshold partition → small sitting pocket → bed/wake zone | real sleep/wake return loop | existing snug furniture, floor-lamp warmth | private, muffled, restorative | A tiny interior may be linear; its signature is acoustic/social contrast, not route complexity. |
| 5 | **foggy_moor** | Ch3 | **A telegraph-guided road whose old infrastructure keeps interrupting the walk**: the route bends around walls, waterworks and rail-era masonry rather than through a forest-clearings formula. | town-edge wall lanes → branch/picnic pocket → viaduct reveal → Roman culvert secret → academy approach | viaduct-over-road reveal and hidden culvert reward | authored viaduct, culvert and telegraph pole; dry-stone-wall/wind grammar | exposed, lonely, curious | Claims “infrastructure breadcrumbs across open moor.” Branches and dead ends pay off; they are not same-shape clearings. |
| 6 | **wintermoor_grounds** | Ch3 | **An institution revealed in staged layers around a formal quad**: the gate controls the axis while ruined greenhouse and cricket life pull laterally away from it. | south gate/porter lodge → service approach/greenhouse wreck → academy forecourt + quad → cricket pavilion/pitch | First Borrow at the gate and Clicker practice cart off the cricket edge | authored gate, lodge, greenhouse, pavilion, academy block, valve/telegraph details; wind/fog | imposing order with adolescent mess at the edges | Claims “school campus as a staged social machine,” not another town square. |
| 7 | **the_old_stones** | Ch3 | **A concentric landscape that makes the player orbit before entering the sacred centre**. | outer approach paths → menhir ring → trilithon threshold → spring/Heartlight centre | post-boss spring and stone restoration | authored menhir, trilithon and spring; post-boss tint/pulse | ancient, open, relieved | Claims “orbit-before-centre standing-stone walk.” It does not use reconfiguring stones, leaving that bank provocation unused. |
| 8 | **wintermoor_f1** | Ch3 | **The school as a civic machine with two unequal arms around one great hall**. | faculty/trophy west rooms → bannered central hall/tuck shop → comb-like east library → separated boiler/stair exits | the great hall's long red-carpet cross-axis | existing institutional furniture, bookshelves, banners; rain bed | public, surveilled, busy | Claims “great-hall hub with library comb,” not a repeated classroom grid. |
| 9 | **wintermoor_f2** | Ch3 | **A timetable made spatial**: three classroom bands and four cross-corridors create route choice while a fog-pipe lab contaminates the regular plan. | classroom band 1 → side rooms/umpire beat → band 2 → science/fog-pipe lab → dorm/floor exits | valve-manifold laboratory behind the ordered classroom bands | authored valve manifold and cargo safety mesh; machine bed | regimented, increasingly wrong | Claims “regular school grid visibly infected by its infrastructure.” |
| 10 | **wintermoor_f3** | Ch3 | **An exam maze that culminates in a visibly raised office-machine**: desks and invigilation loops funnel toward, but do not disguise, the boss platform. | west exam rooms → lower invigilation loop → exterior office threshold → raised Mainframe arena | fog engine on the Headmaster platform, replaced by a quiet valve bank after victory | authored fog engine/valve; cliff/stair bands and machine ambience | oppressive, clinical, exposed | Claims “boss arena displayed above the dungeon before entry.” |
| 11 | **wintermoor_dorm** | Ch3 | **Two bedroom galleries wrapped around a cover-rich stealth loop** instead of enemy spawn rooms. | north room row → broad patrol gallery → common-room inner loop → wash/laundry pockets → south room row | two readable Prefect patrol circuits with different sight ranges | existing beds/common-room/service props; wind/muffle | illicit, domestic, watchful | Claims “student residence as patrol stealth circuit.” No combat spawners dilute it. |
| 12 | **wintermoor_boiler** | Ch3 | **A map-wide coolant main divides the plant until PSI creates one fair crossing**, after which a remote tug solves the machine problem rather than another switch press. | south valve yard/approach loops → frozen coolant barrier → north boiler bays/compressor → Fogworks control pocket | five-cell `K`→`T` Freeze crossing plus Clicker-controlled valve tug | authored fog engine, valve manifolds, cargo net; machine ambience; phase-matched blocker art | loud, industrial, satisfying | Claims “PSI opens the only physical plant crossing, then remote machinery completes the sequence.” Preserve the exact crossing and machine id. |
| 13 | **kvisthavn** | Ch4 | **A fishing village climbed as three working shelves above an irregular quay.** | fjord fingers/loading pockets → working quay → service lane → warm cliff terrace | Lucille moors among the actual work docks below the bell sightline | Norway shore/boardwalk/cobble/wall; red authored facades | cold salt outside, cream shelter within | Claims “harbor work composed vertically beneath black cliffs.” |
| 14 | **bootstep_moor** | Ch4 | **A regional track-reading journey split by one continuous gorge and one absurd living bridge.** | compressed wall lane → open bog/lens loops → Bridge Berry → high reveal → homeward shepherd cut | persistent Bridge Berry, fight or communal roll | Norway ground/water, giant footprint landmarks, dry-stone courses | exposed, funny, watchful | Claims “giant tracks become navigation grammar and permanently reveal the return cut.” |
| 15 | **lilleby** | Ch4 | **A town planned at 2.3× native scale where single domestic objects become districts.** | west giant gate → Great Square → warehouse market → table lawn → doorstep/garden lanes | first kneeling giant beat and human picnic on the great table | giant facades, sparse huge furniture, Norway masonry | sincere hospitality at impossible scale | Claims “negative space and one-object architecture as the scale joke.” |
| 16 | **spine_hand** | Ch4 | **Five finger/knuckle ridges turn anatomy into a readable landscape.** | wrist arrival → palm-crease loop → nail cliffs → listening-child pocket → arm ascent | unnamed gi-child asleep with beads off the main route | warm skin floor, hair poles, abstract nail rock | strange, intimate, alive | Claims “hand anatomy as terraced route, never a giant sprite.” |
| 17 | **spine_shoulder** | Ch4 | **A rolling switchback is severed by one map-wide meltfall until Freeze makes the stair.** | lower shoulder climb → casting apron → live water divide → frozen upper ascent | same-visit water-to-ice art/collision and guaranteed NOISE reward | reflective meltwater, authored frozen-pond cell, rocky snow | high, cold, effortful | Distinct from Wintermoor: Freeze itself is the complete intervention; no machine follows. |
| 18 | **spine_ear** | Ch4 | **A broad organic spiral compresses sound toward a resonance chamber.** | outer hair gate → wax bends → Whisperwig chamber → post-boss stone hum | hostile pressure retires into the Deep Hum and one enormous snore | amber wax, giant hair, resonance stones, deep muffle | pressured, warm-dark, relieved | Claims “spiral acoustic compression whose centre changes state after victory.” |

**Historical Foggybottom fast-follow queue (superseded 2026-07-12):** the
original pilot proposed fog wisps/haloes/fog-horn, a Roman drain arch,
per-mover terrace collision, facade enrichment, and deferred cliff caps. The
production close delivered the Roman culvert plus the chapter-wide landmark
kit, live atmosphere/ambience, populated service interiors, and tested mover
handling. The unbuilt wisp/halo/fog-horn and shared cliff-corner families are
optional game-wide art debt; they are not missing route dependencies and must
not change Foggybottom's claimed signature.

## Signature bank — provocations NOT yet used (invent beyond these; do not treat as a to-do list)

A boardwalk zig-zagging over a sphagnum bog · a terraced orchard descended switchback by switchback ·
a birch maze where white trunks (not hedges) block sightlines · a dry creekbed walked IN, below the
banks · a meadow bisected by one impossibly-long fallen log you balance across · a fog hollow navigated
shrine-to-shrine by lantern light · grazing terraces with a runaway-cart hazard · a flooded path where
stepping stones are the only floor · a canopy walk in the treetops · a scree slope you slide down ·
a field of standing stones that reconfigure · a night market lit only by stalls.

## How to use this file

1. **Concept step:** the diversity critic reads this table + the new map's proposed signature/regions/
   set-piece/palette, and rejects any repeat (see the four collision tests above).
2. **After a map ships to the bar:** add its row (signature, each region's micro-identity, set-piece,
   new palette, mood). Keep rows terse but specific enough that a future critic can detect an echo.
3. A shared TOOL (the P4 cliff kit, the hedge/bramble autotiles, the foliage-fade band) is NOT a
   signature — many maps may use it. The *signature* is the unique spatial idea the tools serve.
