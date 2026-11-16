import { describe, expect, it } from "vitest";
import { agendaDoPeriodo, resumoAgenda } from "../agenda/agenda";
import { calcularRelatorios } from "../metricas/relatorios";
import { baseMinima, contrato, contratoLocacao, corretor, despesa, imovel, negociacao, visita } from "../teste/fabrica";
import { linhasComissao, linhasReceita, linhasRepasse } from "./listas";

const HOJE = "2026-03-15T15:00:00.000Z";

const base = baseMinima({
  corretores: [corretor(), corretor({ id: "cor_b", nome: "Beto Teste", email: "b@example.com", papel: "corretor" })],
  imoveis: [
    imovel({ status: "alugado", finalidade: "locacao" }),
    imovel({ id: "imv_b", codigo: "AT-0002", status: "vendido", corretorId: "cor_b" }),
  ],
  negociacoes: [
    negociacao({ id: "neg_a", criadoEm: "2026-03-02T12:00:00.000Z" }),
    negociacao({ id: "neg_b", imovelId: "imv_b", etapa: "fechado", criadoEm: "2026-03-03T12:00:00.000Z" }),
  ],
  visitas: [
    visita({ id: "vis_a", status: "agendada", dataHora: "2026-03-16T13:00:00.000Z" }),
    visita({ id: "vis_b", status: "agendada", dataHora: "2026-03-30T13:00:00.000Z" }),
    visita({ id: "vis_c", status: "realizada", dataHora: "2026-03-05T13:00:00.000Z" }),
  ],
  despesas: [despesa({ id: "dsp_a", valor: 10_000, vencimento: "2026-03-05", pagaEm: "2026-03-05T15:00:00.000Z" })],
  contratos: [
    contratoLocacao({
      status: "ativo",
      inicio: "2026-01-10",
      fim: "2027-01-10",
      taxaAdministracao: 10,
      parcelas: [
        { numero: 1, vencimento: "2026-02-10", valor: 300_000, pagoEm: "2026-02-10T15:00:00.000Z" },
        { numero: 2, vencimento: "2026-03-10", valor: 300_000, pagoEm: null },
        { numero: 3, vencimento: "2026-03-17", valor: 300_000, pagoEm: null },
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
          corretorId: "cor_b",
          percentual: 6,
          base: 30_000_000,
          valor: 1_800_000,
          competencia: "2026-03",
          pagaEm: null,
        },
      ],
    }),
    contrato({
      id: "ctr_c",
      numero: "CT-2026-0003",
      imovelId: "imv_b",
      status: "rascunho",
      parcelas: [],
      comissoes: [],
    }),
  ],
});

describe("listas do financeiro (RF-77, RF-79, RF-80)", () => {
  it("receitas: parcelas dos contratos assinados com status derivado e podePagar", () => {
    const r = linhasReceita(base, HOJE);
    expect(r.map((l) => l.contratoId)).not.toContain("ctr_c");
    const atrasada = r.find((l) => l.numero === 2 && l.contratoId !== "ctr_b")!;
    expect(atrasada).toMatchObject({ status: "atrasado", diasAtraso: 5, podePagar: { ok: true } });
    expect(r.find((l) => l.contratoId === "ctr_b")!.podePagar.ok).toBe(false);
  });

  it("comissões: só ativo/encerrado, com índice e podePagar", () => {
    const m = linhasComissao(base);
    expect(m).toHaveLength(2);
    expect(m.every((x) => x.indice === 0 && x.status === "pendente")).toBe(true);
  });

  it("repasses: um por aluguel pago, com mês e taxa", () => {
    expect(linhasRepasse(base)).toEqual([
      expect.objectContaining({ mes: "2026-02", aluguel: 300_000, repasse: 270_000, taxaAdministracao: 10 }),
    ]);
  });
});

describe("agenda (RF-73)", () => {
  it("7 dias: visita agendada com transições e vencimento do contrato ativo, por dia", () => {
    const dias = agendaDoPeriodo(base, HOJE);
    const itens = dias.flatMap((d) => d.itens);
    expect(itens.map((i) => i.tipo)).toEqual(["visita", "vencimento"]);
    const v = itens[0]!;
    if (v.tipo === "visita") expect(v.transicoes.map((t) => t.para)).toContain("realizada");
    expect(agendaDoPeriodo(base, HOJE, { dias: 30 }).flatMap((d) => d.itens)).toHaveLength(3);
    expect(
      agendaDoPeriodo(base, HOJE, { tipos: ["vencimento"], dias: 30 }).every((d) =>
        d.itens.every((i) => i.tipo === "vencimento"),
      ),
    ).toBe(true);
  });
});

describe("resumo da agenda (RF-73)", () => {
  it("conta só visitas agendadas ou realizadas e soma os vencimentos em aberto", () => {
    const comCancelada = {
      ...base,
      visitas: [
        ...base.visitas,
        visita({ id: "vis_d", status: "cancelada", dataHora: "2026-03-17T13:00:00.000Z" }),
        visita({ id: "vis_e", status: "naoCompareceu", dataHora: "2026-03-18T13:00:00.000Z" }),
      ],
    };
    const dias = agendaDoPeriodo(comCancelada, HOJE);
    const r = resumoAgenda(dias);
    expect(r.visitas).toBe(1);
    expect(r.porCorretor).toEqual([{ corretorId: "cor_a", visitas: 1 }]);
    const vencimentos = dias.flatMap((d) => d.itens).filter((i) => i.tipo === "vencimento");
    expect(r.vencimentos).toBe(vencimentos.length);
    expect(r.aReceber).toBe(vencimentos.reduce((s, i) => s + (i.tipo === "vencimento" ? i.parcela.valor : 0), 0));
  });
});

describe("relatórios (RF-82)", () => {
  it("cinco relatórios do mês, com filtro por corretor", () => {
    const r = calcularRelatorios(base, { periodo: "mesAtual" }, HOJE);
    expect(r.meses).toEqual(["2026-03"]);
    expect(r.vendasPorPeriodo).toEqual([{ mes: "2026-03", quantidade: 1, valor: 30_000_000 }]);
    expect(r.receitaPorPeriodo[0]).toMatchObject({ vendas: 30_000_000, locacoes: 0, despesas: 10_000 });
    expect(r.receitaPorPeriodo[0]!.resultado).toBe(30_000_000 - 10_000);
    expect(r.conversaoLeads.total).toBe(2);
    expect(r.imoveisMaisProcurados[0]).toMatchObject({ imovelId: "imv_a" });
    const soB = calcularRelatorios(base, { periodo: "mesAtual", corretorId: "cor_b" }, HOJE);
    expect(soB.desempenhoCorretores.map((d) => d.corretorId)).toEqual(["cor_b"]);
    // "Mais procurados" com corretor: só negociações/visitas sob a responsabilidade dele.
    expect(soB.imoveisMaisProcurados).toEqual([]);
    const comB = calcularRelatorios(
      {
        ...base,
        negociacoes: [
          ...base.negociacoes,
          negociacao({ id: "neg_c", responsavelId: "cor_b", criadoEm: "2026-03-04T12:00:00.000Z" }),
        ],
      },
      { periodo: "mesAtual", corretorId: "cor_b" },
      HOJE,
    );
    expect(comB.imoveisMaisProcurados).toEqual([
      expect.objectContaining({ imovelId: "imv_a", negociacoes: 1, visitas: 0 }),
    ]);
    expect(soB.desempenhoCorretores[0]).toMatchObject({
      contratosFechados: 1,
      receita: 30_000_000,
      comissao: 1_800_000,
    });
  });
});
