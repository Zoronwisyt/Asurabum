/**
 * Flippy Studio v3 — Cloudflare Worker & Edge Middleware
 * Zero-Asset-Leakage Gate & Device-Bound Authentication
 */

const DEFAULT_SECRET = "FLIPPY_SECRET_SALT_2026_9b83f0c1";

const AUTHORIZED_KEYS = {
  // Admin: FLIPPY-ADMIN (Infinite multi-device master key)
  "f07560829fddd2b3e7141a615231682c193bbb6d722789334ea96a232f71d17d": { user: "Admin", role: "admin", maxDevices: Infinity },
  // Kingdom: FLIPPY-USER-KINGDOM
  "33ad58fde95c763e2062908abab3ac5dcdaf2d838527997cf382dd9d4e59af5d": { user: "Kingdom", role: "member", maxDevices: 1 },
  // CJ: FLIPPY-USER-CJ
  "46dfb1bc7eec26ebd4357924a6da9ce898d00c7eef9adfd995dae9a1c28e3214": { user: "CJ", role: "member", maxDevices: 1 },
  // VIP: FLIPPY-USER-VIP
  "9b1af68f54ea936b7099b4b8ce6c75a36b0370169e2ce14234bd526024d3fb7d": { user: "VIP", role: "member", maxDevices: 1 },
  // Gojo: FLIPPY-USER-GOJO
  "cf4447344d3819c58c999b4060f6c5d4f9d2c3bbfb67d8f80f4fc7d2ddc7697a": { user: "Gojo", role: "member", maxDevices: 1 },
};

const DEVICE_LOCK_STORE = new Map();

// Dedicated Persistent Global Cloud Lock Registry ID
const CLOUD_SYNC_STORE_ID = "ff808181a09d98f701a18f515f3c6aa4";

async function getBoundDevice(keyHash, env) {
  // 1. Cloudflare KV if bound
  if (env && env.FLIPPY_KV) {
    try {
      const val = await env.FLIPPY_KV.get("lock:" + keyHash);
      if (val) return val;
    } catch (e) {}
  }
  // 2. Global Cloud Sync Store
  try {
    const res = await fetch("https://api.restful-api.dev/objects/" + CLOUD_SYNC_STORE_ID);
    if (res.ok) {
      const json = await res.json();
      const map = json.data || {};
      if (map[keyHash]) return map[keyHash];
    }
  } catch (e) {}
  // 3. Local isolate memory fallback
  return DEVICE_LOCK_STORE.get(keyHash) || null;
}

async function setBoundDevice(keyHash, deviceId, env) {
  // 1. Cloudflare KV if bound
  if (env && env.FLIPPY_KV) {
    try {
      await env.FLIPPY_KV.put("lock:" + keyHash, deviceId);
    } catch (e) {}
  }
  // 2. Global Cloud Sync Store
  try {
    const res = await fetch("https://api.restful-api.dev/objects/" + CLOUD_SYNC_STORE_ID);
    if (res.ok) {
      const json = await res.json();
      const map = json.data || {};
      map[keyHash] = deviceId;
      await fetch("https://api.restful-api.dev/objects/" + CLOUD_SYNC_STORE_ID, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "flippy_v3_asurabum_registry", data: map })
      });
    }
  } catch (e) {}
  // 3. Local isolate memory
  DEVICE_LOCK_STORE.set(keyHash, deviceId);
}

async function clearAllDeviceLocks(env) {
  // 1. Delete all keys from Cloudflare KV
  if (env && env.FLIPPY_KV) {
    try {
      const list = await env.FLIPPY_KV.list({ prefix: "lock:" });
      if (list && list.keys) {
        for (const k of list.keys) {
          await env.FLIPPY_KV.delete(k.name);
        }
      }
    } catch (e) {}
  }
  // 2. Clear cloud registry
  try {
    await fetch("https://api.restful-api.dev/objects/" + CLOUD_SYNC_STORE_ID, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "flippy_v3_asurabum_registry", data: {} })
    });
  } catch (e) {}
  // 3. Clear local isolate memory
  DEVICE_LOCK_STORE.clear();
}

async function sha256Hex(str) {
  const enc = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function signData(data, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifySignature(data, sigHex, secret) {
  const expected = await signData(data, secret);
  return expected === sigHex;
}

function parseCookies(header) {
  const map = {};
  if (!header) return map;
  const parts = header.split(";");
  for (const part of parts) {
    const pair = part.trim().split("=");
    if (pair.length >= 2) {
      map[decodeURIComponent(pair[0].trim())] = decodeURIComponent(pair.slice(1).join("=").trim());
    }
  }
  return map;
}

const YT_BLOCKED_CHANNELS = [];
const YT_BLOCKED_TITLE_PATTERNS = [];

const YT_ALLOWED_FORMATS = new Set([
  "4k", "1440", "1080", "720", "480", "360",
  "mp3", "m4a", "aac", "flac", "opus", "wav", "webm"
]);

const YT_CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Range",
  "Access-Control-Expose-Headers": "Content-Length, Content-Disposition, Content-Type"
};

function ytJsonResponse(status, obj) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      ...YT_CORS_HEADERS,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

async function verifyYoutubeCompliance(ytUrl) {
  try {
    const oembedUrl = "https://www.youtube.com/oembed?url=" + encodeURIComponent(ytUrl) + "&format=json";
    const r = await fetch(oembedUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!r.ok) return { allowed: true };
    const meta = await r.json();
    return { allowed: true, meta };
  } catch (_) {
    return { allowed: true };
  }
}

const YT_UA_MOBILE = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36";
const YT_UA_DESKTOP = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const SAVETUBE_KEY_HEX = "C5D58EF67A7584E4A29F6C35BBC4EB12";
const PINNED_COBALT_INSTANCES = ["https://rue-cobalt.xenon.zone"];

let cachedCobaltInstances = null;
let cachedCobaltAt = 0;

function extractYoutubeVideoId(input) {
  if (!input) return null;
  const trimmed = String(input).trim();
  const m = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (m && m[1]) return m[1];
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  return null;
}

function canonicalYoutubeWatchUrl(input) {
  const id = extractYoutubeVideoId(input);
  return id ? `https://www.youtube.com/watch?v=${id}` : String(input || "").trim();
}

function isAudioFormat(format) {
  return format === "mp3" || format === "m4a" || format === "aac" || format === "wav" || format === "flac" || format === "opus";
}

function getFormatExtension(format) {
  if (format === "mp3" || format === "m4a" || format === "wav" || format === "flac") return format;
  if (format === "aac") return "m4a";
  if (format === "opus") return "mp3";
  return "mp4";
}

function getFormatMimeType(format) {
  const ext = getFormatExtension(format);
  if (ext === "mp3") return "audio/mpeg";
  if (ext === "m4a") return "audio/mp4";
  if (ext === "wav") return "audio/wav";
  if (ext === "flac") return "audio/flac";
  return "video/mp4";
}

function sanitizeDownloadFilename(rawName, fallbackExt = "mp4") {
  const cleaned = String(rawName || "")
    .replace(/["\r\n<>:\\|?*\x00-\x1F]/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 110);
  if (!cleaned) return `flippy_video.${fallbackExt}`;
  if (!/\.[a-z0-9]{2,4}$/i.test(cleaned)) return `${cleaned}.${fallbackExt}`;
  return cleaned;
}

function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return out;
}

function base64ToBytes(b64) {
  const bin = atob(String(b64).replace(/\s+/g, ""));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function toBase64Url(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(b64u) {
  let b64 = String(b64u).replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function mintStreamToken(payloadObj, secret) {
  const encoded = toBase64Url(JSON.stringify(payloadObj));
  const sig = await signData(encoded, secret);
  return `${encoded}.${sig}`;
}

async function verifyStreamToken(tokenStr, secret) {
  if (!tokenStr || typeof tokenStr !== "string") return null;
  const dot = tokenStr.indexOf(".");
  if (dot <= 0) return null;
  const encoded = tokenStr.slice(0, dot);
  const sig = tokenStr.slice(dot + 1);
  const valid = await verifySignature(encoded, sig, secret);
  if (!valid) return null;
  try {
    const parsed = JSON.parse(fromBase64Url(encoded));
    if (!parsed || typeof parsed.exp !== "number" || parsed.exp < Date.now()) return null;
    return parsed;
  } catch (_) {
    return null;
  }
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function decryptSaveTubePayload(encB64) {
  const raw = base64ToBytes(encB64);
  if (raw.byteLength <= 16) throw new Error("Invalid media cipher payload");
  const iv = raw.subarray(0, 16);
  const ciphertext = raw.subarray(16);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    hexToBytes(SAVETUBE_KEY_HEX),
    { name: "AES-CBC" },
    false,
    ["decrypt"]
  );
  const decrypted = await crypto.subtle.decrypt({ name: "AES-CBC", iv }, cryptoKey, ciphertext);
  return JSON.parse(new TextDecoder().decode(decrypted));
}

async function resolveViaSaveTube(ytUrl, format) {
  const watchUrl = canonicalYoutubeWatchUrl(ytUrl);
  const wantAudio = isAudioFormat(format);
  const stQuality = wantAudio
    ? "128"
    : (format === "720" || format === "480" || format === "360" ? format : "1080");

  let lastErr = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const cdnRes = await fetchWithTimeout("https://media.savetube.vip/api/random-cdn", {
        headers: {
          "User-Agent": YT_UA_MOBILE,
          "Referer": "https://save-tube.com/",
          "Origin": "https://save-tube.com",
          "Accept": "application/json"
        }
      }, 6000);
      if (!cdnRes.ok) throw new Error(`SaveTube CDN HTTP ${cdnRes.status}`);
      const cdnJson = await cdnRes.json();
      const cdn = cdnJson && cdnJson.cdn ? String(cdnJson.cdn).trim() : "";
      if (!cdn) throw new Error("SaveTube returned empty CDN");

      const infoRes = await fetchWithTimeout(`https://${cdn}/v2/info`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "User-Agent": YT_UA_MOBILE,
          "Referer": "https://save-tube.com/",
          "Origin": "https://save-tube.com"
        },
        body: JSON.stringify({ url: watchUrl })
      }, 10000);
      if (!infoRes.ok) throw new Error(`SaveTube info HTTP ${infoRes.status}`);
      const infoJson = await infoRes.json();
      if (!infoJson || !infoJson.status || !infoJson.data) {
        throw new Error((infoJson && infoJson.message) || "SaveTube info unavailable");
      }

      const decoded = await decryptSaveTubePayload(infoJson.data);
      if (!decoded || !decoded.key) throw new Error("SaveTube key missing");

      const dlRes = await fetchWithTimeout(`https://${cdn}/download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "User-Agent": YT_UA_MOBILE,
          "Referer": "https://save-tube.com/",
          "Origin": "https://save-tube.com"
        },
        body: JSON.stringify({
          downloadType: wantAudio ? "audio" : "video",
          quality: stQuality,
          key: decoded.key
        })
      }, 14000);
      if (!dlRes.ok) throw new Error(`SaveTube download HTTP ${dlRes.status}`);
      const dlJson = await dlRes.json();
      const dlUrl = dlJson && dlJson.data && dlJson.data.downloadUrl ? String(dlJson.data.downloadUrl).trim() : "";
      if (!dlUrl) throw new Error("SaveTube returned empty downloadUrl");

      return {
        provider: "savetube",
        streamUrl: dlUrl,
        referer: "https://save-tube.com/",
        title: decoded.title || ""
      };
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error("SaveTube provider unavailable");
}

async function getCobaltInstances() {
  const now = Date.now();
  if (cachedCobaltInstances && now - cachedCobaltAt < 10 * 60 * 1000) {
    return cachedCobaltInstances;
  }
  const found = [...PINNED_COBALT_INSTANCES];
  try {
    const r = await fetchWithTimeout("https://cobalt.directory/", {
      headers: { "User-Agent": YT_UA_DESKTOP, "Accept": "text/html" }
    }, 4500);
    if (r.ok) {
      const html = await r.text();
      const entryRegex = /\{score:[\d.]+,protocol:"https",tests:\{[\s\S]*?\},turnstile:(true|false),[\s\S]*?online:(true|false),[\s\S]*?api:"([^"]+)"/g;
      let m;
      while ((m = entryRegex.exec(html)) !== null) {
        const block = m[0];
        const turnstile = m[1] === "true";
        const online = m[2] === "true";
        const apiHost = m[3];
        if (!turnstile && online && apiHost && /youtube:\{[^}]*status:true/.test(block)) {
          const instUrl = `https://${apiHost}`;
          if (!found.includes(instUrl)) found.push(instUrl);
        }
      }
    }
  } catch (_) {}
  cachedCobaltInstances = found;
  cachedCobaltAt = now;
  return found;
}

async function resolveViaCobalt(ytUrl, format) {
  const watchUrl = canonicalYoutubeWatchUrl(ytUrl);
  const wantAudio = isAudioFormat(format);
  const instances = await getCobaltInstances();
  const qualityMap = { "4k": "2160", "1440": "1440", "1080": "1080", "720": "720", "480": "480", "360": "360" };
  const videoQuality = qualityMap[format] || "1080";

  const reqBody = wantAudio
    ? {
        url: watchUrl,
        downloadMode: "audio",
        audioFormat: (format === "wav" ? "wav" : "mp3")
      }
    : {
        url: watchUrl,
        videoQuality,
        youtubeVideoCodec: "h264"
      };

  let lastErr = null;
  for (const base of instances.slice(0, 3)) {
    try {
      const r = await fetchWithTimeout(base + "/", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "User-Agent": YT_UA_DESKTOP
        },
        body: JSON.stringify(reqBody)
      }, 10000);
      if (!r.ok) throw new Error(`Cobalt HTTP ${r.status}`);
      const j = await r.json();
      if ((j.status === "tunnel" || j.status === "redirect") && j.url) {
        return {
          provider: "cobalt",
          streamUrl: String(j.url),
          referer: "",
          title: j.filename || ""
        };
      }
      const errCode = (j.error && j.error.code) ? String(j.error.code) : "";
      throw new Error(errCode || "Cobalt returned no stream");
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error("Cobalt instances unavailable");
}

function getProviderChain(ytUrl, format) {
  if (format === "wav") {
    return [
      () => resolveViaCobalt(ytUrl, format),
      () => resolveViaSaveTube(ytUrl, format)
    ];
  }
  return [
    () => resolveViaSaveTube(ytUrl, format),
    () => resolveViaCobalt(ytUrl, format)
  ];
}

async function resolveCloudMedia(ytUrl, format) {
  let lastErr = null;
  for (const resolver of getProviderChain(ytUrl, format)) {
    try {
      return await resolver();
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error("Cloud MP4 providers temporarily unavailable");
}

function isSafeUpstreamMediaUrl(urlObj) {
  if (!urlObj || urlObj.protocol !== "https:") return false;
  const h = urlObj.hostname.toLowerCase();
  const p = urlObj.pathname.toLowerCase();
  if (h === "localhost" || h.endsWith(".local") || /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.|169\.254\.)/.test(h)) {
    return false;
  }
  if (p.includes("/ajax/ad") || p.includes("/ad/") || h.includes("hai8g") || h.includes("savenow.to")) {
    return false;
  }
  return true;
}

async function openVerifiedBinaryStream(rawStreamUrl, referer = "", rangeHeader = "") {
  let current;
  try { current = new URL(String(rawStreamUrl || "").trim()); } catch (_) { return null; }
  if (current.protocol === "http:") current.protocol = "https:";
  if (!isSafeUpstreamMediaUrl(current)) return null;

  let res = null;
  for (let hop = 0; hop < 3; hop++) {
    const headers = { "User-Agent": YT_UA_MOBILE };
    if (referer) headers["Referer"] = referer;
    if (rangeHeader) headers["Range"] = rangeHeader;

    const r = await fetchWithTimeout(current.href, {
      method: "GET",
      redirect: "manual",
      headers
    }, 15000);

    if (r.status >= 300 && r.status < 400) {
      const loc = r.headers.get("location");
      try { if (r.body) await r.body.cancel(); } catch (_) {}
      if (!loc) return null;
      let next;
      try { next = new URL(loc, current.href); } catch (_) { return null; }
      if (next.protocol === "http:") next.protocol = "https:";
      if (!isSafeUpstreamMediaUrl(next)) return null;
      current = next;
      continue;
    }
    res = r;
    break;
  }

  if (!res || (!res.ok && res.status !== 206) || !res.body) {
    try { if (res && res.body) await res.body.cancel(); } catch (_) {}
    return null;
  }

  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (ct.includes("text/html") || ct.includes("application/json") || ct.includes("text/plain")) {
    try { await res.body.cancel(); } catch (_) {}
    return null;
  }

  const reader = res.body.getReader();
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

  const headStr = new TextDecoder().decode(firstChunk.subarray(0, Math.min(96, firstChunk.byteLength))).trimStart().toLowerCase();
  if (
    headStr.startsWith("<!doctype") ||
    headStr.startsWith("<html") ||
    headStr.startsWith("<script") ||
    headStr.startsWith("{") ||
    headStr.startsWith("[")
  ) {
    try { await reader.cancel(); } catch (_) {}
    return null;
  }

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(firstChunk);
    },
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) controller.close();
        else if (value) controller.enqueue(value);
      } catch (err) {
        controller.error(err);
      }
    },
    async cancel() {
      try { await reader.cancel(); } catch (_) {}
    }
  });

  return {
    stream,
    status: res.status,
    contentType: ct && ct !== "application/octet-stream" ? ct : null,
    contentLength: res.headers.get("content-length") || "",
    contentRange: res.headers.get("content-range") || "",
    acceptRanges: res.headers.get("accept-ranges") || ""
  };
}

function getYtBackend(env) {
  const raw = (env && env.YT_BACKEND_URL ? String(env.YT_BACKEND_URL) : "").trim().replace(/\/+$/, "");
  if (!raw) return "";
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" && u.protocol !== "http:") return "";
    return u.origin + u.pathname.replace(/\/+$/, "");
  } catch (_) {
    return "";
  }
}

async function forwardToYtBackend(backend, pathWithQuery, request) {
  const headers = new Headers();
  const range = request.headers.get("range");
  if (range) headers.set("Range", range);
  headers.set("Accept", request.headers.get("accept") || "*/*");
  const upstream = await fetch(backend + pathWithQuery, { method: "GET", headers, redirect: "manual" });

  if (upstream.status >= 300 && upstream.status < 400) {
    try { if (upstream.body) await upstream.body.cancel(); } catch (_) {}
    return ytJsonResponse(502, { success: false, error: "Download backend returned a redirect; refused." });
  }

  const out = new Headers(YT_CORS_HEADERS);
  for (const h of ["content-type", "content-length", "content-disposition", "content-range", "accept-ranges"]) {
    const v = upstream.headers.get(h);
    if (v) out.set(h, v);
  }
  out.set("Cache-Control", "no-store");
  return new Response(upstream.body, { status: upstream.status, headers: out });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const secret = (env && env.FLIPPY_SECRET) || DEFAULT_SECRET;

    // Diagnostic Telemetry Endpoint
    if (url.pathname === "/__flippy_status") {
      const isKvBound = !!(env && env.FLIPPY_KV);
      let kvLocks = [];
      if (isKvBound) {
        try {
          const list = await env.FLIPPY_KV.list({ prefix: "lock:" });
          if (list && list.keys) {
            kvLocks = list.keys.map(k => k.name);
          }
        } catch (e) {}
      }
      let cloudLocks = {};
      try {
        const res = await fetch("https://api.restful-api.dev/objects/" + CLOUD_SYNC_STORE_ID);
        if (res.ok) cloudLocks = (await res.json()).data || {};
      } catch (e) {}
      return new Response(JSON.stringify({
        status: "online",
        edge_runtime: "Cloudflare Workers",
        run_worker_first: true,
        kv_persistence_active: isKvBound,
        kv_stored_locks: kvLocks,
        cloud_sync_active: true,
        locked_devices_count: Object.keys(cloudLocks).length,
        active_cloud_locks: cloudLocks
      }, null, 2), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Admin Reset Endpoint (Clear all locked devices)
    if (url.pathname === "/__flippy_reset") {
      const resetKey = (url.searchParams.get("key") || "").trim();
      if (resetKey !== "AjDybantsaisass") {
        return new Response(JSON.stringify({ error: "Unauthorized: Invalid admin key" }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }
      await clearAllDeviceLocks(env);
      return new Response(JSON.stringify({ success: true, message: "All device locks cleared successfully." }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Handle Authentication API
    if (url.pathname === "/__flippy_auth" && request.method === "POST") {
      try {
        const body = await request.json();
        const rawKey = (body.key || "").trim();
        const deviceId = (body.deviceId || "").trim().slice(0, 64) || "unknown_dev";
        // Home-screen apps (PWA) run in storage separate from the browser, so each context gets its own slot.
        const slotSuffix = body.mode === "app" ? ":app" : "";

        if (!rawKey) {
          return new Response(JSON.stringify({ error: "Please enter an access key." }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }

        const keyHash = await sha256Hex(rawKey);
        let match = AUTHORIZED_KEYS[keyHash];

        if (!match) {
          return new Response(JSON.stringify({ error: "Access Denied: Invalid Key." }), {
            status: 401,
            headers: { "Content-Type": "application/json" }
          });
        }

        // Strict Cross-Device Lock Check
        if (match.maxDevices === 1) {
          const boundDevice = await getBoundDevice(keyHash + slotSuffix, env);
          if (boundDevice && boundDevice !== deviceId) {
            return new Response(JSON.stringify({ 
              error: "Key locked to another device. Contact admin to reset." 
            }), {
              status: 403,
              headers: { "Content-Type": "application/json" }
            });
          }
          await setBoundDevice(keyHash + slotSuffix, deviceId, env);
        }

        // 7-day session token
        const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
        const payload = `${encodeURIComponent(match.user)}:${match.role}:${deviceId}:${expiresAt}`;
        const sig = await signData(payload, secret);
        const token = `${payload}:${sig}`;

        const cookieVal = `flippy_edge_session=${encodeURIComponent(token)}; Path=/; Max-Age=604800; HttpOnly; SameSite=Lax; Secure`;

        return new Response(JSON.stringify({ success: true, user: match.user }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": cookieVal
          }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: "Internal Auth Error: " + err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // Handle Logout API
    if (url.pathname === "/__flippy_logout") {
      const expiredCookie = `flippy_edge_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`;
      return new Response(null, {
        status: 302,
        headers: {
          "Location": "/",
          "Set-Cookie": expiredCookie
        }
      });
    }

    // Validate existing session cookie
    const cookieHeader = request.headers.get("Cookie") || "";
    const cookies = parseCookies(cookieHeader);
    const rawSession = cookies["flippy_edge_session"];

    let isAuthenticated = false;

    if (rawSession) {
      try {
        const parts = rawSession.split(":");
        if (parts.length === 5) {
          const role = parts[1];
          const deviceId = parts[2];
          const exp = parseInt(parts[3], 10);
          const sig = parts[4];
          const payload = `${parts[0]}:${role}:${deviceId}:${exp}`;

          if (exp > Date.now()) {
            const valid = await verifySignature(payload, sig, secret);
            if (valid) {
              isAuthenticated = true;
            }
          }
        }
      } catch (e) {
        isAuthenticated = false;
      }
    }

    if (request.method === "OPTIONS" && url.pathname.startsWith("/__flippy_yt_")) {
      return new Response(null, { status: 204, headers: YT_CORS_HEADERS });
    }

    // If authenticated: handle Direct MP4 YT Converter routes or stream actual site assets
    if (isAuthenticated) {
      if (url.pathname === "/__flippy_yt_ping") {
        return ytJsonResponse(200, {
          ok: true,
          engine: "flippy-v3-edge",
          streamProxy: true,
          canDownload: true
        });
      }

      if (url.pathname === "/__flippy_yt_dl") {
        const ytUrl = (url.searchParams.get("url") || "").trim();
        const rawFmt = (url.searchParams.get("format") || "1080").trim().toLowerCase();
        const format = YT_ALLOWED_FORMATS.has(rawFmt) ? rawFmt : "1080";

        if (!ytUrl || !/(?:youtube\.com|youtu\.be)/i.test(ytUrl) || !extractYoutubeVideoId(ytUrl)) {
          return ytJsonResponse(400, { success: false, error: "Invalid YouTube URL" });
        }

        const compliance = await verifyYoutubeCompliance(ytUrl);
        if (!compliance.allowed) {
          return ytJsonResponse(403, { success: false, error: compliance.reason });
        }

        const backend = getYtBackend(env);
        if (backend) {
          try {
            return await forwardToYtBackend(backend, url.pathname + url.search, request);
          } catch (_) {}
        }

        try {
          const resolved = await resolveCloudMedia(ytUrl, format);
          const streamToken = await mintStreamToken({
            src: resolved.streamUrl,
            ref: resolved.referer || "",
            url: canonicalYoutubeWatchUrl(ytUrl),
            fmt: format,
            exp: Date.now() + 20 * 60 * 1000
          }, secret);

          return ytJsonResponse(200, {
            success: 1,
            id: "yt_" + Date.now().toString(36),
            progress: 1000,
            text: "Finished",
            provider: resolved.provider,
            title: resolved.title || "",
            download_url: "/__flippy_yt_stream?token=" + encodeURIComponent(streamToken)
          });
        } catch (err) {
          return ytJsonResponse(502, {
            success: false,
            error: "Cloud MP4 muxer error: " + (err && err.message ? err.message : "upstream unavailable")
          });
        }
      }

      if (url.pathname === "/__flippy_yt_progress") {
        const backend = getYtBackend(env);
        if (backend && url.searchParams.get("id")) {
          try {
            return await forwardToYtBackend(backend, url.pathname + url.search, request);
          } catch (_) {}
        }
        return ytJsonResponse(200, {
          success: 1,
          progress: 1000,
          text: "Finished"
        });
      }

      if (url.pathname === "/__flippy_yt_stream") {
        const backend = getYtBackend(env);
        if (backend && url.searchParams.get("id") && !url.searchParams.get("token")) {
          try {
            return await forwardToYtBackend(backend, url.pathname + url.search, request);
          } catch (_) {}
        }

        const rawToken = (url.searchParams.get("token") || "").trim();
        const rawUrl = (url.searchParams.get("url") || "").trim();
        const rawFmt = (url.searchParams.get("format") || "1080").trim().toLowerCase();
        const rangeHeader = request.headers.get("range") || "";

        const tokenData = rawToken ? await verifyStreamToken(rawToken, secret) : null;
        const effectiveFmt = YT_ALLOWED_FORMATS.has(tokenData && tokenData.fmt ? tokenData.fmt : rawFmt)
          ? (tokenData && tokenData.fmt ? tokenData.fmt : rawFmt)
          : "1080";
        const effectiveUrl = (tokenData && tokenData.url) ? tokenData.url : rawUrl;
        const fallbackExt = getFormatExtension(effectiveFmt);
        const safeFilename = sanitizeDownloadFilename(url.searchParams.get("filename"), fallbackExt);

        let opened = null;

        if (tokenData && tokenData.src) {
          try {
            opened = await openVerifiedBinaryStream(tokenData.src, tokenData.ref || "", rangeHeader);
          } catch (_) {
            opened = null;
          }
        }

        if (!opened && effectiveUrl && /(?:youtube\.com|youtu\.be)/i.test(effectiveUrl) && extractYoutubeVideoId(effectiveUrl)) {
          if (!tokenData) {
            const compliance = await verifyYoutubeCompliance(effectiveUrl);
            if (!compliance.allowed) {
              return ytJsonResponse(403, { success: false, error: compliance.reason });
            }
          }
          for (const resolver of getProviderChain(effectiveUrl, effectiveFmt)) {
            try {
              const fresh = await resolver();
              if (fresh && fresh.streamUrl) {
                opened = await openVerifiedBinaryStream(fresh.streamUrl, fresh.referer || "", rangeHeader);
                if (opened) break;
              }
            } catch (_) {}
          }
        }

        if (!opened) {
          return ytJsonResponse(502, {
            success: false,
            error: "Clean binary video stream unavailable. Please retry or select 1080p MP4."
          });
        }

        const outHeaders = new Headers(YT_CORS_HEADERS);
        outHeaders.set("Content-Type", isAudioFormat(effectiveFmt) ? getFormatMimeType(effectiveFmt) : (opened.contentType || "video/mp4"));
        outHeaders.set("Content-Disposition", `attachment; filename="${safeFilename}"`);
        outHeaders.set("Cache-Control", "no-store");
        if (opened.contentLength) outHeaders.set("Content-Length", opened.contentLength);
        if (opened.contentRange) outHeaders.set("Content-Range", opened.contentRange);
        if (opened.acceptRanges) outHeaders.set("Accept-Ranges", opened.acceptRanges);

        return new Response(opened.stream, { status: opened.status, headers: outHeaders });
      }

      if (env && env.ASSETS) {
        const assetRes = await env.ASSETS.fetch(request);
        if (
          url.pathname === "/" ||
          url.pathname === "/index.html" ||
          url.pathname === "/ytconverter.js" ||
          url.pathname === "/app.js" ||
          url.pathname === "/styles.css"
        ) {
          const freshHeaders = new Headers(assetRes.headers);
          freshHeaders.set("Cache-Control", "no-cache, must-revalidate");
          return new Response(assetRes.body, {
            status: assetRes.status,
            statusText: assetRes.statusText,
            headers: freshHeaders
          });
        }
        return assetRes;
      }
      return new Response("Assets binding not available", { status: 500 });
    }

    // If unauthenticated: stream Edge Intercept Gate (0% assets leaked)
    return new Response(getEdgeGateHtml(), {
      status: 401,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate"
      }
    });
  }
};

function getEdgeGateHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#050908">
  <title>FLIPPY STUDIO · Obsidian Edge Gate</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #050908;
      --card-bg: rgba(11, 21, 17, 0.88);
      --border: rgba(190, 242, 218, 0.11);
      --border-glow: rgba(16, 217, 136, 0.42);
      --jade: #10d988;
      --jade-rgb: 16, 217, 136;
      --gold: #f0b44c;
      --gold-rgb: 240, 180, 76;
      --text: #edf6f2;
      --text-dim: #9cb3aa;
      --red: #f43f5e;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'Outfit', sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      overflow: hidden;
      position: relative;
    }
    .edge-mesh {
      position: absolute;
      inset: -50%;
      background: 
        radial-gradient(circle at 50% 45%, rgba(var(--jade-rgb), 0.13) 0%, transparent 58%),
        radial-gradient(circle at 82% 20%, rgba(var(--gold-rgb), 0.08) 0%, transparent 48%);
      pointer-events: none;
      animation: pulse 12s ease-in-out infinite alternate;
    }
    @keyframes pulse { 0% { transform: scale(1); } 100% { transform: scale(1.14) rotate(2deg); } }
    .gate-card {
      position: relative;
      width: 100%;
      max-width: 440px;
      background: var(--card-bg);
      backdrop-filter: blur(22px);
      -webkit-backdrop-filter: blur(22px);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 40px 32px;
      box-shadow: 0 28px 65px rgba(0,0,0,0.72), 0 0 42px rgba(var(--jade-rgb), 0.09);
      text-align: center;
      z-index: 10;
    }
    .gate-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 999px;
      background: rgba(var(--jade-rgb), 0.11);
      border: 1px solid rgba(var(--jade-rgb), 0.30);
      color: var(--jade);
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.74rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 20px;
    }
    .gate-badge::before {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--jade);
      box-shadow: 0 0 8px var(--jade);
    }
    h1 {
      font-size: 1.7rem;
      font-weight: 800;
      letter-spacing: 0.02em;
      margin-bottom: 8px;
    }
    p.desc {
      color: var(--text-dim);
      font-size: 0.88rem;
      margin-bottom: 28px;
      line-height: 1.5;
    }
    .field-group {
      position: relative;
      margin-bottom: 16px;
    }
    input[type="password"], input[type="text"] {
      width: 100%;
      height: 52px;
      padding: 0 48px 0 18px;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: rgba(4, 9, 7, 0.78);
      color: #fff;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.95rem;
      letter-spacing: 0.08em;
      outline: none;
      text-align: center;
      transition: all 0.25s ease;
    }
    input:focus {
      border-color: var(--jade);
      box-shadow: 0 0 0 3px rgba(var(--jade-rgb), 0.16), 0 0 25px rgba(var(--jade-rgb), 0.12);
    }
    .pw-eye {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: var(--text-dim);
      cursor: pointer;
      padding: 6px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .pw-eye:hover { color: var(--jade); }
    .btn-submit {
      width: 100%;
      height: 52px;
      background: linear-gradient(125deg, #10d988 0%, #2dd4bf 55%, #f0b44c 100%);
      border: none;
      border-radius: 12px;
      color: #03130c;
      font-family: 'Outfit', sans-serif;
      font-weight: 800;
      font-size: 0.95rem;
      letter-spacing: 0.05em;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.25s ease;
      box-shadow: 0 6px 24px rgba(var(--jade-rgb), 0.35);
    }
    .btn-submit:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 28px rgba(var(--jade-rgb), 0.5);
    }
    .btn-submit:active { transform: translateY(1px); }
    .err-msg {
      margin-top: 14px;
      color: var(--red);
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      min-height: 20px;
      opacity: 0;
      transform: translateY(-4px);
      transition: all 0.2s ease;
    }
    .err-msg.show { opacity: 1; transform: translateY(0); }
    .footer-note {
      margin-top: 24px;
      color: rgba(237, 246, 242, 0.28);
      font-size: 0.72rem;
      font-family: 'JetBrains Mono', monospace;
      letter-spacing: 0.05em;
    }
  </style>
</head>
<body>
  <div class="edge-mesh"></div>
  <div class="gate-card">
    <div class="gate-badge">Obsidian Edge Gate</div>
    <h1>FLIPPY<span style="font-weight:400;color:var(--jade);margin-left:6px">STUDIO</span></h1>
    <p class="desc">Enter your whitelisted access key to verify identity and stream workspace assets.</p>

    <div class="field-group">
      <input type="password" id="edgeKey" placeholder="ENTER ACCESS KEY" autocomplete="off" spellcheck="false">
      <button type="button" class="pw-eye" id="toggleVis" title="Toggle visibility">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      </button>
    </div>

    <button type="button" class="btn-submit" id="submitBtn">
      <span>UNLOCK WORKSPACE</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
    </button>

    <div class="err-msg" id="errMsg"></div>
    <div class="footer-note">EDGE MIDDLEWARE VERIFICATION · DEVICE BOUND</div>
  </div>

  <script>
    (function() {
      var devId = localStorage.getItem('flippy_dev_id');
      if (!devId) {
        devId = 'dev_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
        localStorage.setItem('flippy_dev_id', devId);
      }

      var input = document.getElementById('edgeKey');
      var submitBtn = document.getElementById('submitBtn');
      var toggleBtn = document.getElementById('toggleVis');
      var errMsg = document.getElementById('errMsg');

      toggleBtn.addEventListener('click', function() {
        var isPw = input.type === 'password';
        input.type = isPw ? 'text' : 'password';
        input.focus();
      });

      async function verify() {
        var key = (input.value || '').trim();
        if (!key) {
          showError('Please enter your access key.');
          return;
        }

        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.7';
        submitBtn.innerHTML = 'VERIFYING...';
        errMsg.classList.remove('show');

        try {
          var res = await fetch('/__flippy_auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: key, deviceId: devId, mode: (window.navigator.standalone === true || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)) ? 'app' : 'web' })
          });
          var data = await res.json();
          if (res.ok && data.success) {
            submitBtn.innerHTML = 'GRANTED · REDIRECTING...';
            submitBtn.style.background = '#10d988';
            window.location.reload();
          } else {
            showError(data.error || 'Access denied.');
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.innerHTML = '<span>UNLOCK WORKSPACE</span>';
          }
        } catch(e) {
          showError('Connection error to edge middleware.');
          submitBtn.disabled = false;
          submitBtn.style.opacity = '1';
          submitBtn.innerHTML = '<span>UNLOCK WORKSPACE</span>';
        }
      }

      function showError(msg) {
        errMsg.textContent = msg;
        errMsg.classList.add('show');
        input.focus();
      }

      submitBtn.addEventListener('click', verify);
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') verify();
      });
      setTimeout(function() { input.focus(); }, 300);
    })();
  </script>
</body>
</html>`;
}
