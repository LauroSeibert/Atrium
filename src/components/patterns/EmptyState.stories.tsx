import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { VAZIO_VARIANTES } from "@/assets/svg/vazios/SvgVazio";
import { Button } from "../ui/Button";
import { EmptyState } from "./EmptyState";

const meta = {
  title: "Padrões/EmptyState",
  component: EmptyState,
  args: {
    titulo: "Nenhum imóvel encontrado",
    descricao: "Ajuste os filtros ou cadastre um novo imóvel.",
    acao: <Button onClick={fn()}>Novo imóvel</Button>,
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
export const SemResultados: Story = {
  args: { ilustracao: "semResultados", acao: <Button variant="secondary">Limpar filtros</Button> },
};
export const SemLeads: Story = {
  args: {
    ilustracao: "semLeads",
    titulo: "Nenhum lead ainda",
    descricao: "Cadastre o primeiro lead.",
    acao: <Button>Novo lead</Button>,
  },
};
export const SemContratos: Story = {
  args: {
    ilustracao: "semContratos",
    titulo: "Nenhum contrato",
    descricao: "Contratos aparecem aqui.",
    acao: undefined,
  },
};
export const Compacto: Story = { args: { tamanho: "compacto" } };
export const SemAcao: Story = { args: { acao: undefined } };
export const SemDescricao: Story = { args: { descricao: undefined, acao: undefined } };
export const TituloLongo: Story = {
  args: {
    titulo:
      "Nenhum imóvel encontrado para a combinação de filtros selecionada: cobertura duplex com piscina privativa em bairros nobres",
    descricao: "Remova alguns filtros para ampliar a busca.",
  },
};
export const TodasAsIlustracoes: Story = {
  render: () => (
    <div className="grid gap-6 p-6 sm:grid-cols-2">
      {VAZIO_VARIANTES.map((v) => (
        <EmptyState key={v.variant} ilustracao={v.variant} titulo={v.rotulo} tamanho="compacto" headingLevel={3} />
      ))}
    </div>
  ),
};
