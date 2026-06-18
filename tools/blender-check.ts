import { spawnSync } from 'node:child_process';
import { requireBlender } from './blender-utils';

const exe = requireBlender();
console.log(`Blender: ${exe}`);

const version = spawnSync(exe, ['--background', '--version'], { encoding: 'utf8' });
if (version.error) throw version.error;
if (version.status !== 0) {
  throw new Error(version.stderr || `Blender exited with status ${version.status}`);
}

const firstLine = version.stdout.split(/\r?\n/).find(Boolean);
console.log(firstLine ?? version.stdout.trim());
