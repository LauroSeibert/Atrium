import { describe, expect, it } from "vitest";
import { baseMinima, contrato, contratoLocacao, corretor, imovel, lead, visita } from "../teste/fabrica";
import {
  calcularDashboard,
  calcularFinanceiro,
  funilDeLeads,
  mesesDoPeriodo,
  metaRealizado,
  metricaDoMes,
  metricasMensais,
  proximosCompromissos,
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
    lead({ id: "lead_a", etapa: "novo", criadoEm: "2026-03-02T12:00:00.000Z" }),
    lead({ id: "lead_b", etapa: "visita", ordem: 0, criadoEm: "2026-02-10T12:00:00.000Z" }),
    lead({ id: "lead_c", etapa: "fechado", ordem: 0, criadoEm: "2026-01-10T12:00:00.000Z" }),
    lead({ id: "lead_d", etapa: "perdido", motivoPerda: "preco", ordem: 0 }),
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

  it("funil: conversão acumulada, sem divisão por zero", () => {
    const f = funilDeLeads(base);
    expect(f.find((x) => x.etapa === "novo")).toEqual({ etapa: "novo", quantidade: 1, conversao: 2 / 3 });
    expect(f.find((x) => x.etapa === "fechado")!.conversao).toBeNull();
    expect(funilDeLeads(baseMinima({ leads: [] })).every((x) => x.conversao === null)).toBe(true);
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

  it("dashboard monta KPIs com anterior e tendência", () => {
    const d = calcularDashboard(base, "mesAtual", HOJE);
    expect(d.kpis.receita).toMatchObject({ valor: 30_000_000, anterior: 300_000 });
    expect(d.kpis.receita.tendencia).toHaveLength(12);
    expect(d.kpis.visitasProximas.valor).toBe(1);
    expect(d.kpis.leadsNovos).toMatchObject({ valor: 1, anterior: 1 });
  });
});
