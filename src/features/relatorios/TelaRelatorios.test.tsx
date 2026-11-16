import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { __reiniciarParaTeste } from "@/mocks/services/fakeApi";

let busca = new URLSearchParams();
const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => "/relatorios",
  useSearchParams: () => busca,
}));
const baixar = vi.hoisted(() => vi.fn());
vi.mock("@/lib/csv", async (orig) => ({ ...(await orig<typeof import("@/lib/csv")>()), baixarCsv: baixar }));

import { TelaRelatorios } from "./TelaRelatorios";

const AGORA = "2026-11-14T12:00:00.000Z";

beforeEach(() => {
  busca = new URLSearchParams();
  replace.mockClear();
  baixar.mockClear();
  window.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  __reiniciarParaTeste({ agora: AGORA });
});

describe("TelaRelatorios (RF-82)", () => {
  it("mostra o primeiro relatório com tabela acessível", async () => {
    render(<TelaRelatorios />);
    expect(await screen.findByRole("table", { name: "Vendas por período" })).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(5);
  });

  it("aba e filtros vêm da URL", async () => {
    busca = new URLSearchParams("relatorio=receita&periodo=ultimos3");
    render(<TelaRelatorios />);
    expect(await screen.findByRole("table", { name: "Receita por período" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Período" })).toHaveTextContent("Últimos 3 meses");
  });

  it("trocar de aba grava na URL", async () => {
    render(<TelaRelatorios />);
    await screen.findByRole("table", { name: "Vendas por período" });
    await userEvent.click(screen.getByRole("tab", { name: "Conversão" }));
    expect(replace).toHaveBeenCalledWith("/relatorios?relatorio=conversao", { scroll: false });
  });

  it("exporta o CSV do relatório", async () => {
    busca = new URLSearchParams("relatorio=corretores");
    render(<TelaRelatorios />);
    await screen.findByRole("table", { name: "Desempenho dos corretores" });
    await userEvent.click(screen.getByRole("button", { name: /Exportar CSV/ }));
    await waitFor(() => expect(baixar).toHaveBeenCalledTimes(1));
    expect(baixar.mock.calls[0]![0]).toBe("relatorio-corretores.csv");
    expect(baixar.mock.calls[0]![1]).toContain("Corretor;Negociações");
  });

  it("erro oferece tentar de novo", async () => {
    __reiniciarParaTeste({ agora: AGORA, config: { taxaErro: 1 } });
    render(<TelaRelatorios />);
    expect(await screen.findByRole("button", { name: /Tentar de novo/ })).toBeInTheDocument();
  });
});
