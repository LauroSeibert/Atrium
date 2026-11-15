import { describe, expect, it } from "vitest";
import type { Atividade } from "../atividade/schema";
import { AGORA, baseMinima, contrato, imovel, lead } from "../teste/fabrica";
import { contadoresNavegacao, listarNotificacoes, naoLidas, nomeDaEntidade, LIMITE_NOTIFICACOES } from "./notificacoes";

/** RF-62 (badges) e RF-64 (notificações). */

function atividade(over: Partial<Atividade> = {}): Atividade {
  return {
    id: "atv_a",
    tipo: "nota",
    alvo: { tipo: "lead", id: "lead_a" },
    relacionados: [],
    autorId: "cor_b",
    dados: { texto: "Oi" },
    criadoEm: "2026-11-13T12:00:00.000Z",
    ...over,
  };
}

const parcela = (numero: number, vencimento: string, pagoEm: string | null = null) => ({
  numero,
  vencimento,
  valor: 100_000,
  pagoEm,
});

describe("listarNotificacoes: atividades (RF-64)", () => {
  it("exclui atividades do próprio usuário", () => {
    const base = baseMinima({
      atividades: [atividade({ id: "atv_a", autorId: "cor_a" }), atividade({ id: "atv_b", autorId: "cor_b" })],
    });
    const ns = listarNotificacoes(base, AGORA, "cor_a");
    expect(ns.map((n) => n.id)).toEqual(["ntf_atv_b"]);
  });

  it("respeita a janela de 14 dias", () => {
    const base = baseMinima({
      atividades: [
        atividade({ id: "atv_dentro", criadoEm: "2026-10-31T14:00:00.000Z" }),
        atividade({ id: "atv_fora", criadoEm: "2026-10-30T12:00:00.000Z" }),
      ],
    });
    expect(listarNotificacoes(base, AGORA, "cor_a").map((n) => n.id)).toEqual(["ntf_atv_dentro"]);
  });

  it("resolve alvoNome pela entidade referenciada", () => {
    const base = baseMinima({
      imoveis: [imovel()],
      leads: [lead()],
      atividades: [
        atividade({ id: "atv_l", alvo: { tipo: "lead", id: "lead_a" } }),
        atividade({ id: "atv_i", alvo: { tipo: "imovel", id: "imv_a" }, criadoEm: "2026-11-13T11:00:00.000Z" }),
      ],
    });
    const ns = listarNotificacoes(base, AGORA, "cor_a");
    const nomes = ns.map((n) => (n.tipo === "atividade" ? n.alvoNome : undefined));
    expect(nomes).toEqual(["Lead Teste", "AT-0001 · Apartamento teste"]);
  });

  it("deixa alvoNome indefinido quando a entidade não existe mais", () => {
    const base = baseMinima({ atividades: [atividade({ alvo: { tipo: "lead", id: "lead_zzz" } })] });
    const [n] = listarNotificacoes(base, AGORA, "cor_a");
    expect(n && n.tipo === "atividade" && n.alvoNome).toBeUndefined();
  });
});

describe("listarNotificacoes: parcelas (RF-64)", () => {
  it("parcela que vence em até 3 dias vira vencimento", () => {
    const base = baseMinima({
      contratos: [contrato({ status: "ativo", parcelas: [parcela(1, "2026-11-17"), parcela(2, "2026-11-18")] })],
    });
    const ns = listarNotificacoes(base, AGORA, "cor_a");
    expect(ns).toHaveLength(1);
    expect(ns[0]).toMatchObject({ tipo: "vencimento", parcela: 1, numero: "CT-2026-0001", valor: 100_000 });
    expect(ns[0]!.id).toBe("ntf_venc_ctr_a_1");
  });

  it("parcela vencida e não paga vira atraso", () => {
    const base = baseMinima({ contratos: [contrato({ status: "ativo", parcelas: [parcela(1, "2026-11-01")] })] });
    expect(listarNotificacoes(base, AGORA, "cor_a")[0]).toMatchObject({ tipo: "atraso", parcela: 1 });
  });

  it("parcela paga não notifica", () => {
    const base = baseMinima({
      contratos: [contrato({ status: "ativo", parcelas: [parcela(1, "2026-11-01", "2026-11-02T12:00:00.000Z")] })],
    });
    expect(listarNotificacoes(base, AGORA, "cor_a")).toEqual([]);
  });

  it("contrato que não está ativo não notifica", () => {
    const base = baseMinima({
      contratos: [
        contrato({ id: "ctr_r", status: "rascunho", parcelas: [parcela(1, "2026-11-01")] }),
        contrato({ id: "ctr_c", status: "cancelado", motivoCancelamento: "x", parcelas: [parcela(1, "2026-11-01")] }),
      ],
    });
    expect(listarNotificacoes(base, AGORA, "cor_a")).toEqual([]);
  });
});

describe("listarNotificacoes: ordem, limite e lidas", () => {
  it("ordena da mais recente para a mais antiga, misturando as fontes", () => {
    const base = baseMinima({
      atividades: [atividade({ id: "atv_a", criadoEm: "2026-11-10T12:00:00.000Z" })],
      contratos: [contrato({ status: "ativo", parcelas: [parcela(1, "2026-11-01"), parcela(2, "2026-11-16")] })],
    });
    expect(listarNotificacoes(base, AGORA, "cor_a").map((n) => n.id)).toEqual([
      "ntf_venc_ctr_a_2",
      "ntf_atv_a",
      "ntf_venc_ctr_a_1",
    ]);
  });

  it("limita a 50 notificações, mantendo as mais recentes", () => {
    const atividades = Array.from({ length: 60 }, (_, i) =>
      atividade({
        id: `atv_${i}`,
        criadoEm: new Date(Date.parse("2026-11-01T00:00:00.000Z") + i * 60_000).toISOString(),
      }),
    );
    const ns = listarNotificacoes(baseMinima({ atividades }), AGORA, "cor_a");
    expect(ns).toHaveLength(LIMITE_NOTIFICACOES);
    expect(ns[0]!.id).toBe("ntf_atv_59");
    expect(ns.at(-1)!.id).toBe("ntf_atv_10");
  });

  it("marca `lida` a partir de `lidas` e conta as pendentes", () => {
    const base = baseMinima({
      atividades: [atividade({ id: "atv_a" }), atividade({ id: "atv_b", criadoEm: "2026-11-12T12:00:00.000Z" })],
    });
    const ns = listarNotificacoes(base, AGORA, "cor_a", ["ntf_atv_a"]);
    expect(ns.map((n) => [n.id, n.lida])).toEqual([
      ["ntf_atv_a", true],
      ["ntf_atv_b", false],
    ]);
    expect(naoLidas(ns)).toBe(1);
    expect(naoLidas([])).toBe(0);
  });
});

describe("nomeDaEntidade", () => {
  const base = baseMinima({ contratos: [contrato()] });
  it("devolve o nome legível por tipo", () => {
    expect(nomeDaEntidade(base, { tipo: "imovel", id: "imv_a" })).toBe("AT-0001 · Apartamento teste");
    expect(nomeDaEntidade(base, { tipo: "lead", id: "lead_a" })).toBe("Lead Teste");
    expect(nomeDaEntidade(base, { tipo: "contrato", id: "ctr_a" })).toBe("CT-2026-0001");
  });
  it("devolve undefined se não existe", () => {
    expect(nomeDaEntidade(base, { tipo: "contrato", id: "ctr_zzz" })).toBeUndefined();
  });
});

describe("contadoresNavegacao (RF-62)", () => {
  it("conta leads na etapa novo", () => {
    const base = baseMinima({
      leads: [lead({ id: "lead_a" }), lead({ id: "lead_b" }), lead({ id: "lead_c", etapa: "visita" })],
    });
    expect(contadoresNavegacao(base, AGORA).leadsNovos).toBe(2);
  });

  it("conta parcelas atrasadas só de contratos ativos", () => {
    const base = baseMinima({
      contratos: [
        contrato({
          id: "ctr_a",
          status: "ativo",
          parcelas: [parcela(1, "2026-11-01"), parcela(2, "2026-11-05"), parcela(3, "2026-12-01")],
        }),
        contrato({ id: "ctr_b", status: "encerrado", parcelas: [parcela(1, "2026-10-01")] }),
        contrato({ id: "ctr_c", status: "rascunho", parcelas: [parcela(1, "2026-10-01")] }),
      ],
    });
    expect(contadoresNavegacao(base, AGORA).parcelasAtrasadas).toBe(2);
  });
});
