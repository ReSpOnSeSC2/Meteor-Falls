# DECISIONS.md — Architecture Decision Records

Running log. Claude Code appends a new ADR for every architectural decision.
Format: `ADR-NNN — Title / Date / Status / Context / Decision / Consequences`.

---

## ADR-001 — Stack: Phaser 3 + TypeScript strict + Vite + Vitest

- **Date:** 2026-06-10
- **Status:** Accepted (canon, GAME_BIBLE §B1)
- **Context:** EarthBound-style tile RPG targeting Android landscape + web, with
  virtual touch controls and Bluetooth controllers.
- **Decision:** Phaser 3.87 / TypeScript strict (no `any`) / Vite 6 / Vitest.
  Capacitor packaging deferred to Phase 9 per the Bible.
- **Consequences:** One codebase for phone browser, PC, and the eventual APK.

## ADR-002 — Runtime procedural sprite engine instead of PNG asset packs

- **Date:** 2026-06-10
- **Status:** Accepted (supersedes the "CC0 packs + AI sprites" baseline of §B3 for now)
- **Context:** The user reviewed early direction against real EarthBound
  screenshots and asked for (1) authentic 16-bit look, (2) **larger characters**,
  and (3) a **sprite design engine** capable of building characters true to the
  EarthBound feel. Mixed third-party packs fight the palette rule and don't give
  us EB proportions.
- **Decision:** Build `src/spritegen/` — a deterministic pixel-art engine that
  generates every texture **at boot** from code: the 64-color master palette
  (§B3) lives in `src/palette.ts` as the single source of truth; characters are
  parameterized specs (skin/hair/outfit/hat) rendered as 16×24 sheets,
  4 directions × 4 walk frames, EB proportions (large head, short legs);
  enemies get bespoke battle sprites (~48px) plus overworld minis; tiles are
  16×16 generated to tile seamlessly. A "Sprite Lab" scene exposes the engine
  interactively. Palette conformance is enforced by construction — the engine
  can only emit palette indices, which makes `art:check` structural rather than
  a lint step.
- **Consequences:** Zero binary assets in the repo; every sprite is reviewable
  in a diff; later AI/CC0 art can still be layered in via §B3 if desired, but
  must match `src/palette.ts`.

## ADR-003 — Logical resolution 400×225 (16:9), 16×16 tiles, 16×24 characters

- **Date:** 2026-06-10
- **Status:** Accepted
- **Context:** EarthBound is 256×224 (8:7); a character is ~11% of screen
  height, which is why its sprites read "large." A naive 960×540 logical canvas
  (Prompt 1's first guess) makes 16×24 characters look tiny.
- **Decision:** Logical canvas **400×225**, scaled with FIT + pixelArt
  (nearest-neighbor). 25×14 tiles visible ≈ EB's 16×14. A 16×24 hero is ~11% of
  screen height — matching EB's on-screen character scale. Bible §B1 "960×540
  logical" is hereby amended (drift log per Appendix rule 6).
- **Consequences:** Chunky, readable pixels on a phone; integer-ish scaling at
  1200×675 / 1600×900 / 2400×1350.

## ADR-004 — Maps authored as code-grids until the Tiled pipeline lands

- **Date:** 2026-06-10
- **Status:** Accepted (interim; Tiled .tmj pipeline remains the Phase-1 target
  per §B1 — revisit at Prompt 4)
- **Context:** This session delivers the engine + a playable Chapter 1 opening
  slice with zero binary assets.
- **Decision:** Maps live in `src/data/maps.ts` as ASCII grids + typed object
  lists (doors, NPCs, signs, phones, spawners, resonance sites). The runtime
  consumes a `MapDef` interface that the future Tiled loader will also emit, so
  swapping authoring tools won't touch scenes.
- **Consequences:** Maps diff like text; Tiled adoption is an adapter, not a rewrite.

## ADR-005 — Typed TS data modules now; Zod schema validation at Prompt 8

- **Date:** 2026-06-10
- **Status:** Superseded by ADR-017 (S5 — schemas are now the single type
  source and `npm run validate` is the content gate)
- **Context:** §B1 mandates Zod-validated JSON content. The slice ships canon
  Chapter 1 content only.
- **Decision:** Content lives in `src/data/*.ts` under strict interfaces —
  compile-time validated, zero mock strings. `tools/content-validate.ts` checks
  canon counts for the slice (6 Ch.1 enemies, 4 heroes, Pray table weights sum
  to 100). Zod schemas arrive with the full data layer in Phase 2.
- **Consequences:** No drift in shipped content; Phase 2 converts interfaces to
  schemas 1:1.

## ADR-006 — WebAudio synth for SFX + music (no audio files yet)

- **Date:** 2026-06-10
- **Status:** Accepted (interim; Tone.js offline-render pipeline stays the
  Phase-8 plan per §B3)
- **Context:** Silence kills the EB feel; OGG pipeline is a Phase-8 deliverable.
- **Decision:** `src/engine/audio.ts` — a tiny WebAudio synth: SFX presets
  (menu, text tick, swirl, smash, odometer tick, phone, prayer chimes) and a
  pattern sequencer playing the Otterbrook shuffle, Hickory Hill night theme,
  battle swing, and jingles. Unlocked on first input gesture.
- **Consequences:** Full audio feel at 0 KB of assets; Phase 8 swaps the
  sequencer's voice layer for rendered stems behind the same API.

## ADR-007 — Chapter 1 slice scope (story scaffolding, not canon change)

- **Date:** 2026-06-10
- **Status:** Accepted
- **Context:** One session cannot build all of Chapter 1 (Brickton + Department
  of Smiles are their own dungeon). The slice must still be canon-faithful.
- **Decision:** The slice covers Ch.1's opening act exactly per §A2/§A6: 2AM
  wake-up → Otterbrook (NPCs, signs, shop exterior, chapel, Ana & Vivi cameo) →
  Hickory Hill trail (roaming §A7 Ch.1 enemies) → crater: Glint's prophecy →
  **THE TITANIC TICK** guards the Resonance Site (its canon boss slot) with
  Chad Pickle as a guest party member and Glint assisting from above →
  first Ember + Heartlight → walk home → Glint's bug-zapper death beat →
  Mom + phone save → "TO BE CONTINUED: BRICKTON CITY" card. Faye/Milo/Dorin are
  fully defined in data and visible in Sprite Lab but join per their canon
  chapters — they are NOT shoehorned into the slice.
- **Consequences:** Nothing written here contradicts §A6; Prompt 27 extends
  this map set rather than replacing it.

## ADR-008 — Dev QA driver: deterministic frame-pumping speedrun bot

- **Date:** 2026-06-10
- **Status:** Accepted (dev-only; stripped from prod by `import.meta.env.DEV`)
- **Context:** Headless/hidden pages never fire rAF, so the game can't be
  played or screenshotted by automation; Prompt 42 requires a speedrun-bot.
- **Decision:** `main.ts` installs `window.pump/key/holdKey/shot` in dev:
  synthetic `game.step(time, delta)` calls with virtual time, key-event
  injection, and `renderer.snapshot` POSTed to `tools/shot-server.mjs`.
  Notes for future bot work: Phaser tweens advance on real time (the driver
  compensates via `tweens.timeScale` while pumping), and promise-chained
  cutscenes require microtask drains between frames (the driver awaits between
  steps).
- **Consequences:** Whole-game scripted playthroughs run in seconds; the
  Prompt 42 speedrun bot builds on this.

## ADR-009 — Character sprites v2: 24×32 frames, detailed EB shading

- **Date:** 2026-06-10
- **Status:** Accepted (supersedes the 16×24 spec in ADR-002/003 after user
  review: "much more detailed character sprites")
- **Context:** 16×24 left too few pixels for faces and garments.
- **Decision:** Characters are 24×32 (1.5×2 tiles — slightly larger on screen
  than EB's, deliberately). Art rules baked into the generator: light source
  top-left everywhere; rounded 2-step skull chamfer; close-set 2×3 eyes with a
  catchlight; ears, jaw shadow, fringe rows; 3-tone garments (lit rim, base,
  core shadow + hem); counter-swinging arms; lifted-leg + scissor walk poses;
  outfit details (lapels+tie+buttons, gi collar+sash knot, apron straps,
  dress pleats+flare, cap brim underside). Tile size stays 16 px.
- **Consequences:** All cast members and the Remix lab inherit the detail
  free; follower trail spacing widened (9 crumbs); Prompt 38's ART_SPEC must
  document 24×32 as the character sheet size.

## ADR-010 — Text feel: B advances, skippable battle lines, @ renders as •

- **Date:** 2026-06-10
- **Status:** Accepted (user playtest feedback)
- **Decision:** A *or* B advances dialogue pages and fast-forwards; battle
  text linger is skippable by holding either; the Bible's @-speech convention
  stays in the data files but renders as a • speech bullet (the literal @ read
  as a username next to names like "@REX!").

## ADR-011 — Brickton systems: sight-line patrols, walker enemies, bus map, elevator doors

- **Date:** 2026-06-10
- **Status:** Accepted (Prompt S1)
- **Context:** The second half of Ch.1's geography (§A6) needs a city block,
  a 3-floor office dungeon with stealth-lite guards, and the bus transition.
  The slice engine only had wandering mini-sprite roamers and mat/stairs door
  indicators.
- **Decision:**
  - **`PatrolDef`** (maps data): waypoint loops (2 points ping-pong), a
    facing-cone sight check (default 5 tiles, ±14 px lateral) occluded by
    solid tiles — cubicle walls hide you. Spotted → "!" alert beat → chase at
    92 px/s (between walk 70 and run 115). **Caught = battle, not fail**:
    chase contact gives the enemy the green-swirl advantage; touching an
    unalerted patrol's back gives the player the red swirl. Defeated patrols
    stay down until map re-entry. Prompt 29's prefect drones reuse this.
  - **`EnemyDef.walker`**: humanoid enemies roam as full 24×32 character
    sheets with 4-dir walk anims (Blazer Smiler) instead of 16 px minis.
  - Door indicator union gains **`elevator`** (doors drawn on the wall above
    the zone); the Department's floors connect by elevator and stairs.
  - **The bus is a map, not a scene**: `bus_interior` runs its cutscene on
    map entry keyed by a registry `busDest`; scenery sprites scroll behind a
    transparent-pane window overlay, clipped to the window band by a geometry
    mask (interiors float in void, ADR-004 — no naked sprites outside the
    bus). First ride to Brickton plays the full scene; later rides quick-fade.
  - **`CHAR_LEGEND` moved into maps.ts** beside the grid format it describes;
    `maps.test.ts` cross-checks legend/tileset, door targets, dialogue ids,
    and enemy ids — the seed of Prompt S5's content validator.
  - **Prop-door zones extend below their building's collision floor** so
    doorsteps are reachable (this also fixed rex_home re-entry, which the
    slice shipped broken — the zone ended above the walkable band).
- **Consequences:** Otterbrook → bus → Brickton → Department floors 1–3 →
  locked holding room is walkable end-to-end. S2 adds only story: Faye, the
  manager fight, and the PRODUCTIVITY LOCK counting floor-3 patrol defeats
  (patrol ids are stable for flag wiring). The Smiler's §A7 "productive"
  debuff is now real in battle (offense ×0.75 for 3 rounds).

## ADR-012 — City layout convention: seeded organic downtowns

- **Date:** 2026-06-10
- **Status:** Accepted (user feedback on S1's first Brickton)
- **Context:** The first Brickton put every storefront on one straight
  street — it read as a stage set. The user wants cities "more sporadic and
  a bit more true to life... a good bit of randomness."
- **Decision:** Every city map (Brickton now; Chandrapore, Zanzibel, Lotus
  Harbor, etc. later) is laid out by its builder with a **fixed-seed RNG**
  (`seededRng` in maps.ts — Brickton's seed is 1995):
  - **street grid, not a strip**: ≥2 parallel streets joined by cross
    avenues, crosswalks at junctions, centerline dashes phase-shifted per
    street and broken at junctions;
  - **building clusters on multiple block faces** (our facades face south,
    so each street's north side carries them), with jittered positions,
    touching-rowhouse runs, alleys (dumpsters), and walkable gaps that cut
    between streets;
  - **varied skyline**: 1–3 story facades (`upperRows`), per-building
    `litSeed` so window lighting never repeats;
  - **negative space**: parking lots, irregular parks (nibbled corners),
    vacant lots, broken hedge runs, furniture scattered from candidate
    slots by rng — never evenly spaced;
  - **determinism is non-negotiable**: the seed is fixed so layouts are
    identical every boot (saves store positions; tests assert structure).
    Cross-map coordinates that depend on jittered placement are **computed,
    not hardcoded** — e.g. `dos_f1`'s street exit derives its doorstep from
    wherever the Department's door actually landed, and the bus spawn is the
    exported `BRICKTON_BUS_SPAWN`.
- **Consequences:** maps.test.ts asserts the two-street + connector
  structure so a future edit can't flatten the city back into a strip;
  chapter-map prompts (28–34) inherit this convention for their towns.
- **Enforcement (added same day, user: "ensure all cities going forward
  follow the brickton rules"):** `MapDef.settlement: 'city' | 'town' |
  'village'` tags every settlement; maps.test.ts sweeps **every** map tagged
  `'city'` (streets ≥2 + separation, connecting avenue, buildings on 2+
  block faces). Chandrapore, Zanzibel, Lotus Harbor, etc. must carry the tag
  and pass, or tests fail naming the offender. Towns/villages inherit the
  looseness but not the grid minimums. GAME_BIBLE §B4 amended with this rule
  per Appendix rule 6 — it is now a phase-level non-negotiable.

## ADR-013 — New Game sequence: one-grid name entry, variable flow, tolerant v1 saves

- **Date:** 2026-06-10
- **Status:** Accepted (Prompt 21 / S12)
- **Context:** Prompt 21 requires EB-style New Game setup; the finale's
  confirm box (§A6 Ch.8) reads the player's name off the save; the ADR-008
  QA driver must be able to script straight through it.
- **Decision:**
  - **`NameEntryScene`** sits between Title's New Game and the 2AM intro;
    Continue is untouched (S6 owns the slot scene later). Seven screens —
    rex/faye/milo/dorin (prefilled, portraits), player (deliberately empty),
    favorite food, coolest thing — share ONE 5×13 letter grid plus a
    SPACE/BACK/DON'T CARE/OK bar. A picks, B erases (B on an empty field
    steps back a screen), **START jumps straight to OK**, touch taps cells
    directly, rows wrap vertically. OK refuses an empty value. An EB recap
    window asks Yep!/Hold on— before committing; the title theme runs under
    the whole scene.
  - **Data-driven** in `src/data/newgame.ts`: prompts, prefills, caps
    (names 8, food/thing 14), canon-flavored don't-care lists; tests assert
    every list value is typeable on the grid and fits its cap.
  - **State:** `GameStateData` gains `heroNames` (all four, joined or not)
    and `coolestThing`. `makeHeroState` takes a name override — **S2's Faye
    join must pass `GS.data.heroNames.faye`**. `GS.heroName(id)` is the
    display lookup. `vars()` moved to Phaser-free `src/ui/text.ts`
    (re-exported from windows.ts) and now resolves
    {faye} {milo} {dorin} {coolthing} alongside the Prompt 6 trio.
  - **Saves stay `version: 1`:** `deserialize` spread-merges missing fields
    from `newGameData()` defaults, so pre-S12 saves load with canon names.
    The real migration registry still arrives with save slots (Prompt 22/S3).
  - **Dialogue pass:** literal hero-name mentions became {rex} (Pemmel, Mom,
    intro_wake, Chad's join shout — was "REX!", now renders as typed — and
    both item-get lines); `npc_mom`'s dinner line consumes {favoritefood};
    map banners render `vars(name).toUpperCase()` so `{rex}'S HOUSE/ROOM`
    follow the rename (S6 slot summaries must do the same).
  - **QA recipe** (documented in the scene header): from a fresh profile —
    KeyZ, KeyZ (title menu → New Game), Enter ×4 (hero prefills), KeyZ +
    Enter (player name), Enter ×2 (food, thing), KeyZ (Yep!) → 2AM intro.
    Bots avoid DON'T CARE (it randomizes). Verified end-to-end with
    key()/pump() only.
- **Consequences:** every future bot script threads name entry (8 presses);
  {playername} is on the save for the finale; renaming Rex flows through
  battle strips, banners, and all dialogue with zero per-site code.

## ADR-014 — S2: the PRODUCTIVITY LOCK, real party followers, and Chapter 1's button

- **Date:** 2026-06-10
- **Status:** Accepted (Prompt S2)
- **Context:** §A6 ends Chapter 1 with Faye rescued from the Department's
  holding room. S1 left the room a sealed 'O' block behind the `holding_door`
  prop with three stable floor-3 patrol ids (ADR-011); S12 fixed the rule that
  her join must carry the Prompt-21 name (ADR-013).
- **Decision:**
  - **Quota flags:** `PatrolDef.countFlag` — a patrolBattle victory sets it
    (`dos_quota_f3a/b/c`), and a counted patrol never respawns (its quota was
    met; the floor empties as you clear it). The third flag sets
    `holding_open`. Prompt 29's prefects can reuse `countFlag` as-is.
  - **The door is a scene-interpreted prop:** map data always lists
    `holding_door`; OverworldScene renders it by state — pip-lit variants
    (`holding_door_1/2/3`) from the flag count, and once open, the door is
    gone and only the `quota_panel` stays beside the carved gap.
    `carveHoldingRoom()` (maps.ts) un-walls the grid at scene build; the
    shared MapDef is never mutated (ADR-012 determinism holds).
  - **Flag-gated map data:** `NpcDef.ifFlag/unlessFlag` and `PropDef.ifFlag`
    (Faye + her cot exist only while the room is open and she hasn't joined).
    Story beats that change the floor (door opening, joins) commit flags and
    fade-restart the scene so everything rebuilds from data — no live
    mutation of shared MapDefs.
  - **Party conga & angels:** followers now come from `party[1..]` + guest
    (the slice handled only Chad). Down heroes ride the breadcrumb trail as
    floating `angel` sprites (§A4.7/Prompt 5) and rebuild after every battle.
  - **Faye joins via `makeHeroState('faye', 6, GS.data.heroNames.faye)`**
    (ADR-013) inside the holding room; level 6, canon kit from data.
  - **Pray is a top-level battle command** for any hero who has it (Prompt
    12's per-hero command row), removed from the Vibe submenu. The Manager
    fight passes `prayTutorial` for the one-time §A11.4 hint. Pray's table
    reaches only standing heroes — revival stays with hospitals and rare
    items.
  - **The Manager fight is 2× blazer_smiler:** §A7's Ch.1 roster is canon-
    complete, so the Manager is a CAST member who *summons* Smilers, not a
    new enemy. `startBattle` opts decouple boss music/no-run from Glint's
    assist (Glint is gone by Brickton).
  - **Interim revival until S6/S11:** a full wipe still revives everyone at
    rex_home (hospitals don't exist yet — S6 retargets the respawn, S11 owns
    §A4.7 economics); Glint's Spark consumes to revive a downed hero in or
    out of battle (§A8 "revive, rare").
  - **`ch1_complete` is set by Mom's call to the Brickton payphone** (first
    phone tutorialized by Mom calling YOU, {favoritefood} consumed). The
    Bible's Prompt 27 EXIT line is amended per Appendix rule 6: the docks bus
    that opens Chapter 2 *requires* the flag rather than setting it.
- **Consequences:** S3's menu reads a real multi-hero party; quota door state
  survives re-entry and reload through plain flags; the same join pattern
  (flag + makeHeroState + fade-restart) serves Milo (Ch.3) and Dorin (Ch.7).

## ADR-015 — S3: per-hero bags + equip, save v2 migration registry, the EB command menu

- **Date:** 2026-06-10
- **Status:** Accepted (Prompt S3 — Bible Prompt 7 + 19)
- **Context:** The interim pause menu hardcoded Rex while the party is two
  heroes (ADR-014); `BattleScene.heroOffense` applied the FIRST weapon in the
  shared `GS.data.inventory` to BOTH heroes; ADR-013 left save tolerance as a
  deserialize spread-merge with "the real migration registry" deferred.
- **Decision:**
  - **Per-hero bags (Prompt 19):** `HeroState.bag` (14 slots, `BAG_MAX` in
    items.ts) + `HeroState.equip` (weapon/body/arms/other, `EQUIP_SLOTS`).
    The shared `inventory` field is GONE; `keyItems` stays shared. Equipped
    items occupy a bag slot EB-style; removing the last copy clears the slot.
    Equip-from-anyone's-bag moves the item into the equipper's bag first.
    Weapons carry a **`wielder` tag** (§A8: bats `rex`, pans `faye`) enforced
    by `GS.equipItem`; `slotOf(item)` maps kinds to slots (armor in Phase 2+).
    `heroOffense(hero)`/`equipDelta(hero, item)` are pure functions in
    battle/formulas.ts — battle damage now reads the ACTING hero's weapon.
  - **Save v2 + migration registry:** `engine/migrations.ts` holds ordered
    steps `{to, migrate}`; `deserialize` walks `parsed.version → CURRENT (2)`
    and throws loudly on unknown/future versions. The v1→v2 step FOLDS IN
    ADR-013's spread-merge backfill (pre-S12 saves missing heroNames et al.
    still load), moves the shared inventory into the leader's bag, equips his
    first wieldable weapon (so old saves keep their exact battle damage), and
    grants+equips Faye's **Hand-Me-Down Pan** when `faye_joined` — she
    canonically took it back off the intake shelf, and the join scene now
    grants it for new saves (`faye_pan_get` line). S6 (slots), S9 (caller
    ledger), and S10 (arcade score) REGISTER steps here, never ad-hoc merge.
  - **MenuScene:** the EB command menu is its own scene launched over a
    paused OverworldScene (the battle pattern), emitting `mf-menu-closed`;
    the overworld rebuilds followers on close (Spark revives un-angel there).
    Pages: ITEMS / STATUS (full §A3 sheet incl. Guts/Vibe/Luck + DOWN, reads
    `HeroState.name` so renames are free) / VIBE (PP costs, greyed when
    unusable; Pray stays a battle command per ADR-014) / EQUIP (Prompt 19
    "Offense up by N!" preview before confirm) / LOCKET / SETUP (the S1
    persisted Sound preference; UIScene's global M key untouched). One list
    widget (`pick`) drives every page with pad/keys AND per-row tap zones;
    static pages tap-dismiss (§B4). Glint's Spark's out-of-battle revive
    moved here intact.
  - **Homesong stems (§A4.9):** `TRACKS.homesong` has 8 stackable channels;
    `AUDIO.playMusic(name, stems)` caps scheduled channels. The Locket screen
    passes the Ember count — one Heartlight = one instrument, alone (channel
    0 is the heartlight lead, so the cue carries over). The `heartlight`
    one-shot still plays at Ember pickups. Phase 8 swaps voices, not the API.
  - Setup ships audio-only for now (Prompt 7 lists controls/window flavor —
    those arrive with their systems); chests/gift boxes remain Prompt 19
    scope for S4+.
- **Consequences:** S4's shops route purchases into a chosen hero's bag and
  reuse `confirmEquip` for the equip-after-buy prompt; battle Goods/steals
  operate on the acting/target hero's own bag; Prompt 29+ towns inherit the
  menu for free. Tests: 81 (migration registry, wielder rules, cross-bag
  equip, offense isolation).

## ADR-016 — S4: shops, the ATM, phone contacts & Homesick (Bible Prompt 20)

- **Date:** 2026-06-10
- **Status:** Accepted (Prompt S4)
- **Context:** Prompt 20 wants the cash loop closed: buy/sell UI, ATM
  withdraw/deposit against Dad's deposits, Mom curing Homesick over the
  phone. ADR-015 left per-hero bags + `confirmEquip` ready; ADR-012 requires
  jitter-derived cross-map coords; Otterbrook's drugstore and Brickton's
  STARMART were locked facades.
- **Decision:**
  - **Shared list widget:** MenuScene's `pick()` and `confirmEquip()` moved
    verbatim to `src/ui/pick.ts` (MenuScene keeps thin delegating wrappers).
    The shop's equip-after-buy prompt IS the menu's "Offense up by N!"
    preview/confirm — one code path, the flows cannot drift apart.
  - **`ShopScene`** (`SHOPS` data in `src/data/shops.ts`): launched over a
    paused world like MenuScene, emits `mf-shop-closed`. BUY greys
    unaffordable rows, routes the purchase into a **chosen** hero's bag via
    `GS.addItem(itemId, heroId)` with "hands are full" handling, then offers
    the shared confirmEquip aimed at the wielder-tagged hero. SELL lists a
    chosen hero's bag at `sellPrice()` = `floor(price/2)`; price-0 items
    (Glint's Spark) are greyed — not merchandise. `GS.removeItem` already
    clears a dangling equip ref when the last copy goes.
  - **Keepers ARE their shops:** `NpcDef.shop` opens ShopScene on talk; the
    §A11 obsession lives in the greet/farewell dialogue (expiration dates at
    OTTERBROOK DRUG; STARMART's keeper counts the carts back in at dusk).
    Interiors are ADR-004 grid maps; facade door zones extend below the
    collision floor (ADR-011) and BOTH interiors' street exits derive their
    doorsteps from the (jittered) facade props via `doorstepOf()` — the
    dos_f1 pattern, now shared and asserted by tests. No new `rng()` calls
    were added to `buildBrickton` before existing ones, so the 1995 layout
    is byte-identical.
  - **`ItemDef.ppHeal` + Star Cola** (`kind: 'pp'`, 12 PP, $9): the first
    PP-restore item, usable from the menu Items page ("Who drinks?") and
    battle Goods (PP rolls back up the drum). §A8's "Star Cola line" extends
    by adding items, not fields.
  - **The ATM** is a kiosk prop + `MapDef.atms` interaction point placed off
    the jittered bank facade (`bank.x + 4`, never hardcoded). Flow:
    balance page → Withdraw/Deposit/Done → $10/$50/$100/All presets.
    `GS.withdraw/deposit` clamp, floor, and conserve — unit-tested
    round-trips. The SAVINGS & LOAN itself stays locked (`locked_bank`).
  - **Phones list contacts** (Prompt 20): Call Dad (save + pendingDeposit +
    first-time $50 gift, flow unchanged) / Call Mom / Hang up. Pemberton and
    Pizza-to-Go gate behind later flags. Calling Mom from rex_home gets you
    sent to the kitchen in person.
  - **Homesick is a FLAG (`rex_homesick`)** — §A4.4 persistence on the save
    for free, no v3 migration (the registry rule stands for real fields).
    Contraction rolls once per battle **victory** (`contractHomesick`, 8%);
    a Homesick Rex skips turns at 50% (`homesickSkips`) "thinking about
    {favoritefood}". Both take injected rng — tested deterministically.
    Mom's call cures it on EITHER direction of the call (dial-out
    `phone_mom_cure`, or her S2 payphone call via `mom_cure_beat`), and the
    STATUS sheet shows a HOMESICK tag.
- **Consequences:** the §A9 cash loop is real (earn → Dad deposits →
  ATM → shelf → "Offense up by 4!"); Prompt 28+ towns add a `ShopDef` + a
  keeper NPC and inherit the whole flow; Mom's Voice Tape (§A8) can cure by
  clearing the same flag; the v2 save shape is untouched. Tests: 106.

## ADR-017 — S5: Zod schemas as the single type source + the content-validator gate

- **Date:** 2026-06-10
- **Status:** Accepted (Prompt S5 — Bible Prompt 8, adapted; supersedes ADR-005)
- **Context:** ADR-005 shipped typed TS data with runtime validation
  deferred; §B1 mandates Zod-validated content and §B4 bans placeholder
  strings; the cross-reference checks had meanwhile accreted into
  maps/shops/newgame/text vitest files (the seed ADR-011 planted).
- **Decision:**
  - **`src/schemas/index.ts`** holds Zod schemas mirroring every content
    interface (Hero, Ability + the PRAY table, Enemy w/ moves + deathLine,
    Item, Shop, the whole MapDef family incl. door indicators, atms,
    `PatrolDef.countFlag`, `NpcDef.ifFlag/unlessFlag/shop`, `PropDef.ifFlag`,
    DialogueScript, and Quest — landed ahead of S9: objectives, doneFlag,
    the §A10 caller record). The data modules now `z.infer` their types via
    `import type`, so compile shape ≡ runtime schema and **zod never enters
    the game bundle** (verified absent from dist). `engine/state.ts`'s
    `Stats` re-exports from schemas too. Strict objects reject unknown keys;
    refinements encode invariants: the S4 `kind 'pp' ⇔ ppHeal` pairing
    (ADR-016), §A8 weapons must carry `wielder` + `offense`, §A7's 2–4 moves
    and one deathLine per enemy. The data stays **TS modules, not JSON**
    (ADR-004 carries; §B1's "JSON" row amended per Appendix rule 6) — the
    future Tiled loader parses its .tmj through `MapDefSchema` unchanged.
  - **`tools/content-validate.ts`** (`npm run validate` — first leg of
    `npm test` and of `build`, via vite-node): per-entry schema parse with
    key↔id agreement, then canon cross-checks built so far — the §A3 four
    (+ Faye's L1 pray, Milo's no-Vibe), the PRAY table pinned at
    10/20/30/25/10/5 summing 100, the §A7 Ch.1 roster + Boss 1 with **HP
    pins in both directions** (a missing canon enemy AND an un-manifested
    extra both fail), three distinct dos_f3 quota countFlags on the stable
    f3a/b/c ids, the two §A8 Ch.1 shops with exact stock manifests,
    star_cola the lone 'pp' item — then the folded cross-refs: grid chars →
    legend → `tileIndexByName`, doors (zones + prop doors) → existing maps
    **and inside their pixel bounds**, npc/sign dialogue ids, `npc.shop` →
    SHOPS, spawner/patrol enemies, stock ids priced > 0, greet/farewell,
    keeper placed exactly once opening its own shop.
  - **The {token} sweep is registry-driven:** `vars()` now iterates an
    exported **`TEXT_VARS`** table (src/ui/text.ts) instead of hardcoded
    replaceAlls, and the validator sweeps every dialogue page, map name,
    and item string against exactly those keys — a typo like {favortefood}
    fails the build by construction, and adding a variable to the table is
    automatically accepted everywhere. Battle-rendered strings (BATTLE_TEXT,
    ability/move text, PRAY_TEXT, death lines) additionally allow
    **`BATTLE_FILL_TOKENS`** {user}/{e}/{t}, exported beside BATTLE_TEXT as
    BattleScene.fill()'s documented contract. New Game prefill/don't-care
    values must be typeable on the letter grid and fit their caps; a §B4
    placeholder sweep (`\b(todo|placeholder|lorem)\b`) covers every content
    string except tile grids.
  - **Canon manifests live IN the validator.** Adding content means
    extending the §A7/§A8 manifest in the same commit — the Appendix-6
    drift-log rule applied to data. Error output names every break:
    `[canon] §A7/§A6 enemy 'hill_slug_deluxe' missing from the roster`.
  - **Vitest keeps behavior only** (92 tests): odometer, pray distribution,
    carveHoldingRoom, ATM round-trips, Homesick rng, the ADR-012 city sweep,
    the S4 doorstep-derivation block, GS buy/sell routing, vars() rendering,
    save migrations.
- **Consequences:** deleting any enemy, misspelling a dialogue token,
  unlinking a door, or stocking a phantom item fails `npm run validate`
  naming exactly what broke (all four verified). S6/S9/S10 keep registering
  save fields per ADR-015 and must EXTEND the validator's manifests when
  they add content; S9 wires its QUESTS data into the validator's parse
  list (the schema is already waiting). Chapter-2+ sessions inherit the
  whole gate: author data, extend manifests, `npm test` proves the world
  still holds together.

## ADR-018 — S6: the slot family — 3 notebooks + Dad's rolling carbon copy

- **Date:** 2026-06-10
- **Status:** Accepted (Prompt S6 — Bible Prompt 22, adapted; localStorage
  stays interim per the ADR-004/006 pattern — §B1's IndexedDB row remains
  the target and lands later as a driver, not a rewrite)
- **Context:** §A4.3 mandates 3 save slots; Prompt 22 adds the rolling
  auto-backup, corruption recovery, and a SaveSlots scene on Title. The
  single `SLOT_KEY` in engine/state.ts, Title's direct `GS.load()`, the
  never-ticking `playtimeSec`, and handleDefeat's hardcoded rex_home all
  predate slots (ADR-014 explicitly deferred the respawn retarget to S6).
- **Decision:**
  - **`engine/saves.ts`:** a three-call **`SaveStorage`** interface
    (get/set/remove) with the guarded localStorage driver as today's
    implementation — the IndexedDB swap implements the interface, nothing
    else moves. **`SaveBank`** owns the family: keys
    `meteor-falls-slot-1/2/3` (slot 1 === the old SLOT_KEY, so every
    existing playthrough simply *becomes* Notebook 1 — no key migration)
    plus ONE `meteor-falls-backup`. `write()` rolls the slot's previous
    payload into the backup **before every overwrite** (§B1; a first write
    to an empty slot touches nothing); the backup is an envelope
    `{slot, json}` so recovery can never resurrect one playthrough into
    another's notebook. `open()` parses + walks the ADR-015 registry; bad
    JSON and migrateSave's loud unknown-version throw BOTH fall back to a
    same-slot backup, and a successful recovery heals the slot in place
    (the backup stays). `peek()` derives the slot-list row **from the blob**
    — name, level, location (the MapDef display name, {tokens} intact),
    playtime, embers are never stored twice, and NO new save field was
    needed: the registry stays at v2 with zero S6 steps.
  - **GS:** `activeSlot` is runtime-only state (the slot a save lives in IS
    its storage key). `saveTo/continueFrom/slotPeeks/anySave/respawnPoint`
    replace `save/load/hasSave`; `bank` is a public seam tests swap for a
    Map-backed driver. `reset()` clears `activeSlot`, so a New Game gets
    Dad's ask again.
  - **Dad's flow (contact list untouched, ADR-016):** callDad asks
    "Which notebook?" via `dad_slot_ask` ONLY while `activeSlot` is null —
    a 3-row, no-cancel menu whose rows summarize each slot (`Notebook 2:
    Casey L7` / `new page` / `smudged`); every later save reuses the slot
    silently. New lines (`dad_slot_ask`, `dad_backup_apology`,
    `dad_backup_lost` — coffee on the notebook, carbon copy underneath,
    §A11.2 sincerity for the truly-lost case) are DIALOGUE entries the S5
    validator sweeps.
  - **`SaveSlotsScene`** replaces Title's direct `GS.load()`: three
    panels derived via `slotPeeks()`, locations rendered
    `vars(location, slotBlob).toUpperCase()` — **`vars()` gained an
    optional data param** (TEXT_VARS getters now take the blob; default is
    the live GS.data) so `{rex}'S HOUSE` follows each slot's OWN rename
    (ADR-013). Picking a smudged slot runs recovery + Dad's apology, then
    continues; `lost` keeps you on the list. Bot recipe in the scene header
    (KeyZ KeyZ from title → arrows → KeyZ; KeyX backs out).
  - **Playtime ticks** in main.ts's PRE_STEP (real delta, fractional
    seconds) whenever the overworld is active OR paused-under
    battle/menu/shop — title-side screens don't count. Rendered H:MM by
    `fmtPlaytime`, derived at display time.
  - **`Dialogue.justReleased()` (input-race fix the ask exposed):**
    `dlg.ask()`'s poll runs in the scene's PRE-update phase and sets
    `busy = false` synchronously, so the A that confirms a menu row was
    still `justPressed` in the SAME frame's overworld update — interact()
    re-fired and a second phone flow interleaved with callDad's (latent
    since the S4 contact list/ATM menus; reproduced live with the bot
    driver, page-by-page). Dialogue now stamps `releasedAt` on every
    say/ask teardown and the overworld skips interact/START on that frame.
  - **Defeat targeting:** handleDefeat keeps §A4.7 cash-halving (banked
    safe) and ADR-014's interim revive-all, but respawns via
    **`GS.respawnPoint()`** — the last Dad-save's map/x/y/facing read back
    from the active slot's blob (rex_home only as the never-saved
    fallback). S11's hospitals reuse the same function.
- **Consequences:** three parallel playthroughs coexist (tested);
  mid-string slot corruption continues from the backup with the apology
  (tested, both corruption shapes); a Department wipe respawns at the
  Brickton payphone when Dad last saved there (tested). Anything S9/S10
  add to slot summaries must keep deriving from the blob — or register a
  version step per ADR-015. Bots: every Call Dad mash now crosses the
  3-row ask once per playthrough (top row = Notebook 1).

## ADR-019 — S7: sprite engine v3 — the EarthBound look (palette, world, cast, battle)

- **Date:** 2026-06-10
- **Status:** Accepted (Prompt S7 — supersedes ADR-009's "characters are
  done" freeze; ADR-009's 24×32 frame, proportions, and art rules REMAIN
  the base the v3 pass builds on)
- **Context:** The render read as programmer art. The bar is Mother 2
  itself: visible roof planes, 90s-Americana streets, warm-shadow pastel
  daylight. ADR-002's palette-by-construction and ADR-012's fixed seeds are
  non-negotiable; S6 forbids growing solids over walkable ground.
- **Decision:**
  - **Palette revision (same 16 ramps × 4 shades = 64, §B3 holds):** every
    hex re-tuned for EB daylight — bright pastel mids, WARM shadows (each
    shade-0 leans plum/brown, never gray), cream whites (PAPER is warm
    parchment now), sun-yellowed GRASS, sandier EARTH. INK 0 (`#1a1024`,
    deep plum) is the universal 1px outline. No structural change, so
    `px(ramp, shade)` call sites and palette-by-construction are untouched.
  - **The fixed-canvas rule:** every prop pixmap that map data aims solids
    or door zones at keeps its EXACT dimensions and internal door/wall
    band positions (`drawHouse` roof=20px / sign=12px / wall rows,
    `drawCityBuilding` H = 44+16·upperRows, door rects to the pixel). The
    v3 detail all happens INSIDE those bands — that is what keeps ADR-012
    doorstep derivations, the maps.test S4 block, and old saves intact.
  - **Buildings read 3/4:** houses get hip (trapezoid plane, ridge cap,
    checker-dither gradient to the eaves) or front-gable (cream pediment +
    attic vent) roofs, sunlit eaves fascia + cast shadow on the siding,
    corner trim, in-roof chimneys, transom doors, window AC option, porch
    light by every door, striped scalloped awning option (drugstore,
    arcade). City buildings get coping + dentil parapets with rooftop
    AC/vent silhouettes, brick coursing on RED/ORANGE walls, lit windows
    with figures / AC units seeded per `litSeed`, goods + glass shine in
    display windows, kickplates, and a bracket-hung blade sign by the door.
  - **Ground + streets:** worn rounded corners on the auto-edged path
    (stepped grass bites), flower CLUSTERS, lit-crown checker trees in
    three variants + a pine — all on the same 26×34 canvas/trunk line so
    the one canon solid rect serves every variant (`treeSprite(x,y)` hashes
    position; data positions unchanged). New tiles: sidewalk cracks, curb
    highlights (scene picks curb variants where road adjoins sidewalk),
    road patches, storm drains. New props: telephone poles whose sagging
    spans CHAIN at 8-tile spacing, galvanized trash cans, parking meters,
    newspaper boxes.
  - **Solids discipline (S6):** poles are VISUAL-ONLY (no solid — a pole
    base can never trap a reloaded save); meters/boxes/cans carry small
    solids only at positions ≥2 tiles from every phone/door/doorstep/
    trigger/picnic table, enforced in code (door-column + occupancy checks
    in buildBrickton). All Brickton additions consume a SEPARATE
    `seededRng(2077)` stream opened after the 1995 stream's last call —
    the original jittered layout is byte-identical (ADR-016's rule).
  - **Interiors:** plank floor rebuilt as LONG boards (soft seams, rare
    end joints — the v2 stagger read as brick courses; caught on
    screenshot review), wallpaper + picture rail + baseboard walls,
    quilted rug and bed (lattice + gold knots), and a real furniture set —
    dresser, console TV, stove, bookshelf, floor lamp with a baked light
    pool — mounted into wall bands so no walkable tile gains collision
    (one exception: the lamp's 6×3px solid, placed clear of the
    phone-save spot). Department: carpet-tile floor (kept quiet — the
    first dither pass read as wallpaper), dropped-ceiling band with
    fluorescent `office_wall_light` variants (scene swaps every 4th wall
    column), pinned-memo cubicles, monitor+mug desks, §A11 posters
    (smiley sunrise, the chart that only goes up) and the lobby's
    `A PRODUCTIVE DAY!` banner. Shops: richer seeded shelf goods
    (cans/boxes/bottles + price tags) and the Star Cola fridge case in
    both interiors.
  - **Cast v3 (24×32 stays):** anti-aliased skull chamfers, 5th-tone core
    shadows (shade-0 at chin/hem), socketed catchlight eyes, and DISTINCT
    silhouettes — `CharacterSpec` gains `held: 'pan'` (Faye carries her
    §A3 pan), `satchel` (Milo), `beads` (Dorin). Minis redrawn bolder with
    full outlines (crowned slug, do-rag pigeon, grinning mower).
  - **Battle sprites rebuilt at EB scale (64–96px):** front-facing
    portraits with ground shadows — yelling dome-top mailbox w/ flying
    letters, grille-grinning mower, spring-coil cicada with veined glass
    wings, the Smiler with foreshortened handshake + quota mug, do-rag
    pigeon trio guarding one crumb, crowned glossy slug — and THE TITANIC
    TICK as a true boss: 96px engorged dithered dome, magenta vibe-glow
    veins, four red eyes, open mandibles, hooked graspers raised at the
    camera.
  - **Scene polish + juice (Prompt 39 trio):** porch-light glow pools at
    every doorstep under the 2AM night overlay; Ember pickups burst gold
    sparkles (`spark` sheet); running kicks heel dust (`dust` sheet);
    doors whoosh (new SFX preset) with a camera lean-in. Sprite Lab pages
    rehung: 8×3 cast grid, near-1:1 battle sprites, the full new world set.
- **Consequences:** zero data-shape changes (saves stay v2, no migration);
  validator + 107 vitest stay green untouched, including the ADR-012 city
  sweep and S4 doorstep block. Chapter-2+ towns inherit roofed buildings,
  street furniture, and the interior set as vocabulary — extending
  `HouseOpts`/`CityBuildingOpts` beats new one-off draw functions. The
  four S7 side-by-sides (Otterbrook day, Brickton street, rex_home,
  Smiler battle) live in `.shots/` for the art editor's judgement; ADR-008
  note: hidden-tab preview screenshots stall on rAF — use `window.shot`
  through tools/shot-server.mjs, which is exactly what it was built for.

## ADR-020 — S7b: the human pass — true 2.5D depth + the anti-generation rules

- **Date:** 2026-06-10
- **Status:** Accepted (S7 follow-up; user art direction: "2.5/3D sprites
  like EarthBound has" and "no AI smell — actively remove common AI tells")
- **Context:** ADR-019 hit the EB vocabulary but two gaps remained: the
  projection wasn't volumetric enough (thin roof bands, flat walls,
  stamped patterns), and several procedural habits read as generated art —
  uniform speckle on every surface, ellipse-stacked curves with orphan
  pixels, outlined shadow puddles, per-cell motifs tiling into grids.
- **Decision — 2.5D volume (canvas/door bands still FIXED per ADR-019):**
  - **Roof-dominant houses:** on sign-less buildings the roof plane now
    runs ~6px down INTO the wall band (Mother 2's proportion — the roof IS
    the building); windows ride lower to follow; door rect untouched. Hip
    seam diagonals, ridge cap, off-center gablet dormers (`roofStyle:
    'gable'`), in-plane chimneys with their own cast shadow, porch hoods
    over doors, seeded per-window curtains/blinds/flowerboxes
    (`HouseOpts.litSeed`).
  - **City blocks turn away:** right-edge side-return shading column, a
    dark roof-deck sliver behind the parapet coping, venetian blinds at
    owner-given-up heights in the window grid.
  - **Interiors:** wall tiles carry a 3px WALL-CAP band (the wall's top
    edge seen from above); furniture gets real top planes (TV, bookshelf);
    EB floats interiors in void — that stays.
  - **Bosses sit lower in battle** (y 97) so a 96px crown clears the
    persistent text window — the Tick's lit dome is its read.
- **Decision — the anti-generation rules (binding for ALL future art):**
  1. **Surfaces are FLAT.** Ground tiles carry no uniform noise; detail is
     deliberate, clustered (2px+ marks), and lives in dedicated sparse
     tiles (tufts, flowers, cracks, patches, drains). `scatter()` is
     banned from ground tiles and sprite bodies (legit uses: lit-window
     grids, ash).
  2. **Shadows are never outlined.** Ground shadows stamp AFTER
     `outline()` via the new `Pixmap.shadowUnder` (transparent-only,
     context-colored: FOREST on grass, PAPER-dark on pavement).
  3. **Big curves are hand-authored.** `Pixmap.contour(cx, top,
     halfWidths[])` takes a human-written run list (eased 6-4-3-2-1
     steps); raw `ellipse()` stacking is for small round things only.
     The Tick dome, head, and slug body are contour-built; the Tick's
     mottle is five deliberate plate arcs + paired freckles, not scatter.
  4. **Repetition must break.** Region patterns are edge-aware: rugs get a
     16-variant mask family (`rug_0..15`, scene-masked exactly like the
     path tiles) so any footprint reads as ONE bordered rug — per-cell
     motifs that tile into grids are forbidden. Seams break mid-run;
     focal details (chimneys, gablets, vents) sit off-center.
  5. **Battle sprites float.** No baked ground shadows on the psychedelic
     field — EB never does.
  6. **One dither seam per tone transition,** in 2px clusters. Full-surface
     checker gradients are out; the canonical EB checker stays ONLY where
     EB itself uses it (tree canopies, shrubs, hedges).
- **Consequences:** the rules are stated once here and inherited by every
  chapter's art sessions; reviewers can reject a diff by rule number.
  Tiles/props this touched: grass, sidewalk (+curbs/crack), road family,
  brick, path corners (per-variant bites), plank floor, wall cap, rug
  mask family, houses, city blocks, TV/bookshelf, tree/pine/sign/picnic/
  cans/meters/poles shadows, Tick/slug rebuilds. Saves untouched; tests
  green (107 + validator). Repo note: never roundtrip sources through
  PS5.1 `Get-Content`/`Set-Content` — it double-encodes UTF-8 (the
  tools/fix-encoding.mjs incident repeated on enemies.ts and was
  repaired); use the editor tools or node for file surgery.

## ADR-021 — S7c: companion sprites v3, the bespoke `detail` hook & per-hero mourning angels

- **Date:** 2026-06-10
- **Status:** Accepted (Prompt S7c — closes the ADR-019/020 art arc)
- **Context:** Biscuit, Glint, and the §A4.7 angel were still first-slice
  rectangles after the S7/S7b world+cast rebuild, and no cast member had
  one-off pixels beyond what the parametric system expresses. ADR-019's
  fixed-canvas rule and ADR-020's six anti-generation rules are binding;
  bot recipes depend on ADR-009 metrics, sheet order, and `standFrame()`.
- **Decision:**
  - **Companion rebuilds (frame sizes + sheet order BYTE-COMPATIBLE):**
    Biscuit is a tricolor beagle (16×16, hand-set row runs, white blaze,
    tapered saddle, collar + gold tag, flag tail that wags per frame, far
    legs one shade back) with `shadowUnder` stamped AFTER `outline()` per
    ADR-020 rule 2. Glint is a four-point star via one `Pixmap.contour`
    with a pinched waist (rule 3) and a FIREFLY HEART low in the belly:
    dark unlit ember (ORANGE 1) at rest, white-hot bloom + compass glow
    ticks on the pulse — the ticks are stamped after `outline()` because
    **light is never outlined either** (rule 2's mirror, now precedent:
    the angel halo works the same). The angel got closed lashes, clasped
    praying hands, a scalloped ghost hem, and wings that beat OPPOSITE
    the body bob; angels and Glint never get ground shadows — they float.
  - **`CharacterSpec.detail` hook:** an optional per-id one-off pass
    `(ctx: DetailCtx) => void` run in `drawFrame` AFTER the parametric
    layers and BEFORE `outline()`. Contract: 2–6 px, EB restraint, may
    never extend the silhouette's bounds (ADR-009 metrics are untouchable),
    and it never sees `'left'` — side frames are mirrored from `'right'`.
    Shipped details: Rex's cap-seam stitch (all facings), Faye's pan glint
    + dress pocket, Milo's blazer-pocket pen, Dorin's gi shoulder fold
    (mirrored on the back frame), Chad's untucked shirt tail (front/side/
    back — it reads best from behind), Mom's oven mitt (rides the arm
    swing), the Manager's gold tie pin (front only).
  - **Per-hero mourning angels (§A4.7, visual only):** `generateAngelFrames`
    takes an optional CAST spec and derives skin, hair, and ONE signature
    from it — Rex keeps the red cap on, Faye keeps the blond bob + bow,
    Milo keeps his glasses (cyan lens glints), Dorin keeps SKIN_DEEP, the
    knot, and its sash-gold tie. Boot registers `angel_rex/faye/milo/dorin`
    sheets + `-float` anims; `OverworldScene.addFollower` picks
    `angel_<id>` when the texture exists and falls back to plain `angel`
    (guests). NO data, flag, or save change — the registry stays at v2.
  - **Dog sheet contract formalized:** frames `[E, E-step, W, W-step]`;
    `dog-walk-left` anim registered; `buildNpcs` honors `facing: 'left'`
    for `dog` NPCs via frame 2 (Biscuit faces Mrs. Pemmel as authored).
  - **Sprite Lab:** new COMPANIONS page (dog both headings, Glint, all
    five angels — each at 3x AND 1x, the EB-made-at-both-scales check);
    the cast page now cycles down/left/right/up every 1.4s across all 24
    sprites — that loop is the standing walk-cycle audit surface.
- **Verification (the S7c sweep):** 4x sheet dumps of all seven detailed
  leads + four-direction Lab shots of all 24 found ZERO orphan pixels or
  outline gaps from the S7 props (pan/satchel/beads all stay attached in
  side+back frames). In-game via the ADR-008 driver: Biscuit in the
  Otterbrook park, Glint's prophecy at the crater, and a forced-wipe
  four-hero conga showing distinct per-hero angels. Shots in `.shots/`
  (`s7c_*`). Validator + 107 vitest green, zero data-shape changes.
- **Consequences:** chapter sessions add cast one-offs through `detail`
  hooks instead of forking draw functions; any future hero/guest gets a
  mourning variant by registering `angel_<id>` (the fallback keeps old
  content safe); "light after outline" joins "shadow after outline" as
  the rule-2 idiom reviewers can cite.

## ADR-022 — S7d: cast construction v4 — domed skulls, hair mass, weighted cloth, varied faces

- **Date:** 2026-06-11
- **Status:** Accepted (user art review of the Lab cast page: "the sprites
  look exactly the same" — and they were right)
- **Context:** S7 deliberately preserved the ADR-009 v2 head/torso
  CONSTRUCTION and added only 2–6px details (props, AA pixels, a 5th
  tone), so the cast still read as one squarish chamfered doll recolored
  24 times while the world transformed around it. S7c (ADR-021) was scoped
  to companions + one-off details and could not fix this either. The
  visible-impact layers themselves had to be rebuilt — under the standing
  contracts: 24×32 frames, ADR-009 metrics, sheet order, `standFrame()`,
  the S7c `detail` hooks, and ADR-020's rules.
- **Decision:**
  - **Hand-authored skull domes (rule-3 applied to people):** the
    chamfered-rectangle skull (`roundedBlock`/`aaCorners`) is gone from
    biped heads. `SKULL_FRONT` and `SKULL_SIDE` are per-build span tables
    (`[inset, width]` per row, eased 8→12→14 crown steps, 12→10 jaw
    taper); `SKULL_SIDE` is asymmetric — flat occiput, chin pulled
    forward — plus a brow ledge, nose bump, and upper-lip turn for a real
    profile. Face shading follows the dome rows (brow light, cheek
    catches, jaw-turn pixels, chin core shadow).
  - **Hair is drawn MASS, not a band:** every style rebuilt on the dome —
    `short` gets a shaped 3-on-2-off fringe with solid temples, sideburns,
    and a back whorl; `sidepart` gets a real swoop with underside shade, a
    part line, and a temple flick; `bob` curtains hug the dome contour and
    curl in at the jaw with shaded tips, full straight fringe + center
    notch; `gray` recedes to a shined crown with tidy temple patches
    (horseshoe from behind); `topknot` gets a 3-row bun with a tie wrap,
    riding back in profile. Caps crown the dome (band follows the curve,
    dome rises into the crown, hair peeks under the brim).
  - **Weighted garments:** shirts/dresses go from 1px edge columns to a
    lit edge + chest catch, a 2-column shaded side, dark hem with
    shade-0 core corners — front, back, and side. Reads at gameplay zoom.
  - **`eyes` + `mouth` styles (`EyeStyle`/`MouthStyle` on CharacterSpec):**
    `tall` (hero 2×3 + catchlight) / `dot` / `happy` (closed ∪) / `wide`
    (the Department-issue stare: tall whites, pin pupils, socket rim) /
    `glare` (heavy brow); mouths `hint`/`smile`/`open`/`frown`/`none`
    (`grin` still overrides). Assigned across all 24 CAST entries — the
    Smilers and Manager share the `wide` stare, the grayCommuter has
    `mouth: 'none'` because the Hush already came for it, the
    sidewalkCritic glares and frowns at the seams. Twenty-four characters,
    no two faces alike — the anti-uniformity rule applied to people.
- **Verification:** Lab remix preview at 5× in all four facings (dome,
  profile, cap-on-dome, nape all read), the 24-cast grid, and in-game
  Otterbrook (Ana/Vivi/Plummer/pajamaKid distinct at gameplay scale);
  shots in `.shots/` (`v6_*`). All S7c detail hooks land correctly on the
  new construction. Validator + 107 vitest green; zero data-shape changes;
  frame contracts untouched.
- **Consequences:** new cast members pick a face (`eyes`/`mouth`) the way
  they pick a hat — variety is now a spec field, not a code fork. The
  span tables are the precedent for any future build (`teen`? `tall`?):
  author rows by hand, never chamfer a rect. ADR-009's construction notes
  are superseded by this entry where they conflict; its metrics, frame
  size, and sheet order remain law.

## ADR-023 — S7e: MIA (née Faye), the kid-detail pass & street trees

- **Date:** 2026-06-11
- **Status:** Accepted (user art review against real EB screenshots + a
  reference mockup: "rosey cheeks... more detailed shirt", "the second
  character should be named Mia", "more trees in the cities")
- **Context:** ADR-022's construction rebuild landed, but EB's character
  charm lives in costume-grade details the renderer didn't model — blush,
  collars, belts, the shorts-and-white-socks kid uniform. Separately the
  author renamed the second hero, and Brickton's blocks read bare next to
  Twoson's tree-lined streets.
- **Decision:**
  - **The second hero is canonically MIA.** Display-name only: 55
    occurrences of Faye/MIA-case swept across the Bible (§A3 amendment
    note added per Appendix rule 6), NEXT_PROMPTS, src comments, test
    assertions, the validator's §A3 messages, and `HEROES.faye.name`
    (the single source the name-entry prefill derives from). **Internal
    ids are FROZEN identifiers and stay `faye`:** the HEROES/CAST key,
    `heroNames.faye` on the save (v2 blobs untouched, no migration),
    flags (`faye_joined`), dialogue keys (`npc_faye_wait`), texture keys
    (`angel_faye`), and the `{faye}` text token — that token resolves to
    the live display name, so every line reads Mia. 'Faye' survives as
    the first don't-care alternate on her name screen (she was almost
    named that). Old saves keep whatever name the player typed — names
    are per-save choices (ADR-013); only the default changed. The Sprite
    Lab now labels heroes by display name (ids were leaking to the UI).
  - **v5 kid-detail pass (CharacterSpec: `blush`, `socks`, `longPants`):**
    rosy 2px cheeks (RED 3) — kids default on, adults opt in (Mom: yes;
    Dorin: the mountain deleted his first); a nose dot; ringer-tee collar
    band + matching white cuffs on `stripe`; a real V-collar with white
    wings + two buttons on `shirt`; an INK belt with a gold buckle where
    shirts tuck in (`shirt`/`stripe`/`pajama`); and the EB kid uniform —
    SHORTS with bare knees, white socks, light sneaker soles — for kid
    builds (Milo keeps Wintermoor slacks, Dorin his gi trousers, the
    pajama kid his pajama bottoms + slippers; `chub` counts as a kid, so
    Chad's knees are now public). Profile legs row-map the same way.
  - **Street trees:** Brickton gains tree lines on the mid-block strip
    and the south sidewalk plus park infill — all from the rng2 stream
    (1995 layout byte-identical) with clearance from the avenue mouth,
    poles, the payphone/bus corner, the realtor sign, the picnic table,
    and columns the jittered S1 furniture already claimed (computed, not
    assumed). Otterbrook gains four hand-verified inner greens. Standard
    tree solid everywhere; S6 save-safety rules hold.
- **Verification:** 5× Lab close-ups (front/profile) show blush, collar,
  belt, shorts+socks; the 24-cast grid shows MIA labeled and every kid in
  the uniform; in-game Brickton shows tree-lined blocks (shots `v7_*`,
  `v8_*`). Validator + 107 vitest green — the §A3 checks and all renamed
  default-name assertions pass; saves stay v2. Two author catches fixed
  on review (`v9_*`): capped profiles were BALD behind the band (the cap
  branch skipped the back-of-head mass — now style-aware: full mass for
  short/sidepart/bob, receded patch for gray), and noses/mouths drew in
  the mid skin shade that vanishes at game zoom — both now use the
  DEEPEST skin tone (`px(skin, 0)`), which is the standing rule for
  facial marks.
- **Consequences:** chapter casts get EB-kid dressing from three spec
  flags; the id-vs-display-name split is now explicit policy (rename a
  character = change `HEROES.<id>.name` + Bible, never touch ids); city
  prompts (28+) inherit "tree-line the blocks" as part of the ADR-012
  look. The Otterbrook/Brickton arcades stay branded STARPORT — §A10
  quest #4's venue (S10 opens them with the Arcade Legend shmup).

## ADR-024 — Input responsiveness: per-frame UI polls + press latching

- **Date:** 2026-06-11
- **Status:** Accepted (user playtest report: controller/keyboard presses to
  advance dialogue or pick Bash "don't always get caught — I have to click
  multiple times")
- **Context:** `INPUT.update()` runs once per FRAME (main.ts PRE_STEP), so
  `justPressed` edges are true for exactly one frame. But every promise-based
  UI poll — Dialogue say/ask (windows.ts), the pick() widget, BattleScene's
  print linger + target select, MenuScene's waitDismiss — sampled it from
  `time.addEvent({ delay: 16 })` Clock timers. At 60fps a 16ms timer happens
  to fire every frame, which is why dev and the ADR-008 bot (16.7ms steps)
  never saw a drop. On a 120/144Hz display the timer fires every second or
  third frame and ~half of all presses land on frames the poll never reads —
  the exact reported symptom, worst in dialogue and battle menus. Three
  smaller holes: a tap shorter than one frame (or swallowed by a GC-hitch
  frame) vanished entirely; Bluetooth pads that momentarily report null at
  the stored index read as unpressed; and Chrome withholds `gamepadconnected`
  after a reload until the pad's first input, leaving `padIndex` null.
- **Decision:**
  - **One rule: input edges are per-frame, so UI polls run per-frame.**
    `everyFrame(scene, cb)` (ui/windows.ts) subscribes to the scene UPDATE
    event and returns an unsubscribe; it pauses with the scene exactly like
    the timers did. ALL six poll sites converted; 16ms Clock-timer input
    polls are a forbidden pattern now — grep `delay: 16` should stay empty.
  - **Typewriters are dt-scaled** (`acc += rate * dt/16`, linger in ms), so
    text speed and battle-line linger are identical at any refresh rate.
  - **Press latching in InputBus (the `queued` set):** keydown transitions
    (non-repeat) and touch taps (`INPUT.pressBtn`, used by UIScene) latch
    immediately; `update()` folds the latch into that frame's snapshot then
    clears it. A press can no longer fall between two frames, however short
    the tap or however hitched the frame it landed in.
  - **Gamepad hardening:** `pad()` falls back to the first live pad when the
    stored index is null/blipped — presses are never read against a dead
    handle, and pads work pre-connect-event after reloads. Mapping and the
    connect/disconnect toast flow are unchanged.
  - **QA driver:** `pump(frames, dtMs = 16.7)` gained the dt param —
    responsiveness is verified by stepping at 8.33ms (120Hz) with worst-case
    one-frame and zero-frame taps.
  - Explicitly NOT changed: navTick/navOk held-direction repeat cooldowns
    (~180ms — cursor-repeat UX, never applied to A/B edges) and ADR-018's
    `justReleased` same-frame guard (still prevents the ask→interact
    re-fire; do not reintroduce raw justPressed interaction triggers).
- **Verification:** at 8.33ms stepping — a zero-frame KeyZ tap opens the
  title menu (latch); five consecutive menu→Sprite-Lab→title round trips
  where every confirm/cancel is a one-frame tap: 5/5 registered across
  shifted frame phases (ask(), scene-update, and pick paths); an Otterbrook
  sign conversation opened, page-advanced, and closed on one-frame taps
  (waitAdvance path). Validator + 107 vitest green; bot recipes unchanged
  (pump defaults to 16.7).
- **Consequences:** every future promise-based UI (S9 journal, S10 shmup
  cabinet and initials entry, S11 hospital menus) inherits the rule: poll
  input with `everyFrame`, never with Clock timers. S8's on-device QA must
  re-verify feel on a real >60Hz phone and a Bluetooth pad — this failure
  mode is invisible on 60Hz dev monitors by construction.

## ADR-025 — S8 side-profile hair: hairTones shade rule + v6 side coverage

- **Date:** 2026-06-11
- **Status:** Accepted (user catch: "when characters turn to the side they
  don't have any hair showing left or right")
- **Context:** Two whole hair-ramp families vanished in profile. INK hair
  (Rex, Dorin, the Smilers) rendered shade-1/2 flush against the universal
  INK-0 outline - the back-of-head mass ADR-023 added read as a thick border,
  so capped Rex still looked bald from the side. EARTH hair (Milo, Mom, Ana,
  Vivi, quarterMan, smilerB) is the same warm-tan family as both SKIN ramps
  (EARTH-2 #c08c58 vs SKIN-2 #f0b080) - bald from EVERY facing, worst on the
  side where no part line or fringe shadow breaks the blend. Colorimetric
  auto-detection was tried and rejected: BLOND sits numerically CLOSER to
  SKIN than EARTH does yet reads fine (yellow chroma carries it), so a
  luminance threshold cannot separate the bad pair from the good ones.
- **Decision:**
  - **`hairTones(spec)` (characters.ts)** is now the only source of hair
    shades: trio 1/2/3 of the hair ramp - except **EARTH, which steps one
    shade darker (0/1/2)** by explicit rule. EB browns are chocolate, not
    tan. Any future hair ramp sharing a skin ramp's hue family must join the
    rule. All sites converted (headFront, headSide, glare brows, angels);
    `px(spec.hair, n)` literals outside hairTones are a review smell now.
  - **v6 side construction**, three tones on every style: a LIT arc on the
    back-of-head curve (light is top-left; a right-facing head turns its
    back to it - this is what separates INK hair from the INK-0 outline), a
    shade-2 mass, and a **shade-1 HAIRLINE wherever hair meets skin**. Plus
    the EB coverage truths the old pass skipped: short/sidepart band across
    the temple row (the bald gap between crown and fringe is gone), hair
    tucks over the ear's front corner, capped heads grow a temple band under
    the cap band plus a nape tuft, and the bob curtain widened to drape the
    ear (lobe peeks below). Topknot crowns draw in shade-2 with a lit arc
    (shade-1 alone melted into Dorin's outline).
  - **`InputBus` untouched**; frame sizes, sheet order, metrics, detail
    hooks all per ADR-009/021/022 - this is a paint-only pass inside the
    fixed canvas.
  - **Review surface:** `npm run art:castsheet` (tools/cast-sheet.ts) renders
    .shots/cast_side.png (all 24, grass + void), cast_leads.png (walk
    frames), cast_front_side.png via a new zero-dependency PNG writer
    (tools/png.ts) - the out-of-game half of the .shots workflow, also used
    by the S8 icon exporter.
- **Verification:** 12x contact sheets show all 24 cast members with legible
  hair (or intentional recession) from the side on grass AND void; in-game
  shots both facings (.shots/s8_ingame_side_*.png); validator + 107 vitest
  green; saves untouched.
- **Consequences:** chapter casts inherit readable profiles for free;
  recoloring a character means picking a ramp, never hand-balancing shades;
  if a sprite ramp ever needs a custom trio, extend hairTones - do not
  scatter px() calls.

## ADR-026 — S8: Capacitor 6 shell - wrap, never fork (Bible Prompt 41 adapted)

- **Date:** 2026-06-11
- **Status:** Accepted
- **Context:** §B1 mandates Capacitor 6 -> Android APK with landscape lock,
  immersive fullscreen, safe-area-aware touch UI, keep-awake, audio focus,
  back-button=B, durable saves, engine-generated icon/splash (ADR-002: zero
  hand-drawn binaries). ADR-024 made input the release gate: 90/120Hz
  WebViews are the regime where timer polls dropped presses. The browser dev
  loop + ADR-008 QA driver must stay untouched.
- **Decision:**
  - **One bundle, runtime guards.** capacitor.config.ts (appId
    `com.meteorfalls.game`, webDir dist) wraps the SAME vite build the
    browser runs; `npm run android:apk` = build -> validate -> sync ->
    assembleDebug -> meteor-falls-debug.apk at the repo root
    (tools/collect-apk.mjs). No build forks, no env-specific bundles.
  - **Native shell is plugin-light:** manifest `sensorLandscape`;
    MainActivity owns FLAG_KEEP_SCREEN_ON (keep-awake = whole session),
    WindowInsetsControllerCompat immersive (re-applied on focus regain), and
    LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES so env(safe-area-inset-*)
    carries real values. The only plugin is @capacitor/app.
  - **`src/engine/native.ts` is the single JS seam:** back button ->
    **`INPUT.tapBtn('B')`** - a new InputBus method that latches an
    edge-only one-frame press (rides the ADR-024 queue, never enters the
    held set, so back can cancel but can never read as B-held running);
    appStateChange -> `AUDIO.focusLost()/focusGained()` (new AudioSys
    methods sharing the ADR-006 suspend path - covers calls where the
    WebView never flips document.hidden); `navigator.storage.persist()`
    flags the ADR-018 localStorage slot family durable. In a plain browser
    every hook degrades to a no-op.
  - **Insets in game pixels:** native.ts measures env() via a probe element
    and `gameInsets()` maps only the overlap that reaches INTO the
    FIT-letterboxed canvas; UIScene.layoutControls() anchors the d-pad/A/B/
    START cluster inside them and re-lays-out on scale RESIZE. Zero insets
    => byte-identical pre-S8 layout (verified: hit zones reduce to the old
    literals).
  - **Saves stay v2, durability stance explicit:** WebView localStorage
    survives app UPDATES by Android policy (uninstall wipes - documented in
    RELEASE.md); persist() guards eviction. The §B1 IndexedDB driver remains
    the follow-up and lands behind ADR-018's SaveStorage as a driver swap,
    not a rewrite.
  - **Icon + splash FROM the engine:** tools/render-appart.ts (`npm run
    art:appart`) renders `drawAppIcon` (a square composition - the raw title
    formula does not survive 24px; legacy icons are ONE 24px scene integer-
    upscaled x2..x8, adaptive foreground re-aims the meteor into the safe
    zone) and the real title composition (scene + logo, x2) as a
    drawable-nodpi layer-list splash - `gravity=center`, so bitmap-stretch
    distortion is impossible. All 13 Capacitor template assets deleted;
    adaptive/splash backdrop = palette NIGHT-0. drawTitleArt star/twinkle
    counts now scale with area (90/6 at the canonical 400x225 - title screen
    pixel-identical). The rendered PNGs are GIT-IGNORED (ADR-002: zero binary
    assets in the repo) - `android:sync` regenerates them on every build, so
    the generator is the committed artifact, exactly like every sprite.
  - **Toolchain pinned & documented** (docs/RELEASE.md): Capacitor 6.2.x,
    Gradle/AGP 8.2.1, SDK 34 (min 22), build-tools 34.0.0, JDK 17. The S8
    machine was bootstrapped from nothing into %LOCALAPPDATA% with the exact
    commands recorded; keystores are documented, git-ignored, never
    committed. No Play-Store work (Prompt 44).
  - **QA gate formalized in docs/QA.md:** S8 browser pre-flight ran the
    ADR-024 regime (pump @8.33ms, one-frame taps) over boot, full ADR-013
    name entry, 70-press dialogue mash, START menu, and the tapBtn back
    path - all green. The 8-row on-device table (touch + BT pad columns) is
    the release sign-off; Chapter-1-twice (touch-only, pad-only) is the S8
    done-when and stays open until run on the phone.
- **Consequences:** phone iteration is `npm run android:apk` + adb install;
  web iteration never notices Capacitor exists. S9+ UIs inherit insets and
  back=B for free. Prompt 42 profiles inside this shell; Prompt 44 adds
  signing/AAB on top of RELEASE.md. The audit chain stays honest: any future
  native concern enters through native.ts or MainActivity, nowhere else.
