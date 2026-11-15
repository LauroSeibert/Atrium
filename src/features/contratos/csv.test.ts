import { describe, expect, it } from "vitest";
import { gerarCsv } from "./csv";
import type { LinhaContrato } from "./tipos";

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
    expect(cab).toMatch(/^\uFEFFNúmero;Tipo;/);
    expect(corpo).toBe(
      'CT-2026-0001;Venda;IMV-0001;"Ana; Souza / Bia";1234,56;10/01/2026;10/12/2026;Inadimplente;10/11/2026',
    );
    expect(resto).toBe("");
  });
});
