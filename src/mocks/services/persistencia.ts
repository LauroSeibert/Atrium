import { validarBase, type Base } from "@/domain";

/** Persistência do mock (REQUISITOS: alterações sobrevivem ao recarregar; RF-51 restaura). */
const CHAVE = "atrium:mock:v1";

export type Salvo = { base: Base; usuarioAtualId: string; lidas: string[] };

export function carregar(): Salvo | null {
  try {
    const bruto = globalThis.localStorage?.getItem(CHAVE);
    if (!bruto) return null;
    const s = JSON.parse(bruto) as Salvo;
    // Dado corrompido ou de versão antiga: descarta em vez de quebrar a tela.
    if (!s?.base || validarBase(s.base).length) return null;
    return s;
  } catch {
    return null;
  }
}

export function salvar(s: Salvo): void {
  try {
    globalThis.localStorage?.setItem(CHAVE, JSON.stringify(s));
  } catch {
    /* modo privado / cota cheia: segue só em memória */
  }
}

export function apagar(): void {
  try {
    globalThis.localStorage?.removeItem(CHAVE);
  } catch {
    /* idem */
  }
}
