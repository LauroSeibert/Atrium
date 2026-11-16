import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Toaster, useToastStore } from "@/components/ui/Toast";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { invalidarDados } from "@/features/dados/revisao";
import { __reiniciarParaTeste, fakeApi } from "@/mocks/services/fakeApi";
import { AGORA_HISTORIAS } from "@/mocks/data/historias";
import { rotuloNegociacao } from "@/components/patterns/LeadCard";

const roteador = { push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() };
let consulta = "";
vi.mock("next/navigation", () => ({
  useRouter: () => roteador,
  usePathname: () => "/leads",
  useSearchParams: () => new URLSearchParams(consulta),
}));

import { TelaLeads } from "./TelaLeads";

function montar(qs = "") {
  consulta = qs;
  return render(
    <TooltipProvider>
      <TelaLeads />
      <Toaster />
    </TooltipProvider>,
  );
}

const coluna = (nome: RegExp) => screen.getByRole("region", { name: nome, hidden: true });

beforeEach(() => {
  vi.clearAllMocks();
  useToastStore.getState().clear();
  __reiniciarParaTeste({ agora: AGORA_HISTORIAS });
  invalidarDados();
});

/** Primeira negociação "novo" com imóvel (nome do card sem ambiguidade). */
async function negociacaoNova() {
  const n = (await fakeApi.listNegociacoes({ etapas: ["novo"] })).find((x) => x.imovel && x.lead)!;
  return { n, rotulo: rotuloNegociacao({ lead: n.lead!, imovel: n.imovel }), nome: n.lead!.nome };
}

describe("TelaLeads (RF-30…32, RF-35, RF-36, RF-38, RF-70)", () => {
  it("carrega o quadro com as etapas, contagem e soma por coluna", async () => {
    montar();
    expect(await screen.findByRole("region", { name: "Quadro de negociações por etapa" })).toBeInTheDocument();
    for (const etapa of [/Novo/, /Contato/, /Visita/, /Proposta/, /Fechado/, /Perdido/]) {
      expect(coluna(etapa)).toBeInTheDocument();
    }
    expect(within(coluna(/Novo/)).getByText(/\d+ negociaç(ão|ões)/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Leads" })).toBeInTheDocument();
  });

  it("mostra erro com 'Tentar de novo' e se recupera", async () => {
    __reiniciarParaTeste({ agora: AGORA_HISTORIAS, config: { taxaErro: 1 } });
    const user = userEvent.setup();
    montar();
    const botao = await screen.findByRole("button", { name: "Tentar de novo" });
    fakeApi.configurar({ taxaErro: 0 });
    await user.click(botao);
    expect(await screen.findByRole("region", { name: "Quadro de negociações por etapa" })).toBeInTheDocument();
  });

  it("move a negociação por 'Mover para…', mostra o toast e a coluna muda", async () => {
    const { rotulo } = await negociacaoNova();
    const user = userEvent.setup();
    montar();
    await user.click(await screen.findByRole("button", { name: `Mover ${rotulo} para…` }));
    await user.click(await screen.findByRole("menuitem", { name: "Contato" }));
    expect(await screen.findByText(`${rotulo} movido para Contato`)).toBeInTheDocument();
    const alca = `Arrastar ${rotulo}`;
    await waitFor(() => expect(within(coluna(/Contato/)).getByRole("button", { name: alca })).toBeInTheDocument());
    expect(within(coluna(/Novo/)).queryByRole("button", { name: alca })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Desfazer" })).toBeInTheDocument();
  });

  it("mover para Perdido exige motivo (RF-32)", async () => {
    const { n, rotulo } = await negociacaoNova();
    const user = userEvent.setup();
    montar();
    await user.click(await screen.findByRole("button", { name: `Mover ${rotulo} para…` }));
    await user.click(await screen.findByRole("menuitem", { name: "Perdido" }));

    const dialogo = await screen.findByRole("alertdialog");
    await user.click(within(dialogo).getByRole("button", { name: "Marcar como perdido" }));
    expect(within(dialogo).getByText("Informe o motivo da perda.")).toBeInTheDocument();
    const etapaDe = async () => (await fakeApi.listNegociacoes({ leadId: n.leadId })).find((x) => x.id === n.id)!;
    expect((await etapaDe()).etapa).toBe("novo");

    await user.click(within(dialogo).getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "Preço" }));
    await user.click(within(dialogo).getByRole("button", { name: "Marcar como perdido" }));

    expect(await screen.findByText(`${rotulo} movido para Perdido`)).toBeInTheDocument();
    expect(await etapaDe()).toMatchObject({ etapa: "perdido", motivoPerda: "preco" });
  });

  it("criação rápida (?novo=1) cria o lead em Novo", async () => {
    const user = userEvent.setup();
    montar("novo=1");
    const dialogo = await screen.findByRole("dialog", { name: "Novo lead" });
    await user.type(within(dialogo).getByRole("textbox", { name: /Nome/ }), "Marina Teste Quadro");
    await user.click(within(dialogo).getByRole("combobox", { name: /Origem/ }));
    await user.click(await screen.findByRole("option", { name: "Site" }));
    await user.click(within(dialogo).getByRole("button", { name: "Salvar lead" }));

    expect(await screen.findByText("Lead criado")).toBeInTheDocument();
    await waitFor(() => expect(within(coluna(/Novo/)).getByText("Marina Teste Quadro")).toBeInTheDocument());
    expect(within(coluna(/Novo/)).getAllByText("Sem imóvel").length).toBeGreaterThan(0);
    expect(roteador.replace).toHaveBeenCalledWith(expect.not.stringContaining("novo=1"), expect.anything());
  });

  it("alterna para a lista com ?view=lista (RF-38) e abre o lead", async () => {
    montar("view=lista");
    const [primeira] = await fakeApi.listNegociacoes();
    const [link] = await screen.findAllByRole("link", { name: primeira!.lead!.nome });
    expect(link).toHaveAttribute("href", `/leads/${primeira!.leadId}`);
  });

  it("corretor abre em 'Meus leads' (RF-08, RF-36)", async () => {
    const corretor = (await fakeApi.listCorretores()).find((c) => c.papel === "corretor")!;
    await fakeApi.setUsuarioAtual(corretor.id);
    const dele = await fakeApi.listNegociacoes({ responsavelId: corretor.id });
    montar();
    const botao = await screen.findByRole("button", { name: "Meus leads" });
    await waitFor(() => expect(botao).toHaveAttribute("aria-pressed", "true"));
    await screen.findByRole("region", { name: "Quadro de negociações por etapa" });
    await waitFor(() => {
      const cartoes = screen.getAllByRole("button", { name: /^Arrastar / });
      expect(cartoes).toHaveLength(dele.length);
    });
  });

  it("filtro ?imovel= restringe às negociações do imóvel (RF-29)", async () => {
    const todas = await fakeApi.listNegociacoes();
    const imovelId = todas.find((n) => n.imovelId)!.imovelId!;
    const esperados = await fakeApi.listNegociacoes({ imovelId });
    montar(`imovel=${imovelId}`);
    await waitFor(() => expect(screen.getAllByRole("button", { name: /^Arrastar / })).toHaveLength(esperados.length));
  });
});
