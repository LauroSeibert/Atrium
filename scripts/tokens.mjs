#!/usr/bin/env node
/**
 * Atrium — pipeline de tokens.
 *
 * 1. Gera as escalas 50→950 (OKLCH, matiz preservado) a partir das cores da marca
 *    e grava em design-system/tokens.json (color.scale), mantendo as âncoras exatas:
 *      brass-600 = brand.brass · warm: neutros quentes no matiz da tinta (brand.ink)
 * 2. Emite src/styles/tokens.css (CSS variables, tema claro em :root e escuro em .dark).
 *
 * Uso: node scripts/tokens.mjs            (gera)
 *      node scripts/tokens.mjs --check    (falha se os arquivos gerados estiverem desatualizados)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { oklch, formatHex, clampChroma } from "culori";
import { resolveAlias } from "../design-system/tokens-lib.mjs";
import { readJson as loadTokens } from "./read-json.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TOKENS_JSON = resolve(root, "design-system/tokens.json");
const TOKENS_CSS = resolve(root, "src/styles/tokens.css");
const CHECK = process.argv.includes("--check");

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
// Luminosidade-alvo (OKLCH L) por degrau.
const TARGET_L = {
  50: 0.985,
  100: 0.96,
  200: 0.92,
  300: 0.86,
  400: 0.76,
  500: 0.65,
  600: 0.55,
  700: 0.46,
  800: 0.38,
  900: 0.3,
  950: 0.22,
};

function buildScale(anchorHex, anchorStep, { chromaOverride } = {}) {
  const a = oklch(anchorHex);
  const hue = a.h ?? 0;
  // Perfil de croma em sino: máximo no meio, ~0 nos extremos; calibrado para bater na âncora.
  const bell = (l) => Math.pow(Math.sin(Math.PI * Math.min(Math.max(l, 0), 1)), 0.8);
  const peak = chromaOverride ?? a.c / Math.max(bell(a.l), 0.05);
  const out = {};
  let prevL = 1.01;
  for (const step of STEPS) {
    if (step === anchorStep) {
      out[step] = anchorHex.toUpperCase();
      prevL = a.l;
      continue;
    }
    // Ajusta o alvo para manter a escala monotônica ao redor da âncora.
    let l = TARGET_L[step];
    if (step < anchorStep && l <= a.l) l = a.l + (prevL - a.l) / 2;
    if (step > anchorStep && l >= a.l) l = a.l - 0.04;
    const c = peak * bell(l);
    out[step] = formatHex(clampChroma({ mode: "oklch", l, c, h: hue }, "oklch")).toUpperCase();
    prevL = l;
  }
  return out;
}

const tokens = loadTokens(TOKENS_JSON);
const brand = tokens.color.brand;
const brass = brand.brass.$value;
const ink = oklch(brand.ink.$value);

const scaleTokens = (scale, desc) => {
  const node = { $type: "color", $description: desc };
  for (const [k, v] of Object.entries(scale)) node[k] = { $value: v };
  return node;
};

// Neutros quentes: nenhum cinza frio; todo neutro puxa levemente para o matiz da tinta.
const warm = {};
for (const step of STEPS) {
  warm[step] = formatHex({ mode: "oklch", l: Math.min(TARGET_L[step] + 0.01, 0.99), c: 0.012, h: ink.h ?? 85 }).toUpperCase();
}

tokens.color.scale = {
  brass: scaleTokens(buildScale(brass, 600), "Escala do latão (âncora 600 = brand.brass)"),
  warm: scaleTokens(warm, "Neutros quentes (matiz da tinta)"),
};

const jsonOut = JSON.stringify(tokens, null, 2) + "\n";

// ---------- CSS ----------
const v = (node) => resolveAlias(tokens, node.$value);
const entries = (group) => Object.entries(group).filter(([k]) => !k.startsWith("$"));
const lines = [];
const push = (s = "") => lines.push(s);

push("/*");
push(" * ARQUIVO GERADO — não edite à mão.");
push(" * Fonte: design-system/tokens.json · Gerador: scripts/tokens.mjs (npm run tokens)");
push(" * Único arquivo do código autorizado a conter valores de cor literais.");
push(" * Forma/movimento usam prefixos próprios (--corner-*, --elevation-*, --easing-*, --weight-*,");
push(" * --line-height-*); globals.css os expõe ao Tailwind com os nomes do guia (--radius-*,");
push(" * --shadow-*, --ease-*…), sem autorreferência.");
push(" */");
push();
push(":root {");
push("  color-scheme: light;");
push();
push("  /* marca */");
for (const [k, n] of entries(brand)) push(`  --brand-${k}: ${v(n)};`);
for (const [name, scale] of Object.entries(tokens.color.scale)) {
  push();
  push(`  /* escala ${name} */`);
  for (const [k, n] of entries(scale)) push(`  --${name}-${k}: ${v(n)};`);
}
push();
push("  /* semânticos (claro) */");
for (const [k, n] of entries(tokens.semantic.light)) push(`  --${k}: ${v(n)};`);
push();
push("  /* tipografia */");
push(`  --font-family-serif: ${tokens.font.family.serif.$value.join(", ")};`);
push(`  --font-family-sans: ${tokens.font.family.sans.$value.join(", ")};`);
for (const [k, n] of entries(tokens.font.size)) push(`  --font-size-${k}: ${n.$value};`);
for (const [k, n] of entries(tokens.font["line-height"])) push(`  --line-height-${k}: ${n.$value};`);
for (const [k, n] of entries(tokens.font.weight)) push(`  --weight-${k}: ${n.$value};`);
for (const [k, n] of entries(tokens.font["letter-spacing"])) push(`  --letter-spacing-${k}: ${n.$value};`);
push();
push("  /* espaçamento (grade 4px) */");
for (const [k, n] of entries(tokens.space)) push(`  --space-${k}: ${n.$value};`);
push();
push("  /* raio */");
for (const [k, n] of entries(tokens.radius)) push(`  --corner-${k}: ${n.$value};`);
push();
push("  /* sombra (neutra) */");
for (const [k, n] of entries(tokens.shadow)) {
  const s = n.$value;
  push(`  --elevation-${k}: ${s.offsetX} ${s.offsetY} ${s.blur} ${s.spread} ${s.color};`);
}
push();
push("  /* motion */");
for (const [k, n] of entries(tokens.duration)) push(`  --dur-${k}: ${n.$value};`);
for (const [k, n] of entries(tokens.loop ?? {})) push(`  --loop-${k}: ${n.$value};`);
for (const [k, n] of entries(tokens.easing)) push(`  --easing-${k}: cubic-bezier(${n.$value.join(", ")});`);
push();
push("  /* z-index */");
for (const [k, n] of entries(tokens.z)) push(`  --z-${k}: ${n.$value};`);
push("}");
push();
push("/* escopo claro explícito (para amostras dentro do tema escuro) */");
push(".light {");
push("  color-scheme: light;");
for (const [k, n] of entries(tokens.semantic.light)) push(`  --${k}: ${v(n)};`);
for (const [k, n] of entries(tokens.shadow)) {
  const s = n.$value;
  push(`  --elevation-${k}: ${s.offsetX} ${s.offsetY} ${s.blur} ${s.spread} ${s.color};`);
}
push("}");
push();
push(".dark {");
push("  color-scheme: dark;");
for (const [k, n] of entries(tokens.semantic.dark)) push(`  --${k}: ${v(n)};`);
push();
push("  /* no escuro, elevação = cor + borda; sombra quase imperceptível */");
push("  --elevation-1: 0 0 0 1px var(--border);");
push("  --elevation-2: 0 0 0 1px var(--border);");
push("  --elevation-3: 0 0 0 1px var(--border-strong);");
push("}");
push();
push("/*");
push(" * Superfícies em tinta (sidebar, menu do celular): os semânticos do tema escuro valem dentro delas");
push(" * nos dois temas, então componentes genéricos (navegação, botões) funcionam sem variante própria.");
push(" * As cores da própria tinta (--sidebar*, --ink-panel) seguem o tema da página.");
push(" */");
push(".tinta {");
push("  color-scheme: dark;");
for (const [k, n] of entries(tokens.semantic.dark)) {
  if (k.startsWith("sidebar") || k === "ink-panel") continue;
  push(`  --${k}: ${v(n)};`);
}
push("}");
push();
push("@media (prefers-reduced-motion: reduce) {");
push("  :root {");
for (const [k] of entries(tokens.duration)) push(`    --dur-${k}: 1ms;`);
push("  }");
push("}");
const cssOut = lines.join("\n") + "\n";

if (CHECK) {
  const stale = [];
  if (readFileSync(TOKENS_JSON, "utf8") !== jsonOut) stale.push("design-system/tokens.json");
  let css = "";
  try {
    css = readFileSync(TOKENS_CSS, "utf8");
  } catch {}
  if (css !== cssOut) stale.push("src/styles/tokens.css");
  if (stale.length) {
    console.error(`✗ Tokens desatualizados: ${stale.join(", ")}. Rode: npm run tokens`);
    process.exit(1);
  }
  console.log("✓ Tokens em dia.");
} else {
  writeFileSync(TOKENS_JSON, jsonOut);
  writeFileSync(TOKENS_CSS, cssOut);
  console.log("✓ design-system/tokens.json (escalas) e src/styles/tokens.css gerados.");
}
