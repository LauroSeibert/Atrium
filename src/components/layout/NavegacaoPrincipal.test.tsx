import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "../ui/Tooltip";
import { NAV_PRINCIPAL } from "./navegacao";
import { NavegacaoPrincipal } from "./NavegacaoPrincipal";

describe("NavegacaoPrincipal (RF-01)", () => {
  it("renderiza um link por item e chama onNavegar ao clicar", async () => {
    const onNavegar = vi.fn();
    render(
      <TooltipProvider>
        <NavegacaoPrincipal itens={NAV_PRINCIPAL} pathname="/" onNavegar={onNavegar} />
      </TooltipProvider>,
    );
    expect(screen.getAllByRole("link")).toHaveLength(NAV_PRINCIPAL.length);
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");
    await userEvent.click(screen.getByRole("link", { name: "Leads" }));
    expect(onNavegar).toHaveBeenCalledTimes(1);
  });
});
