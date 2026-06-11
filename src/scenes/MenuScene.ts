/**
 * MenuScene — the EB command menu (GAME_BIBLE Prompt 7 + 19, S3).
 * Launched over a paused OverworldScene; emits 'mf-menu-closed' when done.
 *
 * Pages: ITEMS (per-hero 14-slot bags + shared key items, Use/Give/Drop and
 * Glint's Spark's out-of-battle revive), STATUS (full §A3 sheet incl.
 * Guts/Vibe/Luck, DOWN and HOMESICK), VIBE (PP costs, greyed when unusable —
 * Pray is a battle command, ADR-014), EQUIP (weapon/body/arms/other,
 * "Offense up by N!" preview, wielder tags per §A8), LOCKET (§A4.9 —
 * Homesong stems, one per Ember), SETUP (the persisted Sound preference;
 * M still works anywhere). Everything drives by touch (rows are tap zones,
 * pages tap-dismiss) AND pad/keys (§B4). The list widget and the equip
 * preview/confirm live in ui/pick.ts since S4 — ShopScene runs the SAME
 * confirmEquip for its equip-after-buy prompt (Prompt 20).
 *
 * QA recipe (ADR-008 bots): Enter (START) on the overworld opens the menu.
 * ArrowDown/ArrowUp walk rows, KeyZ confirms, KeyX backs out one level;
 * KeyX (or Enter) on the command list closes the menu. Item lists >7 run in
 * two columns — ArrowRight/Left hop columns. Static pages (STATUS, LOCKET)
 * dismiss with KeyZ. The command list order is ITEMS STATUS VIBE EQUIP
 * LOCKET SETUP, so e.g. Equip = Down,Down,Down,KeyZ from open.
 */
import Phaser from 'phaser';
import { GS, expForLevel, type HeroState } from '../engine/state';
import { HEROES, unlockedAbilities } from '../data/heroes';
import { ITEMS, EQUIP_SLOTS, slotOf, BAG_MAX, type EquipSlot } from '../data/items';
import { ABILITIES } from '../data/abilities';
import { heroOffense, vibeHeal } from '../battle/formulas';
import { INPUT } from '../engine/input';
import { AUDIO } from '../engine/audio';
import { Dialogue, makeWindow, everyFrame, DEPTH_UI } from '../ui/windows';
// S4: the list widget + "Offense up by N!" confirm are shared with the shops
import { pick, confirmEquip, DIM, type PickOpts } from '../ui/pick';
import { colorOf, RAMP, px } from '../palette';

export class MenuScene extends Phaser.Scene {
  private dlg!: Dialogue;
  private mapMusic = '';
  private pageObjs: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super('menu');
  }

  init(data: { music?: string }): void {
    this.mapMusic = data.music ?? '';
    this.pageObjs = [];
  }

  create(): void {
    this.dlg = new Dialogue(this);
    // cash corner — EB shows your pockets next to the commands
    const cash = `$${GS.data.cashOnHand}  BANK $${GS.data.banked}`;
    const cw = cash.length * 6 + 20;
    makeWindow(this, this.scale.width - cw - 8, 8, cw, 22);
    this.add
      .bitmapText(this.scale.width - cw + 2, 15, 'retro', cash, 6)
      .setScrollFactor(0)
      .setDepth(DEPTH_UI + 1);
    void this.mainLoop();
  }

  /* ================= the command list ================= */

  private async mainLoop(): Promise<void> {
    for (;;) {
      const pick = await this.pick({
        x: 8,
        y: 8,
        options: ['ITEMS', 'STATUS', 'VIBE', 'EQUIP', 'LOCKET', 'SETUP'],
        startCancels: true,
      });
      if (pick < 0) break;
      if (pick === 0) await this.itemsPage();
      else if (pick === 1) await this.statusPage();
      else if (pick === 2) await this.vibePage();
      else if (pick === 3) await this.equipPage();
      else if (pick === 4) await this.locketPage();
      else await this.setupPage();
    }
    AUDIO.sfx('cancel');
    this.game.events.emit('mf-menu-closed');
    this.scene.stop();
  }

  /* ================= ITEMS ================= */

  private async itemsPage(): Promise<void> {
    for (;;) {
      const who = await this.pickHero({ keyItems: true });
      if (who === null) return;
      if (who === 'keys') {
        await this.keyItemsList();
        continue;
      }
      await this.bagList(who);
    }
  }

  private async bagList(hero: HeroState): Promise<void> {
    for (;;) {
      if (hero.bag.length === 0) {
        await this.dlg.say(`${hero.name}'s bag contains air and ambition.`);
        return;
      }
      const labels = hero.bag.map((id, i) => `${ITEMS[id]?.name ?? id}${this.equippedTag(hero, id, i)}`);
      const sel = await this.pick({
        x: 96,
        y: 8,
        options: labels,
        cols: labels.length > 7 ? 2 : 1,
        title: `${hero.name}  ${hero.bag.length}/${BAG_MAX}`,
      });
      if (sel < 0) return;
      await this.itemActions(hero, hero.bag[sel]);
    }
  }

  /** mark the copy that's on the hero's body (EB shows equipped gear in-bag) */
  private equippedTag(hero: HeroState, itemId: string, idx: number): string {
    const equipped = EQUIP_SLOTS.some((s) => hero.equip[s] === itemId);
    return equipped && hero.bag.indexOf(itemId) === idx ? ' (E)' : '';
  }

  private async itemActions(hero: HeroState, itemId: string): Promise<void> {
    const item = ITEMS[itemId];
    if (!item) return;
    const wielderInParty =
      slotOf(item) !== null && (!item.wielder || GS.hero(item.wielder) !== undefined);
    const actions = wielderInParty ? ['Equip', 'Use', 'Give', 'Drop'] : ['Use', 'Give', 'Drop'];
    const sel = await this.pick({ x: 200, y: 30, options: actions, title: item.name });
    if (sel < 0) return;
    const action = actions[sel];

    if (action === 'Equip') {
      const wearer = item.wielder ? GS.hero(item.wielder) : hero;
      if (wearer) await this.confirmEquip(wearer, itemId);
      return;
    }
    if (action === 'Use') {
      await this.useItem(hero, itemId);
      return;
    }
    if (action === 'Give') {
      const others = GS.data.party.filter((h) => h !== hero);
      if (others.length === 0) {
        await this.dlg.say('There is nobody else to hold things yet.');
        return;
      }
      const t = await this.pick({ x: 200, y: 30, options: others.map((h) => h.name), title: 'To who?' });
      if (t < 0) return;
      const target = others[t];
      if (target.bag.length >= BAG_MAX) {
        await this.dlg.say(`${target.name}'s hands are full!`);
        return;
      }
      GS.removeItem(itemId, hero.id);
      GS.addItem(itemId, target.id);
      AUDIO.sfx('confirm');
      await this.dlg.say(`${hero.name} handed the ${item.name} to ${target.name}.`);
      return;
    }
    // Drop
    GS.removeItem(itemId, hero.id);
    AUDIO.sfx('cancel');
    await this.dlg.say(`* Left the ${item.name} behind. Somebody's lucky day.`);
  }

  private async useItem(hero: HeroState, itemId: string): Promise<void> {
    const item = ITEMS[itemId];
    if (item.kind === 'food' && item.heal) {
      const alive = GS.aliveParty();
      const t =
        alive.length === 1
          ? 0
          : await this.pick({ x: 200, y: 30, options: alive.map((h) => h.name), title: 'Who eats?' });
      if (t < 0) return;
      const eater = alive[t];
      eater.hp = Math.min(eater.maxHp, eater.hp + item.heal);
      GS.removeItem(itemId, hero.id);
      AUDIO.sfx('heal');
      await this.dlg.say(`${eater.name} ate the ${item.name}. Recovered about ${item.heal} HP!`);
      return;
    }
    // S4: the Star Cola line — PP comes back fizzing (§A8 "PP" items)
    if (item.ppHeal) {
      const alive = GS.aliveParty();
      const t =
        alive.length === 1
          ? 0
          : await this.pick({ x: 200, y: 30, options: alive.map((h) => h.name), title: 'Who drinks?' });
      if (t < 0) return;
      const drinker = alive[t];
      drinker.pp = Math.min(drinker.maxPp, drinker.pp + item.ppHeal);
      GS.removeItem(itemId, hero.id);
      AUDIO.sfx('heal');
      await this.dlg.say(`${drinker.name} drank the ${item.name}. About ${item.ppHeal} PP fizzed back!`);
      return;
    }
    if (item.id === 'glints_spark') {
      // §A8 "revive, rare" — the interim path back until hospitals (S11)
      const downed = GS.data.party.filter((h) => h.down);
      if (downed.length === 0) {
        await this.dlg.say('The spark glows, patient. Nobody needs it right now.');
        return;
      }
      const t =
        downed.length === 1
          ? 0
          : await this.pick({ x: 200, y: 30, options: downed.map((h) => h.name), title: 'For who?' });
      if (t < 0) return;
      const target = downed[t];
      GS.removeItem(itemId, hero.id);
      target.down = false;
      target.hp = target.maxHp;
      AUDIO.sfx('ember');
      await this.dlg.say(`The spark flares. ${target.name} got back up, blinking, like it's Saturday.`);
      return;
    }
    await this.dlg.say(item.text);
  }

  private async keyItemsList(): Promise<void> {
    const keys = GS.data.keyItems;
    if (keys.length === 0) {
      await this.dlg.say("No key items yet. The lint doesn't count.");
      return;
    }
    for (;;) {
      const sel = await this.pick({
        x: 96,
        y: 8,
        options: keys.map((id) => ITEMS[id]?.name ?? id),
        title: 'KEY ITEMS',
      });
      if (sel < 0) return;
      await this.dlg.say(ITEMS[keys[sel]]?.text ?? '...');
    }
  }

  /* ================= STATUS ================= */

  private async statusPage(): Promise<void> {
    for (;;) {
      const hero = await this.pickHero();
      if (hero === null || hero === 'keys') return;
      this.renderStatus(hero);
      await this.waitDismiss();
      this.clearPage();
      if (GS.data.party.length === 1) return;
    }
  }

  /** the full §A3 sheet: HP/PP, all six stats, EXP, equipment, DOWN state */
  private renderStatus(h: HeroState): void {
    const x = 96;
    const y = 8;
    const w = 184; // stops short of the cash corner
    this.pageObjs.push(makeWindow(this, x, y, w, 152));
    const line = (ty: number, s: string, tint?: number): void => {
      const t = this.add
        .bitmapText(x + 12, y + ty, 'retro', s, 6)
        .setScrollFactor(0)
        .setDepth(DEPTH_UI + 1);
      if (tint !== undefined) t.setTint(tint);
      this.pageObjs.push(t);
    };
    line(10, `${h.name}  L${h.level}`);
    if (h.down) {
      const d = this.add
        .bitmapText(x + w - 44, y + 10, 'retro', 'DOWN', 6)
        .setScrollFactor(0)
        .setDepth(DEPTH_UI + 1)
        .setTint(colorOf(px(RAMP.RED, 2)));
      this.pageObjs.push(d);
    } else if (h.id === 'rex' && GS.flag('rex_homesick') === true) {
      // §A4.8: HOMESICK rides the save until Mom's call (S4)
      const d = this.add
        .bitmapText(x + w - 64, y + 10, 'retro', 'HOMESICK', 6)
        .setScrollFactor(0)
        .setDepth(DEPTH_UI + 1)
        .setTint(colorOf(px(RAMP.CYAN, 2)));
      this.pageObjs.push(d);
    }
    line(22, HEROES[h.id].epithet, DIM);
    line(40, `HP ${h.hp}/${h.maxHp}    PP ${h.pp}/${h.maxPp}`);
    const s = h.stats;
    line(58, `Offense ${heroOffense(h)}   Defense ${s.defense}`);
    line(70, `Speed   ${s.speed}   Guts    ${s.guts}`);
    line(82, `Vibe    ${s.vibe}   Luck    ${s.luck}`);
    const weapon = h.equip.weapon ? ITEMS[h.equip.weapon]?.name : undefined;
    line(100, `Weapon  ${weapon ?? 'Nothing'}`, weapon ? undefined : DIM);
    line(118, `EXP ${h.exp}`);
    line(130, `Next level in ${Math.max(0, expForLevel(h.level + 1) - h.exp)}`, DIM);
  }

  /* ================= VIBE ================= */

  private async vibePage(): Promise<void> {
    for (;;) {
      const hero = await this.pickHero();
      if (hero === null || hero === 'keys') return;
      await this.vibeList(hero);
      if (GS.data.party.length === 1) return;
    }
  }

  private async vibeList(hero: HeroState): Promise<void> {
    // Pray is a battle command, not a menu vibe (ADR-014)
    const ids = unlockedAbilities(hero.id, hero.level).filter(
      (id) => ABILITIES[id] !== undefined && ABILITIES[id].kind !== 'pray',
    );
    if (ids.length === 0) {
      await this.dlg.say(`${hero.name} searched for the old light... not yet.`);
      return;
    }
    for (;;) {
      const usable = (id: string): boolean => {
        const a = ABILITIES[id];
        return a.heal === true && a.power > 0 && !hero.down && hero.pp >= a.pp;
      };
      const labels = ids.map((id) => `${ABILITIES[id].name}  ${ABILITIES[id].pp}pp`);
      const disabled = new Set(ids.map((id, i) => (usable(id) ? -1 : i)).filter((i) => i >= 0));
      const sel = await this.pick({
        x: 96,
        y: 8,
        options: labels,
        disabled,
        cols: labels.length > 7 ? 2 : 1,
        title: `${hero.name}  PP ${hero.pp}/${hero.maxPp}`,
      });
      if (sel < 0) return;
      const ab = ABILITIES[ids[sel]];
      const alive = GS.aliveParty();
      const t =
        alive.length === 1
          ? 0
          : await this.pick({ x: 200, y: 30, options: alive.map((h) => h.name), title: 'On who?' });
      if (t < 0) continue;
      const target = alive[t];
      hero.pp -= ab.pp;
      const amount = vibeHeal(ab.power, hero.stats.vibe, Math.random);
      target.hp = Math.min(target.maxHp, target.hp + amount);
      AUDIO.sfx('heal');
      await this.dlg.say(ab.text.replaceAll('{user}', hero.name), `${target.name} recovered about ${amount} HP!`);
    }
  }

  /* ================= EQUIP ================= */

  private async equipPage(): Promise<void> {
    for (;;) {
      const hero = await this.pickHero();
      if (hero === null || hero === 'keys') return;
      await this.slotList(hero);
      if (GS.data.party.length === 1) return;
    }
  }

  private async slotList(hero: HeroState): Promise<void> {
    const slotName: Record<EquipSlot, string> = {
      weapon: 'Weapon',
      body: 'Body  ',
      arms: 'Arms  ',
      other: 'Other ',
    };
    for (;;) {
      const labels = EQUIP_SLOTS.map((s) => {
        const id = hero.equip[s];
        return `${slotName[s]}  ${id ? (ITEMS[id]?.name ?? id) : 'Nothing'}`;
      });
      const sel = await this.pick({ x: 96, y: 8, options: labels, title: hero.name });
      if (sel < 0) return;
      await this.slotCandidates(hero, EQUIP_SLOTS[sel]);
    }
  }

  private async slotCandidates(hero: HeroState, slot: EquipSlot): Promise<void> {
    // equip-from-anyone's-bag (Prompt 19), filtered by slot + wielder tag (§A8)
    const cands: Array<{ itemId: string; owner: HeroState }> = [];
    for (const h of GS.data.party) {
      for (const itemId of h.bag) {
        const def = ITEMS[itemId];
        if (!def || slotOf(def) !== slot) continue;
        if (def.wielder && def.wielder !== hero.id) continue;
        cands.push({ itemId, owner: h });
      }
    }
    if (cands.length === 0 && !hero.equip[slot]) {
      await this.dlg.say('Nothing fits there yet. The world provides eventually.');
      return;
    }
    const labels = cands.map(
      (c) => `${ITEMS[c.itemId].name}${c.owner === hero ? '' : `  -${c.owner.name}`}`,
    );
    labels.push('Remove');
    const sel = await this.pick({ x: 130, y: 22, options: labels, title: slotName(slot) });
    if (sel < 0) return;
    if (sel === labels.length - 1) {
      if (hero.equip[slot]) {
        GS.unequip(hero.id, slot);
        AUDIO.sfx('cancel');
      }
      return;
    }
    await this.confirmEquip(hero, cands[sel].itemId);
  }

  /** Prompt 19's preview/confirm — the SHARED flow (ui/pick.ts) the shops
   *  reuse for their equip-after-buy prompt (Prompt 20, S4) */
  private confirmEquip(hero: HeroState, itemId: string): Promise<void> {
    return confirmEquip(this, this.dlg, hero, itemId);
  }

  /* ================= LOCKET (§A4.9) ================= */

  private async locketPage(): Promise<void> {
    if (!GS.data.keyItems.includes('star_locket')) {
      await this.dlg.say('You have a pocket. In it: lint, mostly.');
      return;
    }
    const n = GS.data.embers;
    const x = 96;
    const y = 8;
    const w = 230;
    this.pageObjs.push(makeWindow(this, x, y, w, 120));
    const title = this.add
      .bitmapText(x + w / 2, y + 12, 'retro', 'THE STAR LOCKET', 6)
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH_UI + 1)
      .setTint(colorOf(px(RAMP.GOLD, 3)));
    this.pageObjs.push(title);
    // eight sockets — one Heartlight each (§A4.9)
    for (let i = 0; i < 8; i++) {
      const ex = x + 28 + i * 25;
      const img = this.add
        .image(ex, y + 44, 'ember')
        .setScrollFactor(0)
        .setDepth(DEPTH_UI + 1);
      if (i < n) {
        this.tweens.add({
          targets: img,
          scale: { from: 1, to: 1.25 },
          duration: 900 + i * 90,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inout',
        });
      } else {
        img.setAlpha(0.18);
      }
      this.pageObjs.push(img);
    }
    const count = this.add
      .bitmapText(x + w / 2, y + 64, 'retro', `HEARTLIGHTS: ${n}/8`, 6)
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH_UI + 1);
    this.pageObjs.push(count);
    const flavor =
      n === 0
        ? '(It is quiet. It is waiting for the first Heartlight.)'
        : n === 1
          ? '(One instrument plays, all alone, and refuses to be sad about it.)'
          : `(${n} instruments find each other across the dark.)`;
    const fl = this.add
      .bitmapText(x + w / 2, y + 86, 'retro', flavor, 6)
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH_UI + 1)
      .setMaxWidth(w - 24)
      .setCenterAlign()
      .setTint(DIM);
    this.pageObjs.push(fl);
    // the Homesong grows one stem per Ember; with none it stays politely quiet
    if (n > 0) AUDIO.playMusic('homesong', n);
    await this.waitDismiss();
    this.clearPage();
    if (n > 0) AUDIO.playMusic(this.mapMusic || null);
  }

  /* ================= SETUP ================= */

  private async setupPage(): Promise<void> {
    const hint = this.add
      .bitmapText(96, 66, 'retro', '(M on a keyboard flips it anywhere)', 6)
      .setScrollFactor(0)
      .setDepth(DEPTH_UI + 1)
      .setTint(DIM);
    this.pageObjs.push(hint);
    for (;;) {
      const sel = await this.pick({
        x: 96,
        y: 8,
        options: [`Sound: ${AUDIO.muted ? 'OFF' : 'ON'}`, 'Back'],
        title: 'SETUP',
      });
      if (sel !== 0) break;
      AUDIO.toggleMuted();
      AUDIO.sfx('confirm');
    }
    this.clearPage();
  }

  /* ================= shared plumbing ================= */

  /** party picker; returns the hero, 'keys' for the shared key bag, null on B */
  private async pickHero(opts: { keyItems?: boolean } = {}): Promise<HeroState | 'keys' | null> {
    const party = GS.data.party;
    const withKeys = opts.keyItems === true;
    if (party.length === 1 && !withKeys) return party[0];
    const labels = party.map((h) => `${h.name}${h.down ? ' (down)' : ''}`);
    if (withKeys) labels.push('KEY ITEMS');
    const sel = await this.pick({ x: 96, y: 8, options: labels });
    if (sel < 0) return null;
    if (withKeys && sel === labels.length - 1) return 'keys';
    return party[sel];
  }

  /** the one list widget — shared with the shops since S4 (ui/pick.ts) */
  private pick(opts: PickOpts): Promise<number> {
    return pick(this, opts);
  }

  /** static pages dismiss on A/B, START, or a tap anywhere */
  private waitDismiss(): Promise<void> {
    return new Promise((resolve) => {
      let done = false;
      const finish = (): void => {
        if (done) return;
        done = true;
        this.input.off('pointerdown', finish);
        off();
        AUDIO.sfx('cursor');
        resolve();
      };
      const off = everyFrame(this, () => {
        if (INPUT.justPressed('A') || INPUT.justPressed('B') || INPUT.justPressed('START')) finish();
      });
      this.input.on('pointerdown', finish);
    });
  }

  private clearPage(): void {
    this.pageObjs.forEach((o) => o.destroy());
    this.pageObjs = [];
  }
}

function slotName(slot: EquipSlot): string {
  return slot[0].toUpperCase() + slot.slice(1);
}
