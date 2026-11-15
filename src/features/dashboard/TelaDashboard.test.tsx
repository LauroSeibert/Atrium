import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { __reiniciarParaTeste, fakeApi } from "@/mocks/services/fakeApi";
import { TelaDashboard } from "./TelaDashboard";

const AGORA = "2026-11-14T12:00:00.000Z";

const nav = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn(), busca: "" }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: nav.replace, push: nav.push }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(nav.busca),
}));

// jsdom não tem matchMedia (usado pelos gráficos para movimento reduzido).
globalThis.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  addEventListener() {},
  removeEventListener() {},
  addListener() {},
  removeListener() {},
  onchange: null,
  dispatchEvent: () => false,
})) as typeof globalThis.matchMedia;

beforeEach(() => {
  nav.replace.mockClear();
  nav.push.mockClear();
  nav.busca = "";
  __reiniciarParaTeste({ agora: AGORA });
});

describe("TelaDashboard (RF-10…16)", () => {
  it("carrega KPIs, gráficos, atividades com link de origem, compromissos e metas", async () => {
    render(<TelaDashboard />);
    expect(screen.getByRole("heading", { level: 1, name: "Dashboard" })).toBeInTheDocument();

    for (const rotulo of ["Imóveis ativos", "Leads novos", "Visitas em 7 dias", "Receita"])
      expect(await screen.findByRole("group", { name: rotulo })).toBeInTheDocument();

    expect(await screen.findByRole("heading", { name: "Receita dos últimos 12 meses" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Funil de leads" })).toBeInTheDocument();

    const atividades = await screen.findByRole("list", { name: "Atividades recentes" });
    const itens = within(atividades).getAllByRole("listitem");
    expect(itens.length).toBeGreaterThan(0);
    expect(itens.length).toBeLessThanOrEqual(10);
    expect(within(atividades).getAllByRole("link")[0]).toHaveAttribute(
      "href",
      expect.stringMatching(/^\/(imoveis|leads|contratos)\//),
    );

    const agenda = await screen.findByRole("group", { name: "Próximos compromissos" });
    expect(within(agenda).getAllByRole("listitem").length).toBeGreaterThan(0);

    expect(await screen.findByRole("heading", { name: "Meta do mês" })).toBeInTheDocument();
    expect(await screen.findByText("Geral")).toBeInTheDocument();
  });

  it("filtro de período vive na URL (RF-15) e a URL define o valor mostrado", async () => {
    const user = userEvent.setup();
    const a = render(<TelaDashboard />);
    await screen.findByRole("group", { name: "Receita" });
    await user.click(screen.getByRole("combobox", { name: "Período" }));
    await user.click(await screen.findByRole("option", { name: "Últimos 3 meses" }));
    expect(nav.replace).toHaveBeenCalledWith("/?periodo=ultimos3", { scroll: false });
    a.unmount();

    nav.busca = "periodo=ultimos12";
    render(<TelaDashboard />);
    expect(screen.getByRole("combobox", { name: "Período" })).toHaveTextContent("Últimos 12 meses");
    expect((await screen.findAllByText(/vs\. 12 meses anteriores/)).length).toBeGreaterThan(0);
  });

  it("período inválido na URL cai no mês atual", async () => {
    nav.busca = "periodo=xyz";
    render(<TelaDashboard />);
    expect(screen.getByRole("combobox", { name: "Período" })).toHaveTextContent("Mês atual");
    await screen.findByRole("group", { name: "Receita" });
  });

  it("erro com taxaErro 1 mostra Tentar de novo e se recupera", async () => {
    const user = userEvent.setup();
    fakeApi.configurar({ taxaErro: 1 });
    render(<TelaDashboard />);
    const botoes = await screen.findAllByRole("button", { name: "Tentar de novo" });
    expect(botoes.length).toBeGreaterThan(0);
    fakeApi.configurar({ taxaErro: 0 });
    await user.click(botoes[0]!);
    expect(await screen.findByRole("group", { name: "Receita" })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("button", { name: "Tentar de novo" })).not.toBeInTheDocument());
  });

  it('a ação primária "Novo lead" leva a /leads?novo=1', async () => {
    render(<TelaDashboard />);
    const links = screen.getAllByRole("link", { name: "Novo lead" });
    expect(links[0]).toHaveAttribute("href", "/leads?novo=1");
    await screen.findByRole("group", { name: "Receita" });
  });
});
