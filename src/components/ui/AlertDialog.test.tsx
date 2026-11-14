import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";
import { AlertDialog } from "./AlertDialog";

function setup(props: Partial<React.ComponentProps<typeof AlertDialog>> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <AlertDialog
      trigger={<Button variant="destructive">Cancelar contrato</Button>}
      title="Cancelar contrato CT-2026-0012?"
      description="O imóvel volta para Disponível."
      confirmLabel="Sim, cancelar"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...props}
    />,
  );
  return { onConfirm, onCancel };
}

describe("AlertDialog", () => {
  it("é alertdialog com título; foco inicial no Cancelar", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("button", { name: "Cancelar contrato" }));
    expect(screen.getByRole("alertdialog", { name: "Cancelar contrato CT-2026-0012?" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toHaveFocus();
  });

  it("confirmar chama onConfirm e fecha", async () => {
    const user = userEvent.setup();
    const { onConfirm } = setup();
    await user.click(screen.getByRole("button", { name: "Cancelar contrato" }));
    await user.click(screen.getByRole("button", { name: "Sim, cancelar" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("cancelar e Esc não confirmam; foco volta ao gatilho", async () => {
    const user = userEvent.setup();
    const { onConfirm, onCancel } = setup();
    const trigger = screen.getByRole("button", { name: "Cancelar contrato" });
    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(trigger).toHaveFocus();
    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("carregando bloqueia o botão de confirmar e mantém aberto", async () => {
    const user = userEvent.setup();
    const { onConfirm } = setup({ defaultOpen: true, loading: true, closeOnConfirm: false });
    const confirmar = screen.getByRole("button", { name: "Sim, cancelar" });
    expect(confirmar).toHaveAttribute("aria-busy", "true");
    await user.click(confirmar);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("carregando ignora Esc e não chama onOpenChange(false)", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    setup({ defaultOpen: true, loading: true, closeOnConfirm: false, onOpenChange });
    await user.keyboard("{Escape}");
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});
