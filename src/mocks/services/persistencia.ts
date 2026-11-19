import { validarBase, type Base } from "@/domain";

/** Persistência do mock (REQUISITOS: alterações sobrevivem ao recarregar; RF-51 restaura). */
/** v2: negociações, contatos, anúncios, documentos e despesas (BRIEF-MENU). v3: mock com receita em todos os meses. */
const CHAVE = "atrium:mock:v3";
/** Chaves de versões anteriores, removidas ao carregar para não ocupar a cota. */
const CHAVES_ANTIGAS = ["atrium:mock:v1", "atrium:mock:v2"];

export type Salvo = { base: Base; usuarioAtualId: string; lidas: string[] };

export function carregar(): Salvo | null {
  try {
    for (const k of CHAVES_ANTIGAS) globalThis.localStorage?.removeItem(k);
  } catch {
    /* armazenamento indisponível: nada a limpar */
  }
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
