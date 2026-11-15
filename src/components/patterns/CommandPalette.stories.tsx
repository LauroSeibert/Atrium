import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Building2, FilePlus2, FileText, Moon, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { BASE_HISTORIAS } from "@/mocks/data/historias";
import { Button } from "../ui/Button";
import { Kbd } from "../ui/Kbd";
import { CommandPalette, useAtalhoPaleta, type GrupoPaleta } from "./CommandPalette";

const onSelect = fn();

function montarGrupos(porGrupo = 5): GrupoPaleta[] {
  return [
    {
      id: "imoveis",
      rotulo: "Imóveis",
      itens: BASE_HISTORIAS.imoveis.slice(0, porGrupo).map((i) => ({
        id: i.id,
        rotulo: i.titulo,
        descricao: `${i.codigo} · ${i.endereco.bairro}`,
        icone: Building2,
        onSelect,
      })),
    },
    {
      id: "leads",
      rotulo: "Leads",
      itens: BASE_HISTORIAS.leads.slice(0, porGrupo).map((l) => ({ id: l.id, rotulo: l.nome, icone: Users, onSelect })),
    },
    {
      id: "contratos",
      rotulo: "Contratos",
      itens: BASE_HISTORIAS.contratos.slice(0, porGrupo).map((c) => ({
        id: c.id,
        rotulo: c.numero,
        descricao: c.tipo === "venda" ? "Venda" : "Locação",
        icone: FileText,
        onSelect,
      })),
    },
    {
      id: "acoes",
      rotulo: "Ações",
      itens: [
        { id: "novo-imovel", rotulo: "Novo imóvel", icone: FilePlus2, onSelect },
        { id: "novo-lead", rotulo: "Novo lead", icone: UserPlus, onSelect },
        { id: "tema", rotulo: "Alternar tema", icone: Moon, onSelect },
      ],
    },
  ];
}

const meta = {
  title: "Padrões/CommandPalette",
  component: CommandPalette,
  args: { aberto: true, onAbertoChange: fn(), grupos: montarGrupos() },
} satisfies Meta<typeof CommandPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
export const Carregando: Story = { args: { estado: { fase: "loading" } } };
export const Vazio: Story = { args: { grupos: [] } };
export const SemResultados: Story = {
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.type(await body.findByRole("combobox", { name: "Buscar" }), "zzzxyz");
    await expect(await body.findByText("Nenhum resultado para “zzzxyz”")).toBeInTheDocument();
  },
};
export const Erro: Story = { args: { estado: { fase: "error", erro: new Error("Falha") }, onTentarNovamente: fn() } };
export const DadosExtremos: Story = {
  args: {
    grupos: [
      {
        id: "imoveis",
        rotulo: "Imóveis",
        itens: [
          {
            id: "longo",
            rotulo: "Cobertura Duplex com vista panorâmica para o mar, piscina privativa e quatro vagas de garagem",
            descricao:
              "AT-9999 · Jardim Paulista, São Paulo, SP, Brasil, na esquina da alameda com a avenida principal",
            icone: Building2,

            onSelect,
          },
        ],
      },
      ...montarGrupos(40).slice(1),
    ],
  },
};

/** Abre com ⌘K / Ctrl+K. */
export const ComAtalho: Story = {
  render: function Render(args) {
    const [aberto, setAberto] = useState(false);
    useAtalhoPaleta(() => setAberto(true));
    return (
      <div className="flex items-center gap-3 p-6">
        <Button variant="secondary" onClick={() => setAberto(true)}>
          Buscar <Kbd>⌘K</Kbd>
        </Button>
        <CommandPalette {...args} aberto={aberto} onAbertoChange={setAberto} />
      </div>
    );
  },
  args: { aberto: false },
};
