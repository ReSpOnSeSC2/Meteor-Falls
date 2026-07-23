import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import http from 'node:http';
import { networkInterfaces } from 'node:os';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { pathToFileURL } from 'node:url';
import { constants as zlibConstants, createBrotliCompress, createGzip } from 'node:zlib';

const DEFAULT_HOST = '0.0.0.0';
const DEFAULT_PORT = 4173;
const COMPRESSION_THRESHOLD = 1024;
const HASHED_ASSET = /-[A-Za-z0-9_-]{8,}\.[^.]+$/;

const MIME_TYPES = new Map([
  ['.avif', 'image/avif'],
  ['.css', 'text/css; charset=utf-8'],
  ['.gif', 'image/gif'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.mp3', 'audio/mpeg'],
  ['.mp4', 'video/mp4'],
  ['.ogg', 'audio/ogg'],
  ['.otf', 'font/otf'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml; charset=utf-8'],
  ['.ttf', 'font/ttf'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.wasm', 'application/wasm'],
  ['.wav', 'audio/wav'],
  ['.webm', 'video/webm'],
  ['.webp', 'image/webp'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
  ['.xml', 'application/xml; charset=utf-8'],
]);

const COMPRESSIBLE_TYPES = [
  'application/javascript',
  'application/json',
  'application/xml',
  'image/svg+xml',
  'text/',
];

const SECURITY_HEADERS = Object.freeze({
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
});

function sendText(response, statusCode, body, extraHeaders = {}, omitBody = false) {
  const payload = Buffer.from(body, 'utf8');
  response.writeHead(statusCode, {
    ...SECURITY_HEADERS,
    'Cache-Control': 'no-store',
    'Content-Length': payload.byteLength,
    'Content-Type': 'text/plain; charset=utf-8',
    ...extraHeaders,
  });
  if (omitBody) response.end();
  else response.end(payload);
}

function isInside(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function requestPath(rawUrl) {
  const rawPath = String(rawUrl ?? '/').split(/[?#]/, 1)[0] || '/';
  let decoded;
  try {
    decoded = decodeURIComponent(rawPath);
  } catch {
    return { error: 400 };
  }

  if (decoded.includes('\0')) return { error: 400 };
  const portablePath = decoded.replaceAll('\\', '/');
  const segments = portablePath.split('/').filter(Boolean);
  if (segments.some((segment) => segment.startsWith('.') || segment.includes(':'))) {
    return { error: 403 };
  }
  return { pathname: portablePath };
}

function cacheControl(filePath) {
  const basename = path.basename(filePath);
  if (basename === 'index.html' || path.extname(basename).toLowerCase() === '.html') {
    return 'no-cache';
  }
  if (HASHED_ASSET.test(basename)) {
    return 'public, max-age=31536000, immutable';
  }
  return 'public, max-age=3600, must-revalidate';
}

function weakEtag(fileStat) {
  return `W/\"${fileStat.size.toString(16)}-${Math.trunc(fileStat.mtimeMs).toString(16)}\"`;
}

function isNotModified(request, etag, modifiedAt) {
  const noneMatch = request.headers['if-none-match'];
  if (noneMatch) {
    return noneMatch.split(',').map((value) => value.trim()).some((value) => value === '*' || value === etag);
  }

  const since = request.headers['if-modified-since'];
  if (!since) return false;
  const timestamp = Date.parse(since);
  return Number.isFinite(timestamp) && Math.trunc(modifiedAt.getTime() / 1000) <= Math.trunc(timestamp / 1000);
}

function parseRange(header, size) {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || size === 0) return { invalid: true };

  const [, startText, endText] = match;
  if (!startText && !endText) return { invalid: true };

  let start;
  let end;
  if (!startText) {
    const suffixLength = Number(endText);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) return { invalid: true };
    start = Math.max(0, size - suffixLength);
    end = size - 1;
  } else {
    start = Number(startText);
    end = endText ? Number(endText) : size - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end < start || start >= size) {
      return { invalid: true };
    }
    end = Math.min(end, size - 1);
  }

  return { start, end };
}

function ifRangeMatches(header, etag, modifiedAt) {
  if (!header) return true;
  const value = header.trim();
  if (value.startsWith('"') || value.startsWith('W/')) {
    // If-Range requires a strong validator. This server deliberately uses a
    // weak metadata ETag, so an ETag-form If-Range must fall back to a full 200.
    return !etag.startsWith('W/') && value === etag;
  }
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && Math.trunc(modifiedAt.getTime() / 1000) <= Math.trunc(timestamp / 1000);
}

function acceptedEncoding(header) {
  if (!header) return null;
  const qualities = new Map();
  for (const item of header.split(',')) {
    const [rawName, ...parameters] = item.trim().toLowerCase().split(';');
    if (!rawName) continue;
    let quality = 1;
    for (const parameter of parameters) {
      const match = /^\s*q\s*=\s*(0(?:\.\d{0,3})?|1(?:\.0{0,3})?)\s*$/.exec(parameter);
      if (match) quality = Number(match[1]);
    }
    qualities.set(rawName, quality);
  }

  const wildcard = qualities.get('*') ?? 0;
  const candidates = [
    { name: 'br', quality: qualities.get('br') ?? wildcard, preference: 2 },
    { name: 'gzip', quality: qualities.get('gzip') ?? wildcard, preference: 1 },
  ]
    .filter((candidate) => candidate.quality > 0)
    .sort((a, b) => b.quality - a.quality || b.preference - a.preference);
  return candidates[0]?.name ?? null;
}

function contentType(filePath) {
  return MIME_TYPES.get(path.extname(filePath).toLowerCase()) ?? 'application/octet-stream';
}

function isCompressible(type) {
  const bareType = type.split(';', 1)[0];
  return COMPRESSIBLE_TYPES.some((prefix) => bareType === prefix || bareType.startsWith(prefix));
}

async function resolveFile(root, realRoot, pathname) {
  const relativeRequest = `.${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
  const candidate = path.resolve(root, relativeRequest);
  if (!isInside(root, candidate)) return { error: 403 };

  let candidateStat;
  try {
    candidateStat = await stat(candidate);
  } catch (error) {
    if (error?.code === 'ENOENT' || error?.code === 'ENOTDIR') return { error: 404 };
    throw error;
  }

  let filePath = candidate;
  if (candidateStat.isDirectory()) {
    if (pathname !== '/' && pathname !== '') return { error: 404 };
    filePath = path.join(candidate, 'index.html');
    try {
      candidateStat = await stat(filePath);
    } catch (error) {
      if (error?.code === 'ENOENT' || error?.code === 'ENOTDIR') return { error: 404 };
      throw error;
    }
  }
  if (!candidateStat.isFile()) return { error: 404 };

  const realFile = await realpath(filePath);
  if (!isInside(realRoot, realFile)) return { error: 403 };
  return { filePath: realFile, fileStat: candidateStat };
}

async function serveHealth(request, response) {
  const payload = Buffer.from(JSON.stringify({ status: 'ok', service: 'meteor-falls' }), 'utf8');
  response.writeHead(200, {
    ...SECURITY_HEADERS,
    'Cache-Control': 'no-store',
    'Content-Length': payload.byteLength,
    'Content-Type': 'application/json; charset=utf-8',
  });
  if (request.method === 'HEAD') response.end();
  else response.end(payload);
}

async function serveRequest(request, response, options) {
  const { root, realRoot, compression } = options;
  const method = request.method ?? 'GET';
  if (method !== 'GET' && method !== 'HEAD') {
    sendText(response, 405, 'Method Not Allowed\n', { Allow: 'GET, HEAD' });
    return;
  }

  const parsed = requestPath(request.url);
  if (parsed.error) {
    sendText(response, parsed.error, 'Bad Request\n', {}, method === 'HEAD');
    return;
  }
  if (parsed.pathname === '/__health') {
    await serveHealth(request, response);
    return;
  }

  const resolved = await resolveFile(root, realRoot, parsed.pathname);
  if (resolved.error) {
    const label = resolved.error === 403 ? 'Forbidden' : 'Not Found';
    sendText(response, resolved.error, `${label}\n`, {}, method === 'HEAD');
    return;
  }

  const { filePath, fileStat } = resolved;
  const type = contentType(filePath);
  const etag = weakEtag(fileStat);
  const modified = fileStat.mtime.toUTCString();
  const mayCompress = compression && fileStat.size >= COMPRESSION_THRESHOLD && isCompressible(type);
  const baseHeaders = {
    ...SECURITY_HEADERS,
    'Accept-Ranges': 'bytes',
    'Cache-Control': cacheControl(filePath),
    'Content-Type': type,
    ETag: etag,
    'Last-Modified': modified,
    ...(mayCompress ? { Vary: 'Accept-Encoding' } : {}),
  };

  if (isNotModified(request, etag, fileStat.mtime)) {
    response.writeHead(304, baseHeaders);
    response.end();
    return;
  }

  const rangeHeader = ifRangeMatches(request.headers['if-range'], etag, fileStat.mtime)
    ? request.headers.range
    : undefined;
  const range = parseRange(rangeHeader, fileStat.size);
  if (range?.invalid) {
    response.writeHead(416, {
      ...baseHeaders,
      'Content-Range': `bytes */${fileStat.size}`,
      'Content-Length': 0,
    });
    response.end();
    return;
  }

  if (range) {
    const length = range.end - range.start + 1;
    response.writeHead(206, {
      ...baseHeaders,
      'Content-Length': length,
      'Content-Range': `bytes ${range.start}-${range.end}/${fileStat.size}`,
    });
    if (method === 'HEAD') {
      response.end();
      return;
    }
    await pipeline(createReadStream(filePath, { start: range.start, end: range.end }), response);
    return;
  }

  const encoding = mayCompress ? acceptedEncoding(request.headers['accept-encoding']) : null;
  const headers = { ...baseHeaders };
  if (encoding) headers['Content-Encoding'] = encoding;
  else headers['Content-Length'] = fileStat.size;

  response.writeHead(200, headers);
  if (method === 'HEAD') {
    response.end();
    return;
  }

  const input = createReadStream(filePath);
  if (encoding === 'br') {
    await pipeline(input, createBrotliCompress({
      params: {
        [zlibConstants.BROTLI_PARAM_QUALITY]: 4,
        [zlibConstants.BROTLI_PARAM_SIZE_HINT]: fileStat.size,
      },
    }), response);
  } else if (encoding === 'gzip') await pipeline(input, createGzip(), response);
  else await pipeline(input, response);
}

export async function createGameServer({ root = path.resolve('dist'), compression = true, logger = console } = {}) {
  const resolvedRoot = path.resolve(root);
  let rootStat;
  try {
    rootStat = await stat(path.join(resolvedRoot, 'index.html'));
  } catch {
    throw new Error(`Production build not found at ${path.join(resolvedRoot, 'index.html')}. Run \"npm run build\" first.`);
  }
  if (!rootStat.isFile()) {
    throw new Error(`Production build is invalid: ${path.join(resolvedRoot, 'index.html')} is not a file.`);
  }
  const realRoot = await realpath(resolvedRoot);

  const server = http.createServer((request, response) => {
    void serveRequest(request, response, { root: resolvedRoot, realRoot, compression }).catch((error) => {
      if (error?.code === 'ECONNRESET' || response.destroyed) return;
      logger.error?.(`[server] ${error?.stack ?? error}`);
      if (!response.headersSent) sendText(response, 500, 'Internal Server Error\n', {}, request.method === 'HEAD');
      else response.destroy();
    });
  });

  server.headersTimeout = 10_000;
  server.requestTimeout = 30_000;
  server.keepAliveTimeout = 5_000;
  server.maxRequestsPerSocket = 1_000;
  return server;
}

export function lanAddresses(interfaces = networkInterfaces()) {
  const addresses = [];
  for (const [name, rows] of Object.entries(interfaces)) {
    for (const row of rows ?? []) {
      const family = typeof row.family === 'string' ? row.family : row.family === 4 ? 'IPv4' : 'IPv6';
      const octets = row.address.split('.').map(Number);
      const isPrivate = octets.length === 4 && (
        octets[0] === 10
        || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
        || (octets[0] === 192 && octets[1] === 168)
      );
      if (family !== 'IPv4' || row.internal || !isPrivate) continue;
      addresses.push({ address: row.address, name });
    }
  }
  const unique = addresses.filter((row, index) => addresses.findIndex((other) => other.address === row.address) === index);
  const rank = (name) => {
    const label = name.toLowerCase();
    if (/virtual|vethernet|hyper-v|wsl|docker|vmware|vpn|tailscale|wireguard|zerotier/.test(label)) return 2;
    if (/wi-?fi|wireless|ethernet|local area/.test(label)) return 0;
    return 1;
  };
  return unique.sort((a, b) => rank(a.name) - rank(b.name) || a.name.localeCompare(b.name));
}

export function httpUrl(host, port) {
  const urlHost = host.includes(':') && !host.startsWith('[') ? `[${host}]` : host;
  return `http://${urlHost}:${port}/`;
}

function parsePort(value) {
  if (!/^\d+$/.test(String(value))) throw new Error(`Invalid port \"${value}\". Use a whole number from 1 to 65535.`);
  const port = Number(value);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`Invalid port \"${value}\". Use a whole number from 1 to 65535.`);
  }
  return port;
}

export function parseArgs(argv, env = process.env) {
  const options = {
    host: env.HOST || DEFAULT_HOST,
    port: parsePort(env.PORT || DEFAULT_PORT),
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--help' || argument === '-h') {
      options.help = true;
    } else if (argument === '--host') {
      const value = argv[++index];
      if (!value) throw new Error('--host requires an address, such as 0.0.0.0 or 127.0.0.1.');
      options.host = value;
    } else if (argument === '--port') {
      const value = argv[++index];
      if (!value) throw new Error('--port requires a value.');
      options.port = parsePort(value);
    } else {
      throw new Error(`Unknown option \"${argument}\". Run with --help for usage.`);
    }
  }
  return options;
}

function usage() {
  return [
    'Meteor Falls production LAN server',
    '',
    'Usage: node tools/serve-game.mjs [--host ADDRESS] [--port NUMBER]',
    '',
    'Environment: HOST and PORT override the defaults (0.0.0.0:4173).',
  ].join('\n');
}

function listen(server, { host, port }) {
  return new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off('listening', onListening);
      reject(error);
    };
    const onListening = () => {
      server.off('error', onError);
      resolve();
    };
    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(port, host);
  });
}

export async function main(argv = process.argv.slice(2)) {
  let options;
  try {
    options = parseArgs(argv);
  } catch (error) {
    console.error(`\n${error.message}\n\n${usage()}\n`);
    process.exitCode = 1;
    return;
  }
  if (options.help) {
    console.log(usage());
    return;
  }

  let server;
  try {
    server = await createGameServer();
    await listen(server, options);
  } catch (error) {
    if (error?.code === 'EADDRINUSE') {
      console.error(`\nPort ${options.port} is already in use. Stop the other server or run: npm run serve:dist -- --port 4174\n`);
    } else if (error?.code === 'EACCES') {
      console.error(`\nWindows denied access to ${options.host}:${options.port}. Try another port or allow Node.js through Windows Defender Firewall on Private networks.\n`);
    } else {
      console.error(`\n${error?.message ?? error}\n`);
    }
    process.exitCode = 1;
    return;
  }

  const boundAddress = server.address();
  const boundPort = typeof boundAddress === 'object' && boundAddress ? boundAddress.port : options.port;
  const wildcard = options.host === DEFAULT_HOST || options.host === '::';
  const loopback = options.host === '127.0.0.1' || options.host === 'localhost' || options.host === '::1';

  console.log('\nMETEOR FALLS is ready. Keep this window open while you play.');
  console.log(`  This PC: ${wildcard ? httpUrl('localhost', boundPort) : httpUrl(options.host, boundPort)}`);
  const addresses = lanAddresses();
  if (wildcard) {
    if (addresses.length === 0) {
      console.log('  Phone:   no active private LAN IPv4 address was detected');
    } else {
      addresses.forEach(({ address, name }, index) => {
        console.log(`  ${index === 0 ? 'Phone:  ' : '         '} ${httpUrl(address, boundPort)}  (${name})`);
      });
    }
  } else if (!loopback) {
    console.log(`  Phone:   ${httpUrl(options.host, boundPort)}`);
  }
  console.log('\nUse the phone URL in Chrome while both devices are on the same Wi-Fi. Press Ctrl+C to stop.\n');

  let closing = false;
  const shutdown = () => {
    if (closing) return;
    closing = true;
    console.log('\nStopping METEOR FALLS server...');
    const force = setTimeout(() => {
      server.closeAllConnections?.();
      process.exitCode = 1;
    }, 5_000);
    force.unref();
    server.close(() => clearTimeout(force));
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

const entryPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (import.meta.url === entryPath) {
  void main();
}
