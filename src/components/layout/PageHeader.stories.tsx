import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Download, Plus } from "lucide-react";
import { Button } from "../ui/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/Tabs";
import { VIEWPORT_360, VIEWPORTS_SHELL } from "./historias-shell";
import { PageHeader } from "./PageHeader";

const meta = {
  title: "Shell/PageHeader",
  component: PageHeader,
  decorators: [
    (Story) => (
      <main className="max-w-5xl p-6">
        <Story />
      </main>
    ),
  ],
  args: { titulo: "Imóveis", descricao: "Gerencie o portfólio da imobiliária." },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
export const ComAcoes: Story = {
  name: "Com ações",
  args: {
    acoes: (
      <Button variant="secondary" leadingIcon={Download}>
        Exportar
      </Button>
    ),
    acaoPrimaria: <Button leadingIcon={Plus}>Novo imóvel</Button>,
  },
};
export const SoTitulo: Story = { name: "Só título", args: { descricao: undefined } };
export const TituloLongo: Story = {
  name: "Título longo",
  args: {
    titulo: "Cobertura Duplex com vista panorâmica para o mar e acabamento de alto padrão no Jardim Botânico",
    descricao:
      "Descrição longa que se estende por mais de uma linha para conferir a largura máxima do texto e a quebra em telas estreitas, sem empurrar as ações para fora.",
    acoes: <Button variant="secondary">Editar</Button>,
    acaoPrimaria: <Button>Registrar visita</Button>,
  },
};
export const ComConteudoAbaixo: Story = {
  name: "Com conteúdo abaixo (abas)",
  args: {
    acaoPrimaria: <Button leadingIcon={Plus}>Novo lead</Button>,
    children: (
      <Tabs defaultValue="todos">
        <TabsList aria-label="Filtro de etapa">
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="novos" count={9}>
            Novos
          </TabsTrigger>
          <TabsTrigger value="negociacao">Em negociação</TabsTrigger>
        </TabsList>
        <TabsContent value="todos">Todos os leads.</TabsContent>
        <TabsContent value="novos">Leads novos.</TabsContent>
        <TabsContent value="negociacao">Leads em negociação.</TabsContent>
      </Tabs>
    ),
  },
};

/** Abaixo de 768 px a ação primária sai do cabeçalho e vai para a barra inferior (RF-63). */
export const Mobile: Story = {
  name: "Mobile (360 px)",
  args: {
    acoes: (
      <Button variant="secondary" leadingIcon={Download}>
        Exportar
      </Button>
    ),
    acaoPrimaria: <Button leadingIcon={Plus}>Novo imóvel</Button>,
  },
  parameters: { viewport: { options: VIEWPORTS_SHELL } },
  globals: { viewport: VIEWPORT_360 },
};
