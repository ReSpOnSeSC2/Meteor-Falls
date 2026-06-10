// One-shot repair: PowerShell 5.1 read UTF-8 as cp1252 and re-wrote as UTF-8,
// double-encoding non-ASCII. Map the mojibake back to the real characters.
import fs from 'node:fs';

const files = [
  'src/ui/windows.ts',
  'src/scenes/TitleScene.ts',
  'src/scenes/OverworldScene.ts',
  'src/scenes/SpriteLabScene.ts',
  'src/scenes/BattleScene.ts',
];

const fixes = [
  ['â€”', '—'], // em dash
  ['Â§', '§'], // section sign
  ['â–¼', '▼'], // black down triangle
  ['â–¶', '▶'], // black right triangle
  ['â€¦', '…'], // ellipsis
  ['â‰ˆ', '≈'], // almost equal
  ['Ã—', '×'], // multiplication sign
  ['â†’', '→'], // right arrow
];

for (const f of files) {
  let txt = fs.readFileSync(f, 'utf8');
  let count = 0;
  for (const [bad, good] of fixes) {
    const before = txt.length;
    txt = txt.split(bad).join(good);
    count += (before - txt.length) / Math.max(1, bad.length - good.length);
  }
  fs.writeFileSync(f, txt, 'utf8');
  console.log(`${f}: ${count} repairs`);
}
