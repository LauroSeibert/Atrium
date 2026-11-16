import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Toaster } from "@/components/ui/Toast";
import { __reiniciarParaTeste, fakeApi } from "@/mocks/services/fakeApi";
import { navegacao } from "./navegacaoFalsa";
import { TelaFormImovel } from "./TelaFormImovel";

vi.mock("next/navigation", async () => (await import("./navegacaoFalsa")).moduloNavegacaoFalsa);

beforeEach(() => {
  __reiniciarParaTeste({ agora: "2026-11-15T12:00:00-03:00" });
  navegacao.definirUrl("/imoveis/novo");
});

describe("TelaFormImovel (RF-27)", () => {
  it("edita: carrega valores, salva, mostra toast e vai para o detalhe", async () => {
    const { itens } = await fakeApi.listImoveis({}, { pagina: 1, porPagina: 1 });
    const imovel = itens[0]!;
    const user = userEvent.setup();
    render(
      <>
        <TelaFormImovel id={imovel.id} />
        <Toaster />
      </>,
    );
    const titulo = await screen.findByRole("textbox", { name: /^Título/ });
    expect(titulo).toHaveValue(imovel.titulo);
    await user.clear(titulo);
    await user.type(titulo, "Título editado no teste");
    await user.click(screen.getByRole("button", { name: "Salvar imóvel" }));
    expect(await screen.findByText("Imóvel salvo")).toBeInTheDocument();
    await waitFor(() => expect(navegacao.url()).toBe(`/imoveis/${imovel.codigo}`));
    expect((await fakeApi.getImovel(imovel.id)).imovel.titulo).toBe("Título editado no teste");
  });

  it("novo: formulário vazio recusa envio e não navega", async () => {
    const user = userEvent.setup();
    render(<TelaFormImovel />);
    await user.click(await screen.findByRole("button", { name: "Salvar imóvel" }));
    await waitFor(() => expect(document.querySelector('[aria-invalid="true"]')).not.toBeNull());
    expect(navegacao.url()).toBe("/imoveis/novo");
  });

  it("falha ao salvar mostra o erro no formulário", async () => {
    const { itens } = await fakeApi.listImoveis({}, { pagina: 1, porPagina: 1 });
    const user = userEvent.setup();
    render(<TelaFormImovel id={itens[0]!.id} />);
    await screen.findByRole("textbox", { name: /^Título/ });
    __reiniciarParaTeste({ agora: "2026-11-15T12:00:00-03:00", config: { taxaErro: 1 } });
    await user.click(screen.getByRole("button", { name: "Salvar imóvel" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/conectar/);
  });
});
