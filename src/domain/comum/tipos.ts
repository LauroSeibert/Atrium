import { z } from "zod";

/**
 * Tipos base do domínio (docs/MODELO-DE-DADOS.md, convenções):
 * IDs com prefixo, datas ISO 8601, dinheiro em centavos inteiros, áreas em m².
 */

export const centavos = z.int().nonnegative();
export type Centavos = z.infer<typeof centavos>;

/** Data e hora ISO 8601 com fuso (ex.: `2026-11-14T13:00:00.000Z`). */
export const isoDataHora = z.iso.datetime({ offset: true });
/** Data ISO sem hora (ex.: `2026-11-14`). */
export const isoData = z.iso.date();
/** Mês de competência `AAAA-MM`. */
export const mesRef = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use AAAA-MM");

export const idCom = <P extends string>(prefixo: P) =>
  z.string().regex(new RegExp(`^${prefixo}_[a-z0-9]+$`), `ID deve começar com ${prefixo}_`);

export const corretorId = idCom("cor");
export const imovelId = idCom("imv");
export const leadId = idCom("lead");
export const visitaId = idCom("vis");
export const contratoId = idCom("ctr");
export const atividadeId = idCom("atv");
export const alteracaoId = idCom("alt");
export const negociacaoId = idCom("neg");
export const contatoId = idCom("ctt");
export const anuncioId = idCom("anc");
export const documentoId = idCom("doc");
export const despesaId = idCom("dsp");

/**
 * Entidades que aparecem em `alvo`/`relacionados` de atividades e em registros de alteração.
 * Atividades usam imóvel, lead e contrato; `negociacao`, `anuncio` e `despesa` aparecem nos
 * registros de alteração (ESTADOS §4).
 */
export const tipoEntidade = z.enum(["imovel", "lead", "contrato", "negociacao", "anuncio", "despesa"]);
export type TipoEntidade = z.infer<typeof tipoEntidade>;
export const refEntidade = z.object({ tipo: tipoEntidade, id: z.string().min(1) });
export type RefEntidade = z.infer<typeof refEntidade>;

/** Quem fez e quando: toda operação de escrita do domínio recebe isto. */
export type Contexto = {
  autorId: string;
  /** Instante da operação (ISO). Injetado para testes determinísticos. */
  agora: string;
};

/** Transição recusada pelo domínio (regra 7 de ESTADOS-E-FLUXOS: falha alto). */
export class TransicaoInvalida extends Error {
  override readonly name = "TransicaoInvalida";
  constructor(
    readonly entidade: TipoEntidade | "visita",
    readonly de: string,
    readonly para: string,
    motivo: string,
  ) {
    super(motivo);
  }
}

/** Dado de entrada recusado pelo domínio com mensagem legível (ex.: arquivo grande demais). Vira erro `validacao`. */
export class DadosInvalidos extends Error {
  override readonly name = "DadosInvalidos";
}

/** Erro de pré-condição que não é transição (entidade inexistente, desfazer vencido…). */
export class OperacaoInvalida extends Error {
  override readonly name = "OperacaoInvalida";
}

/** Resposta de `pode…`: a UI mostra o motivo em vez de decidir sozinha (regra 3). */
export type Permissao = { ok: true } | { ok: false; motivo: string };
export const PERMITIDO: Permissao = { ok: true };
export const negar = (motivo: string): Permissao => ({ ok: false, motivo });

/** Data local `AAAA-MM-DD` de um ISO (fuso de São Paulo, como os formatadores). */
export function dataLocal(iso: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date(iso));
}
