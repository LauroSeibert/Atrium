import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Toaster } from "@/components/ui/Toast";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { __reiniciarParaTeste, fakeApi } from "@/mocks/services/fakeApi";
import { navegacao } from "./navegacaoFalsa";
import { TelaImoveis } from "./TelaImoveis";

vi.mock("next/navigation", async () => (await import("./navegacaoFalsa")).moduloNavegacaoFalsa);

function montar() {
  return render(
    <TooltipProvider>
      <TelaImoveis />
      <Toaster />
    </TooltipProvider>,
  );
}

beforeEach(() => {
  __reiniciarParaTeste({ agora: "2026-11-15T12:00:00-03:00" });
  navegacao.definirUrl("/imoveis?corretor=todos");
  window.localStorage.clear();
});

describe("TelaImoveis (RF-20…23, RF-28, RF-49)", () => {
  it("carrega a grade com total e paginação", async () => {
    const total = (await fakeApi.listImoveis({}, { pagina: 1, porPagina: 12 })).total;
    montar();
    expect(await screen.findByRole("list", { name: "Imóveis" })).toBeInTheDocument();
    expect(await screen.findByText(new RegExp(`${total.toLocaleString("pt-BR")} imóveis`))).toBeInTheDocument();
    expect(screen.getAllByRole("article").length).toBe(Math.min(12, total));
  });

  it("finalidade fica à vista na barra e grava na URL", async () => {
    const venda = (await fakeApi.listImoveis({ finalidade: "venda" }, { pagina: 1, porPagina: 12 })).total;
    const user = userEvent.setup();
    montar();
    await screen.findByRole("list", { name: "Imóveis" });
    await user.click(screen.getByRole("radio", { name: "Venda" }));
    await waitFor(() => expect(navegacao.url()).toContain("finalidade=venda"));
    expect(await screen.findByText(new RegExp(`${venda.toLocaleString("pt-BR")} imóve`))).toBeInTheDocument();
    // Sem linha de chips: aplicar filtro não empurra a lista.
    expect(screen.queryByRole("list", { name: "Filtros aplicados" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "Todos" }));
    await waitFor(() => expect(navegacao.url()).not.toContain("finalidade"));
  });

  it("busca sem resultado mostra vazio com Limpar filtros", async () => {
    navegacao.definirUrl("/imoveis?corretor=todos&q=zzzzinexistente");
    montar();
    expect(await screen.findByText("Nenhum imóvel encontrado")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
    await waitFor(() => expect(navegacao.url()).not.toContain("q="));
  });

  it("erro de rede mostra Tentar de novo", async () => {
    __reiniciarParaTeste({ agora: "2026-11-15T12:00:00-03:00", config: { taxaErro: 1 } });
    montar();
    const botao = await screen.findByRole("button", { name: "Tentar de novo" });
    __reiniciarParaTeste({ agora: "2026-11-15T12:00:00-03:00" });
    await userEvent.click(botao);
    expect(await screen.findByRole("list", { name: "Imóveis" })).toBeInTheDocument();
  });

  it("lista: selecionar e trocar status mostra toast", async () => {
    navegacao.definirUrl("/imoveis?corretor=todos&view=lista&status=disponivel");
    const user = userEvent.setup();
    montar();
    const tabela = await screen.findByRole("region", { name: "Imóveis" });
    const caixas = within(tabela).getAllByRole("checkbox", { name: /^Selecionar AT-/ });
    await user.click(caixas[0]!);
    await user.click(screen.getByRole("button", { name: "Marcar como reservado" }));
    const dialogo = await screen.findByRole("alertdialog");
    await user.click(within(dialogo).getByRole("button", { name: "Marcar como reservado" }));
    expect(await screen.findByText(/marcado como reservado/)).toBeInTheDocument();
  });

  it("favoritar mostra toast", async () => {
    const user = userEvent.setup();
    montar();
    await screen.findByRole("list", { name: "Imóveis" });
    await user.click(screen.getAllByRole("button", { name: /^Favoritar imóvel/ })[0]!);
    await waitFor(() => expect(screen.getByText(/favoritos/)).toBeInTheDocument());
  });
});
