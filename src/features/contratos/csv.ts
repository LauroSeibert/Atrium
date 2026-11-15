/**
 * Exportação CSV de contratos gerada no navegador (RF-47, RF-49). Separador `;` e vírgula decimal
 * (Excel em pt-BR), BOM para acentuação e proteção contra fórmulas (`=`, `+`, `-`, `@`).
 */
import { formatData } from "@/lib/format";
import { STATUS_CONTRATO_UI, TIPO_CONTRATO_ROTULO } from "@/components/patterns/rotulos";
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

const reais = (centavos: number) => (centavos / 100).toFixed(2).replace(".", ",");

export function celulaCsv(valor: string): string {
  const seguro = /^[=+\-@\t\r]/.test(valor) ? `'${valor}` : valor;
  return /[;"\n\r]/.test(seguro) ? `"${seguro.replaceAll('"', '""')}"` : seguro;
}

export function gerarCsv(linhas: LinhaContrato[]): string {
  const corpo = linhas.map((l) =>
    [
      l.contrato.numero,
      TIPO_CONTRATO_ROTULO[l.contrato.tipo],
      l.imovel ? l.imovel.codigo : "",
      l.contrato.partes.map((p) => p.nome).join(" / "),
      reais(l.contrato.valor),
      formatData(l.contrato.inicio),
      formatData(l.contrato.fim),
      STATUS_CONTRATO_UI[l.statusExibicao].rotulo,
      l.proximoVencimento ? formatData(l.proximoVencimento.vencimento) : "",
    ]
      .map(celulaCsv)
      .join(";"),
  );
  return [CABECALHO.join(";"), ...corpo].join("\r\n");
}

/** Dispara o download no navegador (sem servidor). */
export function baixarCsv(nomeArquivo: string, csv: string): void {
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
