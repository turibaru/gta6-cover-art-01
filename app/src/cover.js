/* Vice Cover Lab — cover renderer.
 * Draws a multi-panel GTA-style poster on any canvas, from plain canvas
 * primitives only: gradients, clipped photos, a striped retro sun, palm
 * silhouettes drawn from curves, and extruded gradient lettering.
 * No external assets, no fonts to download, no network.
 */
(function (global) {
  'use strict';

  /* Five colour worlds. sky: top -> middle -> bottom of the poster sky.
   * tint: wash laid over each photo. title: gradient stops of the big
   * lettering. band: subtitle ribbon. ink: dark silhouette colour. */
  var PALETTES = {
    'sunset-vice': {
      label: 'Sunset Vice',
      sky: ['#2b1055', '#ff5e8a', '#ff9a3d'],
      tint: 'rgba(255, 94, 138, 0.16)',
      title: ['#ffe259', '#ffa751', '#ff5e8a'],
      band: '#ffc93d', ink: '#1c0a26', accent: '#ff5e8a'
    },
    'neon-nights': {
      label: 'Neon Nights',
      sky: ['#0b0221', '#7b2ff7', '#ff2fb3'],
      tint: 'rgba(123, 47, 247, 0.20)',
      title: ['#7df9ff', '#2ee6c8', '#ff2fb3'],
      band: '#2ee6c8', ink: '#0a0218', accent: '#ff2fb3'
    },
    'palm-pop': {
      label: 'Palm Pop',
      sky: ['#003b46', '#00b4a2', '#ffd23d'],
      tint: 'rgba(0, 180, 162, 0.14)',
      title: ['#fff3b0', '#ffd23d', '#ff6b35'],
      band: '#ff6b35', ink: '#062a2e', accent: '#ffd23d'
    },
    'noir-gold': {
      label: 'Noir Gold',
      sky: ['#0a0a0c', '#2b2b33', '#8a6d2f'],
      tint: 'rgba(255, 201, 61, 0.10)',
      title: ['#fff8dc', '#ffd97a', '#c9a227'],
      band: '#c9a227', ink: '#000000', accent: '#ffd97a'
    },
    'bubblegum': {
      label: 'Bubblegum',
      sky: ['#4a0e4e', '#c724b1', '#ff8fd1'],
      tint: 'rgba(255, 143, 209, 0.18)',
      title: ['#ffffff', '#ffd6f2', '#ff5e8a'],
      band: '#ffffff', ink: '#2e0a33', accent: '#ff8fd1'
    }
  };

  /* Layouts return panel boxes in 0..1 canvas space. slot picks which of
   * the three photo slots fills the panel. shape 'slash' clips a diagonal.
   * Panel tops sit below y=0.10 so the retro sun has a strip of sky to
   * rise in; panel bottoms stop at y=0.79 so the title block owns the
   * bottom fifth of the poster. */
  var LAYOUTS = {
    'vice-trio': {
      label: 'Vice Trio',
      panels: function () {
        return [
          { x: 0.015, y: 0.13, w: 0.255, h: 0.585, slot: 0, shape: 'rect' },
          { x: 0.29, y: 0.11, w: 0.42, h: 0.68, slot: 1, shape: 'rect' },
          { x: 0.73, y: 0.13, w: 0.255, h: 0.585, slot: 2, shape: 'rect' }
        ];
      }
    },
    'split-duo': {
      label: 'Split Duo',
      panels: function () {
        return [
          { x: 0.015, y: 0.12, w: 0.475, h: 0.66, slot: 0, shape: 'rect' },
          { x: 0.51, y: 0.12, w: 0.475, h: 0.66, slot: 1, shape: 'rect' }
        ];
      }
    },
    'grid-2x2': {
      label: 'Grid 2x2',
      panels: function () {
        return [
          { x: 0.015, y: 0.11, w: 0.475, h: 0.335, slot: 0, shape: 'rect' },
          { x: 0.51, y: 0.11, w: 0.475, h: 0.335, slot: 1, shape: 'rect' },
          { x: 0.015, y: 0.46, w: 0.475, h: 0.335, slot: 2, shape: 'rect' },
          { x: 0.51, y: 0.46, w: 0.475, h: 0.335, slot: 0, shape: 'rect' }
        ];
      }
    },
    'hero-solo': {
      label: 'Hero Solo',
      panels: function () {
        /* One tall portrait panel in the middle, sky on both sides:
         * a full-width strip would crop a square photo down to a
         * headless torso, while this keeps the subject whole. */
        return [{ x: 0.24, y: 0.1, w: 0.52, h: 0.69, slot: 1, shape: 'rect' }];
      }
    },
    'diagonal-slash': {
      label: 'Diagonal Slash',
      panels: function () {
        return [
          { x: 0, y: 0.11, w: 0.66, h: 0.68, slot: 0, shape: 'slash-left' },
          { x: 0.34, y: 0.11, w: 0.66, h: 0.68, slot: 1, shape: 'slash-right' }
        ];
      }
    }
  };

  /* Where the retro sun sits per layout, in fractions of the canvas
   * (x, y, radius as a fraction of width). Hero Solo draws its sun on
   * the photo instead, so it has no sky spot here. */
  var SUN_SPOTS = {
    'vice-trio': [0.5, 0.062, 0.075],
    'split-duo': [0.5, 0.062, 0.08],
    'grid-2x2': [0.5, 0.058, 0.07],
    'diagonal-slash': [0.5, 0.058, 0.07]
  };

  /* Colour grade per photo, expressed as a canvas filter string. */
  function gradeFilter(grade) {
    switch (grade) {
      case 'vivid': return 'saturate(1.4) contrast(1.14) brightness(1.03)';
      case 'warm': return 'sepia(0.30) saturate(1.35) contrast(1.05)';
      case 'cool': return 'saturate(1.18) hue-rotate(-16deg) brightness(1.06)';
      case 'bw': return 'grayscale(1) contrast(1.12) brightness(1.02)';
      case 'noir': return 'grayscale(1) contrast(1.5) brightness(0.9)';
      default: return 'saturate(1.08) contrast(1.04)';
    }
  }

  /* Small deterministic PRNG so the grain looks the same every render. */
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function roundedPath(ctx, x, y, w, h, r) {
    var rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  }

  /* Cover-fit draw of one photo into a box, with zoom and x/y pan. */
  function drawPhotoInto(ctx, img, box, slot) {
    var zoom = slot.zoom || 1;
    var scale = Math.max(box.w / img.width, box.h / img.height) * zoom;
    var dw = img.width * scale;
    var dh = img.height * scale;
    var dx = box.x + (box.w - dw) / 2 + (slot.ox || 0) * box.w;
    var dy = box.y + (box.h - dh) / 2 + (slot.oy || 0) * box.h;
    ctx.save();
    ctx.filter = gradeFilter(slot.grade || 'auto');
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
  }

  /* Fallback art when a slot has no photo yet: a striped gradient tile. */
  function drawEmptyPanel(ctx, box, palette, index) {
    var g = ctx.createLinearGradient(box.x, box.y, box.x + box.w, box.y + box.h);
    g.addColorStop(0, palette.sky[1]);
    g.addColorStop(1, palette.sky[2]);
    ctx.fillStyle = g;
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(2, box.w * 0.01);
    for (var i = -2; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(box.x + i * box.w * 0.25, box.y + box.h);
      ctx.lineTo(box.x + i * box.w * 0.25 + box.w * 0.5, box.y);
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.font = '700 ' + Math.max(13, box.w * 0.055) + 'px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ADD PHOTO ' + (index + 1), box.x + box.w / 2, box.y + box.h / 2);
  }

  /* Retro sun: a gradient disc sliced into horizontal bands with gaps
   * that grow towards the bottom, drawn inside a circle clip. */
  function drawRetroSun(ctx, cx, cy, r, palette) {
    var g = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
    g.addColorStop(0, '#ffe259');
    g.addColorStop(0.55, palette.accent);
    g.addColorStop(1, palette.sky[1]);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = g;
    var y = cy - r;
    var band = r * 0.16;
    var gap = 0;
    while (y < cy + r) {
      ctx.fillRect(cx - r, y, r * 2, band);
      y += band + gap;
      gap += r * 0.045;
    }
    ctx.restore();
  }

  /* One palm silhouette: a leaning trunk plus seven drooping fronds,
   * all stroked curves in the palette ink colour. */
  function drawPalm(ctx, x, y, s, lean, ink) {
    var topX = x + lean * s;
    var topY = y - s;
    ctx.save();
    ctx.strokeStyle = ink;
    ctx.fillStyle = ink;
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(2, s * 0.075);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + lean * s * 0.4, y - s * 0.55, topX, topY);
    ctx.stroke();
    ctx.lineWidth = Math.max(1.5, s * 0.045);
    for (var i = 0; i < 7; i++) {
      var ang = -Math.PI * (0.08 + 0.13 * i) + (lean > 0 ? 0.12 : -0.12);
      var len = s * (0.52 + (i % 3) * 0.09);
      var ex = topX + Math.cos(ang) * len;
      var ey = topY + Math.sin(ang) * len * 0.55 + s * 0.22;
      var mx = topX + Math.cos(ang) * len * 0.55;
      var my = topY + Math.sin(ang) * len * 0.28 - s * 0.06;
      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.quadraticCurveTo(mx, my, ex, ey);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(topX, topY, s * 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawPalmRow(ctx, W, H, palette, u) {
    var base = H * 0.985;
    var spots = [
      [0.03, 0.16, -0.35], [0.10, 0.11, 0.3], [0.90, 0.15, 0.4],
      [0.965, 0.11, -0.3], [0.17, 0.085, -0.2], [0.83, 0.085, 0.25]
    ];
    for (var i = 0; i < spots.length; i++) {
      drawPalm(ctx, W * spots[i][0], base, H * spots[i][1], spots[i][2], palette.ink);
    }
    void u;
  }

  function drawGrain(ctx, W, H) {
    var rnd = mulberry32(20261120);
    ctx.save();
    for (var i = 0; i < 2600; i++) {
      var v = rnd();
      ctx.fillStyle = v > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
      ctx.fillRect(rnd() * W, rnd() * H, 1.6, 1.6);
    }
    ctx.restore();
  }

  /* Big extruded title: dark offset copies stacked under a gradient fill,
   * auto-shrunk until it fits the poster width. */
  function drawTitle(ctx, text, cx, y, maxW, size, palette, u) {
    var fontSize = size;
    var font = function (px) { return '900 ' + px + 'px "Arial Black", Impact, Arial, sans-serif'; };
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    /* Belt and braces against wide fallback fonts: cap by a per-letter
     * estimate first, then shrink on the real measurement, leaving a
     * margin for the extruded shadow that sticks out to the right. */
    fontSize = Math.min(fontSize, maxW / Math.max(4, text.length * 0.66));
    ctx.font = font(fontSize);
    while (ctx.measureText(text).width > maxW * 0.97 && fontSize > 22) {
      fontSize *= 0.92;
      ctx.font = font(fontSize);
    }
    var grad = ctx.createLinearGradient(cx, y - fontSize, cx, y + fontSize * 0.25);
    grad.addColorStop(0, palette.title[0]);
    grad.addColorStop(0.55, palette.title[1]);
    grad.addColorStop(1, palette.title[2]);
    var depth = Math.max(3, fontSize * 0.09);
    ctx.fillStyle = 'rgba(20,4,28,0.9)';
    for (var d = depth; d >= 2; d -= 2) ctx.fillText(text, cx, y + d);
    ctx.fillStyle = grad;
    ctx.fillText(text, cx, y);
    ctx.lineWidth = Math.max(1.5, fontSize * 0.02);
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.strokeText(text, cx, y);
    return fontSize;
  }

  function drawSubtitleBanner(ctx, text, cx, y, palette, u) {
    var fs = Math.max(15, u * 30);
    ctx.font = '800 ' + fs + 'px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var tw = ctx.measureText(text).width;
    var pad = fs * 0.9;
    var bw = tw + pad * 2;
    var bh = fs * 2.05;
    ctx.save();
    ctx.translate(cx, y);
    ctx.rotate(-0.02);
    ctx.fillStyle = palette.band;
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = u * 14;
    ctx.shadowOffsetY = u * 4;
    roundedPath(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = palette.ink === '#000000' ? '#111111' : '#241028';
    ctx.fillText(text, cx, y + fs * 0.06);
  }

  function drawBadgeAt(ctx, text, cx, cy, palette, u) {
    var r = Math.max(26, u * 42);
    var g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
    g.addColorStop(0, '#fff3b0');
    g.addColorStop(0.6, palette.band);
    g.addColorStop(1, palette.accent);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = Math.max(2, u * 3);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.stroke();
    ctx.fillStyle = palette.ink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var fs = r * 0.34;
    ctx.font = '900 ' + fs + 'px Arial, sans-serif';
    while (ctx.measureText(text).width > r * 1.55 && fs > 9) {
      fs *= 0.9;
      ctx.font = '900 ' + fs + 'px Arial, sans-serif';
    }
    ctx.fillText(text, cx, cy);
    ctx.restore();
  }

  /* The main entry point. state: layout, palette, title, subtitle,
   * tagline, badge, titlePos ('top'|'bottom'), titleSize (60..140),
   * fxSun, fxPalms, fxGrain, fxVignette, slots[3] {zoom, ox, oy, grade}.
   * photos: array of 3 HTMLImageElement-or-null, aligned with slots. */
  function drawCover(canvas, state, photos) {
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    var W = canvas.width;
    var H = canvas.height;
    var u = W / 1080;
    var palette = PALETTES[state.palette] || PALETTES['sunset-vice'];
    var layout = LAYOUTS[state.layout] || LAYOUTS['vice-trio'];
    var slots = state.slots || [];

    /* Sky. */
    var sky = ctx.createLinearGradient(0, 0, W * 0.25, H);
    sky.addColorStop(0, palette.sky[0]);
    sky.addColorStop(0.55, palette.sky[1]);
    sky.addColorStop(1, palette.sky[2]);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    /* Retro sun peeking through the strip of sky above the panels. */
    if (state.fxSun) {
      var spot = SUN_SPOTS[state.layout];
      if (spot) drawRetroSun(ctx, W * spot[0], H * spot[1], W * spot[2], palette);
    }

    /* Panels. */
    var panels = layout.panels(W, H);
    for (var i = 0; i < panels.length; i++) {
      var p = panels[i];
      var box = { x: p.x * W, y: p.y * H, w: p.w * W, h: p.h * H };
      var slot = slots[p.slot] || { zoom: 1, ox: 0, oy: 0, grade: 'auto' };
      var img = photos && photos[p.slot];
      ctx.save();
      if (p.shape === 'slash-left') {
        ctx.beginPath();
        ctx.moveTo(box.x, box.y);
        ctx.lineTo(box.x + box.w, box.y);
        ctx.lineTo(box.x + box.w * 0.62, box.y + box.h);
        ctx.lineTo(box.x, box.y + box.h);
        ctx.closePath();
        ctx.clip();
      } else if (p.shape === 'slash-right') {
        ctx.beginPath();
        ctx.moveTo(box.x + box.w * 0.38, box.y);
        ctx.lineTo(box.x + box.w, box.y);
        ctx.lineTo(box.x + box.w, box.y + box.h);
        ctx.lineTo(box.x, box.y + box.h);
        ctx.closePath();
        ctx.clip();
      } else {
        roundedPath(ctx, box.x, box.y, box.w, box.h, Math.max(4, u * 10));
        ctx.clip();
      }
      if (img) drawPhotoInto(ctx, img, box, slot);
      else drawEmptyPanel(ctx, box, palette, p.slot);
      /* Warm wash + a dark foot so panels feel printed, not pasted. */
      ctx.fillStyle = palette.tint;
      ctx.fillRect(box.x, box.y, box.w, box.h);
      var foot = ctx.createLinearGradient(0, box.y + box.h * 0.55, 0, box.y + box.h);
      foot.addColorStop(0, 'rgba(10,2,18,0)');
      foot.addColorStop(1, 'rgba(10,2,18,0.42)');
      ctx.fillStyle = foot;
      ctx.fillRect(box.x, box.y, box.w, box.h);
      ctx.restore();
      /* Frame line + slash accent. */
      ctx.save();
      ctx.lineWidth = Math.max(2, u * 4);
      ctx.strokeStyle = 'rgba(255,255,255,0.92)';
      if (p.shape === 'slash-left' || p.shape === 'slash-right') {
        ctx.beginPath();
        if (p.shape === 'slash-left') {
          ctx.moveTo(box.x + box.w, box.y);
          ctx.lineTo(box.x + box.w * 0.62, box.y + box.h);
        } else {
          ctx.moveTo(box.x + box.w * 0.38, box.y);
          ctx.lineTo(box.x, box.y + box.h);
        }
        ctx.strokeStyle = palette.band;
        ctx.lineWidth = Math.max(3, u * 6);
        ctx.stroke();
      } else {
        roundedPath(ctx, box.x, box.y, box.w, box.h, Math.max(4, u * 10));
        ctx.stroke();
      }
      ctx.restore();
    }

    /* Hero layout: the sun sits in the sky beside the portrait panel. */
    if (state.fxSun && state.layout === 'hero-solo') {
      ctx.save();
      ctx.globalAlpha = 0.92;
      drawRetroSun(ctx, W * 0.88, H * 0.16, W * 0.1, palette);
      ctx.restore();
    }

    /* Palm silhouettes along the bottom edge. */
    if (state.fxPalms) drawPalmRow(ctx, W, H, palette, u);

    /* Title block, stacked from the edge inward so nothing collides:
     * tagline nearest the edge, then the big title, then the ribbon
     * above the title's cap-top. Title size keys off the SHORTER side
     * so a landscape poster does not get lettering taller than its
     * title band. */
    var bottom = state.titlePos !== 'top';
    var bandH = H * (bottom ? 0.205 : 0.22);
    var bandY = bottom ? H - bandH : 0;
    var scrim = ctx.createLinearGradient(0, bandY, 0, bandY + bandH);
    if (bottom) {
      scrim.addColorStop(0, 'rgba(12,3,20,0)');
      scrim.addColorStop(1, 'rgba(12,3,20,0.82)');
    } else {
      scrim.addColorStop(0, 'rgba(12,3,20,0.82)');
      scrim.addColorStop(1, 'rgba(12,3,20,0)');
    }
    ctx.fillStyle = scrim;
    ctx.fillRect(0, bandY, W, bandH);

    var titleFont = Math.min(W * 0.115, H * 0.16) * ((state.titleSize || 100) / 100);
    var tagFont = Math.max(14, Math.min(u, H / 1080) * 24);
    var vScale = Math.min(u, H / 1080);
    var bannerH = Math.max(15, vScale * 30) * 2.05;
    if (bottom) {
      var tagY = H * 0.98;
      var titleY = tagY - tagFont - H * 0.014;
      var titleTop = titleY - titleFont * 0.74;
      var bannerY = titleTop - bannerH / 2 - H * 0.01;
      drawSubtitleBanner(ctx, state.subtitle || '', W / 2, bannerY, palette, vScale);
      drawTitle(ctx, (state.title || 'VICE CITY').toUpperCase(), W / 2, titleY, W * 0.94, titleFont, palette, u);
      if (state.tagline) {
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.font = 'italic ' + tagFont + 'px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(state.tagline, W / 2, tagY);
      }
    } else {
      var titleTop2 = H * 0.03;
      var titleY2 = titleTop2 + titleFont * 0.74;
      var bannerY2 = titleY2 + titleFont * 0.26 + bannerH / 2 + H * 0.012;
      var tagY2 = bannerY2 + bannerH / 2 + tagFont + H * 0.008;
      drawTitle(ctx, (state.title || 'VICE CITY').toUpperCase(), W / 2, titleY2, W * 0.94, titleFont, palette, u);
      drawSubtitleBanner(ctx, state.subtitle || '', W / 2, bannerY2, palette, vScale);
      if (state.tagline) {
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.font = 'italic ' + tagFont + 'px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(state.tagline, W / 2, tagY2);
      }
    }

    /* Badge: a sticker in the sky strip under the panels' bottom edge,
     * clear of faces and clear of the title lettering. */
    if (state.badge) {
      ctx.save();
      drawBadgeAt(ctx, state.badge.toUpperCase(), W * 0.92, H * 0.755, palette, u);
      ctx.restore();
    }

    /* Grain, vignette, outer frame. */
    if (state.fxGrain) drawGrain(ctx, W, H);
    if (state.fxVignette) {
      var vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(0,0,0,0.38)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.save();
    ctx.lineWidth = Math.max(3, u * 8);
    ctx.strokeStyle = palette.band;
    ctx.strokeRect(u * 4, u * 4, W - u * 8, H - u * 8);
    ctx.restore();
  }

  global.ViceCover = {
    PALETTES: PALETTES,
    LAYOUTS: LAYOUTS,
    drawCover: drawCover,
    gradeFilter: gradeFilter
  };
})(typeof window !== 'undefined' ? window : globalThis);
