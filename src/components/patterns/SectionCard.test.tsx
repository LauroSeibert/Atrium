import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SectionCard } from "./SectionCard";

describe("SectionCard", () => {
  it("é uma região nomeada pelo título, no nível pedido", () => {
    render(
      <SectionCard titulo="Partes" headingLevel={3} acoes={<button>Editar</button>}>
        conteúdo
      </SectionCard>,
    );
    expect(screen.getByRole("region", { name: "Partes" })).toHaveTextContent("conteúdo");
    expect(screen.getByRole("heading", { level: 3, name: "Partes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Editar" })).toBeInTheDocument();
  });
});
