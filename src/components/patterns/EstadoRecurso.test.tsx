import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Recurso } from "@/lib/recurso";
import { EstadoRecurso } from "./EstadoRecurso";

function Tela({ estado, onTentarNovamente }: { estado: Recurso<string[]>; onTentarNovamente?: () => void }) {
  return (
    <EstadoRecurso
      estado={estado}
      carregando={<p>Skeleton</p>}
      estaVazio={(d) => d.length === 0}
      vazio={<p>Lista vazia</p>}
      onTentarNovamente={onTentarNovamente}
    >
      {(d) => (
        <ul>
          {d.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      )}
    </EstadoRecurso>
  );
}

describe("EstadoRecurso (RNF-09, ESTADOS §3.6)", () => {
  it("idle e loading sem dados mostram o skeleton", () => {
    const { rerender } = render(<Tela estado={{ fase: "idle" }} />);
    expect(screen.getByText("Skeleton")).toBeInTheDocument();
    rerender(<Tela estado={{ fase: "loading" }} />);
    expect(screen.getByText("Skeleton")).toBeInTheDocument();
  });

  it("success mostra os dados; vazio mostra o vazio", () => {
    const { rerender } = render(<Tela estado={{ fase: "success", dados: ["a"] }} />);
    expect(screen.getByText("a")).toBeInTheDocument();
    rerender(<Tela estado={{ fase: "success", dados: [] }} />);
    expect(screen.getByText("Lista vazia")).toBeInTheDocument();
  });

  it("loading com dados mantém o conteúdo e marca aria-busy", () => {
    render(<Tela estado={{ fase: "loading", dados: ["a"] }} />);
    expect(screen.getByText("a").closest("[aria-busy='true']")).not.toBeNull();
    expect(screen.queryByText("Skeleton")).not.toBeInTheDocument();
  });

  it("partial mostra o aviso e os dados", () => {
    render(<Tela estado={{ fase: "partial", dados: ["a"], aviso: "Faltam itens" }} />);
    expect(screen.getByRole("status")).toHaveTextContent("Faltam itens");
    expect(screen.getByText("a")).toBeInTheDocument();
  });

  it("error sem dados mostra ErrorState com tentar de novo", async () => {
    const onTentarNovamente = vi.fn();
    const user = userEvent.setup();
    render(<Tela estado={{ fase: "error", erro: new Error("x") }} onTentarNovamente={onTentarNovamente} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(onTentarNovamente).toHaveBeenCalledOnce();
  });

  it("error com dados mantém os dados visíveis", () => {
    render(<Tela estado={{ fase: "error", erro: new Error("x"), dados: ["a"] }} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível atualizar");
    expect(screen.getByText("a")).toBeInTheDocument();
  });
});
