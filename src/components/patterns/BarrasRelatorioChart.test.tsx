import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BarrasRelatorioChart, barrasVazias } from "./BarrasRelatorioChart";

describe("BarrasRelatorioChart (RF-82)", () => {
  it("mostra a legenda só com mais de uma série", () => {
    const cat = [{ rotulo: "jun/26", valores: [100, 50] }];
    const { rerender } = render(
      <BarrasRelatorioChart
        categorias={cat}
        series={[
          { rotulo: "Vendas", formato: "moeda" },
          { rotulo: "Locações", formato: "moeda" },
        ]}
      />,
    );
    expect(screen.getByText("Locações")).toBeInTheDocument();
    rerender(<BarrasRelatorioChart categorias={cat} series={[{ rotulo: "Vendas", formato: "moeda" }]} />);
    expect(screen.queryByText("Locações")).not.toBeInTheDocument();
  });

  it("detecta dados vazios", () => {
    expect(barrasVazias([{ rotulo: "a", valores: [0, 0] }])).toBe(true);
    expect(barrasVazias([{ rotulo: "a", valores: [0, 1] }])).toBe(false);
    expect(barrasVazias([])).toBe(true);
  });
});
