import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./Button";
import { Field } from "./Field";
import { Select } from "./Select";
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./Drawer";

const meta = { title: "Átomos/Drawer", component: Drawer } satisfies Meta<typeof Drawer>;
export default meta;
type Story = StoryObj<typeof meta>;

function Exemplo({ size }: { size: "md" | "lg" }) {
  return (
    <Drawer defaultOpen>
      <DrawerTrigger asChild>
        <Button>Ver lead</Button>
      </DrawerTrigger>
      <DrawerContent size={size}>
        <DrawerHeader>
          <DrawerTitle>Marina Albuquerque</DrawerTitle>
          <DrawerDescription>Etapa: Visita agendada · Origem: Portal de anúncios</DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="flex flex-col gap-4 text-sm">
          <p>Procura apartamento de 2 quartos em Pinheiros, até R$ 850.000, com 1 vaga.</p>
          <p className="text-text-muted">
            Visita marcada para sábado, 21 de novembro, às 10h00, no Apto 52 do Ed. Solar das Palmeiras.
          </p>
        </DrawerBody>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="secondary">Fechar painel</Button>
          </DrawerClose>
          <Button>Registrar contato</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export const Medio: Story = { name: "Médio", render: () => <Exemplo size="md" /> };
export const Grande: Story = { render: () => <Exemplo size="lg" /> };

export const SelectDentroDoDrawer: Story = {
  name: "Select dentro do Drawer",
  render: () => (
    <Drawer defaultOpen>
      <DrawerTrigger asChild>
        <Button>Editar imóvel</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Editar imóvel</DrawerTitle>
          <DrawerDescription>A lista de opções deve aparecer acima do painel.</DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <Field label="Tipo de imóvel">
            <Select
              placeholder="Selecione o tipo"
              options={[
                { value: "apartamento", label: "Apartamento" },
                { value: "casa", label: "Casa" },
                { value: "cobertura", label: "Cobertura" },
              ]}
            />
          </Field>
        </DrawerBody>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="secondary">Cancelar</Button>
          </DrawerClose>
          <Button>Salvar</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};

export const TextoLongo: Story = {
  name: "Texto longo",
  render: () => (
    <Drawer defaultOpen>
      <DrawerTrigger asChild>
        <Button>Ver histórico</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Histórico do lead Marina Albuquerque de Souza Pereira Nogueira</DrawerTitle>
          <DrawerDescription>
            Cobertura Duplex Vista Mar, Av. Atlântica 3000, Copacabana, Rio de Janeiro
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="flex flex-col gap-4 text-sm">
          {Array.from({ length: 12 }, (_, i) => (
            <p key={i}>
              Contato {i + 1}: a cliente pediu mais fotos da varanda, informações sobre o condomínio (piscina aquecida,
              salão de festas, 2 vagas) e a possibilidade de visita no fim de semana, com acompanhamento do corretor.
            </p>
          ))}
        </DrawerBody>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="secondary">Fechar painel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};
