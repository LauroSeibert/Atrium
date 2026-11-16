import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Pagina } from "@/lib/paginacao";
import type { Recurso } from "@/lib/recurso";
import { ListaResponsiva } from "./ListaResponsiva";

type Item = { id: string; nome: string };
const pagina = (itens: Item[]): Pagina<Item> => ({
  itens,
  total: itens.length,
  pagina: 1,
  porPagina: 10,
  totalPaginas: 1,
});
const base = {
  rotulo: "Itens",
  colunas: [{ id: "nome", cabecalho: "Nome", celula: (i: Item) => i.nome }],
  idLinha: (i: Item) => i.id,
  onTentarNovamente: () => {},
  onPaginaChange: () => {},
  vazio: { titulo: "Nada aqui" },
  cartao: (i: Item) => <p>Cartão {i.nome}</p>,
  cartaoCarregando: <p>Esqueleto</p>,
};
const ok: Recurso<Pagina<Item>> = { fase: "success", dados: pagina([{ id: "1", nome: "Ana" }]) };

describe("ListaResponsiva", () => {
  it("tela larga: tabela e h2 oculto", () => {
    render(<ListaResponsiva {...base} telaLarga estado={ok} />);
    expect(screen.getByRole("heading", { level: 2, name: "Itens" })).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.queryByText("Cartão Ana")).not.toBeInTheDocument();
  });

  it("tela estreita: cartões, sem tabela", () => {
    render(<ListaResponsiva {...base} telaLarga={false} estado={ok} />);
    expect(screen.getByRole("list", { name: "Itens em cartões" })).toBeInTheDocument();
    expect(screen.getByText("Cartão Ana")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("cartões: carregando, vazio e erro com tentar de novo", async () => {
    const { rerender } = render(<ListaResponsiva {...base} telaLarga={false} estado={{ fase: "loading" }} />);
    expect(screen.getAllByText("Esqueleto")).toHaveLength(3);
    rerender(<ListaResponsiva {...base} telaLarga={false} estado={{ fase: "success", dados: pagina([]) }} />);
    expect(screen.getByText("Nada aqui")).toBeInTheDocument();
    const novamente = vi.fn();
    rerender(
      <ListaResponsiva
        {...base}
        telaLarga={false}
        estado={{ fase: "error", erro: new Error("x") }}
        onTentarNovamente={novamente}
      />,
    );
    await userEvent.setup().click(screen.getByRole("button", { name: /tentar de novo/i }));
    expect(novamente).toHaveBeenCalled();
  });
});
