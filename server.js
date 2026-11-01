/**
 * Local Edge Middleware Emulator for Flippy v3
 * Runs the exact same Edge Gate & Device-Lock logic locally on http://localhost:3000
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, spawnSync } = require('child_process');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const SECRET = process.env.FLIPPY_SECRET || "FLIPPY_SECRET_SALT_2026_9b83f0c1";

// Standalone FFmpeg & Python yt-dlp detection
const STANDALONE_FFMPEG = 'C:\\Users\\jeduc\\AppData\\Local\\Programs\\Python\\Python312\\Lib\\site-packages\\imageio_ffmpeg\\binaries\\ffmpeg-win-x86_64-v7.1.exe';
const FFMPEG_BIN = fs.existsSync(STANDALONE_FFMPEG) ? STANDALONE_FFMPEG : (process.env.FFMPEG_PATH || 'ffmpeg');

let HAS_YTDLP = false;
try {
  const check = spawnSync('python', ['-m', 'yt_dlp', '--version'], { encoding: 'utf8', timeout: 5000 });
  HAS_YTDLP = (check.status === 0);
} catch (_) {
  HAS_YTDLP = false;
}

// In-memory active direct video jobs (100% ad-free & popup-free)
const ACTIVE_YT_JOBS = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [id, job] of ACTIVE_YT_JOBS.entries()) {
    if (now - job.createdAt > 30 * 60 * 1000) {
      try {
        if (fs.existsSync(job.filePath)) fs.unlinkSync(job.filePath);
      } catch (_) {}
      ACTIVE_YT_JOBS.delete(id);
    }
  }
}, 5 * 60 * 1000);

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

const YT_UA_MOBILE = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36';
const SAVETUBE_KEY_HEX = 'C5D58EF67A7584E4A29F6C35BBC4EB12';

function sanitizeDownloadFilename(rawName, fallbackExt = 'mp4') {
  const cleaned = String(rawName || '')
    .replace(/["\r\n<>:\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 110);
  if (!cleaned) return `flippy_video.${fallbackExt}`;
  if (!/\.[a-z0-9]{2,4}$/i.test(cleaned)) return `${cleaned}.${fallbackExt}`;
  return cleaned;
}

function isBlockedAdUrl(urlObj) {
  if (!urlObj || urlObj.protocol !== 'https:') return true;
  const h = urlObj.hostname.toLowerCase();
  const p = urlObj.pathname.toLowerCase();
  if (h === 'localhost' || h.endsWith('.local') || /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.|169\.254\.)/.test(h)) return true;
  if (p.includes('/ajax/ad') || p.includes('/ad/') || h.includes('hai8g') || h.includes('savenow.to')) return true;
  return false;
}

function decryptSaveTubeNode(encB64) {
  const raw = Buffer.from(String(encB64).replace(/\s+/g, ''), 'base64');
  const decipher = crypto.createDecipheriv('aes-128-cbc', Buffer.from(SAVETUBE_KEY_HEX, 'hex'), raw.subarray(0, 16));
  return JSON.parse(Buffer.concat([decipher.update(raw.subarray(16)), decipher.final()]).toString('utf8'));
}

async function resolveFallbackCloudUrl(ytUrl, format) {
  const wantAudio = ['mp3', 'm4a', 'aac', 'wav', 'flac', 'opus'].includes(format);
  try {
    const { cdn } = await (await fetch('https://media.savetube.vip/api/random-cdn', {
      headers: { 'User-Agent': YT_UA_MOBILE, 'Referer': 'https://save-tube.com/', 'Origin': 'https://save-tube.com' }
    })).json();
    const infoRes = await (await fetch(`https://${cdn}/v2/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': YT_UA_MOBILE, 'Referer': 'https://save-tube.com/', 'Origin': 'https://save-tube.com' },
      body: JSON.stringify({ url: ytUrl })
    })).json();
    const decoded = decryptSaveTubeNode(infoRes.data);
    const stQ = wantAudio ? '128' : (['720', '480', '360'].includes(format) ? format : '1080');
    const dlRes = await (await fetch(`https://${cdn}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': YT_UA_MOBILE, 'Referer': 'https://save-tube.com/', 'Origin': 'https://save-tube.com' },
      body: JSON.stringify({ downloadType: wantAudio ? 'audio' : 'video', quality: stQ, key: decoded.key })
    })).json();
    if (dlRes && dlRes.data && dlRes.data.downloadUrl) {
      return { streamUrl: String(dlRes.data.downloadUrl), referer: 'https://save-tube.com/', title: decoded.title || '' };
    }
  } catch (_) {}

  const r = await fetch('https://rue-cobalt.xenon.zone/', {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'User-Agent': YT_UA_MOBILE },
    body: JSON.stringify(wantAudio
      ? { url: ytUrl, downloadMode: 'audio', audioFormat: format === 'wav' ? 'wav' : 'mp3' }
      : { url: ytUrl, videoQuality: ({ '4k': '2160', '1440': '1440', '1080': '1080', '720': '720', '480': '480', '360': '360' })[format] || '1080', youtubeVideoCodec: 'h264' })
  });
  const j = await r.json();
  if ((j.status === 'tunnel' || j.status === 'redirect') && j.url) {
    return { streamUrl: String(j.url), referer: '', title: j.filename || '' };
  }
  throw new Error('Upstream MP4 muxer unavailable');
}

async function openCleanUpstreamReader(rawSrcUrl, referer = 'https://save-tube.com/') {
  let current;
  try { current = new URL(String(rawSrcUrl || '').trim()); } catch (_) { return null; }
  if (current.protocol === 'http:') current.protocol = 'https:';
  if (isBlockedAdUrl(current)) return null;

  let upstreamRes = null;
  for (let hop = 0; hop < 3; hop++) {
    const hdrs = { 'User-Agent': YT_UA_MOBILE };
    if (referer) hdrs['Referer'] = referer;
    const r = await fetch(current.href, {
      method: 'GET',
      redirect: 'manual',
      headers: hdrs
    });
    if (r.status >= 300 && r.status < 400) {
      const loc = r.headers.get('location');
      if (!loc) return null;
      let nextUrl;
      try { nextUrl = new URL(loc, current.href); } catch (_) { return null; }
      if (nextUrl.protocol === 'http:') nextUrl.protocol = 'https:';
      if (isBlockedAdUrl(nextUrl)) return null;
      current = nextUrl;
      continue;
    }
    upstreamRes = r;
    break;
  }

  if (!upstreamRes || !upstreamRes.ok || !upstreamRes.body) return null;
  const contentType = (upstreamRes.headers.get('content-type') || '').toLowerCase();
  if (contentType.includes('text/html') || contentType.includes('application/json') || contentType.includes('text/plain')) {
    try { await upstreamRes.body.cancel(); } catch (_) {}
    return null;
  }

  const reader = upstreamRes.body.getReader();
  let firstChunk = null;
  while (true) {
    const step = await reader.read();
    if (step.done) break;
    if (step.value && step.value.byteLength > 0) {
      firstChunk = step.value;
      break;
    }
  }
  if (!firstChunk || firstChunk.byteLength < 16) {
    try { await reader.cancel(); } catch (_) {}
    return null;
  }

  const headText = Buffer.from(firstChunk.subarray(0, Math.min(96, firstChunk.byteLength))).toString('utf8').trimStart().toLowerCase();
  if (headText.startsWith('<!doctype') || headText.startsWith('<html') || headText.startsWith('<script') || headText.startsWith('{') || headText.startsWith('[')) {
    try { await reader.cancel(); } catch (_) {}
    return null;
  }

  return {
    reader,
    firstChunk,
    contentType: contentType && contentType !== 'application/octet-stream' ? contentType : 'video/mp4',
    contentLength: upstreamRes.headers.get('content-length') || ''
  };
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
    return sendYtJson(res, 200, { ok: true, engine: 'flippy-v3-mp4-muxer', streamProxy: true, canDownload: true, ytdlp: HAS_YTDLP });
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

    // High-performance, 100% ad-free & popup-free local yt-dlp execution
    if (HAS_YTDLP) {
      const jobId = 'yt_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
      const isAudio = (format === 'mp3' || format === 'm4a' || format === 'wav' || format === 'flac' || format === 'aac' || format === 'opus');
      const outExt = isAudio ? (format === 'aac' ? 'm4a' : format) : 'mp4';
      const outFilePath = path.join(os.tmpdir(), `${jobId}.${outExt}`);

      const jobRecord = {
        id: jobId,
        status: 'processing',
        progress: 150,
        text: 'Downloading clean stream...',
        filePath: outFilePath,
        ext: outExt,
        download_url: `/__flippy_yt_stream?id=${jobId}`,
        createdAt: Date.now()
      };
      ACTIVE_YT_JOBS.set(jobId, jobRecord);

      let fmtSelector;
      if (isAudio) {
        fmtSelector = 'bestaudio/best';
      } else {
        const heightMap = { '4k': 2160, '1440': 1440, '1080': 1080, '720': 720, '480': 480, '360': 360 };
        const h = heightMap[format] || 1080;
        fmtSelector = `bestvideo[height<=${h}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${h}]+bestaudio/best[height<=${h}]/best`;
      }

      const args = [
        '-m', 'yt_dlp',
        '--no-playlist',
        '--no-warnings',
        '--js-runtimes', 'node:node',
        '--remote-components', 'ejs:github',
        '--ffmpeg-location', FFMPEG_BIN,
        '-f', fmtSelector
      ];

      if (isAudio) {
        args.push('-x', '--audio-format', outExt);
      } else {
        args.push('--merge-output-format', 'mp4');
      }

      args.push('-o', outFilePath, ytUrl);

      const proc = spawn('python', args, { stdio: ['ignore', 'pipe', 'pipe'] });
      jobRecord.proc = proc;

      proc.stdout.on('data', chunk => {
        const str = chunk.toString();
        const m = str.match(/(\d+(?:\.\d+)?)%/);
        if (m) {
          const pct = Math.min(990, Math.round(parseFloat(m[1]) * 10));
          jobRecord.progress = Math.max(jobRecord.progress, pct);
          jobRecord.text = `Downloading: ${m[1]}%`;
        }
      });

      proc.on('close', code => {
        if (code === 0 && fs.existsSync(outFilePath)) {
          jobRecord.status = 'ready';
          jobRecord.progress = 1000;
          jobRecord.text = 'Finished';
        } else {
          jobRecord.status = 'failed';
          jobRecord.text = 'Download failed';
          jobRecord.error = `yt-dlp exited with code ${code}`;
        }
      });

      return sendYtJson(res, 200, {
        id: jobId,
        success: true,
        text: 'Initiated clean MP4 stream',
        progress: 150
      });
    }

    try {
      const resolved = await resolveFallbackCloudUrl(ytUrl, format);
      return sendYtJson(res, 200, {
        success: 1,
        id: 'yt_' + Date.now().toString(36),
        progress: 1000,
        text: 'Finished',
        title: resolved.title || '',
        format,
        download_url: '/__flippy_yt_stream?src=' + encodeURIComponent(resolved.streamUrl)
      });
    } catch (err) {
      return sendYtJson(res, 502, { success: false, error: err.message || 'Stream engine unreachable' });
    }
  }

  if (pathname === '/__flippy_yt_progress') {
    const id = (urlObj.searchParams.get('id') || '').trim();
    if (!id) {
      return sendYtJson(res, 400, { success: false, error: 'Missing conversion job id' });
    }

    if (ACTIVE_YT_JOBS.has(id)) {
      const job = ACTIVE_YT_JOBS.get(id);
      if (job.status === 'ready') {
        return sendYtJson(res, 200, {
          success: 1,
          progress: 1000,
          text: 'Finished',
          download_url: job.download_url
        });
      } else if (job.status === 'failed') {
        return sendYtJson(res, 200, {
          success: 0,
          progress: 1000,
          text: job.error || 'Conversion failed'
        });
      } else {
        return sendYtJson(res, 200, {
          success: 0,
          progress: job.progress || 200,
          text: job.text || 'Processing'
        });
      }
    }

    return sendYtJson(res, 200, {
      success: 1,
      progress: 1000,
      text: 'Finished'
    });
  }

  // Direct Binary Stream Endpoint (Zero Popups, Zero Third-Party Ad Redirects)
  if (pathname === '/__flippy_yt_stream') {
    const id = (urlObj.searchParams.get('id') || '').trim();
    const src = (urlObj.searchParams.get('src') || '').trim();
    const ytUrl = (urlObj.searchParams.get('url') || '').trim();
    const rawFmt = (urlObj.searchParams.get('format') || '1080').trim().toLowerCase();
    const format = YT_ALLOWED_FORMATS.has(rawFmt) ? rawFmt : '1080';
    const fallbackExt = (format === 'mp3' || format === 'm4a' || format === 'wav' || format === 'flac') ? format : 'mp4';

    if (id && ACTIVE_YT_JOBS.has(id)) {
      const job = ACTIVE_YT_JOBS.get(id);
      if (job.status !== 'ready' || !fs.existsSync(job.filePath)) {
        return sendYtJson(res, 404, { success: false, error: 'Stream not ready or expired' });
      }

      const stat = fs.statSync(job.filePath);
      const totalSize = stat.size;
      const mime = job.ext === 'mp3' ? 'audio/mpeg' : (job.ext === 'm4a' ? 'audio/mp4' : (job.ext === 'wav' ? 'audio/wav' : 'video/mp4'));
      const filename = sanitizeDownloadFilename(urlObj.searchParams.get('filename') || `flippy_video_${id}.${job.ext}`, job.ext);

      const range = req.headers.range;
      setYtCors(res);
      res.setHeader('Content-Type', mime);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Accept-Ranges', 'bytes');

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;
        const chunkSize = (end - start) + 1;
        const fileStream = fs.createReadStream(job.filePath, { start, end });
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${totalSize}`,
          'Content-Length': chunkSize
        });
        return fileStream.pipe(res);
      } else {
        res.writeHead(200, { 'Content-Length': totalSize });
        return fs.createReadStream(job.filePath).pipe(res);
      }
    }

    let opened = null;
    if (src) {
      try { opened = await openCleanUpstreamReader(src); } catch (_) { opened = null; }
    }

    if (!opened && ytUrl && /(?:youtube\.com|youtu\.be)/i.test(ytUrl)) {
      const compliance = await verifyYoutubeCompliance(ytUrl);
      if (!compliance.allowed) {
        return sendYtJson(res, 403, { success: false, error: compliance.reason });
      }
      try {
        const resolved = await resolveFallbackCloudUrl(ytUrl, format);
        if (resolved && resolved.streamUrl) {
          opened = await openCleanUpstreamReader(resolved.streamUrl, resolved.referer || '');
        }
      } catch (_) {
        opened = null;
      }
    }

    if (opened) {
      const filename = sanitizeDownloadFilename(urlObj.searchParams.get('filename'), fallbackExt);
      setYtCors(res);
      const outHeaders = {
        'Content-Type': opened.contentType || 'video/mp4',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store'
      };
      if (opened.contentLength) outHeaders['Content-Length'] = opened.contentLength;
      res.writeHead(200, outHeaders);
      res.write(Buffer.from(opened.firstChunk));
      try {
        while (true) {
          const { done, value } = await opened.reader.read();
          if (done) break;
          res.write(Buffer.from(value));
        }
      } catch (_) {}
      return res.end();
    }

    return sendYtJson(res, 502, { success: false, error: 'Clean binary stream unavailable or expired' });
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
