import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Avatar, AvatarGroup, getInitials } from "./Avatar";

describe("Avatar", () => {
  it("gera iniciais e nome acessível", () => {
    expect(getInitials("Mariana Costa Ferreira")).toBe("MF");
    render(<Avatar name="Rafael Almeida" />);
    expect(screen.getByRole("img", { name: "Rafael Almeida" })).toBeInTheDocument();
  });

  it("grupo mostra contador com rótulo 'e mais N'", () => {
    const people = ["A B", "C D", "E F", "G H", "I J", "K L"].map((name) => ({ name }));
    render(<AvatarGroup people={people} max={4} />);
    expect(screen.getByRole("img", { name: "e mais 2" })).toHaveTextContent("+2");
  });
});
