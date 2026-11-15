import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SkipLink } from "./SkipLink";

describe("SkipLink (RNF-03)", () => {
  it('aponta para "#conteudo" por padrão', () => {
    render(<SkipLink />);
    expect(screen.getByRole("link", { name: "Ir para o conteúdo" })).toHaveAttribute("href", "#conteudo");
  });
  it("aceita outro alvo", () => {
    render(<SkipLink alvo="main" />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "#main");
  });
});
