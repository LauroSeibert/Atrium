import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Topbar } from "./Topbar";

const trilha = [{ rotulo: "Imóveis", href: "/imoveis" }, { rotulo: "IMV-0012" }];

describe("Topbar (RF-61)", () => {
  it("mostra a trilha com links e a página atual com aria-current", () => {
    render(<Topbar trilha={trilha} onAbrirMenu={vi.fn()} />);
    expect(screen.getByRole("link", { name: "Imóveis" })).toHaveAttribute("href", "/imoveis");
    expect(screen.getByText("IMV-0012")).toHaveAttribute("aria-current", "page");
  });

  it('o botão "Abrir menu" chama o callback', async () => {
    const onAbrirMenu = vi.fn();
    render(<Topbar trilha={trilha} onAbrirMenu={onAbrirMenu} />);
    await userEvent.click(screen.getByRole("button", { name: "Abrir menu" }));
    expect(onAbrirMenu).toHaveBeenCalledTimes(1);
  });

  it("renderiza os slots", () => {
    render(
      <Topbar
        trilha={trilha}
        onAbrirMenu={vi.fn()}
        busca={<span>busca</span>}
        notificacoes={<span>notif</span>}
        tema={<span>tema</span>}
        usuario={<span>usuario</span>}
      />,
    );
    for (const t of ["busca", "notif", "tema", "usuario"]) expect(screen.getByText(t)).toBeInTheDocument();
  });
});
