/**
 * Máquina de estado do Contrato (`status`) e ação de pagamento de parcela —
 * ESTADOS-E-FLUXOS §3.3/§3.4, RF-42, RF-43, RF-48. Único ponto que leva o imóvel a
 * vendido/alugado e de volta a disponível.
 */
import type { Base } from "../comum/base";
import { transacao, type Mudanca } from "../comum/transacao";
import {
  OperacaoInvalida,
  PERMITIDO,
  TransicaoInvalida,
  dataLocal,
  negar,
  type Contexto,
  type Permissao,
} from "../comum/tipos";
import { transicionarImovelPorContrato } from "../imovel/estado";
import type { Imovel } from "../imovel/schema";
import type { Comissao, Contrato, Parcela, StatusContrato, TipoContrato } from "./schema";

export const TRANSICOES_CONTRATO: Readonly<Record<StatusContrato, readonly StatusContrato[]>> = {
  rascunho: ["ativo", "cancelado"],
  ativo: ["encerrado", "cancelado"],
  encerrado: [],
  cancelado: [],
};

// ---------------------------------------------------------------------------
// Cronograma e comissões (puros; usados na assinatura e pelo gerador do mock)
// ---------------------------------------------------------------------------

function somarMeses(dataIso: string, meses: number): string {
  const [a, m, d] = dataIso.split("-").map(Number) as [number, number, number];
  const total = a * 12 + (m - 1) + meses;
  const dia = Math.min(d, 28);
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

export function mesesEntre(inicio: string, fim: string): number {
  const [a1, m1] = inicio.split("-").map(Number) as [number, number];
  const [a2, m2] = fim.split("-").map(Number) as [number, number];
  return (a2 - a1) * 12 + (m2 - m1);
}

/**
 * Invariante 7. Venda: `n` parcelas mensais a partir do início, somando exatamente `valor`
 * (resto na última). Locação: uma por mês de vigência, cada uma = `valor`.
 */
export function gerarParcelas(c: Pick<Contrato, "tipo" | "valor" | "inicio" | "fim">, parcelasVenda = 1): Parcela[] {
  if (c.tipo === "locacao") {
    const n = Math.max(1, mesesEntre(c.inicio, c.fim));
    return Array.from({ length: n }, (_, i) => ({
      numero: i + 1,
      vencimento: somarMeses(c.inicio, i),
      valor: c.valor,
      pagoEm: null,
    }));
  }
  const n = Math.max(1, Math.floor(parcelasVenda));
  const cada = Math.floor(c.valor / n);
  return Array.from({ length: n }, (_, i) => ({
    numero: i + 1,
    vencimento: somarMeses(c.inicio, i),
    valor: i === n - 1 ? c.valor - cada * (n - 1) : cada,
    pagoEm: null,
  }));
}

/** Base: venda = valor total; locação = primeiro aluguel. Competência = mês do início. */
export function gerarComissao(
  c: Pick<Contrato, "tipo" | "valor" | "inicio">,
  corretorId: string,
  percentual: number,
): Comissao {
  return {
    corretorId,
    percentual,
    base: c.valor,
    valor: Math.round((c.valor * percentual) / 100),
    competencia: c.inicio.slice(0, 7),
    pagaEm: null,
  };
}

/** Usado na assinatura quando o rascunho não definiu comissões. */
export const PERCENTUAL_COMISSAO_PADRAO: Readonly<Record<TipoContrato, number>> = { venda: 6, locacao: 10 };

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

export type Comando = { para: "ativo" } | { para: "encerrado" } | { para: "cancelado"; motivo: string };

export function podeTransicionarContrato(
  base: Pick<Base, "imoveis">,
  contrato: Contrato,
  para: StatusContrato,
  hoje: string,
): Permissao {
  if (!TRANSICOES_CONTRATO[contrato.status].includes(para))
    return negar(`Contrato ${contrato.status} não pode ir para ${para}.`);
  const imovel = base.imoveis.find((i) => i.id === contrato.imovelId);
  if (!imovel) return negar("Imóvel do contrato não encontrado.");
  if (para === "ativo") {
    if (imovel.status !== "disponivel" && imovel.status !== "reservado")
      return negar("O imóvel precisa estar disponível ou reservado.");
    if (imovel.finalidade !== contrato.tipo) return negar("O tipo do contrato precisa ser a finalidade do imóvel.");
  }
  if (para === "encerrado") {
    if (contrato.tipo === "locacao" && dataLocal(hoje) < contrato.fim)
      return negar("A locação só encerra quando a vigência termina.");
    if (contrato.tipo === "venda" && contrato.parcelas.some((p) => !p.pagoEm))
      return negar("A venda só encerra (escritura) com todas as parcelas pagas.");
  }
  return PERMITIDO;
}

export function transicoesPermitidasContrato(base: Pick<Base, "imoveis">, contrato: Contrato, hoje: string) {
  return TRANSICOES_CONTRATO[contrato.status]
    .filter((para) => podeTransicionarContrato(base, contrato, para, hoje).ok)
    .map((para) => ({ para, exigeMotivo: para === "cancelado" }));
}

const statusDoImovel = (tipo: TipoContrato): Imovel["status"] => (tipo === "venda" ? "vendido" : "alugado");

/** `transicionarContrato`: assinar, encerrar ou cancelar, com todos os efeitos. */
export function transicionarContrato(base: Base, contratoId: string, cmd: Comando, ctx: Contexto): Mudanca<Contrato> {
  return transacao(base, ctx, (t) => {
    const c = t.get("contratos", contratoId);
    const p = podeTransicionarContrato(base, c, cmd.para, ctx.agora);
    if (!p.ok) throw new TransicaoInvalida("contrato", c.status, cmd.para, p.motivo);

    let novo: Contrato;
    if (cmd.para === "ativo") {
      const imovel = t.get("imoveis", c.imovelId);
      novo = {
        ...c,
        status: "ativo",
        parcelas: c.parcelas.length ? c.parcelas : gerarParcelas(c),
        comissoes: c.comissoes.length
          ? c.comissoes
          : [gerarComissao(c, imovel.corretorId, PERCENTUAL_COMISSAO_PADRAO[c.tipo])],
      };
      transicionarImovelPorContrato(t, c.imovelId, statusDoImovel(c.tipo), c.id);
    } else if (cmd.para === "encerrado") {
      novo = { ...c, status: "encerrado" };
      if (c.tipo === "locacao") transicionarImovelPorContrato(t, c.imovelId, "disponivel", c.id);
    } else {
      if (!cmd.motivo.trim())
        throw new TransicaoInvalida("contrato", c.status, "cancelado", "Informe o motivo do cancelamento.");
      novo = { ...c, status: "cancelado", motivoCancelamento: cmd.motivo.trim() };
      // Só um contrato ativo mudou o imóvel; cancelar rascunho não mexe nele.
      if (c.status === "ativo") transicionarImovelPorContrato(t, c.imovelId, "disponivel", c.id);
    }
    const salvo = t.put("contratos", novo);
    t.atividade({
      tipo: "statusAlterado",
      alvo: { tipo: "contrato", id: c.id },
      relacionados: [{ tipo: "imovel", id: c.imovelId }],
      dados: { de: c.status, para: cmd.para, motivo: cmd.para === "cancelado" ? cmd.motivo.trim() : null },
    });
    return salvo;
  });
}

export function podeRegistrarPagamento(contrato: Contrato, numero: number): Permissao {
  if (contrato.status !== "ativo") return negar("Só contratos ativos recebem pagamento.");
  const parcela = contrato.parcelas.find((p) => p.numero === numero);
  if (!parcela) return negar("Parcela não encontrada.");
  if (parcela.pagoEm) return negar("Parcela já paga.");
  return PERMITIDO;
}

/** RF-43. Grava `pagoEm`; Atividade `pagamentoRegistrado`; registro `parcela.N.pagoEm`. */
export function registrarPagamento(base: Base, contratoId: string, numero: number, ctx: Contexto) {
  return transacao(base, ctx, (t) => {
    const c = t.get("contratos", contratoId);
    const p = podeRegistrarPagamento(c, numero);
    if (!p.ok) throw new OperacaoInvalida(p.motivo);
    const parcela = c.parcelas.find((x) => x.numero === numero)!;
    const salvo = t.put("contratos", {
      ...c,
      parcelas: c.parcelas.map((x) => (x.numero === numero ? { ...x, pagoEm: ctx.agora } : x)),
    });
    t.atividade({
      tipo: "pagamentoRegistrado",
      alvo: { tipo: "contrato", id: c.id },
      relacionados: [{ tipo: "imovel", id: c.imovelId }],
      dados: { numero, valor: parcela.valor },
    });
    return salvo;
  });
}
