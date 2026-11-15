import { describe, expect, it } from "vitest";
import { celulaCsv, montarCsv } from "./csv";

describe("csv (RF-47)", () => {
  it("escapa separador, aspas e fórmulas", () => {
    expect(celulaCsv('a;"b"')).toBe('"a;""b"""');
    expect(celulaCsv("=SOMA(1)")).toBe("'=SOMA(1)");
    expect(celulaCsv(12)).toBe("12");
  });
  it("monta com BOM e CRLF", () => {
    expect(montarCsv(["A", "B"], [[1, "x"]])).toBe("﻿A;B\r\n1;x\r\n");
  });
});
