/**
 * Métricas derivadas (MODELO §2 MetricaMensal, ESTADOS §2 regra 5): calculadas na consulta a
 * partir de contratos, parcelas, comissões, leads e visitas — nunca armazenadas.
 * RF-10…16 (dashboard) e RF-44…46 (financeiro).
 */
import type { Atividade } from "../atividade/schema";
import type { Base } from "../comum/base";
import { dataLocal } from "../comum/tipos";
import { diasDeAtraso, repasse, statusParcela } from "../contrato/derivados";
import type { Contrato, Parcela } from "../contrato/schema";
import { statusDespesa } from "../despesa/operacoes";
import { ETAPAS, type Etapa, type Negociacao } from "../negociacao/schema";
import type { Imovel, StatusImovel } from "../imovel/schema";
import type { Visita } from "../visita/schema";

export type MetricaMensal = {
  mes: string;
  receitaVendas: number;
  receitaLocacoes: number;
  comissoes: number;
  leadsNovos: number;
  visitas: number;
  contratosFechados: number;
};

export type Periodo = "mesAtual" | "mesAnterior" | "ultimos3" | "ultimos12";
export const PERIODOS: readonly Periodo[] = ["mesAtual", "mesAnterior", "ultimos3", "ultimos12"];

export const mesDe = (iso: string) => dataLocal(iso).slice(0, 7);

export function somarMesesRef(mes: string, n: number): string {
  const [a, m] = mes.split("-").map(Number) as [number, number];
  const t = a * 12 + (m - 1) + n;
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, "0")}`;
}

/** Meses (AAAA-MM) do período e do período anterior equivalente, em ordem crescente. */
export function mesesDoPeriodo(periodo: Periodo, hoje: string): { atual: string[]; anterior: string[] } {
  const m = mesDe(hoje);
  const faixa = (fim: string, n: number) => Array.from({ length: n }, (_, i) => somarMesesRef(fim, i - n + 1));
  const [fim, n] =
    periodo === "mesAtual"
      ? [m, 1]
      : periodo === "mesAnterior"
        ? [somarMesesRef(m, -1), 1]
        : periodo === "ultimos3"
          ? [m, 3]
          : [m, 12];
  return { atual: faixa(fim, n), anterior: faixa(somarMesesRef(fim, -n), n) };
}

/** Parcelas pagas contam como receita em qualquer contrato assinado (inclusive cancelado depois). */
export const contaReceita = (c: Contrato) => c.status !== "rascunho";
/** Comissões e "contrato fechado" só de contratos ativos ou encerrados. */
export const contaComissao = (c: Contrato) => c.status === "ativo" || c.status === "encerrado";

export function metricaDoMes(base: Base, mes: string): MetricaMensal {
  let receitaVendas = 0;
  let receitaLocacoes = 0;
  let comissoes = 0;
  let contratosFechados = 0;
  for (const c of base.contratos) {
    if (contaReceita(c))
      for (const p of c.parcelas)
        if (p.pagoEm && mesDe(p.pagoEm) === mes) {
          if (c.tipo === "venda") receitaVendas += p.valor;
          else receitaLocacoes += p.valor;
        }
    if (contaComissao(c)) {
      for (const m of c.comissoes) if (m.competencia === mes) comissoes += m.valor;
      if (c.inicio.slice(0, 7) === mes) contratosFechados++;
    }
  }
  return {
    mes,
    receitaVendas,
    receitaLocacoes,
    comissoes,
    leadsNovos: base.leads.filter((l) => mesDe(l.criadoEm) === mes).length,
    visitas: base.visitas.filter((v) => v.status !== "cancelada" && mesDe(v.dataHora) === mes).length,
    contratosFechados,
  };
}

export function metricasMensais(base: Base, hoje: string, meses = 12): MetricaMensal[] {
  const fim = mesDe(hoje);
  return Array.from({ length: meses }, (_, i) => metricaDoMes(base, somarMesesRef(fim, i - meses + 1)));
}

const soma = (ms: MetricaMensal[], f: (m: MetricaMensal) => number) => ms.reduce((s, m) => s + f(m), 0);

export type Kpi = { valor: number; anterior: number; tendencia: number[] };
const kpi = (
  atual: MetricaMensal[],
  anterior: MetricaMensal[],
  serie: MetricaMensal[],
  f: (m: MetricaMensal) => number,
): Kpi => ({
  valor: soma(atual, f),
  anterior: soma(anterior, f),
  tendencia: serie.map(f),
});

const diaMs = 86_400_000;
const entre = (iso: string, ini: number, fim: number) => {
  const t = Date.parse(iso);
  return t >= ini && t < fim;
};

export type Compromisso =
  | { tipo: "visita"; quando: string; visita: Visita }
  | { tipo: "vencimento"; quando: string; contratoId: string; numero: string; parcela: Parcela };

/** RF-14: visitas agendadas e vencimentos de parcelas nos próximos `dias` dias. */
export function proximosCompromissos(base: Base, hoje: string, dias = 7): Compromisso[] {
  const ini = Date.parse(hoje);
  const fim = ini + dias * diaMs;
  const hojeData = dataLocal(hoje);
  const limite = dataLocal(new Date(fim).toISOString());
  const visitas: Compromisso[] = base.visitas
    .filter((v) => v.status === "agendada" && entre(v.dataHora, ini, fim))
    .map((v) => ({ tipo: "visita", quando: v.dataHora, visita: v }));
  const vencimentos: Compromisso[] = base.contratos
    .filter((c) => c.status === "ativo")
    .flatMap((c) =>
      c.parcelas
        .filter((p) => !p.pagoEm && p.vencimento >= hojeData && p.vencimento <= limite)
        .map((p) => ({
          tipo: "vencimento" as const,
          quando: p.vencimento,
          contratoId: c.id,
          numero: c.numero,
          parcela: p,
        })),
    );
  return [...visitas, ...vencimentos].sort((a, b) => a.quando.localeCompare(b.quando));
}

export type Funil = { etapa: Etapa; quantidade: number; perdidos: number; conversao: number | null }[];

/**
 * Etapa em que a negociação estava quando foi perdida: o `de` do último registro de alteração
 * `etapa → perdido` da negociação (ESTADOS §4). Empate de instante: vale o que vem depois no array.
 * Sem registro (dado legado), conta como `novo`.
 */
export function etapaDaPerda(base: Pick<Base, "alteracoes">, negociacao: Negociacao): Etapa | null {
  if (negociacao.etapa !== "perdido") return null;
  return indicePerdas(base).get(negociacao.id) ?? "novo";
}

function indicePerdas(base: Pick<Base, "alteracoes">): Map<string, Etapa> {
  const ultimo = new Map<string, { em: string; de: Etapa }>();
  for (const r of base.alteracoes)
    if (
      r.entidade.tipo === "negociacao" &&
      r.campo === "etapa" &&
      r.para === "perdido" &&
      typeof r.de === "string" &&
      r.de !== "perdido"
    ) {
      const atual = ultimo.get(r.entidade.id);
      if (!atual || r.em >= atual.em) ultimo.set(r.entidade.id, { em: r.em, de: r.de as Etapa });
    }
  return new Map([...ultimo].map(([id, v]) => [id, v.de]));
}

/**
 * RF-12 (funil de negociações): conversão = quem chegou à próxima etapa (ou além) ÷ quem chegou a esta (ou além).
 * Negociação perdida conta como tendo chegado à etapa em que estava ao ser perdida (`etapaDaPerda`)
 * e não além dela; assim a perda pesa na conversão daquela etapa (`perdidos`).
 * `negociacoes` restringe o universo (ex.: criadas no período, RF-82).
 */
export function funilDeNegociacoes(
  base: Pick<Base, "negociacoes" | "alteracoes">,
  opcoes: { responsavelId?: string; negociacoes?: readonly Negociacao[] } = {},
): Funil {
  const universo = opcoes.negociacoes ?? base.negociacoes;
  const lista = universo.filter((n) => !opcoes.responsavelId || n.responsavelId === opcoes.responsavelId);
  const fluxo: readonly Etapa[] = ETAPAS.filter((e) => e !== "perdido");
  const perdasIdx = indicePerdas(base);
  const perdas = lista.map((n) => (n.etapa === "perdido" ? (perdasIdx.get(n.id) ?? "novo") : null));
  const alcance = lista.map((n, i) => fluxo.indexOf(perdas[i] ?? n.etapa));
  const alcancou = (i: number) => alcance.filter((x) => x >= i).length;
  return ETAPAS.map((etapa) => {
    const i = fluxo.indexOf(etapa);
    const quantidade = lista.filter((n) => n.etapa === etapa).length;
    const perdidos = etapa === "perdido" ? quantidade : perdas.filter((p) => p === etapa).length;
    if (i === -1 || i === fluxo.length - 1) return { etapa, quantidade, perdidos, conversao: null };
    const base_ = alcancou(i);
    return { etapa, quantidade, perdidos, conversao: base_ ? alcancou(i + 1) / base_ : null };
  });
}

export type MetaCorretor = {
  corretorId: string;
  meta: number;
  receita: number;
  contratos: number;
};

/** RF-16: receita realizada = comissões do mês (receita da imobiliária); contratos = assinados no mês. */
export function metaRealizado(base: Base, mes: string): { total: MetaCorretor; porCorretor: MetaCorretor[] } {
  const porCorretor = base.corretores
    .filter((c) => c.ativo && c.metaMensal > 0)
    .map((cor) => {
      let receita = 0;
      let contratos = 0;
      for (const c of base.contratos) {
        if (!contaComissao(c)) continue;
        const minha = c.comissoes.filter((m) => m.corretorId === cor.id && m.competencia === mes);
        receita += minha.reduce((s, m) => s + m.valor, 0);
        if (minha.length && c.inicio.slice(0, 7) === mes) contratos++;
      }
      return { corretorId: cor.id, meta: cor.metaMensal, receita, contratos };
    });
  const total = porCorretor.reduce(
    (t, c) => ({ ...t, meta: t.meta + c.meta, receita: t.receita + c.receita, contratos: t.contratos + c.contratos }),
    { corretorId: "todos", meta: 0, receita: 0, contratos: 0 },
  );
  return { total, porCorretor };
}

export function atividadesRecentes(base: Base, limite = 10): Atividade[] {
  return [...base.atividades].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)).slice(0, limite);
}

/**
 * Status que o imóvel tinha no instante `iso`: parte do status atual e desfaz, do mais recente
 * para o mais antigo, os registros de alteração de `status` feitos a partir de `iso` (ESTADOS §4).
 * Usado pelo KPI de imóveis ativos (RF-10) para que o "anterior" e a tendência reflitam o passado.
 */
export function statusImovelEm(base: Pick<Base, "alteracoes">, imovel: Imovel, iso: string): StatusImovel {
  const t = Date.parse(iso);
  // Percorre do fim para o começo (ordem de gravação), o que também desempata instantes iguais.
  let st: StatusImovel = imovel.status;
  for (let k = base.alteracoes.length - 1; k >= 0; k--) {
    const r = base.alteracoes[k]!;
    if (r.entidade.tipo === "imovel" && r.entidade.id === imovel.id && r.campo === "status" && Date.parse(r.em) >= t)
      if (typeof r.de === "string") st = r.de as StatusImovel;
  }
  return st;
}

export type Dashboard = {
  periodo: Periodo;
  meses: string[];
  kpis: { imoveisAtivos: Kpi; leadsNovos: Kpi; visitasProximas: Kpi; receita: Kpi };
  receita12m: MetricaMensal[];
  funil: Funil;
  atividades: Atividade[];
  compromissos: Compromisso[];
  meta: ReturnType<typeof metaRealizado>;
};

/** RF-10…16. `hoje` = instante ISO. */
export function calcularDashboard(base: Base, periodo: Periodo, hoje: string): Dashboard {
  const { atual, anterior } = mesesDoPeriodo(periodo, hoje);
  const serie = metricasMensais(base, hoje, 12);
  const mAtual = atual.map((m) => metricaDoMes(base, m));
  const mAnterior = anterior.map((m) => metricaDoMes(base, m));
  const t = Date.parse(hoje);
  const fimDoMes = (mes: string) => `${somarMesesRef(mes, 1)}-01T03:00:00.000Z`; // 00h em São Paulo
  const ativosAte = (iso: string) =>
    base.imoveis.filter((i) => {
      if (i.criadoEm >= iso) return false;
      const st = statusImovelEm(base, i, iso);
      return st === "disponivel" || st === "reservado";
    }).length;
  const ultimo = atual[atual.length - 1]!;
  return {
    periodo,
    meses: atual,
    kpis: {
      imoveisAtivos: {
        valor: ativosAte(fimDoMes(ultimo)),
        anterior: ativosAte(fimDoMes(anterior[anterior.length - 1]!)),
        tendencia: serie.map((m) => ativosAte(fimDoMes(m.mes))),
      },
      leadsNovos: kpi(mAtual, mAnterior, serie, (m) => m.leadsNovos),
      visitasProximas: {
        valor: base.visitas.filter((v) => v.status === "agendada" && entre(v.dataHora, t, t + 7 * diaMs)).length,
        anterior: base.visitas.filter((v) => v.status !== "cancelada" && entre(v.dataHora, t - 7 * diaMs, t)).length,
        tendencia: serie.map((m) => m.visitas),
      },
      receita: kpi(mAtual, mAnterior, serie, (m) => m.receitaVendas + m.receitaLocacoes),
    },
    receita12m: serie,
    funil: funilDeNegociacoes(base),
    atividades: atividadesRecentes(base, 10),
    compromissos: proximosCompromissos(base, hoje, 7),
    meta: metaRealizado(base, mesDe(hoje)),
  };
}

export type Financeiro = {
  periodo: Periodo;
  recebido: number;
  aReceber: number;
  inadimplencia: { valor: number; percentual: number };
  comissoes: number;
  receitaPorMes: MetricaMensal[];
  comissoesPorCorretor: { corretorId: string; valor: number }[];
  atrasadasPorFaixa: { faixa: "1-30" | "31-60" | "60+"; quantidade: number; valor: number }[];
  repasses: { mes: string; aluguel: number; repasse: number }[];
  /** RF-81: despesas pagas no período, a pagar com vencimento no período e atrasadas (hoje). */
  despesas: { pagas: number; aPagar: number; atrasadas: { quantidade: number; valor: number } };
  /** RF-81: receitas recebidas − despesas pagas no período. */
  resultado: number;
};

/** RF-44…46. Inadimplência % = atrasado ÷ (atrasado + recebido) das parcelas vencidas de contratos ativos. */
export function calcularFinanceiro(base: Base, periodo: Periodo, hoje: string): Financeiro {
  const { atual } = mesesDoPeriodo(periodo, hoje);
  const noPeriodo = (iso: string) => atual.includes(mesDe(iso));
  let recebido = 0;
  let aReceber = 0;
  let atrasado = 0;
  let vencidoPago = 0;
  const faixas = { "1-30": [0, 0], "31-60": [0, 0], "60+": [0, 0] } as Record<
    "1-30" | "31-60" | "60+",
    [number, number]
  >;
  const comissoesPorCorretor = new Map<string, number>();
  let comissoes = 0;
  const repasses = new Map<string, { aluguel: number; repasse: number }>();

  for (const c of base.contratos) {
    for (const p of c.parcelas) {
      const st = statusParcela(c, p, hoje);
      if (p.pagoEm && noPeriodo(p.pagoEm) && contaReceita(c)) recebido += p.valor;
      if (st === "aVencer" && c.status === "ativo" && noPeriodo(p.vencimento)) aReceber += p.valor;
      if (c.status === "ativo" && p.vencimento < dataLocal(hoje)) {
        if (st === "atrasado") {
          atrasado += p.valor;
          const d = diasDeAtraso(p, hoje);
          const f = d <= 30 ? "1-30" : d <= 60 ? "31-60" : "60+";
          faixas[f][0]++;
          faixas[f][1] += p.valor;
        } else if (st === "pago") vencidoPago += p.valor;
      }
      if (c.tipo === "locacao" && p.pagoEm && contaReceita(c)) {
        const mes = mesDe(p.pagoEm);
        const r = repasses.get(mes) ?? { aluguel: 0, repasse: 0 };
        repasses.set(mes, { aluguel: r.aluguel + p.valor, repasse: r.repasse + repasse(c, p) });
      }
    }
    if (contaComissao(c))
      for (const m of c.comissoes)
        if (atual.includes(m.competencia)) {
          comissoes += m.valor;
          comissoesPorCorretor.set(m.corretorId, (comissoesPorCorretor.get(m.corretorId) ?? 0) + m.valor);
        }
  }
  const despesas = { pagas: 0, aPagar: 0, atrasadas: { quantidade: 0, valor: 0 } };
  for (const d of base.despesas) {
    const st = statusDespesa(d, hoje);
    if (d.pagaEm && noPeriodo(d.pagaEm)) despesas.pagas += d.valor;
    if (st !== "paga" && atual.includes(d.vencimento.slice(0, 7))) despesas.aPagar += d.valor;
    if (st === "atrasada") {
      despesas.atrasadas.quantidade++;
      despesas.atrasadas.valor += d.valor;
    }
  }
  const serie = metricasMensais(base, hoje, 12);
  return {
    periodo,
    despesas,
    resultado: recebido - despesas.pagas,
    recebido,
    aReceber,
    inadimplencia: { valor: atrasado, percentual: atrasado + vencidoPago ? atrasado / (atrasado + vencidoPago) : 0 },
    comissoes,
    receitaPorMes: serie,
    comissoesPorCorretor: [...comissoesPorCorretor]
      .map(([corretorId, valor]) => ({ corretorId, valor }))
      .sort((a, b) => b.valor - a.valor),
    atrasadasPorFaixa: (["1-30", "31-60", "60+"] as const).map((faixa) => ({
      faixa,
      quantidade: faixas[faixa][0],
      valor: faixas[faixa][1],
    })),
    repasses: serie.map((m) => ({ mes: m.mes, ...(repasses.get(m.mes) ?? { aluguel: 0, repasse: 0 }) })),
  };
}
