/** SpecList: ficha técnica do imóvel em <dl> (RF-24). Valores ausentes aparecem como "—". */
import type { Imovel } from "@/domain/imovel/schema";
import { cn } from "@/lib/cn";
import { formatArea, formatMoeda } from "@/lib/format";
import { Skeleton } from "../ui/Skeleton";

export type SpecListProps = {
  imovel: Pick<
    Imovel,
    "areaUtil" | "areaTotal" | "quartos" | "suites" | "banheiros" | "vagas" | "condominio" | "iptu" | "tipo"
  >;
  className?: string;
};

const num = (n: number | null | undefined) => (n === null || n === undefined ? "—" : String(n));
const moeda = (c: number | null | undefined) => (c === null || c === undefined ? "—" : formatMoeda(c));

export function SpecList({ imovel, className }: SpecListProps) {
  const terreno = imovel.tipo === "terreno";
  const itens: [string, string][] = [
    ["Área útil", terreno ? "—" : formatArea(imovel.areaUtil)],
    ["Área total", formatArea(imovel.areaTotal)],
    ["Quartos", terreno ? "—" : num(imovel.quartos)],
    ["Suítes", terreno ? "—" : num(imovel.suites)],
    ["Banheiros", terreno ? "—" : num(imovel.banheiros)],
    ["Vagas", terreno ? "—" : num(imovel.vagas)],
    ["Condomínio", moeda(imovel.condominio)],
    ["IPTU", moeda(imovel.iptu)],
  ];
  return (
    <dl className={cn("grid grid-cols-1 gap-x-10 sm:grid-cols-2", className)}>
      {itens.map(([rotulo, valor]) => (
        <div key={rotulo} className="flex items-baseline justify-between gap-4 border-b border-border-soft py-3.5">
          <dt className="text-caption text-text-muted">{rotulo}</dt>
          <dd className={cn("text-right num text-sm text-text", valor === "—" ? "text-text-muted" : "text-text")}>
            {valor === "—" ? (
              <>
                <span aria-hidden="true">—</span>
                <span className="sr-only">não informado</span>
              </>
            ) : (
              valor
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function SpecListSkeleton({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando ficha técnica"
      className={cn("flex flex-col gap-3", className)}
    >
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton key={i} className="h-5" />
      ))}
    </div>
  );
}
