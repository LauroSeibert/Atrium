import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { formatMoeda } from "@/lib/format";
import { fakeApi, __reiniciarParaTeste } from "@/mocks/services/fakeApi";

let busca = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/financeiro",
  useSearchParams: () => busca,
}));

import { TelaFinanceiro } from "./TelaFinanceiro";

const texto = (x: Element | string) => (typeof x === "string" ? x : (x.textContent ?? "")).replace(/\s/g, " ");
const AGORA = "2026-11-14T12:00:00.000Z";

beforeEach(() => {
  busca = new URLSearchParams();
  window.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  __reiniciarParaTeste({ agora: AGORA });
});

describe("TelaFinanceiro (RF-44, RF-45)", () => {
  it("mostra os indicadores calculados pelo domínio", async () => {
    const fin = await fakeApi.getFinanceiro("mesAtual");
    render(<TelaFinanceiro />);
    const recebida = await screen.findByRole("group", { name: "Receita recebida" });
    expect(texto(recebida)).toContain(texto(formatMoeda(fin.recebido)));
    expect(screen.getByRole("group", { name: "Inadimplência" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Comissões" })).toBeInTheDocument();
    const faixas = screen.getByRole("list", { name: "Parcelas atrasadas por faixa de atraso" });
    expect(within(faixas).getAllByRole("listitem")).toHaveLength(3);
  });

  it("período vem da URL", async () => {
    busca = new URLSearchParams("periodo=ultimos12");
    const fin = await fakeApi.getFinanceiro("ultimos12");
    render(<TelaFinanceiro />);
    const recebida = await screen.findByRole("group", { name: "Receita recebida" });
    expect(texto(recebida)).toContain(texto(formatMoeda(fin.recebido)));
    expect(screen.getByRole("combobox", { name: "Período" })).toHaveTextContent("Últimos 12 meses");
  });

  it("erro oferece tentar de novo", async () => {
    __reiniciarParaTeste({ agora: AGORA, config: { taxaErro: 1 } });
    render(<TelaFinanceiro />);
    expect((await screen.findAllByRole("button", { name: /tentar de novo/i })).length).toBeGreaterThan(0);
  });
});
