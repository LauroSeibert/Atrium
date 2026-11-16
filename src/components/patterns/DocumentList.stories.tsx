import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { DocumentList, type ItemDocumento } from "./DocumentList";

const docs: ItemDocumento[] = [
  {
    id: "doc_1",
    nome: "Contrato assinado.pdf",
    tipo: "contratoAssinado",
    tamanho: 2_516_582,
    enviadoPor: "Mariana Alves",
    enviadoEm: "2026-11-14T12:00:00.000Z",
  },
  {
    id: "doc_2",
    nome: "RG frente e verso.jpg",
    tipo: "documentoPessoal",
    tamanho: 480_000,
    enviadoPor: "Rafael Souza",
    enviadoEm: "2026-11-10T09:30:00.000Z",
  },
];

const meta = {
  title: "Padrões/DocumentList",
  component: DocumentList,
  args: { estado: { fase: "success", dados: docs }, onBaixar: fn(), onRemover: fn(), onTentarNovamente: fn() },
  decorators: [
    (Story) => (
      <div className="max-w-3xl p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DocumentList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
export const Carregando: Story = { args: { estado: { fase: "loading" } } };
export const Vazio: Story = { args: { estado: { fase: "success", dados: [] } } };
export const Erro: Story = { args: { estado: { fase: "error", erro: new Error("Falha de rede") } } };
export const DadosExtremos: Story = {
  args: {
    baixandoId: "doc_ext_0",
    estado: {
      fase: "success",
      dados: Array.from({ length: 30 }, (_, i) => ({
        id: `doc_ext_${i}`,
        nome: `${"Certidão de inteiro teor da matrícula do imóvel com nome muito longo ".repeat(3)}${i}.pdf`,
        tipo: "certidao" as const,
        tamanho: i === 0 ? 10 * 1024 * 1024 : 1 + i * 333,
        enviadoPor: "Maria Fernanda de Albuquerque Cavalcanti Nogueira",
        enviadoEm: "2026-11-14T12:00:00.000Z",
      })),
    },
  },
};
