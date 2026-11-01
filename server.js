/**
 * Local Edge Middleware Emulator for Flippy v3
 * Runs the exact same Edge Gate & Device-Lock logic locally on http://localhost:3000
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const SECRET = process.env.FLIPPY_SECRET || "FLIPPY_SECRET_SALT_2026_9b83f0c1";

// Whitelisted SHA-256 Hashes
const AUTHORIZED_KEYS = {
  // Kingdom: FLIPPY-USER-KINGDOM
  "33ad58fde95c763e2062908abab3ac5dcdaf2d838527997cf382dd9d4e59af5d": { user: "Kingdom", role: "member", maxDevices: 1 },
  // CJ: FLIPPY-USER-CJ
  "46dfb1bc7eec26ebd4357924a6da9ce898d00c7eef9adfd995dae9a1c28e3214": { user: "CJ", role: "member", maxDevices: 1 },
  // VIP: FLIPPY-USER-VIP
  "9b1af68f54ea936b7099b4b8ce6c75a36b0370169e2ce14234bd526024d3fb7d": { user: "VIP", role: "member", maxDevices: 1 },
  // Gojo: FLIPPY-USER-GOJO
  "cf4447344d3819c58c999b4060f6c5d4f9d2c3bbfb67d8f80f4fc7d2ddc7697a": { user: "Gojo", role: "member", maxDevices: 1 },
};

// Persistent Disk-Backed Device Lock Store
const LOCKS_FILE = path.join(__dirname, 'device_locks.json');

function getDeviceLocks() {
  try {
    if (fs.existsSync(LOCKS_FILE)) {
      return JSON.parse(fs.readFileSync(LOCKS_FILE, 'utf8') || '{}');
    }
  } catch (e) {}
  return {};
}

function saveDeviceLock(keyHash, devId) {
  const locks = getDeviceLocks();
  locks[keyHash] = devId;
  try {
    fs.writeFileSync(LOCKS_FILE, JSON.stringify(locks, null, 2), 'utf8');
  } catch (e) {}
}

function sha256Hex(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

function signData(data) {
  return crypto.createHmac('sha256', SECRET).update(data).digest('hex');
}

function parseCookies(header) {
  const map = {};
  if (!header) return map;
  header.split(';').forEach(p => {
    const pair = p.trim().split('=');
    if (pair.length >= 2) {
      map[decodeURIComponent(pair[0].trim())] = decodeURIComponent(pair.slice(1).join('=').trim());
    }
  });
  return map;
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.wav': 'audio/wav'
};

const YT_BLOCKED_CHANNELS = [
  'crunchyroll', 'crunchyroll collection', 'crunchyroll dubs',
  'netflix', 'netflix anime', 'toei animation', 'muse asia',
  'ani-one asia', 'aniplex', 'vizmedia', 'viz media', 'funimation',
  'kadokawa', 'kadokawaanime', 'mappa', 'mappa channel', 'gundaminfo',
  'bandai namco', 'tms entertainment', 'pony canyon', 'toho animation',
  'shonen jump', 'sony pictures', 'sony pictures entertainment',
  'warner bros. pictures', 'warner bros', 'universal pictures',
  'paramount pictures', 'walt disney studios', 'marvel entertainment',
  '20th century studios', 'lionsgate movies', 'mgm', 'a24',
  'youtube movies', 'prime video', 'hulu', 'peacock', 'hbo', 'max'
];

const YT_BLOCKED_TITLE_PATTERNS = [
  /\bfull\s+movie\b/i,
  /\bfull\s+episode\b/i,
  /\b(?:episode|ep\.?)\s*\d+\s*(?:\||-|\[|\(|full|eng\s*sub|sub|dub)/i,
  /\bs\d{1,2}\s*e\d{1,3}\b/i,
  /\b(?:eng(?:lish)?\s+sub(?:s|titled)?|multi\s*sub)\b.*\b(?:episode|ep\.?\s*\d+|anime)\b/i,
  /\b(?:anime\s+full\s+episode|official\s+episode)\b/i,
  /\b(?:complete\s+feature\s+film|official\s+full\s+movie)\b/i
];

const YT_ALLOWED_FORMATS = new Set([
  '4k', '1440', '1080', '720', '480', '360',
  'mp3', 'm4a', 'aac', 'flac', 'opus', 'wav', 'webm'
]);

function setYtCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
}

function sendYtJson(res, status, payload) {
  setYtCors(res);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

async function verifyYoutubeCompliance(ytUrl) {
  try {
    const oembedUrl = 'https://www.youtube.com/oembed?url=' + encodeURIComponent(ytUrl) + '&format=json';
    const r = await fetch(oembedUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!r.ok) return { allowed: true };
    const meta = await r.json();
    const author = String(meta.author_name || '').toLowerCase().trim();
    const title = String(meta.title || '').trim();

    for (const ch of YT_BLOCKED_CHANNELS) {
      if (author === ch || author.includes(ch)) {
        return {
          allowed: false,
          reason: `Restricted Channel: "${meta.author_name}" is a protected Movie / Anime distributor.`
        };
      }
    }
    for (const pat of YT_BLOCKED_TITLE_PATTERNS) {
      if (pat.test(title)) {
        return {
          allowed: false,
          reason: 'Restricted Content: Title matches protected Full Movie or Anime Episode broadcast pattern.'
        };
      }
    }
    return { allowed: true };
  } catch (_) {
    return { allowed: true };
  }
}

async function fetchUpstreamYtJson(pathname, queryObj) {
  const hosts = ['https://p.savenow.to', 'https://p.lbserver.xyz'];
  const qs = new URLSearchParams(queryObj).toString();
  let lastErr = null;

  for (const host of hosts) {
    try {
      const r = await fetch(`${host}${pathname}?${qs}`, {
        method: 'GET',
        headers: {
          'Origin': host,
          'Referer': `${host}/api/button/`,
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
          'Accept': 'application/json'
        }
      });
      if (r.ok) return await r.json();
      lastErr = new Error(`Upstream HTTP ${r.status}`);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('Upstream MP4 muxer unavailable');
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    setYtCors(res);
    res.writeHead(204);
    return res.end();
  }

  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;

  // Direct MP4 Stream Proxy Routes (Mobile / iPhone Photos & Desktop)
  if (pathname === '/__flippy_yt_ping') {
    return sendYtJson(res, 200, { ok: true, engine: 'flippy-v3-mp4-muxer' });
  }

  if (pathname === '/__flippy_yt_dl') {
    const ytUrl = (urlObj.searchParams.get('url') || '').trim();
    const rawFmt = (urlObj.searchParams.get('format') || '1080').trim().toLowerCase();
    const format = YT_ALLOWED_FORMATS.has(rawFmt) ? rawFmt : '1080';

    if (!ytUrl || !/(?:youtube\.com|youtu\.be)/i.test(ytUrl)) {
      return sendYtJson(res, 400, { success: false, error: 'Invalid YouTube URL' });
    }

    const compliance = await verifyYoutubeCompliance(ytUrl);
    if (!compliance.allowed) {
      return sendYtJson(res, 403, { success: false, error: compliance.reason });
    }

    try {
      const data = await fetchUpstreamYtJson('/api/v2/download', {
        button: '1',
        format,
        iframe_source: 'https://flippy.studio/',
        url: ytUrl
      });
      return sendYtJson(res, 200, data);
    } catch (err) {
      return sendYtJson(res, 502, { success: false, error: err.message || 'Upstream muxer unreachable' });
    }
  }

  if (pathname === '/__flippy_yt_progress') {
    const id = (urlObj.searchParams.get('id') || '').trim();
    if (!id) {
      return sendYtJson(res, 400, { success: false, error: 'Missing conversion job id' });
    }
    try {
      const data = await fetchUpstreamYtJson('/api/progress', { id });
      return sendYtJson(res, 200, data);
    } catch (err) {
      return sendYtJson(res, 502, { success: false, error: err.message || 'Progress poll failed' });
    }
  }

  // Diagnostic Endpoint
  if (pathname === '/__flippy_status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      status: "online",
      runtime: "Local Node.js Edge Simulator",
      disk_persistence_active: true,
      active_locks: getDeviceLocks()
    }, null, 2));
  }

  // 1. Auth Endpoint
  if (pathname === '/__flippy_auth' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const rawKey = (parsed.key || '').trim();
        const devId = (parsed.deviceId || '').trim().slice(0, 64) || 'dev_unknown';
        const slotSuffix = parsed.mode === 'app' ? ':app' : '';

        if (!rawKey) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Please enter an access key.' }));
        }

        const keyHash = sha256Hex(rawKey);
        let match = AUTHORIZED_KEYS[keyHash];

        if (!match) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Access Denied: Invalid Key.' }));
        }

        // Device Lock check with persistent disk storage
        if (match.maxDevices === 1) {
          const locks = getDeviceLocks();
          const bound = locks[keyHash + slotSuffix];
          if (bound && bound !== devId) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Key locked to another device. Contact admin to reset.' }));
          }
          saveDeviceLock(keyHash + slotSuffix, devId);
        }

        const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
        const payload = `${encodeURIComponent(match.user)}:${match.role}:${devId}:${expiresAt}`;
        const sig = signData(payload);
        const token = `${payload}:${sig}`;

        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Set-Cookie': `flippy_edge_session=${encodeURIComponent(token)}; Path=/; Max-Age=604800; HttpOnly; SameSite=Lax`
        });
        return res.end(JSON.stringify({ success: true, user: match.user }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Server error: ' + err.message }));
      }
    });
    return;
  }

  // 2. Logout Endpoint
  if (pathname === '/__flippy_logout') {
    res.writeHead(302, {
      'Location': '/',
      'Set-Cookie': 'flippy_edge_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax'
    });
    return res.end();
  }

  // 3. Verify Session Cookie
  const cookies = parseCookies(req.headers.cookie);
  const sessionToken = cookies['flippy_edge_session'];
  let isAuthorized = false;

  if (sessionToken) {
    try {
      const parts = sessionToken.split(':');
      if (parts.length === 5) {
        const user = decodeURIComponent(parts[0]);
        const role = parts[1];
        const devId = parts[2];
        const exp = parseInt(parts[3], 10);
        const sig = parts[4];
        const payload = `${parts[0]}:${role}:${devId}:${exp}`;

        if (exp > Date.now() && signData(payload) === sig) {
          isAuthorized = true;
        }
      }
    } catch (e) {
      isAuthorized = false;
    }
  }

  // 4. If NOT authorized: stream ONLY Edge Gate Login HTML (Zero assets leaked)
  if (!isAuthorized) {
    // Read the HTML template directly from worker.js or functions/_middleware.js
    let gateHtml = '';
    const workerPath = path.join(__dirname, 'worker.js');
    const middlewarePath = path.join(__dirname, 'functions', '_middleware.js');
    const targetFile = fs.existsSync(workerPath) ? workerPath : (fs.existsSync(middlewarePath) ? middlewarePath : null);
    if (targetFile) {
      const content = fs.readFileSync(targetFile, 'utf8');
      const match = content.match(/function getEdgeGateHtml\(\) \{\s*return `([\s\S]*?)`;\s*\}/);
      if (match) gateHtml = match[1];
    }
    res.writeHead(401, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store'
    });
    return res.end(gateHtml);
  }

  // 5. If Authorized: serve static files
  let safePath = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') safePath = '/index.html';

  const filePath = path.join(__dirname, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`[Flippy Edge Simulator] Listening on http://localhost:${PORT}`);
  console.log(`Edge Middleware active: unauthenticated visitors receive 0% static assets.`);
});
