import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { BASE_HISTORIAS } from "@/mocks/data/historias";
import { FeatureChips } from "./FeatureChips";
import { SpecList } from "./SpecList";

const apto = BASE_HISTORIAS.imoveis.find((i) => i.tipo === "apartamento")!;

describe("SpecList", () => {
  it("mostra os rótulos da ficha em <dl>", () => {
    render(<SpecList imovel={{ ...apto, condominio: 85_000, iptu: null }} />);
    for (const r of ["Área útil", "Área total", "Quartos", "Suítes", "Banheiros", "Vagas", "Condomínio", "IPTU"])
      expect(screen.getByText(r).tagName).toBe("DT");
    expect(screen.getByText("Condomínio").nextElementSibling).toHaveTextContent("R$");
    expect(screen.getByText("IPTU").nextElementSibling).toHaveTextContent("—");
    expect(screen.getByText("IPTU").nextElementSibling).toHaveTextContent("não informado");
  });

  it("zero é valor, não ausência", () => {
    render(<SpecList imovel={{ ...apto, vagas: 0 }} />);
    expect(screen.getByText("Vagas").nextElementSibling).toHaveTextContent("0");
  });
});

describe("FeatureChips", () => {
  const itens = ["Piscina", "Churrasqueira", "Sauna", "Academia", "Pet place"];

  it("mostra todos abaixo do limite, sem botão", () => {
    render(<FeatureChips diferenciais={itens} limite={6} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("acima do limite mostra +N e expande/recolhe", async () => {
    render(<FeatureChips diferenciais={itens} limite={2} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    const b = screen.getByRole("button", { name: "Mostrar mais 3 diferenciais" });
    expect(b).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(b);
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    await userEvent.click(screen.getByRole("button", { name: "Mostrar menos" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("vazio mostra mensagem", () => {
    render(<FeatureChips diferenciais={[]} />);
    expect(screen.getByText("Nenhum diferencial cadastrado.")).toBeInTheDocument();
  });
});
