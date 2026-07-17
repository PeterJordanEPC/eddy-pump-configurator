import { build } from "esbuild";
import { readFile, writeFile } from "node:fs/promises";
import { SITE_CONFIG } from "../build-config.js";

for (const [name, value] of Object.entries({ apiBase: SITE_CONFIG.apiBase, fallbackApiBase: SITE_CONFIG.fallbackApiBase })) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.pathname !== "/") throw new Error(`${name} must be an HTTPS origin without a path`);
}

await build({
  entryPoints: ["src/app.jsx"], bundle: true, format: "iife", target: "es2020", minify: true,
  legalComments: "none", outfile: "app.js", sourcemap: SITE_CONFIG.sourceMaps,
  define: {
    __API_BASE__: JSON.stringify(SITE_CONFIG.apiBase),
    __API_FALLBACK_BASE__: JSON.stringify(SITE_CONFIG.fallbackApiBase),
  },
});

const template = await readFile("index.template.html", "utf8");
const connectSrc = [...new Set([SITE_CONFIG.apiBase, SITE_CONFIG.fallbackApiBase])].join(" ");
await writeFile("index.html", template.replace("{{RELEASE_ID}}", SITE_CONFIG.releaseId).replace("{{CONNECT_SRC}}", connectSrc));
