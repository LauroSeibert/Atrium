import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "../ui/Button";
import { ContatoCard, ContatoCardSkeleton } from "./ContatoCard";

const meta = {
  title: "Padrões/ContatoCard",
  component: ContatoCard,
  args: {
    nome: "Helena Prado",
    papel: "Advogada",
    telefone: "11987654321",
    email: "helena@exemplo.com.br",
    observacao: "Cuida das escrituras de locação.",
    qtdImoveis: 2,
    qtdContratos: 1,
    acao: <Button variant="secondary">Editar</Button>,
  },
  decorators: [
    (Story) => (
      <div className="max-w-sm p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ContatoCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
export const Carregando: Story = { render: () => <ContatoCardSkeleton /> };
/** Contato sem telefone, e-mail, observação nem vínculos. */
export const Vazio: Story = {
  args: { telefone: undefined, email: undefined, observacao: undefined, qtdImoveis: 0, qtdContratos: 0 },
};
/** Sem erro próprio (só apresentação): mostra o cartão mínimo. */
export const Erro: Story = { args: { nome: "—", papel: "Outro", observacao: undefined } };
export const DadosExtremos: Story = {
  args: {
    nome: "Maria ".concat("Sobrenome_muito_longo_".repeat(6)),
    papel: "Despachante",
    email: "email.muito.longo.".concat("a".repeat(80), "@exemplo.com.br"),
    observacao: "Observação ".repeat(80),
    qtdImoveis: 120,
    qtdContratos: 45,
  },
};
