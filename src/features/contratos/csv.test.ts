import { describe, expect, it } from "vitest";
import { celulaCsv, gerarCsv } from "./csv";
import { indicadoresDasParcelas } from "./parcelas";
import type { LinhaContrato } from "./tipos";

describe("celulaCsv", () => {
  it("escapa separador, aspas e quebra de linha", () => {
    expect(celulaCsv("a;b")).toBe('"a;b"');
    expect(celulaCsv('diz "oi"')).toBe('"diz ""oi"""');
    expect(celulaCsv("simples")).toBe("simples");
  });
  it("neutraliza fórmulas", () => {
    expect(celulaCsv("=SOMA(A1)")).toBe("'=SOMA(A1)");
  });
});

describe("gerarCsv (RF-47)", () => {
  it("gera cabeçalho e uma linha por contrato, valor com vírgula decimal", () => {
    const linha = {
      contrato: {
        numero: "CT-2026-0001",
        tipo: "venda",
        partes: [{ nome: "Ana; Souza" }, { nome: "Bia" }],
        valor: 123456,
        inicio: "2026-01-10",
        fim: "2026-12-10",
      },
      imovel: { codigo: "IMV-0001" },
      statusExibicao: "inadimplente",
      proximoVencimento: { vencimento: "2026-11-10" },
    } as unknown as LinhaContrato;
    const [cab, corpo, resto] = gerarCsv([linha]).split("\r\n");
    expect(cab).toMatch(/^Número;Tipo;/);
    expect(corpo).toBe(
      'CT-2026-0001;Venda;IMV-0001;"Ana; Souza / Bia";1234,56;10/01/2026;10/12/2026;Inadimplente;10/11/2026',
    );
    expect(resto).toBeUndefined();
  });
});

describe("indicadoresDasParcelas (RF-42)", () => {
  it("soma por status derivado", () => {
    const p = (numero: number, valor: number, status: "pago" | "atrasado" | "aVencer" | "cancelada") => ({
      numero,
      valor,
      vencimento: "2026-01-01",
      pagoEm: null,
      status,
    });
    const r = indicadoresDasParcelas([
      p(1, 100, "pago"),
      p(2, 50, "atrasado"),
      p(3, 70, "aVencer"),
      p(4, 9, "cancelada"),
    ]);
    expect(r).toMatchObject({
      total: 4,
      pagas: 1,
      recebido: 100,
      atrasadas: 1,
      emAtraso: 50,
      aReceber: 70,
      qtdAReceber: 1,
    });
  });
});
