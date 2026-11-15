import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { MOTIVOS_PERDA } from "@/domain";
import { CASOS_HISTORIAS, contratoPorId, imovelPorId } from "@/mocks/data/historias";
import { ConfirmDestructive } from "./ConfirmDestructive";
import { MOTIVO_PERDA_ROTULO } from "./rotulos";

const contrato = contratoPorId(CASOS_HISTORIAS.contratoTresParcelasAtrasadas);
const imovel = imovelPorId(contrato.imovelId);
const abertas = contrato.parcelas.filter((p) => !p.pagoEm).length;

const meta = {
  title: "Padrões/ConfirmDestructive",
  component: ConfirmDestructive,
  args: {
    aberto: true,
    onAbertoChange: fn(),
    onConfirmar: fn(),
    fase: { fase: "idle" },
    titulo: `Cancelar o contrato ${contrato.numero}?`,
    descricao: "O cancelamento não pode ser desfeito depois do prazo para desfazer.",
    impactos: [
      `O imóvel ${imovel.codigo} volta a disponível`,
      `${abertas} parcelas em aberto passam a canceladas`,
      "As comissões ainda não pagas continuam registradas",
    ],
    motivo: { tipo: "texto", rotulo: "Motivo do cancelamento", obrigatorio: true, maxLength: 200 },
    rotuloConfirmar: "Cancelar contrato",
  },
} satisfies Meta<typeof ConfirmDestructive>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CancelarContrato: Story = {};
export const InativarImovel: Story = {
  args: {
    titulo: `Inativar o imóvel ${imovel.codigo}?`,
    descricao: undefined,
    impactos: ["O imóvel sai da vitrine e das buscas", "Visitas agendadas continuam, mas não aceitam novas"],
    motivo: { tipo: "texto", rotulo: "Motivo (opcional)", obrigatorio: false },
    rotuloConfirmar: "Inativar imóvel",
  },
};
export const LeadPerdido: Story = {
  args: {
    titulo: "Marcar Marina Albuquerque como perdido?",
    descricao: undefined,
    impactos: ["O lead sai do funil ativo", "O motivo fica registrado no histórico"],
    motivo: {
      tipo: "select",
      rotulo: "Motivo da perda",
      obrigatorio: true,
      mensagemObrigatorio: "Escolha o motivo da perda.",
      opcoes: MOTIVOS_PERDA.map((m) => ({ value: m, label: MOTIVO_PERDA_ROTULO[m] })),
    },
    rotuloConfirmar: "Marcar como perdido",
  },
};
export const Processando: Story = { args: { fase: { fase: "confirmando" } } };
export const ErroAoConfirmar: Story = {
  args: { fase: { fase: "erro", mensagem: "Não foi possível cancelar o contrato. Tente de novo." } },
};
/** Sem campo de motivo e sem lista longa: o equivalente a "vazio" deste diálogo. */
export const SemMotivo: Story = {
  args: { motivo: undefined, descricao: undefined, impactos: ["O item é removido da lista."] },
};
export const TextoLongo: Story = {
  args: {
    titulo:
      "Cancelar o contrato CT-2026-0012 de Locação da Cobertura Duplex com vista panorâmica para o mar, piscina privativa e quatro vagas de garagem?",
    descricao:
      "Esta ação afeta o imóvel, as parcelas, as comissões e o histórico do contrato. Leia com atenção o que acontece antes de confirmar, porque algumas consequências não podem ser revertidas.",
    impactos: Array.from(
      { length: 8 },
      (_, i) =>
        `Consequência número ${i + 1}: parcelas, comissões, repasses ao proprietário e avisos aos envolvidos serão ajustados`,
    ),
  },
};
