/**
 * Exportação CSV e PDF de contratos (RF-47, RF-49): só monta as linhas; escape, BOM e download vêm de `@/lib/csv`.
 * Vírgula decimal (Excel pt-BR).
 */
import { STATUS_CONTRATO_UI, TIPO_CONTRATO_ROTULO } from "@/components/patterns/rotulos";
import { montarCsv, reais } from "@/lib/csv";
import { formatData, formatMoeda } from "@/lib/format";
import type { LinhaContrato } from "./tipos";

const CABECALHO = [
  "Número",
  "Tipo",
  "Imóvel",
  "Partes",
  "Valor (R$)",
  "Início",
  "Fim",
  "Status",
  "Próximo vencimento",
] as const;

export function gerarCsv(linhas: LinhaContrato[]): string {
  return montarCsv(CABECALHO, linhasExportacao(linhas));
}

/** Linhas para PDF: mesmas colunas, valor formatado em reais. */
export function gerarLinhasPdf(linhas: LinhaContrato[]): { cabecalho: readonly string[]; linhas: string[][] } {
  return {
    cabecalho: CABECALHO.map((c) => (c === "Valor (R$)" ? "Valor" : c)),
    linhas: linhasExportacao(linhas).map((l, i) =>
      l.map((c, j) => (j === 4 ? formatMoeda(linhas[i]!.contrato.valor) : String(c))),
    ),
  };
}

function linhasExportacao(linhas: LinhaContrato[]) {
  return linhas.map((l) => [
    l.contrato.numero,
    TIPO_CONTRATO_ROTULO[l.contrato.tipo],
    l.imovel ? l.imovel.codigo : "",
    l.contrato.partes.map((p) => p.nome).join(" / "),
    reais(l.contrato.valor),
    formatData(l.contrato.inicio),
    formatData(l.contrato.fim),
    STATUS_CONTRATO_UI[l.statusExibicao].rotulo,
    l.proximoVencimento ? formatData(l.proximoVencimento.vencimento) : "",
  ]);
}
