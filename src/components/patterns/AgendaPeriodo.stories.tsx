import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import type { Recurso } from "@/lib/recurso";
import { AGORA_HISTORIAS } from "@/mocks/data/historias";
import { AgendaPeriodo, type ItemAgendaPeriodo } from "./AgendaPeriodo";

const agora = new Date(AGORA_HISTORIAS);
const acoes = [
  { id: "realizada", rotulo: "Marcar como realizada", onAcionar: fn() },
  { id: "cancelada", rotulo: "Cancelar visita", onAcionar: fn() },
];
const itens: ItemAgendaPeriodo[] = [
  {
    id: "v1",
    tipo: "visita",
    quando: "2026-11-14T17:00:00.000Z",
    titulo: "Visita ao IMV-0012",
    detalhe: "Mariana Alves",
    href: "/leads/lead_1",
    situacao: { rotulo: "Agendada", tom: "info" },
    acoes,
  },
  {
    id: "p1",
    tipo: "vencimento",
    quando: "2026-11-15",
    titulo: "Parcela 3 do contrato CTR-0004",
    detalhe: "R$ 2.500,00",
    href: "/contratos/ctr_4",
    situacao: { rotulo: "A vencer", tom: "neutral" },
  },
  {
    id: "v2",
    tipo: "visita",
    quando: "2026-11-17T13:30:00.000Z",
    titulo: "Visita ao IMV-0020",
    detalhe: "Carlos Lima",
    situacao: { rotulo: "Realizada", tom: "success" },
  },
];
const sucesso = (d: readonly ItemAgendaPeriodo[]): Recurso<readonly ItemAgendaPeriodo[]> => ({
  fase: "success",
  dados: d,
});

const meta = {
  title: "Padrões/AgendaPeriodo",
  component: AgendaPeriodo,
  args: { estado: sucesso(itens), agora, onTentarNovamente: fn() },
  decorators: [
    (Story) => (
      <div className="max-w-xl p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AgendaPeriodo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
export const Carregando: Story = { args: { estado: { fase: "loading" } } };
export const Vazio: Story = { args: { estado: sucesso([]) } };
export const Erro: Story = { args: { estado: { fase: "error", erro: new Error("Falha de rede") } } };

/** Texto longo sem espaços e muitos compromissos. */
export const DadosExtremos: Story = {
  args: {
    estado: sucesso([
      {
        ...itens[0]!,
        id: "longo",
        titulo: "Visita ao ".concat("apartamento_muito_longo_".repeat(8)),
        detalhe: "Nome ".repeat(60),
      },
      ...Array.from({ length: 40 }, (_, i) => ({
        ...itens[i % 3]!,
        id: `x${i}`,
        quando:
          i % 3 === 1
            ? `2026-11-${String(15 + (i % 6)).padStart(2, "0")}`
            : `2026-11-${String(15 + (i % 6)).padStart(2, "0")}T14:00:00.000Z`,
      })),
    ]),
  },
};
