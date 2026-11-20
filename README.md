[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Vice Cover Lab — GTA-style cover art maker

**make.fun bounty:** [Make GTA 6 Cover Art (gta6-cover-art-01)](https://make.fun/bounty/gta6-cover-art-01) · **Reward:** $250 shared across 50 places · **Entrant:** [@turibaru](https://github.com/turibaru) · **Repo:** `gta6-cover-art-01`

Turn your own photos into a multi-panel GTA-style poster and export it as a PNG to share. Runs entirely offline in a desktop browser — photos never leave your machine, no upload, no account.

## What it does

- **Any photo, three slots** — upload from your machine, drag & drop onto the preview, or use the two built-in sample photos. Per photo: zoom, shift X/Y, and a colour grade (Auto / Vivid / Warm / Cool / B&W / Noir).
- **5 multi-panel layouts** — Vice Trio (big centre panel + two sides), Split Duo, Grid 2×2, Hero Solo, Diagonal Slash.
- **5 palettes + random** — Sunset Vice, Neon Nights, Palm Pop, Noir Gold, Bubblegum, plus a "Surprise me" button.
- **Editable words** — title with extruded 3D gradient lettering (auto-fits), subtitle banner, tagline, badge; title position (top/bottom) and title size.
- **Original effects** — retro striped sun, palm silhouettes, film grain, vignette and frame, all drawn fresh on canvas from primitives.
- **Export PNG** — 1080×1080, 1080×1350, 1920×1080, 1080×1920, one size or all four at once.

## Try it

```sh
node serve.ts        # serves app/ at http://localhost:8080
```

Open the page, click **Load sample photos**, pick a layout and palette, edit the title, and hit **Export this size**.

## How it is built

- `app/index.html` + `app/style.css` — the editor shell.
- `app/src/cover.js` — the poster renderer (`drawCover`): layouts, palettes, grades, retro sun, palms, grain, 3D title.
- `app/src/main.js` — editor state, photo slots, pickers, drag & drop, PNG export.
- `app/src/shots.js` — autopilot staging for screenshots (`?shot=cover` / `?shot=editor`).
- `main.ts` — the entry program: copies `app/` + `screenshots/` to `/output` (or `MAKEFUN_OUTPUT_DIR`) and writes `dossier.json` with `buildDossier` from `vendor/makefun-app.ts`.
- `screenshots/` — 4 real renders from local Chromium: the exported cover first, then the editor with a photo loaded, then two more covers.

Everything is original art drawn on canvas. No Rockstar logo, artwork, or font is used; the sample photos ship with the app and are free to use.

## License

MIT — see [LICENSE](LICENSE).
