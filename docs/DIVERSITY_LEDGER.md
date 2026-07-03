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
| 1 | **foggybottom** (FOGGYBOTTOM-ON-TYNE) | Ch3 | **A four-terrace sea-cliff you descend into a SINKING FOG-CEILING** — the fog is a physical veil keyed to your terrace (thin on the rim, grey soup on the quay); you navigate by which landmark pokes up out of it. The descent IS the drama. | RIM GARDENS (L3, sunlit allotment, the fog-gate + vista) → HIGH STREET (L2, grey stone canyon, civic spine) → MARKET SHELF (L1, tilted plaza half-over-water) → DROWNED QUAY (L0, fog-soup waterfront). Each a distinct level = distinct palette + fog density + prop vocabulary + sightline. | the reversible **fog-well vista** (look down from the rim = whole route previewed; look up from the quay = town climbing back into light) | **engine** level-scaled fog veil (`atmosphere:'fog'`, `buildFog`; alpha 0.14→0.62 by terrace) + the shipped P4 cliff kit. NO new authored art (bespoke fog wisps/haloes/fog-horn/Roman-drain are the fast-follow). | EarthBound-melancholy-damp: warm gas-lamp gold bleeding into cold brine-grey, pressure + wet rising rung by rung. | First SHIPPED elevated map. NO tree-belts, NO same-plane clearings — a single VERTICAL object; distinct-every-step is ENGINE-guaranteed (four levels = four fogs). Three stairs STAGGERED W/C/E so the descent doglegs. **The fog-ceiling-that-sinks + navigate-by-what-pokes-up is claimed — no other map may reuse a level-scaled atmosphere as its headline signature.** |

**Fast-follows queued for foggybottom** (do not re-signature — these ENRICH the shipped pilot): bespoke ChatGPT art (drifting fog-wisp props, landmark halo glows, a fog-horn post, the Roman drain-arch that makes the SW-quay walk-behind secret real); per-mover terrace collision (so NPCs can wander on an elevated map — they're `idle` for now); facade-density enrichment (high-street "both sides" + a market/quay building or two); the deferred P4 corners/caps + stair-band strip if a live cliff-end reads raw.

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
