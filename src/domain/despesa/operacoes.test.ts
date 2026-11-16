import { describe, expect, it } from "vitest";
import { OperacaoInvalida } from "../comum/tipos";
import { validarBase } from "../invariantes";
import { baseMinima, contrato, CTX, CTX_DEPOIS, despesa } from "../teste/fabrica";
import {
  lancarDespesa,
  podeEditarDespesa,
  podePagarDespesa,
  registrarPagamentoDespesa,
  salvarDespesa,
  statusDespesa,
} from "./operacoes";

const dados = (over = {}) => ({
  categoria: "cartorio" as const,
  descricao: "Registro da escritura",
  valor: 250_000,
  vencimento: "2026-11-30",
  contratoId: null,
  ...over,
});

describe("statusDespesa (derivado, ESTADOS §3.9)", () => {
  it("paga, atrasada (hoje > vencimento) e a vencer (inclusive no dia)", () => {
    expect(statusDespesa(despesa({ pagaEm: CTX.agora }), CTX.agora)).toBe("paga");
    expect(statusDespesa(despesa({ vencimento: "2026-11-13" }), CTX.agora)).toBe("atrasada");
    expect(statusDespesa(despesa({ vencimento: "2026-11-14" }), CTX.agora)).toBe("aVencer");
  });
});

describe("lançar e editar (RF-78)", () => {
  it("lança sem pagaEm, sem registro; desfazer remove", () => {
    const m = lancarDespesa(baseMinima(), dados(), CTX);
    expect(m.resultado).toMatchObject({ pagaEm: null, criadoEm: CTX.agora, valor: 250_000 });
    expect(m.resultado.id).toMatch(/^dsp_/);
    expect(m.base.alteracoes).toEqual([]);
    expect(validarBase(m.base)).toEqual([]);
    expect(m.desfazer(m.base, CTX).base.despesas).toEqual([]);
  });

  it("editar valor registra a alteração; contrato inexistente é recusado", () => {
    const b = baseMinima({ despesas: [despesa()], contratos: [contrato()] });
    const m = salvarDespesa(b, { ...dados({ valor: 1_000_000, contratoId: "ctr_a" }), id: "dsp_a" }, CTX);
    expect(m.resultado).toMatchObject({ valor: 1_000_000, contratoId: "ctr_a", pagaEm: null });
    expect(m.base.alteracoes).toEqual([
      expect.objectContaining({
        campo: "valor",
        de: 900_000,
        para: 1_000_000,
        entidade: { tipo: "despesa", id: "dsp_a" },
      }),
    ]);
    expect(() => salvarDespesa(b, dados({ contratoId: "ctr_x" }), CTX)).toThrow(OperacaoInvalida);
    expect(() => salvarDespesa(b, dados({ valor: 0 }), CTX)).toThrow();
  });

  it("paga não pode ser editada", () => {
    const paga = despesa({ pagaEm: CTX.agora });
    expect(podeEditarDespesa(paga).ok).toBe(false);
    expect(() => salvarDespesa(baseMinima({ despesas: [paga] }), { ...dados(), id: "dsp_a" }, CTX)).toThrow(
      "Despesa paga não pode ser editada.",
    );
  });
});

describe("registrarPagamentoDespesa", () => {
  it("grava pagaEm com registro; com contrato gera Atividade despesaPaga; desfazer volta", () => {
    const b = baseMinima({ contratos: [contrato()], despesas: [despesa({ contratoId: "ctr_a" })] });
    const m = registrarPagamentoDespesa(b, "dsp_a", CTX);
    expect(m.resultado.pagaEm).toBe(CTX.agora);
    expect(m.base.alteracoes).toEqual([expect.objectContaining({ campo: "pagaEm", de: null, para: CTX.agora })]);
    expect(m.base.atividades[0]).toMatchObject({ tipo: "despesaPaga", alvo: { tipo: "contrato", id: "ctr_a" } });
    const d = m.desfazer(m.base, CTX_DEPOIS);
    expect(d.base.despesas).toEqual(b.despesas);
    expect(d.base.alteracoes.at(-1)).toMatchObject({ campo: "pagaEm", de: CTX.agora, para: null });
  });

  it("sem contrato: Atividade com a própria despesa como alvo; já paga é recusada", () => {
    const m = registrarPagamentoDespesa(baseMinima({ despesas: [despesa()] }), "dsp_a", CTX);
    expect(m.base.atividades).toMatchObject([{ tipo: "despesaPaga", alvo: { tipo: "despesa", id: "dsp_a" } }]);
    expect(m.base.alteracoes).toMatchObject([{ campo: "pagaEm", entidade: { tipo: "despesa", id: "dsp_a" } }]);
    expect(podePagarDespesa(m.resultado).ok).toBe(false);
    expect(() => registrarPagamentoDespesa(m.base, "dsp_a", CTX)).toThrow(OperacaoInvalida);
  });
});
