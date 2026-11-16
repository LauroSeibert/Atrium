import { describe, expect, it } from "vitest";
import { OperacaoInvalida } from "../comum/tipos";
import { validarBase } from "../invariantes";
import { baseMinima, contrato, CTX, CTX_DEPOIS } from "../teste/fabrica";
import { salvarContato } from "./operacoes";

const dados = (over = {}) => ({
  nome: "Cartório Teste",
  papel: "cartorio" as const,
  telefone: "1133334444",
  imovelIds: ["imv_a"],
  contratoIds: [],
  ...over,
});

describe("salvarContato (RF-74)", () => {
  it("cria com id ctt_, sem registro de alteração; desfazer remove", () => {
    const base = baseMinima();
    const m = salvarContato(base, dados(), CTX);
    expect(m.resultado.id).toMatch(/^ctt_/);
    expect(m.base.contatos).toHaveLength(1);
    expect(m.base.alteracoes).toEqual([]);
    expect(validarBase(m.base)).toEqual([]);
    expect(m.desfazer(m.base, CTX_DEPOIS).base.contatos).toEqual([]);
  });

  it("edita preservando criadoEm; campo opcional omitido é apagado; vínculos sem duplicata", () => {
    const criado = salvarContato(baseMinima({ contratos: [contrato()] }), dados(), CTX);
    const id = criado.resultado.id;
    const m = salvarContato(
      criado.base,
      { ...dados({ telefone: undefined, contratoIds: ["ctr_a", "ctr_a"] }), id, nome: "Novo nome" },
      CTX_DEPOIS,
    );
    expect(m.resultado).toMatchObject({ id, nome: "Novo nome", criadoEm: CTX.agora, contratoIds: ["ctr_a"] });
    expect(m.resultado.telefone).toBeUndefined();
    expect(m.resultado.atualizadoEm).toBe(CTX_DEPOIS.agora);
  });

  it("vínculo com imóvel ou contrato inexistente é recusado; dados inválidos lançam", () => {
    expect(() => salvarContato(baseMinima(), dados({ imovelIds: ["imv_x"] }), CTX)).toThrow(OperacaoInvalida);
    expect(() => salvarContato(baseMinima(), dados({ contratoIds: ["ctr_x"] }), CTX)).toThrow(OperacaoInvalida);
    expect(() => salvarContato(baseMinima(), dados({ nome: "" }), CTX)).toThrow();
    expect(() => salvarContato(baseMinima(), dados({ telefone: "123" }), CTX)).toThrow();
  });
});
