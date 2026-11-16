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

  it("documentos: erro de validação aparece no diálogo e envio válido entra na lista (RF-76)", async () => {
    const { d } = await contratoComParcelaEmAberto();
    render(
      <>
        <TelaContrato id={d.contrato.id} />
        <Toaster />
      </>,
    );
    await screen.findByRole("region", { name: "Documentos" });
    await userEvent.click(screen.getByRole("button", { name: "Enviar documento" }));
    const dialogo = await screen.findByRole("dialog");

    const ruim = new File(["x"], "planilha.xlsx", { type: "application/vnd.ms-excel" });
    await userEvent.upload(within(dialogo).getByLabelText("Arquivo"), ruim, { applyAccept: false });
    await userEvent.click(within(dialogo).getByRole("combobox", { name: "Tipo" }));
    await userEvent.click(await screen.findByRole("option", { name: "Certidão" }));
    await userEvent.click(within(dialogo).getByRole("button", { name: "Enviar" }));
    expect(await within(dialogo).findByRole("alert")).toHaveTextContent("PDF, JPG ou PNG");

    const bom = new File(["%PDF-1.4"], "certidao-teste.pdf", { type: "application/pdf" });
    await userEvent.upload(within(dialogo).getByLabelText("Arquivo"), bom);
    await userEvent.click(within(dialogo).getByRole("button", { name: "Enviar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(await screen.findByRole("button", { name: "Baixar certidao-teste.pdf" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Remover certidao-teste.pdf" }));
    const confirmar = await screen.findByRole("alertdialog");
    await userEvent.click(within(confirmar).getByRole("button", { name: "Remover documento" }));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Baixar certidao-teste.pdf" })).not.toBeInTheDocument(),
    );
    const desfazer = await screen.findAllByRole("button", { name: "Desfazer" });
    await userEvent.click(desfazer[desfazer.length - 1]!);
    expect(await screen.findByRole("button", { name: "Baixar certidao-teste.pdf" })).toBeInTheDocument();
  });

  it("despesas: lista as do contrato e registra pagamento quando o domínio permite (RF-78)", async () => {
    const { itens } = await fakeApi.listDespesas({}, { pagina: 1, porPagina: 1000 });
    const alvo = itens.find((x) => x.podePagar.ok && x.contratoId);
    if (!alvo?.contratoId) throw new Error("sem despesa pagável de contrato");
    render(
      <>
        <TelaContrato id={alvo.contratoId} />
        <Toaster />
      </>,
    );
    const secao = await screen.findByRole("region", { name: "Despesas" });
    const nome = `Registrar pagamento de ${alvo.descricao}`;
    const antes = (await within(secao).findAllByRole("button", { name: nome })).length;
    await userEvent.click((await within(secao).findAllByRole("button", { name: nome }))[0]!);
    expect((await screen.findAllByText(`Pagamento de ${alvo.descricao} registrado`)).length).toBeGreaterThan(0);
    await waitFor(() =>
      expect(
        within(screen.getByRole("region", { name: "Despesas" })).queryAllByRole("button", { name: nome }),
      ).toHaveLength(antes - 1),
    );
  });
});
