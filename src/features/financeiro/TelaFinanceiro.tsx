"use client";
/**
 * Financeiro — resumo (RF-44, RF-45). Números calculados pelo domínio (`calcularFinanceiro` via fakeApi);
 * a tela só formata e monta. Período na URL (RF-06).
 */
import Link from "next/link";
import { useCallback } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ChartCard } from "@/components/patterns/ChartCard";
import { EstadoRecurso } from "@/components/patterns/EstadoRecurso";
import { IndicadorCard, type DadosIndicador } from "@/components/patterns/IndicadorCard";
import { RevenueChartCard } from "@/components/patterns/RevenueChart";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Heading } from "@/components/ui/Typography";
import { PERIODOS, type Periodo } from "@/domain";
import { useConsulta } from "@/features/dados/useConsulta";
import { useParametrosUrl } from "@/features/dados/useParametrosUrl";
import type { Recurso } from "@/lib/recurso";
import { formatMoeda, formatNumero, formatPercentual } from "@/lib/format";
import { fakeApi } from "@/mocks/services/fakeApi";
import { BarrasHorizontais } from "./BarrasHorizontais";

const PERIODO_ROTULO: Record<Periodo, string> = {
  mesAtual: "Mês atual",
  mesAnterior: "Mês anterior",
  ultimos3: "Últimos 3 meses",
  ultimos12: "Últimos 12 meses",
};
const REFERENCIA: Record<Periodo, string> = {
  mesAtual: "no mês",
  mesAnterior: "no mês anterior",
  ultimos3: "nos últimos 3 meses",
  ultimos12: "nos últimos 12 meses",
};
const ePeriodo = (v: string | undefined): v is Periodo => PERIODOS.includes(v as Periodo);

type Financeiro = Awaited<ReturnType<typeof fakeApi.getFinanceiro>>;
type Dados = { fin: Financeiro; corretores: Record<string, string> };

/** Deriva um `Recurso` de outro mantendo a fase (a mesma consulta alimenta todos os blocos). */
function mapear<T, U>(r: Recurso<T>, f: (d: T) => U): Recurso<U> {
  switch (r.fase) {
    case "idle":
      return r;
    case "loading":
      return { fase: "loading", dados: r.dados === undefined ? undefined : f(r.dados) };
    case "success":
      return { fase: "success", dados: f(r.dados) };
    case "partial":
      return { fase: "partial", dados: f(r.dados), aviso: r.aviso };
    case "error":
      return { fase: "error", erro: r.erro, dados: r.dados === undefined ? undefined : f(r.dados) };
  }
}

const dinheiro = (c: number) => formatMoeda(c, { semCentavos: true });
const parcelas = (n: number) => `${formatNumero(n)} ${n === 1 ? "parcela" : "parcelas"}`;

export function TelaFinanceiro() {
  const url = useParametrosUrl();
  const bruto = url.ler("periodo");
  const periodo: Periodo = ePeriodo(bruto) ? bruto : "mesAtual";

  const carregar = useCallback(async (): Promise<Dados> => {
    const [fin, corretores] = await Promise.all([fakeApi.getFinanceiro(periodo), fakeApi.listCorretores()]);
    return { fin, corretores: Object.fromEntries(corretores.map((c) => [c.id, c.nome])) };
  }, [periodo]);
  const { estado, recarregar } = useConsulta(carregar);

  const ref = REFERENCIA[periodo];
  const ind = (f: (d: Dados) => DadosIndicador): Recurso<DadosIndicador> => mapear(estado, f);

  const faixasEstado = mapear(estado, (d) => d.fin.atrasadasPorFaixa);
  const comissoesEstado = mapear(estado, (d) =>
    d.fin.comissoesPorCorretor.map((c) => ({
      id: c.corretorId,
      rotulo: d.corretores[c.corretorId] ?? "Corretor removido",
      valor: c.valor,
      texto: dinheiro(c.valor),
    })),
  );

  return (
    <>
      <PageHeader
        titulo="Financeiro"
        acoes={
          <Select
            aria-label="Período"
            value={periodo}
            onValueChange={(v) => url.definir({ periodo: v === "mesAtual" ? undefined : v })}
            options={PERIODOS.map((p) => ({ value: p, label: PERIODO_ROTULO[p] }))}
          />
        }
      />
      <div className="flex min-w-0 flex-col gap-6">
        <section aria-label="Indicadores financeiros" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <IndicadorCard
            rotulo="Receita recebida"
            estado={ind((d) => ({ valor: dinheiro(d.fin.recebido), detalhe: `Pagamentos recebidos ${ref}` }))}
            onTentarNovamente={recarregar}
          />
          <IndicadorCard
            rotulo="A receber"
            estado={ind((d) => ({ valor: dinheiro(d.fin.aReceber), detalhe: `Parcelas a vencer ${ref}` }))}
            onTentarNovamente={recarregar}
          />
          <IndicadorCard
            rotulo="Inadimplência"
            estado={ind((d) => ({
              valor: dinheiro(d.fin.inadimplencia.valor),
              detalhe: `${formatPercentual(d.fin.inadimplencia.percentual)} das parcelas vencidas`,
              tom: d.fin.inadimplencia.valor > 0 ? "alerta" : "neutro",
            }))}
            onTentarNovamente={recarregar}
          />
          <IndicadorCard
            rotulo="Comissões"
            estado={ind((d) => ({ valor: dinheiro(d.fin.comissoes), detalhe: `Competência ${ref}` }))}
            onTentarNovamente={recarregar}
          />
        </section>

        <RevenueChartCard estado={mapear(estado, (d) => d.fin.receitaPorMes)} onTentarNovamente={recarregar} />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <ChartCard
            titulo="Comissões por corretor"
            estado={comissoesEstado}
            onTentarNovamente={recarregar}
            estaVazio={(d) => d.length === 0}
            tituloVazio="Nenhuma comissão no período"
            descricaoVazio="As comissões de contratos ativos e encerrados aparecem aqui."
            resumo={(d) => {
              const total = d.reduce((s, i) => s + i.valor, 0);
              return `${dinheiro(total)} em comissões ${ref}. Maior: ${d[0]!.rotulo}, com ${d[0]!.texto}.`;
            }}
            tabela={(d) => ({
              rotulo: "Comissões por corretor",
              colunas: [{ rotulo: "Corretor" }, { rotulo: "Comissão", alinhar: "right" }],
              linhas: d.map((i) => [i.rotulo, i.texto]),
            })}
            grafico={(d) => <BarrasHorizontais itens={d} />}
          />

          <Card className="flex min-w-0 flex-col gap-4 p-4 sm:p-6">
            <Heading level={3} size="lg">
              Parcelas atrasadas
            </Heading>
            <EstadoRecurso
              estado={faixasEstado}
              carregando={<Skeleton shape="rect" className="h-40" />}
              onTentarNovamente={recarregar}
              erro={{ titulo: "Não foi possível carregar as parcelas atrasadas" }}
            >
              {(faixas) => (
                <ul
                  aria-label="Parcelas atrasadas por faixa de atraso"
                  className="flex flex-col divide-y divide-border"
                >
                  {faixas.map((f) => (
                    <li
                      key={f.faixa}
                      className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-text">
                          {f.faixa === "60+" ? "Mais de 60 dias" : `${f.faixa.replace("-", " a ")} dias`}
                        </span>
                        <span className="tnum text-sm text-text-muted">{parcelas(f.quantidade)}</span>
                      </div>
                      <div className="flex items-baseline gap-3">
                        <span className="tnum font-semibold text-text">{dinheiro(f.valor)}</span>
                        {f.quantidade > 0 ? (
                          <Link
                            href="/contratos?status=inadimplente"
                            aria-label={`Ver contratos inadimplentes (faixa ${f.faixa} dias)`}
                            className="text-sm text-primary underline-offset-4 hover:underline"
                          >
                            Ver contratos
                          </Link>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </EstadoRecurso>
          </Card>
        </div>
      </div>
    </>
  );
}
