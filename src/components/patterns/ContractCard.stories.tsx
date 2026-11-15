import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { Contrato } from "@/domain";
import { proximoVencimento, statusExibicao } from "@/domain";
import { BASE_HISTORIAS, CASOS_HISTORIAS, contratoPorId, HOJE_HISTORIAS, imovelPorId } from "@/mocks/data/historias";
import { Button } from "../ui/Button";
import { ContractCard, ContractCardSkeleton, type ContractCardProps } from "./ContractCard";

function propsDoContrato(c: Contrato): ContractCardProps {
  const imovel = imovelPorId(c.imovelId);
  return {
    numero: c.numero,
    tipo: c.tipo,
    imovel: { titulo: imovel.titulo, codigo: imovel.codigo },
    partes: c.partes,
    valor: c.valor,
    inicio: c.inicio,
    fim: c.fim,
    statusExibicao: statusExibicao(c, HOJE_HISTORIAS),
    proximoVencimento: proximoVencimento(c),
  };
}

const ativo = BASE_HISTORIAS.contratos.find(
  (c) => c.status === "ativo" && c.tipo === "locacao" && c.parcelas.some((p) => !p.pagoEm),
)!;
const encerrado = BASE_HISTORIAS.contratos.find((c) => c.status === "encerrado")!;
const cancelado = BASE_HISTORIAS.contratos.find((c) => c.status === "cancelado")!;

const meta = {
  title: "Padrões/ContractCard",
  component: ContractCard,
  args: { ...propsDoContrato(ativo), acao: <Button variant="secondary">Abrir contrato</Button> },
  decorators: [
    (Story) => (
      <div className="max-w-md p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ContractCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
export const Carregando: Story = { render: () => <ContractCardSkeleton /> };
/** Sem próximo vencimento (contrato encerrado): o equivalente a "vazio" de um card de item único. */
export const Vazio: Story = { args: propsDoContrato(encerrado) };
/** Card de item único não tem estado de erro próprio: o erro é da tela (ErrorState). Aqui, contrato cancelado. */
export const Erro: Story = { name: "Erro (cancelado)", args: propsDoContrato(cancelado) };
export const Inadimplente: Story = {
  args: propsDoContrato(contratoPorId(CASOS_HISTORIAS.contratoTresParcelasAtrasadas)),
};
export const LocacaoVencida: Story = { args: propsDoContrato(contratoPorId(CASOS_HISTORIAS.contratoLocacaoVencido)) };
export const DadosExtremos: Story = {
  args: {
    ...propsDoContrato(contratoPorId(CASOS_HISTORIAS.contratoVendaMaxima)),
    partes: [
      {
        papel: "comprador",
        nome: "Maria Fernanda de Albuquerque Cavalcanti Nascimento Souza",
        documento: "12345678901",
      },
      {
        papel: "vendedor",
        nome: "Empreendimentos Imobiliários Horizonte Azul Participações S.A.",
        documento: "12345678000199",
      },
    ],
    imovel: {
      titulo: "Cobertura Duplex com vista panorâmica para o mar, piscina privativa e quatro vagas de garagem",
      codigo: "AT-9999",
    },
  },
};
export const ValorMinimo: Story = { args: propsDoContrato(contratoPorId(CASOS_HISTORIAS.contratoAluguelMinimo)) };
