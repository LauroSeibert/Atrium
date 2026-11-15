import { z } from "zod";
import { centavos, corretorId, imovelId, isoDataHora, leadId } from "../comum/tipos";
import { finalidade, tipoImovel } from "../imovel/schema";

export const ETAPAS = ["novo", "contato", "visita", "proposta", "fechado", "perdido"] as const;
export const ORIGENS = ["site", "portal", "indicacao", "whatsapp", "placa", "redes"] as const;
export const MOTIVOS_PERDA = ["preco", "localizacao", "desistencia", "concorrencia", "outro"] as const;

export const etapa = z.enum(ETAPAS);
export const origem = z.enum(ORIGENS);
export const motivoPerda = z.enum(MOTIVOS_PERDA);
export type Etapa = z.infer<typeof etapa>;
export type Origem = z.infer<typeof origem>;
export type MotivoPerda = z.infer<typeof motivoPerda>;

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

/** Criação rápida (RF-35): nome + contato + origem; o resto tem padrão. */
export const novoLeadSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  contato: contatoSchema,
  origem,
  interesse: interesseSchema.optional(),
  orcamento: centavos.nullable().optional(),
  responsavelId: corretorId,
});
export type NovoLead = z.infer<typeof novoLeadSchema>;

export const leadSchema = z
  .object({
    id: leadId,
    nome: z.string().min(1),
    contato: contatoSchema,
    origem,
    etapa,
    motivoPerda: motivoPerda.nullable(),
    interesse: interesseSchema,
    orcamento: centavos.nullable(),
    imoveisVistos: z.array(imovelId),
    responsavelId: corretorId,
    ordem: z.int().nonnegative(),
    criadoEm: isoDataHora,
    atualizadoEm: isoDataHora,
  })
  .superRefine((l, ctx) => {
    if ((l.etapa === "perdido") !== (l.motivoPerda !== null))
      ctx.addIssue({ code: "custom", path: ["motivoPerda"], message: "motivoPerda só (e sempre) quando perdido" });
  });
export type Lead = z.infer<typeof leadSchema>;

export const CAMPOS_MONITORADOS_LEAD = ["etapa", "orcamento"] as const;
