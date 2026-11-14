import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./DropdownMenu";

function setup() {
  const onEditar = vi.fn();
  const onExcluir = vi.fn();
  const onDisabled = vi.fn();
  render(
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>Mais ações</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={onEditar}>Editar</DropdownMenuItem>
        <DropdownMenuItem disabled onSelect={onDisabled}>
          Duplicar
        </DropdownMenuItem>
        <DropdownMenuItem tone="destructive" onSelect={onExcluir}>
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>,
  );
  return { onEditar, onExcluir, onDisabled };
}

describe("DropdownMenu", () => {
  it("setas navegam pelos itens (pulando desabilitado) e Enter seleciona", async () => {
    const user = userEvent.setup();
    const { onExcluir, onDisabled } = setup();
    const trigger = screen.getByRole("button", { name: "Mais ações" });
    trigger.focus();
    await user.keyboard("{ArrowDown}");
    expect(await screen.findByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Editar" })).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Excluir" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onExcluir).toHaveBeenCalledTimes(1);
    expect(onDisabled).not.toHaveBeenCalled();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("Esc fecha e devolve o foco ao gatilho", async () => {
    const user = userEvent.setup();
    setup();
    const trigger = screen.getByRole("button", { name: "Mais ações" });
    await user.click(trigger);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
