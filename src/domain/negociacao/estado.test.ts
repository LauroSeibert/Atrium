import { describe, expect, it } from "vitest";
import { OperacaoInvalida, TransicaoInvalida } from "../comum/tipos";
import { validarBase } from "../invariantes";
import { baseMinima, contrato, CTX, CTX_DEPOIS, imovel, lead, negociacao } from "../teste/fabrica";
import { ETAPAS, type Etapa, type Negociacao } from "./schema";
import {
  TRANSICOES_NEGOCIACAO,
  contratosVinculaveis,
  criarNegociacao,
  definirImovelNegociacao,
  podeDefinirImovel,
  destinosNegociacao,
  existeNegociacaoAberta,
  negociacoesDoLead,
  permissoesDeSoltar,
  podeTransicionarNegociacao,
  podeVincularContrato,
  temContratoVinculado,
  transicionarNegociacao,
  transicoesPermitidasNegociacao,
  valorNegociacao,
  vincularContrato,
} from "./estado";

const neg = negociacao;
const baseCom = (n: Negociacao, extra = {}) => baseMinima({ negociacoes: [n], ...extra });
const ordens = (b: ReturnType<typeof baseMinima>, etapa: Etapa) =>
  b.negociacoes
    .filter((n) => n.etapa === etapa)
    .sort((x, y) => x.ordem - y.ordem)
    .map((n) => [n.id, n.ordem]);
const comMotivo = (etapa: Etapa) => ({ etapa, motivoPerda: etapa === "perdido" ? ("preco" as const) : null });

describe("negociação: tabela de transições (RF-30, RF-31, ESTADOS §3.1)", () => {
  const combos = ETAPAS.flatMap((de) => ETAPAS.map((para) => [de, para] as const));
  it("são 36 combinações; 30 entre etapas diferentes", () => {
    expect(combos).toHaveLength(36);
    expect(combos.filter(([de, para]) => de !== para)).toHaveLength(30);
  });

  it.each(combos.filter(([de, para]) => de !== para))("%s → %s é permitida (com imóvel, sem contrato)", (de, para) => {
    const n = neg(comMotivo(de));
    expect(TRANSICOES_NEGOCIACAO[de]).toContain(para);
    expect(podeTransicionarNegociacao(baseMinima(), n, para)).toEqual({ ok: true });
    const motivo = para === "perdido" ? ("outro" as const) : undefined;
    const m = transicionarNegociacao(baseCom(n), { negociacaoId: n.id, para, motivo }, CTX);
    expect(m.resultado.etapa).toBe(para);
    expect(validarBase(m.base)).toEqual([]);
  });

  it.each(ETAPAS)("%s → %s (mesma etapa) é negada", (e) => {
    const n = neg(comMotivo(e));
    expect(TRANSICOES_NEGOCIACAO[e]).not.toContain(e);
    expect(podeTransicionarNegociacao(baseMinima(), n, e).ok).toBe(false);
  });
});

describe("negociação: guards", () => {
  it("→ perdido sem motivo lança TransicaoInvalida; com motivo grava", () => {
    expect(() => transicionarNegociacao(baseCom(neg()), { negociacaoId: "neg_a", para: "perdido" }, CTX)).toThrow(
      TransicaoInvalida,
    );
    const m = transicionarNegociacao(baseCom(neg()), { negociacaoId: "neg_a", para: "perdido", motivo: "preco" }, CTX);
    expect(m.resultado.motivoPerda).toBe("preco");
  });

  it("sair de perdido limpa motivoPerda", () => {
    const m = transicionarNegociacao(
      baseCom(neg(comMotivo("perdido"))),
      { negociacaoId: "neg_a", para: "contato" },
      CTX,
    );
    expect(m.resultado.motivoPerda).toBeNull();
  });

  it("→ fechado exige imóvel definido", () => {
    const n = neg({ imovelId: null });
    const p = podeTransicionarNegociacao(baseCom(n), n, "fechado");
    expect(p).toEqual({ ok: false, motivo: "Defina o imóvel antes de fechar." });
    expect(() => transicionarNegociacao(baseCom(n), { negociacaoId: n.id, para: "fechado" }, CTX)).toThrow(
      TransicaoInvalida,
    );
    expect(podeTransicionarNegociacao(baseCom(n), n, "proposta").ok).toBe(true);
  });

  it("fechado com contrato vinculado não sai; sem contrato sai", () => {
    const n = neg({ etapa: "fechado" });
    const preso = baseCom(n, { contratos: [contrato({ negociacaoId: "neg_a" })] });
    expect(temContratoVinculado(preso, "neg_a")).toBe(true);
    expect(podeTransicionarNegociacao(preso, n, "contato").ok).toBe(false);
    expect(() => transicionarNegociacao(preso, { negociacaoId: "neg_a", para: "contato" }, CTX)).toThrow(
      TransicaoInvalida,
    );
    expect(podeTransicionarNegociacao(baseCom(n, { contratos: [contrato()] }), n, "contato").ok).toBe(true);
  });

  it("sair de perdido (ou fechado) não pode duplicar negociação aberta do mesmo lead × imóvel", () => {
    const perdida = neg({ id: "neg_p", ...comMotivo("perdido") });
    const aberta = neg({ id: "neg_b", etapa: "visita" });
    const base = baseMinima({ negociacoes: [perdida, aberta] });
    expect(podeTransicionarNegociacao(base, perdida, "contato").ok).toBe(false);
    expect(podeTransicionarNegociacao(base, perdida, "fechado").ok).toBe(true); // encerrada → encerrada
    const fechada = neg({ id: "neg_f", etapa: "fechado" });
    const b2 = baseMinima({ negociacoes: [fechada, aberta] });
    expect(podeTransicionarNegociacao(b2, fechada, "proposta").ok).toBe(false);
    // outro imóvel: livre
    const outra = neg({ id: "neg_o", ...comMotivo("perdido"), imovelId: "imv_b" });
    expect(podeTransicionarNegociacao(baseMinima({ negociacoes: [outra, aberta] }), outra, "contato").ok).toBe(true);
  });

  it("negociação inexistente lança OperacaoInvalida", () => {
    expect(() => transicionarNegociacao(baseMinima(), { negociacaoId: "neg_x", para: "contato" }, CTX)).toThrow(
      OperacaoInvalida,
    );
  });
});

describe("negociação: o que a UI recebe (RF-31, RF-32)", () => {
  it("transicoesPermitidas: todas as outras etapas; só perdido exige motivo", () => {
    const n = neg({ etapa: "contato" });
    const r = transicoesPermitidasNegociacao(baseMinima(), n);
    expect(r.map((x) => x.para)).toEqual(ETAPAS.filter((e) => e !== "contato"));
    expect(r.filter((x) => x.exigeMotivo).map((x) => x.para)).toEqual(["perdido"]);
  });

  it("destinos trazem a permissão (negada com motivo); fechado com contrato: nenhum permitido", () => {
    const n = neg({ etapa: "fechado" });
    const livre = destinosNegociacao(baseCom(n), n);
    expect(livre.map((d) => d.etapa)).toEqual(ETAPAS.filter((e) => e !== "fechado"));
    expect(livre.every((d) => d.permissao.ok)).toBe(true);
    expect(livre.find((d) => d.etapa === "perdido")?.exigeMotivo).toBe(true);
    const preso = destinosNegociacao(baseCom(n, { contratos: [contrato({ negociacaoId: "neg_a" })] }), n);
    expect(preso.every((d) => !d.permissao.ok)).toBe(true);
  });

  it("permissoesDeSoltar: própria coluna reordena; proibidas trazem o motivo", () => {
    const n = neg({ imovelId: null });
    const p = permissoesDeSoltar(baseCom(n), n);
    expect(p.novo.ok).toBe(true);
    expect(p.fechado.ok).toBe(false);
  });

  it("valorNegociacao: preço do imóvel; sem imóvel, orçamento do lead", () => {
    expect(valorNegociacao(neg(), imovel(), lead({ orcamento: 5 }))).toBe(30_000_000);
    expect(valorNegociacao(neg({ imovelId: null }), null, lead({ orcamento: 5 }))).toBe(5);
    expect(valorNegociacao(neg({ imovelId: null }), null, lead())).toBeNull();
  });

  it("negociacoesDoLead: só as do lead, na ordem do funil", () => {
    const base = baseMinima({
      negociacoes: [
        neg({ id: "neg_1", etapa: "proposta", imovelId: "imv_b" }),
        neg({ id: "neg_2", etapa: "novo" }),
        neg({ id: "neg_3", leadId: "lead_b" }),
      ],
    });
    expect(negociacoesDoLead(base, "lead_a").map((n) => n.id)).toEqual(["neg_2", "neg_1"]);
  });
});

describe("negociação: ordem nas colunas", () => {
  const tres = () =>
    baseMinima({
      imoveis: ["a", "b", "c", "d", "e"].map((x, i) => imovel({ id: `imv_${x}`, codigo: `AT-000${i + 1}` })),
      negociacoes: [
        neg({ id: "neg_a", imovelId: "imv_a", etapa: "contato", ordem: 0 }),
        neg({ id: "neg_b", imovelId: "imv_b", etapa: "contato", ordem: 1 }),
        neg({ id: "neg_c", imovelId: "imv_c", etapa: "contato", ordem: 2 }),
        neg({ id: "neg_d", imovelId: "imv_d", etapa: "visita", ordem: 0 }),
        neg({ id: "neg_e", imovelId: "imv_e", etapa: "visita", ordem: 1 }),
      ],
    });

  it("renumera 0…n na origem e no destino; posição pedida respeitada", () => {
    const m = transicionarNegociacao(tres(), { negociacaoId: "neg_a", para: "visita", ordem: 1 }, CTX);
    expect(ordens(m.base, "contato")).toEqual([
      ["neg_b", 0],
      ["neg_c", 1],
    ]);
    expect(ordens(m.base, "visita")).toEqual([
      ["neg_d", 0],
      ["neg_a", 1],
      ["neg_e", 2],
    ]);
  });

  it("sem ordem, entra no fim; fora da faixa é limitada", () => {
    expect(
      ordens(transicionarNegociacao(tres(), { negociacaoId: "neg_a", para: "visita" }, CTX).base, "visita").at(-1),
    ).toEqual(["neg_a", 2]);
    const alto = transicionarNegociacao(tres(), { negociacaoId: "neg_a", para: "visita", ordem: 99 }, CTX);
    expect(ordens(alto.base, "visita").at(-1)).toEqual(["neg_a", 2]);
    const negativo = transicionarNegociacao(tres(), { negociacaoId: "neg_a", para: "visita", ordem: -5 }, CTX);
    expect(ordens(negativo.base, "visita")[0]).toEqual(["neg_a", 0]);
  });

  it("reordenar na mesma etapa muda a ordem sem Atividade nem registro", () => {
    const m = transicionarNegociacao(tres(), { negociacaoId: "neg_c", para: "contato", ordem: 0 }, CTX);
    expect(ordens(m.base, "contato")).toEqual([
      ["neg_c", 0],
      ["neg_a", 1],
      ["neg_b", 2],
    ]);
    expect(m.base.atividades).toEqual([]);
    expect(m.base.alteracoes).toEqual([]);
  });

  it("desfazer continua valendo depois de outra negociação mexer na mesma coluna (RF-04)", () => {
    const base = baseMinima({
      negociacoes: [
        neg({ id: "neg_a", imovelId: "imv_a", ordem: 0 }),
        neg({ id: "neg_b", imovelId: null, ordem: 1 }),
        neg({ id: "neg_c", leadId: "lead_b", ordem: 2 }),
      ],
    });
    const m1 = transicionarNegociacao(base, { negociacaoId: "neg_a", para: "visita" }, CTX);
    const m2 = transicionarNegociacao(m1.base, { negociacaoId: "neg_b", para: "visita", ordem: 0 }, CTX);
    const volta = m1.desfazer(m2.base, CTX_DEPOIS).base;
    expect(volta.negociacoes.find((n) => n.id === "neg_a")!.etapa).toBe("novo");
    for (const etapa of ["novo", "visita"] as const) {
      const os = volta.negociacoes
        .filter((n) => n.etapa === etapa)
        .map((n) => n.ordem)
        .sort();
      expect(os).toEqual(os.map((_, i) => i));
    }
  });
});

describe("negociação: efeitos da transição", () => {
  it("Atividade etapaAlterada no lead, com imóvel relacionado e negociacaoId", () => {
    const m = transicionarNegociacao(
      baseCom(neg({ etapa: "contato" })),
      { negociacaoId: "neg_a", para: "perdido", motivo: "preco" },
      CTX,
    );
    expect(m.base.atividades).toHaveLength(1);
    expect(m.base.atividades[0]).toMatchObject({
      tipo: "etapaAlterada",
      alvo: { tipo: "lead", id: "lead_a" },
      relacionados: [{ tipo: "imovel", id: "imv_a" }],
      autorId: CTX.autorId,
      dados: { de: "contato", para: "perdido", motivo: "preco", negociacaoId: "neg_a" },
    });
  });

  it("sem imóvel: atividade sem relacionados", () => {
    const m = transicionarNegociacao(baseCom(neg({ imovelId: null })), { negociacaoId: "neg_a", para: "contato" }, CTX);
    expect(m.base.atividades[0]!.relacionados).toEqual([]);
  });

  it("registro de alteração `etapa` na negociação", () => {
    const m = transicionarNegociacao(
      baseCom(neg({ etapa: "contato" })),
      { negociacaoId: "neg_a", para: "visita" },
      CTX,
    );
    expect(m.base.alteracoes).toEqual([
      expect.objectContaining({
        campo: "etapa",
        de: "contato",
        para: "visita",
        autorId: CTX.autorId,
        em: CTX.agora,
        entidade: { tipo: "negociacao", id: "neg_a" },
      }),
    ]);
  });

  it("desfazer restaura a negociação, remove a atividade e registra o inverso", () => {
    const base = baseCom(neg({ etapa: "contato" }));
    const m = transicionarNegociacao(base, { negociacaoId: "neg_a", para: "visita" }, CTX);
    const d = m.desfazer(m.base, CTX_DEPOIS);
    expect(d.base.negociacoes).toEqual(base.negociacoes);
    expect(d.base.atividades).toEqual([]);
    expect(d.base.alteracoes.at(-1)).toMatchObject({ campo: "etapa", de: "visita", para: "contato" });
  });
});

describe("criarNegociacao (RF-71)", () => {
  const base = () => baseMinima({ imoveis: [imovel(), imovel({ id: "imv_b", codigo: "AT-0002" })] });

  it("nasce em novo, no fim da coluna, com o responsável do lead; Atividade negociacaoCriada", () => {
    const m = criarNegociacao(base(), { leadId: "lead_a", imovelId: "imv_b" }, CTX);
    expect(m.resultado).toMatchObject({
      etapa: "novo",
      ordem: 1,
      motivoPerda: null,
      responsavelId: "cor_a",
      imovelId: "imv_b",
    });
    expect(m.resultado.id).toMatch(/^neg_/);
    expect(m.base.atividades[0]).toMatchObject({
      tipo: "negociacaoCriada",
      alvo: { tipo: "lead", id: "lead_a" },
      relacionados: [{ tipo: "imovel", id: "imv_b" }],
      dados: { negociacaoId: m.resultado.id },
    });
    expect(m.base.alteracoes).toEqual([]);
    expect(validarBase(m.base)).toEqual([]);
    expect(m.desfazer(m.base, CTX).base.negociacoes).toEqual(base().negociacoes);
  });

  it("sem imóvel é aceito (inclusive mais de uma)", () => {
    const a = criarNegociacao(base(), { leadId: "lead_a", imovelId: null }, CTX);
    const b = criarNegociacao(a.base, { leadId: "lead_a", imovelId: null }, CTX);
    expect(b.base.negociacoes.filter((n) => n.imovelId === null)).toHaveLength(2);
  });

  it("duplicidade com negociação aberta é recusada; com fechada/perdida, aceita", () => {
    expect(() => criarNegociacao(base(), { leadId: "lead_a", imovelId: "imv_a" }, CTX)).toThrow(OperacaoInvalida);
    const perdida = baseMinima({ negociacoes: [neg(comMotivo("perdido"))] });
    expect(criarNegociacao(perdida, { leadId: "lead_a", imovelId: "imv_a" }, CTX).resultado.etapa).toBe("novo");
    expect(existeNegociacaoAberta(perdida, "lead_a", "imv_a")).toBe(false);
  });

  it("lead ou imóvel inexistente lança OperacaoInvalida", () => {
    expect(() => criarNegociacao(base(), { leadId: "lead_x", imovelId: null }, CTX)).toThrow(OperacaoInvalida);
    expect(() => criarNegociacao(base(), { leadId: "lead_a", imovelId: "imv_x" }, CTX)).toThrow(OperacaoInvalida);
  });
});

describe("definirImovelNegociacao", () => {
  const base = () =>
    baseMinima({
      imoveis: [imovel(), imovel({ id: "imv_b", codigo: "AT-0002" })],
      negociacoes: [neg(), neg({ id: "neg_s", imovelId: null, ordem: 1 })],
    });

  it("define o imóvel de negociação sem imóvel", () => {
    const m = definirImovelNegociacao(base(), "neg_s", "imv_b", CTX);
    expect(m.resultado.imovelId).toBe("imv_b");
    expect(m.base.atividades).toMatchObject([
      {
        tipo: "imovelDefinido",
        alvo: { tipo: "lead", id: "lead_a" },
        relacionados: [{ tipo: "imovel", id: "imv_b" }],
        dados: { negociacaoId: "neg_s", imovelId: "imv_b" },
      },
    ]);
    expect(m.desfazer(m.base, CTX).base.negociacoes).toEqual(base().negociacoes);
  });

  it("podeDefinirImovel sem imóvel escolhido diz se a UI oferece a ação", () => {
    const b = base();
    expect(podeDefinirImovel(b, b.negociacoes[1]!).ok).toBe(true);
    expect(podeDefinirImovel(b, b.negociacoes[0]!).ok).toBe(false);
  });

  it("recusa: já tem imóvel, imóvel inexistente, duplicidade com aberta", () => {
    expect(() => definirImovelNegociacao(base(), "neg_a", "imv_b", CTX)).toThrow("A negociação já tem imóvel.");
    expect(() => definirImovelNegociacao(base(), "neg_s", "imv_x", CTX)).toThrow(OperacaoInvalida);
    expect(() => definirImovelNegociacao(base(), "neg_s", "imv_a", CTX)).toThrow(/aberta/);
  });
});

describe("vincularContrato (RF-39, invariante 3)", () => {
  const fechada = (over = {}) => neg({ etapa: "fechado", ...over });
  const comContrato = (c = contrato(), n = fechada()) => baseMinima({ negociacoes: [n], contratos: [c] });

  it("efeitos: seta negociacaoId e cria Atividade contratoVinculado no lead", () => {
    const m = vincularContrato(comContrato(), "neg_a", "ctr_a", CTX);
    expect(m.base.contratos[0]!.negociacaoId).toBe("neg_a");
    expect(m.base.atividades[0]).toMatchObject({
      tipo: "contratoVinculado",
      alvo: { tipo: "lead", id: "lead_a" },
      relacionados: [
        { tipo: "contrato", id: "ctr_a" },
        { tipo: "imovel", id: "imv_a" },
      ],
      dados: { numero: "CT-2026-0001", negociacaoId: "neg_a" },
    });
    expect(m.desfazer(m.base, CTX).base.contratos).toEqual(comContrato().contratos);
  });

  it("guards: não fechada, inexistente, outro imóvel, já vinculado, cancelado, negociação já com contrato", () => {
    const base = comContrato();
    expect(podeVincularContrato(base, neg({ etapa: "proposta" }), "ctr_a").ok).toBe(false);
    expect(podeVincularContrato(base, fechada(), "ctr_x").ok).toBe(false);
    expect(podeVincularContrato(comContrato(contrato({ imovelId: "imv_b" })), fechada(), "ctr_a").ok).toBe(false);
    expect(podeVincularContrato(comContrato(contrato({ negociacaoId: "neg_z" })), fechada(), "ctr_a").ok).toBe(false);
    const canc = contrato({ status: "cancelado", motivoCancelamento: "x" });
    expect(podeVincularContrato(comContrato(canc), fechada(), "ctr_a").ok).toBe(false);
    const dois = baseMinima({
      negociacoes: [fechada()],
      contratos: [contrato({ negociacaoId: "neg_a" }), contrato({ id: "ctr_b", numero: "CT-2026-0002" })],
    });
    expect(podeVincularContrato(dois, fechada(), "ctr_b").ok).toBe(false);
    expect(podeVincularContrato(base, fechada(), "ctr_a")).toEqual({ ok: true });
    expect(() => vincularContrato(comContrato(contrato(), neg()), "neg_a", "ctr_a", CTX)).toThrow(OperacaoInvalida);
  });

  it("contratosVinculaveis: só do imóvel da negociação, sem negociação e não cancelados", () => {
    const base = baseMinima({
      negociacoes: [fechada()],
      contratos: [
        contrato({ id: "ctr_1" }),
        contrato({ id: "ctr_2", imovelId: "imv_b" }),
        contrato({ id: "ctr_3", status: "cancelado", motivoCancelamento: "x" }),
      ],
    });
    expect(contratosVinculaveis(base, fechada()).map((c) => c.id)).toEqual(["ctr_1"]);
    expect(contratosVinculaveis(base, neg({ etapa: "proposta" }))).toEqual([]);
  });

  it("depois de vincular, a negociação fechada não sai da etapa", () => {
    const m = vincularContrato(comContrato(), "neg_a", "ctr_a", CTX);
    expect(() => transicionarNegociacao(m.base, { negociacaoId: "neg_a", para: "contato" }, CTX)).toThrow(
      TransicaoInvalida,
    );
  });
});
