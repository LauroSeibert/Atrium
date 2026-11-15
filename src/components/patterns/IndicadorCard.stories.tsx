import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { formatMoeda } from "@/lib/format";
import type { Recurso } from "@/lib/recurso";
import { IndicadorCard, type DadosIndicador } from "./IndicadorCard";

const ok = (d: DadosIndicador): Recurso<DadosIndicador> => ({ fase: "success", dados: d });

const meta = {
  title: "Padrões/IndicadorCard",
  component: IndicadorCard,
  args: {
    rotulo: "A receber",
    estado: ok({ valor: formatMoeda(18_450_000, { compacto: true }), detalhe: "Parcelas a vencer no período" }),
    onTentarNovamente: fn(),
  },
  decorators: [
    (Story) => (
      <div className="w-72 max-w-full p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof IndicadorCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
export const Carregando: Story = { args: { estado: { fase: "loading" } } };
export const Vazio: Story = {
  args: { estado: ok({ valor: formatMoeda(0, { compacto: true }), detalhe: "Nada a receber no período" }) },
};
export const Erro: Story = { args: { estado: { fase: "error", erro: new Error("Falha de rede") } } };
export const Alerta: Story = {
  args: {
    rotulo: "Inadimplência",
    estado: ok({
      valor: formatMoeda(4_200_000, { compacto: true }),
      detalhe: "4,5% das parcelas vencidas",
      tom: "alerta",
    }),
  },
};
export const DadosExtremos: Story = {
  args: {
    rotulo: "Comissões de todos os corretores da imobiliária no período selecionado",
    estado: ok({
      valor: formatMoeda(98_765_432_100_00, { compacto: true }),
      detalhe: "Um detalhe muito longo que precisa quebrar linha sem estourar o card nem cortar o texto no mobile",
    }),
  },
};
