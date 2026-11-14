import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Badge } from "./Badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./Card";

const meta = {
  title: "Átomos/Card",
  component: Card,
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

const Imovel = ({ titulo = "Apartamento 3 quartos, Pinheiros" }: { titulo?: string }) => (
  <>
    <CardHeader>
      <CardTitle>{titulo}</CardTitle>
      <CardDescription>Rua dos Pinheiros, 1200 · 98 m²</CardDescription>
    </CardHeader>
    <CardContent>
      <span className="text-xl font-semibold">R$ 1.150.000</span>
    </CardContent>
    <CardFooter>
      <Badge tone="success" dot>
        Disponível
      </Badge>
    </CardFooter>
  </>
);

export const Base: Story = {
  render: () => (
    <div className="w-80 p-6">
      <Card>
        <Imovel />
      </Card>
    </div>
  ),
};

export const Interativo: Story = {
  render: () => (
    <div className="w-80 p-6">
      <Card variant="interactive" asChild>
        <a href="#imovel-123">
          <Imovel />
        </a>
      </Card>
    </div>
  ),
};

function SelecionavelDemo() {
  const [a, setA] = useState(true);
  const [b, setB] = useState(false);
  return (
    <div className="grid gap-4 p-6 sm:grid-cols-2">
      <Card variant="selectable" selected={a} onSelectedChange={setA}>
        <Imovel titulo="Casa em condomínio, Alphaville" />
      </Card>
      <Card variant="selectable" selected={b} onSelectedChange={setB}>
        <Imovel titulo="Studio, Vila Madalena" />
      </Card>
    </div>
  );
}
export const Selecionavel: Story = { render: () => <SelecionavelDemo /> };

export const TextoLongo: Story = {
  name: "Texto longo (caso extremo)",
  render: () => (
    <div className="w-72 p-6">
      <Card>
        <Imovel titulo="Cobertura duplex com terraço gourmet, piscina privativa e vista panorâmica para o Parque Ibirapuera" />
      </Card>
    </div>
  ),
};
