import { describe, expect, it } from "vitest";
import { OperacaoInvalida, TransicaoInvalida } from "../comum/tipos";
import { baseMinima, contrato, CTX, CTX_DEPOIS, imovel } from "../teste/fabrica";
import { STATUS_IMOVEL, type DadosImovel, type Imovel, type StatusImovel } from "./schema";
import {
  TRANSICOES_SISTEMA,
  TRANSICOES_USUARIO,
  alternarFavorito,
  opcoesLoteImovel,
  podeTransicionarImovel,
  salvarImovel,
  temContratoAtivo,
  transicionarImovel,
  transicionarImoveis,
  transicionarImovelPorContrato,
  transicoesPermitidasImovel,
} from "./estado";
import { transacao } from "../comum/transacao";

const com = (i: Imovel, extra = {}) => baseMinima({ imoveis: [i], ...extra });
const doStatus = (s: StatusImovel) => imovel({ status: s, motivoInativo: s === "inativo" ? "obras" : null });

function dados(over: Partial<DadosImovel> = {}): DadosImovel {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, codigo, status, favorito, motivoInativo, criadoEm, atualizadoEm, ...d } = imovel();
  return { ...d, ...over };
}

describe("imóvel: tabela de transições do usuário (RF-25)", () => {
  const combos = STATUS_IMOVEL.flatMap((de) => STATUS_IMOVEL.map((para) => [de, para] as const));

  it.each(combos)("%s → %s", (de, para) => {
    const i = doStatus(de);
    const base = com(i);
    const permitida = de !== para && TRANSICOES_USUARIO[de].includes(para);
    const p = podeTransicionarImovel(base, i, para);
    expect(p.ok).toBe(permitida);
    const motivo = para === "inativo" ? "motivo" : undefined;
    if (permitida) {
      const m = transicionarImovel(base, i.id, para, CTX, motivo);
      expect(m.resultado.status).toBe(para);
    } else {
      expect(() => transicionarImovel(base, i.id, para, CTX, motivo)).toThrow(TransicaoInvalida);
    }
  });

  it("a tabela do usuário não contém vendido/alugado como destino; sistema só via contrato", () => {
    for (const s of STATUS_IMOVEL) {
      expect(TRANSICOES_USUARIO[s]).not.toContain("vendido");
      expect(TRANSICOES_USUARIO[s]).not.toContain("alugado");
    }
    expect(TRANSICOES_SISTEMA.disponivel).toEqual(["vendido", "alugado"]);
  });

  it("vendido/alugado recusados com mensagem específica", () => {
    const i = imovel();
    for (const para of ["vendido", "alugado"] as const) {
      const p = podeTransicionarImovel(com(i), i, para);
      expect(p).toEqual({ ok: false, motivo: "Vendido e alugado só via contrato." });
      expect(() => transicionarImovel(com(i), i.id, para, CTX)).toThrow("Vendido e alugado só via contrato.");
    }
  });

  it("mesmo status é negado", () => {
    const i = imovel();
    expect(podeTransicionarImovel(com(i), i, "disponivel")).toEqual({
      ok: false,
      motivo: "O imóvel já está nesse status.",
    });
  });

  it("transicoesPermitidasImovel: exigeMotivo só para inativo", () => {
    expect(transicoesPermitidasImovel(com(imovel()), imovel())).toEqual([
      { para: "reservado", exigeMotivo: false },
      { para: "inativo", exigeMotivo: true },
    ]);
    expect(transicoesPermitidasImovel(com(doStatus("vendido")), doStatus("vendido"))).toEqual([]);
  });

  it("imóvel inexistente lança OperacaoInvalida", () => {
    expect(() => transicionarImovel(baseMinima(), "imv_x", "reservado", CTX)).toThrow(OperacaoInvalida);
  });
});

describe("imóvel: inativo e motivo (RF-49)", () => {
  it("inativar exige motivo (ausente ou em branco lança)", () => {
    const base = com(imovel());
    expect(() => transicionarImovel(base, "imv_a", "inativo", CTX)).toThrow(TransicaoInvalida);
    expect(() => transicionarImovel(base, "imv_a", "inativo", CTX, "   ")).toThrow(TransicaoInvalida);
  });

  it("grava motivoInativo aparado; sair limpa", () => {
    const m = transicionarImovel(com(imovel()), "imv_a", "inativo", CTX, "  em obras ");
    expect(m.resultado.motivoInativo).toBe("em obras");
    const volta = transicionarImovel(m.base, "imv_a", "disponivel", CTX);
    expect(volta.resultado.motivoInativo).toBeNull();
  });

  it("outros destinos ignoram motivo informado", () => {
    const m = transicionarImovel(com(imovel()), "imv_a", "reservado", CTX, "qualquer");
    expect(m.resultado.motivoInativo).toBeNull();
  });
});

describe("imóvel: efeitos e guard de contrato ativo", () => {
  it("Atividade statusAlterado e registro `status`", () => {
    const m = transicionarImovel(com(imovel()), "imv_a", "reservado", CTX);
    expect(m.base.atividades[0]).toMatchObject({
      tipo: "statusAlterado",
      alvo: { tipo: "imovel", id: "imv_a" },
      dados: { de: "disponivel", para: "reservado", motivo: null, origem: "usuario" },
    });
    expect(m.base.alteracoes).toHaveLength(1);
    expect(m.base.alteracoes[0]).toMatchObject({
      campo: "status",
      de: "disponivel",
      para: "reservado",
      autorId: CTX.autorId,
    });
  });

  it("contrato ativo bloqueia transição do usuário", () => {
    const i = imovel();
    const base = com(i, { contratos: [contrato({ status: "ativo" })] });
    expect(temContratoAtivo(base, "imv_a")).toBe(true);
    expect(podeTransicionarImovel(base, i, "reservado").ok).toBe(false);
    expect(() => transicionarImovel(base, "imv_a", "reservado", CTX)).toThrow(TransicaoInvalida);
    expect(transicoesPermitidasImovel(base, i)).toEqual([]);
  });

  it("contrato não ativo (rascunho/encerrado/cancelado) não bloqueia", () => {
    const i = imovel();
    for (const status of ["rascunho", "encerrado"] as const) {
      expect(temContratoAtivo(com(i, { contratos: [contrato({ status })] }), "imv_a")).toBe(false);
    }
  });

  it("desfazer restaura o imóvel", () => {
    const base = com(imovel());
    const m = transicionarImovel(base, "imv_a", "inativo", CTX, "x");
    const d = m.desfazer(m.base, CTX_DEPOIS);
    expect(d.base.imoveis).toEqual(base.imoveis);
    expect(d.base.atividades).toEqual([]);
  });

  it("transicionarImovelPorContrato aceita só transições de sistema", () => {
    const base = com(imovel());
    const ok = transacao(base, CTX, (t) => transicionarImovelPorContrato(t, "imv_a", "vendido", "ctr_a"));
    expect(ok.base.imoveis[0]!.status).toBe("vendido");
    expect(ok.base.atividades[0]!.dados).toMatchObject({ origem: "ctr_a" });
    expect(() => transacao(base, CTX, (t) => transicionarImovelPorContrato(t, "imv_a", "inativo", "ctr_a"))).toThrow(
      TransicaoInvalida,
    );
  });
});

describe("transicionarImoveis em lote (RF-49)", () => {
  const lote = () =>
    baseMinima({
      imoveis: [
        imovel({ id: "imv_a", codigo: "AT-0001" }),
        imovel({ id: "imv_b", codigo: "AT-0002" }),
        imovel({ id: "imv_c", codigo: "AT-0003", status: "vendido" }),
        imovel({ id: "imv_d", codigo: "AT-0004", status: "reservado" }),
      ],
    });

  it("separa alterados e recusados com motivo", () => {
    const m = transicionarImoveis(lote(), ["imv_a", "imv_b", "imv_c", "imv_d"], "reservado", CTX);
    expect(m.resultado.alterados).toEqual(["imv_a", "imv_b"]);
    expect(m.resultado.recusados.map((r) => r.id)).toEqual(["imv_c", "imv_d"]);
    expect(m.resultado.recusados.every((r) => r.motivo.length > 0)).toBe(true);
    expect(m.base.imoveis.map((i) => i.status)).toEqual(["reservado", "reservado", "vendido", "reservado"]);
    expect(m.base.atividades).toHaveLength(2);
    expect(m.base.alteracoes).toHaveLength(2);
  });

  it("inativar em lote sem motivo recusa todos", () => {
    const m = transicionarImoveis(lote(), ["imv_a", "imv_b"], "inativo", CTX);
    expect(m.resultado.alterados).toEqual([]);
    expect(m.resultado.recusados).toHaveLength(2);
  });

  it("com motivo, todos inativam e gravam motivoInativo", () => {
    const m = transicionarImoveis(lote(), ["imv_a", "imv_b"], "inativo", CTX, "limpeza");
    expect(m.base.imoveis.slice(0, 2).map((i) => i.motivoInativo)).toEqual(["limpeza", "limpeza"]);
  });

  it("um único desfazer reverte todos", () => {
    const base = lote();
    const m = transicionarImoveis(base, ["imv_a", "imv_b"], "reservado", CTX);
    const d = m.desfazer(m.base, CTX_DEPOIS);
    expect(d.base.imoveis).toEqual(base.imoveis);
    expect(d.base.atividades).toEqual([]);
  });

  it("id inexistente entra em recusados sem abortar o lote", () => {
    const m = transicionarImoveis(lote(), ["imv_x"], "reservado", CTX);
    expect(m.resultado.recusados).toEqual([{ id: "imv_x", motivo: "Imóvel não encontrado." }]);
  });
});

describe("salvarImovel (RF-27)", () => {
  it("cria: status disponivel, código AT-NNNN, favorito false, atividade imovelCriado", () => {
    const base = baseMinima({ imoveis: [] });
    const m = salvarImovel(base, dados(), CTX);
    expect(m.resultado).toMatchObject({
      status: "disponivel",
      codigo: "AT-0001",
      favorito: false,
      motivoInativo: null,
      criadoEm: CTX.agora,
      atualizadoEm: CTX.agora,
    });
    expect(m.resultado.id).toMatch(/^imv_/);
    expect(m.base.atividades).toHaveLength(1);
    expect(m.base.atividades[0]).toMatchObject({ tipo: "imovelCriado", dados: { codigo: "AT-0001" } });
    expect(m.base.alteracoes).toEqual([]);
  });

  it("código segue a contagem de imóveis existentes", () => {
    const m = salvarImovel(baseMinima(), dados(), CTX);
    expect(m.resultado.codigo).toBe("AT-0002");
  });

  it("criar ignora status vindo nos dados", () => {
    const m = salvarImovel(baseMinima(), { ...dados(), status: "vendido" } as DadosImovel, CTX);
    expect(m.resultado.status).toBe("disponivel");
  });

  it("edita preço: atividade precoAlterado e registro `preco`", () => {
    const m = salvarImovel(com(imovel()), { ...dados({ preco: 35_000_000 }), id: "imv_a" }, CTX);
    expect(m.resultado.preco).toBe(35_000_000);
    expect(m.base.atividades).toHaveLength(1);
    expect(m.base.atividades[0]).toMatchObject({
      tipo: "precoAlterado",
      dados: { campo: "preco", de: 30_000_000, para: 35_000_000 },
    });
    expect(m.base.alteracoes).toHaveLength(1);
    expect(m.base.alteracoes[0]).toMatchObject({ campo: "preco", de: 30_000_000, para: 35_000_000 });
  });

  it("condomínio e IPTU também geram atividade e registro", () => {
    const m = salvarImovel(com(imovel()), { ...dados({ condominio: 1, iptu: null }), id: "imv_a" }, CTX);
    expect(m.base.atividades.map((a) => a.dados.campo)).toEqual(["condominio", "iptu"]);
    expect(m.base.alteracoes.map((a) => a.campo).sort()).toEqual(["condominio", "iptu"]);
  });

  it("editar outro campo não gera atividade nem registro, e preserva status/favorito/código", () => {
    const i = imovel({ status: "reservado", favorito: true });
    const m = salvarImovel(com(i), { ...dados({ titulo: "Outro título" }), id: "imv_a" }, CTX);
    expect(m.base.atividades).toEqual([]);
    expect(m.base.alteracoes).toEqual([]);
    expect(m.resultado).toMatchObject({
      status: "reservado",
      favorito: true,
      codigo: "AT-0001",
      titulo: "Outro título",
    });
  });

  it("mudar finalidade com contrato ativo lança OperacaoInvalida", () => {
    const base = com(imovel({ status: "vendido" }), { contratos: [contrato({ status: "ativo" })] });
    expect(() => salvarImovel(base, { ...dados({ finalidade: "locacao" }), id: "imv_a" }, CTX)).toThrow(
      OperacaoInvalida,
    );
  });

  it("desfazer da edição restaura o imóvel", () => {
    const base = com(imovel());
    const m = salvarImovel(base, { ...dados({ preco: 1 }), id: "imv_a" }, CTX);
    expect(m.desfazer(m.base, CTX_DEPOIS).base.imoveis).toEqual(base.imoveis);
  });

  describe("validação Zod", () => {
    it("areaUtil > areaTotal", () => {
      expect(() => salvarImovel(baseMinima(), dados({ areaUtil: 200, areaTotal: 100 }), CTX)).toThrow(/Área útil/);
    });
    it("suítes > quartos", () => {
      expect(() => salvarImovel(baseMinima(), dados({ quartos: 1, suites: 2 }), CTX)).toThrow(/Suítes/);
    });
    it("terreno com quartos", () => {
      expect(() =>
        salvarImovel(baseMinima(), dados({ tipo: "terreno", quartos: 2, suites: 0, comodos: [] }), CTX),
      ).toThrow(/Terreno/);
    });
    it("terreno válido: sem quartos, vagas, cômodos e condomínio", () => {
      const t = dados({
        tipo: "terreno",
        quartos: 0,
        suites: 0,
        banheiros: 0,
        vagas: 0,
        comodos: [],
        condominio: null,
      });
      expect(salvarImovel(baseMinima(), t, CTX).resultado.tipo).toBe("terreno");
    });
    it("não-terreno sem cômodos", () => {
      expect(() => salvarImovel(baseMinima(), dados({ comodos: [] }), CTX)).toThrow(/cômodo/);
    });
    it("preço zero", () => {
      expect(() => salvarImovel(baseMinima(), dados({ preco: 0 }), CTX)).toThrow();
    });
    it("nada é gravado quando a validação falha", () => {
      const base = baseMinima();
      expect(() => salvarImovel(base, dados({ areaUtil: 999 }), CTX)).toThrow();
      expect(base.imoveis).toHaveLength(1);
    });
  });
});

describe("alternarFavorito (RF-28)", () => {
  it("alterna e desfazer restaura", () => {
    const base = com(imovel());
    const m = alternarFavorito(base, "imv_a", CTX);
    expect(m.resultado.favorito).toBe(true);
    expect(m.base.alteracoes).toEqual([]);
    const m2 = alternarFavorito(m.base, "imv_a", CTX);
    expect(m2.resultado.favorito).toBe(false);
    expect(m.desfazer(m.base, CTX_DEPOIS).base.imoveis).toEqual(base.imoveis);
  });
});

describe("opcoesLoteImovel (RF-49)", () => {
  it("permite o destino se ao menos um aceita, soma os aplicáveis e herda exigeMotivo", () => {
    const disp = transicoesPermitidasImovel(baseMinima(), imovel({ status: "disponivel" }));
    const inat = transicoesPermitidasImovel(baseMinima(), imovel({ status: "inativo" }));
    const op = Object.fromEntries(opcoesLoteImovel([disp, inat]).map((o) => [o.para, o]));
    expect(op.reservado).toMatchObject({ aplicaveis: 1, permissao: { ok: true } });
    expect(op.disponivel).toMatchObject({ aplicaveis: 1, permissao: { ok: true } });
    expect(op.inativo).toMatchObject({ aplicaveis: 1, exigeMotivo: true });
  });
  it("nenhum aceita: negado com motivo", () => {
    const vendido = transicoesPermitidasImovel(baseMinima(), imovel({ status: "vendido" }));
    expect(opcoesLoteImovel([vendido]).every((o) => !o.permissao.ok)).toBe(true);
  });
});
