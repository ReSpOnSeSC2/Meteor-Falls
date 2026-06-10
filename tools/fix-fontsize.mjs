import fs from 'node:fs';
const fixes = [
  ['src/ui/windows.ts', "'retro', vars(o), 9)", "'retro', vars(o), 6)"],
  [
    'src/scenes/SpriteLabScene.ts',
    "'retro', id.toUpperCase().slice(0, 8), 9)",
    "'retro', id.toUpperCase().slice(0, 8), 6)",
  ],
];
for (const [f, from, to] of fixes) {
  let t = fs.readFileSync(f, 'utf8');
  if (!t.includes(from)) {
    console.log('MISS ' + f);
    continue;
  }
  fs.writeFileSync(f, t.split(from).join(to), 'utf8');
  console.log('fixed ' + f);
}
