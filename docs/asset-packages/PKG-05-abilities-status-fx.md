# PKG-05 — Abilities, status effects & battle FX

All the small combat iconography.

## A. Ability icons — 92
One icon per ability id. Size ≈ 16×16. Path `assets/art/icons/abilities/<id>.png`.
Full id list: [`../asset-lists/ability_icons.txt`](../asset-lists/ability_icons.txt).
Source of truth: `src/data/abilities.ts`. Used in the battle command menu and
PSI/skill lists.

## B. Status-effect icons — 12
Tiny (≈8×8) overlay badges drawn on busts/battlers. Path
`assets/art/icons/status/<name>.png`:
`asleep, burn, crying, exposed, frozen, gilded, hushed, marked, paralyzed,
puppet, rattled, shield` (`src/scenes/BattleScene.ts`).

## C. Battle FX / flair glyphs — ~40
The bursts/sparks on a hit: element × result spritelets. Source of truth:
`FLAIR_BY_ELEMENT` and `FLAIR_BY_RESULT` in `src/spritegen/flair.ts` (and
`FX_REGISTRY` in `src/battle/fxRegistry.ts`). Path `assets/art/fx/<key>.png`.

## Acceptance
92 ability icons + 12 status icons + the full flair set present and wired.
