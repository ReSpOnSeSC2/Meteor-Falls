# Graphics Asset Rollout

This is the implementation track for the authored-art reboot.

## Current First Slice

The five leads now have first-pass authored art wired through the runtime bridge:

- Jay / internal `rex`
- Mia / internal `faye`
- Milo / internal `milo`
- Pippa / internal `pippa`
- Dorin / internal `dorin`

Each lead has:

- source 8-angle draft: `assets/art/drafts/<name>-8angle-transparent.png`
- engine overworld source: `assets/art/characters/<name>_8dir_24x32.png`
- source battle bust draft: `assets/art/drafts/<name>-battle-bust-transparent.png`
- engine battle-card bust sheet: `assets/art/busts/<name>_bust_18_32x32.png`
- source battle stage draft: `assets/art/drafts/<name>-stage-transparent.png`
- engine battle stage sheet: `assets/art/battlers/<name>_battler_14_28x36.png`
- boot bridge: `src/spritegen/authored.ts`

The bridge replaces each lead's runtime texture after the normal generated
textures are registered. Generated art remains the fallback for everyone else.

## Important Engine Contracts

### Overworld Characters

Runtime texture key: hero id, for Jay this is `rex`.

Frame size: `24x32`.

Frame count: `46`.

Current authored source: 8 static facings. The bridge expands those into the
existing 46-frame contract so all existing animation keys keep working.

Full production target:

- 4 cardinal walk loops
- 4 cardinal run loops
- 4 diagonal walk loops
- 4 diagonal run loops
- idle breathe
- idle blink

### Battle Card Busts

Runtime texture keys:

- `bust_<hero>_<body>_w0`
- `bust_<hero>_<body>_w1`
- `bust_<hero>_<body>_w2`

Frame size: `32x32`.

Frame count: `18`, 4 columns.

These are the in-battle card characters sitting above each HP/PP box.

Frame order:

1. idleA
2. idleB
3. lunge
4. castA
5. castB
6. pray
7. gadget
8. rummage
9. munch
10. guard
11. hurt
12. nervousA
13. nervousB
14. down
15. cheerA
16. cheerB
17. windedA
18. windedB

The first Jay sheet currently reuses the new bust art with tiny pose offsets.
Full production should author each frame.

### Battle Stage Battlers

Runtime texture keys:

- `battler_<hero>_<weapon>_<body>_w0`
- `battler_<hero>_<weapon>_<body>_w1`
- `battler_<hero>_<weapon>_<body>_w2`

Frame size: `28x36`.

Frame count: `14`.

These are separate from the card busts. They are the small rear/three-quarter
figures that step onto the stage to swing, cast, pray, throw, or aim.

### Enemies and Bosses

Enemies are currently generated battle sprites with wear variants. The authored
pipeline should replace these per enemy family first, then per boss.

Bosses should be bespoke art, not enlarged enemy variants.

### Tiles and Props

Tiles remain `16x16`. The upgrade should come from hand-authored tiles,
landmark props, and better map composition, not larger tiles.

## Rollout Order

1. Lead bridge: complete first draft.
2. Lead full production: author real walk/run/idle frames, full bust poses, and
   polish the stage battler pose sheets.
3. Otterbrook outdoor tileset and house/interior props.
4. Chapter 1 enemies and Titanic Tick boss.
5. Battle UI skin.
6. Expand chapter by chapter.
