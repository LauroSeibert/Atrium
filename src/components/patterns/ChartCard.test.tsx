import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Funil, MetricaMensal } from "@/domain";
import { calcularDashboard } from "@/domain";
import { AGORA_HISTORIAS, BASE_HISTORIAS } from "@/mocks/data/historias";
import { DistributionChartCard } from "./DistributionChart";
import { FunnelChartCard } from "./FunnelChart";
import { RevenueChartCard } from "./RevenueChart";

const dash = calcularDashboard(BASE_HISTORIAS, "mesAtual", AGORA_HISTORIAS);
const receita: MetricaMensal[] = dash.receita12m;
const funil: Funil = dash.funil;

describe("ChartCard via RevenueChartCard (RF-11, RNF-17)", () => {
  it("mostra resumo em texto e mantém a tabela para leitores de tela na visão de gráfico", () => {
    render(<RevenueChartCard estado={{ fase: "success", dados: receita }} />);
    expect(screen.getByText(/Receita de dezembro de 2025 a novembro de 2026/)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Receita de dezembro de 2025/ })).toBeInTheDocument();
    const tabela = screen.getByRole("table", { name: "Receita por mês, vendas e locações" });
    expect(within(tabela).getAllByRole("row")).toHaveLength(13);
    expect(screen.queryByRole("region", { name: "Receita por mês, vendas e locações" })).not.toBeInTheDocument();
  });

  it("alterna para a tabela visível e volta ao gráfico", async () => {
    render(<RevenueChartCard estado={{ fase: "success", dados: receita }} />);
    await userEvent.click(screen.getByRole("radio", { name: "Tabela" }));
    expect(screen.getByRole("region", { name: "Receita por mês, vendas e locações" })).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("radio", { name: "Gráfico" }));
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("carregando, vazio e erro", async () => {
    const onTentarNovamente = vi.fn();
    const { rerender } = render(<RevenueChartCard estado={{ fase: "loading" }} />);
    expect(screen.getByText("Carregando gráfico")).toBeInTheDocument();
    rerender(
      <RevenueChartCard
        estado={{ fase: "success", dados: receita.map((m) => ({ ...m, receitaVendas: 0, receitaLocacoes: 0 })) }}
      />,
    );
    expect(screen.getByText("Nenhuma receita no período")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Tabela" })).toBeDisabled();
    rerender(
      <RevenueChartCard estado={{ fase: "error", erro: new Error("x") }} onTentarNovamente={onTentarNovamente} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /tentar de novo/i }));
    expect(onTentarNovamente).toHaveBeenCalledOnce();
  });
});

describe("FunnelChartCard (RF-12)", () => {
  it("tabela traz quantidade, perdidos e conversão por etapa", () => {
    render(<FunnelChartCard estado={{ fase: "success", dados: funil }} />);
    const tabela = screen.getByRole("table", { name: "Leads por etapa do funil" });
    const proposta = within(tabela).getByRole("row", { name: /Proposta/ });
    const celulas = within(proposta)
      .getAllByRole("cell")
      .map((c) => c.textContent);
    expect(celulas).toEqual(["8", "6", "54,8%"]);
    expect(screen.getByText(/12 perdidos/)).toBeInTheDocument();
  });

  it("sem leads mostra vazio", () => {
    render(
      <FunnelChartCard
        estado={{ fase: "success", dados: funil.map((l) => ({ ...l, quantidade: 0, perdidos: 0, conversao: null })) }}
      />,
    );
    expect(screen.getByText("Nenhum lead no funil")).toBeInTheDocument();
  });
});

describe("DistributionChartCard", () => {
  const dados = [
    { rotulo: "Casa", valor: 3 },
    { rotulo: "Apartamento", valor: 1 },
  ];
  it("tabela e resumo com valor e percentual", () => {
    render(<DistributionChartCard estado={{ fase: "success", dados }} />);
    expect(screen.getByText(/4 imóveis no total\. Maior fatia: Casa, com 3 \(75,0%\)/)).toBeInTheDocument();
    const tabela = screen.getByRole("table", { name: "Distribuição por tipo" });
    expect(within(tabela).getByRole("row", { name: /Apartamento/ })).toHaveTextContent("25,0%");
  });
  it("tudo zero mostra vazio", () => {
    render(<DistributionChartCard estado={{ fase: "success", dados: dados.map((d) => ({ ...d, valor: 0 })) }} />);
    expect(screen.getByText("Nenhum imóvel cadastrado")).toBeInTheDocument();
  });
});
