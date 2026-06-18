# Continuation prompt — fix the broken NPC walk sheets (Meteor Falls)

> Paste everything below into a fresh Claude Code session at `C:\Meteor Falls` to continue.

---

You are continuing work on **Meteor Falls**, a Phaser + TypeScript top-down RPG
(EarthBound/Mother style) at `C:\Meteor Falls`. First read `CLAUDE.md` and the
memory index `C:\Users\jay19\.claude\projects\C--Meteor-Falls\memory\MEMORY.md`
(especially `character-walk-sheet-pipeline.md`, `image-generation-workflow.md`,
`meteor-falls-npc-character-art.md`). **The USER drives git — leave work UNSTAGED,
don't commit unless asked.**

## The task

Several NPC character sheets have the **"broken walk" bug = WRONG FACINGS**. The
46-frame sheets were authored with rows that don't match the engine's expected
facings (e.g. the "up" row is a profile, the "left" row is a near-front view, the
"stand" frame is a mid-stride walk pose, and the idle/blink frames are back-views).
The animation code, `standFrame`, `makeCharacterCanvas`, and `mirrorFeet` are all
CORRECT — it is purely the authored PNGs that are wrong.

**The heroes are the correct template.** `assets/art/characters/jay_anim_46_4x.png`
(rex) shows the target: down = front, left = strict left profile, right = right
profile (mirror), up = back; diagonals = 3/4 front (down-diagonals) / 3/4 back
(up-diagonals); a clean **neutral feet-together stand** alternating with clear
**knee-up walk steps** (walkB = horizontal flip of walkA). Match that.

### Scope (IMPORTANT — confirmed by the user)
- **Run animations are ONLY needed for party/follower characters** (the ones that
  follow the player). **Regular NPCs need only: neutral STAND + WALK in 8 directions
  + a correct IDLE/BLINK.** Do NOT generate run frames for regular NPCs — leave their
  run cells as harmless walk-copies (they never play).
- **OPEN QUESTION to ask the user before starting:** are any of `pajamaKid`,
  `grayCommuter`, `oldTimer` actually party/followers (and thus need runs)? Default
  assumption: all three are regular NPCs → stand + walk + idle only.

## Status

- **`mom` is DONE** (`assets/art/characters/mom_anim_46_4x.png` + its master). All 8
  facings correct, neutral stands, jay-cadence walk cycles, idle/blink fixed. Master
  synced. Her run cells hold walk-copies (she's a non-follower).
- **REMAINING:** `pajamaKid`, `grayCommuter`, `oldTimer` — same rebuild
  (stand + 8-dir walk + idle/blink, **no runs**). `pajamaKid` is already diagnosed
  as having the same wrong-facings bug (down/front is roughly OK; left/right/up and
  diagonals are wrong).
- The full pipeline + tools below are built and proven on mom. Reuse them.

## The 46-frame layout (4 columns; frame = row*4 + col)

`DIRS = [down, left, right, up]`; `DIAG_ORDER = [downright, downleft, upright, upleft]`
(defined in `src/spritegen/characters.ts`; anim defs in `src/spritegen/index.ts`).

- **Cardinal walk:** `d*4 + [0,1,2,3]` = `[stand, walkA, stand, walkB]`
  - down 0–3, left 4–7, right 8–11, up 12–15
- **Cardinal run:** `16 + d*2 + [0,1]` = `[runA, runB]`
  - down 16,17 · left 18,19 · right 20,21 · up 22,23
- **Diagonal walk:** `24 + i*3 + [0,1,2]` = `[stand, stepA, stepB]`
  - downright 24–26 · downleft 27–29 · upright 30–32 · upleft 33–35
- **Diagonal run:** `36 + i*2 + [0,1]`
  - downright 36,37 · downleft 38,39 · upright 40,41 · upleft 42,43
- **44 = idle breath, 45 = idle blink.** `standFrame`: down 0, left 4, right 8, up 12;
  diagonals = their `diagWalkBase` (27 downleft, etc.).
- **Frame size:** 96×128 (24×32 native × ART_SCALE 4). Sheet 384×1536.

### Mirror map — only generate left / up / down-left / up-left fresh; the rest mirror
A horizontal flip of a profile is the opposite profile; of a diagonal, the mirror
diagonal; of a front/back step, the other foot. So:
- **right = flip(left)** entirely (8,9,10,11 ← 4,5,6,7; run 20,21 ← 18,19)
- **down-right = flip(down-left)** (24,25,26 ← 27,28,29; run 36,37 ← 38,39)
- **up-right = flip(up-left)** (30,31,32 ← 33,34,35; run 40,41 ← 42,43)
- **down/up walkB & runB = foot-mirror of walkA/runA** (`[1,3] [13,15] [16,17] [22,23]`)
- **Reuse the correct DOWN** if the NPC's down row is already front-facing — but a
  front view CANNOT be mirrored into a profile or a back, so left, up, and the
  diagonals must be freshly generated. **A front "stand" that is actually mid-stride
  must be replaced with a true neutral stand** (mom's original down-stand was a walk
  pose — that was a bug the user caught).

## Per-NPC recipe (stand + 8-dir walk + idle, NO runs)

For each NPC (`pajamaKid`, then `grayCommuter`, then `oldTimer`):

1. **Diagnose.** `node tools/extract-char-frames.js assets/art/characters/<id>_anim_46_4x.png .shots/<id>_diag.png 0 4 8 12 27 33` and `Read` it. Note which facings are wrong and whether the down stand is a true neutral.

2. **Measure normalization metrics** (figure height + foot offset) so generated poses
   line up with the existing sheet:
   ```bash
   node -e "const{PNG}=require('pngjs'),fs=require('fs');const p=PNG.sync.read(fs.readFileSync('assets/art/characters/<id>_anim_46_4x.png'));const FW=96,FH=128;function bb(f){const sx=(f%4)*FW,sy=((f/4|0))*FH;let m=[FW,FH,0,0];for(let y=0;y<FH;y++)for(let x=0;x<FW;x++){if(p.data[((sy+y)*p.width+(sx+x))*4+3]>16){if(x<m[0])m[0]=x;if(y<m[1])m[1]=y;if(x>m[2])m[2]=x;if(y>m[3])m[3]=y;}}return{h:m[3]-m[1]+1,footFromBottom:FH-1-m[3]};}console.log(bb(0));"
   ```
   Use `--h=<height>` and `--foot=<footFromBottom>` with the slicers (mom was h=108, foot=16).

3. **Build a clean front reference** (one viewport-sized white PNG so the ChatGPT
   upload is clean). Adapt this (mom version):
   ```bash
   node -e "const{PNG}=require('pngjs'),fs=require('fs');const p=PNG.sync.read(fs.readFileSync('assets/art/characters/<id>_anim_46_4x.png'));const FW=96,FH=128;let x0=FW,y0=FH,x1=0,y1=0;for(let y=0;y<FH;y++)for(let x=0;x<FW;x++){if(p.data[(y*p.width+x)*4+3]>16){if(x<x0)x0=x;if(y<y0)y0=y;if(x>x1)x1=x;if(y>y1)y1=y;}}const cw=x1-x0+1,ch=y1-y0+1,CW=1536,CH=784,TH=700,s=TH/ch,ow=Math.round(cw*s),oh=Math.round(ch*s);const o=new PNG({width:CW,height:CH});for(let i=0;i<CW*CH;i++){o.data[i*4]=o.data[i*4+1]=o.data[i*4+2]=255;o.data[i*4+3]=255;}const offX=(CW-ow>>1),offY=(CH-oh>>1);for(let oy=0;oy<oh;oy++)for(let ox=0;ox<ow;ox++){const sx=x0+Math.floor(ox/s),sy=y0+Math.floor(oy/s),si=(sy*p.width+sx)*4,a=p.data[si+3]/255,dx=offX+ox,dy=offY+oy,di=(dy*CW+dx)*4;for(let k=0;k<3;k++)o.data[di+k]=Math.round(p.data[si+k]*a+255*(1-a));}fs.writeFileSync('.shots/<id>_ref_front.png',PNG.sync.write(o));console.log('ref',CW+'x'+CH);"
   ```

4. **Generate the facings (parallel — see "Browser workflow" below).** For each of the
   5 unique facings — **down, left, up, down-left, up-left** — generate ONE chroma-green
   image that is a **3-pose strip: `[neutral stand, walk step A, walk step B]`** (clear
   wide green gap between poses). Fire all 5 in separate tabs concurrently.
   - **Neutral stand = feet flat together, arms relaxed, NOT mid-stride.**
   - down/up steps: a clear knee-up forward/back step; walkB will be foot-mirrored, so
     a `[stand, step]` 2-pose strip is enough for those (or do 3-pose and use both).
   - **left = STRICT SIDE PROFILE** — prompt "pure side view, camera exactly at her
     side, NOT angled toward the camera" or it comes out as a 3/4 (this bit mom).
   - down-left = 3/4 FRONT angled screen-left (face partly visible); up-left = 3/4 BACK
     angled screen-left (no face).
   - Always: "Solid FLAT chroma-green background (#00FF00), no shadow, no ground, no
     text, nothing else." Attach the front reference (paste — see below) so it stays
     on-model. (A detailed text description alone works acceptably for back views if a
     paste won't stick.)

5. **Capture + slice each strip:**
   `node tools/slice-chroma-strip.js "<downloaded.png>" .shots/<id>_<facing> --expect=3`
   → `<id>_<facing>_0.png` (stand), `_1` (stepA), `_2` (stepB). `Read` a montage to
   verify facing/quality. Regenerate any that came out wrong (e.g. left not profile).

6. **Assemble** with `tools/assemble-char-sheet.js` (base = the NPC's current runtime
   sheet, out = same). Place stands into the stand cells, steps into walk cells, then
   mirror. Example pattern (adapt frame numbers from the map above):
   ```bash
   node tools/assemble-char-sheet.js A.png A.png \
     --place=0:.shots/<id>_down_0.png --place=1:.shots/<id>_down_1.png --copy=2:0 --mirror=3:1 \
     --place=4:.shots/<id>_left_0.png --place=5:.shots/<id>_left_1.png --copy=6:4 --place=7:.shots/<id>_left_2.png \
     --place=12:.shots/<id>_up_0.png --place=13:.shots/<id>_up_1.png --copy=14:12 --mirror=15:13 \
     --place=27:.shots/<id>_downleft_0.png --place=28:.shots/<id>_downleft_1.png --place=29:.shots/<id>_downleft_2.png \
     --place=33:.shots/<id>_upleft_0.png --place=34:.shots/<id>_upleft_1.png --place=35:.shots/<id>_upleft_2.png \
     --mirror=8:4 --mirror=9:5 --mirror=10:6 --mirror=11:7 \
     --mirror=24:27 --mirror=25:28 --mirror=26:29 \
     --mirror=30:33 --mirror=31:34 --mirror=32:35
   ```
   (left/right walkB are distinct profile steps — frame 7 ← left_2, frame 11 ← mirror 7.
   down/up walkB are foot-mirrors — frame 3 ← flip 1, frame 15 ← flip 13.)
   Then fill the run cells with walk copies so they're valid (optional, non-followers):
   `--copy=16:1 --copy=17:3 --copy=18:5 --copy=19:7 --mirror=20:5 --mirror=21:7 --copy=22:13 --copy=23:15 --copy=38:28 --copy=39:29 --mirror=36:28 --mirror=37:29 --copy=42:34 --copy=43:35 --mirror=40:34 --mirror=41:35`

7. **Fix idle/blink (44, 45)** — the originals are usually back-views. 44 = the neutral
   front stand (frame 0); 45 = frame 0 with eyes closed. Detect the eye row first
   (very-dark pixel clusters in the face interior, ~y26–34, two clusters left & right —
   NOT the collar at ~y40), then fill the open-eye dots with sampled skin and draw a 2px
   lid line over each eye. See the mom version in the session history / git blame of
   `mom_anim_46_4x.png`. Verify with a 6× zoom of frames 0 and 45.

8. **Verify offline:** build a review montage and `Read` it:
   `node tools/extract-char-frames.js A.png .shots/<id>_review.png 0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15` (and the diagonals 24–35), plus a stand+step montage `0 1 27 28 4 5 33 34 12 13 30 31 8 9 24 25`.

9. **Sync master:** `cp assets/art/characters/<id>_anim_46_4x.png assets/art/masters/characters/animation/<id>_anim_46_4x_master.png` (char master and runtime are the SAME 384×1536 resolution). Show the user the review montage.

## Tools (all exist in `tools/`)

- **`slice-chroma-pose.js <src.png> <out.png> [--h=108 --foot=16 --cw=96 --ch=128 --despill=1]`**
  — chroma-key a SINGLE pose (border flood-fill on green-dominant pixels) + despill +
  crop + height-normalize + bottom-center anchor into a 96×128 frame. Truncates
  canvas-exported PNGs at IEND (pngjs rejects trailing chunks).
- **`slice-chroma-strip.js <src.png> <outPrefix> --expect=N [--h --foot ...]`** — same,
  but splits an N-pose strip by green column-gaps → `<outPrefix>_0.png` … left-to-right.
- **`assemble-char-sheet.js <base.png> <out.png> --place=f:pose.png --copy=dst:src --mirror=dst:src --footmirror`**
  — places cutouts into the 46-frame grid; `--mirror` writes a horizontal flip; ops
  apply in arg order so a mirror can reference a just-placed cell; base==out is OK.
  `--footmirror` applies the standard `[1,3][13,15][16,17][22,23]` pairs.
- **`extract-char-frames.js <sheet.png> <out.png> <frame…>`** — diagnostic montage.
- (mom's reference / measure / blink / montage one-liners are inline above.)

## Browser workflow (ChatGPT image-gen) — exact, with the gotchas

The user "Jonathan Layman / Pro" is logged into chatgpt.com (UNLIMITED). codex exec
will NOT generate images — use the browser. Tools: `mcp__Claude_in_Chrome__*` (load via
ToolSearch: `select:mcp__Claude_in_Chrome__list_connected_browsers,...,browser_batch,javascript_tool,find,computer,navigate,tabs_create_mcp,tabs_context_mcp`). Also load
`mcp__Claude_Preview__*` and a couple PowerShell/Bash. `list_connected_browsers` →
there's one local browser; `tabs_context_mcp{createIfEmpty:true}` to start.

**Generate on a SOLID CHROMA-GREEN (#00FF00) background**, never "transparent" —
ChatGPT's Download flattens transparency onto a near-white matte and loses light
pixels. Green keys out cleanly (mom/most chars have no green).

**Attach the reference by PASTING (file_upload is blocked in-session; request_directory
needs supervised mode):**
1. Put the front-reference PNG on the clipboard via **STA PowerShell** (run directly in
   the PowerShell tool, do NOT nest `powershell -Command` — it strips `$` vars):
   ```
   Add-Type -AssemblyName System.Windows.Forms; Add-Type -AssemblyName System.Drawing; [System.Windows.Forms.Clipboard]::Clear(); Start-Sleep -Milliseconds 150; $i=[System.Drawing.Image]::FromFile('C:\Meteor Falls\.shots\<id>_ref_front.png'); [System.Windows.Forms.Clipboard]::SetImage($i); "img:$([System.Windows.Forms.Clipboard]::ContainsImage())"
   ```
   Confirm it prints `img:True`.
2. In the tab: **click the "Ask anything" composer bar FIRST**, then `Ctrl+V`, wait ~3s,
   and **screenshot to confirm the reference thumbnail appears** — THEN click the
   composer and type the prompt. (User's tip: "select the Ask anything bar then paste.")
   **Do NOT combine paste+type in one batch, and do NOT paste before the page has
   settled** (navigate+wait in one batch, paste in a SEPARATE batch) — otherwise the
   image silently fails to attach (and a stray paste can dump junk text).
3. If a paste won't stick after a couple tries, fall back to a fully-described text
   prompt (works fine for back views).

**SEND with a find-ref click**, never coordinates or Enter: `find "send prompt submit
button up arrow"` → `computer left_click {ref}`. The composer grows as text wraps so the
button moves (coordinate clicks miss), and synthetic Enter doesn't submit.

**CAPTURE by canvas-export JS, NOT the share-dialog "Download"** (that dumps multiple
duplicate/previous images and is unreliable). When a tab's generation is done
(`!document.querySelector('button[aria-label*="Stop"]')`), run via `javascript_tool`:
```js
const imgs=[...document.querySelectorAll('img')].filter(i=>/estuary\/content|oaiusercontent/.test(i.currentSrc||i.src));
const img=imgs[imgs.length-1];               // or the one closest to viewport-center if the main chat is long
img.loading='eager'; try{await img.decode();}catch(e){}   // background tabs DON'T decode → naturalWidth stays 0
let t=0; while(img.naturalWidth===0 && t++<15){ await new Promise(r=>setTimeout(r,300)); }
const c=document.createElement('canvas'); c.width=img.naturalWidth; c.height=img.naturalHeight;
c.getContext('2d').drawImage(img,0,0);
const blob=await new Promise(r=>c.toBlob(r,'image/png'));
const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='mf_<id>_<facing>.png';
document.body.appendChild(a); a.click(); a.remove(); 'exported '+img.naturalWidth+'x'+img.naturalHeight;
```
Use a UNIQUE `download` filename each time → it lands in `C:\Users\jay19\Downloads\` and
you slice it by that exact name (no Downloads-folder guessing). Chrome appends ` (n)` if
a name already exists.

**PARALLELIZE across ~4–6 tabs** (`tabs_create_mcp`): fire one facing per tab, then poll
each (`generating` flag + result-img dims) and capture as each finishes. Per fresh tab:
`navigate https://chatgpt.com` + wait (one batch) → paste ref (separate batch) → type →
find-ref send. A generation takes ~40–120s.

## Verification

The hidden preview tab's COLD boot stalls (rAF-throttled scene transitions never finish),
so **live in-game verification is unreliable** — the offline frame montages
(`extract-char-frames.js` + `Read`) are the exact runtime pixels the game loads and are
the source of truth. The user reviews by opening the sheet / montage PNGs directly. If
the game does happen to be already booted (`window.game.cache.bitmapFont.has('retro')`),
you can drive it per `verifying-the-running-game.md`, but don't burn time fighting a
cold boot.

## Keep green / housekeeping

A PNG swap doesn't affect `tsc`/`npm run validate`/vitest, but run them before declaring
done if you touched any `.ts`. Update the memory file `character-walk-sheet-pipeline.md`
with anything new. Leave all work UNSTAGED for the user. There may be leftover ChatGPT
tabs from a previous run — reuse or ignore them; a fresh session opens its own.

**Start by:** reading CLAUDE.md + memory, confirming the follower scope question above,
then doing `pajamaKid` end-to-end as the next pilot, then `grayCommuter`, `oldTimer`.
