import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { TIPOS_IMOVEL } from "@/domain";
import { BASE_HISTORIAS } from "@/mocks/data/historias";
import type { Recurso } from "@/lib/recurso";
import { DistributionChartCard, type ItemDistribuicao } from "./DistributionChart";
import { TIPO_IMOVEL_ROTULO } from "./rotulos";

const porTipo: ItemDistribuicao[] = TIPOS_IMOVEL.map((tipo) => ({
  rotulo: TIPO_IMOVEL_ROTULO[tipo],
  valor: BASE_HISTORIAS.imoveis.filter((i) => i.tipo === tipo).length,
}));
const sucesso = (d: ItemDistribuicao[]): Recurso<ItemDistribuicao[]> => ({ fase: "success", dados: d });

const meta = {
  title: "Padrões/DistributionChart",
  component: DistributionChartCard,
  args: { estado: sucesso(porTipo), onTentarNovamente: fn() },
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DistributionChartCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Imóveis por tipo: donut com total no centro e legenda rótulo + valor + %. */
export const Normal: Story = {};
export const Carregando: Story = { args: { estado: { fase: "loading" } } };
export const Vazio: Story = { args: { estado: sucesso(porTipo.map((i) => ({ ...i, valor: 0 }))) } };
export const Erro: Story = { args: { estado: { fase: "error", erro: new Error("Falha de rede") } } };
export const FatiaUnica: Story = { args: { estado: sucesso([{ rotulo: "Casa", valor: 12 }]) } };
export const DadosExtremos: Story = {
  args: {
    estado: sucesso([
      { rotulo: "Apartamento de alto padrão com varanda gourmet e vista permanente para o mar", valor: 1_250_000 },
      { rotulo: "Casa", valor: 3 },
      { rotulo: "Terreno", valor: 0 },
      { rotulo: "Cobertura duplex", valor: 1 },
      { rotulo: "Sala comercial", valor: 40 },
      { rotulo: "Galpão", valor: 2 },
      { rotulo: "Chácara", valor: 7 },
    ]),
  },
};
