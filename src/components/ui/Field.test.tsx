import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Field } from "./Field";
import { Input } from "./Input";
import { Textarea } from "./Textarea";

describe("Field + Input", () => {
  it("liga rótulo, descrição e erro ao controle", () => {
    render(
      <Field label="CPF" description="Somente números" error="CPF deve ter 11 dígitos">
        <Input />
      </Field>,
    );
    const input = screen.getByLabelText("CPF");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Somente números CPF deve ter 11 dígitos");
  });

  it("sem erro não marca aria-invalid", () => {
    render(
      <Field label="Título">
        <Input />
      </Field>,
    );
    expect(screen.getByLabelText("Título")).not.toHaveAttribute("aria-invalid");
  });

  it("render prop entrega id e aria-describedby", () => {
    render(
      <Field label="Obs" description="Ajuda">
        {(c) => <input {...c} />}
      </Field>,
    );
    expect(screen.getByLabelText("Obs")).toHaveAccessibleDescription("Ajuda");
  });

  it("Input recebe foco por Tab, aceita digitação e desabilitado é pulado", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Input aria-label="A" disabled />
        <Input aria-label="B" prefix="R$" suffix="m²" />
      </>,
    );
    await user.tab();
    expect(screen.getByLabelText("B")).toHaveFocus();
    await user.keyboard("120");
    expect(screen.getByLabelText("B")).toHaveValue("120");
    expect(screen.getByText("R$")).toBeInTheDocument();
  });

  it("Textarea mostra contador e o liga à descrição", async () => {
    const user = userEvent.setup();
    render(
      <Field label="Descrição">
        <Textarea maxLength={50} showCounter />
      </Field>,
    );
    const area = screen.getByLabelText("Descrição");
    expect(area).toHaveAttribute("rows", "3");
    await user.type(area, "abc");
    expect(screen.getByText("3/50")).toBeInTheDocument();
    expect(area).toHaveAccessibleDescription("3/50");
  });
});
