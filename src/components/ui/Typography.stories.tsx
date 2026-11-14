import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { formatMoeda } from "@/lib/format";
import { Caption, Heading, Label, Numeric, Text } from "./Typography";

const meta = { title: "Átomos/Typography", parameters: { layout: "padded" } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Titulos: Story = {
  name: "Títulos",
  render: () => (
    <div className="flex flex-col gap-3">
      <Heading level={1} size="3xl">
        Painel (3xl · 40)
      </Heading>
      <Heading level={1}>Imóveis (2xl · 32)</Heading>
      <Heading level={2}>Leads da semana (xl · 24)</Heading>
      <Heading level={3}>Ficha técnica (lg · 20)</Heading>
      <Heading level={4}>Cômodos (base · 16)</Heading>
    </div>
  ),
};

export const Textos: Story = {
  render: () => (
    <div className="flex max-w-prose flex-col gap-3">
      <Text size="base">Corpo 16 px: apartamento de 3 quartos com varanda gourmet, a 5 minutos do metrô.</Text>
      <Text>Corpo 14 px (padrão): última visita agendada para quinta-feira.</Text>
      <Text tone="muted">Secundário: criado por Ana Souza há 2 dias.</Text>
      <Text tone="success">Pagamento registrado.</Text>
      <Text tone="warning">Contrato vence em 5 dias.</Text>
      <Text tone="danger">3 parcelas em atraso.</Text>
      <Caption>Legenda 12 px: valores em reais, atualizados hoje.</Caption>
    </div>
  ),
};

export const Rotulos: Story = {
  name: "Rótulos",
  render: () => (
    <div className="flex flex-col gap-2">
      <Label htmlFor="a">Título do imóvel</Label>
      <Label htmlFor="b" requirement="required">
        Preço
      </Label>
      <Label htmlFor="c" requirement="optional">
        Código interno
      </Label>
    </div>
  ),
};

export const Numeros: Story = {
  name: "Números (tabulares)",
  render: () => (
    <div className="flex flex-col items-end gap-1">
      <Numeric size="3xl" weight="semibold">
        {formatMoeda(184_250_000, { compacto: true })}
      </Numeric>
      <Numeric>{formatMoeda(111_111)}</Numeric>
      <Numeric>{formatMoeda(999_999)}</Numeric>
    </div>
  ),
};
