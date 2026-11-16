/**
 * Dados mock fixos para as histórias do Storybook e testes dos compostos (Fase 6).
 * Mesma semente e mesmo "hoje" sempre: as histórias não mudam de um dia para o outro.
 */
import type { NegociacaoCard } from "@/components/patterns/LeadCard";
import type { Base } from "@/domain/comum/base";
import { dataLocal } from "@/domain/comum/tipos";
import { valorNegociacao } from "@/domain/negociacao/estado";
import type { Negociacao } from "@/domain/negociacao/schema";
import { gerarBaseComCasos } from "./gerador";

export const AGORA_HISTORIAS = "2026-11-14T12:00:00.000Z";
export const HOJE_HISTORIAS = dataLocal(AGORA_HISTORIAS);

const { base, casos } = gerarBaseComCasos({ hoje: AGORA_HISTORIAS });

export const BASE_HISTORIAS = base;
export const CASOS_HISTORIAS = casos;

export const imovelPorId = (id: string) => base.imoveis.find((i) => i.id === id)!;
export const leadPorId = (id: string) => base.leads.find((l) => l.id === id)!;
export const contratoPorId = (id: string) => base.contratos.find((c) => c.id === id)!;
export const corretorPorId = (id: string) => base.corretores.find((c) => c.id === id)!;

/** Card de negociação (lead × imóvel) como a tela o recebe do fakeApi, para histórias e testes. */
export function cardDeNegociacao(b: Base, n: Negociacao): NegociacaoCard {
  const lead = b.leads.find((l) => l.id === n.leadId)!;
  const imovel = n.imovelId ? b.imoveis.find((i) => i.id === n.imovelId) : undefined;
  return {
    id: n.id,
    etapa: n.etapa,
    ordem: n.ordem,
    responsavelId: n.responsavelId,
    motivoPerda: n.motivoPerda,
    atualizadoEm: n.atualizadoEm,
    valor: valorNegociacao(n, imovel, lead),
    lead: { id: lead.id, nome: lead.nome, origem: lead.origem, interesse: lead.interesse },
    imovel: imovel ? { id: imovel.id, codigo: imovel.codigo, titulo: imovel.titulo } : null,
  };
}
export const cardsDeNegociacao = (b: Base) => b.negociacoes.map((n) => cardDeNegociacao(b, n));
export const CARDS_HISTORIAS = cardsDeNegociacao(base);
