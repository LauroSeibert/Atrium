import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

const itemVariants = cva(
  [
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-sm font-medium whitespace-nowrap text-text-muted",
    "transition-colors duration-(--dur-fast) ease-standard hover:text-text",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "data-[state=on]:bg-surface data-[state=on]:text-text data-[state=on]:shadow-1 data-[state=on]:ring-1 data-[state=on]:ring-border-strong",
  ],
  {
    variants: { size: { sm: "h-6 px-2 text-sm", md: "h-8 px-3 text-sm" } },
    defaultVariants: { size: "md" },
  },
);

export type SegmentedOption<T extends string> = {
  value: T;
  label: ReactNode;
  icon?: LucideIcon;
  /** Esconde o texto visualmente (mantém para leitores de tela). Exige `icon`. */
  hideLabel?: boolean;
  disabled?: boolean;
};

export type SegmentedControlProps<T extends string> = {
  value: T;
  onValueChange: (value: T) => void;
  options: SegmentedOption<T>[];
  "aria-label": string;
  size?: "sm" | "md";
  className?: string;
};

/**
 * Escolha única obrigatória entre poucas opções (ex.: Grade | Lista).
 * Alturas: `md` = contêiner `h-10` (40 px) com itens `h-8`; `sm` = contêiner `h-8` (32 px) com itens `h-6` (24 px, alvo mínimo).
 */
export function SegmentedControl<T extends string>({
  value,
  onValueChange,
  options,
  size = "md",
  className,
  ...props
}: SegmentedControlProps<T>) {
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={value}
      // Radix devolve "" ao clicar na opção ativa; ignoramos para o valor ser sempre obrigatório.
      onValueChange={(next) => {
        if (next) onValueChange(next as T);
      }}
      aria-label={props["aria-label"]}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md border border-border bg-bg-subtle px-0.5",
        size === "sm" ? "h-8" : "h-10",
        className,
      )}
    >
      {options.map((option) => (
        <ToggleGroupPrimitive.Item
          key={option.value}
          value={option.value}
          disabled={option.disabled}
          className={itemVariants({ size })}
        >
          {option.icon ? <Icon icon={option.icon} size={16} /> : null}
          <span className={cn(option.hideLabel && option.icon && "sr-only")}>{option.label}</span>
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  );
}
