"use client";

import type { ComponentProps, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { useFieldControl } from "./Field";
import { Icon } from "./Icon";

export type InputProps = Omit<ComponentProps<"input">, "size" | "prefix"> & {
  size?: "md" | "lg";
  invalid?: boolean;
  leadingIcon?: LucideIcon;
  trailingIcon?: LucideIcon;
  /** Texto fixo antes do valor, ex.: "R$". */
  prefix?: ReactNode;
  /** Texto fixo depois do valor, ex.: "m²". */
  suffix?: ReactNode;
  wrapperClassName?: string;
};

export function inputShellClasses(invalid: boolean) {
  return cn(
    "flex w-full items-center gap-2 rounded-md border bg-surface px-3 text-text",
    "transition duration-(--dur-fast) ease-standard",
    "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring",
    "has-disabled:cursor-not-allowed has-disabled:opacity-50",
    invalid ? "border-danger" : "border-border-strong hover:border-text-muted",
  );
}

/** Campo de texto. Rótulo vem do `Field`; erro via `invalid` ou `Field error`. */
export function Input({
  size = "md",
  invalid: invalidProp,
  leadingIcon,
  trailingIcon,
  prefix,
  suffix,
  className,
  wrapperClassName,
  ...props
}: InputProps) {
  const control = useFieldControl({ ...props, invalid: invalidProp });
  return (
    <div
      className={cn(
        inputShellClasses(control.invalid),
        size === "lg" ? "h-11 text-base" : "h-11 text-sm",
        wrapperClassName,
      )}
    >
      {leadingIcon ? <Icon icon={leadingIcon} size={16} className="text-text-muted" /> : null}
      {prefix ? <span className="shrink-0 text-text-muted">{prefix}</span> : null}
      <input
        {...props}
        id={control.id}
        aria-describedby={control["aria-describedby"]}
        aria-invalid={control["aria-invalid"]}
        className={cn(
          "h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-placeholder disabled:cursor-not-allowed",
          className,
        )}
      />
      {suffix ? <span className="shrink-0 text-text-muted">{suffix}</span> : null}
      {trailingIcon ? <Icon icon={trailingIcon} size={16} className="text-text-muted" /> : null}
    </div>
  );
}
