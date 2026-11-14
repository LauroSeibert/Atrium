import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Checkbox } from "./Checkbox";
import { Field } from "./Field";
import { RadioGroup, RadioGroupItem } from "./RadioGroup";
import { FaixaPreco } from "./Slider";
import { Switch } from "./Switch";

describe("Checkbox", () => {
  it("Espaço alterna e rótulo clicável funciona", async () => {
    const onCheckedChange = vi.fn();
    const user = userEvent.setup();
    render(<Checkbox label="Aceita permuta" onCheckedChange={onCheckedChange} />);
    await user.tab();
    await user.keyboard(" ");
    expect(onCheckedChange).toHaveBeenLastCalledWith(true);
    await user.click(screen.getByText("Aceita permuta"));
    expect(onCheckedChange).toHaveBeenLastCalledWith(false);
  });

  it("indeterminado expõe aria-checked=mixed; desabilitado não recebe foco", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Checkbox label="Todos" checked="indeterminate" />
        <Checkbox label="Bloqueado" disabled />
      </>,
    );
    expect(screen.getByRole("checkbox", { name: "Todos" })).toHaveAttribute("aria-checked", "mixed");
    await user.tab();
    await user.tab();
    expect(screen.getByRole("checkbox", { name: "Bloqueado" })).not.toHaveFocus();
  });

  it("indeterminado não controlado (defaultChecked) mostra aria-checked=mixed", () => {
    render(<Checkbox label="Alguns" defaultChecked="indeterminate" />);
    expect(screen.getByRole("checkbox", { name: "Alguns" })).toHaveAttribute("aria-checked", "mixed");
  });

  it("prop invalid expõe aria-invalid em Checkbox e Switch", () => {
    render(
      <>
        <Checkbox label="Termos" invalid />
        <Switch label="Portais" invalid />
      </>,
    );
    expect(screen.getByRole("checkbox", { name: "Termos" })).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("switch", { name: "Portais" })).toHaveAttribute("aria-invalid", "true");
  });

  it("dentro de Field recebe descrição e aria-invalid", () => {
    render(
      <Field label="Termos" error="Aceite os termos">
        <Checkbox />
      </Field>,
    );
    const box = screen.getByRole("checkbox", { name: "Termos" });
    expect(box).toHaveAttribute("aria-invalid", "true");
    expect(box).toHaveAccessibleDescription("Aceite os termos");
  });
});

describe("RadioGroup", () => {
  it("é um radiogroup nomeado pelo Field; setas movem o foco e Espaço seleciona", async () => {
    const user = userEvent.setup();
    render(
      <Field label="Finalidade" error="Escolha">
        <RadioGroup>
          <RadioGroupItem value="venda" label="Venda" />
          <RadioGroupItem value="locacao" label="Locação" />
        </RadioGroup>
      </Field>,
    );
    const group = screen.getByRole("radiogroup", { name: "Finalidade" });
    expect(group).toHaveAttribute("aria-invalid", "true");
    await user.tab();
    expect(screen.getByRole("radio", { name: "Venda" })).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("radio", { name: "Locação" })).toHaveFocus();
    await user.keyboard(" ");
    expect(screen.getByRole("radio", { name: "Locação" })).toBeChecked();
  });
});

describe("Switch", () => {
  it("Espaço alterna e expõe role switch", async () => {
    const user = userEvent.setup();
    render(<Switch label="Aceita financiamento" />);
    const sw = screen.getByRole("switch", { name: "Aceita financiamento" });
    await user.tab();
    await user.keyboard(" ");
    expect(sw).toBeChecked();
  });
});

describe("FaixaPreco", () => {
  it("dois thumbs com nome e valuetext em moeda; setas ajustam", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(
      <FaixaPreco min={0} max={1000000} step={50000} defaultValue={[200000, 800000]} onValueChange={onValueChange} />,
    );
    const min = screen.getByRole("slider", { name: "Preço mínimo" });
    const max = screen.getByRole("slider", { name: "Preço máximo" });
    expect(min).toHaveAttribute("aria-valuetext", expect.stringContaining("200.000"));
    expect(max).toHaveAttribute("aria-valuetext", expect.stringContaining("R$"));
    await user.tab();
    expect(min).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(onValueChange).toHaveBeenLastCalledWith([250000, 800000]);
    expect(min).toHaveAttribute("aria-valuetext", expect.stringContaining("250.000"));
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(min).toHaveAttribute("aria-valuenow", "150000");
  });
});
