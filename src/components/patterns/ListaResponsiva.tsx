"use client";
import type { ReactNode } from "react";
import type { Pagina } from "@/lib/paginacao";
import type { Recurso } from "@/lib/recurso";
import { Pagination } from "../ui/Pagination";
import type { TableDensity } from "../ui/Table";
import { DataTable, type DataTableColuna, type DataTableProps } from "./DataTable";
import { EmptyState, type EmptyStateProps } from "./EmptyState";
import { EstadoRecurso } from "./EstadoRecurso";

export type ListaResponsivaProps<T extends object> = {
  /** Nome da lista: rótulo da tabela, da lista de cartões e do `h2` oculto que abre a seção. */
  rotulo: string;
  /** `true` = tabela; `false` = cartões (quem chama decide pelo breakpoint; renderiza só um dos dois). */
  telaLarga: boolean;
  colunas: DataTableColuna<T>[];
  idLinha: (item: T) => string;
  estado: Recurso<Pagina<T>>;
  onTentarNovamente: () => void;
  onPaginaChange: (pagina: number) => void;
  vazio: Pick<EmptyStateProps, "titulo" | "acao">;
  /** Cartão de uma linha (telas estreitas). */
  cartao: (item: T) => ReactNode;
  /** Esqueleto de um cartão (repetido 3 vezes). */
  cartaoCarregando: ReactNode;
  densidade?: TableDensity;
  /** Seleção e ações em lote (só na tabela). */
  tabela?: Pick<
    DataTableProps<T>,
    | "selecionados"
    | "onSelecaoChange"
    | "rotuloSelecao"
    | "acoesEmLote"
    | "rotuloContagem"
    | "barraDeLote"
    | "larguraMinima"
  >;
};

/**
 * Lista com tabela em telas largas e cartões abaixo de 768 px, com os 5 estados (RNF-09) e paginação
 * ligada por quem chama. Abre com um `h2` oculto: os cartões usam `h3`.
 */
export function ListaResponsiva<T extends object>({
  rotulo,
  telaLarga,
  colunas,
  idLinha,
  estado,
  onTentarNovamente,
  onPaginaChange,
  vazio,
  cartao,
  cartaoCarregando,
  densidade,
  tabela,
}: ListaResponsivaProps<T>) {
  return (
    <div className="min-w-0">
      <h2 className="sr-only">{rotulo}</h2>
      {telaLarga ? (
        <DataTable
          aria-label={rotulo}
          colunas={colunas}
          idLinha={idLinha}
          estado={estado}
          onTentarNovamente={onTentarNovamente}
          densidade={densidade}
          onPaginaChange={onPaginaChange}
          vazio={vazio}
          {...tabela}
        />
      ) : (
        <EstadoRecurso
          estado={estado}
          carregando={
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i}>{cartaoCarregando}</div>
              ))}
            </div>
          }
          estaVazio={(d) => d.itens.length === 0}
          vazio={<EmptyState tamanho="compacto" titulo={vazio.titulo} acao={vazio.acao} />}
          erro={{ titulo: "Não foi possível carregar a lista" }}
          onTentarNovamente={onTentarNovamente}
        >
          {(d) => (
            <div className="flex animate-fade-in flex-col gap-4">
              <ul aria-label={`${rotulo} em cartões`} className="flex flex-col gap-3">
                {d.itens.map((i) => (
                  <li key={idLinha(i)}>{cartao(i)}</li>
                ))}
              </ul>
              <Pagination
                page={d.pagina}
                pageCount={d.totalPaginas}
                pageSize={d.porPagina}
                total={d.total}
                onPageChange={onPaginaChange}
                className="justify-center [&_ul]:flex-wrap [&_ul]:justify-center"
              />
            </div>
          )}
        </EstadoRecurso>
      )}
    </div>
  );
}
