"use client";
/**
 * PropertyGallery: carrossel dos cômodos ilustrados (RF-24). Padrão WAI-ARIA Carousel:
 * região `aria-roledescription="carrossel"`, slides "slide", sem autoplay, setas, miniaturas,
 * teclado (←/→, Home/End) e contador anunciado com `aria-live="polite"`.
 */
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import type { Comodo, Fachada, TipoImovel } from "@/domain/imovel/schema";
import { cn } from "@/lib/cn";
import { formatArea } from "@/lib/format";
import { Button } from "../ui/Button";
import { Skeleton } from "../ui/Skeleton";
import { EmptyState } from "./EmptyState";
import { PropertyImage } from "./PropertyImage";

export type PropertyGalleryProps = {
  comodos: Comodo[];
  tipo: TipoImovel;
  fachada?: Fachada | null;
  /** Nome do imóvel, usado no rótulo da região. */
  titulo?: string;
  indiceInicial?: number;
  onMudar?: (indice: number) => void;
  className?: string;
};

export function PropertyGallery({
  comodos,
  tipo,
  fachada,
  titulo,
  indiceInicial = 0,
  onMudar,
  className,
}: PropertyGalleryProps) {
  const total = comodos.length;
  const [indice, setIndice] = useState(Math.min(Math.max(indiceInicial, 0), Math.max(total - 1, 0)));
  const rotuloRegiao = titulo ? `Galeria de ${titulo}` : "Galeria do imóvel";

  if (total === 0) {
    return (
      <section aria-label={rotuloRegiao} className={cn("flex flex-col gap-3", className)}>
        <PropertyImage tipo={tipo} fachada={fachada} titulo={titulo ? `Fachada de ${titulo}` : undefined} />
        <EmptyState
          tamanho="compacto"
          ilustracao="semResultados"
          titulo="Sem cômodos para mostrar"
          descricao="Este imóvel não tem cômodos cadastrados. A ilustração acima mostra a fachada."
        />
      </section>
    );
  }

  const atual = Math.min(indice, total - 1);
  const ir = (i: number) => {
    const novo = (i + total) % total;
    setIndice(novo);
    onMudar?.(novo);
  };
  const comodo = comodos[atual]!;

  const aoTeclar = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "ArrowLeft") ir(atual - 1);
    else if (e.key === "ArrowRight") ir(atual + 1);
    else if (e.key === "Home") ir(0);
    else if (e.key === "End") ir(total - 1);
    else return;
    e.preventDefault();
  };

  return (
    <section
      aria-roledescription="carrossel"
      aria-label={rotuloRegiao}
      onKeyDown={aoTeclar}
      className={cn("flex min-w-0 flex-col gap-3", className)}
    >
      <div
        tabIndex={0}
        role="group"
        aria-label="Cômodos do imóvel. Use as setas para navegar."
        className="relative rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <div
          key={atual}
          role="group"
          aria-roledescription="slide"
          aria-label={`${atual + 1} de ${total}: ${comodo.nome}`}
          className="animate-fade-in"
        >
          <PropertyImage tipo={tipo} comodo={comodo.tipo} titulo={comodo.nome} />
        </div>
        {total > 1 ? (
          <>
            <Button
              variant="secondary"
              icon={ChevronLeft}
              aria-label="Slide anterior"
              onClick={() => ir(atual - 1)}
              className="absolute top-1/2 left-2 -translate-y-1/2 bg-surface/90 max-sm:h-11 max-sm:w-11"
            />
            <Button
              variant="secondary"
              icon={ChevronRight}
              aria-label="Próximo slide"
              onClick={() => ir(atual + 1)}
              className="absolute top-1/2 right-2 -translate-y-1/2 bg-surface/90 max-sm:h-11 max-sm:w-11"
            />
          </>
        ) : null}
      </div>

      <p aria-live="polite" className="flex flex-wrap items-baseline gap-x-2 num text-sm text-text-muted">
        <span className="font-medium text-text">
          {atual + 1} de {total}
        </span>
        <span>
          {comodo.nome}
          {comodo.area !== null ? ` · ${formatArea(comodo.area)}` : ""}
        </span>
      </p>

      {total > 1 ? (
        <ul aria-label="Miniaturas dos cômodos" className="flex gap-2 overflow-x-auto p-1">
          {comodos.map((c, i) => (
            <li key={`${c.tipo}-${i}`} className="shrink-0">
              <button
                type="button"
                aria-label={`Ir para ${c.nome}, ${i + 1} de ${total}`}
                aria-current={i === atual ? "true" : undefined}
                onClick={() => ir(i)}
                className={cn(
                  "block w-20 cursor-pointer overflow-hidden rounded-lg border transition duration-(--dur-fast) ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  i === atual ? "border-text" : "border-transparent hover:border-line-strong",
                )}
              >
                <PropertyImage tipo={tipo} comodo={c.tipo} decorativa className="rounded-none" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export function PropertyGallerySkeleton({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando galeria"
      className={cn("flex flex-col gap-3", className)}
    >
      <Skeleton shape="rect" className="aspect-4/3 h-auto" />
      <Skeleton className="w-1/3" />
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} shape="rect" className="aspect-4/3 h-auto w-20" />
        ))}
      </div>
    </div>
  );
}
