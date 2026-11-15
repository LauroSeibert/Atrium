import { describe, expect, it } from "vitest";
import { contrato, contratoLocacao } from "../teste/fabrica";
import type { Contrato, Parcela } from "./schema";
import {
  diasDeAtraso,
  estaInadimplente,
  parcelasAtrasadas,
  proximoVencimento,
  repasse,
  resumoCronograma,
  statusExibicao,
  statusParcela,
} from "./derivados";

const parcela = (numero: number, vencimento: string, pagoEm: string | null = null, valor = 100_000): Parcela => ({
  numero,
  vencimento,
  valor,
  pagoEm,
});
const PAGO = "2026-10-01T12:00:00.000Z";
const comParcelas = (ps: Parcela[], over: Partial<Contrato> = {}) =>
  contrato({ status: "ativo", parcelas: ps, ...over });

describe("statusParcela (§3.4)", () => {
  const c = comParcelas([]);

  it("pago tem prioridade (inclusive em contrato cancelado)", () => {
    expect(statusParcela(c, parcela(1, "2026-01-01", PAGO), "2026-11-14")).toBe("pago");
    const canc = contrato({ status: "cancelado", motivoCancelamento: "x" });
    expect(statusParcela(canc, parcela(1, "2026-01-01", PAGO), "2026-11-14")).toBe("pago");
  });

  it("cancelada: parcela em aberto de contrato cancelado", () => {
    const canc = contrato({ status: "cancelado", motivoCancelamento: "x" });
    expect(statusParcela(canc, parcela(1, "2026-01-01"), "2026-11-14")).toBe("cancelada");
    expect(statusParcela(canc, parcela(1, "2027-01-01"), "2026-11-14")).toBe("cancelada");
  });

  it("limite do dia de vencimento: no dia ainda aVencer; no dia seguinte atrasado", () => {
    const p = parcela(1, "2026-11-14");
    expect(statusParcela(c, p, "2026-11-13")).toBe("aVencer");
    expect(statusParcela(c, p, "2026-11-14")).toBe("aVencer");
    expect(statusParcela(c, p, "2026-11-15")).toBe("atrasado");
  });

  it("usa a data local de São Paulo ao receber ISO com hora", () => {
    const p = parcela(1, "2026-11-14");
    // 02:00Z de 15/11 = 23:00 de 14/11 em SP → ainda no dia do vencimento
    expect(statusParcela(c, p, "2026-11-15T02:00:00.000Z")).toBe("aVencer");
    // 03:00Z de 15/11 = 00:00 de 15/11 em SP → atrasado
    expect(statusParcela(c, p, "2026-11-15T03:00:00.000Z")).toBe("atrasado");
  });
});

describe("diasDeAtraso", () => {
  it("0 para paga, em dia e no dia do vencimento; N dias depois", () => {
    expect(diasDeAtraso(parcela(1, "2026-01-01", PAGO), "2026-11-14")).toBe(0);
    expect(diasDeAtraso(parcela(1, "2026-11-20"), "2026-11-14")).toBe(0);
    expect(diasDeAtraso(parcela(1, "2026-11-14"), "2026-11-14")).toBe(0);
    expect(diasDeAtraso(parcela(1, "2026-11-09"), "2026-11-14")).toBe(5);
  });

  it("atravessa meses e aceita ISO com hora", () => {
    expect(diasDeAtraso(parcela(1, "2026-10-30"), "2026-11-14T15:00:00.000Z")).toBe(15);
  });
});

describe("estaInadimplente e statusExibicao (invariante 5, RF-41)", () => {
  const atrasada = comParcelas([parcela(1, "2026-10-01"), parcela(2, "2026-12-01")]);

  it("ativo com parcela atrasada é inadimplente", () => {
    expect(parcelasAtrasadas(atrasada, "2026-11-14").map((p) => p.numero)).toEqual([1]);
    expect(estaInadimplente(atrasada, "2026-11-14")).toBe(true);
    expect(statusExibicao(atrasada, "2026-11-14")).toBe("inadimplente");
  });

  it("ativo em dia (ou com a atrasada paga) não é inadimplente", () => {
    expect(estaInadimplente(atrasada, "2026-10-01")).toBe(false);
    expect(statusExibicao(atrasada, "2026-10-01")).toBe("ativo");
    const quitada = comParcelas([parcela(1, "2026-10-01", PAGO)]);
    expect(estaInadimplente(quitada, "2026-11-14")).toBe(false);
  });

  it.each(["rascunho", "encerrado", "cancelado"] as const)("%s nunca é inadimplente", (status) => {
    const c = { ...atrasada, status, motivoCancelamento: status === "cancelado" ? "x" : null } as Contrato;
    expect(estaInadimplente(c, "2026-11-14")).toBe(false);
    expect(statusExibicao(c, "2026-11-14")).toBe(status);
  });
});

describe("proximoVencimento (RF-40)", () => {
  it("primeira parcela em aberto de contrato ativo", () => {
    const c = comParcelas([parcela(1, "2026-09-01", PAGO), parcela(2, "2026-10-01"), parcela(3, "2026-11-01")]);
    expect(proximoVencimento(c)?.numero).toBe(2);
  });

  it("null se todas pagas, sem parcelas ou contrato não ativo", () => {
    expect(proximoVencimento(comParcelas([parcela(1, "2026-09-01", PAGO)]))).toBeNull();
    expect(proximoVencimento(comParcelas([]))).toBeNull();
    expect(proximoVencimento(contrato({ status: "rascunho", parcelas: [parcela(1, "2026-09-01")] }))).toBeNull();
    expect(proximoVencimento(contrato({ status: "encerrado", parcelas: [parcela(1, "2026-09-01")] }))).toBeNull();
  });
});

describe("repasse (RF-46)", () => {
  it("locação: parcela menos a taxa de administração", () => {
    const c = contratoLocacao({ taxaAdministracao: 10 });
    expect(repasse(c, parcela(1, "2026-01-01", null, 300_000))).toBe(270_000);
  });

  it("arredonda a taxa em centavos", () => {
    const c = contratoLocacao({ taxaAdministracao: 10 });
    expect(repasse(c, parcela(1, "2026-01-01", null, 333))).toBe(333 - 33);
  });

  it("venda e taxa nula repassam 0", () => {
    expect(repasse(contrato(), parcela(1, "2026-01-01"))).toBe(0);
    expect(repasse(contratoLocacao({ taxaAdministracao: null }), parcela(1, "2026-01-01"))).toBe(0);
  });
});

describe("resumoCronograma (RF-42)", () => {
  it("conta pagas, recebido e em atraso", () => {
    const c = comParcelas([
      parcela(1, "2026-09-01", PAGO, 100_000),
      parcela(2, "2026-10-01", null, 200_000),
      parcela(3, "2026-12-01", null, 300_000),
    ]);
    expect(resumoCronograma(c, "2026-11-14")).toEqual({
      total: 3,
      pagas: 1,
      recebido: 100_000,
      atrasadas: 1,
      emAtraso: 200_000,
    });
  });
});
