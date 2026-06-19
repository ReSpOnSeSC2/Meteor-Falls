// tools/ref-server.js — minimal static server for .shots/ over http://127.0.0.1
// Used by the ChatGPT character-sheet workflow: display a reference PNG in a
// browser tab so it can be screenshotted and pushed into the composer via
// upload_image (clipboard paste + CSP-blocked fetch are both unreliable).
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '.shots');
const PORT = Number(process.env.REF_PORT || 8799);

http
  .createServer((req, res) => {
    const u = decodeURIComponent(req.url.split('?')[0]);
    const f = path.join(ROOT, path.normalize(u).replace(/^([/\\])+/, ''));
    if (!f.startsWith(ROOT)) {
      res.writeHead(403);
      return res.end('forbidden');
    }
    fs.readFile(f, (e, buf) => {
      if (e) {
        res.writeHead(404);
        return res.end('not found');
      }
      const ext = path.extname(f).toLowerCase();
      const ct = ext === '.png' ? 'image/png' : ext === '.html' ? 'text/html; charset=utf-8' : 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': ct, 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' });
      res.end(buf);
    });
  })
  .listen(PORT, '127.0.0.1', () => console.log('ref-server on http://127.0.0.1:' + PORT + ' root ' + ROOT));
