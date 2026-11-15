import type { Atividade, RegistroAlteracao } from "../atividade/schema";
import type { Contrato } from "../contrato/schema";
import type { Corretor } from "../corretor/schema";
import type { Imovel } from "../imovel/schema";
import type { Lead } from "../lead/schema";
import type { Visita } from "../visita/schema";

/**
 * Estado completo do domínio (o "banco" do mock). Imutável: toda operação devolve uma
 * Base nova. Só as funções de `src/domain` produzem Bases alteradas.
 */
export type Base = {
  readonly corretores: readonly Corretor[];
  readonly imoveis: readonly Imovel[];
  readonly leads: readonly Lead[];
  readonly visitas: readonly Visita[];
  readonly contratos: readonly Contrato[];
  readonly atividades: readonly Atividade[];
  readonly alteracoes: readonly RegistroAlteracao[];
  /** Contador para IDs novos (determinístico, sobrevive ao localStorage). */
  readonly seq: number;
};

export type Colecao = "corretores" | "imoveis" | "leads" | "visitas" | "contratos";
export type EntidadeDe<C extends Colecao> = Base[C][number];

export const BASE_VAZIA: Base = {
  corretores: [],
  imoveis: [],
  leads: [],
  visitas: [],
  contratos: [],
  atividades: [],
  alteracoes: [],
  seq: 1,
};

export function buscar<C extends Colecao>(base: Base, colecao: C, id: string): EntidadeDe<C> | undefined {
  return (base[colecao] as readonly EntidadeDe<C>[]).find((e) => e.id === id);
}
