import { describe, expect, it } from 'vitest';
import { BOSS_SCRIPTS } from './bosses';
import { CHAPTER_MANIFESTS } from './chapters';
import { DIALOGUE } from './dialogue';
import { ENEMIES } from './enemies';
import { buildChapter9Maps } from './maps_ch9';
import { CH9_BUNI_INGREDIENTS } from '../engine/ch9Quests';
import { PROPERTIES } from './properties';
import { SHOPS } from './shops';
import { enemyVisualIdentity } from './visuals';

const CH9_REGULAR_IDS = [
  'haystack_mimic',
  'ribcage_rattler',
  'moss_strigoi',
  'animated_armor',
  'wolf_of_the_old_road',
] as const;

type Ch9RegularId = (typeof CH9_REGULAR_IDS)[number];

const CH9_REGULAR_CONTRACT: Readonly<Record<Ch9RegularId, {
  level: number;
  hp: number;
  drop: string;
  deathLine: string;
}>> = {
  haystack_mimic: {
    level: 42,
    hp: 12_000,
    drop: 'placinta',
    deathLine: 'The Haystack Mimic came apart in a soft heap of straw, and a startled field-mouse ran out of it and away.',
  },
  ribcage_rattler: {
    level: 43,
    hp: 15_000,
    drop: 'vigil_candle',
    deathLine: 'The Ribcage Rattler fell apart one last time and this time forgot the trick of standing back up.',
  },
  moss_strigoi: {
    level: 43,
    hp: 17_000,
    drop: 'pelin_bitters',
    deathLine: 'The Moss Strigoi sighed out a last breath of cold cellar air, lay down in its own moss, and was only a sad old log again.',
  },
  animated_armor: {
    level: 44,
    hp: 20_000,
    drop: 'ciorba',
    deathLine: 'The Animated Armor toppled with an enormous crash and lay there empty — just a costume, after all, with nobody ever inside.',
  },
  wolf_of_the_old_road: {
    level: 45,
    hp: 24_000,
    drop: 'mici',
    deathLine: 'The Wolf of the Old Road sank down in the moonlight, and what lay in the road a moment later was only a tired grey dog, asleep at last.',
  },
};

function move(id: Ch9RegularId, name: string): (typeof ENEMIES)[string]['moves'][number] {
  const found = ENEMIES[id].moves.find((entry) => entry.name === name);
  if (!found) throw new Error(`${id} is missing move '${name}'`);
  return found;
}

describe('Chapter 9 regular combat roster', () => {
  it('places exactly five regular identities in their authored map bands and retires every spawner', () => {
    const maps = buildChapter9Maps();
    const idsOn = (mapId: keyof typeof maps): string[] => [
      ...new Set((maps[mapId].spawners ?? []).flatMap((spawner) => spawner.enemies)),
    ].sort();

    expect([...new Set(Object.values(maps).flatMap((map) =>
      (map.spawners ?? []).flatMap((spawner) => spawner.enemies),
    ))].sort()).toEqual([...CH9_REGULAR_IDS].sort());
    expect(idsOn('valea_stelelor')).toEqual(['haystack_mimic']);
    expect(idsOn('old_road')).toEqual(['haystack_mimic', 'moss_strigoi', 'wolf_of_the_old_road']);
    expect(idsOn('castle_hoaxula')).toEqual(['animated_armor', 'moss_strigoi', 'ribcage_rattler']);
    expect(idsOn('stone_brow_monastery')).toEqual([]);
    for (const map of Object.values(maps)) {
      for (const spawner of map.spawners ?? []) {
        expect(spawner.unlessFlag, `${map.id} spawner ${spawner.enemies.join('+')}`).toBe('count_hoaxula_defeated');
      }
    }
  });

  it.each(CH9_REGULAR_IDS)('%s pins level, HP, field tell, identity drop, and death line', (id) => {
    const enemy = ENEMIES[id];
    const contract = CH9_REGULAR_CONTRACT[id];
    expect(enemy).toBeDefined();
    expect({ level: enemy.level, hp: enemy.hp }).toEqual({ level: contract.level, hp: contract.hp });
    expect(enemy.boss).not.toBe(true);
    expect(enemyVisualIdentity(enemy)).toMatchObject({
      battle: `battle_${id}`,
      field: { kind: 'mini', key: `mini_${id}` },
    });
    expect(enemy.drops?.map((drop) => drop.item)).toEqual([contract.drop]);
    expect(enemy.deathLine).toBe(contract.deathLine);
  });

  it('keeps each regular enemy decision hook mechanically distinct', () => {
    expect(ENEMIES.haystack_mimic.weakness).toEqual(['fire']);
    expect(move('haystack_mimic', 'hay burst')).toMatchObject({ kind: 'strong', mult: 1.6 });
    expect(move('haystack_mimic', 'play dead')).toMatchObject({ kind: 'status', status: 'paralyzed' });
    expect(CH9_BUNI_INGREDIENTS.map((ingredient) => ingredient.itemId)).not.toContain(
      ENEMIES.haystack_mimic.drops?.[0]?.item,
    );

    expect(ENEMIES.ribcage_rattler.weakness).toEqual(['holy']);
    expect(move('ribcage_rattler', 'clatter apart')).toMatchObject({ kind: 'mend' });

    expect(move('moss_strigoi', 'life sip')).toMatchObject({ kind: 'drain', mult: 1.3 });
    expect(move('moss_strigoi', 'graveyard moan')).toMatchObject({ kind: 'status', status: 'crying' });

    expect(ENEMIES.animated_armor).toMatchObject({ defense: 60, weakness: ['volt'] });
    expect(move('animated_armor', 'parade halt')).toMatchObject({ kind: 'shield' });

    expect(ENEMIES.wolf_of_the_old_road).toMatchObject({ speed: 54, weakness: ['holy'] });
    expect(move('wolf_of_the_old_road', 'lunge')).toMatchObject({ kind: 'attack', mult: 1.2 });
    expect(move('wolf_of_the_old_road', 'throat tear')).toMatchObject({ kind: 'strong', mult: 1.8 });
  });
});

describe('Chapter 9 boss and shop contracts', () => {
  it('keeps Count Hoaxula at 95,000 HP with the theatrical-to-mercy boss hook', () => {
    const enemy = ENEMIES.count_hoaxula;
    const script = BOSS_SCRIPTS.count_hoaxula;
    expect(enemy).toMatchObject({ hp: 95_000, level: 46, boss: true, mind_immune: true });
    expect(CHAPTER_MANIFESTS['9'].boss).toEqual({
      id: 'count_hoaxula', name: 'Count Hoaxula', hp: 95_000, template: 'mercyEnding',
    });
    expect(script).toMatchObject({ boss: 'count_hoaxula', initialForm: 'theatrical' });
    expect(script.phases.find((phase) => phase.id === 'steal')).toMatchObject({
      trigger: { kind: 'turnCount', n: 2 },
      actions: [{ kind: 'scriptLine', line: 'hoaxula_steal' }, { kind: 'stealEquipped' }],
    });
    expect(script.phases.find((phase) => phase.id === 'command_windup')).toMatchObject({
      trigger: { kind: 'turnCount', n: 3, every: 3 }, once: false,
      actions: [{ kind: 'windup', turns: 1 }],
    });
    expect(script.phases.find((phase) => phase.id === 'unmask')).toMatchObject({
      trigger: { kind: 'hpBelow', frac: 0.5, inclusive: true, form: 'theatrical' },
      actions: [{ kind: 'scriptLine', line: 'hoaxula_unmask' }, { kind: 'setForm', form: 'unmasked' }],
    });
    expect(script.phases.find((phase) => phase.id === 'mercy')).toMatchObject({
      trigger: { kind: 'prayTierAtLeast', tier: 'good', form: 'unmasked' },
      actions: [{ kind: 'endBattleMercy' }],
    });
  });

  it('pins the exact Valea shelf and its live provisioner wiring', () => {
    expect(SHOPS.valea_provisioner).toMatchObject({
      id: 'valea_provisioner',
      name: 'THE VALEA PROVISIONER',
      keeperNpc: 'vs_provisioner',
      stock: [
        'sarmale', 'mamaliga', 'ciorba', 'cozonac', 'linden_tea',
        'caciula', 'sheepskin_cojoc',
        'garlic_braid', 'holy_water', 'pelin_bitters',
      ],
    });
    const valea = buildChapter9Maps().valea_stelelor;
    expect(valea.npcs.find((npc) => npc.id === 'vs_provisioner')).toMatchObject({
      shop: 'valea_provisioner',
    });
  });

  it('signposts the two honest future property seams without shipping purchase UI', () => {
    expect(PROPERTIES.valea_cottage).toMatchObject({ area: 'valea', kind: 'home' });
    expect(PROPERTIES.hoaxula_park).toMatchObject({ area: 'valea', kind: 'flip' });
    const maps = buildChapter9Maps();
    expect(maps.valea_stelelor.signs).toContainEqual(expect.objectContaining({ dialogue: 'sign_valea_cottage' }));
    expect(maps.castle_hoaxula.signs).toContainEqual(expect.objectContaining({ dialogue: 'sign_hoaxula_park' }));
    expect(DIALOGUE.sign_valea_cottage.join(' ')).toContain('BUNI\'S SPARE COTTAGE');
    expect(DIALOGUE.sign_hoaxula_park.join(' ')).toContain('HOAXULA PARK');
  });

  it('keeps travel and the unconditional chapter card truthful for either Pippa and optional Buni', () => {
    expect(DIALOGUE.bert_romania_ask.join(' ')).not.toMatch(/five tickets/i);
    expect(DIALOGUE.bert_romania_ask.join(' ')).toMatch(/ticket for every traveller/i);
    expect(DIALOGUE.ch9_card.join(' ')).not.toContain('Feast Basket');
  });
});
