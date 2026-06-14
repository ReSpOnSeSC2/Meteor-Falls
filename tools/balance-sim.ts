/**
 * THE BALANCE SIM (S18 Movement 34, ADR-074) — prints the Fortune-Arc net-worth
 * curve alongside the property / fleet / furniture price ladders, so the back-half
 * escalation is tuned against §A9's targets BY EYE (tune DATA, never code). The
 * balance.test.ts gate proves the curve is well-formed; this is the worktable.
 *
 *   npm run balance
 */
import { FORTUNE_ARC, fortuneTarget } from '../src/data/fortune';
import { PROPERTIES } from '../src/data/properties';
import { FLEET_CRAFT } from '../src/data/fleet';
import { FURNITURE } from '../src/data/furniture';
import { DEALERSHIP } from '../src/data/dealership';
import { MILITARY_VEHICLES } from '../src/data/military';
import { walkedPrice } from '../src/engine/property';
import { sellValue, resaleFactor } from '../src/engine/garage';

const fmt = (n: number): string => '$' + n.toLocaleString('en-US');

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

console.log(`\nAt Ch.10 the arc targets ${fmt(fortuneTarget(10))} — the back-half pour fills the gap (tune DATA).\n`);
