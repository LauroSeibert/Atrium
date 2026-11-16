"use client";

import { useState, type ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { useFieldControl } from "./Field";

export type TextareaProps = ComponentProps<"textarea"> & {
  invalid?: boolean;
  /** Mostra contador "n/máx" quando há `maxLength`. */
  showCounter?: boolean;
};

/** Área de texto com no mínimo 3 linhas e contador de caracteres opcional. */
export function Textarea({
  invalid: invalidProp,
  showCounter = false,
  rows = 3,
  className,
  onChange,
  ...props
}: TextareaProps) {
  const control = useFieldControl({ ...props, invalid: invalidProp });
  const [typed, setTyped] = useState(String(props.defaultValue ?? "").length);
  const length = props.value !== undefined ? String(props.value).length : typed;
  const counterId = `${control.id}-counter`;
  const counter = showCounter && props.maxLength !== undefined;
  const describedBy =
    [control["aria-describedby"], counter ? counterId : undefined].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1">
      <textarea
        {...props}
        rows={rows}
        id={control.id}
        aria-describedby={describedBy}
        aria-invalid={control["aria-invalid"]}
        onChange={(event) => {
          setTyped(event.target.value.length);
          onChange?.(event);
        }}
        className={cn(
          "w-full resize-y rounded-md border bg-surface px-3 py-2 text-sm text-text placeholder:text-placeholder",
          "transition duration-(--dur-fast) ease-standard",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          control.invalid ? "border-danger" : "border-border-strong hover:bg-bg-subtle",
          className,
        )}
      />
      {counter ? (
        <p id={counterId} className="text-right text-xs text-text-muted">
          {length}/{props.maxLength}
        </p>
      ) : null}
    </div>
  );
}
