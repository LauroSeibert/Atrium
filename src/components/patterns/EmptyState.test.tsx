import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { VAZIO_VARIANTES } from "@/assets/svg/vazios/SvgVazio";
import { Button } from "../ui/Button";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";

describe("EmptyState (RNF-09)", () => {
  it("mostra título, descrição e ação que funciona", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <EmptyState
        titulo="Nenhum imóvel"
        descricao="Cadastre o primeiro."
        acao={<Button onClick={onClick}>Novo imóvel</Button>}
      />,
    );
    expect(screen.getByRole("heading", { name: "Nenhum imóvel" })).toBeInTheDocument();
    expect(screen.getByText("Cadastre o primeiro.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Novo imóvel" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it.each(VAZIO_VARIANTES.filter((v) => v.variant !== "erro"))(
    "renderiza a ilustração $variant como decorativa",
    ({ variant }) => {
      const { container } = render(<EmptyState ilustracao={variant} titulo="Título" />);
      expect(container.querySelector("svg")).toBeInTheDocument();
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
    },
  );

  it("sem descrição nem ação não renderiza botões", () => {
    render(<EmptyState titulo="Vazio" tamanho="compacto" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("aceita título longo", () => {
    const longo = "Nenhum imóvel encontrado ".repeat(8).trim();
    render(<EmptyState titulo={longo} />);
    expect(screen.getByRole("heading", { name: longo })).toBeInTheDocument();
  });
});

describe("ErrorState (RNF-09)", () => {
  it("é um alerta com texto padrão e Tentar de novo", async () => {
    const onTentarNovamente = vi.fn();
    const user = userEvent.setup();
    render(<ErrorState onTentarNovamente={onTentarNovamente} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível carregar");
    await user.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(onTentarNovamente).toHaveBeenCalledOnce();
  });

  it("sem onTentarNovamente não mostra o botão; ação extra aparece", () => {
    const { rerender } = render(<ErrorState />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    rerender(<ErrorState acao={<Button>Voltar</Button>} />);
    expect(screen.getByRole("button", { name: "Voltar" })).toBeInTheDocument();
  });

  it("texto personalizado e compacto", () => {
    render(<ErrorState titulo="Falha nos contratos" descricao="Tente depois." tamanho="compacto" />);
    expect(screen.getByRole("heading", { name: "Falha nos contratos" })).toBeInTheDocument();
    expect(screen.getByText("Tente depois.")).toBeInTheDocument();
  });
});
