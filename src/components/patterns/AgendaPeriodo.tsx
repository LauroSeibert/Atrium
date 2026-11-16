"use client";

import { Banknote, CalendarClock, EllipsisVertical, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useId } from "react";
import { dataLocal } from "@/domain";
import { cn } from "@/lib/cn";
import { formatData, formatRelativo } from "@/lib/format";
import type { Recurso } from "@/lib/recurso";
import { Badge, type BadgeProps } from "../ui/Badge";
import { Button } from "../ui/Button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/DropdownMenu";
import { Icon } from "../ui/Icon";
import { Skeleton } from "../ui/Skeleton";
import { EmptyState } from "./EmptyState";
import { EstadoRecurso } from "./EstadoRecurso";

/**
 * Agenda por período (RF-73): visitas e vencimentos agrupados por dia, com a situação do item e as
 * ações que o domínio permite (ex.: marcar visita como realizada). Só apresentação: quem chama
 * monta os itens e diz quais ações existem; o composto não conhece regra de visita nem de parcela.
 */
export type TipoItemAgendaPeriodo = "visita" | "vencimento";

export type AcaoItemAgenda = { id: string; rotulo: string; onAcionar: () => void };

export type ItemAgendaPeriodo = {
  id: string;
  tipo: TipoItemAgendaPeriodo;
  /** Instante ISO (visita, com hora) ou data `AAAA-MM-DD` (vencimento, sem hora). */
  quando: string;
  titulo: string;
  detalhe?: string;
  href?: string;
  situacao?: { rotulo: string; tom: NonNullable<BadgeProps["tone"]> };
  /** Vazio ou ausente = sem menu de ações. */
  acoes?: readonly AcaoItemAgenda[];
};

export type AgendaPeriodoProps = {
  estado: Recurso<readonly ItemAgendaPeriodo[]>;
  /** Referência de "agora" (histórias e testes determinísticos). */
  agora?: Date;
  tituloVazio?: string;
  onTentarNovamente?: () => void;
  className?: string;
  "aria-label"?: string;
};

const TIPO_UI: Record<TipoItemAgendaPeriodo, { rotulo: string; icone: LucideIcon }> = {
  visita: { rotulo: "Visita", icone: CalendarClock },
  vencimento: { rotulo: "Vencimento", icone: Banknote },
};

const hora = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
const temHora = (quando: string) => quando.length > 10;

function tituloDoDia(dia: string, agora: Date | undefined): string {
  const rel = formatRelativo(dia, agora);
  const longa = formatData(dia, "longa");
  if (/^\d/.test(rel)) return longa;
  return `${rel[0]!.toUpperCase()}${rel.slice(1)} · ${longa}`;
}

export function AgendaPeriodoSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando agenda">
      <ul className="flex flex-col gap-4">
        {Array.from({ length: 5 }, (_, i) => (
          <li key={i} className="flex gap-3">
            <Skeleton shape="circle" className="size-8" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Item({ item }: { item: ItemAgendaPeriodo }) {
  const ui = TIPO_UI[item.tipo];
  const classeTitulo = "line-clamp-2 text-sm font-medium wrap-anywhere text-text";
  const acoes = item.acoes ?? [];
  return (
    <li className="group relative flex items-start gap-3 py-2.5">
      <span className="tnum w-11 shrink-0 pt-px text-sm text-text-muted">
        {temHora(item.quando) ? (
          <time dateTime={item.quando}>{hora.format(new Date(item.quando))}</time>
        ) : (
          <span aria-hidden="true">—</span>
        )}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {item.href ? (
          <Link
            href={item.href}
            className={cn(
              classeTitulo,
              "rounded-sm underline-offset-4 group-hover:underline after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            )}
          >
            {item.titulo}
          </Link>
        ) : (
          <p className={classeTitulo}>{item.titulo}</p>
        )}
        <p className="flex min-w-0 items-center gap-1.5 text-xs text-text-muted">
          <Icon icon={ui.icone} size={16} className={cn("shrink-0", item.tipo === "visita" && "text-primary")} />
          <span className="shrink-0">{ui.rotulo}</span>
          {item.detalhe ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="tnum truncate">{item.detalhe}</span>
            </>
          ) : null}
        </p>
      </div>
      {item.situacao ? (
        <Badge tone={item.situacao.tom} size="sm" className="mt-0.5">
          {item.situacao.rotulo}
        </Badge>
      ) : null}
      {acoes.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              icon={EllipsisVertical}
              aria-label={`Ações: ${item.titulo}`}
              className="relative z-10 -my-1 max-md:size-11"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {acoes.map((a) => (
              <DropdownMenuItem key={a.id} onSelect={a.onAcionar}>
                {a.rotulo}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </li>
  );
}

/** Lista de compromissos por dia com situação e ações (RF-73), com os cinco estados de tela (RNF-09). */
export function AgendaPeriodo({
  estado,
  agora,
  tituloVazio = "Nenhum compromisso no período",
  onTentarNovamente,
  className,
  "aria-label": ariaLabel = "Compromissos",
}: AgendaPeriodoProps) {
  const idBase = useId();
  return (
    <div className={cn("min-w-0", className)}>
      <EstadoRecurso
        estado={estado}
        carregando={<AgendaPeriodoSkeleton />}
        estaVazio={(d) => d.length === 0}
        vazio={<EmptyState tamanho="compacto" ilustracao="semResultados" titulo={tituloVazio} />}
        erro={{ titulo: "Não foi possível carregar a agenda" }}
        onTentarNovamente={onTentarNovamente}
      >
        {(dados) => {
          const grupos = new Map<string, ItemAgendaPeriodo[]>();
          for (const i of dados) {
            const dia = dataLocal(i.quando);
            grupos.set(dia, [...(grupos.get(dia) ?? []), i]);
          }
          return (
            <div role="group" aria-label={ariaLabel} className="flex animate-fade-in flex-col gap-5">
              {[...grupos].map(([dia, lista]) => (
                <section key={dia} aria-labelledby={`${idBase}-${dia}`} className="flex flex-col gap-1">
                  <h3 id={`${idBase}-${dia}`} className="text-xs font-medium text-text-muted">
                    {tituloDoDia(dia, agora)}
                  </h3>
                  <ol className="flex flex-col divide-y divide-border">
                    {lista.map((i) => (
                      <Item key={i.id} item={i} />
                    ))}
                  </ol>
                </section>
              ))}
            </div>
          );
        }}
      </EstadoRecurso>
    </div>
  );
}
