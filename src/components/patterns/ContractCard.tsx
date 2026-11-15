import { CalendarClock } from "lucide-react";
import type { ReactNode } from "react";
import type { Parcela, Parte, StatusExibicaoContrato, TipoContrato } from "@/domain/contrato/schema";
import { cn } from "@/lib/cn";
import { formatData, formatDocumentoMascarado, formatMoeda } from "@/lib/format";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { Icon } from "../ui/Icon";
import { Skeleton } from "../ui/Skeleton";
import { STATUS_CONTRATO_UI, TIPO_CONTRATO_ROTULO } from "./rotulos";

const PAPEL_ROTULO: Record<Parte["papel"], string> = {
  comprador: "Comprador",
  vendedor: "Vendedor",
  locatario: "Locatário",
  locador: "Locador",
  fiador: "Fiador",
};

export type ContractCardProps = {
  numero: string;
  tipo: TipoContrato;
  imovel: { titulo: string; codigo: string };
  partes: Parte[];
  /** Valor em centavos. */
  valor: number;
  inicio: string;
  fim: string;
  /** Já derivado pelo domínio (`statusExibicao`); o card não decide inadimplência. */
  statusExibicao: StatusExibicaoContrato;
  /** Já derivado pelo domínio (`proximoVencimento`); `null` quando não há parcela em aberto. */
  proximoVencimento?: Pick<Parcela, "numero" | "vencimento" | "valor"> | null;
  /** Ação do rodapé (ex.: link "Abrir contrato"). */
  acao?: ReactNode;
  className?: string;
};

/** Card de contrato: número, tipo, imóvel, partes (documento mascarado), valor, vigência e status (RF-40, RF-41). */
export function ContractCard({
  numero,
  tipo,
  imovel,
  partes,
  valor,
  inicio,
  fim,
  statusExibicao,
  proximoVencimento,
  acao,
  className,
}: ContractCardProps) {
  const status = STATUS_CONTRATO_UI[statusExibicao];
  return (
    <Card
      variant="base"
      role="group"
      className={cn("flex flex-col gap-4 p-4", className)}
      aria-label={`Contrato ${numero}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm text-text-muted">{TIPO_CONTRATO_ROTULO[tipo]}</p>
          <h3 className="text-lg font-semibold break-words text-text">{numero}</h3>
        </div>
        <Badge tone={status.tom} dot>
          {status.rotulo}
        </Badge>
      </div>

      <p className="text-sm text-text">
        <span className="font-medium break-words">{imovel.titulo}</span>{" "}
        <span className="tnum text-text-muted">({imovel.codigo})</span>
      </p>

      <ul className="flex flex-col gap-1 text-sm" aria-label="Partes do contrato">
        {partes.map((p) => (
          <li key={`${p.papel}-${p.documento}`} className="flex flex-wrap gap-x-2">
            <span className="text-text-muted">{PAPEL_ROTULO[p.papel]}:</span>
            <span className="font-medium break-words text-text">{p.nome}</span>
            <span className="tnum text-text-muted">{formatDocumentoMascarado(p.documento)}</span>
          </li>
        ))}
      </ul>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <dt className="text-text-muted">Valor</dt>
          <dd className="tnum font-semibold text-text">{formatMoeda(valor)}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Vigência</dt>
          <dd className="tnum text-text">
            {formatData(inicio)} a {formatData(fim)}
          </dd>
        </div>
        {proximoVencimento ? (
          <div className="col-span-2">
            <dt className="flex items-center gap-1 text-text-muted">
              <Icon icon={CalendarClock} size={16} />
              Próximo vencimento
            </dt>
            <dd className="tnum text-text">
              {formatData(proximoVencimento.vencimento)} · parcela {proximoVencimento.numero} ·{" "}
              {formatMoeda(proximoVencimento.valor)}
            </dd>
          </div>
        ) : null}
      </dl>

      {acao ? <div className="flex justify-end">{acao}</div> : null}
    </Card>
  );
}

/** Esqueleto com a forma final do `ContractCard`. */
export function ContractCardSkeleton({ className }: { className?: string }) {
  return (
    <Card
      variant="base"
      role="group"
      className={cn("flex flex-col gap-4 p-4", className)}
      aria-busy="true"
      aria-label="Carregando contrato"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex w-1/2 flex-col gap-2">
          <Skeleton className="w-1/3" />
          <Skeleton className="h-6" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <Skeleton className="w-3/4" />
      <div className="flex flex-col gap-2">
        <Skeleton />
        <Skeleton className="w-5/6" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
    </Card>
  );
}
