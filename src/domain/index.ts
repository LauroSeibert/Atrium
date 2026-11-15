/**
 * Fachada do domínio: a ÚNICA fonte das regras de fluxo crítico (docs/ESTADOS-E-FLUXOS.md).
 * UI e fakeApi importam daqui; nunca mudam status/etapa/pagoEm/motivoPerda por conta própria.
 */
export * from "./comum/tipos";
export * from "./comum/base";
export { transacao, type Mudanca, type Desfazer } from "./comum/transacao";
export * from "./corretor/schema";
export * from "./imovel/schema";
export * from "./lead/schema";
export * from "./visita/schema";
export * from "./contrato/schema";
export * from "./atividade/schema";
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
  type ResultadoLote,
} from "./imovel/estado";
export * from "./lead/estado";
export * from "./visita/estado";
export * from "./contrato/estado";
export * from "./contrato/derivados";
export * from "./invariantes";
export * from "./corretor/operacoes";
export * from "./metricas/metricas";
export * from "./notificacoes/notificacoes";
