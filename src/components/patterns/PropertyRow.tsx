/**
 * PropertyRow: imóvel em lista de cartões horizontais (empilha em 360 px). RF-20, RF-28.
 * A tabela completa com seleção em lote é o DataTable (outro composto).
 */
import { cn } from "@/lib/cn";
import { Skeleton } from "../ui/Skeleton";
import {
  BotaoFavorito,
  CodigoStatusImovel,
  LocalImovel,
  MenuAcoesImovel,
  PilulaFinalidade,
  PrecoImovel,
  ResponsavelImovel,
  SpecsImovel,
  TituloImovel,
  type PropertyItemProps,
} from "./PropertyCard";
import { PropertyImage } from "./PropertyImage";

export type PropertyRowProps = PropertyItemProps;

export function PropertyRow({ imovel, corretor, href, acoes = [], onAlternarFavorito, className }: PropertyRowProps) {
  return (
    <article
      aria-label={`${imovel.codigo}: ${imovel.titulo}`}
      className={cn(
        "group relative flex min-w-0 flex-col gap-4 border-t border-border-soft py-5 sm:flex-row sm:items-center sm:gap-6",
        className,
      )}
    >
      <div className="relative sm:w-48 sm:shrink-0">
        <PropertyImage tipo={imovel.tipo} fachada={imovel.fachada} decorativa />
        <PilulaFinalidade imovel={imovel} className="absolute top-3 left-3" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <CodigoStatusImovel imovel={imovel} />
        <TituloImovel imovel={imovel} href={href} />
        <LocalImovel imovel={imovel} />
        <SpecsImovel imovel={imovel} className="mt-1 text-text-2" />
        <ResponsavelImovel corretor={corretor} />
      </div>
      <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-between sm:self-stretch">
        <PrecoImovel imovel={imovel} className="sm:text-right" />
        <div className="flex gap-2">
          <BotaoFavorito imovel={imovel} onAlternarFavorito={onAlternarFavorito} />
          <MenuAcoesImovel imovel={imovel} acoes={acoes} />
        </div>
      </div>
    </article>
  );
}

/** Esqueleto com a forma final do PropertyRow. */
export function PropertyRowSkeleton({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando imóvel"
      className={cn("flex flex-col gap-4 border-t border-border-soft py-5 sm:flex-row", className)}
    >
      <Skeleton shape="rect" className="aspect-4/3 h-auto w-full rounded-lg sm:w-48" />
      <div className="flex flex-1 flex-col gap-3">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="w-3/4" />
        <Skeleton className="w-1/2" />
        <Skeleton className="w-1/3" />
      </div>
      <Skeleton className="h-6 w-28" />
    </div>
  );
}
