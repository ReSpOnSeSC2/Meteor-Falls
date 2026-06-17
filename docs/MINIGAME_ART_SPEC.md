# Minigame art spec — Golf (Links) & Basketball (The Cage)

Goal: replace the mismatched / low-res court & course art so both minigames use the
**realistic painted-pixel style** AND line up with the engine (no double flags, no
double baskets, no tiny-in-the-corner backdrops).

## The one rule that prevents every bug we hit

**Backdrops contain the ENVIRONMENT only — never the gameplay objects.**
The engine draws the flag, the hoops, the ball, and the characters itself, at fixed
data positions. When the art *also* paints a flag/hoop, you get two of them in
different spots (exactly the "2 flags" / "2 baskets" you saw).

So every backdrop below is: terrain + lines + scenery, and **NO** flag, **NO** hoop,
**NO** ball, **NO** players. Those are separate sprites (and the character/ball
sprites we already have are good — keep them).

Everything renders at **4× native** (the game runs at 1600×900). Sizes below are the
final runtime pixel sizes to generate at.

---

## BASKETBALL — The Cage

The engine is a **side-on, horizontally-scrolling** court: you see the floor from the
sideline, the camera pans left↔right following the ball, and the two baskets sit at
the far-left and far-right ends. (The current `court_full.png` is a "looking-down-the-
court" perspective with its own painted hoops — that's why it produced a second,
misaligned basket. The replacement must be the side-on layout below.)

Court coordinate facts the art must respect (so the painted lines match where the ball
and players actually are):
- Full court image: **2960 × 1744 px**. There is a 136px margin baked around the play
  area on every side (the camera shows a 1600×900 window of this and pans).
- **Left rim center ≈ x 320, Right rim center ≈ x 2640, both at y ≈ 872** (vertical
  middle). The two backboards/poles sit there.
- Center line at x ≈ 1480. Three-point arc radius ≈ 552px around each rim. The painted
  key (lane) is ≈ 368 wide × 464 deep out from each baseline.

### Asset 1 — `court_full.png`  (side-on court floor, 2960×1744)
Replaces the current court. **No hoops, no players, no ball.**

> **AI prompt:** "A wide side-on panorama of a worn outdoor city basketball court,
> 16-bit SNES JRPG painted-pixel style, rich and realistic but pixel-art. Asphalt
> playing surface seen from the sideline with hand-painted faded white lines: a center
> line, two free-throw keys, two three-point arcs. Tall chain-link fence running the
> length behind the court, with leafy trees and a hazy city skyline beyond it; warm
> late-afternoon light, subtle cracks and tar patches in the asphalt. The court fills
> the lower ~70% of the frame, fence+background the upper ~30%. IMPORTANT: do NOT draw
> any hoops, backboards, players, or basketballs — only the floor, the lines, the
> fence and the background scenery. Seamless flat lighting, no vignette. 2960×1744."

Alignment note for me: I'll place the engine's hoop sprites at x≈320 / x≈2640. The
painted arcs/keys should sit under those rims — if the generated lines drift, I nudge
the rim sprites to match the art.

### Asset 2 — `court_behind.png`  (behind-the-basket view, 1600×900)
Shown for the brief "shooting toward the hoop" camera. **No hoop, no players.**

> **AI prompt:** "A first-person-ish view from behind one baseline of an outdoor city
> basketball court, 16-bit painted-pixel JRPG style. The asphalt court recedes away
> from the viewer toward a far chain-link fence with trees and a dusk skyline; faded
> painted key and free-throw circle in the foreground. Warm evening light. IMPORTANT:
> no hoop/backboard, no players, no ball — just the court surface receding and the
> background. 1600×900."

### Asset 3 — `hoop_side_sheet.png`  (realistic hoop, 3 frames)
Replaces the old hoop sprite. A **side-on** hoop: gray pole, white fan backboard,
orange rim, white net. **3 frames in a horizontal strip**, each **180 × 270 px**
(sheet = **540 × 270**): frame 1 = net at rest, frame 2 = net bulging (ball passing
through), frame 3 = net snapping back / swish.

> **AI prompt:** "A side-on streetball hoop sprite sheet, 16-bit painted-pixel JRPG
> style, on a transparent background. Galvanized-steel gooseneck pole, white fan-shaped
> backboard with an orange square, orange rim seen from the side, white chain/cord net.
> THREE frames left-to-right, identical pole/board/rim, only the NET differs: (1) net
> hanging at rest, (2) net bulging downward as a ball passes through, (3) net swishing
> back up. Each frame 180×270, sheet 540×270, transparent background, crisp pixel
> edges, consistent lighting from upper-left."

*(Keep the existing `athlete_*_runtime.png` players and `ball.png` — they look great.)*

---

## GOLF — Costa Estrella Links

The engine is a **¾-overhead** view of one hole. The current art is good-looking but
(a) too small (≈244×196, so it scaled up soft and sat in the corner) and (b) has a
**painted flag that doesn't match the hole's real pin**, giving two flags. Fix: bigger,
and **no painted flag** (the engine draws the flag at the true pin).

### Assets — `links_h1.png` … `links_h18.png`  (18 hole backdrops, ¾ overhead)
Each is one hole's terrain. **No flag, no pin, no ball, no golfer.**

- Generate at **1280 × 720 px** (fills the play area crisply; the swing panel + HUD
  overlay the corners). Keep the lovely island/water framing.
- Paint the playable terrain clearly readable: **tee box** at the near/bottom, **fairway**
  leading up, **putting green** (a distinct smoother green oval) at the target end,
  plus **sand bunkers** and **water/rough** as hazards. The greener/smoother areas read
  as "fairway & green," darker/rougher as "rough," tan as "sand," blue as "water."

> **AI prompt (per hole — vary the layout each time):** "A ¾-overhead view of a single
> golf hole on a tropical island green, 16-bit painted-pixel JRPG style, realistic but
> pixel-art. Mowing-stripe fairway leading from a tee box up to a smooth putting green,
> a few tan sand bunkers, edged by rocky coastline and turquoise ocean with white surf;
> palm trees and tropical scenery around the rim; warm sunny light. The hole fills most
> of the frame with water/scenery around the edges. IMPORTANT: do NOT draw a flag, pin,
> hole-cup, ball, or golfer — only the terrain (tee, fairway, green, bunkers, water,
> rough) and scenery. Flat even lighting, crisp pixel edges. 1280×720." *(Change the
> hole shape/length/hazard placement for each of the 18 — e.g. dogleg-left par 4,
> short island par 3, long par 5 with a central bunker, etc.)*

Alignment note for me: with the painted flag gone, the engine's single flag sits at
the data pin. After the art exists I'll set each hole's tee/pin (and the coarse
terrain grid the physics reads) to match where the art put the green/hazards, so a
ball "in the water" visually is in the water mechanically.

*(Keep the existing `golfer_*_runtime.png`, `ball.png`, `flag.png` — all good.)*

### Two golf layout questions for you (design, not assets)
1. **"Character in a box":** that framed close-up bottom-left is the swing panel (power
   meter + the golfer's swing animation), a la Mario Golf. Keep it, or drop the frame
   and show the golfer larger on the course with the meter as a slim bar? Your call.
2. The course at 1280×720 will fill the screen behind the HUD — confirm that's the
   "much bigger" you want, or go full 1600×900.

---

## What I'll do once the art lands
- **Basketball:** re-wire `court_full`/`court_behind` (sized 2960×1744 / 1600×900 they
  drop in with no scaling), swap in the new `hoop_side` sheet, and position the hoop
  sprites at the rim coords so there's exactly one aligned basket per end.
- **Golf:** point `links_hN` at the new 1280×720 art (drop the temporary ×4 upscale,
  since the art is already hi-res), keep the engine flag as the only flag, and tune
  each hole's pin/terrain to the art.
- Verify both in-engine (one flag, two correctly-placed baskets, courses filling the
  screen) and run the suite.
