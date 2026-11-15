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
import { RevenueChartCard } from "@/components/patterns/RevenueChart";
import { SectionCard } from "@/components/patterns/SectionCard";
import { StatCard } from "@/components/patterns/StatCard";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { PERIODOS, type Periodo } from "@/domain";
import { useConsulta } from "@/features/dados/useConsulta";
import { useParametrosUrl } from "@/features/dados/useParametrosUrl";
import { formatMoeda, formatNumero } from "@/lib/format";
import { mapear } from "@/lib/recurso";
import { fakeApi } from "@/mocks/services/fakeApi";

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
  const valor = (f: (d: Dados) => number, alerta = false) =>
    mapear(estado, (d) => ({ valor: f(d), tom: alerta && f(d) > 0 ? ("alerta" as const) : ("neutro" as const) }));

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
        <h2 className="sr-only">Indicadores</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            rotulo="Receita recebida"
            formato="moedaCompleta"
            estado={valor((d) => d.fin.recebido)}
            onTentarNovamente={recarregar}
          />
          <StatCard
            rotulo="A receber"
            formato="moedaCompleta"
            estado={valor((d) => d.fin.aReceber)}
            onTentarNovamente={recarregar}
          />
          <StatCard
            rotulo="Inadimplência"
            formato="moedaCompleta"
            estado={valor((d) => d.fin.inadimplencia.valor, true)}
            onTentarNovamente={recarregar}
          />
          <StatCard
            rotulo="Comissões"
            formato="moedaCompleta"
            estado={valor((d) => d.fin.comissoes)}
            onTentarNovamente={recarregar}
          />
        </div>

        <h2 className="sr-only">Receita e comissões</h2>
        <RevenueChartCard estado={mapear(estado, (d) => d.fin.receitaPorMes)} onTentarNovamente={recarregar} />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <ChartCard
            titulo="Comissões por corretor"
            estado={comissoesEstado}
            onTentarNovamente={recarregar}
            estaVazio={(d) => d.length === 0}
            tituloVazio="Nenhuma comissão no período"
            resumo={(d) => {
              const total = d.reduce((s, i) => s + i.valor, 0);
              return `${dinheiro(total)} em comissões ${ref}. Maior: ${d[0]!.rotulo}, com ${d[0]!.texto}.`;
            }}
            tabela={(d) => ({
              rotulo: "Comissões por corretor",
              colunas: [{ rotulo: "Corretor" }, { rotulo: "Comissão", alinhar: "right" }],
              linhas: d.map((i) => [i.rotulo, i.texto]),
            })}
            grafico={(d) => {
              const maior = Math.max(1, ...d.map((i) => i.valor));
              return (
                <ul className="flex flex-col gap-3">
                  {d.map((i) => (
                    <li key={i.id}>
                      <Progress value={(i.valor / maior) * 100} label={`${i.rotulo}: ${i.texto}`} hideValue />
                    </li>
                  ))}
                </ul>
              );
            }}
          />

          <SectionCard titulo="Parcelas atrasadas">
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
                          <Button asChild variant="link">
                            <Link href="/contratos?status=inadimplente" aria-label="Ver contratos inadimplentes">
                              Ver contratos
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </EstadoRecurso>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
