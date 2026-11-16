import { z } from "zod";
import { contatoId, contratoId, imovelId, isoDataHora } from "../comum/tipos";

/** Contato = pessoa fora do funil (RF-74). Sem ciclo de vida (ESTADOS §3.11). */
export const PAPEIS_CONTATO = ["proprietario", "advogado", "cartorio", "despachante", "fiador", "outro"] as const;
export const papelContato = z.enum(PAPEIS_CONTATO);
export type PapelContato = z.infer<typeof papelContato>;

const telefone = z.string().regex(/^\d{10,11}$/, "Telefone com DDD, só dígitos");

/** Campos que o formulário de contato edita (RF-74). */
export const dadosContatoSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  papel: papelContato,
  telefone: telefone.optional(),
  email: z.email().optional(),
  observacao: z.string().trim().max(500).optional(),
  imovelIds: z.array(imovelId),
  contratoIds: z.array(contratoId),
});
export type DadosContato = z.infer<typeof dadosContatoSchema>;

export const contatoPessoaSchema = dadosContatoSchema.extend({
  id: contatoId,
  nome: z.string().min(1),
  criadoEm: isoDataHora,
  atualizadoEm: isoDataHora,
});
export type Contato = z.infer<typeof contatoPessoaSchema>;
