/** Exportação CSV do Financeiro (RF-77, RF-78): só monta as linhas; escape, BOM e download vêm de `@/lib/csv`. */
import {
  CATEGORIA_DESPESA_ROTULO,
  STATUS_DESPESA_UI,
  STATUS_PARCELA_UI,
  TIPO_CONTRATO_ROTULO,
} from "@/components/patterns/rotulos";
import { montarCsv, reais } from "@/lib/csv";
import { formatData } from "@/lib/format";
import type { LinhaDespesa, LinhaReceitaTela } from "./tipos";

export function gerarCsvReceitas(linhas: LinhaReceitaTela[]): string {
  return montarCsv(
    ["Contrato", "Tipo", "Imóvel", "Parcela", "Vencimento", "Valor (R$)", "Status", "Dias de atraso", "Pago em"],
    linhas.map((l) => [
      l.numeroContrato,
      TIPO_CONTRATO_ROTULO[l.tipo],
      l.imovel ? l.imovel.codigo : "",
      l.numero,
      formatData(l.vencimento),
      reais(l.valor),
      STATUS_PARCELA_UI[l.status].rotulo,
      l.diasAtraso,
      l.pagoEm ? formatData(l.pagoEm) : "",
    ]),
  );
}

export function gerarCsvDespesas(linhas: LinhaDespesa[]): string {
  return montarCsv(
    ["Descrição", "Categoria", "Contrato", "Vencimento", "Valor (R$)", "Status", "Paga em"],
    linhas.map((l) => [
      l.descricao,
      CATEGORIA_DESPESA_ROTULO[l.categoria],
      l.contrato ? l.contrato.numero : "",
      formatData(l.vencimento),
      reais(l.valor),
      STATUS_DESPESA_UI[l.status].rotulo,
      l.pagaEm ? formatData(l.pagaEm) : "",
    ]),
  );
}
