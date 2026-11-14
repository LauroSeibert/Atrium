#!/usr/bin/env node
// Verifica todas as combinações de design-system/contrast.json nos temas claro e escuro.
// Sai com código 1 se alguma ficar abaixo do mínimo. Uso: npm run check:contrast [-- --verbose]
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { readJson as loadTokens } from "./read-json.mjs";
import { evaluatePairs } from "../design-system/contrast-lib.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const tokens = loadTokens(resolve(root, "design-system/tokens.json"));
const contrast = loadTokens(resolve(root, "design-system/contrast.json"));
const results = evaluatePairs(tokens, contrast);

const VERBOSE = process.argv.includes("--verbose");
const pad = (s, n) => String(s).padEnd(n);
let failures = 0;
for (const theme of ["light", "dark"]) {
  const rows = results.filter((x) => x.theme === theme);
  failures += rows.filter((r) => !r.pass).length;
  const shown = VERBOSE ? rows : rows.filter((r) => !r.pass);
  if (shown.length) console.log(`\n${theme === "light" ? "Tema claro" : "Tema escuro"}`);
  for (const r of shown) {
    console.log(
      `  ${r.pass ? "✓" : "✗"} ${pad(r.fg, 15)} sobre ${pad(r.bg, 15)} ${pad(r.ratio.toFixed(2) + ":1", 9)} (mín. ${r.min}:1)  ${r.use}`,
    );
  }
}
console.log(`\n${results.length - failures}/${results.length} combinações aprovadas.`);
if (failures) {
  console.error(`✗ ${failures} combinação(ões) abaixo do mínimo WCAG.`);
  process.exit(1);
}
console.log("✓ Contraste OK.");
