import Phaser from 'phaser';
import { INPUT } from '../engine/input';
import { AUDIO } from '../engine/audio';
import { GS, makeHeroState } from '../engine/state';
import { Dialogue } from '../ui/windows';
import { colorOf } from '../palette';
import { RAMP, px } from '../palette';
import { s, TILE_PX } from '../spritegen/scale';
import type { Facing } from '../spritegen';
import { MAPS, BRICKTON_BUS_SPAWN, OTTERBROOK_DEV_PREVIEW_SPAWN } from '../data/maps';
import {
  DUNAS_EAST_DEV_PREVIEW_SPAWN,
  DUNAS_WEST_DEV_PREVIEW_SPAWN,
  PUERTO_SOL_DEV_PREVIEW_SPAWN,
} from '../data/maps_ch2';
import { CH4_MAP_IDS, CH4_WORLD } from '../data/maps_ch4';
import { CH5_MAP_IDS, CH5_WORLD } from '../data/maps_ch5';

export const CH3_DEV_MAP_IDS = [
  'biplane_interior', 'foggybottom', 'kettle_taproom', 'kettle_snug',
  'foggy_moor', 'wintermoor_grounds', 'the_old_stones',
  'wintermoor_f1', 'wintermoor_f2', 'wintermoor_f3',
  'wintermoor_dorm', 'wintermoor_boiler',
] as const;

const CH3_DEV_MAP_SET: ReadonlySet<string> = new Set(CH3_DEV_MAP_IDS);
export type Chapter3DevState = 'arrival' | 'joined' | 'coolant' | 'postBoss' | 'complete';

export interface Chapter3DevProfile {
  state: Chapter3DevState;
  flags: readonly string[];
  embers: number;
  partyLevels: Readonly<Record<'rex' | 'faye' | 'milo', number | null>>;
}

export const CH4_DEV_MAP_IDS = CH4_MAP_IDS;
const CH4_DEV_MAP_SET: ReadonlySet<string> = new Set(CH4_DEV_MAP_IDS);
export type Chapter4DevState = 'arrival' | 'bridge' | 'bridgeCleared' | 'lilleby' | 'meltfallClosed' | 'meltfallOpen' | 'boss' | 'postBoss' | 'complete';

export interface Chapter4DevProfile {
  state: Chapter4DevState;
  flags: readonly string[];
  embers: number;
  items: readonly string[];
}

export function chapter4DevProfile(value: string | null): Chapter4DevProfile {
  const valid: readonly Chapter4DevState[] = ['arrival', 'bridge', 'bridgeCleared', 'lilleby', 'meltfallClosed', 'meltfallOpen', 'boss', 'postBoss', 'complete'];
  const state: Chapter4DevState = valid.includes(value as Chapter4DevState) ? value as Chapter4DevState : 'bridge';
  const flags = [
    'ember1', 'ember2', 'ember3', 'ch2_complete', 'ch3_arrived', 'ch3_complete',
    'milo_joined', 'repair_taught', 'milo_clicker', 'fleet_road',
    'awake_freeze_a', 'awake_mindwarp_a', 'thread_trust_open', 'mainframe_defeated', 'ch4_arrived',
  ];
  if (['bridgeCleared', 'lilleby', 'meltfallClosed', 'meltfallOpen', 'boss', 'postBoss', 'complete'].includes(state)) flags.push('moor_berry_cleared', 'ch4_moor_seen');
  if (['lilleby', 'meltfallClosed', 'meltfallOpen', 'boss', 'postBoss', 'complete'].includes(state)) flags.push('ch4_lilleby_seen');
  if (['meltfallClosed', 'meltfallOpen', 'boss', 'postBoss', 'complete'].includes(state)) flags.push('ch4_spine_seen');
  if (['meltfallOpen', 'boss', 'postBoss', 'complete'].includes(state)) flags.push('spine_meltfall_frozen', 'spine_firecracker_claimed');
  if (['postBoss', 'complete'].includes(state)) flags.push('whisperwig_defeated', 'awake_volt_a', 'ch4_whisperwig_seen');
  if (state === 'complete') flags.push('ember4', 'ch4_heartlight_seen', 'ch4_complete');
  return { state, flags, embers: state === 'complete' ? 4 : 3, items: ['meltfallOpen', 'boss', 'postBoss', 'complete'].includes(state) ? ['firecracker_string'] : [] };
}

export function chapter4DevSpawn(mapId: string, state: Chapter4DevState): { x: number; y: number; facing: Facing } {
  const tile = mapId === 'bootstep_moor' && (state === 'bridge' || state === 'bridgeCleared')
    ? { x: 57, y: 38, facing: 'right' as const }
    : mapId === 'lilleby'
      ? { x: 4, y: 29, facing: 'right' as const }
      : mapId === 'spine_shoulder'
        ? { x: 28, y: 25, facing: 'up' as const }
        : mapId === 'spine_ear'
          ? { x: 26, y: 28, facing: 'up' as const }
          : mapId === 'kvisthavn'
            ? { ...CH4_WORLD.kvisthavn.landing, facing: 'down' as const }
            : null;
  if (tile) {
    return { x: tile.x * TILE_PX + TILE_PX / 2, y: tile.y * TILE_PX + TILE_PX * 0.75, facing: tile.facing };
  }
  return chapter3DevSpawn(mapId);
}

export const CH5_DEV_MAP_IDS = CH5_MAP_IDS;
const CH5_DEV_MAP_SET: ReadonlySet<string> = new Set(CH5_DEV_MAP_IDS);
export type Chapter5DevState = 'arrival' | 'city' | 'procession' | 'hedgerow' | 'boss' | 'postBoss' | 'complete';

export interface Chapter5DevProfile {
  state: Chapter5DevState;
  flags: readonly string[];
  embers: number;
  keyItems: readonly string[];
  party: readonly ('rex' | 'faye' | 'milo' | 'pippa' | 'dorin')[];
}

export function chapter5DevProfile(value: string | null): Chapter5DevProfile {
  const valid: readonly Chapter5DevState[] = ['arrival', 'city', 'procession', 'hedgerow', 'boss', 'postBoss', 'complete'];
  const state: Chapter5DevState = valid.includes(value as Chapter5DevState) ? value as Chapter5DevState : 'city';
  const flags = [
    'ember1', 'ember2', 'ember3', 'ember4', 'ch2_complete', 'ch3_arrived', 'ch3_complete',
    'ch4_arrived', 'ch4_complete', 'milo_joined', 'repair_taught', 'milo_clicker', 'fleet_road',
    'awake_freeze_a', 'awake_mindwarp_a', 'awake_volt_a', 'thread_trust_open',
    'mainframe_defeated', 'whisperwig_defeated',
  ];
  if (state !== 'arrival') flags.push('ch5_arrived');
  if (['procession', 'hedgerow', 'boss', 'postBoss', 'complete'].includes(state)) {
    flags.push('big_little_lens_built');
  }
  if (['boss', 'postBoss', 'complete'].includes(state)) flags.push('hedgerow_lens_seen');
  if (state === 'postBoss' || state === 'complete') flags.push('whiskerzilla_defeated');
  if (state === 'complete') flags.push('ember5', 'pippa_joined', 'dorin_joined', 'ch5_complete');
  return {
    state,
    flags,
    embers: state === 'complete' ? 5 : 4,
    keyItems: [
      ...(['procession', 'hedgerow', 'boss', 'postBoss', 'complete'].includes(state) ? ['big_little_lens'] : []),
      ...(state === 'complete' ? ['royal_thimble'] : []),
    ],
    party: state === 'complete' ? ['rex', 'faye', 'milo', 'pippa', 'dorin'] : ['rex', 'faye', 'milo'],
  };
}

export function chapter5DevSpawn(mapId: string, state: Chapter5DevState): { x: number; y: number; facing: Facing } {
  const tile = mapId === 'minimus_major'
    ? { ...CH5_WORLD.minimusMajor.landing, facing: 'down' as const }
    : mapId === 'procession_way'
      ? { x: 7, y: 32, facing: 'right' as const }
      : mapId === 'the_hedgerow'
        ? { x: 44, y: 69, facing: 'up' as const }
        : mapId === 'ducal_crown'
          ? state === 'postBoss' || state === 'complete'
            ? { x: 26, y: 20, facing: 'up' as const }
            : { x: 26, y: 37, facing: 'up' as const }
          : null;
  if (!tile) return chapter3DevSpawn(mapId);
  return { x: tile.x * TILE_PX + TILE_PX / 2, y: tile.y * TILE_PX + TILE_PX * 0.75, facing: tile.facing };
}

/** A representative, deterministic Chapter 3 survey save. It includes the
 * two prior Heartlights and Mia's Freeze; post-join states also carry Jay's
 * First Borrow and enough real stats/PP to exercise PUPPET. */
export function chapter3DevProfile(value: string | null): Chapter3DevProfile {
  const state: Chapter3DevState = value === 'arrival' || value === 'coolant' || value === 'postBoss' || value === 'complete'
    ? value
    : 'joined';
  const flags = [
    'grin_defeated', 'ch2_complete', 'ch3_arrived',
    'ember1', 'ember2', 'awake_freeze_a',
  ];
  if (state !== 'arrival') {
    flags.push(
      'milo_joined', 'repair_taught', 'milo_clicker', 'fleet_road',
      'awake_mindwarp_a', 'thread_trust_open', 'wm_gate_open',
    );
  }
  if (state === 'coolant' || state === 'postBoss' || state === 'complete') flags.push('wm_coolant_frozen');
  if (state === 'postBoss' || state === 'complete') flags.push('wm_fogworks_solved', 'mainframe_defeated');
  if (state === 'complete') flags.push('ember3', 'ch3_complete');
  return {
    state,
    flags,
    embers: state === 'complete' ? 3 : 2,
    partyLevels: { rex: 16, faye: 14, milo: state === 'arrival' ? null : 16 },
  };
}

const LEGACY_DEV_MAPS: ReadonlySet<string> = new Set([
  'otterbrook', 'brickton', 'puerto_sol', 'jungle_1', 'jungle_2',
  'brickton_docks', 'boat_interior', 'grotto', 'valle_dorado', 'costa_estrella',
]);

export function optionalDevCoordinate(value: string | null): number {
  return value === null ? Number.NaN : Number(value);
}

/** Prefer a real inbound door destination, so dev boots stay valid when a map's
 * dimensions move. Falls back to the map centre; OverworldScene's body-safe
 * arrival clamp handles any authored prop that occupies that tile. */
export function chapter3DevSpawn(mapId: string): { x: number; y: number; facing: Facing } {
  const target = MAPS[mapId];
  const inBounds = (x: number, y: number): boolean =>
    !!target && x >= 0 && y >= 0 && x < target.grid[0].length * 16 && y < target.grid.length * 16;
  for (const map of Object.values(MAPS)) {
    for (const door of map.doors) {
      if (door.to === mapId && inBounds(door.tx, door.ty)) {
        return { x: s(door.tx), y: s(door.ty), facing: door.facing };
      }
    }
    for (const prop of map.props) {
      if (prop.door?.to === mapId && inBounds(prop.door.tx, prop.door.ty)) {
        return { x: s(prop.door.tx), y: s(prop.door.ty), facing: 'down' };
      }
    }
  }
  const map = target;
  const w = map?.grid[0]?.length ?? 2;
  const h = map?.grid.length ?? 2;
  return { x: Math.floor(w / 2) * TILE_PX + TILE_PX / 2, y: Math.floor(h / 2) * TILE_PX + TILE_PX * 0.75, facing: 'down' };
}

export class TitleScene extends Phaser.Scene {
  private pressText: Phaser.GameObjects.BitmapText | null = null;
  private menuOpen = false;
  private started = false;

  constructor() {
    super('title');
  }

  create(): void {
    this.menuOpen = false;
    this.started = false;
    if (import.meta.env.DEV) {
      const params = new URLSearchParams(window.location.search);
      const devMap = params.get('devMap');
      if (devMap && (LEGACY_DEV_MAPS.has(devMap) || CH3_DEV_MAP_SET.has(devMap) || CH4_DEV_MAP_SET.has(devMap) || CH5_DEV_MAP_SET.has(devMap))) {
        GS.reset();
        GS.setFlag('intro_done');
        GS.setFlag('op_fell');
        GS.setFlag('op_house');
        GS.setFlag('zapper_done');
        GS.setFlag('tick_defeated');
        GS.setFlag('chad_joined');
        const isChapter3 = CH3_DEV_MAP_SET.has(devMap);
        const isChapter4 = CH4_DEV_MAP_SET.has(devMap);
        const isChapter5 = CH5_DEV_MAP_SET.has(devMap);
        if (isChapter3) {
          // Default to a clean post-join/pre-boss survey state. `devState`
          // exposes the production before/after beats without console surgery:
          // arrival | joined (default) | coolant | postBoss | complete.
          const profile = chapter3DevProfile(params.get('devState'));
          profile.flags.forEach((flag) => GS.setFlag(flag));
          GS.data.embers = Math.max(profile.embers, GS.data.embers);
          GS.data.party = [
            makeHeroState('rex', profile.partyLevels.rex!, GS.data.heroNames.rex),
            makeHeroState('faye', profile.partyLevels.faye!, GS.data.heroNames.faye),
          ];
          if (profile.partyLevels.milo !== null) {
            GS.data.party.push(makeHeroState('milo', profile.partyLevels.milo, GS.data.heroNames.milo));
          }
        } else if (isChapter4) {
          const profile = chapter4DevProfile(params.get('devState'));
          profile.flags.forEach((flag) => GS.setFlag(flag));
          GS.data.embers = profile.embers;
          GS.data.party = [
            makeHeroState('rex', 22, GS.data.heroNames.rex),
            makeHeroState('faye', 22, GS.data.heroNames.faye),
            makeHeroState('milo', 22, GS.data.heroNames.milo),
          ];
          for (const item of profile.items) GS.addItem(item, 'milo');
        } else if (isChapter5) {
          const profile = chapter5DevProfile(params.get('devState'));
          profile.flags.forEach((flag) => GS.setFlag(flag));
          GS.data.embers = profile.embers;
          GS.data.party = profile.party.map((id) => makeHeroState(id, 26, GS.data.heroNames[id]));
          GS.data.keyItems.push(...profile.keyItems);
        }
        this.started = true;
        AUDIO.stopMusic();
        // EB polish rollout — per-map dev-boot spawns (handoff §5): each entry
        // lands mid-town with no pending story beat so screenshots are clean.
        let spawn =
          devMap === 'brickton'
            ? { x: BRICKTON_BUS_SPAWN.x / 16, y: BRICKTON_BUS_SPAWN.y / 16 }
            : devMap === 'puerto_sol'
              ? PUERTO_SOL_DEV_PREVIEW_SPAWN
              : devMap === 'jungle_1'
                ? DUNAS_WEST_DEV_PREVIEW_SPAWN
                : devMap === 'jungle_2'
                  ? DUNAS_EAST_DEV_PREVIEW_SPAWN
                  : devMap === 'brickton_docks'
                    ? { x: 20, y: 8 }
                    : devMap === 'boat_interior'
                      ? { x: 11, y: 7 }
                      : devMap === 'grotto'
                        ? { x: 14, y: 18 }
                        : devMap === 'valle_dorado'
                          ? { x: 49, y: 45 }
                          : devMap === 'costa_estrella'
                            ? { x: 13, y: 14 }
                  : OTTERBROOK_DEV_PREVIEW_SPAWN;
        const ch3Spawn = isChapter3 ? chapter3DevSpawn(devMap) : null;
        const ch4Profile = isChapter4 ? chapter4DevProfile(params.get('devState')) : null;
        const ch4Spawn = ch4Profile ? chapter4DevSpawn(devMap, ch4Profile.state) : null;
        const ch5Profile = isChapter5 ? chapter5DevProfile(params.get('devState')) : null;
        const ch5Spawn = ch5Profile ? chapter5DevSpawn(devMap, ch5Profile.state) : null;
        let spawnPx = ch5Spawn ?? ch4Spawn ?? (ch3Spawn
          ? { x: ch3Spawn.x, y: ch3Spawn.y, facing: ch3Spawn.facing }
          : { x: spawn.x * TILE_PX + TILE_PX / 2, y: spawn.y * TILE_PX, facing: 'down' as Facing });
        // Any rollout map can opt into an exact authored micro-scene without
        // adding another permanent title-menu entry. Values are tile coords;
        // invalid/missing values keep the clean map-specific default above.
        const devXRaw = params.get('devX');
        const devYRaw = params.get('devY');
        const devX = optionalDevCoordinate(devXRaw);
        const devY = optionalDevCoordinate(devYRaw);
        if (Number.isFinite(devX) && Number.isFinite(devY)) {
          spawn = { x: devX, y: devY };
          spawnPx = { x: devX * TILE_PX + TILE_PX / 2, y: devY * TILE_PX, facing: 'down' };
        }
        this.scene.start('overworld', {
          mapId: devMap,
          x: spawnPx.x,
          y: spawnPx.y,
          facing: spawnPx.facing,
          devFullMap: params.get('devFullMap') === '1',
        });
        return;
      }
    }
    const W = this.scale.width;
    this.add.image(0, 0, 'title_art').setOrigin(0, 0).setDisplaySize(this.scale.width, this.scale.height);
    const logo = this.add.image(W / 2, s(58), 'logo').setScale(0.78);
    this.tweens.add({ targets: logo, y: s(60), duration: 1800, yoyo: true, repeat: -1, ease: 'sine.inout' });
    this.titleText(W / 2, s(112), 'A small-town cosmic RPG', colorOf(px(RAMP.CYAN, 3)), 0.85);
    this.pressText = this.add
      .bitmapText(W / 2, s(151), 'retro', 'PRESS A / TAP TO BEGIN', s(6))
      .setOrigin(0.5, 0)
      .setTint(colorOf(px(RAMP.GOLD, 3)));
    this.time.addEvent({
      delay: 450,
      loop: true,
      callback: () => this.pressText?.setVisible(this.menuOpen ? true : !this.pressText.visible),
    });
    this.titleText(W / 2, s(212), 'v0.1 FUZZY PICKLES', colorOf(px(RAMP.CYAN, 2)), 0.7);

    // tap anywhere also works as A on the title
    this.input.on('pointerdown', () => {
      if (!this.menuOpen && !this.started) void this.openMenu();
    });
  }

  override update(): void {
    AUDIO.playMusic('title');
    if (!this.menuOpen && !this.started && INPUT.justPressed('A')) {
      void this.openMenu();
    }
  }

  private titleText(x: number, y: number, text: string, tint: number, alpha = 1): Phaser.GameObjects.BitmapText {
    // x/y already arrive runtime-scaled from create(); the +1 drop-shadow is a
    // native-px offset, so it scales here.
    this.add
      .bitmapText(x + s(1), y + s(1), 'retro', text, s(6))
      .setOrigin(0.5, 0)
      .setTint(colorOf(px(RAMP.NIGHT, 0)))
      .setAlpha(alpha);
    return this.add
      .bitmapText(x, y, 'retro', text, s(6))
      .setOrigin(0.5, 0)
      .setTint(tint)
      .setAlpha(alpha);
  }

  private async openMenu(): Promise<void> {
    if (this.menuOpen) return;
    this.menuOpen = true;
    AUDIO.unlock();
    AUDIO.sfx('confirm');
    const dlg = new Dialogue(this);
    const options = GS.anySave()
      ? ['Continue', 'New Game', 'Sprite Lab']
      : ['New Game', 'Sprite Lab'];
    // S13: the resort is COMPLETE AND STANDALONE ahead of Prompt 28 (the
    // Sprite Lab precedent) — dev builds reach it from the title
    if (import.meta.env.DEV) options.push('Otterbrooke (dev)');
    if (import.meta.env.DEV) options.push('Costa Estrella (dev)');
    // S15g: the LEVELKIT LAB walks generated drafts live (dev-only, the
    // Sprite Lab precedent — never a player flow)
    if (import.meta.env.DEV) options.push('Levelkit Lab (dev)');
    const pick = await dlg.ask(options);
    const choice = options[pick];
    if (choice === 'New Game') {
      GS.reset();
      this.startGame('nameentry'); // Prompt 21: name entry, then the 2AM intro
    } else if (choice === 'Continue') {
      // S6: the slot scene owns loading now (title theme keeps playing under it)
      this.started = true;
      this.scene.start('saveslots');
    } else if (choice === 'Otterbrooke (dev)') {
      GS.reset();
      GS.setFlag('intro_done');
      GS.setFlag('op_fell');
      GS.setFlag('op_house');
      GS.setFlag('zapper_done');
      GS.setFlag('tick_defeated');
      GS.setFlag('chad_joined');
      this.started = true;
      AUDIO.stopMusic();
      this.scene.start('overworld', {
        mapId: 'otterbrook',
        x: OTTERBROOK_DEV_PREVIEW_SPAWN.x * TILE_PX + TILE_PX / 2,
        y: OTTERBROOK_DEV_PREVIEW_SPAWN.y * TILE_PX,
        facing: 'down',
      });
    } else if (choice === 'Costa Estrella (dev)') {
      // a fresh dev party at the resort gate (never a saved game's state)
      GS.reset();
      this.started = true;
      AUDIO.stopMusic();
      // tile→pixel spawn (col 13 + half-tile, row 14) in runtime px
      this.scene.start('overworld', { mapId: 'costa_estrella', x: 13 * TILE_PX + TILE_PX / 2, y: 14 * TILE_PX, facing: 'up' });
    } else if (choice === 'Levelkit Lab (dev)') {
      this.started = true;
      AUDIO.stopMusic();
      this.scene.start('levelkitlab');
    } else {
      this.started = true;
      AUDIO.stopMusic();
      this.scene.start('spritelab');
    }
  }

  private startGame(target: 'nameentry'): void {
    this.started = true;
    // the title theme keeps playing under name entry; NameEntryScene stops it
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(target);
    });
  }
}
