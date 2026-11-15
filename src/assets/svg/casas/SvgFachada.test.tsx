import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { coresForaDaPaleta, formasSemCor } from "../paleta.testutil";
import { FACHADA_VARIANTES, SvgFachada, type FachadaVariante } from "./SvgFachada";

const TITULOS: Record<FachadaVariante, string> = {
  terrea: "Ilustração de casa térrea",
  sobrado: "Ilustração de sobrado de dois andares",
  moderna: "Ilustração de casa moderna com volumes retos",
  predio: "Ilustração de prédio de apartamentos",
  cobertura: "Ilustração de cobertura no topo de um prédio",
  campo: "Ilustração de casa de campo",
  comercial: "Ilustração de sala comercial",
  terreno: "Ilustração de terreno vazio com placa",
};

describe.each(FACHADA_VARIANTES)("SvgFachada $variante", ({ variante }) => {
  it("expõe o título padrão como nome acessível e viewBox 4:3", () => {
    render(<SvgFachada variant={variante} />);
    const svg = screen.getByRole("img", { name: TITULOS[variante] });
    expect(svg.getAttribute("viewBox")).toBe("0 0 400 300");
  });

  it("usa só cores da paleta e todas as formas têm cor", () => {
    render(<SvgFachada variant={variante} />);
    const svg = screen.getByRole("img");
    expect(coresForaDaPaleta(svg)).toEqual([]);
    expect(formasSemCor(svg)).toEqual([]);
  });

  it("decorativa fica aria-hidden e sem title", () => {
    const { container } = render(<SvgFachada variant={variante} decorativa />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.querySelector("title")).toBeNull();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("aceita título customizado", () => {
    render(<SvgFachada variant={variante} titulo="Fachada do imóvel 12" />);
    expect(screen.getByRole("img", { name: "Fachada do imóvel 12" })).toBeTruthy();
  });
});

describe("FACHADA_VARIANTES", () => {
  it("cobre as 8 variantes com rótulos pt-BR", () => {
    expect(FACHADA_VARIANTES).toHaveLength(8);
    expect(Object.keys(TITULOS).sort()).toEqual(FACHADA_VARIANTES.map((v) => v.variante).sort());
  });
});
