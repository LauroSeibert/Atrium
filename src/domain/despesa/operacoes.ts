/** Despesas (ESTADOS §3.9, RF-78): status derivado + lançar/editar e registrar pagamento, com desfazer. */
import type { Base } from "../comum/base";
import { transacao, type Mudanca } from "../comum/transacao";
import { dataLocal, OperacaoInvalida, PERMITIDO, negar, type Contexto, type Permissao } from "../comum/tipos";
import { dadosDespesaSchema, type DadosDespesa, type Despesa, type StatusDespesa } from "./schema";

/** `paga` se tem `pagaEm`; `atrasada` se hoje > vencimento; senão `aVencer`. `hoje` = ISO (relógio do mock). */
export function statusDespesa(d: Pick<Despesa, "pagaEm" | "vencimento">, hoje: string): StatusDespesa {
  if (d.pagaEm) return "paga";
  return dataLocal(hoje) > d.vencimento ? "atrasada" : "aVencer";
}

export function podeEditarDespesa(d: Pick<Despesa, "pagaEm">): Permissao {
  return d.pagaEm ? negar("Despesa paga não pode ser editada.") : PERMITIDO;
}

export function podePagarDespesa(d: Pick<Despesa, "pagaEm">): Permissao {
  return d.pagaEm ? negar("Despesa já paga.") : PERMITIDO;
}

/** Lança (sem `id`) ou edita (com `id`, só se não paga). Contrato, se informado, precisa existir. */
export function salvarDespesa(base: Base, dados: DadosDespesa & { id?: string }, ctx: Contexto): Mudanca<Despesa> {
  const d = dadosDespesaSchema.parse(dados);
  return transacao(base, ctx, (t) => {
    if (d.contratoId !== null) t.get("contratos", d.contratoId);
    if (!dados.id)
      return t.put("despesas", {
        ...d,
        id: t.novoId("dsp"),
        pagaEm: null,
        criadoEm: ctx.agora,
        atualizadoEm: ctx.agora,
      });
    const atual = t.get("despesas", dados.id);
    const p = podeEditarDespesa(atual);
    if (!p.ok) throw new OperacaoInvalida(p.motivo);
    return t.put("despesas", { ...atual, ...d });
  });
}

/** Alias de criação (RF-78 "lançar despesa"). */
export const lancarDespesa = (base: Base, dados: DadosDespesa, ctx: Contexto) => salvarDespesa(base, dados, ctx);

/** Grava `pagaEm` (registro de alteração via transação); com contrato, Atividade `despesaPaga` nele. */
export function registrarPagamentoDespesa(base: Base, despesaId: string, ctx: Contexto): Mudanca<Despesa> {
  return transacao(base, ctx, (t) => {
    const d = t.get("despesas", despesaId);
    const p = podePagarDespesa(d);
    if (!p.ok) throw new OperacaoInvalida(p.motivo);
    const salva = t.put("despesas", { ...d, pagaEm: ctx.agora });
    // Com contrato, aparece na linha do tempo do contrato; avulsa, a própria despesa é o alvo.
    t.atividade({
      tipo: "despesaPaga",
      alvo: d.contratoId ? { tipo: "contrato", id: d.contratoId } : { tipo: "despesa", id: d.id },
      relacionados: d.contratoId ? [{ tipo: "despesa", id: d.id }] : [],
      dados: { despesaId: d.id, descricao: d.descricao, valor: d.valor },
    });
    return salva;
  });
}
