import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { requireBlender } from './blender-utils';

function argsAfterSeparator(argv: string[]): string[] {
  const marker = argv.indexOf('--');
  return marker >= 0 ? argv.slice(marker + 1) : argv;
}

const argv = argsAfterSeparator(process.argv.slice(2));

function firstValue(name: string): string | undefined {
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === `--${name}`) return argv[i + 1];
    if (argv[i].startsWith(`--${name}=`)) return argv[i].slice(name.length + 3);
  }
  return undefined;
}

const char = firstValue('char') ?? firstValue('character');
const frame = firstValue('frame');
if (!char || frame === undefined) throw new Error('need --char <id> and --frame <0-45>');

const frameNumber = Number(frame);
if (!Number.isInteger(frameNumber) || frameNumber < 0 || frameNumber > 45) {
  throw new Error(`invalid frame ${frame}; expected 0-45`);
}

const blend = resolve(process.cwd(), firstValue('blend') ?? `assets/art/masters/characters/rigs/${char}.blend`);
if (!existsSync(blend)) {
  throw new Error(`missing Blender rig ${blend}. Create this rig first, with timeline frames 0-45 matching the runtime sheet contract.`);
}

const out = resolve(process.cwd(), firstValue('out') ?? `assets/art/review/blender/${char}_frame_${frameNumber}.png`);
mkdirSync(dirname(out), { recursive: true });

const exe = requireBlender();
const script = resolve(process.cwd(), 'tools/blender/render-character-frame.py');
const result = spawnSync(
  exe,
  ['--background', blend, '--python', script, '--', '--char', char, '--frame', String(frameNumber), '--out', out],
  { encoding: 'utf8' },
);

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (result.error) throw result.error;
if (result.status !== 0) throw new Error(`Blender exited with status ${result.status}`);
if (!existsSync(out)) throw new Error(`Blender did not write ${out}`);

console.log(`${char}: rendered Blender frame ${frameNumber} to ${out}`);
