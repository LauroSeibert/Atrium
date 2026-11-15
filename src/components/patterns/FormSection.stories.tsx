import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";
import {
  AlertaServidor,
  CampoMoeda,
  CampoNumero,
  FormSection,
  FormSectionIndex,
  LARGURA_TOTAL,
  ResumoErros,
} from "./FormSection";

const meta = {
  title: "Padrões/FormSection",
  component: FormSection,
  parameters: { layout: "padded" },
  args: { id: "basico", titulo: "Básico", children: null },
} satisfies Meta<typeof FormSection>;

export default meta;
type Story = StoryObj<typeof meta>;

const SECOES = [
  { id: "basico", titulo: "Básico" },
  { id: "valores", titulo: "Valores" },
];

function Valores() {
  const [preco, setPreco] = useState<number | null | undefined>(125050);
  const [area, setArea] = useState<number | null | undefined>(1000);
  return (
    <FormSection id="valores" titulo="Valores" descricao="Informe em reais; o sistema guarda em centavos.">
      <Field label="Preço" id="preco" description={`Centavos: ${preco ?? "vazio"}`}>
        <CampoMoeda value={preco} onChange={setPreco} />
      </Field>
      <Field label="Área útil" id="area" description={`Valor: ${area ?? "vazio"}`}>
        <CampoNumero value={area} onChange={setArea} suffix="m²" />
      </Field>
    </FormSection>
  );
}

/** Seções com índice de âncoras. */
export const ComIndice: Story = {
  render: () => (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <FormSectionIndex secoes={SECOES} className="lg:w-56 lg:shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <FormSection id="basico" titulo="Básico" descricao="Como o imóvel aparece nos anúncios.">
          <Field label="Título" id="titulo" className={LARGURA_TOTAL}>
            <Input />
          </Field>
        </FormSection>
        <Valores />
      </div>
    </div>
  ),
};

/** Moeda e número em pt-BR: aceita "R$ 1.250,50" colado e "1.000" como mil. */
export const CamposNumericos: Story = { render: () => <Valores /> };

export const ResumoDeErros: Story = {
  render: () => (
    <ResumoErros
      erros={[
        { id: "titulo", rotulo: "Título", mensagem: "Informe o título" },
        { id: "preco", rotulo: "Preço", mensagem: "Informe um valor maior que zero" },
      ]}
    />
  ),
};

export const ErroDoServidor: Story = {
  render: () => <AlertaServidor envio={{ fase: "erro", mensagem: "Não foi possível salvar. Tente de novo." }} />,
};

/** Sem erros o resumo não renderiza nada. */
export const SemErros: Story = { render: () => <ResumoErros erros={[]} /> };
