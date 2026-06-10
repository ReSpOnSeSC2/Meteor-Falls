// Dev-only screenshot receiver: the game POSTs renderer snapshots here so
// art can be reviewed from the filesystem. Not part of the shipped game.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.join(process.cwd(), '.shots');
fs.mkdirSync(OUT, { recursive: true });

http
  .createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    if (req.method !== 'POST') {
      res.writeHead(404);
      res.end();
      return;
    }
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      try {
        const { name, dataUrl } = JSON.parse(body);
        const b64 = dataUrl.split(',')[1];
        const safe = String(name).replace(/[^a-z0-9_-]/gi, '_');
        fs.writeFileSync(path.join(OUT, `${safe}.png`), Buffer.from(b64, 'base64'));
        res.writeHead(200);
        res.end('ok');
        console.log(`saved ${safe}.png`);
      } catch (e) {
        res.writeHead(400);
        res.end(String(e));
      }
    });
  })
  .listen(5179, () => console.log('shot server on :5179'));
