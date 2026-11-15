/**
 * Agregações do cronograma a partir dos status JÁ derivados pelo domínio (`statusParcela`, via
 * `fakeApi.getContrato`). Somar por status não decide regra nenhuma; só apresenta.
 */
import type { ResumoCronograma } from "@/domain";
import type { Parcela, StatusParcela } from "@/domain";

export type ParcelaComStatus = Parcela & { status: StatusParcela };

export type IndicadoresContrato = ResumoCronograma & { aReceber: number; qtdAReceber: number };

export function indicadoresDasParcelas(parcelas: readonly ParcelaComStatus[]): IndicadoresContrato {
  const r: IndicadoresContrato = {
    total: parcelas.length,
    pagas: 0,
    recebido: 0,
    atrasadas: 0,
    emAtraso: 0,
    aReceber: 0,
    qtdAReceber: 0,
  };
  const somar: Record<StatusParcela, (p: Parcela) => void> = {
    pago: (p) => {
      r.pagas++;
      r.recebido += p.valor;
    },
    atrasado: (p) => {
      r.atrasadas++;
      r.emAtraso += p.valor;
    },
    aVencer: (p) => {
      r.qtdAReceber++;
      r.aReceber += p.valor;
    },
    cancelada: () => {},
  };
  for (const p of parcelas) somar[p.status](p);
  return r;
}
