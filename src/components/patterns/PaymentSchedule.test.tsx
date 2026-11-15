import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PERMITIDO, negar } from "@/domain/comum/tipos";
import type { StatusParcela } from "@/domain/contrato/schema";
import { PaymentSchedule, type ItemParcela } from "./PaymentSchedule";

const item = (numero: number, status: StatusParcela, extra: Partial<ItemParcela> = {}): ItemParcela => ({
  parcela: {
    numero,
    vencimento: `2026-0${numero}-10`,
    valor: 100_000,
    pagoEm: status === "pago" ? `2026-0${numero}-09T12:00:00.000Z` : null,
  },
  status,
  diasAtraso: status === "atrasado" ? 5 : 0,
  podeRegistrar: status === "pago" || status === "cancelada" ? negar("Parcela já paga.") : PERMITIDO,
  ...extra,
});

const itens = [item(1, "pago"), item(2, "atrasado"), item(3, "aVencer"), item(4, "cancelada")];
const resumo = { total: 4, pagas: 1, recebido: 100_000, atrasadas: 1, emAtraso: 100_000 };

/** Tabela e lista coexistem no DOM (a visível depende do CSS); testamos a tabela. */
const tabela = () => screen.getByRole("region", { name: "Cronograma de parcelas" });

describe("PaymentSchedule (RF-42, RF-43)", () => {
  it("resumo: pagas x de y, total recebido e em atraso", () => {
    render(<PaymentSchedule resumo={resumo} estado={{ fase: "success", dados: itens }} />);
    const dl = screen.getByText("Parcelas pagas").closest("dl")!;
    expect(within(dl).getByText("1 de 4")).toBeInTheDocument();
    expect(within(dl).getByText("Total recebido").nextElementSibling).toHaveTextContent("R$ 1.000,00");
    expect(within(dl).getByText(/1 parcela ·/)).toBeInTheDocument();
  });

  it("cada status tem texto, e atraso mostra os dias", () => {
    render(<PaymentSchedule resumo={resumo} estado={{ fase: "success", dados: itens }} />);
    const t = within(tabela());
    for (const r of ["Pago", "Atrasado", "A vencer", "Cancelada"]) expect(t.getAllByText(r).length).toBeGreaterThan(0);
    expect(t.getByText("5 dias de atraso")).toBeInTheDocument();
  });

  it("clicar em Registrar pagamento emite o número da parcela", async () => {
    const onRegistrarPagamento = vi.fn();
    const user = userEvent.setup();
    render(
      <PaymentSchedule
        resumo={resumo}
        estado={{ fase: "success", dados: itens }}
        onRegistrarPagamento={onRegistrarPagamento}
      />,
    );
    await user.click(within(tabela()).getByRole("button", { name: "Registrar pagamento da parcela 2" }));
    expect(onRegistrarPagamento).toHaveBeenCalledWith(2);
  });

  it("permissão negada desabilita e mostra o motivo", async () => {
    const onRegistrarPagamento = vi.fn();
    const user = userEvent.setup();
    const dados = [item(2, "atrasado", { podeRegistrar: negar("Seu perfil não registra pagamentos.") })];
    render(
      <PaymentSchedule
        resumo={resumo}
        estado={{ fase: "success", dados }}
        onRegistrarPagamento={onRegistrarPagamento}
      />,
    );
    const botao = within(tabela()).getByRole("button", { name: "Registrar pagamento da parcela 2" });
    expect(botao).toBeDisabled();
    expect(botao).toHaveAccessibleDescription("Seu perfil não registra pagamentos.");
    await user.click(botao);
    expect(onRegistrarPagamento).not.toHaveBeenCalled();
  });

  it("enviando: a parcela fica ocupada e as outras ficam desabilitadas", () => {
    render(
      <PaymentSchedule
        resumo={resumo}
        estado={{ fase: "success", dados: itens }}
        acao={{ fase: "enviando", numero: 2 }}
      />,
    );
    const t = within(tabela());
    expect(t.getByRole("button", { name: "Registrar pagamento da parcela 2" })).toHaveAttribute("aria-busy", "true");
    expect(t.getByRole("button", { name: "Registrar pagamento da parcela 3" })).toBeDisabled();
  });

  it("erro da ação aparece na parcela", () => {
    render(
      <PaymentSchedule
        resumo={resumo}
        estado={{ fase: "success", dados: itens }}
        acao={{ fase: "erro", numero: 3, mensagem: "Falhou ao registrar." }}
      />,
    );
    expect(within(tabela()).getByRole("alert")).toHaveTextContent("Falhou ao registrar.");
  });

  it("renderiza vazio, carregando e erro com tentar de novo", async () => {
    const onTentarNovamente = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<PaymentSchedule resumo={resumo} estado={{ fase: "success", dados: [] }} />);
    expect(screen.getByRole("heading", { name: "Sem parcelas" })).toBeInTheDocument();
    rerender(<PaymentSchedule resumo={resumo} estado={{ fase: "loading" }} />);
    expect(screen.getByLabelText("Carregando cronograma")).toHaveAttribute("aria-busy", "true");
    rerender(
      <PaymentSchedule
        resumo={resumo}
        estado={{ fase: "error", erro: new Error("x") }}
        onTentarNovamente={onTentarNovamente}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(onTentarNovamente).toHaveBeenCalledOnce();
  });
});
