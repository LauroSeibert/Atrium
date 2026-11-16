/**
 * Fachada do domínio: a ÚNICA fonte das regras de fluxo crítico (docs/ESTADOS-E-FLUXOS.md).
 * UI e fakeApi importam daqui; nunca mudam status/etapa/pagoEm/pagaEm/motivoPerda por conta própria.
 */
export * from "./comum/tipos";
export * from "./comum/base";
export { transacao, type Mudanca, type Desfazer } from "./comum/transacao";
export * from "./corretor/schema";
export * from "./imovel/schema";
export * from "./lead/schema";
export * from "./negociacao/schema";
export * from "./visita/schema";
export * from "./contrato/schema";
export * from "./atividade/schema";
export * from "./contato/schema";
export * from "./anuncio/schema";
export * from "./documento/schema";
export * from "./despesa/schema";
export {
  TRANSICOES_USUARIO,
  TRANSICOES_SISTEMA,
  podeTransicionarImovel,
  transicoesPermitidasImovel,
  transicionarImovel,
  transicionarImoveis,
  salvarImovel,
  alternarFavorito,
  temContratoAtivo,
  opcoesLoteImovel,
  DESTINOS_USUARIO_IMOVEL,
  type OpcaoLoteImovel,
  type TransicaoImovel,
  type ResultadoLote,
} from "./imovel/estado";
export * from "./lead/estado";
export * from "./negociacao/estado";
export * from "./visita/estado";
export * from "./contrato/estado";
export * from "./contrato/derivados";
export * from "./contato/operacoes";
export * from "./anuncio/estado";
export * from "./documento/operacoes";
export * from "./despesa/operacoes";
export * from "./financeiro/listas";
export * from "./agenda/agenda";
export * from "./invariantes";
export * from "./corretor/operacoes";
export * from "./metricas/metricas";
export * from "./metricas/relatorios";
export * from "./notificacoes/notificacoes";
