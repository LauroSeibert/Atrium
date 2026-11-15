import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { formatMoeda } from "@/lib/format";
import { resumoTendencia, StatCard, type DadosStat, StatCardSkeleton, variacaoKpi, variacaoPontos } from "./StatCard";

const ok = (k: DadosStat) => ({ fase: "success" as const, dados: k });

describe("variacaoPontos", () => {
  it("diferença em pontos percentuais, não relativa", () => {
    expect(variacaoPontos(0.05, 0.04).tipo).toBe("alta");
    expect(variacaoPontos(0.04, 0.05).tipo).toBe("queda");
    expect(variacaoPontos(0.04, 0.04)).toEqual({ tipo: "igual" });
    expect(variacaoPontos(0.0401, 0.04)).toEqual({ tipo: "igual" });
  });
});

describe("variacaoKpi", () => {
  it("calcula alta, queda e igual", () => {
    expect(variacaoKpi(125, 100)).toEqual({ tipo: "alta", fracao: 0.25 });
    expect(variacaoKpi(50, 100)).toEqual({ tipo: "queda", fracao: 0.5 });
    expect(variacaoKpi(7, 7)).toEqual({ tipo: "igual" });
  });
  it("anterior 0 não divide por zero", () => {
    expect(variacaoKpi(5, 0)).toEqual({ tipo: "nova", subiu: true });
    expect(variacaoKpi(0, 0)).toEqual({ tipo: "igual" });
  });
});

describe("StatCard (RF-10, RF-44)", () => {
  it("mostra rótulo, valor formatado e variação em texto", () => {
    render(
      <StatCard
        rotulo="Receita do mês"
        formato="moeda"
        estado={ok({ valor: 112500, anterior: 100000, tendencia: [1, 2, 3] })}
      />,
    );
    const grupo = screen.getByRole("group", { name: "Receita do mês" });
    expect(grupo.textContent).toContain(formatMoeda(112500, { compacto: true }));
    expect(screen.getByText(/Alta de 12,5% vs\. mês anterior/)).toBeInTheDocument();
  });

  it("sentido menorMelhor pinta a alta de erro; maiorMelhor de sucesso", () => {
    const k = { valor: 10, anterior: 5, tendencia: [5, 10] };
    const { rerender } = render(<StatCard rotulo="Inadimplência" sentido="menorMelhor" estado={ok(k)} />);
    expect(
      screen
        .getByText(/Alta de 100,0%/)
        .closest("p")
        ?.querySelector(".text-danger"),
    ).not.toBeNull();
    rerender(<StatCard rotulo="Inadimplência" estado={ok(k)} />);
    expect(
      screen
        .getByText(/Alta de 100,0%/)
        .closest("p")
        ?.querySelector(".text-success"),
    ).not.toBeNull();
  });

  it("zero vira 'sem variação' e anterior 0 não mostra percentual", () => {
    const { rerender } = render(
      <StatCard rotulo="Visitas" estado={ok({ valor: 4, anterior: 4, tendencia: [1, 4] })} />,
    );
    expect(screen.getByText(/Sem variação vs\. mês anterior/)).toBeInTheDocument();
    rerender(<StatCard rotulo="Visitas" estado={ok({ valor: 4, anterior: 0, tendencia: [0, 4] })} />);
    expect(screen.queryByText(/Infinity|NaN/)).not.toBeInTheDocument();
    expect(screen.getByText(/sem valor no período anterior/)).toBeInTheDocument();
  });

  it("mostra 'sem dados' quando tudo é zero", () => {
    render(<StatCard rotulo="Leads" estado={ok({ valor: 0, anterior: 0, tendencia: [0, 0, 0] })} />);
    expect(screen.getByText("Sem dados no período")).toBeInTheDocument();
  });

  it("tendência é decorativa e tem resumo em texto", () => {
    const { container } = render(
      <StatCard rotulo="Leads" estado={ok({ valor: 3, anterior: 1, tendencia: [1, 2, 3] })} />,
    );
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText(/Tendência dos últimos 3 períodos: em alta, de 1 a 3/)).toBeInTheDocument();
    expect(resumoTendencia([0, 0, 0], String)).toMatch(/estável em 0/);
  });

  it("carregando mostra o skeleton", () => {
    render(<StatCard rotulo="Leads" estado={{ fase: "loading" }} />);
    expect(screen.getByText("Carregando indicador")).toBeInTheDocument();
  });

  it("erro oferece tentar de novo", async () => {
    const onTentarNovamente = vi.fn();
    render(
      <StatCard
        rotulo="Leads"
        estado={{ fase: "error", erro: new Error("x") }}
        onTentarNovamente={onTentarNovamente}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /tentar de novo/i }));
    expect(onTentarNovamente).toHaveBeenCalledOnce();
  });

  it("variação de 900% e valor gigante não quebram", () => {
    render(
      <StatCard rotulo="Leads" formato="numero" estado={ok({ valor: 1000, anterior: 100, tendencia: [100, 1000] })} />,
    );
    expect(screen.getByText(/Alta de 900,0%/)).toBeInTheDocument();
  });

  it("sem anterior não mostra variação nem tendência; tom alerta pinta o valor", () => {
    const { container } = render(
      <StatCard rotulo="Atrasado" formato="moedaCompleta" estado={ok({ valor: 12345, tom: "alerta" })} />,
    );
    const grupo = screen.getByRole("group", { name: "Atrasado" });
    expect(grupo.textContent).toContain(formatMoeda(12345));
    expect(screen.queryByText(/vs\. mês anterior|Sem dados no período/)).not.toBeInTheDocument();
    expect(container.querySelector("svg")).toBeNull();
    expect(grupo.querySelector("p.text-danger")).not.toBeNull();
  });

  it("exporta o skeleton", () => {
    render(<StatCardSkeleton />);
    expect(screen.getByText("Carregando indicador")).toBeInTheDocument();
  });

  it("formato percentual mostra a variação em pontos percentuais", () => {
    render(
      <StatCard
        rotulo="Inadimplência"
        formato="percentual"
        sentido="menorMelhor"
        estado={ok({ valor: 0.05, anterior: 0.04, tendencia: [0.04, 0.05] })}
      />,
    );
    expect(screen.getByText(/Alta de 1,0 p\.p\. vs\. mês anterior/)).toBeInTheDocument();
    expect(
      screen
        .getByText(/Alta de 1,0 p\.p\./)
        .closest("p")
        ?.querySelector(".text-danger"),
    ).not.toBeNull();
  });
});
