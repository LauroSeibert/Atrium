import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AgendaList, type ItemAgenda } from "./AgendaList";

const agora = new Date("2026-11-14T12:00:00.000Z");
const visita: ItemAgenda = {
  id: "v1",
  tipo: "visita",
  quando: "2026-11-14T17:00:00.000Z",
  titulo: "Visita ao IMV-0012",
  detalhe: "Mariana Alves",
  href: "/leads/lead_1",
};
const vencimento: ItemAgenda = {
  id: "p1",
  tipo: "vencimento",
  quando: "2026-11-15",
  titulo: "Parcela 3 do contrato CTR-0004",
  href: "/contratos/ctr_4",
};

describe("AgendaList (RF-14)", () => {
  it("agrupa por dia, mostra tipo, hora e link do registro de origem", () => {
    render(<AgendaList estado={{ fase: "success", dados: [visita, vencimento] }} agora={agora} />);
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
      expect.stringMatching(/^Hoje/),
      expect.stringMatching(/^Amanhã/),
    ]);
    expect(screen.getByRole("link", { name: "Visita ao IMV-0012" })).toHaveAttribute("href", "/leads/lead_1");
    expect(screen.getByRole("link", { name: /Parcela 3/ })).toHaveAttribute("href", "/contratos/ctr_4");
    expect(screen.getByText("14:00")).toBeInTheDocument();
    expect(screen.getByText("Vencimento")).toBeInTheDocument();
    expect(within(screen.getByRole("group", { name: "Próximos compromissos" })).getAllByRole("listitem")).toHaveLength(
      2,
    );
  });

  it("estados: carregando, vazio e erro com tentar de novo", async () => {
    const onTentarNovamente = vi.fn();
    const a = render(<AgendaList estado={{ fase: "loading" }} />);
    expect(screen.getByRole("status", { name: "Carregando compromissos" })).toBeInTheDocument();
    a.unmount();
    const b = render(<AgendaList estado={{ fase: "success", dados: [] }} />);
    expect(screen.getByText("Nenhum compromisso nos próximos dias")).toBeInTheDocument();
    b.unmount();
    render(<AgendaList estado={{ fase: "error", erro: new Error("x") }} onTentarNovamente={onTentarNovamente} />);
    await userEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(onTentarNovamente).toHaveBeenCalled();
  });
});
