import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { UserMenu } from "./UserMenu";

const ana = { id: "cor_a", nome: "Ana Teste", papel: "gestor" as const };
const beto = { id: "cor_b", nome: "Beto Teste", papel: "corretor" as const };

describe("UserMenu (RF-08, RF-50)", () => {
  it("loading mostra skeleton ocupado", () => {
    render(<UserMenu usuario={{ fase: "loading" }} />);
    expect(screen.getByLabelText("Carregando usuário")).toHaveAttribute("aria-busy", "true");
  });

  it("erro mostra link para Configurações", () => {
    render(<UserMenu usuario={{ fase: "error", erro: new Error("x") }} />);
    expect(screen.getByRole("link", { name: "Usuário indisponível. Abrir configurações" })).toHaveAttribute(
      "href",
      "/configuracoes",
    );
  });

  it("sucesso rotula o botão com nome e papel", () => {
    render(<UserMenu usuario={{ fase: "success", dados: ana }} />);
    expect(screen.getByRole("button", { name: /Menu do usuário:\s*Ana Teste/ })).toBeInTheDocument();
  });

  it("trocar persona chama onTrocarPersona com o id", async () => {
    const onTrocarPersona = vi.fn();
    render(
      <UserMenu usuario={{ fase: "success", dados: ana }} personas={[ana, beto]} onTrocarPersona={onTrocarPersona} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /Menu do usuário/ }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Trocar persona" }));
    await userEvent.click(await screen.findByRole("menuitemradio", { name: /Beto Teste/ }));
    expect(onTrocarPersona).toHaveBeenCalledWith("cor_b");
  });

  it("sem personas esconde o seletor", async () => {
    render(<UserMenu usuario={{ fase: "success", dados: ana }} />);
    await userEvent.click(screen.getByRole("button", { name: /Menu do usuário/ }));
    expect(screen.queryByRole("menuitem", { name: "Trocar persona" })).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Configurações" })).toBeInTheDocument();
  });
});
