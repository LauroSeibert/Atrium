import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Toaster, useToastStore } from "@/components/ui/Toast";
import { __reiniciarParaTeste, fakeApi } from "@/mocks/services/fakeApi";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/anuncios",
  useSearchParams: () => new URLSearchParams(),
}));

import { TelaAnuncios } from "./TelaAnuncios";

const AGORA = "2026-11-14T12:00:00.000Z";

beforeEach(() => {
  useToastStore.getState().clear();
  window.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  __reiniciarParaTeste({ agora: AGORA });
});

const renderTela = () =>
  render(
    <>
      <TelaAnuncios />
      <Toaster />
    </>,
  );

describe("TelaAnuncios (RF-75)", () => {
  it("lista os anúncios com as ações que o domínio permite", async () => {
    const lista = await fakeApi.listAnuncios();
    expect(lista.length).toBeGreaterThan(0);
    renderTela();
    expect(await screen.findByRole("region", { name: "Anúncios" })).toBeInTheDocument();
    const publicado = lista.find((a) => a.transicoes.some((t) => t.para === "pausado"));
    if (publicado) {
      expect((await screen.findAllByRole("button", { name: /^Pausar / })).length).toBeGreaterThan(0);
    }
  });

  it("pausar mostra toast e Desfazer volta", async () => {
    const lista = await fakeApi.listAnuncios();
    const alvo = lista.find((a) => a.transicoes.some((t) => t.para === "pausado"));
    if (!alvo) throw new Error("sem anúncio publicado");
    renderTela();
    const botoes = await screen.findAllByRole("button", { name: /^Pausar / });
    await userEvent.click(botoes[0]!);
    expect((await screen.findAllByText("Anúncio pausado")).length).toBeGreaterThan(0);
    await userEvent.click(await screen.findByRole("button", { name: "Desfazer" }));
    expect((await screen.findAllByText("Alteração desfeita")).length).toBeGreaterThan(0);
  });

  it("encerrar pede confirmação", async () => {
    renderTela();
    const botoes = await screen.findAllByRole("button", { name: /^Encerrar / });
    await userEvent.click(botoes[0]!);
    const dialogo = await screen.findByRole("alertdialog");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Encerrar anúncio" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect((await screen.findAllByText("Anúncio encerrado")).length).toBeGreaterThan(0);
  });

  it("novo anúncio exige imóvel e canal", async () => {
    renderTela();
    await userEvent.click((await screen.findAllByRole("button", { name: "Novo anúncio" }))[0]!);
    const dialogo = await screen.findByRole("dialog");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Criar anúncio" }));
    expect(await within(dialogo).findByText("Escolha o imóvel.")).toBeInTheDocument();
    expect(within(dialogo).getByText("Escolha o canal.")).toBeInTheDocument();
  });

  it("falha de rede oferece tentar de novo", async () => {
    __reiniciarParaTeste({ agora: AGORA, config: { taxaErro: 1 } });
    renderTela();
    expect(await screen.findByRole("button", { name: /tentar de novo/i })).toBeInTheDocument();
  });
});
