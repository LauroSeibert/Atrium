import { z } from "zod";
import { corretorId, imovelId, isoDataHora, leadId, visitaId } from "../comum/tipos";

export const STATUS_VISITA = ["agendada", "realizada", "cancelada", "naoCompareceu"] as const;
export const statusVisita = z.enum(STATUS_VISITA);
export type StatusVisita = z.infer<typeof statusVisita>;

export const visitaSchema = z.object({
  id: visitaId,
  imovelId,
  leadId,
  corretorId,
  dataHora: isoDataHora,
  status: statusVisita,
  observacao: z.string().optional(),
});
export type Visita = z.infer<typeof visitaSchema>;

export const novaVisitaSchema = z.object({
  imovelId,
  leadId,
  corretorId,
  dataHora: isoDataHora,
  observacao: z.string().max(500).optional(),
});
export type NovaVisita = z.infer<typeof novaVisitaSchema>;
