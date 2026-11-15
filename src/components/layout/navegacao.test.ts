import { describe, expect, it } from "vitest";
import { rotaAtiva, rotaDaEntidade, trilhaDaRota } from "./navegacao";

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
  });
});
