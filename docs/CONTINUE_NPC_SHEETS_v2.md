# Continuation prompt — rebuild the broken Meteor Falls NPC walk sheets (v2)

> Paste everything below into a fresh Claude Code session at `C:\Meteor Falls`.

---

You are continuing a large character-art fix in **Meteor Falls** (Phaser + TypeScript top-down RPG)
at `C:\Meteor Falls`. **The USER drives git — leave ALL work UNSTAGED; do not commit.**

## Read first
1. `CLAUDE.md` — art is AUTHORED PNGs; runtime sheets in `assets/art/characters/`, loaded by
   `src/spritegen/authored.ts`; masters in `assets/art/masters/characters/animation/`.
2. Memory (auto-loaded via MEMORY.md): **`character-walk-sheet-pipeline.md`** is the full proven
   workflow — READ IT. Also `image-generation-workflow.md`, `meteor-falls-npc-character-art.md`.
3. **`C:\Meteor Falls\.shots\npc_triage.md`** — the authoritative broken-NPC list.

## The task
Many NPC 46-frame sheets (`<id>_anim_46_4x.png`, 384×1536, 96×128/frame) are broken two ways:
- **WRONG-FACINGS** — rows don't match the engine's facings (often *every frame faces front*).
- **BUST / missing-legs** — the art is framed waist-up, no legs.

Both are fixed identically: **regenerate the character FULL-BODY in the 5 unique facings via ChatGPT
(text-only prompts), slice, assemble into the 46-frame grid with the STAND-WALK-STAND cadence, fix
idle, sync runtime + master.** Heroes (`jay, mia, milo, pippa, dorin`) are the CORRECT template —
**do NOT touch them**. Match jay's cadence: `assets/art/characters/jay_anim_46_4x.png`.

## Progress already done
- **DONE (4, synced):** `mom, oldTimer, pajamaKid, grayCommuter`.
- **Triage:** 86 NPCs → 42 broken (7 bust, 35 wrong-facing) + `glint` (LEAVE, it's a sparkle FX).
  **38 broken remain.**
- **Ch.1 partially started — DOWN facing only:** `caddy, drugClerk, docBrickton, priestOtter,
  arcadeOwner` have a DOWN strip captured at `C:\Users\jay19\Downloads\mf_<id>_down.png`; 4 are
  sliced to `.shots/<id>_down_[0..2].png` (caddy NOT sliced — slice it). `permit`'s down was lost
  (frozen tab) — regenerate it. **No left/up/diagonals exist yet; nothing assembled.**

## Fix order = GAME ORDER
1. **Finish Ch.1 (6):** drugClerk, docBrickton, priestOtter (wrong-facings) · arcadeOwner, permit,
   caddy (busts). (Their DOWN strips mostly exist — you mainly need left/up/diagonals + assembly.)
2. **Ch.2 (4):** wokeB, wisherB (busts) · docPuerto, docValle (wrong-facings).
3. **Ch.4-6 masters (32):** listed in `.shots/npc_triage.md` (acorn_baker, aurora_busker, zanzibel_*,
   lilleby_*, kvisthavn_*, etc.). These are master-only (unwired) — fixing the master is enough.

## Designs (read each NPC's current frame 0 for any not listed)
drugClerk: dark-hair store clerk, cream half-apron over red tee, blue jeans, brown shoes ·
docBrickton: doctor, glasses, white lab coat, blue tie, grey trousers · priestOtter: elderly priest,
gray hair, ankle-length black cassock, white collar · arcadeOwner(BUST): jolly gray-hair man, purple
star tee → add dark-blue jeans + gray sneakers · permit(BUST): short dark afro, brown skin,
orange-white striped shirt + badge → add grey trousers + brown shoes · caddy(BUST): golf caddy,
brown skin, white clover cap, gray polo, shoulder towel → add khaki shorts + white sneakers.

## ===== THE WORKFLOW (proven this session) =====

### Browser / ChatGPT setup
User "Jonathan Layman / Pro" is logged into chatgpt.com (UNLIMITED, but image-gen RATE-LIMITS if you
push too hard — ~5-6 concurrent tabs is the ceiling; one tab froze at 6). Load Chrome MCP tools via
ToolSearch (`mcp__Claude_in_Chrome__*`): `list_connected_browsers` → `select_browser` →
`tabs_context_mcp{createIfEmpty:true}`. One browser ("Browser 1"). Open ~5 tabs, navigate each to
`https://chatgpt.com`, wait ~6s. Model must be a non-Pro one (the default "High" is fine).

### SEND a prompt — via JS-INJECTION (the unlock; works on ANY background tab)
Do NOT rely on clicking/typing (a background tab silently drops the type). Use `javascript_tool`:
```js
await (async()=>{
  const pm=document.querySelector('div.ProseMirror'); if(!pm) return 'no pm';
  pm.focus();
  document.execCommand('selectAll',false,null);
  document.execCommand('insertText',false,`<PROMPT TEXT — backticks avoid escaping>`);
  await new Promise(r=>setTimeout(r,400));
  const btn=document.querySelector('button[data-testid="send-button"]')
    ||[...document.querySelectorAll('button')].find(b=>/send prompt/i.test(b.getAttribute('aria-label')||''));
  btn.click(); return 'sent';
})()
```
One ChatGPT conversation PER NPC; generate the 5 facings as SERIAL follow-up turns in that
conversation ("Now the SAME character in <facing>...") so all facings stay consistent.

### CAPTURE a result — sequentially, one tab at a time (parallel captures cross-contaminate)
When done (`!document.querySelector('button[aria-label*="Stop"]')`), via `javascript_tool`:
```js
await (async()=>{
  if(document.querySelector('button[aria-label*="Stop"]')) return 'still generating';
  let imgs=[...document.querySelectorAll('img')].filter(i=>/estuary\/content|oaiusercontent|backend-api|sdmntpr/.test(i.currentSrc||i.src));
  const img=imgs[imgs.length-1];                       // newest result
  img.loading='eager'; try{await img.decode();}catch(e){}
  let t=0; while(img.naturalWidth===0 && t++<20){await new Promise(r=>setTimeout(r,300));}
  const c=document.createElement('canvas'); c.width=img.naturalWidth; c.height=img.naturalHeight;
  c.getContext('2d').drawImage(img,0,0);
  const blob=await new Promise(r=>c.toBlob(r,'image/png'));
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='mf_<id>_<facing>.png';
  document.body.appendChild(a); a.click(); a.remove(); return 'exported '+img.naturalWidth+'x'+img.naturalHeight;
})()
```
UNIQUE download name each time (Chrome appends ` (1)`; re-reading the base name gives the STALE
file). If the eval times out (renderer busy mid-render) just retry; if a tab truly freezes, navigate
it to `https://chatgpt.com` and re-fire that facing.

### PROMPTS
DOWN (new conversation): `Pixel-art character sprite sheet. On ONE solid FLAT chroma-green background
(#00FF00) -- no shadow/ground/text -- a horizontal strip of THREE poses with WIDE green gaps, a WALK
CYCLE reading STAND - WALK - STAND, ALL facing the CAMERA (front, face visible). Character: <design>.
Draw the COMPLETE FULL BODY head-to-feet (do NOT crop at the waist). Thick clean dark outlines, soft
flat cel shading. Pose 1 = STAND: still, feet flat together, arms relaxed, NOT walking. Pose 2 =
WALK: left leg lifted forward, knee bent, foot off ground. Pose 3 = WALK: right leg lifted forward.`
LEFT follow-up: `Now the SAME character -- identical outfit, colors, props, FULL BODY head-to-feet --
in STRICT LEFT SIDE PROFILE (pure side view, camera at his left, body facing screen-LEFT, only one
eye/side of face visible, NOT angled toward camera). Same chroma-green strip of THREE: Pose 1 STAND
in profile feet together; Pose 2/3 WALK in profile, near then other leg striding, knee up.`
UP: `...seen FROM BEHIND (back view, NO face)...` · DOWN-LEFT: `...THREE-QUARTER FRONT angled toward
lower-LEFT, face partly visible (not full profile, not straight-on)...` · UP-LEFT: `...THREE-QUARTER
BACK angled toward upper-LEFT, mostly back of head/shoulders, NO face...`. Always: Pose1 STAND clearly
distinct from the two WALK poses (feet together vs one foot lifted).

### SLICE (h=108, foot=16 for all these NPCs)
`node tools/slice-chroma-strip.js "C:/Users/jay19/Downloads/mf_<id>_<facing>.png" .shots/<id>_<facing> --expect=3 --h=108 --foot=16`
→ `<id>_<facing>_0.png` (stand), `_1` (walkA), `_2` (walkB). Verify with
`node tools/montage-frames.cjs .shots/check.png <frames...>` then Read it.

### ASSEMBLE (frame map: DIRS=[down,left,right,up]; DIAG order [downright,downleft,upright,upleft])
`cp assets/art/characters/<id>_anim_46_4x.png .shots/<id>_build.png`, then
`node tools/assemble-char-sheet.js .shots/<id>_build.png .shots/<id>_build.png \`
` --place=0:.shots/<id>_down_0.png --place=1:.shots/<id>_down_1.png --copy=2:0 --place=3:.shots/<id>_down_2.png \`
` --place=4:.shots/<id>_left_0.png --place=5:.shots/<id>_left_1.png --copy=6:4 --place=7:.shots/<id>_left_2.png \`
` --place=12:.shots/<id>_up_0.png --place=13:.shots/<id>_up_1.png --copy=14:12 --place=15:.shots/<id>_up_2.png \`
` --mirror=8:4 --mirror=9:5 --mirror=10:6 --mirror=11:7 \`
` --place=27:.shots/<id>_downleft_0.png --place=28:.shots/<id>_downleft_1.png --place=29:.shots/<id>_downleft_2.png \`
` --place=33:.shots/<id>_upleft_0.png --place=34:.shots/<id>_upleft_1.png --place=35:.shots/<id>_upleft_2.png \`
` --mirror=24:27 --mirror=25:28 --mirror=26:29 --mirror=30:33 --mirror=31:34 --mirror=32:35 \`
` --copy=16:1 --copy=17:3 --copy=18:5 --copy=19:7 --copy=20:9 --copy=21:11 --copy=22:13 --copy=23:15 \`
` --copy=36:25 --copy=37:26 --copy=38:28 --copy=39:29 --copy=40:31 --copy=41:32 --copy=42:34 --copy=43:35 \`
` --copy=44:0 --copy=45:0`
(0/2 = stand, 1/3 = the two walk steps → plays stand-walk-stand-walk. right = mirror of left.
runs 16-43 = walk copies, never play for non-followers. 44/45 = front-stand idle, fixes the
back-view-idle bug; blink is optional polish.)

### VERIFY + SYNC
`node tools/extract-char-frames.js .shots/<id>_build.png .shots/<id>_review.png 0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15` and Read it (each cardinal row must read stand-walk-stand-walk; left/right profiles; up = back). Then montage 24-35 for diagonals. When good:
`cp .shots/<id>_build.png assets/art/characters/<id>_anim_46_4x.png` (runtime — skip for ch4-6 master-only NPCs)
`cp .shots/<id>_build.png assets/art/masters/characters/animation/<id>_anim_46_4x_master.png` (master)

## Tools (all exist in tools/)
`extract-char-frames.js` montage · `slice-chroma-strip.js`/`slice-chroma-pose.js` · `assemble-char-sheet.js` ·
`montage-frames.cjs` · `survey-grid.cjs <frame> <cols>` (SC=2 env = 2x; excludes heroes) ·
`detect-legs.cjs` (height scan; NOTE misses busts — they're scaled to full height) · `ref-server.cjs` (unused).

## Notes
- Verify OFFLINE with frame montages (Read) — the in-game preview cold-boot stalls.
- PNG swaps don't affect tsc/validate/vitest; still run `npm run validate` before declaring done if any `.ts` changed (you shouldn't need to).
- Multi-agent triage worked great (6 parallel agents reading [0,4,8,12,27,33] montages). Generation
  itself can't be multi-agented (one shared browser) — parallelize via ~5 concurrent tabs instead.
- Leave everything UNSTAGED for the user. Update `.shots/npc_triage.md` as NPCs complete.
