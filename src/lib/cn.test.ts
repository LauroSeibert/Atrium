import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("resolve conflitos de cor do tema", () => {
    expect(cn("bg-surface text-text", "bg-primary")).toBe("text-text bg-primary");
  });
  it("não confunde cor de texto com tamanho de texto", () => {
    expect(cn("text-sm text-text-muted", "text-text")).toBe("text-sm text-text");
  });
  it("resolve sombras e raios do tema", () => {
    expect(cn("rounded-md shadow-1", "rounded-lg shadow-2")).toBe("rounded-lg shadow-2");
  });
  it("ignora valores falsos", () => {
    expect(cn("p-2", false, undefined, null, "p-4")).toBe("p-4");
  });
});
