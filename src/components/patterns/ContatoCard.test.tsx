import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContatoCard, ContatoCardSkeleton } from "./ContatoCard";

describe("ContatoCard (RF-74)", () => {
  it("mostra nome, papel, telefone formatado, e-mail e vínculos", () => {
    render(
      <ContatoCard
        nome="Helena Prado"
        papel="Advogada"
        telefone="11987654321"
        email="h@exemplo.com"
        qtdImoveis={2}
        qtdContratos={1}
        acao={<button>Editar</button>}
      />,
    );
    expect(screen.getByRole("group", { name: "Contato Helena Prado" })).toBeInTheDocument();
    expect(screen.getByText("Advogada")).toBeInTheDocument();
    expect(screen.getByText("(11) 98765-4321")).toBeInTheDocument();
    expect(screen.getByText("h@exemplo.com")).toBeInTheDocument();
    expect(screen.getByText("2 imóveis")).toBeInTheDocument();
    expect(screen.getByText("1 contrato")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Editar" })).toBeInTheDocument();
  });

  it("omite o que não existe", () => {
    render(<ContatoCard nome="Ana" papel="Outro" />);
    expect(screen.queryByText(/imóve/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Telefone/)).not.toBeInTheDocument();
  });

  it("esqueleto fica ocupado", () => {
    render(<ContatoCardSkeleton />);
    expect(screen.getByRole("group", { name: "Carregando" })).toHaveAttribute("aria-busy", "true");
  });

  it("nome é título de nível 3", () => {
    render(<ContatoCard nome="Ana" papel="Outro" />);
    expect(screen.getByRole("heading", { level: 3, name: "Ana" })).toBeInTheDocument();
  });
});
