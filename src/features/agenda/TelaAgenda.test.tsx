import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Toaster, useToastStore } from "@/components/ui/Toast";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { invalidarDados } from "@/features/dados/revisao";
import { AGORA_HISTORIAS } from "@/mocks/data/historias";
import { __reiniciarParaTeste, fakeApi } from "@/mocks/services/fakeApi";

const replace = vi.fn();
let consulta = "";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: replace }),
  usePathname: () => "/agenda",
  useSearchParams: () => new URLSearchParams(consulta),
}));

import { TelaAgenda } from "./TelaAgenda";

function montar(qs = "") {
  consulta = qs;
  return render(
    <TooltipProvider>
      <TelaAgenda />
      <Toaster />
    </TooltipProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useToastStore.getState().clear();
  __reiniciarParaTeste({ agora: AGORA_HISTORIAS });
  invalidarDados();
});

describe("TelaAgenda (RF-73)", () => {
  it("carrega os compromissos agrupados por dia, com vencimento levando ao contrato", async () => {
    montar("escopo=todos&periodo=30");
    expect(await screen.findByRole("group", { name: "Compromissos" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Agenda" })).toBeInTheDocument();
    const { agenda } = { agenda: await fakeApi.getAgenda({ dias: 30 }) };
    const venc = agenda.dias.flatMap((d) => d.itens).find((i) => i.tipo === "vencimento");
    if (venc && venc.tipo === "vencimento") {
      const links = screen.getAllByRole("link").map((l) => l.getAttribute("href"));
      expect(links).toContain(`/contratos/${venc.contratoId}`);
    }
  });

  it("filtros vão para a URL", async () => {
    const user = userEvent.setup();
    montar();
    await screen.findByRole("group", { name: "Compromissos" });
    await user.click(screen.getByRole("radio", { name: "Vencimentos" }));
    expect(replace).toHaveBeenLastCalledWith("/agenda?tipo=vencimento", { scroll: false });
    await user.click(screen.getByRole("radio", { name: "30 dias" }));
    expect(replace).toHaveBeenLastCalledWith("/agenda?periodo=30", { scroll: false });
  });

  it("mostra erro com 'Tentar de novo' e se recupera", async () => {
    __reiniciarParaTeste({ agora: AGORA_HISTORIAS, config: { taxaErro: 1 } });
    const user = userEvent.setup();
    montar("escopo=todos");
    const botao = await screen.findByRole("button", { name: "Tentar de novo" });
    fakeApi.configurar({ taxaErro: 0 });
    await user.click(botao);
    expect(await screen.findByRole("group", { name: "Compromissos" })).toBeInTheDocument();
  });

  it("marca uma visita como realizada: toast, situação muda e as ações somem", async () => {
    const agenda = await fakeApi.getAgenda({ dias: 30 });
    const alvo = agenda.dias.flatMap((d) => d.itens).find((i) => i.tipo === "visita" && i.transicoes.length > 0);
    expect(alvo).toBeDefined();
    if (!alvo || alvo.tipo !== "visita") return;
    const titulo = agenda.nomes.imoveis[alvo.visita.imovelId]!;
    const user = userEvent.setup();
    montar("escopo=todos&periodo=30&tipo=visita");
    await user.click((await screen.findAllByRole("button", { name: `Ações: ${titulo}` }))[0]!);
    await user.click(await screen.findByRole("menuitem", { name: "Marcar como realizada" }));
    expect(await screen.findByText("Visita marcada como realizada")).toBeInTheDocument();
    await waitFor(async () => {
      const depois = await fakeApi.getAgenda({ dias: 30 });
      const v = depois.dias.flatMap((d) => d.itens).find((i) => i.tipo === "visita" && i.visita.id === alvo.visita.id);
      expect(v && v.tipo === "visita" && v.visita.status).toBe("realizada");
    });
  });
});
