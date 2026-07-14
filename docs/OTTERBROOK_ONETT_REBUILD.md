# OTTERBROOK — the ONETT rebuild (World Overhaul S5, Ch.1 pilot)

> **Historical rebuild blueprint—superseded by ADR-145 (2026-07-14).** Its
> design rationale survives, but open milestones and proposed graph changes do
> not describe current work. Production uses unified `otterbrook` at 112×198,
> the Hickory Hill cave `oak_roots`/`oak_hollow`/`oak_heart` chain, and an exact 81-map
> Chapter-1-owned roster plus the pre-completion Chapter 2 docks boundary.
> `downtown_otterbrook`, `hill_road`, `hickory_trail`, `whisperwood_rise`, and
> `hickory_hill` are retired with deterministic save-v27 recovery to tile
> (56,100). Titanic Tick is 200 HP in the deepest cave arena; the crater is the Sentinel set
> piece. The production blueprint and measured verification supersede every
> unchecked or gray-box milestone below.

User directive (2026-07-03): rebuild the Chapter-1 world to mirror **EarthBound's ONETT** —
town at the base, the hero's + Chad's houses on an **elevation above town**, **Hickory Hill's
mountain flanking the west**, trees all around, **rounded tight winding corridors** up the
hill; **3/4 up, a fenced "DON'T ENTER" house** whose owner blocks the door, foreshadows a
later meeting, and hides a **daytime secret treasure**; **healing presents** staged up the
climb; the **first boss redesigned like Giant Step** (a cave → sanctuary with the light beam);
and the **first purchasable property (27 Maple) on its own section WEST of town**.

Canonical, living blueprint under the World Overhaul program (`docs/WORLD_OVERHAUL_HANDOFF.md`)
+ the S5 Prime Law (NO FORMULA, `docs/DIVERSITY_LEDGER.md`) + the three binding design docs.
Reference art the user gave: the Onett overworld (rounded brown-cliff corridors, the fenced
"DON'T ENTER" house with a man out front) and the Giant Step cave + light-beam sanctuary.

> **v2 (2026-07-03).** Revised after a 4-critic adversarial review (opening-machine soft-lock,
> frozen-core scope, per-mover collision, dialogue/quest migrations, diversity re-signature)
> AND the discovery that **foggybottom already shipped** as the first 4-terrace elevated map —
> so multi-level is PROVEN and `buildFoggybottom` (`maps_ch3.ts:122`) + `maps_foggybottom.test.ts`
> are the reference/templates. Every "verify against real code" finding is folded in below.

## 0. LOCKED DECISIONS (user, 2026-07-03 — do not relitigate)

0. **SCRAP THE CURRENT OTTERBROOK ENTIRELY — rebuild ground-up, ONETT-faithful (user, 2026-07-03,
   emphatic).** The current town "looks horrible and not like a real town at all." Do NOT preserve
   or translate the existing layout/core (the earlier "keep town content, translate down" plan is
   DEAD). Rebuild the whole town from scratch to be **very true to life of what Onett was, down to
   the details and polish** — a believable small town: a REAL main street with distinct, purposeful
   buildings (drugstore, hospital, bakery, arcade, police station, burger joint — each an actual
   place, not a generic `bldg_gen_*` box), winding tree-lined roads, rounded Onett cliffs, cars in
   traffic, believable yards/fences, a north road up toward the meteor hill, and lived-in density.
   The frozen-1995-core `world_block` test is REPLACED (we no longer preserve the core). What's KEPT
   is the *content/soul* — shops/interiors, Chad, Borden's frame-up, the Biscuit quest, the opening,
   the meteor/boss beats — all RE-HOMED into the new Onett-faithful layout; nothing narrative is lost.
   The rounded cliff-corner tiles (authored 2026-07-03, ChatGPT, the nine-slice) are a building
   block FOR this new look. Fidelity target = Onett-faithful *design language / quality / believability*
   with Meteor Falls' own content (an original town that could sit beside Onett), NOT a pixel-copy.

1. **ONE elevated map** = Otterbrook town (base, level 0) + the residential climb (winding
   rounded Onett corridors; a **Hickory-mountain cliff wall on the WEST**; trees all around)
   with **Jay's + Chad's houses on a terrace above town**, **Pemberton's fenced "DON'T ENTER"
   house 3/4 up**, **healing presents** staged up, topping out at **HICKORY HILL = the
   meteor-crater site** (opening set-piece + dormant **Sentinel husk**; **NO boss here**). The
   four climb maps (`hill_road`, `hickory_trail`, `whisperwood_rise`, `hickory_hill`) DISSOLVE
   into this one map as terraces.
2. **First boss on a SEPARATE hill.** The **Titanic Tick** (HP **200**, unchanged) moves to a
   new **boss hill** (a bald windswept knob, structurally OPPOSITE the wooded town climb) →
   **cave (a downward descent)** → **Giant-Step sanctuary (a light-shaft bowl carved in stone)**
   → the Tick. RETIRE the **Under-Oak** (`oak_roots`/`oak_hollow`/`oak_heart`); the **Heart Oak
   stays in Pond Park as a healed landmark**.
3. **Pemberton** = the mystery man (Milo's estranged father, the Long Shot rocket-builder, a
   Ch.10 caller). Fenced "DON'T ENTER" workshop; blocks entry during the hush-dark (foreshadow),
   opens **post-`tick_defeated`** ("daytime" = story clock, no real time-of-day) → a secret
   treasure + a Ch.10 callback flag (`met_pemberton`). Canon bridge in §5.
4. **27 Maple, fully built** on a NEW section WEST of town: a facade + a **visitable interior**
   (furnished + save phone; storage deferred) + the EXISTING buy flow relocated west.

## 1. TARGET TOPOLOGY (the Ch.1 map graph after the rebuild)

```
   27_maple_west  ◄──west edge (y≥32, appended)──►┌──────────────────────────────┐
   (new: 27 Maple facade + interior;              │      OTTERBROOK (ONE map)     │──east gate──► meadow_mile → … → brickton
    realtor beat relocated here)                  │  TALL: town LOW, hill HIGH    │
                                                  │  L3  crater crest (top rows)  │  ← Hickory: meteor rock + Sentinel husk
                                                  │  L2/3 PEMBERTON DON'T ENTER   │
                                                  │  L2  winding climb + presents │
                                                  │  L1  JAY + CHAD terrace       │
                                                  │  L0  town (all wanderers here)│
                                                  └──────────┬───────────────────┘
                                                             │ fork off the upper climb / crater shoulder
                                                             ▼
                                                    boss_hill (new; bald knob, NO switchbacks)
                                                             │ cave mouth (door)
                                                             ▼
                                                    giant_step_cave (new; DOWNWARD winding descent, fights, a rest+cache)
                                                             │
                                                             ▼
                                                    giant_step_sanctuary (new; light-shaft stone bowl)
                                                             │  trigger (id reused) → heartOakScene → TITANIC TICK
                                                             ▼  victory → tick_defeated → dawn rebuild (fadeRestart, location-agnostic)
```

RETIRED: `hill_road`, `hickory_trail`, `whisperwood_rise`, `hickory_hill`, `oak_roots`,
`oak_hollow`, `oak_heart`. NEW: `boss_hill`, `giant_step_cave`, `giant_step_sanctuary`,
`27_maple_west`, `27_maple_int` (+ Pemberton's tiny interior). Pond Park keeps the Heart Oak
(healed), loses the `burrow_mouth` prop + the `oak_roots` door.

## 2. THE ELEVATED OTTERBROOK — layout & the frozen-core reality

### 2.1 SCRAP & REBUILD — a from-scratch Onett-faithful town (no core to preserve)
Per §0.0, the current Otterbrook layout is thrown out. `growOtterbrook` is **rewritten from
scratch** to author one tall Onett-faithful map: the town occupies the LOWER band (town at the
base), the residential hill + climb + crater stack in the UPPER band (small-y = high elevation).
There is **no frozen 1995 core to place** — `buildOtterbrook` (the old 42×32 core) is retired
along with the district-sprawl logic; the whole map is hand-authored fresh.

**The `world_block` Otterbrook test is REPLACED**, not tweaked (we no longer preserve a core):
- Retire `coreRegionMatches` / `corePrefixUnchanged` for Otterbrook (the byte-frozen-core contract
  is gone). Replace with a new `maps_otterbrook.test.ts` guard that pins the NEW invariants: the
  fixed points that must survive future edits (external warps, opening grounds, the boss-hill fork,
  the west 27 Maple door), settlement:'town', reachability, and the elevation guard (mirror
  `maps_foggybottom.test.ts`) + `ELEVATED_ALLOWLIST`.
- tile envelope `≤12500` (`world_block.test.ts:78`) → raise to the new regional envelope (target
  ≈ **126×128** = 16,128; decide exact H in S-0). prop cap `≤400` (`:79`) → raise as needed.
- Keep Brickton's `world_block` assertions intact (only the Otterbrook ones are replaced).

**Onett design-language checklist** (the believability bar — the town FAILS review if it reads as
generic boxes): a real MAIN STREET with a curb/sidewalk hierarchy and DISTINCT purposeful buildings
(drugstore, hospital, bakery, arcade, police station, burger joint — bespoke facades, not
`bldg_gen_*` repeats); winding tree-lined roads with rounded Onett cliffs (the new corner kit);
believable residential blocks (yards, fences, driveways, mailboxes, varied houses); cars in traffic
on the streets; a north road climbing to the hill; lived-in NPC density; and framed reveals between
districts. Study real Onett's landmark set + street rhythm before authoring (§ blueprint step).

### 2.2 Multi-level is PROVEN — foggybottom is the reference
Otterbrook is the **SECOND** multi-level map. `foggybottom` (`maps_ch3.ts:122`, allowlisted
`elevation.test.ts:23`) already ships an L0/L1/L2/L3 plane with 3 single-step `K`+`T` seams,
staggered stairs, and STATIC terrace NPCs; `maps_foggybottom.test.ts` proves 4-terrace stacking,
monotonic descent, cross-level collision, reachability, and the P4 mid-band. The depth math
(`levelDepthBias = h·TILE_PX`) is level-agnostic and works at maxLevel 3. → **Mirror
`maps_foggybottom.test.ts`** (NOT the 2-level `maps_elev_spike.test.ts`) for the Otterbrook
guard test, and add `'otterbrook'` to `ELEVATED_ALLOWLIST` in the SAME slice.

The genuinely NEW-for-Otterbrook part is a **partially-flat plane**: a large byte-preserved L0
town + an elevated upper band. That seam (town→first terrace) is the #1 live-verify target.

### 2.3 The per-mover-terrace collision PREREQUISITE (engine slice, before the map)
A living town has wandering NPCs + traffic + roamer spawners. But `collidesStatic`
(`OverworldScene.ts:2280`) makes a tile solid when `levelGrid[ty][tx] !== this.playerLevel`
(guarded by `maxLevel>0`) — keyed to the **player's** level, not the mover's. So on an elevated
Otterbrook, L0 wanderers freeze or clip up the cliff whenever the player climbs. foggybottom
sidesteps this by using **only static/idle NPCs**; Otterbrook's living town cannot.

→ **Land the deferred P5 per-mover terrace collision FIRST** (`docs/WORLD_OVERHAUL_HANDOFF.md`
P3 note; memory's "S6 per-mover terraces"): give each mover its own `level` scalar (seeded from
`levelAtPx` at spawn, flipped on `T` like the player), and make `collides()/collidesStatic` use
the **mover's** level, not `this.playerLevel`, for the cross-level rule. Guard so flat maps stay
byte-identical (`maxLevel>0` only). Test: a mover on L0 stays free while the player is on L1.
This unblocks living elevated towns for the WHOLE overhaul, not just Otterbrook.

### 2.4 Terrace plan (Onett grammar, engine-legal) — per-region DISTINCT SHAPES (S5 gate)
Each region gets a NON-corridor micro-identity so the climb never reads as "more of the same
corridor" (the diversity critic's D1):
- **L0 town** — the whole existing town (downtown/square/civic/Maple/Pond/Otter Green/Hollow),
  flat, all wanderers/traffic/roamers here. Unchanged in spirit.
- **town→L1 seam** — a `K` band with rounded ≥3-wide `T` stair cuts; the **Hickory mountain**
  is a tall multi-row `K` wall hard on the **WEST** (impassable). *Signature move:* the west
  wall doubles as a **scree slope you can slide DOWN** — a one-way secret shortcut back to town
  (W7 reward), giving the bare mountain a mechanical identity.
- **L1 — a flat cul-de-sac of YARDS** (not a corridor): **Jay's + Chad's houses**, Chad's
  **porch + bug-zapper** (the Glint-death beat is sacred — keep it). Static/idle NPCs only.
- **L2 — the winding climb + an OVERLOOK peninsula** that reframes the town below (a look-back
  beat, not a pass-through). **Healing presents** (`walkPresent`) in dead-end pockets (W4/W7).
- **L2/3 — PEMBERTON'S fenced "DON'T ENTER" shoulder** — a dead-end you can't cross yet
  (negative-space beat). §5.
- **L3 — the scorched crater bowl** — a DESTINATION, not a thoroughfare: `meteor_rock_hickory_hill`,
  the `sentinel_husk` (ifFlag `sentinel_repelled`), the `crater` trigger, ringed by meteor
  **ejecta "standing stones"** (a stone-circle read making the summit a place). The only way on
  is the fork to the boss hill (§3).

Single-step seams only (each L(n)→L(n-1) drop is `K`-walled or `T`-staired; no bare drop, no
>1 jump). 4 read-levels via 3 seams — the foggybottom-proven topology.

### 2.5 Fixed points & touchpoints that MUST be handled (in the merge slice)
| Item | Today | After |
|---|---|---|
| **Opening state machine** | `opening.ts:30-37` gates phases on `mapId==='hickory_hill'`(1,3)/`'otterbrook'`(2) | **REDESIGN flag-driven** (phases sequenced by `op_fell`/`op_house` on `otterbrook` alone); rewrite `opening.test.ts:13-34` |
| **New-game boot** | `NameEntryScene.ts:218` boots `{mapId:'hickory_hill', x:896,y:2560}` | repoint to `otterbrook` at the crater-foot spawn |
| **Opening crater CUT** | `cinematicCut('hickory_hill',232,660)` (OverworldScene:6858) | `cinematicCut('otterbrook', <crater-foot px>)` |
| **Opening crater PAN** | `openingHillClimb` starts pan at `mapH - s(40)` (:6874-76) | **re-derive** pan-start from the crater PROP position (N tiles below it), NOT `mapH` — a pan-geometry redesign |
| House-overview pan / impact anchor | `house_rex` + `meteor_rock_hickory_hill` texture lookups (:6837,:6870) | safe — props still on the map |
| Bedroom wake cut | `cinematicCut('rex_bedroom',72,88)` | unchanged |
| `crater` trigger | on hickory_hill (maps:1705) | on the merged crest (appended → triggers become a prefix, §2.1) |
| `CH1_STORY_NIGHT_MAPS` | otterbrook + 4 climb + 3 oak (OverworldScene:256) | otterbrook + boss_hill + giant_step_cave + giant_step_sanctuary |
| ~~HILL_MAPS~~ | **does not exist** (phantom) | delete from any checklist; only CH1_STORY_NIGHT_MAPS is real |
| `UNDEROAK_SKIN_MAPS` | 3 oak maps (OverworldScene:301) | remove the retired ids |
| `chapters.ts:50` (Ch.1 shipped manifest `maps:[]`) | lists the 4 climb maps → content-validate:2771 asserts they exist | remove the 4; add the new maps |
| content-validate `TABLES` picnic gate | `hickory_hill:1` (content-validate:2858-2884) | move the rest to `otterbrook` (raise count) or drop |
| `render-map.ts:240` ch1 id list | lists hill maps (display-only, `.filter(MAPS[id])`) | update ids (non-fatal) |
| **Biscuit quest** (`biscuit_come_home`, quests:21-33) | clues set `q_biscuit_c1→c2→c3` via props/signs on hill_road (maps:1536,1556,1564) + hickory_trail (:1673,:1688) | **migrate EVERY `q_biscuit_*` clue prop+sign** onto the merged climb, order+gates preserved; objective text ("climbs Hickory Hill", "OTTERBROOK DRUG") stays valid; keep `biscuit_road`/`_after` (ifFlag/unlessFlag tick_defeated). Trail goes UP THE CLIMB, **not** the boss hill |
| **`hodgkin_mower`** reward chain | patrol [[8,8.5],[20,8.5]] on hickory_trail → `q_mower_caught` → `hardwareBeat` grants `has_trail_key` (shed up Hickory Trail) → `npc_hodgkin_*` | patrols can't ride a terrace (§2.3) — **relocate the mower + shed + reward onto an L0 town lane**, keep the chain; OR retire it (decide S-1) |
| rex_home / chapel / all town doors | core prefix | recompute landings for the new core offset (§2.1); keep append order |
| East gate → meadow_mile | (124/125,50) | unchanged (still gated `unlessFlag tick_defeated`) |

## 3. THE BOSS HILL + GIANT STEP (Tick relocation) + the dialogue rewrites

Three new maps off the crater/upper-climb fork:
- **`boss_hill`** — a bald, treeless, windswept knob: **NO switchbacks** (the opposite of the
  wooded town climb), a single short exposed approach to a **cave mouth** door. Optionally gated
  behind a story beat (Onett's barricaded north road) via a `sawhorse`-style `unlessFlag` prop.
- **`giant_step_cave`** — a **DOWNWARD** winding descent (opposite the up-climb): the dark
  cavern (first EB screenshot), on-curve fights (reuse tick_nymph/coily_cicada/hill_slug_deluxe,
  gated `zapper_done && !tick_defeated`), a breather rest + a `walkPresent` cache. **Author FRESH
  cave dressing (carved stone, mineral veins) — do NOT re-skin the retired `oak_*` root/ember/
  glow-shroom dressing** (the S5 diversity gate rejects the echo). *Navigation gimmick:* follow
  the next **beam of light down** shaft-to-shaft (fresh, serves the Giant-Step homage).
- **`giant_step_sanctuary`** — the **light-shaft bowl carved in stone** (second EB screenshot):
  the boss trigger + a light shaft as the set-piece.

**Boss wiring (relocate, don't re-balance).** `titanic_tick` stays HP **200** — the pins
(`enemies.ts:1333`, `chapters.ts:44`, `curves.ts:65`, `content-validate.ts:1309`, and a 5th at
`state.test.ts:331`) all already read 200, so **NO pin edits are needed** (they'd only matter if
HP moved). `heartOakScene()` (OverworldScene:7497) is unchanged; the trigger `case 'heart_oak'`
(`OverworldScene.ts:5075`) is a **bare id switch with NO map guard**, so `heartOakScene` fires
wherever a trigger with that id lives → **move the trigger rect** to `giant_step_sanctuary`
(keep the id, or rename it AND the `case` label together). The dawn `fadeRestart()` is
location-agnostic (works from the sanctuary); add a short "the light returns to the whole
valley" beat so the spatial jump reads.

**Rewire every `tick_defeated`/`zapper_done` consumer** (they gate town-open, not location):
set on victory (:7505), hush-dark apply/fade (:822/:828), **Meadow Mile gate** (:4789),
**bus** (:5086) — all keep; the trigger guard moves with the trigger.

**DIALOGUE REWRITES the relocation forces** (the story critic — do NOT skip):
| Key | File:line | Why it breaks | Action |
|---|---|---|---|
| `heart_oak_approach` | dialogue:846 | describes the Pond Park oak + "eight-legged… DRINKING the town" | rewrite for the stone sanctuary |
| `tick_after` | dialogue:851 | pours warmth "into the oak, the pond" | rewrite for the valley/town |
| `dawn_hush_dark` | dialogue:907 | **PRIMARY wayfinding**: "POND PARK… HEART OAK… Start there" | repoint to the boss-hill fork |
| `meadow_gate_hushdark` | dialogue:560 | "it's coming from Pond Park" | repoint |
| `bus_closed_detour` | dialogue:1143-44 | "curled up in the Heart Oak in Pond Park" | repoint |
| `sign_oak_burrow`/`oak_roots_enter`/`oak_cache(+_done)` | dialogue:927,931,934-38 | orphaned by retirement | remove/repurpose |

**Retire the Under-Oak cleanly:** delete `oak_roots/hollow/heart` from `MAPS`(4387-89) +
`MAP_AREA`(4483-85) + `CH1_STORY_NIGHT_MAPS` + `UNDEROAK_SKIN_MAPS` + `chapters.ts` (if listed) +
their builders; remove the Pond Park `burrow_mouth` prop (maps:922), `sign_oak_burrow` (:982),
and the appended burrow door (:1009); keep the `tree_c` **Heart Oak** as a healed landmark
(drop its boss-era scorch). Flip `world_block.test.ts:93` to the boss-hill fork.

## 4. 27 MAPLE — the west section (buy flow EXISTS; build the place)

The **buy transaction already ships** (`agencyBeat` OverworldScene:3266-3289, ADR-115:
affordability gate + `owned_27_maple` + `deed_27_maple` + `buyCost`). `balance.test.ts:56`
depends on `ownedIds:['27_maple']` — **do NOT rename the id.** What's missing is the PLACE:
- **`27_maple_west`** — a small hand-authored district west of town (it IS a `settlement`, so
  `occupyCity` runs on it — `maps.ts:4527`). Place the 27 Maple facade with an **explicit
  hand-authored `door`** to `27_maple_int` — occupyCity only auto-doors facades matching
  `bldg_* && solid && !p.door` (`citylife.ts:340`), so a hand-door immunizes it (the "SEALED
  facade" idea is the wrong lever — that only adds a knock-sign). Relocate the **realtor
  NPC/agency beat** here.
- **west-edge door on grown Otterbrook** — at `x:0, y≥32` ONLY (rows 0-31 are the frozen core;
  a west door there mutates `coreRegionMatches`). Carve the mouth into the WEST WALL belt
  (`maps.ts:587`) in `growOtterbrook` AFTER the core copy, and PUSH the door AFTER the core
  doors (mirrors the appended east gate at `maps.ts:1006`). Add the RETURN door on
  `27_maple_west` (east edge) — both sides walkable + ≥40px from their reciprocal or door-audit
  flags `farFromReturn`/`landsSolid` (FATAL).
- **`27_maple_int`** — a furnished starter home (reuse `rex_home` furniture) + a **save phone**
  (phones ship). **Entry is an OPEN HOUSE** (walk in before buying — a nice tour) so no
  data-driven door gate is needed (doors aren't `ifFlag`-gateable; only a hardcoded check or a
  blocking prop can gate them). Buying sets ownership (net worth) — the save point is "yours."
  **Storage/home-editor is net-new → DEFERRED** (`homeStorage` is save-data only, no actor).

## 5. PEMBERTON — the "DON'T ENTER" beat + canon bridge

Placed ~3/4 up (L2/L3): a **fenced yard + a red "DON'T ENTER" sign**, Pemberton at the door
(homage to the reference screenshot).
- **Block** = a **solid fence/DON'T ENTER prop** across the door mouth (`unlessFlag:'tick_defeated'`),
  NOT a solid NPC (stationary NPCs aren't collision-solid; a wanderer drifts). Pemberton is a
  **stationary/idle** NPC beside it: `dialogue:'npc_pemberton_night'` (foreshadow + "not tonight,
  come back later"), `dialogueDay:'npc_pemberton_day'` (reads when `isNight` false).
- **Day-gate = the story clock** (no real time-of-day): the fence/DON'T-ENTER prop clears and a
  `walkPresent` treasure (`ifFlag:'tick_defeated'`) appears inside/on the porch — the "come back
  in the daytime" payoff (same pattern as `npc_treeline_gawker`/`_day`, Ana/Vivi gift boxes).
- **Treasure**: a meaningful Ch.1 item via `walkPresent` + the `signBeat` loot table; set
  `met_pemberton` for a Ch.10 hook.
- **New dialogue keys**: `npc_pemberton_night`, `npc_pemberton_day`, `sign_pemberton_gate`, the
  `walkPresent` flag + `_done`.
- **CANON BRIDGE (required).** Canon: Pemberton is Milo's estranged father, introduced at Aurora
  Station AK → Mauna Lani HI in **Ch.10** (`GAME_BIBLE.md:602`; caller wired `quests.ts:685`,
  `dialogue.ts:3433`); Milo (English) joins Ch.3. Hand-wave: Pemberton is an **itinerant rocketry
  tinkerer drawn to the meteor-fall** — he set up a temporary hillside workshop to study what
  came down (consistent with later building the Long Shot to reach Mars); estranged + roaming,
  he reaches Alaska by Ch.10. **Verify** the Ch.10 reunion dialogue does not assert "we've never
  met" in a way `met_pemberton` (a Ch.1 in-person meeting) would contradict — if it does, make
  the Ch.1 beat an artifact/overheard-voice rather than a face-to-face, or keep it face-to-face
  and adjust the Ch.10 line. (User locked Pemberton in person; resolve the wording, not the
  placement.)

## 6. NEW AUTHORED ART (palette batches — user approves each; gray-box first)

1. **Onett cliff corners/caps + `stair_top/mid/base`** — the deferred P4 fast-follow; the
   winding corridors make cliffs END mid-map + show prominent stairs. Small strip cloning
   `apply-cliff-kit.ts`. (Do first if gray-box reads poorly.)
2. **Pemberton's "DON'T ENTER" house** facade + the red DON'T ENTER sign prop.
3. **Giant-Step**: FRESH carved-stone cave dressing (stone strata, mineral veins) + the **light
   shaft** sanctuary set-piece — NOT the retired `oak_*` look.
4. **27 Maple** facade + a warm starter-home interior (mostly shipped furniture).
5. Region trees for the residential hill only if temperate `treeSprite` reads wrong (likely fine
   for Ch.1 USA — defer).

## 7. GATED SLICE PLAN (each ends green + live-verified; user drives commits)

Gate order per slice: `tsc --noEmit` → `door-audit` → `validate` → targeted vitest →
`render-map <set>` → (`balance` only if combat changed) → close with full `vitest run` + `build`.
**`npm run validate` GREEN is an explicit exit proof for S-1/S-2** (the retire touchpoints).

- **S-0 Recon/baseline.** `git fetch`; capture door-audit + content-validate stdout baselines
  (prove other maps stay byte-identical; measure the deliberate Otterbrook diff); mtimes on the
  hot files (a sibling just landed foggybottom — re-sync onto the CURRENT post-foggybottom code).
  Decide the exact map H + envelope numbers.
- **S-1 ENGINE: per-mover terrace collision** (§2.3). ✅ DONE (2026-07-03). Added `level` to
  `Roamer`/`PatrolObj`/`NpcObj` (OverworldScene) — seeded from `levelAtPx` at spawn, flipped on
  `T` via the new `levelAfterStep` helper, threaded through `collidesStatic(box, level)` /
  `collides(box, actor?, level)` / `patrolMove(…, level)` at every mover call site (updateNpcs,
  updateRoamers, patrol chase, Borden chase). Guarded `maxLevel>0` ⇒ all flat maps byte-identical.
  Gates: tsc 0 · door-audit clean · validate valid · full vitest 1349/1349 · build 0. (True
  LIVE-verify waits for S-2's elevated town with wandering NPCs — no elevated map carries movers
  yet; foggybottom uses static NPCs.)
- **S-2 The elevated overworld, GRAY-BOX** (§2). Rebuild `growOtterbrook` as the tall multi-terrace
  map (town LOW re-anchored + climb terraces + Jay/Chad/Pemberton shells + crater crest + west
  Hickory wall/scree secret); the elevation plane; dissolve the 4 climb maps; **redesign the
  opening state machine (flag-driven) + NameEntryScene boot + opening pan geometry**; migrate the
  **Biscuit quest clues** + decide the **mower/shed** fate; update CH1_STORY_NIGHT_MAPS,
  chapters.ts, content-validate TABLES; replace the world_block Otterbrook pins (§2.1) + add
  `maps_otterbrook_elev.test.ts` (mirror foggybottom) + allowlist. **Live-verify** the town→L1
  seam + every corridor-against-cliff (≥1 clear floor tile below each `K`) + stair climbs, no
  soft-lock across the 40×36 body box.
- **S-3 The boss hill + Giant Step + Tick relocation** (§3). New 3 maps; move the trigger; retire
  the oak maps + all references; the DIALOGUE REWRITES; keep HP 200. Live-verify the whole
  `zapper_done → climb → fork → cave → Tick → tick_defeated → dawn` flow on foot.
- **S-4 27 Maple west section** (§4). `27_maple_west` + `27_maple_int` + west door (append, y≥32)
  + relocate the realtor beat + open-house entry + the return-door test.
- **S-5 Pemberton beat** (§5). DON'T ENTER house + NPC + night/day dialogue + the flag-gated
  daytime treasure + the canon-bridge dialogue + verify the Ch.10 reunion.
- **S-6+ Art batches** (§6). Author via ChatGPT (user approves each render), install at the
  TILESET tail, swap gray-box → authored, re-verify. Log both maps' rows in the diversity ledger.

## 8. DIVERSITY LEDGER ENTRIES (draft — log on ship; commit the SHAPES so the critic can check)

- **otterbrook (rebuilt)** · **Signature**: *an Onett hill-town you physically climb — town in a
  bowl at the base, rounded switchback corridors up a wooded scarp walled by a bare mountain on
  the WEST (a scree slope you can slide down as a secret), a fenced "DON'T ENTER" workshop at the
  3/4 shoulder, the meteor crater crowning the top.* · **Regions (distinct SHAPES)**: town bowl
  (L0, flat) / yard cul-de-sac (L1, houses) / switchback climb + OVERLOOK peninsula (L2) / fenced
  dead-end shoulder (L2/3, negative space) / scorched bowl ringed by ejecta standing-stones (L3,
  destination). · **Set-piece**: the crater + Sentinel husk you climb toward (also the opening
  pan). · **Palette**: P4 cliff kit (multi-level) + the deferred corner/stair strip. · **Mood**:
  hush-dark dread → dawn.
- **boss_hill + giant_step_cave + giant_step_sanctuary** · **Signature**: *the ONE place in Ch.1
  you go DOWN and INWARD — a bald windswept knob (no switchbacks) → a downward carved-stone
  descent navigated shaft-to-shaft by the next beam of light → a light-pillar bowl* — structurally
  OPPOSITE the up/open/wooded town climb. · **Set-piece**: the light shaft. · **Palette**: FRESH
  carved-stone/mineral-vein cave + light-shaft (NOT the retired oak dressing). · **Mood**: dread,
  then the pillar of light.

---
_Status: BLUEPRINT v2 (2026-07-03), review-hardened. Next: S-0 recon (pending the user's git
sequencing call — commit foggybottom first, or pile the rebuild on top unstaged)._
