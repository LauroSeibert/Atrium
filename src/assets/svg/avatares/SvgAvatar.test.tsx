import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { coresForaDaPaleta, formasSemCor } from "../paleta.testutil";
import { AVATAR_VARIANTES, AvatarIlustrado, AvatarIniciais } from "./SvgAvatar";

describe("AvatarIlustrado", () => {
  it("tem 6 variantes", () => {
    expect(AVATAR_VARIANTES).toEqual([1, 2, 3, 4, 5, 6]);
  });

  describe.each(AVATAR_VARIANTES)("variante %i", (variante) => {
    it("é img 64x64 com nome padrão", () => {
      render(<AvatarIlustrado variante={variante} />);
      expect(screen.getByRole("img", { name: "Avatar ilustrado" })).toHaveAttribute("viewBox", "0 0 64 64");
    });

    it("só usa cores da paleta e toda forma tem fill", () => {
      render(<AvatarIlustrado variante={variante} />);
      const svg = screen.getByRole("img");
      expect(coresForaDaPaleta(svg)).toEqual([]);
      expect(formasSemCor(svg)).toEqual([]);
    });

    it("aceita o nome da pessoa como título", () => {
      render(<AvatarIlustrado variante={variante} titulo="Carla Mendes" />);
      expect(screen.getByRole("img", { name: "Carla Mendes" })).toBeInTheDocument();
    });
  });

  it("ids do clipPath não colidem entre instâncias", () => {
    const { container } = render(
      <>
        <AvatarIlustrado variante={1} />
        <AvatarIlustrado variante={2} />
      </>,
    );
    const ids = Array.from(container.querySelectorAll("clipPath")).map((c) => c.id);
    expect(new Set(ids).size).toBe(2);
  });
});

describe("AvatarIniciais", () => {
  const permitidos = ["surface-muted", "text", "primary", "on-primary"];

  it.each(["beige", "verde"] as const)("tom %s: img 64x64, nome acessível, cores permitidas", (tom) => {
    render(<AvatarIniciais nome="Ana Beatriz Souza" tom={tom} />);
    const svg = screen.getByRole("img", { name: "Ana Beatriz Souza" });
    expect(svg).toHaveAttribute("viewBox", "0 0 64 64");
    expect(coresForaDaPaleta(svg, permitidos)).toEqual([]);
    expect(coresForaDaPaleta(svg)).not.toEqual([]);
    expect(formasSemCor(svg)).toEqual([]);
  });

  it("usa os tokens de UI de cada tom", () => {
    const { container, rerender } = render(<AvatarIniciais nome="Ana Souza" />);
    expect(container.querySelector("circle")).toHaveAttribute("fill", "var(--surface-muted)");
    expect(container.querySelector("text")).toHaveAttribute("fill", "var(--text)");
    rerender(<AvatarIniciais nome="Ana Souza" tom="verde" />);
    expect(container.querySelector("circle")).toHaveAttribute("fill", "var(--primary)");
    expect(container.querySelector("text")).toHaveAttribute("fill", "var(--on-primary)");
  });

  it("gera iniciais: primeira e última palavra, uma letra se só uma palavra, espaços extras", () => {
    const texto = (nome: string) => {
      const { container, unmount } = render(<AvatarIniciais nome={nome} />);
      const t = container.querySelector("text")?.textContent;
      unmount();
      return t;
    };
    expect(texto("Ana Beatriz Souza")).toBe("AS");
    expect(texto("Marina")).toBe("M");
    expect(texto("  joão   da   silva  ")).toBe("JS");
    expect(texto("érica lima")).toBe("ÉL");
  });
});
