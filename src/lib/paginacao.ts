/** Página de resultados (contrato de listagem do fakeApi, MODELO §5). Tipo neutro: UI e mock importam daqui. */
export type Paginacao = { pagina: number; porPagina: number };
export type Pagina<T> = { itens: T[]; total: number; pagina: number; porPagina: number; totalPaginas: number };

/** Fatia uma lista inteira em páginas (a página pedida é limitada ao intervalo válido). */
export function paginar<T>(lista: readonly T[], p: Paginacao = { pagina: 1, porPagina: 12 }): Pagina<T> {
  const porPagina = Math.max(1, p.porPagina);
  const totalPaginas = Math.max(1, Math.ceil(lista.length / porPagina));
  const pagina = Math.min(Math.max(1, p.pagina), totalPaginas);
  return {
    itens: lista.slice((pagina - 1) * porPagina, pagina * porPagina),
    total: lista.length,
    pagina,
    porPagina,
    totalPaginas,
  };
}
