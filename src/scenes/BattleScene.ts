/**
 * BattleScene — first-person EB layout (GAME_BIBLE Prompt 12/13/14):
 * enemy sprites on an animated psychedelic background, party status strip
 * with ROLLING ODOMETER HP/PP drums, speed-ordered rounds, data-driven enemy
 * AI, the Titanic Tick's latch/drain/salt gimmick, Chad the useless guest,
 * Glint's assist, victory EXP/level-ups, defeat, and run-away.
 */
import Phaser from 'phaser';
import { ENEMIES, introLine, type EnemyDef, type EnemyMove } from '../data/enemies';
import { ABILITIES, rollPray, PRAY_TEXT } from '../data/abilities';
import { ITEMS } from '../data/items';
import { BATTLE_TEXT, DIALOGUE } from '../data/dialogue';
import { GS, expForLevel, type HeroState } from '../engine/state';
import { statsAtLevel, maxHpAtLevel, maxPpAtLevel, unlockedAbilities, HEROES } from '../data/heroes';
import { INPUT } from '../engine/input';
import { AUDIO } from '../engine/audio';
import { Odometer } from '../battle/odometer';
import {
  physicalDamage,
  smashChance,
  smashDamage,
  vibeDamage,
  vibeHeal,
  applyWeakness,
  gutsSurvive,
  runChance,
  expShare,
  heroOffense,
} from '../battle/formulas';
import { Dialogue, makeWindow, makeBox, DEPTH_UI } from '../ui/windows';
import { colorOf, rgbOf, RAMP, px } from '../palette';
import { ODO_CELL_W, ODO_CELL_H } from '../spritegen/ui';

interface BattleConfig {
  enemyIds: string[];
  advantage: 'player' | 'enemy' | 'none';
  guestChad: boolean;
  glintAssist: boolean;
  boss: boolean;
  /** S2: the Manager fight teaches Faye's first Pray with a one-time hint */
  prayTutorial?: boolean;
}

interface EnemyUnit {
  def: EnemyDef;
  letter: string;
  hp: number;
  spr: Phaser.GameObjects.Image;
  alive: boolean;
}

interface HeroUnit {
  hero: HeroState;
  odoHp: Odometer;
  odoPp: Odometer;
  box: Phaser.GameObjects.NineSlice;
  defending: boolean;
  sunburn: number;
  /** rounds of the Smilers' "productive" debuff (offense down — §A7) */
  productive: number;
  latched: boolean;
}

class OdoDisplay {
  private strips: Phaser.GameObjects.Image[] = [];
  private slotY: number;
  constructor(scene: Phaser.Scene, x: number, y: number, places: number) {
    this.slotY = y;
    const g = scene.add.graphics().setScrollFactor(0);
    for (let i = 0; i < places; i++) {
      g.fillStyle(0xffffff).fillRect(x + i * (ODO_CELL_W + 1), y, ODO_CELL_W, ODO_CELL_H);
    }
    g.setVisible(false);
    const mask = g.createGeometryMask();
    for (let i = 0; i < places; i++) {
      const img = scene.add
        .image(x + i * (ODO_CELL_W + 1), y, 'odo')
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(DEPTH_UI + 2);
      img.setMask(mask);
      this.strips.push(img);
    }
  }
  setValue(v: number): void {
    const places = this.strips.length;
    for (let i = 0; i < places; i++) {
      const p = Math.pow(10, places - 1 - i);
      let pos: number;
      if (p === 1) {
        pos = v % 10;
      } else {
        const lower = v % p;
        pos = (Math.floor(v / p) % 10) + Math.max(0, lower / (p / 10) - 9);
      }
      this.strips[i].y = this.slotY - pos * ODO_CELL_H;
    }
  }
  setTint(color: number): void {
    this.strips.forEach((s) => s.setTint(color));
  }
  clearTint(): void {
    this.strips.forEach((s) => s.clearTint());
  }
  destroy(): void {
    this.strips.forEach((s) => s.destroy());
    this.strips = [];
  }
}

const PLASMA_FRAG = `
precision mediump float;
uniform float time;
uniform vec2 resolution;
uniform vec3 colA;
uniform vec3 colB;
void main(){
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  float t = time * 0.55;
  float v = sin(uv.x*7.0 + t) + sin(uv.y*5.0 - t*1.3)
          + sin((uv.x+uv.y)*6.0 + t*0.7) + sin(length(uv-0.5)*14.0 - t*1.1);
  v = v*0.25 + 0.5;
  float band = floor(v*7.0)/7.0;
  vec3 col = mix(colA, colB, band);
  gl_FragColor = vec4(col, 1.0);
}`;

export class BattleScene extends Phaser.Scene {
  private cfg!: BattleConfig;
  private enemies: EnemyUnit[] = [];
  private heroes: HeroUnit[] = [];
  private chad: {
    hp: Odometer;
    box: Phaser.GameObjects.NineSlice | null;
    texts: Phaser.GameObjects.BitmapText[];
    fled: boolean;
  } | null = null;
  private dlg!: Dialogue;
  private textObj!: Phaser.GameObjects.BitmapText;
  private odoDisplays: Array<{ d: OdoDisplay; o: Odometer }> = [];
  private chadOdo: OdoDisplay | null = null;
  private ended = false;
  private tickAcc = 0;
  private prayHintShown = false;

  constructor() {
    super('battle');
  }

  init(data: BattleConfig): void {
    this.cfg = data;
    this.enemies = [];
    this.heroes = [];
    this.odoDisplays = [];
    this.chad = null;
    this.chadOdo = null;
    this.ended = false;
    this.prayHintShown = false;
  }

  create(): void {
    this.dlg = new Dialogue(this);
    this.buildBackground();
    this.buildEnemies();
    this.buildParty();
    this.buildTextWindow();
    AUDIO.playMusic(this.cfg.boss ? 'boss' : 'battle');
    this.cameras.main.fadeIn(250, 0, 0, 0);
    void this.run();
  }

  private buildBackground(): void {
    const first = ENEMIES[this.cfg.enemyIds[0]];
    const [ra, rb] = first.bg;
    if (this.game.renderer.type === Phaser.WEBGL) {
      const [ar, ag, ab] = rgbOf(px(ra, 1));
      const [br, bg, bb] = rgbOf(px(rb, 0));
      const base = new Phaser.Display.BaseShader('mf-plasma', PLASMA_FRAG, undefined, {
        colA: { type: '3f', value: { x: ar, y: ag, z: ab } },
        colB: { type: '3f', value: { x: br, y: bg, z: bb } },
      });
      this.add.shader(base, this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height);
    } else {
      const r = this.add
        .rectangle(0, 0, this.scale.width, this.scale.height, colorOf(px(ra, 1)))
        .setOrigin(0);
      this.tweens.add({ targets: r, alpha: { from: 1, to: 0.7 }, duration: 1400, yoyo: true, repeat: -1 });
    }
  }

  private buildEnemies(): void {
    const ids = this.cfg.enemyIds;
    const letters = ['A', 'B', 'C', 'D'];
    const dupes = new Map<string, number>();
    ids.forEach((id) => dupes.set(id, (dupes.get(id) ?? 0) + 1));
    ids.forEach((id, i) => {
      const def = ENEMIES[id];
      const x = (this.scale.width / (ids.length + 1)) * (i + 1);
      const y = def.boss ? 86 : 92;
      const spr = this.add.image(x, y, def.sprite).setOrigin(0.5, 0.5);
      this.tweens.add({
        targets: spr,
        y: y - 3,
        duration: 1100 + i * 130,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inout',
      });
      const letter = (dupes.get(id) ?? 0) > 1 ? letters[i] : '';
      this.enemies.push({ def, letter, hp: def.hp, spr, alive: true });
    });
  }

  private buildParty(): void {
    const party = GS.aliveParty();
    const slots = party.length + (this.cfg.guestChad ? 1 : 0);
    const boxW = 96;
    const totalW = slots * (boxW + 6) - 6;
    let bx = (this.scale.width - totalW) / 2;
    for (const hero of party) {
      const box = makeBox(this, bx, 168, boxW, 50);
      this.add
        .bitmapText(bx + 8, 173, 'retro', hero.name, 6)
        .setScrollFactor(0)
        .setDepth(DEPTH_UI + 1)
        .setTint(colorOf(px(RAMP.INK, 0)));
      this.add
        .bitmapText(bx + 8, 186, 'retro', 'HP', 6)
        .setScrollFactor(0)
        .setDepth(DEPTH_UI + 1)
        .setTint(colorOf(px(RAMP.INK, 1)));
      this.add
        .bitmapText(bx + 8, 201, 'retro', 'PP', 6)
        .setScrollFactor(0)
        .setDepth(DEPTH_UI + 1)
        .setTint(colorOf(px(RAMP.INK, 1)));
      const odoHp = new Odometer(hero.hp, hero.maxHp);
      const odoPp = new Odometer(hero.pp, hero.maxPp);
      const dHp = new OdoDisplay(this, bx + 28, 185, 3);
      const dPp = new OdoDisplay(this, bx + 37, 200, 2);
      dHp.setValue(hero.hp);
      dPp.setValue(hero.pp);
      this.odoDisplays.push({ d: dHp, o: odoHp }, { d: dPp, o: odoPp });
      this.heroes.push({ hero, odoHp, odoPp, box, defending: false, sunburn: 0, productive: 0, latched: false });
      bx += boxW + 6;
    }
    if (this.cfg.guestChad) {
      const box = makeBox(this, bx, 168, boxW, 50);
      const t1 = this.add
        .bitmapText(bx + 8, 173, 'retro', 'Chad', 6)
        .setScrollFactor(0)
        .setDepth(DEPTH_UI + 1)
        .setTint(colorOf(px(RAMP.INK, 0)));
      const t2 = this.add
        .bitmapText(bx + 8, 186, 'retro', 'HP', 6)
        .setScrollFactor(0)
        .setDepth(DEPTH_UI + 1)
        .setTint(colorOf(px(RAMP.INK, 1)));
      const hp = new Odometer(35, 35);
      this.chadOdo = new OdoDisplay(this, bx + 28, 185, 3);
      this.chadOdo.setValue(35);
      this.chad = { hp, box, texts: [t1, t2], fled: false };
    }
  }

  private buildTextWindow(): void {
    makeWindow(this, 6, 6, 268, 56);
    this.textObj = this.add
      .bitmapText(16, 14, 'retro', '', 6)
      .setScrollFactor(0)
      .setDepth(DEPTH_UI + 1)
      .setMaxWidth(248);
  }

  /* ---------------- text helpers ---------------- */

  private print(raw: string): Promise<void> {
    const text = raw;
    return new Promise((resolve) => {
      this.textObj.setText('');
      let i = 0;
      let acc = 0;
      let linger = 26; // frames the finished line stays up; A/B skips
      const ev = this.time.addEvent({
        delay: 16,
        loop: true,
        callback: () => {
          const fast = INPUT.held('A') || INPUT.held('B');
          acc += fast ? 4 : 1.8;
          while (acc >= 1 && i < text.length) {
            acc -= 1;
            i++;
          }
          this.textObj.setText(text.slice(0, i));
          if (i % 4 === 0 && i < text.length) AUDIO.sfx('text');
          if (i >= text.length) {
            linger -= fast ? 4 : 1;
            if (linger <= 0) {
              ev.remove();
              resolve();
            }
          }
        },
      });
    });
  }

  private fill(template: string, user: string, e?: EnemyUnit, t?: string): string {
    return template
      .replaceAll('{user}', user)
      .replaceAll('{e}', e ? `${e.def.article} ${e.def.name} ${e.letter}`.trimEnd() : '')
      .replaceAll('{t}', t ?? '');
  }

  /* ---------------- main flow ---------------- */

  private async run(): Promise<void> {
    await this.print(introLine(this.cfg.enemyIds));
    if (this.cfg.advantage === 'player') await this.print('You caught it off guard! You move first!');
    if (this.cfg.advantage === 'enemy') await this.print('It snuck up on you!');

    if (this.cfg.advantage === 'enemy') await this.enemyPhase();

    while (!this.ended) {
      // ----- player commands
      for (const h of this.heroes) {
        if (this.ended) break;
        if (h.odoHp.dead || h.hero.down) continue;
        h.defending = false;
        const acted = await this.heroCommand(h);
        if (!acted) break; // ran away
      }
      if (this.ended) return;
      // ----- chad "helps"
      await this.chadPhase();
      if (this.ended) return;
      // ----- enemies
      await this.enemyPhase();
      if (this.ended) return;
      // ----- glint assist
      if (this.cfg.glintAssist) await this.glintPhase();
      if (this.ended) return;
      // ----- end-of-round status ticks
      await this.statusPhase();
      if (this.ended) return;
    }
  }

  private async heroCommand(h: HeroUnit): Promise<boolean> {
    const name = h.hero.name;
    // Prompt 12: the command row is per-hero — Pray surfaces for whoever has it
    const hasPray = unlockedAbilities(h.hero.id, h.hero.level).includes('pray');
    if (hasPray && this.cfg.prayTutorial && !this.prayHintShown) {
      this.prayHintShown = true;
      await this.print(this.fill(BATTLE_TEXT.pray_hint, name));
    }
    for (;;) {
      const options = ['Bash', 'Vibe'];
      if (hasPray) options.push('Pray');
      options.push('Goods', 'Defend');
      if (!this.cfg.boss) options.push('Run');
      const pick = await this.dlg.ask(options);
      if (options[pick] === 'Pray') {
        await this.prayAction(h);
        return true;
      }
      if (options[pick] === 'Bash') {
        const target = await this.pickEnemy();
        if (!target) continue;
        await this.heroBash(h, target);
        return true;
      }
      if (options[pick] === 'Vibe') {
        const ok = await this.heroVibe(h);
        if (ok) return true;
        continue;
      }
      if (options[pick] === 'Goods') {
        const ok = await this.heroGoods(h);
        if (ok) return true;
        continue;
      }
      if (options[pick] === 'Defend') {
        h.defending = true;
        await this.print(this.fill(BATTLE_TEXT.guard, name));
        return true;
      }
      if (options[pick] === 'Run') {
        const maxSpd = Math.max(...this.enemies.filter((e) => e.alive).map((e) => e.def.speed));
        if (Math.random() < runChance(h.hero.stats.speed, maxSpd)) {
          await this.print(BATTLE_TEXT.run_ok);
          this.finish('ran');
          return false;
        }
        await this.print(BATTLE_TEXT.run_fail);
        return true;
      }
    }
  }

  private pickEnemy(): Promise<EnemyUnit | null> {
    const alive = this.enemies.filter((e) => e.alive);
    if (alive.length === 1) return Promise.resolve(alive[0]);
    return new Promise((resolve) => {
      let sel = 0;
      const hand = this.add
        .image(alive[0].spr.x, alive[0].spr.y - alive[0].spr.height / 2 - 8, 'hand')
        .setDepth(DEPTH_UI + 3)
        .setAngle(90);
      const zones = alive.map((e, i) => {
        e.spr.setInteractive();
        const onTap = (): void => {
          sel = i;
          done(e);
        };
        e.spr.on('pointerdown', onTap);
        return { e, onTap };
      });
      const poll = this.time.addEvent({
        delay: 16,
        loop: true,
        callback: () => {
          const d = INPUT.dir();
          if (d.x !== 0 && this.navOk()) {
            sel = (sel + (d.x > 0 ? 1 : alive.length - 1)) % alive.length;
            AUDIO.sfx('cursor');
          }
          hand.setPosition(alive[sel].spr.x, alive[sel].spr.y - alive[sel].spr.height / 2 - 8);
          if (INPUT.justPressed('A')) done(alive[sel]);
          if (INPUT.justPressed('B')) done(null);
        },
      });
      const done = (e: EnemyUnit | null): void => {
        AUDIO.sfx(e ? 'confirm' : 'cancel');
        poll.remove();
        hand.destroy();
        zones.forEach((z) => z.e.spr.off('pointerdown', z.onTap));
        resolve(e);
      };
    });
  }

  private navAt = 0;
  private navOk(): boolean {
    if (this.time.now > this.navAt) {
      this.navAt = this.time.now + 190;
      return true;
    }
    return false;
  }

  private async heroBash(h: HeroUnit, target: EnemyUnit): Promise<void> {
    const name = h.hero.name;
    await this.print(this.fill(BATTLE_TEXT.bash, name));
    const guts = h.hero.stats.guts;
    let dmg: number;
    if (Math.random() < smashChance(guts)) {
      dmg = smashDamage(this.heroOffense(h), target.def.defense, Math.random);
      AUDIO.sfx('smash');
      this.cameras.main.shake(180, 0.012);
      const sm = this.add
        .bitmapText(this.scale.width / 2, 70, 'retro', BATTLE_TEXT.smaaash, 6)
        .setOrigin(0.5)
        .setScale(2)
        .setDepth(DEPTH_UI + 4)
        .setTint(colorOf(px(RAMP.GOLD, 3)));
      this.time.delayedCall(700, () => sm.destroy());
    } else {
      dmg = physicalDamage(this.heroOffense(h), target.def.defense, Math.random);
      AUDIO.sfx('hit');
    }
    await this.damageEnemy(target, dmg);
  }

  /** S3: each hero swings THEIR equipped weapon (was: first weapon in the
   *  shared bag, applied to everyone) */
  private heroOffense(h: HeroUnit): number {
    const base = heroOffense(h.hero);
    // feeling PRODUCTIVE: your heart isn't in the swing (§A7 Smiler debuff)
    return h.productive > 0 ? Math.max(1, Math.floor(base * 0.75)) : base;
  }

  private async heroVibe(h: HeroUnit): Promise<boolean> {
    const ids = unlockedAbilities(h.hero.id, h.hero.level).filter((id) => {
      const a = ABILITIES[id];
      // pray lives on the command row, not in the Vibe list (Prompt 12)
      return a && a.kind !== 'gadget' && a.kind !== 'pray' && a.power >= 0 && a.id !== 'teleport_a';
    });
    if (ids.length === 0) {
      await this.print(`${h.hero.name} searched for the old light... not yet.`);
      return false;
    }
    const labels = ids.map((id) => `${ABILITIES[id].name}  ${ABILITIES[id].pp}pp`);
    const pick = await this.dlg.ask([...labels, 'Back'], { cancelIndex: labels.length });
    if (pick >= labels.length) return false;
    const ab = ABILITIES[ids[pick]];
    if (h.odoPp.target < ab.pp) {
      await this.print('Not enough PP!');
      return false;
    }
    h.odoPp.damage(ab.pp);
    const name = h.hero.name;
    if (ab.heal) {
      await this.print(this.fill(ab.text, name));
      const amount = vibeHeal(ab.power, h.hero.stats.vibe, Math.random);
      h.odoHp.heal(amount);
      AUDIO.sfx('heal');
      await this.print(`${name} recovered about ${amount} HP!`);
      return true;
    }
    // damage vibes
    let targets: EnemyUnit[];
    if (ab.target === 'enemies') {
      targets = this.enemies.filter((e) => e.alive);
      await this.print(this.fill(ab.text, name));
    } else {
      const t = await this.pickEnemy();
      if (!t) {
        h.odoPp.heal(ab.pp); // refund
        return false;
      }
      targets = [t];
      await this.print(this.fill(ab.text, name));
    }
    for (const t of targets) {
      if (!t.alive) continue;
      const weak =
        (ab.element === 'fire' && t.def.weakness.includes('fire')) ||
        (ab.element === 'freeze' && t.def.weakness.includes('freeze')) ||
        (ab.element === 'volt' && t.def.weakness.includes('volt'));
      const dmg = applyWeakness(vibeDamage(ab.power, h.hero.stats.vibe, Math.random), weak);
      AUDIO.sfx('hit');
      // Vibe Fire breaks the Tick's latch (§A6 Boss 1)
      if (ab.element === 'fire' && t.def.boss) this.breakLatch();
      await this.damageEnemy(t, dmg, weak);
    }
    return true;
  }

  private async prayAction(h: HeroUnit): Promise<void> {
    AUDIO.sfx('pray');
    await this.print(this.fill(ABILITIES.pray.text, h.hero.name));
    const tier = rollPray(h.hero.level, h.hero.stats.guts, Math.random);
    await this.print(this.fill(PRAY_TEXT[tier], h.hero.name));
    const aliveE = this.enemies.filter((e) => e.alive);
    // grace reaches the standing; revival stays with hospitals & rare items (§A4.7)
    const standing = this.aliveHeroes();
    switch (tier) {
      case 'miraculous':
        standing.forEach((x) => {
          x.odoHp.heal(x.hero.maxHp);
          x.odoPp.heal(x.hero.maxPp);
        });
        for (const e of aliveE) await this.damageEnemy(e, 120 + Math.floor(Math.random() * 40));
        break;
      case 'wonderful': {
        const hurt = standing.some((x) => x.odoHp.value < x.hero.maxHp * 0.5);
        if (hurt) standing.forEach((x) => x.odoHp.heal(Math.floor(x.hero.maxHp * 0.6)));
        else for (const e of aliveE) await this.damageEnemy(e, 60 + Math.floor(Math.random() * 30));
        AUDIO.sfx('heal');
        break;
      }
      case 'good':
        standing.forEach((x) => x.odoHp.heal(30));
        AUDIO.sfx('heal');
        break;
      case 'nothing':
        break;
      case 'strange': {
        const coin = Math.random() < 0.5 && aliveE.length > 0;
        if (coin) await this.damageEnemy(aliveE[0], 25);
        else {
          const v = standing[Math.floor(Math.random() * standing.length)];
          v.sunburn = 3;
          await this.print(`${v.hero.name} feels weirdly sun-kissed. At night. Strange.`);
        }
        break;
      }
      case 'backfire':
        standing.forEach((x) => x.odoHp.damage(6));
        await this.print('Everyone saw spots for a second!');
        break;
    }
  }

  private async heroGoods(h: HeroUnit): Promise<boolean> {
    // S3: Goods is the acting hero's OWN 14-slot bag (Prompt 19)
    const usable = h.hero.bag.filter((id) => ITEMS[id]?.usableInBattle);
    if (usable.length === 0) {
      await this.print(`${h.hero.name}'s bag offers nothing but moral support.`);
      return false;
    }
    const names = usable.map((id) => ITEMS[id].name);
    const pick = await this.dlg.ask([...names, 'Back'], { cancelIndex: names.length });
    if (pick >= names.length) return false;
    const itemId = usable[pick];
    const item = ITEMS[itemId];
    const name = h.hero.name;
    if (item.kind === 'food' && item.heal) {
      GS.removeItem(itemId, h.hero.id);
      h.odoHp.heal(item.heal);
      AUDIO.sfx('heal');
      await this.print(`${name} wolfed down the ${item.name}! About ${item.heal} HP came back.`);
      return true;
    }
    if (item.id === 'glints_spark') {
      GS.removeItem(itemId, h.hero.id);
      AUDIO.sfx('ember');
      // §A8: revive, rare — it goes to whoever needs it most
      const downed = this.heroes.find((x) => x.hero.down || x.odoHp.dead);
      if (downed) {
        downed.hero.down = false;
        downed.odoHp.set(downed.hero.maxHp);
        downed.box.clearTint();
        await this.print(this.fill(BATTLE_TEXT.spark_revive, name, undefined, downed.hero.name));
      } else {
        h.odoHp.heal(h.hero.maxHp);
        await this.print('The spark flares — warm as a porch light in late summer. Full recovery!');
      }
      return true;
    }
    if (item.kind === 'battle' && item.power) {
      const target = await this.pickEnemy();
      if (!target) return false;
      GS.removeItem(itemId, h.hero.id);
      await this.print(`${name} threw the ${item.name}!`);
      const weak = target.def.weakness.includes('salt');
      if (item.breaksLatch && target.def.boss) {
        this.breakLatch();
        await this.print(BATTLE_TEXT.salt_break);
      }
      AUDIO.sfx('hit');
      await this.damageEnemy(target, applyWeakness(item.power, weak), weak);
      return true;
    }
    await this.print(item.text);
    return false;
  }

  private breakLatch(): void {
    this.heroes.forEach((h) => (h.latched = false));
  }

  private async damageEnemy(e: EnemyUnit, dmg: number, weak = false): Promise<void> {
    e.hp = Math.max(0, e.hp - dmg);
    e.spr.setTintFill(0xf8f8f0);
    this.tweens.add({ targets: e.spr, x: e.spr.x + 4, duration: 45, yoyo: true, repeat: 2 });
    this.time.delayedCall(120, () => e.spr.clearTint());
    await this.print(`${dmg} damage${weak ? ' — a sore spot!!' : '!'}`);
    if (e.hp <= 0) {
      e.alive = false;
      AUDIO.sfx('thud');
      this.tweens.add({ targets: e.spr, alpha: 0, scaleY: 0.1, y: e.spr.y + 20, duration: 420 });
      await this.print(e.def.deathLine);
      if (this.enemies.every((x) => !x.alive)) await this.victory();
    } else if (e.def.boss && e.hp < 120 && this.chad && !this.chad.fled) {
      await this.chadFlees();
    }
  }

  private async chadFlees(): Promise<void> {
    if (!this.chad) return;
    this.chad.fled = true;
    for (const line of DIALOGUE.chad_flee) await this.print(line);
    this.chad.box?.destroy();
    this.chad.texts.forEach((t) => t.destroy());
    this.chadOdo?.destroy();
    this.chadOdo = null;
    GS.data.guest = null;
    GS.setFlag('chad_gone');
  }

  private async chadPhase(): Promise<void> {
    if (!this.chad || this.chad.fled || this.chad.hp.dead) return;
    const target = this.enemies.find((e) => e.alive);
    if (!target) return;
    if (Math.random() < 0.55) {
      await this.print(BATTLE_TEXT.chad_poke);
      await this.damageEnemy(target, 2 + Math.floor(Math.random() * 4));
    } else {
      await this.print(BATTLE_TEXT.chad_hide);
    }
  }

  private async glintPhase(): Promise<void> {
    const target = this.enemies.find((e) => e.alive);
    if (!target) return;
    AUDIO.sfx('ember');
    const flare = this.add
      .image(target.spr.x, target.spr.y - 30, 'glint')
      .setDepth(DEPTH_UI + 3)
      .setScale(1.6);
    this.tweens.add({ targets: flare, alpha: 0, y: flare.y - 12, duration: 600, onComplete: () => flare.destroy() });
    await this.print(BATTLE_TEXT.glint_assist);
    await this.damageEnemy(target, 15 + Math.floor(Math.random() * 8));
  }

  private aliveHeroes(): HeroUnit[] {
    return this.heroes.filter((h) => !h.odoHp.dead && !h.hero.down);
  }

  private async enemyPhase(): Promise<void> {
    for (const e of this.enemies) {
      if (!e.alive || this.ended) continue;
      const move = this.pickMove(e);
      const targets = this.aliveHeroes();
      if (targets.length === 0) return;
      const latchedHero = this.heroes.find((h) => h.latched && !h.odoHp.dead);
      const target =
        move.kind === 'drain' && latchedHero ? latchedHero : targets[Math.floor(Math.random() * targets.length)];
      // enemy lunge
      this.tweens.add({ targets: e.spr, y: e.spr.y + 5, duration: 90, yoyo: true });
      await this.print(this.fill(move.text, '', e, target.hero.name));
      switch (move.kind) {
        case 'attack':
        case 'strong': {
          AUDIO.sfx('hit');
          this.cameras.main.shake(120, 0.006);
          let dmg = physicalDamage(e.def.offense * (move.mult ?? 1), target.hero.stats.defense, Math.random);
          if (target.defending) dmg = Math.max(1, Math.floor(dmg / 2));
          this.applyHeroDamage(target, dmg);
          await this.print(`${target.hero.name} took ${dmg}!`);
          break;
        }
        case 'latch': {
          target.latched = true;
          AUDIO.sfx('hit');
          break;
        }
        case 'drain': {
          if (!latchedHero) {
            await this.print('...but found nothing to hold onto!');
            break;
          }
          AUDIO.sfx('hit');
          const dmg = 10 + Math.floor(Math.random() * 6);
          this.applyHeroDamage(latchedHero, dmg);
          e.hp = Math.min(e.def.hp, e.hp + Math.floor(dmg / 2));
          await this.print(BATTLE_TEXT.latch_drain);
          await this.print(`${latchedHero.hero.name} lost ${dmg} HP!`);
          break;
        }
        case 'status': {
          if (move.status === 'sunburn') target.sunburn = 4;
          if (move.status === 'productive') {
            target.productive = 3;
            await this.print(`${target.hero.name} feels horribly PRODUCTIVE! Offense fell!`);
          }
          AUDIO.sfx('cancel');
          break;
        }
        case 'steal': {
          // S3: it rifles the TARGET's bag (bags are per-hero now)
          const foodIdx = target.hero.bag.findIndex((i) => ITEMS[i]?.kind === 'food');
          if (foodIdx >= 0) target.hero.bag.splice(foodIdx, 1);
          break;
        }
        case 'taunt':
          break;
      }
      // chad can get clipped too
      if (this.chad && !this.chad.fled && move.kind === 'attack' && Math.random() < 0.25) {
        this.chad.hp.damage(4);
        await this.print('Chad caught a stray! He took it personally!');
      }
      await this.settleDeaths();
      if (this.ended) return;
    }
  }

  private pickMove(e: EnemyUnit): EnemyMove {
    const latchedAlready = this.heroes.some((h) => h.latched);
    const moves = e.def.moves.filter((m) => !(m.kind === 'latch' && latchedAlready));
    const total = moves.reduce((a, m) => a + m.weight, 0);
    let r = Math.random() * total;
    for (const m of moves) {
      r -= m.weight;
      if (r <= 0) return m;
    }
    return moves[0];
  }

  private applyHeroDamage(h: HeroUnit, dmg: number): void {
    const wouldDie = h.odoHp.target - dmg <= 0;
    if (wouldDie && gutsSurvive(h.hero.stats.guts, Math.random)) {
      h.odoHp.target = 1;
      h.odoHp.displayed = Math.max(1, h.odoHp.displayed - dmg * 0.5);
      void this.print(`${h.hero.name} hung on with sheer GUTS!`);
      return;
    }
    h.odoHp.damage(dmg);
  }

  private async statusPhase(): Promise<void> {
    for (const h of this.heroes) {
      if (h.sunburn > 0 && !h.odoHp.dead) {
        h.sunburn--;
        h.odoHp.damage(3);
        await this.print(`${h.hero.name} sizzles a little. (Sunburn)`);
      }
      if (h.productive > 0 && !h.odoHp.dead) {
        h.productive--;
        if (h.productive === 0) await this.print(`${h.hero.name} remembered it's summer. Offense is back!`);
      }
    }
    await this.settleDeaths();
  }

  /** wait a beat so mortal meters resolve or get rescued */
  private settleDeaths(): Promise<void> {
    return new Promise((resolve) => {
      const check = (): void => {
        if (this.ended) {
          resolve();
          return;
        }
        for (const h of this.heroes) {
          if (h.odoHp.dead && !h.hero.down) {
            h.hero.down = true;
            h.box.setTint(0x888890);
            void this.print(`${h.hero.name} is down!!`).then(() => {
              if (this.aliveHeroes().length === 0) {
                void this.defeat();
              }
            });
          }
        }
        resolve();
      };
      this.time.delayedCall(60, check);
    });
  }

  /* ---------------- outcomes ---------------- */

  private async victory(): Promise<void> {
    if (this.ended) return;
    this.ended = true;
    // §A4.1: victory freezes every drum where it stands
    this.heroes.forEach((h) => {
      h.odoHp.freeze();
      h.odoPp.freeze();
      h.latched = false;
    });
    AUDIO.jingle('victory', 2200, null);
    await this.print(BATTLE_TEXT.win);
    const totalExp = this.enemies.reduce((a, e) => a + e.def.exp, 0);
    const totalCash = this.enemies.reduce((a, e) => a + e.def.cash, 0);
    const alive = this.aliveHeroes();
    const share = expShare(totalExp, alive.length);
    for (const h of alive) {
      h.hero.exp += share;
      await this.print(`${h.hero.name} gained ${share} EXP.`);
      while (h.hero.exp >= expForLevel(h.hero.level + 1)) {
        h.hero.level += 1;
        const lvl = h.hero.level;
        const prevMaxHp = h.hero.maxHp;
        const prevMaxPp = h.hero.maxPp;
        h.hero.stats = statsAtLevel(h.hero.id, lvl);
        h.hero.maxHp = maxHpAtLevel(h.hero.id, lvl);
        h.hero.maxPp = maxPpAtLevel(h.hero.id, lvl);
        h.odoHp.setMax(h.hero.maxHp);
        h.odoPp.setMax(h.hero.maxPp);
        h.odoHp.heal(h.hero.maxHp - prevMaxHp);
        h.odoPp.heal(h.hero.maxPp - prevMaxPp);
        AUDIO.jingle('levelup', 1400, null);
        await this.print(`${h.hero.name} jumped to level ${lvl}!`);
        const newAbilities = HEROES[h.hero.id].unlocks.filter((u) => u.level === lvl);
        for (const u of newAbilities) {
          const ab = ABILITIES[u.ability];
          if (ab) await this.print(`${h.hero.name} realized ${ab.name}!`);
        }
      }
    }
    if (totalCash > 0) {
      GS.data.pendingDeposit += totalCash;
      await this.print(`(Dad will deposit $${totalCash}. Call him sometime.)`);
    }
    this.syncHeroMeters();
    this.finish('victory');
  }

  private async defeat(): Promise<void> {
    if (this.ended) return;
    this.ended = true;
    AUDIO.stopMusic();
    await this.print(`${GS.data.party[0].name}... it all goes quiet for a second...`);
    this.syncHeroMeters();
    this.finish('defeat');
  }

  private syncHeroMeters(): void {
    this.heroes.forEach((h) => {
      h.hero.hp = Math.max(0, h.odoHp.value);
      h.hero.pp = Math.max(0, h.odoPp.value);
    });
  }

  private finish(outcome: 'victory' | 'defeat' | 'ran'): void {
    this.ended = true;
    this.syncHeroMeters();
    this.time.delayedCall(450, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.stop();
        this.game.events.emit('mf-battle-end', outcome);
      });
    });
  }

  /* ---------------- per-frame ---------------- */

  override update(_t: number, dtMs: number): void {
    const dt = Math.min(dtMs, 50) / 1000;
    let anyRoll = false;
    let anyMortal = false;
    for (const { d, o } of this.odoDisplays) {
      const ticks = o.tick(dt);
      if (ticks > 0) anyRoll = true;
      if (o.mortal) {
        anyMortal = true;
        d.setTint(colorOf(px(RAMP.RED, 2)));
      } else {
        d.clearTint();
      }
      d.setValue(Math.max(0, o.displayed));
    }
    if (this.chad && this.chadOdo) {
      this.chad.hp.tick(dt);
      this.chadOdo.setValue(Math.max(0, this.chad.hp.displayed));
    }
    this.tickAcc -= dt;
    if (anyRoll && this.tickAcc <= 0) {
      AUDIO.sfx(anyMortal ? 'odo_danger' : 'odo');
      this.tickAcc = anyMortal ? 0.07 : 0.1;
    }
    // live death watch: a mortal drum hitting zero mid-menu still counts.
    // never write state after the battle has resolved (victory freezes drums)
    if (!this.ended) {
      for (const h of this.heroes) {
        if (h.odoHp.dead && !h.hero.down) {
          h.hero.down = true;
          h.box.setTint(0x888890);
          if (this.aliveHeroes().length === 0) void this.defeat();
        }
      }
    }
  }
}
