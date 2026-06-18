import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function executableFromEnv(): string | null {
  const explicit = process.env.BLENDER_EXE ?? process.env.BLENDER;
  if (explicit && existsSync(explicit)) return explicit;
  return null;
}

function executableFromPath(): string | null {
  const found = spawnSync('where.exe', ['blender'], { encoding: 'utf8' });
  if (found.status !== 0 || !found.stdout) return null;
  for (const line of found.stdout.split(/\r?\n/)) {
    const path = line.trim();
    if (path && existsSync(path)) return path;
  }
  return null;
}

function executableFromProgramFiles(): string | null {
  const roots = ['C:\\Program Files\\Blender Foundation', 'C:\\Program Files (x86)\\Blender Foundation'];
  const candidates: string[] = [];
  for (const root of roots) {
    if (!existsSync(root)) continue;
    for (const name of readdirSync(root)) {
      if (!/^Blender/i.test(name)) continue;
      const exe = join(root, name, 'blender.exe');
      if (existsSync(exe)) candidates.push(exe);
    }
  }
  return candidates.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))[0] ?? null;
}

export function findBlender(): string | null {
  return executableFromEnv() ?? executableFromPath() ?? executableFromProgramFiles();
}

export function requireBlender(): string {
  const exe = findBlender();
  if (!exe) {
    throw new Error('Blender not found. Set BLENDER_EXE to blender.exe, or install Blender under Program Files.');
  }
  return exe;
}
