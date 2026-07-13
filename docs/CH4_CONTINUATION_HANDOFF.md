# CH.4 NORWAY — CONTINUATION HANDOFF (art pass ~90% done)

> **Historical as of 2026-07-12.** Chapter 4 now has its production world,
> services, contextual story, five quests, dev profiles, and v21 migration.
> Old test counts and remaining-art claims below are archival; see ADR-140 and
> `docs/CH4_PRODUCTION_VERIFICATION.md`.

> **You are the next agent. Read this whole file first, then `/CLAUDE.md`,
> `docs/ART_PIPELINE.md`, `docs/GAME_BIBLE.md` §A6/§A7, and the original
> `docs/CH4_ART_PASS_HANDOFF.md` (the data-spine context).** The Ch.4 data spine
> is SHIPPED and GREEN; the **authored-art pass is now mostly done** (enemies +
> NPCs + facades). Your job is the **optional remainder + verification**. Do NOT
> rebuild anything that's marked DONE below — only add the remaining art, verify,
> and keep every gate green.

---

## 0. CURRENT STATE (2026-06-20)

Chapter 4 ("The Fjord That Sleeps", Norway) validates, type-checks, passes **1237
tests**, balances (Whisperwig TTK 6), and builds. The art pass completed **TASK A
(16 enemy battlers), TASK B (6 NPC sheets), TASK C (facades — no bug)**. What's
left is **TASK D (optional outdoor battle backdrop)**, **TASK E (end-to-end
playtest)**, and **optional polish** (enemy overworld minis, extra NPC sheets).

**All art is AUTHORED PNGs via the ChatGPT → PNG workflow** (`/CLAUDE.md` rule 1) —
never procedural, never a different model. `src/spritegen/` is FROZEN.

---

## 1. WHAT'S DONE — DO NOT REDO

### ✅ TASK A — 16/16 enemy battlers authored
Every Ch.4 roamer now wears its own authored `battle_<id>.png` + `_w1` + `_w2`
(byte-identical W×H), wired across all three gate sites. The 16:
`colossal_gnat, frost_hare, knitting_needles, junior_jotun, moor_midge_cloud,
boulder_lichen, bog_cotton_wisp, earwax_golem, dream_leech, snore_gust,
giant_house_cat, lost_mitten, amber_hoard_troll, aurora_moth, hushed_skua,
frost_jotun_elder`. (The 4 boss/set-piece battlers — `thunder_snail`,
`fjord_gull_bully`, `giant_berry_blocker`, `the_whisperwig`+`_exposed` — were
already authored before.) **Wear tiers are DARKENED copies of the base** (×0.88 →
`_w1`, ×0.76 → `_w2`) — this matches the shipped `thunder_snail` trio (99.8%
identical silhouette, brightness 80→61). Minis still use borrowed overworld
roamers (optional — see §4.3).

### ✅ TASK B — 6 Norway NPC sheets wired
`sigrid_spectacles, kvisthavn_fisher, kvisthavn_shopkeeper, mayor_of_lilleby,
lilleby_giant_child, lilleby_undertaker` — masters were valid, copied to runtime
`assets/art/characters/<id>_anim_46_4x.png`, added to `NPC_CHARACTER_ART`
(`authored.ts`), NPC `sprite:` repointed in `maps_ch4.ts`, roster canon-pin updated
(`docs/asset-lists/characters_8dir.txt` + `authored_assets.test.ts` length 50→56).
Live-confirmed rendering in Kvisthavn.

### ✅ TASK C — facades are FINE (no bug)
The "generic houses" screenshot was STALE. `buildDistrict(catalog:
AREA_SKINS.kvisthavn = KVISTHAVN_FACADES)` places only the authored
`bldg_kvisthavn_*` keys; all 9 facade PNGs are on disk at 256×192 hi-res →
`worldSpriteScale`→1 (no double-scale); `occupyCity` only adds doors. Nothing to fix.

**Gates green throughout:** `npm run validate` · `npx tsc --noEmit` · `npm test`
(1237) · `npm run build` · `npm run enemies:frames`.

---

## 2. ARCHITECTURE & INVARIANTS (respect these)

1. **The validator is a CANON-PIN file** (`tools/content-validate.ts`). Change a
   pinned value → update its pin in the same commit. `npm run validate` is truth.
2. **Enemy battle art is gated BOTH directions** (`content-validate.ts` ≈ L919–972):
   `ENEMIES[id].sprite` === `ENEMY_BATTLE_ART[id].sprite` === a key in the
   `ENEMY_BATTLE_ART` loader array in `authored.ts` (`AUTHORED_ENEMY_BATTLE_ART_KEYS`).
   All three must agree.
3. **`src/spritegen/` is FROZEN** — never add a `draw*` generator. The reused
   `draw` fallbacks in `ENEMY_BATTLE_ART` rows are fine (boot fallback only).
4. **Wear tiers must be byte-identical W×H** to the base or the sprite jumps when
   damaged (`npm run enemies:frames` audits).
5. **Enemy `deathLine` renders RAW** — literal canon names, never `{tokens}`.
6. **Image generation is ALWAYS ChatGPT** (chatgpt.com). Use the user's browser.
7. **Run the gates after every batch.** Leave git unstaged (the user drives git).

---

## 3. THE PROVEN WORKFLOWS (full, actionable)

### 3a. ENEMY BATTLER pipeline — used 16× this session, fully proven

**Per enemy: one base gen + a code-side darken for the two wear tiers.** No
reference image needed (generic creatures hold style from a good text prompt;
`file_upload` is BLOCKED for project/Downloads paths anyway).

**Step 1 — read the brief.** The art brief for each enemy IS its block in
`src/data/enemies.ts` (name, `moves` flavor text, `deathLine`, `bg` palette ramp).
Read it before prompting.

**Step 2 — drive ChatGPT (Chrome MCP).** Tools: `mcp__Claude_in_Chrome__*`
(load via ToolSearch: `navigate, tabs_create_mcp, javascript_tool, browser_batch,
find, get_page_text`). The user "Jonathan Layman / Pro" is logged in at
chatgpt.com. **Parallelize ~5 tabs.** Per tab: `navigate https://chatgpt.com/`
(fresh chat), then inject + send via `javascript_tool`:
```js
let ed=null;for(let i=0;i<25;i++){ed=document.querySelector('#prompt-textarea')||document.querySelector('[contenteditable="true"]');if(ed)break;await new Promise(r=>setTimeout(r,300));}
let out;if(!ed){out={ok:false};}else{ed.focus();document.execCommand('selectAll',false,null);document.execCommand('delete',false,null);
const PROMPT="<prompt>";document.execCommand('insertText',false,PROMPT);await new Promise(r=>setTimeout(r,450));
const btn=document.querySelector('button[data-testid="send-button"]')||[...document.querySelectorAll('button')].find(b=>/send/i.test(b.getAttribute('aria-label')||''));
if(btn){btn.click();out={ok:true};}else out={ok:false};}out;
```
Batch all the per-tab injects in ONE `browser_batch` call (different `tabId` each).

**Prompt template** (text-only, flat magenta):
> `Pixel-art enemy battler sprite in the EarthBound / Mother (SNES JRPG) style:
> bold dark outline, limited flat palette, soft dithered shading, clean readable
> silhouette. Subject: <NAME — vivid physical description; cold Norway palette
> with named colors>. ONE creature, facing the viewer (front view), full body
> fully visible, centered with a little margin. Background: a perfectly flat SOLID
> MAGENTA #FF00FF filling the entire image — same magenta everywhere, NO gradient,
> NO vignette, NO shadow, NO ground line, NO text or labels. Crisp pixels.`

**Step 3 — capture** (after ~60–120 s; poll for the image). The generated `<img>`
has a redacted, undecoded src on a background tab — so `fetch` the bytes and
trigger a download to `C:\Users\jay19\Downloads` (which IS readable by your file
tools; canvas export taints / needs decode, fetch does not):
```js
const img=[...document.querySelectorAll('main img')].find(i=>/Generated image/i.test(i.alt||''));
const src=img?(img.currentSrc||img.src):null;let out;
if(src){const b=await(await fetch(src)).blob();const u=URL.createObjectURL(b);
const a=document.createElement('a');a.href=u;a.download='mf_<id>_raw.png';document.body.appendChild(a);a.click();a.remove();out={ok:true,size:b.size};}
else out={ok:false};out;
```
Capture all ready tabs in one `browser_batch`.

**Step 4 — slice base + derive wear tiers** (Bash; pick `targetLongestSide` by
concept — `fitEnemySprite` caps non-boss at 448×368 and NEVER upscales, so native
px IS on-screen size; medium ≈ 230, big ≈ 300, "enormous" ≈ 340):
```bash
node tools/slice-chroma.js "C:/Users/jay19/Downloads/mf_<id>_raw.png" assets/art/enemies/battle_<id>.png <size>
# wear tiers = darken the sliced base (matches shipped practice); pngjs, .cjs (repo is ESM):
node -e "const {PNG}=require('pngjs');const fs=require('fs');function d(i,o,f){const p=PNG.sync.read(fs.readFileSync(i));for(let j=0;j<p.data.length;j+=4){p.data[j]=Math.round(p.data[j]*f);p.data[j+1]=Math.round(p.data[j+1]*f);p.data[j+2]=Math.round(p.data[j+2]*f);}fs.writeFileSync(o,PNG.sync.write(p));}d('assets/art/enemies/battle_<id>.png','assets/art/enemies/battle_<id>_w1.png',0.88);d('assets/art/enemies/battle_<id>.png','assets/art/enemies/battle_<id>_w2.png',0.76);"
```
QA each base with the Read tool (verify clean cut, no magenta halo, on-brief).

**Step 5 — wire 3 sites** (all must agree):
- `src/data/enemies.ts` — that enemy's `sprite:` → `'battle_<id>'` (keep `mini:`).
  Borrowed sprite keys repeat across enemies, so anchor edits on the unique
  `deathLine` line.
- `src/spritegen/enemies.ts` — its `ENEMY_BATTLE_ART` row `sprite:` → `'battle_<id>'`
  (id-keyed, unique; keep the `draw` fallback).
- `src/spritegen/authored.ts` — add 3 loader entries to the `ENEMY_BATTLE_ART`
  array: `battle_<id>` + `_w1` + `_w2`
  (`url: new URL('../../assets/art/enemies/battle_<id>.png', import.meta.url).href`).

**Step 6 — gate:** `npm run validate` (proves the 3-way agreement) → `enemies:frames`
→ `tsc` → `npm test` → `npm run build`.

**GOTCHAS (hit this session):**
- ChatGPT sometimes stalls in a **"One last tweak…"** refine loop (streaming flag
  stays on, no final image). Fix: re-`navigate` that tab to a fresh chat and
  re-fire the prompt. (Hit jotun, dream_leech, snore_gust.)
- `javascript_tool`: TOP-LEVEL `await` returns the value; an `async()=>{}` IIFE
  returns `{}` (unwaited promise). Write top-level, not wrapped.
- `tabs_create_mcp` does NOT work inside `browser_batch` ("No tab available") —
  create tabs with individual calls.
- `slice-chroma.js` magenta key handles white/pale subjects cleanly; the corner
  pixel auto-detects magenta vs white-matte vs transparent.

### 3b. NPC 46-frame sheet pipeline (if you add the optional extra NPCs)
Masters at `assets/art/masters/characters/animation/<id>_anim_46_4x_master.png`.
Verify with `node tools/extract-char-frames.js <master> out.png 0 1 2 3 12 13 14 15`
(Read the strip — down row 0–3, up row 12–15, opposite-foot steps). If valid: copy
master → runtime `assets/art/characters/<id>_anim_46_4x.png`, add to
`NPC_CHARACTER_ART` (`authored.ts`), repoint NPC `sprite:` in `maps_ch4.ts`, **add
the id to `docs/asset-lists/characters_8dir.txt` AND bump the `toHaveLength` count
in `authored_assets.test.ts`** (order must match `NPC_CHARACTER_ART`). If a master
is broken → repair via the chroma-green reference-paste pipeline
(`docs/ART_PIPELINE.md` § Character 46-frame walk sheets; never the 5 heroes/caddy).

### 3c. BACKDROP pipeline (full opaque scene → downscale, NOT chroma-key)
Prompt a full 16:9 scene "no text, no people, no UI, no creatures". Capture via the
same fetch-download. Then `node tools/downscale-backdrop.js <src> <out> 1600 900`
(plain area-average — chroma/mini slicers would nibble the sky/sea). See §4.1.

---

## 4. REMAINING WORK

### TASK D (optional) — a dedicated Norway OUTDOOR battle backdrop
Right now EVERY Ch.4 fight reuses `sleepers_spine.png` (the dungeon backdrop), set
in `BattleScene.backdropArea()` (`src/scenes/BattleScene.ts` ≈ L700–706 — all 21
Ch.4 enemies map to `'sleepers_spine'`).
1. Author a Kvisthavn-quay / Bootstep-moor outdoor backdrop (1600×900) →
   `assets/art/backgrounds/<area>.png` (e.g. `kvisthavn`).
2. Add the area to `BATTLE_BACKGROUND_ART` (`authored.ts` ≈ L465) — the array of
   `['otterbrook','brickton','jungle','england','school','sleepers_spine', …]`.
3. In `backdropArea()`, split the OUTDOOR roamers (moor/town: `frost_hare,
   moor_midge_cloud, boulder_lichen, bog_cotton_wisp, hushed_gull, hushed_skua,
   junior_jotun, frost_jotun_elder, amber_hoard_troll, aurora_moth, giant_house_cat,
   lost_mitten, colossal_gnat, knitting_needles, thunder_snail`) onto the new key,
   leaving the dungeon trio (`earwax_golem, dream_leech, snore_gust, the_whisperwig`)
   + `bridge_berry` on `sleepers_spine`. (Confirm the split against §A6 geography.)
4. Gate. (No validator pin for backgrounds, but `npm run build` must resolve the PNG.)

### TASK E — end-to-end PLAYTEST (verification; not yet done)
Static gates + art QA pass, but **no fight has been seen rendering in a real
battle**. Drive `npm run dev` (preview tools `mcp__Claude_Preview__*`). KNOWN LIMITS:
the preview tab is hidden so Phaser pauses — pump `g.loop.step` (see
`[[verifying-the-running-game]]` in memory); cold-booting the full asset load by
pumping **times out the 30 s eval**, and the **boss battle can't be driven headless**
(`status:4/enemies:0` — documented harness limit). So:
- Warp via `window.mfGS` / `window.game`: `GS.setFlag('ch3_complete'); GS.setFlag('ch4_arrived');`
  `game.scene.start('overworld',{mapId:'kvisthavn',x:14*64,y:14*64,facing:'down'})`
  then pump the loop (NOTE world space is tile×64, NOT ×16).
- Launch a battle to SEE the new battlers: `game.scene.getScene('overworld').startBattle(['frost_hare'],'none',[],{})`
  then pump frames with **real `await setTimeout` between steps** (microtasks must
  flush for the async battle boot — a tight synchronous pump is what hits the
  harness limit). Screenshot. Repeat for a few enemies.
- Quest flow: givers `kv_sigrid, kv_halvor (+ll_sweetheart), kv_bellkeeper, ll_mayor`;
  `QUEST_PICKUPS` set objective flags; PSI gate `spine_meltfall` takes Vibe Freeze →
  Firecracker String.
- Boss (best-effort / may need a real human run): opens UNTARGETABLE → NOISE
  (Volt/Bottle Rocket/Firecracker String) surfaces it → Mia awakens Vibe Volt α →
  every 3rd turn Hush → `whisperwig_defeated` → ear resonance → Ember 4 → `ch4_complete`.

### 4.3 OPTIONAL POLISH
- **Enemy overworld minis** — the 16 still use borrowed `mini_*` roamers in the
  overworld. To author one: ChatGPT on flat green/magenta →
  `node tools/slice-enemy-mini.js <src> mini_<id> <targetPx=base×4>` → add to
  `ENEMY_MINI_ART` (`authored.ts`). Size = base×4 (16-native → 64) to keep in-game
  scale; the 96 default enlarges. (See `[[image-generation-workflow]]` memory.)
- **Extra NPC sheets** for `kv_bellkeeper, ll_keeper, ll_sweetheart, kv_kid,
  moor_walker, spine_walker` (fine on generics for now).

---

## 5. MULTI-AGENT ORCHESTRATION (how to parallelize)

**Hard constraint:** only ONE browser ("Browser 1") is connected, and agents
CANNOT safely share its focus/tabs. So **image generation is single-owner** — ONE
worker (the main thread or a single dedicated "art-driver" agent) owns the browser
and does ALL ChatGPT gen + capture. Everything else parallelizes.

**Also:** `enemies.ts` / `authored.ts` / `maps_ch4.ts` are shared files — concurrent
agents editing the SAME file will clobber each other. Partition by **file** or by
**phase**, or give file-mutating agents `isolation: "worktree"`.

**Recommended split for the remaining work** (use the `Agent` tool; send parallel
agents in ONE message):
- **Main thread = the art-driver** (owns the browser). For TASK D it generates the
  backdrop; if you also do minis, it batches those gens.
- **Agent 1 (code/wiring)** — once art PNGs exist on disk, does the file edits
  (`backdropArea` split, `BATTLE_BACKGROUND_ART`, `ENEMY_MINI_ART`) and runs the
  gates. Hand it the exact file paths + the slice outputs.
- **Agent 2 (playtest/verify, TASK E)** — drives `npm run dev` via preview tools,
  warps + screenshots the overworld/quest flow, reports findings. Independent of
  the art work, so it runs concurrently.
- **Agent 3 (docs/memory)** — updates `docs/` + the memory files. Read-mostly.

**For the NEXT big art batch (Ch.5 Minimus, same playbook):** main thread fires
all gens across ~5 tabs and slices; then spawn 1 wiring agent PER FILE (or one
serial wiring agent) AFTER all art is sliced — never two agents editing
`authored.ts` at once. Verification agent runs in parallel.

> If the user opts into heavyweight orchestration (the **Workflow** tool / the word
> "ultracode"), model it as: one *art* phase (single-threaded browser) → a *wire*
> phase (pipeline per enemy, worktree-isolated) → a *verify* phase (parallel QA
> readers). Otherwise use the `Agent` tool splits above.

---

## 6. ACCEPTANCE / COMMANDS

Run after every batch — all must stay green:
```
npm run validate        # canon pins + 3-way enemy-art key agreement
npx tsc --noEmit        # types
npm test                # 1237+ tests incl. authored-asset wiring
npm run build           # tsc + validate + Vite bundle (catches missing PNGs)
npm run balance         # Whisperwig TTK must stay in [4,10] (art doesn't affect it)
npm run enemies:frames  # wear-tier W×H audit (base == _w1 == _w2 dims)
```
**Done when:** TASK D (if taken) renders the new backdrop; the §4-E playthrough
reaches Ember 4 / `ch4_complete` without a soft-lock; all gates green.

---

## 7. REFERENCES
- `/CLAUDE.md` — art-is-authored rule, balance canon, build/test.
- `docs/ART_PIPELINE.md` — pipeline + masters resolutions + slicers.
- `docs/CH4_ART_PASS_HANDOFF.md` — the original (data-spine + pre-art) handoff.
- `docs/GAME_BIBLE.md` §A6/§A7 — Ch.4 story/boss + enemy roster.
- Memory (`C:\Users\jay19\.claude\projects\C--Meteor-Falls\memory\`):
  `image-generation-workflow.md` (the canonical gen recipe incl. the enemy-battler
  section), `ch4-norway-landing.md`, `character-walk-sheet-pipeline.md`,
  `forward-walk-mirror-feet.md`, `verifying-the-running-game.md`,
  `meteor-falls-enemy-wear-frames.md`.
- **Next chapter after Ch.4 wraps:** Ch.5 Minimus (Pippa joins) — re-grep ADRs first.
