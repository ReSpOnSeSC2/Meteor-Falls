# Meteor Falls Art Direction Reboot

> ⚠️ **HISTORICAL.** Superseded by **ADR-109** — art is now authored as PNGs
> (ChatGPT/imagegen → PNG at the `assets/art/masters` resolution); see
> [ART_PIPELINE.md](ART_PIPELINE.md). This reboot doc is kept for context.

## Why the Previous Overhaul Failed

The rejected overhaul treated "SNES/Mother 3 quality" as a technical problem:
bigger canvases, more procedural lighting, and more generated detail. That can
make the art busier without making it better.

For this game, the target is not "high resolution." The target is authored
pixel art with strong taste:

- readable silhouettes at small size
- charming facial/body proportions
- hand-placed pixel clusters
- restrained palette ramps
- expressive animation
- cohesive tilesets that compose into places
- UI and battle presentation that feel designed, not generated

The better option is a hybrid production pipeline:

1. Use real indexed sprite sheets and tilesets as the primary art.
2. Keep procedural generation for placeholders, variants, recolors, contact
   sheets, and low-risk utility art.
3. Enforce palette, scale, and file contracts with tools.

This is a shift from "generate the art" to "produce the art."

## Style Target

Use "warm 16-bit / GBA JRPG Americana" as the house style. EarthBound is the
closest layout and tone reference; Mother 3 is the closest animation, character,
and color-polish reference. Do not copy their assets, poses, or exact designs.
Study the principles and make Meteor Falls its own thing.

The style should feel:

- bright but not neon
- cleanly outlined, but not always black-outlined
- simple at first glance, rich on second look
- funny, warm, and slightly strange
- handcrafted, not filtered

Avoid:

- automatic pillow shading
- noisy multi-shade gradients on tiny sprites
- huge HD sprites that no longer fit the world
- over-smooth RGBA art
- procedural ellipses used as finished character anatomy
- one generator trying to solve every character

## Resolution Choice

Do not blindly double every native asset.

Mother 3-style fidelity comes from better pixel placement and animation, not
necessarily from larger sprites. A full `ART_SCALE = 2` world risks making the
game feel like enlarged toy art and creates huge map/collision/UI churn.

Recommended native targets:

| Domain | Target |
|---|---|
| World tiles | 16x16 tiles, hand-authored |
| Overworld characters | 24x32 or 24x40, depending on final proportions |
| Important NPC variants | same frame contract as player sprites |
| Battle enemy sprites | 48x48 to 96x96, hand-authored per enemy family |
| Boss sprites | 96x96 to 160x120, staged individually |
| Busts / portraits | 64x64 or 80x80 |
| Icons | 16x16 and 24x24 |
| UI panels | 9-slice indexed art |

Only increase resolution where the game actually benefits: portraits, boss
sprites, title art, battle backgrounds, and special cutscene illustrations.

## Production Pipeline

### 1. Create an Asset Contract

Add an `assets/art/` tree:

```text
assets/art/
  palette/
    meteor-falls.gpl
  characters/
    jay.png
    mia.png
    milo.png
  tilesets/
    otterbrook.png
    brickton.png
  enemies/
    ch1_titanic_tick.png
  portraits/
    jay.png
  ui/
    window_skin.png
```

Each PNG must be indexed or palette-conformant. Tools should reject:

- off-palette colors
- wrong dimensions
- wrong frame counts
- transparent pixels where a required anchor marker is missing

### 2. Keep the Current Generators as Placeholder Fallbacks

The current procedural art is still useful for:

- quickly creating NPC temp sprites
- previewing palette swaps
- generating contact sheets
- filling unimportant background variations
- regression tests while final art is not ready

But final hero, enemy, boss, tileset, portrait, and UI art should be real
authored assets.

### 3. Build a Sprite-Sheet Loader

Add a small loader that can consume either:

- authored PNG sheets from `assets/art`
- generated fallback sheets from `src/spritegen`

The game should not care which source produced the frames. This lets each domain
migrate independently.

### 4. Paint One Vertical Slice First

Do not overhaul the whole game at once. Produce one beautiful slice:

- Jay overworld sheet
- Mia overworld sheet
- one Otterbrook outdoor tileset
- one interior tileset
- one enemy family
- one boss sprite
- battle window skin
- menu window skin
- title screen key art

Then put those assets in-game and judge the game as a moving screen, not as
isolated PNGs.

### 5. Use Contact Sheets for Taste Review

Keep and expand the `.shots/` review workflow:

- cast angles
- walk animations
- town screenshots
- battle screenshots
- UI screenshots
- before/after panels

The review question is always: "Does this feel like Meteor Falls?"

## Character Art Direction

Characters should be smaller and more authored, not merely larger.

Principles:

- one or two iconic silhouette traits per character
- strong head shape and hair mass
- simple torso read
- clear shoes/hands only where needed
- eyes that read from gameplay zoom
- fewer automatic shade bands
- more deliberate 1-3 pixel clusters

For the five leads:

- Jay: round cap/brim, compact stance, warm everyday kid energy
- Mia: softer silhouette, prayer/faith visual motifs kept subtle
- Milo: schoolboy/gadget read, sharper posture
- Pippa: tiny diplomat read through silhouette and accessories, not noisy detail
- Dorin: calm martial posture, clean robe/monastery shapes

Animation matters more than still-frame detail:

- idle blink
- walk bounce
- hair/hat secondary motion
- expressive turn frames where possible
- battle hurt/ready/cast poses

## Tileset Art Direction

Tiles are where the game will stop feeling NES fastest.

Priorities:

- roads with soft broken edges
- grass clusters that form organic patches
- tree canopies with hand-authored clusters
- readable house fronts
- warm window/counter details
- region-specific ground texture
- signs, fences, mailboxes, benches, cars, phone booths

Do not make every tile equally detailed. Mother-style maps breathe because
simple floor/grass tiles support richer landmarks.

## Battle Art Direction

Battle sprites can carry more detail than overworld sprites.

Use:

- larger, hand-authored enemy silhouettes
- limited but expressive animations
- colored shadow under enemies
- weird props and faces
- battle background motion kept abstract and palette-controlled

Bosses should be bespoke compositions, not scaled-up enemy generators.

## Recommended Implementation Phases

### Phase A: Art Contract and Loader

- Add `assets/art` structure.
- Add an art manifest.
- Add a PNG palette/dimension checker.
- Add a loader that chooses authored PNG first, procedural fallback second.
- Keep the game visually unchanged until authored assets exist.

### Phase B: Hero Vertical Slice

- Paint or import final authored sheets for Jay and Mia.
- Wire them into the loader.
- Add contact-sheet comparison.
- Verify overworld movement, collision, facing, and follower offsets.

### Phase C: Otterbrook Slice

- Replace the outdoor and first interior tilesets.
- Verify town screenshots in-game.
- Tune camera zoom only after seeing the new art in motion.

### Phase D: Battle Slice

- Replace one enemy family and one boss.
- Replace battle window/UI skin.
- Add hit/hurt/cast frames where valuable.

### Phase E: Expand by Chapter

For each chapter:

- one tileset family
- NPC sheets
- enemy sheets
- boss sprite
- local UI/prop additions

This keeps art production connected to playable content instead of becoming an
abstract global rewrite.

## What to Stop Doing

- Stop trying to get final hero art from `litEllipse` and `litRect`.
- Stop treating `ART_SCALE = 2` as the definition of quality.
- Stop requiring zero binary art assets if the goal is true Mother 3-level feel.
- Stop polishing generators before proving one authored in-game slice.

## What to Keep

- The master palette discipline.
- Deterministic generators for fallback and variants.
- Contact-sheet review.
- Palette conformance tests.
- Runtime frame contracts.
- The game's warm, oddball identity.

## Definition of Done

The art reboot is working when:

- one town screen looks charming before any dialogue appears
- the player character reads instantly at phone size
- walking animation has personality
- battle enemies look bespoke
- UI frames feel like part of the world
- generated placeholder art is no longer the visual ceiling

