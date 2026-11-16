import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { proximoTema, ThemeSwitch } from "./ThemeSwitch";

describe("ThemeSwitch (RF-03)", () => {
  it("é um switch que reflete o tema escuro", () => {
    render(<ThemeSwitch temaResolvido="dark" onAlternar={vi.fn()} />);
    expect(screen.getByRole("switch", { name: "Tema escuro" })).toHaveAttribute("aria-checked", "true");
  });

  it("um clique alterna, sem menu", async () => {
    const onAlternar = vi.fn();
    render(<ThemeSwitch temaResolvido="light" onAlternar={onAlternar} />);
    await userEvent.click(screen.getByRole("switch", { name: "Tema escuro" }));
    expect(onAlternar).toHaveBeenCalledOnce();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("volta a seguir o sistema quando o tema novo coincide com o do sistema", () => {
    expect(proximoTema("light", "dark")).toBe("system");
    expect(proximoTema("dark", "light")).toBe("system");
    expect(proximoTema("light", "light")).toBe("dark");
    expect(proximoTema("dark", "dark")).toBe("light");
  });
});
