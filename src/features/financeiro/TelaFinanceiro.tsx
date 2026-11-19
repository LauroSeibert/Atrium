"use client";
/**
 * Financeiro — resumo (RF-44, RF-45). Números calculados pelo domínio (`calcularFinanceiro` via fakeApi);
 * a tela só formata e monta. Período na URL (RF-06).
 */
import { Download } from "lucide-react";
import Link from "next/link";
import { useCallback, useId } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ChartCard } from "@/components/patterns/ChartCard";
import { EstadoRecurso } from "@/components/patterns/EstadoRecurso";
import { LinkCodigo } from "@/components/patterns/LinkCodigo";
import { RevenueChartCard } from "@/components/patterns/RevenueChart";
import { STATUS_PARCELA_UI } from "@/components/patterns/rotulos";
import { SectionCard } from "@/components/patterns/SectionCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Destaque, Eyebrow } from "@/components/ui/Typography";
import { PERIODOS, type Periodo } from "@/domain";
import { useConsulta } from "@/features/dados/useConsulta";
import { useParametrosUrl } from "@/features/dados/useParametrosUrl";
import { baixarCsv, montarCsv, reais } from "@/lib/csv";
import { cn } from "@/lib/cn";
import { formatData, formatMoeda, formatNumero, formatPercentual } from "@/lib/format";
import { mapear } from "@/lib/recurso";
import { fakeApi } from "@/mocks/services/fakeApi";
import type { LinhaReceitaTela } from "./tipos";

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
type Dados = { fin: Financeiro; corretores: Record<string, string>; proximos: LinhaReceitaTela[] };

const PROXIMOS = 5;
const dinheiro = (c: number) => formatMoeda(c, { semCentavos: true });
const parcelas = (n: number) => `${formatNumero(n)} ${n === 1 ? "parcela" : "parcelas"}`;

/**
 * Receita prevista no período: recebido + a receber, os dois recortados pelo mesmo período no domínio.
 * A inadimplência fica de fora porque o domínio a conta até hoje, sem recorte de período (aparece na grade).
 */
function composicao(fin: Financeiro) {
  const itens = [
    { id: "recebido", rotulo: "Recebido", valor: fin.recebido, cor: "bg-accent" },
    { id: "aReceber", rotulo: "A receber", valor: fin.aReceber, cor: "bg-text-2" },
  ];
  const total = itens.reduce((s, i) => s + i.valor, 0);
  return { total, itens: itens.map((i) => ({ ...i, fracao: total > 0 ? i.valor / total : 0 })) };
}

function Hero({ fin, rotulo }: { fin: Financeiro; rotulo: string }) {
  const { total, itens } = composicao(fin);
  const resumo = itens.map((i) => `${i.rotulo} ${formatPercentual(i.fracao)}`).join(", ");
  return (
    <section
      aria-label="Resultado e receita prevista"
      className="tinta flex flex-col gap-10 rounded-xl bg-ink-panel p-6 sm:p-8 lg:flex-row lg:items-end lg:gap-14 lg:p-10"
    >
      <div className="min-w-0 flex-1">
        <Eyebrow>{rotulo}</Eyebrow>
        <p className="mt-4 min-w-0 [overflow-wrap:anywhere] text-text">
          <Destaque valor={formatMoeda(fin.resultado)} size="6xl" />
        </p>
        <p className="mt-3.5 text-sm text-text-muted">Receita recebida menos despesas pagas.</p>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-4">
          <Eyebrow>Receita prevista</Eyebrow>
          <span className="num text-xs text-text-2">{formatMoeda(total)}</span>
        </div>
        <div role="img" aria-label={resumo} className="mt-3.5 flex h-2.5 gap-0.75">
          {total > 0 ? (
            itens.map((i) =>
              i.fracao > 0 ? (
                <div
                  key={i.id}
                  className={cn("rounded-xs", i.cor)}
                  style={{ width: `${(i.fracao * 100).toFixed(2)}%` }}
                />
              ) : null,
            )
          ) : (
            <div className="w-full rounded-xs bg-ink-track" />
          )}
        </div>
        <dl className="mt-4.5 grid grid-cols-2 gap-4">
          {itens.map((i) => (
            <div key={i.id} className="min-w-0">
              <dt className="flex items-center gap-1.5 text-xs text-text-muted">
                <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-xs", i.cor)} />
                {i.rotulo}
              </dt>
              <dd className="mt-1.5 num text-md text-text">{formatPercentual(i.fracao)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function Metrica({ rotulo, valor, alerta = false }: { rotulo: string; valor: number; alerta?: boolean }) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id} className="min-w-0 bg-surface p-5">
      <p id={id} className={cn("eyebrow", alerta && "text-danger")}>
        {rotulo}
      </p>
      <p className={cn("mt-3.5 num text-lg [overflow-wrap:anywhere]", alerta ? "text-danger" : "text-text")}>
        {formatMoeda(valor)}
      </p>
    </div>
  );
}

function GradeMetricas({ fin }: { fin: Financeiro }) {
  const atraso = fin.inadimplencia.valor;
  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-5">
      <Metrica rotulo="Receita recebida" valor={fin.recebido} />
      <Metrica rotulo="A receber" valor={fin.aReceber} />
      <Metrica rotulo="Inadimplência" valor={atraso} alerta={atraso > 0} />
      <Metrica rotulo="Comissões" valor={fin.comissoes} />
      <Metrica rotulo="Despesas pagas" valor={fin.despesas.pagas} />
    </div>
  );
}

function ProximosVencimentos({ linhas }: { linhas: LinhaReceitaTela[] }) {
  return (
    <Table aria-label="Próximos vencimentos" containerClassName="rounded-none border-0 bg-transparent">
      <TableHeader className="bg-transparent">
        <TableRow className="hover:bg-transparent">
          <TableHead className="pl-0 sm:first:pl-0">Vencimento</TableHead>
          <TableHead>Contrato</TableHead>
          <TableHead align="right">Valor</TableHead>
          <TableHead align="right" className="pr-0 sm:last:pr-0">
            Status
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {linhas.map((l) => (
          <TableRow key={`${l.contratoId}:${l.numero}`} className="border-t border-b-0 hover:bg-transparent">
            <TableCell className="pl-0 num whitespace-nowrap sm:first:pl-0">{formatData(l.vencimento)}</TableCell>
            <TableCell>
              <div className="flex min-w-0 flex-col gap-0.5">
                <LinkCodigo href={`/contratos/${l.contratoId}`}>{l.numeroContrato}</LinkCodigo>
                <span className="line-clamp-1 text-caption text-text-muted">
                  {l.imovel?.titulo ?? "Imóvel removido"}
                </span>
              </div>
            </TableCell>
            <TableCell align="right" className="whitespace-nowrap">
              {formatMoeda(l.valor)}
            </TableCell>
            <TableCell align="right" className="pr-0 sm:last:pr-0">
              <Badge tone={STATUS_PARCELA_UI[l.status].tom}>{STATUS_PARCELA_UI[l.status].rotulo}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function TelaFinanceiro() {
  const url = useParametrosUrl();
  const bruto = url.ler("periodo");
  const periodo: Periodo = ePeriodo(bruto) ? bruto : "mesAtual";

  const carregar = useCallback(async (): Promise<Dados> => {
    const [fin, corretores, receitas] = await Promise.all([
      fakeApi.getFinanceiro(periodo),
      fakeApi.listCorretores(),
      fakeApi.listReceitas({ status: ["aVencer"] }, { pagina: 1, porPagina: PROXIMOS }),
    ]);
    return {
      fin,
      corretores: Object.fromEntries(corretores.map((c) => [c.id, c.nome])),
      proximos: receitas.itens,
    };
  }, [periodo]);
  const { estado, recarregar } = useConsulta(carregar);

  const ref = REFERENCIA[periodo];
  const dados = "dados" in estado ? estado.dados : undefined;

  const exportar = (d: Dados) => {
    const f = d.fin;
    baixarCsv(
      "financeiro.csv",
      montarCsv(
        ["Indicador", "Valor (R$)"],
        [
          ["Receita recebida", reais(f.recebido)],
          ["A receber", reais(f.aReceber)],
          ["Inadimplência", reais(f.inadimplencia.valor)],
          ["Comissões", reais(f.comissoes)],
          ["Despesas pagas", reais(f.despesas.pagas)],
          ["Resultado", reais(f.resultado)],
        ],
      ),
    );
  };

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
        eyebrow="Financeiro · visão geral"
        titulo="Financeiro"
        acoes={
          <>
            <Select
              aria-label="Período"
              className="w-48"
              value={periodo}
              onValueChange={(v) => url.definir({ periodo: v === "mesAtual" ? undefined : v })}
              options={PERIODOS.map((p) => ({ value: p, label: PERIODO_ROTULO[p] }))}
            />
            <Button
              variant="secondary"
              leadingIcon={Download}
              className="max-md:h-11"
              disabled={!dados}
              onClick={() => dados && exportar(dados)}
            >
              Exportar
            </Button>
          </>
        }
      />
      <div className="flex min-w-0 flex-col gap-14">
        <div className="flex min-w-0 flex-col gap-6">
          <h2 className="sr-only">Indicadores</h2>
          <EstadoRecurso
            estado={estado}
            carregando={
              <>
                <Skeleton shape="rect" className="h-64 rounded-xl" />
                <Skeleton shape="rect" className="h-28 rounded-lg" />
              </>
            }
            onTentarNovamente={recarregar}
            erro={{ titulo: "Não foi possível carregar os indicadores" }}
          >
            {(d) => (
              <>
                <Hero
                  fin={d.fin}
                  rotulo={
                    periodo === "mesAtual" ? "Resultado do mês" : `Resultado · ${PERIODO_ROTULO[periodo].toLowerCase()}`
                  }
                />
                <GradeMetricas fin={d.fin} />
              </>
            )}
          </EstadoRecurso>
        </div>

        <h2 className="sr-only">Receita e comissões</h2>
        <RevenueChartCard estado={mapear(estado, (d) => d.fin.receitaPorMes)} onTentarNovamente={recarregar} />

        <SectionCard
          variante="aberta"
          titulo="Próximos vencimentos"
          acoes={
            <Button asChild variant="link">
              <Link href="/financeiro/receitas">Ver todas</Link>
            </Button>
          }
        >
          <EstadoRecurso
            estado={mapear(estado, (d) => d.proximos)}
            carregando={<Skeleton shape="rect" className="h-48" />}
            onTentarNovamente={recarregar}
            estaVazio={(l) => l.length === 0}
            vazio={<p className="text-sm text-text-muted">Nenhuma parcela a vencer.</p>}
            erro={{ titulo: "Não foi possível carregar os vencimentos" }}
          >
            {(l) => <ProximosVencimentos linhas={l} />}
          </EstadoRecurso>
        </SectionCard>

        <div className="grid grid-cols-1 gap-x-10 gap-y-14 xl:grid-cols-2">
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

          <SectionCard titulo="Parcelas atrasadas" variante="aberta">
            <EstadoRecurso
              estado={faixasEstado}
              carregando={<Skeleton shape="rect" className="h-40" />}
              onTentarNovamente={recarregar}
              erro={{ titulo: "Não foi possível carregar as parcelas atrasadas" }}
            >
              {(faixas) => (
                <ul aria-label="Parcelas atrasadas por faixa de atraso" className="flex animate-fade-in flex-col">
                  {faixas.map((f) => (
                    <li
                      key={f.faixa}
                      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border-soft py-5 first:border-t-0 first:pt-0"
                    >
                      <div className="flex flex-col">
                        <span className="text-md font-medium text-text">
                          {f.faixa === "60+" ? "Mais de 60 dias" : `${f.faixa.replace("-", " a ")} dias`}
                        </span>
                        <span className="text-caption text-text-muted">{parcelas(f.quantidade)}</span>
                      </div>
                      <div className="flex items-baseline gap-4">
                        <span className={cn("num text-md", f.valor > 0 ? "text-danger" : "text-text")}>
                          {dinheiro(f.valor)}
                        </span>
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
