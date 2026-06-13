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

## ADR-036 — S12c: CAGE 2.0 — the range law, timed defense, the over-head meter, the package & the rebindable pad

- **Date:** 2026-06-11
- **Status:** Accepted (Prompt S12c — the control/feel/presentation overhaul
  of THE CAGE; ADR-029/033/034 law stands: deterministic Phaser-free sim,
  vitest first, manifests same-commit; ADR-024 input law throughout)
- **Context:** A live bug had the AI banking shots from the opposite end —
  root-caused to three compounding holes: greenWindow() clamped to a 0.022
  FLOOR at any distance, makeChance('green') paid 0.99 distance-blind, and
  aiShoot had no range gate, so shot-clock desperation could roll green from
  anywhere. Blocks/steals keyed on proximity alone; the meter lived at the
  HUD's bottom with the green mid-bar; B did triple duty (pass/turbo/steal);
  the cage had no tutorial and one camera.
- **Decision — THE RANGE LAW (the fix):** every athlete owns an EFFECTIVE
  RANGE off sht — `effectiveRange = ARC_R + (sht−50)·1.2`, clamped
  [ARC_R·0.85, ARC_R·1.35] (RANGE beside TUNE). The GREEN window SHRINKS
  WITH DISTANCE inside range with a STEEPENED (quadratic) distance term and
  CLOSES TO ZERO at range — no green exists beyond it, no floor anywhere.
  Non-green make% decays hard past range (≤RANGE.DECAY_CAP at the line,
  ZERO at 1.5×); 'brick' pays zero everywhere (way off = ZERO). AI shot
  selection is RANGE-GATED (d ≤ 0.96·range); the lone exception is the
  shot-clock ≤1s desperation heave — released without a gather at brick
  grade, announced ('heave' event, PERMIT files it), and mathematically
  unable to drop from deep. Pinned: window at range edges, the zero beyond,
  steepening differences, and an 80k-tick tape on two seeds asserting NO
  make beyond 1.2× the shooter's range ('score' events now carry by + dist).
- **Decision — THE METER, REBUILT:** the meter renders OVER THE SHOOTER'S
  HEAD (world-space, follows the athlete) and fills toward the TOP where
  the GREEN sits AT THE END — window [1−2·half, 1]; hold A, release inside
  = green (100%); below the window the make% falls off by the METER table
  (slightly off ≈60%, far ≈20%, way off ZERO — grades renamed
  green/slight/far/brick); overfilling past the top auto-misses. The window
  is LIVE while holding (defenders closing and range both shrink it; the
  zero-window state draws NO green band — an honest HUD). DUNKS get their
  own meter (DUNK_METER, window off dnk): green = the slam; a missed meter
  is a rim-hang FLUB — or STUFFED when somebody contested the summit.
  Layups stay the meterless safe finish. AI shooters run the SAME meter:
  aiShoot enters the gather and PLANS a release frac off sht skill
  (planFrac), releasing when the fill reaches it — which is exactly what
  makes timed blocks readable against them, and what makes pump-faking
  emergent (jump early and the shooter just keeps holding).
- **Decision — TIMED DEFENSE (exported tables, vitest-pinned):**
  - **BLOCK_TIMING:** a block keys on the leap's START vs the RELEASE — the
    leap's peak (stamped at takeoff: vz/g) must bracket the release within
    ±120ms: base 0.10 poorly timed → 0.65 perfectly timed, +(dfn−sht)·0.004,
    scaled by reach/proximity, clamped [0.05, 0.85]; landings carry a 240ms
    recovery (no bunny-hopping). Goaltending rules the descent: near the
    iron, pre-apex contact is a LIVE legal block; contact on the way DOWN
    is a violation and THE BASKET COUNTS — PERMIT's call is canon and
    validator-pinned verbatim: "THAT WAS COMING DOWN. WE ALL SAW IT."
  - **STEAL_TIMING:** the handler has VULNERABILITY WINDOWS — dribble-move
    startup (the first 150ms; MOVES.STARTUP_MS === STEAL_TIMING.WINDOW_MS
    is a validator-pinned equality: the risk IS the price of the sauce),
    the gather's first beat, and pass release (a defender mid-swipe at the
    passer's hip picks the release itself). In-window swipes steal at 0.50
    base vs 0.08 neutral, +(dfn−handlerSht)·0.0035, hawk +0.08, clamp
    [0.04, 0.70]; a whiff still means BEATEN (720ms). Both reads surface in
    the HUD: "TIMED!" pops on any window-hit attempt, either outcome
    ('timed' event). Drill-mode integration tests prove both end-to-end
    (timed leaps out-block early hops ≥1.6× across 24 seeds; window swipes
    strip at the timed rate).
- **Decision — THE DRIBBLE PACKAGE:** Y alone = SPIN, Y+lateral =
  BEHIND-THE-BACK, Y+toward-defender = BETWEEN-THE-LEGS (double-tap stays
  the quick crossover). Each move's startup-end rolls ONE seeded ladder vs
  the nearest set defender's commitment (ANKLE_TIERS splits of ankleChance):
  STUN (wobble, 380ms slow) → TRIP (stumbles a step, 620ms) → the FALL
  (flat, 950ms — the S12 frame is the ladder's floor), each with frames,
  popups, and PERMIT pools; completed moves burst out the far side. PASS
  STYLES pick by context with distinct flights: chest; BOUNCE (dives under
  lane hands — pick chance ×0.45, flight ×1.35, floor-kiss sfx at the
  midpoint); BEHIND-THE-BACK (target behind the passer's facing).
- **Decision — FOUR BUTTONS + THE BINDING TABLE:** InputBus grows X and Y
  (keyboard KeyC/KeyV; pad buttons 2/3 — pad B NARROWED from 1|2 to 1,
  button 2 is X now). Hoops mapping: A=SHOOT, B=PASS (tap, instant — the
  old B-hold-turbo dance is gone), X=SPRINT (dedicated), Y=DRIBBLE MOVE;
  defense A=timed leap, B=swipe, X=sprint slide; START pauses (back=B still
  costs a swipe mid-match, ADR-034's nuance stands). UIScene's touch
  overlay grows X/Y on the thumb arc VISIBLE DURING HOOPS ONLY
  ('mf-hoops-open'/'mf-hoops-closed'). SETUP → CONTROLS rebinds the
  SEMANTIC actions press-to-capture (the pressed source picks the device:
  key or pad button), persisted DEVICE-LOCAL ('meteor-falls-controls', the
  Sound-preference pattern — never save data), reset-to-defaults row; the
  RPG and the cage both read through the table by construction (every read
  already goes through held/justPressed/dir). TickInput reshaped to the new
  surface (aHeld/aPressed/aReleased · bPressed · xHeld · yPressed).
- **Decision — PRESENTATION + THE SCHOOL:** SPORT_FRAME grows 25 → 39 by
  APPENDING (indices 0–24 frozen, the bust-sheet precedent): spin ×2 (one
  back-turned — hair mass over the face columns), behind-back ×2,
  between-legs ×2, stun ×2 (dizzy stars as pure light after outline), trip,
  pass anims ×3, release FOLLOW-THROUGH (the gooseneck), landing RECOVERY
  (knees soft, read off the leap cooldown) — validator pins count + names.
  CAMERA TOGGLE in the pause menu: SIDE or BEHIND — the pseudo-3D read
  (perspective floor painted THROUGH behindMap so the lines ARE the
  projection; depth-scaled side sprites; fixed seat on the attacked rim),
  persisted device-local ('meteor-falls-cage-cam'). The user asked for TRUE
  3D models in this mode — that conflicts with ADR-002 (palette-by-
  construction, zero binary assets) and ADR-020; S12c ships the best
  pre-rendered pseudo-3D and THIS ENTRY records the decision point: a
  true-3D cage (a Three.js layer) is its own future prompt if the author
  calls for it after seeing this one. TUTORIAL: PERMIT'S SCHOOL on first
  cage visit (skippable — declining sets the flag too; cage_tutored), a
  drill-mode sim (visitors stand down / run 'shoot'/'moves' scripts) whose
  8 lessons each advance ON THE DEED: move/sprint → the meter + green
  release (the prompt teaches the range law: step inside the arc) → the
  rim finish/dunk meter → all three package moves → two passes → a TIMED
  block → a window steal → THE GOALTEND WARNING.
- **Verification:** validator (cage2 section: SPORT_FRAME contract, range/
  meter/timing pins, the goaltend line, the syllabus) + 213 vitest (range
  law suite incl. the 80k tape ×2 seeds + the heave construction, meter
  grades, both timing curves, drill-mode block/steal/goaltend end-to-end,
  determinism replays on the new input surface); the full ADR-008 gauntlet
  in docs/QA.md ran live at pump(n, 8.33): the school end-to-end by the
  bot, one 3v3 to the horn with every new move performed, the camera
  toggle (shot s12c_camera_behind), the rebind capture (A→KeyJ drove A,
  persisted, reset restored). Zero console errors. Browser loop untouched;
  android:apk untouched (no native-shell changes).
- **Consequences:** any future shot-like mechanic derives its window
  THROUGH effectiveRange (no floors, ever); new dribble moves append
  SPORT_FRAME rows + claim a steal window or fail review; new semantic
  buttons enter through the binding table (never raw key reads); S13's
  LINKS inherits X/Y availability, the rebind table, and the over-head
  meter idiom; the BEHIND projection (behindMap) is the house pseudo-3D
  seam if other minigames want depth.

## ADR-037 — S13: COSTA ESTRELLA LINKS — nine holes, the 3-tap meter, the flags-borne Invitational & THE SUNDAY SET

- **Date:** 2026-06-11
- **Status:** Accepted (Prompt S13 — the golf twin of S12 under the S10
  minigame law: own scene, everyFrame input, back = B, seeded injectable
  determinism, replayable forever, once-only specials, manifests + bot
  recipe + QA row in the same commit)
- **Context:** The S10/S12/S12c law stack governs every minigame; ADR-015
  prefers flags over save steps; ADR-017 demands manifests beside content;
  ADR-033's sport-sheet contract was built to be cut from ("S13's golfer
  sheets cut from this contract — the queue already says so").
- **Decision — THE VENUE (the canon call):** a clifftop resort NORTH OF
  PUERTO SOL — §A5 Ch.2's Spanish-colonial port covers the "Spain" ask;
  Mauna Lani (Ch.8) was the alternate and remains available if the author
  prefers after playing it (this entry is the decision point). The module
  is COMPLETE AND STANDALONE now (the Sprite Lab precedent): a dev title
  row reaches `costa_estrella`, and the world door is AUTHORED FOR PUERTO
  SOL as the exported `COSTA_DOOR_FOR_PUERTO_SOL` — Prompt 28 wires it in
  ONE LINE (it is not placed: door targets must exist, the validator's
  law). The tease: Brickton's bus-stop corner grew a travel poster on a
  FRESH rng stream (2095 — the ADR-016 rule's third application; 1995 and
  2077 stay byte-identical) with a sign read.
- **Decision — THE COURSE:** nine authored holes in the HOLES table
  (src/links/course.ts; schema'd, validator counts NINE and sweeps every
  name + plaque): par 36, the §A11 names one obsession apiece (THE
  HANDSHAKE, TWO PUTTS OF SURF, THE BEACH THE STAFF DENY, THE TERRACES,
  THE GOAT'S COMMUTE, THE SEA STACK, THE LONG SIESTA, VENDOR'S ALLEY,
  SUNSET). Grids are RLE-authored rows (hand-written, reviewable, expanded
  by ONE shared function) at 16px tiles, 2px per yard; the spec's
  signatures are validator-pinned (hole 2 carries pure surf rows; hole 6's
  green rings in water). Terrain: T/F/R/S/W/G/C with LIES taxes (carry,
  roll, accuracy window). The hole texture painter (spritegen/golfers.ts)
  draws THROUGH the same grid — surf foam at every coast, WIDE mow bands
  (rule 4), warm plugged sand, the fringe, and SLOPE ARROWS stamped from
  hole.slope EXACTLY: the arrows are honest because they and the putt
  physics read one vector.
- **Decision — THE SIM (src/links/sim.ts, Phaser-free, cabinet law):**
  fixed 8.333ms quanta; ONE seeded rng per round whose only customers are
  WIND (drawn once, announced by the caddy in putts — windPutts) and
  cliff kicks; everything else is pure (inputs → strokes). THE 3-TAP
  METER: A starts; the power needle BOUNCES (rise to the cap, fall — die
  at zero and the swing cancels without a stroke); the second tap sets
  power; the needle falls and the third tap sets accuracy against a
  SHRINKING perfect window (club.accWindow × lie; floor −0.3 auto-swings
  the big push). Accuracy error deflects the line (PUSH_RAD) and CURVES
  the flight (draw/fade); after-touch rides the held d-pad mid-flight,
  capped; loft buys apex and wind exposure. Landing: water = splash, one
  penalty, drop at the LAST DRY point under the flight; sand plugs; cliff
  kicks (seeded); grass converts momentum to roll, greens add the slope
  vector, and the cup swallows anything within 5px under 70px/s. Inside
  30y the CHIP meter takes over (power tap, lofted hop, tiny roll); on
  the green the PUTT meter is the power tap alone. The bag is a data
  table (8 clubs, carries descending, windows tightening at the long end)
  with auto-suggest by distance; B cycles freely.
- **Decision — THE INVITATIONAL (flags carry it; no save v7):** 32-player
  match play — five 3-hole matches (sudden death past three all square)
  vs 31 GOLFERS (§A11 names; tier curve 8/8/7/5/3, validator-pinned)
  whose hole scores roll HONESTLY from (acc, agg, par, rng) —
  golferHoleScore never reads the player (the no-rubber-banding law on
  grass). ADR-015's prefer-flags clause is exercised: links_seed +
  links_round + links_titles + links_played (+ links_bracket_live and the
  links_handed_<hero> rainchecks) ARE the tournament — linksField/
  linksEntrants/linksNextOpponent recompute the field and every other
  pairing from (seed, round) deterministically, vitest-pinned. The scene
  saves the active notebook after every match, so a full Invitational
  (~20–30 min) survives process death at match granularity. Walk-offs
  forfeit (the S10 eject rule): the bracket flags clear, nothing pays.
- **Decision — REWARDS (validator-pinned):** stroke rounds pay EXP
  FOREVER through the Prompt-18 flow — strokeExp: 150 even, +25/under,
  −12/over, floor 40 — plus one seeded clubhouse drop; Invitational
  rounds pay 180/240/320/420/560 (loss 0.4×). The FIRST title pays THE
  SUNDAY SET — §A8's 'other'-slot expansion (Bible amended per Appendix
  rule 6): Sunday Visor (Jay, Luck+7), Sunday Glove (Mia, Luck+6), Lucky
  Tee (Milo, Luck+6), Caddy's Marker (Dorin, Luck+7) — wielder-tagged
  charms reading through the S9 heroLuck seam with stat-aware previews,
  drawn trinket icons through the S11b WEAPON_ART gate, handed at the
  caddy PERMIT's way: hands-full BLOCKS, per-hero raincheck flags, zero
  missables. Repeat titles pay $400 IN HAND (resort prizes never route
  through Dad's ledger). NOT a §A10 quest — the sixteen stay sixteen.
- **Decision — THE SHEETS + THE CAST:** GOLF_FRAME (11 frames, 32×40,
  facing right) is CUT FROM the ADR-033 sport-sheet contract — athletes.ts
  exports drawProfileHead (extracted, byte-equivalent) so golfers wear THE
  SAME heads; poses: address · backswing ×2 (the power tick) · strike ·
  follow-through ×2 · fist-pump · the universal sad putter slump ×2 ·
  putt address/strike. Heroes golf as their CAST selves (use-time
  generation, ensureLinksArt — the ensureAthleteArt stance). FITO, the
  caddy, joins CAST with exactly one §A11 obsession — he measures the
  entire world in putts ("that cloud? two putts away, señor") — a towel
  detail hook, green reads, club hands, and the §A11.2 sincerity played
  STRAIGHT on the 9th tee at sunset (caddySunset, validator-pinned to
  stay unfunny).
- **Verification:** validator (links section, three axes verified by
  construction during bring-up: a 19-wide RLE row, off-tile pins, and the
  WEAPON_ART gate all failed loudly before fixing) + 228 vitest (RLE
  expansion, geometry, bag/lies monotonicity, wind determinism, the meter
  bounce-cancel + floor push, the splash penalty + dry drop, golfer-curve
  honesty, bracket derivation, strokeExp pins, and THE BOT HOLE: the
  documented driver line plays hole 1 tee-to-cup twice byte-identical and
  closes all nine). Browser legs in docs/QA.md (resort, caddy gate,
  stroke hole 1 in 2 strokes at scene level, the match card vs the
  tier-1 gate, flags lit/cleared, zero console errors). Browser loop and
  android:apk untouched.
- **Consequences:** Prompt 28 wires the resort with one pushed door (+ a
  return door at Puerto Sol); future minigames keep inheriting the
  HoopsSim split (pure sim, renderer scene, vitest first — twice proven
  now); new holes are an RLE block + manifest bump; new golfers are a row
  + the tier curve; the golfer sheet is the template for any future
  sport-sheet cut (the head is shared by export, not by copy); Mauna Lani
  stays one ADR away if the author moves the venue.

## ADR-038 — S12d/S13b: THE RESPONSIVENESS LAW — lossless edges, the latch-backed release, the finish meter & the make/miss reads

- **Date:** 2026-06-11
- **Status:** Accepted (user playtest report: "the shoot button doesn't
  always trigger properly... when I release it doesn't seem to release
  properly in a responsive manner every time"; "hard to tell when the ball
  goes in"; "dunks and layups should be easier to generate and then you
  just have to time them correctly"; golf "must be clean responsive
  controls with similar skill elements")
- **Context — the bug was REAL and it was the accumulator:** both minigame
  sims quantize accumulated dt into fixed 8.333ms ticks (ADR-029). A frame
  shorter than one quantum ran ZERO ticks — and the old advance() simply
  DISCARDED that frame's input object, edges and all. At 120Hz a frame is
  ≈8.3ms, a hair UNDER the quantum, so roughly every other frame ran zero
  ticks: half of all shot presses and meter releases silently vanished.
  This is ADR-024's dropped-press class reborn one layer down — the input
  bus latched edges per FRAME correctly, and the sim then dropped them per
  QUANTUM. A second hole: the scene derived the release edge from held-set
  diffs (prevA && !a), which a release-and-re-press inside one frame (the
  quick pump) can never see.
- **Decision — edges are LOSSLESS, end to end (the law):**
  1. **Sim accumulators CARRY edges.** HoopsSim.advance and GolfSim.advance
     stash any un-consumed press/release edges and fold them into the next
     frame's FIRST tick. A zero-tick frame can no longer eat an input.
     Pinned headlessly: a press inside a 4ms frame still opens the gather;
     a release inside a 4ms frame still fires the shot; a golf tap inside a
     4ms frame still starts the meter. Verified live at pump(n, 4.1) — the
     all-sub-quantum regime — 10/10 one-frame presses opened, 10/10
     one-frame releases fired.
  2. **InputBus gains the RELEASE latch** (the ADR-024 press latch's
     mirror): keyup and touch-lift transitions latch into releaseQueued;
     update() unions them with held-set diffs into `justReleased(b)` — one
     frame per physical release, even when the button was re-pressed before
     the frame closed (pump-fakes read true). UIScene's touch release path
     latches through INPUT.releaseBtn. Documented caveat: chording two keys
     onto one action and lifting one reads as a release — the event IS a
     bound-key release; nobody plays chords on one action.
  3. **Scenes read edges from the bus, never derive them**: HoopsScene uses
     INPUT.justReleased('A') (prevA bookkeeping deleted). A press+release
     inside ONE tick (the fastest possible flick) releases the jumper that
     same tick at near-zero fill — honest and instant, never swallowed.
  Review smell, stated for every future sim: an accumulator loop that
  takes an input object must either run ≥1 tick or CARRY the edges.
- **Decision — THE FINISH METER (dunks AND layups: easy to generate, timed
  to make):** the rim-finish trigger drops its sprint gate — MOVING inside
  FINISH_RANGE_PX (165) + A starts the finish (dunks keep the dnk≥40 gate;
  everyone else lays it up). Layups now run the SAME hold-release finish
  meter as dunks with the FORGIVING window (LAYUP_METER: base 0.11, sht-
  scaled, clamp [0.05, 0.17] — validator pins layup > dunk at par): green
  is MONEY (counts as a green make), off the window the make falls away
  fast (OFF_P0 0.8 − off·2.4 − contest·0.25), held-all-the-way-through is
  the overfill miss you earned. AI layups plan their release frac off sht
  through the same window (the no-rubber-banding law). The meter band
  colors by kind: GRASS jumper · GOLD dunk · CYAN layup.
- **Decision — THE MAKE/MISS READS:** every bucket pops "IN! +1" /
  "FROM DEEP! +2" at the iron and flashes the scoreboard for a beat; every
  dead shot pops "NO GOOD." (or "AIR.") where it died — sim emits a 'miss'
  event from rim-outs, airballs, and layup misses. (The user's 3-point
  question answered itself in canon: 3v3 street scores 1s and 2s — the
  deep make now SAYS it's the deep make.)
- **Decision — golf parity (the skill elements ask):** the same lossless-
  edge carry lands in GolfSim.advance (the 3-tap meter cannot eat taps),
  and the third tap gains the cage-green verdict: 'stroke' events carry a
  StrikeQuality — PURE inside the shrinking window (green sfx + "PURE!"
  popup at the ball), early reads "DRAW.", late reads "FADE." — the same
  one-frame timing read a green release gives in the cage.
- **Verification:** 237 vitest + validator (LAYUP_METER pins, finish-range
  pin, the read keys both games) — new suites: the responsiveness law
  (zero-tick press/release/tap carry, same-tick flick), the finish meter
  (no-sprint trigger, window clamps, green-is-money end to end across 6
  seeds, hold-through = miss), golf edge-carry + PURE/pull verdicts. Live
  via the ADR-008 driver: 10/10 sub-quantum presses + releases at
  pump(n, 4.1); a walk-up layup triggered, its cyan meter held and
  released green → "IN! +1" + board flash, a mistimed one → "NO GOOD."
  (shots .shots/s12d_*); a pure tee shot on hole 1 read "PURE!" and left
  13y for the chip. Zero console errors.
- **Consequences:** every future minigame sim inherits the carry rule (an
  accumulator that can run zero ticks must stash edges — reviewers reject
  by this entry); justReleased is the ONLY way scenes read release edges;
  finish attempts are now a timing read everywhere the rim is, which the
  tutorial's lesson 3 already teaches (its prompt updated); the QA recipes
  in HoopsScene's header carry the new finish line.

## ADR-039 — S14: THE GILDED GRIN — the phase machine, picnics, hospitals & Chapter 2 complete

- **Date:** 2026-06-11
- **Status:** Accepted (Prompt S14 — Bible Prompt 28 bundled with Prompts 15,
  23, 25; the §A6 Ch.2 chapter shipped whole with the three systems it
  cannot stand without)
- **Context:** Chapter 2 needs the boss phase machine (the Grin IS a form
  swap), the picnic system (§A4.5 places tables BEFORE dungeons), and real
  hospitals (a pyramid wipe with revive-all-at-home is no economy at all).
  Standing law throughout: ADR-012 seeded cities, ADR-014 flag-gates +
  fade-restart, ADR-015 registered save steps, ADR-017 manifests
  same-commit, ADR-024/038 input law, ADR-029 determinism, ADR-035
  awakenings.
- **Decision — THE PHASE MACHINE (Prompt 15, `src/battle/phases.ts`):**
  - A Phaser-free interpreter over `BossScriptDef` data (z.infer, ADR-017):
    triggers `hpBelow(frac)` (once, through the threshold) ·
    `turnCount(n, every?)` (cadences) · `bothSummonsDead` (repeatable
    refill) · `riddleAnswered(ok)` · `prayTierAtLeast(tier)`; actions
    `setForm(id|'cycle')` · `summon(enemy, n)` · `healSelf` · `scriptLine`
    · `stealEquipped`/`returnStolen` · `setSpeedMul` (≥2 = an extra action
    per round) · `endBattleMercy` — plus the two the §A6 riddle
    consequences require: `stunSelf(turns)` ("skip its first 3 turns") and
    `partyStatus(status, turns)` ("party starts Crying"). The runner rolls
    NO dice (ADR-029): triggers in, actions out, proven headlessly in
    phases.test.ts for EVERY canon trigger type (the Grin's swap on its
    real script; summons-refill, skin-shed heal, riddle branch, mercy-end
    on synthetic defs shaped like their chapters) — Prompts 29–34 land
    their bosses as DATA.
  - **Forms are texture swaps** (the ENEMY_BATTLE_ART law extended):
    `BossFormDef.spriteSuffix` resolves through the new `FORM_ART`
    registry (validator-gated both directions, wear tiers registered at
    boot); immunities zero a damage CLASS — every hit now declares
    'physical' | 'vibe' | 'pray' at damageEnemy, and PRAY always lands
    (faith is the game's thesis; no idol gets to eat it).
  - **`crackedBy`:** an element that suspends a form's physical immunity
    for CRACK_TURNS — Vibe Freeze makes SOLID GOLD brittle (§A6 Ch.2's
    edge case, pinned in vitest and taught by the fight itself).
  - **The riddle UI** rides the existing ask widget, pool-driven
    (`pickRiddle` pinned; the Sphinx consumes it in Prompt 30). The Tick
    stays bespoke — its latch is shipped law (S11) and the validator now
    REJECTS a titanic_tick script.
  - **`awakeningOnForm`:** a form's first appearance can BE a chapter's
    ADR-035 moment — BattleScene stages it mid-battle (flash, the §A11
    pages, the flag, the jingle). MIA AWAKENS VIBE FREEZE α the moment the
    Grin goes hollow ("cold reads what gold hides", §A11.2 — played
    straight); Freeze α left her L12 unlock row in the same commit (§A3
    amended; the validator's no-double-path axis enforces it) and **save
    v7's registered step backfills `awake_freeze_a` for any v6 Mia already
    at L12+** — a save never loses an ability it could cast (ADR-015/035).
- **Decision — PICNIC (Prompt 23, §A4.5):** picnic tables are
  interactables; baskets are kind-'basket' items (Basic bought · Family
  deli-crafted from any 3 foods · Feast recipe-gated to Ch.7, arms the
  one-shot party auto-revive `feast_armed` that answers a wipe INSIDE
  battle exactly once). The ritual: blanket unrolls, the party sits, two
  songbirds land (ADR-020 discipline), full HP/PP for the standing —
  angels wait for hospitals — and SUNNY SIDE arms: `sunny_side = 5`, a
  plain number flag (remainder persists with NO save step), burned one per
  battle at finish() however it ends, read through the **`sunnyMul()` seam
  beside heroOffense** (offense/defense/speed/guts/vibe all multiply
  through it; the sun icon + count sit by the party strip). Menu Use at a
  table defers to the table flow; anywhere else canon answers: "There's no
  good spot here." Ch.1's four tables are §A4.5 canon placements now;
  Ch.2 places three more before its dungeon + the antechamber's
  (validator-pinned by map).
- **Decision — HOSPITALS & CHURCHES (Prompt 25, §A4.7):** Brickton General
  opens behind its real double door (hospital_int — the ADR-028
  landmark-large), with clinics at Puerto Sol and Valle Dorado; the desk
  revives angels at `reviveCost(level) = 10 + 4·level` and cures
  everything for a flat $18 (clearing Homesick for a fee Mom would not
  approve of); each doctor gets exactly one weird line (§A11), and the
  Mushroomize note already hangs on the wall (doctors-only, Ch.6).
  **ADR-014's interim revive-all RETIRES:** a wipe now wakes the LEADER
  alone at GS.respawnPoint() with cash §A4.7-halved; everyone else rides
  the trail as angels until a hospital, Healing γ, or a rare item.
  Chapels (Otterbrook + Valle Dorado): a free 50 HP party prayer, and the
  priest is warm about Mia's gift (§A11.4 — flavor, played straight).
  locked_chapel/locked_hospital retired the S4 way.
- **Decision — CHAPTER 2, COMPLETE (Prompt 28):**
  - **The crossing:** Brickton's east wall gains the docks gap (plain
    g.set — every seeded stream byte-identical); the captain's ask holds
    the rope until `ch1_complete` (ADR-014: the gate REQUIRES the flag);
    the first ride plays the §A11 deck scene on the bus-map precedent
    (masked scrolling reel), later rides quick-fade BOTH directions (zero
    missables); UNCLE BERT appears at the docks ifFlag ch2_complete — the
    Ch.3 tease, no map for Lucille yet.
  - **PUERTO SOL is a CITY on seed 1898** (frozen forever, the 1995 rule's
    fourth application; byte-identity pinned in vitest): two streets + the
    avenue, colonial vocabulary INSIDE the fixed canvases via the new
    `CityBuildingOpts.arch` crown pass (ADR-019 holds — same dims, same
    door rects), the plaza fountain + market stalls, the pier district,
    ONE shop (mercado, manifest-pinned), clinic, deli (basket crafting),
    and the MUSEO DEL CASI-ORO. **THE ONE-LINE WIRE landed:**
    COSTA_DOOR_FOR_PUERTO_SOL (tx/ty now aimed at the authored north gate)
    pushed onto costa_estrella.doors + the cliff road back — the
    validator's unplaced-door pin FLIPPED to assert the round trip. The
    map-building kit (Grid/seededRng/treeSprite/doorstepOf) extracted to
    `src/data/mapkit.ts` so chapter map modules share it without an import
    cycle (byte-identical code, the streams untouched — jitter tests
    green).
  - **THE STEP-PYRAMID:** four chambers whose 7×7 ROTORS (a T-channel)
    turn 90° clockwise per mask press — `rotateRect` applies
    (initial + presses) % 4 at BUILD time (the carveHoldingRoom pattern;
    ADR-014 fade-restart per press; flags `pyr_rot_N` carry it, no save
    step). The solve reads on the floor (the T is visible; glyphs point)
    and is PROVEN in vitest by BFS: every room blocked as found, open
    after the documented presses (**1 → 1 → 2 → 2**), and the mask
    reachable at every rotation — no soft-lock by construction.
  - **§A7 Ch.2, all six + BOSS 2** (HP pins both directions): every quirk
    is a real mechanic — the Parrot's **pending-cash theft** (cash leaves
    NOW, rides the bird, drops on its defeat; run away and it keeps every
    cent), the Beetle's gold form ('gild': physical-immune turns, tinted),
    the Souvenir's Crying, the Step-Mask's cast Shield (enemy-side
    halving), the Bunch's 5×22 union (the battle letter row grew to E),
    the Jitterbug's Paralyze (move-status enum extended). Battle sprites
    with three authored wear tiers each + overworld minis; the Idol draws
    BOTH §A6 forms off one base (hollow = the same body with the warmth
    gone).
  - **Quests #5–6 (§A10, manifest-pinned):** THE LLAMA DRAMA — six llamas
    on the dog-sheet contract (S7c — zero new engine code), each with one
    §A11 personality line, herded by the Biscuit-zoom pattern; ONE is a
    disguised Gilded Beetle that fights when cornered; reward Wool Poncho
    (§A8 'body', WEAPON_ART torso row) + caller Tomás (damage 420).
    MUSEUM OF ALMOST-GOLD — the loaner camera (key item), A-to-shoot at
    four marked exhibits (flash + flag per sign beat), reward CAMERA
    FLASH (a REUSABLE status battle item — `ItemDef.reusable`, the Flash
    fx family blinding the room into Crying) + caller the curator
    (damage 435).
  - **Items/economy (§A8/§A9):** Alfajor, Aloe Leaf + Hanky (the cures the
    Ch.2 roster makes matter — battle-usable via the ally picker),
    Sandlot Slugger $185 / Copper Pan $164 / Tin Sun Pendant $110 — a full
    regional refresh ≈ two chapters of income (Prompt 37 tunes the
    decimals); shops manifest-pinned in both directions.
  - **Story (§A11, in full):** the crossing, the señora's short letter,
    the arrival, the valley's quiet, three gray WISHERS at the shrine with
    woke twins standing in the same spots (flag-gated variant pairs —
    color comes back one laugh at a time), the pyramid approach, the
    §A11.3 apex (the idol is never funny), EMBER #2 + the two-stem
    Heartlight, and **ch2_complete set by the valley RECOVERY beat** —
    the §A6 exit is the wishers waking, not the boss dying.
- **Save v7, registered (ADR-015):** the lone step backfills
  awake_freeze_a from Mia's level under the OLD table (≥12). Everything
  else rides flags (sunny remainder, feast, rotations, herd, photos,
  grin_defeated, ch2_complete) — the prefer-flags clause exercised hard.
- **Verification:** validator (every manifest above + the phase-script
  pins + FORM_ART + picnic placements + hospital staffing + the boat
  chain + the costa flip; FOUR axes verified failing loudly: crackedBy,
  a missing table, an orphan FORM_ART row, the unwired costa door) + 270
  vitest (phases suite for every canon trigger; the rotation BFS proof;
  sunny/reviveCost pins; the v6→v7 backfill three ways; Puerto Sol
  byte-identity ×2 builds). Live via the ADR-008 driver over the dev
  server (docs/QA.md S14): the crossing end-to-end, Puerto Sol rendered,
  a mask press rotating a live room and the channel walked through, an
  organic Step-Mask fight, and THE WHOLE GRIN — clang on gold, telegraph,
  hollow swap + texture, **Mia's mid-battle awakening**, hollow bash
  landing, wear-composed form texture, victory. Zero console noise.
- **Consequences:** bosses 3–8 are BossScriptDef rows + dialogue + art
  (the engine is done); every future basket/table/clinic/chapel is data
  through the S14 beats; chapter map modules import mapkit, never
  maps.ts; new battle items can be reusable or status-bearing by schema
  field; the §A9 timing run (~13 target, 35–45 min) belongs to the device
  row with the §A11 tone read-through.

## ADR-040 — S14b: the settings suite, the golf meter's real bug, the leaning run & the scrolling Lab

- **Date:** 2026-06-11
- **Status:** Accepted (user feedback pass on S14: "make all buttons
  configurable in a clear easy to use manner with clean production quality
  UI", "the fill bar is like going the wrong way", "a reset button or close
  button to get back to the main screen", "changing the color of the grid
  edges of all the text boxes like they have in earthbound", run animation
  lean + determined face, "why am I unable to scroll down in this list")
- **Decision — THE SETTINGS SUITE (SETUP, production pass):**
  - **WINDOW FLAVORS (Prompt 6 canon, shipped):** `drawWindowSlice(flavor)`
    — CLASSIC night-blue + MINT + STRAWBERRY + BANANA (the EB homage), all
    keeping the white double-border; four `win9*` textures at boot. The
    pick rides the save as the plain number flag `win_flavor` (per SAVE
    FILE exactly as Prompt 6 demands — flags ride notebooks, no migration),
    read live by `winTexture()` in makeWindow + Dialogue.say's cached
    window (`setTexture` per say), so a change repaints the very next
    window. Cycling the row previews instantly.
  - **TEXT SPEED:** PATIENT / NORMAL / BRISK on the `text_speed` flag
    (unset = NORMAL), read through `textSpeedMul()` by BOTH typewriters
    (dialogue + battle print); held A/B fast-forward is unchanged law.
  - **RETURN TO TITLE:** the close/reset path home, in SETUP — a confirmed
    two-step ask ("Dad keeps everything he wrote down. Anything since his
    last call goes back to lint."), then overworld + menu stop and the
    title boots. Never accidental: Stay is the cancel row.
  - **CONTROLS, rebuilt:** the S12c rebind page becomes a production sheet
    — the binding list (action · keyboard · pad columns, long chords
    elided) beside a WHAT-THEY-DO legend covering every context the action
    serves (overworld/battle/cage/links), a PULSING capture card on
    press-to-capture, reset-to-defaults, and the standing conflict rule
    stated on-page: a stolen key falls back to its old action's default.
    Bindings stay device-local ('meteor-falls-controls') — never save data.
- **Decision — THE GOLF METER'S REAL BUG:** the reported "fill going the
  wrong way" had a render-layer root cause: assigning a Phaser **Shape's
  `.height` does not rebuild its rendered geometry** — the S13 fill never
  visually grew (the stub at the bar's base in the user's screenshot), and
  during the accuracy phase what little read there was DRAINED downward.
  Fix: full-height quads sized by **`setScale(1, frac)` against a bottom
  origin** (proven by renderer pixel sampling), and the presentation
  re-reads as classic golf: the power fill RISES and HOLDS at the captured
  power (gold mark), only the cyan NEEDLE falls through the accuracy
  phase, and the PURE band hugs the base where tap three lands. The sim is
  byte-untouched (every S13/ADR-038 test pins hold). REVIEW SMELL, stated:
  never assign `.width/.height` on a Phaser Shape and expect pixels —
  scale it or rebuild it.
- **Decision — THE RUN BLOCK (supersedes ADR-009's 16-frame note, the
  expansion ADR-028 anticipated):** character sheets are **24 frames** —
  the walk block 0–15 BYTE-UNTOUCHED (every index, sheet order, and
  standFrame() preserved) plus appended run poses 16–23 (2 per direction,
  `runFrameBase(dir)`): head + torso shifted one pixel INTO the motion,
  the head one pixel lower (tucked chin), and the face set to the
  determined glare brow for the duration — drawn through the SAME
  parametric layers via a metrics override, zero forked draw code. The
  `-run-` anims play the new frames; followers, chasing walkers, and
  patrols inherit the lean by anim key. Pinned in characters.test.ts:
  24 frames for every CAST member, every run frame differs from its walk
  step, and the right-run head's center of mass sits measurably forward.
- **Decision — THE LAB SCROLLS:** the cast page (41 strong since S14)
  paginates by row — Up/Down scroll, clamped, with a corner position read
  (`4–6/6`). The walk-cycle audit loop is unchanged.
- **Verification:** validator + 274 vitest green (the 4 new
  characters.test.ts pins; every standing suite untouched). Live over the
  dev server (docs/QA.md S14b): the SETUP suite driven end-to-end — sound
  toggle, speed cycle, MINT and STRAWBERRY windows on screen, the controls
  sheet rendered, **sprint captured onto KeyL and persisted, then reset**;
  the Return-to-Title transition proven (title active, overworld + menu
  stopped); the golf meter pixel-sampled mid-swing (held fill, gold mark
  at 0.78 power, needle descending, PURE band + zero line at the base);
  the run lean staged at 3× beside the walk frames for Jay AND Mia; the
  cast page scrolled to rows 4–6. Driver lore earned: a user's live
  browser focus wipes held keys by design (the blur listener) — bot
  movement legs need the tab focused or the loop slept; and renderer
  pixel-sampling via snapshotArea needs the loop AWAKE for one pass.
- **Consequences:** new settings land as SETUP rows over flags (per-save)
  or device-local storage (per-device) — the split is now precedent;
  future meters size shapes by scale, never by `.height`; a future
  five-flavor EB set is one WINDOW_FLAVORS row; chapter casts can grow
  without Lab blindness. The §A6 bosses 3–8 remain chapter deliverables
  (Prompts 29–34) on the S14 phase machine — each ships WITH its chapter's
  art, wear tiers, telegraphs, and §A11 lines, exactly as the Grin did.

## ADR-041 — S15: the opening cinema rebuilt full-length; chapter banners retired from player-facing text

- **Date:** 2026-06-12
- **Status:** Accepted (user feedback pass: "the cutscene isn't clear it's too
  short it needs way more polish... show the full process then the world
  rumbles... pan to the characters house showing the player the overworld...
  sound effects for the drop and the crash and also some background music...
  some otherworldly sounding"; and "remove the chapter 1 message I don't want
  notify players of the chapter for the game")
- **Context:** The old `openingMeteorCinema` had a layering BUG that gutted it:
  `world` was added to the cinema container BEFORE the opaque sky rects, so the
  entire town diorama — crater, houses, porch light, and the closing pan —
  rendered BEHIND the sky and was never visible. All the player saw was a 1.35s
  streak over a flat starfield, then a text card announcing "CHAPTER 1".
- **Decision — THE OPENING CINEMA (full process, ~35s, timed captions):**
  - Strict paint order is now law in the cinema: `sky < world < fx < caption`
    as four explicit containers (the bug class is named in the method header).
  - Phases: fade-in over sleeping Otterbrook (twinkling stars, crescent moon,
    five dark lots + phone poles + the 6:15's road on an 840px strip) → THE
    WRONG STAR (a star pulses, grows, shifts white→gold→orange) → THE DESCENT
    (2.8s diagonal fall with layered trail, shed sparks, sky-glow ramp, and a
    SONIC BOOM crack + ring at mid-sky) → IMPACT behind Hickory Hill's front
    ridge (whiteout, `shake(1500, 0.02)`, world-container jolt, tree sway,
    pulsing crater glow + embedded rock in a `craterLayer` BETWEEN the hill
    triangles so the ridge occludes it, rising dust column, two ground-hugging
    shockwave ellipses, 14 debris frags on real gravity arcs via addCounter,
    two delayed aftershock shakes) → EIGHT MOTES rise and seven streak over the
    horizon while ONE sinks back into the crater (§A6 foreshadow, wordless) →
    the town's windows wake hill-side-first with per-light blips → a 3.8s pan
    east to {rex}'s house → his window lights last + an 18% push-in keeping the
    house centered → fade; `introScene` then reveals the bedroom mid-aftershock
    (rumble + gentle shake) instead of re-staging a second impact.
  - Captions are TIMED (fade in/out, ≥2.6s + 55ms/char — slowed and the
    riddle-phrases plain-spoken after the user's live read: "back teeth" /
    "world still has it" confused; kids read this) —
    `intro_card` is RETIRED from DIALOGUE; the §A11 scene-setting voice moved
    into the captions. `intro_wake`'s redundant "Something enormous just
    landed" page became a window-view line (the captions already said it).
- **Decision — THE SCORE (ADR-006 synth, new presets):** music track
  `starfall` (52 BPM half-step drone that never resolves + detuned tritone
  star-bells — otherworldly per the brief; it stops DEAD at impact and the
  silence after is part of the track) and sfx `meteor_far` (the wrong star's
  shimmer), `meteor_fall` (2.7s entry scream + building rumble, sized to the
  descent tween), `sonic_boom`, `meteor_crash` (sub thump + long brown roar +
  two echoes), `rumble` (reusable aftershock), `light_on` (porch-light blip).
- **Decision — CHAPTER BANNERS RETIRED (user law, Bible drift):** players are
  never told chapter numbers. "CHAPTER 1: THE NIGHT IT FELL." (intro_card),
  "CHAPTER ONE — THE NIGHT IT FELL / complete." (ch1_card) and "* CHAPTER 2 —
  THE GILDED GRIN — complete." (ch2_card) are gone; the cards keep their
  closure beats and travel teases in-voice ("The night it fell is officially
  over..."), and ch1_card's "That's a Chapter 2 problem" gag de-chapters to
  "a problem for another day". INTERNAL chapter structure is untouched: quest
  `chapter:` fields, `ch1_complete`/`ch2_complete` flags, validator manifests,
  and Bible §A6 chapter scoping all stand — this is presentation only. Future
  chapter-close cards follow suit: closure text, no banner.
- **Verification:** validator + 275 vitest + tsc green; driven live over the
  dev preview — New Game threads name entry into the cinema, layer counts
  read back sky 19 / world 67 / fx live, the full flow lands in the bedroom,
  `intro_wake` drains, `meteor_fell` sets, control releases, zero console
  errors. A mid-cinema screenshot caught the hill triangles rendering UPSIDE
  DOWN — the old negative-y vertex coords were latent-invisible behind the
  sky bug; rebuilt positive-down with the peak in the first vertex row.
  REVIEW SMELL, stated: never author Phaser triangles with negative vertex
  coords — bbox normalization flips them silently.
- **Consequences:** cutscene work must add to the cinema's named layers, never
  to `cinema` root before the sky; QA bots fast-forward the cinema via pumped
  frames (no button presses until `intro_wake` — drain it by polling
  `meteor_fell` per ADR-008 lore); the §B3 music registry gained an ambient
  one-off track shape (loop + hard stop as a scoring device).

## ADR-042 — S15b: HILL ROAD (the search is a walk), Mom's full reset, the Homesick dice calm down

- **Date:** 2026-06-12
- **Status:** Accepted (user playtest of the ADR-041 cinema: "we need an extra
  screen as the character goes through the map to search for it... a winding
  cliff of some sort with enemies and maybe like some more homes... maybe you
  meet one character early on that will come into play later"; "everytime I go
  see my mom she should heal fully my HP and PP"; "the homesick thing pops up
  way too often... lower that by alot")
- **Decision — HILL ROAD (Bible §A5 Ch.1 route amended: Otterbrook →
  hill_road → Hickory Hill):** a 30×34 neighborhood-and-switchback screen
  between town and the trail. The road climbs in enforced switchbacks (bush
  walls + the homes' own solids; fence rails along the drops carry the
  "winding cliff" read), three locked homes sit on a lane (signs editorialize
  per §A11 — the cat one, the doorbell one, and the canon TV/PANIC line
  reused), phone poles + trash can dress the street, and §A7 Ch.1 enemies
  (cicadas, slugs, one cranky mailbox prowling the home lane) spawn gated on
  `meteor_fell`. Doors rewired BOTH directions (otterbrook's north edge →
  hill_road 236/506; hill_road's summit → hickory_hill 232/660 — the old
  town↔hill targets reused so nothing else moves). `storyNight` (S9b clock)
  gains hill_road, so 2 A.M. follows the whole route. The §A10 #1 sniff
  trail crosses the road cosmetically (paw_prints + a flavor sign on the
  q_biscuit_c1→c2 window — the quest machine itself is BYTE-UNTOUCHED).
- **Decision — THE EARLY CHARACTER IS BISCUIT:** the §A2 cast can't cameo
  (Mia is canonically IN Brickton until her rescue), but quest #1's beagle is
  already the night's prophet — the finale caller quote "Biscuit pointed at
  the sky and BARKED" is existing canon, and the new cinema captions set him
  up twice. `biscuit_road` parks dead-center on the summit road pointing at
  the hill (dialogue carries the pointing — dog sheets are east/west only),
  gated `unlessFlag: 'zapper_done'` like his park self; you squeeze past his
  solid. Pays off in quest #1 AND the finale.
- **Decision — MOM IS A FULL RESET (user law):** every talk with Mom heals
  the party to full HP/PP (down heroes stay down — Mom is not a hospital)
  and cures Homesick in person (§A4.4's "her voice is the cure" was already
  two-directional on the phone; in person is strictly closer). The heal line
  (`npc_mom_heal`, the once-over) speaks only when something was actually
  fixed; the Homesick cure reuses the canon `mom_cure_beat`.
- **Decision — HOMESICK_CHANCE 0.08 → 0.02:** the §A4.4 mechanic stays
  (user: "it's a good mechanic"), the per-victory contraction roll drops 4×.
  Tests pin the threshold symbolically, so no test edits.
- **Verification:** validator (41 maps) + 275 vitest + tsc green. Live over
  the dev preview: town's north edge → HILL ROAD (banner + 2 A.M. night tag),
  the lane/homes/poles/switchbacks/enemies screenshot-confirmed (mailbox
  prowling the lane), Biscuit's two pages read back verbatim, summit door →
  hickory_hill (232,660) and back (236,36), Mom's first-visit branch healed
  3/0 → full + cleared Homesick via mom_cure_beat + granted gear, second
  visit healed 12/2 → full behind the once-over line, zero console errors.
  QA lore: a teleport that lands the bot ~6px from an NPC hides the NPC
  BEHIND the player sprite (depth) — it looks like a missing NPC and isn't.
- **Consequences:** the Ch.1 on-foot route is three screens; anything that
  scripts town→hill traversal must cross hill_road; future "more homes"
  asks land here first. Chapter-route insertions follow this shape: reuse
  the displaced door targets so only the two seam doors change.

## ADR-043 — S15c: the third playtest fixed live + the world-expansion queue (and the numbering drift repaired)

- **Date:** 2026-06-12
- **Status:** Accepted (user playtest dump, fixed live where small, queued
  where large: "at night there is one line at the top that still looks like
  its light out"; "when I surprise an enemy it should show green, when they
  surprise me it should show red, currently that is reversed"; "after
  leveling up or multiple level ups there should still be the need to press
  x between each level up"; "after the battle in the beginning the
  characters text need to change in the characters main city when its light
  out"; "when you speak to the dog again coming down the hill after you won
  the first boss battle v the tick it should say something different"; "on
  the bus ride to brickton the character UI is off where his head is like
  blocked by the seat"; "when brickton starts, it spanned through the map
  but like did it super fast" — plus the OH-triple / road-gate / Brickton-4×
  decrees, which became queued prompts S15d–S15f.)
- **Decision — THE OVERSCAN LAW (the night line):** full-screen overlays
  must outsize the viewport. Pixel-proven root cause: with the camera
  mid-map (scrollY 171) screen row 0 rendered the world UN-tinted —
  camera scroll rounding shifts scrollFactor-0 shapes and the tilemap by
  unequal sub-pixels, exposing a one-pixel day-lit line at the top of every
  night map. `overscanRect()` (ui/windows.ts, OVERSCAN = 4) bleeds the
  night tint past every edge; buildNight consumes it. Any future
  full-screen tint/cover takes the same helper.
- **Decision — THE SWIRL IS A TRAFFIC LIGHT (Bible §A4.2 + Prompt 16
  amended):** the Bible's original text gave green to the ENEMY's drop and
  red to yours; the code faithfully implemented it; the user (and
  EarthBound) read green as good news. `SWIRL_TINT` + `contactAdvantage()`
  extracted to battle/formulas.ts (Phaser-free, vitest-pinned): green =
  player free round, red = ambush, paper = neutral. S14d item 1 keeps the
  rest of its spec (three sfx, true-grey neutral, spin-direction
  colorblind channel) — annotated in the queue.
- **Decision — LEVEL-UPS WAIT FOR YOU:** BattleScene gains `printWait()` —
  print, then hold until a FRESH A/B press (arms only after both buttons
  are seen up, so a held fast-forward can never blow through; the ADR-024
  latched-press class, inverted; gold ▼ blinks at the window corner).
  Victory's level-jump and ability-realization lines ride it: three
  level-ups are three pieces of news, not a blur.
- **Decision — THE TOWN TALKS ABOUT THE NIGHT, THEN THE MORNING:**
  `NpcDef.dialogueDay` (schema + validator sweep both directions) — spoken
  instead of `dialogue` when the map is in daylight; the scene caches
  `isNight` at build. Otterbrook: the old-timer and the pajama kid carry
  day variants; Mrs. Pemmel's static line (structurally night-only — her
  day path is the quest machine) rewrote to present-tense 2 A.M. Biscuit
  on Hill Road splits on `tick_defeated`: pointing at the hill before, a
  proud verdict (pointing at YOU) on the walk down — data-only dual NPC
  defs, the existing gate idiom.
- **Decision — THE 6:15 SEATS ITS HERO:** root cause: the player's depth
  was only assigned in update(), which the `cut` lock skips, so any map
  entered INTO a cutscene left him at depth 0 and the seat back (depth 88)
  swallowed his head. buildPlayer now y-sorts from frame one, and the
  first ride spawns him AT a seat facing the window (296,100,'up').
  S14d's "the 6:15 seats the whole party" inherits this seam.
- **Decision — THE ARRIVAL EARNS ITS PAN:** bricktonArrivalScene's single
  950ms dash became three slow legs (4200/3200/1800ms, Sine.easeInOut)
  paced under the §A11 narration; the dialogue stays the clock, holding A
  fast-forwards everything per ADR-024. S15f re-aims the waypoints when
  the city quadruples (landmark-derived, never hardcoded).
- **Decision — POLLS DIE WITH THE SCENE (rode along, QA-caught):**
  everyFrame() now also unsubscribes itself on the scene's SHUTDOWN event.
  A stop/restart mid-poll used to leave the handler subscribed to the
  persistent scene emitter while its UI objects were destroyed — the
  scene's next life then drove the poll into a corpse every frame (caught
  live: a say() typewriter setText on a destroyed BitmapText threw on
  every frame, forever, killing the QA loop; in production the same class
  waits for any future cutscene that restarts a scene over an open
  dialogue). Repro driven before and after the fix: a mid-say
  scene.restart now survives clean.
- **Decision — THE QUEUE GROWS THE WORLD (prompt authoring):** the user's
  scale decrees landed as three fully-written prompts — S15d OTTERBROOK
  GROWS UP (the frozen-core growth law: the 1995 canvas survives
  byte-identical as the historic core, growth south/east on new streams;
  city hall + Civic Green + pond park + east lanes; THE SETTLEMENT LADDER
  into §A5), S15e THE ROAD TO BRICKTON (Meadow Mile + the Overpass; THE
  ORIENTATION GATE — three Blazer Smiler proctor fights for the visitor
  badge, binding bus AND foot behind a (visitor_badge || bus_ride_done)
  grandfather clause, no migration), S15f BRICKTON SPRAWLS (≈2× the grown
  Otterbrook on the frozen 2077 core, the building catalog, THE CAGE
  BLOCK readable from the street, and THE BRICKTON MINUTE + THE WARM DIAL
  TONE replacing the toast "stories" on their existing gate flags). The
  block runs right after S14d because the HEADROOM PROGRAM is its
  perf license.
- **Decision — THE NUMBERING DRIFT, REPAIRED:** the off-queue sessions
  consumed labels S15/S15b and ADR-041/042, which S14c's QA paragraph had
  reserved; queue prompts EVERY DOOR OPENS / STATIONS & WHEELS renamed
  S17/S18 (content untouched); S14c/S14d carry DRIFT NOTES where ADR-042
  already shipped a slice (Mom's full reset + in-person cure: shipped;
  homesick flat rate now 0.02); S11b/S12c/S13 headings gained the ✅ DONE
  markers the footer always asserted, so kickoff rule 1 is mechanical
  again. ADR numbers are allocated next-free at ship time from here —
  prompts no longer pin them.
- **Verification:** validator (41 maps, 331 dialogue scripts) + 277 vitest
  + tsc green; night row-0 pixel-sampled tinted at top and bottom edges;
  the swirl driven live both ways (green sneaking up, red ambushed); a
  triple level-up acknowledged press-by-press; day/night dialogue and
  Biscuit's verdict read back in-scene; the bus ride screenshot shows the
  hero seated in full view; the arrival pan walked across three legs.
- **Consequences:** full-screen overlays take `overscanRect` or they are
  wrong; swirl colors are formula law (`SWIRL_TINT`) — scenes never
  hand-pick them; any cutscene-entered map must trust buildPlayer's
  depth init; `dialogueDay` is the idiom for time-of-day NPC variance
  (quest machines unaffected); the queue's world block is the next major
  arc after S14c/S14d, and file order in NEXT_PROMPTS.md IS the queue.

## ADR-044 — S15g (Movement One): THE LEVELKIT + the map-quality validator

- **Date:** 2026-06-12
- **Status:** Accepted (THE WORLD FORGE, Movement One of four — the kit + the
  gate; the dungeon grammars + pressure (M2), the forges (M3), and the
  chapter scaffold (M4) are queued behind it and will take ADR-045+ next-free.
  Split on the prompt's own movement seams, the S14a–d / S15a–c cadence.)
- **Decision — THE PRIME LAWS (every generator obeys all six):** (1) DRAFTS
  ARE NOT CONTENT — generated output lands in `src/data/drafts/**` or the
  LEVELKIT LAB, dev-only, EXCLUDED from the MAPS registry, the canon
  manifests, and the §B4 sweep exactly the way maps/dev/playground always
  has; yet everything SCHEMA-PARSES (`DraftMapDefSchema`). Promotion is a
  human act and the user stays the tone editor. (2) DETERMINISM IS LAW —
  every generator is (recipe + seed) → identical bytes on mulberry32
  (`seededRng` IS mulberry32; named sub-streams key on (seed, name));
  `Date.now()`/`Math.random()` never appear under `src/levelkit/**` (a
  source-scan test proves it). (3) ADR-012/ADR-020 BY CONSTRUCTION —
  generated cities clear the EXACT ADR-012 sweep maps.test.ts runs (now a
  shared `cityViolations`, one home) with no exemptions on ≥7 fresh seeds;
  sprite assembly (M3) will COMPOSE hand-drawn parts, never synthesize. (4)
  THE VALIDATOR GROWS TEETH — the playability gate runs on EVERY canon map
  now (below). (5) input/poll = ADR-024/038, draw = ADR-020, the LAB = the
  Sprite Lab precedent. (6) PERF — `npm run bench:map -- <id>` pre-filters a
  draft against the S14d XL envelope before a session polishes it.
- **Decision — THE KIT (`src/levelkit/**`, Phaser-free, vitest-pinnable):**
  recipe schemas z.infer'd in `src/schemas` (ADR-017 — generators
  `import type`, zod stays out of the bundle); the canon `MapDefSchema` is
  UNTOUCHED, `DraftMapDefSchema` is built from its `.shape` with role-tagged
  NPC slots allowed (a role-tagged slot can never masquerade as canon — the
  strict `MapDefSchema` REFUSES it, proven). Seven generators output plain
  DraftMapDef: `buildCity` (the ADR-012 grid law by construction — ≥2
  streets separated by built blocks, a full-height avenue, facades north of
  each street = ≥2 faces, crosswalks, negative space, alleys),
  `buildTown`/`buildVillage` (organic, never a strip), `buildInterior`
  (seven template families — the structural half of S17's interior program),
  `buildRoute`/`buildWild` (connector + forest/moor, routes run hot per §B4),
  `buildTravelScene` (the bus/boat masked-reel per §A5 leg). Style packs are
  DATA. Each output hash is PINNED (one per generator) — a refactor that
  shifts one byte fails naming the generator.
- **Decision — THE LEVELKIT LAB (`levelkitlab`, dev-only):** the title's DEV
  menu reaches it (the Costa Estrella precedent); it shows the live ADR-012
  metrics overlay (street rows, avenue joins, block faces, negative-space %,
  PASS/violations), rerolls the seed in place (^v), and WALKS the draft with
  the real player/collision/banner by injecting it into the RUNTIME MAPS
  registry only — invisible to `validate`, which reads the static source.
  Role-tagged slots get a dev dialogue at walk time (never in data).
- **Decision — THE MAP QUALITY VALIDATOR (Prime Law 4):** the reachability
  math is a pure library (`src/levelkit/mapcheck.ts`, vitest-pinned on
  synthetic grids); `tools/content-validate.ts` drives it over every canon
  map with the engine's own tile solidity (`TILESET.solid`). Content
  (npcs/signs/phones/atms/picnics/triggers) must be BFS-reachable across the
  walkable floor, and every door must land on a walkable target tile. 36/41
  maps clear it clean; the 5 exceptions carry a VISIBLE WAIVER TABLE inside
  content-validate (reason + §-ref): the four step-pyramid floors (content
  past the §A6 rotating floor / a return-door on a rotor wall in the static
  state) and dos_f3 (Mia sealed in the holding room until carveHoldingRoom).
  Waivers are checked both directions — a waiver that stops being needed
  fails as UNUSED. The per-map "spawner ⇒ rest point" rule was REJECTED as a
  canon gate (it false-flags seven legit dungeons that rest in the preceding
  town per §A4.5); rest-before-pressure stays a GENERATOR guarantee, proven
  in the kit test. Chapter enemy bands + picnic counts wait for M4 manifests.
- **Verification:** tsc + validate (41 maps, 331 dialogue, the new map-quality
  gate) + 317 vitest green (277 prior, 40 new levelkit). 8 generators
  hash-pinned + deterministic twice; cities clear ADR-012 on 7 fresh seeds;
  the role-tag refusal driven both directions; generated city + route content
  proven all-reachable; `bench:map` reports Zanzibel at 0.16ms/build within
  the XL envelope; LAB device walk is QA pre-flight row 28.
- **Consequences:** every later world session SCAFFOLDS first (drafts) then
  POLISHES (promotion) — the floor only rises. `cityViolations` has one home;
  any new city (S15d/e/f, Ch.3+) rides the kit's recipes + frozen streams and
  hand-builds only its landmarks. The map-quality gate means orphaned content
  and doors-into-walls can never ship silently again — fix it or waive it
  with a reason, in the same commit. ADR-045+ are reserved next-free for M2–M4.

## ADR-045 — S15g (Movement Two): THE DUNGEON GRAMMARS + ENCOUNTER PRESSURE

- **Date:** 2026-06-13
- **Status:** Accepted (THE WORLD FORGE, Movement Two of four — the eight
  per-SITE dungeon grammars + the encounter-pressure automation + the
  generalized soft-lock proof, built ON Movement One's kit/gate/streams. The
  forges (M3) and the chapter scaffold (M4) stay queued for ADR-046/047, split
  on their own movement seams per Appendix rule 2.)
- **Decision — THE PRIME LAWS STILL HOLD (ADR-044, unchanged):** dungeon
  grammars emit `DraftMapDef` (dev-only, schema-parsing, never entering MAPS /
  the manifests / the §B4 sweep); determinism rides the named mulberry32
  streams (recipe + seed → identical bytes; `Date.now()`/`Math.random()` never
  appear under `src/levelkit/**` — the scan now RECURSES into `dungeons/`);
  ADR-020 by construction; the validator grows teeth (below); the SHIPPED
  bespoke dungeons (Department of Smiles, the step-pyramid) stay FROZEN and the
  pyramid's reachability waivers stand — its rotor BFS is bespoke law.
- **Decision — THE EIGHT GRAMMARS (`src/levelkit/dungeons/`, ONE per SITE,
  keyed by NAME so the post-S14c renumber can never strand them; never one
  generic maze — the user's law):** `wintermoor_academy` (spine hall + wings,
  a sight-cone PATROL dorm reusing `PatrolDef`, a library-stack soft maze, a
  boiler basement), `sleepers_spine` (the terrain-giant hand→shoulder→ear under
  THE SCALE LAW, Whisperwig pillar staging), `the_hedgerow` (wide escort lanes,
  FALSE exits that REJOIN — comedy, never punishment), `laughing_ruins` (a
  1-wide TREE so the loops are a LIE — BFS-proven acyclic via `floorIsTree`,
  edges == cells − 1, with twin-prop dressing + riddle signs + echo tags),
  `night_train` (car-by-car LINEAR; the §A6 ≤30-minute Locket-loss law is a
  GENERATION PARAMETER — the car count bounds the sequence to [3, 7]; a service
  crawl over the top), `spore_forest` (winding paths + Mushroomize hazard rects
  in side pockets + CURE-SAFE return paths generator-PROVEN: a clean margin
  column means a scrambled kid can always walk out — `trappedZones` throws if
  not), `castle_hoaxula` (a queue maze + gift shop + a REAL fake-scare loop,
  then the BACKSTAGE REVEAL behind one seam), `sea_of_silence` (SUBTRACTIVE —
  three zones at a strictly-FALLING obstacle curve, the emptiness as data). Each
  builds a deterministic SKELETON (the entrance room is a SAFE CAMP, spawners
  begin deeper) and lets the seed move only DRESSING — reachability holds for
  ALL seeds BY CONSTRUCTION; `sealed()` is the build-time safety net.
- **Decision — THE GENERALIZED POST-CONDITIONS (lifted into
  `src/levelkit/mapcheck.ts`, pure graph logic on an `isSolid` predicate,
  vitest-pinned):** entrance→exit reachable; the boss route valid (a
  'boss'-tagged trigger on the entrance graph); a rest point (phone/picnic) no
  DEEPER than the first reachable spawner (§A4.5 rest-before-pressure); and
  `softLockFailures()` — the step-pyramid's BFS-at-every-rotation precedent
  GENERALIZED: a stateful piece (rotor/lock/switch) presents a finite set of
  grid STATES, and every target must stay reachable from the entry in EVERY
  state, not just the initial one. The generalization is PINNED by driving it
  over the SHIPPED pyramid's own four rotor turns (it reproduces the bespoke
  `maps_ch2.test` result and CATCHES a deliberately-blocked target). Generators
  ASSERT all of this at build (throw, naming the site); the dungeon test
  re-derives it from the produced draft on every pinned seed.
- **Decision — ENCOUNTER PRESSURE AUTOMATION:** `src/levelkit/pressure.ts`
  (pure library) scores every map — density per 400×225 screen-equivalent,
  entrance grace, rest exposure, UNAVOIDABLE TOUCHES (BFS with each spawner
  DILATED by a pursuit radius — can a walking player cross entrance→exit
  without a forced fight?), side-path encounters, and spawner proximity to
  FIXTURES (doors/phones/atms/POINT triggers; big ambient zone triggers are
  excluded by design — they are SUPPOSED to blanket the danger).
  `tools/encounter-report.ts` (`npm run encounters`) emits `docs/ENCOUNTERS.md`
  for all 41 canon maps, grouped by class with §A9 target BANDS (routes hot,
  settlements cool, dungeons rising). The HARD subset (grace ≥ 16px, proximity
  ≥ 24px) joins `content-validate.ts` with its own reasoned WAIVER table; the
  soft "feel" metrics stay report-only so taste never blocks the build — the
  report is what catches a map that "looks fine but feels annoying or empty."
- **Verification:** tsc + validate (41 maps; map-quality 36 clean + 5 waived;
  encounter-pressure 39 clean + 2 waived — `pyramid_1`/`pyramid_2`, frozen
  rotor chambers whose §A6 pressure is point-blank by design) + 471 vitest
  green (277 prior floor + 194 levelkit, of which 130 are new dungeon proofs).
  Eight sites hash-pinned on ≥3 seeds each + deterministic twice + schema-parse
  + post-conditions sealed + no hard pressure flag; the generalized soft-lock
  pinned against the pyramid BOTH ways; the cure-safe / tree / car-count /
  falling-curve laws each pinned; `DUNGEON_WALL` cross-checked against
  `TILESET.solid`; the Prime-Law-2 scan recurses into `dungeons/`; `bench:map`
  walks `laughing_ruins` within the XL envelope; the LAB reads the SEALED
  post-conditions + reroll on the phone and spawns a dungeon draft at its
  ENTRANCE (a carved dungeon's centre is a wall). `vite build` intact.
- **Consequences:** any chapter dungeon (Ch.3–10) now SCAFFOLDS from its named
  grammar — the boring 60% (a sealed, BFS-proven, rest-paced layout in the
  right §A9 band) is generated; the session spends itself on the SOUL (the
  hand-art skin, the boss, the dialogue) at promotion. The floor rose: no
  dungeon draft can ship a soft-lock at any stateful state, no spawner can
  crowd a save phone silently, and `docs/ENCOUNTERS.md` is a tracked artifact
  that flags "annoying or empty" maps before a human reads them. ADR-046/047
  stay reserved next-free for M3 (the forges) and M4 (the chapter scaffold).

## ADR-046 — S15g (Movement Three): THE ENEMY FORGE + THE TEN BOSS TEMPLATES + THE SPRITE FORGE + THE PARTY VITALS BAR

- **Date:** 2026-06-13
- **Status:** Accepted (THE WORLD FORGE, Movement Three of four — COMPLETE).
  Landed + gate-green: the enemy forge (3a) wired into the LAB, the ten boss
  templates (3c) on the phase machine, the user's PARTY VITALS BAR, and now the
  COMPOSABLE SPRITE PARTS sub-movement (3b — the hand-drawn part catalog + the
  Sprite Lab, built WITH the user, who picked the Ch.3 faces, §Appendix rule 4;
  see THE SPRITE FORGE below). All four seams of Movement Three are in. M4 (the
  chapter scaffold) stays queued for ADR-047.
- **Decision — THE PRIME LAWS STILL HOLD (ADR-044/045, unchanged):** the forge
  emits DRAFTS, never content — forged enemies live in the dev registry
  (`src/levelkit/forge/registry.ts`) and forged bosses in `src/data/drafts/`,
  both schema-parsing as their canon shapes yet EXCLUDED from the §A7/§A6
  manifests + the §B4 sweep; a `DraftEnemyDef` carries `role`/`chapter` tags the
  strict `EnemiesSchema` has no slot for, and a draft boss script drives an
  UNSHIPPED enemy id, so neither can masquerade as a shipped row (promotion is a
  human act). Determinism rides the named streams; `Date.now()`/`Math.random()`
  never appear under `src/levelkit/**`. The SHIPPED content stays FROZEN — the
  Tick's bespoke latch, the Gilded Grin's script (byte-identical, its
  phases.test green), the §A7 Ch.1–2 roster — and the count is TEN.
- **Decision — THE ENEMY FORGE (3a, `src/levelkit/forge/`):** `curves.ts` fits
  a per-level stat baseline to the shipped §A7 Ch.1–2 rows + the §A6 boss-HP
  ladder; `enemies.ts` drafts a role-shaped, region-flavoured `DraftEnemyDef`
  off the chapter midpoint (a §A11 draft death line, a placeholder sprite until
  3b); `registry.ts` pins one deterministic roster per Ch.3–10 (`buildRoster(ch,
  1000+ch)`). `BAND_ROSTER` ch3–ch10 now resolve to `forgedBandIds(ch)` and the
  LEVELKIT LAB injects the forged defs (`stripForgeTags` → canon `EnemyDef`)
  into the RUNTIME `ENEMIES` on walk — so a walked Ch.3–10 dungeon fights REAL
  forged foes, the canon `ENEMIES` source untouched. Re-keying `BAND_ROSTER`
  moved the dungeon spawner rosters, so the 130 dungeon hash pins were
  regenerated in the same change (the recipe owns the bytes).
- **Decision — THE TEN BOSS TEMPLATES (3c, `src/levelkit/forge/bosses.ts`):**
  every §A6 gimmick as a parameterized FACTORY over the proven `PhaseRunner`,
  returning a plain `BossScriptDef` — `formSwap` (the Grin, SHIPPED reference),
  `latchDrain` (the Tick archetype; the Tick stays bespoke), `summoner`
  (Mainframe), `thresholdHeal` (Cobra Raja), `riddle` (Sphinx, pool of 8),
  `mercyEnding` (Hoaxula), `airborneGrounded` (Paper Dragon), `scriptedSurvival`
  (Whiskerzilla), `untargetableUntilNoise` (Whisperwig), `elementalGolem` (the
  two Ch.10 minibosses). Every unshipped §A6 boss (Ch.3–9) + both minibosses is
  INSTANTIATED as a draft (`src/data/drafts/bosses.ts`) and proven by a HEADLESS
  gimmick test (the phases.test pattern). The four templates that needed it grew
  the machine by ADDITIVE primitives ONLY — `noiseOut`/`grounded` + the
  `untargetable`/`groundedBy`/`surfacesTo` form fields (Whisperwig surfaces,
  Paper Dragon grounds), `healsFromElement`/`healedBy` (the golem the WRONG
  element heals), `evasion`/`setEvasion` (Whiskerzilla's Flat Bell), and
  `latch`/`latchAmount`/`releaseLatch` (the archetype) — each defaulting inert,
  so the Grin's behaviour and the shipped `PhaseEffects` literal are unchanged.
- **Decision — THE SPRITE FORGE (3b, `src/spritegen/parts/`):** a forged grunt's
  face is COMPOSED from hand-drawn parts, never synthesized (ADR-020 BY
  CONSTRUCTION — the WEAPON_ART precedent applied to whole enemies). Five part
  FAMILIES, each a `px`-only pixmap function on the 64-colour palette:
  SILHOUETTE (7 body shapes — blob/carapace/totem/wisp/lump/husk laid as
  hand-authored `contour` runs with 3-tone volume, ADR-020 rule 3, + `cabinet`,
  the one hard-edged man-made box for lockers/units, added on the user's art note
  — they stamp shared `Anchors`), MATERIAL (6 surfaces — chitin/iron/cloth/stone/ember/lacquer
  — the base ramp + a clustered motif with ≤1 dither seam, rules 1 & 6),
  ACCESSORY (6 faces — glare/dots/cyclops/grin/antennae/crown), WEAR ACCENT (5
  damage styles — dents/cracks/tatters/scorch/chips, clustered and ACCUMULATING
  across tiers), and REGION ACCENT (5 locales — fog/ochre/bog/velvet/dust, a
  whisper of place + the trim ramp). The COMPOSER (`composeEnemy(spec, wear)`)
  layers them in a fixed order → `outline()`; `(PartsSpec + seed)` → identical
  bytes forever (Prime Law 2, named streams). `proposeCandidates(id, role,
  chapter)` offers 5–10 seeded candidates per grunt from role pools keyed to the
  chapter's region. `ENEMY_BATTLE_ART resolves THROUGH partsSpec` (`forgedFaceArt`):
  a picked grunt wears the drums (tiers 0/1/2) like every shipped sprite, except
  its three textures are composed, not bespoke — `ensureForgedFaces` registers
  them in the LAB and BattleScene swaps `${sprite}_w1/_w2` on the HP thresholds
  unchanged. BOSSES + HEROES STAY BESPOKE (`forgedFaceArt` refuses a boss; the
  five kids are never forged). THE PICK IS A HUMAN ACT: `src/data/drafts/faces.ts`
  (`FACE_PICKS`) records the chosen `PartsSpec` verbatim (part ids + seed); the
  registry's `withFace` attaches it and repoints the draft's sprite/mini at UNIQUE
  `forgeface_<id>`/`forgemini_<id>` keys so a pick can never overwrite shipped art.
  The Sprite Lab is where the human picks — the SPRITE LAB → THE FORGE page
  (cycle candidates live, read the recorded pick at all three tiers) and
  `npm run art:facesheet` → `.shots/` (the cast-sheet precedent). The Ch.3
  roster (6 grunts) was picked WITH the user this session; Ch.4–10 follow the
  same act in their chapter sessions (unpicked drafts keep a borrowed placeholder).
  The validator sweeps the catalog BOTH directions (every pool part exists; every
  catalog part is reachable — no orphans), and proves every recorded pick
  composes a non-empty palette-conformant face whose three tiers DIFFER.
- **Decision — THE PARTY VITALS BAR (`src/ui/vitals.ts`, the user's UI decree):**
  one EarthBound bottom-of-screen panel per party hero (NAME, HP/PP cur/max, a
  thin colour-coded bar, a DOWN/HOMESICK tag), reading GS party state LIVE
  (persists nothing). The MENU draws it persistently and it YIELDS to the item
  DESCRIPTION PANEL (both bottom-dwellers — decoupled via the `mf-iteminfo-*`
  scene events, never overlapping, the §A4 readability law). The OVERWORLD pops
  the SAME strip as a quick glance on the free Y button (§B4 touch + pad + keys;
  the UIScene thumb-arc surfaces Y while the overworld is live; B / the same
  button / a tap dismiss it, debounced so the opening input can't re-close it).
- **Verification:** tsc + validate (unchanged 41-map waivers; the NEW
  sprite-forge sweep green — catalog both-directions + every recorded pick
  composes & reads the drums) + the forge's vitest green — 31 enemy-forge + 21
  registry + 19 boss-template + 11 NEW sprite-forge proofs (composer determinism
  & palette, the drums on every part, the catalog both-directions, the proposer,
  the bespoke law) atop the 471 M2 floor — + `vite build`. The boss drafts
  hash-pinned + schema-parsed + proven unable to masquerade (not in
  `BOSS_SCRIPTS`, drive no shipped §A7 enemy); the forged rosters pin to
  `buildRoster(ch, 1000+ch)` PLUS the 3b face layer (which touches only
  partsSpec/sprite/mini); the Grin's phases.test byte-identical. The vitals bar
  verified in the browser. 3b verified IN A LAB BATTLE: walking the Wintermoor
  draft registers the picked roster's composed faces (3 tiers + mini), then a
  forged grunt (Foggy Locker — carapace/iron/grin) renders its COMPOSED face on
  the field and at <33% HP swaps to the battered tier (visible cracks) through
  `wearSpriteKey` — the drums, composed. SHIPPED SPRITES BYTE-IDENTICAL (the
  shipped draws + ENEMY_BATTLE_ART rows untouched; wear.test still green).
  Browser dev-loop and `android:apk` paths untouched.
- **Consequences:** a chapter session (Prompts 29–34) now opens with the boring
  60% forged — a banded enemy roster, a boss script already firing its gimmick
  green on the machine — and spends itself on the SOUL (names, jokes, §A11 death
  lines, the hand-art face) at promotion. The phase machine gained four new
  archetypes without disturbing a shipped byte. The party can read its HP/PP at
  a glance from the menu or the overworld, by thumb or pad or key. And a forged
  grunt now has a FACE — composed from the part catalog, picked by the human,
  wearing the drums like any shipped foe — so a chapter session inherits not just
  a banded roster and a firing boss but a first-draft sprite for every grunt,
  spending itself on the soul (the hand-redrawn promotion) instead of the
  skeleton. Movement Three is COMPLETE; Movement Four (the chapter scaffold —
  ChapterManifest + `tools/chapter-scaffold.ts`) is the last seam of THE WORLD
  FORGE, queued for ADR-047.

## ADR-047 — S15g (Movement Four): THE CHAPTER SCAFFOLD — ChapterManifest + the retro/unlanded discipline

- **Date:** 2026-06-13
- **Status:** Accepted (THE WORLD FORGE, Movement Four of four — COMPLETE, the
  capstone). M1 built the kit + the map-quality gate (ADR-044); M2 the eight
  dungeon grammars + encounter pressure (ADR-045); M3 the enemy/boss/sprite
  forges (ADR-046). M4 ties them into a per-chapter SOURCE OF TRUTH and a
  one-command scaffold. THE WORLD FORGE is now whole.
- **Decision — THE PRIME LAWS STILL HOLD (ADR-044/045/046, unchanged):** the
  scaffold emits DRAFTS — a `src/data/drafts/chN/**` tree (dev-only, schema-
  parsing, EXCLUDED from MAPS / the canon manifests / the §B4 sweep) plus a
  `docs/chapters/chN/checklist.md`. Determinism is law: the plan's recipe seeds
  derive from a pure FNV-1a over the id (the `levelkit.test` fnv, on a string
  key) — `Date.now()`/`Math.random()` never appear under `src/levelkit/**`, and
  the Prime-Law-2 scan now covers `scaffold.ts`. Promotion is a human act; the
  shipped content (Ch.1–2) stays frozen.
- **Decision — THE CHAPTER MANIFEST (`ChapterManifestSchema` in src/schemas,
  data in `src/data/chapters.ts`):** the per-chapter source of truth the
  validator reads — `chapter`, internal `title` + `region` (§A11.6 bars chapter
  titles only from PLAYER-FACING UI; a dev manifest is exactly where they
  belong), `targetLevel` (§A6), `ember` (the Heartlight number) + the optional
  `heartlight` stem name where §A6 names it, the roster `band`, the §A5 `travel`
  leg, the `dungeon` (name + the forge `site` for Ch.3–10 / shipped `maps` for
  Ch.1–2), the `boss` (id + name + canon HP + the forge `template` or `'bespoke'`)
  + Ch.10's `minibosses`, the `settlements` (id + kind + draft style), the
  primary `maps`, and the §A10 `quests`. Schema refinements encode the canon
  invariants by construction: `ember === chapter` (§A2: ten Embers, one each),
  `band === chN`, and a shipped chapter must name live maps. Keyed `'1'`…`'10'`.
- **Decision — THE S14c RULE, MADE A TYPE (`status: 'shipped' | 'unlanded'`):** a
  SHIPPED manifest (Ch.1–2) is asserted AGAINST LIVE content — every map exists
  in MAPS, every settlement is tagged its kind, the boss drives a boss-flagged
  §A7 enemy at the canon HP with a BOSS_SCRIPTS entry (unless `'bespoke'` — the
  Tick), and the §A10 quests are live + tagged this chapter BOTH directions (a
  new quest must join the manifest, never ad-hoc). An UNLANDED manifest (Ch.3–10)
  is asserted against the forge DRAFTS — it names a real dungeon `site`, its
  `forgedBandIds(ch)` roster is non-empty, its boss rides a `DRAFT_BOSS_SCRIPTS`
  draft and is NOT yet a shipped enemy (Prime Law 1), and it carries no live maps
  yet. The §A6 boss-HP ladder pins against the forge's own `BOSS_HP`/`MINIBOSS_HP`
  constants (one source, no drift); the §A6 finale shell (6,000) is bespoke. And
  BOTH DIRECTIONS on the forge boss drafts: every `DRAFT_BOSS_ID` is claimed by
  exactly one unlanded chapter (never strand a draft). The day a chapter lands,
  its session flips `status` → `'shipped'`, fills the live `maps`/`dungeon.maps`/
  `quests`, and the live assertions switch on in the same commit — "asserted as
  each lands."
- **Decision — THE SCAFFOLD (`npm run scaffold -- chN`):** the PLAN is a pure
  library (`src/levelkit/scaffold.ts`, vitest-pinned — the mapcheck/pressure
  precedent: math in the lib, IO in the tool); `tools/chapter-scaffold.ts` reads
  the manifest and writes the tree. Per chapter it emits the dungeon-grammar
  recipe (+ a `buildChNDungeon` thunk — recipe over serialized bytes, Prime Law
  2), the forged roster re-export (`FORGED_ROSTERS[N]`), the forged boss draft(s)
  (`DRAFT_BOSS_SCRIPTS`), the settlement recipes (+ a `generate` thunk), a barrel,
  and a checklist that walks the session from "promote the dungeon/roster/boss/
  settlements/quests" to "flip the manifest + append the ADR." Ch.6 (Zanzibel /
  `laughing_ruins`) is the worked example, committed under `src/data/drafts/ch6/`.
- **Verification:** tsc + validate (now prints `10 chapter manifests (2 shipped ·
  8 unlanded)`; Ch.1–2 assert against live MAPS/ENEMIES/QUESTS/BOSS_SCRIPTS,
  Ch.3–10 against the forge drafts, both directions on quests + boss drafts) +
  596 vitest green (the +35 scaffold proofs: every manifest parses, the plan is
  deterministic, every chapter emits the complete six-file tree, and every
  unlanded chapter's dungeon recipe BUILDS a valid draft + its settlement recipes
  parse + its boss draft is forge-backed + its roster is non-empty). The ch6 tree
  typechecks and is excluded from canon (drafts can never overwrite shipped art).
  `vite build` intact.
- **Consequences:** a chapter session (Prompts 29–34) now opens with ONE COMMAND
  and a complete draft tree + a checklist — the boring 60% (a banded forged
  roster, a boss firing its gimmick green on the machine, a BFS-proven dungeon in
  the right §A9 band, settlement recipes, the quest slots named) is generated, so
  the session spends itself on the SOUL: the §A11 dialogue, the hand-redrawn art,
  the boss tuning. The manifest is the contract the validator holds every chapter
  to — before it lands (the forge has the drafts) and after (the live content
  matches). THE WORLD FORGE is COMPLETE across all four movements: a world session
  now SCAFFOLDS (drafts) → POLISHES (promotion) → FLIPS (the S14c status) → and
  the validator asserts the new live content forever. The floor only rises.

## ADR-048 — S15h: THE FIFTH HERO — Pippa Quill (the cast becomes five)

- **Date:** 2026-06-13
- **Status:** Accepted (canon-filling, not invention: GAME_BIBLE §A3 has named
  FIVE heroes since the 2026-06-12 amendment, but the code carried four. This
  lands the roster + schema + sprites + arms gear + the save migration NOW so the
  Ch.5 Minimus session wires Pippa into the party as a build step, never a
  scramble. ADR-047 is reserved for the World Forge's sprite-part catalog / M4 —
  already referenced across `src/spritegen/parts/**`, `drafts/faces.ts`, and the
  validator — so Pippa took the next free number, 048.)
- **Decision — THE ROSTER IS FIVE, BY CONSTRUCTION:** `HeroIdSchema` gains
  `'pippa'` under the frozen-id discipline of ADR-031/023 (she is `pippa` from
  the start — no rename debt). Every `Record<HeroId>` is now exhaustive over
  five: `HEROES`, `heroNames` (the save + the New-Game choices), `TEXT_VARS`
  (a `{pippa}` token Ch.5 dialogue reads). The content validator's hero pin
  reads FIVE both directions, and a Pippa "no Vibe" cross-check joins Milo's.
- **Decision — NO VIBE, NO PP (the second Jeff):** §A3 says Pippa has no Vibe.
  Like Milo she carries `base.vibe 0` and `pp.base 0`; her six §A3 abilities
  (Pinpoint Mark / Royal Rally / Pocket Patch on-join, Big-Little Focus the Ch.5
  Milo combo, Scale Step L30, Bellwether L44) ride kind `'physical'` at 0 PP —
  competence, not the old light. Their statuses (`marked`/`rally`/`evasion`/
  `focus`/`morale`, plus `cure` on Pocket Patch's small heal) are the Ch.5
  battle hooks; the faces REUSE existing fx families (scan / sparkle_rain /
  barrier), so no `STAGE_ANIM` row and no `battle/fx.ts` builder changed. The
  support mechanics flesh out when she joins — the data, schema, and faces exist
  and validate now.
- **Decision — SPRITES ARE ONE SPEC (the ADR-021 pattern, fifth time):** Pippa's
  overworld sheet, 32×32 battle bust, rear-3/4 stage battler, AND mourning angel
  all derive from one hand-authored `CharacterSpec` in `CAST` (royal-purple
  blazer livery, gold braid, a Minister's Ribbon sash `detail`, a no-nonsense
  page bob). The boot factory's hero loop and the angel-anim list gained
  `'pippa'`; everything else is generated. She is visible in the Sprite Lab.
- **Decision — THE STARTING FIVE (ADR-034 renamed):** the Bible's §A8 arms set
  was already amended to "THE STARTING FIVE" with Pippa's Minister's Ribbon, so
  the code renamed `STARTING_FOUR`→`STARTING_FIVE` (the const + `_IDS`, the
  validator manifest both directions, the Overworld `startingFiveHandoff`, the
  tests, and PERMIT's shipped "four pieces"→"five pieces" line — a factual count
  sync with the voice untouched). The handoff already carries a not-yet-joined
  hero's piece to any present carrier via the `handed` raincheck, so Pippa's
  Ribbon rides a Ch.1–2 carrier and waits for Ch.5 exactly like Milo's and
  Dorin's pieces do today. **The Bible names the Ribbon "Luck+6" — but the
  `arms` slot reads speed/guts; luck rides charms (ADR-037).** So the arms piece
  carries **Speed +6** (the tiny tactician is quick; Mia and Milo, the other
  support heroes, also got Speed), and Pippa's canon Luck+6 is reserved for her
  SUNDAY SET charm — the links set ships its fifth when that session lands
  (the chapters-3+ "assert it as it lands" discipline, applied to a reward set).
- **Decision — SAVE v7 → v8 (the registry, ADR-015):** one step backfills
  `heroNames.pippa` from the canon default. Pippa is NOT added to the party (she
  hasn't joined — Ch.5 does that via a join scene/flag), so the existing four
  ride through untouched, exactly like every save field a later hero never
  wrote. Old saves load unbroken; a custom-named v7 save keeps its four names
  and only GAINS Pippa's.
- **Verification:** tsc + validate (now `5 heroes · 43 abilities · 39 items`,
  the 41-map waivers unchanged) + 560 vitest green (the +14 over ADR-046's 546:
  the v7→v8 migration trio, the eighth New-Game screen, the five-hero roster
  pin, the fifth arms read-through) + `vite build`. The existing four are
  byte-identical — their `CharacterSpec`s, `HEROES` rows, and the four shipped
  STARTING FIVE pieces are untouched (the only `heroes.ts` deletion is the
  header comment's "Four"→"Five"); Pippa's textures are additive at boot.
- **Consequences:** the Ch.5 Minimus session opens with Pippa's roster slot,
  schema, sprites, arms gear, name screen, and save plumbing already proven, and
  spends itself on the SOUL — her join scene, her §A11 voice, the Big-Little
  Focus combo wiring, her weapon line (Stamp Sling → … → Royal Red Pen), and the
  battle mechanics behind her five statuses — per Appendix rule 4. Her SUNDAY
  SET charm (the canon Luck+6) lands with the links-set expansion. The roster,
  the layouts that iterate it, and the validators all prove five today.

## ADR-049 — S15h: THE WORLD BLOCK — the towns grow up, the forge becomes a district library

- **Date:** 2026-06-13
- **Status:** Accepted (the user's scale decree: Otterbrook and Brickton should
  feel BIGGER and lived-in. The S15g LEVELKIT earned the right — its settlement
  grammar already builds whole towns deterministically; this points it at the
  TWO SHIPPED maps and grows them without re-drawing or re-walking the cores.)
- **Decision — THE GROWTH LAW (the spine):** each frozen core stays itself. The
  untouched `buildOtterbrook()` / `buildBrickton()` run on their current seeds and
  are COPIED byte-for-byte into the top-left of a larger grid; every growth write
  lands strictly OUTSIDE the core rectangle (`x ≥ CW || y ≥ CH`), so not one core
  cell can move. Growth is APPENDED on NEW named streams (`Streams(19951)` etc.),
  identical every boot. The FORGE lays the bones (streets, blocks, facades,
  furniture, negative space); the HUMAN builds the soul (the landmark interiors,
  every NPC + line, the stories). Prime Laws 1–3, applied to canon maps.
- **Decision — THE FORGE AS A DISTRICT LIBRARY (`buildDistrict`):** `buildCity` /
  `buildTown` each build a WHOLE map from a blank grid — too coarse to graft onto
  a shipped core. The new `buildDistrict(grid, region, S, opts)` is the same
  grammar made STITCHABLE: it lays a `'grid'` district (the buildCity block law)
  or an `'organic'` one (buildTown's bending lanes) INTO a sub-rectangle of an
  existing Grid and returns only the props/signs it added. Its load-bearing
  promise is REGION CONTAINMENT — it writes nothing outside `region` (crosswalk
  stripes clamp; a region-bounded sprinkle only fills the growth's `'.'`), pinned
  in `district.test.ts` against a sentinel grid. It is NEW code beside
  `buildCity`/`buildTown` (their bodies are untouched, so the levelkit FNV pins
  hold) and pure-seeded (the no-`Math.random` scan still passes).
- **Decision — BYTE-IDENTICAL, PROVEN (`world_block.test.ts`):** the maps_ch2
  "two builds byte-identical / the live MAPS entry matches a fresh build" pattern,
  for BOTH towns, PLUS the stronger proof: the grown grid's top-left region equals
  the untouched core build char-for-char, and every core prop/npc/sign keeps its
  coordinates (the merged arrays start with the core's, unchanged). A future change
  that disturbs a frozen core fails HERE, loudly.
- **Decision — THE SEALED-CORE EXCEPTION (Brickton's docks door):** Otterbrook's
  edges are permeable tree-lines, so its new south + east blocks join through
  open grass. Brickton's 2077 core is a WALLED box with one opening — street B's
  east gap (col 71, rows 21-23, already road), occupied by the docks door. To let
  the city flow east into the sprawl, that ONE door RELOCATES to the grown city's
  new east edge (the port moved out with the city). The grid + every prop stay
  100% byte-identical; the docks stay reachable; the validator's "some door →
  brickton_docks" still holds. This is the single, documented exception to
  byte-for-byte, isolated to one door and pinned in the test.
- **Decision — OTTERBROOK STAYS A TOWN, BRICKTON STAYS A CITY:** §A5's ladder
  does not bump the sleepy hometown — grown Otterbrook keeps `settlement: 'town'`
  (organic, never a strip) and is NOT swept by ADR-012. Brickton keeps
  `settlement: 'city'` and `cityViolations(MAPS.brickton) === []` is asserted AT
  144×76 — the maps.test sweep runs on it unexempted, and it clears because the
  core's streets (≈70 road cells) still exceed 40% of the wider grid, the avenue
  still rises ≥12, and the faces only multiply.
- **Decision — PERF: literal 4×, the budget raised, the real gate re-walked.**
  The user chose literal 4× over capping at the old envelope. Brickton grew to
  144×76 = 10,944 tiles (exactly 4×); `bench-map.ts` raised `MAX_TILES` 4000→12000
  and `MAX_PROPS` 260→320. The insight that licenses it: the tilemap layer CULLS
  offscreen tiles, so total tile count is a coarse proxy — the real p99 lever is
  PROP count (every prop is a display-list image), and grown Brickton holds 153
  props (≈ the S14d ~150 reference). The authoritative browser-pumped p99 ≤ 8.3ms
  walk was re-run on both grown maps: **Otterbrook p99 0.3ms, Brickton p99 0.2ms**
  — the bigger world holds the real gate.
- **Decision — MEADOW MILE + THE ORIENTATION GATE (Movement 2):** `buildRoute`
  lays the foot road (promoted to canon: west door → Otterbrook's exported
  `OTTERBROOK_EAST_GATE`, the east edge a TRIGGER not a door). Three Blazer-Smiler
  proctor "exercises" earn the `visitor_badge`; the gate opens on
  `(visitor_badge || bus_ride_done)`, so the bus AND the foot route both lead in
  (the grandfather clause). The retry law rides the engine's defeat→respawn and a
  per-exercise flag (`orient_1..3`): a loss or a flee never dead-ends — the gate
  waits, won exercises stick.
- **Decision — THE TWO STORIES, REAL BEATS (Movement 3):** THE BRICKTON MINUTE
  and THE WARM DIAL TONE keep their EXISTING gate flags (`brickton_clock_goal`,
  `brickton_dial_goal`) but the walk-on-a-rect toast scenes become staged beats —
  the clock strikes and the block turns and the clock lady reads you the city and
  the Locket takes the tick; the phone rings and the quarter man names the note
  and the dial tone folds into the first Heartlight (a beat of home, §A4.4). Same
  flags, same gating; richer hand-authored dialogue + paced camera.
- **Decision — THE FACADE SKIN IS A DRAFT (ADR-020 holds):** the new districts'
  buildings reuse the shipped `bldg_*` catalog as the draft skin (drawn art is a
  hand job; promotion adds region facades). City Hall wears the neutral brick
  skin + an OTTERBROOK CITY HALL plaque (a bespoke facade is a promotion item) —
  no skin whose baked signage fights its name (the forge-faces-match-the-name
  rule, applied to a landmark).
- **Verification:** tsc + `npm run validate` (now 43 maps: map-quality 38 clear +
  5 waived, pressure 41 + 2; 361 dialogue scripts) + full vitest green (the +23
  over ADR-048: `district.test` 7, `world_block.test` 16) + `vite build`. The
  browser p99 walk + `.shots/` of both grown maps (`world_otterbrook_cityhall`,
  `world_otterbrook_pond`, `world_brickton_downtown`, `world_brickton_maple_heights`,
  `world_brickton_south_gateway`, `world_meadow_mile_orientation_gate`). The 1995
  + 2077 cores are byte-identical (proven), all shipped flags + the dos doorstep
  + the Cage gate + the bus spawn untouched; the browser loop and `android:apk`
  paths unchanged.
- **Consequences:** every future "grow a shipped map" or "lay a new district" is
  now `buildDistrict` + a region + a copy-the-core wrapper + the byte-identical
  test — the World Forge has a district library, not just a town factory. Promotion
  items left for their sessions (per Appendix rule 4): bespoke hand-drawn CITY
  HALL / MAPLE HEIGHTS / civic facades (the catalog skins ship as the draft), and
  any deeper questline hung off the new Brickton districts. The grown towns, the
  road, the gate, and the two rebuilt stories all walk + prove today.

## ADR-050 — S15i (Movement One): THE BUILDING FORGE — the catalog grows up, the facade walk-through is fixed everywhere

- **Date:** 2026-06-13
- **Status:** Accepted (the user's S15h review: the towns grew but the buildings
  are too SMALL for the 16×24 characters and too SAME, and a generated facade can
  be WALKED THROUGH — the bug they hit on MAPLE HEIGHTS. Movement One of THE
  WORLD, DEEPENED fixes the catalog + the collision; Movements Two+ grow the maps
  that wear it.)
- **Decision — THE FACADE SOLID IS FIXED EVERYWHERE (the walk-through bug):** the
  levelkit's `facadeSolid()` used `{oy:26, h:H-38}`, leaving the top ~26px of every
  generated facade walkable — the "walk through the building at some angles" the
  user hit. It now returns `{ox:0, oy:10, w:wTiles*16+2, h:H-22}`, BYTE-FOR-BYTE the
  solid Brickton core's `place()` has used since the same fix landed there: the
  whole facade blocks (mega-buildings included), the bottom stays at `H-12` so the
  door zone is still reachable, and the foot-anchored depth-sort occludes a hero
  pressed against the back. **The load-bearing invariant:** `oy + h = H - 12` under
  BOTH the old and new solids, and `faceBands()` keys on `p.y*16 + oy + h + 12`,
  which reduces to `bottomPx` — height-independent. So `cityViolations` and every
  ADR-012 sweep are UNCHANGED by the fix (and by any height increase); only the raw
  FNV bytes of facade-bearing drafts shift. Re-pinned in `levelkit.test.ts`:
  `zanzibel`, `foggybottom`, `lilleby` (cities) + `brickmore_heights` (a district);
  the faceless route/interior drafts and all eight dungeons stayed byte-identical.
- **Decision — THE HEIGHT LADDER GROWS UP + MEGA-BUILDINGS:** `cityBuildingHeight`
  and `CityBuildingOpts.upperRows` widen from the `1|2|3` union to `number`
  (`facadeSolid`/`placeFacade` take `u: number`); the frozen `1|2|3` cores in
  maps.ts / maps_ch2.ts still satisfy it. MEGA-buildings are `upperRows ≥ 11`
  (`H ≥ 220px`, ~14 tiles) — TALLER than the 225px viewport, so a hero at the foot
  cannot see the top. No camera clip is needed: Phaser culls the off-screen rows,
  and depth = `p.y*16 + img.height` (the foot) means the tall body draws OVER a
  hero behind/beside it. The shipped towers: `bldg_tower_glass` 98×236,
  `bldg_tower_arms` 98×236, `bldg_tower_corp` 114×252.
- **Decision — NEW FACADE FAMILIES, NOT FIVE RESKINS:** `drawCityBuilding` gains
  PURELY ADDITIVE family flags (an unset building draws byte-identical, so every
  shipped Brickton + Puerto Sol sprite is untouched): `tower` (pilastered
  curtain-wall bays + ribbon windows + a setback ledge + a rooftop water-tank
  crown), `balconies` (a slab + rail per floor — apartments), `marquee` (a bulb-lit
  theater canopy + brass poster cases), `colonnade` (a ground-floor arched market
  arcade), `portico` (fluted civic columns + a parapet pediment), `neon` (a glowing
  tube sign band). Thirteen new sprites register in `spritegen/index.ts`:
  brownstone · neon · theater · civic · market · apartments · office · warehouse ·
  deptstore + the three mega towers — all in the Mother 2 palette under ADR-020
  discipline (flat fills, deliberate marks, no noise).
- **Decision — THE CATALOG IS DATA (`BUILDING_DIMS`):** the pre-S15i forge picked
  a facade's story count from a RANDOM `S.range(1,3)`, independent of the sprite it
  chose — tolerable when every skin was 1-3 stories, FATAL for a mega (a 236px
  sprite placed as if 60px tall sinks 144px through the street). So every
  forge-eligible facade's true `{w, u}` is now recorded in `BUILDING_DIMS`
  (kit.ts), with `facadeDims()` + `isMega()` helpers, so the grammar can place each
  facade at the size it was actually DRAWN. Movement Two reads this.
- **Decision — AUTHOR + PROVE NOW, WIRE INTO THE GRAMMAR NEXT:** Movement One ships
  the catalog and the collision fix, proven. WIRING the bigger/mega skins into
  `buildDistrict` — where a tall facade must not poke up into a frozen core copied
  just ABOVE its region — is Movement Two's living-map upgrade (catalog-driven
  placement + a mega pass + the nook/underground/woods grammar + the Otterbrook /
  Brickton / Puerto Sol re-grow). Until then the grow functions still cap
  `maxStories: 2`, so no frozen core is disturbed by this movement.
- **Verification:** tsc + `npm run validate` (43 maps, unchanged) + full vitest
  **619 green** (the four facade-bearing levelkit hash pins re-pinned; no other pin,
  `world_block`, `maps`, `district`, or `scaffold` test moved — `faceBands` proven
  height-independent). The out-of-game contact sheet `.shots/buildings_s15i.png`
  (new `npm run art:buildings` → `tools/render-buildings.ts`) renders the whole
  catalog through the real `drawCityBuilding()` with a 16×24 hero block per row for
  scale: the families tower 3–5× the hero, the megas ~10× with tops past the
  viewport. The browser loop + `android:apk` paths are untouched.
- **Consequences:** the forge has a real, varied catalog with off-screen megas, and
  the walk-through bug is gone from every generated facade (hashes re-pinned).
  Movement Two now has the skins AND `BUILDING_DIMS` it needs to grow maps that
  read alive (the living-map law + the size law land with their own ADRs there).

## ADR-051 — S15i: A FACADE COLLIDES AS ITS REAL DRAWN FOOTPRINT (texture-true collision)

- **Date:** 2026-06-13
- **Status:** Accepted (user: "many buildings where the character just moves straight
  through.") The S15i facade families + colossi exposed a latent bug across the whole
  game: a building's COLLISION did not match the building you SEE.
- **Root cause:** map data places a facade at a story count `u`, and the solid was
  `facadeSolid(w, u)` = `{oy:10, h:cityBuildingHeight(u)-22}`. But the FORGE / grown
  grammar (`buildDistrict`→`placeFacade`) picks `u` from `S.range(1,3)` INDEPENDENT of
  the sprite it chose, and even a shipped core could place a 3-story sprite at `u:2`.
  When the sprite's true pixel height exceeds `44+u·16`, the solid is far too SHORT —
  the drawn building's lower body has no collision, so the hero walks through it. The
  earlier `facadeSolid` formula fix (ADR-050) corrected the SHAPE but not this
  DATA-vs-SPRITE mismatch.
- **Decision — derive collision from the RENDERED TEXTURE, at scene build.** In
  `OverworldScene.buildProps`, every `bldg_*` prop's solid is rebuilt from its LOADED
  texture by `facadeSolids(p, img.width, img.height)`. Collision is therefore EXACTLY
  what is on screen, no matter what `u` the data used. Non-facade props keep their
  hand-tuned data solids (furniture you brush past). The collision RESOLVER is unchanged
  — it was already correct (axis-separated `tryMove` slides on contact; `collides()` is
  AABB over solid tiles + prop rects). The bug was the rects, not the math.
- **Decision — SOLID EXCEPT THE DOORWAY (multi-rect, the refinement).** A single rect
  to the doorstep still left a walkable strip along the storefront base and made the
  door a "solid + bottom-edge zone." `facadeSolids` now returns the full drawn footprint
  (eaves at `FACADE_CAP=10` down to the FOOT) MINUS the door column: a doorless facade
  is one block; a doored facade is left-wall + right-wall + a lintel over the door,
  leaving only the door column open (height `DOOR_OPENING=18`) so you WALK IN and the
  lintel stops you through — never through a wall. Proven by vertical `collides()` scans:
  a wall column blocks foot-to-eaves continuously; the door column is open below the
  lintel only.
- **Decision — OBJECT PERMANENCE IS INHERITED.** Roamers (`updateRoamers`) and patrols
  (`patrolMove`) already test the SAME `collides()` → `this.solids`, so once the rects
  match the buildings, enemies are blocked too (the user's "enemies pass right through
  buildings" was the same short-solid root cause — no separate code, verified the
  enemy-sized box is solid inside a building).
- **Decision — the ENTRANCE follows the sprite too.** A re-fitted facade's doorstep
  moves with it, so the door zone is re-derived from the texture
  (`oy = img.height-14`) into `facadeDoorBox`; `checkDoors`, the doormat, and the
  night porch-glow all prefer it. Doors that already matched their sprite (every
  shipped door — only door-less `bldg_brickmore` drifts in core) are byte-identical in
  behaviour; only the mismatched grown/generated facades move, and their solid + door
  move together so entry still admits you.
- **Decision — DATA UNTOUCHED, so the freeze holds.** This is a RUNTIME derivation;
  no `MapDef`/`PropDef` solid is rewritten. `world_block.test` (byte-identical cores),
  the levelkit FNV pins, and `cityViolations` all read the DATA and are unmoved — no
  re-pin. The fix needs no frozen-core edit and reaches shipped + grown + generated
  maps alike.
- **Decision — production tooling, fully wired.** A dev-only AUDIT logs every facade
  whose data solid drifted from its texture (caught loudly, not shipped), and a dev
  COLLISION OVERLAY (`window.mfSolids(true|false)`) paints every solid rect (red) and
  entrance zone (cyan) over the world so collision is eyeballable against the sprites.
  Both are gated behind `import.meta.env.DEV` (inert in production).
- **Verification:** tsc + full vitest **619 green** (runtime-only; no test pins move).
  Live proof on grown Brickton: of 41 `bldg_*` facades, **all 41** now carry a solid
  that matches the texture footprint AND reaches the building's true foot; **19** had
  a drifted data solid (the walk-through ones) and were re-fitted — the shipped-core
  faces (starmart/brickmore/hospital/dept) already matched and are unchanged. Doors
  still admit (zone + doorstep move together). Browser loop + `android:apk` untouched.
- **Consequences:** "collision = the drawn footprint" is now the law for every
  overworld building, today and as Movement Two grows the maps — a facade can never be
  walked through regardless of how the grammar placed it, and `window.mfSolids()` is
  the standing QA lens for it.

## ADR-052 — S15i: THE DOOR RE-ENTRY COOLDOWN (no more door ping-pong)

- **Date:** 2026-06-13
- **Status:** Accepted (user: "I keep getting sent back and forth through the hotel and
  the main overworld... there should be like a second delay after you enter a room.")
- **Root cause:** a door drops you at the target's spawn `(tx,ty)`, which sits on/at the
  RETURN door's zone. `checkDoors` runs the very next frame, finds you inside that zone,
  and sends you straight back — an infinite bounce, and any "instant re-enter the door
  you came from" is jarring even when it terminates.
- **Decision — a brief door LOCK on every arrival.** `OverworldScene` carries
  `doorCooldown` (ms), set to `DOOR_REENTRY_MS = 900` in `create()` (every map arrival —
  door, bus, respawn), counted down in `update()`. `checkDoors()` early-returns while it
  is > 0, so NO door (map-edge or facade) can fire until it elapses. The player gets a
  beat to catch their bearings, and the door they came through cannot bounce them back.
  Triggers/edges are unaffected (they are flag-gated scenes, not bounce-prone).
- **Verification:** live — arriving in `otterbrook_cityhall` sets `doorCooldown≈733ms`;
  standing squarely on the return door for ~0.4 s stayed INSIDE (no bounce); clearing the
  cooldown and standing on it fired normally (→ `otterbrook`). So the lock blocks the
  ping-pong without breaking real door use. tsc + full vitest **619 green**.
- **Consequences:** every room entry now has a sub-second settle; if a future map needs a
  different feel, tune `DOOR_REENTRY_MS` (one constant). Pairs with ADR-051 so collision
  + transitions are both robust at the building boundary.

## ADR-053 — S15i: THE BUILDING SPACING LAW (catalog-sized, never seal a walkway)

- **Date:** 2026-06-13
- **Status:** Accepted (user, with a screenshot of grown Otterbrook: two buildings
  touching across a path the hero should walk — "the spacing must be such that anywhere
  there is a walking area there is adequate spacing between buildings.")
- **Root cause:** now that collision matches a facade's TRUE drawn footprint (ADR-051),
  the grammar's old placement was wrong in two ways: it placed each facade at a GUESSED
  size (`wTiles = S.range(4,6)`, `u = S.range(1,3)`) and kept only a fixed `abs(Δx)<5 &&
  abs(Δy)<3` separation on the top-left anchor — which ignores real widths and is far too
  short for a 6-tile-tall building. Result: scattered (organic) buildings overlapped and
  sealed the lane between them.
- **Decision — place at TRUE size + keep a walkable margin.** `buildDistrict` replaces
  `districtFacade` with `tryPlaceFacade`: it sizes every facade from `BUILDING_DIMS`
  (`facadeDims`) so it renders + collides at exactly the footprint we reserve, and it
  places the lot ONLY if that footprint (a) sits inside the region top, (b) stays inside
  the region's right edge, and (c) keeps `PLACE_MARGIN = 2` walkable tiles from every
  already-placed building (`hasGap`). A reserved door waits for a fitting lot rather than
  forcing an overlap. The catalog is filtered to `u ≤ maxStories` so a tall facade can't
  poke into a core copied above. The organic branch over-generates candidates
  (`(rw·rh)/45`) so the spacing CAPS density instead of leaving the district bare.
- **Decision — the law spans REGIONS too.** `DistrictOpts.occupied` is a shared
  footprint list; `growOtterbrook` / `growBrickton` pass ONE array to all of a map's
  `buildDistrict` calls, so no two buildings touch at a region seam either.
- **Decision — CITY ROWS are not a violation.** Buildings that LINE a street (a city
  block — adjacent storefronts sharing a wall, the path being the STREET in front) are
  correct and untouched. The rule targets walkways BETWEEN scattered buildings; the
  grammar's streets/lanes are the walkways and buildings face them. The shipped Brickton
  core's downtown row (bagels↔arcade2) is exactly this — a hand-authored, byte-identical
  block, left as-is.
- **Verification:** tsc + full vitest **619 green**, NO re-pin (the levelkit hashes test
  `buildCity`/`buildTown`/`buildVillage`; `buildDistrict` is the shipped-growth path,
  re-proven by `world_block` — cores byte-identical, prop counts within the raised caps,
  `cityViolations` clear). Live: grown Otterbrook = 7 facades, **0 overlaps, min gap 2
  tiles**; grown Brickton = 34 facades, **0 grown overlaps** (the lone overlap is the
  frozen-core storefront row above). The screenshot's sealed path is gone.
- **Consequences:** the spacing law is the placement contract for ALL future growth
  (every shipped area is grown via `buildDistrict` per ADR-049), so a generated map can
  never wall off a path. Draft generators (`buildCity`/`buildTown`/`buildVillage`, LAB
  only) can adopt `tryPlaceFacade` when promoted. Movement Two's nook/underground/woods
  grammar inherits it.

## ADR-054 — S15i (Movement Two): THE LIVING-MAP LAW — the mega pass + the nook/woods/sewer verbs

- **Date:** 2026-06-13
- **Status:** Accepted (the S15i "MOVEMENT 2+" prompt: "maps that breathe — the grammar
  upgrade." The prompt asked to append this as "ADR-051" and the size law as "ADR-052",
  but Movement One already consumed ADR-050/051/052/053; per the drift rule the live
  numbers are **ADR-054** (this) and **ADR-055** (the size law). Same laws, next free ids.)
- **Context:** §B4's deepened building laws want two things the S15h grammar couldn't do:
  MEGA-buildings that are COMMON (towers whose tops run off-screen, `u ≥ 11`, `H ≥ 220px`)
  + landmark colossi, and NOOK variety (shacks/alleys/lots/courtyards/rooftops, wooded
  pockets, underground/sewer stretches) so a grown map never reads squared-off. Catalog-
  sized placement (ADR-053) already lands every facade at its true `BUILDING_DIMS`; this
  ADR adds the height register + the variety verbs on top of it.
- **Decision — THE MEGA PASS (`DistrictOpts.mega`).** A grid/organic district may run a
  pass, BEFORE its row pass, that stands the catalog's MEGA facades (`isMega`: `u ≥ 11`)
  backing onto the region's DEEPEST street, where the most open sky is. It pre-filters the
  catalog to megas that actually FIT (narrow enough to keep a `PLACE_MARGIN` lane, short
  enough that `bottomPx − cityBuildingHeight(u) ≥ regionTop·16`), so a pick is never wasted
  on an oversized colossus, and shares the same `occupied` list — so the row pass spaces
  its shorter walk-ups into the gaps and the result reads as towers among storefronts. The
  `top ≥ regionTop` guard means a tower can never poke above the region (into a core copied
  just above it) or sink through the street. `maxStories` relaxes from `1|2|3` to `number`
  (the height cap for the ROW pass only; megas are the mega pass's job). Off by default —
  every prior `buildDistrict` caller is byte-identical (the levelkit FNV pins never move,
  since `generate()` routes to `buildCity/…`, never `buildDistrict`).
- **Decision — THE VARIETY VERBS.** `buildWoods` (a clearing path + a glade reward, trees
  off the path so it's always walkable), `buildUnderground` (a brick-walled sewer stretch
  with a solid water channel crossed at plank gaps), and `placeNook(kind)` for the five §B4
  nook kinds. All are region-contained + deterministic (the `buildDistrict` contract);
  `district.test` pins containment + determinism for each. They return a `DistrictResult`;
  a session wires the door / hidden reward at promotion. A present belongs in a nook.
- **Decision — PER-AREA SKINS WIRED.** `growOtterbrook` / `growBrickton` pass
  `AREA_SKINS[area]` as each district's `catalog`, so Otterbrook draws ONLY its warm low
  brownstones/shops/cafés (≤3 stories — a sleepy town never towers) and Brickton ONLY its
  cool glass/neon/theaters + the COMMON mega-towers + a colossus. No two areas read alike.
- **Verification:** tsc + **632 vitest green** + `vite build`. `district.test` +11 (mega
  pass lands a tower in-region; off-by-default places none; the three verbs are contained +
  deterministic). Grown maps re-proven by `world_block` (cores byte-identical) and an
  in-game collision BFS (tile **+ prop** solids) from each foot-spawn: every door, NPC, and
  interior reachable — the colossus does NOT strand the docks. Brickton: 4 megas (3 off-
  screen towers downtown + the Starfall Spire), 146/320 props; Otterbrook: warm low skins +
  a hidden woods rest, 141/260 props. `cityViolations` clear (`faceBands` is bottomPx-based,
  so height never moves the sweep — confirmed).
- **Consequences:** the mega pass + verbs are the grammar for every roomier grow to come
  (Puerto Sol, the foot-walk legs, the cage park, the golf resort). Brickton's mega density
  is capped by its tight shipped layout (the avenue walls the one tall pocket at ~26 wide);
  a future Brickton expansion or the larger fresh areas will scale the read up.

## ADR-055 — S15i (Movement Two): THE SIZE LAW — maps vary, mostly grow, and EARN their size

- **Date:** 2026-06-13
- **Status:** Accepted (§B4 "MAPS BREATHE, AND MOSTLY GROW"). Paired with ADR-054 (the
  grammar) — this is the discipline that governs how big a map gets and what fills it.
- **Decision — vary in size + transition count; mostly grow.** Going forward maps vary in
  footprint AND in door/transition count, and most keep getting LARGER unless the aesthetic
  demands smaller (Hawaii reads claustrophobic by design). Size is never growth for its own
  sake.
- **Decision — EARN the size with content.** Every grown area must pay for its space:
  a task/quest or two, purposeful §A11 NPCs (one obsession each), a hidden reward in a nook,
  a cutscene beat. New space with nothing to do is empty and is a violation. (This pass:
  Otterbrook's woods nook earns its corner with a hidden rest + a birdwatcher; Brickton's
  high-rise downtown + colossus earn theirs with the spire-gazer + downtown-suit + signage.
  The deeper quest/cutscene content is the Movement 3/4 follow-on.)
- **Decision — PROP COUNT is the p99 lever.** The tilemap CULLS offscreen tiles, so total
  tile count is a coarse load proxy; the real per-frame cost is PROP count (every prop is a
  display-list image — `bench-map.ts MAX_PROPS = 320`). Mega-buildings are FEW props for
  MANY tiles, so they're the cheap way to grow a skyline — lean into them. The authoritative
  gate stays the browser-pumped XL walk at p99 ≤ 8.3ms (QA pre-flight); `world_block` pins
  the per-map prop caps (Otterbrook ≤260, Brickton ≤320).
- **Verification:** the grown maps hold their caps (Otterbrook 141/260, Brickton 146/320),
  tiles within the envelope (Otterbrook 3920 ≤4000, Brickton 10944 ≤12000), cores byte-
  identical. tsc + 632 vitest + build green.
- **Consequences:** the size law is the Definition-of-Done check for every future grow:
  bigger than before (unless the place wants smaller), every new acre earning its keep,
  prop count watched as the real budget.

## ADR-056 — S15i (Movement Three): THE LONG WALK — Otterbrook → Brickton on foot, deepened

- **Date:** 2026-06-13
- **Status:** Accepted (the S15i "MOVEMENT 3+" decree: the foot journey between the
  towns should be a real multi-screen walk, not one connector screen.)
- **Context:** S15h promoted MEADOW MILE to canon as a SINGLE `buildRoute` screen
  carrying both the Task-0 meteor roadblock AND the orientation gate. "Deepen the
  world" wants the walk to be a journey: town park → woods → second meadow →
  overpass → the city — each leg its own feel, with rests, presents, a Ch.1.5
  enemy band, and cutscene beats.
- **Decision — FOUR LEGS, west→east.** `buildLongWalk()` (maps.ts) builds and wires
  the chain: **meadow_mile** (the town-edge meadow, keeps the meteor roadblock) →
  **meadow_woods** (WHISPERWOOD, a `buildWoods` forest) → **meadow_far** (THE FAR
  MEADOW) → **meadow_overpass** (THE OVERPASS, the city line). The "town park" the
  journey opens at is grown Otterbrook's shipped POND PARK. Otterbrook's east gate
  lands on meadow_mile; the overpass's east edge is the city line into Brickton.
- **Decision — COMPUTED inter-leg doors (the ADR-012 route discipline).** Each leg
  builds with placeholder door targets; the coordinator overwrites every tx/ty to
  land on the NEIGHBOUR's REAL trail entry — an EAST→neighbour door at the
  neighbour's west mouth (tile 1, its real trail row read off the draft grid via
  `trailRowAt`), a WEST→neighbour door at the neighbour's east mouth (tile W-2).
  Never a hardcoded jittered coordinate. Pinned in `world_block.test` (the chain
  asserts each door's computed landing).
- **Decision — THE GATE + GRANDFATHER CLAUSE MOVE TO THE OVERPASS.** The
  `orientation_gate` trigger + the three Blazer-Smiler proctors relocate off
  meadow_mile onto meadow_overpass (the city-adjacent leg). `orientationGateScene`
  is unchanged — badge OR `bus_ride_done` walks you straight in; otherwise three
  exercises earn the badge, each win sticking (`orient_1..3`), a defeat/flee just
  respawns you to retry (the retry law holds). The METEOR ROADBLOCK stays on its
  leg (meadow_mile). Brickton's foot exit (was → meadow_mile) is retargeted to
  meadow_overpass — computed a few tiles WEST of the gate so arriving never bounces
  — so the walk reads correctly in BOTH directions (the one door edit is on the
  appended foot-return only; the frozen 2077 core is byte-identical, re-proven).
- **Decision — THE Ch.1.5 BAND escalates toward the city.** The §A7 roster gets
  tougher per leg using only the SHIPPED Ch.1 six: meadow_mile `cranky_mailbox/
  coily_cicada` (gentlest, near town) → woods `hill_slug_deluxe/coily_cicada` → far
  `runaway_lawnmower/pigeon_gang` → overpass `pigeon_gang/blazer_smiler` (the city
  edge, foreshadowing the proctors). One pressure-safe middle-third spawner per leg
  (grace + proximity clear — proven by the encounter-pressure gate, 44/46).
- **Decision — RESTS before each hot stretch + HIDDEN PRESENTS.** A payphone +
  picnic sit at every leg's WEST mouth, before its spawner band (§A4.5/§B4 — pinned
  in the content-validate picnic manifest, one each). Two hidden presents hide along
  the way (the S9b gift-box pattern, dispatched in `OverworldScene.signBeat` on a
  shared loot table): a `basket_basic` on the woods glade, a `salt_shaker` (the
  anti-Tick callback) taped to a fence post in the far meadow, AND — closing the
  §B4 "every nook earns a reward" gap — a `star_cola` beside the rest in grown
  OTTERBROOK's woods nook (the glade had a picnic but no present; ADR-054 left it
  owed). All three are reachability-proven with a tile+prop-solid BFS (trees + the
  meteor rock are real solids the validator's BFS ignores). A full bag commits
  nothing — the reward waits (zero missables).
- **Decision — TWO flag-gated CUTSCENE BEATS (the cut/dlg/camera pattern).** A warm
  roadside vignette in the woods (`woods_vignette` → a fawn watching from the ferns)
  and the "you can see the city now" reveal on the overpass (`city_reveal` → a gentle
  east-pan over the narration, foreshadowing Mia + the Starfall Spire). Both fire on
  leg entry (west-edge triggers) and play once (`*_done` flags); the cut lock holds
  input; triggers fire through the door cooldown (checkTriggers is un-gated by it).
- **Decision — buildWoods FILLS the forest; trees are CLEARED from fixtures.** The
  woods leg is `buildWoods` over a blank grid (a winding clearing path + off-path
  trees, region-contained). `clearTreesIn` drops any tree prop over a rest/present/
  door mouth so every fixture stays reachable IN-GAME (the validator's BFS ignores
  prop solids; trees + gift boxes + the meteor rock are real solids — proven by a
  tile+prop-solid BFS from each leg's west spawn to its east door + every fixture:
  all four legs traverse, nothing stranded).
- **Decision — NO FNV re-pin.** The canon legs call `buildRoute`/`buildWoods` with
  new args but touch NO sample-routed generator body (`generate()` never dispatches
  to `buildWoods`, and `SAMPLE_RECIPES.meadow_mile` is an independent LAB draft).
  The levelkit FNV hashes are untouched.
- **Verification:** tsc + `npm run validate` (now 46 maps: map-quality 41 clear + 5
  waived, pressure 44 + 2; 385 dialogue scripts) + full vitest **635 green** (the
  +3 over ADR-055: the world_block MEADOW MILE block became a 7-test THE LONG WALK
  block) + `vite build`. The tile+prop-solid reachability probe cleared all four
  legs. Frozen cores byte-identical (re-proven); the meteor roadblock, the orient
  flags, the bus/badge grandfather clause, and the docks/Cage doors untouched. The
  `.shots/` foot-leg contact sheets belong to the consolidated QA pass.
- **Consequences:** the foot journey is a real five-screen walk that earns its size
  (§B4) — distinct legs, an escalating band, rests, presents, two cutscenes — and
  the leg-builder pattern (draft → compute neighbour entries → wire doors → graft
  content) is the template for any future multi-screen route. Movement 4's quests/
  cutscenes can hang real tasks off these legs.
