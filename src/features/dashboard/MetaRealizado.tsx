"use client";

import { useId, useState } from "react";
import type { MetaCorretor } from "@/domain";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/patterns/EmptyState";
import { EstadoRecurso } from "@/components/patterns/EstadoRecurso";
import { Avatar } from "@/components/ui/Avatar";
import { Destaque } from "@/components/ui/Typography";
import { cn } from "@/lib/cn";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatMoeda, formatNumero, formatPercentual } from "@/lib/format";
import type { Recurso } from "@/lib/recurso";

/** Meta × realizado do mês, geral e por corretor (RF-16). */

export type DadosMeta = { total: MetaCorretor; porCorretor: MetaCorretor[] };

const fracao = (m: MetaCorretor) => (m.meta > 0 ? m.receita / m.meta : 0);
const contratos = (n: number) => `${formatNumero(n)} ${n === 1 ? "contrato fechado" : "contratos fechados"}`;
const compacto = (n: number) => formatMoeda(n, { compacto: true });
/** Quantos corretores aparecem antes de "Mostrar todos" (lista curta é mais fácil de varrer). */
const VISIVEIS = 4;

/** Trilho de progresso sobre tinta: preenchimento em latão (única cor de acento do painel). */
function Trilho({ fracao: f, rotulo, grosso }: { fracao: number; rotulo: string; grosso?: boolean }) {
  const pct = Math.min(100, Math.max(0, f * 100));
  const id = useId();
  return (
    <>
      <span id={id} className="sr-only">
        {rotulo}
      </span>
      <div
        role="progressbar"
        aria-labelledby={id}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        className={cn("w-full rounded-full bg-ink-track", grosso ? "h-1" : "h-0.5")}
      >
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
    </>
  );
}

/** Resumo da imobiliária: realizado em destaque, meta e contratos em texto discreto. */
function Resumo({ m }: { m: MetaCorretor }) {
  const f = fracao(m);
  return (
    <div className="flex flex-col">
      <Destaque valor={compacto(m.receita)} size="6xl" />
      <p className="tnum mt-2.5 text-caption text-text-muted">
        de {compacto(m.meta)} · {contratos(m.contratos)}
      </p>
      <div className="mt-5 flex items-center gap-3">
        <Trilho fracao={f} rotulo="Geral" grosso />
        <span className="num text-xs text-text">{formatPercentual(f, 0)}</span>
      </div>
    </div>
  );
}

function Linha({ rotulo, m }: { rotulo: string; m: MetaCorretor }) {
  const f = fracao(m);
  return (
    <li className="flex items-center gap-3">
      <Avatar name={rotulo} size={32} aria-hidden className="bg-ink-track text-2xs font-semibold text-text" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-caption text-text">{rotulo}</p>
          <span className="shrink-0 num text-xs text-text">{formatPercentual(f, 0)}</span>
        </div>
        <Trilho fracao={f} rotulo={`Meta de ${rotulo}`} />
        <p className="tnum truncate text-xs text-text-muted">
          {compacto(m.receita)} de {compacto(m.meta)}
        </p>
      </div>
    </li>
  );
}

function MetaSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando metas" className="flex flex-col gap-4">
      <Skeleton className="h-12 w-2/3" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="w-1/2" />
          <Skeleton className="h-1 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/** Único painel em tinta da tela: meta do mês, realizado e andamento por corretor. */
export function MetaRealizado({
  estado,
  nomeDe,
  mes,
  onTentarNovamente,
  className,
}: {
  estado: Recurso<DadosMeta>;
  nomeDe: (corretorId: string) => string;
  /** Mês por extenso ("novembro"); sem ele o rótulo é "Meta do mês". */
  mes?: string;
  onTentarNovamente?: () => void;
  className?: string;
}) {
  const [todos, setTodos] = useState(false);
  const idLista = useId();
  const idTitulo = useId();
  const ordenados = (d: DadosMeta) => [...d.porCorretor].sort((a, z) => fracao(z) - fracao(a));
  return (
    <section
      aria-labelledby={idTitulo}
      className={cn("tinta flex min-w-0 flex-col rounded-lg bg-ink-panel p-7 text-text", className)}
    >
      <h2 id={idTitulo} className="eyebrow">
        {mes ? `Meta de ${mes}` : "Meta do mês"}
      </h2>
      <div className="mt-5">
        <EstadoRecurso
          estado={estado}
          carregando={<MetaSkeleton />}
          estaVazio={(d) => d.total.meta === 0}
          vazio={<EmptyState tamanho="compacto" ilustracao="semResultados" titulo="Nenhuma meta definida" />}
          erro={{ titulo: "Não foi possível carregar as metas" }}
          onTentarNovamente={onTentarNovamente}
        >
          {(d) => {
            const lista = ordenados(d);
            const mostrar = todos ? lista : lista.slice(0, VISIVEIS);
            return (
              <div className="flex animate-fade-in flex-col">
                <Resumo m={d.total} />
                <p className="mt-7 border-t border-border pt-5 eyebrow">Por corretor</p>
                <ul id={idLista} aria-label="Por corretor" className="mt-4 flex flex-col gap-4">
                  {mostrar.map((m) => (
                    <Linha key={m.corretorId} rotulo={nomeDe(m.corretorId)} m={m} />
                  ))}
                </ul>
                {lista.length > VISIVEIS ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-expanded={todos}
                    aria-controls={idLista}
                    onClick={() => setTodos(!todos)}
                    className="mt-3 -ml-3 self-start text-text-muted max-sm:h-11"
                  >
                    {todos ? "Mostrar menos" : `Mostrar todos (${lista.length})`}
                  </Button>
                ) : null}
              </div>
            );
          }}
        </EstadoRecurso>
      </div>
    </section>
  );
}
