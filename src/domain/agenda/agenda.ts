/**
 * Agenda (RF-73): visitas e vencimentos de parcelas agrupados por dia, pelo relógio do mock.
 * Derivada, nunca armazenada. As ações da visita vêm de `transicoesPermitidasVisita`.
 */
import type { Base } from "../comum/base";
import { dataLocal } from "../comum/tipos";
import { statusParcela } from "../contrato/derivados";
import type { Parcela, StatusParcela } from "../contrato/schema";
import { transicoesPermitidasVisita } from "../visita/estado";
import type { StatusVisita, Visita } from "../visita/schema";

export type TipoItemAgenda = "visita" | "vencimento";
export const TIPOS_ITEM_AGENDA: readonly TipoItemAgenda[] = ["visita", "vencimento"];

export type ItemAgenda =
  | { tipo: "visita"; quando: string; visita: Visita; transicoes: { para: StatusVisita }[] }
  | {
      tipo: "vencimento";
      quando: string;
      contratoId: string;
      numeroContrato: string;
      imovelId: string;
      parcela: Parcela;
      status: StatusParcela;
    };

export type DiaAgenda = { data: string; itens: ItemAgenda[] };

export type FiltrosAgenda = {
  /** Padrão: os dois. */
  tipos?: readonly TipoItemAgenda[];
  /** Quantos dias a partir de hoje, inclusive (1 = só hoje). Padrão 7. */
  dias?: number;
  /** Visitas do corretor e vencimentos dos imóveis dele. */
  responsavelId?: string;
};

const DIA = 86_400_000;

/** `hoje` = instante ISO. Dias sem item não aparecem; itens do dia em ordem de horário. */
export function agendaDoPeriodo(
  base: Pick<Base, "visitas" | "contratos" | "imoveis">,
  hoje: string,
  filtros: FiltrosAgenda = {},
): DiaAgenda[] {
  const tipos = filtros.tipos?.length ? filtros.tipos : TIPOS_ITEM_AGENDA;
  const dias = Math.max(1, Math.floor(filtros.dias ?? 7));
  const inicio = dataLocal(hoje);
  const fim = dataLocal(new Date(Date.parse(hoje) + (dias - 1) * DIA).toISOString());
  const dentro = (data: string) => data >= inicio && data <= fim;
  const corretorDoImovel = new Map(base.imoveis.map((i) => [i.id, i.corretorId]));
  const itens: ItemAgenda[] = [];

  if (tipos.includes("visita"))
    for (const v of base.visitas)
      if (dentro(dataLocal(v.dataHora)) && (!filtros.responsavelId || v.corretorId === filtros.responsavelId))
        itens.push({ tipo: "visita", quando: v.dataHora, visita: v, transicoes: transicoesPermitidasVisita(v) });

  if (tipos.includes("vencimento"))
    for (const c of base.contratos) {
      if (c.status !== "ativo") continue;
      if (filtros.responsavelId && corretorDoImovel.get(c.imovelId) !== filtros.responsavelId) continue;
      for (const p of c.parcelas)
        if (!p.pagoEm && dentro(p.vencimento))
          itens.push({
            tipo: "vencimento",
            quando: p.vencimento,
            contratoId: c.id,
            numeroContrato: c.numero,
            imovelId: c.imovelId,
            parcela: p,
            status: statusParcela(c, p, hoje),
          });
    }

  const porDia = new Map<string, ItemAgenda[]>();
  for (const i of itens) {
    const d = i.tipo === "visita" ? dataLocal(i.quando) : i.quando;
    porDia.set(d, [...(porDia.get(d) ?? []), i]);
  }
  // Vencimento (só data) vem antes das visitas do dia.
  const chave = (i: ItemAgenda) => (i.tipo === "vencimento" ? "" : i.quando);
  return [...porDia]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([data, lista]) => ({ data, itens: lista.sort((a, b) => chave(a).localeCompare(chave(b))) }));
}

export type ResumoAgenda = {
  /** Visitas que ainda contam: agendadas ou realizadas (canceladas e não comparecimentos ficam de fora). */
  visitas: number;
  vencimentos: number;
  /** Soma dos vencimentos em aberto do período, em centavos. */
  aReceber: number;
  /** Visitas que contam, por corretor, da maior para a menor. */
  porCorretor: { corretorId: string; visitas: number }[];
};

const VISITA_CONTA: Readonly<Record<StatusVisita, boolean>> = {
  agendada: true,
  realizada: true,
  cancelada: false,
  naoCompareceu: false,
};

/** Totais do período da Agenda (RF-73) a partir de `agendaDoPeriodo`. */
export function resumoAgenda(dias: readonly DiaAgenda[]): ResumoAgenda {
  const porCorretor = new Map<string, number>();
  let visitas = 0;
  let vencimentos = 0;
  let aReceber = 0;
  for (const i of dias.flatMap((d) => d.itens)) {
    if (i.tipo === "visita") {
      if (!VISITA_CONTA[i.visita.status]) continue;
      visitas += 1;
      porCorretor.set(i.visita.corretorId, (porCorretor.get(i.visita.corretorId) ?? 0) + 1);
    } else {
      vencimentos += 1;
      aReceber += i.parcela.valor;
    }
  }
  return {
    visitas,
    vencimentos,
    aReceber,
    porCorretor: [...porCorretor].map(([corretorId, n]) => ({ corretorId, visitas: n })).sort((a, z) => z.visitas - a.visitas),
  };
}
