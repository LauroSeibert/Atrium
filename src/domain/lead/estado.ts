/**
 * Máquina de estado do Lead (`etapa`) — ESTADOS-E-FLUXOS §3.1, RF-30…32, RF-39.
 * Único ponto de mudança de `etapa`, `motivoPerda` e `ordem`.
 */
import type { Base } from "../comum/base";
import { transacao, type Mudanca, type Transacao } from "../comum/transacao";
import {
  centavos,
  OperacaoInvalida,
  PERMITIDO,
  TransicaoInvalida,
  negar,
  type Contexto,
  type Permissao,
} from "../comum/tipos";
import { ETAPAS, novoLeadSchema, type Etapa, type Lead, type MotivoPerda, type NovoLead } from "./schema";

/** Tabela de transições: o lead pode ir para qualquer etapa; as restrições são guards. */
export const TRANSICOES_LEAD: Readonly<Record<Etapa, readonly Etapa[]>> = Object.fromEntries(
  ETAPAS.map((de) => [de, ETAPAS.filter((para) => para !== de)]),
) as unknown as Record<Etapa, readonly Etapa[]>;

export function temContratoVinculado(base: Pick<Base, "contratos">, leadId: string): boolean {
  return base.contratos.some((c) => c.leadId === leadId);
}

/** Guard sem o motivo (o motivo é dado da ação, pedido pela UI quando `exigeMotivo`). */
export function podeTransicionarLead(base: Pick<Base, "contratos">, lead: Lead, para: Etapa): Permissao {
  if (para === lead.etapa) return negar("O lead já está nessa etapa.");
  if (!TRANSICOES_LEAD[lead.etapa].includes(para)) return negar("Transição não prevista.");
  if (lead.etapa === "fechado" && temContratoVinculado(base, lead.id))
    return negar("Lead fechado com contrato vinculado não pode mudar de etapa.");
  return PERMITIDO;
}

/** O que a UI deve oferecer em "Mover para…" (RF-31) e se cada destino pede motivo (RF-32). */
export function transicoesPermitidasLead(base: Pick<Base, "contratos">, lead: Lead) {
  return ETAPAS.filter((para) => podeTransicionarLead(base, lead, para).ok).map((para) => ({
    para,
    exigeMotivo: para === "perdido",
  }));
}

/**
 * Todos os destinos de "Mover para…"/arrastar (RF-31), com a permissão de cada um (negado = motivo visível)
 * e se pede motivo (RF-32). A própria etapa fica de fora: soltar na mesma coluna é só reordenar.
 */
export function destinosLead(base: Pick<Base, "contratos">, lead: Lead) {
  return ETAPAS.filter((para) => para !== lead.etapa).map((para) => ({
    etapa: para,
    permissao: podeTransicionarLead(base, lead, para),
    exigeMotivo: para === "perdido",
  }));
}

/**
 * Permissão de soltar o cartão em cada coluna do kanban (RF-31): na própria coluna é reordenar
 * (sempre permitido); nas outras, a regra de transição.
 */
export function permissoesDeSoltar(base: Pick<Base, "contratos">, lead: Lead): Record<Etapa, Permissao> {
  return Object.fromEntries(
    ETAPAS.map((para) => [para, para === lead.etapa ? PERMITIDO : podeTransicionarLead(base, lead, para)]),
  ) as Record<Etapa, Permissao>;
}

/** Renumera uma coluna 0…n colocando `lead` na posição `ordem` (limitada ao tamanho). */
function reposicionar(t: Transacao, lead: Lead, etapa: Etapa, ordem: number | undefined) {
  const coluna = t
    .all("leads")
    .filter((l) => l.etapa === etapa && l.id !== lead.id)
    .sort((a, b) => a.ordem - b.ordem);
  const pos = Math.max(0, Math.min(ordem ?? coluna.length, coluna.length));
  coluna.splice(pos, 0, lead);
  coluna.forEach((l, i) => {
    if (l.ordem !== i || l.id === lead.id) t.put("leads", { ...l, ordem: i });
  });
}

function renumerar(t: Transacao, etapa: Etapa) {
  t.all("leads")
    .filter((l) => l.etapa === etapa)
    .sort((a, b) => a.ordem - b.ordem)
    .forEach((l, i) => {
      if (l.ordem !== i) t.put("leads", { ...l, ordem: i });
    });
}

export type MoverLead = { leadId: string; para: Etapa; ordem?: number; motivo?: MotivoPerda };

/**
 * `transicionarLead`: muda a etapa (ou só reordena, se `para` = etapa atual).
 * Efeitos: motivoPerda gravado/limpo, Atividade `etapaAlterada`, registro de alteração (via
 * transação), `ordem` nas duas colunas, desfazer.
 */
export function transicionarLead(base: Base, cmd: MoverLead, ctx: Contexto): Mudanca<Lead> {
  return transacao(base, ctx, (t) => {
    const lead = t.get("leads", cmd.leadId);
    if (cmd.para === lead.etapa) {
      reposicionar(t, lead, lead.etapa, cmd.ordem);
      return t.get("leads", lead.id);
    }
    const p = podeTransicionarLead(base, lead, cmd.para);
    if (!p.ok) throw new TransicaoInvalida("lead", lead.etapa, cmd.para, p.motivo);
    if (cmd.para === "perdido" && !cmd.motivo)
      throw new TransicaoInvalida("lead", lead.etapa, cmd.para, "Informe o motivo da perda.");

    const movido: Lead = {
      ...lead,
      etapa: cmd.para,
      motivoPerda: cmd.para === "perdido" ? cmd.motivo! : null,
    };
    reposicionar(t, movido, cmd.para, cmd.ordem);
    renumerar(t, lead.etapa);
    t.atividade({
      tipo: "etapaAlterada",
      alvo: { tipo: "lead", id: lead.id },
      dados: { de: lead.etapa, para: cmd.para, motivo: cmd.motivo ?? null },
    });
    return t.get("leads", lead.id);
  });
}

/** Criação rápida (RF-35): entra em `novo`, no fim da coluna. */
export function criarLead(base: Base, dados: NovoLead, ctx: Contexto): Mudanca<Lead> {
  const d = novoLeadSchema.parse(dados);
  return transacao(base, ctx, (t) => {
    const ordem = t.all("leads").filter((l) => l.etapa === "novo").length;
    return t.put("leads", {
      id: t.novoId("lead"),
      nome: d.nome,
      contato: d.contato,
      origem: d.origem,
      etapa: "novo",
      motivoPerda: null,
      interesse: d.interesse ?? { finalidade: "venda", tipos: [], bairros: [] },
      orcamento: d.orcamento ?? null,
      imoveisVistos: [],
      responsavelId: d.responsavelId,
      ordem,
      criadoEm: ctx.agora,
      atualizadoEm: ctx.agora,
    });
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

export function podeVincularContrato(base: Pick<Base, "contratos">, lead: Lead, contratoId: string): Permissao {
  if (lead.etapa !== "fechado") return negar("Só leads fechados recebem contrato.");
  const c = base.contratos.find((x) => x.id === contratoId);
  if (!c) return negar("Contrato não encontrado.");
  if (c.leadId !== null) return negar("Esse contrato já tem um lead de origem.");
  if (c.status === "cancelado") return negar("Contrato cancelado não pode ser vinculado.");
  return PERMITIDO;
}

/** RF-39: contratos que podem ser vinculados ao lead (dos imóveis que ele viu). */
export function contratosVinculaveis(base: Pick<Base, "contratos">, lead: Lead) {
  return base.contratos.filter(
    (c) => lead.imoveisVistos.includes(c.imovelId) && podeVincularContrato(base, lead, c.id).ok,
  );
}

/** RF-39: vincula contrato existente a um lead fechado (invariante 3). */
export function vincularContrato(base: Base, leadId: string, contratoId: string, ctx: Contexto) {
  return transacao(base, ctx, (t) => {
    const lead = t.get("leads", leadId);
    const p = podeVincularContrato(base, lead, contratoId);
    if (!p.ok) throw new OperacaoInvalida(p.motivo);
    const c = t.put("contratos", { ...t.get("contratos", contratoId), leadId });
    t.atividade({
      tipo: "contratoVinculado",
      alvo: { tipo: "lead", id: leadId },
      relacionados: [{ tipo: "contrato", id: contratoId }],
      dados: { numero: c.numero },
    });
    return c;
  });
}
