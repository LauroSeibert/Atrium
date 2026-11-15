import { useId } from "react";
import { cn } from "@/lib/cn";
import type { Recurso } from "@/lib/recurso";
import { Card } from "../ui/Card";
import { EstadoRecurso } from "./EstadoRecurso";
import { StatCardSkeleton } from "./StatCard";

/**
 * Indicador simples (RF-44, RF-42): rótulo, valor já formatado e uma linha de detalhe, sem comparação
 * com período anterior. Para números que não têm série histórica (a receber, inadimplência, saldo do
 * contrato). O composto não calcula nada: recebe o texto pronto de quem chama.
 */
export type DadosIndicador = {
  valor: string;
  /** Linha de apoio, ex.: "3,2% das parcelas vencidas". */
  detalhe?: string;
  /** `alerta` pinta o valor com a cor de erro (cor nunca é o único sinal: o detalhe diz o que é). */
  tom?: "neutro" | "alerta";
};

export type IndicadorCardProps = {
  rotulo: string;
  estado: Recurso<DadosIndicador>;
  onTentarNovamente?: () => void;
  className?: string;
};

function Corpo({ rotulo, dados }: { rotulo: string; dados: DadosIndicador }) {
  const id = useId();
  return (
    <Card className="flex min-w-0 flex-col gap-2 p-4 sm:p-6" role="group" aria-labelledby={`${id}-r`}>
      <p id={`${id}-r`} className="text-sm font-medium text-text-muted">
        {rotulo}
      </p>
      <p
        className={cn(
          "tnum text-2xl font-semibold [overflow-wrap:anywhere]",
          dados.tom === "alerta" ? "text-danger" : "text-text",
        )}
      >
        {dados.valor}
      </p>
      {dados.detalhe ? <p className="text-sm text-text-muted">{dados.detalhe}</p> : null}
    </Card>
  );
}

export function IndicadorCard({ rotulo, estado, onTentarNovamente, className }: IndicadorCardProps) {
  return (
    <div className={cn("min-w-0", className)}>
      <EstadoRecurso
        estado={estado}
        carregando={<StatCardSkeleton />}
        erro={{ titulo: `Não foi possível carregar ${rotulo.toLowerCase()}` }}
        onTentarNovamente={onTentarNovamente}
      >
        {(dados) => <Corpo rotulo={rotulo} dados={dados} />}
      </EstadoRecurso>
    </div>
  );
}
