import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/** Tecla de atalho, ex.: `<Kbd>⌘K</Kbd>`. */
export function Kbd({ className, ...props }: ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        "inline-flex h-6 min-w-6 items-center justify-center rounded-sm border border-border-strong bg-surface-warm px-2 text-xs text-text",
        className,
      )}
      {...props}
    />
  );
}
