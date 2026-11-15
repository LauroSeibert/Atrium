import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDestructive, type ConfirmDestructiveProps } from "./ConfirmDestructive";

const props = (extra: Partial<ConfirmDestructiveProps> = {}): ConfirmDestructiveProps => ({
  aberto: true,
  onAbertoChange: vi.fn(),
  onConfirmar: vi.fn(),
  titulo: "Cancelar o contrato CT-2026-0012?",
  impactos: ["O imóvel AT-0042 volta a disponível", "3 parcelas em aberto passam a canceladas"],
  rotuloConfirmar: "Cancelar contrato",
  ...extra,
});

describe("ConfirmDestructive (RF-05, RF-32, RF-48)", () => {
  it("título com o nome do item, impactos em lista e foco inicial em Voltar", () => {
    render(<ConfirmDestructive {...props()} />);
    expect(screen.getByRole("alertdialog", { name: "Cancelar o contrato CT-2026-0012?" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Voltar" })).toHaveFocus();
  });

  it("Voltar e Esc pedem para fechar", async () => {
    const onAbertoChange = vi.fn();
    const user = userEvent.setup();
    render(<ConfirmDestructive {...props({ onAbertoChange })} />);
    await user.keyboard("{Escape}");
    expect(onAbertoChange).toHaveBeenLastCalledWith(false);
    await user.click(screen.getByRole("button", { name: "Voltar" }));
    expect(onAbertoChange).toHaveBeenCalledTimes(2);
  });

  it("sem motivo, confirmar chama onConfirmar sem argumento", async () => {
    const onConfirmar = vi.fn();
    const user = userEvent.setup();
    render(<ConfirmDestructive {...props({ onConfirmar })} />);
    await user.click(screen.getByRole("button", { name: "Cancelar contrato" }));
    expect(onConfirmar).toHaveBeenCalledWith(undefined);
  });

  it("motivo obrigatório: valida inline e só confirma com texto", async () => {
    const onConfirmar = vi.fn();
    const user = userEvent.setup();
    render(
      <ConfirmDestructive
        {...props({ onConfirmar, motivo: { tipo: "texto", rotulo: "Motivo", obrigatorio: true } })}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Cancelar contrato" }));
    expect(onConfirmar).not.toHaveBeenCalled();
    const campo = screen.getByRole("textbox", { name: /Motivo/ });
    expect(campo).toHaveAttribute("aria-invalid", "true");
    expect(campo).toHaveAccessibleDescription("Informe o motivo.");
    await user.type(campo, "  Distrato amigável  ");
    await user.click(screen.getByRole("button", { name: "Cancelar contrato" }));
    expect(onConfirmar).toHaveBeenCalledWith("Distrato amigável");
  });

  it("motivo opcional: confirma vazio sem erro", async () => {
    const onConfirmar = vi.fn();
    const user = userEvent.setup();
    render(
      <ConfirmDestructive
        {...props({ onConfirmar, motivo: { tipo: "texto", rotulo: "Motivo", obrigatorio: false } })}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Cancelar contrato" }));
    expect(onConfirmar).toHaveBeenCalledWith(undefined);
  });

  it("select obrigatório (motivo de perda) exige escolha", async () => {
    const onConfirmar = vi.fn();
    const user = userEvent.setup();
    render(
      <ConfirmDestructive
        {...props({
          onConfirmar,
          motivo: {
            tipo: "select",
            rotulo: "Motivo da perda",
            obrigatorio: true,
            mensagemObrigatorio: "Escolha o motivo.",
            opcoes: [{ value: "preco", label: "Preço" }],
          },
        })}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Cancelar contrato" }));
    expect(screen.getByText("Escolha o motivo.")).toBeInTheDocument();
    expect(onConfirmar).not.toHaveBeenCalled();
    await user.click(screen.getByRole("combobox", { name: /Motivo da perda/ }));
    await user.click(await screen.findByRole("option", { name: "Preço" }));
    await user.click(screen.getByRole("button", { name: "Cancelar contrato" }));
    expect(onConfirmar).toHaveBeenCalledWith("preco");
  });

  it("confirmando: botão ocupado, Voltar desabilitado e Esc não fecha", async () => {
    const onAbertoChange = vi.fn();
    const onConfirmar = vi.fn();
    const user = userEvent.setup();
    render(<ConfirmDestructive {...props({ fase: { fase: "confirmando" }, onAbertoChange, onConfirmar })} />);
    expect(screen.getByRole("button", { name: "Voltar" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar contrato" })).toHaveAttribute("aria-busy", "true");
    await user.keyboard("{Escape}");
    expect(onAbertoChange).not.toHaveBeenCalled();
    expect(onConfirmar).not.toHaveBeenCalled();
  });

  it("erro ao confirmar mostra a mensagem em alerta", () => {
    render(<ConfirmDestructive {...props({ fase: { fase: "erro", mensagem: "Falhou. Tente de novo." } })} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Falhou. Tente de novo.");
  });
});
