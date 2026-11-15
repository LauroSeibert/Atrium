"use client";

import { useMemo, type ReactNode } from "react";
import {
  rowSelectionFeature,
  tableFeatures,
  useTable,
  type ColumnDef,
  type RowSelectionState,
} from "@tanstack/react-table";
import type { LucideIcon } from "lucide-react";
import type { Permissao } from "@/domain/comum/tipos";
import { cn } from "@/lib/cn";
import type { Recurso } from "@/lib/recurso";
import type { Pagina } from "@/lib/paginacao";
import { Button } from "../ui/Button";
import { Checkbox } from "../ui/Checkbox";
import { Pagination } from "../ui/Pagination";
import { Skeleton } from "../ui/Skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  type SortDirection,
  type TableDensity,
} from "../ui/Table";
import { Tooltip } from "../ui/Tooltip";
import { EmptyState, type EmptyStateProps } from "./EmptyState";
import { EstadoRecurso } from "./EstadoRecurso";

/**
 * DataTable (RF-09 densidade, RF-49 ações em lote por permissão; RNF-09 estados de tela).
 * Só exibe: ordenação, paginação e seleção vivem em quem chama (a tela sincroniza com a URL, RF-06).
 */

export type DataTableColuna<T extends object> = {
  id: string;
  cabecalho: ReactNode;
  celula: (item: T) => ReactNode;
  /** Números e valores à direita (`tnum`). */
  alinhamento?: "esquerda" | "direita";
  /** Cabeçalho vira botão de ordenar; a ordenação em si é de quem chama. */
  ordenavel?: boolean;
  /** Fixa a coluna à esquerda (`inicio`) ou à direita (`fim`) ao rolar na horizontal. */
  fixa?: "inicio" | "fim";
  /** Classes extras do `th` e do `td` (ex.: largura mínima). */
  className?: string;
};

export type DataTableOrdenacao = { id: string; direcao: Exclude<SortDirection, "none"> };

export type DataTableAcaoEmLote = {
  id: string;
  rotulo: string;
  icone?: LucideIcon;
  variante?: "secondary" | "destructive";
  /** Já decidida pelo domínio; negada = desabilitada com o `motivo` visível (tooltip + texto para leitor de tela). */
  permissao: Permissao;
  onExecutar: (ids: string[]) => void;
};

export type DataTableProps<T extends object> = {
  /** Nome da região rolável (obrigatório). */
  "aria-label": string;
  colunas: DataTableColuna<T>[];
  idLinha: (item: T) => string;
  estado: Recurso<Pagina<T>>;
  onTentarNovamente?: () => void;
  densidade?: TableDensity;

  ordenacao?: DataTableOrdenacao | null;
  onOrdenacaoChange?: (ordenacao: DataTableOrdenacao) => void;

  /** Com `onSelecaoChange`, mostra a coluna de checkboxes. A seleção persiste entre páginas. */
  selecionados?: string[];
  onSelecaoChange?: (ids: string[]) => void;
  /** Nome acessível do checkbox da linha, ex.: `Selecionar ${item.codigo}`. */
  rotuloSelecao?: (item: T) => string;
  acoesEmLote?: DataTableAcaoEmLote[];

  onPaginaChange?: (pagina: number) => void;

  /** Quantas linhas o skeleton mostra (padrão: `porPagina`, no máximo 10). */
  linhasSkeleton?: number;
  vazio?: Pick<EmptyStateProps, "titulo" | "descricao" | "acao" | "ilustracao">;
  className?: string;
};

/** Só seleção de linhas: ordenação e paginação são de quem chama (manual). */
const FEATURES = tableFeatures({ rowSelectionFeature });

const POSICAO_FIXA = { inicio: "sticky left-0 border-r", fim: "sticky right-0 border-l" } as const;

function classesFixa(fixa: "inicio" | "fim" | undefined, deslocarInicio: boolean) {
  if (!fixa) return undefined;
  return cn(
    "z-(--z-base) border-border",
    POSICAO_FIXA[fixa],
    // Com a coluna de seleção (48 px) também fixa, a primeira coluna encosta nela.
    fixa === "inicio" && deslocarInicio && "left-12",
  );
}

export function DataTable<T extends object>({
  "aria-label": ariaLabel,
  colunas,
  idLinha,
  estado,
  onTentarNovamente,
  densidade = "comfortable",
  ordenacao = null,
  onOrdenacaoChange,
  selecionados = [],
  onSelecaoChange,
  rotuloSelecao,
  acoesEmLote = [],
  onPaginaChange,
  linhasSkeleton,
  vazio,
  className,
}: DataTableProps<T>) {
  const selecionavel = Boolean(onSelecaoChange);
  const temFixaInicio = selecionavel || colunas.some((c) => c.fixa === "inicio");
  const dados = "dados" in estado ? estado.dados : undefined;
  const itens = useMemo(() => dados?.itens ?? [], [dados]);

  const defs = useMemo<ColumnDef<typeof FEATURES, T>[]>(
    () => colunas.map((c) => ({ id: c.id, header: () => c.cabecalho, cell: ({ row }) => c.celula(row.original) })),
    [colunas],
  );
  const rowSelection: RowSelectionState = useMemo(
    () => Object.fromEntries(selecionados.map((id) => [id, true])),
    [selecionados],
  );

  const tabela = useTable({
    features: FEATURES,
    data: itens,
    columns: defs,
    getRowId: idLinha,
    enableRowSelection: selecionavel,
    state: { rowSelection },
    onRowSelectionChange: (atualizador) => {
      const proximo = typeof atualizador === "function" ? atualizador(rowSelection) : atualizador;
      onSelecaoChange?.(Object.keys(proximo).filter((id) => proximo[id]));
    },
  });

  const totalColunas = colunas.length + (selecionavel ? 1 : 0);
  const porPagina = dados?.porPagina ?? 10;

  const idsPagina = itens.map(idLinha);
  const marcadosNaPagina = idsPagina.filter((id) => rowSelection[id]).length;
  const todosNaPagina = idsPagina.length > 0 && marcadosNaPagina === idsPagina.length;

  const cabecalhoSelecao = selecionavel ? (
    <TableHead className={cn("sticky left-0 z-(--z-base) w-12 bg-bg-subtle px-0")}>
      <div className="flex justify-center">
        <Checkbox
          aria-label="Selecionar todos desta página"
          checked={todosNaPagina ? true : marcadosNaPagina > 0 ? "indeterminate" : false}
          disabled={itens.length === 0}
          onCheckedChange={(marcado) => {
            const restantes = selecionados.filter((id) => !idsPagina.includes(id));
            onSelecaoChange?.(marcado === true ? [...restantes, ...idsPagina] : restantes);
          }}
        />
      </div>
    </TableHead>
  ) : null;

  const cabecalho = (
    <TableHeader>
      <TableRow>
        {cabecalhoSelecao}
        {colunas.map((c) => {
          const direcao: SortDirection = ordenacao?.id === c.id ? ordenacao.direcao : "none";
          return (
            <TableHead
              key={c.id}
              align={c.alinhamento === "direita" ? "right" : "left"}
              sortable={c.ordenavel}
              sortDirection={direcao}
              onSortChange={(proxima) => onOrdenacaoChange?.({ id: c.id, direcao: proxima })}
              className={cn(classesFixa(c.fixa, selecionavel), c.fixa && "bg-bg-subtle", c.className)}
            >
              {c.cabecalho}
            </TableHead>
          );
        })}
      </TableRow>
    </TableHeader>
  );

  const esqueleto = (
    <div aria-busy="true" aria-live="polite" className="flex flex-col gap-3">
      <span className="sr-only">Carregando…</span>
      <Table aria-label={`${ariaLabel} (carregando)`} density={densidade}>
        {cabecalho}
        <TableBody>
          {Array.from({ length: linhasSkeleton ?? Math.min(porPagina, 10) }, (_, i) => (
            <TableRow key={i} className="hover:bg-transparent">
              {selecionavel ? (
                <TableCell className="w-12 px-0">
                  <Skeleton shape="rect" className="mx-auto size-5" />
                </TableCell>
              ) : null}
              {colunas.map((c) => (
                <TableCell key={c.id} align={c.alinhamento === "direita" ? "right" : "left"}>
                  <Skeleton className={cn("h-4 w-3/4", c.alinhamento === "direita" && "ml-auto")} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const selecionadosAgora = selecionados.length;

  return (
    <div className={cn("flex max-w-full min-w-0 flex-col gap-3", className)}>
      {selecionavel ? (
        <p role="status" className="tnum sr-only">
          {selecionadosAgora === 0
            ? ""
            : selecionadosAgora === 1
              ? "1 selecionado"
              : `${selecionadosAgora} selecionados`}
        </p>
      ) : null}
      {selecionavel && selecionadosAgora > 0 ? (
        <div className="flex min-w-0 flex-wrap items-center gap-3 rounded-md border border-border bg-surface-warm px-4 py-2">
          <p aria-hidden="true" className="tnum text-sm font-medium text-text">
            {selecionadosAgora === 1 ? "1 selecionado" : `${selecionadosAgora} selecionados`}
          </p>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {acoesEmLote.map((acao) => {
              const negada = !acao.permissao.ok;
              const motivo = acao.permissao.ok ? undefined : acao.permissao.motivo;
              const botao = (
                <Button
                  variant={acao.variante ?? "secondary"}
                  size="sm"
                  leadingIcon={acao.icone}
                  aria-disabled={negada || undefined}
                  aria-describedby={negada ? `lote-${acao.id}-motivo` : undefined}
                  onClick={() => {
                    if (!negada) acao.onExecutar(selecionados);
                  }}
                >
                  {acao.rotulo}
                </Button>
              );
              return negada ? (
                <span key={acao.id} className="inline-flex">
                  <Tooltip content={motivo}>{botao}</Tooltip>
                  <span id={`lote-${acao.id}-motivo`} className="sr-only">
                    {motivo}
                  </span>
                </span>
              ) : (
                <span key={acao.id} className="inline-flex">
                  {botao}
                </span>
              );
            })}
          </div>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => onSelecaoChange?.([])}>
            Limpar seleção
          </Button>
        </div>
      ) : null}

      <EstadoRecurso
        estado={estado}
        carregando={esqueleto}
        onTentarNovamente={onTentarNovamente}
        erro={{ titulo: "Não foi possível carregar a lista" }}
      >
        {(pagina) => (
          <div className="flex min-w-0 animate-fade-in flex-col gap-3">
            <Table
              aria-label={ariaLabel}
              density={densidade}
              containerClassName={temFixaInicio ? "scroll-pl-12" : undefined}
            >
              {cabecalho}
              <TableBody>
                {pagina.itens.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={totalColunas} className="h-auto">
                      <EmptyState
                        tamanho="compacto"
                        titulo={vazio?.titulo ?? "Nenhum resultado"}
                        descricao={vazio?.descricao}
                        acao={vazio?.acao}
                        ilustracao={vazio?.ilustracao}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  tabela.getRowModel().rows.map((linha) => (
                    <TableRow
                      key={linha.id}
                      data-state={linha.getIsSelected() ? "selected" : undefined}
                      className="bg-surface"
                    >
                      {selecionavel ? (
                        <TableCell className="sticky left-0 z-(--z-base) w-12 bg-inherit px-0">
                          <div className="flex justify-center">
                            <Checkbox
                              aria-label={rotuloSelecao?.(linha.original) ?? "Selecionar linha"}
                              checked={linha.getIsSelected()}
                              onCheckedChange={(marcado) => linha.toggleSelected(marcado === true)}
                            />
                          </div>
                        </TableCell>
                      ) : null}
                      {linha.getAllCells().map((celula, i) => {
                        const c = colunas[i]!;
                        return (
                          <TableCell
                            key={celula.id}
                            align={c.alinhamento === "direita" ? "right" : "left"}
                            className={cn(classesFixa(c.fixa, selecionavel), c.fixa && "bg-inherit", c.className)}
                          >
                            <tabela.FlexRender cell={celula} />
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {pagina.total > 0 ? (
              <Pagination
                page={pagina.pagina}
                pageCount={pagina.totalPaginas}
                pageSize={pagina.porPagina}
                total={pagina.total}
                onPageChange={onPaginaChange}
                className="min-w-0 justify-center sm:justify-between [&_ul]:flex-wrap [&_ul]:justify-center"
              />
            ) : null}
          </div>
        )}
      </EstadoRecurso>
    </div>
  );
}
