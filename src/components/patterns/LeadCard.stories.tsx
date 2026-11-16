import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { destinosNegociacao } from "@/domain";
import { AGORA_HISTORIAS, BASE_HISTORIAS, CARDS_HISTORIAS, CASOS_HISTORIAS } from "@/mocks/data/historias";
import { LeadCard, LeadCardSkeleton, type NegociacaoCard } from "./LeadCard";

const agora = new Date(AGORA_HISTORIAS);
const nomeDe = (n: NegociacaoCard) => BASE_HISTORIAS.corretores.find((c) => c.id === n.responsavelId)!.nome;
const destinos = (card: NegociacaoCard) => {
  const n = BASE_HISTORIAS.negociacoes.find((x) => x.id === card.id)!;
  return destinosNegociacao(BASE_HISTORIAS, n);
};
const argsDe = (n: NegociacaoCard) => ({ negociacao: n, responsavel: nomeDe(n), destinos: destinos(n) });

const base = CARDS_HISTORIAS.find((n) => n.etapa === "proposta") ?? CARDS_HISTORIAS[0]!;

const meta = {
  title: "Padrões/LeadCard",
  component: LeadCard,
  args: { ...argsDe(base), onAbrir: fn(), onMover: fn(), agora },
  decorators: [
    (Story) => (
      <div className="w-80 max-w-full p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LeadCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};

export const Carregando: Story = { render: () => <LeadCardSkeleton /> };

/** Card isolado não tem estado vazio nem de erro: o equivalente é a negociação sem imóvel nem valor (RF-70). */
export const SemImovelNemValor: Story = {
  args: (() => {
    const n = CARDS_HISTORIAS.find((x) => x.id === CASOS_HISTORIAS.negociacaoSemImovel)!;
    return { ...argsDe(n), negociacao: { ...n, valor: null } };
  })(),
};

export const DadosExtremos: Story = {
  args: (() => {
    const n = CARDS_HISTORIAS.find((x) => x.lead.id === CASOS_HISTORIAS.leadNomeLongo)!;
    const longo = BASE_HISTORIAS.imoveis.find((i) => i.id === CASOS_HISTORIAS.imovelTituloLongo)!;
    return {
      ...argsDe(n),
      negociacao: {
        ...n,
        valor: 99_999_999_999,
        imovel: { id: longo.id, codigo: longo.codigo, titulo: longo.titulo },
        lead: {
          ...n.lead,
          interesse: {
            ...n.lead.interesse,
            tipos: ["casa", "apartamento", "cobertura", "terreno", "comercial"] as const,
            bairros: ["Jardim Paulista", "Vila Madalena", "Pinheiros"],
          },
        },
      } as NegociacaoCard,
      responsavel: "Maria Aparecida dos Santos Albuquerque Pereira de Souza",
    };
  })(),
};

export const Perdido: Story = { args: argsDe(CARDS_HISTORIAS.find((x) => x.etapa === "perdido")!) };

export const FechadoComDestinosNegados: Story = {
  args: argsDe(CARDS_HISTORIAS.find((x) => x.etapa === "fechado" && destinos(x).some((d) => !d.permissao.ok)) ?? base),
};

export const SemMenu: Story = { args: { destinos: [] } };
