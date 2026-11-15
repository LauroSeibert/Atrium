import { describe, expect, it } from "vitest";
import type { Base } from "./comum/base";
import { gerarParcelas } from "./contrato/estado";
import { validarBase } from "./invariantes";
import { baseMinima, contrato, imovel, lead } from "./teste/fabrica";

/** Base válida com venda ativa: imóvel vendido, lead fechado vinculado, parcelas somando o valor. */
function baseComVenda(): Base {
  const c = contrato({ status: "ativo", leadId: "lead_a", parcelas: gerarParcelas(contrato(), 3) });
  return baseMinima({
    imoveis: [imovel({ status: "vendido" })],
    leads: [lead({ etapa: "fechado" })],
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

  it("leadId de lead não fechado", () => {
    const b = baseComVenda();
    const erros = validarBase({ ...b, leads: [lead({ etapa: "proposta" })] });
    contem(erros, "lead vinculado não está fechado");
  });

  it("leadId inexistente", () => {
    const b = baseComVenda();
    contem(validarBase({ ...b, leads: [] }), "lead vinculado não está fechado");
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

  it("motivoPerda fora de perdido", () => {
    const b = baseMinima({ leads: [lead({ etapa: "novo", motivoPerda: "preco" })] });
    contem(validarBase(b), /lead lead_a/);
  });

  it("perdido sem motivoPerda", () => {
    const b = baseMinima({ leads: [lead({ etapa: "perdido", motivoPerda: null })] });
    contem(validarBase(b), /lead lead_a/);
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
