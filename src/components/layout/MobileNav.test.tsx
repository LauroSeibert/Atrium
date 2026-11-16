import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "../ui/Tooltip";
import { MobileNav } from "./MobileNav";

function montar(aberto: boolean) {
  const onAbertoChange = vi.fn();
  render(
    <TooltipProvider>
      <MobileNav aberto={aberto} onAbertoChange={onAbertoChange} pathname="/leads" />
    </TooltipProvider>,
  );
  return { onAbertoChange };
}

describe("MobileNav (RF-01, RF-63)", () => {
  it("fechado não renderiza os links", () => {
    montar(false);
    expect(screen.queryByRole("link", { name: "Leads" })).not.toBeInTheDocument();
  });

  it("aberto mostra o drawer e os links dos módulos", () => {
    montar(true);
    expect(screen.getByRole("dialog", { name: "Menu" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Agenda" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Leads" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Configurações" })).toBeInTheDocument();
  });

  it("grupo da rota atual aberto e o outro recolhido", async () => {
    montar(true);
    expect(screen.getByRole("button", { name: "Comercial" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Operação" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "Imóveis" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Operação" }));
    expect(screen.getByRole("link", { name: "Imóveis" })).toBeInTheDocument();
  });

  it("clicar num link fecha o drawer", async () => {
    const { onAbertoChange } = montar(true);
    await userEvent.click(screen.getByRole("link", { name: "Relatórios" }));
    expect(onAbertoChange).toHaveBeenCalledWith(false);
  });
});
