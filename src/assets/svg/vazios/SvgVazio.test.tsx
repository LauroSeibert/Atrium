import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { coresForaDaPaleta, formasSemCor } from "../paleta.testutil";
import { SvgVazio, VAZIO_VARIANTES } from "./SvgVazio";

const TITULOS = {
  semResultados: "Ilustração de lupa sobre uma casa: nenhum resultado",
  erro: "Ilustração de casa com sinal de alerta: algo deu errado",
  semLeads: "Ilustração de caixa de entrada vazia: nenhum lead",
  semContratos: "Ilustração de prancheta com documento em branco: nenhum contrato",
} as const;

describe("SvgVazio", () => {
  it("tem rótulos pt-BR para as quatro variantes", () => {
    expect(VAZIO_VARIANTES.map((v) => v.rotulo)).toEqual(["Nenhum resultado", "Erro", "Sem leads", "Sem contratos"]);
  });

  describe.each(VAZIO_VARIANTES)("$variant", ({ variant }) => {
    it("é img com nome acessível padrão e viewBox 240x180", () => {
      render(<SvgVazio variant={variant} />);
      const svg = screen.getByRole("img", { name: TITULOS[variant] });
      expect(svg).toHaveAttribute("viewBox", "0 0 240 180");
    });

    it("só usa cores da paleta e toda forma tem fill", () => {
      render(<SvgVazio variant={variant} />);
      const svg = screen.getByRole("img");
      expect(coresForaDaPaleta(svg)).toEqual([]);
      expect(formasSemCor(svg)).toEqual([]);
    });

    it("aceita título customizado e modo decorativo", () => {
      const { unmount } = render(<SvgVazio variant={variant} titulo="Outro texto" />);
      expect(screen.getByRole("img", { name: "Outro texto" })).toBeInTheDocument();
      unmount();
      const { container } = render(<SvgVazio variant={variant} decorativa />);
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
      expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    });
  });
});
