// Cálculo de contraste WCAG 2.x compartilhado entre o script e a página de cores.
import { wcagContrast, parse, formatHex } from "culori";
import { resolveAlias } from "./tokens-lib.mjs";

/** Valor resolvido de um token semântico num tema. */
export function semanticValue(tokens, theme, name) {
  const node = tokens.semantic[theme][name];
  if (!node) throw new Error(`Token semântico inexistente: ${theme}.${name}`);
  return String(resolveAlias(tokens, node.$value));
}

/** Compõe uma cor com alpha sobre um fundo opaco (para medir o que o olho vê). */
function flatten(fg, bg) {
  const f = parse(fg);
  const b = parse(bg);
  if ((b.alpha ?? 1) < 1) throw new Error(`Fundo translúcido não pode ser medido sozinho: ${bg}`);
  const a = f.alpha ?? 1;
  return formatHex({ mode: "rgb", r: f.r * a + b.r * (1 - a), g: f.g * a + b.g * (1 - a), b: f.b * a + b.b * (1 - a) });
}

/** Avalia todos os pares de contrast.json nos dois temas. */
export function evaluatePairs(tokens, contrast) {
  const results = [];
  for (const theme of ["light", "dark"]) {
    for (const pair of contrast.pairs) {
      const bg = semanticValue(tokens, theme, pair.bg);
      const fg = flatten(semanticValue(tokens, theme, pair.fg), bg);
      const ratio = wcagContrast(fg, bg);
      results.push({ theme, ...pair, fgValue: fg, bgValue: bg, ratio, pass: ratio >= pair.min });
    }
  }
  return results;
}
