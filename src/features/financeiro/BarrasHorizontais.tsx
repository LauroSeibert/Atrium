import { classeCorSerie } from "@/components/patterns/ChartParts";

export type ItemBarra = { id: string; rotulo: string; valor: number; texto: string };

/** Barras horizontais simples (largura proporcional ao maior valor). Decorativas: o texto carrega o dado. */
export function BarrasHorizontais({ itens, serie = 0 }: { itens: ItemBarra[]; serie?: number }) {
  const maior = Math.max(1, ...itens.map((i) => i.valor));
  return (
    <ul className="flex flex-col gap-3">
      {itens.map((i) => (
        <li key={i.id} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 break-words text-text">{i.rotulo}</span>
            <span className="tnum shrink-0 font-medium text-text">{i.texto}</span>
          </div>
          <div aria-hidden="true" className="h-2 w-full rounded-full bg-bg-subtle">
            <div
              className={`h-full rounded-full ${classeCorSerie(serie)}`}
              style={{ width: `${Math.round((i.valor / maior) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
