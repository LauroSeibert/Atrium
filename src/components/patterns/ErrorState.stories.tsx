import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { Button } from "../ui/Button";
import { ErrorState } from "./ErrorState";

const meta = {
  title: "Padrões/ErrorState",
  component: ErrorState,
  args: { onTentarNovamente: fn() },
} satisfies Meta<typeof ErrorState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
export const Compacto: Story = { args: { tamanho: "compacto" } };
export const SemTentarNovamente: Story = { args: { onTentarNovamente: undefined } };
export const ComAcaoExtra: Story = { args: { acao: <Button variant="ghost">Voltar para a lista</Button> } };
export const SoAcaoExtra: Story = {
  args: { onTentarNovamente: undefined, acao: <Button variant="secondary">Voltar</Button> },
};
export const TextoPersonalizado: Story = {
  args: {
    titulo: "Não foi possível carregar os contratos",
    descricao: "O servidor demorou para responder. Tente de novo em instantes.",
  },
};
export const TituloLongo: Story = {
  args: {
    titulo:
      "Não foi possível carregar o cronograma de parcelas do contrato de locação da Cobertura Duplex com vista panorâmica",
    descricao:
      "A conexão foi interrompida enquanto buscávamos os dados. Verifique a internet, aguarde alguns instantes e tente de novo; se persistir, recarregue a página ou fale com o suporte.",
  },
};
