/**
 * Relatórios (RF-82): para cada um, gráfico, tabela acessível (RNF-17) e CSV a partir dos mesmos dados.
 * Só formata; os números vêm de `calcularRelatorios` (domínio) via fakeApi.
 */
import type { ReactNode } from "react";
import { BarrasRelatorioChart, barrasVazias } from "@/components/patterns/BarrasRelatorioChart";
import type { TabelaGrafico } from "@/components/patterns/ChartCard";
import { rotuloMes } from "@/components/patterns/ChartParts";
import { FunnelChart, funilVazio, resumoFunil, tabelaFunil } from "@/components/patterns/FunnelChart";
import { ETAPA_UI } from "@/components/patterns/rotulos";
import type { Periodo, Relatorios } from "@/domain";
import { montarCsv, reais } from "@/lib/csv";
import { formatMoeda, formatNumero, formatPercentual } from "@/lib/format";

export type DadosRelatorios = Relatorios & {
  nomes: { corretores: Record<string, string>; imoveis: Record<string, string> };
};

export const RELATORIOS = ["vendas", "corretores", "conversao", "procurados", "receita"] as const;
export type IdRelatorio = (typeof RELATORIOS)[number];
export const ehRelatorio = (v: string | undefined): v is IdRelatorio => RELATORIOS.includes(v as IdRelatorio);

export const PERIODO_ROTULO: Record<Periodo, string> = {
  mesAtual: "Mês atual",
  mesAnterior: "Mês anterior",
  ultimos3: "Últimos 3 meses",
  ultimos12: "Últimos 12 meses",
};

export type Relatorio = {
  aba: string;
  /** Uma linha: o que o relatório mostra (lista de relatórios). */
  descricao: string;
  titulo: string;
  tituloVazio: string;
  arquivo: string;
  vazio: (d: DadosRelatorios) => boolean;
  resumo: (d: DadosRelatorios) => string;
  tabela: (d: DadosRelatorios) => TabelaGrafico;
  grafico: (d: DadosRelatorios) => ReactNode;
  csv: (d: DadosRelatorios) => string;
};

const dinheiro = (c: number) => formatMoeda(c, { semCentavos: true });
const D = "right" as const;
const soma = (xs: number[]) => xs.reduce((s, x) => s + x, 0);

const vendas: Relatorio = {
  aba: "Vendas",
  descricao: "Quantidade e valor das vendas fechadas, mês a mês.",
  titulo: "Vendas por período",
  tituloVazio: "Nenhuma venda no período",
  arquivo: "relatorio-vendas.csv",
  vazio: (d) => d.vendasPorPeriodo.every((l) => l.quantidade === 0),
  resumo: ({ vendasPorPeriodo: l }) =>
    `${formatNumero(soma(l.map((x) => x.quantidade)))} vendas fechadas, somando ${dinheiro(soma(l.map((x) => x.valor)))}.`,
  tabela: ({ vendasPorPeriodo: l }) => ({
    rotulo: "Vendas por período",
    colunas: [{ rotulo: "Mês" }, { rotulo: "Vendas", alinhar: D }, { rotulo: "Valor", alinhar: D }],
    linhas: l.map((x) => [rotuloMes(x.mes, true), formatNumero(x.quantidade), dinheiro(x.valor)]),
  }),
  grafico: ({ vendasPorPeriodo: l }) => (
    <BarrasRelatorioChart
      categorias={l.map((x) => ({ rotulo: rotuloMes(x.mes), valores: [x.valor] }))}
      series={[{ rotulo: "Valor vendido", formato: "moeda" }]}
    />
  ),
  csv: ({ vendasPorPeriodo: l }) =>
    montarCsv(
      ["Mês", "Vendas", "Valor (R$)"],
      l.map((x) => [rotuloMes(x.mes, true), x.quantidade, reais(x.valor)]),
    ),
};

const corretores: Relatorio = {
  aba: "Corretores",
  descricao: "Negociações e receita de cada corretor.",
  titulo: "Desempenho dos corretores",
  tituloVazio: "Nenhum corretor no recorte",
  arquivo: "relatorio-corretores.csv",
  vazio: (d) => d.desempenhoCorretores.length === 0,
  resumo: ({ desempenhoCorretores: l }) =>
    `${formatNumero(l.length)} corretores. Maior receita: ${l[0]?.nome ?? "—"}, com ${dinheiro(l[0]?.receita ?? 0)}.`,
  tabela: ({ desempenhoCorretores: l }) => ({
    rotulo: "Desempenho dos corretores",
    colunas: [
      { rotulo: "Corretor" },
      { rotulo: "Negociações", alinhar: D },
      { rotulo: "Visitas realizadas", alinhar: D },
      { rotulo: "Contratos", alinhar: D },
      { rotulo: "Receita", alinhar: D },
      { rotulo: "Comissão", alinhar: D },
      { rotulo: "Meta", alinhar: D },
    ],
    linhas: l.map((x) => [
      x.nome,
      formatNumero(x.negociacoes),
      formatNumero(x.visitasRealizadas),
      formatNumero(x.contratosFechados),
      dinheiro(x.receita),
      dinheiro(x.comissao),
      dinheiro(x.meta),
    ]),
  }),
  grafico: ({ desempenhoCorretores: l }) => (
    <BarrasRelatorioChart
      horizontal
      categorias={l.map((x) => ({ rotulo: x.nome, valores: [x.receita, x.meta] }))}
      series={[
        { rotulo: "Receita", formato: "moeda" },
        { rotulo: "Meta", formato: "moeda" },
      ]}
    />
  ),
  csv: ({ desempenhoCorretores: l }) =>
    montarCsv(
      ["Corretor", "Negociações", "Visitas realizadas", "Contratos", "Receita (R$)", "Comissão (R$)", "Meta (R$)"],
      l.map((x) => [
        x.nome,
        x.negociacoes,
        x.visitasRealizadas,
        x.contratosFechados,
        reais(x.receita),
        reais(x.comissao),
        reais(x.meta),
      ]),
    ),
};

const conversao: Relatorio = {
  aba: "Conversão",
  descricao: "Do primeiro contato ao fechamento, etapa por etapa.",
  titulo: "Conversão de leads",
  tituloVazio: "Nenhum lead no período",
  arquivo: "relatorio-conversao.csv",
  vazio: (d) => funilVazio(d.conversaoLeads.funil),
  resumo: (d) => resumoFunil(d.conversaoLeads.funil),
  tabela: (d) => tabelaFunil(d.conversaoLeads.funil),
  grafico: (d) => <FunnelChart dados={d.conversaoLeads.funil} />,
  csv: (d) =>
    montarCsv(
      ["Etapa", "Leads", "Perdidos na etapa", "Conversão para a próxima"],
      d.conversaoLeads.funil
        .filter((l) => l.etapa !== "perdido")
        .map((l) => [
          ETAPA_UI[l.etapa].rotulo,
          l.quantidade,
          l.perdidos,
          l.conversao === null ? "" : formatPercentual(l.conversao),
        ]),
    ),
};

const procurados: Relatorio = {
  aba: "Imóveis",
  descricao: "Os imóveis com mais interesse no período.",
  titulo: "Imóveis mais procurados",
  tituloVazio: "Nenhuma procura no período",
  arquivo: "relatorio-imoveis-procurados.csv",
  vazio: (d) => d.imoveisMaisProcurados.length === 0,
  resumo: ({ imoveisMaisProcurados: l }) =>
    `${formatNumero(l.length)} imóveis. Mais procurado: ${l[0]?.titulo ?? "—"}, com ${formatNumero(l[0]?.total ?? 0)} contatos.`,
  tabela: ({ imoveisMaisProcurados: l }) => ({
    rotulo: "Imóveis mais procurados",
    colunas: [
      { rotulo: "Imóvel" },
      { rotulo: "Negociações", alinhar: D },
      { rotulo: "Visitas", alinhar: D },
      { rotulo: "Total", alinhar: D },
    ],
    linhas: l.map((x) => [
      `${x.titulo} (${x.codigo})`,
      formatNumero(x.negociacoes),
      formatNumero(x.visitas),
      formatNumero(x.total),
    ]),
  }),
  grafico: ({ imoveisMaisProcurados: l }) => (
    <BarrasRelatorioChart
      horizontal
      empilhado
      categorias={l.map((x) => ({ rotulo: x.codigo, valores: [x.negociacoes, x.visitas] }))}
      series={[
        { rotulo: "Negociações", formato: "numero" },
        { rotulo: "Visitas", formato: "numero" },
      ]}
    />
  ),
  csv: ({ imoveisMaisProcurados: l }) =>
    montarCsv(
      ["Código", "Imóvel", "Negociações", "Visitas", "Total"],
      l.map((x) => [x.codigo, x.titulo, x.negociacoes, x.visitas, x.total]),
    ),
};

const receita: Relatorio = {
  aba: "Receita",
  descricao: "Receita de vendas e locações por mês.",
  titulo: "Receita por período",
  tituloVazio: "Nenhuma receita no período",
  arquivo: "relatorio-receita.csv",
  vazio: (d) =>
    barrasVazias(d.receitaPorPeriodo.map((x) => ({ rotulo: x.mes, valores: [x.vendas, x.locacoes, x.despesas] }))),
  resumo: ({ receitaPorPeriodo: l }) =>
    `Receita de ${dinheiro(soma(l.map((x) => x.vendas + x.locacoes)))}, despesas de ${dinheiro(soma(l.map((x) => x.despesas)))} e resultado de ${dinheiro(soma(l.map((x) => x.resultado)))}.`,
  tabela: ({ receitaPorPeriodo: l }) => ({
    rotulo: "Receita por período",
    colunas: [
      { rotulo: "Mês" },
      { rotulo: "Vendas", alinhar: D },
      { rotulo: "Locações", alinhar: D },
      { rotulo: "Despesas", alinhar: D },
      { rotulo: "Resultado", alinhar: D },
    ],
    linhas: l.map((x) => [
      rotuloMes(x.mes, true),
      dinheiro(x.vendas),
      dinheiro(x.locacoes),
      dinheiro(x.despesas),
      dinheiro(x.resultado),
    ]),
  }),
  grafico: ({ receitaPorPeriodo: l }) => (
    <BarrasRelatorioChart
      categorias={l.map((x) => ({ rotulo: rotuloMes(x.mes), valores: [x.vendas, x.locacoes, x.despesas] }))}
      series={[
        { rotulo: "Vendas", formato: "moeda" },
        { rotulo: "Locações", formato: "moeda" },
        { rotulo: "Despesas", formato: "moeda" },
      ]}
    />
  ),
  csv: ({ receitaPorPeriodo: l }) =>
    montarCsv(
      ["Mês", "Vendas (R$)", "Locações (R$)", "Despesas (R$)", "Resultado (R$)"],
      l.map((x) => [rotuloMes(x.mes, true), reais(x.vendas), reais(x.locacoes), reais(x.despesas), reais(x.resultado)]),
    ),
};

export const DEFINICOES: Record<IdRelatorio, Relatorio> = { vendas, corretores, conversao, procurados, receita };
