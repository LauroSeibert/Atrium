import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Badge, Tag } from "./Badge";

describe("Badge / Tag", () => {
  it("Badge sempre mostra o texto", () => {
    render(
      <Badge tone="success" dot>
        Disponível
      </Badge>,
    );
    expect(screen.getByText("Disponível")).toBeInTheDocument();
  });

  it("Tag remove pelo botão com nome acessível 'Remover <x>'", async () => {
    const onRemove = vi.fn();
    const user = userEvent.setup();
    render(<Tag onRemove={onRemove}>Pinheiros</Tag>);
    await user.click(screen.getByRole("button", { name: "Remover Pinheiros" }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("Tag remove por teclado (Tab + Enter e Espaço)", async () => {
    const onRemove = vi.fn();
    const user = userEvent.setup();
    render(<Tag onRemove={onRemove}>Apartamento</Tag>);
    await user.tab();
    expect(screen.getByRole("button", { name: "Remover Apartamento" })).toHaveFocus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(onRemove).toHaveBeenCalledTimes(2);
  });

  it("Tag sem onRemove não tem botão", () => {
    render(<Tag>Somente leitura</Tag>);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
