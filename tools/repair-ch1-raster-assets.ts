/**
 * Targeted Chapter 1 raster repair/derivation pass.
 *
 * Run:       npx vite-node tools/repair-ch1-raster-assets.ts
 * Verify:    npx vite-node tools/repair-ch1-raster-assets.ts --check
 *
 * This intentionally does not call process-ch1-expanded-art.py: that broad,
 * stale processor carries obsolete crop dimensions (notably the ward bed).
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { cleanMagentaResidue, countStrongMagentaResidue, deriveEnemyMini, rgbaHash } from './ch1-raster-lib';
import { decodePng, encodePng } from './imageio';

interface PropRepair {
  id: string;
  runtime: string;
  acceptedMaster: string;
  rawSource: string;
  previousTransparentSheet: string;
  expected: { w: number; h: number };
}

interface MiniRepair {
  id: string;
  battleSource: string;
  retainedMaster: string;
}

const ROOT = process.cwd();
const CHECK = process.argv.includes('--check');
const PROP_MASTER_DIR = 'assets/art/masters/world/ch1-props';
const MINI_MASTER_DIR = 'assets/art/masters/enemies/ch1-minis';

export const CH1_PROP_REPAIRS: readonly PropRepair[] = [
  {
    id: 'prop_waiting_bench',
    runtime: 'assets/art/world/props/prop_waiting_bench.png',
    acceptedMaster: `${PROP_MASTER_DIR}/prop_waiting_bench-accepted-master.png`,
    rawSource: 'assets/art/masters/generated/ch1-expanded/props_busdepot_interior-source.png',
    previousTransparentSheet: 'assets/art/masters/world/props_busdepot_interior-transparent.png',
    expected: { w: 136, h: 64 },
  },
  {
    id: 'prop_wardbed',
    runtime: 'assets/art/world/props/prop_wardbed.png',
    acceptedMaster: `${PROP_MASTER_DIR}/prop_wardbed-accepted-master.png`,
    rawSource: 'assets/art/masters/generated/ch1-expanded/props_clinic_interior-source.png',
    previousTransparentSheet: 'assets/art/masters/world/props_clinic_interior-transparent.png',
    expected: { w: 324, h: 306 },
  },
];

export const CH1_MINI_REPAIRS: readonly MiniRepair[] = [
  { id: 'blazer_smiler', battleSource: 'blazer_smiler', retainedMaster: 'assets/art/masters/enemies/ch1-enemies-wear-transparent.png' },
  { id: 'borden', battleSource: 'constable_borden', retainedMaster: 'assets/art/masters/battlers/npc_borden-battler-transparent.png' },
  { id: 'sprinkler_sentry', battleSource: 'sprinkler_sentry', retainedMaster: 'assets/art/masters/enemies/battle_sprinkler_sentry.png' },
  { id: 'recycling_raccoon', battleSource: 'recycling_raccoon', retainedMaster: 'assets/art/masters/enemies/battle_recycling_raccoon.png' },
  { id: 'unionized_gnome', battleSource: 'unionized_gnome', retainedMaster: 'assets/art/masters/enemies/battle_unionized_gnome.png' },
  { id: 'mandatory_memo', battleSource: 'mandatory_memo', retainedMaster: 'assets/art/masters/enemies/battle_mandatory_memo.png' },
  { id: 'motivational_poster', battleSource: 'motivational_poster', retainedMaster: 'assets/art/masters/enemies/battle_motivational_poster.png' },
  { id: 'quota_clock', battleSource: 'quota_clock', retainedMaster: 'assets/art/masters/enemies/battle_quota_clock.png' },
  { id: 'expired_meter', battleSource: 'expired_meter', retainedMaster: 'assets/art/masters/enemies/battle_expired_meter.png' },
  { id: 'showroom_mannequin', battleSource: 'showroom_mannequin', retainedMaster: 'assets/art/masters/enemies/battle_showroom_mannequin.png' },
  { id: 'good_investment', battleSource: 'good_investment', retainedMaster: 'assets/art/masters/enemies/battle_good_investment.png' },
  { id: 'rogue_icecream_truck', battleSource: 'rogue_icecream_truck', retainedMaster: 'assets/art/masters/enemies/battle_rogue_icecream_truck.png' },
  { id: 'tick_nymph', battleSource: 'tick_nymph', retainedMaster: 'assets/art/masters/enemies/battle_tick_nymph.png' },
  { id: 'the_suit', battleSource: 'the_suit', retainedMaster: 'assets/art/masters/enemies/battle_the_suit.png' },
];

function full(path: string): string {
  return resolve(ROOT, path);
}

function writeOrVerify(path: string, bytes: Uint8Array): void {
  if (CHECK) {
    const actual = readFileSync(full(path));
    if (!actual.equals(bytes)) throw new Error(`${path} is stale; run the repair command without --check`);
    return;
  }
  mkdirSync(dirname(full(path)), { recursive: true });
  writeFileSync(full(path), bytes);
}

function fileHash(path: string): string {
  return createHash('sha256').update(readFileSync(full(path))).digest('hex');
}

const propProvenance: Record<string, unknown>[] = [];
for (const repair of CH1_PROP_REPAIRS) {
  // Once bootstrapped, the accepted master is canonical so this targeted tool
  // can recover a runtime file damaged by an older broad package processor.
  const canonicalInput = existsSync(full(repair.acceptedMaster))
    ? repair.acceptedMaster
    : repair.runtime;
  const source = decodePng(readFileSync(full(canonicalInput)));
  if (source.w !== repair.expected.w || source.h !== repair.expected.h) {
    throw new Error(`${repair.id}: expected ${repair.expected.w}x${repair.expected.h}, got ${source.w}x${source.h} from ${canonicalInput}`);
  }
  const cleaned = cleanMagentaResidue(source);
  if (countStrongMagentaResidue(cleaned.image) !== 0) throw new Error(`${repair.id}: strong magenta residue remains`);
  const bytes = encodePng(cleaned.image);
  writeOrVerify(repair.runtime, bytes);
  writeOrVerify(repair.acceptedMaster, bytes);
  propProvenance.push({
    id: repair.id,
    runtime: repair.runtime,
    acceptedMaster: repair.acceptedMaster,
    sourceChain: [canonicalInput],
    retainedSourceReferences: [repair.rawSource, repair.previousTransparentSheet],
    dimensions: repair.expected,
    rgbaSha256: rgbaHash(cleaned.image),
    strongMagentaResidue: countStrongMagentaResidue(cleaned.image),
  });
  console.log(`${CHECK ? 'verified' : 'repaired'} ${repair.id} ${source.w}x${source.h} from ${canonicalInput}`, cleaned.stats);
}

const miniProvenance: Record<string, unknown>[] = [];
for (const repair of CH1_MINI_REPAIRS) {
  const battlePath = `assets/art/enemies/battle_${repair.battleSource}.png`;
  const runtimePath = `assets/art/enemies/mini_${repair.id}.png`;
  const acceptedMaster = `${MINI_MASTER_DIR}/mini_${repair.id}-accepted-master.png`;
  const source = decodePng(readFileSync(full(battlePath)));
  const mini = deriveEnemyMini(source);
  const bytes = encodePng(mini);
  writeOrVerify(runtimePath, bytes);
  writeOrVerify(acceptedMaster, bytes);
  miniProvenance.push({
    id: repair.id,
    runtime: runtimePath,
    acceptedMaster,
    derivedFromRuntimeBattler: battlePath,
    retainedAuthoredMaster: repair.retainedMaster,
    dimensions: { w: mini.w, h: mini.h },
    rgbaSha256: rgbaHash(mini),
    sourceFileSha256: fileHash(battlePath),
  });
  console.log(`${CHECK ? 'verified' : 'derived'} mini_${repair.id} ${mini.w}x${mini.h} <- battle_${repair.battleSource}`);
}

const provenance = {
  schema: 1,
  algorithm: {
    chromaCleanup: 'ch1-targeted-magenta-v1',
    miniDerivation: 'alpha-crop-premultiplied-area-average-v1',
    note: 'Deterministic mechanical repair only; no generated or replacement art.',
  },
  props: propProvenance,
  minis: miniProvenance,
};
const provenanceBytes = Buffer.from(`${JSON.stringify(provenance, null, 2)}\n`);
writeOrVerify(`${PROP_MASTER_DIR}/provenance.json`, provenanceBytes);
writeOrVerify(`${MINI_MASTER_DIR}/provenance.json`, provenanceBytes);
console.log(`${CHECK ? 'verified' : 'wrote'} Chapter 1 raster provenance`);
