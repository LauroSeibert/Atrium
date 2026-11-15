"use client";

import type { ComponentProps, ReactNode } from "react";
import { Switch as SwitchPrimitive } from "radix-ui";
import { cn } from "@/lib/cn";
import { useFieldControl } from "./Field";

export type SwitchProps = Omit<ComponentProps<typeof SwitchPrimitive.Root>, "children"> & {
  /** Rótulo ao lado do interruptor. Sem ele, use `aria-label` ou `Field`. */
  label?: ReactNode;
  /** Estado de erro (também herdado de `Field`). */
  invalid?: boolean;
};

/** Interruptor liga/desliga (Espaço alterna). */
export function Switch({ label, invalid, className, ...props }: SwitchProps) {
  const control = useFieldControl({ ...props, invalid });
  const root = (
    <SwitchPrimitive.Root
      {...props}
      id={control.id}
      aria-describedby={control["aria-describedby"]}
      aria-invalid={control["aria-invalid"]}
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-border-strong bg-surface-muted px-1",
        "transition duration-(--dur-fast) ease-standard",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary",
        "aria-invalid:border-danger data-[state=checked]:aria-invalid:border-danger",
        className,
      )}
    >
      <SwitchPrimitive.Thumb className="block size-4 translate-x-0 rounded-full bg-text shadow-1 transition duration-(--dur-fast) ease-standard data-[state=checked]:translate-x-4 data-[state=checked]:bg-on-primary motion-reduce:transition-none" />
    </SwitchPrimitive.Root>
  );
  if (!label) return root;
  return (
    <div className="flex min-h-6 items-center gap-3">
      {root}
      <label
        htmlFor={control.id}
        className="cursor-pointer text-sm text-text peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
      >
        {label}
      </label>
    </div>
  );
}
