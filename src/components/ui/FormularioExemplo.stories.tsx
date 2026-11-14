"use client";

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./Button";
import { Combobox } from "./Combobox";
import { Field } from "./Field";
import { Input } from "./Input";
import { Select } from "./Select";
import { FaixaPreco } from "./Slider";
import { Switch } from "./Switch";

const bairros = ["Pinheiros", "Vila Madalena", "Moema", "Itaim Bibi", "Perdizes", "Higienópolis"].map((nome) => ({
  value: nome.toLowerCase().replace(/\s+/g, "-"),
  label: nome,
}));

function Formulario({ comErro }: { comErro: boolean }) {
  const [titulo, setTitulo] = useState(comErro ? "" : "Apartamento reformado em Pinheiros");
  const [enviado, setEnviado] = useState(comErro);
  const erroTitulo = enviado && !titulo ? "Informe um título para o anúncio" : undefined;
  return (
    <form
      className="flex max-w-md flex-col gap-4 rounded-lg border border-border bg-surface p-6"
      onSubmit={(e) => {
        e.preventDefault();
        setEnviado(true);
      }}
      noValidate
    >
      <Field label="Título do anúncio" requirement="required" error={erroTitulo}>
        <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
      </Field>
      <Field label="Tipo de imóvel" requirement="required">
        <Select
          defaultValue={comErro ? undefined : "apartamento"}
          options={[
            { value: "apartamento", label: "Apartamento" },
            { value: "casa", label: "Casa" },
            { value: "cobertura", label: "Cobertura" },
          ]}
        />
      </Field>
      <Field label="Bairro" requirement="required" error={comErro ? "Selecione o bairro" : undefined}>
        <Combobox options={bairros} placeholder="Selecione o bairro" />
      </Field>
      <Field label="Faixa de preço">
        <FaixaPreco min={200000} max={3000000} step={50000} defaultValue={[450000, 1200000]} />
      </Field>
      <Field label="Aceita financiamento" description="Mostra o selo nos portais parceiros.">
        <Switch defaultChecked />
      </Field>
      <Button type="submit">Salvar imóvel</Button>
    </form>
  );
}

const meta = { title: "Átomos/Formulário/Exemplo", component: Formulario } satisfies Meta<typeof Formulario>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Preenchido: Story = { args: { comErro: false } };
export const ComErros: Story = { name: "Com erros", args: { comErro: true } };
