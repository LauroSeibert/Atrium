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

const AGORA = "2026-11-14T12:00:00.000Z";
const GRANDE = { pagina: 1, porPagina: 1000 };

beforeEach(() => {
  replace.mockClear();
  busca = new URLSearchParams();
  window.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  __reiniciarParaTeste({ agora: AGORA });
});

const contagem = (n: number) => `${n.toLocaleString("pt-BR")} ${n === 1 ? "contrato" : "contratos"}`;

describe("TelaContratos (RF-40, RF-41, RF-47)", () => {
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
    expect(screen.getByRole("list", { name: "Filtros aplicados" })).toHaveTextContent("Status: Inadimplente");
    const tabela = screen.getByRole("region", { name: "Contratos" });
    for (const l of esperado.itens.slice(0, 10))
      expect(within(tabela).getByText(l.contrato.numero)).toBeInTheDocument();
  });

  it("marcar um status grava na URL", async () => {
    render(<TelaContratos />);
    await screen.findByRole("region", { name: "Contratos" });
    await userEvent.click(screen.getByRole("button", { name: "Filtros" }));
    await userEvent.click(await screen.findByRole("checkbox", { name: "Inadimplente" }));
    expect(replace).toHaveBeenCalledWith(expect.stringContaining("status=inadimplente"), expect.anything());
  });

  it("erro de carregamento oferece tentar de novo", async () => {
    __reiniciarParaTeste({ agora: AGORA, config: { taxaErro: 1 } });
    render(<TelaContratos />);
    const botoes = await screen.findAllByRole("button", { name: /tentar de novo/i });
    expect(botoes.length).toBeGreaterThan(0);
  });
});
