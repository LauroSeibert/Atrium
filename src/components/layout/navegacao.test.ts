import { describe, expect, it } from "vitest";
import {
  ehGrupo,
  ehSubmenu,
  grupoAtivo,
  itemAtivo,
  itensFolha,
  NAV_FOLHAS,
  NAV_PRINCIPAL,
  rotaAtiva,
  rotaDaEntidade,
  submenuAtivo,
  trilhaDaRota,
} from "./navegacao";

describe("rotaAtiva (RF-01)", () => {
  it('"/" só é ativo na raiz', () => {
    expect(rotaAtiva("/", "/")).toBe(true);
    expect(rotaAtiva("/imoveis", "/")).toBe(false);
  });
  it("ativa o módulo nas sub-rotas, mas não em prefixos parecidos", () => {
    expect(rotaAtiva("/imoveis", "/imoveis")).toBe(true);
    expect(rotaAtiva("/imoveis/x", "/imoveis")).toBe(true);
    expect(rotaAtiva("/imoveisx", "/imoveis")).toBe(false);
    expect(rotaAtiva("/leads", "/imoveis")).toBe(false);
  });
});

describe("rotaAtiva com exato e submenu (RF-01)", () => {
  const financeiro = NAV_PRINCIPAL.find(ehSubmenu)!;
  const visaoGeral = financeiro.filhos[0]!;
  const receitas = financeiro.filhos[1]!;

  it("Visão geral só é ativa na rota exata", () => {
    expect(rotaAtiva("/financeiro", "/financeiro", true)).toBe(true);
    expect(rotaAtiva("/financeiro/receitas", "/financeiro", true)).toBe(false);
    expect(itemAtivo("/financeiro", visaoGeral)).toBe(true);
    expect(itemAtivo("/financeiro/receitas", visaoGeral)).toBe(false);
    expect(itemAtivo("/financeiro/receitas", receitas)).toBe(true);
  });
  it("o pai fica ativo quando algum filho está", () => {
    expect(submenuAtivo("/financeiro", financeiro)).toBe(true);
    expect(submenuAtivo("/financeiro/repasses", financeiro)).toBe(true);
    expect(submenuAtivo("/contratos", financeiro)).toBe(false);
  });
  it("o grupo contém a rota atual", () => {
    const operacao = NAV_PRINCIPAL.filter(ehGrupo).find((g) => g.rotulo === "Operação")!;
    expect(grupoAtivo("/imoveis/AT-0042", operacao)).toBe(true);
    expect(grupoAtivo("/leads", operacao)).toBe(false);
  });
});

describe("lista achatada para a paleta", () => {
  it("segue a árvore do BRIEF-MENU, com Configurações no fim", () => {
    expect(NAV_FOLHAS.map((i) => i.href)).toEqual([
      "/",
      "/leads",
      "/agenda",
      "/contatos",
      "/imoveis",
      "/anuncios",
      "/contratos",
      "/financeiro",
      "/financeiro/receitas",
      "/financeiro/despesas",
      "/financeiro/comissoes",
      "/financeiro/repasses",
      "/relatorios",
      "/configuracoes",
    ]);
  });
  it("filhos do submenu levam o nome do pai; os demais, o próprio rótulo", () => {
    const rotulos = Object.fromEntries(NAV_FOLHAS.map((i) => [i.href, i.rotuloCompleto]));
    expect(rotulos["/financeiro/receitas"]).toBe("Financeiro › Receitas");
    expect(rotulos["/financeiro"]).toBe("Financeiro › Visão geral");
    expect(rotulos["/agenda"]).toBe("Agenda");
  });
  it("mantém os contadores nos itens certos", () => {
    const chaves = Object.fromEntries(NAV_FOLHAS.filter((i) => i.contador).map((i) => [i.href, i.contador!.chave]));
    expect(chaves).toEqual({ "/leads": "leadsNovos", "/contratos": "parcelasAtrasadas" });
  });
  it("itensFolha ignora entradas sem links próprios", () => {
    expect(itensFolha([])).toEqual([]);
  });
});

describe("trilhaDaRota (RF-61)", () => {
  it.each([
    ["/", ["Dashboard"]],
    ["/imoveis", ["Imóveis"]],
    ["/imoveis/novo", ["Imóveis", "Novo imóvel"]],
    ["/imoveis/imv_1", ["Imóveis", "Imóvel"]],
    ["/imoveis/imv_1/editar", ["Imóveis", "Imóvel", "Editar"]],
    ["/leads", ["Leads"]],
    ["/leads/lead_1", ["Leads", "Lead"]],
    ["/contratos", ["Contratos"]],
    ["/contratos/ctr_1", ["Contratos", "Contrato"]],
    ["/financeiro", ["Financeiro"]],
    ["/financeiro/receitas", ["Financeiro", "Receitas"]],
    ["/financeiro/despesas", ["Financeiro", "Despesas"]],
    ["/financeiro/comissoes", ["Financeiro", "Comissões"]],
    ["/financeiro/repasses", ["Financeiro", "Repasses"]],
    ["/agenda", ["Agenda"]],
    ["/contatos", ["Contatos"]],
    ["/anuncios", ["Anúncios"]],
    ["/relatorios", ["Relatórios"]],
    ["/configuracoes", ["Configurações"]],
    ["/design-system/colors", ["Design system", "Cores"]],
    ["/design-system/illustrations", ["Design system", "Ilustrações"]],
  ])("%s", (rota, rotulos) => {
    const trilha = trilhaDaRota(rota);
    expect(trilha.map((i) => i.rotulo)).toEqual(rotulos);
    expect(trilha.at(-1)!.href).toBeUndefined();
  });

  it("os itens intermediários têm href acumulado", () => {
    expect(trilhaDaRota("/imoveis/imv_1/editar")).toEqual([
      { rotulo: "Imóveis", href: "/imoveis" },
      { rotulo: "Imóvel", href: "/imoveis/imv_1" },
      { rotulo: "Editar" },
    ]);
  });

  it("rotuloAtual substitui o rótulo do item do id, inclusive em /editar", () => {
    expect(trilhaDaRota("/imoveis/imv_1", "IMV-0012").map((i) => i.rotulo)).toEqual(["Imóveis", "IMV-0012"]);
    expect(trilhaDaRota("/imoveis/imv_1/editar", "IMV-0012").map((i) => i.rotulo)).toEqual([
      "Imóveis",
      "IMV-0012",
      "Editar",
    ]);
  });

  it("design-system não tem href no primeiro item", () => {
    expect(trilhaDaRota("/design-system/colors")[0]).toEqual({ rotulo: "Design system", href: undefined });
  });
});

describe("rotaDaEntidade", () => {
  it("monta a rota por tipo", () => {
    expect(rotaDaEntidade({ tipo: "imovel", id: "imv_1" })).toBe("/imoveis/imv_1");
    expect(rotaDaEntidade({ tipo: "lead", id: "lead_1" })).toBe("/leads/lead_1");
    expect(rotaDaEntidade({ tipo: "contrato", id: "ctr_1" })).toBe("/contratos/ctr_1");
    expect(rotaDaEntidade({ tipo: "despesa", id: "dsp_1" })).toBe("/financeiro/despesas");
    expect(rotaDaEntidade({ tipo: "anuncio", id: "anc_1" })).toBe("/anuncios");
    expect(rotaDaEntidade({ tipo: "negociacao", id: "neg_1" })).toBe("/leads");
  });
});
