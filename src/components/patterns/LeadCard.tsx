import { EllipsisVertical } from "lucide-react";
import type { ReactNode } from "react";
import type { Etapa, Lead, MotivoPerda, Origem, Permissao } from "@/domain";
import { cn } from "@/lib/cn";
import { formatMoeda, formatRelativo } from "@/lib/format";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu";
import { Skeleton } from "../ui/Skeleton";
import { ETAPA_UI, FINALIDADE_ROTULO, MOTIVO_PERDA_ROTULO, ORIGEM_ROTULO, TIPO_IMOVEL_ROTULO } from "./rotulos";

/** Destino do "Mover para…" já resolvido pelo domínio (`destinosNegociacao`); negado mostra o motivo. */
export type DestinoLead = { etapa: Etapa; permissao: Permissao };

/**
 * O que o card mostra de uma negociação (lead × imóvel, RF-70). `valor` vem do domínio
 * (`valorNegociacao`: preço do imóvel ou, sem imóvel, orçamento do lead).
 */
export type NegociacaoCard = {
  id: string;
  etapa: Etapa;
  ordem: number;
  responsavelId: string;
  motivoPerda: MotivoPerda | null;
  atualizadoEm: string;
  valor: number | null;
  lead: { id: string; nome: string; origem: Origem; interesse: Lead["interesse"] };
  imovel: { id: string; codigo: string; titulo: string } | null;
};

/** Nome acessível da negociação: "Ana Souza (AT-0012)" ou "Ana Souza (sem imóvel)". */
export const rotuloNegociacao = (n: Pick<NegociacaoCard, "lead" | "imovel">) =>
  `${n.lead.nome} (${n.imovel ? n.imovel.codigo : "sem imóvel"})`;

export type LeadCardProps = {
  negociacao: NegociacaoCard;
  /** Nome do corretor responsável (resolvido por quem chama). */
  responsavel: string;
  /** Opções de "Mover para…" (RF-31). Vazio = sem menu. */
  destinos?: readonly DestinoLead[];
  /** Abre o detalhe do lead da negociação. */
  onAbrir: (leadId: string) => void;
  /** Emite a intenção de mover a negociação; quem chama aplica pelo domínio (`transicionarNegociacao`). */
  onMover?: (negociacaoId: string, para: Etapa) => void;
  /** Última atividade (ISO); padrão: `negociacao.atualizadoEm`. */
  ultimaAtividade?: string;
  /** Referência de "agora" para o texto relativo (histórias determinísticas). */
  agora?: Date;
  /** Alça de arrastar, posicionada pelo Kanban. */
  alca?: ReactNode;
  /** Visual de "levantado" (item no DragOverlay). */
  arrastando?: boolean;
  className?: string;
};

/** Resume o interesse: "Venda · Apartamento, Casa · Pinheiros +2". */
export function resumirInteresse(i: Lead["interesse"]): string {
  const partes = [FINALIDADE_ROTULO[i.finalidade]];
  if (i.tipos.length) partes.push(i.tipos.map((t) => TIPO_IMOVEL_ROTULO[t]).join(", "));
  if (i.bairros.length) partes.push(i.bairros.length > 1 ? `${i.bairros[0]} +${i.bairros.length - 1}` : i.bairros[0]!);
  return partes.join(" · ");
}

/**
 * Card de negociação do Kanban e das listas (RF-30, RF-31, RF-34, RF-70): nome do lead, imóvel (ou
 * "Sem imóvel") e valor. Só props: o menu "Mover para…" emite `onMover` e mostra o motivo dos destinos
 * negados; nenhuma regra de etapa mora aqui.
 */
export function LeadCard({
  negociacao,
  responsavel,
  destinos = [],
  onAbrir,
  onMover,
  ultimaAtividade,
  agora,
  alca,
  arrastando = false,
  className,
}: LeadCardProps) {
  const { lead, imovel } = negociacao;
  const motivoPerda = negociacao.motivoPerda ? MOTIVO_PERDA_ROTULO[negociacao.motivoPerda] : null;
  return (
    <Card
      className={cn(
        "flex flex-col gap-2 p-3 text-sm",
        arrastando && "rotate-1 border-primary shadow-3 motion-reduce:rotate-0",
        className,
      )}
    >
      <div className="flex items-start gap-1">
        {alca}
        <h3 className="min-w-0 flex-1 text-base font-semibold break-words text-text">
          <button
            type="button"
            aria-label={rotuloNegociacao(negociacao)}
            onClick={() => onAbrir(lead.id)}
            className="cursor-pointer text-left after:absolute after:inset-0 after:rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {lead.nome}
          </button>
        </h3>
        {destinos.length > 0 && onMover ? (
          <MoverPara
            nome={rotuloNegociacao(negociacao)}
            negociacaoId={negociacao.id}
            destinos={destinos}
            onMover={onMover}
          />
        ) : null}
      </div>
      <p className="line-clamp-2 break-words text-text">
        {imovel ? (
          <>
            <span className="tnum font-medium">{imovel.codigo}</span> · {imovel.titulo}
          </>
        ) : (
          <span className="text-text-muted">Sem imóvel</span>
        )}
      </p>
      <p className="tnum text-text">
        {negociacao.valor === null ? <span className="text-text-muted">Sem valor</span> : formatMoeda(negociacao.valor)}
      </p>
      <p className="line-clamp-2 text-text-muted">{resumirInteresse(lead.interesse)}</p>
      {motivoPerda ? <p className="text-text-muted">Motivo da perda: {motivoPerda}</p> : null}
      <div className="flex items-center justify-between gap-2 text-xs text-text-muted">
        <span className="min-w-0 truncate">{ORIGEM_ROTULO[lead.origem]}</span>
        <span className="shrink-0">{formatRelativo(ultimaAtividade ?? negociacao.atualizadoEm, agora)}</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <Avatar name={responsavel} size={24} />
        <span className="min-w-0 truncate">{responsavel}</span>
      </div>
    </Card>
  );
}

function MoverPara({
  nome,
  negociacaoId,
  destinos,
  onMover,
}: {
  nome: string;
  negociacaoId: string;
  destinos: readonly DestinoLead[];
  onMover: (negociacaoId: string, para: Etapa) => void;
}) {
  return (
    // modal=false: o Radix não aplica aria-hidden aos irmãos (o quadro inteiro) com o menu aberto.
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          icon={EllipsisVertical}
          aria-label={`Mover ${nome} para…`}
          className="relative z-10 size-10 shrink-0 max-sm:size-11"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Mover para…</DropdownMenuLabel>
        {destinos.map(({ etapa, permissao }) => (
          <DropdownMenuItem
            key={etapa}
            aria-disabled={!permissao.ok || undefined}
            className="h-auto min-h-9 flex-col items-start justify-center gap-0 py-1 aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
            onSelect={(e) => {
              if (!permissao.ok) return e.preventDefault(); // negado: continua aberto, com o motivo visível
              onMover(negociacaoId, etapa);
            }}
          >
            {ETAPA_UI[etapa].rotulo}
            {permissao.ok ? null : <span className="text-xs text-text-muted">{permissao.motivo}</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Mesma forma do card final (cards de item único exportam skeleton). */
export function LeadCardSkeleton({ className }: { className?: string }) {
  return (
    <Card aria-hidden="true" className={cn("flex flex-col gap-2 p-3", className)}>
      <Skeleton className="w-2/3" />
      <Skeleton className="w-1/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex items-center gap-2">
        <Skeleton shape="circle" className="size-6" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </Card>
  );
}
