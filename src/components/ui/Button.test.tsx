import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Plus } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("é um <button type=button> por padrão (não envia formulários sem querer)", () => {
    render(<Button>Salvar</Button>);
    expect(screen.getByRole("button", { name: "Salvar" })).toHaveAttribute("type", "button");
  });

  it("ativa com Enter e Espaço pelo teclado", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>Salvar</Button>);
    await user.tab();
    expect(screen.getByRole("button")).toHaveFocus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("desabilitado não recebe foco nem clique", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button disabled onClick={onClick}>
        Salvar
      </Button>,
    );
    await user.tab();
    expect(screen.getByRole("button")).not.toHaveFocus();
    await user.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("carregando anuncia aria-busy, bloqueia clique e mantém o nome acessível", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button loading onClick={onClick}>
        Salvar
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Salvar" });
    expect(button).toHaveAttribute("aria-busy", "true");
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("botão só de ícone usa o aria-label como nome", () => {
    render(<Button icon={Plus} aria-label="Adicionar lead" />);
    expect(screen.getByRole("button", { name: "Adicionar lead" })).toBeInTheDocument();
  });

  it("asChild renderiza o filho com estilo de botão", () => {
    render(
      <Button asChild>
        <a href="/imoveis">Ver imóveis</a>
      </Button>,
    );
    expect(screen.getByRole("link", { name: "Ver imóveis" })).toHaveClass("bg-primary");
  });
});
