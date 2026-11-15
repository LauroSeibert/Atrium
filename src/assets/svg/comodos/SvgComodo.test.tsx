import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { coresForaDaPaleta, formasSemCor } from "../paleta.testutil";
import { SvgComodo, COMODO_VARIANTES, type ComodoVariante } from "./SvgComodo";

const TITULOS: Record<ComodoVariante, string> = {
  sala: "Ilustração de sala de estar com sofá",
  cozinha: "Ilustração de cozinha com bancada",
  quarto: "Ilustração de quarto com cama de casal",
  banheiro: "Ilustração de banheiro com box",
  varanda: "Ilustração de varanda com guarda-corpo",
  garagem: "Ilustração de garagem com carro",
  areaGourmet: "Ilustração de área gourmet com churrasqueira",
  escritorio: "Ilustração de escritório com mesa e estante",
};

describe("SvgComodo", () => {
  it("cobre as 8 variantes", () => {
    expect(COMODO_VARIANTES.map((v) => v.variante).sort()).toEqual(Object.keys(TITULOS).sort());
  });

  describe.each(COMODO_VARIANTES)("$variante", ({ variante }) => {
    it("expõe título acessível, viewBox 4:3 e só cores da paleta", () => {
      render(<SvgComodo variant={variante} />);
      const svg = screen.getByRole("img", { name: TITULOS[variante] });
      expect(svg.getAttribute("viewBox")).toBe("0 0 400 300");
      expect(coresForaDaPaleta(svg)).toEqual([]);
      expect(formasSemCor(svg)).toEqual([]);
    });

    it("decorativa: aria-hidden e sem title", () => {
      const { container } = render(<SvgComodo variant={variante} decorativa />);
      const svg = container.querySelector("svg")!;
      expect(svg.getAttribute("aria-hidden")).toBe("true");
      expect(svg.querySelector("title")).toBeNull();
      expect(screen.queryByRole("img")).toBeNull();
    });

    it("título customizado vira o nome acessível", () => {
      render(<SvgComodo variant={variante} titulo="Cômodo do anúncio" />);
      expect(screen.getByRole("img", { name: "Cômodo do anúncio" })).toBeTruthy();
    });
  });
});
