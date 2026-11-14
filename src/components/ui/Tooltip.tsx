import { Tooltip as TooltipPrimitive } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Provider global: monte UMA vez no layout da aplicação (ex.: `app/layout.tsx`), acima de qualquer `Tooltip`.
 * Atraso curto; tooltip nunca é a única forma de obter informação essencial.
 */
export function TooltipProvider({
  delayDuration = 300,
  skipDelayDuration = 150,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider delayDuration={delayDuration} skipDelayDuration={skipDelayDuration} {...props} />;
}

export type TooltipProps = {
  /** Texto curto. Informação essencial deve existir também na própria interface. */
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
};

/** Dica complementar ao foco/hover. O filho precisa ser focável (botão, link). Exige `TooltipProvider` acima na árvore. */
export function Tooltip({
  content,
  children,
  side = "top",
  align = "center",
  open,
  defaultOpen,
  onOpenChange,
  className,
}: TooltipProps) {
  return (
    <TooltipPrimitive.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          align={align}
          sideOffset={6}
          className={cn(
            "z-(--z-popover) max-w-xs rounded-sm border border-border bg-surface-raised px-3 py-1 text-xs text-text shadow-2",
            "data-[state=closed]:animate-fade-out data-[state=delayed-open]:animate-fade-in data-[state=instant-open]:animate-fade-in",
            className,
          )}
        >
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
