import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { CommandPalette, useAtalhoPaleta, type GrupoPaleta } from "./CommandPalette";

const aoEscolher = vi.fn();
const grupos: GrupoPaleta[] = [
  {
    id: "imoveis",
    rotulo: "Imóveis",
    itens: [
      { id: "1", rotulo: "Cobertura Jardins", descricao: "AT-0001 · São Paulo", onSelect: aoEscolher },
      { id: "2", rotulo: "Casa em Pinheiros", onSelect: vi.fn() },
    ],
  },
  { id: "acoes", rotulo: "Ações", itens: [{ id: "novo", rotulo: "Novo lead", atalho: ["N", "L"], onSelect: vi.fn() }] },
];

describe("CommandPalette (RF-02, RF-35)", () => {
  it("mostra grupos, itens e atalhos", () => {
    render(<CommandPalette aberto onAbertoChange={vi.fn()} grupos={grupos} />);
    expect(screen.getByRole("dialog", { name: "Paleta de comandos" })).toBeInTheDocument();
    expect(screen.getByText("Imóveis")).toBeInTheDocument();
    expect(screen.getByText("Ações")).toBeInTheDocument();
    expect(screen.getByText("N")).toBeInTheDocument();
  });

  it("filtra sem acento e mostra o estado vazio", async () => {
    const user = userEvent.setup();
    render(<CommandPalette aberto onAbertoChange={vi.fn()} grupos={grupos} />);
    await user.type(screen.getByRole("combobox", { name: "Buscar" }), "sao paulo");
    expect(screen.getByText("Cobertura Jardins")).toBeInTheDocument();
    expect(screen.queryByText("Casa em Pinheiros")).not.toBeInTheDocument();
    await user.clear(screen.getByRole("combobox", { name: "Buscar" }));
    await user.type(screen.getByRole("combobox", { name: "Buscar" }), "xyzw");
    expect(screen.getByText("Nenhum resultado para “xyzw”")).toBeInTheDocument();
  });

  it("Enter executa o item destacado e fecha", async () => {
    const onAbertoChange = vi.fn();
    const user = userEvent.setup();
    render(<CommandPalette aberto onAbertoChange={onAbertoChange} grupos={grupos} />);
    await user.keyboard("{Enter}");
    expect(aoEscolher).toHaveBeenCalledOnce();
    expect(onAbertoChange).toHaveBeenCalledWith(false);
  });

  it("Esc pede para fechar", async () => {
    const onAbertoChange = vi.fn();
    const user = userEvent.setup();
    render(<CommandPalette aberto onAbertoChange={onAbertoChange} grupos={grupos} />);
    await user.keyboard("{Escape}");
    expect(onAbertoChange).toHaveBeenCalledWith(false);
  });

  it("estado carregando mostra aviso de busca, sem 'nenhum resultado'", async () => {
    const user = userEvent.setup();
    render(<CommandPalette aberto onAbertoChange={vi.fn()} grupos={grupos} estado={{ fase: "loading" }} />);
    expect(screen.getByRole("status")).toHaveTextContent("Buscando resultados…");
    await user.type(screen.getByRole("combobox", { name: "Buscar" }), "xyzw");
    expect(screen.queryByText(/Nenhum resultado/)).not.toBeInTheDocument();
  });

  it("erro remoto oferece tentar de novo", async () => {
    const onTentarNovamente = vi.fn();
    const user = userEvent.setup();
    render(
      <CommandPalette
        aberto
        onAbertoChange={vi.fn()}
        grupos={grupos}
        estado={{ fase: "error", erro: new Error("x") }}
        onTentarNovamente={onTentarNovamente}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(onTentarNovamente).toHaveBeenCalledOnce();
  });
});

describe("useAtalhoPaleta", () => {
  function Teste({ onAbrir }: { onAbrir: () => void }) {
    useAtalhoPaleta(onAbrir);
    return null;
  }
  it("⌘K e Ctrl+K chamam onAbrir; K sozinho não", () => {
    const onAbrir = vi.fn();
    render(<Teste onAbrir={onAbrir} />);
    act(() => {
      fireEvent.keyDown(window, { key: "k", metaKey: true });
      fireEvent.keyDown(window, { key: "K", ctrlKey: true });
      fireEvent.keyDown(window, { key: "k" });
    });
    expect(onAbrir).toHaveBeenCalledTimes(2);
  });

  it("abre uma paleta controlada", () => {
    function App() {
      const [aberto, setAberto] = useState(false);
      useAtalhoPaleta(() => setAberto(true));
      return <CommandPalette aberto={aberto} onAbertoChange={setAberto} grupos={grupos} />;
    }
    render(<App />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    act(() => {
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
