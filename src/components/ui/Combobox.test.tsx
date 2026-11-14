import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Combobox } from "./Combobox";
import { Field } from "./Field";

const options = [
  { value: "moema", label: "Moema" },
  { value: "pinheiros", label: "Pinheiros" },
  { value: "perdizes", label: "Perdizes", disabled: true },
];

describe("Combobox", () => {
  it("nome acessível, aria-invalid e descrição vêm do Field", () => {
    render(
      <Field label="Bairro" error="Selecione o bairro">
        <Combobox options={options} />
      </Field>,
    );
    const trigger = screen.getByRole("combobox", { name: "Bairro" });
    expect(trigger).toHaveAttribute("aria-invalid", "true");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAccessibleDescription("Selecione o bairro");
  });

  it("abre com Enter, filtra, navega com setas e escolhe com Enter", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Combobox aria-label="Bairro" options={options} onValueChange={onValueChange} />);
    await user.tab();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("combobox", { name: "Bairro" })).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("p");
    expect(screen.queryByRole("option", { name: "Moema" })).not.toBeInTheDocument();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onValueChange).toHaveBeenCalledWith("pinheiros");
    expect(screen.getByRole("combobox", { name: "Bairro" })).toHaveTextContent("Pinheiros");
  });

  it("mostra estado vazio e Esc fecha", async () => {
    const user = userEvent.setup();
    render(<Combobox aria-label="Bairro" options={options} />);
    await user.click(screen.getByRole("combobox"));
    await user.keyboard("zzz");
    expect(screen.getByText("Nenhum resultado encontrado")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByText("Nenhum resultado encontrado")).not.toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveFocus();
  });

  it("busca ignora acentos", async () => {
    const user = userEvent.setup();
    render(<Combobox aria-label="Bairro" options={[{ value: "h", label: "Higienópolis" }]} />);
    await user.click(screen.getByRole("combobox"));
    await user.keyboard("higieno");
    expect(screen.getByRole("option", { name: "Higienópolis" })).toBeInTheDocument();
  });
});
