import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContractCard, ContractCardSkeleton } from "./ContractCard";

const base = {
  numero: "CT-2026-0012",
  tipo: "locacao" as const,
  imovel: { titulo: "Apto 52 Solar das Palmeiras", codigo: "AT-0042" },
  partes: [
    { papel: "locatario" as const, nome: "Ana Souza", documento: "12345678901" },
    { papel: "locador" as const, nome: "Bruno Lima", documento: "12345678000199" },
  ],
  valor: 350_000,
  inicio: "2026-01-10",
  fim: "2027-01-10",
  statusExibicao: "inadimplente" as const,
};

describe("ContractCard (RF-40, RF-41)", () => {
  it("mostra número, tipo, imóvel, status com texto e valor", () => {
    render(<ContractCard {...base} />);
    const card = screen.getByRole("group", { name: "Contrato CT-2026-0012" });
    expect(within(card).getByText("Locação")).toBeInTheDocument();
    expect(within(card).getByText(/AT-0042/)).toBeInTheDocument();
    expect(within(card).getByText("Inadimplente")).toBeInTheDocument();
    expect(within(card).getByText(/3\.500,00/)).toBeInTheDocument();
  });

  it("mascara o documento das partes", () => {
    render(<ContractCard {...base} />);
    expect(screen.getByText("***.456.789-**")).toBeInTheDocument();
    expect(screen.queryByText(/12345678901/)).not.toBeInTheDocument();
  });

  it("mostra o próximo vencimento só quando existe", () => {
    const { rerender } = render(
      <ContractCard {...base} proximoVencimento={{ numero: 4, vencimento: "2026-12-10", valor: 350_000 }} />,
    );
    expect(screen.getByText("Próximo vencimento")).toBeInTheDocument();
    rerender(<ContractCard {...base} proximoVencimento={null} />);
    expect(screen.queryByText("Próximo vencimento")).not.toBeInTheDocument();
  });

  it("skeleton é anunciado como ocupado", () => {
    render(<ContractCardSkeleton />);
    expect(screen.getByRole("group", { name: "Carregando contrato" })).toHaveAttribute("aria-busy", "true");
  });
});
