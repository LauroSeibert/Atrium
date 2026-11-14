"use client";

import { createContext, useContext } from "react";
import type { ComponentProps } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

export type TableDensity = "comfortable" | "compact";
const DensityContext = createContext<TableDensity>("comfortable");

const rowHeight = { comfortable: "h-12", compact: "h-9" } as const;

export type TableProps = ComponentProps<"table"> & {
  /** Nome da região rolável (obrigatório: a tabela rola por teclado). */
  "aria-label": string;
  density?: TableDensity;
  /** Classes do contêiner com rolagem. */
  containerClassName?: string;
};

/** Tabela dentro de uma região rolável e focável (WCAG 2.1.1). Linhas 48 px (confortável) ou 36 px (compacta). */
export function Table({
  "aria-label": ariaLabel,
  density = "comfortable",
  className,
  containerClassName,
  ...props
}: TableProps) {
  return (
    <DensityContext.Provider value={density}>
      <div
        role="region"
        aria-label={ariaLabel}
        tabIndex={0}
        className={cn(
          "w-full overflow-x-auto rounded-md border border-border bg-surface",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          containerClassName,
        )}
      >
        <table className={cn("w-full caption-bottom border-collapse text-sm text-text", className)} {...props} />
      </div>
    </DensityContext.Provider>
  );
}

export function TableCaption({ className, ...props }: ComponentProps<"caption">) {
  return <caption className={cn("px-4 py-3 text-left text-sm text-text-muted", className)} {...props} />;
}

export function TableHeader({ className, ...props }: ComponentProps<"thead">) {
  return <thead className={cn("sticky top-0 z-(--z-sticky) bg-bg-subtle", className)} {...props} />;
}

export function TableBody({ className, ...props }: ComponentProps<"tbody">) {
  return <tbody className={cn("[&>tr:last-child]:border-b-0", className)} {...props} />;
}

export function TableRow({ className, ...props }: ComponentProps<"tr">) {
  return (
    <tr
      className={cn(
        "border-b border-border transition-colors duration-(--dur-fast) ease-standard hover:bg-bg-subtle",
        "data-[state=selected]:bg-surface-warm",
        className,
      )}
      {...props}
    />
  );
}

export type SortDirection = "ascending" | "descending" | "none";

export type TableHeadProps = Omit<ComponentProps<"th">, "aria-sort"> & {
  align?: "left" | "right";
  /** Torna o cabeçalho ordenável: renderiza um botão. */
  sortable?: boolean;
  sortDirection?: SortDirection;
  /** Recebe a próxima direção (none/descending → ascending; ascending → descending). */
  onSortChange?: (next: Exclude<SortDirection, "none">) => void;
};

export function TableHead({
  align = "left",
  sortable = false,
  sortDirection = "none",
  onSortChange,
  className,
  children,
  scope = "col",
  ...props
}: TableHeadProps) {
  const density = useContext(DensityContext);
  const sortIcon =
    sortDirection === "ascending" ? ArrowUp : sortDirection === "descending" ? ArrowDown : ChevronsUpDown;
  return (
    <th
      scope={scope}
      aria-sort={sortable ? sortDirection : undefined}
      className={cn(
        "border-b border-border px-4 text-sm font-medium whitespace-nowrap text-text-muted",
        rowHeight[density],
        align === "right" ? "text-right" : "text-left",
        className,
      )}
      {...props}
    >
      {sortable ? (
        <button
          type="button"
          onClick={() => onSortChange?.(sortDirection === "ascending" ? "descending" : "ascending")}
          className={cn(
            "inline-flex min-h-6 cursor-pointer items-center gap-1 rounded-sm font-medium hover:text-text",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            align === "right" && "flex-row-reverse",
          )}
        >
          {children}
          <Icon icon={sortIcon} size={16} className={cn(sortDirection === "none" && "opacity-50")} />
        </button>
      ) : (
        children
      )}
    </th>
  );
}

export function TableCell({
  align = "left",
  className,
  ...props
}: ComponentProps<"td"> & { align?: "left" | "right" }) {
  const density = useContext(DensityContext);
  return (
    <td
      className={cn("px-4", rowHeight[density], align === "right" ? "tnum text-right" : "text-left", className)}
      {...props}
    />
  );
}
