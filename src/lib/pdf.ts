/**
 * PDF de tabela gerado no cliente (RF-47, RF-49): paisagem A4, título, data de emissão e a tabela.
 * jsPDF é carregado só no clique (não pesa no carregamento da tela). Monocromático: o arquivo é para
 * imprimir e arquivar, não segue o tema da tela.
 */
export async function baixarPdfTabela(
  nomeArquivo: string,
  titulo: string,
  cabecalho: readonly string[],
  linhas: readonly (readonly (string | number)[])[],
): Promise<void> {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(titulo, 40, 48);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text(
    `Emitido em ${new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })} · ${linhas.length} ${linhas.length === 1 ? "linha" : "linhas"}`,
    40,
    64,
  );
  autoTable(doc, {
    startY: 80,
    head: [cabecalho.map(String)],
    body: linhas.map((l) => l.map(String)),
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 5,
      textColor: 30,
      lineColor: 220,
      lineWidth: { bottom: 0.5 },
    },
    headStyles: { fontStyle: "bold", textColor: 90, fillColor: 245 },
    margin: { left: 40, right: 40 },
  });
  doc.save(nomeArquivo);
}
