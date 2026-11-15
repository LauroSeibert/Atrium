import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PERMITIDO, negar } from "@/domain";
import { BASE_HISTORIAS, CASOS_HISTORIAS, imovelPorId } from "@/mocks/data/historias";
import { PropertyCard, PropertyCardSkeleton } from "./PropertyCard";
import { PropertyRow, PropertyRowSkeleton } from "./PropertyRow";

const venda = BASE_HISTORIAS.imoveis.find((i) => i.finalidade === "venda" && i.tipo !== "terreno")!;
const locacao = BASE_HISTORIAS.imoveis.find((i) => i.finalidade === "locacao" && i.tipo !== "terreno")!;
const terreno = imovelPorId(CASOS_HISTORIAS.imovelTerrenoSemComodos);

function stubs() {
  // Radix usa ResizeObserver/matchMedia em alguns componentes.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

stubs();

describe.each([
  ["PropertyCard", PropertyCard],
  ["PropertyRow", PropertyRow],
])("%s", (_nome, Comp) => {
  it("mostra título como link, código, status e preço sem /mês na venda", () => {
    render(<Comp imovel={venda} href="/imoveis/x" />);
    expect(screen.getByRole("link", { name: venda.titulo })).toHaveAttribute("href", "/imoveis/x");
    expect(screen.getByText(venda.codigo)).toBeInTheDocument();
    expect(screen.queryByText("/mês")).not.toBeInTheDocument();
  });

  it("locação mostra /mês", () => {
    render(<Comp imovel={locacao} href="/x" />);
    expect(screen.getByText("/mês")).toBeInTheDocument();
  });

  it("terreno mostra só a área, sem quartos nem vagas", () => {
    render(<Comp imovel={terreno} href="/x" />);
    const specs = screen.getByRole("list", { name: "Características" });
    expect(within(specs).getAllByRole("listitem")).toHaveLength(1);
    expect(within(specs).getByText("de área total")).toBeInTheDocument();
  });

  it("favorito é toggle com aria-pressed e emite o id", async () => {
    const onAlternarFavorito = vi.fn();
    render(<Comp imovel={{ ...venda, favorito: true }} href="/x" onAlternarFavorito={onAlternarFavorito} />);
    const b = screen.getByRole("button", { name: `Favoritar imóvel ${venda.codigo}` });
    expect(b).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(b);
    expect(onAlternarFavorito).toHaveBeenCalledWith(venda.id);
  });

  it("botões não ficam dentro do link", () => {
    render(
      <Comp imovel={venda} href="/x" acoes={[{ id: "a", rotulo: "A", permissao: PERMITIDO, onSelect: vi.fn() }]} />,
    );
    const link = screen.getByRole("link");
    expect(within(link).queryByRole("button")).toBeNull();
  });

  it("menu: ação permitida dispara, negada fica desabilitada com o motivo", async () => {
    const ok = vi.fn();
    const negada = vi.fn();
    render(
      <Comp
        imovel={venda}
        href="/x"
        acoes={[
          { id: "ok", rotulo: "Reservar", permissao: PERMITIDO, onSelect: ok },
          { id: "no", rotulo: "Inativar", permissao: negar("Imóvel com contrato ativo."), onSelect: negada },
        ]}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: `Mais ações do imóvel ${venda.codigo}` }));
    const item = screen.getByRole("menuitem", { name: /Inativar/ });
    expect(item).toHaveAttribute("aria-disabled", "true");
    expect(within(item).getByText("Imóvel com contrato ativo.")).toBeInTheDocument();
    await userEvent.click(item);
    expect(negada).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("menuitem", { name: "Reservar" }));
    expect(ok).toHaveBeenCalledTimes(1);
  });

  it("sem ações não mostra o menu", () => {
    render(<Comp imovel={venda} href="/x" />);
    expect(screen.queryByRole("button", { name: /Mais ações/ })).toBeNull();
  });
});

describe("esqueletos", () => {
  it("anunciam o carregamento", () => {
    render(
      <>
        <PropertyCardSkeleton />
        <PropertyRowSkeleton />
      </>,
    );
    expect(screen.getAllByRole("status", { name: "Carregando imóvel" })).toHaveLength(2);
  });
});
