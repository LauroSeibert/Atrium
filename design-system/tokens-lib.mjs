// Utilitários puros (sem Node APIs): usados pelos scripts, pela página de cores e pelo Storybook.

/** Resolve aliases W3C no formato "{grupo.subgrupo.token}" (recursivo). */
export function resolveAlias(tokens, value, depth = 0) {
  if (typeof value !== "string") return value;
  const m = value.match(/^\{([^}]+)\}$/);
  if (!m) return value;
  if (depth > 10) throw new Error(`Alias circular: ${value}`);
  const node = m[1].split(".").reduce((acc, key) => acc?.[key], tokens);
  if (!node || !("$value" in node)) throw new Error(`Alias não encontrado: ${value}`);
  return resolveAlias(tokens, node.$value, depth + 1);
}
