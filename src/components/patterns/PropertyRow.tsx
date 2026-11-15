/**
 * PropertyRow: imóvel em lista de cartões horizontais (empilha em 360 px). RF-20, RF-28.
 * A tabela completa com seleção em lote é o DataTable (outro composto).
 */
import { cn } from "@/lib/cn";
import { Card } from "../ui/Card";
import { Skeleton } from "../ui/Skeleton";
import {
  BotaoFavorito,
  LocalImovel,
  MenuAcoesImovel,
  PrecoImovel,
  ResponsavelImovel,
  SelosImovel,
  SpecsImovel,
  TituloImovel,
  type PropertyItemProps,
} from "./PropertyCard";
import { PropertyImage } from "./PropertyImage";

export type PropertyRowProps = PropertyItemProps;

export function PropertyRow({ imovel, corretor, href, acoes = [], onAlternarFavorito, className }: PropertyRowProps) {
  return (
    <Card
      variant="interactive"
      asChild
      className={cn("flex min-w-0 flex-col overflow-hidden hover:border-border-strong sm:flex-row", className)}
    >
      <article aria-label={`${imovel.codigo}: ${imovel.titulo}`}>
        <PropertyImage
          tipo={imovel.tipo}
          fachada={imovel.fachada}
          decorativa
          className="w-full shrink-0 rounded-none sm:w-56"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
          <SelosImovel imovel={imovel} />
          <TituloImovel imovel={imovel} href={href} />
          <LocalImovel imovel={imovel} />
          <SpecsImovel imovel={imovel} className="text-text" />
          <ResponsavelImovel corretor={corretor} />
        </div>
        <div className="flex items-center justify-between gap-3 p-4 pt-0 sm:flex-col sm:items-end sm:justify-between sm:pt-4">
          <PrecoImovel imovel={imovel} className="sm:text-right" />
          <div className="flex gap-2">
            <BotaoFavorito imovel={imovel} onAlternarFavorito={onAlternarFavorito} />
            <MenuAcoesImovel imovel={imovel} acoes={acoes} />
          </div>
        </div>
      </article>
    </Card>
  );
}

/** Esqueleto com a forma final do PropertyRow. */
export function PropertyRowSkeleton({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando imóvel"
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-1 sm:flex-row",
        className,
      )}
    >
      <Skeleton shape="rect" className="aspect-4/3 h-auto w-full rounded-none sm:w-56" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="w-3/4" />
        <Skeleton className="w-1/2" />
        <Skeleton className="w-1/3" />
      </div>
      <div className="p-4">
        <Skeleton className="h-6 w-28" />
      </div>
    </div>
  );
}
