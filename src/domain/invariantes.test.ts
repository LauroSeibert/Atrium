import { describe, expect, it } from "vitest";
import type { Base } from "./comum/base";
import { gerarParcelas } from "./contrato/estado";
import { validarBase } from "./invariantes";
import { anuncio, baseMinima, contato, contrato, despesa, documento, imovel, lead, negociacao } from "./teste/fabrica";

/** Base válida com venda ativa: imóvel vendido, negociação fechada vinculada, parcelas somando o valor. */
function baseComVenda(): Base {
  const c = contrato({ status: "ativo", negociacaoId: "neg_a", parcelas: gerarParcelas(contrato(), 3) });
  return baseMinima({
    imoveis: [imovel({ status: "vendido" })],
    negociacoes: [negociacao({ etapa: "fechado" })],
    contratos: [c],
  });
}

const contem = (erros: string[], trecho: string | RegExp) =>
  expect(erros.some((e) => (typeof trecho === "string" ? e.includes(trecho) : trecho.test(e)))).toBe(true);

describe("validarBase: bases válidas", () => {
  it("base mínima válida retorna []", () => {
    expect(validarBase(baseMinima())).toEqual([]);
  });

  it("base com venda ativa coerente retorna []", () => {
    expect(validarBase(baseComVenda())).toEqual([]);
  });
});

describe("validarBase: cada invariante quebrada gera erro (MODELO §3)", () => {
  it("imóvel alugado sem contrato ativo", () => {
    const erros = validarBase(baseMinima({ imoveis: [imovel({ status: "alugado" })] }));
    contem(erros, "alugado sem contrato ativo");
  });

  it("imóvel vendido sem contrato de venda", () => {
    contem(validarBase(baseMinima({ imoveis: [imovel({ status: "vendido" })] })), "vendido sem contrato de venda");
  });

  it("contrato com tipo ≠ finalidade do imóvel", () => {
    const b = baseMinima({ contratos: [contrato({ tipo: "locacao", taxaAdministracao: 10 })] });
    contem(validarBase(b), "tipo ≠ finalidade");
  });

  it("negociacaoId de negociação não fechada", () => {
    const b = baseComVenda();
    const erros = validarBase({ ...b, negociacoes: [negociacao({ etapa: "proposta" })] });
    contem(erros, "negociação vinculada não está fechada");
  });

  it("negociacaoId inexistente", () => {
    const b = baseComVenda();
    contem(validarBase({ ...b, negociacoes: [] }), "negociação vinculada não está fechada");
  });

  it("negociação vinculada de outro imóvel", () => {
    const b = baseComVenda();
    const erros = validarBase({
      ...b,
      imoveis: [...b.imoveis, imovel({ id: "imv_b", codigo: "AT-0002" })],
      negociacoes: [negociacao({ etapa: "fechado", imovelId: "imv_b" })],
    });
    contem(erros, "negociação vinculada é de outro imóvel");
  });

  it("parcelas de venda que não somam o valor", () => {
    const b = baseComVenda();
    const c = b.contratos[0]!;
    const quebrado = { ...c, parcelas: c.parcelas.map((p, i) => (i === 0 ? { ...p, valor: p.valor + 1 } : p)) };
    contem(validarBase({ ...b, contratos: [quebrado] }), "parcelas ≠ valor");
  });

  it("parcela de locação ≠ valor do aluguel", () => {
    const c = contrato({
      tipo: "locacao",
      taxaAdministracao: 10,
      valor: 300_000,
      status: "ativo",
      inicio: "2026-01-01",
      fim: "2026-03-01",
      parcelas: gerarParcelas({ tipo: "locacao", valor: 300_000, inicio: "2026-01-01", fim: "2026-03-01" }).map(
        (p, i) => (i === 1 ? { ...p, valor: 1 } : p),
      ),
    });
    const b = baseMinima({ imoveis: [imovel({ finalidade: "locacao", status: "alugado" })], contratos: [c] });
    contem(validarBase(b), "aluguel ≠ valor da parcela");
  });

  it("rascunho não exige parcelas somando", () => {
    expect(validarBase(baseMinima({ contratos: [contrato({ parcelas: [] })] }))).toEqual([]);
  });

  it("dois contratos ativos no mesmo imóvel", () => {
    const b = baseComVenda();
    const outro = { ...b.contratos[0]!, id: "ctr_b", numero: "CT-2026-0002", leadId: null };
    contem(validarBase({ ...b, contratos: [...b.contratos, outro] }), "mais de um contrato ativo");
  });

  it("imóvel não acompanha o contrato ativo", () => {
    const b = baseComVenda();
    contem(validarBase({ ...b, imoveis: [imovel({ status: "disponivel" })] }), "deveria estar vendido");
  });

  it("motivoPerda fora de perdido (invariante 4)", () => {
    const b = baseMinima({ negociacoes: [negociacao({ etapa: "novo", motivoPerda: "preco" })] });
    contem(validarBase(b), /negociação neg_a/);
  });

  it("perdido sem motivoPerda (invariante 4)", () => {
    const b = baseMinima({ negociacoes: [negociacao({ etapa: "perdido", motivoPerda: null })] });
    contem(validarBase(b), /negociação neg_a/);
  });

  it("fechado sem imóvel", () => {
    contem(validarBase(baseMinima({ negociacoes: [negociacao({ etapa: "fechado", imovelId: null })] })), /neg_a/);
  });

  it("lead sem negociação (invariante 5)", () => {
    contem(validarBase(baseMinima({ negociacoes: [] })), "lead lead_a: sem negociação");
  });

  it("duas negociações abertas do mesmo lead × imóvel (invariante 5); fechada + aberta pode", () => {
    const dup = baseMinima({ negociacoes: [negociacao(), negociacao({ id: "neg_b", etapa: "visita" })] });
    contem(validarBase(dup), "outra negociação aberta");
    const ok = baseMinima({
      negociacoes: [negociacao(), negociacao({ id: "neg_b", etapa: "perdido", motivoPerda: "preco" })],
    });
    expect(validarBase(ok)).toEqual([]);
    const semImovel = baseMinima({
      negociacoes: [negociacao({ imovelId: null }), negociacao({ id: "neg_b", imovelId: null })],
    });
    expect(validarBase(semImovel)).toEqual([]);
  });

  it("dois anúncios não encerrados no mesmo imóvel × canal (invariante 6); publicado com imóvel vendido é aceito", () => {
    const dup = baseMinima({ anuncios: [anuncio(), anuncio({ id: "anc_b" })] });
    contem(validarBase(dup), "outro anúncio não encerrado");
    const encerrado = baseMinima({ anuncios: [anuncio(), anuncio({ id: "anc_b", status: "encerrado" })] });
    expect(validarBase(encerrado)).toEqual([]);
    const b = baseComVenda();
    const vendido = { ...b, anuncios: [anuncio({ status: "publicado", publicadoEm: "2026-01-11T12:00:00.000Z" })] };
    expect(validarBase(vendido)).toEqual([]);
  });

  it("anúncio publicado sem publicadoEm", () => {
    contem(validarBase(baseMinima({ anuncios: [anuncio({ status: "publicado" })] })), /anúncio anc_a/);
  });

  it("inativo sem motivoInativo", () => {
    const b = baseMinima({ imoveis: [imovel({ status: "inativo", motivoInativo: null })] });
    contem(validarBase(b), /imóvel imv_a/);
  });
});

describe("validarBase: integridade referencial e IDs", () => {
  it("ID duplicado entre coleções", () => {
    const b = baseMinima();
    contem(validarBase({ ...b, leads: [lead({ id: "cor_a" })] }), /ID duplicado|lead/);
    contem(validarBase({ ...b, imoveis: [imovel(), imovel()] }), "ID duplicado: imv_a");
  });

  it("código de imóvel duplicado", () => {
    const b = baseMinima({ imoveis: [imovel(), imovel({ id: "imv_b" })] });
    contem(validarBase(b), "Código de imóvel duplicado");
  });

  it("corretor inexistente em imóvel e lead", () => {
    const b = baseMinima({ imoveis: [imovel({ corretorId: "cor_x" })], leads: [lead({ responsavelId: "cor_x" })] });
    const erros = validarBase(b);
    contem(erros, "corretor inexistente");
    contem(erros, "responsável inexistente");
  });

  it("imóvel visto inexistente", () => {
    contem(validarBase(baseMinima({ leads: [lead({ imoveisVistos: ["imv_x"] })] })), "imóvel visto inexistente");
  });

  it("documento, despesa e contato com referências inexistentes (invariante 7)", () => {
    const erros = validarBase(
      baseMinima({
        documentos: [documento({ contratoId: "ctr_x" })],
        despesas: [despesa({ contratoId: "ctr_x" })],
        contatos: [contato({ imovelIds: ["imv_x"], contratoIds: ["ctr_x"] })],
      }),
    );
    contem(erros, "documento doc_a: contrato inexistente");
    contem(erros, "despesa dsp_a: contrato inexistente");
    contem(erros, "contato ctt_a: imóvel inexistente");
    contem(erros, "contato ctt_a: contrato inexistente");
  });

  it("negociação com lead, imóvel ou responsável inexistente", () => {
    const erros = validarBase(
      baseMinima({
        negociacoes: [
          negociacao(),
          negociacao({ id: "neg_b", leadId: "lead_x", imovelId: "imv_x", responsavelId: "cor_x" }),
        ],
      }),
    );
    contem(erros, "negociação neg_b: lead inexistente");
    contem(erros, "negociação neg_b: imóvel inexistente");
    contem(erros, "negociação neg_b: responsável inexistente");
  });

  it("contrato com imóvel inexistente", () => {
    contem(validarBase(baseMinima({ contratos: [contrato({ imovelId: "imv_x" })] })), "imóvel inexistente");
  });

  it("pagamento antes do início do contrato", () => {
    const b = baseComVenda();
    const c = b.contratos[0]!;
    const parcelas = c.parcelas.map((p, i) => (i === 0 ? { ...p, pagoEm: "2026-01-05T12:00:00.000Z" } : p));
    contem(validarBase({ ...b, contratos: [{ ...c, parcelas }] }), "pagamento antes do início");
  });

  it("comissão ≠ base × percentual", () => {
    const b = baseComVenda();
    const c = b.contratos[0]!;
    const comissoes = [
      { corretorId: "cor_a", percentual: 6, base: 100, valor: 7, competencia: "2026-12", pagaEm: null },
    ];
    contem(validarBase({ ...b, contratos: [{ ...c, comissoes }] }), "comissão ≠ base × percentual");
  });

  it("autor inexistente em atividade/registro", () => {
    const b = baseMinima({
      alteracoes: [
        {
          id: "alt_0001",
          em: "2026-11-14T13:00:00.000Z",
          autorId: "cor_x",
          entidade: { tipo: "imovel", id: "imv_a" },
          campo: "preco",
          de: 1,
          para: 2,
        },
      ],
    });
    contem(validarBase(b), "autor inexistente");
  });
});
