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
  // Alex: FLIPPY-USER-ALEX
  "eab139d3e50d1a55d849144f1f154a58ee8ef473c54a3be4c2cc9d1606ff6ee0": { user: "Alex", role: "member", maxDevices: 1 },
  // Marcus: FLIPPY-USER-MARCUS
  "fa694fcc4ab7be81ba6b8d601880bcf9f4c4f657f34f20b0be0446463a23b7d3": { user: "Marcus", role: "member", maxDevices: 1 },
  // Sarah: FLIPPY-USER-SARAH
  "b44740cfa7b0272e230af2b83cbeef18def7d6b282cfe0810c0589d039f94775": { user: "Sarah", role: "member", maxDevices: 1 },
  // Kingdom: FLIPPY-USER-KINGDOM
  "33ad58fde95c763e2062908abab3ac5dcdaf2d838527997cf382dd9d4e59af5d": { user: "Kingdom", role: "member", maxDevices: 1 },
  // CJ: FLIPPY-USER-CJ
  "46dfb1bc7eec26ebd4357924a6da9ce898d00c7eef9adfd995dae9a1c28e3214": { user: "CJ", role: "member", maxDevices: 1 },
  // VIP: FLIPPY-USER-VIP
  "9b1af68f54ea936b7099b4b8ce6c75a36b0370169e2ce14234bd526024d3fb7d": { user: "VIP", role: "member", maxDevices: 1 },
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
  '.mp4': 'video/mp4'
};

const server = http.createServer((req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  const pathname = urlObj.pathname;

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
          const bound = locks[keyHash];
          if (bound && bound !== devId) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Key locked to another device. Contact admin to reset.' }));
          }
          saveDeviceLock(keyHash, devId);
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
