import { describe, expect, it } from "vitest";
import type { Imovel } from "@/domain";
import { celulaCsv, gerarCsvImoveis } from "./csv";

describe("CSV de imóveis (RF-49)", () => {
  it("escapa aspas, separador e fórmulas", () => {
    expect(celulaCsv('Casa "linda"; ampla')).toBe('"Casa ""linda""; ampla"');
    expect(celulaCsv("=SOMA(A1)")).toBe("'=SOMA(A1)");
    expect(celulaCsv(3)).toBe("3");
  });

  it("gera cabeçalho, BOM e uma linha por imóvel", () => {
    const imovel = {
      codigo: "AT-0001",
      titulo: "Apto; centro",
      tipo: "apartamento",
      finalidade: "venda",
      status: "disponivel",
      endereco: { bairro: "Moema", cidade: "São Paulo" },
      preco: 123456789,
      areaUtil: 72.5,
      quartos: 2,
      vagas: 1,
      corretorId: "cor_1",
    } as unknown as Imovel;
    const csv = gerarCsvImoveis([imovel], () => "Ana");
    const linhas = csv.trim().split("\r\n");
    expect(csv.startsWith("﻿Código;")).toBe(true);
    expect(linhas).toHaveLength(2);
    expect(linhas[1]).toBe(
      'AT-0001;"Apto; centro";Apartamento;Venda;Disponível;Moema;São Paulo;1234567,89;72,5;2;1;Ana',
    );
  });
});
