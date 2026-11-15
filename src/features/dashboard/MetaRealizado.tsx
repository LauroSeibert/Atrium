import type { MetaCorretor } from "@/domain";
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

function Linha({ rotulo, m }: { rotulo: string; m: MetaCorretor }) {
  const f = fracao(m);
  return (
    <li className="flex flex-col gap-1">
      <Progress value={f * 100} label={rotulo} hideValue tone={f >= 1 ? "success" : "primary"} />
      <p className="tnum text-sm text-text-muted">
        {formatMoeda(m.receita, { compacto: true })} de {formatMoeda(m.meta, { compacto: true })} (
        {formatPercentual(f, 0)}) · {contratos(m.contratos)}
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
        {(d) => (
          <ul className="flex flex-col gap-5">
            <Linha rotulo="Geral" m={d.total} />
            {ordenados(d).map((m) => (
              <Linha key={m.corretorId} rotulo={nomeDe(m.corretorId)} m={m} />
            ))}
          </ul>
        )}
      </EstadoRecurso>
    </SectionCard>
  );
}
