import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/** tailwind-merge ciente dos nomes do nosso tema (cores, sombras e easings vêm dos tokens). */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      color: [
        "bg",
        "bg-subtle",
        "surface",
        "surface-raised",
        "surface-warm",
        "border",
        "border-strong",
        "text",
        "text-muted",
        "primary",
        "primary-hover",
        "on-primary",
        "ring",
        "accent-ochre",
        "success",
        "success-bg",
        "warning",
        "warning-bg",
        "danger",
        "danger-bg",
        "danger-hover",
        "on-danger",
        "info",
        "info-bg",
      ],
      shadow: ["1", "2", "3"],
      ease: ["standard", "enter", "exit", "spring"],
      leading: ["body", "heading"],
      "font-weight": ["regular"],
    },
  },
});

/** Junta classes condicionais e resolve conflitos do Tailwind (padrão shadcn/ui). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
