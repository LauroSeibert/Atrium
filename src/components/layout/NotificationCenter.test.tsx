import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Notificacao } from "@/domain";
import type { Recurso } from "@/lib/recurso";
import { NotificationCenter } from "./NotificationCenter";

const agora = new Date("2026-11-14T13:00:00.000Z");
const atraso: Notificacao = {
  id: "ntf_venc_ctr_a_1",
  tipo: "atraso",
  em: "2026-11-01T12:00:00.000Z",
  lida: false,
  contratoId: "ctr_a",
  numero: "CT-2026-0001",
  parcela: 1,
  valor: 100_000,
};
const vencimento: Notificacao = { ...atraso, id: "ntf_venc_ctr_a_2", tipo: "vencimento", parcela: 2, lida: true };

function montar(estado: Recurso<Notificacao[]>, extra: Partial<React.ComponentProps<typeof NotificationCenter>> = {}) {
  const props = {
    onMarcarLida: vi.fn(),
    onMarcarTodas: vi.fn(),
    onTentarNovamente: vi.fn(),
    ...extra,
  };
  render(
    <NotificationCenter
      estado={estado}
      hrefDe={(n) => `/contratos/${n.tipo === "atividade" ? "x" : n.contratoId}`}
      agora={agora}
      {...props}
    />,
  );
  return props;
}

describe("NotificationCenter (RF-64)", () => {
  it("rótulo do sino traz a contagem de não lidas", () => {
    montar({ fase: "success", dados: [atraso, vencimento] });
    expect(screen.getByRole("button", { name: "Notificações, 1 não lida" })).toBeInTheDocument();
  });

  it("sem pendentes o rótulo é só Notificações", () => {
    montar({ fase: "success", dados: [vencimento] });
    expect(screen.getByRole("button", { name: "Notificações" })).toBeInTheDocument();
  });

  it("abre a lista e clicar numa não lida chama onMarcarLida", async () => {
    const { onMarcarLida } = montar({ fase: "success", dados: [atraso, vencimento] });
    await userEvent.click(screen.getByRole("button", { name: /Notificações/ }));
    expect(screen.getByText(/Parcela 2 vence em/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("link", { name: /Parcela 1 atrasada/ }));
    expect(onMarcarLida).toHaveBeenCalledWith("ntf_venc_ctr_a_1");
  });

  it("clicar numa já lida não chama onMarcarLida", async () => {
    const { onMarcarLida } = montar({ fase: "success", dados: [vencimento] });
    await userEvent.click(screen.getByRole("button", { name: "Notificações" }));
    await userEvent.click(screen.getByRole("link", { name: /Parcela 2/ }));
    expect(onMarcarLida).not.toHaveBeenCalled();
  });

  it('"Marcar todas como lidas" fica desabilitado sem pendentes e chama o callback com pendentes', async () => {
    const sem = montar({ fase: "success", dados: [vencimento] });
    await userEvent.click(screen.getByRole("button", { name: "Notificações" }));
    const botao = screen.getByRole("button", { name: "Marcar todas como lidas" });
    expect(botao).toBeDisabled();
    expect(sem.onMarcarTodas).not.toHaveBeenCalled();
  });

  it("com pendentes, Marcar todas como lidas chama onMarcarTodas", async () => {
    const { onMarcarTodas } = montar({ fase: "success", dados: [atraso] });
    await userEvent.click(screen.getByRole("button", { name: /Notificações/ }));
    await userEvent.click(screen.getByRole("button", { name: "Marcar todas como lidas" }));
    expect(onMarcarTodas).toHaveBeenCalledTimes(1);
  });

  it("estado loading mostra o skeleton", async () => {
    montar({ fase: "loading" });
    await userEvent.click(screen.getByRole("button", { name: "Notificações" }));
    expect(screen.getByLabelText("Carregando notificações")).toBeInTheDocument();
  });

  it("estado vazio mostra a mensagem", async () => {
    montar({ fase: "success", dados: [] });
    await userEvent.click(screen.getByRole("button", { name: "Notificações" }));
    expect(screen.getByText("Nada novo por aqui")).toBeInTheDocument();
  });

  it("estado de erro oferece Tentar de novo", async () => {
    const { onTentarNovamente } = montar({ fase: "error", erro: new Error("falhou") });
    await userEvent.click(screen.getByRole("button", { name: "Notificações" }));
    expect(screen.getByText("Não foi possível carregar as notificações")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(onTentarNovamente).toHaveBeenCalledTimes(1);
  });
});
