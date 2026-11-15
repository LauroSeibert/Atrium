import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { calcularDashboard, type Funil } from "@/domain";
import { AGORA_HISTORIAS, BASE_HISTORIAS } from "@/mocks/data/historias";
import type { Recurso } from "@/lib/recurso";
import { FunnelChartCard } from "./FunnelChart";

const funil = calcularDashboard(BASE_HISTORIAS, "mesAtual", AGORA_HISTORIAS).funil;
const sucesso = (d: Funil): Recurso<Funil> => ({ fase: "success", dados: d });

const meta = {
  title: "Padrões/FunnelChart",
  component: FunnelChartCard,
  args: { estado: sucesso(funil), onTentarNovamente: fn() },
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FunnelChartCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** RF-12: quantidade, perdidos por etapa e conversão entre etapas. */
export const Normal: Story = {};
export const Carregando: Story = { args: { estado: { fase: "loading" } } };
/** Sem leads. */
export const Vazio: Story = {
  args: { estado: sucesso(funil.map((l) => ({ ...l, quantidade: 0, perdidos: 0, conversao: null }))) },
};
export const Erro: Story = { args: { estado: { fase: "error", erro: new Error("Falha de rede") } } };
export const DadosExtremos: Story = {
  args: {
    estado: sucesso([
      { etapa: "novo", quantidade: 1_250_000, perdidos: 300_000, conversao: 0.7 },
      { etapa: "contato", quantidade: 1, perdidos: 0, conversao: 0.000001 },
      { etapa: "visita", quantidade: 0, perdidos: 0, conversao: null },
      { etapa: "proposta", quantidade: 40, perdidos: 1_000_000, conversao: 0 },
      { etapa: "fechado", quantidade: 5, perdidos: 0, conversao: null },
      { etapa: "perdido", quantidade: 1_300_000, perdidos: 1_300_000, conversao: null },
    ]),
  },
};
