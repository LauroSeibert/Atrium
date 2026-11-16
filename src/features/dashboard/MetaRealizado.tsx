"use client";

import { useId, useState } from "react";
import type { MetaCorretor } from "@/domain";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/patterns/EmptyState";
import { EstadoRecurso } from "@/components/patterns/EstadoRecurso";
import { SectionCard } from "@/components/patterns/SectionCard";
import { Progress } from "@/components/ui/Progress";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatMoeda, formatNumero, formatPercentual } from "@/lib/format";
import type { Recurso } from "@/lib/recurso";

/** Meta × realizado do mês, geral e por corretor (RF-16). */

export type DadosMeta = { total: MetaCorretor; porCorretor: MetaCorretor[] };

const fracao = (m: MetaCorretor) => (m.meta > 0 ? m.receita / m.meta : 0);
const contratos = (n: number) => `${formatNumero(n)} ${n === 1 ? "contrato fechado" : "contratos fechados"}`;
const compacto = (n: number) => formatMoeda(n, { compacto: true });
/** Quantos corretores aparecem antes de "Mostrar todos" (lista curta é mais fácil de varrer). */
const VISIVEIS = 5;

/** Resumo da imobiliária: realizado em destaque, meta e contratos em texto discreto. */
function Resumo({ m }: { m: MetaCorretor }) {
  const f = fracao(m);
  return (
    <div className="flex flex-col gap-2 border-b border-border pb-4">
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className="tnum text-xl leading-heading font-semibold tracking-tight text-text">
          {compacto(m.receita)}
        </span>
        <span className="tnum text-sm text-text-muted">de {compacto(m.meta)}</span>
        <span className="tnum ml-auto text-sm font-medium text-text">{formatPercentual(f, 0)}</span>
      </p>
      <Progress value={f * 100} label="Geral" hideValue tone={f >= 1 ? "success" : "primary"} ocultarRotulo />
      <p className="text-xs text-text-muted">{contratos(m.contratos)}</p>
    </div>
  );
}

function Linha({ rotulo, m }: { rotulo: string; m: MetaCorretor }) {
  const f = fracao(m);
  return (
    <li className="flex flex-col gap-1">
      <Progress value={f * 100} label={rotulo} tone={f >= 1 ? "success" : "primary"} className="gap-1.5" />
      <p className="tnum text-xs text-text-muted">
        {compacto(m.receita)} de {compacto(m.meta)} · {contratos(m.contratos)}
      </p>
    </li>
  );
}

function MetaSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando metas" className="flex flex-col gap-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="w-1/2" />
          <Skeleton className="h-2 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function MetaRealizado({
  estado,
  nomeDe,
  onTentarNovamente,
  className,
}: {
  estado: Recurso<DadosMeta>;
  nomeDe: (corretorId: string) => string;
  onTentarNovamente?: () => void;
  className?: string;
}) {
  const [todos, setTodos] = useState(false);
  const idLista = useId();
  const ordenados = (d: DadosMeta) => [...d.porCorretor].sort((a, z) => fracao(z) - fracao(a));
  return (
    <SectionCard titulo="Meta do mês" className={className}>
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
            <div className="flex animate-fade-in flex-col gap-4">
              <Resumo m={d.total} />
              <ul id={idLista} aria-label="Por corretor" className="flex flex-col gap-4">
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
                  className="-ml-3 self-start text-text-muted max-sm:h-11"
                >
                  {todos ? "Mostrar menos" : `Mostrar todos (${lista.length})`}
                </Button>
              ) : null}
            </div>
          );
        }}
      </EstadoRecurso>
    </SectionCard>
  );
}
