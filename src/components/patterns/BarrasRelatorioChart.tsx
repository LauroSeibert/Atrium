"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoeda, formatNumero } from "@/lib/format";
import {
  CURSOR,
  EIXO,
  GRADE,
  Legenda,
  corSerie,
  raioBarra,
  TICK,
  TooltipBox,
  useMovimentoReduzido,
} from "./ChartParts";

/** Barras por categoria (RF-82; alternativa textual: RNF-17 via ChartCard). Uma ou mais séries, valores em `formato`. */

export type SerieBarras = { rotulo: string; formato: "moeda" | "numero" };
export type CategoriaBarras = { rotulo: string; valores: number[] };

export type BarrasRelatorioChartProps = {
  categorias: CategoriaBarras[];
  series: SerieBarras[];
  /** Barras horizontais (rótulos longos, ranking). */
  horizontal?: boolean;
  /** Empilha as séries (só quando somam um todo). */
  empilhado?: boolean;
};

const texto = (v: number, f: SerieBarras["formato"]) =>
  f === "moeda" ? formatMoeda(v, { semCentavos: true }) : formatNumero(v);
const eixo = (v: number, f: SerieBarras["formato"]) =>
  f === "moeda" ? formatMoeda(v, { compacto: true }) : formatNumero(v);

type Linha = { rotulo: string; [serie: string]: number | string };

export const barrasVazias = (c: CategoriaBarras[]) => c.every((x) => x.valores.every((v) => v === 0));

export function BarrasRelatorioChart({
  categorias,
  series,
  horizontal = false,
  empilhado = false,
}: BarrasRelatorioChartProps) {
  const reduzido = useMovimentoReduzido();
  const raio = raioBarra();
  const dados: Linha[] = categorias.map((c) => ({
    rotulo: c.rotulo,
    ...Object.fromEntries(series.map((_, i) => [`v${i}`, c.valores[i] ?? 0])),
  }));
  const formatoEixo = series[0]?.formato ?? "numero";
  const altura = horizontal ? `${Math.max(14, categorias.length * (series.length > 1 ? 3.5 : 2.5) + 2)}rem` : undefined;
  const ultima = series.length - 1;
  return (
    <div className="flex flex-col gap-3">
      <div
        className={horizontal ? "w-full min-w-0" : "h-56 w-full min-w-0 sm:h-64 xl:h-80"}
        style={altura ? { height: altura } : undefined}
      >
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 640, height: 288 }}>
          <BarChart
            data={dados}
            layout={horizontal ? "vertical" : "horizontal"}
            margin={{ top: 8, right: horizontal ? 16 : 0, bottom: 0, left: 0 }}
            barCategoryGap="24%"
          >
            <CartesianGrid vertical={horizontal} horizontal={!horizontal} {...GRADE} />
            {horizontal ? (
              <>
                <XAxis
                  type="number"
                  tickFormatter={(v: number) => eixo(v, formatoEixo)}
                  tick={TICK}
                  tickLine={false}
                  axisLine={EIXO}
                  tickCount={4}
                />
                <YAxis
                  type="category"
                  dataKey="rotulo"
                  tick={TICK}
                  tickLine={false}
                  axisLine={false}
                  width={96}
                  interval={0}
                />
              </>
            ) : (
              <>
                <XAxis
                  dataKey="rotulo"
                  tick={TICK}
                  tickLine={false}
                  axisLine={EIXO}
                  interval="preserveStartEnd"
                  minTickGap={8}
                />
                <YAxis
                  tickFormatter={(v: number) => eixo(v, formatoEixo)}
                  tick={TICK}
                  tickLine={false}
                  axisLine={false}
                  tickCount={4}
                  width={64}
                />
              </>
            )}
            <Tooltip
              cursor={CURSOR}
              isAnimationActive={false}
              content={({ active, payload }) => {
                const l = (payload as unknown as { payload?: Linha }[] | undefined)?.[0]?.payload;
                if (!active || !l) return null;
                return (
                  <TooltipBox
                    titulo={l.rotulo}
                    linhas={series.map((s, i) => ({
                      cor: corSerie(i),
                      rotulo: s.rotulo,
                      valor: texto(Number(l[`v${i}`]), s.formato),
                    }))}
                  />
                );
              }}
            />
            {series.map((s, i) => (
              <Bar
                key={s.rotulo}
                dataKey={`v${i}`}
                name={s.rotulo}
                fill={corSerie(i)}
                stackId={empilhado ? "pilha" : undefined}
                radius={!empilhado || i === ultima ? (horizontal ? [0, raio, raio, 0] : [raio, raio, 0, 0]) : undefined}
                isAnimationActive={!reduzido}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      {series.length > 1 ? <Legenda itens={series.map((s, i) => ({ rotulo: s.rotulo, cor: corSerie(i) }))} /> : null}
    </div>
  );
}
