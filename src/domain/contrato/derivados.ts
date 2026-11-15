/**
 * Estados derivados do contrato (ESTADOS-E-FLUXOS §2 regra 5, §3.4): calculados, nunca gravados.
 */
import { dataLocal } from "../comum/tipos";
import type { Contrato, Parcela, StatusExibicaoContrato, StatusParcela } from "./schema";

/** `hoje` em `AAAA-MM-DD` (use `dataLocal(agora)`). */
export function statusParcela(contrato: Pick<Contrato, "status">, parcela: Parcela, hoje: string): StatusParcela {
  if (parcela.pagoEm) return "pago";
  if (contrato.status === "cancelado") return "cancelada"; // parcelas futuras deixam de valer
  return dataLocal(hoje) > parcela.vencimento ? "atrasado" : "aVencer";
}

export function diasDeAtraso(parcela: Parcela, hoje: string): number {
  if (parcela.pagoEm) return 0;
  const ms = Date.parse(`${dataLocal(hoje)}T00:00:00Z`) - Date.parse(`${parcela.vencimento}T00:00:00Z`);
  return Math.max(0, Math.round(ms / 86_400_000));
}

export function parcelasAtrasadas(contrato: Contrato, hoje: string): Parcela[] {
  return contrato.parcelas.filter((p) => statusParcela(contrato, p, hoje) === "atrasado");
}

/** Inadimplente = `ativo` com ao menos uma parcela atrasada (invariante 5, RF-41). */
export function estaInadimplente(contrato: Contrato, hoje: string): boolean {
  return contrato.status === "ativo" && parcelasAtrasadas(contrato, hoje).length > 0;
}

export function statusExibicao(contrato: Contrato, hoje: string): StatusExibicaoContrato {
  return estaInadimplente(contrato, hoje) ? "inadimplente" : contrato.status;
}

/** Próxima parcela em aberto (RF-40, RF-14). */
export function proximoVencimento(contrato: Contrato): Parcela | null {
  if (contrato.status !== "ativo") return null;
  return contrato.parcelas.find((p) => !p.pagoEm) ?? null;
}

/** Repasse ao proprietário de uma parcela de locação (RF-46). */
export function repasse(contrato: Contrato, parcela: Parcela): number {
  if (contrato.tipo !== "locacao" || contrato.taxaAdministracao === null) return 0;
  return parcela.valor - Math.round((parcela.valor * contrato.taxaAdministracao) / 100);
}
