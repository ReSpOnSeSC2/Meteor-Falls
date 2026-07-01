/**
 * THE BALANCE SIM (S18 Movement 34, ADR-074; grown into THE GREAT VERIFICATION,
 * Movement 24, ADR-094) — the worktable a human READS BY EYE to tune the §A9
 * curves as DATA (never code).
 *
 * HALF A (the combat verification, M24): per-hero GROWTH curves, the Vibe
 * ability LADDERS (PP cost vs power tier + the α→β awakening leap), boss HP vs
 * TIME-TO-KILL at each §A6 target level, the §A4 economy (revival line / tonics
 * / picnic / hospital / the Spice Box), and the EXP grind read.
 * HALF B (the wealth arc, M34/M49): the Fortune Arc + property / fleet / car /
 * fuel / ferry / rocket ladders.
 *
 * verify.test.ts + balance.test.ts PIN the shapes; this prints them.
 *
 *   npm run balance
 */
import {
  growthRow,
  ladder,
  allBossChecks,
  allReadVsSpam,
  allBreakEconomy,
  finaleHushChecks,
  AWAKENING_LEVEL,
  type GrowthRow,
} from '../src/battle/verify';
import { ITEMS, SPICE_BOX_MUL } from '../src/data/items';
import { CHAPTER_MANIFESTS } from '../src/data/chapters';
import { expForLevel } from '../src/engine/state';
import { reviveCost, CURE_ALL_COST, CHAPEL_HEAL, SUNNY_MUL, SUNNY_BATTLES } from '../src/battle/formulas';
import type { HeroId } from '../src/schemas';
import { FORTUNE_ARC, fortuneTarget } from '../src/data/fortune';
import { PROPERTIES } from '../src/data/properties';
import { FLEET_CRAFT } from '../src/data/fleet';
import { FURNITURE } from '../src/data/furniture';
import { DEALERSHIP } from '../src/data/dealership';
import { MILITARY_VEHICLES } from '../src/data/military';
import { walkedPrice } from '../src/engine/property';
import { sellValue, resaleFactor } from '../src/engine/garage';
import { VEHICLE_SPECS } from '../src/spritegen/vehicles';
import { fuelProfile, rangeTiles, needsFuel, BASE_PRICE_PER_UNIT } from '../src/engine/fuel';
import { STATIONS } from '../src/data/stations';
import { stationPricePerUnit, homeChargePricePerUnit, refuelAtStation, chargeAtHome } from '../src/engine/refuel';
import { FERRY_BASE, ferryCost } from '../src/engine/ferry';
import { launchCost } from '../src/engine/rocket';

const fmt = (n: number): string => '$' + n.toLocaleString('en-US');
const pad = (s: string | number, n: number): string => String(s).padStart(n);

/* ============================================================================
 * HALF A — THE GREAT VERIFICATION (M24): the combat curves, read by eye.
 * ========================================================================== */

const HERO_NAME: Record<HeroId, string> = { rex: 'Jay', faye: 'Mia', milo: 'Milo', pippa: 'Pippa', dorin: 'Dorin' };
const CHECKPOINTS = [1, 8, 13, 18, 22, 26, 30, 35, 40, 46, 52];

console.log('\n================  THE GREAT VERIFICATION (§A9 combat)  ================');

console.log('\nPER-CHARACTER GROWTH CURVES (HP/PP/Off/Def/Spd/Guts/Vibe at key levels)\n');
for (const id of Object.keys(HERO_NAME) as HeroId[]) {
  console.log(`  ${HERO_NAME[id]} (${id})`);
  console.log(`    Lv     HP    PP   Off   Def   Spd  Guts  Vibe`);
  for (const lv of CHECKPOINTS) {
    const g: GrowthRow = growthRow(id, lv);
    console.log(
      `    ${pad(lv, 2)}  ${pad(g.hp, 5)} ${pad(g.pp, 5)} ${pad(g.offense, 5)} ${pad(g.defense, 5)} ${pad(g.speed, 5)} ${pad(g.guts, 5)} ${pad(g.vibe, 5)}`,
    );
  }
}

console.log('\nVIBE ABILITY LADDERS — PP cost vs power tier (§A3/ADR-035: α→β leaps ≈2.6×)\n');
for (const base of ['Vibe Surge', 'Vibe Fire', 'Vibe Freeze', 'Vibe Volt', 'Lifeup', 'Vibe Comet']) {
  const rungs = ladder(base);
  if (rungs.length === 0) continue;
  console.log(`  ${base}`);
  let prevPow = 0;
  for (const r of rungs) {
    const leap = prevPow ? '×' + (r.power / prevPow).toFixed(2) : '  —  ';
    console.log(`    ${r.tier}  PP ${pad(r.pp, 3)}   power ${pad(r.power, 4)}   ${leap} prior`);
    prevPow = r.power;
  }
}

console.log('\nBOSS HP vs TIME-TO-KILL @ §A6 target level (party DPR = base stats, no weapons)\n');
console.log('  Ch  Boss                       HP   Lv  Party   DPR   TTK  weakness');
for (const b of allBossChecks()) {
  console.log(
    `  ${pad(b.chapter, 2)}  ${b.name.slice(0, 24).padEnd(24)} ${pad(b.hp, 5)}  ${pad(b.level, 2)}   ${b.party.length}    ${pad(b.partyDpr, 4)}  ${pad(b.ttk, 4)}  ${b.weakness.join(',') || '—'}`,
  );
}
console.log('  (TTK is a CONSERVATIVE floor: no weapons, no items, no Pray/support — real geared');
console.log('   fights fell faster. A fair EB boss is ~5–15 turns; the Tick/Hush are scripted set-pieces.)');

console.log('\nADR-134 — THE READ vs THE SPAM (does setup→break→burst beat biggest-number spam?)\n');
console.log('  Ch  Boss                     spamDPR  spamTTK    readDPR  readTTK   Δ  weakness');
for (const r of allReadVsSpam()) {
  const delta = r.spamTtk - r.readTtk;
  console.log(
    `  ${pad(r.chapter, 2)}  ${r.name.slice(0, 22).padEnd(22)} ${pad(r.spamDpr, 7)}  ${pad(r.spamTtk, 5)}    ${pad(r.readDpr, 7)}  ${pad(r.readTtk, 5)}  ${pad(delta, 2)}  ${r.weakness.join(',') || '—'}`,
  );
}
console.log('  (SPAM = fire the biggest raw nuke every turn, colour be damned — it eats resists and');
console.log('   misses weaknesses. READ = rotate onto the weakness (×1.8), then set up + cash a BREAK');
console.log('   (×2 window). readTTK ≤ spamTTK for every boss, strictly faster across the suite — the');
console.log('   right action beats the biggest action, exactly as ADR-134 intends. money > combat untouched.)');

console.log('\nADR-134 — MILO & PIPPA IN THE BREAK ECONOMY (the flat-tool crew earns its keep)\n');
console.log('  Ch  Boss                      siegeDMG   breakActions(plain → +Milo/Pippa)');
for (const r of allBreakEconomy()) {
  const name = allBossChecks().find((b) => b.chapter === r.chapter)?.name ?? '';
  console.log(
    `  ${pad(r.chapter, 2)}  ${name.slice(0, 22).padEnd(22)} ${pad(r.siege, 7)}      ${r.actionsPlain} → ${r.actionsHelped}`,
  );
}
console.log('  (siegeDMG = Milo\'s siege_rocket = 360 flat + 2% of the boss\'s max HP — it SCALES with the');
console.log('   fight (360 early → thousands late) so Milo is never dead weight. breakActions = how many');
console.log('   weakness hits BREAK the boss: plain, vs WITH Milo\'s control chip + Pippa\'s mark (+50%) —');
console.log('   they cut the setup ~in half. Scout/mark/control materially accelerate the break (§4.7).)');

console.log('\nTHE HUSH — FINALE LOADOUT VARIANTS (§4.3, ADR-130): party 3/4/5 × Comet Ω × Stolen Light\n');
console.log('  Variant                                     Size   Ω     Light    HP     DPR   TTK');
for (const f of finaleHushChecks()) {
  console.log(
    `  ${f.label.padEnd(42)}  ${f.size}    ${f.cometWithheld ? 'held' : ' on '}   ${f.stolenLight ? ' on' : 'off'}  ${pad(f.hp, 6)} ${pad(f.partyDpr, 6)}  ${pad(f.ttk, 3)}`,
  );
}
console.log('  (every reachable path must land in the fair TTK window — verify.test.ts pins it;');
console.log('   the Stolen Light chip + per-size HP ease keep a wounded party fair. money > combat.)');

console.log('\nTHE §A4 ECONOMY — the revival line, tonics, picnic, hospital, the Spice Box\n');
console.log('  REVIVAL LINE (§A4.12 — any cure listing "down" revives by its own heal):');
for (const it of Object.values(ITEMS)) {
  if (it.kind === 'cure' && it.cures?.includes('down')) {
    const full = (it.heal ?? 0) >= 9999 ? ' (full)' : '';
    console.log(`    ${it.name.padEnd(22)} heal ${pad(it.heal ?? 0, 5)}${full}  ${fmt(it.price).padStart(7)}${it.reusable ? '  REUSABLE' : ''}`);
  }
}
console.log('\n  TONICS (§A4.12 — a permanent +stat, rides the save forever):');
for (const it of Object.values(ITEMS)) {
  if (it.kind === 'tonic' && it.boost) {
    console.log(`    ${it.name.padEnd(22)} +${it.boost.amount} ${it.boost.stat.padEnd(7)}  ${fmt(it.price).padStart(7)}`);
  }
}
console.log('\n  PICNIC BASKETS (§A4.5 — full restore + SUNNY SIDE ×' + SUNNY_MUL + ' all stats, ' + SUNNY_BATTLES + ' battles):');
for (const it of Object.values(ITEMS)) {
  if (it.kind === 'basket') console.log(`    ${it.name.padEnd(22)} ${fmt(it.price).padStart(7)}`);
}
console.log('\n  HOSPITAL (§A4.7 — pay-to-revive scales by the fallen hero’s level):');
for (const lv of [8, 18, 30, 46, 52]) console.log(`    revive a Lv${pad(lv, 2)} angel  ${fmt(reviveCost(lv)).padStart(6)}`);
console.log(`    cure-all-statuses desk  ${fmt(CURE_ALL_COST).padStart(6)}        chapel heal (free)  ${CHAPEL_HEAL} HP party-wide`);
console.log(`\n  THE SPICE BOX (§A10 #15) — cooked food heals ×${SPICE_BOX_MUL} while owned (e.g. a 60 HP dish → ${Math.round(60 * SPICE_BOX_MUL)}).`);

console.log('\nEXP GRIND (§A9: EXP(L)=4·L³/3, the TOTAL to reach a level) — the §A6 climb\n');
console.log('  Ch  target Lv   total EXP to reach   +EXP earned this chapter');
let prevExp = 0;
for (const ch of Object.keys(CHAPTER_MANIFESTS).map(Number).sort((a, b) => a - b)) {
  const lv = CHAPTER_MANIFESTS[String(ch)].targetLevel;
  const total = expForLevel(lv);
  console.log(`  ${pad(ch, 2)}      ${pad(lv, 2)}        ${pad(total, 9)}            +${pad(total - prevExp, 9)}`);
  prevExp = total;
}
// sanity: every awakening's earned-by level is sane (no late awakening at L1)
const awakeMisplaced = Object.entries(AWAKENING_LEVEL).filter(([, lv]) => lv < 1 || lv > 60);
console.log(`  awakening earned-by levels: ${Object.keys(AWAKENING_LEVEL).length} mapped, ${awakeMisplaced.length} out of range\n`);

console.log('\n================  HALF B — THE WEALTH ARC (§A9 Fortune)  ==============');

console.log('\nTHE FORTUNE ARC — §A9 net-worth targets (Ch.1 ~$1K → Ch.10 $3B+)\n');
let prev = 0;
for (const row of FORTUNE_ARC) {
  const mult = prev ? (row.netWorth / prev).toFixed(1) + '×' : '—';
  console.log(`  ${row.band.padEnd(5)} ${fmt(row.netWorth).padStart(18)}   (${mult} prior)`);
  prev = row.netWorth;
}

console.log('\nPROPERTY price walk (sticker → walked to its own +2 chapters):\n');
for (const p of Object.values(PROPERTIES)) {
  const ch = Number(/^ch(\d+)$/.exec(p.band)?.[1] ?? 1);
  console.log(`  ${p.id.padEnd(18)} ${p.kind.padEnd(7)} ${fmt(p.basePrice).padStart(14)} → ${fmt(walkedPrice(p, ch + 2, 4104)).padStart(14)}  rent ${fmt(p.rent)}`);
}

console.log('\nFLEET craft (the Fortune-Arc toys):\n');
for (const c of Object.values(FLEET_CRAFT)) {
  console.log(`  ${c.id.padEnd(14)} ${c.band.padEnd(5)} ${c.venue.padEnd(8)} ${fmt(c.price).padStart(14)}`);
}

console.log('\nDEALERSHIP cars (S19 — buy sticker → sell trade-in, Bert keeps the smell):\n');
for (const c of Object.values(DEALERSHIP).sort((a, b) => a.price - b.price)) {
  const pct = Math.round(resaleFactor(c) * 100);
  console.log(`  ${c.id.padEnd(16)} ${c.band.padEnd(5)} ${c.vehicleType.padEnd(13)} ${fmt(c.price).padStart(12)} → ${fmt(sellValue(c)).padStart(12)} (${pct}%)`);
}

console.log('\nMILITARY motor pool (helmeted hardware — not for sale, the §A6 chase):\n');
for (const m of Object.values(MILITARY_VEHICLES)) {
  console.log(`  ${m.type.padEnd(16)} ${m.designation}`);
}

console.log('\nFURNITURE price band (the home-goods ladder):\n');
const fp = Object.values(FURNITURE).map((f) => f.price).sort((a, b) => a - b);
console.log(`  ${FURNITURE && Object.keys(FURNITURE).length} pieces · cheapest ${fmt(fp[0])} · dearest ${fmt(fp[fp.length - 1])}`);

console.log('\nFUEL (S20 — a full tank goes a long way; you pay to fill, electric is cheap):\n');
const drivable = Object.keys(VEHICLE_SPECS).filter((t) => needsFuel(t)).sort();
for (const t of drivable) {
  const p = fuelProfile(t);
  const station = STATIONS.brickton_fillup; // a mid-cost-of-living reference pump
  const cost = p.kind === 'electric'
    ? chargeAtHome(0, t).cost
    : (station.fuels.includes(p.kind) ? refuelAtStation(0, t, station).cost : Math.round(p.tank * BASE_PRICE_PER_UNIT[p.kind]));
  console.log(`  ${t.padEnd(15)} ${p.kind.padEnd(8)} tank ${String(p.tank).padStart(4)}  range ${String(rangeTiles(t)).padStart(6)}t  full-fill ${fmt(cost).padStart(10)}`);
}

console.log('\nFUEL PRICE by region (per unit gas → Mars electric):\n');
for (const st of Object.values(STATIONS)) {
  const kinds = st.fuels.map((k) => `${k} $${stationPricePerUnit(st, k).toFixed(2)}`).join('  ');
  console.log(`  ${st.area.padEnd(13)} ×${st.priceMult.toFixed(2)}  ${kinds}`);
}
console.log(`  home charger (EV): $${homeChargePricePerUnit().toFixed(2)}/unit — cheaper than every pump`);

console.log('\nFERRY + ROCKET (cross-continent — own the craft, pay far less):\n');
console.log(`  sea     commercial ${fmt(FERRY_BASE.sea).padStart(12)}   own a boat ${fmt(ferryCost('sea', true)).padStart(12)}`);
console.log(`  air     commercial ${fmt(FERRY_BASE.air).padStart(12)}   own a jet  ${fmt(ferryCost('air', true)).padStart(12)}`);
console.log(`  rocket  (Mars)     ${fmt(FERRY_BASE.rocket).padStart(12)}   launch fuel ${fmt(launchCost()).padStart(11)}`);

console.log(`\nAt Ch.10 the arc targets ${fmt(fortuneTarget(10))} — the back-half pour fills the gap (tune DATA).\n`);
