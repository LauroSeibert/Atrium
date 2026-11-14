import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { X } from "lucide-react";
import { Button } from "./Button";
import { Tooltip, TooltipProvider } from "./Tooltip";

describe("Tooltip", () => {
  it("aparece no foco do teclado e some com Esc", async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider>
        <Tooltip content="Editar imóvel">
          <Button icon={X} aria-label="Editar" />
        </Tooltip>
      </TooltipProvider>,
    );
    await user.tab();
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Editar imóvel");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});
