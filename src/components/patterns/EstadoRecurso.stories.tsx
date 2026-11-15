import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { BASE_HISTORIAS } from "@/mocks/data/historias";
import { Skeleton } from "../ui/Skeleton";
import { EmptyState } from "./EmptyState";
import { EstadoRecurso } from "./EstadoRecurso";

const nomes = BASE_HISTORIAS.leads.slice(0, 4).map((l) => l.nome);

const meta = {
  title: "Padrões/EstadoRecurso",
  component: EstadoRecurso<string[]>,
  args: {
    estado: { fase: "success", dados: nomes },
    onTentarNovamente: fn(),
    carregando: (
      <div className="flex flex-col gap-2" aria-busy="true">
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </div>
    ),
    estaVazio: (d: string[]) => d.length === 0,
    vazio: <EmptyState ilustracao="semLeads" titulo="Nenhum lead ainda" tamanho="compacto" />,
    children: (dados: string[]) => (
      <ul className="flex list-disc flex-col gap-1 pl-5 text-text">
        {dados.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
    ),
  },
  decorators: [
    (Story) => (
      <div className="max-w-xl p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EstadoRecurso<string[]>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Sucesso: Story = {};
export const Ocioso: Story = { args: { estado: { fase: "idle" } } };
export const Carregando: Story = { args: { estado: { fase: "loading" } } };
export const CarregandoComDados: Story = { args: { estado: { fase: "loading", dados: nomes } } };
export const Vazio: Story = { args: { estado: { fase: "success", dados: [] } } };
export const Parcial: Story = {
  args: { estado: { fase: "partial", dados: nomes, aviso: "Alguns leads não puderam ser carregados." } },
};
export const Erro: Story = { args: { estado: { fase: "error", erro: new Error("Falha") } } };
export const ErroComDados: Story = { args: { estado: { fase: "error", erro: new Error("Falha"), dados: nomes } } };
