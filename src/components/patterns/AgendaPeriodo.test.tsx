import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AgendaPeriodo, type ItemAgendaPeriodo } from "./AgendaPeriodo";

const agora = new Date("2026-11-14T12:00:00.000Z");
const onAcionar = vi.fn();
const visita: ItemAgendaPeriodo = {
  id: "v1",
  tipo: "visita",
  quando: "2026-11-14T17:00:00.000Z",
  titulo: "Visita ao IMV-0012",
  detalhe: "Mariana Alves",
  href: "/leads/lead_1",
  situacao: { rotulo: "Agendada", tom: "info" },
  acoes: [{ id: "realizada", rotulo: "Marcar como realizada", onAcionar }],
};
const vencimento: ItemAgendaPeriodo = {
  id: "p1",
  tipo: "vencimento",
  quando: "2026-11-15",
  titulo: "Parcela 3 do contrato CTR-0004",
  href: "/contratos/ctr_4",
};

describe("AgendaPeriodo (RF-73)", () => {
  it("agrupa por dia, mostra situação e link do registro de origem", () => {
    render(<AgendaPeriodo estado={{ fase: "success", dados: [visita, vencimento] }} agora={agora} />);
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
      expect.stringMatching(/^Hoje/),
      expect.stringMatching(/^Amanhã/),
    ]);
    expect(screen.getByRole("link", { name: /Parcela 3/ })).toHaveAttribute("href", "/contratos/ctr_4");
    expect(screen.getByText("Agendada")).toBeInTheDocument();
    expect(screen.getByText("14:00")).toBeInTheDocument();
  });

  it("só mostra o menu de ações para quem tem ações e dispara a escolhida", async () => {
    const user = userEvent.setup();
    render(<AgendaPeriodo estado={{ fase: "success", dados: [visita, vencimento] }} agora={agora} />);
    expect(screen.getAllByRole("button", { name: /^Ações:/ })).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Ações: Visita ao IMV-0012" }));
    await user.click(await screen.findByRole("menuitem", { name: "Marcar como realizada" }));
    expect(onAcionar).toHaveBeenCalledOnce();
  });

  it("estados: carregando, vazio e erro com tentar de novo", async () => {
    const onTentarNovamente = vi.fn();
    const { rerender } = render(<AgendaPeriodo estado={{ fase: "loading" }} />);
    expect(screen.getByRole("status", { name: "Carregando agenda" })).toBeInTheDocument();
    rerender(<AgendaPeriodo estado={{ fase: "success", dados: [] }} tituloVazio="Nada por aqui" />);
    expect(screen.getByText("Nada por aqui")).toBeInTheDocument();
    rerender(<AgendaPeriodo estado={{ fase: "error", erro: new Error("x") }} onTentarNovamente={onTentarNovamente} />);
    await userEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(onTentarNovamente).toHaveBeenCalledOnce();
  });
});
