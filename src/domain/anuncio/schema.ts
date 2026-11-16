import { z } from "zod";
import { anuncioId, imovelId, isoDataHora } from "../comum/tipos";

/** Anúncio de demonstração (RF-75): canais genéricos, sem integração. Máquina em ESTADOS §3.8. */
export const CANAIS_ANUNCIO = ["site", "portal", "classificados", "redes"] as const;
export const STATUS_ANUNCIO = ["rascunho", "publicado", "pausado", "encerrado"] as const;
export const canalAnuncio = z.enum(CANAIS_ANUNCIO);
export const statusAnuncio = z.enum(STATUS_ANUNCIO);
export type CanalAnuncio = z.infer<typeof canalAnuncio>;
export type StatusAnuncio = z.infer<typeof statusAnuncio>;

export const anuncioSchema = z
  .object({
    id: anuncioId,
    imovelId,
    canal: canalAnuncio,
    status: statusAnuncio,
    /** Primeira publicação. */
    publicadoEm: isoDataHora.nullable(),
    visualizacoes: z.int().nonnegative(),
    contatos: z.int().nonnegative(),
    criadoEm: isoDataHora,
    atualizadoEm: isoDataHora,
  })
  .superRefine((a, ctx) => {
    if ((a.status === "publicado" || a.status === "pausado") && a.publicadoEm === null)
      ctx.addIssue({ code: "custom", path: ["publicadoEm"], message: "Publicado/pausado exige publicadoEm" });
    if (a.status === "rascunho" && a.publicadoEm !== null)
      ctx.addIssue({ code: "custom", path: ["publicadoEm"], message: "Rascunho nunca foi publicado" });
  });
export type Anuncio = z.infer<typeof anuncioSchema>;

/** Derivado na leitura (nunca gravado): anúncio publicado de imóvel que deixou de estar disponível. */
export type AlertaAnuncio = "imovelIndisponivel";

export const CAMPOS_MONITORADOS_ANUNCIO = ["status"] as const;
