import type { ReactNode } from "react";
import { Badge } from "../ui/Badge";
import { CartaoLinha, CartaoLinhaSkeleton } from "./CartaoLinha";
import type { Rotulado } from "./rotulos";

export type CartaoFinanceiroProps = {
  /** Linha principal (ex.: número do contrato, descrição da despesa). */
  titulo: string;
  /** Linha secundária (ex.: imóvel). */
  subtitulo?: string;
  /** Já derivado pelo domínio; o cartão só mostra. */
  status?: Rotulado;
  /** Pares rótulo/valor em grade de 2 colunas. */
  campos: { rotulo: string; valor: ReactNode }[];
  /** Ações do rodapé (ex.: "Registrar pagamento"). */
  acao?: ReactNode;
  className?: string;
};

/** Cartão de uma linha financeira (receita, despesa, comissão, repasse) para telas estreitas. */
export function CartaoFinanceiro({ titulo, subtitulo, status, campos, acao, className }: CartaoFinanceiroProps) {
  return (
    <CartaoLinha
      titulo={titulo}
      subtitulo={subtitulo}
      selo={
        status ? (
          <Badge tone={status.tom} dot>
            {status.rotulo}
          </Badge>
        ) : undefined
      }
      acao={acao}
      className={className}
    >
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {campos.map((c) => (
          <div key={c.rotulo} className="min-w-0">
            <dt className="text-text-muted">{c.rotulo}</dt>
            <dd className="tnum font-medium break-words text-text">{c.valor}</dd>
          </div>
        ))}
      </dl>
    </CartaoLinha>
  );
}

/** Esqueleto com a forma final do `CartaoFinanceiro`. */
export const CartaoFinanceiroSkeleton = CartaoLinhaSkeleton;
