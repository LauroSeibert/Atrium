import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/patterns/EmptyState";
import { DefinirTrilha } from "./trilha";

export type TelaEmConstrucaoProps = {
  titulo: string;
  /** RFs que a tela vai atender (REQUISITOS §6). */
  requisitos: string;
  acaoPrimaria?: ReactNode;
  /** Rótulo real do segmento dinâmico na trilha. */
  rotuloTrilha?: string;
};

/** Placeholder das telas até a Fase 8: cabeçalho real (RF-61) + estado vazio explicando o que vem. */
export function TelaEmConstrucao({ titulo, requisitos, acaoPrimaria, rotuloTrilha }: TelaEmConstrucaoProps) {
  return (
    <>
      {rotuloTrilha ? <DefinirTrilha rotulo={rotuloTrilha} /> : null}
      <PageHeader titulo={titulo} acaoPrimaria={acaoPrimaria} />
      <section aria-label="Conteúdo da tela" className="rounded-lg border border-border bg-surface px-4 py-8 shadow-1">
        <EmptyState
          ilustracao="semResultados"
          titulo="Em construção"
          descricao={<span title={requisitos}>Chega na Fase 8.</span>}
        />
      </section>
    </>
  );
}
