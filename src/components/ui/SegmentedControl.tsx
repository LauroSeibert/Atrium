import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

const itemVariants = cva(
  [
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md font-regular whitespace-nowrap text-text-2",
    "transition-colors duration-(--dur-fast) ease-standard hover:text-text",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "data-[state=on]:bg-surface data-[state=on]:text-text data-[state=on]:shadow-1",
  ],
  {
    variants: { size: { sm: "h-6.5 px-2.5 text-caption", md: "h-9.5 px-3.5 text-caption" } },
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
 * Trilho quente sem borda e segmento selecionado em papel com a única sombra permitida.
 * Alturas: `md` = trilho 44 px com itens de 38 px; `sm` = trilho 32 px com itens de 26 px.
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
        "inline-flex items-center gap-0.5 rounded-md bg-bg-subtle p-0.75",
        size === "sm" ? "h-8" : "h-11",
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
