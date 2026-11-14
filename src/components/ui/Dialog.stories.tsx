import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./Button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./Dialog";

const meta = { title: "Átomos/Dialog", component: Dialog } satisfies Meta<typeof Dialog>;
export default meta;
type Story = StoryObj<typeof meta>;

function Exemplo({ size, longo = false }: { size: "sm" | "md" | "lg"; longo?: boolean }) {
  return (
    <Dialog defaultOpen>
      <DialogTrigger asChild>
        <Button>Agendar visita</Button>
      </DialogTrigger>
      <DialogContent size={size}>
        <DialogHeader>
          <DialogTitle>
            {longo ? "Agendar visita à Cobertura Duplex Vista Mar, Av. Atlântica, Copacabana" : "Agendar visita"}
          </DialogTitle>
          <DialogDescription>
            Lead: Marina Albuquerque. O corretor responsável será avisado por e-mail.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm">Sábado, 21 de novembro, às 10h00. Apto 52, Ed. Solar das Palmeiras, Pinheiros.</p>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Cancelar</Button>
          </DialogClose>
          <Button>Confirmar visita</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const Pequeno: Story = { render: () => <Exemplo size="sm" /> };
export const Medio: Story = { name: "Médio", render: () => <Exemplo size="md" /> };
export const Grande: Story = { render: () => <Exemplo size="lg" /> };
export const TituloLongo: Story = { name: "Título longo", render: () => <Exemplo size="md" longo /> };
