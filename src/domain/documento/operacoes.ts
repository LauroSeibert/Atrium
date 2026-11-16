/** Documentos do contrato (RF-76): sem máquina de estado (ESTADOS §3.11), mas com desfazer e Atividade. */
import type { Base } from "../comum/base";
import { transacao, type Mudanca } from "../comum/transacao";
import { DadosInvalidos, type Contexto } from "../comum/tipos";
import {
  MIMES_DOCUMENTO,
  TAMANHO_MAXIMO_DOCUMENTO,
  tipoDocumento,
  type Documento,
  type MimeDocumento,
  type TipoDocumento,
} from "./schema";

const POR_EXTENSAO: Record<string, MimeDocumento> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

/** Tipo do arquivo: o informado pelo navegador; se vier vazio, pela extensão. `null` = não aceito. */
export function mimeDoArquivo(nome: string, tipoInformado: string): MimeDocumento | null {
  const t = tipoInformado.toLowerCase();
  if ((MIMES_DOCUMENTO as readonly string[]).includes(t)) return t as MimeDocumento;
  if (t === "image/jpg") return "image/jpeg";
  if (t) return null;
  return POR_EXTENSAO[nome.split(".").pop()?.toLowerCase() ?? ""] ?? null;
}

/**
 * Valida o arquivo antes de gravar qualquer coisa (RF-76): PDF, JPG ou PNG, até 10 MB.
 * Lança `DadosInvalidos` (erro `validacao` no fakeApi) com a mensagem para o usuário.
 */
export function validarArquivoDocumento(arquivo: { nome: string; tipo: string; tamanho: number }): MimeDocumento {
  const mime = mimeDoArquivo(arquivo.nome, arquivo.tipo);
  if (!mime) throw new DadosInvalidos("Envie um arquivo PDF, JPG ou PNG.");
  if (arquivo.tamanho <= 0) throw new DadosInvalidos("O arquivo está vazio.");
  if (arquivo.tamanho > TAMANHO_MAXIMO_DOCUMENTO) throw new DadosInvalidos("O arquivo passa de 10 MB.");
  return mime;
}

export type NovoDocumento = {
  contratoId: string;
  tipo: TipoDocumento;
  nome: string;
  /** Tipo informado pelo navegador (`File.type`). */
  mime: string;
  tamanho: number;
  arquivoId: string | null;
};

/** Grava os metadados (o arquivo já foi salvo). Atividade `documentoAdicionado` no contrato. */
export function adicionarDocumento(base: Base, d: NovoDocumento, ctx: Contexto): Mudanca<Documento> {
  const mime = validarArquivoDocumento({ nome: d.nome, tipo: d.mime, tamanho: d.tamanho });
  const tipo = tipoDocumento.parse(d.tipo);
  return transacao(base, ctx, (t) => {
    t.get("contratos", d.contratoId);
    const doc = t.put("documentos", {
      id: t.novoId("doc"),
      contratoId: d.contratoId,
      tipo,
      nome: d.nome.trim().slice(0, 255) || "documento",
      mime,
      tamanho: d.tamanho,
      arquivoId: d.arquivoId,
      enviadoPorId: ctx.autorId,
      enviadoEm: ctx.agora,
    });
    t.atividade({
      tipo: "documentoAdicionado",
      alvo: { tipo: "contrato", id: d.contratoId },
      dados: { documentoId: doc.id, nome: doc.nome, tipo },
    });
    return doc;
  });
}

/** Remove só os metadados (o arquivo fica, para o Desfazer funcionar). Atividade `documentoRemovido`. */
export function removerDocumento(base: Base, documentoId: string, ctx: Contexto): Mudanca<Documento> {
  return transacao(base, ctx, (t) => {
    const doc = t.get("documentos", documentoId);
    t.remove("documentos", doc.id);
    t.atividade({
      tipo: "documentoRemovido",
      alvo: { tipo: "contrato", id: doc.contratoId },
      dados: { documentoId: doc.id, nome: doc.nome, tipo: doc.tipo },
    });
    return doc;
  });
}
