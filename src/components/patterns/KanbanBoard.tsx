"use client";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
  type ScreenReaderInstructions,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ETAPAS, type Etapa, type Permissao } from "@/domain";
import { cn } from "@/lib/cn";
import { paraCss, useTransicaoToken } from "@/lib/motion";
import { formatMoeda } from "@/lib/format";
import type { Recurso } from "@/lib/recurso";
import { Button } from "../ui/Button";
import { Skeleton } from "../ui/Skeleton";
import { EmptyState } from "./EmptyState";
import { EstadoRecurso } from "./EstadoRecurso";
import { LeadCard, LeadCardSkeleton, rotuloNegociacao, type DestinoLead, type NegociacaoCard } from "./LeadCard";
import { ETAPA_UI } from "./rotulos";

/**
 * Kanban de negociações por etapa (RF-30, RF-31, RF-32, RF-70, WCAG 2.5.7). Cada card é um lead × imóvel.
 * O quadro NÃO muda a lista nem decide transições: pergunta `podeSoltar`, `destinosDe` e emite
 * `onMover`. Mover para "perdido" exige motivo (RF-32): quem chama abre o diálogo e só então aplica
 * `transicionarNegociacao`. Alternativas ao arrastar: teclado (dnd-kit) e o menu "Mover para…" do card.
 */
export type MoverNegociacaoEvento = { negociacaoId: string; para: Etapa; ordem: number };

export type KanbanBoardProps = {
  estado: Recurso<readonly NegociacaoCard[]>;
  /** `id do corretor → nome`. */
  responsaveis: Record<string, string>;
  /** Destinos do "Mover para…" de cada negociação, já resolvidos pelo domínio. */
  destinosDe: (negociacao: NegociacaoCard) => readonly DestinoLead[];
  /** O domínio responde se a negociação pode ser solta em `para` (`podeTransicionarNegociacao`). */
  podeSoltar: (negociacaoId: string, para: Etapa) => Permissao;
  onMover: (evento: MoverNegociacaoEvento) => void;
  onAbrir: (leadId: string) => void;
  onTentarNovamente?: () => void;
  /** Colunas exibidas, em ordem (padrão: todas as etapas). */
  etapas?: readonly Etapa[];
  agora?: Date;
  className?: string;
};

const PREFIXO_COLUNA = "coluna:";
const idColuna = (e: Etapa) => `${PREFIXO_COLUNA}${e}`;

export const INSTRUCOES_KANBAN: ScreenReaderInstructions = {
  draggable:
    "Para pegar a negociação, pressione Espaço ou Enter. Use as setas para escolher a etapa e a posição, Espaço ou Enter para soltar, Esc para cancelar. Também é possível usar o menu Mover para…",
};

export type ContextoAnuncios = {
  nomeDoLead: (leadId: string) => string;
  /** Etapa a que um alvo (`over.id`) pertence: coluna ou card. */
  etapaDoAlvo: (overId: string) => Etapa | null;
  etapaAtual: (leadId: string) => Etapa;
  permissao: (leadId: string, para: Etapa) => Permissao;
};

/** Anúncios do dnd-kit em pt-BR (leitores de tela). */
export function criarAnuncios(c: ContextoAnuncios): Announcements {
  const sobre = (activeId: string, overId: string | undefined) => {
    const nome = c.nomeDoLead(activeId);
    const etapa = overId ? c.etapaDoAlvo(overId) : null;
    if (!etapa) return `${nome} fora de qualquer etapa.`;
    const p = c.permissao(activeId, etapa);
    return p.ok
      ? `${nome} sobre a etapa ${ETAPA_UI[etapa].rotulo}.`
      : `${nome} não pode ir para a etapa ${ETAPA_UI[etapa].rotulo}: ${p.motivo}`;
  };
  return {
    onDragStart: ({ active }) =>
      `${c.nomeDoLead(String(active.id))} pego, na etapa ${ETAPA_UI[c.etapaAtual(String(active.id))].rotulo}. Use as setas para mover.`,
    onDragOver: ({ active, over }) => sobre(String(active.id), over ? String(over.id) : undefined),
    onDragEnd: ({ active, over }) => {
      const id = String(active.id);
      const nome = c.nomeDoLead(id);
      const etapa = over ? c.etapaDoAlvo(String(over.id)) : null;
      if (!etapa) return `${nome} solto fora de uma etapa. Nada foi alterado.`;
      const p = c.permissao(id, etapa);
      if (!p.ok) return `${nome} não foi movido para ${ETAPA_UI[etapa].rotulo}: ${p.motivo}`;
      return etapa === c.etapaAtual(id)
        ? `${nome} solto na etapa ${ETAPA_UI[etapa].rotulo}.`
        : `${nome} movido para a etapa ${ETAPA_UI[etapa].rotulo}.`;
    },
    onDragCancel: ({ active }) => `Movimento cancelado. ${c.nomeDoLead(String(active.id))} voltou ao lugar.`,
  };
}

function CartaoArrastavel({
  negociacao,
  responsavel,
  destinos,
  negado,
  onAbrir,
  onMover,
  agora,
  transicao,
  chegando,
  onChegou,
}: {
  negociacao: NegociacaoCard;
  responsavel: string;
  destinos: readonly DestinoLead[];
  negado: boolean;
  onAbrir: (id: string) => void;
  onMover: (id: string, para: Etapa) => void;
  agora?: Date;
  /** Deslocamento dos vizinhos durante o arraste (tokens; 1 ms com reduced-motion). */
  transicao: { duration: number; easing: string };
  /** O card acabou de ser solto/movido aqui: entra com um "snap" curto. */
  chegando: boolean;
  onChegou: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: negociacao.id,
    data: { etapa: negociacao.etapa },
    disabled: { droppable: negado },
    transition: transicao,
    attributes: { roleDescription: "negociação arrastável" },
  });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(isDragging && "opacity-40", chegando && "animate-scale-in")}
      onAnimationEnd={chegando ? (e) => e.target === e.currentTarget && onChegou() : undefined}
    >
      <LeadCard
        negociacao={negociacao}
        responsavel={responsavel}
        destinos={destinos}
        onAbrir={onAbrir}
        onMover={onMover}
        agora={agora}
        alca={
          <Button
            ref={setActivatorNodeRef}
            variant="ghost"
            size="sm"
            icon={GripVertical}
            aria-label={`Arrastar ${rotuloNegociacao(negociacao)}`}
            className="relative z-10 size-10 shrink-0 cursor-grab touch-none max-sm:size-11"
            {...attributes}
            {...listeners}
          />
        }
      />
    </li>
  );
}

function Coluna({
  etapa,
  leads,
  permissaoDoArraste,
  renderCartao,
}: {
  etapa: Etapa;
  leads: readonly NegociacaoCard[];
  /** `null` fora de um arraste. */
  permissaoDoArraste: Permissao | null;
  renderCartao: (negociacao: NegociacaoCard, negado: boolean) => React.ReactNode;
}) {
  const negado = permissaoDoArraste !== null && !permissaoDoArraste.ok;
  const { setNodeRef, isOver } = useDroppable({ id: idColuna(etapa), data: { etapa }, disabled: negado });
  const titulo = useId();
  const soma = leads.reduce((s, l) => s + (l.valor ?? 0), 0); // agregação de exibição (RF-30)
  const info = ETAPA_UI[etapa];
  return (
    <section
      aria-labelledby={titulo}
      className={cn(
        "flex w-72 shrink-0 flex-col gap-4 rounded-lg border p-2 sm:w-80",
        // coluna-alvo destaca com transição curta (Fase 9)
        "transition-colors duration-(--dur-fast) ease-standard",
        negado ? "border-danger-line" : isOver ? "border-line-strong bg-surface-muted" : "border-transparent",
      )}
    >
      <header className="flex flex-col gap-1 border-b border-border px-1 pb-3">
        <h2 id={titulo} className="flex items-baseline justify-between gap-2">
          <span className="eyebrow text-text">{info.rotulo}</span>
          <span className="num text-xs text-text-muted">
            {leads.length} {leads.length === 1 ? "negociação" : "negociações"}
          </span>
        </h2>
        <p className="num text-caption text-text-2">
          <span className="sr-only">Valor somado: </span>
          {soma > 0 ? formatMoeda(soma, { compacto: true }) : "Sem valor"}
        </p>
        {negado ? <p className="text-sm font-medium text-danger">Não permitido: {permissaoDoArraste.motivo}</p> : null}
      </header>
      <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
        <ul ref={setNodeRef} aria-labelledby={titulo} className="flex min-h-24 flex-1 flex-col gap-2">
          {leads.map((l) => renderCartao(l, negado))}
        </ul>
      </SortableContext>
      {leads.length === 0 ? (
        <EmptyState tamanho="compacto" ilustracao="semResultados" titulo="Nenhuma negociação nesta etapa" />
      ) : null}
    </section>
  );
}

function Quadro({
  leads,
  responsaveis,
  destinosDe,
  podeSoltar,
  onMover,
  onAbrir,
  etapas,
  agora,
}: Omit<KanbanBoardProps, "estado" | "onTentarNovamente" | "className"> & {
  leads: readonly NegociacaoCard[];
  etapas: readonly Etapa[];
}) {
  const idContexto = useId();
  const [ativoId, setAtivoId] = useState<string | null>(null);
  const [aviso, setAviso] = useState("");
  // Estado só visual: qual card acabou de ser movido, para animar a chegada na coluna de destino.
  const [chegada, setChegada] = useState<{ id: string; para: Etapa } | null>(null);
  const transicaoBase = useTransicaoToken("--dur-base", "--easing-standard");
  const { duration: duracaoMs, easing } = paraCss(transicaoBase);
  const transicao = useMemo(() => ({ duration: duracaoMs, easing }), [duracaoMs, easing]);
  const limparChegada = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (limparChegada.current && clearTimeout(limparChegada.current)), []);
  /** Marca a chegada; se o movimento não acontecer (ex.: diálogo de perda cancelado), expira sozinha. */
  const marcarChegada = (id: string, para: Etapa) => {
    setChegada({ id, para });
    if (limparChegada.current) clearTimeout(limparChegada.current);
    limparChegada.current = setTimeout(() => setChegada(null), 5000);
  };
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (temporizador.current && clearTimeout(temporizador.current)), []);
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const porId = useMemo(() => new Map(leads.map((l) => [l.id, l])), [leads]);
  const colunas = useMemo(() => {
    const m = new Map<Etapa, NegociacaoCard[]>(etapas.map((e) => [e, []]));
    for (const l of [...leads].sort((a, b) => a.ordem - b.ordem)) m.get(l.etapa)?.push(l);
    return m;
  }, [leads, etapas]);

  const nome = (id: string) => {
    const n = porId.get(id);
    return n ? rotuloNegociacao(n) : "Negociação";
  };
  const ativo = ativoId ? (porId.get(ativoId) ?? null) : null;
  /** Sempre pergunta ao domínio, inclusive para a própria coluna (reordenar). */
  const permissaoPara = (leadId: string, etapa: Etapa): Permissao => podeSoltar(leadId, etapa);
  const etapaDoAlvo = (overId: string): Etapa | null =>
    overId.startsWith(PREFIXO_COLUNA)
      ? (overId.slice(PREFIXO_COLUNA.length) as Etapa)
      : (porId.get(overId)?.etapa ?? null);

  const anuncios = criarAnuncios({
    nomeDoLead: nome,
    etapaDoAlvo,
    etapaAtual: (id) => porId.get(id)!.etapa,
    permissao: permissaoPara,
  });

  function aoSoltar({ active, over }: DragEndEvent) {
    setAtivoId(null);
    if (!over) return;
    const leadId = String(active.id);
    const origem = porId.get(leadId);
    const overId = String(over.id);
    const para = etapaDoAlvo(overId);
    if (!origem || !para || !permissaoPara(leadId, para).ok) return;
    const coluna = colunas.get(para) ?? [];
    const ordem = overId.startsWith(PREFIXO_COLUNA)
      ? coluna.filter((l) => l.id !== leadId).length
      : coluna.findIndex((l) => l.id === overId);
    if (para === origem.etapa && ordem === coluna.findIndex((l) => l.id === leadId)) return; // não mudou
    marcarChegada(leadId, para);
    onMover({ negociacaoId: leadId, para, ordem });
  }

  function moverPorMenu(leadId: string, para: Etapa) {
    setAviso(`Movendo ${nome(leadId)} para a etapa ${ETAPA_UI[para].rotulo}.`);
    // Limpa depois de anunciar, para que a mesma frase repetida seja anunciada de novo.
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setAviso(""), 1500);
    marcarChegada(leadId, para);
    onMover({ negociacaoId: leadId, para, ordem: colunas.get(para)?.length ?? 0 });
  }

  return (
    <DndContext
      id={idContexto}
      sensors={sensores}
      collisionDetection={closestCorners}
      accessibility={{ announcements: anuncios, screenReaderInstructions: INSTRUCOES_KANBAN }}
      onDragStart={({ active }: DragStartEvent) => setAtivoId(String(active.id))}
      onDragEnd={aoSoltar}
      onDragCancel={() => setAtivoId(null)}
    >
      <div
        role="region"
        aria-label="Quadro de negociações por etapa"
        tabIndex={0}
        className="relative flex w-full max-w-full min-w-0 items-start gap-4 overflow-x-auto pb-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {etapas.map((etapa) => (
          <Coluna
            key={etapa}
            etapa={etapa}
            leads={colunas.get(etapa) ?? []}
            permissaoDoArraste={ativo ? permissaoPara(ativo.id, etapa) : null}
            renderCartao={(lead, negado) => (
              <CartaoArrastavel
                key={lead.id}
                negociacao={lead}
                responsavel={responsaveis[lead.responsavelId] ?? "Sem responsável"}
                destinos={destinosDe(lead)}
                negado={negado}
                onAbrir={onAbrir}
                onMover={moverPorMenu}
                agora={agora}
                transicao={transicao}
                chegando={chegada?.id === lead.id && chegada.para === lead.etapa}
                onChegou={() => setChegada(null)}
              />
            )}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {ativo ? (
          <div aria-hidden="true" inert>
            <LeadCard
              negociacao={ativo}
              responsavel={responsaveis[ativo.responsavelId] ?? "Sem responsável"}
              onAbrir={onAbrir}
              agora={agora}
              arrastando
              className="w-72 sm:w-80"
            />
          </div>
        ) : null}
      </DragOverlay>
      <p role="status" className="sr-only">
        {aviso}
      </p>
    </DndContext>
  );
}

export function KanbanBoardSkeleton({ etapas = ETAPAS }: { etapas?: readonly Etapa[] }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando quadro de negociações"
      className="relative flex w-full max-w-full min-w-0 items-start gap-4 overflow-x-auto pb-2"
    >
      {etapas.map((e, i) => (
        <div key={e} className="flex w-72 shrink-0 flex-col gap-3 p-2 sm:w-80">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          {Array.from({ length: 2 + (i % 2) }, (_, k) => (
            <LeadCardSkeleton key={k} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function KanbanBoard({ estado, etapas = ETAPAS, onTentarNovamente, className, ...resto }: KanbanBoardProps) {
  return (
    <div className={cn("w-full max-w-full min-w-0", className)}>
      <EstadoRecurso
        estado={estado}
        carregando={<KanbanBoardSkeleton etapas={etapas} />}
        estaVazio={(d) => d.length === 0}
        vazio={<EmptyState titulo="Nenhuma negociação ainda" />}
        erro={{ titulo: "Não foi possível carregar as negociações" }}
        onTentarNovamente={onTentarNovamente}
      >
        {(dados) => <Quadro leads={dados} etapas={etapas} {...resto} />}
      </EstadoRecurso>
    </div>
  );
}
