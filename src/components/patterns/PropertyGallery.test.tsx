import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Comodo } from "@/domain";
import { PropertyGallery } from "./PropertyGallery";

const comodos: Comodo[] = [
  { tipo: "sala", nome: "Sala de estar", area: 30 },
  { tipo: "cozinha", nome: "Cozinha", area: null },
  { tipo: "quarto", nome: "Suíte master", area: 18 },
];

describe("PropertyGallery", () => {
  it("expõe o padrão de carrossel, slide e contador com aria-live", () => {
    render(<PropertyGallery comodos={comodos} tipo="casa" />);
    expect(screen.getByRole("region", { name: "Galeria do imóvel" })).toHaveAttribute(
      "aria-roledescription",
      "carrossel",
    );
    expect(screen.getByRole("group", { name: /1 de 3/ })).toHaveAttribute("aria-roledescription", "slide");
    const contador = screen.getByText("1 de 3").parentElement!;
    expect(contador).toHaveAttribute("aria-live", "polite");
  });

  it("setas, miniaturas e teclado navegam (com volta ao início)", async () => {
    const onMudar = vi.fn();
    render(<PropertyGallery comodos={comodos} tipo="casa" onMudar={onMudar} />);
    await userEvent.click(screen.getByRole("button", { name: "Próximo slide" }));
    expect(screen.getByText("2 de 3")).toBeInTheDocument();
    expect(onMudar).toHaveBeenLastCalledWith(1);
    await userEvent.click(screen.getByRole("button", { name: /Ir para Suíte master/ }));
    expect(screen.getByText("3 de 3")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Próximo slide" }));
    expect(screen.getByText("1 de 3")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Slide anterior" }));
    expect(screen.getByText("3 de 3")).toBeInTheDocument();

    screen.getByLabelText(/Cômodos do imóvel/).focus();
    await userEvent.keyboard("{Home}");
    expect(screen.getByText("1 de 3")).toBeInTheDocument();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByText("2 de 3")).toBeInTheDocument();
    await userEvent.keyboard("{ArrowLeft}");
    await userEvent.keyboard("{End}");
    expect(screen.getByText("3 de 3")).toBeInTheDocument();
  });

  it("miniatura atual tem aria-current", () => {
    render(<PropertyGallery comodos={comodos} tipo="casa" />);
    expect(screen.getByRole("button", { name: /Ir para Sala de estar/ })).toHaveAttribute("aria-current", "true");
  });

  it("sem cômodos mostra fachada e aviso, sem controles", () => {
    render(<PropertyGallery comodos={[]} tipo="terreno" />);
    expect(screen.getByRole("img", { name: /terreno/i })).toBeInTheDocument();
    expect(screen.getByText("Sem cômodos para mostrar")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Próximo slide" })).toBeNull();
  });

  it("um cômodo não mostra setas", () => {
    render(<PropertyGallery comodos={[comodos[0]!]} tipo="casa" />);
    expect(screen.queryByRole("button", { name: "Próximo slide" })).toBeNull();
  });
});
