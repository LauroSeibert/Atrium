import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TipoImovel } from "@/domain/imovel/schema";
import { fachadaPadrao, PropertyImage } from "./PropertyImage";

const POR_TIPO: [TipoImovel, string][] = [
  ["casa", "Ilustração de casa térrea"],
  ["apartamento", "Ilustração de prédio de apartamentos"],
  ["cobertura", "Ilustração de cobertura no topo de um prédio"],
  ["terreno", "Ilustração de terreno vazio com placa"],
  ["comercial", "Ilustração de sala comercial"],
];

describe("PropertyImage", () => {
  it.each(POR_TIPO)("deriva a fachada do tipo %s", (tipo, nome) => {
    render(<PropertyImage tipo={tipo} />);
    expect(screen.getByRole("img", { name: nome })).toBeInTheDocument();
  });

  it("fachadaPadrao mapeia cada tipo", () => {
    expect(fachadaPadrao("casa")).toBe("terrea");
    expect(fachadaPadrao("apartamento")).toBe("predio");
  });

  it("usa a fachada definida em vez da derivada", () => {
    render(<PropertyImage tipo="casa" fachada="sobrado" />);
    expect(screen.getByRole("img", { name: "Ilustração de sobrado de dois andares" })).toBeInTheDocument();
  });

  it("mostra o fallback quando fachada é null", () => {
    render(<PropertyImage tipo="casa" fachada={null} />);
    expect(screen.getByRole("img", { name: "Imóvel sem ilustração" })).toBeInTheDocument();
    expect(screen.getByText("Sem ilustração")).toBeInTheDocument();
  });

  it("usa o título informado no fallback e na ilustração", () => {
    const { rerender } = render(<PropertyImage tipo="casa" fachada={null} titulo="Casa sem foto" />);
    expect(screen.getByRole("img", { name: "Casa sem foto" })).toBeInTheDocument();
    rerender(<PropertyImage tipo="casa" titulo="Casa na Vila Mariana" />);
    expect(screen.getByRole("img", { name: "Casa na Vila Mariana" })).toBeInTheDocument();
  });

  it("cômodo tem prioridade sobre fachada e fallback", () => {
    render(<PropertyImage tipo="casa" fachada={null} comodo="cozinha" />);
    expect(screen.queryByText("Sem ilustração")).not.toBeInTheDocument();
    expect(screen.getByRole("img").getAttribute("viewBox")).toBe("0 0 400 300");
    expect(screen.getByRole("img", { name: /cozinha/i })).toBeInTheDocument();
  });

  it("decorativa some da árvore de acessibilidade", () => {
    render(<PropertyImage tipo="casa" decorativa />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    render(<PropertyImage tipo="casa" fachada={null} decorativa />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
