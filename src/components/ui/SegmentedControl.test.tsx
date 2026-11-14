import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LayoutGrid, List } from "lucide-react";
import { describe, expect, it } from "vitest";
import { SegmentedControl } from "./SegmentedControl";

function Exemplo() {
  const [value, setValue] = useState("grade");
  return (
    <SegmentedControl
      aria-label="Visualização"
      value={value}
      onValueChange={setValue}
      options={[
        { value: "grade", label: "Grade", icon: LayoutGrid, hideLabel: true },
        { value: "lista", label: "Lista", icon: List },
      ]}
    />
  );
}

describe("SegmentedControl", () => {
  it("mantém uma única opção selecionada e navega por teclado", async () => {
    const user = userEvent.setup();
    render(<Exemplo />);
    const grade = screen.getByRole("radio", { name: "Grade" });
    const lista = screen.getByRole("radio", { name: "Lista" });
    expect(grade).toBeChecked();
    await user.tab();
    expect(grade).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(lista).toHaveFocus();
    await user.keyboard(" ");
    expect(lista).toBeChecked();
    expect(grade).not.toBeChecked();
  });

  it("clicar na opção ativa não desmarca (valor obrigatório)", async () => {
    const user = userEvent.setup();
    render(<Exemplo />);
    await user.click(screen.getByRole("radio", { name: "Grade" }));
    expect(screen.getByRole("radio", { name: "Grade" })).toBeChecked();
  });
});
