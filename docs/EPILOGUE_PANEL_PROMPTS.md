# Resume prompt — generate the 28 epilogue-card panels (S21 / ADR-128)

> **Paste everything below into a fresh agent** that has: the Chrome MCP (`mcp__Claude_in_Chrome__*`),
> the Bash tool, and this repo at `C:\Meteor Falls`. It resumes the branching-ending art pass
> exactly where the last session stopped. The 4 marquee panels are already done; this finishes
> the 28 composed-ending **credits cards**.

---

## 0) Mission

Author the **28 epilogue-card panels** for the Meteor Falls branching endings, using the canonical
**ChatGPT → PNG** image workflow (image generation is ALWAYS chatgpt.com, never procedural). For each
card: generate a 16:9 EarthBound/Mother-style still on chatgpt.com, capture it, downscale to
**1600×900**, and drop it at `assets/art/cutscenes/ch10/<art_stem>_4x.png`. **All wiring is already
done** — each panel plays automatically once its PNG exists; a missing panel no-ops cleanly.

You are NOT writing code (except possibly fixing a path). You are generating + placing art.

---

## 1) What is already done (do NOT redo)

- The branching feature (ADR-126/127/128) is built, tested, and green: 3 choices + Jay's "Held
  Breath" rewind + 9 composed endings. Spec: `docs/BRANCHING_REDESIGN.md`.
- **4 marquee panels** are generated, placed (1600×900), and wired:
  `ch6/held_breath_awaken_4x.png`, `ch6/choice_ch6_the_string_4x.png`,
  `ch9/choice_ch9_iron_or_open_4x.png`, `ch10/choice_ch10_what_the_song_is_for_4x.png`.
- **All 28 epilogue cutscenes are registered** in `src/data/cutscenes.ts` (`CH_EPILOGUE`, built
  programmatically from `ENDING_CARDS`) and played by `OverworldScene.playEnding` — each as
  `playCutscene(this, card.dialogue)` then the caption. So you only need to DROP PNGs in; no code.
- The downscale tool exists: `tools/downscale-backdrop.js` (area-average resize, opaque scenes).

**The naming contract (critical):** for an ending card whose dialogue key is `epi_<id>`, the panel
file MUST be `assets/art/cutscenes/ch10/epi_<id>_4x.png` (the cutscene id, art stem, and dialogue
key are all `epi_<id>`). The 28 stems are listed in §6.

---

## 2) The per-panel pipeline (repeat 28×)

1. **chatgpt.com** (logged in, Pro is fine): click **New chat** → the **`+`** (composer "Add files
   and more") → **Create image**.
2. **Type the prompt** (the §5 style header + the card's §6 brief) into the composer.
3. **Set aspect ratio = Widescreen 16:9** (see §3 gotcha — do this AFTER typing, and verify).
4. **Send.** Wait ~45–90s ("Thought for Ns" + an "Edit Image" button = done).
5. **Capture** with the JS snippet in §4 (downloads `mf_epi_<id>.png` to `Downloads`).
6. **Process** with the Bash one-liner in §4 → writes `assets/art/cutscenes/ch10/epi_<id>_4x.png`
   (1600×900) and a master copy in `assets/art/masters/generated/epi_<id>_src.png`.
7. Move to the next card. **One New chat per card** keeps it clean and avoids the tab wedging.

Work **high-impact first** (priority A in §6), then B, then C. After every ~6 panels, run §7 to
keep things green and catch any path typos early.

---

## 3) Browser-automation gotchas (learned the hard way)

- **Aspect ratio resets to "Auto" and the toolbar MOVES as you type.** Reliable sequence: New chat
  → `find` the `+` button → click it → click **Create image** → click the composer → **type the
  prompt** → then `find` the **"Choose image aspect ratio" button** (it shows "Auto"), click it,
  then `find` **"Widescreen 16:9"** and click it → `find` the ratio button again and confirm it now
  reads **"16:9"** BEFORE sending. Do not trust fixed pixel coordinates for the ratio menu.
- **A New chat sometimes keeps a stale prompt in the composer.** If you see leftover/duplicated
  text, click the textarea, `key ctrl+a`, `key Delete`, then proceed.
- **The capture JS returns `{}`** in the MCP (serialization quirk) — that's NORMAL; the download
  still happens. Confirm with the Bash `ls` in §4, not the JS return value.
- **The tab can WEDGE after several generations** (screenshots/finds time out with
  "waited 45000ms for document_idle"). Fix: `navigate` the tab to `https://chatgpt.com/` to reset,
  or reload Chrome. Then continue.
- **The extension can DISCONNECT** under load. Fix: `list_connected_browsers` → `select_browser`
  with the returned `deviceId` (or `switch_browser` and have the user click Connect).
- Downloads land in `C:\Users\jay19\Downloads` (same machine as Bash). This account already
  batch-generates art here — the folder is full of prior `mf_*` drops; that's expected.

---

## 4) Capture + process commands

**Capture (run via the Chrome `javascript_tool` on the ChatGPT tab; replace `<id>`):**
```js
(async () => {
  const imgs = [...document.querySelectorAll('img')].filter(i => i.naturalWidth >= 512);
  if (!imgs.length) return 'NO_IMG_YET';
  const im = imgs.sort((a,b)=> b.naturalWidth*b.naturalHeight - a.naturalWidth*a.naturalHeight)[0];
  const src = im.currentSrc || im.src;
  let blob;
  try { blob = await fetch(src).then(r => r.ok ? r.blob() : Promise.reject(r.status)); }
  catch(e){ await im.decode().catch(()=>{}); const c=document.createElement('canvas');
    c.width=im.naturalWidth; c.height=im.naturalHeight; c.getContext('2d').drawImage(im,0,0);
    blob = await new Promise(res=>c.toBlob(res,'image/png')); }
  const url=URL.createObjectURL(blob); const a=document.createElement('a');
  a.href=url; a.download='mf_epi_<id>.png'; document.body.appendChild(a); a.click(); a.remove();
  return 'queued';
})()
```

**Process (Bash; replace `<id>`):**
```bash
cd "C:/Meteor Falls" && F="C:/Users/jay19/Downloads/mf_epi_<id>.png"; sleep 1; \
[ -f "$F" ] && node tools/downscale-backdrop.js "$F" assets/art/cutscenes/ch10/epi_<id>_4x.png 1600 900 \
  && cp "$F" assets/art/masters/generated/epi_<id>_src.png && echo "PLACED epi_<id>" || echo "NOT_DOWNLOADED_YET"
```
(Source from gpt-image 16:9 is ~1672×941; `downscale-backdrop.js` area-averages it to exactly
1600×900 — same tool the 4 marquee panels used.)

---

## 5) Shared style header (prefix EVERY ChatGPT prompt with this)

> Widescreen **16:9** cinematic CREDITS illustration in the warm painterly **SNES-JRPG style of
> EarthBound / Mother** — soft gouache shading, gentle outlines, nostalgic 1990s storybook warmth.
> **NO text, NO UI, NO captions, NO borders or letterboxing; the art fills the entire frame.**
> [SCENE]. Painterly, cinematic, tender. No words anywhere in the image.

**Character & motif reference (keep consistent across all cards):**
- **Jay** — a quiet ~12-year-old boy, **striped shirt + red ball cap**, EarthBound-kid proportions, shy.
- **Mia** — a kind girl, often with **folded praying hands**, soft golden light around her.
- **Milo** — a boy in **round glasses**, gadget tinkerer.
- **Pippa** — a **tiny royal page** (little tabard + cap); she's from a 1/100-scale realm, often comically small.
- **Dorin** — a young **monk / "Walker"** in a gi with **prayer beads**, calm.
- **Buni** — a warm Romanian grandmother.
- **Star Locket** — a small glowing **star-shaped pendant**.
- **The Hush** — a vast, gentle, **faceless darkness** (never a monster).
- **Mars "Sea of Silence"** — a still black sea under an alien starfield.
- **Fireflies** — small warm lights (the old warmth returning).
- **Otterbrook** — a cozy 1990s small-town **Ohio** neighborhood.

---

## 6) The 28 cards — id, file stem, caption (for tone), and the scene to depict

Generate in priority order. **Priority A** (the cards seen in most endings) first.

### Priority A — framing, home, heroes (12)
| Art stem (file = `…/ch10/<stem>_4x.png`) | In-game caption (for mood) | SCENE to draw |
|---|---|---|
| `epi_home_long_shot` | "…two little voices, fighting over the lemonade money… a single firefly drifts past the porch light. This time, the bug zapper is unplugged." | Night, a cozy Ohio house seen from the front yard; the front door open, warm kitchen light spilling onto the porch steps; **Jay** at the threshold, home, gentle smile; one upstairs window lit with two small kid silhouettes; a single firefly by the porch light; an unplugged bug zapper hanging dark in a corner. |
| `epi_home_standard` | "{rex} walked the long way home… Somebody had left the kitchen light on. He was home." | Dusk; **Jay** walking the long way up a quiet street past a hand-drawn lemonade stand, toward a house with the front door open and warm kitchen light inside. |
| `epi_jay_free` | "…can bend the whole world to his will and CHOOSES to ask first… He eats too many corn dogs. He's happy." | Sunny backyard, golden hour; **Jay** (a little older) on porch steps surrounded by smiling friends (**Mia**, **Milo** in glasses, tiny **Pippa**, **Dorin** in robes), eating corn dogs, shy and genuinely happy. |
| `epi_jay_holding` | "{rex} keeps the Locket on his nightstand where he can see it… learning not to want to. Mia checks on him." | A quiet bedroom at night; **Jay** alone at a nightstand looking at the small glowing **Star Locket** he set down; **Mia** gently in the doorway, checking on him; warm lamp light. |
| `epi_tone_open_window` | "…a few windows, here and there, stayed open all night. Just in case something lonely wanted in." | A pre-dawn Otterbrook street, soft blue light; a couple of house windows left open all night, warm light inside, curtains stirring; tender and quiet. |
| `epi_tone_clean` | "…nobody, anywhere, remembered to be afraid." | A bright, clean Otterbrook morning; sun over rooftops, kids' bikes on lawns, not a shadow anywhere — the dark simply gone. |
| `epi_mia_forgive` | "She leaves a porch light on. She won't say who for." | Evening porch; **Mia** leaving a single porch light on, looking out into the gentle dark with tenderness. |
| `epi_mia_silence` | "She runs the youth choir now… 'Ask Mars.'" | A small-town church hall, warm light; **Mia** leading a youth choir of kids mid-song. |
| `epi_milo_open` | "…the Professor learned to call his son on Sundays, and {milo}… always picks up." | A garage/launch field at golden hour; **Milo** (glasses) and his bespectacled scientist dad beside a small home-built rocket, sharing tea, reconciled. |
| `epi_milo_iron` | "He builds bikes for kids now. He says it's better work. He's right." | A sunny workshop; **Milo** (glasses) building/repairing children's bicycles, a row of finished bikes; content but a touch graver. |
| `epi_pippa_minister` | "…immediately mistaken for a commemorative statue… furious about how cute the medal is." | The tiny tabletop realm of Minimus; tiny **Pippa** in a grand-marshal sash on a podium, mistaken for a statue as tiny villagers salute; proud and exasperated; a comically cute medal. |
| `epi_dorin_named` | "Buni keeps his beads on the mantel and his chair at the table. He answers her letters now." | A cozy Romanian cottage hearth; young monk **Dorin** at the mantel (his prayer beads on it), peacefully writing/answering a letter; **Buni's** warm kitchen behind him. |

### Priority B — Hush fates + world-states (10)
| Art stem | Caption | SCENE |
|---|---|---|
| `epi_hush_befriended` | "…a single firefly-light comes up off the water… it just likes the company." | The Mars **Sea of Silence** at peace under stars; a single warm firefly-light rising off the still black water; gentle, no longer hungry. |
| `epi_hush_sealed` | "…went still, and stayed still. Some things you let be empty." | The Mars Sea of Silence gone perfectly still and empty under the starfield; a calm, quiet void. |
| `epi_hush_spent` | "…it's in a locket, in a sock drawer, in Ohio now. Some nights it hums." | A 1990s bedroom; a slightly open sock drawer with a small **star-locket battery** faintly glowing/humming inside; a haunting keepsake. |
| `epi_hush_owed` | "…the loneliest thing in the universe put its hunger down… He's working on it. Buni says there's time." | **Buni's** warm Romanian kitchen; **Jay** at the table, the grandmother setting down food beside him; quiet, working through something. |
| `epi_hush_default` | "…gone from Mars, and from the spaces between people, and from the flat places in the music. Gone." | A calm starfield over the still Martian sea; the dark simply absent; serene. |
| `epi_world_chosen` | "Everybody started calling their moms again… That turned out to be the whole point." | A warm small-town montage feel: people at payphones and kitchen phones calling home, smiling, reconnecting. |
| `epi_world_warm_guarded` | "There is a man in Cleveland who wakes up un-haunted and un-warmed… He's getting there." | A warm small town at dusk, but one Cleveland window where a lonely middle-aged man (Vlad) sits, un-haunted but hollow; a phone reaching toward him. |
| `epi_world_grateful_uneasy` | "…a boy who could've decided things for everyone. The boy knew. He decided, every morning after, not to." | **Jay** at his bedroom window each morning, the bright unaware world below; the quiet weight of choosing not to use his power. |
| `epi_world_quiet_kept` | "Some victories you keep in your pocket and don't take out at parties." | The five kids walking away together down a road, victorious but private; the "how" kept in their pockets. |
| `epi_world_default` | "The world the kids carried home was a little warmer than the one they left." | The kids' cozy small town a little warmer/golden; the five of them together. |

### Priority C — party-fate variants + slot defaults (6)
| Art stem | Caption | SCENE |
|---|---|---|
| `epi_pippa_left` | "…then, one spring, a matchbox letter came. 'I needed to know my choices were mine.'" | Tiny **Pippa** walking back toward Minimus alone the long way; inset/foreground a tiny matchbox-sized letter arriving. |
| `epi_dorin_left` | "He went back to the mountain instead. He prays for the man in the castle." | Young monk **Dorin** alone on the misty **Mute Mountain**, kneeling in prayer; solemn, solitary. |
| `epi_jay_default` | "…a quiet kid from Ohio who had carried the old light all the way to Mars and back." | **Jay** walking home a quiet hero at golden hour, the **Star Locket** at his side; simple and kind. |
| `epi_mia_default` | "…the strays, for the flat places in people. The light kept answering." | **Mia** praying with folded hands, soft golden light answering; kids and strays nearby. |
| `epi_milo_default` | "…built things that helped, and drank tea that was too good for anyone." | **Milo** (glasses) at a workbench building helpful gadgets, a teacup steaming, a phone nearby. |
| `epi_tone_default` | "The dark ended, the way the old stories promised it would. The morning came. It was enough." | A gentle Otterbrook morning, soft sun; the dark ended; calm and enough. |

---

## 7) Verify (run after each batch and at the end)

```bash
cd "C:/Meteor Falls" && ls assets/art/cutscenes/ch10/epi_*_4x.png | wc -l   # how many of 28 placed
cd "C:/Meteor Falls" && node -e "for(const f of require('fs').readdirSync('assets/art/cutscenes/ch10').filter(x=>/^epi_.*_4x\.png$/.test(x))){const b=require('fs').readFileSync('assets/art/cutscenes/ch10/'+f);console.log(f, b.readUInt32BE(16)+'x'+b.readUInt32BE(20));}"  # all must read 1600x900
cd "C:/Meteor Falls" && npm run build 2>&1 | grep -iE "epi_|error TS|✓ built" | head   # panels should emit to dist/assets/
```

**Build-red caveat:** the repo may show validation errors UNRELATED to this work (e.g.
`[visual-id] enemy …` from a parallel enemy-art pass). Those are not yours — confirm any failing
lines do **not** mention `epi_`, `choice_`, `cutscene`, or `endings`, and proceed. `tsc` passing +
the `epi_*` PNGs emitting to `dist/assets/` is the success signal for this task.

**Optional live render check** (Vite preview, hidden tab pauses Phaser — pump the loop):
start the dev server (`meteor-falls`, port 5199), reload the page, then in the page console
`window.pump(60,16)` repeatedly until boot finishes, and confirm
`Object.keys(game.textures.list).filter(k=>/epi_/.test(k))` is non-empty. (Slow; the green build is
sufficient proof.)

---

## 8) Done when

All 28 `assets/art/cutscenes/ch10/epi_*_4x.png` exist at 1600×900, masters are in
`assets/art/masters/generated/`, and `npm run build` emits them to `dist/assets/` (ignoring any
unrelated parallel-edit errors). No code changes are required — `playEnding` already plays them.
