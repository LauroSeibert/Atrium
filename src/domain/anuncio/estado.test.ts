import { describe, expect, it } from "vitest";
import { OperacaoInvalida, TransicaoInvalida } from "../comum/tipos";
import { validarBase } from "../invariantes";
import { anuncio, baseMinima, CTX, CTX_DEPOIS, imovel } from "../teste/fabrica";
import { STATUS_ANUNCIO, type StatusAnuncio } from "./schema";
import {
  TRANSICOES_ANUNCIO,
  alertaAnuncio,
  criarAnuncio,
  podeCriarAnuncio,
  podeTransicionarAnuncio,
  transicionarAnuncio,
  exigeConfirmacaoAnuncio,
  transicoesPermitidasAnuncio,
} from "./estado";

const PUB = "2026-10-01T12:00:00.000Z";
const em = (status: StatusAnuncio) => anuncio({ status, publicadoEm: status === "rascunho" ? null : PUB });

describe("anúncio: tabela TRANSICOES_ANUNCIO (RF-75, ESTADOS §3.8)", () => {
  const combos = STATUS_ANUNCIO.flatMap((de) => STATUS_ANUNCIO.map((para) => [de, para] as const));
  it.each(combos)("%s → %s", (de, para) => {
    const a = em(de);
    const base = baseMinima({ anuncios: [a] });
    const permitida = TRANSICOES_ANUNCIO[de].includes(para);
    expect(podeTransicionarAnuncio(base, a, para).ok).toBe(permitida);
    if (permitida) {
      const m = transicionarAnuncio(base, a.id, para, CTX);
      expect(m.resultado.status).toBe(para);
      expect(validarBase(m.base)).toEqual([]);
    } else expect(() => transicionarAnuncio(base, a.id, para, CTX)).toThrow(TransicaoInvalida);
  });

  it("só encerrar exige confirmação", () => {
    expect(exigeConfirmacaoAnuncio("encerrado")).toBe(true);
    expect(exigeConfirmacaoAnuncio("pausado")).toBe(false);
    expect(exigeConfirmacaoAnuncio("publicado")).toBe(false);
  });

  it("encerrado é final", () => expect(TRANSICOES_ANUNCIO.encerrado).toEqual([]));
});

describe("anúncio: guard e efeitos", () => {
  it("publicar exige imóvel disponível ou reservado", () => {
    for (const status of ["vendido", "alugado", "inativo"] as const) {
      const base = baseMinima({
        imoveis: [imovel({ status, motivoInativo: status === "inativo" ? "x" : null })],
        anuncios: [em("pausado")],
      });
      expect(podeTransicionarAnuncio(base, base.anuncios[0]!, "publicado").ok).toBe(false);
      expect(transicoesPermitidasAnuncio(base, base.anuncios[0]!)).toEqual([
        { para: "encerrado", exigeConfirmacao: true },
      ]);
    }
    const reservado = baseMinima({ imoveis: [imovel({ status: "reservado" })], anuncios: [em("rascunho")] });
    expect(podeTransicionarAnuncio(reservado, reservado.anuncios[0]!, "publicado").ok).toBe(true);
  });

  it("1ª publicação grava publicadoEm; retomar mantém; Atividade e registro de status", () => {
    const m = transicionarAnuncio(baseMinima({ anuncios: [em("rascunho")] }), "anc_a", "publicado", CTX);
    expect(m.resultado.publicadoEm).toBe(CTX.agora);
    expect(m.base.atividades[0]).toMatchObject({
      tipo: "anuncioAlterado",
      alvo: { tipo: "imovel", id: "imv_a" },
      dados: { anuncioId: "anc_a", canal: "site", de: "rascunho", para: "publicado" },
    });
    expect(m.base.alteracoes).toEqual([
      expect.objectContaining({
        entidade: { tipo: "anuncio", id: "anc_a" },
        campo: "status",
        de: "rascunho",
        para: "publicado",
      }),
    ]);
    const retomado = transicionarAnuncio(baseMinima({ anuncios: [em("pausado")] }), "anc_a", "publicado", CTX);
    expect(retomado.resultado.publicadoEm).toBe(PUB);
    const d = m.desfazer(m.base, CTX_DEPOIS);
    expect(d.base.anuncios[0]).toEqual(em("rascunho"));
    expect(d.base.atividades).toEqual([]);
  });

  it("alertaAnuncio é derivado: publicado com imóvel indisponível", () => {
    const vendido = baseMinima({ imoveis: [imovel({ status: "vendido" })] });
    expect(alertaAnuncio(vendido, em("publicado"))).toBe("imovelIndisponivel");
    expect(alertaAnuncio(vendido, em("pausado"))).toBeNull();
    expect(alertaAnuncio(baseMinima(), em("publicado"))).toBeNull();
  });
});

describe("criarAnuncio", () => {
  it("nasce rascunho, zerado; sem registro de alteração", () => {
    const m = criarAnuncio(baseMinima(), "imv_a", "portal", CTX);
    expect(m.resultado).toMatchObject({ status: "rascunho", canal: "portal", publicadoEm: null, visualizacoes: 0 });
    expect(m.resultado.id).toMatch(/^anc_/);
    expect(m.base.alteracoes).toEqual([]);
  });

  it("um não encerrado por imóvel × canal; encerrado libera; imóvel inexistente e canal inválido recusados", () => {
    const base = baseMinima({ anuncios: [em("pausado")] });
    expect(podeCriarAnuncio(base, "imv_a", "site").ok).toBe(false);
    expect(() => criarAnuncio(base, "imv_a", "site", CTX)).toThrow(OperacaoInvalida);
    expect(criarAnuncio(base, "imv_a", "redes", CTX).resultado.canal).toBe("redes");
    expect(criarAnuncio(baseMinima({ anuncios: [em("encerrado")] }), "imv_a", "site", CTX).resultado.status).toBe(
      "rascunho",
    );
    expect(() => criarAnuncio(baseMinima(), "imv_x", "site", CTX)).toThrow(OperacaoInvalida);
    expect(() => criarAnuncio(baseMinima(), "imv_a", "tv" as never, CTX)).toThrow();
  });
});
