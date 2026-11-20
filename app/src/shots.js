// Fixed scenes for screenshots: ?shot=editor shows the editor with sample photos;
// ?shot=cover (and cover-duo / cover-grid) shows the cover alone, full-bleed.
// Params: photo, photo2 (sample names), caption/title, subtitle, layout, palette.
// window.__shotReady is set once painted.
export async function runShot(shot, query, state, load, redraw, selects) {
  const coverOnly = shot !== 'editor';
  if (coverOnly) document.body.classList.add('shot-cover');
  const layout = query.get('layout') ?? (shot === 'cover-duo' ? 'duo' : shot === 'cover-grid' ? 'grid' : 'trio');
  const palette = query.get('palette') ?? (shot === 'cover-duo' ? 'neon' : shot === 'cover-grid' ? 'palm' : 'sunset');
  state.layout = layout;
  state.palette = palette;
  state.title = query.get('caption') ?? query.get('title') ?? 'Sunset Heist';
  state.subtitle = query.get('subtitle') ?? 'Palm Shores';
  state.tagline = query.get('tagline') ?? 'One last score under the neon sun';
  if (selects) {
    selects.layoutSel.value = layout;
    selects.paletteSel.value = palette;
  }
  const titleEl = document.getElementById('title');
  if (titleEl) titleEl.value = state.title;
  const subEl = document.getElementById('subtitle');
  if (subEl) subEl.value = state.subtitle;
  await load(`samples/${query.get('photo') ?? 'pier'}.jpg`, 0);
  await load(`samples/${query.get('photo2') ?? 'boulevard'}.jpg`, 1);
  // Third panel: reuse the second sample with a tighter crop so no panel stays empty.
  await load(`samples/${query.get('photo2') ?? 'boulevard'}.jpg`, 2);
  state.photos[2].zoom = 1.4;
  state.photos[2].ox = 0.25;
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
