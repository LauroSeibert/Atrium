import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/cn";

export type SpinnerProps = {
  size?: 16 | 20 | 24;
  /** Texto para leitores de tela. Omita quando o contêiner já anuncia o carregamento (ex.: botão com aria-busy). */
  label?: string;
  className?: string;
};

const sizes = { 16: "size-4", 20: "size-5", 24: "size-6" } as const;

/** Indicador de carregamento. Continua girando com reduced-motion: é indicador essencial de status, não decoração. */
export function Spinner({ size = 20, label, className }: SpinnerProps) {
  return (
    <span role={label ? "status" : undefined} className={cn("inline-flex", className)}>
      <LoaderCircle strokeWidth={1.5} aria-hidden="true" data-giro=""
        className={cn(sizes[size], "animate-spin")} />
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}
