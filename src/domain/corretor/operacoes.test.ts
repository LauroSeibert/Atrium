import { describe, expect, it } from "vitest";
import { corretor } from "../teste/fabrica";
import { recortePadrao } from "./operacoes";

describe("recortePadrao (RF-08)", () => {
  it("corretor vê só os dele; gestor e financeiro veem tudo", () => {
    expect(recortePadrao(corretor({ id: "c1", papel: "corretor" }))).toBe("c1");
    expect(recortePadrao(corretor({ papel: "gestor" }))).toBeUndefined();
    expect(recortePadrao(corretor({ papel: "financeiro" }))).toBeUndefined();
  });
});
