import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect } from "react";
import { Button } from "./Button";
import { toast, Toaster, useToastStore } from "./Toast";

const meta = { title: "Átomos/Toast", component: Toaster, parameters: { layout: "fullscreen" } } satisfies Meta<
  typeof Toaster
>;
export default meta;
type Story = StoryObj<typeof meta>;

function Aberto({ itens }: { itens: Parameters<typeof toast>[0][] }) {
  useEffect(() => {
    useToastStore.getState().clear();
    itens.forEach((i) => toast({ duration: 600000, ...i }));
    return () => useToastStore.getState().clear();
  }, [itens]);
  return <Toaster />;
}

const todos: Parameters<typeof toast>[0][] = [
  {
    tone: "success",
    title: "Lead movido para Visita",
    description: "Marina Albuquerque, Apto 52 em Pinheiros.",
    action: { label: "Desfazer", onClick: () => {} },
  },
  {
    tone: "error",
    title: "Não foi possível salvar o contrato CT-2026-0012",
    description: "Verifique a conexão e tente novamente.",
  },
  { tone: "info", title: "Relatório de inadimplência em geração" },
];

export const Tons: Story = { render: () => <Aberto itens={todos} /> };

export const ComDesfazer: Story = {
  render: () => <Aberto itens={todos.slice(0, 1)} />,
};

function Interativo() {
  return (
    <div className="flex gap-2 p-6">
      <Button
        onClick={() =>
          toast({
            tone: "success",
            title: "Lead movido para Visita",
            action: { label: "Desfazer", onClick: () => toast({ tone: "info", title: "Movimento desfeito" }) },
          })
        }
      >
        Mover lead
      </Button>
      <Button variant="secondary" onClick={() => toast({ tone: "error", title: "Falha ao enviar proposta" })}>
        Gerar erro
      </Button>
      <Toaster />
    </div>
  );
}

export const Imperativo: Story = { render: () => <Interativo /> };
