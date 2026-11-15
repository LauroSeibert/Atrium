import Link from "next/link";
import type { ReactNode } from "react";
import { dataLocal, type Atividade } from "@/domain";
import { cn } from "@/lib/cn";
import { formatData, formatDataHora, formatRelativo } from "@/lib/format";
import type { Recurso } from "@/lib/recurso";
import { Icon } from "../ui/Icon";
import { Skeleton } from "../ui/Skeleton";
import { EmptyState } from "./EmptyState";
import { EstadoRecurso } from "./EstadoRecurso";
import { ICONE_ATIVIDADE, textoAtividade } from "./textoHistorico";

/** Nome do autor: mapa `id → nome` ou função. Id desconhecido vira "Usuário removido". */
export type Autores = Record<string, string> | ((id: string) => string | undefined);

export function nomeDoAutor(autores: Autores, id: string): string {
  const nome = typeof autores === "function" ? autores(id) : autores[id];
  return nome ?? "Usuário removido";
}

/** Data relativa visível; a absoluta fica em `title` (e visível quando `absoluta`). */
export function Instante({ iso, agora, absoluta = false }: { iso: string; agora?: Date; absoluta?: boolean }) {
  return (
    <time dateTime={iso} title={formatDataHora(iso)}>
      {formatRelativo(iso, agora)}
      {absoluta ? <span className="text-text-muted"> · {formatDataHora(iso)}</span> : null}
    </time>
  );
}

export type ActivityFeedProps = {
  estado: Recurso<readonly Atividade[]>;
  autores: Autores;
  /** `timeline`: linha vertical, para o detalhe de lead/imóvel (RF-26, RF-34). `feed`: compacta, para o painel. */
  variante?: "timeline" | "feed";
  /** Agrupa por dia (títulos "Hoje · 14 de novembro de 2026"). */
  agruparPorDia?: boolean;
  /** Link para o registro de origem (RF-13); `undefined` = sem link. */
  hrefDe?: (atividade: Atividade) => string | undefined;
  /** Referência de "agora" (histórias e testes determinísticos). */
  agora?: Date;
  onTentarNovamente?: () => void;
  className?: string;
  /** Rótulo da lista para leitores de tela. */
  "aria-label"?: string;
};

function ItemSkeleton({ variante }: { variante: "timeline" | "feed" }) {
  return (
    <li className="flex gap-3">
      <Skeleton shape="circle" className={variante === "feed" ? "size-8" : "size-10"} />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="w-3/4" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </li>
  );
}

export function ActivityFeedSkeleton({ variante = "timeline" }: { variante?: "timeline" | "feed" }) {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando atividades">
      <ul className="flex flex-col gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <ItemSkeleton key={i} variante={variante} />
        ))}
      </ul>
    </div>
  );
}

function Item({
  atividade,
  autores,
  variante,
  href,
  agora,
  ultimo,
}: {
  atividade: Atividade;
  autores: Autores;
  variante: "timeline" | "feed";
  href?: string;
  agora?: Date;
  ultimo: boolean;
}) {
  const { titulo, detalhe } = textoAtividade(atividade);
  const compacto = variante === "feed";
  const titulo_: ReactNode = href ? (
    <Link
      href={href}
      className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {titulo}
    </Link>
  ) : (
    titulo
  );
  return (
    <li className={cn("relative flex gap-3", !compacto && !ultimo && "pb-6")}>
      {!compacto && !ultimo ? (
        <span aria-hidden="true" className="absolute top-10 bottom-0 left-5 w-px -translate-x-1/2 bg-border" />
      ) : null}
      <span
        aria-hidden="true"
        className={cn(
          "z-10 inline-flex shrink-0 items-center justify-center rounded-full bg-surface-warm text-text",
          compacto ? "size-8" : "size-10",
        )}
      >
        <Icon icon={ICONE_ATIVIDADE[atividade.tipo]} size={compacto ? 16 : 20} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className={cn("font-medium break-words text-text", compacto ? "text-sm" : "text-base")}>{titulo_}</p>
        {detalhe ? <p className="text-sm break-words text-text-muted">{detalhe}</p> : null}
        <p className="text-xs text-text-muted">
          {nomeDoAutor(autores, atividade.autorId)} ·{" "}
          <Instante iso={atividade.criadoEm} agora={agora} absoluta={!compacto} />
        </p>
      </div>
    </li>
  );
}

function tituloDoDia(dia: string, agora: Date | undefined): string {
  const rel = formatRelativo(dia, agora);
  const longa = formatData(dia, "longa");
  if (/^\d/.test(rel)) return longa; // mais de 30 dias: o relativo já é a própria data
  return `${rel[0]!.toUpperCase()}${rel.slice(1)} · ${longa}`;
}

/**
 * Lista de atividades com texto em pt-BR montado de `tipo` + `dados` (RF-13, RF-26, RF-34).
 * Só apresentação: não decide nada, só descreve o que o domínio registrou.
 */
export function ActivityFeed({
  estado,
  autores,
  variante = "timeline",
  agruparPorDia = false,
  hrefDe,
  agora,
  onTentarNovamente,
  className,
  "aria-label": ariaLabel = "Atividades",
}: ActivityFeedProps) {
  return (
    <div className={className}>
      <EstadoRecurso
        estado={estado}
        carregando={<ActivityFeedSkeleton variante={variante} />}
        estaVazio={(d) => d.length === 0}
        vazio={<EmptyState tamanho="compacto" ilustracao="semResultados" titulo="Nenhuma atividade ainda" />}
        erro={{ titulo: "Não foi possível carregar as atividades" }}
        onTentarNovamente={onTentarNovamente}
      >
        {(dados) => {
          const itens = (lista: readonly Atividade[]) => (
            <ol
              aria-label={agruparPorDia ? undefined : ariaLabel}
              className={cn("flex flex-col", variante === "feed" && "gap-4")}
            >
              {lista.map((a, i) => (
                <Item
                  key={a.id}
                  atividade={a}
                  autores={autores}
                  variante={variante}
                  href={hrefDe?.(a)}
                  agora={agora}
                  ultimo={i === lista.length - 1}
                />
              ))}
            </ol>
          );
          if (!agruparPorDia) return itens(dados);
          const grupos = new Map<string, Atividade[]>();
          for (const a of dados) {
            const dia = dataLocal(a.criadoEm);
            grupos.set(dia, [...(grupos.get(dia) ?? []), a]);
          }
          return (
            <div role="group" aria-label={ariaLabel} className="flex flex-col gap-6">
              {[...grupos].map(([dia, lista]) => (
                <section key={dia} aria-label={tituloDoDia(dia, agora)} className="flex flex-col gap-3">
                  <h3 className="text-sm font-medium text-text-muted">{tituloDoDia(dia, agora)}</h3>
                  {itens(lista)}
                </section>
              ))}
            </div>
          );
        }}
      </EstadoRecurso>
    </div>
  );
}
