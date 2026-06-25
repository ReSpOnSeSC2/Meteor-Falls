# Chapter 5 — "The Grand Duchy of Minimus" — DESIGN SPEC

> **SHIPPED — data spine (2026-06-25, ADR-129).** The design below is built: the chapter
> validates green and is end-to-end playable on gray-box art; the authored ChatGPT→PNG
> pass is queued in [`docs/CH5_ART_PROMPTS.md`](asset-packages/PKG-12-ch5-Minimus.md).
> **The §9 open decisions landed to canon:** **A** = 3-hero boss (Pippa & Dorin join AFTER
> Whiskerzilla, per `BOSS_PARTY[5]`); **B/C** = the §A7 **20** (the canon seed six KEPT +
> the doc's Minimus types across the Flow-Law mix — *not* the draft's 16); **D** = the
> Hedgerow hedge-maze; **E** = Whiskerzilla **knighted**. One correction from the draft:
> regular-enemy HP sits **on the canon curve** (Ch.5 mid 193, ~95–360), not the "400–1,000"
> proposed in §4 (off-curve — CLAUDE.md "place it on the curve"). Canon sources:
> `docs/GAME_BIBLE.md` §A6/§A7 + `CHAPTER_MANIFESTS['5']` + `docs/BALANCE_CH4-10_SPEC.md`.

---

## 1. Premise & tone

The **HIGH Ember** fell on coronation night and shrank the whole realm to **1/100**.
The duchy decided this was a **blessing** ("rent has never been cheaper"). The party
arrive as the **visiting colossi**: enormous, clumsy, terrifying if they step wrong —
so the Whistle Guards route them down the one sanctioned road and beg them to be careful.

Tone: **scale comedy + bureaucratic dignity.** Tiny things are taken with deadly
seriousness; enemies fight in **formations**, **take votes**, and **exploit the party's
huge hitboxes**. The joke of the chapter is that smallness is never weakness — it's
*procedure*. Citizens are **never damaged**; the danger is embarrassment, paperwork, and
a housecat. This is where **Pippa's** competence-not-magic kit is born.

**Scale law (§A6, Prompt 31):** the party walk only the **Procession Way**; everywhere
else the Whistle Guards nudge them along. Citizens stay readable and protected by
*nudges, not damage*.

---

## 2. Story spine (beat order)

1. **Arrival.** Lucille lands "in the duchy. All of it." A Whistle Guard flags the party
   down before they flatten a suburb. (Cutscene panel: biplane over the tabletop capital.)
2. **Minimus Major.** The party tiptoe in on the Procession Way. **Pippa Quill**, royal
   census cadet and page to **Grand Duchess Millimetta I**, tries to brief them from a
   matchbox podium and is repeatedly mistaken for a talking lapel pin. She attaches
   herself to the party as a guide (NPC companion).
3. **The Big-Little Lens.** The duchy's hundred engineers grind **Sigrid's spare lens**
   (from Ch.4) into the **Big-Little Lens** — upgrading **Milo's Spy** with party-wide
   **Focus** and giving Pippa a readable travel scale, *without "fixing" Minimus*.
   (Gameplay: this is the in-fiction unlock of the already-coded `big_little_focus`.)
4. **The Royal Census.** Pippa's arrival quest: count all 100 citizens who will not stand
   still (they keep walking under postage stamps). Starts as a joke; becomes her proof
   that every tiny person has a **name**.
5. **Procession Way → The Hedgerow.** The sanctioned road leads out to the **Hedgerow**,
   a hedge maze that is a *forest* at their scale (the dungeon).
6. **The Ducal Crown.** Past the Hedgerow sits the **Ducal Crown** — the realm's crown
   jewel and the **Resonance Site**. A **housecat** has claimed it as a napping spot.
7. **WHISKERZILLA.** The cat — an ordinary lost pet, to the duchy a *kaiju* — must be
   moved. You don't beat it; you **survive it until it gets bored**, then the Duchess
   **knights it**. (Mercy ending — §A6.)
8. **Heartlight 5 — "The Bell Choir."** Recorded at the Ducal Crown (the Homesong's
   highest stem); **Ember 5** collected.
9. **The two joins.** The Duchess appoints Pippa **Foreign Minister of Being Taken
   Seriously** and sends her with the party — **Pippa joins playable** with the **Royal
   Thimble** scale-anchor key item. The travel-worn gi kid who kept turning up a step
   ahead (the Ch.4 spine cameo) is revealed: **Dorin joins** at the close, too. `ch5_complete`.

After Ch.5 the party is **five** (rex, faye, milo, pippa, dorin). The Whiskerzilla fight
itself is the **3-hero** party (rex/faye/milo) — both newcomers join *after* the boss
(matches `BOSS_PARTY` ch5 and §A6). See **Decision A**.

---

## 3. Maps (4 + home)

| id | kind | role |
|----|------|------|
| `minimus_major` | city (spire-canton, 48×32) | tabletop capital: knee-high cathedral, ribbon streets, the Procession Way through it, Ducal Provisioner shop, Pippa + Duchess + engineers, census start |
| `procession_way` | overworld road | the sanctioned colossi road out to the Hedgerow; Whistle-Guard roamers; scale set-pieces; Mr. Click's macro-lens photo |
| `the_hedgerow` | dungeon (grammar `the_hedgerow`) | hedge maze = a forest at their scale; dungeon specialists; a **gate beat** (Milo's lens / a scale step) |
| `ducal_crown` | dungeon (resonance + boss) | the crown jewel; Whiskerzilla naps here; the Flat Bell hangs above; Heartlight 5 |

- Overworld `maps:` = `[minimus_major, procession_way]`; `dungeon.maps:` = `[the_hedgerow, ducal_crown]`.
- **Regional home** (property arc, `src/data/properties.ts`): a **Manor in Minimus** you
  live *around* (§A6 line 286) — you can't fit inside; you nap against it.
- **Scale staging:** every Minimus map should read HUGE — the party clip the tops of
  spires, citizens are sprite-dots, doors are ankle-high. The "huge hitbox" gimmick is the
  reason `pinpoint_mark` exists.

---

## 4. Enemy roster (proposed 16; §A7 ecosystem; band HP **400–1,000**, basic hit **50–130**)

> Re-tuned UP from the forge seeds (which came in at 124–263 HP, below the Ch.5 band).
> Each is a starting proposal — **rename / reflavor freely.** Theme: tiny-but-procedural,
> formations, votes, big-hitbox exploits. ~3 are roamers Pippa's Pinpoint Mark "fixes."

**Road/field — Procession Way (4)**
1. **Whistle Guard** *(grunt, ~480 HP)* — thumb-high constable; blows a whistle to call a second. Halts you "by the book" (the Borden/Buckle rhyme).
2. **Census Pigeon** *(roamer/flyer, ~520 HP)* — parade-balloon-huge to them, ordinary to you; pecks shoelaces.
3. **Toll Clerk** *(caster, ~430 HP)* — spends a turn "taking a vote" on your fine; debuffs wallet/Offense.
4. **Cobble Mite** *(grunt, ~410 HP)* — hides between cobbles where big feet whiff; **needs Pinpoint Mark** to hit reliably.

**Dungeon specialists — The Hedgerow (3)**
5. **Hedge Sprite** *(lurker, ~620 HP)* — leaf-clad duelist; ambush from the maze shadows.
6. **Topiary Knight** *(bruiser, ~820 HP)* — clipped-shrub guardian; hits hard, slow.
7. **Bramble Tangle** *(caster, ~560 HP)* — thorn vines that **root/entangle** (status).

**Social/urban oddities — Minimus Major (2)**
8. **Lapel-Pin Mob** *(swarm, ~390 HP ea, comes 2–3)* — citizens who mistake you for furniture and climb you; **formation** enemy.
9. **Town Crier** *(support caster, ~500 HP)* — reads proclamations that **buff** its allies ("By order of the Duchess…").

**Rare / high-value (2)**
10. **Gilded Snuffbox Beetle** *(rare, ~700 HP, big cash)* — a jeweled beetle worth a fortune; flighty.
11. **Royal Tax Assessor** *(rare, ~650 HP, big cash, flees)* — appears to "assess" you; drop the audit before it escapes.

**Late-chapter pressure (2)**
12. **Halberd Column** *(bruiser formation, ~900 HP)* — a wall of tiny pikes; **punishes non-Defend** (rhymes with the boss POUNCE).
13. **Bell-Ringer Acolyte** *(caster, ~780 HP)* — rings warning bells granting allies **evasion** (telegraphs the Flat Bell mechanic).

**Set-piece (§A6 formation battle) (1)**
14. **The Grand Parade** *(set-piece multi-unit)* — a whole procession that **takes a vote each turn** to decide its move; chaos until **Pinpoint Mark** imposes order. (See Decision A re: whether Pippa is playable here.)

**Two more to round out (2)**
15. **Postage-Stamp Lurker** *(lurker, ~600 HP)* — hides under a stamp (the census joke); ambush.
16. **Clockwork Courier** *(speedy roamer, ~470 HP)* — a wind-up messenger that darts and flees with your cash.

---

## 5. Boss — WHISKERZILLA (`whiskerzilla`, **4,000 HP**, template `scriptedSurvival`)

An **ordinary lost housecat**. To the duchy: a **kaiju** asleep on the crown jewel. The
fight is a **mercy/survival**, not a kill — you tire it out / make it lose interest, and
the Duchess **knights** it (it stays, ennobled, as the realm's new monument).

**Mechanics (§A6):**
- **POUNCE telegraph** — every **3rd turn** the tail wiggles (a clear tell). Next turn it
  **pounces**: **Defend** to brace, or be **knocked Flat → Paralyzed** (1 turn).
- **The Flat Bell** — a **second target, 150 HP**, hanging above. While it **rings**,
  Whiskerzilla has **evasion** (attacks may whiff). **Break the bell** → the cat starts to
  **purr**, and the purr **telegraphs its every move** (evasion gone, tells doubled).
- **scriptedSurvival** — reduce/survive to a threshold; it **yawns, gets bored**, and the
  scene resolves to the knighting. Victory line ≈ "It blinks at you, decides you are
  furniture, and goes back to sleep — ennobled."

**Tuning:** 4,000 HP at L26 with the 3-hero band (rex/faye/milo); verify TTK ×2.22 / 4–10
turns with `npm run balance`. Heartlight 5 = **The Bell Choir**.

---

## 6. Quests (5; each a finale CALLER)

1. **`royal_census`** (§A10 #11) — count all 100 citizens who won't stand still. Caller:
   the Census-Taker; reward **Stamp Quilt**. Pippa's thesis: every tiny person has a name.
2. **`civic_repairs`** (§A10 #12) — the shrink (and a few colossus footsteps) broke the
   duchy's infrastructure: a knee-high bridge, a thimble-well, a matchstick scaffold.
3. **The Lost & Found of Impossible Sizes** *(regional, §A6 line 944)* — return wrong-sized
   objects across scale (a giant **button** = shield here / manhole cover there; a Minimus
   **spoon** = perfect tuning fork). Pippa treats each as a diplomatic incident.
4. **The Silent Belfry** *(regional)* — restore the duchy's bell choir (ties to Heartlight
   5 "The Bell Choir" + the boss's Flat Bell). Recover/clean the clappers, ring in order.
5. **Say Cheese, Minister** *(regional)* — Mr. Click's macro-lens photo (§A6 line 878):
   Pippa stands on a thimble like a podium; a knee-high portrait beat for the Duchess.

---

## 7. Party: joins, abilities, balance

- **Pippa** — accompanies as NPC guide from Minimus Major; **joins playable at chapter
  close** (Foreign Minister), with **Royal Thimble** key item. Kit already coded:
  `pinpoint_mark`, `royal_rally`, `pocket_patch`, `big_little_focus` (+ L20–44 unlocks).
- **Dorin** — the Ch.4 gi-kid cameo pays off; **joins playable at chapter close** (after
  Whiskerzilla). Kit coded (on-join: `vibe_comet_a/b`, `mirror`, `healing_a/b`,
  `stone_stance`). His awakening is **Ch.9** (not here).
- **Abilities/HP/curves** — all Ch.5 values already exist with the ADR-122 revamp applied
  (`vibe_freeze_b` 72, `vibe_volt_b`, `heartmend_a` 199, `BOSS_HP[5]` 4000). **No new
  Ch.5 awakening.**
- **BUILD-DEFERRED cleanup** (heroes.ts notes): re-spread Dorin's & Pippa's L1-clustered
  unlocks across their real earn levels, and add **`dorin` to `BOSS_PARTY` from Ch.6** per
  BALANCE_CH4-10_SPEC §1d.
- **Shop:** the **Ducal Provisioner** shelf in Minimus Major (Prompt 31).

---

## 8. Voice & art (§A11 / PKG-12)

- **Voice:** tiny-but-dignified; civic proclamation register; everything is *procedure*.
  Signs in a "foreign but readable" duchy hand. Never reveal chapter structure in UI
  (banners may say **MINIMUS MAJOR**).
- **Art manifest (PKG-12):** spire-canton **tileset** (`Minimus_tiles_16.png`),
  **the_hedgerow** dungeon art, ~8 **facades**, ~12 **NPC** 46-frame sheets, **16 enemies
  ×3 wear** + minis, **Whiskerzilla** bespoke (×3 wear), **backdrop** (`the_hedgerow.png`),
  ~6–8 **cutscene panels**, the **Manor** home interior. All ChatGPT→PNG, sliced + wired
  (`authored.ts`), kept as masters.

---

## 9. DECISIONS I need from you

- **A — Pippa during Ch.5.** Canon (§A6 + `BOSS_PARTY`=rex,faye,milo) says Pippa & Dorin
  join **at the close**, so the Whiskerzilla fight is **3 heroes** and Pippa's kit debuts in
  Ch.6. The §A6 formation set-piece then showcases her as an **NPC-assisted scripted moment**.
  ✅ I recommend following canon (3-hero boss). Alternative: make Pippa playable when met
  (her kit usable in Ch.5 fights) — but that contradicts the pinned boss party. **OK to go canon?**
- **B — Enemy count.** PKG-12 says "20"; Ch.4 shipped **16**. I propose **16** (above) to
  keep the art pass tractable (16×3 = 48 battlers). Want 16, or push to 20?
- **C — Roster names/flavor.** The 16 names above are my proposal. Any you want renamed,
  cut, or added? (This is the most "taste" part.)
- **D — Dungeon shape.** The Hedgerow as a **hedge maze** with a Milo's-Lens gate beat,
  ending at the Ducal Crown boss room. Good, or a different fantasy (e.g., the cathedral
  interior, a clockwork undercroft)?
- **E — Mercy ending staging.** Whiskerzilla **knighted** (stays as a monument) vs. simply
  **wanders off**. I lean knighted (funnier, more Minimus). Preference?
