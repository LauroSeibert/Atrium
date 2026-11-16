import { describe, expect, it } from "vitest";
import { fakeApi, __reiniciarParaTeste } from "@/mocks/services/fakeApi";
import { gerarCsvDespesas, gerarCsvReceitas } from "./csv";

describe("CSV do Financeiro (RF-77, RF-78)", () => {
  it("gera cabeçalho e uma linha por item, com vírgula decimal", async () => {
    __reiniciarParaTeste({ agora: "2026-11-14T12:00:00.000Z" });
    const r = await fakeApi.listReceitas({}, { pagina: 1, porPagina: 5 });
    const csv = gerarCsvReceitas(r.itens);
    expect(csv).toContain("Contrato;Tipo;Imóvel");
    expect(csv.trim().split("\r\n")).toHaveLength(r.itens.length + 1);
    const d = await fakeApi.listDespesas({}, { pagina: 1, porPagina: 5 });
    expect(gerarCsvDespesas(d.itens).trim().split("\r\n")).toHaveLength(d.itens.length + 1);
  });
});
