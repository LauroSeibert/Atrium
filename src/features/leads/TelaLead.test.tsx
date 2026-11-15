import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Toaster, useToastStore } from "@/components/ui/Toast";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { invalidarDados } from "@/features/dados/revisao";
import { AGORA_HISTORIAS } from "@/mocks/data/historias";
import { __reiniciarParaTeste, fakeApi } from "@/mocks/services/fakeApi";

const roteador = { push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => roteador,
  usePathname: () => "/leads/x",
  useSearchParams: () => new URLSearchParams(""),
}));

import { LeadDrawer } from "./LeadDrawer";
import { TelaLead } from "./TelaLead";

beforeEach(() => {
  vi.clearAllMocks();
  useToastStore.getState().clear();
  __reiniciarParaTeste({ agora: AGORA_HISTORIAS });
  invalidarDados();
});

const envolver = (ui: React.ReactNode) =>
  render(
    <TooltipProvider>
      {ui}
      <Toaster />
    </TooltipProvider>,
  );

describe("TelaLead (RF-33, RF-34, RF-37, RF-65)", () => {
  it("mostra contato, interesse, linha do tempo e histórico", async () => {
    const [lead] = await fakeApi.listLeads();
    envolver(<TelaLead id={lead!.id} modo="pagina" />);
    expect(await screen.findByRole("heading", { level: 1, name: lead!.nome })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { level: 2, name: "Contato e interesse" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Linha do tempo" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Histórico de alterações" })).toBeInTheDocument();
  });

  it("adicionar nota aparece na linha do tempo", async () => {
    const [lead] = await fakeApi.listLeads();
    const user = userEvent.setup();
    envolver(<TelaLead id={lead!.id} modo="pagina" />);
    await user.type(await screen.findByRole("textbox", { name: /Nova nota/ }), "Ligar amanhã cedo");
    await user.click(screen.getByRole("button", { name: "Adicionar nota" }));
    expect((await screen.findAllByText("Nota adicionada")).length).toBeGreaterThan(0);
    const linha = await screen.findByRole("group", { name: "Linha do tempo do lead" });
    await waitFor(() => expect(within(linha).getByText(/Ligar amanhã cedo/)).toBeInTheDocument());
  });

  it("'Mover para…' muda a etapa, com toast", async () => {
    const [lead] = await fakeApi.listLeads({ etapas: ["novo"] });
    const user = userEvent.setup();
    envolver(<TelaLead id={lead!.id} modo="pagina" />);
    await user.click(await screen.findByRole("button", { name: "Mover para…" }));
    await user.click(await screen.findByRole("menuitem", { name: "Visita" }));
    expect(await screen.findByText(`${lead!.nome} movido para Visita`)).toBeInTheDocument();
    expect((await fakeApi.getLead(lead!.id)).lead.etapa).toBe("visita");
  });

  it("lead inexistente vira estado de erro com link de volta", async () => {
    envolver(<TelaLead id="lead_inexistente" modo="pagina" />);
    expect(await screen.findByText("Lead não encontrado")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voltar para leads" })).toHaveAttribute("href", "/leads");
  });

  it("agenda visita a partir do lead (RF-37)", async () => {
    const [lead] = await fakeApi.listLeads({ etapas: ["novo"] });
    const user = userEvent.setup();
    envolver(<TelaLead id={lead!.id} modo="pagina" />);
    await user.click(await screen.findByRole("button", { name: "Agendar visita" }));
    const dialogo = await screen.findByRole("dialog", { name: "Agendar visita" });
    await user.click(within(dialogo).getByRole("button", { name: "Agendar visita" }));
    expect(within(dialogo).getByText("Escolha o imóvel.")).toBeInTheDocument();
    await user.click(within(dialogo).getByRole("combobox", { name: /Imóvel/ }));
    await user.click((await screen.findAllByRole("option"))[0]!);
    await user.type(within(dialogo).getByLabelText(/Data/), "2026-12-01");
    await user.type(within(dialogo).getByLabelText(/Hora/), "10:30");
    await user.click(within(dialogo).getByRole("button", { name: "Agendar visita" }));
    expect(await screen.findByText("Visita agendada")).toBeInTheDocument();
    expect((await fakeApi.getLead(lead!.id)).visitas.length).toBeGreaterThan(0);
  });

  it("no drawer, fechar volta no histórico", async () => {
    const [lead] = await fakeApi.listLeads();
    const user = userEvent.setup();
    envolver(<LeadDrawer id={lead!.id} />);
    expect(await screen.findByRole("dialog", { name: lead!.nome })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Fechar" }));
    expect(roteador.back).toHaveBeenCalled();
  });
});
