import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LinkCodigo } from "./LinkCodigo";

describe("LinkCodigo", () => {
  it("é um link com o código e destino", () => {
    render(<LinkCodigo href="/contratos/ctr_1">CT-2026-0012</LinkCodigo>);
    const l = screen.getByRole("link", { name: "CT-2026-0012" });
    expect(l).toHaveAttribute("href", "/contratos/ctr_1");
    expect(l).toHaveClass("font-mono");
  });
});
