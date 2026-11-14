import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./Tabs";

const meta = { title: "Átomos/Tabs", component: Tabs } satisfies Meta<typeof Tabs>;
export default meta;
type Story = StoryObj<typeof meta>;

export const DetalheDoImovel: Story = {
  name: "Detalhe do imóvel",
  render: () => (
    <Tabs defaultValue="geral" className="max-w-2xl p-6">
      <TabsList aria-label="Seções do imóvel">
        <TabsTrigger value="geral">Visão geral</TabsTrigger>
        <TabsTrigger value="comodos">Cômodos</TabsTrigger>
        <TabsTrigger value="historico">Histórico</TabsTrigger>
        <TabsTrigger value="leads" count={4}>
          Leads
        </TabsTrigger>
      </TabsList>
      <TabsContent value="geral">Apartamento de 3 quartos, 112 m², Rua das Acácias, 450 — Jardim Botânico.</TabsContent>
      <TabsContent value="comodos">3 quartos (1 suíte), 2 banheiros, sala ampla, varanda gourmet, 2 vagas.</TabsContent>
      <TabsContent value="historico">Preço reduzido de R$ 980.000,00 para R$ 940.000,00 em 12/09.</TabsContent>
      <TabsContent value="leads">Mariana Souza, Rafael Tavares, Beatriz Almeida e Carlos Menezes.</TabsContent>
    </Tabs>
  ),
};

export const ComAbaDesabilitadaETextoLongo: Story = {
  name: "Aba desabilitada e rótulo longo",
  render: () => (
    <Tabs defaultValue="a" className="max-w-md p-6">
      <TabsList aria-label="Documentos">
        <TabsTrigger value="a">Documentação completa do contrato de locação</TabsTrigger>
        <TabsTrigger value="b">Vistorias</TabsTrigger>
        <TabsTrigger value="c" disabled>
          Garantias
        </TabsTrigger>
      </TabsList>
      <TabsContent value="a">Conteúdo.</TabsContent>
      <TabsContent value="b">Conteúdo.</TabsContent>
    </Tabs>
  ),
};
