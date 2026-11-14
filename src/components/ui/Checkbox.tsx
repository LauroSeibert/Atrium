"use client";

import type { ComponentProps, ReactNode } from "react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/cn";
import { useFieldControl } from "./Field";
import { Icon } from "./Icon";

export type CheckboxProps = Omit<ComponentProps<typeof CheckboxPrimitive.Root>, "children"> & {
  /** Rótulo ao lado da caixa. Sem ele, forneça `aria-label` ou use dentro de um `Field`. */
  label?: ReactNode;
  invalid?: boolean;
};

/** Caixa de seleção; `checked="indeterminate"` para seleção parcial (ex.: "selecionar todos"). */
export function Checkbox({ label, invalid, className, ...props }: CheckboxProps) {
  const control = useFieldControl({ ...props, invalid });
  const box = (
    <CheckboxPrimitive.Root
      {...props}
      id={control.id}
      aria-describedby={control["aria-describedby"]}
      aria-invalid={control["aria-invalid"]}
      className={cn(
        "group peer relative flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-sm border bg-surface text-on-primary",
        "transition duration-(--dur-fast) ease-standard",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "border-border-strong hover:bg-bg-subtle",
        "data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary",
        // Erro vence o estado marcado (maior especificidade).
        "aria-invalid:border-danger data-[state=checked]:aria-invalid:border-danger data-[state=indeterminate]:aria-invalid:border-danger",
        // Alvo mínimo de 24 px quando não há rótulo clicável.
        !label && "after:absolute after:-inset-1",
        className,
      )}
    >
      <CheckboxPrimitive.Indicator>
        <Icon icon={Check} size={16} className="hidden group-data-[state=checked]:block" />
        <Icon icon={Minus} size={16} className="hidden group-data-[state=indeterminate]:block" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
  if (!label) return box;
  return (
    <div className="flex min-h-6 items-center gap-2">
      {box}
      <label
        htmlFor={control.id}
        className="cursor-pointer text-sm text-text peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
      >
        {label}
      </label>
    </div>
  );
}
