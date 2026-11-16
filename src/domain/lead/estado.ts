/**
 * Operações do Lead (a pessoa) — RF-33…35. A etapa é da Negociação (`../negociacao/estado.ts`);
 * aqui ficam criação (lead + 1ª negociação na mesma transação), orçamento e notas.
 */
import type { Base } from "../comum/base";
import { transacao, type Mudanca } from "../comum/transacao";
import { centavos, OperacaoInvalida, type Contexto } from "../comum/tipos";
import { criarNegociacaoEm } from "../negociacao/estado";
import { novoLeadSchema, type Lead, type NovoLead } from "./schema";

/** Criação rápida (RF-35): cria o lead e a primeira negociação (em `novo`, imóvel opcional) atomicamente. */
export function criarLead(base: Base, dados: NovoLead, ctx: Contexto): Mudanca<Lead> {
  const d = novoLeadSchema.parse(dados);
  return transacao(base, ctx, (t) => {
    const lead = t.put("leads", {
      id: t.novoId("lead"),
      nome: d.nome,
      contato: d.contato,
      origem: d.origem,
      interesse: d.interesse ?? { finalidade: "venda", tipos: [], bairros: [] },
      orcamento: d.orcamento ?? null,
      imoveisVistos: [],
      responsavelId: d.responsavelId,
      criadoEm: ctx.agora,
      atualizadoEm: ctx.agora,
    });
    criarNegociacaoEm(t, { leadId: lead.id, imovelId: d.imovelId ?? null });
    return lead;
  });
}

/** Altera o orçamento (valor monetário → registro de alteração). */
export function alterarOrcamento(base: Base, leadId: string, orcamento: number | null, ctx: Contexto) {
  const valor = centavos.nullable().parse(orcamento);
  return transacao(base, ctx, (t) => t.put("leads", { ...t.get("leads", leadId), orcamento: valor }));
}

export function adicionarNota(base: Base, leadId: string, texto: string, ctx: Contexto) {
  const limpo = texto.trim();
  if (!limpo) throw new OperacaoInvalida("A nota está vazia.");
  return transacao(base, ctx, (t) => {
    t.get("leads", leadId);
    return t.atividade({ tipo: "nota", alvo: { tipo: "lead", id: leadId }, dados: { texto: limpo } });
  });
}
