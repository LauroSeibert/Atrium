import { describe, expect, it } from "vitest";
import { corretor } from "../teste/fabrica";
import { recortePadrao, recorteResponsavel, vendedores } from "./operacoes";

describe("recortePadrao (RF-08)", () => {
  it("corretor vê só os dele; gestor e financeiro veem tudo", () => {
    expect(recortePadrao(corretor({ id: "c1", papel: "corretor" }))).toBe("c1");
    expect(recortePadrao(corretor({ papel: "gestor" }))).toBeUndefined();
    expect(recortePadrao(corretor({ papel: "financeiro" }))).toBeUndefined();
  });
});

describe("recorteResponsavel e vendedores", () => {
  it("a escolha explícita vence a persona; sem escolha vale o recorte padrão", () => {
    const c = corretor({ id: "c1", papel: "corretor" });
    const g = corretor({ id: "g1", papel: "gestor" });
    expect(recorteResponsavel(c, undefined)).toBe("c1");
    expect(recorteResponsavel(c, "todos")).toBeUndefined();
    expect(recorteResponsavel(g, undefined)).toBeUndefined();
    expect(recorteResponsavel(g, "meus")).toBe("g1");
  });

  it("vendedores só devolve corretores", () => {
    const lista = [corretor({ papel: "corretor" }), corretor({ papel: "gestor" }), corretor({ papel: "financeiro" })];
    expect(vendedores(lista)).toHaveLength(1);
  });
});
