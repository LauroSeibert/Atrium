import { ArrowRight } from "lucide-react";
import type { RegistroAlteracao } from "@/domain";
import type { Recurso } from "@/lib/recurso";
import { Icon } from "../ui/Icon";
import { Skeleton } from "../ui/Skeleton";
import { nomeDoAutor, Instante, type Autores } from "./ActivityFeed";
import { EmptyState } from "./EmptyState";
import { EstadoRecurso } from "./EstadoRecurso";
import { rotuloCampo, textoValor } from "./textoHistorico";

export type ChangeLogProps = {
  estado: Recurso<readonly RegistroAlteracao[]>;
  autores: Autores;
  agora?: Date;
  onTentarNovamente?: () => void;
  className?: string;
};

export function ChangeLogSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando histórico">
      <ul className="flex flex-col gap-4">
        {Array.from({ length: 3 }, (_, i) => (
          <li key={i} className="flex flex-col gap-2">
            <Skeleton className="w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * "Histórico de alterações" (RF-65): quem alterou preço, status ou valor, quando e de quanto para quanto.
 * Simples e sem filtros. Valores formatados (R$, rótulo de status, data de pagamento).
 */
export function ChangeLog({ estado, autores, agora, onTentarNovamente, className }: ChangeLogProps) {
  return (
    <div className={className}>
      <EstadoRecurso
        estado={estado}
        carregando={<ChangeLogSkeleton />}
        estaVazio={(d) => d.length === 0}
        vazio={
          <EmptyState
            tamanho="compacto"
            titulo="Nenhuma alteração registrada"
            descricao="Mudanças de preço, status e valores aparecem aqui."
          />
        }
        erro={{ titulo: "Não foi possível carregar o histórico" }}
        onTentarNovamente={onTentarNovamente}
      >
        {(dados) => (
          <ol aria-label="Histórico de alterações" className="flex flex-col divide-y divide-border">
            {dados.map((r) => (
              <li key={r.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
                <p className="text-sm font-medium text-text">{rotuloCampo(r.campo)}</p>
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm break-words text-text">
                  <span className="text-text-muted">
                    <span className="sr-only">De </span>
                    {textoValor(r, r.de)}
                  </span>
                  <Icon icon={ArrowRight} size={16} />
                  <span className="sr-only">para</span>
                  <span className="font-medium">{textoValor(r, r.para)}</span>
                </p>
                <p className="text-xs text-text-muted">
                  {nomeDoAutor(autores, r.autorId)} · <Instante iso={r.em} agora={agora} absoluta />
                </p>
              </li>
            ))}
          </ol>
        )}
      </EstadoRecurso>
    </div>
  );
}
