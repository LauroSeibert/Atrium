import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Recurso } from "@/lib/recurso";
import type { Pagina } from "@/lib/paginacao";
import { TooltipProvider } from "../ui/Tooltip";
import { DataTable, type DataTableColuna, type DataTableOrdenacao, type DataTableProps } from "./DataTable";

type Linha = { id: string; nome: string; valor: number };
const colunas: DataTableColuna<Linha>[] = [
  { id: "nome", cabecalho: "Nome", ordenavel: true, fixa: "inicio", celula: (l) => l.nome },
  { id: "valor", cabecalho: "Valor", alinhamento: "direita", celula: (l) => String(l.valor) },
];
const itens: Linha[] = [
  { id: "a", nome: "Alfa", valor: 1 },
  { id: "b", nome: "Beta", valor: 2 },
  { id: "c", nome: "Gama", valor: 3 },
];
const pagina = (over: Partial<Pagina<Linha>> = {}): Pagina<Linha> => ({
  itens,
  total: 143,
  pagina: 1,
  porPagina: 20,
  totalPaginas: 8,
  ...over,
});
const ok = (p = pagina()): Recurso<Pagina<Linha>> => ({ fase: "success", dados: p });

function renderizar(props: Partial<DataTableProps<Linha>> = {}) {
  return render(
    <TooltipProvider>
      <DataTable aria-label="Linhas" colunas={colunas} idLinha={(l) => l.id} estado={ok()} {...props} />
    </TooltipProvider>,
  );
}

describe("DataTable", () => {
  it("renderiza linhas, região rolável nomeada e paginação sem total visível", async () => {
    const onPaginaChange = vi.fn();
    renderizar({ onPaginaChange });
    expect(screen.getByRole("region", { name: "Linhas" })).toHaveAttribute("tabindex", "0");
    expect(screen.getAllByRole("row")).toHaveLength(4);
    expect(screen.queryByText(/de 143/)).not.toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "Página 2" }));
    expect(onPaginaChange).toHaveBeenCalledWith(2);
  });

  it("ordenação controlada: aria-sort e callback com a próxima direção", async () => {
    const onOrdenacaoChange = vi.fn();
    const ord: DataTableOrdenacao = { id: "nome", direcao: "ascending" };
    renderizar({ ordenacao: ord, onOrdenacaoChange });
    expect(screen.getByRole("columnheader", { name: "Nome" })).toHaveAttribute("aria-sort", "ascending");
    await userEvent.setup().click(screen.getByRole("button", { name: "Nome" }));
    expect(onOrdenacaoChange).toHaveBeenCalledWith({ id: "nome", direcao: "descending" });
  });

  it("estados: carregando (skeleton), erro com tentar de novo, vazio e refetch mantendo linhas", async () => {
    const onTentarNovamente = vi.fn();
    const { rerender } = renderizar({ estado: { fase: "loading" } });
    expect(screen.getByText("Carregando…")).toBeInTheDocument();
    expect(screen.queryByText("Alfa")).not.toBeInTheDocument();

    const tela = (estado: Recurso<Pagina<Linha>>) => (
      <TooltipProvider>
        <DataTable
          aria-label="Linhas"
          colunas={colunas}
          idLinha={(l) => l.id}
          estado={estado}
          onTentarNovamente={onTentarNovamente}
        />
      </TooltipProvider>
    );
    rerender(tela({ fase: "error", erro: new Error("x") }));
    await userEvent.setup().click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(onTentarNovamente).toHaveBeenCalled();

    rerender(tela(ok(pagina({ itens: [], total: 0, totalPaginas: 1 }))));
    expect(screen.getByText("Nenhum resultado")).toBeInTheDocument();

    rerender(tela({ fase: "loading", dados: pagina() }));
    expect(screen.getByText("Alfa")).toBeInTheDocument();
  });

  it("seleção em lote: indeterminado, selecionar todos, barra e ação por permissão", async () => {
    const onExecutar = vi.fn();
    function Tela() {
      const [sel, setSel] = useState<string[]>([]);
      return (
        <TooltipProvider>
          <DataTable
            aria-label="Linhas"
            colunas={colunas}
            idLinha={(l) => l.id}
            estado={ok()}
            selecionados={sel}
            onSelecaoChange={setSel}
            rotuloSelecao={(l) => `Selecionar ${l.nome}`}
            acoesEmLote={[
              { id: "atribuir", rotulo: "Atribuir", permissao: { ok: true }, onExecutar },
              { id: "inativar", rotulo: "Inativar", permissao: { ok: false, motivo: "Só gerentes." }, onExecutar },
            ]}
          />
        </TooltipProvider>
      );
    }
    const user = userEvent.setup();
    render(<Tela />);
    const todos = screen.getByRole("checkbox", { name: "Selecionar todos desta página" });
    expect(screen.queryByText(/selecionado/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "Selecionar Beta" }));
    expect(todos).toHaveAttribute("aria-checked", "mixed");
    expect(screen.getByRole("status")).toHaveTextContent("1 selecionado");

    await user.click(todos);
    expect(screen.getByRole("status")).toHaveTextContent("3 selecionados");
    expect(todos).toBeChecked();

    await user.click(screen.getByRole("button", { name: "Atribuir" }));
    expect(onExecutar).toHaveBeenCalledWith(expect.arrayContaining(["a", "b", "c"]));

    const negada = screen.getByRole("button", { name: "Inativar" });
    expect(negada).toHaveAttribute("aria-disabled", "true");
    expect(within(negada.parentElement!).getByText("Só gerentes.")).toBeInTheDocument();
    await user.click(negada);
    expect(onExecutar).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Limpar seleção" }));
    expect(screen.queryByText(/selecionado/)).not.toBeInTheDocument();
  });
});
