/**
 * Máquina da Visita — RF-14, RF-37. `agendada` é o único estado não terminal.
 * Realizar a visita registra o imóvel em `imoveisVistos` do lead.
 */
import type { Base } from "../comum/base";
import { transacao, type Mudanca } from "../comum/transacao";
import { PERMITIDO, TransicaoInvalida, negar, OperacaoInvalida, type Contexto, type Permissao } from "../comum/tipos";
import { novaVisitaSchema, type NovaVisita, type StatusVisita, type Visita } from "./schema";

export const TRANSICOES_VISITA: Readonly<Record<StatusVisita, readonly StatusVisita[]>> = {
  agendada: ["realizada", "cancelada", "naoCompareceu"],
  realizada: [],
  cancelada: [],
  naoCompareceu: [],
};

export function podeTransicionarVisita(v: Visita, para: StatusVisita): Permissao {
  return TRANSICOES_VISITA[v.status].includes(para) ? PERMITIDO : negar("A visita já foi concluída.");
}

/** Ações que a UI pode oferecer para a visita (Agenda, RF-73). */
export function transicoesPermitidasVisita(v: Visita): { para: StatusVisita }[] {
  return TRANSICOES_VISITA[v.status].map((para) => ({ para }));
}

/** Agendar exige lead com ao menos uma negociação que não esteja `perdido` (ESTADOS §3.5). */
export function podeAgendarVisita(base: Pick<Base, "negociacoes">, leadId: string): Permissao {
  return base.negociacoes.some((n) => n.leadId === leadId && n.etapa !== "perdido")
    ? PERMITIDO
    : negar("Lead sem negociação ativa não agenda visita.");
}

export function agendarVisita(base: Base, dados: NovaVisita, ctx: Contexto): Mudanca<Visita> {
  const d = novaVisitaSchema.parse(dados);
  if (Date.parse(d.dataHora) < Date.parse(ctx.agora)) throw new OperacaoInvalida("A visita precisa ser no futuro.");
  return transacao(base, ctx, (t) => {
    t.get("leads", d.leadId);
    t.get("imoveis", d.imovelId);
    const p = podeAgendarVisita(base, d.leadId);
    if (!p.ok) throw new OperacaoInvalida(p.motivo);
    const v = t.put("visitas", { id: t.novoId("vis"), ...d, status: "agendada" });
    t.atividade({
      tipo: "visitaAgendada",
      alvo: { tipo: "lead", id: d.leadId },
      relacionados: [{ tipo: "imovel", id: d.imovelId }],
      dados: { visitaId: v.id, dataHora: d.dataHora },
    });
    return v;
  });
}

export function transicionarVisita(base: Base, visitaId: string, para: StatusVisita, ctx: Contexto) {
  return transacao(base, ctx, (t) => {
    const v = t.get("visitas", visitaId);
    const p = podeTransicionarVisita(v, para);
    if (!p.ok) throw new TransicaoInvalida("visita", v.status, para, p.motivo);
    const salva = t.put("visitas", { ...v, status: para });
    // "Visto" = visita realizada (mesma regra do gerador do mock).
    const lead = t.get("leads", v.leadId);
    if (para === "realizada" && !lead.imoveisVistos.includes(v.imovelId))
      t.put("leads", { ...lead, imoveisVistos: [...lead.imoveisVistos, v.imovelId] });
    if (para !== "naoCompareceu")
      t.atividade({
        tipo: para === "realizada" ? "visitaRealizada" : "visitaCancelada",
        alvo: { tipo: "lead", id: v.leadId },
        relacionados: [{ tipo: "imovel", id: v.imovelId }],
        dados: { visitaId: v.id },
      });
    return salva;
  });
}
