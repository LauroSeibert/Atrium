import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import type { Imovel } from "@/domain";
import { BASE_HISTORIAS, CASOS_HISTORIAS, corretorPorId, imovelPorId } from "@/mocks/data/historias";
import { PropertyCard, PropertyCardSkeleton } from "./PropertyCard";
import { acoesDoImovel } from "./acoesHistorias";
import { EstadoRecurso } from "./EstadoRecurso";
import { EmptyState } from "./EmptyState";
import type { Recurso } from "@/lib/recurso";

const imovel = BASE_HISTORIAS.imoveis[0]!;
const corretor = corretorPorId(imovel.corretorId);

const meta = {
  title: "Padrões/PropertyCard",
  component: PropertyCard,
  args: {
    imovel,
    corretor,
    href: `/imoveis/${imovel.id}`,
    acoes: acoesDoImovel(imovel),
    onAlternarFavorito: fn(),
  },
  decorators: [
    (Story) => (
      <div className="max-w-sm p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PropertyCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
export const Favorito: Story = { args: { imovel: { ...imovel, favorito: true } } };
export const SemCorretor: Story = { args: { corretor: undefined } };

export const Carregando: Story = {
  render: () => <PropertyCardSkeleton />,
};

export const Vazio: Story = {
  render: () => (
    <EstadoRecurso<Imovel[]>
      estado={{ fase: "success", dados: [] }}
      carregando={<PropertyCardSkeleton />}
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
    <EstadoRecurso<Imovel[]> estado={erro} carregando={<PropertyCardSkeleton />} onTentarNovamente={fn()}>
      {() => null}
    </EstadoRecurso>
  ),
};

const longo = imovelPorId(CASOS_HISTORIAS.imovelTituloLongo);
export const TituloLongo: Story = {
  name: "Dados extremos: título longo",
  args: { imovel: longo, corretor: corretorPorId(longo.corretorId), acoes: acoesDoImovel(longo) },
};
const terreno = imovelPorId(CASOS_HISTORIAS.imovelTerrenoSemComodos);
export const Terreno: Story = {
  name: "Dados extremos: terreno",
  args: { imovel: terreno, acoes: acoesDoImovel(terreno) },
};
const semIlustracao = imovelPorId(CASOS_HISTORIAS.imoveisSemIlustracao[0]!);
export const SemIlustracao: Story = {
  name: "Dados extremos: sem ilustração",
  args: { imovel: semIlustracao, acoes: acoesDoImovel(semIlustracao) },
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
export const SemAcoes: Story = { args: { acoes: [] } };

export const GradeResponsiva: Story = {
  name: "Grade responsiva",
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="p-4 sm:p-6">
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {BASE_HISTORIAS.imoveis.slice(0, 8).map((i) => (
        <li key={i.id} className="min-w-0">
          <PropertyCard
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

export const GradeCarregando: Story = {
  name: "Grade carregando",
  parameters: { layout: "fullscreen" },
  render: () => (
    <ul className="grid grid-cols-1 gap-4 p-4 min-[1600px]:grid-cols-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
      {Array.from({ length: 4 }, (_, i) => (
        <li key={i}>
          <PropertyCardSkeleton />
        </li>
      ))}
    </ul>
  ),
};
