"use client";
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LayoutGrid, List } from "lucide-react";
import { SegmentedControl } from "./SegmentedControl";

const meta = {
  title: "Átomos/SegmentedControl",
  component: SegmentedControl,
  args: {
    value: "grade",
    onValueChange: () => {},
    "aria-label": "Visualização",
    options: [{ value: "grade", label: "Grade" }],
  },
} satisfies Meta<typeof SegmentedControl>;
export default meta;
type Story = StoryObj<typeof meta>;

function Demo({ size, iconsOnly }: { size?: "sm" | "md"; iconsOnly?: boolean }) {
  const [value, setValue] = useState("grade");
  return (
    <SegmentedControl
      aria-label="Modo de visualização dos imóveis"
      size={size}
      value={value}
      onValueChange={setValue}
      options={[
        { value: "grade", label: "Grade", icon: LayoutGrid, hideLabel: iconsOnly },
        { value: "lista", label: "Lista", icon: List, hideLabel: iconsOnly },
      ]}
    />
  );
}

export const GradeLista: Story = {
  name: "Grade | Lista",
  render: () => (
    <div className="p-6">
      <Demo />
    </div>
  ),
};
export const Pequeno: Story = {
  render: () => (
    <div className="p-6">
      <Demo size="sm" />
    </div>
  ),
};
export const SomenteIcones: Story = {
  name: "Somente ícones (rótulo sr-only)",
  render: () => (
    <div className="p-6">
      <Demo iconsOnly />
    </div>
  ),
};

export const TextoELongoDesabilitado: Story = {
  name: "Texto longo e opção desabilitada",
  render: () => (
    <div className="p-6">
      <SegmentedControl
        aria-label="Status do contrato"
        value="ativos"
        onValueChange={() => {}}
        options={[
          { value: "ativos", label: "Contratos ativos" },
          { value: "encerrados", label: "Encerrados nos últimos doze meses" },
          { value: "rascunho", label: "Rascunhos", disabled: true },
        ]}
      />
    </div>
  ),
};
