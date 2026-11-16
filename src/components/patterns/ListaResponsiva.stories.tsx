import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { Pagina } from "@/lib/paginacao";
import { CartaoLinha, CartaoLinhaSkeleton } from "./CartaoLinha";
import { ListaResponsiva } from "./ListaResponsiva";

type Item = { id: string; nome: string };
const pagina = (itens: Item[]): Pagina<Item> => ({
  itens,
  total: itens.length,
  pagina: 1,
  porPagina: 10,
  totalPaginas: 1,
});
const itens: Item[] = [
  { id: "1", nome: "Helena Prado" },
  { id: "2", nome: "Carlos Mendes" },
];

const meta = {
  title: "Padrões/ListaResponsiva",
  component: ListaResponsiva<Item>,
  args: {
    rotulo: "Pessoas",
    telaLarga: true,
    colunas: [{ id: "nome", cabecalho: "Nome", celula: (i: Item) => i.nome }],
    idLinha: (i: Item) => i.id,
    estado: { fase: "success", dados: pagina(itens) },
    onTentarNovamente: () => {},
    onPaginaChange: () => {},
    vazio: { titulo: "Nenhuma pessoa" },
    cartao: (i: Item) => <CartaoLinha titulo={i.nome} />,
    cartaoCarregando: <CartaoLinhaSkeleton />,
  },
  decorators: [
    (Story) => (
      <div className="max-w-3xl p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ListaResponsiva<Item>>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
export const Cartoes: Story = { args: { telaLarga: false } };
export const Carregando: Story = { args: { telaLarga: false, estado: { fase: "loading" } } };
export const Vazio: Story = { args: { estado: { fase: "success", dados: pagina([]) } } };
export const Erro: Story = { args: { estado: { fase: "error", erro: new Error("Falha") } } };
export const DadosExtremos: Story = {
  args: {
    telaLarga: false,
    estado: {
      fase: "success",
      dados: pagina(
        Array.from({ length: 10 }, (_, n) => ({ id: String(n), nome: `Nome muito longo ${n} `.repeat(8) })),
      ),
    },
  },
};
