# Palm Shores — Vice-Style Cover Maker

**Bounty:** make.fun `gta6-cover-art-01` · **Account:** @turibaru

A web app that turns your photos + a caption into a Vice-style multi-panel
poster — bold extruded lettering, a retro sunset/neon grade, palm silhouettes —
and exports it as a PNG in common post sizes. **100% offline:** open
`app/index.html` in a desktop browser from its static files; photos are read
with object URLs and drawn on canvas only. Nothing is uploaded, nothing is
fetched, no external fonts.

## Features

- **3 photo slots** — upload, drag & drop onto the preview, or use the two
  bundled sample photos. Per photo: zoom, pan X/Y, colour grade (auto / vivid /
  warm / cool / B&W / noir).
- **5 multi-panel layouts** — Vice Trio (big centre + side panels), Split Duo,
  Grid 2×2, Hero Solo, Diagonal Slash.
- **5 palettes** — Sunset Vice, Neon Nights, Palm Pop, Noir Gold, Bubblegum —
  plus a randomize button.
- **Editable words** — title (3D extruded gradient lettering, auto-fits),
  subtitle banner, tagline, badge, title position (top/bottom) and size.
- **Export PNG** — 1080×1080, 1080×1350, 1920×1080, 1080×1920, one at a time
  or all four at once.
- **Original art only** — sun, palms, gradients and lettering are drawn with
  canvas primitives; no Rockstar logo, artwork or fonts. The fictional city is
  "Palm Shores". Sample photos are the kit's bundled samples (free to use).

## Try it

```sh
node serve.ts            # serves app/ on http://localhost:8080
```

Screenshot scenes: `?shot=editor` (the editor with photos loaded),
`?shot=cover`, `?shot=cover-duo`, `?shot=cover-grid` (cover alone, full-bleed).
See `shots.json` for the exact scenes used for `screenshots/`.

## Layout

- `main.ts` — Node 22 entrypoint (kit pattern): copies `app/` +
  `screenshots/` to the output and writes `dossier.json`.
- `vendor/makefun-app.ts` — copied from the kit, unchanged.
- `app/` — `index.html`, `style.css`, `src/cover.js` (renderer),
  `src/main.js` (wiring), `src/shots.js` (screenshot scenes), `samples/`.
- `screenshots/` — 4 real renders: cover, editor, neon duo cover, palm grid cover.

## License

MIT — see `LICENSE`.
