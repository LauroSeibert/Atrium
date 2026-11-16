import { act, renderHook, waitFor } from "@testing-library/react";
import { useCallback } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useToastStore } from "@/components/ui/Toast";
import { executarEscrita } from "./escrita";
import { invalidarDados } from "./revisao";
import { enviandoLinha, useAcaoEmLinha } from "./useAcaoEmLinha";
import { useConsulta } from "./useConsulta";

beforeEach(() => useToastStore.getState().clear());

describe("useConsulta", () => {
  it("busca uma vez ao montar e relê após invalidarDados (RF-62)", async () => {
    const carregar = vi.fn(async () => 1);
    const { result } = renderHook(() => useConsulta(useCallback(() => carregar(), [])));
    await waitFor(() => expect(result.current.estado.fase).toBe("success"));
    expect(carregar).toHaveBeenCalledTimes(1);
    act(() => invalidarDados());
    await waitFor(() => expect(carregar).toHaveBeenCalledTimes(2));
  });
});

describe("executarEscrita (RF-04)", () => {
  it("sucesso: toast com Desfazer; desfazer chama a função e mostra aviso", async () => {
    const desfazer = vi.fn(async () => {});
    const r = await executarEscrita(async () => ({ resultado: 7, desfazer }), { sucesso: (n) => `Feito ${n}` });
    expect(r).toEqual({ fase: "ok", resultado: 7 });
    const [t] = useToastStore.getState().toasts;
    expect(t?.title).toBe("Feito 7");
    act(() => t!.action!.onClick());
    await waitFor(() => expect(desfazer).toHaveBeenCalled());
    await waitFor(() =>
      expect(useToastStore.getState().toasts.some((x) => x.title === "Alteração desfeita")).toBe(true),
    );
  });

  it("erro: devolve a falha e mostra toast, salvo silenciarErro", async () => {
    const falha = async () => {
      throw new Error("x");
    };
    const r = await executarEscrita(falha, { sucesso: "ok" });
    expect(r.fase).toBe("erro");
    expect(useToastStore.getState().toasts[0]?.tone).toBe("error");
    useToastStore.getState().clear();
    await executarEscrita(falha, { sucesso: "ok", silenciarErro: true });
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it("sem Desfazer quando desfazivel=false", async () => {
    await executarEscrita(async () => ({ resultado: 1, desfazer: async () => {} }), {
      sucesso: "ok",
      desfazivel: false,
    });
    expect(useToastStore.getState().toasts[0]?.action).toBeUndefined();
  });
});

describe("useAcaoEmLinha", () => {
  it("bloqueia segundo acionamento enquanto envia e volta a idle", async () => {
    const { result } = renderHook(() => useAcaoEmLinha());
    let liberar: () => void = () => {};
    const lenta = () =>
      new Promise<{ resultado: number; desfazer: () => Promise<void> }>((res) => {
        liberar = () => res({ resultado: 1, desfazer: async () => {} });
      });
    let primeira: Promise<unknown> = Promise.resolve();
    act(() => {
      primeira = result.current.executar("a", lenta, { sucesso: "ok" });
    });
    expect(result.current.estado).toEqual({ fase: "enviando", id: "a" });
    expect(enviandoLinha(result.current.estado, "b")).toBe(false);
    const segunda = vi.fn(async () => ({ resultado: 2, desfazer: async () => {} }));
    let r2: unknown;
    await act(async () => {
      r2 = await result.current.executar("b", segunda, { sucesso: "ok" });
    });
    expect(r2).toBeUndefined();
    expect(segunda).not.toHaveBeenCalled();
    await act(async () => {
      liberar();
      await primeira;
    });
    expect(result.current.estado).toEqual({ fase: "idle" });
  });
});
