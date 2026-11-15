import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import type { Atividade } from "@/domain";
import type { Recurso } from "@/lib/recurso";
import { AGORA_HISTORIAS, BASE_HISTORIAS } from "@/mocks/data/historias";
import { ActivityFeed } from "./ActivityFeed";

const agora = new Date(AGORA_HISTORIAS);
const autores = Object.fromEntries(BASE_HISTORIAS.corretores.map((c) => [c.id, c.nome]));
const recentes = [...BASE_HISTORIAS.atividades].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)).slice(0, 12);
const sucesso = (d: readonly Atividade[]): Recurso<readonly Atividade[]> => ({ fase: "success", dados: d });

const meta = {
  title: "Padrões/ActivityFeed",
  component: ActivityFeed,
  args: {
    estado: sucesso(recentes),
    autores,
    agora,
    onTentarNovamente: fn(),
    hrefDe: (a: Atividade) =>
      `/${a.alvo.tipo === "imovel" ? "imoveis" : a.alvo.tipo === "lead" ? "leads" : "contratos"}/${a.alvo.id}`,
  },
  decorators: [
    (Story) => (
      <div className="max-w-xl p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ActivityFeed>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
export const Feed: Story = { args: { variante: "feed" } };
export const AgrupadoPorDia: Story = { args: { agruparPorDia: true } };
export const Carregando: Story = { args: { estado: { fase: "loading" } } };
export const CarregandoFeed: Story = { args: { estado: { fase: "loading" }, variante: "feed" } };
export const Vazio: Story = { args: { estado: sucesso([]) } };
export const Erro: Story = { args: { estado: { fase: "error", erro: new Error("Falha de rede") } } };

/** Um de cada tipo, texto longo, autor desconhecido e muitos itens. */
export const DadosExtremos: Story = {
  args: {
    agruparPorDia: true,
    hrefDe: undefined,
    estado: sucesso([
      {
        ...recentes[0]!,
        id: "atv_longa",
        tipo: "nota",
        dados: { texto: "Cliente pediu ".repeat(40) + "retorno_sem_espacos_".repeat(6) },
      },
      { ...recentes[1]!, id: "atv_sem_autor", autorId: "cor_removido" },
      ...BASE_HISTORIAS.atividades.slice(0, 60),
    ]),
  },
};
