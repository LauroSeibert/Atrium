import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Plus } from "lucide-react";
import { fn } from "storybook/test";
import { Button } from "../ui/Button";
import { VIEWPORT_360, VIEWPORTS_SHELL } from "./historias-shell";
import { MobileActionBar } from "./MobileActionBar";

const meta = {
  title: "Shell/MobileActionBar",
  component: MobileActionBar,
  decorators: [
    (Story) => (
      <main className="min-h-dvh p-4 pb-24 text-sm text-text-muted">
        Conteúdo da página. A barra fica fixa na base da tela e só aparece abaixo de 768 px.
        <Story />
      </main>
    ),
  ],
  parameters: { viewport: { options: VIEWPORTS_SHELL } },
  globals: { viewport: VIEWPORT_360 },
} satisfies Meta<typeof MobileActionBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {
  name: "Mobile (360 px)",
  args: { children: <Button leadingIcon={Plus}>Novo imóvel</Button> },
};
export const DuasAcoes: Story = {
  name: "Duas ações",
  args: {
    children: (
      <>
        <Button variant="secondary" onClick={fn()}>
          Cancelar
        </Button>
        <Button onClick={fn()}>Salvar</Button>
      </>
    ),
  },
};
export const RotuloLongo: Story = {
  name: "Rótulo longo",
  args: { children: <Button>Registrar visita com o cliente e enviar confirmação por e-mail</Button> },
};
