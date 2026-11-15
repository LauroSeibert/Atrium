/** CSV gerado no cliente (RF-47, RF-49): separador `;` e BOM para abrir direto no Excel pt-BR. */

/** Aspas, separador e quebras escapados; células que iniciam fórmula ganham `'` (injeção de CSV). */
export function celulaCsv(valor: string | number): string {
  let t = String(valor);
  if (/^[=+\-@\t\r]/.test(t)) t = `'${t}`;
  return /[";\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
}

/** Monta o arquivo: cabeçalho + linhas, CRLF e BOM. */
export function montarCsv(cabecalho: readonly string[], linhas: readonly (readonly (string | number)[])[]): string {
  const texto = [cabecalho, ...linhas].map((l) => l.map(celulaCsv).join(";")).join("\r\n");
  return `﻿${texto}\r\n`;
}

/** Baixa o CSV. A URL é revogada depois (revogar na hora cancela o download em Safari/Firefox). */
export function baixarCsv(nomeArquivo: string, conteudo: string): void {
  const url = URL.createObjectURL(new Blob([conteudo], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
