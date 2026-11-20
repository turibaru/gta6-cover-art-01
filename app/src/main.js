/* Vice Cover Lab — editor wiring: photo slots, layout/palette pickers,
 * text and effects controls, live preview, and PNG export.
 * Photos are read with FileReader / Image on this machine only; nothing
 * is uploaded anywhere. */
(function () {
  'use strict';

  var SLOT_NAMES = ['A', 'B', 'C'];
  var SAMPLES = [
    { file: 'boulevard.jpg', label: 'Boulevard' },
    { file: 'pier.jpg', label: 'Pier' }
  ];
  var SIZES = [
    { w: 1080, h: 1080, label: '1080 x 1080' },
    { w: 1080, h: 1350, label: '1080 x 1350' },
    { w: 1920, h: 1080, label: '1920 x 1080' },
    { w: 1080, h: 1920, label: '1080 x 1920' }
  ];
  var GRADES = [
    ['auto', 'Auto'], ['vivid', 'Vivid'], ['warm', 'Warm'],
    ['cool', 'Cool'], ['bw', 'B&W'], ['noir', 'Noir']
  ];

  var state = {
    layout: 'vice-trio',
    palette: 'sunset-vice',
    title: 'VICE CITY',
    subtitle: 'SUNSET HEIST',
    tagline: 'One last score under the neon sun.',
    badge: 'EST. 2026',
    titlePos: 'bottom',
    titleSize: 100,
    fxSun: true,
    fxPalms: true,
    fxGrain: true,
    fxVignette: true,
    slots: [
      { zoom: 1.15, ox: 0, oy: 0, grade: 'warm' },
      { zoom: 1.1, ox: 0, oy: 0, grade: 'vivid' },
      { zoom: 1.15, ox: 0, oy: 0, grade: 'cool' }
    ]
  };
  var photos = [null, null, null];
  var photoNames = ['', '', ''];
  var activeSlot = 1;

  function $(id) { return document.getElementById(id); }

  function currentSize() {
    var sel = $('inSize');
    var parts = (sel ? sel.value : '1080x1080').split('x');
    return { w: parseInt(parts[0], 10), h: parseInt(parts[1], 10) };
  }

  function render() {
    var canvas = $('coverCanvas');
    if (!canvas) return;
    var size = currentSize();
    var maxDim = 720;
    var cw, ch;
    if (size.w >= size.h) { cw = maxDim; ch = Math.round(maxDim * size.h / size.w); }
    else { ch = maxDim; cw = Math.round(maxDim * size.w / size.h); }
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }
    window.ViceCover.drawCover(canvas, state, photos);
    var label = $('sizeLabel');
    if (label) label.textContent = size.w + ' x ' + size.h;
    var hint = $('dropHint');
    if (hint) hint.style.display = photos.some(Boolean) ? 'none' : '';
  }

  function setStatus(msg) {
    var el = $('exportStatus');
    if (el) el.textContent = msg;
  }

  /* ---- photo slots ---- */

  function buildSlots() {
    var host = $('slots');
    if (!host) return;
    host.innerHTML = '';
    for (var i = 0; i < 3; i++) {
      (function (index) {
        var box = document.createElement('div');
        box.className = 'slot' + (index === activeSlot ? ' active' : '');
        box.dataset.slot = String(index);

        var head = document.createElement('div');
        head.className = 'slot-head';
        var strong = document.createElement('strong');
        strong.textContent = 'Slot ' + SLOT_NAMES[index];
        var fname = document.createElement('span');
        fname.className = 'file-name';
        fname.id = 'fileName' + index;
        fname.textContent = 'empty — add a photo';
        head.appendChild(strong);
        head.appendChild(fname);
        box.appendChild(head);

        var thumb = document.createElement('img');
        thumb.className = 'thumb empty';
        thumb.id = 'thumb' + index;
        thumb.alt = 'Photo slot ' + SLOT_NAMES[index];
        box.appendChild(thumb);

        var actions = document.createElement('div');
        actions.className = 'slot-actions';
        var fileBtn = document.createElement('label');
        fileBtn.className = 'btn small';
        fileBtn.textContent = 'Upload photo';
        var fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        fileInput.addEventListener('change', function () {
          if (fileInput.files && fileInput.files[0]) loadFilePhoto(index, fileInput.files[0]);
        });
        fileBtn.appendChild(fileInput);
        actions.appendChild(fileBtn);
        SAMPLES.forEach(function (s) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'btn small ghost';
          b.textContent = 'Sample: ' + s.label;
          b.addEventListener('click', function () { loadSamplePhoto(index, s.file); });
          actions.appendChild(b);
        });
        box.appendChild(actions);

        var ctrls = document.createElement('div');
        ctrls.className = 'slot-controls';
        ctrls.appendChild(sliderControl('Zoom', 1, 2.5, 0.05, state.slots[index].zoom, function (v) {
          state.slots[index].zoom = v; render();
        }));
        ctrls.appendChild(sliderControl('Shift X', -0.45, 0.45, 0.01, state.slots[index].ox, function (v) {
          state.slots[index].ox = v; render();
        }));
        ctrls.appendChild(sliderControl('Shift Y', -0.45, 0.45, 0.01, state.slots[index].oy, function (v) {
          state.slots[index].oy = v; render();
        }));
        var gradeLabel = document.createElement('label');
        gradeLabel.textContent = 'Grade';
        var gradeSel = document.createElement('select');
        GRADES.forEach(function (g) {
          var opt = document.createElement('option');
          opt.value = g[0];
          opt.textContent = g[1];
          if (g[0] === state.slots[index].grade) opt.selected = true;
          gradeSel.appendChild(opt);
        });
        gradeSel.addEventListener('change', function () {
          state.slots[index].grade = gradeSel.value; render();
        });
        gradeLabel.appendChild(gradeSel);
        ctrls.appendChild(gradeLabel);
        box.appendChild(ctrls);

        box.addEventListener('click', function (ev) {
          if (ev.target === box || ev.target === head || ev.target === strong) setActiveSlot(index);
        });
        host.appendChild(box);
      })(i);
    }
  }

  function sliderControl(label, min, max, step, value, onInput) {
    var lab = document.createElement('label');
    lab.textContent = label;
    var input = document.createElement('input');
    input.type = 'range';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(value);
    input.addEventListener('input', function () { onInput(parseFloat(input.value)); });
    lab.appendChild(input);
    return lab;
  }

  function setActiveSlot(index) {
    activeSlot = index;
    var boxes = document.querySelectorAll('.slot');
    boxes.forEach(function (b) {
      b.classList.toggle('active', parseInt(b.dataset.slot, 10) === index);
    });
  }

  function notePhoto(index, img, name) {
    photos[index] = img;
    photoNames[index] = name;
    var thumb = $('thumb' + index);
    if (thumb) { thumb.src = img.src; thumb.classList.remove('empty'); }
    var fname = $('fileName' + index);
    if (fname) fname.textContent = name;
    render();
  }

  function loadFilePhoto(index, file) {
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () { notePhoto(index, img, file.name); };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
    setActiveSlot(index);
  }

  function loadSamplePhoto(index, file) {
    var img = new Image();
    img.onload = function () { notePhoto(index, img, 'sample: ' + file); };
    img.onerror = function () { setStatus('Could not load sample ' + file + '.'); };
    img.src = 'samples/' + file;
    setActiveSlot(index);
  }

  function loadSamples() {
    loadSamplePhoto(0, 'boulevard.jpg');
    loadSamplePhoto(1, 'pier.jpg');
    loadSamplePhoto(2, 'boulevard.jpg');
    setStatus('Sample photos loaded into slots A, B and C.');
  }

  function clearPhotos() {
    for (var i = 0; i < 3; i++) {
      photos[i] = null;
      photoNames[i] = '';
      var thumb = $('thumb' + i);
      if (thumb) { thumb.removeAttribute('src'); thumb.classList.add('empty'); }
      var fname = $('fileName' + i);
      if (fname) fname.textContent = 'empty — add a photo';
    }
    render();
    setStatus('Photos cleared. Upload your own or load the samples.');
  }

  /* ---- pickers ---- */

  function buildPickers() {
    var layoutHost = $('layoutChoices');
    Object.keys(window.ViceCover.LAYOUTS).forEach(function (key) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'choice' + (key === state.layout ? ' active' : '');
      b.textContent = window.ViceCover.LAYOUTS[key].label;
      b.dataset.value = key;
      b.addEventListener('click', function () {
        state.layout = key;
        layoutHost.querySelectorAll('.choice').forEach(function (c) {
          c.classList.toggle('active', c.dataset.value === key);
        });
        render();
      });
      layoutHost.appendChild(b);
    });

    var palHost = $('paletteChoices');
    Object.keys(window.ViceCover.PALETTES).forEach(function (key) {
      var p = window.ViceCover.PALETTES[key];
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'choice' + (key === state.palette ? ' active' : '');
      b.dataset.value = key;
      var dot = document.createElement('span');
      dot.className = 'dot';
      dot.style.background = 'linear-gradient(135deg,' + p.sky[1] + ',' + p.sky[2] + ')';
      b.appendChild(dot);
      b.appendChild(document.createTextNode(p.label));
      b.addEventListener('click', function () {
        setPalette(key);
      });
      palHost.appendChild(b);
    });
  }

  function setPalette(key) {
    state.palette = key;
    var host = $('paletteChoices');
    if (host) host.querySelectorAll('.choice').forEach(function (c) {
      c.classList.toggle('active', c.dataset.value === key);
    });
    render();
  }

  function randomPalette() {
    var keys = Object.keys(window.ViceCover.PALETTES);
    var pick = keys[Math.floor(Math.random() * keys.length)];
    setPalette(pick);
    setStatus('Palette: ' + window.ViceCover.PALETTES[pick].label + '.');
  }

  /* ---- export ---- */

  function renderOffscreen(size) {
    var canvas = document.createElement('canvas');
    canvas.width = size.w;
    canvas.height = size.h;
    window.ViceCover.drawCover(canvas, state, photos);
    return canvas;
  }

  function downloadCanvas(canvas, filename) {
    return new Promise(function (resolve) {
      canvas.toBlob(function (blob) {
        if (!blob) { resolve(false); return; }
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
        resolve(true);
      }, 'image/png');
    });
  }

  function exportOne() {
    var size = currentSize();
    var btn = $('exportOne');
    if (btn) btn.disabled = true;
    var canvas = renderOffscreen(size);
    setStatus('Rendering ' + size.w + ' x ' + size.h + '…');
    downloadCanvas(canvas, 'vice-cover-' + size.w + 'x' + size.h + '.png').then(function (ok) {
      if (btn) btn.disabled = false;
      setStatus(ok
        ? 'Exported vice-cover-' + size.w + 'x' + size.h + '.png — share it!'
        : 'Export failed in this browser.');
    });
  }

  function exportAll() {
    var btn = $('exportAll');
    var btn1 = $('exportOne');
    if (btn) btn.disabled = true;
    if (btn1) btn1.disabled = true;
    setStatus('Exporting all 4 sizes…');
    var chain = Promise.resolve();
    SIZES.forEach(function (size, i) {
      chain = chain.then(function () {
        /* Browsers throttle rapid downloads, so pause briefly between
         * files; without the pause the 2nd–4th PNG can be dropped. */
        return new Promise(function (res) { setTimeout(res, 350); }).then(function () {
          var canvas = renderOffscreen(size);
          return downloadCanvas(canvas, 'vice-cover-' + size.w + 'x' + size.h + '.png').then(function () {
            setStatus('Exported ' + (i + 1) + ' of 4: ' + size.w + ' x ' + size.h + '.');
          });
        });
      });
    });
    chain.then(function () {
      if (btn) btn.disabled = false;
      if (btn1) btn1.disabled = false;
      setStatus('All 4 sizes exported.');
    });
  }

  /* ---- text + effects + drag & drop ---- */

  function bindControls() {
    function text(id, key) {
      var el = $(id);
      if (!el) return;
      el.addEventListener('input', function () { state[key] = el.value; render(); });
    }
    text('inTitle', 'title');
    text('inSubtitle', 'subtitle');
    text('inTagline', 'tagline');
    text('inBadge', 'badge');

    var pos = $('inTitlePos');
    if (pos) pos.addEventListener('change', function () { state.titlePos = pos.value; render(); });

    var tsize = $('inTitleSize');
    if (tsize) tsize.addEventListener('input', function () {
      state.titleSize = parseInt(tsize.value, 10);
      var v = $('titleSizeVal');
      if (v) v.textContent = tsize.value + '%';
      render();
    });

    function fx(id, key) {
      var el = $(id);
      if (!el) return;
      el.addEventListener('change', function () { state[key] = el.checked; render(); });
    }
    fx('fxSun', 'fxSun');
    fx('fxPalms', 'fxPalms');
    fx('fxGrain', 'fxGrain');
    fx('fxVignette', 'fxVignette');

    var sizeSel = $('inSize');
    if (sizeSel) sizeSel.addEventListener('change', render);

    var e1 = $('exportOne');
    if (e1) e1.addEventListener('click', exportOne);
    var e2 = $('exportAll');
    if (e2) e2.addEventListener('click', exportAll);
    var rp = $('randomPalette');
    if (rp) rp.addEventListener('click', randomPalette);
    var ls = $('loadSamples');
    if (ls) ls.addEventListener('click', loadSamples);
    var cl = $('clearPhotos');
    if (cl) cl.addEventListener('click', clearPhotos);

    var stage = $('stage');
    if (stage) {
      stage.addEventListener('dragover', function (ev) {
        ev.preventDefault();
        stage.classList.add('dragging');
      });
      stage.addEventListener('dragleave', function () { stage.classList.remove('dragging'); });
      stage.addEventListener('drop', function (ev) {
        ev.preventDefault();
        stage.classList.remove('dragging');
        var f = ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files[0];
        if (f) loadFilePhoto(activeSlot, f);
      });
    }
  }

  function applyStateToControls() {
    var map = [
      ['inTitle', 'title'], ['inSubtitle', 'subtitle'],
      ['inTagline', 'tagline'], ['inBadge', 'badge']
    ];
    map.forEach(function (pair) {
      var el = $(pair[0]);
      if (el) el.value = state[pair[1]];
    });
    var pos = $('inTitlePos');
    if (pos) pos.value = state.titlePos;
    var tsize = $('inTitleSize');
    if (tsize) tsize.value = String(state.titleSize);
    var checks = [['fxSun', 'fxSun'], ['fxPalms', 'fxPalms'], ['fxGrain', 'fxGrain'], ['fxVignette', 'fxVignette']];
    checks.forEach(function (pair) {
      var el = $(pair[0]);
      if (el) el.checked = !!state[pair[1]];
    });
  }

  buildSlots();
  buildPickers();
  bindControls();
  applyStateToControls();
  render();

  /* Public handle for shots.js (autopilot) and debugging. */
  window.ViceLab = {
    state: state,
    photos: photos,
    render: render,
    loadSamplePhoto: loadSamplePhoto,
    loadSamples: loadSamples,
    setPalette: setPalette,
    setLayout: function (key) {
      if (window.ViceCover.LAYOUTS[key]) {
        state.layout = key;
        var host = $('layoutChoices');
        if (host) host.querySelectorAll('.choice').forEach(function (c) {
          c.classList.toggle('active', c.dataset.value === key);
        });
        render();
      }
    },
    setSize: function (w, h) {
      var sel = $('inSize');
      if (!sel) return;
      var want = w + 'x' + h;
      for (var i = 0; i < sel.options.length; i++) {
        if (sel.options[i].value === want) { sel.selectedIndex = i; break; }
      }
      render();
    },
    exportOne: exportOne,
    exportAll: exportAll
  };
})();
