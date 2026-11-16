import type { Anuncio } from "../anuncio/schema";
import type { Atividade, RegistroAlteracao } from "../atividade/schema";
import type { Contato } from "../contato/schema";
import type { Contrato } from "../contrato/schema";
import type { Corretor } from "../corretor/schema";
import type { Despesa } from "../despesa/schema";
import type { Documento } from "../documento/schema";
import type { Imovel } from "../imovel/schema";
import type { Lead } from "../lead/schema";
import type { Negociacao } from "../negociacao/schema";
import type { Visita } from "../visita/schema";

/**
 * Estado completo do domínio (o "banco" do mock). Imutável: toda operação devolve uma
 * Base nova. Só as funções de `src/domain` produzem Bases alteradas.
 */
export type Base = {
  readonly corretores: readonly Corretor[];
  readonly imoveis: readonly Imovel[];
  readonly leads: readonly Lead[];
  readonly negociacoes: readonly Negociacao[];
  readonly visitas: readonly Visita[];
  readonly contratos: readonly Contrato[];
  readonly contatos: readonly Contato[];
  readonly anuncios: readonly Anuncio[];
  readonly documentos: readonly Documento[];
  readonly despesas: readonly Despesa[];
  readonly atividades: readonly Atividade[];
  readonly alteracoes: readonly RegistroAlteracao[];
  /** Contador para IDs novos (determinístico, sobrevive ao localStorage). */
  readonly seq: number;
};

export const COLECOES = [
  "corretores",
  "imoveis",
  "leads",
  "negociacoes",
  "visitas",
  "contratos",
  "contatos",
  "anuncios",
  "documentos",
  "despesas",
] as const;
export type Colecao = (typeof COLECOES)[number];
export type EntidadeDe<C extends Colecao> = Base[C][number];

export const BASE_VAZIA: Base = {
  corretores: [],
  imoveis: [],
  leads: [],
  negociacoes: [],
  visitas: [],
  contratos: [],
  contatos: [],
  anuncios: [],
  documentos: [],
  despesas: [],
  atividades: [],
  alteracoes: [],
  seq: 1,
};

export function buscar<C extends Colecao>(base: Base, colecao: C, id: string): EntidadeDe<C> | undefined {
  return (base[colecao] as readonly EntidadeDe<C>[]).find((e) => e.id === id);
}
