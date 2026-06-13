# PROMPT — S17: THE GREAT CATALOG & THE FLAIR PASS (Movements 16–24)

> Paste this whole file as the next Claude Code session's opening prompt. It continues
> straight from **S16 Movement 8 / ADR-060** (THE ICON ATLAS — every §A8 item got a drawn
> menu icon, gated both directions). It is written in the same law-driven, movement-sequenced
> style as the S15i / S16 prompts. Two big asks, fully designed below: **grow the item catalog
> from 41 to ~500 unique, iconed, world-placed items**, and **add a tasteful EarthBound
> pixel-emoji FLAIR layer** to battle and dialogue. Both become canon.

---

Read `docs/GAME_BIBLE.md` FULLY before doing anything — it is canon; never invent content that
contradicts it, never use placeholder/mock data for anything it defines. Follow
`docs/DECISIONS.md` conventions and APPEND every new architectural decision to it. **Use the
next free ADR id — check `docs/DECISIONS.md` for the highest `## ADR-NNN` and continue from
there** (ADR-060 was the last as of S16 M8; if S16 Movements 9–15 / ADR-061…067 have since
landed, continue past them). TypeScript strict, no `any`. Be CREATIVE and PRODUCTION-QUALITY:
every item must feel hand-made and belong to its exact place; every line is plain-spoken +
kid-readable (EarthBound-flavored, never a riddle); nothing reads like generic RPG filler.
Read GAME_BIBLE §A3/§A4/§A8/§A9/§A11/§B3/§B4 and **ADR-012, ADR-016, ADR-017, ADR-020, ADR-032,
ADR-034, ADR-037, ADR-046/047 (the unlanded discipline), and ADR-060 (THE ICON ATLAS) FIRST.**

Keep the validator + full vitest + tsc + `npm run build` GREEN at EVERY step. The baseline you
inherit (S16 M8): **tsc clean**, `npm run validate` green (`41 items (41 icons)` · 49 maps ·
8 quests · 431 dialogue · pray sums 100), `npx vitest run` **648 passing**, `vite build` clean,
`npm run art:icons` → `.shots/icons_s16.png`.

---

## WHERE YOU ARE (what S16 M8 finished — do NOT redo)

**THE ICON ATLAS shipped (ADR-060).** `ITEM_ICON` (`src/spritegen/icons.ts`) is the universal
menu-icon registry — a bespoke 12–16px drawn icon for EVERY item, across all 11 `ItemKind`s.
It generalised the equippable-only `WEAPON_ART`: held-weapon swings + torso dress still compose
on the battler through `WEAPON_ART`, but each also has a standalone menu OBJECT in `ITEM_ICON`;
the `trinket` charms/arms reuse their `WEAPON_ART` icon (one drawing, two registries); every
non-equippable is fresh art. Icons ride the per-row `icons` channel of `pick()` (ui/pick.ts)
and `Dialogue.ask()` (ui/windows.ts) — wired into the Items bag, KEY ITEMS, the EQUIP page
(slot + candidates), shop buy/sell, and battle Goods. Boot registers each under
`itemIconKey(id)` → `item_<id>` (index.ts). The law is gated BOTH directions in
`tools/content-validate.ts` + the `icons.test.ts` mirror, and `npm run art:icons` renders the
contact sheet.

**This means your safety net is already built:** the moment you add an item with no `ITEM_ICON`
row, the build fails. Every new item below MUST get an icon. That is the whole point of M8.

---

## THE VISION (the user's S17 decree)

> "We only have 41 items. Pump it to ~500 total — be creative and detailed. Different foods and
> many other types, with varying power levels and abilities; all the weapons / armor / wearables
> / equipment we can equip, with many special equippables for each character; interesting goods —
> things that bring people back to life, raise each skill / HP / PP / level, and various others.
> All must have icons, all must be unique, all implemented throughout the 10 levels. And add
> emojis to battle sequences for flair on some attacks, and emojis in some dialogue text for
> flair — thoughtfully, throughout the story and the bible and what we already have."

Two arcs, both EarthBound to the bone:

1. **THE GREAT CATALOG — 41 → ~500 items.** A real shopkeeper's inventory of a world. Tiered
   weapon ladders for all five heroes, deep armor/hat/gear/charm lines, hero-signature sets per
   region, a pantry of regional foods, drinks, cures for every status, multi-tier revival,
   permanent stat/HP/PP **tonics**, a fireworks-stand of battle items, valuables that sell for a
   gag, and the story's key items — each one drawn, named, priced, and placed where it belongs.
   Every item smells like its exact region (§A11.7) and earns its power slot (§A9).

2. **THE FLAIR PASS — a pixel-emoji glyph layer.** NOT Unicode emoji (the bitmap font can't
   render them and they'd shatter the 64-colour palette + the plain-spoken law). Instead:
   hand-drawn, palette-clean **pixel glyphs** — a 🔥 that is real pixel fire, a 💥 SMAAASH burst,
   a ♥ from Mom — inlined into text via a `{g:NAME}` token, expanded by the renderer into a tiny
   sprite. Flair on SOME battle attacks and SOME dialogue, used with EarthBound restraint. The
   Hush NEVER gets a glyph; sincere beats stay clean. Woven into the bible and the 431 existing
   scripts.

---

## CARRY EVERY PRIOR LAW FORWARD (non-negotiable)

- **THE ICON ATLAS LAW (ADR-060).** Every `ITEMS` entry has an `ITEM_ICON` row; no icon row
  names a missing item — both directions, validator + `icons.test.ts`. All ~500 new items get a
  distinct, on-theme, palette-clean icon. The equippable `WEAPON_ART` pins STAY (the battler
  swing + torso dress); `weapons.test.ts` stays green untouched.
- **ADR-020 hand-art, by construction.** Icons + glyphs are drawn through the `Pixmap` DSL
  (no API accepts an RGB colour), flat fills, deliberate marks, no scatter noise, `outline()`
  last, shadows never outlined, only pure light after the contour. The forge.test "uses only
  palette indices" discipline holds. **NO AI smell** (§A11.7): if an item, icon, or line could
  move to another region unchanged, it isn't done.
- **THE MANIFEST PINS WILL FIGHT YOU — widen them on purpose (ADR-017's "extend the manifest,
  never ad-hoc").** The validator currently HARD-PINS narrow Ch.1–2 truths that adding items
  will break. You MUST generalise each as you grow the catalog — never delete the law, widen it:
  - `the Ch.1 'pp' line is star_cola alone` (content-validate, the ADR-016 pin) → becomes a
    per-region **PP_LINE** manifest.
  - `ARMOR_LINE = ['champion_jacket','wool_poncho']` → a per-region **ARMOR_LINE** manifest.
  - the **weapon manifest** (`canon` — every `kind:'weapon'` must be listed with its wielder) →
    extend per region; every new weapon is wielder-tagged (§A8 lines are personal).
  - **STARTING_FIVE** (arms) + **SUNDAY_SET** (wielder-tagged charms) → these forbid hero-tagged
    arms/charms OUTSIDE their set; each new hero-signature SET you add (one per region, below)
    registers its OWN manifest the same way, both directions.
- **THE SCHEMA IS `.strictObject` WITH kind⇄field PAIRINGS.** New mechanics need new optional
  fields + new `superRefine` pairings (the `pp ⇔ ppHeal`, `charm ⇔ luck`, `arms ⇔ one of
  speed/guts` pattern). Add them in Movement 16; never loosen an existing pairing.
- **THE UNLANDED DISCIPLINE (ADR-046/047).** Only Ch.1–2 ship live maps. Items for Ch.3–10 are
  DEFINED + iconed + manifested + priced + (where useful) put in shop/drop DATA now, and PLACED
  IN MAPS only when the chapter lands. A shipped-chapter item is asserted live (in a shop, drop,
  gift box, or quest reward); an unlanded-chapter item is asserted in the catalog + its chapter
  manifest. Never place an item on a map that doesn't exist yet.
- **§A9 ECONOMY + POWER CURVE.** Prices and stats track the §A6 level targets (Ch.1 L8 → Ch.10
  L52–55). A full regional refresh ≈ two chapters of battle income (choices hurt, like 1995).
  Tonics are rare and dear. `tools/balance-sim.ts` must still pass; extend it to sweep the
  curve. Never break the §A9 mandate to hit a number.
- **§A11 TONE, esp. for the FLAIR.** Plain-spoken, kid-readable, one obsession per NPC. **The
  Hush is NEVER funny and NEVER gets a glyph** (its lines stay sparse, lowercase, wrong-feeling).
  Sincerity is never the joke — Buni, Mom's calls, Dorin's trial, the finale stay clean (a single
  warm `{g:heart}`/`{g:star}` is the most they may ever carry, and usually nothing). Glyphs are
  FLAIR — restraint is the rule; if every line has one, you've made AI smell. **No chapter UI**
  (§A11.6).
- **FROZEN CORES + FNV.** Items, icons, glyphs, and text are NOT sample-routed generators
  (`buildCity/Town/Village/Route/Wild/Interior/Travel/Dungeon`), so they need NO FNV re-pin
  (`levelkit.test.ts`). Placing a gift-box prop on a GROWN map is append-only outside the frozen
  core (`world_block.test.ts` stays byte-identical); never bake an item prop into a frozen core.

---

## AMEND THE BIBLE FIRST (the new canon — same commit as the movement that introduces it)

Per Appendix rule 6, a system is canon only once it's in the Bible. Draft text below — refine in
the game's voice, keep §A11 tone.

### §A8 — the catalog grows up (rewrite the count, append the lines)

- **The catalog target moves from "~140 items" to "~500 items."** Amend the §A8 header and the
  §B4 / Prompt-8 cross-check. The breakdown (roughly, the validator counts per category +
  per chapter): **~60 weapons** (a 5–7-tier personal ladder for each of the five heroes + funny
  regional sidegrades), **~70 armor** (the §A8 hat ladder + bodies/robes/vests/coats per region),
  **~45 arms** (gear: wraps, gloves, bracers — incl. the hero-signature sets), **~55 charms**
  (pendants/charms: luck + resists + small riders, incl. hero sets), **~110 foods**, **~30 PP
  drinks**, **~35 cures** (every §A4.8 status, tiered) + **~12 revival** items, **~25 tonics**
  (permanent boosts), **~55 battle items**, **~45 valuables**, **~50 key items**, **~12 picnic
  baskets**. (~604 ceiling; land ~500, every one earning its slot.)
- **NEW mechanics become §A8 canon (and §A4 where they're systems):**
  - **TONICS (permanent boosts).** A new `ItemKind 'tonic'` — a one-shot consumable that
    permanently raises a stat: **Offense / Defense / Speed / Guts / Luck / Vibe / max HP / max
    PP**. EarthBound's pills/capsules made literal and warm: *Sudden Guts Pill* (+Guts), *Growth
    Spurt Milk* (+max HP), *Charged Battery* (+max PP), *Brain-Food Lunch* (+Vibe), *Speed-Demon
    Soda* (+Speed), *Iron Tonic* (+Offense), *Turtle Wax* (+Defense), *Lucky Penny, Heads-Up*
    (+Luck). Rare, dear, non-missable; a few are quest/boss rewards.
  - **MULTI-TIER REVIVAL.** Today `glints_spark` revives via `cures:['down']` + a heal value.
    Make it a LINE: *Glint's Spark* → *Glint's Ember* → *Second Wind* (cheap, weak) →
    *Guardian-Angel Feather* → *Milo's Defibrillator* (a Repaired Gizmo, reusable) →
    *Hallelujah Bell* (prayer-tier, full revive). §A4.7's angels become humans at the front
    desk OR with one of these.
  - **ELEMENTAL RESIST gear (§A8 pendants, made real).** Armor + charms may carry `resists`
    (fire/freeze/volt/holy %), the §A8 "pendants (elemental resists)" line finally mechanical:
    *Aloe Pendant* (fire), *Cool Charm* (freeze), *Rubber Brooch* (volt), *Saint's Medal* (holy).
  - **THE VIBE stat on gear** (§A10 #13 *Riddle Ring +10 Vibe* exists in canon but no item field
    did): add a `vibe` bonus so charms/arms can buff Vibe power.
  - **SECONDARY equip bonuses.** Equipment keeps ONE primary slot stat (the seam: weapon→Offense,
    body→Defense, arms→Speed|Guts, other→Luck) AND may carry an optional small `bonus` map
    (e.g. a late bat that also nudges Guts; a robe that resists fire and adds Vibe). STATUS lists
    them; the equip preview shows the primary delta + a "(also +N X)" note. The seam stays single
    — secondaries are summed on top.
- **Append per-region §A8 LINES** (the creative spine — see the per-chapter briefs in Movements
  18–21). Every region gets: each hero's next weapon rung(s), 1–2 hats/bodies, a hero-signature
  charm or arms SET (5 wielder-tagged pieces, the STARTING-FIVE/SUNDAY-SET pattern), its foods,
  its drink, its local cures, its battle items, its valuables, its key items.

### §A11 — the FLAIR law (append §A11.8)

- **§A11.8 PIXEL GLYPHS (the flair, not emoji).** The game speaks in hand-drawn, palette-clean
  pixel glyphs, inlined in text via `{g:NAME}` and rendered as tiny sprites — a real-pixel 🔥/❄/
  ⚡/💥/♥/♪/☀/💤/💢/💀/✨, never a font character, never an off-palette Unicode emoji. **Flair, with
  restraint:** glyphs punctuate SOME battle attacks (a fire hit, a SMAAASH crit, a KO) and SOME
  playful dialogue (a sunny NPC, Mom's love, a vending machine's smug beep) — never every line.
  **Hard rules (the §A11 spine, made explicit):** the Hush NEVER carries a glyph; sincere beats
  (Buni, Mom, Dorin's trial, the finale) stay clean save at most a single warm `{g:heart}`/
  `{g:star}`; a glyph never carries meaning the words don't (kid-readable without it); caption
  auto-timing counts each glyph as one visual unit so `Math.max(2600, 1000+len·55)` still lands.
  If a line leans on a glyph for its joke, rewrite the line.

### §A4 — the tonic + revival systems (append §A4.12)

- **§A4.12 TONICS & THE SECOND WIND.** Permanent-boost tonics (above) apply on use, persist in
  the save, and are rare by design. The revival LINE scales from a cheap *Second Wind* (revive
  at 1 HP) to the *Hallelujah Bell* (full revive, prayer-tier); Milo can *Repair* certain Broken
  Gizmos into a reusable *Defibrillator* (§A3 Repair, made an item).

---

## DO THESE IN ORDER — MOVEMENTS 16–24

> Each movement ships GREEN (validator + vitest + tsc + build), ends with its own ADR + the
> matching Bible amendment, and re-renders the contact sheet(s). Append ADRs from the next free
> id. Items/icons/glyphs need no FNV re-pin. Re-prove any GROWN map that gains an item-prop with
> the tile+PROP-solid BFS.

### MOVEMENT 16 — THE CATALOG SPINE (schema, mechanics, the widened pins) — do FIRST
The foundation every other movement stands on. **No new items yet — make the catalog ABLE to
hold 500 first.**
- **Extend `ItemDefSchema`** (src/schemas) with optional fields + `superRefine` pairings:
  `vibe?` (equip Vibe bonus), `resists?: {element, pct}[]` (armor/charm), `boost?: {stat, amount}`
  paired with the new `kind:'tonic'`, `bonus?` (the secondary-stat map), and a `region?`/`band`
  tag (`'ch1'…'ch10'` | `'cross'`) so the catalog slices per chapter. Keep every existing pairing.
- **Wire the new stats end-to-end:** `battle/formulas.ts` (the heroOffense/Defense/Speed/Guts/
  Luck/**Vibe** seams sum the slot's primary + any `bonus` + resist application), the STATUS
  screen (new lines: Vibe-from-gear, resists, the secondaries), the equip preview in `pick.ts`
  (`confirmEquip` shows "primary up by N!" + a "(also +N X)" note), `tonic` use in MenuScene
  (permanent apply + a warm line), and the revival line in BattleScene + the hospital flow.
- **Generalise the manifest pins** in `tools/content-validate.ts` into per-region tables:
  `PP_LINE[region]`, `ARMOR_LINE[region]`, the per-region weapon ladder, and a SET registry for
  hero-signature charm/arms sets (each both-directions). Add a **per-chapter quota** check
  (≥ ~40 items carrying each chapter's `band`, plus the cross-region set) and a verdict count
  (`NNN items (NNN icons) across 10 chapters`).
- **DONE-WHEN:** the schema holds tonics/resists/vibe/secondaries; STATUS + equip preview + tonic
  use + revival all read correctly with the EXISTING 41 items (no behaviour regressions); the pins
  are per-region tables that still pass at 41 items. Append the ADR; amend §A8/§A4.12/§B.

### MOVEMENT 17 — THE ICON FORGE AT SCALE (500 distinct faces, no slop) — do SECOND
500 icons cannot be 500 hand-placed one-offs, and must not be 500 palette-swaps. Build a forge.
- **A parametric-but-distinct icon system** in `spritegen/icons.ts` (the `WEAPON_ART`
  class-silhouette + detail pattern × the buildings-catalog RAMP pattern): per SUBCATEGORY a base
  silhouette (a bat, a pan, a bottle, a can, a pendant, a fruit, a loaf, a sack, a crate, a
  ticket, a firework, a pill…) recolored by a seeded `RAMP` and finished with a per-item DETAIL
  pass (a label, a stripe, a charm stone, a bite, a cork) so each reads as its specific thing.
  **Bespoke (hand-drawn) for every SIGNATURE:** each hero's weapon rungs, the hero-signature
  sets, the named key items, the boss-drop weapons. Parametric (base+ramp+detail) for the long
  tail (foods, drinks, generic gear, valuables). The both-directions gate (ADR-060) is unchanged
  and now your slop-detector: it forces a row per item, and `art:icons` forces your EYES on it.
- **`npm run art:icons` scales:** paginate the contact sheet (per kind / per region) so all ~500
  are reviewable; add a `--region chN` filter. Two items must never share a drawing
  (`icons.test.ts`: spot-check distinctness across + within kinds).
- **DONE-WHEN:** the forge can render a distinct, on-theme icon for every planned subcategory at
  41 items still green; the contact sheet reads clean. Append the ADR; amend §B (the icon forge).

### MOVEMENT 18 — THE AMERICAS CATALOG (Ch.1 USA + Ch.2 South America) — do THIRD
The two SHIPPED chapters — items are DEFINED + iconed + manifested AND **placed live** (shops,
drops, gift boxes, quest rewards, picnic). This is the template every later region copies.
- **Per the per-chapter template (fill creatively, §A11 voice):**
  - **Weapons:** Jay's bats *Cracked → T-Ball → Sandlot Slugger → Aluminum Annihilator →
    Hall-of-Famer* (+ a funny sidegrade: *Foam Finger #1*, weak but +Luck); Mia's pans
    *Hand-Me-Down → Copper → Cast-Iron → Chef's*; Milo's guns *Pellet Popper → Spud Gun →
    Double-Barrel Sparker* + Bottle-Rocket tiers; (Dorin/Pippa rungs DEFINED for later, not
    placeable pre-join).
  - **Armor/hats:** *Otterbrook Cap → Bike Helmet → Crossing-Guard Sash (body) → Sunday Best*;
    Ch.2 *Straw Sombrero, Poncho* (the canon Wool Poncho), *Llama-Wool Vest*.
  - **Hero sets:** the existing STARTING FIVE (arms) + SUNDAY SET (charms) stand; ADD a Ch.1
    **PORCH SET** (5 wielder-tagged charms from home — *Jay's Lucky Bottlecap*, etc.) and a Ch.2
    **MERCADO SET**.
  - **Foods:** *Corn Dog, PB&J (+ Grilled Cheese, Burnt Toast, Mom's Casserole, Gas-Station
    Taquito, Pixel-Berry Pie, Ballpark Nachos, Lemonade)*; Ch.2 *Alfajor, Empanada, Choclo,
    Mystery Ceviche, Dulce Bar*.
  - **Drinks:** *Star Cola → Diet Star Cola → Star Cola CLASSIC*; Ch.2 *Mate Gourd, Jungle
    Fizz*. **Cures:** the §A8 set + tiers (*Salt Shaker, Aloe Leaf, Hanky, Eye-Drops, Wakey
    Bell, Unknot Tonic, Mom's Voice Tape*). **Revival:** *Second Wind, Glint's Spark*.
  - **Tonics:** the first few (a quest-reward *Sudden Guts Pill*). **Battle items:** *Bottle
    Rocket / Big / Multi, Firecracker String, Bug Zapper, Stink Bomb, Whoopee Cushion (taunt),
    Pocket Sand (Crying), Camera Flash*. **Valuables:** *Fresh Stamps, Fool's-Gold Idol, Spare
    Hubcap*. **Key items:** the canon set. **Baskets:** Basic/Family + the regional Family fills.
- **Place them live:** extend the Ch.1–2 SHOPS, drop tables, gift boxes (append-only on grown
  maps; cores byte-identical), and the §A10 quest rewards. Re-prove any grown map that gains a
  gift-box prop with the tile+PROP-solid BFS.
- **DONE-WHEN:** Ch.1–2 feel STOCKED — you can shop, loot, and equip a deep local catalog; every
  item iconed + manifested + priced to §A9. Append the ADR; amend §A8 (the Americas lines).

### MOVEMENT 19 — THE OLD-WORLD CATALOG (Ch.3 England · Ch.4 Norway · Ch.5 Minimus) — do FOURTH
Unlanded — DEFINE + icon + manifest + price + put in shop/drop DATA; place in maps when the
chapter lands. Each region's items smell unmistakably of it:
- **England (foggy academy):** Milo JOINS — his gun ladder continues + his Gizmo/Repair items
  (*Broken Gizmo → Repaired Whirligig*, the *Defibrillator*); tea as PP (*Earl Grey, Builder's
  Tea, Monastery Tea*); *Cricket Cap, Prefect Blazer (body), Cricket Bat (Jay sidegrade)*; a
  **WINTERMOOR SET**; cures for *Hushed* debut here (*Library Hush-Pass?* — keep §A11). Funny:
  *Soggy Biscuit, Mystery-Meat Pie*.
- **Norway (giants' scale):** the *Lost & Found of Impossible Sizes* pays off — *Giant's Button
  (shield-sized), Thimble that's a Bell*; *Fur-Lined Hood, Sigrid's Monocle (Focus)*; foods
  *Brunost, Lutefisk (risky), Cloudberry Jam*; a **BOOTSTEP SET**; the first elemental-resist
  pendants (*Cool Charm* vs the cold).
- **Minimus (tabletop-tiny):** Pippa JOINS — her kit ladder *Stamp Sling → Needle Saber →
  Thimble Bell → Royal Red Pen*; tiny everything (*Crumb Loaf, Thimble of Tea, Postage-Stamp
  Quilt (body)*); a **MINISTER'S SET**; comedic valuables (*A Very Small Crown*).
- **DONE-WHEN:** three regions fully catalogued + iconed + manifested + shop-data ready; per-
  chapter quotas met; nothing placed on a non-existent map. Append the ADR; amend §A8.

### MOVEMENT 20 — THE FAR-WORLD CATALOG (Ch.6 Africa · Ch.7 India · Ch.8 China) — do FIFTH
- **Africa (bazaar/ruins):** market haggling flavor — *Riddle Ring (+10 Vibe, §A10 #13),
  Canteen of the Crossing, Kora-String Charm*; foods *Jollof Bowl, Date Cluster, Mirage Mango
  (fake?)*; *Turban of Calm (body)*; a **ZANZIBEL SET**; volt-resist *Rubber Brooch*.
- **India (biggest city):** *Samosa, Chai (PP), Spice Box (cooked foods +50%), Star Pendant,
  Monkey-Paw Charm, Cobra-Scale Armor (boss drop)*; a **CHANDRAPORE SET**; the highway/drive era's
  road-snacks. Cobra Raja drops a signature weapon rung.
- **China (paper/temple):** *Baozi, Temple Incense (PP), Scroll of Calm (cures Mushroomize,
  reusable), Paper-Crane Charm, Folded-Steel rungs*; a **LOTUS SET**; the *Doctor's Note*
  (Mushroomize) becomes buyable here.
- **DONE-WHEN:** three regions catalogued/iconed/manifested/shop-ready; quotas met. Append the
  ADR; amend §A8.

### MOVEMENT 21 — THE LAST-WORLD CATALOG (Ch.9 Romania · Ch.10 Alaska→Hawaii→Mars) — do SIXTH
- **Romania (the heart):** Dorin JOINS — his bead ladder *Cedar → River → Comet Bead*; **Buni's
  pantry** is the best food/$ in the game (*Sarmale, Mămăligă cu Brânză, Buni's Feast*); the
  *Feast Basket*; a **STONE-BROW SET**; warm valuables (*Painted Egg, Star-Map Locket*). Sincere
  region — items are gentle, never gag-heavy.
- **Alaska→Hawaii→Mars (the climb):** the top of every ladder — *Casey's Last Swing, The Holy
  Pan, Gauss Lobber, Royal Red Pen, Comet Bead* (the §A8 endgame weapons); *Fur Parka, Aloha
  Charm, Pressure Suit (body), Star Pendant*; *Akutaq, Poke Bowl, Freeze-Dried Ice Cream (Mars
  vending)*; the *Hallelujah Bell*; the endgame tonics; the Mars dread-items. The *House Key*
  (the §A8 post-credits key) is the last item in the catalog.
- **DONE-WHEN:** all 10 regions catalogued; the §A8 endgame ladders complete; ~500 items total,
  every one iconed + manifested + priced; the per-chapter quota validator green. Append the ADR;
  amend §A8 (the endgame lines + the final count).

### MOVEMENT 22 — THE GLYPH FORGE (the pixel-emoji system) — do SEVENTH
The flair foundation. Build it once, cleanly.
- **`spritegen/glyphs.ts`** — a `GLYPHS: Record<name, () => Pixmap>` of ~40 palette-clean
  pixel glyphs (~8–10px): **fire, freeze, volt, holy, smash, star, sparkle, heart, broken-heart,
  music, sleep (zzz), anger, sweat, skull, dizzy, tear, laugh, sun, cloud, cola, corn-dog (the
  homesick craving), phone, camera, gift, money, ghost, paw, wrench, crown, check, x, up-arrow,
  down-arrow** — extend as the weave needs. ADR-020 clean; registered at boot (`glyph_<name>`).
- **The `{g:NAME}` token:** add a `GLYPH_TOKENS` keyset to the `tools/content-validate.ts` text
  sweep (so `{g:fire}` is accepted and a typo `{g:fier}` fails the build, the TEXT_VARS
  discipline). `vars()` leaves the token intact; the RENDERER consumes it.
- **The text-layout upgrade (the real work):** a shared helper that splits a resolved line into
  RUNS (font-text | glyph-sprite) and lays them out left-to-right, advancing the cursor, used by
  BOTH the dialogue window (`windows.ts` say/ask, preserving the letter-by-letter reveal + word
  wrap + the A-to-fast-forward) AND `BattleScene.print`. Each glyph counts as ONE visual unit for
  the §A11 caption timing. Touch + controller unaffected.
- **A glyph contact sheet** (`npm run art:glyphs`) and a `glyphs.test.ts` (every glyph draws
  content in bounds; every `{g:NAME}` in any data string names a real glyph — both directions).
- **DONE-WHEN:** a test line `"It's super effective! {g:fire}{g:smash}"` renders the words plus
  two real pixel glyphs inline, letter-by-letter, correctly timed. Append the ADR; amend §A11.8.

### MOVEMENT 23 — THE FLAIR WEAVE (battle + dialogue, with restraint) — do EIGHTH
Thread the glyphs through the game — tastefully, §A11-safe.
- **Battle flair (data-driven, automatic where it fits):** a small map from element/outcome →
  glyph that `BattleScene` appends to SOME lines — a fire hit `{g:fire}`, a freeze `{g:freeze}`,
  a volt `{g:volt}`, a Vibe Surge `{g:sparkle}`, a SMAAASH crit `{g:smash}`, a KO `{g:skull}`/
  `{g:star}` (dizzy), Pray's Miraculous `{g:holy}{g:heart}`, sleep `{g:sleep}`, a miss
  `{g:sweat}`. Tasteful frequency (e.g. crits + elements + status, not plain hits). The Hush's
  movements get NONE.
- **Dialogue flair (hand-placed, sparse):** sweep the 431 scripts and the §A6 beats; add a glyph
  only where a specific NPC's ONE obsession or a playful moment earns it (a sunny vendor's
  `{g:sun}`, Mom's `{g:heart}`, a vending machine's smug `{g:money}`, Ana & Vivi's `{g:star}`,
  Mr. Saturn-ish absurdity). **Audit pass:** the Hush — none; Buni/Mom/Dorin's trial/the finale —
  clean (at most one warm glyph); no line depends on its glyph to read.
- **Seed the new items into the existing Ch.1–2 text/quests** where it deepens a beat (a shop
  line that names a new local food; a quest reward swapped to a richer item) — without breaking
  the §A10 three-way quest law or the caller ledger.
- **DONE-WHEN:** battles sparkle on the right hits, the right NPCs got their flair, the Hush and
  the sincere beats are untouched, and a §A11 read-through passes. Append the ADR; amend §A6/§A11.

### MOVEMENT 24 — BALANCE & THE GREAT VERIFICATION — do LAST
- **The power/price curve:** sweep all ~500 items so weapon/armor offense/defense, tonic rarity,
  battle-item power, and prices track the §A6 level targets and the §A9 "refresh ≈ two chapters"
  rule. Extend `tools/balance-sim.ts` to report the curve per region; tune DATA, never code, to
  green.
- **The great verification:** the per-chapter item quota; the both-directions icon gate at ~500;
  the both-directions glyph gate; every shop/drop/reward references a real item; no orphan icons
  or glyphs; the §A11 read-through (Hush clean, sincerity clean, flair restrained); `art:icons`
  + `art:glyphs` contact sheets rendered to `.shots/`.
- **DONE-WHEN:** `npm run validate` prints `~500 items (~500 icons) across 10 chapters` + the
  glyph count, full vitest green, tsc clean, `vite build` clean, balance-sim green. Append the
  consolidated ADR; confirm the §A8/§A11 amendments are all in.

---

## QA (docs/QA.md pre-flight + new rows) + DONE-WHEN

- validator + full vitest + tsc + `npm run build` GREEN at EVERY movement; the ICON ATLAS gate
  (every item iconed, both directions) and the new GLYPH gate both green; frozen cores
  byte-identical (`world_block`); no FNV re-pin (items/icons/glyphs/text aren't sample-routed).
- **~500 items, every one:** unique, iconed (distinct + on-theme + palette-clean), named +
  priced in §A11 voice + §A9 economy, carrying its chapter `band`, and PLACED in the world for
  shipped Ch.1–2 (shop/drop/gift/reward) or shop-data-ready for unlanded Ch.3–10.
- **Every map that gains an item-prop** (gift box on a grown map) re-proven with the tile+PROP-
  solid BFS; append-only outside the frozen core.
- **The FLAIR read-through (§A11):** glyphs are flair, used with restraint; the Hush never
  carries one; Buni/Mom/Dorin's trial/the finale stay clean; no line needs its glyph to read;
  caption timing still lands (glyph = 1 unit). Plain-spoken, kid-readable throughout.
- **`.shots/`** of: the per-kind + per-region icon contact sheets (`art:icons`), the glyph sheet
  (`art:glyphs`), a battle line with element + crit flair, and a stocked shop. Use the `art:*`
  contact sheets — **NOT `preview_screenshot`** (it hangs on the WebGL canvas).
- Append one ADR per movement (next free id) per the drift rule, amending the Bible (§A8 / §A4.12
  / §A11.8 / §B) in the SAME commit.
- Browser p99 loop + `android:apk` paths stay green; the icon/glyph textures pool fine (they're
  tiny; boot registers once).

**Build it like it ships: a world you can actually shop, loot, and equip — deep, funny, and
warm — with a little real-pixel sparkle on the right hit. Unmistakably EarthBound.** ☄️
