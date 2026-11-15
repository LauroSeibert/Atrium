import { describe, expect, it } from "vitest";
import { OperacaoInvalida, TransicaoInvalida } from "../comum/tipos";
import { baseMinima, contrato, CTX, CTX_DEPOIS, imovel, lead } from "../teste/fabrica";
import { ETAPAS, type Etapa, type Lead } from "./schema";
import {
  TRANSICOES_LEAD,
  adicionarNota,
  alterarOrcamento,
  contratosVinculaveis,
  criarLead,
  destinosLead,
  podeTransicionarLead,
  podeVincularContrato,
  temContratoVinculado,
  transicionarLead,
  transicoesPermitidasLead,
  vincularContrato,
} from "./estado";

const baseCom = (l: Lead, extra = {}) => baseMinima({ leads: [l], ...extra });
const ordens = (b: ReturnType<typeof baseMinima>, etapa: Etapa) =>
  b.leads
    .filter((l) => l.etapa === etapa)
    .sort((x, y) => x.ordem - y.ordem)
    .map((l) => [l.id, l.ordem]);

describe("lead: tabela de transições (RF-30, RF-31)", () => {
  const combos = ETAPAS.flatMap((de) => ETAPAS.map((para) => [de, para] as const));
  it("são 36 combinações; 30 entre etapas diferentes", () => {
    expect(combos).toHaveLength(36);
    expect(combos.filter(([de, para]) => de !== para)).toHaveLength(30);
  });

  it.each(combos.filter(([de, para]) => de !== para))("%s → %s é permitida (sem contrato)", (de, para) => {
    const l = lead({ etapa: de, motivoPerda: de === "perdido" ? "preco" : null });
    expect(TRANSICOES_LEAD[de]).toContain(para);
    expect(podeTransicionarLead(baseMinima(), l, para)).toEqual({ ok: true });
    const motivo = para === "perdido" ? ("outro" as const) : undefined;
    const m = transicionarLead(baseCom(l), { leadId: l.id, para, motivo }, CTX);
    expect(m.resultado.etapa).toBe(para);
  });

  it.each(ETAPAS)("%s → %s (mesma etapa) é negada", (e) => {
    const l = lead({ etapa: e, motivoPerda: e === "perdido" ? "preco" : null });
    expect(TRANSICOES_LEAD[e]).not.toContain(e);
    const p = podeTransicionarLead(baseMinima(), l, e);
    expect(p.ok).toBe(false);
  });
});

describe("lead: guards", () => {
  it("→ perdido sem motivo lança TransicaoInvalida", () => {
    const base = baseCom(lead());
    expect(() => transicionarLead(base, { leadId: "lead_a", para: "perdido" }, CTX)).toThrow(TransicaoInvalida);
  });

  it("→ perdido com motivo grava motivoPerda", () => {
    const m = transicionarLead(baseCom(lead()), { leadId: "lead_a", para: "perdido", motivo: "preco" }, CTX);
    expect(m.resultado.motivoPerda).toBe("preco");
    expect(m.base.leads[0]!.etapa).toBe("perdido");
  });

  it("sair de perdido limpa motivoPerda", () => {
    const base = baseCom(lead({ etapa: "perdido", motivoPerda: "preco" }));
    const m = transicionarLead(base, { leadId: "lead_a", para: "contato" }, CTX);
    expect(m.resultado.motivoPerda).toBeNull();
  });

  it("fechado com contrato vinculado não sai (pode e transicionar)", () => {
    const l = lead({ etapa: "fechado" });
    const base = baseMinima({ leads: [l], contratos: [contrato({ leadId: "lead_a" })] });
    const p = podeTransicionarLead(base, l, "contato");
    expect(p.ok).toBe(false);
    expect(temContratoVinculado(base, "lead_a")).toBe(true);
    expect(() => transicionarLead(base, { leadId: "lead_a", para: "contato" }, CTX)).toThrow(TransicaoInvalida);
    expect(base.leads[0]!.etapa).toBe("fechado");
  });

  it("fechado sem contrato vinculado sai normalmente", () => {
    const l = lead({ etapa: "fechado" });
    const base = baseMinima({ leads: [l], contratos: [contrato({ leadId: null })] });
    expect(podeTransicionarLead(base, l, "contato").ok).toBe(true);
  });

  it("lead inexistente lança OperacaoInvalida", () => {
    expect(() => transicionarLead(baseMinima(), { leadId: "lead_x", para: "contato" }, CTX)).toThrow(OperacaoInvalida);
  });
});

describe("lead: transicoesPermitidasLead e exigeMotivo (RF-32)", () => {
  it("lista todas as outras etapas; só perdido exige motivo", () => {
    const l = lead({ etapa: "contato" });
    const r = transicoesPermitidasLead(baseMinima(), l);
    expect(r.map((x) => x.para)).toEqual(ETAPAS.filter((e) => e !== "contato"));
    expect(r.filter((x) => x.exigeMotivo).map((x) => x.para)).toEqual(["perdido"]);
  });

  it("fechado com contrato: nenhuma transição", () => {
    const l = lead({ etapa: "fechado" });
    const base = baseMinima({ leads: [l], contratos: [contrato({ leadId: "lead_a" })] });
    expect(transicoesPermitidasLead(base, l)).toEqual([]);
  });
});

describe("lead: destinosLead e contratosVinculaveis (RF-31, RF-39)", () => {
  it("todas as outras etapas, com permissão e motivo; negadas trazem o motivo", () => {
    const l = lead({ etapa: "fechado" });
    const livre = destinosLead(baseMinima({ leads: [l] }), l);
    expect(livre.map((d) => d.etapa)).toEqual(ETAPAS.filter((e) => e !== "fechado"));
    expect(livre.every((d) => d.permissao.ok)).toBe(true);
    expect(livre.find((d) => d.etapa === "perdido")?.exigeMotivo).toBe(true);
    const preso = destinosLead(baseMinima({ leads: [l], contratos: [contrato({ leadId: "lead_a" })] }), l);
    expect(preso.every((d) => !d.permissao.ok)).toBe(true);
  });

  it("só contratos dos imóveis vistos, sem lead e não cancelados, para lead fechado", () => {
    const l = lead({ etapa: "fechado", imoveisVistos: ["imv_a"] });
    const base = baseMinima({
      leads: [l],
      contratos: [
        contrato({ id: "c1", leadId: null, imovelId: "imv_a" }),
        contrato({ id: "c2", leadId: null, imovelId: "imv_b" }),
        contrato({ id: "c3", leadId: null, imovelId: "imv_a", status: "cancelado" }),
      ],
    });
    expect(contratosVinculaveis(base, l).map((c) => c.id)).toEqual(["c1"]);
    expect(contratosVinculaveis(base, { ...l, etapa: "proposta" })).toEqual([]);
  });
});

describe("lead: ordem nas colunas (RF-39)", () => {
  const tres = () =>
    baseMinima({
      leads: [
        lead({ id: "lead_a", etapa: "contato", ordem: 0 }),
        lead({ id: "lead_b", etapa: "contato", ordem: 1 }),
        lead({ id: "lead_c", etapa: "contato", ordem: 2 }),
        lead({ id: "lead_d", etapa: "visita", ordem: 0 }),
        lead({ id: "lead_e", etapa: "visita", ordem: 1 }),
      ],
    });

  it("renumera 0…n na origem e no destino; posição pedida respeitada", () => {
    const m = transicionarLead(tres(), { leadId: "lead_a", para: "visita", ordem: 1 }, CTX);
    expect(ordens(m.base, "contato")).toEqual([
      ["lead_b", 0],
      ["lead_c", 1],
    ]);
    expect(ordens(m.base, "visita")).toEqual([
      ["lead_d", 0],
      ["lead_a", 1],
      ["lead_e", 2],
    ]);
  });

  it("sem ordem, entra no fim; ordem acima do tamanho é limitada", () => {
    const fim = transicionarLead(tres(), { leadId: "lead_a", para: "visita" }, CTX);
    expect(ordens(fim.base, "visita").at(-1)).toEqual(["lead_a", 2]);
    const alto = transicionarLead(tres(), { leadId: "lead_a", para: "visita", ordem: 99 }, CTX);
    expect(ordens(alto.base, "visita").at(-1)).toEqual(["lead_a", 2]);
    const neg = transicionarLead(tres(), { leadId: "lead_a", para: "visita", ordem: -5 }, CTX);
    expect(ordens(neg.base, "visita")[0]).toEqual(["lead_a", 0]);
  });

  it("reordenar na mesma etapa muda a ordem sem Atividade nem registro", () => {
    const m = transicionarLead(tres(), { leadId: "lead_c", para: "contato", ordem: 0 }, CTX);
    expect(ordens(m.base, "contato")).toEqual([
      ["lead_c", 0],
      ["lead_a", 1],
      ["lead_b", 2],
    ]);
    expect(m.base.atividades).toEqual([]);
    expect(m.base.alteracoes).toEqual([]);
  });
});

describe("lead: efeitos da transição", () => {
  it("Atividade etapaAlterada com de/para e motivo", () => {
    const m = transicionarLead(
      baseCom(lead({ etapa: "contato" })),
      { leadId: "lead_a", para: "perdido", motivo: "preco" },
      CTX,
    );
    expect(m.base.atividades).toHaveLength(1);
    expect(m.base.atividades[0]).toMatchObject({
      tipo: "etapaAlterada",
      alvo: { tipo: "lead", id: "lead_a" },
      autorId: CTX.autorId,
      criadoEm: CTX.agora,
      dados: { de: "contato", para: "perdido", motivo: "preco" },
    });
  });

  it("registro de alteração `etapa` com de/para/autor/em", () => {
    const m = transicionarLead(baseCom(lead({ etapa: "contato" })), { leadId: "lead_a", para: "visita" }, CTX);
    expect(m.base.alteracoes).toHaveLength(1);
    expect(m.base.alteracoes[0]).toMatchObject({
      campo: "etapa",
      de: "contato",
      para: "visita",
      autorId: CTX.autorId,
      em: CTX.agora,
      entidade: { tipo: "lead", id: "lead_a" },
    });
  });

  it("desfazer restaura lead, ordens, remove atividade e registra o inverso", () => {
    const base = baseCom(lead({ etapa: "contato" }));
    const m = transicionarLead(base, { leadId: "lead_a", para: "visita" }, CTX);
    const d = m.desfazer(m.base, CTX_DEPOIS);
    expect(d.base.leads).toEqual(base.leads);
    expect(d.base.atividades).toEqual([]);
    expect(d.base.alteracoes.at(-1)).toMatchObject({ campo: "etapa", de: "visita", para: "contato" });
  });
});

describe("criarLead (RF-35)", () => {
  const dados = {
    nome: "Maria Souza",
    contato: { telefone: "11977776666" },
    origem: "portal" as const,
    responsavelId: "cor_a",
  };

  it("entra em novo, no fim da coluna, com padrões", () => {
    const base = baseMinima({
      leads: [lead({ id: "lead_a", etapa: "novo", ordem: 0 }), lead({ id: "lead_b", etapa: "novo", ordem: 1 })],
    });
    const m = criarLead(base, dados, CTX);
    expect(m.resultado).toMatchObject({
      etapa: "novo",
      ordem: 2,
      motivoPerda: null,
      orcamento: null,
      imoveisVistos: [],
      criadoEm: CTX.agora,
      atualizadoEm: CTX.agora,
      interesse: { finalidade: "venda", tipos: [], bairros: [] },
    });
    expect(m.resultado.id).toMatch(/^lead_/);
    expect(m.base.leads).toHaveLength(3);
    expect(m.base.alteracoes).toEqual([]);
  });

  it("outras etapas não contam na ordem; dados inválidos lançam", () => {
    const base = baseMinima({ leads: [lead({ etapa: "contato", ordem: 0 })] });
    expect(criarLead(base, dados, CTX).resultado.ordem).toBe(0);
    expect(() => criarLead(base, { ...dados, nome: "x" }, CTX)).toThrow();
  });

  it("desfazer remove o lead criado", () => {
    const base = baseMinima();
    const m = criarLead(base, dados, CTX);
    expect(m.desfazer(m.base, CTX).base.leads).toEqual(base.leads);
  });
});

describe("alterarOrcamento (valor monetário monitorado)", () => {
  it("gera registro `orcamento` de→para", () => {
    const m = alterarOrcamento(baseCom(lead({ orcamento: 100 })), "lead_a", 200, CTX);
    expect(m.base.alteracoes).toHaveLength(1);
    expect(m.base.alteracoes[0]).toMatchObject({ campo: "orcamento", de: 100, para: 200, autorId: CTX.autorId });
    expect(m.base.leads[0]!.atualizadoEm).toBe(CTX.agora);
  });

  it("null → valor e valor → null também registram; igual não registra", () => {
    const a = alterarOrcamento(baseCom(lead({ orcamento: null })), "lead_a", 5, CTX);
    expect(a.base.alteracoes[0]).toMatchObject({ de: null, para: 5 });
    const b = alterarOrcamento(a.base, "lead_a", null, CTX);
    expect(b.base.alteracoes.at(-1)).toMatchObject({ de: 5, para: null });
    const c = alterarOrcamento(baseCom(lead({ orcamento: 5 })), "lead_a", 5, CTX);
    expect(c.base.alteracoes).toEqual([]);
  });
});

describe("adicionarNota", () => {
  it("grava Atividade nota com texto aparado", () => {
    const m = adicionarNota(baseCom(lead()), "lead_a", "  ligou  ", CTX);
    expect(m.base.atividades[0]).toMatchObject({
      tipo: "nota",
      alvo: { tipo: "lead", id: "lead_a" },
      dados: { texto: "ligou" },
    });
  });

  it("nota vazia ou só espaços lança OperacaoInvalida; lead inexistente também", () => {
    expect(() => adicionarNota(baseCom(lead()), "lead_a", "", CTX)).toThrow(OperacaoInvalida);
    expect(() => adicionarNota(baseCom(lead()), "lead_a", "   ", CTX)).toThrow(OperacaoInvalida);
    expect(() => adicionarNota(baseCom(lead()), "lead_x", "oi", CTX)).toThrow(OperacaoInvalida);
  });
});

describe("vincularContrato (RF-39, invariante 3)", () => {
  const fechado = () => lead({ etapa: "fechado" });
  const comContrato = (c = contrato(), l = fechado()) =>
    baseMinima({ leads: [l], imoveis: [imovel()], contratos: [c] });

  it("efeitos: seta leadId e cria Atividade contratoVinculado", () => {
    const m = vincularContrato(comContrato(), "lead_a", "ctr_a", CTX);
    expect(m.base.contratos[0]!.leadId).toBe("lead_a");
    expect(m.base.atividades[0]).toMatchObject({
      tipo: "contratoVinculado",
      alvo: { tipo: "lead", id: "lead_a" },
      relacionados: [{ tipo: "contrato", id: "ctr_a" }],
      dados: { numero: "CT-2026-0001" },
    });
  });

  it("desfazer devolve leadId a null", () => {
    const base = comContrato();
    const m = vincularContrato(base, "lead_a", "ctr_a", CTX);
    expect(m.desfazer(m.base, CTX).base.contratos).toEqual(base.contratos);
  });

  it("guards: lead não fechado, contrato inexistente, já vinculado, cancelado", () => {
    const base = comContrato();
    expect(podeVincularContrato(base, lead({ etapa: "proposta" }), "ctr_a").ok).toBe(false);
    expect(podeVincularContrato(base, fechado(), "ctr_x").ok).toBe(false);
    expect(podeVincularContrato(comContrato(contrato({ leadId: "lead_z" })), fechado(), "ctr_a").ok).toBe(false);
    const canc = contrato({ status: "cancelado", motivoCancelamento: "x" });
    expect(podeVincularContrato(comContrato(canc), fechado(), "ctr_a").ok).toBe(false);
    expect(podeVincularContrato(base, fechado(), "ctr_a")).toEqual({ ok: true });
  });

  it.each([
    ["lead não fechado", () => comContrato(contrato(), lead({ etapa: "proposta" }))],
    ["já vinculado", () => comContrato(contrato({ leadId: "lead_z" }))],
  ])("%s: vincular lança OperacaoInvalida", (_n, mk) => {
    expect(() => vincularContrato(mk(), "lead_a", "ctr_a", CTX)).toThrow(OperacaoInvalida);
  });

  it("depois de vincular, o lead fechado não sai da etapa", () => {
    const m = vincularContrato(comContrato(), "lead_a", "ctr_a", CTX);
    expect(() => transicionarLead(m.base, { leadId: "lead_a", para: "contato" }, CTX)).toThrow(TransicaoInvalida);
  });
});

describe("lead: auditoria do Gate 5", () => {
  it("orçamento negativo é recusado", () => {
    expect(() => alterarOrcamento(baseMinima(), "lead_a", -1, CTX)).toThrow();
  });

  it("desfazer um movimento continua valendo depois de outro lead mexer na mesma coluna (RF-04)", () => {
    const base = baseMinima({
      leads: [
        lead({ id: "lead_a", etapa: "novo", ordem: 0 }),
        lead({ id: "lead_b", etapa: "novo", ordem: 1 }),
        lead({ id: "lead_c", etapa: "novo", ordem: 2 }),
      ],
    });
    const m1 = transicionarLead(base, { leadId: "lead_a", para: "visita" }, CTX);
    const m2 = transicionarLead(m1.base, { leadId: "lead_b", para: "visita", ordem: 0 }, CTX);
    const volta = m1.desfazer(m2.base, CTX_DEPOIS).base;
    const a = volta.leads.find((l) => l.id === "lead_a")!;
    expect(a.etapa).toBe("novo");
    for (const etapa of ["novo", "visita"] as const) {
      const ordens = volta.leads
        .filter((l) => l.etapa === etapa)
        .map((l) => l.ordem)
        .sort();
      expect(ordens).toEqual(ordens.map((_, i) => i));
    }
  });
});
