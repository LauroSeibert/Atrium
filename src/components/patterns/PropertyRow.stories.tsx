import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { BASE_HISTORIAS, CASOS_HISTORIAS, corretorPorId, imovelPorId } from "@/mocks/data/historias";
import type { Imovel } from "@/domain";
import type { Recurso } from "@/lib/recurso";
import { EmptyState } from "./EmptyState";
import { EstadoRecurso } from "./EstadoRecurso";
import { acoesDoImovel } from "./acoesHistorias";
import { PropertyRow, PropertyRowSkeleton } from "./PropertyRow";

const imovel = BASE_HISTORIAS.imoveis[0]!;

const meta = {
  title: "Padrões/PropertyRow",
  component: PropertyRow,
  args: {
    imovel,
    corretor: corretorPorId(imovel.corretorId),
    href: `/imoveis/${imovel.id}`,
    acoes: acoesDoImovel(imovel),
    onAlternarFavorito: fn(),
  },
  decorators: [
    (Story) => (
      <div className="max-w-4xl p-4 sm:p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PropertyRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
export const Favorito: Story = { args: { imovel: { ...imovel, favorito: true } } };
export const Carregando: Story = { render: () => <PropertyRowSkeleton /> };

export const Vazio: Story = {
  render: () => (
    <EstadoRecurso<Imovel[]>
      estado={{ fase: "success", dados: [] }}
      carregando={<PropertyRowSkeleton />}
      estaVazio={(d) => d.length === 0}
      vazio={<EmptyState titulo="Nenhum imóvel encontrado" descricao="Ajuste os filtros para ver mais imóveis." />}
    >
      {() => null}
    </EstadoRecurso>
  ),
};

const erro: Recurso<Imovel[]> = { fase: "error", erro: new Error("Falha de rede") };
export const Erro: Story = {
  render: () => (
    <EstadoRecurso<Imovel[]> estado={erro} carregando={<PropertyRowSkeleton />} onTentarNovamente={fn()}>
      {() => null}
    </EstadoRecurso>
  ),
};

const longo = imovelPorId(CASOS_HISTORIAS.imovelTituloLongo);
export const DadosExtremos: Story = {
  name: "Dados extremos: título longo",
  args: { imovel: longo, corretor: corretorPorId(longo.corretorId), acoes: acoesDoImovel(longo) },
};
const maximo = imovelPorId(CASOS_HISTORIAS.imovelVendaMaxima);
export const VendaMaxima: Story = {
  name: "Dados extremos: venda máxima",
  args: { imovel: maximo, acoes: acoesDoImovel(maximo) },
};
const minimo = imovelPorId(CASOS_HISTORIAS.imovelAluguelMinimo);
export const AluguelMinimo: Story = {
  name: "Dados extremos: aluguel mínimo",
  args: { imovel: minimo, acoes: acoesDoImovel(minimo) },
};
const terreno = imovelPorId(CASOS_HISTORIAS.imovelTerrenoSemComodos);
export const Terreno: Story = { args: { imovel: terreno, acoes: acoesDoImovel(terreno) } };

export const Lista: Story = {
  render: (args) => (
    <ul className="flex flex-col gap-3">
      {BASE_HISTORIAS.imoveis.slice(0, 6).map((i) => (
        <li key={i.id}>
          <PropertyRow
            {...args}
            imovel={i}
            corretor={corretorPorId(i.corretorId)}
            href={`/imoveis/${i.id}`}
            acoes={acoesDoImovel(i)}
          />
        </li>
      ))}
    </ul>
  ),
};
