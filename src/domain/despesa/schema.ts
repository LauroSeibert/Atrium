import { z } from "zod";
import { centavos, contratoId, despesaId, isoData, isoDataHora } from "../comum/tipos";

/** Despesa = impostos e burocracia de contratos e documentação (RF-78). */
export const CATEGORIAS_DESPESA = ["imposto", "cartorio", "certidao", "taxa", "despachante", "outro"] as const;
export const categoriaDespesa = z.enum(CATEGORIAS_DESPESA);
export type CategoriaDespesa = z.infer<typeof categoriaDespesa>;

/** Campos editáveis (só enquanto não paga, ESTADOS §3.9). */
export const dadosDespesaSchema = z.object({
  categoria: categoriaDespesa,
  descricao: z.string().trim().min(2).max(140),
  valor: centavos.positive(),
  vencimento: isoData,
  contratoId: contratoId.nullable(),
});
export type DadosDespesa = z.infer<typeof dadosDespesaSchema>;

export const despesaSchema = dadosDespesaSchema.extend({
  id: despesaId,
  descricao: z.string().min(1),
  pagaEm: isoDataHora.nullable(),
  criadoEm: isoDataHora,
  atualizadoEm: isoDataHora,
});
export type Despesa = z.infer<typeof despesaSchema>;

/** Derivado (nunca armazenado). */
export type StatusDespesa = "paga" | "atrasada" | "aVencer";
export const STATUS_DESPESA: readonly StatusDespesa[] = ["paga", "atrasada", "aVencer"];

export const CAMPOS_MONITORADOS_DESPESA = ["valor", "pagaEm"] as const;
