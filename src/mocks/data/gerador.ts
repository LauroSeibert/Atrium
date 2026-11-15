/**
 * Gerador determinístico da Base mock (docs/MODELO-DE-DADOS.md §4, Fase 5).
 *
 * - Mesma `semente` + mesmo `hoje` ⇒ Base idêntica (JSON byte a byte).
 * - Todas as datas são relativas a `hoje`. As entidades, seus IDs e os casos de borda não dependem
 *   de `hoje`; o número de atividades/registros (e portanto `seq`) varia um pouco com a data.
 * - Só usa helpers puros do domínio (`gerarParcelas`, `gerarComissao`, `dataLocal`, `mesesEntre`);
 *   estados finais são montados direto na construção (nada de `x.status = …`).
 * - IDs saem de um contador único (`prefixo_` + base36 com 4 dígitos, como o domínio), e
 *   `seq` = contador, então os IDs novos do domínio nunca colidem.
 *
 * Etapa do kanban deixada VAZIA de propósito: "contato" (estado vazio da coluna, RF-30).
 */
import {
  dataLocal,
  gerarComissao,
  gerarParcelas,
  type Atividade,
  type ValorBruto,
  type Base,
  type Comissao,
  type Comodo,
  type Contrato,
  type Corretor,
  type Etapa,
  type Fachada,
  type Finalidade,
  type Imovel,
  type Lead,
  type MotivoPerda,
  type Parcela,
  type Parte,
  type RegistroAlteracao,
  type StatusContrato,
  type StatusImovel,
  type StatusVisita,
  type TipoImovel,
  type Visita,
} from "@/domain";
import { criarAleatorio } from "./aleatorio";
import {
  CIDADES,
  DESCRICOES,
  DIFERENCIAIS_COMERCIAL,
  DIFERENCIAIS_RESIDENCIAL,
  DIFERENCIAIS_TERRENO,
  EQUIPE,
  LOGRADOUROS,
  MOTIVOS_CANCELAMENTO,
  MOTIVOS_INATIVO,
  NOME_LONGO_LEAD,
  NOTAS_LEAD,
  OBS_VISITA,
  TITULOS,
  TITULO_LONGO,
  cnpjFicticio,
  cpfFicticio,
  creciFicticio,
  emailDe,
  nomeCompleto,
  telefoneFicticio,
} from "./catalogo";

export type OpcoesGerador = {
  /** Semente do PRNG (padrão 2026). */
  semente?: number;
  /** "Agora" em ISO com hora; todas as datas são relativas a ele. Padrão: o relógio real. */
  hoje?: string;
};

export type CasosDeBorda = {
  corretorNomeLongo: string;
  leadNomeLongo: string;
  /** Leads com `contato: {}` (o primeiro é o caso canônico). */
  leadSemContato: string;
  leadsSemContato: string[];
  imovelTituloLongo: string;
  imovelTerrenoSemComodos: string;
  /** Imóveis com `fachada: null` (a UI usa o fallback do PropertyImage). */
  imoveisSemIlustracao: string[];
  /** Locação `ativo` cujo `fim` já passou (precisa ser encerrada). */
  contratoLocacaoVencido: string;
  /** Contrato ativo com exatamente 3 parcelas atrasadas. */
  contratoTresParcelasAtrasadas: string;
  imovelAluguelMinimo: string;
  contratoAluguelMinimo: string;
  imovelVendaMaxima: string;
  contratoVendaMaxima: string;
  /** Etapa do kanban sem nenhum lead. */
  etapaVazia: Etapa;
};

const DIA = 86_400_000;
const HORA = 3_600_000;
const SEMENTE_PADRAO = 2026;
const HOJE_DOS_CASOS = "2026-11-14T12:00:00.000Z";

type Papel = "ativo" | "encerrado" | "cancelado" | "rascunho" | "livre";
type Especificacao = {
  tipo: TipoImovel;
  finalidade: Finalidade;
  papel: Papel;
  extremo?: "maximo" | "minimo";
  status: StatusImovel;
};

type Evento = {
  quando: number;
  atividade: Omit<Atividade, "id" | "criadoEm">;
  alteracoes?: Omit<RegistroAlteracao, "id" | "em" | "autorId">[];
};

const rep = <T>(n: number, v: T): T[] => Array.from({ length: n }, () => v);
const arred = (v: number, passo: number) => Math.round(v / passo) * passo;
const iniciaisDe = (nome: string) => {
  const p = nome.split(" ").filter((x) => x.length > 2 || x === x.toUpperCase());
  return ((p[0]?.[0] ?? "A") + (p.length > 1 ? (p[p.length - 1]?.[0] ?? "") : "")).toUpperCase();
};

export function gerarBase(opcoes: OpcoesGerador = {}): Base {
  return construir(opcoes).base;
}

/** Igual a `gerarBase`, mas devolve também os IDs dos casos de borda dessa Base. */
export function gerarBaseComCasos(opcoes: OpcoesGerador = {}): { base: Base; casos: CasosDeBorda } {
  return construir(opcoes);
}

function construir(opcoes: OpcoesGerador): { base: Base; casos: CasosDeBorda } {
  const semente = opcoes.semente ?? SEMENTE_PADRAO;
  const hoje = opcoes.hoje ?? new Date().toISOString();
  const hojeMs = Date.parse(hoje);
  if (Number.isNaN(hojeMs)) throw new Error(`gerarBase: "hoje" inválido (${hoje})`);
  const hojeData = dataLocal(hoje);
  const r = criarAleatorio(semente);

  let contador = 1;
  const novoId = (prefixo: string) => `${prefixo}_${(contador++).toString(36).padStart(4, "0")}`;

  // ----- datas ---------------------------------------------------------------------------
  const addDias = (data: string, n: number) =>
    new Date(Date.parse(`${data}T00:00:00Z`) + n * DIA).toISOString().slice(0, 10);
  const addMeses = (data: string, m: number) => {
    const [a, mes, d] = data.split("-").map(Number) as [number, number, number];
    const total = a * 12 + (mes - 1) + m;
    return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}-${String(Math.min(d, 28)).padStart(2, "0")}`;
  };
  const dataRel = (diasAtras: number) => addDias(hojeData, -diasAtras);
  const diasAtras = (data: string) =>
    Math.round((Date.parse(`${hojeData}T00:00:00Z`) - Date.parse(`${data}T00:00:00Z`)) / DIA);
  const limite = hojeMs - HORA / 2;
  /** Instante (UTC) do dia `data`, na hora UTC `hh` (12–21 UTC = horário comercial em São Paulo). */
  const ms = (data: string, hh: number, mm = 0) =>
    Date.parse(`${data}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00.000Z`);
  const iso = (t: number) => new Date(t).toISOString();
  const passado = (t: number) => iso(Math.min(t, limite));
  const horaComercial = () => r.inteiro(12, 20);
  const emDias = (dias: number, hh = horaComercial()) => Math.min(ms(dataRel(dias), hh, r.inteiro(0, 59)), limite);

  // ----- corretores ----------------------------------------------------------------------
  const comVariante = new Set([0, 1, 2, 4, 6]);
  const corretores: Corretor[] = EQUIPE.map((m, i) => {
    const cidade = CIDADES[i % 3]!;
    const metaMensal =
      m.papel === "gestor"
        ? 60_000_000
        : m.papel === "financeiro"
          ? 5_000_000
          : r.centavosEntre(15_000_000, 40_000_000, 500_000);
    return {
      id: novoId("cor"),
      nome: m.nome,
      email: emailDe(m.nome),
      telefone: telefoneFicticio(r, cidade.ddd),
      creci: creciFicticio(r, cidade.uf),
      avatar: {
        iniciais: iniciaisDe(m.nome),
        ...(comVariante.has(i) ? { variante: (i % 6) + 1 } : {}),
      },
      papel: m.papel,
      metaMensal,
      ativo: true,
    };
  });
  const vendedores = corretores.filter((c) => c.papel === "corretor");
  const gestor = corretores.find((c) => c.papel === "gestor")!;
  const financeiro = corretores.find((c) => c.papel === "financeiro")!;

  // ----- especificações dos imóveis -----------------------------------------------------
  const tiposVenda: TipoImovel[] = r.embaralhar([
    ...rep(6, "terreno" as const),
    ...rep(4, "cobertura" as const),
    ...rep(8, "casa" as const),
    ...rep(7, "apartamento" as const),
    ...rep(3, "comercial" as const),
  ]);
  const papeisVenda = r.embaralhar<Papel>([
    ...rep(7, "ativo" as const),
    ...rep(3, "encerrado" as const),
    "cancelado",
    "rascunho",
    ...rep(16, "livre" as const),
  ]);
  const tiposLoc: TipoImovel[] = r.embaralhar([
    ...rep(11, "apartamento" as const),
    ...rep(4, "casa" as const),
    ...rep(5, "comercial" as const),
  ]);
  const papeisLoc = r.embaralhar<Papel>([
    ...rep(11, "ativo" as const),
    ...rep(3, "encerrado" as const),
    ...rep(2, "cancelado" as const),
    ...rep(2, "rascunho" as const),
    ...rep(2, "livre" as const),
  ]);
  const garantirAtivo = (tipos: TipoImovel[], papeis: Papel[], tipo: TipoImovel) => {
    const i = tipos.indexOf(tipo);
    if (papeis[i] === "ativo") return i;
    const j = papeis.indexOf("ativo");
    [papeis[i], papeis[j]] = [papeis[j]!, papeis[i]!];
    return i;
  };
  const iMax = garantirAtivo(tiposVenda, papeisVenda, "cobertura");
  const iMin = garantirAtivo(tiposLoc, papeisLoc, "apartamento");
  const espBruta = r.embaralhar<Omit<Especificacao, "status">>([
    ...tiposVenda.map((tipo, i) => ({
      tipo,
      finalidade: "venda" as const,
      papel: papeisVenda[i]!,
      ...(i === iMax ? { extremo: "maximo" as const } : {}),
    })),
    ...tiposLoc.map((tipo, i) => ({
      tipo,
      finalidade: "locacao" as const,
      papel: papeisLoc[i]!,
      ...(i === iMin ? { extremo: "minimo" as const } : {}),
    })),
  ]);
  const statusLivres = r.embaralhar<StatusImovel>([
    ...rep(4, "reservado" as const),
    ...rep(4, "inativo" as const),
    ...rep(10, "disponivel" as const),
  ]);
  let rascunhoVendaReservado = false;
  const specs: Especificacao[] = espBruta.map((e) => {
    let status: StatusImovel = "disponivel";
    if (e.papel === "livre") status = statusLivres.pop()!;
    else if (e.papel === "ativo" || (e.papel === "encerrado" && e.finalidade === "venda"))
      status = e.finalidade === "venda" ? "vendido" : "alugado";
    else if (e.papel === "rascunho" && e.finalidade === "venda" && !rascunhoVendaReservado) {
      status = "reservado";
      rascunhoVendaReservado = true;
    }
    return { ...e, status };
  });

  // Quais livres viram caso de borda (determinado por posição, não por sorteio).
  const idxLivresNaoTerreno = specs.flatMap((s, i) =>
    s.papel === "livre" && s.tipo !== "terreno" && s.status === "disponivel" ? [i] : [],
  );
  const idxSemIlustracao = new Set(idxLivresNaoTerreno.filter((i) => specs[i]!.tipo !== "comercial").slice(0, 2));
  const idxTituloLongo =
    idxLivresNaoTerreno.find(
      (i) => !idxSemIlustracao.has(i) && specs[i]!.tipo === "casa" && specs[i]!.finalidade === "venda",
    ) ?? idxLivresNaoTerreno.find((i) => !idxSemIlustracao.has(i))!;
  const idxTerrenoSemComodos = specs.findIndex((s) => s.tipo === "terreno");

  // ----- imóveis -----------------------------------------------------------------------
  type DraftImovel = Omit<Imovel, "criadoEm" | "atualizadoEm"> & { criadoDias: number };
  const draftsImoveis: DraftImovel[] = specs.map((s, idx) => {
    const cidade = r.ponderado(
      CIDADES,
      CIDADES.map((c) => c.peso),
    );
    const bairro = r.escolher(cidade.bairros);
    const max = s.extremo === "maximo";
    const min = s.extremo === "minimo";
    let quartos = 0;
    let suites = 0;
    let banheiros = 0;
    let vagas = 0;
    let areaUtil: number;
    let areaTotal: number;
    switch (s.tipo) {
      case "apartamento":
        quartos = min ? 1 : r.ponderado([1, 2, 3, 4], [2, 5, 5, 1]);
        areaUtil = min ? 24 : 28 + quartos * 22 + r.inteiro(-6, 20);
        areaTotal = min ? 24 : Math.round(areaUtil * r.escolher([1.1, 1.15, 1.2]));
        suites = min ? 0 : Math.min(quartos, r.inteiro(0, quartos >= 2 ? 2 : 1));
        banheiros = Math.max(suites, 1) + (quartos >= 3 && r.chance(0.6) ? 1 : 0);
        vagas = min ? 0 : r.ponderado([0, 1, 2, 3], [1, 5, 4, 1]);
        break;
      case "casa":
        quartos = r.ponderado([2, 3, 4, 5], [2, 5, 4, 1]);
        areaUtil = 70 + quartos * 28 + r.inteiro(-10, 40);
        areaTotal = Math.round(areaUtil * (1.3 + r.proximo() * 1.3));
        suites = r.inteiro(0, Math.min(quartos, 3));
        banheiros = Math.max(suites, 1) + r.inteiro(0, 2);
        vagas = r.ponderado([1, 2, 3, 4], [2, 5, 3, 1]);
        break;
      case "cobertura":
        quartos = max ? 5 : r.ponderado([3, 4, 5], [3, 4, 1]);
        areaUtil = max ? 620 : 150 + quartos * 30 + r.inteiro(0, 60);
        areaTotal = Math.round(areaUtil * 1.25);
        suites = max ? 5 : r.inteiro(2, quartos);
        banheiros = suites + r.inteiro(1, 2);
        vagas = max ? 6 : r.inteiro(3, 5);
        break;
      case "comercial":
        areaUtil = r.inteiro(35, 380);
        areaTotal = Math.round(areaUtil * 1.1);
        banheiros = r.ponderado([1, 2, 3, 4], [5, 4, 2, 1]);
        vagas = r.inteiro(0, 6);
        break;
      case "terreno":
        areaTotal = arred(r.inteiro(250, 1000), 5);
        areaUtil = areaTotal;
        break;
    }
    // preço (em reais) -------------------------------------------------------------------
    let reais: number;
    if (s.finalidade === "venda") {
      const ppm = {
        apartamento: [6000, 12000],
        casa: [4000, 9000],
        cobertura: [11000, 16000],
        terreno: [500, 1500],
        comercial: [7000, 14000],
      }[s.tipo]!;
      const base = (s.tipo === "terreno" ? areaTotal : areaUtil) * r.inteiro(ppm[0]!, ppm[1]!);
      reais = Math.min(3_000_000, Math.max(250_000, arred(base, 5000)));
      if (max) reais = 12_000_000;
    } else {
      const ppm = { apartamento: [28, 55], casa: [20, 40], comercial: [35, 80], cobertura: [60, 80], terreno: [1, 1] }[
        s.tipo
      ]!;
      const teto = { apartamento: 6000, casa: 9000, comercial: 15000, cobertura: 15000, terreno: 1500 }[s.tipo]!;
      reais = Math.min(teto, Math.max(1500, arred(areaUtil * r.inteiro(ppm[0]!, ppm[1]!), 50)));
      if (min) reais = 900;
    }
    // condomínio mensal / IPTU anual -------------------------------------------------------
    let condominio: number | null = null;
    if (s.tipo === "apartamento") condominio = arred(areaUtil * r.inteiro(6, 12), 10);
    else if (s.tipo === "cobertura") condominio = max ? 9000 : arred(areaUtil * r.inteiro(10, 18), 10);
    else if (s.tipo === "comercial") condominio = arred(areaUtil * r.inteiro(8, 15), 10);
    else if (s.tipo === "casa") {
      const fechado = r.chance(0.25);
      const v = arred(r.inteiro(400, 1200), 10);
      condominio = fechado ? v : null;
    }
    const iptu =
      s.finalidade === "venda" ? arred(reais * (0.0025 + r.proximo() * 0.0035), 10) : arred(r.inteiro(900, 5000), 10);

    // cômodos ----------------------------------------------------------------------------
    const comodos: Comodo[] = [];
    if (s.tipo !== "terreno") {
      const cru: { tipo: Comodo["tipo"]; nome: string; area: number | null }[] = [];
      const u = areaUtil;
      if (s.tipo === "comercial") {
        cru.push({ tipo: "sala", nome: "Sala principal", area: u * (0.5 + r.proximo() * 0.2) });
        if (r.chance(0.6)) cru.push({ tipo: "cozinha", nome: "Copa", area: 6 });
        if (r.chance(0.5)) cru.push({ tipo: "escritorio", nome: "Sala de reunião", area: u * 0.15 });
        for (let b = 1; b <= banheiros; b++)
          cru.push({ tipo: "banheiro", nome: `Banheiro ${b}`, area: 3 + r.proximo() * 2 });
        if (vagas > 0) cru.push({ tipo: "garagem", nome: "Estacionamento", area: vagas * 12 });
      } else {
        cru.push({
          tipo: "sala",
          nome: r.escolher(["Sala de estar", "Sala de estar e jantar"]),
          area: u * (0.18 + r.proximo() * 0.07),
        });
        cru.push({
          tipo: "cozinha",
          nome: r.escolher(["Cozinha", "Cozinha americana"]),
          area: u * (0.08 + r.proximo() * 0.04),
        });
        for (let q = 0; q < quartos; q++)
          cru.push({
            tipo: "quarto",
            nome: q < suites ? (q === 0 ? "Suíte master" : `Suíte ${q + 1}`) : `Quarto ${q + 1}`,
            area: u * (q === 0 ? 0.12 : 0.08) + r.proximo() * 3,
          });
        if (quartos === 0) cru.push({ tipo: "quarto", nome: "Quarto", area: 10 });
        const sociais = Math.max(banheiros - suites, 0);
        for (let b = 0; b < sociais; b++)
          cru.push({ tipo: "banheiro", nome: b === 0 ? "Banheiro social" : "Lavabo", area: 3.5 + r.proximo() * 2.5 });
        if (s.tipo === "apartamento" && r.chance(0.7))
          cru.push({ tipo: "varanda", nome: "Varanda", area: 5 + r.proximo() * 5 });
        if (s.tipo === "cobertura") cru.push({ tipo: "varanda", nome: "Terraço", area: 25 + r.proximo() * 35 });
        if (s.tipo === "casa" && r.chance(0.4))
          cru.push({ tipo: "varanda", nome: "Varanda", area: 8 + r.proximo() * 8 });
        if (vagas > 0)
          cru.push({
            tipo: "garagem",
            nome: vagas === 1 ? "Garagem" : `Garagem (${vagas} vagas)`,
            area: r.chance(0.3) ? null : vagas * 12,
          });
        if (s.tipo === "cobertura")
          cru.push({ tipo: "areaGourmet", nome: "Área gourmet com churrasqueira", area: 20 + r.proximo() * 10 });
        else if (s.tipo === "casa" && r.chance(0.5))
          cru.push({ tipo: "areaGourmet", nome: "Área gourmet", area: 12 + r.proximo() * 18 });
        if (r.chance(0.25)) cru.push({ tipo: "escritorio", nome: "Escritório", area: 8 + r.proximo() * 6 });
      }
      const soma = cru.reduce((acc, c) => acc + (c.area ?? 0), 0);
      const fator = soma > u * 0.92 ? (u * 0.92) / soma : 1;
      for (const c of cru)
        comodos.push({
          tipo: c.tipo,
          nome: c.nome,
          area: c.area === null ? null : Math.max(1, Math.round(c.area * fator * 10) / 10),
        });
    }

    const diferenciais = (() => {
      const pool =
        s.tipo === "terreno"
          ? DIFERENCIAIS_TERRENO
          : s.tipo === "comercial"
            ? DIFERENCIAIS_COMERCIAL
            : DIFERENCIAIS_RESIDENCIAL;
      const n = s.tipo === "terreno" ? r.inteiro(1, 3) : s.tipo === "casa" ? r.inteiro(1, 4) : r.inteiro(2, 6);
      return r.embaralhar(pool).slice(0, n);
    })();

    const area = Math.round(s.tipo === "terreno" ? areaTotal : areaUtil);
    const ctx = { quartos, suites, area, bairro, cidade: cidade.nome };
    let titulo = r.escolher(TITULOS[s.tipo])(ctx);
    if (s.finalidade === "locacao" && r.chance(0.4)) titulo += " para alugar";
    if (min) titulo = `Kitnet mobiliada no ${bairro}`;
    if (max) titulo = `Cobertura triplex de alto padrão com vista para o parque, ${bairro}`;
    if (idx === idxTituloLongo) titulo = TITULO_LONGO;
    const descricao = `${r.escolher(DESCRICOES[s.tipo])} ${s.finalidade === "venda" ? "Aceita financiamento." : "Disponível para locação imediata."}`;
    const fachada: Fachada | null = idxSemIlustracao.has(idx)
      ? null
      : (
          {
            casa: r.escolher(["terrea", "sobrado", "moderna", "campo"] as const),
            apartamento: "predio",
            cobertura: "cobertura",
            comercial: "comercial",
            terreno: "terreno",
          } as const
        )[s.tipo];

    return {
      id: novoId("imv"),
      codigo: `AT-${String(idx + 1).padStart(4, "0")}`,
      status: s.status,
      favorito: r.chance(0.2),
      motivoInativo: s.status === "inativo" ? r.escolher(MOTIVOS_INATIVO) : null,
      titulo,
      descricao,
      tipo: s.tipo,
      finalidade: s.finalidade,
      preco: reais * 100,
      condominio: condominio === null ? null : condominio * 100,
      iptu: iptu * 100,
      areaUtil,
      areaTotal,
      quartos,
      suites,
      banheiros,
      vagas,
      endereco: {
        logradouro: r.escolher(LOGRADOUROS),
        numero: String(r.inteiro(10, 2400)),
        bairro,
        cidade: cidade.nome,
        uf: cidade.uf,
        cep: cidade.cep + String(r.inteiro(0, 99999)).padStart(5, "0"),
      },
      comodos,
      diferenciais,
      corretorId: r.escolher(vendedores).id,
      fachada,
      criadoDias: r.inteiro(12, 330), // provisório; contratos antecipam (abaixo)
    };
  });
  const papelDe = new Map(draftsImoveis.map((d, i) => [d.id, specs[i]!.papel] as const));
  const imovelDe = new Map(draftsImoveis.map((d) => [d.id, d] as const));

  // ----- contratos (esqueleto) ---------------------------------------------------------
  type Esqueleto = {
    contrato: Contrato; // leadId/partes/numero provisórios
    dInicio: number; // dias atrás do início (negativo = futuro)
    criadoDias: number;
    assinaturaDias: number | null;
    fimEventoDias: number | null; // encerramento/cancelamento
    papel: Exclude<Papel, "livre">;
    especial: "maximo" | "minimo" | "tresAtrasadas" | "vencido" | null;
  };

  const pagar = (
    parcelas: Parcela[],
    modo: { tipo: "todas" } | { tipo: "atrasadas"; k: number } | { tipo: "primeiras"; n: number },
  ): Parcela[] => {
    const offs = parcelas.map(() => r.inteiro(0, 5));
    const vencidas = parcelas.filter((p) => p.vencimento < hojeData).map((p) => p.numero);
    const emAtraso =
      modo.tipo === "atrasadas" ? new Set(vencidas.slice(Math.max(0, vencidas.length - modo.k))) : new Set<number>();
    return parcelas.map((p, i) => {
      let paga: boolean;
      if (modo.tipo === "todas") paga = true;
      else if (modo.tipo === "primeiras") paga = i < modo.n;
      else paga = p.vencimento < hojeData && !emAtraso.has(p.numero);
      return paga ? { ...p, pagoEm: passado(ms(p.vencimento, 15) + offs[i]! * DIA) } : p;
    });
  };

  const duracoes = [12, 12, 18, 24, 24, 30];
  const esqueletos: Esqueleto[] = [];
  const naoLivres = draftsImoveis.filter((d) => papelDe.get(d.id) !== "livre");
  // 12 e 15 meses atrás tornam "vencido" possível; ordem estável: venda antes de locação.
  const ordenados = [...naoLivres].sort((a, b) =>
    a.finalidade === b.finalidade ? 0 : a.finalidade === "venda" ? -1 : 1,
  );
  let jaTresAtrasadas = false;
  let jaVencido = false;
  for (const im of ordenados) {
    const papel = papelDe.get(im.id) as Exclude<Papel, "livre">;
    const spec = specs[draftsImoveis.indexOf(im)]!;
    const tipo = im.finalidade;
    const id = novoId("ctr");
    let inicio: string;
    let fim: string;
    let valor: number;
    let parcelas: Parcela[] = [];
    let status: StatusContrato;
    let especial: Esqueleto["especial"] = null;
    let assinaturaDias: number | null = null;
    let fimEventoDias: number | null = null;
    let motivo: string | null = null;
    let comissaoPaga = false;

    if (tipo === "venda") {
      valor = spec.extremo === "maximo" ? im.preco : arred(Math.round(im.preco * (0.93 + r.proximo() * 0.07)), 100_000);
      if (spec.extremo === "maximo") especial = "maximo";
      if (papel === "ativo") {
        status = "ativo";
        const n = spec.extremo === "maximo" ? 4 : r.ponderado([1, 2, 3, 4], [1, 3, 3, 3]);
        const d = n === 1 ? r.inteiro(8, 20) : r.inteiro(5, (n - 1) * 30 - 3);
        inicio = dataRel(d);
        const base = gerarParcelas({ tipo, valor, inicio, fim: inicio }, n);
        fim = addDias(base[n - 1]!.vencimento, r.inteiro(15, 30));
        parcelas = pagar(base, { tipo: "atrasadas", k: n === 1 ? 1 : r.chance(0.2) ? 1 : 0 });
        assinaturaDias = d + r.inteiro(0, 3);
        comissaoPaga = d > 20;
      } else if (papel === "encerrado") {
        status = "encerrado";
        const n = r.inteiro(1, 3);
        const d = r.inteiro(120, 300);
        inicio = dataRel(d);
        const base = gerarParcelas({ tipo, valor, inicio, fim: inicio }, n);
        fim = addDias(base[n - 1]!.vencimento, r.inteiro(10, 25));
        parcelas = pagar(base, { tipo: "todas" });
        assinaturaDias = d + r.inteiro(0, 3);
        fimEventoDias = diasAtras(fim);
        comissaoPaga = true;
      } else if (papel === "cancelado") {
        status = "cancelado";
        const d = r.inteiro(60, 150);
        inicio = dataRel(d);
        const base = gerarParcelas({ tipo, valor, inicio, fim: inicio }, 2);
        fim = addDias(base[1]!.vencimento, 20);
        parcelas = pagar(base, { tipo: "primeiras", n: 1 });
        assinaturaDias = d + r.inteiro(0, 3);
        fimEventoDias = d - r.inteiro(20, 40);
        motivo = r.escolher(MOTIVOS_CANCELAMENTO);
      } else {
        status = "rascunho";
        inicio = dataRel(-r.inteiro(7, 30));
        const base = gerarParcelas({ tipo, valor, inicio, fim: inicio }, 2);
        fim = addDias(base[1]!.vencimento, 20);
      }
    } else {
      valor = spec.extremo === "minimo" ? 90_000 : arred(Math.round(im.preco * (0.95 + r.proximo() * 0.05)), 5_000);
      const dur = r.escolher(duracoes);
      const clamp = (d: string) => `${d.slice(0, 8)}${String(Math.min(Number(d.slice(8)), 28)).padStart(2, "0")}`;
      let k = 0;
      if (papel === "ativo") {
        status = "ativo";
        let durAtual = dur;
        if (!jaVencido && spec.extremo !== "minimo") {
          jaVencido = true;
          especial = "vencido";
          durAtual = 12;
          inicio = clamp(addMeses(dataRel(r.inteiro(30, 60)), -12));
        } else if (!jaTresAtrasadas && spec.extremo !== "minimo") {
          jaTresAtrasadas = true;
          especial = "tresAtrasadas";
          durAtual = 24;
          inicio = clamp(dataRel(r.inteiro(150, 250)));
          k = 3;
        } else {
          inicio = clamp(dataRel(r.inteiro(25, 330)));
          k = r.ponderado([0, 1, 2], [6, 2, 1]);
          if (spec.extremo === "minimo") {
            especial = "minimo";
            k = 0;
          }
        }
        fim = addMeses(inicio, durAtual);
        parcelas = pagar(gerarParcelas({ tipo, valor, inicio, fim }), { tipo: "atrasadas", k });
        assinaturaDias = diasAtras(inicio) + r.inteiro(0, 3);
        comissaoPaga = diasAtras(inicio) > 20;
        if (especial === "vencido") k = 0;
      } else if (papel === "encerrado") {
        status = "encerrado";
        const durE = r.escolher([12, 18]);
        inicio = clamp(addMeses(dataRel(r.inteiro(25, 110)), -durE));
        fim = addMeses(inicio, durE);
        parcelas = pagar(gerarParcelas({ tipo, valor, inicio, fim }), { tipo: "todas" });
        assinaturaDias = diasAtras(inicio) + r.inteiro(0, 3);
        fimEventoDias = diasAtras(fim);
        comissaoPaga = true;
      } else if (papel === "cancelado") {
        status = "cancelado";
        const d = r.inteiro(120, 300);
        inicio = clamp(dataRel(d));
        fim = addMeses(inicio, r.escolher([12, 24]));
        const pagas = r.inteiro(1, 3);
        parcelas = pagar(gerarParcelas({ tipo, valor, inicio, fim }), { tipo: "primeiras", n: pagas });
        assinaturaDias = d + r.inteiro(0, 3);
        fimEventoDias = diasAtras(inicio) - (30 * pagas + r.inteiro(5, 25));
        motivo = r.escolher(MOTIVOS_CANCELAMENTO);
      } else {
        status = "rascunho";
        inicio = clamp(dataRel(-r.inteiro(7, 40)));
        fim = addMeses(inicio, r.escolher([12, 24]));
      }
    }

    const dInicio = diasAtras(inicio);
    const criadoDias = papel === "rascunho" ? r.inteiro(1, 6) : dInicio + r.inteiro(4, 14);
    const comissoes: Comissao[] =
      papel === "rascunho"
        ? []
        : [
            (() => {
              const c = gerarComissao(
                { tipo, valor, inicio },
                im.corretorId,
                tipo === "venda" ? r.escolher([5, 5.5, 6]) : r.escolher([8, 8.5, 9, 10]),
              );
              const pagaT = ms(addDias(inicio, r.inteiro(3, 15)), 16);
              return papel !== "cancelado" && comissaoPaga && pagaT < limite ? { ...c, pagaEm: iso(pagaT) } : c;
            })(),
          ];
    const contrato: Contrato = {
      id,
      numero: "CT-0000-0000",
      tipo,
      imovelId: im.id,
      leadId: null,
      partes: [],
      valor,
      inicio,
      fim,
      status,
      motivoCancelamento: motivo,
      taxaAdministracao: tipo === "locacao" ? r.inteiro(8, 12) : null,
      parcelas,
      comissoes,
      criadoEm: iso(0),
      atualizadoEm: iso(0),
    };
    esqueletos.push({ contrato, dInicio, criadoDias, assinaturaDias, fimEventoDias, papel, especial });
  }
  const skDe = new Map(esqueletos.map((e) => [e.contrato.imovelId, e] as const));

  // Antecipa a criação dos imóveis com contrato (o imóvel existe antes do contrato).
  for (const e of esqueletos) {
    const im = imovelDe.get(e.contrato.imovelId)!;
    im.criadoDias = e.criadoDias + r.inteiro(45, 200);
  }
  const criadoMsImovel = new Map(draftsImoveis.map((d) => [d.id, emDias(d.criadoDias, 11)] as const));
  const criadoMsContrato = new Map(esqueletos.map((e) => [e.contrato.id, emDias(e.criadoDias, 10)] as const));

  // ----- leads -------------------------------------------------------------------------
  type DraftLead = {
    lead: Lead;
    criadoDias: number;
    ultimoDias: number;
    sk: Esqueleto | null;
    visitaContratoDias: number | null;
    fechadoDias: number | null;
  };
  const contratosComLead = r
    .embaralhar(esqueletos.filter((e) => e.papel === "ativo" || e.papel === "encerrado"))
    .slice(0, 16);
  const comLeadIds = new Set(contratosComLead.map((e) => e.contrato.id));
  // Os casos especiais ganham lead para a ficha mostrar vínculo.
  for (const e of esqueletos) {
    if (e.especial && !comLeadIds.has(e.contrato.id) && e.papel === "ativo") {
      const troca = contratosComLead.findIndex((x) => !x.especial);
      if (troca >= 0) {
        comLeadIds.delete(contratosComLead[troca]!.contrato.id);
        contratosComLead[troca] = e;
        comLeadIds.add(e.contrato.id);
      }
    }
  }

  const motivos: MotivoPerda[] = ["preco", "localizacao", "desistencia", "concorrencia", "outro"];
  const origens = ["site", "portal", "indicacao", "whatsapp", "placa", "redes"] as const;
  const cidadeDeBairro = (b: string) => CIDADES.find((c) => c.bairros.includes(b)) ?? CIDADES[0]!;

  const montarLead = (etapa: Etapa, dados: { sk?: Esqueleto }, idxLead: number): DraftLead => {
    const sk = dados.sk ?? null;
    const im = sk ? imovelDe.get(sk.contrato.imovelId)! : null;
    const fin: Finalidade = sk ? sk.contrato.tipo : r.chance(0.55) ? "venda" : "locacao";
    const poolTipos: TipoImovel[] =
      fin === "venda"
        ? ["casa", "apartamento", "cobertura", "terreno", "comercial"]
        : ["apartamento", "casa", "comercial"];
    const tipos = im ? [im.tipo] : r.embaralhar(poolTipos).slice(0, r.inteiro(1, 2));
    const cidade = im
      ? cidadeDeBairro(im.endereco.bairro)
      : r.ponderado(
          CIDADES,
          CIDADES.map((c) => c.peso),
        );
    const bairros = im ? [im.endereco.bairro] : r.embaralhar(cidade.bairros).slice(0, r.inteiro(1, 3));
    const residencial = tipos.some((t) => t === "casa" || t === "apartamento" || t === "cobertura");
    const quartosMin = im
      ? im.quartos > 0
        ? Math.max(1, im.quartos - r.inteiro(0, 1))
        : undefined
      : residencial && r.chance(0.6)
        ? r.inteiro(1, 4)
        : undefined;
    const orcamento = sk
      ? arred(Math.round(sk.contrato.valor * (1 + r.proximo() * 0.15)), 10_000)
      : r.chance(0.15)
        ? null
        : fin === "venda"
          ? arred(r.inteiro(250_000, 2_500_000), 10_000) * 100
          : arred(r.inteiro(1500, 12000), 100) * 100;
    const nome = idxLead === 3 ? NOME_LONGO_LEAD : nomeCompleto(r);
    const tel = r.chance(0.85);
    const mail = r.chance(0.65);
    const contato = {
      ...(tel || !mail ? { telefone: telefoneFicticio(r, cidade.ddd) } : {}),
      ...(mail ? { email: emailDe(nome) } : {}),
    };

    let criadoDias: number;
    let ultimoDias: number;
    let visitaContratoDias: number | null = null;
    let fechadoDias: number | null = null;
    if (sk) {
      visitaContratoDias = sk.dInicio + r.inteiro(16, 30);
      criadoDias = visitaContratoDias + r.inteiro(3, 45);
      fechadoDias = sk.criadoDias + r.inteiro(0, 2);
      ultimoDias = fechadoDias;
    } else {
      criadoDias = {
        novo: r.inteiro(0, 25),
        visita: r.inteiro(20, 150),
        proposta: r.inteiro(30, 180),
        perdido: r.inteiro(40, 300),
        fechado: r.inteiro(90, 250),
        contato: 10,
      }[etapa];
      ultimoDias = etapa === "novo" ? criadoDias : r.inteiro(0, Math.max(0, criadoDias - 3));
    }
    const responsavelId = im ? im.corretorId : r.escolher(vendedores).id;
    const lead: Lead = {
      id: novoId("lead"),
      nome,
      contato,
      origem: r.escolher(origens),
      etapa,
      motivoPerda: etapa === "perdido" ? r.escolher(motivos) : null,
      interesse: { finalidade: fin, tipos, bairros, ...(quartosMin ? { quartosMin } : {}) },
      orcamento,
      imoveisVistos: [],
      responsavelId,
      ordem: 0,
      criadoEm: iso(0),
      atualizadoEm: iso(0),
    };
    return { lead, criadoDias, ultimoDias, sk, visitaContratoDias, fechadoDias };
  };

  const pares = new Map(contratosComLead.map((e) => [e.contrato.id, e] as const));
  const fechadosNaoPareados = 17 - pares.size;
  const etapasLivres = r.embaralhar<Etapa>([
    ...rep(9, "novo" as const),
    ...rep(14, "visita" as const),
    ...rep(8, "proposta" as const),
    ...rep(fechadosNaoPareados, "fechado" as const),
    ...rep(12, "perdido" as const),
  ]);
  const draftsLeads: DraftLead[] = [];
  let idxLead = 0;
  for (const e of pares.values()) draftsLeads.push(montarLead("fechado", { sk: e }, idxLead++));
  for (const etapa of etapasLivres) draftsLeads.push(montarLead(etapa, {}, idxLead++));
  // Casos: o 4º lead (pareado a contrato) tem nome muito longo; 3 leads sem contato.
  const leadsFinais: DraftLead[] = [...draftsLeads];
  const idxSemContato = leadsFinais
    .flatMap((d, i) => (!d.sk && (d.lead.etapa === "novo" || d.lead.etapa === "perdido") ? [i] : []))
    .slice(0, 3);
  idxSemContato.forEach((i) => {
    leadsFinais[i] = { ...leadsFinais[i]!, lead: { ...leadsFinais[i]!.lead, contato: {} } };
  });

  // ----- contratos (final) -------------------------------------------------------------
  const criadoMsLead = new Map(leadsFinais.map((d) => [d.lead.id, emDias(d.criadoDias, 10)] as const));
  const leadDeContrato = new Map(leadsFinais.filter((d) => d.sk).map((d) => [d.sk!.contrato.id, d.lead] as const));
  const contador_ano = new Map<number, number>();
  const ordemNumero = [...esqueletos].sort(
    (a, b) => b.criadoDias - a.criadoDias || a.contrato.id.localeCompare(b.contrato.id),
  );
  const numeros = new Map<string, string>();
  for (const e of ordemNumero) {
    const ano = Number(dataRel(e.criadoDias).slice(0, 4));
    const n = (contador_ano.get(ano) ?? 0) + 1;
    contador_ano.set(ano, n);
    numeros.set(e.contrato.id, `CT-${ano}-${String(n).padStart(4, "0")}`);
  }
  const partesDe = (e: Esqueleto): Parte[] => {
    const c = e.contrato;
    const im = imovelDe.get(c.imovelId)!;
    const lead = leadDeContrato.get(c.id);
    const comercial = im.tipo === "comercial" && r.chance(0.5);
    const cliente: Parte = {
      papel: c.tipo === "venda" ? "comprador" : "locatario",
      nome:
        lead?.nome ??
        (comercial
          ? `${r.escolher(["Alfa", "Boa Vista", "Delta", "Horizonte", "Nova Era"])} Serviços Ltda.`
          : nomeCompleto(r)),
      documento: comercial && !lead ? cnpjFicticio(r) : cpfFicticio(r),
    };
    const dono: Parte = {
      papel: c.tipo === "venda" ? "vendedor" : "locador",
      nome: nomeCompleto(r),
      documento: cpfFicticio(r),
    };
    const fiador: Parte[] =
      c.tipo === "locacao" && r.chance(0.4)
        ? [{ papel: "fiador", nome: nomeCompleto(r), documento: cpfFicticio(r) }]
        : [];
    return [cliente, dono, ...fiador];
  };

  // ----- visitas -----------------------------------------------------------------------
  const visitas: Visita[] = [];
  const usadas = new Set<string>();
  const imoveis = draftsImoveis;
  const pushVisita = (lead: Lead, imovelId: string, dataHora: number, status: StatusVisita) => {
    const chave = `${lead.id}|${imovelId}|${iso(dataHora).slice(0, 10)}`;
    if (usadas.has(chave)) return false;
    usadas.add(chave);
    visitas.push({
      id: novoId("vis"),
      imovelId,
      leadId: lead.id,
      corretorId: lead.responsavelId,
      dataHora: iso(dataHora),
      status,
      ...(r.chance(0.4) ? { observacao: r.escolher(OBS_VISITA) } : {}),
    });
    return true;
  };
  const visitaMs = (data: string) => ms(data, horaComercial(), r.chance(0.5) ? 0 : 30);

  for (const d of leadsFinais) {
    const etapa = d.lead.etapa;
    const nPast = {
      novo: 0,
      contato: 0,
      visita: r.inteiro(1, 3),
      proposta: r.inteiro(2, 3),
      fechado: r.inteiro(2, 3),
      perdido: r.inteiro(0, 3),
    }[etapa];
    let feitas = 0;
    const exigeRealizada = etapa === "proposta" || etapa === "fechado";
    if (d.sk) {
      const t = visitaMs(dataRel(d.visitaContratoDias!));
      pushVisita(d.lead, d.sk.contrato.imovelId, t, "realizada");
      feitas++;
    }
    for (let k = feitas; k < nPast; k++) {
      const menor = d.sk ? d.visitaContratoDias! + 1 : 1;
      const data = dataRel(r.inteiro(menor, Math.max(menor, d.criadoDias - 1)));
      const status: StatusVisita =
        exigeRealizada && k === 0 && !d.sk
          ? "realizada"
          : r.ponderado(["realizada", "cancelada", "naoCompareceu"] as const, [70, 17, 13]);
      const candidatos = imoveis.filter((im) => {
        if (im.finalidade !== d.lead.interesse.finalidade) return false;
        if (d.sk && im.id === d.sk.contrato.imovelId) return false;
        if (diasAtras(data) >= im.criadoDias) return false;
        const sk = skDe.get(im.id);
        if (sk && sk.papel !== "rascunho" && diasAtras(data) <= sk.dInicio + 10) return false;
        return true;
      });
      if (candidatos.length === 0) continue;
      pushVisita(d.lead, r.escolher(candidatos).id, visitaMs(data), status);
    }
  }
  // Visitas futuras: 9 nos próximos 7 dias, 6 entre 8 e 30 dias.
  const leadsFuturos = r
    .embaralhar(leadsFinais.filter((d) => d.lead.etapa === "visita" || d.lead.etapa === "proposta"))
    .slice(0, 15);
  leadsFuturos.forEach((d, i) => {
    const k = i < 9 ? r.inteiro(1, 7) : r.inteiro(8, 30);
    const candidatos = imoveis.filter(
      (im) =>
        im.finalidade === d.lead.interesse.finalidade && (im.status === "disponivel" || im.status === "reservado"),
    );
    const im = r.escolher(candidatos);
    pushVisita(d.lead, im.id, visitaMs(addDias(hojeData, k)), "agendada");
  });
  visitas.sort((a, b) => a.dataHora.localeCompare(b.dataHora));

  // imoveisVistos = imóveis de visitas realizadas, na ordem cronológica.
  const vistosDe = new Map<string, string[]>();
  for (const v of visitas)
    if (v.status === "realizada") {
      const l = vistosDe.get(v.leadId) ?? [];
      if (!l.includes(v.imovelId)) l.push(v.imovelId);
      vistosDe.set(v.leadId, l);
    }

  // ----- eventos (atividades + registros de alteração) ------------------------------------
  const eventos: Evento[] = [];
  const tocado = new Map<string, number>();
  const tocar = (id: string, t: number) => tocado.set(id, Math.max(tocado.get(id) ?? 0, t));
  const add = (
    quando: number,
    autorId: string,
    tipo: Atividade["tipo"],
    alvo: Atividade["alvo"],
    dados: Atividade["dados"],
    relacionados: Atividade["relacionados"] = [],
    alts: { campo: string; de: ValorBruto; para: ValorBruto }[] = [],
  ) => {
    eventos.push({
      quando,
      atividade: { tipo, alvo, relacionados, autorId, dados },
      alteracoes: alts.map((a) => ({ entidade: alvo, campo: a.campo, de: a.de, para: a.para })),
    });
    tocar(alvo.id, quando);
  };

  const imovelRef = (id: string) => ({ tipo: "imovel" as const, id });
  for (const im of draftsImoveis) {
    add(criadoMsImovel.get(im.id)!, im.corretorId, "imovelCriado", imovelRef(im.id), { codigo: im.codigo });
  }
  const criadoMsDe = (imovelId: string) => criadoMsImovel.get(imovelId)!;

  // Imóveis livres: reserva, inativação, voltas e mudanças de preço.
  const livres = draftsImoveis.filter(
    (d) => papelDe.get(d.id) === "livre" || papelDe.get(d.id) === "rascunho" || papelDe.get(d.id) === "cancelado",
  );
  const quandoApos = (imovelId: string) => {
    const d = imovelDe.get(imovelId)!;
    const dias = r.inteiro(1, Math.max(1, d.criadoDias - 3));
    return emDias(dias);
  };
  const statusEvento = (
    im: DraftImovel,
    de: StatusImovel,
    para: StatusImovel,
    quando: number,
    origem: string,
    motivo: string | null,
    autorId = im.corretorId,
  ) =>
    add(
      quando,
      autorId,
      "statusAlterado",
      imovelRef(im.id),
      { de, para, motivo, origem },
      [],
      [{ campo: "status", de, para }],
    );
  let voltas = 0;
  for (const im of livres) {
    const papel = papelDe.get(im.id)!;
    if (im.status === "reservado") statusEvento(im, "disponivel", "reservado", quandoApos(im.id), "usuario", null);
    else if (im.status === "inativo")
      statusEvento(im, "disponivel", "inativo", quandoApos(im.id), "usuario", im.motivoInativo);
    else if (papel === "livre" && voltas < 5) {
      voltas++;
      const t2 = quandoApos(im.id);
      const t1 = Math.max(criadoMsDe(im.id) + DIA, t2 - r.inteiro(2, 20) * DIA);
      if (t1 < t2) {
        statusEvento(im, "disponivel", "reservado", t1, "usuario", null);
        statusEvento(im, "reservado", "disponivel", t2, "usuario", null);
      }
    }
  }
  // preço alterado (12) + condomínio (2)
  const comPreco = r.embaralhar(livres.filter((d) => papelDe.get(d.id) === "livre")).slice(0, 14);
  comPreco.forEach((im, i) => {
    const campo = i < 12 ? "preco" : "condominio";
    const atual = im[campo];
    if (atual === null || atual === 0) return;
    const de = arred(Math.round(atual * r.escolher([1.04, 1.06, 1.08, 1.1, 0.95])), 10_000);
    if (de === atual) return;
    const quando = Math.max(criadoMsDe(im.id) + 3 * DIA, quandoApos(im.id));
    add(
      quando,
      im.corretorId,
      "precoAlterado",
      imovelRef(im.id),
      { campo, de, para: atual },
      [],
      [{ campo, de, para: atual }],
    );
  });

  // contratos
  for (const e of esqueletos) {
    const c = e.contrato;
    const im = imovelDe.get(c.imovelId)!;
    const cr = criadoMsContrato.get(c.id)!;
    const ref = { tipo: "contrato" as const, id: c.id };
    const num = numeros.get(c.id)!;
    const lead = leadDeContrato.get(c.id);
    add(cr, im.corretorId, "contratoCriado", ref, { numero: num, valor: c.valor }, [
      imovelRef(im.id),
      ...(lead ? [{ tipo: "lead" as const, id: lead.id }] : []),
    ]);
    if (e.assinaturaDias !== null) {
      const ass = Math.max(emDias(e.assinaturaDias, 14), cr + HORA);
      const final = c.tipo === "venda" ? "vendido" : "alugado";
      add(
        Math.min(ass, limite),
        im.corretorId,
        "statusAlterado",
        ref,
        { de: "rascunho", para: "ativo", motivo: null },
        [imovelRef(im.id)],
        [{ campo: "status", de: "rascunho", para: "ativo" }],
      );
      statusEvento(im, "disponivel", final, Math.min(ass + 60_000, limite), c.id, null);
      if (e.papel === "encerrado") {
        const t = Math.min(ms(c.fim, 17), limite);
        add(
          t,
          gestor.id,
          "statusAlterado",
          ref,
          { de: "ativo", para: "encerrado", motivo: null },
          [imovelRef(im.id)],
          [{ campo: "status", de: "ativo", para: "encerrado" }],
        );
        if (c.tipo === "locacao") statusEvento(im, "alugado", "disponivel", t + 60_000, c.id, null);
      }
      if (e.papel === "cancelado" && e.fimEventoDias !== null) {
        const t = Math.max(emDias(e.fimEventoDias, 15), ass + DIA);
        add(
          t,
          gestor.id,
          "statusAlterado",
          ref,
          { de: "ativo", para: "cancelado", motivo: c.motivoCancelamento },
          [imovelRef(im.id)],
          [{ campo: "status", de: "ativo", para: "cancelado" }],
        );
        statusEvento(im, final, "disponivel", t + 60_000, c.id, null);
      }
    }
    // pagamentos (só os últimos 60 dias entram no feed)
    for (const p of c.parcelas)
      if (p.pagoEm && Date.parse(p.pagoEm) >= hojeMs - 60 * DIA)
        add(
          Date.parse(p.pagoEm),
          financeiro.id,
          "pagamentoRegistrado",
          ref,
          { numero: p.numero, valor: p.valor },
          [imovelRef(im.id)],
          [{ campo: `parcela.${p.numero}.pagoEm`, de: null, para: p.pagoEm }],
        );
    if (lead) {
      const t = Math.min(cr + 30 * 60_000, limite);
      add(t, lead.responsavelId, "contratoVinculado", { tipo: "lead", id: lead.id }, { numero: num }, [ref]);
    }
  }

  // leads
  const etapasOrdem: Etapa[] = ["novo", "contato", "visita", "proposta", "fechado"];
  for (const d of leadsFinais) {
    const l = d.lead;
    const ref = { tipo: "lead" as const, id: l.id };
    const passos: Etapa[] = [];
    const idxFinal = l.etapa === "perdido" ? r.ponderado([0, 1, 2, 3], [2, 2, 3, 2]) : etapasOrdem.indexOf(l.etapa);
    for (let i = 1; i <= idxFinal; i++) {
      const incluir = r.chance(0.5);
      if (i === idxFinal || incluir) passos.push(etapasOrdem[i]!);
    }
    if (l.etapa === "perdido") passos.push("perdido");
    const criadoMsL = criadoMsLead.get(l.id)!;
    let anterior: Etapa = "novo";
    const total = passos.length;
    passos.forEach((p, k) => {
      const dias = Math.round(d.criadoDias - ((d.criadoDias - d.ultimoDias) * (k + 1)) / total);
      const quando = Math.max(emDias(dias), criadoMsL + (k + 1) * HORA);
      add(
        Math.min(quando, limite),
        l.responsavelId,
        "etapaAlterada",
        ref,
        { de: anterior, para: p, motivo: p === "perdido" ? l.motivoPerda : null },
        [],
        [{ campo: "etapa", de: anterior, para: p }],
      );
      if (p === "proposta") {
        const vistos = vistosDe.get(l.id) ?? [];
        const alvoIm = d.sk?.contrato.imovelId ?? vistos[vistos.length - 1];
        add(
          Math.min(quando + HORA, limite),
          l.responsavelId,
          "propostaEnviada",
          ref,
          { valor: l.orcamento },
          alvoIm ? [imovelRef(alvoIm)] : [],
        );
      }
      anterior = p;
    });
    if (r.chance(0.3)) {
      const dias = r.inteiro(Math.min(d.ultimoDias, d.criadoDias), d.criadoDias);
      add(emDias(dias), l.responsavelId, "nota", ref, { texto: r.escolher(NOTAS_LEAD) });
    }
  }

  // visitas (só as dos últimos 40 dias e as futuras entram no feed)
  const leadPorId = new Map(leadsFinais.map((d) => [d.lead.id, d.lead] as const));
  for (const v of visitas) {
    const t = Date.parse(v.dataHora);
    const lead = leadPorId.get(v.leadId)!;
    const ref = { tipo: "lead" as const, id: v.leadId };
    const rel = [imovelRef(v.imovelId)];
    if (t < hojeMs - 40 * DIA) continue;
    add(
      Math.min(t - r.inteiro(1, 8) * DIA, limite),
      lead.responsavelId,
      "visitaAgendada",
      ref,
      { visitaId: v.id, dataHora: v.dataHora },
      rel,
    );
    if (v.status === "realizada")
      add(Math.min(t + HORA, limite), lead.responsavelId, "visitaRealizada", ref, { visitaId: v.id }, rel);
    if (v.status === "cancelada")
      add(Math.min(t - DIA, limite), lead.responsavelId, "visitaCancelada", ref, { visitaId: v.id }, rel);
  }

  // atividades/alterações com IDs em ordem cronológica
  eventos.sort((a, b) => a.quando - b.quando);
  const atividades: Atividade[] = [];
  const alteracoes: RegistroAlteracao[] = [];
  for (const e of eventos) {
    const em = iso(Math.min(e.quando, limite));
    atividades.push({ id: novoId("atv"), ...e.atividade, criadoEm: em });
    for (const a of e.alteracoes ?? []) alteracoes.push({ id: novoId("alt"), em, autorId: e.atividade.autorId, ...a });
  }

  // ----- entidades finais ------------------------------------------------------------------
  const finais = (id: string, criadoIso: string) => iso(Math.max(Date.parse(criadoIso), tocado.get(id) ?? 0));
  const imoveisFinais: Imovel[] = draftsImoveis.map((d) => {
    const im: Imovel & { criadoDias?: number } = { ...d, criadoEm: "", atualizadoEm: "" };
    delete im.criadoDias;
    const criadoEm = iso(criadoMsImovel.get(im.id)!);
    return { ...im, criadoEm, atualizadoEm: finais(im.id, criadoEm) };
  });
  const ordemPorEtapa = new Map<Etapa, number>();
  const leadsFinaisOrdenados = [...leadsFinais].sort(
    (a, b) => a.ultimoDias - b.ultimoDias || a.lead.id.localeCompare(b.lead.id),
  );
  const leadsSaida: Lead[] = leadsFinais.map((d) => ({ ...d.lead })) as Lead[];
  const ordemDe = new Map<string, number>();
  for (const d of leadsFinaisOrdenados) {
    const n = ordemPorEtapa.get(d.lead.etapa) ?? 0;
    ordemDe.set(d.lead.id, n);
    ordemPorEtapa.set(d.lead.etapa, n + 1);
  }
  const leads: Lead[] = leadsSaida.map((l) => {
    const criadoEm = iso(criadoMsLead.get(l.id)!);
    return {
      ...l,
      criadoEm,
      atualizadoEm: finais(l.id, criadoEm),
      ordem: ordemDe.get(l.id)!,
      imoveisVistos: vistosDe.get(l.id) ?? [],
    };
  });
  const contratos: Contrato[] = esqueletos.map((e) => {
    const lead = leadDeContrato.get(e.contrato.id);
    const criadoEm = iso(criadoMsContrato.get(e.contrato.id)!);
    return {
      ...e.contrato,
      numero: numeros.get(e.contrato.id)!,
      leadId: lead?.id ?? null,
      partes: partesDe(e),
      criadoEm,
      atualizadoEm: finais(e.contrato.id, criadoEm),
    };
  });
  contratos.sort((a, b) => a.id.localeCompare(b.id));

  const base: Base = {
    corretores,
    imoveis: imoveisFinais,
    leads,
    visitas,
    contratos,
    atividades,
    alteracoes,
    seq: contador,
  };

  // ----- casos de borda -------------------------------------------------------------------
  const sem = leads.filter((l) => Object.keys(l.contato).length === 0).map((l) => l.id);
  const casos: CasosDeBorda = {
    corretorNomeLongo: corretores.reduce((a, c) => (c.nome.length > a.nome.length ? c : a)).id,
    leadNomeLongo: leads.find((l) => l.nome === NOME_LONGO_LEAD)!.id,
    leadSemContato: sem[0]!,
    leadsSemContato: sem,
    imovelTituloLongo: imoveisFinais.find((i) => i.titulo.length > 100)!.id,
    imovelTerrenoSemComodos: imoveisFinais[idxTerrenoSemComodos]!.id,
    imoveisSemIlustracao: imoveisFinais.filter((i) => i.fachada === null).map((i) => i.id),
    contratoLocacaoVencido: esqueletos.find((e) => e.especial === "vencido")!.contrato.id,
    contratoTresParcelasAtrasadas: esqueletos.find((e) => e.especial === "tresAtrasadas")!.contrato.id,
    imovelAluguelMinimo: imoveisFinais.find((i) => i.preco === 90_000 && i.finalidade === "locacao")!.id,
    contratoAluguelMinimo: esqueletos.find((e) => e.especial === "minimo")!.contrato.id,
    imovelVendaMaxima: imoveisFinais.find((i) => i.preco === 1_200_000_000)!.id,
    contratoVendaMaxima: esqueletos.find((e) => e.especial === "maximo")!.contrato.id,
    etapaVazia: "contato",
  };
  return { base, casos };
}

/** IDs dos casos de borda da Base padrão (semente 2026). Independem de `hoje`. */
export const CASOS_DE_BORDA: CasosDeBorda = construir({ hoje: HOJE_DOS_CASOS }).casos;
