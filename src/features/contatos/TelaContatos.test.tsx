import { render, screen, waitFor, within } from "@testing-library/react";
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
  usePathname: () => "/contatos",
  useSearchParams: () => new URLSearchParams(consulta),
}));

import { TelaContatos } from "./TelaContatos";

let telaLarga = true;
function montar(qs = "") {
  consulta = qs;
  return render(
    <TooltipProvider>
      <TelaContatos />
      <Toaster />
    </TooltipProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useToastStore.getState().clear();
  telaLarga = true;
  window.matchMedia = ((q: string) => ({
    matches: telaLarga,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  __reiniciarParaTeste({ agora: AGORA_HISTORIAS });
  invalidarDados();
});

describe("TelaContatos (RF-74)", () => {
  it("carrega a tabela e anuncia a contagem", async () => {
    const todos = await fakeApi.listContatos();
    montar();
    expect(await screen.findByRole("region", { name: "Contatos" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Contatos" })).toBeInTheDocument();
    expect(
      await screen.findByText(`${todos.length} ${todos.length === 1 ? "contato" : "contatos"}`),
    ).toBeInTheDocument();
  });

  it("filtra por papel vindo da URL", async () => {
    const adv = await fakeApi.listContatos({ papeis: ["advogado"] });
    montar("papel=advogado");
    const tabela = await screen.findByRole("region", { name: "Contatos" });
    await within(tabela).findAllByText("Advogado");
    expect(await screen.findByText(`${adv.length} ${adv.length === 1 ? "contato" : "contatos"}`)).toBeInTheDocument();
    expect(within(tabela).queryByText("Cartório")).not.toBeInTheDocument();
  });

  it("em tela estreita mostra cartões, sem tabela", async () => {
    telaLarga = false;
    montar();
    expect(await screen.findByRole("list", { name: "Contatos em cartões" })).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("mostra erro com 'Tentar de novo' e se recupera", async () => {
    __reiniciarParaTeste({ agora: AGORA_HISTORIAS, config: { taxaErro: 1 } });
    const user = userEvent.setup();
    montar();
    const botao = await screen.findByRole("button", { name: "Tentar de novo" });
    fakeApi.configurar({ taxaErro: 0 });
    await user.click(botao);
    expect(await screen.findByRole("region", { name: "Contatos" })).toBeInTheDocument();
  });

  it("cria contato: valida inline e depois salva com toast", async () => {
    const antes = (await fakeApi.listContatos()).length;
    const user = userEvent.setup();
    montar();
    await screen.findByRole("region", { name: "Contatos" });
    await user.click(screen.getAllByRole("button", { name: "Novo contato" })[0]!);
    const dialogo = await screen.findByRole("dialog", { name: "Novo contato" });
    await user.click(within(dialogo).getByRole("button", { name: "Criar contato" }));
    expect(await within(dialogo).findAllByText(/Preencha este campo|Use pelo menos/)).not.toHaveLength(0);
    expect(await fakeApi.listContatos()).toHaveLength(antes);

    await user.type(within(dialogo).getByRole("textbox", { name: /Nome/ }), "Paulo Teste");
    await user.click(within(dialogo).getByRole("button", { name: "Criar contato" }));
    expect(await screen.findByText("Contato criado")).toBeInTheDocument();
    await waitFor(async () => expect(await fakeApi.listContatos()).toHaveLength(antes + 1));
  });

  it("edita contato existente", async () => {
    const [primeiro] = await fakeApi.listContatos();
    const user = userEvent.setup();
    montar();
    await screen.findByRole("region", { name: "Contatos" });
    await user.click(await screen.findByRole("button", { name: `Editar ${primeiro!.nome}` }));
    const dialogo = await screen.findByRole("dialog", { name: "Editar contato" });
    const nome = within(dialogo).getByRole("textbox", { name: /Nome/ });
    expect(nome).toHaveValue(primeiro!.nome);
    await user.clear(nome);
    await user.type(nome, "Nome Alterado");
    await user.click(within(dialogo).getByRole("button", { name: "Salvar" }));
    expect(await screen.findByText("Contato atualizado")).toBeInTheDocument();
    expect((await fakeApi.getContato(primeiro!.id)).contato.nome).toBe("Nome Alterado");
  });
});
