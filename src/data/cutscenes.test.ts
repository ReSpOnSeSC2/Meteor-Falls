import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  CUTSCENES,
  ch8PartyCutsceneId,
  ch9PartyCutsceneId,
  cutscenePanelFilenames,
  type CutsceneBeat,
} from './cutscenes';

const all = Object.values(CUTSCENES);

function panelPath(chapter: string, beat: CutsceneBeat): string {
  const candidates = cutscenePanelFilenames(beat.art).map((filename) => fileURLToPath(
    new URL(`../../assets/art/cutscenes/${chapter}/${filename}`, import.meta.url),
  ));
  return candidates.find((path) => existsSync(path)) ?? candidates[candidates.length - 1];
}

function pngSize(path: string): { w: number; h: number } {
  const data = readFileSync(path);
  return { w: data.readUInt32BE(16), h: data.readUInt32BE(20) };
}

function beatKeys(): Set<string> {
  return new Set(all.flatMap((cs) => cs.beats.map((beat) => `${cs.chapter}/${beat.art}`)));
}

describe('cutscene registry', () => {
  it('is keyed consistently and every cutscene has beats', () => {
    expect(all.length).toBeGreaterThan(0);
    for (const [id, cs] of Object.entries(CUTSCENES)) {
      expect(cs.id).toBe(id); // map key matches the cutscene's own id
      expect(cs.chapter).toMatch(/^ch\d+$/);
      expect(cs.beats.length).toBeGreaterThan(0);
    }
  });

  it('has clean art stems (no extension, no path, no spaces)', () => {
    for (const cs of all) {
      for (const beat of cs.beats) {
        expect(beat.art).toMatch(/^[a-z0-9_]+$/);
      }
    }
  });

  it('covers ch1–ch10', () => {
    const chapters = new Set(all.map((cs) => cs.chapter));
    for (let n = 1; n <= 10; n++) expect(chapters.has(`ch${n}`)).toBe(true);
  });

  // The pipeline allows scaffolding a beat before its PNG lands (the player skips
  // missing art) — but a beat with authored captions is a SHIPPED beat, so its
  // panel must exist on disk.
  it('every captioned beat has its panel authored on disk', () => {
    const missing: string[] = [];
    for (const cs of all) {
      for (const beat of cs.beats) {
        if ((beat.captions?.length ?? 0) > 0 && !existsSync(panelPath(cs.chapter, beat))) {
          missing.push(`${cs.id}: ${beat.art}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it('ch1_opening is the wired proof: three present panels', () => {
    const opening = CUTSCENES.ch1_opening;
    expect(opening.beats.map((b) => b.art)).toEqual([
      'meteor_2am',
      'hickory_hill',
      'otterbrook_at_night',
    ]);
    for (const beat of opening.beats) {
      expect(existsSync(panelPath('ch1', beat))).toBe(true);
    }
  });

  it('times Chapter 3 as seven story-safe single-beat sequences', () => {
    const ids = [
      'ch3_flight', 'ch3_milo_join', 'ch3_first_borrow', 'ch3_stones',
      'ch3_fog_reveal', 'ch3_mainframe', 'ch3_heartlight',
    ] as const;
    expect(CUTSCENES.ch3_journey.beats).toHaveLength(ids.length);
    for (const id of ids) {
      const cutscene = CUTSCENES[id];
      expect(cutscene.beats).toHaveLength(1);
      expect(cutscene.beats[0].captions?.length).toBeGreaterThan(0);
      expect(cutscene.beats[0].motion?.ms).toBeGreaterThanOrEqual(8000);
      expect(existsSync(panelPath('ch3', cutscene.beats[0]))).toBe(true);
    }
  });

  it('keeps the Chapter 4 gallery complete while runtime beats stay contextual', () => {
    expect(CUTSCENES.ch4_journey.beats.map((beat) => beat.art)).toEqual([
      'fjord_establishing', 'lucille_north_sea_hop', 'kvisthavn_under_cliffs',
      'bootstep_moor_growth', 'lilleby_giants_kneel', 'sleeper_spine_crossing',
      'whisperwig_reveal', 'heartlight_4_deep_hum',
    ]);
    expect(CUTSCENES.ch4_flight.beats.map((beat) => beat.art)).toEqual([
      'fjord_establishing', 'lucille_north_sea_hop',
    ]);
    for (const id of ['ch4_arrival', 'ch4_moor', 'ch4_lilleby', 'ch4_spine', 'ch4_whisperwig', 'ch4_heartlight'] as const) {
      expect(CUTSCENES[id].beats).toHaveLength(1);
    }
  });

  it('keeps the Chapter 5 gallery complete while runtime beats avoid spoilers', () => {
    expect(CUTSCENES.ch5_journey.beats.map((beat) => beat.art)).toEqual([
      'tabletop_duchy_establishing', 'grand_duchy_travel_in',
      'minimus_major_tabletop_capital', 'pippa_matchbox_briefing',
      'big_little_lens_build', 'pippa_joins_party',
      'whiskerzilla_knighted', 'heartlight_5_bell_choir',
    ]);
    expect(CUTSCENES.ch5_flight.beats.map((beat) => beat.art)).toEqual([
      'tabletop_duchy_establishing', 'grand_duchy_travel_in',
    ]);
    expect(CUTSCENES.ch5_arrival.beats.map((beat) => beat.art)).toEqual([
      'minimus_major_tabletop_capital', 'pippa_matchbox_briefing',
    ]);
    for (const id of ['ch5_lens', 'ch5_join', 'ch5_knighted', 'ch5_heartlight'] as const) {
      expect(CUTSCENES[id].beats).toHaveLength(1);
    }
  });

  it('keeps the Chapter 6 gallery complete while runtime beats stay contextual', () => {
    expect(CUTSCENES.ch6_journey.beats.map((beat) => beat.art)).toEqual([
      'caravan_to_zanzibel', 'savanna_caravan_at_dusk', 'zanzibel_market',
      'courier_teaches_teleport_alpha', 'laughing_ruins',
      'laughing_sphinx_riddle', 'sphinx_chin_resonance',
    ]);
    expect(CUTSCENES.ch6_flight.beats.map((beat) => beat.art)).toEqual([
      'caravan_to_zanzibel', 'savanna_caravan_at_dusk',
    ]);
    for (const id of ['ch6_arrival', 'ch6_courier', 'ch6_ruins', 'ch6_sphinx', 'ch6_heartlight'] as const) {
      expect(CUTSCENES[id].beats).toHaveLength(1);
    }
    expect(CUTSCENES.ch6_held_breath.beats).toHaveLength(1);
  });

  it('keeps the Chapter 7 gallery canonical while runtime beats stay contextual', () => {
    const expected = [
      'night_train_to_chandrapore',
      'chandrapore_bazaars',
      'locket_train_heist',
      'royal_vivarium_palace',
      'cobra_raja_reveal',
      'palace_throne_resonance',
      'cinema_about_the_party',
    ];
    expect(CUTSCENES.ch7_journey.beats.map((beat) => beat.art)).toEqual(expected);
    expect([
      'ch7_train_in',
      'ch7_bazaar',
      'ch7_heist',
      'ch7_palace',
      'ch7_raja',
      'ch7_heartlight',
      'ch7_cinema',
    ].map((id) => CUTSCENES[id].beats.map((beat) => beat.art))).toEqual(expected.map((art) => [art]));
  });

  it('keeps the Chapter 8 gallery canonical and every runtime cut contextual', () => {
    const expected = [
      'riverboat_to_lotus_harbor',
      'lotus_harbor_arrival',
      'spore_forest_scramble',
      'yak_express_to_mt_shu',
      'paper_guardians_false_folds',
      'paper_dragon_reveal',
      'temple_bell_resonance',
    ];
    const contextual = [
      'ch8_riverboat',
      'ch8_arrival',
      'ch8_spore',
      'ch8_yak',
      'ch8_false_folds',
      'ch8_dragon',
      'ch8_heartlight',
    ];

    expect(CUTSCENES.ch8_journey.beats.map((beat) => beat.art)).toEqual(expected);
    expect(contextual.map((id) => CUTSCENES[id].beats.map((beat) => beat.art))).toEqual(
      expected.map((art) => [art]),
    );
    expect(contextual.every((id) => CUTSCENES[id].beats.length === 1)).toBe(true);
    expect(CUTSCENES.ch8_dragon_departed.beats.map((beat) => beat.art)).toEqual([
      'paper_dragon_reveal_departed',
    ]);
    expect(CUTSCENES.ch8_heartlight_departed.beats.map((beat) => beat.art)).toEqual([
      'temple_bell_resonance_departed',
    ]);
    expect(ch8PartyCutsceneId('dragon', true)).toBe('ch8_dragon');
    expect(ch8PartyCutsceneId('dragon', false)).toBe('ch8_dragon_departed');
    expect(ch8PartyCutsceneId('heartlight', true)).toBe('ch8_heartlight');
    expect(ch8PartyCutsceneId('heartlight', false)).toBe('ch8_heartlight_departed');
  });

  it('keeps the Chapter 9 gallery canonical while every ensemble runtime cut is branch-truthful', () => {
    const expected = [
      'orient_less_express_to_valea',
      'valea_stelelor_arrival',
      'buni_feast_basket',
      'castle_hoaxula',
      'count_hoaxula_unmasked',
      'monastery_bell_tower_resonance',
      'trial_of_the_mute_mountain',
    ];
    expect(CUTSCENES.ch9_journey.beats.map((beat) => beat.art)).toEqual(expected);
    for (const moment of ['train', 'arrival', 'buni', 'castle', 'unmasked', 'heartlight', 'choice'] as const) {
      const present = ch9PartyCutsceneId(moment, true);
      const departed = ch9PartyCutsceneId(moment, false);
      expect(present).toBe(`ch9_${moment}_pippa`);
      expect(departed).toBe(`ch9_${moment}_departed`);
      expect(CUTSCENES[present].beats).toHaveLength(1);
      expect(CUTSCENES[departed].beats).toHaveLength(1);
      expect(CUTSCENES[present].beats[0].art).toMatch(/_pippa$/);
      expect(CUTSCENES[departed].beats[0].art).toMatch(/_departed$/);
    }
    expect(CUTSCENES.ch9_trial.beats.map((beat) => beat.art)).toEqual([
      'trial_of_the_mute_mountain',
    ]);
  });

  it('prefers runtime-resolution _4x panels over legacy _01 placeholders', () => {
    const preferred4x: string[] = [];
    for (const cs of all) {
      for (const beat of cs.beats) {
        const path = panelPath(cs.chapter, beat);
        if (!path.endsWith('_4x.png')) continue;
        preferred4x.push(`${cs.chapter}/${beat.art}`);
        expect(pngSize(path), `${path} should be a runtime-resolution cutscene panel`).toEqual({ w: 1600, h: 900 });
      }
    }
    expect(preferred4x).toContain('ch5/big_little_lens_build');
    expect(preferred4x).toContain('ch6/zanzibel_market');
  });

  it('does not strand _4x cutscene panels outside the registry', () => {
    const registered = beatKeys();
    const stranded: string[] = [];
    for (let n = 1; n <= 10; n++) {
      const chapter = `ch${n}`;
      const dir = fileURLToPath(new URL(`../../assets/art/cutscenes/${chapter}/`, import.meta.url));
      if (!existsSync(dir)) continue;
      for (const filename of readdirSync(dir).filter((name) => name.endsWith('_4x.png'))) {
        const art = filename.replace(/_4x\.png$/, '');
        if (!registered.has(`${chapter}/${art}`)) stranded.push(`${chapter}/${filename}`);
      }
    }
    expect(stranded).toEqual([]);
  });
});
