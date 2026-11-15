import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ETAPAS, negar, PERMITIDO, type Etapa, type Lead } from "@/domain";
import { AGORA_HISTORIAS, BASE_HISTORIAS } from "@/mocks/data/historias";
import { criarAnuncios, KanbanBoard, type KanbanBoardProps } from "./KanbanBoard";
import { LeadCard } from "./LeadCard";

const agora = new Date(AGORA_HISTORIAS);
const responsaveis = Object.fromEntries(BASE_HISTORIAS.corretores.map((c) => [c.id, c.nome]));
const lead = (nome: string, etapa: Etapa, ordem: number, orcamento: number | null = 100_000_00): Lead => ({
  ...BASE_HISTORIAS.leads[0]!,
  id: `lead_${nome.toLowerCase().replace(/\W/g, "")}`,
  nome,
  etapa,
  ordem,
  orcamento,
  motivoPerda: etapa === "perdido" ? "preco" : null,
  responsavelId: BASE_HISTORIAS.corretores[0]!.id,
});
const leads = [lead("Ana", "novo", 0, 200_000_00), lead("Bruno", "novo", 1, null), lead("Carla", "visita", 0)];

function montar(extra: Partial<KanbanBoardProps> = {}) {
  const props: KanbanBoardProps = {
    estado: { fase: "success", dados: leads },
    responsaveis,
    destinosDe: (l) =>
      ETAPAS.filter((e) => e !== l.etapa).map((etapa) => ({
        etapa,
        permissao: etapa === "fechado" ? negar("Só leads com proposta podem fechar.") : PERMITIDO,
      })),
    podeSoltar: vi.fn(() => PERMITIDO),
    onMover: vi.fn(),
    onAbrir: vi.fn(),
    agora,
    ...extra,
  };
  render(<KanbanBoard {...props} />);
  return props;
}

describe("KanbanBoard (RF-30, RF-31)", () => {
  it("mostra colunas por etapa com contagem e soma do orçamento", () => {
    montar();
    const novo = screen.getByRole("region", { name: "Quadro de leads por etapa" });
    expect(novo).toHaveAttribute("tabindex", "0");
    const col = screen.getByRole("heading", { name: /Novo/ }).closest("section")!;
    expect(within(col).getByText("2 leads")).toBeInTheDocument();
    expect(within(col).getByText(/R\$\s*200\s*mil/)).toBeInTheDocument();
    expect(within(col).getByText("Ana")).toBeInTheDocument();
  });

  it("coluna sem leads mostra o vazio compacto", () => {
    montar();
    const col = screen.getByRole("heading", { name: /Contato/ }).closest("section")!;
    expect(within(col).getByText("Nenhum lead nesta etapa")).toBeInTheDocument();
  });

  it("menu 'Mover para…' emite onMover com o alvo", async () => {
    const user = userEvent.setup();
    const { onMover } = montar();
    await user.click(screen.getByRole("button", { name: "Mover Ana para…" }));
    await user.click(await screen.findByRole("menuitem", { name: "Visita" }));
    expect(onMover).toHaveBeenCalledWith({ leadId: "lead_ana", para: "visita", ordem: 1 });
    expect(screen.getByText("Movendo Ana para a etapa Visita.")).toBeInTheDocument();
  });

  it("destino negado fica aria-disabled, mostra o motivo e não emite", async () => {
    const user = userEvent.setup();
    const { onMover } = montar();
    await user.click(screen.getByRole("button", { name: "Mover Ana para…" }));
    const item = await screen.findByRole("menuitem", { name: /Fechado/ });
    expect(item).toHaveAttribute("aria-disabled", "true");
    expect(item).toHaveTextContent("Só leads com proposta podem fechar.");
    await user.click(item);
    expect(onMover).not.toHaveBeenCalled();
  });

  it("emite a intenção de ir para perdido sem decidir motivo", async () => {
    const user = userEvent.setup();
    const { onMover } = montar();
    await user.click(screen.getByRole("button", { name: "Mover Carla para…" }));
    await user.click(await screen.findByRole("menuitem", { name: "Perdido" }));
    expect(onMover).toHaveBeenCalledWith({ leadId: "lead_carla", para: "perdido", ordem: 0 });
  });

  it("clicar no nome abre o detalhe", async () => {
    const user = userEvent.setup();
    const { onAbrir } = montar();
    await user.click(screen.getByRole("button", { name: "Ana" }));
    expect(onAbrir).toHaveBeenCalledWith("lead_ana");
  });

  it("alça de arrastar tem nome acessível em pt-BR e instruções", () => {
    montar();
    const alca = screen.getByRole("button", { name: "Arrastar Ana" });
    expect(alca).toHaveAttribute("aria-roledescription", "lead arrastável");
  });

  it("renderiza erro com 'Tentar de novo', carregando e vazio total", async () => {
    const user = userEvent.setup();
    const onTentarNovamente = vi.fn();
    const { unmount } = render(
      <KanbanBoard
        {...({} as KanbanBoardProps)}
        estado={{ fase: "error", erro: new Error("x") }}
        onTentarNovamente={onTentarNovamente}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(onTentarNovamente).toHaveBeenCalled();
    unmount();
    const r = render(<KanbanBoard {...({} as KanbanBoardProps)} estado={{ fase: "loading" }} />);
    expect(screen.getByRole("status", { name: "Carregando quadro de leads" })).toBeInTheDocument();
    r.unmount();
    render(<KanbanBoard {...({} as KanbanBoardProps)} estado={{ fase: "success", dados: [] }} />);
    expect(screen.getByText("Nenhum lead ainda")).toBeInTheDocument();
  });
});

describe("anúncios do arraste em pt-BR", () => {
  const anuncios = criarAnuncios({
    nomeDoLead: (id) => (id === "a" ? "Ana" : "Lead"),
    etapaDoAlvo: (id) => (id === "coluna:visita" ? "visita" : id === "coluna:fechado" ? "fechado" : "novo"),
    etapaAtual: () => "novo",
    permissao: (_id, para) => (para === "fechado" ? negar("Falta a proposta.") : PERMITIDO),
  });
  const ev = (over?: string) => ({ active: { id: "a" }, over: over ? { id: over } : null }) as never;

  it("início, sobre, solto, negado e cancelado", () => {
    expect(anuncios.onDragStart!(ev())).toContain("Ana pego, na etapa Novo");
    expect(anuncios.onDragOver!(ev("coluna:visita"))).toBe("Ana sobre a etapa Visita.");
    expect(anuncios.onDragOver!(ev("coluna:fechado"))).toBe("Ana não pode ir para a etapa Fechado: Falta a proposta.");
    expect(anuncios.onDragEnd!(ev("coluna:visita"))).toBe("Ana movido para a etapa Visita.");
    expect(anuncios.onDragEnd!(ev("coluna:fechado"))).toContain("não foi movido para Fechado: Falta a proposta.");
    expect(anuncios.onDragEnd!(ev())).toContain("Nada foi alterado");
    expect(anuncios.onDragCancel!(ev())).toContain("cancelado");
  });
});

describe("LeadCard (RF-30)", () => {
  it("mostra 'Sem orçamento', origem e responsável", () => {
    const l = lead("Bruno", "novo", 0, null);
    render(<LeadCard lead={l} responsavel="Joana Souza" onAbrir={vi.fn()} agora={agora} />);
    expect(screen.getByText("Sem orçamento")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Joana Souza" })).toBeInTheDocument();
  });
});
