import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { DateInput, TimeInput } from "./DateInput";
import { Field } from "./Field";

const meta = { title: "Átomos/DateInput", component: DateInput } satisfies Meta<typeof DateInput>;
export default meta;
type Story = StoryObj<typeof meta>;

function Exemplo({ inicial }: { inicial: string }) {
  const [data, setData] = useState(inicial);
  const [hora, setHora] = useState("14:30");
  return (
    <div className="grid max-w-md grid-cols-2 gap-4">
      <Field label="Data">{(c) => <DateInput {...c} value={data} onValueChange={setData} />}</Field>
      <Field label="Hora">{(c) => <TimeInput {...c} value={hora} onValueChange={setHora} />}</Field>
    </div>
  );
}

export const Vazio: Story = { args: { value: "", onValueChange: () => {} }, render: () => <Exemplo inicial="" /> };
export const Preenchido: Story = {
  args: { value: "2026-11-05", onValueChange: () => {} },
  render: () => <Exemplo inicial="2026-11-05" />,
};
