"use client";

import { EllipsisVertical } from "lucide-react";
import Link from "next/link";
import { useId } from "react";
import { dataLocal } from "@/domain";
import { cn } from "@/lib/cn";
import { formatData, formatRelativo } from "@/lib/format";
import type { Recurso } from "@/lib/recurso";
import { Badge, type BadgeProps } from "../ui/Badge";
import { Button } from "../ui/Button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/DropdownMenu";
import { Avatar } from "../ui/Avatar";
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
  /** Valor já formatado (vencimento), em mono à direita. */
  valor?: string;
  /** Nome de quem responde pelo item (avatar com iniciais). */
  responsavel?: string;
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

const TIPO_UI: Record<TipoItemAgendaPeriodo, { rotulo: string; ponto: string }> = {
  visita: { rotulo: "Visita", ponto: "bg-text" },
  vencimento: { rotulo: "Vencimento", ponto: "bg-stone-2" },
};

const hora = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
const temHora = (quando: string) => quando.length > 10;

function tituloDoDia(dia: string, agora: Date | undefined): string {
  const rel = formatRelativo(dia, agora);
  const longa = formatData(dia, "longa");
  if (/^\d/.test(rel)) return longa;
  return `${rel[0]!.toUpperCase()}${rel.slice(1)} · ${longa}`;
}

const diaSemana = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" });
/** Bloco de data de `AAAA-MM-DD` (calendário puro): dia da semana, número e relativo ("Amanhã", "Em 2 dias"). */
function blocoDoDia(dia: string, agora: Date | undefined) {
  const semana = diaSemana.format(new Date(`${dia}T12:00:00Z`)).replace(".", "");
  const rel = formatRelativo(dia, agora);
  return {
    semana,
    numero: String(Number(dia.slice(8, 10))),
    relativo: /^\d/.test(rel) ? "" : `${rel[0]!.toUpperCase()}${rel.slice(1)}`,
  };
}

export function AgendaPeriodoSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando agenda">
      <div className="flex flex-col gap-9">
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="flex flex-col gap-4 md:flex-row md:gap-5">
            <Skeleton className="h-14 w-16" />
            <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6">
              <Skeleton className="w-1/3" />
              <Skeleton className="w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Item({ item }: { item: ItemAgendaPeriodo }) {
  const ui = TIPO_UI[item.tipo];
  const classeTitulo = "block truncate text-md font-medium text-text";
  const acoes = item.acoes ?? [];
  return (
    <li className="group relative flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-border-soft py-5 pr-3 pl-5 first:border-t-0 md:pl-6">
      <span className="w-14 shrink-0 num text-md text-text">
        {temHora(item.quando) ? (
          <time dateTime={item.quando}>{hora.format(new Date(item.quando))}</time>
        ) : (
          <span aria-hidden="true">—</span>
        )}
      </span>
      <div className="flex min-w-0 flex-1 basis-48 flex-col gap-1.5">
        <p className="flex items-center gap-1.5 eyebrow">
          <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", ui.ponto)} />
          {ui.rotulo}
        </p>
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
        {item.detalhe ? <p className="tnum truncate text-caption text-text-muted">{item.detalhe}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-3.5">
        {item.valor ? <span className="num text-base font-medium text-text">{item.valor}</span> : null}
        {item.responsavel ? <Avatar name={item.responsavel} size={32} className="border border-border" /> : null}
        {item.situacao ? <Badge tone={item.situacao.tom}>{item.situacao.rotulo}</Badge> : null}
      </div>
      {acoes.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              icon={EllipsisVertical}
              aria-label={`Ações: ${item.titulo}`}
              className="relative z-10 size-11"
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

/**
 * Lista de compromissos por dia com situação e ações (RF-73), com os cinco estados de tela (RNF-09).
 * Cada dia: bloco de data grande (serifa) ao lado de um card com as linhas do dia.
 */
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
            <div role="group" aria-label={ariaLabel} className="flex animate-fade-in flex-col gap-9">
              {[...grupos].map(([dia, lista]) => {
                const b = blocoDoDia(dia, agora);
                return (
                  <section
                    key={dia}
                    aria-labelledby={`${idBase}-${dia}`}
                    className="flex flex-col gap-4 md:flex-row md:gap-5"
                  >
                    <h3 id={`${idBase}-${dia}`} className="sr-only">
                      {tituloDoDia(dia, agora)}
                    </h3>
                    <div
                      aria-hidden="true"
                      className="flex items-baseline gap-3 md:block md:w-24 md:shrink-0 md:pt-1.5"
                    >
                      <p className="eyebrow">{b.semana}</p>
                      <p className="display text-4xl leading-display text-text md:mt-1.5">{b.numero}</p>
                      {b.relativo ? <p className="text-xs text-text-muted md:mt-2">{b.relativo}</p> : null}
                    </div>
                    <ol className="min-w-0 flex-1 overflow-hidden rounded-lg border border-border bg-surface">
                      {lista.map((i) => (
                        <Item key={i.id} item={i} />
                      ))}
                    </ol>
                  </section>
                );
              })}
            </div>
          );
        }}
      </EstadoRecurso>
    </div>
  );
}
