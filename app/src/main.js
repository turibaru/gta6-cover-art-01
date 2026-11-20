// Wires the page: up to three photos (upload, drag & drop, or the bundled samples),
// per-photo crop/position/grade, five multi-panel layouts, five palettes, editable
// title / subtitle / tagline, and PNG export in four post sizes. Photos are read with
// object URLs and drawn on canvas only — they never leave the machine, no network.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).
import { drawCover, defaultState, PALETTES, LAYOUTS, GRADES, EXPORT_SIZES, renderCover } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');
const state = defaultState();
let exportSize = EXPORT_SIZES[0];

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function sizeCanvas() {
  canvas.width = exportSize.w;
  canvas.height = exportSize.h;
}

function redraw() {
  sizeCanvas();
  drawCover(canvas.getContext('2d'), state, canvas.width, canvas.height);
}

function setStatus(msg) {
  statusEl.textContent = msg;
}

/* ---------- controls ---------- */

function fillSelect(el, entries, current) {
  el.innerHTML = '';
  for (const [value, label] of entries) {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    if (value === current) opt.selected = true;
    el.appendChild(opt);
  }
}

const layoutSel = document.getElementById('layout');
const paletteSel = document.getElementById('palette');
const sizeSel = document.getElementById('size');
fillSelect(layoutSel, Object.entries(LAYOUTS).map(([k, v]) => [k, v.name]), state.layout);
fillSelect(paletteSel, Object.entries(PALETTES).map(([k, v]) => [k, v.name]), state.palette);
fillSelect(sizeSel, EXPORT_SIZES.map((s) => [s.id, s.label]), exportSize.id);

layoutSel.addEventListener('change', () => { state.layout = layoutSel.value; redraw(); });
paletteSel.addEventListener('change', () => { state.palette = paletteSel.value; redraw(); });
sizeSel.addEventListener('change', () => {
  exportSize = EXPORT_SIZES.find((s) => s.id === sizeSel.value) ?? EXPORT_SIZES[0];
  redraw();
  setStatus(`Preview now ${exportSize.w} × ${exportSize.h}.`);
});

function bindText(id, key, max) {
  const el = document.getElementById(id);
  el.addEventListener('input', () => { state[key] = el.value.slice(0, max); redraw(); });
}
bindText('title', 'title', 30);
bindText('subtitle', 'subtitle', 24);
bindText('tagline', 'tagline', 60);
bindText('badge', 'badge', 14);

document.getElementById('titlePos').addEventListener('change', (e) => { state.titlePos = e.target.value; redraw(); });
document.getElementById('titleSize').addEventListener('input', (e) => {
  state.titleSize = Number(e.target.value);
  document.getElementById('titleSizeVal').textContent = `${state.titleSize}%`;
  redraw();
});
for (const [id, key] of [['showSun', 'showSun'], ['showPalms', 'showPalms'], ['showGrain', 'showGrain'], ['outline', 'outline']]) {
  document.getElementById(id).addEventListener('change', (e) => { state[key] = e.target.checked; redraw(); });
}

document.getElementById('randomize').addEventListener('click', () => {
  const keys = Object.keys(PALETTES);
  const layouts = Object.keys(LAYOUTS);
  state.palette = keys[Math.floor(Math.random() * keys.length)];
  state.layout = layouts[Math.floor(Math.random() * layouts.length)];
  paletteSel.value = state.palette;
  layoutSel.value = state.layout;
  redraw();
  setStatus(`Try this: ${PALETTES[state.palette].name} · ${LAYOUTS[state.layout].name}.`);
});

/* ---------- photo slots ---------- */

const SLOT_LABELS = ['A — main panel', 'B — side panel', 'C — side panel'];

function buildSlots() {
  const wrap = document.getElementById('slots');
  state.photos.forEach((photo, i) => {
    const card = document.createElement('div');
    card.className = 'slot';
    card.innerHTML = `
      <div class="slot-head"><strong>${SLOT_LABELS[i]}</strong><span class="slot-state" id="slotState${i}">empty</span></div>
      <div class="slot-row">
        <label class="file-btn">Choose photo <input id="file${i}" type="file" accept="image/*"></label>
        <button type="button" class="mini" id="sample${i}">Use sample</button>
        <button type="button" class="mini" id="clear${i}">Clear</button>
      </div>
      <label>Zoom <input id="zoom${i}" type="range" min="0.6" max="2.5" step="0.05" value="1"></label>
      <label>Pan X <input id="ox${i}" type="range" min="-1" max="1" step="0.05" value="0"></label>
      <label>Pan Y <input id="oy${i}" type="range" min="-1" max="1" step="0.05" value="0"></label>
      <label>Colour grade <select id="grade${i}"></select></label>`;
    wrap.appendChild(card);
    fillSelect(card.querySelector(`#grade${i}`), Object.entries(GRADES), 'auto');
    card.querySelector(`#file${i}`).addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      photo.img = await loadImage(URL.createObjectURL(file));
      document.getElementById(`slotState${i}`).textContent = file.name.slice(0, 24);
      redraw();
      setStatus(`Photo ${SLOT_LABELS[i][0]} loaded — still only on this machine.`);
    });
    card.querySelector(`#sample${i}`).addEventListener('click', async () => {
      photo.img = await loadImage(`samples/${i % 2 === 0 ? 'pier' : 'boulevard'}.jpg`);
      document.getElementById(`slotState${i}`).textContent = 'sample photo';
      redraw();
    });
    card.querySelector(`#clear${i}`).addEventListener('click', () => {
      photo.img = null;
      document.getElementById(`slotState${i}`).textContent = 'empty';
      redraw();
    });
    card.querySelector(`#zoom${i}`).addEventListener('input', (e) => { photo.zoom = Number(e.target.value); redraw(); });
    card.querySelector(`#ox${i}`).addEventListener('input', (e) => { photo.ox = Number(e.target.value); redraw(); });
    card.querySelector(`#oy${i}`).addEventListener('input', (e) => { photo.oy = Number(e.target.value); redraw(); });
    card.querySelector(`#grade${i}`).addEventListener('change', (e) => { photo.grade = e.target.value; redraw(); });
  });
}
buildSlots();

// Drag & drop anywhere on the preview: first empty slot, else slot A.
canvas.addEventListener('dragover', (e) => e.preventDefault());
canvas.addEventListener('drop', async (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (!file || !file.type.startsWith('image/')) return;
  const slot = state.photos.findIndex((p) => !p.img);
  const i = slot === -1 ? 0 : slot;
  state.photos[i].img = await loadImage(URL.createObjectURL(file));
  document.getElementById(`slotState${i}`).textContent = file.name.slice(0, 24);
  redraw();
  setStatus(`Dropped into slot ${SLOT_LABELS[i][0]}.`);
});

/* ---------- export ---------- */

function download(canvasEl, name) {
  canvasEl.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    setStatus(`Saved ${name} — ${(blob.size / 1024).toFixed(0)} KB.`);
  }, 'image/png');
}

document.getElementById('export').addEventListener('click', () => {
  download(canvas, `palm-shores-cover-${exportSize.id}.png`);
});

document.getElementById('exportAll').addEventListener('click', () => {
  EXPORT_SIZES.forEach((s, i) => {
    setTimeout(() => download(renderCover(state, s.w, s.h), `palm-shores-cover-${s.id}.png`), i * 350);
  });
  setStatus('Exporting all four sizes…');
});

/* ---------- shot mode / boot ---------- */

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  runShot(shot, params, state, async (sample, slot) => {
    state.photos[slot].img = await loadImage(sample);
    document.getElementById(`slotState${slot}`).textContent = 'sample photo';
  }, redraw, { layoutSel, paletteSel, sizeSel });
} else {
  // First visit: load the two bundled samples so the poster is never blank.
  (async () => {
    try {
      state.photos[0].img = await loadImage('samples/pier.jpg');
      state.photos[1].img = await loadImage('samples/boulevard.jpg');
      document.getElementById('slotState0').textContent = 'sample photo';
      document.getElementById('slotState1').textContent = 'sample photo';
    } catch { /* offline samples missing: gradient panels still render */ }
    redraw();
  })();
}
