import { describe, expect, it } from "vitest";
import { DadosInvalidos, OperacaoInvalida } from "../comum/tipos";
import { validarBase } from "../invariantes";
import { baseMinima, contrato, CTX, CTX_DEPOIS, documento } from "../teste/fabrica";
import { TAMANHO_MAXIMO_DOCUMENTO } from "./schema";
import { adicionarDocumento, mimeDoArquivo, removerDocumento, validarArquivoDocumento } from "./operacoes";

const novo = (over = {}) => ({
  contratoId: "ctr_a",
  tipo: "certidao" as const,
  nome: "certidao.pdf",
  mime: "application/pdf",
  tamanho: 2048,
  arquivoId: "arq_1",
  ...over,
});

describe("documento: validação do arquivo (RF-76)", () => {
  it("aceita PDF, JPG e PNG até 10 MB; infere pela extensão quando o tipo vem vazio", () => {
    expect(validarArquivoDocumento({ nome: "a.pdf", tipo: "application/pdf", tamanho: 1 })).toBe("application/pdf");
    expect(validarArquivoDocumento({ nome: "a.jpg", tipo: "image/jpg", tamanho: 1 })).toBe("image/jpeg");
    expect(validarArquivoDocumento({ nome: "a.PNG", tipo: "", tamanho: TAMANHO_MAXIMO_DOCUMENTO })).toBe("image/png");
    expect(mimeDoArquivo("a.docx", "")).toBeNull();
  });

  it("recusa outro tipo, vazio e acima de 10 MB com DadosInvalidos", () => {
    expect(() => validarArquivoDocumento({ nome: "a.docx", tipo: "application/msword", tamanho: 1 })).toThrow(
      "Envie um arquivo PDF, JPG ou PNG.",
    );
    expect(() => validarArquivoDocumento({ nome: "a.pdf", tipo: "application/pdf", tamanho: 0 })).toThrow(
      DadosInvalidos,
    );
    expect(() =>
      validarArquivoDocumento({ nome: "a.pdf", tipo: "application/pdf", tamanho: TAMANHO_MAXIMO_DOCUMENTO + 1 }),
    ).toThrow("O arquivo passa de 10 MB.");
  });
});

describe("adicionarDocumento / removerDocumento (ESTADOS §3.11)", () => {
  const base = () => baseMinima({ contratos: [contrato()] });

  it("grava metadados com autor e data; Atividade documentoAdicionado; sem registro de alteração", () => {
    const m = adicionarDocumento(base(), novo(), CTX);
    expect(m.resultado).toMatchObject({
      contratoId: "ctr_a",
      mime: "application/pdf",
      enviadoPorId: "cor_a",
      enviadoEm: CTX.agora,
    });
    expect(m.resultado.id).toMatch(/^doc_/);
    expect(m.base.atividades[0]).toMatchObject({
      tipo: "documentoAdicionado",
      alvo: { tipo: "contrato", id: "ctr_a" },
    });
    expect(m.base.alteracoes).toEqual([]);
    expect(validarBase(m.base)).toEqual([]);
    expect(m.desfazer(m.base, CTX).base.documentos).toEqual([]);
  });

  it("contrato inexistente e arquivo inválido são recusados", () => {
    expect(() => adicionarDocumento(base(), novo({ contratoId: "ctr_x" }), CTX)).toThrow(OperacaoInvalida);
    expect(() => adicionarDocumento(base(), novo({ mime: "text/plain", nome: "a.txt" }), CTX)).toThrow(DadosInvalidos);
  });

  it("remover tira os metadados, gera Atividade e o desfazer devolve", () => {
    const b = baseMinima({ contratos: [contrato()], documentos: [documento()] });
    const m = removerDocumento(b, "doc_a", CTX);
    expect(m.base.documentos).toEqual([]);
    expect(m.base.atividades[0]).toMatchObject({ tipo: "documentoRemovido", dados: { documentoId: "doc_a" } });
    const d = m.desfazer(m.base, CTX_DEPOIS);
    expect(d.base.documentos).toEqual(b.documentos);
    expect(d.base.atividades).toEqual([]);
    expect(() => removerDocumento(b, "doc_x", CTX)).toThrow(OperacaoInvalida);
  });
});
