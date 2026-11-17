import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { LinkCodigo } from "./LinkCodigo";

const meta = {
  title: "Padrões/LinkCodigo",
  component: LinkCodigo,
  args: { href: "/contratos/ctr_1", children: "CT-2026-0012" },
} satisfies Meta<typeof LinkCodigo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
/** Sem estado de carregamento próprio: é só texto com destino. */
export const Carregando: Story = { render: () => <span className="num text-sm text-text-muted">…</span> };
export const Vazio: Story = { render: () => <EmptyState tamanho="compacto" titulo="Sem código" /> };
export const Erro: Story = { render: () => <ErrorState tamanho="compacto" onTentarNovamente={() => {}} /> };
export const DadosExtremos: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-40 overflow-hidden">
        <Story />
      </div>
    ),
  ],
  args: { children: "CT-2026-0012-ADITIVO-COM-CODIGO-MUITO-LONGO-PARA-TESTAR" },
};
