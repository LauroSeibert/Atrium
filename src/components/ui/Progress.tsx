import { cva, type VariantProps } from "class-variance-authority";
import { Progress as ProgressPrimitive } from "radix-ui";
import { useId } from "react";
import { cn } from "@/lib/cn";

const barVariants = cva("size-full rounded-full transition-transform duration-(--dur-base) ease-standard", {
  variants: {
    tone: {
      primary: "bg-primary",
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
  };

/** Barra de progresso com rótulo e valor em texto. */
export function Progress({ value, label, tone, hideValue = false, className, ...props }: ProgressProps) {
  const labelId = useId();
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span id={labelId} className="font-medium text-text">
          {label}
        </span>
        {hideValue ? null : <span className="tnum text-text-muted">{Math.round(clamped)}%</span>}
      </div>
      <ProgressPrimitive.Root
        value={clamped}
        aria-labelledby={labelId}
        className="h-2 w-full overflow-hidden rounded-full bg-surface-warm"
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
