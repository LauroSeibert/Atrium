import { describe, expect, it } from "vitest";
import { transacao, camposMonitorados } from "./transacao";
import { OperacaoInvalida } from "./tipos";
import { baseMinima, CTX, CTX_DEPOIS, imovel } from "../teste/fabrica";

describe("transacao: registro de alteração por diferença (ESTADOS §4)", () => {
  it("campo monitorado gera registro de→para com autor e em", () => {
    const base = baseMinima();
    const { base: nova } = transacao(base, CTX, (t) => t.put("imoveis", { ...t.get("imoveis", "imv_a"), preco: 1 }));
    expect(nova.alteracoes).toHaveLength(1);
    expect(nova.alteracoes[0]).toMatchObject({
      campo: "preco",
      de: 30_000_000,
      para: 1,
      autorId: CTX.autorId,
      em: CTX.agora,
      entidade: { tipo: "imovel", id: "imv_a" },
    });
  });

  it("campo não monitorado não gera registro", () => {
    const { base: nova } = transacao(baseMinima(), CTX, (t) =>
      t.put("imoveis", { ...t.get("imoveis", "imv_a"), titulo: "Novo título" }),
    );
    expect(nova.alteracoes).toEqual([]);
  });

  it("criação não gera registro", () => {
    const { base: nova } = transacao(baseMinima(), CTX, (t) =>
      t.put("imoveis", imovel({ id: "imv_novo", codigo: "AT-0002" })),
    );
    expect(nova.imoveis).toHaveLength(2);
    expect(nova.alteracoes).toEqual([]);
  });

  it("registros dependem só da diferença: voltar ao valor original no mesmo bloco não registra", () => {
    const { base: nova } = transacao(baseMinima(), CTX, (t) => {
      const i = t.get("imoveis", "imv_a");
      t.put("imoveis", { ...i, preco: 5 });
      t.put("imoveis", { ...t.get("imoveis", "imv_a"), preco: i.preco });
    });
    expect(nova.alteracoes).toEqual([]);
  });

  it("put carimba atualizadoEm; não muta a base original", () => {
    const base = baseMinima();
    const { base: nova } = transacao(base, CTX, (t) =>
      t.put("imoveis", { ...t.get("imoveis", "imv_a"), favorito: true }),
    );
    expect(nova.imoveis[0]!.atualizadoEm).toBe(CTX.agora);
    expect(base.imoveis[0]!.atualizadoEm).not.toBe(CTX.agora);
    expect(base.imoveis[0]!.favorito).toBe(false);
  });

  it("get lança OperacaoInvalida para id inexistente; find devolve undefined", () => {
    transacao(baseMinima(), CTX, (t) => {
      expect(() => t.get("imoveis", "imv_x")).toThrow(OperacaoInvalida);
      expect(t.find("imoveis", "imv_x")).toBeUndefined();
    });
  });

  it("camposMonitorados: corretores/visitas não são monitorados", () => {
    expect(camposMonitorados("corretores", {})).toBeNull();
    expect(camposMonitorados("visitas", {})).toBeNull();
  });
});

describe("transacao: desfazer (RF-04)", () => {
  it("restaura exatamente o snapshot, inclusive atualizadoEm", () => {
    const base = baseMinima();
    const m = transacao(base, CTX, (t) => {
      t.put("imoveis", { ...t.get("imoveis", "imv_a"), preco: 7 });
      t.atividade({ tipo: "precoAlterado", alvo: { tipo: "imovel", id: "imv_a" } });
    });
    const d = m.desfazer(m.base, CTX_DEPOIS);
    expect(d.base.imoveis).toEqual(base.imoveis);
    expect(d.base.imoveis[0]!.atualizadoEm).toBe(base.imoveis[0]!.atualizadoEm);
  });

  it("remove as atividades geradas e gera registros inversos", () => {
    const m = transacao(baseMinima(), CTX, (t) => {
      t.put("imoveis", { ...t.get("imoveis", "imv_a"), preco: 7 });
      t.atividade({ tipo: "precoAlterado", alvo: { tipo: "imovel", id: "imv_a" } });
    });
    expect(m.base.atividades).toHaveLength(1);
    const d = m.desfazer(m.base, CTX_DEPOIS);
    expect(d.base.atividades).toEqual([]);
    expect(d.base.alteracoes).toHaveLength(2);
    expect(d.base.alteracoes[1]).toMatchObject({
      campo: "preco",
      de: 7,
      para: 30_000_000,
      autorId: CTX_DEPOIS.autorId,
      em: CTX_DEPOIS.agora,
    });
  });

  it("desfaz criação removendo a entidade", () => {
    const base = baseMinima();
    const m = transacao(base, CTX, (t) => t.put("imoveis", imovel({ id: "imv_novo", codigo: "AT-0002" })));
    const d = m.desfazer(m.base, CTX);
    expect(d.base.imoveis).toEqual(base.imoveis);
  });

  it("desfazer depois de outra alteração na mesma entidade lança OperacaoInvalida", () => {
    const m = transacao(baseMinima(), CTX, (t) => t.put("imoveis", { ...t.get("imoveis", "imv_a"), preco: 7 }));
    const outra = transacao(m.base, CTX_DEPOIS, (t) =>
      t.put("imoveis", { ...t.get("imoveis", "imv_a"), titulo: "Outro" }),
    );
    expect(() => m.desfazer(outra.base, CTX_DEPOIS)).toThrow(OperacaoInvalida);
  });

  it("alteração em outra entidade não impede desfazer", () => {
    const m = transacao(baseMinima(), CTX, (t) => t.put("imoveis", { ...t.get("imoveis", "imv_a"), preco: 7 }));
    const outra = transacao(m.base, CTX_DEPOIS, (t) => t.put("leads", { ...t.get("leads", "lead_a"), orcamento: 1 }));
    const d = m.desfazer(outra.base, CTX_DEPOIS);
    expect(d.base.imoveis[0]!.preco).toBe(30_000_000);
    expect(d.base.leads[0]!.orcamento).toBe(1);
  });
});

describe("transacao: IDs novos (seq)", () => {
  it("IDs não colidem entre transações encadeadas", () => {
    const ids: string[] = [];
    let base = baseMinima();
    for (let n = 0; n < 3; n++) {
      const m = transacao(base, CTX, (t) => {
        ids.push(t.novoId("atv"), t.novoId("atv"));
      });
      base = m.base;
    }
    expect(new Set(ids).size).toBe(6);
    expect(base.seq).toBe(baseMinima().seq + 6);
  });

  it("atividade e alteração usam IDs distintos e com o prefixo certo", () => {
    const { base } = transacao(baseMinima(), CTX, (t) => {
      t.put("imoveis", { ...t.get("imoveis", "imv_a"), preco: 9 });
      t.atividade({ tipo: "precoAlterado", alvo: { tipo: "imovel", id: "imv_a" } });
    });
    const a = base.atividades[0]!.id;
    const r = base.alteracoes[0]!.id;
    expect(a).toMatch(/^atv_[a-z0-9]+$/);
    expect(r).toMatch(/^alt_[a-z0-9]+$/);
    expect(a).not.toBe(r);
  });
});
