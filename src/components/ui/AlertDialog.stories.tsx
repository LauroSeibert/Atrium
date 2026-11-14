import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./Button";
import { AlertDialog } from "./AlertDialog";

const meta = {
  title: "Átomos/AlertDialog",
  component: AlertDialog,
  args: {
    defaultOpen: true,
    trigger: <Button variant="destructive">Excluir rascunho</Button>,
    title: "Excluir rascunho do anúncio?",
    description:
      "O rascunho do anúncio do Apto 52, Ed. Solar das Palmeiras, com fotos e descrição ainda não publicadas, será removido. Esta ação não pode ser desfeita.",
    confirmLabel: "Excluir rascunho",
    cancelLabel: "Manter rascunho",
  },
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = { name: "Padrão" };
export const Carregando: Story = { args: { loading: true, closeOnConfirm: false } };
export const TextoLongo: Story = {
  name: "Texto longo",
  args: {
    title: "Excluir o imóvel Cobertura Duplex Vista Mar, Av. Atlântica 3000, Copacabana, Rio de Janeiro?",
    description:
      "Fotos, documentos, histórico de visitas e 14 leads vinculados deixam de aparecer na listagem. Contratos já encerrados continuam consultáveis.",
    confirmLabel: "Excluir imóvel",
  },
};
