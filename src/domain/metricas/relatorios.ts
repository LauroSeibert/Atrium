/**
 * Relatórios (RF-82): cinco relatórios calculados na consulta, pelo relógio do mock. Puros e
 * determinísticos; a tela só formata, desenha e exporta.
 *
 * Regras comuns: "contrato fechado" = ativo ou encerrado, no mês do `inicio` (mesma regra de
 * `MetricaMensal.contratosFechados`); o corretor de um contrato é o da 1ª comissão (senão, o do imóvel).
 */
import type { Base } from "../comum/base";
import type { Contrato } from "../contrato/schema";
import {
  contaComissao,
  contaReceita,
  funilDeNegociacoes,
  mesDe,
  mesesDoPeriodo,
  type Funil,
  type Periodo,
} from "./metricas";

export type FiltrosRelatorios = { periodo: Periodo; corretorId?: string };

export type LinhaVendas = { mes: string; quantidade: number; valor: number };
export type LinhaDesempenho = {
  corretorId: string;
  nome: string;
  /** Negociações sob responsabilidade dele criadas no período. */
  negociacoes: number;
  visitasRealizadas: number;
  contratosFechados: number;
  /** Parcelas recebidas no período dos contratos dele. */
  receita: number;
  /** Comissões com competência no período. */
  comissao: number;
  /** Meta mensal × meses do período. */
  meta: number;
};
export type LinhaProcura = {
  imovelId: string;
  codigo: string;
  titulo: string;
  negociacoes: number;
  visitas: number;
  total: number;
};
export type LinhaReceitaPeriodo = {
  mes: string;
  vendas: number;
  locacoes: number;
  despesas: number;
  resultado: number;
};

export type Relatorios = {
  periodo: Periodo;
  corretorId: string | null;
  meses: string[];
  /** Contratos de venda fechados por mês (quantidade e valor). */
  vendasPorPeriodo: LinhaVendas[];
  desempenhoCorretores: LinhaDesempenho[];
  /** Funil das negociações criadas no período, com a taxa de conversão de cada etapa. */
  conversaoLeads: { total: number; funil: Funil };
  /** Ranking (até 10) por negociações criadas + visitas (não canceladas) no período. */
  imoveisMaisProcurados: LinhaProcura[];
  /** Recebido por mês (vendas × locações) menos despesas pagas. */
  receitaPorPeriodo: LinhaReceitaPeriodo[];
};

export const LIMITE_MAIS_PROCURADOS = 10;

export function corretorDoContrato(base: Pick<Base, "imoveis">, c: Contrato): string | undefined {
  return c.comissoes[0]?.corretorId ?? base.imoveis.find((i) => i.id === c.imovelId)?.corretorId;
}

/** `hoje` = instante ISO. */
export function calcularRelatorios(base: Base, filtros: FiltrosRelatorios, hoje: string): Relatorios {
  const meses = mesesDoPeriodo(filtros.periodo, hoje).atual;
  const noPeriodo = (iso: string) => meses.includes(mesDe(iso));
  const cor = filtros.corretorId;
  const doCorretor = (c: Contrato, id = cor) => !id || corretorDoContrato(base, c) === id;
  const contratosFechados = base.contratos.filter((c) => contaComissao(c) && meses.includes(c.inicio.slice(0, 7)));

  // 1. Vendas por período
  const vendasPorPeriodo = meses.map((mes) => {
    const doMes = contratosFechados.filter((c) => c.tipo === "venda" && c.inicio.startsWith(mes) && doCorretor(c));
    return { mes, quantidade: doMes.length, valor: doMes.reduce((s, c) => s + c.valor, 0) };
  });

  // 2. Desempenho dos corretores
  const desempenhoCorretores = base.corretores
    .filter((c) => c.ativo && c.papel === "corretor" && (!cor || c.id === cor))
    .map((c) => {
      let receita = 0;
      let comissao = 0;
      for (const k of base.contratos) {
        if (contaReceita(k) && doCorretor(k, c.id))
          for (const p of k.parcelas) if (p.pagoEm && noPeriodo(p.pagoEm)) receita += p.valor;
        if (contaComissao(k))
          for (const m of k.comissoes) if (m.corretorId === c.id && meses.includes(m.competencia)) comissao += m.valor;
      }
      return {
        corretorId: c.id,
        nome: c.nome,
        negociacoes: base.negociacoes.filter((n) => n.responsavelId === c.id && noPeriodo(n.criadoEm)).length,
        visitasRealizadas: base.visitas.filter(
          (v) => v.corretorId === c.id && v.status === "realizada" && noPeriodo(v.dataHora),
        ).length,
        contratosFechados: contratosFechados.filter((k) => doCorretor(k, c.id)).length,
        receita,
        comissao,
        meta: c.metaMensal * meses.length,
      };
    })
    .sort((a, b) => b.receita - a.receita || a.nome.localeCompare(b.nome, "pt-BR"));

  // 3. Conversão de leads (funil de negociações criadas no período)
  const negociacoesNoPeriodo = base.negociacoes.filter(
    (n) => noPeriodo(n.criadoEm) && (!cor || n.responsavelId === cor),
  );
  const conversaoLeads = {
    total: negociacoesNoPeriodo.length,
    funil: funilDeNegociacoes(base, { negociacoes: negociacoesNoPeriodo }),
  };

  // 4. Imóveis mais procurados. Com filtro de corretor, conta só a procura que passou por ele
  // (negociações sob sua responsabilidade e visitas que ele conduziu), em qualquer imóvel.
  const procura = new Map<string, { negociacoes: number; visitas: number }>();
  const somar = (id: string, campo: "negociacoes" | "visitas") => {
    const atual = procura.get(id) ?? { negociacoes: 0, visitas: 0 };
    procura.set(id, { ...atual, [campo]: atual[campo] + 1 });
  };
  for (const n of base.negociacoes)
    if (n.imovelId && noPeriodo(n.criadoEm) && (!cor || n.responsavelId === cor)) somar(n.imovelId, "negociacoes");
  for (const v of base.visitas)
    if (v.status !== "cancelada" && noPeriodo(v.dataHora) && (!cor || v.corretorId === cor))
      somar(v.imovelId, "visitas");
  const imoveisMaisProcurados = base.imoveis
    .filter((i) => procura.has(i.id))
    .map((i) => {
      const p = procura.get(i.id)!;
      return { imovelId: i.id, codigo: i.codigo, titulo: i.titulo, ...p, total: p.negociacoes + p.visitas };
    })
    .sort((a, b) => b.total - a.total || b.negociacoes - a.negociacoes || a.codigo.localeCompare(b.codigo))
    .slice(0, LIMITE_MAIS_PROCURADOS);

  // 5. Receita por período
  const contratoPorId = new Map(base.contratos.map((c) => [c.id, c]));
  const receitaPorPeriodo = meses.map((mes) => {
    let vendas = 0;
    let locacoes = 0;
    for (const c of base.contratos) {
      if (!contaReceita(c) || !doCorretor(c)) continue;
      for (const p of c.parcelas)
        if (p.pagoEm && mesDe(p.pagoEm) === mes) {
          if (c.tipo === "venda") vendas += p.valor;
          else locacoes += p.valor;
        }
    }
    const despesas = base.despesas
      .filter((d) => d.pagaEm && mesDe(d.pagaEm) === mes)
      .filter((d) => {
        if (!cor) return true;
        const c = d.contratoId ? contratoPorId.get(d.contratoId) : undefined;
        return !!c && doCorretor(c);
      })
      .reduce((s, d) => s + d.valor, 0);
    return { mes, vendas, locacoes, despesas, resultado: vendas + locacoes - despesas };
  });

  return {
    periodo: filtros.periodo,
    corretorId: cor ?? null,
    meses,
    vendasPorPeriodo,
    desempenhoCorretores,
    conversaoLeads,
    imoveisMaisProcurados,
    receitaPorPeriodo,
  };
}
