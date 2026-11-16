import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { dataBrParaIso, DateInput, isoParaDataBr, TimeInput } from "./DateInput";
import { Field } from "./Field";

describe("DateInput / TimeInput (formato brasileiro)", () => {
  it("converte dd/mm/aaaa ↔ ISO e rejeita datas inexistentes", () => {
    expect(dataBrParaIso("05/11/2026")).toBe("2026-11-05");
    expect(dataBrParaIso("31/02/2026")).toBeNull();
    expect(dataBrParaIso("05/11/26")).toBeNull();
    expect(isoParaDataBr("2026-11-05")).toBe("05/11/2026");
  });

  it("mascara a digitação e só emite a data completa em ISO", async () => {
    const onValueChange = vi.fn();
    render(<Field label="Data">{(c) => <DateInput {...c} value="" onValueChange={onValueChange} />}</Field>);
    const campo = screen.getByLabelText("Data");
    await userEvent.type(campo, "0511202");
    expect(campo).toHaveValue("05/11/202");
    expect(onValueChange).not.toHaveBeenCalled();
    await userEvent.type(campo, "6");
    expect(onValueChange).toHaveBeenLastCalledWith("2026-11-05");
  });

  it("mostra o valor recebido em dd/mm/aaaa", () => {
    render(<Field label="Data">{(c) => <DateInput {...c} value="2026-01-31" onValueChange={vi.fn()} />}</Field>);
    expect(screen.getByLabelText("Data")).toHaveValue("31/01/2026");
  });

  it("hora em 24 h", async () => {
    const onValueChange = vi.fn();
    render(<Field label="Hora">{(c) => <TimeInput {...c} value="" onValueChange={onValueChange} />}</Field>);
    await userEvent.type(screen.getByLabelText("Hora"), "1430");
    expect(onValueChange).toHaveBeenLastCalledWith("14:30");
  });
});

describe("Calendário do DateInput", () => {
  it("abre no dia selecionado, navega pelo teclado e escolhe", async () => {
    const onValueChange = vi.fn();
    render(<Field label="Data">{(c) => <DateInput {...c} value="2026-11-05" onValueChange={onValueChange} />}</Field>);
    await userEvent.click(screen.getByRole("button", { name: "Abrir calendário" }));
    expect(await screen.findByRole("grid", { name: /novembro de 2026/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /, 5 de novembro de 2026/ })).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith("2026-11-06");
    expect(screen.getByLabelText("Data")).toHaveValue("06/11/2026");
  });
});
