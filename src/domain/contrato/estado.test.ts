import { describe, expect, it } from "vitest";
import { OperacaoInvalida, TransicaoInvalida } from "../comum/tipos";
import { baseMinima, contrato, contratoLocacao, CTX, CTX_DEPOIS, imovel } from "../teste/fabrica";
import { STATUS_CONTRATO, type Parcela } from "./schema";
import {
  TRANSICOES_CONTRATO,
  gerarComissao,
  gerarParcelas,
  mesesEntre,
  podeRegistrarPagamento,
  podeTransicionarContrato,
  registrarPagamento,
  transicionarContrato,
  transicoesPermitidasContrato,
} from "./estado";

const HOJE = CTX.agora; // 2026-11-14

const vendaBase = (c = contrato(), i = imovel()) => baseMinima({ imoveis: [i], contratos: [c] });
const locBase = (c = contratoLocacao(), i = imovel({ finalidade: "locacao", preco: 300_000 })) =>
  baseMinima({ imoveis: [i], contratos: [c] });
const paga = (p: Parcela): Parcela => ({ ...p, pagoEm: "2026-11-01T12:00:00.000Z" });

describe("contrato: tabela de transições (§3.3)", () => {
  const combos = STATUS_CONTRATO.flatMap((de) => STATUS_CONTRATO.map((para) => [de, para] as const));
  it.each(combos)("%s → %s", (de, para) => {
    const c = contrato({ status: de, motivoCancelamento: de === "cancelado" ? "x" : null });
    const permitida = TRANSICOES_CONTRATO[de].includes(para);
    const p = podeTransicionarContrato(vendaBase(c), c, para, HOJE);
    expect(p.ok).toBe(permitida);
    if (!permitida) {
      const cmd = para === "cancelado" ? { para, motivo: "m" } : { para };
      expect(() => transicionarContrato(vendaBase(c), c.id, cmd as never, CTX)).toThrow(TransicaoInvalida);
    }
  });

  it("estados finais não têm saída", () => {
    expect(TRANSICOES_CONTRATO.encerrado).toEqual([]);
    expect(TRANSICOES_CONTRATO.cancelado).toEqual([]);
  });

  it("transicoesPermitidasContrato: cancelado exige motivo", () => {
    const c = contrato();
    expect(transicoesPermitidasContrato(vendaBase(c), c, HOJE)).toEqual([
      { para: "ativo", exigeMotivo: false },
      { para: "cancelado", exigeMotivo: true },
    ]);
  });

  it("contrato com imóvel inexistente é negado", () => {
    const c = contrato({ imovelId: "imv_x" });
    expect(podeTransicionarContrato(baseMinima({ contratos: [c] }), c, "ativo", HOJE).ok).toBe(false);
  });

  it("contrato inexistente lança OperacaoInvalida", () => {
    expect(() => transicionarContrato(baseMinima(), "ctr_x", { para: "ativo" }, CTX)).toThrow(OperacaoInvalida);
  });
});

describe("contrato: assinar (rascunho → ativo)", () => {
  it("guard: imóvel disponível ou reservado passa", () => {
    for (const status of ["disponivel", "reservado"] as const) {
      const m = transicionarContrato(vendaBase(contrato(), imovel({ status })), "ctr_a", { para: "ativo" }, CTX);
      expect(m.resultado.status).toBe("ativo");
    }
  });

  it.each(["vendido", "alugado", "inativo"] as const)("guard: imóvel %s é recusado", (status) => {
    const i = imovel({ status, motivoInativo: status === "inativo" ? "x" : null });
    expect(() => transicionarContrato(vendaBase(contrato(), i), "ctr_a", { para: "ativo" }, CTX)).toThrow(
      TransicaoInvalida,
    );
  });

  it("guard: tipo do contrato ≠ finalidade é recusado (ambos os sentidos)", () => {
    expect(() =>
      transicionarContrato(vendaBase(contrato(), imovel({ finalidade: "locacao" })), "ctr_a", { para: "ativo" }, CTX),
    ).toThrow(/finalidade/);
    expect(() =>
      transicionarContrato(
        locBase(contratoLocacao(), imovel({ finalidade: "venda" })),
        "ctr_a",
        { para: "ativo" },
        CTX,
      ),
    ).toThrow(/finalidade/);
  });

  it("efeito: venda deixa o imóvel vendido; locação, alugado", () => {
    const v = transicionarContrato(vendaBase(), "ctr_a", { para: "ativo" }, CTX);
    expect(v.base.imoveis[0]!.status).toBe("vendido");
    const l = transicionarContrato(locBase(), "ctr_a", { para: "ativo" }, CTX);
    expect(l.base.imoveis[0]!.status).toBe("alugado");
  });

  it("efeito: gera parcelas se vazias; mantém as existentes", () => {
    const gerado = transicionarContrato(vendaBase(), "ctr_a", { para: "ativo" }, CTX);
    expect(gerado.resultado.parcelas).toHaveLength(1);
    expect(gerado.resultado.parcelas[0]).toMatchObject({ numero: 1, valor: 30_000_000, pagoEm: null });

    const existentes = gerarParcelas(contrato(), 3);
    const mantido = transicionarContrato(
      vendaBase(contrato({ parcelas: existentes })),
      "ctr_a",
      { para: "ativo" },
      CTX,
    );
    expect(mantido.resultado.parcelas).toEqual(existentes);

    const loc = transicionarContrato(locBase(), "ctr_a", { para: "ativo" }, CTX);
    expect(loc.resultado.parcelas).toHaveLength(3);
  });

  it("efeito: atividades do contrato e do imóvel", () => {
    const m = transicionarContrato(vendaBase(), "ctr_a", { para: "ativo" }, CTX);
    const tipos = m.base.atividades.map((a) => [a.tipo, a.alvo.tipo]);
    expect(tipos).toEqual(
      expect.arrayContaining([
        ["statusAlterado", "contrato"],
        ["statusAlterado", "imovel"],
      ]),
    );
    const doContrato = m.base.atividades.find((a) => a.alvo.tipo === "contrato")!;
    expect(doContrato).toMatchObject({
      relacionados: [{ tipo: "imovel", id: "imv_a" }],
      dados: { de: "rascunho", para: "ativo", motivo: null },
    });
    const doImovel = m.base.atividades.find((a) => a.alvo.tipo === "imovel")!;
    expect(doImovel.dados).toMatchObject({ de: "disponivel", para: "vendido", origem: "ctr_a" });
  });

  it("efeito: registros de status do contrato e do imóvel", () => {
    const m = transicionarContrato(vendaBase(), "ctr_a", { para: "ativo" }, CTX);
    const reg = m.base.alteracoes.map((a) => [a.entidade.tipo, a.campo, a.de, a.para]);
    expect(reg).toEqual(
      expect.arrayContaining([
        ["contrato", "status", "rascunho", "ativo"],
        ["imovel", "status", "disponivel", "vendido"],
      ]),
    );
    expect(m.base.alteracoes.every((a) => a.autorId === CTX.autorId && a.em === CTX.agora)).toBe(true);
  });

  it("desfazer reverte contrato, imóvel e atividades", () => {
    const base = vendaBase();
    const m = transicionarContrato(base, "ctr_a", { para: "ativo" }, CTX);
    const d = m.desfazer(m.base, CTX_DEPOIS);
    expect(d.base.contratos).toEqual(base.contratos);
    expect(d.base.imoveis).toEqual(base.imoveis);
    expect(d.base.atividades).toEqual([]);
  });
});

describe("contrato: encerrar (ativo → encerrado)", () => {
  it("locação: só depois do fim; imóvel volta a disponível", () => {
    const c = contratoLocacao({ status: "ativo", parcelas: gerarParcelas(contratoLocacao()) });
    const i = imovel({ finalidade: "locacao", status: "alugado" });
    const base = locBase(c, i);
    // antes do fim
    expect(podeTransicionarContrato(base, c, "encerrado", "2026-03-31T12:00:00.000Z").ok).toBe(false);
    expect(() =>
      transicionarContrato(base, "ctr_a", { para: "encerrado" }, { ...CTX, agora: "2026-03-31T12:00:00.000Z" }),
    ).toThrow(TransicaoInvalida);
    // no dia do fim e depois
    expect(podeTransicionarContrato(base, c, "encerrado", "2026-04-01").ok).toBe(true);
    const m = transicionarContrato(base, "ctr_a", { para: "encerrado" }, CTX);
    expect(m.resultado.status).toBe("encerrado");
    expect(m.base.imoveis[0]!.status).toBe("disponivel");
    expect(m.base.alteracoes.map((a) => [a.entidade.tipo, a.campo, a.para])).toEqual(
      expect.arrayContaining([
        ["contrato", "status", "encerrado"],
        ["imovel", "status", "disponivel"],
      ]),
    );
  });

  it("venda: só com todas as parcelas pagas; imóvel segue vendido", () => {
    const ps = gerarParcelas(contrato(), 2);
    const i = imovel({ status: "vendido" });
    const aberta = vendaBase(contrato({ status: "ativo", parcelas: [paga(ps[0]!), ps[1]!] }), i);
    expect(() => transicionarContrato(aberta, "ctr_a", { para: "encerrado" }, CTX)).toThrow(TransicaoInvalida);

    const quitada = vendaBase(contrato({ status: "ativo", parcelas: ps.map(paga) }), i);
    const m = transicionarContrato(quitada, "ctr_a", { para: "encerrado" }, CTX);
    expect(m.resultado.status).toBe("encerrado");
    expect(m.base.imoveis[0]!.status).toBe("vendido");
    expect(m.base.alteracoes.filter((a) => a.entidade.tipo === "imovel")).toEqual([]);
  });

  it("encerrar gera atividade do contrato", () => {
    const ps = gerarParcelas(contrato(), 1).map(paga);
    const m = transicionarContrato(
      vendaBase(contrato({ status: "ativo", parcelas: ps }), imovel({ status: "vendido" })),
      "ctr_a",
      { para: "encerrado" },
      CTX,
    );
    expect(m.base.atividades.at(-1)).toMatchObject({
      tipo: "statusAlterado",
      dados: { de: "ativo", para: "encerrado" },
    });
  });
});

describe("contrato: cancelar", () => {
  const cmd = (motivo: string) => ({ para: "cancelado", motivo }) as const;

  it("exige motivo (vazio ou só espaços lança)", () => {
    expect(() => transicionarContrato(vendaBase(), "ctr_a", cmd(""), CTX)).toThrow(TransicaoInvalida);
    expect(() => transicionarContrato(vendaBase(), "ctr_a", cmd("   "), CTX)).toThrow(
      "Informe o motivo do cancelamento.",
    );
  });

  it("ativo: grava motivo aparado e devolve o imóvel a disponível", () => {
    const base = vendaBase(
      contrato({ status: "ativo", parcelas: gerarParcelas(contrato()) }),
      imovel({ status: "vendido" }),
    );
    const m = transicionarContrato(base, "ctr_a", cmd("  desistência "), CTX);
    expect(m.resultado).toMatchObject({ status: "cancelado", motivoCancelamento: "desistência" });
    expect(m.base.imoveis[0]!.status).toBe("disponivel");
    expect(m.base.atividades.find((a) => a.alvo.tipo === "contrato")!.dados).toMatchObject({
      de: "ativo",
      para: "cancelado",
      motivo: "desistência",
    });
  });

  it("locação ativa cancelada devolve o imóvel alugado a disponível", () => {
    const base = locBase(contratoLocacao({ status: "ativo" }), imovel({ finalidade: "locacao", status: "alugado" }));
    const m = transicionarContrato(base, "ctr_a", cmd("m"), CTX);
    expect(m.base.imoveis[0]!.status).toBe("disponivel");
  });

  it("rascunho: não mexe no imóvel", () => {
    const base = vendaBase(contrato(), imovel({ status: "reservado" }));
    const m = transicionarContrato(base, "ctr_a", cmd("m"), CTX);
    expect(m.resultado.status).toBe("cancelado");
    expect(m.base.imoveis).toEqual(base.imoveis);
    expect(m.base.atividades.filter((a) => a.alvo.tipo === "imovel")).toEqual([]);
    expect(m.base.alteracoes.map((a) => a.entidade.tipo)).toEqual(["contrato"]);
  });

  it("desfazer do cancelamento restaura contrato e imóvel", () => {
    const base = vendaBase(
      contrato({ status: "ativo", parcelas: gerarParcelas(contrato()) }),
      imovel({ status: "vendido" }),
    );
    const m = transicionarContrato(base, "ctr_a", cmd("m"), CTX);
    const d = m.desfazer(m.base, CTX_DEPOIS);
    expect(d.base.contratos).toEqual(base.contratos);
    expect(d.base.imoveis).toEqual(base.imoveis);
  });
});

describe("registrarPagamento (RF-43, §3.4)", () => {
  const ativo = () => {
    const c = contrato({ status: "ativo", parcelas: gerarParcelas(contrato(), 3) });
    return vendaBase(c, imovel({ status: "vendido" }));
  };

  it("grava pagoEm, registro parcela.N.pagoEm e atividade", () => {
    const m = registrarPagamento(ativo(), "ctr_a", 2, CTX);
    const p = m.resultado.parcelas;
    expect(p[1]!.pagoEm).toBe(CTX.agora);
    expect(p[0]!.pagoEm).toBeNull();
    expect(m.base.alteracoes).toHaveLength(1);
    expect(m.base.alteracoes[0]).toMatchObject({
      campo: "parcela.2.pagoEm",
      de: null,
      para: CTX.agora,
      autorId: CTX.autorId,
      entidade: { tipo: "contrato", id: "ctr_a" },
    });
    expect(m.base.atividades[0]).toMatchObject({
      tipo: "pagamentoRegistrado",
      alvo: { tipo: "contrato", id: "ctr_a" },
      relacionados: [{ tipo: "imovel", id: "imv_a" }],
      dados: { numero: 2, valor: p[1]!.valor },
    });
  });

  it("só contrato ativo", () => {
    for (const status of ["rascunho", "encerrado"] as const) {
      const c = contrato({ status, parcelas: gerarParcelas(contrato(), 2) });
      expect(podeRegistrarPagamento(c, 1).ok).toBe(false);
      expect(() => registrarPagamento(vendaBase(c), "ctr_a", 1, CTX)).toThrow(OperacaoInvalida);
    }
  });

  it("parcela já paga ou inexistente", () => {
    const m = registrarPagamento(ativo(), "ctr_a", 1, CTX);
    expect(podeRegistrarPagamento(m.base.contratos[0]!, 1)).toEqual({ ok: false, motivo: "Parcela já paga." });
    expect(() => registrarPagamento(m.base, "ctr_a", 1, CTX)).toThrow(OperacaoInvalida);
    expect(() => registrarPagamento(ativo(), "ctr_a", 9, CTX)).toThrow("Parcela não encontrada.");
  });

  it("desfazer restaura parcela e remove atividade", () => {
    const base = ativo();
    const m = registrarPagamento(base, "ctr_a", 1, CTX);
    const d = m.desfazer(m.base, CTX_DEPOIS);
    expect(d.base.contratos).toEqual(base.contratos);
    expect(d.base.atividades).toEqual([]);
    expect(d.base.alteracoes.at(-1)).toMatchObject({ campo: "parcela.1.pagoEm", de: CTX.agora, para: null });
  });
});

describe("gerarParcelas (invariante 7)", () => {
  it("venda: soma = valor, resto na última, mensais", () => {
    const ps = gerarParcelas({ tipo: "venda", valor: 100, inicio: "2026-12-01", fim: "2027-12-01" }, 3);
    expect(ps.map((p) => p.valor)).toEqual([33, 33, 34]);
    expect(ps.reduce((s, p) => s + p.valor, 0)).toBe(100);
    expect(ps.map((p) => p.numero)).toEqual([1, 2, 3]);
    expect(ps.map((p) => p.vencimento)).toEqual(["2026-12-01", "2027-01-01", "2027-02-01"]);
    expect(ps.every((p) => p.pagoEm === null)).toBe(true);
  });

  it("venda: padrão 1 parcela; n inválido vira 1; fração é truncada", () => {
    const c = { tipo: "venda", valor: 100, inicio: "2026-12-01", fim: "2027-12-01" } as const;
    expect(gerarParcelas(c)).toHaveLength(1);
    expect(gerarParcelas(c, 0)).toHaveLength(1);
    expect(gerarParcelas(c, 2.9)).toHaveLength(2);
  });

  it("venda: soma exata com valor grande não divisível", () => {
    const ps = gerarParcelas({ tipo: "venda", valor: 30_000_001, inicio: "2026-01-01", fim: "2027-01-01" }, 7);
    expect(ps.reduce((s, p) => s + p.valor, 0)).toBe(30_000_001);
  });

  it("locação: uma por mês de vigência, valor = aluguel", () => {
    const ps = gerarParcelas({ tipo: "locacao", valor: 300_000, inicio: "2026-01-01", fim: "2026-04-01" });
    expect(ps).toHaveLength(3);
    expect(ps.every((p) => p.valor === 300_000)).toBe(true);
    expect(ps.map((p) => p.vencimento)).toEqual(["2026-01-01", "2026-02-01", "2026-03-01"]);
  });

  it("locação com vigência zero gera ao menos 1; dia > 28 limitado a 28; vira o ano", () => {
    expect(gerarParcelas({ tipo: "locacao", valor: 1, inicio: "2026-01-10", fim: "2026-01-20" })).toHaveLength(1);
    const ps = gerarParcelas({ tipo: "locacao", valor: 1, inicio: "2026-11-31", fim: "2027-02-28" });
    expect(ps.map((p) => p.vencimento)).toEqual(["2026-11-28", "2026-12-28", "2027-01-28"]);
  });

  it("mesesEntre", () => {
    expect(mesesEntre("2026-01-15", "2027-03-01")).toBe(14);
    expect(mesesEntre("2026-05-01", "2026-05-31")).toBe(0);
  });
});

describe("gerarComissao (RF-44)", () => {
  it("base = valor, valor = base × % arredondado, competência = mês do início", () => {
    const c = gerarComissao({ tipo: "venda", valor: 30_000_000, inicio: "2026-12-01" }, "cor_a", 6);
    expect(c).toEqual({
      corretorId: "cor_a",
      percentual: 6,
      base: 30_000_000,
      valor: 1_800_000,
      competencia: "2026-12",
      pagaEm: null,
    });
  });

  it("arredonda para centavos inteiros", () => {
    expect(gerarComissao({ tipo: "locacao", valor: 333_333, inicio: "2026-01-05" }, "cor_a", 5.5).valor).toBe(
      Math.round((333_333 * 5.5) / 100),
    );
  });
});

describe("contrato: assinatura gera comissões e não registra criação de parcelas", () => {
  it("sem comissões definidas, gera a padrão para o corretor do imóvel", () => {
    const m = transicionarContrato(
      vendaBase(contrato({ parcelas: [], comissoes: [] })),
      "ctr_a",
      { para: "ativo" },
      CTX,
    );
    const c = m.base.contratos[0]!;
    expect(c.comissoes).toHaveLength(1);
    expect(c.comissoes[0]).toMatchObject({ percentual: 6, base: c.valor, competencia: c.inicio.slice(0, 7) });
    const campos = m.base.alteracoes.filter((a) => a.entidade.tipo === "contrato").map((a) => a.campo);
    expect(campos).toEqual(["status"]);
  });
});
