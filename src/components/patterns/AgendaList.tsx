import { Banknote, CalendarClock, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { dataLocal } from "@/domain";
import { cn } from "@/lib/cn";
import { formatData, formatRelativo } from "@/lib/format";
import type { Recurso } from "@/lib/recurso";
import { Badge } from "../ui/Badge";
import { Icon } from "../ui/Icon";
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

const TIPO_UI: Record<TipoItemAgenda, { rotulo: string; icone: LucideIcon }> = {
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

export function AgendaListSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando compromissos">
      <ul className="flex flex-col gap-4">
        {Array.from({ length: 4 }, (_, i) => (
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

function Item({ item }: { item: ItemAgenda }) {
  const ui = TIPO_UI[item.tipo];
  const titulo = item.href ? (
    <Link
      href={item.href}
      className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {item.titulo}
    </Link>
  ) : (
    item.titulo
  );
  return (
    <li className="flex gap-3">
      <span
        aria-hidden="true"
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-warm text-text"
      >
        <Icon icon={ui.icone} size={16} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-sm font-medium break-words text-text">{titulo}</p>
        {item.detalhe ? <p className="text-sm break-words text-text-muted">{item.detalhe}</p> : null}
        <p className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
          <Badge size="sm" tone={item.tipo === "visita" ? "info" : "neutral"}>
            {ui.rotulo}
          </Badge>
          {temHora(item.quando) ? <time dateTime={item.quando}>{hora.format(new Date(item.quando))}</time> : null}
        </p>
      </div>
    </li>
  );
}

/** Lista de compromissos por dia (RF-14), com os cinco estados de tela (RNF-09). */
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
          <EmptyState
            tamanho="compacto"
            ilustracao="semResultados"
            titulo="Nenhum compromisso nos próximos dias"
            descricao="Visitas agendadas e vencimentos aparecem aqui."
          />
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
            <div role="group" aria-label={ariaLabel} className="flex flex-col gap-6">
              {[...grupos].map(([dia, lista]) => (
                <section key={dia} aria-label={tituloDoDia(dia, agora)} className="flex flex-col gap-3">
                  <h3 className="text-sm font-medium text-text-muted">{tituloDoDia(dia, agora)}</h3>
                  <ol className="flex flex-col gap-4">
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
