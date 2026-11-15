import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import type { Comodo, Imovel } from "@/domain";
import type { Recurso } from "@/lib/recurso";
import { BASE_HISTORIAS, CASOS_HISTORIAS, imovelPorId } from "@/mocks/data/historias";
import { EstadoRecurso } from "./EstadoRecurso";
import { PropertyGallery, PropertyGallerySkeleton } from "./PropertyGallery";

const comMuitos = BASE_HISTORIAS.imoveis.find((i) => i.comodos.length >= 6) ?? BASE_HISTORIAS.imoveis[0]!;

const meta = {
  title: "Padrões/PropertyGallery",
  component: PropertyGallery,
  args: { comodos: comMuitos.comodos, tipo: comMuitos.tipo, titulo: comMuitos.titulo, onMudar: fn() },
  decorators: [
    (Story) => (
      <div className="max-w-2xl p-4 sm:p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PropertyGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};

export const Teclado: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole("button", { name: "Próximo slide" }));
    await userEvent.keyboard("{End}");
    await expect(c.getByText(new RegExp(`^${comMuitos.comodos.length} de `))).toBeInTheDocument();
  },
};

export const Carregando: Story = { render: () => <PropertyGallerySkeleton /> };

const terreno = imovelPorId(CASOS_HISTORIAS.imovelTerrenoSemComodos);
export const Vazio: Story = {
  name: "Vazio (terreno sem cômodos)",
  args: { comodos: terreno.comodos, tipo: terreno.tipo, fachada: terreno.fachada, titulo: terreno.titulo },
};

const erro: Recurso<Imovel> = { fase: "error", erro: new Error("Falha de rede") };
export const Erro: Story = {
  render: () => (
    <EstadoRecurso<Imovel> estado={erro} carregando={<PropertyGallerySkeleton />} onTentarNovamente={fn()}>
      {() => null}
    </EstadoRecurso>
  ),
};

const muitos: Comodo[] = Array.from({ length: 24 }, (_, i) => ({
  tipo: i % 2 ? "quarto" : "sala",
  nome: `${i % 2 ? "Quarto" : "Sala"} ${i + 1} com nome bem comprido para testar a quebra de linha`,
  area: 10 + i,
}));
export const DadosExtremos: Story = {
  name: "Dados extremos: 24 cômodos",
  args: { comodos: muitos },
};
export const UmComodo: Story = { args: { comodos: [muitos[0]!] } };
export const SemIlustracao: Story = {
  args: { comodos: [], tipo: "casa", fachada: null },
};
