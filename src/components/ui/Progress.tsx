import type { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Progress as ProgressPrimitive } from "radix-ui";
import { useId } from "react";
import { cn } from "@/lib/cn";

const barVariants = cva("size-full rounded-full transition-transform duration-(--dur-base) ease-standard", {
  variants: {
    tone: {
      primary: "bg-accent",
      success: "bg-success",
      warning: "bg-warning",
      danger: "bg-danger",
    },
  },
  defaultVariants: { tone: "primary" },
});

export type ProgressProps = Omit<ProgressPrimitive.ProgressProps, "value" | "max"> &
  VariantProps<typeof barVariants> & {
    /** 0 a 100. */
    value: number;
    label: string;
    /** Esconde o texto de valor (ex.: "45%"). */
    hideValue?: boolean;
    /** Conteúdo extra à direita do rótulo, antes do valor (ex.: "R$ 77 mil de 195 mil"). */
    detalhe?: ReactNode;
    /** Rótulo só para leitores de tela (quando o contexto visual já diz o que é). */
    ocultarRotulo?: boolean;
  };

/** Barra de progresso com rótulo e valor em texto. */
export function Progress({
  value,
  label,
  tone,
  hideValue = false,
  detalhe,
  ocultarRotulo = false,
  className,
  ...props
}: ProgressProps) {
  const labelId = useId();
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className={cn("flex items-baseline justify-between gap-3 text-sm", ocultarRotulo && "sr-only")}>
        <span id={labelId} className="min-w-0 truncate font-medium text-text">
          {label}
        </span>
        {detalhe || !hideValue ? (
          <span className="flex shrink-0 items-baseline gap-2">
            {detalhe ? <span className="tnum text-xs text-text-muted">{detalhe}</span> : null}
            {hideValue ? null : <span className="tnum w-9 text-right text-text">{Math.round(clamped)}%</span>}
          </span>
        ) : null}
      </div>
      <ProgressPrimitive.Root
        value={clamped}
        aria-labelledby={labelId}
        className="h-1 w-full overflow-hidden rounded-full bg-surface-muted"
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={barVariants({ tone })}
          style={{ transform: `translateX(-${100 - clamped}%)` }}
        />
      </ProgressPrimitive.Root>
    </div>
  );
}
