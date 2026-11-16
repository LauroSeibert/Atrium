/**
 * Máquina de estado da Negociação (`etapa`) — ESTADOS-E-FLUXOS §3.1, RF-30…32, RF-39, RF-70, RF-71.
 * Único ponto de mudança de `etapa`, `motivoPerda`, `ordem` e `imovelId` da negociação.
 */
import type { Base } from "../comum/base";
import { transacao, type Mudanca, type Transacao } from "../comum/transacao";
import { OperacaoInvalida, PERMITIDO, TransicaoInvalida, negar, type Contexto, type Permissao } from "../comum/tipos";
import type { Imovel } from "../imovel/schema";
import type { Lead } from "../lead/schema";
import {
  ETAPAS,
  estaAberta,
  novaNegociacaoSchema,
  type Etapa,
  type MotivoPerda,
  type Negociacao,
  type NovaNegociacao,
} from "./schema";

type BaseGuard = Pick<Base, "contratos" | "negociacoes">;

/** Tabela de transições: a negociação pode ir para qualquer etapa; as restrições são guards. */
export const TRANSICOES_NEGOCIACAO: Readonly<Record<Etapa, readonly Etapa[]>> = Object.fromEntries(
  ETAPAS.map((de) => [de, ETAPAS.filter((para) => para !== de)]),
) as unknown as Record<Etapa, readonly Etapa[]>;

export function temContratoVinculado(base: Pick<Base, "contratos">, negociacaoId: string): boolean {
  return base.contratos.some((c) => c.negociacaoId === negociacaoId);
}

/**
 * Invariante 5: no máximo uma negociação aberta (fora de fechado/perdido) por lead × imóvel.
 * Sem imóvel (`null`) não há duplicidade a checar.
 */
export function existeNegociacaoAberta(
  base: Pick<Base, "negociacoes">,
  leadId: string,
  imovelId: string | null,
  excetoId?: string,
): boolean {
  if (imovelId === null) return false;
  return base.negociacoes.some(
    (n) => n.id !== excetoId && n.leadId === leadId && n.imovelId === imovelId && estaAberta(n),
  );
}

const MSG_DUPLICADA = "Já existe uma negociação aberta desse lead para esse imóvel.";

/** Guard sem o motivo (o motivo é dado da ação, pedido pela UI quando `exigeMotivo`). */
export function podeTransicionarNegociacao(base: BaseGuard, n: Negociacao, para: Etapa): Permissao {
  if (para === n.etapa) return negar("A negociação já está nessa etapa.");
  if (!TRANSICOES_NEGOCIACAO[n.etapa].includes(para)) return negar("Transição não prevista.");
  if (n.etapa === "fechado" && temContratoVinculado(base, n.id))
    return negar("Negociação fechada com contrato vinculado não pode mudar de etapa.");
  if (para === "fechado" && n.imovelId === null) return negar("Defina o imóvel antes de fechar.");
  // Reabrir (sair de fechado/perdido para uma etapa aberta) não pode duplicar uma negociação aberta.
  if (!estaAberta(n) && estaAberta({ etapa: para }) && existeNegociacaoAberta(base, n.leadId, n.imovelId, n.id))
    return negar(MSG_DUPLICADA);
  return PERMITIDO;
}

/** O que a UI deve oferecer em "Mover para…" (RF-31) e se cada destino pede motivo (RF-32). */
export function transicoesPermitidasNegociacao(base: BaseGuard, n: Negociacao) {
  return ETAPAS.filter((para) => podeTransicionarNegociacao(base, n, para).ok).map((para) => ({
    para,
    exigeMotivo: para === "perdido",
  }));
}

export type DestinoNegociacao = { etapa: Etapa; permissao: Permissao; exigeMotivo: boolean };

/**
 * Todos os destinos de "Mover para…"/arrastar (RF-31), com a permissão de cada um (negado = motivo visível)
 * e se pede motivo (RF-32). A própria etapa fica de fora: soltar na mesma coluna é só reordenar.
 */
export function destinosNegociacao(base: BaseGuard, n: Negociacao): DestinoNegociacao[] {
  return ETAPAS.filter((para) => para !== n.etapa).map((para) => ({
    etapa: para,
    permissao: podeTransicionarNegociacao(base, n, para),
    exigeMotivo: para === "perdido",
  }));
}

/**
 * Permissão de soltar o cartão em cada coluna do kanban (RF-31): na própria coluna é reordenar
 * (sempre permitido); nas outras, a regra de transição.
 */
export function permissoesDeSoltar(base: BaseGuard, n: Negociacao): Record<Etapa, Permissao> {
  return Object.fromEntries(
    ETAPAS.map((para) => [para, para === n.etapa ? PERMITIDO : podeTransicionarNegociacao(base, n, para)]),
  ) as Record<Etapa, Permissao>;
}

/** Valor exibido no card e somado na coluna (RF-30): preço do imóvel; sem imóvel, orçamento do lead. */
export function valorNegociacao(
  n: Pick<Negociacao, "imovelId">,
  imovel: Pick<Imovel, "preco"> | null | undefined,
  lead: Pick<Lead, "orcamento"> | null | undefined,
): number | null {
  if (n.imovelId !== null && imovel) return imovel.preco;
  return lead?.orcamento ?? null;
}

/** Negociações de um lead, na ordem do funil (etapa) e depois da criação. */
export function negociacoesDoLead(base: Pick<Base, "negociacoes">, leadId: string): Negociacao[] {
  return base.negociacoes
    .filter((n) => n.leadId === leadId)
    .sort((a, b) => ETAPAS.indexOf(a.etapa) - ETAPAS.indexOf(b.etapa) || a.criadoEm.localeCompare(b.criadoEm));
}

/** Renumera uma coluna 0…n colocando `n` na posição `ordem` (limitada ao tamanho). */
function reposicionar(t: Transacao, n: Negociacao, etapa: Etapa, ordem: number | undefined) {
  const coluna = t
    .all("negociacoes")
    .filter((x) => x.etapa === etapa && x.id !== n.id)
    .sort((a, b) => a.ordem - b.ordem);
  const pos = Math.max(0, Math.min(ordem ?? coluna.length, coluna.length));
  coluna.splice(pos, 0, n);
  coluna.forEach((x, i) => {
    if (x.ordem !== i || x.id === n.id) t.put("negociacoes", { ...x, ordem: i });
  });
}

function renumerar(t: Transacao, etapa: Etapa) {
  t.all("negociacoes")
    .filter((x) => x.etapa === etapa)
    .sort((a, b) => a.ordem - b.ordem)
    .forEach((x, i) => {
      if (x.ordem !== i) t.put("negociacoes", { ...x, ordem: i });
    });
}

const relacionadosDe = (n: Pick<Negociacao, "imovelId">) =>
  n.imovelId ? [{ tipo: "imovel" as const, id: n.imovelId }] : [];

export type MoverNegociacao = { negociacaoId: string; para: Etapa; ordem?: number; motivo?: MotivoPerda };

/**
 * `transicionarNegociacao`: muda a etapa (ou só reordena, se `para` = etapa atual).
 * Efeitos: motivoPerda gravado/limpo, Atividade `etapaAlterada` no lead (imóvel em `relacionados`,
 * `negociacaoId` em `dados`), registro de alteração (via transação), `ordem` nas duas colunas, desfazer.
 */
export function transicionarNegociacao(base: Base, cmd: MoverNegociacao, ctx: Contexto): Mudanca<Negociacao> {
  return transacao(base, ctx, (t) => {
    const n = t.get("negociacoes", cmd.negociacaoId);
    if (cmd.para === n.etapa) {
      reposicionar(t, n, n.etapa, cmd.ordem);
      return t.get("negociacoes", n.id);
    }
    const p = podeTransicionarNegociacao(base, n, cmd.para);
    if (!p.ok) throw new TransicaoInvalida("negociacao", n.etapa, cmd.para, p.motivo);
    if (cmd.para === "perdido" && !cmd.motivo)
      throw new TransicaoInvalida("negociacao", n.etapa, cmd.para, "Informe o motivo da perda.");

    const movida: Negociacao = {
      ...n,
      etapa: cmd.para,
      motivoPerda: cmd.para === "perdido" ? cmd.motivo! : null,
    };
    reposicionar(t, movida, cmd.para, cmd.ordem);
    renumerar(t, n.etapa);
    t.atividade({
      tipo: "etapaAlterada",
      alvo: { tipo: "lead", id: n.leadId },
      relacionados: relacionadosDe(n),
      dados: { de: n.etapa, para: cmd.para, motivo: cmd.motivo ?? null, negociacaoId: n.id },
    });
    return t.get("negociacoes", n.id);
  });
}

export function podeCriarNegociacao(
  base: Pick<Base, "negociacoes" | "leads" | "imoveis">,
  leadId: string,
  imovelId: string | null,
): Permissao {
  if (!base.leads.some((l) => l.id === leadId)) return negar("Lead não encontrado.");
  if (imovelId !== null && !base.imoveis.some((i) => i.id === imovelId)) return negar("Imóvel não encontrado.");
  if (existeNegociacaoAberta(base, leadId, imovelId)) return negar(MSG_DUPLICADA);
  return PERMITIDO;
}

/**
 * Cria a negociação dentro de uma transação já aberta (usada por `criarNegociacao` e por `criarLead`).
 * Nasce em `novo`, no fim da coluna, com o responsável do lead.
 */
export function criarNegociacaoEm(t: Transacao, d: NovaNegociacao): Negociacao {
  const lead = t.get("leads", d.leadId);
  if (d.imovelId !== null) t.get("imoveis", d.imovelId);
  if (existeNegociacaoAberta({ negociacoes: t.all("negociacoes") }, d.leadId, d.imovelId))
    throw new OperacaoInvalida(MSG_DUPLICADA);
  const ordem = t.all("negociacoes").filter((n) => n.etapa === "novo").length;
  return t.put("negociacoes", {
    id: t.novoId("neg"),
    leadId: d.leadId,
    imovelId: d.imovelId,
    etapa: "novo",
    motivoPerda: null,
    responsavelId: lead.responsavelId,
    ordem,
    criadoEm: t.ctx.agora,
    atualizadoEm: t.ctx.agora,
  });
}

/** RF-71: nova negociação para um lead existente (imóvel opcional). Atividade `negociacaoCriada`. */
export function criarNegociacao(base: Base, dados: NovaNegociacao, ctx: Contexto): Mudanca<Negociacao> {
  const d = novaNegociacaoSchema.parse(dados);
  return transacao(base, ctx, (t) => {
    const n = criarNegociacaoEm(t, d);
    t.atividade({
      tipo: "negociacaoCriada",
      alvo: { tipo: "lead", id: n.leadId },
      relacionados: relacionadosDe(n),
      dados: { negociacaoId: n.id },
    });
    return n;
  });
}

/** Sem `imovelId`: a UI pergunta se oferece "Definir imóvel" (só negociação ainda sem imóvel). */
export function podeDefinirImovel(
  base: Pick<Base, "negociacoes" | "imoveis">,
  n: Negociacao,
  imovelId?: string,
): Permissao {
  if (n.imovelId !== null) return negar("A negociação já tem imóvel.");
  if (imovelId === undefined) return PERMITIDO;
  if (!base.imoveis.some((i) => i.id === imovelId)) return negar("Imóvel não encontrado.");
  if (estaAberta(n) && existeNegociacaoAberta(base, n.leadId, imovelId, n.id)) return negar(MSG_DUPLICADA);
  return PERMITIDO;
}

/** Define o imóvel de uma negociação que ainda não tem (mesma regra de duplicidade da criação). */
export function definirImovelNegociacao(
  base: Base,
  negociacaoId: string,
  imovelId: string,
  ctx: Contexto,
): Mudanca<Negociacao> {
  return transacao(base, ctx, (t) => {
    const n = t.get("negociacoes", negociacaoId);
    const p = podeDefinirImovel(base, n, imovelId);
    if (!p.ok) throw new OperacaoInvalida(p.motivo);
    const salva = t.put("negociacoes", { ...n, imovelId });
    t.atividade({
      tipo: "imovelDefinido",
      alvo: { tipo: "lead", id: n.leadId },
      relacionados: relacionadosDe(salva),
      dados: { negociacaoId: n.id, imovelId },
    });
    return salva;
  });
}

export function podeVincularContrato(base: Pick<Base, "contratos">, n: Negociacao, contratoId: string): Permissao {
  if (n.etapa !== "fechado") return negar("Só negociações fechadas recebem contrato.");
  const c = base.contratos.find((x) => x.id === contratoId);
  if (!c) return negar("Contrato não encontrado.");
  if (c.imovelId !== n.imovelId) return negar("O contrato é de outro imóvel.");
  if (c.negociacaoId !== null) return negar("Esse contrato já tem uma negociação de origem.");
  if (c.status === "cancelado") return negar("Contrato cancelado não pode ser vinculado.");
  if (temContratoVinculado(base, n.id)) return negar("A negociação já tem contrato vinculado.");
  return PERMITIDO;
}

/** RF-39: contratos que podem ser vinculados à negociação (do imóvel dela, sem negociação, não cancelados). */
export function contratosVinculaveis(base: Pick<Base, "contratos">, n: Negociacao) {
  return base.contratos.filter((c) => podeVincularContrato(base, n, c.id).ok);
}

/** RF-39: vincula contrato existente a uma negociação fechada (invariante 3). */
export function vincularContrato(base: Base, negociacaoId: string, contratoId: string, ctx: Contexto) {
  return transacao(base, ctx, (t) => {
    const n = t.get("negociacoes", negociacaoId);
    const p = podeVincularContrato(base, n, contratoId);
    if (!p.ok) throw new OperacaoInvalida(p.motivo);
    const c = t.put("contratos", { ...t.get("contratos", contratoId), negociacaoId });
    t.atividade({
      tipo: "contratoVinculado",
      alvo: { tipo: "lead", id: n.leadId },
      relacionados: [{ tipo: "contrato", id: contratoId }, ...relacionadosDe(n)],
      dados: { numero: c.numero, negociacaoId },
    });
    return c;
  });
}
