import { describe, expect, it } from "vitest";
import { dataLocal, estaInadimplente, parcelasAtrasadas, validarBase, type Base, type Contrato } from "@/domain";
import { CASOS_DE_BORDA, gerarBase, gerarBaseComCasos } from "./gerador";

const HOJE = "2026-11-14T12:00:00.000Z";
const OUTRO_HOJE = "2027-06-01T12:00:00.000Z";
const DIA = 86_400_000;

const base = gerarBase({ hoje: HOJE });
const por = <T extends { id: string }>(lista: readonly T[], id: string): T => {
  const e = lista.find((x) => x.id === id);
  if (!e) throw new Error(`não achei ${id}`);
  return e;
};
const mostrar = (b: Base) => validarBase(b).slice(0, 15).join("\n");

describe("gerarBase: validade (RF-51, MODELO §3)", () => {
  it.each([HOJE, OUTRO_HOJE, "2026-03-02T02:30:00.000Z"])("passa em validarBase com hoje = %s", (hoje) => {
    const b = gerarBase({ hoje });
    const erros = validarBase(b);
    if (erros.length) console.log(erros.slice(0, 15).join("\n"));
    expect(erros).toEqual([]);
  });

  it("passa com outra semente", () => {
    expect(validarBase(gerarBase({ hoje: HOJE, semente: 7 }))).toEqual([]);
    expect(validarBase(gerarBase({ hoje: HOJE, semente: 123456 }))).toEqual([]);
  });

  it("seq fica acima de todos os sufixos numéricos de ID", () => {
    const todos = [
      ...base.corretores,
      ...base.imoveis,
      ...base.leads,
      ...base.negociacoes,
      ...base.visitas,
      ...base.contratos,
      ...base.contatos,
      ...base.anuncios,
      ...base.documentos,
      ...base.despesas,
      ...base.atividades,
      ...base.alteracoes,
    ];
    const maior = Math.max(...todos.map((e) => parseInt(e.id.split("_")[1]!, 36)));
    expect(base.seq).toBeGreaterThan(maior);
    expect(base.seq).toBe(todos.length + 1);
  });

  it("nenhuma data de evento passa de hoje (exceto visitas agendadas)", () => {
    const agora = Date.parse(HOJE);
    for (const a of base.atividades) expect(Date.parse(a.criadoEm)).toBeLessThanOrEqual(agora);
    for (const a of base.alteracoes) expect(Date.parse(a.em)).toBeLessThanOrEqual(agora);
    for (const i of base.imoveis) {
      expect(Date.parse(i.criadoEm)).toBeLessThanOrEqual(agora);
      expect(Date.parse(i.atualizadoEm)).toBeGreaterThanOrEqual(Date.parse(i.criadoEm));
    }
    for (const c of base.contratos)
      for (const p of c.parcelas) if (p.pagoEm) expect(Date.parse(p.pagoEm)).toBeLessThanOrEqual(agora);
  });
});

describe("gerarBase: determinismo", () => {
  it("mesma semente + hoje ⇒ JSON idêntico", () => {
    expect(JSON.stringify(gerarBase({ hoje: HOJE }))).toBe(JSON.stringify(gerarBase({ hoje: HOJE, semente: 2026 })));
  });
  it("semente diferente ⇒ Base diferente", () => {
    expect(JSON.stringify(gerarBase({ hoje: HOJE, semente: 1 }))).not.toBe(JSON.stringify(base));
  });
  it("hoje diferente ⇒ mesmas entidades e IDs, datas deslocadas", () => {
    const b2 = gerarBase({ hoje: OUTRO_HOJE });
    expect(b2.imoveis.map((i) => i.id)).toEqual(base.imoveis.map((i) => i.id));
    expect(b2.contratos.map((i) => i.id)).toEqual(base.contratos.map((i) => i.id));
    expect(b2.leads.map((i) => i.id)).toEqual(base.leads.map((i) => i.id));
    expect(JSON.stringify(b2)).not.toBe(JSON.stringify(base));
  });
  it("CASOS_DE_BORDA não depende de hoje", () => {
    expect(gerarBaseComCasos({ hoje: OUTRO_HOJE }).casos).toEqual(CASOS_DE_BORDA);
    expect(gerarBaseComCasos({ hoje: HOJE }).casos).toEqual(CASOS_DE_BORDA);
  });
});

describe("gerarBase: volumes (MODELO §4)", () => {
  it("quantidades por coleção", () => {
    expect(base.corretores).toHaveLength(8);
    expect(base.imoveis).toHaveLength(48);
    expect(base.leads).toHaveLength(60);
    expect(base.contratos).toHaveLength(36);
    expect(base.visitas.length).toBeGreaterThanOrEqual(100);
    expect(base.visitas.length).toBeLessThanOrEqual(140);
    expect(base.atividades.length).toBeGreaterThanOrEqual(450);
    expect(base.atividades.length).toBeLessThanOrEqual(720);
    expect(base.negociacoes.length).toBeGreaterThanOrEqual(70);
    expect(base.contatos.length).toBeGreaterThanOrEqual(35);
    expect(base.contatos.length).toBeLessThanOrEqual(45);
    expect(base.anuncios.length).toBeGreaterThanOrEqual(45);
    expect(base.anuncios.length).toBeLessThanOrEqual(55);
    expect(base.documentos).toHaveLength(60);
    expect(base.despesas).toHaveLength(45);
    expect(base.alteracoes.length).toBeGreaterThanOrEqual(30);
  });

  it("papéis dos corretores e variantes de avatar", () => {
    const n = (p: string) => base.corretores.filter((c) => c.papel === p).length;
    expect([n("gestor"), n("corretor"), n("financeiro")]).toEqual([1, 6, 1]);
    const variantes = base.corretores.flatMap((c) => (c.avatar.variante ? [c.avatar.variante] : []));
    expect(variantes.length).toBeGreaterThan(0);
    expect(variantes.length).toBeLessThan(8);
  });

  it("mix de contratos", () => {
    const n = (s: string) => base.contratos.filter((c) => c.status === s).length;
    expect([n("rascunho"), n("ativo"), n("encerrado"), n("cancelado")]).toEqual([3, 18, 12, 3]);
    for (const c of base.contratos.filter((x) => x.status === "cancelado")) expect(c.motivoCancelamento).toBeTruthy();
    for (const c of base.contratos.filter((x) => x.tipo === "venda")) {
      expect(c.parcelas.length).toBeLessThanOrEqual(4);
      expect(c.taxaAdministracao).toBeNull();
    }
    for (const c of base.contratos.filter((x) => x.tipo === "locacao")) {
      expect(c.taxaAdministracao).toBeGreaterThanOrEqual(8);
      expect(c.taxaAdministracao).toBeLessThanOrEqual(12);
    }
    const ativosPorImovel = new Map<string, number>();
    for (const c of base.contratos.filter((x) => x.status === "ativo"))
      ativosPorImovel.set(c.imovelId, (ativosPorImovel.get(c.imovelId) ?? 0) + 1);
    expect([...ativosPorImovel.values()].every((v) => v === 1)).toBe(true);
  });

  it("visitas: todos os status, ~15 futuras, várias nos próximos 7 dias", () => {
    const agora = Date.parse(HOJE);
    const futuras = base.visitas.filter((v) => v.status === "agendada");
    expect(futuras.length).toBeGreaterThanOrEqual(12);
    expect(futuras.length).toBeLessThanOrEqual(16);
    for (const v of futuras) expect(Date.parse(v.dataHora)).toBeGreaterThan(agora);
    expect(futuras.filter((v) => Date.parse(v.dataHora) < agora + 7 * DIA).length).toBeGreaterThanOrEqual(5);
    for (const v of base.visitas.filter((x) => x.status !== "agendada"))
      expect(Date.parse(v.dataHora)).toBeLessThan(agora);
    for (const s of ["realizada", "cancelada", "naoCompareceu"])
      expect(base.visitas.some((v) => v.status === s)).toBe(true);
  });

  it("negociações (RF-70): ordem 0…n por coluna, motivoPerda só nas perdidas, 1–3 por lead", () => {
    for (const etapa of ["novo", "visita", "proposta", "fechado", "perdido"] as const) {
      const col = base.negociacoes.filter((n) => n.etapa === etapa);
      expect(col.length).toBeGreaterThan(0);
      expect(col.map((n) => n.ordem).sort((a, b) => a - b)).toEqual(col.map((_, i) => i));
    }
    for (const n of base.negociacoes) expect(n.motivoPerda !== null).toBe(n.etapa === "perdido");
    for (const l of base.leads) {
      const k = base.negociacoes.filter((n) => n.leadId === l.id).length;
      expect(k).toBeGreaterThanOrEqual(1);
      expect(k).toBeLessThanOrEqual(3);
    }
    expect(base.negociacoes.some((n) => n.imovelId === null)).toBe(true);
    // contrato vinculado ⇒ negociação fechada do mesmo imóvel (invariante 3)
    const vinculados = base.contratos.filter((c) => c.negociacaoId);
    expect(vinculados.length).toBeGreaterThanOrEqual(10);
    for (const c of vinculados) {
      const n = por(base.negociacoes, c.negociacaoId!);
      expect(n).toMatchObject({ etapa: "fechado", imovelId: c.imovelId });
    }
    // etapa alterada aponta a negociação, e o registro de alteração é da negociação
    const etapas = base.alteracoes.filter((a) => a.campo === "etapa");
    expect(etapas.length).toBeGreaterThan(0);
    for (const a of etapas) expect(a.entidade.tipo).toBe("negociacao");
  });

  it("leads: imoveisVistos ⇔ visitas realizadas", () => {
    for (const l of base.leads) {
      const vistos = new Set(
        base.visitas.filter((v) => v.leadId === l.id && v.status === "realizada").map((v) => v.imovelId),
      );
      expect(new Set(l.imoveisVistos)).toEqual(vistos);
    }
  });

  it("imóveis: coerência de tipo, fachada e preço", () => {
    const fach = {
      casa: ["terrea", "sobrado", "moderna", "campo"],
      apartamento: ["predio"],
      cobertura: ["cobertura"],
      comercial: ["comercial"],
      terreno: ["terreno"],
    } as const;
    for (const i of base.imoveis) {
      if (i.fachada) expect(fach[i.tipo] as readonly string[]).toContain(i.fachada);
      if (i.tipo === "apartamento" || i.tipo === "cobertura") expect(i.condominio).not.toBeNull();
      expect(i.areaUtil).toBeLessThanOrEqual(i.areaTotal);
      expect(i.codigo).toMatch(/^AT-\d{4}$/);
      if (i.status !== "inativo") expect(i.motivoInativo).toBeNull();
    }
    expect(base.imoveis.some((i) => i.favorito)).toBe(true);
    for (const s of ["disponivel", "reservado", "vendido", "alugado", "inativo"])
      expect(base.imoveis.some((i) => i.status === s)).toBe(true);
    const comuns = base.imoveis.filter(
      (i) => i.id !== CASOS_DE_BORDA.imovelVendaMaxima && i.id !== CASOS_DE_BORDA.imovelAluguelMinimo,
    );
    for (const i of comuns.filter((x) => x.finalidade === "venda")) {
      expect(i.preco).toBeGreaterThanOrEqual(25_000_000);
      expect(i.preco).toBeLessThanOrEqual(300_000_000);
    }
    for (const i of comuns.filter((x) => x.finalidade === "locacao")) {
      expect(i.preco).toBeGreaterThanOrEqual(150_000);
      expect(i.preco).toBeLessThanOrEqual(1_500_000);
    }
  });

  it("registros de alteração batem com atividades precoAlterado/statusAlterado de imóvel", () => {
    const precos = base.atividades.filter((a) => a.tipo === "precoAlterado");
    expect(precos.length).toBeGreaterThan(0);
    for (const a of precos) {
      const alt = base.alteracoes.find(
        (x) => x.em === a.criadoEm && x.entidade.id === a.alvo.id && x.campo === a.dados.campo,
      );
      expect(alt, a.id).toBeDefined();
      expect(alt!.de).toBe(a.dados.de);
      expect(alt!.para).toBe(a.dados.para);
    }
    const status = base.atividades.filter((a) => a.tipo === "statusAlterado" && a.alvo.tipo === "imovel");
    expect(status.length).toBeGreaterThan(0);
    for (const a of status) {
      const alt = base.alteracoes.find(
        (x) => x.em === a.criadoEm && x.entidade.id === a.alvo.id && x.campo === "status",
      );
      expect(alt, a.id).toBeDefined();
      expect(alt!.de).toBe(a.dados.de);
      expect(alt!.para).toBe(a.dados.para);
    }
    // o último "para" de status/preço do imóvel é o valor atual
    for (const i of base.imoveis) {
      const ult = (campo: string) =>
        [...base.alteracoes].reverse().find((x) => x.entidade.id === i.id && x.campo === campo);
      if (ult("status")) expect(ult("status")!.para).toBe(i.status);
      if (ult("preco")) expect(ult("preco")!.para).toBe(i.preco);
    }
  });
});

describe("casos de borda obrigatórios (MODELO §4)", () => {
  const c = CASOS_DE_BORDA;
  const hojeData = dataLocal(HOJE);

  it("nomes longos, mas realistas: ninguém passa de 3 palavras", () => {
    expect(por(base.corretores, c.corretorNomeLongo).nome.split(" ")).toHaveLength(3);
    expect(por(base.leads, c.leadNomeLongo).nome.split(" ")).toHaveLength(3);
    const pessoas = [
      ...base.corretores.map((p) => p.nome),
      ...base.leads.map((p) => p.nome),
      ...base.contatos.map((p) => p.nome),
      ...base.contratos.flatMap((k) => k.partes.map((p) => p.nome)),
    ];
    expect(pessoas.filter((n) => n.trim().split(/\s+/).length > 3)).toEqual([]);
  });
  it("título de imóvel com mais de 100 caracteres", () => {
    expect(por(base.imoveis, c.imovelTituloLongo).titulo.length).toBeGreaterThan(100);
  });
  it("terreno sem cômodos, quartos nem condomínio", () => {
    const t = por(base.imoveis, c.imovelTerrenoSemComodos);
    expect(t.tipo).toBe("terreno");
    expect(t.comodos).toEqual([]);
    expect(t.quartos).toBe(0);
    expect(t.condominio).toBeNull();
  });
  it("imóveis sem ilustração (fachada null)", () => {
    expect(c.imoveisSemIlustracao.length).toBeGreaterThanOrEqual(1);
    expect(c.imoveisSemIlustracao.length).toBeLessThanOrEqual(2);
    for (const id of c.imoveisSemIlustracao) expect(por(base.imoveis, id).fachada).toBeNull();
    expect(base.imoveis.filter((i) => i.fachada === null)).toHaveLength(c.imoveisSemIlustracao.length);
  });
  it("lead sem contato", () => {
    expect(por(base.leads, c.leadSemContato).contato).toEqual({});
    for (const id of c.leadsSemContato) expect(por(base.leads, id).contato).toEqual({});
    for (const l of base.leads.filter((x) => !c.leadsSemContato.includes(x.id)))
      expect(Object.keys(l.contato).length).toBeGreaterThan(0);
  });
  it("locação vencida: fim no passado e ainda ativa", () => {
    const k = por(base.contratos, c.contratoLocacaoVencido);
    expect(k.tipo).toBe("locacao");
    expect(k.status).toBe("ativo");
    expect(k.fim < hojeData).toBe(true);
  });
  it("contrato com exatamente 3 parcelas atrasadas", () => {
    const k = por(base.contratos, c.contratoTresParcelasAtrasadas);
    expect(k.status).toBe("ativo");
    expect(parcelasAtrasadas(k, HOJE)).toHaveLength(3);
    expect(estaInadimplente(k, HOJE)).toBe(true);
  });
  it("só esse contrato tem 3 atrasadas; há outros inadimplentes e parcelas pagas", () => {
    const tres = base.contratos.filter((k) => parcelasAtrasadas(k, HOJE).length === 3);
    expect(tres.map((k) => k.id)).toEqual([c.contratoTresParcelasAtrasadas]);
    expect(base.contratos.filter((k) => estaInadimplente(k, HOJE)).length).toBeGreaterThanOrEqual(3);
    const pagas = base.contratos.flatMap((k) => k.parcelas).filter((p) => p.pagoEm).length;
    const todas = base.contratos.flatMap((k) => k.parcelas).length;
    expect(pagas / todas).toBeGreaterThan(0.4);
  });
  it("aluguel de R$ 900 e venda de R$ 12 mi", () => {
    expect(por(base.imoveis, c.imovelAluguelMinimo)).toMatchObject({ preco: 90_000, finalidade: "locacao" });
    const a = por(base.contratos, c.contratoAluguelMinimo);
    expect(a).toMatchObject({ valor: 90_000, tipo: "locacao", imovelId: c.imovelAluguelMinimo });
    expect(por(base.imoveis, c.imovelVendaMaxima)).toMatchObject({ preco: 1_200_000_000, finalidade: "venda" });
    const v = por(base.contratos, c.contratoVendaMaxima);
    expect(v).toMatchObject({ valor: 1_200_000_000, tipo: "venda", imovelId: c.imovelVendaMaxima });
  });
  it("etapa do kanban vazia", () => {
    expect(c.etapaVazia).toBe("contato");
    expect(base.negociacoes.filter((n) => n.etapa === c.etapaVazia)).toHaveLength(0);
    for (const e of ["novo", "visita", "proposta", "fechado", "perdido"] as const)
      expect(base.negociacoes.some((n) => n.etapa === e)).toBe(true);
  });
  it("lead com 3 negociações em etapas diferentes e negociação sem imóvel", () => {
    const tres = base.negociacoes.filter((n) => n.leadId === c.leadTresNegociacoes);
    expect(tres.map((n) => n.etapa).sort()).toEqual(["perdido", "proposta", "visita"]);
    expect(new Set(tres.map((n) => n.imovelId)).size).toBe(3);
    expect(por(base.negociacoes, c.negociacaoSemImovel)).toMatchObject({ imovelId: null, etapa: "novo" });
  });
  it("anúncios (RF-75): publicado só em imóvel disponível/reservado; um vivo por imóvel × canal", () => {
    for (const a of base.anuncios.filter((x) => x.status === "publicado" || x.status === "pausado"))
      expect(["disponivel", "reservado", "inativo"]).toContain(por(base.imoveis, a.imovelId).status);
    for (const a of base.anuncios.filter((x) => x.status === "publicado"))
      expect(["disponivel", "reservado"]).toContain(por(base.imoveis, a.imovelId).status);
    for (const s of ["rascunho", "publicado", "pausado", "encerrado"])
      expect(base.anuncios.some((a) => a.status === s)).toBe(true);
  });
  it("documentos (RF-76) são exemplos sem arquivo", () => {
    for (const d of base.documentos) expect(d.arquivoId).toBeNull();
    expect(new Set(base.documentos.map((d) => d.tipo)).size).toBeGreaterThanOrEqual(4);
  });
  it("despesas (RF-78): pagas, atrasadas, a vencer e avulsas", () => {
    const hoje = dataLocal(HOJE);
    const atrasadas = base.despesas.filter((d) => !d.pagaEm && d.vencimento < hoje);
    const aVencer = base.despesas.filter((d) => !d.pagaEm && d.vencimento >= hoje);
    expect(atrasadas.length).toBeGreaterThanOrEqual(3);
    expect(aVencer.length).toBeGreaterThanOrEqual(1);
    expect(base.despesas.filter((d) => d.pagaEm).length).toBeGreaterThan(20);
    expect(por(base.despesas, c.despesaSemContrato).contratoId).toBeNull();
    for (const cat of ["imposto", "cartorio", "certidao", "despachante"])
      expect(base.despesas.some((d) => d.categoria === cat)).toBe(true);
  });
  it("contatos (RF-74): proprietários batem com as partes do contrato", () => {
    const donos = base.contatos.filter((x) => x.papel === "proprietario");
    expect(donos.length).toBeGreaterThan(10);
    for (const d of donos) {
      const k = por(base.contratos, d.contratoIds[0]!);
      expect(k.partes.map((p) => p.nome)).toContain(d.nome);
    }
  });
  it("os casos continuam presentes com outro hoje", () => {
    const { base: b2, casos } = gerarBaseComCasos({ hoje: OUTRO_HOJE });
    expect(
      parcelasAtrasadas(por(b2.contratos, casos.contratoTresParcelasAtrasadas) as Contrato, OUTRO_HOJE),
    ).toHaveLength(3);
    expect(por(b2.contratos, casos.contratoLocacaoVencido).fim < dataLocal(OUTRO_HOJE)).toBe(true);
    expect(mostrar(b2)).toBe("");
  });
});
