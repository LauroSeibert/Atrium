import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Toaster, useToastStore } from "@/components/ui/Toast";
import { formatMoeda } from "@/lib/format";
const sp = (t: string) => t.replace(/\s/g, " ");
const temValor = (alvo: HTMLElement, v: string) => expect(sp(alvo.textContent ?? "")).toContain(sp(v));
import { fakeApi, __reiniciarParaTeste } from "@/mocks/services/fakeApi";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/contratos/x",
  useSearchParams: () => new URLSearchParams(),
}));

import { TelaContrato } from "./TelaContrato";

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

/** Um contrato ativo com ao menos uma parcela em aberto, com o que o domínio permite. */
async function contratoComParcelaEmAberto() {
  const { itens } = await fakeApi.listContratos({ status: ["ativo"] }, { pagina: 1, porPagina: 1000 });
  for (const l of itens) {
    const d = await fakeApi.getContrato(l.contrato.id);
    const parcela = d.parcelas.find((p) => !p.pagoEm);
    if (parcela) return { d, parcela };
  }
  throw new Error("sem contrato ativo com parcela em aberto");
}

const recebidoDe = (d: Awaited<ReturnType<typeof fakeApi.getContrato>>) =>
  d.parcelas.filter((p) => p.pagoEm).reduce((s, p) => s + p.valor, 0);

describe("TelaContrato (RF-42, RF-43, RF-48)", () => {
  it("registrar pagamento mostra toast, atualiza o indicador Pago e Desfazer volta", async () => {
    const { d, parcela } = await contratoComParcelaEmAberto();
    const antes = recebidoDe(d);
    render(
      <>
        <TelaContrato id={d.contrato.id} />
        <Toaster />
      </>,
    );
    const pago = await screen.findByRole("group", { name: "Pago" });
    temValor(pago, formatMoeda(antes));

    const botoes = await screen.findAllByRole("button", { name: `Registrar pagamento da parcela ${parcela.numero}` });
    await userEvent.click(botoes[0]!);

    expect((await screen.findAllByText(`Pagamento da parcela ${parcela.numero} registrado`)).length).toBeGreaterThan(0);
    await waitFor(() => temValor(screen.getByRole("group", { name: "Pago" }), formatMoeda(antes + parcela.valor)));

    await userEvent.click(await screen.findByRole("button", { name: "Desfazer" }));
    await waitFor(() => temValor(screen.getByRole("group", { name: "Pago" }), formatMoeda(antes)));
  });

  it("oferece cancelar só quando o domínio permite e exige motivo", async () => {
    const { d } = await contratoComParcelaEmAberto();
    render(
      <>
        <TelaContrato id={d.contrato.id} />
        <Toaster />
      </>,
    );
    await userEvent.click(await screen.findByRole("button", { name: "Cancelar contrato" }));
    const dialogo = await screen.findByRole("alertdialog");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Cancelar contrato" }));
    expect(await within(dialogo).findByText("Informe o motivo.")).toBeInTheDocument();
    await userEvent.type(within(dialogo).getByRole("textbox"), "Desistência do comprador");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Cancelar contrato" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect((await screen.findAllByText("Cancelado")).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Cancelar contrato" })).not.toBeInTheDocument();
  });

  it("contrato inexistente mostra erro com link de volta", async () => {
    render(<TelaContrato id="ctr_inexistente" />);
    expect(await screen.findByText("Contrato não encontrado")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voltar para contratos" })).toHaveAttribute("href", "/contratos");
  });

  it("falha de rede oferece tentar de novo", async () => {
    __reiniciarParaTeste({ agora: AGORA, config: { taxaErro: 1 } });
    render(<TelaContrato id="ctr_x" />);
    expect(await screen.findByRole("button", { name: /tentar de novo/i })).toBeInTheDocument();
  });
});
