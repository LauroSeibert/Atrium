import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Toaster } from "@/components/ui/Toast";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { __reiniciarParaTeste, fakeApi } from "@/mocks/services/fakeApi";
import { navegacao } from "./navegacaoFalsa";
import { TelaImovel } from "./TelaImovel";

vi.mock("next/navigation", async () => (await import("./navegacaoFalsa")).moduloNavegacaoFalsa);

function montar(id: string) {
  return render(
    <TooltipProvider>
      <TelaImovel id={id} />
      <Toaster />
    </TooltipProvider>,
  );
}

async function imovelComTransicao(para: string) {
  const { itens } = await fakeApi.listImoveis({ status: ["disponivel"] }, { pagina: 1, porPagina: 50 });
  for (const i of itens) {
    const d = await fakeApi.getImovel(i.id);
    if (d.transicoes.some((t) => t.para === para)) return d;
  }
  throw new Error("sem imóvel de teste");
}

beforeEach(() => {
  __reiniciarParaTeste({ agora: "2026-11-15T12:00:00-03:00" });
  navegacao.definirUrl("/imoveis/x");
});

describe("TelaImovel (RF-24…26, RF-29, RF-65)", () => {
  it("mostra título, ficha, galeria, históricos e link de leads", async () => {
    const d = await imovelComTransicao("reservado");
    montar(d.imovel.id);
    expect(await screen.findByRole("heading", { level: 1, name: d.imovel.titulo })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /^Galeria de/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ficha técnica" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Histórico de alterações" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Editar" })[0]).toHaveAttribute(
      "href",
      `/imoveis/${d.imovel.codigo}/editar`,
    );
    if (d.leadsInteressados > 0)
      expect(screen.getByRole("link", { name: /lead/ })).toHaveAttribute("href", `/leads?imovel=${d.imovel.id}`);
  });

  it("trocar status pede confirmação, grava e mostra toast", async () => {
    const d = await imovelComTransicao("reservado");
    const user = userEvent.setup();
    montar(d.imovel.id);
    await user.click(await screen.findByRole("button", { name: "Alterar status" }));
    await user.click(await screen.findByRole("menuitem", { name: "Marcar como reservado" }));
    const dialogo = await screen.findByRole("alertdialog");
    await user.click(within(dialogo).getByRole("button", { name: "Marcar como reservado" }));
    expect(await screen.findByText(`${d.imovel.codigo} marcado como reservado`)).toBeInTheDocument();
    await waitFor(async () => expect((await fakeApi.getImovel(d.imovel.id)).imovel.status).toBe("reservado"));
  });

  it("inativar exige motivo", async () => {
    const d = await imovelComTransicao("inativo");
    const user = userEvent.setup();
    montar(d.imovel.id);
    await user.click(await screen.findByRole("button", { name: "Alterar status" }));
    await user.click(await screen.findByRole("menuitem", { name: "Marcar como inativo" }));
    const dialogo = await screen.findByRole("alertdialog");
    await user.click(within(dialogo).getByRole("button", { name: "Marcar como inativo" }));
    expect(await within(dialogo).findByText("Informe o motivo.")).toBeInTheDocument();
    await user.type(within(dialogo).getByRole("textbox"), "Proprietário desistiu");
    await user.click(within(dialogo).getByRole("button", { name: "Marcar como inativo" }));
    expect(await screen.findByText(`${d.imovel.codigo} marcado como inativo`)).toBeInTheDocument();
  });

  it("imóvel inexistente mostra erro com link de volta", async () => {
    montar("imv_naoexiste");
    expect(await screen.findByText("Imóvel não encontrado")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voltar para imóveis" })).toHaveAttribute("href", "/imoveis");
  });

  it("erro de rede oferece Tentar de novo", async () => {
    const d = await imovelComTransicao("reservado");
    __reiniciarParaTeste({ agora: "2026-11-15T12:00:00-03:00", config: { taxaErro: 1 } });
    montar(d.imovel.id);
    expect(await screen.findByRole("button", { name: "Tentar de novo" })).toBeInTheDocument();
  });
});
