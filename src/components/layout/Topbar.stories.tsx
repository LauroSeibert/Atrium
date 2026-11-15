import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import {
  AGORA,
  AUTORES,
  comTooltips,
  GESTOR,
  hrefDaNotificacao,
  NOTIFICACOES,
  PESSOAS,
  VIEWPORT_360,
  VIEWPORTS_SHELL,
} from "./historias-shell";
import { NotificationCenter } from "./NotificationCenter";
import { SearchTrigger } from "./SearchTrigger";
import { ThemeMenu } from "./ThemeMenu";
import { Topbar } from "./Topbar";
import { UserMenu } from "./UserMenu";

const slots = {
  busca: <SearchTrigger onAbrir={fn()} />,
  notificacoes: (
    <NotificationCenter
      estado={{ fase: "success", dados: NOTIFICACOES }}
      agora={AGORA}
      autores={AUTORES}
      hrefDe={hrefDaNotificacao}
      onMarcarLida={fn()}
      onMarcarTodas={fn()}
    />
  ),
  tema: <ThemeMenu tema="light" temaResolvido="light" onTemaChange={fn()} />,
  usuario: <UserMenu usuario={{ fase: "success", dados: GESTOR }} personas={PESSOAS} onTrocarPersona={fn()} />,
};

const meta = {
  title: "Shell/Topbar",
  component: Topbar,
  decorators: [
    comTooltips,
    (Story) => (
      <>
        <Story />
        <main className="p-6 text-sm text-text-muted">Conteúdo da página.</main>
      </>
    ),
  ],
  args: {
    trilha: [{ rotulo: "Imóveis", href: "/imoveis" }, { rotulo: "IMV-0012" }],
    onAbrirMenu: fn(),
    ...slots,
  },
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: "/imoveis/abc" } } },
} satisfies Meta<typeof Topbar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Todos os slots com os compostos reais. */
export const DesktopCompleto: Story = { name: "Desktop completo" };
export const TrilhaLonga: Story = {
  name: "Trilha longa",
  args: {
    trilha: [
      { rotulo: "Contratos de locação residencial", href: "/contratos" },
      { rotulo: "Contrato CT-2026-0003 com garantia de seguro fiança", href: "/contratos/abc" },
      { rotulo: "Parcelas e comissões do período de janeiro a dezembro", href: "/contratos/abc/parcelas" },
      { rotulo: "Editar condições de pagamento do contrato de locação" },
    ],
  },
};
export const Mobile: Story = {
  name: "Mobile (360 px)",
  parameters: { viewport: { options: VIEWPORTS_SHELL } },
  globals: { viewport: VIEWPORT_360 },
};
/** `.storybook` só traz o viewport de 360 px; estes dois valem só para esta história. */
const VIEWPORTS_TOPBAR = {
  m768: { name: "Tablet 768", styles: { width: "768px", height: "1024px" }, type: "tablet" },
  d1024: { name: "Desktop 1024", styles: { width: "1024px", height: "768px" }, type: "desktop" },
} as const;
export const Tablet: Story = {
  name: "Tablet (768 px)",
  parameters: { viewport: { options: VIEWPORTS_TOPBAR } },
  globals: { viewport: { value: "m768", isRotated: false } },
};
export const Desktop1024: Story = {
  name: "Desktop (1024 px)",
  parameters: { viewport: { options: VIEWPORTS_TOPBAR } },
  globals: { viewport: { value: "d1024", isRotated: false } },
};
export const MenuAberto: Story = { name: "Botão de menu pressionado", args: { menuAberto: true } };
export const SemSlots: Story = {
  name: "Sem slots",
  args: { busca: undefined, notificacoes: undefined, tema: undefined, usuario: undefined },
};
