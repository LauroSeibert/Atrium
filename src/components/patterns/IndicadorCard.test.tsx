import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { IndicadorCard } from "./IndicadorCard";

describe("IndicadorCard (RF-44)", () => {
  it("mostra rótulo, valor e detalhe num grupo nomeado", () => {
    render(
      <IndicadorCard
        rotulo="A receber"
        estado={{ fase: "success", dados: { valor: "R$ 1,2 mil", detalhe: "Parcelas a vencer" } }}
      />,
    );
    const grupo = screen.getByRole("group", { name: "A receber" });
    expect(grupo).toHaveTextContent("R$ 1,2 mil");
    expect(grupo).toHaveTextContent("Parcelas a vencer");
  });

  it("carregando mostra o esqueleto", () => {
    render(<IndicadorCard rotulo="A receber" estado={{ fase: "loading" }} />);
    expect(screen.getByText("Carregando indicador")).toBeInTheDocument();
  });

  it("erro oferece tentar de novo", async () => {
    const aoTentar = vi.fn();
    render(
      <IndicadorCard
        rotulo="A receber"
        estado={{ fase: "error", erro: new Error("x") }}
        onTentarNovamente={aoTentar}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /tentar de novo/i }));
    expect(aoTentar).toHaveBeenCalledTimes(1);
  });
});
