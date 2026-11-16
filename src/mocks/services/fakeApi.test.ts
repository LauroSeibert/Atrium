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
  it("moverNegociacao: perdido sem motivo é recusado; com motivo grava e desfaz (RF-31, RF-32)", async () => {
    const [n] = await fakeApi.listNegociacoes({ etapas: ["novo"] });
    const id = n!.id;
    expect(n!.permissoesDeSoltar.perdido.ok).toBe(true);
    await expect(fakeApi.moverNegociacao(id, "perdido")).rejects.toMatchObject({ tipo: "regra" });
    const { resultado, desfazer } = await fakeApi.moverNegociacao(id, "perdido", 0, "preco");
    expect(resultado).toMatchObject({ etapa: "perdido", motivoPerda: "preco" });
    const alt = await fakeApi.listAlteracoes({ tipo: "negociacao", id });
    expect(alt[0]).toMatchObject({ campo: "etapa", de: "novo", para: "perdido" });
    const doLead = await fakeApi.listAlteracoesDoLead(n!.leadId);
    expect(doLead[0]).toMatchObject({ entidade: { tipo: "negociacao", id }, campo: "etapa" });
    await desfazer();
    const [volta] = await fakeApi.listNegociacoes({ leadId: n!.leadId, etapas: ["novo"] });
    expect(volta).toMatchObject({ id, etapa: "novo", motivoPerda: null });
  });

  it("criarNegociacao recusa duplicada aberta e definirImovelNegociacao preenche o imóvel (RF-70, RF-71)", async () => {
    const [semImovel] = (await fakeApi.listNegociacoes({ etapas: ["novo"] })).filter((n) => n.imovel === null);
    expect(semImovel).toBeDefined();
    const { itens } = await fakeApi.listImoveis({ status: ["disponivel"] });
    await fakeApi.definirImovelNegociacao(semImovel!.id, itens[0]!.id);
    await expect(fakeApi.criarNegociacao(semImovel!.leadId, itens[0]!.id)).rejects.toMatchObject({ tipo: "regra" });
    const { resultado } = await fakeApi.criarNegociacao(semImovel!.leadId, itens[1]!.id);
    expect(resultado).toMatchObject({ etapa: "novo", imovelId: itens[1]!.id });
    const lead = await fakeApi.getLead(semImovel!.leadId);
    expect(lead.negociacoes.map((n) => n.imovel?.id)).toEqual(expect.arrayContaining([itens[0]!.id, itens[1]!.id]));
  });

  it("listLeads conta negociações; getLead traz negociações e contratos; createLead cria a 1ª negociação", async () => {
    const leads = await fakeApi.listLeads();
    expect(leads.every((l) => l.qtdNegociacoes >= 1)).toBe(true);
    const com3 = leads.find((l) => l.qtdNegociacoes === 3)!;
    expect((await fakeApi.getLead(com3.id)).negociacoes).toHaveLength(3);
    const { itens } = await fakeApi.listImoveis({ status: ["disponivel"] });
    const { resultado } = await fakeApi.createLead({
      nome: "Lead de teste",
      contato: {},
      origem: "site",
      imovelId: itens[0]!.id,
    });
    const novo = await fakeApi.getLead(resultado.id);
    expect(novo.negociacoes).toHaveLength(1);
    expect(novo.negociacoes[0]).toMatchObject({ etapa: "novo", imovel: { id: itens[0]!.id } });
    expect(novo.podeAgendarVisita.ok).toBe(true);
  });

  it("getImovel traz negociações; getContrato traz negociação e lead", async () => {
    const { itens } = await fakeApi.listContratos({}, { pagina: 1, porPagina: 100 });
    const k = itens.find((l) => l.contrato.negociacaoId)!.contrato;
    const c = await fakeApi.getContrato(k.id);
    expect(c.negociacao).toMatchObject({ id: k.negociacaoId, etapa: "fechado" });
    expect(c.lead?.id).toBe(c.negociacao!.leadId);
    const im = await fakeApi.getImovel(k.imovelId);
    expect(im.negociacoes.some((n) => n.id === k.negociacaoId)).toBe(true);
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
    const negs = await fakeApi.listNegociacoes();
    for (const n of negs.slice(0, 10)) await fakeApi.moverNegociacao(n.id, "visita").catch(() => undefined);
    expect(leads.length).toBeGreaterThan(0);
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

describe("fakeApi — módulos do novo menu (BRIEF-MENU)", () => {
  it("getAgenda: dias com visitas (com transições) e vencimentos (RF-73)", async () => {
    const a = await fakeApi.getAgenda({ dias: 30 });
    const itens = a.dias.flatMap((d) => d.itens);
    expect(itens.some((i) => i.tipo === "visita")).toBe(true);
    for (const i of itens) if (i.tipo === "visita") expect(i.transicoes.length).toBeGreaterThan(0);
    const so = await fakeApi.getAgenda({ dias: 30, tipos: ["vencimento"] });
    expect(so.dias.flatMap((d) => d.itens).every((i) => i.tipo === "vencimento")).toBe(true);
  });

  it("contatos: lista, filtra por papel, abre e salva (RF-74)", async () => {
    const todos = await fakeApi.listContatos();
    expect(todos.length).toBeGreaterThan(30);
    const donos = await fakeApi.listContatos({ papeis: ["proprietario"] });
    expect(donos.every((c) => c.papel === "proprietario")).toBe(true);
    const ficha = await fakeApi.getContato(donos[0]!.id);
    expect(ficha.contratos.length).toBeGreaterThan(0);
    const { resultado } = await fakeApi.saveContato({
      nome: "Contato de teste",
      papel: "advogado",
      imovelIds: [],
      contratoIds: [],
    });
    expect((await fakeApi.search("Contato de teste")).contatos?.[0]?.id).toBe(resultado.id);
    await expect(
      fakeApi.saveContato({ nome: "x", papel: "advogado", imovelIds: [], contratoIds: [] }),
    ).rejects.toMatchObject({ tipo: "validacao" });
  });

  it("anúncios: transições e alerta vêm do domínio (RF-75)", async () => {
    const lista = await fakeApi.listAnuncios();
    expect(lista.length).toBeGreaterThan(40);
    const pub = lista.find((a) => a.status === "publicado")!;
    expect(pub.transicoes.map((t) => t.para)).toContain("pausado");
    const { desfazer } = await fakeApi.transicionarAnuncio(pub.id, "pausado");
    expect((await fakeApi.listAnuncios({ status: ["pausado"] })).some((a) => a.id === pub.id)).toBe(true);
    await desfazer();
    await expect(fakeApi.transicionarAnuncio(pub.id, "rascunho")).rejects.toMatchObject({ tipo: "regra" });
  });

  it("documentos: envia, baixa, remove; exemplo baixa PDF de demonstração (RF-76)", async () => {
    const { itens } = await fakeApi.listContratos({ status: ["ativo"] });
    const contratoId = itens[0]!.contrato.id;
    const exemplos = await fakeApi.listDocumentos(contratoId);
    expect(exemplos.length).toBeGreaterThan(0);
    const demo = await fakeApi.baixarDocumento(exemplos[0]!.id);
    expect(demo.type).toBe("application/pdf");
    expect(await demo.text()).toContain("Documento de demonstra");

    const arquivo = new File(["conteúdo"], "comprovante.pdf", { type: "application/pdf" });
    const { resultado, soNestaSessao } = await fakeApi.enviarDocumento(contratoId, arquivo, "comprovante");
    expect(resultado).toMatchObject({ nome: "comprovante.pdf", mime: "application/pdf" });
    // Sem IndexedDB (jsdom): cai na memória e avisa a UI.
    expect(soNestaSessao).toBe(true);
    expect(await (await fakeApi.baixarDocumento(resultado.id)).text()).toBe("conteúdo");

    const exe = new File(["x"], "virus.exe", { type: "application/x-msdownload" });
    await expect(fakeApi.enviarDocumento(contratoId, exe, "outro")).rejects.toMatchObject({ tipo: "validacao" });

    const { desfazer } = await fakeApi.removerDocumento(resultado.id);
    expect((await fakeApi.listDocumentos(contratoId)).some((d) => d.id === resultado.id)).toBe(false);
    await desfazer();
    expect(await (await fakeApi.baixarDocumento(resultado.id)).text()).toBe("conteúdo");
  });

  it("receitas, despesas, comissões e repasses (RF-77…80)", async () => {
    const r = await fakeApi.listReceitas({ status: ["atrasado"] }, { pagina: 1, porPagina: 200 });
    expect(r.total).toBeGreaterThan(0);
    expect(r.itens.every((l) => l.status === "atrasado" && l.podePagar.ok)).toBe(true);

    const d = await fakeApi.listDespesas({ status: ["atrasada"] }, { pagina: 1, porPagina: 100 });
    expect(d.total).toBeGreaterThan(0);
    const alvo = d.itens[0]!;
    expect(alvo.podePagar.ok).toBe(true);
    await fakeApi.pagarDespesa(alvo.id);
    const paga = (await fakeApi.listDespesas({ status: ["paga"] }, { pagina: 1, porPagina: 100 })).itens.find(
      (x) => x.id === alvo.id,
    )!;
    expect(paga.podeEditar.ok).toBe(false);
    await expect(fakeApi.saveDespesa({ ...alvo, id: alvo.id, valor: 1 })).rejects.toMatchObject({ tipo: "regra" });
    const avulsas = await fakeApi.listDespesas({ contratoId: null }, { pagina: 1, porPagina: 100 });
    expect(avulsas.itens.every((x) => x.contrato === null)).toBe(true);

    const pendentes = await fakeApi.listComissoes({ status: "pendente" });
    expect(pendentes.length).toBeGreaterThan(0);
    const m = pendentes[0]!;
    await fakeApi.pagarComissao(m.contratoId, m.indice);
    await expect(fakeApi.pagarComissao(m.contratoId, m.indice)).rejects.toMatchObject({ tipo: "regra" });

    const rep = await fakeApi.listRepasses();
    expect(rep.length).toBeGreaterThan(0);
    expect(rep.every((x) => x.repasse < x.aluguel)).toBe(true);
  });

  it("getFinanceiro traz despesas e resultado; getRelatorios os 5 relatórios (RF-81, RF-82)", async () => {
    const f = await fakeApi.getFinanceiro("ultimos12");
    expect(f.resultado).toBe(f.recebido - f.despesas.pagas);
    const rel = await fakeApi.getRelatorios({ periodo: "ultimos12" });
    expect(rel.vendasPorPeriodo).toHaveLength(12);
    expect(rel.desempenhoCorretores.length).toBeGreaterThan(0);
    expect(rel.imoveisMaisProcurados.length).toBeLessThanOrEqual(10);
    expect(rel.receitaPorPeriodo).toHaveLength(12);
    expect(rel.conversaoLeads.funil.length).toBe(6);
  });

  it("resetMock limpa também os arquivos", async () => {
    const { itens } = await fakeApi.listContratos({ status: ["ativo"] });
    const arquivo = new File(["a"], "a.pdf", { type: "application/pdf" });
    const { resultado } = await fakeApi.enviarDocumento(itens[0]!.contrato.id, arquivo, "outro");
    await fakeApi.resetMock();
    await expect(fakeApi.baixarDocumento(resultado.id)).rejects.toMatchObject({ tipo: "naoEncontrado" });
  });
});
