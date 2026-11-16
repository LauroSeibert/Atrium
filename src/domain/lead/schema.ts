import { z } from "zod";
import { centavos, corretorId, imovelId, isoDataHora, leadId } from "../comum/tipos";
import { finalidade, tipoImovel } from "../imovel/schema";

export const ORIGENS = ["site", "portal", "indicacao", "whatsapp", "placa", "redes"] as const;

export const origem = z.enum(ORIGENS);
export type Origem = z.infer<typeof origem>;

export const contatoSchema = z.object({
  telefone: z
    .string()
    .regex(/^\d{10,11}$/)
    .optional(),
  email: z.email().optional(),
});

export const interesseSchema = z.object({
  finalidade,
  tipos: z.array(tipoImovel),
  bairros: z.array(z.string().min(1)),
  quartosMin: z.int().positive().optional(),
});

/** Criação rápida (RF-35): nome + contato + origem (+ imóvel opcional da 1ª negociação); o resto tem padrão. */
export const novoLeadSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  contato: contatoSchema,
  origem,
  interesse: interesseSchema.optional(),
  orcamento: centavos.nullable().optional(),
  responsavelId: corretorId,
  /** Imóvel da primeira negociação (RF-35, RF-71); ausente/`null` = sem imóvel. */
  imovelId: imovelId.nullable().optional(),
});
export type NovoLead = z.infer<typeof novoLeadSchema>;

/** A pessoa (RF-33). Etapa, motivo de perda e ordem no kanban ficam na Negociação (RF-70). */
export const leadSchema = z.object({
  id: leadId,
  nome: z.string().min(1),
  contato: contatoSchema,
  origem,
  interesse: interesseSchema,
  orcamento: centavos.nullable(),
  imoveisVistos: z.array(imovelId),
  responsavelId: corretorId,
  criadoEm: isoDataHora,
  atualizadoEm: isoDataHora,
});
export type Lead = z.infer<typeof leadSchema>;

export const CAMPOS_MONITORADOS_LEAD = ["orcamento"] as const;
