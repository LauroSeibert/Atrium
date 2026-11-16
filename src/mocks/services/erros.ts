import { DadosInvalidos, OperacaoInvalida, TransicaoInvalida } from "@/domain";

/** Erros que o fakeApi devolve. `tipo` decide a mensagem e se "Tentar de novo" faz sentido. */
export type TipoErroApi = "rede" | "naoEncontrado" | "regra" | "validacao";

export class ErroApi extends Error {
  override readonly name = "ErroApi";
  constructor(
    readonly tipo: TipoErroApi,
    message: string,
    override readonly cause?: unknown,
  ) {
    super(message);
  }
  /** Falha de rede simulada: tentar de novo pode resolver. */
  get recuperavel() {
    return this.tipo === "rede";
  }
}

export function paraErroApi(e: unknown): ErroApi {
  if (e instanceof ErroApi) return e;
  if (e instanceof TransicaoInvalida || e instanceof OperacaoInvalida) {
    const tipo = /não encontrad/i.test(e.message) ? "naoEncontrado" : "regra";
    return new ErroApi(tipo, e.message, e);
  }
  if (e instanceof DadosInvalidos) return new ErroApi("validacao", e.message, e);
  if (e && typeof e === "object" && "issues" in e) return new ErroApi("validacao", "Dados inválidos.", e);
  return new ErroApi("rede", "Algo deu errado. Tente de novo.", e);
}
