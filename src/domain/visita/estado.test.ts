import { describe, expect, it } from "vitest";
import { OperacaoInvalida, TransicaoInvalida } from "../comum/tipos";
import { baseMinima, CTX, CTX_DEPOIS, imovel, lead, negociacao, visita } from "../teste/fabrica";
import { STATUS_VISITA } from "./schema";
import {
  TRANSICOES_VISITA,
  agendarVisita,
  podeAgendarVisita,
  podeTransicionarVisita,
  transicionarVisita,
  transicoesPermitidasVisita,
} from "./estado";

const nova = (over = {}) => ({
  imovelId: "imv_a",
  leadId: "lead_a",
  corretorId: "cor_a",
  dataHora: "2026-11-20T13:00:00.000Z",
  ...over,
});

describe("visita: tabela TRANSICOES_VISITA (RF-14, RF-37)", () => {
  const combos = STATUS_VISITA.flatMap((de) => STATUS_VISITA.map((para) => [de, para] as const));

  it.each(combos)("%s → %s", (de, para) => {
    const permitida = TRANSICOES_VISITA[de].includes(para);
    const v = visita({ status: de });
    const base = baseMinima({ visitas: [v] });
    expect(podeTransicionarVisita(v, para).ok).toBe(permitida);
    if (permitida) expect(transicionarVisita(base, v.id, para, CTX).resultado.status).toBe(para);
    else expect(() => transicionarVisita(base, v.id, para, CTX)).toThrow(TransicaoInvalida);
  });

  it("só agendada sai; as demais são terminais", () => {
    expect(TRANSICOES_VISITA.agendada).toEqual(["realizada", "cancelada", "naoCompareceu"]);
    for (const s of ["realizada", "cancelada", "naoCompareceu"] as const) expect(TRANSICOES_VISITA[s]).toEqual([]);
  });

  it("visita inexistente lança OperacaoInvalida", () => {
    expect(() => transicionarVisita(baseMinima(), "vis_x", "realizada", CTX)).toThrow(OperacaoInvalida);
  });
});

describe("agendarVisita", () => {
  it("cria visita agendada e gera atividade (imoveisVistos só muda ao realizar)", () => {
    const m = agendarVisita(baseMinima(), nova(), CTX);
    expect(m.resultado).toMatchObject({ status: "agendada", imovelId: "imv_a", leadId: "lead_a" });
    expect(m.resultado.id).toMatch(/^vis_/);
    expect(m.base.visitas).toHaveLength(1);
    expect(m.base.leads[0]!.imoveisVistos).toEqual([]);
    expect(m.base.atividades).toHaveLength(1);
    expect(m.base.atividades[0]).toMatchObject({
      tipo: "visitaAgendada",
      alvo: { tipo: "lead", id: "lead_a" },
      relacionados: [{ tipo: "imovel", id: "imv_a" }],
      dados: { visitaId: m.resultado.id, dataHora: "2026-11-20T13:00:00.000Z" },
    });
  });

  it("não duplica imoveisVistos nem altera o lead quando o imóvel já consta", () => {
    const l = lead({ imoveisVistos: ["imv_a"] });
    const base = baseMinima({ leads: [l] });
    const m = agendarVisita(base, nova(), CTX);
    expect(m.base.leads).toEqual(base.leads);
  });

  it("no passado lança OperacaoInvalida; no instante atual é aceita", () => {
    expect(() => agendarVisita(baseMinima(), nova({ dataHora: "2026-11-14T12:59:59.000Z" }), CTX)).toThrow(
      OperacaoInvalida,
    );
    expect(agendarVisita(baseMinima(), nova({ dataHora: CTX.agora }), CTX).resultado.status).toBe("agendada");
  });

  it("lead só com negociações perdidas (ou sem nenhuma) lança OperacaoInvalida", () => {
    const perdida = negociacao({ etapa: "perdido", motivoPerda: "preco" });
    const base = baseMinima({ negociacoes: [perdida] });
    expect(podeAgendarVisita(base, "lead_a").ok).toBe(false);
    expect(() => agendarVisita(base, nova(), CTX)).toThrow("Lead sem negociação ativa não agenda visita.");
    // basta uma negociação não perdida (mesmo fechada ou em outro imóvel)
    const outra = negociacao({ id: "neg_b", imovelId: null, etapa: "fechado", motivoPerda: null });
    expect(
      podeAgendarVisita(baseMinima({ negociacoes: [perdida, { ...outra, imovelId: "imv_a" }] }), "lead_a").ok,
    ).toBe(true);
  });

  it("transicoesPermitidasVisita: só agendada tem ações", () => {
    expect(transicoesPermitidasVisita(visita()).map((t) => t.para)).toEqual([
      "realizada",
      "cancelada",
      "naoCompareceu",
    ]);
    expect(transicoesPermitidasVisita(visita({ status: "realizada" }))).toEqual([]);
  });

  it("lead ou imóvel inexistente lança OperacaoInvalida; dados inválidos lançam", () => {
    expect(() => agendarVisita(baseMinima(), nova({ leadId: "lead_x" }), CTX)).toThrow(OperacaoInvalida);
    expect(() => agendarVisita(baseMinima(), nova({ imovelId: "imv_x" }), CTX)).toThrow(OperacaoInvalida);
    expect(() => agendarVisita(baseMinima(), nova({ dataHora: "amanhã" }), CTX)).toThrow();
  });

  it("não é fluxo monitorado: sem registro de alteração; desfazer reverte tudo", () => {
    const base = baseMinima({ imoveis: [imovel()] });
    const m = agendarVisita(base, nova(), CTX);
    expect(m.base.alteracoes).toEqual([]);
    const d = m.desfazer(m.base, CTX_DEPOIS);
    expect(d.base.visitas).toEqual([]);
    expect(d.base.leads).toEqual(base.leads);
    expect(d.base.atividades).toEqual([]);
  });
});

describe("transicionarVisita: efeitos", () => {
  const base = () => baseMinima({ visitas: [visita()] });

  it("realizar gera atividade visitaRealizada", () => {
    const m = transicionarVisita(base(), "vis_a", "realizada", CTX);
    expect(m.base.atividades).toHaveLength(1);
    expect(m.base.atividades[0]).toMatchObject({
      tipo: "visitaRealizada",
      alvo: { tipo: "lead", id: "lead_a" },
      relacionados: [{ tipo: "imovel", id: "imv_a" }],
      dados: { visitaId: "vis_a" },
    });
  });

  it("cancelar gera atividade visitaCancelada", () => {
    const m = transicionarVisita(base(), "vis_a", "cancelada", CTX);
    expect(m.base.atividades[0]).toMatchObject({ tipo: "visitaCancelada", dados: { visitaId: "vis_a" } });
  });

  it("naoCompareceu muda o status sem gerar atividade", () => {
    const m = transicionarVisita(base(), "vis_a", "naoCompareceu", CTX);
    expect(m.resultado.status).toBe("naoCompareceu");
    expect(m.base.atividades).toEqual([]);
  });

  it("desfazer volta a agendada e remove a atividade", () => {
    const b = base();
    const m = transicionarVisita(b, "vis_a", "realizada", CTX);
    const d = m.desfazer(m.base, CTX_DEPOIS);
    expect(d.base.visitas).toEqual(b.visitas);
    expect(d.base.atividades).toEqual([]);
  });
});

describe("visita: auditoria do Gate 5", () => {
  it("compara instantes, não strings: fuso +05:00 no passado é recusado", () => {
    expect(() => agendarVisita(baseMinima(), nova({ dataHora: "2026-11-14T15:00:00.000+05:00" }), CTX)).toThrow(
      OperacaoInvalida,
    );
    expect(agendarVisita(baseMinima(), nova({ dataHora: "2026-11-14T11:00:00.000-03:00" }), CTX).resultado.status).toBe(
      "agendada",
    );
  });

  it("realizar a visita registra o imóvel em imoveisVistos", () => {
    const b = agendarVisita(baseMinima(), nova(), CTX);
    const m = transicionarVisita(b.base, b.resultado.id, "realizada", CTX);
    expect(m.base.leads[0]!.imoveisVistos).toEqual(["imv_a"]);
  });
});
