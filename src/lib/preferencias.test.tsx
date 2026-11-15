import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePreferencia } from "./preferencias";

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe("usePreferencia (RNF-16)", () => {
  it("devolve o padrão quando nada foi gravado", () => {
    const { result } = renderHook(() => usePreferencia("p-padrao", "claro"));
    expect(result.current[0]).toBe("claro");
  });

  it("grava, relê e persiste no localStorage com prefixo atrium:", () => {
    const { result } = renderHook(() => usePreferencia<boolean>("p-grava", false));
    act(() => result.current[1](true));
    expect(result.current[0]).toBe(true);
    expect(window.localStorage.getItem("atrium:p-grava")).toBe("true");
  });

  it("lê o valor já salvo", () => {
    window.localStorage.setItem("atrium:p-salvo", JSON.stringify(7));
    const { result } = renderHook(() => usePreferencia("p-salvo", 1));
    expect(result.current[0]).toBe(7);
  });

  it("tolera localStorage que lança erro: o valor fica em memória", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("cota");
    });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    const { result } = renderHook(() => usePreferencia<string>("p-falha", "a"));
    expect(result.current[0]).toBe("a");
    act(() => result.current[1]("b"));
    expect(result.current[0]).toBe("b");
  });

  it("setItem falhando com getItem funcionando (cota cheia): a escolha vale nesta aba", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("cota");
    });
    const { result } = renderHook(() => usePreferencia<boolean>("p-cota", false));
    act(() => result.current[1](true));
    expect(result.current[0]).toBe(true);
  });

  it("evento storage de outra aba atualiza o valor", () => {
    const { result } = renderHook(() => usePreferencia<string>("p-storage", "a"));
    act(() => {
      window.localStorage.setItem("atrium:p-storage", JSON.stringify("c"));
      window.dispatchEvent(new StorageEvent("storage", { key: "atrium:p-storage" }));
    });
    expect(result.current[0]).toBe("c");
  });
});
