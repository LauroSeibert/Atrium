/**
 * fakeApi — serviço assíncrono simulado (MODELO-DE-DADOS §5, Fase 5 §5.3, RF-51).
 *
 * - Latência configurável (padrão 300–800 ms) e taxa de erro configurável, para exercitar os
 *   estados de carregando/erro das telas (RNF-09).
 * - Leitura: filtra/ordena/pagina e anexa estados DERIVADOS calculados pelo domínio.
 * - Escrita: SÓ chama as funções de `@/domain` (nunca muda status/etapa/pagoEm aqui) e devolve
 *   `{ resultado, desfazer }` (RF-04).
 */
import {
  adicionarDocumento,
  adicionarNota,
  agendaDoPeriodo,
  agendarVisita as agendarVisitaDominio,
  alertaAnuncio,
  alternarFavorito,
  alterarOrcamento,
  buscar,
  calcularDashboard,
  calcularFinanceiro,
  calcularRelatorios,
  contadoresNavegacao,
  listarNotificacoes,
  criarAnuncio as criarAnuncioDominio,
  criarLead,
  criarNegociacao as criarNegociacaoDominio,
  contratosVinculaveis as contratosVinculaveisDominio,
  definirImovelNegociacao as definirImovelNegociacaoDominio,
  destinosNegociacao,
  diasDeAtraso,
  estaAberta,
  linhasComissao,
  linhasReceita,
  linhasRepasse,
  negociacoesDoLead,
  permissoesDeSoltar,
  podeAgendarVisita,
  podeDefinirImovel as podeDefinirImovelDominio,
  podeEditarDespesa,
  podePagarDespesa,
  repassesDoContrato,
  resumoCronograma,
  ETAPAS,
  estaInadimplente,
  proximoVencimento,
  registrarPagamento as registrarPagamentoDominio,
  registrarPagamentoComissao,
  registrarPagamentoDespesa,
  removerDocumento as removerDocumentoDominio,
  salvarContato,
  salvarDespesa,
  salvarImovel as salvarImovelDominio,
  salvarPerfil as salvarPerfilDominio,
  statusDespesa,
  statusExibicao,
  statusParcela,
  transicionarAnuncio as transicionarAnuncioDominio,
  transicionarContrato,
  transicionarImoveis,
  transicionarImovel,
  transicionarNegociacao,
  transicionarVisita,
  transicoesPermitidasAnuncio,
  transicoesPermitidasContrato,
  transicoesPermitidasImovel,
  transicoesPermitidasNegociacao,
  validarArquivoDocumento,
  valorNegociacao,
  vincularContrato as vincularContratoDominio,
  type Base,
  type CanalAnuncio,
  type CategoriaDespesa,
  type Contato,
  type Contexto,
  type Contrato,
  type Corretor,
  type DadosContato,
  type DadosDespesa,
  type DadosImovel,
  type Etapa,
  type FiltrosAgenda,
  type FiltrosRelatorios,
  type Finalidade,
  type Imovel,
  type Lead,
  type MotivoPerda,
  type Mudanca,
  type Negociacao,
  type NovaVisita,
  type NovoLead,
  type Origem,
  type PapelContato,
  type Periodo,
  type RefEntidade,
  type RegistroAlteracao,
  type StatusAnuncio,
  type StatusComissao,
  type StatusDespesa,
  type StatusExibicaoContrato,
  type StatusImovel,
  type StatusParcela,
  type StatusVisita,
  type TipoContrato,
  type TipoDocumento,
  type TipoImovel,
} from "@/domain";
import { gerarBase } from "@/mocks/data/gerador";
import * as arquivos from "./arquivos";
import { ErroApi, paraErroApi } from "./erros";
import * as persistencia from "./persistencia";

// ---------------------------------------------------------------------------
// Configuração e estado
// ---------------------------------------------------------------------------

export type ConfigFakeApi = {
  /** [mín, máx] em ms. `[0, 0]` em testes. */
  latencia: readonly [number, number];
  /** 0…1: probabilidade de cada chamada falhar com erro de rede simulado. */
  taxaErro: number;
  /** Persistir no localStorage (desligado em testes). */
  persistir: boolean;
};

const CONFIG_PADRAO: ConfigFakeApi = { latencia: [300, 800], taxaErro: 0, persistir: true };

type Estado = { base: Base; usuarioAtualId: string; lidas: string[] };

let config: ConfigFakeApi = { ...CONFIG_PADRAO };
let estado: Estado | null = null;
/** Relógio injetável (testes); padrão = agora real. */
let relogio: () => Date = () => new Date();

const agoraIso = () => relogio().toISOString();

function novoEstado(): Estado {
  const base = gerarBase({ hoje: agoraIso() });
  const gestor = base.corretores.find((c) => c.papel === "gestor") ?? base.corretores[0]!;
  return { base, usuarioAtualId: gestor.id, lidas: [] };
}

function obterEstado(): Estado {
  if (!estado) estado = (config.persistir && persistencia.carregar()) || novoEstado();
  return estado;
}

function gravar(novo: Estado) {
  estado = novo;
  if (config.persistir) persistencia.salvar(novo);
}

const ctx = (): Contexto => ({ autorId: obterEstado().usuarioAtualId, agora: agoraIso() });

async function esperar() {
  const [min, max] = config.latencia;
  const ms = min + Math.random() * Math.max(0, max - min);
  if (ms > 0) await new Promise((r) => setTimeout(r, ms));
  if (config.taxaErro > 0 && Math.random() < config.taxaErro)
    throw new ErroApi("rede", "Não foi possível conectar. Tente de novo.");
}

async function ler<T>(fn: (base: Base, e: Estado) => T): Promise<T> {
  await esperar();
  try {
    return structuredClone(fn(obterEstado().base, obterEstado()));
  } catch (e) {
    throw paraErroApi(e);
  }
}

export type Escrita<T> = { resultado: T; desfazer: () => Promise<void> };

async function escrever<T>(op: (base: Base, c: Contexto) => Mudanca<T>): Promise<Escrita<T>> {
  await esperar();
  return aplicar(op);
}

/** `escrever` sem a latência (quando a chamada já esperou, ex.: depois de salvar um arquivo). */
function aplicar<T>(op: (base: Base, c: Contexto) => Mudanca<T>): Escrita<T> {
  let m: Mudanca<T>;
  try {
    m = op(obterEstado().base, ctx());
  } catch (e) {
    throw paraErroApi(e);
  }
  gravar({ ...obterEstado(), base: m.base });
  return {
    resultado: structuredClone(m.resultado),
    desfazer: async () => {
      await esperar();
      try {
        gravar({ ...obterEstado(), base: m.desfazer(obterEstado().base, ctx()).base });
      } catch (e) {
        throw paraErroApi(e);
      }
    },
  };
}

function exigir<T>(v: T | undefined, oque: string): T {
  if (v === undefined) throw new ErroApi("naoEncontrado", `${oque} não encontrado.`);
  return v;
}

/** Resumos que as listas anexam (a tela não precisa buscar a coleção inteira). */
const resumoImovel = (i: Imovel | undefined) =>
  i
    ? { id: i.id, codigo: i.codigo, titulo: i.titulo, preco: i.preco, status: i.status, finalidade: i.finalidade }
    : null;
export type ResumoImovel = NonNullable<ReturnType<typeof resumoImovel>>;
const resumoLead = (l: Lead) => ({
  id: l.id,
  nome: l.nome,
  origem: l.origem,
  interesse: l.interesse,
  orcamento: l.orcamento,
});
const resumoContrato = (c: Contrato | undefined) => (c ? { id: c.id, numero: c.numero, tipo: c.tipo } : null);
const nomeCorretor = (b: Base, id: string) => buscar(b, "corretores", id)?.nome ?? null;

/** Negociação + o que a UI mostra e pode fazer com ela (RF-30, RF-31, RF-32). */
function negociacaoComDerivados(b: Base, n: Negociacao) {
  const lead = buscar(b, "leads", n.leadId);
  const imovel = n.imovelId ? buscar(b, "imoveis", n.imovelId) : undefined;
  return {
    ...n,
    lead: lead ? resumoLead(lead) : null,
    imovel: resumoImovel(imovel),
    valor: valorNegociacao(n, imovel, lead),
    destinos: destinosNegociacao(b, n),
    permissoesDeSoltar: permissoesDeSoltar(b, n),
  };
}
export type NegociacaoComDerivados = ReturnType<typeof negociacaoComDerivados>;

const DIA_MS = 86_400_000;
const desdeDias = (dias: number | undefined) =>
  dias === undefined ? undefined : new Date(relogio().getTime() - dias * DIA_MS).toISOString();

// ---------------------------------------------------------------------------
// Tipos de consulta
// ---------------------------------------------------------------------------

import { paginar, type Pagina, type Paginacao } from "@/lib/paginacao";
export type { Pagina, Paginacao };

const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
const contem = (texto: string, termo: string) => normalizar(texto).includes(normalizar(termo));

export type FiltrosImoveis = {
  busca?: string;
  tipos?: TipoImovel[];
  finalidade?: Finalidade;
  status?: StatusImovel[];
  bairros?: string[];
  precoMin?: number;
  precoMax?: number;
  /** 4 = "4+" (RF-21). */
  quartos?: number;
  favoritos?: boolean;
  corretorId?: string;
};
export type OrdemImoveis = "recentes" | "precoAsc" | "precoDesc" | "area";

export type FiltrosNegociacoes = {
  busca?: string;
  responsavelId?: string;
  origens?: Origem[];
  etapas?: Etapa[];
  imovelId?: string;
  leadId?: string;
  /** Criadas entre (ISO, inclusive). */
  de?: string;
  ate?: string;
  /** Criadas nos últimos N dias (relógio do mock). */
  ultimosDias?: number;
};
export type FiltrosLeads = Omit<FiltrosNegociacoes, "leadId">;
export type FiltrosReceitas = {
  busca?: string;
  status?: StatusParcela[];
  tipo?: TipoContrato;
  contratoId?: string;
  vencimentoDe?: string;
  vencimentoAte?: string;
};
export type FiltrosDespesas = {
  busca?: string;
  categorias?: CategoriaDespesa[];
  status?: StatusDespesa[];
  /** `null` = só as avulsas. */
  contratoId?: string | null;
  vencimentoDe?: string;
  vencimentoAte?: string;
};

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

const ORDEM_RECEITA: Record<StatusParcela, number> = { atrasado: 0, aVencer: 1, pago: 2, cancelada: 3 };
const ORDEM_ANUNCIO: Record<StatusAnuncio, number> = { publicado: 0, pausado: 1, rascunho: 2, encerrado: 3 };

export const fakeApi = {
  // --- Demonstração (RF-51) -------------------------------------------------
  configurar(parcial: Partial<ConfigFakeApi>) {
    config = { ...config, ...parcial };
  },
  getConfig: (): ConfigFakeApi => ({ ...config }),
  /** Volta ao estado inicial gerado (descarta o que foi salvo no navegador). */
  async resetMock() {
    await esperar();
    persistencia.apagar();
    await arquivos.limparArquivos();
    gravar(novoEstado());
  },

  // --- Dashboard e financeiro ----------------------------------------------
  getDashboard: (periodo: Periodo = "mesAtual") =>
    ler((b) => ({
      ...calcularDashboard(b, periodo, agoraIso()),
      /** "Agora" do relógio do mock (Hoje/Amanhã na agenda). */
      agora: agoraIso(),
      /** Rótulos das entidades citadas (atividades, agenda, metas), para a tela não buscar listas inteiras. */
      nomes: {
        imoveis: Object.fromEntries(b.imoveis.map((i) => [i.id, `${i.titulo} (${i.codigo})`])),
        leads: Object.fromEntries(b.leads.map((l) => [l.id, l.nome])),
        corretores: Object.fromEntries(b.corretores.map((c) => [c.id, c.nome])),
        contratos: Object.fromEntries(b.contratos.map((c) => [c.id, c.numero])),
      },
    })),
  /** RF-81: também traz `despesas` e `resultado`. */
  getFinanceiro: (periodo: Periodo = "mesAtual") => ler((b) => calcularFinanceiro(b, periodo, agoraIso())),
  /** RF-82: os 5 relatórios do domínio, com nomes de corretores e imóveis citados. */
  getRelatorios: (filtros: FiltrosRelatorios) =>
    ler((b) => ({
      ...calcularRelatorios(b, filtros, agoraIso()),
      nomes: {
        corretores: Object.fromEntries(b.corretores.map((c) => [c.id, c.nome])),
        imoveis: Object.fromEntries(b.imoveis.map((i) => [i.id, `${i.titulo} (${i.codigo})`])),
      },
    })),

  // --- Corretores e perfil (RF-08, RF-50) -----------------------------------
  listCorretores: () => ler((b) => b.corretores.filter((c) => c.ativo)),
  getPerfil: () => ler((b, e) => exigir(buscar(b, "corretores", e.usuarioAtualId), "Usuário")),
  /** RF-08: troca a persona (recorte padrão das listas e autor das alterações). */
  async setUsuarioAtual(corretorId: string) {
    await esperar();
    exigir(buscar(obterEstado().base, "corretores", corretorId), "Corretor");
    gravar({ ...obterEstado(), usuarioAtualId: corretorId });
  },
  savePerfil: (dados: Pick<Corretor, "nome" | "email" | "telefone">) =>
    escrever((b, c) => salvarPerfilDominio(b, c.autorId, dados, c)),

  // --- Imóveis (RF-20…28, RF-49) --------------------------------------------
  listImoveis: (filtros: FiltrosImoveis = {}, paginacao?: Paginacao, ordem: OrdemImoveis = "recentes") =>
    ler((b) => {
      const f = filtros;
      const lista = b.imoveis.filter(
        (i) =>
          (!f.busca || [i.codigo, i.titulo, i.endereco.bairro].some((t) => contem(t, f.busca!))) &&
          (!f.tipos?.length || f.tipos.includes(i.tipo)) &&
          (!f.finalidade || i.finalidade === f.finalidade) &&
          (!f.status?.length || f.status.includes(i.status)) &&
          (!f.bairros?.length || f.bairros.includes(i.endereco.bairro)) &&
          (f.precoMin === undefined || i.preco >= f.precoMin) &&
          (f.precoMax === undefined || i.preco <= f.precoMax) &&
          (f.quartos === undefined || (f.quartos >= 4 ? i.quartos >= 4 : i.quartos === f.quartos)) &&
          (!f.favoritos || i.favorito) &&
          (!f.corretorId || i.corretorId === f.corretorId),
      );
      const ord: Record<OrdemImoveis, (a: Imovel, z: Imovel) => number> = {
        recentes: (a, z) => z.criadoEm.localeCompare(a.criadoEm),
        precoAsc: (a, z) => a.preco - z.preco,
        precoDesc: (a, z) => z.preco - a.preco,
        area: (a, z) => z.areaTotal - a.areaTotal,
      };
      const pagina = paginar([...lista].sort(ord[ordem]), paginacao);
      // O que a UI pode oferecer em cada item (lote, menu do cartão): a regra está no domínio.
      return { ...pagina, itens: pagina.itens.map((i) => ({ ...i, transicoes: transicoesPermitidasImovel(b, i) })) };
    }),
  /** Bairros existentes (opções do filtro RF-21). */
  listBairros: () =>
    ler((b) => [...new Set(b.imoveis.map((i) => i.endereco.bairro))].sort((a, z) => a.localeCompare(z, "pt-BR"))),
  /** Aceita o código visível (`AT-0042`, usado nas URLs) ou o id interno. */
  getImovel: (idOuCodigo: string) =>
    ler((b) => {
      const codigo = idOuCodigo.toUpperCase();
      const imovel = exigir(buscar(b, "imoveis", idOuCodigo) ?? b.imoveis.find((i) => i.codigo === codigo), "Imóvel");
      const id = imovel.id;
      return {
        imovel,
        corretor: buscar(b, "corretores", imovel.corretorId) ?? null,
        /** O que a UI pode oferecer (a regra está no domínio). */
        transicoes: transicoesPermitidasImovel(b, imovel),
        contratos: b.contratos
          .filter((c) => c.imovelId === id)
          .map((c) => ({ id: c.id, numero: c.numero, status: statusExibicao(c, agoraIso()) })),
        /** RF-29, RF-72: negociações deste imóvel (lead, etapa, responsável). */
        negociacoes: b.negociacoes
          .filter((n) => n.imovelId === id)
          .sort(
            (a, z) => ETAPAS.indexOf(a.etapa) - ETAPAS.indexOf(z.etapa) || z.atualizadoEm.localeCompare(a.atualizadoEm),
          )
          .map((n) => {
            const lead = buscar(b, "leads", n.leadId);
            return {
              id: n.id,
              etapa: n.etapa,
              motivoPerda: n.motivoPerda,
              atualizadoEm: n.atualizadoEm,
              lead: lead ? { id: lead.id, nome: lead.nome } : null,
              responsavel: { id: n.responsavelId, nome: nomeCorretor(b, n.responsavelId) },
            };
          }),
      };
    }),
  saveImovel: (dados: DadosImovel & { id?: string }) => escrever((b, c) => salvarImovelDominio(b, dados, c)),
  setStatusImovel: (id: string, status: StatusImovel, motivo?: string) =>
    escrever((b, c) => transicionarImovel(b, id, status, c, motivo)),
  setStatusImoveis: (ids: string[], status: StatusImovel, motivo?: string) =>
    escrever((b, c) => transicionarImoveis(b, ids, status, c, motivo)),
  toggleFavorito: (id: string) => escrever((b, c) => alternarFavorito(b, id, c)),

  // --- Atividades e histórico (RF-13, RF-26, RF-34, RF-65) ------------------
  listAtividades: (opcoes: { alvo?: RefEntidade; limite?: number } = {}) =>
    ler((b) => {
      const { alvo, limite = 50 } = opcoes;
      const igual = (r: RefEntidade) => !alvo || (r.tipo === alvo.tipo && r.id === alvo.id);
      return b.atividades
        .filter((a) => igual(a.alvo) || a.relacionados.some(igual))
        .sort((a, z) => z.criadoEm.localeCompare(a.criadoEm))
        .slice(0, limite);
    }),
  listAlteracoes: (entidade: RefEntidade) =>
    ler((b): RegistroAlteracao[] =>
      b.alteracoes
        .filter((r) => r.entidade.tipo === entidade.tipo && r.entidade.id === entidade.id)
        .sort((a, z) => z.em.localeCompare(a.em)),
    ),
  /** Histórico do lead (orçamento) + o de todas as negociações dele (etapa), numa chamada só (RF-34). */
  listAlteracoesDoLead: (leadId: string) =>
    ler((b): RegistroAlteracao[] => {
      const negs = new Set(b.negociacoes.filter((n) => n.leadId === leadId).map((n) => n.id));
      return b.alteracoes
        .filter(
          (r) =>
            (r.entidade.tipo === "lead" && r.entidade.id === leadId) ||
            (r.entidade.tipo === "negociacao" && negs.has(r.entidade.id)),
        )
        .sort((a, z) => z.em.localeCompare(a.em));
    }),

  // --- Negociações (RF-30…32, RF-36, RF-38, RF-39, RF-70, RF-71) ----------
  listNegociacoes: (filtros: FiltrosNegociacoes = {}) =>
    ler((b) => {
      const f = filtros;
      const desde = desdeDias(f.ultimosDias);
      return b.negociacoes
        .map((n) => negociacaoComDerivados(b, n))
        .filter(
          (n) =>
            (!f.busca ||
              (n.lead && contem(n.lead.nome, f.busca)) ||
              (n.imovel && (contem(n.imovel.codigo, f.busca) || contem(n.imovel.titulo, f.busca)))) &&
            (!f.responsavelId || n.responsavelId === f.responsavelId) &&
            (!f.origens?.length || (n.lead && f.origens.includes(n.lead.origem))) &&
            (!f.etapas?.length || f.etapas.includes(n.etapa)) &&
            (!f.imovelId || n.imovelId === f.imovelId) &&
            (!f.leadId || n.leadId === f.leadId) &&
            (!f.de || n.criadoEm >= f.de) &&
            (!f.ate || n.criadoEm <= f.ate) &&
            (!desde || n.criadoEm >= desde),
        )
        .sort((a, z) => ETAPAS.indexOf(a.etapa) - ETAPAS.indexOf(z.etapa) || a.ordem - z.ordem);
    }),
  moverNegociacao: (id: string, etapa: Etapa, ordem?: number, motivo?: MotivoPerda) =>
    escrever((b, c) => transicionarNegociacao(b, { negociacaoId: id, para: etapa, ordem, motivo }, c)),
  criarNegociacao: (leadId: string, imovelId: string | null) =>
    escrever((b, c) => criarNegociacaoDominio(b, { leadId, imovelId }, c)),
  definirImovelNegociacao: (id: string, imovelId: string) =>
    escrever((b, c) => definirImovelNegociacaoDominio(b, id, imovelId, c)),
  /** RF-39: contratos existentes que o domínio aceita vincular à negociação. */
  contratosVinculaveis: (negociacaoId: string) =>
    ler((b) => {
      const n = exigir(buscar(b, "negociacoes", negociacaoId), "Negociação");
      return contratosVinculaveisDominio(b, n).map((c) => ({
        id: c.id,
        numero: c.numero,
        imovel: resumoImovel(buscar(b, "imoveis", c.imovelId)),
      }));
    }),
  vincularContrato: (negociacaoId: string, contratoId: string) =>
    escrever((b, c) => vincularContratoDominio(b, negociacaoId, contratoId, c)),

  // --- Leads = pessoas (RF-33, RF-35, RF-72) --------------------------------
  listLeads: (filtros: FiltrosLeads = {}) =>
    ler((b) => {
      const f = filtros;
      const desde = desdeDias(f.ultimosDias);
      const porLead = new Map<string, Negociacao[]>();
      for (const n of b.negociacoes) porLead.set(n.leadId, [...(porLead.get(n.leadId) ?? []), n]);
      return b.leads
        .map((l) => {
          const negs = porLead.get(l.id) ?? [];
          return { ...l, qtdNegociacoes: negs.length, qtdAbertas: negs.filter(estaAberta).length, negs };
        })
        .filter(
          (l) =>
            (!f.busca || contem(l.nome, f.busca)) &&
            (!f.responsavelId || l.responsavelId === f.responsavelId) &&
            (!f.origens?.length || f.origens.includes(l.origem)) &&
            (!f.etapas?.length || l.negs.some((n) => f.etapas!.includes(n.etapa))) &&
            (!f.imovelId || l.negs.some((n) => n.imovelId === f.imovelId)) &&
            (!f.de || l.criadoEm >= f.de) &&
            (!f.ate || l.criadoEm <= f.ate) &&
            (!desde || l.criadoEm >= desde),
        )
        .sort((a, z) => z.criadoEm.localeCompare(a.criadoEm))
        .map((l) => {
          const { negs, ...resto } = l;
          void negs;
          return resto;
        });
    }),
  getLead: (id: string) =>
    ler((b) => {
      const lead = exigir(buscar(b, "leads", id), "Lead");
      const negociacoes = negociacoesDoLead(b, id).map((n) => ({
        ...negociacaoComDerivados(b, n),
        transicoes: transicoesPermitidasNegociacao(b, n),
        contrato: resumoContrato(b.contratos.find((c) => c.negociacaoId === n.id)),
        /** RF-39: "Vincular contrato" só quando o domínio aceita algum contrato. */
        podeVincular: contratosVinculaveisDominio(b, n).length > 0,
        /** RF-71: "Definir imóvel" (regra do domínio). */
        podeDefinirImovel: podeDefinirImovelDominio(b, n),
      }));
      const ids = new Set(negociacoes.map((n) => n.id));
      return {
        lead,
        responsavel: buscar(b, "corretores", lead.responsavelId) ?? null,
        imoveisVistos: lead.imoveisVistos.map((i) => buscar(b, "imoveis", i)).filter((i): i is Imovel => !!i),
        visitas: b.visitas.filter((v) => v.leadId === id).sort((a, z) => z.dataHora.localeCompare(a.dataHora)),
        negociacoes,
        /** Contratos vinculados às negociações do lead. */
        contratos: b.contratos
          .filter((c) => c.negociacaoId && ids.has(c.negociacaoId))
          .map((c) => ({
            ...resumoContrato(c)!,
            negociacaoId: c.negociacaoId!,
            status: statusExibicao(c, agoraIso()),
          })),
        /** RF-37: agendar exige alguma negociação não perdida (regra do domínio, `podeAgendarVisita`). */
        podeAgendarVisita: podeAgendarVisita(b, id),
      };
    }),
  /** Cria o lead e a 1ª negociação (`imovelId` opcional, RF-35). */
  createLead: (dados: Omit<NovoLead, "responsavelId"> & { responsavelId?: string }) =>
    escrever((b, c) => criarLead(b, { ...dados, responsavelId: dados.responsavelId ?? c.autorId }, c)),
  setOrcamento: (id: string, orcamento: number | null) => escrever((b, c) => alterarOrcamento(b, id, orcamento, c)),
  addNota: (leadId: string, texto: string) => escrever((b, c) => adicionarNota(b, leadId, texto, c)),

  // --- Agenda (RF-73) --------------------------------------------------------
  getAgenda: (filtros: FiltrosAgenda = {}) =>
    ler((b) => ({
      agora: agoraIso(),
      dias: agendaDoPeriodo(b, agoraIso(), filtros),
      nomes: {
        imoveis: Object.fromEntries(b.imoveis.map((i) => [i.id, `${i.titulo} (${i.codigo})`])),
        leads: Object.fromEntries(b.leads.map((l) => [l.id, l.nome])),
        corretores: Object.fromEntries(b.corretores.map((c) => [c.id, c.nome])),
      },
    })),

  // --- Contatos (RF-74) -------------------------------------------------------
  listContatos: (filtros: { busca?: string; papeis?: PapelContato[] } = {}) =>
    ler((b) =>
      b.contatos
        .filter(
          (c) =>
            (!filtros.busca ||
              contem(c.nome, filtros.busca) ||
              (!!c.email && contem(c.email, filtros.busca)) ||
              (!!c.telefone && c.telefone.includes(filtros.busca.replace(/\D/g, "") || "\u0000"))) &&
            (!filtros.papeis?.length || filtros.papeis.includes(c.papel)),
        )
        .sort((a, z) => a.nome.localeCompare(z.nome, "pt-BR")),
    ),
  getContato: (id: string) =>
    ler((b) => {
      const contato = exigir(buscar(b, "contatos", id), "Contato");
      return {
        contato,
        imoveis: contato.imovelIds.flatMap((i) => resumoImovel(buscar(b, "imoveis", i)) ?? []),
        contratos: contato.contratoIds.flatMap((k) => resumoContrato(buscar(b, "contratos", k)) ?? []),
      };
    }),
  saveContato: (dados: DadosContato & { id?: string }) => escrever((b, c) => salvarContato(b, dados, c)),

  // --- Anúncios (RF-75) -------------------------------------------------------
  listAnuncios: (filtros: { busca?: string; canais?: CanalAnuncio[]; status?: StatusAnuncio[] } = {}) =>
    ler((b) =>
      b.anuncios
        .map((a) => ({
          ...a,
          imovel: resumoImovel(buscar(b, "imoveis", a.imovelId)),
          transicoes: transicoesPermitidasAnuncio(b, a),
          alerta: alertaAnuncio(b, a),
        }))
        .filter(
          (a) =>
            (!filtros.busca ||
              (a.imovel && (contem(a.imovel.codigo, filtros.busca) || contem(a.imovel.titulo, filtros.busca)))) &&
            (!filtros.canais?.length || filtros.canais.includes(a.canal)) &&
            (!filtros.status?.length || filtros.status.includes(a.status)),
        )
        .sort(
          (a, z) => ORDEM_ANUNCIO[a.status] - ORDEM_ANUNCIO[z.status] || z.atualizadoEm.localeCompare(a.atualizadoEm),
        ),
    ),
  criarAnuncio: (imovelId: string, canal: CanalAnuncio) =>
    escrever((b, c) => criarAnuncioDominio(b, imovelId, canal, c)),
  transicionarAnuncio: (id: string, status: StatusAnuncio) =>
    escrever((b, c) => transicionarAnuncioDominio(b, id, status, c)),

  // --- Documentos do contrato (RF-76) -----------------------------------------
  listDocumentos: (contratoId: string) =>
    ler((b) => {
      exigir(buscar(b, "contratos", contratoId), "Contrato");
      return b.documentos
        .filter((d) => d.contratoId === contratoId)
        .sort((a, z) => z.enviadoEm.localeCompare(a.enviadoEm))
        .map((d) => ({ ...d, enviadoPor: nomeCorretor(b, d.enviadoPorId) }));
    }),
  /**
   * Valida no domínio (erro `validacao`), salva o arquivo no IndexedDB e depois os metadados.
   * Devolve `{ resultado, desfazer, soNestaSessao }`; `soNestaSessao: true` = caiu no fallback em memória.
   */
  async enviarDocumento(contratoId: string, arquivo: File, tipo: TipoDocumento) {
    await esperar();
    try {
      exigir(buscar(obterEstado().base, "contratos", contratoId), "Contrato");
      validarArquivoDocumento({ nome: arquivo.name, tipo: arquivo.type, tamanho: arquivo.size });
    } catch (e) {
      throw paraErroApi(e);
    }
    const arquivoId = arquivos.novoArquivoId();
    const { persistido } = await arquivos.salvarArquivo(arquivoId, arquivo);
    try {
      const escrita = aplicar((b, c) =>
        adicionarDocumento(
          b,
          { contratoId, tipo, nome: arquivo.name, mime: arquivo.type, tamanho: arquivo.size, arquivoId },
          c,
        ),
      );
      /** Sem IndexedDB o arquivo fica só na memória desta aba: a UI deve avisar (some ao recarregar). */
      return { ...escrita, soNestaSessao: !persistido };
    } catch (e) {
      await arquivos.apagarArquivo(arquivoId);
      throw e;
    }
  },
  /** O arquivo salvo; documento de exemplo (`arquivoId: null`) baixa um PDF de demonstração. */
  async baixarDocumento(id: string): Promise<Blob> {
    await esperar();
    const doc = buscar(obterEstado().base, "documentos", id);
    if (!doc) throw new ErroApi("naoEncontrado", "Documento não encontrado.");
    if (doc.arquivoId === null) return arquivos.pdfDemonstracao(doc.nome);
    const blob = await arquivos.lerArquivo(doc.arquivoId);
    if (!blob) throw new ErroApi("naoEncontrado", "Arquivo não encontrado neste navegador.");
    return blob;
  },
  /** Remove os metadados; o arquivo fica guardado para o Desfazer (RF-04). */
  removerDocumento: (id: string) => escrever((b, c) => removerDocumentoDominio(b, id, c)),

  // --- Financeiro: receitas, despesas, comissões, repasses (RF-77…80) --------
  listReceitas: (filtros: FiltrosReceitas = {}, paginacao?: Paginacao) =>
    ler((b) => {
      const f = filtros;
      const lista = linhasReceita(b, agoraIso())
        .map((l) => ({ ...l, imovel: resumoImovel(buscar(b, "imoveis", l.imovelId)) }))
        .filter(
          (l) =>
            (!f.busca ||
              contem(l.numeroContrato, f.busca) ||
              (l.imovel && (contem(l.imovel.codigo, f.busca) || contem(l.imovel.titulo, f.busca)))) &&
            (!f.status?.length || f.status.includes(l.status)) &&
            (!f.tipo || l.tipo === f.tipo) &&
            (!f.contratoId || l.contratoId === f.contratoId) &&
            (!f.vencimentoDe || l.vencimento >= f.vencimentoDe) &&
            (!f.vencimentoAte || l.vencimento <= f.vencimentoAte),
        )
        // O que pede ação primeiro: atrasadas (mais antigas), depois a vencer (mais próximas), pagas e canceladas.
        .sort(
          (a, z) =>
            ORDEM_RECEITA[a.status] - ORDEM_RECEITA[z.status] ||
            (a.status === "pago"
              ? z.vencimento.localeCompare(a.vencimento)
              : a.vencimento.localeCompare(z.vencimento)) ||
            a.numeroContrato.localeCompare(z.numeroContrato),
        );
      return paginar(lista, paginacao);
    }),
  listDespesas: (filtros: FiltrosDespesas = {}, paginacao?: Paginacao) =>
    ler((b) => {
      const f = filtros;
      const hoje = agoraIso();
      const lista = b.despesas
        .map((d) => ({
          ...d,
          status: statusDespesa(d, hoje),
          podeEditar: podeEditarDespesa(d),
          podePagar: podePagarDespesa(d),
          contrato: d.contratoId ? resumoContrato(buscar(b, "contratos", d.contratoId)) : null,
        }))
        .filter(
          (d) =>
            (!f.busca || contem(d.descricao, f.busca) || (!!d.contrato && contem(d.contrato.numero, f.busca))) &&
            (!f.categorias?.length || f.categorias.includes(d.categoria)) &&
            (!f.status?.length || f.status.includes(d.status)) &&
            (f.contratoId === undefined || d.contratoId === f.contratoId) &&
            (!f.vencimentoDe || d.vencimento >= f.vencimentoDe) &&
            (!f.vencimentoAte || d.vencimento <= f.vencimentoAte),
        )
        .sort((a, z) => z.vencimento.localeCompare(a.vencimento) || a.id.localeCompare(z.id));
      return paginar(lista, paginacao);
    }),
  /** Lança (sem `id`) ou edita uma despesa ainda não paga. */
  saveDespesa: (dados: DadosDespesa & { id?: string }) => escrever((b, c) => salvarDespesa(b, dados, c)),
  pagarDespesa: (id: string) => escrever((b, c) => registrarPagamentoDespesa(b, id, c)),
  listComissoes: (filtros: { competencia?: string; corretorId?: string; status?: StatusComissao } = {}) =>
    ler((b) =>
      linhasComissao(b)
        .filter(
          (m) =>
            (!filtros.competencia || m.competencia === filtros.competencia) &&
            (!filtros.corretorId || m.corretorId === filtros.corretorId) &&
            (!filtros.status || m.status === filtros.status),
        )
        .map((m) => ({
          ...m,
          corretor: nomeCorretor(b, m.corretorId),
          imovel: resumoImovel(buscar(b, "imoveis", m.imovelId)),
        }))
        .sort((a, z) => z.competencia.localeCompare(a.competencia) || a.numeroContrato.localeCompare(z.numeroContrato)),
    ),
  /** Competências (`AAAA-MM`) com comissão, da mais recente para a mais antiga (opções do filtro). */
  listCompetenciasComissao: () =>
    ler((b) => [...new Set(linhasComissao(b).map((m) => m.competencia))].sort().reverse()),
  /** `indice` = posição em `contrato.comissoes` (vem em cada linha de `listComissoes`). */
  pagarComissao: (contratoId: string, indice: number) =>
    escrever((b, c) => registrarPagamentoComissao(b, contratoId, indice, c)),
  listRepasses: (filtros: { mes?: string; contratoId?: string } = {}) =>
    ler((b) =>
      linhasRepasse(b)
        .filter(
          (r) =>
            (!filtros.mes || r.mes === filtros.mes) && (!filtros.contratoId || r.contratoId === filtros.contratoId),
        )
        .map((r) => ({ ...r, imovel: resumoImovel(buscar(b, "imoveis", r.imovelId)) }))
        .sort((a, z) => z.pagoEm.localeCompare(a.pagoEm)),
    ),
  /** Meses (`AAAA-MM`) com repasse, do mais recente para o mais antigo (opções do filtro). */
  listMesesRepasse: () => ler((b) => [...new Set(linhasRepasse(b).map((r) => r.mes))].sort().reverse()),

  // --- Visitas (RF-14, RF-37) -----------------------------------------------
  agendarVisita: (dados: Omit<NovaVisita, "corretorId"> & { corretorId?: string }) =>
    escrever((b, c) => agendarVisitaDominio(b, { ...dados, corretorId: dados.corretorId ?? c.autorId }, c)),
  updateVisita: (id: string, status: StatusVisita) => escrever((b, c) => transicionarVisita(b, id, status, c)),

  // --- Contratos (RF-40…48) --------------------------------------------------
  listContratos: (
    filtros: {
      busca?: string;
      tipo?: TipoContrato;
      status?: StatusExibicaoContrato[];
      vencimentoDe?: string;
      vencimentoAte?: string;
    } = {},
    paginacao?: Paginacao,
    ordem: "recentes" | "valorDesc" | "vencimento" = "recentes",
  ) =>
    ler((b) => {
      const hoje = agoraIso();
      const linhas = b.contratos.map((c) => ({
        contrato: c,
        imovel: buscar(b, "imoveis", c.imovelId) ?? null,
        statusExibicao: statusExibicao(c, hoje),
        proximoVencimento: proximoVencimento(c),
      }));
      const f = filtros;
      const lista = linhas.filter(
        (l) =>
          (!f.busca ||
            contem(l.contrato.numero, f.busca) ||
            l.contrato.partes.some((p) => contem(p.nome, f.busca!)) ||
            (l.imovel && contem(l.imovel.codigo, f.busca))) &&
          (!f.tipo || l.contrato.tipo === f.tipo) &&
          (!f.status?.length || f.status.includes(l.statusExibicao)) &&
          (!f.vencimentoDe || (l.proximoVencimento?.vencimento ?? "") >= f.vencimentoDe) &&
          (!f.vencimentoAte || (!!l.proximoVencimento && l.proximoVencimento.vencimento <= f.vencimentoAte)),
      );
      const ord = {
        recentes: (a: (typeof linhas)[number], z: (typeof linhas)[number]) =>
          z.contrato.inicio.localeCompare(a.contrato.inicio),
        valorDesc: (a: (typeof linhas)[number], z: (typeof linhas)[number]) => z.contrato.valor - a.contrato.valor,
        vencimento: (a: (typeof linhas)[number], z: (typeof linhas)[number]) =>
          (a.proximoVencimento?.vencimento ?? "9999").localeCompare(z.proximoVencimento?.vencimento ?? "9999"),
      }[ordem];
      return paginar([...lista].sort(ord), paginacao);
    }),
  getContrato: (id: string) =>
    ler((b) => {
      const contrato: Contrato = exigir(buscar(b, "contratos", id), "Contrato");
      const hoje = agoraIso();
      return {
        contrato,
        imovel: buscar(b, "imoveis", contrato.imovelId) ?? null,
        /** RF-39: negociação vinculada e o lead dela. */
        negociacao: contrato.negociacaoId ? (buscar(b, "negociacoes", contrato.negociacaoId) ?? null) : null,
        lead: (() => {
          const n = contrato.negociacaoId ? buscar(b, "negociacoes", contrato.negociacaoId) : undefined;
          return n ? (buscar(b, "leads", n.leadId) ?? null) : null;
        })(),
        statusExibicao: statusExibicao(contrato, hoje),
        inadimplente: estaInadimplente(contrato, hoje),
        parcelas: contrato.parcelas.map((p) => ({
          ...p,
          status: statusParcela(contrato, p, hoje),
          diasAtraso: diasDeAtraso(p, hoje),
        })),
        /** Pago, a receber e atrasado (RF-42). */
        resumo: resumoCronograma(contrato, hoje),
        /** Repasses ao proprietário (RF-46); `null` quando não se aplica. */
        repasses: repassesDoContrato(contrato),
        transicoes: transicoesPermitidasContrato(b, contrato, hoje),
      };
    }),
  registrarPagamento: (contratoId: string, numero: number) =>
    escrever((b, c) => registrarPagamentoDominio(b, contratoId, numero, c)),
  cancelarContrato: (id: string, motivo: string) =>
    escrever((b, c) => transicionarContrato(b, id, { para: "cancelado", motivo }, c)),
  assinarContrato: (id: string) => escrever((b, c) => transicionarContrato(b, id, { para: "ativo" }, c)),
  encerrarContrato: (id: string) => escrever((b, c) => transicionarContrato(b, id, { para: "encerrado" }, c)),

  // --- Notificações (RF-64) --------------------------------------------------
  listNotificacoes: () => ler((b, e) => listarNotificacoes(b, agoraIso(), e.usuarioAtualId, e.lidas)),
  /** Badges da navegação (RF-62). */
  getContadoresNavegacao: () => ler((b) => contadoresNavegacao(b, agoraIso())),
  async marcarLida(id: string | "todas") {
    await esperar();
    const e = obterEstado();
    const ids = id === "todas" ? (await fakeApi.listNotificacoes()).map((n) => n.id) : [id];
    gravar({ ...e, lidas: [...new Set([...e.lidas, ...ids])] });
  },

  // --- Busca global (RF-02) --------------------------------------------------
  /** RF-02. `contatos` é opcional no tipo só para quem monta o resultado vazio sem ele (sempre vem preenchido). */
  search: (termo: string) =>
    ler((b): { imoveis: Imovel[]; leads: Lead[]; contratos: Contrato[]; contatos?: Contato[] } => {
      if (normalizar(termo).length < 2) return { imoveis: [], leads: [], contratos: [], contatos: [] };
      return {
        imoveis: b.imoveis.filter((i) => contem(i.codigo, termo) || contem(i.titulo, termo)).slice(0, 5),
        leads: b.leads.filter((l: Lead) => contem(l.nome, termo)).slice(0, 5),
        contratos: b.contratos.filter((c) => contem(c.numero, termo)).slice(0, 5),
        contatos: b.contatos.filter((c) => contem(c.nome, termo)).slice(0, 5),
      };
    }),
};

export type FakeApi = typeof fakeApi;

/** Só para testes: estado limpo, relógio fixo, sem latência/persistência. */
export function __reiniciarParaTeste(opcoes: { agora?: string; config?: Partial<ConfigFakeApi> } = {}) {
  config = { ...CONFIG_PADRAO, latencia: [0, 0], persistir: false, ...opcoes.config };
  relogio = opcoes.agora ? () => new Date(opcoes.agora!) : () => new Date();
  estado = null;
}
