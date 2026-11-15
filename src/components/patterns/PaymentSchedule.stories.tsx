import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import type { Contrato } from "@/domain";
import { diasDeAtraso, negar, podeRegistrarPagamento, resumoCronograma, statusParcela } from "@/domain";
import type { Recurso } from "@/lib/recurso";
import { BASE_HISTORIAS, CASOS_HISTORIAS, contratoPorId, HOJE_HISTORIAS } from "@/mocks/data/historias";
import { PaymentSchedule, type ItemParcela } from "./PaymentSchedule";

function itens(c: Contrato): ItemParcela[] {
  return c.parcelas.map((parcela) => ({
    parcela,
    status: statusParcela(c, parcela, HOJE_HISTORIAS),
    diasAtraso: diasDeAtraso(parcela, HOJE_HISTORIAS),
    podeRegistrar: podeRegistrarPagamento(c, parcela.numero),
  }));
}

const resumoDe = (c: Contrato) => resumoCronograma(c, HOJE_HISTORIAS);
const props = (c: Contrato) => ({ estado: sucesso(c), resumo: resumoDe(c) });
const sucesso = (c: Contrato): Recurso<ItemParcela[]> => ({ fase: "success", dados: itens(c) });
const locacao = BASE_HISTORIAS.contratos.find(
  (c) => c.status === "ativo" && c.tipo === "locacao" && c.parcelas.length >= 6,
)!;

const meta = {
  title: "Padrões/PaymentSchedule",
  component: PaymentSchedule,
  args: {
    estado: sucesso(locacao),
    resumo: resumoDe(locacao),
    onRegistrarPagamento: fn(),
    onTentarNovamente: fn(),
    acao: { fase: "idle" },
  },
  decorators: [
    (Story) => (
      <div className="max-w-4xl p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PaymentSchedule>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
export const Carregando: Story = { args: { estado: { fase: "loading" } } };
export const Vazio: Story = { args: { estado: { fase: "success", dados: [] } } };
export const Erro: Story = { args: { estado: { fase: "error", erro: new Error("Falha de rede") } } };
export const ErroComDados: Story = {
  args: { estado: { fase: "error", erro: new Error("Falha"), dados: itens(locacao) } },
};
export const Recarregando: Story = { args: { estado: { fase: "loading", dados: itens(locacao) } } };
export const TresParcelasAtrasadas: Story = {
  args: props(contratoPorId(CASOS_HISTORIAS.contratoTresParcelasAtrasadas)),
};
export const Enviando: Story = {
  args: {
    ...props(contratoPorId(CASOS_HISTORIAS.contratoTresParcelasAtrasadas)),
    acao: { fase: "enviando", numero: 1 },
  },
};
export const ErroAoRegistrar: Story = {
  args: {
    ...props(contratoPorId(CASOS_HISTORIAS.contratoTresParcelasAtrasadas)),
    acao: { fase: "erro", numero: 1, mensagem: "Não foi possível registrar o pagamento. Tente de novo." },
  },
};
export const PermissaoNegada: Story = {
  args: {
    estado: {
      fase: "success",
      dados: itens(locacao).map((i) =>
        i.status === "pago" ? i : { ...i, podeRegistrar: negar("Seu perfil não registra pagamentos.") },
      ),
    },
  },
};
export const ContratoCancelado: Story = {
  args: props({ ...locacao, status: "cancelado", motivoCancelamento: "Distrato amigável" }),
};
/** Locação de 60 parcelas. */
export const DadosExtremos: Story = {
  args: props({
    ...locacao,
    inicio: "2022-01-10",
    fim: "2026-12-10",
    parcelas: Array.from({ length: 60 }, (_, i) => ({
      numero: i + 1,
      vencimento: `${2022 + Math.floor((i + 0) / 12)}-${String((i % 12) + 1).padStart(2, "0")}-10`,
      valor: i === 59 ? 1_200_000_000 : 350_000 + i * 1_000,
      pagoEm: i < 30 ? `${2022 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}-09T12:00:00.000Z` : null,
    })),
  }),
};
export const ValorMinimo: Story = { args: props(contratoPorId(CASOS_HISTORIAS.contratoAluguelMinimo)) };
