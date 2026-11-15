import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import type { RegistroAlteracao } from "@/domain";
import type { Recurso } from "@/lib/recurso";
import { AGORA_HISTORIAS, BASE_HISTORIAS } from "@/mocks/data/historias";
import { ChangeLog } from "./ChangeLog";

const agora = new Date(AGORA_HISTORIAS);
const autores = Object.fromEntries(BASE_HISTORIAS.corretores.map((c) => [c.id, c.nome]));
const recentes = [...BASE_HISTORIAS.alteracoes].sort((a, b) => b.em.localeCompare(a.em)).slice(0, 10);
const sucesso = (d: readonly RegistroAlteracao[]): Recurso<readonly RegistroAlteracao[]> => ({
  fase: "success",
  dados: d,
});

const meta = {
  title: "Padrões/ChangeLog",
  component: ChangeLog,
  args: { estado: sucesso(recentes), autores, agora, onTentarNovamente: fn() },
  decorators: [
    (Story) => (
      <div className="max-w-xl p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChangeLog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
export const Carregando: Story = { args: { estado: { fase: "loading" } } };
export const Vazio: Story = { args: { estado: sucesso([]) } };
export const Erro: Story = { args: { estado: { fase: "error", erro: new Error("Falha de rede") } } };

/** Cada tipo de campo: preço, status, etapa, orçamento nulo, taxa, pagamento (parcela.N.pagoEm) e valores extremos. */
export const DadosExtremos: Story = {
  args: {
    estado: sucesso([
      {
        id: "alt_1",
        em: AGORA_HISTORIAS,
        autorId: "cor_removido",
        entidade: { tipo: "imovel", id: "imv_1" },
        campo: "preco",
        de: 0,
        para: 99_999_999_999,
      },
      {
        id: "alt_2",
        em: AGORA_HISTORIAS,
        autorId: recentes[0]!.autorId,
        entidade: { tipo: "imovel", id: "imv_1" },
        campo: "status",
        de: "disponivel",
        para: "reservado",
      },
      {
        id: "alt_3",
        em: AGORA_HISTORIAS,
        autorId: recentes[0]!.autorId,
        entidade: { tipo: "lead", id: "lead_1" },
        campo: "etapa",
        de: "visita",
        para: "perdido",
      },
      {
        id: "alt_4",
        em: AGORA_HISTORIAS,
        autorId: recentes[0]!.autorId,
        entidade: { tipo: "lead", id: "lead_1" },
        campo: "orcamento",
        de: null,
        para: 85_000_000,
      },
      {
        id: "alt_5",
        em: AGORA_HISTORIAS,
        autorId: recentes[0]!.autorId,
        entidade: { tipo: "contrato", id: "ctr_1" },
        campo: "status",
        de: "ativo",
        para: "cancelado",
      },
      {
        id: "alt_6",
        em: AGORA_HISTORIAS,
        autorId: recentes[0]!.autorId,
        entidade: { tipo: "contrato", id: "ctr_1" },
        campo: "parcela.3.pagoEm",
        de: null,
        para: "2026-11-10",
      },
      {
        id: "alt_7",
        em: AGORA_HISTORIAS,
        autorId: recentes[0]!.autorId,
        entidade: { tipo: "contrato", id: "ctr_1" },
        campo: "taxaAdministracao",
        de: 8,
        para: 10,
      },
      ...BASE_HISTORIAS.alteracoes.slice(0, 50),
    ]),
  },
};
