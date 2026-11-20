// Vice-style poster cover renderer — all original art, drawn with canvas primitives.
// No Rockstar logo, artwork or fonts: lettering is system bold sans, the sun and palms
// are procedural silhouettes, the city name is fictional ("Palm Shores" / "Neon Bay").

export const PALETTES = {
  sunset: {
    name: 'Sunset Vice',
    sky: ['#ffd76a', '#ff9a3d', '#ff5e7a', '#8b2f8b', '#2b1b4d'],
    sun: '#ffe9a3', sunCore: '#fff6cf',
    accent: '#ff5e7a', accent2: '#ffb03d', dark: '#241239',
    title: ['#ffffff', '#ffe9a3', '#ff9a3d'],
    tint: 'rgba(255, 94, 122, 0.16)',
    grade: 'saturate(1.35) contrast(1.08) sepia(0.16)',
  },
  neon: {
    name: 'Neon Nights',
    sky: ['#120a3d', '#3b0f66', '#a4138a', '#ff2e88', '#120a3d'],
    sun: '#39f5ff', sunCore: '#d8fbff',
    accent: '#00e5ff', accent2: '#ff2e88', dark: '#0d0626',
    title: ['#ffffff', '#a5f3ff', '#ff2e88'],
    tint: 'rgba(0, 229, 255, 0.12)',
    grade: 'saturate(1.7) contrast(1.18) hue-rotate(8deg)',
  },
  palm: {
    name: 'Palm Pop',
    sky: ['#b8f5d8', '#5fd6a8', '#1f9d7a', '#0f5f6b', '#0a2f4d'],
    sun: '#fff3b0', sunCore: '#fffbe0',
    accent: '#ff7a3d', accent2: '#ffd23d', dark: '#0a2f3d',
    title: ['#ffffff', '#fff3b0', '#ff7a3d'],
    tint: 'rgba(31, 157, 122, 0.14)',
    grade: 'saturate(1.4) contrast(1.06) hue-rotate(-12deg)',
  },
  noir: {
    name: 'Noir Gold',
    sky: ['#f5d78e', '#c9962e', '#6b4a12', '#241a08', '#0d0a05'],
    sun: '#ffe9a3', sunCore: '#fff6cf',
    accent: '#c9962e', accent2: '#f5d78e', dark: '#14100a',
    title: ['#ffffff', '#f5d78e', '#c9962e'],
    tint: 'rgba(201, 150, 46, 0.18)',
    grade: 'grayscale(0.55) contrast(1.22) brightness(1.06) sepia(0.25)',
  },
  bubblegum: {
    name: 'Bubblegum',
    sky: ['#ffd6f2', '#ff8fd1', '#c65bff', '#5b2bff', '#1d0b4d'],
    sun: '#fff3b0', sunCore: '#ffffff',
    accent: '#ff8fd1', accent2: '#7ef0ff', dark: '#2b0b4d',
    title: ['#ffffff', '#ffd6f2', '#ff8fd1'],
    tint: 'rgba(255, 143, 209, 0.14)',
    grade: 'saturate(1.5) contrast(1.05) hue-rotate(-6deg)',
  },
};

export const LAYOUTS = {
  trio: { name: 'Vice Trio — big centre, two side panels' },
  duo: { name: 'Split Duo — two tall panels' },
  grid: { name: 'Grid 2×2 — four panels' },
  hero: { name: 'Hero Solo — one full-bleed photo' },
  slash: { name: 'Diagonal Slash — angled split' },
};

export const GRADES = {
  auto: 'Auto (follows palette)',
  none: 'None — photo as-is',
  vivid: 'Vivid',
  warm: 'Warm sunset',
  cool: 'Cool neon',
  bw: 'Black & white',
  noir: 'Noir',
};

const GRADE_FILTERS = {
  none: '', vivid: 'saturate(1.6) contrast(1.12)', warm: 'saturate(1.4) contrast(1.05) sepia(0.3)',
  cool: 'saturate(1.5) contrast(1.1) hue-rotate(18deg)', bw: 'grayscale(1) contrast(1.1)',
  noir: 'grayscale(0.9) contrast(1.25) brightness(1.05)',
};

export function defaultState() {
  return {
    layout: 'trio',
    palette: 'sunset',
    title: 'SUNSET HEIST',
    subtitle: 'PALM SHORES',
    tagline: 'One last score under the neon sun',
    badge: 'EST. 2026',
    titlePos: 'bottom',
    titleSize: 100,
    showSun: true,
    showPalms: true,
    showGrain: true,
    outline: true,
    photos: [
      { img: null, zoom: 1, ox: 0, oy: 0, grade: 'auto' },
      { img: null, zoom: 1, ox: 0, oy: 0, grade: 'auto' },
      { img: null, zoom: 1, ox: 0, oy: 0, grade: 'auto' },
    ],
  };
}

function mulberry32(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fitFont(ctx, text, maxWidth, baseSize, family) {
  let size = baseSize;
  ctx.font = `900 ${size}px ${family}`;
  while (size > 10 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `900 ${size}px ${family}`;
  }
  return size;
}

const FAMILY = '"Arial Black", "Archivo Black", Impact, "Helvetica Neue", sans-serif';

function drawSun(ctx, cx, cy, r, palette) {
  const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 2.1);
  glow.addColorStop(0, palette.sunCore);
  glow.addColorStop(0.35, palette.sun);
  glow.addColorStop(1, 'rgba(255, 120, 80, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 2.1, 0, Math.PI * 2);
  ctx.fill();
  const disc = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  disc.addColorStop(0, palette.sunCore);
  disc.addColorStop(1, palette.sun);
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = 'rgba(40, 10, 50, 0.35)';
  for (let i = 0; i < 4; i += 1) {
    const sy = cy + r * (0.08 + i * 0.22);
    ctx.fillRect(cx - r, sy, r * 2, r * (0.05 + i * 0.02));
  }
  ctx.restore();
}

function drawPhotoInto(ctx, photo, rect, palette) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (photo && photo.img) {
    const img = photo.img;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const zoom = Math.max(0.5, photo.zoom || 1);
    const scale = Math.max(w / iw, h / ih) * zoom;
    const pw = iw * scale;
    const ph = ih * scale;
    const cx = x + w / 2 + (photo.ox || 0) * w * 0.3;
    const cy = y + h / 2 + (photo.oy || 0) * h * 0.3;
    ctx.filter = photo.grade === 'auto' ? palette.grade : (GRADE_FILTERS[photo.grade] ?? '');
    ctx.drawImage(img, cx - pw / 2, cy - ph / 2, pw, ph);
    ctx.filter = 'none';
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = palette.tint;
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'source-over';
  } else {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, palette.sky[1]);
    g.addColorStop(1, palette.sky[3]);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    drawSun(ctx, x + w / 2, y + h * 0.42, Math.min(w, h) * 0.22, palette);
  }
  ctx.restore();
}

function drawPalm(ctx, x, y, s, lean, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(2, s * 0.045);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(s * 0.06, -s * 0.5, s * 0.02, -s * 0.95);
  ctx.stroke();
  const topX = s * 0.02;
  const topY = -s * 0.95;
  for (let i = 0; i < 7; i += 1) {
    const a = -Math.PI * (0.08 + i * 0.13);
    const len = s * (0.42 + (i % 3) * 0.07);
    const ex = topX + Math.cos(a) * len;
    const ey = topY + Math.sin(a) * len * 0.55 + s * 0.16;
    ctx.lineWidth = Math.max(1.5, s * 0.02);
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + Math.cos(a) * len * 0.5, topY + Math.sin(a) * len * 0.4 - s * 0.08, ex, ey);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(topX - s * 0.03, topY + s * 0.04, s * 0.035, 0, Math.PI * 2);
  ctx.arc(topX + s * 0.04, topY + s * 0.05, s * 0.03, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function panelRects(layout, zone) {
  const { x, y, w, h } = zone;
  const g = Math.max(4, Math.min(w, h) * 0.012);
  switch (layout) {
    case 'duo':
      return [
        { x, y, w: w / 2 - g / 2, h },
        { x: x + w / 2 + g / 2, y, w: w / 2 - g / 2, h },
      ];
    case 'grid': {
      const cw = w / 2 - g / 2;
      const ch = h / 2 - g / 2;
      return [
        { x, y, w: cw, h: ch },
        { x: x + cw + g, y, w: cw, h: ch },
        { x, y: y + ch + g, w: cw, h: ch },
        { x: x + cw + g, y: y + ch + g, w: cw, h: ch },
      ];
    }
    case 'hero':
      return [{ x, y, w, h }];
    case 'slash':
      return [
        { x, y, w, h, slash: 'tl' },
        { x, y, w, h, slash: 'br' },
        { x: x + w * 0.3, y: y + h * 0.34, w: w * 0.4, h: h * 0.32, slash: 'band' },
      ];
    case 'trio':
    default: {
      const side = w * 0.22;
      return [
        { x, y, w: side, h },
        { x: x + side + g, y, w: w - side * 2 - g * 2, h },
        { x: x + w - side, y, w: side, h },
      ];
    }
  }
}

function drawPanels(ctx, state, zone, palette) {
  const rects = panelRects(state.layout, zone);
  const border = Math.max(3, Math.min(zone.w, zone.h) * 0.008);
  const photoAt = (i) => state.photos[i % state.photos.length];
  if (state.layout === 'slash') {
    const { x, y, w, h } = zone;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x, y + h); ctx.closePath();
    ctx.clip();
    drawPhotoInto(ctx, photoAt(0), { x, y, w, h }, palette);
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + w, y); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath();
    ctx.clip();
    drawPhotoInto(ctx, photoAt(1), { x, y, w, h }, palette);
    ctx.restore();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = border;
    ctx.beginPath();
    ctx.moveTo(x + w, y); ctx.lineTo(x, y + h);
    ctx.stroke();
    const band = rects[2];
    ctx.save();
    ctx.translate(zone.x + zone.w / 2, zone.y + zone.h / 2);
    ctx.rotate(-0.06);
    ctx.translate(-(zone.x + zone.w / 2), -(zone.y + zone.h / 2));
    drawPhotoInto(ctx, photoAt(2), band, palette);
    ctx.restore();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = border;
    ctx.strokeRect(band.x, band.y, band.w, band.h);
    return;
  }
  rects.forEach((r, i) => {
    if (state.layout === 'grid' && i === 3) {
      drawPhotoInto(ctx, null, r, palette);
      return;
    }
    drawPhotoInto(ctx, photoAt(i), r, palette);
  });
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.lineWidth = border;
  rects.forEach((r) => ctx.strokeRect(r.x, r.y, r.w, r.h));
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = border * 0.5;
  ctx.strokeRect(zone.x - border / 2, zone.y - border / 2, zone.w + border, zone.h + border);
}

function drawTitleBlock(ctx, state, W, H, palette) {
  const title = (state.title || '').trim().toUpperCase();
  const sub = (state.subtitle || '').trim().toUpperCase();
  const tag = (state.tagline || '').trim();
  const top = state.titlePos === 'top';
  const titleH = H * 0.16 * (state.titleSize / 100);
  const ty = top ? H * 0.035 : H - H * 0.035 - titleH;
  const cx = W / 2;

  if (state.showSun) {
    drawSun(ctx, W * (top ? 0.82 : 0.18), ty + titleH * 0.5, Math.min(W, H) * 0.075, palette);
  }

  if (title) {
    const size = fitFont(ctx, title, W * 0.94, titleH, FAMILY);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const grad = ctx.createLinearGradient(0, ty, 0, ty + titleH);
    grad.addColorStop(0, palette.title[0]);
    grad.addColorStop(0.55, palette.title[1]);
    grad.addColorStop(1, palette.title[2]);
    const layers = state.outline ? 3 : 1;
    for (let l = layers; l >= 0; l -= 1) {
      const off = l * Math.max(2, size * 0.045);
      ctx.font = `900 ${size}px ${FAMILY}`;
      if (l === 0) {
        ctx.fillStyle = grad;
        ctx.lineWidth = Math.max(2, size * 0.02);
        ctx.strokeStyle = 'rgba(20,8,30,0.85)';
        ctx.strokeText(title, cx, ty + titleH / 2);
        ctx.fillText(title, cx, ty + titleH / 2);
      } else {
        ctx.fillStyle = l === 1 ? palette.accent : palette.dark;
        ctx.fillText(title, cx + off * 0.5, ty + titleH / 2 + off);
      }
    }
  }

  if (sub) {
    ctx.save();
    ctx.translate(cx, top ? ty + titleH + H * 0.055 : ty - H * 0.035);
    ctx.rotate(-0.02);
    ctx.font = `900 ${Math.max(12, H * 0.032)}px ${FAMILY}`;
    const tw = ctx.measureText(sub).width + H * 0.05;
    ctx.fillStyle = palette.accent;
    ctx.fillRect(-tw / 2, -H * 0.026, tw, H * 0.052);
    ctx.fillStyle = '#14081e';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sub, 0, H * 0.002);
    ctx.restore();
  }

  if (tag) {
    ctx.font = `700 ${Math.max(11, H * 0.021)}px ${FAMILY}`;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const spaced = tag.split('').join('\u2009');
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 6;
    ctx.fillText(spaced, cx, top ? H - H * 0.025 : H * 0.042);
    ctx.shadowBlur = 0;
  }
}

export function drawCover(ctx, state, W, H) {
  const palette = PALETTES[state.palette] ?? PALETTES.sunset;
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  palette.sky.forEach((c, i) => sky.addColorStop(i / (palette.sky.length - 1), c));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  const top = state.titlePos === 'top';
  const titleZone = H * 0.24;
  const zone = top
    ? { x: W * 0.03, y: titleZone, w: W * 0.94, h: H - titleZone - H * 0.02 }
    : { x: W * 0.03, y: H * 0.02, w: W * 0.94, h: H - titleZone - H * 0.02 };

  drawPanels(ctx, state, zone, palette);

  if (state.showPalms) {
    const s = Math.min(W, H) * 0.16;
    drawPalm(ctx, W * 0.055, zone.y + zone.h - 2, s, -0.12, palette.dark);
    drawPalm(ctx, W * 0.945, zone.y + zone.h - 2, s * 0.85, 0.14, palette.dark);
  }

  drawTitleBlock(ctx, state, W, H, palette);

  if (state.badge) {
    const r = Math.min(W, H) * 0.055;
    // Opposite corner from the sun, so it never collides with the title or the sun.
    const bx = state.titlePos === 'top' ? r + W * 0.02 : W - r - W * 0.02;
    const by = state.titlePos === 'top' ? H - r - H * 0.012 : r + H * 0.012;
    ctx.save();
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(20,8,30,0.85)';
    ctx.fill();
    ctx.lineWidth = Math.max(2, r * 0.08);
    ctx.strokeStyle = palette.accent2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${Math.max(9, r * 0.24)}px ${FAMILY}`;
    const words = state.badge.toUpperCase().split(' ');
    words.forEach((w, i) => ctx.fillText(w, bx, by + (i - (words.length - 1) / 2) * r * 0.3));
    ctx.restore();
  }

  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(10,4,20,0.35)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  if (state.showGrain) {
    const rnd = mulberry32(20261120);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    const n = Math.floor((W * H) / 9000);
    for (let i = 0; i < n; i += 1) ctx.fillRect(rnd() * W, rnd() * H, 1.5, 1.5);
  }
}

export function renderCover(state, W, H) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  drawCover(canvas.getContext('2d'), state, W, H);
  return canvas;
}

export const EXPORT_SIZES = [
  { id: '1080x1080', label: 'Square post — 1080 × 1080', w: 1080, h: 1080 },
  { id: '1080x1350', label: 'Portrait post — 1080 × 1350', w: 1080, h: 1350 },
  { id: '1920x1080', label: 'Wide banner — 1920 × 1080', w: 1920, h: 1080 },
  { id: '1080x1920', label: 'Story — 1080 × 1920', w: 1080, h: 1920 },
];
