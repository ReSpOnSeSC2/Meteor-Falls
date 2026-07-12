/**
 * VehicleShopScene — Bert's real, authored-vehicle showroom.
 *
 * The scene is deliberately separate from ShopScene: a vehicle is a persistent
 * title with fuel, location, garage and active-ride state, not an inventory
 * item.  Catalog reads come from the vehicle domain and every mutation crosses
 * the same atomic seam.  This scene never edits cash, keyItems, fuel, garage,
 * carLocation or activeVehicle itself.
 *
 * Launch contract:
 *   scene.launch('vehicle-shop', {
 *     area: 'otterbrook',
 *     filter: 'all' | 'bikes' | 'powered' | 'cars' | ['commuter', ...],
 *     dealerName: "Bert's Auto Mart",
 *     featuredVehicleId: 'commuter',
 *     parking: { area: 'otterbrook', x, y, facing },
 *   });
 *
 * It can be launched over an already-paused overworld (the normal pattern), or
 * directly: in the latter case it owns the pause and restores it on close.  A
 * single `mf-vehicle-shop-closed` event is emitted in either case.
 */
import Phaser from 'phaser';
import { GS } from '../engine/state';
import type { VehicleParkingState } from '../engine/state';
import {
  chooseActiveVehicle,
  currentVehicleChapter,
  purchaseVehicle,
  sellVehicle,
  tradeVehicle,
  vehicleCatalog,
  vehicleServiceableAtArea,
} from '../engine/vehicle-domain';
import type { VehicleFilter, VehicleView } from '../engine/vehicle-domain';
import { AUDIO } from '../engine/audio';
import { VEHICLE_SPECS } from '../spritegen/vehicles';
import { s } from '../spritegen/scale';
import { colorOf, px, RAMP } from '../palette';
import { glyphify, money } from '../ui/text';
import { pick } from '../ui/pick';
import { DEPTH_UI, Dialogue, makeCashBox, makeWindow } from '../ui/windows';
import {
  compactVehicleRange,
  featuredVehicleFirst,
  vehicleEnergyLabel,
  vehicleListLabel,
} from '../ui/vehicle-shop-view';

export { vehicleListLabel } from '../ui/vehicle-shop-view';

export type VehicleShopFilter = VehicleFilter;

export interface VehicleShopInit {
  area?: string;
  filter?: VehicleShopFilter;
  /** Exact outdoor delivery pad supplied by the launching dealer. */
  parking?: VehicleParkingState;
  /** Player-facing regional business name; Bert's lot remains the fallback. */
  dealerName?: string;
  /** Optional regional hero model, sorted first and called out in preview. */
  featuredVehicleId?: string;
}

type ShopAction = 'buy' | 'activate' | 'trade' | 'sell' | 'back' | 'leave';

interface ActionRow {
  action: ShopAction;
  label: string;
  disabled?: boolean;
}

const PAPER = colorOf(px(RAMP.PAPER, 3));
const PAPER_DIM = colorOf(px(RAMP.PAPER, 1));
const GOLD = colorOf(px(RAMP.GOLD, 3));
const CYAN = colorOf(px(RAMP.CYAN, 3));
const RED = colorOf(px(RAMP.RED, 3));
const GREEN = colorOf(px(RAMP.GRASS, 3));
const INK = colorOf(px(RAMP.INK, 0));
const NIGHT = colorOf(px(RAMP.NIGHT, 0));

export class VehicleShopScene extends Phaser.Scene {
  private area = '';
  private filter: VehicleShopFilter = 'all';
  private parking?: VehicleParkingState;
  private dealerName = "Bert's Auto Mart";
  private featuredVehicleId?: string;
  private dlg!: Dialogue;
  private cashObjects: Phaser.GameObjects.GameObject[] = [];
  private previewObjects: Phaser.GameObjects.GameObject[] = [];
  private previewTimer: Phaser.Time.TimerEvent | null = null;
  private ownsOverworldPause = false;
  private closed = false;

  constructor() {
    super('vehicle-shop');
  }

  init(data: VehicleShopInit = {}): void {
    // Bert's first physical lot is in Otterbrook. Callers for later regional
    // dealers pass their own area explicitly; an interior map is not a valid
    // delivery continent and must never leak in from GS.data.map by accident.
    this.area = data.area ?? 'otterbrook';
    this.filter = data.filter ?? 'all';
    this.parking = data.parking;
    this.dealerName = data.dealerName?.trim() || "Bert's Auto Mart";
    this.featuredVehicleId = data.featuredVehicleId?.trim() || undefined;
    this.cashObjects = [];
    this.previewObjects = [];
    this.previewTimer = null;
    this.ownsOverworldPause = false;
    this.closed = false;
  }

  create(): void {
    this.pauseOverworldIfNeeded();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);
    this.dlg = new Dialogue(this);
    this.drawShowroom();
    this.refreshCash();
    void this.run();
  }

  private pauseOverworldIfNeeded(): void {
    if (this.scene.isActive('overworld') && !this.scene.isPaused('overworld')) {
      this.scene.pause('overworld');
      this.ownsOverworldPause = true;
    }
  }

  private drawShowroom(): void {
    const W = this.scale.width;
    const H = this.scale.height;
    const backdrop = this.add.graphics().setScrollFactor(0).setDepth(DEPTH_UI - 10);
    backdrop.fillStyle(NIGHT, 1);
    backdrop.fillRect(0, 0, W, H);

    // A warm checkerboard lot floor, visible in the breathing room between
    // windows. It reads as a real place while remaining entirely palette-clean.
    const cell = s(16);
    for (let y = s(30), row = 0; y < H; y += cell, row++) {
      for (let x = 0, col = 0; x < W; x += cell, col++) {
        const even = (row + col) % 2 === 0;
        backdrop.fillStyle(colorOf(px(even ? RAMP.EARTH : RAMP.NIGHT, even ? 0 : 1)), 0.32);
        backdrop.fillRect(x, y, cell, cell);
      }
    }

    // Bert's optimistic pennant string: tiny, loud, and slightly excessive.
    backdrop.lineStyle(s(1), PAPER_DIM, 0.8);
    backdrop.lineBetween(s(4), s(31), W - s(4), s(31));
    for (let x = s(10), i = 0; x < W - s(8); x += s(20), i++) {
      const tint = i % 3 === 0 ? RED : i % 3 === 1 ? GOLD : CYAN;
      backdrop.fillStyle(tint, 1);
      backdrop.fillTriangle(x, s(32), x + s(12), s(32), x + s(6), s(41));
    }

    makeWindow(this, s(6), s(4), s(174), s(26));
    this.add
      .bitmapText(s(16), s(11), 'retro', glyphify(this.dealerName.toUpperCase().slice(0, 22)), s(7))
      .setScrollFactor(0)
      .setDepth(DEPTH_UI + 1)
      .setTint(GOLD);

    makeWindow(this, s(158), s(38), s(236), s(152));
    makeWindow(this, s(6), H - s(27), W - s(12), s(21));
    this.add
      .bitmapText(
        s(16),
        H - s(21),
        'retro',
        glyphify('A: inspect / sign    B: back    * owned    > preferred'),
        s(6),
      )
      .setScrollFactor(0)
      .setDepth(DEPTH_UI + 1)
      .setTint(PAPER_DIM);
  }

  private refreshCash(): void {
    this.cashObjects.forEach((object) => object.destroy());
    this.cashObjects = makeCashBox(this, GS.data.cashOnHand, GS.data.banked);
  }

  private catalog(): VehicleView[] {
    const chapter = currentVehicleChapter(GS.data);
    return featuredVehicleFirst(
      vehicleCatalog(GS.data, chapter, this.filter),
      this.featuredVehicleId,
    );
  }

  private async run(): Promise<void> {
    try {
      await this.dlg.say(
        `@${this.dealerName}: Welcome in. Prices are firm. The new-car smell is emotionally negotiable.`,
      );
      await this.catalogLoop();
      this.clearPreview();
      await this.dlg.say(`@${this.dealerName}: Come back when the road starts calling—or when your garage looks lonely.`);
    } catch (error) {
      console.error('[vehicle-shop] showroom flow failed', error);
      if (this.scene.isActive()) {
        this.clearPreview();
        await this.dlg.say('* The sales clerk closes the ledger carefully. Every completed title is safe.');
      }
    } finally {
      this.close();
    }
  }

  private async catalogLoop(): Promise<void> {
    for (;;) {
      const cars = this.catalog();
      if (cars.length === 0) {
        this.clearPreview();
        await this.dlg.say(`@${this.dealerName}: Fresh out. Even the new-car smell packed up and left.`);
        return;
      }

      const labels = cars.map(vehicleListLabel);
      labels.push('  Leave the lot');

      const selected = await pick(this, {
        x: s(6),
        y: s(38),
        options: labels,
        title: 'SHOWROOM',
        maxRows: 10,
        reserveBottom: s(29),
        startCancels: true,
        onHighlight: (index) => {
          if (index < cars.length) this.renderPreview(cars[index]);
          else this.renderLeavePreview();
        },
      });

      if (selected < 0 || selected === cars.length) return;
      if (await this.actionLoop(cars[selected])) return;
    }
  }

  /** Return true when the player chose to leave the entire lot. */
  private async actionLoop(car: VehicleView): Promise<boolean> {
    for (;;) {
      const fresh = this.catalog().find((candidate) => candidate.id === car.id) ?? car;
      const owned = fresh.owned;
      const active = fresh.active;
      const atThisDealer = this.vehicleIsAtDealer(fresh);
      const tradeChoices = this.ownedTradeIns(fresh);
      const actions: ActionRow[] = [
        {
          action: 'buy',
          label: `Buy  ${money(fresh.price)}`,
          disabled: owned,
        },
        {
          action: 'trade',
          label: 'Trade In Toward It',
          disabled: owned || tradeChoices.length === 0,
        },
        {
          action: 'activate',
          label: active ? 'Preferred Ride' : 'Mark Preferred',
          disabled: !owned || active,
        },
        {
          action: 'sell',
          label: atThisDealer
            ? `Sell Back  ${money(fresh.sellValue)}`
            : 'Sell Back  (vehicle elsewhere)',
          disabled: !owned || !atThisDealer || fresh.driving,
        },
        { action: 'back', label: 'Back to Showroom' },
        { action: 'leave', label: 'Leave the Lot' },
      ];
      const disabled = new Set(
        actions.map((row, index) => (row.disabled ? index : -1)).filter((index) => index >= 0),
      );
      const selected = await pick(this, {
        x: s(6),
        y: s(52),
        options: actions.map((row) => row.label),
        disabled,
        title: fresh.name.toUpperCase(),
        reserveBottom: s(29),
      });
      if (selected < 0 || actions[selected].action === 'back') return false;

      const action = actions[selected].action;
      if (action === 'leave') return true;
      if (action === 'buy') {
        await this.buy(fresh);
      } else if (action === 'trade') {
        if (await this.tradeUp(fresh)) return false;
      } else if (action === 'sell') {
        if (await this.sellBack(fresh)) return false;
      } else if (action === 'activate') {
        await this.activate(fresh);
      }
      const refreshed = this.catalog().find((candidate) => candidate.id === car.id) ?? fresh;
      this.renderPreview(refreshed);
    }
  }

  private async buy(car: VehicleView): Promise<void> {
    this.clearPreview();
    const confirm = await pick(this, {
      x: s(194),
      y: s(92),
      options: ['Sign the Title', 'Keep Looking'],
      title: `${money(car.price)} CASH`,
    });
    if (confirm !== 0) return;

    const result = purchaseVehicle(GS.data, car.id, {
      chapter: currentVehicleChapter(GS.data),
      area: this.area,
      ...(this.parking ? { parking: this.parking } : {}),
    });
    if (!result.ok) {
      AUDIO.sfx('cancel');
      await this.dlg.say(this.failureCopy('buy', car, result.reason));
      return;
    }

    AUDIO.sfx('confirm');
    this.refreshCash();
    await this.dlg.say(
      `* The sales clerk signs the title with a flourish. The ${car.name} is yours.`,
      `@${this.dealerName}: Full tank, honest keys, and all the road you can find. Treat each other kindly.`,
    );
  }

  private ownedTradeIns(target: VehicleView): VehicleView[] {
    // Only actual owned titles qualify. Asking for the complete chapter ceiling
    // keeps a legitimately owned earlier listing visible even if this shop uses
    // a narrow display filter such as `bikes`.
    return vehicleCatalog(GS.data, 10, 'all').filter(
      (candidate) =>
        candidate.owned &&
        !candidate.driving &&
        candidate.id !== target.id &&
        this.vehicleIsAtDealer(candidate),
    );
  }

  /** A title can be sold/traded only where the physical car currently is. A
   * missing legacy location stays serviceable so old ownership is never lost. */
  private vehicleIsAtDealer(car: VehicleView): boolean {
    return vehicleServiceableAtArea(GS.data, car.title, this.area);
  }

  /** A true atomic trade: pick an owned title, then apply its credit to target. */
  private async tradeUp(target: VehicleView): Promise<boolean> {
    const choices = this.ownedTradeIns(target);
    if (choices.length === 0) {
      await this.dlg.say(`@${this.dealerName}: Bring me a local title and I can make the numbers bend a little.`);
      return false;
    }
    this.clearPreview();
    const selected = await pick(this, {
      x: s(6),
      y: s(52),
      options: choices.map((car) => `${car.name.slice(0, 15)}  ${money(car.sellValue)}`),
      title: 'TRADE WHICH RIDE?',
      reserveBottom: s(29),
    });
    if (selected < 0) return false;
    const trade = choices[selected];
    const balance = target.price - trade.sellValue;
    const confirm = await pick(this, {
      x: s(174),
      y: s(92),
      options: [balance <= 0 ? `Trade + Get ${money(-balance)}` : `Trade + Pay ${money(balance)}`, 'Keep My Ride'],
      title: `${money(trade.sellValue)} CREDIT`,
    });
    if (confirm !== 0) return false;

    const result = tradeVehicle(GS.data, target.id, {
      chapter: currentVehicleChapter(GS.data),
      area: this.area,
      tradeTitle: trade.title,
      ...(this.parking ? { parking: this.parking } : {}),
    });
    if (!result.ok) {
      AUDIO.sfx('cancel');
      await this.dlg.say(this.failureCopy('trade', target, result.reason));
      return false;
    }

    AUDIO.sfx('confirm');
    this.refreshCash();
    await this.dlg.say(
      `* The dealer allows ${money(trade.sellValue)} for the ${trade.name} and takes its title.`,
      `* The ${target.name} is yours, full tank and fresh paperwork included.`,
    );
    return true;
  }

  /** Return true after a sale so the no-longer-owned action menu closes. */
  private async sellBack(car: VehicleView): Promise<boolean> {
    this.clearPreview();
    const confirm = await pick(this, {
      x: s(184),
      y: s(92),
      options: [`Take ${money(car.sellValue)}`, 'Keep My Ride'],
      title: 'DEALER\'S OFFER',
    });
    if (confirm !== 0) return false;

    const result = sellVehicle(GS.data, car.id);
    if (!result.ok) {
      AUDIO.sfx('cancel');
      await this.dlg.say(this.failureCopy('trade', car, result.reason));
      return false;
    }

    AUDIO.sfx('confirm');
    this.refreshCash();
    await this.dlg.say(
      `* The dealer pays ${money(car.sellValue)} and takes the title to the ${car.name}.`,
      `@${this.dealerName}: I keep a tenth. Depreciation keeps the rest. The smell keeps me.`,
    );
    return true;
  }

  private async activate(car: VehicleView): Promise<void> {
    this.clearPreview();
    const result = chooseActiveVehicle(GS.data, car.title);
    if (!result.ok) {
      AUDIO.sfx('cancel');
      await this.dlg.say(this.failureCopy('activate', car, result.reason));
      return;
    }
    AUDIO.sfx('confirm');
    const location = GS.data.carLocation[car.title];
    const place = location ? location.toUpperCase().replace(/_/g, ' ') : 'its saved parking place';
    await this.dlg.say(
      `* The ${car.name} is marked as your preferred ride.`,
      `* It remains parked in ${place}. Walk up to the vehicle and press A to drive it.`,
    );
  }

  private failureCopy(action: 'buy' | 'trade' | 'activate', car: VehicleView, reason: string): string {
    const name = car.name;
    const dealer = `@${this.dealerName}:`;
    const copy: Readonly<Record<string, string>> = {
      cant_afford: `${dealer} The ${name} likes you. Your wallet needs more time.`,
      already_owned: `${dealer} You already own that exact title. One is a car. Two is a parking problem.`,
      not_listed: `${dealer} That one's still behind the velvet rope. Roads have timing, too.`,
      not_owned: `${dealer} I need the title before I can ${action === 'trade' ? 'buy it back' : 'hand over the keys'}.`,
      no_garage: `${dealer} Bring me a garage address. A car deserves somewhere to dream.`,
      garage_full: `${dealer} Your garage is packed tighter than my filing cabinet.`,
      unknown_area: `${dealer} I need a real delivery address before I hand over the keys.`,
      missing_trade: `${dealer} That title is not in my valuation book.`,
      same_vehicle: `${dealer} Trading a car for itself mostly moves paperwork.`,
      currently_driving: `${dealer} Park it first. My insurance person can sense moving paperwork.`,
      wrong_continent: `${dealer} That title is here, but the wheels are across an ocean.`,
      not_here: `${dealer} The title checks out. The car, inconveniently, is somewhere else.`,
      empty: `${dealer} Empty tank. Wonderful sculpture, terrible preferred ride.`,
      active: `${dealer} The ${name} is already marked preferred.`,
      unknown: `${dealer} That stock number does not exist. Which is worrying, because I wrote it.`,
    };
    return copy[reason] ?? `${dealer} I cannot finish that ${action} right now. Your cash and title are untouched.`;
  }

  private renderPreview(car: VehicleView): void {
    this.clearPreview();
    const owned = car.owned;
    const active = car.active;
    const spec = VEHICLE_SPECS[car.vehicleType];
    const location = GS.data.carLocation[car.title];

    const addText = (
      x: number,
      y: number,
      text: string,
      tint = PAPER,
      size = 6,
      maxWidth?: number,
    ): Phaser.GameObjects.BitmapText => {
      const object = this.add
        .bitmapText(s(x), s(y), 'retro', glyphify(text), s(size))
        .setScrollFactor(0)
        .setDepth(DEPTH_UI + 2)
        .setTint(tint);
      if (maxWidth !== undefined) object.setMaxWidth(s(maxWidth));
      this.previewObjects.push(object);
      return object;
    };

    addText(169, 45, car.name.toUpperCase(), car.id === this.featuredVehicleId ? CYAN : GOLD, 7, 205);
    const stateLabel = car.driving ? 'ON THE ROAD' : active ? 'PREFERRED' : owned ? 'OWNED' : money(car.price);
    addText(384, 46, stateLabel, active || car.driving ? GREEN : owned ? CYAN : car.price > GS.data.cashOnHand ? RED : PAPER, 6)
      .setOrigin(1, 0);
    if (car.id === this.featuredVehicleId) {
      addText(384, 58, 'DEALER FEATURE', GOLD, 5).setOrigin(1, 0);
    }

    const shadow = this.add
      .ellipse(s(276), s(91), s(102), s(11), INK, 0.45)
      .setScrollFactor(0)
      .setDepth(DEPTH_UI + 1);
    this.previewObjects.push(shadow);

    if (this.textures.exists(car.textureKey)) {
      let frame = 0;
      const vehicle = this.add
        .image(s(276), s(90), car.textureKey, frame)
        .setOrigin(0.5, 1)
        .setScrollFactor(0)
        .setDepth(DEPTH_UI + 2);
      if (spec) vehicle.setDisplaySize(s(spec.w * 2), s(spec.h * 2));
      this.previewObjects.push(vehicle);
      const views = ['SIDE', 'FRONT', 'REAR'];
      const viewText = addText(276, 93, views[frame], PAPER_DIM, 5);
      viewText.setOrigin(0.5, 0);
      this.previewTimer = this.time.addEvent({
        delay: 1050,
        loop: true,
        callback: () => {
          frame = (frame + 1) % 3;
          if (!vehicle.active || !viewText.active) return;
          vehicle.setFrame(frame);
          viewText.setText(views[frame]);
        },
      });
    } else {
      addText(276, 74, 'ART FILE MISSING', RED, 6).setOrigin(0.5, 0);
    }

    addText(169, 106, `SEATS ${car.seats}   ${vehicleEnergyLabel(car)}`, PAPER, 6, 205);
    addText(169, 119, `RANGE ${compactVehicleRange(car.rangeTiles)}`, CYAN, 6, 205);
    if (owned) {
      const place = location ? location.toUpperCase().replace(/_/g, ' ') : 'DELIVERY PENDING';
      const local = this.vehicleIsAtDealer(car);
      addText(384, 119, local ? place : `AWAY: ${place}`, local ? PAPER_DIM : RED, 5, 105).setOrigin(1, 0);
    } else {
      addText(384, 119, `TRADE ${money(car.sellValue)}`, PAPER_DIM, 5, 105).setOrigin(1, 0);
    }
    addText(169, 135, car.note, PAPER_DIM, 6, 207);
  }

  private renderLeavePreview(): void {
    this.clearPreview();
    const add = (y: number, text: string, tint: number, size: number): void => {
      this.previewObjects.push(
        this.add
          .bitmapText(s(276), s(y), 'retro', glyphify(text), s(size))
          .setOrigin(0.5, 0)
          .setScrollFactor(0)
          .setDepth(DEPTH_UI + 2)
          .setTint(tint),
      );
    };
    add(61, 'THE ROAD WILL WAIT.', GOLD, 8);
    add(86, 'Probably.', PAPER_DIM, 6);
    add(117, "The showroom's new-car smell jar", CYAN, 6);
    add(130, 'is not included with purchase.', PAPER_DIM, 5);
  }

  private clearPreview(): void {
    this.previewTimer?.remove(false);
    this.previewTimer = null;
    this.previewObjects.forEach((object) => object.destroy());
    this.previewObjects = [];
  }

  private close(): void {
    if (this.closed) return;
    this.closed = true;
    this.clearPreview();
    AUDIO.sfx('cancel');
    this.game.events.emit('mf-vehicle-shop-closed');
    if (this.ownsOverworldPause && this.scene.isPaused('overworld')) {
      this.scene.resume('overworld');
    }
    this.scene.stop();
  }

  /** External scene stops still restore a pause this scene itself acquired. */
  private onShutdown(): void {
    if (this.closed) return;
    this.closed = true;
    this.clearPreview();
    this.game.events.emit('mf-vehicle-shop-closed');
    if (this.ownsOverworldPause && this.scene.isPaused('overworld')) {
      this.scene.resume('overworld');
    }
  }
}
