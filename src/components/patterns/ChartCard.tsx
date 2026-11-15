"use client";
import { ChartColumn, Table2 } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import type { Recurso } from "@/lib/recurso";
import { cn } from "@/lib/cn";
import { Card } from "../ui/Card";
import { SegmentedControl } from "../ui/SegmentedControl";
import { Skeleton } from "../ui/Skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/Table";
import { Heading, Text } from "../ui/Typography";
import { EmptyState } from "./EmptyState";
import { EstadoRecurso } from "./EstadoRecurso";

/**
 * Tabela alternativa do gráfico (RNF-17). A primeira coluna é o cabeçalho de linha.
 * Células já formatadas por quem chama (`@/lib/format`).
 */
export type TabelaGrafico = {
  /** Nome acessível da tabela (também usado na região rolável). */
  rotulo: string;
  colunas: { rotulo: string; alinhar?: "left" | "right" }[];
  linhas: ReactNode[][];
};

export type ChartCardProps<T> = {
  titulo: string;
  descricao?: ReactNode;
  /** Ação opcional no cabeçalho (ex.: filtro de período, "Exportar"). */
  acao?: ReactNode;
  estado: Recurso<T>;
  onTentarNovamente?: () => void;
  /** Resumo em texto dos dados (RNF-17): aparece abaixo do cabeçalho e nomeia o gráfico. */
  resumo: (dados: T) => string;
  /** Tabela com os mesmos dados do gráfico. */
  tabela: (dados: T) => TabelaGrafico;
  /** O gráfico em si; recebe os dados e é tratado como imagem (`role="img"`). */
  grafico: (dados: T) => ReactNode;
  estaVazio?: (dados: T) => boolean;
  tituloVazio?: string;
  descricaoVazio?: string;
  headingLevel?: 2 | 3 | 4;
  className?: string;
};

type Visao = "grafico" | "tabela";

function TabelaAlternativa({ t, visivel }: { t: TabelaGrafico; visivel: boolean }) {
  const cabecalho = (
    <TableHeader>
      <TableRow>
        {t.colunas.map((c) => (
          <TableHead key={c.rotulo} align={c.alinhar}>
            {c.rotulo}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
  const corpo = (
    <TableBody>
      {t.linhas.map((linha, i) => (
        <TableRow key={i}>
          {linha.map((cel, j) =>
            j === 0 ? (
              <TableHead key={j} scope="row" className="font-medium text-text">
                {cel}
              </TableHead>
            ) : (
              <TableCell key={j} align={t.colunas[j]?.alinhar}>
                {cel}
              </TableCell>
            ),
          )}
        </TableRow>
      ))}
    </TableBody>
  );
  if (visivel)
    return (
      <Table aria-label={t.rotulo} density="compact">
        {cabecalho}
        {corpo}
      </Table>
    );
  // Visão "Gráfico": a mesma tabela fica só para leitores de tela (sem região focável invisível).
  return (
    <div className="sr-only">
      <table aria-label={t.rotulo}>
        {cabecalho}
        {corpo}
      </table>
    </div>
  );
}

function Conteudo<T>({ dados, p, visao }: { dados: T; p: ChartCardProps<T>; visao: Visao }) {
  const idResumo = useId();
  const tabela = p.tabela(dados);
  return (
    <div className="flex flex-col gap-4">
      {/* Resumo textual (RNF-17) só para leitor de tela: a tabela é a alternativa visível (menos é mais). */}
      <Text id={idResumo} size="sm" tone="muted" className="sr-only">
        {p.resumo(dados)}
      </Text>
      {visao === "grafico" ? (
        <div role="img" aria-labelledby={idResumo} className="min-w-0">
          {p.grafico(dados)}
        </div>
      ) : null}
      <TabelaAlternativa t={tabela} visivel={visao === "tabela"} />
    </div>
  );
}

export function ChartCardSkeleton({ className }: { className?: string }) {
  return (
    <div aria-busy="true" className={cn("flex flex-col gap-3", className)}>
      <span className="sr-only" role="status">
        Carregando gráfico
      </span>
      <Skeleton className="h-4 w-2/3" />
      <Skeleton shape="rect" className="h-56 sm:h-64" />
    </div>
  );
}

/**
 * Card de gráfico (RF-11, RF-12, RNF-17). Sempre entrega o dado em texto e em tabela: a alternância
 * "Gráfico | Tabela" mostra uma ou outra e, na visão de gráfico, a tabela continua disponível aos
 * leitores de tela. Estado assíncrono via `Recurso<T>` + `EstadoRecurso` (RNF-09).
 */
export function ChartCard<T>(props: ChartCardProps<T>) {
  const {
    titulo,
    descricao,
    acao,
    estado,
    onTentarNovamente,
    estaVazio,
    tituloVazio = "Sem dados no período",
    descricaoVazio,
    headingLevel = 3,
    className,
  } = props;
  const [visao, setVisao] = useState<Visao>("grafico");
  const dados = "dados" in estado ? estado.dados : undefined;
  const alternavel = dados !== undefined && !(estaVazio?.(dados) ?? false);
  return (
    <Card className={cn("flex min-w-0 flex-col gap-4 p-4 sm:p-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <Heading level={headingLevel} size="lg" className="break-words">
            {titulo}
          </Heading>
          {descricao ? (
            <Text size="sm" tone="muted">
              {descricao}
            </Text>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {acao}
          <SegmentedControl<Visao>
            aria-label={`Visualização de ${titulo}`}
            value={alternavel ? visao : "grafico"}
            onValueChange={setVisao}
            options={[
              { value: "grafico", label: "Gráfico", icon: ChartColumn, disabled: !alternavel },
              { value: "tabela", label: "Tabela", icon: Table2, disabled: !alternavel },
            ]}
          />
        </div>
      </div>
      <EstadoRecurso
        estado={estado}
        carregando={<ChartCardSkeleton />}
        estaVazio={estaVazio}
        vazio={
          <EmptyState tamanho="compacto" ilustracao="semResultados" titulo={tituloVazio} descricao={descricaoVazio} />
        }
        erro={{ titulo: "Não foi possível carregar o gráfico" }}
        onTentarNovamente={onTentarNovamente}
      >
        {(d) => <Conteudo dados={d} p={props} visao={visao} />}
      </EstadoRecurso>
    </Card>
  );
}
