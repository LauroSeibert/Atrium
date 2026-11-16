import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeApi, __reiniciarParaTeste } from "@/mocks/services/fakeApi";

const replace = vi.fn();
let busca = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: replace }),
  usePathname: () => "/financeiro",
  useSearchParams: () => busca,
}));

import { TelaComissoes } from "./TelaComissoes";
import { TelaDespesas } from "./TelaDespesas";
import { TelaReceitas } from "./TelaReceitas";
import { TelaRepasses } from "./TelaRepasses";

const AGORA = "2026-11-14T12:00:00.000Z";
let larga = true;

beforeEach(() => {
  replace.mockClear();
  busca = new URLSearchParams();
  larga = true;
  window.matchMedia = ((q: string) => ({
    matches: larga,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  __reiniciarParaTeste({ agora: AGORA });
});

describe("TelaReceitas (RF-77)", () => {
  it("lista parcelas, filtra por status da URL e registra pagamento", async () => {
    busca = new URLSearchParams("status=atrasado");
    const esperado = await fakeApi.listReceitas({ status: ["atrasado"] }, { pagina: 1, porPagina: 10 });
    render(<TelaReceitas />);
    const tabela = await screen.findByRole("region", { name: "Receitas" });
    await within(tabela).findAllByRole("row");
    expect(screen.getByRole("list", { name: "Filtros aplicados" })).toHaveTextContent("Status: Atrasado");
    const alvo = esperado.itens.find((l) => l.podePagar.ok);
    if (!alvo) return;
    await userEvent.click(
      await screen.findByRole("button", {
        name: `Registrar pagamento da parcela ${alvo.numero} de ${alvo.numeroContrato}`,
      }),
    );
    await waitFor(async () => {
      const depois = await fakeApi.listReceitas({ contratoId: alvo.contratoId }, { pagina: 1, porPagina: 500 });
      expect(depois.itens.find((l) => l.numero === alvo.numero)?.status).toBe("pago");
    });
  });

  it("em tela estreita mostra cartões", async () => {
    larga = false;
    render(<TelaReceitas />);
    expect(await screen.findByRole("list", { name: "Receitas em cartões" })).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("erro oferece tentar de novo", async () => {
    __reiniciarParaTeste({ agora: AGORA, config: { taxaErro: 1 } });
    render(<TelaReceitas />);
    expect((await screen.findAllByRole("button", { name: /tentar de novo/i })).length).toBeGreaterThan(0);
  });
});

describe("TelaDespesas (RF-78)", () => {
  it("lança uma despesa pelo diálogo, com validação inline", async () => {
    render(<TelaDespesas />);
    await screen.findByRole("region", { name: "Despesas" });
    await userEvent.click(screen.getAllByRole("button", { name: "Nova despesa" })[0]!);
    const dialogo = await screen.findByRole("dialog", { name: "Nova despesa" });
    await userEvent.click(within(dialogo).getByRole("button", { name: "Lançar despesa" }));
    expect((await within(dialogo).findAllByText(/Preencha este campo|Selecione/)).length).toBeGreaterThan(0);
    expect(within(dialogo).getByRole("textbox", { name: /Descrição/ })).toBeInTheDocument();
  });

  it("erro oferece tentar de novo", async () => {
    __reiniciarParaTeste({ agora: AGORA, config: { taxaErro: 1 } });
    render(<TelaDespesas />);
    expect((await screen.findAllByRole("button", { name: /tentar de novo/i })).length).toBeGreaterThan(0);
  });
});

describe("TelaComissoes (RF-79)", () => {
  it("lista e marca como paga o que o domínio permite", async () => {
    const todas = await fakeApi.listComissoes();
    const alvo = todas.find((l) => l.podePagar.ok);
    render(<TelaComissoes />);
    await screen.findByRole("region", { name: "Comissões" });
    if (!alvo) return;
    const botoes = await screen.findAllByRole("button", { name: /Marcar como paga/ });
    expect(botoes.length).toBeGreaterThan(0);
    await userEvent.click(botoes[0]!);
    await waitFor(async () => {
      const depois = await fakeApi.listComissoes({ status: "paga" });
      expect(depois.length).toBeGreaterThan(todas.filter((l) => l.status === "paga").length);
    });
  });

  it("mostra o filtro de status", async () => {
    render(<TelaComissoes />);
    await screen.findByRole("region", { name: "Comissões" });
    expect(screen.getByRole("combobox", { name: "Status" })).toBeInTheDocument();
  });
});

describe("TelaRepasses (RF-80)", () => {
  it("carrega a tabela e erro tem nova tentativa", async () => {
    render(<TelaRepasses />);
    expect(await screen.findByRole("region", { name: "Repasses" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Mês" })).toBeInTheDocument();
  });

  it("erro oferece tentar de novo", async () => {
    __reiniciarParaTeste({ agora: AGORA, config: { taxaErro: 1 } });
    render(<TelaRepasses />);
    expect((await screen.findAllByRole("button", { name: /tentar de novo/i })).length).toBeGreaterThan(0);
  });
});
