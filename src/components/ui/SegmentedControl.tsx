"use client";

import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

const itemVariants = cva(
  [
    "relative z-(--z-base) inline-flex cursor-pointer items-center justify-center gap-2 rounded-md font-regular whitespace-nowrap text-text-2",
    "transition-colors duration-(--dur-fast) ease-standard hover:text-text",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "data-[state=on]:text-text",
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
 * O papel do segmento selecionado é uma peça só que desliza até a nova opção (Fase 9: `--dur-base`,
 * `ease-standard`; com movimento reduzido, a guarda global zera a duração).
 */
export function SegmentedControl<T extends string>({
  value,
  onValueChange,
  options,
  size = "md",
  className,
  ...props
}: SegmentedControlProps<T>) {
  const trilho = useRef<HTMLDivElement>(null);
  const [peca, setPeca] = useState<{ x: number; w: number; animar: boolean } | null>(null);

  useLayoutEffect(() => {
    const el = trilho.current;
    if (!el) return;
    const medir = (animar: boolean) => {
      const ativo = el.querySelector<HTMLElement>('[data-state="on"]');
      setPeca(ativo ? { x: ativo.offsetLeft, w: ativo.offsetWidth, animar } : null);
    };
    medir(peca !== null);
    // Mudança de largura (fonte carregando, tela girando) reposiciona sem animar.
    const ro = new ResizeObserver(() => medir(false));
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- remede só quando a opção muda
  }, [value, options.length]);

  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={value}
      // Radix devolve "" ao clicar na opção ativa; ignoramos para o valor ser sempre obrigatório.
      onValueChange={(next) => {
        if (next) onValueChange(next as T);
      }}
      ref={trilho}
      aria-label={props["aria-label"]}
      className={cn(
        "relative inline-flex items-center gap-0.5 rounded-md bg-bg-subtle p-0.75",
        size === "sm" ? "h-8" : "h-11",
        className,
      )}
    >
      {peca ? (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute top-0.75 bottom-0.75 left-0 rounded-md bg-surface shadow-1",
            peca.animar && "transition-all duration-(--dur-base) ease-standard",
          )}
          style={{ width: peca.w, transform: `translateX(${peca.x}px)` }}
        />
      ) : null}
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
