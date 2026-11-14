import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Field } from "./Field";
import { Select } from "./Select";

const options = [
  { value: "apartamento", label: "Apartamento" },
  { value: "casa", label: "Casa" },
  { value: "terreno", label: "Terreno", disabled: true },
];

describe("Select", () => {
  it("rótulo, erro e placeholder ligados ao trigger", () => {
    render(
      <Field label="Tipo" error="Selecione o tipo">
        <Select options={options} placeholder="Escolha" />
      </Field>,
    );
    const trigger = screen.getByRole("combobox", { name: "Tipo" });
    expect(trigger).toHaveAttribute("aria-invalid", "true");
    expect(trigger).toHaveAccessibleDescription("Selecione o tipo");
    expect(trigger).toHaveTextContent("Escolha");
  });

  it("abre com Enter, navega com setas e escolhe com Enter", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Select aria-label="Tipo" options={options} onValueChange={onValueChange} />);
    await user.tab();
    await user.keyboard("{Enter}");
    expect(await screen.findByRole("listbox")).toBeInTheDocument();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onValueChange).toHaveBeenCalledWith("casa");
  });

  it("itens desabilitados ficam marcados e Esc fecha", async () => {
    const user = userEvent.setup();
    render(<Select aria-label="Tipo" options={options} />);
    await user.click(screen.getByRole("combobox"));
    expect(await screen.findByRole("option", { name: "Terreno" })).toHaveAttribute("aria-disabled", "true");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
