import { z } from "zod";
import { contratoId, corretorId, documentoId, isoDataHora } from "../comum/tipos";

/** Documento do contrato (RF-76): só metadados; o arquivo fica no IndexedDB (`arquivoId`). */
export const TIPOS_DOCUMENTO = [
  "contratoAssinado",
  "documentoPessoal",
  "matricula",
  "certidao",
  "comprovante",
  "outro",
] as const;
export const tipoDocumento = z.enum(TIPOS_DOCUMENTO);
export type TipoDocumento = z.infer<typeof tipoDocumento>;

export const MIMES_DOCUMENTO = ["application/pdf", "image/jpeg", "image/png"] as const;
export const mimeDocumento = z.enum(MIMES_DOCUMENTO);
export type MimeDocumento = z.infer<typeof mimeDocumento>;
/** 10 MB. */
export const TAMANHO_MAXIMO_DOCUMENTO = 10 * 1024 * 1024;

export const documentoSchema = z.object({
  id: documentoId,
  contratoId,
  tipo: tipoDocumento,
  nome: z.string().min(1).max(255),
  mime: mimeDocumento,
  tamanho: z.int().positive().max(TAMANHO_MAXIMO_DOCUMENTO),
  /** Chave do arquivo no IndexedDB; `null` = exemplo do gerador (baixa um PDF de demonstração). */
  arquivoId: z.string().min(1).nullable(),
  enviadoPorId: corretorId,
  enviadoEm: isoDataHora,
});
export type Documento = z.infer<typeof documentoSchema>;
