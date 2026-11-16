import { describe, expect, it } from "vitest";
import { paginar } from "./paginacao";

describe("paginar", () => {
  const lista = Array.from({ length: 25 }, (_, i) => i);
  it("fatia a página pedida", () => {
    const p = paginar(lista, { pagina: 2, porPagina: 10 });
    expect(p.itens).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
    expect(p).toMatchObject({ total: 25, pagina: 2, totalPaginas: 3 });
  });
  it("limita a página ao intervalo válido e aceita lista vazia", () => {
    expect(paginar(lista, { pagina: 99, porPagina: 10 }).pagina).toBe(3);
    expect(paginar([], { pagina: 5, porPagina: 10 })).toMatchObject({ itens: [], pagina: 1, totalPaginas: 1 });
  });
});
