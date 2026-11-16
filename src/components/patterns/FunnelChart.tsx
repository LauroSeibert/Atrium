"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Funil } from "@/domain";
import { formatNumero, formatPercentual } from "@/lib/format";
import type { Recurso } from "@/lib/recurso";
import { ChartCard, type TabelaGrafico } from "./ChartCard";
import { CURSOR, EIXO, GRADE, Legenda, TICK, TooltipBox, useMovimentoReduzido } from "./ChartParts";
import { ETAPA_UI } from "./rotulos";

/** Funil de leads por etapa, com quantidade, perdidos e conversão (RF-12; alternativa textual: RNF-17). */

const NA_ETAPA = "var(--chart-5)";
const PERDIDOS = "var(--chart-2)";

type Linha = Funil[number];
/** A etapa `perdido` não é degrau do funil: seus leads aparecem como `perdidos` de cada etapa. */
const degraus = (f: Funil) => f.filter((l) => l.etapa !== "perdido");
const totalPerdidos = (f: Funil) => f.reduce((s, l) => s + (l.etapa === "perdido" ? 0 : l.perdidos), 0);
export const funilVazio = (f: Funil) => f.every((l) => l.quantidade === 0 && l.perdidos === 0);
const conv = (c: number | null) => (c === null ? "—" : formatPercentual(c));
const nome = (l: Linha) => ETAPA_UI[l.etapa].rotulo;

export function resumoFunil(f: Funil): string {
  const d = degraus(f);
  const ativos = d.reduce((s, l) => s + l.quantidade, 0);
  const perdidos = totalPerdidos(f);
  if (ativos + perdidos === 0) return "Nenhum lead no funil.";
  const partes = d
    .filter((l) => l.conversao !== null)
    .map((l) => `${nome(l)} avança ${conv(l.conversao)}`)
    .join("; ");
  return (
    `${formatNumero(ativos)} leads ativos ou fechados e ${formatNumero(perdidos)} perdidos. ` +
    (partes ? `Conversão para a etapa seguinte: ${partes}.` : "")
  );
}

export function tabelaFunil(f: Funil): TabelaGrafico {
  return {
    rotulo: "Leads por etapa do funil",
    colunas: [
      { rotulo: "Etapa" },
      { rotulo: "Leads", alinhar: "right" },
      { rotulo: "Perdidos na etapa", alinhar: "right" },
      { rotulo: "Conversão para a próxima", alinhar: "right" },
    ],
    linhas: degraus(f).map((l) => [nome(l), formatNumero(l.quantidade), formatNumero(l.perdidos), conv(l.conversao)]),
  };
}

type TickProps = { x?: number; y?: number; payload?: { value: string }; linhas: Map<string, Linha> };

/** Rótulo do eixo: etapa (negrito) e, abaixo, quantidade e conversão. */
function TickEtapa({ x = 0, y = 0, payload, linhas }: TickProps) {
  const l = payload ? linhas.get(payload.value) : undefined;
  if (!l) return null;
  return (
    <g transform={`translate(${x},${y})`}>
      <text textAnchor="end" fill="var(--text)" fontSize={12} fontWeight={600} dy={-2}>
        {nome(l)}
      </text>
      <text textAnchor="end" fill="var(--text-muted)" fontSize={12} dy={12}>
        {formatNumero(l.quantidade)} · {l.conversao === null ? "—" : `${formatPercentual(l.conversao, 0)} avançam`}
      </text>
    </g>
  );
}

/** Barras horizontais por etapa: leads na etapa e perdidos nela. */
export function FunnelChart({ dados }: { dados: Funil }) {
  const reduzido = useMovimentoReduzido();
  const d = degraus(dados);
  const linhas = new Map(d.map((l) => [l.etapa as string, l]));
  return (
    <div className="flex flex-col gap-3">
      <div className="h-72 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 640, height: 288 }}>
          <BarChart data={d} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 0 }} barCategoryGap="22%">
            <CartesianGrid horizontal={false} {...GRADE} />
            <XAxis type="number" allowDecimals={false} tick={TICK} tickLine={false} axisLine={EIXO} />
            <YAxis
              type="category"
              dataKey="etapa"
              width={128}
              tickLine={false}
              axisLine={false}
              interval={0}
              tick={(p: unknown) => <TickEtapa {...(p as Omit<TickProps, "linhas">)} linhas={linhas} />}
            />
            <Tooltip
              cursor={CURSOR}
              isAnimationActive={false}
              content={({ active, payload }) => {
                const l = (payload as unknown as { payload?: Linha }[] | undefined)?.[0]?.payload;
                if (!active || !l) return null;
                return (
                  <TooltipBox
                    titulo={nome(l)}
                    linhas={[
                      { cor: NA_ETAPA, rotulo: "Leads na etapa", valor: formatNumero(l.quantidade) },
                      { cor: PERDIDOS, rotulo: "Perdidos na etapa", valor: formatNumero(l.perdidos) },
                    ]}
                    rodape={`Conversão para a próxima: ${conv(l.conversao)}`}
                  />
                );
              }}
            />
            <Bar dataKey="quantidade" name="Leads na etapa" stackId="f" fill={NA_ETAPA} isAnimationActive={!reduzido} />
            <Bar
              dataKey="perdidos"
              name="Perdidos na etapa"
              stackId="f"
              fill={PERDIDOS}
              isAnimationActive={!reduzido}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Legenda
        itens={[
          { rotulo: "Leads na etapa", cor: NA_ETAPA },
          { rotulo: "Perdidos na etapa", cor: PERDIDOS },
        ]}
      />
    </div>
  );
}

export type FunnelChartCardProps = {
  estado: Recurso<Funil>;
  onTentarNovamente?: () => void;
  className?: string;
};

/** Card do funil de leads (RF-12). */
export function FunnelChartCard({ estado, onTentarNovamente, className }: FunnelChartCardProps) {
  return (
    <ChartCard
      titulo="Funil de leads"
      estado={estado}
      onTentarNovamente={onTentarNovamente}
      estaVazio={funilVazio}
      tituloVazio="Nenhum lead no funil"
      resumo={resumoFunil}
      tabela={tabelaFunil}
      grafico={(d) => <FunnelChart dados={d} />}
      className={className}
    />
  );
}
