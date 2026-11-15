import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { NovoLead } from "@/domain";
import { BASE_HISTORIAS } from "@/mocks/data/historias";
import { LeadForm } from "./LeadForm";

const corretores = BASE_HISTORIAS.corretores.map((c) => ({ id: c.id, nome: c.nome }));
const base: NovoLead = { nome: "", contato: {}, origem: "site", responsavelId: corretores[0]!.id, orcamento: null };

function montar(props: Partial<React.ComponentProps<typeof LeadForm>> = {}) {
  const onSalvar = vi.fn();
  render(<LeadForm corretores={corretores} onSalvar={onSalvar} envio={{ fase: "idle" }} {...props} />);
  return { onSalvar, user: userEvent.setup() };
}

describe("LeadForm (RF-35)", () => {
  it("submeter vazio mostra erros em pt-BR e foca o nome", async () => {
    const { onSalvar, user } = montar();
    await user.click(screen.getByRole("button", { name: "Salvar lead" }));
    expect(onSalvar).not.toHaveBeenCalled();
    const nome = screen.getByRole("textbox", { name: /^Nome/ });
    expect(nome).toHaveFocus();
    expect(nome).toHaveAccessibleDescription("Use pelo menos 2 caracteres");
    expect(screen.getByRole("region", { name: /Corrija \d+ campos para salvar/ })).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Invalid|expected|Too small|Required/);
  });

  it("telefone usa máscara e envia só dígitos; e-mail vazio vira ausente", async () => {
    const { onSalvar, user } = montar({ valoresIniciais: base });
    await user.type(screen.getByRole("textbox", { name: /^Nome/ }), "Marina Souza");
    const tel = screen.getByRole("textbox", { name: /^Telefone/ });
    await user.type(tel, "11912345678");
    expect(tel).toHaveValue("(11) 91234-5678");
    await user.click(screen.getByRole("button", { name: "Salvar lead" }));
    expect(onSalvar).toHaveBeenCalledTimes(1);
    const dados = onSalvar.mock.calls[0]![0] as NovoLead;
    expect(dados.nome).toBe("Marina Souza");
    expect(dados.contato).toEqual({ telefone: "11912345678", email: undefined });
    expect(dados.interesse).toBeUndefined();
  });

  it("telefone incompleto e e-mail inválido mostram mensagens em pt-BR", async () => {
    const { user } = montar({ valoresIniciais: { ...base, nome: "Ana" } });
    await user.type(screen.getByRole("textbox", { name: /^Telefone/ }), "1191");
    await user.type(screen.getByRole("textbox", { name: /^E-mail/ }), "ana@");
    await user.click(screen.getByRole("button", { name: "Salvar lead" }));
    expect(screen.getByText("Telefone com DDD, 10 ou 11 dígitos", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByText("Informe um e-mail válido", { selector: "span" })).toBeInTheDocument();
  });

  it("Mais detalhes recolhe e expande", async () => {
    const { user } = montar({ valoresIniciais: base });
    const botao = screen.getByRole("button", { name: "Mais detalhes" });
    expect(botao).toHaveAttribute("aria-expanded", "false");
    await user.click(botao);
    expect(botao).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("textbox", { name: /^Orçamento/ })).toBeVisible();
  });

  it("orçamento em reais vira centavos e bairros viram chips", async () => {
    const { onSalvar, user } = montar({ valoresIniciais: { ...base, nome: "Carlos" } });
    await user.click(screen.getByRole("button", { name: "Mais detalhes" }));
    await user.type(screen.getByRole("textbox", { name: /^Orçamento/ }), "850000");
    await user.click(screen.getByRole("button", { name: "Salvar lead" }));
    expect((onSalvar.mock.calls[0]![0] as NovoLead).orcamento).toBe(85000000);
  });

  it("salvando desabilita o botão; erro do servidor em alerta", () => {
    const { unmount } = render(<LeadForm corretores={corretores} onSalvar={vi.fn()} envio={{ fase: "salvando" }} />);
    expect(screen.getByRole("button", { name: "Salvar lead" })).toBeDisabled();
    unmount();
    render(<LeadForm corretores={corretores} onSalvar={vi.fn()} envio={{ fase: "erro", mensagem: "Sem conexão" }} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Sem conexão");
  });
});
