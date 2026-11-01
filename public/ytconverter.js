/**
 * YT Converter — Direct .MP4 Video Downloader (1080p / 4K 60fps) + iPhone "Save to Photos" Engine
 * Enforces Content & Channel Legal Compliance Gate (Blocks Licensed Movies & Anime Episodes)
 */
(function(window, document) {
  'use strict';

  // =========================================================================
  // 1. LEGAL COMPLIANCE & COPYRIGHT PROTECTION REGISTRY
  // =========================================================================
  var BLOCKED_CHANNELS = [
    'crunchyroll',
    'crunchyroll collection',
    'crunchyroll dubs',
    'netflix',
    'netflix anime',
    'toei animation',
    'muse asia',
    'ani-one asia',
    'aniplex',
    'vizmedia',
    'viz media',
    'funimation',
    'kadokawa',
    'kadokawaanime',
    'mappa',
    'mappa channel',
    'gundaminfo',
    'bandai namco',
    'tms entertainment',
    'pony canyon',
    'king amusement creative',
    'toho animation',
    'shonen jump',
    'jump comics',
    'sony pictures',
    'sony pictures entertainment',
    'warner bros. pictures',
    'warner bros',
    'universal pictures',
    'paramount pictures',
    'walt disney studios',
    'marvel entertainment',
    '20th century studios',
    'lionsgate movies',
    'mgm',
    'a24',
    'youtube movies',
    'prime video',
    'hulu',
    'peacock',
    'hbo',
    'max'
  ];

  // Regex patterns for full movies and anime episode uploads
  var BLOCKED_TITLE_PATTERNS = [
    /\bfull\s+movie\b/i,
    /\bfull\s+episode\b/i,
    /\b(?:episode|ep\.?)\s*\d+\s*(?:\||-|\[|\(|full|eng\s*sub|sub|dub)/i,
    /\bs\d{1,2}\s*e\d{1,3}\b/i,
    /\b(?:eng(?:lish)?\s+sub(?:s|titled)?|multi\s*sub)\b.*\b(?:episode|ep\.?\s*\d+|anime)\b/i,
    /\b(?:anime\s+full\s+episode|official\s+episode)\b/i,
    /\b(?:complete\s+feature\s+film|official\s+full\s+movie)\b/i
  ];

  // Device & Camera Roll Presets
  var DEVICE_PRESETS = {
    iphone_photos: {
      resolution: '1080p60',
      videoCodec: 'h264',
      audioCodec: 'aac',
      container: 'mp4',
      tag: 'iPhone Photos .MP4'
    },
    android_gallery: {
      resolution: '1080p60',
      videoCodec: 'h264',
      audioCodec: 'aac',
      container: 'mp4',
      tag: 'Android .MP4'
    },
    desktop_4k: {
      resolution: '2160p60',
      videoCodec: 'h264',
      audioCodec: 'aac',
      container: 'mp4',
      tag: '4K60 .MP4'
    },
    nle_edit: {
      resolution: '1080p60',
      videoCodec: 'h264',
      audioCodec: 'aac',
      container: 'mp4',
      tag: 'NLE Edit .MP4'
    }
  };

  function isIOSDevice() {
    var ua = navigator.userAgent || '';
    var iOS = /iPad|iPhone|iPod/i.test(ua);
    var iPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    return iOS || iPadOS;
  }

  function isAndroidDevice() {
    return /Android/i.test(navigator.userAgent || '');
  }

  var state = {
    url: '',
    videoId: '',
    meta: null,
    compliance: {
      checked: false,
      allowed: false,
      reason: '',
      matchedRule: ''
    },
    activePreset: 'desktop_4k',
    settings: {
      resolution: '2160p60',
      videoCodec: 'h264',
      audioCodec: 'aac',
      container: 'mp4',
      fps: '60',
      trimEnabled: false,
      trimStart: '00:00:00',
      trimEnd: '00:00:30',
      legalAttested: true
    },
    readyMedia: {
      blobUrl: null,
      directUrl: null,
      file: null,
      filename: ''
    },
    backendApiBase: null, // Discovered endpoint ('' for same-origin or 'http://localhost:3000')
    customBlockedChannels: (function(){ try { var raw = localStorage.getItem('flippy_ytc_custom_blocked_channels'); return raw ? JSON.parse(raw) : []; } catch(_) { return []; } })(),
    history: [],
    isFetching: false,
    isDownloading: false
  };

  // Cleanup any previously buffered MP4 Blob URL
  function clearReadyMedia() {
    if (state.readyMedia.blobUrl) {
      try { URL.revokeObjectURL(state.readyMedia.blobUrl); } catch (_) {}
    }
    state.readyMedia = { blobUrl: null, directUrl: null, file: null, filename: '' };

    var readyBox = document.getElementById('ytcReadyMediaBox');
    var player = document.getElementById('ytcPreviewPlayer');
    var embedWrap = document.getElementById('ytcEmbedFallbackWrap');
    var embedFrame = document.getElementById('ytcEmbedFrame');

    if (readyBox) readyBox.style.display = 'none';
    if (player) {
      player.pause();
      player.removeAttribute('src');
      player.load();
    }
    if (embedWrap) embedWrap.style.display = 'none';
    if (embedFrame && embedFrame.src !== 'about:blank') {
      embedFrame.src = 'about:blank';
    }
  }

  // Extract 11-char YouTube Video ID
  function extractYoutubeId(inputUrl) {
    if (!inputUrl) return null;
    var trimmed = inputUrl.trim();
    var reg = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    var m = trimmed.match(reg);
    if (m && m[1]) return m[1];
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
    return null;
  }

  // Evaluate Legal & Channel Compliance
  function evaluateCompliance(meta) {
    var title = (meta && meta.title) ? meta.title.trim() : '';
    var author = (meta && meta.author_name) ? meta.author_name.trim() : '';
    var authorLower = author.toLowerCase();

    var allBlocked = BLOCKED_CHANNELS.concat(state.customBlockedChannels);

    // 1. Check specific channel blocklist
    for (var i = 0; i < allBlocked.length; i++) {
      var blockedCh = allBlocked[i].toLowerCase().trim();
      if (!blockedCh) continue;
      if (authorLower === blockedCh || authorLower.indexOf(blockedCh) !== -1) {
        return {
          checked: true,
          allowed: false,
          reason: 'Restricted Channel: "' + author + '" is a protected Movie / Anime distributor.',
          matchedRule: 'CHANNEL_POLICY (' + allBlocked[i] + ')'
        };
      }
    }

    // 2. Check Title Patterns for Full Movies or Anime Episodes
    for (var p = 0; p < BLOCKED_TITLE_PATTERNS.length; p++) {
      var pat = BLOCKED_TITLE_PATTERNS[p];
      if (pat.test(title)) {
        if (/trailer|teaser|pv|op\b|ed\b|opening|ending|ost/i.test(title) && !/full\s+(movie|episode)/i.test(title)) {
          continue;
        }
        return {
          checked: true,
          allowed: false,
          reason: 'Restricted Content: Title matches protected Full Movie or Anime Episode broadcast pattern.',
          matchedRule: 'CONTENT_PATTERN (' + pat.toString() + ')'
        };
      }
    }

    return {
      checked: true,
      allowed: true,
      reason: 'Cleared: Creator upload does not match restricted movie/anime distribution channels.',
      matchedRule: 'PASS'
    };
  }

  // Fetch YouTube Metadata via Public oEmbed
  async function fetchVideoMetadata(videoId) {
    var watchUrl = 'https://www.youtube.com/watch?v=' + videoId;
    try {
      var res = await fetch('https://www.youtube.com/oembed?url=' + encodeURIComponent(watchUrl) + '&format=json');
      if (res.ok) {
        var data = await res.json();
        return {
          title: data.title || ('YouTube Video (' + videoId + ')'),
          author_name: data.author_name || 'Unknown Channel',
          author_url: data.author_url || '',
          thumbnail_url: 'https://i.ytimg.com/vi/' + videoId + '/maxresdefault.jpg',
          fallback_thumb: data.thumbnail_url || ('https://i.ytimg.com/vi/' + videoId + '/hqdefault.jpg')
        };
      }
    } catch (_) {}

    try {
      var res2 = await fetch('https://noembed.com/embed?url=' + encodeURIComponent(watchUrl));
      if (res2.ok) {
        var data2 = await res2.json();
        if (!data2.error) {
          return {
            title: data2.title || ('YouTube Video (' + videoId + ')'),
            author_name: data2.author_name || 'Unknown Channel',
            author_url: data2.author_url || '',
            thumbnail_url: 'https://i.ytimg.com/vi/' + videoId + '/maxresdefault.jpg',
            fallback_thumb: data2.thumbnail_url || ('https://i.ytimg.com/vi/' + videoId + '/hqdefault.jpg')
          };
        }
      }
    } catch (_) {}

    return {
      title: 'YouTube Media Stream (' + videoId + ')',
      author_name: 'Unverified Creator',
      author_url: watchUrl,
      thumbnail_url: 'https://i.ytimg.com/vi/' + videoId + '/hqdefault.jpg',
      fallback_thumb: 'https://i.ytimg.com/vi/' + videoId + '/hqdefault.jpg'
    };
  }

  // Map UI settings to upstream muxer format code
  function mapSettingsToMuxFormat() {
    var s = state.settings;
    if (s.resolution === 'audio' || s.container === 'mp3' || s.container === 'm4a' || s.container === 'wav' || s.container === 'flac') {
      if (s.container === 'wav' || s.audioCodec === 'wav') return 'wav';
      if (s.container === 'flac' || s.audioCodec === 'flac') return 'flac';
      if (s.container === 'm4a' || s.audioCodec === 'aac') return 'm4a';
      return 'mp3';
    }
    if (s.resolution.indexOf('2160') === 0) return '4k';
    if (s.resolution.indexOf('1440') === 0) return '1440';
    if (s.resolution.indexOf('1080') === 0) return '1080';
    if (s.resolution.indexOf('720') === 0) return '720';
    if (s.resolution.indexOf('480') === 0) return '480';
    return '1080';
  }

  function getOutputExtension() {
    var fmt = mapSettingsToMuxFormat();
    if (fmt === 'mp3' || fmt === 'm4a' || fmt === 'wav' || fmt === 'flac') return fmt;
    return 'mp4';
  }

  function getOutputMimeType() {
    var ext = getOutputExtension();
    if (ext === 'mp3') return 'audio/mpeg';
    if (ext === 'm4a') return 'audio/mp4';
    if (ext === 'wav') return 'audio/wav';
    if (ext === 'flac') return 'audio/flac';
    return 'video/mp4';
  }

  function isApplePhotosCompatible() {
    var s = state.settings;
    if (s.resolution === 'audio') return false;
    var containerOk = (s.container === 'mp4' || s.container === 'mov');
    var vcodecOk = (s.videoCodec === 'h264' || s.videoCodec === 'hevc');
    var acodecOk = (s.audioCodec === 'aac' || s.audioCodec === 'mp3');
    return containerOk && vcodecOk && acodecOk;
  }

  // Build Optional CLI Command Reference
  function generateCliCommand() {
    var vid = state.videoId || 'aqz-KE-bpKQ';
    var url = 'https://www.youtube.com/watch?v=' + vid;
    var s = state.settings;

    if (s.resolution === 'audio') {
      var aFormat = (s.container === 'mp3' || s.container === 'wav' || s.container === 'm4a') ? s.container : 'm4a';
      return 'yt-dlp -x --audio-format ' + aFormat + ' --audio-quality 0 "' + url + '"';
    }

    var heightMap = {
      '2160p60': { h: 2160, fps: 60 },
      '2160p30': { h: 2160, fps: 30 },
      '1440p60': { h: 1440, fps: 60 },
      '1080p60': { h: 1080, fps: 60 },
      '1080p30': { h: 1080, fps: 30 },
      '720p60':  { h: 720,  fps: 60 },
      '480p':    { h: 480,  fps: 30 }
    };

    var target = heightMap[s.resolution] || { h: 1080, fps: 60 };
    var vcodecFilter = '';
    if (s.videoCodec === 'h264') vcodecFilter = '[vcodec^=avc1]';
    else if (s.videoCodec === 'av1') vcodecFilter = '[vcodec^=av01]';
    else if (s.videoCodec === 'vp9') vcodecFilter = '[vcodec^=vp9]';
    else if (s.videoCodec === 'hevc') vcodecFilter = '[vcodec^=hev1]';

    var acodecFilter = '';
    if (s.audioCodec === 'aac') acodecFilter = '[acodec^=mp4a]';
    else if (s.audioCodec === 'opus') acodecFilter = '[acodec^=opus]';

    var fmt = 'bestvideo[height<=' + target.h + '][fps<=' + target.fps + ']' + vcodecFilter + '+bestaudio' + acodecFilter + '/best[height<=' + target.h + ']';
    var outExt = (s.container === 'mp3' || s.container === 'wav' || s.container === 'm4a') ? 'mp4' : s.container;
    var cmd = 'yt-dlp -f "' + fmt + '" --merge-output-format ' + outExt;

    if (s.trimEnabled && s.trimStart && s.trimEnd) {
      cmd += ' --download-sections "*' + s.trimStart + '-' + s.trimEnd + '" --force-keyframes-at-cuts';
    }

    cmd += ' "' + url + '"';
    return cmd;
  }

  // Auto-discover Flippy MP4 proxy (same-origin Worker/Server or local port 3000)
  async function discoverBackendBase() {
    if (state.backendApiBase !== null) return state.backendApiBase;

    var candidates = [];
    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
      candidates.push('');
    }
    candidates.push('http://localhost:3000');

    for (var i = 0; i < candidates.length; i++) {
      var base = candidates[i];
      try {
        var ctrl = new AbortController();
        var timer = setTimeout(function() { ctrl.abort(); }, 1800);
        var res = await fetch(base + '/__flippy_yt_ping', { signal: ctrl.signal });
        clearTimeout(timer);
        if (res.ok) {
          var j = await res.json();
          if (j && j.ok) {
            state.backendApiBase = base;
            return base;
          }
        }
      } catch (_) {}
    }

    state.backendApiBase = false;
    return false;
  }

  // Apply a Device Preset (e.g. iPhone Photos, Android MP4, Desktop 4K60, NLE Edit)
  function applyDevicePreset(presetKey) {
    var p = DEVICE_PRESETS[presetKey];
    if (!p) return;

    state.activePreset = presetKey;
    state.settings.resolution = p.resolution;
    state.settings.videoCodec = p.videoCodec;
    state.settings.audioCodec = p.audioCodec;
    state.settings.container = p.container;

    var resEl = document.getElementById('ytcResolutionSelect');
    var vcEl = document.getElementById('ytcVideoCodecSelect');
    var acEl = document.getElementById('ytcAudioCodecSelect');
    var ctEl = document.getElementById('ytcContainerSelect');

    if (resEl) resEl.value = p.resolution;
    if (vcEl) vcEl.value = p.videoCodec;
    if (acEl) acEl.value = p.audioCodec;
    if (ctEl) ctEl.value = p.container;

    document.querySelectorAll('.ytc-preset-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.getAttribute('data-preset') === presetKey);
    });

    var presetTag = document.getElementById('ytcActivePresetTag');
    if (presetTag) presetTag.textContent = p.tag;

    clearReadyMedia();
    updateUI();
  }

  // Update UI State
  function updateUI() {
    var statusBadge = document.getElementById('ytcComplianceBadge');
    var statusReason = document.getElementById('ytcComplianceReason');
    var statusRule = document.getElementById('ytcComplianceRule');
    var previewCard = document.getElementById('ytcVideoPreviewCard');
    var thumbImg = document.getElementById('ytcThumbImg');
    var videoTitle = document.getElementById('ytcVideoTitle');
    var channelName = document.getElementById('ytcChannelName');
    var downloadBtn = document.getElementById('ytcDownloadBtn');
    var downloadBtnLabel = document.getElementById('ytcDownloadBtnLabel');
    var cliOutput = document.getElementById('ytcCliCode');
    var streamSpecBadge = document.getElementById('ytcStreamSpecBadge');
    var iosHint = document.getElementById('ytcIosCompatHint');

    if (cliOutput) {
      cliOutput.textContent = generateCliCommand();
    }

    var s = state.settings;
    var outExt = getOutputExtension().toUpperCase();
    if (streamSpecBadge) {
      streamSpecBadge.textContent = s.resolution.toUpperCase() + ' · ' + s.videoCodec.toUpperCase() + ' / ' + s.audioCodec.toUpperCase() + ' · .' + outExt;
    }

    if (downloadBtnLabel && !state.isDownloading) {
      if (outExt !== 'MP4') {
        downloadBtnLabel.textContent = 'Download .' + outExt + ' Audio';
      } else if (state.activePreset === 'iphone_photos' || isIOSDevice()) {
        downloadBtnLabel.textContent = 'Prepare .MP4 for iPhone Photos (' + s.resolution.replace('p60', 'p').replace('p30', 'p') + ')';
      } else {
        downloadBtnLabel.textContent = 'Download .MP4 Video (' + s.resolution.toUpperCase() + ')';
      }
    }

    if (iosHint) {
      if (s.resolution === 'audio' || outExt !== 'MP4') {
        iosHint.className = 'ytc-ios-hint ok';
        iosHint.textContent = '✓ Direct .' + outExt + ' audio file download enabled (Mobile & Desktop Ready)';
      } else if (isApplePhotosCompatible()) {
        iosHint.className = 'ytc-ios-hint ok';
        iosHint.textContent = '✓ Direct .MP4 video output (' + s.videoCodec.toUpperCase() + ' + ' + s.audioCodec.toUpperCase() + ') — 100% compatible with iPhone Photos, Android Gallery & Alight Motion';
      } else {
        iosHint.className = 'ytc-ios-hint warn';
        iosHint.textContent = '⚠ iPhone Camera Roll requires .MP4/.MOV with H.264/HEVC + AAC. Tap "📱 iPhone Photos" preset above if saving on iOS.';
      }
    }

    if (!state.meta) {
      if (previewCard) previewCard.classList.add('empty');
      if (statusBadge) {
        statusBadge.className = 'ytc-compliance-badge idle';
        statusBadge.textContent = 'AWAITING LINK';
      }
      if (statusReason) statusReason.textContent = 'Paste a YouTube link above to verify channel & copyright eligibility.';
      if (statusRule) statusRule.textContent = 'POLICY: NO FULL MOVIES / NO LICENSED ANIME EPISODES';
      if (downloadBtn) downloadBtn.disabled = true;
      return;
    }

    if (previewCard) previewCard.classList.remove('empty');
    if (thumbImg) {
      thumbImg.onerror = function() {
        if (state.meta && state.meta.fallback_thumb && thumbImg.src !== state.meta.fallback_thumb) {
          thumbImg.src = state.meta.fallback_thumb;
        }
      };
      thumbImg.src = state.meta.thumbnail_url;
    }
    if (videoTitle) videoTitle.textContent = state.meta.title;
    if (channelName) channelName.textContent = state.meta.author_name;

    if (state.compliance.checked) {
      if (state.compliance.allowed) {
        if (statusBadge) {
          statusBadge.className = 'ytc-compliance-badge pass';
          statusBadge.textContent = 'VERIFIED CLEAR · PERMITTED';
        }
        if (statusReason) statusReason.textContent = state.compliance.reason;
        if (statusRule) statusRule.textContent = 'RULE: ' + state.compliance.matchedRule;
        if (downloadBtn) downloadBtn.disabled = !state.settings.legalAttested || state.isDownloading;
      } else {
        clearReadyMedia();
        if (statusBadge) {
          statusBadge.className = 'ytc-compliance-badge blocked';
          statusBadge.textContent = 'BLOCKED · COPYRIGHT / LICENSED MEDIA';
        }
        if (statusReason) statusReason.textContent = state.compliance.reason;
        if (statusRule) statusRule.textContent = 'RULE: ' + state.compliance.matchedRule;
        if (downloadBtn) downloadBtn.disabled = true;
      }
    }
  }

  // Analyze Input URL
  async function analyzeUrl(rawUrl) {
    clearReadyMedia();
    var inputEl = document.getElementById('ytcUrlInput');
    var urlToAnalyze = rawUrl !== undefined ? rawUrl : (inputEl ? inputEl.value : '');
    var vid = extractYoutubeId(urlToAnalyze);

    var analyzeBtn = document.getElementById('ytcAnalyzeBtn');
    if (!vid) {
      state.videoId = '';
      state.meta = null;
      state.compliance = {
        checked: true,
        allowed: false,
        reason: 'Invalid YouTube URL format. Provide a valid watch, shorts, or youtu.be link.',
        matchedRule: 'INVALID_URI'
      };
      updateUI();
      return;
    }

    state.url = 'https://www.youtube.com/watch?v=' + vid;
    state.videoId = vid;
    state.isFetching = true;
    if (analyzeBtn) analyzeBtn.textContent = 'Scanning...';

    var meta = await fetchVideoMetadata(vid);
    state.meta = meta;
    state.compliance = evaluateCompliance(meta);
    state.isFetching = false;
    if (analyzeBtn) analyzeBtn.textContent = 'Analyze Link';

    updateUI();
  }

  // Trigger standard browser file download (.mp4 / .m4a / .mp3)
  function triggerBrowserDownload(href, filename) {
    var a = document.createElement('a');
    a.href = href;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // Synchronous click handler for "Save Video to iPhone Photos" (Web Share API Level 2)
  async function handleSaveToPhotosClick() {
    var btnLabel = document.getElementById('ytcSaveToPhotosLabel');

    if (state.readyMedia.file && navigator.canShare && navigator.canShare({ files: [state.readyMedia.file] })) {
      try {
        await navigator.share({
          files: [state.readyMedia.file],
          title: state.meta ? state.meta.title : state.readyMedia.filename
        });
        if (btnLabel) {
          btnLabel.textContent = '✓ Shared — Tap "Save Video" in iOS Menu';
          setTimeout(function() {
            btnLabel.textContent = 'Save Video to iPhone Photos';
          }, 3500);
        }
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return;
      }
    }

    // Fallback on Desktop or browsers without file-sharing sheet: save the .MP4 directly
    var targetHref = state.readyMedia.blobUrl;
    if (targetHref) {
      triggerBrowserDownload(targetHref, state.readyMedia.filename || 'video.mp4');
      if (btnLabel) {
        btnLabel.textContent = '✓ Saved .MP4 to Downloads';
        setTimeout(function() {
          btnLabel.textContent = isIOSDevice() ? 'Save Video to iPhone Photos' : 'Save / Share .MP4 Video';
        }, 2500);
      }
    } else if (state.readyMedia.directUrl && state.backendApiBase) {
      var safeStream = state.readyMedia.directUrl.startsWith('http')
        ? (state.backendApiBase + '/__flippy_yt_stream?src=' + encodeURIComponent(state.readyMedia.directUrl))
        : (state.backendApiBase + state.readyMedia.directUrl);
      triggerBrowserDownload(safeStream, state.readyMedia.filename || 'video.mp4');
    }
  }

  // Fallback when no local/edge proxy is running (100% popup-free & ad-free)
  function activateStaticMp4Fallback(ytWatchUrl, muxFmt) {
    var progText = document.getElementById('ytcProgressStatus');
    var progFill = document.getElementById('ytcProgressBarFill');
    var progWrap = document.getElementById('ytcProgressWrap');
    var dlBtn = document.getElementById('ytcDownloadBtn');
    var dlLabel = document.getElementById('ytcDownloadBtnLabel');

    if (progWrap) progWrap.style.display = 'flex';
    if (progFill) progFill.style.width = '0%';
    if (dlBtn) dlBtn.disabled = false;
    if (dlLabel) dlLabel.textContent = 'Download .MP4 Video';
    if (progText) {
      progText.textContent = 'Stream server offline. Please start "node server.js" on port 3000 for 100% ad-free & popup-free downloads.';
    }
  }

  // Execute Real .MP4 Stream Conversion, Buffering & Download Pipeline
  async function startDownloadProcess() {
    if (!state.meta || !state.compliance.allowed || !state.settings.legalAttested || state.isDownloading) return;

    clearReadyMedia();

    var progWrap = document.getElementById('ytcProgressWrap');
    var progFill = document.getElementById('ytcProgressBarFill');
    var progText = document.getElementById('ytcProgressStatus');
    var dlBtn = document.getElementById('ytcDownloadBtn');
    var dlLabel = document.getElementById('ytcDownloadBtnLabel');

    state.isDownloading = true;
    if (dlBtn) dlBtn.disabled = true;
    if (dlLabel) dlLabel.textContent = 'Muxing .MP4 Video...';
    if (progWrap) progWrap.style.display = 'flex';
    if (progFill) progFill.style.width = '8%';

    var ytWatchUrl = 'https://www.youtube.com/watch?v=' + state.videoId;
    var muxFmt = mapSettingsToMuxFormat();
    var outExt = getOutputExtension();
    var mimeType = getOutputMimeType();
    var safeTitle = (state.meta.title || state.videoId)
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
      .replace(/\s+/g, '_')
      .slice(0, 64) || ('Flippy_Video_' + state.videoId);
    var finalFilename = safeTitle + '_' + muxFmt.toUpperCase() + '.' + outExt;

    try {
      if (progText) progText.textContent = 'Compliance verified (' + state.meta.author_name + ') · Connecting to MP4 stream muxer...';

      // Re-probe localhost:3000 if previously false in case user just started server.js
      if (state.backendApiBase === false) state.backendApiBase = null;
      var apiBase = await discoverBackendBase();

      if (apiBase === false) {
        activateStaticMp4Fallback(ytWatchUrl, muxFmt);
        state.isDownloading = false;
        updateUI();
        return;
      }

      // Step 1: Request real MP4 mux job
      var startRes = await fetch(
        apiBase + '/__flippy_yt_dl?url=' + encodeURIComponent(ytWatchUrl) + '&format=' + encodeURIComponent(muxFmt)
      );
      var startData = await startRes.json();

      if (!startRes.ok || !startData || !startData.id) {
        throw new Error((startData && startData.error) || 'Could not initialize MP4 stream job');
      }

      var jobId = startData.id;
      var directDownloadUrl = startData.download_url || null;

      // Step 2: Poll conversion progress until MP4 muxing reaches 100%
      var maxPolls = 45;
      for (var pollIdx = 0; pollIdx < maxPolls && !directDownloadUrl; pollIdx++) {
        await new Promise(function(r) { setTimeout(r, 1400); });
        var pRes = await fetch(apiBase + '/__flippy_yt_progress?id=' + encodeURIComponent(jobId));
        if (!pRes.ok) continue;
        var pData = await pRes.json();

        var rawPct = typeof pData.progress === 'number' ? Math.min(100, Math.round(pData.progress / 10)) : 20;
        var scaledPct = Math.max(12, Math.round(rawPct * 0.6)); // First 60% is cloud MP4 muxing
        if (progFill) progFill.style.width = scaledPct + '%';
        if (progText) {
          progText.textContent = 'Muxing ' + muxFmt.toUpperCase() + ' .' + outExt.toUpperCase() + ' stream: ' + rawPct + '% (' + (pData.text || 'Processing') + ')...';
        }

        if (pData.download_url && Number(pData.success) === 1) {
          directDownloadUrl = pData.download_url;
          break;
        }
        if (pData.progress >= 1000 && !pData.download_url) {
          throw new Error(pData.text || 'Stream muxing failed for this resolution. Try 1080p MP4.');
        }
      }

      if (!directDownloadUrl) {
        throw new Error('Timed out waiting for MP4 muxer. Try 1080p preset.');
      }

      // Step 3: Buffer real .MP4 binary stream (100% ad-free & popup-free)
      if (progFill) progFill.style.width = '65%';
      if (progText) progText.textContent = 'Downloading .' + outExt.toUpperCase() + ' file to device memory...';

      var streamUrl = directDownloadUrl;
      if (!streamUrl.startsWith('http')) {
        streamUrl = apiBase + streamUrl;
      } else if (!streamUrl.startsWith(apiBase) && apiBase) {
        // Route third-party download URL through safe server proxy to prevent any ad redirects
        streamUrl = apiBase + '/__flippy_yt_stream?src=' + encodeURIComponent(streamUrl);
      }

      var mediaBlob = null;
      try {
        var mediaRes = await fetch(streamUrl);
        if (mediaRes.ok && mediaRes.body && typeof mediaRes.body.getReader === 'function') {
          var contentLen = Number(mediaRes.headers.get('content-length')) || 0;
          var reader = mediaRes.body.getReader();
          var chunks = [];
          var received = 0;

          while (true) {
            var step = await reader.read();
            if (step.done) break;
            chunks.push(step.value);
            received += step.value.length;
            var mb = (received / (1024 * 1024)).toFixed(1);
            if (contentLen > 0) {
              var dlPct = Math.round((received / contentLen) * 100);
              if (progFill) progFill.style.width = (60 + Math.round(dlPct * 0.4)) + '%';
              if (progText) progText.textContent = 'Receiving .' + outExt.toUpperCase() + ': ' + mb + ' MB (' + dlPct + '%)...';
            } else {
              if (progText) progText.textContent = 'Receiving .' + outExt.toUpperCase() + ': ' + mb + ' MB...';
            }
          }
          mediaBlob = new Blob(chunks, { type: mimeType });
        } else if (mediaRes.ok) {
          var rawBlob = await mediaRes.blob();
          mediaBlob = new Blob([rawBlob], { type: mimeType });
        }
      } catch (_) {
        mediaBlob = null;
      }

      if (progFill) progFill.style.width = '100%';

      var readyBox = document.getElementById('ytcReadyMediaBox');
      var readyFilenameEl = document.getElementById('ytcReadyFilename');
      var player = document.getElementById('ytcPreviewPlayer');
      var directLink = document.getElementById('ytcDirectMp4Link');
      var savePhotosLabel = document.getElementById('ytcSaveToPhotosLabel');

      state.readyMedia.directUrl = streamUrl;
      state.readyMedia.filename = finalFilename;
      if (readyFilenameEl) readyFilenameEl.textContent = finalFilename;

      if (mediaBlob) {
        var blobUrl = URL.createObjectURL(mediaBlob);
        var fileObj = new File([mediaBlob], finalFilename, { type: mimeType, lastModified: Date.now() });
        state.readyMedia.blobUrl = blobUrl;
        state.readyMedia.file = fileObj;

        if (player) {
          player.style.display = (outExt === 'mp4') ? 'block' : 'none';
          if (outExt === 'mp4') player.src = blobUrl;
        }
        if (directLink) {
          directLink.href = blobUrl;
          directLink.download = finalFilename;
          directLink.textContent = '⬇ Save .' + outExt.toUpperCase() + ' File';
        }
      } else {
        // Safe same-origin stream fallback — NEVER exposes third-party ad URL to <a>
        if (player) player.style.display = 'none';
        if (directLink) {
          directLink.href = streamUrl;
          directLink.download = finalFilename;
          directLink.textContent = '⬇ Download .' + outExt.toUpperCase() + ' Directly';
        }
      }

      var canShareFile = !!(state.readyMedia.file && navigator.canShare && navigator.canShare({ files: [state.readyMedia.file] }));
      if (savePhotosLabel) {
        if (isIOSDevice() || state.activePreset === 'iphone_photos') {
          savePhotosLabel.textContent = canShareFile ? '📱 Save Video to iPhone Photos' : '⬇ Save .MP4 Video';
        } else {
          savePhotosLabel.textContent = canShareFile ? '📱 Share / Save to Photos' : '⬇ Save .' + outExt.toUpperCase() + ' Video';
        }
      }

      if (readyBox) readyBox.style.display = 'flex';

      // On Desktop / Android (when not in iPhone Photos Share-Sheet wait mode), immediately save the .MP4 file!
      var usePhotosShareFirst = (isIOSDevice() || state.activePreset === 'iphone_photos') && canShareFile;
      if (usePhotosShareFirst) {
        if (progText) progText.textContent = '✓ MP4 Ready! Tap "Save Video to iPhone Photos" below → choose "Save Video".';
      } else {
        var dlTarget = state.readyMedia.blobUrl || (streamUrl.startsWith(apiBase) ? streamUrl : null);
        if (dlTarget) {
          triggerBrowserDownload(dlTarget, finalFilename);
          if (progText) progText.textContent = '✓ Downloaded real .' + outExt.toUpperCase() + ' file (' + finalFilename + ')!';
        } else {
          if (progText) progText.textContent = '✓ Ready! Click "Save .' + outExt.toUpperCase() + ' File" below to download.';
        }
      }

      // Record in session queue
      state.history.unshift({
        id: state.videoId,
        title: state.meta.title,
        author: state.meta.author_name,
        res: muxFmt.toUpperCase(),
        codec: state.settings.videoCodec.toUpperCase() + '/' + state.settings.audioCodec.toUpperCase(),
        container: outExt.toUpperCase(),
        timestamp: new Date().toLocaleTimeString()
      });
      renderHistory();

    } catch (err) {
      if (progFill) progFill.style.width = '0%';
      if (progText) progText.textContent = 'Error: ' + (err && err.message ? err.message : 'Download failed');
    } finally {
      state.isDownloading = false;
      updateUI();
    }
  }

  function renderHistory() {
    var listEl = document.getElementById('ytcHistoryList');
    if (!listEl) return;
    if (state.history.length === 0) {
      listEl.innerHTML = '<div class="xg-empty-card">No .MP4 downloads in session queue yet.</div>';
      return;
    }
    var html = '';
    for (var i = 0; i < state.history.length; i++) {
      var h = state.history[i];
      html += '<div class="ytc-history-item">';
      html += '  <div class="ytc-hist-meta">';
      html += '    <div class="ytc-hist-title">' + h.title + '</div>';
      html += '    <div class="ytc-hist-sub">' + h.author + ' · <span class="ytc-tag">' + h.res + '</span> <span class="ytc-tag">' + h.codec + '</span> <span class="ytc-tag">.' + h.container + '</span></div>';
      html += '  </div>';
      html += '  <span class="ytc-hist-time">' + h.timestamp + '</span>';
      html += '</div>';
    }
    listEl.innerHTML = html;
  }

  function renderBlockedChannelsList() {
    var container = document.getElementById('ytcBlockedChannelsTags');
    if (!container) return;
    var all = BLOCKED_CHANNELS.concat(state.customBlockedChannels);
    var html = '';
    for (var i = 0; i < all.length; i++) {
      html += '<span class="ytc-blocked-chip">' + all[i] + '</span>';
    }
    container.innerHTML = html;
  }

  function bindEvents() {
    var analyzeBtn = document.getElementById('ytcAnalyzeBtn');
    var urlInput = document.getElementById('ytcUrlInput');
    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', function() {
        analyzeUrl();
      });
    }
    if (urlInput) {
      urlInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          analyzeUrl();
        }
      });
      urlInput.addEventListener('paste', function() {
        setTimeout(function() { analyzeUrl(); }, 60);
      });
    }

    // Device Preset Buttons (iPhone Photos / Android / Desktop 4K60 / Alight Motion)
    document.querySelectorAll('.ytc-preset-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var key = btn.getAttribute('data-preset');
        applyDevicePreset(key);
      });
    });

    // Compliance Test Presets
    document.querySelectorAll('.ytc-test-preset').forEach(function(btn) {
      btn.addEventListener('click', function() {
        clearReadyMedia();
        var presetUrl = btn.getAttribute('data-url');
        var presetTitle = btn.getAttribute('data-title');
        var presetAuthor = btn.getAttribute('data-author');
        if (urlInput) urlInput.value = presetUrl;

        var vid = extractYoutubeId(presetUrl) || 'aqz-KE-bpKQ';
        state.url = presetUrl;
        state.videoId = vid;
        state.meta = {
          title: presetTitle,
          author_name: presetAuthor,
          author_url: 'https://www.youtube.com',
          thumbnail_url: 'https://i.ytimg.com/vi/' + vid + '/hqdefault.jpg',
          fallback_thumb: 'https://i.ytimg.com/vi/' + vid + '/hqdefault.jpg'
        };
        state.compliance = evaluateCompliance(state.meta);
        updateUI();
      });
    });

    // Manual Settings Selectors
    function bindSelect(id, key) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', function() {
        state.settings[key] = el.value;
        clearReadyMedia();
        updateUI();
      });
    }

    bindSelect('ytcResolutionSelect', 'resolution');
    bindSelect('ytcVideoCodecSelect', 'videoCodec');
    bindSelect('ytcAudioCodecSelect', 'audioCodec');
    bindSelect('ytcContainerSelect', 'container');

    var trimToggle = document.getElementById('ytcTrimToggle');
    var trimRow = document.getElementById('ytcTrimRow');
    if (trimToggle) {
      trimToggle.addEventListener('change', function() {
        state.settings.trimEnabled = trimToggle.checked;
        if (trimRow) trimRow.style.display = trimToggle.checked ? 'flex' : 'none';
        updateUI();
      });
    }

    var trimStart = document.getElementById('ytcTrimStart');
    var trimEnd = document.getElementById('ytcTrimEnd');
    if (trimStart) trimStart.addEventListener('input', function() { state.settings.trimStart = trimStart.value; updateUI(); });
    if (trimEnd) trimEnd.addEventListener('input', function() { state.settings.trimEnd = trimEnd.value; updateUI(); });

    var legalCheck = document.getElementById('ytcLegalAttestCheck');
    if (legalCheck) {
      legalCheck.addEventListener('change', function() {
        state.settings.legalAttested = legalCheck.checked;
        if (!legalCheck.checked) clearReadyMedia();
        updateUI();
      });
    }

    var dlBtn = document.getElementById('ytcDownloadBtn');
    if (dlBtn) {
      dlBtn.addEventListener('click', startDownloadProcess);
    }

    var savePhotosBtn = document.getElementById('ytcSaveToPhotosBtn');
    if (savePhotosBtn) {
      savePhotosBtn.addEventListener('click', handleSaveToPhotosClick);
    }

    var copyCliBtn = document.getElementById('ytcCopyCliBtn');
    if (copyCliBtn) {
      copyCliBtn.addEventListener('click', function() {
        var cmd = generateCliCommand();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(cmd);
        }
        copyCliBtn.textContent = 'Copied!';
        setTimeout(function() { copyCliBtn.textContent = 'Copy Command'; }, 1500);
      });
    }

    // Add Custom Blocked Channel
    var addBlockedBtn = document.getElementById('ytcAddBlockedChannelBtn');
    var addBlockedInput = document.getElementById('ytcCustomBlockedInput');
    if (addBlockedBtn && addBlockedInput) {
      addBlockedBtn.addEventListener('click', function() {
        var val = addBlockedInput.value.trim();
        if (val) {
          state.customBlockedChannels.push(val);
          try { localStorage.setItem('flippy_ytc_custom_blocked_channels', JSON.stringify(state.customBlockedChannels)); } catch(_) {}
          addBlockedInput.value = '';
          renderBlockedChannelsList();
          if (state.meta) {
            state.compliance = evaluateCompliance(state.meta);
            updateUI();
          }
        }
      });
    }
  }

  var initialized = false;
  function initYtConverter() {
    if (!initialized) {
      bindEvents();
      renderBlockedChannelsList();
      renderHistory();

      // Auto-select device preset for iPhone / Android / Desktop
      var devLabel = document.getElementById('ytcDetectedDeviceLabel');
      if (isIOSDevice()) {
        if (devLabel) devLabel.textContent = 'iPhone / iOS Detected';
        applyDevicePreset('iphone_photos');
      } else if (isAndroidDevice()) {
        if (devLabel) devLabel.textContent = 'Android Detected';
        applyDevicePreset('android_gallery');
      } else {
        if (devLabel) devLabel.textContent = 'Desktop / Mobile Ready';
        applyDevicePreset('desktop_4k');
      }

      discoverBackendBase();
      initialized = true;
    }
    updateUI();
  }

  window.YtConverterStudio = {
    state: state,
    init: initYtConverter,
    analyzeUrl: analyzeUrl,
    applyDevicePreset: applyDevicePreset,
    evaluateCompliance: evaluateCompliance
  };

})(window, document);
