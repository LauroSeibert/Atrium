import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { useState } from "react";
import type { Notificacao } from "@/domain";
import { AGORA, AUTORES, emMain, hrefDaNotificacao, NOTIFICACOES } from "./historias-shell";
import { NotificationCenter } from "./NotificationCenter";

const meta = {
  title: "Shell/NotificationCenter",
  component: NotificationCenter,
  decorators: [emMain("flex min-h-160 justify-end p-6")],
  args: {
    estado: { fase: "success", dados: NOTIFICACOES },
    aberto: true,
    agora: AGORA,
    autores: AUTORES,
    hrefDe: hrefDaNotificacao,
    onMarcarLida: fn(),
    onMarcarTodas: fn(),
    onTentarNovamente: fn(),
    onAbertoChange: fn(),
  },
  parameters: { nextjs: { navigation: { pathname: "/" } } },
} satisfies Meta<typeof NotificationCenter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
export const TodasLidas: Story = {
  name: "Todas lidas",
  args: { estado: { fase: "success", dados: NOTIFICACOES.map((n) => ({ ...n, lida: true })) } },
};
export const Carregando: Story = { args: { estado: { fase: "loading" } } };
export const Vazio: Story = { args: { estado: { fase: "success", dados: [] } } };
export const Erro: Story = {
  args: { estado: { fase: "error", erro: new Error("Falha de rede") } },
};
export const AtualizandoComDados: Story = {
  name: "Atualizando com dados",
  args: { estado: { fase: "loading", dados: NOTIFICACOES } },
};
export const MuitasNaoLidas: Story = {
  name: "Muitas não lidas (9+)",
  args: { aberto: false, estado: { fase: "success", dados: NOTIFICACOES } },
};
export const UmaNaoLida: Story = {
  name: "Uma não lida",
  args: {
    aberto: false,
    estado: { fase: "success", dados: NOTIFICACOES.map((n, i): Notificacao => ({ ...n, lida: i > 0 })) },
  },
};
export const Fechado: Story = { args: { aberto: false } };

function NotificacoesInterativas() {
  const [lista, setLista] = useState(NOTIFICACOES);
  return (
    <NotificationCenter
      estado={{ fase: "success", dados: lista }}
      agora={AGORA}
      autores={AUTORES}
      hrefDe={hrefDaNotificacao}
      onMarcarLida={(id) => setLista((l) => l.map((n) => (n.id === id ? { ...n, lida: true } : n)))}
      onMarcarTodas={() => setLista((l) => l.map((n) => ({ ...n, lida: true })))}
    />
  );
}
export const Interativo: Story = {
  name: "Interativo (marcar como lida)",
  render: () => <NotificacoesInterativas />,
};
