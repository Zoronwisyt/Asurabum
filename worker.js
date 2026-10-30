/**
 * Flippy Studio v3 — Cloudflare Worker & Edge Middleware
 * Zero-Asset-Leakage Gate & Device-Bound Authentication
 */

const DEFAULT_SECRET = "FLIPPY_SECRET_SALT_2026_9b83f0c1";

const AUTHORIZED_KEYS = {
  // Master Admin: AjDybantsaisass
  "a01f14a8e7bc95384d3e02bc1a7cf0b624f8d334e40988b21d8dd5cf45cedc7c": { user: "Master Admin", role: "admin", maxDevices: 5 },
  // Alex: FLIPPY-USER-ALEX
  "eab139d3e50d1a55d849144f1f154a58ee8ef473c54a3be4c2cc9d1606ff6ee0": { user: "Alex", role: "member", maxDevices: 1 },
  // Marcus: FLIPPY-USER-MARCUS
  "fa694fcc4ab7be81ba6b8d601880bcf9f4c4f657f34f20b0be0446463a23b7d3": { user: "Marcus", role: "member", maxDevices: 1 },
  // Sarah: FLIPPY-USER-SARAH
  "b44740cfa7b0272e230af2b83cbeef18def7d6b282cfe0810c0589d039f94775": { user: "Sarah", role: "member", maxDevices: 1 },
};

const DEVICE_LOCK_STORE = new Map();

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

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const secret = (env && env.FLIPPY_SECRET) || DEFAULT_SECRET;

    // Handle Authentication API
    if (url.pathname === "/__flippy_auth" && request.method === "POST") {
      try {
        const body = await request.json();
        const rawKey = (body.key || "").trim();
        const deviceId = (body.deviceId || "").trim().slice(0, 64) || "unknown_dev";

        if (!rawKey) {
          return new Response(JSON.stringify({ error: "Please enter an access key." }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }

        const keyHash = await sha256Hex(rawKey);
        let match = AUTHORIZED_KEYS[keyHash];

        if (!match && rawKey === "AjDybantsaisass") {
          match = { user: "Master Admin", role: "admin", maxDevices: 5 };
        }

        if (!match) {
          return new Response(JSON.stringify({ error: "Access Denied: Invalid Key." }), {
            status: 401,
            headers: { "Content-Type": "application/json" }
          });
        }

        // Device lock check
        if (match.maxDevices === 1) {
          const boundDevice = DEVICE_LOCK_STORE.get(keyHash);
          if (boundDevice && boundDevice !== deviceId) {
            return new Response(JSON.stringify({ 
              error: "Key locked to another device. Contact admin to reset." 
            }), {
              status: 403,
              headers: { "Content-Type": "application/json" }
            });
          }
          DEVICE_LOCK_STORE.set(keyHash, deviceId);
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

    // If authenticated: stream actual site assets
    if (isAuthenticated) {
      if (env && env.ASSETS) {
        return await env.ASSETS.fetch(request);
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
  <title>FLIPPY STUDIO · Edge Access Gate</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #07090e;
      --card-bg: rgba(14, 18, 28, 0.85);
      --border: rgba(255, 255, 255, 0.08);
      --border-glow: rgba(6, 182, 212, 0.4);
      --cyan: #06b6d4;
      --cyan-rgb: 6, 182, 212;
      --text: #f1f5f9;
      --text-dim: #94a3b8;
      --red: #ef4444;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'Space Grotesk', sans-serif;
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
        radial-gradient(circle at 50% 50%, rgba(var(--cyan-rgb), 0.12) 0%, transparent 60%),
        radial-gradient(circle at 80% 20%, rgba(168, 85, 247, 0.08) 0%, transparent 50%);
      pointer-events: none;
      animation: pulse 12s ease-in-out infinite alternate;
    }
    @keyframes pulse { 0% { transform: scale(1); } 100% { transform: scale(1.15) rotate(2deg); } }
    .gate-card {
      position: relative;
      width: 100%;
      max-width: 440px;
      background: var(--card-bg);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 40px 32px;
      box-shadow: 0 25px 60px rgba(0,0,0,0.6), 0 0 40px rgba(var(--cyan-rgb), 0.08);
      text-align: center;
      z-index: 10;
    }
    .gate-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 999px;
      background: rgba(var(--cyan-rgb), 0.1);
      border: 1px solid rgba(var(--cyan-rgb), 0.25);
      color: var(--cyan);
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 20px;
    }
    .gate-badge::before {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--cyan);
      box-shadow: 0 0 8px var(--cyan);
    }
    h1 {
      font-size: 1.6rem;
      font-weight: 700;
      letter-spacing: -0.02em;
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
      background: rgba(5, 7, 12, 0.7);
      color: #fff;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.95rem;
      letter-spacing: 0.08em;
      outline: none;
      text-align: center;
      transition: all 0.25s ease;
    }
    input:focus {
      border-color: var(--cyan);
      box-shadow: 0 0 0 3px rgba(var(--cyan-rgb), 0.15), 0 0 25px rgba(var(--cyan-rgb), 0.1);
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
    .pw-eye:hover { color: var(--cyan); }
    .btn-submit {
      width: 100%;
      height: 52px;
      background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
      border: none;
      border-radius: 12px;
      color: #000;
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 700;
      font-size: 0.95rem;
      letter-spacing: 0.04em;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.25s ease;
      box-shadow: 0 4px 20px rgba(var(--cyan-rgb), 0.35);
    }
    .btn-submit:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 25px rgba(var(--cyan-rgb), 0.5);
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
      color: rgba(255,255,255,0.25);
      font-size: 0.72rem;
      font-family: 'JetBrains Mono', monospace;
      letter-spacing: 0.05em;
    }
  </style>
</head>
<body>
  <div class="edge-mesh"></div>
  <div class="gate-card">
    <div class="gate-badge">Cloudflare Edge Gate</div>
    <h1>FLIPPY<span style="font-weight:300;color:var(--cyan)">STUDIO</span></h1>
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
            body: JSON.stringify({ key: key, deviceId: devId })
          });
          var data = await res.json();
          if (res.ok && data.success) {
            submitBtn.innerHTML = 'GRANTED · REDIRECTING...';
            submitBtn.style.background = '#10b981';
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
