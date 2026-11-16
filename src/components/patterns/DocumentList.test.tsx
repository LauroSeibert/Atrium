import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DocumentList, formatTamanhoArquivo, type ItemDocumento } from "./DocumentList";

const doc: ItemDocumento = {
  id: "doc_1",
  nome: "Contrato assinado.pdf",
  tipo: "contratoAssinado",
  tamanho: 2_516_582,
  enviadoPor: "Mariana Alves",
  enviadoEm: "2026-11-14T12:00:00.000Z",
};

describe("DocumentList (RF-76)", () => {
  it("lista o documento e emite baixar e remover", async () => {
    const onBaixar = vi.fn();
    const onRemover = vi.fn();
    render(<DocumentList estado={{ fase: "success", dados: [doc] }} onBaixar={onBaixar} onRemover={onRemover} />);
    expect(screen.getByText("Contrato assinado")).toBeInTheDocument();
    expect(screen.getByText("2,4 MB")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Baixar Contrato assinado.pdf" }));
    await userEvent.click(screen.getByRole("button", { name: "Remover Contrato assinado.pdf" }));
    expect(onBaixar).toHaveBeenCalledWith("doc_1");
    expect(onRemover).toHaveBeenCalledWith("doc_1");
  });

  it("mostra vazio, carregando e erro", async () => {
    const onTentarNovamente = vi.fn();
    const { rerender } = render(
      <DocumentList estado={{ fase: "success", dados: [] }} onBaixar={vi.fn()} onRemover={vi.fn()} />,
    );
    expect(screen.getByText("Nenhum documento enviado")).toBeInTheDocument();
    rerender(<DocumentList estado={{ fase: "loading" }} onBaixar={vi.fn()} onRemover={vi.fn()} />);
    expect(screen.getByRole("status", { name: "Carregando documentos" })).toBeInTheDocument();
    rerender(
      <DocumentList
        estado={{ fase: "error", erro: new Error("x") }}
        onBaixar={vi.fn()}
        onRemover={vi.fn()}
        onTentarNovamente={onTentarNovamente}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /tentar de novo/i }));
    expect(onTentarNovamente).toHaveBeenCalled();
  });

  it("formata tamanhos", () => {
    expect(formatTamanhoArquivo(812)).toBe("812 B");
    expect(formatTamanhoArquivo(35_840)).toBe("35 KB");
  });
});
