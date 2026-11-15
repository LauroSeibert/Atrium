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

export function agendarVisita(base: Base, dados: NovaVisita, ctx: Contexto): Mudanca<Visita> {
  const d = novaVisitaSchema.parse(dados);
  if (Date.parse(d.dataHora) < Date.parse(ctx.agora)) throw new OperacaoInvalida("A visita precisa ser no futuro.");
  return transacao(base, ctx, (t) => {
    const lead = t.get("leads", d.leadId);
    t.get("imoveis", d.imovelId);
    if (lead.etapa === "perdido") throw new OperacaoInvalida("Lead perdido não agenda visita.");
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
