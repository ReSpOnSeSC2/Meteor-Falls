# Ch.8 — The Paper Dragon (China) — production checklist

> Production implementation date: 2026-07-13. Canon is ADR-143,
> `src/data/maps_ch8.ts`, and `docs/chapters/ch8/blueprint.md`. Final measured
> release evidence belongs in `docs/CH8_PRODUCTION_VERIFICATION.md`; unchecked
> close gates must not be described as optional polish.

## Canon and world

- [x] Region/travel: China; Bert/Lucille reaches the riverboat connection,
      riverboat owns Lotus arrival, Lucille remains backtracking, Yak Express
      owns the forest-to-temple leg
- [x] Target level 40; Heartlight **The Folded Hymn**; Ember 8; no permanent
      new member joins
- [x] Stable maps: `lotus_harbor`, `bamboo_road`, `spore_forest`,
      `mt_shu_temple`
- [x] Final dimensions: 112×80, 104×64, 88×104, 96×104
- [x] `CH8_WORLD` centralizes dimensions, reciprocal route mouths/landings,
      story/quest/hazard rectangles, safe pockets, recovery, vehicle parking,
      migration, and profile spawns
- [x] Four distinct signatures: terraced river crescent; braided
      lock/switchback ascent; safe-pocket fungal loops; folded processional
      temple with separate Dragon/bell destinations
- [x] Every chapter spawner retires after `paper_dragon_defeated`; transition,
      cure, and recovery grace remain clear
- [x] Chapter recovery rhythm is exactly Lotus Harbor, Spore Forest, Mt. Shu
      Temple; Bamboo Road's pavilion remains a landmark rather than a fourth
      registered chapter recovery
- [x] Four persistent optional caches and all core story/quest beats are placed
      on reachable routes

## Lotus Harbor and tenancy

- [x] Twenty-four exterior source-facade placements and twenty-two live units,
      `lotus_harbor_unit_0` through `_21`; two suffix lots remain locked
- [x] Historical prefix preserved: lantern shop → unit 0/realtor; tea house →
      unit 1/home host; temple → unit 2/dealer; tea house → unit 3/hotel clerk
- [x] Appended tenancy cannot renumber units 0–3
- [x] Eight Lotus source identities and eight explicit authored city-scale
      promotions; no Lotus city-scale procedural fallback
- [x] Market, property, agency, dealership, hotel room, phone, ATM, dock, fuel,
      vehicle bay, and `the_stretch` seams remain live
- [x] Dedicated named identities: Harbor Master, Calligrapher, Lantern Girl,
      Tea-House Monk, Yak Handler, Lotus Bargeman, Mt. Shu Elder

## Story, travel, and branch safety

- [x] Full seven-panel `ch8_journey` gallery remains in canonical order
- [x] Contextual runtime cuts: riverboat, arrival, Spore, Yak, false folds,
      Dragon, Heartlight
- [x] Dedicated departed-Pippa Dragon/Heartlight panels prevent party-state
      contradictions; corrected canonical panels include Dorin
- [x] Lotus → Bamboo → Spore → Yak → Mt. Shu chronology is playable without a
      chapter-entry spoiler reel
- [x] Missing Trust setup/escalation scenes are staged at real world beats;
      migration never invents FREE or STRINGS
- [x] FREE keeps Pippa; STRINGS keeps her only if reconciled with rewind count
      at most two; departure persists her exact serialized record on a bench
- [x] Pippa-present and Pippa-departed routes supply equivalent crease/route
      knowledge without making Pippa a completion prerequisite
- [x] Bamboo Clicker clearing is public, controls only unoccupied machinery,
      exposes the spoof, paints/repairs the lock, and grants The Lotus Bargeman
      Caller once
- [x] Paper Dragon flag → retry-safe Paper Fan → safe restart → gated bell →
      Heartlight flag → contextual panel → `ember8` → exact `embers = 8` →
      `ch8_complete`

## Mushroomized and Teleport Beta

- [x] Stable internal token `mushroomize`; player-facing **Mushroomized**
- [x] Deterministic latched phases: clockwise, counter-clockwise, reverse
- [x] Transform is applied after common `INPUT.dir()` handling; action/menu/
      dialogue inputs are untouched
- [x] Status persists across save/load/map travel and records a clean recovery
- [x] Spore Puffer and authored forest hazards inflict it
- [x] Spore Antidote consumes on a successful cure; Scroll of Calm is reusable;
      doctors and defeat recovery also cure it
- [x] Teleport Alpha/Beta run-ups are 96/32 native pixels with distinct 2/4 PP
      costs and one terminal charge
- [x] Mt. Shu elder is the sole canonical `awake_teleport_b` grant; no level-34
      auto-unlock
- [x] Only visited, story-open destinations with safe anchors are offered
- [x] Wall failure is soot-faced, charges once, does not travel, and cannot strand
      the party; success reforms followers and leaves vehicles unchanged
- [x] Battle/cutscene/modal/incompatible-vehicle/stolen-Locket blocks are explicit

## Exactly five Chapter 8 quests

- [x] **Brushes of Mt. Shu** → Scroll of Calm; The Calligrapher heal 1,400;
      finished banner and recovered-brush rack
- [x] **Lanterns of the False Fold** → Paper Crane Charm; The Lantern Girl
      damage 820; three honest crane lanterns
- [x] **The Yak Who Waits** → Jade Salamander Charm; The Yak Handler damage
      880; fed Yak, repaired route bell, open scenic depot loop
- [x] **The Harbor's Balance** → River Beads; The Harbor Master damage 900;
      balanced scales, cleared quay, stocked shelf
- [x] **Tea for the Empty Chair** → Temple Incense; The Tea-House Monk heal 960;
      steaming remembrance cup
- [x] Persistent intermediate flags, hands-full retry, exactly-once reward/
      Caller, post-boss backtracking, and no permanently missable flow

## Combat and rewards

- [x] Focused regular roster: `paper_lantern_wisp` 5,500 HP,
      `spore_puffer` 6,500, `origami_warrior` 8,000,
      `porcelain_warlord` 11,000
- [x] Regulars have production battle hooks, base/`_w1`/`_w2`, minis, useful
      drops, and map tells
- [x] Origami's dedicated `refold` move kind lasts four turns, keeps physical
      shield, changes normal
      FIRE weakness/FREEZE resistance to FREEZE weakness/FIRE resistance,
      retains VOLT weakness, drives damage plus Spy/Scope, and restores the
      normal profile on relaxation; the focused data and real-handler runtime
      tests plus typecheck pass
- [x] Paper Dragon exactly 45,000 HP, level 40, offense 80, defense 42, speed 34,
      no weakness, Volt resistant, mind immune
- [x] AIRBORNE physical immunity only while airborne; Volt/Bottle Rockets ground
      for exactly two turns despite Volt resistance
- [x] One below-30% transition to distinct BURNING art plus one doubled-speed
      action; normal HP victory
- [x] Paper Fan award is retry-safe, exactly once, and independent of Ember state

## Save, profiles, art, and generated evidence

- [x] Save schema/version 25 and v24→v25 migration
- [x] Recovery for four maps, units 0–21, Lotus hotel room, outdoor parking,
      Mushroomized, departed Pippa, Teleport Beta, Trust/Clicker, and quests
- [x] Migration remains deterministic/idempotent, preserves unrelated state,
      rejects future versions, and does not invent choices/rewards/heroes
- [x] Thirteen profiles: arrival, city, barge, trustFree, trustStrings,
      mushroomized, forestCured, brushes, yak, temple, boss, postBoss, complete
- [x] Eight source/promoted Lotus facade pairs; seven named NPC sheets; four
      enemy families and minis; Paper Dragon base/BURNING families; Spore
      background; riverboat; Yak Express; nine branch-safe panel pairs
- [x] `tools/render-map.ts` includes all four maps, every live Lotus unit, and
      `citysvc_lotus_harbor_hotel_room`
- [x] Focused map, cutscene, quest, Mushroomized, Teleport, story, boss,
      migration, profile, facade, and authored-asset contracts are present

## Final close gates — fill only from completed commands

- [x] `npx.cmd tsc --noEmit` — pass after the focused behavioral/geometry fixes
- [x] `npx.cmd tsx tools/door-audit.ts` — 275 maps; 0 real stuck, wrong-edge,
      or body-blocked doors; documented one-way and frozen-pyramid waivers only
- [x] Final `npm.cmd run mapeditor:gen` — generated manifest has 62
      legend/tile registrations, 325 props, 276 facades, 10 regions, 99 NPCs,
      21 tracks, 17 areas, 1,461 dialogue IDs, 275 maps, 154 handlers, and 153
      used trigger IDs
- [x] Regenerated after the final picnic/unit-migration safety adjustment
- [x] `npm.cmd run validate` — pass with only documented frozen-rotor waivers
- [x] `npm.cmd run visuals:audit:strict -- --out=output/visual_identity_ch8.md`
      — 144/144 authored, 0 legacy
- [x] `npm.cmd run enemies:frames` — 147/147 battlers fully hi-res
- [x] `npm.cmd run anim:audit:strict -- --out=output/character_animation_ch8.md --html=output/character_animation_ch8.html`
      — 84/100 clean, 0 errors, 0 warnings, 58 assessed hints, exit 0
- [x] `npm.cmd run balance` — Paper Dragon conservative/read TTK 6/5
- [x] Focused safety results: actual-method Ch8 runtime 9/9; broader behavioral
      group 108/108; Ch8 combat data 6/6; real Refold handler 1/1;
      `maps_ch8` 21/21; migrations + Title profiles 230/230
- [x] Remaining focused Chapter 8 and shared regression suites passed
- [x] `npm.cmd run test` — 123/123 files, 2,017/2,017 tests
- [x] `npm.cmd run build` — 1,066 modules, pass
- [x] Final `tools/render-map.ts ch8` — `output/maps_ch8.png`, 1186×7084,
      27 panels including the hotel room and units 0–21
- [x] Rerendered and rereviewed after the final picnic-anchor correction
- [x] `git diff --check`
- [x] Original-resolution inspection of map sheet, facade contact, all panel
      variants, named NPC sheets, regular enemies/minis, Paper Dragon forms,
      Mushroomized treatment, riverboat, and Yak Express
- [x] Pre-final original-resolution Chapter 8 map-sheet inspection found no
      omitted panel or geometry defect; the long hotel-title renderer issue was
      corrected
- [x] Live desktop keyboard and phone/touch survey with settled
      frames and browser-console inspection
- [x] Partial live control/render proof: desktop 1280×720 Lotus Harbor, Bamboo
      Road, and a regular Ch8 battle rendered; keyboard KeyZ advanced dialogue
      and combat; phone portrait 390×844 and landscape 844×390 rendered; touch A
      and D-pad selection worked in Ch8 combat
- [x] Retested browser console after the `navigator.storage.persist` rejection
      fix — fresh settled Lotus Harbor load had 0 warnings and 0 errors
- [x] Physical controller unavailable; automated gamepad coverage is not claimed
      as a live hardware pass
- [x] Protected hashes rechecked; `docs/VERIFICATION.md`,
      `docs/asset-lists/visual_identity.md`, and `tmp/` absent from the index
- [x] Exactly 142 intended paths staged by literal allow-list; cached diff
      inspected and clean; focused
      Chapter 8 commit; no push or merge
