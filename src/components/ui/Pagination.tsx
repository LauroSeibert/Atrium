import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

type PageItem = number | "ellipsis-start" | "ellipsis-end";

/** Páginas visíveis: primeira, última, vizinhas da atual e reticências. */
export function getPageItems(page: number, pageCount: number): PageItem[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, "ellipsis-end", pageCount];
  if (page >= pageCount - 3) {
    return [1, "ellipsis-start", ...Array.from({ length: 5 }, (_, i) => pageCount - 4 + i)];
  }
  return [1, "ellipsis-start", page - 1, page, page + 1, "ellipsis-end", pageCount];
}

export type PaginationProps = {
  /** Página atual (começa em 1). */
  page: number;
  pageCount: number;
  onPageChange?: (page: number) => void;
  /** Gera o href de cada página; renderiza links em vez de botões. */
  hrefBuilder?: (page: number) => string;
  /** Com `pageSize` e `total`, exibe "Mostrando 1–12 de 48". */
  pageSize?: number;
  total?: number;
  className?: string;
};

const itemClasses = cn(
  "tnum inline-flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-md px-2 text-sm font-medium text-text",
  "transition-colors duration-(--dur-fast) ease-standard hover:bg-bg-subtle",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
);
const disabledClasses = "pointer-events-none cursor-not-allowed opacity-50";

export function Pagination({
  page,
  pageCount,
  onPageChange,
  hrefBuilder,
  pageSize,
  total,
  className,
}: PaginationProps) {
  const current = Math.min(Math.max(page, 1), Math.max(pageCount, 1));

  const control = (
    target: number,
    content: ReactNode,
    opts: { label?: string; disabled?: boolean; active?: boolean },
  ) => {
    const { label, disabled = false, active = false } = opts;
    const cls = cn(itemClasses, active && "bg-primary text-on-primary hover:bg-primary", disabled && disabledClasses);
    const common = { className: cls, "aria-label": label, "aria-current": active ? ("page" as const) : undefined };
    if (hrefBuilder) {
      return disabled ? (
        <span {...common} aria-disabled="true">
          {content}
        </span>
      ) : (
        <a {...common} href={hrefBuilder(target)}>
          {content}
        </a>
      );
    }
    return (
      <button type="button" {...common} disabled={disabled} onClick={() => onPageChange?.(target)}>
        {content}
      </button>
    );
  };

  const summary =
    pageSize && total !== undefined
      ? total === 0
        ? "Nenhum resultado"
        : `Mostrando ${(current - 1) * pageSize + 1}–${Math.min(current * pageSize, total)} de ${total}`
      : null;

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      {summary ? <p className="tnum text-sm text-text-muted">{summary}</p> : <span />}
      <nav aria-label="Paginação">
        <ul className="flex items-center gap-1">
          <li>
            {control(current - 1, <Icon icon={ChevronLeft} size={16} />, {
              label: "Página anterior",
              disabled: current <= 1,
            })}
          </li>
          {getPageItems(current, pageCount).map((item) =>
            typeof item === "number" ? (
              <li key={item}>{control(item, item, { label: `Página ${item}`, active: item === current })}</li>
            ) : (
              <li key={item} aria-hidden="true" className="px-1 text-text-muted">
                …
              </li>
            ),
          )}
          <li>
            {control(current + 1, <Icon icon={ChevronRight} size={16} />, {
              label: "Próxima página",
              disabled: current >= pageCount,
            })}
          </li>
        </ul>
      </nav>
    </div>
  );
}
