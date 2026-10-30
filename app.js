/* ============================================
   WIPE LAYER GENERATOR — APPLICATION LOGIC
   Alight Motion XML Export · Full-Screen Wipe Masking
   ============================================ */

(() => {
  'use strict';

  // Alight Motion can round independently scaled, fractional-pixel shapes in a
  // way that reveals the transparent canvas between two edge-to-edge tiles.
  // Expand each mask tile by this amount on every edge so adjacent tiles overlap.
  const MASK_SEAM_OVERSCAN_PX = 2;
  // The same rounding issue applies to the normalized ranges used by the Wipe
  // effect. This is converted to a fraction of the solid for each axis.
  const WIPE_SEAM_OVERSCAN_PX = 2;

  // ---- State ----
  const state = {
    baseWidth: 1080,
    baseHeight: 1350,
    projectWidth: 1080,
    projectHeight: 1350,
    solidWidth: 1080,
    solidHeight: 1350,
    splitDirection: 'horizontal',
    wipeMethod: 'mask', // 'wipe' or 'mask' (Masking Mode enabled)
    autoFixPivot: true, // Auto-fix flip pivot per slice in Wipe mode (vertical split, axis 0)
    maskEmbedScene: true, // Group in <embedScene> matching Project Name 294
    videoLayer: false,
    videoUri: 'am-internal:///4BA32805414BE561BE374FA7D5B88C4BF8261057.MP4',
    videoDurationMs: 10450,
    solidColor: '#64E4DC',
    wipeAngle: 0,
    wipeSoftness: 0,
    aspectLocked: true,
    loop: true,
    projectDurationStr: '00:05:00',
    fps: 60,
    beat1Str: '00:00:00',
    beat2Str: '00:02:00',
    beat3Str: '00:04:00',
    sectionCount: 1,
    sections: [
      { 
        subSectionCount: 1,
        moveEnabled: false,
        moveMode: 'preset',
        movePreset: 'left',
        moveTransitionType: 'in',
        moveDistance: 1080,
        moveStartX: 0,
        moveStartY: 675,
        moveEndX: 540,
        moveEndY: 675,
        moveCustomEasing: false,
        moveEasing: '0.345870, 0.0, 0.188790, 1.0',
        subSections: [
          {
            layerCount: 5,
            splitDirection: 'global',
            customPivot: false,
            pivotX: 0,
            pivotY: 0,
            animOrder: 'topDown', 
            startAngle: 0, 
            endAngle: 90, 
            axis: 0, 
            cubeXStart: 0,
            cubeXEnd: 0,
            cubeYStart: 0,
            cubeYEnd: 0,
            cubeZStart: 0,
            cubeZEnd: 0,
            boxv2XStart: 0,
            boxv2XEnd: 0,
            boxv2YStart: 0,
            boxv2YEnd: 90,
            boxv2ZStart: 0,
            boxv2ZEnd: 0,
            customEasing: false, 
            easing: '0.25, 0.10, 0.25, 1.00',
            customTiming: false,
            beat1Str: '00:00:00',
            beat2Str: '00:02:00',
            beat3Str: '00:04:00'
          }
        ]
      }
    ],
    animType: 'flip', // 'none', 'flip', 'cube', 'box', 'boxv2', 'hollowbox'
    flipPivotX: 0,
    flipPivotY: 0,
    boxv2: {
      startX: 0,
      startY: 0,
      startZ: 0,
      endX: 0,
      endY: 90,
      endZ: 0,
      rotStartX: 0,
      rotStartY: 0,
      rotStartZ: 0,
      rotEndX: 0,
      rotEndY: 90,
      rotEndZ: 0,
      layerScale: 2.40, // 450x561.7 * 2.40 = 1080x1350 (Notes for Box method.txt)
      boxHeight: 1.00,  // Project Name 314.xml: <property name="height" type="float" value="1.000000"/>
      boxScale: 1.33,   // Project Name 314.xml: <property name="scale" type="float" value="1.330000"/>
      shadingType: 0,   // Project Name 314.xml: <property name="shadingType" type="int" value="0"/>
      stretchAngle: 90.0, // Project Name 314.xml: <property name="angle" type="float" value="90.000000"/>
      stretchScale: 1.25, // Project Name 314.xml: <property name="scale" type="float" value="1.250000"/>
    },
    box: {
      orientAllStartStr: '00:00:00',
      orientFirstEndStr: '00:02:00',
      orientLastEndStr: '00:04:00',
      orientStartX: 0,
      orientStartY: 0,
      orientStartZ: 0,
      orientEndX: 0,
      orientEndY: 180,
      orientEndZ: 0,
      rotateAllStartStr: '00:01:00',
      rotateFirstEndStr: '00:03:00',
      rotateLastEndStr: '00:05:00',
      rotateStartX: 0,
      rotateStartY: 0,
      rotateStartZ: 0,
      rotateEndX: 0,
      rotateEndY: 180,
      rotateEndZ: 0,
      depth: 0.01,
      scale: 3.51,
      orientEasing: '0.25, 0.10, 0.25, 1.00',
      rotateEasing: '0.25, 0.10, 0.25, 1.00',
    },
    hollowbox: {
      allStartStr: '00:00:00',
      firstEndStr: '00:02:00',
      lastEndStr: '00:04:00',
      posStartX: 0,
      posStartY: 0,
      posStartZ: 0,
      posEndX: 0,
      posEndY: 100,
      posEndZ: -25,
      posEasing: '0.25, 0.10, 0.25, 1.00',
      orientStartX: 0,
      orientStartY: 0,
      orientStartZ: 0,
      orientEndX: 0,
      orientEndY: 180,
      orientEndZ: 0,
      orientEasing: '0.25, 0.10, 0.25, 1.00',
      rotateStartX: 0,
      rotateStartY: 0,
      rotateStartZ: 0,
      rotateEndX: 0,
      rotateEndY: 180,
      rotateEndZ: 0,
      rotateEasing: '0.25, 0.10, 0.25, 1.00',
      widthStart: 1.0,
      widthEnd: 1.0,
      heightStart: 1.0,
      heightEnd: 1.0,
      geomEasing: '0.25, 0.10, 0.25, 1.00',
      depth: 0.01,
      scale: 1.0,
      shadingType: 0,
      stretchMode: 'auto', // 'auto', 'horizontal', 'vertical', 'manual'
      manualAngle: 90,
      manualScale: 3.0,
    },
    flipEasing: '0.79, 0.00, 0.59, 1.00',
    isPlaying: false,
    currentTimeSec: 0,
  };

  // ---- DOM References ----
  const $ = (sel) => document.querySelector(sel);
  const canvas = $('#previewCanvas');
  const ctx = canvas.getContext('2d');

  // Controls
  const wipeMethodToggleGroup = $('#wipeMethodToggle');
  const maskingOptions = $('#maskingOptions');
  const wipeOptions = $('#wipeOptions');
  const boxV2Options = $('#boxV2Options');
  const boxV2FormulaBadge = $('#boxV2FormulaBadge');
  const boxv2Preset240 = $('#boxv2Preset240');
  const boxv2Preset100 = $('#boxv2Preset100');
  const boxv2StartXInput = $('#boxv2StartX');
  const boxv2StartYInput = $('#boxv2StartY');
  const boxv2StartZInput = $('#boxv2StartZ');
  const boxv2EndXInput = $('#boxv2EndX');
  const boxv2EndYInput = $('#boxv2EndY');
  const boxv2EndZInput = $('#boxv2EndZ');
  const boxv2LayerScaleInput = $('#boxv2LayerScale');
  const boxv2BoxScaleInput = $('#boxv2BoxScale');
  const boxv2BoxHeightInput = $('#boxv2BoxHeight');
  const boxv2StretchAngleInput = $('#boxv2StretchAngle');
  const boxv2StretchScaleInput = $('#boxv2StretchScale');
  const wipeAutoFixPivotToggle = $('#wipeAutoFixPivotToggle');
  const autoFixPivotToggle = $('#autoFixPivotToggle');
  const preset45Fit = $('#preset45Fit');
  const preset45Full = $('#preset45Full');
  const maskGroupToggle = $('#maskGroupToggle');
  const slicingBadge = $('#slicingBadge');
  const hudSlice = $('#hudSlice');
  const thCol4 = $('#thCol4');
  const thCol5 = $('#thCol5');
  const thCol6 = $('#thCol6');
  const splitDirectionGroup = $('#splitDirection');
  const videoLayerToggle = $('#videoLayerToggle');
  const videoLayerControls = $('#videoLayerControls');
  const videoUriInput = $('#videoUri');
  const videoDurationInput = $('#videoDurationMs');
  const projectScaleSelect = $('#projectScale');
  const solidWidthInput = $('#solidWidth');
  const solidHeightInput = $('#solidHeight');
  const aspectLinkBtn = $('#aspectLinkBtn');
  const aspectHint = $('#aspectHint');
  const solidColorInput = $('#solidColor');
  const colorValueSpan = $('#colorValue');
  const wipeAngleInput = $('#wipeAngle');
  const wipeAngleValue = $('#wipeAngleValue');
  const wipeSoftnessInput = $('#wipeSoftness');
  const wipeSoftnessValue = $('#wipeSoftnessValue');

  // Animation & Timing
  const projectDurationInput = $('#projectDuration');
  const projectFpsInput = $('#projectFps');
  const globalTimingControls = $('#globalTimingControls');
  const beat1Input = $('#beat1');
  const beat2Input = $('#beat2');
  const beat3Input = $('#beat3');
  const animTypeToggleGroup = $('#animTypeToggle');
  const flipPivotXInput = $('#flipPivotX');
  const flipPivotYInput = $('#flipPivotY');

  // Box Controls
  const boxEffectControls = $('#boxEffectControls');
  const boxOrientAllStartInput = $('#boxOrientAllStart');
  const boxOrientFirstEndInput = $('#boxOrientFirstEnd');
  const boxOrientLastEndInput = $('#boxOrientLastEnd');
  const boxOrientStartXInput = $('#boxOrientStartX');
  const boxOrientStartYInput = $('#boxOrientStartY');
  const boxOrientStartZInput = $('#boxOrientStartZ');
  const boxOrientEndXInput = $('#boxOrientEndX');
  const boxOrientEndYInput = $('#boxOrientEndY');
  const boxOrientEndZInput = $('#boxOrientEndZ');
  const boxRotateAllStartInput = $('#boxRotateAllStart');
  const boxRotateFirstEndInput = $('#boxRotateFirstEnd');
  const boxRotateLastEndInput = $('#boxRotateLastEnd');
  const boxRotateStartXInput = $('#boxRotateStartX');
  const boxRotateStartYInput = $('#boxRotateStartY');
  const boxRotateStartZInput = $('#boxRotateStartZ');
  const boxRotateEndXInput = $('#boxRotateEndX');
  const boxRotateEndYInput = $('#boxRotateEndY');
  const boxRotateEndZInput = $('#boxRotateEndZ');
  const boxOrientEasingBtn = $('#boxOrientEasingBtn');
  const boxRotateEasingBtn = $('#boxRotateEasingBtn');

  // Hollow Box Controls (Masking Mode Animation)
  const hollowBoxEffectControls = $('#hollowBoxEffectControls');
  const hbStretchFormulaDisplay = $('#hbStretchFormulaDisplay');
  const hbStretchModeToggle = $('#hbStretchModeToggle');
  const hbManualStretchControls = $('#hbManualStretchControls');
  const hbManualAngleInput = $('#hbManualAngle');
  const hbManualScaleInput = $('#hbManualScale');
  const hbAllStartInput = $('#hbAllStart');
  const hbFirstEndInput = $('#hbFirstEnd');
  const hbLastEndInput = $('#hbLastEnd');
  const hbPosStartXInput = $('#hbPosStartX');
  const hbPosStartYInput = $('#hbPosStartY');
  const hbPosStartZInput = $('#hbPosStartZ');
  const hbPosEndXInput = $('#hbPosEndX');
  const hbPosEndYInput = $('#hbPosEndY');
  const hbPosEndZInput = $('#hbPosEndZ');
  const hbPosEasingBtn = $('#hbPosEasingBtn');
  const hbOrientStartXInput = $('#hbOrientStartX');
  const hbOrientStartYInput = $('#hbOrientStartY');
  const hbOrientStartZInput = $('#hbOrientStartZ');
  const hbOrientEndXInput = $('#hbOrientEndX');
  const hbOrientEndYInput = $('#hbOrientEndY');
  const hbOrientEndZInput = $('#hbOrientEndZ');
  const hbOrientEasingBtn = $('#hbOrientEasingBtn');
  const hbRotateStartXInput = $('#hbRotateStartX');
  const hbRotateStartYInput = $('#hbRotateStartY');
  const hbRotateStartZInput = $('#hbRotateStartZ');
  const hbRotateEndXInput = $('#hbRotateEndX');
  const hbRotateEndYInput = $('#hbRotateEndY');
  const hbRotateEndZInput = $('#hbRotateEndZ');
  const hbRotateEasingBtn = $('#hbRotateEasingBtn');
  const hbWidthStartInput = $('#hbWidthStart');
  const hbWidthEndInput = $('#hbWidthEnd');
  const hbHeightStartInput = $('#hbHeightStart');
  const hbHeightEndInput = $('#hbHeightEnd');
  const hbGeomEasingBtn = $('#hbGeomEasingBtn');
  const hbDepthInput = $('#hbDepth');
  const hbScaleInput = $('#hbScale');
  
  const sectionCountInput = $('#sectionCount');
  const sectionMinusBtn = $('#sectionMinus');
  const sectionPlusBtn = $('#sectionPlus');
  const sectionsContainer = $('#sectionsContainer');
  
  const openGraphBtn = $('#openGraphBtn');
  const closeGraphBtn = $('#closeGraphBtn');
  const graphModal = $('#graphModal');
  const graphIframe = $('#graphIframe');
  const graphIframe2 = $('#graphIframe2');

  // Display
  const wipeXDisplay = $('#wipeXDisplay');
  const wipeYDisplay = $('#wipeYDisplay');
  const previewDimensions = $('#previewDimensions');
  const crosshairLabel = $('#crosshairLabel');
  const formulaContent = $('#formulaContent');
  const xmlCode = $('#xmlCode');
  
  // Playback
  const playBtn = $('#playBtn');
  const playIcon = $('#playIcon');
  const playbackScrubber = $('#playbackScrubber');
  const playbackTimeDisplay = $('#playbackTimeDisplay');

  // Buttons
  const toggleXmlBtn = $('#toggleXmlBtn');
  const copyXmlBtn = $('#copyXmlBtn');
  const downloadXmlBtn = $('#downloadXmlBtn');
  const copySettingsBtn = $('#copySettingsBtn');
  const importSettingsBtn = $('#importSettingsBtn');
  const xmlCodeContainer = $('#xmlCodeContainer');

  // Toast
  const toast = $('#toast');
  const toastMessage = $('#toastMessage');

  // ---- Utility Functions ----
  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  function getLayerColor(index, total, sectionIdx = 0, sCount = 1) {
    const { r, g, b } = hexToRgb(state.solidColor);
    const { h, s, l } = rgbToHsl(r, g, b);
    const range = Math.min(20, 40 / total);
    const offset = (index / Math.max(1, total - 1) - 0.5) * range;
    const newL = Math.max(10, Math.min(90, l + offset));
    
    let newH = h;
    if (sCount > 1) {
      newH = (h + (sectionIdx * (360 / sCount))) % 360;
    }
    
    return `hsl(${newH}, ${s}%, ${newL}%)`;
  }

  function bezierY(t, x1, y1, x2, y2) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    function sampleX(u) { return ((ax * u + bx) * u + cx) * u; }
    function sampleY(u) { return ((ay * u + by) * u + cy) * u; }
    function derivX(u) { return (3 * ax * u + 2 * bx) * u + cx; }
    let u = t;
    for (let i = 0; i < 8; i++) {
      const xErr = sampleX(u) - t;
      if (Math.abs(xErr) < 1e-6) break;
      const d = Math.abs(derivX(u)) < 1e-6 ? 1e-6 : derivX(u);
      u -= xErr / d;
    }
    return sampleY(Math.max(0, Math.min(1, u)));
  }

  function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function eulerToQuaternion(x, y, z) {
    // Convert degrees to radians
    const radX = x * Math.PI / 180;
    const radY = y * Math.PI / 180;
    const radZ = z * Math.PI / 180;

    const cy = Math.cos(radZ * 0.5);
    const sy = Math.sin(radZ * 0.5);
    const cp = Math.cos(radY * 0.5);
    const sp = Math.sin(radY * 0.5);
    const cr = Math.cos(radX * 0.5);
    const sr = Math.sin(radX * 0.5);

    const w = cr * cp * cy + sr * sp * sy;
    const x_q = sr * cp * cy - cr * sp * sy;
    const y_q = cr * sp * cy + sr * cp * sy;
    const z_q = cr * cp * sy - sr * sp * cy;

    return { w, x: x_q, y: y_q, z: z_q };
  }

  function calculateHollowBoxStretch(layer) {
    const projW = state.projectWidth || 1080;
    const projH = state.projectHeight || 1350;

    if (state.hollowbox && state.hollowbox.stretchMode === 'manual') {
      const a = parseFloat(state.hollowbox.manualAngle) || 90.0;
      const s = parseFloat(state.hollowbox.manualScale) || 3.0;
      return {
        angle: a,
        scale: s,
        text: `Manual Override: Angle = ${a.toFixed(1)}° · Scale = ${s.toFixed(3)}x`
      };
    }

    // Determine slice dimensions
    let sliceW = (layer && layer.width) ? layer.width : (projW / Math.max(1, state.sectionCount));
    let sliceH = (layer && layer.height) ? layer.height : projH;

    let angle = 90.0;
    let scale = 3.0;
    let formulaText = '';

    const isHorizontal = state.splitDirection === 'horizontal' || (state.hollowbox && state.hollowbox.stretchMode === 'vertical');
    const isExplicitHorizMode = (state.hollowbox && state.hollowbox.stretchMode === 'horizontal');

    if (isExplicitHorizMode || (!isHorizontal && (!state.hollowbox || state.hollowbox.stretchMode !== 'vertical'))) {
      // Slicing vertically -> stretching horizontally along 90 deg axis
      angle = 90.0;
      scale = sliceW > 0 ? (projW / sliceW) : 1.0;
      formulaText = `Stretch Scale = Proj W (${projW}) ÷ Slice W (${Math.round(sliceW)}) = ${scale.toFixed(3)}x @ 90.0°`;
    } else {
      // Slicing horizontally -> stretching vertically along 0 deg axis
      angle = 0.0;
      scale = sliceH > 0 ? (projH / sliceH) : 1.0;
      formulaText = `Stretch Scale = Proj H (${projH}) ÷ Slice H (${Math.round(sliceH)}) = ${scale.toFixed(3)}x @ 0.0°`;
    }

    return {
      angle: Number(angle.toFixed(4)),
      scale: Number(scale.toFixed(4)),
      text: formulaText
    };
  }

  function escapeXmlAttr(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function parseTimeToSeconds(timeStr) {
    // Format: MM:SS:FF where FF = frame number (0 to fps-1)
    const parts = timeStr.split(':');
    let m = 0, s = 0, f = 0;
    if (parts.length === 3) {
      m = parseInt(parts[0]) || 0;
      s = parseInt(parts[1]) || 0;
      f = parseInt(parts[2]) || 0;
    } else if (parts.length === 2) {
      s = parseInt(parts[0]) || 0;
      f = parseInt(parts[1]) || 0;
    } else {
      s = parseFloat(timeStr) || 0;
      return s;
    }
    return m * 60 + s + (f / state.fps);
  }

  // ---- Layer Calculation ----
  function calculateLayers() {
    const layers = [];
    const sCount = state.sectionCount;

    const globalB1 = parseTimeToSeconds(state.beat1Str);
    const globalB2 = parseTimeToSeconds(state.beat2Str);
    const globalB3 = parseTimeToSeconds(state.beat3Str);

    let globalLayerIndex = 0;

    for (let s = 0; s < sCount; s++) {
      const sec = state.sections[s];
      
      let secXStart = 0, secXEnd = 1, secYStart = 0, secYEnd = 1;
      if (state.splitDirection === 'horizontal') {
        secYStart = s / sCount;
        secYEnd = (s + 1) / sCount;
      } else {
        secXStart = s / sCount;
        secXEnd = (s + 1) / sCount;
      }

      const subCount = sec.subSections ? sec.subSections.length : 1;
      
      for (let sub = 0; sub < subCount; sub++) {
        const subSec = sec.subSections ? sec.subSections[sub] : sec;
        const subLayerCount = subSec.layerCount || 1;
        
        const subPivotX = subSec.customPivot ? (subSec.pivotX !== undefined ? subSec.pivotX : 0) : state.flipPivotX;
        const subPivotY = subSec.customPivot ? (subSec.pivotY !== undefined ? subSec.pivotY : 0) : state.flipPivotY;
        
        let subXStart = secXStart, subXEnd = secXEnd, subYStart = secYStart, subYEnd = secYEnd;
        
        if (state.splitDirection === 'horizontal') {
          const secYRange = secYEnd - secYStart;
          subYStart = secYStart + (sub / subCount) * secYRange;
          subYEnd = secYStart + ((sub + 1) / subCount) * secYRange;
        } else {
          const secXRange = secXEnd - secXStart;
          subXStart = secXStart + (sub / subCount) * secXRange;
          subXEnd = secXStart + ((sub + 1) / subCount) * secXRange;
        }

        const b1 = subSec.customTiming ? parseTimeToSeconds(subSec.beat1Str) : globalB1;
          const b2 = subSec.customTiming ? parseTimeToSeconds(subSec.beat2Str) : globalB2;
          const b3 = subSec.customTiming ? parseTimeToSeconds(subSec.beat3Str) : globalB3;

          const subDir = (subSec.splitDirection && subSec.splitDirection !== 'global') ? subSec.splitDirection : state.splitDirection;

        for (let l = 0; l < subLayerCount; l++) {
          let layerXStart = subXStart, layerXEnd = subXEnd, layerYStart = subYStart, layerYEnd = subYEnd;
          let normStart = 0, normEnd = 1;
          
          if (subDir === 'horizontal') {
            const subYRange = subYEnd - subYStart;
            layerYStart = subYStart + (l / subLayerCount) * subYRange;
            layerYEnd = subYStart + ((l + 1) / subLayerCount) * subYRange;
            normStart = layerYStart;
            normEnd = layerYEnd;
          } else if (subDir === 'vertical') {
            const subXRange = subXEnd - subXStart;
            layerXStart = subXStart + (l / subLayerCount) * subXRange;
            layerXEnd = subXStart + ((l + 1) / subLayerCount) * subXRange;
            normStart = layerXStart;
            normEnd = layerXEnd;
          } else {
            // Diagonal split (diagonal ↗ 45° or diagonal-desc ↘ 135°)
            const secNormStart = s / sCount;
            const secNormEnd = (s + 1) / sCount;
            const secNormRange = secNormEnd - secNormStart;
            const subNormStart = secNormStart + (sub / subCount) * secNormRange;
            const subNormEnd = secNormStart + ((sub + 1) / subCount) * secNormRange;
            const subNormRange = subNormEnd - subNormStart;
            normStart = subNormStart + (l / subLayerCount) * subNormRange;
            normEnd = subNormStart + ((l + 1) / subLayerCount) * subNormRange;
            layerXStart = normStart;
            layerXEnd = normEnd;
            layerYStart = normStart;
            layerYEnd = normEnd;
          }

          let localOrderIdx = l;
          if (subSec.animOrder === 'bottomUp') {
            localOrderIdx = subLayerCount - 1 - l;
          }

          const staggerRatio = (subLayerCount > 1) ? (localOrderIdx / (subLayerCount - 1)) : 0;
          const flipEnd = b2 + (b3 - b2) * staggerRatio;

          const orientAllStart = parseTimeToSeconds(state.box.orientAllStartStr);
          const orientFirstEnd = parseTimeToSeconds(state.box.orientFirstEndStr);
          const orientLastEnd = parseTimeToSeconds(state.box.orientLastEndStr);
          const orientStart = orientAllStart;
          const orientEnd = orientFirstEnd + (orientLastEnd - orientFirstEnd) * staggerRatio;

          const rotateAllStart = parseTimeToSeconds(state.box.rotateAllStartStr);
          const rotateFirstEnd = parseTimeToSeconds(state.box.rotateFirstEndStr);
          const rotateLastEnd = parseTimeToSeconds(state.box.rotateLastEndStr);
          const rotateStart = rotateAllStart;
          const rotateEnd = rotateFirstEnd + (rotateLastEnd - rotateFirstEnd) * staggerRatio;

          const hbAllStart = parseTimeToSeconds(state.hollowbox ? state.hollowbox.allStartStr : '00:00:00');
          const hbFirstEnd = parseTimeToSeconds(state.hollowbox ? state.hollowbox.firstEndStr : '00:02:00');
          const hbLastEnd = parseTimeToSeconds(state.hollowbox ? state.hollowbox.lastEndStr : '00:04:00');
          const hbStart = hbAllStart;
          const hbEnd = hbFirstEnd + (hbLastEnd - hbFirstEnd) * staggerRatio;

          const layerProps = {
            index: globalLayerIndex + 1,
            flipStartT: b1,
            flipEndT: flipEnd,
            orientStartT: orientStart,
            orientEndT: orientEnd,
            rotateStartT: rotateStart,
            rotateEndT: rotateEnd,
            hbStartT: hbStart,
            hbEndT: hbEnd,
            flipStartAngle: subSec.startAngle,
            flipEndAngle: subSec.endAngle,
            flipAxis: subSec.axis,
            cubeXStart: subSec.cubeXStart || 0,
            cubeXEnd: subSec.cubeXEnd || 0,
            cubeYStart: subSec.cubeYStart || 0,
            cubeYEnd: subSec.cubeYEnd || 0,
            cubeZStart: subSec.cubeZStart || 0,
            cubeZEnd: subSec.cubeZEnd || 0,
            boxv2XStart: subSec.boxv2XStart !== undefined ? subSec.boxv2XStart : (state.boxv2 ? state.boxv2.rotStartX : 0),
            boxv2XEnd: subSec.boxv2XEnd !== undefined ? subSec.boxv2XEnd : (state.boxv2 ? state.boxv2.rotEndX : 0),
            boxv2YStart: subSec.boxv2YStart !== undefined ? subSec.boxv2YStart : (state.boxv2 ? state.boxv2.rotStartY : 0),
            boxv2YEnd: subSec.boxv2YEnd !== undefined ? subSec.boxv2YEnd : (state.boxv2 ? state.boxv2.rotEndY : 90),
            boxv2ZStart: subSec.boxv2ZStart !== undefined ? subSec.boxv2ZStart : (state.boxv2 ? state.boxv2.rotStartZ : 0),
            boxv2ZEnd: subSec.boxv2ZEnd !== undefined ? subSec.boxv2ZEnd : (state.boxv2 ? state.boxv2.rotEndZ : 0),
            pivotX: subPivotX,
            pivotY: subPivotY,
            sectionIdx: s,
            subSectionIdx: sub,
            flipEasing: subSec.customEasing ? subSec.easing : state.flipEasing
          };

          if (state.wipeMethod === 'mask') {
            const tileWidth = (layerXEnd - layerXStart) * state.solidWidth;
            const tileHeight = (layerYEnd - layerYStart) * state.solidHeight;
            // For cube animation and locked 4:5 masking slicing, maintain strict 4:5 geometry
            // without edge bloat so aspect ratio does not drift with layer counts (5, 10, 20, 30+).
            const overscan = (state.animType === 'cube' || state.aspectLocked) ? 0 : MASK_SEAM_OVERSCAN_PX;
            const layerWidth = tileWidth + (overscan * 2);
            const layerHeight = tileHeight + (overscan * 2);
            const solidOriginX = (state.projectWidth - state.solidWidth) / 2;
            const solidOriginY = (state.projectHeight - state.solidHeight) / 2;
            const layerLocX = solidOriginX + (layerXStart * state.solidWidth) + (tileWidth / 2);
            const layerLocY = solidOriginY + (layerYStart * state.solidHeight) + (tileHeight / 2);

            Object.assign(layerProps, {
              locX: layerLocX,
              locY: layerLocY,
              width: layerWidth,
              height: layerHeight,
              wipeXStart: 0,
              wipeXEnd: 1,
              wipeYStart: 0,
              wipeYEnd: 1,
            });
          } else { // 'wipe' or 'boxv2' method
            // Determine effective wipe angle
            let effectiveWipeAngle = 0;
            if (subDir === 'diagonal' || state.splitDirection === 'diagonal') {
              effectiveWipeAngle = (state.wipeAngle !== undefined && state.wipeAngle !== 0 && state.wipeAngle !== 90 && state.wipeAngle !== 135)
                ? state.wipeAngle
                : 45;
            } else if (subDir === 'diagonal-desc' || state.splitDirection === 'diagonal-desc') {
              effectiveWipeAngle = (state.wipeAngle !== undefined && state.wipeAngle !== 0 && state.wipeAngle !== 90 && state.wipeAngle !== 45)
                ? state.wipeAngle
                : 135;
            } else if (subDir === 'horizontal') {
              effectiveWipeAngle = 90;
            } else if (subDir === 'vertical') {
              effectiveWipeAngle = 0;
            } else {
              effectiveWipeAngle = (state.wipeAngle !== undefined) ? state.wipeAngle : 0;
            }

            const rad = (effectiveWipeAngle * Math.PI) / 180;
            const cosA = Math.abs(Math.cos(rad));
            const sinA = Math.abs(Math.sin(rad));
            const isBoxV2Mode = (state.wipeMethod === 'boxv2' || state.animType === 'boxv2');
            const rectWidth = isBoxV2Mode ? (1080 * (state.projectWidth / 1080)) : state.solidWidth;
            const rectHeight = isBoxV2Mode ? (1350 * (state.projectHeight / 1350)) : state.solidHeight;
            const projD = rectWidth * cosA + rectHeight * sinA || 1;
            const wipeOverscan = isBoxV2Mode ? 0 : (WIPE_SEAM_OVERSCAN_PX / projD);

            const sliceWipeStart = Math.max(0, normStart - wipeOverscan);
            const sliceWipeEnd = Math.min(1, normEnd + wipeOverscan);

            // Distance from solid center along the angle vector
            const sliceMidNorm = (normStart + normEnd) / 2 - 0.5;
            const sliceMidDist = sliceMidNorm * projD;
            const sliceCenterOffsetX = sliceMidDist * Math.cos(rad);
            const sliceCenterOffsetY = sliceMidDist * Math.sin(rad);

            const isDiag = (effectiveWipeAngle % 90 !== 0);

            // Auto-fix pivot for Wipe mode slices across ANY split direction & ANY section stack:
            // Since the entire solid is centered on screen in Wipe mode, each slice's visible strip
            // has a 2D centroid offset of (sliceCenterOffsetX, sliceCenterOffsetY) from the solid center.
            // Converting this offset to Alight Motion vector shape space (total span 200, from -100 to +100)
            // centers the 3D flip pivot at that slice's own centroid for ANY split direction
            // (vertical, horizontal, diagonal ↗/↘, custom angles) and ANY section count.
            let finalPivotX = subPivotX;
            let finalPivotY = subPivotY;
            if (state.autoFixPivot) {
              const autoPivotX = 200 * (sliceCenterOffsetX / rectWidth);
              const autoPivotY = 200 * (sliceCenterOffsetY / rectHeight);
              finalPivotX = autoPivotX + (subSec.customPivot ? (subSec.pivotX || 0) : state.flipPivotX);
              finalPivotY = autoPivotY + (subSec.customPivot ? (subSec.pivotY || 0) : state.flipPivotY);
              layerProps.autoPivotFixed = true;
            }

            Object.assign(layerProps, {
              locX: state.projectWidth / 2,
              locY: state.projectHeight / 2,
              width: rectWidth,
              height: rectHeight,
              pivotX: finalPivotX,
              pivotY: finalPivotY,
              wipeAngle: effectiveWipeAngle,
              wipeStart: sliceWipeStart,
              wipeEnd: sliceWipeEnd,
              wipeXStart: (!isDiag && effectiveWipeAngle === 0) ? sliceWipeStart : 0,
              wipeXEnd: (!isDiag && effectiveWipeAngle === 0) ? sliceWipeEnd : 1,
              wipeYStart: (!isDiag && effectiveWipeAngle === 90) ? sliceWipeStart : 0,
              wipeYEnd: (!isDiag && effectiveWipeAngle === 90) ? sliceWipeEnd : 1,
              isDiagonal: isDiag,
              projSpanD: projD,
              bandWidth: projD * (normEnd - normStart),
              sliceCenterX: (state.projectWidth / 2) + sliceCenterOffsetX,
              sliceCenterY: (state.projectHeight / 2) + sliceCenterOffsetY,
              sliceCenterOffsetX: sliceCenterOffsetX,
              sliceCenterOffsetY: sliceCenterOffsetY,
            });
          }

          // Move & Transform Transition Calculation
          const baseX = layerProps.locX;
          const baseY = layerProps.locY;
          const moveEnabled = !!sec.moveEnabled;
          let moveStartX = baseX;
          let moveStartY = baseY;
          let moveEndX = baseX;
          let moveEndY = baseY;

          if (moveEnabled) {
            const moveMode = sec.moveMode || 'preset';
            if (moveMode === 'preset') {
              const preset = sec.movePreset || 'left';
              const flow = sec.moveTransitionType || 'in';
              const defaultDist = (preset === 'up' || preset === 'down') ? state.projectHeight : state.projectWidth;
              const dist = (sec.moveDistance !== undefined && !isNaN(sec.moveDistance)) ? parseFloat(sec.moveDistance) : defaultDist;

              if (preset === 'left') {
                if (flow === 'in') {
                  moveStartX = baseX - dist;
                  moveStartY = baseY;
                  moveEndX = baseX;
                  moveEndY = baseY;
                } else {
                  moveStartX = baseX;
                  moveStartY = baseY;
                  moveEndX = baseX - dist;
                  moveEndY = baseY;
                }
              } else if (preset === 'right') {
                if (flow === 'in') {
                  moveStartX = baseX + dist;
                  moveStartY = baseY;
                  moveEndX = baseX;
                  moveEndY = baseY;
                } else {
                  moveStartX = baseX;
                  moveStartY = baseY;
                  moveEndX = baseX + dist;
                  moveEndY = baseY;
                }
              } else if (preset === 'up') {
                if (flow === 'in') {
                  moveStartX = baseX;
                  moveStartY = baseY - dist;
                  moveEndX = baseX;
                  moveEndY = baseY;
                } else {
                  moveStartX = baseX;
                  moveStartY = baseY;
                  moveEndX = baseX;
                  moveEndY = baseY - dist;
                }
              } else if (preset === 'down') {
                if (flow === 'in') {
                  moveStartX = baseX;
                  moveStartY = baseY + dist;
                  moveEndX = baseX;
                  moveEndY = baseY;
                } else {
                  moveStartX = baseX;
                  moveStartY = baseY;
                  moveEndX = baseX;
                  moveEndY = baseY + dist;
                }
              }
            } else { // 'coords' mode
              const customSX = (sec.moveStartX !== undefined && !isNaN(sec.moveStartX)) ? parseFloat(sec.moveStartX) : (state.projectWidth / 2);
              const customSY = (sec.moveStartY !== undefined && !isNaN(sec.moveStartY)) ? parseFloat(sec.moveStartY) : (state.projectHeight / 2);
              const customEX = (sec.moveEndX !== undefined && !isNaN(sec.moveEndX)) ? parseFloat(sec.moveEndX) : (state.projectWidth / 2);
              const customEY = (sec.moveEndY !== undefined && !isNaN(sec.moveEndY)) ? parseFloat(sec.moveEndY) : (state.projectHeight / 2);

              if (state.wipeMethod === 'wipe' || state.wipeMethod === 'boxv2') {
                moveStartX = customSX;
                moveStartY = customSY;
                moveEndX = customEX;
                moveEndY = customEY;
              } else {
                const centerX = state.projectWidth / 2;
                const centerY = state.projectHeight / 2;
                moveStartX = baseX + (customSX - centerX);
                moveStartY = baseY + (customSY - centerY);
                moveEndX = baseX + (customEX - centerX);
                moveEndY = baseY + (customEY - centerY);
              }
            }
          }

          Object.assign(layerProps, {
            moveEnabled,
            moveStartX,
            moveStartY,
            moveEndX,
            moveEndY,
            moveEasing: sec.moveCustomEasing ? (sec.moveEasing || '0.345870, 0.0, 0.188790, 1.0') : state.flipEasing
          });

          layers.push(layerProps);
          
          globalLayerIndex++;
        }
      }
    }
    return layers;
  }

  // ---- Canvas Rendering ----
  function renderPreview(timeSec = state.currentTimeSec) {
    const container = $('#canvasContainer');
    const cW = (container && container.clientWidth) ? container.clientWidth : 400;
    const cH = (container && container.clientHeight) ? container.clientHeight : 400;
    const maxW = Math.max(cW - 48, 180);
    const maxH = Math.max(cH - 48, 180);

    const ratio = (state.projectWidth && state.projectHeight) ? (state.projectWidth / state.projectHeight) : (4 / 5);
    let drawW, drawH;
    if (maxW / maxH > ratio) {
      drawH = Math.min(maxH, 500);
      drawW = drawH * ratio;
    } else {
      drawW = Math.min(maxW, 400);
      drawH = drawW / ratio;
    }

    canvas.style.width = drawW + 'px';
    canvas.style.height = drawH + 'px';

    const dpr = window.devicePixelRatio || 1;
    canvas.width = drawW * dpr;
    canvas.height = drawH * dpr;
    ctx.scale(dpr, dpr);

    const scaleF = drawW / state.projectWidth;
    const layers = calculateLayers();

    // Clear
    ctx.clearRect(0, 0, drawW, drawH);

    // Draw each layer
    layers.forEach((layer, idx) => {
      ctx.save();

      let eased = 0;
      const isBoxV2Active = (state.wipeMethod === 'boxv2' || state.animType === 'boxv2');
      if ((state.animType === 'flip' || state.animType === 'cube' || isBoxV2Active) && timeSec > layer.flipStartT) {
        if (timeSec >= layer.flipEndT) {
          eased = 1;
        } else {
          const progress = (timeSec - layer.flipStartT) / (layer.flipEndT - layer.flipStartT);
          const [x1, y1, x2, y2] = layer.flipEasing.split(',').map(Number);
          eased = bezierY(progress, x1, y1, x2, y2);
        }
      }

      let flipAngle = layer.flipStartAngle + (layer.flipEndAngle - layer.flipStartAngle) * eased;
      let cubeRotX = layer.cubeXStart + (layer.cubeXEnd - layer.cubeXStart) * eased;
      let cubeRotY = layer.cubeYStart + (layer.cubeYEnd - layer.cubeYStart) * eased;
      let cubeRotZ = layer.cubeZStart + (layer.cubeZEnd - layer.cubeZStart) * eased;
      let boxv2RotX = layer.boxv2XStart + (layer.boxv2XEnd - layer.boxv2XStart) * eased;
      let boxv2RotY = layer.boxv2YStart + (layer.boxv2YEnd - layer.boxv2YStart) * eased;
      let boxv2RotZ = layer.boxv2ZStart + (layer.boxv2ZEnd - layer.boxv2ZStart) * eased;

      let moveEased = 0;
      if (layer.moveEnabled && timeSec > layer.flipStartT) {
        if (timeSec >= layer.flipEndT) {
          moveEased = 1;
        } else {
          const progress = (timeSec - layer.flipStartT) / (layer.flipEndT - layer.flipStartT);
          const [mx1, my1, mx2, my2] = layer.moveEasing.replace(/,/g, ' ').trim().split(/\s+/).map(Number);
          moveEased = bezierY(progress, mx1, my1, mx2, my2);
        }
      }

      let currentLocX = layer.locX;
      let currentLocY = layer.locY;
      if (layer.moveEnabled) {
        currentLocX = layer.moveStartX + (layer.moveEndX - layer.moveStartX) * moveEased;
        currentLocY = layer.moveStartY + (layer.moveEndY - layer.moveStartY) * moveEased;
      }

      const layerW = layer.width * scaleF;
      const layerH = layer.height * scaleF;
      const layerLeft = (currentLocX * scaleF) - (layerW / 2);
      const layerTop = (currentLocY * scaleF) - (layerH / 2);

      // --- 3D FLIP/CUBE/BOX V2 EMULATION ---
      if (state.animType === 'flip' || state.animType === 'cube' || state.animType === 'box' || state.animType === 'hollowbox' || isBoxV2Active) {
        // The Cube & Box V2 effects always rotate around the layer's center,
        // so ignore the flip pivot for the cube/boxv2 preview.
        const normPivotX = (state.animType === 'cube' || state.animType === 'hollowbox' || isBoxV2Active) ? 0.5 : (layer.pivotX / 200) + 0.5;
        const normPivotY = (state.animType === 'cube' || state.animType === 'hollowbox' || isBoxV2Active) ? 0.5 : (layer.pivotY / 200) + 0.5;
        const px = layerLeft + (normPivotX * layerW);
        const py = layerTop + (normPivotY * layerH);
        
        ctx.translate(px, py);
        
        if (isBoxV2Active) {
          const rx = (boxv2RotX * Math.PI) / 180;
          const ry = (boxv2RotY * Math.PI) / 180;
          const rz = (boxv2RotZ * Math.PI) / 180;
          const cx = Math.cos(rx), sx = Math.sin(rx);
          const cy = Math.cos(ry), sy = Math.sin(ry);
          const cz = Math.cos(rz), sz = Math.sin(rz);
          const m00 = cz * cy;
          const m10 = sz * cy;
          const m01 = cz * sy * sx - sz * cx;
          const m11 = sz * sy * sx + cz * cx;
          ctx.transform(m00, m10, m01, m11, 0, 0);
        } else if (state.animType === 'flip') {
          const axisRad = (layer.flipAxis * Math.PI) / 180;
          ctx.rotate(-axisRad);
          const flipRad = (flipAngle * Math.PI) / 180;
          ctx.scale(Math.cos(flipRad), 1);
          ctx.rotate(axisRad);
        } else if (state.animType === 'cube') {
          // True 3D rotation projected orthographically onto the canvas:
          //   X = tilt up/down (foreshortens vertically)
          //   Y = turn left/right (foreshortens horizontally)
          //   Z = spin on the 2D plane
          // Canvas space: +x right, +y down, +z into the screen.
          const rx = (cubeRotX * Math.PI) / 180;
          const ry = (cubeRotY * Math.PI) / 180;
          const rz = (cubeRotZ * Math.PI) / 180;
          const cx = Math.cos(rx), sx = Math.sin(rx);
          const cy = Math.cos(ry), sy = Math.sin(ry);
          const cz = Math.cos(rz), sz = Math.sin(rz);
          // M = Rz * Ry * Rx. The face lies on z = 0, so only the first two
          // columns (images of the x and y unit vectors) matter.
          // Column for unit X:
          const m00 = cz * cy;
          const m10 = sz * cy;
          // Column for unit Y:
          const m01 = cz * sy * sx - sz * cx;
          const m11 = sz * sy * sx + cz * cx;
          ctx.transform(m00, m10, m01, m11, 0, 0);
        } else if (state.animType === 'box') {
            // Orientation progress
            let orientEased = 0;
            const orientStartT = layer.orientStartT;
            const orientEndT = layer.orientEndT;
            if (timeSec > orientStartT && orientEndT > orientStartT) {
                if (timeSec >= orientEndT) {
                    orientEased = 1;
                } else {
                    const progress = (timeSec - orientStartT) / (orientEndT - orientStartT);
                    const [x1, y1, x2, y2] = state.box.orientEasing.split(',').map(Number);
                    orientEased = bezierY(progress, x1, y1, x2, y2);
                }
            }

            // Rotation progress
            let rotateEased = 0;
            const rotateStartT = layer.rotateStartT;
            const rotateEndT = layer.rotateEndT;
            if (timeSec > rotateStartT && rotateEndT > rotateStartT) {
                if (timeSec >= rotateEndT) {
                    rotateEased = 1;
                } else {
                    const progress = (timeSec - rotateStartT) / (rotateEndT - rotateStartT);
                    const [x1, y1, x2, y2] = state.box.rotateEasing.split(',').map(Number);
                    rotateEased = bezierY(progress, x1, y1, x2, y2);
                }
            }

            // Interpolate angles
            const orientRotX = state.box.orientStartX + (state.box.orientEndX - state.box.orientStartX) * orientEased;
            const orientRotY = state.box.orientStartY + (state.box.orientEndY - state.box.orientStartY) * orientEased;
            
            const rotateRotX = state.box.rotateStartX + (state.box.rotateEndX - state.box.rotateStartX) * rotateEased;
            const rotateRotY = state.box.rotateStartY + (state.box.rotateEndY - state.box.rotateStartY) * rotateEased;

            // Combine rotations for 2D preview (simplification)
            const combinedRotX = orientRotX + rotateRotX;
            const combinedRotY = orientRotY + rotateRotY;

            // Apply transformation (similar to cube)
            const radX = (combinedRotX * Math.PI) / 180;
            const radY = (combinedRotY * Math.PI) / 180;
            ctx.scale(Math.cos(radY), Math.cos(radX));
        } else if (state.animType === 'hollowbox') {
            let hbEased = 0;
            const hbStartT = layer.hbStartT !== undefined ? layer.hbStartT : 0;
            const hbEndT = layer.hbEndT !== undefined ? layer.hbEndT : 1;
            if (timeSec > hbStartT && hbEndT > hbStartT) {
              if (timeSec >= hbEndT) {
                hbEased = 1;
              } else {
                const progress = (timeSec - hbStartT) / (hbEndT - hbStartT);
                const [x1, y1, x2, y2] = (state.hollowbox.orientEasing || '0.25, 0.10, 0.25, 1.00').split(',').map(Number);
                hbEased = bezierY(progress, x1, y1, x2, y2);
              }
            }

            // Orient + Rotate
            const orientRotX = state.hollowbox.orientStartX + (state.hollowbox.orientEndX - state.hollowbox.orientStartX) * hbEased;
            const orientRotY = state.hollowbox.orientStartY + (state.hollowbox.orientEndY - state.hollowbox.orientStartY) * hbEased;
            const rotateRotX = state.hollowbox.rotateStartX + (state.hollowbox.rotateEndX - state.hollowbox.rotateStartX) * hbEased;
            const rotateRotY = state.hollowbox.rotateStartY + (state.hollowbox.rotateEndY - state.hollowbox.rotateStartY) * hbEased;

            const combinedRotX = orientRotX + rotateRotX;
            const combinedRotY = orientRotY + rotateRotY;
            const radX = (combinedRotX * Math.PI) / 180;
            const radY = (combinedRotY * Math.PI) / 180;

            // Width and Height tween scale factors
            const wScale = state.hollowbox.widthStart + (state.hollowbox.widthEnd - state.hollowbox.widthStart) * hbEased;
            const hScale = state.hollowbox.heightStart + (state.hollowbox.heightEnd - state.hollowbox.heightStart) * hbEased;

            // Position offset
            const posX = (state.hollowbox.posStartX + (state.hollowbox.posEndX - state.hollowbox.posStartX) * hbEased) * scaleF;
            const posY = (state.hollowbox.posStartY + (state.hollowbox.posEndY - state.hollowbox.posStartY) * hbEased) * scaleF;

            ctx.translate(posX, posY);
            ctx.scale(Math.cos(radY) * wScale, Math.cos(radX) * hScale);
        }
        
        ctx.translate(-px, -py);
      }

      if (state.wipeMethod === 'wipe' || state.wipeMethod === 'boxv2') {
        const solidW = state.solidWidth * scaleF;
        const solidH = state.solidHeight * scaleF;
        const solidLeft = (currentLocX * scaleF) - (solidW / 2);
        const solidTop = (currentLocY * scaleF) - (solidH / 2);
        const cx = currentLocX * scaleF;
        const cy = currentLocY * scaleF;

        const angle = layer.wipeAngle !== undefined ? layer.wipeAngle : (state.splitDirection === 'horizontal' ? 90 : 0);
        const thetaRad = (angle * Math.PI) / 180;
        const startVal = layer.wipeStart !== undefined ? layer.wipeStart : (angle === 90 ? layer.wipeYStart : layer.wipeXStart);
        const endVal = layer.wipeEnd !== undefined ? layer.wipeEnd : (angle === 90 ? layer.wipeYEnd : layer.wipeXEnd);

        const cosA = Math.abs(Math.cos(thetaRad));
        const sinA = Math.abs(Math.sin(thetaRad));
        const projD = solidW * cosA + solidH * sinA || 1;

        const d1 = (startVal - 0.5) * projD;
        const d2 = (endVal - 0.5) * projD;
        const R = Math.hypot(solidW, solidH) * 1.5;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(thetaRad);
        ctx.beginPath();
        ctx.rect(d1, -R, Math.max(0.1, d2 - d1), R * 2);
        ctx.clip();
        ctx.rotate(-thetaRad);
        ctx.translate(-cx, -cy);

        ctx.fillStyle = getLayerColor(idx, layers.length, layer.sectionIdx, state.sectionCount);
        ctx.fillRect(solidLeft, solidTop, solidW, solidH);

        const midD = (d1 + d2) / 2;
        const labelX = cx + midD * Math.cos(thetaRad);
        const labelY = cy + midD * Math.sin(thetaRad);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.font = `${Math.max(9, 12 * scaleF * 3)}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`C${layer.index}`, labelX, labelY);

        ctx.restore();

      } else { // 'mask' method
        ctx.fillStyle = getLayerColor(idx, layers.length, layer.sectionIdx, state.sectionCount);
        ctx.fillRect(layerLeft, layerTop, layerW, layerH);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = `${Math.max(9, 12 * scaleF * 3)}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`C${layer.index}`, layerLeft + layerW / 2, layerTop + layerH / 2);
      }

      ctx.restore();
    });

    // Draw grid lines between layers
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    if (state.wipeMethod === 'wipe' || state.wipeMethod === 'boxv2') {
      const solidW = state.solidWidth * scaleF;
      const solidH = state.solidHeight * scaleF;
      const cx = (state.projectWidth / 2) * scaleF;
      const cy = (state.projectHeight / 2) * scaleF;
      const solidLeft = cx - (solidW / 2);
      const solidTop = cy - (solidH / 2);

      // Stroke outer boundary of solid
      ctx.strokeRect(solidLeft, solidTop, solidW, solidH);

      // Stroke cut lines between slices
      const angle = layers[0] && layers[0].wipeAngle !== undefined ? layers[0].wipeAngle : (state.splitDirection === 'horizontal' ? 90 : 0);
      const thetaRad = (angle * Math.PI) / 180;
      const cosA = Math.abs(Math.cos(thetaRad));
      const sinA = Math.abs(Math.sin(thetaRad));
      const projD = solidW * cosA + solidH * sinA || 1;
      const R = Math.hypot(solidW, solidH);

      ctx.save();
      ctx.beginPath();
      ctx.rect(solidLeft, solidTop, solidW, solidH);
      ctx.clip();

      layers.forEach((lyr) => {
        const d = (lyr.wipeStart - 0.5) * projD;
        const px = cx + d * Math.cos(thetaRad);
        const py = cy + d * Math.sin(thetaRad);
        const dx = -R * Math.sin(thetaRad);
        const dy = R * Math.cos(thetaRad);

        ctx.beginPath();
        ctx.moveTo(px - dx, py - dy);
        ctx.lineTo(px + dx, py + dy);
        ctx.stroke();
      });
      ctx.restore();
    } else {
      layers.forEach((layer) => {
        const layerW = layer.width * scaleF;
        const layerH = layer.height * scaleF;
        const layerLeft = (layer.locX * scaleF) - (layerW / 2);
        const layerTop = (layer.locY * scaleF) - (layerH / 2);
        ctx.strokeRect(layerLeft, layerTop, layerW, layerH);
      });
    }

    ctx.setLineDash([]);

    // Draw central crosshair
    const cx = (state.projectWidth / 2) * scaleF;
    const cy = (state.projectHeight / 2) * scaleF;
    const crossSize = 12;

    ctx.strokeStyle = 'rgba(163, 230, 53, 0.85)';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(cx - crossSize, cy);
    ctx.lineTo(cx + crossSize, cy);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, cy - crossSize);
    ctx.lineTo(cx, cy + crossSize);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.stroke();

    // Draw border for canvas
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, drawW - 1, drawH - 1);
  }

  function renderSectionsUI() {
    const container = $('#sectionsContainer');
    let html = '';
    const sCount = state.sectionCount;

    for (let i = 0; i < sCount; i++) {
      const sec = state.sections[i];
      const subCount = sec.subSections ? sec.subSections.length : 1;
      
      html += `
        <div class="section-block" data-index="${i}">
          <div class="section-header">
            <span class="sec-num">S${i + 1}</span>
            Section ${i + 1}
          </div>
          
          <div class="control-group">
            <label>Sub-sections</label>
            <div class="stepper-input">
              <button class="stepper-btn sec-sub-minus">−</button>
              <input type="number" class="sec-sub-count" min="1" max="10" value="${subCount}">
              <button class="stepper-btn sec-sub-plus">+</button>
            </div>
          </div>

          <!-- Move & Transform Transition Switch & Controls -->
          <div class="control-group">
            <label>
              Move &amp; Transform
              <span class="badge">KEYFRAMES</span>
            </label>
            <div class="toggle-group sec-move-toggle">
              <button class="toggle-btn ${sec.moveEnabled ? 'active' : ''}" data-value="on">On</button>
              <button class="toggle-btn ${!sec.moveEnabled ? 'active' : ''}" data-value="off">Off</button>
            </div>
            <div class="control-hint">Animate position coordinates for this section</div>
          </div>

          <div class="sec-move-box" style="display: ${sec.moveEnabled ? 'block' : 'none'};">
            
            <div class="control-group">
              <label>Position Mode</label>
              <div class="toggle-group sec-move-mode-toggle">
                <button class="toggle-btn ${(sec.moveMode || 'preset') === 'preset' ? 'active' : ''}" data-value="preset">Preset Direction</button>
                <button class="toggle-btn ${sec.moveMode === 'coords' ? 'active' : ''}" data-value="coords">Coordinates (X, Y)</button>
              </div>
            </div>

            <div class="sec-move-preset-fields" style="display: ${(sec.moveMode || 'preset') === 'preset' ? 'block' : 'none'};">
              <div class="control-group">
                <label>Direction</label>
                <select class="sec-move-direction-select">
                  <option value="left" ${(sec.movePreset || 'left') === 'left' ? 'selected' : ''}>Left</option>
                  <option value="right" ${sec.movePreset === 'right' ? 'selected' : ''}>Right</option>
                  <option value="up" ${sec.movePreset === 'up' ? 'selected' : ''}>Up (Top)</option>
                  <option value="down" ${sec.movePreset === 'down' ? 'selected' : ''}>Down (Bottom)</option>
                </select>
              </div>

              <div class="control-group">
                <label>Transition Flow</label>
                <select class="sec-move-flow-select">
                  <option value="in" ${(sec.moveTransitionType || 'in') === 'in' ? 'selected' : ''}>Slide In (Enter into place)</option>
                  <option value="out" ${sec.moveTransitionType === 'out' ? 'selected' : ''}>Slide Out (Exit off screen)</option>
                </select>
              </div>

              <div class="control-group">
                <label>Travel Distance</label>
                <div class="input-group">
                  <input type="number" class="sec-move-distance" value="${sec.moveDistance !== undefined ? sec.moveDistance : (sec.movePreset === 'up' || sec.movePreset === 'down' ? state.projectHeight : state.projectWidth)}" step="10">
                  <div class="input-suffix">PX</div>
                </div>
              </div>
            </div>

            <div class="sec-move-coords-fields" style="display: ${sec.moveMode === 'coords' ? 'block' : 'none'};">
              <div class="control-group">
                <label>Start Position (X, Y)</label>
                <div class="solid-size-row">
                  <div class="input-group" style="flex:1">
                    <input type="number" class="sec-move-start-x" value="${sec.moveStartX !== undefined ? sec.moveStartX : 0}" step="1">
                    <div class="input-suffix">X</div>
                  </div>
                  <div class="input-group" style="flex:1">
                    <input type="number" class="sec-move-start-y" value="${sec.moveStartY !== undefined ? sec.moveStartY : (state.projectHeight / 2)}" step="1">
                    <div class="input-suffix">Y</div>
                  </div>
                </div>
              </div>

              <div class="control-group">
                <label>End Position (X, Y)</label>
                <div class="solid-size-row">
                  <div class="input-group" style="flex:1">
                    <input type="number" class="sec-move-end-x" value="${sec.moveEndX !== undefined ? sec.moveEndX : (state.projectWidth / 2)}" step="1">
                    <div class="input-suffix">X</div>
                  </div>
                  <div class="input-group" style="flex:1">
                    <input type="number" class="sec-move-end-y" value="${sec.moveEndY !== undefined ? sec.moveEndY : (state.projectHeight / 2)}" step="1">
                    <div class="input-suffix">Y</div>
                  </div>
                </div>
              </div>

              <div class="control-group">
                <button class="sec-btn-sub sec-move-fill-center-btn" type="button">
                  Snap End to Center (${state.projectWidth / 2}, ${state.projectHeight / 2})
                </button>
              </div>
            </div>

            <div class="control-group" style="margin-top: 12px;">
              <label>Move Easing Curve</label>
              <div class="toggle-group sec-move-easing-toggle">
                <button class="toggle-btn ${sec.moveCustomEasing ? 'active' : ''}" data-value="on">Custom Curve</button>
                <button class="toggle-btn ${!sec.moveCustomEasing ? 'active' : ''}" data-value="off">Global Easing</button>
              </div>
            </div>

            <div class="sec-move-graph-container" style="display: ${sec.moveCustomEasing ? 'block' : 'none'}; margin-top: 8px;">
              <button class="sec-btn-sub sec-move-open-graph-btn" type="button" style="padding: 9px 12px; font-weight: 600; color: var(--text-1);">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
                Edit Section Move Graph
              </button>
              <div style="font-size: 10px; font-family: var(--font-mono); color: var(--text-3); text-align: center; margin-top: 6px;">
                Curve: <span class="sec-move-curve-label" style="color: var(--cyan);">${sec.moveEasing || '0.345870, 0.0, 0.188790, 1.0'}</span>
              </div>
            </div>

          </div>
          
          <div class="sub-sections-container" style="margin-top: 14px; padding-left: 14px; border-left: 2px solid var(--border-subtle);">
      `;

      for (let j = 0; j < subCount; j++) {
        const subSec = sec.subSections ? sec.subSections[j] : sec;
        
        html += `
          <div class="sub-section-block" data-sec-index="${i}" data-sub-index="${j}" style="margin-bottom: 16px;">
            <div class="section-header" style="font-size: 0.75rem; color: var(--text-secondary);">Sub-section ${j + 1}</div>
            
            <div class="control-group">
              <label>Custom Pivot</label>
              <div class="toggle-group sub-pivot-toggle">
                <button class="toggle-btn ${subSec.customPivot ? 'active' : ''}" data-value="on">On</button>
                <button class="toggle-btn ${!subSec.customPivot ? 'active' : ''}" data-value="off">Off</button>
              </div>
            </div>
            
            <div class="sub-pivot-container" style="display: ${subSec.customPivot ? 'block' : 'none'}; margin-top: 10px; padding-bottom: 10px;">
              <div class="control-group">
                <label>Sub-section Pivot</label>
                <div class="solid-size-row">
                  <div class="input-group" style="flex:1">
                    <input type="number" class="sub-pivot-x" value="${subSec.pivotX !== undefined ? subSec.pivotX : 0}" step="1" title="Pivot X">
                    <div class="input-suffix">PX</div>
                  </div>
                  <div class="input-group" style="flex:1">
                    <input type="number" class="sub-pivot-y" value="${subSec.pivotY !== undefined ? subSec.pivotY : 0}" step="1" title="Pivot Y">
                    <div class="input-suffix">PY</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="control-group">
              <label>Layers in Sub-section</label>
              <div class="stepper-input">
                <button class="stepper-btn sub-layer-minus">−</button>
                <input type="number" class="sub-layer-count" min="1" max="50" value="${subSec.layerCount || 5}">
                <button class="stepper-btn sub-layer-plus">+</button>
              </div>
            </div>

            <div class="control-group">
              <label>Split Direction</label>
              <select class="sub-split-direction">
                <option value="global" ${subSec.splitDirection === 'global' ? 'selected' : ''}>Global Default</option>
                <option value="horizontal" ${subSec.splitDirection === 'horizontal' ? 'selected' : ''}>Horizontal (90°)</option>
                <option value="vertical" ${subSec.splitDirection === 'vertical' ? 'selected' : ''}>Vertical (0°)</option>
                <option value="diagonal" ${subSec.splitDirection === 'diagonal' ? 'selected' : ''}>Diagonal ↗ (45°)</option>
                <option value="diagonal-desc" ${subSec.splitDirection === 'diagonal-desc' ? 'selected' : ''}>Diagonal ↘ (135°)</option>
              </select>
            </div>

            <div class="control-group">
              <label>Animation Order</label>
              <select class="sub-anim-order">
                <option value="topDown" ${subSec.animOrder === 'topDown' ? 'selected' : ''}>Top to Bottom</option>
                <option value="bottomUp" ${subSec.animOrder === 'bottomUp' ? 'selected' : ''}>Bottom to Top</option>
              </select>
            </div>

            <div class="control-group anim-flip-only" style="display: ${state.animType === 'flip' ? 'block' : 'none'}">
              <label>Flip Angle Start/End</label>
              <div class="solid-size-row">
                <div class="input-group">
                  <input type="number" class="sub-start-angle" value="${subSec.startAngle}" step="1">
                  <div class="input-suffix">S</div>
                </div>
                <div class="input-group">
                  <input type="number" class="sub-end-angle" value="${subSec.endAngle}" step="1">
                  <div class="input-suffix">E</div>
                </div>
              </div>
            </div>

            <div class="control-group anim-flip-only" style="display: ${state.animType === 'flip' ? 'block' : 'none'}">
              <label>Flip Axis</label>
              <div class="input-group">
                <input type="number" class="sub-axis" value="${subSec.axis}" step="1">
                <div class="input-suffix">AXIS</div>
              </div>
            </div>

            <div class="control-group anim-cube-only" style="display: ${state.animType === 'cube' ? 'block' : 'none'}">
              <label>Cube Rotation X (Up/Down)</label>
              <div class="solid-size-row">
                <div class="input-group">
                  <input type="number" class="sub-cube-x-start" value="${subSec.cubeXStart || 0}" step="1">
                  <div class="input-suffix">S</div>
                </div>
                <div class="input-group">
                  <input type="number" class="sub-cube-x-end" value="${subSec.cubeXEnd || 0}" step="1">
                  <div class="input-suffix">E</div>
                </div>
              </div>
            </div>

            <div class="control-group anim-cube-only" style="display: ${state.animType === 'cube' ? 'block' : 'none'}">
              <label>Cube Rotation Y (Left/Right)</label>
              <div class="solid-size-row">
                <div class="input-group">
                  <input type="number" class="sub-cube-y-start" value="${subSec.cubeYStart || 0}" step="1">
                  <div class="input-suffix">S</div>
                </div>
                <div class="input-group">
                  <input type="number" class="sub-cube-y-end" value="${subSec.cubeYEnd || 0}" step="1">
                  <div class="input-suffix">E</div>
                </div>
              </div>
            </div>

            <div class="control-group anim-cube-only" style="display: ${state.animType === 'cube' ? 'block' : 'none'}">
              <label>Cube Rotation Z (Spin)</label>
              <div class="solid-size-row">
                <div class="input-group">
                  <input type="number" class="sub-cube-z-start" value="${subSec.cubeZStart || 0}" step="1">
                  <div class="input-suffix">S</div>
                </div>
                <div class="input-group">
                  <input type="number" class="sub-cube-z-end" value="${subSec.cubeZEnd || 0}" step="1">
                  <div class="input-suffix">E</div>
                </div>
              </div>
            </div>

            <div class="control-group anim-boxv2-only" style="display: ${(state.wipeMethod === 'boxv2' || state.animType === 'boxv2') ? 'block' : 'none'}">
              <label>Box V2 Rotation X (X Axis)</label>
              <div class="solid-size-row">
                <div class="input-group">
                  <input type="number" class="sub-boxv2-x-start" value="${subSec.boxv2XStart !== undefined ? subSec.boxv2XStart : (state.boxv2 ? state.boxv2.rotStartX : 0)}" step="any">
                  <div class="input-suffix">S</div>
                </div>
                <div class="input-group">
                  <input type="number" class="sub-boxv2-x-end" value="${subSec.boxv2XEnd !== undefined ? subSec.boxv2XEnd : (state.boxv2 ? state.boxv2.rotEndX : 0)}" step="any">
                  <div class="input-suffix">E</div>
                </div>
              </div>
            </div>

            <div class="control-group anim-boxv2-only" style="display: ${(state.wipeMethod === 'boxv2' || state.animType === 'boxv2') ? 'block' : 'none'}">
              <label>Box V2 Rotation Y (Y Axis)</label>
              <div class="solid-size-row">
                <div class="input-group">
                  <input type="number" class="sub-boxv2-y-start" value="${subSec.boxv2YStart !== undefined ? subSec.boxv2YStart : (state.boxv2 ? state.boxv2.rotStartY : 0)}" step="any">
                  <div class="input-suffix">S</div>
                </div>
                <div class="input-group">
                  <input type="number" class="sub-boxv2-y-end" value="${subSec.boxv2YEnd !== undefined ? subSec.boxv2YEnd : (state.boxv2 ? state.boxv2.rotEndY : 90)}" step="any">
                  <div class="input-suffix">E</div>
                </div>
              </div>
            </div>

            <div class="control-group anim-boxv2-only" style="display: ${(state.wipeMethod === 'boxv2' || state.animType === 'boxv2') ? 'block' : 'none'}">
              <label>Box V2 Rotation Z (Z Axis)</label>
              <div class="solid-size-row">
                <div class="input-group">
                  <input type="number" class="sub-boxv2-z-start" value="${subSec.boxv2ZStart !== undefined ? subSec.boxv2ZStart : (state.boxv2 ? state.boxv2.rotStartZ : 0)}" step="any">
                  <div class="input-suffix">S</div>
                </div>
                <div class="input-group">
                  <input type="number" class="sub-boxv2-z-end" value="${subSec.boxv2ZEnd !== undefined ? subSec.boxv2ZEnd : (state.boxv2 ? state.boxv2.rotEndZ : 0)}" step="any">
                  <div class="input-suffix">E</div>
                </div>
              </div>
            </div>

            <div class="control-group">
              <label>Custom Easing</label>
              <div class="toggle-group sub-easing-toggle">
                <button class="toggle-btn ${subSec.customEasing ? 'active' : ''}" data-value="on">On</button>
                <button class="toggle-btn ${!subSec.customEasing ? 'active' : ''}" data-value="off">Off</button>
              </div>
            </div>
            
            <div class="control-group sub-easing-btn-container" style="display: ${subSec.customEasing ? 'block' : 'none'}; margin-top: 10px;">
              <button class="sub-open-graph-btn" style="width:100%; padding: 8px; background: var(--bg-elevated); border: 1px solid var(--border-subtle); color: var(--text-primary); border-radius: var(--radius-sm); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
                Edit Sub-section Easing
              </button>
            </div>

            <div class="control-group" style="margin-top: 16px;">
              <label>Custom Timing</label>
              <div class="toggle-group sub-timing-toggle">
                <button class="toggle-btn ${subSec.customTiming ? 'active' : ''}" data-value="on">On</button>
                <button class="toggle-btn ${!subSec.customTiming ? 'active' : ''}" data-value="off">Off</button>
              </div>
            </div>
            
            <div class="sub-timing-container" style="display: ${subSec.customTiming ? 'block' : 'none'}; margin-top: 10px; padding-left: 10px; border-left: 2px solid var(--border-subtle);">
              <div class="control-group">
                <label>Beat 1 (All Start)</label>
                <input type="text" class="time-input sub-beat1" value="${subSec.beat1Str}" placeholder="MM:SS:FF">
              </div>
              <div class="control-group">
                <label>Beat 2 (First Ends)</label>
                <input type="text" class="time-input sub-beat2" value="${subSec.beat2Str}" placeholder="MM:SS:FF">
              </div>
              <div class="control-group">
                <label>Beat 3 (Last Ends)</label>
                <input type="text" class="time-input sub-beat3" value="${subSec.beat3Str}" placeholder="MM:SS:FF">
              </div>
            </div>
          </div>
        `;
      }
      
      html += `
          </div>
        </div>
      `;
    }
    container.innerHTML = html;

    container.querySelectorAll('.section-block').forEach(block => {
      const secIdx = parseInt(block.dataset.index);
      
      const subInput = block.querySelector('.sec-sub-count');
      
      block.querySelector('.sec-sub-minus').addEventListener('click', () => {
        let val = parseInt(subInput.value) || 1;
        if (val > 1) {
          val--;
          subInput.value = val;
          state.sections[secIdx].subSectionCount = val;
          while (state.sections[secIdx].subSections.length > val) {
            state.sections[secIdx].subSections.pop();
          }
          renderSectionsUI();
          fullUpdate();
        }
      });

      block.querySelector('.sec-sub-plus').addEventListener('click', () => {
        let val = parseInt(subInput.value) || 1;
        if (val < 10) {
          val++;
          subInput.value = val;
          state.sections[secIdx].subSectionCount = val;
          while (state.sections[secIdx].subSections.length < val) {
            const last = state.sections[secIdx].subSections[state.sections[secIdx].subSections.length - 1];
            state.sections[secIdx].subSections.push({ ...last });
          }
          renderSectionsUI();
          fullUpdate();
        }
      });

      subInput.addEventListener('input', (e) => {
        let val = parseInt(e.target.value);
        if (isNaN(val) || val < 1) val = 1;
        if (val > 10) val = 10;
        state.sections[secIdx].subSectionCount = val;
        while (state.sections[secIdx].subSections.length < val) {
          const last = state.sections[secIdx].subSections[state.sections[secIdx].subSections.length - 1];
          state.sections[secIdx].subSections.push({ ...last });
        }
        while (state.sections[secIdx].subSections.length > val) {
          state.sections[secIdx].subSections.pop();
        }
        renderSectionsUI();
        fullUpdate();
      });

      const sec = state.sections[secIdx];

      // Move toggle On/Off
      const moveToggle = block.querySelector('.sec-move-toggle');
      if (moveToggle) {
        moveToggle.addEventListener('click', (e) => {
          const btn = e.target.closest('.toggle-btn');
          if (!btn) return;
          sec.moveEnabled = (btn.dataset.value === 'on');
          if (sec.moveDistance === undefined) {
            sec.moveDistance = (sec.movePreset === 'up' || sec.movePreset === 'down') ? state.projectHeight : state.projectWidth;
          }
          if (sec.moveStartX === undefined) {
            sec.moveStartX = 0;
            sec.moveStartY = state.projectHeight / 2;
            sec.moveEndX = state.projectWidth / 2;
            sec.moveEndY = state.projectHeight / 2;
          }
          renderSectionsUI();
          fullUpdate();
        });
      }

      // Move Mode toggle (preset vs coords)
      const modeToggle = block.querySelector('.sec-move-mode-toggle');
      if (modeToggle) {
        modeToggle.addEventListener('click', (e) => {
          const btn = e.target.closest('.toggle-btn');
          if (!btn) return;
          sec.moveMode = btn.dataset.value;
          renderSectionsUI();
          fullUpdate();
        });
      }

      // Preset direction select
      const dirSelect = block.querySelector('.sec-move-direction-select');
      if (dirSelect) {
        dirSelect.addEventListener('change', (e) => {
          sec.movePreset = e.target.value;
          if (!sec.moveDistanceEdited) {
            sec.moveDistance = (sec.movePreset === 'up' || sec.movePreset === 'down') ? state.projectHeight : state.projectWidth;
            const distInput = block.querySelector('.sec-move-distance');
            if (distInput) distInput.value = sec.moveDistance;
          }
          fullUpdate();
        });
      }

      // Transition Flow select (in vs out)
      const flowSelect = block.querySelector('.sec-move-flow-select');
      if (flowSelect) {
        flowSelect.addEventListener('change', (e) => {
          sec.moveTransitionType = e.target.value;
          fullUpdate();
        });
      }

      // Travel distance input
      const distInput = block.querySelector('.sec-move-distance');
      if (distInput) {
        distInput.addEventListener('input', (e) => {
          sec.moveDistance = parseFloat(e.target.value) || 0;
          sec.moveDistanceEdited = true;
          fullUpdate();
        });
      }

      // Custom coordinate inputs
      const startXInput = block.querySelector('.sec-move-start-x');
      const startYInput = block.querySelector('.sec-move-start-y');
      const endXInput = block.querySelector('.sec-move-end-x');
      const endYInput = block.querySelector('.sec-move-end-y');

      if (startXInput) {
        startXInput.addEventListener('input', (e) => {
          sec.moveStartX = parseFloat(e.target.value) || 0;
          fullUpdate();
        });
      }
      if (startYInput) {
        startYInput.addEventListener('input', (e) => {
          sec.moveStartY = parseFloat(e.target.value) || 0;
          fullUpdate();
        });
      }
      if (endXInput) {
        endXInput.addEventListener('input', (e) => {
          sec.moveEndX = parseFloat(e.target.value) || 0;
          fullUpdate();
        });
      }
      if (endYInput) {
        endYInput.addEventListener('input', (e) => {
          sec.moveEndY = parseFloat(e.target.value) || 0;
          fullUpdate();
        });
      }

      // Snap End to Center button
      const snapCenterBtn = block.querySelector('.sec-move-fill-center-btn');
      if (snapCenterBtn) {
        snapCenterBtn.addEventListener('click', () => {
          sec.moveEndX = state.projectWidth / 2;
          sec.moveEndY = state.projectHeight / 2;
          if (endXInput) endXInput.value = sec.moveEndX;
          if (endYInput) endYInput.value = sec.moveEndY;
          fullUpdate();
        });
      }

      // Move Custom Easing toggle
      const easingToggle = block.querySelector('.sec-move-easing-toggle');
      if (easingToggle) {
        easingToggle.addEventListener('click', (e) => {
          const btn = e.target.closest('.toggle-btn');
          if (!btn) return;
          sec.moveCustomEasing = (btn.dataset.value === 'on');
          if (!sec.moveEasing) sec.moveEasing = '0.345870, 0.0, 0.188790, 1.0';
          renderSectionsUI();
          fullUpdate();
        });
      }

      // Edit Section Move Graph button
      const openMoveGraphBtn = block.querySelector('.sec-move-open-graph-btn');
      if (openMoveGraphBtn) {
        openMoveGraphBtn.addEventListener('click', () => {
          currentEditingTarget = `section-move-${secIdx}`;
          graphIframe.style.display = 'block';
          graphIframe2.style.display = 'none';
          graphModal.style.display = 'flex';
          const ease = sec.moveEasing || '0.345870, 0.0, 0.188790, 1.0';
          const parts = ease.replace(/,/g, ' ').trim().split(/\s+/).map(Number);
          if (parts.length === 4 && graphIframe.contentWindow) {
            try {
              graphIframe.contentWindow.postMessage({
                type: 'SET_BEZIER',
                x1: parts[0], y1: parts[1], x2: parts[2], y2: parts[3]
              }, '*');
            } catch (err) {}
          }
        });
      }
    });

    container.querySelectorAll('.sub-section-block').forEach(block => {
      const secIdx = parseInt(block.dataset.secIndex);
      const subIdx = parseInt(block.dataset.subIndex);
      const subSec = state.sections[secIdx].subSections[subIdx];
      
      const layerInput = block.querySelector('.sub-layer-count');
      
      block.querySelector('.sub-layer-minus').addEventListener('click', () => {
        let val = parseInt(layerInput.value) || 1;
        if (val > 1) {
          val--;
          layerInput.value = val;
          subSec.layerCount = val;
          fullUpdate();
        }
      });

      block.querySelector('.sub-layer-plus').addEventListener('click', () => {
        let val = parseInt(layerInput.value) || 1;
        if (val < 50) {
          val++;
          layerInput.value = val;
          subSec.layerCount = val;
          fullUpdate();
        }
      });

      layerInput.addEventListener('input', (e) => {
        let val = parseInt(e.target.value);
        if (isNaN(val) || val < 1) val = 1;
        if (val > 50) val = 50;
        subSec.layerCount = val;
        fullUpdate();
      });

      block.querySelector('.sub-pivot-toggle').addEventListener('click', (e) => {
        const btn = e.target.closest('.toggle-btn');
        if (!btn) return;
        subSec.customPivot = btn.dataset.value === 'on';
        if (subSec.pivotX === undefined) subSec.pivotX = 0;
        if (subSec.pivotY === undefined) subSec.pivotY = 0;
        renderSectionsUI();
        fullUpdate();
      });

      block.querySelector('.sub-pivot-x').addEventListener('input', (e) => {
        subSec.pivotX = parseFloat(e.target.value) || 0;
        fullUpdate();
      });

      block.querySelector('.sub-pivot-y').addEventListener('input', (e) => {
        subSec.pivotY = parseFloat(e.target.value) || 0;
        fullUpdate();
      });

      block.querySelector('.sub-split-direction').addEventListener('change', (e) => {
        subSec.splitDirection = e.target.value;
        fullUpdate();
      });

      block.querySelector('.sub-anim-order').addEventListener('change', (e) => {
        subSec.animOrder = e.target.value;
        fullUpdate();
      });
      
      block.querySelector('.sub-start-angle').addEventListener('input', (e) => {
        subSec.startAngle = parseFloat(e.target.value) || 0;
        fullUpdate();
      });
      
      block.querySelector('.sub-end-angle').addEventListener('input', (e) => {
        subSec.endAngle = parseFloat(e.target.value) || 0;
        fullUpdate();
      });
      
      block.querySelector('.sub-axis').addEventListener('input', (e) => {
        subSec.axis = parseFloat(e.target.value) || 0;
        fullUpdate();
      });
      
      block.querySelector('.sub-cube-x-start')?.addEventListener('input', (e) => {
        subSec.cubeXStart = parseFloat(e.target.value) || 0;
        fullUpdate();
      });
      
      block.querySelector('.sub-cube-x-end')?.addEventListener('input', (e) => {
        subSec.cubeXEnd = parseFloat(e.target.value) || 0;
        fullUpdate();
      });
      
      block.querySelector('.sub-cube-y-start')?.addEventListener('input', (e) => {
        subSec.cubeYStart = parseFloat(e.target.value) || 0;
        fullUpdate();
      });
      
      block.querySelector('.sub-cube-y-end')?.addEventListener('input', (e) => {
        subSec.cubeYEnd = parseFloat(e.target.value) || 0;
        fullUpdate();
      });
      
      block.querySelector('.sub-cube-z-start')?.addEventListener('input', (e) => {
        subSec.cubeZStart = parseFloat(e.target.value) || 0;
        fullUpdate();
      });
      
      block.querySelector('.sub-cube-z-end')?.addEventListener('input', (e) => {
        subSec.cubeZEnd = parseFloat(e.target.value) || 0;
        fullUpdate();
      });

      block.querySelector('.sub-boxv2-x-start')?.addEventListener('input', (e) => {
        subSec.boxv2XStart = parseFloat(e.target.value) || 0;
        if (secIdx === 0 && subIdx === 0 && state.boxv2) {
          state.boxv2.rotStartX = subSec.boxv2XStart;
          state.boxv2.startX = subSec.boxv2XStart;
          if (boxv2StartXInput) boxv2StartXInput.value = subSec.boxv2XStart;
        }
        fullUpdate();
      });

      block.querySelector('.sub-boxv2-x-end')?.addEventListener('input', (e) => {
        subSec.boxv2XEnd = parseFloat(e.target.value) || 0;
        if (secIdx === 0 && subIdx === 0 && state.boxv2) {
          state.boxv2.rotEndX = subSec.boxv2XEnd;
          state.boxv2.endX = subSec.boxv2XEnd;
          if (boxv2EndXInput) boxv2EndXInput.value = subSec.boxv2XEnd;
        }
        fullUpdate();
      });

      block.querySelector('.sub-boxv2-y-start')?.addEventListener('input', (e) => {
        subSec.boxv2YStart = parseFloat(e.target.value) || 0;
        if (secIdx === 0 && subIdx === 0 && state.boxv2) {
          state.boxv2.rotStartY = subSec.boxv2YStart;
          state.boxv2.startY = subSec.boxv2YStart;
          if (boxv2StartYInput) boxv2StartYInput.value = subSec.boxv2YStart;
        }
        fullUpdate();
      });

      block.querySelector('.sub-boxv2-y-end')?.addEventListener('input', (e) => {
        subSec.boxv2YEnd = parseFloat(e.target.value) || 0;
        if (secIdx === 0 && subIdx === 0 && state.boxv2) {
          state.boxv2.rotEndY = subSec.boxv2YEnd;
          state.boxv2.endY = subSec.boxv2YEnd;
          if (boxv2EndYInput) boxv2EndYInput.value = subSec.boxv2YEnd;
        }
        fullUpdate();
      });

      block.querySelector('.sub-boxv2-z-start')?.addEventListener('input', (e) => {
        subSec.boxv2ZStart = parseFloat(e.target.value) || 0;
        if (secIdx === 0 && subIdx === 0 && state.boxv2) {
          state.boxv2.rotStartZ = subSec.boxv2ZStart;
          state.boxv2.startZ = subSec.boxv2ZStart;
          if (boxv2StartZInput) boxv2StartZInput.value = subSec.boxv2ZStart;
        }
        fullUpdate();
      });

      block.querySelector('.sub-boxv2-z-end')?.addEventListener('input', (e) => {
        subSec.boxv2ZEnd = parseFloat(e.target.value) || 0;
        if (secIdx === 0 && subIdx === 0 && state.boxv2) {
          state.boxv2.rotEndZ = subSec.boxv2ZEnd;
          state.boxv2.endZ = subSec.boxv2ZEnd;
          if (boxv2EndZInput) boxv2EndZInput.value = subSec.boxv2ZEnd;
        }
        fullUpdate();
      });
      
      block.querySelector('.sub-easing-toggle').addEventListener('click', (e) => {
        const btn = e.target.closest('.toggle-btn');
        if (!btn) return;
        subSec.customEasing = (btn.dataset.value === 'on');
        renderSectionsUI();
        fullUpdate();
      });
      
      const editBtn = block.querySelector('.sub-open-graph-btn');
      if (editBtn) {
        editBtn.addEventListener('click', () => {
          currentEditingTarget = `sub-section-${secIdx}-${subIdx}`;
          graphIframe.style.display = 'block';
          graphIframe2.style.display = 'none';
          graphModal.style.display = 'flex';
          const ease = subSec.easing || '0.25, 0.10, 0.25, 1.00';
          const parts = ease.replace(/,/g, ' ').trim().split(/\s+/).map(Number);
          if (parts.length === 4 && graphIframe.contentWindow) {
            try {
              graphIframe.contentWindow.postMessage({
                type: 'SET_BEZIER',
                x1: parts[0], y1: parts[1], x2: parts[2], y2: parts[3]
              }, '*');
            } catch (err) {}
          }
        });
      }

      block.querySelector('.sub-timing-toggle').addEventListener('click', (e) => {
        const btn = e.target.closest('.toggle-btn');
        if (!btn) return;
        subSec.customTiming = (btn.dataset.value === 'on');
        renderSectionsUI();
        fullUpdate();
      });
      
      block.querySelector('.sub-beat1').addEventListener('input', (e) => {
        subSec.beat1Str = e.target.value;
        fullUpdate();
      });
      
      block.querySelector('.sub-beat2').addEventListener('input', (e) => {
        subSec.beat2Str = e.target.value;
        fullUpdate();
      });
      
      block.querySelector('.sub-beat3').addEventListener('input', (e) => {
        subSec.beat3Str = e.target.value;
        fullUpdate();
      });
    });
  }

  // ---- Update Functions ----
  function updateProjectSize() {
    const scale = parseFloat(projectScaleSelect.value) || 1;
    state.projectWidth = state.baseWidth * scale;
    state.projectHeight = state.baseHeight * scale;

    if (state.wipeMethod === 'boxv2' || state.animType === 'boxv2') {
      state.solidWidth = state.projectWidth;
      state.solidHeight = state.projectHeight;
      if (solidWidthInput) solidWidthInput.value = state.projectWidth;
      if (solidHeightInput) solidHeightInput.value = state.projectHeight;
    }

    previewDimensions.textContent = `${state.projectWidth} × ${state.projectHeight}`;
    wipeXDisplay.textContent = state.projectWidth / 2;
    wipeYDisplay.textContent = state.projectHeight / 2;
    crosshairLabel.textContent = `Center: ${state.projectWidth / 2}, ${state.projectHeight / 2}`;
  }

  function updateFormulas() {
    const layers = calculateLayers();
    const n = layers.length || 1;
    let html = '';

    const isMask = state.wipeMethod === 'mask';
    const isHoriz = state.splitDirection === 'horizontal';

    // Ratio telemetry
    const curRatio = (state.solidWidth / state.solidHeight).toFixed(3);
    const is45 = Math.abs((state.solidWidth / state.solidHeight) - 0.8) < 0.01;
    const ratioBadge = is45 ? '<span style="color:var(--cyan); font-weight:700;">4:5 PERFECT</span>' : `${curRatio} (${state.solidWidth}×${state.solidHeight})`;

    if (isMask) {
      html += `<div class="formula-section-head">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="18" rx="1"/></svg>
        Masking Mode — Physical Slices (Connected Group &amp; Mask Slicing)
      </div>`;
      html += `<div class="formula-callout">
        <strong>Masking Mode active:</strong> Instead of Alight Motion's <code>wipe2</code> effect, each slice layer is an isolated Group &amp; Mask (<code>&lt;embedScene&gt;</code>) containing the full media image masked by a <code>blending="mask"</code> stencil. All <strong>${n}</strong> slice layers connect together into one seamless image.
      </div>`;

      html += `<div class="formula-line"><span class="formula-label">Slicing Mode</span><span class="formula-expr" style="color:var(--cyan)">MASKING (SEPARATE SHAPES)</span></div>`;
      html += `<div class="formula-line"><span class="formula-label">Solid Aspect</span><span class="formula-expr">${ratioBadge}</span></div>`;
      html += `<div class="formula-line"><span class="formula-label">Total Scale X</span><span class="formula-expr">${(state.solidWidth / 200).toFixed(4)}</span></div>`;
      html += `<div class="formula-line"><span class="formula-label">Total Scale Y</span><span class="formula-expr">${(state.solidHeight / 200).toFixed(4)}</span></div>`;
      html += `<div class="formula-line"><span class="formula-label">Total Slices</span><span class="formula-expr">${n} Layers</span></div>`;
      html += `<div class="formula-line"><span class="formula-label">Split Axis</span><span class="formula-expr">${isHoriz ? 'HORIZONTAL (Left → Right)' : 'VERTICAL (Up → Down)'}</span></div>`;

      // Horizontal formulas (Left to Right)
      html += `<div class="formula-section-head" style="margin-top:10px; color:${isHoriz ? 'var(--cyan)' : 'var(--text-2)'}">
        <span>1. Horizontal Slicing Formulas (Rectangles Going Left → Right)</span>
      </div>`;
      html += `<div class="formula-line"><span class="formula-label">Slice Width</span><span class="formula-expr">W = solidWidth = ${state.solidWidth.toFixed(1)} px (Full Width)</span></div>`;
      html += `<div class="formula-line"><span class="formula-label">Slice Height</span><span class="formula-expr">H = solidHeight / ${n} = ${(state.solidHeight / n).toFixed(2)} px</span></div>`;
      html += `<div class="formula-line"><span class="formula-label">Scale X (AM)</span><span class="formula-expr">scaleX = W / 200 = ${(state.solidWidth / 200).toFixed(6)}</span></div>`;
      html += `<div class="formula-line"><span class="formula-label">Scale Y (AM)</span><span class="formula-expr">scaleY = H / 200 = ${((state.solidHeight / n) / 200).toFixed(6)}</span></div>`;
      html += `<div class="formula-line"><span class="formula-label">Location X</span><span class="formula-expr">locX = CenterX = ${(state.projectWidth / 2).toFixed(1)} px</span></div>`;
      html += `<div class="formula-line"><span class="formula-label">Location Y(i)</span><span class="formula-expr">locY = Top + (i + 0.5) × ${(state.solidHeight / n).toFixed(2)} px</span></div>`;

      // Vertical formulas (Up to Down)
      html += `<div class="formula-section-head" style="margin-top:10px; color:${!isHoriz ? 'var(--cyan)' : 'var(--text-2)'}">
        <span>2. Vertical Slicing Formulas (Rectangles Going Up → Down · Project 294)</span>
      </div>`;
      html += `<div class="formula-line"><span class="formula-label">Slice Width</span><span class="formula-expr">W = solidWidth / ${n} = ${(state.solidWidth / n).toFixed(2)} px</span></div>`;
      html += `<div class="formula-line"><span class="formula-label">Slice Height</span><span class="formula-expr">H = solidHeight = ${state.solidHeight.toFixed(1)} px (Full Height)</span></div>`;
      html += `<div class="formula-line"><span class="formula-label">Scale X (AM)</span><span class="formula-expr">scaleX = W / 200 = ${((state.solidWidth / n) / 200).toFixed(6)}</span></div>`;
      html += `<div class="formula-line"><span class="formula-label">Scale Y (AM)</span><span class="formula-expr">scaleY = H / 200 = ${(state.solidHeight / 200).toFixed(6)}</span></div>`;
      html += `<div class="formula-line"><span class="formula-label">Location X(i)</span><span class="formula-expr">locX = Left + (i + 0.5) × ${(state.solidWidth / n).toFixed(2)} px</span></div>`;
      html += `<div class="formula-line"><span class="formula-label">Location Y</span><span class="formula-expr">locY = CenterY = ${(state.projectHeight / 2).toFixed(1)} px</span></div>`;

      if (state.animType === 'cube') {
        html += `<div class="formula-section-head" style="margin-top:10px; color:var(--cyan)">
          <span>3. 3D Cube Slicing Geometry (Locked 4:5 Aspect Ratio)</span>
        </div>`;
        html += `<div class="formula-line"><span class="formula-label">Total Composite</span><span class="formula-expr" style="color:var(--cyan)">4:5 LOCKED (${state.solidWidth} × ${state.solidHeight} px)</span></div>`;
        html += `<div class="formula-line"><span class="formula-label">Total Ratio</span><span class="formula-expr">Ratio = ${(state.solidWidth / state.solidHeight).toFixed(4)} (4:5 Perfect)</span></div>`;
        html += `<div class="formula-line"><span class="formula-label">Per-Slice Cube</span><span class="formula-expr">${isHoriz ? `W = ${(state.solidWidth/1000).toFixed(3)}, H = ${(state.solidHeight / n / 1000).toFixed(4)}` : `W = ${(state.solidWidth / n / 1000).toFixed(4)}, H = ${(state.solidHeight/1000).toFixed(3)}`}</span></div>`;
        html += `<div class="formula-line"><span class="formula-label">Stack Slices</span><span class="formula-expr" style="color:var(--cyan)">100% Constant 4:5 across all ${n} slices (10L, 20L, 30L+)</span></div>`;
      }

    } else {
      // Wipe Effect Mode
      const isDiag = state.splitDirection.includes('diagonal') || (state.wipeAngle % 90 !== 0 && state.wipeAngle !== 0);
      const thetaDeg = state.splitDirection === 'diagonal' ? (state.wipeAngle || 45)
        : (state.splitDirection === 'diagonal-desc' ? (state.wipeAngle === 45 ? 135 : (state.wipeAngle || 135))
        : (state.splitDirection === 'horizontal' ? 90
        : (state.splitDirection === 'vertical' ? 0 : (state.wipeAngle || 0))));
      const thetaRad = (thetaDeg * Math.PI) / 180;
      const W = state.solidWidth;
      const H = state.solidHeight;
      const cosA = Math.abs(Math.cos(thetaRad));
      const sinA = Math.abs(Math.sin(thetaRad));
      const projSpanD = W * cosA + H * sinA || 1;
      const bandWidth = projSpanD / n;
      const cornerAngle = (Math.atan2(H, W) * 180 / Math.PI).toFixed(2);
      const deltaOverscan = WIPE_SEAM_OVERSCAN_PX / projSpanD;

      html += `<div class="formula-section-head">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="2" y1="12" x2="22" y2="12"/><polyline points="12 2 22 12 12 22"/></svg>
        Wipe Effect Mode — Normalized Range Slices (Alight Motion com.alightcreative.effects.wipe2)
      </div>`;

      html += `<div class="formula-callout">
        <strong>WIPE Masking active:</strong> In this mode, each slice layer retains the full <strong>${W.toFixed(0)} × ${H.toFixed(0)} px</strong> solid and is masked via Alight Motion's native <code>wipe2</code> shader at angle <strong>${thetaDeg}°</strong>. Parallel cut planes partition the entire solid into <strong>${n}</strong> seamless slices without edge seam tearing.
      </div>`;

      html += `<div class="formula-line"><span class="formula-label">Slicing Mode</span><span class="formula-expr" style="color:var(--cyan); font-weight:700;">WIPE EFFECT (NATIVE SHADER)</span></div>`;
      html += `<div class="formula-line"><span class="formula-label">Solid Aspect</span><span class="formula-expr">${ratioBadge}</span></div>`;
      html += `<div class="formula-line"><span class="formula-label">Total Slices</span><span class="formula-expr">${n} Layers</span></div>`;
      html += `<div class="formula-line"><span class="formula-label">Project Resolution</span><span class="formula-expr">${state.projectWidth} × ${state.projectHeight} px</span></div>`;
      html += `<div class="formula-line"><span class="formula-label">Solid Geometry</span><span class="formula-expr">${W.toFixed(0)} × ${H.toFixed(0)} px (Centered at ${state.projectWidth / 2}, ${state.projectHeight / 2})</span></div>`;
      html += `<div class="formula-line"><span class="formula-label">Wipe Angle (θ)</span><span class="formula-expr" style="color:var(--cyan); font-weight:700;">${thetaDeg}° ${isDiag ? '(DIAGONAL)' : (thetaDeg === 90 ? '(HORIZONTAL)' : '(VERTICAL)')}</span></div>`;
      html += `<div class="formula-line"><span class="formula-label">Seam Overscan (δ)</span><span class="formula-expr">${WIPE_SEAM_OVERSCAN_PX} px (Normalized δ = ${(deltaOverscan * 100).toFixed(4)}%)</span></div>`;

      // 1. Diagonal Wipe Formulas
      html += `<div class="formula-section-head" style="margin-top:10px; color:var(--cyan)">
        <span>1. Diagonal Wipe Mathematical Formulas</span>
      </div>`;
      html += `<div class="formula-line"><span class="formula-label">Wipe Angle θ</span><span class="formula-expr">θ = ${thetaDeg}° &nbsp;·&nbsp; Natural Corner θ = arctan(H/W) = ${cornerAngle}°</span></div>`;
      html += `<div class="formula-line"><span class="formula-label">Projected Diagonal Span</span><span class="formula-expr">D = W·|cos θ| + H·|sin θ| = ${W.toFixed(0)}×${cosA.toFixed(4)} + ${H.toFixed(0)}×${sinA.toFixed(4)} = <strong>${projSpanD.toFixed(2)} px</strong></span></div>`;
      html += `<div class="formula-line"><span class="formula-label">Per-Slice Band Thickness</span><span class="formula-expr">w_band = D / n = ${projSpanD.toFixed(2)} / ${n} = <strong>${bandWidth.toFixed(2)} px</strong></span></div>`;
      html += `<div class="formula-line"><span class="formula-label">Normalized Range Formula</span><span class="formula-expr">start(i) = max(0, i / ${n} - δ), &nbsp; end(i) = min(1, (i + 1) / ${n} + δ)</span></div>`;
      html += `<div class="formula-line"><span class="formula-label">Physical Cut Range [px]</span><span class="formula-expr">Span(i) = [i × ${(bandWidth).toFixed(2)}, &nbsp; (i + 1) × ${(bandWidth).toFixed(2)}] px</span></div>`;
      html += `<div class="formula-line"><span class="formula-label">Slice Centroid Offset</span><span class="formula-expr">d(i) = ((i + 0.5) / ${n} - 0.5) × D px from solid center</span></div>`;

      // 2. Alight Motion XML wipe2 mapping
      html += `<div class="formula-section-head" style="margin-top:10px; color:var(--violet-hi)">
        <span>2. Alight Motion XML wipe2 Effect Schema</span>
      </div>`;
      html += `<div class="formula-callout" style="font-family:var(--font-mono); font-size:10px; line-height:1.6; background:rgba(0,0,0,0.4);">
        &lt;effect id="com.alightcreative.effects.wipe2" locallyApplied="true"&gt;<br>
        &nbsp;&nbsp;&lt;property name="angle" type="float" value="${thetaDeg.toFixed(6)}"/&gt;<br>
        &nbsp;&nbsp;&lt;property name="start" type="float" value="start(i)"/&gt;<br>
        &nbsp;&nbsp;&lt;property name="end" type="float" value="end(i)"/&gt;<br>
        ${state.wipeSoftness > 0 ? `&nbsp;&nbsp;&lt;property name="feather" type="float" value="${(state.wipeSoftness / 100).toFixed(6)}"/&gt;<br>` : ''}
        &lt;/effect&gt;
      </div>`;

      if (state.wipeMethod === 'boxv2' || state.animType === 'boxv2') {
        const lScale = state.boxv2 ? state.boxv2.layerScale : 2.40;
        const bScale = state.boxv2 ? state.boxv2.boxScale : 1.33;
        const effBoxScale = bScale * lScale;
        const bHeight = state.boxv2 ? state.boxv2.boxHeight : 1.00;
        const stAngle = state.boxv2 ? state.boxv2.stretchAngle : 90.0;
        const stScale = state.boxv2 ? state.boxv2.stretchScale : 1.25;
        html += `<div class="formula-section-head" style="margin-top:10px; color:var(--cyan)">
          <span>BOX V2 Slicing Method — Wipe2 + 3D Box + Stretch2 (Project 314)</span>
        </div>`;
        html += `<div class="formula-callout">
          <strong>BOX V2 Calibration (1080 × 1350 Locked Rectangle):</strong> Each shape keeps <code>size = ${(state.projectWidth / 2).toFixed(0)}, ${(state.projectHeight / 2).toFixed(0)}</code> and transform <code>scale = 1.00, 1.00</code> so the rectangle size in Alight Motion is strictly <strong>${state.projectWidth} × ${state.projectHeight} px</strong> (never 2592 × 3240). Multiplying <code>box.scale</code> by <strong>${lScale.toFixed(2)}x</strong> (<code>${bScale.toFixed(2)} × ${lScale.toFixed(2)} = ${effBoxScale.toFixed(3)}</code>) scales the 450 × 561.7 base box up to fill <strong>${(450 * lScale * (state.projectWidth / 1080)).toFixed(0)} × ${(562.5 * lScale * (state.projectHeight / 1350)).toFixed(0)} px</strong>.
        </div>`;
        html += `<div class="formula-line"><span class="formula-label">Rectangle Size</span><span class="formula-expr" style="color:var(--cyan); font-weight:700;">${state.projectWidth} × ${state.projectHeight} px (size ${(state.projectWidth / 2).toFixed(0)}×${(state.projectHeight / 2).toFixed(0)} · transform scale 1.00)</span></div>`;
        html += `<div class="formula-line"><span class="formula-label">Box Scale Formula</span><span class="formula-expr" style="color:var(--cyan); font-weight:700;">${bScale.toFixed(2)} × ${lScale.toFixed(2)} = ${effBoxScale.toFixed(3)} → ${(450 * lScale * (state.projectWidth / 1080)).toFixed(0)} × ${(562.5 * lScale * (state.projectHeight / 1350)).toFixed(0)} px</span></div>`;
        html += `<div class="formula-line"><span class="formula-label">Box Effect</span><span class="formula-expr">height = ${bHeight.toFixed(2)} · scale = ${effBoxScale.toFixed(3)} · shadingType = 0</span></div>`;
        html += `<div class="formula-line"><span class="formula-label">Stretch2 Effect</span><span class="formula-expr">angle = ${stAngle.toFixed(1)}° · scale = ${stScale.toFixed(2)}x</span></div>`;
        html += `<div class="formula-line"><span class="formula-label">Rotation (X,Y,Z)</span><span class="formula-expr">Start [${(state.boxv2 ? state.boxv2.rotStartX : 0)}°, ${(state.boxv2 ? state.boxv2.rotStartY : 0)}°, ${(state.boxv2 ? state.boxv2.rotStartZ : 0)}°] → End [${(state.boxv2 ? state.boxv2.rotEndX : 0)}°, ${(state.boxv2 ? state.boxv2.rotEndY : 90)}°, ${(state.boxv2 ? state.boxv2.rotEndZ : 0)}°]</span></div>`;
      }

      // 3. Flip Pivot Auto-Fix Telemetry
      const dirUpper = state.splitDirection.toUpperCase();
      const sCountLabel = `${state.sectionCount} Section${state.sectionCount > 1 ? 's' : ''}`;
      html += `<div class="formula-section-head" style="margin-top:10px; color:${state.autoFixPivot ? 'var(--cyan)' : 'var(--text-2)'}">
        <span>3. Per-Slice Flip Pivot Telemetry · Auto-Fix Pivot: <strong>${state.autoFixPivot ? 'ON' : 'OFF'}</strong> (${dirUpper} · ${sCountLabel})</span>
      </div>`;
      html += `<div class="formula-line"><span class="formula-label">Auto-Fix Formula</span><span class="formula-expr">${state.autoFixPivot ? 'pivotX = 200 × (ΔX / solidWidth),  pivotY = 200 × (ΔY / solidHeight) [Alight Motion vector units]' : 'OFF: Slices flip around canvas center (0, 0)'}</span></div>`;
      html += `<div class="formula-line"><span class="formula-label">Status</span><span class="formula-expr" style="color:var(--cyan); font-weight:700;">${state.autoFixPivot ? `ACTIVE: All ${n} slices flip in-place across ${sCountLabel} in ${dirUpper} direction` : 'DISABLED: Default global pivot applied'}</span></div>`;

      // 4. Live Per-Slice Telemetry
      html += `<div class="formula-section-head" style="margin-top:10px; color:var(--text-1)">
        <span>4. Live Per-Slice Telemetry Breakdown (${n} Layers across ${sCountLabel})</span>
      </div>`;
      layers.forEach((lyr) => {
        const sPct = (lyr.wipeStart * 100).toFixed(1);
        const ePct = (lyr.wipeEnd * 100).toFixed(1);
        const pStartPx = (lyr.wipeStart * projSpanD).toFixed(1);
        const pEndPx = (lyr.wipeEnd * projSpanD).toFixed(1);
        const pivotStr = `pivot: [${lyr.pivotX.toFixed(2)}, ${lyr.pivotY.toFixed(2)}]`;
        const offsetStr = `centroid Δ: [${(lyr.sliceCenterOffsetX !== undefined ? lyr.sliceCenterOffsetX : 0).toFixed(1)}, ${(lyr.sliceCenterOffsetY !== undefined ? lyr.sliceCenterOffsetY : 0).toFixed(1)}] px`;
        html += `<div class="formula-line">
          <span class="formula-label" style="color:var(--cyan); font-weight:700;">Sec ${lyr.sectionIdx + 1} · Cut ${lyr.index}</span>
          <span class="formula-expr">wipe2[${sPct}% → ${ePct}%] · span [${pStartPx} → ${pEndPx} px] · ${pivotStr} · ${offsetStr}</span>
        </div>`;
      });
    }

    formulaContent.innerHTML = html;

    if (hbStretchFormulaDisplay) {
      const firstLayer = layers[0] || { width: state.projectWidth / Math.max(1, state.sectionCount), height: state.projectHeight };
      const stretch = calculateHollowBoxStretch(firstLayer);
      hbStretchFormulaDisplay.textContent = stretch.text;
    }
  }

  function updateLayerTable() {
    const layers = calculateLayers();
    const isMask = state.wipeMethod === 'mask';
    let html = '';

    if (thCol4) thCol4.textContent = isMask ? 'Size (W×H)' : 'Solid Size';
    if (thCol5) thCol5.textContent = isMask ? 'Scale X' : 'Wipe Angle';
    if (thCol6) thCol6.textContent = isMask ? 'Scale Y' : 'Wipe Range';

    layers.forEach((layer) => {
      const col4Val = `${layer.width.toFixed(0)}×${layer.height.toFixed(0)}`;
      const col5Val = isMask
        ? (layer.width / 200).toFixed(4)
        : `${(layer.wipeAngle !== undefined ? layer.wipeAngle : (state.splitDirection === 'horizontal' ? 90 : 0)).toFixed(0)}°`;
      const col6Val = isMask
        ? (layer.height / 200).toFixed(4)
        : `${((layer.wipeStart !== undefined ? layer.wipeStart : 0) * 100).toFixed(1)}% – ${((layer.wipeEnd !== undefined ? layer.wipeEnd : 1) * 100).toFixed(1)}%`;

      html += `<tr>
        <td class="layer-index">${layer.index}</td>
        <td>${layer.locX.toFixed(1)}</td>
        <td>${layer.locY.toFixed(1)}</td>
        <td>${col4Val}</td>
        <td>${col5Val}</td>
        <td>${col6Val}</td>
      </tr>`;
    });

    const tbody = $('#layerTableBody');
    if (tbody) tbody.innerHTML = html;
  }

  // ---- Alight Motion XML Generation ----
  function generateAlightMotionXML(overrideLayers) {
    const layers = overrideLayers || calculateLayers();
    const t = '  '; // indent
    const totalTimeMs = Math.round(parseTimeToSeconds(state.projectDurationStr) * 1000);
    const fps = state.fps;

    let hexColor = state.solidColor.toUpperCase();
    if (hexColor.startsWith('#')) hexColor = hexColor.substring(1);
    const amColor = `#FF${hexColor}`;

    let xml = `<?xml version='1.0' encoding='UTF-8' ?>\n`;
    xml += `<!--\n`;
    xml += `Created by ALIGHT MOTION XMLS Rectangle Wipe Generator\n`;
    xml += `Exported: ${new Date().toLocaleString()}\n`;
    xml += `-->\n`;

    const isBoxV2Scene = state.wipeMethod === 'boxv2' || state.animType === 'boxv2';
    const sceneTitle = state.wipeMethod === 'mask'
      ? `Project Name Masking ${layers.length}x`
      : (isBoxV2Scene ? `Project Name 314 Box V2 ${layers.length}x` : `Wipe Layers ${layers.length}x`);

    // In Alight Motion 6.2.59 (precompose="dynamicResolution"), exportHeight is the 16:9 vertical resolution tier
    // (1080 for 1080x1350 4:5 scenes; passing exportHeight="1350" causes AM to treat the project as 1440p and scale
    // 1080x1350 shapes up by 4/3 to 1440x1800). Match Project Name 314.xml: exportWidth="1920" exportHeight="1080".
    const exportScale = state.projectWidth / 1080;
    const sceneExportWidth = Math.round(1920 * exportScale);
    const sceneExportHeight = Math.round(1080 * exportScale);

    xml += `<scene title="${sceneTitle}" width="${state.projectWidth}" height="${state.projectHeight}" exportWidth="${sceneExportWidth}" exportHeight="${sceneExportHeight}" bgcolor="#FF000000" totalTime="${totalTimeMs}" fps="${fps}" modifiedTime="${Date.now()}" amver="868" ffver="107" am="com.alightcreative.motion/6.2.59" amplatform="ios" precompose="dynamicResolution" retime="freeze">\n`;

    xml += `${t}<bookmark t="0"/>\n`;
    xml += `${t}<bookmark t="${totalTimeMs}"/>\n`;

    const useVideo = state.videoLayer && state.videoUri.trim() !== '';
    const videoUri = escapeXmlAttr(state.videoUri.trim());
    if (useVideo) {
      const dur = Math.max(1, Math.round(state.videoDurationMs || totalTimeMs));
      xml += `${t}<media uri="${videoUri}" type="video/mp4" duration="${dur}" fps="${fps}" width="${state.projectWidth}" height="${state.projectHeight}"/>\n`;
    }

    // Helper to generate 3D rotation & orient effects (flip3, cube2, box, boxv2, hollowbox)
    function generateEffectsXml(layer, indent) {
      const isBoxV2 = state.wipeMethod === 'boxv2' || state.animType === 'boxv2';
      if (!isBoxV2 && state.animType !== 'flip' && state.animType !== 'cube' && state.animType !== 'box' && state.animType !== 'hollowbox') {
        return '';
      }
      let effXml = '';
      const projDurationSec = parseTimeToSeconds(state.projectDurationStr) || 1;
      const normStart = layer.flipStartT / projDurationSec;
      const normEnd = layer.flipEndT / projDurationSec;

      let easingStr = '';
      if (layer.flipEasing) {
        const bezierParts = layer.flipEasing.split(',').map(s => s.trim());
        easingStr = ` e="cubicBezier ${bezierParts.join(' ')}"`;
      }

      if (isBoxV2) {
        const boxHeightVal = (state.boxv2 && state.boxv2.boxHeight !== undefined) ? state.boxv2.boxHeight : 1.00;
        const boxScaleVal = (state.boxv2 && state.boxv2.boxScale !== undefined) ? state.boxv2.boxScale : 1.33;
        const boxMultVal = (state.boxv2 && state.boxv2.layerScale !== undefined) ? state.boxv2.layerScale : 2.40;
        const effectiveBoxScale = boxScaleVal * boxMultVal;
        const shadingVal = (state.boxv2 && state.boxv2.shadingType !== undefined) ? state.boxv2.shadingType : 0;
        const stretchAngleVal = (state.boxv2 && state.boxv2.stretchAngle !== undefined) ? state.boxv2.stretchAngle : 90.0;
        const stretchScaleVal = (state.boxv2 && state.boxv2.stretchScale !== undefined) ? state.boxv2.stretchScale : 1.25;

        const rSX = layer.boxv2XStart !== undefined ? layer.boxv2XStart : 0;
        const rSY = layer.boxv2YStart !== undefined ? layer.boxv2YStart : 0;
        const rSZ = layer.boxv2ZStart !== undefined ? layer.boxv2ZStart : 0;
        const rEX = layer.boxv2XEnd !== undefined ? layer.boxv2XEnd : 0;
        const rEY = layer.boxv2YEnd !== undefined ? layer.boxv2YEnd : 0;
        const rEZ = layer.boxv2ZEnd !== undefined ? layer.boxv2ZEnd : 0;

        effXml += `${indent}<effect id="com.alightcreative.effects.box" locallyApplied="true">\n`;
        effXml += `${indent}${t}<property name="height" type="float" value="${boxHeightVal.toFixed(6)}"/>\n`;
        effXml += `${indent}${t}<property name="rotate" type="vec3">\n`;
        effXml += `${indent}${t}${t}<kf t="${normStart.toFixed(6)}" v="${rSX.toFixed(6)},${rSY.toFixed(6)},${rSZ.toFixed(6)}" />\n`;
        effXml += `${indent}${t}${t}<kf t="${normEnd.toFixed(6)}" v="${rEX.toFixed(6)},${rEY.toFixed(6)},${rEZ.toFixed(6)}"${easingStr} />\n`;
        effXml += `${indent}${t}</property>\n`;
        effXml += `${indent}${t}<property name="scale" type="float" value="${effectiveBoxScale.toFixed(6)}"/>\n`;
        effXml += `${indent}${t}<property name="shadingType" type="int" value="${shadingVal}"/>\n`;
        effXml += `${indent}</effect>\n`;

        effXml += `${indent}<effect id="com.alightcreative.effects.stretch2" locallyApplied="true">\n`;
        effXml += `${indent}${t}<property name="angle" type="float" value="${stretchAngleVal.toFixed(6)}"/>\n`;
        effXml += `${indent}${t}<property name="scale" type="float" value="${stretchScaleVal.toFixed(6)}"/>\n`;
        effXml += `${indent}</effect>\n`;
      } else if (state.animType === 'flip') {
        effXml += `${indent}<effect id="com.alightcreative.effects.flip3" locallyApplied="true">\n`;
        effXml += `${indent}${t}<property name="axis" type="float" value="${layer.flipAxis.toFixed(6)}"/>\n`;
        effXml += `${indent}${t}<property name="pivot" type="vec2" value="${layer.pivotX.toFixed(6)},${layer.pivotY.toFixed(6)}"/>\n`;
        effXml += `${indent}${t}<property name="angle" type="float">\n`;
        effXml += `${indent}${t}${t}<kf t="${normStart.toFixed(6)}" v="${layer.flipStartAngle.toFixed(6)}" />\n`;
        effXml += `${indent}${t}${t}<kf t="${normEnd.toFixed(6)}" v="${layer.flipEndAngle.toFixed(6)}"${easingStr} />\n`;
        effXml += `${indent}${t}</property>\n`;
        effXml += `${indent}</effect>\n`;
      } else if (state.animType === 'cube') {
        const isHorizontalSplit = state.splitDirection === 'horizontal';
        const totalLayers = layers.length || 1;
        const solidW = state.solidWidth;
        const solidH = state.solidHeight;

        // In 4:5 ratio geometry, total composite is locked to 4:5 (1080x1350 or user solid).
        // Each slice represents 1/N of the 4:5 whole:
        // - Horizontal split: slice is solidW wide, solidH / totalLayers high.
        // - Vertical split: slice is solidW / totalLayers wide, solidH high.
        const sliceW = state.wipeMethod === 'mask' ? layer.width : (isHorizontalSplit ? solidW : (solidW / totalLayers));
        const sliceH = state.wipeMethod === 'mask' ? layer.height : (isHorizontalSplit ? (solidH / totalLayers) : solidH);

        let cubeWidth, cubeHeight, cubeDepth, cubeScale;

        if (state.wipeMethod === 'mask') {
          // Normalized dimensions in AM 3D space (1000px = 1.0 unit)
          cubeWidth = sliceW / 1000;
          cubeHeight = sliceH / 1000;
          cubeDepth = (isHorizontalSplit ? sliceH : sliceW) / 1000;
          cubeScale = 1.32 * (state.projectWidth / 1080);
        } else {
          // Wipe Mode: Each layer spans the full 4:5 solid (1080x1350)
          cubeWidth = solidW / 1000;
          cubeHeight = solidH / 1000;
          cubeDepth = solidW / 1000;
          cubeScale = 1.32 * (state.projectWidth / 1080);
        }

        effXml += `${indent}<effect id="com.alightcreative.effects.cube2" locallyApplied="true">\n`;
        effXml += `${indent}${t}<property name="depth" type="float" value="${cubeDepth.toFixed(6)}"/>\n`;
        effXml += `${indent}${t}<property name="height" type="float" value="${cubeHeight.toFixed(6)}"/>\n`;
        effXml += `${indent}${t}<property name="rotate" type="vec3">\n`;
        effXml += `${indent}${t}${t}<kf t="${normStart.toFixed(6)}" v="${layer.cubeXStart.toFixed(6)},${layer.cubeYStart.toFixed(6)},${layer.cubeZStart.toFixed(6)}" />\n`;
        effXml += `${indent}${t}${t}<kf t="${normEnd.toFixed(6)}" v="${layer.cubeXEnd.toFixed(6)},${layer.cubeYEnd.toFixed(6)},${layer.cubeZEnd.toFixed(6)}"${easingStr} />\n`;
        effXml += `${indent}${t}</property>\n`;
        effXml += `${indent}${t}<property name="position" type="vec3" value="0.000000,0.000000,0.000000"/>\n`;
        effXml += `${indent}${t}<property name="scale" type="float" value="${cubeScale.toFixed(6)}"/>\n`;
        effXml += `${indent}${t}<property name="shadingType" type="int" value="0"/>\n`;
        effXml += `${indent}${t}<property name="width" type="float" value="${cubeWidth.toFixed(6)}"/>\n`;
        effXml += `${indent}</effect>\n`;
      } else if (state.animType === 'box') {
        effXml += `${indent}<effect id="com.alightcreative.effects.box" locallyApplied="true">\n`;
        effXml += `${indent}${t}<property name="depth" type="float" value="${state.box.depth.toFixed(6)}"/>\n`;
        effXml += `${indent}${t}<property name="scale" type="float" value="${state.box.scale.toFixed(6)}"/>\n`;

        const normOrientStart = layer.orientStartT / projDurationSec;
        const normOrientEnd = layer.orientEndT / projDurationSec;
        const startQuat = eulerToQuaternion(state.box.orientStartX, state.box.orientStartY, state.box.orientStartZ);
        const endQuat = eulerToQuaternion(state.box.orientEndX, state.box.orientEndY, state.box.orientEndZ);
        const orientEasingStr = ` e="cubicBezier ${state.box.orientEasing.replace(/, /g, ' ')}"`;
        const rotateEasingStr = ` e="cubicBezier ${state.box.rotateEasing.replace(/, /g, ' ')}"`;

        effXml += `${indent}${t}<property name="orient" type="quat">\n`;
        effXml += `${indent}${t}${t}<kf t="${normOrientStart.toFixed(6)}" v="${startQuat.w.toFixed(6)},${startQuat.x.toFixed(6)},${startQuat.y.toFixed(6)},${startQuat.z.toFixed(6)}" />\n`;
        effXml += `${indent}${t}${t}<kf t="${normOrientEnd.toFixed(6)}" v="${endQuat.w.toFixed(6)},${endQuat.x.toFixed(6)},${endQuat.y.toFixed(6)},${endQuat.z.toFixed(6)}" ${orientEasingStr} />\n`;
        effXml += `${indent}${t}</property>\n`;

        const normRotateStart = layer.rotateStartT / projDurationSec;
        const normRotateEnd = layer.rotateEndT / projDurationSec;

        effXml += `${indent}${t}<property name="rotate" type="vec3">\n`;
        effXml += `${indent}${t}${t}<kf t="${normRotateStart.toFixed(6)}" v="${state.box.rotateStartX.toFixed(6)},${state.box.rotateStartY.toFixed(6)},${state.box.rotateStartZ.toFixed(6)}" />\n`;
        effXml += `${indent}${t}${t}<kf t="${normRotateEnd.toFixed(6)}" v="${state.box.rotateEndX.toFixed(6)},${state.box.rotateEndY.toFixed(6)},${state.box.rotateEndZ.toFixed(6)}" ${rotateEasingStr} />\n`;
        effXml += `${indent}${t}</property>\n`;

        effXml += `${indent}${t}<property name="height" type="float" value="1.0"/>\n`;
        effXml += `${indent}${t}<property name="shadingType" type="int" value="1"/>\n`;
        effXml += `${indent}</effect>\n`;
      } else if (state.animType === 'hollowbox') {
        if (state.wipeMethod !== 'mask') {
          // Strict constraint: Hollow Box animation is ONLY used with MASKING mode
          return '';
        }

        const normHbStart = (layer.hbStartT !== undefined ? layer.hbStartT : 0) / projDurationSec;
        const normHbEnd = (layer.hbEndT !== undefined ? layer.hbEndT : projDurationSec) / projDurationSec;

        const posEasingStr = ` e="cubicBezier ${state.hollowbox.posEasing.replace(/, /g, ' ')}"`;
        const orientEasingStr = ` e="cubicBezier ${state.hollowbox.orientEasing.replace(/, /g, ' ')}"`;
        const rotateEasingStr = ` e="cubicBezier ${state.hollowbox.rotateEasing.replace(/, /g, ' ')}"`;
        const geomEasingStr = ` e="cubicBezier ${state.hollowbox.geomEasing.replace(/, /g, ' ')}"`;

        const startQuat = eulerToQuaternion(state.hollowbox.orientStartX, state.hollowbox.orientStartY, state.hollowbox.orientStartZ);
        const endQuat = eulerToQuaternion(state.hollowbox.orientEndX, state.hollowbox.orientEndY, state.hollowbox.orientEndZ);

        effXml += `${indent}<effect id="com.alightcreative.effects.hollowbox" locallyApplied="true">\n`;

        // 1. Position vec3 tween
        effXml += `${indent}${t}<property name="position" type="vec3">\n`;
        effXml += `${indent}${t}${t}<kf t="${normHbStart.toFixed(6)}" v="${state.hollowbox.posStartX.toFixed(6)},${state.hollowbox.posStartY.toFixed(6)},${state.hollowbox.posStartZ.toFixed(6)}" />\n`;
        effXml += `${indent}${t}${t}<kf t="${normHbEnd.toFixed(6)}" v="${state.hollowbox.posEndX.toFixed(6)},${state.hollowbox.posEndY.toFixed(6)},${state.hollowbox.posEndZ.toFixed(6)}"${posEasingStr} />\n`;
        effXml += `${indent}${t}</property>\n`;

        // 2. Orientation quat tween
        effXml += `${indent}${t}<property name="orient" type="quat">\n`;
        effXml += `${indent}${t}${t}<kf t="${normHbStart.toFixed(6)}" v="${startQuat.w.toFixed(6)},${startQuat.x.toFixed(6)},${startQuat.y.toFixed(6)},${startQuat.z.toFixed(6)}" />\n`;
        effXml += `${indent}${t}${t}<kf t="${normHbEnd.toFixed(6)}" v="${endQuat.w.toFixed(6)},${endQuat.x.toFixed(6)},${endQuat.y.toFixed(6)},${endQuat.z.toFixed(6)}"${orientEasingStr} />\n`;
        effXml += `${indent}${t}</property>\n`;

        // 3. Rotation vec3 tween
        effXml += `${indent}${t}<property name="rotate" type="vec3">\n`;
        effXml += `${indent}${t}${t}<kf t="${normHbStart.toFixed(6)}" v="${state.hollowbox.rotateStartX.toFixed(6)},${state.hollowbox.rotateStartY.toFixed(6)},${state.hollowbox.rotateStartZ.toFixed(6)}" />\n`;
        effXml += `${indent}${t}${t}<kf t="${normHbEnd.toFixed(6)}" v="${state.hollowbox.rotateEndX.toFixed(6)},${state.hollowbox.rotateEndY.toFixed(6)},${state.hollowbox.rotateEndZ.toFixed(6)}"${rotateEasingStr} />\n`;
        effXml += `${indent}${t}</property>\n`;

        // 4. Width float tween
        effXml += `${indent}${t}<property name="width" type="float">\n`;
        effXml += `${indent}${t}${t}<kf t="${normHbStart.toFixed(6)}" v="${state.hollowbox.widthStart.toFixed(6)}" />\n`;
        effXml += `${indent}${t}${t}<kf t="${normHbEnd.toFixed(6)}" v="${state.hollowbox.widthEnd.toFixed(6)}"${geomEasingStr} />\n`;
        effXml += `${indent}${t}</property>\n`;

        // 5. Height float tween
        effXml += `${indent}${t}<property name="height" type="float">\n`;
        effXml += `${indent}${t}${t}<kf t="${normHbStart.toFixed(6)}" v="${state.hollowbox.heightStart.toFixed(6)}" />\n`;
        effXml += `${indent}${t}${t}<kf t="${normHbEnd.toFixed(6)}" v="${state.hollowbox.heightEnd.toFixed(6)}"${geomEasingStr} />\n`;
        effXml += `${indent}${t}</property>\n`;

        effXml += `${indent}${t}<property name="depth" type="float" value="${state.hollowbox.depth.toFixed(6)}"/>\n`;
        effXml += `${indent}${t}<property name="scale" type="float" value="${state.hollowbox.scale.toFixed(6)}"/>\n`;
        effXml += `${indent}${t}<property name="shadingType" type="int" value="${state.hollowbox.shadingType}"/>\n`;
        effXml += `${indent}</effect>\n`;

        // Stretch Axis effect with dynamic resolution formula
        const stretch = calculateHollowBoxStretch(layer);
        effXml += `${indent}<effect id="com.alightcreative.effects.stretch2" locallyApplied="true">\n`;
        effXml += `${indent}${t}<property name="angle" type="float" value="${stretch.angle.toFixed(6)}"/>\n`;
        effXml += `${indent}${t}<property name="scale" type="float" value="${stretch.scale.toFixed(6)}"/>\n`;
        effXml += `${indent}</effect>\n`;
      }
      return effXml;
    }

    // Generate layers in reverse so layer 1 is at the bottom (matching AM export order)
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      const layerLabel = i === 0 ? "Rectangle 1" : `Rectangle 1 Copy${i > 1 ? ' ' + i : ''}`;

      if (state.wipeMethod === 'mask') {
        // Group & Mask architecture: Each layer is an <embedScene> containing:
        // Shape 1 (Media/Solid): full solid dimensions, positioned with offset so the slice window reveals its part of the connected whole.
        // Shape 2 (Mask): matching slice dimensions with blending="mask" to stencil the window.
        const tileW = layer.width;
        const tileH = layer.height;
        const cx = tileW / 2.0;
        const cy = tileH / 2.0;
        // In project coordinates, solid center is (projectWidth/2, projectHeight/2) and slice center is (layer.locX, layer.locY).
        const offsetX = (state.projectWidth / 2.0) - layer.locX;
        const offsetY = (state.projectHeight / 2.0) - layer.locY;
        const mediaLocX = cx + offsetX;
        const mediaLocY = cy + offsetY;

        xml += `${t}<embedScene id="${layer.index}" label="${layerLabel}" startTime="0" endTime="${totalTimeMs}" fillType="intrinsic">\n`;
        xml += `${t}${t}<transform>\n`;
        if (layer.moveEnabled) {
          let easingAttr = '';
          if (layer.moveEasing) {
            const bezierParts = layer.moveEasing.replace(/,/g, ' ').trim().split(/\s+/);
            easingAttr = ` e="cubicBezier ${bezierParts.join(' ')}"`;
          }
          const projDurationSec = parseTimeToSeconds(state.projectDurationStr) || 1;
          const normStart = layer.flipStartT / projDurationSec;
          const normEnd = layer.flipEndT / projDurationSec;
          xml += `${t}${t}${t}<location>\n`;
          xml += `${t}${t}${t}${t}<kf t="${normStart.toFixed(6)}" v="${layer.moveStartX.toFixed(6)},${layer.moveStartY.toFixed(6)},0.000000"/>\n`;
          xml += `${t}${t}${t}${t}<kf t="${normEnd.toFixed(6)}" v="${layer.moveEndX.toFixed(6)},${layer.moveEndY.toFixed(6)},0.000000"${easingAttr}/>\n`;
          xml += `${t}${t}${t}</location>\n`;
        } else {
          xml += `${t}${t}${t}<location value="${layer.locX.toFixed(6)},${layer.locY.toFixed(6)},0.000000"/>\n`;
        }
        xml += `${t}${t}${t}<scale value="1.000000,1.000000"/>\n`;
        xml += `${t}${t}</transform>\n`;

        // 3D effects on the embedScene
        xml += generateEffectsXml(layer, `${t}${t}`);

        xml += `${t}${t}<fillColor value="#FF000000"/>\n`;
        xml += `${t}${t}<scene title="" width="${Math.round(tileW)}" height="${Math.round(tileH)}" exportWidth="${Math.round(tileW)}" exportHeight="${Math.round(tileH)}" bgcolor="#00000000" totalTime="${totalTimeMs}" fps="${fps}" modifiedTime="0" amver="868" ffver="107" am="com.alightcreative.motion/6.2.59" amplatform="ios" precompose="dynamicResolution" retime="off">\n`;

        // Inner Shape 1: Media / Solid layer
        const innerFillAttrs = useVideo
          ? `fillType="media" fillVideo="${videoUri}" mediaFillMode="fill"`
          : `fillType="color"`;
        xml += `${t}${t}${t}<shape id="1" label="${layerLabel} Media" startTime="0" endTime="${totalTimeMs}" ${innerFillAttrs} s=".rect">\n`;
        xml += `${t}${t}${t}${t}<transform>\n`;
        xml += `${t}${t}${t}${t}${t}<location value="${mediaLocX.toFixed(6)},${mediaLocY.toFixed(6)},0.000000"/>\n`;
        xml += `${t}${t}${t}${t}</transform>\n`;
        if (!useVideo) {
          xml += `${t}${t}${t}${t}<fillColor value="${amColor}"/>\n`;
        }
        xml += `${t}${t}${t}${t}<property name="size" type="vec2" value="${(state.solidWidth / 2.0).toFixed(6)},${(state.solidHeight / 2.0).toFixed(6)}"/>\n`;
        xml += `${t}${t}${t}</shape>\n`;

        // Inner Shape 2: Mask Stencil
        xml += `${t}${t}${t}<shape id="2" label="${layerLabel} Mask" startTime="0" endTime="${totalTimeMs}" fillType="color" blending="mask" s=".rect">\n`;
        xml += `${t}${t}${t}${t}<transform>\n`;
        xml += `${t}${t}${t}${t}${t}<location value="${cx.toFixed(6)},${cy.toFixed(6)},0.000000"/>\n`;
        xml += `${t}${t}${t}${t}${t}<scale value="${(tileW / 200.0).toFixed(6)},${(tileH / 200.0).toFixed(6)}"/>\n`;
        xml += `${t}${t}${t}${t}</transform>\n`;
        xml += `${t}${t}${t}${t}<fillColor value="#FFFFFFFF"/>\n`;
        xml += `${t}${t}${t}</shape>\n`;

        xml += `${t}${t}</scene>\n`;
        xml += `${t}</embedScene>\n`;

      } else {
        // Wipe / BOX V2 Method: Shape with wipe2 effect (full 1080x1350 solid dimensions; transform scale stays 1.0 so rectangle is never enlarged to 2592x3240)
        let finalLocX = layer.locX;
        let finalLocY = layer.locY;
        let finalScaleX = 1.0;
        let finalScaleY = 1.0;

        const fillAttrs = useVideo
          ? `fillType="media" fillVideo="${videoUri}" mediaFillMode="fill"`
          : `fillType="color"`;
        xml += `${t}<shape id="${layer.index}" label="${layerLabel}" startTime="0" endTime="${totalTimeMs}" ${fillAttrs} s=".rect">\n`;

        xml += `${t}${t}<transform>\n`;
        if (layer.moveEnabled) {
          let easingAttr = '';
          if (layer.moveEasing) {
            const bezierParts = layer.moveEasing.replace(/,/g, ' ').trim().split(/\s+/);
            easingAttr = ` e="cubicBezier ${bezierParts.join(' ')}"`;
          }
          const projDurationSec = parseTimeToSeconds(state.projectDurationStr) || 1;
          const normStart = layer.flipStartT / projDurationSec;
          const normEnd = layer.flipEndT / projDurationSec;
          xml += `${t}${t}${t}<location>\n`;
          xml += `${t}${t}${t}${t}<kf t="${normStart.toFixed(6)}" v="${layer.moveStartX.toFixed(6)},${layer.moveStartY.toFixed(6)},0.000000"/>\n`;
          xml += `${t}${t}${t}${t}<kf t="${normEnd.toFixed(6)}" v="${layer.moveEndX.toFixed(6)},${layer.moveEndY.toFixed(6)},0.000000"${easingAttr}/>\n`;
          xml += `${t}${t}${t}</location>\n`;
        } else {
          xml += `${t}${t}${t}<location value="${finalLocX.toFixed(6)},${finalLocY.toFixed(6)},0.000000"/>\n`;
        }
        xml += `${t}${t}${t}<scale value="${finalScaleX.toFixed(6)},${finalScaleY.toFixed(6)}"/>\n`;
        xml += `${t}${t}</transform>\n`;

        if (!useVideo) xml += `${t}${t}<fillColor value="${amColor}"/>\n`;

        const isDiag = layer.isDiagonal || (layer.wipeAngle !== undefined && layer.wipeAngle % 90 !== 0);
        const wipeAngleVal = layer.wipeAngle !== undefined ? layer.wipeAngle : (state.splitDirection === 'horizontal' ? 90 : 0);
        const wipeStartVal = layer.wipeStart !== undefined ? layer.wipeStart : (wipeAngleVal === 90 ? layer.wipeYStart : layer.wipeXStart);
        const wipeEndVal = layer.wipeEnd !== undefined ? layer.wipeEnd : (wipeAngleVal === 90 ? layer.wipeYEnd : layer.wipeXEnd);

        if (isDiag || layer.wipeAngle !== undefined) {
          if (wipeStartVal > 0.0 || wipeEndVal < 1.0 || isDiag) {
            xml += `${t}${t}<effect id="com.alightcreative.effects.wipe2" locallyApplied="true">\n`;
            if (wipeEndVal < 1.0) xml += `${t}${t}${t}<property name="end" type="float" value="${wipeEndVal.toFixed(6)}"/>\n`;
            if (wipeStartVal > 0.0) xml += `${t}${t}${t}<property name="start" type="float" value="${wipeStartVal.toFixed(6)}"/>\n`;
            xml += `${t}${t}${t}<property name="angle" type="float" value="${wipeAngleVal.toFixed(6)}"/>\n`;
            if (state.wipeSoftness > 0) {
              xml += `${t}${t}${t}<property name="feather" type="float" value="${(state.wipeSoftness / 100).toFixed(6)}"/>\n`;
            }
            xml += `${t}${t}</effect>\n`;
          }
        } else {
          if (layer.wipeYStart > 0.0 || layer.wipeYEnd < 1.0) {
            xml += `${t}${t}<effect id="com.alightcreative.effects.wipe2" locallyApplied="true">\n`;
            if (layer.wipeYEnd < 1.0) xml += `${t}${t}${t}<property name="end" type="float" value="${layer.wipeYEnd.toFixed(6)}"/>\n`;
            if (layer.wipeYStart > 0.0) xml += `${t}${t}${t}<property name="start" type="float" value="${layer.wipeYStart.toFixed(6)}"/>\n`;
            xml += `${t}${t}${t}<property name="angle" type="float" value="90.000000"/>\n`;
            if (state.wipeSoftness > 0) {
              xml += `${t}${t}${t}<property name="feather" type="float" value="${(state.wipeSoftness / 100).toFixed(6)}"/>\n`;
            }
            xml += `${t}${t}</effect>\n`;
          }
          if (layer.wipeXStart > 0.0 || layer.wipeXEnd < 1.0) {
            xml += `${t}${t}<effect id="com.alightcreative.effects.wipe2" locallyApplied="true">\n`;
            if (layer.wipeXEnd < 1.0) xml += `${t}${t}${t}<property name="end" type="float" value="${layer.wipeXEnd.toFixed(6)}"/>\n`;
            if (layer.wipeXStart > 0.0) xml += `${t}${t}${t}<property name="start" type="float" value="${layer.wipeXStart.toFixed(6)}"/>\n`;
            xml += `${t}${t}${t}<property name="angle" type="float" value="0.000000"/>\n`;
            if (state.wipeSoftness > 0) {
              xml += `${t}${t}${t}<property name="feather" type="float" value="${(state.wipeSoftness / 100).toFixed(6)}"/>\n`;
            }
            xml += `${t}${t}</effect>\n`;
          }
        }

        xml += generateEffectsXml(layer, `${t}${t}`);

        if (state.animType === 'cube' || state.animType === 'boxv2' || state.wipeMethod === 'boxv2') {
          xml += `${t}${t}<property name="size" type="vec2" value="${(state.projectWidth / 2).toFixed(6)},${(state.projectHeight / 2).toFixed(6)}"/>\n`;
        } else {
          xml += `${t}${t}<property name="size" type="vec2" value="${(layer.width / 2).toFixed(6)},${(layer.height / 2).toFixed(6)}"/>\n`;
        }

        xml += `${t}</shape>\n`;
      }
    }

    xml += `</scene>\n`;

    return xml;
  }

  function highlightXMLCode(raw) {
    const escaped = raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return escaped.replace(/(&lt;!--[\s\S]*?--&gt;)|(&lt;\?[\s\S]*?\?&gt;)|(&lt;\/?)([\w:-]+)((?:(?!&gt;)[\s\S])*)(\/?&gt;)/g, (match, comment, decl, tagOpen, tagName, attrs, tagClose) => {
      if (comment) return `<span class="xml-comment">${comment}</span>`;
      if (decl) return `<span class="xml-decl">${decl}</span>`;
      let formattedAttrs = '';
      if (attrs) {
        formattedAttrs = attrs.replace(/([\w:-]+)(=)("[^"]*")/g, '<span class="xml-attr">$1</span>$2<span class="xml-val">$3</span>');
      }
      return `${tagOpen}<span class="xml-tag">${tagName}</span>${formattedAttrs}${tagClose}`;
    });
  }

  function renderXML() {
    const raw = generateAlightMotionXML();
    xmlCode.innerHTML = highlightXMLCode(raw);
  }

  function updateHUD() {
    if (hudSlice) {
      hudSlice.textContent = state.wipeMethod === 'mask' ? 'MASK' : (state.wipeMethod === 'boxv2' ? 'BOX V2' : 'WIPE');
    }
    if (slicingBadge) {
      const isBoxV2Active = state.wipeMethod === 'boxv2' || state.animType === 'boxv2';
      slicingBadge.textContent = state.wipeMethod === 'mask'
        ? '4:5 MASK ACTIVE'
        : (isBoxV2Active ? `BOX V2 · ${state.projectWidth}×${state.projectHeight}` : '4:5 MASK');
    }
    if (boxV2FormulaBadge && state.boxv2) {
      boxV2FormulaBadge.textContent = `Rect ${state.projectWidth}×${state.projectHeight} · ${state.boxv2.layerScale.toFixed(2)}x Box`;
    }
    if (boxv2Preset240 && boxv2Preset100 && state.boxv2) {
      boxv2Preset240.classList.toggle('active', Math.abs(state.boxv2.layerScale - 2.40) < 0.01);
      boxv2Preset100.classList.toggle('active', Math.abs(state.boxv2.layerScale - 1.00) < 0.01);
    }
    if (preset45Fit && preset45Full) {
      preset45Fit.classList.toggle('active', Math.abs(state.solidWidth - 650) < 1 && Math.abs(state.solidHeight - 812.5) < 1);
      preset45Full.classList.toggle('active', Math.abs(state.solidWidth - 1080) < 1 && Math.abs(state.solidHeight - 1350) < 1);
    }
    const layers = calculateLayers();
    const hudLayers = $('#hudLayers');
    if (hudLayers) hudLayers.textContent = layers.length;
    const hudMode = $('#hudMode');
    if (hudMode) hudMode.textContent = state.animType.toUpperCase();
    const hudRes = $('#hudRes');
    if (hudRes) hudRes.textContent = `${state.projectWidth} × ${state.projectHeight}`;
    const hudFps = $('#hudFps');
    if (hudFps) hudFps.textContent = state.fps;
    const mobileHeroSpecs = $('#mobileHeroSpecs');
    if (mobileHeroSpecs) mobileHeroSpecs.textContent = `${layers.length} Layers · ${state.projectWidth} × ${state.projectHeight} · Tap to Export`;
  }

  // ---- Full Update ----
  function fullUpdate() {
    updateProjectSize();
    updateFormulas();
    updateLayerTable();
    updateScrubberUI();
    updateHUD();
    renderXML();
    renderPreview();
  }

  // ---- Playback Loop ----
  let animFrameId = null;
  let lastTimeMs = 0;

  function togglePlay() {
    state.isPlaying = !state.isPlaying;
    document.body.classList.toggle('is-playing', state.isPlaying);
    if (playBtn) playBtn.classList.toggle('playing', state.isPlaying);
    if (state.isPlaying) {
      if (playIcon) playIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>';
      const durationSec = parseTimeToSeconds(state.projectDurationStr) || 1;
      if (state.currentTimeSec >= durationSec) state.currentTimeSec = 0;
      lastTimeMs = performance.now();
      animFrameId = requestAnimationFrame(playLoop);
    } else {
      if (playIcon) playIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
      if (animFrameId) cancelAnimationFrame(animFrameId);
    }
  }

  function playLoop(now) {
    if (!state.isPlaying) return;
    const deltaMs = now - lastTimeMs;
    lastTimeMs = now;
    state.currentTimeSec += deltaMs / 1000;
    
    const durationSec = parseTimeToSeconds(state.projectDurationStr) || 1;
    if (state.currentTimeSec >= durationSec) {
      if (state.loop !== false) {
        state.currentTimeSec = 0;
      } else {
        state.currentTimeSec = durationSec;
        togglePlay();
        updateScrubberUI();
        renderPreview(state.currentTimeSec);
        return;
      }
    }
    
    updateScrubberUI();
    renderPreview(state.currentTimeSec);
    if (state.isPlaying) animFrameId = requestAnimationFrame(playLoop);
  }

  function updateScrubberUI() {
    const durationSec = parseTimeToSeconds(state.projectDurationStr) || 1;
    if (playbackScrubber) {
      playbackScrubber.max = durationSec;
      playbackScrubber.value = state.currentTimeSec;
    }
    const timeFormatted = state.currentTimeSec.toFixed(2) + 's';
    if (playbackTimeDisplay) playbackTimeDisplay.textContent = timeFormatted;
    const hudTime = document.getElementById('hudTimecode');
    if (hudTime) hudTime.textContent = timeFormatted;
  }

  playBtn.addEventListener('click', togglePlay);
  playbackScrubber.addEventListener('input', () => {
    state.currentTimeSec = parseFloat(playbackScrubber.value);
    updateScrubberUI();
    renderPreview(state.currentTimeSec);
  });

  // ---- Event Handlers ----

  // Slicing Method (Wipe vs Masking vs Box V2 Mode)
  if (wipeMethodToggleGroup) {
    wipeMethodToggleGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('.toggle-btn');
      if (!btn) return;
      if (state.animType === 'hollowbox' && btn.dataset.value !== 'mask') {
        showToast('Hollow Box animation is locked to Masking mode. Switch animation type first.', true);
        return;
      }
      wipeMethodToggleGroup.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.wipeMethod = btn.dataset.value;
      if (maskingOptions) {
        maskingOptions.style.display = state.wipeMethod === 'mask' ? 'block' : 'none';
      }
      if (wipeOptions) {
        wipeOptions.style.display = state.wipeMethod === 'wipe' ? 'block' : 'none';
      }
      if (boxV2Options) {
        boxV2Options.style.display = (state.wipeMethod === 'boxv2' || state.animType === 'boxv2') ? 'block' : 'none';
      }
      if (state.wipeMethod === 'boxv2' || state.animType === 'boxv2') {
        state.solidWidth = state.projectWidth;
        state.solidHeight = state.projectHeight;
        if (solidWidthInput) solidWidthInput.value = state.projectWidth;
        if (solidHeightInput) solidHeightInput.value = state.projectHeight;
      }
      if (state.wipeMethod === 'boxv2') {
        if (state.animType !== 'boxv2') {
          state.animType = 'boxv2';
          if (animTypeToggleGroup) {
            animTypeToggleGroup.querySelectorAll('.toggle-btn').forEach(b => {
              b.classList.toggle('active', b.dataset.value === 'boxv2');
            });
          }
          if (boxEffectControls) boxEffectControls.style.display = 'none';
          if (hollowBoxEffectControls) hollowBoxEffectControls.style.display = 'none';
          if (globalTimingControls) globalTimingControls.style.display = 'block';
          renderSectionsUI();
        }
      }
      fullUpdate();
    });
  }

  // Box V2 Parameter Handlers
  function syncBoxV2RotationsToSections() {
    if (!state.sections) return;
    state.sections.forEach(sec => {
      if (!sec.subSections) return;
      sec.subSections.forEach(sub => {
        sub.boxv2XStart = state.boxv2.rotStartX;
        sub.boxv2YStart = state.boxv2.rotStartY;
        sub.boxv2ZStart = state.boxv2.rotStartZ;
        sub.boxv2XEnd = state.boxv2.rotEndX;
        sub.boxv2YEnd = state.boxv2.rotEndY;
        sub.boxv2ZEnd = state.boxv2.rotEndZ;
      });
    });
    if (state.animType === 'boxv2' || state.wipeMethod === 'boxv2') {
      renderSectionsUI();
    }
  }

  if (boxv2Preset240) {
    boxv2Preset240.addEventListener('click', () => {
      state.boxv2.layerScale = 2.40;
      if (boxv2LayerScaleInput) boxv2LayerScaleInput.value = 2.40;
      fullUpdate();
    });
  }

  if (boxv2Preset100) {
    boxv2Preset100.addEventListener('click', () => {
      state.boxv2.layerScale = 1.00;
      if (boxv2LayerScaleInput) boxv2LayerScaleInput.value = 1.00;
      fullUpdate();
    });
  }

  if (boxv2StartXInput) {
    boxv2StartXInput.addEventListener('input', () => {
      const val = parseFloat(boxv2StartXInput.value) || 0;
      state.boxv2.startX = val;
      state.boxv2.rotStartX = val;
      syncBoxV2RotationsToSections();
      fullUpdate();
    });
  }
  if (boxv2StartYInput) {
    boxv2StartYInput.addEventListener('input', () => {
      const val = parseFloat(boxv2StartYInput.value) || 0;
      state.boxv2.startY = val;
      state.boxv2.rotStartY = val;
      syncBoxV2RotationsToSections();
      fullUpdate();
    });
  }
  if (boxv2StartZInput) {
    boxv2StartZInput.addEventListener('input', () => {
      const val = parseFloat(boxv2StartZInput.value) || 0;
      state.boxv2.startZ = val;
      state.boxv2.rotStartZ = val;
      syncBoxV2RotationsToSections();
      fullUpdate();
    });
  }
  if (boxv2EndXInput) {
    boxv2EndXInput.addEventListener('input', () => {
      const val = parseFloat(boxv2EndXInput.value) || 0;
      state.boxv2.endX = val;
      state.boxv2.rotEndX = val;
      syncBoxV2RotationsToSections();
      fullUpdate();
    });
  }
  if (boxv2EndYInput) {
    boxv2EndYInput.addEventListener('input', () => {
      const val = parseFloat(boxv2EndYInput.value) || 0;
      state.boxv2.endY = val;
      state.boxv2.rotEndY = val;
      syncBoxV2RotationsToSections();
      fullUpdate();
    });
  }
  if (boxv2EndZInput) {
    boxv2EndZInput.addEventListener('input', () => {
      const val = parseFloat(boxv2EndZInput.value) || 0;
      state.boxv2.endZ = val;
      state.boxv2.rotEndZ = val;
      syncBoxV2RotationsToSections();
      fullUpdate();
    });
  }
  if (boxv2LayerScaleInput) {
    boxv2LayerScaleInput.addEventListener('input', () => {
      const val = parseFloat(boxv2LayerScaleInput.value);
      if (!isNaN(val) && val > 0) {
        state.boxv2.layerScale = val;
        fullUpdate();
      }
    });
  }
  if (boxv2BoxScaleInput) {
    boxv2BoxScaleInput.addEventListener('input', () => {
      const val = parseFloat(boxv2BoxScaleInput.value);
      if (!isNaN(val) && val > 0) {
        state.boxv2.boxScale = val;
        fullUpdate();
      }
    });
  }
  if (boxv2BoxHeightInput) {
    boxv2BoxHeightInput.addEventListener('input', () => {
      const val = parseFloat(boxv2BoxHeightInput.value);
      if (!isNaN(val) && val > 0) {
        state.boxv2.boxHeight = val;
        fullUpdate();
      }
    });
  }
  if (boxv2StretchAngleInput) {
    boxv2StretchAngleInput.addEventListener('input', () => {
      const val = parseFloat(boxv2StretchAngleInput.value);
      if (!isNaN(val)) {
        state.boxv2.stretchAngle = val;
        fullUpdate();
      }
    });
  }
  if (boxv2StretchScaleInput) {
    boxv2StretchScaleInput.addEventListener('input', () => {
      const val = parseFloat(boxv2StretchScaleInput.value);
      if (!isNaN(val) && val > 0) {
        state.boxv2.stretchScale = val;
        fullUpdate();
      }
    });
  }

  // 4:5 Presets
  if (preset45Fit) {
    preset45Fit.addEventListener('click', () => {
      state.solidWidth = 650;
      state.solidHeight = 812.5;
      state.aspectLocked = true;
      solidWidthInput.value = 650;
      solidHeightInput.value = 812.5;
      aspectLinkBtn.classList.add('active');
      aspectHint.textContent = 'Ratio locked at 4:5 (Project 294 Match)';
      fullUpdate();
    });
  }

  if (preset45Full) {
    preset45Full.addEventListener('click', () => {
      state.solidWidth = 1080;
      state.solidHeight = 1350;
      state.aspectLocked = true;
      solidWidthInput.value = 1080;
      solidHeightInput.value = 1350;
      aspectLinkBtn.classList.add('active');
      aspectHint.textContent = 'Ratio locked at 4:5 (Full Screen)';
      fullUpdate();
    });
  }

  // XML Masking Grouping Toggle
  if (maskGroupToggle) {
    maskGroupToggle.addEventListener('click', (e) => {
      const btn = e.target.closest('.toggle-btn');
      if (!btn) return;
      maskGroupToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.maskEmbedScene = (btn.dataset.value === 'embed');
      fullUpdate();
    });
  }

  // Split direction
  splitDirectionGroup.addEventListener('click', (e) => {
    const btn = e.target.closest('.toggle-btn');
    if (!btn) return;
    splitDirectionGroup.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.splitDirection = btn.dataset.value;
    if (state.splitDirection === 'horizontal') {
      state.wipeAngle = 90;
    } else if (state.splitDirection === 'vertical') {
      state.wipeAngle = 0;
    } else if (state.splitDirection === 'diagonal') {
      state.wipeAngle = 45;
    } else if (state.splitDirection === 'diagonal-desc') {
      state.wipeAngle = 135;
    }
    if (wipeAngleInput) wipeAngleInput.value = state.wipeAngle;
    if (wipeAngleValue) wipeAngleValue.textContent = state.wipeAngle + '°';
    if (typeof syncWipeAnglePresetsUI === 'function') syncWipeAnglePresetsUI();
    fullUpdate();
  });

  // Video layer toggle
  function syncVideoLayerUI() {
    videoLayerToggle.querySelectorAll('.toggle-btn').forEach(b =>
      b.classList.toggle('active', (b.dataset.value === 'on') === state.videoLayer));
    videoLayerControls.style.display = state.videoLayer ? 'block' : 'none';
    videoUriInput.value = state.videoUri;
    videoDurationInput.value = state.videoDurationMs;
  }

  videoLayerToggle.addEventListener('click', (e) => {
    const btn = e.target.closest('.toggle-btn');
    if (!btn) return;
    state.videoLayer = btn.dataset.value === 'on';
    syncVideoLayerUI();
    fullUpdate();
  });

  videoUriInput.addEventListener('input', (e) => {
    state.videoUri = e.target.value;
    fullUpdate();
  });

  videoDurationInput.addEventListener('input', (e) => {
    state.videoDurationMs = parseInt(e.target.value) || 0;
    fullUpdate();
  });

  // Project size
  projectScaleSelect.addEventListener('change', () => {
    fullUpdate();
  });

  // Aspect ratio link/unlink
  aspectLinkBtn.addEventListener('click', () => {
    state.aspectLocked = !state.aspectLocked;
    aspectLinkBtn.classList.toggle('active', state.aspectLocked);

    if (state.aspectLocked) {
      // Re-linking: snap height to 4:5 ratio based on current width
      state.solidHeight = state.solidWidth * 5 / 4;
      solidHeightInput.value = state.solidHeight;
      aspectHint.textContent = 'Ratio locked at 4:5';
    } else {
      aspectHint.textContent = 'Ratio unlocked — free size';
    }
    fullUpdate();
  });

  // Solid width
  solidWidthInput.addEventListener('input', () => {
    const w = parseFloat(solidWidthInput.value);
    if (!isNaN(w) && w > 0) {
      state.solidWidth = w;
      if (state.aspectLocked) {
        state.solidHeight = w * 5 / 4;
        solidHeightInput.value = state.solidHeight;
      }
      fullUpdate();
    }
  });

  // Solid height
  solidHeightInput.addEventListener('input', () => {
    const h = parseFloat(solidHeightInput.value);
    if (!isNaN(h) && h > 0) {
      state.solidHeight = h;
      if (state.aspectLocked) {
        state.solidWidth = h * 4 / 5;
        solidWidthInput.value = state.solidWidth;
      }
      fullUpdate();
    }
  });

  // Solid color
  solidColorInput.addEventListener('input', () => {
    state.solidColor = solidColorInput.value;
    colorValueSpan.textContent = solidColorInput.value;
    fullUpdate();
  });

  const wipeAnglePresets = $('#wipeAnglePresets');

  function syncWipeAnglePresetsUI() {
    if (!wipeAnglePresets) return;
    wipeAnglePresets.querySelectorAll('.preset-pill').forEach(pill => {
      const pAngle = parseFloat(pill.dataset.angle);
      pill.classList.toggle('active', Math.abs(state.wipeAngle - pAngle) < 0.5);
    });
  }

  // Wipe angle
  if (wipeAngleInput) {
    wipeAngleInput.addEventListener('input', () => {
      state.wipeAngle = parseFloat(wipeAngleInput.value);
      wipeAngleValue.textContent = state.wipeAngle + '°';
      
      // Auto-sync splitDirection button
      let targetSplit = null;
      if (state.wipeAngle === 90) targetSplit = 'horizontal';
      else if (state.wipeAngle === 0 || state.wipeAngle === 360) targetSplit = 'vertical';
      else if (state.wipeAngle === 45) targetSplit = 'diagonal';
      else if (state.wipeAngle === 135) targetSplit = 'diagonal-desc';
      else targetSplit = 'diagonal';

      if (targetSplit && splitDirectionGroup) {
        splitDirectionGroup.querySelectorAll('.toggle-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.value === targetSplit);
        });
        state.splitDirection = targetSplit;
      }
      syncWipeAnglePresetsUI();
      fullUpdate();
    });
  }

  if (wipeAnglePresets) {
    wipeAnglePresets.addEventListener('click', (e) => {
      const pill = e.target.closest('.preset-pill');
      if (!pill) return;
      const angle = parseFloat(pill.dataset.angle);
      state.wipeAngle = angle;
      if (wipeAngleInput) wipeAngleInput.value = angle;
      if (wipeAngleValue) wipeAngleValue.textContent = angle + '°';

      let targetSplit = null;
      if (angle === 90) targetSplit = 'horizontal';
      else if (angle === 0) targetSplit = 'vertical';
      else if (angle === 45 || Math.abs(angle - 51.34) < 0.1) targetSplit = 'diagonal';
      else if (angle === 135) targetSplit = 'diagonal-desc';

      if (targetSplit && splitDirectionGroup) {
        splitDirectionGroup.querySelectorAll('.toggle-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.value === targetSplit);
        });
        state.splitDirection = targetSplit;
      }
      syncWipeAnglePresetsUI();
      fullUpdate();
    });
  }

  // Wipe softness
  if (wipeSoftnessInput) {
    wipeSoftnessInput.addEventListener('input', () => {
      state.wipeSoftness = parseInt(wipeSoftnessInput.value);
      wipeSoftnessValue.textContent = state.wipeSoftness;
      fullUpdate();
    });
  }

  // Animation & Timing
  projectDurationInput.addEventListener('input', () => {
    state.projectDurationStr = projectDurationInput.value;
    fullUpdate();
  });
  projectFpsInput.addEventListener('input', () => {
    state.fps = parseInt(projectFpsInput.value) || 60;
    fullUpdate();
  });
  beat1Input.addEventListener('input', () => {
    state.beat1Str = beat1Input.value;
    fullUpdate();
  });
  beat2Input.addEventListener('input', () => {
    state.beat2Str = beat2Input.value;
    fullUpdate();
  });
  beat3Input.addEventListener('input', () => {
    state.beat3Str = beat3Input.value;
    fullUpdate();
  });
  animTypeToggleGroup.addEventListener('click', (e) => {
    const btn = e.target.closest('.toggle-btn');
    if (!btn) return;
    animTypeToggleGroup.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.animType = btn.dataset.value;

    if (state.animType === 'hollowbox') {
      if (state.wipeMethod !== 'mask') {
        state.wipeMethod = 'mask';
        if (wipeMethodToggleGroup) {
          wipeMethodToggleGroup.querySelectorAll('.toggle-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.value === 'mask');
          });
        }
        if (maskingOptions) maskingOptions.style.display = 'block';
        if (wipeOptions) wipeOptions.style.display = 'none';
        if (boxV2Options) boxV2Options.style.display = 'none';
        showToast('Hollow Box animation is locked to Masking mode. Mask mode activated.');
      } else {
        showToast('Hollow Box animation active (Alight Motion 3D + Stretch Axis).');
      }
    } else if (state.animType === 'boxv2') {
      state.solidWidth = state.projectWidth;
      state.solidHeight = state.projectHeight;
      if (solidWidthInput) solidWidthInput.value = state.projectWidth;
      if (solidHeightInput) solidHeightInput.value = state.projectHeight;
      if (state.wipeMethod === 'mask') {
        state.wipeMethod = 'boxv2';
        if (wipeMethodToggleGroup) {
          wipeMethodToggleGroup.querySelectorAll('.toggle-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.value === 'boxv2');
          });
        }
        if (maskingOptions) maskingOptions.style.display = 'none';
        if (wipeOptions) wipeOptions.style.display = 'none';
      }
      if (boxV2Options) boxV2Options.style.display = 'block';
      showToast(`Box V2 active (${state.projectWidth}×${state.projectHeight} rectangle · Wipe2 + Box 3D X/Y/Z + Stretch2).`);
    } else {
      if (state.wipeMethod === 'boxv2') {
        state.wipeMethod = 'wipe';
        if (wipeMethodToggleGroup) {
          wipeMethodToggleGroup.querySelectorAll('.toggle-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.value === 'wipe');
          });
        }
        if (maskingOptions) maskingOptions.style.display = 'none';
        if (wipeOptions) wipeOptions.style.display = 'block';
      }
      if (boxV2Options) boxV2Options.style.display = 'none';
      showToast('Experimental feature — animation types are still in development.');
    }

    // Show/hide Box & Hollow Box controls
    if (boxEffectControls) {
      boxEffectControls.style.display = state.animType === 'box' ? 'block' : 'none';
    }
    if (hollowBoxEffectControls) {
      hollowBoxEffectControls.style.display = state.animType === 'hollowbox' ? 'block' : 'none';
    }
    if (globalTimingControls) {
      globalTimingControls.style.display = (state.animType === 'box' || state.animType === 'hollowbox') ? 'none' : 'block';
    }

    renderSectionsUI();
    fullUpdate();
  });
  flipPivotXInput.addEventListener('input', () => {
    state.flipPivotX = parseFloat(flipPivotXInput.value) || 0;
    fullUpdate();
  });
  flipPivotYInput.addEventListener('input', () => {
    state.flipPivotY = parseFloat(flipPivotYInput.value) || 0;
    fullUpdate();
  });

  function handleAutoFixPivotToggle(value) {
    state.autoFixPivot = (value === 'on');
    [wipeAutoFixPivotToggle, autoFixPivotToggle].forEach(group => {
      if (!group) return;
      group.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === (state.autoFixPivot ? 'on' : 'off'));
      });
    });
    fullUpdate();
  }

  if (wipeAutoFixPivotToggle) {
    wipeAutoFixPivotToggle.addEventListener('click', (e) => {
      const btn = e.target.closest('.toggle-btn');
      if (!btn) return;
      handleAutoFixPivotToggle(btn.dataset.value);
    });
  }

  if (autoFixPivotToggle) {
    autoFixPivotToggle.addEventListener('click', (e) => {
      const btn = e.target.closest('.toggle-btn');
      if (!btn) return;
      handleAutoFixPivotToggle(btn.dataset.value);
    });
  }

  function setSectionCount(val) {
    if (val < 1) val = 1;
    if (val > 10) val = 10;
    state.sectionCount = val;
    sectionCountInput.value = val;
    
    while (state.sections.length < val) {
      const last = state.sections[state.sections.length - 1];
      const newSec = { ...last };
      if (last.subSections) {
        newSec.subSections = last.subSections.map(sub => ({ ...sub }));
      }
      state.sections.push(newSec);
    }
    while (state.sections.length > val) {
      state.sections.pop();
    }
    
    renderSectionsUI();
    fullUpdate();
  }

  sectionCountInput.addEventListener('input', () => {
    setSectionCount(parseInt(sectionCountInput.value) || 1);
  });
  sectionMinusBtn.addEventListener('click', () => setSectionCount(state.sectionCount - 1));
  sectionPlusBtn.addEventListener('click', () => setSectionCount(state.sectionCount + 1));

  // Modal and Graph Message Listener
  let currentEditingTarget = 'global'; // 'global', 'box-orient', 'box-rotate', or 'sub-section-X-Y'

  openGraphBtn.addEventListener('click', () => {
    currentEditingTarget = 'global';
    graphIframe.style.display = 'block';
    graphIframe2.style.display = 'none';
    graphModal.style.display = 'flex';
    const parts = state.flipEasing.split(',').map(Number);
    if (parts.length === 4 && graphIframe.contentWindow) {
      try {
        graphIframe.contentWindow.postMessage({
          type: 'SET_BEZIER',
          x1: parts[0], y1: parts[1], x2: parts[2], y2: parts[3]
        }, '*');
      } catch (err) {}
    }
  });
  
  closeGraphBtn.addEventListener('click', () => {
    graphModal.style.display = 'none';
  });

  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'BEZIER_UPDATE') {
      const { x1, y1, x2, y2 } = event.data;
      const easingStr = `${x1.toFixed(6)}, ${y1.toFixed(6)}, ${x2.toFixed(6)}, ${y2.toFixed(6)}`;
      
      if (currentEditingTarget === 'global') {
        state.flipEasing = easingStr;
      } else if (currentEditingTarget === 'box-orient') {
        state.box.orientEasing = easingStr;
      } else if (currentEditingTarget === 'box-rotate') {
        state.box.rotateEasing = easingStr;
      } else if (currentEditingTarget === 'hb-pos') {
        state.hollowbox.posEasing = easingStr;
      } else if (currentEditingTarget === 'hb-orient') {
        state.hollowbox.orientEasing = easingStr;
      } else if (currentEditingTarget === 'hb-rotate') {
        state.hollowbox.rotateEasing = easingStr;
      } else if (currentEditingTarget === 'hb-geom') {
        state.hollowbox.geomEasing = easingStr;
      } else if (currentEditingTarget.startsWith('section-move-')) {
        const secIdx = parseInt(currentEditingTarget.replace('section-move-', ''));
        if (state.sections[secIdx]) {
          state.sections[secIdx].moveEasing = easingStr;
          const label = document.querySelector(`.section-block[data-index="${secIdx}"] .sec-move-curve-label`);
          if (label) label.textContent = easingStr;
        }
      } else if (currentEditingTarget.startsWith('sub-section-')) {
        const parts = currentEditingTarget.replace('sub-section-', '').split('-').map(Number);
        const secIdx = parts[0];
        const subIdx = parts[1];
        if (state.sections[secIdx] && state.sections[secIdx].subSections[subIdx]) {
          state.sections[secIdx].subSections[subIdx].easing = easingStr;
        }
      } else if (currentEditingTarget.startsWith('hb-step-')) {
        const stepIdx = parseInt(currentEditingTarget.replace('hb-step-', ''));
        if (typeof onHollowBoxBezierUpdate === 'function') {
          onHollowBoxBezierUpdate(stepIdx, easingStr);
        }
      }
      fullUpdate();
    }
  });

  // Toggle XML Visibility
  let xmlVisible = false;
  toggleXmlBtn.addEventListener('click', () => {
    xmlVisible = !xmlVisible;
    xmlCodeContainer.style.display = xmlVisible ? 'block' : 'none';
    
    if (xmlVisible) {
      toggleXmlBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
          <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
      `;
      toggleXmlBtn.title = "Hide XML";
    } else {
      toggleXmlBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      `;
      toggleXmlBtn.title = "Show XML";
    }
  });

  // Copy XML
  copyXmlBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(generateAlightMotionXML());
      showToast('Copied XML to clipboard!');
    } catch (err) {
      // Fallback for browsers that don't support navigator.clipboard
      try {
        const textarea = document.createElement('textarea');
        textarea.value = generateAlightMotionXML();
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Copied XML to clipboard!');
      } catch (fallbackErr) {
        console.error("Fallback copy failed:", fallbackErr);
        showToast('Failed to copy XML.', true);
      }
    }
  });

  // ---- Settings Import/Export ----

  function deepMerge(target, source) {
    const isObject = (obj) => obj && typeof obj === 'object' && !Array.isArray(obj);

    // Create a new object to avoid modifying the original target state directly
    let output = { ...target };

    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const sourceValue = source[key];
        const targetValue = target[key];

        // Recurse for nested objects
        if (isObject(targetValue) && isObject(sourceValue)) {
          output[key] = deepMerge(targetValue, sourceValue);
        }
        // Handle arrays: overwrite target array with source array
        // This is a simpler approach than deep-merging array elements, which can be complex.
        // It assumes the imported array is complete and valid.
        else if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
          output[key] = sourceValue;
        }
        // Handle primitive values
        else if (targetValue !== undefined && typeof targetValue === typeof sourceValue) {
          output[key] = sourceValue;
        }
        // Otherwise, ignore the key from the source to prevent pollution
      }
    }
    return output;
  }


  copySettingsBtn.addEventListener('click', () => {
    try {
      // Create a clean copy of the state for serialization
      const stateToSave = { ...state };
      // These are not useful to save as they are runtime-specific
      delete stateToSave.isPlaying;
      delete stateToSave.currentTimeSec;

      const settingsString = JSON.stringify(stateToSave);
      const encodedSettings = btoa(settingsString);
      navigator.clipboard.writeText(encodedSettings);
      showToast('Settings copied to clipboard!');
    } catch (error) {
      console.error("Error copying settings:", error);
      showToast('Error copying settings.', true);
    }
  });

  importSettingsBtn.addEventListener('click', () => {
    const encodedSettings = prompt("Paste your settings string below:");
    if (!encodedSettings || encodedSettings.trim() === '') return;

    try {
      const settingsString = atob(encodedSettings);
      const importedState = JSON.parse(settingsString);

      // Safely merge the imported state into the current state
      const newState = deepMerge(state, importedState);
      
      // Now, we need to re-assign the new properties back to the original state object
      // This preserves the original state object reference, which is important for the app.
      Object.keys(newState).forEach(key => {
        state[key] = newState[key];
      });

      // Refresh UI with new values from the merged state
      updateUIFromState();
      
      showToast('Settings imported successfully!');
    } catch (error) {
      console.error("Error importing settings:", error);
      showToast('Invalid or corrupted settings string.', true);
    }
  });

  function updateUIFromState() {
    // Update all input fields and UI elements to reflect the current state
    projectScaleSelect.value = state.projectWidth / state.baseWidth;
    solidWidthInput.value = state.solidWidth;
    solidHeightInput.value = state.solidHeight;
    aspectLinkBtn.classList.toggle('active', state.aspectLocked);
    solidColorInput.value = state.solidColor;
    colorValueSpan.textContent = state.solidColor;
    
    const splitBtn = document.querySelector(`#splitDirection .toggle-btn[data-value='${state.splitDirection}']`);
    if (splitBtn) {
      document.querySelectorAll('#splitDirection .toggle-btn').forEach(b => b.classList.remove('active'));
      splitBtn.classList.add('active');
    }
    if (wipeAngleInput) wipeAngleInput.value = state.wipeAngle !== undefined ? state.wipeAngle : 0;
    if (wipeAngleValue) wipeAngleValue.textContent = (state.wipeAngle !== undefined ? state.wipeAngle : 0) + '°';
    if (wipeSoftnessInput) wipeSoftnessInput.value = state.wipeSoftness !== undefined ? state.wipeSoftness : 0;
    if (wipeSoftnessValue) wipeSoftnessValue.textContent = state.wipeSoftness !== undefined ? state.wipeSoftness : 0;
    if (typeof syncWipeAnglePresetsUI === 'function') syncWipeAnglePresetsUI();
    if (wipeMethodToggleGroup) {
      const wBtn = wipeMethodToggleGroup.querySelector(`.toggle-btn[data-value='${state.wipeMethod || 'mask'}']`);
      if (wBtn) {
        wipeMethodToggleGroup.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
        wBtn.classList.add('active');
      }
    }
    if (maskingOptions) {
      maskingOptions.style.display = state.wipeMethod === 'mask' ? 'block' : 'none';
    }
    if (wipeOptions) {
      wipeOptions.style.display = state.wipeMethod === 'wipe' ? 'block' : 'none';
    }
    if (boxV2Options) {
      boxV2Options.style.display = (state.wipeMethod === 'boxv2' || state.animType === 'boxv2') ? 'block' : 'none';
    }
    if (state.boxv2) {
      const sx = state.boxv2.rotStartX !== undefined ? state.boxv2.rotStartX : (state.boxv2.startX !== undefined ? state.boxv2.startX : 0);
      const sy = state.boxv2.rotStartY !== undefined ? state.boxv2.rotStartY : (state.boxv2.startY !== undefined ? state.boxv2.startY : 0);
      const sz = state.boxv2.rotStartZ !== undefined ? state.boxv2.rotStartZ : (state.boxv2.startZ !== undefined ? state.boxv2.startZ : 0);
      const ex = state.boxv2.rotEndX !== undefined ? state.boxv2.rotEndX : (state.boxv2.endX !== undefined ? state.boxv2.endX : 0);
      const ey = state.boxv2.rotEndY !== undefined ? state.boxv2.rotEndY : (state.boxv2.endY !== undefined ? state.boxv2.endY : 90);
      const ez = state.boxv2.rotEndZ !== undefined ? state.boxv2.rotEndZ : (state.boxv2.endZ !== undefined ? state.boxv2.endZ : 0);
      state.boxv2.rotStartX = state.boxv2.startX = sx;
      state.boxv2.rotStartY = state.boxv2.startY = sy;
      state.boxv2.rotStartZ = state.boxv2.startZ = sz;
      state.boxv2.rotEndX = state.boxv2.endX = ex;
      state.boxv2.rotEndY = state.boxv2.endY = ey;
      state.boxv2.rotEndZ = state.boxv2.endZ = ez;
      if (boxv2StartXInput) boxv2StartXInput.value = sx;
      if (boxv2StartYInput) boxv2StartYInput.value = sy;
      if (boxv2StartZInput) boxv2StartZInput.value = sz;
      if (boxv2EndXInput) boxv2EndXInput.value = ex;
      if (boxv2EndYInput) boxv2EndYInput.value = ey;
      if (boxv2EndZInput) boxv2EndZInput.value = ez;
      if (boxv2LayerScaleInput) boxv2LayerScaleInput.value = state.boxv2.layerScale !== undefined ? state.boxv2.layerScale : 2.40;
      if (boxv2BoxScaleInput) boxv2BoxScaleInput.value = state.boxv2.boxScale !== undefined ? state.boxv2.boxScale : 1.33;
      if (boxv2BoxHeightInput) boxv2BoxHeightInput.value = state.boxv2.boxHeight !== undefined ? state.boxv2.boxHeight : 1.00;
      if (boxv2StretchAngleInput) boxv2StretchAngleInput.value = state.boxv2.stretchAngle !== undefined ? state.boxv2.stretchAngle : 90;
      if (boxv2StretchScaleInput) boxv2StretchScaleInput.value = state.boxv2.stretchScale !== undefined ? state.boxv2.stretchScale : 1.25;
    }
    [wipeAutoFixPivotToggle, autoFixPivotToggle].forEach(group => {
      if (!group) return;
      group.querySelectorAll('.toggle-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.value === (state.autoFixPivot ? 'on' : 'off'));
      });
    });
    if (maskGroupToggle) {
      const gVal = state.maskEmbedScene !== false ? 'embed' : 'direct';
      const gBtn = maskGroupToggle.querySelector(`.toggle-btn[data-value='${gVal}']`);
      if (gBtn) {
        maskGroupToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
        gBtn.classList.add('active');
      }
    }
    syncVideoLayerUI();
    
    projectDurationInput.value = state.projectDurationStr;
    projectFpsInput.value = state.fps;
    beat1Input.value = state.beat1Str;
    beat2Input.value = state.beat2Str;
    beat3Input.value = state.beat3Str;

    document.querySelector(`#animTypeToggle .toggle-btn[data-value='${state.animType}']`).click();
    
    flipPivotXInput.value = state.flipPivotX;
    flipPivotYInput.value = state.flipPivotY;

    // Box controls
    boxOrientAllStartInput.value = state.box.orientAllStartStr;
    boxOrientFirstEndInput.value = state.box.orientFirstEndStr;
    boxOrientLastEndInput.value = state.box.orientLastEndStr;
    boxOrientStartXInput.value = state.box.orientStartX;
    boxOrientStartYInput.value = state.box.orientStartY;
    boxOrientStartZInput.value = state.box.orientStartZ;
    boxOrientEndXInput.value = state.box.orientEndX;
    boxOrientEndYInput.value = state.box.orientEndY;
    boxOrientEndZInput.value = state.box.orientEndZ;
    boxRotateAllStartInput.value = state.box.rotateAllStartStr;
    boxRotateFirstEndInput.value = state.box.rotateFirstEndStr;
    boxRotateLastEndInput.value = state.box.rotateLastEndStr;
    boxRotateStartXInput.value = state.box.rotateStartX;
    boxRotateStartYInput.value = state.box.rotateStartY;
    boxRotateStartZInput.value = state.box.rotateStartZ;
    boxRotateEndXInput.value = state.box.rotateEndX;
    boxRotateEndYInput.value = state.box.rotateEndY;
    boxRotateEndZInput.value = state.box.rotateEndZ;

    // Hollow Box controls
    if (state.hollowbox) {
      if (hbAllStartInput) hbAllStartInput.value = state.hollowbox.allStartStr;
      if (hbFirstEndInput) hbFirstEndInput.value = state.hollowbox.firstEndStr;
      if (hbLastEndInput) hbLastEndInput.value = state.hollowbox.lastEndStr;
      if (hbPosStartXInput) hbPosStartXInput.value = state.hollowbox.posStartX;
      if (hbPosStartYInput) hbPosStartYInput.value = state.hollowbox.posStartY;
      if (hbPosStartZInput) hbPosStartZInput.value = state.hollowbox.posStartZ;
      if (hbPosEndXInput) hbPosEndXInput.value = state.hollowbox.posEndX;
      if (hbPosEndYInput) hbPosEndYInput.value = state.hollowbox.posEndY;
      if (hbPosEndZInput) hbPosEndZInput.value = state.hollowbox.posEndZ;
      if (hbOrientStartXInput) hbOrientStartXInput.value = state.hollowbox.orientStartX;
      if (hbOrientStartYInput) hbOrientStartYInput.value = state.hollowbox.orientStartY;
      if (hbOrientStartZInput) hbOrientStartZInput.value = state.hollowbox.orientStartZ;
      if (hbOrientEndXInput) hbOrientEndXInput.value = state.hollowbox.orientEndX;
      if (hbOrientEndYInput) hbOrientEndYInput.value = state.hollowbox.orientEndY;
      if (hbOrientEndZInput) hbOrientEndZInput.value = state.hollowbox.orientEndZ;
      if (hbRotateStartXInput) hbRotateStartXInput.value = state.hollowbox.rotateStartX;
      if (hbRotateStartYInput) hbRotateStartYInput.value = state.hollowbox.rotateStartY;
      if (hbRotateStartZInput) hbRotateStartZInput.value = state.hollowbox.rotateStartZ;
      if (hbRotateEndXInput) hbRotateEndXInput.value = state.hollowbox.rotateEndX;
      if (hbRotateEndYInput) hbRotateEndYInput.value = state.hollowbox.rotateEndY;
      if (hbRotateEndZInput) hbRotateEndZInput.value = state.hollowbox.rotateEndZ;
      if (hbWidthStartInput) hbWidthStartInput.value = state.hollowbox.widthStart;
      if (hbWidthEndInput) hbWidthEndInput.value = state.hollowbox.widthEnd;
      if (hbHeightStartInput) hbHeightStartInput.value = state.hollowbox.heightStart;
      if (hbHeightEndInput) hbHeightEndInput.value = state.hollowbox.heightEnd;
      if (hbDepthInput) hbDepthInput.value = state.hollowbox.depth;
      if (hbScaleInput) hbScaleInput.value = state.hollowbox.scale;
      if (hbManualAngleInput) hbManualAngleInput.value = state.hollowbox.manualAngle;
      if (hbManualScaleInput) hbManualScaleInput.value = state.hollowbox.manualScale;
      if (hbStretchModeToggle) {
        hbStretchModeToggle.querySelectorAll('.toggle-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.value === (state.hollowbox.stretchMode || 'auto'));
        });
      }
      if (hbManualStretchControls) {
        hbManualStretchControls.style.display = state.hollowbox.stretchMode === 'manual' ? 'block' : 'none';
      }
    }

    sectionCountInput.value = state.sectionCount;

    // This will re-render the sections and sub-sections, which is crucial
    renderSectionsUI(); 
    // Finally, do a full update to recalculate everything and redraw the canvas
    fullUpdate();
  }

  // Download XML
  downloadXmlBtn.addEventListener('click', () => {
    const layers = calculateLayers();
    const xml = generateAlightMotionXML();
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wipe-layers-${layers.length}x-${state.projectWidth}x${state.projectHeight}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    showToast('Downloaded XML!');
  });

  // Box Control Handlers
  if (boxEffectControls) {
    boxOrientAllStartInput.addEventListener('input', () => { state.box.orientAllStartStr = boxOrientAllStartInput.value; fullUpdate(); });
    boxOrientFirstEndInput.addEventListener('input', () => { state.box.orientFirstEndStr = boxOrientFirstEndInput.value; fullUpdate(); });
    boxOrientLastEndInput.addEventListener('input', () => { state.box.orientLastEndStr = boxOrientLastEndInput.value; fullUpdate(); });
    boxOrientStartXInput.addEventListener('input', () => { state.box.orientStartX = parseFloat(boxOrientStartXInput.value) || 0; fullUpdate(); });
    boxOrientStartYInput.addEventListener('input', () => { state.box.orientStartY = parseFloat(boxOrientStartYInput.value) || 0; fullUpdate(); });
    boxOrientStartZInput.addEventListener('input', () => { state.box.orientStartZ = parseFloat(boxOrientStartZInput.value) || 0; fullUpdate(); });
    boxOrientEndXInput.addEventListener('input', () => { state.box.orientEndX = parseFloat(boxOrientEndXInput.value) || 0; fullUpdate(); });
    boxOrientEndYInput.addEventListener('input', () => { state.box.orientEndY = parseFloat(boxOrientEndYInput.value) || 0; fullUpdate(); });
    boxOrientEndZInput.addEventListener('input', () => { state.box.orientEndZ = parseFloat(boxOrientEndZInput.value) || 0; fullUpdate(); });
    
    boxRotateAllStartInput.addEventListener('input', () => { state.box.rotateAllStartStr = boxRotateAllStartInput.value; fullUpdate(); });
    boxRotateFirstEndInput.addEventListener('input', () => { state.box.rotateFirstEndStr = boxRotateFirstEndInput.value; fullUpdate(); });
    boxRotateLastEndInput.addEventListener('input', () => { state.box.rotateLastEndStr = boxRotateLastEndInput.value; fullUpdate(); });
    boxRotateStartXInput.addEventListener('input', () => { state.box.rotateStartX = parseFloat(boxRotateStartXInput.value) || 0; fullUpdate(); });
    boxRotateStartYInput.addEventListener('input', () => { state.box.rotateStartY = parseFloat(boxRotateStartYInput.value) || 0; fullUpdate(); });
    boxRotateStartZInput.addEventListener('input', () => { state.box.rotateStartZ = parseFloat(boxRotateStartZInput.value) || 0; fullUpdate(); });
    boxRotateEndXInput.addEventListener('input', () => { state.box.rotateEndX = parseFloat(boxRotateEndXInput.value) || 0; fullUpdate(); });
    boxRotateEndYInput.addEventListener('input', () => { state.box.rotateEndY = parseFloat(boxRotateEndYInput.value) || 0; fullUpdate(); });
    boxRotateEndZInput.addEventListener('input', () => { state.box.rotateEndZ = parseFloat(boxRotateEndZInput.value) || 0; fullUpdate(); });

    boxOrientEasingBtn.addEventListener('click', () => {
      currentEditingTarget = 'box-orient';
      graphIframe.style.display = 'block';
      graphIframe2.style.display = 'none';
      graphModal.style.display = 'flex';
    });

    boxRotateEasingBtn.addEventListener('click', () => {
      currentEditingTarget = 'box-rotate';
      graphIframe.style.display = 'none';
      graphIframe2.style.display = 'block';
      graphModal.style.display = 'flex';
    });
  }

  // Hollow Box Control Handlers
  if (hollowBoxEffectControls) {
    if (hbAllStartInput) hbAllStartInput.addEventListener('input', () => { state.hollowbox.allStartStr = hbAllStartInput.value; fullUpdate(); });
    if (hbFirstEndInput) hbFirstEndInput.addEventListener('input', () => { state.hollowbox.firstEndStr = hbFirstEndInput.value; fullUpdate(); });
    if (hbLastEndInput) hbLastEndInput.addEventListener('input', () => { state.hollowbox.lastEndStr = hbLastEndInput.value; fullUpdate(); });

    // Position tween inputs
    if (hbPosStartXInput) hbPosStartXInput.addEventListener('input', () => { state.hollowbox.posStartX = parseFloat(hbPosStartXInput.value) || 0; fullUpdate(); });
    if (hbPosStartYInput) hbPosStartYInput.addEventListener('input', () => { state.hollowbox.posStartY = parseFloat(hbPosStartYInput.value) || 0; fullUpdate(); });
    if (hbPosStartZInput) hbPosStartZInput.addEventListener('input', () => { state.hollowbox.posStartZ = parseFloat(hbPosStartZInput.value) || 0; fullUpdate(); });
    if (hbPosEndXInput) hbPosEndXInput.addEventListener('input', () => { state.hollowbox.posEndX = parseFloat(hbPosEndXInput.value) || 0; fullUpdate(); });
    if (hbPosEndYInput) hbPosEndYInput.addEventListener('input', () => { state.hollowbox.posEndY = parseFloat(hbPosEndYInput.value) || 0; fullUpdate(); });
    if (hbPosEndZInput) hbPosEndZInput.addEventListener('input', () => { state.hollowbox.posEndZ = parseFloat(hbPosEndZInput.value) || 0; fullUpdate(); });

    // Orientation tween inputs
    if (hbOrientStartXInput) hbOrientStartXInput.addEventListener('input', () => { state.hollowbox.orientStartX = parseFloat(hbOrientStartXInput.value) || 0; fullUpdate(); });
    if (hbOrientStartYInput) hbOrientStartYInput.addEventListener('input', () => { state.hollowbox.orientStartY = parseFloat(hbOrientStartYInput.value) || 0; fullUpdate(); });
    if (hbOrientStartZInput) hbOrientStartZInput.addEventListener('input', () => { state.hollowbox.orientStartZ = parseFloat(hbOrientStartZInput.value) || 0; fullUpdate(); });
    if (hbOrientEndXInput) hbOrientEndXInput.addEventListener('input', () => { state.hollowbox.orientEndX = parseFloat(hbOrientEndXInput.value) || 0; fullUpdate(); });
    if (hbOrientEndYInput) hbOrientEndYInput.addEventListener('input', () => { state.hollowbox.orientEndY = parseFloat(hbOrientEndYInput.value) || 0; fullUpdate(); });
    if (hbOrientEndZInput) hbOrientEndZInput.addEventListener('input', () => { state.hollowbox.orientEndZ = parseFloat(hbOrientEndZInput.value) || 0; fullUpdate(); });

    // Rotation tween inputs
    if (hbRotateStartXInput) hbRotateStartXInput.addEventListener('input', () => { state.hollowbox.rotateStartX = parseFloat(hbRotateStartXInput.value) || 0; fullUpdate(); });
    if (hbRotateStartYInput) hbRotateStartYInput.addEventListener('input', () => { state.hollowbox.rotateStartY = parseFloat(hbRotateStartYInput.value) || 0; fullUpdate(); });
    if (hbRotateStartZInput) hbRotateStartZInput.addEventListener('input', () => { state.hollowbox.rotateStartZ = parseFloat(hbRotateStartZInput.value) || 0; fullUpdate(); });
    if (hbRotateEndXInput) hbRotateEndXInput.addEventListener('input', () => { state.hollowbox.rotateEndX = parseFloat(hbRotateEndXInput.value) || 0; fullUpdate(); });
    if (hbRotateEndYInput) hbRotateEndYInput.addEventListener('input', () => { state.hollowbox.rotateEndY = parseFloat(hbRotateEndYInput.value) || 0; fullUpdate(); });
    if (hbRotateEndZInput) hbRotateEndZInput.addEventListener('input', () => { state.hollowbox.rotateEndZ = parseFloat(hbRotateEndZInput.value) || 0; fullUpdate(); });

    // Width & Height tween inputs
    if (hbWidthStartInput) hbWidthStartInput.addEventListener('input', () => { state.hollowbox.widthStart = parseFloat(hbWidthStartInput.value) || 0.01; fullUpdate(); });
    if (hbWidthEndInput) hbWidthEndInput.addEventListener('input', () => { state.hollowbox.widthEnd = parseFloat(hbWidthEndInput.value) || 0.01; fullUpdate(); });
    if (hbHeightStartInput) hbHeightStartInput.addEventListener('input', () => { state.hollowbox.heightStart = parseFloat(hbHeightStartInput.value) || 0.01; fullUpdate(); });
    if (hbHeightEndInput) hbHeightEndInput.addEventListener('input', () => { state.hollowbox.heightEnd = parseFloat(hbHeightEndInput.value) || 0.01; fullUpdate(); });

    // Base properties
    if (hbDepthInput) hbDepthInput.addEventListener('input', () => { state.hollowbox.depth = parseFloat(hbDepthInput.value) || 0.01; fullUpdate(); });
    if (hbScaleInput) hbScaleInput.addEventListener('input', () => { state.hollowbox.scale = parseFloat(hbScaleInput.value) || 1.0; fullUpdate(); });

    // Stretch formula mode
    if (hbStretchModeToggle) {
      hbStretchModeToggle.addEventListener('click', (e) => {
        const btn = e.target.closest('.toggle-btn');
        if (!btn) return;
        hbStretchModeToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.hollowbox.stretchMode = btn.dataset.value;
        if (hbManualStretchControls) {
          hbManualStretchControls.style.display = state.hollowbox.stretchMode === 'manual' ? 'block' : 'none';
        }
        fullUpdate();
      });
    }

    if (hbManualAngleInput) hbManualAngleInput.addEventListener('input', () => { state.hollowbox.manualAngle = parseFloat(hbManualAngleInput.value) || 0; fullUpdate(); });
    if (hbManualScaleInput) hbManualScaleInput.addEventListener('input', () => { state.hollowbox.manualScale = parseFloat(hbManualScaleInput.value) || 1.0; fullUpdate(); });

    // Graph editor modal openers for Hollow Box
    function openHbGraph(targetKey, currentEasing) {
      currentEditingTarget = targetKey;
      graphIframe.style.display = 'block';
      graphIframe2.style.display = 'none';
      graphModal.style.display = 'flex';
      const parts = (currentEasing || '0.25, 0.10, 0.25, 1.00').split(',').map(Number);
      if (parts.length === 4 && graphIframe.contentWindow) {
        try {
          graphIframe.contentWindow.postMessage({
            type: 'SET_BEZIER',
            x1: parts[0], y1: parts[1], x2: parts[2], y2: parts[3]
          }, '*');
        } catch (err) {}
      }
    }

    if (hbPosEasingBtn) hbPosEasingBtn.addEventListener('click', () => openHbGraph('hb-pos', state.hollowbox.posEasing));
    if (hbOrientEasingBtn) hbOrientEasingBtn.addEventListener('click', () => openHbGraph('hb-orient', state.hollowbox.orientEasing));
    if (hbRotateEasingBtn) hbRotateEasingBtn.addEventListener('click', () => openHbGraph('hb-rotate', state.hollowbox.rotateEasing));
    if (hbGeomEasingBtn) hbGeomEasingBtn.addEventListener('click', () => openHbGraph('hb-geom', state.hollowbox.geomEasing));
  }

  // Window resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => renderPreview(), 100);
  });

  // ---- Initialize ----
  if (wipeMethodToggleGroup) {
    const initBtn = wipeMethodToggleGroup.querySelector(`.toggle-btn[data-value='${state.wipeMethod}']`);
    if (initBtn) {
      wipeMethodToggleGroup.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      initBtn.classList.add('active');
    }
  }
  if (maskingOptions) {
    maskingOptions.style.display = state.wipeMethod === 'mask' ? 'block' : 'none';
  }
  if (wipeOptions) {
    wipeOptions.style.display = state.wipeMethod === 'wipe' ? 'block' : 'none';
  }
  if (boxV2Options) {
    boxV2Options.style.display = (state.wipeMethod === 'boxv2' || state.animType === 'boxv2') ? 'block' : 'none';
  }
  [wipeAutoFixPivotToggle, autoFixPivotToggle].forEach(group => {
    if (!group) return;
    group.querySelectorAll('.toggle-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.value === (state.autoFixPivot ? 'on' : 'off'));
    });
  });
  renderSectionsUI();
  fullUpdate();

  // =========================================================================
  // MAIN APP TABS: Wipe Studio vs Media Converter vs Hollow Box Maker
  // =========================================================================
  const navTabStudio = $('#navTabStudio');
  const navTabConverter = $('#navTabConverter');
  const navTabHollowBox = $('#navTabHollowBox');
  const controlsPanelElem = $('#controls-panel');
  const previewPanelElem = $('#preview-panel');
  const dataPanelElem = $('#data-panel');
  const converterPanelElem = $('#converter-panel');
  const hollowboxPanelElem = $('#hollowboxPanel');

  function switchMainTab(tabName) {
    const isMobile = window.innerWidth <= 800 || (window.innerHeight <= 520 && window.innerWidth <= 960);
    if (tabName === 'converter') {
      if (navTabConverter) navTabConverter.classList.add('active');
      if (navTabStudio) navTabStudio.classList.remove('active');
      if (navTabHollowBox) navTabHollowBox.classList.remove('active');
      if (controlsPanelElem) controlsPanelElem.style.display = 'none';
      if (previewPanelElem) previewPanelElem.style.display = 'none';
      if (dataPanelElem) dataPanelElem.style.display = 'none';
      if (hollowboxPanelElem) hollowboxPanelElem.style.display = 'none';
      if (converterPanelElem) {
        converterPanelElem.style.display = isMobile ? 'block' : 'flex';
        converterPanelElem.style.opacity = '1';
        converterPanelElem.style.visibility = 'visible';
        converterPanelElem.style.pointerEvents = 'auto';
      }
      // If mobile tabs exist, also activate the Converter mobile tab
      const mobileTabConv = document.getElementById('mobileTabConverter');
      const mobileConvBtn = document.querySelector('.mobile-tab[data-tab="mobileTabConverter"]');
      if (mobileConvBtn && mobileTabConv) {
        document.querySelectorAll('.mobile-tab').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.mobile-tab-content').forEach(tc => tc.classList.remove('active'));
        mobileConvBtn.classList.add('active');
        mobileTabConv.classList.add('active');
      }
    } else if (tabName === 'hollowbox') {
      if (navTabHollowBox) navTabHollowBox.classList.add('active');
      if (navTabStudio) navTabStudio.classList.remove('active');
      if (navTabConverter) navTabConverter.classList.remove('active');
      if (controlsPanelElem) controlsPanelElem.style.display = 'none';
      if (previewPanelElem) previewPanelElem.style.display = 'none';
      if (dataPanelElem) dataPanelElem.style.display = 'none';
      if (converterPanelElem) converterPanelElem.style.display = 'none';
      if (hollowboxPanelElem) {
        hollowboxPanelElem.style.display = isMobile ? 'block' : 'flex';
        hollowboxPanelElem.style.opacity = '1';
        hollowboxPanelElem.style.visibility = 'visible';
        hollowboxPanelElem.style.pointerEvents = 'auto';
      }
      // If mobile tabs exist, also activate the Hollow Box mobile tab
      const mobileTabHb = document.getElementById('mobileTabHollowBox');
      const mobileHbBtn = document.querySelector('.mobile-tab[data-tab="mobileTabHollowBox"]');
      if (mobileHbBtn && mobileTabHb) {
        document.querySelectorAll('.mobile-tab').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.mobile-tab-content').forEach(tc => tc.classList.remove('active'));
        mobileHbBtn.classList.add('active');
        mobileTabHb.classList.add('active');
      }
      if (typeof initHollowBoxMaker === 'function') {
        initHollowBoxMaker();
      }
    } else {
      if (navTabStudio) navTabStudio.classList.add('active');
      if (navTabConverter) navTabConverter.classList.remove('active');
      if (navTabHollowBox) navTabHollowBox.classList.remove('active');
      if (controlsPanelElem) controlsPanelElem.style.display = '';
      if (previewPanelElem) previewPanelElem.style.display = '';
      if (dataPanelElem) dataPanelElem.style.display = '';
      if (converterPanelElem) converterPanelElem.style.display = 'none';
      if (hollowboxPanelElem) hollowboxPanelElem.style.display = 'none';
      // If mobile tabs exist, also activate the Inspector mobile tab
      const mobileTabInsp = document.getElementById('mobileTabConfig');
      const mobileInspBtn = document.querySelector('.mobile-tab[data-tab="mobileTabConfig"]');
      if (mobileInspBtn && mobileTabInsp) {
        document.querySelectorAll('.mobile-tab').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.mobile-tab-content').forEach(tc => tc.classList.remove('active'));
        mobileInspBtn.classList.add('active');
        mobileTabInsp.classList.add('active');
      }
      renderPreview();
    }
  }

  if (navTabStudio) {
    navTabStudio.addEventListener('click', () => switchMainTab('studio'));
  }
  if (navTabConverter) {
    navTabConverter.addEventListener('click', () => switchMainTab('converter'));
  }
  if (navTabHollowBox) {
    navTabHollowBox.addEventListener('click', () => switchMainTab('hollowbox'));
  }

  // =========================================================================
  // XML MEDIA LAYER CONVERTER ENGINE
  // =========================================================================
  const converterState = {
    originalXml: '',
    transformedXml: '',
    filename: '',
    xmlDoc: null,
    layers: [],
    mediaType: 'image/png',
    mediaUri: 'am-internal:///79E80CB55B8662B05AFDC24DB42B814BC455410A.PNG',
    maskSlicing: 'connect',
    filterQuery: '',
  };

  // Converter DOM Elements
  const btnDownloadConvertedXml = $('#btnDownloadConvertedXml');
  const btnCopyConvertedXml     = $('#btnCopyConvertedXml');
  const btnCopyInlineXml        = $('#btnCopyInlineXml');
  const xmlDropzone             = $('#xmlDropzone');
  const xmlFileInput            = $('#xmlFileInput');
  const btnBrowseXml            = $('#btnBrowseXml');
  const btnPasteXmlModal        = $('#btnPasteXmlModal');
  const btnLoadSample349        = $('#btnLoadSample349');
  const btnLoadSample294        = $('#btnLoadSample294');
  const btnLoadStudioXml        = $('#btnLoadStudioXml');
  const fileMetaBanner          = $('#fileMetaBanner');
  const metaFileName            = $('#metaFileName');
  const metaFileShapesCount     = $('#metaFileShapesCount');
  const metaDimensions          = $('#metaDimensions');
  const metaFps                 = $('#metaFps');
  const metaDuration            = $('#metaDuration');
  const mediaTypeToggle         = $('#mediaTypeToggle');
  const maskSlicingToggle       = $('#maskSlicingToggle');
  const targetMediaUri          = $('#targetMediaUri');
  const btnSelectAllLayers      = $('#btnSelectAllLayers');
  const btnDeselectAllLayers    = $('#btnDeselectAllLayers');
  const btnInvertSelection      = $('#btnInvertSelection');
  const selectedCountText       = $('#selectedCountText');
  const totalCountText          = $('#totalCountText');
  const layerSearchInput        = $('#layerSearchInput');
  const layersEmptyState        = $('#layersEmptyState');
  const converterLayersList     = $('#converterLayersList');
  const convertedXmlCode        = $('#convertedXmlCode');

  // Paste XML Modal
  const pasteXmlModal           = $('#pasteXmlModal');
  const pasteXmlTextarea        = $('#pasteXmlTextarea');
  const closePasteXmlBtn        = $('#closePasteXmlBtn');
  const cancelPasteXmlBtn       = $('#cancelPasteXmlBtn');
  const confirmPasteXmlBtn      = $('#confirmPasteXmlBtn');

  function escapeHtmlStr(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatXml(xml) {
    let formatted = '';
    let indent = 0;
    const tab = '  ';
    xml = xml.replace(/>\s*</g, '><');
    const nodes = xml.replace(/(>)(<)(\/*)/g, '$1\r\n$2$3').split('\r\n');
    for (let i = 0; i < nodes.length; i++) {
      let node = nodes[i].trim();
      if (!node) continue;
      if (node.match(/^<\/\w/)) {
        indent = Math.max(0, indent - 1);
      }
      formatted += tab.repeat(indent) + node + '\n';
      if (node.match(/^<\w[^>]*[^\/]>.*$/) && !node.includes('</') && !node.startsWith('<?')) {
        indent++;
      }
    }
    return formatted.trim();
  }

  function updateMediaTypeToggleUI() {
    if (!mediaTypeToggle) return;
    mediaTypeToggle.querySelectorAll('.toggle-btn').forEach(btn => {
      if (btn.dataset.value === converterState.mediaType) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function updateMaskSlicingToggleUI() {
    if (!maskSlicingToggle) return;
    maskSlicingToggle.querySelectorAll('.toggle-btn').forEach(btn => {
      if (btn.dataset.value === converterState.maskSlicing) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function loadXmlString(xmlString, filename = 'project.xml') {
    try {
      const cleanXml = xmlString.trim();
      if (!cleanXml) {
        showToast('Empty XML provided');
        return;
      }

      const parser = new DOMParser();
      const doc = parser.parseFromString(cleanXml, 'text/xml');
      const parseError = doc.querySelector('parsererror');
      if (parseError) {
        showToast('XML Syntax Error: Could not parse XML');
        return;
      }

      const rootScene = doc.querySelector('scene');
      if (!rootScene) {
        showToast('Invalid Alight Motion XML: Missing <scene> tag');
        return;
      }

      converterState.originalXml = cleanXml;
      converterState.filename = filename;
      converterState.xmlDoc = doc;

      // Extract metadata
      const width = rootScene.getAttribute('width') || '1080';
      const height = rootScene.getAttribute('height') || '1350';
      const fps = rootScene.getAttribute('fps') || '60';
      const totalTime = parseInt(rootScene.getAttribute('totalTime') || '0', 10);
      const durationSec = (totalTime && fps) ? (totalTime / parseFloat(fps)).toFixed(2) + 's' : 'Dynamic';

      // Detect existing media tag
      const existingMedia = rootScene.querySelector(':scope > media') || doc.querySelector('media');
      if (existingMedia) {
        const existingUri = existingMedia.getAttribute('uri');
        const existingType = existingMedia.getAttribute('type');
        if (existingUri && existingUri.startsWith('am-internal:///')) {
          converterState.mediaUri = existingUri;
          if (targetMediaUri) targetMediaUri.value = existingUri;
        }
        if (existingType) {
          converterState.mediaType = existingType;
          updateMediaTypeToggleUI();
        }
      }

      // Discover all shape layers, excluding mask stencils with blending="mask"
      const allShapes = Array.from(doc.querySelectorAll('shape'));
      const shapeElements = allShapes.filter(s => s.getAttribute('blending') !== 'mask');

      converterState.layers = shapeElements.map((shape, idx) => {
        const id = shape.getAttribute('id') || String(idx + 1);
        const rawLabel = shape.getAttribute('label') || `Shape ${id}`;
        const shapeType = shape.getAttribute('s') || '.rect';
        const fillType = shape.getAttribute('fillType') || 'color';
        const fillImage = shape.getAttribute('fillImage') || '';
        const fillVideo = shape.getAttribute('fillVideo') || '';

        // Check if inside an embedScene Group & Mask
        const parentScene = shape.parentElement && shape.parentElement.tagName.toLowerCase() === 'scene' ? shape.parentElement : null;
        const parentEmbed = parentScene && parentScene.parentElement && parentScene.parentElement.tagName.toLowerCase() === 'embedScene' ? parentScene.parentElement : null;
        const isInsideMaskEmbed = parentScene && parentScene.querySelector('shape[blending="mask"]');

        let displayLabel = rawLabel;
        if (parentEmbed) {
          const embedLabel = parentEmbed.getAttribute('label') || '';
          if (embedLabel && !displayLabel.includes(embedLabel)) {
            displayLabel = `${embedLabel} (${rawLabel})`;
          }
        }

        // Color extraction
        const fillColElem = shape.querySelector('fillColor');
        const rawHex = fillColElem ? fillColElem.getAttribute('value') : null;
        let displayColor = '#64e4dc';
        if (rawHex) {
          if (rawHex.length === 9 && rawHex.startsWith('#')) {
            displayColor = '#' + rawHex.slice(3);
          } else {
            displayColor = rawHex;
          }
        }

        // Effects summary
        const effectNodes = Array.from(shape.querySelectorAll('effect'));
        if (parentEmbed) {
          effectNodes.push(...Array.from(parentEmbed.querySelectorAll(':scope > effect')));
        }
        const effects = effectNodes.map(e => {
          const effId = e.getAttribute('id') || '';
          return effId.replace(/^com\.alightcreative\.effects\./, '');
        }).filter(Boolean);

        if (isInsideMaskEmbed) {
          effects.unshift('Group & Mask');
        }

        const isMedia = fillType === 'media' || Boolean(fillImage) || Boolean(fillVideo);

        return {
          index: idx,
          id,
          label: displayLabel,
          shapeType,
          element: shape,
          parentEmbed,
          isInsideMaskEmbed: Boolean(isInsideMaskEmbed),
          originalFillType: fillType,
          originalFillImage: fillImage,
          originalFillVideo: fillVideo,
          originalColor: rawHex || '#FF4B8ED2',
          displayColor,
          effects,
          isMedia,
        };
      });

      if (metaFileName) metaFileName.textContent = filename;
      if (metaFileShapesCount) metaFileShapesCount.textContent = `${converterState.layers.length} Shape${converterState.layers.length === 1 ? '' : 's'}`;
      if (metaDimensions) metaDimensions.textContent = `${width} × ${height}`;
      if (metaFps) metaFps.textContent = `${fps} FPS`;
      if (metaDuration) metaDuration.textContent = durationSec;
      if (fileMetaBanner) fileMetaBanner.style.display = 'block';

      renderConverterLayers();
      updateTransformedXmlOutput();
      showToast(`Loaded ${converterState.layers.length} shapes from ${filename}`);
    } catch (err) {
      console.error('Error loading XML:', err);
      showToast('Error loading XML: ' + err.message);
    }
  }

  function renderConverterLayers() {
    if (!converterLayersList) return;

    if (!converterState.layers || converterState.layers.length === 0) {
      if (layersEmptyState) layersEmptyState.style.display = 'flex';
      converterLayersList.style.display = 'none';
      if (selectedCountText) selectedCountText.textContent = '0';
      if (totalCountText) totalCountText.textContent = '0';
      return;
    }

    if (layersEmptyState) layersEmptyState.style.display = 'none';
    converterLayersList.style.display = 'flex';

    const filter = (converterState.filterQuery || '').trim().toLowerCase();
    let selectedCount = 0;

    converterLayersList.innerHTML = '';

    converterState.layers.forEach((layer, idx) => {
      if (layer.isMedia) selectedCount++;

      const match = !filter ||
        layer.label.toLowerCase().includes(filter) ||
        layer.id.toLowerCase().includes(filter) ||
        layer.effects.some(e => e.toLowerCase().includes(filter));

      if (!match) return;

      const card = document.createElement('div');
      card.className = `layer-item ${layer.isMedia ? 'selected-media' : ''}`;
      card.dataset.index = String(idx);

      const effectsSummary = layer.effects.length > 0
        ? layer.effects.slice(0, 3).join(', ')
        : 'base shape';

      card.innerHTML = `
        <div class="layer-item-left">
          <input type="checkbox" class="layer-checkbox" ${layer.isMedia ? 'checked' : ''} aria-label="Toggle ${escapeHtmlStr(layer.label)}">
          <span class="layer-id-badge">#${escapeHtmlStr(layer.id)}</span>
          <div class="layer-info">
            <div class="layer-title" title="${escapeHtmlStr(layer.label)}">${escapeHtmlStr(layer.label)}</div>
            <div class="layer-meta-info">${escapeHtmlStr(layer.shapeType)} · ${escapeHtmlStr(effectsSummary)}</div>
          </div>
        </div>
        <div class="layer-item-right">
          ${layer.isMedia
            ? `<span class="layer-status-pill media-pill">MEDIA</span>`
            : `<span class="layer-status-pill color-pill"><span class="color-dot" style="background:${layer.displayColor}"></span>COLOR</span>`
          }
          <button type="button" class="layer-toggle-btn ${layer.isMedia ? 'active' : ''}">
            ${layer.isMedia ? 'Media ✓' : 'Make Media'}
          </button>
        </div>
      `;

      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('layer-checkbox')) {
          layer.isMedia = e.target.checked;
        } else {
          layer.isMedia = !layer.isMedia;
        }
        renderConverterLayers();
        updateTransformedXmlOutput();
      });

      converterLayersList.appendChild(card);
    });

    if (selectedCountText) selectedCountText.textContent = String(selectedCount);
    if (totalCountText) totalCountText.textContent = String(converterState.layers.length);
  }

  function updateTransformedXmlOutput() {
    if (!converterState.xmlDoc) {
      if (convertedXmlCode) convertedXmlCode.textContent = '<!-- Import an XML to preview transformed output -->';
      return;
    }

    const doc = converterState.xmlDoc.cloneNode(true);
    const rootScene = doc.querySelector('scene');
    if (!rootScene) return;

    const mediaUri = (converterState.mediaUri || '').trim() || 'am-internal:///79E80CB55B8662B05AFDC24DB42B814BC455410A.PNG';
    const mediaType = converterState.mediaType || 'image/png';
    const isVideo = mediaType.startsWith('video');

    // Discover non-mask shapes corresponding 1-to-1 with converterState.layers
    const allShapes = Array.from(doc.querySelectorAll('shape'));
    const nonMaskShapes = allShapes.filter(s => s.getAttribute('blending') !== 'mask');
    let anyMedia = false;

    // Pass 1: Set media / color fill properties on selected shapes & auto-normalize Box V2 2592x3240 rectangles to 1080x1350
    const rootW = parseFloat(rootScene.getAttribute('width')) || 1080;
    const rootH = parseFloat(rootScene.getAttribute('height')) || 1350;

    converterState.layers.forEach((layerState, idx) => {
      const shape = nonMaskShapes[idx];
      if (!shape) return;

      // Auto-normalize Box V2 rectangles (wipe2 + box + stretch2) that had <scale value="2.40,2.40"/> inflating 1080x1350 -> 2592x3240
      const hasBoxEff = shape.querySelector('effect[id="com.alightcreative.effects.box"]');
      const hasStretchEff = shape.querySelector('effect[id="com.alightcreative.effects.stretch2"]');
      if (hasBoxEff && hasStretchEff) {
        const scaleNode = shape.querySelector('transform > scale');
        const sizeNode = shape.querySelector('property[name="size"]');
        if (scaleNode && scaleNode.getAttribute('value')) {
          const sp = scaleNode.getAttribute('value').split(',').map(Number);
          const sx = sp[0] || 1;
          const sy = sp[1] || 1;
          if (Math.abs(sx - 1.0) > 0.01 && Math.abs(sx - sy) < 0.01) {
            const boxScaleProp = hasBoxEff.querySelector('property[name="scale"]');
            if (boxScaleProp && boxScaleProp.getAttribute('value')) {
              const curBoxScale = parseFloat(boxScaleProp.getAttribute('value')) || 1.33;
              boxScaleProp.setAttribute('value', (curBoxScale * sx).toFixed(6));
            }
            scaleNode.setAttribute('value', '1.000000,1.000000');
          }
        }
        if (sizeNode) {
          sizeNode.setAttribute('value', `${(rootW / 2.0).toFixed(6)},${(rootH / 2.0).toFixed(6)}`);
        }
      }

      if (layerState.isMedia) {
        anyMedia = true;
        shape.setAttribute('fillType', 'media');
        if (isVideo) {
          shape.setAttribute('fillVideo', mediaUri);
          shape.removeAttribute('fillImage');
        } else {
          shape.setAttribute('fillImage', mediaUri);
          shape.removeAttribute('fillVideo');
        }
        shape.setAttribute('mediaFillMode', 'fill');

        const fillCol = shape.querySelector('fillColor');
        if (fillCol) {
          shape.removeChild(fillCol);
        }
      } else {
        shape.setAttribute('fillType', 'color');
        shape.removeAttribute('fillImage');
        shape.removeAttribute('fillVideo');
        shape.removeAttribute('mediaFillMode');

        let fillCol = shape.querySelector('fillColor');
        if (!fillCol) {
          fillCol = doc.createElement('fillColor');
          fillCol.setAttribute('value', layerState.originalColor || '#FF4B8ED2');
          shape.appendChild(fillCol);
        }
      }
    });

    // Pass 2: Connected Masking Mode alignment
    // If maskSlicing === 'connect', ensure any standalone mask slices (no wipe2, no blending="mask" sibling)
    // are wrapped into an <embedScene fillType="intrinsic"> Group & Mask with offset media and stencil.
    if (converterState.maskSlicing === 'connect') {
      const standaloneSlices = [];

      converterState.layers.forEach((layerState, idx) => {
        if (!layerState.isMedia) return;
        const shape = nonMaskShapes[idx];
        if (!shape) return;

        // If shape already has wipe2, it slices the media natively
        if (shape.querySelector('effect[id="com.alightcreative.effects.wipe2"]')) return;

        // If shape is already inside an embedScene with a sibling blending="mask" stencil, it's already Group & Mask
        const pScene = shape.parentElement && shape.parentElement.tagName.toLowerCase() === 'scene' ? shape.parentElement : null;
        if (pScene && pScene.querySelector('shape[blending="mask"]')) return;

        // Skip background reference shapes like "Rectangle to fit"
        const lbl = (shape.getAttribute('label') || '').toLowerCase();
        if (lbl.includes('to fit') || lbl.includes('reference')) return;

        // Extract location and tile dimensions
        const locElem = shape.querySelector('transform > location');
        const scaleElem = shape.querySelector('transform > scale');
        const sizeElem = shape.querySelector('property[name="size"]');

        let lx = 0, ly = 0;
        if (locElem && locElem.getAttribute('value')) {
          const parts = locElem.getAttribute('value').split(',').map(Number);
          lx = parts[0] || 0;
          ly = parts[1] || 0;
        }

        let tw = 0, th = 0;
        if (scaleElem && scaleElem.getAttribute('value')) {
          const parts = scaleElem.getAttribute('value').split(',').map(Number);
          tw = (parts[0] || 1) * 200.0;
          th = (parts[1] || 1) * 200.0;
        } else if (sizeElem && sizeElem.getAttribute('value')) {
          const parts = sizeElem.getAttribute('value').split(',').map(Number);
          tw = (parts[0] || 0) * 2.0;
          th = (parts[1] || 0) * 2.0;
        }

        if (tw > 0 && th > 0) {
          standaloneSlices.push({
            shape,
            lx, ly, tw, th,
            minX: lx - tw / 2.0,
            maxX: lx + tw / 2.0,
            minY: ly - th / 2.0,
            maxY: ly + th / 2.0,
          });
        }
      });

      if (standaloneSlices.length > 0) {
        // Calculate bounding box of the composite image to slice
        let fullW = 0, fullH = 0, originX = 0, originY = 0;

        const refFitShape = doc.querySelector('shape[label*="to fit"], shape[label*="Rectangle to fit"]');
        if (refFitShape) {
          const rLoc = refFitShape.querySelector('transform > location');
          const rScale = refFitShape.querySelector('transform > scale');
          if (rLoc && rScale) {
            const lp = rLoc.getAttribute('value').split(',').map(Number);
            const sp = rScale.getAttribute('value').split(',').map(Number);
            originX = lp[0] || 0;
            originY = lp[1] || 0;
            fullW = (sp[0] || 1) * 200.0;
            fullH = (sp[1] || 1) * 200.0;
          }
        }

        if (fullW === 0 || fullH === 0) {
          const minX = Math.min(...standaloneSlices.map(s => s.minX));
          const maxX = Math.max(...standaloneSlices.map(s => s.maxX));
          const minY = Math.min(...standaloneSlices.map(s => s.minY));
          const maxY = Math.max(...standaloneSlices.map(s => s.maxY));
          fullW = maxX - minX;
          fullH = maxY - minY;
          originX = minX + (fullW / 2.0);
          originY = minY + (fullH / 2.0);
        }

        const rootTotalTime = rootScene.getAttribute('totalTime') || '3000';
        const rootFps = rootScene.getAttribute('fps') || '60';

        standaloneSlices.forEach(item => {
          const s = item.shape;
          const parent = s.parentNode;
          if (!parent) return;

          const cx = item.tw / 2.0;
          const cy = item.th / 2.0;
          const mediaLocX = cx + (originX - item.lx);
          const mediaLocY = cy + (originY - item.ly);

          const sId = s.getAttribute('id') || '1';
          const sLabel = s.getAttribute('label') || `Slice ${sId}`;
          const sStartTime = s.getAttribute('startTime') || '0';
          const sEndTime = s.getAttribute('endTime') || rootTotalTime;

          const es = doc.createElement('embedScene');
          es.setAttribute('id', sId);
          es.setAttribute('label', sLabel);
          es.setAttribute('startTime', sStartTime);
          es.setAttribute('endTime', sEndTime);
          es.setAttribute('fillType', 'intrinsic');

          // Outer transform (preserves movement keyframes/location, sets scale to 1.0)
          const origTransform = s.querySelector('transform');
          if (origTransform) {
            const clonedTransform = origTransform.cloneNode(true);
            const scaleNode = clonedTransform.querySelector('scale');
            if (scaleNode) {
              scaleNode.setAttribute('value', '1.000000,1.000000');
            }
            es.appendChild(clonedTransform);
          }

          // Outer effects (flip3, cube2, box, etc.)
          const origEffects = Array.from(s.querySelectorAll('effect'));
          origEffects.forEach(eff => {
            const clonedEff = eff.cloneNode(true);
            if (clonedEff.getAttribute('id') === 'com.alightcreative.effects.cube2') {
              const wProp = clonedEff.querySelector('property[name="width"]');
              const hProp = clonedEff.querySelector('property[name="height"]');
              const dProp = clonedEff.querySelector('property[name="depth"]');
              const sProp = clonedEff.querySelector('property[name="scale"]');
              if (wProp) wProp.setAttribute('value', (item.tw / 1000).toFixed(6));
              if (hProp) hProp.setAttribute('value', (item.th / 1000).toFixed(6));
              if (dProp) dProp.setAttribute('value', (Math.min(item.tw, item.th) / 1000).toFixed(6));
              if (sProp) sProp.setAttribute('value', (1.32).toFixed(6));
            }
            es.appendChild(clonedEff);
          });

          const fc = doc.createElement('fillColor');
          fc.setAttribute('value', '#FF000000');
          es.appendChild(fc);

          // Inner Scene
          const sc = doc.createElement('scene');
          sc.setAttribute('title', '');
          sc.setAttribute('width', String(Math.round(item.tw)));
          sc.setAttribute('height', String(Math.round(item.th)));
          sc.setAttribute('exportWidth', String(Math.round(item.tw)));
          sc.setAttribute('exportHeight', String(Math.round(item.th)));
          sc.setAttribute('bgcolor', '#00000000');
          sc.setAttribute('totalTime', sEndTime);
          sc.setAttribute('fps', rootFps);
          sc.setAttribute('modifiedTime', '0');
          sc.setAttribute('amver', '868');
          sc.setAttribute('ffver', '107');
          sc.setAttribute('am', 'com.alightcreative.motion/6.2.59');
          sc.setAttribute('amplatform', 'ios');
          sc.setAttribute('precompose', 'dynamicResolution');
          sc.setAttribute('retime', 'off');

          // Inner Shape 1: Offset full media
          const sh1 = doc.createElement('shape');
          sh1.setAttribute('id', '1');
          sh1.setAttribute('label', `${sLabel} Media`);
          sh1.setAttribute('startTime', '0');
          sh1.setAttribute('endTime', sEndTime);
          sh1.setAttribute('fillType', 'media');
          if (isVideo) {
            sh1.setAttribute('fillVideo', mediaUri);
          } else {
            sh1.setAttribute('fillImage', mediaUri);
          }
          sh1.setAttribute('mediaFillMode', 'fill');
          sh1.setAttribute('s', '.rect');

          const sh1Trans = doc.createElement('transform');
          const sh1Loc = doc.createElement('location');
          sh1Loc.setAttribute('value', `${mediaLocX.toFixed(6)},${mediaLocY.toFixed(6)},0.000000`);
          sh1Trans.appendChild(sh1Loc);
          sh1.appendChild(sh1Trans);

          const sh1Size = doc.createElement('property');
          sh1Size.setAttribute('name', 'size');
          sh1Size.setAttribute('type', 'vec2');
          sh1Size.setAttribute('value', `${(fullW / 2.0).toFixed(6)},${(fullH / 2.0).toFixed(6)}`);
          sh1.appendChild(sh1Size);

          sc.appendChild(sh1);

          // Inner Shape 2: Mask stencil
          const sh2 = doc.createElement('shape');
          sh2.setAttribute('id', '2');
          sh2.setAttribute('label', `${sLabel} Mask`);
          sh2.setAttribute('startTime', '0');
          sh2.setAttribute('endTime', sEndTime);
          sh2.setAttribute('fillType', 'color');
          sh2.setAttribute('blending', 'mask');
          sh2.setAttribute('s', '.rect');

          const sh2Trans = doc.createElement('transform');
          const sh2Loc = doc.createElement('location');
          sh2Loc.setAttribute('value', `${cx.toFixed(6)},${cy.toFixed(6)},0.000000`);
          const sh2Scale = doc.createElement('scale');
          sh2Scale.setAttribute('value', `${(item.tw / 200.0).toFixed(6)},${(item.th / 200.0).toFixed(6)}`);
          sh2Trans.appendChild(sh2Loc);
          sh2Trans.appendChild(sh2Scale);
          sh2.appendChild(sh2Trans);

          const sh2Fc = doc.createElement('fillColor');
          sh2Fc.setAttribute('value', '#FFFFFFFF');
          sh2.appendChild(sh2Fc);

          sc.appendChild(sh2);
          es.appendChild(sc);

          // Drop-in replacement
          parent.replaceChild(es, s);
        });
      }
    }

    // Top-level <media> tag in root <scene>
    let mediaElem = rootScene.querySelector(':scope > media') || rootScene.querySelector('media');
    if (anyMedia) {
      if (!mediaElem) {
        mediaElem = doc.createElement('media');
        rootScene.insertBefore(mediaElem, rootScene.firstChild);
      }
      mediaElem.setAttribute('uri', mediaUri);
      mediaElem.setAttribute('type', mediaType);
      if (!mediaElem.getAttribute('width')) mediaElem.setAttribute('width', rootScene.getAttribute('width') || '1080');
      if (!mediaElem.getAttribute('height')) mediaElem.setAttribute('height', rootScene.getAttribute('height') || '1350');
      if (!mediaElem.getAttribute('infoUpdated')) mediaElem.setAttribute('infoUpdated', String(Date.now()));
    } else {
      if (mediaElem && mediaElem.getAttribute('uri') === mediaUri) {
        mediaElem.parentNode.removeChild(mediaElem);
      }
    }

    const serializer = new XMLSerializer();
    let xmlStr = serializer.serializeToString(doc);

    xmlStr = formatXml(xmlStr);
    if (!xmlStr.startsWith('<?xml')) {
      xmlStr = `<?xml version='1.0' encoding='UTF-8' ?>\n` + xmlStr;
    }

    converterState.transformedXml = xmlStr;
    if (convertedXmlCode) {
      convertedXmlCode.textContent = xmlStr;
    }
  }

  // Media Type Toggle
  if (mediaTypeToggle) {
    mediaTypeToggle.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        converterState.mediaType = btn.dataset.value;
        updateMediaTypeToggleUI();
        updateTransformedXmlOutput();
      });
    });
  }

  // Mask Slicing Alignment Toggle
  if (maskSlicingToggle) {
    maskSlicingToggle.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        converterState.maskSlicing = btn.dataset.value;
        updateMaskSlicingToggleUI();
        updateTransformedXmlOutput();
      });
    });
  }

  // Media URI Input
  if (targetMediaUri) {
    targetMediaUri.addEventListener('input', () => {
      converterState.mediaUri = targetMediaUri.value.trim();
      updateTransformedXmlOutput();
    });
  }

  // Batch actions
  if (btnSelectAllLayers) {
    btnSelectAllLayers.addEventListener('click', () => {
      if (!converterState.layers.length) return;
      converterState.layers.forEach(l => l.isMedia = true);
      renderConverterLayers();
      updateTransformedXmlOutput();
      showToast('All shapes converted to media layers');
    });
  }

  if (btnDeselectAllLayers) {
    btnDeselectAllLayers.addEventListener('click', () => {
      if (!converterState.layers.length) return;
      converterState.layers.forEach(l => l.isMedia = false);
      renderConverterLayers();
      updateTransformedXmlOutput();
      showToast('All shapes reset to solid color');
    });
  }

  if (btnInvertSelection) {
    btnInvertSelection.addEventListener('click', () => {
      if (!converterState.layers.length) return;
      converterState.layers.forEach(l => l.isMedia = !l.isMedia);
      renderConverterLayers();
      updateTransformedXmlOutput();
      showToast('Inverted layer selection');
    });
  }

  // Layer filter/search
  if (layerSearchInput) {
    layerSearchInput.addEventListener('input', () => {
      converterState.filterQuery = layerSearchInput.value;
      renderConverterLayers();
    });
  }

  // Quick Preset Loaders
  if (btnLoadSample349) {
    btnLoadSample349.addEventListener('click', () => {
      fetch('samples/Project_349.xml')
        .then(res => {
          if (!res.ok) throw new Error('File not found');
          return res.text();
        })
        .then(txt => loadXmlString(txt, 'Project Name 349.xml'))
        .catch(err => showToast('Could not load sample: ' + err.message));
    });
  }

  if (btnLoadSample294) {
    btnLoadSample294.addEventListener('click', () => {
      fetch('samples/Project_294.xml')
        .then(res => {
          if (!res.ok) throw new Error('File not found');
          return res.text();
        })
        .then(txt => loadXmlString(txt, 'Project Name 294.xml'))
        .catch(err => showToast('Could not load sample: ' + err.message));
    });
  }

  if (btnLoadStudioXml) {
    btnLoadStudioXml.addEventListener('click', () => {
      try {
        const layers = calculateLayers();
        const xml = generateAlightMotionXML(layers);
        loadXmlString(xml, `Studio-${state.wipeMethod}-${layers.length}L.xml`);
      } catch (err) {
        showToast('Could not generate studio XML: ' + err.message);
      }
    });
  }

  // File browse & drag-and-drop
  if (btnBrowseXml && xmlFileInput) {
    btnBrowseXml.addEventListener('click', () => xmlFileInput.click());
    xmlFileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => loadXmlString(evt.target.result, file.name);
      reader.onerror = () => showToast('Error reading XML file');
      reader.readAsText(file);
      xmlFileInput.value = '';
    });
  }

  if (xmlDropzone) {
    xmlDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      xmlDropzone.classList.add('drag-over');
    });
    xmlDropzone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      xmlDropzone.classList.remove('drag-over');
    });
    xmlDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      xmlDropzone.classList.remove('drag-over');
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => loadXmlString(evt.target.result, file.name);
      reader.onerror = () => showToast('Error reading dropped XML file');
      reader.readAsText(file);
    });
  }

  // Paste XML Modal Handlers
  if (btnPasteXmlModal && pasteXmlModal) {
    btnPasteXmlModal.addEventListener('click', () => {
      if (pasteXmlTextarea) pasteXmlTextarea.value = '';
      pasteXmlModal.style.display = 'flex';
      if (pasteXmlTextarea) pasteXmlTextarea.focus();
    });
  }

  function closePasteModal() {
    if (pasteXmlModal) pasteXmlModal.style.display = 'none';
  }

  if (closePasteXmlBtn) closePasteXmlBtn.addEventListener('click', closePasteModal);
  if (cancelPasteXmlBtn) cancelPasteXmlBtn.addEventListener('click', closePasteModal);

  if (confirmPasteXmlBtn) {
    confirmPasteXmlBtn.addEventListener('click', () => {
      const text = pasteXmlTextarea ? pasteXmlTextarea.value.trim() : '';
      if (!text) {
        showToast('Please paste XML text first');
        return;
      }
      closePasteModal();
      loadXmlString(text, 'Pasted-Alight-Motion.xml');
    });
  }

  // Copy & Download Transformed XML
  function copyTransformedXml() {
    if (!converterState.transformedXml) {
      showToast('No XML loaded yet. Import an XML first!');
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(converterState.transformedXml)
        .then(() => showToast('Transformed XML copied to clipboard!'))
        .catch(() => fallbackCopy(converterState.transformedXml));
    } else {
      fallbackCopy(converterState.transformedXml);
    }
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('Transformed XML copied to clipboard!');
  }

  function downloadTransformedXml() {
    if (!converterState.transformedXml) {
      showToast('No XML loaded yet. Import an XML first!');
      return;
    }
    const blob = new Blob([converterState.transformedXml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const baseName = (converterState.filename || 'project').replace(/\.xml$/i, '');
    a.href = url;
    a.download = `${baseName}-media.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    showToast(`Downloaded ${a.download}!`);
  }

  if (btnCopyConvertedXml) btnCopyConvertedXml.addEventListener('click', copyTransformedXml);
  if (btnCopyInlineXml) btnCopyInlineXml.addEventListener('click', copyTransformedXml);
  if (btnDownloadConvertedXml) btnDownloadConvertedXml.addEventListener('click', downloadTransformedXml);

  // Auto-load sample preset on initial tab visit if empty
  if (navTabConverter) {
    navTabConverter.addEventListener('click', () => {
      if (!converterState.xmlDoc) {
        // Pre-load Project 349 so user immediately sees an interactive list of shapes
        fetch('samples/Project_349.xml')
          .then(res => res.ok ? res.text() : null)
          .then(txt => {
            if (txt && !converterState.xmlDoc) {
              loadXmlString(txt, 'Project Name 349.xml');
            }
          })
          .catch(() => {});
      }
    });
  }

  // =========================================================================
  // HOLLOW BOX MAKER ENGINE — 3D Hollow Box Inside Hollow Box Animation
  // Based on Project Name 304.xml (Original HB + Settings Architecture)
  // Supports 2 or 4 Steps, Mid-Graph Easing, Beats Sync, 3D Canvas Preview
  // =========================================================================

  let onHollowBoxBezierUpdate = null;
  let initHollowBoxMaker = null;

  (() => {
    // ---- Available Hollow Box Animated Variables ----
    const HB_VARIABLES = [
      { key: 'posX', label: 'Position X', icon: '↔', unit: 'px', min: -1000, max: 1000, step: 5, category: 'pos' },
      { key: 'posY', label: 'Position Y', icon: '↕', unit: 'px', min: -1000, max: 1000, step: 5, category: 'pos' },
      { key: 'posZ', label: 'Position Z', icon: '⤢', unit: 'px', min: -1000, max: 1000, step: 5, category: 'pos' },
      { key: 'rotate', label: 'Rotation', icon: '⟳', unit: '°', min: -360, max: 360, step: 5, category: 'rot' },
      { key: 'width', label: 'Box Width', icon: '⬌', unit: 'x', min: 0.05, max: 4.0, step: 0.05, category: 'effect' },
      { key: 'height', label: 'Box Height', icon: '⬍', unit: 'x', min: 0.05, max: 4.0, step: 0.05, category: 'effect' },
      { key: 'depth', label: 'Box Depth', icon: '🧊', unit: 'x', min: 0.05, max: 4.0, step: 0.05, category: 'effect' },
      { key: 'scale', label: 'Overall Scale', icon: '🔍', unit: 'x', min: 0.05, max: 3.0, step: 0.05, category: 'effect' }
    ];

    function getStepActiveVars(step) {
      if (!step) return ['posX'];
      if (Array.isArray(step.activeVars) && step.activeVars.length > 0) {
        return step.activeVars;
      }
      if (step.action === 'custom') return ['posX', 'posY', 'rotate', 'depth'];
      return [step.action || 'posX'];
    }

    function toggleStepVar(step, key) {
      if (!step) return;
      if (!Array.isArray(step.activeVars)) {
        step.activeVars = getStepActiveVars(step).slice();
      }
      const idx = step.activeVars.indexOf(key);
      if (idx >= 0) {
        step.activeVars.splice(idx, 1);
      } else {
        step.activeVars.push(key);
      }
      step.action = step.activeVars.length > 0 ? step.activeVars[0] : 'posX';
    }

    // ---- State ----
    const hbState = {
      structureMode: 'nested', // 'nested', 'settingsOnly', 'originalOnly'
      targetLayer: 'settings', // 'settings', 'original', 'both'
      stepCount: 4,            // 2 or 4
      projectDurationMs: 2000, // 2000ms = 1999ms totalTime in Project 304
      fps: 60,
      mediaUri: 'am-internal:///BBB32FC1DE51537203F258871E0D8039FC5960A0.MP4',
      stretchAngle: 90.0,
      stretchScale: 1.25,
      activeStepTab: 1,
      isPlaying: false,
      currentTimeMs: 0,
      animFrameId: null,
      lastTimestamp: null,

      // Beats (4 steps = 5 beats, 2 steps = 3 beats)
      beats: [
        { id: 1, label: 'Beat 1', timeStr: '00:00:00', timeMs: 0 },
        { id: 2, label: 'Beat 2', timeStr: '00:00:30', timeMs: 500 },
        { id: 3, label: 'Beat 3', timeStr: '00:01:00', timeMs: 1000 },
        { id: 4, label: 'Beat 4', timeStr: '00:01:30', timeMs: 1500 },
        { id: 5, label: 'Beat 5 (End)', timeStr: '00:02:00', timeMs: 2000 },
      ],

      // Default 4 Steps
      steps: [
        {
          stepIndex: 1,
          enabled: true,
          name: 'Step 1: Move Left (X-Axis)',
          action: 'posX',
          activeVars: ['posX'],
          startBeat: 1,
          endBeat: 3, // Mid graph across Beat 2!
          easing: '0.400000 0.000000 0.200000 1.000000',
          posXStart: 0,
          posXEnd: -250,
          posYStart: 100,
          posYEnd: 100,
          posZStart: -25,
          posZEnd: -25,
          rotateStartX: 0, rotateStartY: 0, rotateStartZ: 0,
          rotateEndX: 0, rotateEndY: 0, rotateEndZ: 0,
          orientStartX: 0, orientStartY: 0, orientStartZ: 0,
          orientEndX: 0, orientEndY: 0, orientEndZ: 0,
          widthStart: 1.0, widthEnd: 1.0,
          heightStart: 1.0, heightEnd: 1.0,
          depthStart: 1.0, depthEnd: 1.0,
          scaleStart: 0.5, scaleEnd: 0.5,
        },
        {
          stepIndex: 2,
          enabled: true,
          name: 'Step 2: Move Up (Y-Axis)',
          action: 'posY',
          activeVars: ['posY'],
          startBeat: 2,
          endBeat: 4, // Mid graph across Beat 3!
          easing: '0.400000 0.000000 0.200000 1.000000',
          posXStart: -250,
          posXEnd: -250,
          posYStart: 100,
          posYEnd: -150, // Move up
          posZStart: -25,
          posZEnd: -25,
          rotateStartX: 0, rotateStartY: 0, rotateStartZ: 0,
          rotateEndX: 0, rotateEndY: 0, rotateEndZ: 0,
          orientStartX: 0, orientStartY: 0, orientStartZ: 0,
          orientEndX: 0, orientEndY: 0, orientEndZ: 0,
          widthStart: 1.0, widthEnd: 1.0,
          heightStart: 1.0, heightEnd: 1.0,
          depthStart: 1.0, depthEnd: 1.0,
          scaleStart: 0.5, scaleEnd: 0.5,
        },
        {
          stepIndex: 3,
          enabled: true,
          name: 'Step 3: Rotate & Orient',
          action: 'rotate',
          activeVars: ['rotate'],
          startBeat: 3,
          endBeat: 5, // Mid graph across Beat 4!
          easing: '0.400000 0.000000 0.200000 1.000000',
          posXStart: -250,
          posXEnd: -250,
          posYStart: -150,
          posYEnd: -150,
          posZStart: -25,
          posZEnd: -25,
          rotateStartX: 0, rotateStartY: 0, rotateStartZ: 0,
          rotateEndX: 0, rotateEndY: 90, rotateEndZ: 0,
          orientStartX: 0, orientStartY: 0, orientStartZ: 0,
          orientEndX: 0, orientEndY: 0, orientEndZ: 0,
          widthStart: 1.0, widthEnd: 1.0,
          heightStart: 1.0, heightEnd: 1.0,
          depthStart: 1.0, depthEnd: 1.0,
          scaleStart: 0.5, scaleEnd: 0.5,
        },
        {
          stepIndex: 4,
          enabled: true,
          name: 'Step 4: Depth Effect',
          action: 'depth',
          activeVars: ['depth'],
          startBeat: 4,
          endBeat: 5,
          easing: '0.400000 0.000000 0.200000 1.000000',
          posXStart: -250,
          posXEnd: -250,
          posYStart: -150,
          posYEnd: -150,
          posZStart: -25,
          posZEnd: -25,
          rotateStartX: 0, rotateStartY: 90, rotateStartZ: 0,
          rotateEndX: 0, rotateEndY: 90, rotateEndZ: 0,
          orientStartX: 0, orientStartY: 0, orientStartZ: 0,
          orientEndX: 0, orientEndY: 0, orientEndZ: 0,
          widthStart: 1.0, widthEnd: 1.0,
          heightStart: 1.0, heightEnd: 1.0,
          depthStart: 1.0, depthEnd: 0.25,
          scaleStart: 0.5, scaleEnd: 0.5,
        }
      ]
    };

    // ---- DOM Elements ----
    const hbStructureToggle = document.getElementById('hbStructureToggle');
    const hbTargetToggle = document.getElementById('hbTargetToggle');
    const hbStepCountToggle = document.getElementById('hbStepCountToggle');
    const hbStepBadge = document.getElementById('hbStepBadge');
    const hbProjectDuration = document.getElementById('hbProjectDuration');
    const hbMediaUri = document.getElementById('hbMediaUri');
    const hbStretchAngle = document.getElementById('hbStretchAngle');
    const hbStretchScale = document.getElementById('hbStretchScale');
    const btnHbReset304 = document.getElementById('btnHbReset304');
    const hbBeatsList = document.getElementById('hbBeatsList');
    const hbStepPills = document.getElementById('hbStepPills');
    const hbStepsContainer = document.getElementById('hbStepsContainer');
    const hbPreviewCanvas = document.getElementById('hbPreviewCanvas');
    const hbPreviewHudTag = document.getElementById('hbPreviewHudTag');
    const hbTelemPos = document.getElementById('hbTelemPos');
    const hbTelemRot = document.getElementById('hbTelemRot');
    const hbTelemDims = document.getElementById('hbTelemDims');
    const hbPlayBtn = document.getElementById('hbPlayBtn');
    const hbTimelineScrubber = document.getElementById('hbTimelineScrubber');
    const hbBeatMarkers = document.getElementById('hbBeatMarkers');
    const hbPlayheadTimecode = document.getElementById('hbPlayheadTimecode');
    const hbXmlCodeBlock = document.getElementById('hbXmlCodeBlock');
    const hbCopyXmlBtn = document.getElementById('hbCopyXmlBtn');
    const hbDownloadXmlBtn = document.getElementById('hbDownloadXmlBtn');

    // ---- Time Helpers ----
    function parseTimeStrToMs(str) {
      if (!str) return 0;
      const clean = str.trim();
      const parts = clean.split(':').map(Number);
      if (parts.length === 3) {
        // MM:SS:Frames(60fps)
        const mins = parts[0] || 0;
        const secs = parts[1] || 0;
        const frames = parts[2] || 0;
        return Math.round((mins * 60 + secs + frames / 60) * 1000);
      }
      const val = parseFloat(clean);
      return isNaN(val) ? 0 : Math.round(val * 1000);
    }

    function msToTimeStr(ms) {
      const totalSec = ms / 1000;
      const mins = Math.floor(totalSec / 60);
      const remSec = totalSec % 60;
      const secs = Math.floor(remSec);
      const frames = Math.min(59, Math.round((remSec - secs) * 60));
      const pad = (n) => String(n).padStart(2, '0');
      return `${pad(mins)}:${pad(secs)}:${pad(frames)}`;
    }

    // Cubic Bezier Solver (Newton-Raphson)
    function solveCubicBezier(t, x1, y1, x2, y2) {
      if (t <= 0) return 0;
      if (t >= 1) return 1;
      let s = t;
      for (let i = 0; i < 8; i++) {
        const oneMinusS = 1 - s;
        const bx = 3 * oneMinusS * oneMinusS * s * x1 + 3 * oneMinusS * s * s * x2 + s * s * s;
        const diff = bx - t;
        if (Math.abs(diff) < 1e-5) break;
        const dxdt = 3 * oneMinusS * oneMinusS * x1 + 6 * oneMinusS * s * (x2 - x1) + 3 * s * s * (1 - x2);
        if (Math.abs(dxdt) < 1e-6) break;
        s -= diff / dxdt;
        s = Math.max(0, Math.min(1, s));
      }
      const oneMinusS = 1 - s;
      return 3 * oneMinusS * oneMinusS * s * y1 + 3 * oneMinusS * s * s * y2 + s * s * s;
    }

    function parseBezierEasing(easingStr) {
      if (!easingStr) return [0.4, 0.0, 0.2, 1.0];
      const parts = easingStr.replace(/,/g, ' ').trim().split(/\s+/).map(Number);
      if (parts.length === 4 && parts.every(n => !isNaN(n))) {
        return parts;
      }
      return [0.4, 0.0, 0.2, 1.0];
    }

    // ---- Step Configuration & Management ----
    function setStepCount(count) {
      hbState.stepCount = count;
      if (hbStepBadge) {
        hbStepBadge.textContent = `${count} STEPS (${count} BEATS)`;
      }
      if (hbStepCountToggle) {
        hbStepCountToggle.querySelectorAll('.toggle-btn').forEach(btn => {
          btn.classList.toggle('active', parseInt(btn.dataset.value) === count);
        });
      }

      if (count === 2) {
        hbState.beats = [
          { id: 1, label: 'Beat 1', timeStr: '00:00:00', timeMs: 0 },
          { id: 2, label: 'Beat 2', timeStr: '00:01:00', timeMs: 1000 },
          { id: 3, label: 'Beat 3 (End)', timeStr: '00:02:00', timeMs: 2000 },
        ];
        hbState.steps[0].enabled = true;
        hbState.steps[0].startBeat = 1;
        hbState.steps[0].endBeat = 3; // Mid-graph across Beat 2!
        hbState.steps[1].enabled = true;
        hbState.steps[1].startBeat = 2;
        hbState.steps[1].endBeat = 3;
        hbState.steps[2].enabled = false;
        hbState.steps[3].enabled = false;
      } else {
        hbState.beats = [
          { id: 1, label: 'Beat 1', timeStr: '00:00:00', timeMs: 0 },
          { id: 2, label: 'Beat 2', timeStr: '00:00:30', timeMs: 500 },
          { id: 3, label: 'Beat 3', timeStr: '00:01:00', timeMs: 1000 },
          { id: 4, label: 'Beat 4', timeStr: '00:01:30', timeMs: 1500 },
          { id: 5, label: 'Beat 5 (End)', timeStr: '00:02:00', timeMs: 2000 },
        ];
        hbState.steps[0].enabled = true;
        hbState.steps[0].startBeat = 1;
        hbState.steps[0].endBeat = 3; // Mid graph across Beat 2!
        hbState.steps[1].enabled = true;
        hbState.steps[1].startBeat = 2;
        hbState.steps[1].endBeat = 4; // Mid graph across Beat 3!
        hbState.steps[2].enabled = true;
        hbState.steps[2].startBeat = 3;
        hbState.steps[2].endBeat = 5; // Mid graph across Beat 4!
        hbState.steps[3].enabled = true;
        hbState.steps[3].startBeat = 4;
        hbState.steps[3].endBeat = 5;
      }

      if (hbState.activeStepTab > count) {
        hbState.activeStepTab = 1;
      }

      renderBeatsUI();
      renderStepPillsUI();
      renderStepsUI();
      updateTimelineScrubberMarks();
      renderHollowBoxXML();
      renderHollowBoxPreviewCanvas(hbState.currentTimeMs);
    }

    // ---- Render Beats UI ----
    function renderBeatsUI() {
      if (!hbBeatsList) return;
      hbBeatsList.innerHTML = '';

      hbState.beats.forEach((b, idx) => {
        const item = document.createElement('div');
        item.className = 'beat-item';
        item.innerHTML = `
          <span class="beat-badge">B${b.id}</span>
          <input type="text" class="beat-input" data-beat-index="${idx}" value="${b.timeStr}" placeholder="MM:SS:FF" spellcheck="false">
          <span class="beat-ms-tag">${b.timeMs}ms</span>
        `;

        const inp = item.querySelector('.beat-input');
        inp.addEventListener('input', () => {
          b.timeStr = inp.value;
          b.timeMs = parseTimeStrToMs(inp.value);
          const msTag = item.querySelector('.beat-ms-tag');
          if (msTag) msTag.textContent = `${b.timeMs}ms`;

          // If last beat, sync projectDurationMs
          if (idx === hbState.beats.length - 1) {
            hbState.projectDurationMs = b.timeMs;
            if (hbProjectDuration) hbProjectDuration.value = b.timeStr;
            if (hbTimelineScrubber) hbTimelineScrubber.max = b.timeMs;
          }

          updateTimelineScrubberMarks();
          renderStepsUI();
          renderHollowBoxXML();
          renderHollowBoxPreviewCanvas(hbState.currentTimeMs);
        });

        hbBeatsList.appendChild(item);
      });
    }

    // ---- Render Step Nav Pills ----
    function renderStepPillsUI() {
      if (!hbStepPills) return;
      hbStepPills.innerHTML = '';
      for (let i = 1; i <= hbState.stepCount; i++) {
        const step = hbState.steps[i - 1];
        const vList = getStepActiveVars(step);
        const pill = document.createElement('button');
        pill.className = `sample-pill-btn ${hbState.activeStepTab === i ? 'active' : ''}`;
        pill.type = 'button';
        const vSummary = vList.length === 1
          ? vList[0].toUpperCase()
          : `${vList.length} vars`;
        pill.textContent = `Step 0${i} (${vSummary})`;
        pill.addEventListener('click', () => {
          hbState.activeStepTab = i;
          renderStepPillsUI();
          renderStepsUI();
        });
        hbStepPills.appendChild(pill);
      }
    }

    // ---- Render Step Cards UI ----
    function renderStepsUI() {
      if (!hbStepsContainer) return;
      hbStepsContainer.innerHTML = '';

      const activeStep = hbState.steps[hbState.activeStepTab - 1];
      if (!activeStep) return;

      const isMidGraph = (activeStep.endBeat - activeStep.startBeat) >= 2;
      const startMs = hbState.beats[activeStep.startBeat - 1] ? hbState.beats[activeStep.startBeat - 1].timeMs : 0;
      const endMs = hbState.beats[activeStep.endBeat - 1] ? hbState.beats[activeStep.endBeat - 1].timeMs : 2000;
      const activeVars = getStepActiveVars(activeStep);

      const card = document.createElement('div');
      card.className = 'hb-step-card';
      card.innerHTML = `
        <div class="hb-step-header">
          <div class="hb-step-title">
            <span>Step ${activeStep.stepIndex} Configuration</span>
            <span class="hb-var-count-chip">${activeVars.length} ${activeVars.length === 1 ? 'Variable' : 'Variables'} Active</span>
            ${isMidGraph ? '<span class="mid-graph-chip">✦ MID GRAPH ACTIVE</span>' : ''}
          </div>
          <span class="fmeta-specs">${startMs}ms → ${endMs}ms (${((endMs - startMs)/1000).toFixed(2)}s)</span>
        </div>

        <!-- Multi-Variable Selector -->
        <div class="control-group">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <label style="margin: 0; font-size: 11px;">Animated Variables (Click to toggle on / off)</label>
            <span class="fmeta-specs" style="color: var(--text-3); font-size: 10px;">Multiple active variables supported</span>
          </div>
          <div class="hb-action-grid">
            ${HB_VARIABLES.map(v => {
              const active = activeVars.includes(v.key);
              return `
                <button type="button" class="hb-action-btn ${active ? 'active' : ''}" data-var="${v.key}" title="Toggle ${v.label}">
                  <span>${active ? '✓' : '+'}</span>
                  <span>${v.label}</span>
                </button>
              `;
            }).join('')}
          </div>
          <!-- Quick Multi-Variable Presets -->
          <div class="hb-var-quick-presets">
            <span style="font-size: 10px; color: var(--text-3); align-self: center; margin-right: 2px;">Presets:</span>
            <button type="button" class="hb-var-pill-btn" data-preset="all">+ All 8 Variables</button>
            <button type="button" class="hb-var-pill-btn" data-preset="xy">Position (X+Y)</button>
            <button type="button" class="hb-var-pill-btn" data-preset="pos">Position (X+Y+Z)</button>
            <button type="button" class="hb-var-pill-btn" data-preset="posrot">Pos + Rotation</button>
            <button type="button" class="hb-var-pill-btn" data-preset="dims">Box Dims (W+H+D)</button>
            <button type="button" class="hb-var-pill-btn" data-preset="single">Single (X Only)</button>
          </div>
        </div>

        <!-- Dynamic Property Inputs Container -->
        <div class="hb-step-fields" id="hbStepFields"></div>

        <!-- Beat Range Alignment -->
        <div class="control-group">
          <label>Musical Beat Anchor Range (Start & End Beat)</label>
          <div class="hb-val-row">
            <div class="hb-val-field">
              <label>Start Beat</label>
              <select class="styled-input hb-beat-select" id="hbSelectStartBeat">
                ${hbState.beats.slice(0, -1).map(b => `<option value="${b.id}" ${b.id === activeStep.startBeat ? 'selected' : ''}>${b.label} (${b.timeStr})</option>`).join('')}
              </select>
            </div>
            <div class="hb-val-field">
              <label>End Beat</label>
              <select class="styled-input hb-beat-select" id="hbSelectEndBeat">
                ${hbState.beats.slice(1).map(b => `<option value="${b.id}" ${b.id === activeStep.endBeat ? 'selected' : ''}>${b.label} (${b.timeStr})</option>`).join('')}
              </select>
            </div>
          </div>
        </div>

        <!-- Mid-Graph Notice -->
        <div class="hb-midgraph-notice">
          ${isMidGraph
            ? `✦ <strong>MID GRAPH ACTIVE:</strong> Keyframes anchor to Beat ${activeStep.startBeat} and Beat ${activeStep.endBeat}. The cubic curve reaches peak rate across Beat ${(activeStep.startBeat + activeStep.endBeat) / 2}, producing an ultra-smooth fluid transition instead of jarring on/off keyframes.`
            : `ℹ <strong>Direct Beat Transition:</strong> Keyframes span directly from Beat ${activeStep.startBeat} to Beat ${activeStep.endBeat}. Extend span to 2 beats (e.g. Beat 1 to 3) to enable mid-graph smoothing.`}
        </div>

        <!-- Easing Curve & Graph Integration -->
        <div class="control-group" style="margin-bottom: 0;">
          <label>Step Easing Curve</label>
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <button type="button" class="sample-pill-btn hb-curve-preset" data-curve="0.400000 0.000000 0.200000 1.000000">Mid-Graph Smooth</button>
            <button type="button" class="sample-pill-btn hb-curve-preset" data-curve="0.345870 0.000000 0.188790 1.000000">Flow Ease (349)</button>
            <button type="button" class="sample-pill-btn hb-curve-preset" data-curve="0.080000 0.850000 0.250000 1.000000">Snap Kick</button>
            <button type="button" class="sample-pill-btn hb-curve-preset" data-curve="0.000000 0.000000 1.000000 1.000000">Linear</button>
            <button type="button" class="btn-sub primary" id="btnHbEditGraph" style="padding: 5px 12px; font-size: 10.5px; margin-left: auto;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
              </svg>
              Edit Curve in Graph
            </button>
          </div>
          <div class="fmeta-specs" style="margin-top: 4px; color: var(--text-3); font-size: 10px;">
            Active Bezier: <span id="hbActiveCurveLabel" style="color: var(--cyan);">${activeStep.easing}</span>
          </div>
        </div>
      `;

      // Wire variable toggle buttons
      card.querySelectorAll('.hb-action-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const varKey = btn.dataset.var;
          toggleStepVar(activeStep, varKey);
          renderStepPillsUI();
          renderStepsUI();
          renderHollowBoxXML();
          renderHollowBoxPreviewCanvas(hbState.currentTimeMs);
        });
      });

      // Wire combo presets
      card.querySelectorAll('.hb-var-pill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const preset = btn.dataset.preset;
          if (preset === 'all') {
            activeStep.activeVars = ['posX', 'posY', 'posZ', 'rotate', 'width', 'height', 'depth', 'scale'];
          } else if (preset === 'xy') {
            activeStep.activeVars = ['posX', 'posY'];
          } else if (preset === 'pos') {
            activeStep.activeVars = ['posX', 'posY', 'posZ'];
          } else if (preset === 'posrot') {
            activeStep.activeVars = ['posX', 'posY', 'rotate'];
          } else if (preset === 'dims') {
            activeStep.activeVars = ['width', 'height', 'depth'];
          } else if (preset === 'single') {
            activeStep.activeVars = ['posX'];
          }
          activeStep.action = activeStep.activeVars[0] || 'posX';
          renderStepPillsUI();
          renderStepsUI();
          renderHollowBoxXML();
          renderHollowBoxPreviewCanvas(hbState.currentTimeMs);
        });
      });

      // Render Dynamic Fields
      const fieldsContainer = card.querySelector('#hbStepFields');
      renderStepFields(activeStep, fieldsContainer);

      // Wire Beat Selectors
      const startSelect = card.querySelector('#hbSelectStartBeat');
      const endSelect = card.querySelector('#hbSelectEndBeat');
      if (startSelect && endSelect) {
        startSelect.addEventListener('change', () => {
          let sVal = parseInt(startSelect.value);
          let eVal = parseInt(endSelect.value);
          if (sVal >= eVal) {
            eVal = Math.min(hbState.beats.length, sVal + 1);
            endSelect.value = eVal;
          }
          activeStep.startBeat = sVal;
          activeStep.endBeat = eVal;
          renderStepsUI();
          renderHollowBoxXML();
          renderHollowBoxPreviewCanvas(hbState.currentTimeMs);
        });
        endSelect.addEventListener('change', () => {
          let sVal = parseInt(startSelect.value);
          let eVal = parseInt(endSelect.value);
          if (eVal <= sVal) {
            sVal = Math.max(1, eVal - 1);
            startSelect.value = sVal;
          }
          activeStep.startBeat = sVal;
          activeStep.endBeat = eVal;
          renderStepsUI();
          renderHollowBoxXML();
          renderHollowBoxPreviewCanvas(hbState.currentTimeMs);
        });
      }

      // Wire Curve Presets
      card.querySelectorAll('.hb-curve-preset').forEach(btn => {
        btn.addEventListener('click', () => {
          activeStep.easing = btn.dataset.curve;
          const lbl = card.querySelector('#hbActiveCurveLabel');
          if (lbl) lbl.textContent = activeStep.easing;
          renderHollowBoxXML();
        });
      });

      // Wire Edit in Graph Modal
      const btnGraph = card.querySelector('#btnHbEditGraph');
      if (btnGraph) {
        btnGraph.addEventListener('click', () => {
          const stepIdx = activeStep.stepIndex - 1;
          currentEditingTarget = `hb-step-${stepIdx}`;
          const parts = parseBezierEasing(activeStep.easing);
          const modal = document.getElementById('graphModal');
          const iframe = document.getElementById('graphIframe');
          if (modal && iframe) {
            modal.style.display = 'flex';
            iframe.style.display = 'block';
            if (iframe.contentWindow) {
              try {
                iframe.contentWindow.postMessage({
                  type: 'SET_BEZIER',
                  x1: parts[0], y1: parts[1], x2: parts[2], y2: parts[3]
                }, '*');
              } catch (e) {}
            }
          }
        });
      }

      hbStepsContainer.appendChild(card);
    }

    // Dynamic field renderer for multiple active variables
    function renderStepFields(step, container) {
      if (!container) return;
      container.innerHTML = '';

      const vList = getStepActiveVars(step);
      if (vList.length === 0) {
        container.innerHTML = `
          <div style="padding: 16px; text-align: center; color: var(--text-3); font-size: 11px; border: 1px dashed var(--line); border-radius: var(--r-sm); margin-bottom: 12px;">
            No animated variables active for this step.<br>Click any variable button above to activate it.
          </div>
        `;
        return;
      }

      const makeSliderRow = (label, propKey, min, max, stepVal, unit = '') => {
        const row = document.createElement('div');
        row.className = 'control-group';
        row.style.marginBottom = '8px';
        const curVal = step[propKey] !== undefined ? step[propKey] : 0;
        row.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
            <label style="margin: 0; font-size: 10.5px; color: var(--text-2);">${label}</label>
            <span class="fmeta-specs" id="${propKey}_val" style="color: var(--cyan); font-size: 10.5px;">${curVal}${unit}</span>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <input type="range" min="${min}" max="${max}" step="${stepVal}" value="${curVal}" style="flex: 1; accent-color: var(--cyan);">
            <input type="number" min="${min}" max="${max}" step="${stepVal}" value="${curVal}" class="styled-input" style="width: 72px; padding: 3px 6px; text-align: center; font-size: 11px;">
          </div>
        `;
        const slider = row.querySelector('input[type="range"]');
        const num = row.querySelector('input[type="number"]');
        const valSpan = row.querySelector(`#${propKey}_val`);

        const syncVal = (v) => {
          const parsed = parseFloat(v);
          step[propKey] = isNaN(parsed) ? 0 : parsed;
          slider.value = step[propKey];
          num.value = step[propKey];
          if (valSpan) valSpan.textContent = `${step[propKey]}${unit}`;
          updateCardDeltas(step);
          renderHollowBoxXML();
          renderHollowBoxPreviewCanvas(hbState.currentTimeMs);
        };

        slider.addEventListener('input', (e) => syncVal(e.target.value));
        num.addEventListener('input', (e) => syncVal(e.target.value));
        return row;
      };

      const updateCardDeltas = (s) => {
        container.querySelectorAll('.hb-var-card').forEach(cardEl => {
          const vKey = cardEl.dataset.varKey;
          const deltaSpan = cardEl.querySelector('.hb-var-card-delta');
          if (!deltaSpan) return;
          if (vKey === 'posX') deltaSpan.textContent = `Δ ${(s.posXEnd - s.posXStart).toFixed(0)}px`;
          else if (vKey === 'posY') deltaSpan.textContent = `Δ ${(s.posYEnd - s.posYStart).toFixed(0)}px`;
          else if (vKey === 'posZ') deltaSpan.textContent = `Δ ${(s.posZEnd - s.posZStart).toFixed(0)}px`;
          else if (vKey === 'rotate') deltaSpan.textContent = `Δ ${(s.rotateEndY - s.rotateStartY).toFixed(0)}°`;
          else if (vKey === 'width') deltaSpan.textContent = `Δ ${(s.widthEnd - s.widthStart).toFixed(2)}x`;
          else if (vKey === 'height') deltaSpan.textContent = `Δ ${(s.heightEnd - s.heightStart).toFixed(2)}x`;
          else if (vKey === 'depth') deltaSpan.textContent = `Δ ${(s.depthEnd - s.depthStart).toFixed(2)}x`;
          else if (vKey === 'scale') deltaSpan.textContent = `Δ ${(s.scaleEnd - s.scaleStart).toFixed(2)}x`;
        });
      };

      vList.forEach(vKey => {
        const vDef = HB_VARIABLES.find(x => x.key === vKey) || { key: vKey, label: vKey, icon: '•', unit: '' };
        const varCard = document.createElement('div');
        varCard.className = 'hb-var-card';
        varCard.dataset.varKey = vKey;

        let deltaStr = '';
        if (vKey === 'posX') deltaStr = `Δ ${(step.posXEnd - step.posXStart).toFixed(0)}px`;
        else if (vKey === 'posY') deltaStr = `Δ ${(step.posYEnd - step.posYStart).toFixed(0)}px`;
        else if (vKey === 'posZ') deltaStr = `Δ ${(step.posZEnd - step.posZStart).toFixed(0)}px`;
        else if (vKey === 'rotate') deltaStr = `Δ ${(step.rotateEndY - step.rotateStartY).toFixed(0)}°`;
        else if (vKey === 'width') deltaStr = `Δ ${(step.widthEnd - step.widthStart).toFixed(2)}x`;
        else if (vKey === 'height') deltaStr = `Δ ${(step.heightEnd - step.heightStart).toFixed(2)}x`;
        else if (vKey === 'depth') deltaStr = `Δ ${(step.depthEnd - step.depthStart).toFixed(2)}x`;
        else if (vKey === 'scale') deltaStr = `Δ ${(step.scaleEnd - step.scaleStart).toFixed(2)}x`;

        varCard.innerHTML = `
          <div class="hb-var-card-header">
            <div class="hb-var-card-title">
              <span>${vDef.icon}</span>
              <span>${vDef.label}</span>
            </div>
            <div style="display: flex; gap: 6px; align-items: center;">
              <span class="hb-var-card-delta">${deltaStr}</span>
              <button type="button" class="hb-var-card-del" title="Remove ${vDef.label}">✕</button>
            </div>
          </div>
          <div class="hb-var-card-body"></div>
        `;

        const body = varCard.querySelector('.hb-var-card-body');
        const delBtn = varCard.querySelector('.hb-var-card-del');

        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleStepVar(step, vKey);
          renderStepPillsUI();
          renderStepsUI();
          renderHollowBoxXML();
          renderHollowBoxPreviewCanvas(hbState.currentTimeMs);
        });

        if (vKey === 'posX') {
          body.appendChild(makeSliderRow('Position X Start', 'posXStart', -1000, 1000, 5, 'px'));
          body.appendChild(makeSliderRow('Position X End', 'posXEnd', -1000, 1000, 5, 'px'));
        } else if (vKey === 'posY') {
          body.appendChild(makeSliderRow('Position Y Start', 'posYStart', -1000, 1000, 5, 'px'));
          body.appendChild(makeSliderRow('Position Y End', 'posYEnd', -1000, 1000, 5, 'px'));
        } else if (vKey === 'posZ') {
          body.appendChild(makeSliderRow('Position Z Start', 'posZStart', -1000, 1000, 5, 'px'));
          body.appendChild(makeSliderRow('Position Z End', 'posZEnd', -1000, 1000, 5, 'px'));
        } else if (vKey === 'rotate') {
          body.appendChild(makeSliderRow('Rotate Y Start (Turn)', 'rotateStartY', -360, 360, 5, '°'));
          body.appendChild(makeSliderRow('Rotate Y End (Turn)', 'rotateEndY', -360, 360, 5, '°'));
          body.appendChild(makeSliderRow('Rotate X Tilt', 'rotateEndX', -180, 180, 5, '°'));
          body.appendChild(makeSliderRow('Rotate Z Roll', 'rotateEndZ', -180, 180, 5, '°'));
        } else if (vKey === 'width') {
          body.appendChild(makeSliderRow('Width Start', 'widthStart', 0.05, 4.0, 0.05, 'x'));
          body.appendChild(makeSliderRow('Width End', 'widthEnd', 0.05, 4.0, 0.05, 'x'));
        } else if (vKey === 'height') {
          body.appendChild(makeSliderRow('Height Start', 'heightStart', 0.05, 4.0, 0.05, 'x'));
          body.appendChild(makeSliderRow('Height End', 'heightEnd', 0.05, 4.0, 0.05, 'x'));
        } else if (vKey === 'depth') {
          body.appendChild(makeSliderRow('Depth Start', 'depthStart', 0.05, 4.0, 0.05, 'x'));
          body.appendChild(makeSliderRow('Depth End', 'depthEnd', 0.05, 4.0, 0.05, 'x'));
        } else if (vKey === 'scale') {
          body.appendChild(makeSliderRow('Scale Start', 'scaleStart', 0.05, 3.0, 0.05, 'x'));
          body.appendChild(makeSliderRow('Scale End', 'scaleEnd', 0.05, 3.0, 0.05, 'x'));
        }

        container.appendChild(varCard);
      });
    }

    // Bezier callback from Graph.html modal
    onHollowBoxBezierUpdate = function (stepIdx, easingStr) {
      if (hbState.steps[stepIdx]) {
        hbState.steps[stepIdx].easing = easingStr;
        const lbl = document.getElementById('hbActiveCurveLabel');
        if (lbl) lbl.textContent = easingStr;
        renderHollowBoxXML();
      }
    };

    // ---- Evaluate State at Time `t` (ms) ----
    function evaluateHollowBoxAt(timeMs) {
      const activeSteps = hbState.steps.slice(0, hbState.stepCount);

      // Base inner settings matching Project Name 304
      let curPosX = 0;
      let curPosY = 100;
      let curPosZ = -25;
      let curRotX = 0;
      let curRotY = 0;
      let curRotZ = 0;
      let curWidth = 1.0;
      let curHeight = 1.0;
      let curDepth = 1.0;
      let curScale = 0.50;
      let currentActiveStepIdx = 1;

      for (let i = 0; i < activeSteps.length; i++) {
        const step = activeSteps[i];
        const sTime = hbState.beats[step.startBeat - 1] ? hbState.beats[step.startBeat - 1].timeMs : 0;
        const eTime = hbState.beats[step.endBeat - 1] ? hbState.beats[step.endBeat - 1].timeMs : 2000;

        if (timeMs >= sTime && timeMs <= eTime) {
          currentActiveStepIdx = step.stepIndex;
        }

        let progress = 0;
        if (timeMs >= eTime) {
          progress = 1.0;
        } else if (timeMs <= sTime) {
          progress = 0.0;
        } else {
          const u = (timeMs - sTime) / Math.max(1, (eTime - sTime));
          const bez = parseBezierEasing(step.easing);
          progress = solveCubicBezier(u, bez[0], bez[1], bez[2], bez[3]);
        }

        const lerp = (a, b) => a + (b - a) * progress;

        const vList = getStepActiveVars(step);
        if (vList.includes('posX')) {
          curPosX = lerp(step.posXStart, step.posXEnd);
        }
        if (vList.includes('posY')) {
          curPosY = lerp(step.posYStart, step.posYEnd);
        }
        if (vList.includes('posZ')) {
          curPosZ = lerp(step.posZStart, step.posZEnd);
        }
        if (vList.includes('rotate')) {
          curRotX = lerp(step.rotateStartX || 0, step.rotateEndX || 0);
          curRotY = lerp(step.rotateStartY || 0, step.rotateEndY || 0);
          curRotZ = lerp(step.rotateStartZ || 0, step.rotateEndZ || 0);
        }
        if (vList.includes('width')) {
          curWidth = lerp(step.widthStart, step.widthEnd);
        }
        if (vList.includes('height')) {
          curHeight = lerp(step.heightStart, step.heightEnd);
        }
        if (vList.includes('depth')) {
          curDepth = lerp(step.depthStart, step.depthEnd);
        }
        if (vList.includes('scale')) {
          curScale = lerp(step.scaleStart, step.scaleEnd);
        }
      }

      return {
        stepIdx: currentActiveStepIdx,
        posX: curPosX,
        posY: curPosY,
        posZ: curPosZ,
        rotX: curRotX,
        rotY: curRotY,
        rotZ: curRotZ,
        width: curWidth,
        height: curHeight,
        depth: curDepth,
        scale: curScale
      };
    }

    // ---- 3D Canvas Preview Engine ----
    function renderHollowBoxPreviewCanvas(timeMs) {
      if (!hbPreviewCanvas) return;
      const ctx = hbPreviewCanvas.getContext('2d');
      const W = hbPreviewCanvas.width;
      const H = hbPreviewCanvas.height;
      const cx = W / 2;
      const cy = H / 2;

      // Clear & Background
      ctx.clearRect(0, 0, W, H);
      const bgGrad = ctx.createRadialGradient(cx, cy, 30, cx, cy, W * 0.7);
      bgGrad.addColorStop(0, '#0c102c');
      bgGrad.addColorStop(1, '#02040b');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Evaluate motion state
      const state = evaluateHollowBoxAt(timeMs);

      // Update Telemetry
      if (hbTelemPos) hbTelemPos.textContent = `POS: ${state.posX.toFixed(0)}, ${state.posY.toFixed(0)}, ${state.posZ.toFixed(0)}`;
      if (hbTelemRot) hbTelemRot.textContent = `ROT: ${state.rotX.toFixed(0)}°, ${state.rotY.toFixed(0)}°, ${state.rotZ.toFixed(0)}°`;
      if (hbTelemDims) hbTelemDims.textContent = `W:${state.width.toFixed(2)} H:${state.height.toFixed(2)} D:${state.depth.toFixed(2)}`;
      if (hbPreviewHudTag) hbPreviewHudTag.textContent = `STEP ${state.stepIdx} ACTIVE`;

      // Helper: 3D point projection
      function project3D(x, y, z, rotXDeg, rotYDeg, rotZDeg, transX, transY, transZ) {
        const radX = (rotXDeg || 0) * (Math.PI / 180);
        const radY = (rotYDeg || 0) * (Math.PI / 180);
        const radZ = (rotZDeg || 0) * (Math.PI / 180);

        // Rotation Y
        let x1 = x * Math.cos(radY) + z * Math.sin(radY);
        let y1 = y;
        let z1 = -x * Math.sin(radY) + z * Math.cos(radY);

        // Rotation X
        let x2 = x1;
        let y2 = y1 * Math.cos(radX) - z1 * Math.sin(radX);
        let z2 = y1 * Math.sin(radX) + z1 * Math.cos(radX);

        // Rotation Z
        let x3 = x2 * Math.cos(radZ) - y2 * Math.sin(radZ);
        let y3 = x2 * Math.sin(radZ) + y2 * Math.cos(radZ);
        let z3 = z2;

        // Translation
        const wx = x3 + (transX || 0);
        const wy = y3 + (transY || 0);
        const wz = z3 + (transZ || 0);

        // Perspective camera
        const cameraDist = 650;
        const pz = wz + cameraDist;
        const factor = pz > 10 ? cameraDist / pz : 1;

        return {
          px: cx + wx * factor * 0.42,
          py: cy + wy * factor * 0.42,
          z: wz
        };
      }

      // Draw Perspective Floor Grid
      ctx.strokeStyle = 'rgba(150, 160, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let gx = -300; gx <= 300; gx += 60) {
        const p1 = project3D(gx, 240, -300, 0, 0, 0, 0, 0, 0);
        const p2 = project3D(gx, 240, 300, 0, 0, 0, 0, 0, 0);
        ctx.beginPath();
        ctx.moveTo(p1.px, p1.py);
        ctx.lineTo(p2.px, p2.py);
        ctx.stroke();
      }
      for (let gz = -300; gz <= 300; gz += 60) {
        const p1 = project3D(-300, 240, gz, 0, 0, 0, 0, 0, 0);
        const p2 = project3D(300, 240, gz, 0, 0, 0, 0, 0, 0);
        ctx.beginPath();
        ctx.moveTo(p1.px, p1.py);
        ctx.lineTo(p2.px, p2.py);
        ctx.stroke();
      }

      // 3D Box Wireframe Renderer
      function drawBox(halfW, halfH, halfD, rx, ry, rz, tx, ty, tz, strokeColor, fillColor, label, isDashed) {
        const corners = [
          [-halfW, -halfH, -halfD], [halfW, -halfH, -halfD],
          [halfW, halfH, -halfD],   [-halfW, halfH, -halfD],
          [-halfW, -halfH, halfD],  [halfW, -halfH, halfD],
          [halfW, halfH, halfD],    [-halfW, halfH, halfD]
        ];

        const pts = corners.map(c => project3D(c[0], c[1], c[2], rx, ry, rz, tx, ty, tz));

        const faces = [
          [0, 1, 2, 3], // Front
          [4, 5, 6, 7], // Back
          [0, 1, 5, 4], // Top
          [2, 3, 7, 6], // Bottom
          [0, 3, 7, 4], // Left
          [1, 2, 6, 5]  // Right
        ];

        // Draw translucent faces
        if (fillColor) {
          ctx.fillStyle = fillColor;
          faces.forEach(f => {
            ctx.beginPath();
            ctx.moveTo(pts[f[0]].px, pts[f[0]].py);
            ctx.lineTo(pts[f[1]].px, pts[f[1]].py);
            ctx.lineTo(pts[f[2]].px, pts[f[2]].py);
            ctx.lineTo(pts[f[3]].px, pts[f[3]].py);
            ctx.closePath();
            ctx.fill();
          });
        }

        // Draw edges
        ctx.save();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = isDashed ? 1.2 : 1.8;
        if (isDashed) ctx.setLineDash([4, 4]);

        const edges = [
          [0,1],[1,2],[2,3],[3,0],
          [4,5],[5,6],[6,7],[7,4],
          [0,4],[1,5],[2,6],[3,7]
        ];

        edges.forEach(e => {
          ctx.beginPath();
          ctx.moveTo(pts[e[0]].px, pts[e[0]].py);
          ctx.lineTo(pts[e[1]].px, pts[e[1]].py);
          ctx.stroke();
        });
        ctx.restore();

        // Label Tag
        if (label) {
          const topCenter = project3D(0, -halfH, 0, rx, ry, rz, tx, ty, tz);
          ctx.fillStyle = strokeColor;
          ctx.font = '700 9px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(label, topCenter.px, topCenter.py - 8);
        }
      }

      // 1. Draw Outer "Original HB" (Scale 1.0)
      if (hbState.structureMode === 'nested' || hbState.structureMode === 'originalOnly') {
        drawBox(
          140, 175, 140,
          0, 0, 0,
          0, 40, 0,
          'rgba(46, 230, 255, 0.45)',
          'rgba(46, 230, 255, 0.04)',
          'Original HB (Outer Shell)',
          true
        );
      }

      // 2. Draw Inner "Settings" Hollow Box (Positioned inside, scale 0.5, moving)
      if (hbState.structureMode === 'nested' || hbState.structureMode === 'settingsOnly') {
        const sW = 140 * state.scale * state.width;
        const sH = 175 * state.scale * state.height;
        const sD = 140 * state.scale * state.depth;

        drawBox(
          sW, sH, sD,
          state.rotX, state.rotY, state.rotZ,
          state.posX * 0.45,
          (state.posY * 0.45) - 15,
          state.posZ * 0.45,
          '#ff4fd8',
          'rgba(255, 79, 216, 0.15)',
          'Settings (Inner HB)',
          false
        );
      }
    }

    // ---- Scrubber & Playhead Timeline ----
    function updateTimelineScrubberMarks() {
      if (!hbBeatMarkers) return;
      hbBeatMarkers.innerHTML = '';
      const totalMs = hbState.projectDurationMs || 2000;

      hbState.beats.forEach((b) => {
        const pct = Math.min(100, Math.max(0, (b.timeMs / totalMs) * 100));
        const mark = document.createElement('span');
        mark.className = 'hb-marker-tick';
        mark.style.left = `${pct.toFixed(2)}%`;
        mark.textContent = `B${b.id}`;
        hbBeatMarkers.appendChild(mark);
      });
    }

    function togglePlayback() {
      hbState.isPlaying = !hbState.isPlaying;
      if (hbPlayBtn) {
        hbPlayBtn.innerHTML = hbState.isPlaying
          ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
          : `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
      }
      if (hbState.isPlaying) {
        hbState.lastTimestamp = performance.now();
        playLoop();
      } else {
        if (hbState.animFrameId) cancelAnimationFrame(hbState.animFrameId);
      }
    }

    function playLoop(timestamp) {
      if (!hbState.isPlaying) return;
      const now = timestamp || performance.now();
      const dt = now - (hbState.lastTimestamp || now);
      hbState.lastTimestamp = now;

      hbState.currentTimeMs += dt;
      if (hbState.currentTimeMs > hbState.projectDurationMs) {
        hbState.currentTimeMs = 0; // loop
      }

      if (hbTimelineScrubber) {
        hbTimelineScrubber.value = hbState.currentTimeMs;
      }
      if (hbPlayheadTimecode) {
        hbPlayheadTimecode.textContent = `${(hbState.currentTimeMs / 1000).toFixed(2)}s`;
      }

      renderHollowBoxPreviewCanvas(hbState.currentTimeMs);
      hbState.animFrameId = requestAnimationFrame(playLoop);
    }

    // ---- XML Export Generator ----
    function generateHollowBoxXML() {
      const totalMs = Math.max(1, hbState.projectDurationMs);
      const totalTimeAm = totalMs - 1; // 1999 for 2000ms comp
      const mediaUri = escapeXmlAttr(hbState.mediaUri.trim());
      const activeSteps = hbState.steps.slice(0, hbState.stepCount);
      const t = '  ';

      let xml = `<?xml version='1.0' encoding='UTF-8' ?>\n`;
      xml += `<!--\n`;
      xml += `Created by Alight Motion (http://alightmotion.com)\n`;
      xml += `Hollow Box Maker — Flippy Studio v3\n`;
      xml += `Architecture: Project Name 304 (Original HB + Inner Settings)\n`;
      xml += `-->\n`;
      xml += `<scene title="Project Name 304" width="1080" height="1350" exportWidth="1920" exportHeight="1080" bgcolor="#FF000000" totalTime="${totalTimeAm}" fps="60" modifiedTime="${Date.now()}" amver="868" ffver="107" am="com.alightcreative.motion/6.2.59" amplatform="ios" precompose="dynamicResolution" retime="freeze">\n`;
      xml += `${t}<media uri="${mediaUri}" type="video/mp4" duration="26943" size="48633978" fps="60" infoUpdated="${Date.now()}" width="1080" height="1350"/>\n`;

      // Bookmarks for musical beats
      hbState.beats.forEach(b => {
        xml += `${t}<bookmark t="${b.timeMs}"/>\n`;
      });

      // EmbedScene Inner Scene Template
      const innerSceneXml = (label) => {
        let is = '';
        is += `${t}${t}<scene title="" width="1082" height="1352" exportWidth="1920" exportHeight="1080" bgcolor="#00000000" totalTime="${totalTimeAm}" fps="60" modifiedTime="0" amver="868" ffver="107" am="com.alightcreative.motion/6.2.59" amplatform="ios" precompose="dynamicResolution" retime="off">\n`;
        is += `${t}${t}${t}<shape id="1" startTime="0" endTime="${totalTimeAm}" fillType="media" fillVideo="${mediaUri}" inTime="3867" mediaFillMode="fill" s=".rect">\n`;
        is += `${t}${t}${t}${t}<transform>\n`;
        is += `${t}${t}${t}${t}${t}<location value="540.000000,675.000000,0.000000"/>\n`;
        is += `${t}${t}${t}${t}</transform>\n`;
        is += `${t}${t}${t}${t}<property name="size" type="vec2" value="540.000000,675.000000"/>\n`;
        is += `${t}${t}${t}</shape>\n`;
        is += `${t}${t}${t}<shape id="2" label="Rectangle 1" startTime="0" endTime="${totalTimeAm}" fillType="color" blending="mask" s=".rect">\n`;
        is += `${t}${t}${t}${t}<transform>\n`;
        is += `${t}${t}${t}${t}${t}<location value="540.000000,675.000000,0.000000"/>\n`;
        is += `${t}${t}${t}${t}${t}<scale value="5.400000,6.750000"/>\n`;
        is += `${t}${t}${t}${t}</transform>\n`;
        is += `${t}${t}${t}${t}<fillColor value="#FFBFCF49"/>\n`;
        is += `${t}${t}${t}</shape>\n`;
        is += `${t}${t}</scene>\n`;
        return is;
      };

      // 1. Original HB EmbedScene (Outer Box)
      if (hbState.structureMode === 'nested' || hbState.structureMode === 'originalOnly') {
        xml += `${t}<embedScene id="3" label="Original HB" startTime="0" endTime="${totalTimeAm}" fillType="intrinsic">\n`;
        xml += `${t}${t}<transform>\n`;
        xml += `${t}${t}${t}<location value="540.000000,675.000000,0.000000"/>\n`;
        xml += `${t}${t}</transform>\n`;
        xml += `${t}${t}<fillColor value="#FF000000"/>\n`;
        xml += `${t}${t}<effect id="com.alightcreative.effects.hollowbox" locallyApplied="true">\n`;
        xml += `${t}${t}${t}<property name="shadingType" type="int" value="0"/>\n`;
        xml += `${t}${t}</effect>\n`;
        xml += `${t}${t}<effect id="com.alightcreative.effects.stretch2" locallyApplied="true">\n`;
        xml += `${t}${t}${t}<property name="angle" type="float" value="${hbState.stretchAngle.toFixed(6)}"/>\n`;
        xml += `${t}${t}${t}<property name="scale" type="float" value="${hbState.stretchScale.toFixed(6)}"/>\n`;
        xml += `${t}${t}</effect>\n`;
        xml += innerSceneXml("Original HB");
        xml += `${t}</embedScene>\n`;
      }

      // 2. Settings EmbedScene (Inner Hollow Box)
      if (hbState.structureMode === 'nested' || hbState.structureMode === 'settingsOnly') {
        xml += `${t}<embedScene id="4" label="Settings" startTime="0" endTime="${totalTimeAm}" fillType="intrinsic">\n`;
        xml += `${t}${t}<transform>\n`;
        xml += `${t}${t}${t}<location value="540.000000,675.000000,0.000000"/>\n`;
        xml += `${t}${t}</transform>\n`;
        xml += `${t}${t}<fillColor value="#FF000000"/>\n`;
        xml += `${t}${t}<effect id="com.alightcreative.effects.hollowbox" locallyApplied="true">\n`;

        // Check which properties are animated across steps
        const posSteps = activeSteps.filter(s => {
          const v = getStepActiveVars(s);
          return v.includes('posX') || v.includes('posY') || v.includes('posZ');
        });
        const rotSteps = activeSteps.filter(s => getStepActiveVars(s).includes('rotate'));
        const depthSteps = activeSteps.filter(s => getStepActiveVars(s).includes('depth'));
        const widthSteps = activeSteps.filter(s => getStepActiveVars(s).includes('width'));
        const heightSteps = activeSteps.filter(s => getStepActiveVars(s).includes('height'));
        const scaleSteps = activeSteps.filter(s => getStepActiveVars(s).includes('scale'));

        // Position Property (Keyframes)
        if (posSteps.length > 0) {
          xml += `${t}${t}${t}<property name="position" type="vec3">\n`;
          posSteps.forEach(s => {
            const vList = getStepActiveVars(s);
            const startT = (hbState.beats[s.startBeat - 1].timeMs / totalMs).toFixed(6);
            const endT = (hbState.beats[s.endBeat - 1].timeMs / totalMs).toFixed(6);
            const startX = s.posXStart !== undefined ? s.posXStart : 0;
            const endX = vList.includes('posX') ? s.posXEnd : startX;
            const startY = s.posYStart !== undefined ? s.posYStart : 100;
            const endY = vList.includes('posY') ? s.posYEnd : startY;
            const startZ = s.posZStart !== undefined ? s.posZStart : -25;
            const endZ = vList.includes('posZ') ? s.posZEnd : startZ;
            const v1 = `${startX.toFixed(6)},${startY.toFixed(6)},${startZ.toFixed(6)}`;
            const v2 = `${endX.toFixed(6)},${endY.toFixed(6)},${endZ.toFixed(6)}`;
            const bezParts = s.easing.replace(/,/g, ' ').trim().split(/\s+/).join(' ');
            xml += `${t}${t}${t}${t}<kf t="${startT}" v="${v1}"/>\n`;
            xml += `${t}${t}${t}${t}<kf t="${endT}" v="${v2}" e="cubicBezier ${bezParts}"/>\n`;
          });
          xml += `${t}${t}${t}</property>\n`;
        } else {
          xml += `${t}${t}${t}<property name="position" type="vec3" value="0.000000,100.000000,-25.000000"/>\n`;
        }

        // Rotate Property
        if (rotSteps.length > 0) {
          xml += `${t}${t}${t}<property name="rotate" type="vec3">\n`;
          rotSteps.forEach(s => {
            const startT = (hbState.beats[s.startBeat - 1].timeMs / totalMs).toFixed(6);
            const endT = (hbState.beats[s.endBeat - 1].timeMs / totalMs).toFixed(6);
            const v1 = `${(s.rotateStartX || 0).toFixed(6)},${(s.rotateStartY || 0).toFixed(6)},${(s.rotateStartZ || 0).toFixed(6)}`;
            const v2 = `${(s.rotateEndX || 0).toFixed(6)},${(s.rotateEndY || 0).toFixed(6)},${(s.rotateEndZ || 0).toFixed(6)}`;
            const bezParts = s.easing.replace(/,/g, ' ').trim().split(/\s+/).join(' ');
            xml += `${t}${t}${t}${t}<kf t="${startT}" v="${v1}"/>\n`;
            xml += `${t}${t}${t}${t}<kf t="${endT}" v="${v2}" e="cubicBezier ${bezParts}"/>\n`;
          });
          xml += `${t}${t}${t}</property>\n`;
        }

        // Depth Property
        if (depthSteps.length > 0) {
          xml += `${t}${t}${t}<property name="depth" type="float">\n`;
          depthSteps.forEach(s => {
            const startT = (hbState.beats[s.startBeat - 1].timeMs / totalMs).toFixed(6);
            const endT = (hbState.beats[s.endBeat - 1].timeMs / totalMs).toFixed(6);
            const bezParts = s.easing.replace(/,/g, ' ').trim().split(/\s+/).join(' ');
            xml += `${t}${t}${t}${t}<kf t="${startT}" v="${s.depthStart.toFixed(6)}"/>\n`;
            xml += `${t}${t}${t}${t}<kf t="${endT}" v="${s.depthEnd.toFixed(6)}" e="cubicBezier ${bezParts}"/>\n`;
          });
          xml += `${t}${t}${t}</property>\n`;
        }

        // Width Property
        if (widthSteps.length > 0) {
          xml += `${t}${t}${t}<property name="width" type="float">\n`;
          widthSteps.forEach(s => {
            const startT = (hbState.beats[s.startBeat - 1].timeMs / totalMs).toFixed(6);
            const endT = (hbState.beats[s.endBeat - 1].timeMs / totalMs).toFixed(6);
            const bezParts = s.easing.replace(/,/g, ' ').trim().split(/\s+/).join(' ');
            xml += `${t}${t}${t}${t}<kf t="${startT}" v="${s.widthStart.toFixed(6)}"/>\n`;
            xml += `${t}${t}${t}${t}<kf t="${endT}" v="${s.widthEnd.toFixed(6)}" e="cubicBezier ${bezParts}"/>\n`;
          });
          xml += `${t}${t}${t}</property>\n`;
        }

        // Height Property
        if (heightSteps.length > 0) {
          xml += `${t}${t}${t}<property name="height" type="float">\n`;
          heightSteps.forEach(s => {
            const startT = (hbState.beats[s.startBeat - 1].timeMs / totalMs).toFixed(6);
            const endT = (hbState.beats[s.endBeat - 1].timeMs / totalMs).toFixed(6);
            const bezParts = s.easing.replace(/,/g, ' ').trim().split(/\s+/).join(' ');
            xml += `${t}${t}${t}${t}<kf t="${startT}" v="${s.heightStart.toFixed(6)}"/>\n`;
            xml += `${t}${t}${t}${t}<kf t="${endT}" v="${s.heightEnd.toFixed(6)}" e="cubicBezier ${bezParts}"/>\n`;
          });
          xml += `${t}${t}${t}</property>\n`;
        }

        // Scale Property
        if (scaleSteps.length > 0) {
          xml += `${t}${t}${t}<property name="scale" type="float">\n`;
          scaleSteps.forEach(s => {
            const startT = (hbState.beats[s.startBeat - 1].timeMs / totalMs).toFixed(6);
            const endT = (hbState.beats[s.endBeat - 1].timeMs / totalMs).toFixed(6);
            const bezParts = s.easing.replace(/,/g, ' ').trim().split(/\s+/).join(' ');
            xml += `${t}${t}${t}${t}<kf t="${startT}" v="${s.scaleStart.toFixed(6)}"/>\n`;
            xml += `${t}${t}${t}${t}<kf t="${endT}" v="${s.scaleEnd.toFixed(6)}" e="cubicBezier ${bezParts}"/>\n`;
          });
          xml += `${t}${t}${t}</property>\n`;
        } else {
          xml += `${t}${t}${t}<property name="scale" type="float" value="0.500000"/>\n`;
        }

        xml += `${t}${t}${t}<property name="shadingType" type="int" value="0"/>\n`;
        xml += `${t}${t}</effect>\n`;
        xml += `${t}${t}<effect id="com.alightcreative.effects.stretch2" locallyApplied="true">\n`;
        xml += `${t}${t}${t}<property name="angle" type="float" value="${hbState.stretchAngle.toFixed(6)}"/>\n`;
        xml += `${t}${t}${t}<property name="scale" type="float" value="${hbState.stretchScale.toFixed(6)}"/>\n`;
        xml += `${t}${t}</effect>\n`;
        xml += innerSceneXml("Settings");
        xml += `${t}</embedScene>\n`;
      }

      xml += `</scene>\n`;
      return xml;
    }

    function renderHollowBoxXML() {
      if (!hbXmlCodeBlock) return;
      const raw = generateHollowBoxXML();
      hbXmlCodeBlock.innerHTML = highlightXMLCode(raw);
    }

    // ---- Setup Event Listeners ----
    function initListeners() {
      // Structure mode toggle
      if (hbStructureToggle) {
        hbStructureToggle.addEventListener('click', (e) => {
          const btn = e.target.closest('.toggle-btn');
          if (!btn) return;
          hbStructureToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          hbState.structureMode = btn.dataset.value;
          renderHollowBoxXML();
          renderHollowBoxPreviewCanvas(hbState.currentTimeMs);
        });
      }

      // Target layer toggle
      if (hbTargetToggle) {
        hbTargetToggle.addEventListener('click', (e) => {
          const btn = e.target.closest('.toggle-btn');
          if (!btn) return;
          hbTargetToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          hbState.targetLayer = btn.dataset.value;
          renderHollowBoxXML();
          renderHollowBoxPreviewCanvas(hbState.currentTimeMs);
        });
      }

      // Step count toggle (2 or 4)
      if (hbStepCountToggle) {
        hbStepCountToggle.addEventListener('click', (e) => {
          const btn = e.target.closest('.toggle-btn');
          if (!btn) return;
          setStepCount(parseInt(btn.dataset.value));
        });
      }

      // Project Duration
      if (hbProjectDuration) {
        hbProjectDuration.addEventListener('input', () => {
          const ms = parseTimeStrToMs(hbProjectDuration.value);
          if (ms > 0) {
            hbState.projectDurationMs = ms;
            if (hbState.beats.length > 0) {
              hbState.beats[hbState.beats.length - 1].timeMs = ms;
              hbState.beats[hbState.beats.length - 1].timeStr = hbProjectDuration.value;
            }
            if (hbTimelineScrubber) hbTimelineScrubber.max = ms;
            updateTimelineScrubberMarks();
            renderBeatsUI();
            renderHollowBoxXML();
            renderHollowBoxPreviewCanvas(hbState.currentTimeMs);
          }
        });
      }

      // Media URI
      if (hbMediaUri) {
        hbMediaUri.addEventListener('input', () => {
          hbState.mediaUri = hbMediaUri.value;
          renderHollowBoxXML();
        });
      }

      // Stretch Params
      if (hbStretchAngle) {
        hbStretchAngle.addEventListener('input', () => {
          hbState.stretchAngle = parseFloat(hbStretchAngle.value) || 90;
          renderHollowBoxXML();
        });
      }
      if (hbStretchScale) {
        hbStretchScale.addEventListener('input', () => {
          hbState.stretchScale = parseFloat(hbStretchScale.value) || 1.25;
          renderHollowBoxXML();
        });
      }

      // Quick BPM presets
      document.querySelectorAll('[data-hb-bpm]').forEach(btn => {
        btn.addEventListener('click', () => {
          const val = btn.dataset.hbBpm;
          if (val === '304') {
            resetTo304Preset();
            return;
          }
          const bpm = parseInt(val) || 120;
          const intervalMs = Math.round((60 / bpm) * 1000);
          hbState.beats.forEach((b, idx) => {
            b.timeMs = idx * intervalMs;
            b.timeStr = msToTimeStr(b.timeMs);
          });
          const lastMs = hbState.beats[hbState.beats.length - 1].timeMs;
          hbState.projectDurationMs = lastMs;
          if (hbProjectDuration) hbProjectDuration.value = msToTimeStr(lastMs);
          if (hbTimelineScrubber) hbTimelineScrubber.max = lastMs;
          updateTimelineScrubberMarks();
          renderBeatsUI();
          renderHollowBoxXML();
          renderHollowBoxPreviewCanvas(hbState.currentTimeMs);
        });
      });

      // 304 Reset Button
      if (btnHbReset304) {
        btnHbReset304.addEventListener('click', () => {
          resetTo304Preset();
          showToast('Reloaded Project Name 304 settings!');
        });
      }

      // Play / Pause Button
      if (hbPlayBtn) {
        hbPlayBtn.addEventListener('click', togglePlayback);
      }

      // Timeline Scrubber
      if (hbTimelineScrubber) {
        hbTimelineScrubber.addEventListener('input', (e) => {
          hbState.currentTimeMs = parseInt(e.target.value) || 0;
          if (hbPlayheadTimecode) {
            hbPlayheadTimecode.textContent = `${(hbState.currentTimeMs / 1000).toFixed(2)}s`;
          }
          renderHollowBoxPreviewCanvas(hbState.currentTimeMs);
        });
      }

      // Copy XML
      if (hbCopyXmlBtn) {
        hbCopyXmlBtn.addEventListener('click', async () => {
          const xml = generateHollowBoxXML();
          try {
            await navigator.clipboard.writeText(xml);
            showToast('Hollow Box XML copied to clipboard!');
          } catch (err) {
            const textarea = document.createElement('textarea');
            textarea.value = xml;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showToast('Hollow Box XML copied to clipboard!');
          }
        });
      }

      // Download XML
      if (hbDownloadXmlBtn) {
        hbDownloadXmlBtn.addEventListener('click', () => {
          const xml = generateHollowBoxXML();
          const blob = new Blob([xml], { type: 'application/xml' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `hollow-box-${hbState.stepCount}steps-Project304.xml`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 4000);
          showToast('Downloaded Hollow Box XML!');
        });
      }
    }

    function resetTo304Preset() {
      hbState.structureMode = 'nested';
      hbState.targetLayer = 'settings';
      hbState.stepCount = 4;
      hbState.projectDurationMs = 2000;
      hbState.stretchAngle = 90.0;
      hbState.stretchScale = 1.25;
      hbState.mediaUri = 'am-internal:///BBB32FC1DE51537203F258871E0D8039FC5960A0.MP4';
      if (hbProjectDuration) hbProjectDuration.value = '00:02:00';
      if (hbMediaUri) hbMediaUri.value = hbState.mediaUri;
      if (hbStretchAngle) hbStretchAngle.value = '90';
      if (hbStretchScale) hbStretchScale.value = '1.25';
      setStepCount(4);
    }

    // Public Initializer called on tab activation
    initHollowBoxMaker = function () {
      renderBeatsUI();
      renderStepPillsUI();
      renderStepsUI();
      updateTimelineScrubberMarks();
      renderHollowBoxXML();
      renderHollowBoxPreviewCanvas(hbState.currentTimeMs);
    };

    // Auto-init on script load
    initListeners();
    renderBeatsUI();
    renderStepPillsUI();
    renderStepsUI();
    updateTimelineScrubberMarks();
    renderHollowBoxXML();
    setTimeout(() => renderHollowBoxPreviewCanvas(0), 100);
  })();

  // ==========================================
  // MOBILE SHELL — DOM migration & tab switching
  // ==========================================
  (() => {
    const MOBILE_BREAKPOINT = 800;
    let isMobileLayout = false;

    // Desktop parent references (to restore nodes when going back to desktop)
    const controlsPanel = document.getElementById('controls-panel');
    const previewPanel  = document.getElementById('preview-panel');
    const dataPanel     = document.getElementById('data-panel');
    const converterPanel = document.getElementById('converter-panel');
    const hollowboxPanel = document.getElementById('hollowboxPanel');

    // Mobile slots
    const mobileConfigSlot    = document.getElementById('mobileConfigSlot');
    const mobilePreviewSlot   = document.getElementById('mobilePreviewSlot');
    const mobileDataSlot      = document.getElementById('mobileDataSlot');
    const mobileConverterSlot = document.getElementById('mobileConverterSlot');
    const mobileHollowBoxSlot = document.getElementById('mobileHollowBoxSlot');
    const mobileTabBar        = document.getElementById('mobileTabBar');

    if (!mobileConfigSlot || !mobilePreviewSlot || !mobileDataSlot || !mobileTabBar) return;

    // Elements to migrate
    const controlsBody      = controlsPanel ? controlsPanel.querySelector('.controls-body') : null;
    const canvasContainer   = document.getElementById('canvasContainer');
    const playbackControls  = previewPanel ? previewPanel.querySelector('.playback-controls') : null;
    const formulasCard      = document.getElementById('formulasCard');
    const tableContainer    = document.getElementById('tableContainer');
    const xmlSection        = dataPanel ? dataPanel.querySelector('.xml-section') : null;

    // Store original parent + nextSibling for clean restoration
    function saveOrigin(el) {
      if (el && !el._mobileOrigin) {
        el._mobileOrigin = { parent: el.parentNode, next: el.nextSibling };
      }
    }

    function restoreOrigin(el) {
      if (el && el._mobileOrigin) {
        const { parent, next } = el._mobileOrigin;
        if (next) {
          parent.insertBefore(el, next);
        } else {
          parent.appendChild(el);
        }
      }
    }

    // Save origins on first load
    [controlsBody, canvasContainer, playbackControls, formulasCard, tableContainer, xmlSection, converterPanel, hollowboxPanel]
      .forEach(saveOrigin);

    function moveToMobile() {
      if (controlsBody) mobileConfigSlot.appendChild(controlsBody);
      if (canvasContainer) mobilePreviewSlot.appendChild(canvasContainer);
      if (playbackControls) mobilePreviewSlot.appendChild(playbackControls);
      if (formulasCard) mobilePreviewSlot.appendChild(formulasCard);
      // Place XML card first on mobile so download actions are immediately visible without scrolling
      if (xmlSection) mobileDataSlot.appendChild(xmlSection);
      if (tableContainer) mobileDataSlot.appendChild(tableContainer);
      if (converterPanel && mobileConverterSlot) {
        converterPanel.style.display = 'block';
        mobileConverterSlot.appendChild(converterPanel);
      }
      if (hollowboxPanel && mobileHollowBoxSlot) {
        hollowboxPanel.style.display = 'block';
        mobileHollowBoxSlot.appendChild(hollowboxPanel);
      }
    }

    function moveToDesktop() {
      [controlsBody, canvasContainer, playbackControls, formulasCard, tableContainer, xmlSection, converterPanel, hollowboxPanel]
        .forEach(restoreOrigin);
      // Restore desktop active tab display
      const isConverterActive = navTabConverter && navTabConverter.classList.contains('active');
      const isHollowBoxActive = navTabHollowBox && navTabHollowBox.classList.contains('active');
      if (isConverterActive) {
        switchMainTab('converter');
      } else if (isHollowBoxActive) {
        switchMainTab('hollowbox');
      } else {
        switchMainTab('studio');
      }
    }

    function checkLayout() {
      // Support portrait (<=800px) and landscape on mobile phones (height <= 520px and width <= 960px)
      const shouldBeMobile = window.innerWidth <= 800 || (window.innerHeight <= 520 && window.innerWidth <= 960);

      if (shouldBeMobile && !isMobileLayout) {
        isMobileLayout = true;
        moveToMobile();
        setTimeout(() => renderPreview(), 50);
      } else if (!shouldBeMobile && isMobileLayout) {
        isMobileLayout = false;
        moveToDesktop();
        setTimeout(() => renderPreview(), 50);
      }
    }

    // iPhone-Friendly Quick Action Handlers
    const mobileHeaderDlBtn = document.getElementById('mobileHeaderDlBtn');
    const mobileHeaderDlText = document.getElementById('mobileHeaderDlText');
    const mobileHeroDlBtn = document.getElementById('mobileHeroDlBtn');
    const mobileCopyXmlBtn = document.getElementById('mobileCopyXmlBtn');
    const mobileToggleXmlBtn = document.getElementById('mobileToggleXmlBtn');

    if (mobileHeaderDlBtn) {
      mobileHeaderDlBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const converterTab = document.getElementById('mobileTabConverter');
        const hollowboxTab = document.getElementById('mobileTabHollowBox');
        if (converterTab && converterTab.classList.contains('active')) {
          const btnDl = document.getElementById('btnDownloadConvertedXml');
          if (btnDl) btnDl.click();
        } else if (hollowboxTab && hollowboxTab.classList.contains('active')) {
          const btnDl = document.getElementById('hbDownloadXmlBtn');
          if (btnDl) btnDl.click();
        } else {
          if (downloadXmlBtn) downloadXmlBtn.click();
        }
      });
    }

    if (mobileHeroDlBtn) {
      mobileHeroDlBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (downloadXmlBtn) downloadXmlBtn.click();
      });
    }

    if (mobileCopyXmlBtn) {
      mobileCopyXmlBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (copyXmlBtn) copyXmlBtn.click();
      });
    }

    if (mobileToggleXmlBtn) {
      mobileToggleXmlBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (toggleXmlBtn) toggleXmlBtn.click();
      });
    }

    // Tab switching & glider animation
    const tabButtons = mobileTabBar.querySelectorAll('.mobile-tab');
    const tabContents = document.querySelectorAll('.mobile-tab-content');
    const tabGlider = mobileTabBar.querySelector('.tab-glider');

    function updateTabGlider() {
      const activeBtn = mobileTabBar.querySelector('.mobile-tab.active');
      if (activeBtn && tabGlider) {
        tabGlider.style.left = activeBtn.offsetLeft + 'px';
        tabGlider.style.width = activeBtn.offsetWidth + 'px';
      }
    }

    tabButtons.forEach(btn => {
      function activateTab(e) {
        if (e && e.type === 'touchstart') e.preventDefault();
        const targetId = btn.getAttribute('data-tab');

        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        tabContents.forEach(tc => tc.classList.remove('active'));
        const target = document.getElementById(targetId);
        if (target) {
          target.classList.add('active');
        }

        if (mobileHeaderDlText) {
          if (targetId === 'mobileTabConverter') {
            mobileHeaderDlText.textContent = 'Download Media XML';
          } else if (targetId === 'mobileTabHollowBox') {
            mobileHeaderDlText.textContent = 'Download HB XML';
          } else {
            mobileHeaderDlText.textContent = 'Download XML';
          }
        }

        updateTabGlider();
        window.scrollTo(0, 0);

        if (targetId === 'mobileTabPreview') {
          setTimeout(() => renderPreview(), 50);
        }
      }

      btn.addEventListener('click', activateTab);
      btn.addEventListener('touchend', activateTab, { passive: false });
    });

    window.addEventListener('resize', () => {
      checkLayout();
      updateTabGlider();
    });

    window.__flippyCheckLayout = function () {
      checkLayout();
      setTimeout(updateTabGlider, 60);
    };

    checkLayout();
    setTimeout(updateTabGlider, 120);
  })();

})();

