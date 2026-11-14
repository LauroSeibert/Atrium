import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Button } from "./Button";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";

describe("Popover", () => {
  it("Esc fecha e devolve o foco; botão Fechar também fecha", async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger asChild>
          <Button>Resumo</Button>
        </PopoverTrigger>
        <PopoverContent showClose>Marina Albuquerque</PopoverContent>
      </Popover>,
    );
    const trigger = screen.getByRole("button", { name: "Resumo" });
    await user.click(trigger);
    expect(screen.getByText("Marina Albuquerque")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByText("Marina Albuquerque")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Fechar" }));
    expect(screen.queryByText("Marina Albuquerque")).not.toBeInTheDocument();
  });
});
