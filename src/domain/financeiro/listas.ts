/**
 * Listas do Financeiro (RF-77, RF-79, RF-80): derivadas dos contratos, nunca armazenadas.
 * Mesmas regras de `statusParcela`, `podeRegistrarPagamento`, `repassesDoContrato` e da comissão.
 */
import type { Base } from "../comum/base";
import { dataLocal, type Permissao } from "../comum/tipos";
import { diasDeAtraso, repassesDoContrato, statusParcela, type LinhaRepasse } from "../contrato/derivados";
import { podeRegistrarPagamento, podeRegistrarPagamentoComissao, statusComissao } from "../contrato/estado";
import type { Contrato, StatusComissao, StatusParcela, TipoContrato } from "../contrato/schema";

type RefContrato = { contratoId: string; numeroContrato: string; tipo: TipoContrato; imovelId: string };
const ref = (c: Contrato): RefContrato => ({
  contratoId: c.id,
  numeroContrato: c.numero,
  tipo: c.tipo,
  imovelId: c.imovelId,
});

export type LinhaReceita = RefContrato & {
  numero: number;
  vencimento: string;
  valor: number;
  pagoEm: string | null;
  status: StatusParcela;
  diasAtraso: number;
  podePagar: Permissao;
};

/** RF-77: parcelas de todos os contratos assinados (rascunho ainda não tem cronograma valendo). */
export function linhasReceita(base: Pick<Base, "contratos">, hoje: string): LinhaReceita[] {
  return base.contratos
    .filter((c) => c.status !== "rascunho")
    .flatMap((c) =>
      c.parcelas.map((p) => ({
        ...ref(c),
        numero: p.numero,
        vencimento: p.vencimento,
        valor: p.valor,
        pagoEm: p.pagoEm,
        status: statusParcela(c, p, hoje),
        diasAtraso: diasDeAtraso(p, hoje),
        podePagar: podeRegistrarPagamento(c, p.numero),
      })),
    );
}

export type LinhaComissao = RefContrato & {
  /** Posição em `contrato.comissoes` (argumento de `registrarPagamentoComissao`). */
  indice: number;
  corretorId: string;
  percentual: number;
  base: number;
  valor: number;
  competencia: string;
  pagaEm: string | null;
  status: StatusComissao;
  podePagar: Permissao;
};

/** RF-79: comissões dos contratos ativos e encerrados (mesma regra das métricas de comissão). */
export function linhasComissao(base: Pick<Base, "contratos">): LinhaComissao[] {
  return base.contratos
    .filter((c) => c.status === "ativo" || c.status === "encerrado")
    .flatMap((c) =>
      c.comissoes.map((m, indice) => ({
        ...ref(c),
        indice,
        corretorId: m.corretorId,
        percentual: m.percentual,
        base: m.base,
        valor: m.valor,
        competencia: m.competencia,
        pagaEm: m.pagaEm,
        status: statusComissao(m),
        podePagar: podeRegistrarPagamentoComissao(c, indice),
      })),
    );
}

export type LinhaRepasseAgregada = RefContrato &
  LinhaRepasse & {
    /** Mês do pagamento do aluguel (`AAAA-MM`). */
    mes: string;
    taxaAdministracao: number;
  };

/** RF-80: repasses ao proprietário de todas as locações (um por aluguel pago; regra do RF-46). */
export function linhasRepasse(base: Pick<Base, "contratos">): LinhaRepasseAgregada[] {
  return base.contratos
    .filter((c) => c.status !== "rascunho")
    .flatMap((c) =>
      (repassesDoContrato(c) ?? []).map((r) => ({
        ...ref(c),
        ...r,
        mes: dataLocal(r.pagoEm).slice(0, 7),
        taxaAdministracao: c.taxaAdministracao ?? 0,
      })),
    );
}
