import { z } from "zod";
import { corretorId, imovelId, isoDataHora, leadId, negociacaoId } from "../comum/tipos";

/**
 * Negociação = um lead × um imóvel (RF-70). Etapa, motivo de perda e posição no kanban são dela,
 * não do lead (MODELO §2 Negociacao, ESTADOS §3.1).
 */
export const ETAPAS = ["novo", "contato", "visita", "proposta", "fechado", "perdido"] as const;
export const MOTIVOS_PERDA = ["preco", "localizacao", "desistencia", "concorrencia", "outro"] as const;

export const etapa = z.enum(ETAPAS);
export const motivoPerda = z.enum(MOTIVOS_PERDA);
export type Etapa = z.infer<typeof etapa>;
export type MotivoPerda = z.infer<typeof motivoPerda>;

/** Etapas em que a negociação está encerrada (não conta como "aberta" na regra de duplicidade). */
export const ETAPAS_ENCERRADAS: readonly Etapa[] = ["fechado", "perdido"];
export const estaAberta = (n: { etapa: Etapa }) => !ETAPAS_ENCERRADAS.includes(n.etapa);

export const negociacaoSchema = z
  .object({
    id: negociacaoId,
    leadId,
    /** `null` = interesse ainda sem imóvel definido. */
    imovelId: imovelId.nullable(),
    etapa,
    motivoPerda: motivoPerda.nullable(),
    responsavelId: corretorId,
    ordem: z.int().nonnegative(),
    criadoEm: isoDataHora,
    atualizadoEm: isoDataHora,
  })
  .superRefine((n, ctx) => {
    if ((n.etapa === "perdido") !== (n.motivoPerda !== null))
      ctx.addIssue({ code: "custom", path: ["motivoPerda"], message: "motivoPerda só (e sempre) quando perdido" });
    if (n.etapa === "fechado" && n.imovelId === null)
      ctx.addIssue({ code: "custom", path: ["imovelId"], message: "Negociação fechada precisa de imóvel" });
  });
export type Negociacao = z.infer<typeof negociacaoSchema>;

export const novaNegociacaoSchema = z.object({ leadId, imovelId: imovelId.nullable() });
export type NovaNegociacao = z.infer<typeof novaNegociacaoSchema>;

export const CAMPOS_MONITORADOS_NEGOCIACAO = ["etapa"] as const;
