/**
 * THE LEVELKIT LAB — walk a generated draft live (S15g, ADR-044; the Sprite
 * Lab precedent, ADR-002). Pick a recipe, read its ADR-012 metrics overlay,
 * reroll the seed in place, then WALK the draft with the real player /
 * collision / banner systems. Dev-only: reached from the title's DEV menu,
 * excluded from every player flow, and — like maps/dev/playground — its
 * drafts never enter the MAPS source, the canon manifests, or the §B4 sweep
 * (they are injected into the RUNTIME registry only, invisible to validate).
 *
 * BOT (S15g): cycle every SAMPLE recipe with </>, reroll seeds with ^v until
 * a city reads green (0 violations) and a town/route walks clean, A to walk,
 * and dump .shots of a town draft, a city draft, and a route draft.
 *
 * BOT (S15g Movement Two): the eight DUNGEON sites are in the cycle too. Page
 * to `laughing_ruins`, read "false loops: PROVEN (the floor is a tree)", press
 * A and WALK it — every passage that looks like a loop is a dead branch (BFS-
 * provable). Page to a dungeon, read "POST-CONDITIONS: SEALED" + the rest-
 * before-spike grace on the phone line, reroll ^v, walk it from the entrance.
 */
import Phaser from 'phaser';
import { INPUT } from '../engine/input';
import { AUDIO } from '../engine/audio';
import { GS } from '../engine/state';
import { makeWindow, DEPTH_UI } from '../ui/windows';
import { colorOf, RAMP, px } from '../palette';
import { SAMPLE_RECIPES, SAMPLE_IDS } from '../levelkit/samples';
import { generate, cityMetrics, pressureReport, dungeonFlags, floorIsTree } from '../levelkit';
import { isDungeonSolid, silenceCurve } from '../levelkit/dungeons';
import type { Recipe, DraftMapDef, Facing } from '../schemas';
import type { MapDef, NpcDef } from '../data/maps';
import { MAPS } from '../data/maps';
import { ENEMIES } from '../data/enemies';
import { FORGED_ENEMIES, stripForgeTags } from '../levelkit/forge/registry';
import { ensureForgedFaces } from '../spritegen';
import { DIALOGUE } from '../data/dialogue';
import { s, TILE_PX } from '../spritegen/scale';

export class LevelkitLabScene extends Phaser.Scene {
  private idx = 0;
  private seed = 0;
  private title!: Phaser.GameObjects.BitmapText;
  private content: Phaser.GameObjects.GameObject[] = [];
  private navAt = 0;

  constructor() {
    super('levelkitlab');
  }

  create(): void {
    this.idx = 0;
    this.seed = SAMPLE_RECIPES[SAMPLE_IDS[0]].seed;
    this.add.rectangle(0, 0, this.scale.width, this.scale.height, colorOf(px(RAMP.NIGHT, 1))).setOrigin(0);
    makeWindow(this, s(6), s(4), s(388), s(24));
    this.title = this.add
      .bitmapText(s(200), s(12), 'retro', '', s(6))
      .setOrigin(0.5, 0)
      .setDepth(DEPTH_UI + 1)
      .setTint(colorOf(px(RAMP.GOLD, 3)));
    this.add
      .bitmapText(s(200), s(214), 'retro', '</> recipe  ^v reroll seed  A walk  B title', s(6))
      .setOrigin(0.5, 0)
      .setTint(colorOf(px(RAMP.NIGHT, 3)));
    this.show();
  }

  private clear(): void {
    this.content.forEach((o) => o.destroy());
    this.content = [];
  }

  /** the current recipe at the current (rerolled) seed */
  private recipe(): Recipe {
    return { ...SAMPLE_RECIPES[SAMPLE_IDS[this.idx]], seed: this.seed } as Recipe;
  }

  /** y arrives in NATIVE px (the show() ladder stays native for readability);
   *  the x indent, y, and font size are scaled to runtime here. */
  private line(y: number, text: string, ramp: number = RAMP.PAPER, shade: 0 | 1 | 2 | 3 = 3): Phaser.GameObjects.BitmapText {
    const t = this.add.bitmapText(s(20), s(y), 'retro', text, s(6)).setTint(colorOf(px(ramp, shade)));
    this.content.push(t);
    return t;
  }

  private show(): void {
    this.clear();
    const r = this.recipe();
    const draft = generate(r);
    this.title.setText(`LEVELKIT LAB — ${SAMPLE_IDS[this.idx]}  (seed ${this.seed})`);

    const gw = draft.grid[0].length;
    const gh = draft.grid.length;
    let y = 40;
    this.line(y, `kind ${r.kind}   id ${draft.id}`, RAMP.GOLD); y += 14;
    this.line(y, `grid ${gw} x ${gh}   props ${draft.props.length}   npcs ${draft.npcs.length}`); y += 12;
    this.line(y, `signs ${draft.signs.length}   doors ${draft.doors.length}   spawners ${draft.spawners.length}`); y += 12;
    this.line(y, `phones ${draft.phones.length}   atms ${draft.atms?.length ?? 0}   picnic ${draft.props.filter((p) => p.sprite === 'picnic').length}`); y += 16;

    if (draft.settlement === 'city') {
      const m = cityMetrics(draft);
      this.line(y, '-- ADR-012 read --', RAMP.CYAN); y += 12;
      this.line(y, `street rows ${m.streetRows}   avenue joins ${m.avenueJoins}`); y += 12;
      this.line(y, `block faces ${m.blockFaces}   negative space ${m.negativeSpacePct}%`); y += 12;
      const ok = m.violations.length === 0;
      this.line(y, ok ? 'SWEEP: PASS (no exemptions)' : `SWEEP: ${m.violations.length} VIOLATION(S)`, ok ? RAMP.GRASS : RAMP.RED); y += 12;
      for (const v of m.violations) { this.line(y, ` ${v}`, RAMP.RED, 2); y += 10; }
    } else if (r.kind === 'dungeon') {
      const flags = dungeonFlags(draft, isDungeonSolid);
      const pr = pressureReport(draft, isDungeonSolid);
      const sealed = flags.length === 0;
      this.line(y, '-- DUNGEON read (Movement Two) --', RAMP.CYAN); y += 12;
      this.line(y, sealed ? 'POST-CONDITIONS: SEALED (entrance->exit, boss, rest)' : `SOFT-LOCK: ${flags.length}`, sealed ? RAMP.GRASS : RAMP.RED); y += 12;
      for (const f of flags) { this.line(y, ` ${f}`, RAMP.RED, 2); y += 10; }
      this.line(y, `density ${pr.density}/screen   grace ${pr.gracePx}px   prox ${pr.proximityPx}px`); y += 12;
      this.line(y, `rest exposure ${pr.restExposurePx}px   touches ${pr.unavoidableTouches}   side ${pr.sidePaths}`); y += 12;
      if (r.site === 'laughing_ruins') {
        const tree = floorIsTree(draft.grid, isDungeonSolid);
        this.line(y, `false loops: ${tree ? 'PROVEN (the floor is a tree — no real loop)' : 'BROKEN'}`, tree ? RAMP.GOLD : RAMP.RED); y += 12;
      }
      if (r.site === 'sea_of_silence') { this.line(y, `emptiness curve ${silenceCurve(draft).join(' > ')}`, RAMP.GOLD); y += 12; }
    } else {
      this.line(y, `settlement ${draft.settlement ?? '(route/interior/travel)'}`, RAMP.CYAN); y += 12;
    }
  }

  /** inject the draft into the RUNTIME registry and walk it (never the source) */
  private walk(): void {
    const draft = generate(this.recipe());
    // a dev dialogue so role-tagged slots + reserved signs render and talk
    const D = DIALOGUE as Record<string, string[]>;
    D.lk_slot ??= ['@A reserved slot.', '@The tone editor writes this at promotion.'];
    for (const sn of draft.signs) D[sn.dialogue] ??= ['@A reserved landmark. Hand-built at promotion.'];
    MAPS[draft.id] = this.adapt(draft);

    // inject the forged Ch.3–10 roster into the RUNTIME ENEMIES — tags stripped
    // to the canon EnemyDef shape — exactly the way the map draft goes into MAPS
    // above. So a walked dungeon fights real forged foes. The shipped ENEMIES
    // SOURCE is never touched (Prime Law 1).
    for (const [id, def] of Object.entries(FORGED_ENEMIES)) ENEMIES[id] = stripForgeTags(def);
    // S15g 3b: register the COMPOSED faces of picked grunts (3 wear tiers + mini)
    // so a fight resolves the real face through partsSpec and wears it down.
    // Unpicked drafts keep their borrowed placeholder sprite (no-op here).
    ensureForgedFaces(this, Object.values(FORGED_ENEMIES));

    GS.reset(); // a fresh dev party so the overworld can build the player
    AUDIO.sfx('confirm');
    AUDIO.stopMusic();
    const spawn = this.spawnAt(draft);
    this.scene.start('overworld', { mapId: draft.id, x: spawn.x, y: spawn.y, facing: spawn.facing });
  }

  /** where to drop the player: a carved dungeon's CENTRE is a wall, so spawn
   *  drafts that have spawners at their entrance door (doors[0]), facing in */
  private spawnAt(draft: DraftMapDef): { x: number; y: number; facing: Facing } {
    const gw = draft.grid[0].length;
    const gh = draft.grid.length;
    const door = draft.doors[0];
    if (door && draft.spawners.length > 0) {
      const cx = Math.floor(door.x + door.w / 2);
      const cy = Math.floor(door.y + door.h / 2);
      const step: Record<Facing, [number, number]> = { up: [0, 1], down: [0, -1], left: [1, 0], right: [-1, 0] };
      const into: Record<Facing, Facing> = { up: 'down', down: 'up', left: 'right', right: 'left' };
      const [dx, dy] = step[door.facing];
      // grid coords (cx,cy,dx,dy) are tile UNITS; convert to runtime px and centre
      // in the tile. The spawn goes to overworld as world px, so it must be ×ART_SCALE.
      return { x: (cx + dx) * TILE_PX + TILE_PX / 2, y: (cy + dy) * TILE_PX + TILE_PX / 2, facing: into[door.facing] };
    }
    const inside = draft.interior === true;
    return { x: Math.floor(gw / 2) * TILE_PX + TILE_PX / 2, y: (inside ? Math.floor(gh / 2) : gh - 4) * TILE_PX, facing: 'up' };
  }

  /** DraftMapDef → MapDef: drop role tags, give slots the dev dialogue */
  private adapt(draft: DraftMapDef): MapDef {
    const npcs: NpcDef[] = draft.npcs.map((n) => {
      const { role: _role, ...rest } = n;
      void _role;
      return { ...rest, dialogue: n.dialogue ?? 'lk_slot' };
    });
    return { ...draft, npcs };
  }

  private navOk(): boolean {
    if (this.time.now > this.navAt) {
      this.navAt = this.time.now + 200;
      return true;
    }
    return false;
  }

  override update(): void {
    const d = INPUT.dir();
    if (INPUT.justPressed('B')) {
      AUDIO.sfx('cancel');
      this.scene.start('title');
      return;
    }
    if (INPUT.justPressed('A')) {
      this.walk();
      return;
    }
    if (d.x !== 0 && this.navOk()) {
      this.idx = (this.idx + (d.x > 0 ? 1 : SAMPLE_IDS.length - 1)) % SAMPLE_IDS.length;
      this.seed = SAMPLE_RECIPES[SAMPLE_IDS[this.idx]].seed;
      AUDIO.sfx('cursor');
      this.show();
      return;
    }
    if (d.y !== 0 && this.navOk()) {
      this.seed = (this.seed + (d.y > 0 ? 1 : -1)) | 0;
      AUDIO.sfx('cursor');
      this.show();
    }
  }
}
