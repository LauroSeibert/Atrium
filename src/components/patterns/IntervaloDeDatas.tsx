"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";
import { DateInput } from "../ui/DateInput";

export type IntervaloDeDatasProps = {
  /** Rótulo único do grupo (ex.: "Vencimento"); os campos herdam o nome para leitor de tela. */
  rotulo: string;
  de: string;
  ate: string;
  onDeChange: (iso: string) => void;
  onAteChange: (iso: string) => void;
  /** Esconde o rótulo visualmente (ex.: quando o botão que abre o Popover já diz o nome do filtro). */
  rotuloOculto?: boolean;
};

/**
 * Intervalo de datas numa linha só: um rótulo, "de → até". A seta diz o que é cada campo, sem repetir
 * o nome do filtro duas vezes na tela (os nomes completos ficam para o leitor de tela).
 */
export function IntervaloDeDatas({
  rotulo,
  de,
  ate,
  onDeChange,
  onAteChange,
  rotuloOculto = false,
}: IntervaloDeDatasProps) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id} className="flex flex-col gap-2">
      <p id={id} className={cn("text-sm font-medium text-text", rotuloOculto && "sr-only")}>
        {rotulo}
      </p>
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <DateInput aria-label={`${rotulo} a partir de`} value={de} onValueChange={onDeChange} />
        </div>
        <span aria-hidden="true" className="text-text-muted">
          →
        </span>
        <div className="min-w-0 flex-1">
          <DateInput aria-label={`${rotulo} até`} value={ate} onValueChange={onAteChange} />
        </div>
      </div>
    </div>
  );
}
