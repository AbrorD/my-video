// usage: node scripts/bridge-stills.mjs <outPrefix> <frame,frame,...> [scale] [compId]  (bundles once, GPU via ANGLE, jpeg)
// Env overrides:
//   REMOTION_TMP=D:/remotion-tmp            redirects bundle temp dir (~1.3 GB per bundle) to a big drive
//   BRIDGE_ENTRY=src/sandboxes/<n>/index.tsx renders an isolated sandbox entry instead of src/index.ts
//   COMP_ID=BridgeShort                     composition ID to select (can also be passed as 4th CLI arg)
//   BROWSER_EXECUTABLE=...                  optional custom Chrome/Chromium executable path
import fs from "node:fs";
import path from "node:path";

if (process.env.REMOTION_TMP) {
  fs.mkdirSync(process.env.REMOTION_TMP, { recursive: true });
  process.env.TEMP = process.env.TMP = process.env.REMOTION_TMP;
}

import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";

const [prefix, frames, scale = "0.5", compArg] = process.argv.slice(2);
if (!prefix || !frames) {
  console.error("Usage: node scripts/bridge-stills.mjs <outPrefix> <frame,frame,...> [scale=0.5] [compId=BridgeShort]");
  process.exit(1);
}

const compId = compArg || process.env.COMP_ID || "BridgeShort";
const chromeCandidates = [
  process.env.BROWSER_EXECUTABLE,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
].filter(Boolean);
const browserExecutable = chromeCandidates.find((p) => fs.existsSync(p)) || undefined;
const chromiumOptions = { gl: "angle" };

const outDir = path.dirname(path.resolve(prefix));
fs.mkdirSync(outDir, { recursive: true });

const serveUrl = await bundle({
  entryPoint: path.resolve(process.env.BRIDGE_ENTRY || "src/index.ts"),
  publicDir: path.resolve("public"),
});
const composition = await selectComposition({
  serveUrl,
  id: compId,
  ...(browserExecutable ? { browserExecutable } : {}),
  chromiumOptions,
});
const onBrowserLog = (l) => {
  if (l.type === "error" || l.type === "warning") console.log(`[${l.type}]`, l.text.slice(0, 300));
};
for (const f of frames.split(",").map(Number)) {
  const t0 = Date.now();
  await renderStill({
    composition,
    serveUrl,
    frame: f,
    output: `${prefix}${f}.jpg`,
    imageFormat: "jpeg",
    jpegQuality: 88,
    scale: Number(scale),
    ...(browserExecutable ? { browserExecutable } : {}),
    chromiumOptions,
    timeoutInMilliseconds: 180000,
    onBrowserLog,
  });
  console.log("still", f, ((Date.now() - t0) / 1000).toFixed(1) + "s");
}
