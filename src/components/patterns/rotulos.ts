/**
 * Vocabulário de exibição dos compostos (Fase 6): rótulo em pt-BR e tom do Badge para cada valor
 * de enum do domínio. É só apresentação; quais transições são permitidas vem do domínio
 * (`transicoesPermitidas…`, `pode…`), nunca daqui. Cor nunca é o único sinal: o rótulo sempre aparece.
 */
import type { StatusExibicaoContrato, StatusParcela, TipoContrato } from "@/domain/contrato/schema";
import type { Finalidade, StatusImovel, TipoComodo, TipoImovel } from "@/domain/imovel/schema";
import type { Etapa, MotivoPerda, Origem } from "@/domain/lead/schema";
import type { StatusVisita } from "@/domain/visita/schema";
import type { BadgeProps } from "../ui/Badge";

export type Tom = NonNullable<BadgeProps["tone"]>;
export type Rotulado = { rotulo: string; tom: Tom };

export const STATUS_IMOVEL_UI: Record<StatusImovel, Rotulado> = {
  disponivel: { rotulo: "Disponível", tom: "success" },
  reservado: { rotulo: "Reservado", tom: "warning" },
  vendido: { rotulo: "Vendido", tom: "neutral" },
  alugado: { rotulo: "Alugado", tom: "neutral" },
  inativo: { rotulo: "Inativo", tom: "neutral" },
};

export const ETAPA_UI: Record<Etapa, Rotulado> = {
  novo: { rotulo: "Novo", tom: "info" },
  contato: { rotulo: "Contato", tom: "neutral" },
  visita: { rotulo: "Visita", tom: "neutral" },
  proposta: { rotulo: "Proposta", tom: "warning" },
  fechado: { rotulo: "Fechado", tom: "success" },
  perdido: { rotulo: "Perdido", tom: "danger" },
};

export const STATUS_CONTRATO_UI: Record<StatusExibicaoContrato, Rotulado> = {
  rascunho: { rotulo: "Rascunho", tom: "neutral" },
  ativo: { rotulo: "Ativo", tom: "success" },
  encerrado: { rotulo: "Encerrado", tom: "info" },
  cancelado: { rotulo: "Cancelado", tom: "neutral" },
  inadimplente: { rotulo: "Inadimplente", tom: "danger" },
};

export const STATUS_PARCELA_UI: Record<StatusParcela, Rotulado> = {
  pago: { rotulo: "Pago", tom: "success" },
  aVencer: { rotulo: "A vencer", tom: "neutral" },
  atrasado: { rotulo: "Atrasado", tom: "danger" },
  cancelada: { rotulo: "Cancelada", tom: "neutral" },
};

export const STATUS_VISITA_UI: Record<StatusVisita, Rotulado> = {
  agendada: { rotulo: "Agendada", tom: "info" },
  realizada: { rotulo: "Realizada", tom: "success" },
  cancelada: { rotulo: "Cancelada", tom: "neutral" },
  naoCompareceu: { rotulo: "Não compareceu", tom: "warning" },
};

export const TIPO_IMOVEL_ROTULO: Record<TipoImovel, string> = {
  casa: "Casa",
  apartamento: "Apartamento",
  cobertura: "Cobertura",
  terreno: "Terreno",
  comercial: "Comercial",
};

export const FINALIDADE_ROTULO: Record<Finalidade, string> = { venda: "Venda", locacao: "Locação" };
export const TIPO_CONTRATO_ROTULO: Record<TipoContrato, string> = { venda: "Venda", locacao: "Locação" };

export const ORIGEM_ROTULO: Record<Origem, string> = {
  site: "Site",
  portal: "Portal",
  indicacao: "Indicação",
  whatsapp: "WhatsApp",
  placa: "Placa",
  redes: "Redes sociais",
};

export const MOTIVO_PERDA_ROTULO: Record<MotivoPerda, string> = {
  preco: "Preço",
  localizacao: "Localização",
  desistencia: "Desistência",
  concorrencia: "Concorrência",
  outro: "Outro",
};

export const COMODO_ROTULO: Record<TipoComodo, string> = {
  sala: "Sala",
  cozinha: "Cozinha",
  quarto: "Quarto",
  banheiro: "Banheiro",
  varanda: "Varanda",
  garagem: "Garagem",
  areaGourmet: "Área gourmet",
  escritorio: "Escritório",
};
