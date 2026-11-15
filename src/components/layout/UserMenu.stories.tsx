import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { emMain, GESTOR, PESSOAS } from "./historias-shell";
import { UserMenu } from "./UserMenu";

const meta = {
  title: "Shell/UserMenu",
  component: UserMenu,
  decorators: [emMain()],
  args: {
    usuario: { fase: "success", dados: GESTOR },
    personas: PESSOAS,
    onTrocarPersona: fn(),
  },
  parameters: { nextjs: { navigation: { pathname: "/" } } },
} satisfies Meta<typeof UserMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
export const Carregando: Story = { args: { usuario: { fase: "loading" } } };
export const Erro: Story = { args: { usuario: { fase: "error", erro: new Error("Falha ao carregar o perfil") } } };
export const NomeLongo: Story = {
  name: "Nome longo",
  args: {
    usuario: {
      fase: "success",
      dados: { ...GESTOR, nome: "Maria Fernanda de Albuquerque Cavalcanti Nogueira de Souza e Silva" },
    },
  },
};
export const SemPersonas: Story = { args: { personas: undefined } };
export const MenuAberto: Story = {
  name: "Menu aberto (play)",
  args: { modal: false },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: /Menu do usuário/ }));
    const item = await within(canvasElement.ownerDocument.body).findByRole("menuitem", { name: /Configurações/ });
    await expect(item).toBeVisible();
  },
};
