import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { dadosImovelSchema, TIPOS_COMODO, type DadosImovel } from "@/domain";
import { BASE_HISTORIAS, CASOS_HISTORIAS, imovelPorId } from "@/mocks/data/historias";
import { PropertyForm, PropertyFormSkeleton } from "./PropertyForm";

const corretores = BASE_HISTORIAS.corretores.map((c) => ({ id: c.id, nome: c.nome }));
const paraDados = (id: string): DadosImovel => dadosImovelSchema.parse(imovelPorId(id));

const edicao = paraDados(BASE_HISTORIAS.imoveis[0]!.id);
const longo = paraDados(CASOS_HISTORIAS.imovelTituloLongo);
const terreno = paraDados(CASOS_HISTORIAS.imovelTerrenoSemComodos);

const meta = {
  title: "Padrões/PropertyForm",
  component: PropertyForm,
  parameters: { layout: "padded" },
  args: {
    corretores,
    onSalvar: fn(),
    onCancelar: fn(),
    envio: { fase: "idle" },
  },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-5xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PropertyForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Criação: formulário vazio. */
export const Novo: Story = {};

/** Edição com um imóvel do mock. */
export const Edicao: Story = { args: { valoresIniciais: edicao } };

/** Salvar vazio: erros inline em pt-BR, resumo no topo e foco no primeiro campo inválido. */
export const ComErros: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole("button", { name: "Salvar imóvel" }));
    await expect(c.getByRole("region", { name: /Corrija \d+ campos para salvar/ })).toBeInTheDocument();
    await expect(c.getByRole("textbox", { name: /^Título/ })).toHaveFocus();
  },
};

export const Salvando: Story = { args: { valoresIniciais: edicao, envio: { fase: "salvando" } } };

export const ErroDoServidor: Story = {
  args: {
    valoresIniciais: edicao,
    envio: { fase: "erro", mensagem: "Não foi possível salvar o imóvel. Verifique sua conexão e tente novamente." },
  },
};

export const Salvo: Story = { args: { valoresIniciais: edicao, envio: { fase: "salvo" } } };

/** Título de 140 caracteres, título longo do mock e 12 cômodos. */
export const DadosExtremos: Story = {
  args: {
    valoresIniciais: {
      ...longo,
      titulo: `${longo.titulo} — ${"vista panorâmica ".repeat(10)}`.slice(0, 140),
      comodos: Array.from({ length: 12 }, (_, i) => ({
        tipo: TIPOS_COMODO[i % TIPOS_COMODO.length]!,
        nome: `Cômodo ${i + 1} com um nome bem comprido para testar quebra de linha`,
        area: i % 3 === 0 ? null : 8 + i,
      })),
    },
  },
};

/** Título longo vindo direto do mock. */
export const TituloLongoDoMock: Story = { args: { valoresIniciais: longo } };

/** Terreno válido: sem quartos, vagas nem cômodos. */
export const Terreno: Story = { args: { valoresIniciais: terreno } };

/** Terreno com quartos: o erro mostrado é o que o schema do domínio devolve. */
export const TerrenoComQuartos: Story = {
  args: { valoresIniciais: { ...terreno, quartos: 2 } },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole("button", { name: "Salvar imóvel" }));
    await expect(c.getAllByText("Terreno não tem quartos, banheiros nem vagas").length).toBeGreaterThan(0);
  },
};

/** Carregando: esqueleto com a forma final do formulário. */
export const Carregando: Story = { render: () => <PropertyFormSkeleton /> };
