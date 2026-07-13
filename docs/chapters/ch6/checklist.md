# Chapter 6 — The Ruins That Laugh (Africa) — production checklist

> Production rollout completed 2026-07-13. Executable canon is the source of
> truth; the original scaffold language is retired.

## Shipped contract

- **Region / travel:** Africa · biplane
- **Target level / band:** 30 · `ch6`
- **Ember:** 6, Heartlight “The Laughing Chord”
- **Maps:** `zanzibel` 72×56, `savanna_run` 104×64,
  `laughing_ruins` 80×88, `sphinx_chin` 56×44
- **Boss:** The Laughing Sphinx (`laughing_sphinx`), **9,000 HP**, riddle template
- **Core quests:** `watering_hole_convoy`, `stones_that_speak`
- **Save schema:** v23 Chapter 6 layout and parking recovery

## Production completion

- [x] Rebuild Zanzibel as a three-band formal city with two connected street
      loops, quayside arrival, outbound courier tutorial, and three civic rooms.
- [x] Preserve the first six facade sources, historical locked index 4, unit ids
      0–4, service NPC ids, return doors, and the five established unit identities.
- [x] Expand Zanzibel to sixteen supported facade sources and fourteen live units.
- [x] Rebuild Savanna Run as a winding clearing chain with watering-hole branch,
      separate escort beat, rest pocket, reciprocal doors, and encounter rooms.
- [x] Rebuild Laughing Ruins as a nonlinear chamber climb that forces Held Breath
      before the Trust choice and retires all roamers after the Sphinx victory.
- [x] Rebuild Sphinx’s Chin as a staged boss arena followed by a separate,
      non-overlapping resonance chamber.
- [x] Make both named quests complete, reward/caller-bearing, hands-full retry-safe,
      and idempotent.
- [x] Split the seven-panel gallery reel into flight, arrival, courier, ruins,
      Sphinx, and Heartlight runtime cutscenes while retaining `ch6_journey`.
- [x] Add eight representative developer profiles with the five-person level-30
      party, five prior Embers, and Lens/Thimble key items.
- [x] Add v23 recovery, focused contract tests, editor regeneration, Chapter 6
      contact sheet, live survey, and production verification evidence.

See `docs/CH6_PRODUCTION_VERIFICATION.md` and ADR-141.
