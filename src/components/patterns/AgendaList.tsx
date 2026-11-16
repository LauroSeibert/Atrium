import Link from "next/link";
import { dataLocal } from "@/domain";
import { cn } from "@/lib/cn";
import { formatData, formatRelativo } from "@/lib/format";
import type { Recurso } from "@/lib/recurso";
import { Skeleton } from "../ui/Skeleton";
import { EmptyState } from "./EmptyState";
import { EstadoRecurso } from "./EstadoRecurso";

/**
 * Próximos compromissos (RF-14): visitas e vencimentos agrupados por dia.
 * Só apresentação: quem chama monta `ItemAgenda` a partir do que o domínio devolveu.
 */
export type TipoItemAgenda = "visita" | "vencimento";

export type ItemAgenda = {
  id: string;
  tipo: TipoItemAgenda;
  /** Instante ISO (visita, com hora) ou data `AAAA-MM-DD` (vencimento, sem hora). */
  quando: string;
  titulo: string;
  detalhe?: string;
  /** Registro de origem; `undefined` = sem link. */
  href?: string;
};

export type AgendaListProps = {
  estado: Recurso<readonly ItemAgenda[]>;
  /** Referência de "agora" (histórias e testes determinísticos). */
  agora?: Date;
  onTentarNovamente?: () => void;
  className?: string;
  "aria-label"?: string;
};

const TIPO_ROTULO: Record<TipoItemAgenda, string> = { visita: "Visita", vencimento: "Vencimento" };

const hora = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
const temHora = (quando: string) => quando.length > 10;

function tituloDoDia(dia: string, agora: Date | undefined): string {
  const rel = formatRelativo(dia, agora);
  const longa = formatData(dia, "longa");
  if (/^\d/.test(rel)) return longa;
  return `${rel[0]!.toUpperCase()}${rel.slice(1)} · ${longa}`;
}

const diaSemana = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" });
/** "Seg" e "16" a partir de `AAAA-MM-DD` (calendário puro, sem fuso). */
function blocoDoDia(dia: string): { semana: string; numero: string } {
  const semana = diaSemana.format(new Date(`${dia}T12:00:00Z`)).replace(".", "");
  return { semana, numero: String(Number(dia.slice(8, 10))) };
}

export function AgendaListSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando compromissos">
      <ul className="flex flex-col gap-5">
        {Array.from({ length: 4 }, (_, i) => (
          <li key={i} className="flex gap-4">
            <Skeleton className="h-10 w-10" />
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

function Item({ item }: { item: ItemAgenda }) {
  const classeTitulo = "block truncate text-md font-medium text-text";
  return (
    <li className="group relative flex items-start gap-4 py-2">
      <span className="w-12 shrink-0 pt-0.5 num text-sm text-text-2">
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
        <p className="flex min-w-0 items-center gap-1.5 text-caption text-text-muted">
          <span className="shrink-0">{TIPO_ROTULO[item.tipo]}</span>
          {item.detalhe ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="tnum truncate">{item.detalhe}</span>
            </>
          ) : null}
        </p>
      </div>
    </li>
  );
}

/**
 * Lista de compromissos por dia (RF-14), com os cinco estados de tela (RNF-09). Cada dia é uma linha
 * com bloco de data (dia da semana + número em serifa) e os compromissos ao lado; o título do dia
 * completo fica para leitores de tela. A caixa (card) é de quem chama.
 */
export function AgendaList({
  estado,
  agora,
  onTentarNovamente,
  className,
  "aria-label": ariaLabel = "Próximos compromissos",
}: AgendaListProps) {
  return (
    <div className={cn("min-w-0", className)}>
      <EstadoRecurso
        estado={estado}
        carregando={<AgendaListSkeleton />}
        estaVazio={(d) => d.length === 0}
        vazio={
          <EmptyState tamanho="compacto" ilustracao="semResultados" titulo="Nenhum compromisso nos próximos dias" />
        }
        erro={{ titulo: "Não foi possível carregar os compromissos" }}
        onTentarNovamente={onTentarNovamente}
      >
        {(dados) => {
          const grupos = new Map<string, ItemAgenda[]>();
          for (const i of dados) {
            const dia = dataLocal(i.quando);
            grupos.set(dia, [...(grupos.get(dia) ?? []), i]);
          }
          return (
            <div role="group" aria-label={ariaLabel} className="flex animate-fade-in flex-col">
              {[...grupos].map(([dia, lista]) => {
                const { semana, numero } = blocoDoDia(dia);
                return (
                  <section
                    key={dia}
                    aria-label={tituloDoDia(dia, agora)}
                    className="flex gap-5 border-t border-border-soft py-5 first:border-t-0 first:pt-0 last:pb-0"
                  >
                    <h3 className="sr-only">{tituloDoDia(dia, agora)}</h3>
                    <div aria-hidden="true" className="flex w-10 shrink-0 flex-col items-start">
                      <span className="eyebrow">{semana}</span>
                      <span className="display text-3xl leading-display text-text">{numero}</span>
                    </div>
                    <ol className="flex min-w-0 flex-1 flex-col gap-1">
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
