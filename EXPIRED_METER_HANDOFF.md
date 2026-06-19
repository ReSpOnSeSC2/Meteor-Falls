# Handoff: finish the LAST enemy overworld 8-dir sheet (`expired_meter`)

You are continuing an art pass on the game **Meteor Falls** (`C:\Meteor Falls`, branch
`art/dorin-upwalk-frames-12-15`). A previous session finished **6 of the 7** remaining
roaming-enemy overworld sprite sheets. **Only `expired_meter` is left.** It was blocked by
two infrastructure problems (see "Why it's not done yet"), not by anything wrong with the
method — the method is proven (it worked 6×).

Your job: produce `assets/art/enemies/overworld/expired_meter_8dir.png`, wire it in, verify
the audit hits **45/49**, and commit.

---

## What is already DONE (committed at HEAD `a7064ecd`, audit = 44/49)
These 6 sheets exist, are sliced/assembled/wired into both lists, and are committed:
`quota_clock`, `showroom_mannequin`, `good_investment`, `rogue_icecream_truck`,
`tick_nymph`, `the_suit`.

Do **not** redo them. `npm run visuals:audit` currently prints `44/49 authored, 5 legacy`.
After you finish `expired_meter` it must print **`45/49 authored, 4 legacy`**. The 4 that
stay "legacy" forever are fine: `skeeter_swarm` + 3 bosses (`gilded_grin`,
`headmaster_mainframe`, `titanic_tick`).

## What is LEFT — `expired_meter`
- **type:** object — an angry **parking meter** on a post with a little red "expired" flag.
- **battle reference sprite:** `assets/art/enemies/battle_expired_meter.png` (112×144, alpha).
- **goal file:** `assets/art/enemies/overworld/expired_meter_8dir.png` — 768×128, eight
  96×128 frames, order `0=down 1=downleft 2=left 3=upleft 4=up 5=upright 6=right 7=downright`.
  Frames 5/6/7 are auto-mirrors of 3/2/1, so you only generate **5 views**:
  down(front), downleft(¾-front-left), left(side), upleft(¾-back-left), up(back).

## Reference images are ALREADY MADE (in `.shots/`)
- `.shots/ref_expired_meter.png` — 144×280, meter on white (the standard ref).
- `.shots/ref_expired_meter_sq.png` — 320×320, same meter centered on a square white canvas
  (made because the tall-narrow ref was suspected of causing failures — it was NOT the cause,
  but the square one is fine to use; pick either).
- Helper that builds a ref from a battle sprite: `node .shots/make-ref.cjs <id>` (pngjs only).

---

## THE WORKFLOW (proven 6× this session) — do this for `expired_meter`

### 0. Browser setup (Chrome extension MCP)
`mcp__Claude_in_Chrome__*`. `list_connected_browsers` → `select_browser` →
`tabs_context_mcp{createIfEmpty:true}`. Logged in as the user already.
**⚠️ SHARED-PROFILE COLLISION (the real blocker last time):** another agent was driving the
SAME browser profile, and ChatGPT's composer **draft is shared per profile** — foreign text
("please confirm driver arrived to receiver…") appeared in the composer and blocked pasting.
**Before each paste, read the composer** (`document.querySelector('div.ProseMirror').textContent`)
— if it contains text you didn't put there, DO NOT clear it (that wipes the other agent's
prompt). Wait until it's empty, or use a browser/profile no other agent is driving.

### 1. Put the reference on the OS clipboard (PowerShell, STA — it is STA by default)
```powershell
Add-Type -AssemblyName System.Windows.Forms,System.Drawing
$i=[System.Drawing.Image]::FromFile('C:\Meteor Falls\.shots\ref_expired_meter_sq.png')
[System.Windows.Forms.Clipboard]::SetImage($i)
[System.Windows.Forms.Clipboard]::ContainsImage()   # must print True
```

### 2. Fresh chat + paste (ATOMIC, retry once)
Navigate the tab to `https://chatgpt.com/`. Then in ONE `browser_batch`:
`left_click [820,338]` → `wait 2` → `key "ctrl+v"` → `wait 3` → `screenshot`.
- The FIRST paste right after a navigate almost always MISSES (page still settling). Just run
  the same atomic click+paste batch **again** — the 2nd lands. (Click and paste MUST be in one
  batch; focus goes stale between separate calls.)
- VERIFY the thumbnail in the screenshot is the parking meter (catches clipboard races).

### 3. Send the turnaround prompt (via JS — execute in the page)
```js
const PROMPT = `Generate ONE image now: a TOP-DOWN RPG OVERWORLD sprite sheet of the SAME object from the reference — same EarthBound / Mother art style, same design (an angry parking meter on a short post, with its little red flag). Rotate the whole object.
Draw it from FIVE angles, evenly spaced left-to-right with a clear empty gap between each, all the same size on the same baseline:
1) FRONT  2) THREE-QUARTER FRONT-LEFT  3) LEFT SIDE  4) THREE-QUARTER BACK-LEFT  5) BACK.
Flat solid pure magenta background (RGB 255,0,255) filling every gap. No text, no labels, no ground shadow. Output one single image.`;
const pm = document.querySelector('div.ProseMirror'); pm.focus();
document.execCommand('insertText', false, PROMPT);
document.querySelector('button[data-testid="send-button"]').click();  // only exists AFTER text is inserted
```

### 4. Handle the no-op / clarifying question
The model OFTEN replies "what would you like me to generate?" instead of generating. If after
~12s there's no image and it asked a question, inject a nudge and send again:
```js
const pm=document.querySelector('div.ProseMirror'); pm.focus();
document.execCommand('insertText',false,'Please generate that image now — the 5-view overworld turnaround (front, ¾ front-left, left side, ¾ back-left, back), all the same size on the same baseline with a clear gap between each, on a flat solid pure magenta (RGB 255,0,255) background. No text, no shadow. Output one single image.');
document.querySelector('button[data-testid="send-button"]').click();
```

### 5. Wait & download — **CAP AT ~90 SECONDS, then abandon+retry**
Poll state via JS. **Wrap every JS poll in an IIFE** (`await (async()=>{ ... })()`) — the page
REPL keeps top-level `let`/`const` between calls, so re-declaring `imgs`/`st` throws
`Identifier already declared`. **Do NOT return raw page innerText** — a data-filter blocks the
tool result ("[BLOCKED: Cookie/query string data]"); return only booleans/numbers/short tags.

Poll logic:
```js
await (async () => {
  const st  = !!document.querySelector('button[aria-label*="Stop"]');     // generating
  const gi  = [...document.querySelectorAll('img')].filter(i=>i.alt?.startsWith('Generated image'));
  const failed = /Image generation failed/i.test(document.body.innerText);
  if (gi.length) {                                                         // DONE → download
    const im=gi[gi.length-1];
    const b=await(await fetch(im.currentSrc||im.src)).blob();
    const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='expired_meter_ow_src.png';
    document.body.appendChild(a);a.click();a.remove();
    return JSON.stringify({DOWNLOADED:true, bytes:b.size});
  }
  return JSON.stringify({st, gi:gi.length, failed});
})();
```
Download works on a background tab (fetch→blob→`a.click()`); file lands in
`C:\Users\jay19\Downloads\expired_meter_ow_src.png`.

**KEY LESSON about `expired_meter` specifically:** it failed/wedged ~6× last session while the
other 6 enemies sailed through. Two failure modes:
- **Fast fail:** "Image generation failed / Try again". Just click the **Try again** button
  (`[...document.querySelectorAll('button')].find(b=>/try again/i.test(b.textContent))?.click()`)
  — cheap, often works on the next try.
- **Slow wedge:** the Stop button stays present for 3–5 min and an image NEVER appears. These
  never recover. If no `Generated image` after ~90s, **abandon** (navigate to a fresh
  `https://chatgpt.com/`, re-paste, re-send) rather than waiting.
- A page **reload** (`location.reload()`) reveals the true server-side state when the streaming
  UI looks stuck (e.g. shows "Sketching it out" with the Stop button after reload = still
  genuinely generating; shows "Image generation failed" = really failed).
The other 6 each succeeded within ~50–90s, usually on the 1st or 2nd attempt. Just keep
retrying fresh chats (when the composer is free) until one lands; it WILL.

### 6. Slice the downloaded turnaround → 5 view PNGs
```bash
cp /c/Users/jay19/Downloads/expired_meter_ow_src.png .shots/expired_meter_ow_src.png
node tools/split-turnaround.js .shots/expired_meter_ow_src.png .shots/expired_meter_ow down,downleft,left,upleft,up
```
Must print `segments found: 5/5`. If it prints a different count, the gen didn't put clean
empty gaps between the 5 views → regenerate (re-emphasize "a clear empty gap between each").
Eyeball `.shots/expired_meter_ow_src.png` (Read it) — confirm 5 parking-meter views on magenta:
front, ¾-front-left, left side, ¾-back-left, back.

### 7. Assemble the 8-dir sheet (auto-fits cells, mirrors 5←3,6←2,7←1)
```bash
node tools/assemble-enemy-8dir.js expired_meter .shots/expired_meter_ow_down.png .shots/expired_meter_ow_downleft.png .shots/expired_meter_ow_left.png .shots/expired_meter_ow_upleft.png .shots/expired_meter_ow_up.png
```
Then **Read** `assets/art/enemies/overworld/expired_meter_8dir.png` and eyeball all 8 facings.

### 8. WIRE (add `'expired_meter'` to BOTH lists)
The other 6 ids are ALREADY in both lists; just add `expired_meter`:
- `src/data/visuals.ts` → `ENEMY_OVERWORLD_SHEET_IDS` (the `as const` array; add after `'the_suit',`).
- `src/spritegen/authored.ts` → `ENEMY_OVERWORLD_ART` (the array before `.map((id) => ({`; add after `'the_suit',`).
`enemies.ts`'s `E()` wrapper auto-sets `overworld:'ow_enemy_expired_meter'` — nothing else to wire.
**⚠️ Re-READ both files right before editing** — they get reformatted by a linter and reset by
other agents' git ops.

### 9. VERIFY + COMMIT
```bash
npm run visuals:audit      # must print 45/49 authored, 4 legacy
npx tsc --noEmit           # must exit 0
```
Then commit **scoped tightly** (the working tree has 700+ files of other agents' work — NEVER
`git add -A`):
```bash
git add assets/art/enemies/overworld/expired_meter_8dir.png src/data/visuals.ts src/spritegen/authored.ts
git commit -m "Enemy art: expired_meter overworld 8-dir sheet (final roamer → 45/49)"
```
NOTE: last session another agent's broad commit auto-swept the finished files into HEAD before
an explicit commit ran, so after editing, check `git status` — if your files are already
committed/clean, there's nothing to do. Getting the work onto `main`: the user drives the
branch→main merge (their normal "updates" flow), so you can stop after the branch commit unless
told otherwise.

---

## Files & tools reference
- Battle ref: `assets/art/enemies/battle_expired_meter.png`
- Prebuilt refs: `.shots/ref_expired_meter.png`, `.shots/ref_expired_meter_sq.png`
- Ref maker: `.shots/make-ref.cjs`
- Slicer: `tools/split-turnaround.js`  ·  Assembler: `tools/assemble-enemy-8dir.js`
- Wiring: `src/data/visuals.ts` (`ENEMY_OVERWORLD_SHEET_IDS`), `src/spritegen/authored.ts` (`ENEMY_OVERWORLD_ART`)
- Audit: `npm run visuals:audit`
- Project canon: `CLAUDE.md`, `docs/ART_PIPELINE.md` (§ Character 46-frame walk sheets has the sibling pipeline)

## Why it's not done yet (so you don't repeat the dead ends)
1. **ChatGPT image backend was degraded** — `expired_meter` hit fast "Image generation failed"
   and multi-minute "One last tweak…" wedges repeatedly. Fix: retry fresh, 90s cap.
2. **Shared-profile composer collision** — a second agent driving the same Chrome profile had a
   draft sitting in the composer, blocking the paste. Fix: only paste when the composer is empty,
   or use a profile no other agent is driving. Do NOT clear someone else's draft.

The square-ref theory (tall-narrow input causing failures) was tested and was NOT the cause —
it's just intermittent backend luck + the composer collision. Persistence works.
