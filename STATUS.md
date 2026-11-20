# STATUS — gta6-cover-art-01 (Palm Shores Cover Maker) — siap-submit (belum disubmit)

Tanggal: 20 Nov 2026. Akun: @turibaru. Tutup: 21 Nov 2026 17:30 WIB.

## Yang sudah dibangun

- `app/` lengkap dan offline (tanpa CDN/fetch): `index.html`, `style.css`,
  `src/cover.js` (renderer poster multi-panel), `src/main.js`, `src/shots.js`,
  `samples/` (boulevard.jpg, pier.jpg dari kit).
- Fitur: 3 slot foto (upload / drag & drop / sample), zoom + pan + grade
  per foto; 5 layout (Vice Trio, Split Duo, Grid 2×2, Hero Solo, Diagonal
  Slash); 5 palet (Sunset Vice, Neon Nights, Palm Pop, Noir Gold, Bubblegum);
  judul/subtitle/tagline/badge bisa diedit, posisi + ukuran judul, matahari
  retro, siluet palem, grain; export PNG 1080×1080, 1080×1350, 1920×1080,
  1080×1920 (satuan + semua ukuran sekaligus).
- `main.ts` (pola kit, Node 22) + `vendor/makefun-app.ts` (salinan kit TANPA
  diubah — terverifikasi identik via diff) + `LICENSE` (MIT) + `README.md` +
  `serve.ts` + `shots.json`.
- `screenshots/` — 4 file, render asli dari Chromium lokal (Playwright
  chromium, via CDP; dicek visual): 1-cover.jpg (227.519 B),
  2-editor.jpg (147.257 B), 3-cover.jpg (234.373 B), 4-cover.jpg (219.507 B)
  — semua ≤ 256 KiB.

## Verifikasi yang dilakukan

- Sintaks semua JS lolos `node --check`; app diserve via `node serve.ts`
  (port 8081, HTTP 200); tidak ada URL eksternal/fetch di kode.
- `MAKEFUN_OUTPUT_DIR=/tmp/out-cover node main.ts` berhasil, `dossier.json`
  terbentuk (cover/images/schema/text), app 160 KiB.
- Screenshot dicek visual: cover trio terisi 3 panel, badge tidak menabrak
  judul, editor menampilkan kontrol + preview live.

## Yang MASIH KURANG untuk submit

1. **Repo GitHub publik** (dibuat setelah bounty dibuka) berisi folder ini,
   dengan `main.ts` di root — BELUM dibuat (tugas ini melarang membuat repo).
2. **Sealed recordings** via kit `record` saat submit — BUKAN bagian tugas ini;
   parent agent harus menjalankan record saat build/submit (sesi ini tidak
   direkam oleh kit record).
3. **Submit itu sendiri** (bundle + submit via kit CLI) — belum dilakukan;
   butuh GitHub PAT + API key make.fun @turibaru.
4. Catatan: screenshot diambil dengan Chromium Playwright lokal
   (`~/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome`) via driver
   CDP `/tmp/cdp-shot.mjs` — Chrome `/opt/meta-chromium/chrome` menolak
   start ("Hatch WebGL domain policy is required"), dan mode
   `--screenshot` standar menangkap frame kosong untuk game (bukan untuk
   cover); CDP adalah cara yang terbukti jalan di VM ini.
