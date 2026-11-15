/**
 * Auxiliar de teste: lista os valores de fill/stroke de um SVG renderizado que NÃO são
 * tokens de ilustração (`var(--illus-*)`), `none` ou `currentColor`. Gate 5: "sem cores fora da paleta".
 * `permitidos` acrescenta outros tokens semânticos aceitos (ex.: avatar de iniciais usa `--primary`).
 */
export function coresForaDaPaleta(raiz: Element, permitidos: string[] = []): string[] {
  const ok = (v: string) =>
    v === "none" ||
    v === "currentColor" ||
    /^var\(--illus-[a-z-]+\)$/.test(v) ||
    permitidos.some((p) => v === `var(--${p})`);
  const ruins: string[] = [];
  for (const el of [raiz, ...Array.from(raiz.querySelectorAll("*"))]) {
    for (const attr of ["fill", "stroke", "stop-color", "color"]) {
      const v = el.getAttribute(attr);
      if (v !== null && !ok(v)) ruins.push(`<${el.tagName.toLowerCase()} ${attr}="${v}">`);
    }
    if (el.getAttribute("style")) ruins.push(`<${el.tagName.toLowerCase()} style="${el.getAttribute("style")}">`);
  }
  return ruins;
}

/** Formas sem `fill` próprio nem herdado de um `<g>` (o padrão do SVG seria preto, fora da paleta). */
export function formasSemCor(raiz: Element): string[] {
  const formas = raiz.querySelectorAll("rect, circle, ellipse, path, polygon, polyline, line");
  const ruins: string[] = [];
  for (const f of Array.from(formas)) {
    let el: Element | null = f;
    let temFill = false;
    while (el && el !== raiz.parentElement) {
      if (el.getAttribute("fill") !== null) {
        temFill = true;
        break;
      }
      el = el.parentElement;
    }
    const soTraco = f.getAttribute("stroke") !== null && (f.tagName === "line" || f.tagName === "polyline");
    if (!temFill && !soTraco) ruins.push(`<${f.tagName.toLowerCase()}>`);
  }
  return ruins;
}
