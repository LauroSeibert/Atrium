import { Info } from "lucide-react";
import type { ReactNode } from "react";
import type { Recurso } from "@/lib/recurso";
import { Icon } from "../ui/Icon";
import { ErrorState, type ErrorStateProps } from "./ErrorState";

export type EstadoRecursoProps<T> = {
  estado: Recurso<T>;
  /** Skeleton com a forma final (fase `idle`/`loading` sem dados). */
  carregando: ReactNode;
  /** Quando devolve `true`, mostra `vazio` em vez de `children`. */
  estaVazio?: (dados: T) => boolean;
  vazio?: ReactNode;
  /** Props do ErrorState (fase `error` sem dados). */
  erro?: Omit<ErrorStateProps, "onTentarNovamente">;
  onTentarNovamente?: () => void;
  children: (dados: T) => ReactNode;
};

/**
 * Renderiza os 5 estados de tela de um `Recurso<T>` (RNF-09, ESTADOS §3.6) a partir da união
 * discriminada — nunca de booleanos. `loading` com dados (refetch) e `error` com dados mantêm o
 * conteúdo visível; `partial` mostra o aviso acima dos dados.
 */
export function EstadoRecurso<T>({
  estado,
  carregando,
  estaVazio,
  vazio,
  erro,
  onTentarNovamente,
  children,
}: EstadoRecursoProps<T>) {
  const conteudo = (dados: T) => (estaVazio?.(dados) && vazio ? vazio : children(dados));
  switch (estado.fase) {
    case "idle":
      return <>{carregando}</>;
    case "loading":
      return estado.dados === undefined ? (
        <>{carregando}</>
      ) : (
        <div aria-busy="true" className="opacity-60 transition-opacity duration-(--dur-base) ease-standard">
          {conteudo(estado.dados)}
        </div>
      );
    case "success":
      return <>{conteudo(estado.dados)}</>;
    case "partial":
      return (
        <div className="flex flex-col gap-3">
          <p role="status" className="flex items-start gap-2 rounded-md bg-warning-bg px-3 py-2 text-sm text-warning">
            <Icon icon={Info} size={16} className="mt-0.5 shrink-0" />
            {estado.aviso}
          </p>
          {conteudo(estado.dados)}
        </div>
      );
    case "error":
      return estado.dados === undefined ? (
        <ErrorState tamanho="compacto" {...erro} onTentarNovamente={onTentarNovamente} />
      ) : (
        <div className="flex flex-col gap-3">
          <ErrorState
            tamanho="compacto"
            titulo="Não foi possível atualizar"
            descricao="Mostrando os últimos dados carregados."
            {...erro}
            onTentarNovamente={onTentarNovamente}
          />
          {conteudo(estado.dados)}
        </div>
      );
  }
}
