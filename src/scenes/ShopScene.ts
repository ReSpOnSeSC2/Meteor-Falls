/**
 * ShopScene — buy/sell per GAME_BIBLE Prompt 20 (S4). Launched over a paused
 * OverworldScene exactly like MenuScene; emits 'mf-shop-closed' when done.
 *
 * BUY: stock rows show §A8 prices (unaffordable rows greyed); a purchase is
 * routed into a CHOSEN hero's bag via GS.addItem (ADR-015) with "hands are
 * full" handling, and weapons then run the SHARED confirmEquip preview
 * ("Offense up by N!", ui/pick.ts — the same code path as the menu's EQUIP
 * page, Prompt 19). SELL: from a chosen hero's bag at half price (sellPrice);
 * GS.removeItem clears a dangling equip ref when the last copy goes.
 *
 * QA recipe (ADR-008 bots): talk to a keeper (KeyZ), drain the greeting with
 * KeyZ; the command rows are BUY / SELL / LEAVE (KeyZ confirms, KeyX backs
 * out, KeyX on the command row leaves). BUY: KeyZ row → "Buy it" (KeyZ) →
 * carrier row (KeyZ; skipped solo) → weapons then offer "Equip it" (KeyZ).
 * SELL: hero row (skipped solo) → bag row → "Sell it". The world resumes on
 * the farewell line.
 */
import Phaser from 'phaser';
import { GS, type HeroState } from '../engine/state';
import { ITEMS, BAG_MAX, sellPrice, slotOf } from '../data/items';
import { SHOPS, type ShopDef } from '../data/shops';
import { DIALOGUE } from '../data/dialogue';
import { AUDIO } from '../engine/audio';
import { Dialogue, makeWindow, DEPTH_UI } from '../ui/windows';
import { pick, confirmEquip } from '../ui/pick';
import { makeItemInfo } from '../ui/iteminfo';
import { itemIconKey } from '../spritegen/icons';

export class ShopScene extends Phaser.Scene {
  private dlg!: Dialogue;
  private shop!: ShopDef;
  private cashObjs: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super('shop');
  }

  init(data: { shopId: string }): void {
    this.shop = SHOPS[data.shopId];
    this.cashObjs = [];
  }

  create(): void {
    this.dlg = new Dialogue(this);
    this.refreshCash();
    void this.mainLoop();
  }

  /** the EB cash corner, redrawn after every transaction */
  private refreshCash(): void {
    this.cashObjs.forEach((o) => o.destroy());
    const cash = `$${GS.data.cashOnHand}  BANK $${GS.data.banked}`;
    const cw = cash.length * 6 + 20;
    this.cashObjs = [
      makeWindow(this, this.scale.width - cw - 8, 8, cw, 22),
      this.add
        .bitmapText(this.scale.width - cw + 2, 15, 'retro', cash, 6)
        .setScrollFactor(0)
        .setDepth(DEPTH_UI + 1),
    ];
  }

  private async mainLoop(): Promise<void> {
    await this.dlg.say(...DIALOGUE[this.shop.greet]);
    for (;;) {
      const sel = await pick(this, {
        x: 8,
        y: 8,
        options: ['Buy', 'Sell', 'Leave'],
        startCancels: true,
      });
      if (sel < 0 || sel === 2) break;
      if (sel === 0) await this.buyLoop();
      else await this.sellLoop();
    }
    await this.dlg.say(...DIALOGUE[this.shop.farewell]);
    AUDIO.sfx('cancel');
    this.game.events.emit('mf-shop-closed');
    this.scene.stop();
  }

  /* ================= BUY ================= */

  private async buyLoop(): Promise<void> {
    for (;;) {
      const stock = this.shop.stock.map((id) => ITEMS[id]);
      const labels = stock.map((i) => `${i.name}  $${i.price}`);
      const disabled = new Set(
        stock.map((i, idx) => (i.price > GS.data.cashOnHand ? idx : -1)).filter((i) => i >= 0),
      );
      const info = makeItemInfo(this);
      const sel = await pick(this, {
        x: 96,
        y: 8,
        options: labels,
        icons: stock.map((i) => itemIconKey(i.id)),
        disabled,
        title: `${this.shop.name}  $${GS.data.cashOnHand}`,
        onHighlight: (i) => info.render(stock[i].id),
      });
      info.destroy();
      if (sel < 0) return;
      const item = stock[sel];
      const ok = await pick(this, {
        x: 200,
        y: 30,
        options: ['Buy it', 'Never mind'],
        title: `${item.name}: $${item.price}`,
      });
      if (ok !== 0) continue;
      const carrier = await this.pickCarrier();
      if (!carrier) continue;
      GS.data.cashOnHand -= item.price;
      GS.addItem(item.id, carrier.id);
      AUDIO.sfx('confirm');
      this.refreshCash();
      await this.dlg.say(`* ${carrier.name} tucked the ${item.name} away.`);
      // Prompt 20: equip-immediately-after-buy — the SAME preview/confirm the
      // menu uses (wielder tags steer it to the hero who can actually hold it)
      if (slotOf(item)) {
        const wearer = item.wielder ? GS.hero(item.wielder) : carrier;
        if (wearer && !wearer.down) await confirmEquip(this, this.dlg, wearer, item.id);
      }
    }
  }

  /** purchases land in a CHOSEN hero's bag (ADR-015), hands-full handled */
  private async pickCarrier(): Promise<HeroState | null> {
    const party = GS.data.party;
    for (;;) {
      let sel = 0;
      if (party.length > 1) {
        sel = await pick(this, {
          x: 200,
          y: 30,
          options: party.map((h) => `${h.name}  ${h.bag.length}/${BAG_MAX}`),
          title: 'Who carries it?',
        });
        if (sel < 0) return null;
      }
      const hero = party[sel];
      if (hero.bag.length >= BAG_MAX) {
        await this.dlg.say(`${hero.name}'s hands are full!`);
        if (party.length === 1) return null;
        continue;
      }
      return hero;
    }
  }

  /* ================= SELL ================= */

  private async sellLoop(): Promise<void> {
    for (;;) {
      const party = GS.data.party;
      let who = 0;
      if (party.length > 1) {
        who = await pick(this, {
          x: 96,
          y: 8,
          options: party.map((h) => `${h.name}  ${h.bag.length}/${BAG_MAX}`),
          title: 'Whose bag?',
        });
        if (who < 0) return;
      }
      const hero = party[who];
      const sold = await this.sellFrom(hero);
      if (!sold && party.length === 1) return;
      if (party.length === 1) continue;
    }
  }

  /** sell out of one hero's bag at half price; false = backed out */
  private async sellFrom(hero: HeroState): Promise<boolean> {
    for (;;) {
      if (hero.bag.length === 0) {
        await this.dlg.say(`${hero.name}'s bag contains air and ambition. No takers.`);
        return false;
      }
      const labels = hero.bag.map((id) => `${ITEMS[id].name}  $${sellPrice(ITEMS[id])}`);
      // price-0 items (Glint's Spark) aren't merchandise — they're friends
      const disabled = new Set(
        hero.bag.map((id, i) => (sellPrice(ITEMS[id]) <= 0 ? i : -1)).filter((i) => i >= 0),
      );
      const info = makeItemInfo(this);
      const sel = await pick(this, {
        x: 96,
        y: 8,
        options: labels,
        icons: hero.bag.map((id) => itemIconKey(id)),
        disabled,
        cols: labels.length > 7 ? 2 : 1,
        title: `${hero.name} sells  $${GS.data.cashOnHand}`,
        onHighlight: (i) => info.render(hero.bag[i]),
      });
      info.destroy();
      if (sel < 0) return false;
      const itemId = hero.bag[sel];
      const item = ITEMS[itemId];
      const half = sellPrice(item);
      const ok = await pick(this, {
        x: 200,
        y: 30,
        options: ['Sell it', 'Never mind'],
        title: `${item.name}: $${half}`,
      });
      if (ok !== 0) continue;
      // GS.removeItem clears a dangling equip ref when the last copy leaves
      GS.removeItem(itemId, hero.id);
      GS.data.cashOnHand += half;
      AUDIO.sfx('confirm');
      this.refreshCash();
      await this.dlg.say(`* Sold the ${item.name} for $${half}.`);
    }
  }
}
