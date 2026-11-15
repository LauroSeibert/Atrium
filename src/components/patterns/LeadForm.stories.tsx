import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import type { NovoLead } from "@/domain";
import { BASE_HISTORIAS } from "@/mocks/data/historias";
import { LeadForm, LeadFormSkeleton } from "./LeadForm";

const corretores = BASE_HISTORIAS.corretores.map((c) => ({ id: c.id, nome: c.nome }));

const completo: NovoLead = {
  nome: "Marina Souza Albuquerque",
  contato: { telefone: "11912345678", email: "marina.souza@example.com" },
  origem: "indicacao",
  responsavelId: corretores[0]!.id,
  orcamento: 120000000,
  interesse: {
    finalidade: "venda",
    tipos: ["apartamento", "cobertura"],
    bairros: ["Pinheiros", "Vila Madalena", "Perdizes"],
    quartosMin: 3,
  },
};

const meta = {
  title: "Padrões/LeadForm",
  component: LeadForm,
  parameters: { layout: "padded" },
  args: { corretores, onSalvar: fn(), onCancelar: fn(), envio: { fase: "idle" } },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-2xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LeadForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Criação rápida (RF-35): só o essencial; "Mais detalhes" recolhido. */
export const Rapido: Story = {};

/** Edição com todos os detalhes abertos. */
export const Completo: Story = { args: { valoresIniciais: completo } };

export const ComErros: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole("button", { name: "Salvar lead" }));
    await expect(c.getByRole("textbox", { name: /^Nome/ })).toHaveFocus();
  },
};

export const Salvando: Story = { args: { valoresIniciais: completo, envio: { fase: "salvando" } } };

export const ErroDoServidor: Story = {
  args: {
    valoresIniciais: completo,
    envio: { fase: "erro", mensagem: "Este telefone já está cadastrado em outro lead." },
  },
};

export const Salvo: Story = { args: { valoresIniciais: completo, envio: { fase: "salvo" } } };

export const NomeLongo: Story = {
  args: { valoresIniciais: { ...completo, nome: "Maria Aparecida de Albuquerque Cavalcanti Nogueira da Silva Sauro" } },
};

/** Carregando: esqueleto com a forma final do formulário. */
export const Carregando: Story = { render: () => <LeadFormSkeleton /> };
