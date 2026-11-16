import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "../ui/Tooltip";
import { NAV_PRINCIPAL } from "./navegacao";
import { NavegacaoPrincipal, type NavegacaoPrincipalProps } from "./NavegacaoPrincipal";

function montar(props: Partial<NavegacaoPrincipalProps> = {}) {
  return render(
    <TooltipProvider>
      <NavegacaoPrincipal itens={NAV_PRINCIPAL} pathname="/" {...props} />
    </TooltipProvider>,
  );
}

describe("NavegacaoPrincipal (RF-01)", () => {
  it("renderiza os links visíveis e chama onNavegar ao clicar", async () => {
    const onNavegar = vi.fn();
    montar({ onNavegar });
    // 8 links fora do submenu (fechado, fora da rota): Dashboard, 3 + 3 dos grupos e Relatórios.
    expect(screen.getAllByRole("link")).toHaveLength(8);
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");
    await userEvent.click(screen.getByRole("link", { name: "Leads" }));
    expect(onNavegar).toHaveBeenCalledTimes(1);
  });

  it("mostra os rótulos de grupo, que não são links nem botões", () => {
    montar();
    expect(screen.getByText("Comercial")).toBeInTheDocument();
    expect(screen.getByText("Operação")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Comercial" })).not.toBeInTheDocument();
    const lista = screen.getByRole("list", { name: "Operação" });
    expect(
      within(lista)
        .getAllByRole("link")
        .map((l) => l.textContent),
    ).toEqual(["Imóveis", "Anúncios", "Contratos"]);
  });

  it("recolhida: sem rótulos de grupo, links com nome acessível", () => {
    montar({ recolhida: true });
    expect(screen.queryByText("Comercial")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Agenda" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Financeiro" })).toBeInTheDocument();
  });
});

describe("submenu do Financeiro (expandido)", () => {
  it("começa fechado fora da rota e expande/recolhe no lugar", async () => {
    montar({ pathname: "/leads" });
    const botao = screen.getByRole("button", { name: "Financeiro" });
    expect(botao).toHaveAttribute("aria-expanded", "false");
    expect(botao).toHaveAttribute("aria-controls");
    expect(screen.queryByRole("link", { name: "Receitas" })).not.toBeInTheDocument();
    await userEvent.click(botao);
    expect(botao).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Receitas" })).toBeInTheDocument();
    expect(document.getElementById(botao.getAttribute("aria-controls")!)).toBeVisible();
    await userEvent.click(botao);
    expect(botao).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "Receitas" })).not.toBeInTheDocument();
  });

  it("abre por padrão dentro da rota e marca só o filho atual", () => {
    montar({ pathname: "/financeiro/receitas" });
    expect(screen.getByRole("button", { name: "Financeiro" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Receitas" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Visão geral" })).not.toHaveAttribute("aria-current");
  });

  it("Visão geral fica ativa só na rota exata", () => {
    montar({ pathname: "/financeiro" });
    expect(screen.getByRole("link", { name: "Visão geral" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Receitas" })).not.toHaveAttribute("aria-current");
  });

  it("o usuário pode fechar o submenu mesmo dentro da rota", async () => {
    montar({ pathname: "/financeiro/despesas" });
    await userEvent.click(screen.getByRole("button", { name: "Financeiro" }));
    expect(screen.queryByRole("link", { name: "Despesas" })).not.toBeInTheDocument();
  });
});

describe("painel flutuante do Financeiro (recolhida)", () => {
  it("abre com os 5 filhos, marca o ativo, e Esc fecha devolvendo o foco", async () => {
    montar({ recolhida: true, pathname: "/financeiro/comissoes" });
    const gatilho = screen.getByRole("button", { name: "Financeiro" });
    expect(screen.queryByRole("link", { name: "Receitas" })).not.toBeInTheDocument();
    expect(gatilho).toHaveAttribute("aria-current", "true");
    await userEvent.click(gatilho);
    const painel = await screen.findByRole("dialog", { name: "Financeiro" });
    expect(within(painel).getAllByRole("link")).toHaveLength(5);
    expect(within(painel).getByRole("link", { name: "Comissões" })).toHaveAttribute("aria-current", "page");
    expect(within(painel).getByRole("link", { name: "Visão geral" })).not.toHaveAttribute("aria-current");
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(gatilho).toHaveFocus();
  });

  it("abre pelo teclado e escolher um item fecha o painel", async () => {
    const onNavegar = vi.fn();
    montar({ recolhida: true, onNavegar });
    await userEvent.tab();
    const gatilho = screen.getByRole("button", { name: "Financeiro" });
    gatilho.focus();
    await userEvent.keyboard("{Enter}");
    const painel = await screen.findByRole("dialog", { name: "Financeiro" });
    await userEvent.click(within(painel).getByRole("link", { name: "Repasses" }));
    expect(onNavegar).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("grupos recolhíveis (drawer mobile)", () => {
  it("só o grupo da rota atual começa aberto e cada um alterna", async () => {
    montar({ pathname: "/imoveis", gruposRecolhiveis: true, tamanho: "toque" });
    const operacao = screen.getByRole("button", { name: "Operação" });
    const comercial = screen.getByRole("button", { name: "Comercial" });
    expect(operacao).toHaveAttribute("aria-expanded", "true");
    expect(comercial).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("link", { name: "Imóveis" })).toHaveClass("h-11");
    expect(screen.queryByRole("link", { name: "Leads" })).not.toBeInTheDocument();
    await userEvent.click(comercial);
    expect(screen.getByRole("link", { name: "Leads" })).toBeInTheDocument();
  });
});
