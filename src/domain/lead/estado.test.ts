import { describe, expect, it } from "vitest";
import { OperacaoInvalida } from "../comum/tipos";
import { validarBase } from "../invariantes";
import { baseMinima, CTX, imovel, lead, negociacao } from "../teste/fabrica";
import { adicionarNota, alterarOrcamento, criarLead } from "./estado";

const baseCom = (l = lead()) => baseMinima({ leads: [l] });

describe("criarLead (RF-35): lead + 1ª negociação na mesma transação", () => {
  const dados = {
    nome: "Maria Souza",
    contato: { telefone: "11977776666" },
    origem: "portal" as const,
    responsavelId: "cor_b",
  };

  it("cria o lead com padrões e a negociação em novo, no fim da coluna, sem imóvel", () => {
    const base = baseMinima({ negociacoes: [negociacao(), negociacao({ id: "neg_b", imovelId: null, ordem: 1 })] });
    const m = criarLead(base, dados, CTX);
    expect(m.resultado).toMatchObject({
      orcamento: null,
      imoveisVistos: [],
      criadoEm: CTX.agora,
      interesse: { finalidade: "venda", tipos: [], bairros: [] },
    });
    expect(m.resultado.id).toMatch(/^lead_/);
    const nova = m.base.negociacoes.find((n) => n.leadId === m.resultado.id)!;
    expect(nova).toMatchObject({ etapa: "novo", ordem: 2, imovelId: null, responsavelId: "cor_b", motivoPerda: null });
    expect(m.base.alteracoes).toEqual([]);
    expect(validarBase(m.base)).toEqual([]);
  });

  it("aceita o imóvel da 1ª negociação; imóvel inexistente desfaz tudo", () => {
    const m = criarLead(baseMinima(), { ...dados, imovelId: "imv_a" }, CTX);
    expect(m.base.negociacoes.find((n) => n.leadId === m.resultado.id)!.imovelId).toBe("imv_a");
    expect(() => criarLead(baseMinima(), { ...dados, imovelId: "imv_x" }, CTX)).toThrow(OperacaoInvalida);
  });

  it("dados inválidos lançam; desfazer remove lead e negociação", () => {
    expect(() => criarLead(baseMinima(), { ...dados, nome: "x" }, CTX)).toThrow();
    const base = baseMinima({ imoveis: [imovel()] });
    const m = criarLead(base, dados, CTX);
    const d = m.desfazer(m.base, CTX).base;
    expect(d.leads).toEqual(base.leads);
    expect(d.negociacoes).toEqual(base.negociacoes);
  });
});

describe("alterarOrcamento (valor monetário monitorado)", () => {
  it("gera registro `orcamento` de→para", () => {
    const m = alterarOrcamento(baseCom(lead({ orcamento: 100 })), "lead_a", 200, CTX);
    expect(m.base.alteracoes).toHaveLength(1);
    expect(m.base.alteracoes[0]).toMatchObject({ campo: "orcamento", de: 100, para: 200, autorId: CTX.autorId });
    expect(m.base.leads[0]!.atualizadoEm).toBe(CTX.agora);
  });

  it("null → valor e valor → null também registram; igual não registra; negativo é recusado", () => {
    const a = alterarOrcamento(baseCom(lead({ orcamento: null })), "lead_a", 5, CTX);
    expect(a.base.alteracoes[0]).toMatchObject({ de: null, para: 5 });
    const b = alterarOrcamento(a.base, "lead_a", null, CTX);
    expect(b.base.alteracoes.at(-1)).toMatchObject({ de: 5, para: null });
    expect(alterarOrcamento(baseCom(lead({ orcamento: 5 })), "lead_a", 5, CTX).base.alteracoes).toEqual([]);
    expect(() => alterarOrcamento(baseMinima(), "lead_a", -1, CTX)).toThrow();
  });
});

describe("adicionarNota", () => {
  it("grava Atividade nota com texto aparado", () => {
    const m = adicionarNota(baseCom(), "lead_a", "  ligou  ", CTX);
    expect(m.base.atividades[0]).toMatchObject({
      tipo: "nota",
      alvo: { tipo: "lead", id: "lead_a" },
      dados: { texto: "ligou" },
    });
  });

  it("nota vazia ou só espaços lança OperacaoInvalida; lead inexistente também", () => {
    expect(() => adicionarNota(baseCom(), "lead_a", "", CTX)).toThrow(OperacaoInvalida);
    expect(() => adicionarNota(baseCom(), "lead_a", "   ", CTX)).toThrow(OperacaoInvalida);
    expect(() => adicionarNota(baseCom(), "lead_x", "oi", CTX)).toThrow(OperacaoInvalida);
  });
});
