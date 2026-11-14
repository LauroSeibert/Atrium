import { describe, it, expect } from "vitest";
import {
  formatMoeda,
  formatArea,
  formatNumero,
  formatPercentual,
  formatVariacao,
  formatData,
  formatDataHora,
  formatRelativo,
  formatTelefone,
  formatDocumentoMascarado,
} from "./format";

const N = " "; // NBSP
const MINUS = "−";

describe("formatMoeda", () => {
  it("formata valores típicos com NBSP", () => {
    expect(formatMoeda(123456)).toBe(`R$${N}1.234,56`);
    expect(formatMoeda(123456)).toContain(N);
    expect(formatMoeda(123456)).not.toContain(" ");
  });
  it("zero, 1 centavo e 99 centavos", () => {
    expect(formatMoeda(0)).toBe(`R$${N}0,00`);
    expect(formatMoeda(1)).toBe(`R$${N}0,01`);
    expect(formatMoeda(99)).toBe(`R$${N}0,99`);
  });
  it("negativos", () => {
    expect(formatMoeda(-1000)).toBe(`-R$${N}10,00`);
  });
  it("semCentavos arredonda", () => {
    expect(formatMoeda(123456, { semCentavos: true })).toBe(`R$${N}1.235`);
    expect(formatMoeda(0, { semCentavos: true })).toBe(`R$${N}0`);
  });
  it("valores grandes", () => {
    expect(formatMoeda(1_200_000_00)).toBe(`R$${N}1.200.000,00`);
  });
  describe("compacto", () => {
    const c = (v: number) => formatMoeda(v, { compacto: true });
    it("abaixo de R$ 1.000 mantém formato normal", () => {
      expect(c(999_99)).toBe(`R$${N}999,99`);
      expect(c(0)).toBe(`R$${N}0,00`);
    });
    it("milhares", () => {
      expect(c(1000_00)).toBe(`R$${N}1${N}mil`);
      expect(c(1500_00)).toBe(`R$${N}1,5${N}mil`);
      expect(c(850_000_00)).toBe(`R$${N}850${N}mil`);
      expect(c(12_345_00)).toBe(`R$${N}12${N}mil`);
    });
    it("milhões", () => {
      expect(c(1_200_000_00)).toBe(`R$${N}1,2${N}mi`);
      expect(c(12_000_000_00)).toBe(`R$${N}12${N}mi`);
    });
    it("promove para mi quando mil arredonda para 1000", () => {
      expect(c(999_960_00)).toBe(`R$${N}1${N}mi`);
    });
    it("negativos", () => {
      expect(c(-850_000_00)).toBe(`-R$${N}850${N}mil`);
      expect(c(-1_200_000_00)).toBe(`-R$${N}1,2${N}mi`);
    });
  });
});

describe("formatArea", () => {
  it("inteiro, decimal e zero", () => {
    expect(formatArea(120)).toBe(`120${N}m²`);
    expect(formatArea(85.5)).toBe(`85,5${N}m²`);
    expect(formatArea(0)).toBe(`0${N}m²`);
  });
  it("máximo 1 casa decimal", () => {
    expect(formatArea(85.54)).toBe(`85,5${N}m²`);
    expect(formatArea(1234.5)).toBe(`1.234,5${N}m²`);
  });
});

describe("formatNumero", () => {
  it("milhar e casas", () => {
    expect(formatNumero(1234)).toBe("1.234");
    expect(formatNumero(0)).toBe("0");
    expect(formatNumero(-1234567)).toBe("-1.234.567");
    expect(formatNumero(1234.5, 2)).toBe("1.234,50");
    expect(formatNumero(1.005, 1)).toBe("1,0");
  });
});

describe("formatPercentual / formatVariacao", () => {
  it("percentual", () => {
    expect(formatPercentual(0.125)).toBe("12,5%");
    expect(formatPercentual(0)).toBe("0,0%");
    expect(formatPercentual(1)).toBe("100,0%");
    expect(formatPercentual(0.125, 0)).toBe("13%");
    expect(formatPercentual(0.12345, 2)).toBe("12,35%");
    expect(formatPercentual(-0.03)).toBe("-3,0%");
  });
  it("variação positiva, negativa e zero", () => {
    expect(formatVariacao(0.125)).toBe("+12,5%");
    expect(formatVariacao(-0.03)).toBe(`${MINUS}3,0%`);
    expect(formatVariacao(0)).toBe("0,0%");
  });
  it("variação que arredonda para zero não mostra sinal", () => {
    expect(formatVariacao(0.0004)).toBe("0,0%");
    expect(formatVariacao(-0.0004)).toBe("0,0%");
  });
  it("usa o sinal de menos real U+2212", () => {
    expect(formatVariacao(-0.5).charCodeAt(0)).toBe(0x2212);
  });
});

describe("formatData", () => {
  const d = new Date(2026, 10, 14, 12);
  it("estilos com Date", () => {
    expect(formatData(d)).toBe("14/11/2026");
    expect(formatData(d, "curta")).toBe("14/11/2026");
    expect(formatData(d, "longa")).toBe("14 de novembro de 2026");
    expect(formatData(d, "mesAno")).toBe("novembro de 2026");
  });
  it("string só com data é tratada como data local (sem shift)", () => {
    expect(formatData("2026-11-14")).toBe("14/11/2026");
    expect(formatData("2026-01-01")).toBe("01/01/2026");
    expect(formatData("2026-12-31", "longa")).toBe("31 de dezembro de 2026");
  });
  it("string ISO com horário usa o fuso de São Paulo", () => {
    expect(formatData("2026-11-14T02:00:00Z")).toBe("13/11/2026");
    expect(formatData("2026-11-14T12:00:00Z")).toBe("14/11/2026");
  });
  it("inválida", () => {
    expect(formatData("lixo")).toBe("—");
  });
});

describe("formatDataHora", () => {
  it("formata em São Paulo", () => {
    const s = formatDataHora("2026-11-14T12:30:00Z");
    expect(s).toMatch(/^14\/11\/2026,? 09:30$/);
  });
  it("meia-noite em 24 h", () => {
    expect(formatDataHora("2026-11-14T03:00:00Z")).toMatch(/^14\/11\/2026,? 00:00$/);
  });
  it("inválida", () => {
    expect(formatDataHora("x")).toBe("—");
  });
});

describe("formatRelativo", () => {
  // 14/11/2026 12:00 em São Paulo (UTC-3)
  const agora = new Date("2026-11-14T15:00:00Z");
  const delta = (ms: number) => new Date(agora.getTime() + ms);
  const S = 1000;
  const MIN = 60 * S;
  const H = 60 * MIN;
  const D = 24 * H;

  it("agora", () => {
    expect(formatRelativo(agora, agora)).toBe("agora");
    expect(formatRelativo(delta(-59 * S), agora)).toBe("agora");
    expect(formatRelativo(delta(59 * S), agora)).toBe("agora");
  });
  it("minutos", () => {
    expect(formatRelativo(delta(-60 * S), agora)).toBe("há 1 min");
    expect(formatRelativo(delta(-5 * MIN), agora)).toBe("há 5 min");
    expect(formatRelativo(delta(-59 * MIN), agora)).toBe("há 59 min");
    expect(formatRelativo(delta(5 * MIN), agora)).toBe("em 5 min");
  });
  it("horas", () => {
    expect(formatRelativo(delta(-60 * MIN), agora)).toBe("há 1 h");
    expect(formatRelativo(delta(-2 * H), agora)).toBe("há 2 h");
    expect(formatRelativo(delta(-23 * H), agora)).toBe("há 23 h");
    expect(formatRelativo(delta(3 * H), agora)).toBe("em 3 h");
  });
  it("ontem e amanhã", () => {
    expect(formatRelativo(delta(-24 * H), agora)).toBe("ontem");
    expect(formatRelativo(delta(24 * H), agora)).toBe("amanhã");
    expect(formatRelativo("2026-11-13", agora)).toBe("ontem");
  });
  it("dias", () => {
    expect(formatRelativo(delta(-3 * D), agora)).toBe("há 3 dias");
    expect(formatRelativo(delta(2 * D), agora)).toBe("em 2 dias");
    expect(formatRelativo(delta(-30 * D), agora)).toBe("há 30 dias");
    expect(formatRelativo(delta(30 * D), agora)).toBe("em 30 dias");
  });
  it("além de 30 dias cai para data", () => {
    expect(formatRelativo(delta(-31 * D), agora)).toBe("14/10/2026");
    expect(formatRelativo(delta(31 * D), agora)).toBe("15/12/2026");
  });
  it("inválida", () => {
    expect(formatRelativo("x", agora)).toBe("—");
  });
});

describe("formatTelefone", () => {
  it("celular e fixo", () => {
    expect(formatTelefone("11912345678")).toBe("(11) 91234-5678");
    expect(formatTelefone("1131234567")).toBe("(11) 3123-4567");
  });
  it("remove não-dígitos", () => {
    expect(formatTelefone("(11) 91234-5678")).toBe("(11) 91234-5678");
  });
  it("com código do país", () => {
    expect(formatTelefone("5511912345678")).toBe("+55 (11) 91234-5678");
    expect(formatTelefone("+55 11 3123-4567")).toBe("+55 (11) 3123-4567");
  });
  it("inválido devolve a entrada", () => {
    expect(formatTelefone("123")).toBe("123");
    expect(formatTelefone("")).toBe("");
    expect(formatTelefone("abc")).toBe("abc");
    expect(formatTelefone("4411912345678")).toBe("4411912345678");
  });
});

describe("formatDocumentoMascarado", () => {
  it("CPF", () => {
    expect(formatDocumentoMascarado("12345678909")).toBe("***.456.789-**");
    expect(formatDocumentoMascarado("123.456.789-09")).toBe("***.456.789-**");
  });
  it("CNPJ", () => {
    expect(formatDocumentoMascarado("12345678000190")).toBe("**.345.678/0001-**");
    expect(formatDocumentoMascarado("12.345.678/0001-90")).toBe("**.345.678/0001-**");
  });
  it("outros formatos ficam inalterados", () => {
    expect(formatDocumentoMascarado("123")).toBe("123");
    expect(formatDocumentoMascarado("")).toBe("");
  });
});
