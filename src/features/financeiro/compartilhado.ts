/** Utilidades das telas do Financeiro: leitura de filtros da URL (RF-06). */

export const POR_PAGINA = 10;
const ISO_DATA = /^\d{4}-\d{2}-\d{2}$/;
const ISO_MES = /^\d{4}-\d{2}$/;

export const dataValida = (v: string | undefined) => (v && ISO_DATA.test(v) ? v : undefined);
export const mesValido = (v: string | undefined) => (v && ISO_MES.test(v) ? v : undefined);
export const lerPagina = (v: string | undefined) => Math.max(1, Number.parseInt(v ?? "1", 10) || 1);

/** Mantém só os valores conhecidos (a URL é digitável, então nunca é confiável). */
export function filtrarConhecidos<T extends string>(valores: string[], conhecidos: readonly T[]): T[] {
  return valores.filter((v): v is T => conhecidos.includes(v as T));
}
