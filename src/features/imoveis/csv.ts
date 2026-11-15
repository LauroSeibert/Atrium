/** Exportação CSV de imóveis gerada no cliente (RF-49). Separador `;` e BOM para abrir direto no Excel pt-BR. */
import { FINALIDADE_ROTULO, STATUS_IMOVEL_UI, TIPO_IMOVEL_ROTULO } from "@/components/patterns/rotulos";
import type { Imovel } from "@/domain";

const CABECALHO = [
  "Código",
  "Título",
  "Tipo",
  "Finalidade",
  "Status",
  "Bairro",
  "Cidade",
  "Preço (R$)",
  "Área útil (m²)",
  "Quartos",
  "Vagas",
  "Corretor",
];

/** Aspas, separador e quebras escapados; células que iniciam fórmula ganham `'` (injeção de CSV). */
export function celulaCsv(valor: string | number): string {
  let t = String(valor);
  if (/^[=+\-@\t\r]/.test(t)) t = `'${t}`;
  return /[";\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
}

const decimal = (n: number) => String(n).replace(".", ",");

export function gerarCsvImoveis(imoveis: readonly Imovel[], nomeCorretor: (id: string) => string | undefined): string {
  const linhas = imoveis.map((i) =>
    [
      i.codigo,
      i.titulo,
      TIPO_IMOVEL_ROTULO[i.tipo],
      FINALIDADE_ROTULO[i.finalidade],
      STATUS_IMOVEL_UI[i.status].rotulo,
      i.endereco.bairro,
      i.endereco.cidade,
      (i.preco / 100).toFixed(2).replace(".", ","),
      decimal(i.areaUtil),
      i.quartos,
      i.vagas,
      nomeCorretor(i.corretorId) ?? "",
    ]
      .map(celulaCsv)
      .join(";"),
  );
  return `﻿${[CABECALHO.map(celulaCsv).join(";"), ...linhas].join("\r\n")}\r\n`;
}

export function baixarCsv(conteudo: string, nomeArquivo: string): void {
  const url = URL.createObjectURL(new Blob([conteudo], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
