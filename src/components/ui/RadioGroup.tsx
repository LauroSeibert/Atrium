"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import { RadioGroup as RadioPrimitive } from "radix-ui";
import { cn } from "@/lib/cn";
import { useFieldControl } from "./Field";

export type RadioGroupProps = ComponentProps<typeof RadioPrimitive.Root> & { invalid?: boolean };

/** Grupo de opções excludentes. Setas movem e selecionam; Tab entra/sai do grupo. */
export function RadioGroup({ invalid, className, ...props }: RadioGroupProps) {
  const control = useFieldControl({ ...props, invalid });
  return (
    <RadioPrimitive.Root
      {...props}
      id={control.id}
      aria-labelledby={props["aria-labelledby"] ?? control.labelId}
      aria-describedby={control["aria-describedby"]}
      aria-invalid={control["aria-invalid"]}
      className={cn("group/radio flex flex-col gap-2", className)}
    />
  );
}

export type RadioGroupItemProps = Omit<ComponentProps<typeof RadioPrimitive.Item>, "children"> & {
  label: ReactNode;
};

export function RadioGroupItem({ label, id, className, ...props }: RadioGroupItemProps) {
  const generated = useId();
  const itemId = id ?? generated;
  return (
    <div className="flex min-h-6 items-center gap-2">
      <RadioPrimitive.Item
        {...props}
        id={itemId}
        className={cn(
          "peer relative flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border-strong bg-surface",
          "transition duration-(--dur-fast) ease-standard hover:bg-bg-subtle",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          "disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary",
          // Erro do grupo vence o estado marcado.
          "group-aria-invalid/radio:border-danger group-aria-invalid/radio:data-[state=checked]:border-danger",
          // Alvo mínimo de 24 px além do rótulo clicável.
          "after:absolute after:-inset-1",
          className,
        )}
      >
        <RadioPrimitive.Indicator className="size-3 rounded-full bg-primary" />
      </RadioPrimitive.Item>
      <label
        htmlFor={itemId}
        className="cursor-pointer text-sm text-text peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
      >
        {label}
      </label>
    </div>
  );
}
