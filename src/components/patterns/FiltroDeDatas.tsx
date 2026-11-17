"use client";

import { CalendarDays } from "lucide-react";
import { formatData } from "@/lib/format";
import { Button } from "../ui/Button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/Popover";
import { IntervaloDeDatas } from "./IntervaloDeDatas";

export type FiltroDeDatasProps = {
  /** Nome do filtro (ex.: "Vencimento"): é o texto do botão enquanto nada está escolhido. */
  rotulo: string;
  /** Datas ISO (`aaaa-mm-dd`) ou vazio. */
  de: string;
  ate: string;
  onDeChange: (iso: string) => void;
  onAteChange: (iso: string) => void;
  onLimpar: () => void;
};

/**
 * Filtro de intervalo de datas direto na barra (listagem com poucos filtros): o botão mostra o próprio
 * intervalo quando há um ("01/12/26 → 15/12/26"), sem chip à parte e sem repetir o nome do filtro.
 * O Popover só tem os dois campos e "Limpar". Totalmente controlado.
 */
export function FiltroDeDatas({ rotulo, de, ate, onDeChange, onAteChange, onLimpar }: FiltroDeDatasProps) {
  const d = de ? formatData(de, "tabela") : "";
  const a = ate ? formatData(ate, "tabela") : "";
  const valor = d && a ? `${d} → ${a}` : d ? `desde ${d}` : a ? `até ${a}` : "";
  const acessivel = d && a ? `${rotulo}: de ${d} até ${a}` : valor ? `${rotulo}: ${valor}` : rotulo;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          size="lg"
          leadingIcon={CalendarDays}
          aria-label={acessivel}
          className={valor ? "num" : undefined}
        >
          {valor || rotulo}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="flex w-96 max-w-full flex-col gap-3">
        <IntervaloDeDatas
          rotulo={rotulo}
          rotuloOculto
          de={de}
          ate={ate}
          onDeChange={onDeChange}
          onAteChange={onAteChange}
        />
        {valor ? (
          <Button variant="link" className="self-start" onClick={onLimpar}>
            Limpar
          </Button>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
