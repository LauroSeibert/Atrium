import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageHeader } from "./PageHeader";

describe("PageHeader (RF-61, RF-63)", () => {
  it("renderiza o título como h1 e a descrição", () => {
    render(<PageHeader titulo="Imóveis" descricao="Carteira da imobiliária" />);
    expect(screen.getByRole("heading", { level: 1, name: "Imóveis" })).toBeInTheDocument();
    expect(screen.getByText("Carteira da imobiliária")).toBeInTheDocument();
  });

  it("renderiza a ação primária e as secundárias", () => {
    render(
      <PageHeader titulo="Imóveis" acoes={<button>Exportar</button>} acaoPrimaria={<button>Novo imóvel</button>} />,
    );
    expect(screen.getByRole("button", { name: "Exportar" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Novo imóvel" }).length).toBeGreaterThanOrEqual(1);
  });
});
