import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CartaoLinha, CartaoLinhaSkeleton } from "./CartaoLinha";

describe("CartaoLinha", () => {
  it("mostra título (h3), subtítulo, selo, corpo e ação", () => {
    render(
      <CartaoLinha titulo="CT-1" subtitulo="Apto" selo={<span>Atrasado</span>} acao={<button>Pagar</button>}>
        <p>Corpo</p>
      </CartaoLinha>,
    );
    const g = screen.getByRole("group", { name: "CT-1" });
    expect(within(g).getByRole("heading", { level: 3, name: "CT-1" })).toBeInTheDocument();
    expect(within(g).getByText("Apto")).toBeInTheDocument();
    expect(within(g).getByText("Atrasado")).toBeInTheDocument();
    expect(within(g).getByText("Corpo")).toBeInTheDocument();
    expect(within(g).getByRole("button", { name: "Pagar" })).toBeInTheDocument();
  });

  it("rótulo acessível próprio e esqueleto ocupado", () => {
    const { rerender } = render(<CartaoLinha titulo="Ana" rotuloAcessivel="Contato Ana" />);
    expect(screen.getByRole("group", { name: "Contato Ana" })).toBeInTheDocument();
    rerender(<CartaoLinhaSkeleton />);
    expect(screen.getByRole("group", { name: "Carregando" })).toHaveAttribute("aria-busy", "true");
  });
});
