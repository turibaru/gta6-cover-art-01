/* Vice Cover Lab — autopilot for screenshots.
 * Reads the query string (?shot=cover|editor&photo=..&caption=..&layout=..
 * &palette=..) and stages the app, then flags documentElement with
 * data-shot-ready="1" so the screenshot driver knows the frame is done.
 * Cover mode hides the editor chrome and draws the poster full-viewport.
 */
(function () {
  'use strict';

  function params() {
    return new URLSearchParams(window.location.search);
  }

  function loadImage(src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { resolve(null); };
      img.src = src;
    });
  }

  function markReady() {
    document.documentElement.setAttribute('data-shot-ready', '1');
    document.title = 'shot-ready';
  }

  function stageCover(q) {
    document.body.classList.add('shot-cover');
    var lab = window.ViceLab;
    var primary = q.get('photo') || 'pier';
    var other = primary === 'pier' ? 'boulevard' : 'pier';
    var caption = q.get('caption') || 'Sunset Heist';
    var layout = q.get('layout') || 'vice-trio';
    var palette = q.get('palette') || 'sunset-vice';
    var subtitle = q.get('subtitle') || 'SUNSET HEIST';
    var tagline = q.get('tagline') || 'One last score under the neon sun.';

    lab.state.title = caption;
    lab.state.subtitle = subtitle;
    lab.state.tagline = tagline;
    lab.state.layout = layout;
    lab.state.palette = palette;

    Promise.all([
      loadImage('samples/' + other + '.jpg'),
      loadImage('samples/' + primary + '.jpg'),
      loadImage('samples/' + other + '.jpg')
    ]).then(function (imgs) {
      lab.photos[0] = imgs[0];
      lab.photos[1] = imgs[1];
      lab.photos[2] = imgs[2];
      var canvas = document.getElementById('coverCanvas');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      window.ViceCover.drawCover(canvas, lab.state, lab.photos);
      setTimeout(markReady, 120);
    });
  }

  function stageEditor(q) {
    var lab = window.ViceLab;
    var caption = q.get('caption');
    if (caption) lab.state.title = caption;
    var layout = q.get('layout');
    if (layout) lab.setLayout(layout);
    var palette = q.get('palette');
    if (palette) lab.setPalette(palette);
    lab.loadSamples();
    /* Samples load async; give the images a moment, then re-render. */
    setTimeout(function () {
      lab.render();
      setTimeout(markReady, 250);
    }, 700);
  }

  var q = params();
  var shot = q.get('shot');
  if (shot === 'cover') stageCover(q);
  else if (shot === 'editor') stageEditor(q);
})();
