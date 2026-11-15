import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FilterBar } from "./FilterBar";

describe("FilterBar (RF-21)", () => {
  it("emite a busca só depois do debounce", async () => {
    const onBuscaChange = vi.fn();
    render(<FilterBar busca="" onBuscaChange={onBuscaChange} debounceMs={150} />);
    await userEvent.setup().type(screen.getByRole("searchbox", { name: "Buscar" }), "casa");
    expect(onBuscaChange).not.toHaveBeenCalled();
    await waitFor(() => expect(onBuscaChange).toHaveBeenCalledTimes(1));
    expect(onBuscaChange).toHaveBeenCalledWith("casa");
  });

  it("sincroniza o campo quando a busca muda por fora (limpar tudo)", async () => {
    function Tela() {
      const [busca, setBusca] = useState("sobrado");
      return (
        <FilterBar
          busca={busca}
          onBuscaChange={setBusca}
          ativos={[{ id: "a", rotulo: "Casa", onRemover: () => {} }]}
          onLimparTudo={() => setBusca("")}
        />
      );
    }
    const user = userEvent.setup();
    render(<Tela />);
    expect(screen.getByRole("searchbox")).toHaveValue("sobrado");
    await user.click(screen.getByRole("button", { name: "Limpar tudo" }));
    expect(screen.getByRole("searchbox")).toHaveValue("");
  });

  it("mostra chips removíveis, contador e Limpar tudo só com filtros ativos", async () => {
    const onRemover = vi.fn();
    const onLimparTudo = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <FilterBar
        busca=""
        onBuscaChange={() => {}}
        total={143}
        rotuloItem={["imóvel", "imóveis"]}
        ativos={[{ id: "tipo", rotulo: "Casa", onRemover }]}
        onLimparTudo={onLimparTudo}
        filtros={<p>Conteúdo</p>}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("143 imóveis");
    expect(screen.getByRole("button", { name: "Filtros (1)" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remover filtro: Casa" }));
    expect(onRemover).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Limpar tudo" }));
    expect(onLimparTudo).toHaveBeenCalledTimes(1);

    rerender(<FilterBar busca="" onBuscaChange={() => {}} total={1} rotuloItem={["imóvel", "imóveis"]} />);
    expect(screen.queryByRole("button", { name: "Limpar tudo" })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("1 imóvel");
  });

  it("anuncia 'Buscando…' enquanto carrega e 'Nenhum resultado' com total 0", () => {
    const { rerender } = render(<FilterBar busca="" onBuscaChange={() => {}} total={5} estado="carregando" />);
    expect(screen.getByRole("status")).toHaveTextContent("Buscando…");
    rerender(<FilterBar busca="" onBuscaChange={() => {}} total={0} />);
    expect(screen.getByRole("status")).toHaveTextContent("Nenhum resultado");
  });

  it("abre os filtros no popover e recolhe 'Mais filtros' até o clique", async () => {
    const user = userEvent.setup();
    render(
      <FilterBar
        busca=""
        onBuscaChange={() => {}}
        filtros={<p>Filtro principal</p>}
        maisFiltros={<p>Filtro extra</p>}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Filtros" }));
    expect(await screen.findByText("Filtro principal")).toBeVisible();
    const mais = screen.getByRole("button", { name: "Mais filtros" });
    expect(mais).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("Filtro extra")).not.toBeVisible();
    await user.click(mais);
    expect(mais).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Filtro extra")).toBeVisible();
  });
});
