/** Página de resultados (contrato de listagem do fakeApi, MODELO §5). Tipo neutro: UI e mock importam daqui. */
export type Paginacao = { pagina: number; porPagina: number };
export type Pagina<T> = { itens: T[]; total: number; pagina: number; porPagina: number; totalPaginas: number };
