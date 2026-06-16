# PROMPT — METEOR FALLS: Continue the Presentation-Polish Waves

> Paste this into a fresh Claude Code session rooted at `C:\Meteor Falls` to pick up the
> in-flight presentation-polish program exactly where it stopped. Everything already
> landed is GREEN. Work in the same disciplined way it was started.

---

## 0 — YOUR ROLE & CONTRACT

You are **project lead** on **Meteor Falls**, an EarthBound-style mobile RPG (Phaser 3.87 +
TypeScript *strict* + Vite, packaged with Capacitor for Android; landscape, **1600×900** game
pixels (`ART_SCALE = 4`, ADR-110)). **Deploy as many subagents as the work needs**, in a **production-quality, creative,
thorough** manner — **creativity and variety are paramount**. **THOROUGHLY REVIEW every agent's
output before you call anything done** — green tests are necessary, not sufficient; read the code.
If you genuinely need context, ask. Otherwise act.

You are mid-way through a large feature program (an "Encore-inspired" polish pass) plus an
interleaved set of playtest bug-fixes. Two of the four playtest items and the program's whole
foundation layer are DONE and verified. Your job: continue the queue in §4, to the same bar.

---

## 1 — HOW THIS CODEBASE WORKS (this is LAW — internalize before touching anything)

**Commands (the only verification that counts):**
- Typecheck: `npx tsc --noEmit`
- Content gates: `npm run validate` (runs `vite-node tools/content-validate.ts`)
- Tests: `npx vitest run` (or `npm test` = validate + vitest)
- Full build: `npm run build` (tsc → validate → vite build)
- Map perf bench: `npm run bench:map` · Economy: `npm run balance`
- Door audit (added this program): `npx vite-node tools/door-audit.ts`
- Dev server (for live preview verification): `npm run dev`

**The ADR ritual.** Every architectural decision/system lands an ADR in `docs/DECISIONS.md`,
format: `## ADR-NNN — TITLE`, then `- **Date:**`, `- **Status:**`, a `- **The ADR number.**`
line, `- **Decision — ...**` bullets, `- **Verification:**`, `- **Consequences.**` — **ending
every ADR with ☄️**. Cross-reference `GAME_BIBLE.md` §A/§B sections and the validator gates.
⚠ **CONCURRENT-ADR HAZARD:** the user runs PARALLEL sessions that claim ADR numbers (they took
096/097/098 and **101** mid-flight during this very program). **ALWAYS `grep '^## ADR-'
docs/DECISIONS.md` immediately before writing one**, use the next truly-free number, and tag your
source comments with it. Expect a *"file modified since read"* error on `DECISIONS.md` — re-read
its tail and append after the true last ADR. Renumber your in-code citations if your number moved.

**Validator gates.** Every system gets a check in `tools/content-validate.ts`, **pinned both
directions** (data ⇄ registry), with **reasoned waivers** (a waiver row must stay *needed* or be
retired — Prime Law 4). This is how "all future content follows the rule" is enforced. Schemas are
Zod in `src/schemas/index.ts`.

**Palette & art law (ADR-020, extended by the concurrent ADR-101).** Colors ONLY via
`src/palette.ts` — `px(RAMP.X, 0..3)` / `colorOf(idx)` / `rgbOf` / the new 6-stop `pxr(ramp,0..5)`
+ `SH` names (SHADOW·DARK·MID·BASE·LIT·HILITE). **NEVER raw hex/RGB** — the sprite layer rejects
out-of-palette colors at build. ADR-101 also added a Pixmap lighting model (`litRect`/`sphere`/
`finish()`), 6-stop ramps, and **idle-life frames (44/45: breath+blink, `${id}-idle-down`)** to
characters — **reuse these**, don't reinvent.

**dt-invariance (ADR-024) & determinism (Prime Law 2).** All motion is 60Hz-frame-rate-independent:
drive animation off `scene.tweens` or a dt-scaled accumulator, never raw frame counts. **No
`Date.now()` / `Math.random()` in deterministic paths** (seed per-map/per-index instead).

**Saves.** `GameStateData` is **v15** (`src/engine/state.ts`) with an ordered migration chain
(`src/engine/migrations.ts`, `migrateSave`). The 3 "Call-Dad" slots + a backup envelope live in
`src/engine/saves.ts` (`SaveBank`; keys `meteor-falls-slot-1..3`, `meteor-falls-backup`).
**Device-local prefs** (sound mute, volumes) are separate `localStorage` keys, NOT save state.

**The Bible.** `docs/GAME_BIBLE.md` is canon. Player-facing systems get an amendment note:
`> *(Amended/Added YYYY-MM-DD per Appendix rule 6, ADR-NNN — …)*`. Engine ids are FROZEN even when
display names change (e.g. `rex`/`faye`; ADR-023/031).

**Git workflow.** **Leave all work UNSTAGED.** The user drives git (full-tree "updates" commit +
merge to main) and will ask for PowerShell steps when they want them. Do not commit unless asked.

---

## 2 — EXECUTION DISCIPLINE (how these waves are run — keep doing this)

1. **Recon before you delegate.** For any subsystem you'll touch, first map it with read-only
   `Explore` agents (or direct reads) and demand exact `file:line` anchors. Never let an agent edit
   a file blind.
2. **One writer per hot file.** These files are touched by many items — **YOU edit them, serially,
   never two agents at once:** `OverworldScene.ts` (the big one — ~8 items), `audio.ts`,
   `src/schemas/index.ts`, `tools/content-validate.ts`, `src/ui/windows.ts`, `src/ui/pick.ts`,
   `src/battle/fx.ts`, `src/battle/fxTimeline.ts`, `src/scenes/MenuScene.ts`. Delegate only
   **isolated NEW-file modules** to parallel agents (that's how transitions/emote/i18n/door-audit
   were built concurrently without conflict).
3. **Foundations before leaves.** Build the shared spine a feature needs (schema fields, an engine
   module) before the feature that consumes it.
4. **Verify GREEN at every checkpoint** — `tsc` + `validate` + `vitest` all pass — before moving on.
   The branch is currently green; keep it that way so any red is provably yours.
5. **Definition of Done (per feature):** code + a `content-validate` gate (both directions) + a
   `DECISIONS.md` ADR (re-grep the number) + vitest tests + palette-clean + a Bible amendment if
   player-facing + a green `tsc/validate/vitest` run + left unstaged. Verify visible changes in the
   live preview (`npm run dev`), don't just trust tests.

---

## 3 — WHERE WE ARE (all DONE + GREEN: tsc clean · validate clean · 1145 vitest tests)

**Wave 1 — the spine (ADR-100 audio mixer + 3 foundation modules):**
- **Audio mixer (ADR-100, LIVE):** `src/engine/audio.ts` reworked to `voice→musicBus→musicMuffle
  (lowpass)→master→dest` + `sfx→sfxBus→master`. Crossfade is live for every `playMusic` caller.
  New API: `AUDIO.setMusicMuffle(0|1|2)`, `AUDIO.setBus('master'|'music'|'sfx',0..1)`, `getBus`,
  `AUDIO.setMusicDetune(cents)`. Pure knobs in `src/engine/audiobus.ts`. Mute (`meteor-falls-sound`)
  migrates forward; volumes are device-local `meteor-falls-vol-*`.
- **`src/engine/transitions.ts`** — `transition(scene, 'fade'|'irisWipe'|'barWipe'|'battleSwirl',
  opts): Promise<void>`, palette-clean, reuses `SWIRL_TINT`. Built + tested, **NOT yet wired**.
- **`src/engine/emote.ts`** — `EMOTES = {surprise:'exclaim', idle:'note', sleep:'zzz',
  think:'ellipsis', happy:'heart'}`, `popEmote(scene, target, opts): EmoteHandle{stop,active}`,
  `emoteGlyphKey`. Rides THE FLAIR WEAVE (`src/spritegen/flair.ts`) — added an `ellipsis` glyph.
  Built + tested, **NOT yet wired**. (NB: the brief said "glyphforge" but the correct system is the
  flair weave; the decorative `glyphforge.ts` is for region scripts.)
- **`src/engine/i18n.ts`** + `src/data/strings/{en,de}.ts` — `t(key, vars?, opts?)`, `setLocale`/
  `getLocale`, pluggable `registerFormatter`; leaves `{token}`/`{g:}` intact. 37 real en keys, 5 de
  stub. Built + tested, **call sites NOT yet migrated**.

**Playtest fixes (interleaved):**
- **ADR-102 — door/transition hardening:** `doorAudit` (`src/levelkit/mapcheck.ts`) +
  `tools/door-audit.ts` + a `content-validate` gate; fixed `jungle_2→valle_dorado` and
  `valle_dorado→pyramid_ante` (the "enter from the wrong way" bug); added
  `OverworldScene.clampSpawnToWalkable` (runtime nearest-walkable nudge that kills the "stuck on
  transition" class generically, incl. the pyramid rotor).
- **ADR-103 — window layout law:** `pick()` auto-paginates (pure `src/ui/paginate.ts`) +
  `reserveBottom`; shared clamped `makeCashBox` in `windows.ts`; `money(n,{abbrev})` in
  `src/ui/text.ts`; DEV off-screen tripwire in `makeWindow/makeBox`.

**Concurrent (already on the branch, not yours):** the user's **ADR-101** art polish pass (6-stop
ramps, lighting model, idle-life, palette-swap). Coexists; reuse its idle frames for NPC life (#4).

---

## 4 — THE QUEUE (do in this order; tier priority is the tiebreaker)

**IMMEDIATE — finish the playtest set (both touch `OverworldScene`; do them serially, you own it):**
- **(A) ATM smart-scale withdrawal.** Let the player withdraw a CHOSEN amount (not all). Adjustable
  by magnitude steps; a SMART scale that reads the balance and offers the **3 step sizes that make
  sense** for that magnitude (the game scales to billions). Clamp to balance.
- **(D) Multi-enemy encounters + a 1–2s join window.** Let the player get caught by several units at
  once, and give a short window at battle start where nearby enemies HOP IN (EarthBound-style).

**Then the program's remaining waves (16-task board — recreate the task list if you want it):**
- **Wave 2 — schema + gates:** map ambience/muffle + reflective + NPC-ambient fields (#16, +schema
  for #4/#6) and their validator gates. *Unblocks #2-muffle, #4, #6.*
- **Wave 3 — overworld presence:** speaker name-tag + emote wiring + camera focus (#1); NPC ambient
  life (#4); wire transitions — animated battleSwirl + iris/bar (#5); sprite reflections (#6);
  neighbor-map preloading (#14); finish audio muffle wiring (#2).
- **Wave 4 — battle:** hitstop + slow-motion (#3); status callouts + icon strip (#12); damage-number
  arcs + crit pop (#17).
- **Wave 5 — options/access/save:** volume sliders + rumble + button-glyph style (#7); accessibility
  submenu (#8); cellphone recovery autosave (#9).
- **Wave 6 — text/authoring:** inline typewriter control tags (#11); i18n migration + validator gate
  (#10); data-driven cutscene DSL (#13, optional).

---

## 5 — VERIFIED SEAMS & ANCHORS (mapped already — don't re-recon from scratch; line numbers are ~)

- **(A) ATM:** `OverworldScene.atmFlow()` ~L2962-2988 (today: presets `[10,50,100]`+`All`+`Back` via
  `this.dlg.ask`); trigger ~L1587. `GS.withdraw(amount)`/`deposit` clamp in `state.ts` ~L371-384.
  `money()` (in `text.ts`) is ready. Build a PURE `smartSteps(balance)` (3 powers of 10 off the
  balance's digit-count) + an interactive amount-entry widget (read `INPUT` per frame like `pick.ts`
  `navTick`; ▲▼ = ±step, ◄► = cycle step, A confirm, B cancel) returning `Promise<number|null>`,
  clamped `[0,pool]`. Test `smartSteps`. ADR.
- **(D) Multi-enemy:** `OverworldScene` `updateRoamers` ~L1151 (contact `<13px`, early-returns after
  the FIRST), `contactBattle` ~L1434 (advantage via `contactAdvantage`, `formulas.ts` ~L625;
  `SWIRL_TINT` ~L636), `startBattle` ~L1464-1533 (**750ms swirl**, then `scene.launch('battle',
  {enemyIds, advantage, guestChad, glintAssist, boss, prayTutorial})`), `patrolBattle` ~L1366.
  `BattleScene` ALREADY takes `enemyIds: string[]` and renders up to 5 (`buildEnemies` ~L655-702,
  letters A–E, `introLine` in `enemies.ts` ~L911). `instantWin` (`formulas.ts` ~L424) checks ONE def
  — extend for the group. **Seam:** gather roamers within a radius of the contacted one into the
  roster; during the 750ms swirl, scan + append late-joiners before launch; recompute advantage/
  instant-win for the group. Tunable timing. Test. ADR.
- **Wave 2 schema:** `src/schemas/index.ts` `MapDefSchema` ~L551 (**`interior?` + `music` already
  exist**), `NpcDefSchema` ~L449 (`wander?` exists; no idle/emote), `DoorZoneSchema` ~L487. Author in
  `src/data/maps.ts` (+ `maps_ch2.ts`). Gates in `tools/content-validate.ts` — emote ids resolve
  against `EMOTES` (`src/engine/emote.ts`), reflective flags valid, ambience refs resolve. ADR+Bible.
- **#2 muffle wiring:** call `AUDIO.setMusicMuffle()` from menu open/close (UIScene emits
  `'mf-menu-closed'`; `MenuScene`), on pause, and on the indoor map flag / Wave-2 ambience at map
  load in `OverworldScene`.
- **#1 presence:** `src/ui/windows.ts` (typewriter `typewrite` ~L171, `say` ~L154, `winTexture`
  ~L61), `src/ui/text.ts` (`@`→`•` ~L56, `vars`), font `src/spritegen/font.ts` (`'retro'` size 6;
  render 1.5× via `setFontSize(9)`). Name-tag box off the `@`-speaker; `popEmote` over NPC/party on
  a dialogue/cutscene cue; ease camera to the speaker (`OverworldScene` `startFollow` ~L658).
- **#4 NPC ambient:** `OverworldScene` `buildNpcs` ~L635, `updateNpcs` ~L1103 (wander-only).
  **Reuse the ADR-101 `${id}-idle-down` breath/blink anim** (already played for the idle player at
  `OverworldScene` ~L1094). Bounded wander on existing collision (talk-to-stop), `popEmote` reactions
  (❗ notice / 💤 asleep), seed per map, cap active wanderers for mobile.
- **#5 transitions wiring:** replace the static battle-entry swirl in `startBattle` with
  `transition(scene,'battleSwirl',{tint})`; use `irisWipe`/`barWipe` on door transitions
  (`checkDoors` ~L3128, `fadeRestart` ~L1411). The spawn safety-net already runs in `buildPlayer`.
- **#6 reflections:** `OverworldScene` actor loop + `updateShadows` ~L863 (mirror the `mob_shadow`
  pool). For reflective tiles (Wave-2 flag), draw a flipped, alpha-reduced, wavy copy below the
  surface line, clipped, within N tiles. Palette-clean; clean no-op where no reflective tiles.
- **#14 neighbor preload:** `OverworldScene`; door targets in `maps.ts`. Idle-build reachable
  neighbors into a small cache (requestIdleCallback/post-update), serve on transition, debounce
  eviction (keep current+neighbors). Measure with `npm run bench:map`. **PERF BAR: neighbor builds
  must NOT drop the active map below target frame time** (the original acceptance criterion).
- **#3 hitstop/slowmo:** `src/battle/fxTimeline.ts` — clock model, `tick(dtMs)` where the **caller
  scales dt** (the seam): add `freeze(ms)` + `slowmo(factor,ms,ease)` spans. `src/battle/fxRegistry`
  (`FxSpec{kind,family,tier?,...}`, `tier:5`=Σ; add per-ability `hitstop?`/`slowmo?`). `src/battle/
  fx.ts` (`shake` ~L377, `popup` ~L402, SMAAAASH banner ~L443-485, `flood` flash ~L360). Reuse the
  `tweens.timeScale` fast-forward in `src/main.ts` ~L79-85, scoped to battle. Crit = `smashChance`
  (`formulas.ts` ~L178, used in `BattleScene` ~L1225); **boss-finishing has NO signal — add one.**
  `AUDIO.setMusicDetune()` during slow-mo. Test that normal time fully restores after every span.
- **#12 status callouts:** `src/battle/stage.ts` (`point()` gives the combatant center; anchor a
  bubble at `spr.y-18`, depth `D_STAGE+1`). Reuse `bust.ts` homesick thought-bubble (~L188-193,
  `overlayTick` ~L391-430). Queue callouts in `fxTimeline` so multiples don't overlap; add a
  persistent flair-glyph status strip per combatant; keep homesick as flavor.
- **#17 damage arcs:** `src/battle/fx.ts` `popup` ~L402-407 (pooled BitmapText, rises 14px, fades
  after 60% — **NO arc/scale today**). **VERIFY first**, then add an arc trajectory + a larger
  crit/SMAAAASH pop.
- **#7 options:** `src/scenes/MenuScene.ts` `setupPage` ~L695-764 (the `pick()` loop). Add stepped
  Master/Music/SFX sliders → `AUDIO.setBus` (build a slider widget), a Rumble toggle (gamepad
  vibration API, no-op where unsupported), a button-glyph style override (auto/keyboard/Nintendo/
  PS/Xbox) feeding prompt rendering. Migrate the boolean sound flag forward. Bible. Device-local.
- **#8 accessibility:** a MenuScene submenu (device-local). Secondary cues — a shape on the sneak/
  spotted swirl (✓ vs ❗) + on shield/ward/mirror pips; a colorblind palette toggle; reduce camera
  shake 0/50/100 (read by every `shake()` in `fx.ts`); reduce flashes (cap `flood`/flash alpha);
  larger text (font 1×/1.5×). Test shake/flash honor the multipliers.
- **#9 autosave:** `src/engine/saves.ts` (`SaveBank`, `open()` already migrates+recovers),
  `migrations.ts` (`migrateSave`), `src/engine/native.ts` (`appStateChange({isActive})` hook). Add a
  rolling `meteor-falls-autosave` snapshot on map transitions + on suspend/visibility; on boot, if
  newer than the last notebook, offer "Continue where you left off?" WITHOUT overwriting a notebook;
  reuse the migration chain; **never corrupt/overwrite a real save**. Diegetic: the hero carries a
  cellphone (surface in settings). Bible §A4. Test it never touches the notebooks.
- **#10 i18n migrate:** `t()` is ready. Migrate UI labels (MenuScene, `lettergrid`, `pick`, UIScene),
  then incrementally dialogue, to keys; keep `{token}`/`{g:}` intact. Extend `content-validate` to
  FAIL on missing keys and flag hardcoded user-facing literals in scene files.
- **#11 inline tags:** `src/ui/windows.ts` typewriter (`typewrite` ~L171-229; `{g:}` via
  `src/ui/flairline.ts`; speed via `textSpeedMul` ~L66). Add `[slow]`/`[fast]`/`[normal]`, `[wait]`
  (pause for input, no page break), `[beat:ms]`, `[shake]…[/shake]`, `[c:RAMP]…[/c]` as CONSUMED
  control tokens (never rendered). Validate tag balance at build. Test nesting + that control tokens
  never display.
- **#13 cutscene DSL (optional):** cutscenes are imperative async in `OverworldScene` (e.g.
  `ch3ArrivalScene` ~L3616, `awakeningBeat`, the `cut` lock). Add a Zod `CutsceneStep` union
  (say/move/face/wait/menu-branch/if-else on flags+inventory/set/goto+label/camera/playMusic+sfx/
  give) in `src/data/cutscenes/` + an interpreter `src/engine/cutscene.ts` over game state + the
  existing Fx/dialogue, fully skippable. `content-validate` typechecks every script. Port one scene
  as proof. `src/data/storythreads.ts` is a good Zod-data-registry reference.

---

## 6 — THE 16-ITEM SPEC (self-contained acceptance, from the user's original brief)

> Numbers in `#N` match the original prompt list. EarthBound-style throughout; **no portraits**.

1. **#1 Overworld dialogue presence:** (a) a framed speaker **name-tag** off the `@`-speaker, bitmap
   font, respects `win_flavor`; (b) **emotes** over NPC/party sprites on cue (❗🎵💤 "…" ♥); (c) a
   gentle **camera ease** to the speaking NPC. Validator: any referenced emote id exists.
2. **#2 Audio crossfade + muffle:** crossfade DONE (ADR-100). Remaining: wire `setMusicMuffle` on
   menu/pause/indoor.
3. **#3 Hitstop/slow-mo:** ~60–90ms freeze on SMAAAASH crits; a slow-mo ramp on Σ-tier/boss-finishing
   hits; per-ability in `fxRegistry`; optional synth detune; time fully restores.
4. **#4 NPC ambient life:** 2-frame idle (bob/blink, per-NPC phase), optional bounded wander
   (talk-to-stop), emote reactions; seeded; capped for mobile.
5. **#5 Transitions:** procedural fade/iris/bar + an animated accelerating **battleSwirl** (green
   sneak / red spotted); palette-conformant; `transition(kind,opts):Promise`. (Lib DONE — wire it.)
6. **#6 Reflections:** flipped, alpha-reduced, wavy copies of player + nearby NPCs on reflective
   tiles; clipped; N-tile limit; disabled cleanly where none.
7. **#7 Audio/options:** stepped Master/Music/SFX sliders → gain buses; Rumble toggle; button-glyph
   style override; migrate the boolean sound flag. Device-local.
8. **#8 Accessibility:** secondary (shape) cues so meaning never depends on color (the red/green
   swirl is a real defect); colorblind palette; reduce-shake (0/50/100); reduce-flash; larger text.
9. **#9 Recovery autosave:** a non-intrusive rolling snapshot (the hero's **cellphone**) separate
   from the Call-Dad notebooks; on map change + app suspend; boot offers "Continue…"; never
   overwrites a notebook.
10. **#10 i18n:** externalize strings to keyed tables + `t()` (DONE); migrate call sites; validator
    fails on missing keys + flags hardcoded literals; keep it locale-ready.
11. **#11 Inline text tags:** `[slow]/[fast]/[normal]/[wait]/[beat:ms]/[shake]…/[c:RAMP]…` consumed
    control tokens; build-time balance check; never rendered.
12. **#12 Status callouts:** labeled bubbles on status change (queued, directional tail) + a
    persistent per-combatant status-icon strip; keep the homesick thought-bubble as flavor.
13. **#13 Cutscene DSL (optional):** Zod-typed data cutscenes + interpreter; validator-typechecked;
    skippable; port one.
14. **#14 Neighbor preloading:** idle-build reachable neighbor maps into a cache; serve on
    transition; **must not drop the active map below target frame time**; measure with `bench:map`.
16. **#16 Map audio metadata:** indoor/ambience/music fields on the map schema so OverworldScene
    drives crossfade + muffle automatically on load (foundation for #2/#6).
17. **#17 Damage arcs:** give damage popups an arc trajectory + a larger crit/SMAAAASH pop. **Verify
    current behavior first** (they rise but don't arc/scale today).

*(#15 folded into #14's perf criterion. #B/#C playtest items — window pagination, door audit — are
DONE as ADR-103/102.)*

---

## 7 — START HERE

1. Read `docs/DECISIONS.md` ADRs **100, 102, 103** (and skim the user's **101**), this file, and the
   memory note `meteor-falls-polish-program`. Skim `GAME_BIBLE.md` §A4 (systems) for canon.
2. Run the green baseline so you can attribute any future red to yourself:
   `npx tsc --noEmit && npm run validate && npx vitest run` — expect all-green (~1145 tests).
3. Begin with **(A) ATM** then **(D) multi-enemy** (you own `OverworldScene`, edit serially), then
   **Wave 2**. Recon any unfamiliar seam with an `Explore` agent first; delegate isolated new-file
   work; review everything; land each with a gate + ADR (re-grep!) + tests + Bible note; keep green;
   leave unstaged.
