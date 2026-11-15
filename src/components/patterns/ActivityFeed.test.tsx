import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Atividade, RegistroAlteracao } from "@/domain";
import { ActivityFeed } from "./ActivityFeed";
import { ChangeLog } from "./ChangeLog";
import { rotuloCampo, textoAtividade, textoValor } from "./textoHistorico";

const agora = new Date("2026-11-14T12:00:00.000Z");
const autores = { cor_1: "Joana Souza" };
const at = (p: Partial<Atividade>): Atividade => ({
  id: "atv_1",
  tipo: "nota",
  alvo: { tipo: "lead", id: "lead_1" },
  relacionados: [],
  autorId: "cor_1",
  dados: {},
  criadoEm: "2026-11-14T11:00:00.000Z",
  ...p,
});

describe("textoAtividade", () => {
  it("monta frases em pt-BR a partir de tipo + dados", () => {
    expect(textoAtividade(at({ tipo: "etapaAlterada", dados: { de: "visita", para: "proposta" } })).titulo).toBe(
      "Etapa alterada de Visita para Proposta",
    );
    expect(textoAtividade(at({ tipo: "pagamentoRegistrado", dados: { numero: 3, valor: 150000 } })).titulo).toBe(
      "Pagamento registrado da parcela 3",
    );
    expect(
      textoAtividade(
        at({
          tipo: "statusAlterado",
          alvo: { tipo: "contrato", id: "c" },
          dados: { de: "ativo", para: "cancelado", motivo: "Acordo" },
        }),
      ),
    ).toEqual({ titulo: "Status alterado de Ativo para Cancelado", detalhe: "Motivo: Acordo" });
    expect(
      textoAtividade(at({ tipo: "etapaAlterada", dados: { de: "visita", para: "perdido", motivo: "preco" } })).detalhe,
    ).toBe("Motivo: Preço");
  });
});

describe("ActivityFeed (RF-13, RF-26, RF-34)", () => {
  it("lista com autor, data relativa em <time> e link de origem", () => {
    render(
      <ActivityFeed
        estado={{ fase: "success", dados: [at({ tipo: "etapaAlterada", dados: { de: "novo", para: "contato" } })] }}
        autores={autores}
        agora={agora}
        hrefDe={(a) => `/leads/${a.alvo.id}`}
      />,
    );
    expect(screen.getByRole("link", { name: "Etapa alterada de Novo para Contato" })).toHaveAttribute(
      "href",
      "/leads/lead_1",
    );
    expect(screen.getByText(/Joana Souza/)).toBeInTheDocument();
    const t = screen.getByText("há 1 h", { exact: false }).closest("time")!;
    expect(t).toHaveAttribute("datetime", "2026-11-14T11:00:00.000Z");
  });

  it("agrupa por dia e aceita função de autores", () => {
    render(
      <ActivityFeed
        estado={{
          fase: "success",
          dados: [at({}), at({ id: "atv_2", criadoEm: "2026-11-13T15:00:00.000Z" })],
        }}
        autores={() => undefined}
        agora={agora}
        agruparPorDia
        variante="feed"
      />,
    );
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
      expect.stringMatching(/^Hoje/),
      expect.stringMatching(/^Ontem/),
    ]);
    expect(screen.getAllByText(/Usuário removido/)).toHaveLength(2);
  });

  it("estados: carregando, vazio e erro", async () => {
    const user = userEvent.setup();
    const onTentarNovamente = vi.fn();
    const a = render(<ActivityFeed estado={{ fase: "loading" }} autores={{}} />);
    expect(screen.getByRole("status", { name: "Carregando atividades" })).toBeInTheDocument();
    a.unmount();
    const b = render(<ActivityFeed estado={{ fase: "success", dados: [] }} autores={{}} />);
    expect(screen.getByText("Nenhuma atividade ainda")).toBeInTheDocument();
    b.unmount();
    render(
      <ActivityFeed
        estado={{ fase: "error", erro: new Error("x") }}
        autores={{}}
        onTentarNovamente={onTentarNovamente}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(onTentarNovamente).toHaveBeenCalled();
  });
});

describe("ChangeLog (RF-65)", () => {
  const r = (p: Partial<RegistroAlteracao>): RegistroAlteracao => ({
    id: "alt_1",
    em: "2026-11-14T11:00:00.000Z",
    autorId: "cor_1",
    entidade: { tipo: "imovel", id: "imv_1" },
    campo: "preco",
    de: 85000000,
    para: 90000000,
    ...p,
  });

  it("formata R$, rótulo de status e pagamento de parcela", () => {
    expect(textoValor(r({}), 85000000)).toMatch(/R\$\s*850\.000,00/);
    expect(textoValor(r({ campo: "status" }), "reservado")).toBe("Reservado");
    expect(textoValor(r({ campo: "status", entidade: { tipo: "contrato", id: "c" } }), "ativo")).toBe("Ativo");
    expect(textoValor(r({ campo: "etapa", entidade: { tipo: "lead", id: "l" } }), "proposta")).toBe("Proposta");
    expect(rotuloCampo("parcela.3.pagoEm")).toBe("Pagamento da parcela 3");
    expect(textoValor(r({ campo: "parcela.3.pagoEm" }), null)).toBe("Não pago");
  });

  it("renderiza quem, quando e de → para", () => {
    render(<ChangeLog estado={{ fase: "success", dados: [r({})] }} autores={autores} agora={agora} />);
    const item = within(screen.getByRole("list", { name: "Histórico de alterações" })).getByRole("listitem");
    expect(item).toHaveTextContent("Preço");
    expect(item).toHaveTextContent(/R\$\s*850\.000,00/);
    expect(item).toHaveTextContent(/R\$\s*900\.000,00/);
    expect(item).toHaveTextContent("Joana Souza");
  });

  it("vazio e erro", () => {
    const a = render(<ChangeLog estado={{ fase: "success", dados: [] }} autores={{}} />);
    expect(screen.getByText("Nenhuma alteração registrada")).toBeInTheDocument();
    a.unmount();
    render(<ChangeLog estado={{ fase: "error", erro: new Error("x") }} autores={{}} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
