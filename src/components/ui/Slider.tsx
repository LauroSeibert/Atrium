"use client";

import { useState, type ComponentProps } from "react";
import { Slider as SliderPrimitive } from "radix-ui";
import { cn } from "@/lib/cn";
import { formatMoeda } from "@/lib/format";
import { useFieldControl } from "./Field";

export type SliderProps = Omit<
  ComponentProps<typeof SliderPrimitive.Root>,
  "value" | "defaultValue" | "onValueChange"
> & {
  value?: number[];
  defaultValue?: number[];
  onValueChange?: (value: number[]) => void;
  /** `aria-label` de cada thumb, na ordem. */
  thumbLabels: string[];
  /** Formata o valor exibido e o `aria-valuetext`. */
  formatValue?: (value: number) => string;
  /** Esconde o texto com os valores atuais. */
  hideValues?: boolean;
};

/** Slider de um ou dois thumbs (faixa). Setas ajustam, Home/End vão aos extremos. */
export function Slider({
  value,
  defaultValue,
  onValueChange,
  thumbLabels,
  formatValue = String,
  hideValues = false,
  min = 0,
  max = 100,
  className,
  ...props
}: SliderProps) {
  const control = useFieldControl({ id: props.id });
  const [internal, setInternal] = useState(defaultValue ?? [min]);
  const current = value ?? internal;

  return (
    <div className="flex flex-col gap-3">
      {hideValues ? null : (
        <p className="text-sm font-medium text-text" aria-hidden="true">
          {current.map(formatValue).join(" – ")}
        </p>
      )}
      <SliderPrimitive.Root
        {...props}
        id={control.id}
        min={min}
        max={max}
        value={current}
        onValueChange={(next) => {
          setInternal(next);
          onValueChange?.(next);
        }}
        className={cn(
          "relative flex h-6 w-full touch-none items-center select-none data-disabled:cursor-not-allowed data-disabled:opacity-50",
          className,
        )}
      >
        <SliderPrimitive.Track className="relative h-2 grow rounded-full bg-surface-muted">
          <SliderPrimitive.Range className="absolute h-full rounded-full bg-primary" />
        </SliderPrimitive.Track>
        {current.map((v, i) => (
          <SliderPrimitive.Thumb
            key={i}
            aria-label={thumbLabels[i]}
            aria-valuetext={formatValue(v)}
            aria-describedby={control["aria-describedby"]}
            aria-invalid={control["aria-invalid"]}
            className={cn(
              "block size-6 cursor-grab rounded-full border-2 border-primary bg-surface shadow-1",
              "transition duration-(--dur-fast) ease-standard hover:bg-bg-subtle active:cursor-grabbing",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            )}
          />
        ))}
      </SliderPrimitive.Root>
    </div>
  );
}

export type FaixaPrecoProps = Omit<
  SliderProps,
  "thumbLabels" | "formatValue" | "value" | "defaultValue" | "onValueChange"
> & {
  /** Valores em reais inteiros: [mínimo, máximo]. */
  value?: [number, number];
  defaultValue?: [number, number];
  onValueChange?: (value: [number, number]) => void;
};

const moeda = (reais: number) => formatMoeda(reais * 100, { semCentavos: true });

/** Faixa de preço (dois thumbs) com valores em R$ via `formatMoeda`. */
export function FaixaPreco({ onValueChange, ...props }: FaixaPrecoProps) {
  return (
    <Slider
      {...props}
      onValueChange={(v) => onValueChange?.([v[0] ?? 0, v[1] ?? 0])}
      thumbLabels={["Preço mínimo", "Preço máximo"]}
      formatValue={moeda}
      minStepsBetweenThumbs={props.minStepsBetweenThumbs ?? 1}
    />
  );
}
