import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "../ui/Tooltip";
import { Sidebar } from "./Sidebar";

const contadores = { leadsNovos: 12, parcelasAtrasadas: 150 };

function montar(props: Partial<React.ComponentProps<typeof Sidebar>> = {}) {
  const onAlternarRecolhida = vi.fn();
  render(
    <TooltipProvider>
      <Sidebar
        pathname="/imoveis/imv_1"
        recolhida={false}
        onAlternarRecolhida={onAlternarRecolhida}
        contadores={contadores}
        {...props}
      />
    </TooltipProvider>,
  );
  return { onAlternarRecolhida };
}

describe("Sidebar (RF-01, RF-60, RF-62)", () => {
  it("marca só o módulo ativo com aria-current", () => {
    montar();
    expect(screen.getByRole("link", { name: "Imóveis" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /^Dashboard/ })).not.toHaveAttribute("aria-current");
  });

  it("botão recolher chama o callback", async () => {
    const { onAlternarRecolhida } = montar();
    const botao = screen.getByRole("button", { name: "Recolher menu" });
    await userEvent.click(botao);
    expect(onAlternarRecolhida).toHaveBeenCalledTimes(1);
  });

  it("recolhida: botão vira Expandir menu", () => {
    montar({ recolhida: true });
    expect(screen.getByRole("button", { name: "Expandir menu" })).toBeInTheDocument();
  });

  it("recolhida mantém o nome acessível completo, com a descrição do badge", () => {
    montar({ recolhida: true });
    expect(screen.getByRole("link", { name: "Leads, 12 leads novos" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Contratos, 99+: 150 parcelas atrasadas" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
  });

  it("expandida inclui a descrição do badge no nome do link", () => {
    montar();
    expect(screen.getByRole("link", { name: /Leads.*12 leads novos/ })).toBeInTheDocument();
  });

  it('exibe "99+" para contagens acima de 99', () => {
    montar();
    expect(screen.getByText("99+")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("sem contadores não mostra badge", () => {
    montar({ contadores: undefined });
    expect(screen.queryByText("99+")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Leads" })).toBeInTheDocument();
  });
});
