import { useId } from "react";
import { AlertTriangle, Ban, CheckCircle2, Clock, type LucideIcon } from "lucide-react";
import type { Permissao } from "@/domain/comum/tipos";
import type { ResumoCronograma } from "@/domain/contrato/derivados";
import type { Parcela, StatusParcela } from "@/domain/contrato/schema";
import { cn } from "@/lib/cn";
import { formatData, formatMoeda } from "@/lib/format";
import type { Recurso } from "@/lib/recurso";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Skeleton } from "../ui/Skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/Table";
import { EmptyState } from "./EmptyState";
import { EstadoRecurso } from "./EstadoRecurso";
import { STATUS_PARCELA_UI } from "./rotulos";

/** Parcela já derivada pelo domínio (`statusParcela`, `diasDeAtraso`, `podeRegistrarPagamento`). */
export type ItemParcela = {
  parcela: Parcela;
  status: StatusParcela;
  diasAtraso: number;
  podeRegistrar: Permissao;
};

/** Estado da ação "Registrar pagamento" (um envio por vez). */
export type AcaoParcela =
  { fase: "idle" } | { fase: "enviando"; numero: number } | { fase: "erro"; numero: number; mensagem: string };

export type PaymentScheduleProps = {
  estado: Recurso<ItemParcela[]>;
  /** Resumo já calculado pelo domínio (`resumoCronograma`); o composto não soma nada. */
  resumo: ResumoCronograma;
  onTentarNovamente?: () => void;
  /** Emite a intenção; quem chama aplica `registrarPagamento` do domínio. */
  onRegistrarPagamento?: (numero: number) => void;
  acao?: AcaoParcela;
  className?: string;
};

const ICONE_STATUS: Record<StatusParcela, LucideIcon> = {
  pago: CheckCircle2,
  aVencer: Clock,
  atrasado: AlertTriangle,
  cancelada: Ban,
};

const textoAtraso = (dias: number) => `${dias} ${dias === 1 ? "dia" : "dias"} de atraso`;

function StatusBadge({ status }: { status: StatusParcela }) {
  const ui = STATUS_PARCELA_UI[status];
  return (
    <Badge tone={ui.tom} icon={ICONE_STATUS[status]}>
      {ui.rotulo}
    </Badge>
  );
}

type AcaoProps = {
  item: ItemParcela;
  /** Distingue os ids da lista (mobile) e da tabela, que coexistem no DOM. */
  prefixo?: string;
  acao: AcaoParcela;
  onRegistrarPagamento?: (numero: number) => void;
};

/** "Pago em …" (dado) ou o botão, desabilitado com o motivo visível quando o domínio nega. */
function AcaoDaParcela({ item, acao, onRegistrarPagamento, prefixo = "parcela" }: AcaoProps) {
  const { parcela, podeRegistrar } = item;
  const n = parcela.numero;
  if (parcela.pagoEm) {
    return <span className="tnum text-text-muted">Pago em {formatData(parcela.pagoEm)}</span>;
  }
  const enviando = acao.fase === "enviando" && acao.numero === n;
  const outraEnviando = acao.fase === "enviando" && acao.numero !== n;
  const erro = acao.fase === "erro" && acao.numero === n ? acao.mensagem : null;
  const motivoId = `${prefixo}-${n}-motivo`;
  const erroId = `${prefixo}-${n}-erro`;
  const negado = !podeRegistrar.ok;
  return (
    <div className="flex flex-col items-start gap-1 md:items-end">
      <Button
        size="sm"
        variant="secondary"
        loading={enviando}
        disabled={negado || outraEnviando}
        aria-label={`Registrar pagamento da parcela ${n}`}
        aria-describedby={negado ? motivoId : erro ? erroId : undefined}
        onClick={() => onRegistrarPagamento?.(n)}
      >
        Registrar pagamento
      </Button>
      {!podeRegistrar.ok ? (
        <span id={motivoId} className="text-xs text-text-muted">
          {podeRegistrar.motivo}
        </span>
      ) : null}
      {erro ? (
        <span id={erroId} role="alert" className="text-xs text-danger">
          {erro}
        </span>
      ) : null}
    </div>
  );
}

function Resumo({ resumo }: { resumo: ResumoCronograma }) {
  const { total, pagas, recebido, atrasadas, emAtraso } = resumo;
  return (
    <dl
      className="grid grid-cols-1 gap-x-8 gap-y-4 border-b border-border-soft pb-5 sm:grid-cols-3"
      aria-label="Resumo do cronograma"
    >
      <div>
        <dt className="eyebrow">Parcelas pagas</dt>
        <dd className="mt-1.5 num text-md text-text">
          {pagas} de {total}
        </dd>
      </div>
      <div>
        <dt className="eyebrow">Total recebido</dt>
        <dd className="mt-1.5 num text-md text-text">{formatMoeda(recebido)}</dd>
      </div>
      <div>
        <dt className={cn("eyebrow", atrasadas > 0 && "text-danger")}>Em atraso</dt>
        <dd className={cn("mt-1.5 num text-md", atrasadas > 0 ? "text-danger" : "text-text")}>
          {atrasadas === 0
            ? "Nenhuma"
            : `${atrasadas} ${atrasadas === 1 ? "parcela" : "parcelas"} · ${formatMoeda(emAtraso)}`}
        </dd>
      </div>
    </dl>
  );
}

function Cronograma({
  itens,
  resumo,
  acao,
  onRegistrarPagamento,
}: { itens: ItemParcela[]; resumo: ResumoCronograma } & Omit<AcaoProps, "item">) {
  const uid = useId();
  return (
    <div className="flex animate-fade-in flex-col gap-4">
      <Resumo resumo={resumo} />
      <p role="status" className="sr-only">
        {acao.fase === "enviando" ? `Registrando pagamento da parcela ${acao.numero}…` : ""}
      </p>

      {/* 360 px: lista empilhada. */}
      <ul aria-label="Parcelas" className="flex flex-col md:hidden">
        {itens.map((item) => (
          <li
            key={item.parcela.numero}
            className="flex flex-col gap-2 border-t border-border-soft py-4 first:border-t-0"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-md font-medium text-text">
                Parcela <span className="num">{item.parcela.numero}</span>
              </span>
              <StatusBadge status={item.status} />
            </div>
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="tnum text-text-muted">Vence em {formatData(item.parcela.vencimento)}</span>
              <span className={cn("num text-text", item.status === "atrasado" && "text-danger")}>
                {formatMoeda(item.parcela.valor)}
              </span>
            </div>
            {item.status === "atrasado" ? <p className="text-sm text-danger">{textoAtraso(item.diasAtraso)}</p> : null}
            <AcaoDaParcela
              item={item}
              acao={acao}
              onRegistrarPagamento={onRegistrarPagamento}
              prefixo={`${uid}-lista`}
            />
          </li>
        ))}
      </ul>

      {/* Telas largas: tabela. */}
      <div className="hidden md:block">
        <Table aria-label="Cronograma de parcelas">
          <TableHeader>
            <TableRow>
              <TableHead>Parcela</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead align="right">Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead align="right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {itens.map((item) => (
              <TableRow key={item.parcela.numero}>
                <TableCell className="tnum font-medium">{item.parcela.numero}</TableCell>
                <TableCell className="tnum">{formatData(item.parcela.vencimento)}</TableCell>
                <TableCell align="right" className={cn("num", item.status === "atrasado" && "text-danger")}>
                  {formatMoeda(item.parcela.valor)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={item.status} />
                    {item.status === "atrasado" ? (
                      <span className="text-xs text-danger">{textoAtraso(item.diasAtraso)}</span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell align="right" className="py-2">
                  <AcaoDaParcela
                    item={item}
                    acao={acao}
                    onRegistrarPagamento={onRegistrarPagamento}
                    prefixo={`${uid}-tabela`}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/** Esqueleto com a forma final do cronograma. */
export function PaymentScheduleSkeleton() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-busy="true" aria-label="Carregando cronograma">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Skeleton className="h-16" shape="rect" />
        <Skeleton className="h-16" shape="rect" />
        <Skeleton className="h-16" shape="rect" />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-12" shape="rect" />
        ))}
      </div>
    </div>
  );
}

/**
 * Cronograma de parcelas de um contrato com ação "Registrar pagamento" por parcela (RF-42, RF-43).
 * O status, os dias de atraso e a permissão chegam derivados do domínio; o composto só emite a intenção.
 */
export function PaymentSchedule({
  estado,
  resumo,
  onTentarNovamente,
  onRegistrarPagamento,
  acao = { fase: "idle" },
  className,
}: PaymentScheduleProps) {
  return (
    <div className={className}>
      <EstadoRecurso
        estado={estado}
        carregando={<PaymentScheduleSkeleton />}
        estaVazio={(d) => d.length === 0}
        vazio={<EmptyState ilustracao="semContratos" titulo="Sem parcelas" />}
        erro={{ titulo: "Não foi possível carregar as parcelas" }}
        onTentarNovamente={onTentarNovamente}
      >
        {(itens) => (
          <Cronograma itens={itens} resumo={resumo} acao={acao} onRegistrarPagamento={onRegistrarPagamento} />
        )}
      </EstadoRecurso>
    </div>
  );
}
