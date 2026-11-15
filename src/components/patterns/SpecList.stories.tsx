import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { Imovel } from "@/domain";
import type { Recurso } from "@/lib/recurso";
import { fn } from "storybook/test";
import { BASE_HISTORIAS, CASOS_HISTORIAS, imovelPorId } from "@/mocks/data/historias";
import { EstadoRecurso } from "./EstadoRecurso";
import { SpecList, SpecListSkeleton } from "./SpecList";

const imovel = BASE_HISTORIAS.imoveis.find((i) => i.tipo === "apartamento" && i.condominio !== null)!;

const meta = {
  title: "Padrões/SpecList",
  component: SpecList,
  args: { imovel },
  decorators: [
    (Story) => (
      <div className="max-w-xl p-4 sm:p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SpecList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
export const Carregando: Story = { render: () => <SpecListSkeleton /> };
export const Vazio: Story = {
  name: "Vazio (terreno: campos sem valor)",
  args: { imovel: imovelPorId(CASOS_HISTORIAS.imovelTerrenoSemComodos) },
};
const erro: Recurso<Imovel> = { fase: "error", erro: new Error("Falha de rede") };
export const Erro: Story = {
  render: () => (
    <EstadoRecurso<Imovel> estado={erro} carregando={<SpecListSkeleton />} onTentarNovamente={fn()}>
      {() => null}
    </EstadoRecurso>
  ),
};
export const DadosExtremos: Story = {
  name: "Dados extremos: valores máximos",
  args: {
    imovel: {
      ...imovelPorId(CASOS_HISTORIAS.imovelVendaMaxima),
      condominio: 99_999_999,
      iptu: 12_000_000,
      areaUtil: 12_345.5,
      areaTotal: 99_999,
      quartos: 20,
      suites: 20,
      banheiros: 30,
      vagas: 40,
    },
  },
};
export const SemCondominioEIptu: Story = { args: { imovel: { ...imovel, condominio: null, iptu: null } } };
export const Zeros: Story = { args: { imovel: { ...imovel, quartos: 0, suites: 0, banheiros: 0, vagas: 0 } } };
