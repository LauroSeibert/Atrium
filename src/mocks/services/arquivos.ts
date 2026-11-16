/**
 * Arquivos dos documentos (RF-76): o blob fica no IndexedDB `atrium-arquivos` (os metadados ficam
 * na Base). Sem IndexedDB (testes, modo privado restrito) cai para um Map em memória.
 */
const NOME_DB = "atrium-arquivos";
const LOJA = "arquivos";

const memoria = new Map<string, Blob>();
/** Conexão aberta com sucesso (falha não é guardada: a próxima chamada tenta de novo). */
let conexao: Promise<IDBDatabase | null> | null = null;

function abrir(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolver) => {
    try {
      const req = indexedDB.open(NOME_DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(LOJA);
      req.onsuccess = () => resolver(req.result);
      req.onerror = () => resolver(null);
      req.onblocked = () => resolver(null);
    } catch {
      resolver(null);
    }
  });
}

async function obterConexao(): Promise<IDBDatabase | null> {
  const atual = (conexao ??= abrir());
  const db = await atual;
  if (!db && conexao === atual) conexao = null; // não cacheia a falha
  return db;
}

/**
 * Roda `fn` numa transação. Escrita só conta como gravada no `oncomplete` (rejeita em `onerror`/`onabort`);
 * leitura resolve no sucesso do pedido. `undefined` = IndexedDB indisponível ou com erro (usa a memória).
 */
async function naLoja<T>(
  modo: IDBTransactionMode,
  fn: (loja: IDBObjectStore) => IDBRequest,
): Promise<{ valor: T } | undefined> {
  const db = await obterConexao();
  if (!db) return undefined;
  try {
    return await new Promise<{ valor: T }>((resolver, rejeitar) => {
      const tx = db.transaction(LOJA, modo);
      const req = fn(tx.objectStore(LOJA));
      let valor: T;
      req.onsuccess = () => {
        valor = req.result as T;
        if (modo === "readonly") resolver({ valor });
      };
      tx.oncomplete = () => resolver({ valor });
      tx.onerror = () => rejeitar(tx.error ?? req.error);
      tx.onabort = () => rejeitar(tx.error ?? new Error("Transação abortada"));
    });
  } catch {
    return undefined;
  }
}

/** `persistido: false` = ficou só na memória desta aba (some ao recarregar). */
export async function salvarArquivo(id: string, blob: Blob): Promise<{ persistido: boolean }> {
  memoria.set(id, blob);
  const r = await naLoja("readwrite", (l) => l.put(blob, id));
  return { persistido: r !== undefined };
}

export async function lerArquivo(id: string): Promise<Blob | null> {
  const salvo = await naLoja<Blob | undefined>("readonly", (l) => l.get(id));
  return salvo?.valor ?? memoria.get(id) ?? null;
}

export async function apagarArquivo(id: string): Promise<void> {
  memoria.delete(id);
  await naLoja("readwrite", (l) => l.delete(id));
}

/** "Restaurar dados de demonstração" (RF-51) também esvazia os arquivos. */
export async function limparArquivos(): Promise<void> {
  memoria.clear();
  await naLoja("readwrite", (l) => l.clear());
}

export function novoArquivoId(): string {
  const aleatorio =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  return `arq_${aleatorio}`;
}

/**
 * PDF mínimo (uma página, Helvetica, WinAnsi) com "Documento de demonstração" e o nome do arquivo:
 * é o que se baixa dos documentos de exemplo do gerador (`arquivoId: null`).
 */
export function pdfDemonstracao(nome: string): Blob {
  const texto = (s: string) =>
    [...s]
      .map((c) => (c.charCodeAt(0) > 0xff ? "?" : c))
      .join("")
      .replace(/[\\()]/g, (c) => `\\${c}`);
  const conteudo = [
    "BT /F1 20 Tf 72 760 Td (Documento de demonstração) Tj ET",
    `BT /F1 12 Tf 72 730 Td (${texto(nome)}) Tj ET`,
    "BT /F1 10 Tf 72 706 Td (Arquivo fictício gerado pelo Atrium; nenhum dado real.) Tj ET",
  ].join("\n");
  const objetos = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    `<< /Length ${conteudo.length} >>\nstream\n${conteudo}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objetos.forEach((o, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  // Latin-1: um byte por caractere (os offsets acima contam caracteres).
  const bytes = Uint8Array.from(pdf, (c) => c.charCodeAt(0));
  return new Blob([bytes], { type: "application/pdf" });
}
