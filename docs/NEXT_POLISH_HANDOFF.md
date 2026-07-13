# AI HANDOFF PROMPT — Meteor Falls production polish, phase 2

> **How to use:** start a fresh Claude Code session in `C:\Meteor Falls` and say:
> *"Read docs/NEXT_POLISH_HANDOFF.md and execute it."*
> Everything below is written for that agent.

---

## 0. TOKEN ECONOMY RULES (read first, non-negotiable)

The user hits session usage limits quickly. Two audit fleets already rate-limited mid-run on 2026-07-01.

1. **Do mechanical work yourself in the main loop** — file edits, frame ops, PNG scripts, gate runs. Never spawn an agent for something you can do in ≤10 tool calls.
2. **When you must spawn agents** (true fan-out only): pass `model: 'haiku'` for extraction/checklist/inventory work and `model: 'sonnet'` for ordinary code review or search. Leave the model unset (Fable) ONLY for hard judgment (subtle visual verification, balance canon calls) — and even then, one verifier per finding, not three.
3. **Do NOT re-audit.** The full-game audits are DONE (2026-07-01, two passes, 97/97 walk sheets visually reviewed, coverage/balance/hoops/golf/polish dimensions complete). The surviving work is enumerated below. Re-running discovery would burn ~5M tokens for nothing.
4. **Image reads are expensive.** When verifying sprite work, extract ONE labeled strip per character (`node tools/extract-char-frames.js <sheet> <out.png> <frames...>`) and read that one image — never the full sheet plus per-frame zooms unless something looks wrong.
5. Reference docs sparingly: `CLAUDE.md` (canon: art is AUTHORED via ChatGPT, spritegen FROZEN, money > combat), `docs/ART_PIPELINE.md` §"Character 46-frame walk sheets" (the regen pipeline), memory file `production-polish-2026-07-evening.md` (full inventory of what was already fixed + every gotcha).

## 1. WHAT IS ALREADY DONE — do not redo any of this

2026-07-01 evening pass (committed to main):

- **43 character walk sheets repaired** (frame-op manifests `docs/asset-lists/character_animation_fixes.json` + `_round2.json`, both already applied; ChatGPT regens for oldTimer-UP, ana-UP/diag, nurse-LEFT/UL, mayor-UP-sash, canteen_keeper + fjord_nurse whole-sheet). Runtime AND masters synced. anim:audit review hints 219→104; remaining warnings are accepted-by-design (documented verified-accept list in the memory file: gowned glides, static idles, seated depot clerk, lh_* stationary fallbacks, martClerk/mercadoKeeper house-style, ml_*/as_* same-foot profiles).
- **Hoops:** follow/land/dunkC frame remaps in `HoopsScene.frameOf` (authored cells 37/38 ball-only, 17/18 half-size — see §2.4), opponent sheet cells permuted (fall=prone now), 5 walk-on athletes wired in `AUTHORED_MINIGAME_ATHLETES`, shadow.png resized to contract, net ripple 2-frame + real-dt, HERO_ARCH pippa='hawk', dunk/callsForIt/horn announcer lines wired, `score` sim event now carries `dunk`.
- **Balance:** pocket_patch 360→110, field_dressing 700→180, lifeup_g→250, lifeup_o→350 (the shipped hero-HP curve is ~435–625 at L52 — BALANCE_REVAMP §5 "widening" NEVER LANDED and is now marked so in the doc). GOLDEN_CALLER_THRESHOLD 45→15, FORGIVE_CALLER_FLOOR 24→12 (attainable callers = 18). cobra_flute 46, paper_fan 60. Forge `statAtLevel` marked FROZEN-pre-ADR-122. CH4-10 spec volt_β corrected to 128.
- **Coverage:** 28 adopted enemies added to `BattleScene.backdropArea` lists (jungle/brickton/laughing_ruins); 4 Brickton NPCs repointed to bespoke sheets (npc_hodgkin/npc_waitress/npc_depot_clerk/npc_realtor); golf orphans → `dormant/`, hoops sources → `assets/art/masters/minigames/hoops/`, bust/battler sources → masters.
- **Golf:** ticker/banner glyphify, putter-stroke power scaling, dead fallback key + links_bg removed, header comments fixed.
- Gates at handoff: tsc ✓, validate ✓, 1290/1290 tests ✓, balance ✓ (all bosses TTK 4–7).

## 2. WHAT REMAINS — prioritized work orders

> **STATUS 2026-07-02 (phase-2 session):** §2.1 DONE + live-verified (5 maps screenshot).
> §2.2 items 1–4 DONE (fernLady whole sheet, grayCommuter UP, lh_harbor_master UP,
> lh_calligrapher LEFT+UP — all synced runtime+master, anim:audit hints 104→82); item 5
> (optional quality tier) still open. §2.3 court re-compose + rim nudges DONE + live-verified
> (crosshair-on-ring proof); master cell regens still open. §2.4 Valle doors DONE (LANDMARK
> routing + re-measured door.ox, shop entry walked live), pagoda padded 160→232; npc_bert +
> balance follow-ups remain owner-call. Gates green (tsc/validate/1290 tests/balance/audits).
>
> **STATUS 2026-07-02 night (user playtest reports):** both fixed.
> 1. **"Wishers have no legs" (Valle shrine plaza)** — wisherA + wisherC sheets were WAIST-UP
>    BUSTS on disk (an old regen came out half-body; the slicer's h=108 normalization stretched
>    the busts to full frame height, so bbox audits look normal). Both sheets fully REGENERATED
>    (5 facings each, ChatGPT reference-paste with the bust recipe: "reference is WAIST-UP —
>    draw the COMPLETE FULL BODY head to feet, invent plausible legs/shoes"; wisherA keeps his
>    praying hands, wisherC his straw hat + backpack). Synced runtime+master, review montages
>    verified. **DETECTION for this bug class:** bbox height ≠ proof of feet — a stretched bust
>    fills the frame. `node tools/extract-char-frames.js <sheet> <out> 0 4 8 12` and LOOK.
> 2. **"Chapel unreachable" (valle_chapel)** — the hi-res PNG (326×581 ≈ 9 tiles tall) placed
>    at y=20 ran its porch/door INTO the map's south treeline (row 28), and the landmark door
>    box (anchored at the drawn foot) landed in the trees. Fixed with a village-scale
>    AUTHORED_WORLD_PROP_DISPLAY_SIZE entry (valle_chapel: 56×100 native ≈ 6.25 tiles; the
>    landmark solid/door rebuild uses displayWidth/Height so everything follows) + door.ox
>    re-measured for the displayed size (27→16). Door-audit green. Moving the chapel up
>    instead would have walled off the east-gate lane (rows 19-20) — don't.
>    **Rule of thumb:** when a promoted hi-res facade dwarfs its neighbors or its foot crosses
>    the map border art, cap it with a display-size entry and re-measure door.ox against the
>    DISPLAYED width — the drawn-footprint solids + door box scale with it for free.
> Live double-check for the owner (~30s, both in valle_dorado): the three plaza wishers stand
> full-bodied; the chapel renders casa-scaled with its mat on open grass — walk in.

### 2.1 Wire the Norway + Africa tile skins (BIGGEST WIN, code-only) — ✅ DONE 2026-07-02
`assets/art/world/Norway_tiles_16.png` and `Africa_tiles_16.png` are fully authored and wired. Chapter 6’s production maps now use the Zanzibel, Savanna, and Ruins remaps, including `sphinx_chin`; this historical task is closed.

Historical implementation record: both 16-cell strips were mapped against their
masters; `NORWAY_TILE_ART` / `AFRICA_TILE_ART` and their TILESET tail entries were
registered; map-scoped Norway, Zanzibel, Savanna, and Ruins remaps were wired in
`OverworldScene.buildTiles`; static gates and live regional screenshots were
completed. No work remains in this section.

### 2.2 Walk-sheet regens still owed (ChatGPT pipeline, browser — near-zero Claude tokens)
Per `docs/ART_PIPELINE.md` §Character 46-frame walk sheets (reference-paste, chroma-green, 3-pose strips; fetch→blob harvest). Priority order:
1. **fernLady** — WHOLE SHEET (5 facings). She wanders Brickton; sheet is scrambled with prop churn (interim frame-ops applied but left/right/up rows are still front views). Prompt must pin ONE consistent prop ("same potted plant, same hand, every frame — or no prop").
2. **grayCommuter** — UP facing only (walk-up/run-up show his full face; no in-sheet back exists). Rebuild 12,13,14(=12),15 + 22=13, 23=15.
3. **lh_harbor_master** — UP facing (up row is a byte-copy of the down row: face+beard+medallion while walking away). Stationary clerk, surfaces on turn-to-player. Same assembly as above + rebuild 30-35/40-43 from the new row per the lh convention.
4. **lh_calligrapher** — LEFT profile + UP facing (sheet has only front art: 6 unique bitmaps total). Left → 4-7, mirror 8-11, runs 18=5/19=7/20=9/21=11; Up → 12-15 + 22/23 + rebuild up-diagonals.
5. Optional quality tier (stopgaps currently ship straight-backs, acceptable): true 3/4 up-diagonal blocks for manager, smiler, tomas, sidewalkCritic, smilerB; vs_shepherd stepB-with-crook (currently same-foot); teacup_innkeeper stepB (hem-band mirror PROVEN to fail — needs regen or stays same-foot).

Browser mechanics gotchas (all confirmed 2026-07-01): one tab, sequential, one ChatGPT conversation per character, re-attach the ref image on EVERY facing (PowerShell STA clipboard loop ~30s + real click + Ctrl+V; composer screenshot-y = CSS-y × ~0.661 — measure via `getBoundingClientRect`); harvest with `fetch(img.src)→blob→<a download>` (canvas/decode stalls); slice `tools/slice-chroma-strip.js <src> .shots/<id>_<facing> --expect=3`; assemble with `tools/assemble-char-sheet.js` (--place/--copy/--mirror, ops apply in order); ALWAYS `cp` runtime→master after. Verify each character with ONE extract strip.

### 2.3 Hoops finishers
- **court_side re-compose:** painted lines are ~14% smaller than engine geometry (3-pt arc ~44 native px off). Re-run `tools/compose-hoops-court.js` with a crop-to-painted-lines step so the source's court lines land on the engine inbounds rect (evidence + measurements in memory). Verify live: "FROM DEEP! +2" should trigger at the painted line.
- **Rim placement nudges:** hoop_side_sheet is face-on art but the ±s(20)/−s(30) nudges in `HoopsScene` (~line 239-245) were tuned for the old side-profile drawing — left ring ~10px, right ~50px off sim rim x. Tune on a live pass.
- **Master cell regens (removes three code stopgaps):** athlete base sheets (rex + faye masters, then re-run `tools/recolor-athlete.js` for milo/dorin/pippa + the 5 walk-ons) need real art in cells 37 (gooseneck follow-through) + 38 (soft-knee landing) + 17/18 (full-size dunk-C pair); opponent sheet cell 37 is half-size. After the art lands, revert the frameOf remaps (search `HoopsScene.ts` for "until the masters regen").

### 2.4 Small parked items
- Valle Dorado live pass: widen enterable-shop solids + nudge door.ox in `maps_ch2.ts` (new hi-res facades are wider than the old solids; golf estate already verified live).
- `bldg_lotus_harbor_pagoda.png` is 160px wide → pad >160 (ideally ≥232) or it 4×-doubles if ever placed.
- `npc_bert` NPC_CHARACTER_ART row is a dead boot load (uncleBert has his own sheet) — retire the row + dormant the PNG, or place the sprite deliberately. Owner call.
- Balance follow-ups (report-only findings, user's call): lift Ch.5-7 trash EXP ~1.6-2× (mid-game grind hump), nudge Ch.5/6 trash cash monotone, give Milo one mid-arc weapon (ch6/7, offense ~34-44), design the Ch.9-10 Fortune "back-half pour" (income path to $3B), and wire the 13 data-only Ch.5-10 quests through QUEST_PICKUPS/questTalk (this unlocks re-deriving GOLDEN_CALLER_THRESHOLD/FORGIVE_CALLER_FLOOR upward).

## 3. STANDING WORKFLOW RULES

### 3.1 Gates (run after every batch, all must stay green)
`npx tsc --noEmit` · `npm run validate` · `npm test` (1290) · `npm run balance` (TTK 4-10 window) · `npm run anim:audit` (after sheet edits) · `npm run visuals:audit`.

### 3.2 Live verification
The game boot preloads ~1220 PNGs and **STALLS if the Chrome tab/window is hidden** (image-decode deferral — `document.visibilityState` must be 'visible'). Use a visible Chrome-MCP tab; `window.pump(n)`, `window.key(code)` helpers exist (main.ts). Never `scene.start('boot')` mid-load (wedges the loader). Warp recipes + battle-swirl pump notes live in memory `verifying-the-running-game`.

### 3.3 Frame-op discipline
Use `npm run anim:fix -- --manifest <file> --apply` with a NEW manifest json per batch (keeps an auditable record in docs/asset-lists/). **NEVER run a manifest containing `swap` or in-place `mirror` ops twice** — swaps self-cancel and salvage sources get consumed (recovery: the tool writes `assets/art/review/*_before_anim_fix_<stamp>.png` snapshots; restore the latest stamp). The tool auto-syncs masters that exist; `cp` manually if a master is missing.

### 3.4 Git
The user drives git (full-tree commits, merge to main). Leave work UNSTAGED unless they ask. `git status --short` + fetch before editing shared files — the user edits concurrently in their IDE.
