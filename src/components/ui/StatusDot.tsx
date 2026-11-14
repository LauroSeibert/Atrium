import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

const dotVariants = cva("size-2 shrink-0 rounded-full", {
  variants: {
    tone: {
      neutral: "bg-text-muted",
      primary: "bg-primary",
      success: "bg-success",
      warning: "bg-warning",
      danger: "bg-danger",
      info: "bg-info",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export type StatusDotProps = ComponentProps<"span"> & VariantProps<typeof dotVariants>;

/** Ponto de status com rótulo visível (a cor nunca é o único sinal). */
export function StatusDot({ tone, className, children, ...props }: StatusDotProps) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm text-text", className)} {...props}>
      <span aria-hidden="true" className={dotVariants({ tone })} />
      {children}
    </span>
  );
}
