import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeApi, __reiniciarParaTeste } from "@/mocks/services/fakeApi";

const replace = vi.fn();
let busca = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: replace }),
  usePathname: () => "/contratos",
  useSearchParams: () => busca,
}));

import { TelaContratos } from "./TelaContratos";

let telaLarga = true;
const AGORA = "2026-11-14T12:00:00.000Z";
const GRANDE = { pagina: 1, porPagina: 1000 };

beforeEach(() => {
  replace.mockClear();
  busca = new URLSearchParams();
  telaLarga = true;
  window.matchMedia = ((q: string) => ({
    matches: telaLarga,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  __reiniciarParaTeste({ agora: AGORA });
});

const contagem = (n: number) => `${n.toLocaleString("pt-BR")} ${n === 1 ? "contrato" : "contratos"}`;

describe("TelaContratos (RF-40, RF-41, RF-47)", () => {
  it("em tela estreita renderiza só os cartões, sem tabela", async () => {
    telaLarga = false;
    window.matchMedia = ((q: string) => ({
      matches: false,
      media: q,
      addEventListener() {},
      removeEventListener() {},
    })) as unknown as typeof window.matchMedia;
    render(<TelaContratos />);
    expect(await screen.findByRole("list", { name: "Contratos em cartões" })).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("carrega a tabela com contratos e links para o detalhe", async () => {
    const { itens } = await fakeApi.listContratos({}, { pagina: 1, porPagina: 10 });
    render(<TelaContratos />);
    const tabela = await screen.findByRole("region", { name: "Contratos" });
    const link = await within(tabela).findByRole("link", { name: itens[0]!.contrato.numero });
    expect(link).toHaveAttribute("href", `/contratos/${itens[0]!.contrato.id}`);
  });

  it("filtra por status vindo da URL e anuncia a contagem", async () => {
    busca = new URLSearchParams("status=inadimplente");
    const esperado = await fakeApi.listContratos({ status: ["inadimplente"] }, GRANDE);
    render(<TelaContratos />);
    await waitFor(() =>
      expect(
        screen.getByText(contagem(esperado.total).replace(/^0 contratos$/, "Nenhum resultado")),
      ).toBeInTheDocument(),
    );
    // O status vira a aba ativa (não um chip).
    expect(screen.getByRole("button", { name: /Inadimplentes/, pressed: true })).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Filtros aplicados" })).not.toBeInTheDocument();
    const tabela = screen.getByRole("region", { name: "Contratos" });
    for (const l of esperado.itens.slice(0, 10))
      expect(within(tabela).getByText(l.contrato.numero)).toBeInTheDocument();
  });

  it("a aba de status mostra a contagem e filtra pela URL", async () => {
    const todos = await fakeApi.listContratos({}, GRANDE);
    render(<TelaContratos />);
    await screen.findByRole("region", { name: "Contratos" });
    const grupo = screen.getByRole("group", { name: "Status do contrato" });
    await waitFor(() =>
      expect(within(grupo).getByRole("button", { pressed: true })).toHaveTextContent(`${todos.total} Todos`),
    );
    await userEvent.click(within(grupo).getByRole("button", { name: /Inadimplentes/ }));
    expect(replace).toHaveBeenCalledWith(expect.stringContaining("status=inadimplente"), expect.anything());
  });

  it("tipo e vencimento ficam à vista na barra, sem botão Filtros, e gravam na URL", async () => {
    busca = new URLSearchParams("de=2026-12-01&ate=2026-12-15");
    render(<TelaContratos />);
    await screen.findByRole("region", { name: "Contratos" });
    expect(screen.queryByRole("button", { name: /^Filtros/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("radio", { name: "Venda" }));
    expect(replace).toHaveBeenCalledWith(expect.stringContaining("tipo=venda"), expect.anything());
    // O botão mostra o intervalo aplicado; o Popover só tem os campos.
    const botao = screen.getByRole("button", { name: "Vencimento: de 01/12/26 até 15/12/26" });
    expect(botao).toHaveTextContent("01/12/26 → 15/12/26");
    await userEvent.click(botao);
    const vencimento = await screen.findByRole("group", { name: "Vencimento" });
    expect(within(vencimento).getByRole("textbox", { name: "Vencimento a partir de" })).toBeInTheDocument();
    expect(within(vencimento).getByRole("textbox", { name: "Vencimento até" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Limpar" }));
    expect(replace).toHaveBeenLastCalledWith(expect.not.stringContaining("de="), expect.anything());
  });

  it("erro de carregamento oferece tentar de novo", async () => {
    __reiniciarParaTeste({ agora: AGORA, config: { taxaErro: 1 } });
    render(<TelaContratos />);
    const botoes = await screen.findAllByRole("button", { name: /tentar de novo/i });
    expect(botoes.length).toBeGreaterThan(0);
  });
});
