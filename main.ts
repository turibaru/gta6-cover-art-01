// Vice Cover Lab — entry program (Node 22, standard library only).
//
// Copies app/ and screenshots/ from this repository into the output
// directory (MAKEFUN_OUTPUT_DIR, or /output in the grader) and writes
// /output/dossier.json with buildDossier from vendor/makefun-app.ts.
// The run is deterministic: same inputs, same bytes, every time.
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-app.ts";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";

// Caps from the competition gate: dossier text 160 KiB, at most 4
// screenshots of at most 256 KiB each, app/ at most 993 entries and
// 48 MiB, paths at most 1000 bytes.
const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 48 * 1024 * 1024,
  app_path_max_bytes: 1000,
};

function copyTree(name: string): void {
  const src = join(here, name);
  const dst = join(outDir, name);
  if (!existsSync(src)) throw new Error(`main.ts: missing ${name}/ in repository`);
  rmSync(dst, { recursive: true, force: true });
  cpSync(src, dst, { recursive: true });
}

mkdirSync(outDir, { recursive: true });
copyTree("app");
copyTree("screenshots");

const dossier = buildDossier(outDir, caps);
writeFileSync(join(outDir, "dossier.json"), dossier);
console.log(`wrote ${join(outDir, "dossier.json")} (${dossier.length} bytes)`);
