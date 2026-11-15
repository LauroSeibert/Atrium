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

export type ResumoCronograma = {
  total: number;
  pagas: number;
  recebido: number;
  atrasadas: number;
  emAtraso: number;
  /** Parcelas a vencer (nem pagas, nem atrasadas, nem canceladas). */
  qtdAReceber: number;
  aReceber: number;
};

/** Resumo do cronograma de parcelas (RF-42): pagas x de y, total recebido e em atraso. */
export function resumoCronograma(contrato: Contrato, hoje: string): ResumoCronograma {
  const r: ResumoCronograma = {
    total: contrato.parcelas.length,
    pagas: 0,
    recebido: 0,
    atrasadas: 0,
    emAtraso: 0,
    qtdAReceber: 0,
    aReceber: 0,
  };
  for (const p of contrato.parcelas) {
    const st = statusParcela(contrato, p, hoje);
    if (st === "pago") {
      r.pagas++;
      r.recebido += p.valor;
    } else if (st === "atrasado") {
      r.atrasadas++;
      r.emAtraso += p.valor;
    } else if (st === "aVencer") {
      r.qtdAReceber++;
      r.aReceber += p.valor;
    }
  }
  return r;
}

export type LinhaRepasse = { numero: number; vencimento: string; pagoEm: string; aluguel: number; repasse: number };

/**
 * Repasses ao proprietário (RF-46): um por aluguel já pago. `null` quando não se aplica (venda ou
 * locação sem taxa de administração), para a UI não decidir isso.
 */
export function repassesDoContrato(contrato: Contrato): LinhaRepasse[] | null {
  if (contrato.tipo !== "locacao" || contrato.taxaAdministracao === null) return null;
  return contrato.parcelas
    .filter((p): p is Parcela & { pagoEm: string } => p.pagoEm !== null)
    .map((p) => ({
      numero: p.numero,
      vencimento: p.vencimento,
      pagoEm: p.pagoEm,
      aluguel: p.valor,
      repasse: repasse(contrato, p),
    }));
}
