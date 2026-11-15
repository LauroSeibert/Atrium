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
  adicionarNota,
  agendarVisita as agendarVisitaDominio,
  alternarFavorito,
  alterarOrcamento,
  buscar,
  calcularDashboard,
  calcularFinanceiro,
  contadoresNavegacao,
  listarNotificacoes,
  criarLead,
  ETAPAS,
  estaInadimplente,
  proximoVencimento,
  registrarPagamento as registrarPagamentoDominio,
  salvarImovel as salvarImovelDominio,
  salvarPerfil as salvarPerfilDominio,
  statusExibicao,
  statusParcela,
  transicionarContrato,
  transicionarImoveis,
  transicionarImovel,
  transicionarLead,
  transicionarVisita,
  transicoesPermitidasContrato,
  transicoesPermitidasImovel,
  transicoesPermitidasLead,
  vincularContrato as vincularContratoDominio,
  type Base,
  type Contexto,
  type Contrato,
  type Corretor,
  type DadosImovel,
  type Etapa,
  type Finalidade,
  type Imovel,
  type Lead,
  type MotivoPerda,
  type Mudanca,
  type NovaVisita,
  type NovoLead,
  type Origem,
  type Periodo,
  type RefEntidade,
  type RegistroAlteracao,
  type StatusExibicaoContrato,
  type StatusImovel,
  type StatusVisita,
  type TipoContrato,
  type TipoImovel,
} from "@/domain";
import { gerarBase } from "@/mocks/data/gerador";
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

// ---------------------------------------------------------------------------
// Tipos de consulta
// ---------------------------------------------------------------------------

import type { Pagina, Paginacao } from "@/lib/paginacao";
export type { Pagina, Paginacao };

function paginar<T>(lista: T[], p: Paginacao = { pagina: 1, porPagina: 12 }): Pagina<T> {
  const porPagina = Math.max(1, p.porPagina);
  const totalPaginas = Math.max(1, Math.ceil(lista.length / porPagina));
  const pagina = Math.min(Math.max(1, p.pagina), totalPaginas);
  return {
    itens: lista.slice((pagina - 1) * porPagina, pagina * porPagina),
    total: lista.length,
    pagina,
    porPagina,
    totalPaginas,
  };
}

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

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

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
    gravar(novoEstado());
  },

  // --- Dashboard e financeiro ----------------------------------------------
  getDashboard: (periodo: Periodo = "mesAtual") => ler((b) => calcularDashboard(b, periodo, agoraIso())),
  getFinanceiro: (periodo: Periodo = "mesAtual") => ler((b) => calcularFinanceiro(b, periodo, agoraIso())),

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
      return paginar([...lista].sort(ord[ordem]), paginacao);
    }),
  /** Bairros existentes (opções do filtro RF-21). */
  listBairros: () =>
    ler((b) => [...new Set(b.imoveis.map((i) => i.endereco.bairro))].sort((a, z) => a.localeCompare(z, "pt-BR"))),
  getImovel: (id: string) =>
    ler((b) => {
      const imovel = exigir(buscar(b, "imoveis", id), "Imóvel");
      return {
        imovel,
        corretor: buscar(b, "corretores", imovel.corretorId) ?? null,
        /** O que a UI pode oferecer (a regra está no domínio). */
        transicoes: transicoesPermitidasImovel(b, imovel),
        contratos: b.contratos
          .filter((c) => c.imovelId === id)
          .map((c) => ({ id: c.id, numero: c.numero, status: c.status })),
        leadsInteressados: b.leads.filter((l) => l.imoveisVistos.includes(id)).length,
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

  // --- Leads (RF-29…39) ------------------------------------------------------
  listLeads: (
    filtros: {
      busca?: string;
      responsavelId?: string;
      origens?: Origem[];
      etapas?: Etapa[];
      imovelId?: string;
      /** Criados entre (ISO, inclusive). */
      de?: string;
      ate?: string;
    } = {},
  ) =>
    ler((b) =>
      b.leads
        .filter(
          (l) =>
            (!filtros.busca || contem(l.nome, filtros.busca)) &&
            (!filtros.responsavelId || l.responsavelId === filtros.responsavelId) &&
            (!filtros.origens?.length || filtros.origens.includes(l.origem)) &&
            (!filtros.etapas?.length || filtros.etapas.includes(l.etapa)) &&
            (!filtros.imovelId || l.imoveisVistos.includes(filtros.imovelId)) &&
            (!filtros.de || l.criadoEm >= filtros.de) &&
            (!filtros.ate || l.criadoEm <= filtros.ate),
        )
        .sort((a, z) => ETAPAS.indexOf(a.etapa) - ETAPAS.indexOf(z.etapa) || a.ordem - z.ordem),
    ),
  getLead: (id: string) =>
    ler((b) => {
      const lead = exigir(buscar(b, "leads", id), "Lead");
      return {
        lead,
        responsavel: buscar(b, "corretores", lead.responsavelId) ?? null,
        imoveisVistos: lead.imoveisVistos.map((i) => buscar(b, "imoveis", i)).filter((i): i is Imovel => !!i),
        visitas: b.visitas.filter((v) => v.leadId === id).sort((a, z) => z.dataHora.localeCompare(a.dataHora)),
        contrato: b.contratos.find((c) => c.leadId === id) ?? null,
        transicoes: transicoesPermitidasLead(b, lead),
      };
    }),
  moveLead: (id: string, etapa: Etapa, ordem?: number, motivo?: MotivoPerda) =>
    escrever((b, c) => transicionarLead(b, { leadId: id, para: etapa, ordem, motivo }, c)),
  createLead: (dados: Omit<NovoLead, "responsavelId"> & { responsavelId?: string }) =>
    escrever((b, c) => criarLead(b, { ...dados, responsavelId: dados.responsavelId ?? c.autorId }, c)),
  setOrcamento: (id: string, orcamento: number | null) => escrever((b, c) => alterarOrcamento(b, id, orcamento, c)),
  addNota: (leadId: string, texto: string) => escrever((b, c) => adicionarNota(b, leadId, texto, c)),
  vincularContrato: (leadId: string, contratoId: string) =>
    escrever((b, c) => vincularContratoDominio(b, leadId, contratoId, c)),

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
        lead: contrato.leadId ? (buscar(b, "leads", contrato.leadId) ?? null) : null,
        statusExibicao: statusExibicao(contrato, hoje),
        inadimplente: estaInadimplente(contrato, hoje),
        parcelas: contrato.parcelas.map((p) => ({ ...p, status: statusParcela(contrato, p, hoje) })),
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
  search: (termo: string) =>
    ler((b) => {
      if (normalizar(termo).length < 2) return { imoveis: [], leads: [], contratos: [] };
      return {
        imoveis: b.imoveis.filter((i) => contem(i.codigo, termo) || contem(i.titulo, termo)).slice(0, 5),
        leads: b.leads.filter((l: Lead) => contem(l.nome, termo)).slice(0, 5),
        contratos: b.contratos.filter((c) => contem(c.numero, termo)).slice(0, 5),
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
