# Blender Animation Pipeline

Blender is available as an offline authoring bridge for character animation frames.

## Reuse Rule

All authored characters share the same runtime contract:

- Frame size: `96x128`
- Sheet layout: `4` columns, `46` used frames
- Same frame meanings for walk, run, diagonal walk/run, idle

That means the motion can be shared. It does **not** mean finished pixels should be copied between characters. A shared Blender action or pose template can drive every rig, but each character must render its own pixels so identity, clothing, hair, and body proportions stay correct.

## Commands

Check Blender:

```bash
npm run blender:check
```

Render one frame from a character rig:

```bash
npm run blender:frame -- --char chad --frame 16
```

Render a named motion as separate one-frame PNGs and write an import manifest:

```bash
npm run blender:motion -- --char chad --motion run-down
```

Apply those rendered frames after they pass the frame gate:

```bash
npm run blender:motion -- --char chad --motion run-down --apply
```

Default rig path:

```text
assets/art/masters/characters/rigs/<id>.blend
```

Default output path:

```text
assets/art/review/blender/<id>_frame_<N>.png
```

## Rig Contract

Each rig blend file should:

- Use timeline frames `0-45` to match the Meteor Falls character frame contract.
- Include an active camera, preferably named `MF_Camera`.
- Render one centered character over transparent film.
- Keep the character inside a `96x128` output with a stable foot baseline.
- Use shared Blender actions for motion where possible, with per-character rig controls for body shape.

## Correction Flow

1. Render a single frame:

   ```bash
   npm run blender:frame -- --char chad --frame 16
   ```

   Or render a named motion as individual frame files:

   ```bash
   npm run blender:motion -- --char chad --motion run-down
   ```

2. Check the rendered PNG:

   ```bash
   npm run anim:frame:check -- --image assets/art/review/blender/chad_frame_16.png
   ```

3. Import only that one frame:

   ```bash
   npm run anim:fix -- --char chad --image assets/art/review/blender/chad_frame_16.png --op importImage:16 --apply
   ```

4. Re-run the audit:

   ```bash
   npm run anim:audit
   ```

## Chad Status

Chad currently needs newly rendered movement frames for bad side-facing run/down and run/up cells. Do not reuse or repair those failed side-facing frames. Either generate new single-frame art or render new single-frame art from a Chad Blender rig.
