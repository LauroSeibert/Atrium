import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ThemeMenu } from "./ThemeMenu";

describe("ThemeMenu (RF-03)", () => {
  it("rotula o botão com o tema atual", () => {
    render(<ThemeMenu tema="light" onTemaChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Tema: Claro" })).toBeInTheDocument();
  });

  it('escolher "Escuro" chama onTemaChange("dark")', async () => {
    const onTemaChange = vi.fn();
    render(<ThemeMenu tema="light" onTemaChange={onTemaChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Tema: Claro" }));
    await userEvent.click(screen.getByRole("menuitemradio", { name: "Escuro" }));
    expect(onTemaChange).toHaveBeenCalledWith("dark");
  });
});
