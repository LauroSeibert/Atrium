import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { CampoMoeda, CampoNumero } from "./FormSection";

function Numero() {
  const [v, setV] = useState<number | null | undefined>(null);
  return (
    <>
      <CampoNumero value={v} onChange={setV} />
      <output>{String(v)}</output>
    </>
  );
}
function Moeda() {
  const [v, setV] = useState<number | null | undefined>(null);
  return (
    <>
      <CampoMoeda value={v} onChange={setV} />
      <output>{String(v)}</output>
    </>
  );
}

describe("CampoNumero (pt-BR)", () => {
  it.each([
    ["1.000", "1000"],
    ["1.234.567", "1234567"],
    ["1,5", "1.5"],
    ["1.000,25", "1000.25"],
    ["12", "12"],
    ["1.5", "NaN"],
  ])("%s vira %s", async (digitado, esperado) => {
    render(<Numero />);
    await userEvent.type(screen.getByRole("textbox"), digitado);
    expect(document.querySelector("output")!.textContent).toBe(esperado);
  });
});

describe("CampoMoeda", () => {
  it("aceita texto com prefixo R$", async () => {
    render(<Moeda />);
    await userEvent.type(screen.getByRole("textbox"), "R$ 1.250,50");
    expect(document.querySelector("output")!.textContent).toBe("125050");
  });
});
