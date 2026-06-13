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
 */
import Phaser from 'phaser';
import { INPUT } from '../engine/input';
import { AUDIO } from '../engine/audio';
import { GS } from '../engine/state';
import { makeWindow, DEPTH_UI } from '../ui/windows';
import { colorOf, RAMP, px } from '../palette';
import { SAMPLE_RECIPES, SAMPLE_IDS } from '../levelkit/samples';
import { generate, cityMetrics } from '../levelkit';
import type { Recipe, DraftMapDef } from '../schemas';
import type { MapDef, NpcDef } from '../data/maps';
import { MAPS } from '../data/maps';
import { DIALOGUE } from '../data/dialogue';

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
    this.add.rectangle(0, 0, 400, 225, colorOf(px(RAMP.NIGHT, 1))).setOrigin(0);
    makeWindow(this, 6, 4, 388, 24);
    this.title = this.add
      .bitmapText(200, 12, 'retro', '', 6)
      .setOrigin(0.5, 0)
      .setDepth(DEPTH_UI + 1)
      .setTint(colorOf(px(RAMP.GOLD, 3)));
    this.add
      .bitmapText(200, 214, 'retro', '</> recipe  ^v reroll seed  A walk  B title', 6)
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

  private line(y: number, text: string, ramp: number = RAMP.PAPER, shade: 0 | 1 | 2 | 3 = 3): Phaser.GameObjects.BitmapText {
    const t = this.add.bitmapText(20, y, 'retro', text, 6).setTint(colorOf(px(ramp, shade)));
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
    for (const s of draft.signs) D[s.dialogue] ??= ['@A reserved landmark. Hand-built at promotion.'];
    MAPS[draft.id] = this.adapt(draft);

    GS.reset(); // a fresh dev party so the overworld can build the player
    AUDIO.sfx('confirm');
    AUDIO.stopMusic();
    const gw = draft.grid[0].length;
    const gh = draft.grid.length;
    const inside = draft.interior === true;
    const x = (inside ? Math.floor(gw / 2) : Math.floor(gw / 2)) * 16 + 8;
    const y = (inside ? Math.floor(gh / 2) : gh - 4) * 16;
    this.scene.start('overworld', { mapId: draft.id, x, y, facing: 'up' });
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
