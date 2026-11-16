import { describe, expect, it } from "vitest";
import { criarAnuncio, transicionarAnuncio } from "../anuncio/estado";
import { criarNegociacao, transicionarNegociacao, vincularContrato } from "../negociacao/estado";
import { anuncio, baseMinima, contrato, CTX, CTX_DEPOIS, negociacao } from "../teste/fabrica";
import { OperacaoInvalida } from "./tipos";

/** RF-04: desfazer não pode quebrar invariantes que operações posteriores passaram a usar (MODELO §3). */
describe("desfazer valida a base resultante", () => {
  it("fechar → vincular contrato → desfazer o fechamento é recusado (invariante 3)", () => {
    const b0 = baseMinima({ negociacoes: [negociacao({ etapa: "proposta" })], contratos: [contrato()] });
    const fechar = transicionarNegociacao(b0, { negociacaoId: "neg_a", para: "fechado" }, CTX);
    const b2 = vincularContrato(fechar.base, "neg_a", "ctr_a", CTX_DEPOIS).base;
    expect(() => fechar.desfazer(b2, CTX_DEPOIS)).toThrow(OperacaoInvalida);
    expect(() => fechar.desfazer(b2, CTX_DEPOIS)).toThrow(/^Não dá mais para desfazer: /);
    // sem o vínculo, desfaz normalmente
    expect(fechar.desfazer(fechar.base, CTX_DEPOIS).base.negociacoes[0]!.etapa).toBe("proposta");
  });

  it("perder → nova negociação do mesmo lead × imóvel → desfazer a perda é recusado (invariante 5)", () => {
    const b0 = baseMinima({ negociacoes: [negociacao({ etapa: "visita" })] });
    const perder = transicionarNegociacao(b0, { negociacaoId: "neg_a", para: "perdido", motivo: "preco" }, CTX);
    const b2 = criarNegociacao(perder.base, { leadId: "lead_a", imovelId: "imv_a" }, CTX_DEPOIS).base;
    expect(() => perder.desfazer(b2, CTX_DEPOIS)).toThrow(/Não dá mais para desfazer: .*mesmo lead × imóvel/);
  });

  it("encerrar anúncio → novo anúncio no mesmo canal → desfazer o encerramento é recusado (invariante 6)", () => {
    const b0 = baseMinima({
      anuncios: [anuncio({ status: "publicado", publicadoEm: "2026-02-01T12:00:00.000Z" })],
    });
    const encerrar = transicionarAnuncio(b0, "anc_a", "encerrado", CTX);
    const b2 = criarAnuncio(encerrar.base, "imv_a", "site", CTX_DEPOIS).base;
    expect(() => encerrar.desfazer(b2, CTX_DEPOIS)).toThrow(/Não dá mais para desfazer: .*mesmo imóvel × canal/);
  });
});
