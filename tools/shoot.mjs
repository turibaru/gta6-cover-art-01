// Vice Cover Lab — screenshot driver (written for this rebuild).
// Drives the local Playwright Chromium over CDP with Node's built-in
// WebSocket client: no npm packages, no --screenshot flag (which would
// capture a blank frame before the app draws). Reads shots.json,
// navigates to each ?shot= scene, waits for data-shot-ready, then
// captures a JPEG within the gate limits.
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const CHROME = process.env.CHROME ||
  (process.env.HOME + "/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome");
const BASE = process.env.BASE || "http://127.0.0.1:8080";
const PORT = Number(process.env.CDP_PORT || 9223);
const SHOTS = JSON.parse(readFileSync(process.argv[2] || "shots.json", "utf8"));
const OUT = process.argv[3] || "screenshots";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitHttp(url, tries = 50) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return await r.json();
    } catch { /* not up yet */ }
    await sleep(200);
  }
  throw new Error("CDP endpoint never came up: " + url);
}

function connectWs(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const pending = new Map();
    let nextId = 1;
    ws.onopen = () => resolve({
      send(method, params = {}) {
        return new Promise((res, rej) => {
          const id = nextId++;
          pending.set(id, { res, rej });
          ws.send(JSON.stringify({ id, method, params }));
        });
      },
      close() { ws.close(); },
    });
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) rej(new Error(msg.error.message));
        else res(msg.result);
      }
    };
    ws.onerror = (e) => reject(e);
  });
}

const chrome = spawn(CHROME, [
  "--headless", "--no-sandbox", "--disable-gpu",
  "--hide-scrollbars", "--force-device-scale-factor=1",
  `--remote-debugging-port=${PORT}`,
  "--user-data-dir=/tmp/chrome-profile-cover2",
  "about:blank",
], { stdio: "ignore" });

try {
  await waitHttp(`http://127.0.0.1:${PORT}/json/version`);
  const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const page = targets.find((t) => t.type === "page");
  if (!page) throw new Error("no page target from CDP");
  const cdp = await connectWs(page.webSocketDebuggerUrl);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");

  for (const shot of SHOTS) {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: shot.w, height: shot.h, deviceScaleFactor: 1, mobile: false,
    });
    await cdp.send("Page.navigate", { url: BASE + "/" + shot.query });
    let ready = false;
    for (let i = 0; i < 75; i++) {
      await sleep(200);
      const r = await cdp.send("Runtime.evaluate", {
        expression: "document.documentElement.getAttribute('data-shot-ready')",
        returnByValue: true,
      });
      if (r && r.result && r.result.value === "1") { ready = true; break; }
    }
    if (!ready) throw new Error("shot never became ready: " + shot.name);
    await sleep(150);
    const snap = await cdp.send("Page.captureScreenshot", { format: "jpeg", quality: 85 });
    const bytes = Buffer.from(snap.data, "base64");
    writeFileSync(join(OUT, shot.name), bytes);
    console.log(shot.name, shot.w + "x" + shot.h, bytes.length + " bytes");
  }
  cdp.close();
  console.log("all shots captured");
} finally {
  chrome.kill("SIGKILL");
}
