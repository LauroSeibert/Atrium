/**
 * Notificações in-app (RF-64) e contadores da navegação (RF-62): derivados, nunca gravados.
 * Antes ficavam no fakeApi; a regra de vencimento/atraso mora aqui, junto do domínio
 * (ESTADOS-E-FLUXOS §2 regra 5), e o fakeApi só lê.
 */
import type { Atividade } from "../atividade/schema";
import type { RefEntidade } from "../comum/tipos";
import type { Base } from "../comum/base";
import { dataLocal } from "../comum/tipos";
import { parcelasAtrasadas, statusParcela } from "../contrato/derivados";

const DIA = 86_400_000;
/** Atividades de outras pessoas nos últimos 14 dias viram notificação. */
export const JANELA_NOTIFICACOES_DIAS = 14;
/** Parcelas que vencem em até 3 dias (ou já venceram) viram notificação. */
export const ANTECEDENCIA_VENCIMENTO_DIAS = 3;
export const LIMITE_NOTIFICACOES = 50;

export type Notificacao =
  | {
      id: string;
      tipo: "atividade";
      em: string;
      lida: boolean;
      atividade: Atividade;
      /** Nome legível da entidade-alvo ("IMV-0012 · Casa no Jardim", "Ana Souza", "CT-2026-0003"). */
      alvoNome?: string;
    }
  | {
      id: string;
      tipo: "vencimento" | "atraso";
      em: string;
      lida: boolean;
      contratoId: string;
      numero: string;
      parcela: number;
      valor: number;
    };

/**
 * `agora` em ISO. `usuarioId` é a persona atual (as próprias atividades não notificam);
 * `lidas` são os ids já marcados como lidos.
 */
/** Nome legível de uma entidade referenciada; `undefined` se não existe mais. */
export function nomeDaEntidade(
  base: Pick<Base, "imoveis" | "leads" | "contratos"> & Partial<Pick<Base, "negociacoes" | "anuncios" | "despesas">>,
  ref: RefEntidade,
): string | undefined {
  const imovel = (id: string | null | undefined) => base.imoveis.find((x) => x.id === id);
  switch (ref.tipo) {
    case "imovel": {
      const i = imovel(ref.id);
      return i ? `${i.codigo} · ${i.titulo}` : undefined;
    }
    case "lead":
      return base.leads.find((x) => x.id === ref.id)?.nome;
    case "contrato":
      return base.contratos.find((x) => x.id === ref.id)?.numero;
    case "negociacao": {
      const n = base.negociacoes?.find((x) => x.id === ref.id);
      if (!n) return undefined;
      const lead = base.leads.find((x) => x.id === n.leadId)?.nome ?? "Lead";
      return `${lead} · ${imovel(n.imovelId)?.codigo ?? "Sem imóvel"}`;
    }
    case "anuncio": {
      const a = base.anuncios?.find((x) => x.id === ref.id);
      return a ? `${imovel(a.imovelId)?.codigo ?? "Imóvel"} · ${a.canal}` : undefined;
    }
    case "despesa":
      return base.despesas?.find((x) => x.id === ref.id)?.descricao;
  }
}

export function listarNotificacoes(
  base: Pick<Base, "atividades" | "contratos" | "imoveis" | "leads">,
  agora: string,
  usuarioId: string,
  lidas: readonly string[] = [],
): Notificacao[] {
  const limite = new Date(Date.parse(agora) - JANELA_NOTIFICACOES_DIAS * DIA).toISOString();
  const deAtividades = base.atividades
    .filter((a) => a.autorId !== usuarioId && a.criadoEm >= limite)
    .map((a) => ({
      id: `ntf_${a.id}`,
      tipo: "atividade" as const,
      em: a.criadoEm,
      atividade: a,
      alvoNome: nomeDaEntidade(base, a.alvo),
    }));
  const ate = dataLocal(new Date(Date.parse(agora) + ANTECEDENCIA_VENCIMENTO_DIAS * DIA).toISOString());
  const vencimentos = base.contratos
    .filter((c) => c.status === "ativo")
    .flatMap((c) =>
      c.parcelas
        .filter((p) => !p.pagoEm && p.vencimento <= ate)
        .map((p) => ({
          id: `ntf_venc_${c.id}_${p.numero}`,
          tipo: statusParcela(c, p, agora) === "atrasado" ? ("atraso" as const) : ("vencimento" as const),
          em: `${p.vencimento}T12:00:00.000Z`,
          contratoId: c.id,
          numero: c.numero,
          parcela: p.numero,
          valor: p.valor,
        })),
    );
  const lidasSet = new Set(lidas);
  return [...deAtividades, ...vencimentos]
    .sort((a, z) => z.em.localeCompare(a.em))
    .slice(0, LIMITE_NOTIFICACOES)
    .map((n) => ({ ...n, lida: lidasSet.has(n.id) }));
}

/** Badges da navegação (RF-62). */
export type ContadoresNavegacao = {
  /**
   * Negociações na etapa "novo" (ainda sem contato), badge do item Leads (BRIEF-MENU).
   * O nome ficou `leadsNovos` para não quebrar o shell; conta negociações desde 2026-11-16.
   */
  leadsNovos: number;
  /** Parcelas atrasadas de contratos ativos (mesma regra do status "inadimplente"). */
  parcelasAtrasadas: number;
};

export function contadoresNavegacao(base: Pick<Base, "negociacoes" | "contratos">, agora: string): ContadoresNavegacao {
  return {
    leadsNovos: base.negociacoes.filter((n) => n.etapa === "novo").length,
    parcelasAtrasadas: base.contratos
      .filter((c) => c.status === "ativo")
      .reduce((n, c) => n + parcelasAtrasadas(c, agora).length, 0),
  };
}

export const naoLidas = (ns: readonly Pick<Notificacao, "lida">[]) => ns.filter((n) => !n.lida).length;
