import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { House, Search } from "lucide-react";
import { Button } from "./Button";
import { Empty } from "./Empty";

const meta = { title: "Átomos/Empty", component: Empty } satisfies Meta<typeof Empty>;
export default meta;
type Story = StoryObj<typeof meta>;

export const SemImoveis: Story = {
  name: "Sem imóveis",
  args: {
    icon: House,
    title: "Nenhum imóvel cadastrado",
    description: "Cadastre o primeiro imóvel para começar a receber leads.",
    action: <Button>Novo imóvel</Button>,
  },
};

export const SemResultados: Story = {
  name: "Busca sem resultados",
  args: {
    icon: Search,
    title: "Nenhum resultado para os filtros",
    description: "Tente remover algum filtro ou buscar por outro bairro.",
    action: <Button variant="secondary">Limpar filtros</Button>,
  },
};

export const Minimo: Story = { name: "Só título", args: { title: "Sem atividades recentes" } };

export const TextoLongo: Story = {
  name: "Texto longo (caso extremo)",
  args: {
    icon: House,
    title:
      "Nenhum imóvel encontrado em Jardim Paulista, Cerqueira César, Consolação e Bela Vista com os filtros atuais",
    description:
      "Os filtros combinados de tipo, faixa de preço, número de quartos, vagas e status excluem todos os imóveis cadastrados. Ajuste os critérios ou cadastre um novo imóvel.",
    action: <Button>Novo imóvel</Button>,
  },
};
