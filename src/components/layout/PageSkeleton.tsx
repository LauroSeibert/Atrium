import { Skeleton } from "../ui/Skeleton";

/**
 * Skeleton de página para o carregamento inicial de uma rota (`loading.tsx`): mesma forma do
 * cabeçalho + uma faixa de indicadores + um bloco de conteúdo, para não haver salto de layout (CLS).
 */
export function PageSkeleton({ variante = "lista" }: { variante?: "lista" | "painel" | "detalhe" }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className="flex flex-col gap-6">
      <span className="sr-only">Carregando a página…</span>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="w-80 max-w-full" />
        </div>
        <Skeleton className="hidden h-10 w-36 rounded-md md:block" />
      </div>
      {variante === "painel" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} shape="rect" className="h-28 rounded-lg" />
          ))}
        </div>
      ) : null}
      {variante === "detalhe" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton shape="rect" className="aspect-4/3 h-auto rounded-lg lg:col-span-2" />
          <div className="flex flex-col gap-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
          <Skeleton className="h-10 rounded-md" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 rounded-md" />
          ))}
        </div>
      )}
    </div>
  );
}
