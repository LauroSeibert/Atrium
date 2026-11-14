"use client";

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Checkbox } from "./Checkbox";
import { Field } from "./Field";

const meta = { title: "Átomos/Checkbox", component: Checkbox, args: { label: "Aceita permuta" } } satisfies Meta<
  typeof Checkbox
>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = { name: "Padrão" };
export const Marcado: Story = { args: { defaultChecked: true } };
export const Desabilitado: Story = { args: { disabled: true, defaultChecked: true } };
export const ComErro: Story = {
  name: "Com erro",
  render: () => (
    <div className="p-6">
      <Field label="Termos" error="É preciso aceitar os termos de exclusividade">
        <Checkbox label="Li e aceito o contrato de exclusividade" />
      </Field>
    </div>
  ),
};
export const Indeterminado: Story = {
  render: function Render() {
    const [itens, setItens] = useState([true, false, false]);
    const todos = itens.every(Boolean) ? true : itens.some(Boolean) ? "indeterminate" : false;
    const nomes = ["Casa em Alphaville", "Apto em Moema", "Sala no Itaim"];
    return (
      <div className="flex flex-col gap-2 p-6">
        <Checkbox
          label="Selecionar todos os imóveis"
          checked={todos}
          onCheckedChange={(c) => setItens(itens.map(() => c === true))}
        />
        <div className="flex flex-col gap-2 pl-7">
          {nomes.map((n, i) => (
            <Checkbox
              key={n}
              label={n}
              checked={itens[i]}
              onCheckedChange={(c) => setItens(itens.map((v, j) => (j === i ? c === true : v)))}
            />
          ))}
        </div>
      </div>
    );
  },
};
export const TextoLongo: Story = {
  name: "Texto longo",
  decorators: [
    (S) => (
      <div className="max-w-xs p-6">
        <S />
      </div>
    ),
  ],
  args: {
    label:
      "Autorizo a divulgação do endereço completo do imóvel, incluindo número e complemento, nos portais parceiros",
  },
};
