"use client";
/** FeatureChips: diferenciais do imóvel como chips; acima do limite, "+N" expansível (RF-24). */
import { useState } from "react";
import { cn } from "@/lib/cn";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

export type FeatureChipsProps = {
  diferenciais: string[];
  /** Quantos chips mostrar antes do "+N". */
  limite?: number;
  className?: string;
};

export function FeatureChips({ diferenciais, limite = 6, className }: FeatureChipsProps) {
  const [aberto, setAberto] = useState(false);
  if (diferenciais.length === 0) {
    return <p className="text-sm text-text-muted">Nenhum diferencial cadastrado.</p>;
  }
  const excedente = diferenciais.length - limite;
  const visiveis = aberto || excedente <= 0 ? diferenciais : diferenciais.slice(0, limite);
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <ul aria-label="Diferenciais" className="contents">
        {visiveis.map((d, i) => (
          <li key={`${d}-${i}`} className="min-w-0">
            <Badge className="h-auto max-w-full py-1 text-left whitespace-normal">{d}</Badge>
          </li>
        ))}
      </ul>
      {excedente > 0 ? (
        <Button
          variant="ghost"
          size="sm"
          aria-expanded={aberto}
          aria-label={aberto ? "Mostrar menos" : `Mostrar mais ${excedente} diferenciais`}
          onClick={() => setAberto((v) => !v)}
        >
          {aberto ? "Mostrar menos" : `+${excedente}`}
        </Button>
      ) : null}
    </div>
  );
}
