import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { fn } from "storybook/test";
import { Sidebar } from "./Sidebar";
import { comTooltips, CONTADORES, useNavegacaoLocal } from "./historias-shell";

const meta = {
  title: "Shell/Sidebar",
  component: Sidebar,
  decorators: [comTooltips],
  args: { pathname: "/imoveis", recolhida: false, onAlternarRecolhida: fn() },
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: "/imoveis" } } },
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Expandida: Story = {};
export const Recolhida: Story = { args: { recolhida: true } };
export const ComBadges: Story = { args: { contadores: CONTADORES, pathname: "/leads" } };
export const SemBadges: Story = {
  name: "Sem badges (carregando ou erro)",
  args: { contadores: undefined },
};
export const ContadoresExtremos: Story = {
  name: "Contadores extremos (0 e 1234)",
  args: { contadores: { leadsNovos: 1234, parcelasAtrasadas: 0 } },
};
export const ContadoresExtremosRecolhida: Story = {
  name: "Contadores extremos (recolhida)",
  args: { recolhida: true, contadores: { leadsNovos: 1234, parcelasAtrasadas: 7 } },
};
export const TomMarca: Story = {
  name: "Tom marca",
  args: { tom: "marca", contadores: CONTADORES },
};
export const ComparacaoDeTom: Story = {
  name: "Comparação de tom",
  render: (args) => (
    <div className="flex flex-wrap gap-6 bg-bg p-6">
      {(
        [
          ["Clara (padrão)", "clara"],
          ["Marca", "marca"],
        ] as const
      ).map(([legenda, tom]) => (
        <figure key={tom} className="flex flex-col gap-2">
          <figcaption className="text-sm font-medium text-text">{legenda}</figcaption>
          <Sidebar
            {...args}
            tom={tom}
            contadores={CONTADORES}
            aria-label={`Menu principal, tom ${legenda}`}
            className="h-160"
          />
        </figure>
      ))}
    </div>
  ),
};
export const ItemAtivoEmSubrota: Story = {
  name: "Item ativo em sub-rota",
  args: { pathname: "/imoveis/abc", contadores: CONTADORES },
};

function SidebarInterativa({ tom }: { tom?: "clara" | "marca" }) {
  const [recolhida, setRecolhida] = useState(false);
  const { pathname, capturar } = useNavegacaoLocal("/");
  return (
    <div onClickCapture={capturar} className="contents">
      <Sidebar
        pathname={pathname}
        recolhida={recolhida}
        onAlternarRecolhida={() => setRecolhida((r) => !r)}
        contadores={CONTADORES}
        tom={tom}
      />
    </div>
  );
}

export const Interativa: Story = {
  name: "Interativa (recolher e navegar)",
  render: () => <SidebarInterativa />,
};
