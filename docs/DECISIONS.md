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

## ADR-027 — S9: the quest engine, the CALLER ledger (save v3) & the JOURNAL

- **Date:** 2026-06-11
- **Status:** Accepted (Prompt S9 — Bible Prompt 26 + §A10 #1–3)
- **Context:** §A6 Ch.8's finale is fueled by completed side quests — every
  caller answers a phone in Movement 3. S5 left the Quest schema waiting in
  src/schemas with the validator's parse list as its planned consumer;
  ADR-014's flag gates and fade-restart rule are the world-mutation law;
  ADR-015 demands registered migration steps for new save fields; ADR-016
  made ui/pick.ts the one list widget; ADR-024/026 set the input rules every
  new UI inherits (everyFrame polls, back = tapBtn('B')).
- **Decision:**
  - **Quests are flag-derived state machines** (`src/engine/quests.ts` over
    `src/data/quests.ts`): `startFlag` arms, each objective's flag marks a
    completed step (the journal shows the FIRST unset one), `doneFlag`
    closes. The schema gained `startFlag` (S9, its first consumer). The
    engine stores NOTHING beyond flags except the ledger entry below —
    status/objectives derive on read (the ADR-018 derive-don't-duplicate
    stance applied to quests).
  - **The CALLER ledger is save v3** — the first real new field since v2:
    `GS.data.callers: CallerRecord[]` ({quest, name, quote, effect}), FROZEN
    copies of the §A10 records in completion order; §A6 Ch.8 iterates the
    LEDGER, not quest data, so a patched quote never rewrites a player's
    history. The v2→v3 step is REGISTERED in engine/migrations.ts: old saves
    load with an empty ledger, which is their true history (quests are
    v3-new), not a guess. Slot peeks derive as before — no summary field.
  - **`completeQuest()` routes rewards through the S3/S4 bag flow**:
    GS.addItem with hands-full BLOCKING completion before anything commits —
    the giver keeps the reward warm, the player retries after making room
    (zero missables, §B4). Lemonade Empire has NO rewardItem: the stand's
    infinite-free-lemonade gate (q_lemonade_done) IS the reward; a full bag
    at the stand pours the drink on the spot instead (12 HP).
  - **World wiring is data gates + scene beats** (ADR-014 held): SignDef and
    PropDef gained `unlessFlag` (signs also `ifFlag`), SpawnerDef gained
    `unlessFlag` — sniff clues are gated signs paired with `paw_prints`
    ground markings, and the §A10 #2 Lawnmower guards Mr. Sodd's slot via an
    ifFlag/unlessFlag spawner. **Ask-beats that arm gates on the CURRENT map
    fade-restart it** (Pemmel's clue 1, Plummer's mower) — the quota-beat
    precedent, now stated as the rule: a flag that changes the map you are
    standing on is not real until the rebuild. Quest talk branches live in
    OverworldScene.questTalk()/signBeat()/mailDelivery(), keyed on stable
    npc/sign/prop ids exactly like the S2 beats.
  - **The JOURNAL is a MenuScene page on the shared pick()** — command order
    is now ITEMS STATUS VIBE EQUIP JOURNAL LOCKET SETUP (header recipes
    updated; bots re-derive from headers). pick() gained optional per-row
    `icons` (the earned-caller phone icon — drawPhoneIcon was waiting for
    this since S7); rows are tap zones as ever, B/hardware-back closes, the
    detail page is a STATUS-style static (in-voice lines only — active
    quests show done steps dimmed + the current line; done quests show
    "<caller> owes you a phone call."). Map markers stay OFF (canon).
  - **Items: two new kinds.** `charm` rides the 'other' equip slot (Lucky
    Collar, +7 Luck) — `ItemDef.luck`, `heroLuck()`/`equipLuckDelta()` in
    formulas (STATUS reads through them), and confirmEquip previews "Luck up
    by 7!" for 'other'-slot gear (one shared flow, now stat-aware).
    `valuable` is sell-fodder/quest goods: Fresh Stamps at price 240 encode
    §A10 #2's "sell high" — sellPrice() pays $120 and the item text IS the
    gag; sugar_bag/lemon_crate extend the §A8 shop manifests (validator
    pinned, same commit). The lemonade jug is a key item, returned at the
    pour.
  - **The validator now parses QUESTS** (the S5 plan landed) and pins the
    §A10 #1–3 manifest in both directions: ids, names, chapters, givers
    (must stand on a map), startFlag/doneFlag/objective-flag lists, flag
    uniqueness across quests, reward items existing in ITEMS, caller
    names/effects (damage 400 / damage 450 / heal 400 — canon-setting values
    for Prompt 34), the collar/charm and stamps/price pins, and the
    {token} sweep over quest names/objectives/quotes ({coolthing} found its
    first natural consumer in the twins' ask). Verified failing loudly on
    three axes (wrong reward, missing item, wrong objective flag).
- **Verification:** validator + 121 vitest green (quests engine suite,
  v2→v3 + v1→v3 chain, ledger round-trip, charm formulas). ADR-008 bot runs
  logged in docs/QA.md: Mail Must Move end-to-end on a FRESH save (the salt
  one-shot is deterministic — battle items are flat power), Biscuit and
  Lemonade end-to-end on a constructed POST-ch1_complete save (both bus
  directions, shop purchases of quest goods, spring fill), the JOURNAL at
  pump(n, 8.33) one-frame taps, and the ledger surviving tab-kill AND
  dev-server-kill through Continue. Recipe in engine/quests.ts's header.
- **Consequences:** quests #4–16 are data + beats + a manifest extension —
  the engine, journal, ledger, and validator shape are fixed; S10's arcade
  score REGISTERS v3→v4 (v3 shipped here); Prompt 34's finale consumes
  `GS.data.callers` in order with base allies prepended; future same-map
  gate-arming beats must fade-restart (review smell: setFlag on a gated
  def of the current map without one).

## ADR-028 — S9b: conga motion fix, run cycles, story-night rule, the upstairs wing & the interior program

- **Date:** 2026-06-11
- **Status:** Accepted (user playtest feedback: frozen followers, run feel,
  "why is it sometimes dark", a roomier early game, and the every-building-
  matters program)
- **Context:** Followers snapped to breadcrumbs each frame, so a per-frame
  "did I move" check thrashed play/stop and froze them on frame 0. Running
  was the walk anim at 1.6× timeScale. hickory_hill carried a permanent
  `night: true`, so dawn never reached it and the overlay read as an
  unexplained haze. The §A11 author renamed the twins' relationship: Ana &
  Vivi are Rex's little sisters. The larger asks (hotels, open-everything
  interiors, big city, vehicles) are multi-session and went into the queue
  as designed prompts, not rushed code.
- **Decision:**
  - **The LEADER's motion drives the conga.** Followers play/stop on Rex's
    moving state, not their own crumb deltas. While he runs, they run.
  - **Run is a CYCLE, not a tempo** — `<id>-run-<dir>` resequences the same
    sheet: both step poses (1,3), no neutral frame, frameRate 11. Poses 1/3
    carry the +1px bob, so runners stay risen — a sprint gait with zero new
    pixels. ADR-009/022 frame contracts untouched (a true frame-count
    expansion is queued for the S13 vehicle pass, which must supersede the
    frame-count law in its own ADR if it adds rows). Consumers: leader,
    followers, pursuing walker roamers, patrol chases (the timeScale
    speed-ups are gone — grep `anims.timeScale` in the overworld should
    stay empty).
  - **Night is the story clock.** `storyNight` covers otterbrook AND
    hickory_hill until `zapper_done`; `MapDef.night` remains for genuinely
    always-dark places (none currently). Night maps' banner carries a dim
    CYAN "2 A.M." second line — the haze is labeled.
  - **The upstairs wing:** rex_bedroom and rex_home's stairs now meet at
    `rex_hall`, which opens onto `ana_room` and `vivi_room` (§A10 amended
    per Appendix rule 6: the twins are Rex's sisters; ids/dialogue/quest
    data unchanged — the EB-Tracy move). Their rooms hold the first GIFT
    BOXES (Prompt 19's deferred chests): closed/opened prop pair gated by
    one flag, a sign beat grants the item through GS.addItem with the
    hands-full raincheck, fadeRestart swaps the box — the S9 sign-beat
    pattern, zero new systems. New sprites `gift_box`/`gift_box_open`
    follow ADR-020. Mom's payphone line counts "another plate" (Mia), not
    a family-size mistake.
  - **The interior program is QUEUED, designed** (NEXT_PROMPTS S12–S13):
    the no-decorative-doors law with validator enforcement, the 12-category
    interior payload taxonomy (~120 seeded instances — §A11 bits, economy,
    recovery incl. two-story HOTELS and landmark-large hospitals
    *(amended same day, user: a hospital is "a rather large building" —
    wide, findable, never required to be a city's tallest; big-city office
    and apartment towers out-build it, 4–5 stories in Chandrapore)*,
    quest nodes, collections, tutors, world-building,
    secrets, LEDGER CALLBACKS reading GS.data.callers, residences, civic,
    set-pieces), city vocabulary (hotel/hospital-block/walk-up/rooftop),
    and the transport pass (bus stations + fares, bike ×1.35, the car's
    region-road UI, chapter-gated airports) — all reconciled with §A5's
    scripted vehicles and Teleport's canon role. "New York scale" is
    canonically Chandrapore (Prompt 31) plus Brickton's S12 vertical
    growth. STARPORT keeps its name pending the author's call (ADR-023
    branding; §A10 #4 + the locked_arcade2 "MGR" gag depend on it).
- **Verification:** validator + 121 vitest green (3 new maps swept: doors,
  bounds, tokens); browser run logged in QA.md — conga walks AND sprints in
  step, chasers sprint, the 2 A.M. tag shows pre-dawn on both outdoor maps
  and vanishes after zapper_done, bedroom → hall → sibling rooms → kitchen
  walkable with both presents claimable (hands-full raincheck included),
  and the fresh-save bot path still reaches Mom through the new hall.
- **Consequences:** any sheet-format change must keep `-walk-`/`-run-` key
  shapes; new interiors pull payloads from the S12 taxonomy instead of
  inventing; gift boxes are the standard one-time-pickup pattern; the
  S9 bot recipe's step 2 now crosses the hall (header updated).

## ADR-029 — S10: ARCADE LEGEND — the deterministic cabinet, save v4 & the first body armor

- **Date:** 2026-06-11
- **Status:** Accepted (Prompt S10 — GAME_BIBLE §A10 #4 + Prompt 36's shmup
  hook landed early, adapted to ADR-001..028 reality)
- **Context:** §A10 #4 ("Arcade Legend", replayable, Champion Jacket, the
  arcade-owner caller) needs a venue and a playable shoot-'em-up; both
  arcades were locked facades whose dialogue carried two standing gags (the
  Otterbrook chirp, STARPORT II's attract-mode "MGR" — which NEXT_PROMPTS
  canonized as the S2 Manager's score). ADR-015 demands registered
  migration steps; ADR-017 demands manifest extensions in the same commit;
  ADR-024/026 set the input law every new UI inherits.
- **Decision:**
  - **Both STARPORTs open via the S4 interior pattern.** Otterbrook's
    `arcade` prop and Brickton's `bldg_arcade2` gain `door` zones below
    their collision floors (ADR-011); assigning a door consumes NO rng, so
    the 1995 stream is byte-identical (ADR-016's rule — verified by the
    untouched jitter tests). Street exits derive through `doorstepOf()`.
    `locked_arcade`/`locked_arcade2` retired the locked_drugstore way. TWO
    knock-on fixes: the Otterbrook park hedge shortened (tiles 3–6) because
    its old run crossed the new doorstep, and the §A10 #2 mail check
    HOISTED out of the lockedLines loop — facades take letters whether or
    not their door is real (the open STARPORT still has a mail slot).
    New tiles `arcade_floor/_star/_wall` (chars `a * A`), cabinet props
    `cab_a/b/c` (parameterized attract screens) + `cab_legend`, all under
    ADR-019/020 discipline. Interiors: the Otterbrook original keeps a
    cabinet-shaped patch of clean carpet (the big game moved to the
    sequel — that's why the quest venue is Brickton, §A10 canon); STARPORT
    II holds THE machine, island banks, and SAL.
  - **THE CABINET IS DETERMINISTIC — that is the design.** `ArcadeScene`
    ('arcade', launched over a paused world like ShopScene, emits
    'mf-arcade-closed'): ~60s score-attack, ship + held-A autofire + 3
    lives, on the EXISTING input layer (the UIScene touch overlay drives it
    with zero new controls, §B4). Waves come from a SCRIPTED spawn table in
    `src/data/arcade.ts`; the sim advances on accumulated dt (everyFrame /
    scene update — never Clock timers, ADR-024); zero Math.random() during
    play. Same inputs = same score, forever: 1995 cabinets played fair,
    pattern-learning is the fun, and the ADR-008 bot reproduces runs
    exactly (calibrated: a never-move camper banks 2337 — losing to MGR by
    design; the scene-header sweep recipe banks 3817). EB-goofy foes (MOON
    MOTH, GRUMBLE ROCK, SAUCER SALESMAN), one corn dog (eating it is +300;
    SHOOTING it is +5 and the cabinet's disappointment — a real ceasefire
    decision), and the finale: **THE {coolthing} attacks as itself**, the
    player's coolest thing flying in letter by letter (+COOL BONUS for the
    full word). All cabinet strings live in `ARCADE_TEXT`, swept by the
    validator (§B4 + TEXT_VARS; {playername}/{coolthing} are live).
    Hardware back = B (ADR-026): eject ask mid-run (discards the score),
    walk-away from attract/table.
  - **Save v4 — the score table.** `GS.data.arcadeScores` (5 rows,
    best-first; ties rank BELOW the sitting row — a legend must EXCEED).
    The registered v3→v4 step backfills **MGR's lonely row (3000 — a quota
    of a number; he smiled the whole time)**; newGameData seeds the same
    row, so every save meets the attract gag the dialogue used to carry.
    Slot peeks still derive from the blob (ADR-018, no new summary field).
    `arcadeTopScore/arcadeRankOf/submitArcadeScore` are the GS seam.
  - **The ADR-013 letter grid extracted to `src/ui/lettergrid.ts`** (the
    S4 pick()-extraction precedent): cells, button bar, wrap math, SFX
    verbatim; buttons are now a configurable subset packed center-on-200
    with 6px gaps — the full SPACE/BACK/DON'T CARE/OK set reproduces
    NameEntryScene's original literals exactly, so the ADR-013 QA recipe
    stays true (re-verified at 8.33ms one-frame taps). Initials entry =
    the same grid, cap 3, BACK/OK only, prefilled from {playername}'s
    grid-typeable letters.
  - **Quest #4 on the S9 engine**, zero order-dependency: the cabinet arms
    `q_arcade` at first play and sets `q_arcade_beat` the moment a run's
    score exceeds the table's top row; SAL's ask also arms. His claim beat
    routes the **CHAMPION JACKET** through completeQuest (hands-full
    BLOCKS, zero missables) and freezes his caller record (damage 425).
    The quest completes ONCE; the cabinet is endlessly replayable from any
    save (§A10: "replayable" — the table is save data, not quest state).
  - **The Champion Jacket is §A8's first 'body' armor**, wired the way S9
    wired charms into 'other': `ItemDef.defense` (+ the kind⇔field schema
    refinement), `slotOf` armor→'body', `heroDefense()`/
    `equipDefenseDelta()` in battle/formulas.ts with enemy damage AND the
    STATUS sheet reading through them (the sheet gained a Body line), and
    `confirmEquip` now fully slot-aware ("Defense up by 8!"). Future §A8
    armor is an item + manifest row, no new code.
  - **SAL, the new cast member** (ADR-020/022/025 compliant: spec-field
    face, hairTones gray, a 3px gold staff-star detail hook): owner of
    both STARPORTs, exactly one §A11 obsession — **he keeps a high-score
    table for EVERYTHING** (the weather, customers, Tuesdays, eventually
    the saving of the world). His grudge against the round-number "MGR"
    row is the quest's §A11 engine; `sal_after_meeting` pays off the S2
    Manager post-`manager_defeated`.
  - **Validator extended in the same commit** (ADR-017): the §A10 manifest
    now pins #1–4 (flags, reward, caller name/effect), champion_jacket's
    armor pins (sole Ch.1 'armor'), MGR_ROW pinned at MGR/3000, the venue
    pins (cab_legend sign + prop in arcade2_int, both facade doors), and
    the ARCADE_TEXT sweeps. Verified failing loudly on three axes.
- **Verification:** validator + 126 vitest green (jacket formulas, v3→v4 +
  full v1→v4 chain, cabinet-law rank tests); the whole S10 pre-flight table
  in docs/QA.md ran live via the ADR-008 driver — both arcades entered
  (fresh-save and post-ch1), camper-vs-sweeper runs at their calibrated
  scores, initials → table → dethrone → Sal → jacket equipped ("Defense up
  by 8!", STATUS 24), save → kill → Continue with the v4 blob intact, a
  TRUE v3 blob migrated live, the 8.33ms one-frame-tap regime over
  attract/fire/eject/grid, and `npm run android:apk` produced a fresh APK.
  One device-gate row added to the S8 table (the USER's phone sign-off;
  existing boxes untouched).
- **Consequences:** future cabinets (Prompt 36's NG+ hooks, S12's "the
  STARPORT teaches the shmup" tutor) extend `data/arcade.ts` patterns —
  scripted waves stay the law (a cabinet that rolls dice breaks the bot
  and the 1995 fiction at once); body/arms armor lands as data through the
  S10 read-through seams; any future text-entry UI reuses ui/lettergrid
  instead of forking the grid; the v4 registry note in ADR-015's chain
  stands (S11+ register v5, never ad-hoc). Driver lore for future bots
  joined QA.md: release all keys before each chunk, never restart a scene
  mid-typewriter, settle fades before pressing.

## ADR-030 — S11: THE LIVING BATTLE — party-card busts, the FX registry & the §A4.8 status set

- **Date:** 2026-06-11
- **Status:** Accepted (Prompt S11 — GAME_BIBLE Prompt 12/14 presentation
  pass; user direction: "each character in an active UI like a real
  character", art-directed mid-session against MOTHER Encore: the bust
  rises from BEHIND the status box, centered above the HP rows)
- **Context:** The party strip was four text boxes; abilities resolved as
  one shared tint-flash; §A4.8 statuses beyond sunburn/productive didn't
  exist in battle. ADR-010 set the one skip state (held A/B = ×4), ADR-020
  the art law (battle sprites float, light/shadow never outlined), ADR-021
  the variant pattern (per-hero angels from CAST specs), ADR-024 the input
  law (everyFrame, never Clock timers; tweens only for pure cosmetics),
  ADR-029 the determinism creed. Prompt 13's odometer is the soul and may
  never be covered or delayed; Prompt 42 will profile this scene hardest.
- **Decision:**
  - **BATTLE BUSTS (src/spritegen/busts.ts):** every hero's card carries a
    NEW 32×32 ×16-state sheet (`bust_<id>`) generated from the SAME
    CharacterSpec as their overworld sheet — the ADR-021 pattern; ADR-022
    span-table dome, ADR-025 hairTones, ADR-020 rules (Vibe glow and cheer
    stars stamped AFTER outline; busts float). States: idle breathing ×2 ·
    lunge · cast ×2 (glow between raised hands) · pray (hands together,
    eyes closed — §A11.4 played straight) · gadget fiddle · rummage ·
    munch · guard brace · hurt flinch · nervous ×2 · down slump · cheer ×2
    (BUST_FRAME is the contract). The 24×32 overworld sheets are untouched
    law. Cards are MOTHER-composed: bust centered at depth DEPTH_UI−1 so
    the box overlaps its chest, name centered beneath, HP/PP drums beside
    their labels.
  - **BustView (src/battle/bust.ts)** drives everything DERIVED — HeroState
    + battle events in, frames out, nothing stored: poses ride the skip-
    scaled clock; defending holds the guard frame; a mortal drum runs the
    nervous loop (the card sweats while the meter races); DOWN slumps,
    fades, and the hero's own `angel_<id>` floats over the card (§A4.7);
    revive returns the bust under a heal glow; victory runs the cheer.
    §A4.8 renders ON the card: Sunburn red edge-tint, Crying droplets,
    Asleep Zzz drift, Paralyzed sparks, HUSHED muzzle shimmer, Homesick
    {favoritefood} thought-bubble (`thought_food`; Mushroomized lands with
    Ch.6). Card shakes move box/labels/bust — the drums NEVER move.
  - **THE FX REGISTRY (src/battle/fxRegistry.ts, Phaser-free):**
    `AbilityDef.fx` is schema-REQUIRED (ADR-017 z.infer); every key
    resolves here with kind 'ability' | 'item' | 'system', a visual
    family, tier, and palette ramp. `npm run validate` fails BOTH
    directions (unregistered ability fx / orphaned ability key), battle
    items resolve through `itemFxKey` with the same two-way check, and
    vitest mirrors it (fxRegistry.test.ts). System keys — per-element
    impacts, smash burst, enemy dissolve, the Tick's latch_tether +
    tether_sever, guard/heal glows, the six pray events, and the
    summon_flash/phase_swap hooks Prompt 15's phase-machine will call —
    are engine-invoked and exempt from the reverse check.
  - **BattleFx (src/battle/fx.ts):** composable OBJECT-POOLED primitives
    (particles, expanding rings, zigzag bolts, screen floods, palette-cycle
    pulses, camera shakes, tint/flinch, floating popups — the S10 popFoe
    idiom — and the Tick's throbbing tether) composed into named TIMELINES
    (src/battle/fxTimeline.ts: events + spans on dt, Pool, stagger).
    Authored families: Surge rings escalate per tier α→Ω, Fire rolls a
    flame wave, Freeze grows + shatters a lattice, Volt drops sky bolts,
    Lifeup rains green sparkles, Shield/Mirror snap a hex barrier, Hypno
    spirals, Flash floods, Bottle Rockets arc with payload bursts (Multi
    volleys), Spy sweeps a scanline + stamps the reveal, the Salt Shaker's
    thrown arc VISIBLY severs the latch (§A6 — Vibe Fire severs it too),
    food/cola sparkle/fizz at the bust, Glint's Spark pools porch-light
    warmth, Comet streaks the sky, and PRAY IS SIX DISTINCT EVENTS —
    Miraculous floods the field warm under a choir preset, Wonderful/Good
    scale down, Nothing is one mote that tries anyway, Strange wobble-darts
    onto a random combatant, Backfire's soft flare dozes an ally. Deaths
    DISSOLVE (sprites break up and drift — never the old squash; ADR-020
    floats). Fx use no dice — deterministic cadences, the ADR-029 creed.
  - **TWO HARD LAWS:** every fx layer renders BELOW DEPTH_UI (full-field
    floods slide UNDER the cards; nothing covers a drum, and the drums tick
    in update() regardless of choreography) — and ALL choreography advances
    on dt × the SAME ×4 the text typewriter uses under held A/B (ADR-010):
    one skip state, applied where dt is read. The ADR-008 bot replays every
    timeline through pump(); awaited tweens are extinct in this scene (the
    two survivors — enemy idle bob, Canvas-fallback bg pulse — are pure
    cosmetics per ADR-024).
  - **§A4.8 IS LIVE:** crying (aim misses both sides), asleep (skips, wake
    rolls, any hit wakes), paralyzed (skip rolls), hushed (no Vibe; enemies
    lose their special vocabulary), sunburn (dot), Homesick (unchanged
    flag), shield/mirror (halve physical; mirror throws a quarter back,
    never landing a kill) — constants + rolls in battle/formulas.ts with
    injected rng. Status abilities are functional: Hypno/Flash/Brainjam
    land enemy-side conditions, Shield/Mirror wrap allies, Healing α cures,
    Healing γ revives at half HP (§A4.7's named exception), Magnet sips a
    flat PP trickle until Phase-2 data gives enemies PP pools, Spy stamps
    HP + weaknesses, Bottle Rockets pierce defense at flat power. Per-hero
    command rows: Mia's Pray (ADR-014), Milo's GADGETS replacing the Vibe
    he never had; ally-targeting (hand cursor over the cards) serves heals,
    shields, and revives.
  - **Audio:** ~30 ADR-006 presets — one voice per element/family + the six
    pray tiers (Miraculous gets the choir bloom). Ducking under jingles
    unchanged.
  - **Drive-by (user catch):** interior door mats for north-wall doors now
    anchor flush against the wall base (rex_hall's three hovered mid-floor)
    — `buildDoorMarkers` keys on `facing: 'up'`.
- **Verification:** validator + 140 vitest green (timeline math, ×4 skip
  compression, pool reuse, registry mirrors); the registry gate verified
  failing loudly on all four axes; the full S11 gauntlet ran live via the
  ADR-008 driver at pump(n, 8.33) — every ability class, every status tick
  both sides, latch→tether→salt-sever, four pray tiers pinned via
  qa().forcePray, mortal-roll save-by-victory (drum frozen at 41, hero
  standing), full wipe (four cards → four angels → defeat), held-A
  compression — recipe in BattleScene's header, log + shots in docs/QA.md
  (`.shots/s11_*`), ONE device row appended to the S8 gate.
- **Consequences:** new abilities MUST ship an fx key + registry row in the
  same commit (the gate names any gap); Prompt 15's phase-machine calls
  fx.play('summon_flash'/'phase_swap') instead of inventing visuals;
  chapter casts inherit busts for free via CharacterSpec (a guest hero =
  one CAST entry + sheet registration); Prompt 13's urgency pitch hooks
  into the same mortal state the nervous loop reads; Prompt 42 profiles a
  scene that already pools every transient. Future battle UIs poll with
  everyFrame and respect both hard laws — a reviewer can reject any diff
  that draws over a drum or awaits a tween by citing this entry.

## ADR-031 — The first hero is canonically JAY (née Rex)

- **Date:** 2026-06-11
- **Status:** Accepted (user decree mid-S11 playtest, the ADR-023 playbook)
- **Context:** The author renamed the first hero while reviewing the S11
  party cards against MOTHER Encore (where the lead carries the player's
  own name). ADR-023 set the policy: rename a character = change
  `HEROES.<id>.name` + sweep the Bible, never touch ids.
- **Decision:** Display-name only. `HEROES.rex.name = 'Jay'`; every
  display-prose 'Rex/REX' in the Bible swept to 'Jay/JAY' with the §A3
  amendment note (Appendix rule 6); src comments and the two test
  assertions on the default name updated; the corn dog's item text now
  consumes the {rex} token (dlg.say applies vars() to item text — tokens
  are legal there, and the S5 sweep already guards them). **Internal ids
  are FROZEN:** `rex` (HEROES/CAST keys), map ids (`rex_home`, `rex_hall`),
  flags (`rex_homesick`), texture keys (`angel_rex`, `bust_rex`), dialogue
  keys, and the `{rex}` token, which resolves to the live display name.
  'Rex' was already the first don't-care alternate on his name screen —
  he was almost named that. Old saves keep whatever the player typed
  (names are per-save, ADR-013); only the default changed. No migration;
  saves stay v4.
- **Verification:** name entry prefills Jay; the card, STATUS sheet, and
  "JAY'S ROOM" banner all read Jay on a fresh save; validator + 140 vitest
  green (the §A3 checks key on ids, not display names).
- **Consequences:** the id-vs-display split holds for a SECOND rename —
  the policy is proven reusable; any future hero rename is one data field,
  one Bible sweep, one ADR.

## ADR-032 — S11b: THE BATTLE STAGE — battlers act, weapons render, wear states, real doors, the green combo

- **Date:** 2026-06-11
- **Status:** Accepted (Prompt S11b — continues ADR-030's Living Battle; user
  direction: "the character moves and does like a back swing looking at the
  bird", "animations for every equippable item and every psi ability",
  "enemies show damage as they near death — same for our characters",
  "any entry way needs a door, not just a mat", "shield needs clearer target
  UI", "a huge green SMAAASH with Mother-3 spam-A multi-hits")
- **Context:** ADR-030 gave every ability a named fx timeline but the caster
  never left their card; equipment was invisible outside the stat sheet;
  battle sprites never registered damage; interior doorways were mats; the
  ally picker was a bare hand cursor; SMAAASH was a gold one-hit banner.
  Standing law: ADR-002 boot-time textures, ADR-010's one ×4 skip state,
  ADR-020/021/022/025 art rules, ADR-024 input law, ADR-029 determinism,
  ADR-030's two hard laws (nothing covers a drum; all choreography on dt).
- **Decision:**
  - **BATTLERS (src/spritegen/battlers.ts):** per-hero full-body REAR-3/4
    sheets, 28×36 ×14 frames (idle ×2 · step ×2 · backswing · swing · aim ·
    recoil · cast ×2 · pray-kneel · throw ×2 · winded) — the ADR-021 variant
    pattern off the SAME CharacterSpec: hand-authored REAR_SKULL span table
    (ADR-022), hairTones (ADR-025), the face turned right with one eye, brow
    + nose on the silhouette edge, looking UP at the bird (the MOTHER
    framing). The 24×32 overworld and 32×32 bust sheets stay untouchable law
    (the bust sheet APPENDS windedA/B at 16/17 — indices 0–15 never move).
  - **WEAPON_ART (src/spritegen/weapons.ts):** every §A8 equippable maps to
    drawn art — 'held' (one silhouette per class: bat/pan/rifle/beads;
    item-specific by ramp + detail pass — the Cracked bat's crack vs the
    T-Ball's ring stripe — composed into the battler's grip per pose at
    sheet-generation time), 'torso' (the Champion Jacket re-dresses battler
    AND bust: trim sleeves, CHAMPION letter band across the back), 'trinket'
    ('other'-slot charms are drawn icons). weaponClassOf/swingSfxOf drive
    Bash choreography + audio. New §A8 line openers authored so every hero's
    swing is real: pellet_popper (milo) and cedar_beads (dorin) — granted
    in-world by their join chapters; the validator pins the weapon manifest.
  - **THE STAGE (src/battle/stage.ts + STAGE_ANIM in fxRegistry.ts):** when
    a hero acts, StageView walks their battler (look + wear-keyed sheet) from
    the card to the field band — fx depth, below DEPTH_UI, never over a
    drum — faces the target, performs, walks back; BustView holds an 'away'
    state so card and stage never pose-fight. STAGE_ANIM maps EVERY FxFamily
    to a pose (cast families raise arms under the glow; spiral/scan aim;
    throw_arc/rocket lob; pray/revive kneel — §A11.4 straight; munch/fizz/
    porchlight/guard stay on-card; system families 'none') — gated BOTH
    directions by validator + vitest. No AbilityDef changes: presentation
    keys off fx. Everything advances on FxTimelines ticked with the scene's
    skip-scaled dt — pump-replayable, tweens for nothing; fx originate from
    the actor (stage.point()), so rockets launch off the stage.
  - **WEAR, BOTH SIDES:** every spritegen/enemies.ts battle draw takes a
    wear param (0 full · 1 scuffed <66% · 2 battered <33%) with DELIBERATE
    clustered damage per ADR-020 rule 1 — mailbox dents + flag knocked off
    its hinge, mower's bent blade + smoke cough + missing grille tooth,
    cicada's cracked-then-shattered wing glass, slug's chipped crown + lost
    ruby, the Smiler's loosened-then-swinging tie + strained grin, pigeons
    shedding into patchy coats, and the Tick bruising then visibly DEFLATING
    (authored DOME_DEFLATED contour: crown drops six rows to the same base;
    shine retired, graspers drooped, veins dimmed). ENEMY_BATTLE_ART maps
    id → {sprite, draw}, gated both directions + sprite-key agreement. Hero
    busts + battlers generate the same three tiers (mussed hair, cheek
    bruise, torn sleeve + hanging thread, sweat sheen); below 33% the idle
    becomes WINDED (heaving shoulders, breath-tick sfx) — the mortal roll
    still owns the nervous loop. Tier swaps key on the DISPLAYED odometer
    value (heroes) / plain hp (enemies, no drums) — texture swaps on change,
    zero redraws. Texture policy: enemy tiers + bare-look hero sheets at
    boot; equipped looks materialize through ensureBattleArt at battle
    create — the same factory, cached by key, zero per-frame draws (the
    ADR-002 stance extended to look-keyed sheets; a full combinatorial boot
    sweep would have cost seconds for sheets most saves never wear).
  - **REAL DOORS:** DoorIndicatorSchema gains 'door'; drawInteriorDoor()
    closed + open (frame, two-panel door, brass knob, lit top rail; open
    shows the dark room with the door edge-on at the jamb) mounted IN the
    wall band above the zone, the S11 mat at its foot. Walking in swings it
    open (door_creak + 260ms hold) before the S7 whoosh; scene rebuild
    closes it on re-entry. rex_hall ×3 tagged 'door'; the validator enforces
    the LAW structurally: an interior facing-'up' zone tagged (or defaulting
    to) 'mat' fails naming map and zone — mats alone stay legal only for
    bottom-edge exits. Facades keep their ADR-019 drawn doors; presentation
    only, no Bible drift.
  - **SHIELD READS LIKE A SPELL:** pickAlly's candidate card LIFTS 2px
    (BustView.lift — box/labels/bust rise; drums NEVER move) under a gold
    frame pulse with the bust brightened; every other card dims; a
    "> {name}" tag rides the hand; B backs out; everyFrame polling + tap
    zones intact (ADR-024). The barrier family rebuilt: six hex panels FLY
    IN from the field corners (per-panel 'shield_panel' lock ticks), flash +
    closing ring on the lock — and a persistent hex PIP (drawHexPip, tinted
    cyan/paper) seats on the card's LEFT shoulder while shield/mirror turns
    remain: the first GOOD-status indicator, opposite the §A4.8 ailment row.
  - **SMAAAASH, IN GREEN, IN COMBO:** the banner is GRASS-ramp comic
    letters over four INK offset layers (the palette law holds), slamming
    5×→3× with a green radial burst + shake (BattleFx.smashBanner — texts
    allocated once). A smash opens a ~1.1s COMBO WINDOW (COMBO_WINDOW_MS):
    edge-triggered A presses ONLY — held A still means fast-forward, and the
    window itself drains on the skip-scaled clock (ADR-010 untouched). Every
    press re-swings the battler for 25% of the smash (comboHitDamage), rings
    the rising pitch ladder (combo_2…combo_8 presets), pops "N HITS!", capped
    at comboCap = min(8, 3 + Guts/40) TOTAL hits; a ring timer drains under
    the target at fx depth. Deterministic — presses in, hits out, no dice
    (ADR-029; verified to the digit) — and the total prints as ONE EB line:
    "Jay swung true! SMAAAASH!! x8 — 189 damage!" via damageEnemy's line
    override.
  - **AUDIO (ADR-006 presets):** swing_bat/swing_pan (cast-iron ring)/
    rifle_crack/swing_beads (rattle)/swing_fist, the combo_N pitch ladder,
    door_creak, shield_panel, breath. Ducking unchanged.
  - **FOUND & FIXED (latent since S11):** BattleFx.update's
    "timelines = timelines.filter(...)" discarded inner timelines that
    events pushed mid-tick (rings/panels froze at full alpha forever —
    surfaced by back-to-back guard rings). The drain now snapshots, ticks,
    and folds newborn timelines back in. Review smell: never reassign a
    list that running callbacks append to.
- **Verification:** validator + 164 vitest green — the three new gates
  (WEAPON_ART, STAGE_ANIM, wear/ENEMY_BATTLE_ART) + the door law all
  verified failing loudly (four axes); combo math (window/cap/ladder) and
  wear thresholds headless; tier-distinctness pixel-proven per enemy AND per
  hero bust/battler; Tick deflation asserted as vacated crown pixels. The
  full ADR-008 gauntlet ran live (pad muted, pump-driven): all four weapon
  swings on stage, every pose family, the maxed x8 combo by scripted taps,
  wear forced on both sides, the shield picker end-to-end, all three
  rex_hall doors, victory mid-stage, held-A compressing a whole bash into
  36 frames, zero console errors. 37 shots in `.shots/s11b_*`; log in
  docs/QA.md + ONE device row appended (existing boxes stay open).
- **Consequences:** new heroes inherit a battler by CAST spec alone; new
  §A8 equipment is an item + WEAPON_ART row + manifest pin in the same
  commit (the gate names any gap); new fx families must claim a STAGE_ANIM
  pose or the build fails; chapter enemies ship three authored wear tiers
  through ENEMY_BATTLE_ART or fail the sweep; every future interior north
  doorway is born a 'door' (the validator will say so); Prompt 15's phase
  machine can stage bosses through the same StageView seam if it ever wants
  a hero pulled forward; Prompt 42 profiles a stage that still pools every
  transient and draws nothing per-frame.

## ADR-033 — S12: the SPORT SHEET contract — bespoke athlete sheets off CharacterSpec

- **Date:** 2026-06-11
- **Status:** Accepted (Prompt S12 — the contract the spec demanded its own
  ADR for; the ADR-021 variant pattern at minigame scale)
- **Context:** THE CAGE needs ten athletes live at 60fps performing a sport
  vocabulary no existing sheet carries (dribbles, releases, dunk
  cinematics, swipes). ADR-021/022/025 made every face derivable from
  CharacterSpec; ADR-020's six rules bind all new art; ADR-002 wants
  boot-time generation but S11b's ensureBattleArt precedent put look-keyed
  sheets at use-time, cached.
- **Decision:**
  - **`src/spritegen/athletes.ts` — 32×40 × 25 frames** (`SPORT_FRAME` is
    the named contract; tests pin count and names): dribble idle ×2 ·
    dribble run ×2 · off-ball run ×2 · defensive slide ×2 · gather ·
    jumper rise + a READABLE RELEASE (arm at full extension, wrist
    snapped, fingertips in the light) · layup ×2 · THREE dunk cinematics
    ×2 each (tomahawk, windmill, two-hand hammer) · block leap ×2 · steal
    swipe · FALL (the ankle tax — dizzy stars stamped as pure light after
    outline, the ADR-021 idiom) · celebration ×2.
  - **Sheets author FACING RIGHT; the runtime mirrors with flipX.** There
    is no 'left' on a sport sheet — the battler precedent stated as law.
  - **One construction, every face:** a hand-authored SIDE_SKULL span
    table (ADR-022 — drawn dome, flat occiput, brow/nose pulled onto the
    right edge), ADR-025 hairTones with per-style side treatments (bob
    curtain, topknot bun, gray horseshoe, cap bill forward), ADR-023 face
    fields and builds (chub widens the torso). HEROES and WALK-ONS play
    as their CAST selves — canon clothes, Mia in the dress; OPPONENTS
    derive hashed specs (`deriveOpponentSpec`: skin/hair/eyes/mouth
    variety off the team-id hash — ADR-022's no-two-alike applied to 31
    fives) dressed in their TEAMS jersey ramp (tank with armhole scoops +
    trim bands).
  - **Generation is use-time, cached (`ensureAthleteArt`):** match start
    generates sheets for the ten (or six) actually playing — the
    ensureBattleArt stance; a 31-team boot sweep would cost seconds for
    fives most saves never meet. Athletes carry NO baked shadows (rule
    2): the scene floats one un-outlined shadow pip under every body and
    the ball.
  - **The ball + the chain net + the floor:** `drawBall` (7×7, two seams,
    one deliberate highlight), `drawHoopSide` (pole, weathered board,
    BENT rim — street canon — chain net with three ripple frames the
    scene swaps on swish/rim events), `drawCageCourt` (one big deliberate
    painting: flat asphalt per rule 1 with five hand-placed crack
    clusters + two tar patches, worn hand-painted lines that break
    mid-run per rule 4, faded key fills, the 2-point arcs at COURT.ARC_R
    exactly — geometry and paint share src/hoops/court.ts so the painted
    line IS the rule).
- **Consequences:** any future athlete (a guest five, a Ch.5 cameo) is a
  CharacterSpec away; vocabulary extensions append NAMED frames to
  SPORT_FRAME and the tests catch silent renumbering; S13's golfer sheets
  cut from this contract (the queue already says so).

## ADR-034 — S12: THE CAGE — deterministic streetball, the Classic, save v5 & THE STARTING FOUR

- **Date:** 2026-06-11
- **Status:** Accepted (Prompt S12 — the S10 cabinet law governs all
  minigames, ADR-029; user spec: an NBA-2K-grade minigame that stands
  alone, 5v5 first-class, mapped onto Brickton per ADR-028)
- **Context:** The SE vacant lot has been "FUTURE SITE OF MORE BRICKTON"
  since S1; ADR-016 froze the 1995 rng stream; ADR-015 demands registered
  save steps; ADR-017 manifests in the same commit; ADR-024/026 set the
  input law; ADR-029 the determinism creed; §A9's budget reads 4.5–6hr
  main + 3hr sides.
- **Decision:**
  - **The VENUE: the fence gains a GATE.** One fence tile swaps walkable
    via a plain `g.set` (consumes NO rng — the 1995 layout stays byte-
    identical), the `cage_gate` prop hangs over it, and a door zone
    carries Brickton (50,26) ⇄ the_cage. `the_cage` is an ADR-004 grid
    floating in the lot's weeds: chain-mesh ring tiles, painted court
    tiles, two backboards, bleachers with bench crowds BAKED per seed
    (the litSeed idiom), the chalked bracket board, the CALL YOUR OWN
    FOULS sign ("nobody ever has" — there is no foul system, by canon),
    and PERMIT, the announcer-commissioner CAST member (§A11 obsession:
    he has ranked every crossover since 1987; his detail hook is the
    whistle he has never blown). sign_lot amended: the future arrived,
    and it is a basketball court.
  - **THE SIM IS PHASER-FREE (`src/hoops/sim.ts`)** and HoopsScene is a
    renderer over it — vitest proves "same seed + same inputs = same
    final score" headlessly (tape-replay suites, byte-equal event logs)
    and the ADR-008 bot proved it again at scene level (two 3v3 runs off
    one snapshot: 2-7 / 8-15 / 12-21, trail-identical). Fixed 8.333ms
    quanta off accumulated dt; one seeded injectable rng per match (the
    Homesick pattern); shot outcomes roll AT RELEASE from (grade,
    distance, contest, rating). **NO RUBBER-BANDING:** no code path reads
    the score to bend a behavior — archetypes (rusher/sniper/post/hawk/
    balanced) play themselves off the TEAMS table, and AI shooters grade
    their releases off their sht rating through the SAME greenWindow the
    player faces.
  - **Street rules, both formats, one engine:** 1s and 2s (2 behind the
    arc — pointsFor() lives beside the painted line in court.ts),
    check-up after scores (3v3 checks at the top; the 5v5 equivalent is
    the take under your own rim — the full-court reading that keeps
    transition offense and fast breaks alive), and the fence is LIVE (no
    out of bounds in a cage; the ball plays off the chain-link). 5v5:
    four 5-minute quarters on a running clock, a 24-second shot clock
    PERMIT counts out loud from 5, iron resets it (street), quarter
    breaks + a halftime chalkboard beat, 2-minute OTs until somebody
    wins; a release that beats the horn counts. 3v3: FIRST TO 21, WIN BY
    2, no game clock — the score self-polices.
  - **Two buttons, honest (§B1's overlay untouched):** OFFENSE — B tap =
    DIRECTIONAL pass into the held d-pad cone (±55°, leads the cutter;
    pass-lane picks roll at launch), B hold = turbo, A hold = gather +
    the SHOT METER (GREEN half-width = f(sht, distance, contest), clamped
    0.022–0.16 around 0.76; GREEN IS MONEY at 0.99), A at speed near the
    rim = the contextual finish (dunk for dnk ≥ 40 — three cinematics
    rolled seeded — else layup; contested dunks get STUFFED), double-tap
    a direction = crossover (seeded ankle-break vs the defender's
    commitment; the victim eats the FALL frame and PERMIT ranks it).
    DEFENSE — you hold the defender nearest the ball (hysteresis;
    auto-switch on drives and passes), A = timed block leap (beats a
    release outright), B tap = steal swipe (whiff = beaten 720ms), B
    hold = turbo slide. TEAMMATE AI holds spacing spots, cuts baseline
    when the handler drives, and CALLS FOR IT when open. A loose ball
    triggers THE SCRAMBLE: each side's nearest free body chases (found
    live by the bot — a dead ball once had no chaser; team 0's pick
    excludes the user's athlete so an AI teammate always covers).
  - **THE BRICKTON CLASSIC (save v5 — tournament state IS save data):**
    32-slot single elimination, the party + the 31 TEAMS (§A11 local
    color; tier curve 8/8/7/5/3 pinned; Permit's Nephews seed fifth,
    straight year, unrelated). newBracket seeds weakest-first into the
    near half, title-grade into the far bottom; between rounds every
    other pairing sims SEEDED off the bracket seed (tier-honest, no
    charity); the chalk board redraws from `results` alone. A live match
    CHECKPOINTS AT QUARTER BREAKS — `hoops.match {opponent, round, seed,
    quarter, scores, clockMs}` — and **the cage auto-writes the active
    notebook** (GS.saveTo(activeSlot)) at every break and tally: process
    death costs at most the quarter in progress (verified: reload →
    Continue → "Pick up the Classic game (Q2)" at 30-23). Quarter rng
    re-seeds per period (seed ^ quarter·7919) so a resumed Q3 IS the
    live Q3 — vitest pins the equivalence. The v4→v5 step is REGISTERED
    (ADR-015); old saves backfill the clean slate (the v3 empty-ledger
    stance). A loss tears the bracket up — single elimination means
    exactly that (register again; PERMIT kept the stub). Walk-offs
    forfeit: bracket dies, nothing pays — the S10 eject rule. YOUR FIVE =
    the party first (the heroes are the stars), then named WALK-ONS off
    the bench table in order — established §A11 locals (Slippers, Crumbs,
    Exact Change, The Critic) with tiny authored stat lines; Chad guests
    pre-Milo (unlessFlag milo_joined, validator-pinned); walk-ons never
    touch the PARTY.
  - **REWARDS (validator-pinned tables):** every match pays EXP through
    the Prompt-18 flow — applied in the tally, level-ups announced
    post-game with stat tables + ability-unlock lines — scaled by format
    and depth: pickup 130/55 win/loss (forever — the anytime XP run),
    Classic rounds 240/330/440/580/760 with 0.4 on a loss, plus seeded
    goods drops (foods/colas off the match rng). FIRST title pays **THE
    STARTING FOUR** — §A8's first 'arms' gear, one wielder-tagged piece
    per hero (Champ's Sweatband Guts+6 · Victory Scrunchie Speed+6 ·
    Shooter's Sleeve Speed+7 · Iron Wristguard Guts+7) — handed at
    PERMIT with hands-full BLOCKING and the `hoops.handed` raincheck
    ledger (zero missables, §B4; verified blocked at 14/14, completed on
    retry). Repeat titles pay $350 + goods, cash IN HAND (a street pot
    never routes through Dad's ledger). NOT a §A10 quest: the canon
    sixteen stay sixteen — no caller, no journal row.
  - **The 'arms' seams, wired the S10 way:** `ItemDef.speed/guts` with
    the kind-'arms'-⇔-exactly-one-stat schema refinement; `heroSpeed`/
    `heroGuts` read-throughs in battle/formulas.ts beside heroDefense/
    heroLuck — battle (run chance, SMAAASH, the combo cap, pray weights,
    guts survival), STATUS (Speed/Guts lines + an Arms row), and THE
    CAGE's own court ratings all read through them (the gear makes you
    better at the game that awarded it); `equipArmsDelta` names the stat
    THE PIECE carries and `confirmEquip` previews it ("Speed up by N!" /
    "Guts up by N!"). **Amendment to ADR-032:** its arms→torso art
    mapping was provisional with zero arms items shipped; arms gear lands
    as 'trinket' DRAWN ICONS (a 2px wristband cannot read on a 28px
    battler arm) — validator + the vitest mirror updated; equipment
    visibility for arms = icon + STATUS + preview.
  - **§A9 time-budget drift (Bible amended per Appendix rule 6):** a full
    Classic title run is ~5 four-quarter games ≈ two hours BY DESIGN —
    optional long-form content beyond the +3hr side-quest line, built to
    be left and returned to (that is what the v5 checkpoints are for).
  - **Input-law nuance (ADR-026 note):** hardware back still taps B, and
    in live play B is a GAME button (pass/steal) — the pause path is
    START (resume / walk off). A phone back press mid-match costs a
    swipe, never an exit.
  - **Driver law (ADR-008 addendum, learned live):** scripted sessions
    hold `game.loop.sleep()` END TO END — a visible tab's real rAF frames
    interleave with pump's virtual clock, and once real time runs ahead,
    navTick-style cursor cooldowns lock out against a future
    scene.time.now. The S10 safe-pick rule gains a corollary: KeyZ-mash
    only when row 0 is the row you want — PERMIT's ask aims with
    ArrowDown, verified by reading the hand cursor's y.
- **Verification:** validator (31 fives + tier curve, walk-on gates, the
  STARTING FOUR pins, reward tables, venue pins, the sign_lot amendment,
  HOOPS_TEXT sweeps via HOOPS_FILL_TOKENS — three axes verified failing
  loudly) + 196 vitest (sim tape-replay determinism, dt quantization,
  grading windows, GREEN=money, win-by-2, the 24 with PERMIT's count,
  quarter re-seed resume equivalence, OT-on-tie, the bracket title run,
  Chad's gate, hero ratings reading through arms, v4→v5 + v1→v5 chains,
  checkpoint round-trip); the full ADR-008 gauntlet in docs/QA.md (gate
  walk, 3v3 to 21 twice byte-identical, Q1 to the horn 30-23, checkpoint
  + process death + resume, one-frame taps at 8.33, handoff block/retry,
  walk-off, the scramble fix); fresh debug APK.
- **Consequences:** S13's LINKS inherits the whole shape (own scene,
  seeded Phaser-free sim module, sport sheets, a v-step only if flags
  can't carry it); any new minigame copies the HoopsSim split — pure sim,
  renderer scene, vitest determinism FIRST; new Classic entrants are a
  TEAMS row + a tier-curve manifest bump in the same commit; future arms
  gear is an item + trinket icon + manifest row; Prompt 42 profiles a
  scene that pools its popups and generates ten sheets once per match.

## ADR-035 — S12b: AWAKENINGS — the old light arrives as story moments (+ the casting-distance fix)

- **Date:** 2026-06-11
- **Status:** Accepted (user direction mid-S12 review: "at the start we
  shouldn't have any psi abilities... each one needs to be meaningful and
  very powerful and feel like a large jump forward... learn them at a
  certain trigger point in the game that allows you to continue, same with
  items" — plus the catch "Vibe Surge is just a normal bash attack")
- **Context:** §A3 granted Vibe at L1 (Surge, Fire, Lifeup by L3), so the
  game's most magical idea arrived as a menu row nobody earned. Separately,
  S11b's stage walked EVERY actor to arm's reach of the target (the bash
  approach), so a point-blank cast with a brief arm-raise read exactly like
  a melee hit — the reported bug was real and it was STAGING, not dispatch
  (registry, STAGE_ANIM, and the timeline were all correct).
- **Decision — the casting-distance fix (the bug):**
  - `StageView.enter` gains a `standoff` param: Bash keeps arm's reach
    (12px); casts/aims/prayers/throws stand at CASTING DISTANCE (72px) —
    the magic travels, the caster doesn't. The surge timeline rebuilt to
    carry the read at range: a CHARGE at the caster's raised hands (motes
    converge, three swelling pulses), the old light TRAVELS the field as a
    burst train, then starburst rings escalate per tier (α two → Ω the
    sky) with a tier-scaled shake. Verified live: actor at x128 vs the
    Tick at x200, charge → travel → rings → "67 damage!".
- **Decision — AWAKENINGS (the system):**
  - **Heroes start with ZERO Vibe.** Abilities arrive at STORY MOMENTS —
    scene-staged, §A11.2-sincere, each one an event. `src/data/awakenings.ts`
    holds the table (schema'd per ADR-017: id, hero, ability, flag,
    dialogue, toast); the grant is a FLAG on the save; availability =
    level unlocks ∪ awakened flags (`availableAbilities` in data/heroes.ts
    — battle Vibe/Gadgets lists and the menu VIBE page read THIS; level-up
    announcements still read the unlock table alone). The pre-awakening
    Vibe row prints "searched for the old light... not yet."
  - **Ch.1 ships three** (validator-pinned both directions): `old_light` —
    Glint's crater prophecy hands Jay VIBE SURGE α one beat before the
    Tick, and the Surge SEVERS THE LATCH (§A6 amended: Fire and Salt stay;
    the awakening is the fight's diegetic tutorial — "allows you to
    continue" made literal, with the salt as the no-softlock floor).
    `last_spark` — the porch: Glint's spark settles into Jay as LIFEUP α
    beside the GLINT'S SPARK item the beat already granted (the
    items-at-trigger-points pattern, now policy: progression gear is
    handed at story beats, never floor-found). `first_listen` — Mia
    touches the Locket in the holding room and hears Heartlight #1: VIBE
    FIRE α ("hears the Embers sing," made literal). PRAY stays innate at
    L1 — her faith is who she is, validator-pinned.
  - **Levels spaced, tiers steepened:** Jay opens Hypno α L10 → Shield α
    L14 → Surge β L18; Mia Freeze α L12 → Magnet L15 → Fire β L17. The
    signature lines leap ~2.6× α→β (Surge 55/143/231/341, Fire
    48/125/202/298) so every tier is a jump forward. The §A3 amendment
    sketches the chapter arc (one awakening per chapter's emotional
    center; Teleport α/β were always the precedent; Dorin's Trial IS his).
  - **Save v6, registered (ADR-015):** the v5→v6 step backfills awakening
    flags from the story flags those scenes set (met_glint → Surge,
    zapper_done → Lifeup, faye_joined → Fire) — an old save keeps exactly
    the abilities its story already earned, never its levels.
  - **The beat helper:** `OverworldScene.awakeningBeat(id)` — flash,
    sparkle, the §A11 pages, the flag, the levelup jingle, the vars()
    toast. Three call sites (crater, porch, join); chapter sessions add
    theirs and extend the validator manifest in the same commit.
- **Verification:** validator (awakening manifest both directions, no
  double-path, flag uniqueness vs quests, §A3-amended pins — the
  double-path axis verified failing loudly) + 199 vitest (availability
  math: pre-crater Jay = [], flag grants Surge; Mia L6 = pray alone until
  the Locket; v5→v6 backfill from story flags; the v1→v6 chain). Live via
  the ADR-008 driver: fresh save → the hill → the crater trigger →
  prophecy → AWAKENING (flag flipped at press 18, toast + jingle) → the
  Tick latched Jay (tether visible) → Vibe list now carries Surge → cast
  → **tethered true→false** (the sever rule live), PP 10→0. Driver lore:
  HMR splits module instances — `window.mfGS` can go stale against the
  scenes' GS; full-reload before any flag-reading leg.
- **Consequences:** every future ability lands as an awakening or a
  SPACED level unlock, never a freebie; chapter prompts (28–34) pull from
  the §A3 amendment's arc and pin their manifests; the Tick fight now has
  three severs (Surge/Fire/Salt) and the crater teaches the first; the
  stage's standoff param is the staging law (casters at range — a
  reviewer can reject point-blank casts by this entry).
