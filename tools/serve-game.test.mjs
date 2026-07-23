import { brotliDecompressSync } from 'node:zlib';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import http from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createGameServer, httpUrl, lanAddresses, parseArgs } from './serve-game.mjs';

let root;
let server;
let port;

function request(requestPath, { method = 'GET', headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path: requestPath, method, headers }, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve({
        status: response.statusCode,
        headers: response.headers,
        body: Buffer.concat(chunks),
      }));
    });
    req.on('error', reject);
    req.end();
  });
}

beforeAll(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'meteor-falls-server-'));
  await mkdir(path.join(root, 'assets'));
  await writeFile(path.join(root, 'index.html'), '<!doctype html><title>METEOR FALLS</title>', 'utf8');
  await writeFile(path.join(root, 'assets', 'index-AB12cd_9.js'), `console.log('${'meteor'.repeat(400)}');`, 'utf8');
  await writeFile(path.join(root, 'assets', 'sprite.png'), Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]));
  server = await createGameServer({ root, logger: { error: () => undefined } });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  port = server.address().port;
});

afterAll(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (root) await rm(root, { recursive: true, force: true });
});

describe('production game server', () => {
  it('serves the game root with safe headers and revalidated HTML caching', async () => {
    const response = await request('/');
    expect(response.status).toBe(200);
    expect(response.body.toString()).toContain('METEOR FALLS');
    expect(response.headers['content-type']).toBe('text/html; charset=utf-8');
    expect(response.headers['cache-control']).toBe('no-cache');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
  });

  it('supports HEAD and conditional ETag requests', async () => {
    const head = await request('/index.html', { method: 'HEAD' });
    expect(head.status).toBe(200);
    expect(head.body).toHaveLength(0);
    expect(Number(head.headers['content-length'])).toBeGreaterThan(0);

    const cached = await request('/index.html', { headers: { 'If-None-Match': head.headers.etag } });
    expect(cached.status).toBe(304);
    expect(cached.body).toHaveLength(0);
  });

  it('compresses text and gives hashed Vite assets immutable caching', async () => {
    const response = await request('/assets/index-AB12cd_9.js', { headers: { 'Accept-Encoding': 'br, gzip;q=0.8' } });
    expect(response.status).toBe(200);
    expect(response.headers['content-encoding']).toBe('br');
    expect(response.headers['cache-control']).toBe('public, max-age=31536000, immutable');
    expect(brotliDecompressSync(response.body).toString()).toContain('meteor');
  });

  it('supports byte ranges without compressing the response', async () => {
    const response = await request('/assets/sprite.png', { headers: { Range: 'bytes=2-5', 'Accept-Encoding': 'br' } });
    expect(response.status).toBe(206);
    expect([...response.body]).toEqual([2, 3, 4, 5]);
    expect(response.headers['content-range']).toBe('bytes 2-5/10');
    expect(response.headers['content-encoding']).toBeUndefined();

    const stale = await request('/assets/sprite.png', { headers: { Range: 'bytes=2-5', 'If-Range': '"stale"' } });
    expect(stale.status).toBe(200);
    expect([...stale.body]).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('has a live health check and never falls back unknown files to HTML', async () => {
    const health = await request('/__health');
    expect(health.status).toBe(200);
    expect(JSON.parse(health.body.toString())).toEqual({ status: 'ok', service: 'meteor-falls' });
    expect((await request('/missing.js')).status).toBe(404);
    expect((await request('/not-a-route')).status).toBe(404);
    const missingHead = await request('/missing.js', { method: 'HEAD' });
    expect(missingHead.status).toBe(404);
    expect(missingHead.body).toHaveLength(0);
  });

  it('rejects traversal and unsupported methods', async () => {
    expect((await request('/%2e%2e%2foutside.txt')).status).toBe(403);
    expect((await request('/.git/config')).status).toBe(403);
    expect((await request('/index.html::$DATA')).status).toBe(403);
    const post = await request('/', { method: 'POST' });
    expect(post.status).toBe(405);
    expect(post.headers.allow).toBe('GET, HEAD');
  });
});

describe('server configuration', () => {
  it('parses stable defaults and explicit overrides', () => {
    expect(parseArgs([], {})).toMatchObject({ host: '0.0.0.0', port: 4173 });
    expect(parseArgs(['--host', '127.0.0.1', '--port', '9000'], {})).toMatchObject({ host: '127.0.0.1', port: 9000 });
    expect(() => parseArgs(['--port', '70000'], {})).toThrow(/Invalid port/);
  });

  it('returns unique, usable IPv4 LAN addresses', () => {
    const addresses = lanAddresses({
      vEthernet: [{ address: '172.20.0.1', family: 'IPv4', internal: false }],
      WiFi: [
        { address: '192.168.5.24', family: 'IPv4', internal: false },
        { address: 'fe80::1', family: 'IPv6', internal: false },
      ],
      Public: [{ address: '203.0.113.10', family: 'IPv4', internal: false }],
      Loopback: [{ address: '127.0.0.1', family: 'IPv4', internal: true }],
    });
    expect(addresses).toEqual([
      { address: '192.168.5.24', name: 'WiFi' },
      { address: '172.20.0.1', name: 'vEthernet' },
    ]);
  });

  it('formats IPv4, hostnames, and IPv6 as valid HTTP URLs', () => {
    expect(httpUrl('localhost', 4173)).toBe('http://localhost:4173/');
    expect(httpUrl('192.168.5.24', 4173)).toBe('http://192.168.5.24:4173/');
    expect(httpUrl('::1', 4173)).toBe('http://[::1]:4173/');
  });
});
