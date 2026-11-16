import { describe, expect, it } from "vitest";
import { OperacaoInvalida } from "../comum/tipos";
import { baseMinima, contrato, CTX, CTX_DEPOIS, imovel } from "../teste/fabrica";
import { podeRegistrarPagamentoComissao, registrarPagamentoComissao, statusComissao } from "./estado";
import type { Comissao, StatusContrato } from "./schema";

const comissao = (over: Partial<Comissao> = {}): Comissao => ({
  corretorId: "cor_a",
  percentual: 6,
  base: 30_000_000,
  valor: 1_800_000,
  competencia: "2026-11",
  pagaEm: null,
  ...over,
});
const comStatus = (status: StatusContrato, comissoes = [comissao()]) =>
  contrato({ status, comissoes, motivoCancelamento: status === "cancelado" ? "x" : null });

describe("registrarPagamentoComissao (ESTADOS §3.10, RF-79)", () => {
  it.each(["ativo", "encerrado"] as const)(
    "contrato %s: grava pagaEm, registro comissao.N.pagaEm e Atividade",
    (status) => {
      const b = baseMinima({
        imoveis: [imovel({ status: "vendido" })],
        contratos: [comStatus(status, [comissao(), comissao({ corretorId: "cor_b" })])],
      });
      const m = registrarPagamentoComissao(b, "ctr_a", 1, CTX);
      expect(m.resultado.comissoes.map(statusComissao)).toEqual(["pendente", "paga"]);
      expect(m.base.alteracoes).toEqual([
        expect.objectContaining({ campo: "comissao.2.pagaEm", de: null, para: CTX.agora }),
      ]);
      expect(m.base.atividades[0]).toMatchObject({
        tipo: "comissaoPaga",
        alvo: { tipo: "contrato", id: "ctr_a" },
        dados: { indice: 1, corretorId: "cor_b" },
      });
      expect(m.desfazer(m.base, CTX_DEPOIS).base.contratos).toEqual(b.contratos);
    },
  );

  it.each(["rascunho", "cancelado"] as const)("contrato %s é recusado", (status) => {
    expect(podeRegistrarPagamentoComissao(comStatus(status), 0).ok).toBe(false);
    expect(() => registrarPagamentoComissao(baseMinima({ contratos: [comStatus(status)] }), "ctr_a", 0, CTX)).toThrow(
      OperacaoInvalida,
    );
  });

  it("comissão já paga ou inexistente é recusada", () => {
    expect(podeRegistrarPagamentoComissao(comStatus("ativo", [comissao({ pagaEm: CTX.agora })]), 0).ok).toBe(false);
    expect(podeRegistrarPagamentoComissao(comStatus("ativo"), 3).ok).toBe(false);
  });
});
