import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { dadosImovelSchema, type DadosImovel } from "@/domain";
import { BASE_HISTORIAS } from "@/mocks/data/historias";
import { PropertyForm } from "./PropertyForm";

const corretores = BASE_HISTORIAS.corretores.map((c) => ({ id: c.id, nome: c.nome }));
const inicial: DadosImovel = dadosImovelSchema.parse(BASE_HISTORIAS.imoveis[0]);

function montar(props: Partial<React.ComponentProps<typeof PropertyForm>> = {}) {
  const onSalvar = vi.fn();
  render(<PropertyForm corretores={corretores} onSalvar={onSalvar} envio={{ fase: "idle" }} {...props} />);
  return { onSalvar, user: userEvent.setup() };
}

describe("PropertyForm (RF-27)", () => {
  it("submeter vazio mostra erros em pt-BR, resumo com links e foca o primeiro campo inválido", async () => {
    const { onSalvar, user } = montar();
    await user.click(screen.getByRole("button", { name: "Salvar imóvel" }));

    expect(onSalvar).not.toHaveBeenCalled();
    const titulo = screen.getByRole("textbox", { name: /^Título/ });
    expect(titulo).toHaveFocus();
    expect(titulo).toHaveAttribute("aria-invalid", "true");
    expect(titulo).toHaveAccessibleDescription("Use pelo menos 3 caracteres");

    const resumo = screen.getByRole("region", { name: /Corrija \d+ campos para salvar/ });
    expect(within(resumo).getByRole("link", { name: "Título" })).toBeInTheDocument();
    expect(within(resumo).getByRole("link", { name: "Preço" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /^Corretor/ })).toHaveAccessibleDescription("Selecione o corretor");
    // Nenhuma mensagem padrão do zod em inglês.
    expect(document.body.textContent).not.toMatch(/Invalid|expected|Too small|Too big|Required/);
  });

  it("link do resumo leva o foco ao campo", async () => {
    const { user } = montar();
    await user.click(screen.getByRole("button", { name: "Salvar imóvel" }));
    await user.click(screen.getByRole("link", { name: "Preço" }));
    expect(screen.getByRole("textbox", { name: /^Preço/ })).toHaveFocus();
  });

  it("dados válidos chamam onSalvar com valores em centavos e CEP só com dígitos", async () => {
    const { onSalvar, user } = montar({ valoresIniciais: inicial });
    const preco = screen.getByRole("textbox", { name: /^Preço/ });
    await user.clear(preco);
    await user.type(preco, "1.250.000,50");
    const cep = screen.getByRole("textbox", { name: /^CEP/ });
    await user.clear(cep);
    await user.type(cep, "01310100");
    expect(cep).toHaveValue("01310-100");
    await user.click(screen.getByRole("button", { name: "Salvar imóvel" }));

    expect(onSalvar).toHaveBeenCalledTimes(1);
    const dados = onSalvar.mock.calls[0]![0] as DadosImovel;
    expect(dados.preco).toBe(125000050);
    expect(dados.endereco.cep).toBe("01310100");
    expect(dados.titulo).toBe(inicial.titulo);
    expect(dadosImovelSchema.safeParse(dados).success).toBe(true);
  });

  it("mostra o erro do schema (terreno com quartos) sem regra no componente", async () => {
    const terreno = { ...inicial, tipo: "terreno" as const, comodos: [], condominio: null };
    const { onSalvar, user } = montar({ valoresIniciais: terreno });
    await user.click(screen.getByRole("button", { name: "Salvar imóvel" }));
    expect(onSalvar).not.toHaveBeenCalled();
    expect(screen.getByText("Terreno não tem quartos, banheiros nem vagas", { selector: "span" })).toBeInTheDocument();
  });

  it("regra cruzada do schema (sem cômodos) aparece no campo de cômodos e recebe o foco", async () => {
    const { onSalvar, user } = montar({ valoresIniciais: { ...inicial, comodos: [] } });
    await user.click(screen.getByRole("button", { name: "Salvar imóvel" }));
    expect(onSalvar).not.toHaveBeenCalled();
    const adicionar = screen.getByRole("combobox", { name: /^Adicionar cômodo/ });
    expect(adicionar).toHaveAccessibleDescription("Informe ao menos um cômodo");
    expect(adicionar).toHaveFocus();
  });

  it("adiciona e remove cômodo e diferencial", async () => {
    const { user } = montar({ valoresIniciais: inicial });
    const total = screen.getAllByRole("button", { name: /^Remover cômodo/ }).length;
    expect(total).toBeGreaterThan(0);
    await user.click(screen.getAllByRole("button", { name: /^Remover cômodo 1/ })[0]!);
    expect(screen.queryAllByRole("button", { name: /^Remover cômodo/ })).toHaveLength(total - 1);
    const campo = screen.getByRole("textbox", { name: "Diferenciais" });
    await user.type(campo, "Piscina{Enter}");
    expect(screen.getByText("Piscina")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remover Piscina" }));
    expect(screen.queryByText("Piscina")).not.toBeInTheDocument();
  });

  it("salvando desabilita o botão e anuncia em status", () => {
    montar({ envio: { fase: "salvando" } });
    expect(screen.getByRole("button", { name: "Salvar imóvel" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Salvando");
  });

  it("erro do servidor aparece em alerta; salvo é anunciado em status", () => {
    const { rerender } = render(
      <PropertyForm corretores={corretores} onSalvar={vi.fn()} envio={{ fase: "erro", mensagem: "Falha de rede" }} />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Falha de rede");
    rerender(<PropertyForm corretores={corretores} onSalvar={vi.fn()} envio={{ fase: "salvo" }} />);
    expect(screen.getByRole("status")).toHaveTextContent("Salvo");
  });

  it("Cancelar chama onCancelar", async () => {
    const onCancelar = vi.fn();
    const { user } = montar({ onCancelar });
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancelar).toHaveBeenCalled();
  });
});
