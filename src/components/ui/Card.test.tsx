import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Card, CardTitle } from "./Card";

function Selecionavel() {
  const [selected, setSelected] = useState(false);
  return (
    <Card variant="selectable" selected={selected} onSelectedChange={setSelected}>
      <CardTitle>Studio, Vila Madalena</CardTitle>
    </Card>
  );
}

describe("Card", () => {
  it("selecionável alterna aria-pressed com Enter e Espaço", async () => {
    const user = userEvent.setup();
    render(<Selecionavel />);
    const card = screen.getByRole("button", { name: "Studio, Vila Madalena" });
    expect(card).toHaveAttribute("aria-pressed", "false");
    await user.tab();
    expect(card).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(card).toHaveAttribute("aria-pressed", "true");
    await user.keyboard(" ");
    expect(card).toHaveAttribute("aria-pressed", "false");
  });

  it("interativo com asChild é um link", () => {
    render(
      <Card variant="interactive" asChild>
        <a href="/imoveis/123">Apartamento Pinheiros</a>
      </Card>,
    );
    expect(screen.getByRole("link", { name: "Apartamento Pinheiros" })).toHaveAttribute("href", "/imoveis/123");
  });

  it("base não é interativo", () => {
    render(<Card>Conteúdo</Card>);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
