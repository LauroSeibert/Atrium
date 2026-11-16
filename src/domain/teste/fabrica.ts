import type { Anuncio } from "../anuncio/schema";
import type { Base } from "../comum/base";
import { BASE_VAZIA } from "../comum/base";
import type { Contexto } from "../comum/tipos";
import type { Contato } from "../contato/schema";
import type { Contrato } from "../contrato/schema";
import type { Corretor } from "../corretor/schema";
import type { Despesa } from "../despesa/schema";
import type { Documento } from "../documento/schema";
import type { Imovel } from "../imovel/schema";
import type { Lead } from "../lead/schema";
import type { Negociacao } from "../negociacao/schema";
import type { Visita } from "../visita/schema";

/** Fábricas mínimas e válidas para os testes do domínio (dados fictícios). */

export const AGORA = "2026-11-14T13:00:00.000Z";
export const CTX: Contexto = { autorId: "cor_a", agora: AGORA };
/** Contexto posterior, para provar que desfazer restaura `atualizadoEm`. */
export const CTX_DEPOIS: Contexto = { autorId: "cor_b", agora: "2026-11-15T10:00:00.000Z" };
export const CRIADO = "2026-01-10T12:00:00.000Z";

export function corretor(over: Partial<Corretor> = {}): Corretor {
  return {
    id: "cor_a",
    nome: "Ana Teste",
    email: "ana@example.com",
    telefone: "11999990000",
    creci: "CRECI-SP 12345-F",
    avatar: { iniciais: "AT" },
    papel: "gestor",
    metaMensal: 1_000_000,
    ativo: true,
    ...over,
  };
}

export function imovel(over: Partial<Imovel> = {}): Imovel {
  return {
    id: "imv_a",
    codigo: "AT-0001",
    status: "disponivel",
    favorito: false,
    motivoInativo: null,
    criadoEm: CRIADO,
    atualizadoEm: CRIADO,
    titulo: "Apartamento teste",
    descricao: "Descrição",
    tipo: "apartamento",
    finalidade: "venda",
    preco: 30_000_000,
    condominio: 80_000,
    iptu: 20_000,
    areaUtil: 80,
    areaTotal: 100,
    quartos: 2,
    suites: 1,
    banheiros: 2,
    vagas: 1,
    endereco: { logradouro: "Rua A", numero: "1", bairro: "Centro", cidade: "São Paulo", uf: "SP", cep: "01000000" },
    comodos: [{ tipo: "sala", nome: "Sala", area: 20 }],
    diferenciais: [],
    corretorId: "cor_a",
    fachada: null,
    ...over,
  };
}

export function lead(over: Partial<Lead> = {}): Lead {
  return {
    id: "lead_a",
    nome: "Lead Teste",
    contato: { telefone: "11988887777" },
    origem: "site",
    interesse: { finalidade: "venda", tipos: [], bairros: [] },
    orcamento: null,
    imoveisVistos: [],
    responsavelId: "cor_a",
    criadoEm: CRIADO,
    atualizadoEm: CRIADO,
    ...over,
  };
}

/** Negociação mínima: lead_a × imv_a em `novo`. */
export function negociacao(over: Partial<Negociacao> = {}): Negociacao {
  return {
    id: "neg_a",
    leadId: "lead_a",
    imovelId: "imv_a",
    etapa: "novo",
    motivoPerda: null,
    responsavelId: "cor_a",
    ordem: 0,
    criadoEm: CRIADO,
    atualizadoEm: CRIADO,
    ...over,
  };
}

export function contato(over: Partial<Contato> = {}): Contato {
  return {
    id: "ctt_a",
    nome: "Contato Teste",
    papel: "proprietario",
    telefone: "11977776666",
    imovelIds: ["imv_a"],
    contratoIds: [],
    criadoEm: CRIADO,
    atualizadoEm: CRIADO,
    ...over,
  };
}

export function anuncio(over: Partial<Anuncio> = {}): Anuncio {
  return {
    id: "anc_a",
    imovelId: "imv_a",
    canal: "site",
    status: "rascunho",
    publicadoEm: null,
    visualizacoes: 0,
    contatos: 0,
    criadoEm: CRIADO,
    atualizadoEm: CRIADO,
    ...over,
  };
}

export function documento(over: Partial<Documento> = {}): Documento {
  return {
    id: "doc_a",
    contratoId: "ctr_a",
    tipo: "matricula",
    nome: "matricula.pdf",
    mime: "application/pdf",
    tamanho: 120_000,
    arquivoId: null,
    enviadoPorId: "cor_a",
    enviadoEm: CRIADO,
    ...over,
  };
}

export function despesa(over: Partial<Despesa> = {}): Despesa {
  return {
    id: "dsp_a",
    categoria: "imposto",
    descricao: "ITBI",
    valor: 900_000,
    vencimento: "2026-11-20",
    pagaEm: null,
    contratoId: null,
    criadoEm: CRIADO,
    atualizadoEm: CRIADO,
    ...over,
  };
}

export function contrato(over: Partial<Contrato> = {}): Contrato {
  return {
    id: "ctr_a",
    numero: "CT-2026-0001",
    tipo: "venda",
    imovelId: "imv_a",
    negociacaoId: null,
    partes: [
      { papel: "comprador", nome: "Comprador Teste", documento: "12345678901" },
      { papel: "vendedor", nome: "Vendedor Teste", documento: "10987654321" },
    ],
    valor: 30_000_000,
    inicio: "2026-12-01",
    fim: "2027-12-01",
    status: "rascunho",
    motivoCancelamento: null,
    taxaAdministracao: null,
    parcelas: [],
    comissoes: [],
    criadoEm: CRIADO,
    atualizadoEm: CRIADO,
    ...over,
  };
}

/** Contrato de locação mínimo (taxa de administração 10 %). */
export function contratoLocacao(over: Partial<Contrato> = {}): Contrato {
  return contrato({
    tipo: "locacao",
    valor: 300_000,
    inicio: "2026-01-01",
    fim: "2026-04-01",
    taxaAdministracao: 10,
    partes: [
      { papel: "locatario", nome: "Locatário Teste", documento: "12345678901" },
      { papel: "locador", nome: "Locador Teste", documento: "10987654321" },
    ],
    ...over,
  });
}

export function visita(over: Partial<Visita> = {}): Visita {
  return {
    id: "vis_a",
    imovelId: "imv_a",
    leadId: "lead_a",
    corretorId: "cor_a",
    dataHora: "2026-11-20T13:00:00.000Z",
    status: "agendada",
    ...over,
  };
}

/** Base mínima válida: 2 corretores, 1 imóvel de venda disponível, 1 lead com 1 negociação em `novo`. */
export function baseMinima(over: Partial<Base> = {}): Base {
  return {
    ...BASE_VAZIA,
    corretores: [corretor(), corretor({ id: "cor_b", nome: "Beto Teste", email: "beto@example.com" })],
    imoveis: [imovel()],
    leads: [lead()],
    negociacoes: [negociacao()],
    ...over,
  };
}
