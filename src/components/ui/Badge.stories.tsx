import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CircleCheck, Clock, TriangleAlert } from "lucide-react";
import { Badge, Tag } from "./Badge";

const meta = {
  title: "Átomos/Badge",
  component: Badge,
  args: { children: "Disponível" },
  argTypes: {
    tone: { control: "inline-radio", options: ["neutral", "primary", "success", "warning", "danger", "info"] },
    size: { control: "inline-radio", options: ["sm", "md"] },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = { name: "Padrão" };

// ATENÇÃO: o mapeamento status → tom abaixo é só ilustrativo. O mapa real virá de
// src/domain/<entidade> (Fase de domínio) e não deve ser copiado para telas.
export const StatusDoImovel: Story = {
  name: "Status do imóvel",
  render: () => (
    <div className="flex flex-wrap gap-2 p-6">
      <Badge tone="success" dot>
        Disponível
      </Badge>
      <Badge tone="warning" dot>
        Reservado
      </Badge>
      <Badge tone="primary" dot>
        Vendido
      </Badge>
      <Badge tone="info" dot>
        Alugado
      </Badge>
      <Badge tone="neutral" dot>
        Inativo
      </Badge>
    </div>
  ),
};

// Idem: mapeamento ilustrativo; o real virá de src/domain/<entidade>.
export const EtapasDoLead: Story = {
  name: "Etapas do lead",
  render: () => (
    <div className="flex flex-wrap gap-2 p-6">
      <Badge tone="info">Novo</Badge>
      <Badge tone="neutral">Contato feito</Badge>
      <Badge tone="warning">Visita agendada</Badge>
      <Badge tone="primary">Proposta</Badge>
      <Badge tone="success">Fechado</Badge>
      <Badge tone="danger">Perdido</Badge>
    </div>
  ),
};

// Idem: mapeamento ilustrativo; o real virá de src/domain/<entidade>.
export const StatusDaParcela: Story = {
  name: "Status da parcela (com ícone)",
  render: () => (
    <div className="flex flex-wrap gap-2 p-6">
      <Badge tone="success" icon={CircleCheck}>
        Pago
      </Badge>
      <Badge tone="warning" icon={Clock}>
        A vencer
      </Badge>
      <Badge tone="danger" icon={TriangleAlert}>
        Atrasado
      </Badge>
    </div>
  ),
};

export const Tamanhos: Story = {
  render: () => (
    <div className="flex items-center gap-2 p-6">
      <Badge size="sm" tone="success">
        Pequeno
      </Badge>
      <Badge size="md" tone="success">
        Médio
      </Badge>
    </div>
  ),
};

export const TextoLongo: Story = {
  name: "Texto longo (caso extremo)",
  render: () => (
    <div className="w-48 p-6">
      <Badge tone="warning" className="max-w-full">
        <span className="truncate">Aguardando assinatura do contrato de locação pelo fiador</span>
      </Badge>
    </div>
  ),
};

export const Tags: Story = {
  name: "Tag removível",
  render: () => (
    <div className="flex flex-wrap gap-2 p-6">
      <Tag onRemove={() => {}}>Apartamento</Tag>
      <Tag onRemove={() => {}}>Pinheiros</Tag>
      <Tag onRemove={() => {}}>Até R$ 800 mil</Tag>
      <Tag>Somente leitura</Tag>
      <Tag onRemove={() => {}} removeLabel="Remover filtro de bairro Pinheiros">
        Pinheiros (rótulo personalizado)
      </Tag>
    </div>
  ),
};
