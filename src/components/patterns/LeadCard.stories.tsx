import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { ETAPAS, podeTransicionarLead, type Lead } from "@/domain";
import { AGORA_HISTORIAS, BASE_HISTORIAS, CASOS_HISTORIAS } from "@/mocks/data/historias";
import { LeadCard, LeadCardSkeleton } from "./LeadCard";

const agora = new Date(AGORA_HISTORIAS);
const lead = (id: string) => BASE_HISTORIAS.leads.find((l) => l.id === id)!;
const nomeDe = (l: Lead) => BASE_HISTORIAS.corretores.find((c) => c.id === l.responsavelId)!.nome;
const destinos = (l: Lead) =>
  ETAPAS.filter((e) => e !== l.etapa).map((etapa) => ({
    etapa,
    permissao: podeTransicionarLead(BASE_HISTORIAS, l, etapa),
  }));

const base = BASE_HISTORIAS.leads.find((l) => l.etapa === "proposta") ?? BASE_HISTORIAS.leads[0]!;

const meta = {
  title: "Padrões/LeadCard",
  component: LeadCard,
  args: {
    lead: base,
    responsavel: nomeDe(base),
    destinos: destinos(base),
    onAbrir: fn(),
    onMover: fn(),
    agora,
  },
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

/** Card isolado não tem estado vazio nem de erro: o equivalente é o lead sem dados opcionais. */
export const SemOrcamentoNemContato: Story = {
  args: (() => {
    const l = lead(CASOS_HISTORIAS.leadSemContato);
    return { lead: { ...l, orcamento: null }, responsavel: nomeDe(l), destinos: destinos(l) };
  })(),
};

export const DadosExtremos: Story = {
  args: (() => {
    const l = lead(CASOS_HISTORIAS.leadNomeLongo);
    return {
      lead: {
        ...l,
        orcamento: 99_999_999_999,
        interesse: {
          ...l.interesse,
          tipos: ["casa", "apartamento", "cobertura", "terreno", "comercial"] as const,
          bairros: ["Jardim Paulista", "Vila Madalena", "Pinheiros"],
        },
      } as Lead,
      responsavel: "Maria Aparecida dos Santos Albuquerque Pereira de Souza",
      destinos: destinos(l),
    };
  })(),
};

export const Perdido: Story = {
  args: (() => {
    const l = BASE_HISTORIAS.leads.find((x) => x.etapa === "perdido")!;
    return { lead: l, responsavel: nomeDe(l), destinos: destinos(l) };
  })(),
};

export const FechadoComDestinosNegados: Story = {
  args: (() => {
    const l =
      BASE_HISTORIAS.leads.find((x) => x.etapa === "fechado" && destinos(x).some((d) => !d.permissao.ok)) ?? base;
    return { lead: l, responsavel: nomeDe(l), destinos: destinos(l) };
  })(),
};

export const SemMenu: Story = { args: { destinos: [] } };
