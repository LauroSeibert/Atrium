"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/cn";
import { Tag } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/Popover";

/**
 * FilterBar (RF-21 busca e filtros de imóveis; RF-06 estado na URL, controlado por quem chama).
 * Totalmente controlada: a tela guarda os valores, sincroniza com a URL e calcula `total`.
 * O debounce da digitação é só de UI (`debounceMs`); filtrar é de quem chama.
 */

export type FiltroAtivo = { id: string; rotulo: string; onRemover: () => void };

export type FilterBarProps = {
  busca: string;
  onBuscaChange: (busca: string) => void;
  /** Atraso da digitação antes de emitir `onBuscaChange` (UI, não regra). */
  debounceMs?: number;
  rotuloBusca?: string;
  placeholderBusca?: string;

  /** Conteúdo do Popover "Filtros (N)": os controles de cada tela. */
  filtros?: ReactNode;
  /** Filtros menos usados: ficam recolhidos dentro do Popover até "Mais filtros". */
  maisFiltros?: ReactNode;
  /** Filtros aplicados; viram chips removíveis e definem o N do botão. */
  ativos?: FiltroAtivo[];
  onLimparTudo?: () => void;

  /** Total de resultados anunciado em `role="status"`. */
  total?: number;
  /** `carregando` troca o contador por "Buscando…". */
  estado?: "pronto" | "carregando";
  /** Singular e plural do item contado. */
  rotuloItem?: readonly [singular: string, plural: string];

  /** Ordenação (ex.: Select) à direita. */
  ordenacao?: ReactNode;
  /** Alternância grade/lista (SegmentedControl) à direita. */
  visualizacao?: ReactNode;
  className?: string;
};

function textoContagem(total: number | undefined, estado: "pronto" | "carregando", item: readonly [string, string]) {
  if (estado === "carregando") return "Buscando…";
  if (total === undefined) return "";
  if (total === 0) return "Nenhum resultado";
  return `${total.toLocaleString("pt-BR")} ${total === 1 ? item[0] : item[1]}`;
}

export function FilterBar({
  busca,
  onBuscaChange,
  debounceMs = 300,
  rotuloBusca = "Buscar",
  placeholderBusca = "Buscar",
  filtros,
  maisFiltros,
  ativos = [],
  onLimparTudo,
  total,
  estado = "pronto",
  rotuloItem = ["resultado", "resultados"],
  ordenacao,
  visualizacao,
  className,
}: FilterBarProps) {
  // Texto digitado (local) → emitido após `debounceMs`. Mudança externa (limpar tudo, URL) sobrescreve.
  const [texto, setTexto] = useState(busca);
  const [emitido, setEmitido] = useState(busca);
  const [buscaAnterior, setBuscaAnterior] = useState(busca);
  if (busca !== buscaAnterior) {
    setBuscaAnterior(busca);
    if (busca !== emitido) {
      setTexto(busca);
      setEmitido(busca);
    }
  }

  useEffect(() => {
    if (texto === emitido) return;
    const t = setTimeout(() => {
      setEmitido(texto);
      onBuscaChange(texto);
    }, debounceMs);
    return () => clearTimeout(t);
  }, [texto, emitido, debounceMs, onBuscaChange]);

  const [maisAberto, setMaisAberto] = useState(false);
  const temFiltros = Boolean(filtros || maisFiltros);

  return (
    <div className={cn("flex max-w-full min-w-0 flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 basis-full sm:flex-1 sm:basis-64">
          <Input
            type="search"
            aria-label={rotuloBusca}
            placeholder={placeholderBusca}
            leadingIcon={Search}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            autoComplete="off"
          />
        </div>
        {temFiltros ? (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="secondary" leadingIcon={SlidersHorizontal}>
                {ativos.length > 0 ? `Filtros (${ativos.length})` : "Filtros"}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              showClose
              className="flex max-h-96 w-96 max-w-full flex-col gap-4 overflow-y-auto pt-10"
            >
              {filtros}
              {maisFiltros ? (
                <div className="flex flex-col gap-4">
                  <Button
                    variant="link"
                    className="self-start"
                    trailingIcon={maisAberto ? ChevronUp : ChevronDown}
                    aria-expanded={maisAberto}
                    aria-controls="filtros-mais"
                    onClick={() => setMaisAberto((v) => !v)}
                  >
                    Mais filtros
                  </Button>
                  <div id="filtros-mais" hidden={!maisAberto}>
                    <div className="flex flex-col gap-4">{maisFiltros}</div>
                  </div>
                </div>
              ) : null}
            </PopoverContent>
          </Popover>
        ) : null}
        {ordenacao || visualizacao ? (
          <div className="flex max-w-full min-w-0 items-center gap-2 sm:ml-auto">
            {ordenacao ? <div className="min-w-0 flex-1 sm:w-44 sm:flex-none">{ordenacao}</div> : null}
            {visualizacao}
          </div>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {ativos.length > 0 ? (
          <>
            <ul aria-label="Filtros aplicados" className="flex max-w-full min-w-0 flex-wrap items-center gap-2">
              {ativos.map((f) => (
                <li key={f.id} className="max-w-full min-w-0">
                  <Tag
                    onRemove={f.onRemover}
                    removeLabel={`Remover filtro: ${f.rotulo}`}
                    title={f.rotulo}
                    className="max-w-full min-w-0 shrink"
                  >
                    <span className="min-w-0 truncate">{f.rotulo}</span>
                  </Tag>
                </li>
              ))}
            </ul>
            {onLimparTudo ? (
              <Button variant="link" onClick={onLimparTudo}>
                Limpar tudo
              </Button>
            ) : null}
          </>
        ) : null}
        <p role="status" className="tnum ml-auto min-w-0 text-sm break-words text-text-muted">
          {textoContagem(total, estado, rotuloItem)}
        </p>
      </div>
    </div>
  );
}
