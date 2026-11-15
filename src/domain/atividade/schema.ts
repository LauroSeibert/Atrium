import { z } from "zod";
import { alteracaoId, atividadeId, corretorId, isoDataHora, refEntidade } from "../comum/tipos";

export const TIPOS_ATIVIDADE = [
  "etapaAlterada",
  "nota",
  "visitaAgendada",
  "visitaRealizada",
  "visitaCancelada",
  "propostaEnviada",
  "imovelCriado",
  "precoAlterado",
  "statusAlterado",
  "pagamentoRegistrado",
  "contratoCriado",
  "contratoVinculado",
] as const;
export const tipoAtividade = z.enum(TIPOS_ATIVIDADE);
export type TipoAtividade = z.infer<typeof tipoAtividade>;

export const atividadeSchema = z.object({
  id: atividadeId,
  tipo: tipoAtividade,
  alvo: refEntidade,
  relacionados: z.array(refEntidade),
  autorId: corretorId,
  /** Dados por tipo, ex.: `{ de: "visita", para: "proposta" }`, `{ texto }`. */
  dados: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
  criadoEm: isoDataHora,
});
export type Atividade = z.infer<typeof atividadeSchema>;

/** Valor bruto registrado (centavos, enum, ISO ou null); formatado só na UI. */
export const valorBruto = z.union([z.string(), z.number(), z.null()]);
export type ValorBruto = z.infer<typeof valorBruto>;

export const registroAlteracaoSchema = z.object({
  id: alteracaoId,
  em: isoDataHora,
  autorId: corretorId,
  entidade: refEntidade,
  /** Ex.: `preco`, `status`, `valor`, `parcela.3.pagoEm`. */
  campo: z.string().min(1),
  de: valorBruto,
  para: valorBruto,
});
export type RegistroAlteracao = z.infer<typeof registroAlteracaoSchema>;
