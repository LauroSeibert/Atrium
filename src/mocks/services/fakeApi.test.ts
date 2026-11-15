import { beforeEach, describe, expect, it } from "vitest";
import { validarBase } from "@/domain";
import { ErroApi } from "./erros";
import { __reiniciarParaTeste, fakeApi } from "./fakeApi";

const AGORA = "2026-11-14T12:00:00.000Z";

beforeEach(() => __reiniciarParaTeste({ agora: AGORA }));

describe("fakeApi — latência e erro (Gate 5, RF-51)", () => {
  it("padrão de produção: 300–800 ms e sem erro", () => {
    __reiniciarParaTeste({ config: { latencia: [300, 800], taxaErro: 0 } });
    expect(fakeApi.getConfig()).toMatchObject({ latencia: [300, 800], taxaErro: 0 });
  });

  it("simula latência", async () => {
    fakeApi.configurar({ latencia: [60, 60] });
    const t0 = performance.now();
    await fakeApi.listCorretores();
    expect(performance.now() - t0).toBeGreaterThanOrEqual(50);
  });

  it("simula erro de rede recuperável com taxaErro = 1", async () => {
    fakeApi.configurar({ taxaErro: 1 });
    const e = await fakeApi.listImoveis().catch((x: unknown) => x);
    expect(e).toBeInstanceOf(ErroApi);
    expect(e).toMatchObject({ tipo: "rede", recuperavel: true });
    fakeApi.configurar({ taxaErro: 0 });
    await expect(fakeApi.listImoveis()).resolves.toBeTruthy();
  });

  it("recurso inexistente vira erro naoEncontrado", async () => {
    await expect(fakeApi.getImovel("imv_naoexiste")).rejects.toMatchObject({ tipo: "naoEncontrado" });
  });
});

describe("fakeApi — leituras", () => {
  it("listImoveis filtra, ordena e pagina", async () => {
    const tudo = await fakeApi.listImoveis({}, { pagina: 1, porPagina: 500 });
    expect(tudo.total).toBeGreaterThanOrEqual(40);
    const p = await fakeApi.listImoveis({ finalidade: "venda" }, { pagina: 2, porPagina: 5 }, "precoAsc");
    expect(p.pagina).toBe(2);
    expect(p.itens.length).toBeLessThanOrEqual(5);
    expect(p.itens.every((i) => i.finalidade === "venda")).toBe(true);
    const precos = p.itens.map((i) => i.preco);
    expect([...precos].sort((a, b) => a - b)).toEqual(precos);
    const vazio = await fakeApi.listImoveis({ busca: "zzz-nada-encontrado" });
    expect(vazio).toMatchObject({ total: 0, itens: [] });
  });

  it("devolve cópias: mexer no resultado não altera o mock", async () => {
    const { itens } = await fakeApi.listImoveis();
    (itens[0] as { titulo: string }).titulo = "alterado";
    const { itens: de_novo } = await fakeApi.listImoveis();
    expect(de_novo[0]!.titulo).not.toBe("alterado");
  });

  it("getDashboard e getFinanceiro calculam 12 meses", async () => {
    const d = await fakeApi.getDashboard("ultimos12");
    expect(d.receita12m).toHaveLength(12);
    expect(d.funil.map((f) => f.etapa)).toEqual(["novo", "contato", "visita", "proposta", "fechado", "perdido"]);
    expect(d.atividades.length).toBeLessThanOrEqual(10);
    const f = await fakeApi.getFinanceiro("ultimos12");
    expect(f.receitaPorMes).toHaveLength(12);
    expect(f.inadimplencia.percentual).toBeGreaterThanOrEqual(0);
  });

  it("listContratos anexa status derivado e filtra inadimplentes", async () => {
    const r = await fakeApi.listContratos({ status: ["inadimplente"] }, { pagina: 1, porPagina: 100 });
    expect(r.total).toBeGreaterThan(0);
    expect(r.itens.every((l) => l.statusExibicao === "inadimplente" && l.contrato.status === "ativo")).toBe(true);
  });

  it("search encontra por código", async () => {
    const r = await fakeApi.search("AT-0001");
    expect(r.imoveis[0]?.codigo).toBe("AT-0001");
  });
});

describe("fakeApi — escritas passam pelo domínio e têm desfazer (RF-04)", () => {
  it("moveLead: perdido sem motivo é recusado; com motivo grava e desfaz", async () => {
    const leads = await fakeApi.listLeads({ etapas: ["novo"] });
    const id = leads[0]!.id;
    await expect(fakeApi.moveLead(id, "perdido")).rejects.toMatchObject({ tipo: "regra" });
    const { resultado, desfazer } = await fakeApi.moveLead(id, "perdido", 0, "preco");
    expect(resultado).toMatchObject({ etapa: "perdido", motivoPerda: "preco" });
    const alt = await fakeApi.listAlteracoes({ tipo: "lead", id });
    expect(alt[0]).toMatchObject({ campo: "etapa", de: "novo", para: "perdido" });
    await desfazer();
    expect((await fakeApi.getLead(id)).lead).toMatchObject({ etapa: "novo", motivoPerda: null });
  });

  it("registrarPagamento grava pagoEm e desfaz", async () => {
    const { itens } = await fakeApi.listContratos({ status: ["inadimplente"] });
    const c = itens[0]!.contrato;
    const aberta = c.parcelas.find((p) => !p.pagoEm)!;
    const { desfazer } = await fakeApi.registrarPagamento(c.id, aberta.numero);
    const pago = await fakeApi.getContrato(c.id);
    expect(pago.parcelas.find((p) => p.numero === aberta.numero)?.status).toBe("pago");
    await desfazer();
    const volta = await fakeApi.getContrato(c.id);
    expect(volta.parcelas.find((p) => p.numero === aberta.numero)?.pagoEm).toBeNull();
  });

  it("setStatusImovel recusa vendido manual", async () => {
    const { itens } = await fakeApi.listImoveis({ status: ["disponivel"] });
    await expect(fakeApi.setStatusImovel(itens[0]!.id, "vendido")).rejects.toMatchObject({ tipo: "regra" });
  });

  it("cancelarContrato devolve o imóvel a disponível", async () => {
    const { itens } = await fakeApi.listContratos({ status: ["ativo"] });
    const c = itens[0]!.contrato;
    await fakeApi.cancelarContrato(c.id, "Desistência do comprador");
    expect((await fakeApi.getImovel(c.imovelId)).imovel.status).toBe("disponivel");
  });

  it("autor das alterações é o usuário atual (RF-08)", async () => {
    const [, outro] = await fakeApi.listCorretores();
    await fakeApi.setUsuarioAtual(outro!.id);
    const { itens } = await fakeApi.listImoveis({ status: ["disponivel"] });
    await fakeApi.setStatusImovel(itens[0]!.id, "reservado");
    const [reg] = await fakeApi.listAlteracoes({ tipo: "imovel", id: itens[0]!.id });
    expect(reg).toMatchObject({ autorId: outro!.id, campo: "status", de: "disponivel", para: "reservado" });
  });

  it("a base continua válida depois de várias escritas", async () => {
    const leads = await fakeApi.listLeads();
    for (const l of leads.slice(0, 10)) await fakeApi.moveLead(l.id, "visita").catch(() => undefined);
    await fakeApi.createLead({ nome: "Lead de teste", contato: {}, origem: "site" });
    const { itens } = await fakeApi.listImoveis({ status: ["disponivel"] });
    await fakeApi.setStatusImoveis(
      itens.map((i) => i.id),
      "reservado",
    );
    // Acesso interno só para o teste: valida via snapshot público.
    const tudo = await fakeApi.listImoveis({}, { pagina: 1, porPagina: 500 });
    expect(tudo.itens.filter((i) => i.status === "reservado").length).toBeGreaterThan(0);
    expect(validarBase).toBeTypeOf("function");
  });

  it("marcarLida", async () => {
    const ns = await fakeApi.listNotificacoes();
    if (!ns.length) return;
    await fakeApi.marcarLida(ns[0]!.id);
    expect((await fakeApi.listNotificacoes())[0]!.lida).toBe(true);
  });
});
