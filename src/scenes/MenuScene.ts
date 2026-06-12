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
 * two columns — ArrowRight/Left hop columns. Static pages (STATUS, LOCKET,
 * a JOURNAL detail) dismiss with KeyZ. The command list order is ITEMS
 * STATUS VIBE EQUIP JOURNAL LOCKET SETUP (S9 inserted JOURNAL after EQUIP),
 * so e.g. Equip = Down,Down,Down,KeyZ and Journal = Down ×4, KeyZ from open.
 * JOURNAL rows are started/finished §A10 quests (phone icon = caller
 * earned); confirming a row opens its detail page, B/back/tap closes.
 */
import Phaser from 'phaser';
import { GS, expForLevel, type HeroState } from '../engine/state';
import { HEROES, availableAbilities } from '../data/heroes';
import { ITEMS, EQUIP_SLOTS, slotOf, BAG_MAX, type EquipSlot } from '../data/items';
import { ABILITIES } from '../data/abilities';
import { MAPS } from '../data/maps';
import { DIALOGUE } from '../data/dialogue';
import { journalQuests, currentObjective, objectiveDone, callerEarned } from '../engine/quests';
import { heroOffense, heroDefense, heroLuck, heroSpeed, heroGuts, vibeHeal } from '../battle/formulas';
import { INPUT, type BindingProfile, type Btn } from '../engine/input';
import { AUDIO } from '../engine/audio';
import { Dialogue, makeWindow, everyFrame, vars, DEPTH_UI } from '../ui/windows';
import { WINDOW_FLAVORS } from '../spritegen/ui';
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
        options: ['ITEMS', 'STATUS', 'VIBE', 'EQUIP', 'JOURNAL', 'LOCKET', 'SETUP'],
        startCancels: true,
      });
      if (pick < 0) break;
      if (pick === 0) await this.itemsPage();
      else if (pick === 1) await this.statusPage();
      else if (pick === 2) await this.vibePage();
      else if (pick === 3) await this.equipPage();
      else if (pick === 4) await this.journalPage();
      else if (pick === 5) await this.locketPage();
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

  /** §A4.5 (S14): is the player standing at a picnic table right now? */
  private nearPicnicTable(): boolean {
    const map = MAPS[GS.data.map];
    if (!map) return false;
    return map.props.some(
      (p) => p.sprite === 'picnic' && Math.hypot(p.x * 16 + 18 - GS.data.x, p.y * 16 + 12 - GS.data.y) < 44,
    );
  }

  private async useItem(hero: HeroState, itemId: string): Promise<void> {
    const item = ITEMS[itemId];
    // §A4.5 (S14): baskets are TABLE-ONLY — at one, the menu closes onto the
    // picnic (OverworldScene picks the handoff up); anywhere else, canon says
    if (item.kind === 'basket') {
      if (!this.nearPicnicTable()) {
        await this.dlg.say(...DIALOGUE.picnic_no_spot);
        return;
      }
      this.registry.set('picnicBasket', itemId);
      AUDIO.sfx('confirm');
      this.game.events.emit('mf-menu-closed');
      this.scene.stop();
      return;
    }
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
    // Defense reads through the 'body'-slot armor (S10 — the Champion Jacket)
    line(58, `Offense ${heroOffense(h)}   Defense ${heroDefense(h)}`);
    // Speed/Guts read through the 'arms' slot (S12 — THE STARTING FOUR)
    line(70, `Speed   ${heroSpeed(h)}   Guts    ${heroGuts(h)}`);
    // Luck reads through the 'other'-slot charm (S9 — the Lucky Collar)
    line(82, `Vibe    ${s.vibe}   Luck    ${heroLuck(h)}`);
    const weapon = h.equip.weapon ? ITEMS[h.equip.weapon]?.name : undefined;
    line(96, `Weapon  ${weapon ?? 'Nothing'}`, weapon ? undefined : DIM);
    const body = h.equip.body ? ITEMS[h.equip.body]?.name : undefined;
    line(106, `Body    ${body ?? 'Nothing'}`, body ? undefined : DIM);
    const arms = h.equip.arms ? ITEMS[h.equip.arms]?.name : undefined;
    line(116, `Arms    ${arms ?? 'Nothing'}`, arms ? undefined : DIM);
    line(126, `EXP ${h.exp}`);
    line(138, `Next level in ${Math.max(0, expForLevel(h.level + 1) - h.exp)}`, DIM);
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
    const ids = availableAbilities(hero.id, hero.level, (f) => GS.flag(f) === true).filter(
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

  /* ================= JOURNAL (S9 / Bible Prompt 26) ================= */

  /**
   * The §A10 quest journal: one row per started quest, in-voice summaries,
   * map markers OFF (EB didn't hold hands). A tiny phone icon marks every
   * earned caller — the ledger the finale will dial (§A6 Ch.8). Rows are
   * the shared pick() widget: keys, pad, AND per-row taps; B (and the
   * hardware back button, ADR-026) closes. Details are static pages that
   * dismiss like STATUS.
   */
  private async journalPage(): Promise<void> {
    for (;;) {
      const quests = journalQuests();
      if (quests.length === 0) {
        await this.dlg.say("The journal is empty. Nobody needs a hand yet. Otterbrook is suspiciously fine.");
        return;
      }
      const sel = await this.pick({
        x: 96,
        y: 8,
        options: quests.map((q) => q.def.name),
        icons: quests.map((q) => (callerEarned(q.def.id) ? 'phone_icon' : undefined)),
        title: 'JOURNAL',
      });
      if (sel < 0) return;
      this.renderQuestDetail(quests[sel].def.id);
      await this.waitDismiss();
      this.clearPage();
    }
  }

  /** one quest's page: every objective line, done steps dimmed, the earned
   *  caller noted in-voice under the rule that sincerity is never the joke */
  private renderQuestDetail(questId: string): void {
    const q = journalQuests().find((j) => j.def.id === questId);
    if (!q) return;
    const x = 96;
    const y = 8;
    const w = 230;
    const lines: Array<{ s: string; tint?: number }> = [];
    if (q.status === 'done') {
      lines.push({ s: 'Done. Handled. Legendary.', tint: colorOf(px(RAMP.GOLD, 2)) });
      lines.push({ s: `${q.def.caller.name} owes you a phone call.`, tint: DIM });
    } else {
      const now = currentObjective(q.def);
      for (const o of q.def.objectives) {
        if (objectiveDone(o)) lines.push({ s: `- ${vars(o.text)}`, tint: DIM });
        else if (o === now) lines.push({ s: `> ${vars(o.text)}` });
      }
    }
    const h = 46 + lines.length * 16;
    this.pageObjs.push(makeWindow(this, x, y, w, h));
    const title = this.add
      .bitmapText(x + 12, y + 10, 'retro', q.def.name.toUpperCase(), 6)
      .setScrollFactor(0)
      .setDepth(DEPTH_UI + 1)
      .setTint(colorOf(px(RAMP.GOLD, 3)));
    this.pageObjs.push(title);
    if (callerEarned(questId)) {
      const icon = this.add
        .image(x + w - 18, y + 13, 'phone_icon')
        .setScrollFactor(0)
        .setDepth(DEPTH_UI + 1);
      this.pageObjs.push(icon);
    }
    lines.forEach((l, i) => {
      const t = this.add
        .bitmapText(x + 12, y + 30 + i * 16, 'retro', l.s, 6)
        .setScrollFactor(0)
        .setDepth(DEPTH_UI + 1)
        .setMaxWidth(w - 24);
      if (l.tint !== undefined) t.setTint(l.tint);
      this.pageObjs.push(t);
    });
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

  /* ================= SETUP (S14b — the player-facing settings suite) =================
   * Sound · Text speed (3 paces) · Window flavor (the EB four — per SAVE
   * FILE via the win_flavor flag, Prompt 6 canon) · Controls (full rebind
   * page below) · Return to Title (confirmed; Dad keeps what he wrote).
   * Every row applies INSTANTLY — the pick widget rebuilds per loop, so a
   * flavor change repaints the very next window you see. */

  private async setupPage(): Promise<void> {
    const hint = this.add
      .bitmapText(96, 124, 'retro', '(M on a keyboard flips sound anywhere)', 6)
      .setScrollFactor(0)
      .setDepth(DEPTH_UI + 1)
      .setTint(DIM);
    this.pageObjs.push(hint);
    const SPEEDS = ['PATIENT', 'NORMAL', 'BRISK'];
    for (;;) {
      const flavor = Number(GS.flag('win_flavor')) || 0;
      const rawSpeed = GS.flag('text_speed');
      const speed = rawSpeed === false ? 1 : Number(rawSpeed); // unset = NORMAL
      const speedIdx = speed === 0 || speed === 1 || speed === 2 ? speed : 1;
      const sel = await this.pick({
        x: 96,
        y: 8,
        options: [
          `Sound: ${AUDIO.muted ? 'OFF' : 'ON'}`,
          `Text speed: ${SPEEDS[speedIdx]}`,
          `Window flavor: ${WINDOW_FLAVORS[flavor]?.name ?? 'CLASSIC'}`,
          'Main Controls',
          'Basketball Controls',
          'Return to Title',
          'Back',
        ],
        title: 'SETUP',
      });
      if (sel === 0) {
        AUDIO.toggleMuted();
        AUDIO.sfx('confirm');
        continue;
      }
      if (sel === 1) {
        GS.setFlag('text_speed', (speedIdx + 1) % 3);
        AUDIO.sfx('confirm');
        continue;
      }
      if (sel === 2) {
        // cycle the flavor; the next window drawn wears it (live preview)
        GS.setFlag('win_flavor', (flavor + 1) % WINDOW_FLAVORS.length);
        AUDIO.sfx('confirm');
        continue;
      }
      if (sel === 3) {
        hint.setVisible(false);
        await this.controlsPage('main');
        hint.setVisible(true);
        continue;
      }
      if (sel === 4) {
        hint.setVisible(false);
        await this.controlsPage('hoops');
        hint.setVisible(true);
        continue;
      }
      if (sel === 5) {
        if (await this.returnToTitle()) return;
        continue;
      }
      break;
    }
    this.clearPage();
  }

  /** S14b: the close/reset path home — confirmed, never accidental. Saved
   *  progress is safe in Dad's notebook; the unsaved tail is named honestly. */
  private async returnToTitle(): Promise<boolean> {
    await this.dlg.say('Head back to the title screen?', '* Dad keeps everything he wrote down. Anything since his last call goes back to lint.');
    const pick = await this.dlg.ask(['Stay here', 'Return to Title'], { cancelIndex: 0 });
    if (pick !== 1) return false;
    AUDIO.sfx('confirm');
    AUDIO.stopMusic();
    this.clearPage();
    this.scene.stop('overworld');
    this.scene.start('title');
    return true;
  }

  /* ================= SETUP → CONTROLS (S12c, rebuilt S14b) =================
   * THE BINDING TABLE, production pass: the rebind list on the left, a
   * WHAT-THEY-DO legend riding beside it (one line per action across the
   * whole game — overworld / battle / cage / links), press-to-capture with
   * a pulsing capture card, and the conflict rule the InputBus enforces:
   * a captured key is STOLEN from whichever action held it (that action
   * falls back to its default). Persisted device-local — never save data. */

  private async controlsPage(profile: BindingProfile): Promise<void> {
    const ROLES: Array<{ b: Btn; does: string }> =
      profile === 'hoops'
        ? [
            { b: 'A', does: 'shoot-block-finish' },
            { b: 'B', does: 'pass-steal-cancel' },
            { b: 'X', does: 'sprint-slide' },
            { b: 'Y', does: 'dribble moves' },
            { b: 'START', does: 'pause' },
          ]
        : [
            { b: 'A', does: 'confirm-bash-swing' },
            { b: 'B', does: 'cancel-run' },
            { b: 'X', does: 'sprint (links)' },
            { b: 'Y', does: 'spare action' },
            { b: 'START', does: 'menu-pause' },
          ];
    const keyName = (code: string): string =>
      code
        .replace(/^Key/, '')
        .replace(/^Digit/, '')
        .replace(/^Arrow/, '')
        .replace('ShiftLeft', 'SHIFT')
        .replace('ShiftRight', 'R-SHIFT')
        .replace('ControlLeft', 'CTRL')
        .replace('Space', 'SPACE')
        .replace('Enter', 'ENTER')
        .toUpperCase();
    // the legend panel (static): what each action means everywhere
    const legend = makeWindow(this, 212, 30, 184, 110);
    const legendTitle = this.add
      .bitmapText(222, 38, 'retro', profile === 'hoops' ? 'HOOPS ACTIONS' : 'MAIN ACTIONS', 6)
      .setScrollFactor(0)
      .setDepth(DEPTH_UI + 1)
      .setTint(colorOf(px(RAMP.GOLD, 3)));
    const legendRows = ROLES.map(({ b, does }, i) =>
      this.add
        .bitmapText(222, 52 + i * 13, 'retro', `${b.padEnd(6)}${does}`, 6)
        .setScrollFactor(0)
        .setDepth(DEPTH_UI + 1)
        .setTint(i % 2 === 0 ? colorOf(px(RAMP.PAPER, 3)) : colorOf(px(RAMP.PAPER, 2))),
    );
    const footer = this.add
      .bitmapText(212, 146, 'retro', 'Pick a row, press the new key\nor pad button. A stolen key\nfalls back to its old default.', 6)
      .setScrollFactor(0)
      .setDepth(DEPTH_UI + 1)
      .setTint(DIM);
    this.pageObjs.push(legend, legendTitle, footer, ...legendRows);
    for (;;) {
      const rows = ROLES.map(({ b }) => {
        // long key chords get elided so the pad column never collides
        const bindings = INPUT.bindingsFor(profile);
        const names = bindings.keys[b].map(keyName);
        const keys = names.length > 2 ? `${names[0]}+..` : names.join('+');
        const pads = bindings.pad[b].map((i) => `BTN ${i}`).join('+');
        return `${b.padEnd(6)}${keys.padEnd(10)}${pads}`;
      });
      const sel = await this.pick({
        x: 8,
        y: 8,
        options: [...rows, 'Reset to defaults', 'Back'],
        title: profile === 'hoops' ? 'HOOPS CONTROLS' : 'MAIN CONTROLS',
      });
      if (sel < 0 || sel === rows.length + 1) break;
      if (sel === rows.length) {
        INPUT.resetBindings(profile);
        AUDIO.sfx('confirm');
        continue;
      }
      await this.captureBinding(ROLES[sel].b, ROLES[sel].does, profile);
    }
    legend.destroy();
    legendTitle.destroy();
    footer.destroy();
    legendRows.forEach((t) => t.destroy());
  }

  /** one capture: the next keydown or fresh pad press rebinds; the card
   *  pulses while listening; tap/click cancels (B-key escape is impossible
   *  mid-capture — the press would be swallowed as the new binding) */
  private captureBinding(btn: Btn, role: string, profile: BindingProfile): Promise<void> {
    const w = makeWindow(this, 60, 80, 280, 56);
    const t = this.add
      .bitmapText(200, 92, 'retro', `${btn} — ${role}\nPRESS THE NEW KEY OR PAD BUTTON\n(tap or click to cancel)`, 6)
      .setOrigin(0.5, 0)
      .setCenterAlign()
      .setScrollFactor(0)
      .setDepth(DEPTH_UI + 3);
    let pulse = 0;
    const offPulse = everyFrame(this, (dt) => {
      pulse += dt;
      t.setTint(colorOf(px(RAMP.GOLD, pulse % 700 < 350 ? 3 : 2)));
    });
    return new Promise((resolve) => {
      const done = (): void => {
        offPulse();
        this.input.off('pointerdown', cancel);
        w.destroy();
        t.destroy();
        resolve();
      };
      const cancel = (): void => {
        cancelCapture();
        AUDIO.sfx('cancel');
        done();
      };
      const cancelCapture = INPUT.captureNext((source, code) => {
        if (source === 'key') INPUT.rebindKey(btn, code as string, profile);
        else INPUT.rebindPad(btn, code as number, profile);
        AUDIO.sfx('confirm');
        done();
      });
      this.input.on('pointerdown', cancel);
    });
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
