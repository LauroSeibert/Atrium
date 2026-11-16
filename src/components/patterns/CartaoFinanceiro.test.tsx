import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CartaoFinanceiro, CartaoFinanceiroSkeleton } from "./CartaoFinanceiro";

const base = {
  titulo: "CT-2026-0012",
  subtitulo: "Apto 52 Solar das Palmeiras",
  status: { rotulo: "Atrasado", tom: "danger" as const },
  campos: [
    { rotulo: "Vencimento", valor: "10/11/2026" },
    { rotulo: "Valor", valor: "R$ 3.500,00" },
  ],
};

describe("CartaoFinanceiro (RF-77 a RF-80)", () => {
  it("mostra título, subtítulo, status com texto e campos", () => {
    render(<CartaoFinanceiro {...base} acao={<button>Registrar pagamento</button>} />);
    const card = screen.getByRole("group", { name: "CT-2026-0012" });
    expect(within(card).getByText("Apto 52 Solar das Palmeiras")).toBeInTheDocument();
    expect(within(card).getByText("Atrasado")).toBeInTheDocument();
    expect(within(card).getByText("Vencimento")).toBeInTheDocument();
    expect(within(card).getByText("R$ 3.500,00")).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: "Registrar pagamento" })).toBeInTheDocument();
  });

  it("aceita texto longo e não exige status nem ação", () => {
    render(<CartaoFinanceiro titulo={"Despesa ".repeat(40)} campos={[]} />);
    expect(screen.getByRole("group")).toBeInTheDocument();
  });

  it("esqueleto fica ocupado", () => {
    render(<CartaoFinanceiroSkeleton />);
    expect(screen.getByRole("group", { name: "Carregando" })).toHaveAttribute("aria-busy", "true");
  });
});
