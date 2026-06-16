# Prompt pack — world animations & cutscenes (authored-PNG pipeline)

Companion to [ART_PIPELINE.md](ART_PIPELINE.md). This is the full inventory of
**everything in the game that moves as you watch it** — frame-based sprite
animations, battle/minigame action sheets, ambient FX, emotes — plus the
**cutscene** illustrations, with ready-to-paste ChatGPT/imagegen prompts to
author each in the new style.

> **Golden rule:** the engine reads frames by **index**. When you assemble a
> sheet, the frame ORDER and COLUMN COUNT below are a hard contract — a frame in
> the wrong slot plays the wrong pose. Generate poses, then place them in the
> listed order.

Character walk/run/idle (the 46-frame overworld sheet) is covered separately in
the chat thread / its own pass — this doc is everything else.

> **Resolution target — ART_SCALE = 4 (→ 1600×900).** The game is moving to a 4× HD
> pixel-art bump, so every runtime cell listed below is the **1× size — multiply by 4**.
> Characters become **96×128**, which is exactly the `*_4x_master` cell, so they are
> **native at 4× (no downscale)**. Tiles → 64, busts → 128×128, battlers → 112×144,
> athletes/golfers → 128×160. Size source art to the **4× cell** (a gentle reduction,
> not the old 1× crush). This target is **live** — the HD bump shipped (ADR-110).

---

## Shared style preamble (paste at the top of every prompt below)

```
16-bit SNES / EarthBound / Mother 3-style pixel art. I'm attaching the reference
for this character/subject — match it EXACTLY: same identity, proportions, outfit,
colors, palette, crisp pixel outline and soft flat shading, same scale. Limited
retro palette, no gradients/HDR, no anti-aliased blur, no motion blur, no text,
no UI, no drop shadow on the ground. Put every frame at the SAME scale with the
subject on one common baseline, evenly spaced, on a solid chroma-green (#00B140)
background for keying. Output one clean horizontal strip, high resolution.
```

Then add the per-asset frame list. Author large, then size to the **4× runtime cell**
(see the resolution note above — characters are native 96×128 with **no downscale**;
other categories take only a gentle reduction), nearest-neighbor, and key out the
green (keep a transparent copy).

---

## Re-sheet the strip → engine grid (`npm run resheet`)

You do **not** hand-place frames. Generate the strip above, then run the
re-sheeter: it slices the frames (robust to imagegen's uneven spacing **and** FX
noise like sparkles/energy in the gaps), scales them to the 4× cell on a shared
baseline (so airborne poses stay airborne), and packs them into the exact grid the
engine reads — keeping full RGBA (no palette quantization) and clipping each frame
to its cell.

```
npm run resheet -- --in <strip.png> --type <character|bust|battler|athlete|golfer> --scale 4 --out <sheet.png>
```

- Presets set columns + cell size + frame count per asset type: battler → 4 cols ×
  112×144, character → 4 × 96×128, bust → 4 × 128×128, athlete → 5 × 128×160,
  golfer → 4 × 128×160.
- One-off overrides: `--frames N`, `--cols N`, `--cell WxH`. `--equal` forces an
  even split (skips gap-snap), `--fit both` never clips (may shrink the figure),
  `--align center|bottom`, `--bg #rrggbb|none` when the source has no alpha.
- Tool: `tools/resheet.ts` (+ `tools/imageio.ts`), zero-dependency. Verified on
  Jay's 14-frame battler sheet.

---

## 1. Overworld ambient sprites (the town "breathes")

These are generator-only today (no authored loader yet) — authoring them also
needs a loader added in `spritegen/authored.ts`.

| Sprite | Key | Frames · cols | Cell | What moves |
|---|---|---|---|---|
| Biscuit the dog | `dog` | 4 · 4 | ~20×16 | trot East (0,1) + trot West (2,3) |
| Glint (firefly spirit) | `glint` | 2 · 2 | ~12×12 | flit/twinkle |
| Mourning angel | `angel`, `angel_<hero>` ×5 | 2 · 2 | ~24×28 | wing flap / float |
| Picnic songbird | `songbird` | 2 · 2 | ~12×10 | hop / wing flick |
| Pack llama (Ch2) | `llama` | 4 · 4 | ~24×28 | walk cycle |
| Run dust | `dust` | 2 · 2 | ~12×10 | puff dissipating |
| Sparkle / ember | `spark` | 2 · 2 | ~10×10 | twinkle |

**Dog (`dog`) — 4 frames, downscale to ~20×16:**
```
[preamble] A small friendly dog (Biscuit), side view, trotting. Strip of 4 frames:
1) trot-East pose A — facing right, near legs gathered, tail up.
2) trot-East pose B — facing right, legs extended mid-stride, ears bounce.
3) trot-West pose A — facing left, near legs gathered (mirror of frame 1).
4) trot-West pose B — facing left, legs extended (mirror of frame 2).
```

**Glint (`glint`) — 2 frames, ~12×12:** a tiny luminous fairy/firefly spirit.
```
[preamble] A tiny glowing spark-spirit ("Glint"). Strip of 2 frames: 1) compact,
softer glow; 2) spread/twinkling, brighter glow with a few sparkle pixels. Loops
as a gentle flit.
```

**Mourning angel (`angel` + per-hero) — 2 frames, ~24×28:** the floating winged
spirit shown when a hero is downed. Generic + one per hero (rex, faye, milo,
dorin, pippa — give each the hero's hair/face from their reference).
```
[preamble] A small chibi winged angel version of this character, hands together,
serene, hovering. Strip of 2 frames: 1) wings up, body risen 1px; 2) wings down,
body settled. Soft halo. Loops as a slow float.
```

**Songbird (`songbird`) — 2 frames, ~12×10:**
```
[preamble] A small cheerful songbird perched. Strip of 2 frames: 1) settled,
wings folded; 2) mid-hop, wings flicked open, tail up.
```

**Llama (`llama`) — 4 frames, ~24×28:** Ch2 Andean pack llama, side view.
```
[preamble] A friendly pack llama with a colorful blanket, side view facing right,
walking. Strip of 4 frames: a 4-step walk cycle (legs alternating, head bobs
gently). Loops smoothly.
```

**Dust (`dust`) — 2 frames** and **Spark (`spark`) — 2 frames:** tiny FX puffs.
```
[preamble] FX only, no character. Strip of 2 frames: a small dust puff — 1) tight
low puff; 2) wider, fainter, dissipating. (For spark: a 4-point sparkle — 1) small;
2) larger with a bright center.)
```

---

## 2. Battle busts — `bust_<hero>` (18 frames · 4 cols · 32×32)

The party-card head-and-shoulders portrait that emotes through the fight. One per
hero (rex, faye, milo, dorin, pippa), at 3 wear tiers (full / scuffed <66% HP /
battered <33%). Heroes already have authored bust loaders; this is for new/replacement art.

**Frame order (exact):**
`0 idleA · 1 idleB · 2 lunge · 3 castA · 4 castB · 5 pray · 6 gadget · 7 rummage · 8 munch · 9 guard · 10 hurt · 11 nervousA · 12 nervousB · 13 down · 14 cheerA · 15 cheerB · 16 windedA · 17 windedB`

```
[preamble] Head-and-shoulders battle portrait (bust) of this hero, facing the
viewer, expressive. 18 frames, downscale to 32×32 each:
1 idleA / 2 idleB — calm breathing (chest/head rise 1px between the two).
3 lunge — leaning in, attacking shout.
4 castA / 5 castB — arms rising, a glow building between the hands (psychic cast).
6 pray — hands together at chest, eyes closed, hopeful.
7 gadget — fiddling with a small device, focused.
8 rummage — digging in a bag for an item.
9 munch — eating/drinking, cheeks full.
10 guard — bracing, arms up to defend.
11 hurt — flinch, wincing from a hit.
12 nervousA / 13 nervousB — low-HP worry, sweat bead, glancing (two-frame fidget).
14 down — defeated slump, eyes shut.
15 cheerA / 16 cheerB — victory, fist up / big grin (two-frame celebration).
17 windedA / 18 windedB — exhausted, shoulders heaving (two-frame heavy breath).
```
Make 3 versions (wear tiers): tier 1 adds mussed hair + sweat; tier 2 adds a cheek
bruise + torn collar.

---

## 3. Battle battlers — `battler_<hero>` (14 frames · 4 cols · 28×36)

The full-body **rear-3/4** stage figure (seen from behind-left, looking up at the
enemy — the Mother framing). Per hero, per equipped weapon look, per wear tier.

**Frame order (exact):**
`0 idleA · 1 idleB · 2 stepA · 3 stepB · 4 backswing · 5 swing · 6 aim · 7 recoil · 8 castA · 9 castB · 10 pray · 11 throwA · 12 throwB · 13 winded`

```
[preamble] Full-body battle figure of this hero seen from BEHIND and slightly to
the left (rear 3/4), standing on a stage looking up/forward at an unseen enemy.
14 frames, downscale to 28×36 each:
1 idleA / 2 idleB — ready stance, subtle breathing bob.
3 stepA / 4 stepB — a small step-in shuffle (two frames).
5 backswing — winding up the weapon behind.
6 swing — the weapon strike forward (follow-through).
7 aim — steadying/aiming a ranged action.
8 recoil — the kickback after firing/striking.
9 castA / 10 castB — arms raised, psychic glow gathering overhead.
11 pray — hands together, hopeful, head bowed.
12 throwA / 13 throwB — wind-up then release of a thrown item (two frames).
14 winded — hunched, exhausted, hands on knees.
```
Compose the equipped weapon into the swing/aim frames; redraw torso gear per look;
make the 3 wear tiers as in §2.

---

## 4. Hoops athletes — `athlete_*` (39 frames · 5 cols · 32×40)

Half-court 3-on-3 basketball. **Facing RIGHT only** (no left — the engine flips).
Heroes + walk-ons play as themselves; opponents are hashed faces in team jerseys.

**Frame order (exact):**
`0 idleA · 1 idleB · 2 runA · 3 runB · 4 offA · 5 offB · 6 slideA · 7 slideB · 8 gather · 9 rise · 10 release · 11 layupA · 12 layupB · 13 dunkAa · 14 dunkAb · 15 dunkBa · 16 dunkBb · 17 dunkCa · 18 dunkCb · 19 blockA · 20 blockB · 21 steal · 22 fall · 23 cheerA · 24 cheerB · 25 spinA · 26 spinB · 27 btbA · 28 btbB · 29 btlA · 30 btlB · 31 stunA · 32 stunB · 33 trip · 34 passChest · 35 passBounce · 36 passBtb · 37 follow · 38 land`

Because 39 consistent frames is a lot for one generation, do it as **action
strips** and assemble in the order above. Suggested groups:
```
[preamble] Basketball player (this character) in a 16-bit sports sheet, facing
RIGHT, 32×40 each. Generate these action strips (same player, identical look):
• Dribble: idle ×2 (ball at hip) · dribble-run ×2 · off-ball run ×2 · defensive slide ×2
• Shot: gather (load) · rise (jump, ball overhead) · release (follow-through, wrist snapped)
• Layup ×2 (drive + finish at rim)
• Dunks ×3 styles, 2 frames each (approach/cock-back → throw-down: one-hand power, two-hand, reverse)
• Block ×2 (leap up, swat) · steal (swipe low) · fall (knocked to floor) · cheer ×2 (celebrate)
• Handles: spin move ×2 · behind-the-back ×2 · between-the-legs ×2
• stun wobble ×2 · trip stumble · pass: chest · bounce · behind-the-back · shot follow-through · landing recovery
```

---

## 5. Golf, golf FX, hoop net

**Golfer — `golfer_<hero>` (11 frames · 4 cols · 32×40), facing RIGHT.**
Order: `0 address · 1 backA · 2 backB · 3 strike · 4 followA · 5 followB · 6 fistpump · 7 slumpA · 8 slumpB · 9 puttAddress · 10 puttStrike`
```
[preamble] Golfer (this character) facing RIGHT with a club, 32×40 each. 11 frames:
address (set up over ball) · backswing ×2 (club rising to top) · strike (impact) ·
follow-through ×2 (club around the shoulder) · fist-pump (celebrate) · sad slump ×2
(missed, shoulders drop) · putt address (crouched, putter) · putt strike (tap).
```

**Golf FX:** `links_splash` (2 frames, water plop) and `links_sand` (2 frames,
sand spray) — small 2-frame bursts, FX only, no character.

**Hoop net — `hoop_side` (3 frames · 3 cols):** a side-on basketball rim + net.
```
[preamble] A basketball hoop rim and net, side view, FX only. 3 frames: 1) net at
rest; 2) net bulging down (ball passing through); 3) net swinging back up.
```

---

## 6. Emotes (5 tiny glyphs)

Over-the-head feeling pops; the motion (pop + float) is code, so you only author
the **glyph icon** (~12×12, transparent). They reuse the flair vocabulary:
`surprise = ❗`, `idle = ♪ (note)`, `sleep = 💤 (zzz)`, `think = … (ellipsis)`, `happy = ♥`.
```
[preamble] A set of 5 tiny pixel "emote" icons on transparent background, ~12×12
each, bold and readable at small size, matching the game's flair style: an
exclamation mark, a music note, a "Zzz" sleep mark, an ellipsis "…", a heart.
```

---

## 7. Cutscenes (≈78 still illustrations, ch1–ch10)

Cutscenes are **single full-scene illustrations** shown with text and fades
(`OverworldScene` await-chains) — they are NOT frame animations, so one image per
beat. They live in `assets/art/cutscenes/<chapter>/<name>_01.png`.

**Cutscene illustration template:**
```
16-bit SNES / EarthBound / Mother 3-style scene illustration, painted in the
game's limited retro palette with crisp pixel detail (no HDR/photoreal). Wide
landscape composition (16:9). Subject: <BEAT DESCRIPTION>. Mood/lighting: <MOOD>.
Keep characters on-model to their references (attach hero refs when they appear).
No text, no UI, no letterboxing. High resolution; I will downscale.
```

Fill `<BEAT DESCRIPTION>` from the list below (filenames are self-describing):

- **Ch1 (Otterbrook):** meteor at 2AM · otterbrook at night · first heartlight · Glint's prophecy · hickory hill · bug zapper · Mom's payphone call · Titanic Tick reveal
- **Ch2 (Puerto Sol / Valle Dorado):** banana boat to Puerto Sol · Puerto Sol arrival · llama jungle paths · Valle Dorado wishers · rotating step pyramid · pyramid apex heartlight · Gilded Grin reveal
- **Ch3 (Wintermoor):** Lucille (biplane) to Wintermoor · Milo's greenhouse crash · porter first borrow · old stones resonance · wintermoor machine fog · headmaster mainframe · heartlight 3 (machine fog lifts)
- **Ch4 (Norway):** Lucille north-sea hop · Kvisthavn under cliffs · sleeper spine crossing · bootstep moor growth · whisperwig reveal · Lilleby giants kneel · heartlight 4 (deep hum)
- **Ch5 (Minimus):** Grand Duchy travel-in · Minimus Major tabletop capital · big little lens build · Pippa's matchbox briefing · Pippa joins party · Whiskerzilla knighted · heartlight 5 (bell choir)
- **Ch6 (Zanzibel/Africa):** caravan to Zanzibel · savanna caravan at dusk · Zanzibel market · courier teaches teleport (alpha) · laughing ruins · laughing sphinx riddle · sphinx chin resonance
- **Ch7 (Chandrapore/India):** night train to Chandrapore · Chandrapore bazaars · locket train heist · royal vivarium palace · cobra raja reveal · palace throne resonance · cinema about the party
- **Ch8 (Lotus Harbor/China):** riverboat to Lotus Harbor · Lotus Harbor arrival · spore forest scramble · yak express to Mt Shu · paper guardians (false folds) · paper dragon reveal · temple bell resonance
- **Ch9 (Valea/Romania):** Orient-Less Express to Valea · Valea Stelelor arrival · Buni feast basket · castle Hoaxula · Count Hoaxula unmasked · monastery bell-tower resonance · trial of the mute mountain
- **Ch10 (Endgame/Mars):** sea of silence arrival · tiki magma golem · Mauna Lani parts run · snowcat run to Aurora Station · frost sentinel · Aurora Station decodes Mars · the calling (worldwide phones) · phone dad / phone mom · the Long Shot launch · hush undone · homesong (full) · Mia prays · player name confirm · extended credits

> Some beats imply motion (the Long Shot launch, the rotating pyramid). If you
> want those to actually animate later, author them as a short frame strip instead
> of a still and we add a small player — flag the ones you want animated.

---

## What does NOT need new frames

- **Enemies (battle):** each is a still + 2 wear tiers; their battle motion (bob,
  shake, lunge) is code tween, not frames. Author the 3 stills (per ART_PIPELINE),
  no animation sheet needed.
- **Arcade sprites** (`arc_ship/moth/rock/saucer/corndog/bolt`): single sprites
  moved by code. Optional polish: 2-frame wing/thruster flicker if you want them lively.
- **Tween-driven motion** (title logo float, screen fades, water reflection,
  camera): no art frames — pure code.

---

## Pipeline notes

1. **Consistency first.** Generate one asset/action at a time, always attach the
   subject's locked reference (8-angle sheet, bust, etc.); regenerate until the
   identity matches before moving on.
2. **Order is law.** Assemble frames in the exact order/columns listed; a wrong
   slot = wrong pose in game.
3. **Re-sheet, don't hand-place.** After generating, run `npm run resheet` (see the
   "Re-sheet the strip → engine grid" section) to slice → size → pack into the engine
   grid; it keeps feet on a common baseline so frames don't jitter. Keep `-source`
   (green) + `-transparent` masters.
4. **Wire-up:** busts/battlers/athletes/golfers already have hero loaders in
   `authored.ts`; the §1 ambient sprites, golf FX, and hoop net are generator-only
   and need a loader added there when authored.

See [ART_PIPELINE.md](ART_PIPELINE.md) and [CLAUDE.md](../CLAUDE.md).
