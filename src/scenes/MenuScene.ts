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
import { GS, expForLevel, applyTonic, type HeroState } from '../engine/state';
import { HEROES, availableAbilities } from '../data/heroes';
import { ITEMS, EQUIP_SLOTS, slotOf, BAG_MAX, boostStatLabel, equipSecondaryNote, consumesOnUse, spiceFoodHeal, type EquipSlot } from '../data/items';
import type { ResistElement } from '../schemas';
import { ABILITIES } from '../data/abilities';
import { MAPS } from '../data/maps';
import { DIALOGUE } from '../data/dialogue';
import { journalQuests, currentObjective, objectiveDone, callerEarned } from '../engine/quests';
import { heroOffense, heroDefense, heroLuck, heroSpeed, heroGuts, heroVibe, heroResist, vibeHeal } from '../battle/formulas';
import { INPUT, type BindingProfile, type Btn } from '../engine/input';
import { AUDIO } from '../engine/audio';
import { Dialogue, makeWindow, makeCashBox, everyFrame, vars, glyphify, DEPTH_UI } from '../ui/windows';
import { LOCKET_MAX_EMBERS, WINDOW_FLAVORS } from '../spritegen/ui';
// S4: the list widget + "Offense up by N!" confirm are shared with the shops
import { pick, confirmEquip, DIM, type PickOpts } from '../ui/pick';
import { makeItemInfo, ITEMINFO_RESERVE } from '../ui/iteminfo';
import { itemIconKey } from '../spritegen/icons';
import { heroPortraitKey } from '../spritegen/authored';
import { makeVitalsBar, type VitalsBar } from '../ui/vitals';
import { colorOf, RAMP, px } from '../palette';
import { s, TILE_PX } from '../spritegen/scale';
// S21 (ADR-126): the Held Breath — the Locket page hosts the Breath meter + rewind
import { CHOICES, type ChoiceId } from '../data/choices';
import { ECHO_ANCHORS, MAX_BREATHS } from '../data/echoes';
import { breathsLeft, rewindableAnchors, rewindTo } from '../engine/echo';
import { recordedOption } from '../engine/choice';
import { vehicleByTitle } from '../engine/vehicle-domain';
import { locketAvailable, ownsStarLocket } from '../engine/ch7';
import { resolveMushroomizeCureUse } from '../engine/mushroomize';
import { eligibleTeleportDestinations, teleportPpCost, type TeleportAbility } from '../engine/teleport';
import {
  isTeleportAbilityId,
  makeTeleportMenuRequest,
  TELEPORT_REQUEST_REGISTRY_KEY,
  TELEPORT_TOWN_DESTINATIONS,
} from '../engine/teleport-menu';

export class MenuScene extends Phaser.Scene {
  private dlg!: Dialogue;
  private mapMusic = '';
  private pageObjs: Phaser.GameObjects.GameObject[] = [];
  /** S15g: the EarthBound bottom-of-screen party vitals strip (yields to any
   *  other bottom UI — the item description panel AND dialogue — never overlaps) */
  private vitals!: VitalsBar;
  /** how many item DESCRIPTION panels are open right now (the strip yields) */
  private infoPanels = 0;
  /** A field Vibe closes the overlay into a typed OverworldScene handoff. */
  private fieldHandoff = false;

  constructor() {
    super('menu');
  }

  init(data: { music?: string }): void {
    this.mapMusic = data.music ?? '';
    this.pageObjs = [];
    this.fieldHandoff = false;
  }

  create(): void {
    this.dlg = new Dialogue(this);
    // cash corner — EB shows your pockets next to the commands. [PLAYTEST B] the
    // shared, clamped, abbreviated box (never runs off-screen; $1.2M when big).
    makeCashBox(this, GS.data.cashOnHand, GS.data.banked);
    // §A4: the party HP/PP strip along the bottom (the user's decree). It must
    // YIELD to anything else that lives at the bottom — the item DESCRIPTION
    // PANEL *and* a DIALOGUE box (item flavor text) — so they never overlap
    // (§A4 readability). One predicate, polled each frame; show/hide idempotent.
    this.vitals = makeVitalsBar(this);
    this.events.on('mf-iteminfo-open', () => (this.infoPanels += 1));
    this.events.on('mf-iteminfo-closed', () => (this.infoPanels = Math.max(0, this.infoPanels - 1)));
    everyFrame(this, () => {
      if (this.dlg.busy || this.infoPanels > 0) this.vitals.hide();
      else this.vitals.show();
    });
    void this.mainLoop();
  }

  /* ================= the command list ================= */

  private async mainLoop(): Promise<void> {
    for (;;) {
      const pick = await this.pick({
        x: s(8),
        y: s(8),
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
      if (this.fieldHandoff) return;
    }
    AUDIO.sfx('cancel');
    this.vitals.destroy();
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
      const info = makeItemInfo(this);
      const sel = await this.pick({
        x: s(96),
        y: s(8),
        options: labels,
        icons: hero.bag.map((id) => itemIconKey(id)),
        cols: labels.length > 7 ? 2 : 1,
        reserveBottom: ITEMINFO_RESERVE,
        title: `${hero.name}  ${hero.bag.length}/${BAG_MAX}`,
        onHighlight: (i) => info.render(hero.bag[i]),
      });
      info.destroy();
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
    const sel = await this.pick({ x: s(200), y: s(30), options: actions, title: item.name });
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
      const t = await this.pick({ x: s(200), y: s(30), options: others.map((h) => h.name), title: 'To who?' });
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
      // prop tile→px (* TILE_PX) + native pixel offsets/radius, all in runtime px
      // to match GS.data.x/y (the runtime player position, set from player.x)
      (p) => p.sprite === 'picnic' && Math.hypot(p.x * TILE_PX + s(18) - GS.data.x, p.y * TILE_PX + s(12) - GS.data.y) < s(44),
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
          : await this.pick({ x: s(200), y: s(30), options: alive.map((h) => h.name), title: 'Who eats?' });
      if (t < 0) return;
      const eater = alive[t];
      // §A10 #15 (S18 M24): the Spice Box makes cooked food heal half again
      const heal = spiceFoodHeal(item.heal, GS.hasKeyItem('spice_box'));
      eater.hp = Math.min(eater.maxHp, eater.hp + heal);
      GS.removeItem(itemId, hero.id);
      AUDIO.sfx('heal');
      await this.dlg.say(`${eater.name} ate the ${item.name}. Recovered about ${heal} HP!`);
      return;
    }
    // S4: the Star Cola line — PP comes back fizzing (§A8 "PP" items)
    if (item.ppHeal) {
      const alive = GS.aliveParty();
      const t =
        alive.length === 1
          ? 0
          : await this.pick({ x: s(200), y: s(30), options: alive.map((h) => h.name), title: 'Who drinks?' });
      if (t < 0) return;
      const drinker = alive[t];
      drinker.pp = Math.min(drinker.maxPp, drinker.pp + item.ppHeal);
      GS.removeItem(itemId, hero.id);
      AUDIO.sfx('heal');
      await this.dlg.say(`${drinker.name} drank the ${item.name}. About ${item.ppHeal} PP fizzed back!`);
      return;
    }
    // Ch.8 field cure: Mushroomized is one persistent party/world status, so it
    // has no ally picker. Reusable Scroll of Calm survives through the shared
    // consumesOnUse rule; Spore Antidote is spent exactly once on a real cure.
    if (item.kind === 'cure' && item.cures?.includes('mushroomize')) {
      const result = resolveMushroomizeCureUse(GS.data.mushroomize, consumesOnUse(item));
      if (!result.cured) {
        await this.dlg.say(`The ${item.name} waits. Nothing needs curing right now.`);
        return;
      }
      if (result.consumeItem) GS.removeItem(itemId, hero.id);
      GS.data.mushroomize = result.state;
      AUDIO.sfx('heal');
      await this.dlg.say(`The ${item.name} cleared the Mushroomized muddle.`);
      return;
    }
    // §A4.12 THE REVIVAL LINE (S17/ADR-061): any cure that lists 'down' brings
    // an angel back — Glint's Spark (heal 9999 → full) opens the line; later
    // tiers revive by their own `heal` (Second Wind weak → the Hallelujah Bell
    // full). The spark's exact lines are preserved when it's the spark itself.
    if (item.kind === 'cure' && item.cures?.includes('down')) {
      const downed = GS.data.party.filter((h) => h.down);
      const isSpark = itemId === 'glints_spark';
      if (downed.length === 0) {
        await this.dlg.say(isSpark ? 'The spark glows, patient. Nobody needs it right now.' : `The ${item.name} waits, patient. Nobody needs it right now.`);
        return;
      }
      const t =
        downed.length === 1
          ? 0
          : await this.pick({ x: s(200), y: s(30), options: downed.map((h) => h.name), title: 'For who?' });
      if (t < 0) return;
      const target = downed[t];
      // S18 M24 (ADR-094): a reusable revive (Milo's Defibrillator, §A4.12) is
      // not spent — it brings the next angel back too
      if (consumesOnUse(item)) GS.removeItem(itemId, hero.id);
      target.down = false;
      target.hp = Math.min(target.maxHp, item.heal ?? 1);
      AUDIO.sfx('ember');
      await this.dlg.say(
        isSpark
          ? `The spark flares. ${target.name} got back up, blinking, like it's Saturday.`
          : `${target.name} got back up — ${target.hp >= target.maxHp ? 'good as new.' : 'wobbly, but standing.'}`,
      );
      return;
    }
    // §A4.12 TONICS (S17/ADR-061): a permanent stat boost, applied on use to a
    // chosen hero. Rare and dear by design; the boost rides the save forever.
    if (item.kind === 'tonic' && item.boost) {
      const who = GS.data.party;
      const t =
        who.length === 1
          ? 0
          : await this.pick({ x: s(200), y: s(30), options: who.map((h) => h.name), title: 'For who?' });
      if (t < 0) return;
      const target = who[t];
      applyTonic(target, item.boost);
      GS.removeItem(itemId, hero.id);
      AUDIO.sfx('ember');
      await this.dlg.say(`${target.name} took the ${item.name}. ${boostStatLabel(item.boost.stat)} went up by ${item.boost.amount} — for keeps!`);
      return;
    }
    // Mom's Voice Tape (§A4.8): homesickness is the one curable state that
    // PERSISTS in the overworld — Rex-only, held as the rex_homesick save flag.
    // Clear it from the field menu (battle cures it via the BattleScene loop).
    if (item.kind === 'cure' && item.cures?.includes('homesick')) {
      if (GS.flag('rex_homesick') !== true) {
        await this.dlg.say(`The ${item.name} hums softly. Nobody's homesick right now.`);
        return;
      }
      if (consumesOnUse(item)) GS.removeItem(itemId, hero.id);
      GS.setFlag('rex_homesick', false);
      AUDIO.sfx('heal');
      const rex = GS.data.party.find((h) => h.id === 'rex');
      await this.dlg.say(`${rex?.name ?? 'Rex'} played the ${item.name} back. The knot in his chest loosened — the homesickness lifts.`);
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
      const info = makeItemInfo(this);
      const sel = await this.pick({
        x: s(96),
        y: s(8),
        options: keys.map((id) => ITEMS[id]?.name ?? vehicleByTitle(id)?.displayName ?? id),
        icons: keys.map((id) => vehicleByTitle(id)?.id ?? itemIconKey(id)),
        reserveBottom: ITEMINFO_RESERVE,
        title: 'KEY ITEMS',
        onHighlight: (i) => info.render(keys[i]),
      });
      info.destroy();
      if (sel < 0) return;
      const title = vehicleByTitle(keys[sel]);
      await this.dlg.say(ITEMS[keys[sel]]?.text ?? title?.note ?? '...');
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
    const x = s(96);
    const y = s(8);
    const w = s(184); // stops short of the cash corner
    // local scaled metrics: the `line`/`equipLine` closures below shadow `s`
    // with a string param, so hoist the glyph cell + left pad as runtime-px
    // consts and feed already-scaled offsets into them.
    const fs = s(6); // bitmapText size (native 6px glyph cell)
    const pad = s(12); // left text inset
    // S17 (ADR-061): a touch taller for the charm ('Other') slot + a resist
    // line — but stays clear of the bottom vitals strip (top at H−49)
    this.pageObjs.push(makeWindow(this, x, y, w, s(166)));
    // the authored 32×32 portrait bust, top-left (EB character-sheet look); the
    // name/epithet indent past it. No portrait master → no indent, reads as before.
    const pkey = heroPortraitKey(h.id);
    const hasPortrait = this.textures.exists(pkey);
    if (hasPortrait) {
      const p = this.add
        .image(x + pad, y + s(8), pkey)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(DEPTH_UI + 1);
      this.pageObjs.push(p);
    }
    const headIndent = hasPortrait ? s(38) : 0;
    // ty + indent arrive already runtime-scaled from the call sites below
    const line = (ty: number, s: string, tint?: number, indent = 0): void => {
      const t = this.add
        .bitmapText(x + pad + indent, y + ty, 'retro', glyphify(s), fs)
        .setScrollFactor(0)
        .setDepth(DEPTH_UI + 1);
      if (tint !== undefined) t.setTint(tint);
      this.pageObjs.push(t);
    };
    line(s(10), `${h.name}  L${h.level}`, undefined, headIndent);
    if (h.down) {
      const d = this.add
        .bitmapText(x + w - s(44), y + s(10), 'retro', 'DOWN', fs)
        .setScrollFactor(0)
        .setDepth(DEPTH_UI + 1)
        .setTint(colorOf(px(RAMP.RED, 2)));
      this.pageObjs.push(d);
    } else if (GS.data.mushroomize.active) {
      const d = this.add
        .bitmapText(x + w - s(88), y + s(10), 'retro', 'MUSHROOMIZED', fs)
        .setScrollFactor(0)
        .setDepth(DEPTH_UI + 1)
        .setTint(colorOf(px(RAMP.GRASS, 2)));
      this.pageObjs.push(d);
    } else if (h.id === 'rex' && GS.flag('rex_homesick') === true) {
      // §A4.8: HOMESICK rides the save until Mom's call (S4)
      const d = this.add
        .bitmapText(x + w - s(64), y + s(10), 'retro', 'HOMESICK', fs)
        .setScrollFactor(0)
        .setDepth(DEPTH_UI + 1)
        .setTint(colorOf(px(RAMP.CYAN, 2)));
      this.pageObjs.push(d);
    }
    if (GS.data.mushroomize.active) {
      line(s(22), 'INPUT ROTATES; CALM/ANTIDOTE', colorOf(px(RAMP.GRASS, 2)));
      line(s(32), 'A DOCTOR CAN CURE IT', colorOf(px(RAMP.GRASS, 2)));
    } else {
      line(s(22), HEROES[h.id].epithet, DIM, headIndent);
    }
    line(s(40), `HP ${h.hp}/${h.maxHp}    PP ${h.pp}/${h.maxPp}`);
    // every combat stat reads through its seam (heroX) so equip + tonic boosts show
    line(s(58), `Offense ${heroOffense(h)}   Defense ${heroDefense(h)}`);
    // Speed/Guts read through the 'arms' slot (S12 — THE STARTING FOUR)
    line(s(70), `Speed   ${heroSpeed(h)}   Guts    ${heroGuts(h)}`);
    // Luck reads through the 'other'-slot charm (S9). Vibe now reads through
    // gear + tonics too (S17 — heroVibe; the Riddle Ring / Brain-Food Lunch)
    line(s(82), `Vibe    ${heroVibe(h)}   Luck    ${heroLuck(h)}`);
    // S17 (ADR-061): each equip line names the piece + its "(also +N X)"
    // secondary rider (bonus + Vibe; resists ride their own line below). With
    // the 41-item catalog no piece has a rider, so this reads exactly as before.
    const equipLine = (ty: number, label: string, slot: EquipSlot): void => {
      const id = h.equip[slot];
      const it = id ? ITEMS[id] : undefined;
      const note = it ? equipSecondaryNote(it, { resists: false }) : '';
      line(ty, `${label}  ${it?.name ?? 'Nothing'}${note ? ` ${note}` : ''}`, it ? undefined : DIM);
    };
    equipLine(s(96), 'Weapon', 'weapon');
    equipLine(s(106), 'Body  ', 'body');
    equipLine(s(116), 'Arms  ', 'arms');
    equipLine(s(126), 'Charm ', 'other');
    line(s(138), `EXP ${h.exp}`);
    line(s(148), `Next level in ${Math.max(0, expForLevel(h.level + 1) - h.exp)}`, DIM);
    // S17: elemental resists, only when worn gear grants any (§A8 pendants)
    const RES_ELEMS: ResistElement[] = ['fire', 'freeze', 'volt', 'holy'];
    const res = RES_ELEMS.map((e) => ({ e, p: Math.round(heroResist(h, e) * 100) })).filter((r) => r.p > 0);
    if (res.length) {
      line(s(158), `Resist  ${res.map((r) => `${r.e} ${r.p}%`).join('  ')}`, colorOf(px(RAMP.CYAN, 2)));
    }
  }

  /* ================= VIBE ================= */

  private async vibePage(): Promise<void> {
    for (;;) {
      const hero = await this.pickHero();
      if (hero === null || hero === 'keys') return;
      await this.vibeList(hero);
      if (this.fieldHandoff) return;
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
      const destinations = eligibleTeleportDestinations(
        TELEPORT_TOWN_DESTINATIONS,
        (flag) => GS.flag(flag) === true,
      );
      const usable = (id: string): boolean => {
        const a = ABILITIES[id];
        if (isTeleportAbilityId(id)) {
          return hero.id === 'rex'
            && !hero.down
            && locketAvailable(GS.data)
            && hero.pp >= teleportPpCost(id)
            && destinations.length > 0;
        }
        return a.heal === true && a.power > 0 && !hero.down && hero.pp >= a.pp;
      };
      const labels = ids.map((id) => {
        const a = ABILITIES[id];
        const fieldUsableKind = isTeleportAbilityId(id) || (a.heal === true && a.power > 0);
        return `${a.name}  ${a.pp}pp${fieldUsableKind ? '' : '  [BATTLE]'}`;
      });
      const disabled = new Set(ids.map((id, i) => (usable(id) ? -1 : i)).filter((i) => i >= 0));
      const sel = await this.pick({
        x: s(96),
        y: s(8),
        options: labels,
        disabled,
        cols: labels.length > 7 ? 2 : 1,
        title: `${hero.name}  PP ${hero.pp}/${hero.maxPp}`,
      });
      if (sel < 0) return;
      const id = ids[sel];
      if (isTeleportAbilityId(id)) {
        if (await this.teleportDestinationList(hero, id, ids, destinations)) return;
        continue;
      }
      const ab = ABILITIES[id];
      const alive = GS.aliveParty();
      const t =
        alive.length === 1
          ? 0
          : await this.pick({ x: s(200), y: s(30), options: alive.map((h) => h.name), title: 'On who?' });
      if (t < 0) continue;
      const target = alive[t];
      hero.pp -= ab.pp;
      const amount = vibeHeal(ab.power, hero.stats.vibe, Math.random);
      target.hp = Math.min(target.maxHp, target.hp + amount);
      AUDIO.sfx('heal');
      this.vitals.refresh(); // HP + PP both changed while the strip is visible
      await this.dlg.say(ab.text.replaceAll('{user}', hero.name), `${target.name} recovered about ${amount} HP!`);
    }
  }

  /**
   * Select a visited/story-open safe town, then close the paused menu into one
   * registry request. PP stays untouched here: the overworld's terminal
   * resolveTeleportAttempt result is the sole accounting authority.
   */
  private async teleportDestinationList(
    hero: HeroState,
    ability: TeleportAbility,
    learnedAbilities: readonly string[],
    destinations = eligibleTeleportDestinations(
      TELEPORT_TOWN_DESTINATIONS,
      (flag) => GS.flag(flag) === true,
    ),
  ): Promise<boolean> {
    if (destinations.length === 0) {
      await this.dlg.say('No visited, story-open town answers the light right now.');
      return false;
    }
    const selected = await this.pick({
      x: s(116),
      y: s(18),
      options: destinations.map((destination) => destination.label),
      cols: destinations.length > 7 ? 2 : 1,
      title: ability === 'teleport_b' ? 'BETA — TO WHERE?' : 'ALPHA — TO WHERE?',
    });
    if (selected < 0) return false;

    const selection = makeTeleportMenuRequest({
      ability,
      casterId: hero.id,
      learnedAbilities,
      flagOf: (flag) => GS.flag(flag) === true,
      pp: hero.pp,
      destination: destinations[selected],
      origin: {
        map: GS.data.map,
        x: GS.data.x,
        y: GS.data.y,
        facing: GS.data.facing,
      },
    });
    if (!selection.ok) {
      await this.dlg.say(
        selection.reason === 'not-enough-pp'
          ? `${hero.name} could not find enough PP for the run-up.`
          : 'The route folded shut before the first step.',
      );
      return false;
    }

    this.registry.set(TELEPORT_REQUEST_REGISTRY_KEY, selection.request);
    AUDIO.sfx('confirm');
    this.fieldHandoff = true;
    this.vitals.destroy();
    this.game.events.emit('mf-menu-closed');
    this.scene.stop();
    return true;
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
      const info = makeItemInfo(this);
      const sel = await this.pick({
        x: s(96),
        y: s(8),
        options: labels,
        icons: EQUIP_SLOTS.map((s) => {
          const id = hero.equip[s];
          return id ? itemIconKey(id) : undefined;
        }),
        reserveBottom: ITEMINFO_RESERVE,
        title: hero.name,
        onHighlight: (i) => info.render(hero.equip[EQUIP_SLOTS[i]] ?? ''),
      });
      info.destroy();
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
    const info = makeItemInfo(this);
    const sel = await this.pick({
      x: s(130),
      y: s(22),
      options: labels,
      icons: [...cands.map((c) => itemIconKey(c.itemId)), undefined],
      reserveBottom: ITEMINFO_RESERVE,
      title: slotName(slot),
      onHighlight: (i) => info.render(i < cands.length ? cands[i].itemId : (hero.equip[slot] ?? '')),
    });
    info.destroy();
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
        x: s(96),
        y: s(8),
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
    const x = s(96);
    const y = s(8);
    const w = s(230);
    const lines: Array<{ s: string; tint?: number }> = [];
    if (q.status === 'done') {
      lines.push({ s: 'Done. Handled. Legendary.', tint: colorOf(px(RAMP.GOLD, 2)) });
      lines.push({ s: glyphify(`${q.def.caller.name} owes you a phone call.`), tint: DIM });
    } else {
      const now = currentObjective(q.def);
      for (const o of q.def.objectives) {
        if (objectiveDone(o)) lines.push({ s: `- ${vars(o.text)}`, tint: DIM });
        else if (o === now) lines.push({ s: `> ${vars(o.text)}` });
      }
    }
    // 46px frame + 16px per row (line COUNT stays unscaled; the px metrics scale)
    const h = s(46) + lines.length * s(16);
    this.pageObjs.push(makeWindow(this, x, y, w, h));
    const title = this.add
      .bitmapText(x + s(12), y + s(10), 'retro', glyphify(q.def.name.toUpperCase()), s(6))
      .setScrollFactor(0)
      .setDepth(DEPTH_UI + 1)
      .setTint(colorOf(px(RAMP.GOLD, 3)));
    this.pageObjs.push(title);
    if (callerEarned(questId)) {
      const icon = this.add
        .image(x + w - s(18), y + s(13), 'phone_icon')
        .setScrollFactor(0)
        .setDepth(DEPTH_UI + 1);
      this.pageObjs.push(icon);
    }
    lines.forEach((l, i) => {
      const t = this.add
        .bitmapText(x + s(12), y + s(30) + i * s(16), 'retro', l.s, s(6))
        .setScrollFactor(0)
        .setDepth(DEPTH_UI + 1)
        .setMaxWidth(w - s(24));
      if (l.tint !== undefined) t.setTint(l.tint);
      this.pageObjs.push(t);
    });
  }

  /* ================= LOCKET (§A4.9) ================= */

  private async locketPage(): Promise<void> {
    if (!ownsStarLocket(GS.data)) {
      await this.dlg.say('You have a pocket. In it: lint, mostly.');
      return;
    }
    if (!locketAvailable(GS.data)) {
      await this.dlg.say(...DIALOGUE.locket_missing_heist);
      return;
    }
    const n = Math.max(0, Math.min(LOCKET_MAX_EMBERS, GS.data.embers));
    const x = s(96);
    const y = s(8);
    const w = s(230);
    this.pageObjs.push(
      this.add
        .image(x, y, 'locket_pause_frame')
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(DEPTH_UI),
    );
    this.pageObjs.push(
      this.add
        .image(x + w / 2, y + s(57), `locket_${n}`)
        .setScrollFactor(0)
        .setDepth(DEPTH_UI + 1),
    );
    const count = this.add
      .bitmapText(x + w / 2, y + s(84), 'retro', `HEARTLIGHTS: ${n}/10`, s(6))
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
      .bitmapText(x + w / 2, y + s(101), 'retro', flavor, s(6))
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH_UI + 1)
      .setMaxWidth(w - s(24))
      .setCenterAlign()
      .setTint(DIM);
    this.pageObjs.push(fl);
    // S21 (ADR-126): THE HELD BREATH — the Breath meter rides beside the Embers, and
    // (with a Breath to spend + a recorded moment) the Locket can hold a breath back:
    // rewind to a past choice and re-make it (src/engine/echo.ts).
    const hasBreath = GS.flag('held_breath_unlocked') === true;
    if (hasBreath) {
      const b = breathsLeft();
      const meter = '*'.repeat(b) + '.'.repeat(Math.max(0, MAX_BREATHS - b));
      const bt = this.add
        .bitmapText(x + w / 2, y + s(118), 'retro', `BREATH  ${meter}`, s(6))
        .setOrigin(0.5, 0)
        .setScrollFactor(0)
        .setDepth(DEPTH_UI + 1)
        .setTint(colorOf(px(RAMP.CYAN, 3)));
      this.pageObjs.push(bt);
    }
    // the Homesong grows one stem per Ember; with none it stays politely quiet
    if (n > 0) AUDIO.playMusic('homesong', n);
    const anchors = hasBreath && breathsLeft() > 0 ? rewindableAnchors() : [];
    let restarted = false;
    if (anchors.length > 0) restarted = await this.echoesPrompt(anchors);
    else await this.waitDismiss();
    if (restarted) return; // the overworld was restarted at the rewound state
    this.clearPage();
    if (n > 0) AUDIO.playMusic(this.mapMusic || null);
  }

  /**
   * S21 (ADR-126): the Held Breath rewind flow — offered from the LOCKET page when a
   * Breath is in the bank and a rewindable moment is recorded. Pick a moment, read the
   * cost, confirm, and the world breathes back: GS restores to the pre-decision state
   * (src/engine/echo.ts) and the overworld restarts there. Returns true on a rewind.
   */
  private async echoesPrompt(anchors: ChoiceId[]): Promise<boolean> {
    const open = await this.pick({
      x: s(96),
      y: s(120),
      options: ['Hold a breath back…', 'Close'],
      title: 'THE HELD BREATH',
    });
    if (open !== 0) return false;
    const labels = anchors.map((id) => `Ch.${CHOICES[id].chapter}:  ${recordedOption(id)?.label ?? '…'}`);
    const which = await this.pick({
      x: s(96),
      y: s(8),
      options: [...labels, 'Never mind'],
      title: 'GO BACK TO…',
    });
    if (which < 0 || which >= anchors.length) return false;
    const id = anchors[which];
    await this.dlg.say(...DIALOGUE[ECHO_ANCHORS[id].offerDialogue]);
    await this.dlg.say(...DIALOGUE[ECHO_ANCHORS[id].costDialogue]);
    const ok = await this.dlg.ask(['Hold it back', 'Leave it be'], { cancelIndex: 1 });
    if (ok !== 0) return false;
    if (!rewindTo(id)) {
      await this.dlg.say(...DIALOGUE.echo_no_breath);
      return false;
    }
    AUDIO.sfx('ember');
    await this.dlg.say(...DIALOGUE.echo_done);
    // the world is rewound — restart the overworld at the restored map/position so the
    // rewound state (flags, party, map) renders fresh (mirrors returnToTitle's restart)
    this.clearPage();
    AUDIO.playMusic(this.mapMusic || null);
    this.game.events.emit('mf-menu-closed');
    this.scene.stop('overworld');
    this.scene.start('overworld', { mapId: GS.data.map, x: GS.data.x, y: GS.data.y, facing: GS.data.facing });
    this.scene.stop();
    return true;
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
      .bitmapText(s(96), s(124), 'retro', '(M on a keyboard flips sound anywhere)', s(6))
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
        x: s(96),
        y: s(8),
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
            { b: 'A', does: 'confirm-talk-horn' },
            { b: 'B', does: 'cancel-run-brake' },
            { b: 'X', does: 'park-exit / links' },
            { b: 'Y', does: 'dash-field-vitals' },
            { b: 'START', does: 'menu-pause / car key' },
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
    const legend = makeWindow(this, s(212), s(30), s(184), s(110));
    const legendTitle = this.add
      .bitmapText(s(222), s(38), 'retro', profile === 'hoops' ? 'HOOPS ACTIONS' : 'MAIN ACTIONS', s(6))
      .setScrollFactor(0)
      .setDepth(DEPTH_UI + 1)
      .setTint(colorOf(px(RAMP.GOLD, 3)));
    // i is the row INDEX (unscaled); 13 is the per-row px pitch (scaled)
    const legendRows = ROLES.map(({ b, does }, i) =>
      this.add
        .bitmapText(s(222), s(52) + i * s(13), 'retro', `${b.padEnd(6)}${does}`, s(6))
        .setScrollFactor(0)
        .setDepth(DEPTH_UI + 1)
        .setTint(i % 2 === 0 ? colorOf(px(RAMP.PAPER, 3)) : colorOf(px(RAMP.PAPER, 2))),
    );
    const footer = this.add
      .bitmapText(s(212), s(146), 'retro', 'Pick a row, press the new key\nor pad button. A stolen key\nfalls back to its old default.', s(6))
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
        x: s(8),
        y: s(8),
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
    const w = makeWindow(this, s(60), s(80), s(280), s(56));
    const t = this.add
      .bitmapText(s(200), s(92), 'retro', `${btn} — ${role}\nPRESS THE NEW KEY OR PAD BUTTON\n(tap or click to cancel)`, s(6))
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
    const sel = await this.pick({ x: s(96), y: s(8), options: labels });
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
