import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, type SortDirection } from "./Table";

function Exemplo() {
  const [dir, setDir] = useState<SortDirection>("none");
  return (
    <Table aria-label="Contratos">
      <TableHeader>
        <TableRow>
          <TableHead sortable sortDirection={dir} onSortChange={setDir}>
            Contrato
          </TableHead>
          <TableHead align="right">Aluguel</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow data-state="selected">
          <TableCell>2024/0181</TableCell>
          <TableCell align="right">R$ 3.200,00</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

describe("Table", () => {
  it("é uma região rolável por teclado com nome acessível", async () => {
    const user = userEvent.setup();
    render(<Exemplo />);
    const region = screen.getByRole("region", { name: "Contratos" });
    await user.tab();
    expect(region).toHaveFocus();
  });

  it("cabeçalho ordenável alterna aria-sort", async () => {
    const user = userEvent.setup();
    render(<Exemplo />);
    const th = screen.getByRole("columnheader", { name: "Contrato" });
    expect(th).toHaveAttribute("aria-sort", "none");
    await user.click(screen.getByRole("button", { name: "Contrato" }));
    expect(th).toHaveAttribute("aria-sort", "ascending");
    await user.click(screen.getByRole("button", { name: "Contrato" }));
    expect(th).toHaveAttribute("aria-sort", "descending");
  });

  it("cabeçalho não ordenável não tem aria-sort e tem scope=col", () => {
    render(<Exemplo />);
    const th = screen.getByRole("columnheader", { name: "Aluguel" });
    expect(th).not.toHaveAttribute("aria-sort");
    expect(th).toHaveAttribute("scope", "col");
  });
});
