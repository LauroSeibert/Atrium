import { describe, expect, it } from "vitest";
import {
  baseMinima,
  contrato,
  contratoLocacao,
  corretor,
  despesa,
  imovel,
  lead,
  negociacao,
  visita,
} from "../teste/fabrica";
import {
  calcularDashboard,
  calcularFinanceiro,
  etapaDaPerda,
  funilDeNegociacoes,
  mesesDoPeriodo,
  metaRealizado,
  metricaDoMes,
  metricasMensais,
  proximosCompromissos,
  statusImovelEm,
  type MetricaMensal,
} from "./metricas";

const HOJE = "2026-03-15T15:00:00.000Z";

/** Cenário pequeno com resultado calculado à mão (fixture da MetricaMensal, MODELO §2). */
const base = baseMinima({
  corretores: [
    corretor({ metaMensal: 1_000_000 }),
    corretor({ id: "cor_b", nome: "Beto Teste", email: "b@example.com", metaMensal: 0 }),
  ],
  imoveis: [
    imovel({ status: "alugado", finalidade: "locacao" }),
    imovel({ id: "imv_b", codigo: "AT-0002", status: "vendido" }),
  ],
  leads: [
    lead({ id: "lead_a", criadoEm: "2026-03-02T12:00:00.000Z" }),
    lead({ id: "lead_b", criadoEm: "2026-02-10T12:00:00.000Z" }),
    lead({ id: "lead_c", criadoEm: "2026-01-10T12:00:00.000Z" }),
    lead({ id: "lead_d" }),
  ],
  negociacoes: [
    negociacao({ id: "neg_a", leadId: "lead_a" }),
    negociacao({ id: "neg_b", leadId: "lead_b", etapa: "visita" }),
    negociacao({ id: "neg_c", leadId: "lead_c", etapa: "fechado", imovelId: "imv_b" }),
    negociacao({ id: "neg_d", leadId: "lead_d", etapa: "perdido", motivoPerda: "preco" }),
  ],
  despesas: [
    despesa({ id: "dsp_a", valor: 100_000, vencimento: "2026-03-05", pagaEm: "2026-03-05T15:00:00.000Z" }),
    despesa({ id: "dsp_b", valor: 50_000, vencimento: "2026-03-10" }), // atrasada
    despesa({ id: "dsp_c", valor: 20_000, vencimento: "2026-03-28" }), // a pagar no mês
    despesa({ id: "dsp_d", valor: 70_000, vencimento: "2026-02-01", pagaEm: "2026-02-01T15:00:00.000Z" }),
  ],
  visitas: [
    visita({ id: "vis_a", status: "realizada", dataHora: "2026-03-05T13:00:00.000Z" }),
    visita({ id: "vis_b", status: "cancelada", dataHora: "2026-03-06T13:00:00.000Z" }),
    visita({ id: "vis_c", status: "agendada", dataHora: "2026-03-18T13:00:00.000Z" }),
  ],
  contratos: [
    contratoLocacao({
      status: "ativo",
      inicio: "2026-01-10",
      fim: "2026-07-10",
      parcelas: [
        { numero: 1, vencimento: "2026-01-10", valor: 300_000, pagoEm: "2026-01-10T15:00:00.000Z" },
        { numero: 2, vencimento: "2026-02-10", valor: 300_000, pagoEm: "2026-03-01T02:00:00.000Z" }, // 28/02 23h em SP
        { numero: 3, vencimento: "2026-03-10", valor: 300_000, pagoEm: null }, // atrasada 5 dias
        { numero: 4, vencimento: "2026-03-20", valor: 300_000, pagoEm: null }, // a vencer, nos próximos 7 dias
      ],
      comissoes: [
        { corretorId: "cor_a", percentual: 10, base: 300_000, valor: 30_000, competencia: "2026-01", pagaEm: null },
      ],
    }),
    contrato({
      id: "ctr_b",
      numero: "CT-2026-0002",
      imovelId: "imv_b",
      status: "encerrado",
      inicio: "2026-03-01",
      fim: "2026-03-10",
      parcelas: [{ numero: 1, vencimento: "2026-03-01", valor: 30_000_000, pagoEm: "2026-03-02T12:00:00.000Z" }],
      comissoes: [
        {
          corretorId: "cor_a",
          percentual: 6,
          base: 30_000_000,
          valor: 1_800_000,
          competencia: "2026-03",
          pagaEm: null,
        },
      ],
    }),
  ],
});

describe("métricas derivadas", () => {
  it("metricaDoMes bate com o cálculo à mão (fuso de São Paulo)", () => {
    expect(metricaDoMes(base, "2026-03")).toEqual<MetricaMensal>({
      mes: "2026-03",
      receitaVendas: 30_000_000,
      receitaLocacoes: 0, // a parcela paga 01/03 02h UTC é 28/02 em São Paulo
      comissoes: 1_800_000,
      leadsNovos: 1,
      visitas: 2, // cancelada não conta
      contratosFechados: 1,
    });
    expect(metricaDoMes(base, "2026-02").receitaLocacoes).toBe(300_000);
  });

  it("série de 12 meses termina no mês de hoje", () => {
    const s = metricasMensais(base, HOJE);
    expect(s).toHaveLength(12);
    expect(s.at(-1)!.mes).toBe("2026-03");
    expect(s[0]!.mes).toBe("2025-04");
  });

  it("períodos e período anterior equivalente", () => {
    expect(mesesDoPeriodo("mesAtual", HOJE)).toEqual({ atual: ["2026-03"], anterior: ["2026-02"] });
    expect(mesesDoPeriodo("mesAnterior", HOJE)).toEqual({ atual: ["2026-02"], anterior: ["2026-01"] });
    expect(mesesDoPeriodo("ultimos3", HOJE).anterior).toEqual(["2025-10", "2025-11", "2025-12"]);
  });

  it("funil de negociações: conversão acumulada, sem divisão por zero", () => {
    const f = funilDeNegociacoes(base);
    // neg_d perdida sem registro conta como perdida em "novo": 2 de 4 avançaram.
    expect(f.find((x) => x.etapa === "novo")).toEqual({ etapa: "novo", quantidade: 1, perdidos: 1, conversao: 2 / 4 });
    expect(f.find((x) => x.etapa === "fechado")!.conversao).toBeNull();
    expect(funilDeNegociacoes(baseMinima({ negociacoes: [] })).every((x) => x.conversao === null)).toBe(true);
    // universo restrito e por responsável
    const so = funilDeNegociacoes(base, { negociacoes: base.negociacoes.slice(0, 1) });
    expect(so.find((x) => x.etapa === "novo")!.quantidade).toBe(1);
    expect(funilDeNegociacoes(base, { responsavelId: "cor_b" }).every((x) => x.quantidade === 0)).toBe(true);
  });

  it("KPI leads novos conta leads criados, não negociações", () => {
    expect(
      metricaDoMes(
        {
          ...base,
          negociacoes: [...base.negociacoes, negociacao({ id: "neg_z", criadoEm: "2026-03-03T12:00:00.000Z" })],
        },
        "2026-03",
      ).leadsNovos,
    ).toBe(1);
  });

  it("compromissos dos próximos 7 dias: visita agendada e parcela a vencer", () => {
    const c = proximosCompromissos(base, HOJE);
    expect(c.map((x) => x.tipo)).toEqual(["visita", "vencimento"]);
  });

  it("meta × realizado usa comissões do mês", () => {
    const m = metaRealizado(base, "2026-03");
    expect(m.porCorretor).toEqual([{ corretorId: "cor_a", meta: 1_000_000, receita: 1_800_000, contratos: 1 }]);
  });

  it("financeiro: recebido, a receber, inadimplência e faixas", () => {
    const f = calcularFinanceiro(base, "mesAtual", HOJE);
    expect(f.recebido).toBe(30_000_000);
    expect(f.aReceber).toBe(300_000);
    expect(f.inadimplencia.valor).toBe(300_000);
    expect(f.inadimplencia.percentual).toBeCloseTo(300_000 / 900_000);
    expect(f.atrasadasPorFaixa[0]).toEqual({ faixa: "1-30", quantidade: 1, valor: 300_000 });
    expect(f.repasses.find((r) => r.mes === "2026-02")).toEqual({ mes: "2026-02", aluguel: 300_000, repasse: 270_000 });
  });

  it("financeiro (RF-81): despesas do período e resultado = recebido − despesas pagas", () => {
    const f = calcularFinanceiro(base, "mesAtual", HOJE);
    expect(f.despesas).toEqual({ pagas: 100_000, aPagar: 70_000, atrasadas: { quantidade: 1, valor: 50_000 } });
    expect(f.resultado).toBe(30_000_000 - 100_000);
  });

  it("dashboard monta KPIs com anterior e tendência", () => {
    const d = calcularDashboard(base, "mesAtual", HOJE);
    expect(d.kpis.receita).toMatchObject({ valor: 30_000_000, anterior: 300_000 });
    expect(d.kpis.receita.tendencia).toHaveLength(12);
    expect(d.kpis.visitasProximas.valor).toBe(1);
    expect(d.kpis.leadsNovos).toMatchObject({ valor: 1, anterior: 1 });
  });

  it("funil: perdida conta na etapa em que estava (registro de alteração da negociação)", () => {
    const b = baseMinima({
      negociacoes: [
        negociacao({ id: "neg_a", etapa: "visita" }),
        negociacao({ id: "lead_b", etapa: "perdido", motivoPerda: "preco", imovelId: null }),
      ],
      alteracoes: [
        {
          id: "alt_1",
          em: "2026-03-01T12:00:00.000Z",
          autorId: "cor_a",
          entidade: { tipo: "negociacao", id: "lead_b" },
          campo: "etapa",
          de: "novo",
          para: "visita",
        },
        {
          id: "alt_2",
          em: "2026-03-02T12:00:00.000Z",
          autorId: "cor_a",
          entidade: { tipo: "negociacao", id: "lead_b" },
          campo: "etapa",
          de: "visita",
          para: "perdido",
        },
      ],
    });
    const f = funilDeNegociacoes(b);
    expect(etapaDaPerda(b, b.negociacoes[1]!)).toBe("visita");
    expect(etapaDaPerda(b, b.negociacoes[0]!)).toBeNull();
    expect(f.find((x) => x.etapa === "visita")).toEqual({ etapa: "visita", quantidade: 1, perdidos: 1, conversao: 0 });
    expect(f.find((x) => x.etapa === "contato")!.conversao).toBe(1);
    expect(f.find((x) => x.etapa === "perdido")!.perdidos).toBe(1);
  });

  it("imóveis ativos usam o status da época (registro de alteração)", () => {
    const b = baseMinima({
      imoveis: [imovel({ status: "vendido", criadoEm: "2025-12-01T12:00:00.000Z" })],
      alteracoes: [
        {
          id: "alt_1",
          em: "2026-03-10T12:00:00.000Z",
          autorId: "cor_a",
          entidade: { tipo: "imovel", id: "imv_a" },
          campo: "status",
          de: "disponivel",
          para: "vendido",
        },
      ],
    });
    const im = b.imoveis[0]!;
    expect(statusImovelEm(b, im, "2026-03-01T03:00:00.000Z")).toBe("disponivel");
    expect(statusImovelEm(b, im, "2026-04-01T03:00:00.000Z")).toBe("vendido");
    const d = calcularDashboard(b, "mesAtual", HOJE);
    expect(d.kpis.imoveisAtivos).toMatchObject({ valor: 0, anterior: 1 });
  });
});
