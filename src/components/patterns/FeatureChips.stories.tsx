import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import type { Recurso } from "@/lib/recurso";
import { BASE_HISTORIAS } from "@/mocks/data/historias";
import { EstadoRecurso } from "./EstadoRecurso";
import { FeatureChips } from "./FeatureChips";
import { Skeleton } from "../ui/Skeleton";

const comMuitos = BASE_HISTORIAS.imoveis.reduce((a, b) => (b.diferenciais.length > a.diferenciais.length ? b : a));

const meta = {
  title: "Padrões/FeatureChips",
  component: FeatureChips,
  args: { diferenciais: comMuitos.diferenciais },
  decorators: [
    (Story) => (
      <div className="max-w-xl p-4 sm:p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FeatureChips>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
export const Expandir: Story = {
  args: { limite: 3 },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole("button", { expanded: false }));
    await expect(c.getByRole("button", { name: "Mostrar menos" })).toBeInTheDocument();
  },
};
export const Carregando: Story = {
  render: () => (
    <div role="status" aria-busy="true" aria-label="Carregando diferenciais" className="flex gap-2">
      <Skeleton className="h-6 w-20 rounded-full" />
      <Skeleton className="h-6 w-28 rounded-full" />
      <Skeleton className="h-6 w-24 rounded-full" />
    </div>
  ),
};
export const Vazio: Story = { args: { diferenciais: [] } };
const erro: Recurso<string[]> = { fase: "error", erro: new Error("Falha de rede") };
export const Erro: Story = {
  render: () => (
    <EstadoRecurso<string[]> estado={erro} carregando={null} onTentarNovamente={fn()}>
      {() => null}
    </EstadoRecurso>
  ),
};
export const DadosExtremos: Story = {
  name: "Dados extremos: 40 itens e texto longo",
  args: {
    diferenciais: [
      "Condomínio fechado com portaria 24 horas, segurança armada e monitoramento por câmeras em todas as áreas comuns",
      ...Array.from({ length: 39 }, (_, i) => `Diferencial ${i + 1}`),
    ],
  },
};
export const PoucosItens: Story = { args: { diferenciais: ["Piscina", "Churrasqueira"] } };
