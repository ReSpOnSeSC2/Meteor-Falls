/**
 * Overworld: EB-style 8-direction movement with follower conga line, visible
 * roaming enemies (no random encounters — §A4.2), swirl-coded contact
 * advantage, doors, signs, phones (save = call Dad), and the Chapter 1
 * cutscenes per GAME_BIBLE §A6 / ADR-007 + S2 (Mia, the Manager, Mom's call).
 *
 * QA recipe, S2 leg (ADR-008; name entry recipe lives in NameEntryScene):
 * mashing key('KeyZ') advances dialogue AND confirms the top menu row, which
 * is always the safe pick (Board the 6:15 / Call Dad / Bash). On dos_f3,
 * walk into each patrol's route to fight it — victories set dos_quota_f3a/b/c
 * and the third fade-restarts the floor with the room carved open. Walk in
 * through the gap (tiles 20-21, row 6) for the join; the exit column (24,
 * rows 3-4) runs the Manager fight — pick Mia's PRAY with Down,Down,KeyZ on
 * her command row. Mom's call: payphone at brickton (14,26), A to answer.
 * Bots beware: holdKey is eaten while dlg.busy — drain pages with key() first.
 * S3: Enter (START) opens the EB command menu — it's a separate scene over a
 * paused world; the drive-it recipe lives in MenuScene's header.
 * S4: phones are a contact list now (top row stays Call Dad = the safe pick);
 * the brickton ATM sits at the jittered bank facade — face it, KeyZ, then
 * Withdraw/Deposit/Done rows with $-preset rows under each. Shopkeepers open
 * ShopScene on talk (recipe in ITS header); KeyZ through a keeper greeting
 * lands on BUY.
 * S6: Dad's FIRST save per playthrough asks "Which notebook?" — a 3-row menu
 * (top row = Notebook 1), so a KeyZ-mash through Call Dad picks Notebook 1
 * and every later save reuses it silently. Continue lives in SaveSlotsScene
 * (recipe in ITS header). A party wipe respawns at the last Dad-save's
 * map/position (GS.respawnPoint) instead of hardcoded rex_home.
 */
import Phaser from 'phaser';
import {
  MAPS,
  CHAR_LEGEND,
  BRICKTON_BUS_SPAWN,
  carveHoldingRoom,
  type MapDef,
  type NpcDef,
  type PatrolDef,
  type PropDef,
} from '../data/maps';
import { ENEMIES } from '../data/enemies';
import { DIALOGUE } from '../data/dialogue';
import { GS, makeHeroState } from '../engine/state';
import { SLOT_IDS } from '../engine/saves';
import { INPUT } from '../engine/input';
import { AUDIO } from '../engine/audio';
import { Dialogue, makeWindow, toast, vars, DEPTH_UI } from '../ui/windows';
import { tileIndexByName, PATH_BASE, PATH_VARIANTS, RUG_BASE } from '../spritegen/tiles';
import { TILE_SOLID, standFrame, type Facing } from '../spritegen';
import { instantWin, expShare } from '../battle/formulas';
import { colorOf, RAMP, px } from '../palette';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Roamer {
  spr: Phaser.GameObjects.Sprite;
  enemyId: string;
  /** character sheet id when this enemy walks as a person (EnemyDef.walker) */
  walker?: string;
  vx: number;
  vy: number;
  think: number;
  home: Rect;
  dead: boolean;
}

type PatrolState = 'patrol' | 'alert' | 'chase' | 'return';

interface PatrolObj {
  spr: Phaser.GameObjects.Sprite;
  def: PatrolDef;
  walker: string;
  wp: number;
  state: PatrolState;
  /** ms left in the alert pause */
  alertT: number;
  /** seconds the player has been out of reach while chasing */
  lose: number;
  facing: Facing;
  dead: boolean;
  bang: Phaser.GameObjects.BitmapText | null;
}

interface NpcObj {
  spr: Phaser.GameObjects.Sprite;
  def: NpcDef;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  think: number;
}

const WALK = 70;
const RUN = 115;
const PURSUE = 85;
const PATROL_WALK = 38;
const PATROL_CHASE = 92;

export class OverworldScene extends Phaser.Scene {
  private mapDef!: MapDef;
  private solidTiles: boolean[][] = [];
  private solids: Rect[] = [];
  private player!: Phaser.GameObjects.Sprite;
  private facing: Facing = 'down';
  private followers: Array<{ spr: Phaser.GameObjects.Sprite; id: string; angel: boolean }> = [];
  private trail: Array<{ x: number; y: number; f: Facing }> = [];
  private holdingDoorImg: Phaser.GameObjects.Image | null = null;
  private npcs: NpcObj[] = [];
  private roamers: Roamer[] = [];
  private patrols: PatrolObj[] = [];
  private dlg!: Dialogue;
  private cut = false; // cutscene lock
  private transitioning = false;
  private battleCooldown = 0;
  private stepTimer = 0;
  private fireflies: Phaser.GameObjects.Image[] = [];

  constructor() {
    super('overworld');
  }

  init(data: { mapId?: string; x?: number; y?: number; facing?: Facing }): void {
    const id = data.mapId ?? GS.data.map;
    this.mapDef = MAPS[id] ?? MAPS.otterbrook;
    GS.data.map = this.mapDef.id;
    if (data.x !== undefined) GS.data.x = data.x;
    if (data.y !== undefined) GS.data.y = data.y;
    if (data.facing) GS.data.facing = data.facing;
  }

  create(): void {
    this.cut = false;
    this.transitioning = false;
    this.followers = [];
    this.trail = [];
    this.npcs = [];
    this.roamers = [];
    this.patrols = [];
    this.solids = [];
    this.fireflies = [];
    this.holdingDoorImg = null;
    this.insideTriggers.clear();
    this.dlg = new Dialogue(this);

    this.buildTiles();
    this.buildProps();
    this.buildNpcs();
    this.buildPlayer();
    this.buildRoamers();
    this.buildPatrols();
    // It is 2 AM until Glint's porch scene ends — dawn breaks after (§A6 Ch.1)
    const storyNight = this.mapDef.id === 'otterbrook' && !GS.flag('zapper_done');
    if (this.mapDef.night || storyNight) this.buildNight();
    this.showBanner();

    AUDIO.playMusic(this.mapDef.music);
    this.cameras.main.fadeIn(250, 0, 0, 0);

    void this.onEnterCutscenes();
  }

  /* ---------------- build ---------------- */

  private buildTiles(): void {
    // S2: the holding room un-walls itself once the quota is met (ADR-014);
    // the shared MapDef grid is never mutated — the carve is per-build
    const rows =
      this.mapDef.id === 'dos_f3' && GS.flag('holding_open')
        ? carveHoldingRoom(this.mapDef.grid)
        : this.mapDef.grid;
    const h = rows.length;
    const w = rows[0].length;
    const isPath = (x: number, y: number): boolean =>
      x >= 0 && y >= 0 && x < w && y < h && rows[y][x] === ':';
    const isRug = (x: number, y: number): boolean =>
      x >= 0 && y >= 0 && x < w && y < h && rows[y][x] === 'r';
    // S7 (ADR-019): roads carve curbs into adjacent sidewalk, office walls
    // sprout fluorescent panels — render-time variants, deterministic, and
    // identical in solidity to their base tiles.
    const isRoad = (x: number, y: number): boolean =>
      x >= 0 && y >= 0 && x < w && y < h && 'RDX23P'.includes(rows[y][x]);
    const data: number[][] = [];
    this.solidTiles = [];
    for (let y = 0; y < h; y++) {
      const row: number[] = [];
      const srow: boolean[] = [];
      for (let x = 0; x < w; x++) {
        const ch = rows[y][x];
        let idx: number;
        if (ch === ':') {
          let mask = 0;
          if (!isPath(x, y - 1)) mask |= 1;
          if (!isPath(x + 1, y)) mask |= 2;
          if (!isPath(x, y + 1)) mask |= 4;
          if (!isPath(x - 1, y)) mask |= 8;
          idx = PATH_BASE + ((x + y) % PATH_VARIANTS) * 16 + mask;
        } else if (ch === 'r') {
          // rugs border their actual perimeter — one rug, not stamped cells
          let mask = 0;
          if (!isRug(x, y - 1)) mask |= 1;
          if (!isRug(x + 1, y)) mask |= 2;
          if (!isRug(x, y + 1)) mask |= 4;
          if (!isRug(x - 1, y)) mask |= 8;
          idx = RUG_BASE + mask;
        } else {
          let name = CHAR_LEGEND[ch] ?? 'grass_a';
          if (name === 'sidewalk') {
            if (isRoad(x, y + 1)) name = 'sidewalk_curb';
            else if (isRoad(x + 1, y)) name = 'sidewalk_curb_e';
            else if (isRoad(x - 1, y)) name = 'sidewalk_curb_w';
          } else if (name === 'office_wall' && x % 4 === 1) {
            name = 'office_wall_light';
          }
          idx = tileIndexByName(name);
        }
        row.push(idx);
        srow.push(TILE_SOLID[idx]);
      }
      data.push(row);
      this.solidTiles.push(srow);
    }
    const map = this.make.tilemap({ data, tileWidth: 16, tileHeight: 16 });
    const tiles = map.addTilesetImage('tiles');
    if (tiles) map.createLayer(0, tiles, 0, 0)?.setDepth(0);
    // center maps smaller than the viewport (interiors float in the void)
    const vw = this.scale.width;
    const vh = this.scale.height;
    const mw = w * 16;
    const mh = h * 16;
    const bx = Math.min(0, (mw - vw) / 2);
    const by = Math.min(0, (mh - vh) / 2);
    this.cameras.main.setBounds(bx, by, Math.max(mw, vw), Math.max(mh, vh));
  }

  private buildProps(): void {
    for (const p of this.mapDef.props) {
      if (p.ifFlag && !GS.flag(p.ifFlag)) continue;
      if (p.sprite === 'holding_door') {
        this.buildHoldingDoor(p);
        continue;
      }
      const img = this.add.image(p.x * 16, p.y * 16, p.sprite).setOrigin(0, 0);
      img.setDepth(p.y * 16 + img.height);
      if (p.solid) {
        this.solids.push({
          x: p.x * 16 + p.solid.ox,
          y: p.y * 16 + p.solid.oy,
          w: p.solid.w,
          h: p.solid.h,
        });
      }
    }
    this.buildDoorMarkers();
  }

  /* ---------------- the PRODUCTIVITY LOCK (S2, ADR-014) ---------------- */

  /** the three floor-3 countFlags, in pip order */
  private quotaFlags(): string[] {
    return (MAPS.dos_f3.patrols ?? [])
      .map((p) => p.countFlag)
      .filter((f): f is string => f !== undefined);
  }

  private quotaCount(): number {
    return this.quotaFlags().filter((f) => GS.flag(f)).length;
  }

  /**
   * The holding door is a scene-interpreted prop: sealed it shows one lit pip
   * per counted patrol; open, the door is gone (the wall is carved) and only
   * the quota panel stays behind, mounted beside the gap.
   */
  private buildHoldingDoor(p: PropDef): void {
    if (GS.flag('holding_open')) {
      this.add
        .image(p.x * 16 - 26, p.y * 16 + 14, 'quota_panel')
        .setOrigin(0, 0)
        .setDepth(p.y * 16 + 20);
      return;
    }
    const lit = this.quotaCount();
    const img = this.add
      .image(p.x * 16, p.y * 16, lit > 0 ? `holding_door_${lit}` : 'holding_door')
      .setOrigin(0, 0);
    img.setDepth(p.y * 16 + img.height);
    this.holdingDoorImg = img;
    if (p.solid) {
      this.solids.push({
        x: p.x * 16 + p.solid.ox,
        y: p.y * 16 + p.solid.oy,
        w: p.solid.w,
        h: p.solid.h,
      });
    }
  }

  /** every walkable door gets a visible marker (mat / stairs / elevator) */
  private buildDoorMarkers(): void {
    for (const d of this.mapDef.doors) {
      const kind = d.indicator ?? (this.mapDef.interior ? 'mat' : 'none');
      if (kind === 'none') continue;
      const cx = (d.x + d.w / 2) * 16;
      const by = (d.y + d.h) * 16;
      if (kind === 'elevator') {
        // doors drawn on the wall above the zone; walk into them to ride
        this.add.image(cx, d.y * 16 + 2, 'elevator').setOrigin(0.5, 1).setDepth(3);
        continue;
      }
      this.add
        .image(cx, kind === 'stairs' ? by + 2 : by - 1, kind === 'stairs' ? 'stairs' : 'doormat')
        .setOrigin(0.5, 1)
        .setDepth(2); // floor decal, characters walk over it
    }
    // building entrances: a mat on the doorstep
    for (const p of this.mapDef.props) {
      if (!p.door) continue;
      const cx = p.x * 16 + p.door.ox + p.door.w / 2;
      const by = p.y * 16 + p.door.oy + p.door.h;
      this.add.image(cx, by + 4, 'doormat').setOrigin(0.5, 1).setDepth(2);
    }
  }

  private buildNpcs(): void {
    for (const def of this.mapDef.npcs) {
      if (def.ifFlag && !GS.flag(def.ifFlag)) continue;
      if (def.unlessFlag && GS.flag(def.unlessFlag)) continue;
      const x = def.x * 16 + 8;
      const y = def.y * 16 + 22;
      // dogs: frames [0,1]=eastbound, [2,3]=westbound (S7c sheet contract)
      const spr = this.add.sprite(x, y, def.sprite, def.dog ? (def.facing === 'left' ? 2 : 0) : standFrame(def.facing));
      spr.setOrigin(0.5, 1);
      spr.setDepth(y);
      this.npcs.push({ spr, def, baseX: x, baseY: y, vx: 0, vy: 0, think: Math.random() * 2000 });
      this.solids.push({ x: x - 6, y: y - 10, w: 12, h: 10 });
    }
  }

  private buildPlayer(): void {
    this.facing = GS.data.facing;
    this.player = this.add.sprite(GS.data.x, GS.data.y, 'rex', standFrame(this.facing));
    this.player.setOrigin(0.5, 1);
    this.cameras.main.startFollow(this.player, true, 0.18, 0.18);
    this.buildFollowers();
  }

  /** the conga line: every party member behind the leader (Prompt 5), down
   *  heroes as floating haloed angels (§A4.7), then any guest at the back */
  private buildFollowers(): void {
    for (const h of GS.data.party.slice(1)) this.addFollower(h.id, h.down);
    if (GS.data.guest === 'chad') this.addFollower('chad');
  }

  private rebuildFollowers(): void {
    this.followers.forEach((f) => f.spr.destroy());
    this.followers = [];
    this.buildFollowers();
  }

  private addFollower(id: string, angel = false): void {
    // S7c: a fallen hero mourns as THEMSELF — angel_<id> when the variant
    // exists, the plain guest angel otherwise (visual only, §A4.7)
    const angelKey = this.textures.exists(`angel_${id}`) ? `angel_${id}` : 'angel';
    const spr = this.add.sprite(this.player.x, this.player.y + 2, angel ? angelKey : id, 0);
    spr.setOrigin(0.5, 1);
    if (angel) spr.play(`${angelKey}-float`);
    else spr.setFrame(standFrame('down'));
    this.followers.push({ spr, id, angel });
  }

  private removeFollower(id: string): void {
    const i = this.followers.findIndex((f) => f.id === id);
    if (i >= 0) {
      this.followers[i].spr.destroy();
      this.followers.splice(i, 1);
    }
  }

  private buildRoamers(): void {
    for (const sp of this.mapDef.spawners) {
      if (sp.ifFlag && !GS.flag(sp.ifFlag)) continue;
      for (let i = 0; i < sp.count; i++) {
        const enemyId = sp.enemies[Math.floor(Math.random() * sp.enemies.length)];
        const def = ENEMIES[enemyId];
        const x = (sp.rect.x + Math.random() * sp.rect.w) * 16;
        const y = (sp.rect.y + Math.random() * sp.rect.h) * 16;
        const spr = this.add.sprite(x, y, def.walker ?? def.mini, def.walker ? standFrame('down') : 0);
        spr.setOrigin(0.5, 1);
        spr.setDepth(y);
        this.roamers.push({
          spr,
          enemyId,
          walker: def.walker,
          vx: 0,
          vy: 0,
          think: 0,
          home: { x: sp.rect.x * 16, y: sp.rect.y * 16, w: sp.rect.w * 16, h: sp.rect.h * 16 },
          dead: false,
        });
      }
    }
  }

  private buildPatrols(): void {
    for (const def of this.mapDef.patrols ?? []) {
      // a counted patrol stays down for good — its quota was met (S2)
      if (def.countFlag && GS.flag(def.countFlag)) continue;
      const walker = ENEMIES[def.enemy].walker ?? 'smiler';
      const [tx, ty] = def.route[0];
      const spr = this.add.sprite(tx * 16 + 8, ty * 16 + 22, walker, standFrame('down'));
      spr.setOrigin(0.5, 1);
      spr.setDepth(spr.y);
      this.patrols.push({
        spr,
        def,
        walker,
        wp: def.route.length > 1 ? 1 : 0,
        state: 'patrol',
        alertT: 0,
        lose: 0,
        facing: 'down',
        dead: false,
        bang: null,
      });
    }
  }

  private buildNight(): void {
    const o = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, colorOf(px(RAMP.NIGHT, 1)))
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(800)
      .setAlpha(0.62);
    o.setBlendMode(Phaser.BlendModes.MULTIPLY);
    // S7: porch lights pool warm light at every doorstep on the 2AM street
    for (const p of this.mapDef.props) {
      if (!p.door) continue;
      const cx = p.x * 16 + p.door.ox + p.door.w / 2;
      const cy = p.y * 16 + p.door.oy - 6;
      const glow = this.add
        .circle(cx, cy, 15, colorOf(px(RAMP.GOLD, 2)), 0.22)
        .setDepth(805)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.85, to: 1 },
        duration: 1400 + (p.x % 5) * 180,
        yoyo: true,
        repeat: -1,
      });
    }
    for (let i = 0; i < 9; i++) {
      const f = this.add
        .image(Math.random() * this.scale.width, Math.random() * this.scale.height, 'pixel')
        .setScrollFactor(0)
        .setDepth(810)
        .setTint(colorOf(px(RAMP.GOLD, 3)))
        .setAlpha(0);
      this.tweens.add({
        targets: f,
        alpha: { from: 0, to: 0.9 },
        duration: 900 + Math.random() * 900,
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 2000,
      });
      this.fireflies.push(f);
    }
  }

  private showBanner(): void {
    // banner names are all-caps; resolved {rex} et al. get uppercased to match
    const name = vars(this.mapDef.name).toUpperCase();
    const w = name.length * 6 + 24;
    const win = makeWindow(this, 8, 8, w, 24);
    const tx = this.add
      .bitmapText(20, 16, 'retro', name, 6)
      .setScrollFactor(0)
      .setDepth(DEPTH_UI + 1);
    this.tweens.add({
      targets: [win, tx],
      alpha: 0,
      delay: 1500,
      duration: 400,
      onComplete: () => {
        win.destroy();
        tx.destroy();
      },
    });
  }

  /* ---------------- update loop ---------------- */

  override update(_t: number, dtMs: number): void {
    const dt = Math.min(dtMs, 50) / 1000;
    if (!this.cut && !this.dlg.busy && !this.transitioning) {
      this.updatePlayer(dt);
      this.updateRoamers(dt);
      if (!this.cut && !this.transitioning) this.updatePatrols(dt);
      // a contact battle may have started this frame — don't double-fire
      if (!this.cut && !this.transitioning) {
        this.checkDoors();
        this.checkTriggers();
        // the A that confirmed a menu row this same frame must not also
        // probe the world (Dialogue.justReleased — the S6 notebook-ask fix)
        const released = this.dlg.justReleased(this.time.now);
        if (INPUT.justPressed('A') && !released) void this.interact();
        if (INPUT.justPressed('START') && !released) this.pauseMenu();
      }
    } else {
      this.player.anims.stop();
    }
    this.updateNpcs(dt);
    this.updateFireflies(dt);
  }

  private updatePlayer(dt: number): void {
    const d = INPUT.dir();
    const running = INPUT.held('B');
    const sp = running ? RUN : WALK;
    let moved = false;
    if (d.x !== 0 || d.y !== 0) {
      const len = Math.hypot(d.x, d.y);
      const dx = (d.x / len) * sp * dt;
      const dy = (d.y / len) * sp * dt;
      const nx = this.tryMove(this.player.x, this.player.y, dx, 0);
      const ny = this.tryMove(nx, this.player.y, 0, dy, true);
      moved = nx !== this.player.x || ny !== this.player.y;
      this.player.x = nx;
      this.player.y = ny;
      if (d.x !== 0) this.facing = d.x > 0 ? 'right' : 'left';
      else this.facing = d.y > 0 ? 'down' : 'up';
      GS.data.x = this.player.x;
      GS.data.y = this.player.y;
      GS.data.facing = this.facing;
    }
    if (moved) {
      const anim = `rex-walk-${this.facing}`;
      if (this.player.anims.currentAnim?.key !== anim || !this.player.anims.isPlaying) {
        this.player.anims.play(anim, true);
      }
      this.player.anims.timeScale = running ? 1.6 : 1;
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        AUDIO.sfx('step');
        this.stepTimer = running ? 0.18 : 0.28;
        // running kicks up dust at the heels (S7 juice, Prompt 39)
        if (running) this.dustPuff(this.player.x - d.x * 4, this.player.y - 2);
      }
      // breadcrumb trail for the conga line
      const last = this.trail[0];
      if (!last || Math.hypot(this.player.x - last.x, this.player.y - last.y) >= 3) {
        this.trail.unshift({ x: this.player.x, y: this.player.y, f: this.facing });
        if (this.trail.length > 80) this.trail.pop();
      }
    } else {
      this.player.anims.stop();
      this.player.setFrame(standFrame(this.facing));
    }
    this.player.setDepth(this.player.y);
    this.followers.forEach((f, i) => {
      const crumb = this.trail[(i + 1) * 9];
      if (!crumb) return;
      if (f.angel) {
        // angels float instead of walk (Prompt 5 / §A4.7)
        f.spr.x = crumb.x;
        f.spr.y = crumb.y - 4 + Math.sin(this.time.now / 280 + i * 2) * 1.5;
        f.spr.setDepth(crumb.y);
        return;
      }
      const movedF = Math.hypot(f.spr.x - crumb.x, f.spr.y - crumb.y) > 0.5;
      f.spr.x = crumb.x;
      f.spr.y = crumb.y;
      f.spr.setDepth(crumb.y);
      const anim = `${f.id}-walk-${crumb.f}`;
      if (movedF && moved) {
        if (f.spr.anims.currentAnim?.key !== anim || !f.spr.anims.isPlaying) f.spr.anims.play(anim, true);
      } else {
        f.spr.anims.stop();
        f.spr.setFrame(standFrame(crumb.f));
      }
    });
  }

  /** axis-separated movement with solid tiles + prop rects (slide on collide) */
  private tryMove(x: number, y: number, dx: number, dy: number, second = false): number {
    const nx = x + dx;
    const ny = y + dy;
    const box = { x: nx - 5, y: ny - 9, w: 10, h: 9 };
    if (this.collides(box)) return second ? y : x;
    return second ? ny : nx;
  }

  private collides(box: Rect): boolean {
    const x0 = Math.floor(box.x / 16);
    const y0 = Math.floor(box.y / 16);
    const x1 = Math.floor((box.x + box.w) / 16);
    const y1 = Math.floor((box.y + box.h) / 16);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (
          ty < 0 ||
          tx < 0 ||
          ty >= this.solidTiles.length ||
          tx >= this.solidTiles[0].length ||
          this.solidTiles[ty][tx]
        ) {
          return true;
        }
      }
    }
    return this.solids.some(
      (s) => box.x < s.x + s.w && box.x + box.w > s.x && box.y < s.y + s.h && box.y + box.h > s.y,
    );
  }

  private updateNpcs(dt: number): void {
    for (const n of this.npcs) {
      if (!n.def.wander || this.cut || this.dlg.busy) continue;
      n.think -= dt * 1000;
      if (n.think <= 0) {
        n.think = 1200 + Math.random() * 2200;
        if (Math.random() < 0.55) {
          const dirs = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ];
          const [vx, vy] = dirs[Math.floor(Math.random() * 4)];
          n.vx = vx * 22;
          n.vy = vy * 22;
        } else {
          n.vx = 0;
          n.vy = 0;
        }
      }
      if (n.vx !== 0 || n.vy !== 0) {
        const nx = n.spr.x + n.vx * dt;
        const ny = n.spr.y + n.vy * dt;
        if (Math.abs(nx - n.baseX) > 28 || Math.abs(ny - n.baseY) > 24 || this.collides({ x: nx - 5, y: ny - 9, w: 10, h: 9 })) {
          n.vx = 0;
          n.vy = 0;
        } else {
          n.spr.x = nx;
          n.spr.y = ny;
          n.spr.setDepth(ny);
          const f: Facing = n.vx !== 0 ? (n.vx > 0 ? 'right' : 'left') : n.vy > 0 ? 'down' : 'up';
          if (!n.def.dog) {
            const anim = `${n.def.sprite}-walk-${f}`;
            if (n.spr.anims.currentAnim?.key !== anim || !n.spr.anims.isPlaying) n.spr.anims.play(anim, true);
          }
        }
      } else if (!n.def.dog) {
        n.spr.anims.stop();
      }
    }
  }

  private updateRoamers(dt: number): void {
    const now = this.time.now;
    for (const r of this.roamers) {
      if (r.dead) continue;
      const def = ENEMIES[r.enemyId];
      const distP = Math.hypot(this.player.x - r.spr.x, this.player.y - r.spr.y);
      const avgLvl = this.avgPartyLevel();
      const outclassed = avgLvl >= def.level + 6;
      if (outclassed && distP < 70) {
        // EB detail: weak enemies flee a strong party
        r.vx = Math.sign(r.spr.x - this.player.x) * 60;
        r.vy = Math.sign(r.spr.y - this.player.y) * 60;
      } else if (distP < 64) {
        r.vx = ((this.player.x - r.spr.x) / distP) * PURSUE;
        r.vy = ((this.player.y - r.spr.y) / distP) * PURSUE;
      } else {
        r.think -= dt * 1000;
        if (r.think <= 0) {
          r.think = 800 + Math.random() * 1600;
          const ang = Math.random() * Math.PI * 2;
          const speed = Math.random() < 0.3 ? 0 : 26;
          r.vx = Math.cos(ang) * speed;
          r.vy = Math.sin(ang) * speed;
        }
      }
      let nx = r.spr.x + r.vx * dt;
      let ny = r.spr.y + r.vy * dt;
      // keep wanderers near home unless chasing
      if (distP >= 64) {
        nx = Phaser.Math.Clamp(nx, r.home.x, r.home.x + r.home.w);
        ny = Phaser.Math.Clamp(ny, r.home.y, r.home.y + r.home.h);
      }
      let moved = false;
      if (!this.collides({ x: nx - 5, y: ny - 8, w: 10, h: 8 })) {
        moved = Math.abs(nx - r.spr.x) + Math.abs(ny - r.spr.y) > 0.1;
        r.spr.x = nx;
        r.spr.y = ny;
        r.spr.setDepth(ny);
      } else {
        r.vx = -r.vx;
        r.vy = -r.vy;
      }
      // humanoid enemies (walker sheets) animate like people
      if (r.walker) {
        if (moved) {
          const f: Facing =
            Math.abs(r.vx) > Math.abs(r.vy) ? (r.vx > 0 ? 'right' : 'left') : r.vy > 0 ? 'down' : 'up';
          const anim = `${r.walker}-walk-${f}`;
          if (r.spr.anims.currentAnim?.key !== anim || !r.spr.anims.isPlaying) r.spr.anims.play(anim, true);
          r.spr.anims.timeScale = distP < 64 ? 1.5 : 1;
        } else if (r.spr.anims.isPlaying) {
          r.spr.anims.stop();
          r.spr.setFrame(standFrame('down'));
        }
      }
      if (distP < 13 && now > this.battleCooldown) {
        void this.contactBattle(r);
        return;
      }
    }
  }

  /* ---------------- sight-line patrols (Department of Smiles) ---------------- */

  private updatePatrols(dt: number): void {
    const now = this.time.now;
    for (const p of this.patrols) {
      if (p.dead) continue;
      if (p.state === 'patrol' || p.state === 'return') {
        const [wx, wy] = p.def.route[p.wp];
        const tx = wx * 16 + 8;
        const ty = wy * 16 + 22;
        const d = Math.hypot(tx - p.spr.x, ty - p.spr.y);
        if (d < 2) {
          p.wp = (p.wp + 1) % p.def.route.length;
          p.state = 'patrol';
        } else {
          const vx = ((tx - p.spr.x) / d) * PATROL_WALK;
          const vy = ((ty - p.spr.y) / d) * PATROL_WALK;
          p.spr.x += vx * dt;
          p.spr.y += vy * dt;
          p.facing = Math.abs(vx) > Math.abs(vy) ? (vx > 0 ? 'right' : 'left') : vy > 0 ? 'down' : 'up';
          this.patrolAnim(p, true, 1);
        }
        if (this.patrolSees(p)) {
          p.state = 'alert';
          p.alertT = 380;
          this.patrolAnim(p, false, 1);
          // face the player for the realization
          p.facing = this.dirToward(p.spr.x, p.spr.y, this.player.x, this.player.y);
          p.spr.setFrame(standFrame(p.facing));
          AUDIO.sfx('alert');
          p.bang = this.add
            .bitmapText(p.spr.x, p.spr.y - p.spr.height - 2, 'retro', '!', 8)
            .setOrigin(0.5, 1)
            .setTint(colorOf(px(RAMP.RED, 2)))
            .setDepth(5000);
          this.tweens.add({ targets: p.bang, y: p.bang.y - 3, duration: 120, yoyo: true });
        }
      } else if (p.state === 'alert') {
        p.alertT -= dt * 1000;
        if (p.alertT <= 0) {
          p.state = 'chase';
          p.lose = 0;
        }
      } else {
        // chase — faster than your walk, slower than your run (§A4 feel)
        const dx = this.player.x - p.spr.x;
        const dy = this.player.y - p.spr.y;
        const d = Math.hypot(dx, dy);
        const step = PATROL_CHASE * dt;
        const nx = this.patrolMove(p.spr.x, p.spr.y, (dx / d) * step, 0, false);
        const ny = this.patrolMove(nx, p.spr.y, 0, (dy / d) * step, true);
        p.spr.x = nx;
        p.spr.y = ny;
        p.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
        this.patrolAnim(p, true, 1.5);
        if (p.bang) {
          p.bang.x = p.spr.x;
          p.bang.y = p.spr.y - p.spr.height - 2;
        }
        if (d > 120) {
          p.lose += dt;
          if (p.lose > 1.5) this.patrolGiveUp(p);
        } else {
          p.lose = 0;
        }
        if (d < 13 && now > this.battleCooldown) {
          void this.patrolBattle(p);
          return;
        }
      }
      p.spr.setDepth(p.spr.y);
    }
  }

  private patrolAnim(p: PatrolObj, moving: boolean, speed: number): void {
    if (moving) {
      const anim = `${p.walker}-walk-${p.facing}`;
      if (p.spr.anims.currentAnim?.key !== anim || !p.spr.anims.isPlaying) p.spr.anims.play(anim, true);
      p.spr.anims.timeScale = speed;
    } else if (p.spr.anims.isPlaying) {
      p.spr.anims.stop();
      p.spr.setFrame(standFrame(p.facing));
    }
  }

  /** axis-separated chase movement so Smilers slide along cubicle walls */
  private patrolMove(x: number, y: number, dx: number, dy: number, second: boolean): number {
    const nx = x + dx;
    const ny = y + dy;
    const box = { x: nx - 5, y: ny - 9, w: 10, h: 9 };
    if (this.collides(box)) return second ? y : x;
    return second ? ny : nx;
  }

  private dirToward(x0: number, y0: number, x1: number, y1: number): Facing {
    const dx = x1 - x0;
    const dy = y1 - y0;
    return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
  }

  /** facing-cone sight check with solid-tile occlusion */
  private patrolSees(p: PatrolObj): boolean {
    const range = (p.def.sight ?? 5) * 16;
    const f = this.facingVectorOf(p.facing);
    const ex = p.spr.x;
    const ey = p.spr.y - 8;
    const rx = this.player.x - ex;
    const ry = this.player.y - 8 - ey;
    const along = rx * f.x + ry * f.y;
    if (along < 6 || along > range) return false;
    const perp = Math.abs(rx * f.y - ry * f.x);
    if (perp > 14) return false;
    // line of sight: cubicle walls hide you (stealth-lite, caught = battle not fail)
    const steps = Math.ceil(along / 8);
    for (let i = 1; i < steps; i++) {
      const sx = ex + (rx * i) / steps;
      const sy = ey + (ry * i) / steps;
      const txi = Math.floor(sx / 16);
      const tyi = Math.floor(sy / 16);
      if (
        tyi < 0 ||
        txi < 0 ||
        tyi >= this.solidTiles.length ||
        txi >= this.solidTiles[0].length ||
        this.solidTiles[tyi][txi]
      ) {
        return false;
      }
    }
    return true;
  }

  private facingVectorOf(f: Facing): { x: number; y: number } {
    switch (f) {
      case 'up':
        return { x: 0, y: -1 };
      case 'down':
        return { x: 0, y: 1 };
      case 'left':
        return { x: -1, y: 0 };
      default:
        return { x: 1, y: 0 };
    }
  }

  private patrolGiveUp(p: PatrolObj): void {
    p.state = 'return';
    p.lose = 0;
    p.bang?.destroy();
    p.bang = null;
    // head for the nearest waypoint
    let best = 0;
    let bestD = Infinity;
    p.def.route.forEach(([wx, wy], i) => {
      const d = Math.hypot(wx * 16 + 8 - p.spr.x, wy * 16 + 22 - p.spr.y);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    p.wp = best;
  }

  private async patrolBattle(p: PatrolObj): Promise<void> {
    this.battleCooldown = this.time.now + 1500;
    // caught = they get the drop on you; sneak up on THEM for the red swirl
    const f = this.facingVectorOf(p.facing);
    const toPlayer = new Phaser.Math.Vector2(this.player.x - p.spr.x, this.player.y - p.spr.y).normalize();
    let advantage: 'player' | 'enemy' | 'none' = 'none';
    if (p.state === 'chase') advantage = 'enemy';
    else if (f.x * toPlayer.x + f.y * toPlayer.y < -0.35) advantage = 'player';
    p.bang?.destroy();
    p.bang = null;
    const outcome = await this.startBattle([p.def.enemy], advantage, null);
    if (outcome === 'victory') {
      p.dead = true;
      p.spr.destroy();
      // S2: floor-3 victories count toward the PRODUCTIVITY LOCK's quota
      if (p.def.countFlag && !GS.flag(p.def.countFlag)) {
        GS.setFlag(p.def.countFlag);
        await this.quotaBeat();
      }
    } else if (outcome === 'ran') {
      this.patrolGiveUp(p);
    }
  }

  /** a pip lights; the third one opens the holding room (fade-rebuild) */
  private async quotaBeat(): Promise<void> {
    const n = this.quotaCount();
    this.cut = true;
    if (n < 3) {
      AUDIO.sfx('confirm');
      this.holdingDoorImg?.setTexture(`holding_door_${n}`);
      await this.dlg.say(...DIALOGUE[`quota_pip_${n}`]);
      this.cut = false;
      return;
    }
    GS.setFlag('holding_open');
    this.holdingDoorImg?.setTexture('holding_door_3');
    AUDIO.sfx('confirm');
    await this.dlg.say(...DIALOGUE.quota_pip_3);
    AUDIO.sfx('thud');
    this.cameras.main.shake(250, 0.008);
    this.fadeRestart(); // rebuilt open: carved wall, quota panel, Mia inside
  }

  /** fade out and rebuild this map in place (position persists via GS.data) */
  private fadeRestart(): void {
    if (this.transitioning) return;
    this.transitioning = true;
    this.cameras.main.fadeOut(260, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.restart({});
    });
  }

  private updateFireflies(dt: number): void {
    for (const f of this.fireflies) {
      f.x += Math.sin(this.time.now / 700 + f.y) * 8 * dt;
      f.y += Math.cos(this.time.now / 900 + f.x) * 6 * dt;
    }
  }

  private avgPartyLevel(): number {
    const p = GS.data.party;
    return p.reduce((a, h) => a + h.level, 0) / Math.max(1, p.length);
  }

  /* ---------------- encounters ---------------- */

  private async contactBattle(r: Roamer): Promise<void> {
    this.battleCooldown = this.time.now + 1500;
    const def = ENEMIES[r.enemyId];
    // §A4.2 instant win when vastly overleveled
    if (instantWin(this.avgPartyLevel(), def.level, !!def.boss)) {
      r.dead = true;
      AUDIO.sfx('smash');
      this.cameras.main.flash(220, 248, 248, 240);
      this.tweens.add({ targets: r.spr, alpha: 0, scale: 0.3, duration: 250, onComplete: () => r.spr.destroy() });
      const share = expShare(def.exp, GS.aliveParty().length);
      GS.aliveParty().forEach((h) => (h.exp += share));
      GS.data.pendingDeposit += def.cash;
      toast(this, `YOU WON without even fighting! +${share} EXP`);
      return;
    }
    // contact angle → swirl color (§A4.2 / Prompt 16)
    const toEnemy = new Phaser.Math.Vector2(r.spr.x - this.player.x, r.spr.y - this.player.y).normalize();
    const facingVec = this.facingVector();
    const dotF = facingVec.dot(toEnemy);
    const enemyDir = new Phaser.Math.Vector2(r.vx, r.vy).normalize();
    const enemyFleeing = enemyDir.length() > 0 && enemyDir.dot(toEnemy) > 0.4;
    let advantage: 'player' | 'enemy' | 'none' = 'none';
    if (dotF < -0.35) advantage = 'enemy'; // it got our back
    else if (enemyFleeing && dotF > 0.35) advantage = 'player'; // we got its back
    await this.startBattle([r.enemyId], advantage, r);
  }

  private facingVector(): Phaser.Math.Vector2 {
    switch (this.facing) {
      case 'up':
        return new Phaser.Math.Vector2(0, -1);
      case 'down':
        return new Phaser.Math.Vector2(0, 1);
      case 'left':
        return new Phaser.Math.Vector2(-1, 0);
      default:
        return new Phaser.Math.Vector2(1, 0);
    }
  }

  private startBattle(
    enemyIds: string[],
    advantage: 'player' | 'enemy' | 'none',
    roamer: Roamer | null,
    opts: { boss?: boolean; glint?: boolean; prayTutorial?: boolean } = {},
  ): Promise<'victory' | 'defeat' | 'ran'> {
    return new Promise((resolve) => {
      this.cut = true;
      AUDIO.sfx('swirl');
      AUDIO.stopMusic();
      const tintMap = { player: px(RAMP.RED, 2), enemy: px(RAMP.GRASS, 2), none: px(RAMP.PAPER, 1) } as const;
      const sw = this.add
        .image(this.scale.width / 2, this.scale.height / 2, 'swirl')
        .setScrollFactor(0)
        .setDepth(4000)
        .setTint(colorOf(tintMap[advantage]))
        .setScale(0.2)
        .setAlpha(0.9);
      const cover = this.add
        .rectangle(0, 0, this.scale.width, this.scale.height, 0x16101e)
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(3999)
        .setAlpha(0);
      this.tweens.add({ targets: sw, angle: 720, scale: 3.4, duration: 750, ease: 'cubic.in' });
      this.tweens.add({
        targets: cover,
        alpha: 1,
        duration: 750,
        onComplete: () => {
          sw.destroy();
          this.game.events.once(
            'mf-battle-end',
            (outcome: 'victory' | 'defeat' | 'ran') => {
              cover.destroy();
              this.cut = false;
              this.battleCooldown = this.time.now + 1200;
              if (outcome === 'victory' && roamer) {
                roamer.dead = true;
                roamer.spr.destroy();
              }
              if (outcome === 'ran' && roamer) {
                roamer.vx = Math.sign(roamer.spr.x - this.player.x) * 70;
                roamer.vy = Math.sign(roamer.spr.y - this.player.y) * 70;
              }
              if (outcome === 'defeat') {
                this.handleDefeat();
                resolve(outcome);
                return;
              }
              // a hero may have gone down (or gotten back up) in there
              this.rebuildFollowers();
              AUDIO.playMusic(this.mapDef.music);
              this.scene.resume();
              resolve(outcome);
            },
          );
          this.scene.pause();
          this.scene.launch('battle', {
            enemyIds,
            advantage,
            guestChad: GS.data.guest === 'chad',
            glintAssist: opts.glint ?? false,
            boss: opts.boss ?? false,
            prayTutorial: opts.prayTutorial ?? false,
          });
        },
      });
    });
  }

  private handleDefeat(): void {
    // §A4.7: half the cash ON HAND — banked money is safe (the S4 ATM's point)
    GS.data.cashOnHand = Math.floor(GS.data.cashOnHand / 2);
    // ADR-014 interim: revive-all until S11's hospitals own §A4.7 economics
    GS.data.party.forEach((h) => {
      h.down = false;
      h.hp = h.maxHp;
    });
    this.registry.set('defeated', true);
    // S6: wake at the last Dad-save's spot (S11's hospitals reuse respawnPoint)
    const p = GS.respawnPoint();
    this.scene.restart({ mapId: p.mapId, x: p.x, y: p.y, facing: p.facing });
  }

  /* ---------------- interactions ---------------- */

  private async interact(): Promise<void> {
    const v = this.facingVector();
    const probeX = this.player.x + v.x * 16;
    const probeY = this.player.y - 6 + v.y * 14;

    for (const n of this.npcs) {
      if (Math.hypot(n.spr.x - probeX, Math.abs(n.spr.y - 6 - probeY)) < 16) {
        await this.talkTo(n);
        return;
      }
    }
    for (const s of this.mapDef.signs) {
      if (Math.hypot(s.x * 16 + 8 - probeX, s.y * 16 + 8 - probeY) < 16) {
        AUDIO.sfx('cursor');
        await this.dlg.say(...DIALOGUE[s.dialogue]);
        return;
      }
    }
    for (const ph of this.mapDef.phones) {
      if (Math.hypot(ph.x * 16 + 8 - probeX, ph.y * 16 + 8 - probeY) < 18) {
        // S2: Mom is calling THIS payphone — answering outranks dialing out
        if (this.mapDef.id === 'brickton' && this.momCallPending()) {
          await this.momPayphoneScene();
          return;
        }
        await this.phoneFlow();
        return;
      }
    }
    // S4: the ATM at the Savings & Loan facade (Prompt 20)
    for (const a of this.mapDef.atms ?? []) {
      if (Math.hypot(a.x * 16 + 8 - probeX, a.y * 16 + 8 - probeY) < 18) {
        await this.atmFlow();
        return;
      }
    }
    // picnic tables: a small rest (full system arrives with Baskets)
    for (const p of this.mapDef.props) {
      if (p.sprite !== 'picnic') continue;
      if (Math.hypot(p.x * 16 + 18 - probeX, p.y * 16 + 12 - probeY) < 24) {
        await this.dlg.say(...DIALOGUE.picnic_rest);
        GS.data.party.forEach((h) => {
          if (!h.down) h.hp = Math.min(h.maxHp, h.hp + Math.floor(h.maxHp / 2));
        });
        AUDIO.sfx('heal');
        return;
      }
    }
    // buildings without interiors yet: a visible door always answers
    // (the drugstore and STARMART left this list in S4 — they're real doors)
    const lockedLines: Record<string, string> = {
      arcade: 'locked_arcade',
      chapel: 'locked_chapel',
      house_chad: 'locked_chad',
      house_a: 'locked_house',
      house_b: 'locked_house',
      bldg_bagels: 'locked_bagels',
      bldg_hospital: 'locked_hospital',
      bldg_brickmore: 'locked_brickmore',
      bldg_video: 'locked_video',
      bldg_bank: 'locked_bank',
      bldg_arcade2: 'locked_arcade2',
      bldg_diner: 'locked_diner',
      holding_door: 'holding_door_line',
      office_door: 'manager_door',
    };
    for (const p of this.mapDef.props) {
      const lineId = lockedLines[p.sprite];
      if (!lineId || !p.solid) continue;
      const r = {
        x: p.x * 16 + p.solid.ox - 4,
        y: p.y * 16 + p.solid.oy - 4,
        w: p.solid.w + 8,
        h: p.solid.h + 8,
      };
      if (probeX > r.x && probeX < r.x + r.w && probeY > r.y && probeY < r.y + r.h) {
        AUDIO.sfx('cursor');
        // S2 doors report their state
        if (p.sprite === 'holding_door') {
          if (GS.flag('holding_open')) {
            await this.dlg.say(...DIALOGUE.holding_open_panel);
            return;
          }
          const n = this.quotaCount();
          const pips = n > 0 ? DIALOGUE[`holding_door_${n}`] : [];
          await this.dlg.say(...DIALOGUE.holding_door_line, ...pips);
          return;
        }
        if (p.sprite === 'office_door' && GS.flag('manager_defeated')) {
          await this.dlg.say(...DIALOGUE.manager_door_after);
          return;
        }
        await this.dlg.say(...DIALOGUE[lineId]);
        return;
      }
    }
  }

  private async talkTo(n: NpcObj): Promise<void> {
    // face each other
    if (!n.def.dog) {
      const f: Facing =
        Math.abs(n.spr.x - this.player.x) > Math.abs(n.spr.y - this.player.y)
          ? n.spr.x > this.player.x
            ? 'left'
            : 'right'
          : n.spr.y > this.player.y
            ? 'up'
            : 'down';
      n.spr.anims.stop();
      n.spr.setFrame(standFrame(f));
    }
    AUDIO.sfx('cursor');
    // S4: keepers ARE their shops — talking opens the buy/sell flow
    if (n.def.shop) {
      this.openShop(n.def.shop);
      return;
    }
    if (n.def.id === 'mom') {
      if (!GS.flag('mom_gear')) {
        await this.dlg.say(...DIALOGUE.npc_mom_pre);
        GS.addItem('salt_shaker');
        GS.addItem('pbj');
        GS.setFlag('mom_gear');
        toast(this, 'Got SALT SHAKER and PB&J!');
        AUDIO.sfx('confirm');
      } else if (GS.flag('zapper_done')) {
        await this.dlg.say(...DIALOGUE.npc_mom_post);
      } else {
        await this.dlg.say(...DIALOGUE.npc_mom);
      }
      return;
    }
    await this.dlg.say(...DIALOGUE[n.def.dialogue]);
  }

  /** S4 (Prompt 20): phones list contacts — Dad saves, Mom cures Homesick.
   *  Pemberton and Pizza-to-Go join the list behind later story flags. */
  private async phoneFlow(): Promise<void> {
    AUDIO.sfx('phone');
    await this.dlg.say(...DIALOGUE.phone_pickup);
    const pick = await this.dlg.ask(['Call Dad', 'Call Mom', 'Hang up'], { cancelIndex: 2 });
    if (pick === 0) await this.callDad();
    else if (pick === 1) await this.callMom();
  }

  /** Dad's save + deposit flow (Prompt 22/S2). S6: the save lands in one of
   *  three slots — Dad asks "Which notebook?" on his FIRST save, then reuses
   *  it for the whole playthrough. The contact flow around this is untouched. */
  private async callDad(): Promise<void> {
    const gift = GS.flag('dad_first_deposit') ? 0 : 50;
    GS.setFlag('dad_first_deposit');
    const deposit = gift + GS.data.pendingDeposit;
    const pages = [...DIALOGUE.phone_dad];
    pages[2] =
      deposit > 0
        ? `@I put $${deposit} into your account. Don't spend it all on corn dogs. Spend MOST of it on corn dogs.`
        : `@Account's holding steady, champ. Like my love for you. Which is also money, somehow.`;
    GS.data.banked += deposit;
    GS.data.pendingDeposit = 0;
    await this.dlg.say(...pages);
    GS.data.map = this.mapDef.id;
    if (GS.activeSlot === null) {
      await this.dlg.say(...DIALOGUE.dad_slot_ask);
      const rows = GS.slotPeeks().map((p, i) =>
        p === 'empty'
          ? `Notebook ${SLOT_IDS[i]}: new page`
          : p === 'corrupt'
            ? `Notebook ${SLOT_IDS[i]}: smudged`
            : `Notebook ${p.slot}: ${p.name} L${p.level}`,
      );
      const idx = await this.dlg.ask(rows); // no cancel — Dad needs a notebook
      GS.saveTo(SLOT_IDS[idx]);
    } else {
      GS.saveTo(GS.activeSlot);
    }
    AUDIO.sfx('confirm');
    await this.dlg.say(...DIALOGUE.save_done);
  }

  /** Mom asks about {favoritefood}; her voice is the Homesick cure (§A4.4) */
  private async callMom(): Promise<void> {
    if (this.mapDef.id === 'rex_home') {
      await this.dlg.say(...DIALOGUE.phone_mom_home);
      return;
    }
    if (GS.flag('rex_homesick')) {
      await this.dlg.say(...DIALOGUE.phone_mom_cure);
      GS.setFlag('rex_homesick', false);
      AUDIO.sfx('heal');
      await this.dlg.say(...DIALOGUE.mom_cure_beat);
      return;
    }
    await this.dlg.say(...DIALOGUE.phone_mom);
  }

  /** S4: the SAVINGS & LOAN's ATM — withdraw/deposit between the card
   *  (GS.data.banked, where Dad deposits) and cash on hand (Prompt 20) */
  private async atmFlow(): Promise<void> {
    AUDIO.sfx('confirm');
    await this.dlg.say(...DIALOGUE.atm_greet);
    for (;;) {
      await this.dlg.say(`CARD $${GS.data.banked}   CASH $${GS.data.cashOnHand}`);
      const op = await this.dlg.ask(['Withdraw', 'Deposit', 'Done'], { cancelIndex: 2 });
      if (op === 2) break;
      const pool = op === 0 ? GS.data.banked : GS.data.cashOnHand;
      if (pool <= 0) {
        await this.dlg.say(...(op === 0 ? DIALOGUE.atm_empty_card : DIALOGUE.atm_empty_pocket));
        continue;
      }
      const presets = [10, 50, 100].filter((a) => a <= pool);
      const labels = [...presets.map((a) => `$${a}`), `All ($${pool})`, 'Back'];
      const sel = await this.dlg.ask(labels, { cancelIndex: labels.length - 1 });
      if (sel >= labels.length - 1) continue;
      const amount = sel < presets.length ? presets[sel] : pool;
      const moved = op === 0 ? GS.withdraw(amount) : GS.deposit(amount);
      AUDIO.sfx('confirm');
      await this.dlg.say(
        op === 0
          ? `* Withdrew $${moved}. The bills are warm, somehow.`
          : `* Deposited $${moved}. The machine swallowed politely.`,
      );
    }
    await this.dlg.say(...DIALOGUE.atm_bye);
  }

  /** S4: ShopScene runs over a paused world, the MenuScene pattern */
  private openShop(shopId: string): void {
    this.game.events.once('mf-shop-closed', () => {
      // gear may have moved between bags in there
      this.rebuildFollowers();
      this.scene.resume();
    });
    this.scene.pause();
    this.scene.launch('shop', { shopId });
  }

  /** START opens the real EB command menu (S3) — MenuScene runs over a
   *  paused world, exactly like battle, and tells us when it's done */
  private pauseMenu(): void {
    AUDIO.sfx('cursor');
    this.game.events.once('mf-menu-closed', () => {
      // a Spark may have revived someone, gear may have moved (S3)
      this.rebuildFollowers();
      this.scene.resume();
    });
    this.scene.pause();
    this.scene.launch('menu', { music: this.mapDef.music });
  }

  /* ---------------- doors & triggers ---------------- */

  private checkDoors(): void {
    for (const d of this.mapDef.doors) {
      const r = { x: d.x * 16, y: d.y * 16, w: d.w * 16, h: d.h * 16 };
      if (
        this.player.x > r.x &&
        this.player.x < r.x + r.w &&
        this.player.y - 4 > r.y &&
        this.player.y - 4 < r.y + r.h
      ) {
        this.goThroughDoor(d.to, d.tx, d.ty, d.facing);
        return;
      }
    }
    for (const p of this.mapDef.props) {
      if (!p.door) continue;
      const r = {
        x: p.x * 16 + p.door.ox,
        y: p.y * 16 + p.door.oy,
        w: p.door.w,
        h: p.door.h,
      };
      if (
        this.player.x > r.x &&
        this.player.x < r.x + r.w &&
        this.player.y > r.y &&
        this.player.y < r.y + r.h
      ) {
        this.goThroughDoor(p.door.to, p.door.tx, p.door.ty, 'up');
        return;
      }
    }
  }

  private goThroughDoor(to: string, tx: number, ty: number, facing: Facing): void {
    if (this.transitioning) return;
    this.transitioning = true;
    // S7 juice: doors whoosh and the camera leans in with you
    AUDIO.sfx('whoosh');
    this.cameras.main.zoomTo(1.08, 220, 'Sine.easeIn');
    this.cameras.main.fadeOut(220, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.cameras.main.setZoom(1);
      this.scene.restart({ mapId: to, x: tx, y: ty, facing });
    });
  }

  /** small heel-dust puff while running (S7 juice) */
  private dustPuff(x: number, y: number): void {
    const puff = this.add.sprite(x, y, 'dust', 0).setDepth(y - 1).setAlpha(0.85);
    this.time.delayedCall(90, () => puff.setFrame(1));
    this.tweens.add({
      targets: puff,
      y: y - 4,
      alpha: 0,
      duration: 240,
      onComplete: () => puff.destroy(),
    });
  }

  /** radial gold sparkle burst for Ember moments (S7 juice, Prompt 39) */
  private sparkleBurst(x: number, y: number, count = 10): void {
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const dist = 14 + Math.random() * 16;
      const s = this.add
        .sprite(x, y, 'spark', i % 2)
        .setDepth(9999)
        .setScale(0.8 + Math.random() * 0.6);
      this.tweens.add({
        targets: s,
        x: x + Math.cos(ang) * dist,
        y: y + Math.sin(ang) * dist - 6,
        alpha: 0,
        scale: 0.3,
        duration: 520 + Math.random() * 260,
        ease: 'cubic.out',
        onComplete: () => s.destroy(),
      });
    }
  }

  private insideTriggers = new Set<string>();

  private checkTriggers(): void {
    const txi = Math.floor(this.player.x / 16);
    const tyi = Math.floor((this.player.y - 4) / 16);
    for (const t of this.mapDef.triggers) {
      const inside =
        txi >= t.rect.x && txi < t.rect.x + t.rect.w && tyi >= t.rect.y && tyi < t.rect.y + t.rect.h;
      if (!inside) {
        this.insideTriggers.delete(t.id);
        continue;
      }
      // edge-trigger: fire on entry, not every frame while standing in it
      if (this.insideTriggers.has(t.id)) continue;
      this.insideTriggers.add(t.id);
      void this.runTrigger(t.id);
    }
  }

  /* ---------------- cutscenes (Ch.1 per §A6 / ADR-007) ---------------- */

  private async onEnterCutscenes(): Promise<void> {
    if (this.mapDef.id === 'bus_interior') {
      await this.busCutscene();
      return;
    }
    if (this.registry.get('defeated') === true) {
      this.registry.set('defeated', false);
      this.cut = true;
      await this.dlg.say(
        `${GS.hero('rex')?.name ?? 'Rex'}... pick yourself up.`,
        'The hill is still out there. So is breakfast. Handle both.',
      );
      this.cut = false;
    }
    if (this.mapDef.id === 'otterbrook' && GS.flag('intro_done') && !GS.flag('chad_joined')) {
      await this.chadJoinScene();
    }
    // S2: stepping onto the street after the Department falls — Mom's already dialing
    if (this.mapDef.id === 'brickton' && this.momCallPending()) {
      this.cut = true;
      AUDIO.sfx('phone');
      await this.dlg.say(...DIALOGUE.payphone_far);
      this.cut = false;
    }
  }

  private async runTrigger(id: string): Promise<void> {
    switch (id) {
      case 'wake_up':
        if (!GS.flag('intro_done')) await this.introScene();
        break;
      case 'crater':
        if (!GS.flag('tick_defeated')) await this.craterScene();
        break;
      case 'porch':
        if (GS.flag('ember1') && !GS.flag('zapper_done')) await this.porchScene();
        break;
      case 'bus_stop':
        if (GS.flag('zapper_done')) await this.busAsk('brickton');
        break;
      case 'bus_stop_brickton':
        await this.busAsk('otterbrook');
        break;
      case 'faye_meet':
        if (GS.flag('holding_open') && !GS.flag('faye_joined')) await this.fayeJoinScene();
        break;
      case 'manager_block':
        if (GS.flag('faye_joined') && !GS.flag('manager_defeated')) await this.managerScene();
        break;
      case 'payphone_ring':
        if (this.momCallPending()) {
          this.cut = true;
          AUDIO.sfx('phone');
          await this.dlg.say(...DIALOGUE.payphone_ringing);
          this.cut = false;
        }
        break;
      default:
        break;
    }
  }

  private async introScene(): Promise<void> {
    this.cut = true;
    GS.setFlag('intro_done');
    const cover = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0x0a0a18)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(DEPTH_UI - 1); // below the dialogue windows
    await this.dlg.say(...DIALOGUE.intro_card);
    AUDIO.sfx('thud');
    this.cameras.main.shake(900, 0.012);
    this.cameras.main.flash(500, 248, 232, 160);
    await this.wait(1000);
    this.tweens.add({ targets: cover, alpha: 0, duration: 800, onComplete: () => cover.destroy() });
    await this.wait(900);
    await this.dlg.say(...DIALOGUE.intro_wake);
    GS.setFlag('meteor_fell');
    this.cut = false;
  }

  private async chadJoinScene(): Promise<void> {
    this.cut = true;
    const chad = this.add.sprite(this.player.x + 60, this.player.y, 'chad', standFrame('left'));
    chad.setOrigin(0.5, 1).setDepth(chad.y);
    await this.tweenTo(chad, this.player.x + 18, this.player.y, 900, 'chad');
    await this.dlg.say(...DIALOGUE.chad_join);
    chad.destroy();
    GS.data.guest = 'chad';
    GS.setFlag('chad_joined');
    this.addFollower('chad');
    this.cut = false;
  }

  private async craterScene(): Promise<void> {
    this.cut = true;
    if (!GS.flag('met_glint')) {
      GS.setFlag('met_glint');
      await this.dlg.say(...DIALOGUE.crater_approach);
      const glint = this.add.sprite(15.5 * 16, 6.5 * 16, 'glint');
      glint.play('glint-flit').setDepth(9999);
      const glow = this.add.circle(glint.x, glint.y, 10, colorOf(px(RAMP.GOLD, 3)), 0.25).setDepth(9998);
      this.tweens.add({ targets: [glint, glow], y: '-=6', duration: 900, yoyo: true, repeat: -1 });
      AUDIO.sfx('ember');
      await this.dlg.say(...DIALOGUE.glint_prophecy);
      GS.data.keyItems.push('star_locket');
      await this.dlg.say(...DIALOGUE.tick_warning);
      this.cameras.main.shake(700, 0.015);
      AUDIO.sfx('thud');
      await this.wait(750);
      glint.destroy();
      glow.destroy();
    } else {
      await this.dlg.say('The crater rim bulges again. It did NOT learn its lesson.');
    }
    const outcome = await this.startBattle(['titanic_tick'], 'none', null, { boss: true, glint: true });
    if (outcome !== 'victory') return;
    // betrayal #1 resolved mid-battle (guest flag already cleared there);
    // the trail sprite still needs to go
    GS.data.guest = null;
    this.removeFollower('chad');
    GS.setFlag('tick_defeated');
    GS.setFlag('ember1');
    GS.data.embers = 1;
    this.cut = true;
    const ember = this.add.image(15.5 * 16, 7 * 16, 'ember').setDepth(9999).setScale(1);
    AUDIO.sfx('ember');
    this.sparkleBurst(ember.x, ember.y, 12);
    this.tweens.add({ targets: ember, y: this.player.y - 30, x: this.player.x, duration: 1300, ease: 'sine.inout' });
    AUDIO.playMusic('heartlight');
    await this.wait(1400);
    this.sparkleBurst(this.player.x, this.player.y - 30, 14);
    ember.destroy();
    this.cameras.main.flash(300, 248, 232, 160);
    await this.dlg.say(...DIALOGUE.ember_get);
    await this.dlg.say(...DIALOGUE.glint_after);
    AUDIO.playMusic(this.mapDef.music);
    this.cut = false;
  }

  private async porchScene(): Promise<void> {
    this.cut = true;
    GS.setFlag('zapper_done');
    const glint = this.add.sprite(this.player.x + 40, this.player.y - 40, 'glint');
    glint.play('glint-flit').setDepth(9999);
    await this.tweenTo(glint, this.player.x + 12, this.player.y - 18, 800);
    await this.dlg.say(DIALOGUE.porch_zapper[0], DIALOGUE.porch_zapper[1]);
    // the zapper claims another hero
    const zapX = 17 * 16;
    const zapY = 5.5 * 16;
    this.tweens.add({ targets: glint, x: zapX, y: zapY, duration: 700, ease: 'sine.in' });
    await this.wait(700);
    AUDIO.sfx('zapper');
    this.cameras.main.flash(280, 160, 236, 236);
    glint.destroy();
    await this.dlg.say(DIALOGUE.porch_zapper[2], DIALOGUE.porch_zapper[3], DIALOGUE.porch_zapper[4]);
    const spark = this.add.image(zapX, zapY + 10, 'pixel').setTint(colorOf(px(RAMP.GOLD, 3))).setScale(3).setDepth(9999);
    this.tweens.add({ targets: spark, x: this.player.x, y: this.player.y - 12, duration: 900, ease: 'sine.inout' });
    await this.wait(950);
    this.sparkleBurst(this.player.x, this.player.y - 12, 10);
    spark.destroy();
    GS.addItem('glints_spark');
    AUDIO.sfx('ember');
    await this.dlg.say(DIALOGUE.porch_zapper[5], DIALOGUE.porch_zapper[6]);
    this.cut = false;
  }

  /* ---------------- S2: Mia, the Manager, and Mom's call (§A6 Ch.1 end) ---------------- */

  /** §A6: meeting Mia in the holding room — she joins at L6 with her canon kit */
  private async fayeJoinScene(): Promise<void> {
    this.cut = true;
    await this.dlg.say(...DIALOGUE.faye_meet);
    AUDIO.sfx('ember');
    AUDIO.playMusic('heartlight');
    await this.dlg.say(...DIALOGUE.faye_locket);
    await this.dlg.say(...DIALOGUE.faye_join);
    // ADR-013: the Prompt-21 name flows into her battle strip and dialogue
    GS.data.party.push(makeHeroState('faye', 6, GS.data.heroNames.faye));
    GS.setFlag('faye_joined');
    // S3: the pan she took back off the intake shelf is real gear now — hers,
    // equipped (the migration registry grants it to older faye_joined saves)
    GS.addItem('hand_me_down_pan', 'faye');
    GS.equipItem('faye', 'hand_me_down_pan');
    AUDIO.sfx('confirm');
    await this.dlg.say(...DIALOGUE.faye_pan_get);
    AUDIO.jingle('levelup', 1400, null);
    // rebuild from data: her NPC gates out, the conga picks her up
    this.fadeRestart();
  }

  /** the Manager blocks the floor-3 exit: a scripted 2-Smiler fight */
  private async managerScene(): Promise<void> {
    this.cut = true;
    const office = this.mapDef.props.find((p) => p.sprite === 'office_door');
    const doorX = (office?.x ?? 10.5) * 16 + 8;
    const doorY = (office?.y ?? 0.375) * 16 + 26;
    AUDIO.sfx('cursor');
    await this.dlg.say(DIALOGUE.manager_intro[0]);
    const mgr = this.add.sprite(doorX, doorY + 8, 'manager', standFrame('down'));
    mgr.setOrigin(0.5, 1).setDepth(mgr.y);
    await this.tweenTo(mgr, this.player.x - 24, this.player.y, 2000, 'manager');
    mgr.setDepth(mgr.y);
    await this.dlg.say(...DIALOGUE.manager_intro.slice(1));
    await this.dlg.say(...DIALOGUE.manager_faye_q);
    const outcome = await this.startBattle(['blazer_smiler', 'blazer_smiler'], 'none', null, {
      boss: true,
      prayTutorial: true,
    });
    if (outcome !== 'victory') {
      mgr.destroy(); // defeat path is already restarting the scene
      return;
    }
    this.cut = true;
    GS.setFlag('manager_defeated');
    await this.tweenTo(mgr, doorX, doorY + 8, 1600, 'manager');
    mgr.destroy();
    await this.dlg.say(...DIALOGUE.manager_win);
    this.cut = false;
  }

  /** Mom is calling the payphone once the Department falls (until answered) */
  private momCallPending(): boolean {
    return !!GS.flag('manager_defeated') && !GS.flag('ch1_complete');
  }

  /** first phone tutorialized by Mom calling YOU — and Chapter 1's button */
  private async momPayphoneScene(): Promise<void> {
    this.cut = true;
    AUDIO.sfx('phone');
    await this.dlg.say(...DIALOGUE.mom_payphone);
    // §A4.4: Mom's voice is the cure, whichever direction the call went
    if (GS.flag('rex_homesick')) {
      GS.setFlag('rex_homesick', false);
      AUDIO.sfx('heal');
      await this.dlg.say(...DIALOGUE.mom_cure_beat);
    }
    GS.setFlag('ch1_complete');
    AUDIO.jingle('victory', 2200, null);
    await this.dlg.say(...DIALOGUE.faye_after_call);
    await this.dlg.say(...DIALOGUE.ch1_card);
    this.cut = false;
  }

  /* ---------------- the 6:15 (bus transition, §A5 Ch.1) ---------------- */

  private async busAsk(dest: 'brickton' | 'otterbrook'): Promise<void> {
    this.cut = true;
    await this.dlg.say(...(dest === 'brickton' ? DIALOGUE.bus_ask_brickton : DIALOGUE.bus_ask_home));
    const label = dest === 'brickton' ? 'Board the 6:15 to Brickton' : 'Ride back to Otterbrook';
    const pick = await this.dlg.ask([label, 'Stay'], { cancelIndex: 1 });
    if (pick !== 0) {
      this.cut = false;
      return;
    }
    AUDIO.stopMusic();
    // first ride to the city is the full interior scene; after that, quick hops
    if (dest === 'brickton' && !GS.flag('bus_ride_done')) {
      this.registry.set('busDest', dest);
      this.goThroughDoor('bus_interior', 296, 108, 'left');
      return;
    }
    if (dest === 'brickton') this.goThroughDoor('brickton', BRICKTON_BUS_SPAWN.x, BRICKTON_BUS_SPAWN.y, 'up');
    else this.goThroughDoor('otterbrook', 376, 442, 'up');
  }

  private async busCutscene(): Promise<void> {
    this.cut = true;
    const mapW = this.mapDef.grid[0].length * 16;
    // the window scrolls by: town first, then the approach, then the city
    const reel: Array<{ key: string; scale: number }> = [
      { key: 'tree', scale: 1 },
      { key: 'tree', scale: 0.8 },
      { key: 'house_a', scale: 0.6 },
      { key: 'tree', scale: 1 },
      { key: 'house_b', scale: 0.6 },
      { key: 'tree', scale: 0.9 },
      { key: 'skyline', scale: 1 },
      { key: 'skyline', scale: 1 },
    ];
    // scenery only exists inside the window band — the void outside the bus
    // (interiors float, ADR-004) must not show passing trees
    const maskShape = this.make.graphics({ x: 0, y: 0 }, false);
    maskShape.fillRect(0, 8, mapW, 38);
    const paneMask = maskShape.createGeometryMask();
    let frame = 0;
    const spawner = this.time.addEvent({
      delay: 520,
      loop: true,
      callback: () => {
        const item = reel[Math.min(frame, reel.length - 1)];
        frame++;
        const img = this.add
          .image(mapW + 40, 45, item.key)
          .setOrigin(0.5, 1)
          .setScale(item.scale)
          .setDepth(1) // behind the bus_windows overlay, over the sky
          .setMask(paneMask);
        this.tweens.add({
          targets: img,
          x: -60,
          duration: 2400,
          ease: 'linear',
          onComplete: () => img.destroy(),
        });
      },
    });
    await this.wait(500);
    await this.dlg.say(...DIALOGUE.npc_busdriver);
    await this.wait(700);
    await this.dlg.say(...DIALOGUE.bus_fern);
    await this.wait(700);
    await this.dlg.say(...DIALOGUE.bus_narration);
    await this.wait(900);
    spawner.remove();
    GS.setFlag('bus_ride_done');
    AUDIO.stopMusic();
    this.goThroughDoor('brickton', BRICKTON_BUS_SPAWN.x, BRICKTON_BUS_SPAWN.y, 'up');
  }

  /* ---------------- helpers ---------------- */

  private wait(ms: number): Promise<void> {
    return new Promise((r) => this.time.delayedCall(ms, r));
  }

  private tweenTo(
    target: Phaser.GameObjects.Sprite,
    x: number,
    y: number,
    ms: number,
    walkAnimId?: string,
  ): Promise<void> {
    return new Promise((r) => {
      if (walkAnimId) {
        const f: Facing = x < target.x ? 'left' : 'right';
        target.anims.play(`${walkAnimId}-walk-${f}`, true);
      }
      this.tweens.add({
        targets: target,
        x,
        y,
        duration: ms,
        onComplete: () => {
          if (walkAnimId) {
            target.anims.stop();
            target.setFrame(standFrame('down'));
          }
          r();
        },
      });
    });
  }
}
