import { Building2, FileText, Mail, Phone } from "lucide-react";
import type { ReactNode } from "react";
import { formatTelefone } from "@/lib/format";
import { Badge } from "../ui/Badge";
import { Icon } from "../ui/Icon";
import { CartaoLinha, CartaoLinhaSkeleton } from "./CartaoLinha";

export type ContatoCardProps = {
  nome: string;
  /** Já em texto (ex.: "Proprietário"). */
  papel: string;
  /** Só dígitos. */
  telefone?: string;
  email?: string;
  observacao?: string;
  qtdImoveis?: number;
  qtdContratos?: number;
  /** Ação do rodapé (ex.: botão "Editar"). */
  acao?: ReactNode;
  className?: string;
};

/** Card de contato (RF-74) para telas estreitas: nome, papel, telefone, e-mail e vínculos. */
export function ContatoCard({
  nome,
  papel,
  telefone,
  email,
  observacao,
  qtdImoveis = 0,
  qtdContratos = 0,
  acao,
  className,
}: ContatoCardProps) {
  return (
    <CartaoLinha
      titulo={nome}
      rotuloAcessivel={`Contato ${nome}`}
      selo={<Badge tone="neutral">{papel}</Badge>}
      acao={acao}
      className={className}
    >
      <ul className="flex flex-col gap-1 text-sm text-text">
        {telefone ? (
          <li className="flex items-center gap-2">
            <Icon icon={Phone} size={16} className="shrink-0 text-text-muted" />
            <span className="sr-only">Telefone: </span>
            <span className="num text-caption">{formatTelefone(telefone)}</span>
          </li>
        ) : null}
        {email ? (
          <li className="flex items-center gap-2">
            <Icon icon={Mail} size={16} className="shrink-0 text-text-muted" />
            <span className="sr-only">E-mail: </span>
            <span className="break-all">{email}</span>
          </li>
        ) : null}
        {qtdImoveis > 0 ? (
          <li className="flex items-center gap-2 text-text-muted">
            <Icon icon={Building2} size={16} className="shrink-0" />
            {qtdImoveis === 1 ? "1 imóvel" : `${qtdImoveis} imóveis`}
          </li>
        ) : null}
        {qtdContratos > 0 ? (
          <li className="flex items-center gap-2 text-text-muted">
            <Icon icon={FileText} size={16} className="shrink-0" />
            {qtdContratos === 1 ? "1 contrato" : `${qtdContratos} contratos`}
          </li>
        ) : null}
      </ul>
      {observacao ? <p className="line-clamp-3 text-sm break-words text-text-muted">{observacao}</p> : null}
    </CartaoLinha>
  );
}

/** Esqueleto com a forma final do `ContatoCard`. */
export function ContatoCardSkeleton({ className }: { className?: string }) {
  return <CartaoLinhaSkeleton className={className} />;
}
