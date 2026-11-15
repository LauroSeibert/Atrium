/**
 * Parâmetros da URL da listagem de imóveis (RF-06, RF-21…23): leitura validada e chips dos filtros ativos.
 * Funções puras: a regra de quais valores existem vem do domínio (enums), nunca de `if` de status.
 */
import {
  FINALIDADES,
  STATUS_IMOVEL,
  TIPOS_IMOVEL,
  type Finalidade,
  type StatusImovel,
  type TipoImovel,
} from "@/domain";
import { FINALIDADE_ROTULO, STATUS_IMOVEL_UI, TIPO_IMOVEL_ROTULO } from "@/components/patterns/rotulos";
import { formatMoeda } from "@/lib/format";
import type { FiltrosImoveis, OrdemImoveis } from "@/mocks/services/fakeApi";

export const POR_PAGINA = 12;
export const ORDENS: readonly OrdemImoveis[] = ["recentes", "precoAsc", "precoDesc", "area"];
export const VISUALIZACOES = ["grade", "lista"] as const;
export type Visualizacao = (typeof VISUALIZACOES)[number];
export const QUARTOS_OPCOES = [1, 2, 3, 4] as const;

export type ParametrosImoveis = {
  busca: string;
  tipos: TipoImovel[];
  finalidade?: Finalidade;
  status: StatusImovel[];
  bairros: string[];
  /** Em reais (a API usa centavos). */
  precoMin?: number;
  precoMax?: number;
  quartos?: number;
  favoritos: boolean;
  /** `"todos"`, um id de corretor ou ausente (recorte padrão da persona, RF-08). */
  corretor?: string;
  ordem: OrdemImoveis;
  pagina: number;
  view?: Visualizacao;
};

/** Chaves da URL que são filtros (Limpar tudo não mexe em `ordem` e `view`). */
export const CHAVES_FILTRO = [
  "q",
  "tipo",
  "finalidade",
  "status",
  "bairro",
  "precoMin",
  "precoMax",
  "quartos",
  "favoritos",
  "corretor",
] as const;

function lista<T extends string>(sp: URLSearchParams, chave: string, validos: readonly T[]): T[] {
  return (sp.get(chave)?.split(",") ?? []).filter((v): v is T => (validos as readonly string[]).includes(v));
}

function inteiro(v: string | null): number | undefined {
  return v !== null && /^\d+$/.test(v) ? Number(v) : undefined;
}

export function lerParametros(sp: URLSearchParams): ParametrosImoveis {
  const finalidade = sp.get("finalidade");
  const ordem = sp.get("ordem");
  const view = sp.get("view");
  const quartos = inteiro(sp.get("quartos"));
  return {
    busca: sp.get("q") ?? "",
    tipos: lista(sp, "tipo", TIPOS_IMOVEL),
    finalidade: (FINALIDADES as readonly string[]).includes(finalidade ?? "") ? (finalidade as Finalidade) : undefined,
    status: lista(sp, "status", STATUS_IMOVEL),
    bairros: sp.get("bairro")?.split(",").filter(Boolean) ?? [],
    precoMin: inteiro(sp.get("precoMin")),
    precoMax: inteiro(sp.get("precoMax")),
    quartos: quartos !== undefined && quartos >= 1 ? Math.min(quartos, 4) : undefined,
    favoritos: sp.get("favoritos") === "1",
    corretor: sp.get("corretor") || undefined,
    ordem: (ORDENS as readonly string[]).includes(ordem ?? "") ? (ordem as OrdemImoveis) : "recentes",
    pagina: Math.max(1, inteiro(sp.get("pagina")) ?? 1),
    view: (VISUALIZACOES as readonly string[]).includes(view ?? "") ? (view as Visualizacao) : undefined,
  };
}

export function paraFiltrosApi(p: ParametrosImoveis, corretorId?: string): FiltrosImoveis {
  return {
    busca: p.busca.trim() || undefined,
    tipos: p.tipos,
    finalidade: p.finalidade,
    status: p.status,
    bairros: p.bairros,
    precoMin: p.precoMin === undefined ? undefined : p.precoMin * 100,
    precoMax: p.precoMax === undefined ? undefined : p.precoMax * 100,
    quartos: p.quartos,
    favoritos: p.favoritos || undefined,
    corretorId,
  };
}

export type ChipFiltro = {
  id: string;
  rotulo: string;
  /** Mudança de URL que remove o filtro. */ remover: Record<string, string | string[] | undefined>;
};

const reais = (v: number) => formatMoeda(v * 100, { semCentavos: true });

/** Chips dos filtros ativos (RF-21). `nomeCorretor` só é chamado quando há recorte por corretor. */
export function construirChips(
  p: ParametrosImoveis,
  corretorEfetivo: string | undefined,
  nomeCorretor: (id: string) => string,
  meuId?: string,
): ChipFiltro[] {
  const chips: ChipFiltro[] = [];
  if (corretorEfetivo)
    chips.push({
      id: "corretor",
      rotulo: corretorEfetivo === meuId ? "Meus imóveis" : `Corretor: ${nomeCorretor(corretorEfetivo)}`,
      remover: { corretor: "todos" },
    });
  for (const t of p.tipos)
    chips.push({
      id: `tipo-${t}`,
      rotulo: `Tipo: ${TIPO_IMOVEL_ROTULO[t]}`,
      remover: { tipo: p.tipos.filter((x) => x !== t) },
    });
  if (p.finalidade)
    chips.push({
      id: "finalidade",
      rotulo: `Finalidade: ${FINALIDADE_ROTULO[p.finalidade]}`,
      remover: { finalidade: undefined },
    });
  for (const s of p.status)
    chips.push({
      id: `status-${s}`,
      rotulo: `Status: ${STATUS_IMOVEL_UI[s].rotulo}`,
      remover: { status: p.status.filter((x) => x !== s) },
    });
  for (const b of p.bairros)
    chips.push({ id: `bairro-${b}`, rotulo: `Bairro: ${b}`, remover: { bairro: p.bairros.filter((x) => x !== b) } });
  if (p.quartos !== undefined)
    chips.push({
      id: "quartos",
      rotulo: `Quartos: ${p.quartos >= 4 ? "4+" : p.quartos}`,
      remover: { quartos: undefined },
    });
  if (p.precoMin !== undefined)
    chips.push({ id: "precoMin", rotulo: `Preço a partir de ${reais(p.precoMin)}`, remover: { precoMin: undefined } });
  if (p.precoMax !== undefined)
    chips.push({ id: "precoMax", rotulo: `Preço até ${reais(p.precoMax)}`, remover: { precoMax: undefined } });
  if (p.favoritos) chips.push({ id: "favoritos", rotulo: "Favoritos", remover: { favoritos: undefined } });
  return chips;
}
