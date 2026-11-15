import { z } from "zod";
import { centavos, contratoId, corretorId, imovelId, isoData, isoDataHora, leadId, mesRef } from "../comum/tipos";

export const STATUS_CONTRATO = ["rascunho", "ativo", "encerrado", "cancelado"] as const;
export const statusContrato = z.enum(STATUS_CONTRATO);
export type StatusContrato = z.infer<typeof statusContrato>;

export const tipoContrato = z.enum(["venda", "locacao"]);
export type TipoContrato = z.infer<typeof tipoContrato>;

export const PAPEIS_PARTE = ["comprador", "vendedor", "locatario", "locador", "fiador"] as const;
export const parteSchema = z.object({
  papel: z.enum(PAPEIS_PARTE),
  nome: z.string().min(1),
  /** CPF/CNPJ fictício, só dígitos; a UI mascara. */
  documento: z.string().regex(/^(\d{11}|\d{14})$/),
});
export type Parte = z.infer<typeof parteSchema>;

export const parcelaSchema = z.object({
  numero: z.int().positive(),
  vencimento: isoData,
  valor: centavos.positive(),
  pagoEm: isoDataHora.nullable(),
});
export type Parcela = z.infer<typeof parcelaSchema>;

export const comissaoSchema = z.object({
  corretorId,
  /** Percentual em pontos (6 = 6 %). */
  percentual: z.number().positive().max(100),
  base: centavos,
  valor: centavos,
  competencia: mesRef,
  pagaEm: isoDataHora.nullable(),
});
export type Comissao = z.infer<typeof comissaoSchema>;

export const contratoSchema = z
  .object({
    id: contratoId,
    numero: z.string().regex(/^CT-\d{4}-\d{4}$/),
    tipo: tipoContrato,
    imovelId,
    leadId: leadId.nullable(),
    partes: z.array(parteSchema).min(2),
    valor: centavos.positive(),
    inicio: isoData,
    fim: isoData,
    status: statusContrato,
    motivoCancelamento: z.string().min(1).nullable(),
    /** Só locação: percentual em pontos (10 = 10 %). */
    taxaAdministracao: z.number().positive().max(100).nullable(),
    parcelas: z.array(parcelaSchema),
    comissoes: z.array(comissaoSchema),
    criadoEm: isoDataHora,
    atualizadoEm: isoDataHora,
  })
  .superRefine((c, ctx) => {
    if (c.fim < c.inicio) ctx.addIssue({ code: "custom", path: ["fim"], message: "Fim antes do início" });
    if ((c.status === "cancelado") !== (c.motivoCancelamento !== null))
      ctx.addIssue({ code: "custom", path: ["motivoCancelamento"], message: "Motivo só (e sempre) quando cancelado" });
    if ((c.tipo === "locacao") !== (c.taxaAdministracao !== null))
      ctx.addIssue({ code: "custom", path: ["taxaAdministracao"], message: "Taxa de administração só em locação" });
    c.parcelas.forEach((p, i) => {
      if (p.numero !== i + 1)
        ctx.addIssue({ code: "custom", path: ["parcelas", i, "numero"], message: "Parcelas numeradas 1…n" });
    });
  });
export type Contrato = z.infer<typeof contratoSchema>;

/** Status de parcela: **derivado**, nunca armazenado (MODELO §2 Parcela, ESTADOS §3.4). */
export type StatusParcela = "pago" | "atrasado" | "aVencer" | "cancelada";
/** Status exibido/filtrável (RF-41): o armazenado + `inadimplente`, que é derivado. */
export type StatusExibicaoContrato = StatusContrato | "inadimplente";
