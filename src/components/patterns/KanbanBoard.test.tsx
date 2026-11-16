import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ETAPAS, negar, PERMITIDO, type Etapa } from "@/domain";
import { AGORA_HISTORIAS, BASE_HISTORIAS } from "@/mocks/data/historias";
import { criarAnuncios, KanbanBoard, type KanbanBoardProps } from "./KanbanBoard";
import { LeadCard, type NegociacaoCard } from "./LeadCard";

const agora = new Date(AGORA_HISTORIAS);
const responsaveis = Object.fromEntries(BASE_HISTORIAS.corretores.map((c) => [c.id, c.nome]));
const base0 = BASE_HISTORIAS.leads[0]!;
/** Negociação de teste; `codigo: null` = sem imóvel. */
const lead = (
  nome: string,
  etapa: Etapa,
  ordem: number,
  valor: number | null = 100_000_00,
  codigo: string | null = "AT-0001",
): NegociacaoCard => {
  const slug = nome.toLowerCase().replace(/\W/g, "");
  return {
    id: `neg_${slug}`,
    etapa,
    ordem,
    valor,
    motivoPerda: etapa === "perdido" ? "preco" : null,
    responsavelId: BASE_HISTORIAS.corretores[0]!.id,
    atualizadoEm: base0.atualizadoEm,
    lead: { id: `lead_${slug}`, nome, origem: base0.origem, interesse: base0.interesse },
    imovel: codigo ? { id: `imv_${slug}`, codigo, titulo: `Casa de ${nome}` } : null,
  };
};
const leads = [
  lead("Ana", "novo", 0, 200_000_00),
  lead("Bruno", "novo", 1, null, null),
  lead("Carla", "visita", 0, 100_000_00, "AT-0003"),
];

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
  it("mostra colunas por etapa com contagem e soma do valor das negociações (RF-30, RF-70)", () => {
    montar();
    const novo = screen.getByRole("region", { name: "Quadro de negociações por etapa" });
    expect(novo).toHaveAttribute("tabindex", "0");
    const col = screen.getByRole("heading", { name: /Novo/ }).closest("section")!;
    expect(within(col).getByText("2 negociações")).toBeInTheDocument();
    expect(within(col).getByText(/R\$\s*200\s*mil/)).toBeInTheDocument();
    expect(within(col).getByText("Ana")).toBeInTheDocument();
    expect(within(col).getByText("AT-0001")).toBeInTheDocument();
    expect(within(col).getByText("Sem imóvel")).toBeInTheDocument();
  });

  it("coluna sem leads mostra o vazio compacto", () => {
    montar();
    const col = screen.getByRole("heading", { name: /Contato/ }).closest("section")!;
    expect(within(col).getByText("Nenhuma negociação nesta etapa")).toBeInTheDocument();
  });

  it("menu 'Mover para…' emite onMover com o alvo", async () => {
    const user = userEvent.setup();
    const { onMover } = montar();
    await user.click(screen.getByRole("button", { name: "Mover Ana (AT-0001) para…" }));
    await user.click(await screen.findByRole("menuitem", { name: "Visita" }));
    expect(onMover).toHaveBeenCalledWith({ negociacaoId: "neg_ana", para: "visita", ordem: 1 });
    expect(screen.getByText("Movendo Ana (AT-0001) para a etapa Visita.")).toBeInTheDocument();
  });

  it("destino negado fica aria-disabled, mostra o motivo e não emite", async () => {
    const user = userEvent.setup();
    const { onMover } = montar();
    await user.click(screen.getByRole("button", { name: "Mover Ana (AT-0001) para…" }));
    const item = await screen.findByRole("menuitem", { name: /Fechado/ });
    expect(item).toHaveAttribute("aria-disabled", "true");
    expect(item).toHaveTextContent("Só leads com proposta podem fechar.");
    await user.click(item);
    expect(onMover).not.toHaveBeenCalled();
  });

  it("emite a intenção de ir para perdido sem decidir motivo", async () => {
    const user = userEvent.setup();
    const { onMover } = montar();
    await user.click(screen.getByRole("button", { name: "Mover Carla (AT-0003) para…" }));
    await user.click(await screen.findByRole("menuitem", { name: "Perdido" }));
    expect(onMover).toHaveBeenCalledWith({ negociacaoId: "neg_carla", para: "perdido", ordem: 0 });
  });

  it("clicar no nome abre o detalhe do lead", async () => {
    const user = userEvent.setup();
    const { onAbrir } = montar();
    await user.click(screen.getByRole("button", { name: "Ana (AT-0001)" }));
    expect(onAbrir).toHaveBeenCalledWith("lead_ana");
  });

  it("alça de arrastar tem nome acessível em pt-BR e instruções", () => {
    montar();
    const alca = screen.getByRole("button", { name: "Arrastar Ana (AT-0001)" });
    expect(alca).toHaveAttribute("aria-roledescription", "negociação arrastável");
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
    expect(screen.getByRole("status", { name: "Carregando quadro de negociações" })).toBeInTheDocument();
    r.unmount();
    render(<KanbanBoard {...({} as KanbanBoardProps)} estado={{ fase: "success", dados: [] }} />);
    expect(screen.getByText("Nenhuma negociação ainda")).toBeInTheDocument();
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
  it("mostra 'Sem imóvel', 'Sem valor', origem e responsável", () => {
    const l = lead("Bruno", "novo", 0, null, null);
    render(<LeadCard negociacao={l} responsavel="Joana Souza" onAbrir={vi.fn()} agora={agora} />);
    expect(screen.getByText("Sem imóvel")).toBeInTheDocument();
    expect(screen.getByText("Sem valor")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Joana Souza" })).toBeInTheDocument();
  });
});
