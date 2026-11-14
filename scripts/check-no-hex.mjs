#!/usr/bin/env node
// Gate 1: "zero valores de cor fora de tokens.css".
// Varre src/ e public/ por cores literais (hex, rgb/rgba, hsl/hsla, oklch/oklab, hwb, lab/lch).
// Exceções explícitas abaixo (gerado ou asset de marca que precisa ser autocontido).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, relative, extname, sep } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIRS = ["src", "public"];
const EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".css", ".svg", ".mdx", ".html"]);
const ALLOW = new Set([
  "src/styles/tokens.css", // gerado de design-system/tokens.json
  "src/app/icon.svg", // favicon: arquivo isolado, não lê CSS do app (cores = tokens da marca)
]);
const COLOR = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![0-9a-zA-Z_-])|\b(?:rgba?|hsla?|hwb|oklch|oklab|lab|lch)\(/g;

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const full = resolve(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

let found = 0;
for (const d of DIRS) {
  let files = [];
  try { files = walk(resolve(root, d)); } catch { continue; }
  for (const file of files) {
    const rel = relative(root, file).split(sep).join("/");
    if (!EXTS.has(extname(file)) || ALLOW.has(rel)) continue;
    readFileSync(file, "utf8").split("\n").forEach((line, i) => {
      for (const m of line.matchAll(COLOR)) {
        found++;
        console.error(`  ${rel}:${i + 1}  ${m[0]}  →  use um token (var(--…) ou classe Tailwind do tema)`);
      }
    });
  }
}
if (found) {
  console.error(`✗ ${found} cor(es) literal(is) fora de tokens.css.`);
  process.exit(1);
}
console.log("✓ Nenhuma cor literal fora de src/styles/tokens.css.");
