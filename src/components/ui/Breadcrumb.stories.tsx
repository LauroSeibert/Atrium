import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./Breadcrumb";

const meta = { title: "Átomos/Breadcrumb", component: Breadcrumb } satisfies Meta<typeof Breadcrumb>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {
  name: "Padrão",
  render: () => (
    <Breadcrumb className="p-6">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/imoveis">Imóveis</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/imoveis/apartamentos">Apartamentos</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Cobertura Duplex — Rua das Acácias, 450</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
};

export const ItensLongos: Story = {
  name: "Itens longos (trunca em telas pequenas)",
  parameters: { viewport: { defaultViewport: "mobile1" } },
  render: () => (
    <Breadcrumb className="max-w-sm p-6">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/contratos">Contratos</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/contratos/locacao">
            Contratos de locação residencial com garantia de seguro fiança
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Contrato 2024/0187 — Condomínio Residencial Parque das Palmeiras</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
};
