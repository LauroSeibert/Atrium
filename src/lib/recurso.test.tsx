import { act, renderHook, waitFor } from "@testing-library/react";
import { useCallback } from "react";
import { describe, expect, it } from "vitest";
import { recurso, useRecurso, type Recurso } from "./recurso";

describe("recurso (estado de tela, ESTADOS §3.5)", () => {
  it("transições puras mantêm dados no refetch e no erro", () => {
    const ok = recurso.sucesso([1]);
    expect(ok).toEqual({ fase: "success", dados: [1] });
    expect(recurso.carregar(ok)).toEqual({ fase: "loading", dados: [1] });
    expect(recurso.falha(ok, "x")).toMatchObject({ fase: "error", dados: [1] });
    expect(recurso.sucesso([1], "faltou parte")).toEqual({ fase: "partial", dados: [1], aviso: "faltou parte" });
  });

  it("useRecurso: loading → success e erro → tentar de novo", async () => {
    let falhar = true;
    const { result } = renderHook(() => {
      const carregar = useCallback(() => (falhar ? Promise.reject(new Error("rede")) : Promise.resolve(42)), []);
      return useRecurso(carregar);
    });
    await waitFor(() => expect(result.current.estado.fase).toBe("error"));
    falhar = false;
    act(() => result.current.recarregar());
    await waitFor(() =>
      expect(result.current.estado).toEqual({ fase: "success", dados: 42 } satisfies Recurso<number>),
    );
  });
});
