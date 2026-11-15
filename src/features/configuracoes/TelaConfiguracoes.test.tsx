/**
 * Tela Configurações: RF-50 (perfil), RF-03 (tema), RF-09 (densidade), RF-08 (persona), RF-51 (demonstração).
 */
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Toaster, useToastStore } from "@/components/ui/Toast";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { __reiniciarParaTeste, fakeApi } from "@/mocks/services/fakeApi";
import { TelaConfiguracoes } from "./TelaConfiguracoes";

const setTheme = vi.fn();
vi.mock("next-themes", () => ({ useTheme: () => ({ theme: "light", resolvedTheme: "light", setTheme }) }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/configuracoes",
  useSearchParams: () => new URLSearchParams(),
}));

const AGORA = "2026-06-15T12:00:00.000Z";

function renderizar() {
  return render(
    <TooltipProvider>
      <TelaConfiguracoes />
      <Toaster />
    </TooltipProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  setTheme.mockClear();
  useToastStore.getState().clear();
  __reiniciarParaTeste({ agora: AGORA });
});

describe("TelaConfiguracoes", () => {
  it("carrega o perfil do usuário atual e as seções", async () => {
    renderizar();
    const perfil = await fakeApi.getPerfil();
    expect(await screen.findByDisplayValue(perfil.nome)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Configurações" })).toBeInTheDocument();
    for (const nome of ["Perfil", "Aparência", "Usuário atual", "Demonstração"])
      expect(screen.getByRole("heading", { level: 2, name: nome })).toBeInTheDocument();
  });

  it("mostra erro com taxa de erro 1 e recupera em Tentar de novo", async () => {
    __reiniciarParaTeste({ agora: AGORA, config: { taxaErro: 1 } });
    renderizar();
    const botao = await screen.findByRole("button", { name: /tentar de novo/i });
    fakeApi.configurar({ taxaErro: 0 });
    await userEvent.click(botao);
    expect(await screen.findByRole("textbox", { name: /nome/i })).toBeInTheDocument();
  });

  it("salva o perfil (RF-50): toast e dado persistido", async () => {
    renderizar();
    const nome = await screen.findByRole("textbox", { name: /nome/i });
    await userEvent.clear(nome);
    await userEvent.type(nome, "Nome Novo da Silva");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(await screen.findByText("Perfil salvo")).toBeInTheDocument();
    expect((await fakeApi.getPerfil()).nome).toBe("Nome Novo da Silva");
  });

  it("valida o perfil sem chamar a API", async () => {
    renderizar();
    const email = await screen.findByRole("textbox", { name: /e-mail/i });
    await userEvent.clear(email);
    await userEvent.type(email, "invalido");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(await screen.findByText("Informe um e-mail válido")).toBeInTheDocument();
    expect(screen.queryByText("Perfil salvo")).not.toBeInTheDocument();
  });

  it("troca o tema (RF-03) e a densidade persistida (RF-09)", async () => {
    renderizar();
    await userEvent.click(await screen.findByRole("radio", { name: "Escuro" }));
    expect(setTheme).toHaveBeenCalledWith("dark");
    await userEvent.click(screen.getByRole("radio", { name: "Compacta" }));
    expect(window.localStorage.getItem("atrium:densidade")).toBe('"compact"');
    expect(screen.getByRole("radio", { name: "Compacta" })).toBeChecked();
  });

  it("troca a persona (RF-08) e o perfil passa a ser o do escolhido", async () => {
    renderizar();
    const atual = await fakeApi.getPerfil();
    const outro = (await fakeApi.listCorretores()).find((c) => c.id !== atual.id)!;
    await userEvent.click(await screen.findByRole("combobox", { name: /entrar como/i }));
    await userEvent.click(await screen.findByRole("option", { name: new RegExp(outro.nome) }));
    await waitFor(async () => expect((await fakeApi.getPerfil()).id).toBe(outro.id));
    expect(await screen.findByDisplayValue(outro.nome)).toBeInTheDocument();
  });

  it("ajusta latência e taxa de erro da demonstração (RF-51)", async () => {
    renderizar();
    const latencia = await screen.findByRole("slider", { name: /latência/i });
    act(() => latencia.focus());
    await userEvent.keyboard("{Home}{ArrowRight}");
    expect(fakeApi.getConfig().latencia).toEqual([100, 100]);
    const erro = screen.getByRole("slider", { name: /taxa de erro/i });
    act(() => erro.focus());
    await userEvent.keyboard("{ArrowRight}");
    expect(fakeApi.getConfig().taxaErro).toBe(0.05);
  });

  it("restaura os dados mock só depois de confirmar (RF-51)", async () => {
    renderizar();
    const antes = await fakeApi.getPerfil();
    await fakeApi.savePerfil({ nome: "Alterado", email: antes.email, telefone: antes.telefone });
    await userEvent.click(await screen.findByRole("button", { name: "Restaurar dados mock" }));
    const dialogo = await screen.findByRole("alertdialog");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Voltar" }));
    expect((await fakeApi.getPerfil()).nome).toBe("Alterado");

    await userEvent.click(screen.getByRole("button", { name: "Restaurar dados mock" }));
    await userEvent.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Restaurar" }));
    expect(await screen.findByText("Dados mock restaurados")).toBeInTheDocument();
    expect((await fakeApi.getPerfil()).nome).toBe(antes.nome);
  });
});
