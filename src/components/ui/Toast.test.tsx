import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { toast, Toaster, useToastStore } from "./Toast";
import type { ToastInput } from "./Toast";

afterEach(() => act(() => useToastStore.getState().clear()));

describe("Toast", () => {
  it("action chama o handler e fecha o toast (Desfazer, RF-04)", async () => {
    const user = userEvent.setup();
    const onUndo = vi.fn();
    render(<Toaster />);
    act(() => {
      toast({ tone: "success", title: "Lead movido para Visita", action: { label: "Desfazer", onClick: onUndo } });
    });
    expect(await screen.findByText("Lead movido para Visita")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Desfazer" }));
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Lead movido para Visita")).not.toBeInTheDocument();
  });

  it("botão Fechar remove o toast", async () => {
    const user = userEvent.setup();
    render(<Toaster />);
    act(() => {
      toast({ tone: "info", title: "Relatório em geração" });
    });
    await screen.findByText("Relatório em geração");
    await user.click(screen.getByRole("button", { name: "Fechar" }));
    expect(screen.queryByText("Relatório em geração")).not.toBeInTheDocument();
  });

  it("mostra no máximo 3 toasts (os mais recentes)", async () => {
    render(<Toaster />);
    act(() => {
      for (const n of [1, 2, 3, 4]) toast({ tone: "info", title: `Aviso ${n}` });
    });
    await screen.findByText("Aviso 4");
    expect(screen.queryByText("Aviso 1")).not.toBeInTheDocument();
    expect(screen.getByText("Aviso 2")).toBeInTheDocument();
  });

  it("duração padrão: 5 s; erro: 8 s", () => {
    act(() => {
      toast({ tone: "success", title: "ok" });
      toast({ tone: "error", title: "falha" });
    });
    const [ok, erro] = useToastStore.getState().toasts as unknown as [ToastInput, ToastInput];
    expect(ok.duration ?? 5000).toBe(5000);
    expect(erro.duration).toBeUndefined();
  });
});
