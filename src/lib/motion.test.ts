import { afterEach, describe, expect, it } from "vitest";
import { bezier, segundos, transicaoDeTokens } from "./motion";

describe("segundos", () => {
  it("converte ms e s", () => {
    expect(segundos("200ms")).toBe(0.2);
    expect(segundos(" 0.2s ")).toBe(0.2);
    expect(segundos("1s")).toBe(1);
  });
  it("devolve null para valor inválido", () => {
    expect(segundos("")).toBeNull();
    expect(segundos("rápido")).toBeNull();
    expect(segundos("200")).toBeNull();
  });
});

describe("bezier", () => {
  it("lê cubic-bezier válido", () => {
    expect(bezier("cubic-bezier(0.2, 0, 0, 1)")).toEqual([0.2, 0, 0, 1]);
  });
  it("devolve null para inválido", () => {
    expect(bezier("ease")).toBeNull();
    expect(bezier("cubic-bezier(0.2, 0, 1)")).toBeNull();
    expect(bezier("cubic-bezier(a, b, c, d)")).toBeNull();
  });
});

describe("transicaoDeTokens", () => {
  afterEach(() => {
    const s = document.documentElement.style;
    s.removeProperty("--dur-base");
    s.removeProperty("--easing-standard");
  });

  it("lê as variáveis CSS do documento", () => {
    document.documentElement.style.setProperty("--dur-base", "240ms");
    document.documentElement.style.setProperty("--easing-standard", "cubic-bezier(0.2, 0, 0, 1)");
    expect(transicaoDeTokens("--dur-base", "--easing-standard")).toEqual({ duration: 0.24, ease: [0.2, 0, 0, 1] });
  });

  it("sem tokens definidos, não anima", () => {
    expect(transicaoDeTokens("--dur-base", "--easing-standard")).toEqual({ duration: 0, ease: [0, 0, 1, 1] });
  });
});
